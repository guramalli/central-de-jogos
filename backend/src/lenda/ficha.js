// ===== Lenda do Campinho — ficha pública do personagem (página "Personagens") =====
//
// O save de cada jogador fica no banco comprimido pelo próprio jogo (gzip em
// base64, ver LendaSave). Aqui ele é aberto e vira uma FICHA PÚBLICA, igual à
// página de personagem do Tibia: só o que pode ser mostrado pra todo mundo.
// Tudo é escolhido campo a campo (lista branca): nada de mochila, missões,
// tostões, posição exata etc. Funções puras (sem banco) — testadas em test/lenda/.
import { gunzipSync } from "node:zlib";
import { timePublico } from "./times.js";

// Teto de 2 MB aberto: o save guardado tem no máximo 90 kB comprimido, mas
// um gzip malfeito poderia inflar muito mais (e esta rota é pública).
export function abrirSave(dados) {
  try {
    const txt = gunzipSync(Buffer.from(String(dados || ""), "base64"), { maxOutputLength: 2_000_000 }).toString("utf8");
    const s = JSON.parse(txt);
    return s && typeof s === "object" ? s : null;
  } catch {
    return null;
  }
}

const num = (v, max = 1e12) => (Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0);
// só o dia (meia-noite de Brasília daquele dia), sem a hora
const BR = 3 * 3600e3;
const soDia = (t) => { const n = num(t, 1e13); return n ? Math.floor((n - BR) / 864e5) * 864e5 + BR : 0; };
const id = (v) => (typeof v === "string" && /^[a-z0-9_]{1,40}$/.test(v) ? v : null);

export function fichaPublica(s) {
  if (!s || typeof s !== "object") return null;
  const st = s.st || {};
  const sk = s.sk || {};
  const equip = {};
  for (const slot of ["cabeca", "camisa", "acessorio", "perna", "calcao", "chuteira"]) {
    const it = id((s.equip || {})[slot]);
    if (it) equip[slot] = { id: it, r: num((s.equipR || {})[slot], 10) };
  }
  // os adversários que ele mais driblou
  const kills = Object.entries(s.kills || {})
    .filter(([k, n]) => id(k) && Number.isFinite(n))
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([k, n]) => ({ id: k, n: num(n) }));
  const arenas = Object.entries(s.arenas || {})
    .filter(([k]) => id(k))
    .map(([k, a]) => ({ id: k, vitorias: num(a && a.vitorias), miticos: Array.isArray(a && a.itens) ? a.itens.filter(id).length : 0 }))
    .filter((a) => a.vitorias > 0);
  // v407 (Raio-X U1/U5): nada de texto livre nem de onde/quando a pessoa está. A exaustão mostra só o nível e o DIA
  // (sem o adversário, o lugar e a hora); o nome do personagem, o clube da carreira e o mapa atual não saem mais;
  // o nome do time: o digitado só se passar no filtro (v408, times.js/filtroNome.js); senão o das listas; senão nenhum.
  const exaustoes = (Array.isArray(s.exaustoes) ? s.exaustoes : []).slice(0, 10).map((e) => ({
    nivel: num(e && e.nivel, 999), em: soDia(e && e.em),
  }));
  const c = s.carreira || {};
  const tp = s.time && typeof s.time === "object" ? timePublico({ nome: s.time.nome, partes: s.time.partes, div: num(s.time.div, 9), titulos: num(s.time.titulos, 999) }) : null;
  const time = tp ? { nome: tp.nome, div: tp.div, titulos: tp.titulos } : null;
  return {
    genero: s.corpo === "f" ? "f" : "m",
    nivel: num(s.nivel, 999) || 1,
    xp: num(s.xp),
    posicao: id(s.posicao),
    classe: id(s.classe),
    atr: {
      defesa: num((s.atr || {}).defesa, 9999), habilidade: num((s.atr || {}).habilidade, 9999),
      inteligencia: num((s.atr || {}).inteligencia, 9999), folego: num((s.atr || {}).folego, 9999),
    },
    skills: {
      drible: num((sk.drible || {}).lv, 9999), chute: num((sk.chute || {}).lv, 9999),
      defesa: num((sk.defesa || {}).lv, 9999), visao: num((sk.visao || {}).lv, 9999),
    },
    equip,
    casa: s.casa && id(s.casa.id) ? id(s.casa.id) : null,
    time,
    fama: num(c.fama),
    estatisticas: {
      abates: num(st.abates), chefes: num(st.chefes), gols: num(st.gols), mortes: num(st.mortes),
      quiz: num(st.quiz), tempo: num(st.tempo), recordePenalti: num(st.recordePenalti, 5),
      figurinhas: num(Object.keys(s.figs || {}).length, 999), dribles: Array.isArray(s.dribles) ? s.dribles.filter(id).length : 0,
    },
    kills,
    arenas,
    montarias: Array.isArray(s.montarias) ? s.montarias.filter(id).slice(0, 20) : [],
    skins: Array.isArray(s.skins) ? s.skins.filter(id).slice(0, 20) : [],
    exaustoes,
    criado: soDia(s.criado),
    dia: num(s.dia),
  };
}
