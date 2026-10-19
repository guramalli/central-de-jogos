// Protótipo Obra Viva — Fase 1 (fatia vertical de 10 andares). Só vale com FLAGS.viva.
// Números de teste, não finais: ajustar com o robô (tools/viva-ritmo.mjs) e com gente jogando.
export const VIVA = {
  startMoney: 0,         // a primeira compra vem do primeiro andar entregue
  floorPaySecs: 50,      // pagamento por andar entregue = aluguel-base do andar × isto (≈ R$ 25 nos primeiros)
  autoSellPct: 0,        // destino automático dos andares prontos (0 = aluga tudo); ninguém espera decisão manual
  hidden: ['corretor', 'banco'], // fora do Obra Viva (decisão do usuário: jogo simples, sem banco nem corretor)
  trip: { h0: 40, pow: 0.6 }, // viagem do elevador: até ~40 m igual; acima, a altura pesa menos (economy.js rates)
  winAlt: 400000,        // Órbita: fim do jogo (tela de parabéns)
  rentModulePow: 1,       // aluguel do módulo cresce com o tamanho dele (12 m = 3×, 100 m = 25× um andar)
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
    pedreiro: { n: 'Pedreiro extra', d: 'Mais um pedreiro entra na obra e assenta junto.', k: 1.45 },
    fornec: { k: 1.4 },
    cacamba: { n: 'Carrinho de mão', d: 'Serventes passam a usar carrinho: +22% de carga por viagem.', base: 25, req: null, mul: 1.22, k: 3 },
    ferram: { n: 'Ferramenta elétrica', d: 'Furadeiras no lugar do martelo: ×1,5 no assentamento.', base: 80, req: null },
    corretor: { d: 'O destino dos andares já é automático. +8% no preço de venda por nível.' },
    // ritmo moderado (tools/prestigio.mjs): multiplicadores menores que os do modo clássico
    motor: { mul: 1.22, k: 3, d: '×1,22 velocidade dos elevadores.' },
    olaria: { mul: 1.9, d: '×1,9 produção por nível.' },
    premold: { mul: 2.5, d: '×2,5 produção por nível.' },
    maglev: { mul: 2.8, d: '×2,8 velocidade dos elevadores.' },
    mestre: { mul: 1.75, d: '×1,75 assentamento por nível.' },
    // guindaste de torre é transporte vertical (decisão do usuário): fica na Logística e soma no material subindo
    guindaste: { b: 'log', req: ['elevador', 2], add: 0.3, k: 3.5, d: 'Iça paletes do térreo até o topo junto com os elevadores: +30% de material subindo por nível.' },
  },

  // Ritmo do Obra Viva: material por andar (sobrescreve BAL.floorCost; ajustado com tools/prestigio.mjs)
  // cada era nova deixa a peça ~2,6× mais cara (2,3× com a Pré-fabricação total); módulo grande pede um pouco mais de material
  // robô (tools/ritmo-longo.mjs): 1 km ~0h37 · 12 km ~1h46 · 100 km ~4h14 · Órbita ~8h30; peça nunca abaixo de ~1,5 s no alto
  floorCost: { pow: 0.85, eraMult: 2.6, modulePow: 0.1 },
  floorCostPrefab: { pow: 0.85, eraMult: 2.3 },
};
