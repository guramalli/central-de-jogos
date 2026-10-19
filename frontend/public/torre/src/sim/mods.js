// Soma os efeitos dos nós aprendidos na árvore de Engenharia.
import { NODES } from '../data/talents.js';
import { S } from './state.js';
import { ERA_TECH } from '../data/upgrades.js';
import { FLAGS } from '../data/flags.js';

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

// Obra Viva: sem Pesquisa — só as regras especiais das tecnologias de era compradas
let vivaBase = null;
export function mods() {
  if (FLAGS.viva) {
    vivaBase ||= computeMods({});
    const flag = {};
    for (const k in ERA_TECH) if (ERA_TECH[k].flag && (S.lv[k] || 0) > 0) flag[ERA_TECH[k].flag] = true;
    return { ...vivaBase, flag };
  }
  if (!cache || cacheTree !== S.tree || cacheVer !== ver) {
    cache = computeMods(S.tree); cacheTree = S.tree; cacheVer = ver;
  }
  return cache;
}
