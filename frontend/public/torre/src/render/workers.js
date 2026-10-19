// Operário de ~60 px de altura, animado por um esqueleto 2D (render/rig.js): cada quadro é uma pose
// pintada pixel a pixel e guardada em cache; aqui só se escolhe a animação e o quadro.
// Coordenadas de mundo: (x, y) = centro dos pés. Virado para a direita; flip vira para a esquerda.
// o: { walk, phase, carry (cor da carga), hammer, drill (furadeira no lugar do martelo), sit (sentado),
//      boss (mestre de obras: capacete branco e prancheta), flip, skin (0..3), suit, pack }
import { MPF } from '../data/constants.js';
import { altOf, floorOf, mpfAt } from '../data/height.js';
import { eraAt } from '../data/eras.js';
import { S } from '../sim/state.js';
import { R, ctx } from './canvas.js';
import { cam, sx, sy } from './camera.js';
import { art } from './assets.js';
import { blit, shade } from './sprites.js';
import { drawRig, ANIMS, SKINS, RIG_AX, RIG_AY, walkDistance } from './rig.js';

const SIL = { vest: '#ee7a1c', pants: '#30446e', helm: '#f7c824', suit: '#d3d8e0', suitD: '#a9b0bd', visor: '#f7f8fb' };

// quadro de uma animação (também usado para montar folhas de conferência)
export function workerSprite(anim, frame, o = {}) {
  const q = { skin: 0, suit: false, pack: false, boss: false, carry: '', ...o };
  const key = `rig|${anim}|${frame}|${q.skin}|${q.suit ? 1 : 0}|${q.pack ? 1 : 0}|${q.boss ? 1 : 0}|${q.carry}|${q.gear || 0}|${q.tl || 0}`;
  return drawRig(key, anim, frame, q);
}

// visitante (turismo): mesmo esqueleto, roupa colorida; parado na fila respirando ou andando
const SHIRTS = ['#e8505b', '#4fb0e8', '#f2d24a', '#7ad37a', '#c58be8', '#ff9f43'];
const PANTS = ['#33456b', '#5a4632', '#2f6a5a', '#d8cfb8', '#4a4f5c'];
export function tourist(x, y, i, o = {}) {
  if (cam.z < 0.1) return;
  if (cam.z < 0.2) { R(x - 6, y, 12, 26, PANTS[i % PANTS.length]); R(x - 7, y + 24, 14, 18, SHIRTS[i % SHIRTS.length]); R(x - 5, y + 42, 11, 11, SKINS[i % 4].s[2]); return; }
  const civ = { shirt: SHIRTS[i % SHIRTS.length], pants: PANTS[(i * 3 + 1) % PANTS.length], stripe: i % 5 === 2,
    hat: i % 3 === 0 ? 'sun' : i % 4 === 1 ? 'cap' : '', hatC: SHIRTS[(i + 2) % SHIRTS.length], camera: i % 4 === 1 };
  const anim = o.walk ? 'walk' : 'idle', n = ANIMS[anim].frames;
  const cyc = o.walk ? x / walkDistance(false) : (o.phase ?? 0) / 2 + i * 0.37;
  const frame = ((Math.floor((cyc % 1 + 1) % 1 * n)) + n) % n;
  const q = { skin: i % 4, suit: false, pack: false, boss: false, carry: '', civ };
  blit(drawRig(`civ|${anim}|${frame}|${i % 60}`, anim, frame, q), x, y, RIG_AX, RIG_AY, !!o.flip);
}

// folhas do PixelLab: [arquivo, quadros]; células de 88×88 com os pés no ponto (44, 84)
const SHEETS = { walk: ['andar', 8], carry: ['carregar', 5], hammer: ['martelar', 8], drill: ['furar', 6], idle: ['parado', 4], sit: ['sentado', 3], boss: ['prancheta', 8] };
const CELL = 88, FEET_X = 44, FEET_Y = 84;
// onde ficam as mãos em cada quadro de "carregar" (célula)
const HANDS = { boneco: [[60, 51], [61, 46], [60, 46], [61, 45], [62, 47]], espacial: [[66, 50], [67, 49], [67, 50], [66, 50], [66, 51]] };
function blitCell(img, i, x, y, flip) {
  const z = cam.z, X = Math.round(sx(x - FEET_X)), Y = Math.round(sy(y + FEET_Y)), w = Math.round(CELL * z), h = Math.round(CELL * z);
  if (X > ctx.canvas.width || X + w < 0 || Y > ctx.canvas.height || Y + h < 0) return;
  if (flip) { ctx.save(); ctx.translate(X + w, Y); ctx.scale(-1, 1); ctx.drawImage(img, i * CELL, 0, CELL, CELL, 0, 0, w, h); ctx.restore(); }
  else ctx.drawImage(img, i * CELL, 0, CELL, CELL, X, Y, w, h);
}

export function worker(x, y, o = {}) {
  if (cam.z < 0.07) return; // menor que 4 px: nem desenha
  const era = eraAt(altOf(S.floors)), suit = o.suit ?? era >= 3;
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
  // bonecos do PixelLab (folhas em assets/<conjunto>): pedreiro, pedreiro de traje espacial (eras altas) e mestre de obras;
  // usados quando a arte já carregou (antes disso, o esqueleto por código)
  {
    const set = suit ? 'espacial' : o.boss ? 'mestre' : 'boneco'; // nas eras altas o mestre também usa traje (parado, de olho na obra)
    const key = o.boss ? (suit ? 'idle' : anim === 'walk' ? 'walk' : 'boss') : anim === 'walk' && o.carry ? 'carry' : anim;
    const sh = SHEETS[key], img = sh && art(set + '/' + sh[0]);
    if (img) {
      const m = sh[1], f = ((Math.floor((cyc % 1 + 1) % 1 * m)) + m) % m;
      blitCell(img, f, x, y, !!o.flip);
      if (sh[0] === 'carregar') { // o bloco é desenhado pelo jogo (mesmo bloco e cor da era que a construção usa), apoiado nas mãos
        const [hx, hy] = HANDS[set][f], dx = hx - FEET_X, bx = o.flip ? x - dx - 3 : x + dx - 16, by = y + FEET_Y - hy;
        R(bx, by, 19, 10, o.carry); R(bx, by + 9, 19, 1, shade(o.carry, 0.3)); R(bx, by, 19, 1, shade(o.carry, -0.3)); R(bx + 9, by + 1, 1, 8, shade(o.carry, -0.2));
      }
      return;
    }
  }
  // Treinamento e Ferramenta aparecem no equipamento de todos os operários (gear até 6; furadeira até o nível 10)
  const gear = suit ? 0 : Math.min(6, S.lv.treino || 0), tl = anim === 'drill' ? Math.min(10, S.lv.ferram || 0) : 0;
  const spr = workerSprite(anim, frame, { skin, suit, pack: suit && (o.pack ?? era >= 5), boss: !!o.boss, carry: o.carry || '', gear, tl });
  blit(spr, x, y, RIG_AX, RIG_AY, !!o.flip);
}
