import { MPF, BRICKS } from '../data/constants.js';
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
export const unlocked = reqMet;
export const maxed = k => UP[k].max !== undefined && S.lv[k] >= UP[k].max;
export const canBuy = k => unlocked(k) && !maxed(k) && S.money >= cost(k);

export function buy(k) {
  if (!canBuy(k)) return false;
  S.money -= cost(k);
  S.lv[k]++;
  return true;
}

// material para assentar o andar i
export function floorCost(i, era, M = mods()) {
  const c = M.flag.prefab ? { ...BAL.floorCost, ...BAL.floorCostPrefab } : BAL.floorCost;
  const wall = Math.pow(2, Math.max(0, i * MPF - c.wallStart) / c.wallDouble);
  return BRICKS * Math.pow(1 + i / c.scale, c.pow) * Math.pow(c.eraMult, era) * wall * Math.pow(0.85, S.lv.projeto) * M.mult('fcost');
}

// ---------- taxas instantâneas derivadas do estado ----------
export function rates() {
  const L = S.lv, M = mods(), fl = Math.floor(S.floors), h = Math.max(MPF, fl * MPF), era = eraAt(S.floors * MPF);
  const all = M.mult('all');
  const prod = 1.5 * L.fornec * (1 + 0.3 * L.caminhao) * Math.pow(2, L.olaria) * Math.pow(3, L.premold) * M.mult('prod') * all;
  let spd = 1.5 * Math.pow(1.3, L.motor) * Math.pow(4, L.maglev) * M.mult('tranSpd') * all;
  if (M.flag.gravity) spd *= 1 + Math.log10(1 + h / 1000);
  const capc = 8 * Math.pow(1.3, L.cacamba) * M.mult('tranCap');
  let hEff = h;
  if (M.flag.teleport) hEff = Math.min(hEff, 20000);
  if (M.flag.express) hEff = Math.pow(hEff, 0.85);
  const trip = 2 * hEff / spd + 2;
  const lay = L.pedreiro * 1.3 * (1 + 0.25 * L.treino) * Math.pow(1.5, L.ferram) * Math.pow(2, L.mestre) * (1 + 0.5 * L.guindaste) * M.mult('lay') * all;
  let tran = L.elevador * capc / trip;
  if (M.flag.helpers) tran += 0.25 * lay;
  const fcost = floorCost(fl, era, M);
  const capF = Math.floor(25 * Math.pow(M.flag.floatFound ? 3 : 2, L.fundacao) * M.mult('capF'));
  const rent = S.rentBase * rentMult();
  const tour = tourism();
  const income = rent + tour.revenue;
  const bank = bankInfo(income);
  const net = income * (1 - bank.share);
  return { prod, tran, lay, trip, fcost, capF, rent, tour, income, bank, net, spd, capc, era };
}

export const isCapped = R => S.floors >= R.capF - 1e-9;
export const bottleneck = R => R.prod <= R.tran && R.prod <= R.lay ? 'prod' : R.tran <= R.lay ? 'tran' : 'lay';
export const offlineMax = () => 8 * 3600 + mods().plus('offline');

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
  S.maxAlt = Math.max(S.maxAlt, Math.floor(S.floors) * MPF);
  S.era = Math.max(S.era, eraAt(S.floors * MPF));
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
