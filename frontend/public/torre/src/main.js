import { S, load, save, resetState, saveKey } from './sim/state.js';
import { sim } from './sim/economy.js';
import { migrate } from './sim/migrate.js';
import { runOffline } from './sim/offline.js';
import { V, resetView } from './render/view.js';
import { cam, snapCamera, panBy, followBuild, worldY, isFree } from './render/camera.js';
import { updateView, render, resetMilestones } from './render/scene.js';
import { H, FH, setW } from './data/constants.js';
import { altOf } from './data/height.js';
import { ctxMain } from './render/canvas.js';
import { updateUI, setNotice } from './ui/panel.js';
import { fmt, fmtPct, din } from './ui/format.js';
import { t } from './i18n.js';
import { closeMap, initMap } from './ui/talentMap.js';
import { $ } from './ui/dom.js';
import { initSkills, tickSkills, skillsOpen, closeSkills } from './ui/skills.js';
import { FLAGS } from './data/flags.js';
import { VIVA } from './data/viva.js';
import { syncCameraButtons } from './ui/cameraControls.js';
import { syncEvents, recent } from './render/events.js';
import { initEffects } from './render/effects.js';
import { soundOn, setSound, tickAmbience, soundsLoaded } from './ui/audio.js';
import { initIntro, introActive, startIntro, showNews, clearNews } from './ui/intro.js';
import { city, repPct } from './sim/prestige.js';
import { initCoach, dropTip } from './ui/coach.js';
import { initHome, openHome, closeHome, homeOpen } from './ui/home.js';
import { initTutorial, openTutorial } from './ui/tutorial.js';
import { initJornal, checkJornal, drawArquivo } from './ui/jornal.js';
import { initPip, tickPip } from './ui/pip.js';
import { initStatus, updateStatus } from './ui/status.js';
import { initGear, closeGear, gearOpen, updateGear, frozen, placeHudButtons, setPaused } from './ui/gear.js';
import { initRanking, openRanking, pedirFicha, sairDoRanking, definirApelido, rankTick, esquecerJogador, ultimoApelido } from './ui/ranking.js';
import { initTips, updateTips, setTips, tickTips } from './ui/tips.js';
import { initMilestones } from './ui/milestones.js';
import { initRisco, tickRisco, riscoFx, resetRisco } from './ui/risco.js';
import { preloadArt } from './render/assets.js';
import { migrarRisco, novaTorre, obraParada } from './sim/risco.js';
preloadArt();

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
if (FLAGS.risco) migrarRisco(); // modo com risco: torre única (saves antigos do protótipo também)
if (FLAGS.viva) { S.debt = 0; S.inDefault = false; } // banco saiu do Obra Viva: dívidas antigas perdoadas
// resumo do tempo fora: no modo atual vai para a dica do painel; no Obra Viva, numa faixa sobre a cena
function welcome(msg, corpo) {
  if (!msg) return;
  setNotice(msg);
  if (FLAGS.viva) V.toast = { a: t('ENQUANTO VOCÊ ESTEVE FORA'), b: (corpo ?? msg.replace(/^Enquanto você esteve fora: /, '')).toUpperCase(), t: 5 };
}
welcome(runOffline());
syncEvents();   // o que aconteceu fora do jogo vira resumo, não animação
initEffects();

// Modo desenvolvedor: em localhost ou com ?dev no endereço. Para o jogador, nada de barra de teste.
const DEV = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || new URLSearchParams(location.search).has('dev');
// Modo de teste (?test=1): no máximo 30 quadros/s, sem partículas e sem som (economiza CPU nos testes)
const TEST = new URLSearchParams(location.search).get('test') === '1';
let speed = 1;
let nomeInicio = !(TEST || navigator.webdriver); // Novo jogo pede o nome do ranking (desligado nos testes automáticos)

// ---------- loop ----------
// A simulação usa o tempo real que passou (até SIM_MAX_DT por quadro): com a janela coberta ou o
// navegador economizando quadros, a obra não fica mais lenta. A animação continua limitada a 0,1 s.
const SIM_MAX_DT = 30;
let last = performance.now(), uiT = 0, saveT = 0, noticeT = 12;
function tick(real) {
  const fz = frozen(); // pausa ou engrenagem aberta: nada anda (nem as animações)
  const dt = fz ? 0 : Math.min(.1, real);
  let sd = introActive() || homeOpen() || fz ? 0 : Math.min(SIM_MAX_DT, real) * speed; // a obra começa quando a história acaba
  while (sd > 0) { const st = Math.min(.25, sd); sim(st); sd -= st; }
  updateView(dt, speed);
  render(() => { if (FLAGS.risco && !introActive()) riscoFx(dt, V.t, homeOpen()); }); // torre única: balanço, tremor, clima e desabamento (não durante a abertura), antes das faixas de aviso
  tickPip(Math.min(.1, real), introActive() || homeOpen()); // janelinha com a outra ponta da obra
  if (FLAGS.viva) { // som ambiente: canteiro e mar com o térreo à vista, vento nas eras altas (ui/audio.js)
    const sc = city().scene, alt = altOf(Math.max(0, cam.cy) / FH) + (sc.skyAlt || 0);
    const ground = Math.max(0, Math.min(1, 1 - (worldY(H) - 100) / 600));
    const wind = sc.moon ? 0 : Math.max(0, Math.min(1, (alt - 3000) / 9000)) * Math.max(0, Math.min(1, 1 - (alt - 80000) / 40000));
    tickAmbience({ obra: !obraParada(), ground, sea: !!sc.sea, wind, top: !isFree() && S.floors >= 2, active: !fz && !homeOpen() && !introActive(), dt: Math.min(.1, real) });
  }
  if (skillsOpen()) tickSkills(); // prévia animada da tela de Melhorias
  tickTips(); // o quadro da dica acompanha o alvo
  if (FLAGS.viva && !introActive() && !homeOpen() && !fz) S.playTime = (S.playTime || 0) + dt * speed;
  // a interface segue o tempo real, mesmo pausada
  uiT += Math.min(.1, real); if (uiT > .2) { uiT = 0; updateUI(); syncCameraButtons(); checkWin(); updateTips(); rankTick(homeOpen() || introActive()); checkJornal(homeOpen() || introActive()); if (FLAGS.risco) tickRisco(homeOpen() || introActive() || fz, homeOpen() || introActive()); if (gearOpen()) updateGear(); placeHudButtons(); updateStatus(introActive() || homeOpen()); }
  saveT += dt; if (saveT > 5) { saveT = 0; save(); if (V.t > noticeT) setNotice(null); }
}
function frame(now) {
  if (TEST && now - last < 1000 / 30 - 1) { requestAnimationFrame(frame); return; }
  const real = Math.max(0, (now - last) / 1000); last = now;
  tick(real);
  requestAnimationFrame(frame);
}

// ---------- acelerar o tempo (1×/2×/4×; pedido do usuário) ----------
// A velocidade nunca muda sozinha (decisão do usuário, 21/10/2026: o aviso aparece e a escolha é de quem joga). O ranking
// conta tempo de jogo, então acelerar não dá vantagem.
const VELS = [1, 2, 4];
function setVel(v) { speed = v; const b = $('speedBtn'); if (!b) return; b.textContent = v + '×'; b.classList.toggle('on', v > 1); b.setAttribute('aria-label', t('Velocidade {0}×', v)); }
$('speedBtn').onclick = () => setVel(VELS[(VELS.indexOf(speed) + 1) % VELS.length] || 1);

// ---------- controles ----------
$('devbar').hidden = !DEV;
const spBtns = document.querySelectorAll('[data-sp]');
spBtns.forEach(b => b.onclick = () => {
  speed = +b.dataset.sp;
  spBtns.forEach(x => x.setAttribute('aria-pressed', x === b));
});

// Recomeçar: dois cliques (o primeiro arma por 3 s). Botão no topo (modo atual) e no rodapé das Melhorias (Obra Viva)
function doReset() { dropTip(); if (FLAGS.viva) esquecerJogador(); resetState(); if (FLAGS.risco) resetRisco(); setNotice(null); resetView(); resetMilestones(); syncEvents(); syncCameraButtons(); closeMap(); updateUI(); if (FLAGS.viva) { closeSkills(); startIntro(false); } }
for (const rs of [$('reset'), $('skReset')]) {
  const disarm = () => { rs.classList.remove('armed'); rs.textContent = t('Recomeçar'); };
  rs.onclick = () => {
    if (rs.classList.contains('armed')) { disarm(); doReset(); return; }
    rs.classList.add('armed'); rs.textContent = t('Confirmar: apagar tudo');
    setTimeout(disarm, 3000);
  };
}

if (FLAGS.risco) initRisco({ onExit: () => openHome(), onNext: guardar => { // desabou: torre nova com a Reputação e o prêmio guardado
  novaTorre(guardar); resetRisco();
  setNotice(null); resetView(); resetMilestones(); syncEvents(); followBuild(); syncCameraButtons(); closeSkills(); updateUI(); clearNews();
  showNews(t('JORNAL DA OBRA'), t('Construtora Vigaluz recomeça em Santa Brisa: torre nº {0} (Reputação {1}).', S.riscoTentativa, fmtPct(repPct(S.pontosTotal || 0))));
} });
// Fim de jogo (Obra Viva): na primeira vez que a torre chega à Órbita, faixa na cena e tela de parabéns
function checkWin() {
  if (!FLAGS.viva || !S.won || S.winSeen) return;
  S.winSeen = true; save();
  V.toast = { a: t('ÓRBITA ALCANÇADA'), b: t('TORRE CONCLUÍDA'), t: 6 };
  const h = Math.floor(S.playTime / 3600), m = Math.floor(S.playTime % 3600 / 60);
  $('winStats').innerHTML = `<span>${t('Tempo de obra')}</span><b>${t('{0} h {1} min', h, String(m).padStart(2, '0'))}</b>`
    + `<span>${t('Peças construídas')}</span><b>${fmt(Math.floor(S.floors))}</b><span>${t('Andares alugados')}</span><b>${fmt(S.rented)}</b>`;
  $('win').hidden = false;
}
$('winGo').onclick = () => { $('win').hidden = true; };
$('winNew').onclick = () => { $('win').hidden = true; doReset(); };

initMap(updateUI);

// Obra Viva é o único modo no navegador (o clássico foi retirado do site).
document.body.classList.toggle('modo-novo', FLAGS.viva);
if (FLAGS.viva) {
  for (const id of ['hPlateFloor', 'hPlateMoney', 'hPlateClock', 'hudBtns', 'openUp']) $(id).hidden = false; // o resumo (hSum) aparece no 1º andar
  $('z-all').textContent = '⤢'; $('z-all').setAttribute('aria-label', t('Ver a torre inteira'));
  initSkills();
  // abertura com a história (partida nova); não roda nos testes automáticos (?test=1 ou navegador controlado)
  initIntro({ test: TEST || navigator.webdriver, auto: false });
  initMilestones();
  initCoach(); initTips({ test: TEST || navigator.webdriver });
  // página de Início: trocar de espaço limpa a cena (como o Recomeçar, sem apagar); partida nova abre a história
  const onSwitch = () => { dropTip(); clearNews(); if (FLAGS.risco) { migrarRisco(); resetRisco(); } setNotice(null); resetView(); resetMilestones(); syncEvents(); syncCameraButtons(); closeSkills(); updateUI(); };
  initTutorial({ play: () => document.getElementById('hmContinue').click() }); // "Jogar" = Continuar/Novo jogo
  initRanking(); initJornal(); initGear(); initPip(); initStatus();
  initHome({ onSwitch: () => { onSwitch(); pedirFicha(); }, onHowto: openTutorial, onRanking: openRanking, onRankLeave: sairDoRanking, onRankJoin: definirApelido, onSound: () => syncSnd(), onJornais: drawArquivo,
    onForget: esquecerJogador, // apagar um espaço tira o apelido daquele jogador do ranking
    onNewGame: () => { if (!(TEST || navigator.webdriver)) startIntro(false); }, // nos testes, sem abertura
    precisaNome: () => nomeInicio && !(S.rank && (S.rank.apelido || S.rank.nao || S.rank.semNome)), ultimoNome: ultimoApelido }); // pede o nome do ranking (partida nova ou save sem nick)
  $('skHome').onclick = () => { closeGear(); closeSkills(); openHome(); };
  $('gearCfg').onclick = () => { closeGear(); closeSkills(); openHome(); $('hmCfg').click(); };
  if (!(TEST || navigator.webdriver)) openHome();
  $('skStory').onclick = () => { closeGear(); closeSkills(); startIntro(true); };
}

// som da obra: lembrado neste navegador (botão sobre a cena no modo atual; no rodapé das Melhorias no Obra Viva)
const sndBtns = [$('snd'), $('skSnd')];
const syncSnd = () => sndBtns.forEach(b => { b.setAttribute('aria-pressed', soundOn()); b.textContent = soundOn() ? t('Som') : t('Mudo'); });
sndBtns.forEach(b => b.onclick = () => { setSound(!soundOn()); syncSnd(); });
syncSnd();

addEventListener('beforeunload', save);
// Aba escondida: salva. Ao voltar, no modo clássico o tempo fora vira progresso (mesmas regras do offline,
// com resumo) e as animações retomam do estado atual, sem repetir o que passou.
// Obra Viva: aba minimizada não pausa (pedido do usuário, 21/10/2026). O navegador para a animação com a aba escondida, então
// ao voltar o jogo simula o tempo que passou, na velocidade escolhida (até 8 h), com tudo valendo (intempéries, interdição,
// fim do ano). Com o jogo fechado, nada anda.
let escondidaEm = null;
function tempoFora(seg) {
  if (seg < 2 || homeOpen() || introActive() || frozen()) return;
  const real = Math.min(seg, 8 * 3600), f0 = Math.floor(S.floors), m0 = S.money, a0 = (S.risco && S.risco.ano) || 1;
  for (let sd = real * speed; sd > 0; sd -= 0.5) sim(Math.min(0.5, sd));
  S.playTime = (S.playTime || 0) + real * speed;
  const andares = Math.floor(S.floors) - f0, ganho = S.money - m0, r = S.risco || {};
  const partes = [(andares >= 0 ? '+' : '') + (andares === 1 ? t('1 andar') : t('{0} andares', fmt(andares))), (ganho >= 0 ? '+' : '−') + din(Math.abs(ganho))];
  if ((r.ano || 1) > a0) partes.push(t('o ano terminou'));
  if (r.interd) partes.push(t('obra interditada: escolha um reforço'));
  const corpo = partes.join(' · ');
  welcome(t('Enquanto você esteve fora: {0}', corpo), corpo); noticeT = V.t + 12;
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { save(); escondidaEm = Date.now(); return; }
  if (FLAGS.viva) { tempoFora(escondidaEm ? (Date.now() - escondidaEm) / 1000 : 0); escondidaEm = null; }
  else { const msg = runOffline(); if (msg) { welcome(msg); noticeT = V.t + 12; } }
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
  get S() { return S; }, get velocidade() { return speed; }, V, cam, snap: snapCamera, shot, events: recent, sons: () => soundsLoaded(),
  dicas: on => setTips(on),
  nomeInicio: on => { nomeInicio = !!on; }, // liga o pedido de nome no Novo jogo nos testes automáticos
  home: on => (on ? openHome() : closeHome()), // abre/fecha a página de Início (desligada por padrão com ?test=1) // liga as dicas nos testes automáticos (desligadas por padrão com ?test=1)
  look: (cx, cy, z = cam.z) => { panBy(0, 0); cam.z = z; cam.cx = cx; cam.cy = cy; }, // câmera livre num ponto (capturas)
  draw: (n = 1) => { for (let i = 0; i < n; i++) { updateView(0.05, 1); render(); } },
  step: (sec, fps = 30) => { for (let i = 0; i < sec * fps; i++) tick(1 / fps); },
};
