// Fim da rodada (Obra Viva): quando S.roundOver liga (relógio zerou ou entrega antecipada), a câmera mostra a torre
// inteira e o placar abre uma vez: altura, recorde, ★ ganhas. "Continuar" abre a faixa Construtora; o botão do
// rodapé da árvore (#skDeliver) vira "Começar a próxima obra". Recarregar com a rodada encerrada reabre o placar.
import { S } from '../sim/state.js';
import { pointsFor, city } from '../sim/prestige.js';
import { FLAGS } from '../data/flags.js';
import { VIVA } from '../data/viva.js';
import { toggleOverview, isOverview } from '../render/camera.js';
import { openSkills } from './skills.js';
import { rankNoPlacar } from './ranking.js';
import { fmt, fmtM } from './format.js';

const $ = id => document.getElementById(id);
let shown = false;

export function initRoundEnd() {
  if (!FLAGS.viva) return;
  $('reGo').onclick = () => {
    $('roundEnd').hidden = true;
    openSkills();
    $('skBoard').classList.remove('fold'); // o quadro aparece aberto, mesmo no celular
  };
}

// troca de espaço: o próximo placar abre de novo, mesmo que o outro espaço também esteja no fim da obra
export const resetRoundEnd = () => { shown = false; };

export function checkRoundEnd() {
  if (!FLAGS.viva) return;
  if (!S.roundOver) { shown = false; $('roundEnd').hidden = true; return; }
  if (shown) return;
  shown = true;
  if (!isOverview()) toggleOverview();
  const rec = S.maxAlt > (S.lastBest || 0);
  $('reTitle').textContent = `Obra nº ${S.obra || 1} · ${city().n}`;
  $('reStats').innerHTML = `<span>Altura</span><b>${fmtM(S.maxAlt)}</b>`
    + `<span>Recorde</span><b class="${rec ? 'rec' : ''}">${rec ? 'Novo recorde!' : fmtM(S.lastBest || 0)}</b>`
    + `<span>★ ganhas</span><b>+${fmt(pointsFor(S.maxAlt))}</b>`
    + `<span>Reputação</span><b>+${fmt(Math.round(VIVA.prestige.rep * (S.pontosTotal || 0) * 100))}%</b>`;
  $('roundEnd').hidden = false;
  rankNoPlacar(); // apelido (1ª vez) ou envio dos recordes
}
