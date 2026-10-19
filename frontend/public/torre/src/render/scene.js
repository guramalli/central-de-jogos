// Monta o quadro: céu, térreo, torre, obra no topo (4 modos), turismo, partículas e faixas.
import { W, H, FH, SLAB, TW, TL, MPF, PANELS } from '../data/constants.js';
import { ERAS, ERA_STYLE, MARKS, eraAt } from '../data/eras.js';
import { S, save } from '../sim/state.js';
import { rates, isCapped } from '../sim/economy.js';
import { fmt, fmtM } from '../ui/format.js';
import { ctx, r, R, T, lerp, clamp } from './canvas.js';
import { cam, sx, sy, updateCamera, startMilestone, cinematic, MILESTONES, ZMAX } from './camera.js';
import { V } from './view.js';
import { dust, updateParticles, drawParticles } from './particles.js';
import { drawSky, drawClouds } from './sky.js';
import { drawGroundBack, drawGroundFront } from './ground.js';
import { worker } from './workers.js';
import { blit } from './sprites.js';
import { palletSprite } from './props.js';
import { facade, drawFloors, clipWorld, shafts, scaffold, crane, airship, floorLOD } from './tower.js';
import { drawTourGround, drawTourAir, drawForSale } from './tourism.js';
import { buildState, buildStateWith, drawBuild, drawPallets, workX } from './construction.js';
import { FLAGS } from '../data/flags.js';
import { obraSigns, zzz, sweat, warn, cracks } from './signs.js';
import { VIVA } from '../data/viva.js';
import { pollEvents, emit } from './events.js';
import { updateEffects, MAX_TOP_WORKERS } from './effects.js';

export const MODES = { 1: 'Bloco a bloco', 2: 'Painéis içados', 3: 'Andares inteiros', 4: 'Megablocos' };

const baseFloor = () => V.mode === 4 ? Math.floor(S.floors / 5) * 5 : Math.floor(S.floors);
let msIdx = -1; // próximo marco de andares ainda não comemorado

// Avança o estado visual (elevadores, modo de animação, câmera, faixas)
export function updateView(dt, speed) {
  V.t += dt;
  pollEvents();          // compras, andares concluídos e eras viram eventos visuais
  updateEffects(dt);
  const R0 = rates();
  for (let i = 0; i < 6; i++) V.elev[i] += dt * speed / R0.trip;
  // modo visual pela velocidade real (andares por segundo), com histerese
  const fr = Math.min(R0.prod, R0.tran, R0.lay) / R0.fcost * speed, g = S.lv.guindaste;
  const want = fr > 1.5 && g >= 4 ? 4 : fr > .35 && g >= 2 ? 3 : fr > .08 && g >= 1 ? 2 : 1;
  if (!isCapped(R0)) {
    if (want !== V.mode) {
      V.modeHold += dt;
      if (V.modeHold > 1.2) { V.mode = want; V.lastK = -1; V.modeHold = 0; }
    } else V.modeHold = 0;
  }
  updateParticles(dt);
  // era nova (S.era é atualizado pela simulação; aqui só se anuncia)
  if (V.lastEra === null) V.lastEra = S.era;
  if (S.era > V.lastEra) {
    V.lastEra = S.era;
    V.toast = { a: `NOVA ERA · ANEL ${S.era + 1} DA ÁRVORE ABERTO`, b: ERAS[S.era].n.toUpperCase(), t: 4 };
    save();
  }
  if (V.toast) V.toast.t -= dt;
  // marcos de andares: a câmera se afasta para mostrar a conquista (marcos já passados ao carregar não tocam)
  const fl = Math.floor(S.floors);
  if (msIdx < 0) msIdx = MILESTONES.filter(m => m <= fl).length;
  if (msIdx < MILESTONES.length && fl >= MILESTONES[msIdx]) {
    while (msIdx < MILESTONES.length && fl >= MILESTONES[msIdx]) msIdx++;
    const m = MILESTONES[msIdx - 1];
    startMilestone(m, `${fmt(m)} ANDARES`, `${fmtM(m * MPF)} · ${ERAS[eraAt(m * MPF)].n}`);
  }
  // modos rápidos precisam ver acima do topo: andar içado (3) e megabloco com dirigível (4)
  const [zCap, above] = V.mode === 4 ? [0.42, FH * 6] : V.mode === 3 ? [0.75, FH * 2] : [ZMAX, 0];
  updateCamera(dt, baseFloor() * FH, (S.floors + 1) * FH, zCap, above);
}
export const resetMilestones = () => { msIdx = -1; };

// linha reta em coordenadas de mundo (cabos)
function line(x0, y0, x1, y1, c) {
  ctx.strokeStyle = c; ctx.lineWidth = Math.max(1, Math.round(2 * cam.z));
  ctx.beginPath(); ctx.moveTo(Math.round(sx(x0)) + .5, Math.round(sy(y0)) + .5); ctx.lineTo(Math.round(sx(x1)) + .5, Math.round(sy(y1)) + .5); ctx.stroke();
}
// desenha fn com o mundo deslocado (andares içados balançando)
function shifted(dx, dy, fn) { cam.cx -= dx; cam.cy -= dy; fn(); cam.cx += dx; cam.cy += dy; }

export function render() {
  const R0 = rates(), built = Math.floor(S.floors), p = S.floors - built, capped = isCapped(R0);
  const mode = V.mode, base = baseFloor(), topWP = base * FH;
  const sg = obraSigns(R0);
  drawSky(); drawClouds(false);
  drawGroundBack();
  if (FLAGS.viva && capped) cracks();
  drawTourAir(topWP);
  shafts(topWP, S.ground > 0.5);
  drawFloors(base);
  // marcos de altitude na lateral esquerda (pula rótulos colados no anterior)
  let lastY = 1e9;
  MARKS.forEach(m => {
    const y = sy(m / MPF * FH);
    if (y > 8 && y < H - 4 && lastY - y > 22) {
      lastY = y;
      r(0, y, Math.max(0, sx(TL) - 8), 1, 'rgba(255,255,255,.35)');
      ctx.font = '600 9px "Chakra Petch", sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillText(fmtM(m), 4, y - 7);
    }
  });
  const e = eraAt(base * MPF), s = ERA_STYLE[e], working = !capped && S.top > 0.05;
  const nb = Math.min(S.lv.pedreiro, 4), y0 = topWP;
  if (capped) drawCapped(y0, nb);
  else if (mode === 1) drawBlocks(y0, p, s, e, Math.min(S.lv.pedreiro, MAX_TOP_WORKERS), working, sg);
  else if (mode === 2) drawPanels(y0, built, p, s, e, nb);
  else if (mode === 3) drawWholeFloor(y0, built, p, e, nb);
  else drawMegablock(y0, base);
  if (!capped && mode < 4) drawForSale(topWP);
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
  if (FLAGS.viva) { // sem texto: a obra parou, os pedreiros sentam e a base avisa
    for (let j = 0; j < nb; j++) { const x = TL + 30 + j * 56; worker(x, y0 + SLAB, { sit: true, phase: 0, skin: j, flip: j % 2 === 1 }); zzz(x, y0 + SLAB + 44, j); }
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
  if (!V.preview && V.lastK >= 0 && st.unit > V.lastK) {
    dust(slotX, y0 + SLAB + (pid === 'estrutura' ? FH - 20 : 30), '#d8cdb8', 4);
    if (e >= 2 || S.lv.ferram > 0) dust(slotX, y0 + SLAB + 30, '#ffe27a', 2);
    emit('piece_placed', { piece: S.lv.ferram > 0 && pid === 'paredes' ? 'drill' : PIECE[pid] });
  }
  if (!V.preview) {
    if (V.lastPhase >= 0 && ph > V.lastPhase) emit('floor_phase_changed', { phase: st.phase.id });
    V.lastK = st.unit; V.lastPhase = ph;
  }
  if (st.delivery === undefined) topStock(y0, s);
  // pedreiros lentos: material sobrando no topo vira paletes empilhados do lado esquerdo
  if (sg.overloaded) for (let k = 0; k < Math.min(10, Math.floor(sg.surplus * 4)); k++) {
    const x = TL + 6 + (k % 2) * 22, yy = y0 + SLAB + Math.floor(k / 2) * 12;
    blit(palletSprite(s.brick), x - 1, yy - 1, 0, 13);
  }
  const idle = !!sg.starving; // falta material: ninguém tem o que assentar
  // o pedreiro mais perto da próxima peça vai até ela
  const home = j => nb === 1 ? 0 : TL + 34 + j * (TW - 100) / (nb - 1);
  let act = 0, best = 1e9;
  for (let j = 0; j < nb; j++) { const d = Math.abs(home(j) - slotX); if (d < best) { best = d; act = j; } }
  const fy = y0 + SLAB, pace = 1 + 0.15 * Math.min(S.lv.treino, 6), drill = S.lv.ferram > 0;
  // pedreiros caminham com velocidade de gente (quem acabou de ser contratado entra andando)
  const dtv = clamp(V.t - (V.bxT ?? V.t), 0, .1), stepMax = 150 * pace * dtv;
  if (!V.preview) V.bxT = V.t;
  const bx = [];
  for (let j = 0; j < nb; j++) {
    const tx = idle ? home(j) : j === act ? clamp(slotX - 26, TL + 10, TL + TW - 40) : home(j);
    const x = V.preview || V.bx[j] === undefined ? tx : V.bx[j] + clamp(tx - V.bx[j], -stepMax, stepMax);
    if (!V.preview) V.bx[j] = x;
    bx[j] = x;
    const walk = Math.abs(x - tx) > 2, sit = idle && !walk;
    worker(x, fy, { sit, hammer: working && !walk && !idle, drill, phase: V.t * (j === act ? 3 : 1.6) * pace + j * .37, walk, flip: walk && tx < x, skin: j });
    if (sit) zzz(x, fy + 42, j);
    else if (sg.overloaded && !walk) sweat(x, fy + 50, j);
  }
  // peça a caminho: tijolo nas paredes, vidro nas janelas
  if (working && !idle && (pid === 'paredes' || pid === 'janelas')) {
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
  if (S.lv.mestre > 0) worker(TL + TW - 22, fy, { boss: true, flip: true, phase: V.t, skin: 2 });
  if (S.lv.guindaste > 0) crane(y0, TL + TW + 60 + Math.sin(V.t * .5) * 30, y0 + FH * .6);
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

// Modo 2: painéis içados pelo guindaste
function drawPanels(y0, built, p, s, e, nb) {
  scaffold(y0);
  const PW = TW / PANELS, n = Math.floor(p * PANELS);
  R(TL, y0, TW, SLAB, s.slab);
  if (n > 0) clipWorld(TL, y0 - 2, PW * n, FH + 4, () => facade(built));
  if (n !== V.lastK && n > V.lastK && V.lastK >= 0) dust(TL + (n - 1) * PW + PW / 2, y0 + 30, e >= 2 ? '#ffe27a' : '#d8cdb8', 8);
  V.lastK = n;
  const f = p * PANELS - n, sxp = TL + n * PW, hiY = y0 + FH + 26, startX = TL + TW + 70;
  let px, py;
  if (f < .35) { px = startX; py = lerp(y0, hiY, f / .35); }
  else if (f < .7) { px = lerp(startX, sxp, (f - .35) / .35); py = hiY; }
  else { px = sxp; py = lerp(hiY, y0, (f - .7) / .3); }
  crane(y0, px + PW / 2, py + FH + 2);
  line(px + PW / 2, py + FH + 2, px + 4, py + FH, '#c7ccd6'); line(px + PW / 2, py + FH + 2, px + PW - 4, py + FH, '#c7ccd6');
  R(px, py, PW, FH, s.wall); R(px, py, PW, SLAB, s.slab);
  R(px + 6, py + 22, PW - 12, 48, s.frame); R(px + 9, py + 25, PW - 18, 42, s.glass); R(px, py + FH - 3, PW, 3, s.hi);
  for (let j = 0; j < Math.min(nb, 3); j++) {
    const wx = clamp(sxp - 30 + j * 30, TL + 12, TL + TW - 30);
    worker(wx, y0 + SLAB, { hammer: true, phase: V.t * 2 + j * .4, skin: j });
  }
}

// Modo 3: o guindaste iça o andar inteiro
function drawWholeFloor(y0, built, p, e, nb) {
  const f = p, sway = Math.round(Math.sin(V.t * 1.8) * (1 - f) * 12), lift = Math.round((1 - f) * FH * 2.4);
  const hookY = y0 + lift + FH + 40;
  crane(y0, sway, hookY);
  shifted(sway, lift, () => facade(built));
  line(sway, hookY - 9, TL + sway + 6, y0 + lift + FH, '#c7ccd6'); line(sway, hookY - 9, TL + TW + sway - 6, y0 + lift + FH, '#c7ccd6');
  if (f > .92 && Math.floor(V.t * 10) % 2) dust(0, y0 + 4, e >= 2 ? '#ffe27a' : '#d8cdb8', 3);
  for (let j = 0; j < Math.min(nb, 2); j++) worker(j ? TL + TW - 30 : TL + 20, y0 + SLAB, { hammer: f > .85, phase: V.t * 2 + j, skin: j, flip: j === 1 });
}

// Modo 4: dirigível baixa megablocos de 5 andares
function drawMegablock(y0, base) {
  const f = (S.floors - base) / 5, dy = Math.round((1 - f) * FH * 3), sway = Math.round(Math.sin(V.t * 1.2) * (1 - f) * 16);
  shifted(sway, dy, () => { for (let j = 0; j < 5; j++) facade(base + j); });
  const topY = y0 + 5 * FH + dy, ay = topY + 70;
  line(sway, ay - 26, TL + sway + 8, topY, '#c7ccd6'); line(sway, ay - 26, TL + TW + sway - 8, topY, '#c7ccd6');
  airship(sway, ay);
  if (f > .95) dust(0, y0 + 4, '#ffe27a', 5);
  for (let j = 0; j < 2; j++) worker(j ? TL + TW - 30 : TL + 20, y0 + SLAB, { hammer: f > .85, phase: V.t * 2 + j, skin: j, flip: j === 1 });
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
