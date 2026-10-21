// Contratos de altura (Obra Viva): ao passar um marco de CONTRACT_MARKS na rodada, uma proposta de 3 cartões entra na fila
// (S.offers); escolher um aplica o efeito até o fim da rodada (S.perks). O sorteio depende só da obra e do marco, então
// recarregar não troca os cartões. startNextRound() zera tudo (os campos não estão em KEEP).
import { CONTRACTS, CONTRACT_IDS, CONTRACT_MARKS } from '../data/contracts.js';
import { premioMult } from './risco.js';
import { FLAGS } from '../data/flags.js';
import { S } from './state.js';
import { rates } from './economy.js';

// ruído determinístico em [0,1) (o mesmo de render/canvas.js; sim/ não importa de render/)
const hash = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

export function drawCards(obra, idx) {
  const ids = CONTRACT_IDS.slice().sort((a, b) => hash(obra * 97 + idx * 13, CONTRACT_IDS.indexOf(a)) - hash(obra * 97 + idx * 13, CONTRACT_IDS.indexOf(b)));
  return ids.slice(0, 3);
}

const RUSH_ST = ['prod', 'tran', 'lay'];
// contratos iguais somam (3 × +40% = +120%); descontos somam até a metade (sem bola de neve)
export function perkMult(st) {
  if (!FLAGS.viva) return 1;
  let up = 0, down = 0;
  for (const id of S.perks || []) {
    const c = CONTRACTS[id]; if (!c) continue;
    for (const [s2, mul] of [[c.st, c.mul], [c.st2, c.mul2], ...(c.sts || []).map(x => [x, c.mul])]) if (s2 === st) { if (mul > 1) up += mul - 1; else down += 1 - mul; }
  }
  let m = (1 + up) * Math.max(0.5, 1 - down);
  if ((S.rushLeft || 0) > 0 && RUSH_ST.includes(st)) m *= 3;
  if (FLAGS.risco) m *= premioMult(st); // modo com risco: prêmios de fim de ano
  return m;
}

export const offerNow = () => (S.offers && S.offers[0]) || null;

export function chooseContract(id) {
  const o = offerNow();
  if (!FLAGS.viva || S.roundOver || !o || !o.cards.includes(id)) return false;
  const c = CONTRACTS[id];
  if (c.cash) S.money += c.cash * Math.max(0, rates().income);
  S.offers = S.offers.slice(1);
  S.perks = [...(S.perks || []), id];
  if (c.fund) S.lv.fundacao += c.fund;
  if (c.rush) S.rushLeft = c.rush;
  return true;
}

export function contractTick(dt) {
  if (FLAGS.risco) return; // modo com risco: sem contratos de altura (os prêmios de fim de ano ocupam esse papel)
  if (S.rushLeft > 0) S.rushLeft = Math.max(0, S.rushLeft - dt);
  let i = S.marksDone || 0;
  while (i < CONTRACT_MARKS.length && S.maxAlt >= CONTRACT_MARKS[i]) {
    S.offers = [...(S.offers || []), { m: CONTRACT_MARKS[i], cards: drawCards(S.obra || 1, i) }];
    i++;
  }
  S.marksDone = i;
}
