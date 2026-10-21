// Gerentes (Obra Viva): chegam um por obra (VIVA.board). Cada um compra sozinho as melhorias básicas do
// seu ramo (nunca tecnologia de era, par nem alugar/vender): a que mais rende agora (priorityScore), e nada se nenhuma
// rende. Todos gastam de uma verba comum (S.mgrPool) que recebe VIVA.manager.share da renda e nunca passa dessa fração
// do caixa, para o dinheiro sempre sobrar para as decisões grandes. Liga e desliga por ramo (S.mgr).
import { VIVA } from '../data/viva.js';
import { UP, KEYS } from '../data/upgrades.js';
import { S } from './state.js';
import { canBuy, buy, cost, rates } from './economy.js';
import { priorityScore } from './preview.js';
import { FLAGS } from '../data/flags.js';

const acc = {}; // compras acumuladas por ramo (ritmo VIVA.manager.rate por segundo)

// cada gerente chega numa obra (VIVA.board[k].obra); depois disso fica de uma obra para a outra
export const managerArrives = b => { const k = Object.keys(VIVA.board).find(x => VIVA.board[x].mgr === b); return k ? VIVA.board[k].obra : Infinity; };
export const hasManager = b => !FLAGS.risco && (S.obra || 1) >= managerArrives(b); // modo com risco: sem gerentes (por enquanto)
// liberado: chegou nesta campanha (o Encarregado só depois do 5º andar da 1ª obra)
export const managerFree = b => hasManager(b) && (b !== 'basico' || (S.obra || 1) > 1 || S.floors >= 5);
// trabalhando: liberado E ligado por quem joga (decisão do usuário, out/2026: nada liga sozinho; o aviso diz que liberou)
export const managerOn = b => managerFree(b) && (S.mgr || {})[b] === true;
export function setManager(b, on) { S.mgr = { ...(S.mgr || {}), [b]: !!on }; }
const BASICO = ['pedreiro', 'fornec', 'motor', 'cacamba'];
export const managerKeys = b => b === 'basico' ? BASICO.slice() : KEYS.filter(k => UP[k].b === b && !UP[k].era && !UP[k].pair && k !== 'imoveis' && !VIVA.hidden.includes(k));

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
