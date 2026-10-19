// Chaves de funcionalidade (comparação A/B entre o modo atual e protótipos).
// viva: protótipo "Obra Viva — quatro pilares", Fase 1. Liga com ?viva no endereço.
// Em Node (testes e robô), defina globalThis.TORRE_FLAGS = { viva: true } ANTES de importar os módulos.
const fromUrl = name => typeof location !== 'undefined' && new URLSearchParams(location.search).has(name);

export const FLAGS = {
  viva: globalThis.TORRE_FLAGS?.viva ?? fromUrl('viva'),
};
