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

const altAt = screenY => Math.max(0, altOf(worldY(screenY) / FH)); // altura (m) na linha da tela
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
  if (bottom > 14000) { // curvatura da Terra lá embaixo
    const k = clamp((bottom - 14000) / 1200, 0, 140), Rr = 1100, cy = H + Rr - k;
    ctx.fillStyle = 'rgba(120,190,255,.35)'; ctx.beginPath(); ctx.arc(W / 2, cy, Rr + 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2a63a8'; ctx.beginPath(); ctx.arc(W / 2, cy, Rr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3f7d4a';
    for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.ellipse(40 + i * 60 + hash(i, 11) * 30, cy - Rr + 12 + hash(i, 12) * 30, 20 + hash(i, 13) * 20, 6, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    for (let i = 0; i < 16; i++) { const x = ((i * 53 + V.t * 4) % (W + 60)) - 30; ctx.fillRect(Math.round(x), Math.round(cy - Rr + 6 + hash(i, 14) * 18), 18, 3); }
  }
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
  else { const c = cloudSprite(w); blit(c, x, y, 0, c.height); }
  ctx.globalAlpha = 1;
}

export function drawClouds(front) {
  const lo = worldY(H) - 600, hi = worldY(0) + 200;
  CLOUDS.forEach(c => {
    if (c.front !== front) return;
    const y = yOfAlt(c.m); if (y < lo || y > hi) return;
    const x = ((c.x + V.t * c.s) % 2800 + 2800) % 2800 - 1400;
    cloud(x, y, c.w, front ? .7 : 1);
  });
  if (front) return;
  // avião na faixa de cruzeiro (~10,5 km)
  const py = yOfAlt(10500);
  if (py > lo && py < hi) {
    const x = ((V.t * 220) % 3600) - 1800;
    blit(planeSprite(), x, py, 4, 56);
  }
  // balão meteorológico (~30 km)
  const by = yOfAlt(30000);
  if (by > lo && by < hi) {
    const x = -260 + Math.sin(V.t * .4) * 60;
    blit(balloonSprite(), x, by - 64, 32, 136);
  }
}
