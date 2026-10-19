import { S, load, save, resetState } from './sim/state.js';
import { sim } from './sim/economy.js';
import { migrate } from './sim/migrate.js';
import { runOffline } from './sim/offline.js';
import { V, resetView } from './render/view.js';
import { cam, snapCamera } from './render/camera.js';
import { updateView, render, resetMilestones } from './render/scene.js';
import { renderTabs, renderTree } from './ui/upgrades.js';
import { updateUI, setNotice } from './ui/panel.js';
import { openMap, closeMap, initMap } from './ui/talentMap.js';
import { $ } from './ui/dom.js';
import { syncCameraButtons } from './ui/cameraControls.js';

migrate(load());
setNotice(runOffline());

// Modo desenvolvedor: em localhost ou com ?dev no endereço. Para o jogador, nada de barra de teste.
const DEV = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || new URLSearchParams(location.search).has('dev');
let speed = 1;

// ---------- loop ----------
let last = performance.now(), uiT = 0, saveT = 0;
function frame(now) {
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  let sd = dt * speed;
  while (sd > 0) { const st = Math.min(.25, sd); sim(st); sd -= st; }
  updateView(dt, speed);
  render();
  uiT += dt; if (uiT > .2) { uiT = 0; updateUI(); syncCameraButtons(); }
  saveT += dt; if (saveT > 5) { saveT = 0; save(); if (V.t > 12) setNotice(null); }
  requestAnimationFrame(frame);
}

// ---------- controles ----------
$('devbar').hidden = !DEV;
const spBtns = document.querySelectorAll('[data-sp]');
spBtns.forEach(b => b.onclick = () => {
  speed = +b.dataset.sp;
  spBtns.forEach(x => x.setAttribute('aria-pressed', x === b));
});

const rs = $('reset');
const disarm = () => { rs.classList.remove('armed'); rs.textContent = 'Recomeçar'; };
rs.onclick = () => {
  if (rs.classList.contains('armed')) { resetState(); resetView(); resetMilestones(); syncCameraButtons(); closeMap(); disarm(); renderTree(); updateUI(); return; }
  rs.classList.add('armed'); rs.textContent = 'Clique de novo para apagar tudo';
  setTimeout(disarm, 3000);
};

$('a-open').onclick = openMap;
initMap(updateUI);

addEventListener('beforeunload', save);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });

renderTabs(); renderTree(); updateUI();
requestAnimationFrame(frame);

// grava o canvas ampliado 2× em .shots/<nome>.png (só com o servidor de desenvolvimento)
function shot(name = 'shot') {
  const src = document.getElementById('cv'), c = document.createElement('canvas');
  c.width = src.width * 2; c.height = src.height * 2;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(src, 0, 0, c.width, c.height);
  return fetch('/__shot?name=' + encodeURIComponent(name), { method: 'POST', body: c.toDataURL('image/png') }).then(r => r.status);
}

// acesso pelo console para testes (só no modo desenvolvedor)
if (DEV) window.torre = { get S() { return S; }, V, cam, snap: snapCamera, draw: (n = 1) => { for (let i = 0; i < n; i++) { updateView(0.05, 1); render(); } }, shot };
