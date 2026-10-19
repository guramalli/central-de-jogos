// Sinais na cena (modo Obra Viva): a obra mostra o que está errado, sem texto.
// Só apresentação: lê as taxas e os estoques reais do motor e decide o que desenhar.
//   falta material  → pedreiros sentados com 💤, laje sem paletes, estoque do chão vazio
//   elevador lento  → pilha grande no chão, serventes esperando na porta do elevador com 💤
//   pedreiros lentos → paletes acumulando no topo, gotas de suor
//   fundação no limite → rachaduras e poeira na base, ⚠ piscando, pedreiros sentados
import { TL, TW } from '../data/constants.js';
import { S } from '../sim/state.js';
import { isCapped } from '../sim/economy.js';
import { FLAGS } from '../data/flags.js';
import { R } from './canvas.js';
import { cam } from './camera.js';
import { V } from './view.js';
import { spark } from './particles.js';

// Estado da obra para os sinais. R0 = rates()
export function obraSigns(R0) {
  if (!FLAGS.viva) return { capped: isCapped(R0) };
  const capped = isCapped(R0), supply = Math.min(R0.prod, R0.tran);
  return {
    capped,
    starving: !capped && S.top < 0.6 && supply < R0.lay * 0.6,             // pedreiros parados boa parte do tempo
    overloaded: !capped && S.top > R0.fcost * 0.5,                          // material sobrando no topo
    groundJam: !capped && S.ground > R0.fcost * 0.6 && R0.tran < R0.prod,   // elevador não dá conta
    supplyLow: !capped && S.ground < 1.5 && R0.prod < R0.tran,              // pouco material chegando
    surplus: Math.max(0, S.top / R0.fcost),                                  // andares de material parados no topo
  };
}

const show = () => cam.z >= 0.2;

// 💤 subindo da cabeça (x, y = topo da cabeça)
export function zzz(x, y, seed = 0) {
  if (!show()) return;
  for (let k = 0; k < 3; k++) {
    const q = (V.t * 0.6 + k / 3 + seed * 0.17) % 1, s = 7 + k * 3, zx = x + 6 + q * 12 + k * 3, zy = y + 6 + q * 26;
    const a = q < 0.8 ? 1 : (1 - q) * 5, c = `rgba(236,230,214,${a.toFixed(2)})`;
    // Z: barra de cima, diagonal (de cima à direita para baixo à esquerda) e barra de baixo
    R(zx, zy + s - 2, s, 2, c); R(zx, zy, s, 2, c);
    const n = Math.round(s / 2);
    for (let i = 1; i < n; i++) R(zx + (s - 2) * (1 - i / n), zy + 2 + (s - 6) * (1 - i / n), 2, 2, c);
  }
}

// gotas de suor ao lado da cabeça
export function sweat(x, y, seed = 0) {
  if (!show()) return;
  for (let k = 0; k < 2; k++) {
    const q = (V.t * 1.4 + k * 0.5 + seed * 0.3) % 1;
    const dx = (k ? 9 : -9) + (k ? q * 4 : -q * 4), dy = -q * 10;
    R(x + dx, y + dy, 3, 4, '#7ec4ec'); R(x + dx + 1, y + dy + 4, 1, 1, '#bfe6f8');
  }
}

// ⚠ piscando
export function warn(x, y) {
  if (!show() || Math.floor(V.t * 2.5) % 2) return;
  for (let r = 0; r < 14; r++) R(x - r / 1.1, y + 14 - r, (r / 1.1) * 2 + 2, 1, '#f2b630');
  R(x - 13, y, 28, 2, '#f2b630');
  R(x, y + 5, 2, 6, '#11131a'); R(x, y + 2, 2, 2, '#11131a');
}

// linha em pixels (passos de 2) — para rachaduras
function seg(x0, y0, x1, y1, c) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2));
  for (let i = 0; i <= n; i++) R(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, 2, 2, c);
}

// rachaduras na fundação (zigue-zague) e poeira subindo da base
const CRACKS = [
  [[-80, -4], [-74, -14], [-81, -24], [-72, -36], [-77, -48]],
  [[30, -4], [37, -16], [31, -27], [40, -40]],
  [[96, -4], [90, -15], [97, -26]],
];
export function cracks() {
  for (const c of CRACKS) for (let k = 0; k < c.length - 1; k++) seg(c[k][0], c[k][1], c[k + 1][0], c[k + 1][1], '#2a1f16');
  if (!V.preview && Math.random() < 0.08) spark(TL + Math.random() * TW, 2, '#a8916f', 1.2);
}
