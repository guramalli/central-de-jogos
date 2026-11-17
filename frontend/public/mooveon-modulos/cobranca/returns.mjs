import { assert, decimal, date } from '../orcamentos/domain.mjs';
import { matchReturn } from './domain.mjs';

export const CSV_HEADER = 'banco;conta;nosso_numero;identificador;valor_pago;data_pagamento;situacao';
export function parseCSV(input) {
  const source = input.replace(/^\uFEFF/, ''); const rows = []; let row = [], value = '', quoted = false;
  for (let n = 0; n < source.length; n++) {
    const c = source[n];
    if (c === '"') { if (quoted && source[n + 1] === '"') { value += '"'; n++; } else { assert(quoted || value === '', 'Aspas inválidas no CSV.'); quoted = !quoted; } }
    else if (!quoted && (c === ';' || c === '\n')) { row.push(value.trim()); value = ''; if (c === '\n') { if (row.some(Boolean)) rows.push(row); row = []; } }
    else if (c !== '\r') value += c;
  }
  assert(!quoted, 'CSV com aspas não fechadas.'); row.push(value.trim()); if (row.some(Boolean)) rows.push(row);
  assert(rows.shift()?.join(';') === CSV_HEADER, `Cabeçalho esperado: ${CSV_HEADER}`);
  assert(rows.length > 0 && rows.length <= 1000, 'Importe de 1 a 1.000 linhas.');
  return rows.map((r, n) => {
    const item = { line: n + 2, bankCode: r[0], account: r[1], ourNumber: r[2], reference: r[3], status: r[6]?.toLowerCase(), amountCents: 0, paidDate: r[5] };
    try { assert(r.length === 7, 'Quantidade de colunas inválida.'); item.amountCents = decimal(r[4]); item.paidDate = date(/^\d{2}\/\d{2}\/\d{4}$/.test(r[5]) ? r[5].split('/').reverse().join('-') : r[5]); }
    catch (e) { item.error = e.message; } return item;
  });
}
export function previewReturns(s, rows) {
  const seen = new Set(); return rows.map(row => { const key = `${row.bankCode}|${row.account}|${row.reference}`, match = matchReturn(s, row); if (seen.has(key)) { match.ready = false; match.issue = 'Pagamento repetido dentro do arquivo.'; } seen.add(key); return { ...row, ...match }; });
}
export function csvCell(value) { let s = String(value ?? ''); if (/^[\s]*[=+@-]/.test(s)) s = "'" + s; return '"' + s.replaceAll('"', '""') + '"'; }
export function csvExport(rows) { return '\uFEFF' + rows.map(r => r.map(csvCell).join(';')).join('\r\n'); }
