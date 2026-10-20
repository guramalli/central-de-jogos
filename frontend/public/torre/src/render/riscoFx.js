// Protótipo com risco: efeitos por cima da cena já desenhada — a torre balança no vento (as linhas da faixa da torre
// são deslocadas, mais no alto), treme no terremoto, racha com a integridade baixa, recebe chuva/neve/areia e desaba.
import { W, H, FH, TW, TL } from '../data/constants.js';
import { ctxMain } from './canvas.js';
import { cam, sx, sy } from './camera.js';
import { S } from '../sim/state.js';

const buf = document.createElement('canvas'), bctx = buf.getContext('2d');
const drops = Array.from({ length: 140 }, () => ({ x: Math.random(), y: Math.random(), v: 0.6 + Math.random() * 0.8 }));

// o: { lean (px no topo), shake (px), dano 0..1, clima: 'chuva'|'nevasca'|'areia'|null, f0 (andares para a altura do tombo), t, dt }
export function towerFx(o) {
  const g = sy(0), fl = o.f0 ?? Math.floor(S.floors), span = Math.max(40, g - sy((fl + 1) * FH));
  // rachaduras na fachada
  const n = Math.floor((o.dano || 0) * 16);
  for (let i = 0; i < n; i++) {
    const f = Math.floor(((i * 7919) % 97) / 97 * Math.max(1, Math.floor(S.floors))), x0 = TL + 20 + ((i * 131) % 200);
    ctxMain.strokeStyle = 'rgba(30,20,20,.75)'; ctxMain.lineWidth = Math.max(1, cam.z * 2); ctxMain.beginPath();
    let x = sx(x0), y = sy(f * FH + 70); ctxMain.moveTo(x, y);
    for (let k = 0; k < 4; k++) { x += ((i + k) % 2 ? 1 : -1) * 10 * cam.z; y += 18 * cam.z; ctxMain.lineTo(x, y); }
    ctxMain.stroke();
  }
  // chuva, neve ou areia (na tela inteira)
  if (o.clima) {
    if (o.clima === 'areia') { ctxMain.fillStyle = 'rgba(214,170,100,.28)'; ctxMain.fillRect(0, 0, W, H); }
    if (o.clima === 'nevasca') { ctxMain.fillStyle = 'rgba(235,240,255,.18)'; ctxMain.fillRect(0, 0, W, H); }
    for (const d of drops) {
      d.y += o.dt * d.v * (o.clima === 'chuva' ? 1.6 : 0.35); d.x += o.dt * (o.clima === 'areia' ? 0.5 : o.clima === 'chuva' ? 0.15 : 0.08) * d.v;
      if (d.y > 1) d.y -= 1; if (d.x > 1) d.x -= 1;
      const x = d.x * W, y = d.y * H;
      if (o.clima === 'chuva') { ctxMain.fillStyle = 'rgba(190,210,255,.55)'; ctxMain.fillRect(x, y, 1, 7); }
      else if (o.clima === 'nevasca') { ctxMain.fillStyle = 'rgba(255,255,255,.9)'; ctxMain.fillRect(x, y, 2, 2); }
      else { ctxMain.fillStyle = 'rgba(160,120,60,.7)'; ctxMain.fillRect(x, y, 2, 1); }
    }
  }
  const lean = o.lean || 0, shake = o.shake || 0;
  if (!lean && !shake) return;
  buf.width = W; buf.height = H; bctx.drawImage(ctxMain.canvas, 0, 0);
  if (shake) {
    const jx = (Math.random() * 2 - 1) * shake, jy = (Math.random() * 2 - 1) * shake * 0.3;
    ctxMain.fillStyle = '#1b1622'; ctxMain.fillRect(0, 0, W, H); ctxMain.drawImage(buf, jx, jy); bctx.drawImage(ctxMain.canvas, 0, 0);
  }
  // só a faixa da torre entorta: o fundo da faixa é refeito com a coluna de céu ao lado e a torre é desenhada deslocada
  const x0 = Math.max(1, Math.floor(sx(TL - 60))), bw = Math.min(W - x0, Math.ceil(sx(TL + TW + 120)) - x0);
  if (lean && bw > 0) for (let y = 0; y < Math.min(H, g); y += 2) {
    const h = Math.max(0, Math.min(1.3, (g - y) / span)), dx = Math.round(lean * h * h);
    if (!dx) continue;
    ctxMain.drawImage(buf, x0 - 1, y, 1, 2, x0, y, bw, 2);
    ctxMain.drawImage(buf, x0, y, bw, 2, x0 + dx, y, bw, 2);
  }
}
export const fxSpan = () => { const g = sy(0); return Math.max(40, g - sy((Math.floor(S.floors) + 1) * FH)); };
