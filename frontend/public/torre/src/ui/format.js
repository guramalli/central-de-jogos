// Notação curta (português: 13,7 bi · inglês: 13.7B); científica acima de octilhões
import { LANG } from '../i18n.js';
const UNITS = ['mil', 'mi', 'bi', 'tri', 'quatri', 'quinti', 'sexti', 'septi', 'octi'];
const UNITS_EN = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc'];
const dec = s => LANG === 'en' ? s : s.replace('.', ',');

export function fmt(n) {
  if (!isFinite(n)) return '∞';
  const a = Math.abs(n);
  if (a < 1000) return dec(a < 10 && a % 1 !== 0 ? n.toFixed(1) : Math.floor(n).toString());
  const e = Math.floor(Math.log10(a) / 3);
  if (e > UNITS.length) return dec(n.toExponential(2));
  const v = n / Math.pow(1000, e);
  const s = dec(v.toFixed(v < 10 ? 2 : v < 100 ? 1 : 0));
  return LANG === 'en' ? s + UNITS_EN[e - 1] : s + ' ' + UNITS[e - 1];
}

// dinheiro: "R$ 13,7 bi" · "$13.7B"
export const din = v => (LANG === 'en' ? '$' : 'R$ ') + fmt(v);

export function fmtM(m) {
  if (m < 1000) return Math.floor(m) + ' m';
  const s = (m / 1000).toFixed(m < 1e4 ? 2 : m < 1e6 ? 1 : 0);
  return (LANG === 'en' ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : s.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')) + ' km';
}

// porcentagem de Reputação: sempre por extenso, com milhar (+1.534% · +1,534%), nunca abreviada
export const fmtPct = v => '+' + Math.round(v || 0).toLocaleString(LANG === 'en' ? 'en-US' : 'pt-BR') + '%';
