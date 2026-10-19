// Árvore única de avanços (modo Obra Viva), no estilo das árvores de habilidade de jogos de ação:
// um tronco (a obra) embaixo, seis ramos coloridos subindo lado a lado. Embaixo de cada ramo, as compras com
// dinheiro (hexágonos); acima, as estrelas de Pesquisa pagas com Pontos de Engenharia, anel por anel, com névoa
// nos anéis que ainda não abriram. Painel à direita com o efeito e uma prévia animada na própria cena.
// Nada aqui aponta o gargalo: o efeito mostrado é só o da própria etapa (o jogador descobre na obra).
import { FH, MPF } from '../data/constants.js';
import { UP } from '../data/upgrades.js';
import { NODES, EDGES, TBRANCHES, CENTER, RINGS, describeEffect, ringEraName, KIND_LABEL } from '../data/talents.js';
import { SKILL_LAYOUT, COLS, BW, RES0, RING, colX, upgradePos, researchPos, researchRoot, BASE_POS, SHORT } from '../data/skillTree.js';
import { VIVA } from '../data/viva.js';
import { S, save } from '../sim/state.js';
import { cost, unlocked, maxed, canBuy, buy } from '../sim/economy.js';
import { upgradeEffect } from '../sim/preview.js';
import { peAvailable, learn, learnBlock, owned, ringOpen, respec } from '../sim/talents.js';
import { withTarget } from '../render/canvas.js';
import { render } from '../render/scene.js';
import { SHAFT_X } from '../render/tower.js';
import { V } from '../render/view.js';
import { $, setText, setHTML } from './dom.js';
import { fmt, fmtM } from './format.js';
import { updateBusiness } from './business.js';

const COLOR = Object.fromEntries(TBRANCHES.map(b => [b.id, b.color]));
const PE_COLOR = '#a08ae8';
const BANK_AT = 60; // m

// o que cada ramo melhora (legenda embaixo da coluna)
const BRANCH_INFO = {
  obra: ['Mão de obra', 'quão rápido a equipe assenta'],
  forn: ['Fornecimento', 'quanto material chega'],
  log: ['Logística', 'quão rápido o material sobe'],
  eng: ['Engenharia', 'até onde a torre aguenta'],
  merc: ['Mercado', 'quanto dinheiro a torre rende'],
  cien: ['Ciência', 'pesquisas que valem para tudo'],
};

// onde a prévia aponta a câmera para cada melhoria
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

const overlay = $('skills'), svg = $('skSvg'), prev = $('sdPrev'), pctx = prev.getContext('2d');
pctx.imageSmoothingEnabled = false;

// seleção: { t: 'up', k } (compra com dinheiro) ou { t: 'pe', id } (estrela de Pesquisa)
let sel = null, built = false;

const lockedUp = k => !unlocked(k) || (k === 'banco' && S.maxAlt < BANK_AT && S.debt <= 0);
const lockText = k => {
  const u = UP[k], parts = [];
  if (u.req && S.lv[u.req[0]] < u.req[1]) parts.push(`${UP[u.req[0]].n} no nível ${u.req[1]}`);
  if (u.reqAlt && S.maxAlt < u.reqAlt) parts.push(`a torre chegar a ${fmtM(u.reqAlt)}`);
  if (k === 'banco' && S.maxAlt < BANK_AT && S.debt <= 0) parts.push(`a torre chegar a ${fmtM(BANK_AT)}`);
  return parts.length ? 'Libera quando ' + parts.join(' e ') + '.' : '';
};

// névoa da Pesquisa: anéis abertos inteiros, o próximo como pista, os demais escondidos
let openRing = 1;
const fog = n => n.ring <= openRing ? 'open' : n.ring === openRing + 1 ? 'hint' : 'hidden';

// ---------- SVG ----------
const NS = 'http://www.w3.org/2000/svg';
const mk = (tag, a, parent) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); parent && parent.appendChild(e); return e; };
const poly = (r, n, rot) => Array.from({ length: n }, (_, i) => { const a = rot + i * 2 * Math.PI / n; return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`; }).join(' ');
const star = (r, inner = 0.45) => Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * inner : r; return `${(rr * Math.cos(a)).toFixed(1)},${(rr * Math.sin(a)).toFixed(1)}`; }).join(' ');
const Y = y => -y; // y do layout cresce para cima; no SVG cresce para baixo

let vp, upEls = {}, peEls = {}, peEdges = [], ringEls = [];

function build() {
  svg.innerHTML = ''; upEls = {}; peEls = {}; peEdges = []; ringEls = [];
  vp = mk('g', {}, svg);
  const gRings = mk('g', {}, vp), gEdges = mk('g', {}, vp), gNodes = mk('g', {}, vp);
  // faixas dos anéis (só as abertas e a próxima aparecem)
  for (let k = 1; k <= RINGS; k++) {
    const y = RES0 + (k - 1) * RING - 40;
    const g = mk('g', { class: 'sk-ring' }, gRings);
    mk('line', { x1: colX(COLS[0]) - BW / 2, x2: colX(COLS[COLS.length - 1]) + BW / 2, y1: Y(y), y2: Y(y) }, g);
    const t = mk('text', { x: colX(COLS[0]) - BW / 2 + 6, y: Y(y) - 8 }, g); t.textContent = `Pesquisa · anel ${k} · abre na era ${ringEraName(k)}`;
    ringEls.push({ k, g });
  }
  // tronco e legendas dos ramos
  const [bx, by] = BASE_POS;
  for (const b of COLS) {
    const x = colX(b), c = COLOR[b];
    mk('path', { d: `M${bx} ${Y(by)} C ${bx} ${Y(by + 40)}, ${x} ${Y(by + 20)}, ${x} ${Y(60)}`, class: 'sk-trunk', style: `--c:${c}` }, gEdges);
    const lab = mk('g', { class: 'sk-blabel', transform: `translate(${x} ${Y(-115)})`, style: `--c:${c}` }, gNodes);
    mk('rect', { x: -BW / 2 + 12, y: -22, width: BW - 24, height: 56, rx: 2 }, lab);
    const t1 = mk('text', { y: 2, 'text-anchor': 'middle', class: 'n' }, lab); t1.textContent = BRANCH_INFO[b][0];
    const t2 = mk('text', { y: 24, 'text-anchor': 'middle', class: 'd' }, lab); t2.textContent = BRANCH_INFO[b][1];
  }
  const base = mk('g', { class: 'sk-base', transform: `translate(${bx} ${Y(by)})` }, gNodes);
  mk('circle', { r: 30 }, base);
  const bt = mk('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central' }, base); bt.textContent = 'OBRA';
  // compras com dinheiro
  for (const b in SKILL_LAYOUT) {
    const L = SKILL_LAYOUT[b], c = COLOR[b];
    for (const k in L) {
      const [x, y] = upgradePos(b, k), from = L[k][2], [x0, y0] = from ? upgradePos(b, from) : [colX(b), 60];
      const e = mk('line', { x1: x0, y1: Y(y0), x2: x, y2: Y(y), class: 'sk-edge', style: `--c:${c}` }, gEdges);
      const n = mk('g', { class: 'sk-node', transform: `translate(${x} ${Y(y)})`, style: `--c:${c}`, 'data-up': k }, gNodes);
      mk('polygon', { points: poly(38, 6, Math.PI / 6), class: 'halo' }, n);
      mk('polygon', { points: poly(30, 6, Math.PI / 6), class: 's' }, n);
      const lv = mk('text', { class: 'lvl', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, n);
      const lk = mk('g', { class: 'lock' }, n); mk('rect', { x: -7, y: -2, width: 14, height: 11, rx: 1 }, lk); mk('path', { d: 'M-4 -2v-4a4 4 0 0 1 8 0v4', fill: 'none', 'stroke-width': 2.5 }, lk);
      const nm = mk('text', { class: 'nm', y: 54, 'text-anchor': 'middle' }, n); nm.textContent = SHORT[k] || UP[k].n;
      upEls[k] = { n, lv, e, cls: '' };
    }
  }
  // Pesquisa: arestas (o centro da antiga árvore radial vira uma linha pontilhada saindo do topo das compras do ramo)
  for (const [a, b] of EDGES) {
    if (a === CENTER || b === CENTER) {
      const id = a === CENTER ? b : a, root = researchRoot(NODES[id].b);
      const p0 = root ? upgradePos(NODES[id].b, root) : BASE_POS, p1 = researchPos(id);
      const l = mk('line', { x1: p0[0], y1: Y(p0[1]), x2: p1[0], y2: Y(p1[1]), class: 'sk-pedge link' }, gEdges);
      peEdges.push({ a: CENTER, b: id, el: l, cls: '' });
      continue;
    }
    // ponte entre o último e o primeiro ramo: só a ligação com o ramo do lado (a outra cruzaria a árvore toda)
    const na = NODES[a], nb = NODES[b];
    if ((na.kind === 'bridge' && na.bridge[0] === 'cien' && nb.b === 'obra') || (nb.kind === 'bridge' && nb.bridge[0] === 'cien' && na.b === 'obra')) continue;
    const p0 = researchPos(a), p1 = researchPos(b);
    const l = mk('line', { x1: p0[0], y1: Y(p0[1]), x2: p1[0], y2: Y(p1[1]), class: 'sk-pedge' }, gEdges);
    peEdges.push({ a, b, el: l, cls: '' });
  }
  // Pesquisa: nós (estrelas; notáveis maiores com nome; chaves octogonais; pontes em losango)
  for (const id in NODES) {
    if (id === CENTER) continue;
    const nd = NODES[id], [x, y] = researchPos(id), c = nd.b ? COLOR[nd.b] : PE_COLOR;
    const g = mk('g', { class: 'sk-pe', transform: `translate(${x} ${Y(y)})`, style: `--c:${c}`, 'data-pe': id }, gNodes);
    const r = nd.kind === 'key' ? 24 : nd.kind === 'notable' ? 20 : 14;
    const shape = nd.kind === 'key' ? poly(r, 8, Math.PI / 8) : nd.kind === 'bridge' ? poly(r, 4, 0) : star(r, nd.kind === 'notable' ? 0.5 : 0.45);
    mk('polygon', { points: nd.kind === 'key' ? poly(r + 7, 8, Math.PI / 8) : star(r + 8), class: 'halo' }, g);
    mk('polygon', { points: shape, class: 's' }, g);
    if (nd.kind === 'notable' || nd.kind === 'key') { const t = mk('text', { class: 'nm', y: r + 16, 'text-anchor': 'middle' }, g); t.textContent = nd.name; }
    const q = mk('text', { class: 'q', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, g); q.textContent = '?';
    peEls[id] = { g, cls: '' };
  }
  built = true;
}

// ---------- estado visual ----------
function updateTree() {
  openRing = 0; for (let k = 1; k <= RINGS; k++) if (ringOpen(k)) openRing = k;
  for (const r of ringEls) r.g.style.display = r.k <= openRing + 1 ? '' : 'none';
  for (const k in upEls) {
    const e = upEls[k], lk = lockedUp(k), mx = maxed(k), lv = S.lv[k];
    setText(e.lv, lk ? '' : String(lv));
    const isSel = sel && sel.t === 'up' && sel.k === k;
    const cls = 'sk-node' + (lk ? ' locked' : mx ? ' max' : canBuy(k) ? ' can' : lv > 0 ? ' own' : ' open') + (isSel ? ' sel' : '');
    if (cls !== e.cls) { e.n.setAttribute('class', cls); e.cls = cls; }
    e.e.classList.toggle('on', lv > 0);
  }
  for (const id in peEls) {
    const nd = NODES[id], e = peEls[id], f = fog(nd);
    let c = 'sk-pe ' + nd.kind;
    if (f === 'hidden') c += ' hidden';
    else if (f === 'hint') c += ' hint';
    else if (owned(id)) c += ' own';
    else if (!learnBlock(id)) c += ' can';
    else c += ' open';
    if (sel && sel.t === 'pe' && sel.id === id) c += ' sel';
    if (c !== e.cls) { e.g.setAttribute('class', c); e.cls = c; }
  }
  for (const e of peEdges) {
    const fa = e.a === CENTER ? 'open' : fog(NODES[e.a]), fb = fog(NODES[e.b]);
    const hide = fa === 'hidden' || fb === 'hidden';
    const on = (e.a === CENTER || owned(e.a)) && owned(e.b);
    const c = 'sk-pedge' + (e.a === CENTER ? ' link' : '') + (hide ? ' hidden' : on ? ' on' : '');
    if (c !== e.cls) { e.el.setAttribute('class', c); e.cls = c; }
  }
}

// ---------- painel ----------
function drawDetail() {
  const d = $('skDetail'), bt = $('sdBuy'), effs = $('sdEffs');
  if (!sel) return;
  if (sel.t === 'up') {
    const k = sel.k, u = UP[k], lk = lockedUp(k), mx = maxed(k), can = !lk && canBuy(k);
    d.style.setProperty('--c', COLOR[u.b]);
    setText($('sdKind'), BRANCH_INFO[u.b][0] + ' · compra com dinheiro');
    setText($('sdName'), u.n);
    setHTML($('sdLv'), u.max !== undefined
      ? Array.from({ length: u.max }, (_, i) => `<i class="${i < S.lv[k] ? 'on' : ''}"></i>`).join('') + `<span>Nv ${S.lv[k]} de ${u.max}</span>`
      : `<span>Nível ${S.lv[k]}</span>`);
    setText($('sdDesc'), u.d);
    effs.innerHTML = ''; effs.hidden = true;
    const fx = lk || mx ? '' : upgradeEffect(k);
    setText($('sdFx'), fx || ''); $('sdFx').hidden = !fx;
    prev.hidden = false;
    setText($('sdReq'), lk ? lockText(k) : mx ? 'Nível máximo.' : '');
    bt.hidden = lk || mx; bt.disabled = !can;
    setText(bt, `Comprar · R$ ${fmt(cost(k))}`);
    return;
  }
  const id = sel.id, nd = NODES[id], f = fog(nd);
  d.style.setProperty('--c', nd.b ? COLOR[nd.b] : PE_COLOR);
  setHTML($('sdLv'), '');
  prev.hidden = true; $('sdFx').hidden = true;
  const branch = nd.b ? BRANCH_INFO[nd.b][0] : nd.bridge ? nd.bridge.map(b => BRANCH_INFO[b][0]).join(' + ') : '';
  if (f !== 'open') {
    setText($('sdKind'), `Pesquisa · anel ${nd.ring} · ainda desconhecida`);
    setText($('sdName'), nd.kind === 'key' ? 'Tecnologia revolucionária' : nd.kind === 'notable' ? 'Grande avanço' : 'Pesquisa futura');
    setText($('sdDesc'), `Os engenheiros só vão entender isto na era ${ringEraName(nd.ring)}.`);
    effs.innerHTML = ''; effs.hidden = true; setText($('sdReq'), ''); bt.hidden = true;
    return;
  }
  setText($('sdKind'), `Pesquisa · ${KIND_LABEL[nd.kind]}${branch ? ' · ' + branch : ''} · anel ${nd.ring}`);
  setText($('sdName'), nd.name);
  setText($('sdDesc'), nd.desc || 'Paga com Pontos de Engenharia (★), que vêm da altura recorde da torre. Vale para sempre e pode ser redistribuída de graça.');
  const html = nd.eff.map(e => `<li>${describeEffect(e)}</li>`).join('');
  if (effs.innerHTML !== html) effs.innerHTML = html;
  effs.hidden = false;
  const own = owned(id), block = learnBlock(id);
  bt.hidden = own; bt.disabled = !!block;
  setText(bt, `Aprender · ★ ${nd.cost}`);
  setText($('sdReq'), own ? 'Aprendida.'
    : block === 'Ligue a um nó já aprendido' ? 'Precisa estar ligada a uma pesquisa que você já aprendeu (ou ao topo das compras do ramo, no anel 1).'
      : block === 'Pontos insuficientes' ? `Faltam ★ ${nd.cost - peAvailable()}. Os pontos vêm da altura da torre.`
        : block === 'Anel fechado' ? `Abre na era ${ringEraName(nd.ring)}.` : '');
}

// prévia animada: a própria cena, com a câmera onde a melhoria aparece e o nível seguinte aplicado
function drawPreview() {
  if (!sel || sel.t !== 'up' || overlay.hidden || !$('skSheet').hidden) return;
  const k = sel.k, up = !lockedUp(k) && !maxed(k);
  if (up) S.lv[k]++;
  try {
    pctx.imageSmoothingEnabled = false;
    withTarget(pctx, prev.width, prev.height, focus(k), render);
  } finally { if (up) S.lv[k]--; }
}

function select(s) { sel = s; updateSkills(); }
function onBuy() {
  if (!sel) return;
  if (sel.t === 'up') {
    if (lockedUp(sel.k) || !buy(sel.k)) return;
    if (sel.k === 'elevador') V.elev[S.lv.elevador - 1] = Math.random();
  } else if (!learn(sel.id)) return;
  save(); updateSkills();
}

// ---------- câmera da árvore (arrastar, roda, pinça) ----------
const view = { x: 0, y: 0, k: 0.4 };
const apply = () => vp && vp.setAttribute('transform', `translate(${view.x.toFixed(1)} ${view.y.toFixed(1)}) scale(${view.k.toFixed(4)})`);
const clampK = k => Math.max(0.12, Math.min(2, k));
function zoomAt(px, py, f) {
  const k = clampK(view.k * f);
  view.x = px - (px - view.x) * k / view.k; view.y = py - (py - view.y) * k / view.k; view.k = k; apply();
}
// enquadra as compras e os anéis de Pesquisa abertos
function fit() {
  const w = svg.clientWidth, h = svg.clientHeight;
  if (w < 50 || h < 50) return;
  const x0 = colX(COLS[0]) - BW / 2, x1 = colX(COLS[COLS.length - 1]) + BW / 2;
  const top = RES0 + Math.max(0, openRing) * RING + 60, bottom = -150;
  view.k = clampK(Math.min(w / (x1 - x0), h / (top - bottom)));
  view.x = w / 2 - (x0 + x1) / 2 * view.k;
  view.y = h / 2 - Y((top + bottom) / 2) * view.k;
  if (w < 600) { // celular: abre legível, com o tronco e as legendas embaixo; arrastar mostra o resto
    view.k = Math.max(view.k, 0.42);
    view.x = w / 2 - (x0 + x1) / 2 * view.k;
    view.y = h - 12 - Y(bottom) * view.k;
  }
  apply();
}
const ptrs = new Map();
let moved = 0, pinch = null, userMoved = false;
svg.addEventListener('pointerdown', e => {
  svg.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 1) moved = 0;
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), k: view.k }; }
});
svg.addEventListener('pointermove', e => {
  const p = ptrs.get(e.pointerId); if (!p) return;
  const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
  if (ptrs.size === 1) { moved += Math.abs(dx) + Math.abs(dy); if (moved > 4) { svg.classList.add('drag'); userMoved = true; view.x += dx; view.y += dy; apply(); } }
  else if (ptrs.size === 2 && pinch) {
    moved = 99; userMoved = true;
    const [a, b] = [...ptrs.values()], r = svg.getBoundingClientRect(), d = Math.hypot(a.x - b.x, a.y - b.y);
    zoomAt((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, clampK(pinch.k * d / pinch.d) / view.k);
  }
});
const endPtr = e => {
  if (!ptrs.has(e.pointerId)) return;
  ptrs.delete(e.pointerId);
  if (ptrs.size < 2) pinch = null;
  if (!ptrs.size) {
    svg.classList.remove('drag');
    if (moved <= 4 && e.type === 'pointerup') {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const up = el && el.closest && el.closest('[data-up]'), pe = el && el.closest && el.closest('[data-pe]');
      if (up) select({ t: 'up', k: up.dataset.up });
      else if (pe && !pe.classList.contains('hidden')) select({ t: 'pe', id: pe.dataset.pe });
    }
  }
};
svg.addEventListener('pointerup', endPtr);
svg.addEventListener('pointercancel', endPtr);
svg.addEventListener('wheel', e => { e.preventDefault(); userMoved = true; const r = svg.getBoundingClientRect(); zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
new ResizeObserver(() => { if (!overlay.hidden && !userMoved) fit(); }).observe(svg);

// ---------- atualização ----------
export function updateSkills() {
  if (overlay.hidden) return;
  setText($('skMoney'), 'R$ ' + fmt(S.money));
  setText($('skPe'), '★ ' + peAvailable());
  $('skPe').classList.toggle('has', peAvailable() > 0);
  $('skNegBtn').hidden = S.maxAlt / MPF < VIVA.revealAt;
  $('skRespec').hidden = !S.peSpent;
  if (!$('skSheet').hidden) {
    $('bankCard').hidden = S.maxAlt < BANK_AT && S.debt <= 0; // banco a partir de 60 m, como no modo clássico
    updateBusiness('imoveis'); updateBusiness('banco');
    return;
  }
  updateTree();
  drawDetail();
}
export const tickSkills = () => drawPreview();
export const skillsOpen = () => !overlay.hidden;

// algo para comprar ou pontos para gastar? (pontinho no botão Melhorias)
export const anyToBuy = () => Object.values(SKILL_LAYOUT).some(L => Object.keys(L).some(k => !lockedUp(k) && canBuy(k))) || peAvailable() > 0;

function selectDefault() {
  const ks = Object.values(SKILL_LAYOUT).flatMap(L => Object.keys(L));
  const open = ks.filter(k => !lockedUp(k) && !maxed(k)).sort((a, b) => cost(a) - cost(b));
  sel = { t: 'up', k: open[0] || ks[0] };
}

let opener = null;
export function openSkills() {
  opener = document.activeElement;
  overlay.hidden = false;
  if (!built) build();
  $('skSheet').hidden = true;
  if (!sel) selectDefault();
  userMoved = false;
  updateSkills(); fit();
  $('skClose').focus();
}
export function closeSkills() {
  overlay.hidden = true;
  if (opener && opener.focus) opener.focus();
}

export function initSkills() {
  // Negócios: os cards de imóveis, turismo e banco moram numa folha por cima da árvore
  const neg = $('skNeg');
  for (const id of ['pg-imoveis', 'pg-banco']) { const pg = $(id); while (pg.firstChild) neg.appendChild(pg.firstChild); }
  const bank = neg.querySelector('#k-tier'); if (bank) bank.closest('.card').id = 'bankCard';
  $('openUp').onclick = openSkills;
  $('skClose').onclick = closeSkills;
  $('sdBuy').onclick = onBuy;
  $('skIn').onclick = () => { userMoved = true; zoomAt(svg.clientWidth / 2, svg.clientHeight / 2, 1.3); };
  $('skOut').onclick = () => { userMoved = true; zoomAt(svg.clientWidth / 2, svg.clientHeight / 2, 1 / 1.3); };
  $('skFit').onclick = () => { userMoved = false; fit(); };
  $('skNegBtn').onclick = () => { $('skSheet').hidden = false; updateSkills(); };
  $('skSheetClose').onclick = () => { $('skSheet').hidden = true; updateSkills(); };
  const rs = $('skRespec');
  rs.onclick = () => {
    if (rs.classList.contains('armed')) { respec(); save(); rs.classList.remove('armed'); rs.textContent = 'Redistribuir pontos'; updateSkills(); return; }
    rs.classList.add('armed'); rs.textContent = 'Confirmar: devolver os pontos';
    setTimeout(() => { rs.classList.remove('armed'); rs.textContent = 'Redistribuir pontos'; }, 3000);
  };
  addEventListener('keydown', e => {
    if (overlay.hidden || e.key !== 'Escape' || e.defaultPrevented) return;
    if (!$('skSheet').hidden) $('skSheet').hidden = true; else closeSkills();
  });
}
