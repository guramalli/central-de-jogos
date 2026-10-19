// Banco: empréstimos com juros contínuos. Uma parcela da renda paga a dívida sozinha.
// Se a dívida passa do limite, entra em renegociação de emergência: sem novos empréstimos,
// juros pela metade e parte da renda retida — mas a dívida sempre diminui e nunca se retém
// mais que `renegMaxShare` da renda. Decisão ruim atrasa, não trava a partida.
// (S.inDefault = em renegociação; nome mantido por compatibilidade com o save.)
import { BAL } from '../data/balance.js';
import { S } from './state.js';
import { mods } from './mods.js';

const B = BAL.bank;

export const tier = () => B.tiers[Math.min(S.lv.banco, B.tiers.length - 1)];
export const creditLimit = income => tier().lim * (B.limitBase + B.limitIncomeSecs * income) * mods().mult('credit');
export const ratePerMin = () => tier().rate * mods().mult('interest');
// juros/s; na renegociação caem pela metade e ficam abaixo do que a retenção paga
function interestPerSec(income) {
  const i = S.debt * ratePerMin() / 60;
  if (!S.inDefault) return i;
  return Math.min(i * B.renegRate, (B.renegMaxShare - B.renegMargin) * income);
}
// fração da renda que vai para o banco
export function payShare(income = 0) {
  if (S.debt <= 0) return 0;
  if (!S.inDefault) return B.payShare;
  const need = income > 0 ? interestPerSec(income) / income + B.renegMargin : 0;
  return Math.min(B.renegMaxShare, Math.max(B.renegMinShare, need));
}

export function bankInfo(income) {
  const limit = creditLimit(income);
  return {
    limit, rate: ratePerMin(), share: payShare(income),
    available: S.inDefault ? 0 : Math.max(0, limit - S.debt),
    interestPerSec: interestPerSec(income),
  };
}

export function borrow(amount, income) {
  const { available } = bankInfo(income);
  amount = Math.min(amount, available);
  if (amount <= 0) return 0;
  S.debt += amount; S.money += amount;
  return amount;
}

export function repay(amount) {
  amount = Math.min(amount, S.money, S.debt);
  if (amount <= 0) return 0;
  S.debt -= amount; S.money -= amount;
  if (S.debt < 0.01) S.debt = 0;
  return amount;
}

// Avança dt segundos. Recebe a renda bruta/s e devolve quanto dela foi para o banco.
export function bankTick(dt, income) {
  if (S.debt <= 0) { S.debt = 0; S.inDefault = false; return 0; }
  const limit = creditLimit(income);
  const interest = S.inDefault ? interestPerSec(income) * dt : S.debt * (Math.exp(ratePerMin() / 60 * dt) - 1);
  S.debt += interest; S.stats.interestTotal += interest;
  if (!S.inDefault && S.debt > limit * B.defaultAt) S.inDefault = true;
  else if (S.inDefault && S.debt <= limit) S.inDefault = false;
  const pay = Math.min(S.debt, payShare(income) * income * dt);
  S.debt -= pay;
  if (S.debt < 0.01) { S.debt = 0; S.inDefault = false; }
  return pay;
}
