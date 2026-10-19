// Protótipo Obra Viva — Fase 1 (fatia vertical de 10 andares). Só vale com FLAGS.viva.
// Números de teste, não finais: ajustar com o robô (tools/viva-ritmo.mjs) e com gente jogando.
export const VIVA = {
  startMoney: 0,         // a primeira compra vem do primeiro andar entregue
  floorPaySecs: 50,      // pagamento por andar entregue = aluguel-base do andar × isto (≈ R$ 25 nos primeiros)
  autoSellPct: 0,        // destino automático dos andares prontos (0 = aluga tudo); ninguém espera decisão manual
  hidden: ['corretor', 'banco'], // fora do Obra Viva (decisão do usuário: jogo simples, sem banco nem corretor)
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
    pedreiro: { n: 'Pedreiro extra', d: 'Mais um pedreiro entra na obra e assenta junto.' },
    cacamba: { n: 'Carrinho de mão', d: 'Serventes passam a usar carrinho: +22% de carga por viagem.', base: 25, req: null, mul: 1.22 },
    ferram: { n: 'Ferramenta elétrica', d: 'Furadeiras no lugar do martelo: ×1,5 no assentamento.', base: 80, req: null },
    corretor: { d: 'O destino dos andares já é automático. +8% no preço de venda por nível.' },
    // ritmo moderado (tools/prestigio.mjs): multiplicadores menores que os do modo clássico
    motor: { mul: 1.22, d: '×1,22 velocidade dos elevadores.' },
    olaria: { mul: 1.9, d: '×1,9 produção por nível.' },
    premold: { mul: 2.5, d: '×2,5 produção por nível.' },
    maglev: { mul: 2.8, d: '×2,8 velocidade dos elevadores.' },
    mestre: { mul: 1.75, d: '×1,75 assentamento por nível.' },
    guindaste: { add: 0.4, d: 'Ergue vigas e paletes até onde os pedreiros trabalham: +40% de assentamento por nível.' },
  },

  // Ritmo do Obra Viva: material por andar (sobrescreve BAL.floorCost; ajustado com tools/prestigio.mjs)
  // cada era nova deixa a peça ~1,9× mais cara; módulos maiores (data/height.js) pedem mais material (×(m/4)^0,5)
  // robô (tools/prestigio.mjs, 30 h): 12 km ~8 h · 100 km ~17 h · Órbita ~24 h
  floorCost: { pow: 0.85, eraMult: 1.9, modulePow: 0.5 },

  // Prestígio "Vender a construtora" (sim/prestige.js)
  prestige: {
    minAlt: 2500,            // libera a partir de 2,5 km (~1h20 na 1ª obra)
    base: 10, pow: 0.56,     // Ações = base × km^pow × (1 + bônus do VGV): 1 km ≈ 10, 12 km ≈ 40, 100 km ≈ 130
    vgvK: 0.06, vgvScale: 1e6, vgvMax: 0.3, // bônus do total vendido: +vgvK por década acima de R$ 1 mi, até +30%
    bonusPer: 0.012,         // +1,2% em tudo por Ação ganha (total; gastar no Conselho não tira o bônus)
    // Conselho: custo = base × k^nível (em Ações)
    council: {
      capital: { n: 'Capital inicial', d: 'Começa cada obra com dinheiro em caixa.', base: 3, k: 2, max: 8, money: 100, mult: 4 },
      equipe: { n: 'Equipe veterana', d: '+1 pedreiro já contratado no começo de cada obra.', base: 4, k: 1.9, max: 5 },
      fornec: { n: 'Fornecedor parceiro', d: '+1 fornecedor de tijolos no começo de cada obra.', base: 4, k: 1.9, max: 5 },
      elevador: { n: 'Elevador extra', d: '+1 elevador de carga já montado no começo de cada obra.', base: 6, k: 2.2, max: 3 },
      fundacao: { n: 'Fundação herdada', d: 'Cada obra começa com a fundação reforçada neste nível.', base: 8, k: 2.6, max: 3 },
      offline: { n: 'Gerente de plantão', d: '+2 h de obra enquanto você está fora.', base: 5, k: 2, max: 4, hours: 2 },
    },
  },
};
