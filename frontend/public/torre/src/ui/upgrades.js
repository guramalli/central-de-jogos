// Melhorias compradas com dinheiro: uma lista única, com as categorias como cabeçalhos.
// Só aparece o que já está liberado; a categoria do gargalo atual sobe para o topo e fica destacada;
// no fim, uma linha curta avisa o que está perto de liberar.
import { BRANCHES, UP, KEYS } from '../data/upgrades.js';
import { S, save } from '../sim/state.js';
import { cost, unlocked, maxed, canBuy, buy } from '../sim/economy.js';
import { upgradeImpact } from '../sim/preview.js';
import { V } from '../render/view.js';
import { $, setText } from './dom.js';
import { fmt, fmtM } from './format.js';

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
    if (u.req && S.lv[u.req[0]] < u.req[1]) out.push(`${u.n} (${UP[u.req[0]].n} nível ${u.req[1]})`);
    else if (u.reqAlt) out.push(`${u.n} (torre com ${fmtM(u.reqAlt)})`);
  }
  return out.slice(0, 3);
}

let lastNeck = 'tran';
// neck: 'prod' | 'tran' | 'lay' | 'cap'. Devolve true se há algo comprável.
export function updateUpgrades(neck) {
  lastNeck = neck;
  const hot = NECK_BRANCH[neck];
  const cats = [hot, ...BRANCHES.map(b => b.id).filter(b => b !== hot)];
  const vis = cats.map(b => [b, KEYS.filter(k => UP[k].b === b && unlocked(k) && !maxed(k) && shown(k))]).filter(([, ks]) => ks.length);
  const sn = soon();
  const key = vis.map(([b, ks]) => b + ':' + ks.join(',')).join('|') + '#' + sn.join(',');
  if (key !== builtKey) {
    builtKey = key;
    listEl.innerHTML = '';
    vis.forEach(([b, ks]) => {
      const h = document.createElement('div');
      h.className = 'upcat' + (b === hot ? ' hot' : '');
      h.innerHTML = BRANCHES.find(x => x.id === b).n + (b === hot ? '<span class="chip">gargalo</span>' : '');
      listEl.appendChild(h);
      ks.forEach(k => {
        const row = document.createElement('div');
        row.className = 'up' + (b === hot ? ' hot' : ''); row.id = 'up-' + k;
        row.innerHTML = `<span class="nm">${UP[k].n}<small></small></span><span class="ds">${UP[k].d}</span><span class="fx"></span><button class="btn sm buy"></button>`;
        row.querySelector('.buy').onclick = () => onBuy(k);
        listEl.appendChild(row);
      });
    });
    if (sn.length) {
      const d = document.createElement('div');
      d.className = 'upsoon'; d.textContent = 'Em breve: ' + sn.join(' · ');
      listEl.appendChild(d);
    }
  }
  let any = false;
  vis.forEach(([, ks]) => ks.forEach(k => {
    const row = $('up-' + k); if (!row) return;
    const can = canBuy(k); any ||= can;
    setText(row.querySelector('small'), 'Nv ' + S.lv[k]);
    const bt = row.querySelector('.buy');
    setText(bt, 'R$ ' + fmt(cost(k)));
    bt.disabled = !can;
    bt.setAttribute('aria-label', `${UP[k].n}, R$ ${fmt(cost(k))}`);
    // antes → depois com as fórmulas reais; avisa quando o gargalo impede o ganho
    const im = upgradeImpact(k), fx = row.querySelector('.fx');
    setText(fx, im ? im.text : '');
    fx.hidden = !im;
    if (im) fx.classList.toggle('meh', !im.good);
  }));
  return any;
}
