import {check, date, money, paid, received, activeSale, SALE_MODES, totals, csv} from './domain.mjs?v=20261119-viability30';
import {canAccess, fullFinancialAccess} from './access-domain.mjs?v=20261118-access8';

const TITLES={payments:'Relatório de pagamentos',sales:'Tabela de vendas',receipts:'Relatório de recebimentos',overview:'Relatório geral do empreendimento'};
const sum=(rows,fn)=>rows.reduce((total,row)=>total+fn(row),0);
const brDate=value=>value?value.split('-').reverse().join('/'):'-';
const number=value=>new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
const column=(label,align='left',width=1)=>({label,align,width});
const moneyColumn=label=>column(label+' (R$)','right',1.1);
const section=(title,columns,rows,extra={})=>({title,columns,rows,emptyText:'Nenhum registro para os filtros selecionados.',...extra});
const summary=(label,cents)=>({label,value:money(cents)});
const unitName=(p,id)=>p.units.find(u=>u.id===id)?.name||'Unidade não identificada';
const stageName=(p,id)=>p.stages.find(s=>s.id===id)?.name||'Não informada';
const slug=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'empreendimento';

export function allowedReportTypes(actor){
  return ['payments','sales','receipts','overview'].filter(type=>type==='overview'?fullFinancialAccess(actor):canAccess(actor,{payments:'costs',sales:'sales',receipts:'receipts'}[type]));
}
function validateFilters(type,p,filters){
  const f={from:filters.from||'',to:filters.to||'',unitId:filters.unitId||'',status:filters.status||(type==='sales'?'all':'confirmed'),salesAudience:filters.salesAudience||'internal'};
  if(type==='overview'){
    check(!f.from&&!f.to&&!f.unitId,'O relatório geral não aceita filtros de período ou unidade.');
    return f;
  }
  check((type==='sales'?['all','available','sold']:['confirmed','reversed','all']).includes(f.status),'Situação do relatório inválida.');
  if(type==='sales'){
    check(!f.from&&!f.to,'A tabela de vendas mostra a posição atual, sem filtro de período.');
    check(['internal','share'].includes(f.salesAudience),'Versão da tabela de vendas inválida.');
  }else{
    if(f.from)date(f.from);
    if(f.to)date(f.to);
    check(!f.from||!f.to||f.from<=f.to,'A data inicial deve ser anterior ou igual à data final.');
  }
  if(f.unitId){
    check(type!=='payments','Filtre pagamentos pelo período e pela situação; o valor integral pode atender várias casas.');
    check(p.units.some(u=>u.id===f.unitId),'Escolha uma unidade deste empreendimento.');
  }
  return f;
}
function labels(type,p,f){
  if(type==='overview')return ['Posição atual do empreendimento'];
  const out=[];
  if(type==='sales')out.push(f.salesAudience==='share'?'Versão para compartilhar':'Uso interno',({all:'Todas as casas',available:'Casas disponíveis',sold:'Casas vendidas'})[f.status]);
  else{
    out.push(f.from||f.to?'Data do '+(type==='payments'?'pagamento':'recebimento')+': '+(f.from?brDate(f.from):'início')+' a '+(f.to?brDate(f.to):'sem limite final'):'Todo o período');
    out.push(({all:'Confirmados e estornados',confirmed:'Somente confirmados',reversed:'Somente estornados'})[f.status]);
  }
  if(f.unitId)out.push('Casa: '+unitName(p,f.unitId));
  return out;
}
const matches=(record,f)=>(!f.from||record.date>=f.from)&&(!f.to||record.date<=f.to)&&(f.status==='all'||Boolean(record.reversed)===(f.status==='reversed'));
function destination(p,e){
  const ids=Object.entries(e.allocation||{}).filter(([,value])=>value>0).map(([id])=>id);
  if(!ids.length)return 'Destino não informado';
  if(ids.length===1)return unitName(p,ids[0]);
  if(ids.length===p.units.length&&p.units.every(u=>ids.includes(u.id)))return 'Obra inteira - rateio gravado';
  return ids.length<=3?ids.map(id=>unitName(p,id)).join(' / '):'Rateio gravado entre '+ids.length+' casas';
}
function paymentRecords(p,f){
  return p.expenses.flatMap(expense=>(expense.payments||[]).filter(record=>(!expense.cancelled||record.reversed)&&matches(record,f)).map(record=>({expense,record}))).sort((a,b)=>a.record.date.localeCompare(b.record.date));
}
function paymentSections(p,records){
  const confirmed=sum(records,x=>x.record.reversed?0:x.record.cents),reversed=sum(records,x=>x.record.reversed?x.record.cents:0);
  const allReversed=records.length>0&&records.every(x=>x.record.reversed);
  const sections=[section('Pagamentos registrados',[
    column('Data', 'left',.8),column('Despesa / fornecedor','left',2.3),column('Destino','left',1.4),column('Etapa','left',1.2),column('Forma','left',.8),moneyColumn('Valor'),column('Situação','left',.9)
  ],records.map(({expense:e,record:r})=>[brDate(r.date),[e.description,e.supplier].filter(Boolean).join(' / '),destination(p,e),stageName(p,r.stageId||e.stageId),r.method||'-',money(r.cents),r.reversed?'Estornado':'Confirmado']),{footer:[allReversed?'Total estornado':'Total confirmado','','','','',money(allReversed?reversed:confirmed),''],note:'Cada linha representa um pagamento. O destino corresponde ao rateio gravado no custo; o valor não é o total pago por casa.'})];
  const detail=records.filter(({record:r})=>r.reference||r.notes||r.reversed);
  if(detail.length)sections.push(section('Referências e observações dos pagamentos',[column('Data','left',.7),column('Despesa','left',1.4),column('Registro','left',3)],detail.map(({expense:e,record:r})=>[brDate(r.date),e.description,[r.reference&&'Referência: '+r.reference,r.notes,r.reversed&&'Estorno: '+r.reversed].filter(Boolean).join(' | ')])));
  return sections;
}
function paymentsReport(p,f){
  const records=paymentRecords(p,f),confirmedCents=sum(records,x=>x.record.reversed?0:x.record.cents),reversedCents=sum(records,x=>x.record.reversed?x.record.cents:0);
  return {summary:[summary('Pagamentos confirmados',confirmedCents),summary('Pagamentos estornados',reversedCents),{label:'Registros selecionados',value:String(records.length)}],sections:paymentSections(p,records),metrics:{confirmedCents,reversedCents,count:records.length},notes:['Estornos são históricos e não entram no total confirmado. O período considera a data original do pagamento, não a data do estorno.','Valores contratados e saldos a pagar não são pagamentos realizados.']};
}
function receiptsReport(p,f){
  const records=p.sales.filter(s=>!f.unitId||s.unitId===f.unitId).flatMap(sale=>(sale.receipts||[]).filter(r=>(!sale.cancelled||r.reversed)&&matches(r,f)).map(record=>({sale,record}))).sort((a,b)=>a.record.date.localeCompare(b.record.date));
  const confirmedCents=sum(records,x=>x.record.reversed?0:x.record.cents),reversedCents=sum(records,x=>x.record.reversed?x.record.cents:0),allReversed=records.length>0&&records.every(x=>x.record.reversed);
  const sections=[section('Recebimentos registrados',[column('Data','left',.8),column('Casa'),column('Comprador / parcela','left',2.2),column('Forma','left',.8),moneyColumn('Valor'),column('Situação')],records.map(({sale:s,record:r})=>[brDate(r.date),unitName(p,s.unitId),[s.buyer,s.installments?.find(i=>i.id===r.installmentId)?.label].filter(Boolean).join(' / ')||'-',r.method||'-',money(r.cents),r.reversed?'Estornado':'Confirmado']),{footer:[allReversed?'Total estornado':'Total confirmado','','','',money(allReversed?reversedCents:confirmedCents),'']})];
  const detail=records.filter(({record:r})=>r.reference||r.notes||r.reversed);
  if(detail.length)sections.push(section('Referências e observações dos recebimentos',[column('Data','left',.7),column('Casa'),column('Registro','left',3)],detail.map(({sale:s,record:r})=>[brDate(r.date),unitName(p,s.unitId),[r.reference&&'Referência: '+r.reference,r.notes,r.reversed&&'Estorno: '+r.reversed].filter(Boolean).join(' | ')])));
  return {summary:[summary('Recebimentos confirmados',confirmedCents),summary('Recebimentos estornados',reversedCents),{label:'Registros selecionados',value:String(records.length)}],sections,metrics:{confirmedCents,reversedCents,count:records.length},notes:['O relatório considera entradas efetivamente registradas, pela data do recebimento. Contratos e parcelas previstas não são recebimentos.','Estornos não entram no total confirmado. O período considera a data original do recebimento.']};
}
function salesReport(p,f,actor){
  const rows=p.units.map(unit=>({unit,sale:activeSale(p,unit.id)})).filter(({unit,sale})=>(!f.unitId||unit.id===f.unitId)&&(f.status==='all'||(f.status==='sold'?Boolean(sale):!sale)));
  const sold=rows.filter(x=>x.sale),available=rows.filter(x=>!x.sale),availableAskingCents=sum(available,x=>x.unit.sale||0),askingNotInformedCount=available.filter(x=>!x.unit.sale).length;
  const base={summary:[{label:'Casas disponíveis',value:String(available.length)},{label:'Casas vendidas',value:String(sold.length)},summary('Preços informados das disponíveis',availableAskingCents),...(askingNotInformedCount?[{label:'Disponíveis sob consulta',value:String(askingNotInformedCount)}]:[])],metrics:{count:rows.length,availableCount:available.length,soldCount:sold.length,availableAskingCents,askingNotInformedCount}};
  if(f.salesAudience==='share')return {...base,subtitle:'Disponibilidade e preços anunciados',sections:[section('Tabela de disponibilidade',[column('Casa','left',1.4),column('Área (m²)','right',.8),column('Dormitórios','right',.8),column('Situação'),moneyColumn('Preço anunciado')],rows.map(({unit:u,sale:s})=>[u.name,number(u.area/100),String(u.bedrooms??p.bedrooms??'-'),s?'Vendida':'Disponível',s?'-':u.sale?money(u.sale):'Sob consulta']))],notes:['Preços anunciados e disponibilidade sujeitos a confirmação. Casas vendidas são apresentadas sem valores ou condições do contrato.',...(askingNotInformedCount?['O total de preços informados não inclui as casas sob consulta.']:[])]};
  const contractedCents=sum(sold,x=>x.sale.price);
  base.summary.push(summary('Vendas contratadas',contractedCents));
  base.metrics.contractedCents=contractedCents;
  const sections=[section('Posição das casas',[column('Casa','left',1.4),column('Área (m²)','right',.7),column('Situação'),moneyColumn('Valor'),column('Base do valor'),column('Data da venda','left',.9),moneyColumn('Laudo')],rows.map(({unit:u,sale:s})=>[u.name,number(u.area/100),s?'Vendida':'Disponível',s?money(s.price):u.sale?money(u.sale):'Não informado',s?'Contratado':'Anunciado / previsto',s?brDate(s.date):'-',u.commercial?.hasAppraisal?money(u.commercial.appraisalCents):'Sem laudo']))];
  sections.push(section('Condições das vendas',[column('Casa'),column('Comprador','left',1.5),column('Forma','left',1.3),moneyColumn('Entrada'),column('Parcelas da entrada','right',.8),moneyColumn('Saldo contratual')],sold.map(({unit:u,sale:s})=>[u.name,s.buyer||'-',SALE_MODES[s.paymentMode]||'Outra condição',money(s.entryCents||0),String(s.entryCount||0),money(s.price-(s.entryCents||0))]),{note:'Saldo contratual é o valor além da entrada combinada; não desconta recebimentos.'}));
  let commissionCents=0,commissionPaidCents=0,commissionUnverifiedCount=0;
  const commissionRows=sold.map(({unit:u,sale:s})=>{
    const value=s.commissionCents||0,e=p.expenses.find(e=>e.id===s.commissionExpenseId&&!e.cancelled),known=value===0||Boolean(e),paidValue=e?paid(e):0;
    commissionCents+=value;if(known)commissionPaidCents+=paidValue;else commissionUnverifiedCount++;
    return [u.name,s.seller||'Não informado',money(value),known?money(paidValue):'Não informado',known?money(value-paidValue):'Não informado'];
  });
  sections.push(section('Comissões de venda',[column('Casa'),column('Vendedor','left',1.5),moneyColumn('Comissão'),moneyColumn('Pago'),moneyColumn('Saldo')],commissionRows,{note:'Pagamentos da comissão vêm do custo vinculado à venda. Não são deduzidos dos recebimentos do comprador.'}));
  Object.assign(base.metrics,{commissionCents,commissionPaidCents,commissionUnverifiedCount});
  if(canAccess(actor,'receipts')){
    const receivedCents=sum(sold,x=>received(x.sale));
    Object.assign(base.metrics,{receivedCents,pendingReceiptsCents:contractedCents-receivedCents});
    sections.push(section('Recebimentos das vendas',[column('Casa','left',1.5),moneyColumn('Contratado'),moneyColumn('Recebido'),moneyColumn('A receber')],sold.map(({unit:u,sale:s})=>[u.name,money(s.price),money(received(s)),money(s.price-received(s))]),{footer:['Total',money(contractedCents),money(receivedCents),money(contractedCents-receivedCents)]}));
  }
  const detail=sold.filter(({sale:s})=>s.terms||s.notes);
  if(detail.length)sections.push(section('Condições e observações internas',[column('Casa'),column('Registro','left',4)],detail.map(({unit:u,sale:s})=>[u.name,[s.terms,s.notes].filter(Boolean).join(' | ')])));
  return {...base,subtitle:'Uso interno - posição comercial e financeira',sections,notes:['Casas disponíveis usam o preço anunciado; casas vendidas usam o valor do contrato ativo. Vendas canceladas não constam como vendas ativas.','Valores de laudo são referências de avaliação e não substituem o preço contratado.',...(commissionUnverifiedCount?['Há comissão sem custo vinculado disponível. Confira o registro antes de interpretar seu pagamento e saldo.']:[])]};
}
function overviewReport(p){
  const t=totals(p),expenses=p.expenses.filter(e=>!e.cancelled),payments=paymentRecords(p,{status:'confirmed'});
  const sections=[section('Posição financeira',[column('Indicador','left',3),moneyColumn('Valor')],[['Custos contratados',money(t.contracted)],['Pagamentos confirmados',money(t.paid)],['Saldo dos custos a pagar',money(t.pending)],['Custo final previsto, com reserva',money(t.forecast)],['Receita de vendas contratadas + disponíveis previstas',money(t.revenue)],['Despesas de venda adicionais previstas',money(t.selling)],['Lucro previsto',money(t.profit)]],{note:'Projeções dependem de orçamentos, preços das casas e reservas cadastrados. Receita prevista não representa dinheiro recebido.'}),section('Custos e projeções por casa',[column('Casa','left',1.3),column('Área (m²)','right',.7),moneyColumn('Contratado'),moneyColumn('Pago'),moneyColumn('Custo previsto'),moneyColumn('Venda / previsão'),moneyColumn('Lucro previsto')],t.units.map(u=>[u.name,number(u.area/100),money(u.contracted),money(u.paid),money(u.forecast),money(u.sale),money(u.profit)]),{note:'Pagamentos por casa seguem o rateio agregado gravado nos custos. Venda / previsão combina preço contratado das vendidas e preço previsto das disponíveis.'}),section('Custos registrados',[column('Despesa / fornecedor','left',2.2),column('Etapa','left',1.3),column('Destino','left',1.4),moneyColumn('Contratado'),moneyColumn('Pago'),moneyColumn('Saldo')],expenses.map(e=>[[e.description,e.supplier].filter(Boolean).join(' / '),stageName(p,e.stageId),destination(p,e),money(e.total),money(paid(e)),money(e.total-paid(e))]),{footer:['Total','','',money(t.contracted),money(t.paid),money(t.pending)]}),...paymentSections(p,payments)];
  return {summary:[summary('Custos contratados',t.contracted),summary('Pagamentos confirmados',t.paid),summary('Saldo a pagar',t.pending),summary('Custo final previsto',t.forecast),summary('Lucro previsto',t.profit)],sections,metrics:{contractedCents:t.contracted,paidCents:t.paid,pendingCents:t.pending,forecastCents:t.forecast,revenueCents:t.revenue,sellingCents:t.selling,profitCents:t.profit},notes:['Custos contratados, pagamentos realizados e projeções são apresentados separadamente.','Custos e pagamentos estornados ou cancelados não compõem os totais atuais. Nenhuma operação financeira é executada ao gerar este relatório.']};
}
function csvValue(value,isMoney){
  if(!isMoney)return value;
  const text=String(value);
  return /^-?R\$[\s\u00a0]*[\d.]+,\d{2}$/.test(text)?text.replace('R$','').replace(/[\s\u00a0.]/g,''):text;
}
function reportCsv(model){
  const rows=[[model.title],['Empreendimento',model.projectName],['Empresa',model.company],['Emitido em',model.issuedAt],...model.filterLabels.map(value=>['Filtro',value]),[],['Resumo','Valor'],...model.summary.map(s=>[s.label,csvValue(s.value,true)])];
  for(const s of model.sections){
    rows.push([],[s.title],s.columns.map(c=>c.label));
    const convert=row=>row.map((cell,i)=>csvValue(cell,s.columns[i]?.label.includes('(R$)')));
    rows.push(...s.rows.map(convert));
    if(s.footer)rows.push(convert(s.footer));
    if(!s.rows.length)rows.push([s.emptyText]);
    if(s.note)rows.push(['Observação',s.note]);
  }
  if(model.notes.length)rows.push([],['Notas'],...model.notes.map(n=>[n]));
  return csv(rows);
}
export function buildReport({type,project,actor,company='',filters={},issuedAt=new Date().toISOString()}){
  check(allowedReportTypes(actor).includes(type),'Seu acesso não permite gerar este relatório.');
  check(project&&Array.isArray(project.units),'Selecione um empreendimento para gerar o relatório.');
  check(typeof issuedAt==='string'&&Number.isFinite(Date.parse(issuedAt)),'Data de emissão inválida.');
  const p={...project,stages:project.stages||[],expenses:project.expenses||[],sales:project.sales||[]},f=validateFilters(type,p,filters);
  const content=type==='payments'?paymentsReport(p,f):type==='receipts'?receiptsReport(p,f):type==='sales'?salesReport(p,f,actor):overviewReport(p);
  const model={type,title:TITLES[type],projectName:String(p.name||'Empreendimento'),company:String(company),issuedAt,filterLabels:labels(type,p,f),...content,filename:slug(TITLES[type])+'-'+slug(p.name)+(type==='sales'&&f.salesAudience==='share'?'-compartilhar':'')+'-'+issuedAt.slice(0,10)};
  model.csv=reportCsv(model);
  return model;
}
