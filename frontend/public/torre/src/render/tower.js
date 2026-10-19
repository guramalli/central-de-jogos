// Torre em coordenadas de mundo: fachadas com nível de detalhe pelo zoom, poços de elevador,
// andaime, guindaste e dirigível.
import { H, FH, SLAB, TW, TL, MPF } from '../data/constants.js';
import { ERAS, ERA_STYLE, eraAt } from '../data/eras.js';
import { S } from '../sim/state.js';
import { typeAt } from '../sim/realty.js';
import { ctx, R, Rv, hash, mix } from './canvas.js';
import { cam, worldY, sx, sy } from './camera.js';
import { V } from './view.js';
import { blit, shade } from './sprites.js';
import { brickTile, eraTile, shaftTile, carSprite, shaftTopSprite, mastTile, jibTile, cabSprite, weightSprite, trolleySprite, hookSprite } from './props.js';

const WIN_X = [12, 72, 132, 192];     // janelas: x relativo à borda esquerda
const WIN_W = 36, WIN_Y = 22, WIN_H = 48;
const CURTAINS = ['#c0504d', '#4f81bd', '#9bbb59', '#8064a2', '#f79646', '#2c8c8c'];
const FAR = ERA_STYLE.map(s => ({ occ: mix(s.wall, s.lit, 0.3), vac: mix(s.wall, '#000000', 0.25) }));

// janela acesa ou apagada, muda devagar com o tempo
export function lit(i, k) { return hash(i * 7 + k, Math.floor(V.t / 9 + hash(i, k) * 9)) < .42; }
const litW = lit;

// nível de detalhe pelo tamanho de um andar na tela
export const floorLOD = () => { const px = FH * cam.z; return px >= 40 ? 3 : px >= 12 ? 2 : px >= 2.5 ? 1 : 0; };

// interior de uma janela acesa, conforme o tipo do andar
function interior(i, k, wx, y, t) {
  const c = CURTAINS[Math.floor(hash(i, k + 9) * CURTAINS.length)];
  if (t === 'escr') { for (let yy = y + 6; yy < y + WIN_H; yy += 6) R(wx, yy, WIN_W, 2, 'rgba(0,0,0,.14)'); if (hash(i, k) < .5) R(wx + 8, y, 10, 14, 'rgba(40,40,60,.35)'); }
  else if (t === 'hotel') { R(wx, y, 8, WIN_H, c); R(wx + 24, y + 30, 6, 6, '#fff2b0'); R(wx + 26, y + 20, 2, 10, '#6b4a30'); }
  else if (t === 'rest') { R(wx + 4, y + 8, 12, 3, '#6b4a30'); R(wx + 20, y + 8, 12, 3, '#6b4a30'); if (hash(i, k + 3) < .6) { R(wx + 22, y + 11, 6, 12, '#3a3a50'); R(wx + 23, y + 23, 4, 5, '#c68642'); } }
  else if (t === 'obs') { R(wx + 6, y + 6, 4, 18, '#3a3a50'); R(wx + 8, y + 20, 18, 5, '#3a3a50'); R(wx + 24, y + 19, 4, 7, '#9aa3b5'); }
  else { R(wx, y, 6, WIN_H, c); R(wx + WIN_W - 6, y, 6, WIN_H, c); if (hash(i, k + 5) < .35) { R(wx + 14, y, 8, 18, 'rgba(30,30,40,.45)'); R(wx + 15, y + 18, 6, 6, 'rgba(30,30,40,.45)'); } }
}

// Fachada do andar i. lvl: 1 simples, 2 molduras, 3 completo
export function facade(i, lvl = floorLOD()) {
  const e = eraAt(i * MPF), s = ERA_STYLE[e], y0 = i * FH;
  // andar recém-concluído: todas as luzes acendem por um instante (Obra Viva)
  const flash = V.flash && V.flash.i === i, occ = i < S.assigned || flash;
  const lit = flash ? () => true : litW;
  // perto: parede pronta num sprite de pixel art (tijolo ou a parede da era), janelas por cima
  const brick = e === 0 && lvl >= 3, tiled = lvl >= 3 && e !== 2, v = Math.floor(hash(i, 5) * (brick ? 4 : 3));
  if (brick) blit(brickTile(v), TL, y0, 0, FH);
  else if (tiled) blit(eraTile(e, v, s), TL, y0, 0, FH);
  else R(TL, y0, TW, FH, s.wall);
  const mull = brick ? '#7a4a30' : shade(s.frame, 0.3);
  if (e === 2) { // pele de vidro: caixilhos com brilho, vidro com reflexo e faixa opaca entre os andares
    const gy = y0 + SLAB + 6, gh = FH - SLAB - 12;
    R(TL + 4, gy, TW - 8, gh, s.glass);
    if (lvl >= 3) { R(TL, y0 + SLAB, TW, 6, shade(s.wall, -0.2)); R(TL, y0 + FH - 6, TW, 6, shade(s.wall, -0.1)); R(TL, y0 + FH - 6, TW, 1, s.hi); }
    for (let c = 0; c < 8; c++) {
      const x = TL + 4 + c * 29, on = occ && lit(i, c);
      if (on) { R(x + 2, gy + 2, 25, gh - 4, lvl >= 2 ? '#7db5d8' : s.lit); if (lvl >= 3) { R(x + 2, gy + 2, 25, 6, '#a8d4ee'); R(x + 5, gy + 8, 8, 20, 'rgba(30,50,70,.25)'); } }
      else if (lvl >= 3) { R(x + 2, gy + 2, 25, 10, shade(s.glass, 0.18)); for (let d = 0; d < 7; d++) R(x + 5 + d * 2, gy + 14 + d * 6, 3, 6, 'rgba(255,255,255,.13)'); }
      if (lvl >= 2) { R(x, gy, 2, gh, s.frame); if (lvl >= 3) R(x + 1, gy, 1, gh, shade(s.frame, 0.35)); }
    }
    if (lvl >= 2) { R(TL + 4, gy + gh / 2, TW - 8, 2, s.frame); if (lvl >= 3) R(TL + 4, gy + gh / 2 + 1, TW - 8, 1, shade(s.frame, 0.35)); }
  } else {
    const t = lvl >= 3 && occ ? typeAt(i) : null;
    for (let k = 0; k < 4; k++) {
      const wx = TL + WIN_X[k], wy = y0 + WIN_Y, on = occ && lit(i, k);
      if (lvl >= 2 && !tiled) { R(wx - 3, wy - 3, WIN_W + 6, WIN_H + 6, s.frame); R(wx - 5, wy - 5, WIN_W + 10, 3, s.hi); }
      R(wx, wy, WIN_W, WIN_H, on ? s.lit : s.glass);
      if (lvl >= 3) {
        if (on) { interior(i, k, wx, wy, t); R(wx, wy + WIN_H - 3, WIN_W, 3, 'rgba(255,255,255,.22)'); }
        else { // vidro com reflexo em diagonal e céu claro no alto
          R(wx, wy + WIN_H - 8, WIN_W, 8, shade(s.glass, 0.2));
          for (let d = 0; d < 6; d++) { R(wx + 3 + d * 2, wy + 10 + d * 5, 3, 5, 'rgba(255,255,255,.14)'); R(wx + 22 + d * 2, wy + 4 + d * 4, 2, 4, 'rgba(255,255,255,.10)'); }
        }
        R(wx + 17, wy, 2, WIN_H, s.frame); R(wx, wy + 22, WIN_W, 2, s.frame);
        R(wx + 19, wy, 1, WIN_H, mull); R(wx, wy + 24, WIN_W, 1, mull);
        if (tiled && !brick) for (const [cx, cy] of [[wx, wy], [wx + WIN_W - 2, wy], [wx, wy + WIN_H - 2], [wx + WIN_W - 2, wy + WIN_H - 2]]) R(cx, cy, 2, 2, s.frame);
        if (brick && hash(i, k + 31) < 0.3) floreira(wx, wy - 4, i, k);
      }
    }
    if (!tiled && e === 3 && lvl >= 2) R(TL, y0 + 80, TW, 3, s.lit);
    if (!tiled && e === 5 && lvl >= 2) R(TL, y0 + 82, TW, 3, s.frame);
  }
  // laje e quinas
  R(TL, y0, TW, SLAB, s.slab);
  if (lvl >= 3) { // laje com aresta clara, sombra e marcas das formas
    R(TL, y0 + SLAB - 2, TW, 2, s.hi); R(TL, y0 + 2, TW, 1, 'rgba(0,0,0,.25)'); R(TL, y0 + SLAB, TW, 1, 'rgba(0,0,0,.2)');
    for (let x = TL + 6; x < TL + TW; x += 30) R(x, y0 + 3, 2, 2, 'rgba(0,0,0,.2)');
    if (!brick) { R(TL, y0, 2, FH, s.edge); R(TL + TW - 2, y0, 2, FH, s.edge); R(TL + 2, y0, 1, FH, 'rgba(255,255,255,.12)'); }
  }
  else if (lvl >= 2) { R(TL, y0 + SLAB - 2, TW, 2, s.hi); R(TL, y0 + SLAB, TW, 2, 'rgba(0,0,0,.18)'); R(TL, y0, 3, FH, s.edge); R(TL + TW - 3, y0, 3, FH, s.edge); }
  if (e >= 4 && i % 25 === 0 && Math.floor(V.t * 2) % 2) R(TL + TW - 10, y0 + FH - 10, 6, 4, '#ff3b3b');
}

// floreira sob a janela (só em parte das janelas do tijolo)
function floreira(wx, y, i, k) {
  R(wx + 3, y - 5, 30, 5, '#6b4a30'); R(wx + 3, y - 1, 30, 1, '#8b6440'); R(wx + 3, y - 5, 30, 1, '#4a3220');
  for (let f = 0; f < 6; f++) {
    const fx = wx + 5 + f * 5, c = ['#e0504a', '#f7c824', '#f08ab0'][Math.floor(hash(i * 3 + f, k) * 3)];
    R(fx, y, 3, 3, '#3c8a3f'); R(fx + 1, y + 3, 2, 2, c); R(fx + 1, y + 4, 1, 1, '#ffffff');
  }
}

// Andares prontos [0, base) visíveis na tela
export function drawFloors(base) {
  const lo = Math.max(0, Math.floor(worldY(H) / FH)), hi = Math.min(base, Math.ceil(worldY(0) / FH) + 1);
  if (hi <= lo) return;
  const lvl = floorLOD();
  if (lvl > 0) { for (let i = lo; i < hi; i++) facade(i, lvl); return; }
  // muito longe: faixas por era, separando andares com e sem destino
  const cuts = new Set([lo, hi, Math.min(Math.max(S.assigned, lo), hi)]);
  ERAS.forEach(e => { const f = Math.ceil(e.m / MPF); if (f > lo && f < hi) cuts.add(f); });
  const pts = [...cuts].sort((a, b) => a - b);
  for (let k = 0; k < pts.length - 1; k++) {
    const a = pts[k], b = pts[k + 1]; if (b <= a) continue;
    const f = FAR[eraAt(a * MPF)];
    Rv(TL, a * FH, TW, (b - a) * FH, a < S.assigned ? f.occ : f.vac);
  }
}

// Recorte em coordenadas de mundo (para painéis parciais)
export function clipWorld(x, y, w, h, fn) {
  ctx.save(); ctx.beginPath();
  const x0 = sx(x), y0 = sy(y + h);
  ctx.rect(Math.round(x0), Math.round(y0), Math.round(w * cam.z), Math.round(h * cam.z));
  ctx.clip(); fn(); ctx.restore();
}

// ---------- poços dos elevadores de carga ----------
export const SHAFT_X = i => TL + TW + 8 + i * 36;
export function shafts(topWP, carrying) {
  const n = Math.min(S.lv.elevador, 6), top = topWP + 40;
  const yLo = Math.max(0, worldY(H) - 30), yHi0 = Math.min(top, worldY(0) + 30);
  const bc = ERA_STYLE[eraAt(S.floors * MPF)].brick;
  const bars = 24 * cam.z >= 3;
  const load = 12 + 5 * Math.min(S.lv.cacamba, 2); // caçamba maior: carga mais alta
  for (let i = 0; i < n; i++) {
    const x0 = SHAFT_X(i), b = V.shaftBuild[i] ?? 1, h = top * b, yHi = Math.min(yHi0, h);
    Rv(x0, 0, 3, h, '#3b4152'); Rv(x0 + 27, 0, 3, h, '#3b4152');
    if (bars && yHi > yLo) {
      const st = cam.z >= 0.5 ? shaftTile() : null;
      for (let y = Math.max(0, Math.floor(yLo / 24) * 24); y < yHi; y += 24) {
        if (st) blit(st, x0, Math.min(y, yHi - 24), 0, 24);
        else R(x0, y, 30, 2, '#2a2f3d');
      }
    }
    if (b < 1) { // elevador novo sendo montado: a torre de trilhos sobe com faíscas na ponta
      if (Math.floor(V.t * 14) % 2) { R(x0 - 2, h - 3, 34, 3, '#ffe27a'); R(x0 + 4, h + 2, 3, 3, '#fff2a8'); R(x0 + 22, h + 4, 3, 3, '#fff2a8'); }
      continue;
    }
    if (cam.z >= 0.4) blit(shaftTopSprite(), x0 - 4, top, 0, 13); else R(x0 - 3, top, 36, 12, '#6b7183');
    R(x0 + 12, top + 4, 6, 4, Math.floor(V.t * 6) % 2 ? '#ff5a4a' : '#7a2a24');
    if (S.lv.motor > 0) { // motor mais forte: polia girando sobre o poço
      const q = Math.floor(V.t * (6 + 2 * Math.min(S.lv.motor, 6))) % 4, mx = x0 + 9;
      R(mx - 2, top + 12, 16, 12, '#3b4152'); R(mx, top + 14, 12, 8, '#7a8091');
      R(mx + [1, 5, 9, 5][q], top + [17, 15, 17, 19][q], 2, 2, '#f2b630');
    }
    const ph = V.elev[i] % 1, a = ph < .45 ? ph / .45 : ph < .55 ? 1 : 1 - (ph - .55) / .45;
    const cy = a * topWP;
    R(x0 + 14, cy + 32, 2, Math.max(0, top - cy - 32), '#9aa0ad');
    if (cam.z >= 0.4) blit(carSprite(), x0 + 3, cy, 1, 33);
    else { R(x0 + 3, cy, 24, 32, '#c9a227'); R(x0 + 6, cy + 3, 18, 24, '#262a35'); }
    if (ph < .5 && carrying) { // carga: tijolos empilhados dentro da gaiola
      R(x0 + 7, cy + 4, 16, load, bc); R(x0 + 7, cy + 3 + load, 16, 1, shade(bc, 0.3));
      for (let yy = cy + 4 + 4; yy < cy + 4 + load; yy += 4) R(x0 + 7, yy, 16, 1, shade(bc, -0.25));
    }
  }
}

// ---------- andaime no lado esquerdo do andar em obra ----------
// posts = false quando os pilares do andar são montados peça por peça (modo bloco a bloco)
export function scaffold(y0, posts = true) {
  const fr = ERA_STYLE[eraAt(S.floors * MPF)].frame;
  for (const px of [TL - 16, TL - 5]) R(px, y0 - FH, 4, FH * 2 + 24, '#9c7a45');
  for (let y = y0 - FH + 8; y < y0 + FH + 20; y += 32) { R(TL - 20, y, 22, 4, '#a8814a'); R(TL - 20, y + 4, 22, 1, '#6b4f28'); }
  for (let k = 0; k < 6; k++) R(TL - 15 + k * 1.5, y0 + 10 + k * 12, 3, 3, '#7d5f32');
  if (posts) { R(TL - 2, y0, 6, FH, fr); R(TL + TW - 4, y0, 6, FH, fr); R(-3, y0, 6, FH, fr); }
}

// ---------- guindaste de escalada (apoiado no topo da obra) ----------
// Devolve o y da lança. trolX: posição do carrinho; hookY: altura do gancho (mundo)
export function crane(buildTop, trolX, hookY) {
  const mx = TL + 10, jy = buildTop + FH + 52, y0 = buildTop + SLAB;
  R(mx - 8, buildTop, 32, SLAB + 4, '#5b6170'); R(mx - 8, buildTop + SLAB + 2, 32, 2, '#7a8091'); // base parafusada na laje
  // guindaste recém-comprado: o mastro sobe, depois a lança se abre (Obra Viva)
  const bld = V.craneBuild ?? 1;
  if (bld < 1) {
    const mt = y0 + (jy - y0) * Math.min(1, bld / .6);
    R(mx, y0, 3, mt - y0, '#e3a823'); R(mx + 13, y0, 3, mt - y0, '#e3a823');
    if (cam.z >= 0.3) for (let y = y0 - (y0 % 14); y < mt; y += 14) R(mx, y, 16, 2, '#c98f15');
    if (Math.floor(V.t * 14) % 2) R(mx - 2, mt - 2, 20, 3, '#ffe27a');
    if (bld > .6) { const w = (TW + 130) * (bld - .6) / .4; R(mx, jy, w, 3, '#e3a823'); R(mx - w * .4, jy, w * .4, 3, '#e3a823'); R(mx, jy + 14, w, 3, '#e3a823'); }
    return jy;
  }
  const x0 = TL - 130, x1 = TL + TW + 130;
  if (cam.z < 0.3) { // longe: traços simples
    R(mx, y0, 3, jy - y0, '#e3a823'); R(mx + 13, y0, 3, jy - y0, '#e3a823');
    R(x0, jy, x1 - x0, 3, '#e3a823'); R(x0, jy + 14, x1 - x0, 3, '#e3a823');
    R(x0 + 4, jy - 30, 38, 30, '#8d939e'); R(mx - 6, jy - 24, 28, 22, '#2f5d8a'); R(mx + 6, jy + 17, 4, 34, '#e3a823');
    R(trolX - 1, hookY, 2, Math.max(0, jy - 8 - hookY), '#c7ccd6'); R(trolX - 7, hookY - 9, 14, 9, '#3b4152');
    return jy;
  }
  // mastro treliçado e lança em seções de pixel art
  const mt = mastTile(), jt = jibTile();
  for (let y = y0; y < jy; y += 14) blit(mt, mx, Math.min(y, jy - 14), 0, 14);
  for (let x = x0; x < x1; x += 16) blit(jt, Math.min(x, x1 - 16), jy, 0, 17);
  // torre do topo com tirantes até as pontas da lança
  R(mx + 5, jy + 17, 6, 34, '#d39a14'); R(mx + 5, jy + 17, 2, 34, '#ffd86a'); R(mx + 3, jy + 49, 10, 3, '#a8760c');
  const tie = xe => { const n = Math.ceil(Math.abs(xe - mx - 8) / 3); for (let k = 0; k < n; k++) { const t = k / n; R(mx + 8 + (xe - mx - 8) * t - (xe < mx ? 3 : 0), jy + 50 - 32 * t, 3, 1, '#5a5f6a'); } };
  tie(x1 - 10); tie(x0 + 10);
  if (Math.floor(V.t * 2) % 2) { R(mx + 5, jy + 52, 6, 4, '#ff3b3b'); R(mx + 6, jy + 55, 4, 1, '#ffb0a8'); }
  blit(weightSprite(), x0 + 4, jy, 1, 1);
  blit(cabSprite(), mx - 6, jy - 2, 1, 1);
  // carrinho, cabo e gancho
  blit(trolleySprite(), trolX, jy + 2, 10, 0);
  R(trolX - 1, hookY, 2, Math.max(0, jy - 8 - hookY), '#c7ccd6'); R(trolX, hookY, 1, Math.max(0, jy - 8 - hookY), '#eef0f4');
  blit(hookSprite(), trolX, hookY, 8, 1);
  return jy;
}

// ---------- dirigível dos megablocos ----------
export function airship(cx, y) {
  for (let dy = 0; dy < 80; dy += 4) {
    const t = (dy - 38) / 40, hw = 150 * Math.sqrt(Math.max(0, 1 - t * t));
    R(cx - hw, y + dy, hw * 2, 4, dy < 24 ? '#a8adb8' : dy > 56 ? '#e0e3ea' : '#c8ccd4');
  }
  R(cx - 150, y + 36, 300, 6, '#f2b630');
  R(cx + 128, y + 30, 28, 4, '#a8adb8'); R(cx + 146, y + 14, 8, 46, '#a8adb8');
  R(cx - 44, y - 26, 88, 26, '#3b4152'); for (let k = 0; k < 5; k++) R(cx - 36 + k * 16, y - 18, 10, 9, '#bfe3ff');
  const f = Math.floor(V.t * 12) % 2;
  R(cx - 64, y - 12 + f * 4, 4, 18 - f * 8, '#dfe3ea'); R(cx + 60, y - 12 + (1 - f) * 4, 4, 18 - (1 - f) * 8, '#dfe3ea');
}

