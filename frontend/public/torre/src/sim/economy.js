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
import { boardMult, cityMult, admTotal } from './prestige.js';
import { managerTick } from './managers.js';
import { perkMult, contractTick } from './contracts.js';
import { tourism } from './tourism.js';
import { bankInfo, bankTick } from './bank.js';
import { techMult } from './tech.js';
import { riscoTick, riscoLay, fimDoAno } from './risco.js';

// ---------- melhorias compradas com dinheiro ----------
// soft: { at, k } — depois do nível `at`, cada nível multiplica o preço por `k` (Obra Viva: turismo sem virar ralo)
const softMult = k => { const u = UP[k], s = FLAGS.viva && u.soft, lv = S.lv[k] || 0; return s && lv > s.at ? Math.pow(s.k / u.k, lv - s.at) : 1; };
export const cost = k => Math.ceil(UP[k].base * Math.pow(UP[k].k, S.lv[k] - (UP[k].start || 0)) * softMult(k) * mods().mult('cost_' + UP[k].b) * (k === 'fundacao' ? techMult('fundCost') : 1) * perkMult('cost'));
export const reqMet = k => (!UP[k].req || S.lv[UP[k].req[0]] >= UP[k].req[1]) && (!UP[k].reqAlt || S.maxAlt >= UP[k].reqAlt);
// par de tecnologias de era: comprar uma trava a irmã até a próxima obra
export const pairTaken = k => !!(UP[k].pair && S.lv[UP[k].pair] > 0);
export const unlocked = k => reqMet(k) && !(FLAGS.viva && VIVA.hidden.includes(k)) && !pairTaken(k);
export const maxed = k => UP[k].max !== undefined && S.lv[k] >= UP[k].max;
export const canBuy = k => !(FLAGS.viva && S.roundOver) && unlocked(k) && !maxed(k) && !stageBlock(k) && S.money >= cost(k);

// Obra Viva: as etapas do fluxo andam juntas, como numa obra real. Uma etapa que já está mais de
// VIVA.stageMargin à frente da mais lenta não pode ser melhorada até as outras alcançarem.
// Devolve a etapa que está segurando ('prod' | 'tran' | 'lay') ou null.
export const STAGE_OF = k => UP[k].b === 'forn' ? 'prod' : UP[k].b === 'log' ? 'tran' : UP[k].b === 'obra' || k === 'guindaste' ? 'lay' : null;
const craneLog = () => UP.guindaste.b === 'log'; // Obra Viva: guindaste soma no transporte; clássico: nos pedreiros
export function stageBlock(k) {
  if (!FLAGS.viva || !VIVA.stageGate) return null; // decisão do usuário (out/2026): o gargalo é consequência, não proibição
  const st = STAGE_OF(k); if (!st) return null;
  const R = rates(), lo = Math.min(R.prod, R.tran, R.lay);
  if (R[st] < lo * (1 + VIVA.stageMargin)) return null;
  return R.prod === lo ? 'prod' : R.tran === lo ? 'tran' : 'lay';
}

export function buy(k) {
  if (!canBuy(k)) return false;
  const c = cost(k);
  S.money -= c; S.spent = (S.spent || 0) + c; // gasto da obra (o caixa que sobra vira Reputação na entrega)
  S.lv[k]++;
  return true;
}

// compra em lote (vistoria de 20/10: menos cliques no começo): até n níveis seguidos, parando quando o dinheiro acaba
export function buyN(k, n) { let c = 0; while (c < n && buy(k)) c++; return c; }
// preço somado dos próximos n níveis (respeitando o máximo)
export function costN(k, n) {
  const lv = S.lv[k], m = UP[k].max !== undefined ? Math.max(0, Math.min(n, UP[k].max - lv)) : n;
  let t = 0;
  try { for (let i = 0; i < m; i++) { t += cost(k); S.lv[k]++; } } finally { S.lv[k] = lv; }
  return t;
}

// efeito de uma melhoria no nível atual: mul^nv (multiplica) ou 1 + add×nv (soma)
export const eff = k => UP[k].mul ? Math.pow(UP[k].mul, S.lv[k]) : 1 + (UP[k].add || 0) * S.lv[k];

// material para assentar o andar i
export function floorCost(i, era, M = mods()) {
  const fc = FLAGS.viva ? { ...BAL.floorCost, ...VIVA.floorCost } : BAL.floorCost;
  const c = M.flag.prefab ? { ...fc, ...(FLAGS.viva ? VIVA.floorCostPrefab : BAL.floorCostPrefab) } : fc;
  const wall = Math.pow(2, Math.max(0, altOf(i) - c.wallStart) / c.wallDouble);
  const mod = Math.pow(mpfAt(i) / MPF, c.modulePow || 0) * techMult('fcost'); // módulo maior nas eras altas: mais material por peça
  const mult = 1 + ((c.mult || 1) - 1) * Math.min(1, i / 40); // o encarecimento entra aos poucos nos primeiros 40 andares
  return BRICKS * mult * Math.pow(1 + i / c.scale, c.pow) * Math.pow(c.eraMult, era) * wall * mod * Math.pow(0.85, S.lv.projeto) * M.mult('fcost') * perkMult('fcost');
}

// ---------- taxas instantâneas derivadas do estado ----------
export function rates() {
  const L = S.lv, M = mods(), fl = Math.floor(S.floors), h = Math.max(MPF, altOf(fl)), era = eraAt(altOf(S.floors));
  const all = M.mult('all');
  const prod = 1.5 * L.fornec * eff('caminhao') * eff('olaria') * eff('premold') * techMult('prod') * M.mult('prod') * all * boardMult('prod') * cityMult('prod') * perkMult('prod');
  let spd = 1.5 * eff('motor') * eff('maglev') * techMult('tran') * M.mult('tranSpd') * all;
  if (M.flag.gravity) spd *= 1 + Math.log10(1 + h / 1000);
  const capc = 8 * eff('cacamba') * M.mult('tranCap') * techMult('cap');
  let hEff = h;
  // Obra Viva: a altura pesa menos na viagem (h0·(h/h0)^pow), para a Logística acompanhar o Fornecimento sem crescer demais
  if (FLAGS.viva && h > VIVA.trip.h0) hEff = VIVA.trip.h0 * Math.pow(h / VIVA.trip.h0, VIVA.trip.pow);
  if (M.flag.teleport) hEff = Math.min(hEff, 20000);
  if (M.flag.express) hEff = Math.pow(hEff, 0.85);
  const trip = 2 * hEff / spd + 2;
  // Obra Viva: a velocidade (Motor, Magnético, tecnologias) multiplica o material subindo inteiro. Sem isso, os 2 s
  // fixos de carga e descarga viravam quase toda a viagem no fim do jogo e o "×2,8" do Magnético rendia +3%.
  const spd0 = 1.5 * M.mult('tranSpd') * all, tripEff = FLAGS.viva ? (2 * hEff / spd0 + 2) / (spd / spd0) : trip;
  const lay = L.pedreiro * 1.3 * eff('treino') * eff('ferram') * eff('mestre') * (craneLog() ? 1 : eff('guindaste')) * techMult('lay') * M.mult('lay') * all * boardMult('lay') * cityMult('lay') * perkMult('lay');
  let tran = L.elevador * capc / tripEff * (craneLog() ? eff('guindaste') : 1) * boardMult('tran') * cityMult('tran') * perkMult('tran');
  // Mutirão: no Obra Viva no máximo dobra o que os elevadores sobem (sem teto, o excesso de pedreiros virava bola de neve)
  if (M.flag.helpers) tran += FLAGS.viva ? Math.min(0.25 * lay, tran) : 0.25 * lay;
  const fcost = floorCost(fl, era, M);
  const capF = Math.floor(25 * Math.pow(M.flag.floatFound ? 3 : 2, L.fundacao) * M.mult('capF') * techMult('capF'));
  const rent = S.rentBase * rentMult();
  const tour = tourism();
  const adm = admTotal(); // taxa de administração das torres já entregues
  const income = rent + tour.revenue + adm;
  const bank = bankInfo(income);
  const net = income * (1 - bank.share);
  return { prod, tran, lay, trip, fcost, capF, rent, tour, adm, income, bank, net, spd, capc, era };
}

export const isCapped = R => S.floors >= R.capF - 1e-9;
export const bottleneck = R => R.prod <= R.tran && R.prod <= R.lay ? 'prod' : R.tran <= R.lay ? 'tran' : 'lay';
export const offlineMax = () => 8 * 3600 + mods().plus('offline') + boardMult('offline');

// ---------- passo da simulação ----------
export function sim(dt) {
  // Obra Viva: rodada de 20 min (365 dias); encerrada, nada anda. O passo em que o relógio zera ainda conta.
  // No fim do ano a obra para esperando a escolha (aditivo ou entregar); as ★ só saem na entrega (endRound).
  let ends = false;
  if (FLAGS.viva) {
    if (S.roundOver || S.colapso || (FLAGS.risco && S.risco && S.risco.fimAno)) return; // risco: parada na escolha do fim do ano
    S.roundLeft = Math.max(0, S.roundLeft - dt);
    if (FLAGS.risco && S.risco && S.risco.interd) S.roundLeft = Math.max(S.roundLeft, 0.05); // interditada: o ano não termina até o reforço sair
    ends = S.roundLeft <= 0;
  }
  simStep(dt);
  if (FLAGS.viva) { contractTick(dt); managerTick(dt); }
  if (FLAGS.risco) riscoTick(dt);
  if (ends) { if (!FLAGS.risco) S.roundOver = true; else if (S.risco && S.risco.interd) S.roundLeft = 0.05; else if (!S.colapso) fimDoAno(); } // interditada no último passo: o ano espera o reforço // risco: a mesma torre segue, com prêmio
}
function simStep(dt) {
  const R = rates(), M = mods();
  // material: produção → térreo → elevadores → topo → andares
  // Usina no topo: 25% do material nasce lá em cima; no Obra Viva no máximo o mesmo tanto que os elevadores sobem
  const direct = M.flag.topPlant ? (FLAGS.viva ? Math.min(0.25 * R.prod, R.tran) : 0.25 * R.prod) : 0;
  S.ground += (R.prod - direct) * dt;
  S.top += direct * dt;
  const mv = Math.min(R.tran * dt, S.ground); S.ground -= mv; S.top += mv;
  const before = Math.floor(S.floors);
  if (S.floors < R.capF) {
    const use = Math.min(R.lay * dt * (FLAGS.risco ? riscoLay() : 1), S.top); S.top -= use;
    S.floors = Math.min(R.capF, S.floors + use / R.fcost);
  }
  // Obra Viva: a construtora recebe pelo andar entregue (uma vez por andar; vale também offline)
  const done = Math.floor(S.floors) - before;
  if (FLAGS.viva && done > 0) { const pay = rentSum(before, done) * VIVA.floorPaySecs * techMult('floorPay'); S.money += pay; S.stats.floorPay = (S.stats.floorPay || 0) + pay; S.mgrPool = (S.mgrPool || 0) + VIVA.manager.share * pay; }
  S.maxAlt = Math.max(S.maxAlt, altOf(Math.floor(S.floors)));
  if (FLAGS.viva && S.maxAlt >= VIVA.marcosOrbita[0].m) for (const mk of VIVA.marcosOrbita) if (S.maxAlt >= mk.m && !(S.marcosAlt || []).includes(mk.m)) S.marcosAlt = [...(S.marcosAlt || []), mk.m];
  S.era = Math.max(S.era, eraAt(altOf(S.floors)));
  if (FLAGS.viva && !S.won && S.maxAlt >= VIVA.winAlt) { S.won = true; S.orbitaSec = S.orbitaSec || S.playTime || 0; } // chegou à Órbita (tempo de jogo para o ranking)
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
