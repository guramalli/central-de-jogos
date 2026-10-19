// Controles da câmera: arrastar para mover, roda do mouse ou pinça para zoom no ponto
// apontado, e os botões sobre o canvas.
import { W, H } from '../data/constants.js';
import { zoomAt, zoomBy, panBy, toggleOverview, followBuild, isOverview, isFree } from '../render/camera.js';
import { $ } from './dom.js';

const cv = $('cv'), allBtn = $('z-all'), followBtn = $('z-follow');

export function syncCameraButtons() {
  allBtn.setAttribute('aria-pressed', isOverview());
  followBtn.hidden = !isFree();
}

$('z-in').onclick = () => { zoomBy(1.4); syncCameraButtons(); };
$('z-out').onclick = () => { zoomBy(1 / 1.4); syncCameraButtons(); };
allBtn.onclick = () => { toggleOverview(); syncCameraButtons(); };
followBtn.onclick = () => { followBuild(); syncCameraButtons(); };

// posição do ponteiro em pixels do canvas (o CSS amplia o canvas; descontando a borda)
function toCanvas(clientX, clientY) {
  const r = cv.getBoundingClientRect();
  return [(clientX - r.left - cv.clientLeft) * W / cv.clientWidth, (clientY - r.top - cv.clientTop) * H / cv.clientHeight];
}

cv.addEventListener('wheel', e => {
  e.preventDefault();
  const [x, y] = toCanvas(e.clientX, e.clientY);
  zoomAt(x, y, Math.exp(-e.deltaY * 0.0015));
  syncCameraButtons();
}, { passive: false });

// arrastar (1 dedo/mouse) e pinça (2 dedos)
const ptrs = new Map();
let pinch = null, moved = 0;
const mid = () => { const [a, b] = [...ptrs.values()]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) }; };

cv.addEventListener('pointerdown', e => {
  cv.setPointerCapture(e.pointerId);
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 1) moved = 0;
  if (ptrs.size === 2) pinch = mid();
});
cv.addEventListener('pointermove', e => {
  const p = ptrs.get(e.pointerId); if (!p) return;
  const k = W / cv.clientWidth;
  if (ptrs.size === 1) {
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    moved += Math.abs(dx) + Math.abs(dy);
    if (moved > 4) { cv.classList.add('drag'); panBy(dx * k, dy * k); syncCameraButtons(); }
  }
  p.x = e.clientX; p.y = e.clientY;
  if (ptrs.size === 2 && pinch) {
    const m = mid(), [x, y] = toCanvas(m.x, m.y);
    panBy((m.x - pinch.x) * k, (m.y - pinch.y) * k);
    if (pinch.d > 0) zoomAt(x, y, m.d / pinch.d);
    pinch = m; syncCameraButtons();
  }
});
const up = e => {
  ptrs.delete(e.pointerId);
  if (ptrs.size < 2) pinch = null;
  if (!ptrs.size) cv.classList.remove('drag');
};
cv.addEventListener('pointerup', up);
cv.addEventListener('pointercancel', up);
// dois cliques: volta a seguir a obra
cv.addEventListener('dblclick', () => { followBuild(); syncCameraButtons(); });
