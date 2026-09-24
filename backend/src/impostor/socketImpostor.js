import { ImpostorRoom, CONFIG } from "./ImpostorRoom.js";
import { sortearPalavra as sortearDoBanco, palavrasDoTema } from "./palavras.js";
import { prisma } from "../db.js";
import { concorreAoRanking } from "../utils/rankingElegivel.js";
import { currentMonthKey } from "../utils/monthKey.js";
import { podeFalar } from "../utils/antiFlood.js";

// O IMPOSTOR — eventos de socket. Tudo em memória; o banco só entra no
// sorteio da palavra e na gravação do fim da partida.
//
// Mesmo modelo do Tribunal/Mentira: sala criada por CÓDIGO ("KX7-42"),
// respostas por callback ({ ok } ou { erro }), e a conta volta sozinha pra
// sala depois de uma queda de conexão.
//
// REGRA DE OURO: nada aqui faz broadcast pra sala. Todo pacote sai pelo
// `emissor`, que manda pra cada socket da pessoa, um por um.
export const GAME_KEY = "impostor";
const MAX_SALAS = 200;
const DESCARTE_SALA_VAZIA_MS = 2 * 60 * 1000;

const salas = new Map();          // codigo -> ImpostorRoom
const salaDoSocket = new Map();   // socketId -> codigo
const salaDoUsuario = new Map();  // userId -> codigo (volta depois de queda)

let ioGlobal = null;

// Trocáveis nos testes (sem banco).
const deps = {
  sortearPalavra: sortearDoBanco,
  gravarResultado: gravarResultadoNoBanco,
  palavrasDoTema,
  config: {}, // sobrescreve CONFIG nas salas novas (testes: pausas curtas)
};
export function __configurarImpostorParaTestes(novas) { Object.assign(deps, novas); }
export function __resetImpostorParaTestes() {
  for (const sala of salas.values()) sala.parar();
  salas.clear(); salaDoSocket.clear(); salaDoUsuario.clear();
  deps.sortearPalavra = sortearDoBanco;
  deps.gravarResultado = gravarResultadoNoBanco;
  deps.palavrasDoTema = palavrasDoTema;
  deps.config = {};
}

// ---------------- ranking / histórico ----------------
// Grava a partida (inclusive cancelada, pro histórico) e soma os pontos no
// ranking do mês e no vitalício. Visitante e admin não pontuam no ranking
// (mesma regra dos outros jogos), mas o que fizeram fica na partida.
//
// FASE DE TESTES: CONFIG.VALE_RANKING = false — a partida é gravada, mas os
// pontos NÃO vão pro ranking. Sala com bot nunca vai (seria ponto fácil).
//
// MODO DE JOGO: a tabela não tem coluna de modo (e o schema não muda), então
// ele vai no `tema`. Modo Palavra grava o tema do banco como sempre
// ("Lugares", "Comidas"...); os outros gravam "Modo Situação", "Modo
// História" e "Modo Pergunta | impostor: <pergunta do impostor>" — os temas
// do banco nunca começam com "Modo ". A coluna `palavra` guarda o segredo:
// a situação, o tema da história ou a pergunta da maioria.
const NOME_DO_MODO = { situacao: "Situação", historia: "História", pergunta: "Pergunta" };
export function temaParaGravar(r) {
  if (!r.modo || r.modo === "palavra") return r.tema;
  const base = `Modo ${NOME_DO_MODO[r.modo] || r.modo}`;
  return r.modo === "pergunta" && r.perguntaImpostor ? `${base} | impostor: ${r.perguntaImpostor}` : base;
}

async function gravarResultadoNoBanco(r) {
  try {
    await prisma.impostorPartida.create({
      data: {
        sala: r.sala,
        impostorId: r.impostorId,
        acusadoId: r.acusadoId,
        tema: temaParaGravar(r),
        palavra: r.palavra,
        vencedor: r.vencedor,
        motivo: r.motivo,
        pontuacao: r.pontos,
      },
    });
  } catch (err) {
    console.error("Impostor: falha ao gravar a partida:", err.message);
  }
  if (r.vencedor === "cancelada" || r.comBots || !CONFIG.VALE_RANKING) return;

  const monthKey = currentMonthKey();
  for (const [userId, pontos] of Object.entries(r.pontos)) {
    if (pontos <= 0) continue;
    try {
      if (!(await concorreAoRanking(userId))) continue;
      await prisma.monthlyScore.upsert({
        where: { userId_gameKey_monthKey: { userId, gameKey: GAME_KEY, monthKey } },
        update: { points: { increment: pontos } },
        create: { userId, gameKey: GAME_KEY, monthKey, points: pontos },
      });
      await prisma.lifetimeScore.upsert({
        where: { userId_gameKey: { userId, gameKey: GAME_KEY } },
        update: { points: { increment: pontos } },
        create: { userId, gameKey: GAME_KEY, points: pontos },
      });
    } catch (err) {
      console.error("Impostor: falha ao gravar ranking de", userId, err.message);
    }
  }
}

// ---------------- salas ----------------
const emissor = (sala) => (userId, evento, dados) => {
  const j = sala.jogadores.get(userId);
  for (const sid of j?.sockets || []) ioGlobal?.to(sid).emit(evento, dados);
};

function novaSala(codigo) {
  const sala = new ImpostorRoom({
    codigo,
    enviar: () => {},
    sortearPalavra: (s) => deps.sortearPalavra(s),
    aoFimDePartida: (r) => { Promise.resolve(deps.gravarResultado(r)).catch(() => {}); },
    palavrasDoTema: (tema) => deps.palavrasDoTema(tema),
    config: deps.config,
  });
  sala.enviar = emissor(sala);
  salas.set(codigo, sala);
  return sala;
}

// "KX7-42": 3 letras/números + 2 dígitos. Sem 0/O/1/I/L pra ninguém errar
// ao ditar o código.
const LETRAS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function novoCodigo() {
  for (let i = 0; i < 100; i++) {
    let c = "";
    for (let k = 0; k < 3; k++) c += LETRAS[Math.floor(Math.random() * LETRAS.length)];
    c += "-" + String(Math.floor(Math.random() * 100)).padStart(2, "0");
    if (!salas.has(c)) return c;
  }
  return null;
}

// Aceita "kx742", "KX7 42", "kx7-42"...
export function normalizarCodigo(codigo) {
  const c = String(codigo || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return c.length === 5 ? `${c.slice(0, 3)}-${c.slice(3)}` : c;
}

// ---------------- sala da FILA DE ESPERA ----------------
// A fila (src/fila/) cria a sala pro grupo que aceitou a partida. O primeiro
// a chegar vira anfitrião, e a partida começa sozinha quando todos chegam
// (ou depois de ESPERA_GRUPO_MS, com quem veio).
const ESPERA_GRUPO_MS = 20 * 1000;

export function criarSalaDeGrupo({ membros, comBots }) {
  const codigo = novoCodigo();
  if (!codigo) throw new Error("sem código livre");
  const sala = novaSala(codigo);
  sala.grupo = { esperados: new Set(membros.map((m) => m.id)), comBots, iniciou: false };
  sala.grupo.timer = setTimeout(() => iniciarGrupo(sala), ESPERA_GRUPO_MS);
  sala.grupo.timer.unref?.();
  return { pagina: "impostor", mesa: codigo };
}

// Chamado a cada entrada: todo mundo do grupo chegou? Começa.
export function conferirInicioDoGrupo(sala) {
  const g = sala.grupo;
  if (!g || g.iniciou) return;
  const chegaram = [...g.esperados].filter((id) => sala.jogadores.get(id)?.sockets.size > 0);
  if (chegaram.length === g.esperados.size) iniciarGrupo(sala);
}

function iniciarGrupo(sala) {
  const g = sala.grupo;
  if (!g || g.iniciou) return;
  g.iniciou = true;
  clearTimeout(g.timer);
  if (sala.vazia()) { // ninguém veio: descarta a sala
    sala.parar();
    if (salas.get(sala.codigo) === sala) salas.delete(sala.codigo);
    return;
  }
  const anfitriao = sala.anfitriaoId;
  // Bots só se o grupo escolheu ("Começar agora com bots").
  if (g.comBots) {
    while (sala.conectados().length < sala.cfg.MIN_JOGADORES && sala.adicionarBot(anfitriao) === null) { /* completa */ }
  }
  // Faltou gente (alguém aceitou e não veio): a sala fica na espera, como
  // uma sala normal — o anfitrião pode chamar bots ou esperar.
  if (sala.conectados().length < sala.cfg.MIN_JOGADORES) return;
  Promise.resolve(sala.iniciar(anfitriao)).catch((err) => console.error("Impostor: início do grupo falhou:", err));
}

export function getOnlinePlayersDetailedImpostor() {
  const lista = [];
  for (const [codigo, sala] of salas.entries()) {
    for (const j of sala.conectados()) lista.push({ userId: j.id, nickname: j.nickname, roomId: codigo, roomLabel: codigo });
  }
  return lista;
}

export function registrarImpostor(io, socket) {
  ioGlobal = io;
  const user = { id: socket.user.id, nickname: socket.user.nickname };
  const responder = (cb, dados) => { if (typeof cb === "function") cb(dados); };

  function sairDaSala({ deVez = false } = {}) {
    // "Sair" de uma conexão nova (depois de queda) também tira a conta da sala.
    const codigo = salaDoSocket.get(socket.id) || (deVez ? salaDoUsuario.get(user.id) : null);
    if (!codigo) return;
    salaDoSocket.delete(socket.id);
    socket.currentImpostorSala = null;
    const sala = salas.get(codigo);
    if (!sala) return;
    if (deVez) sala.sairDeVez(user.id);
    else sala.sair(socket.id);
    if (sala.vazia()) {
      setTimeout(() => {
        if (salas.get(codigo) !== sala || !sala.vazia()) return;
        sala.parar();
        salas.delete(codigo);
      }, DESCARTE_SALA_VAZIA_MS).unref?.();
    }
  }

  function entrarNaSala(sala) {
    if (salaDoSocket.get(socket.id) && salaDoSocket.get(socket.id) !== sala.codigo) sairDaSala();
    const erro = sala.entrar(user, socket.id);
    if (erro) return erro;
    salaDoSocket.set(socket.id, sala.codigo);
    salaDoUsuario.set(user.id, sala.codigo);
    socket.currentImpostorSala = sala;
    conferirInicioDoGrupo(sala);
    return null;
  }

  socket.on("impostor-criar", (_d, cb) => {
    try {
      if (salas.size >= MAX_SALAS) return responder(cb, { erro: "Muitas salas abertas agora. Tente de novo em instantes." });
      const codigo = novoCodigo();
      if (!codigo) return responder(cb, { erro: "Não foi possível criar a sala." });
      const sala = novaSala(codigo);
      const erro = entrarNaSala(sala);
      responder(cb, erro ? { erro } : { codigo });
    } catch (err) {
      console.error("Impostor: criar falhou:", err.message);
      responder(cb, { erro: "Não foi possível criar a sala." });
    }
  });

  socket.on("impostor-entrar", ({ codigo } = {}, cb) => {
    try {
      const sala = salas.get(normalizarCodigo(codigo));
      if (!sala) return responder(cb, { erro: "Sala não encontrada. Confira o código." });
      const erro = entrarNaSala(sala);
      responder(cb, erro ? { erro } : { codigo: sala.codigo });
    } catch (err) {
      console.error("Impostor: entrar falhou:", err.message);
      responder(cb, { erro: "Não foi possível entrar na sala." });
    }
  });

  // Ação dentro da sala. Se a conexão é nova (depois de uma queda), recoloca
  // a pessoa na sala da conta antes de executar.
  const naSala = (fn) => async (dados, cb) => {
    try {
      let sala = salas.get(salaDoSocket.get(socket.id));
      if (!sala) {
        const daConta = salas.get(salaDoUsuario.get(user.id));
        if (daConta && daConta.jogadores.has(user.id) && !entrarNaSala(daConta)) sala = daConta;
      }
      if (!sala) return responder(cb, { erro: "Você não está numa sala." });
      const erro = await fn(sala, dados && typeof dados === "object" ? dados : {});
      responder(cb, erro ? { erro } : { ok: true });
    } catch (err) {
      console.error("Impostor: ação falhou:", err);
      responder(cb, { erro: "Algo deu errado. Tente de novo." });
    }
  };

  // Modo de jogo (ver o PROTOCOLO no topo do ImpostorRoom.js).
  socket.on("impostor-modo", naSala((sala, { modo }) => sala.definirModo(user.id, modo)));
  socket.on("impostor-iniciar", naSala((sala, { modo }) => sala.iniciar(user.id, modo)));
  socket.on("impostor-carta-vista", naSala((sala) => sala.cartaVista(user.id)));
  socket.on("impostor-dica", naSala((sala, { texto }) => sala.darDica(user.id, texto)));
  socket.on("impostor-resposta", naSala((sala, { texto }) => sala.responder(user.id, texto)));
  socket.on("impostor-votar", naSala((sala, { alvoId }) => sala.votar(user.id, String(alvoId || ""))));
  // Palavra: { palavra } digitada. Situação/História: { opcao } = índice da opção.
  socket.on("impostor-chute", naSala((sala, { palavra, opcao }) =>
    sala.chutar(user.id, Number.isInteger(opcao) ? opcao : palavra)));
  socket.on("impostor-proxima", naSala((sala) => sala.proxima(user.id)));

  // CHAT DA SALA. Duas travas, como nos outros chats: o anti-flood por CONTA
  // (utils/antiFlood.js — o mesmo do "chat-message" em socket/index.js, com
  // admin/moderador fora) e o intervalo mínimo da própria sala
  // (mensagemChat). A mensagem sai pelo `enviar` da sala, por socket.
  async function ehEquipe() {
    if (socket.ehEquipe === undefined) {
      try {
        const q = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
        socket.ehEquipe = q?.role === "ADMIN" || q?.role === "MODERATOR";
      } catch { socket.ehEquipe = false; }
    }
    return socket.ehEquipe;
  }
  socket.on("impostor-chat", naSala(async (sala, { texto }) => {
    const t = typeof texto === "string" ? texto.trim().slice(0, sala.cfg.MAX_MSG_CHAT) : "";
    if (!t) return null;
    if (!sala.jogadores.has(user.id)) return "Você não está nesta sala.";
    const r = podeFalar(user.id, t);
    if (!r.ok && !(await ehEquipe())) return r.mensagem;
    return sala.mensagemChat(user.id, t);
  }));
  // Bots de teste (só o anfitrião, só no lobby — a sala confere).
  socket.on("impostor-bot", naSala((sala, { acao }) => (acao === "remover" ? sala.removerBots(user.id) : sala.adicionarBot(user.id))));
  socket.on("impostor-sair", (_d, cb) => {
    sairDaSala({ deVez: true });
    salaDoUsuario.delete(user.id);
    responder(cb, { ok: true });
  });
  socket.on("disconnect", () => sairDaSala());
}

export { salas as __salasImpostor };
