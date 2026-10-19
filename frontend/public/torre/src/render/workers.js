// Operário de ~60 px de altura, animado por um esqueleto 2D (render/rig.js): cada quadro é uma pose
// pintada pixel a pixel e guardada em cache; aqui só se escolhe a animação e o quadro.
// Coordenadas de mundo: (x, y) = centro dos pés. Virado para a direita; flip vira para a esquerda.
// o: { walk, phase, carry (cor da carga), hammer, drill (furadeira no lugar do martelo), sit (sentado),
//      boss (mestre de obras: capacete branco e prancheta), flip, skin (0..3), suit, pack }
import { MPF } from '../data/constants.js';
import { eraAt } from '../data/eras.js';
import { S } from '../sim/state.js';
import { R } from './canvas.js';
import { cam } from './camera.js';
import { blit } from './sprites.js';
import { drawRig, ANIMS, SKINS, RIG_AX, RIG_AY, walkDistance } from './rig.js';

const SIL = { vest: '#ee7a1c', pants: '#30446e', helm: '#f7c824', suit: '#d3d8e0', suitD: '#a9b0bd', visor: '#f7f8fb' };

// quadro de uma animação (também usado para montar folhas de conferência)
export function workerSprite(anim, frame, o = {}) {
  const q = { skin: 0, suit: false, pack: false, boss: false, carry: '', ...o };
  const key = `rig|${anim}|${frame}|${q.skin}|${q.suit ? 1 : 0}|${q.pack ? 1 : 0}|${q.boss ? 1 : 0}|${q.carry}`;
  return drawRig(key, anim, frame, q);
}

export function worker(x, y, o = {}) {
  if (cam.z < 0.07) return; // menor que 4 px: nem desenha
  const era = eraAt(S.floors * MPF), suit = o.suit ?? era >= 3;
  const skin = (o.skin ?? 0) % SKINS.length;

  // pequeno demais para detalhe: só a silhueta
  if (cam.z < 0.2) {
    const sk = SKINS[skin].s[2], f = o.flip, D = o.sit ? -15 : 0;
    const P = (lx, ly, w, h, c) => R(f ? x - lx - w : x + lx, y + ly + D, w, h, c);
    P(-6, 0, 12, 40, suit ? SIL.suitD : SIL.pants); P(-8, 22, 16, 19, suit ? SIL.suit : SIL.vest); P(-5, 41, 11, 11, sk); P(-6, 51, 13, 6, suit ? SIL.visor : SIL.helm);
    if (o.carry) P(-9, 58, 19, 10, o.carry);
    return;
  }

  // animação e quadro (phase: parado/sentado = 1 ciclo a cada 2; martelo = 1 batida a cada 1; furadeira tremendo)
  const ph = o.phase || 0;
  const anim = o.sit ? 'sit' : o.boss ? 'boss' : o.walk ? 'walk' : o.hammer && o.drill ? 'drill' : o.hammer ? 'hammer' : 'idle';
  // andando: o ciclo sai da posição x, então o pé de apoio fica parado no chão (sem patinar)
  const cyc = anim === 'walk' ? (o.flip ? -x : x) / walkDistance(!!o.carry)
    : anim === 'idle' || anim === 'sit' || anim === 'boss' ? ph / 2 : anim === 'drill' ? ph * 2 : ph;
  const n = ANIMS[anim].frames, frame = ((Math.floor((cyc % 1 + 1) % 1 * n)) + n) % n;
  const spr = workerSprite(anim, frame, { skin, suit, pack: suit && (o.pack ?? era >= 5), boss: !!o.boss, carry: o.carry || '' });
  blit(spr, x, y, RIG_AX, RIG_AY, !!o.flip);
}
