import { useEffect, useState } from "react";
import { socketDoPortal, usuarioAtual } from "./api.js";

// FILA DE ESPERA ("Jogar agora") — usa a conexão do portal (api.js), UMA por
// aba, que continua viva enquanto a pessoa navega pela v2 (a fila não pode
// morrer ao trocar de página). Fechou a aba: o servidor tira a pessoa da fila.
//
// As telas usam `useFila()` pra ler o estado e `pedirFila()` pra agir.
export const NOMES_FILA = { impostor: "Impostor", tribunal: "Tribunal", acromania: "Acromania" };

let socket = null;
// fila = { filas: { impostor: {...}, tribunal: {...} } } — o nome pode estar em várias.
let estado = { contagem: {}, fila: { filas: {} }, proposta: null, fim: null };
const ouvintes = new Set();

function mudar(parcial) {
  estado = { ...estado, ...parcial };
  for (const f of ouvintes) f(estado);
}

export function ligarFila() {
  if (socket || !usuarioAtual()) return;
  socket = socketDoPortal();
  if (!socket) return;
  // A assinatura vale por conexão: refaz a cada reconexão. A do portal pode
  // já estar conectada (o Topo pediu antes).
  const assinar = () => socket.emit("fila-assinar", {}, () => {});
  socket.on("connect", assinar);
  if (socket.connected) assinar();
  socket.on("fila-contagem", (contagem) => mudar({ contagem }));
  socket.on("fila-estado", (fila) => mudar({ fila }));
  socket.on("fila-proposta", (proposta) => {
    const nova = !estado.proposta || estado.proposta.id !== proposta.id;
    mudar({ proposta: { ...proposta, recebidaEm: Date.now() } });
    if (nova) tocarPartidaEncontrada();
  });
  socket.on("fila-fim", (fim) => mudar({ proposta: null, fim: { ...fim, em: Date.now() } }));
}

export function limparFim() { mudar({ fim: null }); }

export function pedirFila(evento, dados = {}) {
  return new Promise((ok) => {
    if (!socket) return ok({ erro: "Fila indisponível." });
    socket.timeout(8000).emit(evento, dados, (falhou, r) => ok(falhou ? { erro: "O servidor não respondeu." } : r || {}));
  });
}

export function useFila() {
  const [e, setE] = useState(estado);
  useEffect(() => {
    ouvintes.add(setE);
    ligarFila();
    setE(estado);
    return () => ouvintes.delete(setE);
  }, []);
  return e;
}

// ---------------- som de matchmaking ----------------
// O navegador só deixa tocar som depois de um clique na página. Por isso o
// áudio é destravado no clique de "Entrar na fila" — e aí o aviso de
// "Partida encontrada" toca mesmo que a pessoa esteja em outra página.
// Respeita o mudo e o volume do site (mesmas chaves da v2).
let ctx = null;

export function destravarSom() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
  } catch { /* sem áudio: segue sem som */ }
}

export function tocarPartidaEncontrada() {
  try {
    if (localStorage.getItem("eg_v2_mudo") === "1") return;
    const volume = Math.min(1, Math.max(0, parseFloat(localStorage.getItem("eg_v2_volume") ?? "0.7") || 0));
    if (!ctx || volume === 0) return;
    if (ctx.state === "suspended") ctx.resume();
    // Três notas subindo + uma longa: "achou!"
    [[660, 0], [880, 0.12], [1175, 0.24], [1320, 0.38]].forEach(([freq, quando], i) => {
      const osc = ctx.createOscillator();
      const ganho = ctx.createGain();
      const t = ctx.currentTime + quando;
      const dur = i === 3 ? 0.5 : 0.14;
      osc.type = "triangle";
      osc.frequency.value = freq;
      ganho.gain.setValueAtTime(0.0001, t);
      ganho.gain.exponentialRampToValueAtTime(0.25 * volume, t + 0.02);
      ganho.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(ganho).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    });
  } catch { /* sem áudio: segue sem som */ }
}
