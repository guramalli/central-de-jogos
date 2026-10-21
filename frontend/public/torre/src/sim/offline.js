import { S } from './state.js';
import { sim, offlineMax } from './economy.js';
import { fmt, din } from '../ui/format.js';
import { t } from '../i18n.js';
import { FLAGS } from '../data/flags.js';

// Simula o tempo fora do jogo (até 8 h, mais bônus da árvore). Devolve uma mensagem ou null.
export function runOffline() {
  if (FLAGS.viva) return null; // Obra Viva: rodadas de 20 min só correm com o jogo aberto (sem ganho offline)
  const away = Math.min(offlineMax(), (Date.now() - S.last) / 1000);
  if (away <= 30 || S.floors + S.money <= 0) return null;
  const f0 = S.floors, m0 = S.money;
  let falta = away;
  while (falta > 0) { const st = Math.min(5, falta); sim(st); falta -= st; }
  const df = Math.floor(S.floors) - Math.floor(f0), dm = S.money - m0;
  if (df < 1 && dm < 1) return null;
  return df === 1 ? t('Enquanto você esteve fora: +1 andar, +{0}', din(dm)) : t('Enquanto você esteve fora: +{0} andares, +{1}', fmt(df), din(dm));
}
