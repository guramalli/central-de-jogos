// Engrenagem e pausa (Obra Viva; pedido do usuário, out/2026: tirar o rodapé das Melhorias). Dois botões pequenos
// embaixo da placa do andar, no canto esquerdo (visíveis com a árvore aberta no computador e no celular):
// - ⚙ abre o painel com Entregar antes (ou a meta que falta), Som, Dicas, História, Mais configurações, Início e
//   Recomeçar; com o painel aberto a obra fica parada;
// - ⏸ pausa a obra (dias, material, renda e animações) com um aviso por cima; Continuar (ou tocar no aviso) volta.
import { S } from '../sim/state.js';
import { canDeliver, metaAlt, deliverTerms, repPct, nextCity, city, roundDay, roundDays } from '../sim/prestige.js';
import { FLAGS } from '../data/flags.js';
import { fmtM, fmtPct, fmt } from './format.js';

const $ = id => document.getElementById(id);
let paused = false, hooks = {};
export const gearOpen = () => !$('gear').hidden;
export const isPaused = () => paused;
// o laço de main.js para a simulação e as animações quando um dos dois está ativo
export const frozen = () => paused || gearOpen();

export function openGear() { if (!FLAGS.viva) return; updateGear(); $('gear').hidden = false; hooks.onOpen?.(); }
export function closeGear() { $('gear').hidden = true; $('dvConfirm').hidden = true; }
export function setPaused(on) {
  paused = !!on;
  $('paused').hidden = !paused;
  $('pauseBtn').classList.toggle('on', paused);
  $('pauseBtn').setAttribute('aria-label', paused ? 'Continuar' : 'Pausar'); $('pauseBtn').title = paused ? 'Continuar' : 'Pausar';
}

// hooks: onOpen (fecha a árvore no celular para o painel caber)
export function initGear(h = {}) {
  if (!FLAGS.viva) return;
  hooks = h;
  $('gearBtn').onclick = () => (gearOpen() ? closeGear() : openGear());
  $('gearClose').onclick = closeGear;
  $('gear').addEventListener('click', e => { if (e.target === $('gear')) closeGear(); }); // tocar fora fecha
  $('pauseBtn').onclick = () => setPaused(!paused);
  $('dvNo').onclick = () => { $('dvConfirm').hidden = true; };
  $('pauseGo').onclick = e => { e.stopPropagation(); setPaused(false); };
  $('paused').onclick = () => setPaused(false);
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && gearOpen()) { e.stopPropagation(); closeGear(); }
    else if ((e.key === 'p' || e.key === 'P') && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName || '')) setPaused(!paused);
  }, true);
}

// botão de entregar (dentro do painel): sempre ativo durante a obra; o aviso de confirmação diz o que acontece
export function updateGear() {
  if (!FLAGS.viva) return;
  const dv = $('skDeliver');
  $('gearT').textContent = `Obra nº ${S.obra || 1} · ${city().n}`;
  dv.hidden = S.roundOver && !S.roundPaid; // no fim do ano a escolha fica no placar
  dv.disabled = false;
  if (S.roundOver) dv.textContent = `Começar a obra em ${nextCity().n}`;
  else { const t = deliverTerms(); dv.textContent = t.metaOk ? 'Entregar a obra agora (meta batida: com bônus)' : `Entregar a obra agora (meta: ${fmtM(t.meta)})`; dv.classList.toggle('multa', !t.metaOk); }
  if (!$('dvConfirm').hidden) $('dvMsg').innerHTML = deliverMsg();
}
const reais = v => 'R$ ' + (v < 10 ? v.toFixed(1).replace('.', ',') : fmt(v)) + '/s';
// o que acontece se entregar agora (antes do fim do contrato)
export function deliverMsg() {
  const t = deliverTerms(), tot = S.pontosTotal || 0, faltam = roundDays() - roundDay(), c = city().n;
  const rep = `Reputação ${fmtPct(repPct(tot))} → <b>${fmtPct(repPct(tot + t.pts))}</b>`;
  const head = `Entregar a torre de ${c} (${fmtM(S.maxAlt)}) no dia ${roundDay()}, ${faltam} dias antes do fim do contrato.`
    + (t.sobra >= 0.01 ? `<br>O caixa que sobrou rende <b>+${Math.round(t.sobra * 100)}%</b> na Reputação.` : '');
  if (t.metaOk) return `${head}<br>A meta do contrato (${fmtM(t.meta)}) foi batida: <b>bônus de antecipação de +${Math.round(t.bonus * 100)}%</b>.<br>${rep}<br>${c} paga <b>${reais(t.taxa)}</b> para sempre. A próxima obra começa em ${nextCity().n}.`;
  return `${head}<br><span class="dv-bad">A meta do contrato é ${fmtM(t.meta)} e a torre não chegou lá: <b>multa de ${t.multa}%</b> na Reputação e na taxa desta torre.</span><br>`
    + `${rep} (sem a multa seriam ${fmtPct(repPct(tot + t.base))})<br>${c} paga só <b>${reais(t.taxa)}</b> para sempre. A próxima obra começa em ${nextCity().n}.`;
}

// os botões ficam logo abaixo da placa do andar (a altura da placa muda com a fonte e o tamanho da tela)
export function placeHudButtons() {
  const p = $('hPlateFloor'), b = $('hudBtns');
  if (!p || !b || p.hidden) return;
  const top = p.offsetTop + p.offsetHeight + 6 + 'px', left = p.offsetLeft + 'px';
  if (b.style.top !== top) b.style.top = top;
  if (b.style.left !== left) b.style.left = left;
}
