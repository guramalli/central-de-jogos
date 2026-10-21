// Chaves de funcionalidade.
// viva: Obra Viva (o jogo). No navegador é sempre ligado: o modo clássico foi retirado do site (decisão do usuário,
// out/2026; ?classico não abre mais nada). O código do clássico continua só para os testes e o robô de balanceamento:
// em Node o padrão é o clássico; defina globalThis.TORRE_FLAGS = { viva: true } ANTES de importar.
const inBrowser = typeof location !== 'undefined';

export const FLAGS = {
  viva: globalThis.TORRE_FLAGS?.viva ?? inBrowser,
  // torre única com intempéries (sim/risco.js): o jogo do site (o modo de rodadas foi apagado em 21/10/2026, decisão do
  // usuário). Sempre junto com o Obra Viva; em Node só o clássico fica sem ele.
  risco: globalThis.TORRE_FLAGS?.risco ?? globalThis.TORRE_FLAGS?.viva ?? inBrowser,
};
