// Árvore de avanços (modo Obra Viva), no estilo das árvores de habilidade de jogos de ação:
// um tronco (a obra) embaixo e cinco ramos coloridos subindo lado a lado. Embaixo, as compras do dia a dia;
// acima, uma fileira por era com as tecnologias de era — tudo com dinheiro (a Pesquisa saiu, decisão do usuário).
// Painel à direita com o efeito e uma prévia animada na própria cena.
import { FH } from '../data/constants.js';
import { UP } from '../data/upgrades.js';
import { ERAS } from '../data/eras.js';
import { TBRANCHES } from '../data/talents.js';
import { SKILL_LAYOUT, COLS, BW, ROW, ERA_ROW0, colX, upgradePos, BASE_POS, SHORT } from '../data/skillTree.js';
import { S, save } from '../sim/state.js';
import { cost, unlocked, maxed, canBuy, buy, buyN, costN, stageBlock, STAGE_OF, rates, isCapped } from '../sim/economy.js';
import { upgradeEffect, priorityScore } from '../sim/preview.js';
import { W } from '../data/constants.js';
import { setViewInset } from '../render/camera.js';
import { V } from '../render/view.js';
import { $, setText, setHTML } from './dom.js';
import { fmt, fmtM, fmtPct } from './format.js';
import { iconSprite, badgeSprite, lockSprite } from './icons.js';
import { iconURL } from '../render/assets.js';
import { VIVA } from '../data/viva.js';
import { canDeliver, pointsFor, city, nextCity, metaAlt, deliverPoints, earlyBonus, repPct } from '../sim/prestige.js';
import { managerOn, managerFree, setManager, hasManager, managerArrives } from '../sim/managers.js';
import { spriteDataURL } from '../render/sprites.js';
import { FLAGS } from '../data/flags.js';

const COLOR = Object.fromEntries(TBRANCHES.map(b => [b.id, b.color]));
const ERA_TOP = ERA_ROW0 + 5; // última fileira de tecnologia (era do Espaço)

// o que cada ramo melhora (legenda embaixo da coluna)
const BRANCH_INFO = {
  obra: ['Mão de obra', 'quão rápido a equipe assenta'],
  forn: ['Fornecimento', 'quanto material chega'],
  log: ['Logística', 'quão rápido o material sobe'],
  eng: ['Engenharia', 'até onde a torre aguenta'],
  merc: ['Mercado', 'quanto dinheiro a torre rende'],
};

const overlay = $('skills'), svg = $('skSvg');

let sel = null, built = false; // sel = chave da melhoria selecionada

const lockedUp = k => !unlocked(k);
// ícone: o do PixelLab; senão o desenhado por código; senão o da tecnologia irmã (par da era)
const iconHref = k => { const u = UP[k], spr = iconSprite(u.icon || k); return iconURL(k) || iconURL(u.icon) || (spr && spriteDataURL(spr)) || (u.pair && iconURL(u.pair)) || spriteDataURL(iconSprite('motor')); };
const eraOf = k => UP[k].era ? ERAS[UP[k].era].n : '';
const lockText = k => {
  const u = UP[k], parts = [];
  if (u.pair && S.lv[u.pair] > 0) return `Nesta obra você escolheu ${UP[u.pair].n}. A outra opção volta na próxima obra.`;
  if (u.req && S.lv[u.req[0]] < u.req[1]) parts.push(`${UP[u.req[0]].n} no nível ${u.req[1]}`);
  if (u.reqAlt && S.maxAlt < u.reqAlt) parts.push(`a torre chegar a ${fmtM(u.reqAlt)}${u.era ? ` (${eraOf(k)})` : ''}`);
  return parts.length ? 'Libera quando ' + parts.join(' e ') + '.' : '';
};

// etapas andando juntas: quem está segurando e a explicação (só na árvore; a obra continua sem texto)
const HOLD_NAME = { prod: 'Fornecimento', tran: 'Logística', lay: 'Mão de obra' };
const HOLD_WHY = {
  prod: { tran: 'Falta material para subir', lay: 'Não chega material para tanta gente' },
  tran: { prod: 'Pátio cheio: os elevadores não levam o que já chega', lay: 'O material não sobe rápido o bastante' },
  lay: { prod: 'Material sobrando no topo: os pedreiros não dão conta', tran: 'Os pedreiros não dão conta do que já sobe' },
};
const holdText = (k, blk) => `${HOLD_WHY[blk][STAGE_OF(k)]}. Melhore ${blk === 'lay' ? 'a Mão de obra' : blk === 'prod' ? 'o Fornecimento' : 'a Logística'} antes — numa obra, as etapas andam juntas.`;

// o que falta, curto, para escrever na árvore ("Treino nv 3", "torre em 1 km", "abre no Concreto")
const reqShort = k => {
  const u = UP[k];
  if (u.pair && S.lv[u.pair] > 0) return 'outra escolhida';
  if (u.req && S.lv[u.req[0]] < u.req[1]) return `${SHORT[u.req[0]] || UP[u.req[0]].n} nv ${u.req[1]}`;
  if (u.reqAlt && S.maxAlt < u.reqAlt) return u.era ? 'abre em ' + fmtM(u.reqAlt) : 'torre em ' + fmtM(u.reqAlt);
  return '';
};

// ---------- SVG ----------
const NS = 'http://www.w3.org/2000/svg';
const mk = (tag, a, parent) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); parent && parent.appendChild(e); return e; };
const Y = y => -y; // y do layout cresce para cima; no SVG cresce para baixo
// linha em ângulo reto (sobe, anda de lado, sobe), como trilha de placa de circuito
const elbow = (x0, y0, x1, y1) => x0 === x1 ? `M${x0} ${Y(y0)} V ${Y(y1)}` : `M${x0} ${Y(y0)} V ${Y((y0 + y1) / 2)} H ${x1} V ${Y(y1)}`;

let vp, upEls = {}, eraEls = [];

function build() {
  svg.innerHTML = ''; upEls = {}; eraEls = [];
  vp = mk('g', {}, svg);
  const gBands = mk('g', {}, vp), gEdges = mk('g', {}, vp), gNodes = mk('g', {}, vp);
  const xL = colX(COLS[0]) - BW / 2, xR = colX(COLS[COLS.length - 1]) + BW / 2;
  // faixas das eras: onde começa cada fileira de tecnologia
  for (let e = 1; e <= 5; e++) {
    const y = (ERA_ROW0 + e - 0.5) * ROW, g = mk('g', { class: 'sk-ring' }, gBands);
    mk('line', { x1: xL, x2: xR, y1: Y(y), y2: Y(y) }, g);
    const t = mk('text', { x: xL - 14, y: Y(y) + 6, 'text-anchor': 'end' }, g); t.textContent = ERAS[e].n;
    const t2 = mk('text', { x: xL - 14, y: Y(y) + 28, 'text-anchor': 'end', class: 'sub' }, g); t2.textContent = 'a partir de ' + fmtM(ERAS[e].m);
    eraEls.push({ e, g, t });
  }
  // tronco e legendas dos ramos
  const [bx, by] = BASE_POS;
  for (const b of COLS) {
    const x = colX(b), c = COLOR[b];
    mk('path', { d: `M${x} ${Y(12)} V ${Y(60)}`, class: 'sk-trunk', style: `--c:${c}` }, gEdges); // cada ramo sobe na sua cor
    const lab = mk('g', { class: 'sk-blabel', transform: `translate(${x} ${Y(-115)})`, style: `--c:${c}` }, gNodes);
    mk('rect', { x: -BW / 2 + 12, y: -22, width: BW - 24, height: 56 }, lab);
    mk('rect', { x: -BW / 2 + 18, y: -16, width: BW - 36, height: 44, class: 'bev' }, lab);
    const t1 = mk('text', { y: 2, 'text-anchor': 'middle', class: 'n' }, lab); t1.textContent = BRANCH_INFO[b][0];
    const t2 = mk('text', { y: 24, 'text-anchor': 'middle', class: 'd' }, lab); t2.textContent = BRANCH_INFO[b][1];
  }
  // tronco neutro: do OBRA até a base de todos os ramos (as cores começam onde cada ramo sobe)
  mk('path', { d: `M${bx} ${Y(by)} V ${Y(12)} M${colX(COLS[0])} ${Y(12)} H ${colX(COLS[COLS.length - 1])}`, class: 'sk-trunk0' }, gEdges);
  const base = mk('g', { class: 'sk-base', transform: `translate(${bx} ${Y(by)})` }, gNodes);
  mk('image', { x: -40, y: -40, width: 80, height: 80, class: 'px', href: spriteDataURL(badgeSprite('#f2b630', 'max')) }, base);
  const bt = mk('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central' }, base); bt.textContent = 'OBRA';
  // melhorias (compras do dia a dia e tecnologias de era)
  for (const b of COLS) {
    const L = SKILL_LAYOUT[b], c = COLOR[b];
    for (const k in L) {
      if (!UP[k]) continue;
      // linha: do requisito (ou da base do ramo, na 1ª fileira); quem depende só da altura fica sem linha
      const [x, y] = upgradePos(b, k), from = L[k][2], root = !from && L[k][1] === 1, [x0, y0] = from ? upgradePos(b, from) : [colX(b), 60];
      const e = from || root ? mk('path', { d: elbow(x0, y0, x, y), class: 'sk-edge', style: `--c:${c}` }, gEdges) : null;
      // o que falta para liberar: ao lado da linha do requisito, ou embaixo do nome
      const rq = mk('text', from ? { class: 'rq', x: Math.max(x0, x) - x + 12, y: -(y0 + y) / 2 + y + 6 + (x0 === x ? 0 : -14), 'text-anchor': 'start' } : { class: 'rq', y: 76, 'text-anchor': 'middle' }, null);
      const n = mk('g', { class: 'sk-node' + (UP[k].era ? ' tech' : ''), transform: `translate(${x} ${Y(y)})`, style: `--c:${c}`, 'data-up': k }, gNodes);
      mk('rect', { x: -40, y: -40, width: 80, height: 80, class: 'halo' }, n);
      const badge = mk('image', { x: -36, y: -36, width: 72, height: 72, class: 'px' }, n);
      mk('image', { x: -19.2, y: -21.2, width: 38.4, height: 38.4, class: 'px ico', href: iconHref(k) }, n); // ícone do PixelLab quando existe
      mk('image', { x: -15, y: -15, width: 30, height: 30, class: 'px lock', href: spriteDataURL(lockSprite()) }, n);
      mk('rect', { x: 13, y: 15, width: 26, height: 20, class: 'lvbox' }, n);
      const lv = mk('text', { class: 'lvl', x: 26, y: 26, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, n);
      const nm = mk('text', { class: 'nm', y: 54, 'text-anchor': 'middle' }, n); nm.textContent = SHORT[k] || UP[k].n;
      n.appendChild(rq);
      upEls[k] = { n, lv, e, rq, badge, cls: '', st: '' };
    }
  }
  built = true;
}

// ---------- estado visual ----------
function updateTree() {
  for (const r of eraEls) r.g.classList.toggle('open', S.maxAlt >= ERAS[r.e].m);
  const capped = isCapped(rates()); // obra parada no limite: a Fundação brilha (sem texto)
  // começo do jogo (antes de 10 andares, só na 1ª obra): brilho nas 3 compras que mais rendem agora
  const rec = new Set(S.floors < 10 && (S.obra || 1) === 1 ? Object.keys(upEls).filter(k => k !== 'imoveis' && canBuy(k)).map(k => [k, priorityScore(k)]).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]) : []);
  for (const k in upEls) {
    const e = upEls[k], lk = lockedUp(k), mx = maxed(k) && k !== 'imoveis', lv = k === 'imoveis' ? (policyOf() === 'sell' ? 'V' : 'A') : S.lv[k];
    setText(e.lv, lk ? '' : String(lv));
    const blk = !lk && !mx ? stageBlock(k) : null;
    const st = lk ? 'locked' : mx ? 'max' : blk ? 'hold' : canBuy(k) ? 'can' : lv > 0 ? 'own' : 'open';
    const cls = 'sk-node ' + st + (UP[k].era ? ' tech' : '') + (UP[k].pair && S.lv[UP[k].pair] > 0 ? ' taken' : '') + (sel === k ? ' sel' : '') + (capped && k === 'fundacao' ? ' need' : '') + (rec.has(k) ? ' rec' : '');
    if (cls !== e.cls) { e.n.setAttribute('class', cls); e.cls = cls; }
    if (st !== e.st) { e.badge.setAttribute('href', spriteDataURL(badgeSprite(COLOR[UP[k].b], st === 'hold' ? (lv > 0 ? 'own' : 'open') : st))); e.st = st; }
    if (e.e) { e.e.classList.toggle('on', lv > 0); e.e.classList.toggle('open', !lk && lv === 0); }
    setText(e.rq, lk ? reqShort(k) : blk ? 'antes: ' + HOLD_NAME[blk] : '');
  }
}

// ---------- painel ----------
// Imóveis da era: escolha de política (alugar × vender), sem custo
const policyOf = () => (S.policy && S.policy[S.era]) === 'sell' ? 'sell' : 'rent';
function drawPolicy(d, bt) {
  const sell = policyOf() === 'sell';
  d.style.setProperty('--c', COLOR.merc);
  setText($('sdKind'), BRANCH_INFO.merc[0] + ' · ' + ERAS[S.era].n);
  setText($('sdName'), UP.imoveis.n);
  setHTML($('sdLv'), `<span>Agora: ${sell ? 'vendendo' : 'alugando'} os andares desta era</span>`);
  setText($('sdDesc'), UP.imoveis.d);
  setText($('sdFx'), sell ? 'Cada andar pronto vira dinheiro na hora.' : 'Cada andar pronto soma no aluguel por segundo.'); $('sdFx').hidden = false;
  setText($('sdReq'), 'Vale para os andares que ficarem prontos daqui em diante, nesta era.');
  bt.hidden = false; bt.disabled = false; setText(bt, sell ? 'Mudar para alugar' : 'Mudar para vender');
}

function drawDetail() {
  const d = $('skDetail'), bt = $('sdBuy');
  if (!sel) return;
  $('sdBuy5').hidden = true;
  if (sel === 'imoveis') { drawPolicy(d, bt); return; }
  const k = sel, u = UP[k], lk = lockedUp(k), mx = maxed(k), can = !lk && canBuy(k);
  d.style.setProperty('--c', COLOR[u.b]);
  setText($('sdKind'), BRANCH_INFO[u.b][0] + (u.era ? ` · tecnologia da ${eraOf(k)}` : ' · compra com dinheiro'));
  setText($('sdName'), u.n);
  setHTML($('sdLv'), u.max !== undefined
    ? Array.from({ length: u.max }, (_, i) => `<i class="${i < S.lv[k] ? 'on' : ''}"></i>`).join('') + `<span>Nv ${S.lv[k]} de ${u.max}</span>`
    : `<span>Nível ${S.lv[k]}</span>`);
  setText($('sdDesc'), u.d);
  const fx = lk || mx ? '' : upgradeEffect(k);
  setText($('sdFx'), fx || ''); $('sdFx').hidden = !fx;
  const blk = !lk && !mx ? stageBlock(k) : null;
  setText($('sdReq'), lk ? lockText(k) : mx ? 'Nível máximo.' : blk ? holdText(k, blk) : '');
  bt.hidden = lk || mx; bt.disabled = !can;
  setText(bt, `Comprar · R$ ${fmt(cost(k))}`);
  // compra em lote (básicos com pelo menos 2 níveis pela frente): até 5 de uma vez
  const b5 = $('sdBuy5'), left = u.max !== undefined ? u.max - S.lv[k] : 5, n5 = Math.min(5, left);
  b5.hidden = lk || mx || !!u.era || n5 < 2;
  if (!b5.hidden) { const c5 = costN(k, n5); b5.disabled = !can || S.money < c5; setText(b5, `Comprar ×${n5} · R$ ${fmt(c5)}`); }
}

function select(k) { sel = k; updateSkills(); }
function onBuy() {
  if (sel === 'imoveis') { S.policy = { ...S.policy, [S.era]: policyOf() === 'sell' ? 'rent' : 'sell' }; save(); updateSkills(); return; }
  if (!sel || lockedUp(sel) || !buy(sel)) return;
  if (sel === 'elevador') V.elev[S.lv.elevador - 1] = Math.random();
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
// enquadra a árvore até a fileira da era mais alta já aberta (mais uma, como pista)
function fit() {
  const w = svg.clientWidth, h = svg.clientHeight;
  if (w < 50 || h < 50) return;
  let open = 0; for (let e = 1; e <= 5; e++) if (S.maxAlt >= ERAS[e].m) open = e;
  const x0 = colX(COLS[0]) - BW / 2 - 260, x1 = colX(COLS[COLS.length - 1]) + BW / 2;
  const top = (Math.min(ERA_TOP, ERA_ROW0 + open + 1) + 0.6) * ROW, bottom = -150;
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
  try { svg.setPointerCapture(e.pointerId); } catch (_) { } ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
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
      const up = el && el.closest && el.closest('[data-up]');
      if (up) select(up.dataset.up);
    }
  }
};
svg.addEventListener('pointerup', endPtr);
svg.addEventListener('pointercancel', endPtr);
svg.addEventListener('wheel', e => { e.preventDefault(); userMoved = true; const r = svg.getBoundingClientRect(); zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
new ResizeObserver(() => { if (!overlay.hidden && !userMoved) fit(); }).observe(svg);

// ---------- atualização ----------
// faixa "Construtora J. Santos" (só Reputação): Reputação e os gerentes, que chegam um por obra
let boardBuilt = false;
function buildBoard() {
  const row = $('skBoardRow'); row.innerHTML = '';
  for (const k in VIVA.board) {
    const b = VIVA.board[k], c = document.createElement('div'); c.className = 'skb-card mgr'; c.dataset.k = k;
    c.innerHTML = `<b>${b.n}</b><u></u><i>${b.d}</i><button type="button"></button>`;
    c.querySelector('button').onclick = () => { if (!hasManager(b.mgr)) return; setManager(b.mgr, !managerOn(b.mgr)); save(); updateSkills(); };
    row.appendChild(c);
  }
  // no celular a faixa começa recolhida (a árvore precisa do espaço); tocar no título abre e fecha
  if (innerWidth <= 820) $('skBoard').classList.add('fold');
  document.querySelector('.skb-h').onclick = () => $('skBoard').classList.toggle('fold');
  boardBuilt = true;
}
function updateBoard() {
  $('skBoard').hidden = false;
  // o botão de entregar mora no painel da engrenagem (ui/gear.js)
  if (!boardBuilt) buildBoard();
  setText($('skRep'), `Reputação ${fmtPct(repPct(S.pontosTotal || 0))}`);
  if (FLAGS.risco) { $('skBoardRow').hidden = true; setText($('skObra'), `Torre nº ${S.riscoTentativa || 1} · Ano ${(S.risco && S.risco.ano) || 1}`); return; } // sem gerentes neste modo
  setText($('skObra'), `Obra nº ${S.obra || 1} · ${city().n}`);
  for (const c of $('skBoardRow').children) {
    const b = VIVA.board[c.dataset.k], bt = c.querySelector('button'), own = hasManager(b.mgr), on = own && managerOn(b.mgr);
    c.classList.toggle('own', own); c.classList.toggle('off', own && !on);
    setText(c.querySelector('u'), own ? (on ? 'Trabalhando' : managerFree(b.mgr) ? 'Liberado: ligue no botão' : 'Libera no 5º andar') : `Chega na obra ${managerArrives(b.mgr)}`);
    setText(bt, own ? (on ? 'Ligado' : 'Desligado') : `Obra ${managerArrives(b.mgr)}`);
    bt.disabled = !own;
  }
}

export function updateSkills() {
  if (overlay.hidden) return;
  setText($('skMoney'), 'R$ ' + fmt(S.money));
  updateTree();
  drawDetail();
  updateBoard();
}
export const tickSkills = () => {};
export const selectedKey = () => sel;
// traz um nó para a área visível da árvore (as dicas apontam para ele)
export function revealNode(k) {
  const el = svg.querySelector(`[data-up="${k}"]`); if (!el) return;
  const r = el.getBoundingClientRect(), t = svg.getBoundingClientRect(), m = 24;
  if (r.left >= t.left + m && r.right <= t.right - m && r.top >= t.top + m && r.bottom <= t.bottom - m) return;
  view.x += t.left + t.width / 2 - (r.left + r.width / 2); view.y += t.top + t.height / 2 - (r.top + r.height / 2); apply();
}
export const skillsOpen = () => !overlay.hidden;

const allKeys = () => COLS.flatMap(b => Object.keys(SKILL_LAYOUT[b])).filter(k => UP[k]);
// algo para comprar? (pontinho no botão Melhorias)
export const anyToBuy = () => allKeys().some(k => !lockedUp(k) && canBuy(k));

function selectDefault() {
  const ks = allKeys(), open = ks.filter(k => !lockedUp(k) && !maxed(k)).sort((a, b) => cost(a) - cost(b));
  sel = open[0] || ks[0];
}

let opener = null;
// quanto da cena a árvore cobre (a câmera do jogo deixa a torre na parte livre)
function syncInset() {
  if (overlay.hidden) { setViewInset(0, 0); return; }
  const cv = $('cv'), wide = innerWidth > 820;
  setViewInset(wide ? overlay.getBoundingClientRect().width * W / Math.max(1, cv.clientWidth) : 0, wide ? 0 : overlay.getBoundingClientRect().height / Math.max(1, cv.clientHeight));
}
addEventListener('resize', syncInset);

export function openSkills() {
  opener = document.activeElement;
  overlay.hidden = false;
  document.body.classList.add('sk-open');
  if (!built) build();
  if (!sel) selectDefault();
  userMoved = false;
  updateSkills(); fit(); syncInset();
  $('skClose').focus();
}
export function closeSkills() {
  overlay.hidden = true;
  document.body.classList.remove('sk-open'); syncInset();
  if (opener && opener.focus) opener.focus();
}

export function initSkills() {
  $('openUp').onclick = openSkills;
  $('skClose').onclick = closeSkills;
  $('sdBuy').onclick = onBuy;
  $('sdBuy5').onclick = () => { if (!sel || sel === 'imoveis' || lockedUp(sel) || !buyN(sel, 5)) return; if (sel === 'elevador') V.elev[S.lv.elevador - 1] = Math.random(); save(); updateSkills(); };
  $('skIn').onclick = () => { userMoved = true; zoomAt(svg.clientWidth / 2, svg.clientHeight / 2, 1.3); };
  $('skOut').onclick = () => { userMoved = true; zoomAt(svg.clientWidth / 2, svg.clientHeight / 2, 1 / 1.3); };
  $('skFit').onclick = () => { userMoved = false; fit(); };
  addEventListener('keydown', e => {
    if (overlay.hidden || e.key !== 'Escape' || e.defaultPrevented) return;
    closeSkills();
  });
}
