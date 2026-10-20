// Rodadas "Nova obra" (Obra Viva): cada obra tem 20 min de relógio (S.roundLeft, descontado em sim()). Quando zera, ou se o
// jogador entrega antes, endRound() credita as ★ pela altura e congela a obra; o jogador gasta no quadro "Construtora"
// (só Reputação e gerentes) e startNextRound() recomeça do zero na próxima cidade (data/cities.js).
import { VIVA } from '../data/viva.js';
import { FLAGS } from '../data/flags.js';
import { CITIES, cityOf } from '../data/cities.js';
import { S, fresh, setState, save, saveKey } from './state.js';

// o que passa de uma obra para a outra
const KEEP = ['obra', 'cidade', 'pontosTotal', 'bestAlt', 'won', 'winSeen', 'introSeen', 'playTime', 'marcos', 'mgr', 'dicas', 'altTotal', 'orbitaSec', 'rank', 'jornais', 'torres', 'marcosAlt', 'mgrAviso'];

// Reputação na tela (decisão do usuário, 20/10/2026: sem ★): os pontos internos (S.pontosTotal, pointsFor) só aparecem
// como porcentagem, VIVA.prestige.rep por ponto
export const repPct = pts => Math.round(VIVA.prestige.rep * 100 * (pts || 0) * 1e6) / 1e6;
export const pointsFor = alt => alt <= 0 ? 0 : Math.max(1, Math.floor(VIVA.prestige.k * Math.pow(alt / 1000, VIVA.prestige.pow)));
export const metaAlt = () => Math.min(VIVA.winAlt, Math.max(VIVA.meta.rec * (S.bestAlt || 0), VIVA.meta.piso * Math.pow(VIVA.meta.cresce, (S.obra || 1) - 1)));
// entregar antes do prazo vale sempre (decisão do usuário, out/2026); o que muda é o resultado (deliverTerms)
export const canDeliver = () => FLAGS.viva && !S.roundOver && S.maxAlt > 0;
// bônus de antecipação (fração): só antes do fim do prazo, pelos dias que sobram
export const earlyBonus = () => FLAGS.viva && !S.roundOver ? VIVA.meta.bonus * (1 - roundFrac()) : 0;
// termos da entrega agora: no fim do prazo, normal; antes do prazo com a meta batida, bônus de antecipação;
// antes do prazo sem a meta, multa: Reputação e taxa da torre × (altura ÷ meta)² (torre baixa quase não rende)
// caixa que sobra: fração do que foi ganho na obra (caixa + gasto em compras) que ficou no caixa, × VIVA.sobra.k
export const sobraBonus = () => { const m = Math.max(0, S.money || 0), sp = S.spent || 0; return FLAGS.viva && m + sp > 0 ? VIVA.sobra.k * m / (m + sp) : 0; };
export function deliverTerms() {
  const base = pointsFor(S.maxAlt), taxa0 = admTaxa(S.maxAlt), meta = metaAlt(), sobra = sobraBonus();
  if (!FLAGS.viva || S.roundOver) return { early: false, metaOk: true, factor: 1, bonus: 0, multa: 0, sobra, pts: Math.round(base * (1 + sobra)), base, taxa: taxa0, meta };
  if (S.maxAlt >= meta) { const bonus = earlyBonus(); return { early: true, metaOk: true, factor: 1, bonus, multa: 0, sobra, pts: Math.round(base * (1 + bonus) * (1 + sobra)), base, taxa: taxa0, meta }; }
  const factor = Math.pow(S.maxAlt / meta, 2);
  return { early: true, metaOk: false, factor, bonus: 0, multa: Math.round((1 - factor) * 100), sobra, pts: Math.floor(base * factor * (1 + sobra)), base, taxa: taxa0 * factor, meta };
}
export const deliverPoints = () => deliverTerms().pts;
export const city = () => cityOf(S.cidade || 0);
export const nextCity = () => cityOf((S.cidade || 0) + 1);
// dia da obra (decisão do usuário, out/2026): os 20 min de relógio aparecem como um contrato de 365 dias,
// contando do dia 1 ao 365; roundFrac é a parte do prazo já passada (0–1), para a barrinha
// com aditivos (S.anos), o prazo soma 365 dias por ano e o dia continua contando (366, 367…)
const anos = () => Math.max(1, S.anos || 1);
export const roundDays = () => VIVA.round.dias * anos();
export const roundSecs = () => VIVA.round.secs * anos() - (S.roundLeft || 0); // tempo de jogo desta obra (ranking)
export const roundFrac = () => Math.min(1, Math.max(0, roundSecs() / (VIVA.round.secs * anos())));
export const roundDay = () => Math.min(roundDays(), 1 + Math.floor(roundFrac() * roundDays()));
// taxa de administração que uma torre entregue paga por segundo, para sempre
export const admTaxa = alt => alt > 0 ? VIVA.adm.k * Math.pow(alt / 1000, VIVA.adm.pow) : 0;
export const admTotal = () => FLAGS.viva ? (S.torres || []).reduce((a, t) => a + (t.taxa || 0), 0) : 0;
// fim do ano (o prazo venceu e a obra parou, ainda sem entregar): dá para assinar o aditivo de mais 365 dias
export const canExtend = () => FLAGS.viva && S.roundOver && !S.roundPaid;
export function extendRound() {
  if (!canExtend()) return false;
  S.anos = anos() + 1; S.roundLeft = VIVA.round.secs; S.roundOver = false;
  save();
  return true;
}

// Reputação (só Reputação): cada ★ já ganha soma VIVA.prestige.rep em tudo ('prod', 'tran', 'lay', 'rent', 'tour'); 'offline' = 0
export function boardMult(st) {
  if (!FLAGS.viva) return st === 'offline' ? 0 : 1;
  if (st === 'offline') return 0;
  // marcos depois da Órbita: ×(1 + bonus) por marco alcançado na campanha
  return (1 + VIVA.prestige.rep * (S.pontosTotal || 0)) * Math.pow(1 + VIVA.marcosBonus, (S.marcosAlt || []).length);
}
// regra da cidade atual (1 quando a cidade não mexe nessa etapa)
export const cityMult = st => (FLAGS.viva && city().mods[st]) || 1;

// fim da rodada (relógio zerou ou entrega antecipada): credita as ★ uma vez e congela a obra
export function endRound() {
  if (!FLAGS.viva || S.roundPaid) return 0;
  const dt = deliverTerms(), got = dt.pts; S.lastEarly = dt.bonus; S.lastMulta = dt.multa; S.lastSobra = dt.sobra; S.lastGot = got; // o placar mostra
  S.pontosTotal = (S.pontosTotal || 0) + got;
  S.altTotal = (S.altTotal || 0) + S.maxAlt; // recorde total = soma das alturas das obras
  S.lastBest = S.bestAlt || 0; // recorde antes desta rodada (o placar mostra "Novo recorde!")
  S.bestAlt = Math.max(S.bestAlt || 0, S.maxAlt);
  // a torre fica de pé na cidade e entra no portfólio, pagando a taxa de administração nas próximas obras
  S.torres = [...(S.torres || []), { obra: S.obra || 1, cidade: city().n, alt: S.maxAlt, dia: roundDay(), taxa: dt.taxa }];
  S.roundOver = true; S.roundPaid = true;
  return got;
}
// próxima rodada: guarda o save antigo e recomeça na próxima cidade com os bônus de partida do quadro
export function startNextRound() {
  if (!FLAGS.viva || !S.roundOver) return;
  if (!S.roundPaid) endRound(); // fim do ano sem escolher: aceitar o contrato da próxima cidade é entregar esta
  try { localStorage.setItem(saveKey() + '-obra-' + S.obra, JSON.stringify(S)); } catch (e) { }
  const keep = {};
  for (const k of KEEP) keep[k] = S[k];
  keep.obra = (S.obra || 1) + 1; keep.cidade = (S.cidade || 0) + 1;
  const n = fresh();
  Object.assign(n, keep);
  n.roundLeft = VIVA.round.secs;
  setState(n); save();
}
// atalho (robô e testes): encerra e já começa a próxima; devolve as ★
export function deliver() {
  if (!canDeliver()) return 0;
  const got = endRound();
  startNextRound();
  return got;
}
export { CITIES };
