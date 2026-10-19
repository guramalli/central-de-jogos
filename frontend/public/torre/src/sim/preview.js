// Obra Viva — o que uma melhoria muda de verdade, calculado com as fórmulas do motor.
// Sobe o nível por um instante, mede rates() antes e depois e desfaz. Não altera o save.
import { UP } from '../data/upgrades.js';
import { S } from './state.js';
import { rates, isCapped, bottleneck } from './economy.js';
import { fmt } from '../ui/format.js';

export const STAGE_NAME = { prod: 'produção', tran: 'transporte', lay: 'assentamento' };
const STAGE_OF = { obra: 'lay', forn: 'prod', log: 'tran', guindaste: 'lay' };
const TOURISM = ['bilheteria', 'marketing', 'heliponto', 'porto'];

// andares por minuto que a obra realmente faz (o gargalo manda)
export const floorsPerMin = R => isCapped(R) ? 0 : Math.min(R.prod, R.tran, R.lay) / R.fcost * 60;
const cap1 = t => t[0].toUpperCase() + t.slice(1);
const num = v => fmt(v < 10 ? Math.round(v * 10) / 10 : v);

// Devolve { text, good } ou null. good=false: a compra não acelera nada agora.
export function upgradeImpact(k) {
  const u = UP[k]; if (!u) return null;
  const R0 = rates();
  S.lv[k]++;
  let R1;
  try { R1 = rates(); } finally { S.lv[k]--; }

  if (k === 'fundacao') return { text: `Limite: ${fmt(R0.capF)} → ${fmt(R1.capF)} andares`, good: true };

  if (u.b === 'obra' || u.b === 'forn' || u.b === 'log' || k === 'guindaste' || k === 'projeto') {
    const a = floorsPerMin(R0), b = floorsPerMin(R1);
    if (b > a * 1.005) return { text: `Obra: ${num(a)} → ${num(b)} andares/min`, good: true };
    if (isCapped(R0)) return { text: 'Não acelera agora: a fundação chegou ao limite', good: false };
    const st = STAGE_OF[k] || STAGE_OF[u.b], neck = STAGE_NAME[bottleneck(R0)];
    if (st) return { text: `${cap1(STAGE_NAME[st])} ${num(R0[st])} → ${num(R1[st])}/s · não acelera enquanto o gargalo for ${neck}`, good: false };
    return { text: `Não acelera agora: o gargalo é ${neck}`, good: false };
  }

  if (u.b === 'merc') {
    const d = R1.income - R0.income;
    if (d > 1e-9) return { text: `Renda: +R$ ${fmt(d)}/s`, good: true };
    if (k === 'banco') return { text: `Crédito: R$ ${fmt(R0.bank.limit)} → R$ ${fmt(R1.bank.limit)}`, good: true };
    if (k === 'aluguel') return { text: 'Rende quando houver andares alugados', good: false };
    if (TOURISM.includes(k)) return { text: R0.tour.demand > R0.tour.cap ? 'Sem efeito agora' : 'Sem efeito agora: ainda não falta lugar para turistas', good: false };
  }
  return null;
}
