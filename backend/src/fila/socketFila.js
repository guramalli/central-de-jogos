import { Filas } from "./filaDeEspera.js";
import { jogosDaFila } from "./jogos.js";
import { anunciarNasSalas as anunciarStop } from "../game/gameManager.js";
import { anunciarNasSalas as anunciarQuiz } from "../game/quizGameManager.js";
import { anunciarNasSalas as anunciarAcromania } from "../game/acromaniaGameManager.js";

// Convite da fila nos chats das salas do Stop, Quiz e Acromania. O texto
// serve pra qualquer tela (o clássico mostra só ele); a v2 usa `fila` pra
// desenhar o botão "Colocar meu nome na fila".
function anunciarFila({ jogo, nome, nickname, naFila, minimo }) {
  const texto = `🎮 ${nickname} colocou o nome na fila do ${nome} (${naFila}/${minimo}). Bora jogar junto?`;
  const extra = { fila: { jogo, nome } };
  anunciarStop(texto, extra);
  anunciarQuiz(texto, extra);
  anunciarAcromania(texto, extra);
}

// FILA DE ESPERA — eventos de socket.
//
// A tela abre UMA conexão da fila por aba (v2/fila.js) e manda
// "fila-assinar". Essa conexão:
//   - entra na sala "fila-observadores" (recebe a contagem pública das filas,
//     que aparece nos cards do Início — só números, sem nomes);
//   - entra na sala "fila:<userId>" (tudo que é da pessoa chega em todas as
//     abas dela: estado da fila, "Partida encontrada!", resultado).
// Quando a ÚLTIMA aba da pessoa fecha, ela sai da fila (e recusa a partida
// que estiver esperando confirmação).
let filas = null;
const abasDoUsuario = new Map(); // userId -> nº de conexões da fila abertas

export function __filasParaTestes() { return filas; }

function obterFilas(io) {
  if (!filas) {
    filas = new Filas({
      jogos: jogosDaFila(io),
      enviar: (userId, evento, dados) => io.to(`fila:${userId}`).emit(evento, dados),
      contagem: (dados) => io.to("fila-observadores").emit("fila-contagem", dados),
      anunciar: anunciarFila,
    });
  }
  return filas;
}

export function registrarFila(io, socket) {
  const user = { id: socket.user.id, nickname: socket.user.nickname };
  const responder = (cb, dados) => { if (typeof cb === "function") cb(dados); };
  let assinou = false;

  socket.on("fila-assinar", (_d, cb) => {
    const f = obterFilas(io);
    if (!assinou) {
      assinou = true;
      socket.join("fila-observadores");
      socket.join(`fila:${user.id}`);
      abasDoUsuario.set(user.id, (abasDoUsuario.get(user.id) || 0) + 1);
    }
    socket.emit("fila-contagem", f.contagens());
    socket.emit("fila-estado", f.estadoDe(user.id));
    const proposta = f.propostaPara(user.id);
    if (proposta) socket.emit("fila-proposta", proposta);
    responder(cb, { ok: true });
  });

  const acao = (fn) => (dados, cb) => {
    if (!assinou) return responder(cb, { erro: "Fila indisponível. Recarregue a página." });
    try {
      const erro = fn(obterFilas(io), dados && typeof dados === "object" ? dados : {});
      responder(cb, erro ? { erro } : { ok: true });
    } catch (err) {
      console.error("Fila: ação falhou:", err);
      responder(cb, { erro: "Algo deu errado. Tente de novo." });
    }
  };

  socket.on("fila-entrar", acao((f, { jogo }) => f.entrar(user, String(jogo || ""))));
  // Com { jogo }: tira o nome dessa fila. Sem: de todas.
  socket.on("fila-sair", acao((f, { jogo }) => f.sair(user.id, jogo ? String(jogo) : null)));
  socket.on("fila-comecar-agora", acao((f, { jogo }) => f.comecarAgora(user.id, String(jogo || ""))));
  socket.on("fila-aceitar", acao((f, { id }) => f.responder(user.id, String(id || ""), true)));
  socket.on("fila-recusar", acao((f, { id }) => f.responder(user.id, String(id || ""), false)));

  socket.on("disconnect", () => {
    if (!assinou) return;
    const restantes = (abasDoUsuario.get(user.id) || 1) - 1;
    if (restantes > 0) { abasDoUsuario.set(user.id, restantes); return; }
    abasDoUsuario.delete(user.id);
    filas?.desconectou(user.id);
  });
}
