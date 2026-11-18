// Independent maintenance records. No financial cost, payment, or project mutation.
export const MAINTENANCE_STATUSES = Object.freeze(['open','scheduled','in_progress','waiting','completed','cancelled']);
export const MAINTENANCE_PRIORITIES = Object.freeze(['low','normal','high','urgent']);
export const MAINTENANCE_KINDS = Object.freeze(['assistance','maintenance']);
export const MAINTENANCE_LIMITS = Object.freeze({tickets:10000,properties:2000,history:5000,title:160,description:6000,comment:4000,address:400});
const ROLES = new Set(['admin','manager','maintenance']);
const MANAGERS = new Set(['admin','manager']);
const OPERATIONAL = new Set(['scheduled','in_progress','waiting']);
const CLOSED = new Set(['completed','cancelled']);
const TICKET_FIELDS = ['projectId','unitId','propertyId','kind','title','description','priority','assigneeId','scheduledDate'];

export class MaintenanceError extends Error {
  constructor(message,code='validation',status=400){super(message);this.name='MaintenanceError';this.code=code;this.status=status;}
}
const fail=(message,code,status)=>{throw new MaintenanceError(message,code,status);};
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const clone=value=>structuredClone(value);
function text(value,label,max,{optional=false}={}){
  if(optional&&(value===undefined||value===null||value===''))return '';
  if(typeof value!=='string')fail(`${label} deve ser um texto.`);
  const out=value.trim();
  if((!optional&&!out)||out.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(out))fail(`${label} deve ter ${optional?'até':'entre 1 e'} ${max} caracteres válidos.`);
  return out;
}
const identifier=(value,label,optional=false)=>text(value,label,120,{optional});
function actorOf(actor){
  if(!object(actor)||!ROLES.has(actor.role)||typeof actor.id!=='string'||!actor.id.trim())fail('Acesso à manutenção não autorizado.','forbidden',403);
  return {id:identifier(actor.id,'Usuário'),role:actor.role};
}
function stateOf(state){
  if(!object(state)||!Number.isSafeInteger(state.revision)||state.revision<0||!Array.isArray(state.tickets)||!Array.isArray(state.properties))fail('Base de manutenção inválida.');
  if(state.tickets.length>MAINTENANCE_LIMITS.tickets||state.properties.length>MAINTENANCE_LIMITS.properties)fail('Limite da base de manutenção excedido.');
  return state;
}
function requireManager(actor){if(!MANAGERS.has(actor.role))fail('Somente a gestão pode executar esta ação.','forbidden',403);}
function allowedKeys(payload,allowed){
  if(!object(payload))fail('Dados do comando inválidos.');
  if(Object.keys(payload).some(key=>!allowed.includes(key)))fail('O comando contém campos não permitidos.');
}
function timestamp(now){
  const value=typeof now==='function'?now():now===undefined?new Date().toISOString():now;
  if(typeof value!=='string'||!Number.isFinite(Date.parse(value)))fail('Data do registro inválida.');
  return new Date(value).toISOString();
}
function date(value){
  const result=text(value,'Data agendada',10,{optional:true});
  if(!result)return '';
  if(!/^\d{4}-\d{2}-\d{2}$/u.test(result))fail('Informe a data agendada no formato AAAA-MM-DD.');
  const parsed=new Date(`${result}T12:00:00.000Z`);
  if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==result)fail('Data agendada inválida.');
  return result;
}
function enumeration(value,values,label){if(!values.includes(value))fail(`${label} inválido.`);return value;}
function newId(){return globalThis.crypto.randomUUID();}
function event(actor,at,action,changes={},comment=''){
  return {id:newId(),at,actorId:actor.id,actorRole:actor.role,action,changes:clone(changes),comment};
}
function record(target,entry){
  if(!Array.isArray(target.history))fail('Histórico do registro inválido.');
  if(target.history.length>=MAINTENANCE_LIMITS.history)fail('O histórico atingiu o limite. Nenhum registro foi apagado.','limit',413);
  target.history.push(entry);target.updatedAt=entry.at;
}
function assignee(value,users){
  const id=identifier(value,'Responsável',true);
  if(!id)return '';
  const user=users.find(item=>item.id===id);
  if(!user||!['manager','maintenance'].includes(user.role)||user.active===false||user.disabled===true)fail('Escolha um responsável ativo da gestão ou da manutenção.');
  return id;
}
function relation(source,state,projects){
  const projectId=identifier(source.projectId,'Empreendimento',true),unitId=identifier(source.unitId,'Casa',true),propertyId=identifier(source.propertyId,'Imóvel',true);
  if(propertyId){
    if(projectId||unitId)fail('Escolha uma casa do empreendimento ou um imóvel cadastrado, sem misturar vínculos.');
    if(!state.properties.some(item=>item.id===propertyId))fail('Imóvel não encontrado nesta base.');
  }else{
    if(!projectId||!unitId)fail('Selecione o empreendimento e a casa, ou um imóvel cadastrado.');
    const project=projects.find(item=>item.id===projectId);
    if(!project||!Array.isArray(project.units)||!project.units.some(unit=>unit.id===unitId))fail('A casa não pertence ao empreendimento informado.');
  }
  return {projectId,unitId,propertyId};
}
function ticketData(payload,state,context){
  return {
    ...relation(payload,state,context.projects),
    kind:enumeration(payload.kind,MAINTENANCE_KINDS,'Tipo de chamado'),
    title:text(payload.title,'Título',MAINTENANCE_LIMITS.title),
    description:text(payload.description,'Descrição',MAINTENANCE_LIMITS.description,{optional:true}),
    priority:enumeration(payload.priority,MAINTENANCE_PRIORITIES,'Prioridade'),
    assigneeId:assignee(payload.assigneeId,context.users),scheduledDate:date(payload.scheduledDate),
  };
}
function lookupTicket(state,id,actor){
  const ticket=state.tickets.find(item=>item.id===identifier(id,'Chamado'));
  if(!ticket||(actor.role==='maintenance'&&ticket.assigneeId!==actor.id))fail('Chamado não encontrado.','not_found',404);
  return ticket;
}
function changed(before,after,keys){
  return Object.fromEntries(keys.filter(key=>before[key]!==after[key]).map(key=>[key,{from:before[key]??'',to:after[key]??''}]));
}

export function maintenanceEmpty(){return {revision:0,tickets:[],properties:[]};}

/** Filtering is required both on reads and after every command. Metadata must also
 * be organization-scoped by the HTTP adapter before being sent to the client. */
export function maintenanceView(state,actor){
  stateOf(state);const authorized=actorOf(actor);
  const tickets=authorized.role==='maintenance'?state.tickets.filter(item=>item.assigneeId===authorized.id):state.tickets;
  const referenced=new Set(tickets.map(item=>item.propertyId).filter(Boolean));
  const properties=authorized.role==='maintenance'?state.properties.filter(item=>referenced.has(item.id)):state.properties;
  return clone({revision:state.revision,tickets,properties});
}

/** Pure with respect to inputs: returns a new state and never mutates context.
 * UUID/time are generated only for accepted commands. Persistence must perform
 * its own atomic compare-and-swap using the submitted revision. */
export function maintenanceCommand(state,command,context={}){
  stateOf(state);const actor=actorOf(context.actor);
  if(!object(command)||!Number.isSafeInteger(command.revision)||command.revision!==state.revision)fail('A manutenção foi atualizada por outra pessoa. Atualize a tela e tente novamente.','conflict',409);
  if(state.revision===Number.MAX_SAFE_INTEGER)fail('Limite de revisões atingido.','limit',413);
  const payload=command.payload??{},type=command.type;
  if(!object(payload))fail('Dados do comando inválidos.');
  const ctx={projects:Array.isArray(context.projects)?context.projects:[],users:Array.isArray(context.users)?context.users:[]};
  const next=clone(state),at=timestamp(context.now);
  if(type==='property-create'||type==='property-update'){
    requireManager(actor);allowedKeys(payload,type==='property-create'?['name','address']:['id','name','address']);
    if(type==='property-create'){
      if(next.properties.length>=MAINTENANCE_LIMITS.properties)fail('Limite de imóveis atingido.','limit',413);
      const property={id:newId(),name:text(payload.name,'Nome do imóvel',160),address:text(payload.address,'Endereço',MAINTENANCE_LIMITS.address,{optional:true}),createdAt:at,updatedAt:at,createdBy:actor.id,history:[]};
      record(property,event(actor,at,'property-created',{name:{from:'',to:property.name},address:{from:'',to:property.address}}));next.properties.push(property);
    }else{
      const property=next.properties.find(item=>item.id===identifier(payload.id,'Imóvel'));
      if(!property)fail('Imóvel não encontrado.','not_found',404);
      const update={name:own(payload,'name')?text(payload.name,'Nome do imóvel',160):property.name,address:own(payload,'address')?text(payload.address,'Endereço',MAINTENANCE_LIMITS.address,{optional:true}):property.address};
      const changes=changed(property,update,['name','address']);
      if(!Object.keys(changes).length)fail('Nenhuma alteração foi informada.');
      Object.assign(property,update);record(property,event(actor,at,'property-updated',changes));
    }
  }else if(type==='ticket-create'){
    requireManager(actor);allowedKeys(payload,TICKET_FIELDS);
    if(next.tickets.length>=MAINTENANCE_LIMITS.tickets)fail('Limite de chamados atingido.','limit',413);
    const data=ticketData({kind:'maintenance',priority:'normal',...payload},next,ctx);
    const ticket={id:newId(),...data,status:'open',createdAt:at,updatedAt:at,createdBy:actor.id,history:[]};
    record(ticket,event(actor,at,'created',changed({},ticket,[...TICKET_FIELDS,'status'])));next.tickets.push(ticket);
  }else if(type==='ticket-update'){
    requireManager(actor);allowedKeys(payload,['id',...TICKET_FIELDS]);
    const ticket=lookupTicket(next,payload.id,actor);
    if(CLOSED.has(ticket.status))fail('Reabra o chamado antes de alterar seus dados.');
    const data=ticketData({...ticket,...payload},next,ctx),changes=changed(ticket,data,TICKET_FIELDS);
    if(!Object.keys(changes).length)fail('Nenhuma alteração foi informada.');
    Object.assign(ticket,data);record(ticket,event(actor,at,'updated',changes));
  }else if(type==='ticket-status'){
    allowedKeys(payload,['id','status','comment']);const ticket=lookupTicket(next,payload.id,actor);
    const status=enumeration(payload.status,MAINTENANCE_STATUSES,'Andamento');
    if(status===ticket.status)fail('O chamado já está nesse andamento.');
    if(actor.role==='maintenance'&&(!OPERATIONAL.has(status)||CLOSED.has(ticket.status)))fail('Você pode atualizar apenas o andamento operacional dos chamados atribuídos a você.','forbidden',403);
    if(CLOSED.has(ticket.status)&&status!=='open')fail('Reabra o chamado antes de alterar seu andamento.');
    const comment=text(payload.comment,'Observação',MAINTENANCE_LIMITS.comment,{optional:true});
    if((status==='cancelled'||CLOSED.has(ticket.status))&&!comment)fail('Informe uma justificativa para cancelar ou reabrir o chamado.');
    const previous=ticket.status;ticket.status=status;
    if(status==='completed')ticket.completedAt=at;
    if(status==='cancelled')ticket.cancelledAt=at;
    if(CLOSED.has(previous)&&status==='open'){delete ticket.completedAt;delete ticket.cancelledAt;}
    record(ticket,event(actor,at,status==='open'&&CLOSED.has(previous)?'reopened':'status-changed',{status:{from:previous,to:status}},comment));
  }else if(type==='ticket-comment'){
    allowedKeys(payload,['id','comment']);const ticket=lookupTicket(next,payload.id,actor);
    const comment=text(payload.comment,'Comentário',MAINTENANCE_LIMITS.comment);
    record(ticket,event(actor,at,'commented',{},comment));
  }else fail('Comando de manutenção desconhecido.');
  next.revision=state.revision+1;
  return next;
}
