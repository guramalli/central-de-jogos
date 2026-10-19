// Melhorias do dia a dia, compradas com dinheiro.
// custo = base * k^(nível - start)
// req: [id, nível mínimo] de outra melhoria; reqAlt: altura mínima já alcançada (m); max: nível máximo.
export const BRANCHES = [
  { id: 'obra', n: 'Mão de obra' },
  { id: 'forn', n: 'Fornecimento' },
  { id: 'log', n: 'Logística' },
  { id: 'eng', n: 'Engenharia' },
  { id: 'merc', n: 'Mercado' },
];

export const UP = {
  // Mão de obra
  pedreiro: { b: 'obra', n: 'Contratar pedreiro', d: '+1 pedreiro assentando no topo da obra.', base: 12, k: 1.3, start: 1 },
  treino: { b: 'obra', n: 'Treinamento', d: '+25% de velocidade de assentamento por nível.', base: 60, k: 1.65, req: ['pedreiro', 3] },
  ferram: { b: 'obra', n: 'Ferramentas elétricas', d: '×1,5 assentamento por nível.', base: 500, k: 3.2, max: 10, req: ['treino', 3] },
  mestre: { b: 'obra', n: 'Mestre de obras', d: '×2 assentamento por nível.', base: 20000, k: 9, max: 6, req: ['ferram', 2] },
  // Fornecimento
  fornec: { b: 'forn', n: 'Fornecedor de tijolos', d: '+1,5 de material por segundo no térreo.', base: 10, k: 1.28, start: 1 },
  caminhao: { b: 'forn', n: 'Caminhão maior', d: '+30% de produção por nível.', base: 80, k: 1.75, req: ['fornec', 3] },
  olaria: { b: 'forn', n: 'Olaria própria', d: '×2 produção por nível.', base: 1000, k: 5, max: 10, req: ['caminhao', 3] },
  premold: { b: 'forn', n: 'Fábrica de pré-moldados', d: '×3 produção por nível.', base: 60000, k: 14, max: 6, req: ['olaria', 2] },
  // Logística
  elevador: { b: 'log', n: 'Novo elevador de carga', d: '+1 elevador subindo material.', base: 45, k: 2.6, max: 6, start: 1 },
  motor: { b: 'log', n: 'Motor mais forte', d: '×1,3 velocidade dos elevadores.', base: 30, k: 2.3 },
  cacamba: { b: 'log', n: 'Caçamba maior', d: '×1,3 carga por viagem.', base: 55, k: 2.3, req: ['motor', 1] },
  maglev: { b: 'log', n: 'Elevador magnético', d: '×4 velocidade dos elevadores.', base: 40000, k: 12, max: 6, req: ['cacamba', 4] },
  // Engenharia
  fundacao: { b: 'eng', n: 'Fundação reforçada', d: 'Dobra a altura máxima que a torre suporta.', base: 150, k: 3.6 },
  guindaste: { b: 'eng', n: 'Guindaste de torre', d: '+50% assentamento. Nv 1 iça painéis, Nv 2 iça andares inteiros, Nv 4 libera o dirigível de megablocos.', base: 250, k: 2.8, max: 10, req: ['fundacao', 1] },
  projeto: { b: 'eng', n: 'Projeto otimizado', d: '−15% de material por andar.', base: 600, k: 3.4, max: 8, req: ['fundacao', 2] },
  // Mercado
  corretor: { b: 'merc', n: 'Corretor de imóveis', d: 'Nv 1 decide sozinho o destino de cada andar pronto (regra em Imóveis). +8% no preço de venda por nível.', base: 150, k: 4, max: 6 },
  aluguel: { b: 'merc', n: 'Andares comerciais', d: '+50% de renda de aluguel por nível.', base: 120, k: 2.1 },
  bilheteria: { b: 'merc', n: 'Elevador panorâmico', d: 'Leva turistas ao topo: +0,3 visitante/s de capacidade.', base: 200, k: 1.9, reqAlt: 40 },
  marketing: { b: 'merc', n: 'Marketing da torre', d: '+25% de turistas interessados.', base: 400, k: 2.2, req: ['bilheteria', 1] },
  banco: { b: 'merc', n: 'Relacionamento bancário', d: 'Sobe o nível do banco: mais crédito e juros menores.', base: 2500, k: 30, max: 3 },
  heliponto: { b: 'merc', n: 'Heliponto no topo', d: 'Passeios de helicóptero: +1 visitante/s de capacidade.', base: 60000, k: 2.4, reqAlt: 1000 },
  porto: { b: 'merc', n: 'Porto espacial', d: 'Turismo espacial: +0,05 turista espacial/s, com ingresso 40× mais caro.', base: 5e9, k: 3, reqAlt: 100000 },
};

export const KEYS = Object.keys(UP);
