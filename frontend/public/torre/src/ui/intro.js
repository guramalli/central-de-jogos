// Abertura do Obra Viva (história em 4 quadros sobre a própria cena) e manchetes de jornal durante o jogo.
// A câmera é dirigida daqui (setIntroCam); a simulação fica parada enquanto a abertura está na tela.
import { W, H, FH } from '../data/constants.js';
import { altOf, floorOf } from '../data/height.js';
import { ERAS, eraAt } from '../data/eras.js';
import { VIVA } from '../data/viva.js';
import { UP } from '../data/upgrades.js';
import { INTRO, HEADLINES, DISCOVERY, CHEQUE_DE, headline } from '../data/story.js';
import { city } from '../sim/prestige.js';
import { S, save } from '../sim/state.js';
import { setIntroCam } from '../render/camera.js';
import { onEvent } from '../render/events.js';
import { din, fmtM } from './format.js';
import { t, LANG } from '../i18n.js';
import { $ } from './dom.js';
import { sfx } from './audio.js';

let on = false, idx = 0, t0 = 0, replay = false, timer = 0;
export const introActive = () => on;

const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
const GROUND = H * 0.14; // centro da câmera: o chão fica a ~64% da altura, acima do cartão do texto (celular)
const ORBIT = floorOf(400000) * FH;

// posição da câmera em cada quadro (s = segundos desde o começo do quadro)
function camAt(card, s) {
  if (card.cam === 'descend') return { cx: 30, cy: GROUND + (1700 - GROUND) * (1 - ease(s / 4.5)), z: 1 };
  if (card.cam === 'rise') { // sobe em escala logarítmica: passa por todas as eras em ~6 s
    const k = ease((s - 0.4) / 5.8), cy = Math.exp(Math.log(GROUND) + (Math.log(ORBIT) - Math.log(GROUND)) * k);
    return { cx: 30, cy, z: 1 };
  }
  if (card.cam === 'fans') return { cx: Math.min(-100, -274 + W / 2), cy: GROUND, z: 1 }; // tapume inteiro na tela, até no celular
  return { cx: 30, cy: GROUND, z: 1 };
}

function show(i) {
  idx = i; t0 = performance.now();
  const c = INTRO[i];
  $('inK').textContent = t(c.kicker); $('inT').textContent = t(c.text);
  $('inDots').innerHTML = INTRO.map((_, j) => `<i class="${j === i ? 'on' : j < i ? 'done' : ''}"></i>`).join('');
  $('inNext').textContent = i === INTRO.length - 1 ? t('Começar a obra') : t('Próximo');
  const jornal = t('JORNAL DA ORLA');
  $('inClips').innerHTML = (c.clips || []).map((h, j) => `<div class="clip c${j}" style="animation-delay:${0.6 + j * 0.9}s"><small>${jornal}</small><b>${t(h)}</b></div>`).join('');
  $('inCheque').hidden = !c.cheque;
  $('inEra').hidden = c.cam !== 'rise'; $('inEra').textContent = '';
  // reinicia as animações CSS do quadro
  const card = $('inCard'); card.classList.remove('in-anim'); void card.offsetWidth; card.classList.add('in-anim');
  clearTimeout(timer);
  if (c.dur) timer = setTimeout(next, c.dur * 1000);
}
function next() { if (!on) return; if (idx < INTRO.length - 1) show(idx + 1); else finish(); }

function tickEra() {
  if (!on) return;
  if (INTRO[idx].cam === 'rise') {
    const p = camAt(INTRO[idx], (performance.now() - t0) / 1000), alt = altOf(p.cy / FH);
    $('inEra').innerHTML = `<b>${fmtM(alt)}</b><span>${t(ERAS[eraAt(alt)].n)}</span>`;
  }
  requestAnimationFrame(tickEra);
}

export function startIntro(isReplay = false) {
  on = true; replay = isReplay;
  document.body.classList.add('intro');
  $('intro').hidden = false;
  setIntroCam(() => camAt(INTRO[idx], (performance.now() - t0) / 1000));
  show(0);
  requestAnimationFrame(tickEra);
  $('inNext').focus();
}

function finish() {
  if (!on) return;
  on = false; clearTimeout(timer);
  $('intro').hidden = true;
  document.body.classList.remove('intro');
  setIntroCam(null);
  if (!replay) {
    S.introSeen = true; save();
    const m = $('hPlateMoney'); m.classList.remove('pulse'); void m.offsetWidth; m.classList.add('pulse'); // o cheque cai no caixa
  }
}

// manchete de jornal (ou descoberta, meta batida, gerente…) na frente da obra e das Melhorias, sem pausar o jogo.
// Só fecha com um toque (pedido do usuário, out/2026: quem joga fica com as Melhorias abertas o tempo todo e perdia os
// avisos que sumiam sozinhos); vários seguidos entram em fila, com o contador dos que faltam
const queue = [];
let newsBusy = false;
// rodada nova: as manchetes que sobraram da obra anterior saem da fila
export function clearNews() { queue.length = 0; newsBusy = false; $('news').hidden = true; }
export function showNews(kicker, text) { queue.push([kicker, text]); if (!newsBusy) nextNews(); else countNews(); }
const countNews = () => { $('newsN').textContent = queue.length ? `+${queue.length}` : ''; };
function nextNews() {
  const n = $('news'), item = queue.shift();
  if (!item) { newsBusy = false; n.hidden = true; return; }
  newsBusy = true;
  $('newsK').textContent = item[0]; $('newsT').textContent = item[1]; countNews(); sfx('news');
  n.hidden = false; n.classList.remove('in'); void n.offsetWidth; n.classList.add('in');
}

export function initIntro({ test = false, auto = true } = {}) {
  $('news').onclick = () => nextNews(); // toque fecha e mostra o próximo da fila
  $('inNext').onclick = next;
  $('inSkip').onclick = finish;
  $('news').onclick = () => { clearTimeout($('news')._t); nextNews(); };
  addEventListener('keydown', e => { if (!on) return; if (e.key === 'Escape') finish(); });
  $('inChequeVal').textContent = din(VIVA.startMoney) + (LANG === 'en' ? '.00' : ',00');
  $('inChequeTo').textContent = t('Construtora Vigaluz'); $('inChequeDe').textContent = t(CHEQUE_DE[0]); $('inChequeSelo').textContent = t(CHEQUE_DE[1]);
  onEvent(e => {
    if (e.type === 'era_unlocked' && HEADLINES[e.era]) showNews(t('JORNAL DA ORLA'), headline(e.era, city().n));
    else if (e.type === 'upgrade_purchased' && e.from === 0 && DISCOVERY[e.k]) showNews(t('DESCOBERTA · {0}', t(UP[e.k].n).toUpperCase()), t(DISCOVERY[e.k]));
  });
  // partida nova: abertura; save antigo (já construindo) não vê
  if (!S.introSeen && S.floors >= 1) { S.introSeen = true; return; }
  if (!S.introSeen && !test && auto) startIntro(false); // com a página de Início, a história abre em "Novo jogo"
}
