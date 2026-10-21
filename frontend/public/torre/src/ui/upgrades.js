// Melhorias compradas com dinheiro: uma lista única, com as categorias como cabeçalhos.
// Só aparece o que já está liberado; a categoria do gargalo atual sobe para o topo e fica destacada;
// no fim, uma linha curta avisa o que está perto de liberar.
import { BRANCHES, UP, KEYS } from '../data/upgrades.js';
import { S, save } from '../sim/state.js';
import { cost, unlocked, maxed, canBuy, buy } from '../sim/economy.js';
import { upgradeImpact, priorityScore } from '../sim/preview.js';
import { FLAGS } from '../data/flags.js';
import { VIVA } from '../data/viva.js';
import { V } from '../render/view.js';
import { $, setText } from './dom.js';
import { fmtM, din } from './format.js';
import { t } from '../i18n.js';

const BANK_AT = 60; // m: a melhoria do banco só aparece junto com o painel do banco
const shown = k => k !== 'banco' || S.maxAlt >= BANK_AT || S.debt > 0;

const listEl = $('ups');
// categoria que resolve cada gargalo
export const NECK_BRANCH = { prod: 'forn', tran: 'log', lay: 'obra', cap: 'eng' };
let builtKey = '';

function onBuy(k) {
  if (!buy(k)) return;
  if (k === 'elevador') V.elev[S.lv.elevador - 1] = Math.random();
  save(); updateUpgrades(lastNeck);
}

// melhorias trancadas a um passo de liberar
function soon() {
  const out = [];
  for (const k of KEYS) {
    const u = UP[k];
    if (unlocked(k) || maxed(k)) continue;
    if (u.req && !unlocked(u.req[0])) continue; // ainda dois passos longe
    if (u.req && S.lv[u.req[0]] < u.req[1]) out.push(t('{0} ({1} nível {2})', t(u.n), t(UP[u.req[0]].n), u.req[1]));
    else if (u.reqAlt) out.push(t('{0} (torre com {1})', t(u.n), fmtM(u.reqAlt)));
  }
  return out.slice(0, 3);
}

let lastNeck = 'tran';
const row = (k, hot) => {
  const el = document.createElement('div');
  el.className = 'up' + (hot ? ' hot' : ''); el.id = 'up-' + k;
  el.innerHTML = `<span class="nm">${t(UP[k].n)}<small></small></span><span class="ds">${t(UP[k].d)}</span><span class="fx"></span><button class="btn sm buy"></button>`;
  el.querySelector('.buy').onclick = () => onBuy(k);
  return el;
};
const catHead = (b, hot) => {
  const h = document.createElement('div');
  h.className = 'upcat' + (hot ? ' hot' : '');
  h.innerHTML = t(BRANCHES.find(x => x.id === b).n) + (hot ? '<span class="chip">' + t('gargalo') + '</span>' : '');
  return h;
};

// Protótipo Obra Viva: no máximo VIVA.priority compras em destaque, escolhidas pelo ganho real por real gasto.
// A escolha só é refeita depois de uma compra ou a cada 5 s, para a lista não ficar pulando.
let topCache = [], topT = -1e9, topLv = '';
function topPicks(visKeys) {
  const lvKey = JSON.stringify(S.lv), now = performance.now();
  if (lvKey !== topLv || now - topT > 5000 || topCache.some(k => !visKeys.includes(k))) {
    topCache = visKeys.map(k => [k, priorityScore(k)]).sort((x, y) => y[1] - x[1]).slice(0, VIVA.priority).map(x => x[0]);
    topT = now; topLv = lvKey;
  }
  return topCache;
}

// neck: 'prod' | 'tran' | 'lay' | 'cap'. Devolve true se há algo comprável.
export function updateUpgrades(neck) {
  lastNeck = neck;
  const hot = NECK_BRANCH[neck];
  const cats = [hot, ...BRANCHES.map(b => b.id).filter(b => b !== hot)];
  let vis = cats.map(b => [b, KEYS.filter(k => UP[k].b === b && unlocked(k) && !maxed(k) && shown(k))]).filter(([, ks]) => ks.length);
  const top = FLAGS.viva ? topPicks(vis.flatMap(([, ks]) => ks)) : [];
  if (top.length) vis = vis.map(([b, ks]) => [b, ks.filter(k => !top.includes(k))]).filter(([, ks]) => ks.length);
  const sn = soon();
  const key = top.join(',') + '|' + vis.map(([b, ks]) => b + ':' + ks.join(',')).join('|') + '#' + sn.join(',');
  if (key !== builtKey) {
    builtKey = key;
    const wasOpen = !!(listEl.querySelector('details') || {}).open;
    listEl.innerHTML = '';
    let into = listEl;
    if (top.length) {
      const h = document.createElement('div'); h.className = 'upcat'; h.textContent = t('Melhor compra agora');
      listEl.appendChild(h);
      top.forEach(k => listEl.appendChild(row(k, false)));
      const n = vis.reduce((a, [, ks]) => a + ks.length, 0);
      if (n) {
        const d = document.createElement('details'); d.className = 'upmore'; d.open = wasOpen;
        d.innerHTML = `<summary>${t('Mais melhorias ({0})', n)}</summary>`;
        listEl.appendChild(d); into = d;
      }
    }
    vis.forEach(([b, ks]) => {
      into.appendChild(catHead(b, b === hot && !top.length));
      ks.forEach(k => into.appendChild(row(k, b === hot && !top.length)));
    });
    if (sn.length) {
      const d = document.createElement('div');
      d.className = 'upsoon'; d.textContent = t('Em breve: {0}', sn.join(' · '));
      into.appendChild(d);
    }
  }
  let any = false;
  [...top, ...vis.flatMap(([, ks]) => ks)].forEach(k => {
    const el = $('up-' + k); if (!el) return;
    const can = canBuy(k); any ||= can;
    setText(el.querySelector('small'), t('Nv {0}', S.lv[k]));
    const bt = el.querySelector('.buy');
    setText(bt, din(cost(k)));
    bt.disabled = !can;
    bt.setAttribute('aria-label', `${t(UP[k].n)}, ${din(cost(k))}`);
    // antes → depois com as fórmulas reais; avisa quando o gargalo impede o ganho
    const im = upgradeImpact(k), fx = el.querySelector('.fx');
    setText(fx, im ? im.text : '');
    fx.hidden = !im;
    if (im) fx.classList.toggle('meh', !im.good);
  });
  return any;
}
