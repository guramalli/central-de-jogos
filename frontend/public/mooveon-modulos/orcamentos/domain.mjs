// Shared rules. Production always executes these on the server with its session actor.
export const ROLES = ['vini', 'caru', 'rogerio', 'stephanie', 'secretaria', 'gabriela'];
export const NAMES = { vini: 'Vini', caru: 'Caru', rogerio: 'Rogério', stephanie: 'Stephanie', secretaria: 'Secretária', gabriela: 'Gabriela' };
const RIGHTS = {
  works: ['vini', 'caru'], suppliers: ['vini', 'caru', 'secretaria'], requests: ROLES,
  quotes: ['vini', 'caru', 'secretaria'], technical: ['vini', 'rogerio', 'stephanie'],
  messages: ['secretaria'], purchases: ['vini', 'caru', 'secretaria'], approve: ['vini', 'caru'], policy: ['vini'],
};
export class DomainError extends Error { constructor(message, status = 422) { super(message); this.status = status; } }
export function assert(ok, message, status) { if (!ok) throw new DomainError(message, status); }
export const can = (role, right) => RIGHTS[right]?.includes(role) || false;
export function text(value, label, max = 2000) { assert(typeof value === 'string' && value.trim() && value.length <= max, `${label}: informe um texto de até ${max} caracteres.`); return value.trim(); }
export function integer(value, label, min = 0, max = 100000000000) { assert(Number.isSafeInteger(value) && value >= min && value <= max, `${label}: valor inválido.`); return value; }
export function decimal(value, digits = 2) {
  const s = String(value).trim().replace(',', '.');
  assert(new RegExp(`^\\d+(?:\\.\\d{1,${digits}})?$`).test(s), `Use um número positivo com até ${digits} casas, sem separador de milhar.`);
  const [a, b = ''] = s.split('.'); return integer(Number(a) * 10 ** digits + Number(b.padEnd(digits, '0')), 'Número');
}
export function date(value, label = 'Data') { assert(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value, `${label} inválida.`); return value; }
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const money = n => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n / 100);
export const quantity = n => String(n / 1000).replace('.', ',');
export function lineTotal(cents, millis) { return integer(Number((BigInt(cents) * BigInt(millis) + 500n) / 1000n), 'Total'); }
export function quoteTotal(q) { return integer(q.lines.reduce((n, l) => n + lineTotal(l.unitCents, l.qtyMillis), 0) + (q.freightCents ?? 0), 'Total entregue'); }
export function target(total, basisPoints) { integer(total, 'Total'); integer(basisPoints, 'Desconto', 0, 5000); return Number((BigInt(total) * BigInt(10000 - basisPoints) + 5000n) / 10000n); }
export function emptyState(id, name) { return { version: 1, tenantId: id, name, revision: 0, seq: 0, policy: { caruLimitCents: 500000, discountBps: 500, separateApprover: true }, works: [], suppliers: [], requests: [], quotes: [], messages: [], drafts: [], purchases: [], audit: [] }; }
const get = (s, list, id) => { const x = s[list].find(x => x.id === id); assert(x, 'Registro não encontrado nesta empresa.', 404); return x; };
export function latestQuotes(s, requestId) { return s.quotes.filter(q => q.requestId === requestId && !s.quotes.some(n => n.previousId === q.id)); }
export function quoteIssues(s, q, now = today()) {
  const r = get(s, 'requests', q.requestId), issues = [];
  if (!latestQuotes(s, r.id).some(x => x.id === q.id)) issues.push('Revisão substituída');
  if (!q.validUntil || q.validUntil < now) issues.push('Validade vencida ou pendente');
  if (q.freightCents === null) issues.push('Frete pendente');
  if (!q.payment) issues.push('Pagamento pendente');
  if (q.deliveryDays === null) issues.push('Prazo pendente');
  for (const item of r.items) {
    const l = q.lines.find(l => l.itemId === item.id);
    if (!l) { issues.push(`${item.name}: não cotado`); continue; }
    if (l.qtyMillis !== item.qtyMillis) issues.push(`${item.name}: quantidade divergente`);
    if (!l.available) issues.push(`${item.name}: disponibilidade pendente`);
    if (!l.equivalent) issues.push(`${item.name}: equivalência não confirmada`);
  }
  return issues;
}
export function comparison(s, requestId, now = today()) {
  return latestQuotes(s, requestId).map(q => ({ ...q, totalCents: quoteTotal(q), issues: quoteIssues(s, q, now) })).sort((a, b) => Number(!!a.issues.length) - Number(!!b.issues.length) || a.totalCents - b.totalCents);
}
export function savings(s, now = today()) {
  let potential = 0, realized = 0;
  for (const r of s.requests) {
    const bought = s.purchases.find(p => p.requestId === r.id && p.status === 'purchased');
    if (bought) { realized += bought.savingCents; continue; }
    const best = comparison(s, r.id, now).find(q => !q.issues.length);
    if (r.baselineCents && r.baselineEvidence && best) potential += Math.max(0, r.baselineCents - best.totalCents);
  }
  return { potential, realized };
}
function association(s, supplierId, body) {
  const candidates = s.requests.filter(r => r.status === 'open' && r.supplierIds.includes(supplierId));
  const exact = candidates.filter(r => new RegExp(`(^|[^A-Z0-9-])${r.code}([^A-Z0-9-]|$)`, 'i').test(body));
  return { requestIds: exact.length === 1 ? [exact[0].id] : [], candidates: candidates.map(r => r.id), linkStatus: exact.length === 1 ? 'automatic_reference' : 'needs_confirmation' };
}
export function dispatch(original, actor, command, now = today()) {
  assert(actor && actor.tenantId === original.tenantId && ROLES.includes(actor.role), 'Acesso negado à empresa.', 403);
  const s = structuredClone(original), p = command.payload || {}, type = command.type;
  const allowed = right => assert(can(actor.role, right), 'Seu perfil não tem permissão para esta ação.', 403);
  const id = prefix => `${prefix}-${++s.seq}`;
  const stamp = new Date().toISOString(); let result;
  const event = (entityId, details = {}) => s.audit.push({ id: id('ev'), at: stamp, actorId: actor.id, actorName: actor.name, role: actor.role, action: type, entityId, details });
  const unchanged = entity => { assert(p.version === entity.version, 'Versão alterada. Atualize e revise antes de continuar.', 409); };
  const availableRequest = r => assert(r.status === 'open', 'Solicitação encerrada ou já comprada.');
  const validQuote = q => assert(!quoteIssues(s, q, now).length, 'Proposta incompleta, vencida, substituída ou sem conferência técnica.');
  const validPurchase = b => { validQuote(get(s, 'quotes', b.quoteId)); const count = comparison(s, b.requestId, now).filter(q => !q.issues.length).length; assert(count >= (s.preferences?.minimumQuotes || 1) || b.exception, 'O mínimo de propostas aptas mudou. Rejeite esta solicitação de compra e solicite novamente com justificativa de exceção.'); };
  const invalidate = quoteId => {
    for (const d of s.drafts.filter(x => x.quoteId === quoteId && !['sent', 'manual_record'].includes(x.status))) { d.status = 'stale'; d.approval = null; }
    for (const b of s.purchases.filter(x => x.quoteId === quoteId && ['pending', 'approved'].includes(x.status))) { b.status = 'stale'; b.approval = null; }
  };
  switch (type) {
    case 'workspace.configure': {
      allowed('policy');const roleLabels={};for(const role of ROLES)roleLabels[role]=text(p.roleLabels?.[role],'Nome do perfil',70);
      s.preferences={leadDays:integer(p.leadDays,'Antecedência',0,90),minimumQuotes:integer(p.minimumQuotes,'Mínimo de propostas',1,10),roleLabels};result={id:s.tenantId,...s.preferences};
      for(const b of s.purchases.filter(b=>['pending','approved'].includes(b.status))){b.status='stale';b.approval=null;}break;
    }
    case 'request.followup': {
      allowed('quotes');const r=get(s,'requests',p.id);availableRequest(r);get(s,'suppliers',p.supplierId);assert(r.supplierIds.includes(p.supplierId),'Fornecedor não vinculado.');
      assert(['waiting','promised','declined','received'].includes(p.status),'Situação inválida.');
      result={id:id('retorno'),requestId:r.id,supplierId:p.supplierId,status:p.status,nextDate:p.nextDate?date(p.nextDate):null,note:text(p.note,'Retorno / observação',2000),by:actor.id,at:stamp};s.followups||=[];s.followups.push(result);break;
    }
    case 'request.cancel': {allowed('requests');const r=get(s,'requests',p.id);availableRequest(r);assert(r.requesterId===actor.id||can(actor.role,'quotes'),'Somente o solicitante ou equipe de compras pode cancelar.',403);assert(!s.purchases.some(b=>b.requestId===r.id&&['pending','approved','purchased'].includes(b.status)),'Existe compra ativa. Resolva a decisão de compra primeiro.');r.status='cancelled';r.cancelReason=text(p.reason,'Motivo',1000);result=r;break;}
    case 'work.create': allowed('works'); if(p.registryRef?.enterpriseId)assert(!s.works.some(w=>w.registryRef?.enterpriseId===p.registryRef.enterpriseId),'Empreendimento já vinculado aos Orçamentos.'); result = { ...(p.registryRef?{registryRef:structuredClone(p.registryRef)}:{}), id: id('obra'), name: text(p.name, 'Obra', 150), address: text(p.address, 'Endereço', 500) }; s.works.push(result); break;
    case 'supplier.create': {
      allowed('suppliers'); const phone = text(p.phone, 'WhatsApp', 20).replace(/\D/g, '');
      assert(/^\d{10,15}$/.test(phone), 'WhatsApp: inclua DDI e DDD.');
      assert(!s.suppliers.some(x => x.phone === phone), 'Já existe fornecedor com este WhatsApp.');
      const cnpj = String(p.cnpj || '').replace(/\D/g, ''); assert(!cnpj || cnpj.length === 14, 'CNPJ deve ter 14 dígitos.');
      result = { id: id('forn'), name: text(p.name, 'Fornecedor', 150), cnpj, phone, categories: text(p.categories, 'Categorias', 500), regions: text(p.regions, 'Regiões', 500) }; s.suppliers.push(result); break;
    }
    case 'request.create': {
      allowed('requests'); const work = get(s, 'works', p.workId);
      assert(Array.isArray(p.items) && p.items.length && p.items.length <= 100, 'Inclua de 1 a 100 itens.');
      const baselineCents = p.baselineCents == null ? null : integer(p.baselineCents, 'Referência', 1);
      assert(['normal', 'high', 'urgent'].includes(p.priority), 'Prioridade inválida.');
      const supplierIds = [...new Set(p.supplierIds || [])]; supplierIds.forEach(x => get(s, 'suppliers', x));
      const rid = id('sol'); result = { id: rid, code: `COT-${String(s.seq).padStart(4, '0')}`, title: text(p.title, 'Título', 150), workId: work.id, requesterId: actor.id, requesterName: actor.name, priority: p.priority, deadline: date(p.deadline, 'Prazo'), address: text(p.address || work.address, 'Endereço', 500), baselineCents, baselineEvidence: baselineCents ? text(p.baselineEvidence, 'Documento da referência', 500) : '', supplierIds, status: 'open', createdAt: stamp, items: p.items.map(i => ({ id: id('item'), name: text(i.name, 'Item', 150), kind: i.kind === 'service' ? 'service' : 'material', qtyMillis: integer(i.qtyMillis, 'Quantidade', 1, 1000000000), unit: text(i.unit, 'Unidade', 20), specification: text(i.specification, 'Especificação', 1000) })) }; s.requests.push(result); break;
    }
    case 'request.invite': { allowed('quotes'); const r = get(s, 'requests', p.id); availableRequest(r); get(s, 'suppliers', p.supplierId); r.supplierIds = [...new Set([...r.supplierIds, p.supplierId])]; result = r; break; }
    case 'quote.create': {
      allowed('quotes'); const r = get(s, 'requests', p.requestId); availableRequest(r); get(s, 'suppliers', p.supplierId);
      const previous = latestQuotes(s, r.id).find(q => q.supplierId === p.supplierId);
      assert((p.previousId || null) === (previous?.id || null), 'A revisão anterior mudou. Atualize a proposta.', 409);
      assert(Array.isArray(p.lines) && p.lines.length && p.lines.length <= r.items.length, 'Inclua pelo menos um item cotado.');
      assert(new Set(p.lines.map(l => l.itemId)).size === p.lines.length, 'Item repetido.');
      const lines = p.lines.map(l => { assert(r.items.some(i => i.id === l.itemId), 'Item de outra solicitação.'); return { itemId: l.itemId, description: text(l.description, 'Produto ofertado', 500), qtyMillis: integer(l.qtyMillis, 'Quantidade', 1, 1000000000), unitCents: integer(l.unitCents, 'Preço', 1), available: l.available === true, equivalent: false }; });
      result = { id: id('prop'), requestId: r.id, supplierId: p.supplierId, previousId: previous?.id || null, revision: (previous?.revision || 0) + 1, lines, freightCents: p.freightCents == null ? null : integer(p.freightCents, 'Frete'), deliveryDays: p.deliveryDays == null ? null : integer(p.deliveryDays, 'Entrega', 0, 3650), payment: String(p.payment || '').slice(0, 500), validUntil: p.validUntil ? date(p.validUntil, 'Validade') : null, source: text(p.source, 'Origem da proposta', 2000), createdBy: actor.id, createdAt: stamp };
      quoteTotal(result); s.quotes.push(result); r.supplierIds = [...new Set([...r.supplierIds, p.supplierId])]; if (previous) invalidate(previous.id); break;
    }
    case 'quote.review': {
      allowed('technical'); const q = get(s, 'quotes', p.id); availableRequest(get(s, 'requests', q.requestId));
      assert(latestQuotes(s, q.requestId).some(x => x.id === q.id), 'Revise somente a proposta atual.');
      assert(Array.isArray(p.itemIds) && p.itemIds.every(x => q.lines.some(l => l.itemId === x)), 'Itens inválidos.');
      q.lines.forEach(l => l.equivalent = p.itemIds.includes(l.itemId)); q.technicalReview = { by: actor.id, at: stamp, note: text(p.note, 'Justificativa técnica', 1000) }; invalidate(q.id); result = q; break;
    }
    case 'message.record': {
      allowed('messages'); get(s, 'suppliers', p.supplierId); const externalId = text(p.externalId, 'Identificador da mensagem', 150), body = text(p.body, 'Mensagem original', 10000);
      const existing = s.messages.find(m => m.supplierId === p.supplierId && m.source === 'manual' && m.externalId === externalId);
      if (existing) { assert(existing.body === body, 'Identificador já usado com outro conteúdo.', 409); return { state: original, result: existing, duplicate: true }; }
      result = { id: id('msg'), supplierId: p.supplierId, externalId, source: 'manual', direction: 'inbound', body, at: stamp, ...association(s, p.supplierId, body) }; s.messages.push(result); break;
    }
    case 'message.link': {
      allowed('messages'); const m = get(s, 'messages', p.id); assert(Array.isArray(p.requestIds) && p.requestIds.length, 'Escolha ao menos uma cotação.');
      p.requestIds.forEach(x => { const r = get(s, 'requests', x); assert(r.supplierIds.includes(m.supplierId), 'Convide este fornecedor para a solicitação primeiro.'); });
      m.requestIds = [...new Set(p.requestIds)]; m.linkStatus = 'confirmed'; m.confirmedBy = actor.id; result = m; break;
    }
    case 'draft.create': {
      allowed('messages'); const q = get(s, 'quotes', p.quoteId); validQuote(q); const r = get(s, 'requests', q.requestId); availableRequest(r);
      const total = quoteTotal(q), goal = target(total, s.policy.discountBps);
      result = { id: id('rasc'), quoteId: q.id, requestId: r.id, supplierId: q.supplierId, version: 1, status: 'draft', approval: null, totalCents: total, targetCents: goal, basisPoints: s.policy.discountBps, origin: 'deterministic_template', body: `Olá! Sobre a cotação ${r.code}, recebemos sua proposta no total entregue de ${money(total)}. Nossa meta para o mesmo escopo, incluindo frete, é ${money(goal)}. Conseguem avaliar essa condição e confirmar prazo, disponibilidade, pagamento e validade? Obrigado.`, revisions: [], createdAt: stamp }; s.drafts.push(result); break;
    }
    case 'draft.edit': {
      allowed('messages'); const d = get(s, 'drafts', p.id); unchanged(d); assert(['draft', 'approved', 'rejected'].includes(d.status), 'Rascunho enviado ou desatualizado.');
      d.revisions.push({ version: d.version, body: d.body, approval: d.approval, at: stamp }); d.version++; d.body = text(p.body, 'Mensagem', 10000); d.approval = null; d.status = 'draft'; result = d; break;
    }
    case 'draft.approve': case 'draft.reject': {
      allowed('messages'); const d = get(s, 'drafts', p.id); unchanged(d); assert(d.status === 'draft', 'A mensagem precisa estar em rascunho.'); validQuote(get(s, 'quotes', d.quoteId)); availableRequest(get(s, 'requests', d.requestId));
      d.status = type === 'draft.approve' ? 'approved' : 'rejected'; d.approval = d.status === 'approved' ? { by: actor.id, at: stamp, version: d.version, body: d.body } : null; result = d; break;
    }
    case 'draft.send': case 'draft.manual': {
      allowed('messages'); const d = get(s, 'drafts', p.id); unchanged(d);
      assert(d.status === 'approved' && d.approval?.version === d.version && d.approval.body === d.body, 'Envio exige aprovação explícita da versão exata.'); validQuote(get(s, 'quotes', d.quoteId)); availableRequest(get(s, 'requests', d.requestId));
      if (type === 'draft.send') throw new DomainError('WhatsApp não configurado. Nenhuma mensagem foi enviada.', 503);
      d.manualEvidence = text(p.evidence, 'Comprovante do envio manual', 500); d.status = 'manual_record'; d.recordedAt = stamp;
      s.messages.push({ id: id('msg'), supplierId: d.supplierId, source: 'manual_attestation', direction: 'outbound', body: d.body, at: stamp, requestIds: [d.requestId], linkStatus: 'confirmed', draftId: d.id }); result = d; break;
    }
    case 'purchase.request': {
      allowed('purchases'); const q = get(s, 'quotes', p.quoteId); validQuote(q); const r = get(s, 'requests', q.requestId); availableRequest(r);
      const quoteCount=comparison(s,r.id,now).filter(q=>!q.issues.length).length,minimumQuotes=s.preferences?.minimumQuotes||1;
      const exception=quoteCount<minimumQuotes?text(p.exception,'Justificativa da exceção ao mínimo de propostas',2000):'';
      assert(!s.purchases.some(b => b.requestId === r.id && ['pending', 'approved', 'purchased'].includes(b.status)), 'Já existe compra ativa para esta solicitação.');
      result = { id: id('compra'), requestId: r.id, quoteId: q.id, totalCents: quoteTotal(q), quoteSnapshot: structuredClone(q), status: 'pending', requestedBy: actor.id, requestedAt: stamp, justification: text(p.justification, 'Justificativa', 1000), quoteCount, minimumQuotes, exception, approval: null }; s.purchases.push(result); break;
    }
    case 'purchase.approve': case 'purchase.reject': {
      allowed('approve'); const b = get(s, 'purchases', p.id); assert(b.status === 'pending', 'Compra não está aguardando decisão.');
      assert(!s.policy.separateApprover || b.requestedBy !== actor.id, 'Solicitante e aprovador da compra devem ser pessoas diferentes.');
      assert(actor.role === 'vini' || b.totalCents <= s.policy.caruLimitCents, 'Valor acima da alçada de Caru; encaminhe à diretoria.');
      if (type === 'purchase.approve') validPurchase(b);
      b.status = type === 'purchase.approve' ? 'approved' : 'rejected'; b.approval = { by: actor.id, at: stamp, totalCents: b.totalCents, quoteId: b.quoteId, note: text(p.note, 'Parecer', 1000) }; result = b; break;
    }
    case 'purchase.complete': {
      allowed('purchases'); const b = get(s, 'purchases', p.id); assert(b.status === 'approved', 'Compra exige aprovação financeira.'); validPurchase(b);
      const r = get(s, 'requests', b.requestId); availableRequest(r); b.receipt = text(p.receipt, 'Pedido ou nota fiscal', 500); b.purchasedAt = stamp; b.status = 'purchased'; b.savingCents = r.baselineCents && r.baselineEvidence ? Math.max(0, r.baselineCents - b.totalCents) : 0; b.baseline = { cents: r.baselineCents, evidence: r.baselineEvidence }; r.status = 'purchased'; result = b; break;
    }
    case 'policy.update': allowed('policy'); s.policy = { caruLimitCents: integer(p.caruLimitCents, 'Alçada'), discountBps: integer(p.discountBps, 'Meta', 0, 5000), separateApprover: true }; result = s.policy;
      for (const b of s.purchases.filter(b => b.status === 'approved')) { b.status = 'pending'; b.approval = null; }
      for (const d of s.drafts.filter(d => ['draft', 'approved'].includes(d.status))) { d.status = 'stale'; d.approval = null; } break;
    default: throw new DomainError('Operação desconhecida.', 400);
  }
  event(result.id || s.tenantId, { version: result.version, status: result.status, quoteId: result.quoteId, snapshot: structuredClone(result) }); s.revision++; return { state: s, result };
}
