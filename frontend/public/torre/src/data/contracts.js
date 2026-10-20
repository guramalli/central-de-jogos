// Contratos de altura (Obra Viva, decisão do usuário 20/10/2026): em cada marco a obra recebe uma proposta com 3 cartões;
// o escolhido vale até o fim da rodada. Os textos falam do efeito, nunca de "etapa mais lenta".
// st/mul (e st2/mul2): multiplica uma etapa (perkMult em sim/contracts.js); sts: várias etapas com o mesmo mul;
// cash: segundos de renda na hora; fund: níveis de Fundação;
// rush: segundos de material chegando, subindo e assentando ×3.
export const CONTRACT_MARKS = [2000, 4000, 6000, 8000, 10000, 20000, 30000, 40000, 70000, 150000, 200000, 250000, 300000, 350000];

export const CONTRACTS = {
  aco: { n: 'Aço em promoção', d: 'Material chegando +40% e cada andar gasta 10% menos material até o fim desta obra.', st: 'prod', mul: 1.4, st2: 'fcost', mul2: 0.9 },
  elev: { n: 'Elevadores alugados', d: 'Material subindo +40% até o fim desta obra.', st: 'tran', mul: 1.4 },
  // Reforço geral (era 'Equipe extra', escolhida 1% das vezes): vale nas três etapas, sem apontar qual está lenta
  equipe: { n: 'Reforço geral', d: 'Material chegando, subindo e assentando +25% até o fim desta obra.', sts: ['prod', 'tran', 'lay'], mul: 1.25 },
  luxo: { n: 'Cliente de luxo', d: 'Aluguel ×1,6 até o fim desta obra.', st: 'rent', mul: 1.6 },
  agencia: { n: 'Agência de turismo', d: 'Receita do turismo ×3 e aluguel +20% até o fim desta obra.', st: 'tour', mul: 3, st2: 'rent', mul2: 1.2 },
  // Investidor (escolhido 94% das vezes): metade do dinheiro e uma parte do aluguel fica com ele até o fim da obra
  investidor: { n: 'Investidor', d: 'Dinheiro na hora (45 segundos da renda atual), mas ele fica com 10% do aluguel até o fim desta obra.', cash: 45, st2: 'rent', mul2: 0.9 },
  fundacao: { n: 'Fundação reforçada', d: '+1 nível de Fundação na hora.', fund: 1 },
  enxuto: { n: 'Projeto enxuto', d: 'Cada andar gasta 20% menos material até o fim desta obra.', st: 'fcost', mul: 0.8 },
  mutirao: { n: 'Mutirão', d: 'Por 18 dias, toda a obra anda 3× mais rápido.', rush: 60 }, // 60 s de relógio ≈ 18 dias do contrato
  credito: { n: 'Crédito de obra', d: 'Todas as compras 20% mais baratas até o fim desta obra.', st: 'cost', mul: 0.8 },
};
export const CONTRACT_IDS = Object.keys(CONTRACTS);
