import { S, load, save, resetState, saveKey } from './sim/state.js';
import { sim } from './sim/economy.js';
import { migrate } from './sim/migrate.js';
import { runOffline } from './sim/offline.js';
import { V, resetView } from './render/view.js';
import { cam, snapCamera } from './render/camera.js';
import { updateView, render, resetMilestones } from './render/scene.js';
import { H, setW } from './data/constants.js';
import { ctxMain } from './render/canvas.js';
import { updateUI, setNotice } from './ui/panel.js';
import { fmt } from './ui/format.js';
import { closeMap, initMap } from './ui/talentMap.js';
import { $ } from './ui/dom.js';
import { initSkills, tickSkills, skillsOpen, closeSkills } from './ui/skills.js';
import { FLAGS } from './data/flags.js';
import { syncCameraButtons } from './ui/cameraControls.js';
import { syncEvents, recent } from './render/events.js';
import { initEffects } from './render/effects.js';
import { soundOn, setSound } from './ui/audio.js';
import { initIntro, introActive, startIntro } from './ui/intro.js';

// ?reset no endereço: apaga o save deste modo e começa do zero (o parâmetro sai do endereço,
// para recarregar a página não apagar de novo)
{
  const u = new URL(location.href);
  if (u.searchParams.has('reset')) {
    try { localStorage.removeItem(saveKey()); } catch (e) { }
    u.searchParams.delete('reset');
    history.replaceState(null, '', u.pathname + u.search.replace('viva=', 'viva') + u.hash);
  }
}
migrate(load());
if (FLAGS.viva) { S.debt = 0; S.inDefault = false; } // banco saiu do Obra Viva: dívidas antigas perdoadas
// resumo do tempo fora: no modo atual vai para a dica do painel; no Obra Viva, numa faixa sobre a cena
function welcome(msg) {
  if (!msg) return;
  setNotice(msg);
  if (FLAGS.viva) V.toast = { a: 'ENQUANTO VOCÊ ESTEVE FORA', b: msg.replace(/^Enquanto você esteve fora: /, '').toUpperCase(), t: 5 };
}
welcome(runOffline());
syncEvents();   // o que aconteceu fora do jogo vira resumo, não animação
initEffects();

// Modo desenvolvedor: em localhost ou com ?dev no endereço. Para o jogador, nada de barra de teste.
const DEV = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || new URLSearchParams(location.search).has('dev');
// Modo de teste (?test=1): no máximo 30 quadros/s, sem partículas e sem som (economiza CPU nos testes)
const TEST = new URLSearchParams(location.search).get('test') === '1';
let speed = 1;

// ---------- loop ----------
// A simulação usa o tempo real que passou (até SIM_MAX_DT por quadro): com a janela coberta ou o
// navegador economizando quadros, a obra não fica mais lenta. A animação continua limitada a 0,1 s.
const SIM_MAX_DT = 30;
let last = performance.now(), uiT = 0, saveT = 0, noticeT = 12;
function tick(real) {
  const dt = Math.min(.1, real);
  let sd = introActive() ? 0 : Math.min(SIM_MAX_DT, real) * speed; // a obra começa quando a história acaba
  while (sd > 0) { const st = Math.min(.25, sd); sim(st); sd -= st; }
  updateView(dt, speed);
  render();
  if (skillsOpen()) tickSkills(); // prévia animada da tela de Melhorias
  if (FLAGS.viva && !introActive()) S.playTime = (S.playTime || 0) + dt * speed;
  uiT += dt; if (uiT > .2) { uiT = 0; updateUI(); syncCameraButtons(); checkWin(); }
  saveT += dt; if (saveT > 5) { saveT = 0; save(); if (V.t > noticeT) setNotice(null); }
}
function frame(now) {
  if (TEST && now - last < 1000 / 30 - 1) { requestAnimationFrame(frame); return; }
  const real = Math.max(0, (now - last) / 1000); last = now;
  tick(real);
  requestAnimationFrame(frame);
}

// ---------- controles ----------
$('devbar').hidden = !DEV;
const spBtns = document.querySelectorAll('[data-sp]');
spBtns.forEach(b => b.onclick = () => {
  speed = +b.dataset.sp;
  spBtns.forEach(x => x.setAttribute('aria-pressed', x === b));
});

// Recomeçar: dois cliques (o primeiro arma por 3 s). Botão no topo (modo atual) e no rodapé das Melhorias (Obra Viva)
function doReset() { resetState(); setNotice(null); resetView(); resetMilestones(); syncEvents(); syncCameraButtons(); closeMap(); updateUI(); if (FLAGS.viva) { closeSkills(); startIntro(false); } }
for (const rs of [$('reset'), $('skReset')]) {
  const disarm = () => { rs.classList.remove('armed'); rs.textContent = 'Recomeçar'; };
  rs.onclick = () => {
    if (rs.classList.contains('armed')) { disarm(); doReset(); return; }
    rs.classList.add('armed'); rs.textContent = 'Confirmar: apagar tudo';
    setTimeout(disarm, 3000);
  };
}

// Fim de jogo (Obra Viva): na primeira vez que a torre chega à Órbita, faixa na cena e tela de parabéns
function checkWin() {
  if (!FLAGS.viva || !S.won || S.winSeen) return;
  S.winSeen = true; save();
  V.toast = { a: 'ÓRBITA ALCANÇADA', b: 'TORRE CONCLUÍDA', t: 6 };
  const h = Math.floor(S.playTime / 3600), m = Math.floor(S.playTime % 3600 / 60);
  $('winStats').innerHTML = `<span>Tempo de obra</span><b>${h} h ${String(m).padStart(2, '0')} min</b>`
    + `<span>Peças construídas</span><b>${fmt(Math.floor(S.floors))}</b><span>Andares alugados</span><b>${fmt(S.rented)}</b>`;
  $('win').hidden = false;
}
$('winGo').onclick = () => { $('win').hidden = true; };
$('winNew').onclick = () => { $('win').hidden = true; doReset(); };

initMap(updateUI);

// Modo: Obra Viva é o padrão (tela limpa + Melhorias); ?classico abre o modo antigo. Saves separados.
document.body.classList.toggle('modo-novo', FLAGS.viva);
{
  const u = new URL(location.href);
  u.searchParams.delete('viva');
  if (FLAGS.viva) u.searchParams.set('classico', ''); else u.searchParams.delete('classico');
  const href = u.href.replace('classico=', 'classico');
  $('modeLink').innerHTML = FLAGS.viva ? '' : `Modo clássico · <a href="${href}">ir para o jogo novo</a>`;
  $('skMode').innerHTML = `<a href="${href}">Modo clássico (progresso antigo)</a>`;
}
if (FLAGS.viva) {
  for (const id of ['hPlateFloor', 'hPlateMoney', 'openUp']) $(id).hidden = false; // o resumo (hSum) aparece no 1º andar
  $('z-all').textContent = '⤢'; $('z-all').setAttribute('aria-label', 'Ver a torre inteira');
  initSkills();
  // abertura com a história (partida nova); não roda nos testes automáticos (?test=1 ou navegador controlado)
  initIntro({ test: TEST || navigator.webdriver });
  $('skStory').onclick = () => { closeSkills(); startIntro(true); };
}

// som da obra: lembrado neste navegador (botão sobre a cena no modo atual; no rodapé das Melhorias no Obra Viva)
const sndBtns = [$('snd'), $('skSnd')];
const syncSnd = () => sndBtns.forEach(b => { b.setAttribute('aria-pressed', soundOn()); b.textContent = soundOn() ? 'Som' : 'Mudo'; });
sndBtns.forEach(b => b.onclick = () => { setSound(!soundOn()); syncSnd(); });
syncSnd();

addEventListener('beforeunload', save);
// Aba escondida: salva. Ao voltar, o tempo fora vira progresso (mesmas regras do offline,
// com resumo) e as animações retomam do estado atual, sem repetir o que passou.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { save(); return; }
  const msg = runOffline();
  if (msg) { welcome(msg); noticeT = V.t + 12; }
  syncEvents(); snapCamera();
  last = performance.now();
});

// O canvas acompanha o espaço da tela: altura de arte fixa (480), largura proporcional.
const cvEl = $('cv'), viewEl = $('view');
function fitCanvas() {
  const w = cvEl.clientWidth, h = cvEl.clientHeight;
  if (w < 10 || h < 10) return;
  const nw = Math.max(300, Math.min(960, Math.round(H * w / h)));
  if (nw !== cvEl.width) { cvEl.width = nw; setW(nw); ctxMain.imageSmoothingEnabled = false; render(); }
}
new ResizeObserver(fitCanvas).observe(viewEl);
fitCanvas();

updateUI();
requestAnimationFrame(frame);

// grava o canvas ampliado 2× em .shots/<nome>.png (só com o servidor de desenvolvimento)
function shot(name = 'shot') {
  const src = document.getElementById('cv'), c = document.createElement('canvas');
  c.width = src.width * 2; c.height = src.height * 2;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(src, 0, 0, c.width, c.height);
  return fetch('/__shot?name=' + encodeURIComponent(name), { method: 'POST', body: c.toDataURL('image/png') }).then(r => r.status);
}

// acesso pelo console para testes (só no modo desenvolvedor)
// step(seg, fps): avança o jogo quadro a quadro sem depender do navegador (testes automáticos)
if (DEV || TEST) window.torre = {
  get S() { return S; }, V, cam, snap: snapCamera, shot, events: recent,
  draw: (n = 1) => { for (let i = 0; i < n; i++) { updateView(0.05, 1); render(); } },
  step: (sec, fps = 30) => { for (let i = 0; i < sec * fps; i++) tick(1 / fps); },
};
