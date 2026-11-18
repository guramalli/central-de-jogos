import { empty,command,validate } from './domain.mjs?v=20261118-trash1';
export function demo(){
  let s=empty();const run=(type,d)=>{const r=command(s,type,d);s=r.state;return r.result;};
  const create=(name,count,year,land,sale)=>run('project.create',{name,neighborhood:'Vila Tupi',zone:'Zona 2',address:'Endereço ilustrativo · Praia Grande / SP',start:year+'-02-10',type:'condominium',bedrooms:2,allocation:'area',reserveBps:500,sellingBps:600,targetBps:2000,notes:'Empreendimento demonstrativo. Custos e condições totalmente fictícios.',count,area:6200,sale:sale*100,land:land*100,commission:land*5,taxes:1800000,acquisitionPaid:true,laborMode:'separate'});
  const add=(projectId,stageName,category,description,kind,qty,uom,price,when,pay=1,extra={})=>{
    const p=s.projects.find(p=>p.id===projectId),stageId=p.stages.find(st=>st.name===stageName).id;
    const e=run('expense.save',{projectId,stageId,description,category,kind,qty:Math.round(qty*1000),uom,unitCents:Math.round(price*100),date:when,due:when,mode:'area',supplier:'Fornecedor demonstrativo',...extra});
    if(pay)run('payment.add',{projectId,id:e.id,cents:Math.round(e.total*pay),date:when,method:'Transferência ilustrativa'});return e;
  };
  const current=create('Gabi Diniz · demonstração',7,'2026',420000,390000);
  const budgets={'Terreno e aquisição':441000,'Projetos e documentação':42000,'Preparação do terreno':22000,'Fundação e baldrame':88000,'Estrutura e lajes':156000,'Alvenaria':95000,'Cobertura':67000,'Elétrica':48000,'Hidráulica':42000,'Impermeabilização':31000,'Revestimentos e pisos':145000,'Grafiato e pintura':76000,'Esquadrias':112000,'Acabamentos':96000,'Áreas comuns e fachada':85000,'Entrega e regularização':28000,'Empreitada geral':342860};
  for(const st of current.stages)run('stage.save',{projectId:current.id,id:st.id,name:st.name,budget:budgets[st.name]*100,progress:st.name==='Terreno e aquisição'?100:st.name==='Fundação e baldrame'?65:st.name==='Projetos e documentação'?100:0});
  add(current.id,'Empreitada geral','Empreitada','Empreitada por m²','labor',434,'m²',790,'2026-06-05',.35,{coverage:'Pedreiro,Servente',notes:'Somente alvenaria e estrutura. Elétrica e hidráulica contratadas à parte.'});
  const cement=add(current.id,'Fundação e baldrame','Material','Cimento CP II · saco 50 kg','material',240,'saco',38.9,'2026-10-15',1);
  add(current.id,'Fundação e baldrame','Material','Aço CA-50 · kg','material',1600,'kg',7.2,'2026-10-20',.5);
  add(current.id,'Fundação e baldrame','Material','Concreto usinado FCK 25 · m³','material',42,'m³',510,'2026-10-28',.5);
  add(current.id,'Preparação do terreno','Equipamentos e locação','Limpeza e terraplanagem','equipment',1,'verba',19800,'2026-09-14');
  add(current.id,'Projetos e documentação','Projetos e licenças','Projeto arquitetônico e complementares','fees',1,'verba',22000,'2026-06-15');
  add(current.id,'Elétrica','Elétrica','Instalação elétrica · unidade','labor',7,'unidade',5800,'2026-11-05',0);
  add(current.id,'Áreas comuns e fachada','Letreiro','Letreiro da fachada','extra',1,'verba',4200,'2026-11-02',.5);
  add(current.id,'Áreas comuns e fachada','Iluminação','Iluminação externa do condomínio','material',14,'peça',185,'2026-11-03',0);
  add(current.id,'Fundação e baldrame','Custo extra','Janela do vizinho','extra',1,'verba',2800,'2026-11-06',1,{notes:'Reparo extraordinário ilustrativo, detalhado no fechamento.'});
  add(current.id,'Esquadrias','Material','Janela alumínio · 120 × 100 cm','material',1,'peça',980,'2026-11-07',0,{mode:'direct',unitId:current.units[0].id});
  run('material.use',{projectId:current.id,id:cement.id,stageId:current.stages.find(x=>x.name==='Fundação e baldrame').id,qty:180000,date:'2026-11-06',notes:'Consumo fictício no baldrame; não soma novamente ao custo.'});
  for(const [year,name,costFactor] of [['2024','Residencial Atlântico · exemplo',.82],['2025','Residencial Jardim · exemplo',.92]]){
    const p=create(name,4,year,280000,350000);
    add(p.id,'Fundação e baldrame','Material','Cimento CP II · saco 50 kg','material',180,'saco',Math.round(38.9*costFactor*100)/100,year+'-03-01');
    add(p.id,'Fundação e baldrame','Material','Aço CA-50 · kg','material',1100,'kg',Math.round(7.2*costFactor*100)/100,year+'-03-02');
    add(p.id,'Fundação e baldrame','Material','Concreto usinado FCK 25 · m³','material',30,'m³',Math.round(510*costFactor),year+'-03-03');
    add(p.id,'Empreitada geral','Empreitada','Empreitada por m²','labor',248,'m²',Math.round(790*costFactor),year+'-03-04');
    add(p.id,'Elétrica','Elétrica','Instalação elétrica · unidade','labor',4,'unidade',Math.round(5800*costFactor),year+'-04-01');
    add(p.id,'Acabamentos','Material','Demais materiais e acabamentos · lote demonstrativo','material',1,'lote',230000*costFactor,year+'-07-01');
    run('project.close',{projectId:p.id,date:year+'-12-10',reason:'Fechamento demonstrativo. Vendas são hipóteses, não recebimentos reais.'});
  }
  const sources=[
    {title:'Sobrado individual · Tupi · 92 m²',source:'Cássia Baraçal Imóveis',url:'https://cassiabaracalimoveis.com.br/imovel/sobrado-a-venda-2-quartos-tupi-praia-grande-sp-92m2-id-356',area:9200,price:50000000,zone:'Zona 2',type:'individual',condition:'used',notes:'Anúncio informa Zona 2, 2 dormitórios e 2 vagas. Preço pedido; conferir disponibilidade.'},
    {title:'Sobrado individual reformado · Tupi · 145 m²',source:'DreamCasa · referência SO0517',url:'https://www.dreamcasa.com.br/imovel/sobrado-2-quartos-tupi-praia-grande-venda-so5743670',area:14500,price:67000000,zone:'Zona 2',type:'individual',condition:'used',notes:'Anúncio informa Zona II e sobrado individual reformado. Não é comparável direto a unidade pequena de condomínio.'},
    {title:'Sobrado de condomínio · Tupi · 60 m²',source:'Central Imóveis · 16784',url:'https://centralimoveispraiagrande.com.br/16784-sobrado-de-condominio-em-praia-grande-bairro-tupi.html',area:6000,price:34000000,zone:'Não informada',type:'condominium',condition:'unknown',notes:'Zona e condição novo/usado não confirmadas. Não entram automaticamente no recorte de imóveis novos na Zona 2.'}
  ];
  for(const c of sources)run('comparable.save',{...c,date:'2026-11-17',neighborhood:'Vila Tupi',bedrooms:2});
  return validate(s);
}
