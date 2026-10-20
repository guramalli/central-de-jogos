// Fim do ano e entrega da obra (Obra Viva). Quando S.roundOver liga, a câmera mostra a torre inteira e o placar abre:
// - fim do ano (prazo vencido, ainda não entregue): dados da obra e duas escolhas — o aditivo (+365 dias na mesma torre,
//   Reputação só na entrega) ou a carta do próximo cliente (entregar agora: Reputação e a torre paga a taxa para sempre);
// - obra entregue (pela carta ou antes do prazo, depois da meta): Reputação ganha, ranking e "Começar a obra em <cidade>".
// Recarregar com a obra parada reabre o placar no mesmo ponto.
import { S, save } from '../sim/state.js';
import { pointsFor, city, nextCity, roundDay, roundDays, admTaxa, endRound, extendRound, metaAlt, repPct, deliverTerms } from '../sim/prestige.js';
import { FLAGS } from '../data/flags.js';
import { VIVA } from '../data/viva.js';
import { toggleOverview, isOverview, followBuild } from '../render/camera.js';
import { V } from '../render/view.js';
import { rankNoPlacar } from './ranking.js';
import { guardarFotoTorre } from './jornal.js';
import { fmt, fmtM, fmtPct } from './format.js';

const $ = id => document.getElementById(id);
let shown = '', fotoT = 0, hooks = {};
const reais = v => 'R$ ' + (v < 10 ? v.toFixed(1).replace('.', ',') : fmt(v)) + '/s';

// hooks: onExtend (aditivo assinado), onNext (começar a próxima obra), onExit (ir para o Início)
export function initRoundEnd(h = {}) {
  if (!FLAGS.viva) return;
  hooks = h;
  $('reMore').onclick = () => {
    if (!extendRound()) return;
    $('roundEnd').hidden = true; shown = '';
    followBuild();
    hooks.onExtend?.();
  };
  $('reNew').onclick = () => {
    endRound(); save();
    checkRoundEnd();
  };
  $('reGo').onclick = () => hooks.onNext?.();
  // fim do prazo: Salvar grava agora; Sair salva e vai para o Início (a escolha fica pendente e o placar volta)
  $('reSave').onclick = () => {
    save(); $('reSave').textContent = 'Salvo!';
    clearTimeout($('reSave')._t); $('reSave')._t = setTimeout(() => { $('reSave').textContent = 'Salvar'; }, 2000);
  };
  $('reExit').onclick = () => { save(); $('roundEnd').hidden = true; shown = ''; hooks.onExit?.(); };
}

// troca de espaço: o próximo placar abre de novo, mesmo que o outro espaço também esteja no fim da obra
export const resetRoundEnd = () => { shown = ''; };

function stats(rows) {
  $('reStats').innerHTML = rows.map(([k, v, cls]) => `<span>${k}</span><b class="${cls || ''}">${v}</b>`).join('');
}

export function checkRoundEnd() {
  if (!FLAGS.viva) return;
  if (!S.roundOver) { shown = ''; $('roundEnd').hidden = true; return; }
  if (fotoT && V.t > fotoT) { fotoT = 0; guardarFotoTorre(S.obra || 1); } // foto da torre inteira para o portfólio
  const estado = S.roundPaid ? 'entregue' : 'ano';
  if (shown === estado) return;
  shown = estado;
  if (!isOverview()) toggleOverview();
  const nx = nextCity().n, obra = `Obra nº ${S.obra || 1} · ${city().n}`;
  $('reChoice').hidden = estado !== 'ano';
  $('reGoRow').hidden = estado !== 'entregue';
  if (estado === 'ano') {
    const rec = S.maxAlt > (S.bestAlt || 0), meta = metaAlt(), dterm = deliverTerms(), got = dterm.pts, tot = S.pontosTotal || 0;
    $('reKind').textContent = 'FIM DO PRAZO';
    $('reTitle').textContent = obra;
    stats([['Altura', fmtM(S.maxAlt)], ['Prazo', `dia ${roundDay()} de ${roundDays()}`],
      ['Meta do contrato', S.maxAlt >= meta ? 'batida' : `${fmtM(meta)} (não batida)`, S.maxAlt >= meta ? 'rec' : ''],
      ['Recorde', rec ? 'Novo recorde!' : fmtM(S.bestAlt || 0), rec ? 'rec' : '']]);
    // os dois cartões com a mesma estrutura, para comparar linha a linha (pedido do usuário: o texto anterior confundia).
    // Aditivo: a Reputação não fica guardada; sai na entrega, pela altura que a torre tiver (cresce menos que a altura)
    const ex = f => `<li class="sub">com ${fmtM(S.maxAlt * f)}: <b>${fmtPct(repPct(pointsFor(S.maxAlt * f)))}</b></li>`;
    $('reMoreTxt').innerHTML = `<ul><li>Mais 365 dias nesta mesma torre (${fmtM(S.maxAlt)})</li>`
      + `<li>Reputação agora: <b>nenhuma</b></li>`
      + `<li>Na entrega, pela altura que a torre tiver:</li>${ex(1.5)}${ex(2)}</ul>`;
    $('reNewTitle').textContent = nx.toUpperCase();
    $('reNewTxt').innerHTML = `<ul><li>Entrega a torre agora; ${nx} quer uma ainda mais alta</li>`
      + `<li>Reputação agora: <b>${fmtPct(repPct(got))}</b>${tot ? ` (total ${fmtPct(repPct(tot + got))})` : ''}${dterm.sobra >= 0.01 ? `, com +${Math.round(dterm.sobra * 100)}% pelo caixa que sobrou` : ''}</li>`
      + `<li>${city().n} paga <b>${reais(admTaxa(S.maxAlt))}</b> para sempre</li>`
      + `<li>A obra nova começa do zero, mais forte</li>`
      + `<li>Regra de ${nx}: ${nextCity().regra}</li></ul>`; // cada cidade muda uma etapa (data/cities.js)
    $('reNew').textContent = `Aceitar o contrato de ${nx}`;
    $('reRank').hidden = true;
  } else {
    const rec = S.maxAlt > (S.lastBest || 0), t = (S.torres || []).at(-1), early = Math.round((S.lastEarly || 0) * 100);
    $('reKind').textContent = 'OBRA ENTREGUE';
    $('reTitle').textContent = obra;
    stats([['Altura', fmtM(S.maxAlt)], ['Entregue', `dia ${t ? t.dia : roundDay()} de ${roundDays()}`],
      ['Recorde', rec ? 'Novo recorde!' : fmtM(S.lastBest || 0), rec ? 'rec' : ''],
      ['Reputação ganha', fmtPct(repPct(S.lastGot || 0)) + (early ? ` (com +${early}% de antecipação)` : S.lastMulta ? ` (multa de ${S.lastMulta}%)` : '')],
      ...(S.lastSobra >= 0.01 ? [['Caixa que sobrou', `+${Math.round(S.lastSobra * 100)}% na Reputação`]] : []),
      ['Reputação total', fmtPct(repPct(S.pontosTotal || 0))],
      ['Paga para sempre', reais(t ? t.taxa : admTaxa(S.maxAlt))]]);
    $('reGo').textContent = `Começar a obra em ${nx}`;
    fotoT = V.t + 1.2; // espera a câmera mostrar a torre inteira
    rankNoPlacar(); // apelido (1ª vez) ou envio dos recordes
  }
  $('roundEnd').hidden = false;
}
