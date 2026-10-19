// Operário de ~58 px de altura (arte provisória por retângulos; será trocada por sprite do PixelLab).
// Coordenadas de mundo: (x, y) = centro dos pés. Virado para a direita; flip vira para a esquerda.
// o: { walk, phase, carry (cor da carga), hammer, drill (furadeira no lugar do martelo), sit (sentado),
//      boss (mestre de obras: capacete branco e prancheta), flip, skin (0..3), suit, pack }
import { MPF } from '../data/constants.js';
import { eraAt } from '../data/eras.js';
import { S } from '../sim/state.js';
import { R } from './canvas.js';
import { cam } from './camera.js';

const SKINS = [['#e0a878', '#c58a5c'], ['#c68642', '#a26a32'], ['#8d5524', '#6e4019'], ['#f1c27d', '#d4a25e']];

export function worker(x, y, o = {}) {
  if (cam.z < 0.07) return; // menor que 4 px: nem desenha
  const era = eraAt(S.floors * MPF), suit = o.suit ?? era >= 3;
  const [sk, skD] = SKINS[(o.skin ?? 0) % SKINS.length];
  const vest = suit ? '#eef1f6' : '#ff8a1e', vestD = suit ? '#c9ced8' : '#d96f10';
  const pants = suit ? '#dfe3ea' : '#33456b', pantsD = suit ? '#b9bfca' : '#26355a';
  const boot = suit ? '#7a8296' : '#4a3524', bootHi = suit ? '#9aa3b5' : '#6b4a30';
  const f = o.flip;
  // sit: sentado na laje (sem material para trabalhar) — o corpo desce, as pernas vão para a frente
  const D = o.sit ? -15 : 0;
  const P = (lx, ly, w, h, c) => R(f ? x - lx - w : x + lx, y + ly + D, w, h, c);
  const Pg = (lx, ly, w, h, c) => R(f ? x - lx - w : x + lx, y + ly, w, h, c);

  // pequeno demais para detalhe: só a silhueta
  if (cam.z < 0.2) {
    P(-6, 0, 12, 40, pants); P(-8, 22, 16, 19, vest); P(-5, 41, 11, 11, sk); P(-6, 51, 13, 6, suit ? '#f7f8fb' : '#ffd23a');
    if (o.carry) P(-9, 58, 19, 10, o.carry);
    return;
  }

  const walk = o.walk ? Math.round(Math.sin((o.phase || 0) * Math.PI) * 4) : 0;
  const ph = o.phase || 0;

  // braço de trás (atrás do corpo)
  if (o.carry) { P(-8, 41, 4, 15, vestD); P(-8, 55, 4, 3, skD); }
  else P(-9 - walk / 2, 28, 4, 12, vestD);
  if (suit && (o.pack ?? era >= 5)) { P(-13, 25, 5, 17, '#9aa3b5'); P(-13, 38, 5, 2, '#6b7183'); }

  // pernas
  if (o.sit) {
    Pg(-6, 4, 18, 6, pantsD); Pg(-4, 6, 18, 6, pants); Pg(10, 0, 6, 8, pants); Pg(10, 0, 9, 4, boot); Pg(10, 3, 9, 1, bootHi);
  } else {
    P(-5 - walk, 5, 6, 18, pantsD); P(-6 - walk, 0, 8, 5, boot);
    P(0 + walk, 5, 6, 18, pants); P(-1 + walk, 0, 9, 5, boot); P(-1 + walk, 4, 9, 1, bootHi);
  }

  // tronco
  P(-8, 22, 16, 19, vest); P(-8, 22, 3, 19, vestD);
  if (!suit) { P(-8, 29, 16, 3, '#f6f1a6'); P(-2, 32, 3, 9, '#f6f1a6'); P(-8, 22, 16, 2, '#5a3a22'); P(2, 22, 3, 2, '#c9a227'); }
  else { P(-6, 30, 12, 2, '#9aa3b5'); P(1, 33, 4, 4, '#3b6fd1'); }

  // cabeça
  if (suit) {
    P(-7, 40, 15, 17, vestD); P(-6, 41, 13, 15, '#eef1f6');
    P(-2, 44, 9, 9, '#3b6fd1'); P(-1, 45, 7, 7, '#5fb8ff'); P(0, 50, 3, 2, '#d9f1ff');
  } else {
    P(-2, 40, 5, 3, skD);
    P(-5, 42, 11, 10, sk); P(-5, 42, 2, 10, skD); P(-2, 45, 2, 3, skD);
    P(3, 47, 2, 2, '#1d1d22'); P(2, 49, 4, 1, '#3a2a1a'); P(6, 45, 1, 2, skD); P(3, 43, 3, 1, '#9a5a40');
    // capacete (branco para o mestre de obras)
    const hc = o.boss ? ['#f4f4f0', '#cfd2d6'] : ['#ffd23a', '#e0ae1a'];
    P(-6, 51, 13, 5, hc[0]); P(-4, 56, 9, 2, hc[0]); P(-7, 50, 17, 2, hc[1]); P(-2, 55, 4, 1, '#fff2a8');
  }

  // braço da frente e ferramenta/carga
  if (o.boss) { // prancheta na mão
    P(3, 30, 5, 11, vest); P(6, 30, 12, 15, '#8b5a2b'); P(7, 31, 10, 12, '#f4f1e6');
    P(8, 39, 7, 1, '#9097a9'); P(8, 36, 8, 1, '#9097a9'); P(8, 33, 6, 1, '#9097a9');
  } else if (o.carry) {
    P(4, 41, 4, 15, vest); P(4, 55, 4, 3, sk);
    P(-10, 58, 21, 10, o.carry); P(-10, 67, 21, 1, 'rgba(255,255,255,.4)'); P(-10, 62, 21, 1, 'rgba(0,0,0,.18)'); P(0, 58, 1, 10, 'rgba(0,0,0,.18)');
  } else if (o.hammer && o.drill) { // ferramenta elétrica: furadeira tremendo contra a parede
    const j = Math.floor(ph * 8) % 2;
    P(4, 33, 12, 5, vest); P(15, 32, 5, 6, sk);
    P(19 + j, 30, 13, 8, '#f2b630'); P(19 + j, 30, 13, 2, '#ffd86a'); P(21 + j, 24, 5, 7, '#3b4152');
    P(32 + j, 33, 7, 2, '#c7ccd6');
  } else if (o.hammer) {
    if (Math.floor(ph * 2) % 2 === 0) { // levantado
      P(2, 39, 5, 12, vest); P(2, 50, 5, 4, sk);
      P(3, 52, 3, 12, '#8b5a2b'); P(-2, 62, 12, 6, '#6b6f78'); P(-2, 67, 12, 1, '#9aa0ab');
    } else { // batendo
      P(4, 33, 12, 5, vest); P(15, 32, 5, 6, sk);
      P(19, 33, 12, 3, '#8b5a2b'); P(29, 27, 6, 13, '#6b6f78'); P(34, 27, 1, 13, '#9aa0ab');
    }
  } else {
    P(1 + walk / 2, 28, 5, 12, vest); P(1 + walk / 2, 24, 5, 4, sk);
  }
}
