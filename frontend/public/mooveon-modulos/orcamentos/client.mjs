import { billingDispatch, ROLE_LABELS as BILLING_LABELS } from '../cobranca/domain.mjs';
import { demoBilling } from '../cobranca/demo.mjs';
import { emptyRegistry, registryView, registryDispatch, registryCanWrite, prepareRegistryCommand } from '../cadastros/domain.mjs';
import { dispatch, NAMES } from './domain.mjs';
import { preferences } from './insights.mjs';
import { demoState } from './demo.mjs';
import { legalDispatch } from '../juridico/domain.mjs';
import { demoLegal } from '../juridico/demo.mjs';
import { upgradeLegal, legalView, ROLE_LABELS } from '../juridico/features.mjs';
export const $ = selector => document.querySelector(selector);
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const field = (name, label, value = '', type = 'text', required = true) => `<label>${esc(label)}<input name="${name}" type="${type}" value="${esc(value)}" ${required ? 'required' : ''}></label>`;
export const area = (name, label, value = '', required = true) => `<label class="wide">${esc(label)}<textarea name="${name}" ${required ? 'required' : ''}>${esc(value)}</textarea></label>`;
export const select = (name, label, rows, value = '') => `<label>${esc(label)}<select name="${name}">${rows.map(([id, text]) => `<option value="${esc(id)}" ${id === value ? 'selected' : ''}>${esc(text)}</option>`).join('')}</select></label>`;
export const badge = (label, tone = '') => `<span class="badge ${tone}">${esc(label)}</span>`;
export const actionLabel = action => ({ 'settings.update':'Configuração jurídica alterada', 'task.assign':'Tarefa distribuída', 'task.acknowledge':'Recebimento confirmado', 'task.escalate':'Tarefa encaminhada ao gestor', 'case.record':'Informação da ficha registrada', 'case.custom':'Campos do processo atualizados', 'document.add':'Versão de documento registrada', 'internal.create':'Solicitação interna criada', 'internal.comment':'Comentário registrado', 'internal.document':'Documento da solicitação incluído', 'internal.update':'Solicitação distribuída / atualizada', 'contract.create':'Contrato cadastrado', 'contract.revise':'Contrato revisado', 'contract.transition':'Etapa contratual atualizada', 'obligation.create':'Obrigação cadastrada', 'obligation.complete':'Obrigação concluída', 'obligation.cancel':'Obrigação cancelada', 'workspace.configure':'Preferências de compras alteradas', 'request.followup':'Retorno de fornecedor registrado', 'request.cancel':'Solicitação cancelada', 'work.create':'Obra cadastrada', 'supplier.create':'Fornecedor cadastrado', 'request.create':'Solicitação criada', 'request.invite':'Fornecedor vinculado', 'quote.create':'Proposta registrada', 'quote.review':'Conferência técnica', 'message.record':'Mensagem recebida registrada', 'message.link':'Vínculo de mensagem conferido', 'draft.create':'Negociação preparada', 'draft.edit':'Texto revisado', 'draft.approve':'Texto aprovado', 'draft.reject':'Texto rejeitado', 'draft.manual':'Envio manual declarado', 'purchase.request':'Aprovação de compra solicitada', 'purchase.approve':'Compra aprovada', 'purchase.reject':'Compra rejeitada', 'purchase.complete':'Compra efetivada', 'policy.update':'Política de compras alterada', 'case.create':'Processo / assunto cadastrado', 'case.update':'Cadastro jurídico alterado', 'task.create':'Tarefa / prazo preparado', 'task.revise':'Prazo revisado', 'task.confirm':'Data conferida', 'task.complete':'Tarefa concluída', 'task.cancel':'Tarefa cancelada', 'inbox.record':'Informação recebida registrada', 'inbox.link':'Informação vinculada ao processo', 'integration.preferences':'Preferências de integração atualizadas' })[action] || action;
export const empty = message => `<div class="empty"><span class="empty-icon">＋</span><h3>${esc(message)}</h3><p>Os registros aparecerão aqui conforme a equipe trabalhar.</p></div>`;
export const button = (action, label, id = '', disabled = false, primary = false) => `<button class="btn ${primary ? 'primary' : ''}" data-action="${action}" data-id="${esc(id)}" ${disabled ? 'disabled' : ''}>${esc(label)}</button>`;
export function download(name, data, type = 'application/json') { const a = document.createElement('a'), url = URL.createObjectURL(new Blob([data], { type })); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
export function notify(message, error = false) { const node = $('#notice'); node.textContent = message; node.className = error ? 'notice error' : 'notice'; node.hidden = false; clearTimeout(notify.timer); notify.timer = setTimeout(() => node.hidden = true, 8000); }
export function modal(title, body, save, label = 'Salvar') {
  const dialog = $('#dialog'); dialog.innerHTML = `<form id="editor"><header><h2>${esc(title)}</h2><button class="btn" type="button" id="close-dialog" aria-label="Fechar">×</button></header><div class="form-grid">${body}</div><p id="form-error" role="alert"></p><footer><button type="button" class="btn" id="cancel-dialog">Cancelar</button><button class="btn primary" type="submit">${esc(label)}</button></footer></form>`;
  $('#close-dialog').onclick = $('#cancel-dialog').onclick = () => dialog.close();
  $('#editor').onsubmit = async e => { e.preventDefault(); const submit = e.submitter; submit.disabled = true; try { await save(new FormData(e.target), e.target); dialog.close(); } catch (error) { $('#form-error').textContent = error.message; } finally { submit.disabled = false; } }; dialog.showModal();
}
export class Client {
  constructor(module, render) { this.module = module; this.render = render; this.demo = true; this.tenantId = 'demo-cdc'; this.role = module === 'billing' ? 'cobranca' : module === 'legal' ? 'juridico' : 'secretaria'; }
  async request(path, payload) {
    throw new Error('Ambiente de testes: os registros ficam apenas neste navegador.');
    const res = await fetch(`/api/${path}`, { method: payload === undefined ? 'GET' : 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...(this.csrf ? { 'X-CSRF-Token': this.csrf } : {}) }, ...(payload === undefined ? {} : { body: JSON.stringify(payload) }) });
    let data; try { data = await res.json(); } catch { throw new Error('API indisponível. Inicie o servidor ou use a demonstração.'); }
    if (!res.ok) { const e = new Error(data.error || 'Falha na requisição'); e.status = res.status; throw e; } return data;
  }
  key() { return `moove-${this.module}-demo-v1-${this.tenantId}`; }
  demoLoad() {
    if (this.module === 'billing') { const raw = localStorage.getItem(this.key()); this.state = raw ? JSON.parse(raw) : demoBilling(this.tenantId); if (!raw) localStorage.setItem(this.key(), JSON.stringify(this.state)); this.actor = { tenantId: this.tenantId, role: this.role, id: 'demo-'+this.role, name: BILLING_LABELS[this.role] }; return; }
    const raw = localStorage.getItem(this.key()); this.state = raw ? JSON.parse(raw) : (this.module === 'legal' ? demoLegal : demoState)(this.tenantId);
    if (!raw) localStorage.setItem(this.key(), JSON.stringify(this.state));
    this.actor = { tenantId: this.tenantId, role: this.role, id: `demo-${this.role}`, name: this.role === 'juridico' ? 'Responsável jurídico' : NAMES[this.role] };
    if(this.module==='legal'){
      this.actor.name=({vini:'Diretor de exemplo',caru:'Administrativo de exemplo',juridico:'Responsável jurídico',solicitante:'Solicitante de exemplo'})[this.role];
      const rawState=upgradeLegal(this.state);rawState.members=Object.keys(ROLE_LABELS).map(role=>({id:`demo-${role}`,role,name:({vini:'Diretor de exemplo',caru:'Administrativo de exemplo',juridico:'Responsável jurídico',solicitante:'Solicitante de exemplo'})[role]}));
      this.raw=rawState;this.state=legalView(rawState,this.actor);
    }
  }
  async start() {
    $('#theme').onclick = () => { document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('mo-modulos-tema', document.documentElement.dataset.theme); } catch {} };
    try { document.documentElement.dataset.theme = localStorage.getItem('mo-modulos-tema') || 'light'; } catch {}
    $('#refresh').onclick = async () => { try { await this.refresh(); notify('Dados atualizados.'); } catch (e) { notify(e.message, true); } };
    $('#logout').onclick = async () => { try { if (!this.demo) await this.request('logout', {}); location.href = '/mooveon/modulos'; } catch (e) { notify(e.message, true); } };
    if (this.demo) { try { this.demoLoad(); this.header(); this.render(); } catch (e) { notify(`Não foi possível ler/gravar a demonstração: ${e.message}`, true); } return; }
    try { const me = await this.request('me'); this.actor = me.actor; this.csrf = me.csrf; await this.refresh(); } catch (e) { this.login(e.status === 401 ? '' : e.message); }
  }
  header() {
    $('#identity').textContent = `${this.state.name} · ${this.actor.name}`;
    $('#shared-registry-link')?.remove();
    if(this.actor.role!=='solicitante'&&$('.top-actions')){const link=document.createElement('a');link.id='shared-registry-link';link.className='btn';link.textContent='Cadastros';link.href=`/mooveon/cadastros?module=${this.module}${this.demo?'&demo=1':''}`;$('.top-actions').prepend(link);}
    $('#mode').textContent = this.demo ? 'TESTES · salvo apenas neste navegador · use dados fictícios · sem login' : 'Sessão autenticada · empresa isolada no servidor';
    $('#mode').className = this.demo ? 'mode demo-mode' : 'mode';
    if (this.module === 'billing') {
      $('#mode').textContent = this.demo ? 'TESTES · salvo apenas neste navegador · use dados fictícios · sem login' : 'Sessão autenticada · empresa isolada no servidor';
      $('#demo-controls').innerHTML = this.demo ? select('demo-company', 'Empresa de demonstração', [['demo-cdc', 'Construtora Exemplo'], ['demo-horizonte', 'Empresa Horizonte']], this.tenantId) + select('demo-role', 'Simular perfil', Object.entries(BILLING_LABELS), this.role) : '';
      for (const el of $('#demo-controls').querySelectorAll('select')) el.onchange = () => { if ($('#dialog').open) $('#dialog').close(); this.tenantId = $('[name="demo-company"]').value; this.role = $('[name="demo-role"]').value; this.demoLoad(); this.header(); this.render(); }; return;
    }
    $('#demo-controls').innerHTML = this.demo ? select('demo-company', 'Empresa de demonstração', [['demo-cdc', 'Construtora Exemplo'], ['demo-horizonte', 'Empresa Horizonte']], this.tenantId) + select('demo-role', 'Simular perfil', (this.module === 'legal' ? ['juridico', 'vini', 'caru', 'solicitante'] : Object.keys(NAMES)).map(x => [x, this.module==='legal' ? (this.state.settings?.roleLabels?.[x] || ROLE_LABELS[x]) : preferences(this.state).roleLabels[x]]), this.role) : '';
    for (const el of $('#demo-controls').querySelectorAll('select')) el.onchange = () => { if ($('#dialog').open) $('#dialog').close(); this.tenantId = $('[name="demo-company"]').value; this.role = $('[name="demo-role"]').value; this.demoLoad(); this.header(); this.render(); };
  }
  async refresh() { if (this.demo) this.demoLoad(); else this.state = (await this.request(`${this.module}/state`)).state; this.header(); this.render(); }
  async command(type, payload) {
    payload={...payload};if(typeof payload.registrySelection==='string'){payload.registrySelection=JSON.parse(payload.registrySelection);}
    if (this.demo) {
      const current = JSON.parse(localStorage.getItem(this.key())); if (current.revision !== this.state.revision) throw new Error('Dados alterados em outra aba. Atualize antes de salvar.');
      const prepared=prepareRegistryCommand(this.registryDemoRaw(),this.registryActor(),this.module,{type,payload});
      const result = (this.module === 'billing' ? billingDispatch : this.module === 'legal' ? legalDispatch : dispatch)(this.module==='legal'?this.raw:this.state, this.actor, prepared); localStorage.setItem(this.key(), JSON.stringify(result.state)); this.raw=result.state;this.state = this.module==='legal'?legalView(result.state,this.actor):result.state;
    } else {
      const result = await this.request(`${this.module}/command`, { revision: this.state.revision, command: { type, payload } }); this.state = result.state;
    }
    this.header(); this.render(); notify('Registro salvo no histórico.');
  }
  registryActor(){return {...this.actor,modules:this.demo?[this.module]:this.actor.modules};}
  registryKey(){return `moove-registry-demo-v1-${this.actor.tenantId}`;}
  registryDemoRaw(){const raw=localStorage.getItem(this.registryKey());if(raw)return JSON.parse(raw);const state=emptyRegistry(this.actor.tenantId,this.state.name);localStorage.setItem(this.registryKey(),JSON.stringify(state));return state;}
  async registryRead(){return this.demo?{state:registryView(this.registryDemoRaw(),this.registryActor(),this.module),canWrite:registryCanWrite(this.actor,this.module,this.state)}:this.request(`${this.module}/registry`);}
  async registrySave(type,payload,revision){
    if(!this.demo)return this.request(`${this.module}/registry-command`,{revision,command:{type,payload}});
    const raw=this.registryDemoRaw();if(raw.revision!==revision)throw new Error('Cadastros alterados em outra aba. Atualize antes de salvar.');
    const out=registryDispatch(raw,this.registryActor(),this.module,{type,payload},registryCanWrite(this.actor,this.module,this.state));localStorage.setItem(this.registryKey(),JSON.stringify(out.state));
    return {state:registryView(out.state,this.registryActor(),this.module),result:{id:out.result.id,count:out.result.count},canWrite:registryCanWrite(this.actor,this.module,this.state)};
  }
  login(error = '') {
    $('#content').innerHTML = `<section class="login card"><p class="eyebrow">ACESSO DA EMPRESA</p><h1>${this.module === 'billing' ? 'Cobrança' : this.module === 'legal' ? 'Jurídico' : 'Orçamentos e Compras'}</h1><p>Entre com a conta cadastrada pelo administrador.</p><form id="login-form">${field('tenantId', 'Identificador da empresa')}${field('email', 'E-mail', '', 'email')}${field('password', 'Senha', '', 'password')}<button class="btn primary">Entrar</button><p id="login-error" role="alert">${esc(error)}</p></form><a href="?demo=1">Explorar demonstração com dados fictícios →</a></section>`;
    $('#login-form').onsubmit = async e => { e.preventDefault(); const b = e.submitter; b.disabled = true; try { const me = await this.request('login', Object.fromEntries(new FormData(e.target))); this.actor = me.actor; this.csrf = me.csrf; await this.refresh(); } catch (error) { $('#login-error').textContent = error.message; } finally { b.disabled = false; } };
  }
}
