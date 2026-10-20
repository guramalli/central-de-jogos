// Protótipo Obra Viva — Fase 1 (fatia vertical de 10 andares). Só vale com FLAGS.viva.
// Números de teste, não finais: ajustar com o robô (tools/viva-ritmo.mjs) e com gente jogando.
export const VIVA = {
  startMoney: 100,       // cheque dos investidores na abertura (história): ~3 compras logo de cara, 1º andar em ~20 s
  curious: 0.5,          // R$/s dos curiosos no tapume antes do Elevador panorâmico (a torre já é famosa)
  floorPaySecs: 50,      // pagamento por andar entregue = aluguel-base do andar × isto (≈ R$ 25 nos primeiros)
  autoSellPct: 0,        // destino automático dos andares prontos (0 = aluga tudo); ninguém espera decisão manual
  hidden: ['corretor', 'banco'], // fora do Obra Viva (decisão do usuário: jogo simples, sem banco nem corretor)
  trip: { h0: 40, pow: 0.6 }, // viagem do elevador: até ~40 m igual; acima, a altura pesa menos (economy.js rates)
  winAlt: 400000,        // Órbita: fim do jogo (tela de parabéns)
  rentModulePow: 0.3,       // aluguel do módulo cresce com o tamanho dele (12 m = 3×, 100 m = 25× um andar)
  stageGate: false,       // trava das etapas desligada (out/2026): o gargalo aparece na obra, não como proibição
  stageMargin: 0.5,      // etapas andam juntas: nenhuma melhora se já está 50% à frente da mais lenta (economy.js stageBlock)
  revealAt: 10,          // andares até os painéis avançados (Imóveis, Engenharia) aparecerem
  priority: 3,           // compras prioritárias mostradas; o resto fica em "Mais melhorias"

  // Etapas do andar: (A) entrega de material, (B) estrutura, (C) paredes, (D) janelas/acabamento, (E) ocupação ao concluir
  phases: [
    { id: 'entrega', n: 'Entrega de material', end: 0.10 },
    { id: 'estrutura', n: 'Estrutura', end: 0.30 },
    { id: 'paredes', n: 'Paredes', end: 0.72 },
    { id: 'janelas', n: 'Janelas', end: 0.95 },
    { id: 'acabamento', n: 'Acabamento', end: 1 },
  ],

  // As três compras iniciais concretas, liberadas desde o começo
  upgrades: {
    // equilíbrio entre as etapas (levantamento dos primeiros 100 andares: compras e gasto parecidos nos três ramos da obra)
    pedreiro: { n: 'Pedreiro extra', d: 'Mais um pedreiro entra na obra e assenta junto.', base: 20, k: 1.6 },
    fornec: { base: 20, k: 1.6 },
    elevador: { k: 2.0 },
    cacamba: { n: 'Carrinho de mão', d: 'Serventes passam a usar carrinho: +50% de carga por viagem.', base: 25, req: null, mul: 1.5, k: 2.1, max: 10 },
    ferram: { n: 'Ferramenta elétrica', d: 'Furadeiras no lugar do martelo: ×1,5 no assentamento.', base: 80, req: null },
    corretor: { d: 'O destino dos andares já é automático. +8% no preço de venda por nível.' },
    // ritmo moderado (tools/prestigio.mjs): multiplicadores menores que os do modo clássico
    motor: { mul: 1.2, k: 2.1, max: 10, d: '×1,2 velocidade dos elevadores (e do material subindo).' }, // forte, mas com teto: no fim quem puxa são as tecnologias de era
    olaria: { mul: 1.9, d: '×1,9 produção por nível.' },
    premold: { mul: 2.5, d: '×2,5 produção por nível.' },
    maglev: { mul: 1.6, d: '×1,6 velocidade dos elevadores (e do material subindo).' },
    mestre: { mul: 1.75, d: '×1,75 assentamento por nível.' },
    // guindaste de torre é transporte vertical (decisão do usuário): fica na Logística e soma no material subindo
    guindaste: { b: 'log', req: ['elevador', 2], add: 0.6, k: 2.5, d: 'Iça paletes do térreo até o topo junto com os elevadores: +60% de material subindo por nível.' },
  },

  // Ritmo do Obra Viva: material por andar (sobrescreve BAL.floorCost; ajustado com tools/prestigio.mjs)
  // cada era nova deixa a peça ~2,6× mais cara (2,3× com a Pré-fabricação total); módulo grande pede um pouco mais de material
  // robô (tools/ritmo-longo.mjs): 1 km ~0h25 · 12 km ~0h57 · 100 km ~3h45 · Órbita ~13h30; peça nunca abaixo de ~1,2 s no alto
  floorCost: { mult: 5, pow: 0.95, eraMult: 2.4, modulePow: 1 }, // mult entra aos poucos nos primeiros 40 andares; eraMult/modulePow altos: com o prestígio, uma obra sozinha não vai longe
  floorCostPrefab: { pow: 0.85, eraMult: 4.5 },
  // Rodadas "Nova obra" (decisão do usuário, out/2026): cada rodada de 20 min (ou entrega antecipada) rende pontos
  // = floor(k × km^pow) (retorno decrescente); os pontos compram o quadro "Construtora" (bônus permanentes, aditivos)
  manager: { share: 0.5, rate: 2 }, // gerentes: verba comum de metade da renda (nunca mais que metade do caixa); até 2 compras/s por ramo
  round: { secs: 1200 }, // rodada de 20 min de relógio (só corre com o jogo aberto)
  prestige: { k: 12, pow: 0.6, rep: 0.06 }, // ★ = 12 × km^0,6 (mín. 1); rep: Reputação = +6% em tudo por ★ ganha no total (robô: Órbita na 13ª rodada)
  board: {
    capital: { n: 'Capital inicial', d: '+R$ 400 no cheque de cada obra nova por nível.', base: 3, grow: 1.6, max: 10, start: 'money', add: 400 },
    pedreiros: { n: 'Equipe fixa', d: '+1 pedreiro já contratado em cada obra nova.', base: 4, grow: 1.8, max: 5, start: 'pedreiro', add: 1 },
    fornecedores: { n: 'Fornecedores parceiros', d: '+1 fornecedor já contratado em cada obra nova.', base: 4, grow: 1.8, max: 5, start: 'fornec', add: 1 },
    rede: { n: 'Rede de fornecimento', d: '+10% de material chegando por nível.', base: 5, grow: 1.5, max: 10, st: 'prod', add: 0.1 },
    elevadores: { n: 'Engenharia de elevadores', d: '+10% de material subindo por nível.', base: 5, grow: 1.5, max: 10, st: 'tran', add: 0.1 },
    escola: { n: 'Escola de pedreiros', d: '+10% no assentamento por nível.', base: 5, grow: 1.5, max: 10, st: 'lay', add: 0.1 },
    marca: { n: 'Marca J. Santos', d: '+15% de aluguel e de turismo por nível.', base: 6, grow: 1.6, max: 10, st: 'rent', st2: 'tour', add: 0.15 },
    fundacao: { n: 'Fundação de série', d: '+1 nível de Fundação já pronto em cada obra nova.', base: 8, grow: 2, max: 5, start: 'fundacao', add: 1 },
    // gerentes (sim/managers.js): compram sozinhos o básico do ramo; ligam e desligam no próprio cartão
    gerObra: { n: 'Gerente de obra', d: 'Contrata pedreiros e compra treino, ferramentas e mestres sozinho.', base: 2, grow: 1, max: 1, mgr: 'obra' },
    gerForn: { n: 'Gerente de suprimentos', d: 'Compra fornecedores, caminhões, olaria e pré-molde sozinho.', base: 2, grow: 1, max: 1, mgr: 'forn' },
    gerLog: { n: 'Gerente de logística', d: 'Compra elevadores, motores, caçambas e guindaste sozinho.', base: 2, grow: 1, max: 1, mgr: 'log' },
    gerEng: { n: 'Gerente de engenharia', d: 'Reforça a fundação e compra projetos sozinho.', base: 3, grow: 1, max: 1, mgr: 'eng' },
    gerMerc: { n: 'Gerente comercial', d: 'Compra aluguel, turismo e marketing sozinho.', base: 3, grow: 1, max: 1, mgr: 'merc' },
  },
};
