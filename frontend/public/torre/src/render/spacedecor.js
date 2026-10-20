// Fachadas do espaço menos repetidas (pedido do usuário, out/2026: "fachadas do espaço mais variadas").
// As imagens do PixelLab (assets/fachadas/5 e 6) continuam a base; por cima, detalhes fixos por andar (hash do índice):
// - Espaço (5, módulos brancos): blocos de 3 andares com tom levemente diferente, painel solar na faixa de cima,
//   faixa de sinalização, escotilha de acoplagem entre as janelas, tubulação vertical e luz de posição piscando;
// - Órbita (6, roxo neon): o neon muda de cor por bloco de 4 andares (cópias recoloridas da imagem, feitas uma vez),
//   estufas verdes acesas em algumas escotilhas e um letreiro de LED de vez em quando.
import { R, hash } from './canvas.js';
import { V } from './view.js';
import { TL, FH } from '../data/constants.js';

// cópia da fachada com o neon magenta trocado por outra cor (mantém a luminosidade de cada pixel)
const NEON = [null, [64, 226, 255], [255, 184, 72]];
const cache = new Map();
function recolor(img, v) {
  const key = img.src + '|' + v;
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), p = d.data, [tr, tg, tb] = NEON[v];
  for (let k = 0; k < p.length; k += 4) {
    const r = p[k], gg = p[k + 1], b = p[k + 2];
    if (r > 140 && b > 110 && r - gg > 70 && b - gg > 40) { // pixel de neon (magenta/rosa)
      const l = Math.min(1.25, (r + b) / 2 / 220);
      p[k] = Math.min(255, tr * l); p[k + 1] = Math.min(255, tg * l); p[k + 2] = Math.min(255, tb * l);
    }
  }
  g.putImageData(d, 0, 0);
  cache.set(key, c);
  return c;
}
// imagem da fachada para o andar i (Órbita: cor do neon por bloco de 4 andares)
export function facadeImg(img, e, i) {
  if (e !== 6 || !img || !img.complete) return img;
  const v = Math.floor(hash(Math.floor(i / 4), 71) * 3);
  return v ? recolor(img, v) : img;
}

// detalhes por cima da fachada (coordenadas da imagem: x da esquerda, y de cima, 240×96)
export function spaceDecor(e, i, y0, occ) {
  const P = (x, y, w, h, c) => R(TL + x, y0 + FH - y - h, w, h, c);
  const blk = Math.floor(i / 3), h1 = hash(i, 61), h2 = hash(blk, 62);
  if (e === 5) {
    if (h2 < 0.33) P(0, 0, 240, 80, 'rgba(70,100,150,.10)');          // módulo de outra remessa: tom mais frio
    else if (h2 > 0.8) P(0, 0, 240, 80, 'rgba(255,214,150,.08)');     // ou mais quente
    if (blk % 4 === 1) { P(112, 0, 5, 80, '#9aa0ad'); P(112, 0, 1, 80, '#c9ced8'); for (let y = 8; y < 80; y += 24) P(110, y, 9, 3, '#6b7183'); } // tubulação
    if (h1 < 0.18) { // painel solar na faixa de cima
      P(52, 3, 136, 17, '#c9ced8'); P(54, 5, 132, 13, '#1d2f66');
      for (let x = 54; x < 186; x += 11) P(x, 5, 1, 13, '#3b5aa8');
      P(54, 11, 132, 1, '#3b5aa8'); P(54, 5, 132, 1, '#5d7fd0');
    } else if (h1 < 0.3) { // faixa de sinalização
      for (let x = 0; x < 240; x += 8) { P(x, 62, 4, 4, '#f2b630'); P(x + 4, 62, 4, 4, '#2a2d36'); }
    }
    if (h1 > 0.86) { // escotilha de acoplagem entre a 1ª e a 2ª janela
      P(43, 31, 22, 30, '#7c8597'); P(45, 33, 18, 26, '#4d5566'); P(45, 33, 18, 2, '#9aa0ad');
      for (let y = 37; y < 57; y += 6) P(47, y, 14, 2, '#f2b630');
      P(52, 27, 4, 3, Math.floor(V.t * 1.5 + i) % 2 ? '#6fd08c' : '#2f5a3c');
    }
    if (i % 7 === 3 && Math.floor(V.t * 1.2 + i * 0.37) % 3 === 0) P(234, 70, 4, 4, '#ff5a4a'); // luz de posição
  } else if (e === 6) {
    if (occ && h1 < 0.22) { // estufa: uma escotilha acesa de verde, com folhas
      const k = Math.floor(hash(i, 63) * 4), wx = [9, 75, 141, 207][k];
      for (let r = 0; r < 18; r++) { const ins = r < 5 ? 5 - r : r > 12 ? r - 12 : 0; P(wx + 3 + ins, 37 + r, 18 - ins * 2, 1, r < 6 ? '#c8ffd2' : '#8ef0a4'); } // vidro aceso (octógono)
      for (let j = 0; j < 5; j++) { const hh = 5 + (j % 2) * 4; P(wx + 5 + j * 3, 55 - hh, 2, hh, '#2f9a4a'); P(wx + 5 + j * 3, 55 - hh, 2, 1, '#5fd47a'); } // folhas
    }
    if (h1 > 0.9) { // letreiro de LED entre as janelas
      P(98, 30, 40, 12, '#140c24'); P(98, 30, 40, 1, '#5a3a8a');
      const on = Math.floor(V.t * 6 + i) % 12;
      for (let j = 0; j < 9; j++) if ((j + on) % 3 !== 0) P(101 + j * 4, 35, 2, 2, j % 2 ? '#ff5adf' : '#40e2ff');
    }
  }
}
