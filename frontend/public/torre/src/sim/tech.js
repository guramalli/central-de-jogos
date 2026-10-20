// Tecnologias de era (Obra Viva): fator de cada etapa pelas compras feitas (1 quando não há nenhuma).
import { UP, TECH_BY_STAGE } from '../data/upgrades.js';
import { FLAGS } from '../data/flags.js';
import { S } from './state.js';

export function techMult(st) {
  if (!FLAGS.viva || !TECH_BY_STAGE[st]) return 1;
  let m = 1;
  for (const k of TECH_BY_STAGE[st]) {
    const u = UP[k], lv = S.lv[k] || 0; if (!lv) continue;
    const two = u.st2 === st && u.st !== st, mul = two ? u.mul2 : u.mul, add = two ? u.add2 : u.add;
    m *= mul ? Math.pow(mul, lv) : 1 + (add || 0) * lv;
  }
  return m;
}
