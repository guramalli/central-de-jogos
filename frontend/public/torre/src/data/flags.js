// Chaves de funcionalidade (comparação A/B entre modos).
// viva: Obra Viva (economia dos quatro pilares + tela limpa com a árvore de Melhorias). É o padrão no navegador;
// ?classico abre o modo antigo, com o menu lateral. Saves separados.
// Em Node (testes e robôs) o padrão é o clássico; defina globalThis.TORRE_FLAGS = { viva: true } ANTES de importar.
const inBrowser = typeof location !== 'undefined';
const fromUrl = name => inBrowser && new URLSearchParams(location.search).has(name);

export const FLAGS = {
  viva: globalThis.TORRE_FLAGS?.viva ?? (inBrowser && !fromUrl('classico')),
};
