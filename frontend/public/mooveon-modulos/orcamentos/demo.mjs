import { emptyState, dispatch, today } from './domain.mjs';
export function demoState(tenantId) {
  let s = emptyState(tenantId, tenantId === 'demo-cdc' ? 'Construtora Exemplo · demonstração' : 'Empresa Horizonte · demonstração');
  const datePlus = days => { const d = new Date(`${today()}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };
  const run = (role, type, payload) => { const r = dispatch(s, { tenantId, id: `demo-${role}`, name: role, role }, { type, payload }); s = r.state; return r.result; };
  const w = run('vini', 'work.create', { name: 'Residencial Exemplo', address: 'Endereço fictício · Praia Grande/SP' });
  if (tenantId !== 'demo-cdc') return s;
  const a = run('secretaria', 'supplier.create', { name: 'Materiais Atlântico (fictício)', phone: '5513000000001', cnpj: '', categories: 'Alvenaria e cimento', regions: 'Baixada Santista' });
  const b = run('secretaria', 'supplier.create', { name: 'Depósito Horizonte (fictício)', phone: '5513000000002', cnpj: '', categories: 'Materiais de construção', regions: 'Litoral de SP' });
  const r = run('rogerio', 'request.create', { title: 'Alvenaria · reposição do pavimento', workId: w.id, priority: 'high', deadline: datePlus(7), baselineCents: 420000, baselineEvidence: 'Estimativa interna fictícia REF-001, mesmo escopo e frete', supplierIds: [a.id, b.id], items: [{ name: 'Bloco cerâmico', qtyMillis: 1000000, unit: 'un', specification: '14 × 19 × 29 cm, vedação' }, { name: 'Cimento CP II', qtyMillis: 20000, unit: 'sc', specification: 'Sacos de 50 kg' }] });
  const q = run('secretaria', 'quote.create', { requestId: r.id, supplierId: a.id, lines: r.items.map((i, n) => ({ itemId: i.id, description: i.name + ' conforme especificação', qtyMillis: i.qtyMillis, unitCents: n ? 3200 : 290, available: true })), freightCents: 18000, deliveryDays: 3, payment: '28 dias', validUntil: datePlus(10), source: 'Proposta fictícia ATL-001' });
  run('stephanie', 'quote.review', { id: q.id, itemIds: r.items.map(i => i.id), note: 'Exemplo de conferência técnica: dimensões, classe e quantidade equivalentes.' });
  run('secretaria', 'quote.create', { requestId: r.id, supplierId: b.id, lines: [{ itemId: r.items[0].id, description: 'Bloco 14 × 19 × 29', qtyMillis: 1000000, unitCents: 275, available: true }], freightCents: null, deliveryDays: null, payment: '', validUntil: datePlus(-1), source: 'Resposta parcial fictícia HOR-001' });
  run('secretaria', 'message.record', { supplierId: a.id, externalId: 'demo-001', body: `Bom dia! Segue a proposta da ${r.code}. Entrega em três dias, com frete incluso no total indicado.` });
  return s;
}
