// Altura ↔ peças construídas. No modo clássico, todo andar tem MPF (4 m).
// No Obra Viva, nas eras altas cada peça vale mais altura (mega-estrutura): é o que deixa a Órbita alcançável
// com o andar ainda legível (~1–3 s por peça). Decidido com o usuário (out/2026).
//   até 12 km (Tijolo, Concreto, Aço e Vidro): andar de 4 m
//   Estratosfera (12 km): módulo de 12 m · Mesosfera (50 km): 40 m · Espaço/Órbita (100 km): 100 m
import { MPF } from './constants.js';
import { FLAGS } from './flags.js';

export const HSEG = [[0, MPF], [12000, 12], [50000, 40], [100000, 100]]; // [altura onde começa, metros por peça]
const segs = HSEG.map(([m, mpf], i) => ({ m, mpf, f: 0 }));
for (let i = 1; i < segs.length; i++) segs[i].f = segs[i - 1].f + (segs[i].m - segs[i - 1].m) / segs[i - 1].mpf;

// altura (m) na peça f (pode ser fracionária)
export function altOf(f) {
  if (!FLAGS.viva) return f * MPF;
  let s = segs[0];
  for (const x of segs) if (f >= x.f) s = x;
  return s.m + (f - s.f) * s.mpf;
}
// peça (fracionária) na altura m
export function floorOf(m) {
  if (!FLAGS.viva) return m / MPF;
  let s = segs[0];
  for (const x of segs) if (m >= x.m) s = x;
  return s.f + (m - s.m) / s.mpf;
}
// metros por peça na peça f
export function mpfAt(f) {
  if (!FLAGS.viva) return MPF;
  let s = segs[0];
  for (const x of segs) if (f >= x.f) s = x;
  return s.mpf;
}
