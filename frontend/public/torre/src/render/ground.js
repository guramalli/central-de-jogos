// Térreo em coordenadas de mundo: orla de Praia Grande, fundação, estoque, caminhão e serventes.
// Dividido em fundo (antes da torre) e frente (depois da torre).
import { H, TW, TL, MPF } from '../data/constants.js';
import { ERA_STYLE, eraAt } from '../data/eras.js';
import { S } from '../sim/state.js';
import { R, T, hash, lerp, clamp } from './canvas.js';
import { cam, worldY } from './camera.js';
import { V } from './view.js';
import { spark } from './particles.js';
import { worker } from './workers.js';
import { SHAFT_X } from './tower.js';
import { zzz } from './signs.js';

const STOCK_X = 168, TRUCK_STOP = 248;
const groundVisible = () => worldY(H) < 420; // o chão (ou algo perto dele) está na tela

export function drawGroundBack() {
  if (!groundVisible()) return;
  // mar ao fundo
  R(-1e7, 0, 2e7, 64, '#3b8fc6');
  if (cam.z >= 0.25) for (let i = -40; i < 60; i++) { const x = i * 46 + ((V.t * 14) % 46); if (hash(i, 3) < .5) R(x, 20 + hash(i, 4) * 36, 14, 2, '#9fd4f2'); }
  // prédios da orla, atrás da obra
  for (let i = 0; i < 16; i++) {
    const bx = 150 + i * 74 + hash(i, 20) * 20, bw = 52 + hash(i, 22) * 22, bh = 110 + hash(i, 21) * 210;
    R(bx, 4, bw, bh, i % 3 ? '#8ea6b8' : '#9fb3c2'); R(bx, 4 + bh, bw, 4, '#7d93a5');
    if (cam.z >= 0.35) for (let wy = 20; wy < bh - 10; wy += 18) for (let wx = 6; wx < bw - 8; wx += 14) R(bx + wx, 4 + wy, 6, 9, hash(i * 31 + wx, wy) < .25 ? '#ffe7a3' : '#c9dae6');
  }
  for (let i = 0; i < 10; i++) { // e alguns do outro lado, do lado do mar
    const bx = -1400 - i * 80, bw = 50, bh = 90 + hash(i, 40) * 120;
    R(bx, 4, bw, bh, '#8ea6b8');
  }
  // areia e calçadão
  R(-1e7, -1e6, 2e7, 1e6, '#e2c98e');
  if (cam.z >= 0.3) for (let i = 0; i < 90; i++) R(-700 + hash(i, 31) * 1600, -20 - hash(i, 32) * 400, 3, 3, '#c9ad72');
  R(-1e7, -16, 2e7, 16, '#d7bb7c');
  if (cam.z >= 0.4) for (let x = -900; x < 1200; x += 24) { R(x, -10, 12, 3, '#b89a5e'); R(x + 12, -6, 12, 3, '#b89a5e'); }
  R(-1e7, -2, 2e7, 2, '#c4a46a');
  // mar em primeiro plano, à esquerda
  R(-1e7, -1e6, 1e7 - 330, 1e6, '#2f7fb8');
  if (cam.z >= 0.25) for (let y = -16; y > -400; y -= 18) { const o = (V.t * 26 + y * 3) % 80; R(-700 + o, y, 26, 3, '#7ec4ec'); R(-560 + o, y - 8, 20, 3, '#7ec4ec'); }
  R(-330, -1e6, 10, 1e6, '#f5f2e8');
  // fundação (corte no solo)
  const depth = 30 + Math.min(180, S.lv.fundacao * 20);
  R(TL - 12, -depth, TW + 24, depth, '#7b6a55');
  if (cam.z >= 0.3) for (let i = 0; i < 40; i++) R(TL - 8 + hash(i, 50) * (TW + 14), -depth + hash(i, 51) * depth, 4, 3, '#6a5a47');
  const piles = 3 + Math.min(8, S.lv.fundacao);
  for (let i = 0; i < piles; i++) { const px = TL + 4 + Math.floor(i * (TW - 14) / (piles - 1)); R(px, -depth - 30, 6, depth + 30, '#a3a9b2'); R(px, -depth - 30, 2, depth + 30, '#c7ccd6'); }
  R(TL - 12, -6, TW + 24, 6, '#5b4d3d');
  if (S.lv.olaria > 0) kiln(430);
}

// Olaria própria: forno de tijolos com chaminé fumegando (atrás do caminhão)
function kiln(x) {
  R(x, 0, 70, 46, '#9a5b3a'); R(x, 46, 70, 4, '#7d4630'); R(x + 46, 50, 12, 46, '#7d4630'); R(x + 44, 94, 16, 4, '#5a3322');
  for (let k = 0; k < 5; k++) R(x, 8 + k * 8, 70, 1, '#7d4630');
  R(x + 20, 0, 22, 22, '#2a1a12'); R(x + 23, 3, 16, 12, Math.floor(V.t * 5) % 2 ? '#ff8a1e' : '#ffb347');
  for (let k = 0; k < 4; k++) { const q = (V.t * .5 + k / 4) % 1; R(x + 48 + Math.sin(q * 6 + k) * 4, 98 + q * 70, 8 + q * 10, 6 + q * 6, `rgba(220,220,225,${(.5 * (1 - q)).toFixed(2)})`); }
  T('OLARIA', x + 35, 30, 9, '#f4e6c8', 'center');
}

function coconut(px, sway) {
  for (let s = 0; s < 190; s += 10) { const bend = Math.round(Math.sin(s / 190 * 1.4) * 14); R(px + bend, s, 9, 10, s % 20 ? '#7a5531' : '#5e3f22'); }
  const tx = px + 14 + sway, ty = 190;
  const leaf = (dx, dy, w, c) => R(tx + dx, ty + dy, w, 6, c);
  leaf(-46, 0, 44, '#3c8a3f'); leaf(8, 0, 44, '#3c8a3f'); leaf(-58, -8, 18, '#2f6e33'); leaf(48, -8, 18, '#2f6e33');
  leaf(-30, 8, 66, '#4aa64c'); leaf(-14, 14, 34, '#5cbf5e'); leaf(-66, -16, 12, '#2f6e33'); leaf(62, -16, 12, '#2f6e33');
  R(tx - 4, ty - 8, 8, 8, '#6b4a24'); R(tx + 4, ty - 6, 7, 7, '#7a5531');
}

function truck(tx, tilt, gy, empty = false) {
  const bed = tilt ? '#d38a1f' : '#f2a62a';
  R(tx, gy + 14, 76, 28, bed); R(tx, gy + 38, 76, 4, '#b8741a');
  if (S.lv.caminhao > 0) { // caminhão maior vira caminhão-betoneira com o tambor girando
    R(tx + 4, gy + 40, 68, 30, '#c9ced8'); R(tx + 4, gy + 66, 68, 4, '#e8ebf0'); R(tx + 4, gy + 40, 68, 3, '#9aa0ad');
    for (let k = 0; k < 4; k++) { const sx = tx + 4 + ((V.t * 26 + k * 17) % 68); R(sx, gy + 43, 5, 23, '#f2a62a'); }
    R(tx - 8, gy + 44, 12, 6, '#9aa0ad'); if (tilt) R(tx - 10, gy + 30, 6, 14, '#9aa0ad');
  } else if (tilt && !empty) { R(tx + 4, gy + 42, 68, 10, '#c9ad72'); }
  for (let x = tx + 6; x < tx + 72; x += 14) R(x, gy + 16, 2, 22, '#d38a1f');
  R(tx + 76, gy + 14, 38, 40, '#2f5d8a'); R(tx + 84, gy + 32, 24, 16, '#bfe3ff'); R(tx + 76, gy + 14, 38, 4, '#24476a');
  for (const wx of [tx + 14, tx + 88]) { R(wx, gy, 18, 18, '#222'); R(wx + 5, gy + 5, 8, 8, '#888'); }
}

// carrinho de mão empurrado por quem está em wx: roda na frente, cabos na mão
// (left = indo para a esquerda; load = cor da carga ou null se vazio)
function wheelbarrow(wx, gy, load, ph, left) {
  const b = Math.round(Math.sin(ph * Math.PI)), x = left ? wx - 40 : wx + 14;
  const P = (lx, ly, w, h, c) => R(left ? x + lx : x + 26 - lx - w, gy + ly, w, h, c);
  P(2, 0, 8, 8, '#222'); P(4, 2, 4, 4, '#888');
  P(0, 8 + b, 26, 10, '#5b6170'); P(0, 16 + b, 26, 2, '#7a8091');
  if (load) { P(2, 18 + b, 22, 6, load); P(2, 23 + b, 22, 1, 'rgba(255,255,255,.35)'); }
  P(24, 12 + b, 14, 2, '#8b5a2b');
}

// sg: sinais da obra (render/signs.js) — elevador lento empilha material e deixa serventes esperando;
// pouco fornecimento deixa o estoque vazio e o caminhão chegando sem carga
export function drawGroundFront(prod, sg = {}) {
  if (!groundVisible()) return;
  const gy = 0, L = S.lv, st = ERA_STYLE[eraAt(S.floors * MPF)], bc = st.brick;
  // estoque de material no térreo
  const stacks = Math.min(sg.groundJam ? 40 : 20, Math.ceil(S.ground / 6));
  for (let i = 0; i < stacks; i++) {
    const x = STOCK_X + (i % 5) * 16, y = gy + Math.floor(i / 5) * 9;
    R(x, y, 15, 8, bc); R(x, y + 7, 14, 1, st.hi); R(x, y, 15, 1, 'rgba(0,0,0,.2)');
  }
  // caminhão de entrega (chega, descarrega, vai embora)
  const per = clamp(40 / Math.max(.1, prod), 4, 16), ph = (V.t % per) / per;
  const tx = ph < .3 ? lerp(800, TRUCK_STOP, ph / .3) : ph < .6 ? TRUCK_STOP : lerp(TRUCK_STOP, 900, (ph - .6) / .4);
  const tilt = ph >= .3 && ph < .6;
  truck(tx, tilt, gy, !!sg.supplyLow);
  if (tilt && !sg.supplyLow && Math.floor(V.t * 10) % 3 === 0) spark(tx + 4, gy + 40, '#c9ad72');
  // serventes levando material do estoque ao elevador 1
  // com Caçamba maior eles empurram carrinhos de mão (mais carga por viagem)
  const nw = Math.min(3, L.fornec), to = SHAFT_X(0) + 10, barrow = L.cacamba > 0;
  for (let i = 0; i < nw; i++) {
    if (sg.groundJam) { // fila na porta do elevador, carregados, esperando a vez
      const x = to + 18 + i * 24;
      if (barrow) wheelbarrow(x, gy, bc, 0, true);
      worker(x, gy, { phase: 0, carry: barrow ? null : bc, flip: true, skin: i + 1 });
      zzz(x, gy + (barrow ? 56 : 68), i);
      continue;
    }
    if (sg.supplyLow) { // nada para levar: esperam ao lado do estoque vazio
      const x = STOCK_X + 10 + i * 22;
      worker(x, gy, { phase: 0, flip: i % 2 === 1, skin: i + 1 });
      zzz(x, gy + 56, i + 3);
      continue;
    }
    const p = (V.t * .22 + i / nw) % 1, go = p < .5, x = lerp(STOCK_X + 30, to, go ? p * 2 : 2 - p * 2);
    if (barrow) wheelbarrow(x, gy, go ? bc : null, V.t * 3 + i, go);
    worker(x, gy, { walk: true, phase: V.t * 3 + i, carry: barrow ? null : go ? bc : null, flip: go, skin: i + 1 });
  }
  // coqueiros
  coconut(-300, Math.round(Math.sin(V.t * 1.5) * 3));
  coconut(560, Math.round(Math.sin(V.t * 1.5 + 1) * 3));
  // pássaros
  if (cam.z >= 0.2) for (let i = 0; i < 4; i++) {
    const x = ((V.t * (40 + i * 9) + i * 300) % 1600) - 700, y = 340 + i * 46 + Math.sin(V.t * 3 + i) * 6, f = Math.floor(V.t * 6 + i) % 2;
    R(x, y, 4, 3, '#2d3340'); R(x - 6, y + (f ? 3 : -2), 6, 2, '#2d3340'); R(x + 4, y + (f ? 3 : -2), 6, 2, '#2d3340');
  }
}
