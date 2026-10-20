// Contratos de altura (Obra Viva, decisão do usuário 20/10/2026): em cada marco a obra recebe uma proposta com 3 cartões;
// o escolhido vale até o fim da rodada. Os textos falam do efeito, nunca de "etapa mais lenta".
// st/mul (e st2/mul2): multiplica uma etapa (perkMult em sim/contracts.js); cash: segundos de renda na hora; fund: níveis de Fundação;
// rush: segundos de material chegando, subindo e assentando ×3.
export const CONTRACT_MARKS = [2000, 4000, 6000, 8000, 10000, 20000, 30000, 40000, 70000, 150000, 200000, 250000, 300000, 350000];

export const CONTRACTS = {
  aco: { n: 'Aço em promoção', d: 'Material chegando +40% até o fim desta obra.', st: 'prod', mul: 1.4 },
  elev: { n: 'Elevadores alugados', d: 'Material subindo +40% até o fim desta obra.', st: 'tran', mul: 1.4 },
  equipe: { n: 'Equipe extra', d: 'Pedreiros assentando +40% até o fim desta obra.', st: 'lay', mul: 1.4 },
  luxo: { n: 'Cliente de luxo', d: 'Aluguel ×1,6 até o fim desta obra.', st: 'rent', mul: 1.6 },
  agencia: { n: 'Agência de turismo', d: 'Receita do turismo ×3 e aluguel +20% até o fim desta obra.', st: 'tour', mul: 3, st2: 'rent', mul2: 1.2 },
  investidor: { n: 'Investidor', d: 'Dinheiro na hora: 90 segundos da renda atual.', cash: 90 },
  fundacao: { n: 'Fundação reforçada', d: '+1 nível de Fundação na hora.', fund: 1 },
  enxuto: { n: 'Projeto enxuto', d: 'Cada andar gasta 20% menos material até o fim desta obra.', st: 'fcost', mul: 0.8 },
  mutirao: { n: 'Mutirão de fim de semana', d: 'Por 60 segundos, toda a obra anda 3× mais rápido.', rush: 60 },
  credito: { n: 'Crédito de obra', d: 'Todas as compras 20% mais baratas até o fim desta obra.', st: 'cost', mul: 0.8 },
};
export const CONTRACT_IDS = Object.keys(CONTRACTS);
