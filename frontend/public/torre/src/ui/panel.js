// Atualiza HUD e painel lateral (chamado a cada 0,2 s)
import { MPF } from '../data/constants.js';
import { ERAS, eraAt } from '../data/eras.js';
import { S } from '../sim/state.js';
import { rates, isCapped, bottleneck, offlineMax } from '../sim/economy.js';
import { peAvailable } from '../sim/talents.js';
import { clamp } from '../render/canvas.js';
import { V } from '../render/view.js';
import { MODES } from '../render/scene.js';
import { $, setText, setHTML } from './dom.js';
import { fmt, fmtM } from './format.js';
import { updateTree } from './upgrades.js';
import { updateBusiness, businessAlert } from './business.js';
import { updateMap, mapOpen, openMap } from './talentMap.js';

const HINT = {
  prod: 'Gargalo na produção: contrate fornecedores em Fornecimento.',
  tran: 'Gargalo no transporte: o material demora a subir. Melhore os elevadores em Logística.',
  lay: 'Gargalo no assentamento: contrate e treine pedreiros em Mão de obra.',
};
const FLOW = [['prod', 'Produção'], ['tran', 'Transporte'], ['lay', 'Assentamento']];

// Aviso temporário que substitui a dica do gargalo (ex.: resumo offline)
let notice = null;
export const setNotice = msg => { notice = msg; };

// ---------- páginas do painel ----------
let page = 'obra';
const pageBtns = document.querySelectorAll('#pages [data-page]');
// Construção e Negócios trocam o painel; Árvore abre o mapa em tela cheia
pageBtns.forEach(b => b.onclick = () => b.dataset.page === 'arv' ? openMap() : showPage(b.dataset.page));
export function showPage(p) {
  page = p;
  pageBtns.forEach(b => { if (b.dataset.page !== 'arv') b.setAttribute('aria-selected', b.dataset.page === p); });
  ['obra', 'neg'].forEach(id => $('pg-' + id).hidden = id !== p);
  updateUI();
}

export function updateUI() {
  const R = rates(), m = S.floors * MPF, e = eraAt(m);
  // HUD
  setText($('alt'), fmtM(m)); setText($('eraName'), ERAS[e].n);
  setText($('money'), 'R$ ' + fmt(S.money));
  setText($('rent'), (R.net >= 0 ? '+' : '') + 'R$ ' + fmt(R.net) + '/s' + (R.bank.share > 0 ? ` (${Math.round(R.bank.share * 100)}% ao banco)` : ''));
  if (e + 1 < ERAS.length) {
    const a = ERAS[e].m, b = ERAS[e + 1].m;
    $('eraFill').style.width = clamp((m - a) / (b - a) * 100, 0, 100) + '%';
    setText($('eraNext'), 'Próxima: ' + ERAS[e + 1].n); setText($('eraLeft'), 'faltam ' + fmtM(b - m));
  } else {
    const a = ERAS[e].m;
    $('eraFill').style.width = ((m - a) / 1e6 * 100 % 100) + '%';
    setText($('eraNext'), 'Sem limite acima'); setText($('eraLeft'), '');
  }
  // canteiro
  setText($('floors'), fmt(Math.floor(S.floors))); setText($('cap'), fmt(R.capF) + ' andares'); setText($('fcost'), fmt(R.fcost));
  const capped = isCapped(R), eff = capped ? 0 : Math.min(R.prod, R.tran, R.lay);
  setText($('fpm'), fmt(eff / R.fcost * 60)); $('capWarn').hidden = !capped; setText($('modeName'), MODES[V.mode]);
  setText($('footTxt'), `Salvo neste navegador. O progresso continua por até ${fmt(offlineMax() / 3600)} h fora do jogo.`);

  // Construção
  let canObra;
  if (page === 'obra') {
    const mx = Math.max(R.prod, R.tran, R.lay), neck = bottleneck(R);
    FLOW.forEach(([k, n]) => {
      $('b-' + k).firstElementChild.style.width = (R[k] / mx * 100) + '%'; $('b-' + k).classList.toggle('neck', k === neck);
      setText($('v-' + k), fmt(R[k]) + '/s'); setHTML($('l-' + k), n + (k === neck ? '<span class="chip">gargalo</span>' : ''));
    });
    setText($('neckHint'), notice || HINT[neck]);
    setText($('s-ground'), 'Esperando no térreo: ' + fmt(S.ground)); setText($('s-top'), 'No topo: ' + fmt(S.top));
  }
  canObra = updateTree();

  updateBusiness(page === 'neg');
  if (mapOpen()) updateMap();

  // indicadores nas abas de página
  const pe = peAvailable();
  pageBtns.forEach(b => {
    const p = b.dataset.page;
    if (p === 'arv') { const pill = b.querySelector('.pill'); pill.hidden = pe <= 0; setText(pill, pe + ' PE'); return; }
    b.querySelector('.dot').hidden = p === page || !(p === 'obra' ? canObra : businessAlert());
  });
}
