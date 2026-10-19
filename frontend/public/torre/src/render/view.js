// Estado puramente visual (não é salvo)
import { resetCamera } from './camera.js';

export const V = {
  t: 0,            // relógio de animação (s)
  mode: 1,         // 1 blocos, 2 painéis, 3 andares inteiros, 4 megablocos
  modeHold: 0,
  lastK: -1,       // último bloco/painel desenhado (para soltar poeira)
  parts: [],       // partículas (coordenadas de mundo)
  toast: null,     // faixa de nova era / marco
  lastEra: null,   // última era anunciada
  bx: [],          // posição x dos pedreiros no topo
  elev: [0, .5, .25, .75, .12, .62], // fase de cada elevador
};

export function resetView() {
  V.mode = 1; V.lastK = -1; V.modeHold = 0; V.lastEra = null; V.toast = null; V.bx = [];
  resetCamera();
}
