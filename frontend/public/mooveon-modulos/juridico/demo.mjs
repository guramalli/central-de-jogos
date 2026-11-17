import { emptyLegal, legalDispatch } from './domain.mjs';
import { today } from '../orcamentos/domain.mjs';
export function demoLegal(tenantId) {
  let s = emptyLegal(tenantId, tenantId === 'demo-cdc' ? 'Construtora Exemplo · demonstração' : 'Empresa Horizonte · demonstração');
  const run = (type, payload) => { const r = legalDispatch(s, { tenantId, id: 'demo-juridico', role: 'juridico', name: 'Responsável jurídico' }, { type, payload }); s = r.state; return r.result; };
  if (tenantId !== 'demo-cdc') return s;
  const c = run('case.create', { name: 'Cliente Exemplo · cobrança contratual', number: '0000001-00.2026.8.26.0000', parentId: '', area: 'civil', court: 'TJSP · cadastro fictício', property: 'Residencial Exemplo · unidade 101', className: 'Ação de cobrança', owner: 'Responsável jurídico', priority: 'high', status: 'active', notes: 'Dados inteiramente fictícios. Nenhum processo real consultado.', officialUrl: 'https://www.tjsp.jus.br/' });
  run('case.create', { name: 'Contrato de prestação de serviços', number: '', area: 'contracts', court: 'Interno', property: 'Canteiro principal', className: 'Revisão contratual', owner: 'Responsável jurídico', priority: 'normal', status: 'active', notes: 'Exemplo de demanda consultiva sem processo judicial.' });
  const d = new Date(`${today()}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 3);
  const task = run('task.create', { title: 'Revisar documentos da cobrança', caseId: c.id, owner: 'Responsável jurídico', priority: 'high', dueDate: d.toISOString().slice(0, 10), source: 'Prazo interno fictício definido pela equipe', kind: 'task', notes: 'Conferir contrato e demonstrativo.' });
  run('task.confirm', { id: task.id, revision: task.revision, basis: 'Exemplo de revisão humana de uma tarefa interna, sem contagem processual.' });
  run('task.create', { title: 'Conferir publicação recebida', caseId: c.id, owner: 'Responsável jurídico', priority: 'urgent', dueDate: today(), source: 'Exemplo de publicação ainda não validada', kind: 'deadline' });
  run('inbox.record', { source: 'E-mail · inclusão manual', externalId: 'exemplo-email-001', body: 'Exemplo fictício: documentos relacionados ao processo 0000001-00.2026.8.26.0000. Conferir no portal oficial antes de registrar prazos.', publishedDate: today() });
  return s;
}
