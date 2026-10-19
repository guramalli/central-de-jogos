import { MPF, BRICKS } from '../data/constants.js';
import { altOf, mpfAt } from '../data/height.js';
import { BAL } from '../data/balance.js';
import { eraAt } from '../data/eras.js';
import { UP } from '../data/upgrades.js';
import { S } from './state.js';
import { mods } from './mods.js';
import { rentMult, brokerTick, rentAt, rentSum } from './realty.js';
import { FLAGS } from '../data/flags.js';
import { VIVA } from '../data/viva.js';
import { tourism } from './tourism.js';
import { bankInfo, bankTick } from './bank.js';

// ---------- melhorias compradas com dinheiro ----------
export const cost = k => Math.ceil(UP[k].base * Math.pow(UP[k].k, S.lv[k] - (UP[k].start || 0)) * mods().mult('cost_' + UP[k].b));
export const reqMet = k => (!UP[k].req || S.lv[UP[k].req[0]] >= UP[k].req[1]) && (!UP[k].reqAlt || S.maxAlt >= UP[k].reqAlt);
export const unlocked = k => reqMet(k) && !(FLAGS.viva && VIVA.hidden.includes(k));
export const maxed = k => UP[k].max !== undefined && S.lv[k] >= UP[k].max;
export const canBuy = k => unlocked(k) && !maxed(k) && !stageBlock(k) && S.money >= cost(k);

// Obra Viva: as etapas do fluxo andam juntas, como numa obra real. Uma etapa que já está mais de
// VIVA.stageMargin à frente da mais lenta não pode ser melhorada até as outras alcançarem.
// Devolve a etapa que está segurando ('prod' | 'tran' | 'lay') ou null.
export const STAGE_OF = k => UP[k].b === 'forn' ? 'prod' : UP[k].b === 'log' ? 'tran' : UP[k].b === 'obra' || k === 'guindaste' ? 'lay' : null;
export function stageBlock(k) {
  if (!FLAGS.viva) return null;
  const st = STAGE_OF(k); if (!st) return null;
  const R = rates(), lo = Math.min(R.prod, R.tran, R.lay);
  if (R[st] < lo * (1 + VIVA.stageMargin)) return null;
  return R.prod === lo ? 'prod' : R.tran === lo ? 'tran' : 'lay';
}

export function buy(k) {
  if (!canBuy(k)) return false;
  S.money -= cost(k);
  S.lv[k]++;
  return true;
}

// efeito de uma melhoria no nível atual: mul^nv (multiplica) ou 1 + add×nv (soma)
export const eff = k => UP[k].mul ? Math.pow(UP[k].mul, S.lv[k]) : 1 + (UP[k].add || 0) * S.lv[k];
// bônus das Ações (prestígio, só no Obra Viva): +bonusPer por Ação ganha
export const shareMult = () => FLAGS.viva ? 1 + VIVA.prestige.bonusPer * (S.shares || 0) : 1;

// material para assentar o andar i
export function floorCost(i, era, M = mods()) {
  const fc = FLAGS.viva ? { ...BAL.floorCost, ...VIVA.floorCost } : BAL.floorCost;
  const c = M.flag.prefab ? { ...fc, ...BAL.floorCostPrefab } : fc;
  const wall = Math.pow(2, Math.max(0, altOf(i) - c.wallStart) / c.wallDouble);
  const mod = Math.pow(mpfAt(i) / MPF, c.modulePow || 0); // módulo maior nas eras altas: mais material por peça
  return BRICKS * Math.pow(1 + i / c.scale, c.pow) * Math.pow(c.eraMult, era) * wall * mod * Math.pow(0.85, S.lv.projeto) * M.mult('fcost');
}

// ---------- taxas instantâneas derivadas do estado ----------
export function rates() {
  const L = S.lv, M = mods(), fl = Math.floor(S.floors), h = Math.max(MPF, altOf(fl)), era = eraAt(altOf(S.floors));
  const all = M.mult('all') * shareMult();
  const prod = 1.5 * L.fornec * eff('caminhao') * eff('olaria') * eff('premold') * M.mult('prod') * all;
  let spd = 1.5 * eff('motor') * eff('maglev') * M.mult('tranSpd') * all;
  if (M.flag.gravity) spd *= 1 + Math.log10(1 + h / 1000);
  const capc = 8 * eff('cacamba') * M.mult('tranCap');
  let hEff = h;
  if (M.flag.teleport) hEff = Math.min(hEff, 20000);
  if (M.flag.express) hEff = Math.pow(hEff, 0.85);
  const trip = 2 * hEff / spd + 2;
  const lay = L.pedreiro * 1.3 * eff('treino') * eff('ferram') * eff('mestre') * eff('guindaste') * M.mult('lay') * all;
  let tran = L.elevador * capc / trip;
  if (M.flag.helpers) tran += 0.25 * lay;
  const fcost = floorCost(fl, era, M);
  const capF = Math.floor(25 * Math.pow(M.flag.floatFound ? 3 : 2, L.fundacao) * M.mult('capF'));
  const sm = shareMult(), rent = S.rentBase * rentMult() * sm;
  const tour = tourism();
  const income = rent + tour.revenue * sm;
  const bank = bankInfo(income);
  const net = income * (1 - bank.share);
  return { prod, tran, lay, trip, fcost, capF, rent, tour, income, bank, net, spd, capc, era };
}

export const isCapped = R => S.floors >= R.capF - 1e-9;
export const bottleneck = R => R.prod <= R.tran && R.prod <= R.lay ? 'prod' : R.tran <= R.lay ? 'tran' : 'lay';
export const offlineMax = () => 8 * 3600 + mods().plus('offline') + (FLAGS.viva ? VIVA.prestige.council.offline.hours * 3600 * ((S.council && S.council.offline) || 0) : 0);

// ---------- passo da simulação ----------
export function sim(dt) {
  const R = rates(), M = mods();
  // material: produção → térreo → elevadores → topo → andares
  const direct = M.flag.topPlant ? 0.25 : 0;
  S.ground += R.prod * (1 - direct) * dt;
  S.top += R.prod * direct * dt;
  const mv = Math.min(R.tran * dt, S.ground); S.ground -= mv; S.top += mv;
  const before = Math.floor(S.floors);
  if (S.floors < R.capF) {
    const use = Math.min(R.lay * dt, S.top); S.top -= use;
    S.floors = Math.min(R.capF, S.floors + use / R.fcost);
  }
  // Obra Viva: a construtora recebe pelo andar entregue (uma vez por andar; vale também offline)
  const done = Math.floor(S.floors) - before;
  if (FLAGS.viva && done > 0) { const pay = rentSum(before, done) * VIVA.floorPaySecs; S.money += pay; S.stats.floorPay = (S.stats.floorPay || 0) + pay; }
  S.maxAlt = Math.max(S.maxAlt, altOf(Math.floor(S.floors)));
  S.era = Math.max(S.era, eraAt(altOf(S.floors)));
  // reciclagem: 2%/s do estoque parado no térreo vira dinheiro (metade do valor de venda por material)
  if (M.flag.recycle && S.ground > 0) {
    const q = S.ground * (1 - Math.exp(-0.02 * dt));
    const perUnit = 0.5 * rentAt(Math.floor(S.floors)) * BAL.saleSecs / R.fcost;
    S.ground -= q; S.money += q * perUnit;
  }
  brokerTick();
  // renda e banco
  const paid = bankTick(dt, R.income);
  S.money += R.income * dt - paid;
  S.stats.tourTotal += R.tour.revenue * dt;
}
