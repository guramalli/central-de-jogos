import { assert, date, today } from '../orcamentos/domain.mjs';
import { balance, AGREEMENT_STATUS } from './domain.mjs';
import { csvExport } from './returns.mjs';

export const AGE_BANDS = [['1–30 dias',1,30],['31–60 dias',31,60],['61–90 dias',61,90],['Mais de 90 dias',91,Infinity]];
export const defaultReportFilters = () => ({ from: today().slice(0,7)+'-01', to: today(), dueScope:'all', agreement:'all', search:'' });
export function validateReportFilters(f) {
  date(f.from); date(f.to); assert(f.from <= f.to, 'A data inicial precisa ser anterior ou igual à final.');
  assert(['all','period'].includes(f.dueScope), 'Filtro de vencimentos inválido.');
  assert(['all','signed','none','negotiating'].includes(f.agreement), 'Filtro de renegociação inválido.');
  return {...f, search:String(f.search || '').trim()};
}
// Sem documento, fichas não são unificadas por nome: homônimos podem ser pessoas diferentes.
export function customerKey(c) {
  const doc=(c.document || '').toUpperCase().replace(/[^A-Z0-9]/g,'');
  return /^\d{11}$/.test(doc) || /^[A-Z0-9]{12}\d{2}$/.test(doc) ? `doc:${doc}` : c.registryRef?.customerId ? `shared:${c.registryRef.customerId}` : `contract:${c.id}`;
}
export function billingReport(s, input, now=today()) {
  const f=validateReportFilters(input);date(now);
  const contracts=new Map(s.contracts.map(c=>[c.id,c])), items=new Map(s.installments.map(i=>[i.id,i]));
  const q=f.search.toLocaleLowerCase('pt-BR');
  const matches=c=>[c.clientName,c.document,c.number,c.project,c.unit].some(v=>String(v||'').toLocaleLowerCase('pt-BR').includes(q));
  const payments=s.receipts.filter(r=>!r.reversedAt&&r.paidDate>=f.from&&r.paidDate<=f.to).map(r=>{
    const item=items.get(r.installmentId);return {...r,item,contract:contracts.get(item?.contractId)};
  }).filter(r=>r.contract&&matches(r.contract)).sort((a,b)=>b.paidDate.localeCompare(a.paidDate)||a.id.localeCompare(b.id));
  const overdue=s.installments.filter(i=>contracts.get(i.contractId)?.status==='active'&&i.dueDate<now&&balance(s,i)>0&&matches(contracts.get(i.contractId))&&(f.dueScope==='all'||i.dueDate>=f.from&&i.dueDate<=f.to)).map(i=>{
    const agreements=(s.renegotiations||[]).filter(a=>a.contractId===i.contractId&&a.installmentIds.includes(i.id));
    return {...i,contract:contracts.get(i.contractId),remaining:balance(s,i),days:Math.round((Date.parse(now+'T00:00:00Z')-Date.parse(i.dueDate+'T00:00:00Z'))/86400000),agreements,signed:agreements.some(a=>a.status==='signed'),negotiating:agreements.some(a=>a.status==='negotiating')};
  });
  const grouped=new Map();
  for(const i of overdue) { const key=customerKey(i.contract); if(!grouped.has(key))grouped.set(key,{key,name:i.contract.clientName,document:i.contract.document||'',items:[]});grouped.get(key).items.push(i); }
  const debtors=[...grouped.values()].map(g=>{
    const signedCount=g.items.filter(i=>i.signed).length;
    return {...g,remaining:g.items.reduce((n,i)=>n+i.remaining,0),maxDays:Math.max(...g.items.map(i=>i.days)),firstDue:g.items.map(i=>i.dueDate).sort()[0],signedCount,coverage:signedCount===g.items.length?'Integral':signedCount?'Parcial':'Sem acordo assinado',negotiating:g.items.some(i=>i.negotiating),unreviewed:g.items.filter(i=>!i.reviewed).length};
  }).filter(g=>f.agreement==='all'||f.agreement==='signed'&&g.signedCount>0||f.agreement==='none'&&g.signedCount===0||f.agreement==='negotiating'&&g.negotiating).sort((a,b)=>b.maxDays-a.maxDays||b.remaining-a.remaining);
  const debtItems=debtors.flatMap(g=>g.items);
  return {filters:f,now,payments,received:payments.reduce((n,r)=>n+r.amountCents,0),payers:new Set(payments.map(r=>customerKey(r.contract))).size,debtors,debtItems,overdue:debtItems.reduce((n,i)=>n+i.remaining,0),withoutAgreement:debtors.filter(g=>!g.signedCount).length,partialAgreement:debtors.filter(g=>g.signedCount&&g.coverage==='Parcial').length,unidentified:debtors.filter(g=>g.key.startsWith('contract:')).length,unreviewed:debtItems.filter(i=>!i.reviewed).length,bands:AGE_BANDS.map(([label,min,max])=>({label,count:debtItems.filter(i=>i.days>=min&&i.days<=max).length,amount:debtItems.filter(i=>i.days>=min&&i.days<=max).reduce((n,i)=>n+i.remaining,0)}))};
}
const reais=n=>(n/100).toFixed(2).replace('.',',');
export function reportCSV(report,kind) {
  const f=report.filters, context=[f.from,f.to,report.now,f.dueScope==='all'?'Todos vencidos hoje':'Vencidos hoje com vencimento no período',f.agreement,f.search];
  const meta=['Período inicial','Período final','Posição atual em','Filtro de vencimentos','Filtro de acordo (apenas dívidas)','Busca'];
  if(kind==='payments') return csvExport([['Cliente','CPF/CNPJ','Contrato','Parcela','Data do pagamento','Valor recebido (R$)','Forma','Referência',...meta],...report.payments.map(r=>[r.contract.clientName,r.contract.document,r.contract.number,r.item.label,r.paidDate,reais(r.amountCents),r.method,r.reference,...context])]);
  return csvExport([['Cliente','CPF/CNPJ','Contrato','Empreendimento / imóvel','Parcela','Vencimento','Dias de atraso','Saldo atual (R$)','Valor conferido','Acordo assinado vigente','Renegociações registradas','Telefone','E-mail',...meta],...report.debtItems.map(i=>[i.contract.clientName,i.contract.document,i.contract.number,[i.contract.project,i.contract.unit].filter(Boolean).join(' · '),i.label,i.dueDate,i.days,reais(i.remaining),i.reviewed?'Sim':'Não',i.signed?'Sim':'Não',i.agreements.map(a=>`${a.number} (${AGREEMENT_STATUS[a.status]})`).join(' / '),i.contract.phone,i.contract.email,...context])]);
}
