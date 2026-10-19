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
  'hotelNuvens', 'publicidade', 'turismoEsp']);
export const iconURL = k => ICON_ART.has(k) ? 'assets/icones/' + k + '.png' : null;

// começa a baixar tudo logo ao abrir o jogo (as trocas aparecem assim que cada imagem chega)
const SCENE = ['olaria', 'coqueiro', 'bilheteria', 'helicoptero', 'foguete', 'balao', 'aviao', 'navio', 'orla', 'nuvem-0', 'nuvem-1', 'nuvem-2', 'nuvem-3', 'mar'];
for (const a of ['andar', 'carregar', 'martelar', 'furar', 'parado', 'sentado']) SCENE.push('boneco/' + a, 'espacial/' + a);
SCENE.push('mestre/andar', 'mestre/prancheta');
for (let e = 0; e < 7; e++) SCENE.push('fachadas/' + e, 'fachadas/' + e + '-acesa'); // uma fachada por era
export function preloadArt() { SCENE.forEach(art); }
