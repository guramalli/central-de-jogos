// Térreo em coordenadas de mundo: orla de Praia Grande, fundação, estoque, caminhão e serventes.
// Dividido em fundo (antes da torre) e frente (depois da torre).
import { W, H, TW, TL, MPF } from '../data/constants.js';
import { altOf, floorOf, mpfAt } from '../data/height.js';
import { ERA_STYLE, eraAt } from '../data/eras.js';
import { S } from '../sim/state.js';
import { R, T, hash, lerp, clamp } from './canvas.js';
import { cam, worldX, worldY } from './camera.js';
import { V } from './view.js';
import { spark } from './particles.js';
import { worker } from './workers.js';
import { SHAFT_X } from './tower.js';
import { zzz } from './signs.js';
import { blit } from './sprites.js';
import { islandSprite } from './props.js';
import { truckSprite, wheelSprite, TRUCK_AX, TRUCK_AY, BED_STEPS, orlaSprite, calcadaoTile, kilnSprite, palmTrunk, palmCrown, palletSprite } from './props.js';
import { shade } from './sprites.js';

const STOCK_X = 168;
const groundVisible = () => worldY(H) < 420; // o chão (ou algo perto dele) está na tela

export function drawGroundBack() {
  if (!groundVisible()) return;
  // mar ao fundo
  R(-1e7, 0, 2e7, 64, '#3b8fc6');
  R(-1e7, 0, 2e7, 3, '#e8f2f6'); R(-1e7, 3, 2e7, 2, '#7ec4ec'); // espuma na beira
  if (cam.z >= 0.25) for (let i = -40; i < 60; i++) { const x = i * 46 + ((V.t * 14) % 46); if (hash(i, 3) < .5) R(x, 20 + hash(i, 4) * 36, 14, 2, '#9fd4f2'); }
  // prédios da orla, atrás da obra
  for (let i = 0; i < 16; i++) {
    const bx = 150 + i * 74 + hash(i, 20) * 20, bw = 52 + hash(i, 22) * 22, bh = 110 + hash(i, 21) * 210;
    if (cam.z >= 0.35) blit(orlaSprite(i, bw, bh, i % 3 ? '#8ea6b8' : '#9fb3c2'), bx, 4, 0, Math.round(bh) + 16);
    else { R(bx, 4, bw, bh, i % 3 ? '#8ea6b8' : '#9fb3c2'); R(bx, 4 + bh, bw, 4, '#7d93a5'); }
  }
  // do lado do mar: mar aberto, com uma ilha no horizonte (azulada pela distância) e um navio passando
  blit(islandSprite(), -860, 62, 0, 85);
  const shx = -900 - ((V.t * 6) % 1400);
  R(shx, 50, 70, 8, '#3e4a5c'); R(shx + 4, 58, 50, 6, '#5a6676'); R(shx + 10, 64, 8, 6, '#c0504d'); R(shx + 26, 64, 18, 4, '#d9dde4'); R(shx, 49, 70, 1, '#2a3340');
  // areia e calçadão
  R(-1e7, -1e6, 2e7, 1e6, '#e2c98e');
  if (cam.z >= 0.3) for (let i = 0; i < 90; i++) R(-700 + hash(i, 31) * 1600, -20 - hash(i, 32) * 400, 3, 3, '#c9ad72');
  R(-1e7, -16, 2e7, 16, '#d7bb7c');
  if (cam.z >= 0.4) { // calçadão com as ondas pretas e brancas
    const ct = calcadaoTile(), x0 = Math.floor(worldX(0) / 64) * 64, x1 = Math.min(worldX(W), -330 + 1e9);
    for (let x = Math.max(x0, -330); x < x1; x += 64) blit(ct, x, -16, 0, 14);
    R(-330, -2, 1e7, 2, '#b9a377'); R(-330, -16, 1e7, 1, '#9c8a62');
  }
  R(-1e7, -2, 2e7, 2, '#c4a46a');
  // beira-mar reta até o fim: areia molhada e espuma das ondas chegando na faixa da praia (sem mar na frente)
  R(-1e7, -6, 1e7 - 330, 6, '#cdb079');
  if (cam.z >= 0.25) {
    const x0 = Math.floor(worldX(0) / 60) * 60, x1 = Math.min(worldX(W), -330);
    for (let x = x0; x < x1; x += 60) { const q = (V.t * 0.35 + hash(x / 60, 9)) % 1, w = 24 + 20 * Math.sin(q * Math.PI); R(x + 30 - w / 2, -2 - Math.round(3 * Math.sin(q * Math.PI)), w, 2, 'rgba(245,242,232,.85)'); }
  }
  // fundação (corte no solo)
  const depth = 30 + Math.min(180, S.lv.fundacao * 20);
  R(TL - 12, -depth, TW + 24, depth, '#7b6a55');
  if (cam.z >= 0.3) for (let i = 0; i < 40; i++) R(TL - 8 + hash(i, 50) * (TW + 14), -depth + hash(i, 51) * depth, 4, 3, '#6a5a47');
  const piles = 3 + Math.min(8, S.lv.fundacao);
  for (let i = 0; i < piles; i++) { const px = TL + 4 + Math.floor(i * (TW - 14) / (piles - 1)); R(px, -depth - 30, 6, depth + 30, '#a3a9b2'); R(px, -depth - 30, 2, depth + 30, '#c7ccd6'); }
  R(TL - 12, -6, TW + 24, 6, '#5b4d3d');
  if (S.lv.olaria > 0) kiln(430, S.lv.olaria);
  if (S.lv.premold > 0) precastYard(S.lv.premold);
  for (let k = 0; k < Math.min(3, S.lv.usina || 0); k++) { // Usina de concreto: um silo por nível
    const x = 508 + k * 15, h = 70 + k * 8;
    R(x, 14, 3, h - 14, '#5a5f6a'); R(x + 9, 14, 3, h - 14, '#5a5f6a');
    R(x - 1, 22, 14, h - 22, '#c9ced8'); R(x - 1, 22, 3, h - 22, '#eef0f4'); R(x + 10, 22, 3, h - 22, '#9aa0ab');
    R(x + 2, 14, 8, 8, '#9aa0ab'); R(x + 4, 10, 4, 4, '#5a5f6a'); R(x - 2, h, 16, 3, '#7c818c');
    R(x - 1, h - 20, 14, 3, '#3a77b0');
  }
}

// Olaria própria: forno de tijolos com chaminé fumegando (atrás do caminhão)
// a cada nível: chaminé mais alta, pilhas de tijolos secando ao lado e, a partir do nível 6, uma segunda chaminé
function kiln(x, lv) {
  blit(kilnSprite(Math.floor(V.t * 5) % 2), x, 0, 1, 101);
  const ext = Math.min(40, 4 * (lv - 1)), stacks = [[x + 47, 98 + ext]];
  for (let y = 98; y < 98 + ext; y += 6) { R(x + 45, y, 12, 6, '#8a4c32'); R(x + 45, y, 12, 1, '#6e3b26'); }
  if (ext) { R(x + 43, 96 + ext, 16, 4, '#5a3322'); R(x + 43, 99 + ext, 16, 1, '#7a4a30'); }
  if (lv >= 6) { const h = 70 + (lv - 6) * 6; R(x + 6, 48, 10, h - 48, '#8a4c32'); for (let y = 48; y < h; y += 6) R(x + 6, y, 10, 1, '#6e3b26'); R(x + 4, h - 2, 14, 4, '#5a3322'); stacks.push([x + 7, h + 2]); }
  for (const [sx, sy] of stacks) for (let k = 0; k < 4; k++) { const q = (V.t * .5 + k / 4) % 1; R(sx + Math.sin(q * 6 + k) * 4, sy + q * 70, 8 + q * 10, 6 + q * 6, `rgba(220,220,225,${(.5 * (1 - q)).toFixed(2)})`); }
  // tijolos crus secando, entre o caminhão e o forno (uma pilha por nível, até 6)
  if (cam.z >= 0.3) for (let k = 0; k < Math.min(6, lv); k++) {
    const bx = x - 52 + k * 8, rows = 2 + (k % 3);
    for (let r = 0; r < rows; r++) { R(bx, r * 5, 7, 4, r % 2 ? '#c0603c' : '#b0553a'); R(bx, r * 5 + 4, 7, 1, '#8a3f2a'); }
  }
  T('OLARIA' + (lv > 1 ? ' ' + lv : ''), x + 35, 30, 9, '#f4e6c8', 'center');
}

// Fábrica de pré-moldados: pátio na areia à esquerda da torre. A cada nível, mais um cavalete com painéis de parede;
// a partir do nível 2 um pórtico rolante leva um painel de um lado ao outro; no 4 o pórtico ganha a placa
function precastYard(lv) {
  if (cam.z < 0.25) { R(-290, 0, 140, 30, '#9a9a94'); return; }
  const X0 = -292, X1 = -146, st = ERA_STYLE[eraAt(altOf(S.floors))];
  R(X0, -2, X1 - X0, 4, '#8f8f88'); R(X0, 1, X1 - X0, 1, '#b4b4ac');
  const panel = (px, py, h) => { R(px, py, 7, h, '#b9b9b2'); R(px, py, 1, h, '#dcdcd4'); R(px + 6, py, 1, h, '#8f8f88'); R(px + 1, py + h * 0.45, 5, h * 0.25, '#5a6070'); };
  for (let k = 0; k < Math.min(6, lv); k++) {
    const rx = X0 + 8 + k * 23;
    R(rx + 10, 0, 2, 56, '#6a4a2a'); R(rx + 1, 0, 20, 3, '#6a4a2a');              // cavalete em A
    for (let j = 0; j < 3; j++) panel(rx + j * 7, 2, 52 - Math.abs(j - 1) * 6);
  }
  if (lv >= 2) {
    const c = lv >= 5 ? '#d23c28' : '#f2b630', cd = shade(c, -0.3), top = 84;
    for (const lx of [X0 - 4, X1 - 2]) { R(lx, 0, 6, top, c); R(lx, 0, 2, top, shade(c, 0.3)); R(lx - 3, 0, 12, 4, '#3b4152'); }
    R(X0 - 6, top, X1 - X0 + 14, 7, c); R(X0 - 6, top, X1 - X0 + 14, 2, cd);
    for (let x = X0; x < X1; x += 12) R(x, top + 2, 1, 4, cd);
    const q = (V.t / 9) % 1, go = q < 0.5, t = go ? q * 2 : 2 - q * 2, e = t * t * (3 - 2 * t), tx = X0 + 12 + e * (X1 - X0 - 30);
    R(tx - 6, top - 6, 18, 7, '#3b4152'); R(tx - 5, top - 5, 16, 2, '#7a8091');
    const hy = 50 + Math.sin(V.t * 1.3) * 2;
    R(tx + 2, hy, 1, top - 6 - hy, '#2a2a33'); R(tx - 1, hy - 3, 8, 3, '#2a2a33');
    if (go) { R(tx - 14, hy - 30, 34, 26, '#b9b9b2'); R(tx - 14, hy - 30, 34, 2, '#dcdcd4'); R(tx - 4, hy - 22, 14, 10, st.glass || '#5a6070'); }
    if (lv >= 4) { R(-252, top + 10, 64, 12, '#20242f'); T('PRÉ-MOLDADOS', -220, top + 16, 8, '#f4e6c8', 'center'); }
  }
}

function coconut(px, sway) {
  if (cam.z < 0.25) { for (let s = 0; s < 190; s += 30) R(px + Math.round(Math.sin(s / 190 * 1.4) * 14), s, 9, 30, '#7a5531'); R(px - 30 + sway, 186, 88, 10, '#3c8a3f'); return; }
  blit(palmTrunk(), px - 10, 0, 0, 200);
  blit(palmCrown(Math.max(-3, Math.min(3, sway))), px + 14, 192, 70, 28);
}

// caminhão de entrega: o de areia (caçamba basculante) para de ré no monte de areia; a betoneira (Caminhão maior)
// para na tremonha e despeja concreto pela calha. Chegam e vão embora por fora da tela.
const T_IN = 3, T_UP = 1.2, T_POUR = 1.8, T_DOWN = 1, T_OUT = 3, T_CYCLE = T_IN + T_UP + T_POUR + T_DOWN + T_OUT;
const DUMP_STOP = 266, MIX_STOP = 296;
function truckPlan(prod, empty) {
  const per = Math.max(T_CYCLE + 1, clamp(40 / Math.max(.1, prod), 4, 18)), s = V.t % per;
  const kind = S.lv.caminhao > 0 ? 'mixer' : 'dump', stop = kind === 'mixer' ? MIX_STOP : DUMP_STOP;
  const off = Math.max(900, worldX(W) + 60); // fora da tela, à direita (o caminhão nunca "some" à vista)
  const ease = t => t * t * (3 - 2 * t);
  let tx = off, lift = 0, pour = 0, moving = 0;
  const t1 = T_IN, t2 = t1 + T_UP, t3 = t2 + T_POUR, t4 = t3 + T_DOWN, t5 = t4 + T_OUT;
  if (s < t1) { tx = lerp(off, stop, ease(s / T_IN)); moving = 1; }
  else if (s < t2) { tx = stop; lift = (s - t1) / T_UP; }
  else if (s < t3) { tx = stop; lift = 1; pour = (s - t2) / T_POUR; }
  else if (s < t4) { tx = stop; lift = 1 - (s - t3) / T_DOWN; pour = 1; }
  else if (s < t5) { tx = lerp(stop, off, ease((s - t4) / T_OUT)); moving = 1; pour = 1; }
  else pour = 1;
  if (empty) { lift = 0; pour = 0; }
  return { kind, stop, tx, lift, pour, moving, pouring: !empty && s >= t2 && s < t3, s, t2 };
}

// monte de areia ao lado do estoque (cresce com o material no pátio) e a areia caindo da caçamba
function sandPile(x, gy, pouring, pq) {
  const h = 5 + Math.round(13 * Math.min(1, S.ground / 60) + (pouring ? pq * 4 : 0)), w = h * 3;
  for (let r = 0; r < h; r += 2) { const ww = Math.round(w * (1 - r / h)); R(x - ww / 2, gy + r, ww, 2, r % 4 ? '#d9bd80' : '#cfb072'); }
  R(x - w / 2, gy, w, 1, '#b8975a');
  return h;
}

// tremonha de concreto: funil de aço em pernas, mangueira até o elevador; enche durante o despejo
function hopper(x, gy, fill) {
  R(x - 11, gy, 3, 10, '#5a5f6a'); R(x + 8, gy, 3, 10, '#5a5f6a'); R(x - 11, gy + 4, 22, 2, '#5a5f6a');
  for (let r = 0; r < 12; r++) { const w = 8 + r * 2; R(x - w / 2, gy + 8 + r, w, 1, r < 1 ? '#5a5f6a' : r > 10 ? '#b4bac4' : '#7c818c'); } // funil
  if (fill > 0) { const lv = Math.round(10 * fill), w = 8 + lv * 2; R(x - w / 2 + 2, gy + 8 + lv, w - 4, 2, '#9a9e9a'); R(x - w / 2 + 3, gy + 9 + lv, 3, 1, '#c2c6c2'); }
  const to = SHAFT_X(0) + 28; // mangueira da bomba até o pé do elevador
  R(Math.min(to, x - 3), gy + 1, Math.abs(x - 3 - to), 3, '#2a2d36'); R(Math.min(to, x - 3), gy + 3, Math.abs(x - 3 - to), 1, '#4a4f5c');
}

function truck(tx, gy, plan, empty) {
  const { kind, lift, pour } = plan;
  const ang = kind === 'dump' ? Math.round(lift * BED_STEPS) : 0;
  const amt = kind === 'dump' && !empty ? Math.max(0, 4 - Math.round(pour * 4)) : 4;
  const load = kind === 'dump' && !empty && amt > 0 ? '#c9ad72' : '';
  const drum = kind === 'mixer' ? Math.floor(V.t * (plan.pouring ? 16 : 8)) % 4 : Math.floor(V.t * 8) % 4; // tambor gira mais rápido despejando
  blit(truckSprite(kind, drum, kind === 'mixer' && lift > 0.3, load, Math.min(10, S.lv.caminhao || 0), ang, amt), tx, gy, TRUCK_AX, TRUCK_AY);
  const wf = plan.moving ? Math.floor(V.t * 10) % 2 : 0;
  for (const wx of [tx + 14, tx + 88]) blit(wheelSprite(wf), wx, gy, 1, 19);
}

// carrinho de mão empurrado por quem está em wx: roda na frente, cabos na mão
// (left = indo para a esquerda; load = cor da carga ou null se vazio)
function wheelbarrow(wx, gy, load, ph, left) {
  const b = Math.round(Math.sin(ph * Math.PI)), x = left ? wx - 40 : wx + 14, lc = Math.min(10, S.lv.cacamba || 0), lh = 6 + Math.round(lc * 0.6);
  const P = (lx, ly, w, h, c) => R(left ? x + lx : x + 26 - lx - w, gy + ly, w, h, c);
  P(2, 0, 8, 8, '#222'); P(4, 2, 4, 4, '#888');
  P(0, 8 + b, 26, 10, '#5b6170'); P(0, 16 + b, 26, 2, '#7a8091');
  if (load) { P(2, 18 + b, 22, lh, load); P(2, 17 + lh + b, 22, 1, 'rgba(255,255,255,.35)'); }
  P(24, 12 + b, 14, 2, '#8b5a2b');
}

// sg: sinais da obra (render/signs.js) — elevador lento empilha material e deixa serventes esperando;
// pouco fornecimento deixa o estoque vazio e o caminhão chegando sem carga
export function drawGroundFront(prod, sg = {}) {
  if (!groundVisible()) return;
  const gy = 0, L = S.lv, st = ERA_STYLE[eraAt(altOf(S.floors))], bc = st.brick;
  // estoque de material no térreo
  const stacks = Math.min(sg.groundJam ? 40 : 20, Math.ceil(S.ground / 6));
  for (let i = 0; i < stacks; i++) {
    const x = STOCK_X + (i % 5) * 16, y = gy + Math.floor(i / 5) * 9;
    if (cam.z >= 0.4) blit(palletSprite(bc), x - 3, y, 0, 13);
    else { R(x, y, 15, 8, bc); R(x, y + 7, 14, 1, st.hi); }
  }
  // caminhão de entrega (chega, descarrega, vai embora)
  const empty = !!sg.supplyLow, plan = truckPlan(prod, empty);
  if (plan.kind === 'dump') {
    const px = DUMP_STOP - 26, ph = sandPile(px, gy, plan.pouring, (plan.s - plan.t2) / T_POUR);
    if (plan.pouring) { // areia escorrendo da traseira da caçamba para o monte: jorro contínuo + grãos soltos
      const pq = (plan.s - plan.t2) / T_POUR, w = Math.round(7 * (1 - pq * 0.6));
      R(DUMP_STOP - 22 - w / 2, gy + ph, w, 30 - ph, '#d9bd80'); R(DUMP_STOP - 22 - w / 2, gy + ph, 2, 30 - ph, '#c9ad72');
      for (let k = 0; k < 14; k++) {
        const q = (V.t * 2.6 + k / 14) % 1, x = DUMP_STOP - 22 + Math.sin(k * 7.3) * (3 + q * 6), y = gy + 30 - q * (30 - ph);
        R(x, y, 2, 2, k % 3 ? '#e6cc92' : '#b8975a');
      }
    }
    if (plan.pouring && Math.floor(V.t * 10) % 3 === 0) spark(px, gy + ph, '#c9ad72');
  } else {
    const hx = MIX_STOP - 16, fill = plan.pouring ? (plan.s - plan.t2) / T_POUR : Math.max(0, 1 - ((V.t % 30) / 8));
    hopper(hx, gy, plan.tx === plan.stop || plan.pouring ? fill : 0.15);
  }
  truck(plan.tx, gy, plan, empty);
  if (plan.kind === 'mixer' && plan.pouring) { // concreto escorrendo da ponta da calha para a tremonha
    const cx = plan.tx - 10, top = gy + 29, bot = gy + 19;
    R(cx - 2, bot, 5, top - bot, '#8e928e'); R(cx - 1, bot, 2, top - bot, '#b4b8b4');
    for (let k = 0; k < 4; k++) { const q = (V.t * 3 + k / 4) % 1; R(cx - 3 + (k % 2) * 6, top - q * (top - bot), 2, 2, '#9a9e9a'); }
  }
  // serventes levando material do estoque ao elevador 1
  // com Caçamba maior eles empurram carrinhos de mão (mais carga por viagem)
  const nw = Math.min(5, L.fornec), to = SHAFT_X(0) + 10, barrow = L.cacamba > 0;
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
