import { esc, select } from '../orcamentos/client.mjs';
import { prepareRegistryCommand } from './domain.mjs';
export function registryBadge(record){return record?.registryRef?'<p class="hint wide">Vinculado ao cadastro compartilhado. Esta ficha preserva os dados usados no lançamento; alterações no cadastro central não reescrevem contratos ou processos existentes.</p>':'';}
export async function attachRegistryPicker(client,kind){
  const form=document.querySelector('#editor');if(!form||client.actor.role==='solicitante')return;
  const tenant=client.actor.tenantId;const host=document.createElement('section');host.className='wide registry-picker';host.innerHTML='<p class="form-help">Carregando cadastros compartilhados…</p>';form.querySelector('.form-grid').prepend(host);
  try{
    const {state:s}=await client.registryRead();if(!form.isConnected||client.actor.tenantId!==tenant)return;
    let applied=[];
    const clear=()=>{form.querySelector('input[name="registrySelection"]')?.remove();for(const node of applied)node.readOnly=false;applied=[];};
    host.innerHTML=`<h3>Reutilizar cadastro compartilhado</h3><p class="form-help">Opcional. Selecione o empreendimento para localizar os clientes disponíveis neste módulo.</p>${select('_sharedEnterprise','Empreendimento compartilhado',[['','Todos / imóvel avulso'],...s.enterprises.map(e=>[e.id,e.name])])}${kind!=='work'?'<div class="registry-client-select"></div>':''}<div class="actions"><button class="btn" type="button" data-shared-apply>Preencher com cadastro</button><button class="btn" type="button" data-shared-clear>Preencher manualmente</button><a class="btn" href="/mooveon/cadastros?module=${client.module}${client.demo?'&demo=1':''}" target="_blank" rel="noopener">Gerenciar cadastros</a></div><p class="form-help" role="status" data-shared-message></p>`;
    const enterprise=host.querySelector('select'),message=host.querySelector('[data-shared-message]');
    const options=()=>{
      if(kind==='work')return;
      const customers=s.customers.filter(c=>!enterprise.value||s.properties.some(i=>i.customerId===c.id&&i.enterpriseId===enterprise.value));
      const rows=[];for(const c of customers){const properties=s.properties.filter(i=>i.customerId===c.id&&(!enterprise.value||i.enterpriseId===enterprise.value));if(!enterprise.value)rows.push([`c:${c.id}`,`${c.name} · somente cliente`]);for(const i of properties)rows.push([`p:${i.id}`,`${c.name} · ${s.enterprises.find(e=>e.id===i.enterpriseId)?.name||'Avulso'} · ${i.unit}`]);}
      host.querySelector('.registry-client-select').innerHTML=select('_sharedCustomer','Cliente / imóvel',[['','Selecione…'],...rows]);
      host.querySelector('.registry-client-select select').onchange=()=>{clear();message.textContent='Clique em preencher para usar a nova seleção.';};
    };
    enterprise.onchange=()=>{clear();options();message.textContent='';};options();
    host.querySelector('[data-shared-clear]').onclick=()=>{clear();message.textContent='Preenchimento manual. Os valores no formulário podem ser editados.';};
    host.querySelector('[data-shared-apply]').onclick=()=>{
      try{
        const value=host.querySelector('.registry-client-select select')?.value;const property=value?.startsWith('p:')?s.properties.find(i=>i.id===value.slice(2)):null;
        const pick={revision:s.revision,enterpriseId:enterprise.value||property?.enterpriseId||'',customerId:property?.customerId||(value?.startsWith('c:')?value.slice(2):''),propertyId:property?.id||''};
        const type=kind==='work'?'work.create':kind==='case'?'case.create':kind==='legal-contract'?'contract.create':'contract.save';
        const data=prepareRegistryCommand(s,client.registryActor(),client.module,{type,payload:{registrySelection:pick}}).payload;
        clear();for(const [key,value]of Object.entries(data)){if(key==='registryRef')continue;const node=form.elements.namedItem(key);if(node&&'value'in node){node.value=value;if(node.tagName!=='SELECT'){node.readOnly=true;applied.push(node);}node.dispatchEvent(new Event('change',{bubbles:true}));}}
        const hidden=document.createElement('input');hidden.type='hidden';hidden.name='registrySelection';hidden.value=JSON.stringify(pick);form.append(hidden);
        message.textContent='Cadastro selecionado. Dados cadastrais serão conferidos novamente ao salvar. Complete as condições específicas deste módulo.';
      }catch(e){message.textContent=e.message;}
    };
  }catch(e){if(host.isConnected)host.textContent=`Cadastro compartilhado indisponível: ${e.message}. O preenchimento manual continua disponível.`;}
}
