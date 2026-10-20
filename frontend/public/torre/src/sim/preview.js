// Obra Viva — o que uma melhoria muda de verdade, calculado com as fórmulas do motor.
// Sobe o nível por um instante, mede rates() antes e depois e desfaz. Não altera o save.
import { UP } from '../data/upgrades.js';
import { S } from './state.js';
import { rates, isCapped, bottleneck, cost } from './economy.js';
import { fmt } from '../ui/format.js';

export const STAGE_NAME = { prod: 'produção', tran: 'transporte', lay: 'assentamento' };
const STAGE_OF = { obra: 'lay', forn: 'prod', log: 'tran' };
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
    const st = STAGE_OF[u.b] || 'lay', neck = STAGE_NAME[bottleneck(R0)];
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

// Prioridade de compra: quanto a melhoria acelera a obra (e a renda) por real gasto, com as fórmulas reais.
// Usado para mostrar só as compras que importam agora (protótipo Obra Viva) e pelo robô de ritmo.
export function priorityScore(k) {
  const R0 = rates(), inc = R => R.income + 1, fpm = R => Math.max(1e-9, floorsPerMin(R));
  S.lv[k]++;
  let R1;
  try { R1 = rates(); } finally { S.lv[k]--; }
  let g = Math.log(fpm(R1) / fpm(R0)) + 0.5 * Math.log(inc(R1) / inc(R0));
  if (k === 'fundacao' && S.floors > R0.capF * 0.7) g += 1; // perto do limite, a fundação vira prioridade
  return g / cost(k);
}

// Efeito da melhoria em números, sem mencionar gargalo (modo Obra Viva: o jogador descobre o
// problema olhando a obra). Só a etapa que a melhoria mexe: "Elevadores: 2,2 → 3,3 de material/s".
const STAGE_LABEL = { prod: 'Material chegando', tran: 'Material subindo', lay: 'Pedreiros assentando' };
// Efeito concreto de comprar o próximo nível, só da própria parte da obra: o valor de agora → o valor depois.
// Mercado mostra a renda em R$/s; as etapas mostram o material por segundo e quantos andares por minuto a obra faz.
export function upgradeEffect(k) {
  const u = UP[k]; if (!u) return null;
  const R0 = rates();
  S.lv[k]++;
  let R1;
  try { R1 = rates(); } finally { S.lv[k]--; }
  const fpm = R => floorsPerMin(R);
  if (k === 'fundacao' || u.flag === 'floatFound' || u.st === 'capF') return `Limite da torre: ${fmt(R0.capF)} → ${fmt(R1.capF)} andares`;
  if (u.st === 'fundCost') { const c0 = cost('fundacao'); S.lv[k]++; const c1 = cost('fundacao'); S.lv[k]--; return `Fundação reforçada: R$ ${fmt(c0)} → R$ ${fmt(c1)}`; }
  if (u.st === 'sale') return `+${Math.round((u.add || 0) * 100)}% no valor de cada andar vendido (política Vender nos Imóveis da era)`;
  if (u.st === 'rent' && u.b !== 'merc') return R1.income > R0.income + 1e-9 ? `Renda: R$ ${fmt(R0.income)}/s → R$ ${fmt(R1.income)}/s` : `+${Math.round((u.add || 0) * 100)}% no aluguel de cada andar alugado`;
  if (u.st === 'fcost') return `Material por andar: ${num(R0.fcost)} → ${num(R1.fcost)}`;
  if (u.b === 'merc') {
    if (R1.income > R0.income + 1e-9) return `Renda: R$ ${fmt(R0.income)}/s → R$ ${fmt(R1.income)}/s`;
    if (TOURISM.includes(k) || u.st === 'tour' || u.st === 'ticket') {
      // por que não rende agora: o elevador panorâmico (lugares) ou o interesse (visitantes) é que está sobrando
      const t = R0.tour, v = x => fmt(Math.round(x * 100) / 100);
      if (!S.lv.bilheteria) return 'Sem visitantes ainda: o Elevador panorâmico (Turismo) abre a torre para turistas';
      if (k === 'bilheteria' || k === 'heliponto') return `Já sobra lugar: chegam ${v(t.demand)} turistas/s e cabem ${v(t.cap)}/s. Marketing e mais altura trazem mais gente`;
      if (k === 'porto') return 'Ainda sem efeito: o porto espacial só recebe turistas acima de 100 km';
      return `Elevador panorâmico lotado: chegam ${v(t.demand)} turistas/s e cabem só ${v(t.cap)}/s. Amplie o Turismo primeiro`;
    }
    return k === 'aluguel' || u.st === 'rent' ? `+${Math.round((u.add || 0.5) * 100)}% no aluguel de cada andar alugado` : null;
  }
  const st = STAGE_OF[u.b];
  if (st) {
    const a = fpm(R0), b = fpm(R1);
    return `${STAGE_LABEL[st]}: ${num(R0[st])} → ${num(R1[st])}/s` + (b > a * 1.005 ? ` · obra ${num(a)} → ${num(b)} andares/min` : '');
  }
  if (R1.fcost < R0.fcost * 0.999) return `Material por andar: ${num(R0.fcost)} → ${num(R1.fcost)}`;
  if (fpm(R1) > fpm(R0) * 1.005) return `Obra: ${num(fpm(R0))} → ${num(fpm(R1))} andares/min`;
  const d = R1.income - R0.income;
  return d > 1e-9 ? `Renda: R$ ${fmt(R0.income)}/s → R$ ${fmt(R1.income)}/s` : null;
}

