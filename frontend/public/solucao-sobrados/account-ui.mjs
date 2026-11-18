import {MODULES,MODULE_IDS,normalizeModules} from './access-domain.mjs?v=20261118-access8';

const BASE='/api/solucao-sobrados/diary/workspace';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const roleLabels={admin:'Diretor',manager:'Gestor',maintenance:'Equipe de manutenção'};
let accountContext=null,accountEpoch=0;
export function setAccountContext(actor){accountContext=actor?{id:actor.id,organizationId:actor.organizationId}:null;accountEpoch++;}
export function accountHeaders(){return accountContext?{'X-SS-User':accountContext.id,'X-SS-Organization':accountContext.organizationId}:{};}
export async function accountApi(path,body,{raw=false,signal}={}){const epoch=accountEpoch,publicPath=['/login','/register','/accept-invite','/me'].includes(path);const res=await fetch(BASE+path,{signal,method:body===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',headers:{...(!publicPath?accountHeaders():{}),...(body===undefined?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});if(raw&&res.ok){const blob=await res.blob();if(epoch!==accountEpoch)throw new Error('A sessão mudou. Atualize a página.');return blob;}let data;try{data=await res.json();}catch{throw new Error('O serviço está indisponível. Tente novamente em instantes.');}if(epoch!==accountEpoch)throw new Error('A sessão mudou. Atualize a página.');if(!res.ok)throw Object.assign(new Error(data.error||'Não foi possível concluir.'),{status:res.status});return data;}
const input=(name,label,type='text',extra='')=>`<label>${label}<input name="${name}" type="${type}" required ${extra}></label>`;
export function loginScreen(container,onSuccess){let view=location.hash.startsWith('#convite=')?'invite':'login';const invitation=view==='invite'?location.hash.slice(9):'';function draw(){container.innerHTML=`<main class="account-entry"><section class="card"><p class="eyebrow">SOLUÇÃO SOBRADOS</p><h1>${view==='login'?'Entre na sua conta':view==='invite'?'Aceitar convite':'Criar minha empresa'}</h1><p>${view==='register'?'Seu espaço será separado das outras empresas. Você será o Diretor.':view==='invite'?'O cargo, os módulos e a empresa são definidos pelo convite.':'Obras, manutenção e equipe no mesmo lugar.'}</p><form class="account-form">${view!=='login'?input('name','Seu nome','text','maxlength="100" autocomplete="name"'):''}${view==='register'?input('organizationName','Nome da empresa','text','maxlength="150"'):''}${input('email','E-mail','email','autocomplete="username" maxlength="254"')}${input('password','Senha','password',`autocomplete="${view==='login'?'current-password':'new-password'}" ${view==='login'?'':'minlength="12"'} maxlength="128"`)}${view==='login'?'':'<small>Use pelo menos 12 caracteres.</small>'}<p class="form-error" role="alert"></p><button class="btn primary" type="submit">${view==='login'?'Entrar':view==='invite'?'Criar acesso':'Criar conta'}</button></form>${view==='invite'?'':`<button class="btn account-switch">${view==='login'?'Criar conta de Diretor':'Já tenho uma conta'}</button>`}<p class="fine">Os dados antigos deste navegador permanecem preservados. O Diretor pode importá-los após entrar.</p></section></main>`;container.querySelector('.account-switch')?.addEventListener('click',()=>{view=view==='login'?'register':'login';draw();});container.querySelector('form').onsubmit=async event=>{event.preventDefault();const button=event.submitter;button.disabled=true;try{const payload=Object.fromEntries(new FormData(event.target));if(view==='invite')payload.token=invitation;await accountApi(view==='login'?'/login':view==='invite'?'/accept-invite':'/register',payload);if(invitation)history.replaceState(null,'',location.pathname+location.search);await onSuccess();}catch(error){container.querySelector('[role="alert"]').textContent=error.message;button.disabled=false;}};}draw();}

const groupLabel=group=>({obra:'Obra',financeiro:'Financeiro',comercial:'Comercial',gestao:'Gestão',maintenance:'Manutenção',manutencao:'Manutenção'}[group]||String(group||'Outros módulos'));
const roleOptions=role=>Object.entries(roleLabels).map(([id,label])=>`<option value="${id}"${id===role?' selected':''}>${esc(label)}</option>`).join('');
function permissionPicker(role,selection){
  const director=role==='admin',selected=new Set(normalizeModules(selection,role));
  const groups=[...new Set(MODULES.map(module=>module.group))];
  return `<div class="account-permission-head"><div><h3>Módulos permitidos</h3><p>${director?'O Diretor tem acesso completo a todos os módulos e à gestão de usuários. Esse acesso não pode ser limitado.':'Marque os módulos que esta pessoa poderá acessar. Gestores podem trabalhar nos módulos liberados. A equipe de manutenção consulta os demais módulos e atualiza seus próprios chamados.'}</p></div><span class="account-permission-count" data-module-count aria-live="polite">${selected.size} de ${MODULE_IDS.length} módulos</span></div>${director?'':`<div class="account-permission-tools"><button type="button" class="btn" data-account-action="select-all">Marcar todos</button><button type="button" class="btn" data-account-action="clear-modules">Limpar seleção</button></div>`}<div class="account-permission-groups">${groups.map(group=>`<fieldset class="account-permission-group"${director?' disabled':''}><legend>${esc(groupLabel(group))}</legend>${MODULES.filter(module=>module.group===group).map(module=>`<label class="account-module-option"><input type="checkbox" name="modules" value="${esc(module.id)}"${selected.has(module.id)?' checked':''}${director?' disabled':''}><span>${esc(module.label)}</span></label>`).join('')}</fieldset>`).join('')}</div><p class="account-module-note" data-module-note role="status"></p>`;
}

export function mountUsers(container,actor){
  let cancelled=false,users=[];
  if(actor?.role!=='admin'){
    container.innerHTML='<section class="card account-users"><h1>Equipe e acessos</h1><p role="alert">Somente o Diretor pode gerenciar usuários e permissões.</p></section>';
    return ()=>{cancelled=true;};
  }
  function userCard(user,open=false,feedback=''){
    const modules=normalizeModules(user.modules,user.role),initials=String(user.name||user.email||'?').trim().split(/\s+/u).slice(0,2).map(part=>part[0]||'').join('').toLocaleUpperCase('pt-BR');
    return `<details class="account-user-card" data-account-card="${esc(user.id)}"${open?' open':''}><summary><span class="account-user-avatar" aria-hidden="true">${esc(initials)}</span><span class="account-user-identity"><strong>${esc(user.name)}${user.id===actor.id?' <span class="account-self">Você</span>':''}</strong><span>${esc(user.email)}</span></span><span class="account-user-badges"><span class="account-role-badge">${esc(roleLabels[user.role]||user.role)}</span><span class="account-active-badge ${user.active?'active':'suspended'}">${user.active?'Ativo':'Suspenso'}</span><span class="account-module-total">${user.role==='admin'?'Acesso completo':modules.length+' de '+MODULE_IDS.length+' módulos'}</span></span><span class="account-user-expand" aria-hidden="true">⌄</span></summary><form class="account-user-form" data-user="${esc(user.id)}" data-revision="${esc(user.revision)}"><div class="account-user-fields"><label>Cargo<select name="role" aria-label="Cargo de ${esc(user.name)}">${roleOptions(user.role)}</select></label><label class="account-active-option"><input name="active" type="checkbox"${user.active?' checked':''}><span>Acesso ativo<small>Desmarque para suspender esta pessoa.</small></span></label></div><div class="account-module-picker">${permissionPicker(user.role,user.modules)}</div><p class="account-save-feedback" role="status">${esc(feedback)}</p><p class="form-error" data-form-error role="alert" tabindex="-1"></p><div class="account-user-save"><p>${user.id===actor.id?'Alterar sua própria conta atualizará sua sessão.':'Alterações de cargo, acesso ou módulos encerram as sessões desta pessoa.'}</p><button type="submit" class="btn primary">Salvar permissões</button></div></form></details>`;
  }
  function paint(){
    container.innerHTML=`<section class="account-users"><header class="account-users-heading"><div><p class="eyebrow">GESTÃO DE PESSOAS</p><h1>Equipe e acessos</h1><p>O Diretor define o cargo e os módulos de cada pessoa. Abra um cartão para revisar as permissões.</p></div><span class="account-users-total">${users.length} ${users.length===1?'pessoa':'pessoas'}</span></header><details class="account-invite-panel"><summary><span>Convidar uma pessoa</span><span aria-hidden="true">+</span></summary><form class="account-invite"><div class="account-invite-fields"><label>E-mail do convidado<input type="email" name="email" required maxlength="254" autocomplete="email"></label><label>Cargo<select name="role"><option value="maintenance">Equipe de manutenção</option><option value="manager">Gestor</option></select></label></div><div class="account-module-picker">${permissionPicker('maintenance',undefined)}</div><p class="form-error" data-form-error role="alert" tabindex="-1"></p><div class="account-user-save"><p>O convite leva os módulos selecionados. Você poderá alterar as permissões depois.</p><button class="btn primary" type="submit">Gerar convite</button></div></form><div class="account-invite-result" role="status"></div></details><div class="account-user-list" aria-label="Pessoas e permissões">${users.map(user=>userCard(user)).join('')}</div><p class="account-users-footnote">Convites expiram em 72 horas e podem ser usados uma vez. Compartilhe o link apenas com a pessoa convidada. A gestão de usuários é exclusiva do Diretor.</p></section>`;
  }
  function count(form){const count=form.querySelector('[data-module-count]');if(count)count.textContent=`${form.querySelectorAll('input[name="modules"]:checked').length} de ${MODULE_IDS.length} módulos`;}
  function displayError(form,problem){if(cancelled||!form.isConnected)return;const output=form.querySelector('[data-form-error]');output.textContent=problem?.message||'Não foi possível salvar. Tente novamente.';output.focus();}
  function formBusy(form,busy){
    form.dataset.busy=String(busy);form.setAttribute('aria-busy',String(busy));
    const button=form.querySelector('button[type="submit"]');if(button){button.disabled=busy;button.textContent=busy?'Salvando…':form.matches('.account-invite')?'Gerar convite':'Salvar permissões';}
  }
  function change(event){
    const form=event.target.closest('.account-invite,.account-user-form');if(!form||!container.contains(form))return;
    form.querySelector('.account-save-feedback')?.replaceChildren();
    if(event.target.name==='role'){
      const role=event.target.value;form.querySelector('.account-module-picker').innerHTML=permissionPicker(role,undefined);
      form.querySelector('[data-module-note]').textContent=role==='admin'?'Diretor selecionado: acesso completo.':'Os módulos foram ajustados ao padrão do novo cargo. Revise a seleção antes de salvar.';
    }else if(event.target.name==='modules')count(form);
  }
  function click(event){
    const button=event.target.closest('[data-account-action]');if(!button||!container.contains(button))return;
    const form=button.closest('form');if(!form||form.dataset.busy==='true'||form.querySelector('[name="role"]').value==='admin')return;
    const action=button.dataset.accountAction;if(!['select-all','clear-modules'].includes(action))return;
    form.querySelectorAll('input[name="modules"]:not(:disabled)').forEach(input=>{input.checked=action==='select-all';});count(form);
    form.querySelector('.account-save-feedback')?.replaceChildren();
    form.querySelector('[data-module-note]').textContent=action==='clear-modules'?'Nenhum módulo selecionado. A pessoa não terá módulos disponíveis.':'Todos os módulos foram selecionados. As ações continuam seguindo o cargo.';
  }
  async function submit(event){
    const form=event.target.closest('.account-invite,.account-user-form');if(!form||!container.contains(form))return;event.preventDefault();
    if(cancelled||form.dataset.busy==='true'||!form.reportValidity())return;
    const data=new FormData(form),role=String(data.get('role')),modules=role==='admin'?[...MODULE_IDS]:normalizeModules(data.getAll('modules'),role);
    const controls=[...form.querySelectorAll('input,select,button')].map(element=>({element,disabled:element.disabled}));
    form.querySelector('[data-form-error]').textContent='';formBusy(form,true);controls.forEach(({element})=>{element.disabled=true;});
    try{
      if(form.matches('.account-invite')){
        const out=await accountApi('/invite',{email:String(data.get('email')||''),role,modules});if(cancelled)return;
        const url=new URL(location.pathname,location.origin);url.hash='convite='+out.token;
        container.querySelector('.account-invite-result').innerHTML=`<p><strong>Convite criado para ${esc(data.get('email'))}.</strong></p><p>Copie e envie este link para a pessoa:</p><input readonly aria-label="Link do convite" value="${esc(url.href)}"><p class="fine">O aplicativo não envia mensagens automaticamente.</p>`;
      }else{
        const id=form.dataset.user,revision=Number(form.dataset.revision);
        await accountApi('/users',{id,revision,role,active:data.has('active'),modules});if(cancelled)return;
        if(id===actor.id){location.reload();return;}
        const response=await accountApi('/users');if(cancelled)return;
        const updated=response.users?.find(user=>user.id===id);if(!updated)throw new Error('As permissões foram salvas, mas a pessoa não apareceu na atualização. Reabra esta página.');
        users=users.map(user=>user.id===id?updated:user);
        const card=form.closest('.account-user-card');card.outerHTML=userCard(updated,true,'Permissões salvas.');
        const fresh=[...container.querySelectorAll('.account-user-card')].find(item=>item.dataset.accountCard===id);
        fresh?.querySelector('summary')?.focus();
      }
    }catch(problem){displayError(form,problem);}
    finally{if(!cancelled&&form.isConnected){controls.forEach(({element,disabled})=>{element.disabled=disabled;});formBusy(form,false);}}
  }
  container.addEventListener('change',change);container.addEventListener('click',click);container.addEventListener('submit',submit);
  container.innerHTML='<section class="card account-users"><p role="status">Carregando equipe e permissões…</p></section>';
  accountApi('/users').then(result=>{if(cancelled)return;users=Array.isArray(result.users)?result.users:[];paint();}).catch(problem=>{if(!cancelled)container.innerHTML=`<section class="card account-users"><p role="alert">${esc(problem.message)}</p></section>`;});
  return ()=>{cancelled=true;container.removeEventListener('change',change);container.removeEventListener('click',click);container.removeEventListener('submit',submit);};
}

