// Tipos de andar. rent/sale multiplicam o valor-base do andar (que cresce com a altura).
// alt: altura recorde necessária para liberar o tipo.
export const FLOOR_TYPES = {
  apto: { n: 'Apartamento', rent: 1, sale: 1.2, alt: 0, d: 'Vende bem.' },
  escr: { n: 'Escritório', rent: 1.5, sale: 0.8, alt: 100, d: 'Aluguel alto, venda fraca.' },
  hotel: { n: 'Hotel', rent: 1.1, sale: 1, alt: 250, d: 'Atrai turistas: mais visitantes interessados.' },
  rest: { n: 'Restaurante panorâmico', rent: 2, sale: 1.8, alt: 1000, d: 'Caro em tudo. Só com vista de verdade.' },
  obs: { n: 'Observatório', rent: 0.5, sale: 0.5, alt: 12000, d: 'Rende pouco, mas encarece o ingresso dos turistas.' },
};
export const TYPE_IDS = Object.keys(FLOOR_TYPES);
