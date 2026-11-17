import { emptyBilling, billingDispatch, addMonths } from './domain.mjs';
import { today } from '../orcamentos/domain.mjs';
export function demoBilling(tenantId = 'demo-cdc') {
  let s = emptyBilling(tenantId, tenantId === 'demo-cdc' ? 'Construtora Exemplo' : 'Empresa Horizonte');
  const actor = { tenantId, role: 'cobranca', id: 'demo-cobranca', name: 'Equipe de cobrança' };
  const run = (type, payload) => { const r = billingDispatch(s, actor, { type, payload }); s = r.state; return r.result; };
  const month = today().slice(0, 7), first = `${month}-05`;
  const c = run('contract.save', { number: 'VEN-2026-001', clientName: 'Marina Almeida · exemplo fictício', document: 'Cadastro de demonstração', phone: '', email: '', propertyMode: 'project', project: 'Residencial Aurora', propertyType: 'Apartamento', unit: 'Torre A · unidade 402', propertyAddress: 'Rua Exemplo, 100 · endereço fictício', signedDate: `${month}-01`, totalCents: 85000000, conditions: 'Entrada mista: dinheiro e veículo. Mensais com taxa de simulação. Intermediárias fixas, sem correção. Valores e clientes inteiramente fictícios.', custom: [{ label: 'Entrega das chaves', value: 'Condicionada à conferência das obrigações contratuais' }] });
  run('series.add', { contractId: c.id, label: 'Sinal', kind: 'entry', count: 1, interval: 1, firstDate: first, principalCents: 7000000, rule: { mode: 'fixed' } });
  run('series.add', { contractId: c.id, label: 'Mensal', kind: 'regular', count: 24, interval: 1, firstDate: addMonths(first, 1), principalCents: 2000000, rule: { mode: 'compound', rate: 5000, period: 'monthly', baseDate: first, label: 'Taxa contratual ilustrativa', note: '0,5% por mês; não representa índice oficial.' } });
  run('series.add', { contractId: c.id, label: 'Intermediária fixa', kind: 'intermediate', count: 2, interval: 12, firstDate: addMonths(first, 6), principalCents: 11000000, rule: { mode: 'fixed' } });
  run('asset.save', { contractId: c.id, kind: 'car', description: 'Veículo de exemplo · modelo, ano, cor e estado de conservação devem constar na ficha.', identification: 'Placa fictícia DEM-0001', owner: 'Cliente de exemplo', valueCents: 8000000, expectedDate: addMonths(first, 1), conditions: 'Entrega com documentação conferida e transferência registrada.', pending: 'Conferir vistoria, gravames e documentação.' });
  run('contract.activate', { id: c.id });
  const rent = run('contract.save', { number: 'LOC-2026-002', business: 'rental', clientName: 'Rafael Costa · exemplo fictício', propertyMode: 'standalone', propertyType: 'Casa', unit: 'Casa 12', propertyAddress: 'Avenida Modelo, 200 · endereço fictício', signedDate: `${month}-01`, totalCents: 3600000, conditions: '12 aluguéis de R$ 3.000. Encargos e particularidades devem ser descritos conforme contrato.', custom: [{ label: 'Finalidade', value: 'Locação residencial' }, { label: 'Garantia', value: 'Descrever a garantia acordada' }] });
  const ids = run('series.add', { contractId: rent.id, label: 'Aluguel', kind: 'regular', count: 12, interval: 1, firstDate: first, principalCents: 300000, rule: { mode: 'fixed' } });
  run('contract.activate', { id: rent.id });
  run('bank.link', { id: ids[0], bankCode: '237', account: 'CONTA-DEMO', ourNumber: '00000000001' });
  return s;
}
