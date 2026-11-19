import {canAccess,normalizeModules,fullFinancialAccess} from './access-domain.mjs';
import {isContractor,totals,scenario,received} from './workspace-domain.mjs';
export function requireModule(actor,id){if(!canAccess(actor,id))throw Object.assign(new Error('O Diretor não liberou este módulo para seu acesso.'),{status:403});}
const pick=(obj,keys)=>Object.fromEntries(keys.filter(k=>obj[k]!==undefined).map(k=>[k,structuredClone(obj[k])]));
export function workspaceView(state,actor){
 if(actor.role==='admin')return structuredClone(state);
 const has=id=>canAccess(actor,id),analysis=has('profit')||has('history'),costs=has('costs'),sales=has('sales'),receipts=has('receipts');
 const result={version:state.version,revision:state.revision,seq:state.seq,projects:[],comparables:has('market')?structuredClone(state.comparables):[],audit:[]};
 if(!normalizeModules(actor.modules,actor.role).some(id=>id!=='maintenance'))return null;
 result.projects=state.projects.filter(p=>!p.trashedAt||has('project')).map(p=>{
 const base=pick(p,['id','diaryKey','name','address','neighborhood','zone','type','bedrooms','start','status','trashedAt','allocation']);
 Object.assign(base,{notes:has('project')?p.notes||'':'',reserveBps:analysis?p.reserveBps:0,sellingBps:analysis?p.sellingBps:0,targetBps:analysis?p.targetBps:0});
 base.units=p.units.map(u=>({...pick(u,['id','name','area','bedrooms','bathrooms','parking']),sale:sales||analysis||has('project')?u.sale:0,notes:has('project')?u.notes||'':'',...(sales&&u.commercial?{commercial:structuredClone(u.commercial)}:{})}));
 base.stages=p.stages.map(s=>({...pick(s,['id','name','unassigned','trackProgress']),progress:has('stages')?s.progress:0,budget:costs?s.budget:0}));
 base.expenses=p.expenses.filter(e=>costs||has('contractors')&&isContractor(e)||sales&&e.saleId).map(e=>{const row=structuredClone(e);if(!has('contractors'))delete row.contractFile;return row;});
 base.sales=sales?(p.sales||[]).map(s=>{
  const sale=structuredClone(s);
  if(!receipts){
   sale.receipts=[];
   sale.receiptSummary={total:received(s),installments:Object.fromEntries(s.installments.map(i=>[i.id,received(s,i.id)])),hasHistory:s.receipts.length>0};
  }
  return sale;
 }):receipts?(p.sales||[]).map(s=>({...pick(s,['id','unitId','price','buyer','paymentMode','date','installments','receipts','cancelled']),commissionCents:0})):[];
 if(analysis){const t=totals(p);base.analysis={...pick(t,['contracted','paid','pending','budget','base','reserve','forecast','revenue','selling','sellingEstimate','commissionBooked','profit','margin','returnOnCost','area','costPerSqm','breakEven','targetRevenue','revenueGoals']),units:t.units.map(u=>pick(u,['id','name','area','bedrooms','sale','sold','contracted','paid','forecast','selling','profit','margin'])),scenarios:Object.fromEntries([-1000,0,1000].map(v=>[v,scenario(p,v)])),labor:p.expenses.filter(e=>!e.cancelled&&e.kind==='labor').reduce((n,e)=>n+e.total,0),missingStages:p.stages.filter(st=>st.budget===0&&!p.expenses.some(e=>!e.cancelled&&e.stageId===st.id)).length};}
 if(has('history'))base.historyExpenses=p.expenses.filter(e=>!e.cancelled&&['material','labor','equipment'].includes(e.kind)).map(e=>pick(e,['description','kind','uom','qty','total','date']));
 return base;
 });return result;
}
export function authorizeCommand(actor,state,type,payload){
 const p=state.projects.find(p=>p.id===payload.projectId),e=p?.expenses.find(e=>e.id===payload.id);
 const mapped={'comparable.save':'market','unit.commercial':'sales','sale.save':'sales','sale.cancel':'sales','sale.receipt':'receipts','sale.receipt.reverse':'receipts','expense.quick':'costs','expense.save':'costs','expense.cancel':'costs','expense.construction':'costs','material.use':'costs','contractor.save':'contractors','project.create':'project','project.update':'project','unit.save':'project','unit.add':'project','project.trash':'project','project.restore':'project','project.close':'project','project.reopen':'project'};
 if(type==='stage.save'){
  if(payload.scope==='budget'){requireModule(actor,'costs');const old=p?.stages.find(s=>s.id===payload.id);if(!old)throw Object.assign(new Error('Etapa não encontrada.'),{status:422});return {...payload,name:old.name,progress:old.progress,trackProgress:old.trackProgress};}
  requireModule(actor,'stages');const old=p?.stages.find(s=>s.id===payload.id);return {...payload,budget:old?.budget||0};
 }
 if(type==='payment.add'||type==='payment.reverse'){if(!(canAccess(actor,'costs')||canAccess(actor,'contractors')&&e&&isContractor(e)))requireModule(actor,'costs');}
 else{if(!mapped[type])throw Object.assign(new Error('Comando inválido.'),{status:422});requireModule(actor,mapped[type]);}
 const data={...payload};
 if(type==='sale.save'&&data.receivedNow!==undefined&&data.receivedNow!==0)requireModule(actor,'receipts');
 if(type==='contractor.save'&&e&&!isContractor(e))requireModule(actor,'costs');
 if(type==='project.close'||type==='project.reopen'){if(!fullFinancialAccess(actor))throw Object.assign(new Error('Encerrar ou reabrir exige acesso aos módulos financeiros completos.'),{status:403});}
 if(type==='project.create'){
  if((data.land||data.commission||data.taxes))requireModule(actor,'costs');
  if(data.laborRate)requireModule(actor,'contractors');
 }
 if(type==='project.update'&&p&&!canAccess(actor,'profit'))for(const k of ['reserveBps','sellingBps','targetBps'])data[k]=p[k];
 return data;
}
