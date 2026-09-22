import { TribunalRoom } from "./TribunalRoom.js";

// O TRIBUNAL — eventos de socket (tudo em memória). Mesmo modelo do Mentira
// Sincera: 2 salas abertas fixas ("livre" aceita bots; "sala2" só gente) e
// sala com amigos criada por convite. EM TESTE: sem link no site.
//
// Ranking/patentes: fora da primeira versão (entram depois de medir o
// ritmo real de uma partida — a régua é tempo).
const salas = new Map();          // codigo -> TribunalRoom
const salaDoSocket = new Map();   // socketId -> codigo
const salaDoUsuario = new Map();  // userId -> codigo (volta sozinho depois de queda)

export const SALAS_ABERTAS = [
  { codigo: "livre", nome: "Sala Livre", descricao: "Aberta pra qualquer um. Dá pra chamar bots pra completar.", permiteBots: true },
  { codigo: "sala2", nome: "Sala 2", descricao: "Mesma sessão, só com gente de verdade — boa pra live.", permiteBots: false },
];

let ioGlobal = null;
const emissor = (sala) => (uid, estado) => {
  const j = sala.jogadores.get(uid);
  for (const sid of j?.sockets || []) ioGlobal?.to(sid).emit("tribunal-estado", estado);
};

function salaAberta(cfg) {
  if (!salas.has(cfg.codigo)) {
    const sala = new TribunalRoom(cfg.codigo, null, () => {}, undefined, { publica: true, permiteBots: cfg.permiteBots, nome: cfg.nome });
    sala.enviar = emissor(sala);
    salas.set(cfg.codigo, sala);
  }
  return salas.get(cfg.codigo);
}

export function statusSalasAbertasTribunal() {
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

export function registrarTribunal(io, socket) {
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
    if (sala.vazia()) setTimeout(() => {
      if (salas.get(codigo) !== sala || !sala.vazia()) return;
      if (sala.publica) sala.reiniciarVazia();
      else { sala.parar(); salas.delete(codigo); }
    }, 120000);
  }

  function entrarNaSala(sala) {
    if (salaDoSocket.get(socket.id) !== sala.codigo) sairDaSala();
    const erro = sala.entrar(user, socket.id);
    if (erro) return erro;
    salaDoSocket.set(socket.id, sala.codigo);
    salaDoUsuario.set(user.id, sala.codigo);
    return null;
  }

  socket.on("tribunal-criar", (_d, cb) => {
    try {
      const minha = [...salas.values()].find((sl) => !sl.publica && sl.donoId === user.id && !sl.vazia());
      if (minha) { entrarNaSala(minha); return responder(cb, { codigo: minha.codigo }); }
      if ([...salas.values()].filter((sl) => !sl.publica).length >= 200) return responder(cb, { erro: "Muitas salas abertas agora. Tente de novo em instantes." });
      const codigo = novoCodigo();
      const sala = new TribunalRoom(codigo, user, () => {});
      sala.enviar = emissor(sala);
      salas.set(codigo, sala);
      entrarNaSala(sala);
      responder(cb, { codigo });
    } catch (err) {
      console.error("Tribunal: criar falhou:", err.message);
      responder(cb, { erro: "Não foi possível criar a sala." });
    }
  });

  socket.on("tribunal-entrar", ({ codigo } = {}, cb) => {
    const cod = String(codigo || "").trim();
    const aberta = SALAS_ABERTAS.find((c) => c.codigo === cod);
    const sala = aberta ? salaAberta(aberta) : salas.get(cod);
    if (!sala) return responder(cb, { erro: "Sala não encontrada. Confira o código." });
    const erro = entrarNaSala(sala);
    responder(cb, erro ? { erro } : { codigo: sala.codigo });
  });

  const naSala = (fn) => (dados, cb) => {
    let sala = salas.get(salaDoSocket.get(socket.id));
    if (!sala) { // conexão nova depois de uma queda: volta pra sala da conta
      const daConta = salas.get(salaDoUsuario.get(user.id));
      if (daConta && daConta.jogadores.has(user.id)) { entrarNaSala(daConta); sala = daConta; }
    }
    if (!sala) return responder(cb, { erro: "Você não está numa sala." });
    const erro = fn(sala, dados || {});
    responder(cb, erro ? { erro } : { ok: true });
  };

  socket.on("tribunal-comecar", naSala((sala) => sala.comecar(user.id)));
  socket.on("tribunal-escrever", naSala((sala, { texto }) => sala.escrever(user.id, texto)));
  socket.on("tribunal-votar", naSala((sala, { voto }) => sala.votar(user.id, voto)));
  socket.on("tribunal-deliberar", naSala((sala, { escolha }) => sala.deliberar(user.id, escolha)));
  socket.on("tribunal-modo-papeis", naSala((sala, { modo }) => sala.definirModoPapeis(user.id, modo)));
  socket.on("tribunal-escolher-papeis", naSala((sala, { escolha }) => sala.escolherPapeis(user.id, escolha)));
  socket.on("tribunal-curtir", naSala((sala, { chave }) => sala.curtir(user.id, chave)));
  socket.on("tribunal-chat", naSala((sala, { texto }) => sala.mensagemChat(user.id, texto)));
  socket.on("tribunal-reagir", naSala((sala, { emoji }) => sala.reagir(user.id, emoji)));
  socket.on("tribunal-bot", naSala((sala, { acao }) => (acao === "remover" ? sala.removerBots(user.id) : sala.adicionarBot(user.id))));
  socket.on("tribunal-sair", (_d, cb) => { sairDaSala(); salaDoUsuario.delete(user.id); responder(cb, { ok: true }); });
  socket.on("disconnect", sairDaSala);
}

export { salas as __salasTribunal };
