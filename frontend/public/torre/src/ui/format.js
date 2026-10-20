// Notação curta em português; científica acima de octilhões
const UNITS = ['mil', 'mi', 'bi', 'tri', 'quatri', 'quinti', 'sexti', 'septi', 'octi'];

export function fmt(n) {
  if (!isFinite(n)) return '∞';
  const a = Math.abs(n);
  if (a < 1000) return (a < 10 && a % 1 !== 0 ? n.toFixed(1) : Math.floor(n).toString()).replace('.', ',');
  const e = Math.floor(Math.log10(a) / 3);
  if (e > UNITS.length) return n.toExponential(2).replace('.', ',');
  const v = n / Math.pow(1000, e);
  return v.toFixed(v < 10 ? 2 : v < 100 ? 1 : 0).replace('.', ',') + ' ' + UNITS[e - 1];
}

export function fmtM(m) {
  return m < 1000
    ? Math.floor(m) + ' m'
    : (m / 1000).toFixed(m < 1e4 ? 2 : m < 1e6 ? 1 : 0).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' km';
}

// porcentagem de Reputação: sempre por extenso, com milhar (+1.534%), nunca abreviada
export const fmtPct = v => '+' + Math.round(v || 0).toLocaleString('pt-BR') + '%';
