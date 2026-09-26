/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   VARIEDADE: ninguém é cópia de ninguém
   - Adversários: cada um do mesmo tipo tem o seu jeito (pele, penteado,
     cor do cabelo, altura, às vezes faixa/boné/óculos). O UNIFORME do time
     não muda — dá para saber de que time é. Chefões ficam como são.
     São 6 variações por tipo (a 1ª é a original, a da wiki).
   - Uniformes com PADRÃO por time: listras, aros, faixa diagonal ou meio a
     meio (Lisboa, Milão, Munique, Cairo, Tóquio, Doha, Miami, Estádio).
   - NPCs repetidos (mesma roupa, cabelo e pele em cidades diferentes)
     ganham cabelo, pele, altura e acessório próprios.
   Carregar no FIM (depois de boneco.js e game.js).
   ============================================================ */
const VAR_N = 6;
const VAR_PELES = ['pele-clara', 'pele-media', 'pele-morena', 'pele-negra', 'pele-retinta'];
// penteados que têm desenho próprio (as folhas); os de roupa (terno, agasalho, saia) não trocam
const VAR_CAB = { m: ['cabelo-curto', 'cabelo-cacheado', 'cabelo-black-power', 'cabelo-moicano'], f: ['cabelo-rabo', 'cabelo-liso-longo', 'cabelo-coque', 'cabelo-cacheado', 'cabelo-black-power'] };
const VAR_COR_CAB = ['preto', 'preto', 'preto', 'castanho', 'castanho', 'castanho', 'loiro', 'ruivo'];
const PADRAO_TIME = {
  buenos: ['banda', '#f8d838'], lisboa: ['aros', '#f4f4f8'], milao: ['listras', '#c01a2a'], munique: ['listras', '#f4f4f8'], cairo: ['metade', '#1a1a1a'],
  toquio: ['faixa', '#f4f4f8'], doha: ['aros', '#e8c048'], miami: ['metade', '#1a1a2a'], estadio: ['aros', '#1a1a1a'],
};
function hashTxt(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function sorteia(r, lista) { return lista[Math.floor(r() * lista.length) % lista.length]; }

/* ---------- o jeito de cada um ---------- */
function variaLook(base, seed) {
  const r = mulberry(seed); const L = Object.assign({}, base); delete L._kb;
  const g = L.corpo === 'f' ? 'f' : 'm';
  L.pele = sorteia(r, VAR_PELES);
  const especial = /rosa|ouro/.test(L.cabelo || '') || /terno|smoking|jaleco/.test(L.roupa || '');
  if (!especial) {
    L.cabelo = sorteia(r, VAR_CAB[g]);
    if (L.corCabelo !== 'grisalho') L.corCabelo = sorteia(r, VAR_COR_CAB); // quem é mais velho continua grisalho
  }
  L.alt = +((L.alt || 1.6) * (0.93 + r() * 0.14)).toFixed(3);
  if (!L.chapeu && r() < 0.22) L.chapeu = L.roupa === 'roupa-futebol' ? 'chapeu-faixa' : sorteia(r, ['chapeu-bone', 'chapeu-gorro']);
  if (!L.rosto && L.roupa !== 'roupa-futebol' && r() < 0.18) L.rosto = 'rosto-escuros';
  return L;
}
function lookDoMonstro(m, mapa) {
  const d = m.d, L = d && d.look;
  if (!L || (L.tipo && L.tipo !== 'humano') || d.chefe || m.ar) return null;
  const v = (m.uid || 0) % VAR_N;
  const pad = L.roupa === 'roupa-futebol' && PADRAO_TIME[mapa];
  if (!v && !pad) return null;
  const novo = v ? variaLook(L, hashTxt(m.tipo) + v * 7919) : Object.assign({}, L);
  delete novo._kb;
  if (pad) { novo.padrao = pad[0]; novo.corPadrao = pad[1]; }
  return novo;
}
const _criaMonstroVar = criaMonstro;
criaMonstro = function () {
  const m = _criaMonstroVar.apply(this, arguments);
  try { if (m) { const L = lookDoMonstro(m, G.mapa && G.mapa.id); if (L) m._dV = Object.assign({}, m.d, { look: L }); } } catch (e) { }
  return m;
};
// na hora de desenhar (e de medir a altura), o monstro usa o jeito dele
const _desenhaEntVar = desenhaEnt;
desenhaEnt = function (ctx, e) {
  if (!e || !e._dV || e._dV.chefe) return _desenhaEntVar.apply(this, arguments);
  const d = e.d; e.d = e._dV; try { return _desenhaEntVar.apply(this, arguments); } finally { e.d = d; }
};
const _alturaEntVar = alturaEnt;
alturaEnt = function (e) {
  if (!e || !e._dV) return _alturaEntVar.apply(this, arguments);
  const d = e.d; e.d = e._dV; try { return _alturaEntVar.apply(this, arguments); } finally { e.d = d; }
};

/* ---------- padrão do uniforme: pintado só na camisa do desenho ---------- */
let PADRAO_AGORA = null;
const _spriteBonecoVar = spriteBoneco;
spriteBoneco = function (look) {
  PADRAO_AGORA = look && look.padrao ? [look.padrao, look.corPadrao || '#f4f4f8'] : null;
  try { return _spriteBonecoVar.apply(this, arguments); } finally { PADRAO_AGORA = null; }
};
function caixaCamisa(rot, W) { // a caixa da camisa (rótulo 2) nesta pose
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (let i = 0; i < rot.length; i++) if (rot[i] === 2) { const x = i % W, y = (i / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return x1 < 0 ? null : [x0, y0, x1, y1];
}
const _tingeCelulaVar = tingeCelula;
tingeCelula = function (base, cores) {
  const out = _tingeCelulaVar.apply(this, arguments);
  if (!PADRAO_AGORA) return out;
  const [tipo, cor] = PADRAO_AGORA; const W = FOLHA_CW, H = FOLHA_CH;
  const cx = base._caixa === undefined ? (base._caixa = caixaCamisa(base.rot, W)) : base._caixa; if (!cx) return out;
  const [x0, y0, x1, y1] = cx, w = x1 - x0 + 1, h = y1 - y0 + 1;
  const t = bRgb(cor), { rot, lum, ref } = base; const x = out.getContext('2d'); const img = x.getImageData(0, 0, W, H), o = img.data;
  for (let i = 0; i < rot.length; i++) {
    if (rot[i] !== 2) continue;
    const u = ((i % W) - x0) / w, v = (((i / W) | 0) - y0) / h;
    const on = tipo === 'listras' ? Math.floor(u * 7) % 2 === 1 : tipo === 'aros' ? Math.floor(v * 6) % 2 === 1 : tipo === 'faixa' ? Math.abs(u - v) < 0.13 : tipo === 'metade' ? u >= 0.5 : tipo === 'banda' ? Math.abs(v - 0.42) < 0.13 : false;
    if (!on) continue;
    const f = lum[i] / (ref[2] || 0.5);
    for (let j = 0; j < 3; j++) o[i * 4 + j] = f <= 1 ? t[j] * f : Math.min(255, t[j] + (255 - t[j]) * (f - 1) * 0.9);
  }
  x.putImageData(img, 0, 0); return out;
};

/* ---------- NPCs repetidos ganham jeito próprio ---------- */
(function () {
  const vistos = new Set(), usados = {}; // por grupo repetido: peles e cores de cabelo já usadas
  const livre = (r, lista, ja) => { const sobra = lista.filter(x => !ja.includes(x)); return sorteia(r, sobra.length ? sobra : lista); };
  const ACESS = [['rosto', 'rosto-redondos'], ['chapeu', 'chapeu-panama'], ['chapeu', 'chapeu-palha'], ['pescoco', 'pescoco-cachecol'], ['rosto', 'rosto-escuros'], ['pescoco', 'pescoco-medalha'], null];
  for (const id of Object.keys(NPCS)) {
    const L = NPCS[id].look; if (!L || (L.tipo && L.tipo !== 'humano')) continue;
    const k = `${L.corpo || 'm'}|${L.cabelo}|${L.roupa}|${L.pele}`;
    const u = usados[k] || (usados[k] = { pele: [L.pele], cor: [L.corCabelo] });
    if (!vistos.has(k)) { vistos.add(k); continue; }
    const r = mulberry(hashTxt(id)); const n = Object.assign({}, L); delete n._kb;
    const g = n.corpo === 'f' ? 'f' : 'm';
    n.pele = livre(r, VAR_PELES, u.pele); u.pele.push(n.pele);
    // quem usa terno/agasalho/saia tem o penteado desenhado junto: aí só muda a cor
    const roupaFixa = /terno|smoking|moletom|jaleco|couro/.test(n.roupa || '') || n.baixo === 'baixo-saia';
    if (!roupaFixa) n.cabelo = sorteia(r, VAR_CAB[g].filter(c => c !== L.cabelo));
    n.corCabelo = livre(r, ['preto', 'castanho', 'loiro', 'ruivo', 'grisalho'], u.cor); u.cor.push(n.corCabelo);
    const a = sorteia(r, ACESS); if (a && !n[a[0]]) n[a[0]] = a[1];
    n.alt = +((n.alt || 1.7) * (0.94 + r() * 0.12)).toFixed(3);
    NPCS[id].look = n; vistos.add(`${n.corpo || 'm'}|${n.cabelo}|${n.roupa}|${n.pele}`);
  }
})();
