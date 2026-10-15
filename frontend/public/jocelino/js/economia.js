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
  cafeBoasVindas: 1.3,    // cafezinho na medida antes do prato: +30% no preço
  // Caprichar (o Enhance do Bancho): +60% do preço base por nível (o Dave dá +30%); porções +50% no nível 10.
  precoPorNivel: 0.6, porcoesNivel10: 0.5,
  // A Rosa como chef: experiência por prato que sai, que sobe 1,35× por nível; preparo 4% mais rápido por nível.
  chef: { xpBase: 40, xpCresce: 1.35, preparoPorNivel: 0.04 },
  taxaContratacao: 0.5,   // taxa de contratação = soma dos atributos × isto
  // ---- A pensão (etapa 7): os 6 degraus (0 a 5 estrelas), o que pedem, o que liberam e a despesa da noite; as fórmulas.
  pensao: {
    degraus: [
      { nome: 'Marmita de Esquina', curtidas: 0, sabor: 0, pesquisadas: 0, mesas: 2, clientes: 6, despesa: 0 },
      { nome: 'Boteco Conhecido', curtidas: 40, sabor: 0, pesquisadas: 0, mesas: 3, clientes: 8, despesa: 5 },
      { nome: 'Pensão Falada', curtidas: 200, sabor: 0, pesquisadas: 2, mesas: 4, clientes: 10, despesa: 12 },
      { nome: 'Pensão Famosa', curtidas: 520, sabor: 36, pesquisadas: 3, mesas: 5, clientes: 12, despesa: 25 },
      { nome: 'Casa Tradicional', curtidas: 1100, sabor: 60, pesquisadas: 5, garfos: 4, visitas: 2, mesas: 6, clientes: 14, despesa: 45 },
      { nome: 'Patrimônio da Vila', curtidas: 1700, sabor: 96, pesquisadas: 7, garfos: 5, visitas: 2, concurso: 1, mesas: 6, clientes: 16, despesa: 70 },
    ],
    saborPorNivel: 12,      // o sabor de um prato = nível × isto
    gorjeta: 0.3,           // gorjeta = preço × isto × (estrelas − 1) / 4
    estrelasPorPitada: 4,   // pitadas da noite = max(1, floor(estrelas / isto))
    caprichoCresce: 1.6,     // caprichar gasta (qtd + 1) × isto^(nível − 1) de cada ingrediente
    capricho: { base: 1, porEstrela: 2 },   // a Rosa só capricha até o nível base + porEstrela × estrelas (decisão do jogador, 10/10)
    premio5: { dinheiro: 2000, festaClientes: 6 },  // a 5ª estrela: o prêmio da Prefeitura e os clientes a mais na noite de festa
    // (onda final) Os convidados: os da festa do tema (pedem o prato da festa; mais `varanda` com a varanda) e os da inauguração.
    convidados: { festa: 3, varanda: 2, inauguracao: 3 },
    // (o cardápio do Bancho, 13/10) As vagas do cardápio por degrau (o Dave: 4 a 7; aqui 2 a 5, uma a mais por degrau).
    vagas: [2, 3, 4, 5, 5, 5],
    // O prato da casa (o Norimaki do Dave): sempre tem, sem ingrediente da despensa; mais barato que o prato mais barato, sem
    // gorjeta e sem curtida, e a nota do cliente fica no máximo em `estrelas`; o Doutor Paladar dá no máximo `paladarMax` garfos
    // (como o cafezinho de antes). Não conta para a fama, as pitadas nem a experiência da Rosa.
    pratoCasa: { nome: 'Arroz com feijão da Rosa', preco: 4, estrelas: 2, paladarMax: 1 },
    // A marmita do Jocelino: a Rosa faz de manhã, gastando da despensa (a sobra da janta vai para o lixo, como no Dave).
    // (Tarefa 4) Ela não se vende (saiu da caixa, ECO.caixa): a fornada custa Cr$ 1 por marmita na mercearia, e comida feita em
    // casa vale menos que os ingredientes (o crivo do Stardew), então o preço seria 0. A marmita é energia (e +3 no humor dos peões).
    marmita: { porDia: 2, gasta: { arroz: 1, feijao: 1 } },
    // (14/10, o salão do Dave) A rotatividade: entre uma chegada e a próxima passa um intervalo sorteado em `chegada` (s de jogo); o
    // banco que acabou de vagar descansa `folgaBanco` s antes de outro sentar nele; `avulsos` é a parte da fila feita de fregueses
    // de fora (os clientes avulsos); o ajudante de salão leva `bebidaAjudante` s para encher a bebida no bebedouro (o funcionário
    // do Dave serve 1 bebida em 3,0 s).
    salao: { chegada: [5, 10], folgaBanco: 3, avulsos: 0.5, bebidaAjudante: 3 },
    // (14/10, Tarefa E1, o jeito de cada freguês de fora; clientes_avulsos.js diz quem é o quê) paciencia: multiplica a paciência
    // (até pedir e até o prato); gorjeta: multiplica a gorjeta das estrelas; o apressado servido em até `rapido` da paciência dele
    // (a espera até o prato) dá a gorjeta × `gorjetaRapido`; o exigente só dá a gorjeta das estrelas com `estrelasGorjeta` ou mais
    // e, quando gosta (essas estrelas), dá `curtidaGostou` curtida a mais. Na média do salão o efeito fica perto de zero (o apressado
    // e o generoso compensados pelo exigente): a s20 mede, o simulador confere.
    jeitos: {
      apressado: { paciencia: 0.75, gorjeta: 1, rapido: 0.4, gorjetaRapido: 1.5 },
      paciente: { paciencia: 1.4, gorjeta: 1 },
      exigente: { paciencia: 1, gorjeta: 1, estrelasGorjeta: 5, curtidaGostou: 1 },
      generoso: { paciencia: 1, gorjeta: 1.5 },
    },
    // (14/10, Tarefa A) Os números da janta (o TurnoJanta lê daqui; os nomes são os das constantes dele). Tempos em segundos:
    // a paciência até pedir e até o prato chegar, o preparo de um prato, o tempo comendo, a leitura do cardápio (e com a louça
    // suja do lado); as capacidades da farinheira (e o "repõe com tanto ou menos"), do passe, da bandeja e das bocas do fogão; a
    // gorjeta da bebida na medida (parte do preço) e o preço de cada bebida.
    // (14/10, Tarefa C, o Dave: o chá verde não tem preço, vale os +30% da refeição; a cerveja e o coquetel entram em "Others")
    // precoBebida: o que cada copo paga à parte (servido na medida, quase ou derramado): só a cerveja; o cafezinho vale o
    // cafeBoasVindas (na medida, antes do prato), o guaraná e o caldo a estrela da bebida e a gorjeta da medida; ALERTA_FARINHA: com um terço da farinheira (parte) ou menos, no mínimo `minimo`, a farinheira pisca e a Rosa chama
    // (uma vez até repor); PENEIRA: os segundos para peneirar a farinheira cheia (o Jocelino; o ajudante com "farinha"; o ajudante
    // que já é Mestre; o Dave mói o wasabi mais rápido que o funcionário, que leva 5,0 s); ESPERA_CERVEJA: a cerveja vem DEPOIS
    // do prato (o Dave); quem acabou de comer e ainda espera a cerveja fica até tantos segundos antes de pagar e ir embora.
    janta: { PACIENCIA_PEDIDO: 45, PACIENCIA_PRATO: 70, PREPARO: 6, COMENDO: 8, LENDO: 1.5, LENDO_LOUCA: 6,
      FARINHA_MAX: 15, REPOR_ATE: 10, PASSE_MAX: 4, BANDEJA_MAX: 3, BOCAS: 2, GORJETA_MEDIDA: 0.15,
      precoBebida: { cafe: 0, guarana: 0, caldo_cana: 0, cerveja: 2 },
      ALERTA_FARINHA: { minimo: 3, parte: 3 }, PENEIRA: { jocelino: 2.5, ajudante: 5, mestre: 2.5 }, ESPERA_CERVEJA: 10,
      // (14/10, Tarefa D1, a cozinha de verdade) preparo: os segundos de fogo de cada receita (o PREPARO acima é o padrão, do salão
      // antigo). Rápidos (4 a 5 s): a salada, a farofa, a couve e os doces da panela; médios (6 s): o PF, o peixe frito e os caldos;
      // demorados (7 s): as moquecas, as caldeiradas, o bobó, o vatapá e o assado. O robô da calibração serve o peixe frito (6 s) e o
      // cardápio mais caro de cada degrau fica entre 6 e 7 s (o relatório da D1 tem a conta). Toda receita tem o dela (a carga confere).
      // MAQUINA: os segundos da máquina de refresco para encher um copo de guaraná ou de caldo de cana (um de cada vez); MAQUINA_BEBIDAS:
      // as que ela serve (a cerveja e o café, não).
      preparo: { casa: 4, pf_peao: 6, peixe_frito: 6, sopa_pedra: 6, cocada_tijolinho: 4,
        rabanada: 5, arroz_doce: 4, salada_rosa: 4, farofa_ovo: 4, couve_mineira: 4, mandioca_frita: 5, sopa_legumes: 5, mingau_milho: 4,
        pure_abobora: 5, virado: 6, cuscuz: 5, bolinho_chuva: 5, canjica: 4, marmita_peao: 6, pamonha: 5, goiabada: 4, bolo_milho: 4,
        sardinha_frita: 6, lambari_crocante: 6, peixe_ensopado: 7, casquinha_siri: 6, caldo_caranguejo: 6, escondidinho: 7, caldo_peixe: 6,
        pirao: 5, moqueca: 7, moqueca_capixaba: 7, lagosta_manteiga: 6, bobo_camarao: 7, peixada: 7, robalo_assado: 7, caldeirada: 7,
        moqueca_prefeito: 7, caldeirada_critico: 7, doce_leite_calixto: 4, picadinho_santos: 6, arroz_polvo: 6, vatapa: 7 },
      MAQUINA: 4, MAQUINA_BEBIDAS: ['guarana', 'caldo_cana'] },
    rosaPaga: true,                                 // a Rosa sozinha paga a despesa e os salários     // caprichar gasta (qtd + 1) × isto^(nível − 1) de cada ingrediente
  },
  // ---- A obra do Bira: a diária de cada função, o extra, a gorjeta do imprevisto, as gratificações e o que cada função pede.
  obra: {
    diarias: [420, 430, 440, 450], extra: 8, gorjeta: 10, imprevisto: 0.18, mestreRedondo: 20,
    premiosCasa: [{ dinheiro: 15, itens: { madeira: 15 } }, { dinheiro: 20, itens: { pedra: 20 } }, { dinheiro: 20, itens: { cafe: 3 } },
      { dinheiro: 25, itens: { cimento: 2 } }, { dinheiro: 30, itens: { pao: 3 } }, { dinheiro: 60, itens: { tijolo: 20 } }],
    premiosMercado: [{ dinheiro: 15, itens: { madeira: 15 } }, { dinheiro: 25, itens: { cimento: 2 } }, { dinheiro: 30, itens: { pao: 3 } }, { dinheiro: 120, itens: { tijolo: 30 } }],
    premiosPredio: { etapa: { dinheiro: 150, itens: { cimento: 3 } }, fim: { dinheiro: 1000, itens: { barra_aco: 3, madeira_lei: 5 } } },
    premiosReformas: [{ dinheiro: 40, itens: { cimento: 2 } }, { dinheiro: 80, itens: { tijolo: 20 } }],
    requisitos: [null, { obras: 1, alvenaria: 2, empreitas: 0 }, { obras: 2, alvenaria: 4, empreitas: 3 }, { obras: 4, alvenaria: 6, empreitas: 10 }],
  },
  // ---- Os preços de conteúdo (pratos, culturas, peixes) ficam nas tabelas deles; aqui, o fator de cada categoria.
  pratos: { fator: 0.7, raridade: [1, 1, 1.3, 1.8, 3] },
  horta: { fatorSemente: 0.5, fatorVenda: 0.4 },
  pesca: { fator: 0.35 },
  // ---- A caixa de venda (o que não é colheita nem peixe) e as lojas (o depósito, a mercearia, a banca, o Viajante; o mascate
  // cobra pelo preço do depósito).
  caixa: { pedra: 1, ferro_velho: 3, barra_ferro: 15, sucata_aco: 5, barra_aco: 30, bronze_velho: 8, barra_bronze: 40, coco: 5, caju: 6, goiaba: 6, pitanga: 5, jabuticaba: 8, araca: 7, cogumelo: 10, cambuci: 9, concha: 4, flor: 5, pedra_bonita: 12, pamonha: 20, peixe_frito: 30, bolo: 40, rabanada: 25, moqueca: 80, cocada: 15, goiabada: 30, caldo_caranguejo: 50 },
  lojas: { deposito: { cimento: 12, tijolo: 1, vergalhao: 3, cal: 4, tinta: 15, pigmento: 5, ladrilho: 2, telha: 2, pao: 4, cafe: 2, lapis: 3, impermeabilizante: 35 }, compra: { madeira: 2, fibra: 1, cristal: 15, pigmento: 2, bloco_concreto: 10, lajota: 15, manilha: 75, madeira_lei: 15 },
    mercearia: { arroz: 1, feijao: 1, farinha: 1, ovo: 2, macarrao: 2, linguica: 6, carne_seca: 8, queijo_coalho: 15, leite: 2, acucar: 1 }, banca: { isca: 2, covo: 25, vara_boa: 250 },
    viajante: { receitas: { arroz_polvo: 300 }, ingredientes: { polvo: 40, camarao: 18, lagosta: 70, pimenta_cheiro: 35, dende: 12 } } },
  // ---- Os serviços: empreitas (o pagamento de cada uma), a Fala da Vila, a carta; o bairro; a Prefeitura e o Tião.
  empreitas: { paga: { consertar_banca: 150, tabua_pier: 120, limpar_trilha: 108, escorar_ponte: 150, remendar_calcada: 180, cerca_zelia: 132, telhas_juca: 120, desentulhar_ananias: 150, calcada_cimento: 150, cerca_madeira: 138, muro_baixo: 212, baldrame: 225, muro_chapiscado: 550, quiosque_praia: 650, ponte_pedra: 800, calcada_colorida: 450, baldrame_concreto: 500, cimentado_queimado: 650, sapata_corrida: 1200, muro_rebocado: 1300, ladrilho: 1750, radier: 2750, capina_ananias: 180 },
    faixas: [1, 1.1, 1.2], carta: 1.15 },
  bairro: { casa: [225, 375, 300, 450, 225, 300], comercio: [450, 675, 525, 750, 300], tipos: { simples: 1, boa: 1.4, sobrado: 2 } },
  prefeitura: { paga: { pref_museu: 1250, pref_quadro: 1000, pref_praca: 1125, pref_bueiro: 1500 }, tiao: { contrato: 100, salario: 20, medico: 60 } },
  // ---- O ferreiro, a mina, as melhorias e ampliações da pensão, a equipe.
  ferreiro: { custos: { "1": { dinheiro: 1000, barra_ferro: 5 }, "2": { dinheiro: 2500, barra_aco: 5 }, "3": { dinheiro: 5000, barra_bronze: 5 } }, fundir: 40, irrigador: 320, molinete: 2400,
    tonico: { lampiao: { dinheiro: 200, barra_ferro: 1 }, forja: { dinheiro: 600, barra_ferro: 2, pedra: 20 }, irrigador_bom: { dinheiro: 600, barra_aco: 1, barra_ferro: 1 }, betoneira: { dinheiro: 1200, barra_aco: 3 } } },
  mina: { baus: { "10": { dinheiro: 200, itens: { barra_ferro: 3 } }, "20": { itens: { barra_aco: 3, cristal: 2 } }, "30": { itens: { barra_bronze: 3, carranca: 1 } } },
    marcos: [[3, { dinheiro: 150 }], [6, { itens: { barra_bronze: 2, lajota: 4 } }], [9, { itens: { impermeabilizante: 5 } }], [12, { dinheiro: 500 }], [14, { itens: { cristal: 5 }, titulo: "Guardião da memória da Vila" }]] },
  melhorias: { toalha: 600, flamula: 400, bancada_passe: [2500, 4200], maquina_refresco: 3500, radio: [900, 2200, 4500], farinheira_grande: [1500, 2800], ventilador: [1800, 2600, 5200], banqueta_extra: 1200, bandeirinhas: 800, fogao_4bocas: [3000, 7000], geladeira: 4000, trofeu: 0, neon: 2500 },
  ampliacoes: { salao_maior: 4000, varanda: 6000, sobrado: 15000 },
  // (14/10, Tarefa B: a equipe do Dave) O nível vai até nivelMax. O treino custa base × cresce^(nível − 1), com teto (o Dave: ~1,43×
  // por nível, 99 mil no 20; aqui o teto deixa o nível alto como um gasto do fim do jogo, umas 4 noites boas por treino). O salário é
  // salarioBase + salarioPorNivel × (nível − 1), com teto. Quem está na reserva, parado, recebe `reserva` do salário (o Dave paga
  // inteiro; aqui a metade, para a reserva ter custo sem ser só prejuízo); na expedição recebe o dia inteiro. reservaMax: quantos
  // cabem na reserva. mestre: o nível do Mestre de cada posto (e do "Leva prato", raro); levaPrato: a chance de o Mestre de quem tem
  // vocação de salão ser o "Leva prato"; receitas: os níveis em que o ajudante de cozinha ensina receita; louca: a velocidade do
  // Mestre da louça (× a de andar) e o intervalo (s) entre uma olhada e outra no salão; fogao e pressa: o preparo a menos do Mestre do
  // fogão e da "pressa" (multiplicam depois do piso de 0,5 do atributo Cozinha). expedicao (o dispatch do Dave): a quantidade = base +
  // compras ÷ porCompras (× 2 com "feira", + mestre com o Mestre), mais um bônus de bonus[0] a bonus[1] com chance simpatia ÷
  // simpatiaChance (no máximo bonusMax); o ingrediente vem dividido pela raridade AO QUADRADO (com "raro", a raridade − 1): o que
  // não dá 1 inteiro vira a chance de vir 1. (A lista só tem o básico, raridade 1 e 2: Equipe.ORIGENS.)
  equipe: { anuncios: { cartaz: 50, radio: 150, jornal: 400 }, salarioBase: 4,
    nivelMax: 20, salarioPorNivel: 2, salarioTeto: 40, treino: { base: 60, cresce: 1.5, teto: 5000 }, reserva: 0.5, reservaMax: 3,
    mestre: { salao: 12, cozinha: 15, compras: 12, leva_prato: 15 }, levaPrato: 0.2, receitas: [5, 10, 15, 20],
    louca: { velocidade: 1.6, olhar: 0.2 }, fogao: 0.1, pressa: 0.1,
    expedicao: { base: 1, porCompras: 25, mestre: 2, bonus: [1, 3], simpatiaChance: 150, bonusMax: 0.6 } },
  // ---- O Bazar do Seu Salim (os gastos em degraus, como as ferramentas e a casa do Stardew): cada item uma vez.
  bazar: {
    itens: [
      { id: 'garrafa_termica', nome: 'Garrafa térmica', preco: 900, efeito: 'Um cafezinho na mochila toda manhã.' },
      { id: 'bicicleta', nome: 'Bicicleta', preco: 4500, efeito: 'Anda 20% mais rápido.' },
      { id: 'fogao_gas', nome: 'Fogão a gás', preco: 6500, efeito: 'A marmita da Rosa dá o dobro de energia.' },
      { id: 'maquina_costura', nome: 'Máquina de costura', preco: 9000, efeito: 'A Rosa costura para fora: Cr$ 60 por noite (menos domingo).' },
      // (14/10) A mochila de couro: 48 → 60 espaços. O Jocelino já começa com 48 (mais que a maior do Stardew, 36), então esta é
      // a "luxo" do Pierre (24 → 36 por 10.000g, 5× a primeira). A Cr$ 2.500, entre a garrafa e a bicicleta, ela atrasava a
      // máquina de costura no simulador e o devagar não chegava às 5 estrelas (s19). O ícone é a arte dela (`icone`: itens/mochila_couro).
      { id: 'mochila_couro', nome: 'Mochila de couro', preco: 10000, icone: 'mochila_couro', efeito: 'Mochila com 60 espaços: mais uma fileira de 12.' },
      { id: 'televisao', nome: 'Televisão', preco: 16000, efeito: 'A novela com a família: amizade todo dia.' },
      { id: 'fusca', nome: 'Fusca', preco: 60000, efeito: 'Viagem rápida pelo mapa, a partir do quintal.' },
    ],
    costura: 60, bicicleta: 1.2, fogao: 2, cozinha: 1.5, mochila: 60,
  },
  // A lojinha da Rosa (roteiro de 13/10): a Dona Cotinha vende a pensão fechada; a entrada abre a reforma, o resto sai aos domingos.
  lojinha: { entrada: 2000, parcela: 500, parcelas: 6 },
  // A reforma da lojinha em etapas (roteiro de 13/10, "mais longa"): o material (entregue à Rosa) e os dias de trabalho no salão.
  reforma: [
    { id: 'limpar', nome: 'Limpar o salão', material: {}, dias: 0 },
    { id: 'telhado', nome: 'O telhado', material: { telha: 10 }, dias: 2 },
    { id: 'balcao', nome: 'O balcão e as banquetas', material: { madeira: 20 }, dias: 2 },
    { id: 'cozinha', nome: 'A cozinha da Rosa', material: { tijolo: 6, cimento: 4 }, dias: 1 },
    { id: 'pintura', nome: 'A pintura e o letreiro', material: { tinta: 2 }, dias: 1 },
  ],
  // ---- A casa da família (as reformas da Robin): 6 etapas, cada uma uma obra do Jocelino, sem pagamento e com custo.
  casa: {
    etapas: [
      { nome: 'Fundação', etapas: ['pa', 'pa', 'colher', 'regador'], material: { cimento: 10, pedra: 30, vergalhao: 8 }, dinheiro: 8000, dias: 4 },
      { nome: 'Paredes', etapas: ['pa', 'colher', 'colher', 'colher', 'regador'], material: { tijolo: 150, cimento: 10 }, dinheiro: 15000, dias: 5 },
      { nome: 'Telhado', etapas: ['machado', 'machado', 'colher'], material: { madeira: 40, telha: 80 }, dinheiro: 18000, dias: 3 },
      { nome: 'A cozinha', etapas: ['colher', 'colher', 'regador', 'colher'], material: { cimento: 6, ladrilho: 40, tinta: 2 }, dinheiro: 20000, dias: 4 },
      { nome: 'O quarto do casal', etapas: ['colher', 'colher', 'machado', 'colher'], material: { cimento: 6, cal: 4, tinta: 3, madeira: 15 }, dinheiro: 22000, dias: 4 },
      { nome: 'O quarto das crianças e a mudança', etapas: ['colher', 'machado', 'colher', 'regador', 'colher'], material: { cimento: 6, cal: 4, tinta: 4, madeira: 20 }, dinheiro: 25000, dias: 5 },
    ],
    quarto: 1.1,  // o quarto do casal: acorda com a energia 10% acima do máximo
  },
  // ---- Os aluguéis do quintal (depois da mudança): obras do Jocelino com custo; pagam no domingo à noite; o Patrão dá +50%.
  alugueis: {
    quartinho: { nome: 'Quartinho de aluguel', etapas: ['pa', 'colher', 'colher', 'machado', 'regador'], material: { tijolo: 60, cimento: 6, telha: 20, madeira: 10 }, dinheiro: 12000, semana: 240, arte: 'objetos/quartinho', w: 4, h: 3 },
    casa: { nome: 'Casa de aluguel', etapas: ['pa', 'pa', 'colher', 'colher', 'machado', 'colher', 'regador'], material: { tijolo: 120, cimento: 12, telha: 40, madeira: 20, tinta: 2 }, dinheiro: 30000, semana: 600, arte: 'objetos/casa_aluguel', w: 6, h: 3 },
    patrao: 1.5,
  },
  // O guia das primeiras semanas (Frente 4, 12/10/2026): o dia mínimo de cada sistema, a espera quando a missão anterior
  // empaca, o máximo de missões abertas e as recompensas (coisas úteis, sem dinheiro).
  // (dia cheio, Frente B, 13/10) Como o Stardew (a vara do Willy no dia 2, a mina no dia 5): a pesca 8 → 2, a pedreira 10 → 5 e a
  // mina 12 → 7, dois dias depois da pedreira (o ferreiro não depende da mina: a reforçada pede o ferro, que a pedreira já dá).
  // ---- A Obra do Povo (o Grêmio, o Centro Comunitário do Stardew): o que cada pacote pede e dá, quando cada ala abre (pacotes
  // prontos no total), o presente de cada ala pronta e os efeitos. O quintal em marcos: o prêmio do Tio Juca a cada quarto limpo
  // ("sementes" = sementes da estação).
  gremio: { abre: { cozinha: 0, varanda: 0, aquario: 2, deposito: 4, oficina: 6, cofre: 9 },
    pacotes: {
      verduras_outono: { nome: 'Verduras do outono', itens: { alface: 5, couve: 5 }, premio: { esterco: 5 } },
      roca: { nome: 'Da roça', itens: { mandioca: 3, milho: 3 }, premio: { rama_mandioca: 5 } },
      tempo_quente: { nome: 'Do tempo quente', itens: { tomate: 3, abobora: 2 }, premio: { semente_tomate: 5 } },
      frutas_mata: { nome: 'Frutas da mata', itens: { pitanga: 2, jabuticaba: 2, araca: 2, cambuci: 2 }, premio: { marmita: 3 } },
      chao_mata: { nome: 'Chão da mata', itens: { cogumelo: 3, flor: 5 }, premio: { cafe: 5 } },
      beira_mar: { nome: 'Beira-mar', itens: { coco: 3, caju: 3, concha: 3 }, premio: { isca: 15 } },
      mar_dia: { nome: 'Mar de dia', itens: { sardinha: 2, tainha: 2, pescada: 2 }, premio: { isca: 15 } },
      rio_mata: { nome: 'Rio da mata', itens: { lambari: 2, piau: 2, traira: 1 }, premio: { marmita: 3 } },
      graudo: { nome: 'Peixe graúdo', itens: { robalo: 1, caranguejo: 1, lagosta: 1 }, premio: { caldo_caranguejo: 2 } },
      fundacao: { nome: 'Fundação', itens: { pedra: 20, cimento: 5 }, premio: { cimento: 5 } },
      paredes: { nome: 'Paredes', itens: { tijolo: 60, telha: 10 }, premio: { telha: 10 } },
      acabamento: { nome: 'Acabamento', itens: { madeira_lei: 5, lajota: 5 }, premio: { cal: 3 } },
      ferro: { nome: 'Ferro', itens: { ferro_velho: 10, barra_ferro: 3 }, premio: { barra_ferro: 2 } },
      pedreira_funda: { nome: 'Pedreira funda', itens: { cristal: 2, sucata_aco: 5 }, premio: { barra_ferro: 3 } },
      pedra_boa: { nome: 'Pedra boa', itens: { pedra: 50, pedra_bonita: 3 }, premio: { caminho_pedra: 20 } },
      parcela_1: { nome: '1ª parcela', dinheiro: 500 }, parcela_2: { nome: '2ª parcela', dinheiro: 1000 },
      parcela_3: { nome: '3ª parcela', dinheiro: 2000 }, parcela_4: { nome: '4ª parcela', dinheiro: 4000 } },
    presentes: { aquario: { covo: 1 }, deposito: { betoneira: 1 } },
    efeitos: { achados: 2, deposito: 0.9, diasTonico: 1, fundir: 0.5, varaBoa: 0.5, clientesSabado: 2 } },
  quintal: { marcos: { 25: { esterco: 5, sementes: 10 }, 50: { irrigador: 1 }, 75: { cerca: 10, portao: 1 }, 100: { irrigador_bom: 1 } },
    // (14/10, "onde guardo quando a mochila enche?") o baú que o Tio Juca faz: madeiras. A cerca custa 2 e o portão 5; o baú vale
    // 3 portões. O Stardew cobra 50, mas lá uma árvore dá uns 12 de madeira e aqui dá 7 (5 e o toco): 15 são umas duas árvores.
    bau: 15,
    // (onda final, o robô #23; o Stardew rebrota a fazenda à noite) a rebrota leve: por noite, no máximo vivos, a chance de pedra (senão galho)
    rebrota: { porNoite: 3, maximo: 12, pedra: 0.5 } },
  // (relato de 14/10; o Stardew: a Floresta da Seiva e o Bosque Secreto repõem todo dia) a mata repõe toda manhã: quantos de cada
  // por manhã (árvores no bosque, galhos no chão dele, pedras na beira do rio), a chance de a pedra ser um pedregulho e o máximo vivo
  mata: { repoe: { arvores: 1, galhos: 3, pedras: 2, pedregulho: 0.25, maximo: { arvores: 5, galhos: 8, pedras: 6 } } },
  guia: { dias: { pensao: 2, horta: 1, quadro: 1, gremio: 6, domingo: 7, pesca: 2, bazar: 4, pedreira: 5, mina: 7 }, espera: 3, maxAbertas: 2,
    recompensas: { horta: { mochila: { esterco: 5, semente_alface: 5 } },
      janta: { despensa: { arroz: 6, feijao: 6, ovo: 6 } }, domingo: { despensa: { farinha: 4, leite: 4 } }, pesca: { mochila: { isca: 10 } } } },
};
// As vagas de cada degrau vêm de ECO.pensao.vagas (a tela A Pensão mostra o que cada degrau libera).
ECO.pensao.degraus.forEach((d, i) => { d.vagas = ECO.pensao.vagas[i]; });
// Põe o número do ECO no campo de cada linha de uma tabela do jogo: o arquivo dono fica com o conteúdo (nome, arte, etapas) e
// o dinheiro mora aqui. Falta de valor é erro na hora de carregar, para nenhum número sumir calado.
function ecoCampo(tabela, campo, valores) {
  for (const id in tabela) { if (!(id in valores)) throw new Error(`ECO: falta ${campo} de ${id}`); tabela[id][campo] = valores[id]; }
  return tabela;
}
// As tabelas carregadas antes deste arquivo (dados.js e pratos.js).
LOJA.PRECOS = Object.assign({}, ECO.lojas.deposito); LOJA.COMPRA = Object.assign({}, ECO.lojas.compra);
Pratos.MERCEARIA = Object.assign({}, ECO.lojas.mercearia); Pratos.RARIDADE_PRECO = ECO.pratos.raridade;
// (Tarefa D1) Toda receita tem o tempo de preparo dela no ECO (receitas.js já juntou as novas): falta de valor é erro na carga.
for (const id in Pratos.PRATOS) if (!(id in ECO.pensao.janta.preparo)) throw new Error('ECO: falta o preparo de ' + id);
