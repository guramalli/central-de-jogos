// Canvas e utilitários de desenho em pixel
import { W, H, setW, setH } from '../data/constants.js';
import { cam } from './camera.js';
import { V } from './view.js';

export const cv = document.getElementById('cv');
export const ctxMain = cv.getContext('2d');
ctxMain.imageSmoothingEnabled = false;
// live binding: aponta para o canvas do jogo, ou por um instante para o canvas de uma prévia
export let ctx = ctxMain;

// Desenha fn() noutro canvas (prévia da tela de Melhorias): troca contexto, tamanho e câmera,
// liga V.preview (sem partículas, eventos nem estado de animação) e restaura tudo no fim.
export function withTarget(c2d, w, h, camState, fn) {
  const saved = { ctx, W, H, cx: cam.cx, cy: cam.cy, z: cam.z, preview: V.preview };
  ctx = c2d; setW(w); setH(h); Object.assign(cam, camState); V.preview = true;
  try { fn(); } finally {
    ctx = saved.ctx; setW(saved.W); setH(saved.H);
    cam.cx = saved.cx; cam.cy = saved.cy; cam.z = saved.z; V.preview = saved.preview;
  }
}

// retângulo em coordenadas de TELA (x, y = canto superior esquerdo)
export const r = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };

// retângulo em coordenadas de MUNDO (x, y = canto inferior esquerdo, y para cima).
// As bordas são arredondadas para pixels inteiros na tela: fica nítido em qualquer zoom
// e detalhes menores que meio pixel somem sozinhos (nível de detalhe natural).
export function R(x, y, w, h, c) {
  const z = cam.z, ox = W / 2 - cam.cx * z, oy = H / 2 + cam.cy * z;
  const x0 = Math.round(x * z + ox), x1 = Math.round((x + w) * z + ox);
  if (x1 <= x0 || x1 < 0 || x0 > W) return;
  const y0 = Math.round(oy - (y + h) * z), y1 = Math.round(oy - y * z);
  if (y1 <= y0 || y1 < 0 || y0 > H) return;
  ctx.fillStyle = c; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
}
// como R, mas garante pelo menos 1 pixel (silhuetas que não podem sumir ao afastar)
export function Rv(x, y, w, h, c) {
  const z = cam.z, ox = W / 2 - cam.cx * z, oy = H / 2 + cam.cy * z;
  let x0 = Math.round(x * z + ox), x1 = Math.round((x + w) * z + ox);
  let y0 = Math.round(oy - (y + h) * z), y1 = Math.round(oy - y * z);
  if (x1 <= x0) x1 = x0 + 1;
  if (y1 <= y0) y1 = y0 + 1;
  if (x1 < 0 || x0 > W || y1 < 0 || y0 > H) return;
  ctx.fillStyle = c; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
}
// texto em coordenadas de mundo (some quando ficaria pequeno demais)
export function T(str, x, y, size, color, align = 'left') {
  const px = Math.round(size * cam.z);
  if (px < 6) return false;
  ctx.font = `600 ${px}px "Chakra Petch", sans-serif`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, Math.round(x * cam.z + W / 2 - cam.cx * cam.z), Math.round(H / 2 - (y - cam.cy) * cam.z));
  ctx.textAlign = 'left';
  return true;
}

// ruído determinístico em [0,1)
export const hash = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// mistura duas cores '#rrggbb' → 'rgb(...)'
export function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const c = [16, 8, 0].map(s => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, t)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
// mistura duas cores 'rgb(...)'
export function mixRGB(a, b, t) {
  const pa = a.match(/\d+/g).map(Number), pb = b.match(/\d+/g).map(Number);
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], t))).join(',')})`;
}
