import { comparison,today,money,quantity,lineTotal } from './domain.mjs';
export const PROCUREMENT_ROLES={vini:'Diretoria',caru:'Administrativo · aprovação',rogerio:'Gestão de obra',stephanie:'Engenharia',secretaria:'Compras e financeiro',gabriela:'Manutenção'};
export const preferences=s=>({leadDays:7,minimumQuotes:1,roleLabels:{...PROCUREMENT_ROLES},...s.preferences});
export function requestRows(s,filter={}) {const q=(filter.query||'').toLocaleLowerCase('pt-BR');return s.requests.filter(r=>(!filter.workId||r.workId===filter.workId)&&(!filter.status||r.status===filter.status)&&(!filter.priority||r.priority===filter.priority)&&`${r.code} ${r.title} ${r.requesterName}`.toLocaleLowerCase('pt-BR').includes(q));}
export function procurementDesk(s,now=today()) {
  const until=new Date(`${now}T12:00:00Z`);until.setUTCDate(until.getUTCDate()+preferences(s).leadDays);const cutoff=until.toISOString().slice(0,10);
  return s.requests.filter(r=>r.status==='open').map(r=>{const quotes=comparison(s,r.id,now),missing=r.supplierIds.filter(id=>!quotes.some(q=>q.supplierId===id));const followups=(s.followups||[]).filter(f=>f.requestId===r.id);const latest=followups.filter(f=>!followups.some(n=>n.supplierId===f.supplierId&&followups.indexOf(n)>followups.indexOf(f)));return {request:r,quotes,missing,followups:latest,urgent:r.deadline<=cutoff,overdue:r.deadline<now,ready:quotes.filter(q=>!q.issues.length).length};});
}
export function comparisonCSV(s,requestId,now=today()) {
  const r=s.requests.find(r=>r.id===requestId);if(!r)throw new Error('Solicitação não encontrada.');const qs=comparison(s,r.id,now);
  const rows=[['Cotação',r.code,r.title],['Item / critério','Quantidade solicitada',...qs.map(q=>s.suppliers.find(f=>f.id===q.supplierId)?.name||q.supplierId)]];
  for(const i of r.items){rows.push([i.name,`${quantity(i.qtyMillis)} ${i.unit}`,...qs.map(q=>{const l=q.lines.find(l=>l.itemId===i.id);return l?`${quantity(l.qtyMillis)} × ${money(l.unitCents)} = ${money(lineTotal(l.unitCents,l.qtyMillis))}; ${l.equivalent?'equivalente':'conferir equivalência'}`:'Não cotado';})]);}
  for(const [label,fn] of [['Frete',q=>q.freightCents===null?'Pendente':money(q.freightCents)],['Total informado',q=>money(q.totalCents)],['Validade',q=>q.validUntil||'Pendente'],['Pagamento',q=>q.payment||'Pendente'],['Conferência',q=>q.issues.join('; ')||'Apta para escopo completo']]) rows.push([label,'',...qs.map(fn)]);
  const cell=v=>{let t=String(v??'');if(/^[\s]*[=+@-]/.test(t)||/^[\t\r\n]/.test(t))t="'"+t;return '"'+t.replaceAll('"','""')+'"';};return '\uFEFF'+rows.map(row=>row.map(cell).join(';')).join('\r\n');
}
