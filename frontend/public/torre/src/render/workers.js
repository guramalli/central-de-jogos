// Operário de ~60 px de altura, animado por um esqueleto 2D (render/rig.js): cada quadro é uma pose
// pintada pixel a pixel e guardada em cache; aqui só se escolhe a animação e o quadro.
// Coordenadas de mundo: (x, y) = centro dos pés. Virado para a direita; flip vira para a esquerda.
// o: { walk, phase, carry (cor da carga), hammer, drill (furadeira no lugar do martelo), sit (sentado),
//      boss (mestre de obras: capacete branco e prancheta), flip, skin (0..3), suit, pack }
import { MPF, FH } from '../data/constants.js';
import { altOf, floorOf, mpfAt } from '../data/height.js';
import { eraAt } from '../data/eras.js';
import { S } from '../sim/state.js';
import { R, ctx } from './canvas.js';
import { cam, sx, sy } from './camera.js';
import { art } from './assets.js';
import { blit } from './sprites.js';
import { drawRig, ANIMS, SKINS, RIG_AX, RIG_AY, walkDistance } from './rig.js';
import { eraVis, onMoon } from './eravis.js';
import { FLAGS } from '../data/flags.js';
import { chovendo } from '../sim/risco.js';
import { V } from './view.js';

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
// turistas do PixelLab (assets/turista1..3: andar 8 quadros, parado 4); antes de carregar, o esqueleto por código
const TSHEET = { walk: ['andar', 8], idle: ['parado', 4] };
export function tourist(x, y, i, o = {}) {
  if (cam.z < 0.1) return;
  // traje espacial na Lua e da estratosfera para cima (quem sobe na cabine panorâmica até lá em cima)
  const traje = onMoon() || eraAt(altOf(Math.max(0, y) / FH)) >= 3;
  if (cam.z >= 0.2) {
    const sh = TSHEET[o.walk ? 'walk' : 'idle'], img = art(traje ? `espacial/${sh[0]}` : `turista${(i % 3) + 1}/${sh[0]}`);
    if (img) {
      const cyc = o.walk ? (o.flip ? -x : x) / 52 : (o.phase ?? 0) / 2 + i * 0.37, m = sh[1];
      blitCell(img, ((Math.floor((cyc % 1 + 1) % 1 * m)) + m) % m, x, y, !!o.flip);
      return;
    }
  }
  if (cam.z < 0.2) { R(x - 6, y, 12, 26, PANTS[i % PANTS.length]); R(x - 7, y + 24, 14, 18, SHIRTS[i % SHIRTS.length]); R(x - 5, y + 42, 11, 11, SKINS[i % 4].s[2]); return; }
  const civ = { shirt: SHIRTS[i % SHIRTS.length], pants: PANTS[(i * 3 + 1) % PANTS.length], stripe: i % 5 === 2,
    hat: i % 3 === 0 ? 'sun' : i % 4 === 1 ? 'cap' : '', hatC: SHIRTS[(i + 2) % SHIRTS.length], camera: i % 4 === 1 };
  const anim = o.walk ? 'walk' : 'idle', n = ANIMS[anim].frames;
  const cyc = o.walk ? x / walkDistance(false) : (o.phase ?? 0) / 2 + i * 0.37;
  const frame = ((Math.floor((cyc % 1 + 1) % 1 * n)) + n) % n;
  const q = { skin: i % 4, suit: traje, pack: false, boss: false, carry: '', civ: traje ? null : civ };
  blit(drawRig(`civ|${anim}|${frame}|${i % 60}|${traje ? 1 : 0}`, anim, frame, q), x, y, RIG_AX, RIG_AY, !!o.flip);
}

// folhas do PixelLab: [arquivo, quadros]; células de 88×88 com os pés no ponto (44, 84)
const SHEETS = { walk: ['andar', 8], carry: ['carregar', 5], hammer: ['martelar', 8], drill: ['furar', 6], idle: ['parado', 4], sit: ['sentado', 3], boss: ['prancheta', 8] };
const CELL = 88, FEET_X = 44, FEET_Y = 84;
function blitCell(img, i, x, y, flip) {
  const z = cam.z, X = Math.round(sx(x - FEET_X)), Y = Math.round(sy(y + FEET_Y)), w = Math.round(CELL * z), h = Math.round(CELL * z);
  if (X > ctx.canvas.width || X + w < 0 || Y > ctx.canvas.height || Y + h < 0) return;
  if (flip) { ctx.save(); ctx.translate(X + w, Y); ctx.scale(-1, 1); ctx.drawImage(img, i * CELL, 0, CELL, CELL, 0, 0, w, h); ctx.restore(); }
  else ctx.drawImage(img, i * CELL, 0, CELL, CELL, X, Y, w, h);
}

// choque elétrico: a folha inteira pintada de quase preto (mesmo contorno, mesma animação) e um esqueleto branco por cima
const silCache = new Map();
function silhueta(img) {
  const k = img.src || img; if (silCache.has(k)) return silCache.get(k);
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#0d0b10'; g.fillRect(0, 0, c.width, c.height);
  silCache.set(k, c); return c;
}
function esqueleto(x, y, deitado = false, flip = false) {
  const B = '#f4f1e8', s = flip ? -1 : 1, P = (dx, dy, w, h, c = B) => R(x + (s < 0 ? -dx - w : dx), y + dy, w, h, c);
  if (deitado) { // pedreiro descansando, recostado: crânio atrás, tronco inclinado, pernas esticadas para a frente
    const osso = (x0, y0, x1, y1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) / 2; for (let i = 0; i <= n; i++) P(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, 2, 2); };
    P(-16, 20, 9, 9); P(-14, 23, 2, 2, '#0d0b10'); P(-11, 23, 2, 2, '#0d0b10');           // crânio
    osso(-10, 18, 0, 6); for (const k of [0, 1, 2, 3]) osso(-11 + k * 2.5, 15 - k * 2.5, -3 + k * 2.5, 19 - k * 2.5); // coluna e costelas
    P(-2, 3, 8, 4); osso(5, 4, 30, 2); osso(5, 6, 30, 5); P(30, 1, 4, 6);                 // bacia, pernas e pés
    osso(-8, 16, 2, 10);                                                                  // braço
  } else {
  P(-4, 2, 3, 20); P(1, 2, 3, 20);                     // pernas
  P(-6, 0, 5, 2); P(1, 0, 5, 2);                       // pés
  P(-6, 22, 12, 4);                                    // bacia
  P(-1, 26, 2, 18);                                    // coluna
  for (const dy of [30, 33, 36, 39]) P(-7, dy, 14, 2); // costelas
  P(-9, 42, 18, 2);                                    // ombros
  P(-10, 26, 2, 16); P(8, 26, 2, 16);                  // braços
  P(-5, 46, 10, 10); P(-4, 44, 8, 2);                  // crânio e queixo
  P(-3, 50, 2, 3, '#0d0b10'); P(1, 50, 2, 3, '#0d0b10'); P(-1, 47, 2, 1, '#0d0b10'); // olhos e dentes
  }
  for (let i = 0; i < 6; i++) { const a = Math.random() * 6.28, r = 12 + Math.random() * 10; P(Math.cos(a) * r, (deitado ? 12 : 30) + Math.sin(a) * r * 1.3, 2, 2, Math.random() < .5 ? '#fff6a0' : '#9fe8ff'); } // faíscas
}

// troca os pixels magenta (cor marcadora da caixa) pela cor do material, com luz e sombra pela luminosidade
const tintCache = new Map();
function tinted(img, color, set) {
  const k = set + color; let c = tintCache.get(k);
  if (c) return c;
  c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), p = d.data;
  const n = parseInt(color.slice(1), 16), cr = n >> 16, cg = (n >> 8) & 255, cb = n & 255;
  for (let i = 0; i < p.length; i += 4) {
    const r = p[i], gg = p[i + 1], b = p[i + 2];
    const mx = Math.max(r, b);
    // magenta: verde abaixo do azul e bem abaixo do vermelho (do rosa claro ao roxo); colete laranja, pele e jeans ficam de fora
    if (!p[i + 3] || mx < 50 || gg >= b || r - gg < 50 || Math.min(r, b) < 0.5 * mx || (gg > 0.3 * r && r < 200)) continue;
    const f = Math.max(0.4, Math.min(1.35, 0.35 + 0.65 * (mx + gg) / 255)); // rosa claro = face iluminada
    p[i] = Math.min(255, cr * f); p[i + 1] = Math.min(255, cg * f); p[i + 2] = Math.min(255, cb * f);
  }
  g.putImageData(d, 0, 0); tintCache.set(k, c);
  return c;
}

export function worker(x, y, o = {}) {
  if (cam.z < 0.07) return; // menor que 4 px: nem desenha
  const era = eraVis(altOf(S.floors)), suit = o.suit ?? era >= 3;
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
    // serventes do térreo (role 'servente'): boné azul e colete verde; só andar, carregar e parado
    const serv = o.role === 'servente' && !suit && !o.boss && (anim === 'walk' || anim === 'idle');
    const set = serv ? 'servente' : suit ? 'espacial' : o.boss ? 'mestre' : 'boneco'; // nas eras altas o mestre também usa traje (parado, de olho na obra)
    const key = o.boss ? (suit ? 'idle' : anim === 'walk' ? 'walk' : 'boss') : anim === 'walk' && o.carry ? 'carry' : anim;
    const capa = FLAGS.risco && !suit && chovendo() && SHEETS[key] ? art(set + '-capa/' + SHEETS[key][0]) : null; // chuva forte: capa amarela
    const sh = SHEETS[key], img = sh && (capa || art(set + '/' + sh[0]) || (serv && art('boneco/' + sh[0])));
    if (img) {
      const m = sh[1], f = ((Math.floor((cyc % 1 + 1) % 1 * m)) + m) % m;
      // raio (modo com risco): os pedreiros do topo piscam entre o normal e o corpo preto com o esqueleto aparecendo
      if (FLAGS.risco && V.choque > 0 && !serv && !o.boss && Math.floor(V.choque * 14) % 2) { blitCell(silhueta(img), f, x, y, !!o.flip); esqueleto(x, y, anim === 'sit', !!o.flip); return; }
      // carregar: a caixa magenta do desenho vira a cor do material da era (mesma cor dos blocos da construção)
      blitCell(sh[0] === 'carregar' && o.carry ? tinted(img, o.carry, img.src || set) : img, f, x, y, !!o.flip);
      return;
    }
  }
  // Treinamento e Ferramenta aparecem no equipamento de todos os operários (gear até 6; furadeira até o nível 10)
  const gear = suit ? 0 : Math.min(6, S.lv.treino || 0), tl = anim === 'drill' ? Math.min(10, S.lv.ferram || 0) : 0;
  const spr = workerSprite(anim, frame, { skin, suit, pack: suit && (o.pack ?? era >= 5), boss: !!o.boss, carry: o.carry || '', gear, tl });
  blit(spr, x, y, RIG_AX, RIG_AY, !!o.flip);
}
