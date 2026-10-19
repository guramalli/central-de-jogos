// Estado puramente visual (não é salvo)
import { resetCamera } from './camera.js';

export const V = {
  t: 0,            // relógio de animação (s)
  mode: 1,         // 1 blocos, 2 painéis, 3 andares inteiros, 4 megablocos
  modeHold: 0,
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
};

export function resetView() {
  V.mode = 1; V.lastK = -1; V.lastPhase = -1; V.modeHold = 0; V.lastEra = null; V.toast = null; V.bx = [];
  V.floats = []; V.flash = null; V.shaftBuild = []; V.craneBuild = 1;
  resetCamera();
}
