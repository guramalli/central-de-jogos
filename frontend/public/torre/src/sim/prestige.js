// Rodadas "Nova obra" (Obra Viva): cada obra tem 20 min de relógio (S.roundLeft, descontado em sim()). Quando zera, ou se o
// jogador entrega antes, endRound() credita as ★ pela altura e congela a obra; o jogador gasta no quadro "Construtora"
// (só Reputação e gerentes) e startNextRound() recomeça do zero na próxima cidade (data/cities.js).
import { VIVA } from '../data/viva.js';
import { FLAGS } from '../data/flags.js';
import { CITIES, cityOf } from '../data/cities.js';
import { S, fresh, setState, save, saveKey } from './state.js';

// o que passa de uma obra para a outra
const KEEP = ['obra', 'cidade', 'pontosTotal', 'bestAlt', 'won', 'winSeen', 'introSeen', 'playTime', 'marcos', 'mgr', 'dicas', 'altTotal', 'orbitaSec', 'rank'];

export const pointsFor = alt => alt <= 0 ? 0 : Math.max(1, Math.floor(VIVA.prestige.k * Math.pow(alt / 1000, VIVA.prestige.pow)));
export const canDeliver = () => FLAGS.viva && !S.roundOver && S.maxAlt > 0;
export const city = () => cityOf(S.cidade || 0);
export const nextCity = () => cityOf((S.cidade || 0) + 1);

// Reputação (só Reputação): cada ★ já ganha soma VIVA.prestige.rep em tudo ('prod', 'tran', 'lay', 'rent', 'tour'); 'offline' = 0
export function boardMult(st) {
  if (!FLAGS.viva) return st === 'offline' ? 0 : 1;
  return st === 'offline' ? 0 : 1 + VIVA.prestige.rep * (S.pontosTotal || 0);
}
// regra da cidade atual (1 quando a cidade não mexe nessa etapa)
export const cityMult = st => (FLAGS.viva && city().mods[st]) || 1;

// fim da rodada (relógio zerou ou entrega antecipada): credita as ★ uma vez e congela a obra
export function endRound() {
  if (!FLAGS.viva || S.roundPaid) return 0;
  const got = pointsFor(S.maxAlt);
  S.pontosTotal = (S.pontosTotal || 0) + got;
  S.altTotal = (S.altTotal || 0) + S.maxAlt; // recorde total = soma das alturas das obras
  S.lastBest = S.bestAlt || 0; // recorde antes desta rodada (o placar mostra "Novo recorde!")
  S.bestAlt = Math.max(S.bestAlt || 0, S.maxAlt);
  S.roundOver = true; S.roundPaid = true;
  return got;
}
// próxima rodada: guarda o save antigo e recomeça na próxima cidade com os bônus de partida do quadro
export function startNextRound() {
  if (!FLAGS.viva || !S.roundOver) return;
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
