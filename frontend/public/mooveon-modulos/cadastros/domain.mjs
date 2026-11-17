import { assert, text } from '../orcamentos/domain.mjs';
export const MODULES={billing:'Cobrança',legal:'Jurídico',procurement:'Orçamentos'};
export const MODULE_PAGES={billing:'/mooveon/cobranca',legal:'/mooveon/juridico',procurement:'/orcamentos'};
const optional=(v,max=1000)=>v?text(v,'Campo',max):'';
export function emptyRegistry(tenantId,name,enabledModules=Object.keys(MODULES)){return {version:1,tenantId,name,revision:0,seq:0,enabledModules:[...new Set(enabledModules)],enterprises:[],customers:[],properties:[],audit:[]};}
export function registryAccess(s,actor,module){assert(s.tenantId===actor?.tenantId&&s.enabledModules.includes(module)&&actor.modules?.includes(module)&&actor.role!=='solicitante','Cadastro compartilhado não autorizado neste módulo.',403);}
export function registryCanWrite(actor,module,moduleState){return module==='legal'?(moduleState.settings?.editorRoles||['vini','juridico']).includes(actor.role):module==='billing'?['vini','cobranca'].includes(actor.role):['vini','caru'].includes(actor.role);}
export function registryView(s,actor,module){
  registryAccess(s,actor,module);const enterprises=s.enterprises.filter(e=>e.modules.includes(module)),customers=s.customers.filter(c=>c.modules.includes(module));
  return {...s,enterprises:structuredClone(enterprises),customers:structuredClone(customers),properties:structuredClone(s.properties.filter(p=>customers.some(c=>c.id===p.customerId)&&(!p.enterpriseId||enterprises.some(e=>e.id===p.enterpriseId)))),audit:[]};
}
export function registryDispatch(original,actor,module,command,canWrite){
  registryAccess(original,actor,module);assert(canWrite,'Perfil sem permissão para editar cadastros compartilhados.',403);
  const s=structuredClone(original),p=command.payload||{},at=new Date().toISOString(),next=prefix=>`${prefix}-${++s.seq}`;let result,before=null;
  const get=(list,id)=>{const item=registryView(s,actor,module)[list].find(x=>x.id===id);assert(item,'Cadastro não disponível neste módulo e empresa.',404);return s[list].find(x=>x.id===id);};
  const modules=v=>{assert(Array.isArray(v)&&v.length>0&&v.every(m=>s.enabledModules.includes(m))&&v.includes(module),'Escolha módulos habilitados, incluindo o módulo de origem.');return [...new Set(v)];};
  const save=(list,prefix,data)=>{if(p.id){result=get(list,p.id);before=structuredClone(result);Object.assign(result,data,{version:result.version+1});}else{result={id:next(prefix),version:1,...data};s[list].push(result);}result.updatedAt=at;result.updatedBy=actor.name;};
  switch(command.type){
    case 'enterprise.save': {
      const name=text(p.name,'Nome do empreendimento',150),registration=optional(p.registration,100);
      assert(!s.enterprises.some(e=>e.id!==p.id&&e.name.toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR')),'Empreendimento já cadastrado. Consulte os cadastros existentes.');
      save('enterprises','emp',{name,address:text(p.address,'Endereço',500),registration,modules:modules(p.modules)});break;
    }
    case 'customer.save': {
      const document=optional(p.document,60).toUpperCase().replace(/[^A-Z0-9]/g,'');
      assert(!document||/^\d{11}$/.test(document)||/^[A-Z0-9]{12}\d{2}$/.test(document),'CPF/CNPJ: informe 11 dígitos ou 14 caracteres de CNPJ, ou deixe vazio.');
      assert(!document||!s.customers.some(c=>c.id!==p.id&&c.document===document),'Documento já cadastrado. Consulte o responsável pelos cadastros.');
      save('customers','cli',{name:text(p.name,'Nome do cliente',200),document,email:optional(p.email,254),phone:optional(p.phone,100),address:optional(p.address,1000),modules:modules(p.modules)});break;
    }
    case 'property.save': {
      const c=get('customers',p.customerId),e=p.enterpriseId?get('enterprises',p.enterpriseId):null,unit=text(p.unit,'Unidade / imóvel',200);
      assert(!s.properties.some(x=>x.id!==p.id&&x.customerId===c.id&&x.enterpriseId===(e?.id||'')&&x.unit.toLocaleLowerCase('pt-BR')===unit.toLocaleLowerCase('pt-BR')),'Este cliente já está vinculado a essa unidade.');
      if(p.id)assert(get('properties',p.id).customerId===c.id,'Não altere o cliente de um vínculo existente.');
      save('properties','imo',{customerId:c.id,enterpriseId:e?.id||'',unit,propertyType:text(p.propertyType,'Tipo de imóvel',100),address:text(p.address||e?.address,'Endereço do imóvel',1000),registration:optional(p.registration,200)});break;
    }
    case 'enterprise.share': {
      const e=get('enterprises',p.enterpriseId),targets=modules(p.modules);
      assert(Array.isArray(p.customerIds)&&p.customerIds.length&&p.customerIds.length<=5000,'Selecione os clientes a disponibilizar.');
      const customers=[...new Set(p.customerIds)].map(id=>get('customers',id));
      assert(customers.every(c=>s.properties.some(x=>x.customerId===c.id&&x.enterpriseId===e.id)),'Um dos clientes não está ligado a este empreendimento.');
      before={enterprise:structuredClone(e),customers:structuredClone(customers)};
      for(const row of [e,...customers]){row.modules=[...new Set([...row.modules,...targets])];row.version++;row.updatedAt=at;row.updatedBy=actor.name;}
      result={id:e.id,enterprise:structuredClone(e),customers:structuredClone(customers),count:customers.length};break;
    }
    default:assert(false,'Operação de cadastro desconhecida.',404);
  }
  s.revision++;s.audit.push({id:next('ev'),type:command.type,entityId:result.id,at,actorId:actor.id,actorName:actor.name,module,before,after:structuredClone(result)});
  return {state:s,result};
}
export function registrySelection(s,actor,module,pick){
  const view=registryView(s,actor,module);assert(pick&&pick.revision===s.revision,'Cadastro compartilhado atualizado. Selecione novamente antes de salvar.',409);
  const customer=pick.customerId?view.customers.find(c=>c.id===pick.customerId):null,property=pick.propertyId?view.properties.find(p=>p.id===pick.propertyId):null;
  assert(!pick.customerId||customer,'Cliente não disponível.',404);assert(!pick.propertyId||property&&property.customerId===customer?.id,'Imóvel não pertence ao cliente disponível.',404);
  const enterpriseId=property?.enterpriseId||pick.enterpriseId||'',enterprise=enterpriseId?view.enterprises.find(e=>e.id===enterpriseId):null;
  assert(!enterpriseId||enterprise,'Empreendimento não disponível.',404);assert(customer||enterprise,'Selecione cliente ou empreendimento.');
  if(pick.enterpriseId&&property)assert(pick.enterpriseId===property.enterpriseId,'Empreendimento não corresponde ao imóvel.');
  return {customer,property,enterprise,ref:{customerId:customer?.id||'',propertyId:property?.id||'',enterpriseId:enterprise?.id||'',registryRevision:s.revision,customerVersion:customer?.version||0,enterpriseVersion:enterprise?.version||0,propertyVersion:property?.version||0,linkedAt:new Date().toISOString()}};
}
export function prepareRegistryCommand(s,actor,module,command){
  const prepared=structuredClone(command);prepared.payload||={};const p=prepared.payload,pick=p.registrySelection;delete p.registryRef;delete p.registrySelection;
  if(!pick)return prepared;
  const allowed={billing:['contract.save'],legal:['case.create','case.update','contract.create','contract.revise'],procurement:['work.create']};
  assert(allowed[module]?.includes(prepared.type),'Este registro não aceita vínculo de cadastro.');
  const {customer:c,enterprise:e,property:i,ref}=registrySelection(s,actor,module,pick);
  if(module==='billing'){
    assert(c,'Selecione o cliente.');Object.assign(p,{clientName:c.name,document:c.document,phone:c.phone,email:c.email,clientAddress:c.address});
    if(i)Object.assign(p,{propertyMode:e?'project':'standalone',project:e?.name||'',propertyType:i.propertyType,unit:i.unit,propertyAddress:i.address,registration:i.registration});
    else if(e)Object.assign(p,{propertyMode:'project',project:e.name,propertyAddress:e.address});
  }else if(module==='legal'){
    assert(c,'Selecione o cliente.');p[prepared.type.startsWith('case.')?'name':'counterparty']=c.name;
    if(e||i)p.property=[e?.name,i?.unit].filter(Boolean).join(' · ').slice(0,250);
  }else {assert(e,'Selecione o empreendimento.');p.name=e.name;p.address=e.address;}
  p.registryRef=ref;return prepared;
}
