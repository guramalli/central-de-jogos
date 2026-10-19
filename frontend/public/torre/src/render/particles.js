// Partículas em coordenadas de mundo (poeira, faíscas)
import { V } from './view.js';
import { R } from './canvas.js';

export function spark(x, y, c, s = 1) {
  V.parts.push({ x, y, vx: (Math.random() - .5) * 120 * s, vy: (Math.random() * 110 + 30) * s, l: .5 + Math.random() * .4, c, sz: 3 * s });
}
export function dust(x, y, c, n, s = 1) { for (let i = 0; i < n; i++) spark(x, y, c, s); }

export function updateParticles(dt) {
  V.parts.forEach(q => { q.x += q.vx * dt; q.y += q.vy * dt; q.vy -= 360 * dt; q.l -= dt; });
  if (V.parts.length > 400) V.parts.splice(0, V.parts.length - 400);
}
export function drawParticles() {
  V.parts = V.parts.filter(q => q.l > 0);
  V.parts.forEach(q => R(q.x, q.y, q.sz, q.sz, q.c));
}
