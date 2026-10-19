// Turismo e imóveis desenhados no mundo
import { H, FH, TW, TL } from '../data/constants.js';
import { S } from '../sim/state.js';
import { pending } from '../sim/realty.js';
import { R, T, hash } from './canvas.js';
import { cam, worldY } from './camera.js';
import { V } from './view.js';

const SHIRTS = ['#e8505b', '#4fb0e8', '#f2d24a', '#7ad37a', '#c58be8', '#ff9f43'];
const SKIN = ['#e0a878', '#c68642', '#8d5524', '#f1c27d'];
const HAIR = ['#3a2a1a', '#1d1d22', '#8a5a2a', '#c9a227'];

// visitante de ~44 px, virado para a torre (esquerda → direita)
function tourist(x, y, i) {
  if (cam.z < 0.1) return;
  const bob = Math.floor(V.t * 2 + i) % 4 === 0 ? 2 : 0, sh = SHIRTS[i % SHIRTS.length], sk = SKIN[i % 4];
  R(x - 5, y, 4, 16, '#33456b'); R(x + 1, y, 4, 16, '#2b3a5c'); R(x - 6, y, 6, 3, '#222'); R(x + 1, y, 6, 3, '#222');
  R(x - 7, y + 16, 14, 15, sh); R(x - 9, y + 18, 3, 11, sh); R(x + 6, y + 18, 3, 11, sh);
  R(x - 9, y + 15, 3, 3, sk); R(x + 6, y + 15, 3, 3, sk);
  R(x - 5, y + 31 + bob, 10, 10, sk); R(x + 2, y + 35 + bob, 2, 2, '#1d1d22');
  R(x - 6, y + 39 + bob, 12, 4, HAIR[i % 4]); if (i % 3 === 0) { R(x - 8, y + 41 + bob, 16, 2, '#f2d24a'); R(x - 5, y + 43 + bob, 10, 4, '#f2d24a'); }
  if (i % 4 === 1) R(x + 7, y + 22, 5, 7, '#1d1d22'); // câmera fotográfica
}

// fila de visitantes no térreo, à esquerda da torre
export function drawTourGround(tour) {
  if (S.lv.bilheteria < 1 || worldY(H) > 300) return;
  const n = Math.min(5, Math.ceil(tour.demand * 3 + (tour.queue > 0 ? 3 : 0)));
  for (let i = n - 1; i >= 0; i--) tourist(TL - 108 - i * 22, 0, i);
  // bilheteria
  R(TL - 92, 0, 30, 62, '#2f5d8a'); R(TL - 88, 30, 22, 18, '#bfe3ff'); R(TL - 96, 62, 38, 8, '#f2b630');
  T('INGRESSOS', TL - 77, 75, 8, '#f2b630', 'center');
}

// cabine do elevador panorâmico, helicóptero e cápsula espacial
export function drawTourAir(topWP) {
  if (S.lv.bilheteria >= 1) {
    const ph = (V.t / 20) % 1, a = ph < .45 ? ph / .45 : ph < .55 ? 1 : 1 - (ph - .55) / .45;
    const cy = a * Math.max(0, topWP - FH);
    R(TL - 32, 0, 3, topWP, '#5b6170');
    R(TL - 56, cy, 24, 34, '#2b3142'); R(TL - 54, cy + 2, 20, 28, '#9fd8ef'); R(TL - 54, cy + 26, 20, 2, '#e9f6fb');
    if (cam.z >= 0.3) { R(TL - 50, cy + 4, 4, 12, SHIRTS[0]); R(TL - 50, cy + 16, 4, 4, SKIN[0]); R(TL - 43, cy + 4, 4, 12, SHIRTS[1]); R(TL - 43, cy + 16, 4, 4, SKIN[2]); }
  }
  if (S.lv.heliponto >= 1) {
    const a = V.t * .45, x = Math.cos(a) * 300, y = topWP + FH * 1.4 + Math.sin(V.t * 1.1) * 12, f = Math.sin(a) < 0;
    const P = (lx, ly, w, h, c) => R(f ? x + lx : x - lx - w, y + ly, w, h, c);
    P(-18, 0, 38, 20, '#d94a3a'); P(6, 6, 12, 10, '#bfe3ff'); P(-48, 10, 32, 5, '#d94a3a'); P(-52, 6, 6, 16, '#d94a3a');
    P(-14, -6, 30, 3, '#3b4152'); P(-10, -4, 2, 4, '#3b4152'); P(10, -4, 2, 4, '#3b4152');
    const w = Math.floor(V.t * 20) % 2 ? 70 : 40; P(1 - w / 2, 22, w, 2, '#2d3340'); P(-1, 20, 3, 3, '#2d3340');
  }
  if (S.lv.porto >= 1) {
    const ph = (V.t / 14) % 1;
    if (ph < .6) {
      const y = topWP + 10 + Math.pow(ph / .6, 2) * 2400, x = TL + TW - 40;
      R(x, y, 18, 42, '#eef1f6'); R(x + 3, y + 42, 12, 8, '#d94a3a'); R(x + 6, y + 50, 6, 4, '#d94a3a'); R(x, y + 24, 18, 4, '#3b6fd1');
      const fl = Math.floor(V.t * 16) % 2;
      R(x + 4, y - 16 - fl * 6, 10, 16 + fl * 6, '#ffb43a'); R(x + 6, y - 26 - fl * 6, 6, 10, '#ff6b4a');
      if (ph < .1) for (let i = 0; i < 4; i++) R(x - 30 + i * 22 + hash(i, Math.floor(V.t * 8)) * 8, topWP + 2, 12, 6, '#c7ccd6');
    }
  }
}

// placa "VENDE-SE / ALUGA-SE" no último andar pronto, quando há andares sem destino
export function drawForSale(topWP) {
  if (topWP < FH || pending() <= 0 || (S.lv.corretor >= 1 && S.broker.on)) return;
  const x = TL + TW - 112, y = topWP - 30;
  R(x - 3, y - 3, 104, 26, '#b8741a'); R(x, y, 98, 20, '#fff3cc');
  R(x + 20, y - 16, 4, 13, '#5b6170'); R(x + 74, y - 16, 4, 13, '#5b6170');
  if (!T(Math.floor(V.t / 2) % 2 ? 'VENDE-SE' : 'ALUGA-SE', x + 49, y + 10, 14, '#b3261e', 'center')) R(x + 10, y + 8, 78, 4, '#b3261e');
}
