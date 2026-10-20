// Gerentes (Obra Viva): itens do quadro "Construtora" comprados com ★. Cada um compra sozinho as melhorias básicas do
// seu ramo (nunca tecnologia de era, par nem alugar/vender): a que mais rende agora (priorityScore), e nada se nenhuma
// rende. Todos gastam de uma verba comum (S.mgrPool) que recebe VIVA.manager.share da renda e nunca passa dessa fração
// do caixa, para o dinheiro sempre sobrar para as decisões grandes. Liga e desliga por ramo (S.mgr).
import { VIVA } from '../data/viva.js';
import { UP, KEYS } from '../data/upgrades.js';
import { S } from './state.js';
import { canBuy, buy, cost, rates } from './economy.js';
import { priorityScore } from './preview.js';
import { boardLv } from './prestige.js';

const acc = {}; // compras acumuladas por ramo (ritmo VIVA.manager.rate por segundo)

export const hasManager = b => Object.keys(VIVA.board).some(k => VIVA.board[k].mgr === b && boardLv(k) >= 1);
export const managerOn = b => hasManager(b) && (S.mgr || {})[b] !== false;
export function setManager(b, on) { S.mgr = { ...(S.mgr || {}), [b]: !!on }; }
export const managerKeys = b => KEYS.filter(k => UP[k].b === b && !UP[k].era && !UP[k].pair && k !== 'imoveis' && !VIVA.hidden.includes(k));

export function managerTick(dt) {
  const mine = Object.keys(VIVA.board).map(k => VIVA.board[k].mgr).filter(b => b && managerOn(b));
  if (!mine.length) return 0;
  const sh = VIVA.manager.share;
  S.mgrPool = Math.min(sh * S.money, (S.mgrPool || 0) + sh * Math.max(0, rates().income) * dt);
  let n = 0;
  for (const b of mine) {
    acc[b] = Math.min(VIVA.manager.rate, (acc[b] || 0) + dt * VIVA.manager.rate);
    while (acc[b] >= 1) {
      acc[b] -= 1;
      let best = null, bs = 0;
      for (const u of managerKeys(b)) {
        if (!canBuy(u) || cost(u) > S.mgrPool) continue;
        const sc = priorityScore(u);
        if (sc > bs || (sc > 0 && sc === bs && cost(u) < cost(best))) { best = u; bs = sc; } // empate: a mais barata
      }
      if (!best) { acc[b] = 0; break; }
      S.mgrPool -= cost(best); buy(best); n++;
    }
  }
  return n;
}
