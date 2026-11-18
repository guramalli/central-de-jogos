export const STAGES=['Terreno e aquisição','Projetos e documentação','Preparação do terreno','Fundação e baldrame','Estrutura e lajes','Alvenaria','Cobertura','Elétrica','Hidráulica','Impermeabilização','Revestimentos e pisos','Grafiato e pintura','Esquadrias','Acabamentos','Áreas comuns e fachada','Entrega e regularização','Empreitada geral'];
export const CATEGORIES=['Terreno','Comissão de aquisição','Impostos e taxas','Projetos e licenças','Material','Empreitada','Elétrica','Hidráulica','Grafiato','Pintura','Impermeabilização','Pedreiro','Servente','Equipamentos e locação','Letreiro','Iluminação','Custo extra'];
export const KINDS={acquisition:'Aquisição',material:'Material',labor:'Mão de obra',equipment:'Equipamento',fees:'Taxas / projetos',extra:'Extra'};
export const CONSTRUCTION_SCOPES={auto:'Automático pela categoria',included:'Incluir na construção',excluded:'Excluir da construção'};
const constructionScope=value=>{const scope=value??'auto';check(Object.hasOwn(CONSTRUCTION_SCOPES,scope),'Classificação da construção inválida.');return scope;};
export const NEIGHBORHOODS=['Canto do Forte','Boqueirão','Guilhermina','Aviação','Vila Tupi','Ocian','Vila Mirim','Maracanã','Vila Caiçara','Jardim Real','Flórida','Solemar','Quietude','Tupiry','Antártica','Vila Sônia'];
export function check(ok,message){if(!ok)throw new Error(message);}
export function text(x,label,max=2000){check(typeof x==='string'&&x.trim().length>0&&x.length<=max,`${label}: preencha até ${max} caracteres.`);return x.trim();}
export function optional(x,max=2000){check(typeof x==='string'&&x.length<=max,'Texto inválido ou muito longo.');return x.trim();}
export function integer(n,label='Valor',min=0,max=1e12){check(Number.isSafeInteger(n)&&n>=min&&n<=max,`${label}: valor fora do limite.`);return n;}
export function decimal(x,digits=2){const s=String(x).trim().replace(',','.');check(new RegExp(`^\\d+(?:\\.\\d{1,${digits}})?$`).test(s),'Use número positivo, vírgula ou ponto decimal e nenhum separador de milhar.');const [a,b='']=s.split('.');return integer(Number(a)*10**digits+Number(b.padEnd(digits,'0')));}
export function date(x){check(typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!isNaN(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x,'Data inválida.');return x;}
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n/100);
export const amount=(c,q)=>integer(Number((BigInt(integer(c))*BigInt(integer(q))+500n)/1000n));
export const percent=(n,bps)=>Number((BigInt(integer(n))*BigInt(integer(bps))+5000n)/10000n);
const ceilRevenue=(cost,bps)=>Number((BigInt(cost)*10000n+BigInt(10000-bps)-1n)/BigInt(10000-bps));
export const sum=(rows,key)=>rows.reduce((n,x)=>n+(typeof key==='function'?key(x):x[key]),0);
export const paid=e=>sum(e.payments.filter(p=>!p.reversed),'cents');
export const used=e=>sum(e.uses||[],'qty');
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export const isContractor=e=>e.kind==='labor'&&norm(e.category)==='empreitada';
export const CONTRACT_FILE_LIMIT=1000000;
export function contractFileData(file){
  check(file&&typeof file==='object','Anexo de contrato inválido.');
  const name=text(file.name,'Nome do contrato',200),size=integer(file.size,'Tamanho do contrato',1,CONTRACT_FILE_LIMIT),mime=file.mime,data=file.data;
  check(['application/pdf','image/png','image/jpeg'].includes(mime),'Use contrato em PDF, JPG ou PNG.');
  check(typeof data==='string'&&data.length<=4*Math.ceil(CONTRACT_FILE_LIMIT/3)&&/^[A-Za-z0-9+/]*={0,2}$/.test(data),'Conteúdo do contrato inválido.');
  let bytes;try{bytes=atob(data);}catch{throw new Error('Conteúdo do contrato inválido.');}
  check(bytes.length===size&&btoa(bytes)===data,'Tamanho do contrato inconsistente.');
  const signature=mime==='application/pdf'?bytes.startsWith('%PDF-'):mime==='image/png'?Array.from(bytes.slice(0,8),c=>c.charCodeAt(0)).join(',')==='137,80,78,71,13,10,26,10':Array.from(bytes.slice(0,3),c=>c.charCodeAt(0)).join(',')==='255,216,255';
  check(signature,'O conteúdo do arquivo não corresponde ao formato informado.');
  return {name,size,mime,data};
}
export const isProgressStage=st=>!st.unassigned&&(st.trackProgress??!['terreno e aquisicao','empreitada geral','historico importado · conferir etapas'].includes(norm(st.name)));
export function physicalProgress(p){const stages=p.stages.filter(isProgressStage);return {stages,count:stages.length,completed:stages.filter(st=>st.progress===100).length,percent:stages.length?sum(stages,'progress')/stages.length:null};}
export const activeProjects=s=>s.projects.filter(p=>!p.trashedAt);
export const empty=()=>({version:1,revision:0,seq:0,projects:[],comparables:[],audit:[]});
export function split(cents,weights){
  integer(cents);check(weights.length>0&&weights.every(w=>Number.isSafeInteger(w)&&w>=0)&&sum(weights,x=>x)>0,'Rateio sem unidades ou áreas válidas.');
  const total=BigInt(sum(weights,x=>x)),n=BigInt(cents),rows=weights.map((w,i)=>({i,base:n*BigInt(w)/total,rest:n*BigInt(w)%total}));
  let left=cents-sum(rows,x=>Number(x.base));for(const r of [...rows].sort((a,b)=>a.rest===b.rest?a.i-b.i:a.rest>b.rest?-1:1)){if(!left--)break;r.base++;}
  return rows.map(r=>Number(r.base));
}
export function allocation(p,cents,mode,unitId){if(mode==='direct'){check(p.units.some(u=>u.id===unitId),'Escolha uma unidade deste empreendimento.');return {[unitId]:cents};}check(['equal','area'].includes(mode),'Rateio inválido.');const values=split(cents,p.units.map(u=>mode==='area'?u.area:1));return Object.fromEntries(p.units.map((u,i)=>[u.id,values[i]]));}
export const tracksQuantity=e=>e.kind==='material'&&!['verba','contrato'].includes(norm(e.uom));
const next=s=>'ss-'+(++s.seq);
const getProject=(s,id)=>{const p=s.projects.find(p=>p.id===id);check(p,'Empreendimento não encontrado.');return p;};
function open(p){check(p.status!=='closed','Obra encerrada. Reabra com uma justificativa antes de alterar.');}
function stage(p,id){const a=p.stages.find(s=>s.id===id);check(a,'Etapa inválida.');return a;}
function expense(p,id){const e=p.expenses.find(e=>e.id===id);check(e&&!e.cancelled,'Lançamento não encontrado ou cancelado.');return e;}
function projectData(d){
  const out={name:text(d.name,'Empreendimento',150),neighborhood:text(d.neighborhood,'Bairro',100),zone:text(d.zone,'Zona',80),address:optional(d.address||'',400),start:date(d.start),type:d.type,bedrooms:integer(d.bedrooms,'Dormitórios',1,10),allocation:d.allocation,reserveBps:integer(d.reserveBps,'Reserva',0,5000),sellingBps:integer(d.sellingBps,'Despesas de venda',0,9000),targetBps:integer(d.targetBps,'Margem desejada',0,9000),notes:optional(d.notes||'')};
  check(['condominium','individual'].includes(out.type),'Tipo de sobrado inválido.');check(['equal','area'].includes(out.allocation),'Rateio inválido.');check(out.sellingBps+out.targetBps<10000,'Despesas de venda e margem devem somar menos de 100%.');return out;
}
function unitData(d,bedrooms){
  const u={name:text(d.name,'Nome da unidade',100),area:integer(d.area,'Área da unidade',1,1e7),sale:integer(d.sale,'Venda estimada'),bedrooms:integer(d.bedrooms??bedrooms,'Dormitórios',1,10),notes:optional(d.notes||'')};
  for(const k of ['bathrooms','parking'])u[k]=d[k]===undefined||d[k]===null||d[k]===''?null:integer(d[k],k==='bathrooms'?'Banheiros':'Vagas',0,20);
  return u;
}
function withExpenseStage(s,p,d){
  if(d.stageId!==''&&d.stageId!==undefined)return d;
  let unassigned=p.stages.find(st=>st.unassigned);
  if(!unassigned){let name='Não informada',suffix=2;while(p.stages.some(st=>norm(st.name)===norm(name)))name='Não informada ('+(suffix++)+')';unassigned={id:next(s),name,budget:0,progress:0,unassigned:true};p.stages.push(unassigned);}
  return {...d,stageId:unassigned.id};
}
function expenseData(p,d){
  stage(p,d.stageId);const kind=d.kind;check(Object.hasOwn(KINDS,kind),'Natureza do custo inválida.');
  const qty=integer(d.qty,'Quantidade',1,1e9),unitCents=integer(d.unitCents,'Preço unitário',0,1e10),total=amount(unitCents,qty);check(total>0,'Valor do custo precisa ser maior que zero.');
  const out={description:text(d.description,'Descrição',300),category:text(d.category,'Categoria',100),kind,stageId:d.stageId,date:date(d.date),due:date(d.due||d.date),supplier:optional(d.supplier||'',200),reference:optional(d.reference||'',150),notes:optional(d.notes||''),qty,uom:text(d.uom,'Unidade de medida',30),unitCents,total,mode:d.mode,unitId:d.unitId||'',allocation:allocation(p,total,d.mode,d.unitId),coverage:optional(d.coverage||'',2000),extraToContract:!!d.extraToContract};
  if(kind==='labor'&&norm(out.category)!=='empreitada'){
    const covered=p.expenses.some(e=>!e.cancelled&&norm(e.category)==='empreitada'&&e.coverage.split(/[,;\n]+/).some(c=>norm(c)===norm(out.category))&&e.id!==d.id);
    check(!covered||out.extraToContract,'Essa mão de obra consta na empreitada. Registre o pagamento nela ou confirme que este serviço é adicional fora do contrato.');
  }
  if(d.constructionScope!==undefined)out.constructionScope=constructionScope(d.constructionScope);
  return out;
}
export function command(input,type,d,expected=input.revision){
  check(input.revision===expected,'Outra aba alterou os dados. Atualize antes de salvar.');const s=structuredClone(input);let result;
  if(type==='project.create'){
    const data=projectData(d);let units;
    if(d.units!==undefined){check(Array.isArray(d.units)&&d.units.length>0&&d.units.length<=100,'Cadastre entre 1 e 100 unidades.');if(d.count!==undefined)check(integer(d.count,'Número de unidades',1,100)===d.units.length,'A quantidade informada difere das unidades cadastradas.');units=d.units.map(u=>unitData(u,data.bedrooms));}
    else{const count=integer(d.count,'Número de unidades',1,100);units=Array.from({length:count},(_,i)=>unitData({name:`Unidade ${String(i+1).padStart(2,'0')}`,area:d.area,sale:d.sale},data.bedrooms));}
    check(new Set(units.map(u=>norm(u.name))).size===units.length,'Use uma identificação diferente para cada unidade.');
    const p={...data,id:next(s),diaryKey:crypto.randomUUID(),status:'active',units:units.map(u=>({...u,id:next(s)})),stages:STAGES.map(name=>({id:next(s),name,budget:0,progress:0})),expenses:[]};s.projects.push(p);result=p;
    for(const [key,label,kind,stageIndex] of [['land','Terreno','acquisition',0],['commission','Comissão de aquisição','acquisition',0],['taxes','Impostos e taxas','fees',1]]){
      const cents=integer(d[key]||0);if(!cents)continue;
      const e={...expenseData(p,{description:label,category:label,kind,stageId:p.stages[stageIndex].id,date:p.start,due:p.start,qty:1000,uom:'verba',unitCents:cents,mode:p.allocation}),id:next(s),payments:[],uses:[]};
      if(d.acquisitionPaid){check(p.start<=today(),'Aquisição já paga não pode ter data futura.');e.payments.push({id:next(s),date:p.start,cents,method:'Pagamento inicial informado',reference:'',reversed:false});}p.expenses.push(e);p.stages[stageIndex].budget+=cents;
    }
    if(d.laborMode!=='separate'&&d.laborRate){
      check(['sqm','fixed'].includes(d.laborMode),'Formato de empreitada inválido.');const qty=d.laborMode==='sqm'?sum(p.units,'area')*10:1000;
      const e={...expenseData(p,{description:d.laborMode==='sqm'?'Empreitada por m²':'Empreitada com valor fechado',category:'Empreitada',kind:'labor',stageId:p.stages.at(-1).id,date:p.start,qty,uom:d.laborMode==='sqm'?'m²':'contrato',unitCents:integer(d.laborRate),mode:p.allocation,coverage:d.coverage||'',notes:d.laborNotes||''}),id:next(s),payments:[],uses:[]};p.expenses.push(e);p.stages.at(-1).budget=e.total;
    }
  }else if(type==='comparable.save'){
    const link=new URL(d.url);check(link.protocol==='https:','Informe um link HTTPS da fonte.');
    const c={id:d.id||next(s),title:text(d.title,'Título',250),url:link.href,source:text(d.source,'Fonte',120),date:date(d.date),neighborhood:text(d.neighborhood,'Bairro',100),zone:text(d.zone,'Zona',80),type:d.type,condition:d.condition,bedrooms:integer(d.bedrooms,'Dormitórios',1,10),area:integer(d.area,'Área privativa',1,1e7),price:integer(d.price,'Preço anunciado',1),notes:optional(d.notes||'')};
    check(['individual','condominium'].includes(c.type)&&['new','used','unknown'].includes(c.condition),'Características inválidas.');check(!s.comparables.some(x=>x.id!==c.id&&x.url===c.url),'Esta URL já está cadastrada. Atualize a referência existente.');
    const old=s.comparables.findIndex(x=>x.id===c.id);check(!d.id||old>=0,'Referência não encontrada.');if(old<0)s.comparables.push(c);else s.comparables[old]=c;result=c;
  }else{
    const p=getProject(s,d.projectId);
    if(type==='project.restore')check(!!p.trashedAt,'Este empreendimento não está na lixeira.');
    else check(!p.trashedAt,'Este empreendimento está na lixeira. Restaure-o antes de alterar.');
    if(!['project.reopen','project.trash','project.restore'].includes(type))open(p);
    if(type==='project.trash'){check(d.confirmName===p.name,'Digite o nome do empreendimento exatamente como aparece para confirmar.');p.trashedAt=new Date().toISOString();result=p;}
    else if(type==='project.restore'){delete p.trashedAt;result=p;}
    else if(type==='project.update'){for(const u of p.units)if(u.bedrooms===undefined)u.bedrooms=p.bedrooms;Object.assign(p,projectData(d));result=p;}
    else if(type==='unit.save'||type==='unit.add'){
      const old=type==='unit.save'?p.units.find(u=>u.id===d.id):null;
      check(type==='unit.add'||old,'Unidade inválida.');check(old||p.units.length<100,'Limite de 100 unidades.');
      const data=unitData({...old,...d},old?.bedrooms??p.bedrooms);
      check(!p.units.some(u=>u.id!==old?.id&&norm(u.name)===norm(data.name)),'Já existe uma unidade com essa identificação.');
      const u=old||{id:next(s)};Object.assign(u,data);if(!old)p.units.push(u);result=u;
    }
    else if(type==='stage.save'){const a=d.id?stage(p,d.id):{id:next(s)};a.name=text(d.name,'Etapa',100);check(!p.stages.some(st=>st.id!==a.id&&norm(st.name)===norm(a.name)),'Etapa já cadastrada.');a.budget=integer(d.budget,'Orçamento');a.progress=integer(d.progress,'Progresso',0,100);if(d.trackProgress!==undefined){check(typeof d.trackProgress==='boolean'&&(!a.unassigned||!d.trackProgress),'Participação no avanço inválida.');a.trackProgress=d.trackProgress;}if(!d.id)p.stages.push(a);result=a;}
    else if(type==='expense.quick'){
      check(['paid','pending'].includes(d.paymentStatus),'Informe se o gasto está pago ou a pagar.');
      const cents=integer(d.cents,'Valor do gasto',1,1e10);
      const data=expenseData(p,{...withExpenseStage(s,p,d),qty:1000,uom:'verba',unitCents:cents});
      const e={...data,id:next(s),payments:[],uses:[]};
      if(d.paymentStatus==='paid'){
        check(data.date<=today(),'Pagamento realizado não pode ter data futura.');
        e.payments.push({id:next(s),date:data.date,cents,method:text(d.method,'Forma de pagamento',100),reference:data.reference,reversed:false});
      }
      p.expenses.push(e);result=e;
    }
    else if(type==='expense.construction'){const e=expense(p,d.id);e.constructionScope=constructionScope(d.constructionScope);result=e;}
    else if(type==='contractor.save'){
      const old=d.id?expense(p,d.id):null;check(!old||old.kind==='labor','Selecione um custo de mão de obra existente.');
      check(['sqm','fixed'].includes(d.billing),'Formato de contratação inválido.');
      const qty=d.billing==='sqm'?integer(d.areaQty,'Metragem contratada',1,1e9):1000;
      const unitCents=integer(d.billing==='sqm'?d.rateCents:d.fixedCents,'Valor contratado',1,1e10);
      const data=expenseData(p,withExpenseStage(s,p,{...d,kind:'labor',category:'Empreitada',qty,unitCents,uom:d.billing==='sqm'?'m²':'contrato',supplier:text(d.supplier,'Nome do empreiteiro',200),coverage:text(d.coverage,'Serviços incluídos',2000),mode:old?.mode||p.allocation,unitId:old?.unitId||''}));
      check(!old||data.total>=paid(old),'O contrato não pode ficar abaixo do valor já pago.');
      if(old&&data.total===old.total)data.allocation=structuredClone(old.allocation);
      const e=old||{id:next(s),payments:[],uses:[]};Object.assign(e,data);
      if(d.contractFile===null)delete e.contractFile;else if(d.contractFile!==undefined)e.contractFile=contractFileData(d.contractFile);
      if(!old)p.expenses.push(e);result=e;
    }
    else if(type==='expense.save'){
      const old=d.id?expense(p,d.id):null,data=expenseData(p,withExpenseStage(s,p,d));check(!old||data.total>=paid(old),'Valor não pode ficar abaixo do total pago.');check(!old||!old.uses.length||(data.kind==='material'&&data.qty>=used(old)&&data.uom===old.uom),'Consumo já registrado: preserve o material, a unidade de medida e quantidade suficiente.');
      const e=old||{id:next(s),payments:[],uses:[]};Object.assign(e,data);if(!old)p.expenses.push(e);result=e;
    }else if(type==='expense.cancel'){const e=expense(p,d.id);check(paid(e)===0&&!used(e),'Estorne os pagamentos; materiais com consumo não podem ser cancelados.');e.cancelled=text(d.reason,'Justificativa');result=e;}
    else if(type==='payment.add'){const e=expense(p,d.id),cents=integer(d.cents,'Pagamento',1);check(cents<=e.total-paid(e),'Pagamento supera o saldo contratado.');const when=date(d.date);check(when<=today(),'Pagamento realizado não pode ter data futura.');const pay={id:next(s),date:when,cents,method:text(d.method,'Forma de pagamento',100),reference:optional(d.reference||'',200),reversed:false};if(d.stageId){stage(p,d.stageId);pay.stageId=d.stageId;}if(d.notes)pay.notes=optional(d.notes,1000);e.payments.push(pay);result=pay;}
    else if(type==='payment.reverse'){const e=expense(p,d.id),pay=e.payments.find(x=>x.id===d.paymentId);check(pay&&!pay.reversed,'Pagamento inválido ou já estornado.');pay.reversed=text(d.reason,'Motivo do estorno');result=pay;}
    else if(type==='material.use'){const e=expense(p,d.id);check(e.kind==='material','Selecione um material.');check(tracksQuantity(e),'Informe a quantidade física e a unidade de medida no lançamento detalhado antes de registrar consumo.');const qty=integer(d.qty,'Consumo',1);check(qty<=e.qty-used(e),'Consumo maior que a quantidade comprada disponível.');stage(p,d.stageId);check(!d.unitId||p.units.some(u=>u.id===d.unitId),'Unidade inválida.');const use={id:next(s),date:date(d.date),qty,stageId:d.stageId,unitId:d.unitId||'',notes:optional(d.notes||'')};check(use.date<=today(),'Consumo realizado não pode ter data futura.');e.uses.push(use);result=use;}
    else if(type==='project.close'){check(!p.expenses.some(e=>!e.cancelled&&paid(e)<e.total),'Há custos a pagar. Confira o saldo antes de encerrar.');p.status='closed';p.closedAt=date(d.date);check(p.closedAt<=today(),'Encerramento não pode ter data futura.');p.closeNotes=text(d.reason,'Conferência final');result=p;}
    else if(type==='project.reopen'){check(p.status==='closed','Obra já está aberta.');p.status='active';p.reopenReason=text(d.reason,'Justificativa de reabertura');result=p;}
    else throw new Error('Operação não reconhecida.');
  }
  const auditDetail=structuredClone(d);if(auditDetail.contractFile){const {name,size,mime}=auditDetail.contractFile;auditDetail.contractFile={name,size,mime};}
  s.revision++;s.audit.push({id:next(s),date:new Date().toISOString(),type,projectId:d.projectId||result?.id||'',description:result?.description||result?.name||result?.title||'',detail:auditDetail});validate(s);return {state:s,result};
}
// Analytical view by current area; never rewrites recorded expense allocations.
export function constructionExclusion(e){
  const scope=constructionScope(e.constructionScope);
  if(scope==='included')return '';
  if(scope==='excluded')return 'Exclusão informada';
  const category=norm(e.category);
  if(/\bcomiss(?:ao|oes)\b/.test(category))return 'Comissão';
  if(/\b(impostos?|tributos?|iptu|itbi|iss|inss|fgts)\b/.test(category))return 'Impostos / encargos';
  if(e.kind==='acquisition'||category==='terreno')return 'Terreno / aquisição';
  return '';
}
export function constructionTotals(p){
  const rows=p.expenses.filter(e=>!e.cancelled).map(e=>({expense:e,reason:constructionExclusion(e)}));
  const included=rows.filter(r=>!r.reason),excluded=rows.filter(r=>r.reason);
  const paidCents=sum(included,r=>paid(r.expense)),contracted=sum(included,r=>r.expense.total);
  const areaHundredths=sum(p.units,'area'),area=areaHundredths/100;
  const shares=split(paidCents,p.units.map(u=>u.area));
  return {paid:paidCents,contracted,pending:contracted-paidCents,excludedPaid:sum(excluded,r=>paid(r.expense)),area,
    costPerSqm:Math.round(paidCents*100/areaHundredths),included,excluded,
    units:p.units.map((u,i)=>({...u,constructionPaid:shares[i]}))};
}
export function totals(p){
  const expenses=p.expenses.filter(e=>!e.cancelled),contracted=sum(expenses,'total'),paidCents=sum(expenses,paid),budget=sum(p.stages,'budget');
  const stageRows=p.stages.map(st=>{const rows=expenses.filter(e=>e.stageId===st.id),actual=sum(rows,'total');return {...st,contracted:actual,paid:sum(rows,paid),forecast:p.status==='closed'?actual:Math.max(st.budget,actual)};});
  const base=sum(stageRows,'forecast'),reserve=p.status==='closed'?0:percent(base,p.reserveBps),forecast=base+reserve,revenue=sum(p.units,'sale'),selling=percent(revenue,p.sellingBps),profit=revenue-forecast-selling;
  const remainderAlloc=allocation(p,forecast-contracted,p.allocation),paidAlloc={};
  for(const e of expenses){const ids=Object.keys(e.allocation).filter(id=>e.allocation[id]>0);const values=split(paid(e),ids.map(id=>e.allocation[id]));ids.forEach((id,i)=>paidAlloc[id]=(paidAlloc[id]||0)+values[i]);}
  const saleAlloc=revenue?split(selling,p.units.map(u=>u.sale)):p.units.map(()=>0);
  const units=p.units.map((u,i)=>{const committed=sum(expenses,e=>e.allocation[u.id]||0),expected=committed+(remainderAlloc[u.id]||0),net=u.sale-expected-saleAlloc[i];return {...u,contracted:committed,paid:paidAlloc[u.id]||0,forecast:expected,selling:saleAlloc[i],profit:net,margin:u.sale?net/u.sale:null};});
  return {contracted,paid:paidCents,pending:contracted-paidCents,budget,base,reserve,forecast,revenue,selling,profit,margin:revenue?profit/revenue:null,returnOnCost:forecast+selling?profit/(forecast+selling):null,area:sum(p.units,'area')/100,costPerSqm:Math.round(forecast/(sum(p.units,'area')/100)),breakEven:ceilRevenue(forecast,p.sellingBps),targetRevenue:ceilRevenue(forecast,p.sellingBps+p.targetBps),stages:stageRows,units};
}
export function scenario(p,variationBps){const t=totals(p),revenue=Math.round(t.revenue*(1+variationBps/10000)),selling=percent(revenue,p.sellingBps),profit=revenue-t.forecast-selling;return {revenue,profit,margin:revenue?profit/revenue:null};}
export function market(s,p,{area=p.units[0]?.area||6000,bedrooms=p.units[0]?.bedrooms??p.bedrooms,condition='new',includeUnknownZone=false,asOf=today()}={}){
  const examined=s.comparables.map(c=>{const reasons=[];if(norm(c.neighborhood)!==norm(p.neighborhood))reasons.push('outro bairro');if(c.zone!==p.zone&&!(includeUnknownZone&&c.zone==='Não informada'))reasons.push('zona diferente ou não informada');if(c.type!==p.type)reasons.push('outro tipo');if(c.bedrooms!==bedrooms)reasons.push('outros dormitórios');if(condition!=='all'&&c.condition!==condition)reasons.push('outra condição');if(c.area<area*.75||c.area>area*1.25)reasons.push('área fora de ±25%');const days=(Date.parse(asOf)-Date.parse(c.date))/86400000;if(days<0||days>90)reasons.push('consulta fora dos últimos 90 dias');return {...c,reasons,rate:c.price/c.area*100};});
  const rows=examined.filter(c=>!c.reasons.length),sorted=rows.map(c=>c.rate).sort((a,b)=>a-b),median=sorted.length?(sorted[Math.floor((sorted.length-1)/2)]+sorted[Math.floor(sorted.length/2)])/2:null;
  return {examined,rows,median:rows.length>=3?Math.round(median):null,estimate:rows.length>=3?Math.round(median*area/100):null,min:rows.length>=3?Math.round(sorted[0]*area/100):null,max:rows.length>=3?Math.round(sorted.at(-1)*area/100):null};
}
export function history(s,yearA,yearB){
  const rows=new Map();for(const p of activeProjects(s))for(const e of p.expenses.filter(e=>!e.cancelled&&['material','labor','equipment'].includes(e.kind)&&!['verba','contrato','lote'].includes(norm(e.uom)))){
    const year=e.date.slice(0,4);if(![yearA,yearB].includes(year))continue;const key=[norm(e.description),norm(e.uom),e.kind].join('|');
    if(!rows.has(key))rows.set(key,{name:e.description,uom:e.uom,kind:e.kind,a:{cost:0,qty:0},b:{cost:0,qty:0}});const x=rows.get(key)[year===yearA?'a':'b'];x.cost+=e.total;x.qty+=e.qty;
  }return [...rows.values()].map(r=>{const a=r.a.qty?r.a.cost*1000/r.a.qty:null,b=r.b.qty?r.b.cost*1000/r.b.qty:null;return {...r,priceA:a,priceB:b,change:a>0&&b!==null?(b-a)/a:null};});
}
export function csv(rows){return '\uFEFF'+rows.map(row=>row.map(v=>{let s=String(v??'');if(/^[=+@\-\t\r\n]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}).join(';')).join('\r\n');}
export function costReport(p){return csv([['Empreendimento','Etapa','Categoria','Natureza','Descrição','Fornecedor','Data','Vencimento','Quantidade','Medida','Preço unitário R$','Contratado R$','Pago R$','Saldo R$','Rateio','Observação'],...p.expenses.filter(e=>!e.cancelled).map(e=>[p.name,stage(p,e.stageId).name,e.category,KINDS[e.kind],e.description,e.supplier,e.date,e.due,e.qty/1000,e.uom,(e.unitCents/100).toFixed(2),(e.total/100).toFixed(2),(paid(e)/100).toFixed(2),((e.total-paid(e))/100).toFixed(2),Object.entries(e.allocation).map(([id,n])=>`${p.units.find(u=>u.id===id).name}: ${(n/100).toFixed(2)}`).join(' | '),e.notes])]);}
export function validate(s){
  check(s&&s.version===1&&Array.isArray(s.projects)&&Array.isArray(s.comparables)&&Array.isArray(s.audit),'Backup incompatível.');integer(s.revision);integer(s.seq);check(s.projects.length<=200&&s.comparables.length<=2000&&s.audit.length<=50000,'Base muito grande para este ambiente de testes.');
  const ids=new Set();const id=x=>{check(typeof x==='string'&&/^ss-\d+$/.test(x)&&!ids.has(x),'Identificador inválido ou duplicado.');check(Number(x.slice(3))<=s.seq,'Sequência inválida.');ids.add(x);};
  for(const p of s.projects){id(p.id);projectData(p);if(p.trashedAt!==undefined)check(typeof p.trashedAt==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(p.trashedAt)&&Number.isFinite(Date.parse(p.trashedAt)),'Data da lixeira inválida.');check(['active','closed'].includes(p.status)&&Array.isArray(p.units)&&p.units.length>0&&p.units.length<=100&&Array.isArray(p.stages)&&p.stages.length>0&&Array.isArray(p.expenses)&&p.expenses.length<=10000,'Estrutura do empreendimento inválida.');
    for(const u of p.units){id(u.id);text(u.name,'Unidade',100);integer(u.area,'Área',1,1e7);integer(u.sale);if(u.bedrooms!==undefined)integer(u.bedrooms,'Dormitórios',1,10);for(const k of ['bathrooms','parking'])if(u[k]!==undefined&&u[k]!==null)integer(u[k],k,0,20);if(u.notes!==undefined)optional(u.notes);}
    check(p.stages.filter(st=>st.unassigned).length<=1,'Etapa não informada duplicada.');
    for(const st of p.stages){id(st.id);if(st.trackProgress!==undefined)check(typeof st.trackProgress==='boolean'&&(!st.unassigned||!st.trackProgress),'Participação no avanço inválida.');if(st.unassigned!==undefined)check(st.unassigned===true,'Classificação da etapa inválida.');text(st.name,'Etapa',100);integer(st.budget);integer(st.progress,'Progresso',0,100);}
    for(const e of p.expenses){id(e.id);constructionScope(e.constructionScope);stage(p,e.stageId);text(e.description,'Descrição',300);text(e.category,'Categoria',100);check(Object.hasOwn(KINDS,e.kind),'Natureza inválida.');date(e.date);date(e.due);integer(e.qty,'Quantidade',1,1e9);integer(e.unitCents,'Preço',0,1e10);check(e.total===amount(e.unitCents,e.qty)&&e.total>0,'Total inconsistente.');text(e.uom,'Medida',30);optional(e.supplier,200);optional(e.reference,150);optional(e.notes);optional(e.coverage,2000);check(['equal','area','direct'].includes(e.mode),'Rateio inválido.');check(e.allocation&&Object.entries(e.allocation).every(([uid,v])=>p.units.some(u=>u.id===uid)&&Number.isSafeInteger(v)&&v>=0)&&sum(Object.values(e.allocation),x=>x)===e.total,'Rateio inconsistente.');check(Array.isArray(e.payments)&&Array.isArray(e.uses),'Histórico inválido.');if(e.contractFile!==undefined){check(isContractor(e),'Anexo fora de uma empreitada.');contractFileData(e.contractFile);}
      for(const pay of e.payments){id(pay.id);date(pay.date);if(pay.stageId)stage(p,pay.stageId);if(pay.notes!==undefined)optional(pay.notes,1000);integer(pay.cents,'Pagamento',1);text(pay.method,'Forma',100);optional(pay.reference,200);check(pay.reversed===false||typeof pay.reversed==='string','Estorno inválido.');}check(paid(e)<=e.total,'Pagamentos superiores ao custo.');
      for(const use of e.uses){id(use.id);check(e.kind==='material','Consumo fora de material.');date(use.date);stage(p,use.stageId);integer(use.qty,'Consumo',1);check(!use.unitId||p.units.some(u=>u.id===use.unitId),'Unidade de consumo inválida.');optional(use.notes);}check(used(e)<=e.qty,'Consumo superior à compra.');check(!e.cancelled||(!paid(e)&&!used(e)),'Cancelamento inconsistente.');
    }integer(sum(p.expenses.filter(e=>!e.cancelled),'total'),'Total de custos');integer(sum(p.stages,'budget'),'Orçamento total');integer(sum(p.units,'sale'),'Vendas totais');if(p.status==='closed')check(!p.expenses.some(e=>!e.cancelled&&paid(e)!==e.total),'Encerramento com saldo aberto.');
  }
  for(const c of s.comparables){id(c.id);text(c.title,'Título',250);text(c.source,'Fonte',120);check(new URL(c.url).protocol==='https:','Fonte inválida.');date(c.date);text(c.neighborhood,'Bairro',100);text(c.zone,'Zona',80);check(['new','used','unknown'].includes(c.condition)&&['individual','condominium'].includes(c.type),'Tipo de referência inválido.');integer(c.bedrooms,'Dormitórios',1,10);integer(c.area,'Área',1,1e7);integer(c.price,'Preço',1);optional(c.notes);}
  for(const a of s.audit){id(a.id);check(typeof a.type==='string'&&typeof a.date==='string'&&typeof a.description==='string','Histórico inválido.');}return s;
}
