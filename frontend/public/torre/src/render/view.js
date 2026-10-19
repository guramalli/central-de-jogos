// Estado puramente visual (não é salvo)
import { resetCamera } from './camera.js';

export const V = {
  t: 0,            // relógio de animação (s)
  fast: false,     // obra muito rápida: efeitos por peça agregados
  lastK: -1,       // último bloco/painel desenhado (para soltar poeira)
  lastPhase: -1,   // última etapa do andar em obra (modo 1)
  parts: [],       // partículas (coordenadas de mundo)
  toast: null,     // faixa de nova era / marco
  lastEra: null,   // última era anunciada
  bx: [],          // posição x dos pedreiros no topo
  elev: [0, .5, .25, .75, .12, .62], // fase de cada elevador
  // Obra Viva: efeitos de eventos (só apresentação)
  floats: [],      // textos que sobem e somem { x, y, a, b, t, c }
  flash: null,     // andar recém-concluído com as luzes acesas { i, t }
  shaftBuild: [],  // montagem de cada elevador novo (0..1)
  craneBuild: 1,   // montagem do guindaste (0..1)
  preview: false,  // desenhando uma prévia (tela de Melhorias): nada de efeitos colaterais
};

export function resetView() {
  V.lastK = -1; V.lastPhase = -1; V.fast = false; V.lastEra = null; V.toast = null; V.bx = []; V.heliY = undefined;
  V.floats = []; V.flash = null; V.shaftBuild = []; V.craneBuild = 1;
  resetCamera();
}
