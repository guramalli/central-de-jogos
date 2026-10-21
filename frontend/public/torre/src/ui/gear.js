// Engrenagem e pausa (Obra Viva; pedido do usuário, out/2026: tirar o rodapé das Melhorias). Dois botões pequenos
// embaixo da placa do andar, no canto esquerdo (visíveis com a árvore aberta no computador e no celular):
// - ⚙ abre o painel com Som, Dicas, História, Mais configurações, Início e Recomeçar; com o painel aberto a obra fica parada;
// - ⏸ pausa a obra (dias, material, renda e animações) com um aviso por cima; Continuar (ou tocar no aviso) volta.
import { S } from '../sim/state.js';
import { FLAGS } from '../data/flags.js';
import { t } from '../i18n.js';

const $ = id => document.getElementById(id);
let paused = false, hooks = {};
export const gearOpen = () => !$('gear').hidden;
export const isPaused = () => paused;
// o laço de main.js para a simulação e as animações quando um dos dois está ativo
export const frozen = () => paused || gearOpen();

export function openGear() { if (!FLAGS.viva) return; updateGear(); $('gear').hidden = false; hooks.onOpen?.(); }
export function closeGear() { $('gear').hidden = true; }
export function setPaused(on) {
  paused = !!on;
  $('paused').hidden = !paused;
  $('pauseBtn').classList.toggle('on', paused);
  $('pauseBtn').setAttribute('aria-label', paused ? t('Continuar') : t('Pausar')); $('pauseBtn').title = paused ? t('Continuar') : t('Pausar');
}

// hooks: onOpen (fecha a árvore no celular para o painel caber)
export function initGear(h = {}) {
  if (!FLAGS.viva) return;
  hooks = h;
  $('gearBtn').onclick = () => (gearOpen() ? closeGear() : openGear());
  $('gearClose').onclick = closeGear;
  $('gear').addEventListener('click', e => { if (e.target === $('gear')) closeGear(); }); // tocar fora fecha
  $('pauseBtn').onclick = () => setPaused(!paused);
  $('pauseGo').onclick = e => { e.stopPropagation(); setPaused(false); };
  $('paused').onclick = () => setPaused(false);
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && gearOpen()) { e.stopPropagation(); closeGear(); }
    else if ((e.key === 'p' || e.key === 'P') && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName || '')) setPaused(!paused);
  }, true);
}

// título do painel: a torre e o ano
export function updateGear() {
  if (!FLAGS.viva) return;
  $('gearT').textContent = t('Torre nº {0} · Ano {1}', S.riscoTentativa || 1, (S.risco && S.risco.ano) || 1);
}

// os botões ficam logo abaixo da placa do andar (a altura da placa muda com a fonte e o tamanho da tela)
export function placeHudButtons() {
  const p = $('hPlateFloor'), b = $('hudBtns');
  if (!p || !b || p.hidden) return;
  const top = p.offsetTop + p.offsetHeight + 6 + 'px', left = p.offsetLeft + 'px';
  if (b.style.top !== top) b.style.top = top;
  if (b.style.left !== left) b.style.left = left;
}
