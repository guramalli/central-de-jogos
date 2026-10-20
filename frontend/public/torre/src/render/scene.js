// Monta o quadro: céu, térreo, torre, obra no topo (sempre bloco a bloco), turismo, partículas e faixas.
import { techTop } from './techvis.js';
import { W, H, FH, SLAB, TW, TL, MPF } from '../data/constants.js';
import { altOf, floorOf, mpfAt } from '../data/height.js';
import { ERAS, ERA_STYLE, MARKS, eraAt } from '../data/eras.js';
import { S, save } from '../sim/state.js';
import { rates, isCapped } from '../sim/economy.js';
import { fmt, fmtM } from '../ui/format.js';
import { ctx, r, R, T, lerp, clamp } from './canvas.js';
import { cam, sx, sy, updateCamera, startMilestone, cinematic, MILESTONES } from './camera.js';
import { V } from './view.js';
import { dust, updateParticles, drawParticles } from './particles.js';
import { drawSky, drawClouds } from './sky.js';
import { drawGroundBack, drawGroundFront } from './ground.js';
import { worker } from './workers.js';
import { blit } from './sprites.js';
import { palletSprite } from './props.js';
import { drawFloors, shafts, scaffold, crane, floorLOD } from './tower.js';
import { drawTourGround, drawTourAir, drawForSale } from './tourism.js';
import { buildState, buildStateWith, drawBuild, drawPallets, workX } from './construction.js';
import { FLAGS } from '../data/flags.js';
import { obraSigns, zzz, sweat, warn, cracks } from './signs.js';
import { VIVA } from '../data/viva.js';
import { pollEvents, emit } from './events.js';
import { updateEffects, MAX_TOP_WORKERS } from './effects.js';

const baseFloor = () => Math.floor(S.floors);
let msIdx = -1; // próximo marco de andares ainda não comemorado

// Avança o estado visual (elevadores, modo de animação, câmera, faixas)
export function updateView(dt, speed) {
  V.t += dt;
  pollEvents();          // compras, andares concluídos e eras viram eventos visuais
  updateEffects(dt);
  const R0 = rates();
  for (let i = 0; i < 6; i++) V.elev[i] += dt * speed / R0.trip;
  // obra muito rápida: os efeitos por peça (poeira, som, etapas) viram agregados para não piscar
  V.fast = Math.min(R0.prod, R0.tran, R0.lay) / R0.fcost * speed > 0.5;
  updateParticles(dt);
  // era nova (S.era é atualizado pela simulação; aqui só se anuncia)
  if (V.lastEra === null) V.lastEra = S.era;
  if (S.era > V.lastEra) {
    V.lastEra = S.era;
    V.toast = { a: FLAGS.viva ? 'NOVA ERA · NOVAS TECNOLOGIAS NA ÁRVORE' : `NOVA ERA · ANEL ${S.era + 1} DA ÁRVORE ABERTO`, b: ERAS[S.era].n.toUpperCase(), t: 4 };
    save();
  }
  if (V.toast) V.toast.t -= dt;
  // marcos de andares: a câmera se afasta para mostrar a conquista (marcos já passados ao carregar não tocam)
  const fl = Math.floor(S.floors);
  if (msIdx < 0) msIdx = MILESTONES.filter(m => m <= fl).length;
  if (msIdx < MILESTONES.length && fl >= MILESTONES[msIdx]) {
    while (msIdx < MILESTONES.length && fl >= MILESTONES[msIdx]) msIdx++;
    const m = MILESTONES[msIdx - 1];
    startMilestone(m, `${fmt(m)} ANDARES`, `${fmtM(altOf(m))} · ${ERAS[eraAt(altOf(m))].n}`);
  }
  updateCamera(dt, baseFloor() * FH, (S.floors + 1) * FH);
}
export const resetMilestones = () => { msIdx = -1; };

export function render() {
  const R0 = rates(), built = Math.floor(S.floors), p = S.floors - built, capped = isCapped(R0);
  const base = baseFloor(), topWP = base * FH;
  const sg = obraSigns(R0);
  if (!V.preview) V.signs = sg; // as dicas para quem começa leem os sinais (ui/tips.js)
  drawSky(); drawClouds(false);
  drawGroundBack();
  if (FLAGS.viva && capped) cracks();
  drawTourAir(topWP);
  shafts(topWP, S.ground > 0.5);
  drawFloors(base);
  // marcos de altitude na lateral esquerda (pula rótulos colados no anterior)
  let lastY = 1e9;
  MARKS.forEach(m => {
    const y = sy(floorOf(m) * FH);
    if (y > 8 && y < H - 4 && lastY - y > 22) {
      lastY = y;
      r(0, y, Math.max(0, sx(TL) - 8), 1, 'rgba(255,255,255,.35)');
      ctx.font = '600 9px "Chakra Petch", sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillText(fmtM(m), 4, y - 7);
    }
  });
  const e = eraAt(altOf(base)), s = ERA_STYLE[e], working = !capped && S.top > 0.05;
  const nb = Math.min(S.lv.pedreiro, 4), y0 = topWP;
  if (capped) drawCapped(y0, nb);
  else drawBlocks(y0, p, s, e, Math.min(S.lv.pedreiro, MAX_TOP_WORKERS), working, sg);
  if (!capped) drawForSale(topWP);
  drawGroundFront(R0.prod, sg);
  drawTourGround(R0.tour);
  drawParticles();
  if (V.preview) { drawClouds(true); return; } // prévia: sem textos, faixas nem marcos
  drawFloats();
  drawClouds(true);
  drawToast();
  drawMilestone();
}

function topStock(y0, s) {
  const n = Math.min(8, Math.ceil(S.top / 8));
  for (let i = 0; i < n; i++) { const x = TL + TW - 46 + (i % 2) * 20, y = y0 + SLAB + Math.floor(i / 2) * 11; blit(palletSprite(s.brick), x - 2, y - 1, 0, 13); }
}

function drawCapped(y0, nb) {
  scaffold(y0);
  const s = ERA_STYLE[eraAt(altOf(S.floors))]; // laje do andar parado (onde os pedreiros ficam)
  R(TL, y0, TW, SLAB, s.slab); R(TL, y0 + SLAB - 2, TW, 2, s.hi); R(TL, y0 + 2, TW, 1, 'rgba(0,0,0,.25)');
  if (FLAGS.viva) { // sem texto: a obra parou, os pedreiros sentam (respirando devagar) e a base avisa
    const n = Math.min(nb, 4), gap = n > 1 ? (TW - 70) / (n - 1) : 0;
    for (let j = 0; j < n; j++) { const x = TL + 26 + j * gap + (j % 2 ? 18 : 0); worker(x, y0 + SLAB, { sit: true, phase: V.t * 0.6 + j * 0.7, skin: j, flip: j % 2 === 1 }); zzz(x, y0 + SLAB + 44, j); }
    warn(0, 8); warn(0, y0 + FH + 14); // na base (rachaduras) e no topo (obra parada)
    return;
  }
  R(-70, y0 + 26, 140, 34, '#2a2d38'); R(-66, y0 + 30, 132, 26, '#f2b630');
  if (!T('LIMITE DA FUNDAÇÃO', 0, y0 + 43, 11, '#11131a', 'center')) R(-50, y0 + 41, 100, 4, '#11131a');
  for (let j = 0; j < nb; j++) worker(TL + 30 + j * 56, y0 + SLAB, { phase: 0, skin: j, flip: j % 2 === 1 });
}

// Modo 1: bloco a bloco — o andar é montado em etapas (estrutura, paredes, janelas, acabamento)
// som de cada peça por etapa
const PIECE = { entrega: 'brick', estrutura: 'beam', paredes: 'brick', janelas: 'glass', acabamento: 'brick' };
function drawBlocks(y0, p, s, e, nb, working, sg = {}) {
  scaffold(y0, false);
  R(TL, y0, TW, SLAB, s.slab); R(TL, y0 + SLAB - 2, TW, 2, s.hi);
  const lvl = floorLOD(), st = FLAGS.viva ? buildStateWith(p, VIVA.phases) : buildState(p), ph = st.phase.i, pid = st.phase.id;
  drawBuild(R, y0, st, s, lvl);
  if (st.delivery !== undefined) drawPallets(R, y0, st, s);
  const slotX = workX(st);
  // peça nova: poeira e som; etapa nova: aviso sonoro (eventos só de apresentação; nada disso na prévia)
  if (!V.preview && !V.fast && V.lastK >= 0 && st.unit > V.lastK) {
    dust(slotX, y0 + SLAB + (pid === 'estrutura' ? FH - 20 : 30), '#d8cdb8', 4);
    if (e >= 2 || S.lv.ferram > 0) dust(slotX, y0 + SLAB + 30, '#ffe27a', 2);
    emit('piece_placed', { piece: S.lv.ferram > 0 && pid === 'paredes' ? 'drill' : PIECE[pid] });
  }
  if (!V.preview) {
    if (!V.fast && V.lastPhase >= 0 && ph > V.lastPhase) emit('floor_phase_changed', { phase: st.phase.id });
    V.lastK = st.unit; V.lastPhase = ph;
  }
  if (st.delivery === undefined) topStock(y0, s);
  // pedreiros lentos: material sobrando no topo vira paletes empilhados do lado esquerdo
  if (sg.overloaded) for (let k = 0; k < Math.min(10, Math.floor(sg.surplus * 4)); k++) {
    const x = TL + 6 + (k % 2) * 22, yy = y0 + SLAB + Math.floor(k / 2) * 12;
    blit(palletSprite(s.brick), x - 1, yy - 1, 0, 13);
  }
  // falta material: só a parte da equipe que o material sustenta trabalha (material chegando ÷ capacidade de assentar);
  // os outros descansam com 💤. Com o prédio subindo rápido, quase todos trabalham.
  const busyN = sg.starving ? Math.max(1, Math.min(nb, Math.round(nb * (sg.busy ?? 0)))) : nb;
  const resting = j => j >= busyN;
  // o pedreiro (que está trabalhando) mais perto da próxima peça vai até ela
  const home = j => nb === 1 ? 0 : TL + 34 + j * (TW - 100) / (nb - 1);
  let act = 0, best = 1e9;
  for (let j = 0; j < busyN; j++) { const d = Math.abs(home(j) - slotX); if (d < best) { best = d; act = j; } }
  const fy = y0 + SLAB, pace = 1 + 0.15 * Math.min(S.lv.treino, 6), drill = S.lv.ferram > 0;
  // pedreiros caminham com velocidade de gente (quem acabou de ser contratado entra andando)
  const dtv = clamp(V.t - (V.bxT ?? V.t), 0, .1), stepMax = 150 * pace * dtv;
  if (!V.preview) V.bxT = V.t;
  techBack(y0, fy);
  const bx = [];
  for (let j = 0; j < nb; j++) {
    const tx = resting(j) ? home(j) : j === act ? clamp(slotX - 26, TL + 10, TL + TW - 40) : home(j);
    const x = V.preview || V.bx[j] === undefined ? tx : V.bx[j] + clamp(tx - V.bx[j], -stepMax, stepMax);
    if (!V.preview) V.bx[j] = x;
    bx[j] = x;
    const walk = Math.abs(x - tx) > 2, sit = resting(j) && !walk;
    worker(x, fy, { sit, hammer: working && !walk && !sit, drill, phase: V.t * (j === act ? 3 : 1.6) * pace + j * .37, walk, flip: walk && tx < x, skin: j });
    if (sit) zzz(x, fy + 42, j);
    else if (sg.overloaded && !walk) sweat(x, fy + 50, j);
  }
  // peça a caminho: tijolo nas paredes, vidro nas janelas
  if (working && (pid === 'paredes' || pid === 'janelas')) {
    const f = st.frac, hx = bx[act] + 22, hy = fy + 44, ty = pid === 'paredes' ? y0 + SLAB + 40 : y0 + 46;
    const px = lerp(hx, slotX - 10, f), py = lerp(hy, ty, f) + Math.sin(f * Math.PI) * 16;
    if (pid === 'paredes') { R(px, py, 19, 10, s.brick); R(px, py + 9, 18, 1, s.hi); }
    else { R(px, py, 16, 20, s.frame); R(px + 2, py + 2, 12, 16, s.glass); R(px + 4, py + 6, 2, 10, 'rgba(255,255,255,.4)'); }
  }
  // acima de MAX_TOP_WORKERS, os pedreiros viram uma equipe com contador (limite visual)
  if (S.lv.pedreiro > MAX_TOP_WORKERS) { R(-72, y0 + FH + 8, 144, 16, 'rgba(17,19,26,.75)'); T(`EQUIPE DE ${S.lv.pedreiro} PEDREIROS`, 0, y0 + FH + 16, 9, '#ece6d6', 'center'); }
  if (S.lv.pedreiro >= 2) {
    const q = (V.t * .16 * pace) % 1, go = q < .5, x = lerp(TL + TW - 30, TL + 40, go ? q * 2 : 2 - q * 2);
    worker(x, fy, { walk: true, phase: V.t * 3, carry: go ? (pid === 'janelas' ? s.glass : s.brick) : null, flip: go, skin: 3 });
  }
  for (let k = 0; k < Math.min(3, Math.ceil((S.lv.mestre || 0) / 2)); k++) worker(TL + TW - 22 - k * 30, fy, { boss: true, flip: true, phase: V.t + k * 0.6, skin: (2 + k) % 4 });
  if (S.lv.guindaste > 0) craneHelper(y0, s, pid);
  techFront(y0, fy, s);
}

// segmento grosso entre dois pontos (braços de robô)
function seg(x1, y1, x2, y2, w, c) {
  const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 2));
  for (let k = 0; k <= n; k++) R(x1 + (x2 - x1) * k / n - w / 2, y1 + (y2 - y1) * k / n - w / 2, w, w, c);
}
// Tecnologias de era visíveis no topo (uma peça a mais por nível):
// Robôs de montagem = braços robóticos na laje; Escoramento = escoras de aço; Teletransporte = plataforma com feixe
function techBack(y0, fy) {
  techTop(y0, fy);
  const esc = S.lv.escoramento || 0;
  for (let k = 0; k < esc * 2; k++) { const x = TL + 14 + k * (TW - 28) / Math.max(1, esc * 2 - 1); R(x, fy, 3, 70, '#8f96a3'); R(x, fy, 1, 70, '#c7ccd6'); R(x - 3, fy + 68, 9, 3, '#5a5f6a'); R(x - 3, fy, 9, 2, '#5a5f6a'); }
  if (S.lv.teleporte > 0) {
    const px = TL + TW - 50, a = 0.35 + 0.25 * Math.sin(V.t * 4);
    R(px, fy, 34, 4, '#3b4152'); R(px + 2, fy + 3, 30, 2, '#5fe0ff');
    R(px + 4, fy + 5, 26, 70, `rgba(95,224,255,${a.toFixed(2)})`); R(px + 14, fy + 5, 6, 70, `rgba(220,250,255,${(a + .2).toFixed(2)})`);
  }
  const rb = Math.min(3, S.lv.robos || 0);
  for (let k = 0; k < rb; k++) {
    const bx = TL + 20 + k * 34, t = V.t * 1.6 + k * 1.7, a1 = 0.45 + Math.sin(t) * 0.4, a2 = 0.9 + Math.sin(t * 1.3) * 0.6;
    R(bx - 9, fy, 18, 6, '#3b4152'); R(bx - 7, fy + 6, 14, 5, '#d0d5de'); R(bx - 7, fy + 10, 14, 1, '#f2b630');
    const ex = bx + Math.sin(a1) * 30, ey = fy + 11 + Math.cos(a1) * 30, hx = ex + Math.sin(a1 + a2) * 26, hy = ey + Math.cos(a1 + a2) * 26;
    seg(bx, fy + 11, ex, ey, 5, '#e0702a'); seg(ex, ey, hx, hy, 4, '#f2b630');
    R(ex - 3, ey - 3, 6, 6, '#3b4152'); R(hx - 4, hy - 5, 8, 4, '#3b4152'); R(hx - 3, hy - 9, 2, 4, '#5a5f6a'); R(hx + 1, hy - 9, 2, 4, '#5a5f6a');
    if (Math.floor(V.t * 2 + k) % 2) R(bx - 1, fy + 3, 2, 2, '#5fe07a');
  }
}
// Soldadores = faíscas de solda na estrutura; Drones = drones levando peças ao redor do topo
function techFront(y0, fy, s) {
  const sd = Math.min(3, S.lv.soldadores || 0);
  for (let k = 0; k < sd; k++) {
    const x = TL + 40 + k * 70, y = fy + 64 - (k % 2) * 18;
    if ((V.t * 1.7 + k * 0.37) % 1 < 0.55) {
      R(x - 2, y - 2, 5, 5, '#fff6c8'); R(x - 4, y, 9, 1, '#ffffff'); R(x, y - 4, 1, 9, '#ffffff');
      if (!V.fast && Math.random() < 0.35) dust(x, y, '#ffd23a', 1);
    }
  }
  if (cam.z < 0.2) return;
  const dn = Math.min(3, S.lv.drones || 0);
  for (let k = 0; k < dn; k++) {
    const x = Math.sin(V.t * 0.6 + k * 2.1) * (TW * 0.7), y = y0 + FH + 26 + Math.sin(V.t * 1.4 + k) * 14 + k * 10, f = Math.floor(V.t * 20 + k) % 2;
    R(x - 8, y, 16, 5, '#3b4152'); R(x - 6, y + 4, 12, 2, '#d0d5de'); R(x - 1, y + 1, 2, 2, Math.floor(V.t * 3) % 2 ? '#ff3b3b' : '#5fe07a');
    R(x - 13, y + 5, 2, 3, '#5a5f6a'); R(x + 11, y + 5, 2, 3, '#5a5f6a');
    R(x - 18 + f * 2, y + 8, 12 - f * 4, 1, '#c7ccd6'); R(x + 6 + f * 2, y + 8, 12 - f * 4, 1, '#c7ccd6');
    R(x, y - 6, 1, 6, '#2a2a33'); R(x - 6, y - 12, 12, 6, s.brick); R(x - 6, y - 7, 12, 1, s.hi);
  }
}

// Guindaste de torre = transporte vertical (Logística): em ciclos calmos, que não dependem da velocidade da obra,
// o gancho desce até o pátio do térreo, sobe com um palete (ou uma viga, na estrutura) e o deixa na pilha do topo,
// junto do que os elevadores trazem; os pedreiros pegam dali. A obra segue bloco a bloco.
const CRANE_CYCLE = 8, DROP_X = TL + TW - 36, PICK_X = 205;
function craneHelper(y0, s, pid) {
  const q = (V.t % CRANE_CYCLE) / CRANE_CYCLE, park = y0 + FH * 0.75, deck = y0 + SLAB + 32, air = y0 + FH - 6;
  const ease = t => t * t * (3 - 2 * t), ground = 34;
  let tx, hy, load = false;
  if (S.ground < 0.5) { tx = DROP_X + 30 + Math.sin(V.t * 0.5) * 20; hy = park; }               // pátio vazio: espera
  else if (q < 0.3) { const t = ease(q / 0.3); tx = lerp(DROP_X, PICK_X, t); hy = lerp(deck, ground, t); }      // desce até o pátio
  else if (q < 0.4) { tx = PICK_X; hy = ground; load = q > 0.35; }                                  // engancha o palete
  else if (q < 0.82) { const t = ease((q - 0.4) / 0.42); tx = lerp(PICK_X, DROP_X, t); hy = lerp(ground, air, t); load = true; } // iça
  else if (q < 0.92) { tx = DROP_X; hy = lerp(air, deck, ease((q - 0.82) / 0.1)); load = true; }   // pousa na pilha do topo
  else { tx = DROP_X; hy = deck; }                                                                   // solta
  crane(y0, tx, hy);
  if (!load) return;
  if (pid === 'estrutura') { R(tx - 30, hy - 26, 60, 7, s.frame); R(tx - 30, hy - 26, 60, 2, s.hi); R(tx - 1, hy - 19, 2, 2, '#c7ccd6'); }
  else { const n = Math.min(3, 1 + Math.floor((S.lv.guindaste || 1) / 4)); for (let k = 0; k < n; k++) blit(palletSprite(s.brick), tx - 11 - (n - 1) * 12 + k * 24, hy - 20, 0, 13); }
}

// textos que sobem e somem (compras, andar concluído)
function drawFloats() {
  for (const f of V.floats) {
    const k = f.t / f.life, y = f.y + f.t * 20;
    ctx.globalAlpha = clamp((1 - k) * 3, 0, 1) * clamp(f.t * 6, 0, 1);
    T(f.a, f.x + 1, y - 1, 13, '#11131a', 'center'); T(f.a, f.x, y, 13, f.c, 'center');
    if (f.b) { T(f.b, f.x + 1, y - 16, 9, '#11131a', 'center'); T(f.b, f.x, y - 15, 9, '#ece6d6', 'center'); }
  }
  ctx.globalAlpha = 1;
}

// faixa listrada no alto da tela (era nova)
function banner(a, b, alpha, y = 40) {
  ctx.globalAlpha = alpha;
  for (let x = 0; x < W; x += 12) { r(x, y, 6, 4, '#f2b630'); r(x + 6, y, 6, 4, '#11131a'); r(x, y + 36, 6, 4, '#11131a'); r(x + 6, y + 36, 6, 4, '#f2b630'); }
  r(0, y + 4, W, 32, 'rgba(17,19,26,.92)');
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f2b630'; ctx.font = '600 10px "Chakra Petch", sans-serif'; ctx.fillText(a, W / 2, y + 13);
  ctx.fillStyle = '#ece6d6'; ctx.font = '600 16px "Chakra Petch", sans-serif'; ctx.fillText(b, W / 2, y + 27);
  ctx.textAlign = 'left'; ctx.globalAlpha = 1;
}
function drawToast() {
  if (!V.toast || V.toast.t <= 0 || cinematic()) return;
  banner(V.toast.a, V.toast.b, clamp(V.toast.t, 0, 1));
}
function drawMilestone() {
  const c = cinematic(); if (!c) return;
  const a = clamp(Math.min(c.t - .8, 5.2 - c.t) * 2, 0, 1);
  if (a <= 0) return;
  banner('MARCO DA OBRA', c.title, a, 24);
  ctx.globalAlpha = a; r(W / 2 - 110, 66, 220, 18, 'rgba(17,19,26,.75)');
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ece6d6'; ctx.font = '600 10px "Chakra Petch", sans-serif';
  ctx.fillText(c.sub, W / 2, 75); ctx.textAlign = 'left'; ctx.globalAlpha = 1;
}
