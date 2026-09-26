/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   RUMO AO CRAQUE — PERSONAGENS PRÓPRIOS (sem as peças do site)
   Desenho vetorial chibi em 3 vistas (frente, costas, lado) com
   4 quadros de caminhada. Entende o mesmo "look" de sempre:
   {corpo, pele, cabelo, corCabelo, roupa, corRoupa, baixo, corBaixo,
    chapeu, pescoco, rosto, mao, costas, numero}.
   Tudo vira canvas em cache (com limite), então custa pouco por quadro.
   Carregar DEPOIS de ui.js (substitui compoe/compoeVista/montaRetrato).
   ============================================================ */
const BON = { W: 100, H: 150, S: 2.4, LW: 2.3, LINHA: '#3d2b3a' };

/* ---------- cores ---------- */
function bRgb(c) {
  if (!c) return [128, 128, 128];
  if (c[0] === '#') { let h = c.slice(1); if (h.length === 3) h = h.split('').map(v => v + v).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  const m = c.match(/\d+/g); return m ? m.slice(0, 3).map(Number) : [128, 128, 128];
}
function bMix(c, alvo, k) { const a = bRgb(c), b = bRgb(alvo); return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`; }
const bEsc = (c, k = 0.22) => bMix(c, '#1a1026', k), bClaro = (c, k = 0.3) => bMix(c, '#ffffff', k);
const PELES_B = { 'pele-clara': '#f9d7c3', 'pele-media': '#eaa07e', 'pele-morena': '#c98463', 'pele-negra': '#9c5f47', 'pele-retinta': '#63392f' };
const CORES_CAB_B = { preto: '#2a2230', castanho: '#6e4128', loiro: '#f2b447', grisalho: '#dcd8e2', ruivo: '#d9542a', rosa: '#ff8ccb', azul: '#4f82ff', roxo: '#a066ff', verde: '#46c776' };
const CAB_PADRAO = { 'cabelo-curto': '#5a3424', 'cabelo-cacheado': '#3a2226', 'cabelo-liso-longo': '#2a2226', 'cabelo-coque': '#4a2c24', 'cabelo-black-power': '#1e1a22', 'cabelo-moicano': '#5a2a1a', 'cabelo-topete': '#3a2a20', 'cabelo-anime': '#f2b447', 'cabelo-anime-ouro': '#ffcf3a', 'cabelo-rabo-rosa': '#ff7ac0', 'cabelo-undercut-rosa': '#ff7ac0', 'cabelo-rabo': '#6e4128', 'cabelo-undercut': '#2a2230', 'cabelo-raspado': '#2a2230' };
const ROUPA_B = { 'roupa-futebol': ['#f8d838', 'futebol'], 'roupa-camiseta': ['#a868c8', 'camiseta'], 'roupa-regata': ['#f0f0f0', 'regata'], 'roupa-moletom': ['#5888c8', 'moletom'], 'roupa-jaleco': ['#f4f4f8', 'jaleco'], 'roupa-xadrez': ['#9a2a2a', 'xadrez'],
  'roupa-terno': ['#2a2a3e', 'terno'], 'roupa-couro': ['#2a2428', 'couro'], 'roupa-camisa10-ouro': ['#f0c030', 'futebol10'], 'roupa-smoking-ouro': ['#e8b830', 'terno'], 'roupa-rockstar-ouro': ['#e8b830', 'couro'], 'roupa-cavaleiro-ouro': ['#e8c040', 'armadura'] };
const BAIXO_B = { 'baixo-shorts': ['#3a5a9a', 'shorts'], 'baixo-jeans': ['#48688e', 'calca'], 'baixo-saia': ['#d84848', 'saia'], 'baixo-praia': ['#ff8a3a', 'praia'], 'baixo-moletom': ['#7a7a8a', 'calca'], 'baixo-camuflada': ['#5a6a3a', 'camuflada'] };

function specDe(look) {
  const L = look || {};
  const pele = L.pele && L.pele[0] === '#' ? L.pele : PELES_B[L.pele] || PELES_B['pele-media'];
  const cabId = L.cabelo && L.cabelo[0] !== '#' ? L.cabelo.replace(/-cinza$/, '') : 'cabelo-curto';
  const estilo = { 'cabelo-curto': 'curto', 'cabelo-cacheado': 'cacheado', 'cabelo-liso-longo': 'longo', 'cabelo-coque': 'coque', 'cabelo-black-power': 'black', 'cabelo-moicano': 'moicano', 'cabelo-topete': 'topete', 'cabelo-anime': 'anime', 'cabelo-anime-ouro': 'anime', 'cabelo-rabo-rosa': 'rabo', 'cabelo-undercut-rosa': 'undercut', 'cabelo-rabo': 'rabo', 'cabelo-undercut': 'undercut', 'cabelo-raspado': 'raspado' }[cabId] || (L.estilo === 'raspado' ? 'raspado' : L.estilo || 'curto');
  let corCab = L.corCabelo && L.corCabelo[0] === '#' ? L.corCabelo : CORES_CAB_B[L.corCabelo] || (L.cabelo && L.cabelo[0] === '#' ? L.cabelo : CAB_PADRAO[cabId] || '#3a2a20');
  const [corR0, tipoR] = ROUPA_B[L.roupa] || (L.camisa ? [L.camisa, 'futebol'] : ['#f0f0f0', 'regata']);
  const [corB0, tipoB] = BAIXO_B[L.baixo] || (L.calcao ? [L.calcao, 'shorts'] : ['#3a5a9a', 'shorts']);
  return { f: L.corpo === 'f', pele, estilo, corCab, roupa: tipoR, corRoupa: L.corRoupa || corR0, ouro: /ouro/.test(L.roupa || ''), baixo: tipoB, corBaixo: L.corBaixo || corB0,
    chapeu: (L.chapeu || '').replace('chapeu-', '') || null, pescoco: (L.pescoco || '').replace('pescoco-', '') || null, rosto: (L.rosto || '').replace('rosto-', '') || null,
    mao: (L.mao || '').replace('mao-', '') || null, costas: (L.costas || '').replace('costas-', '') || null, numero: L.numero || (tipoR === 'futebol10' ? 10 : 10), meia: L.meia || null, chuteira: L.chuteira || null };
}

/* ---------- utilitários de desenho ---------- */
function P() { return new Path2D(); }
function pRR(x, y, w, h, r) { const p = P(); p.roundRect(x, y, w, h, r); return p; }
function pEl(cx, cy, rx, ry) { const p = P(); p.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); return p; }
// preenche com sombra de "cel shading" (luz vindo de cima-esquerda) e contorno
function pinta(x, p, cor, o = {}) {
  x.save(); x.fillStyle = o.sombra === false ? cor : bEsc(cor, o.k || 0.2); x.fill(p);
  if (o.sombra !== false) { x.clip(p); x.translate(o.dx != null ? o.dx : -2.2, o.dy != null ? o.dy : -2); x.fillStyle = cor; x.fill(p); }
  x.restore();
  if (o.linha !== false) { x.lineWidth = o.lw || BON.LW; x.strokeStyle = o.cl || BON.LINHA; x.lineJoin = 'round'; x.stroke(p); }
}
function traco(x, fn, cor, lw = 1.6) { x.beginPath(); fn(); x.strokeStyle = cor; x.lineWidth = lw; x.lineCap = 'round'; x.lineJoin = 'round'; x.stroke(); }
function brilho(x, cx, cy, r, a = 0.35) { x.fillStyle = `rgba(255,255,255,${a})`; x.beginPath(); x.ellipse(cx, cy, r, r * 0.7, -0.5, 0, 7); x.fill(); }

/* ---------- partes do corpo ---------- */
// perna de (hx,hy) com comprimento, ângulo (rad) e peças: pele, meia, calça, chuteira
function perna(x, sp, hx, hy, ang, comp, lado, esc) {
  x.save(); x.translate(hx, hy); x.rotate(ang);
  const larg = 8.2, longo = sp.baixo === 'calca' || sp.baixo === 'camuflada';
  const pele = esc ? bEsc(sp.pele, 0.15) : sp.pele;
  pinta(x, pRR(-larg / 2, 0, larg, comp, 3.5), longo ? (esc ? bEsc(sp.corBaixo, 0.15) : sp.corBaixo) : pele);
  if (!longo) { // meião de futebol
    const meia = sp.meia || (sp.roupa.startsWith('futebol') ? '#f4f4f4' : null);
    if (meia) pinta(x, pRR(-larg / 2, comp - 11, larg, 9, 2.5), esc ? bEsc(meia, 0.15) : meia);
  }
  // chuteira (aponta para a frente no lado)
  const ch = sp.chuteira || (sp.roupa.startsWith('futebol') ? '#2a2a34' : '#6a3a2a');
  const sapato = lado ? pRR(-5, comp - 3, 14, 7, 3.5) : pEl(0, comp + 0.5, 6.4, 4.2);
  pinta(x, sapato, esc ? bEsc(ch, 0.12) : ch);
  if (lado) { x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(-3, comp + 2.2, 11, 1.2); }
  x.restore();
}
function braco(x, sp, sx, sy, ang, comp, esc, manga) {
  x.save(); x.translate(sx, sy); x.rotate(ang);
  const pele = esc ? bEsc(sp.pele, 0.15) : sp.pele; const cr = esc ? bEsc(sp.corRoupa, 0.15) : sp.corRoupa;
  pinta(x, pRR(-3.8, 0, 7.6, comp, 3.6), manga === 'longa' ? cr : pele);
  if (manga === 'curta') pinta(x, pRR(-4.6, -1, 9.2, 11, 4), cr);
  pinta(x, pEl(0, comp + 1.5, 4.4, 4.4), pele); // mão
  x.restore();
}
function manga(sp) { return ({ regata: 'nua', moletom: 'longa', jaleco: 'longa', terno: 'longa', couro: 'longa', xadrez: 'longa', armadura: 'longa' })[sp.roupa] || 'curta'; }
// tronco com detalhes da roupa (vista: f, c, l)
function tronco(x, sp, v) {
  const c = sp.corRoupa; const larg = v === 'l' ? 21 : 29, x0 = 50 - larg / 2, y0 = 80, h = 30;
  const p = P(); p.moveTo(x0 + 2, y0); p.lineTo(x0 + larg - 2, y0); p.quadraticCurveTo(x0 + larg + 1, y0 + 1, x0 + larg, y0 + 6); p.lineTo(x0 + larg - 1.5, y0 + h - 2); p.quadraticCurveTo(x0 + larg - 2, y0 + h, x0 + larg - 5, y0 + h); p.lineTo(x0 + 5, y0 + h); p.quadraticCurveTo(x0 + 2, y0 + h, x0 + 1.5, y0 + h - 2); p.lineTo(x0, y0 + 6); p.quadraticCurveTo(x0 - 1, y0 + 1, x0 + 2, y0); p.closePath();
  const longo = sp.roupa === 'jaleco' ? P() : null;
  if (longo) { longo.roundRect(x0 - 1, y0 + 2, larg + 2, h + 14, 4); pinta(x, longo, c); }
  pinta(x, p, c);
  x.save(); x.clip(p);
  const r = sp.roupa;
  if (r === 'xadrez') { x.strokeStyle = bEsc(c, 0.35); x.lineWidth = 1.6; for (let i = x0 - 2; i < x0 + larg + 2; i += 6) { x.beginPath(); x.moveTo(i, y0); x.lineTo(i, y0 + h); x.stroke(); } for (let j = y0 + 3; j < y0 + h; j += 6) { x.beginPath(); x.moveTo(x0, j); x.lineTo(x0 + larg, j); x.stroke(); } x.strokeStyle = 'rgba(255,230,120,0.5)'; x.lineWidth = 0.8; for (let i = x0 + 1; i < x0 + larg; i += 6) { x.beginPath(); x.moveTo(i, y0); x.lineTo(i, y0 + h); x.stroke(); } }
  if (r === 'armadura') { x.strokeStyle = bEsc(c, 0.4); x.lineWidth = 1.3; for (let j = y0 + 8; j < y0 + h; j += 7) { x.beginPath(); x.moveTo(x0, j); x.quadraticCurveTo(50, j + 3, x0 + larg, j); x.stroke(); } }
  if ((r === 'futebol' || r === 'futebol10') && v !== 'c') { x.fillStyle = bEsc(c, 0.12); x.fillRect(x0, y0 + h - 5, larg, 5); }
  x.restore();
  // detalhes por cima
  if (v === 'f') {
    if (r === 'futebol' || r === 'futebol10') { traco(x, () => { x.moveTo(45.5, 80.5); x.lineTo(50, 86); x.lineTo(54.5, 80.5); }, '#ffffff', 2.2); if (r === 'futebol10') { x.fillStyle = '#ffffff'; x.font = '700 7px Fredoka, sans-serif'; x.textAlign = 'center'; x.fillText('10', 43, 96); } }
    if (r === 'camiseta') traco(x, () => { x.arc(50, 80, 5, 0.15, Math.PI - 0.15); }, bEsc(c, 0.35), 1.6);
    if (r === 'regata') traco(x, () => { x.arc(50, 79, 6.5, 0.1, Math.PI - 0.1); }, bEsc(c, 0.3), 1.6);
    if (r === 'moletom') { traco(x, () => { x.moveTo(47, 82); x.lineTo(46, 90); x.moveTo(53, 82); x.lineTo(54, 90); }, '#ffffff', 1.3); pinta(x, pRR(42, 97, 16, 8, 3), bEsc(c, 0.08), { sombra: false, lw: 1.5 }); }
    if (r === 'jaleco') { traco(x, () => { x.moveTo(50, 81); x.lineTo(50, 122); }, bEsc(c, 0.3), 1.4); traco(x, () => { x.moveTo(44, 80); x.lineTo(49, 92); x.moveTo(56, 80); x.lineTo(51, 92); }, bEsc(c, 0.3), 1.4); }
    if (r === 'terno') { pinta(x, (() => { const q = P(); q.moveTo(45.5, 80); q.lineTo(50, 94); q.lineTo(54.5, 80); q.closePath(); return q; })(), '#f4f4f4', { sombra: false, lw: 1.4 }); traco(x, () => { x.moveTo(44, 80); x.lineTo(48.5, 95); x.moveTo(56, 80); x.lineTo(51.5, 95); }, bClaro(c, 0.25), 1.6); }
    if (r === 'couro') { traco(x, () => { x.moveTo(51, 81); x.lineTo(51, 109); }, '#b8b8c0', 1.3); traco(x, () => { x.moveTo(45, 80); x.lineTo(48, 90); x.moveTo(56, 80); x.lineTo(53, 90); }, bClaro(c, 0.25), 1.5); if (sp.ouro) { x.fillStyle = '#fff6c0'; [[43, 96], [57, 88]].forEach(([a, b]) => { x.beginPath(); for (let i = 0; i < 5; i++) { const an = -Math.PI / 2 + i * 4 * Math.PI / 5; x.lineTo(a + Math.cos(an) * 3, b + Math.sin(an) * 3); } x.fill(); }); } }
  }
  if (v === 'c' && (r === 'futebol' || r === 'futebol10')) { x.fillStyle = '#ffffff'; x.strokeStyle = bEsc(c, 0.4); x.lineWidth = 1; x.font = '800 12px Fredoka, sans-serif'; x.textAlign = 'center'; x.strokeText(String(sp.numero), 50, 101); x.fillText(String(sp.numero), 50, 101); }
  if (v === 'c' && r === 'moletom') pinta(x, pRR(41, 77, 18, 8, 4), bEsc(c, 0.1), { lw: 1.6 }); // capuz
}
function quadril(x, sp, v, passo) {
  const c = sp.corBaixo, b = sp.baixo;
  if (b === 'saia') { const p = P(); p.moveTo(38, 106); p.lineTo(62, 106); p.lineTo(66, 120); p.quadraticCurveTo(50, 124, 34, 120); p.closePath(); pinta(x, p, c); return; }
  const larg = v === 'l' ? 20 : 26, x0 = 50 - larg / 2;
  const p = P(); p.moveTo(x0, 105); p.lineTo(x0 + larg, 105); p.lineTo(x0 + larg + 0.5, 117); p.lineTo(52.5, 117); p.lineTo(50, 112); p.lineTo(47.5, 117); p.lineTo(x0 - 0.5, 117); p.closePath();
  if (v === 'l') { p.moveTo(0, 0); }
  pinta(x, v === 'l' ? pRR(x0, 105, larg, 12, 3) : p, c);
  if (b === 'praia') { x.save(); x.clip(v === 'l' ? pRR(x0, 105, larg, 12, 3) : p); x.fillStyle = '#ffe07a'; [[43, 109], [55, 112], [50, 107], [58, 107], [41, 114]].forEach(([a, bb]) => { x.beginPath(); x.arc(a, bb, 1.6, 0, 7); x.fill(); }); x.restore(); }
  if (b === 'camuflada') { x.save(); x.clip(p); x.fillStyle = bEsc(c, 0.3); [[42, 108], [55, 110], [48, 114]].forEach(([a, bb]) => { x.beginPath(); x.ellipse(a, bb, 3, 2, 0.5, 0, 7); x.fill(); }); x.restore(); }
}

/* ---------- cabeça, rosto e cabelo ---------- */
const CAB = { cx: 50, cy: 52, rx: 24, ry: 22.5 };
function cabecaBase(x, sp, v) {
  const { cx, cy, rx, ry } = CAB;
  if (v === 'f') { pinta(x, pEl(cx - rx + 0.5, cy + 4, 4.2, 4.8), sp.pele); pinta(x, pEl(cx + rx - 0.5, cy + 4, 4.2, 4.8), sp.pele); }
  if (v === 'l') pinta(x, pEl(cx - 3, cy + 4, 4, 4.8), sp.pele);
  if (v === 'c') { pinta(x, pEl(cx - rx + 0.5, cy + 4, 4, 4.6), sp.pele); pinta(x, pEl(cx + rx - 0.5, cy + 4, 4, 4.6), sp.pele); }
  pinta(x, pEl(cx + (v === 'l' ? 2 : 0), cy, v === 'l' ? rx - 1.5 : rx, ry), sp.pele, { dx: -2.6, dy: -2.4 });
}
function rosto(x, sp, v) {
  const olho = (ox, oy) => { x.fillStyle = '#2a1e2a'; x.beginPath(); x.ellipse(ox, oy, 3.3, 4.3, 0, 0, 7); x.fill(); x.fillStyle = '#ffffff'; x.beginPath(); x.arc(ox + 1.1, oy - 1.5, 1.35, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,0.6)'; x.beginPath(); x.arc(ox - 1.1, oy + 1.6, 0.6, 0, 7); x.fill(); };
  const sob = bEsc(sp.corCab, 0.15);
  if (v === 'f') {
    olho(40.5, 55); olho(59.5, 55);
    traco(x, () => { x.moveTo(36.5, 48.5); x.quadraticCurveTo(40.5, 46.5, 44, 48); x.moveTo(56, 48); x.quadraticCurveTo(59.5, 46.5, 63.5, 48.5); }, sob, 1.7);
    if (sp.f) traco(x, () => { x.moveTo(37, 52.5); x.lineTo(35.2, 51.2); x.moveTo(63, 52.5); x.lineTo(64.8, 51.2); }, '#2a1e2a', 1.3);
    x.fillStyle = 'rgba(255,110,110,0.33)'; x.beginPath(); x.ellipse(34.5, 61, 3.6, 2.1, 0, 0, 7); x.ellipse(65.5, 61, 3.6, 2.1, 0, 0, 7); x.fill();
    traco(x, () => { x.moveTo(46.5, 63.5); x.quadraticCurveTo(50, 66.8, 53.5, 63.5); }, '#6a2e2e', 1.7);
  } else if (v === 'l') {
    olho(63, 55);
    traco(x, () => { x.moveTo(59.5, 48.5); x.quadraticCurveTo(63, 46.5, 66.5, 48); }, sob, 1.7);
    if (sp.f) traco(x, () => { x.moveTo(66.3, 52.5); x.lineTo(68, 51.2); }, '#2a1e2a', 1.3);
    x.fillStyle = 'rgba(255,110,110,0.33)'; x.beginPath(); x.ellipse(66, 61.5, 3.2, 2, 0, 0, 7); x.fill();
    traco(x, () => { x.moveTo(66, 64.5); x.quadraticCurveTo(69, 66, 71, 63.8); }, '#6a2e2e', 1.6);
  }
}
// acessórios de rosto (óculos etc.)
function rostoAcess(x, sp, v) {
  const r = sp.rosto; if (!r || v === 'c') return;
  const lentes = v === 'f' ? [[40.5, 55], [59.5, 55]] : [[63, 55]];
  if (r === 'redondos' || r === 'escuros' || r === 'monoculo') {
    const L = r === 'monoculo' ? lentes.slice(-1) : lentes;
    L.forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 5.4, 0, 7); if (r === 'redondos') { x.fillStyle = 'rgba(215,238,255,0.4)'; x.fill(); } if (r === 'escuros') { x.fillStyle = '#1a1622'; x.fill(); x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(a - 3, b - 3, 2.5, 1.4); } x.lineWidth = 1.6; x.strokeStyle = r === 'monoculo' ? '#c8a030' : '#2a2230'; x.stroke(); });
    if (v === 'f' && r !== 'monoculo') traco(x, () => { x.moveTo(45.9, 54.5); x.lineTo(54.1, 54.5); }, '#2a2230', 1.4);
    if (v === 'l') traco(x, () => { x.moveTo(57.6, 54); x.lineTo(46, 53); }, '#2a2230', 1.4);
  }
  if (r === 'pintura') { const pts = v === 'f' ? [34.5, 65.5] : [66]; pts.forEach(a => { x.fillStyle = '#2ad96a'; x.fillRect(a - 3.5, 58.5, 7, 1.8); x.fillStyle = '#ffd23f'; x.fillRect(a - 3.5, 61, 7, 1.8); }); }
  if (r === 'estrela') { const [a, b] = v === 'f' ? [66, 60] : [66, 60]; x.fillStyle = '#ffd23f'; x.beginPath(); for (let i = 0; i < 10; i++) { const an = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 1.6 : 3.8; x.lineTo(a + Math.cos(an) * rr, b + Math.sin(an) * rr); } x.closePath(); x.fill(); x.lineWidth = 1; x.strokeStyle = BON.LINHA; x.stroke(); }
}
// cabelo: camada de trás (antes da cabeça/corpo) e da frente (depois do rosto)
function cabeloTras(x, sp, v) {
  const c = sp.corCab, e = sp.estilo, { cx, cy } = CAB;
  if (e === 'black') pinta(x, pEl(cx - (v === 'l' ? 5 : 0), cy - 6, 33, 30), c);
  if (e === 'longo' && v !== 'c') { const p = P(); if (v === 'f') { p.moveTo(26, 50); p.quadraticCurveTo(22, 80, 30, 98); p.lineTo(70, 98); p.quadraticCurveTo(78, 80, 74, 50); p.closePath(); } else { p.moveTo(40, 40); p.quadraticCurveTo(22, 60, 30, 98); p.lineTo(50, 98); p.quadraticCurveTo(52, 70, 60, 42); p.closePath(); } pinta(x, p, c); }
  if (e === 'rabo' && v !== 'c') { const p = P(); if (v === 'f') { p.moveTo(68, 40); p.quadraticCurveTo(86, 52, 78, 84); p.quadraticCurveTo(74, 60, 64, 48); p.closePath(); } else { p.moveTo(34, 42); p.quadraticCurveTo(14, 56, 22, 88); p.quadraticCurveTo(28, 64, 38, 52); p.closePath(); } pinta(x, p, c); }
  if (e === 'coque' && v !== 'f') pinta(x, pEl(v === 'l' ? 36 : 50, v === 'l' ? 30 : 30, 9, 8.5), c);
}
function cabeloFrente(x, sp, v) {
  const c = sp.corCab, e = sp.estilo, { cx, cy, rx, ry } = CAB;
  const cabeca = pEl(cx + (v === 'l' ? 2 : 0), cy, (v === 'l' ? rx - 1.5 : rx) + 0.6, ry + 0.6);
  if (e === 'raspado' || e === 'moicano') { // lados raspados
    x.save(); x.clip(cabeca); x.fillStyle = bMix(c, sp.pele, 0.55); x.globalAlpha = 0.75; const p = P(); p.ellipse(cx, cy - 6, rx + 2, ry - 3, 0, Math.PI, 0); p.lineTo(cx + rx + 2, cy - 2); p.lineTo(cx - rx - 2, cy - 2); x.fill(p); x.restore();
  }
  if (v === 'c') { // de costas: cabelo cobre a nuca
    if (e === 'raspado' || e === 'moicano') { x.save(); x.clip(cabeca); x.fillStyle = bMix(c, sp.pele, 0.55); x.globalAlpha = 0.75; x.fillRect(0, 0, 100, cy + 14); x.restore(); }
    else {
      const p = P(); p.ellipse(cx, cy - 2, rx + 1.5, ry + 1, 0, Math.PI, 0); p.lineTo(cx + rx + 1, cy + 10); p.quadraticCurveTo(cx + 12, cy + 16, cx, cy + 14); p.quadraticCurveTo(cx - 12, cy + 16, cx - rx - 1, cy + 10); p.closePath();
      pinta(x, p, c);
      if (e === 'cacheado' || e === 'black') { x.save(); x.clip(p); x.strokeStyle = bEsc(c, 0.3); x.lineWidth = 1.3; const r = mulberry(5); for (let i = 0; i < 22; i++) { x.beginPath(); x.arc(28 + r() * 44, 30 + r() * 34, 3 + r() * 2, r() * 6, r() * 6 + 3.5); x.stroke(); } x.restore(); }
      else { x.save(); x.clip(p); traco(x, () => { for (let i = -3; i <= 3; i++) { x.moveTo(cx + i * 2, cy - 18); x.quadraticCurveTo(cx + i * 6, cy - 2, cx + i * 7.5, cy + 12); } }, bEsc(c, 0.28), 1.2); x.restore(); }
      if (e === 'longo') { const q = P(); q.moveTo(28, 60); q.quadraticCurveTo(24, 84, 32, 100); q.lineTo(68, 100); q.quadraticCurveTo(76, 84, 72, 60); q.closePath(); pinta(x, q, c); traco(x, () => { for (let i = -2; i <= 2; i++) { x.moveTo(50 + i * 7, 64); x.lineTo(50 + i * 8, 98); } }, bEsc(c, 0.25), 1.2); }
      if (e === 'rabo') { const q = P(); q.moveTo(46, 58); q.quadraticCurveTo(50, 80, 46, 94); q.quadraticCurveTo(56, 82, 54, 58); q.closePath(); pinta(x, q, c); }
      if (e === 'coque') pinta(x, pEl(50, 30, 9, 8.5), c);
      if (e === 'anime') { const q = P(); for (let i = -2; i <= 2; i++) { q.moveTo(cx + i * 9 - 5, cy - 16); q.lineTo(cx + i * 11, cy - 30 - (2 - Math.abs(i)) * 3); q.lineTo(cx + i * 9 + 5, cy - 16); } pinta(x, q, c); }
    }
    if (e === 'moicano') { const q = P(); q.moveTo(46, 28); q.quadraticCurveTo(50, 18, 54, 28); q.lineTo(53, 66); q.lineTo(47, 66); q.closePath(); pinta(x, q, c); }
    return;
  }
  if (e === 'raspado') return;
  if (e === 'moicano') { const q = P(); if (v === 'f') { q.moveTo(45, 44); q.lineTo(44, 30); q.quadraticCurveTo(50, 12, 56, 30); q.lineTo(55, 44); q.quadraticCurveTo(50, 40, 45, 44); } else { q.moveTo(70, 42); q.quadraticCurveTo(66, 24, 50, 22); q.quadraticCurveTo(30, 22, 30, 40); q.lineTo(36, 36); q.quadraticCurveTo(52, 30, 70, 42); } pinta(x, q, c); return; }
  // "capacete" de cabelo no alto da cabeça
  const p = P();
  if (v === 'f') {
    p.moveTo(cx - rx - 1.5, cy + 6); p.bezierCurveTo(cx - rx - 4, cy - 20, cx - 12, cy - ry - 5, cx, cy - ry - 4); p.bezierCurveTo(cx + 12, cy - ry - 5, cx + rx + 4, cy - 20, cx + rx + 1.5, cy + 6);
    // franja
    if (e === 'curto' || e === 'topete' || e === 'cacheado' || e === 'black') { p.lineTo(cx + rx - 3, cy - 4); p.quadraticCurveTo(cx + 14, cy - 12, cx + 8, cy - 9); p.quadraticCurveTo(cx + 3, cy - 14, cx - 2, cy - 9); p.quadraticCurveTo(cx - 8, cy - 14, cx - 12, cy - 8); p.quadraticCurveTo(cx - 18, cy - 10, cx - rx + 3, cy - 3); }
    else if (e === 'undercut') { p.lineTo(cx + rx - 2, cy - 2); p.quadraticCurveTo(cx + 4, cy - 2, cx - 10, cy - 12); p.quadraticCurveTo(cx - 18, cy - 12, cx - rx + 3, cy - 6); }
    else if (e === 'anime') { p.lineTo(cx + rx - 2, cy - 2); for (let i = 3; i >= -3; i--) { p.lineTo(cx + i * 6.5 + 3, cy - 12); p.lineTo(cx + i * 6.5, cy - 2 - (i % 2 ? 3 : 0)); } p.lineTo(cx - rx + 2, cy - 3); }
    else { p.lineTo(cx + rx - 2, cy - 3); p.quadraticCurveTo(cx + 6, cy - 16, cx, cy - 13); p.quadraticCurveTo(cx - 6, cy - 16, cx - rx + 2, cy - 3); } // longo, coque, rabo: risca no meio
    p.closePath();
  } else { // lado (olhando para a direita): cabelo cobre a parte de trás e o topo
    p.moveTo(cx + rx - 1, cy - 6); p.bezierCurveTo(cx + rx - 2, cy - ry - 6, cx - 14, cy - ry - 6, cx - rx + 1, cy - 6); p.quadraticCurveTo(cx - rx - 2, cy + 8, cx - 16, cy + 16); p.lineTo(cx - 6, cy + 10); p.quadraticCurveTo(cx - 2, cy - 2, cx + 4, cy - 8);
    if (e === 'curto' || e === 'cacheado' || e === 'topete' || e === 'black' || e === 'anime') { p.quadraticCurveTo(cx + 12, cy - 4, cx + 16, cy - 10); p.quadraticCurveTo(cx + 20, cy - 6, cx + rx - 1, cy - 6); }
    else p.quadraticCurveTo(cx + 14, cy - 12, cx + rx - 1, cy - 6);
    p.closePath();
  }
  pinta(x, p, c);
  // cachos por cima
  if (e === 'cacheado' || e === 'black') { x.save(); x.clip(p); x.strokeStyle = bEsc(c, 0.3); x.lineWidth = 1.3; const r = mulberry(3); for (let i = 0; i < 16; i++) { x.beginPath(); x.arc(26 + r() * 48, 26 + r() * 22, 2.6 + r() * 2, r() * 6, r() * 6 + 3.5); x.stroke(); } x.restore(); }
  if (e === 'cacheado' && v === 'f') [[-22, -8], [22, -8], [-18, -18], [18, -18]].forEach(([a, b]) => pinta(x, pEl(cx + a, cy + b, 5.5, 5), c));
  if (e === 'topete') { const q = P(); if (v === 'f') { q.moveTo(38, 36); q.quadraticCurveTo(44, 16, 64, 22); q.quadraticCurveTo(58, 30, 60, 38); q.closePath(); } else { q.moveTo(52, 32); q.quadraticCurveTo(64, 14, 78, 30); q.quadraticCurveTo(70, 32, 70, 40); q.closePath(); } pinta(x, q, c); }
  if (e === 'coque' && v === 'f') pinta(x, pEl(50, 28, 9, 8), c);
  if (e === 'anime' && v === 'l') { const q = P(); for (let i = 0; i < 4; i++) { q.moveTo(30 + i * 9, 34); q.lineTo(24 + i * 9, 18 - (i % 2) * 4); q.lineTo(38 + i * 9, 32); } pinta(x, q, c); }
  if (v === 'f' && (e === 'longo' || e === 'rabo' || e === 'coque' || e === 'undercut')) { // mechas nas laterais
    const q = P(); q.moveTo(cx - rx - 1.5, cy); q.quadraticCurveTo(cx - rx + 2, cy + 16, cx - rx + 5, cy + 22); q.lineTo(cx - rx + 6, cy); q.closePath();
    if (e === 'longo') { q.moveTo(cx + rx + 1.5, cy); q.quadraticCurveTo(cx + rx - 2, cy + 16, cx + rx - 5, cy + 22); q.lineTo(cx + rx - 6, cy); q.closePath(); }
    pinta(x, q, c);
  }
  brilho(x, cx - 10, cy - ry + 3, 5, 0.28);
}

/* ---------- acessórios ---------- */
function chapeu(x, sp, v) {
  const h = sp.chapeu; if (!h) return; const { cx, cy, ry } = CAB; const topo = cy - ry;
  const ouro = '#f2c230';
  if (h === 'bone') {
    const dome = P(); dome.ellipse(cx + (v === 'l' ? 1 : 0), topo + 13, 24.5, 15, 0, Math.PI, 0); dome.closePath(); pinta(x, dome, '#d9423a');
    if (v === 'f') { const aba = P(); aba.moveTo(26, topo + 13); aba.quadraticCurveTo(50, topo + 24, 74, topo + 13); aba.quadraticCurveTo(50, topo + 18, 26, topo + 13); pinta(x, aba, bEsc('#d9423a', 0.15)); pinta(x, pEl(50, topo + 5, 4, 2.4), '#ffffff', { lw: 1.2 }); }
    if (v === 'l') pinta(x, pRR(58, topo + 10, 24, 5, 2.5), bEsc('#d9423a', 0.12));
    if (v === 'c') traco(x, () => { x.moveTo(44, topo + 12); x.lineTo(56, topo + 12); }, '#f4f4f4', 1.8);
  } else if (h === 'faixa') {
    const b = P(); b.rect(cx - 26, topo + 11, 52, 6.5); x.save(); x.clip(pEl(cx + (v === 'l' ? 2 : 0), cy, 25.5, 23.5)); pinta(x, b, '#e02a2a'); x.restore();
    if (v === 'c' || v === 'l') { const q = P(); const bx = v === 'c' ? 50 : 30; q.moveTo(bx, topo + 15); q.lineTo(bx - 7, topo + 30); q.lineTo(bx - 2, topo + 29); q.lineTo(bx + 1, topo + 17); q.moveTo(bx, topo + 15); q.lineTo(bx + 6, topo + 29); q.lineTo(bx + 2, topo + 30); pinta(x, q, '#c21e1e', { lw: 1.5 }); }
  } else if (h === 'gorro') {
    const p = P(); p.ellipse(cx, topo + 14, 25, 17, 0, Math.PI, 0); p.closePath(); pinta(x, p, '#3a6ae0'); pinta(x, pRR(cx - 25.5, topo + 10, 51, 7, 3), '#f0f0f0'); pinta(x, pEl(cx, topo - 4, 5, 5), '#f0f0f0');
  } else if (h === 'coroa' || h === 'louros' || h === 'espartano') {
    if (h === 'coroa') { const p = P(); const b = topo + 6; p.moveTo(34, b); p.lineTo(35, b - 12); p.lineTo(42, b - 5); p.lineTo(50, b - 15); p.lineTo(58, b - 5); p.lineTo(65, b - 12); p.lineTo(66, b); p.closePath(); pinta(x, p, ouro); [[50, b - 4, '#e0304a'], [41, b - 3, '#3a8ae0'], [59, b - 3, '#3a8ae0']].forEach(([a, bb, cc]) => pinta(x, pEl(a, bb, 2, 2), cc, { lw: 1 })); }
    if (h === 'louros') { for (let i = 0; i < 7; i++) { const an = Math.PI + 0.35 + i * 0.4; pinta(x, pEl(cx + Math.cos(an) * 23, cy - 6 + Math.sin(an) * 20, 4.5, 2.4), '#5aae3a', { lw: 1.2 }); } }
    if (h === 'espartano') { const p = P(); p.ellipse(cx, topo + 14, 26, 18, 0, Math.PI, 0); p.lineTo(cx + 26, topo + 26); p.lineTo(cx + 18, topo + 26); p.lineTo(cx + 18, topo + 14); p.lineTo(cx - 18, topo + 14); p.lineTo(cx - 18, topo + 26); p.lineTo(cx - 26, topo + 26); p.closePath(); pinta(x, p, ouro); const cr = P(); cr.moveTo(cx - 3, topo - 2); cr.quadraticCurveTo(cx - 14, topo - 16, cx - 22, topo - 10); cr.quadraticCurveTo(cx + 2, topo - 26, cx + 22, topo - 10); cr.quadraticCurveTo(cx + 14, topo - 16, cx + 3, topo - 2); pinta(x, cr, '#d42a2a'); }
  } else if (h === 'cartola') {
    pinta(x, pRR(cx - 30, topo + 8, 60, 6, 3), '#1e1a22'); pinta(x, pRR(cx - 17, topo - 22, 34, 32, 3), '#1e1a22'); pinta(x, pRR(cx - 17, topo + 1, 34, 5, 1), '#c02a3a', { lw: 1.3 });
  } else if (h === 'panama' || h === 'palha') {
    const cor = h === 'palha' ? '#e8c878' : '#f0ead8';
    pinta(x, pEl(cx + (v === 'l' ? 3 : 0), topo + 12, v === 'l' ? 30 : 34, 6.5), cor); const p = P(); p.ellipse(cx, topo + 10, 19, 16, 0, Math.PI, 0); p.closePath(); pinta(x, p, cor); pinta(x, pRR(cx - 19, topo + 5, 38, 4.5, 1), h === 'palha' ? '#c0503a' : '#2a2a3a', { lw: 1.2 });
  } else if (h === 'headset') {
    traco(x, () => { x.ellipse(cx, cy - 2, 26, 25, 0, Math.PI + 0.15, -0.15); }, '#2a2a34', 3.5);
    const cup = (a) => pinta(x, pRR(a - 4, cy - 2, 8, 13, 3.5), '#7a4ae0');
    if (v === 'f' || v === 'c') { cup(cx - 25); cup(cx + 25); } else cup(cx - 3);
    if (v === 'f') traco(x, () => { x.moveTo(cx - 24, cy + 10); x.quadraticCurveTo(cx - 20, cy + 18, cx - 10, cy + 16); }, '#2a2a34', 1.6);
  }
}
function pescoco(x, sp, v) {
  const n = sp.pescoco; if (!n || v === 'c' && n !== 'cachecol') return;
  const lx = v === 'l' ? 54 : 50;
  if (n === 'apito' || n === 'medalha') {
    traco(x, () => { x.moveTo(lx - 6, 79); x.lineTo(lx, 89); x.lineTo(lx + 6, 79); }, n === 'medalha' ? '#3a6ae0' : '#e03a3a', 1.6);
    if (n === 'apito') pinta(x, pRR(lx - 3, 88, 7, 4.5, 2), '#c8c8d0', { lw: 1.2 }); else { pinta(x, pEl(lx, 92, 4.2, 4.2), '#f2c230', { lw: 1.3 }); x.fillStyle = '#fff6c0'; x.beginPath(); x.arc(lx - 1, 91, 1.2, 0, 7); x.fill(); }
  }
  if (n === 'gravata') { const p = P(); p.moveTo(lx - 2.2, 80); p.lineTo(lx + 2.2, 80); p.lineTo(lx + 3, 95); p.lineTo(lx, 99); p.lineTo(lx - 3, 95); p.closePath(); pinta(x, p, '#c02a3a', { lw: 1.4 }); }
  if (n === 'cachecol') { pinta(x, pRR(v === 'l' ? 40 : 37, 76, v === 'l' ? 22 : 26, 6, 3), '#e03a3a'); if (v !== 'c') pinta(x, pRR(v === 'l' ? 45 : 54, 80, 5, 13, 2), '#e03a3a', { lw: 1.5 }); x.fillStyle = '#ffffff'; x.fillRect(v === 'l' ? 45 : 54, 86, 5, 2); }
  if (n === 'havaiano') { const cores = ['#ff5ab0', '#ffd23f', '#5ad8ff', '#ff8a3a', '#b07aff']; for (let i = 0; i < 7; i++) { const an = 0.2 + i * (Math.PI - 0.4) / 6; pinta(x, pEl(lx + Math.cos(an) * (v === 'l' ? 9 : 13), 79 + Math.sin(an) * 8, 2.8, 2.8), cores[i % 5], { lw: 1 }); } }
}
function naMao(x, sp, hx, hy) {
  const m = sp.mao; if (!m) return;
  if (m === 'bola') { pinta(x, pEl(hx, hy - 2, 6, 6), '#ffffff', { lw: 1.6 }); x.fillStyle = '#2a2230'; x.beginPath(); for (let i = 0; i < 5; i++) { const an = -Math.PI / 2 + i * 2 * Math.PI / 5; x.lineTo(hx + Math.cos(an) * 2.2, hy - 2 + Math.sin(an) * 2.2); } x.fill(); }
  if (m === 'livro') pinta(x, pRR(hx - 5, hy - 8, 10, 12, 1.5), '#3a6ae0', { lw: 1.4 });
  if (m === 'pipoca') { pinta(x, pRR(hx - 4.5, hy - 6, 9, 10, 1), '#e03a3a', { lw: 1.3 }); x.fillStyle = '#fff4c0'; [[-2, -7], [1.5, -8], [3, -6], [-3.5, -5.5]].forEach(([a, b]) => { x.beginPath(); x.arc(hx + a, hy + b, 2, 0, 7); x.fill(); }); }
  if (m === 'microfone') { pinta(x, pRR(hx - 1.5, hy - 6, 3, 10, 1), '#3a3a44', { lw: 1.2 }); pinta(x, pEl(hx, hy - 8, 3.4, 3.4), '#b8b8c8', { lw: 1.2 }); }
  if (m === 'martelo') { pinta(x, pRR(hx - 1.3, hy - 12, 2.6, 16, 1), '#8a5a3a', { lw: 1.2 }); pinta(x, pRR(hx - 6, hy - 15, 12, 5, 1.5), '#8a8a98', { lw: 1.3 }); }
  if (m === 'estatueta') { const o = '#f2c230'; pinta(x, pRR(hx - 4, hy - 1, 8, 4, 1), '#6a4a2a', { lw: 1.1 }); pinta(x, pRR(hx - 1.5, hy - 8, 3, 8, 1), o, { lw: 1.1 }); pinta(x, pEl(hx, hy - 11, 5, 4), o, { lw: 1.2 }); }
}
function costasTras(x, sp, v) { // o que fica atrás do corpo (capa, asas; mochila vista de frente/lado)
  const k = sp.costas; if (!k) return;
  if (k === 'capa') { const p = P(); if (v === 'l') { p.moveTo(44, 80); p.quadraticCurveTo(26, 100, 24, 124); p.lineTo(42, 122); p.lineTo(50, 82); } else { p.moveTo(36, 80); p.lineTo(64, 80); p.lineTo(70, 126); p.quadraticCurveTo(50, 130, 30, 126); p.closePath(); } pinta(x, p, '#c02a3a'); }
  if (k === 'anjo') { const asa = (s) => { const p = P(); p.moveTo(50 + s * 6, 84); p.quadraticCurveTo(50 + s * 30, 66, 50 + s * 40, 76); p.quadraticCurveTo(50 + s * 34, 84, 50 + s * 38, 92); p.quadraticCurveTo(50 + s * 26, 94, 50 + s * 28, 102); p.quadraticCurveTo(50 + s * 16, 100, 50 + s * 6, 94); p.closePath(); pinta(x, p, '#fafaff'); }; if (v === 'l') asa(-1); else { asa(-1); asa(1); } }
  if (k === 'mochila' && v === 'l') pinta(x, pRR(30, 82, 12, 22, 4), '#f08a3a');
}
function costasFrente(x, sp, v) { // alças da mochila (frente) e mochila (costas)
  if (sp.costas !== 'mochila') return;
  if (v === 'f') { pinta(x, pRR(38.5, 80, 4, 20, 2), '#f08a3a', { lw: 1.4 }); pinta(x, pRR(57.5, 80, 4, 20, 2), '#f08a3a', { lw: 1.4 }); }
  if (v === 'c') { pinta(x, pRR(38, 82, 24, 26, 5), '#f08a3a'); pinta(x, pRR(41, 94, 18, 10, 3), bEsc('#f08a3a', 0.12), { lw: 1.6 }); traco(x, () => { x.moveTo(42, 94); x.lineTo(58, 94); }, '#ffd23f', 1.3); }
  if (v === 'l') pinta(x, pRR(44, 80, 4, 20, 2), '#f08a3a', { lw: 1.4 });
}

/* ---------- montagem por vista e quadro ---------- */
// passos: 0 e 2 = pernas abertas, 1 e 3 = passagem (uma perna no alto)
function desenhaBonecoEm(x, look, v, q) {
  const sp = specDe(look);
  const m = manga(sp);
  const passo = [0, 1, 0, -1][q] || 0;          // frente/costas: qual perna sobe
  const ab = [1, 0, -1, 0][q] || 0;             // lado: abertura das pernas
  x.save(); x.translate(0, 0);
  costasTras(x, sp, v);
  cabeloTras(x, sp, v === 'c' ? 'c' : v);
  if (v === 'l') {
    const aP = ab * 0.42, aB = -ab * 0.5;
    braco(x, sp, 47, 82, aB + 0.05, 17, true, m);              // braço de trás (mais escuro)
    perna(x, sp, 48, 112, -aP, 20 - (q % 2 ? 2.5 : 0), true, true); // perna de trás
    quadril(x, sp, 'l');
    perna(x, sp, 52, 112, aP, 20, true, false);                 // perna da frente
    tronco(x, sp, 'l');
    pinta(x, pRR(46, 74, 9, 8, 2), sp.pele, { linha: false });   // pescoço
    costasFrente(x, sp, 'l');
    pescoco(x, sp, 'l');
    braco(x, sp, 53, 82, -aB - 0.05, 17, false, m);            // braço da frente
    naMao(x, sp, 53 + Math.sin(aB + 0.05) * 18.5, 82 + Math.cos(aB + 0.05) * 18.5);
    cabecaBase(x, sp, 'l'); rosto(x, sp, 'l'); rostoAcess(x, sp, 'l'); cabeloFrente(x, sp, 'l'); chapeu(x, sp, 'l');
  } else {
    const costas = v === 'c';
    const sobeE = passo > 0 ? 3.5 : 0, sobeD = passo < 0 ? 3.5 : 0;
    perna(x, sp, 45, 112 - sobeE, 0.04, 20, false, false);
    perna(x, sp, 55, 112 - sobeD, -0.04, 20, false, false);
    quadril(x, sp, v);
    const balE = passo * 0.22, balD = -passo * 0.22;
    braco(x, sp, 35.5, 82, 0.28 + balE * (costas ? -1 : 1), 17, false, m);
    braco(x, sp, 64.5, 82, -0.28 + balD * (costas ? -1 : 1), 17, false, m);
    tronco(x, sp, v);
    pinta(x, pRR(45.5, 73, 9, 9, 2), sp.pele, { linha: false });
    if (!costas) { costasFrente(x, sp, 'f'); pescoco(x, sp, 'f'); naMao(x, sp, 69.5 - 0.28 * 18, 82 + 18.5); }
    else { costasFrente(x, sp, 'c'); pescoco(x, sp, 'c'); }
    cabecaBase(x, sp, v);
    if (!costas) { rosto(x, sp, 'f'); rostoAcess(x, sp, 'f'); }
    cabeloFrente(x, sp, costas ? 'c' : 'f'); chapeu(x, sp, costas ? 'c' : 'f');
  }
  x.restore();
}

/* ---------- cache de sprites ---------- */
const BON_CACHE = new Map(); const BON_MAX = 260;
function chaveBoneco(look) { return look._kb || (look._kb = JSON.stringify(look)); }
function caixaBoneco(look) { // recorte comum a todas as vistas: pelo quadro de frente parado, com folga
  const k = chaveBoneco(look) + '|box'; if (BON_CACHE.has(k)) return BON_CACHE.get(k);
  const S = 1, c = mkCanvas(BON.W, BON.H), x = c.getContext('2d'); desenhaBonecoEm(x, look, 'f', 0);
  let x0 = BON.W, y0 = BON.H, x1 = 0, y1 = 0; const d = x.getImageData(0, 0, BON.W, BON.H).data;
  for (let y = 0; y < BON.H; y++) for (let xx = 0; xx < BON.W; xx++) if (d[(y * BON.W + xx) * 4 + 3] > 30) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const box = [Math.max(0, Math.min(x0, 22) - 6), Math.max(0, y0 - 3), 0, 0]; box[2] = Math.min(BON.W, Math.max(x1, 78) + 6) - box[0]; box[3] = Math.min(BON.H, y1 + 3) - box[1];
  BON_CACHE.set(k, box); return box;
}
function spriteVetor(look, vista = "frente", q = 0) { // desenho vetorial (reserva enquanto as folhas carregam)
  const v = vista === 'costas' ? 'c' : vista === 'lado' ? 'l' : 'f';
  const k = chaveBoneco(look) + '|' + v + q;
  const hit = BON_CACHE.get(k); if (hit) { BON_CACHE.delete(k); BON_CACHE.set(k, hit); return hit; } // LRU
  const [bx, by, bw, bh] = caixaBoneco(look); const S = BON.S;
  const c = mkCanvas(Math.ceil(bw * S), Math.ceil(bh * S)), x = c.getContext('2d');
  x.scale(S, S); x.translate(-bx, -by); desenhaBonecoEm(x, look, v, q);
  const res = { c };
  BON_CACHE.set(k, res);
  if (BON_CACHE.size > BON_MAX) { const primeiro = BON_CACHE.keys().next().value; BON_CACHE.delete(primeiro); }
  return res;
}

/* ---------- substitui o sistema antigo (peças do site) ---------- */
function compoe(look) { return look && look.tipo !== 'bicho' ? spriteBoneco(look, 'frente', 0) : null; }
function compoeVista(look, vista) { return spriteBoneco(look, vista, 0); }
function camadasDe() { return []; }
function preCarrega() { }
// retrato (tela de criação e onde mais for usado): fundo + personagem de frente
const FUNDOS_B = { 'fundo-quarto': ['#f6d8a8', '#e8b878'], 'fundo-estadio': ['#7ad06a', '#2f8a3a'], 'fundo-roxo': ['#b07aff', '#5a2ad9'], 'fundo-galaxia': ['#3a2a8a', '#0a0a2a'] };
function montaRetrato(alvo, cfg, aura) {
  alvo.innerHTML = '';
  if (aura) alvo.append(el('span', { class: 'aura' }));
  const c = mkCanvas(300, 400); c.style.width = '100%'; c.style.height = '100%'; c.style.objectFit = 'contain'; const x = c.getContext('2d');
  const f = FUNDOS_B[cfg.fundo]; if (f) { const g = x.createLinearGradient(0, 0, 0, 400); g.addColorStop(0, f[0]); g.addColorStop(1, f[1]); x.fillStyle = g; x.fillRect(0, 0, 300, 400); }
  const s = spriteBoneco({ tipo: 'humano', ...cfg, fundo: undefined }, 'frente', 0).c; const h = 360, w = h * s.width / s.height; x.drawImage(s, 150 - w / 2, 395 - h, w, h);
  alvo.append(c);
}

// mais penteados na criação de personagem (agora que o desenho é nosso)
[['cabelo-rabo', 'Rabo de cavalo'], ['cabelo-moicano', 'Moicano'], ['cabelo-topete', 'Topete'], ['cabelo-undercut', 'Undercut'], ['cabelo-anime', 'Espetado'], ['cabelo-raspado', 'Raspado']]
  .forEach(([id, nome]) => { if (!AVATAR.cabelos.some(c => c.id === id)) AVATAR.cabelos.push({ id, nome, estilo: id.replace('cabelo-', ''), cor: CAB_PADRAO[id] || '#3a2a20' }); });

/* ============================================================
   SPRITES DESENHADOS (Higgsfield): folhas 4x3 por penteado/roupa,
   com cores-chave (cabelo magenta, camisa verde, shorts azul) que
   são trocadas pelas cores de cada personagem. Acessórios (boné,
   faixa, óculos, apito, mochila...) entram por cima, posicionados
   pela cabeça/tronco de cada pose (META_BONECOS, gerado no recorte).
   ============================================================ */
const FOLHA_CW = 200, FOLHA_CH = 290;
const FOLHAS = {};
function carregaFolhas() {
  if (typeof META_BONECOS === 'undefined') return;
  for (const nome in META_BONECOS) { if (FOLHAS[nome]) continue; const im = new Image(); const f = FOLHAS[nome] = { im, ok: false, rot: null }; im.onload = () => { f.ok = true; }; im.src = `a/boneco_${nome}.webp`; }
}
carregaFolhas();
function folhaDoLook(sp, look) {
  const r = look.roupa || '';
  const tem = n => typeof META_BONECOS !== 'undefined' && META_BONECOS[n];
  // folhas de roupa (terno, agasalho, saia) já vêm com cabelo curto/coque: só servem se o penteado combinar
  const curtoFam = ['curto', 'topete', 'anime', 'undercut', 'raspado'].includes(sp.estilo);
  if (/terno|smoking/.test(r) && curtoFam && !sp.f && tem('terno')) return 'terno';
  if (/moletom|jaleco|couro/.test(r) && curtoFam && !sp.f && (look.alt || 1.4) >= 1.7 && tem('treinador')) return 'treinador';
  if (sp.baixo === 'saia' && sp.f && (sp.estilo === 'coque' || curtoFam) && tem('saia')) return 'saia';
  const porEstilo = { curto: 'curto', topete: 'curto', anime: 'curto', undercut: 'curto', raspado: 'curto', cacheado: 'cacheado', longo: 'longo', coque: 'coque', black: 'black', moicano: 'moicano', rabo: 'rabo' };
  let n = porEstilo[sp.estilo] || 'curto'; if (!tem(n)) n = 'curto';
  return ajustaGenero(n, sp);
}
// menino nunca usa as folhas "de menina" e vice-versa (cacheado e black power servem para os dois)
const FOLHAS_FEM = ['longo', 'coque', 'rabo', 'saia'], FOLHAS_MASC = ['curto', 'moicano', 'terno', 'treinador'];
function ajustaGenero(n, sp) {
  if (!sp.f && FOLHAS_FEM.includes(n)) return 'curto';
  if (sp.f && FOLHAS_MASC.includes(n)) return 'rabo';
  return n;
}
// rótulo de cada pixel (1 cabelo, 2 camisa, 3 shorts, 4 pele) — calculado 1 vez por célula da folha
function rotulaCelula(f, idx) {
  f.rot = f.rot || {}; if (f.rot[idx]) return f.rot[idx];
  const c = mkCanvas(FOLHA_CW, FOLHA_CH), x = c.getContext('2d'); const col = idx % 4, lin = Math.floor(idx / 4);
  x.drawImage(f.im, col * FOLHA_CW, lin * FOLHA_CH, FOLHA_CW, FOLHA_CH, 0, 0, FOLHA_CW, FOLHA_CH);
  const d = x.getImageData(0, 0, FOLHA_CW, FOLHA_CH).data, n = FOLHA_CW * FOLHA_CH;
  const rot = new Uint8Array(n), lum = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const r = d[i * 4] / 255, g = d[i * 4 + 1] / 255, b = d[i * 4 + 2] / 255, a = d[i * 4 + 3]; if (a < 20) continue;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), dd = mx - mn + 1e-6, s = mx ? (mx - mn) / mx : 0;
    let h = mx === r ? ((g - b) / dd) % 6 : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; h *= 60; if (h < 0) h += 360;
    lum[i] = mx;
    if (s > 0.3 && mx > 0.18 && h >= 268 && h <= 345) rot[i] = 1;
    else if (s > 0.3 && mx > 0.15 && h >= 80 && h <= 165) rot[i] = 2;
    else if (s > 0.35 && mx > 0.15 && h >= 195 && h <= 255) rot[i] = 3;
    else if (h >= 4 && h <= 46 && s > 0.18 && s < 0.8 && mx > 0.36) rot[i] = 4;
  }
  // brilho de referência de cada grupo (mediana), para manter o sombreado
  const ref = [0, 0, 0, 0, 0];
  for (let k = 1; k <= 4; k++) { const v = []; for (let i = 0; i < n; i += 3) if (rot[i] === k) v.push(lum[i]); v.sort((a, b) => a - b); ref[k] = v.length ? v[v.length >> 1] : 0.5; }
  return f.rot[idx] = { c, d, rot, lum, ref };
}
function tingeCelula(base, cores) {
  const { c, d, rot, lum, ref } = base; const out = mkCanvas(FOLHA_CW, FOLHA_CH), x = out.getContext('2d');
  const img = x.createImageData(FOLHA_CW, FOLHA_CH), o = img.data; o.set(d);
  const alvo = cores.map(cc => cc ? bRgb(cc) : null);
  for (let i = 0; i < rot.length; i++) {
    const k = rot[i]; if (!k || !alvo[k]) continue;
    const f = lum[i] / (ref[k] || 0.5), t = alvo[k];
    for (let j = 0; j < 3; j++) o[i * 4 + j] = f <= 1 ? t[j] * f : Math.min(255, t[j] + (255 - t[j]) * (f - 1) * 0.9);
  }
  x.putImageData(img, 0, 0); return out;
}
// transforma o desenho vetorial dos acessórios para a cabeça/tronco da pose
function comAcessorios(x, sp, v, meta, fase) {
  if (!meta) return;
  const cab = meta.cabeca, tr = meta.tronco;
  if (fase === 'tras' && tr && sp.costas && sp.costas !== 'mochila') { const kb = (tr[2] - tr[0]) / 29; x.save(); x.translate((tr[0] + tr[2]) / 2, tr[1]); x.scale(kb, kb); x.translate(-50, -80); costasTras(x, sp, v); x.restore(); }
  if (fase !== 'frente') return;
  if (tr) { const kb = (tr[2] - tr[0]) / (v === 'l' ? 21 : 29); x.save(); x.translate((tr[0] + tr[2]) / 2, tr[1]); x.scale(kb, kb); x.translate(-50, -80); if (sp.costas === 'mochila') { if (v === 'l') costasTras(x, sp, 'l'); costasFrente(x, sp, v); } pescoco(x, sp, v); x.restore(); }
  if (cab && (sp.chapeu || sp.rosto)) {
    const k = (cab[2] - cab[0]) / 54; const cx = (cab[0] + cab[2]) / 2 + (v === 'l' ? -2 * k : 0);
    x.save(); x.translate(cx, cab[1]); x.scale(k, k); x.translate(-50, -27);
    if (sp.rosto) { x.save(); x.translate(50, 63); x.scale(1.25, 1.25); x.translate(-50, -55); rostoAcess(x, sp, v); x.restore(); } // os olhos dos bonecos novos ficam mais baixos e maiores
    chapeu(x, sp, v); x.restore();
  }
}
const SPR_CACHE = new Map(); const SPR_MAX = 220; // celular: cada sprite pronto ocupa ~180 kB
function spriteBoneco(look, vista = 'frente', q = 0) {
  const sp = specDe(look); const nome = folhaDoLook(sp, look); const f = FOLHAS[nome];
  if (!f || !f.ok) { carregaFolhas(); return spriteVetor(look, vista, q); }
  const v = vista === 'costas' ? 'c' : vista === 'lado' ? 'l' : 'f';
  const k = chaveBoneco(look) + '|S' + v + q; const hit = SPR_CACHE.get(k); if (hit) { SPR_CACHE.delete(k); SPR_CACHE.set(k, hit); return hit; }
  const lin = v === 'f' ? 0 : v === 'l' ? 1 : 2, idx = lin * 4 + (q % 4);
  const base = rotulaCelula(f, idx); const meta = (META_BONECOS[nome] || [])[idx];
  const tingida = tingeCelula(base, [null, sp.corCab, sp.corRoupa, sp.corBaixo, sp.pele]);
  const c = mkCanvas(FOLHA_CW, FOLHA_CH), x = c.getContext('2d');
  comAcessorios(x, sp, v, meta, 'tras'); x.drawImage(tingida, 0, 0); comAcessorios(x, sp, v, meta, 'frente');
  // recorta a caixa útil (mesma em todas as poses da folha): do alto do cabelo/chapéu até os pés
  const topo = Math.max(0, Math.min(...(META_BONECOS[nome] || []).filter(Boolean).map(m => m.cabeca ? m.cabeca[1] : 20)) - ({ coroa: 40, cartola: 50, espartano: 48, louros: 22 }[sp.chapeu] || (sp.chapeu ? 26 : 4)));
  const cc = mkCanvas(FOLHA_CW - 20, FOLHA_CH - topo); cc.getContext('2d').drawImage(c, 10, topo, FOLHA_CW - 20, FOLHA_CH - topo, 0, 0, FOLHA_CW - 20, FOLHA_CH - topo);
  const res = { c: cc }; SPR_CACHE.set(k, res); if (SPR_CACHE.size > SPR_MAX) SPR_CACHE.delete(SPR_CACHE.keys().next().value);
  return res;
}

/* ---------- gênero pelo nome: "Dona", "Sr.", "Lady", "Herr", nomes próprios... ---------- */
const NOMES_FEM_B = new Set(['lúcia', 'cida', 'neide', 'bia', 'zuzu', 'luana', 'amália', 'fátima', 'carmen', 'nour', 'yuki', 'layla', 'sofia', 'giulia', 'helga', 'greta', 'margaret', 'marlene', 'cotinha', 'vitória', 'nefertari', 'sakura', 'dolores', 'pilar',
  'nina', 'duda', 'mari', 'juju', 'lari', 'tati', 'gabi', 'lelê', 'ana', 'júlia', 'clara', 'lia', 'malu', 'manu', 'isa', 'lara', 'bela', 'jade', 'luna', 'maya', 'sol', 'cris', 'dani', 'marta']);
const PALAVRAS_FEM = new Set(['dona', 'doña', 'ms.', 'lady', 'frau', 'nonna', 'madame', 'tia', 'vó', 'mãe', 'rainha', 'comissária', 'professora', 'capitã', 'treinadora', 'senhora', 'futevoleira', 'folgada', 'armadora', 'a']);
const PALAVRAS_MASC = new Set(['seu', 'sr.', 'sr', 'mr.', 'sir', 'herr', 'don', 'dom', 'dr.', 'senhor', 'engenheiro', 'mestre', 'tio', 'vô', 'rei', 'capitão', 'treinador', 'professor', 'il', 'o', 'moleque']);
function generoDoNome(nome) {
  const ps = String(nome || '').toLowerCase().replace(/[,!]/g, ' ').split(/\s+/).filter(Boolean);
  for (const p of ps) { if (PALAVRAS_FEM.has(p) || NOMES_FEM_B.has(p)) return 'f'; if (PALAVRAS_MASC.has(p)) return 'm'; }
  return null;
}
(function corrigeGeneros() {
  const aplica = (obj) => { if (!obj || !obj.look || obj.look.tipo === 'bicho' || obj.look.tipo && obj.look.tipo !== 'humano') return; const g = generoDoNome(obj.nome); if (g) { obj.look.corpo = g; delete obj.look._kb; } };
  for (const k in NPCS) aplica(NPCS[k]);
  for (const k in MONSTROS) aplica(MONSTROS[k]);
  if (typeof CARREIRA_CLUBES !== 'undefined') for (const k of CARREIRA_CLUBES) aplica(k.dirigente);
})();
