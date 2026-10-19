// Céu: gradiente pela altitude de cada faixa da tela (funciona em qualquer zoom),
// estrelas, curvatura da Terra e satélite em coordenadas de tela; nuvens, avião e balão no mundo.
import { W, H, FH, MPF } from '../data/constants.js';
import { SKY } from '../data/eras.js';
import { ctx, r, R, hash, clamp, mix, mixRGB } from './canvas.js';
import { cam, worldY } from './camera.js';
import { V } from './view.js';

const M2Y = FH / MPF; // pixels de mundo por metro
const altAt = screenY => Math.max(0, worldY(screenY) / M2Y);

const CLOUDS = [];
for (let i = 0; i < 110; i++) CLOUDS.push({ m: 300 + i * 140 + hash(i, 1) * 110, x: hash(i, 2) * 2400 - 1200, w: 160 + Math.floor(hash(i, 3) * 260), s: 14 + hash(i, 4) * 30, front: hash(i, 5) < .3 });
const STARS = [];
for (let i = 0; i < 120; i++) STARS.push({ x: Math.floor(hash(i, 7) * W), y: Math.floor(hash(i, 8) * H), b: hash(i, 9) });

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
    if (altAt(s.y) < 18000 || s.b * sa <= .25) return;
    const tw = (Math.sin(V.t * 2 + i) + 1) / 2;
    r(s.x, s.y, s.b > .85 ? 2 : 1, s.b > .85 ? 2 : 1, `rgba(255,255,255,${(0.4 + tw * .6) * sa})`);
  });
  if (bottom > 14000) { // curvatura da Terra lá embaixo
    const k = clamp((bottom - 14000) / 1200, 0, 140), Rr = 1100, cy = H + Rr - k;
    ctx.fillStyle = 'rgba(120,190,255,.35)'; ctx.beginPath(); ctx.arc(W / 2, cy, Rr + 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2a63a8'; ctx.beginPath(); ctx.arc(W / 2, cy, Rr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3f7d4a';
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(40 + i * 60 + hash(i, 11) * 30, cy - Rr + 12 + hash(i, 12) * 30, 20 + hash(i, 13) * 20, 6, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    for (let i = 0; i < 8; i++) { const x = ((i * 53 + V.t * 4) % 420) - 30; ctx.fillRect(Math.round(x), Math.round(cy - Rr + 6 + hash(i, 14) * 18), 18, 3); }
  }
  if (top > 140000) { // satélite
    const x = ((V.t * 12) % 440) - 40, y = 80 + Math.sin(V.t * .3) * 14;
    r(x, y, 6, 4, '#d7d9df'); r(x - 9, y + 1, 8, 2, '#3b6fd1'); r(x + 7, y + 1, 8, 2, '#3b6fd1');
    if (Math.floor(V.t * 2) % 2) r(x + 2, y - 2, 2, 2, '#ff4d4d');
  }
}

// nuvem: três "bolhas" feitas de faixas horizontais
function cloud(x, y, w, alpha) {
  if (w * cam.z < 14) { ctx.globalAlpha = alpha; R(x, y, w, w * .2, '#f3f7fb'); ctx.globalAlpha = 1; return; }
  ctx.globalAlpha = alpha;
  const puffs = [[.25, .22], [.5, .3], [.75, .2]];
  for (const [fx, fr] of puffs) {
    const cx = x + w * fx, rad = w * fr;
    for (let dy = -rad; dy < rad; dy += 6) {
      if (dy < -rad * .35) continue; // base achatada
      const hw = Math.sqrt(Math.max(0, rad * rad - dy * dy));
      R(cx - hw, y + rad * .35 + dy, hw * 2, 6, dy < -rad * .1 ? '#d6e2ee' : '#ffffff');
    }
  }
  ctx.globalAlpha = 1;
}

export function drawClouds(front) {
  const lo = worldY(H) - 600, hi = worldY(0) + 200;
  CLOUDS.forEach(c => {
    if (c.front !== front) return;
    const y = c.m * M2Y; if (y < lo || y > hi) return;
    const x = ((c.x + V.t * c.s) % 2800 + 2800) % 2800 - 1400;
    cloud(x, y, c.w, front ? .7 : 1);
  });
  if (front) return;
  // avião na faixa de cruzeiro (~10,5 km)
  const py = 10500 * M2Y;
  if (py > lo && py < hi) {
    const x = ((V.t * 220) % 3600) - 1800;
    R(x, py, 150, 26, '#e9edf2'); R(x + 120, py + 26, 26, 30, '#e9edf2'); R(x + 40, py - 10, 60, 10, '#c3c9d2'); R(x + 50, py - 28, 30, 18, '#c3c9d2');
    for (let k = 0; k < 9; k++) R(x + 20 + k * 12, py + 14, 6, 6, '#3a6fd1');
    R(x, py, 150, 3, '#c3c9d2');
  }
  // balão meteorológico (~30 km)
  const by = 30000 * M2Y;
  if (by > lo && by < hi) {
    const x = -260 + Math.sin(V.t * .4) * 60;
    for (let dy = 0; dy < 70; dy += 5) { const t = (dy - 35) / 35, hw = 30 * Math.sqrt(Math.max(0, 1 - t * t)); R(x - hw, by + dy, hw * 2, 5, dy > 45 ? '#ffffff' : '#e8e8e8'); }
    R(x - 1, by - 50, 2, 50, '#999'); R(x - 8, by - 64, 16, 14, '#e05a3c');
  }
}
