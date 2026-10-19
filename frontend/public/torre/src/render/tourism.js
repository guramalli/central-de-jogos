// Turismo e imóveis desenhados no mundo
import { H, FH, TW, TL } from '../data/constants.js';
import { S } from '../sim/state.js';
import { pending } from '../sim/realty.js';
import { R, T, hash } from './canvas.js';
import { cam, worldY } from './camera.js';
import { V } from './view.js';
import { blit } from './sprites.js';
import { tourist } from './workers.js';
import { boothSprite, panoSprite, heliSprite, rocketSprite } from './props.js';

const SHIRTS = ['#e8505b', '#4fb0e8', '#f2d24a', '#7ad37a', '#c58be8', '#ff9f43'];

// fila de visitantes no térreo, à esquerda da torre
export function drawTourGround(tour) {
  if (S.lv.bilheteria < 1 || worldY(H) > 300) return;
  const n = Math.min(5, Math.ceil(tour.demand * 3 + (tour.queue > 0 ? 3 : 0)));
  for (let i = n - 1; i >= 0; i--) tourist(TL - 112 - i * 24, 0, i, { phase: V.t });
  // bilheteria
  blit(boothSprite(), TL - 94, 0, 3, 76);
  T('INGRESSOS', TL - 77, 75, 8, '#f2b630', 'center');
}

// cabine do elevador panorâmico, helicóptero e cápsula espacial
export function drawTourAir(topWP) {
  if (S.lv.bilheteria >= 1) {
    const ph = (V.t / 20) % 1, a = ph < .45 ? ph / .45 : ph < .55 ? 1 : 1 - (ph - .55) / .45;
    const cy = a * Math.max(0, topWP - FH);
    R(TL - 32, 0, 3, topWP, '#5b6170');
    R(TL - 31, 0, 1, topWP, '#8f95a8');
    blit(panoSprite(SHIRTS[0], SHIRTS[1]), TL - 58, cy, 1, 37);
  }
  if (S.lv.heliponto >= 1) {
    const a = V.t * .45, x = Math.cos(a) * 300, y = topWP + FH * 1.4 + Math.sin(V.t * 1.1) * 12, f = Math.sin(a) < 0;
    blit(heliSprite(Math.floor(V.t * 20) % 2), x, y, 56, 32, !f);
  }
  if (S.lv.porto >= 1) {
    const ph = (V.t / 14) % 1;
    if (ph < .6) {
      const y = topWP + 10 + Math.pow(ph / .6, 2) * 2400, x = TL + TW - 40;
      blit(rocketSprite(), x, y, 2, 56);
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
