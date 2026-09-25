/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   RUMO AO CRAQUE — arte cartoon (sem pixel art)
   - chão desenhado com formas arredondadas
   - objetos vetoriais em alta resolução
   - personagens montados com as peças de avatar do site
   ============================================================ */
const T = 64;      // px de mundo por tile
const RES = 2;     // resolução extra dos sprites de objetos
const LINHA = '#3d2b3a';

function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
function hash2(x, y, s = 0) { let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hexRgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function rgbHex(r, g, b) { return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
function shade(hex, amt) { const [r, g, b] = hexRgb(hex); if (amt >= 0) return rgbHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt); return rgbHex(r * (1 + amt), g * (1 + amt), b * (1 + amt)); }
function mix(a, b, t) { const A = hexRgb(a), B = hexRgb(b); return rgbHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
function rgbHsl(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2; if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; } return [h, s, l]; }
function hslRgb(h, s, l) { if (!s) return [l * 255, l * 255, l * 255]; const f = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; }; const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; return [f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255]; }

// traços básicos (unidades de mundo)
function tracar(x, w = 2.4) { x.lineWidth = w; x.strokeStyle = LINHA; x.lineJoin = 'round'; x.lineCap = 'round'; }
function rr(x, X, Y, W, H, R, fill, lw = 2.4) { x.beginPath(); x.roundRect(X, Y, W, H, R); if (fill) { x.fillStyle = fill; x.fill(); } if (lw) { tracar(x, lw); x.stroke(); } }
function circ(x, cx, cy, r, fill, lw = 2.4) { x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); if (fill) { x.fillStyle = fill; x.fill(); } if (lw) { tracar(x, lw); x.stroke(); } }
function elip(x, cx, cy, rx, ry, fill, lw = 2.4) { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); if (fill) { x.fillStyle = fill; x.fill(); } if (lw) { tracar(x, lw); x.stroke(); } }
function sombra(x, cx, cy, rx, ry, a = 0.22) { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.fillStyle = `rgba(40,30,55,${a})`; x.fill(); }
function grad(x, x0, y0, x1, y1, c0, c1) { const g = x.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; }

/* ================= CHÃO ================= */
const CH = { GRAMA: 0, GRAMA_FLOR: 1, TERRA: 2, AREIA: 3, AGUA: 4, PEDRA: 5, MADEIRA: 6, CAMPO: 7, QUADRA: 8, PISO: 9, PISTA: 10, ASFALTO: 11, CALCADA: 12, CAMPO_TERRA: 13, CONCRETO: 14, AREIA_MOLHADA: 15, QUADRA_AZUL: 16 };
const CH_ANDA = t => t !== CH.AGUA;
const CH_MINI = { 0: '#86c75a', 1: '#8fcd62', 2: '#dcb57e', 3: '#f6e0a6', 4: '#4aa6e6', 5: '#c2bdb5', 6: '#cf9a5f', 7: '#5fbb58', 8: '#e8894c', 9: '#eef1f6', 10: '#d9684b', 11: '#5b5d68', 12: '#dedad4', 13: '#e2bd86', 14: '#c4c4cc', 15: '#e2c888', 16: '#4f7fe0' };
const ESTILO_CHAO = {
  [CH.TERRA]: { cor: '#dfb982', borda: '#b98c55', r: 0.4, e: 0.12, tex: 'terra', o: 1 },
  [CH.CAMPO_TERRA]: { cor: '#e4c08b', borda: '#b98c55', r: 0.08, e: 0.03, tex: 'terra', o: 2 },
  [CH.AREIA]: { cor: '#f7e2a9', borda: '#e0c283', r: 0.45, e: 0.14, tex: 'areia', o: 3 },
  [CH.AREIA_MOLHADA]: { cor: '#e8cf92', borda: '#d2b474', r: 0.45, e: 0.12, tex: 'areia', o: 4 },
  [CH.PEDRA]: { cor: '#cbc6be', borda: '#948f87', r: 0.14, e: 0.04, tex: 'pedra', o: 5 },
  [CH.CALCADA]: { cor: '#e2ded8', borda: '#aaa59e', r: 0, e: 0, tex: 'calcada', o: 6 },
  [CH.ASFALTO]: { cor: '#5e606c', borda: '#44464f', r: 0, e: 0, tex: 'asfalto', o: 7 },
  [CH.CONCRETO]: { cor: '#c8c8d0', borda: '#9a9aa4', r: 0, e: 0, tex: 'concreto', o: 8 },
  [CH.PISTA]: { cor: '#dc6b4d', borda: '#b04e36', r: 0.08, e: 0.02, tex: 'pista', o: 9 },
  [CH.MADEIRA]: { cor: '#d6a266', borda: '#8e5e33', r: 0, e: 0, tex: 'madeira', o: 10 },
  [CH.PISO]: { cor: '#f1f3f8', borda: '#b9c0cc', r: 0, e: 0, tex: 'piso', o: 11 },
  [CH.QUADRA]: { cor: '#ea8c50', borda: '#b9652e', r: 0, e: 0, tex: 'liso', o: 12 },
  [CH.QUADRA_AZUL]: { cor: '#5282e2', borda: '#3559a8', r: 0, e: 0, tex: 'liso', o: 13 },
  [CH.CAMPO]: { cor: '#62bd5a', borda: '#4a9a45', r: 0.06, e: 0.02, tex: 'campo', o: 14 },
  [CH.AGUA]: { cor: '#4ca8e8', borda: '#eaf8ff', r: 0.45, e: 0.16, tex: 'agua', o: 15 },
};

function caminhoTiles(tiles, e, rad) {
  const p = new Path2D();
  for (const [i, j] of tiles) {
    p.rect(i * T, j * T, T, T);
    if (e > 0 || rad > 0) p.roundRect(i * T - e, j * T - e, T + 2 * e, T + 2 * e, rad);
  }
  return p;
}
function texturaChao(x, tex, tiles, r) {
  for (const [i, j] of tiles) {
    const X = i * T, Y = j * T;
    switch (tex) {
      case 'terra':
        for (let k = 0; k < 6; k++) { x.fillStyle = r() < 0.5 ? 'rgba(170,120,70,0.35)' : 'rgba(255,235,190,0.45)'; x.beginPath(); x.arc(X + r() * T, Y + r() * T, 1.5 + r() * 2.5, 0, 7); x.fill(); }
        if (r() < 0.12) { x.fillStyle = '#b8b0a4'; x.beginPath(); x.ellipse(X + r() * T, Y + r() * T, 5, 3.5, 0, 0, 7); x.fill(); }
        break;
      case 'areia':
        for (let k = 0; k < 9; k++) { x.fillStyle = r() < 0.6 ? 'rgba(210,175,110,0.45)' : 'rgba(255,255,240,0.6)'; x.beginPath(); x.arc(X + r() * T, Y + r() * T, 1 + r() * 1.6, 0, 7); x.fill(); }
        if (r() < 0.05) { x.fillStyle = '#f7c8d8'; x.beginPath(); x.arc(X + r() * T, Y + r() * T, 4, Math.PI, 0); x.fill(); }
        break;
      case 'pedra':
        for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
          const w = T / 3; const ox = (b % 2) * w * 0.4;
          x.beginPath(); x.roundRect(X + a * w + 2 + ox - (a === 2 && b % 2 ? w * 0.4 : 0), Y + b * w + 2, w - 4, w - 4, 6);
          x.fillStyle = ['#d4cfc7', '#c2bcb3', '#cbc6be'][(a + b + i) % 3]; x.fill(); x.strokeStyle = 'rgba(120,112,100,0.5)'; x.lineWidth = 1.5; x.stroke();
        }
        break;
      case 'calcada':
        x.strokeStyle = 'rgba(160,150,140,0.45)'; x.lineWidth = 1.5; x.strokeRect(X + 0.75, Y + 0.75, T / 2, T / 2); x.strokeRect(X + T / 2 + 0.75, Y + T / 2 + 0.75, T / 2 - 1.5, T / 2 - 1.5);
        break;
      case 'asfalto':
        for (let k = 0; k < 10; k++) { x.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.08)'; x.fillRect(X + r() * T, Y + r() * T, 2, 2); }
        break;
      case 'concreto':
        x.strokeStyle = 'rgba(120,120,135,0.3)'; x.lineWidth = 1.5; x.strokeRect(X + 0.75, Y + 0.75, T - 1.5, T - 1.5);
        break;
      case 'pista':
        x.fillStyle = 'rgba(255,245,235,0.75)'; x.fillRect(X, Y + T / 2 - 1, T, 2);
        for (let k = 0; k < 6; k++) { x.fillStyle = 'rgba(120,40,20,0.2)'; x.fillRect(X + r() * T, Y + r() * T, 2, 2); }
        break;
      case 'madeira':
        for (let k = 0; k < 4; k++) {
          const y = Y + k * T / 4; x.fillStyle = k % 2 ? '#d09b5d' : '#dcab70'; x.fillRect(X, y, T, T / 4);
          x.fillStyle = 'rgba(110,70,30,0.45)'; x.fillRect(X, y, T, 1.5); x.fillRect(X + ((i * 7 + k * 23) % 5) * T / 5 + 6, y, 1.5, T / 4);
          x.fillStyle = 'rgba(120,80,40,0.18)'; x.fillRect(X + r() * T * 0.7, y + T / 8, 10 + r() * 10, 1);
        }
        break;
      case 'piso':
        x.fillStyle = '#e4e9f2'; if ((i + j) % 2) { x.fillRect(X, Y, T / 2, T / 2); x.fillRect(X + T / 2, Y + T / 2, T / 2, T / 2); } else { x.fillRect(X + T / 2, Y, T / 2, T / 2); x.fillRect(X, Y + T / 2, T / 2, T / 2); }
        break;
      case 'liso':
        for (let k = 0; k < 4; k++) { x.fillStyle = 'rgba(255,255,255,0.05)'; x.fillRect(X + r() * T, Y + r() * T, 8, 3); }
        break;
      case 'campo':
        if (Math.floor(i / 2) % 2) { x.fillStyle = 'rgba(255,255,255,0.08)'; x.fillRect(X, Y, T, T); }
        for (let k = 0; k < 5; k++) { x.fillStyle = 'rgba(40,110,40,0.18)'; x.fillRect(X + r() * T, Y + r() * T, 1.5, 4); }
        break;
      case 'agua':
        if (r() < 0.5) { x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 2; x.beginPath(); const cx = X + r() * T, cy = Y + r() * T; x.arc(cx, cy, 6 + r() * 5, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); }
        break;
    }
  }
}
function flor(x, cx, cy, cor, s = 1) {
  x.fillStyle = cor; for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; x.beginPath(); x.arc(cx + Math.cos(a) * 3 * s, cy + Math.sin(a) * 3 * s, 2.6 * s, 0, 7); x.fill(); }
  x.fillStyle = '#ffe37a'; x.beginPath(); x.arc(cx, cy, 2 * s, 0, 7); x.fill();
}
function renderChaoVetor(m) {
  if (m._chaoV) return m._chaoV;
  const W = m.w * T, H = m.h * T; const c = mkCanvas(W, H); const x = c.getContext('2d');
  const r = mulberry(m.w * 131 + m.h * 7 + m.id.length);
  x.fillStyle = '#86c75a'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < m.w * m.h * 1.3; i++) { x.fillStyle = r() < 0.5 ? 'rgba(170,225,115,0.25)' : 'rgba(85,150,60,0.16)'; x.beginPath(); x.ellipse(r() * W, r() * H, 10 + r() * 30, 7 + r() * 16, r() * 3, 0, 7); x.fill(); }
  // tufos e flores
  for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) {
    const t = m.chao[j * m.w + i]; if (t !== CH.GRAMA && t !== CH.GRAMA_FLOR) continue;
    for (let k = 0; k < 2; k++) {
      const cx = i * T + r() * T, cy = j * T + r() * T; x.strokeStyle = 'rgba(70,130,50,0.7)'; x.lineWidth = 2; x.lineCap = 'round';
      x.beginPath(); x.moveTo(cx, cy); x.quadraticCurveTo(cx - 2, cy - 5, cx - 4, cy - 8); x.moveTo(cx + 3, cy); x.quadraticCurveTo(cx + 3, cy - 6, cx + 4, cy - 9); x.moveTo(cx + 6, cy); x.quadraticCurveTo(cx + 8, cy - 4, cx + 10, cy - 6); x.stroke();
    }
    if (t === CH.GRAMA_FLOR) for (let k = 0; k < 3; k++) flor(x, i * T + 8 + r() * (T - 16), j * T + 8 + r() * (T - 16), ['#ffffff', '#ff9ec7', '#ffd23f', '#b99cff', '#ff7a6a'][(r() * 5) | 0], 0.9 + r() * 0.4);
  }
  // camadas arredondadas
  const tipos = Object.keys(ESTILO_CHAO).map(Number).sort((a, b) => ESTILO_CHAO[a].o - ESTILO_CHAO[b].o);
  for (const t of tipos) {
    const est = ESTILO_CHAO[t]; const tiles = [];
    for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) if (m.chao[j * m.w + i] === t) tiles.push([i, j]);
    if (!tiles.length) continue;
    const e = est.e * T, rad = est.r * T;
    x.fillStyle = est.borda; x.fill(caminhoTiles(tiles, e + (t === CH.AGUA ? 6 : 3), rad + 3));
    const corpo = caminhoTiles(tiles, e, rad);
    x.fillStyle = est.cor; x.fill(corpo);
    x.save(); x.clip(corpo); texturaChao(x, est.tex, tiles, r); x.restore();
  }
  m.campos.forEach(f => drawLinhasCampo(x, f));
  m._chaoV = c; return c;
}
function drawLinhasCampo(ctx, f) {
  const x = f.x * T, y = f.y * T, w = f.w * T, h = f.h * T;
  ctx.strokeStyle = f.linha || 'rgba(255,255,255,0.92)'; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 3;
  const m = 10;
  ctx.strokeRect(x + m, y + m, w - m * 2, h - m * 2);
  ctx.beginPath(); ctx.moveTo(x + w / 2, y + m); ctx.lineTo(x + w / 2, y + h - m); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, Math.min(h * 0.18, T * 1.4), 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, 4, 0, 7); ctx.fill();
  const ah = h * 0.56, aw = Math.min(w * 0.16, 3.2 * T);
  ctx.strokeRect(x + m, y + h / 2 - ah / 2, aw, ah); ctx.strokeRect(x + w - m - aw, y + h / 2 - ah / 2, aw, ah);
  const gh = h * 0.3, gw = aw * 0.42;
  ctx.strokeRect(x + m, y + h / 2 - gh / 2, gw, gh); ctx.strokeRect(x + w - m - gw, y + h / 2 - gh / 2, gw, gh);
  ctx.beginPath(); ctx.arc(x + m + aw * 0.72, y + h / 2, 4, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(x + w - m - aw * 0.72, y + h / 2, 4, 0, 7); ctx.fill();
}
function drawAguaBrilho(ctx, tx, ty, tempo) {
  const h = hash2(tx, ty); const k = (Math.sin(tempo / 500 + h * 20) + 1) / 2;
  if (k < 0.6) return;
  const x = tx * T + (h * 0.8 + 0.1) * T, y = ty * T + (hash2(ty, tx) * 0.8 + 0.1) * T, s = (k - 0.6) * 14;
  ctx.fillStyle = `rgba(255,255,255,${(k - 0.6) * 2})`;
  ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.3, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s * 0.3, y); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x, y + s * 0.3); ctx.lineTo(x + s, y); ctx.lineTo(x, y - s * 0.3); ctx.fill();
}

/* ================= OBJETOS ================= */
const OBJ_CACHE = new Map();
function objSprite(tipo, v = 0, meta) {
  const key = tipo + ':' + v + ':' + (meta ? JSON.stringify(meta) : '');
  let s = OBJ_CACHE.get(key); if (!s) { s = criaObj(tipo, v, meta || {}); OBJ_CACHE.set(key, s); }
  return s;
}
// cria um sprite com área (w x h) em unidades de mundo e posição (ox, oy) relativa ao tile
function novoSpr(w, h, ox, oy) {
  const c = mkCanvas(w * RES, h * RES); const x = c.getContext('2d'); x.scale(RES, RES);
  return { c, x, w, h, ox, oy };
}
const TEMAS_MURO = {
  tijolo: { topo: '#f0dfc6', face: '#cf7555', linha: '#a9553a', telhado: '#d45d45' },
  madeira: { topo: '#e6c795', face: '#b0733f', linha: '#7e4f28', telhado: '#6f9a4f' },
  branco: { topo: '#f7f2ea', face: '#ebe3d4', linha: '#cfc4b0', telhado: '#4d80cf' },
  concreto: { topo: '#dcdee4', face: '#aeb2bd', linha: '#8d919c', telhado: '#8a8f9c' },
  estadio: { topo: '#9a9ed0', face: '#555a9a', linha: '#3c407a', telhado: '#555a9a' },
};
function criaObj(tipo, v, meta) {
  let S; const r = mulberry(v * 9973 + tipo.length * 31 + 7);
  switch (tipo) {
    case 'arvore': {
      S = novoSpr(1.7 * T, 2.35 * T, -0.35 * T + ((v % 5) - 2) * 3, T - 2.35 * T); const x = S.x;
      const cx = 0.85 * T, base = S.h - 0.16 * T;
      const pal = [['#4d9a3f', '#66b84c', '#8fd46a'], ['#5aa545', '#76c455', '#a4e07a'], ['#3f8f4e', '#57ad62', '#86cf87'], ['#6aa83c', '#86c24e', '#b2e070']][v % 4];
      sombra(x, cx, base, 0.62 * T, 0.2 * T);
      rr(x, cx - 0.13 * T, base - 0.72 * T, 0.26 * T, 0.72 * T, 8, grad(x, cx - 10, 0, cx + 10, 0, '#a8774a', '#855632'));
      const bolas = [[cx, 0.78 * T, 0.6 * T], [cx - 0.42 * T, 1.08 * T, 0.44 * T], [cx + 0.42 * T, 1.08 * T, 0.44 * T], [cx, 1.22 * T, 0.5 * T]];
      x.lineWidth = 5; x.strokeStyle = LINHA; bolas.forEach(([a, b, c]) => { x.beginPath(); x.arc(a, b, c, 0, 7); x.stroke(); });
      bolas.forEach(([a, b, c]) => { x.beginPath(); x.arc(a, b, c, 0, 7); x.fillStyle = pal[0]; x.fill(); });
      [[cx - 0.08 * T, 0.7 * T, 0.46 * T], [cx - 0.44 * T, 1.0 * T, 0.3 * T], [cx + 0.34 * T, 1.0 * T, 0.3 * T]].forEach(([a, b, c]) => { x.beginPath(); x.arc(a, b, c, 0, 7); x.fillStyle = pal[1]; x.fill(); });
      [[cx - 0.2 * T, 0.55 * T, 0.2 * T], [cx - 0.55 * T, 0.92 * T, 0.12 * T]].forEach(([a, b, c]) => { x.beginPath(); x.arc(a, b, c, 0, 7); x.fillStyle = pal[2]; x.fill(); });
      if (v % 4 === 1) for (let k = 0; k < 5; k++) circ(x, cx - 0.5 * T + r() * T, 0.5 * T + r() * 0.9 * T, 5, '#ff7a3a', 1.6);
      break;
    }
    case 'coqueiro': {
      S = novoSpr(1.9 * T, 2.8 * T, -0.45 * T, T - 2.8 * T); const x = S.x;
      const base = S.h - 0.14 * T, cx = 0.95 * T;
      sombra(x, cx + 10, base, 0.55 * T, 0.18 * T);
      for (let i = 0; i < 9; i++) { const k = i / 9; const px = cx + Math.sin(k * 2.2) * 0.22 * T, py = base - 0.1 * T - k * 1.75 * T; elip(x, px, py, 0.13 * T - k * 2, 0.12 * T, i % 2 ? '#b38a5a' : '#c49a68', 2); }
      const topo = { x: cx + Math.sin(2.2) * 0.22 * T, y: base - 1.95 * T };
      const folha = (ang, len) => {
        x.save(); x.translate(topo.x, topo.y); x.rotate(ang);
        x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(len * 0.5, -len * 0.28, len, len * 0.22); x.quadraticCurveTo(len * 0.5, len * 0.05, 0, 0);
        x.fillStyle = '#58b24e'; x.fill(); tracar(x, 2.2); x.stroke();
        x.beginPath(); x.moveTo(4, 0); x.quadraticCurveTo(len * 0.5, -len * 0.12, len * 0.95, len * 0.2); x.strokeStyle = '#3f8a3a'; x.lineWidth = 1.5; x.stroke();
        x.restore();
      };
      [-2.9, -2.3, -1.6, -0.9, -0.3, 0.35, 2.6].forEach(a => folha(a, 0.85 * T));
      circ(x, topo.x - 6, topo.y + 6, 7, '#8a5a2e', 2); circ(x, topo.x + 6, topo.y + 8, 7, '#7a4a22', 2);
      break;
    }
    case 'arbusto': {
      S = novoSpr(1.1 * T, 1.05 * T, -0.05 * T + ((v % 3) - 1) * 3, -0.05 * T); const x = S.x;
      sombra(x, 0.55 * T, 0.9 * T, 0.45 * T, 0.13 * T);
      const bolas = [[0.35 * T, 0.62 * T, 0.26 * T], [0.72 * T, 0.62 * T, 0.26 * T], [0.55 * T, 0.45 * T, 0.3 * T]];
      x.lineWidth = 4.5; x.strokeStyle = LINHA; bolas.forEach(([a, b, c]) => { x.beginPath(); x.arc(a, b, c, 0, 7); x.stroke(); });
      bolas.forEach(([a, b, c]) => { x.beginPath(); x.arc(a, b, c, 0, 7); x.fillStyle = '#5aa545'; x.fill(); });
      circ(x, 0.48 * T, 0.38 * T, 0.14 * T, '#7cc45a', 0);
      if (v % 3 === 0) for (let k = 0; k < 4; k++) flor(x, 0.25 * T + r() * 0.55 * T, 0.35 * T + r() * 0.35 * T, ['#ff9ec7', '#ffffff', '#ffd23f'][k % 3], 0.8);
      break;
    }
    case 'pedra': {
      S = novoSpr(T, 0.85 * T, 0, 0.15 * T); const x = S.x;
      sombra(x, 0.5 * T, 0.72 * T, 0.4 * T, 0.12 * T);
      x.beginPath(); x.moveTo(0.14 * T, 0.68 * T); x.quadraticCurveTo(0.1 * T, 0.3 * T, 0.42 * T, 0.2 * T); x.quadraticCurveTo(0.82 * T, 0.18 * T, 0.88 * T, 0.6 * T); x.quadraticCurveTo(0.5 * T, 0.78 * T, 0.14 * T, 0.68 * T);
      x.fillStyle = grad(x, 0, 0.2 * T, 0, 0.7 * T, '#c9c4bd', '#9a948c'); x.fill(); tracar(x); x.stroke();
      elip(x, 0.4 * T, 0.33 * T, 0.12 * T, 0.05 * T, 'rgba(255,255,255,0.5)', 0);
      break;
    }
    case 'cerca': {
      S = novoSpr(T, T, 0, 0); const x = S.x;
      rr(x, -2, 0.36 * T, T + 4, 0.12 * T, 4, '#c98f55', 2); rr(x, -2, 0.62 * T, T + 4, 0.12 * T, 4, '#c98f55', 2);
      [0.12, 0.62].forEach(k => { rr(x, k * T, 0.18 * T, 0.14 * T, 0.72 * T, 5, grad(x, 0, 0, 0, T, '#d9a066', '#a8703e'), 2.2); });
      break;
    }
    case 'grade': {
      S = novoSpr(T, 1.35 * T, 0, -0.35 * T); const x = S.x;
      x.strokeStyle = 'rgba(210,220,235,0.55)'; x.lineWidth = 1.2;
      for (let k = -T; k < T * 1.3; k += 9) { x.beginPath(); x.moveTo(k, 0.1 * T); x.lineTo(k + 1.2 * T, 1.3 * T); x.stroke(); x.beginPath(); x.moveTo(k + 1.2 * T, 0.1 * T); x.lineTo(k, 1.3 * T); x.stroke(); }
      rr(x, -1, 0.06 * T, T + 2, 0.07 * T, 3, '#9aa0b0', 1.5); rr(x, 0.44 * T, 0.04 * T, 0.12 * T, 1.26 * T, 3, '#8a90a0', 1.5);
      break;
    }
    case 'muro': case 'janela': {
      const tm = TEMAS_MURO[meta.tema || 'tijolo'];
      S = novoSpr(T, 1.4 * T, 0, -0.4 * T); const x = S.x;
      x.fillStyle = tm.topo; x.fillRect(0, 0, T, 0.42 * T);
      x.fillStyle = tm.face; x.fillRect(0, 0.42 * T, T, T * 0.98);
      x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(0, 0.42 * T, T, 5);
      x.strokeStyle = tm.linha; x.lineWidth = 1.5;
      if ((meta.tema || 'tijolo') === 'tijolo') { for (let yy = 0.42 * T + 12; yy < 1.4 * T; yy += 12) { x.beginPath(); x.moveTo(0, yy); x.lineTo(T, yy); x.stroke(); const off = ((yy / 12) % 2) * 16; for (let xx = off; xx < T; xx += 32) { x.beginPath(); x.moveTo(xx, yy - 12); x.lineTo(xx, yy); x.stroke(); } } }
      else if (meta.tema === 'madeira') { for (let xx = 0; xx < T; xx += 16) { x.beginPath(); x.moveTo(xx, 0.42 * T); x.lineTo(xx, 1.4 * T); x.stroke(); } }
      else { x.beginPath(); x.moveTo(0, 0.9 * T); x.lineTo(T, 0.9 * T); x.stroke(); }
      tracar(x, 2.4); x.beginPath(); x.moveTo(0, 1.2); x.lineTo(T, 1.2); x.moveTo(0, 0.42 * T); x.lineTo(T, 0.42 * T); x.moveTo(0, 1.4 * T - 1.2); x.lineTo(T, 1.4 * T - 1.2); x.stroke();
      if (tipo === 'janela') {
        rr(x, 0.18 * T, 0.56 * T, 0.64 * T, 0.5 * T, 6, '#fffaf0', 2.2);
        rr(x, 0.24 * T, 0.62 * T, 0.52 * T, 0.38 * T, 4, grad(x, 0, 0.62 * T, 0, T, '#9fd8ff', '#5aa0e0'), 1.5);
        x.fillStyle = '#fffaf0'; x.fillRect(0.49 * T, 0.62 * T, 3, 0.38 * T); x.fillRect(0.24 * T, 0.79 * T, 0.52 * T, 3);
        x.fillStyle = 'rgba(255,255,255,0.7)'; x.beginPath(); x.moveTo(0.28 * T, 0.66 * T); x.lineTo(0.38 * T, 0.66 * T); x.lineTo(0.28 * T, 0.76 * T); x.fill();
        if ((meta.tema || 'tijolo') !== 'concreto') { rr(x, 0.16 * T, 1.08 * T, 0.68 * T, 0.12 * T, 3, '#9a6a3e', 1.8); for (let k = 0; k < 4; k++) flor(x, 0.24 * T + k * 0.17 * T, 1.07 * T, ['#ff7a9a', '#ffd23f', '#ffffff', '#b99cff'][k], 0.8); }
      }
      break;
    }
    case 'arquibancada': {
      const cor = meta.cor || ['#e84a4a', '#f4f4f4', '#3a62d9', '#f8d838'][v % 4];
      S = novoSpr(T, 1.2 * T, 0, -0.2 * T); const x = S.x;
      x.fillStyle = '#7d7f90'; x.fillRect(0, 0, T, 1.2 * T); x.fillStyle = '#9c9eae'; x.fillRect(0, 0, T, 0.12 * T); x.fillRect(0, 0.6 * T, T, 0.1 * T);
      for (let row = 0; row < 2; row++) for (let k = 0; k < 3; k++) rr(x, 4 + k * 0.33 * T, 0.14 * T + row * 0.6 * T, 0.26 * T, 0.3 * T, 5, cor, 1.6);
      break;
    }
    case 'gol': {
      S = novoSpr(T, 3.4 * T, 0, -1.4 * T); const x = S.x;
      if (meta.parte !== 1) { S.vazio = true; break; }
      const esq = meta.lado === 'e';
      const linhaX = esq ? 0.84 * T : 0.16 * T, fundoX = esq ? 0.08 * T : 0.92 * T;
      x.fillStyle = 'rgba(240,245,255,0.18)'; x.fillRect(Math.min(linhaX, fundoX), 0.4 * T, Math.abs(linhaX - fundoX), 2.95 * T);
      x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = 1.2;
      for (let yy = 0.4 * T; yy < 3.35 * T; yy += 8) { x.beginPath(); x.moveTo(fundoX, yy); x.lineTo(linhaX, yy); x.stroke(); }
      for (let k = 0; k <= 5; k++) { const xx = fundoX + (linhaX - fundoX) * k / 5; x.beginPath(); x.moveTo(xx, 0.4 * T); x.lineTo(xx, 3.35 * T); x.stroke(); }
      const barra = (x0, y0, x1, y1, w) => { x.lineCap = 'round'; x.strokeStyle = LINHA; x.lineWidth = w + 4; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); x.strokeStyle = '#ffffff'; x.lineWidth = w; x.stroke(); };
      barra(fundoX, 0.4 * T, fundoX, 3.35 * T, 3); barra(fundoX, 0.4 * T, linhaX, 0.35 * T, 4); barra(fundoX, 3.35 * T, linhaX, 3.3 * T, 4); barra(linhaX, 0.1 * T, linhaX, 3.35 * T, 7);
      break;
    }
    case 'rede': {
      S = novoSpr(T, 1.2 * T, 0, -0.2 * T); const x = S.x;
      x.strokeStyle = 'rgba(40,40,50,0.45)'; x.lineWidth = 1;
      for (let yy = 0.1 * T; yy < 1.2 * T; yy += 6) { x.beginPath(); x.moveTo(0.42 * T, yy); x.lineTo(0.58 * T, yy); x.stroke(); }
      rr(x, 0.47 * T, 0, 0.06 * T, 1.2 * T, 2, '#ffffff', 1.2);
      break;
    }
    case 'cama': {
      S = novoSpr(T, T, 0, 0); const x = S.x;
      rr(x, 0.08 * T, 0.06 * T, 0.84 * T, 0.9 * T, 8, '#8a5a32');
      rr(x, 0.12 * T, 0.3 * T, 0.76 * T, 0.62 * T, 6, grad(x, 0, 0.3 * T, 0, T, '#6a9ff0', '#4a78d0'), 2);
      rr(x, 0.18 * T, 0.1 * T, 0.64 * T, 0.2 * T, 8, '#ffffff', 2);
      for (let k = 0; k < 3; k++) circ(x, 0.3 * T + k * 0.2 * T, 0.6 * T, 4, 'rgba(255,255,255,0.6)', 0);
      break;
    }
    case 'mesa': {
      S = novoSpr(T, 1.1 * T, 0, -0.1 * T); const x = S.x;
      sombra(x, 0.5 * T, T, 0.4 * T, 0.08 * T);
      rr(x, 0.14 * T, 0.5 * T, 0.08 * T, 0.5 * T, 3, '#8a5a32', 1.8); rr(x, 0.78 * T, 0.5 * T, 0.08 * T, 0.5 * T, 3, '#8a5a32', 1.8);
      rr(x, 0.06 * T, 0.2 * T, 0.88 * T, 0.4 * T, 8, grad(x, 0, 0.2 * T, 0, 0.6 * T, '#e0ac72', '#c08448'));
      if (v % 2) { circ(x, 0.35 * T, 0.36 * T, 7, '#ffffff', 1.8); circ(x, 0.62 * T, 0.34 * T, 6, '#ff6a5a', 1.8); }
      break;
    }
    case 'carteira': {
      S = novoSpr(T, T, 0, 0); const x = S.x;
      rr(x, 0.2 * T, 0.55 * T, 0.6 * T, 0.3 * T, 6, '#6f86c8', 2);
      rr(x, 0.12 * T, 0.18 * T, 0.76 * T, 0.34 * T, 6, '#e0ac72'); rr(x, 0.3 * T, 0.24 * T, 0.28 * T, 0.2 * T, 3, '#ffffff', 1.5);
      break;
    }
    case 'lousa': {
      S = novoSpr(T, 1.5 * T, 0, -0.5 * T); const x = S.x;
      rr(x, 0.02 * T, 0.12 * T, 0.96 * T, 0.9 * T, 6, '#8a5a32'); rr(x, 0.08 * T, 0.18 * T, 0.84 * T, 0.78 * T, 4, '#2f6b4a', 1.5);
      x.strokeStyle = 'rgba(255,255,255,0.8)'; x.lineWidth = 2; x.beginPath(); x.moveTo(0.16 * T, 0.35 * T); x.lineTo(0.5 * T, 0.35 * T); x.moveTo(0.16 * T, 0.5 * T); x.lineTo(0.7 * T, 0.5 * T); x.moveTo(0.16 * T, 0.65 * T); x.lineTo(0.4 * T, 0.65 * T); x.stroke();
      x.font = `700 ${0.2 * T}px Fredoka, sans-serif`; x.fillStyle = '#fff'; x.fillText('2+2', 0.58 * T, 0.8 * T);
      break;
    }
    case 'estante': {
      S = novoSpr(T, 1.6 * T, 0, -0.6 * T); const x = S.x;
      rr(x, 0.06 * T, 0.06 * T, 0.88 * T, 1.5 * T, 6, '#9a6a3e');
      for (let s = 0; s < 3; s++) {
        const y = 0.16 * T + s * 0.46 * T; x.fillStyle = '#6e4623'; x.fillRect(0.12 * T, y, 0.76 * T, 0.4 * T);
        let xx = 0.14 * T; while (xx < 0.84 * T) { const w = 6 + r() * 6; rr(x, xx, y + 4 + r() * 6, w, 0.4 * T - 6 - r() * 6, 2, ['#e84a4a', '#3a62d9', '#f8d838', '#4fc26a', '#ff9a3a', '#b07aff'][(r() * 6) | 0], 1.2); xx += w + 1; }
      }
      break;
    }
    case 'balcao': {
      S = novoSpr(T, 1.2 * T, 0, -0.2 * T); const x = S.x;
      x.fillStyle = '#a8703e'; x.fillRect(0, 0.4 * T, T, 0.8 * T); x.fillStyle = '#e2ae74'; x.fillRect(0, 0.15 * T, T, 0.28 * T);
      tracar(x); x.beginPath(); x.moveTo(0, 0.15 * T); x.lineTo(T, 0.15 * T); x.moveTo(0, 0.43 * T); x.lineTo(T, 0.43 * T); x.moveTo(0, 1.2 * T - 1); x.lineTo(T, 1.2 * T - 1); x.stroke();
      if (v % 3 === 1) { rr(x, 0.2 * T, -0.02 * T, 0.14 * T, 0.24 * T, 4, '#7cc8ff', 1.6); rr(x, 0.5 * T, 0.02 * T, 0.14 * T, 0.2 * T, 4, '#6ad07a', 1.6); }
      break;
    }
    case 'bau': {
      S = novoSpr(T, T, 0, 0); const x = S.x;
      sombra(x, 0.5 * T, 0.9 * T, 0.4 * T, 0.08 * T);
      rr(x, 0.12 * T, 0.38 * T, 0.76 * T, 0.5 * T, 6, grad(x, 0, 0.4 * T, 0, 0.9 * T, '#c9844a', '#8e5a2e'));
      rr(x, 0.1 * T, 0.2 * T, 0.8 * T, 0.26 * T, 10, '#d9985a');
      rr(x, 0.44 * T, 0.36 * T, 0.12 * T, 0.16 * T, 3, '#ffd23f', 2);
      x.fillStyle = '#e8b44a'; x.fillRect(0.22 * T, 0.2 * T, 5, 0.68 * T); x.fillRect(0.74 * T, 0.2 * T, 5, 0.68 * T);
      break;
    }
    case 'placa': {
      S = novoSpr(T, 1.3 * T, 0, -0.3 * T); const x = S.x;
      sombra(x, 0.5 * T, 1.22 * T, 0.2 * T, 0.06 * T);
      rr(x, 0.44 * T, 0.5 * T, 0.12 * T, 0.75 * T, 3, '#8a5a32', 2);
      rr(x, 0.08 * T, 0.12 * T, 0.84 * T, 0.48 * T, 8, grad(x, 0, 0.12 * T, 0, 0.6 * T, '#e8b47a', '#c98f55'));
      x.strokeStyle = 'rgba(90,50,20,0.5)'; x.lineWidth = 2; x.beginPath(); x.moveTo(0.2 * T, 0.28 * T); x.lineTo(0.8 * T, 0.28 * T); x.moveTo(0.2 * T, 0.43 * T); x.lineTo(0.65 * T, 0.43 * T); x.stroke();
      break;
    }
    case 'quadro': {
      S = novoSpr(T, 1.45 * T, 0, -0.45 * T); const x = S.x;
      rr(x, 0.12 * T, 0.7 * T, 0.08 * T, 0.72 * T, 3, '#7e4f28', 2); rr(x, 0.8 * T, 0.7 * T, 0.08 * T, 0.72 * T, 3, '#7e4f28', 2);
      rr(x, 0.02 * T, 0.05 * T, 0.96 * T, 0.8 * T, 8, '#8a5a32'); rr(x, 0.08 * T, 0.11 * T, 0.84 * T, 0.68 * T, 4, '#e8c48e', 1.5);
      [['#ffffff', 0.14, 0.16], ['#ffe37a', 0.5, 0.18], ['#ffc2dc', 0.2, 0.46], ['#bfe6ff', 0.55, 0.48]].forEach(([c, a, b]) => { rr(x, a * T, b * T, 0.3 * T, 0.26 * T, 3, c, 1.4); circ(x, (a + 0.15) * T, (b + 0.03) * T, 3, '#e84a4a', 0); });
      x.font = `800 ${0.34 * T}px Fredoka, sans-serif`; x.textAlign = 'center'; x.fillStyle = '#e84a4a'; x.strokeStyle = '#fff'; x.lineWidth = 4; x.strokeText('!', 0.5 * T, 0.62 * T); x.fillText('!', 0.5 * T, 0.62 * T);
      break;
    }
    case 'poste': {
      S = novoSpr(T, 2.5 * T, 0, -1.5 * T); const x = S.x;
      sombra(x, 0.5 * T, 2.42 * T, 0.2 * T, 0.06 * T);
      rr(x, 0.45 * T, 0.5 * T, 0.1 * T, 1.95 * T, 3, '#4a4d5c', 2);
      rr(x, 0.3 * T, 0.18 * T, 0.4 * T, 0.36 * T, 10, '#4a4d5c', 2); circ(x, 0.5 * T, 0.4 * T, 0.12 * T, '#fff2a8', 1.6);
      rr(x, 0.36 * T, 2.34 * T, 0.28 * T, 0.12 * T, 4, '#3a3d4a', 2);
      break;
    }
    case 'holofote': {
      S = novoSpr(T, 3.3 * T, 0, -2.3 * T); const x = S.x;
      rr(x, 0.45 * T, 0.7 * T, 0.1 * T, 2.55 * T, 3, '#6a6d7c', 2);
      rr(x, 0.02 * T, 0.05 * T, 0.96 * T, 0.7 * T, 6, '#3a3d4a');
      for (let a = 0; a < 3; a++) for (let b = 0; b < 2; b++) circ(x, 0.2 * T + a * 0.3 * T, 0.25 * T + b * 0.3 * T, 0.1 * T, '#fff8c8', 1.2);
      break;
    }
    case 'banco': {
      S = novoSpr(T, T, 0, 0); const x = S.x;
      sombra(x, 0.5 * T, 0.88 * T, 0.44 * T, 0.08 * T);
      rr(x, 0.08 * T, 0.6 * T, 0.08 * T, 0.28 * T, 2, '#4a4d5c', 1.6); rr(x, 0.84 * T, 0.6 * T, 0.08 * T, 0.28 * T, 2, '#4a4d5c', 1.6);
      rr(x, 0.02 * T, 0.2 * T, 0.96 * T, 0.16 * T, 5, '#d9985a'); rr(x, 0.02 * T, 0.44 * T, 0.96 * T, 0.2 * T, 5, '#c98549');
      break;
    }
    case 'vaso': {
      S = novoSpr(T, T, 0, 0); const x = S.x;
      sombra(x, 0.5 * T, 0.88 * T, 0.28 * T, 0.07 * T);
      x.beginPath(); x.moveTo(0.28 * T, 0.5 * T); x.lineTo(0.72 * T, 0.5 * T); x.lineTo(0.64 * T, 0.88 * T); x.lineTo(0.36 * T, 0.88 * T); x.closePath(); x.fillStyle = '#d97a4e'; x.fill(); tracar(x); x.stroke();
      [[0.4, 0.34, 0.16], [0.6, 0.34, 0.16], [0.5, 0.24, 0.17]].forEach(([a, b, c]) => circ(x, a * T, b * T, c * T, '#5aa545', 2.2));
      flor(x, 0.4 * T, 0.28 * T, '#ff7a9a'); flor(x, 0.6 * T, 0.2 * T, '#ffd23f');
      break;
    }
    case 'guarda_sol': {
      S = novoSpr(1.5 * T, 1.9 * T, -0.25 * T, -0.9 * T); const x = S.x;
      const cx = 0.75 * T; sombra(x, cx + 12, 1.75 * T, 0.6 * T, 0.16 * T, 0.18);
      rr(x, cx - 3, 0.5 * T, 6, 1.3 * T, 3, '#f4f4f4', 1.8);
      const cores = [['#ff5a5a', '#ffffff'], ['#3a8ae0', '#ffe14a'], ['#4fc26a', '#ffffff']][v % 3];
      for (let k = 0; k < 8; k++) { x.beginPath(); x.moveTo(cx, 0.5 * T); x.ellipse(cx, 0.5 * T, 0.7 * T, 0.38 * T, 0, k / 8 * Math.PI * 2, (k + 1) / 8 * Math.PI * 2); x.closePath(); x.fillStyle = cores[k % 2]; x.fill(); }
      elip(x, cx, 0.5 * T, 0.7 * T, 0.38 * T, null, 2.4); circ(x, cx, 0.5 * T, 5, '#f4f4f4', 1.6);
      break;
    }
    case 'torre': {
      S = novoSpr(1.2 * T, 2.7 * T, -0.1 * T, -1.7 * T); const x = S.x;
      sombra(x, 0.6 * T, 2.6 * T, 0.5 * T, 0.1 * T);
      [0.15, 0.95].forEach(k => rr(x, k * T, 1.2 * T, 0.08 * T, 1.45 * T, 3, '#f4f4f4', 1.8));
      rr(x, 0.1 * T, 2.0 * T, T, 0.07 * T, 2, '#f4f4f4', 1.6);
      rr(x, 0.06 * T, 0.6 * T, 1.08 * T, 0.7 * T, 8, '#ff5a5a');
      rr(x, 0.2 * T, 0.72 * T, 0.8 * T, 0.36 * T, 5, '#ffffff', 1.8);
      x.fillStyle = '#ff5a5a'; x.fillRect(0.55 * T, 0.76 * T, 0.1 * T, 0.28 * T); x.fillRect(0.46 * T, 0.85 * T, 0.28 * T, 0.1 * T);
      x.beginPath(); x.moveTo(0, 0.62 * T); x.lineTo(0.6 * T, 0.2 * T); x.lineTo(1.2 * T, 0.62 * T); x.closePath(); x.fillStyle = '#ffd23f'; x.fill(); tracar(x); x.stroke();
      break;
    }
    case 'rampa': {
      S = novoSpr(T, 1.2 * T, 0, -0.2 * T); const x = S.x;
      x.beginPath(); x.moveTo(0.02 * T, 1.15 * T); x.lineTo(0.02 * T, 0.2 * T); x.quadraticCurveTo(0.5 * T, 0.3 * T, 0.98 * T, 1.15 * T); x.closePath();
      x.fillStyle = grad(x, 0, 0.2 * T, 0, 1.2 * T, '#c9cbd8', '#8a8ea0'); x.fill(); tracar(x); x.stroke();
      x.strokeStyle = '#ff5ad0'; x.lineWidth = 3; x.beginPath(); x.moveTo(0.1 * T, 0.5 * T); x.quadraticCurveTo(0.3 * T, 0.55 * T, 0.4 * T, 0.8 * T); x.stroke();
      break;
    }
    case 'lixeira': {
      S = novoSpr(T, T, 0, 0); const x = S.x;
      sombra(x, 0.5 * T, 0.9 * T, 0.24 * T, 0.06 * T);
      rr(x, 0.28 * T, 0.36 * T, 0.44 * T, 0.54 * T, 6, '#4fae5a'); rr(x, 0.24 * T, 0.26 * T, 0.52 * T, 0.14 * T, 5, '#3a9048');
      break;
    }
    case 'hidrante': {
      S = novoSpr(T, T, 0, 0); const x = S.x;
      sombra(x, 0.5 * T, 0.9 * T, 0.2 * T, 0.05 * T);
      rr(x, 0.34 * T, 0.36 * T, 0.32 * T, 0.52 * T, 8, '#e84a4a'); circ(x, 0.5 * T, 0.34 * T, 0.16 * T, '#ff6a6a'); rr(x, 0.22 * T, 0.52 * T, 0.56 * T, 0.12 * T, 5, '#c83a3a', 2);
      break;
    }
    case 'predio': {
      const cor = meta.cor || ['#e0a88a', '#9ab4d8', '#d8c89a', '#b8a0d8'][v % 4];
      S = novoSpr(T, 2.4 * T, 0, -1.4 * T); const x = S.x;
      x.fillStyle = shade(cor, 0.25); x.fillRect(0, 0, T, 0.45 * T);
      x.fillStyle = cor; x.fillRect(0, 0.45 * T, T, 1.95 * T);
      x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(0, 0.45 * T, T, 5);
      for (let a = 0; a < 2; a++) for (let b = 0; b < 3; b++) { const acesa = hash2(v, a * 3 + b) < 0.3; rr(x, 0.12 * T + a * 0.44 * T, 0.6 * T + b * 0.58 * T, 0.32 * T, 0.38 * T, 4, acesa ? '#fff2a8' : grad(x, 0, 0, 0, T, '#aee0ff', '#6aa8e0'), 1.8); }
      tracar(x, 2.4); x.beginPath(); x.moveTo(0, 1.2); x.lineTo(T, 1.2); x.moveTo(0, 0.45 * T); x.lineTo(T, 0.45 * T); x.moveTo(0, 2.4 * T - 1.2); x.lineTo(T, 2.4 * T - 1.2); x.stroke();
      break;
    }
    case 'barraca': {
      S = novoSpr(T, 1.6 * T, 0, -0.6 * T); const x = S.x;
      rr(x, 0.04 * T, 0.7 * T, 0.92 * T, 0.88 * T, 6, '#e0ac72');
      for (let k = 0; k < 4; k++) { x.fillStyle = k % 2 ? '#ffffff' : '#ff8a3a'; x.beginPath(); x.moveTo(k * 0.25 * T, 0.2 * T); x.lineTo((k + 1) * 0.25 * T, 0.2 * T); x.lineTo((k + 1) * 0.25 * T, 0.6 * T); x.quadraticCurveTo((k + 0.5) * 0.25 * T, 0.72 * T, k * 0.25 * T, 0.6 * T); x.fill(); }
      tracar(x); x.strokeRect(0, 0.2 * T, T, 0.42 * T);
      rr(x, 0.14 * T, 0.86 * T, 0.2 * T, 0.2 * T, 4, '#7ad04a', 1.6); rr(x, 0.52 * T, 0.88 * T, 0.2 * T, 0.18 * T, 4, '#8a3aa8', 1.6);
      break;
    }
    case 'ponto_onibus': {
      S = novoSpr(T, 1.9 * T, 0, -0.9 * T); const x = S.x;
      sombra(x, 0.5 * T, 1.82 * T, 0.18 * T, 0.05 * T);
      rr(x, 0.45 * T, 0.5 * T, 0.1 * T, 1.35 * T, 3, '#6a6d7c', 2);
      circ(x, 0.5 * T, 0.38 * T, 0.32 * T, '#3a7ae0', 2.4); circ(x, 0.5 * T, 0.38 * T, 0.24 * T, '#ffffff', 0);
      rr(x, 0.34 * T, 0.28 * T, 0.32 * T, 0.18 * T, 4, '#3a7ae0', 1.4); circ(x, 0.4 * T, 0.5 * T, 3, '#3a3d4a', 0); circ(x, 0.6 * T, 0.5 * T, 3, '#3a3d4a', 0);
      break;
    }
    case 'placar': {
      S = novoSpr(T, 2 * T, 0, -T); const x = S.x;
      rr(x, 0.44 * T, 1.0 * T, 0.12 * T, 0.95 * T, 3, '#6a6d7c', 2);
      rr(x, 0.02 * T, 0.1 * T, 0.96 * T, 0.9 * T, 6, '#23263a');
      x.font = `800 ${0.34 * T}px Fredoka, sans-serif`; x.textAlign = 'center'; x.fillStyle = '#ff5a5a'; x.fillText('2', 0.27 * T, 0.7 * T); x.fillStyle = '#ffe14a'; x.fillText(':', 0.5 * T, 0.68 * T); x.fillStyle = '#5aff8a'; x.fillText('1', 0.73 * T, 0.7 * T);
      break;
    }
    case 'cone_deco': {
      S = novoSpr(T, T, 0, 0); const x = S.x;
      sombra(x, 0.5 * T, 0.84 * T, 0.26 * T, 0.06 * T);
      x.beginPath(); x.moveTo(0.5 * T, 0.28 * T); x.lineTo(0.68 * T, 0.8 * T); x.lineTo(0.32 * T, 0.8 * T); x.closePath(); x.fillStyle = '#ff8a2a'; x.fill(); tracar(x); x.stroke();
      x.fillStyle = '#fff'; x.fillRect(0.4 * T, 0.52 * T, 0.2 * T, 0.07 * T);
      rr(x, 0.26 * T, 0.78 * T, 0.48 * T, 0.08 * T, 3, '#e06a1a', 1.8);
      break;
    }
    case 'barra': {
      S = novoSpr(T, T, 0, 0); const x = S.x;
      rr(x, 0.1 * T, 0.56 * T, 0.8 * T, 0.28 * T, 6, '#5a5d6c'); rr(x, 0.04 * T, 0.28 * T, 0.92 * T, 0.08 * T, 3, '#9aa0b0', 1.8);
      circ(x, 0.1 * T, 0.32 * T, 0.12 * T, '#23263a'); circ(x, 0.9 * T, 0.32 * T, 0.12 * T, '#23263a');
      break;
    }
    case 'carro': {
      const cor = ['#e84a4a', '#3a7ae0', '#f4f4f4', '#f8d838', '#4fc26a'][v % 5];
      S = novoSpr(T, 1.25 * T, 0, -0.25 * T); const x = S.x;
      sombra(x, 0.5 * T, 1.14 * T, 0.48 * T, 0.08 * T);
      rr(x, 0.03 * T, 0.42 * T, 0.94 * T, 0.62 * T, 12, cor);
      rr(x, 0.16 * T, 0.12 * T, 0.68 * T, 0.42 * T, 12, shade(cor, -0.08));
      rr(x, 0.22 * T, 0.18 * T, 0.56 * T, 0.26 * T, 8, grad(x, 0, 0.18 * T, 0, 0.44 * T, '#bfe6ff', '#6aa8e0'), 1.8);
      circ(x, 0.15 * T, 0.86 * T, 6, '#fff2a8', 1.6); circ(x, 0.85 * T, 0.86 * T, 6, '#fff2a8', 1.6);
      rr(x, 0.1 * T, 1.0 * T, 0.18 * T, 0.12 * T, 4, '#23263a', 1.4); rr(x, 0.72 * T, 1.0 * T, 0.18 * T, 0.12 * T, 4, '#23263a', 1.4);
      break;
    }
    default: S = novoSpr(T, T, 0, 0); rr(S.x, 8, 8, T - 16, T - 16, 6, '#ff00ff');
  }
  return S;
}

// Telhado de uma casa (fica transparente com o jogador dentro)
const TELHADO_CACHE = new Map();
function spriteTelhado(casa) {
  const key = `${casa.x},${casa.y},${casa.w},${casa.h},${casa.tema}`; if (TELHADO_CACHE.has(key)) return TELHADO_CACHE.get(key);
  const tm = TEMAS_MURO[casa.tema] || TEMAS_MURO.tijolo;
  const W = casa.w * T + 16, H = (casa.h - 1) * T + 0.45 * T + 10;
  const S = novoSpr(W, H, -8, -0.45 * T - 10); const x = S.x;
  const cor = tm.telhado, esc = shade(cor, -0.18), cla = shade(cor, 0.15);
  const meio = H * 0.42;
  x.beginPath(); x.roundRect(2, 2, W - 4, H - 4, 14); x.fillStyle = cor; x.fill();
  x.save(); x.beginPath(); x.roundRect(2, 2, W - 4, H - 4, 14); x.clip();
  x.fillStyle = cla; x.fillRect(0, 0, W, meio);
  x.fillStyle = esc; x.fillRect(0, meio, W, H - meio);
  x.strokeStyle = 'rgba(0,0,0,0.13)'; x.lineWidth = 2;
  for (let yy = 16; yy < H; yy += 16) { x.beginPath(); x.moveTo(0, yy); x.lineTo(W, yy); x.stroke(); for (let xx = (yy / 16 % 2) * 14; xx < W; xx += 28) { x.beginPath(); x.moveTo(xx, yy - 16); x.lineTo(xx, yy); x.stroke(); } }
  x.restore();
  tracar(x, 3); x.beginPath(); x.roundRect(2, 2, W - 4, H - 4, 14); x.stroke();
  x.strokeStyle = shade(cor, -0.35); x.lineWidth = 4; x.beginPath(); x.moveTo(10, meio); x.lineTo(W - 10, meio); x.stroke();
  rr(x, W * 0.72, meio - 0.55 * T, 0.32 * T, 0.5 * T, 4, '#a8553a', 2.4);
  TELHADO_CACHE.set(key, S); return S;
}
function spritePorta(tema) {
  const key = 'porta:' + tema; if (OBJ_CACHE.has(key)) return OBJ_CACHE.get(key);
  const S = novoSpr(T, 1.2 * T, 0, -0.35 * T); const x = S.x;
  rr(x, 0.18 * T, 0.12 * T, 0.64 * T, 1.02 * T, [14, 14, 2, 2], grad(x, 0, 0, 0, T, '#b0703a', '#7e4a22'));
  x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 2; x.beginPath(); x.moveTo(0.5 * T, 0.2 * T); x.lineTo(0.5 * T, 1.1 * T); x.stroke();
  circ(x, 0.66 * T, 0.7 * T, 3.5, '#ffd23f', 1.4);
  rr(x, 0.08 * T, 1.08 * T, 0.84 * T, 0.1 * T, 3, '#c98f55', 1.6);
  OBJ_CACHE.set(key, S); return S;
}

/* ================= PERSONAGENS (peças do site) ================= */
const AV_W = 300, AV_H = 400;
const IMGS = new Map();
let versaoImgs = 0;
function pegaImg(url) {
  let e = IMGS.get(url);
  if (!e) {
    e = { ok: false, err: false, im: new Image() };
    e.im.crossOrigin = 'anonymous';
    e.im.onload = () => { e.ok = true; versaoImgs++; };
    e.im.onerror = () => { e.err = true; versaoImgs++; };
    e.im.src = url; IMGS.set(url, e);
  }
  return e;
}
function pecaUrl(pasta, id) { return `${ASSET_BASE}/avatar/${pasta}/${id}-v2.webp`; }
function corCabeloHex(id) { if (!id) return null; if (id[0] === '#') return id; const c = AVATAR.coresCabelo.find(c => c.id === id); return c ? c.cor : null; }
function camadasDe(look) {
  const L = [];
  if (look.fundo) L.push({ url: pecaUrl('fundo', look.fundo) });
  if (look.costas) L.push({ url: pecaUrl('costas', look.costas) });
  L.push({ url: pecaUrl('pele', (look.pele || 'pele-media') + (look.corpo === 'f' ? '-f' : '')) });
  if (look.baixo) L.push({ url: pecaUrl('parteDeBaixo', look.baixo), recolor: look.corBaixo });
  if (look.roupa) L.push({ url: pecaUrl('roupa', look.roupa), recolor: look.corRoupa });
  if (look.pescoco) L.push({ url: pecaUrl('pescoco', look.pescoco) });
  if (look.cabelo) { const cor = corCabeloHex(look.corCabelo); L.push(cor ? { url: pecaUrl('cabelo', look.cabelo + '-cinza'), tinta: cor } : { url: pecaUrl('cabelo', look.cabelo) }); }
  if (look.rosto) L.push({ url: pecaUrl('rosto', look.rosto) });
  if (look.chapeu) L.push({ url: pecaUrl('chapeu', look.chapeu) });
  if (look.mao) L.push({ url: pecaUrl('mao', look.mao) });
  return L;
}
function tingir(im, cor) {
  const c = mkCanvas(AV_W, AV_H); const x = c.getContext('2d');
  x.drawImage(im, 0, 0, AV_W, AV_H); x.globalCompositeOperation = 'multiply'; x.fillStyle = cor; x.fillRect(0, 0, AV_W, AV_H);
  x.globalCompositeOperation = 'destination-in'; x.drawImage(im, 0, 0, AV_W, AV_H); return c;
}
const RECOLOR_CACHE = new Map();
function recolorir(im, cor, url) {
  const key = url + cor; if (RECOLOR_CACHE.has(key)) return RECOLOR_CACHE.get(key);
  const c = mkCanvas(AV_W, AV_H); const x = c.getContext('2d'); x.drawImage(im, 0, 0, AV_W, AV_H);
  try {
    const img = x.getImageData(0, 0, AV_W, AV_H); const d = img.data;
    // matiz dominante (as cores fortes da roupa)
    const hist = new Array(36).fill(0);
    for (let i = 0; i < d.length; i += 16) { if (d[i + 3] < 200) continue; const [h, s, l] = rgbHsl(d[i], d[i + 1], d[i + 2]); if (s > 0.35 && l > 0.2 && l < 0.85) hist[Math.floor(h * 36) % 36]++; }
    const dom = hist.indexOf(Math.max(...hist)) / 36 + 1 / 72;
    const [tr, tg, tb] = hexRgb(cor); const [th, ts, tl] = rgbHsl(tr, tg, tb);
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 10) continue;
      const [h, s, l] = rgbHsl(d[i], d[i + 1], d[i + 2]);
      let dh = Math.abs(h - dom); dh = Math.min(dh, 1 - dh);
      if (s < 0.25 || dh > 0.09) continue;
      const nl = Math.max(0, Math.min(1, l * (tl / 0.58)));
      const [r2, g2, b2] = hslRgb(th, ts * Math.min(1, s * 1.2), ts < 0.08 ? Math.min(0.97, nl) : nl);
      d[i] = r2; d[i + 1] = g2; d[i + 2] = b2;
    }
    x.putImageData(img, 0, 0);
  } catch (e) { /* sem CORS: usa a cor original */ }
  RECOLOR_CACHE.set(key, c); return c;
}
const COMP = new Map();
function chaveLook(look) { return look._k || (look._k = JSON.stringify(look)); }
// Monta o personagem. Retorna null enquanto as imagens carregam.
function compoe(look, recorta = true) {
  const key = chaveLook(look) + (recorta ? '|c' : '');
  const hit = COMP.get(key); if (hit) return hit;
  const L = camadasDe(look); const es = L.map(l => pegaImg(l.url));
  if (es.some(e => !e.ok && !e.err)) return null;
  const c = mkCanvas(AV_W, AV_H); const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
  L.forEach((l, i) => { const e = es[i]; if (!e.ok) return; if (l.tinta) x.drawImage(tingir(e.im, l.tinta), 0, 0); else if (l.recolor) x.drawImage(recolorir(e.im, l.recolor, l.url), 0, 0); else x.drawImage(e.im, 0, 0, AV_W, AV_H); });
  let res = { c };
  if (recorta) {
    try {
      const d = x.getImageData(0, 0, AV_W, AV_H).data; let x0 = AV_W, y0 = AV_H, x1 = 0, y1 = 0;
      for (let y = 0; y < AV_H; y += 2) for (let xx = 0; xx < AV_W; xx += 2) if (d[(y * AV_W + xx) * 4 + 3] > 40) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 > x0) { const cc = mkCanvas(x1 - x0 + 4, y1 - y0 + 3); cc.getContext('2d').drawImage(c, x0 - 2, y0 - 1, cc.width, cc.height, 0, 0, cc.width, cc.height); res = { c: cc, box: [x0 - 2, y0 - 1, cc.width, cc.height] }; }
    } catch (e) { res = { c, sem: true }; }
  }
  COMP.set(key, res); return res;
}

/* ---- vistas de costas e de lado ----
   As peças do site só existem de frente e o rosto vem desenhado na própria pele.
   De costas: a cabeça vira "nuca" (cor do cabelo) e a mochila/capa passa para a frente.
   De lado (3/4, olhando para a direita; a esquerda é espelhada): o rosto desliza para o lado
   e a parte de trás da cabeça ganha cabelo. Usa o mesmo recorte da vista de frente. */
const CABECA = { cx: 150, cy: 152, rx: 60, ry: 62, pescoco: 214 };
function corMediaImg(im) {
  try {
    const c = mkCanvas(60, 80), x = c.getContext('2d'); x.drawImage(im, 0, 0, 60, 80); const d = x.getImageData(0, 0, 60, 80).data;
    let r = 0, g = 0, b = 0, n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
    return n ? `rgb(${r / n | 0},${g / n | 0},${b / n | 0})` : null;
  } catch (e) { return null; }
}
function compoeVista(look, vista) {
  const frente = compoe(look); if (!frente || vista === 'frente' || !frente.box) return frente;
  const key = chaveLook(look) + '|' + vista; const hit = COMP.get(key); if (hit) return hit;
  const L = camadasDe(look); const es = L.map(l => pegaImg(l.url));
  const pasta = l => l.url.split('/avatar/')[1].split('/')[0];
  const img = (l, e) => l.tinta ? tingir(e.im, l.tinta) : l.recolor ? recolorir(e.im, l.recolor, l.url) : e.im;
  const iPele = L.findIndex(l => pasta(l) === 'pele'), iCab = L.findIndex(l => pasta(l) === 'cabelo');
  const pele = (AVATAR.peles.find(p => p.id === look.pele) || AVATAR.peles[1]).cor;
  const corCab = iCab >= 0 && es[iCab].ok ? (L[iCab].tinta || corMediaImg(es[iCab].im) || '#3a2a20') : null;
  const C = CABECA;
  const c = mkCanvas(AV_W, AV_H); const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
  // máscara da cabeça (formato real da pele, sem as orelhas)
  const mascara = (ctx, fn, folga = 0) => { ctx.save(); ctx.beginPath(); ctx.ellipse(C.cx, C.cy - folga / 2, C.rx + folga, C.ry + folga, 0, 0, 7); ctx.clip(); fn(); ctx.restore(); };
  const sombra = (ctx, cor) => { const g = ctx.createLinearGradient(0, C.cy - C.ry, 0, C.cy + C.ry); g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(1, 'rgba(0,0,0,0.22)'); ctx.fillStyle = cor; ctx.fillRect(0, 0, AV_W, C.pescoco); ctx.fillStyle = g; ctx.fillRect(0, 0, AV_W, C.pescoco); };
  // Várias peças do site (roupa, faixa, chapéu...) trazem o rosto desenhado junto. Por isso a cabeça
  // só é tratada depois de montar o boneco INTEIRO; assim nenhuma peça "devolve" o rosto por cima.
  const desenha = (i, dx = 0) => { const e = es[i]; if (e.ok) x.drawImage(img(L[i], e), dx, 0, AV_W, AV_H); };
  const tipo = n => L.map((l, i) => i).filter(i => pasta(L[i]) === n);
  const todos = L.map((l, i) => i);
  const foraDaCabeca = (fn, folga = 3) => { x.save(); x.beginPath(); x.rect(0, 0, AV_W, AV_H); x.ellipse(C.cx, C.cy - folga / 2, C.rx + folga, C.ry + folga, 0, 0, 7); x.clip('evenodd'); fn(); x.restore(); };
  if (vista === 'costas') {
    // 1) boneco inteiro (colar e item de mão ficam atrás; mochila vem no fim)
    todos.filter(i => ['mao', 'pescoco'].includes(pasta(L[i]))).forEach(i => desenha(i));
    todos.filter(i => !['mao', 'pescoco', 'costas', 'rosto', 'chapeu'].includes(pasta(L[i]))).forEach(i => desenha(i));
    // as imagens de chapéu/faixa trazem a cabeça inteira: isola só o acessório (o que muda ao colocá-lo)
    const acessorios = tipo('chapeu').filter(i => es[i].ok).map(i => {
      const antes = x.getImageData(0, 0, AV_W, AV_H);
      const t = mkCanvas(AV_W, AV_H), tx = t.getContext('2d'); tx.putImageData(antes, 0, 0); tx.drawImage(img(L[i], es[i]), 0, 0, AV_W, AV_H);
      const depois = tx.getImageData(0, 0, AV_W, AV_H); const a = antes.data, d = depois.data;
      const [pr, pg, pb] = hexRgb(pele);
      for (let k = 0; k < d.length; k += 4) {
        const dif = Math.abs(d[k] - a[k]) + Math.abs(d[k + 1] - a[k + 1]) + Math.abs(d[k + 2] - a[k + 2]) + Math.abs(d[k + 3] - a[k + 3]);
        const pareceP = Math.abs(d[k] - pr) + Math.abs(d[k + 1] - pg) + Math.abs(d[k + 2] - pb) < 90; // contorno/rosto da cabeça que vem junto
        if (dif < 60 || pareceP) d[k + 3] = 0;
      }
      tx.putImageData(depois, 0, 0); return t;
    });
    // 2) nuca cobre a cabeça toda (com folga para entrar por baixo do cabelo)
    const corNuca = corCab || pele;
    mascara(x, () => sombra(x, corNuca), 6);
    mascara(x, () => {
      const r = mulberry(7);
      const brilho = x.createRadialGradient(C.cx - 18, C.cy - 30, 4, C.cx - 18, C.cy - 30, 55); brilho.addColorStop(0, 'rgba(255,255,255,0.16)'); brilho.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = brilho; x.fillRect(0, 0, AV_W, C.pescoco);
      if (!corCab) return;
      const rgbCab = corCab[0] === '#' ? hexRgb(corCab) : (corCab.match(/\d+/g) || [60, 40, 30]).map(Number);
      const mistura = (alvo, k) => `rgba(${rgbCab.map((v, j) => Math.round(v + (alvo[j] - v) * k)).join(',')},0.6)`;
      const claro = mistura([255, 240, 220], 0.18), escuro = mistura([0, 0, 0], 0.35);
      if (/cacheado|black|crespo|afro/.test(look.cabelo || '')) {
        for (let k = 0; k < 70; k++) { const a = r() * 7, d = Math.sqrt(r()); const px = C.cx + Math.cos(a) * C.rx * d, py = C.cy + Math.sin(a) * C.ry * d; const rr = 5 + r() * 5;
          x.strokeStyle = r() < 0.5 ? escuro : claro; x.lineWidth = 2.2; x.beginPath(); x.arc(px, py, rr, r() * 7, r() * 7 + 3.6); x.stroke(); }
      } else {
        const topo = [C.cx + 4, C.cy - C.ry * 0.62];
        for (let k = 0; k <= 12; k++) { const u = k / 12 * 2 - 1; const ex = C.cx + u * C.rx * 0.95, ey = C.cy + C.ry * (0.9 - 0.35 * Math.abs(u)); // fios do redemoinho até a nuca
          x.strokeStyle = k % 2 ? escuro : claro; x.lineWidth = 2.4; x.beginPath(); x.moveTo(topo[0], topo[1]); x.quadraticCurveTo((topo[0] + ex) / 2 + (ex - C.cx) * 0.35, (topo[1] + ey) / 2, ex, ey); x.stroke(); }
        x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 2.4; x.beginPath(); x.arc(topo[0], topo[1] + 4, 6, 0.5, 5.2); x.stroke(); // redemoinho
      }
      const g = x.createLinearGradient(0, C.cy + C.ry * 0.35, 0, C.cy + C.ry); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.25)'); x.fillStyle = g; x.fillRect(0, 0, AV_W, C.pescoco);
    }, 6);
    // 3) só a parte de FORA da cabeça volta: contorno do cabelo (sem a moldura do rosto) e as pontas do acessório
    tipo('cabelo').forEach(i => {
      if (!es[i].ok || !corCab) return;
      const sc = mkCanvas(AV_W, AV_H), sx = sc.getContext('2d'); sx.drawImage(img(L[i], es[i]), 0, 0, AV_W, AV_H);
      sx.globalCompositeOperation = 'source-in'; sx.fillStyle = corCab; sx.fillRect(0, 0, AV_W, AV_H);
      foraDaCabeca(() => { x.drawImage(sc, 0, 0); x.globalAlpha = 0.45; desenha(i); x.globalAlpha = 1; });
    });
    acessorios.forEach(t => x.drawImage(t, 0, 0)); // faixa/boné/coroa vistos de trás
    // 4) mochila/capa por cima do corpo, mas não da cabeça
    tipo('costas').forEach(i => foraDaCabeca(() => desenha(i), 6));
  } else { // lado (3/4 para a direita)
    const dx = 11;
    // 1) mochila um pouco para trás; depois o boneco inteiro
    tipo('costas').forEach(i => desenha(i, -dx));
    todos.filter(i => pasta(L[i]) !== 'costas').forEach(i => desenha(i));
    // 2) a cabeça pronta (rosto + cabelo + acessório) desliza para a direita dentro do formato da cabeça
    const t = mkCanvas(AV_W, AV_H), tx = t.getContext('2d'); tx.drawImage(c, 0, 0);
    tx.globalCompositeOperation = 'destination-in'; tx.fillRect(0, 0, AV_W, C.pescoco - 6);
    mascara(x, () => { x.fillStyle = pele; x.fillRect(0, 0, AV_W, C.pescoco); x.drawImage(t, dx, 0); });
    // 3) atrás do rosto, a nuca com cabelo (ou pele, para quem não tem cabelo)
    mascara(x, () => { x.save(); x.beginPath(); x.ellipse(C.cx - C.rx * 1.2, C.cy - 8, C.rx * 0.62, C.ry * 0.98, 0, 0, 7); x.clip(); sombra(x, corCab || pele); x.restore(); });
    // 4) o corpo inteiro vira: tronco, braços e pernas estreitam (de perfil ocupam menos largura),
    //    a cabeça estreita um pouco menos, e o corpo se desloca de leve para trás
    const f = mkCanvas(AV_W, AV_H), fx = f.getContext('2d'); fx.imageSmoothingQuality = 'high';
    const corte = C.pescoco + 5; // logo abaixo do queixo
    fx.save(); fx.translate(C.cx - 4, 0); fx.scale(0.7, 1); fx.translate(-C.cx, 0); fx.drawImage(c, 0, corte, AV_W, AV_H - corte, 0, corte, AV_W, AV_H - corte); fx.restore();
    fx.save(); fx.translate(C.cx, 0); fx.scale(0.93, 1); fx.translate(-C.cx, 0); fx.drawImage(c, 0, 0, AV_W, corte, 0, 0, AV_W, corte); fx.restore();
    x.clearRect(0, 0, AV_W, AV_H); x.drawImage(f, 0, 0);
  }
  const [bx, by, bw, bh] = frente.box; const cc = mkCanvas(bw, bh); cc.getContext('2d').drawImage(c, bx, by, bw, bh, 0, 0, bw, bh);
  const res = { c: cc }; COMP.set(key, res); return res;
}
function preCarrega(look) { camadasDe(look).forEach(l => pegaImg(l.url)); }

// Silhueta simples enquanto carrega (ou se o site estiver fora do ar)
function desenhaSilhueta(x, look, px, py, h) {
  const pele = (AVATAR.peles.find(p => p.id === look.pele) || AVATAR.peles[1]).cor;
  const roupa = look.corRoupa || '#f8d838';
  elip(x, px, py - h * 0.28, h * 0.2, h * 0.24, roupa, 2);
  circ(x, px, py - h * 0.7, h * 0.26, pele, 2);
  circ(x, px - h * 0.08, py - h * 0.7, h * 0.03, LINHA, 0); circ(x, px + h * 0.08, py - h * 0.7, h * 0.03, LINHA, 0);
}

/* ================= BICHOS (vetor) ================= */
// (px,py) = pés; s = escala (1 = tamanho normal); a = {fase, mov, flip, t}
function desenhaBicho(x, tipo, px, py, s, a) {
  x.save(); x.translate(px, py); if (a.flip) x.scale(-1, 1); x.scale(s, s);
  const t = a.t / 1000, f = a.fase;
  if (tipo === 'pombo') {
    const bob = a.mov ? Math.sin(f * 2) * 2 : Math.sin(t * 3) * 0.6;
    sombra(x, 0, 0, 14, 4);
    x.strokeStyle = '#e88a6a'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(-3, -6); x.lineTo(-4, 0); x.moveTo(4, -6); x.lineTo(5, 0); x.stroke();
    elip(x, 2, -14, 15, 11, '#a8adc0');
    elip(x, 7, -15, 9, 7, '#8a90a8', 2);
    x.beginPath(); x.moveTo(16, -16); x.lineTo(25, -20); x.lineTo(22, -12); x.closePath(); x.fillStyle = '#6a7088'; x.fill(); tracar(x, 2); x.stroke();
    circ(x, -10, -26 + bob, 8.5, '#b8bdd0');
    x.fillStyle = '#7ad0a0'; x.beginPath(); x.arc(-8, -19 + bob, 5, 0, Math.PI); x.fill();
    circ(x, -13, -28 + bob, 3, '#ffffff', 1.2); circ(x, -13.5, -28 + bob, 1.6, LINHA, 0);
    x.beginPath(); x.moveTo(-18, -26 + bob); x.lineTo(-23, -24 + bob); x.lineTo(-18, -22.5 + bob); x.closePath(); x.fillStyle = '#e8a060'; x.fill(); tracar(x, 1.6); x.stroke();
  } else if (tipo === 'cachorro') {
    const pa = a.mov ? Math.sin(f * 2) * 5 : 0, rabo = Math.sin(t * 12) * 0.5;
    sombra(x, 2, 0, 22, 5);
    [[-12, pa], [-4, -pa], [10, -pa], [17, pa]].forEach(([lx, o]) => rr(x, lx - 3 + o * 0.4, -12, 7, 12, 3, '#d9913e', 2));
    x.save(); x.translate(22, -22); x.rotate(-0.8 + rabo); rr(x, -3, -14, 6, 16, 3, '#d9913e', 2); x.restore();
    elip(x, 3, -20, 21, 11, '#e8a24a');
    elip(x, 3, -14, 14, 5, '#f7d29a', 0);
    circ(x, -17, -30, 11, '#e8a24a');
    elip(x, -26, -26, 7, 5, '#f7d29a', 2);
    circ(x, -31, -27, 2.8, LINHA, 0);
    circ(x, -19, -33, 3, '#ffffff', 1.2); circ(x, -20, -33, 1.7, LINHA, 0);
    x.save(); x.translate(-11, -38); x.rotate(0.5 + Math.sin(t * 3) * 0.1); elip(x, 0, 6, 5, 10, '#b8702e', 2); x.restore();
    x.strokeStyle = '#e8606a'; x.lineWidth = 3; x.beginPath(); x.moveTo(-27, -21); x.lineTo(-27, -17); x.stroke();
  } else if (tipo === 'caranguejo') {
    const pa = a.mov ? Math.sin(f * 3) * 3 : 0, gar = Math.sin(t * 6) * 0.3;
    sombra(x, 0, 0, 20, 5);
    x.strokeStyle = '#c8452f'; x.lineWidth = 3;
    for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(-10, -10 + k * 3); x.lineTo(-20 - k * 2, -2 + (k % 2 ? pa : -pa)); x.moveTo(10, -10 + k * 3); x.lineTo(20 + k * 2, -2 + (k % 2 ? -pa : pa)); x.stroke(); }
    elip(x, 0, -14, 17, 11, '#ef6a4a');
    elip(x, -4, -18, 7, 3, 'rgba(255,255,255,0.35)', 0);
    [[-1, -1], [1, 1]].forEach(([sx]) => { x.save(); x.translate(sx * 20, -24); x.rotate(sx * (0.3 + gar)); elip(x, 0, 0, 8, 6, '#ef6a4a'); x.beginPath(); x.moveTo(sx * 2, -2); x.lineTo(sx * 9, -7); x.strokeStyle = LINHA; x.lineWidth = 2; x.stroke(); x.restore(); });
    [[-6], [6]].forEach(([ex]) => { x.strokeStyle = LINHA; x.lineWidth = 2; x.beginPath(); x.moveTo(ex, -22); x.lineTo(ex, -30); x.stroke(); circ(x, ex, -32, 4, '#ffffff', 1.4); circ(x, ex, -32, 2, LINHA, 0); });
  } else if (tipo === 'gaivota') {
    const voo = Math.sin(t * 3 + (a.id || 0)) * 3 - 16, asa = Math.sin(t * 10 + (a.id || 0)) * 0.7;
    sombra(x, 0, 0, 12, 3.5, 0.15);
    x.translate(0, voo);
    x.save(); x.translate(2, -14); x.rotate(-0.4 - asa); elip(x, 12, 0, 16, 5, '#c8ccd8'); x.fillStyle = '#4a4d5c'; x.beginPath(); x.ellipse(24, 0, 5, 3, 0, 0, 7); x.fill(); x.restore();
    elip(x, 0, -12, 16, 8, '#f8f8fb');
    x.beginPath(); x.moveTo(14, -12); x.lineTo(24, -16); x.lineTo(22, -8); x.closePath(); x.fillStyle = '#c8ccd8'; x.fill(); tracar(x, 2); x.stroke();
    circ(x, -13, -18, 7, '#f8f8fb');
    circ(x, -15, -20, 2, LINHA, 0);
    x.beginPath(); x.moveTo(-19, -18); x.lineTo(-27, -16); x.lineTo(-19, -14); x.closePath(); x.fillStyle = '#ffc83a'; x.fill(); tracar(x, 1.6); x.stroke();
    x.save(); x.translate(0, -14); x.rotate(0.4 + asa); elip(x, 10, 0, 15, 5, '#dde0ea'); x.restore();
  } else if (tipo === 'boneco') {
    sombra(x, 0, 0, 16, 5);
    rr(x, -4, -30, 8, 30, 3, '#9a6a3e', 2);
    rr(x, -16, -52, 32, 28, 10, '#e8c46a');
    circ(x, 0, -38, 10, '#ffffff', 2); circ(x, 0, -38, 6, '#ef4a4a', 0); circ(x, 0, -38, 2.5, '#ffffff', 0);
    circ(x, 0, -62, 10, '#e8c46a'); circ(x, -3.5, -63, 1.8, LINHA, 0); circ(x, 3.5, -63, 1.8, LINHA, 0);
    rr(x, -24, -50, 9, 6, 3, '#e8c46a', 2); rr(x, 15, -50, 9, 6, 3, '#e8c46a', 2);
  }
  x.restore();
}
const ALTURA_BICHO = { pombo: 0.62, cachorro: 0.8, caranguejo: 0.6, gaivota: 0.9, boneco: 1.1 };

/* ================= BOLA ================= */
function desenhaBola(x, cx, cy, r, giro = 0) {
  circ(x, cx, cy, r, '#ffffff', Math.max(1.2, r * 0.22));
  x.save(); x.beginPath(); x.arc(cx, cy, r, 0, 7); x.clip();
  x.fillStyle = '#2a2a38';
  const p = (ax, ay, rr2) => { x.beginPath(); for (let k = 0; k < 5; k++) { const a = giro + k / 5 * Math.PI * 2 - Math.PI / 2; x.lineTo(ax + Math.cos(a) * rr2, ay + Math.sin(a) * rr2); } x.fill(); };
  p(cx + Math.sin(giro) * r * 0.3, cy, r * 0.36);
  for (let k = 0; k < 5; k++) { const a = giro + k / 5 * Math.PI * 2; p(cx + Math.cos(a) * r * 0.95, cy + Math.sin(a) * r * 0.95, r * 0.28); }
  x.restore();
}

/* ================= ÍCONES ================= */
const ICON_CACHE = new Map();
const EMOJI_ICON = { pena: '🪶', osso: '🦴', concha: '🐚', oculos: '🕶️', roda: '🛞', prancheta: '📋', relogio: '⏱️', luva: '🧤', headset: '🎧', louros: '🌿', coroa: '👑', tigela: '🍧', coco: '🥥', pacote: '🎴' };
function iconeItemVetor(id) {
  if (ICON_CACHE.has(id)) return ICON_CACHE.get(id);
  const it = ITENS[id] || {}; const ic = it.icon || { k: '?' };
  const c = mkCanvas(64, 64); const x = c.getContext('2d');
  const a = ic.c || '#ffffff', b = ic.c2 || shade(a, -0.3), cl = shade(a, 0.3);
  const k = ic.k;
  if (EMOJI_ICON[k]) { x.font = '44px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(EMOJI_ICON[k], 32, 35); ICON_CACHE.set(id, c); return c; }
  switch (k) {
    case 'bola': if (a === '#ffffff') desenhaBola(x, 32, 32, 22, 0.3); else { circ(x, 32, 32, 22, a, 3); x.save(); x.beginPath(); x.arc(32, 32, 22, 0, 7); x.clip(); x.fillStyle = b; x.fillRect(10, 24, 44, 8); x.fillStyle = '#fff'; x.fillRect(10, 36, 44, 6); x.restore(); tracar(x, 3); x.beginPath(); x.arc(32, 32, 22, 0, 7); x.stroke(); } break;
    case 'garrafa': rr(x, 26, 6, 12, 8, 3, '#e8e8f0', 2.5); rr(x, 18, 14, 28, 44, 10, grad(x, 0, 14, 0, 58, cl, a), 3); rr(x, 18, 28, 28, 14, 0, '#ffffff', 0); x.fillStyle = a; x.font = '800 11px Fredoka'; x.textAlign = 'center'; x.fillText('H₂O', 32, 39); x.fillStyle = 'rgba(255,255,255,0.6)'; x.fillRect(22, 44, 4, 10); break;
    case 'copo': x.beginPath(); x.moveTo(16, 14); x.lineTo(48, 14); x.lineTo(43, 58); x.lineTo(21, 58); x.closePath(); x.fillStyle = grad(x, 0, 14, 0, 58, cl, a); x.fill(); tracar(x, 3); x.stroke(); x.strokeStyle = '#ff5a8a'; x.lineWidth = 4; x.beginPath(); x.moveTo(36, 18); x.lineTo(44, 4); x.stroke(); break;
    case 'camisa': x.beginPath(); x.moveTo(20, 10); x.lineTo(26, 8); x.quadraticCurveTo(32, 14, 38, 8); x.lineTo(44, 10); x.lineTo(58, 20); x.lineTo(52, 30); x.lineTo(46, 26); x.lineTo(46, 56); x.lineTo(18, 56); x.lineTo(18, 26); x.lineTo(12, 30); x.lineTo(6, 20); x.closePath(); x.fillStyle = grad(x, 0, 8, 0, 56, cl, a); x.fill();
      if (ic.c2) { x.save(); x.clip(); x.fillStyle = b; if (ITENS[id].listras) for (let xx = 20; xx < 46; xx += 8) x.fillRect(xx, 8, 3, 50); else x.fillRect(6, 18, 52, 4); x.restore(); }
      tracar(x, 3); x.stroke(); if (id === 'camisa10') { x.font = '800 18px Fredoka'; x.textAlign = 'center'; x.fillStyle = '#fff'; x.strokeStyle = '#8a5a0a'; x.lineWidth = 3; x.strokeText('10', 32, 46); x.fillText('10', 32, 46); } break;
    case 'calcao': x.beginPath(); x.moveTo(12, 14); x.lineTo(52, 14); x.lineTo(56, 52); x.lineTo(36, 52); x.lineTo(32, 32); x.lineTo(28, 52); x.lineTo(8, 52); x.closePath(); x.fillStyle = grad(x, 0, 14, 0, 52, cl, a); x.fill(); tracar(x, 3); x.stroke(); x.fillStyle = 'rgba(255,255,255,0.5)'; x.fillRect(12, 18, 40, 4); break;
    case 'caneleira': [[14, 0], [36, 0]].forEach(([xx]) => { rr(x, xx, 10, 16, 44, 8, grad(x, 0, 10, 0, 54, cl, a), 3); x.fillStyle = 'rgba(255,255,255,0.4)'; x.fillRect(xx + 4, 16, 3, 30); }); break;
    case 'chuteira': x.beginPath(); x.moveTo(6, 44); x.lineTo(8, 26); x.quadraticCurveTo(10, 18, 22, 18); x.lineTo(28, 18); x.quadraticCurveTo(34, 30, 48, 32); x.quadraticCurveTo(58, 34, 58, 44); x.closePath(); x.fillStyle = grad(x, 0, 18, 0, 44, cl, a); x.fill(); tracar(x, 3); x.stroke();
      rr(x, 6, 44, 52, 6, 3, '#2a2a38', 2); [14, 26, 40, 50].forEach(xx => rr(x, xx, 50, 5, 6, 2, '#c8c8d0', 1.5)); x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath(); x.moveTo(28, 26); x.lineTo(36, 38); x.moveTo(34, 24); x.lineTo(42, 34); x.stroke(); break;
    case 'chinelo': [[10, -0.15], [34, 0.15]].forEach(([xx, rot]) => { x.save(); x.translate(xx + 10, 32); x.rotate(rot); rr(x, -9, -24, 18, 48, 9, '#3a8ae0', 3); x.strokeStyle = '#fff'; x.lineWidth = 4; x.beginPath(); x.moveTo(-8, -6); x.lineTo(0, -14); x.lineTo(8, -6); x.stroke(); x.restore(); }); break;
    case 'bone': x.beginPath(); x.arc(30, 36, 20, Math.PI, 0); x.closePath(); x.fillStyle = grad(x, 0, 16, 0, 36, cl, a); x.fill(); tracar(x, 3); x.stroke(); rr(x, 36, 32, 22, 8, 4, shade(a, -0.2), 3); circ(x, 30, 16, 3, shade(a, -0.3), 2); break;
    case 'faixa': rr(x, 6, 24, 52, 14, 7, grad(x, 0, 24, 0, 38, cl, a), 3); x.save(); x.translate(48, 38); x.rotate(0.5); rr(x, 0, 0, 8, 18, 3, a, 2.5); x.restore(); if (a === '#ffd23f') { x.font = '800 12px Fredoka'; x.textAlign = 'center'; x.fillStyle = '#3d2b3a'; x.fillText('C', 32, 35); } break;
    case 'munhequeira': rr(x, 14, 20, 36, 24, 10, grad(x, 0, 20, 0, 44, cl, a), 3); x.fillStyle = '#fff'; x.fillRect(14, 30, 36, 4); break;
    case 'apito': circ(x, 26, 36, 14, grad(x, 0, 22, 0, 50, cl, a), 3); rr(x, 32, 24, 24, 12, 4, a, 3); circ(x, 26, 36, 5, shade(a, -0.3), 0); x.strokeStyle = '#3a62d9'; x.lineWidth = 3; x.beginPath(); x.moveTo(20, 24); x.quadraticCurveTo(10, 8, 30, 6); x.stroke(); break;
    case 'colar': for (let i = 0; i < 12; i++) { const an = Math.PI * (0.05 + 0.9 * i / 11); flor(x, 32 + Math.cos(an) * 22, 18 + Math.sin(an) * 30, ['#ff5a8a', '#ffe14a', '#5affb0', '#ffffff'][i % 4], 1.5); } break;
    case 'medalha': x.fillStyle = '#3a62d9'; x.beginPath(); x.moveTo(20, 4); x.lineTo(30, 4); x.lineTo(36, 30); x.lineTo(28, 30); x.fill(); x.fillStyle = '#e84a4a'; x.beginPath(); x.moveTo(44, 4); x.lineTo(34, 4); x.lineTo(28, 30); x.lineTo(36, 30); x.fill(); circ(x, 32, 42, 16, grad(x, 0, 26, 0, 58, cl, a), 3); x.fillStyle = shade(a, -0.25); x.font = '800 16px Fredoka'; x.textAlign = 'center'; x.fillText('★', 32, 48); break;
    case 'cone': x.beginPath(); x.moveTo(32, 8); x.lineTo(46, 52); x.lineTo(18, 52); x.closePath(); x.fillStyle = '#ff8a2a'; x.fill(); tracar(x, 3); x.stroke(); x.fillStyle = '#fff'; x.fillRect(24, 30, 16, 6); rr(x, 12, 50, 40, 8, 3, '#e06a1a', 2.5); break;
    case 'cartao': x.save(); x.translate(32, 32); x.rotate(-0.15); rr(x, -14, -20, 28, 40, 5, a, 3); x.fillStyle = 'rgba(255,255,255,0.4)'; x.fillRect(-10, -16, 6, 30); x.restore(); break;
    default: circ(x, 32, 32, 20, '#ff00ff', 3);
  }
  ICON_CACHE.set(id, c); return c;
}
const EMOJI_DRIBLE = { pedalada: '🌀', respiro: '💚', chute_colocado: '🎯', arrancada: '⚡', chapeu: '🎩', voleio: '💥', elastico: '〰️', folego_campeao: '💖', caneta: '✒️', tabela: '🔁', bicicleta: '🚲', relampago: '🌩️' };
function iconeDribleVetor(id) {
  const key = 'd_' + id; if (ICON_CACHE.has(key)) return ICON_CACHE.get(key);
  const dr = DRIBLES[id]; const c = mkCanvas(64, 64); const x = c.getContext('2d');
  const fundo = { melee: '#7a4ae0', dist: '#2a8ae0', cura: '#2ab070', buff: '#2ab0c8', area: '#d04aa8' }[dr.tipo];
  const g = x.createRadialGradient(24, 20, 4, 32, 32, 30); g.addColorStop(0, shade(fundo, 0.35)); g.addColorStop(1, fundo);
  circ(x, 32, 32, 27, g, 3.5);
  x.font = '30px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(EMOJI_DRIBLE[id] || '⚽', 32, 34);
  ICON_CACHE.set(key, c); return c;
}

/* ================= RETRATO / MINIATURA DE QUALQUER APARÊNCIA ================= */
// Desenha num canvas quando as imagens terminarem de carregar
function pintaAparencia(canvas, look, opts = {}) {
  const x = canvas.getContext('2d');
  const tenta = () => {
    x.clearRect(0, 0, canvas.width, canvas.height);
    if (opts.fundo) { x.fillStyle = opts.fundo; x.fillRect(0, 0, canvas.width, canvas.height); }
    if (look.tipo && look.tipo !== 'humano') {
      const s = canvas.height / ((ALTURA_BICHO[look.tipo] || 0.8) * T) * 0.85;
      desenhaBicho(x, look.tipo, canvas.width / 2, canvas.height * 0.94, s, { fase: 0, mov: false, flip: false, t: 0 });
      return true;
    }
    const comp = compoe(look, !opts.inteiro);
    if (!comp) { desenhaSilhueta(x, look, canvas.width / 2, canvas.height * 0.95, canvas.height * 0.9); return false; }
    const ar = comp.c.width / comp.c.height; let h = canvas.height * (opts.inteiro ? 1 : 0.94), w = h * ar;
    if (w > canvas.width) { w = canvas.width; h = w / ar; }
    x.imageSmoothingQuality = 'high';
    x.drawImage(comp.c, (canvas.width - w) / 2, canvas.height - h - (opts.inteiro ? 0 : canvas.height * 0.03), w, h);
    return true;
  };
  if (!tenta()) { let n = 0; const iv = setInterval(() => { if (tenta() || ++n > 60) clearInterval(iv); }, 150); }
  return canvas;
}
