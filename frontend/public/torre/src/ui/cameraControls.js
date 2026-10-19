// Controles da câmera: botões, roda do mouse e pinça no canvas
import { zoomBy, toggleOverview, isOverview } from '../render/camera.js';
import { $ } from './dom.js';

const cv = $('cv'), allBtn = $('z-all');
const sync = () => allBtn.setAttribute('aria-pressed', isOverview());

$('z-in').onclick = () => { zoomBy(1.4); sync(); };
$('z-out').onclick = () => { zoomBy(1 / 1.4); sync(); };
allBtn.onclick = () => { toggleOverview(); sync(); };

cv.addEventListener('wheel', e => {
  e.preventDefault();
  zoomBy(Math.exp(-e.deltaY * 0.0015)); sync();
}, { passive: false });

// pinça com dois dedos
const ptrs = new Map();
let pinchD = 0;
cv.addEventListener('pointerdown', e => {
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinchD = Math.hypot(a.x - b.x, a.y - b.y); }
});
cv.addEventListener('pointermove', e => {
  const p = ptrs.get(e.pointerId); if (!p) return;
  p.x = e.clientX; p.y = e.clientY;
  if (ptrs.size === 2 && pinchD > 0) {
    const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
    zoomBy(d / pinchD); pinchD = d; sync();
  }
});
const up = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinchD = 0; };
cv.addEventListener('pointerup', up);
cv.addEventListener('pointercancel', up);

// atualizado pelo painel (a visão geral pode ligar sozinha ao afastar tudo)
export const syncCameraButtons = sync;
