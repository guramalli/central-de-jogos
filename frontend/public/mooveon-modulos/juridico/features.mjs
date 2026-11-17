import { assert, text, date, integer, today } from '../orcamentos/domain.mjs';
export const ROLE_LABELS = { vini:'Diretoria', caru:'Administrativo · consulta', juridico:'Jurídico', solicitante:'Solicitante interno' };
export const REQUEST_STAGES = { new:'Recebida', analysis:'Em análise', waiting:'Aguardando solicitante', done:'Concluída', cancelled:'Cancelada' };
export const CONTRACT_STAGES = { draft:'Elaboração', review:'Revisão', approval:'Aprovação', signature:'Assinatura', active:'Vigente', closed:'Encerrado' };
export function defaultSettings() { return { editorRoles:['vini','juridico'], approvalRoles:['vini','juridico'], alertDays:7, escalationDays:1, contractApprovalLimitCents:5000000, requestTypes:[{id:'review',name:'Revisão de contrato',slaDays:3,requiredDocuments:['Minuta']},{id:'opinion',name:'Parecer jurídico',slaDays:5,requiredDocuments:[]}], customFields:[], requiredContractDocuments:['Minuta'], roleLabels:{...ROLE_LABELS}, requestStageLabels:{...REQUEST_STAGES}, contractStageLabels:{...CONTRACT_STAGES} }; }
export function upgradeLegal(original) {
  const s = structuredClone(original); s.version = 2;
  for (const key of ['documents','caseRecords','internalRequests','contracts','obligations']) s[key] ||= [];
  s.settings = { ...defaultSettings(), ...s.settings }; s.members ||= [];
  return s;
}
export function legalView(original, actor) {
  assert(actor?.tenantId===original.tenantId,'Acesso negado à empresa.',403);
  const s = upgradeLegal(original);
  if (actor.role !== 'solicitante') return s;
  return { tenantId:s.tenantId,name:s.name,version:s.version,revision:s.revision,seq:0,cases:[],tasks:[],inbox:[],movements:[],documents:[],caseRecords:[],contracts:[],obligations:[],audit:[],members:s.members.filter(m=>m.id===actor.id),settings:{requestTypes:s.settings.requestTypes,customFields:s.settings.customFields.filter(f=>f.scope==='request'),roleLabels:s.settings.roleLabels,requestStageLabels:s.settings.requestStageLabels},internalRequests:s.internalRequests.filter(r=>r.requestedBy===actor.id).map(({internalNotes,caseId,...r})=>r) };
}
export const addDays = (day,n) => { const d = new Date(`${day}T12:00:00Z`); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); };
export const subtractDays = (day,n) => addDays(day,-n);
const url = value => { let u; try { u=new URL(value); } catch { assert(false,'Informe um link HTTPS válido.'); } assert(u.protocol==='https:'&&!u.username&&!u.password,'Use HTTPS sem credenciais na URL.'); return u.href; };
export function customValues(s,scope,values={}) {
  assert(values && typeof values==='object'&&!Array.isArray(values),'Campos adicionais inválidos.');
  const out={}; for (const f of s.settings.customFields.filter(f=>f.scope===scope)) { const v=String(values[f.id]??'').trim(); assert(!f.required||v,`Preencha ${f.label}.`); assert(v.length<=500,'Campo adicional muito longo.'); out[f.id]=v; } return out;
}
export function latestDocuments(s,kind,id) { return s.documents.filter(d=>d.entityKind===kind&&d.entityId===id&&!s.documents.some(n=>n.previousId===d.id)); }
export function desk(s, actor, now=today(), mine=true) {
  const owned=t=>!mine||[t.assigneeId,t.backupId,t.escalatedTo].includes(actor.id)||(!t.assigneeId&&t.owner===actor.name);
  const tasks=s.tasks.filter(t=>!['done','cancelled'].includes(t.status)&&owned(t));
  return { tasks:tasks.filter(t=>t.status==='pending_review'||t.dueDate<=addDays(now,s.settings.alertDays)),unassigned:s.tasks.filter(t=>!t.assigneeId&&!['done','cancelled'].includes(t.status)),inbox:s.inbox.filter(m=>m.status==='pending_review'), requests:s.internalRequests.filter(r=>!['done','cancelled'].includes(r.status)&&(!mine||r.assigneeId===actor.id||r.requestedBy===actor.id)),contracts:s.contracts.filter(c=>c.status==='approval'||(c.status==='active'&&c.endDate&&subtractDays(c.endDate,c.noticeDays)<=addDays(now,s.settings.alertDays))),obligations:s.obligations.filter(o=>o.status==='open'&&owned(o)&&o.dueDate<=addDays(now,s.settings.alertDays)) };
}
export function featureDispatch(s,actor,type,p,at) {
  const id=prefix=>`${prefix}-${++s.seq}`;
  const get=(list,key)=>{const v=s[list].find(x=>x.id===key);assert(v,'Registro não encontrado nesta empresa.',404);return v;};
  const member=key=>{const m=s.members.find(m=>m.id===key);assert(m,'Responsável não pertence à equipe ativa desta empresa.');return m;};
  const editor=()=>assert(s.settings.editorRoles.includes(actor.role),'Seu perfil tem acesso somente à leitura.',403);
  const admin=()=>assert(actor.role==='vini','Somente a diretoria configura a empresa.',403);
  const manageRequest=r=>{if(actor.role==='solicitante')assert(r.requestedBy===actor.id,'Solicitação não encontrada.',404);else editor();};
  const entity=()=>{assert(['case','contract'].includes(p.entityKind),'Tipo de vínculo inválido.');return get(p.entityKind==='case'?'cases':'contracts',p.entityId);};
  const exact=c=>assert(p.revision===c.revision,'A revisão mudou. Atualize e confira novamente.',409);
  const contractData=()=>{ const startDate=date(p.startDate,'Início da vigência'),endDate=date(p.endDate,'Fim da vigência');assert(endDate>=startDate,'Fim da vigência anterior ao início.');const assignee=member(p.assigneeId);assert(assignee.role!=='solicitante','Escolha um responsável interno.');return {title:text(p.title,'Título',200),counterparty:text(p.counterparty,'Contraparte',200),kind:text(p.kind,'Tipo',100),property:String(p.property||'').slice(0,250),amountCents:integer(p.amountCents,'Valor'),startDate,endDate,noticeDays:integer(p.noticeDays,'Antecedência',0,3650),automaticRenewal:p.automaticRenewal===true,adjustment:text(p.adjustment,'Reajuste ou condição de ausência',1000),guarantee:text(p.guarantee,'Garantias ou condição de ausência',1000),assigneeId:assignee.id,owner:assignee.name,caseId:p.caseId?get('cases',p.caseId).id:null,notes:String(p.notes||'').slice(0,10000),custom:customValues(s,'contract',p.custom)};};
  switch(type) {
    case 'settings.update': {
      admin(); const old=s.settings; const next={...old,alertDays:integer(p.alertDays,'Antecedência dos alertas',0,90),escalationDays:integer(p.escalationDays,'Dias para encaminhar atraso',0,30),contractApprovalLimitCents:integer(p.contractApprovalLimitCents,'Alçada de contratos')};
      assert(Array.isArray(p.requestTypes)&&p.requestTypes.length>0&&p.requestTypes.length<=30,'Cadastre de 1 a 30 tipos de solicitação.');
      const labels=list=>{assert(Array.isArray(list)&&list.length<=20,'Lista inválida.');return [...new Set(list.map(x=>text(x,'Documento',100)))];};
      for(const key of ['editorRoles','approvalRoles']){const values=p[key]||old[key];assert(Array.isArray(values)&&values.every(r=>['vini','caru','juridico'].includes(r)),'Perfis inválidos.');next[key]=[...new Set(['vini',...values])];}
      assert(next.approvalRoles.every(r=>next.editorRoles.includes(r)),'Aprovadores também precisam poder editar registros.');
      next.requestTypes=p.requestTypes.map(t=>({id:text(t.id,'Código',50),name:text(t.name,'Tipo',100),slaDays:integer(t.slaDays,'Prazo interno',0,365),requiredDocuments:labels(t.requiredDocuments)}));
      assert(new Set(next.requestTypes.map(t=>t.id)).size===next.requestTypes.length,'Códigos de solicitação repetidos.');
      next.requiredContractDocuments=labels(p.requiredContractDocuments);
      assert(Array.isArray(p.customFields)&&p.customFields.length<=30,'Até 30 campos adicionais.');
      next.customFields=p.customFields.map(f=>{assert(/^[a-z][a-z0-9_]{0,39}$/.test(f.id)&&!['__proto__','constructor','prototype'].includes(f.id),'Código de campo inválido.');assert(['case','contract','request'].includes(f.scope),'Escopo inválido.');return {id:f.id,label:text(f.label,'Nome do campo',100),scope:f.scope,required:f.required===true};});
      assert(new Set(next.customFields.map(f=>f.id)).size===next.customFields.length,'Campos repetidos.');
      for(const [key,base] of [['roleLabels',ROLE_LABELS],['requestStageLabels',REQUEST_STAGES],['contractStageLabels',CONTRACT_STAGES]]) next[key]=Object.fromEntries(Object.keys(base).map(k=>[k,text(p[key]?.[k]||old[key]?.[k]||base[k],'Rótulo',70)]));
      s.settings=next;
      for(const c of s.contracts.filter(c=>['approval','signature'].includes(c.status))) {c.history.push({at,reason:'Configuração alterada',snapshot:{revision:c.revision,status:c.status,approval:c.approval}});c.status='review';c.approval=null;}
      return {id:s.tenantId,...next};
    }
    case 'task.assign': {
      editor();const t=get('tasks',p.id);assert(!['done','cancelled'].includes(t.status),'Tarefa encerrada.');const m=member(p.assigneeId);
      assert(m.role!=='solicitante','Solicitantes não recebem tarefas jurídicas internas.');
      for(const key of ['backupId','supervisorId']) if(p[key])assert(member(p[key]).role!=='solicitante','Escolha alguém da equipe jurídica.');
      t.assigneeId=m.id;t.owner=m.name;t.backupId=p.backupId||null;t.supervisorId=p.supervisorId||null;t.acknowledgedAt=null;t.acknowledgedBy=null;t.escalatedTo=null;return t;
    }
    case 'task.acknowledge': {const t=get('tasks',p.id);assert(!['done','cancelled'].includes(t.status),'Tarefa encerrada.');assert([t.assigneeId,t.backupId,t.escalatedTo].includes(actor.id),'Somente o responsável, substituto ou gestor designado pode confirmar recebimento.',403);t.acknowledgedAt=at;t.acknowledgedBy=actor.id;return t;}
    case 'task.escalate': {editor();const t=get('tasks',p.id);assert(!['done','cancelled'].includes(t.status),'Tarefa encerrada.');assert(t.supervisorId,'Defina um gestor na distribuição da tarefa.');member(t.supervisorId);t.escalatedTo=t.supervisorId;t.escalationReason=text(p.reason,'Motivo',1000);t.escalatedAt=at;return t;}
    case 'case.record': {editor();const c=get('cases',p.caseId);assert(['party','contact','note','expense','agreement','next_step'].includes(p.kind),'Tipo inválido.');const r={id:id('registro'),caseId:c.id,kind:p.kind,title:text(p.title,'Título',200),body:text(p.body,'Descrição',5000),amountCents:['expense','agreement'].includes(p.kind)?integer(p.amountCents,'Valor'):null,at,by:actor.id};s.caseRecords.push(r);return r;}
    case 'case.custom': {editor();const c=get('cases',p.id);c.custom=customValues(s,'case',p.custom);return c;}
    case 'document.add': {
      editor();const e=entity();if(p.entityKind==='contract')assert(!['active','closed'].includes(e.status),'Contrato vigente: crie um aditivo para alterar documentos.');
      const title=text(p.title,'Documento',100),previous=latestDocuments(s,p.entityKind,e.id).find(d=>d.title===title);
      assert((p.previousId||null)===(previous?.id||null),'A versão do documento mudou.',409);
      let file=null;if(p.file){assert(['application/pdf','image/png','image/jpeg','text/plain'].includes(p.file.mime),'Formato não permitido.');assert(typeof p.file.base64==='string'&&/^[A-Za-z0-9+/]*={0,2}$/.test(p.file.base64)&&p.file.base64.length<=350000,'Arquivo inválido ou maior que 256 KB.');let raw;try{raw=atob(p.file.base64);}catch{assert(false,'Conteúdo de arquivo inválido.');}assert(raw.length>0&&raw.length<=262144,'Arquivo vazio ou maior que 256 KB.');const mime=p.file.mime;assert(mime==='text/plain'||(mime==='application/pdf'&&raw.startsWith('%PDF-'))||(mime==='image/png'&&raw.startsWith('\x89PNG\r\n\x1a\n'))||(mime==='image/jpeg'&&raw.startsWith('\xff\xd8\xff')),'O conteúdo não corresponde ao formato.');const filename=text(p.file.name,'Nome do arquivo',150);const extension={'application/pdf':/\.pdf$/i,'image/png':/\.png$/i,'image/jpeg':/\.jpe?g$/i,'text/plain':/\.txt$/i}[mime];assert(extension.test(filename)&&!/[\\/\x00-\x1f]/.test(filename),'Nome e extensão devem corresponder ao formato permitido.');file={name:filename,mime,base64:p.file.base64,size:raw.length};}
      assert(file||p.url,'Anexe um arquivo ou informe um link.');
      const d={id:id('doc'),entityKind:p.entityKind,entityId:e.id,title,previousId:previous?.id||null,version:(previous?.version||0)+1,url:p.url?url(p.url):'',file,note:text(p.note,'Descrição da versão',1000),at,by:actor.id};s.documents.push(d);
      if(p.entityKind==='contract'){e.history.push({at,reason:'Documento revisado',snapshot:{revision:e.revision,status:e.status,approval:e.approval}});e.revision++;e.status='draft';e.approval=null;e.editedBy=actor.id;}
      return d;
    }
    case 'internal.create': {
      assert(actor.role==='solicitante'||s.settings.editorRoles.includes(actor.role),'Sem permissão para solicitar.',403);const t=s.settings.requestTypes.find(t=>t.id===p.typeId);assert(t,'Tipo de solicitação não encontrado.');
      assert(!p.documents||Array.isArray(p.documents),'Documentos inválidos.');const docs=(p.documents||[]).map(d=>({name:text(d.name,'Documento',100),url:url(d.url)}));assert(docs.length<=20,'Até 20 documentos.');
      const r={id:id('demanda'),title:text(p.title,'Assunto',200),body:text(p.body,'Descrição',10000),department:text(p.department,'Setor',100),typeId:t.id,typeName:t.name,requiredDocuments:[...t.requiredDocuments],documents:docs,requestedBy:actor.id,requesterName:actor.name,priority:['normal','high','urgent'].includes(p.priority)?p.priority:'normal',status:'new',createdAt:at,dueDate:addDays(today(),t.slaDays),slaDays:t.slaDays,assigneeId:null,publicUpdates:[],internalNotes:[],custom:customValues(s,'request',p.custom)};s.internalRequests.push(r);return r;
    }
    case 'internal.comment': {const r=get('internalRequests',p.id);manageRequest(r);assert(!['done','cancelled'].includes(r.status),'Solicitação encerrada.');const note={at,by:actor.id,name:actor.name,body:text(p.body,'Comentário',5000)};if(p.private===true){editor();r.internalNotes.push(note);}else r.publicUpdates.push(note);return r;}
    case 'internal.document': {const r=get('internalRequests',p.id);manageRequest(r);assert(!['done','cancelled'].includes(r.status),'Solicitação encerrada.');r.documents.push({name:text(p.name,'Documento',100),url:url(p.url),at,by:actor.id});assert(r.documents.length<=50,'Limite de documentos atingido.');return r;}
    case 'internal.update': {
      editor();const r=get('internalRequests',p.id);assert(!['done','cancelled'].includes(r.status),'Solicitação encerrada.');assert(Object.hasOwn(REQUEST_STAGES,p.status),'Etapa inválida.');
      const m=member(p.assigneeId);assert(s.settings.editorRoles.includes(m.role),'Distribua a um responsável autorizado a editar.');
      if(['analysis','done'].includes(p.status))assert(r.requiredDocuments.every(n=>r.documents.some(d=>d.name===n)),'Faltam documentos obrigatórios.');
      r.status=p.status;r.assigneeId=m.id;r.owner=m.name;r.publicUpdates.push({at,by:actor.id,name:actor.name,body:text(p.message,'Retorno ao solicitante',5000)});if(['done','cancelled'].includes(r.status))r.closedAt=at;return r;
    }
    case 'contract.create': {editor();const c={id:id('contrato'),...contractData(),...(p.registryRef?{registryRef:structuredClone(p.registryRef)}:{}),parentId:p.parentId?get('contracts',p.parentId).id:null,status:'draft',revision:1,approval:null,history:[],createdBy:actor.id,editedBy:actor.id,createdAt:at};if(c.parentId)assert(get('contracts',c.parentId).status==='active','Aditivo exige contrato principal vigente.');s.contracts.push(c);return c;}
    case 'contract.revise': {editor();const c=get('contracts',p.id);exact(c);assert(!['active','closed'].includes(c.status),'Contrato vigente/encerrado não pode ser sobrescrito. Crie aditivo.');const {history,...snapshot}=c;history.push({at,reason:'Cadastro revisado',snapshot:structuredClone(snapshot)});Object.assign(c,contractData(),p.registryRef?{registryRef:structuredClone(p.registryRef)}:{},{revision:c.revision+1,status:'draft',approval:null,editedBy:actor.id});return c;}
    case 'contract.transition': {
      editor();const c=get('contracts',p.id);exact(c);const next=p.status;
      const graph={draft:['review'],review:['draft','approval'],approval:['draft','signature'],signature:['draft','active'],active:['closed'],closed:[]};assert(graph[c.status].includes(next),'Transição de contrato inválida.');
      const note=text(p.note,'Parecer / evidência',2000);
      if(['approval','signature','active'].includes(next)){customValues(s,'contract',c.custom);assert(s.settings.requiredContractDocuments.every(n=>latestDocuments(s,'contract',c.id).some(d=>d.title===n)),'Faltam documentos obrigatórios do contrato.');}
      if(next==='signature'){assert(s.settings.approvalRoles.includes(actor.role),'Perfil sem permissão de aprovar contratos.',403);assert(actor.id!==c.editedBy,'Aprovador deve ser diferente do último editor.');assert(actor.role==='vini'||c.amountCents<=s.settings.contractApprovalLimitCents,'Acima da alçada jurídica; encaminhe à diretoria.');c.approval={by:actor.id,at,revision:c.revision,documentIds:latestDocuments(s,'contract',c.id).map(d=>d.id),note};}
      if(next==='active'){assert(c.approval?.revision===c.revision,'Aprovação da versão exata exigida.');c.signatureEvidence=note;c.signedAt=at;}
      if(next==='closed'){assert(!s.obligations.some(o=>o.contractId===c.id&&o.status==='open'),'Conclua ou cancele as obrigações antes de encerrar.');c.closeEvidence=note;c.closedAt=at;}
      c.history.push({at,by:actor.id,from:c.status,to:next,note,revision:c.revision});c.status=next;if(next==='draft')c.approval=null;return c;
    }
    case 'obligation.create': {editor();const c=get('contracts',p.contractId);assert(c.status!=='closed','Contrato encerrado.');const m=member(p.assigneeId);assert(m.role!=='solicitante','Escolha um responsável interno.');const o={id:id('obrigacao'),contractId:c.id,title:text(p.title,'Obrigação',200),party:text(p.party,'Parte obrigada',200),dueDate:date(p.dueDate,'Vencimento'),assigneeId:m.id,owner:m.name,source:text(p.source,'Cláusula / fonte',2000),status:'open',at};s.obligations.push(o);return o;}
    case 'obligation.complete': case 'obligation.cancel': {editor();const o=get('obligations',p.id);assert(o.status==='open','Obrigação encerrada.');o.status=type.endsWith('complete')?'done':'cancelled';o.evidence=text(p.evidence,'Evidência / motivo',2000);o.closedAt=at;o.closedBy=actor.id;return o;}
    default:return null;
  }
}
