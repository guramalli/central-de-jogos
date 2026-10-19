// Eras por altitude (m). Cada era muda paleta da fachada, céu, roupas e custo do andar.
export const ERAS = [
  { n: 'Tijolo e Madeira', m: 0 },
  { n: 'Era do Concreto', m: 100 },
  { n: 'Era do Aço e Vidro', m: 1000 },
  { n: 'Estratosfera', m: 12000 },
  { n: 'Mesosfera', m: 50000 },
  { n: 'Espaço', m: 100000 },
  { n: 'Órbita', m: 400000 },
];

// Paleta da fachada por era
export const ERA_STYLE = [
  { wall: '#9a5b3a', line: '#7d4630', frame: '#5a3322', glass: '#2c3b55', lit: '#ffd27a', slab: '#6b4a33', brick: '#b5523b', hi: '#d9775a', edge: '#4e2b1c' },
  { wall: '#9ea3a8', line: '#868b92', frame: '#5c6168', glass: '#2b3a52', lit: '#ffe08a', slab: '#71767d', brick: '#b3b8bd', hi: '#d6dadd', edge: '#4a4e55' },
  { wall: '#3d6f93', line: '#2b4f6b', frame: '#22384c', glass: '#4f88b0', lit: '#cdeeff', slab: '#5b6f80', brick: '#5d97c2', hi: '#b4def6', edge: '#1c2c3b' },
  { wall: '#d9dde4', line: '#bfc4cd', frame: '#8b929e', glass: '#26324a', lit: '#5ad1ff', slab: '#a5abb6', brick: '#e9ecf1', hi: '#ffffff', edge: '#7c8390' },
  { wall: '#5c6273', line: '#4b5060', frame: '#383c49', glass: '#1e2230', lit: '#ff9a3c', slab: '#444957', brick: '#7a8296', hi: '#a3abbf', edge: '#2a2d37' },
  { wall: '#2b3142', line: '#232838', frame: '#c9a33a', glass: '#141826', lit: '#62f0ff', slab: '#3a4157', brick: '#465071', hi: '#7280a8', edge: '#161a25' },
  { wall: '#3a2f5c', line: '#2e254a', frame: '#8f7bd6', glass: '#160f2c', lit: '#ff7bd9', slab: '#4b3f73', brick: '#5a4a8c', hi: '#a08ae8', edge: '#1d1733' },
];

// Gradiente do céu por altitude: [m, cor de cima, cor de baixo]
export const SKY = [
  [0, '#5aa9e6', '#c4e6f4'],
  [2000, '#3f86d1', '#a3d2ee'],
  [12000, '#1d4e9a', '#5e95d6'],
  [30000, '#0d1f4a', '#2b4e8f'],
  [80000, '#050817', '#0e1838'],
  [150000, '#02030a', '#060912'],
];

// Marcos de altitude desenhados na lateral
export const MARKS = [100, 1000, 12000, 50000, 100000, 400000];

export const eraAt = m => {
  let e = 0;
  for (let i = 0; i < ERAS.length; i++) if (m >= ERAS[i].m) e = i;
  return e;
};
