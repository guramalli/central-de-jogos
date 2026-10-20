// Arte gerada no PixelLab (assets/*.png), carregada sob demanda. Enquanto a imagem não chega (ou em Node,
// onde não há Image), art() devolve null e quem desenha usa o sprite feito por código.
// 1 pixel da imagem = 1 pixel de mundo, como os sprites por código (não ampliar arte pequena).
const cache = new Map();
export function art(name) {
  if (typeof Image === 'undefined') return null;
  let im = cache.get(name);
  if (!im) { im = new Image(); im.decoding = 'async'; im.src = 'assets/' + name + '.png'; cache.set(name, im); }
  return im.complete && im.naturalWidth ? im : null;
}

// ícones da árvore de Melhorias (assets/icones/<chave>.png, 32×32)
export const ICON_ART = new Set(['pedreiro', 'treino', 'ferram', 'mestre', 'fornec', 'caminhao', 'olaria', 'premold', 'elevador', 'motor',
  'guindaste', 'cacamba', 'maglev', 'fundacao', 'projeto', 'aluguel', 'bilheteria', 'marketing', 'heliponto', 'porto', 'escoramento',
  'soldadores', 'mutirao', 'robos', 'drones', 'usina', 'siderurgica', 'usinaTopo', 'fabrica', 'asteroides', 'cabos', 'expresso',
  'pressurizada', 'linear', 'teleporte', 'calculo', 'prefab', 'flutuante', 'amortecedor', 'gravidade', 'imobiliaria', 'agencia',
  'hotelNuvens', 'publicidade', 'turismoEsp',
  // alternativas (escolha 1 de 2 por era)
  'argamassa', 'parafusada', 'turnoNoite', 'impressao3d', 'exoesqueleto', 'concretoAD', 'vidroSolar', 'modulosProntos', 'nanotubos',
  'reciclagem', 'gaiolaDupla', 'contrapeso', 'esteira', 'tuboPneumatico', 'elevadorEspacial', 'estacas', 'fundacaoBarata', 'contrafortes',
  'grafeno', 'ancoraOrbital', 'corretores', 'lojas', 'eventos', 'leilao', 'condominioOrbital']);
export const iconURL = k => ICON_ART.has(k) ? 'assets/icones/' + k + '.png' : null;

// começa a baixar tudo logo ao abrir o jogo (as trocas aparecem assim que cada imagem chega)
const SCENE = ['olaria', 'coqueiro', 'bilheteria', 'helicoptero', 'foguete', 'balao', 'aviao', 'navio', 'orla', 'nuvem-0', 'nuvem-1', 'nuvem-2', 'nuvem-3', 'mar', 'caminhao-areia', 'betoneira',
  'rio-orla', 'rio-pao', 'dubai-orla', 'dubai-hotel', 'tamareira', 'artico-orla', 'iceberg', 'pinheiro', 'lua-base', 'terra']; // cidades
for (const a of ['andar', 'carregar', 'martelar', 'furar', 'parado', 'sentado']) SCENE.push('boneco/' + a, 'espacial/' + a);
for (const t of ['turista1', 'turista2', 'turista3']) SCENE.push(t + '/andar', t + '/parado');
SCENE.push('logo', 'mestre/andar', 'mestre/prancheta', 'servente/andar', 'servente/carregar', 'servente/parado');
for (const a of ['banheiro', 'betoneira-peq', 'cacamba-entulho', 'carretel', 'compressor', 'escritorio', 'gerador', 'mesa-plantas', 'sucata', 'torre-luz', 'viga', 'vigas']) SCENE.push('pecas/' + a);
for (let e = 0; e < 7; e++) SCENE.push('fachadas/' + e, 'fachadas/' + e + '-acesa'); // uma fachada por era
export function preloadArt() { SCENE.forEach(art); }
