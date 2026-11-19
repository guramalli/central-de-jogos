import {TUTORIALS,TUTORIAL_GROUPS} from './tutorials-content.mjs?v=20261119-tutorial17';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
const groupLabel=id=>TUTORIAL_GROUPS.find(group=>group.id===id)?.label||'No aplicativo';
const number=value=>String(value).padStart(2,'0');
const button=(text,action,attributes='',primary=false)=>`<button type="button" class="tutorial-button${primary?' tutorial-primary':''}" data-tutorial-action="${action}" ${attributes}>${text}</button>`;

export function visibleTutorials(platformAdmin=false,tutorials=TUTORIALS){
  return tutorials.filter(tutorial=>tutorial.visibility!=='platform'||platformAdmin===true);
}

export function searchTutorials({query='',group='all',platformAdmin=false,tutorials=TUTORIALS}={}){
  const terms=normalize(query).trim().split(/\s+/).filter(Boolean);
  return visibleTutorials(platformAdmin,tutorials).filter(tutorial=>{
    if(group!=='all'&&tutorial.group!==group)return false;
    const searchable=normalize([tutorial.title,tutorial.summary,groupLabel(tutorial.group),...(tutorial.steps||[]).flatMap(step=>[step.title,step.text]),...(tutorial.tips||[]),...(tutorial.keywords||[]),tutorial.example].join(' '));
    return terms.every(term=>searchable.includes(term));
  });
}

export function tutorialCards({tutorials,catalog=visibleTutorials()}={}){
  if(!tutorials.length)return `<div class="tutorial-empty"><span aria-hidden="true">⌕</span><h2>Nenhum tutorial encontrado</h2><p>Tente outro termo ou procure em todos os assuntos.</p>${button('Limpar busca e filtros','reset')}</div>`;
  return `<div class="tutorial-cards">${tutorials.map(tutorial=>`<button type="button" class="tutorial-card" data-tutorial-action="guide" data-tutorial-id="${esc(tutorial.id)}"><span class="tutorial-card-meta"><span class="tutorial-number">${number(catalog.findIndex(item=>item.id===tutorial.id)+1)}</span><span>${esc(groupLabel(tutorial.group))}</span></span><strong>${esc(tutorial.title)}</strong><span class="tutorial-card-summary">${esc(tutorial.summary)}</span><span class="tutorial-card-footer"><span>${(tutorial.steps||[]).length} passos</span><span>Ver tutorial <span aria-hidden="true">→</span></span></span></button>`).join('')}</div>`;
}

export function tutorialDetail({tutorial,catalog=visibleTutorials(),allowOpen=false}={}){
  const index=catalog.findIndex(item=>item.id===tutorial.id),previous=catalog[index-1],next=catalog[index+1];
  const related=(tutorial.related||[]).map(id=>catalog.find(item=>item.id===id)).filter(Boolean);
  return `<div class="tutorial-detail-top">${button('← Voltar aos tutoriais','catalog')}<span>Guia ${number(index+1)} de ${number(catalog.length)}</span></div><header class="tutorial-guide-header"><p class="tutorial-eyebrow">${esc(groupLabel(tutorial.group))}</p><h1 data-tutorial-heading tabindex="-1">${esc(tutorial.title)}</h1><p class="tutorial-lead">${esc(tutorial.summary)}</p>${allowOpen&&tutorial.moduleId?button('Abrir no aplicativo ↗','open',`data-module-id="${esc(tutorial.moduleId)}"`,true):''}</header><div class="tutorial-detail-layout"><article class="tutorial-lesson"><section aria-labelledby="tutorial-steps-heading"><div class="tutorial-section-heading"><span class="tutorial-section-icon" aria-hidden="true">✓</span><div><p class="tutorial-eyebrow">Na prática</p><h2 id="tutorial-steps-heading">Passo a passo</h2></div></div><ol class="tutorial-steps">${(tutorial.steps||[]).map((step,i)=>`<li><span class="tutorial-step-number" aria-hidden="true">${i+1}</span><div><h3>${esc(step.title)}</h3><p>${esc(step.text)}</p></div></li>`).join('')}</ol></section>${tutorial.example?`<section class="tutorial-example" aria-labelledby="tutorial-example-heading"><p class="tutorial-eyebrow">Exemplo fictício</p><h2 id="tutorial-example-heading">Veja como aplicar</h2><p>${esc(tutorial.example)}</p></section>`:''}</article><aside class="tutorial-guide-aside">${(tutorial.tips||[]).length?`<section class="tutorial-tips"><p class="tutorial-eyebrow">Para dar certo</p><h2>Dicas úteis</h2><ul>${tutorial.tips.map(tip=>`<li>${esc(tip)}</li>`).join('')}</ul></section>`:''}<section class="tutorial-context"><h2>Seu acesso ao aplicativo</h2><p>Os módulos disponíveis dependem do seu cargo, dos acessos definidos pelo diretor e da situação da empresa. Você pode consultar estas instruções sem alterar nenhum registro.</p></section>${related.length?`<section class="tutorial-related"><h2>Continue aprendendo</h2>${related.map(item=>button(`${esc(item.title)} <span aria-hidden="true">→</span>`,'guide',`data-tutorial-id="${esc(item.id)}"`)).join('')}</section>`:''}</aside></div><nav class="tutorial-sequence" aria-label="Sequência dos tutoriais">${previous?button(`<small>← Anterior</small><span>${esc(previous.title)}</span>`,'guide',`data-tutorial-id="${esc(previous.id)}"`):'<span></span>'}${next?button(`<small>Próximo →</small><span>${esc(next.title)}</span>`,'guide',`data-tutorial-id="${esc(next.id)}"`):button('<small>Você chegou ao último guia</small><span>Voltar aos tutoriais →</span>','catalog')}</nav>`;
}

export function mountTutorials({container,actor,platformAdmin=false,canOpen=()=>false,onOpen,initialId}={}){
  if(!container)throw new TypeError('Informe onde abrir os tutoriais.');
  const catalog=visibleTutorials(platformAdmin),groups=TUTORIAL_GROUPS.filter(group=>catalog.some(tutorial=>tutorial.group===group.id));
  let disposed=false,selected=catalog.some(tutorial=>tutorial.id===initialId)?initialId:null,query='',group='all',epoch=0;
  const context={id:actor?.id,organizationId:actor?.organizationId};
  const alive=()=>!disposed&&actor?.id===context.id&&actor?.organizationId===context.organizationId;
  const allowed=moduleId=>{try{return typeof onOpen==='function'&&Boolean(moduleId)&&canOpen(moduleId)===true;}catch{return false;}};
  const find=selector=>container.querySelector(selector);
  const setFeedback=message=>{if(!alive())return;const output=find('[data-tutorial-feedback]');if(output){output.textContent=message;output.hidden=!message;}};
  function drawCatalog(){
    container.innerHTML=`<div class="tutorial-app"><header class="tutorial-hero"><div><p class="tutorial-eyebrow">Central de tutoriais</p><h1 data-tutorial-heading tabindex="-1">Da primeira obra à entrega.</h1><p class="tutorial-lead">Aprenda a organizar cada etapa no Solução Sobrados. Escolha um assunto ou siga os guias na ordem, do cadastro ao acompanhamento dos resultados.</p><div class="tutorial-hero-actions">${catalog.length?button('Começar pelo primeiro guia →','guide',`data-tutorial-id="${esc(catalog[0].id)}"`,true):''}<span>${catalog.length} guias para consultar</span></div></div><div class="tutorial-hero-route" aria-hidden="true"><span>01 <b>Organize</b><small>Cadastros e equipe</small></span><span>02 <b>Acompanhe</b><small>Obra e financeiro</small></span><span>03 <b>Entregue</b><small>Vendas e assistência</small></span></div></header><section class="tutorial-library" aria-labelledby="tutorial-library-heading"><div class="tutorial-library-top"><div><p class="tutorial-eyebrow">Encontre sua próxima resposta</p><h2 id="tutorial-library-heading">O que você quer aprender?</h2></div><label class="tutorial-search"><span>Buscar nos tutoriais</span><input type="search" data-tutorial-search value="${esc(query)}" placeholder="Ex.: pagamento, manutenção, venda" autocomplete="off" maxlength="200"></label></div><div class="tutorial-filter-list" role="group" aria-label="Filtrar por assunto">${[{id:'all',label:'Todos os assuntos'},...groups].map(item=>`<button type="button" class="tutorial-filter" data-tutorial-action="group" data-group-id="${esc(item.id)}" aria-pressed="${group===item.id}">${esc(item.label)}</button>`).join('')}</div><p class="tutorial-result-count" data-tutorial-count role="status" aria-live="polite"></p><div data-tutorial-results></div></section><p class="tutorial-feedback" data-tutorial-feedback role="alert" hidden></p></div>`;
    updateResults();
  }
  function updateResults(){
    if(!alive()||selected)return;
    const results=searchTutorials({query,group,platformAdmin});
    find('[data-tutorial-results]').innerHTML=tutorialCards({tutorials:results,catalog});
    find('[data-tutorial-count]').textContent=`${results.length} ${results.length===1?'tutorial encontrado':'tutoriais encontrados'}${query.trim()?` para “${query.trim()}”`:''}.`;
    for(const filter of container.querySelectorAll('[data-group-id]'))filter.setAttribute('aria-pressed',String(filter.dataset.groupId===group));
  }
  function draw(focus=false){
    if(!alive())return;epoch++;
    const tutorial=catalog.find(item=>item.id===selected);
    if(tutorial){container.innerHTML=`<div class="tutorial-app">${tutorialDetail({tutorial,catalog,allowOpen:allowed(tutorial.moduleId)})}<p class="tutorial-feedback" data-tutorial-feedback role="alert" hidden></p></div>`;}
    else {selected=null;drawCatalog();}
    if(focus){find('[data-tutorial-heading]')?.focus();}
  }
  function onInput(event){
    if(!alive()||selected||!event.target.matches?.('[data-tutorial-search]'))return;
    query=event.target.value;updateResults();
  }
  function onClick(event){
    const control=event.target.closest?.('[data-tutorial-action]');if(!alive()||!control||!container.contains(control))return;
    const action=control.dataset.tutorialAction;
    if(action==='guide'){
      if(!catalog.some(tutorial=>tutorial.id===control.dataset.tutorialId))return;
      selected=control.dataset.tutorialId;draw(true);
    }else if(action==='catalog'){selected=null;draw(true);}
    else if(action==='group'&&!selected){const next=control.dataset.groupId;if(next!=='all'&&!groups.some(item=>item.id===next))return;group=next;updateResults();}
    else if(action==='reset'&&!selected){query='';group='all';find('[data-tutorial-search]').value='';updateResults();find('[data-tutorial-search]').focus();}
    else if(action==='open'){
      const tutorial=catalog.find(item=>item.id===selected);if(!tutorial||tutorial.moduleId!==control.dataset.moduleId||!allowed(tutorial.moduleId))return;
      const stamp=epoch;setFeedback('');
      try{Promise.resolve(onOpen(tutorial.moduleId)).catch(error=>{if(alive()&&stamp===epoch)setFeedback(error?.message||'Não foi possível abrir este módulo.');});}
      catch(error){if(alive()&&stamp===epoch)setFeedback(error?.message||'Não foi possível abrir este módulo.');}
    }
  }
  container.addEventListener('input',onInput);container.addEventListener('click',onClick);draw();
  return ()=>{if(disposed)return;disposed=true;epoch++;container.removeEventListener('input',onInput);container.removeEventListener('click',onClick);container.innerHTML='';};
}
