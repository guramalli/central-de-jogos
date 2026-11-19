import {allowedReportTypes,buildReport} from './reports-domain.mjs?v=20261119-viability30';
const LABELS={payments:'Pagamentos',sales:'Tabela de vendas',receipts:'Recebimentos',overview:'Relatório geral da obra'};
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const options=(rows,value)=>rows.map(([key,label])=>`<option value="${esc(key)}" ${key===value?'selected':''}>${esc(label)}</option>`).join('');
const localTime=value=>new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(value));
function download(blob,filename){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
export function reportPreview(model){
 const sections=model.sections.map(section=>`<section class="reports-section"><h3>${esc(section.title)}</h3>${section.note?`<p class="reports-note">${esc(section.note)}</p>`:''}${section.rows.length?`<div class="reports-table-scroll" role="region" aria-label="${esc(section.title)}" tabindex="0"><table><thead><tr>${section.columns.map(col=>`<th scope="col" class="${col.align==='right'?'reports-number':''}">${esc(col.label)}</th>`).join('')}</tr></thead><tbody>${section.rows.map(row=>`<tr>${section.columns.map((col,i)=>`<td class="${col.align==='right'?'reports-number':''}">${esc(row[i])}</td>`).join('')}</tr>`).join('')}</tbody>${section.footer?`<tfoot><tr>${section.columns.map((col,i)=>`<td class="${col.align==='right'?'reports-number':''}">${esc(section.footer[i])}</td>`).join('')}</tr></tfoot>`:''}</table></div>`:`<p class="reports-empty">${esc(section.emptyText||'Nenhum registro encontrado para os filtros selecionados.')}</p>`}</section>`).join('');
 return `<article class="reports-preview"><header class="reports-document-head"><div><p class="reports-brand">SOLUÇÃO SOBRADOS</p><h2>${esc(model.title)}</h2><p class="reports-project">${esc(model.projectName)}</p>${model.company?`<p>${esc(model.company)}</p>`:''}</div><p class="reports-issued">Emitido em<br><strong>${esc(localTime(model.issuedAt))}</strong></p></header>${model.subtitle?`<p class="reports-subtitle">${esc(model.subtitle)}</p>`:''}<div class="reports-filter-summary">${model.filterLabels.map(label=>`<span>${esc(label)}</span>`).join('')}</div>${model.summary.length?`<div class="reports-summary">${model.summary.map(item=>`<div><span>${esc(item.label)}</span><strong>${esc(item.value)}</strong></div>`).join('')}</div>`:''}${sections}${model.notes.length?`<footer class="reports-document-notes">${model.notes.map(note=>`<p>${esc(note)}</p>`).join('')}</footer>`:''}</article>`;
}
export function openReportCenter({dialog,initialType='payments',initialSnapshot,getSnapshot,isCurrent=()=>true,onClose=()=>{}}){
 let alive=true,sequence=0,model=null,busy=false;
 const available=allowedReportTypes(initialSnapshot.actor);
 if(!available.length)throw new Error('Nenhum relatório está disponível para os seus acessos.');
 const chosen=available.includes(initialType)?initialType:available[0];
 dialog.classList.add('reports-dialog');
 dialog.innerHTML=`<div class="reports-header"><div><p class="eyebrow">SOLUÇÃO SOBRADOS</p><h2>Gerar relatórios</h2><p>${esc(initialSnapshot.project.name)}</p></div><button type="button" class="icon-btn" id="reports-close" aria-label="Fechar relatórios">×</button></div><div class="reports-body"><form id="reports-form"><fieldset id="reports-fields"><div class="reports-filters"><label>Relatório<select name="type">${options(available.map(type=>[type,LABELS[type]]),chosen)}</select></label><label id="reports-from-label">De<input type="date" name="from"></label><label id="reports-to-label">Até<input type="date" name="to"></label><label id="reports-status-label">Situação<select name="status"></select></label><label id="reports-unit-label">Casa<select name="unitId">${options([['','Todas as casas'],...initialSnapshot.project.units.map(unit=>[unit.id,unit.name])],'')}</select></label><label id="reports-audience-label">Versão da tabela<select name="salesAudience">${options([['internal','Uso interno'],['share','Para compartilhar']],'internal')}</select></label></div><p class="reports-help" id="reports-help"></p><div class="reports-filter-actions"><button type="submit" class="btn primary">Gerar prévia</button><button type="button" class="btn" id="reports-clear">Limpar filtros</button></div></fieldset></form><p class="reports-error" id="reports-error" role="alert" hidden></p><div class="reports-export-bar"><p id="reports-status" role="status" aria-live="polite">Preparando relatório…</p><div><button type="button" class="btn primary" id="reports-pdf" disabled>Baixar PDF</button><button type="button" class="btn" id="reports-csv" disabled>Exportar planilha CSV</button></div></div><div id="reports-result"></div></div><footer class="reports-footer"><span>O PDF tem páginas próprias, cabeçalhos e totais. Você também pode imprimi-lo pelo leitor de PDF.</span><button type="button" class="btn" id="reports-done">Fechar</button></footer>`;
 const find=selector=>dialog.querySelector(selector),form=find('#reports-form'),fields=find('#reports-fields'),result=find('#reports-result'),status=find('#reports-status'),error=find('#reports-error'),typeField=form.elements.type;
 const pdfButton=find('#reports-pdf'),csvButton=find('#reports-csv'),clearButton=find('#reports-clear'),closeButton=find('#reports-close'),doneButton=find('#reports-done');
 const ownsDialog=()=>dialog.querySelector('#reports-form')===form;
 const current=()=>alive&&dialog.open&&dialog.isConnected!==false&&form.isConnected!==false&&ownsDialog()&&isCurrent();
 function setBusy(value){busy=value;fields.disabled=value;pdfButton.disabled=value||!model;csvButton.disabled=value||!model;result.setAttribute('aria-busy',String(value));}
 function invalidate(){sequence++;model=null;result.innerHTML='';pdfButton.disabled=true;csvButton.disabled=true;error.hidden=true;status.textContent='Filtros alterados. Gere uma nova prévia para exportar.';}
 function configure(){const type=typeField.value,dated=['payments','receipts'].includes(type),units=['sales','receipts'].includes(type);find('#reports-from-label').hidden=find('#reports-to-label').hidden=!dated;form.elements.from.disabled=form.elements.to.disabled=!dated;find('#reports-unit-label').hidden=!units;form.elements.unitId.disabled=!units;find('#reports-status-label').hidden=type==='overview';form.elements.status.disabled=type==='overview';find('#reports-audience-label').hidden=type!=='sales';form.elements.salesAudience.disabled=type!=='sales';form.elements.status.innerHTML=options(type==='sales'?[['all','Todas as casas'],['available','Disponíveis'],['sold','Vendidas']]:[['confirmed','Confirmados'],['reversed','Estornados'],['all','Confirmados e estornados']],type==='sales'?'all':'confirmed');find('#reports-help').textContent=type==='payments'?'Período pela data do pagamento. Cada pagamento aparece pelo valor integral, com seu destino. Estornos ficam separados dos valores confirmados.':type==='receipts'?'Período pela data do recebimento. O relatório considera o dinheiro registrado como recebido, separado do valor contratado da venda.':type==='sales'?'Uso interno reúne a negociação e os detalhes autorizados. Para compartilhar mostra as casas e os valores previstos das disponíveis, sem compradores, comissões ou recebimentos.':'Resumo do empreendimento, resultado por casa, custos e pagamentos. Valores previstos e registrados aparecem identificados.';}
 function readFilters(){const type=typeField.value;if(type==='overview')return {};if(type==='sales')return {status:form.elements.status.value,unitId:form.elements.unitId.value,salesAudience:form.elements.salesAudience.value};return {from:form.elements.from.value,to:form.elements.to.value,status:form.elements.status.value,...(type==='receipts'?{unitId:form.elements.unitId.value}:{})};}
 async function generate(exportKind=''){
  if(!current()||busy||!form.reportValidity())return;
  const token=++sequence,type=typeField.value,filters=readFilters();model=null;error.hidden=true;result.innerHTML='';setBusy(true);status.textContent='Atualizando os dados e preparando o relatório…';
  try{
   const snapshot=await getSnapshot();
   if(!current()||token!==sequence)return;
   const next=buildReport({type,...snapshot,filters,issuedAt:new Date().toISOString()});
   model=next;result.innerHTML=reportPreview(next);setBusy(true);status.textContent='Prévia atualizada em '+localTime(next.issuedAt)+'.';
   if(exportKind==='pdf'){
    status.textContent='Preparando PDF com paginação…';
    const {createReportPdf}=await import('./reports-pdf.mjs?v=20261118-reports12');
    if(!current()||token!==sequence)return;
    const doc=createReportPdf(next);
    if(!current()||token!==sequence)return;
    download(doc.output('blob'),next.filename+'.pdf');status.textContent='PDF preparado. Confira o download ou o leitor de PDF do seu navegador.';
   }else if(exportKind==='csv'){
    if(!current()||token!==sequence)return;
    download(new Blob([next.csv],{type:'text/csv;charset=utf-8'}),next.filename+'.csv');status.textContent='Planilha preparada com os mesmos filtros desta prévia.';
   }
  }catch(cause){if(!current()||token!==sequence)return;model=null;result.innerHTML='';error.textContent=cause.message||'Não foi possível gerar o relatório.';error.hidden=false;status.textContent='Confira os filtros e a conexão e tente novamente.';}
  finally{if(current()&&token===sequence){setBusy(false);configureDisabled();}}
 }
 function configureDisabled(){const type=typeField.value;form.elements.from.disabled=form.elements.to.disabled=!['payments','receipts'].includes(type);form.elements.unitId.disabled=!['sales','receipts'].includes(type);form.elements.status.disabled=type==='overview';form.elements.salesAudience.disabled=type!=='sales';}
 function onChange(event){if(!current())return;if(event.target===typeField)configure();invalidate();form.elements.from.max=form.elements.to.value;form.elements.to.min=form.elements.from.value;}
 function close(){if(current())dialog.close();}
 function closed(){
  // Native close events are queued: a previous close may arrive after reuse.
  if(!ownsDialog()){dispose();return;}
  if(dialog.open)return;
  dispose();onClose();
 }
 function dispose(){
  if(!alive)return;
  alive=false;sequence++;model=null;result.innerHTML='';
  form.removeEventListener('change',onChange);form.removeEventListener('input',onInput);form.onsubmit=null;
  for(const button of [pdfButton,csvButton,clearButton,closeButton,doneButton])button.onclick=null;
  dialog.removeEventListener('close',closed);
  if(!ownsDialog())return;
  dialog.classList.remove('reports-dialog');
  if(dialog.open)dialog.close();
  if(ownsDialog())dialog.innerHTML='';
 }
 function onInput(event){if(event.target.tagName==='INPUT')onChange(event);}
 form.addEventListener('change',onChange);form.addEventListener('input',onInput);form.onsubmit=event=>{event.preventDefault();generate();};
 clearButton.onclick=()=>{if(!current())return;form.reset();typeField.value=chosen;configure();onChange({target:typeField});};
 pdfButton.onclick=()=>generate('pdf');csvButton.onclick=()=>generate('csv');closeButton.onclick=doneButton.onclick=close;
 dialog.addEventListener('close',closed);configure();dialog.showModal();generate();return dispose;
}
