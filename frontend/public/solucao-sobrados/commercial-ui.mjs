// Commercial UI: the server remains authoritative for company, role and license access.
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = cents => Number.isSafeInteger(cents) ? new Intl.NumberFormat('pt-BR', {style:'currency',currency:'BRL'}).format(cents / 100) : 'Não informado';
const date = value => { if (!value) return 'Não informado'; const d = new Date(value); return Number.isNaN(d.valueOf()) ? 'Não informado' : d.toLocaleString('pt-BR', {dateStyle:'short',timeStyle:'short'}); };
const LICENSE = {legacy:'Acesso existente',legacy_access:'Acesso existente',pending_setup:'Configuração pendente',trial:'Em avaliação',active:'Ativa',paid:'Ativa',overdue:'Pagamento pendente',past_due:'Pagamento pendente',expired:'Expirada',cancelled:'Cancelada',canceled:'Cancelada',suspended:'Suspensa',manual:'Acesso liberado',pending:'Aguardando confirmação'};
const SUBSCRIPTION = {creating:'Preparando contratação',pending:'Aguardando autorização',authorized:'Renovação autorizada',paused:'Cobrança pausada',cancelled:'Renovação cancelada'};
const TICKET = {open:'Aberto',in_progress:'Em atendimento',resolved:'Resolvido'};
const CATEGORY = {bug:'Relatar um problema',suggestion:'Enviar uma sugestão',question:'Tirar uma dúvida'};
const btn = (text, action, extra = '') => `<button type="button" class="btn" data-commerce-action="${action}" ${extra}>${text}</button>`;
const options = (values, selected) => Object.entries(values).map(([key,label]) => `<option value="${esc(key)}"${key === selected ? ' selected' : ''}>${esc(label)}</option>`).join('');
const badge = (status, labels = LICENSE) => `<span class="commerce-badge">${esc(labels[status] || 'Não informado')}</span>`;
const field = (label, input) => `<label>${label}${input}</label>`;
const fact = (label, value) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`;

// A hosted checkout must never execute script URLs or leave for an unrelated site.
export function trustedCheckoutUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return null;
    if (!['mercadopago.com.br','www.mercadopago.com.br','sandbox.mercadopago.com.br'].includes(url.hostname)) return null;
    return url.href;
  } catch { return null; }
}

function billing(status, actor, confirmation) {
  const plan = status.plan || {}, license = status.license || {};
  const director = actor.role === 'admin';
  const canCheckout = director && status.checkoutEnabled === true;
  const canCancel = director && status.canCancel === true;
  return `<section class="commerce-card commerce-plan"><div><span class="commerce-eyebrow">Plano da empresa</span><h2>Solução Sobrados</h2><p class="commerce-price">${esc(money(plan.amountCents))}<small>/ mês por empresa</small></p><p>${esc(plan.trialDays ?? 7)} dias de avaliação para novas empresas elegíveis.</p></div><div>${badge(license.status)}<dl class="commerce-facts">${fact('Acesso',license.accessAllowed === true ? 'Liberado' : 'Indisponível')}${fact('Renovação',SUBSCRIPTION[status.subscriptionStatus] || 'Sem assinatura cadastrada')}${fact('Fim da avaliação',date(license.trialEndsAt))}${fact('Acesso pago até',date(license.paidUntil))}${license.manualUntil ? fact('Liberação temporária até',date(license.manualUntil)) : ''}</dl></div></section>
  ${status.checkoutEnabled !== true ? `<p class="commerce-notice">${status.billingConfigured === false || license.status === 'pending_setup' ? 'O pagamento automático ainda está em configuração. Nenhuma cobrança será iniciada por esta tela enquanto a integração não estiver disponível.' : 'A contratação não está disponível para esta conta neste momento. Consulte o atendimento se precisar de ajuda.'}</p>` : ''}
  ${!director ? '<p class="commerce-notice">O diretor da empresa gerencia a assinatura. Você pode entrar em contato pelo Atendimento.</p>' : ''}
  <section class="commerce-card"><h2>Assinatura e pagamento</h2><p>O acesso é vinculado à empresa e aos logins individuais. O pagamento é concluído no ambiente do Mercado Pago; a confirmação é verificada pelo servidor.</p><div class="commerce-actions">${canCheckout ? btn(`Assinar por ${esc(money(plan.amountCents))}/mês`,'checkout') : ''}${canCancel ? btn('Cancelar renovação','confirm-cancel') : ''}</div>
  ${confirmation === 'cancel' ? `<div class="commerce-confirm" role="group" aria-label="Confirmar cancelamento"><h3>Cancelar a renovação mensal?</h3><p>Esta ação interrompe as próximas cobranças da assinatura. O acesso já pago permanece até a data confirmada pelo servidor. Não solicita reembolso nem apaga os dados da empresa.</p><div class="commerce-actions">${btn('Manter assinatura','dismiss-confirm')}${btn('Confirmar cancelamento','cancel')}</div></div>` : ''}</section>`;
}

function ticketList(tickets, platform) {
  if (!tickets.length) return '<p class="commerce-empty">Nenhuma mensagem por aqui ainda.</p>';
  return `<div class="commerce-tickets">${tickets.map(t => `<article class="commerce-ticket"><div>${badge(t.status,TICKET)}<h3>${esc(t.title)}</h3><p>${esc(CATEGORY[t.category] || 'Atendimento')}${platform ? ` · ${esc(t.organizationName)}` : ''}</p><small>Atualizado em ${esc(date(t.updatedAt || t.createdAt))}</small></div>${btn('Ver conversa','ticket',`data-ticket-id="${esc(t.id)}"`)}</article>`).join('')}</div>`;
}

function ticketDetail(ticket, platform) {
  return `<section class="commerce-card"><div class="commerce-section-head"><h2>${esc(ticket.title)}</h2>${btn('Voltar às mensagens','tickets')}</div><p>${esc(CATEGORY[ticket.category] || 'Atendimento')} ${badge(ticket.status,TICKET)}${platform ? ` · ${esc(ticket.organizationName)}` : ''}</p><ol class="commerce-messages">${(ticket.messages || []).map(m => `<li${m.fromOperator ? ' class="commerce-operator"' : ''}><div><strong>${esc(m.authorName || (m.fromOperator ? 'Atendimento' : 'Usuário'))}</strong><time>${esc(date(m.createdAt))}</time></div><p>${esc(m.body)}</p></li>`).join('')}</ol><form data-commerce-form="reply"><input type="hidden" name="id" value="${esc(ticket.id)}">${field(platform ? 'Resposta ao cliente' : 'Sua mensagem','<textarea name="message" required maxlength="6000" rows="4" placeholder="Descreva o que precisa, sem incluir senhas ou dados de cartão."></textarea>')}${platform ? field('Situação',`<select name="status">${options(TICKET,ticket.status)}</select>`) : ''}<button class="btn primary" type="submit">Enviar mensagem</button></form></section>`;
}

function support(tickets, selected) {
  const ticket = tickets.find(t => t.id === selected);
  if (ticket) return ticketDetail(ticket,false);
  return `<section class="commerce-card"><h2>Como podemos ajudar?</h2><p>Envie dúvidas, sugestões ou problemas do aplicativo. O atendimento continua disponível mesmo se o acesso aos módulos estiver suspenso.</p><form data-commerce-form="support">${field('Tipo de mensagem',`<select name="category">${options(CATEGORY,'question')}</select>`)}${field('Assunto','<input name="title" required maxlength="160" autocomplete="off" placeholder="Resuma o que aconteceu">')}${field('Mensagem','<textarea name="message" required maxlength="6000" rows="5" placeholder="Conte o que estava fazendo e o que aconteceu. Não envie senhas ou dados de cartão."></textarea>')}<button class="btn primary" type="submit">Enviar ao atendimento</button></form></section><section class="commerce-card"><h2>Minhas mensagens</h2>${ticketList(tickets,false)}</section>`;
}

function platform(data, selected, confirmation) {
  const tickets = data.tickets || [], ticket = tickets.find(t => t.id === selected);
  if (ticket) return ticketDetail(ticket,true);
  const metrics = data.metrics || {};
  const metric = (label,key,currency=false) => `<div class="commerce-metric"><span>${label}</span><strong>${esc(currency ? money(metrics[key]) : Number.isSafeInteger(metrics[key]) ? metrics[key].toLocaleString('pt-BR') : 'Não informado')}</strong></div>`;
  return `<p class="commerce-notice">Administração da plataforma: assinaturas e atendimento. Os valores abaixo são pagamentos confirmados do aplicativo.</p><section class="commerce-metrics" aria-label="Indicadores da plataforma">${metric('Empresas','customers')}${metric('Assinaturas ativas','activeSubscriptions')}${metric('Em avaliação','trialCustomers')}${metric('Acesso expirado','overdueCustomers')}${metric('Pagamentos confirmados','paidCount')}${metric('Recebido em assinaturas','paidCents',true)}${metric('Mensagens abertas','openTickets')}</section><section class="commerce-card"><h2>Empresas e acesso</h2><div class="commerce-customers">${(data.customers || []).length ? data.customers.map(c => `<article class="commerce-customer"><h3>${esc(c.name)}</h3><p>${esc(c.ownerEmail)}</p>${badge(c.license?.status)}<dl class="commerce-facts">${fact('Cadastro',date(c.createdAt))}${fact('Avaliação até',date(c.license?.trialEndsAt))}${fact('Acesso pago até',date(c.license?.paidUntil))}${c.license?.manualUntil ? fact('Liberação temporária até',date(c.license.manualUntil)) : ''}</dl>${btn('Gerenciar acesso','license',`data-organization-id="${esc(c.organizationId)}"`)}${confirmation === c.organizationId ? `<form class="commerce-confirm" data-commerce-form="license"><h4>Ajustar acesso de ${esc(c.name)}</h4><input type="hidden" name="organizationId" value="${esc(c.organizationId)}">${field('Ação',`<select name="action"><option value="extend">Liberar acesso temporário</option><option value="suspend">Suspender acesso</option><option value="restore">Remover suspensão</option></select>`)}${field('Dias de acesso temporário (apenas na liberação)','<input type="number" name="days" min="1" max="365" step="1" value="7" required inputmode="numeric">')}${field('Justificativa (registrada no histórico)','<textarea name="reason" maxlength="1000" required rows="3"></textarea>')}<p>Este ajuste não registra pagamento, não cancela cobrança e não gera reembolso.</p><div class="commerce-actions">${btn('Voltar','dismiss-confirm')}<button type="submit" class="btn primary">Confirmar ajuste de acesso</button></div></form>` : ''}</article>`).join('') : '<p class="commerce-empty">Nenhuma empresa encontrada.</p>'}</div></section><section class="commerce-card"><h2>Atendimento da plataforma</h2>${ticketList(tickets,true)}</section>`;
}

export function commercialMarkup({view,status,actor={},data={},selected=null,confirmation=null}) {
  if (view === 'platform' && status?.platformAdmin !== true) return '<p class="commerce-notice" role="alert">Acesso restrito à administração da plataforma.</p>';
  if (view === 'billing') return billing(status || {},actor,confirmation);
  if (view === 'platform') return platform(data,selected,confirmation);
  return support(data.tickets || [],selected);
}

export function mountCommercial({container,api,actor,view='billing',onChange}) {
  if (!container || typeof api !== 'function') throw new TypeError('Container e API são obrigatórios.');
  if (!['billing','support','platform'].includes(view)) throw new TypeError('Módulo comercial inválido.');
  const context = {id:actor?.id,organizationId:actor?.organizationId};
  let disposed=false, generation=0, busy=false, status=null, data={}, selected=null, confirmation=null;
  const alive = () => !disposed && actor?.id === context.id && actor?.organizationId === context.organizationId;
  const current = stamp => alive() && stamp === generation;
  const title = {billing:'Assinatura da empresa',support:'Atendimento e sugestões',platform:'Administração da plataforma'}[view];
  container.innerHTML = `<div class="commercial-app"><header class="commerce-header"><div><span class="commerce-eyebrow">Solução Sobrados</span><h1>${title}</h1></div>${btn('Atualizar','refresh')}</header><p data-commerce-feedback role="status" aria-live="polite" hidden></p><div data-commerce-body aria-busy="true"><p>Carregando…</p></div></div>`;
  const body=container.querySelector('[data-commerce-body]'), feedback=container.querySelector('[data-commerce-feedback]');
  const showFeedback = (message,error=false) => { if (!alive()) return; feedback.textContent=message; feedback.hidden=!message; feedback.className=error ? 'commerce-error' : 'commerce-success'; feedback.setAttribute('role',error?'alert':'status'); };
  const controls = disabled => { for (const el of container.querySelectorAll('button, input, select, textarea')) el.disabled=disabled; body.setAttribute('aria-busy',String(disabled)); };
  const draw = () => { if (alive()) body.innerHTML=commercialMarkup({view,status,actor,data,selected,confirmation}); };
  async function load(message='') {
    if (!alive() || busy) return;
    busy=true; const stamp=++generation; controls(true); showFeedback('');
    try {
      const nextStatus=await api('/status'); if (!current(stamp)) return;
      let nextData={};
      if (view==='support') nextData=await api('/support');
      if (view==='platform' && nextStatus.platformAdmin===true) nextData=await api('/platform');
      if (!current(stamp)) return;
      status=nextStatus; data=nextData; draw(); showFeedback(message);
    } catch (error) {
      if (!current(stamp)) return;
      status=null;data={};body.innerHTML='<p class="commerce-empty">Não foi possível carregar esta tela. Use Atualizar para tentar novamente.</p>';showFeedback(error?.message || 'Falha ao carregar. Tente novamente.',true);
    } finally { if (current(stamp)) {busy=false;controls(false);} }
  }
  async function mutate(path,payload,message,{redirect=false}={}) {
    if (!alive() || busy) return;
    busy=true; const stamp=++generation; controls(true);showFeedback('');
    try {
      const result=await api(path,payload); if (!current(stamp)) return;
      if (redirect) {
        const destination=trustedCheckoutUrl(result.checkoutUrl);
        if (!destination) throw new Error('O endereço de pagamento recebido não é válido. Entre em contato com o atendimento.');
        globalThis.location.assign(destination);return;
      }
      confirmation=null;
      if (path==='/support' && result.id) selected=result.id;
      busy=false; await load(message);
      if (alive() && onChange) {
        const refreshStamp=generation;busy=true;controls(true);
        try { await onChange(); }
        catch { if (current(refreshStamp)) showFeedback(message+' A alteração foi salva, mas não foi possível atualizar os dados da conta. Reabra a página para atualizar o acesso.',true); }
        finally { if (current(refreshStamp)) {busy=false;controls(false);} }
      }
    } catch(error) { if (current(stamp)) showFeedback(error?.message || 'Não foi possível salvar. Tente novamente.',true); }
    finally { if (current(stamp)) {busy=false;controls(false);} }
  }
  function onClick(event) {
    const button=event.target.closest?.('[data-commerce-action]'); if (!button || !container.contains(button) || !alive() || busy) return;
    const action=button.dataset.commerceAction;
    if (action==='refresh') { void load();return; }
    if (action==='ticket') { selected=button.dataset.ticketId;confirmation=null;draw();return; }
    if (action==='tickets') { selected=null;draw();return; }
    if (action==='dismiss-confirm') {confirmation=null;draw();return;}
    if (action==='checkout' && actor.role==='admin' && status?.checkoutEnabled===true) { void mutate('/checkout',{},'',{redirect:true});return; }
    if (action==='confirm-cancel' && actor.role==='admin' && status?.canCancel===true) {confirmation='cancel';draw();return;}
    if (action==='cancel' && confirmation==='cancel' && actor.role==='admin' && status?.canCancel===true) {void mutate('/cancel',{},'Renovação cancelada. O acesso foi atualizado.');return;}
    if (action==='license' && view==='platform' && status?.platformAdmin===true) {confirmation=button.dataset.organizationId;draw();}
  }
  function onSubmit(event) {
    const form=event.target.closest?.('[data-commerce-form]'); if (!form || !container.contains(form)) return;
    event.preventDefault(); if (!alive() || busy || !form.reportValidity()) return;
    const value=name=>String(form.elements.namedItem(name)?.value || '').trim();
    const kind=form.dataset.commerceForm;
    if (kind==='support' && view==='support') {
      if (!value('title') || !value('message')) {showFeedback('Preencha o assunto e a mensagem.',true);return;}
      void mutate('/support',{category:value('category'),title:value('title'),message:value('message')},'Mensagem enviada ao atendimento.');
    } else if (kind==='reply') {
      if (!value('message')) {showFeedback('Escreva uma mensagem.',true);return;}
      if (view==='platform' && status?.platformAdmin!==true) return;
      void mutate(view==='platform'?'/platform/reply':'/support/reply',{id:value('id'),message:value('message'),...(view==='platform'?{status:value('status')}:{})},'Mensagem enviada.');
    } else if (kind==='license' && view==='platform' && status?.platformAdmin===true && confirmation===value('organizationId')) {
      if (!value('reason')) {showFeedback('Informe a justificativa do ajuste.',true);return;}
      const action=value('action');
      void mutate('/platform/license',{organizationId:value('organizationId'),action,reason:value('reason'),...(action==='extend'?{days:Number(value('days'))}:{})},'Acesso atualizado e ajuste registrado.');
    }
  }
  container.addEventListener('click',onClick);container.addEventListener('submit',onSubmit);void load();
  return () => {if(disposed)return;disposed=true;generation++;container.removeEventListener('click',onClick);container.removeEventListener('submit',onSubmit);status=null;data={};body.innerHTML='';feedback.textContent='';container.innerHTML='';};
}


