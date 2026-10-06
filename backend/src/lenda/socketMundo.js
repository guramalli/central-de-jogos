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
import { guildaDe } from "./guilda.js";
import { contasForaDoRanking } from "./suspeitos.js";
import { prefsDe, definePrefs } from "./prefs.js";
// v407 (Raio-X U5/I8):
//   lenda-prefs {convitesTodos, invisivel} → {ok, prefs}   (preferências; ver prefs.js)
//   - INVISÍVEL: a pessoa entra no canal e vê os outros, mas ninguém recebe a chegada, a posição, o perfil nem as falas dela;
//   mundo-quem → {ok, total, lista: [{id, apelido, nivel, mapa}]}   ("👥 X jogando agora" em todas as cidades; sem os invisíveis)
export const QUEM_MAX = 200;
export const MAX_POR_CANAL = 25;
export const EMOTES = 8;
export const FRASES = 16;
export const FRASES_GUILDA = 12;
const MAX_JOGADORES = 5000;
const TICK_MS = 150;
const LIMITE_POR_SEG = 15;            // posições por segundo, por conexão (o jogo manda ~7)
const FALA_CADA_MS = 1200;            // emote/frase: no máximo um a cada 1,2 s
const AMIGOS_CACHE_MS = 5 * 60 * 1000;

const canais = new Map();             // "mapa#n" -> { chave, mapa, n, membros: Map(id -> membro), mudou: Set(id) }
const ondeEsta = new Map();           // userId -> chave do canal
const amigosCache = new Map();        // userId -> { ate, lista }
const guildaCache = new Map();        // userId -> { ate, g } (escudo da guilda em cima do nome)
const topo = { ids: [], ate: 0, buscando: null };   // os 3 primeiros do ranking (guardado TOPO_MS)
const TOPO_MS = 2 * 60 * 1000;
let tick = null;

// os 3 primeiros do ranking de XP (o mesmo do jogo: fora conta banida ou oculta dos rankings) — dono: "colocarmos no
// primeiro, segundo e terceiro do ranking um número do rank do lado do nickname como sinal de poder"
async function top3Real() {
  const topo = await prisma.lendaRanking.findMany({ orderBy: [{ xp: "desc" }, { atualizadoEm: "asc" }], take: 20, select: { userId: true } });
  const bloq = await contasForaDoRanking(prisma, topo.map((t) => t.userId)); // (fora: banido, oculto e suspeito de trapaça; v409: admin aparece)
  return topo.map((t) => t.userId).filter((id) => !bloq.has(id)).slice(0, 3);
}
const deps = { amigosDe: (id) => amigosDe(prisma, id), guildaDe: (id) => guildaDe(prisma, id), top3: top3Real };
export function __configurarMundoParaTestes(n) { Object.assign(deps, n); }
export function __resetMundoParaTestes() {
  canais.clear(); ondeEsta.clear(); amigosCache.clear();
  if (tick) { clearInterval(tick); tick = null; }
  deps.amigosDe = (id) => amigosDe(prisma, id); deps.guildaDe = (id) => guildaDe(prisma, id); deps.top3 = top3Real; guildaCache.clear(); topo.ids = []; topo.ate = 0;
}
export const __canaisMundo = canais;

export const mapaValido = (m) => typeof m === "string" && /^[a-z0-9_]{1,40}$/.test(m);
const num = (v, a, b) => { const n = Number(v); return Number.isFinite(n) ? Math.max(a, Math.min(b, n)) : a; };
const quarto = (chave) => `mundo:${chave}`;
export function limpaPos(d) {
  return { x: +num(d?.x, 0, 1000).toFixed(2), y: +num(d?.y, 0, 1000).toFixed(2), f: d?.f ? 1 : 0, m: d?.m ? 1 : 0, fa: +num(d?.fa, 0, 1e6).toFixed(2), v: [0, 1, 2].includes(d?.v) ? d.v : 0 };
}
const publico = (mb) => ({ id: mb.id, apelido: mb.apelido, nivel: mb.nivel, look: mb.look, x: mb.x, y: mb.y, f: mb.f, m: mb.m, fa: mb.fa, v: mb.v, guilda: mb.guilda || null });
// os outros do canal que aparecem (sem a própria pessoa e sem os invisíveis)
const visiveis = (c, eu) => [...c.membros.values()].filter((m) => m.id !== eu && !m.inv).map(publico);
// v407 (Raio-X I8): quem está jogando nas cidades, em todos os mapas (sem os invisíveis e sem `eu`)
export function quemEstaJogando(eu) {
  const lista = [];
  for (const c of canais.values()) for (const m of c.membros.values()) if (m.id !== eu && !m.inv) lista.push({ id: m.id, apelido: m.apelido, nivel: m.nivel, mapa: c.mapa });
  lista.sort((a, b) => a.apelido.localeCompare(b.apelido));
  return { total: lista.length, lista: lista.slice(0, QUEM_MAX) };
}
async function guildaCom(id, forcar) {
  const c = guildaCache.get(id), agora = Date.now();
  if (c && c.ate > agora && !forcar) return c.g;
  let g = null; try { g = await deps.guildaDe(id); } catch { g = c?.g || null; }
  const tag = g ? { id: g.id, nome: g.nome, escudo: g.escudo, cor: g.cor } : null;
  guildaCache.set(id, { ate: agora + AMIGOS_CACHE_MS, g: tag }); return tag;
}

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

// confere o top 3 (no máximo a cada TOPO_MS); mudou → avisa quem está no mundo
async function atualizaTopo(io) {
  if (topo.ate > Date.now()) return topo.ids;
  if (topo.buscando) return topo.buscando;
  topo.buscando = (async () => {
    let ids = topo.ids; try { ids = await deps.top3(); } catch { /* sem banco: fica o que tinha */ }
    topo.ate = Date.now() + TOPO_MS;
    if (JSON.stringify(ids) !== JSON.stringify(topo.ids)) { topo.ids = ids; for (const c of canais.values()) io.to(quarto(c.chave)).emit("mundo-top", ids); }
    topo.buscando = null; return topo.ids;
  })();
  return topo.buscando;
}
function ligaTick(io) {
  if (tick) return;
  tick = setInterval(() => {
    for (const c of canais.values()) {
      if (!c.mudou.size) continue;
      const pos = [];
      for (const id of c.mudou) { const mb = c.membros.get(id); if (mb && !mb.inv) pos.push([id, mb.x, mb.y, mb.f, mb.m, mb.fa, mb.v]); }
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
        return responde(cb, { ok: true, canal: c.n, membros: visiveis(c, eu), top: topo.ids, invisivel: !!mb.inv });
      }
      if (typeof dados?.invisivel === "boolean") definePrefs(eu, { invisivel: dados.invisivel }); // (v407: o jogo já manda junto)
      if (ondeEsta.size >= MAX_JOGADORES && !atual) return responde(cb, { erro: "O mundo está lotado agora. Tente daqui a pouco." });
      const [amigos, guilda, top] = await Promise.all([amigosCom(eu), guildaCom(eu), atualizaTopo(io)]);
      if (minha !== entrando) return responde(cb, { erro: "trocou" }); // mudou de mapa de novo enquanto esperava
      sai();
      const c = escolheCanal(mapa, amigos);
      const mb = { id: eu, ...limpaPerfil(dados?.perfil, apelido), ...limpaPos(dados), sid: socket.id, guilda, inv: !!prefsDe(eu).invisivel };
      c.membros.set(eu, mb); ondeEsta.set(eu, c.chave); socket.join(quarto(c.chave));
      if (!mb.inv) socket.to(quarto(c.chave)).emit("mundo-chegou", publico(mb));
      ligaTick(io);
      responde(cb, { ok: true, canal: c.n, membros: visiveis(c, eu), top, invisivel: mb.inv });
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
    if (!mb.inv) socket.to(quarto(c.chave)).emit("mundo-perfil", publico(mb));
  });

  // v407 (Raio-X U5): preferências (convites só de amigos / invisível). Ficar invisível no meio do mapa: os outros
  // recebem "saiu"; voltar a aparecer: recebem "chegou".
  socket.on("lenda-prefs", (dados, cb) => {
    const p = definePrefs(eu, dados);
    const c = meuCanal(), mb = c?.membros.get(eu);
    if (mb && !!mb.inv !== p.invisivel) {
      mb.inv = p.invisivel;
      if (mb.inv) socket.to(quarto(c.chave)).emit("mundo-saiu", { id: eu });
      else socket.to(quarto(c.chave)).emit("mundo-chegou", publico(mb));
    }
    responde(cb, { ok: true, prefs: p });
  });
  // v407 (Raio-X I8): "👥 X jogando agora" — quem está nas cidades e centros, de TODOS os mapas (sem os invisíveis)
  let ultimoQuem = 0;
  socket.on("mundo-quem", (_d, cb) => {
    const t = Date.now(); if (t - ultimoQuem < 2000) return responde(cb, { erro: "Calma!" }); ultimoQuem = t;
    responde(cb, { ok: true, ...quemEstaJogando(eu) });
  });

  const fala = (evento, max) => socket.on(evento, (dados) => {
    const c = meuCanal(); if (!c) return;
    if (c.membros.get(eu)?.inv) return; // (invisível não fala com ninguém)
    const t = Date.now(); if (t - ultimaFala < FALA_CADA_MS) return; ultimaFala = t;
    const i = Math.round(Number(dados?.i)); if (!(i >= 0 && i < max)) return;
    io.to(quarto(c.chave)).emit(evento, { de: eu, i });
  });
  fala("mundo-emote", EMOTES);
  fala("mundo-frase", FRASES);

  // ---- guilda: frases prontas para a guilda inteira (quem está online) ----
  let salaGuilda = null, ultimaGuilda = 0;
  socket.on("guilda-ligar", async (_d, cb) => {
    const g = await guildaCom(eu, true); // (entrou/saiu de guilda: confere de novo)
    if (salaGuilda && (!g || salaGuilda !== `guilda:${g.id}`)) { socket.leave(salaGuilda); salaGuilda = null; }
    if (g) { salaGuilda = `guilda:${g.id}`; socket.join(salaGuilda); }
    const c = meuCanal(), mb = c?.membros.get(eu); if (mb) { mb.guilda = g; if (!mb.inv) socket.to(quarto(c.chave)).emit("mundo-perfil", publico(mb)); }
    responde(cb, { ok: true, guilda: g });
  });
  socket.on("guilda-frase", (dados) => {
    if (!salaGuilda) return;
    const t = Date.now(); if (t - ultimaGuilda < 2000) return; ultimaGuilda = t;
    const i = Math.round(Number(dados?.i)); if (!(i >= 0 && i < FRASES_GUILDA)) return;
    io.to(salaGuilda).emit("guilda-frase", { de: eu, apelido, i });
  });

  socket.on("disconnect", () => {
    const c = meuCanal(); if (!c) return;
    if (c.membros.get(eu)?.sid === socket.id) sai(); // (a aba que estava no mundo caiu)
  });
}
