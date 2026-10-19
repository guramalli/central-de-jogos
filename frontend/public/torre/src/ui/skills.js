// Melhorias (modo Obra Viva) — tela cheia no estilo das árvores de habilidade de jogos de ação:
// abas coloridas por ramo, árvore subindo de baixo para cima, painel do nó com prévia animada.
// Nada aqui aponta o gargalo: o efeito mostrado é só o da própria etapa (o jogador descobre na obra).
import { FH, MPF } from '../data/constants.js';
import { UP } from '../data/upgrades.js';
import { TBRANCHES } from '../data/talents.js';
import { SKILL_LAYOUT as LAYOUT } from '../data/skillTree.js';
import { VIVA } from '../data/viva.js';
import { S, save } from '../sim/state.js';
import { cost, unlocked, maxed, canBuy, buy } from '../sim/economy.js';
import { upgradeEffect } from '../sim/preview.js';
import { peAvailable, peEarned } from '../sim/talents.js';
import { withTarget } from '../render/canvas.js';
import { render } from '../render/scene.js';
import { SHAFT_X } from '../render/tower.js';
import { V } from '../render/view.js';
import { $, setText, setHTML } from './dom.js';
import { fmt, fmtM } from './format.js';
import { openMap } from './talentMap.js';
import { updateBusiness } from './business.js';

const COLOR = Object.fromEntries(TBRANCHES.map(b => [b.id, b.color]));
const BANK_AT = 60; // m

// Ramos da obra, na ordem do caminho do material. ico: caminho SVG 16×16
const TABS = [
  { id: 'forn', n: 'Fornecimento', step: 0, d: 'Quanto material chega à obra: fornecedores, caminhões, olaria e fábrica.', ico: 'M1 11V5h8v6zm9 0V7h3l2 2v2zM3 13a1.5 1.5 0 1 0 0-.1zm9 0a1.5 1.5 0 1 0 0-.1z' },
  { id: 'log', n: 'Logística', step: 1, d: 'Quão rápido o material sobe até o topo: elevadores, motores e carrinhos.', ico: 'M4 1h8v14H4zm2 2v4h4V3zm0 6v4h4V9z' },
  { id: 'obra', n: 'Mão de obra', step: 2, d: 'Quão rápido a equipe assenta tijolos, vigas e janelas lá em cima.', ico: 'M3 9a5 5 0 0 1 10 0h1v2H2V9zm4-6h2v3H7zM5 12h6v3H5z' },
  { id: 'eng', n: 'Engenharia', step: 3, d: 'Até onde a torre aguenta subir e quanto material cada andar pede.', ico: 'M2 14h12v-2H2zM4 11h2V3H4zm6 0h2V6h-2zM6 3h7v2H6z' },
  { id: 'merc', n: 'Mercado', step: 4, d: 'Quanto dinheiro a torre rende: aluguel, venda dos andares e turismo.', ico: 'M7 1h2v2a4 4 0 0 1 3 2l-2 1a2 2 0 0 0-3-1c-1 0-1 1 0 1l2 1c3 1 3 5-0 6v2H7v-2a4 4 0 0 1-3-2l2-1a2 2 0 0 0 3 1c1 0 1-1 0-1L7 9C4 8 4 4 7 3z' },
];
const EXTRA = [
  { id: 'pesq', n: 'Pesquisa', color: COLOR.cien, ico: 'M8 1l2 5h5l-4 3 2 6-5-4-5 4 2-6-4-3h5z' },
  { id: 'neg', n: 'Negócios', color: '#d8d2c0', ico: 'M5 3V1h6v2h4v11H1V3zm2 0h2V2H7z' },
];
const FLOW = ['Caminhão', 'Elevador', 'Pedreiros', 'Torre', 'Dinheiro'];



// Onde a prévia aponta a câmera para cada melhoria
function focus(k) {
  const top = Math.floor(S.floors) * FH, b = UP[k].b;
  if (b === 'obra' || k === 'guindaste') return { cx: 10, cy: top + 46, z: 0.62 };
  if (k === 'olaria') return { cx: 400, cy: 70, z: 0.6 };
  if (b === 'forn') return { cx: 250, cy: 55, z: 0.6 };
  if (k === 'motor') return { cx: SHAFT_X(1), cy: top + 30, z: 0.75 };
  if (k === 'cacamba') return { cx: 170, cy: 45, z: 0.75 };
  if (b === 'log') return { cx: SHAFT_X(1), cy: Math.min(top, 160), z: 0.45 };
  if (k === 'fundacao') return { cx: 0, cy: 10, z: 0.5 };
  if (k === 'bilheteria' || k === 'marketing') return { cx: -220, cy: 55, z: 0.7 };
  if (k === 'heliponto') return { cx: 0, cy: top + 140, z: 0.45 };
  if (k === 'porto') return { cx: 60, cy: top + 220, z: 0.35 };
  return { cx: 0, cy: Math.max(60, top - 60), z: 0.45 }; // fachada: projeto, corretor, aluguel, banco
}

let tab = 'forn', sel = null, built = '';
const overlay = $('skills'), svg = $('skSvg'), prev = $('sdPrev'), pctx = prev.getContext('2d');
pctx.imageSmoothingEnabled = false;

const locked = k => !unlocked(k) || (k === 'banco' && S.maxAlt < BANK_AT && S.debt <= 0);
const lockText = k => {
  const u = UP[k], parts = [];
  if (u.req && S.lv[u.req[0]] < u.req[1]) parts.push(`${UP[u.req[0]].n} no nível ${u.req[1]}`);
  if (u.reqAlt && S.maxAlt < u.reqAlt) parts.push(`a torre chegar a ${fmtM(u.reqAlt)}`);
  if (k === 'banco' && S.maxAlt < BANK_AT && S.debt <= 0) parts.push(`a torre chegar a ${fmtM(BANK_AT)}`);
  return parts.length ? 'Libera quando ' + parts.join(' e ') + '.' : '';
};
const extraOn = id => id === 'pesq' ? peEarned() > 0 : S.maxAlt / MPF >= VIVA.revealAt;
const tabHasBuy = id => Object.keys(LAYOUT[id] || {}).some(k => !locked(k) && canBuy(k));

// ---------- abas e diagrama do caminho do material ----------
function renderTabs() {
  const all = [...TABS.map(t => ({ ...t, color: COLOR[t.id] })), ...EXTRA.filter(e => extraOn(e.id))];
  const key = all.map(t => t.id).join(',') + '|' + tab;
  if (key === built) return;
  built = key;
  $('skTabs').innerHTML = all.map(t => `
    <button role="tab" data-tab="${t.id}" aria-selected="${t.id === tab}" style="--c:${t.color}">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="${t.ico}"/></svg><span>${t.n}</span><i class="dot" hidden></i>${t.id === 'pesq' ? '<em class="pe"></em>' : ''}
    </button>`).join('');
  $('skTabs').querySelectorAll('[data-tab]').forEach(b => b.onclick = () => pickTab(b.dataset.tab));
}
function renderFlow() {
  const t = TABS.find(x => x.id === tab);
  const chips = FLOW.map((n, i) => {
    const on = t && t.step === i, c = on ? COLOR[t.id] : '';
    return `<span class="chip-step${on ? ' on' : ''}" style="--c:${c}">${n}</span>`;
  }).join('<span class="arrow">→</span>');
  setHTML($('skFlow'), t ? `<div class="steps">${chips}</div><div class="sk-tabdesc">${t.d}</div>` : '');
}

function pickTab(id) {
  if (id === 'pesq') { openMap(); return; } // a Árvore de Engenharia abre por cima; ao fechar, volta aqui
  tab = id; sel = null; built = '';
  const neg = id === 'neg';
  $('skTree').hidden = neg; $('skDetail').hidden = neg; $('skNeg').hidden = !neg;
  renderTabs(); renderFlow();
  if (!neg) { buildTree(); selectDefault(); }
  updateSkills();
}

// ---------- árvore (SVG) ----------
const NS = 'http://www.w3.org/2000/svg';
const mk = (tag, a, parent) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); parent && parent.appendChild(e); return e; };
const hex = r => Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 6 + i * Math.PI / 3; return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`; }).join(' ');
const CX = 140, RY = 108;
const pos = (col, row) => [col * CX, -row * RY];

let nodeEls = {};
function buildTree() {
  svg.innerHTML = ''; nodeEls = {};
  const L = LAYOUT[tab], c = COLOR[tab];
  const rows = Math.max(...Object.values(L).map(v => v[1]));
  svg.setAttribute('viewBox', `${-CX * 1.7} ${-rows * RY - 60} ${CX * 3.4} ${rows * RY + 140}`);
  svg.style.setProperty('--c', c);
  const g = mk('g', {}, svg);
  // linhas (base → raízes, pai → filho)
  for (const k in L) {
    const [col, row, from] = L[k], [x1, y1] = pos(col, row), [x0, y0] = from ? pos(L[from][0], L[from][1]) : [0, 0];
    mk('line', { x1: x0, y1: y0, x2: x1, y2: y1, class: 'sk-edge', 'data-k': k }, g);
  }
  // base do ramo
  const base = mk('g', { class: 'sk-base', transform: 'translate(0 0)' }, g);
  mk('circle', { r: 26 }, base);
  const t = TABS.find(x => x.id === tab);
  const ic = mk('svg', { x: -12, y: -12, width: 24, height: 24, viewBox: '0 0 16 16' }, base); mk('path', { d: t.ico }, ic);
  // nós
  for (const k in L) {
    const [col, row] = L[k], [x, y] = pos(col, row);
    const n = mk('g', { class: 'sk-node', transform: `translate(${x} ${y})`, 'data-k': k, tabindex: 0, role: 'button' }, g);
    mk('polygon', { points: hex(38), class: 'halo' }, n);
    mk('polygon', { points: hex(30), class: 's' }, n);
    const lv = mk('text', { class: 'lvl', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, n);
    const lk = mk('g', { class: 'lock' }, n); mk('rect', { x: -7, y: -2, width: 14, height: 11, rx: 1 }, lk); mk('path', { d: 'M-4 -2v-4a4 4 0 0 1 8 0v4', fill: 'none', 'stroke-width': 2.5 }, lk);
    // nome embaixo do nó, em até duas linhas
    const nm = mk('text', { class: 'nm', y: 50, 'text-anchor': 'middle' }, n), words = UP[k].n.split(' ');
    const lines = words.length > 1 && UP[k].n.length > 13 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [UP[k].n];
    lines.forEach((t, i) => { const ts = mk('tspan', { x: 0, dy: i ? 15 : 0 }, nm); ts.textContent = t; });
    n.onclick = () => select(k);
    n.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(k); } };
    nodeEls[k] = { n, lv, cls: '' };
  }
}

function selectDefault() {
  const ks = Object.keys(LAYOUT[tab]);
  const open = ks.filter(k => !locked(k) && !maxed(k)).sort((a, b) => cost(a) - cost(b));
  select(open[0] || ks[0]);
}
function select(k) { sel = k; updateSkills(); }

// ---------- painel do nó ----------
function drawDetail() {
  if (!sel || tab === 'neg') return;
  const u = UP[sel], c = COLOR[u.b], lk = locked(sel), mx = maxed(sel), can = !lk && canBuy(sel);
  $('skDetail').style.setProperty('--c', c);
  setText($('sdKind'), TABS.find(t => t.id === u.b).n);
  setText($('sdName'), u.n);
  setHTML($('sdLv'), u.max !== undefined
    ? Array.from({ length: u.max }, (_, i) => `<i class="${i < S.lv[sel] ? 'on' : ''}"></i>`).join('') + `<span>Nv ${S.lv[sel]} de ${u.max}</span>`
    : `<span>Nível ${S.lv[sel]}</span>`);
  setText($('sdDesc'), u.d);
  const fx = lk || mx ? '' : upgradeEffect(sel);
  setText($('sdFx'), fx || ''); $('sdFx').hidden = !fx;
  setText($('sdReq'), lk ? lockText(sel) : mx ? 'Nível máximo.' : '');
  const bt = $('sdBuy');
  bt.hidden = lk || mx; bt.disabled = !can;
  setText(bt, `Comprar · R$ ${fmt(cost(sel))}`);
}

// prévia animada: a própria cena, com a câmera onde a melhoria aparece e o nível seguinte aplicado
function drawPreview() {
  if (!sel || tab === 'neg' || overlay.hidden) return;
  const k = sel, up = !locked(k) && !maxed(k);
  if (up) S.lv[k]++;
  try {
    pctx.imageSmoothingEnabled = false;
    withTarget(pctx, prev.width, prev.height, focus(k), render);
  } finally { if (up) S.lv[k]--; }
}

function onBuy() {
  if (!sel || locked(sel) || !buy(sel)) return;
  if (sel === 'elevador') V.elev[S.lv.elevador - 1] = Math.random();
  save(); updateSkills();
}

// ---------- atualização ----------
export function updateSkills() {
  if (overlay.hidden) return;
  renderTabs();
  setText($('skMoney'), 'R$ ' + fmt(S.money));
  $('skTabs').querySelectorAll('[data-tab]').forEach(b => {
    const id = b.dataset.tab, d = b.querySelector('.dot');
    if (d) d.hidden = id === tab || !(LAYOUT[id] ? tabHasBuy(id) : id === 'pesq' ? peAvailable() > 0 : false);
    const pe = b.querySelector('.pe'); if (pe) { setText(pe, String(peAvailable())); pe.hidden = peAvailable() <= 0; }
  });
  if (tab === 'neg') {
    $('bankCard').hidden = S.maxAlt < BANK_AT && S.debt <= 0; // banco aparece a partir de 60 m, como no modo clássico
    updateBusiness('imoveis'); updateBusiness('banco'); return;
  }
  for (const k in nodeEls) {
    const e = nodeEls[k], lk = locked(k), mx = maxed(k), lv = S.lv[k];
    setText(e.lv, lk ? '' : String(lv));
    const cls = 'sk-node' + (lk ? ' locked' : mx ? ' max' : canBuy(k) ? ' can' : lv > 0 ? ' own' : ' open') + (k === sel ? ' sel' : '');
    if (cls !== e.cls) { e.n.setAttribute('class', cls); e.cls = cls; }
  }
  svg.querySelectorAll('.sk-edge').forEach(l => l.classList.toggle('on', S.lv[l.dataset.k] > 0));
  drawDetail();
}
export const tickSkills = () => drawPreview();
export const skillsOpen = () => !overlay.hidden;

// algo para comprar ou pontos para gastar? (pontinho no botão Melhorias)
export const anyToBuy = () => TABS.some(t => tabHasBuy(t.id)) || peAvailable() > 0;

let opener = null;
export function openSkills() {
  opener = document.activeElement;
  overlay.hidden = false; built = '';
  pickTab(tab);
  $('skClose').focus();
}
export function closeSkills() {
  overlay.hidden = true;
  if (opener && opener.focus) opener.focus();
}

// Negócios: os cards de imóveis, turismo e banco moram aqui no modo Obra Viva
export function initSkills() {
  const neg = $('skNeg');
  for (const id of ['pg-imoveis', 'pg-banco']) { const pg = $(id); while (pg.firstChild) neg.appendChild(pg.firstChild); }
  const bank = neg.querySelector('#k-tier'); if (bank) bank.closest('.card').id = 'bankCard';
  $('openUp').onclick = openSkills;
  $('skClose').onclick = closeSkills;
  $('sdBuy').onclick = onBuy;
  addEventListener('keydown', e => { if (e.key === 'Escape' && !e.defaultPrevented && !overlay.hidden && $('tmap').hidden) closeSkills(); });
}
