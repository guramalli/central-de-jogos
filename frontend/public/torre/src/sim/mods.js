// Soma os efeitos dos nós aprendidos na árvore de Engenharia.
import { NODES } from '../data/talents.js';
import { S } from './state.js';

let cacheTree = null, cacheVer = -1, ver = 0, cache = null;
export const invalidateMods = () => { ver++; };

export function computeMods(owned) {
  const inc = {}, more = {}, add = {}, flag = {};
  for (const id in owned) {
    if (!owned[id] || !NODES[id]) continue;
    for (const e of NODES[id].eff) {
      if (e.flag) flag[e.flag] = true;
      if (!e.s) continue;
      if (e.inc !== undefined) inc[e.s] = (inc[e.s] || 0) + e.inc;
      if (e.more !== undefined) more[e.s] = (more[e.s] || 1) * e.more;
      if (e.add !== undefined) add[e.s] = (add[e.s] || 0) + e.add;
    }
  }
  return {
    inc, more, add, flag,
    // multiplicador final; reduções (inc negativo) param em −80%
    mult: s => Math.max(0.2, 1 + (inc[s] || 0)) * (more[s] || 1),
    plus: s => add[s] || 0,
  };
}

export function mods() {
  if (!cache || cacheTree !== S.tree || cacheVer !== ver) {
    cache = computeMods(S.tree); cacheTree = S.tree; cacheVer = ver;
  }
  return cache;
}
