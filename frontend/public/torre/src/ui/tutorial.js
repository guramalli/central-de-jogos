// "Como jogar" (página de Início): 7 páginas com captura do jogo (assets/tutorial/N.jpg), título e texto.
// ← → (ou as setas do teclado) passam as páginas; a última tem "Jogar", que fecha o tutorial e o Início.
import { TUTORIAL } from '../data/tips.js';
import { FLAGS } from '../data/flags.js';
import { t, LANG } from '../i18n.js';

const $ = id => document.getElementById(id);
let i = 0, onPlay = null;

function draw() {
  const p = TUTORIAL[i];
  $('htImg').src = `assets/tutorial/${LANG === 'en' ? 'en/' : ''}${i + 1}.jpg`; // capturas em inglês: node tools/tutorial-capturas.mjs en $('htImg').alt = t(p.titulo);
  $('htTitle').textContent = t(p.titulo); $('htText').textContent = t(p.texto);
  $('htDots').innerHTML = TUTORIAL.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('');
  $('htPrev').disabled = i === 0;
  $('htNext').textContent = i === TUTORIAL.length - 1 ? t('Jogar') : t('Próximo →');
}
const close = () => { $('howto').hidden = true; };

export function openTutorial() { i = 0; $('howto').hidden = false; draw(); $('htNext').focus({ preventScroll: true }); }
export function initTutorial({ play } = {}) {
  onPlay = play;
  $('htPrev').onclick = () => { if (i > 0) { i--; draw(); } };
  $('htNext').onclick = () => { if (i < TUTORIAL.length - 1) { i++; draw(); } else { close(); onPlay?.(); } };
  $('htClose').onclick = close;
  addEventListener('keydown', e => {
    if ($('howto').hidden) return;
    if (e.key === 'ArrowRight') $('htNext').click();
    else if (e.key === 'ArrowLeft') $('htPrev').click();
    else if (e.key === 'Escape') { e.stopPropagation(); close(); }
  }, true);
}
