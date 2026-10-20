// Caminhões do PixelLab (assets/caminhao-areia.png e assets/betoneira.png).
// O basculante separa a caçamba do desenho e a gira em volta da dobradiça (mapeamento inverso, pixel a pixel);
// a areia some da caçamba conforme despeja. A cabine azul muda de cor a cada nível do Caminhão maior (TRUCK_TINT).
// Enquanto a arte não carrega, as funções devolvem null e o jogo usa o caminhão desenhado por código.
import { art } from './assets.js';
import { makeSprite } from './sprites.js';
import { TRUCK_TINT } from './props.js';

export const TRUCK_TOP = 44;                                   // margem em cima para a caçamba erguida
export const DUMP_PIVOT = 23, DUMP_GROUND = 70;                // dobradiça (x no desenho) e linha do chão (embaixo das rodas)
export const MIX_AX = 12, MIX_GROUND = 72;                     // betoneira: ponto de apoio perto da calha; chão
const BED = { x0: 23, x1: 79, y0: 13, y1: 49, py: 48 };        // caçamba no desenho; dobradiça no canto de baixo de trás
const SAND_TOP = 14, SAND_H = 12;

const srcCache = new Map();
function pixels(img) {
  let s = srcCache.get(img);
  if (s) return s;
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  s = { w: img.width, h: img.height, d: g.getImageData(0, 0, img.width, img.height).data }; srcCache.set(img, s);
  return s;
}
const hex = n => '#' + n.toString(16).padStart(6, '0');
// cor de um pixel do desenho (null = transparente), com a cabine azul tingida pela cor do nível
function colorAt(s, x, y, tint) {
  if (x < 0 || y < 0 || x >= s.w || y >= s.h) return null;
  const i = (y * s.w + x) * 4, d = s.d;
  if (d[i + 3] < 128) return null;
  let r = d[i], g = d[i + 1], b = d[i + 2];
  if (tint && b > r + 40 && b > g + 15) { const f = Math.min(1.4, (b + g) / 300); r = Math.min(255, tint[0] * f); g = Math.min(255, tint[1] * f); b = Math.min(255, tint[2] * f); }
  return hex((Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b));
}
const tintOf = lv => { if (lv < 1) return null; const n = parseInt(TRUCK_TINT[Math.min(9, lv - 1)].slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
// o monte de areia (e o contorno dele) fica acima da borda da caçamba (y < 26), antes da parede da frente (x < 66)
const isSandArea = (x, y) => y < 26 && x < 66;

// basculante: ang 0..steps (caçamba erguida até 44°), amt 0..4 (areia que ainda resta)
export function dumpArt(lv, ang, amt, steps) {
  const img = art('caminhao-areia');
  if (!img) return null;
  return makeSprite(`pl-dump-${lv}-${ang}-${amt}`, img.width, img.height + TRUCK_TOP, p => {
    const s = pixels(img), tint = tintOf(lv), cut = SAND_TOP + (4 - amt) / 4 * SAND_H;
    const inBed = (x, y) => x >= BED.x0 && x < BED.x1 && y >= BED.y0 && y < BED.y1;
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {           // o caminhão sem a caçamba
      if (inBed(x, y)) continue;
      const c = colorAt(s, x, y, tint); if (c) p.px(x, y + TRUCK_TOP, c);
    }
    const a = ang / steps * 44 * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    for (let dy = -64; dy <= 4; dy++) for (let dx = -46; dx <= 60; dx++) {   // a caçamba girada em volta da dobradiça
      const sx = Math.round(DUMP_PIVOT + dx * ca - dy * sa), sy = Math.round(BED.py + dx * sa + dy * ca);
      if (!inBed(sx, sy) || (amt < 4 && sy < cut && isSandArea(sx, sy))) continue;
      const c = colorAt(s, sx, sy, tint); if (c) p.px(DUMP_PIVOT + dx, BED.py + dy + TRUCK_TOP, c);
    }
  }, { outline: null });
}

// betoneira (estática; a cabine muda de cor por nível)
export function mixerArt(lv) {
  const img = art('betoneira');
  if (!img) return null;
  return makeSprite(`pl-mix-${lv}`, img.width, img.height, p => {
    const s = pixels(img), tint = tintOf(lv);
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) { const c = colorAt(s, x, y, tint); if (c) p.px(x, y, c); }
  }, { outline: null });
}
