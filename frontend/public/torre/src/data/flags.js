// Chaves de funcionalidade.
// viva: Obra Viva (o jogo). No navegador é sempre ligado: o modo clássico foi retirado do site (decisão do usuário,
// out/2026; ?classico não abre mais nada). O código do clássico continua só para os testes e o robô de balanceamento:
// em Node o padrão é o clássico; defina globalThis.TORRE_FLAGS = { viva: true } ANTES de importar.
const inBrowser = typeof location !== 'undefined';

export const FLAGS = {
  viva: globalThis.TORRE_FLAGS?.viva ?? inBrowser,
  // protótipo "Obra Viva com risco" (index.html?risco): intempéries que podem derrubar a torre (sim/risco.js)
  risco: globalThis.TORRE_FLAGS?.risco ?? (inBrowser && new URLSearchParams(location.search).has('risco')),
};
