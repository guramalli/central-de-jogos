// Cidades do prestígio "Nova obra" (Obra Viva): cada entrega leva a Construtora J. Santos para a próxima cidade.
// mods: regra simples da cidade (multiplicadores sobre as etapas e a renda); cena: chaves da arte em assets/ (PixelLab)
// e cores do chão. Depois da última, volta ao Rio com a obra seguinte (os pontos continuam crescendo).
export const CITIES = [
  { id: 'praia-grande', n: 'Praia Grande', mods: {}, regra: 'A orla onde tudo começou.',
    scene: { skyline: 'orla', landmark: null, tree: 'coqueiro', sea: 'mar', sand: '#e2c98e', sand2: '#d7bb7c', calcadao: true, ship: true } },
  { id: 'rio', n: 'Rio de Janeiro', mods: { tour: 1.3, rent: 1.1, prod: 0.9 }, regra: 'Cartão-postal: turismo +30% e aluguel +10%, mas o material chega 10% mais devagar.',
    scene: { skyline: 'rio-orla', landmark: 'rio-pao', tree: 'coqueiro', sea: 'mar', sand: '#ecd29a', sand2: '#dcc184', calcadao: true, ship: true } },
  { id: 'dubai', n: 'Dubai', mods: { rent: 1.3, tour: 1.1, prod: 0.85 }, regra: 'Dinheiro no deserto: aluguel +30% e turismo +10%, mas o material chega 15% mais devagar.',
    scene: { skyline: 'dubai-orla', landmark: 'dubai-hotel', tree: 'tamareira', sea: 'mar', sand: '#e8c27a', sand2: '#d9ad62', calcadao: false, ship: true } },
  { id: 'artico', n: 'Ártico', mods: { tran: 0.85, lay: 0.9, rent: 1.2 }, regra: 'Frio extremo: elevadores 15% e pedreiros 10% mais lentos, mas aluguel +20% (quem mora aqui paga bem).',
    scene: { skyline: 'artico-orla', landmark: 'iceberg', tree: 'pinheiro', sea: 'mar', seaTint: 'rgba(20,40,70,.35)', sand: '#eef3f7', sand2: '#d9e3ec', calcadao: false, ship: false } },
  { id: 'lua', n: 'Base Lunar', mods: { tran: 1.3, prod: 0.8, tour: 1.5 }, regra: 'Gravidade baixa: elevadores 30% mais rápidos e turismo +50%, mas o material chega 20% mais devagar.',
    scene: { skyline: 'lua-base', landmark: 'terra', tree: null, sea: null, plain: '#5c5f66', sand: '#9a9ca2', sand2: '#86888f', calcadao: false, ship: false, skyAlt: 400000, noClouds: true, landmarkY: 320 } },
];
export const cityOf = i => CITIES[i < CITIES.length ? i : 1 + (i - 1) % (CITIES.length - 1)];
