// Pontos de Engenharia e compra de nós da árvore
import { BAL } from '../data/balance.js';
import { NODES, ADJ, CENTER, ringEra } from '../data/talents.js';
import { S } from './state.js';
import { invalidateMods } from './mods.js';

export const peFromAlt = m => m <= 0 ? 0 : Math.floor(BAL.pe.mult * Math.pow(m, BAL.pe.pow));
// altura (m) em que se ganha o próximo ponto
export const nextPeAlt = m => Math.pow((peFromAlt(m) + 1) / BAL.pe.mult, 1 / BAL.pe.pow);
export const peEarned = () => peFromAlt(S.maxAlt) + S.peBonus;
export const peAvailable = () => peEarned() - S.peSpent;

export const owned = id => !!S.tree[id];
export const ringOpen = k => S.era >= ringEra(k);
export const reachable = id => ADJ[id].some(n => S.tree[n]);

// motivo pelo qual não dá para aprender, ou null se dá
export function learnBlock(id) {
  const n = NODES[id];
  if (!n || owned(id)) return 'Já aprendido';
  if (!ringOpen(n.ring)) return 'Anel fechado';
  if (!reachable(id)) return 'Ligue a um nó já aprendido';
  if (peAvailable() < n.cost) return 'Pontos insuficientes';
  return null;
}

export function learn(id) {
  if (learnBlock(id)) return false;
  S.tree[id] = true; S.peSpent += NODES[id].cost;
  invalidateMods();
  return true;
}

export function respec() {
  S.tree = { [CENTER]: true }; S.peSpent = 0;
  invalidateMods();
}
