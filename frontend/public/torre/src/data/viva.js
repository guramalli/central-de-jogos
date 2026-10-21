// Protótipo Obra Viva — Fase 1 (fatia vertical de 10 andares). Só vale com FLAGS.viva.
// Números de teste, não finais: ajustar com o robô (tools/viva-ritmo.mjs) e com gente jogando.
export const VIVA = {
  startMoney: 100,       // cheque dos investidores na abertura (história): ~3 compras logo de cara, 1º andar em ~20 s
  tourism: { capHeli: 0.6 },
  // depois da Órbita (vistoria de 20/10: nada a buscar): marcos reais alcançáveis; na 1ª vez na campanha, capa de jornal
  // e ×(1 + bonus) permanente em tudo. A parede de material acima de 400 km dobra a cada 400 km (floorCost.wallDouble)
  marcosOrbita: [{ m: 540000, n: 'Telescópio Hubble' }, { m: 1000000, n: 'Mil quilômetros' }, { m: 1500000, n: 'Órbita média dos satélites' }, { m: 2000000, n: 'Fim da órbita baixa' }],
  marcosBonus: 0.1,
  softTourism: { at: 10, k: 4 }, // Elevador panorâmico, Heliponto e Porto: ×4 por nível depois do 10º (eram 65% do gasto e 1,7% da renda) // lugares por nível do heliponto (o panorâmico usa BAL.tourism.capPanoramic)
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
    // sem teto (decisão do usuário, out/2026: com ×12 de preço e máx. 6 a Logística travava no fim): o mais forte da
    // Logística por compra, com o preço subindo ×8 a cada nível (era ×6; subiu quando a Fábrica de módulos ganhou carga
    // por viagem e virou escolha de verdade). Robô: Órbita na 13ª obra, sem as obras empacadas
    maglev: { mul: 1.5, k: 8, max: undefined, d: '×1,5 velocidade dos elevadores (e do material subindo) por nível, sem limite.' },
    mestre: { mul: 1.75, d: '×1,75 assentamento por nível.' },
    // guindaste de torre é transporte vertical (decisão do usuário): fica na Logística e soma no material subindo
    guindaste: { b: 'log', req: ['elevador', 2], add: 0.6, k: 2.5, d: 'Iça paletes do térreo até o topo junto com os elevadores: +60% de material subindo por nível.' },
  },

  // Ritmo do Obra Viva: material por andar (sobrescreve BAL.floorCost; ajustado com tools/prestigio.mjs)
  // cada era nova deixa a peça ~2,6× mais cara (2,3× com a Pré-fabricação total); módulo grande pede um pouco mais de material
  // robô (tools/ritmo-longo.mjs): 1 km ~0h25 · 12 km ~0h57 · 100 km ~3h45 · Órbita ~13h30; peça nunca abaixo de ~1,2 s no alto
  floorCost: { mult: 5, pow: 0.95, eraMult: 2.4, modulePow: 1, wallDouble: 400000 }, // mult entra aos poucos nos primeiros 40 andares; eraMult/modulePow altos: com o prestígio, uma obra sozinha não vai longe
  floorCostPrefab: { pow: 0.92, eraMult: 2.35 }, // abaixo do normal (0,95 e 2,4): ~20–30% menos material; antes (4,5) encarecia o andar
  // ano da torre: 20 min de relógio (só corre com o jogo aberto), mostrados como 365 dias (~3,3 s por dia)
  round: { secs: 1200, dias: 365 },
  prestige: { k: 12, pow: 0.6, rep: 0.025 }, // pontos = 12 × km^0,6 (mín. 1); rep: Reputação = +2,5% em tudo por ponto ganho no total (já foi 3% e 4%; caiu com o caixa que sobra virando Reputação e a lista de compras sem travar nos empates; robô atento: Órbita na 12ª obra)

};
