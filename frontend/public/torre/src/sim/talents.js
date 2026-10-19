// Pontos de Engenharia e compra de nós da árvore
import { BAL } from '../data/balance.js';
import { NODES, ADJ, CENTER, ringEra } from '../data/talents.js';
import { S } from './state.js';
import { invalidateMods } from './mods.js';
import { UP } from '../data/upgrades.js';
import { FLAGS } from '../data/flags.js';

export const peFromAlt = m => m <= 0 ? 0 : Math.floor(BAL.pe.mult * Math.pow(m, BAL.pe.pow));
// altura (m) em que se ganha o próximo ponto
export const nextPeAlt = m => Math.pow((peFromAlt(m) + 1) / BAL.pe.mult, 1 / BAL.pe.pow);
// ★ vêm da maior altura já alcançada em qualquer obra (vender a construtora não tira pontos)
export const peEarned = () => peFromAlt(Math.max(S.maxAlt, S.bestAlt || 0)) + S.peBonus;
export const peAvailable = () => peEarned() - S.peSpent;

export const owned = id => !!S.tree[id];
export const ringOpen = k => Math.max(S.era, S.bestEra || 0) >= ringEra(k);
export const reachable = id => ADJ[id].some(n => S.tree[n]);

// Obra Viva: a pesquisa de um ramo só começa depois de comprar pelo menos 1 nível de uma melhoria dele
// (os níveis iniciais não contam). Ciência não tem compras: vale qualquer compra da obra.
const bought = k => S.lv[k] > (UP[k].start || 0);
export const branchStarted = b => {
  const ks = Object.keys(UP).filter(k => UP[k].b === b);
  return ks.length ? ks.some(bought) : Object.keys(UP).some(bought);
};
// nó do 1º anel ligado só ao centro: precisa do ramo começado
const needsBranch = id => FLAGS.viva && ADJ[id].includes(CENTER) && !ADJ[id].some(n => n !== CENTER && S.tree[n]) && NODES[id].b && !branchStarted(NODES[id].b);

// motivo pelo qual não dá para aprender, ou null se dá
export function learnBlock(id) {
  const n = NODES[id];
  if (!n || owned(id)) return 'Já aprendido';
  if (!ringOpen(n.ring)) return 'Anel fechado';
  if (!reachable(id)) return 'Ligue a um nó já aprendido';
  if (needsBranch(id)) return 'Compre uma melhoria do ramo';
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
