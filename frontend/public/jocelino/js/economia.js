// Jocelino — economia.js — os números da evolução da pensão num lugar só (PROVISÓRIOS: o plano do balanço ajusta
// tudo aqui, simulando 2 anos de jogo). Os sistemas leem daqui; nada de número solto espalhado pelo código.

const ECO = {
  // Recompensa de cada tipo de meta da Caderneta da Rosa.
  metas: {
    curtidas: { dinheiro: 40, pitadas: 2 }, nivel_prato: { dinheiro: 30, pitadas: 1 }, pesquisar: { dinheiro: 25, pitadas: 0 },
    servir_clientes: { dinheiro: 20 }, servir_bebida_medida: { dinheiro: 15, pitadas: 1 }, nota_noite: { dinheiro: 25, pitadas: 1 },
    caprichar: { pitadas: 1 }, contratar: { dinheiro: 20 }, melhoria: { pitadas: 2 },
  },
  metasAtivas: 3,
  // Panela da noite: quantas porções rende uma panela de cada prato (o "postar no cardápio" do Bancho).
  porcoes: { pf_peao: 4, peixe_frito: 4, sopa_pedra: 6, cocada_tijolinho: 6, rabanada: 4, marmita_peao: 4, pamonha: 4, goiabada: 6, bolo_milho: 6, caldo_caranguejo: 4, moqueca: 4 },
  porcoesPadrao: 4,
  marmitasMax: 3,         // a sobra vira marmita (a família come o resto)
  cafeBoasVindas: 1.3,    // cafezinho na medida antes do prato: +30% no preço
  // Caprichar (o Enhance do Bancho): +30% do preço base por nível; porções +50% no nível 10.
  precoPorNivel: 0.15, porcoesNivel10: 0.5,
  // A Rosa como chef: experiência por prato que sai, que sobe 1,35× por nível; preparo 4% mais rápido por nível.
  chef: { xpBase: 40, xpCresce: 1.35, preparoPorNivel: 0.04 },
  taxaContratacao: 0.5,   // taxa de contratação = soma dos atributos × isto
  // ---- A pensão (etapa 7): os 6 degraus (0 a 5 estrelas), o que pedem, o que liberam e a despesa da noite; as fórmulas.
  pensao: {
    degraus: [
      { nome: 'Marmita de Esquina', curtidas: 0, sabor: 0, pesquisadas: 0, vagas: 2, mesas: 2, clientes: 2, despesa: 0 },
      { nome: 'Boteco Conhecido', curtidas: 35, sabor: 0, pesquisadas: 0, vagas: 3, mesas: 3, clientes: 3, despesa: 5 },
      { nome: 'Pensão Falada', curtidas: 130, sabor: 0, pesquisadas: 2, vagas: 4, mesas: 4, clientes: 3, despesa: 12 },
      { nome: 'Pensão Famosa', curtidas: 450, sabor: 36, pesquisadas: 3, vagas: 5, mesas: 5, clientes: 3, despesa: 25 },
      { nome: 'Casa Tradicional', curtidas: 950, sabor: 60, pesquisadas: 5, garfos: 4, visitas: 2, vagas: 6, mesas: 6, clientes: 16, despesa: 45 },
      { nome: 'Patrimônio da Vila', curtidas: 1700, sabor: 96, pesquisadas: 7, garfos: 5, visitas: 2, concurso: 1, vagas: 7, mesas: 6, clientes: 22, despesa: 70 },
    ],
    saborPorNivel: 12,      // o sabor de um prato = nível × isto
    gorjeta: 0.3,           // gorjeta = preço × isto × (estrelas − 1) / 4
    estrelasPorPitada: 4,   // pitadas da noite = max(1, floor(estrelas / isto))
    caprichoCresce: 2.3,
    premio5: { dinheiro: 2000, festaClientes: 6 },  // a 5ª estrela: o prêmio da Prefeitura e os clientes a mais na noite de festa
    rosaPaga: true,                                 // a Rosa sozinha paga a despesa e os salários     // caprichar gasta (qtd + 1) × isto^(nível − 1) de cada ingrediente
  },
  // ---- A obra do Bira: a diária de cada função, o extra, a gorjeta do imprevisto, as gratificações e o que cada função pede.
  obra: {
    diarias: [200, 290, 390, 530], extra: 8, gorjeta: 10, imprevisto: 0.18, mestreRedondo: 20,
    premiosCasa: [{ dinheiro: 15, itens: { madeira: 15 } }, { dinheiro: 20, itens: { pedra: 20 } }, { dinheiro: 20, itens: { cafe: 3 } },
      { dinheiro: 25, itens: { cimento: 2 } }, { dinheiro: 30, itens: { pao: 3 } }, { dinheiro: 60, itens: { tijolo: 20 } }],
    premiosMercado: [{ dinheiro: 15, itens: { madeira: 15 } }, { dinheiro: 25, itens: { cimento: 2 } }, { dinheiro: 30, itens: { pao: 3 } }, { dinheiro: 120, itens: { tijolo: 30 } }],
    premiosPredio: { etapa: { dinheiro: 150, itens: { cimento: 3 } }, fim: { dinheiro: 1000, itens: { barra_aco: 3, madeira_lei: 5 } } },
    premiosReformas: [{ dinheiro: 40, itens: { cimento: 2 } }, { dinheiro: 80, itens: { tijolo: 20 } }],
    requisitos: [null, { obras: 1, alvenaria: 2, empreitas: 0 }, { obras: 2, alvenaria: 4, empreitas: 3 }, { obras: 4, alvenaria: 6, empreitas: 10 }],
  },
  // ---- Os preços de conteúdo (pratos, culturas, peixes) ficam nas tabelas deles; aqui, o fator de cada categoria.
  pratos: { fator: 0.5, raridade: [1, 1, 1.3, 1.8, 3] },
  horta: { fatorSemente: 0.5, fatorVenda: 0.4 },
  pesca: { fator: 0.35 },
  // ---- A caixa de venda (o que não é colheita nem peixe) e as lojas (o depósito, a mercearia, a banca, o Viajante; o mascate
  // cobra pelo preço do depósito).
  caixa: { pedra: 1, ferro_velho: 3, barra_ferro: 15, sucata_aco: 5, barra_aco: 30, bronze_velho: 8, barra_bronze: 40, coco: 5, caju: 6, goiaba: 6, pitanga: 5, jabuticaba: 8, araca: 7, cogumelo: 10, cambuci: 9, concha: 4, flor: 5, pedra_bonita: 12, pamonha: 20, peixe_frito: 30, bolo: 40, rabanada: 25, moqueca: 80, cocada: 15, goiabada: 30, caldo_caranguejo: 50, marmita: 10 },
  lojas: { deposito: { cimento: 12, tijolo: 1, vergalhao: 3, cal: 4, tinta: 15, pigmento: 5, ladrilho: 2, telha: 2, pao: 4, cafe: 2, lapis: 3, impermeabilizante: 35 }, compra: { madeira: 2, fibra: 1, cristal: 15, pigmento: 2, bloco_concreto: 10, lajota: 15, manilha: 75, madeira_lei: 15 },
    mercearia: { arroz: 1, feijao: 1, farinha: 1, ovo: 2, macarrao: 2, linguica: 6, carne_seca: 8, queijo_coalho: 15, leite: 2, acucar: 1 }, banca: { isca: 5, covo: 50, vara_boa: 250 },
    viajante: { receitas: { arroz_polvo: 300 }, ingredientes: { polvo: 40, camarao: 18, lagosta: 70, pimenta_cheiro: 35, dende: 12 } } },
  // ---- Os serviços: empreitas (o pagamento de cada uma), a Fala da Vila, a carta; o bairro; a Prefeitura e o Tião.
  empreitas: { paga: { consertar_banca: 100, tabua_pier: 80, limpar_trilha: 72, escorar_ponte: 100, remendar_calcada: 120, cerca_zelia: 88, telhas_juca: 80, desentulhar_ananias: 100, calcada_cimento: 240, cerca_madeira: 220, muro_baixo: 340, baldrame: 360, muro_chapiscado: 880, quiosque_praia: 1040, ponte_pedra: 1280, calcada_colorida: 720, baldrame_concreto: 800, cimentado_queimado: 1040, sapata_corrida: 1920, muro_rebocado: 2080, ladrilho: 2800, radier: 4400, capina_ananias: 120 },
    faixas: [1, 1.1, 1.2], carta: 1.15 },
  bairro: { casa: [600, 1000, 800, 1200, 600, 800], comercio: [1200, 1800, 1400, 2000, 800], tipos: { simples: 1, boa: 1.4, sobrado: 2 } },
  prefeitura: { paga: { pref_museu: 2000, pref_quadro: 1600, pref_praca: 1800, pref_bueiro: 2400 }, tiao: { contrato: 100, salario: 20, medico: 60 } },
  // ---- O ferreiro, a mina, as melhorias e ampliações da pensão, a equipe.
  ferreiro: { custos: { "1": { dinheiro: 100, barra_ferro: 5 }, "2": { dinheiro: 250, barra_aco: 5 }, "3": { dinheiro: 500, barra_bronze: 5 } }, fundir: 10, irrigador: 80, molinete: 600,
    tonico: { lampiao: { dinheiro: 50, barra_ferro: 1 }, forja: { dinheiro: 150, barra_ferro: 2, pedra: 20 }, irrigador_bom: { dinheiro: 150, barra_aco: 1, barra_ferro: 1 }, betoneira: { dinheiro: 300, barra_aco: 3 } } },
  mina: { baus: { "10": { dinheiro: 200, itens: { barra_ferro: 3 } }, "20": { itens: { barra_aco: 3, cristal: 2 } }, "30": { itens: { barra_bronze: 3, carranca: 1 } } },
    marcos: [[3, { dinheiro: 150 }], [6, { itens: { barra_bronze: 2, lajota: 4 } }], [9, { itens: { impermeabilizante: 5 } }], [12, { dinheiro: 500 }], [14, { itens: { cristal: 5 }, titulo: "Guardião da memória da Vila" }]] },
  melhorias: { toalha: 60, flamula: 40, radio: [90, 220, 450], farinheira_grande: [150, 280], ventilador: [180, 260, 520], banqueta_extra: 120, bandeirinhas: 80, fogao_4bocas: [300, 700], geladeira: 400, trofeu: 0, neon: 250 },
  ampliacoes: { salao_maior: 400, varanda: 600, sobrado: 1500 },
  equipe: { anuncios: { cartaz: 50, radio: 150, jornal: 400 }, salarioBase: 4 },
  // ---- O Bazar do Seu Salim (os gastos em degraus, como as ferramentas e a casa do Stardew): cada item uma vez.
  bazar: {
    itens: [
      { id: 'garrafa_termica', nome: 'Garrafa térmica', preco: 90, efeito: 'Um cafezinho na mochila toda manhã.' },
      { id: 'bicicleta', nome: 'Bicicleta', preco: 450, efeito: 'Anda 20% mais rápido.' },
      { id: 'fogao_gas', nome: 'Fogão a gás', preco: 650, efeito: 'A marmita da Rosa dá o dobro de energia.' },
      { id: 'maquina_costura', nome: 'Máquina de costura', preco: 900, efeito: 'A Rosa costura para fora: Cr$ 15 por noite (menos domingo).' },
      { id: 'televisao', nome: 'Televisão', preco: 1600, efeito: 'A novela com a família: amizade todo dia.' },
      { id: 'fusca', nome: 'Fusca', preco: 6000, efeito: 'Viagem rápida pelo mapa, a partir do quintal.' },
    ],
    costura: 15, bicicleta: 1.2, fogao: 2, cozinha: 1.5,
  },
  // ---- A casa da família (as reformas da Robin): 6 etapas, cada uma uma obra do Jocelino, sem pagamento e com custo.
  casa: {
    etapas: [
      { nome: 'Fundação', etapas: ['pa', 'pa', 'colher', 'regador'], material: { cimento: 10, pedra: 30, vergalhao: 8 }, dinheiro: 800, dias: 4 },
      { nome: 'Paredes', etapas: ['pa', 'colher', 'colher', 'colher', 'regador'], material: { tijolo: 150, cimento: 10 }, dinheiro: 1500, dias: 5 },
      { nome: 'Telhado', etapas: ['machado', 'machado', 'colher'], material: { madeira: 40, telha: 80 }, dinheiro: 1800, dias: 3 },
      { nome: 'A cozinha', etapas: ['colher', 'colher', 'regador', 'colher'], material: { cimento: 6, ladrilho: 40, tinta: 2 }, dinheiro: 2000, dias: 4 },
      { nome: 'O quarto do casal', etapas: ['colher', 'colher', 'machado', 'colher'], material: { cimento: 6, cal: 4, tinta: 3, madeira: 15 }, dinheiro: 2200, dias: 4 },
      { nome: 'O quarto das crianças e a mudança', etapas: ['colher', 'machado', 'colher', 'regador', 'colher'], material: { cimento: 6, cal: 4, tinta: 4, madeira: 20 }, dinheiro: 2500, dias: 5 },
    ],
    quarto: 1.1,  // o quarto do casal: acorda com a energia 10% acima do máximo
  },
  // ---- Os aluguéis do quintal (depois da mudança): obras do Jocelino com custo; pagam no domingo à noite; o Patrão dá +50%.
  alugueis: {
    quartinho: { nome: 'Quartinho de aluguel', etapas: ['pa', 'colher', 'colher', 'machado', 'regador'], material: { tijolo: 60, cimento: 6, telha: 20, madeira: 10 }, dinheiro: 1200, semana: 60, arte: 'objetos/quartinho', w: 4, h: 3 },
    casa: { nome: 'Casa de aluguel', etapas: ['pa', 'pa', 'colher', 'colher', 'machado', 'colher', 'regador'], material: { tijolo: 120, cimento: 12, telha: 40, madeira: 20, tinta: 2 }, dinheiro: 3000, semana: 150, arte: 'objetos/casa_aluguel', w: 6, h: 3 },
    patrao: 1.5,
  },
};
// Põe o número do ECO no campo de cada linha de uma tabela do jogo: o arquivo dono fica com o conteúdo (nome, arte, etapas) e
// o dinheiro mora aqui. Falta de valor é erro na hora de carregar, para nenhum número sumir calado.
function ecoCampo(tabela, campo, valores) {
  for (const id in tabela) { if (!(id in valores)) throw new Error(`ECO: falta ${campo} de ${id}`); tabela[id][campo] = valores[id]; }
  return tabela;
}
// As tabelas carregadas antes deste arquivo (dados.js e pratos.js).
LOJA.PRECOS = Object.assign({}, ECO.lojas.deposito); LOJA.COMPRA = Object.assign({}, ECO.lojas.compra);
Pratos.MERCEARIA = Object.assign({}, ECO.lojas.mercearia); Pratos.RARIDADE_PRECO = ECO.pratos.raridade;
