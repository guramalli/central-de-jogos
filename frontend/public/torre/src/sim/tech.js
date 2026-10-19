// Tecnologias de era (Obra Viva): fator de cada etapa pelas compras feitas (1 quando não há nenhuma).
import { UP, TECH_BY_STAGE } from '../data/upgrades.js';
import { FLAGS } from '../data/flags.js';
import { S } from './state.js';

export function techMult(st) {
  if (!FLAGS.viva || !TECH_BY_STAGE[st]) return 1;
  let m = 1;
  for (const k of TECH_BY_STAGE[st]) { const u = UP[k], lv = S.lv[k] || 0; m *= u.mul ? Math.pow(u.mul, lv) : 1 + (u.add || 0) * lv; }
  return m;
}
