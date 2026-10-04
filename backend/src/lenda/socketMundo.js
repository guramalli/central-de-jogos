// ===== Lenda do Campinho — MUNDO COMPARTILHADO ("MMO leve", etapa 1) =====
//
// Cada um continua jogando o próprio jogo no navegador. Aqui o servidor só conta para quem está
// no MESMO mapa onde estão os outros (e com que cara), e repassa emotes e frases PRONTAS:
//   - cada mapa tem "canais" de até MAX_POR_CANAL jogadores (o canal com amigo é o preferido);
//   - as posições chegam de cada um e saem juntas, num "retrato" do canal TICK_MS em TICK_MS;
//   - sem texto livre: a conversa são EMOTES e FRASES fixos (o índice; o texto mora no jogo).
// Tudo em memória, nada no banco. Limite de mensagens por segundo e de tamanho.
//
// Eventos (prefixo "mundo-"; os que pedem resposta usam callback { ok } / { erro }):
//   entrar {mapa, perfil, x, y} → {ok, canal, membros}  · sair · eu {x, y, f, m, fa, v} · perfil {perfil}   (v: 0 frente, 1 costas, 2 lado)
//   emote {i} · frase {i}
// O servidor manda: mundo-chegou {membro} · mundo-saiu {id} · mundo-pos [[id, x, y, f, m, fa, v], ...]
//   mundo-perfil {membro} · mundo-emote {de, i} · mundo-frase {de, i}
import { amigosDe } from "./torcida.js";
import { prisma } from "../db.js";
import { limpaPerfil } from "./socketTorre.js";

export const MAX_POR_CANAL = 25;
export const EMOTES = 8;
export const FRASES = 16;
const MAX_JOGADORES = 5000;
const TICK_MS = 150;
const LIMITE_POR_SEG = 15;            // posições por segundo, por conexão (o jogo manda ~7)
const FALA_CADA_MS = 1200;            // emote/frase: no máximo um a cada 1,2 s
const AMIGOS_CACHE_MS = 5 * 60 * 1000;

const canais = new Map();             // "mapa#n" -> { chave, mapa, n, membros: Map(id -> membro), mudou: Set(id) }
const ondeEsta = new Map();           // userId -> chave do canal
const amigosCache = new Map();        // userId -> { ate, lista }
let tick = null;

const deps = { amigosDe: (id) => amigosDe(prisma, id) };
export function __configurarMundoParaTestes(n) { Object.assign(deps, n); }
export function __resetMundoParaTestes() {
  canais.clear(); ondeEsta.clear(); amigosCache.clear();
  if (tick) { clearInterval(tick); tick = null; }
  deps.amigosDe = (id) => amigosDe(prisma, id);
}
export const __canaisMundo = canais;

export const mapaValido = (m) => typeof m === "string" && /^[a-z0-9_]{1,40}$/.test(m);
const num = (v, a, b) => { const n = Number(v); return Number.isFinite(n) ? Math.max(a, Math.min(b, n)) : a; };
const quarto = (chave) => `mundo:${chave}`;
export function limpaPos(d) {
  return { x: +num(d?.x, 0, 1000).toFixed(2), y: +num(d?.y, 0, 1000).toFixed(2), f: d?.f ? 1 : 0, m: d?.m ? 1 : 0, fa: +num(d?.fa, 0, 1e6).toFixed(2), v: [0, 1, 2].includes(d?.v) ? d.v : 0 };
}
const publico = (mb) => ({ id: mb.id, apelido: mb.apelido, nivel: mb.nivel, look: mb.look, x: mb.x, y: mb.y, f: mb.f, m: mb.m, fa: mb.fa, v: mb.v });

async function amigosCom(id) {
  const c = amigosCache.get(id), agora = Date.now();
  if (c && c.ate > agora) return c.lista;
  let lista = [];
  try { lista = await deps.amigosDe(id); } catch { lista = c?.lista || []; }
  amigosCache.set(id, { ate: agora + AMIGOS_CACHE_MS, lista });
  return lista;
}
// o canal do mapa onde a pessoa vai entrar: o que tem amigo (se couber); senão o mais cheio que ainda cabe
export function escolheCanal(mapa, amigos) {
  const doMapa = [...canais.values()].filter((c) => c.mapa === mapa && c.membros.size < MAX_POR_CANAL);
  const comAmigo = doMapa.filter((c) => amigos.some((a) => c.membros.has(a))).sort((a, b) => b.membros.size - a.membros.size)[0];
  if (comAmigo) return comAmigo;
  const cheio = doMapa.sort((a, b) => b.membros.size - a.membros.size)[0];
  if (cheio) return cheio;
  let n = 1; while (canais.has(`${mapa}#${n}`)) n++;
  const c = { chave: `${mapa}#${n}`, mapa, n, membros: new Map(), mudou: new Set() };
  canais.set(c.chave, c);
  return c;
}

function ligaTick(io) {
  if (tick) return;
  tick = setInterval(() => {
    for (const c of canais.values()) {
      if (!c.mudou.size) continue;
      const pos = [];
      for (const id of c.mudou) { const mb = c.membros.get(id); if (mb) pos.push([id, mb.x, mb.y, mb.f, mb.m, mb.fa, mb.v]); }
      c.mudou.clear();
      if (pos.length) io.to(quarto(c.chave)).volatile.emit("mundo-pos", pos);
    }
    if (!canais.size) { clearInterval(tick); tick = null; }
  }, TICK_MS);
  tick.unref?.();
}

export function registrarMundo(io, socket) {
  const eu = socket.user?.id; if (!eu) return;
  const apelido = socket.user.nickname;
  let janela = 0, conta = 0, ultimaFala = 0, entrando = 0;
  const podeMandar = () => { const t = Date.now(); if (t - janela > 1000) { janela = t; conta = 0; } return ++conta <= LIMITE_POR_SEG; };
  const responde = (cb, x) => { if (typeof cb === "function") cb(x); };
  const meuCanal = () => { const k = ondeEsta.get(eu); const c = k && canais.get(k); return c && c.membros.has(eu) ? c : null; };

  function sai() {
    const k = ondeEsta.get(eu); if (!k) return;
    const c = canais.get(k); ondeEsta.delete(eu); io.in(`user:${eu}`).socketsLeave(quarto(k)); // (todas as abas da pessoa)
    if (!c) return;
    c.membros.delete(eu); c.mudou.delete(eu);
    if (c.membros.size === 0) canais.delete(k);
    else io.to(quarto(k)).emit("mundo-saiu", { id: eu });
  }

  socket.on("mundo-entrar", async (dados, cb) => {
    try {
      const mapa = dados?.mapa;
      if (!mapaValido(mapa)) return responde(cb, { erro: "Mapa inválido." });
      const minha = ++entrando;
      const atual = ondeEsta.get(eu);
      if (atual && canais.get(atual)?.mapa === mapa) { // já está neste mapa (outra aba ou reconexão)
        const c = canais.get(atual); socket.join(quarto(atual)); const mb = c.membros.get(eu); Object.assign(mb, limpaPerfil(dados?.perfil, apelido), limpaPos(dados), { sid: socket.id });
        return responde(cb, { ok: true, canal: c.n, membros: [...c.membros.values()].filter((m) => m.id !== eu).map(publico) });
      }
      if (ondeEsta.size >= MAX_JOGADORES && !atual) return responde(cb, { erro: "O mundo está lotado agora. Tente daqui a pouco." });
      const amigos = await amigosCom(eu);
      if (minha !== entrando) return responde(cb, { erro: "trocou" }); // mudou de mapa de novo enquanto esperava
      sai();
      const c = escolheCanal(mapa, amigos);
      const mb = { id: eu, ...limpaPerfil(dados?.perfil, apelido), ...limpaPos(dados), sid: socket.id };
      c.membros.set(eu, mb); ondeEsta.set(eu, c.chave); socket.join(quarto(c.chave));
      socket.to(quarto(c.chave)).emit("mundo-chegou", publico(mb));
      ligaTick(io);
      responde(cb, { ok: true, canal: c.n, membros: [...c.membros.values()].filter((m) => m.id !== eu).map(publico) });
    } catch { responde(cb, { erro: "Não deu para entrar no mundo agora." }); }
  });

  socket.on("mundo-sair", (_d, cb) => { if (meuCanal()?.membros.get(eu)?.sid === socket.id) sai(); responde(cb, { ok: true }); });

  socket.on("mundo-eu", (dados) => {
    const c = meuCanal(); if (!c || !podeMandar()) return;
    const mb = c.membros.get(eu); if (!mb || mb.sid !== socket.id) return; // (outra aba manda a posição)
    Object.assign(mb, limpaPos(dados)); c.mudou.add(eu);
  });

  socket.on("mundo-perfil", (dados) => {
    const c = meuCanal(); if (!c || !podeMandar()) return;
    const mb = c.membros.get(eu); if (!mb) return;
    Object.assign(mb, limpaPerfil(dados?.perfil, mb.apelido));
    socket.to(quarto(c.chave)).emit("mundo-perfil", publico(mb));
  });

  const fala = (evento, max) => socket.on(evento, (dados) => {
    const c = meuCanal(); if (!c) return;
    const t = Date.now(); if (t - ultimaFala < FALA_CADA_MS) return; ultimaFala = t;
    const i = Math.round(Number(dados?.i)); if (!(i >= 0 && i < max)) return;
    io.to(quarto(c.chave)).emit(evento, { de: eu, i });
  });
  fala("mundo-emote", EMOTES);
  fala("mundo-frase", FRASES);

  socket.on("disconnect", () => {
    const c = meuCanal(); if (!c) return;
    if (c.membros.get(eu)?.sid === socket.id) sai(); // (a aba que estava no mundo caiu)
  });
}
