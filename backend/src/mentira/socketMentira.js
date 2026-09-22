import { MentiraRoom } from "./MentiraRoom.js";
import { prisma } from "../db.js";
import { concorreAoRanking } from "../utils/rankingElegivel.js";
import { currentMonthKey } from "../utils/monthKey.js";
import { getMentiraRankForPoints, DIVISOR_RANKING } from "../utils/mentiraRank.js";

// MENTIRA SINCERA — eventos de socket. Tudo em memória.
//   - 2 SALAS ABERTAS fixas (lobby): "Sala Livre" (aceita bots pra
//     completar) e "Sala 2" (só gente de verdade). Só modo Curiosidades.
//   - SALA DE AMIGOS: qualquer pessoa logada cria e manda o convite; é lá
//     que o Sobre Vocês fica disponível.
const salas = new Map(); // codigo -> MentiraRoom
const salaDoSocket = new Map(); // socketId -> codigo
// Sala de cada CONTA: quando a conexão cai e o navegador reconecta, o socket
// é outro — sem isto a pessoa ficava fora da sala ("travou"). Com isto, a
// conexão nova é recolocada na sala automaticamente, com os mesmos pontos.
const salaDoUsuario = new Map(); // userId -> codigo

// ---------------- RANKING ----------------
// Patente do mês de uma pessoa (pra mostrar na sala).
async function carregarPatente(sala, userId) {
  try {
    const reg = await prisma.monthlyScore.findUnique({
      where: { userId_gameKey_monthKey: { userId, gameKey: "mentira", monthKey: currentMonthKey() } },
    });
    sala.definirPatente(userId, getMentiraRankForPoints(reg?.points || 0, { userId }));
  } catch (err) { console.error("Mentira: patente:", err.message); }
}

// Fim de partida: cada pessoa leva pro ranking do mês (e pro vitalício) os
// pontos da partida ÷ DIVISOR_RANKING. CONTRA FARM: só conta partida com
// pelo menos 2 pessoas de verdade até o fim — sozinho com bots não rende.
// Visitante e admin ficam de fora (mesma regra dos outros jogos).
async function gravarRanking(sala) {
  const pessoas = [...sala.jogadores.values()].filter((j) => !j.bot);
  if (pessoas.length < 2) return;
  const monthKey = currentMonthKey();
  for (const j of pessoas) {
    const pontos = Math.round(j.pontos / DIVISOR_RANKING);
    if (pontos <= 0) continue;
    try {
      if (!(await concorreAoRanking(j.id))) continue;
      const mensal = await prisma.monthlyScore.upsert({
        where: { userId_gameKey_monthKey: { userId: j.id, gameKey: "mentira", monthKey } },
        update: { points: { increment: pontos } },
        create: { userId: j.id, gameKey: "mentira", monthKey, points: pontos },
      });
      await prisma.lifetimeScore.upsert({
        where: { userId_gameKey: { userId: j.id, gameKey: "mentira" } },
        update: { points: { increment: pontos } },
        create: { userId: j.id, gameKey: "mentira", points: pontos },
      });
      sala.ganhoRanking.set(j.id, pontos);
      sala.definirPatente(j.id, getMentiraRankForPoints(mensal.points, { userId: j.id }));
    } catch (err) { console.error("Mentira: falha ao gravar ranking de", j.id, err.message); }
  }
  sala.transmitir();
}

function prepararSala(sala) {
  sala.aoFimDePartida = (s) => { gravarRanking(s).catch(() => {}); };
  return sala;
}

// Salas abertas (sempre existem; quando esvaziam, voltam pra espera).
export const SALAS_ABERTAS = [
  { codigo: "livre", nome: "Sala Livre", descricao: "Curiosidades absurdas pra qualquer um. Dá pra chamar bots pra completar.", permiteBots: true },
  { codigo: "sala2", nome: "Sala 2", descricao: "Mesma partida, só com gente de verdade — boa pra live.", permiteBots: false },
];
let ioGlobal = null;
function salaAberta(cfg) {
  if (!salas.has(cfg.codigo)) {
    const sala = new MentiraRoom(cfg.codigo, null, (uid, estado) => {
      const j = sala.jogadores.get(uid);
      for (const sid of j?.sockets || []) ioGlobal?.to(sid).emit("mentira-estado", estado);
    }, undefined, { publica: true, permiteBots: cfg.permiteBots, nome: cfg.nome, modo: "curiosidades" });
    salas.set(cfg.codigo, prepararSala(sala));
  }
  return salas.get(cfg.codigo);
}

// Lobby: salas abertas com quantas pessoas estão em cada uma.
export function statusSalasAbertas() {
  return SALAS_ABERTAS.map((cfg) => {
    const sala = salas.get(cfg.codigo);
    return {
      codigo: cfg.codigo, nome: cfg.nome, descricao: cfg.descricao, permiteBots: cfg.permiteBots,
      jogando: sala ? sala.humanos().length : 0,
      emPartida: sala ? !["aguardando", "fim"].includes(sala.fase) : false,
    };
  });
}

function novoCodigo() {
  for (let i = 0; i < 50; i++) {
    const c = String(Math.floor(1000 + Math.random() * 9000));
    if (!salas.has(c)) return c;
  }
  return String(Date.now()).slice(-6);
}

export function registrarMentira(io, socket) {
  ioGlobal = io;
  const user = { id: socket.user.id, nickname: socket.user.nickname };
  const responder = (cb, dados) => { if (typeof cb === "function") cb(dados); };

  function sairDaSala() {
    const codigo = salaDoSocket.get(socket.id);
    if (!codigo) return;
    salaDoSocket.delete(socket.id);
    const sala = salas.get(codigo);
    if (!sala) return;
    sala.sair(socket.id);
    // Sala vazia some depois de 2 minutos (dá tempo de alguém voltar).
    if (sala.vazia()) setTimeout(() => {
      if (salas.get(codigo) !== sala || !sala.vazia()) return;
      if (sala.publica) sala.reiniciarVazia(); // aberta: fica, pronta pra próxima turma
      else { sala.parar(); salas.delete(codigo); }
    }, 120000);
  }

  function entrarNaSala(sala) {
    if (salaDoSocket.get(socket.id) !== sala.codigo) sairDaSala();
    salaDoSocket.set(socket.id, sala.codigo);
    salaDoUsuario.set(user.id, sala.codigo);
    sala.entrar(user, socket.id);
    if (!sala.patentes.has(user.id)) carregarPatente(sala, user.id);
  }

  socket.on("mentira-criar", async (_d, cb) => {
    try {
      const minhas = [...salas.values()].filter((sl) => !sl.publica && sl.donoId === user.id && !sl.vazia());
      if (minhas.length) { entrarNaSala(minhas[0]); return responder(cb, { codigo: minhas[0].codigo }); } // já tem uma aberta
      if ([...salas.values()].filter((sl) => !sl.publica).length >= 200) return responder(cb, { erro: "Muitas salas abertas agora. Tente de novo em instantes." });
      const codigo = novoCodigo();
      const sala = new MentiraRoom(codigo, user, (uid, estado) => {
        const j = sala.jogadores.get(uid);
        for (const sid of j?.sockets || []) io.to(sid).emit("mentira-estado", estado);
      }, undefined, { modo: "sobre" });
      prepararSala(sala);
      salas.set(codigo, sala);
      entrarNaSala(sala);
      responder(cb, { codigo });
    } catch (err) {
      console.error("Mentira: criar falhou:", err.message);
      responder(cb, { erro: "Não foi possível criar a sala." });
    }
  });

  socket.on("mentira-entrar", ({ codigo } = {}, cb) => {
    const cod = String(codigo || "").trim();
    const aberta = SALAS_ABERTAS.find((c) => c.codigo === cod);
    const sala = aberta ? salaAberta(aberta) : salas.get(cod);
    if (!sala) return responder(cb, { erro: "Sala não encontrada. Confira o código." });
    if (!sala.jogadores.has(user.id) && sala.jogadores.size >= 8) return responder(cb, { erro: "A sala está cheia (8 jogadores)." });
    entrarNaSala(sala);
    responder(cb, { codigo: sala.codigo });
  });

  const naSala = (fn) => (dados, cb) => {
    let sala = salas.get(salaDoSocket.get(socket.id));
    // Conexão nova depois de uma queda: volta pra sala onde a conta estava.
    if (!sala) {
      const daConta = salas.get(salaDoUsuario.get(user.id));
      if (daConta && daConta.jogadores.has(user.id)) { entrarNaSala(daConta); sala = daConta; }
    }
    if (!sala) return responder(cb, { erro: "Você não está numa sala." });
    const erro = fn(sala, dados || {});
    responder(cb, erro ? { erro } : { ok: true });
  };

  socket.on("mentira-comecar", naSala((sala) => sala.comecar(user.id)));
  socket.on("mentira-mentir", naSala((sala, { texto }) => sala.mentir(user.id, texto)));
  socket.on("mentira-escolher", naSala((sala, { opcaoId, pergunta }) => sala.escolher(user.id, opcaoId, pergunta)));
  socket.on("mentira-curtir", naSala((sala, { opcaoId }) => sala.curtir(user.id, opcaoId)));
  socket.on("mentira-modo", naSala((sala, { modo }) => sala.definirModo(user.id, modo)));
  socket.on("mentira-chat", naSala((sala, { texto }) => sala.mensagemChat(user.id, texto)));
  socket.on("mentira-reagir", naSala((sala, { emoji }) => sala.reagir(user.id, emoji)));
  socket.on("mentira-confessar", naSala((sala, { texto, indice }) => sala.confessar(user.id, texto, indice)));
  socket.on("mentira-pular", naSala((sala) => sala.pular(user.id)));
  socket.on("mentira-bot", naSala((sala, { acao }) => (acao === "remover" ? sala.removerBots(user.id) : sala.adicionarBot(user.id))));
  // Sair DE PROPÓSITO (botão "Sair"): esquece a sala da conta também.
  socket.on("mentira-sair", (_d, cb) => { sairDaSala(); salaDoUsuario.delete(user.id); responder(cb, { ok: true }); });
  socket.on("disconnect", sairDaSala);
}
