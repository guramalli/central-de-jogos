// Colapso (protótipo descartável): a cena do Torre Infinita com uma run de cartas e ameaças por cima.
// A simulação econômica não roda: este arquivo controla S.floors e os níveis só para a cena desenhar a obra.
import { S, resetState } from '../sim/state.js';
import { V, resetView } from '../render/view.js';
import { cam, sx, sy, zoomBy, zoomAt, followBuild, toggleOverview } from '../render/camera.js';
import { updateView, render, resetMilestones } from '../render/scene.js';
import { W, H, FH, TW, TL, setW } from '../data/constants.js';
import { ctxMain } from '../render/canvas.js';
import { syncEvents } from '../render/events.js';
import { initEffects } from '../render/effects.js';
import { preloadArt } from '../render/assets.js';
import { dust } from '../render/particles.js';
import { eraAt, ERA_STYLE } from '../data/eras.js';
import { altOf } from '../data/height.js';
import { CITIES } from '../data/cities.js';
import { unlock } from '../ui/audio.js';
import * as G from './run.js';
import { CARDS } from './cards.js';

preloadArt(); initEffects();
const $ = id => document.getElementById(id);
const BEST = 'torre-colapso-recorde';
const best = () => { try { return Number(localStorage.getItem(BEST)) || 0; } catch (e) { return 0; } };
let R = null, phase = 'menu', fall = null, cityIdx = 0, zoomed = false;

// ---------- sons próprios (vento em loop e o ronco do terremoto) ----------
const snd = n => { const a = new Audio(`assets/sons/${n}.mp3`); a.preload = 'auto'; return a; };
const sVento = snd('amb-vento'), sSismo = snd('motor'), sQueda = snd('betoneira'), sCarta = snd('proposta');
sVento.loop = true;
const play = (a, vol = 1, rate = 1) => { try { a.volume = vol; a.playbackRate = rate; a.preservesPitch = false; a.currentTime = 0; a.play(); } catch (e) { } };

// ---------- estado da cena ----------
function setupScene() {
  resetState(); // em memória (as gravações do jogo principal estão bloqueadas nesta página)
  cityIdx = Math.floor(Math.random() * 4); // Praia Grande, Rio, Dubai ou Ártico: só a paisagem muda
  Object.assign(S, { cidade: cityIdx, roundOver: true, introSeen: true, top: 40, ground: 40, floors: 0, maxAlt: 0, era: 0, assigned: 0 });
  Object.assign(S.lv, { fundacao: 40, pedreiro: 3, fornec: 2, elevador: 1, motor: 2, cacamba: 2, guindaste: 1, caminhao: 1 });
  resetView(); resetMilestones(); syncEvents(); followBuild(); zoomed = false;
}
// a obra no topo anda conforme a run; os níveis sobem com as cartas de velocidade (mais operários na cena)
function syncScene() {
  S.floors = R.f; S.maxAlt = altOf(R.f); S.era = eraAt(S.maxAlt); S.assigned = Math.floor(R.f);
  const sp = Math.min(3, R.m.speed);
  S.lv.pedreiro = Math.round(3 + 3 * (sp - 1)); S.lv.guindaste = 1 + R.cards.filter(c => c === 'guindaste').length;
  if (!zoomed && R.f > 7) { zoomed = true; zoomBy(0.5); } // com a torre mais alta, afasta para ver o balanço
}

// ---------- telas ----------
function start() {
  unlock(); setupScene();
  R = G.newRun(Date.now()); phase = 'run'; fall = null;
  $('menu').hidden = true; $('over').hidden = true; $('hud').hidden = false;
  $('hCity').textContent = CITIES[cityIdx].n;
}
$('btStart').onclick = start; $('btAgain').onclick = start;
$('menuBest').textContent = best() ? `Recorde: ${best()} m` : '';

function showOffer() {
  const box = $('cards'); box.innerHTML = ''; box.hidden = false;
  const ty = R.threat && R.threat.type;
  $('offerHint').innerHTML = `Próxima ameaça: <b>${ty === 'vento' ? 'Ventania' : 'Terremoto'}</b> · integridade ${Math.ceil(R.hp)}/${R.hpMax}`;
  R.offer.forEach((id, i) => {
    const c = CARDS[id], b = document.createElement('button');
    b.className = 'card';
    b.innerHTML = `<img src="assets/icones/${c.icon}.png" alt=""><h3>${c.n}</h3>` +
      c.bom.map(x => `<p class="bom">${x}</p>`).join('') + c.ruim.map(x => `<p class="ruim">${x}</p>`).join('');
    b.onclick = () => { G.choose(R, i); box.hidden = true; $('offer').hidden = true; play(sCarta, .5); };
    box.appendChild(b);
  });
  $('offer').hidden = false;
}

function hud() {
  $('hAlt').textContent = `${G.altM(R)} m`;
  $('hFloors').textContent = `${Math.floor(R.f)} andares`;
  const p = Math.max(0, R.hp / R.hpMax);
  $('hpFill').style.width = `${p * 100}%`;
  $('hpFill').style.background = p > .5 ? '#6fd08c' : p > .25 ? '#f2b630' : '#e8553f';
  $('hpTxt').textContent = `INTEGRIDADE ${Math.ceil(R.hp)} / ${R.hpMax}`;
  const th = $('threat');
  if (R.active) {
    th.className = 'threat now'; th.innerHTML = `${R.active.type === 'vento' ? '🌪️ VENTANIA' : '🌋 TERREMOTO'} <b>−${R.active.dmg}</b>`;
  } else if (G.warning(R)) {
    const dmg = G.force(R, R.threat.type), fatal = dmg >= R.hp && !R.m.seguro;
    th.className = 'threat' + (fatal ? ' fatal' : '');
    th.innerHTML = `${R.threat.type === 'vento' ? '🌬️ Ventania' : '⚠️ Terremoto'} em ${Math.ceil(G.warnIn(R))} s · dano ~${dmg}${fatal ? ' · <b>DERRUBA A TORRE</b>' : ''}`;
  } else th.className = 'threat off';
  $('deck').innerHTML = R.cards.map(id => `<img src="assets/icones/${CARDS[id].icon}.png" title="${CARDS[id].n}" alt="${CARDS[id].n}">`).join('');
}

function gameOver() {
  const alt = G.altM(R), rec = best();
  if (alt > rec) try { localStorage.setItem(BEST, String(alt)); } catch (e) { }
  $('oAlt').textContent = `${alt} m`;
  $('oInfo').textContent = `${Math.floor(R.f)} andares · ${R.hits} ameaças aguentadas · ${Math.floor(R.t / 60)}min${String(Math.floor(R.t % 60)).padStart(2, '0')}s · ${R.cards.length} cartas`;
  $('oRec').textContent = alt > rec ? 'NOVO RECORDE!' : `Recorde: ${rec} m`;
  $('over').hidden = false; $('hud').hidden = true;
  $('menuBest').textContent = `Recorde: ${Math.max(alt, rec)} m`;
}

// ---------- efeitos por cima da cena: balanço, tremor, rachaduras, desabamento ----------
const buf = document.createElement('canvas'), bctx = buf.getContext('2d');
let lastHp = 100;
function overlay(t) {
  const g = sy(0), top = sy(((fall ? fall.f0 : Math.floor(S.floors)) + 1) * FH), span = Math.max(40, g - top);
  let lean = 0, shake = 0;
  if (R) {
    const a = R.active;
    if (a && a.type === 'vento') lean = (8 + 90 * Math.min(1, a.power)) * Math.sin(t * 2 * Math.PI * 0.9) * Math.min(1, a.left / 1.2);
    else if (G.warning(R) && R.threat.type === 'vento') lean = 3 * Math.sin(t * 5);
    if (a && a.type === 'sismo') shake = (3 + 22 * Math.min(1, a.power)) * Math.min(1, a.left / 1.2);
    else if (G.warning(R) && R.threat.type === 'sismo' && G.warnIn(R) < 3) shake = 1.2;
  }
  if (fall) { lean = fall.dir * span * 0.8 * Math.min(1, Math.pow(fall.t / 2, 2)); shake = Math.max(shake, 8 * Math.max(0, 1 - fall.t / 3)); } // tomba até ~40° enquanto desmancha
  // rachaduras na fachada quando a integridade cai
  if (R && (phase === 'run' || phase === 'fall')) {
    const dmg = 1 - R.hp / R.hpMax, n = Math.floor(dmg * 14);
    for (let i = 0; i < n; i++) {
      const fl = Math.floor(((i * 7919) % 97) / 97 * Math.max(1, Math.floor(S.floors))), x0 = TL + 20 + ((i * 131) % 200);
      ctxMain.strokeStyle = 'rgba(30,20,20,.75)'; ctxMain.lineWidth = Math.max(1, cam.z * 2); ctxMain.beginPath();
      let x = sx(x0), y = sy(fl * FH + 70); ctxMain.moveTo(x, y);
      for (let k = 0; k < 4; k++) { x += ((i + k) % 2 ? 1 : -1) * 5 * cam.z * 2; y += 9 * cam.z * 2; ctxMain.lineTo(x, y); }
      ctxMain.stroke();
    }
  }
  if (!lean && !shake) return;
  buf.width = W; buf.height = H; bctx.drawImage(ctxMain.canvas, 0, 0);
  const jx = shake ? (Math.random() * 2 - 1) * shake : 0, jy = shake ? (Math.random() * 2 - 1) * shake * 0.3 : 0;
  if (shake) { ctxMain.fillStyle = '#1b1622'; ctxMain.fillRect(0, 0, W, H); ctxMain.drawImage(buf, jx, jy); bctx.drawImage(ctxMain.canvas, 0, 0); }
  // só a faixa da torre entorta: o fundo da faixa é refeito com a coluna de céu ao lado e a torre é desenhada deslocada
  const x0 = Math.max(1, Math.floor(sx(TL - 60))), bw = Math.min(W - x0, Math.ceil(sx(TL + TW + 120)) - x0);
  if (lean && bw > 0) for (let y = 0; y < Math.min(H, g); y += 2) {
    const h = Math.max(0, Math.min(1.3, (g - y) / span)), dx = Math.round(lean * h * h);
    if (!dx) continue;
    ctxMain.drawImage(buf, x0 - 1, y, 1, 2, x0, y, bw, 2);
    ctxMain.drawImage(buf, x0, y, bw, 2, x0 + dx, y, bw, 2);
  }
}

// ---------- laço ----------
let last = performance.now();
function frame(now) {
  const real = Math.min(0.1, (now - last) / 1000); last = now;
  if (phase === 'run' && R) {
    if (!R.offer && !R.dead) {
      const wasActive = R.active;
      G.step(R, real);
      if (R.active && !wasActive) { // a ameaça chegou
        if (R.active.type === 'vento') play(sVento, .9); else { play(sSismo, 1, .55); for (let i = 0; i < 10; i++) dust(TL + Math.random() * TW, 4, '#b9a98c', 3, 1.4); }
        const d = $('dmg'); d.textContent = `−${R.active.dmg}`; d.classList.remove('pop'); void d.offsetWidth; d.classList.add('pop');
      }
      if (!R.active && !sVento.paused) sVento.pause();
      if (R.dead) { fall = { t: 0, dir: Math.random() < .5 ? -1 : 1, f0: R.f }; phase = 'fall'; play(sQueda, 1, .7); sVento.pause(); }
    }
    if (R.offer && $('offer').hidden) showOffer();
    syncScene(); hud();
  } else if (phase === 'fall') {
    fall.t += real;
    // a torre tomba e os andares de cima despencam
    S.floors = Math.max(0, fall.f0 * (1 - Math.min(1, Math.pow(Math.max(0, fall.t - 0.6) / 2.8, 1.6)))); // depois de inclinar, os andares despencam de cima para baixo
    if (Math.random() < .6) { const y = Math.floor(S.floors) * FH; for (let i = 0; i < 4; i++) dust(TL + Math.random() * TW, y, i % 2 ? '#8a7f70' : '#d8cdb8', 4, 2); }
    if (fall.t > 3.6) { phase = 'over'; fall = null; gameOver(); }
    if (fall && !fall.cam) { fall.cam = true; zoomBy(0.01); } // afasta para ver a torre inteira caindo
  }
  resetMilestones(); V.lastEra = S.era; // sem faixas de marco e de era (cobriam o painel)
  updateView(real, 1);
  for (const f of V.floats) if (f.b && /R\$/.test(f.b)) f.b = ''; // sem dinheiro neste jogo
  render();
  overlay(V.t);
  requestAnimationFrame(frame);
}

// canvas acompanha o espaço (altura de arte fixa)
const cvEl = $('cv');
function fitCanvas() {
  const w = cvEl.clientWidth, h = cvEl.clientHeight; if (w < 10 || h < 10) return;
  const nw = Math.max(300, Math.min(960, Math.round(H * w / h)));
  if (nw !== cvEl.width) { cvEl.width = nw; setW(nw); ctxMain.imageSmoothingEnabled = false; }
}
new ResizeObserver(fitCanvas).observe(cvEl); fitCanvas();
cvEl.addEventListener('wheel', e => { e.preventDefault(); const r = cvEl.getBoundingClientRect(); zoomAt((e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height, Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
setupScene();
requestAnimationFrame(frame);
// para testes no console
window.colapso = { get R() { return R; }, start, G };
