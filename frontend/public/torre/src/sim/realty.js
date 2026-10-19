// Imóveis: cada andar pronto é vendido (dinheiro na hora) ou alugado (renda contínua).
// Andares são decididos sempre do mais baixo para o mais alto, então os que esperam
// formam um bloco contínuo no alto da torre: [S.assigned, floor(S.floors)).
import { BAL } from '../data/balance.js';
import { FLOOR_TYPES, TYPE_IDS } from '../data/floorTypes.js';
import { S } from './state.js';
import { mods } from './mods.js';
import { FLAGS } from '../data/flags.js';
import { floorOf } from '../data/height.js';

const RB = BAL.rent;

// aluguel-base do andar i
export const rentAt = i => RB.base * Math.pow(1 + i / RB.scale, RB.pow);
// soma do aluguel-base dos andares [a, a+n) (integral contínua da curva)
export function rentSum(a, n) {
  if (n <= 0) return 0;
  const p = RB.pow + 1;
  return RB.base * RB.scale / p * (Math.pow(1 + (a + n) / RB.scale, p) - Math.pow(1 + a / RB.scale, p));
}

export const pending = () => Math.max(0, Math.floor(S.floors) - S.assigned);
export const typeUnlocked = t => S.maxAlt >= FLOOR_TYPES[t].alt;
export const saleMult = () => (1 + 0.08 * S.lv.corretor) * mods().mult('sale');
export const rentMult = () => (1 + 0.5 * S.lv.aluguel) * mods().mult('rent');

// Obra Viva: o tipo muda sozinho com a altura (só vista e turismo; nada para escolher)
const AUTO_TYPES = ['apto', 'escr', 'hotel', 'rest', 'obs'];
let autoSegs = null;
const segsNow = () => {
  if (!FLAGS.viva) return S.typeSegs;
  return autoSegs || (autoSegs = AUTO_TYPES.map(t => [Math.ceil(floorOf(FLOOR_TYPES[t].alt)), t]));
};
const rentOf = T => FLAGS.viva ? 1 : T.rent;

// tipo do andar i (busca nos segmentos)
export function typeAt(i) {
  const s = segsNow();
  for (let k = s.length - 1; k >= 0; k--) if (i >= s[k][0]) return s[k][1];
  return s[0][1];
}

// tipo que será usado a partir do andar em construção
export const buildType = () => S.typeSegs[S.typeSegs.length - 1][1];

export function setBuildType(t) {
  if (!FLOOR_TYPES[t] || !typeUnlocked(t)) return false;
  const idx = Math.floor(S.floors), last = S.typeSegs[S.typeSegs.length - 1];
  if (last[1] === t) return true;
  if (last[0] >= idx) { last[1] = t; mergeTail(); }
  else S.typeSegs.push([idx, t]);
  return true;
}
function mergeTail() {
  const s = S.typeSegs;
  while (s.length > 1 && s[s.length - 2][1] === s[s.length - 1][1]) s.pop();
}

// percorre [a, a+n) em pedaços de mesmo tipo
function eachPiece(a, n, fn) {
  const segs = segsNow(), end = a + n;
  for (let i = 0; i < segs.length; i++) {
    const s0 = segs[i][0], s1 = i + 1 < segs.length ? segs[i + 1][0] : Infinity;
    const lo = Math.max(a, s0), hi = Math.min(end, s1);
    if (hi > lo) fn(lo, hi - lo, segs[i][1]);
  }
}

// Valor de decidir os próximos n andares: { sale: R$ na hora, rent: aluguel-base/s }
export function preview(n) {
  n = Math.min(n, pending());
  let sale = 0, rent = 0;
  eachPiece(S.assigned, n, (a, c, t) => {
    const T = FLOOR_TYPES[t], base = rentSum(a, c);
    sale += base * BAL.saleSecs * T.sale;
    rent += base * rentOf(T);
  });
  return { n, sale: sale * saleMult(), rent, rentNow: rent * rentMult() };
}

// Vende ou aluga os próximos n andares prontos. Devolve o dinheiro recebido.
export function assign(n, how) {
  n = Math.min(Math.floor(n), pending());
  if (n <= 0) return 0;
  let got = 0;
  const sm = saleMult();
  eachPiece(S.assigned, n, (a, c, t) => {
    const T = FLOOR_TYPES[t], base = rentSum(a, c);
    if (how === 'sell') got += base * BAL.saleSecs * T.sale * sm;
    else S.rentBase += base * rentOf(T);
    S.typeCount[t] = (S.typeCount[t] || 0) + c;
  });
  S.assigned += n;
  if (how === 'sell') { S.sold += n; S.money += got; S.stats.saleTotal += got; }
  else S.rented += n;
  return got;
}

// Corretor: aplica a regra "vender X% / alugar o resto" aos andares prontos.
// No protótipo Obra Viva a regra vale desde o início: nenhum andar fica esperando decisão manual.
export function brokerTick() {
  if ((S.lv.corretor < 1 && !FLAGS.viva) || !S.broker.on) return;
  const n = pending(); if (n <= 0) return;
  const q = S.broker.acc + n * (FLAGS.viva ? 0 : S.broker.sellPct) / 100; // Obra Viva: tudo alugado
  const nSell = Math.min(n, Math.floor(q));
  S.broker.acc = q - nSell;
  assign(nSell, 'sell');
  assign(n - nSell, 'rent');
}

export const typeCount = t => S.typeCount[t] || 0;
export { TYPE_IDS };
