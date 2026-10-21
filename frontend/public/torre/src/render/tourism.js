// Turismo e imóveis desenhados no mundo
import { H, FH, TW, TL } from '../data/constants.js';
import { S } from '../sim/state.js';
import { pending } from '../sim/realty.js';
import { R, T, hash } from './canvas.js';
import { cam, worldY } from './camera.js';
import { V } from './view.js';
import { blit } from './sprites.js';
import { tourist } from './workers.js';
import { boothSprite, heliSprite, rocketSprite } from './props.js';
import { art } from './assets.js';
import { FLAGS } from '../data/flags.js';
import { COMPANY } from '../data/story.js';
import { onMoon } from './eravis.js';
import { floorOf } from '../data/height.js';

const SHIRTS = ['#e8505b', '#4fb0e8', '#f2d24a', '#7ad37a', '#c58be8', '#ff9f43'];

// ---------- elevador panorâmico: cabine de vidro com turistas dentro, presa num trilho na fachada esquerda ----------
// Evolui com o nível do Turismo (bilheteria): 1–2 cabine simples de aço; 3–4 maior, moldura verde-água e luz no teto;
// 5–7 moldura dourada, faixa de LED e letreiro; 8+ duas cabines (uma sobe enquanto a outra desce).
const RAIL_X = TL - 30, BOOTH_X = -360; // bilheteria à esquerda do coqueiro, fila atrás dela
const PANO_TIER = lv => lv >= 8 ? 3 : lv >= 5 ? 2 : lv >= 3 ? 1 : 0;
const PANO_STYLE = [
  { w: 72, frame: '#5b6170', hi: '#8f95a8', roof: '#3b4152', n: 2 },
  { w: 86, frame: '#2f8a8a', hi: '#5fc4c0', roof: '#24606a', n: 3 },
  { w: 100, frame: '#b8902a', hi: '#f2d070', roof: '#7a5a14', n: 4 },
  { w: 100, frame: '#c9a227', hi: '#ffe58a', roof: '#3a2a10', n: 4 },
];
function panoCabin(x, y, st, tier, seed, people = true) {
  const w = st.w, h = 96, simple = cam.z < 0.3;
  // chão, teto e fundo escurecido (o interior)
  R(x, y, w, 6, st.roof); R(x, y + 5, w, 1, st.hi);
  R(x + 3, y + 6, w - 6, h - 16, 'rgba(40,70,95,.55)');
  if (!simple && people) for (let i = 0; i < st.n; i++) tourist(x + 14 + i * ((w - 28) / Math.max(1, st.n - 1)), y + 6, seed + i * 3, { phase: V.t + i * 0.7 });
  // vidro da frente (deixa ver os turistas), reflexos em diagonal
  R(x + 3, y + 6, w - 6, h - 16, 'rgba(175,228,248,.22)');
  if (!simple) for (let k = 0; k < 3; k++) { const rx = x + 8 + k * (w / 3); for (let j = 0; j < 14; j++) R(rx + j, y + h - 18 - j * 4, 2, 3, 'rgba(255,255,255,.28)'); }
  // moldura, montantes e corrimão
  R(x, y, 3, h, st.frame); R(x + w - 3, y, 3, h, st.frame); R(x, y + h - 10, w, 10, st.roof); R(x, y + h - 10, w, 2, st.hi);
  R(x + w / 2 - 1, y + 6, 2, h - 16, st.frame);
  R(x + 3, y + 30, w - 6, 2, st.hi);
  if (tier >= 1) { R(x + w / 2 - 6, y + h - 4, 12, 3, '#fff6c8'); R(x - 2, y + h, w + 4, 3, st.roof); }   // luz no teto
  if (tier >= 2) { // faixa de LED correndo na base e letreiro no teto
    for (let k = 0; k < w - 6; k += 4) R(x + 3 + k, y + 1, 2, 2, (Math.floor(V.t * 6) + k / 4) % 3 < 1 ? '#5fe0ff' : '#1d5a6a');
    if (!simple) { R(x + 6, y + h + 3, w - 12, 10, '#20242f'); T('PANORÂMICO', x + w / 2, y + h + 8, 7, st.hi, 'center'); }
  }
  // carrinho preso no trilho
  R(x + w, y + 20, 8, h - 40, st.roof); R(x + w, y + 24, 8, 2, st.hi);
}
function panoramic(topWP) {
  const lv = S.lv.bilheteria, tier = PANO_TIER(lv), st = PANO_STYLE[tier];
  // trilho com suportes presos à fachada a cada andar
  R(RAIL_X - 4, 0, 6, topWP, '#4a4f5c'); R(RAIL_X - 3, 0, 2, topWP, '#9aa0ab');
  if (cam.z >= 0.25) for (let y = FH / 2; y < topWP; y += FH) { R(RAIL_X, y, TL - RAIL_X, 3, '#5b6170'); R(RAIL_X - 6, y - 2, 10, 7, '#3b4152'); }
  // plataforma de embarque no térreo
  R(RAIL_X - 4 - st.w - 10, 0, st.w + 18, 5, '#7c818c'); R(RAIL_X - 4 - st.w - 10, 4, st.w + 18, 1, '#b4bac4');
  // ciclo: sobe (35%), fica lá em cima (10%), desce (35%) e para no térreo (20%): quem estava dentro sai andando
  // e os próximos da fila entram (pedido do usuário)
  const per = Math.max(14, 24 - lv), top = Math.max(0, topWP - FH * 1.1);
  const cabs = tier >= 3 ? 2 : 1, cx = RAIL_X - 12 - st.w;
  for (let c = 0; c < cabs; c++) {
    const ph = (V.t / per + c * 0.5) % 1;
    const a = ph < .35 ? (1 - Math.cos(ph / .35 * Math.PI)) / 2 : ph < .45 ? 1 : ph < .8 ? (1 + Math.cos((ph - .45) / .35 * Math.PI)) / 2 : 0;
    const boarding = ph >= .8 && cam.z >= 0.3;
    panoCabin(cx, a * top, st, tier, 7 + c * 11, !boarding);
    if (boarding) {
      const q = (ph - .8) / .2, n = st.n, seed = 7 + c * 11;
      for (let i = 0; i < n; i++) {
        const home = cx + 14 + i * ((st.w - 28) / Math.max(1, n - 1)), out = home - 150 - i * 30;
        if (q < .5) { const k = Math.min(1, q / .4); if (k < 1) tourist(home + (out - home) * k, 0, seed + i * 3, { walk: true, flip: true }); }  // saem para a esquerda
        else { const k = Math.min(1, (q - .5) / .4), sx0 = home - 120 - i * 26; tourist(sx0 + (home - sx0) * k, 6 * k, seed + 1 + i * 5, k < 1 ? { walk: true } : { phase: V.t + i }); } // os próximos entram
      }
    }
  }
}

// fila de visitantes no térreo, à esquerda da torre
export function drawTourGround(tour) {
  if (worldY(H) > 300) return;
  const aberta = S.lv.bilheteria >= 1;
  // Obra Viva, antes do Elevador panorâmico: nos primeiros andares, o tapume "em breve" com os curiosos;
  // depois a bilheteria aparece fechada ("ABRE EM BREVE") e os curiosos esperam ao lado
  if (!aberta && FLAGS.viva && S.floors < TAPUME_ANDARES) { curious(); return; }
  if (!aberta && !FLAGS.viva) return;
  const n = aberta ? Math.min(5, Math.ceil(tour.demand * 3 + (tour.queue > 0 ? 3 : 0))) : 3;
  for (let i = n - 1; i >= 0; i--) tourist(BOOTH_X - 40 - i * 24, 0, aberta ? i : 1 + i * 4, { phase: V.t + (aberta ? 0 : i) });
  booth(aberta);
}
const TAPUME_ANDARES = 4;
// bilheteria (aberta: "INGRESSOS"; fechada: janela baixada e "ABRE EM BREVE")
function booth(aberta) {
  if (onMoon()) { moonBooth(aberta); return; }
  const ba = art('bilheteria');
  if (ba) { // bilheteria do PixelLab, de frente; a placa "TICKETS" do desenho ganha o texto em português por cima
    blit(ba, BOOTH_X, 0, 0, ba.height);
    R(BOOTH_X + 13, ba.height - 13, 41, 12, '#f4f1e6'); R(BOOTH_X + 13, ba.height - 13, 41, 1, '#20242f'); R(BOOTH_X + 13, ba.height - 2, 41, 1, '#20242f');
    T(aberta ? 'INGRESSOS' : 'EM BREVE', BOOTH_X + 33.5, ba.height - 7, 7, '#20335a', 'center');
    if (!aberta) { // janela com a porta de enrolar baixada
      const wx = BOOTH_X + 22, wy = ba.height - 49, ww = 29, wh = 21; // a janela do desenho (pixels 22–51 × 28–49, de cima)
      R(wx, wy, ww, wh, '#8a8f99'); for (let y = wy + 2; y < wy + wh; y += 3) R(wx, y, ww, 1, '#6c727e');
      R(wx + 1, wy + wh / 2 - 4, ww - 2, 8, '#c0303a'); T('FECHADO', wx + ww / 2, wy + wh / 2, 5, '#f4f1e6', 'center');
    }
  }
  else { blit(boothSprite(), BOOTH_X, 0, 3, 76); T(aberta ? 'INGRESSOS' : 'EM BREVE', BOOTH_X + 17, 75, 8, '#f2b630', 'center'); }
}

// Lua: módulo pressurizado com cúpula, janela redonda, câmara de ar e a placa (60×48)
function moonBooth(aberta) {
  const x = BOOTH_X;
  R(x + 2, 0, 60, 4, '#5d6573');                                                     // base
  R(x + 4, 4, 56, 30, '#e6e9ef'); R(x + 4, 4, 3, 30, '#c9ced8'); R(x + 56, 4, 4, 30, '#ffffff');
  R(x + 10, 34, 44, 6, '#e6e9ef'); R(x + 18, 40, 28, 5, '#d3d8e0'); R(x + 26, 45, 12, 3, '#c9ced8'); // cúpula em degraus
  R(x + 4, 20, 56, 2, '#3b6fd1');                                                    // faixa
  R(x + 8, 6, 14, 14, '#7c8597'); R(x + 10, 8, 10, 12, aberta ? '#2f3a4e' : '#4d5566'); R(x + 10, 8, 10, 1, '#9aa0ad'); // câmara de ar
  R(x + 29, 8, 18, 10, '#7c8597'); R(x + 31, 9, 14, 8, aberta ? '#ffd27a' : '#22407a'); R(x + 32, 10, 4, 3, 'rgba(255,255,255,.5)'); // janela
  R(x + 50, 36, 2, 10, '#9aa0ad'); R(x + 48, 46, 6, 2, aberta ? '#6fd08c' : '#ff5a4a');  // antena com luz
  R(x + 12, 24, 40, 9, '#f4f1e6'); R(x + 12, 24, 40, 1, '#20242f');
  T(aberta ? 'INGRESSOS' : 'EM BREVE', x + 32, 28.5, 6, '#20335a', 'center');
}

// Obra Viva, antes do Elevador panorâmico: tapume com a placa da construtora e curiosos tirando foto
// (a torre já é famosa pelo projeto: rende um trocado, VIVA.curious)
function curious() {
  const x0 = TL - 146, x1 = TL - 16;
  for (let x = x0; x < x1; x += 26) { R(x, 0, 25, 40, '#d9b57a'); R(x, 0, 1, 40, '#b8925a'); R(x + 2, 36, 21, 2, '#e8c891'); }
  R(x0, 40, x1 - x0, 3, '#9a7444');
  if (cam.z >= 0.3) {
    R(x0 + 8, 40, 3, 34, '#5b6170'); R(x1 - 11, 40, 3, 34, '#5b6170');
    R(x0 + 2, 60, x1 - x0 - 4, 40, '#20242f'); R(x0 + 4, 62, x1 - x0 - 8, 36, '#f2b630'); R(x0 + 4, 84, x1 - x0 - 8, 14, '#20242f');
    T('CONSTRUTORA ' + COMPANY.toUpperCase(), (x0 + x1) / 2, 91, 8, '#f2b630', 'center');
    T('EM BREVE: A TORRE', (x0 + x1) / 2, 77, 8, '#20242f', 'center');
    T('MAIS ALTA DO MUNDO', (x0 + x1) / 2, 68, 8, '#20242f', 'center');
  }
  for (let i = 2; i >= 0; i--) tourist(TL - 32 - i * 40, 0, 1 + i * 4, { phase: V.t + i });
}

const HELI_TETO = 6000; // m
// cabine do elevador panorâmico, helicóptero e cápsula espacial
export function drawTourAir(topWP) {
  // o helicóptero voa por trás da torre e do elevador panorâmico: é desenhado antes da cabine
  if (S.lv.heliponto >= 1 && !onMoon()) { // na Lua não há ar para o rotor
    // voo próprio: circula em volta dos últimos andares, um pouco abaixo do topo (passa por trás da torre),
    // e sobe devagar quando a obra cresce (no máximo ~1 andar a cada 2 s), em vez de pular junto com cada andar.
    // Teto de 6 km (helicóptero de verdade não passa disso): com a torre mais alta, ele circula nessa faixa
    const target = Math.max(FH * 2, Math.min(topWP - FH * 0.9, floorOf(HELI_TETO) * FH)), dt = Math.min(0.1, Math.max(0, V.t - (V.heliT ?? V.t)));
    V.heliT = V.t;
    if (V.heliY === undefined || Math.abs(target - V.heliY) > FH * 6) V.heliY = target;
    else V.heliY += Math.max(-FH * 0.5 * dt, Math.min(FH * 0.5 * dt, target - V.heliY));
    const a = V.t * .45, x = Math.cos(a) * 300, y = V.heliY + Math.sin(V.t * 1.1) * 10, f = Math.sin(a) < 0;
    const ha = art('helicoptero'); // o do PixelLab olha para a esquerda; o rotor pisca por cima
    if (ha) { blit(ha, x, y, ha.width / 2, ha.height - 6, f); if (Math.floor(V.t * 20) % 2) R(x - ha.width * 0.42, y + ha.height - 8, ha.width * 0.62, 1, 'rgba(230,235,245,.7)'); }
    else blit(heliSprite(Math.floor(V.t * 20) % 2), x, y, 56, 32, !f);
  }
  if (S.lv.bilheteria >= 1) panoramic(topWP);
  if (S.lv.porto >= 1) {
    const ph = (V.t / 14) % 1;
    if (ph < .6) {
      const y = topWP + 10 + Math.pow(ph / .6, 2) * 2400, x = TL + TW - 40;
      blit(art('foguete') || rocketSprite(), x, y, 2, 56);
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
