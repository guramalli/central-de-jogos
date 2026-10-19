import { S } from './state.js';
import { sim, offlineMax } from './economy.js';
import { fmt } from '../ui/format.js';

// Simula o tempo fora do jogo (até 8 h, mais bônus da árvore). Devolve uma mensagem ou null.
export function runOffline() {
  const away = Math.min(offlineMax(), (Date.now() - S.last) / 1000);
  if (away <= 30 || S.floors + S.money <= 0) return null;
  const f0 = S.floors, m0 = S.money;
  let t = away;
  while (t > 0) { const st = Math.min(5, t); sim(st); t -= st; }
  return `Enquanto você esteve fora: +${fmt(S.floors - f0)} andares, +R$ ${fmt(S.money - m0)}`;
}
