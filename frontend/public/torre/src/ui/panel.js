// Atualiza a interface (chamado a cada 0,2 s): indicadores do topo, cartão Construção,
// melhorias, próximo objetivo e a barra de painéis (que revela sistemas conforme o progresso).
import { MPF } from '../data/constants.js';
import { ERAS, eraAt } from '../data/eras.js';
import { UP, BRANCHES } from '../data/upgrades.js';
import { S } from '../sim/state.js';
import { rates, isCapped, bottleneck, offlineMax, cost } from '../sim/economy.js';
import { peAvailable } from '../sim/talents.js';
import { clamp } from '../render/canvas.js';
import { V } from '../render/view.js';
import { MODES } from '../render/scene.js';
import { $, setText, setHTML } from './dom.js';
import { fmt, fmtM } from './format.js';
import { updateUpgrades, NECK_BRANCH } from './upgrades.js';
import { updateBusiness, businessAlert } from './business.js';
import { updateMap, mapOpen, openMap } from './talentMap.js';

const NECK_NAME = { prod: 'produção', tran: 'transporte', lay: 'assentamento', cap: 'fundação no limite' };
const FLOW = [['prod', 'Produção'], ['tran', 'Transporte'], ['lay', 'Assentamento']];
const BANK_AT = 60; // m: o banco aparece a partir daqui

// Aviso temporário no lugar da dica do gargalo (ex.: resumo offline)
let notice = null;
export const setNotice = msg => { notice = msg; };

// ---------- painéis ----------
let page = 'obra';
const navBtns = document.querySelectorAll('#nav [data-nav]');
navBtns.forEach(b => b.onclick = () => b.dataset.nav === 'eng' ? openMap() : showPage(b.dataset.nav));
export function showPage(p) {
  page = p;
  navBtns.forEach(b => { if (b.dataset.nav !== 'eng') b.toggleAttribute('aria-current', b.dataset.nav === p); });
  ['obra', 'imoveis', 'banco'].forEach(id => $('pg-' + id).hidden = id !== p);
  $('pg-' + p).parentElement.scrollTop = 0;
  updateUI();
}

export function updateUI() {
  const R = rates(), m = S.floors * MPF, e = eraAt(m), capped = isCapped(R);
  // topo: só o essencial
  setText($('alt'), fmtM(m)); setText($('eraName'), ERAS[e].n);
  setText($('money'), 'R$ ' + fmt(S.money));
  setText($('rent'), (R.net >= 0 ? '+' : '') + 'R$ ' + fmt(R.net) + '/s' + (R.bank.share > 0 ? ` · ${Math.round(R.bank.share * 100)}% ao banco` : ''));

  const neck = capped ? 'cap' : bottleneck(R);
  const canObra = updateUpgrades(neck);

  if (page === 'obra') {
    // construção: gargalo e progresso do andar
    setText($('modeName'), MODES[V.mode]);
    setText($('neck'), NECK_NAME[neck]);
    setText($('neckHint'), notice || (capped ? '' : `Melhore ${BRANCHES.find(b => b.id === NECK_BRANCH[neck]).n} para acelerar.`));
    const p = S.floors - Math.floor(S.floors), eff = capped ? 0 : Math.min(R.prod, R.tran, R.lay), fps = eff / R.fcost;
    $('floorFill').style.width = (capped ? 100 : p * 100) + '%';
    setText($('floorPct'), capped ? 'Obra parada' : `${Math.floor(p * 100)}% do próximo andar`);
    setText($('floorTime'), !fps ? '' : fps >= 1 ? `${fmt(fps)} andares/s` : `~${fmt(1 / fps)} s por andar`);
    $('capWarn').hidden = !capped;
    if ($('pg-obra').querySelector('details').open) {
      const mx = Math.max(R.prod, R.tran, R.lay), bn = bottleneck(R);
      FLOW.forEach(([k, n]) => {
        $('b-' + k).firstElementChild.style.width = (R[k] / mx * 100) + '%'; $('b-' + k).classList.toggle('neck', k === bn);
        setText($('v-' + k), fmt(R[k]) + '/s'); setHTML($('l-' + k), n + (k === bn ? '<span class="chip">gargalo</span>' : ''));
      });
      setText($('floors'), fmt(Math.floor(S.floors))); setText($('cap'), fmt(R.capF));
      setText($('fcost'), fmt(R.fcost)); setText($('fpm'), fmt(fps * 60));
      setText($('s-ground'), fmt(S.ground)); setText($('s-top'), fmt(S.top));
    }
    // próximo objetivo
    if (capped) {
      const c = cost('fundacao');
      setText($('goalTitle'), 'Reforçar a fundação');
      setText($('goalSub'), `${UP.fundacao.n} custa R$ ${fmt(c)}`);
      $('goalFill').style.width = clamp(S.money / c * 100, 0, 100) + '%';
    } else if (e + 1 < ERAS.length) {
      const a = ERAS[e].m, b = ERAS[e + 1].m;
      const nx = ERAS[e + 1].n;
      setText($('goalTitle'), `Chegar ${nx === 'Espaço' ? 'ao' : 'à'} ${nx}`);
      setText($('goalSub'), `Faltam ${fmtM(b - m)} · abre o anel ${e + 2} da Engenharia`);
      $('goalFill').style.width = clamp((m - a) / (b - a) * 100, 0, 100) + '%';
    } else {
      setText($('goalTitle'), 'Subir sem limite');
      setText($('goalSub'), 'Você chegou à última era.');
      $('goalFill').style.width = '100%';
    }
  }

  updateBusiness(page);
  if (mapOpen()) updateMap();
  setText($('footTxt'), `Salvo neste navegador · continua por até ${fmt(offlineMax() / 3600)} h fora do jogo.`);

  // barra de painéis: revelação gradual e avisos
  const pe = peAvailable();
  navBtns.forEach(b => {
    const p = b.dataset.nav;
    if (p === 'banco') b.hidden = S.maxAlt < BANK_AT && S.debt <= 0;
    if (p === 'eng') { const pill = b.querySelector('.pill'); pill.hidden = pe <= 0; setText(pill, pe + ' PE'); return; }
    const alert = p === 'obra' ? canObra : p === 'imoveis' ? businessAlert() : S.inDefault;
    b.querySelector('.dot').hidden = p === page || !alert;
  });
}
