// Destaque das dicas (Obra Viva): escurece a tela, contorna o alvo com um quadro dourado e mostra um balão.
// Dica de explicação: um véu bloqueia o jogo e "Entendi" fecha. Dica de ação: só o clique dentro do alvo passa
// (e "Pular dicas"); ele faz o que já faria no jogo e fecha a dica. As vistas vão para S.dicas.
import { S, save } from '../sim/state.js';
import { TIPS } from '../data/tips.js';
import { sx, sy, cam } from '../render/camera.js';
import { t } from '../i18n.js';

const $ = id => document.getElementById(id);
const PAD = 6, GAP = 12;
let cur = null; // { id, target, action, onDone }
let missing = 0;  // desde quando o alvo da dica aberta sumiu (ms)
const MISS_MS = 1000;

export const coachBusy = () => !!cur;
export const coachTip = () => (cur ? cur.id : null);
export const rectOf = sel => Object.assign(() => { const e = document.querySelector(sel); if (!e || e.closest('[hidden]')) return null; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 ? r : null; }, { sel });
// retângulo do mundo (y para cima) na tela: câmera → pixels do canvas → pixels da página
// (null quando menos da metade do quadro aparece no canvas: a dica espera a câmera mostrar o lugar)
export const worldRect = (x, y, w, h) => () => {
  const cv = $('cv'), r = cv.getBoundingClientRect(), kx = r.width / cv.width, ky = r.height / cv.height;
  const q = new DOMRect(r.left + sx(x) * kx, r.top + sy(y + h) * ky, w * cam.z * kx, h * cam.z * ky);
  const vw = Math.min(q.right, r.right) - Math.max(q.left, r.left), vh = Math.min(q.bottom, r.bottom) - Math.max(q.top, r.top);
  return vw > 0 && vh > 0 && vw * vh >= 0.5 * q.width * q.height && Math.min(vw, vh) >= 12 ? q : null;
};

export function showTip(id, target, opts = {}) {
  if (cur || !target()) return false;
  cur = { id, target, action: !!opts.action, onDone: opts.onDone };
  const c = $('coach');
  c.dataset.tip = id; c.classList.toggle('act', cur.action);
  $('coText').textContent = t(TIPS[id].t);
  $('coOk').hidden = cur.action;
  c.hidden = false; missing = 0;
  updateCoach();
  if (!cur.action) $('coOk').focus({ preventScroll: true }); // teclado: Enter fecha a dica, não aciona o que está atrás
  return true;
}

function close(markId = true) {
  if (!cur) return;
  const { id, onDone } = cur;
  if (markId) { S.dicas = { ...(S.dicas || {}), [id]: true }; save(); }
  cur = null; $('coach').hidden = true;
  if (onDone) onDone();
}

// descarta a dica aberta sem marcar como vista (ela volta pelos gatilhos)
export const dropTip = () => close(false);

export function skipAll() {
  S.dicas = Object.fromEntries(Object.keys(TIPS).map(k => [k, true])); save();
  cur = null; $('coach').hidden = true;
}

// posição do quadro e do balão (a cada quadro: o alvo pode mexer, como a obra na cena)
export function updateCoach() {
  if (!cur) return;
  const r = cur.target(), c = $('coach');
  if (!r) { // alvo sumiu (árvore fechou, proposta recolheu): dica de ação sai na hora; de explicação, depois de 1 s
    c.style.visibility = 'hidden';
    if (cur.action) { close(false); return; }
    missing ||= performance.now();
    if (performance.now() - missing > MISS_MS) close(false);
    return;
  }
  missing = 0;
  c.style.visibility = '';
  const h = c.querySelector('.co-hole'), b = c.querySelector('.co-box');
  Object.assign(h.style, { left: r.left - PAD + 'px', top: r.top - PAD + 'px', width: r.width + 2 * PAD + 'px', height: r.height + 2 * PAD + 'px' });
  const bw = b.offsetWidth, bh = b.offsetHeight, W = innerWidth, H = innerHeight;
  const hx0 = r.left - PAD, hx1 = r.right + PAD, hy0 = r.top - PAD, hy1 = r.bottom + PAD;
  const clampX = x => Math.max(8, Math.min(W - bw - 8, x)), clampY = y => Math.max(8, Math.min(H - bh - 8, y));
  let x, y;
  if (hy1 + GAP + bh <= H - 8) { x = clampX(r.left); y = hy1 + GAP; }                  // embaixo
  else if (hy0 - GAP - bh >= 8) { x = clampX(r.left); y = hy0 - GAP - bh; }           // em cima
  else if (hx0 - GAP - bw >= 8) { x = hx0 - GAP - bw; y = clampY(r.top); }            // à esquerda
  else if (hx1 + GAP + bw <= W - 8) { x = hx1 + GAP; y = clampY(r.top); }             // à direita
  else { x = clampX(r.left + 8); y = clampY(hy1 - bh - 8); }                           // alvo enorme: dentro, embaixo
  Object.assign(b.style, { left: x + 'px', top: y + 'px' });
}

export function initCoach() {
  $('coOk').onclick = () => close();
  $('coSkip').onclick = () => skipAll();
  // dica de ação: cliques fora do alvo não chegam ao jogo; o clique no alvo segue normal e fecha a dica
  const gate = e => {
    if (!cur || !cur.action || e.target.closest('#coSkip, #skClose')) return; // sair da árvore sempre pode (a dica volta depois)
    const r = cur.target();
    if (!r) return; // sem alvo na tela, nada é bloqueado
    // dentro: o evento nasceu no próprio elemento destacado (vale o teclado, que clica sem posição) ou caiu no quadro
    const inside = (cur.target.sel && e.target.closest && e.target.closest(cur.target.sel)) || r && e.clientX >= r.left - PAD && e.clientX <= r.right + PAD && e.clientY >= r.top - PAD && e.clientY <= r.bottom + PAD;
    if (!inside) { e.stopPropagation(); e.preventDefault(); return; }
    // a árvore captura o ponteiro e seleciona no pointerup (o click nem sempre chega): os dois fecham a dica
    if (e.type === 'click' || e.type === 'pointerup') close(); // fecha já; o evento segue até o alvo
  };
  for (const t of ['pointerdown', 'mousedown', 'pointerup', 'click', 'wheel']) document.addEventListener(t, gate, { capture: true, passive: false });

}
