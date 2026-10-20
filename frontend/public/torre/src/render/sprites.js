// Sprites desenhados por código: cada peça é pintada uma vez num canvas pequeno, em pixels de arte,
// ganha um contorno escuro de 1 px (o que dá cara de pixel art) e fica guardada. Depois é só carimbar na cena.
//   makeSprite(chave, largura, altura, desenhar, opções) → canvas (cacheado pela chave)
//   fromGrid(chave, linhas, paleta)                      → canvas a partir de um mapa de pixels em texto
//   blit(sprite, x, y, ax, ay, flip)                      → carimba em coordenadas de mundo (com a câmera)
import { W, H } from '../data/constants.js';
import { ctx } from './canvas.js';
import { cam } from './camera.js';

const cache = new Map();
export const OUTLINE = '#1b1622';

const newCanvas = (w, h) => {
  const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h });
  return c;
};

// contorno: todo pixel transparente vizinho (4 direções) de um pixel opaco vira contorno
function outlinePass(c, color) {
  const g = c.getContext('2d'), { width: w, height: h } = c, img = g.getImageData(0, 0, w, h), d = img.data;
  const solid = i => d[i * 4 + 3] > 40;
  const out = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (solid(i)) continue;
    if ((x > 0 && solid(i - 1)) || (x < w - 1 && solid(i + 1)) || (y > 0 && solid(i - w)) || (y < h - 1 && solid(i + w))) out.push(i);
  }
  const n = parseInt(color.slice(1), 16), r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
  for (const i of out) { d[i * 4] = r; d[i * 4 + 1] = gg; d[i * 4 + 2] = b; d[i * 4 + 3] = 255; }
  g.putImageData(img, 0, 0);
}

// desenhar(p) recebe p.r(x, y, w, h, cor) e p.px(x, y, cor) em pixels do sprite (y para baixo)
export function makeSprite(key, w, h, draw, { outline = OUTLINE } = {}) {
  let c = cache.get(key);
  if (c) return c;
  c = newCanvas(w, h);
  const g = c.getContext('2d');
  const p = {
    g, w, h,
    r: (x, y, ww, hh, col) => { if (ww <= 0 || hh <= 0) return; g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(ww), Math.round(hh)); },
    px: (x, y, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), 1, 1); },
  };
  draw(p);
  if (outline) outlinePass(c, outline);
  cache.set(key, c);
  return c;
}

// mapa de pixels em texto: cada caractere é uma cor da paleta ('.' ou ' ' = transparente)
export function fromGrid(key, rows, pal, opts) {
  const w = Math.max(...rows.map(r => r.length)), h = rows.length;
  return makeSprite(key, w, h, p => {
    rows.forEach((row, y) => [...row].forEach((ch, x) => { const col = pal[ch]; if (col) p.px(x, y, col); }));
  }, opts);
}

// carimba o sprite no mundo: (x, y) é o ponto de apoio em coordenadas de mundo (y para cima);
// (ax, ay) é onde fica esse ponto dentro do sprite, em pixels (y para baixo). flip espelha na horizontal.
export function blit(spr, x, y, ax, ay, flip = false, k = 1) { // k: escala (1 pixel do sprite = k pixels de mundo)
  const z = cam.z * k, ox = W / 2 - cam.cx * cam.z, oy = H / 2 + cam.cy * cam.z;
  const x0 = Math.round((x * cam.z - (flip ? spr.width - ax : ax) * z) + ox), y0 = Math.round(oy - y * cam.z - ay * z);
  const w = Math.max(1, Math.round(spr.width * z)), h = Math.max(1, Math.round(spr.height * z));
  if (x0 > W || y0 > H || x0 + w < 0 || y0 + h < 0) return;
  if (flip) { ctx.save(); ctx.translate(x0 + w, y0); ctx.scale(-1, 1); ctx.drawImage(spr, 0, 0, w, h); ctx.restore(); }
  else ctx.drawImage(spr, x0, y0, w, h);
}

// sprite → data URL (síncrono; para usar como <image> na árvore em SVG), com cache
const urls = new WeakMap();
export function spriteDataURL(spr) {
  let u = urls.get(spr);
  if (u) return u;
  const c = document.createElement('canvas'); c.width = spr.width; c.height = spr.height;
  c.getContext('2d').drawImage(spr, 0, 0);
  u = c.toDataURL(); urls.set(spr, u);
  return u;
}

// tom mais claro/escuro de uma cor #rrggbb
export function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f)))));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}
