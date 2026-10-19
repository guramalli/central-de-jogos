// Mapa da árvore de Engenharia em SVG: arrastar para mover, roda/pinça para zoom.
import { NODES, EDGES, TBRANCHES, RINGS, ringRadius, ringEraName, describeEffect, KIND_LABEL } from '../data/talents.js';
import { save } from '../sim/state.js';
import { learn, learnBlock, owned, ringOpen, reachable, peAvailable, respec } from '../sim/talents.js';
import { $, setText, setHTML } from './dom.js';
import { summaryHTML } from './talentPanel.js';

const NS = 'http://www.w3.org/2000/svg';
const mk = (tag, attrs = {}, parent) => {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(el);
  return el;
};

const overlay = $('tmap'), svg = $('m-svg');
const COLOR = Object.fromEntries(TBRANCHES.map(b => [b.id, b.color]));
const BRIDGE_COLOR = '#d8d2c0';
const nodeColor = n => n.b ? COLOR[n.b] : n.kind === 'bridge' ? BRIDGE_COLOR : '#ece6d6';
const ids = Object.keys(NODES);

const view = { x: 0, y: 0, k: 0.5 };
let vp, shade, built = false, sel = null, hover = null, onChange = () => { };
const nodeEls = {}, edgeEls = [], branchEls = [];

// ---------- construção do SVG ----------
function octagon(r) {
  const p = [];
  for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; p.push((r * Math.cos(a)).toFixed(1) + ',' + (r * Math.sin(a)).toFixed(1)); }
  return p.join(' ');
}

function build() {
  svg.innerHTML = '';
  vp = mk('g', {}, svg);
  // anéis
  for (let k = 1; k <= RINGS; k++) {
    const r = ringRadius(k);
    mk('circle', { r, class: 'tring', id: 'ring-' + k }, vp);
    const t = mk('text', { x: r + 16, y: -6, class: 'tringlbl', id: 'rlbl-' + k }, vp);
    t.textContent = 'Anel ' + k;
    const t2 = mk('text', { x: r + 16, y: 9, class: 'tringlbl', id: 'rlbl2-' + k, 'font-size': 11 }, vp);
    t2.textContent = ringEraName(k);
  }
  // nomes dos ramos
  TBRANCHES.forEach(b => {
    const t = mk('text', { class: 'tbranch', fill: b.color, 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, vp);
    t.textContent = b.n;
    branchEls.push(t);
  });
  // arestas
  EDGES.forEach(([a, b]) => {
    const A = NODES[a], B = NODES[b];
    const c = A.b ? COLOR[A.b] : B.b ? COLOR[B.b] : BRIDGE_COLOR;
    const l = mk('line', { x1: A.x, y1: A.y, x2: B.x, y2: B.y, class: 'tedge', style: '--c:' + c }, vp);
    edgeEls.push({ a, b, el: l, cls: '' });
  });
  // sombra sobre os anéis fechados (atualizada em update)
  shade = mk('path', { class: 'tshade', 'fill-rule': 'evenodd' }, vp);
  // nós
  ids.forEach(id => {
    const n = NODES[id];
    const g = mk('g', { class: 'tnode', transform: `translate(${n.x} ${n.y})`, style: '--c:' + nodeColor(n), 'data-id': id, tabindex: -1 }, vp);
    let r;
    if (n.kind === 'key') { r = 22; mk('polygon', { points: octagon(r + 7), class: 'halo' }, g); mk('polygon', { points: octagon(r), class: 's' }, g); }
    else if (n.kind === 'bridge') { r = 11; mk('rect', { x: -r - 6, y: -r - 6, width: 2 * r + 12, height: 2 * r + 12, transform: 'rotate(45)', class: 'halo' }, g); mk('rect', { x: -r, y: -r, width: 2 * r, height: 2 * r, transform: 'rotate(45)', class: 's' }, g); }
    else {
      r = n.kind === 'start' ? 20 : n.kind === 'notable' ? 15 : 9;
      mk('circle', { r: r + 6, class: 'halo' }, g); mk('circle', { r, class: 's' }, g);
    }
    if (n.kind === 'start' || n.kind === 'key') {
      const t = mk('text', { class: 'ic', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, g);
      t.textContent = n.kind === 'start' ? '★' : '!';
    }
    // área de toque mínima
    mk('circle', { r: Math.max(r + 4, 14), fill: 'transparent' }, g);
    nodeEls[id] = { g, cls: '' };
  });
  built = true;
}

function annulus(r0, r1) {
  const c = r => `M ${-r} 0 a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
  return c(r1) + ' ' + c(r0);
}

// ---------- estado visual ----------
// Névoa: anéis abertos aparecem inteiros, o próximo só como pista, os demais ficam escondidos
let openRing = 1;
const fog = n => n.ring <= openRing ? 'open' : n.ring === openRing + 1 ? 'hint' : 'hidden';

export function updateMap() {
  if (!built || overlay.hidden) return;
  let firstLocked = RINGS + 1;
  for (let k = 1; k <= RINGS; k++) if (!ringOpen(k)) { firstLocked = k; break; }
  openRing = firstLocked - 1;
  const br = ringRadius(Math.min(RINGS, openRing + 1)) + (openRing + 1 >= RINGS ? 210 : 90);
  branchEls.forEach((t, i) => {
    const a = (-90 + 60 * i) * Math.PI / 180;
    t.setAttribute('x', Math.round(br * Math.cos(a))); t.setAttribute('y', Math.round(br * Math.sin(a)));
  });
  shade.setAttribute('d', firstLocked <= RINGS ? annulus(ringRadius(firstLocked - 1) + 12, ringRadius(RINGS) + 400) : '');
  for (let k = 1; k <= RINGS; k++) {
    const o = ringOpen(k);
    $('ring-' + k).setAttribute('class', 'tring' + (o ? ' open' : ''));
    $('rlbl-' + k).setAttribute('class', 'tringlbl' + (o ? ' open' : ''));
    $('rlbl2-' + k).setAttribute('class', 'tringlbl' + (o ? ' open' : ''));
    const vis = k <= openRing + 1 ? '' : 'none';
    ['ring-', 'rlbl-', 'rlbl2-'].forEach(p => $(p + k).style.display = vis);
  }
  ids.forEach(id => {
    const n = NODES[id], e = nodeEls[id];
    let c = 'tnode';
    const f = fog(n);
    if (f === 'hidden') c += ' hidden';
    else if (f === 'hint') c += ' hint';
    else if (owned(id)) c += ' own';
    else if (!ringOpen(n.ring)) c += ' locked';
    else if (!learnBlock(id)) c += ' can';
    else if (reachable(id)) c += ' reach';
    if (id === sel) c += ' sel';
    if (c !== e.cls) { e.g.setAttribute('class', c); e.cls = c; }
  });
  edgeEls.forEach(e => {
    const oa = owned(e.a), ob = owned(e.b);
    const hide = fog(NODES[e.a]) === 'hidden' || fog(NODES[e.b]) === 'hidden';
    const c = 'tedge' + (hide ? ' hidden' : oa && ob ? ' on' : oa || ob ? ' half' : '');
    if (c !== e.cls) { e.el.setAttribute('class', c); e.cls = c; }
  });
  setText($('m-pe'), String(peAvailable()));
  showDetail(hover || sel);
}

function showDetail(id) {
  const learnBtn = $('d-learn');
  setHTML($('d-sum'), id ? '' : summaryHTML());
  if (!id) {
    setText($('d-kind'), ''); setText($('d-name'), 'Árvore de Engenharia'); $('d-eff').innerHTML = '';
    setText($('d-desc'), ''); learnBtn.hidden = true; setText($('d-block'), '');
    return;
  }
  const n = NODES[id];
  if (fog(n) !== 'open') {
    setText($('d-kind'), `Anel ${n.ring} · ainda desconhecido`);
    setText($('d-name'), n.kind === 'key' ? 'Tecnologia revolucionária' : n.kind === 'notable' ? 'Grande avanço' : 'Pesquisa futura');
    $('d-eff').innerHTML = '';
    setText($('d-desc'), `Os engenheiros só vão entender isto na era ${ringEraName(n.ring)}.`);
    learnBtn.hidden = true; setText($('d-block'), '');
    return;
  }
  const where = n.ring ? ` · Anel ${n.ring}` : '';
  const branch = n.b ? TBRANCHES.find(b => b.id === n.b).n : n.bridge ? n.bridge.map(x => TBRANCHES.find(b => b.id === x).n).join(' + ') : '';
  setText($('d-kind'), `${KIND_LABEL[n.kind]}${branch ? ' · ' + branch : ''}${where}`);
  setText($('d-name'), n.name);
  const html = n.eff.map(e => `<li>${describeEffect(e)}</li>`).join('');
  if ($('d-eff').innerHTML !== html) $('d-eff').innerHTML = html;
  setText($('d-desc'), n.desc || '');
  const own = owned(id), block = learnBlock(id);
  learnBtn.hidden = own || n.kind === 'start' || id !== sel;
  learnBtn.disabled = !!block;
  setText(learnBtn, `Aprender (${n.cost} PE)`);
  let msg = '';
  if (own) msg = n.kind === 'start' ? '' : 'Aprendido.';
  else if (block === 'Anel fechado') msg = `Abre na era ${ringEraName(n.ring)}.`;
  else if (block === 'Ligue a um nó já aprendido') msg = 'Precisa estar ligado a um nó que você já aprendeu.';
  else if (block === 'Pontos insuficientes') msg = `Faltam ${n.cost - peAvailable()} PE. Pontos vêm da altura recorde da torre.`;
  else if (id !== sel) msg = 'Clique para selecionar.';
  setText($('d-block'), msg);
}

// ---------- câmera ----------
function apply() { vp.setAttribute('transform', `translate(${view.x.toFixed(1)} ${view.y.toFixed(1)}) scale(${view.k.toFixed(4)})`); }
const clampK = k => Math.max(0.12, Math.min(2.5, k));
function zoomAt(px, py, f) {
  userMoved = true;
  const k = clampK(view.k * f);
  view.x = px - (px - view.x) * k / view.k;
  view.y = py - (py - view.y) * k / view.k;
  view.k = k; apply();
}
let userMoved = false;
function center() {
  const w = svg.clientWidth, h = svg.clientHeight;
  if (w < 50 || h < 50) return; // ainda sem layout; o ResizeObserver chama de novo
  let open = 1; for (let k = 1; k <= RINGS; k++) if (ringOpen(k)) open = k;
  const R = ringRadius(Math.min(RINGS, open + 1)) + 40;
  view.k = clampK(Math.min(w, h) / (2 * R));
  view.x = w / 2; view.y = h / 2; apply();
}

// arrastar, pinça e clique
const ptrs = new Map();
let moved = 0, pinch = null;
svg.addEventListener('pointerdown', e => {
  svg.setPointerCapture(e.pointerId);
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 1) moved = 0;
  if (ptrs.size === 2) {
    const [a, b] = [...ptrs.values()];
    pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), k: view.k };
  }
});
svg.addEventListener('pointermove', e => {
  const p = ptrs.get(e.pointerId);
  if (!p) {
    // passar o mouse mostra o nó no painel
    const g = e.target.closest && e.target.closest('.tnode');
    const id = g ? g.dataset.id : null;
    if (id !== hover) { hover = id; showDetail(hover || sel); }
    return;
  }
  const dx = e.clientX - p.x, dy = e.clientY - p.y;
  p.x = e.clientX; p.y = e.clientY;
  if (ptrs.size === 1) {
    moved += Math.abs(dx) + Math.abs(dy);
    if (moved > 4) { svg.classList.add('drag'); userMoved = true; }
    view.x += dx; view.y += dy; apply();
  } else if (ptrs.size === 2 && pinch) {
    moved = 99;
    const [a, b] = [...ptrs.values()], r = svg.getBoundingClientRect();
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    zoomAt((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, clampK(pinch.k * d / pinch.d) / view.k);
  }
});
const endPtr = e => {
  if (!ptrs.has(e.pointerId)) return;
  ptrs.delete(e.pointerId);
  if (ptrs.size < 2) pinch = null;
  if (ptrs.size === 0) {
    svg.classList.remove('drag');
    if (moved <= 4 && e.type === 'pointerup') {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const g = el && el.closest && el.closest('.tnode');
      select(g ? g.dataset.id : null);
    }
  }
};
svg.addEventListener('pointerup', endPtr);
svg.addEventListener('pointercancel', endPtr);
svg.addEventListener('pointerleave', () => { if (!ptrs.size && hover) { hover = null; showDetail(sel); } });
svg.addEventListener('wheel', e => {
  e.preventDefault();
  const r = svg.getBoundingClientRect();
  zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0015));
}, { passive: false });
svg.addEventListener('dblclick', e => {
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const g = el && el.closest && el.closest('.tnode');
  if (g) { sel = g.dataset.id; tryLearn(sel); }
});

function select(id) { sel = id; hover = null; updateMap(); }
function tryLearn(id) {
  if (!learn(id)) return;
  save(); updateMap(); onChange();
}

// ---------- abrir / fechar ----------
let opener = null;
export function openMap() {
  opener = document.activeElement;
  overlay.hidden = false;
  if (!built) build();
  userMoved = false;
  center(); updateMap();
  $('m-close').focus();
}
export function closeMap() {
  overlay.hidden = true; hover = null;
  if (opener && opener.focus) opener.focus();
}
export const mapOpen = () => !overlay.hidden;
export function initMap(changed) { onChange = changed; }

$('m-close').onclick = closeMap;
$('m-in').onclick = () => zoomAt(svg.clientWidth / 2, svg.clientHeight / 2, 1.3);
$('m-out').onclick = () => zoomAt(svg.clientWidth / 2, svg.clientHeight / 2, 1 / 1.3);
$('m-center').onclick = () => { userMoved = false; center(); };
// enquadra de novo quando o mapa muda de tamanho (abertura, giro do celular), se o jogador não mexeu
new ResizeObserver(() => { if (!overlay.hidden && !userMoved) center(); }).observe(svg);
$('d-learn').onclick = () => sel && tryLearn(sel);
const rs = $('m-respec');
rs.onclick = () => {
  if (rs.classList.contains('armed')) {
    respec(); sel = null; save(); updateMap(); onChange();
    rs.classList.remove('armed'); rs.textContent = 'Redistribuir';
    return;
  }
  rs.classList.add('armed'); rs.textContent = 'Confirmar: devolver todos os PE';
  setTimeout(() => { rs.classList.remove('armed'); rs.textContent = 'Redistribuir'; }, 3000);
};
addEventListener('keydown', e => {
  if (overlay.hidden) return;
  if (e.key === 'Escape') { e.preventDefault(); closeMap(); }
  else if (e.key === '+' || e.key === '=') $('m-in').click();
  else if (e.key === '-') $('m-out').click();
});

