// Reputação e relógio do ano da torre única (Obra Viva). A Reputação (S.pontosTotal, ganha no fim de cada ano em
// sim/risco.js) soma VIVA.prestige.rep em tudo; o ano corre no relógio S.roundLeft (VIVA.round.secs, descontado em sim())
// e aparece como dias de 1 a 365.
import { VIVA } from '../data/viva.js';
import { FLAGS } from '../data/flags.js';
import { cityOf } from '../data/cities.js';
import { S } from './state.js';

// Reputação na tela (decisão do usuário, 20/10/2026: sem ★): os pontos internos (S.pontosTotal, pointsFor) só aparecem
// como porcentagem, VIVA.prestige.rep por ponto
export const repPct = pts => Math.round(VIVA.prestige.rep * 100 * (pts || 0) * 1e6) / 1e6;
export const pointsFor = alt => alt <= 0 ? 0 : Math.max(1, Math.floor(VIVA.prestige.k * Math.pow(alt / 1000, VIVA.prestige.pow)));
// a torre única fica sempre em Santa Brisa (as outras cidades só aparecem no protótipo Colapso)
export const city = () => cityOf(0);
// dia do ano: os VIVA.round.secs de relógio aparecem como 365 dias; roundFrac é a parte do ano já passada (0–1)
export const roundDays = () => VIVA.round.dias;
export const roundSecs = () => VIVA.round.secs - (S.roundLeft || 0); // tempo de jogo deste ano
export const roundFrac = () => Math.min(1, Math.max(0, roundSecs() / VIVA.round.secs));
export const roundDay = () => Math.min(roundDays(), 1 + Math.floor(roundFrac() * roundDays()));

// Reputação: cada ponto ganho no total soma VIVA.prestige.rep em tudo ('prod', 'tran', 'lay', 'rent', 'tour'); 'offline' = 0
export function boardMult(st) {
  if (!FLAGS.viva) return st === 'offline' ? 0 : 1;
  if (st === 'offline') return 0;
  // marcos depois da Órbita: ×(1 + bonus) por marco alcançado na campanha
  return (1 + VIVA.prestige.rep * (S.pontosTotal || 0)) * Math.pow(1 + VIVA.marcosBonus, (S.marcosAlt || []).length);
}
