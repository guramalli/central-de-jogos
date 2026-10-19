// Lista de melhorias compradas com dinheiro, por ramo
import { BRANCHES, UP, KEYS } from '../data/upgrades.js';
import { S, save } from '../sim/state.js';
import { cost, unlocked, maxed, canBuy, buy } from '../sim/economy.js';
import { V } from '../render/view.js';
import { $, setText } from './dom.js';
import { fmt, fmtM } from './format.js';

const tabsEl = $('tabs'), treeEl = $('tree');
let tab = 'obra';

function depth(k) { let d = 0, c = UP[k]; while (c.req) { d++; c = UP[c.req[0]]; } return d; }

function reqText(k) {
  const u = UP[k], parts = [];
  if (u.req && S.lv[u.req[0]] < u.req[1]) parts.push(`${UP[u.req[0]].n} nível ${u.req[1]}`);
  if (u.reqAlt && S.maxAlt < u.reqAlt) parts.push(`torre com ${fmtM(u.reqAlt)}`);
  return 'Requer ' + parts.join(' e ');
}

export function renderTabs() {
  tabsEl.innerHTML = '';
  BRANCHES.forEach(b => {
    const bt = document.createElement('button');
    bt.role = 'tab'; bt.id = 'tab-' + b.id; bt.setAttribute('aria-selected', b.id === tab); bt.textContent = b.n;
    bt.onclick = () => { tab = b.id; renderTabs(); renderTree(); };
    const dot = document.createElement('span'); dot.className = 'dot'; dot.hidden = true; bt.appendChild(dot);
    tabsEl.appendChild(bt);
  });
}

export function renderTree() {
  treeEl.innerHTML = '';
  KEYS.filter(k => UP[k].b === tab).forEach(k => {
    const u = UP[k]; const bt = document.createElement('button');
    bt.className = 'node d' + depth(k); bt.id = 'n-' + k;
    bt.innerHTML = `<span class="nm">${u.n}</span><span class="lv"></span><span class="ds">${u.d}</span><span class="ct"></span>`;
    bt.onclick = () => onBuy(k);
    treeEl.appendChild(bt);
  });
  updateTree();
}

function onBuy(k) {
  if (!buy(k)) return;
  if (k === 'elevador') V.elev[S.lv.elevador - 1] = Math.random();
  updateTree(); save();
}

// devolve true se há algo comprável em algum ramo (para o pontinho da página)
export function updateTree() {
  KEYS.forEach(k => {
    const el = $('n-' + k); if (!el) return;
    const ok = unlocked(k), mx = maxed(k), can = canBuy(k);
    setText(el.querySelector('.lv'), mx ? 'MÁX' : 'Nv ' + S.lv[k]);
    setText(el.querySelector('.ct'), !ok ? reqText(k) : mx ? 'Nível máximo' : 'R$ ' + fmt(cost(k)));
    const cls = 'node d' + depth(k) + (!ok ? ' locked' : mx ? ' max' : can ? ' can' : ' cant');
    if (el.className !== cls) el.className = cls;
    el.disabled = !ok || mx || !can;
  });
  let anyAll = false;
  BRANCHES.forEach(b => {
    const any = KEYS.some(k => UP[k].b === b.id && canBuy(k));
    anyAll ||= any;
    const d = document.querySelector('#tab-' + b.id + ' .dot'); if (d) d.hidden = !any || b.id === tab;
  });
  return anyAll;
}
