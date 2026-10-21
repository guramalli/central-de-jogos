// Chaves de funcionalidade.
// viva: Obra Viva (o jogo). No navegador é sempre ligado: o modo clássico foi retirado do site (decisão do usuário,
// out/2026; ?classico não abre mais nada). O código do clássico continua só para os testes e o robô de balanceamento:
// em Node o padrão é o clássico; defina globalThis.TORRE_FLAGS = { viva: true } ANTES de importar.
const inBrowser = typeof location !== 'undefined';

export const FLAGS = {
  viva: globalThis.TORRE_FLAGS?.viva ?? inBrowser,
  // torre única com intempéries (sim/risco.js): o modo principal no site desde 21/10/2026 (decisão do usuário);
  // o jogo de rodadas (uma obra por cidade) continua em index.html?rodadas. Em Node o padrão é desligado.
  risco: globalThis.TORRE_FLAGS?.risco ?? (inBrowser && !new URLSearchParams(location.search).has('rodadas')),
};
