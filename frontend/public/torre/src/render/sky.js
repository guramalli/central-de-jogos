// Céu: gradiente pela altitude de cada faixa da tela (funciona em qualquer zoom),
// estrelas, curvatura da Terra e satélite em coordenadas de tela; nuvens, avião e balão no mundo.
import { W, H, FH, MPF } from '../data/constants.js';
import { altOf, floorOf, mpfAt } from '../data/height.js';
import { SKY } from '../data/eras.js';
import { ctx, r, R, hash, clamp, mix, mixRGB } from './canvas.js';
import { cam, worldY } from './camera.js';
import { V } from './view.js';
import { blit } from './sprites.js';
import { cloudSprite, planeSprite, balloonSprite } from './props.js';
import { cfg } from '../ui/config.js';
import { art } from './assets.js';
import { city } from '../sim/prestige.js';
import { drawEarth, prepEarth } from './earth.js';
import { moonEarth } from './moon.js';

// altura (m) na linha da tela; na Base Lunar o céu já começa no espaço (skyAlt da cidade)
const altAt = screenY => Math.max(0, altOf(worldY(screenY) / FH)) + (city().scene.skyAlt || 0);
const yOfAlt = m => floorOf(m) * FH;                                  // y de mundo de uma altura

const CLOUDS = [];
for (let i = 0; i < 110; i++) CLOUDS.push({ m: 300 + i * 140 + hash(i, 1) * 110, x: hash(i, 2) * 2400 - 1200, w: 160 + Math.floor(hash(i, 3) * 260), s: 14 + hash(i, 4) * 30, front: hash(i, 5) < .3 });
const STARS = [];
for (let i = 0; i < 300; i++) STARS.push({ x: Math.floor(hash(i, 7) * 960), y: Math.floor(hash(i, 8) * H), b: hash(i, 9) });

function skyCols(m) {
  for (let i = 0; i < SKY.length - 1; i++) {
    if (m < SKY[i + 1][0]) {
      const t = (m - SKY[i][0]) / (SKY[i + 1][0] - SKY[i][0]);
      return [mix(SKY[i][1], SKY[i + 1][1], t), mix(SKY[i][2], SKY[i + 1][2], t)];
    }
  }
  const l = SKY[SKY.length - 1];
  return [mix(l[1], l[1], 0), mix(l[2], l[2], 0)];
}

export function drawSky() {
  const bands = 24;
  for (let i = 0; i < bands; i++) {
    const y0 = Math.floor(i * H / bands), [a, b] = skyCols(altAt(y0 + H / bands / 2));
    ctx.fillStyle = mixRGB(a, b, (i + .5) / bands);
    ctx.fillRect(0, y0, W, Math.ceil(H / bands) + 1);
  }
  const top = altAt(0), bottom = altAt(H);
  const sa = clamp((top - 18000) / 40000, 0, 1);
  if (sa > 0) STARS.forEach((s, i) => {
    if (s.x >= W || altAt(s.y) < 18000 || s.b * sa <= .25) return;
    const tw = (Math.sin(V.t * 2 + i) + 1) / 2;
    r(s.x, s.y, s.b > .85 ? 2 : 1, s.b > .85 ? 2 : 1, `rgba(255,255,255,${(0.4 + tw * .6) * sa})`);
  });
  if (top > 8000 && !city().scene.skyAlt) prepEarth(2); // a textura da Terra fica pronta antes de ela aparecer
  if (bottom > 14000 && !city().scene.skyAlt) { // curvatura da Terra lá embaixo (não na Lua, onde o chão é a própria Lua)
    drawEarth(ctx, W, H, clamp((bottom - 14000) / 1200, 0, 140), V.t, cfg().leve); // render/earth.js
  }
  if (city().scene.moon) moonEarth(W); // a Terra no céu da Lua
  if (top > 140000) { // satélite
    const x = ((V.t * 12) % (W + 80)) - 40, y = 80 + Math.sin(V.t * .3) * 14;
    r(x, y, 6, 4, '#d7d9df'); r(x - 9, y + 1, 8, 2, '#3b6fd1'); r(x + 7, y + 1, 8, 2, '#3b6fd1');
    if (Math.floor(V.t * 2) % 2) r(x + 2, y - 2, 2, 2, '#ff4d4d');
  }
}

// nuvem: cúmulo em pixel art (sprite com 4 tons); de longe vira uma faixa
function cloud(x, y, w, alpha) {
  ctx.globalAlpha = alpha;
  if (w * cam.z < 14) R(x, y, w, w * .2, '#f3f7fb');
  else { const c = art('nuvem-' + (Math.floor(w) % 4)) || cloudSprite(w); blit(c, x, y, 0, c.height); } // nuvens do PixelLab (4 formas)
  ctx.globalAlpha = 1;
}

// todas as nuvens passam por trás da torre (pedido do usuário): a chamada da frente não desenha nada
export function drawClouds(front) {
  if (front || city().scene.noClouds) return; // sem nuvens, avião nem balão na Lua
  const lo = worldY(H) - 600, hi = worldY(0) + 200;
  const leve = cfg().leve;
  CLOUDS.forEach((c, k) => {
    if (leve && k % 2) return; // gráficos leves: metade das nuvens
    const y = yOfAlt(c.m); if (y < lo || y > hi) return;
    const x = ((c.x + V.t * c.s) % 2800 + 2800) % 2800 - 1400;
    cloud(x, y, c.w, 1);
  });
  // avião na faixa de cruzeiro (~10,5 km)
  const py = yOfAlt(10500);
  if (py > lo && py < hi) {
    const x = ((V.t * 220) % 3600) - 1800;
    const pl = art('aviao'); if (pl) blit(pl, x, py, 4, pl.height - 4); else blit(planeSprite(), x, py, 4, 56);
  }
  // balão meteorológico (~30 km)
  const by = yOfAlt(30000);
  if (by > lo && by < hi) {
    const x = -260 + Math.sin(V.t * .4) * 60;
    const bl = art('balao'); if (bl) blit(bl, x, by - 64, bl.width / 2, bl.height - 4); else blit(balloonSprite(), x, by - 64, 32, 136);
  }
}
