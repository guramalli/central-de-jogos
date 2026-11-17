import { assert, text, integer, date, today } from '../orcamentos/domain.mjs';

export const BILLING_ROLES = ['vini', 'cobranca', 'consulta'];
export const ROLE_LABELS = { vini: 'Diretoria', cobranca: 'Cobrança', consulta: 'Somente consulta' };
export const KINDS = { entry: 'Entrada em dinheiro', regular: 'Parcelas regulares', intermediate: 'Intermediárias', keys: 'Entrega das chaves', financing: 'Financiamento / repasse', custom: 'Fluxo personalizado' };
export const ASSET_KINDS = { car: 'Veículo', property: 'Imóvel em permuta', other: 'Outro bem / direito' };
export const moneyLimit = 100000000000;
const opt = (v, max = 4000) => { assert(v == null || typeof v === 'string', 'Texto inválido.'); assert((v || '').length <= max, `Texto excede ${max} caracteres.`); return (v || '').trim(); };
const enumValue = (value, list, label) => { assert(list.includes(value), `${label} inválido.`); return value; };
export const AGREEMENT_STATUS = { negotiating: 'Em negociação', signed: 'Assinado', fulfilled: 'Cumprido', cancelled: 'Cancelado' };
export function emptyBilling(tenantId, name) { return { version: 1, tenantId, name, revision: 0, seq: 0, contracts: [], installments: [], assets: [], receipts: [], batches: [], renegotiations: [], audit: [] }; }
export function rateFromText(value) {
  const s = String(value).trim().replace(',', '.'); assert(/^-?\d+(\.\d{1,4})?$/.test(s), 'Taxa: use até quatro casas decimais, sem separador de milhar.');
  const [a, b = ''] = s.replace('-', '').split('.'); const rate = (Number(a) * 10000 + Number(b.padEnd(4, '0'))) * (s.startsWith('-') ? -1 : 1);
  return integer(rate, 'Taxa percentual por período', -999999, 1000000);
}
export function addMonths(day, count) {
  date(day); integer(count, 'Intervalo', 0, 1200); const [y, m, d] = day.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + count, 1)); const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, last)); return target.toISOString().slice(0, 10);
}
export function correctionRule(p) {
  const mode = enumValue(p.mode, ['fixed', 'compound', 'manual'], 'Correção');
  if (mode === 'fixed') return { mode, rate: 0, period: 'monthly', baseDate: '', label: 'Fixo, sem correção', note: opt(p.note) };
  if (mode === 'manual') return { mode, rate: 0, period: 'monthly', baseDate: '', label: text(p.label, 'Descrição do índice ou regra', 200), note: text(p.note, 'Descreva como o valor será apurado', 4000) };
  return { mode, rate: integer(p.rate, 'Taxa', -999999, 1000000), period: enumValue(p.period, ['monthly', 'annual'], 'Periodicidade'), baseDate: date(p.baseDate, 'Data-base'), label: text(p.label, 'Índice / nome da regra', 200), note: opt(p.note) };
}
export function corrected(principal, dueDate, rule) {
  integer(principal, 'Principal', 1, moneyLimit); date(dueDate);
  if (rule.mode !== 'compound') return { amountCents: principal, periods: 0 };
  assert(dueDate >= rule.baseDate, 'Vencimento anterior à data-base de correção.');
  const [y, m] = dueDate.split('-').map(Number), [by, bm] = rule.baseDate.split('-').map(Number);
  let months = (y - by) * 12 + m - bm;
  if (addMonths(rule.baseDate, months) > dueDate) months--;
  const periods = rule.period === 'annual' ? Math.floor(months / 12) : months;
  assert(periods <= 1200, 'Período de correção muito longo.');
  let result = BigInt(principal); const factor = BigInt(1000000 + rule.rate);
  for (let i = 0; i < periods; i++) { result = (result * factor + 500000n) / 1000000n; assert(result > 0n && result <= BigInt(moneyLimit), 'Correção gerou valor fora do limite.'); }
  return { amountCents: Number(result), periods };
}
export function paid(s, id) { return s.receipts.filter(r => r.installmentId === id && !r.reversedAt).reduce((n, r) => n + r.amountCents, 0); }
export function balance(s, item) { return item.amountCents - paid(s, item.id); }
export function itemStatus(s, item, now = today()) { return balance(s, item) === 0 ? 'paid' : paid(s, item.id) > 0 ? 'partial' : item.dueDate < now ? 'overdue' : 'open'; }
export function contractTotals(s, c) {
  const items = s.installments.filter(i => i.contractId === c.id), assets = s.assets.filter(a => a.contractId === c.id);
  const principal = items.reduce((n, i) => n + i.principalCents, 0), goods = assets.reduce((n, a) => n + a.valueCents, 0), cash = items.reduce((n, i) => n + i.amountCents, 0), received = items.reduce((n, i) => n + paid(s, i.id), 0);
  return { principal, goods, cash, received, remaining: cash - received, correction: cash - principal, difference: c.totalCents - principal - goods, goodsReceived: assets.filter(a => a.receivedDate).reduce((n, a) => n + a.valueCents, 0) };
}
function contractData(p) {
  const custom = p.custom || []; assert(Array.isArray(custom) && custom.length <= 30, 'Até 30 campos personalizados.');
  return { number: text(p.number, 'Número do contrato', 100), clientName: text(p.clientName, 'Cliente', 200), document: opt(p.document, 60), phone: opt(p.phone, 100), email: opt(p.email, 254), clientAddress: opt(p.clientAddress, 1000), coBuyers: opt(p.coBuyers), propertyMode: enumValue(p.propertyMode, ['project', 'standalone'], 'Vínculo do imóvel'), project: p.propertyMode === 'project' ? text(p.project, 'Empreendimento', 200) : '', propertyType: text(p.propertyType, 'Tipo de imóvel', 100), unit: text(p.unit, 'Unidade / identificação', 200), propertyAddress: text(p.propertyAddress, 'Endereço do imóvel', 1000), registration: opt(p.registration, 200), signedDate: date(p.signedDate, 'Data do contrato'), totalCents: integer(p.totalCents, 'Valor contratado', 1, moneyLimit), conditions: opt(p.conditions, 10000), notes: opt(p.notes, 10000), custom: custom.map(f => ({ label: text(f.label, 'Nome do campo', 100), value: text(f.value, 'Conteúdo do campo', 2000) })) };
}
function find(s, collection, id) { const v = s[collection].find(x => x.id === id); assert(v, 'Registro não encontrado nesta empresa.', 404); return v; }
const canEdit = actor => assert(['vini', 'cobranca'].includes(actor.role), 'Perfil somente para consulta.', 403);
function draft(s, id) { const c = find(s, 'contracts', id); assert(c.status === 'draft', 'O fluxo está ativo. Reabra para edição antes de alterar condições.'); return c; }
function receive(s, actor, p, next, now, source = 'manual') {
  const i = find(s, 'installments', p.installmentId), c = find(s, 'contracts', i.contractId); assert(c.status === 'active', 'Ative o contrato antes de registrar recebimentos.');
  assert(i.reviewed, 'Confira o valor da parcela antes da baixa.');
  const amount = integer(p.amountCents, 'Valor recebido', 1, moneyLimit); assert(amount <= balance(s, i), 'Pagamento excede o saldo da parcela. Confira juros, descontos ou a vinculação.');
  const paidDate = date(p.paidDate, 'Data do pagamento'); assert(paidDate <= now, 'Não é possível dar baixa em pagamento futuro.');
  const reference = text(p.reference, 'Comprovante / identificador do pagamento', 250);
  assert(!s.receipts.some(r => r.reference === reference && r.source === source), 'Identificador já utilizado, inclusive em baixa estornada.');
  const r = { id: next('rec'), installmentId: i.id, amountCents: amount, paidDate, method: text(p.method, 'Forma de recebimento', 100), reference, source, note: opt(p.note), actorId: actor.id, actorName: actor.name, createdAt: new Date().toISOString() }; s.receipts.push(r); return r;
}
export function billingDispatch(original, actor, command, now = today()) {
  assert(actor?.tenantId === original.tenantId && BILLING_ROLES.includes(actor.role), 'Acesso negado.', 403); canEdit(actor);
  const s = structuredClone(original), p = command.payload || {}, next = prefix => `${prefix}-${++s.seq}`; let result;
  s.renegotiations ||= [];
  switch (command.type) {
    case 'contract.save': {
      const data = contractData(p); if(p.registryRef)data.registryRef=structuredClone(p.registryRef); data.business = enumValue(p.business || 'sale', ['sale', 'rental', 'other'], 'Finalidade'); assert(!s.contracts.some(c => c.number === data.number && c.id !== p.id), 'Número de contrato já cadastrado.');
      if (p.id) { const c = draft(s, p.id); Object.assign(c, data); result = c; }
      else { result = { id: next('ctr'), status: 'draft', ...data }; s.contracts.push(result); } break;
    }
    case 'contract.activate': {
      const c = draft(s, p.id); assert(s.installments.some(i => i.contractId === c.id) || s.assets.some(a => a.contractId === c.id), 'Inclua parcelas ou bens.');
      assert(contractTotals(s, c).difference === 0, 'Parcelas originais + bens devem fechar com o valor contratado.');
      c.status = 'active'; result = c; break;
    }
    case 'contract.reopen': {
      const c = find(s, 'contracts', p.id); assert(c.status === 'active', 'Contrato não está ativo.');
      assert(!s.renegotiations.some(a => a.contractId === c.id), 'Contrato com renegociação registrada deve preservar as parcelas de origem.');
      assert(!s.receipts.some(r => s.installments.some(i => i.id === r.installmentId && i.contractId === c.id)) && !s.assets.some(a => a.contractId === c.id && a.receivedDate), 'Contrato com histórico de recebimento não pode ser reescrito.');
      text(p.reason, 'Motivo da reabertura'); c.status = 'draft'; result = c; break;
    }
    case 'series.add': {
      const c = draft(s, p.contractId), count = integer(p.count, 'Número de parcelas', 1, 600), interval = integer(p.interval, 'Intervalo em meses', 1, 120);
      assert(s.installments.filter(i => i.contractId === c.id).length + count <= 1200, 'Limite de 1.200 parcelas por contrato.');
      const principal = integer(p.principalCents, 'Valor original de cada parcela', 1, moneyLimit), first = date(p.firstDate, 'Primeiro vencimento');
      const kind = enumValue(p.kind, Object.keys(KINDS), 'Tipo de fluxo'), label = text(p.label, 'Nome da série', 150), rule = correctionRule(p.rule), groupId = next('grp'); result = [];
      for (let n = 0; n < count; n++) {
        const dueDate = addMonths(first, n * interval), calc = corrected(principal, dueDate, rule);
        const i = { id: next('par'), contractId: c.id, groupId, label: `${label} ${n + 1}/${count}`, kind, principalCents: principal, dueDate, rule, ...calc, reviewed: rule.mode !== 'manual', note: opt(p.note), bankCode: '', account: '', ourNumber: '', providerId: '' };
        s.installments.push(i); result.push(i.id);
      } break;
    }
    case 'installment.edit': {
      const i = find(s, 'installments', p.id); draft(s, i.contractId); assert(!i.ourNumber, 'Desvincule o boleto e confira a alteração no banco antes de editar a parcela.'); const rule = correctionRule(p.rule), principalCents = integer(p.principalCents, 'Valor original', 1, moneyLimit), dueDate = date(p.dueDate);
      Object.assign(i, { label: text(p.label, 'Descrição', 200), principalCents, dueDate, rule, ...corrected(principalCents, dueDate, rule), reviewed: rule.mode !== 'manual', note: opt(p.note) }); result = i; break;
    }
    case 'installment.remove': { const i = find(s, 'installments', p.id); draft(s, i.contractId); assert(!i.ourNumber, 'Desvincule o boleto antes de remover a parcela.'); s.installments = s.installments.filter(x => x.id !== i.id); result = { id: i.id }; break; }
    case 'installment.value': {
      const i = find(s, 'installments', p.id); assert(!s.receipts.some(r => r.installmentId === i.id), 'Parcela com histórico de pagamento não pode ter o valor sobrescrito.');
      assert(!i.ourNumber, 'Parcela com boleto vinculado exige primeiro revisar a cobrança no banco e desvincular o identificador.');
      i.amountCents = integer(p.amountCents, 'Valor conferido', 1, moneyLimit); i.reviewed = true; i.valueNote = text(p.reason, 'Memória de cálculo / motivo', 4000); result = i; break;
    }
    case 'bank.link': {
      const i = find(s, 'installments', p.id); assert(!s.receipts.some(r => r.installmentId === i.id), 'Boleto com histórico de recebimento não pode ser desvinculado.');
      const bankCode = text(p.bankCode, 'Código do banco', 3), account = text(p.account, 'Conta / convênio', 80), ourNumber = text(p.ourNumber, 'Nosso número (exatamente como no retorno)', 100);
      assert(/^\d{3}$/.test(bankCode), 'Código do banco deve ter três dígitos.');
      assert(!s.installments.some(x => x.id !== i.id && x.bankCode === bankCode && x.account === account && x.ourNumber === ourNumber), 'Esse boleto já está vinculado a outra parcela.');
      Object.assign(i, { bankCode, account, ourNumber }); result = i; break;
    }
    case 'bank.unlink': { const i = find(s, 'installments', p.id); assert(!s.receipts.some(r => r.installmentId === i.id), 'Há histórico de recebimento.'); text(p.reason, 'Motivo'); Object.assign(i, { bankCode: '', account: '', ourNumber: '' }); result = i; break; }
    case 'asset.save': {
      draft(s, p.contractId); const data = { contractId: p.contractId, kind: enumValue(p.kind, Object.keys(ASSET_KINDS), 'Tipo de bem'), description: text(p.description, 'Descrição do bem', 4000), identification: text(p.identification, 'Placa / matrícula / identificação', 300), owner: text(p.owner, 'Proprietário / cedente', 200), valueCents: integer(p.valueCents, 'Valor aceito no negócio', 1, moneyLimit), expectedDate: date(p.expectedDate, 'Entrega prevista'), conditions: text(p.conditions, 'Condições de entrega / transferência', 5000), pending: opt(p.pending, 4000) };
      if (p.id) { result = find(s, 'assets', p.id); assert(result.contractId === p.contractId, 'Bem não pertence ao contrato.'); Object.assign(result, data); }
      else { result = { id: next('bem'), ...data }; s.assets.push(result); } break;
    }
    case 'asset.remove': { const a = find(s, 'assets', p.id); draft(s, a.contractId); s.assets = s.assets.filter(x => x.id !== a.id); result = { id: a.id }; break; }
    case 'asset.receive': {
      const a = find(s, 'assets', p.id); assert(find(s, 'contracts', a.contractId).status === 'active' && !a.receivedDate, 'Bem não está pendente em contrato ativo.');
      a.receivedDate = date(p.receivedDate, 'Data da entrega'); assert(a.receivedDate <= now, 'Entrega não pode ter data futura.'); a.evidence = text(p.evidence, 'Comprovante / registro da transferência', 2000); result = a; break;
    }
    case 'agreement.save': {
      const c = find(s, 'contracts', p.contractId); assert(c.status === 'active', 'Ative o contrato antes de registrar renegociação.');
      const existing = p.id ? find(s, 'renegotiations', p.id) : null;
      if (existing) { assert(existing.contractId === c.id, 'Acordo não pertence ao contrato.'); text(p.reason, 'Motivo da atualização', 4000); }
      const number = text(p.number, 'Número do acordo', 100), status = enumValue(p.status, Object.keys(AGREEMENT_STATUS), 'Situação do acordo');
      assert(!s.renegotiations.some(a => a.id !== p.id && a.number === number), 'Número do acordo já cadastrado.');
      assert(Array.isArray(p.installmentIds) && p.installmentIds.length > 0 && p.installmentIds.length <= 1200, 'Selecione as parcelas abrangidas.');
      const installmentIds = [...new Set(p.installmentIds)];
      for (const id of installmentIds) {
        const i = find(s, 'installments', id); assert(i.contractId === c.id, 'Parcela não pertence ao contrato.');
        if (!existing?.installmentIds.includes(id)) assert(balance(s, i) > 0, 'Selecione parcelas com saldo em aberto.');
      }
      if (status === 'signed') assert(!s.renegotiations.some(a => a.id !== p.id && a.status === 'signed' && a.installmentIds.some(id => installmentIds.includes(id))), 'Há acordo assinado para uma das parcelas. Encerre ou cancele o anterior antes de substituí-lo.');
      const signedDate = p.signedDate ? date(p.signedDate, 'Data da assinatura') : '';
      if (status === 'signed' || status === 'fulfilled') assert(signedDate && signedDate <= now, 'Informe uma data de assinatura até hoje.');
      if (signedDate) assert(signedDate <= now, 'Assinatura não pode ter data futura.');
      const documentUrl = opt(p.documentUrl, 2000);
      if (documentUrl) { let url; try { url = new URL(documentUrl); } catch {} assert(url?.protocol === 'https:' && !url.username && !url.password, 'Use um link HTTPS sem credenciais para o documento.'); }
      const data = { contractId: c.id, number, status, installmentIds, signedDate, amountCents: integer(p.amountCents, 'Valor do acordo', 1, moneyLimit), nextDueDate: p.nextDueDate ? date(p.nextDueDate, 'Próximo vencimento do acordo') : '', conditions: text(p.conditions, 'Condições do acordo', 10000), documentUrl, notes: opt(p.notes, 5000), updatedAt: new Date().toISOString(), updatedBy: actor.name };
      if (existing) { Object.assign(existing, data); result = existing; }
      else { result = { id: next('aco'), createdAt: new Date().toISOString(), ...data }; s.renegotiations.push(result); }
      break;
    }
    case 'receipt.add': result = receive(s, actor, p, next, now); break;
    case 'receipt.reverse': { const r = find(s, 'receipts', p.id); assert(!r.reversedAt, 'Baixa já estornada.'); r.reversedAt = new Date().toISOString(); r.reversedBy = actor.name; r.reverseReason = text(p.reason, 'Motivo do estorno', 4000); result = r; break; }
    case 'return.apply': {
      assert(Array.isArray(p.rows) && p.rows.length && p.rows.length <= 1000, 'Selecione de 1 a 1.000 pagamentos.');
      const filename = text(p.filename, 'Nome do arquivo', 250), rows = p.rows; const batch = { id: next('lot'), filename, actorName: actor.name, createdAt: new Date().toISOString(), count: rows.length, receiptIds: [] };
      const seen = new Set();
      for (const row of rows) {
        const match = matchReturn(s, row, now); assert(match.ready, `Retorno ${row.reference || '?'}: ${match.issue}`);
        const key = `${row.bankCode}|${row.account}|${row.reference}`; assert(!seen.has(key), 'Pagamento repetido dentro do arquivo.'); seen.add(key);
        const receipt = receive(s, actor, { installmentId: match.item.id, amountCents: row.amountCents, paidDate: row.paidDate, method: 'Boleto · retorno importado', reference: key, note: `Arquivo ${filename}; nosso número ${row.ourNumber}` }, next, now, 'bank-return');
        batch.receiptIds.push(receipt.id);
      } s.batches.push(batch); result = batch; break;
    }
    default: assert(false, 'Operação de cobrança desconhecida.', 404);
  }
  const previous = result?.id ? ['contracts','installments','assets','receipts','renegotiations'].flatMap(key=>original[key] || []).find(x=>x.id===result.id) : null;
  s.revision++; s.audit.push({ id: next('evt'), type: command.type, entityId: result?.id || p.contractId || p.id || '', actorName: actor.name, at: new Date().toISOString(), reason: opt(p.reason), before: previous ? structuredClone(previous) : null, after: result?.id ? structuredClone(result) : null, detail: command.type === 'installment.value' ? `${result.amountCents} centavos · ${result.valueNote}` : '' });
  return { state: s, result };
}
export function matchReturn(s, row, now = today()) {
  const issue = message => ({ ready: false, issue: message });
  if (row.error) return issue(row.error);
  if (!row.reference || !row.bankCode || !row.account || !row.ourNumber) return issue('Falta identificação do banco, conta, boleto ou pagamento.');
  if (row.status !== 'liquidado') return issue('Ocorrência não é liquidação. Não dará baixa.');
  try { date(row.paidDate); integer(row.amountCents, 'Valor recebido', 1, moneyLimit); } catch (e) { return issue(e.message); }
  if (row.paidDate > now) return issue('Data de pagamento futura.');
  const key = `${row.bankCode}|${row.account}|${row.reference}`;
  if (s.receipts.some(r => r.source === 'bank-return' && r.reference === key)) return issue('Retorno já processado (inclusive se estornado).');
  const items = s.installments.filter(i => i.bankCode === row.bankCode && i.account === row.account && i.ourNumber === row.ourNumber);
  if (items.length !== 1) return issue('Boleto sem vínculo único. Confira banco, conta e nosso número.');
  const item = items[0], c = s.contracts.find(c => c.id === item.contractId);
  if (c.status !== 'active') return issue('Contrato ainda em rascunho.');
  if (!item.reviewed) return issue('Valor da parcela aguarda conferência.');
  if (row.amountCents !== balance(s, item)) return issue('Valor recebido diverge do saldo. Confira para registrar manualmente.');
  return { ready: true, item, contract: c, issue: '' };
}
