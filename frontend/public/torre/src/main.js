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
import { fmt, fmtPct } from './ui/format.js';
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
import { endRound, startNextRound, city, metaAlt, roundDays, roundDay, repPct } from './sim/prestige.js';
import { initRoundEnd, checkRoundEnd, resetRoundEnd } from './ui/roundEnd.js';
import { initOffers, updateOffers, resetOffers } from './ui/offers.js';
import { initCoach, dropTip } from './ui/coach.js';
import { initHome, openHome, closeHome, homeOpen } from './ui/home.js';
import { initTutorial, openTutorial } from './ui/tutorial.js';
import { initJornal, checkJornal, drawArquivo } from './ui/jornal.js';
import { initPip, tickPip } from './ui/pip.js';
import { managerFree } from './sim/managers.js';
import { initStatus, updateStatus } from './ui/status.js';
import { initGear, closeGear, gearOpen, updateGear, frozen, placeHudButtons, setPaused, deliverMsg } from './ui/gear.js';
import { initRanking, openRanking, pedirFicha, sairDoRanking, definirApelido, rankTick, esquecerJogador } from './ui/ranking.js';
import { initTips, updateTips, setTips, tickTips } from './ui/tips.js';
import { initMilestones } from './ui/milestones.js';
const cityName = () => city().n;
import { preloadArt } from './render/assets.js';
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
  const fz = frozen(); // pausa ou engrenagem aberta: nada anda (nem as animações)
  const dt = fz ? 0 : Math.min(.1, real);
  let sd = introActive() || homeOpen() || fz ? 0 : Math.min(SIM_MAX_DT, real) * speed; // a obra começa quando a história acaba
  while (sd > 0) { const st = Math.min(.25, sd); sim(st); sd -= st; }
  updateView(dt, speed);
  render();
  tickPip(Math.min(.1, real), introActive() || homeOpen()); // janelinha com a outra ponta da obra
  if (FLAGS.viva) { // som ambiente: canteiro e mar com o térreo à vista, vento nas eras altas (ui/audio.js)
    const sc = city().scene, alt = altOf(Math.max(0, cam.cy) / FH) + (sc.skyAlt || 0);
    const ground = Math.max(0, Math.min(1, 1 - (worldY(H) - 100) / 600));
    const wind = sc.moon ? 0 : Math.max(0, Math.min(1, (alt - 3000) / 9000)) * Math.max(0, Math.min(1, 1 - (alt - 80000) / 40000));
    tickAmbience({ ground, sea: !!sc.sea, wind, top: !isFree() && !S.roundOver && S.floors >= 2, active: !fz && !homeOpen() && !introActive(), dt: Math.min(.1, real) });
  }
  if (skillsOpen()) tickSkills(); // prévia animada da tela de Melhorias
  tickTips(); // o quadro da dica acompanha o alvo
  if (FLAGS.viva && !introActive() && !homeOpen() && !fz) S.playTime = (S.playTime || 0) + dt * speed;
  // a interface segue o tempo real, mesmo pausada
  uiT += Math.min(.1, real); if (uiT > .2) { uiT = 0; updateUI(); syncCameraButtons(); checkWin(); checkRoundEnd(); checkMeta(); if (!homeOpen() && !introActive()) checkManagers(); updateOffers(); updateTips(); rankTick(); checkJornal(homeOpen() || introActive()); if (gearOpen()) updateGear(); placeHudButtons(); updateStatus(introActive() || homeOpen()); }
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
function doReset() { dropTip(); if (FLAGS.viva) esquecerJogador(); resetState(); setNotice(null); resetView(); resetMilestones(); syncEvents(); syncCameraButtons(); closeMap(); updateUI(); if (FLAGS.viva) { closeSkills(); startIntro(false); } }
for (const rs of [$('reset'), $('skReset')]) {
  const disarm = () => { rs.classList.remove('armed'); rs.textContent = 'Recomeçar'; };
  rs.onclick = () => {
    if (rs.classList.contains('armed')) { disarm(); doReset(); return; }
    rs.classList.add('armed'); rs.textContent = 'Confirmar: apagar tudo';
    setTimeout(disarm, 3000);
  };
}

// Entrega e próxima obra: a obra entregue (pela carta da próxima cidade no fim do ano, ou antes do prazo depois da
// meta, com dois cliques) recomeça na cidade seguinte; o aditivo continua na mesma torre (ui/roundEnd.js)
function startNext() {
  if (!S.roundOver) return;
  const got = S.pontosTotal;
  startNextRound(); pedirFicha(); // ficha do ranking para a obra nova
  setNotice(null); resetView(); resetMilestones(); syncEvents(); followBuild(); syncCameraButtons(); closeSkills(); updateUI();
  checkRoundEnd(); clearNews();
  const mg = Object.values(VIVA.board).find(b => b.obra === S.obra); // gerente que chega nesta obra
  showNews('JORNAL DA OBRA', `Construtora J. Santos começa a obra nº ${S.obra} em ${cityName()} (Reputação ${fmtPct(repPct(got))}). Prazo: 365 dias`); // gerente novo: aviso próprio (checkManagers)
}
{
  const dv = $('skDeliver'), disarm = () => dv.classList.remove('armed');
  dv.onclick = () => {
    if (S.roundOver) { if (S.roundPaid) { closeGear(); startNext(); } return; }
    $('dvMsg').innerHTML = deliverMsg(); $('dvConfirm').hidden = false; // antes do prazo: aviso com a multa ou o bônus
  };
  $('dvOk').onclick = () => {
    if (S.roundOver) return;
    endRound(); closeGear(); closeSkills(); checkRoundEnd(); updateUI(); // entrega antecipada: placar da obra entregue
  };
}
// gerente liberado (chegou nesta obra; o Encarregado no 5º andar): aviso uma vez por gerente, que só fecha com um toque.
// Ninguém liga sozinho: quem joga liga no cartão da faixa Construtora, nas Melhorias
function checkManagers() {
  if (!FLAGS.viva) return;
  for (const k in VIVA.board) {
    const b = VIVA.board[k];
    if (!b.mgr || (S.mgrAviso || {})[b.mgr] || !managerFree(b.mgr)) continue;
    S.mgrAviso = { ...(S.mgrAviso || {}), [b.mgr]: true };
    showNews('CONSTRUTORA J. SANTOS', `${b.n} liberado! Ligue no cartão dele (Melhorias → faixa Construtora) para ele começar: ${b.d.charAt(0).toLowerCase() + b.d.slice(1)}`);
  }
}
// meta do contrato: manchete uma vez por obra quando a torre passa dela
function checkMeta() {
  if (!FLAGS.viva || S.metaOk || S.roundOver || S.maxAlt < metaAlt()) return;
  S.metaOk = true;
  showNews('JORNAL DA OBRA', `Meta do contrato batida no dia ${roundDay()}! Agora a J. Santos pode entregar a torre de ${cityName()} antes do prazo sem multa, e ainda com bônus (na engrenagem ⚙)`);
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

// Obra Viva é o único modo no navegador (o clássico foi retirado do site).
document.body.classList.toggle('modo-novo', FLAGS.viva);
if (FLAGS.viva) {
  for (const id of ['hPlateFloor', 'hPlateMoney', 'hPlateClock', 'hudBtns', 'openUp']) $(id).hidden = false; // o resumo (hSum) aparece no 1º andar
  $('z-all').textContent = '⤢'; $('z-all').setAttribute('aria-label', 'Ver a torre inteira');
  initSkills();
  // abertura com a história (partida nova); não roda nos testes automáticos (?test=1 ou navegador controlado)
  initIntro({ test: TEST || navigator.webdriver, auto: false });
  initMilestones();
  initRoundEnd({
    onNext: startNext,
    onExit: () => openHome(),
    onExtend: () => { updateUI(); syncCameraButtons(); showNews('JORNAL DA OBRA', `Aditivo assinado: a J. Santos fica mais 365 dias em ${cityName()}. Novo prazo: dia ${roundDays()}`); },
  });
  initOffers();
  initCoach(); initTips({ test: TEST || navigator.webdriver });
  // página de Início: trocar de espaço limpa a cena (como o Recomeçar, sem apagar); partida nova abre a história
  const onSwitch = () => { dropTip(); clearNews(); resetRoundEnd(); resetOffers(); setNotice(null); resetView(); resetMilestones(); syncEvents(); syncCameraButtons(); closeSkills(); updateUI(); };
  initTutorial({ play: () => document.getElementById('hmContinue').click() }); // "Jogar" = Continuar/Novo jogo
  initRanking(); initJornal(); initGear(); initPip(); initStatus();
  initHome({ onSwitch: () => { onSwitch(); pedirFicha(); }, onHowto: openTutorial, onRanking: openRanking, onRankLeave: sairDoRanking, onRankJoin: definirApelido, onSound: () => syncSnd(), onJornais: drawArquivo,
    onForget: esquecerJogador, // apagar um espaço tira o apelido daquele jogador do ranking
    onNewGame: () => { if (!(TEST || navigator.webdriver)) startIntro(false); } }); // nos testes, sem abertura
  $('skHome').onclick = () => { closeGear(); closeSkills(); openHome(); };
  $('gearCfg').onclick = () => { closeGear(); closeSkills(); openHome(); $('hmCfg').click(); };
  if (!(TEST || navigator.webdriver)) openHome();
  $('skStory').onclick = () => { closeGear(); closeSkills(); startIntro(true); };
}

// som da obra: lembrado neste navegador (botão sobre a cena no modo atual; no rodapé das Melhorias no Obra Viva)
const sndBtns = [$('snd'), $('skSnd')];
const syncSnd = () => sndBtns.forEach(b => { b.setAttribute('aria-pressed', soundOn()); b.textContent = soundOn() ? 'Som' : 'Mudo'; });
sndBtns.forEach(b => b.onclick = () => { setSound(!soundOn()); syncSnd(); });
syncSnd();

addEventListener('beforeunload', save);
// Aba escondida: salva. Ao voltar, no modo clássico o tempo fora vira progresso (mesmas regras do offline,
// com resumo) e as animações retomam do estado atual, sem repetir o que passou.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { save(); return; }
  const msg = FLAGS.viva ? null : runOffline(); // Obra Viva: aba escondida pausa a rodada
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
  get S() { return S; }, V, cam, snap: snapCamera, shot, events: recent, sons: () => soundsLoaded(),
  dicas: on => setTips(on),
  home: on => (on ? openHome() : closeHome()), // abre/fecha a página de Início (desligada por padrão com ?test=1) // liga as dicas nos testes automáticos (desligadas por padrão com ?test=1)
  look: (cx, cy, z = cam.z) => { panBy(0, 0); cam.z = z; cam.cx = cx; cam.cy = cy; }, // câmera livre num ponto (capturas)
  draw: (n = 1) => { for (let i = 0; i < n; i++) { updateView(0.05, 1); render(); } },
  step: (sec, fps = 30) => { for (let i = 0; i < sec * fps; i++) tick(1 / fps); },
};
