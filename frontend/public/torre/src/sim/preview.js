// Obra Viva — o que uma melhoria muda de verdade, calculado com as fórmulas do motor.
// Sobe o nível por um instante, mede rates() antes e depois e desfaz. Não altera o save.
import { UP } from '../data/upgrades.js';
import { S } from './state.js';
import { rates, isCapped, bottleneck, cost } from './economy.js';
import { fmt, din } from '../ui/format.js';
import { t, LANG } from '../i18n.js';
import { eraAt } from '../data/eras.js';
import { altOf } from '../data/height.js';
import { sellingNow, saleValueNext } from './realty.js';
import { FLAGS } from '../data/flags.js';
import { danoDe, regenAgora, segExigida, faixaDe, AMEACAS, riscoState } from './risco.js';

export const STAGE_NAME = { prod: 'produção', tran: 'transporte', lay: 'assentamento' };
const STAGE_OF = { obra: 'lay', forn: 'prod', log: 'tran' };
const TOURISM = ['bilheteria', 'marketing', 'heliponto', 'porto'];

// andares por minuto que a obra realmente faz (o gargalo manda)
export const floorsPerMin = R => isCapped(R) ? 0 : Math.min(R.prod, R.tran, R.lay) / R.fcost * 60;
const cap1 = s => s[0].toUpperCase() + s.slice(1);
const num = v => fmt(v < 10 ? Math.round(v * 10) / 10 : v);

// Devolve { text, good } ou null. good=false: a compra não acelera nada agora.
export function upgradeImpact(k) {
  const u = UP[k]; if (!u) return null;
  const R0 = rates();
  S.lv[k]++;
  let R1;
  try { R1 = rates(); } finally { S.lv[k]--; }

  if (k === 'fundacao') return { text: t('Limite: {0} → {1} andares', fmt(R0.capF), fmt(R1.capF)), good: true };

  if (u.b === 'obra' || u.b === 'forn' || u.b === 'log' || k === 'guindaste' || k === 'projeto') {
    const a = floorsPerMin(R0), b = floorsPerMin(R1);
    if (b > a * 1.005) return { text: t('Obra: {0} → {1} andares/min', num(a), num(b)), good: true };
    if (isCapped(R0)) return { text: t('Não acelera agora: a fundação chegou ao limite'), good: false };
    const st = STAGE_OF[u.b] || 'lay', neck = t(STAGE_NAME[bottleneck(R0)]);
    if (st) return { text: t('{0} {1} → {2}/s · não acelera enquanto o gargalo for {3}', cap1(t(STAGE_NAME[st])), num(R0[st]), num(R1[st]), neck), good: false };
    return { text: t('Não acelera agora: o gargalo é {0}', neck), good: false };
  }

  if (u.b === 'merc') {
    const d = R1.income - R0.income;
    if (d > 1e-9) return { text: t('Renda: +{0}/s', din(d)), good: true };
    if (k === 'banco') return { text: t('Crédito: {0} → {1}', din(R0.bank.limit), din(R1.bank.limit)), good: true };
    if (k === 'aluguel') return { text: t('Rende quando houver andares alugados'), good: false };
    if (TOURISM.includes(k)) return { text: R0.tour.demand > R0.tour.cap ? t('Sem efeito agora') : t('Sem efeito agora: ainda não falta lugar para turistas'), good: false };
  }
  return null;
}

// Prioridade de compra: quanto a melhoria acelera a obra (e a renda) por real gasto, com as fórmulas reais.
// Usado para mostrar só as compras que importam agora (protótipo Obra Viva) e pelo robô de ritmo.
// mínimo suave das três etapas: quase o mínimo, mas melhorar qualquer etapa empatada conta um pouco. Com o mínimo
// exato, produção = assentamento zerava a pontuação de toda compra isolada e os gerentes travavam a obra inteira
export const softMin = (a, b, c) => Math.pow(Math.pow(a, -8) + Math.pow(b, -8) + Math.pow(c, -8), -1 / 8);
const flowSoft = R => isCapped(R) ? 0 : softMin(R.prod, R.tran, R.lay) / R.fcost * 60;
export function priorityScore(k) {
  // renda que conta: aluguel/turismo + (era em Vender) andares por segundo × valor de venda do próximo andar
  const sell = sellingNow(), inc = R => R.income + 1 + (sell ? floorsPerMin(R) / 60 * saleValueNext() : 0);
  const fpm = R => Math.max(1e-9, flowSoft(R));
  // tecnologia de era com vários níveis: avalia o pacote inteiro (todos os níveis que faltam, pelo preço somado), para
  // não recomendar o lado que só parece melhor no 1º nível (vistoria de 20/10: Cabos × Gaiola dupla)
  const u = UP[k], n = u.era && u.max > 1 ? Math.max(1, u.max - (S.lv[k] || 0)) : 1;
  const c1 = cost(k), price = n > 1 ? c1 * (Math.pow(u.k, n) - 1) / (u.k - 1) : c1;
  const R0 = rates(), i0 = inc(R0);
  S.lv[k] += n;
  let R1, i1;
  try { R1 = rates(); i1 = inc(R1); } finally { S.lv[k] -= n; }
  let g = Math.log(fpm(R1) / fpm(R0)) + 0.5 * Math.log(i1 / i0);
  if (g < 0.01) g = 0; // menos de 1% de ganho não conta (a lista e os gerentes não gastam no que quase não rende)
  if (k === 'fundacao' && S.floors > R0.capF * 0.7) g += 1; // perto do limite, a fundação vira prioridade
  return g / price;
}

// Efeito da melhoria em números, sem mencionar gargalo (modo Obra Viva: o jogador descobre o
// problema olhando a obra). Só a etapa que a melhoria mexe: "Elevadores: 2,2 → 3,3 de material/s".
const STAGE_LABEL = { prod: 'Material chegando', tran: 'Material subindo', lay: 'Pedreiros assentando' };
// modo com risco: o efeito das defesas é o dano (ou a cura, ou a exigência da fiscalização) de agora → depois
const virg = v => LANG === 'en' ? v.toFixed(2) : v.toFixed(2).replace('.', ',');
// as ameaças que a defesa enfrenta agora: as da faixa de altura e, perto do limite da fundação, o recalque (pedido do usuário,
// 21/10/2026: o painel só mostrava o tsunami enquanto o recalque ameaçava); a avisada (ou em andamento) vem primeiro
function ameacasDe(k) {
  const lista = faixaDe(S.maxAlt).filter(a => AMEACAS[a].def === k && AMEACAS[a].base);
  if (k === 'sondagem' && S.floors >= rates().capF * 0.85 && !lista.includes('recalque')) lista.push('recalque');
  const r = riscoState(), agora = (r.ativa && r.ativa.tipo) || (r.prox && r.prox.tipo);
  return lista.sort((a, b) => (b === agora) - (a === agora) || danoDe(b) - danoDe(a));
}
// pior ameaça da defesa (usada pelo robô e por quem quer só uma)
const pior = k => ameacasDe(k)[0];
const dano = (k, l) => { const ts = ameacasDe(k); return ts.length ? ts.map(a => `${t(AMEACAS[a].n)}: ~${danoDe(a, l)} → ~${danoDe(a, l + 1)}`).join('\n') : t('Nenhuma ameaça desta defesa nesta altura'); };
const DEFESA_EFEITO = {
  contravento: l => dano('contravento', l),
  sondagem: l => dano('sondagem', l),
  clima: l => dano('clima', l),
  manutencao: l => t('Recupera integridade: {0}/s → {1}/s', virg(regenAgora(l)), virg(regenAgora(l + 1))),
  seguranca: l => t('Fiscalização exige {0} · você tem {1} → {2}', segExigida(), l, l + 1),
};
// Efeito concreto de comprar o próximo nível, só da própria parte da obra: o valor de agora → o valor depois.
// Mercado mostra a renda em R$/s; as etapas mostram o material por segundo e quantos andares por minuto a obra faz.
export function upgradeEffect(k) {
  const u = UP[k]; if (!u) return null;
  if (FLAGS.risco && DEFESA_EFEITO[k]) return DEFESA_EFEITO[k](S.lv[k] || 0);
  const R0 = rates();
  S.lv[k]++;
  let R1;
  try { R1 = rates(); } finally { S.lv[k]--; }
  const fpm = R => floorsPerMin(R);
  if (k === 'fundacao' || u.flag === 'floatFound' || u.st === 'capF') return t('Limite da torre: {0} → {1} andares', fmt(R0.capF), fmt(R1.capF));
  if (u.st === 'fundCost') { // preço da Fundação e, se houver, o segundo efeito (material por andar)
    const c0 = cost('fundacao'); let c1;
    S.lv[k]++; try { c1 = cost('fundacao'); } finally { S.lv[k]--; }
    const mat = u.st2 === 'fcost' ? ' · ' + t('Material por andar: {0} → {1}', num(R0.fcost), num(R1.fcost)) : '';
    return t('Fundação reforçada: {0} → {1}', din(c0), din(c1)) + mat;
  }
  if (u.st === 'sale') { // só vale quando os andares da era atual são vendidos (Imóveis da era)
    if (!S.policy || S.policy[eraAt(altOf(S.floors))] !== 'sell') return t('Sem efeito enquanto os andares desta era são alugados — mude para Vender em Imóveis da era');
    return t('+{0}% no valor de cada andar vendido (política Vender nos Imóveis da era)', Math.round((u.add || 0) * 100));
  }
  if (u.st === 'rent' && u.b !== 'merc') return R1.income > R0.income + 1e-9 ? t('Renda: {0}/s → {1}/s', din(R0.income), din(R1.income)) : t('+{0}% no aluguel de cada andar alugado', Math.round((u.add || 0) * 100));
  if (u.st === 'fcost') return t('Material por andar: {0} → {1}', num(R0.fcost), num(R1.fcost));
  if (u.b === 'merc') {
    if (R1.income > R0.income + 1e-9) return t('Renda: {0}/s → {1}/s', din(R0.income), din(R1.income));
    if (TOURISM.includes(k) || u.st === 'tour' || u.st === 'ticket') {
      // por que não rende agora: o elevador panorâmico (lugares) ou o interesse (visitantes) é que está sobrando
      const tr = R0.tour, v = x => fmt(Math.round(x * 100) / 100);
      if (!S.lv.bilheteria) return t('Sem visitantes ainda: o Elevador panorâmico (Turismo) abre a torre para turistas');
      if (k === 'bilheteria' || k === 'heliponto') return t('Já sobra lugar: chegam {0} turistas/s e cabem {1}/s. Marketing e mais altura trazem mais gente', v(tr.demand), v(tr.cap));
      if (k === 'porto') return t('Ainda sem efeito: o porto espacial só recebe turistas acima de 100 km');
      return t('Elevador panorâmico lotado: chegam {0} turistas/s e cabem só {1}/s. Amplie o Turismo primeiro', v(tr.demand), v(tr.cap));
    }
    return k === 'aluguel' || u.st === 'rent' ? t('+{0}% no aluguel de cada andar alugado', Math.round((u.add || 0.5) * 100)) : null;
  }
  const st = STAGE_OF[u.b];
  if (st) {
    const a = fpm(R0), b = fpm(R1);
    return `${t(STAGE_LABEL[st])}: ${num(R0[st])} → ${num(R1[st])}/s` + (b > a * 1.005 ? ' · ' + t('obra {0} → {1} andares/min', num(a), num(b)) : '');
  }
  if (R1.fcost < R0.fcost * 0.999) return t('Material por andar: {0} → {1}', num(R0.fcost), num(R1.fcost));
  if (fpm(R1) > fpm(R0) * 1.005) return t('Obra: {0} → {1} andares/min', num(fpm(R0)), num(fpm(R1)));
  const d = R1.income - R0.income;
  return d > 1e-9 ? t('Renda: {0}/s → {1}/s', din(R0.income), din(R1.income)) : null;
}

