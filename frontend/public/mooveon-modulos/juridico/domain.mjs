import { assert, text, date, integer, today, DomainError } from '../orcamentos/domain.mjs';
import { upgradeLegal, featureDispatch, customValues } from './features.mjs';
export const AREAS = { civil: 'Processos cíveis', labor: 'Trabalhista', tax: 'Execução fiscal', legal_admin: 'Administrativo jurídico', administrative: 'Administrativo', contracts: 'Contratos e consultivo' };
export const LEGAL_ROLES = ['vini', 'caru', 'juridico', 'solicitante'];
export const canEdit = (role,s) => (s?.settings?.editorRoles||['vini', 'juridico']).includes(role);
export const CASE_STATUS = { active: 'Em andamento', suspended: 'Suspenso', closed: 'Encerrado' };
export function emptyLegal(id, name) { return { version: 1, tenantId: id, name, revision: 0, seq: 0, cases: [], tasks: [], inbox: [], movements: [], audit: [] }; }
export function processNumber(value) { const s = String(value || '').replace(/\D/g, ''); assert(s.length === 20, 'Informe os 20 dígitos do número CNJ.'); return `${s.slice(0, 7)}-${s.slice(7, 9)}.${s.slice(9, 13)}.${s.slice(13, 14)}.${s.slice(14, 16)}.${s.slice(16)}`; }
export function safeUrl(value) { if (!value) return ''; let u; try { u = new URL(value); } catch { throw new DomainError('URL inválida.'); } assert(u.protocol === 'https:' && !u.username && !u.password, 'Use um link HTTPS sem credenciais.'); return u.href; }
export function deadlineState(task, now = today()) { if (task.status === 'done') return 'Concluído'; if (task.status === 'cancelled') return 'Cancelado'; if (task.status === 'pending_review') return 'Conferir prazo'; if (task.dueDate < now) return 'Atrasado'; if (task.dueDate === now) return 'Hoje'; const days = (Date.parse(task.dueDate) - Date.parse(now)) / 86400000; return days <= 7 ? 'Próximos 7 dias' : 'Programado'; }
export function legalDispatch(original, actor, command) {
  assert(actor?.tenantId === original.tenantId && LEGAL_ROLES.includes(actor.role), 'Acesso negado ao Jurídico.', 403);
  const s = upgradeLegal(original), p = command.payload || {}, type = command.type, at = new Date().toISOString();
  const feature = featureDispatch(s, actor, type, p, at);
  if (feature) {
    const snapshot=structuredClone(feature); if(snapshot.file) snapshot.file={name:snapshot.file.name,mime:snapshot.file.mime,size:snapshot.file.size};
    s.audit.push({id:`ev-${++s.seq}`,at,actorId:actor.id,actorName:actor.name,role:actor.role,action:type,entityId:feature.id,details:{snapshot}});s.revision++;return {state:s,result:feature};
  }
  assert(canEdit(actor.role,s), 'Seu perfil tem acesso somente à leitura do Jurídico.', 403);
  const id = prefix => `${prefix}-${++s.seq}`;
  const get = (list, key) => { const x = s[list].find(x => x.id === key); assert(x, 'Registro não encontrado nesta empresa.', 404); return x; };
  const caseId = value => value ? get('cases', value).id : null;
  const priority = value => { assert(['normal', 'high', 'urgent'].includes(value), 'Prioridade inválida.'); return value; };
  const taskData = () => { const assignee=p.assigneeId?s.members.find(m=>m.id===p.assigneeId&&m.role!=='solicitante'):actor;assert(assignee,'Responsável não pertence à equipe ativa desta empresa.'); return { assigneeId:assignee.id, title: text(p.title, 'Assunto', 200), caseId: caseId(p.caseId), owner: assignee.name, priority: priority(p.priority), dueDate: date(p.dueDate, 'Prazo proposto'), time: p.time || '', notes: String(p.notes || '').slice(0, 5000), source: text(p.source, 'Fonte do prazo/tarefa', 2000), kind: ['deadline', 'hearing', 'task'].includes(p.kind) ? p.kind : 'task' }; };
  let result, details = {};
  switch (type) {
    case 'case.create': case 'case.update': {
      assert(Object.hasOwn(AREAS, p.area), 'Área inválida.'); const number = p.number ? processNumber(p.number) : '';
      assert(number || ['administrative', 'legal_admin', 'contracts'].includes(p.area), 'Esta área exige número do processo.');
      assert(!number || !s.cases.some(c => c.number === number && c.id !== p.id), 'Processo já cadastrado.');
      assert(Object.hasOwn(CASE_STATUS, p.status), 'Situação inválida.');
      const parentId = caseId(p.parentId); assert(!p.id || parentId !== p.id, 'Processo não pode ser seu próprio apenso.');
      let parent = parentId; const visited = new Set([p.id]); while (parent) { assert(!visited.has(parent), 'Vínculo circular entre processos.'); visited.add(parent); parent = get('cases', parent).parentId; }
      const data = { name: text(p.name, 'Nome/parte ou assunto', 200), number, parentId, area: p.area, court: text(p.court, 'Tribunal/órgão', 150), property: String(p.property || '').slice(0, 250), className: text(p.className, 'Classe/assunto', 200), owner: text(p.owner, 'Responsável', 150), priority: priority(p.priority), status: p.status, notes: String(p.notes || '').slice(0, 10000), officialUrl: safeUrl(p.officialUrl) };
      if (type === 'case.update') { result = get('cases', p.id); details.before = structuredClone(result); Object.assign(result, data, { updatedAt: at }); }
      else { result = { id: id('proc'), ...data, createdAt: at }; s.cases.push(result); }
      if(p.registryRef)result.registryRef=structuredClone(p.registryRef); result.custom=customValues(s,'case',p.custom||result.custom); break;
    }
    case 'task.create': result = { id: id('prazo'), ...taskData(), backupId:null, supervisorId:null, status: 'pending_review', revision: 1, createdAt: at, createdBy: actor.id, review: null }; assert(!result.time || /^([01]\d|2[0-3]):[0-5]\d$/.test(result.time), 'Horário inválido.'); s.tasks.push(result); break;
    case 'task.revise': {
      result = get('tasks', p.id); assert(!['done', 'cancelled'].includes(result.status), 'Tarefa encerrada.');
      details.before = structuredClone(result); result.dueDate = date(p.dueDate, 'Prazo'); result.source = text(p.source, 'Fonte/justificativa da alteração', 2000); result.status = 'pending_review'; result.review = null; result.acknowledgedAt=null;result.acknowledgedBy=null;result.escalatedTo=null;result.revision++; break;
    }
    case 'task.confirm': {
      assert(actor.role === 'juridico', 'A confirmação do prazo cabe ao perfil Jurídico.', 403); result = get('tasks', p.id);
      assert(result.status === 'pending_review' && p.revision === result.revision, 'Prazo alterado ou já conferido. Atualize antes de confirmar.', 409);
      result.review = { by: actor.id, at, dueDate: result.dueDate, revision: result.revision, basis: text(p.basis, 'Critério e fonte da conferência', 2000) }; result.status = 'open'; break;
    }
    case 'task.complete': result = get('tasks', p.id); assert(result.status === 'open', 'Confira o prazo antes de concluir.'); result.status = 'done'; result.completedAt = at; result.evidence = text(p.evidence, 'Comprovante/resultado', 2000); break;
    case 'task.cancel': result = get('tasks', p.id); assert(!['done', 'cancelled'].includes(result.status), 'Tarefa encerrada.'); result.status = 'cancelled'; result.cancelReason = text(p.reason, 'Motivo do cancelamento', 1000); break;
    case 'inbox.record': {
      const externalId = text(p.externalId, 'Identificador da origem', 250), source = text(p.source, 'Origem', 250), body = text(p.body, 'Conteúdo original', 30000);
      const existing = s.inbox.find(m => m.source === source && m.externalId === externalId);
      if (existing) { assert(existing.body === body, 'Identificador existente com conteúdo diferente.', 409); return { state: original, result: existing, duplicate: true }; }
      const numberMatches = body.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/g) || [];
      const candidates = s.cases.filter(c => c.number && numberMatches.includes(c.number)).map(c => c.id);
      result = { id: id('entrada'), externalId, source, sourceUrl: safeUrl(p.sourceUrl), body, receivedAt: at, publishedDate: p.publishedDate ? date(p.publishedDate, 'Publicação') : null, candidates, caseId: null, status: 'pending_review' }; s.inbox.push(result); break;
    }
    case 'inbox.link': result = get('inbox', p.id); assert(result.status === 'pending_review', 'Entrada já conferida.'); result.caseId = get('cases', p.caseId).id; result.status = 'linked'; result.confirmedBy = actor.id; s.movements.push({ id: id('mov'), caseId: result.caseId, inboxId: result.id, body: result.body, source: result.source, sourceUrl: result.sourceUrl, publishedDate: result.publishedDate, at, reviewedBy: actor.id }); break;
    case 'integration.preferences': assert(['outlook', 'gmail', 'imap', 'undecided'].includes(p.emailProvider), 'Provedor inválido.'); s.integrationPreferences = { emailProvider: p.emailProvider, courts: String(p.courts || '').slice(0, 2000), status: 'not_configured', updatedBy: actor.id, at }; result = { id: s.tenantId, ...s.integrationPreferences }; break;
    default: throw new DomainError('Operação jurídica desconhecida.', 400);
  }
  s.audit.push({ id: id('ev'), at, actorId: actor.id, actorName: actor.name, role: actor.role, action: type, entityId: result.id, details: { ...details, snapshot: structuredClone(result) } }); s.revision++; return { state: s, result };
}
const icsText = value => String(value).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/[,;]/g, x => `\\${x}`);
export function calendar(s, now = new Date()) {
  // All-day dates avoid implicit UTC/time-zone shifts; displayed time stays in description.
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Moove ON//Juridico//PT-BR', 'CALSCALE:GREGORIAN'];
  for (const t of s.tasks.filter(t => t.status === 'open')) lines.push('BEGIN:VEVENT', `UID:${s.tenantId}-${t.id}@mooveon.local`, `DTSTAMP:${now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z/, 'Z')}`, `SEQUENCE:${t.revision}`, `DTSTART;VALUE=DATE:${t.dueDate.replaceAll('-', '')}`, `SUMMARY:${icsText(t.title)}`, `DESCRIPTION:${icsText(`Responsável: ${t.owner}. Horário local: ${t.time || 'não informado'} (America/Sao_Paulo). ${t.source}`)}`, 'END:VEVENT');
  lines.push('END:VCALENDAR');
  // RFC5545 folding at <=75 UTF-8 octets, without splitting code points.
  return lines.map(line => { let out = '', part = ''; for (const char of line) { if (new TextEncoder().encode(part + char).length > 74) { out += part + '\r\n'; part = ' '; } part += char; } return out + part; }).join('\r\n') + '\r\n';
}
