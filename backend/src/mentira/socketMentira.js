import { prisma } from "../db.js";
import { MentiraRoom } from "./MentiraRoom.js";

// MENTIRA SINCERA — eventos de socket (em teste: só ADMIN cria sala;
// quem tiver o código/link entra). Tudo em memória.
const salas = new Map(); // codigo -> MentiraRoom
const salaDoSocket = new Map(); // socketId -> codigo

function novoCodigo() {
  for (let i = 0; i < 50; i++) {
    const c = String(Math.floor(1000 + Math.random() * 9000));
    if (!salas.has(c)) return c;
  }
  return String(Date.now()).slice(-6);
}

export function registrarMentira(io, socket) {
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
    if (sala.vazia()) setTimeout(() => { if (salas.get(codigo) === sala && sala.vazia()) { sala.parar(); salas.delete(codigo); } }, 120000);
  }

  function entrarNaSala(sala) {
    sairDaSala();
    salaDoSocket.set(socket.id, sala.codigo);
    sala.entrar(user, socket.id);
  }

  socket.on("mentira-criar", async (_d, cb) => {
    try {
      const quem = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
      if (quem?.role !== "ADMIN") return responder(cb, { erro: "O Mentira Sincera ainda está em teste." });
      const codigo = novoCodigo();
      const sala = new MentiraRoom(codigo, user, (uid, estado) => {
        const j = sala.jogadores.get(uid);
        for (const sid of j?.sockets || []) io.to(sid).emit("mentira-estado", estado);
      });
      salas.set(codigo, sala);
      entrarNaSala(sala);
      responder(cb, { codigo });
    } catch (err) {
      console.error("Mentira: criar falhou:", err.message);
      responder(cb, { erro: "Não foi possível criar a sala." });
    }
  });

  socket.on("mentira-entrar", ({ codigo } = {}, cb) => {
    const sala = salas.get(String(codigo || "").trim());
    if (!sala) return responder(cb, { erro: "Sala não encontrada. Confira o código." });
    if (!sala.jogadores.has(user.id) && sala.jogadores.size >= 8) return responder(cb, { erro: "A sala está cheia (8 jogadores)." });
    entrarNaSala(sala);
    responder(cb, { codigo: sala.codigo });
  });

  const naSala = (fn) => (dados, cb) => {
    const sala = salas.get(salaDoSocket.get(socket.id));
    if (!sala) return responder(cb, { erro: "Você não está numa sala." });
    const erro = fn(sala, dados || {});
    responder(cb, erro ? { erro } : { ok: true });
  };

  socket.on("mentira-comecar", naSala((sala) => sala.comecar(user.id)));
  socket.on("mentira-mentir", naSala((sala, { texto }) => sala.mentir(user.id, texto)));
  socket.on("mentira-escolher", naSala((sala, { opcaoId }) => sala.escolher(user.id, opcaoId)));
  socket.on("mentira-pular", naSala((sala) => sala.pular(user.id)));
  socket.on("mentira-sair", (_d, cb) => { sairDaSala(); responder(cb, { ok: true }); });
  socket.on("disconnect", sairDaSala);
}
