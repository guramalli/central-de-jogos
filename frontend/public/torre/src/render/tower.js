// Torre em coordenadas de mundo: fachadas com nível de detalhe pelo zoom, poços de elevador,
// andaime e guindaste.
import { H, FH, SLAB, TW, TL, MPF } from '../data/constants.js';
import { altOf, floorOf, mpfAt } from '../data/height.js';
import { ERAS, ERA_STYLE, eraAt } from '../data/eras.js';
import { S } from '../sim/state.js';
import { typeAt } from '../sim/realty.js';
import { ctx, R, Rv, T, hash, mix, mixRGB } from './canvas.js';
import { cam, worldY, sx, sy } from './camera.js';
import { V } from './view.js';
import { blit, shade } from './sprites.js';
import { art } from './assets.js';
import { FLAGS } from '../data/flags.js';
import { techShaft, techShaftsExtra, techFacade } from './techvis.js';
import { scaffoldTile, scaffoldHiTile, shaftHiTile, capsuleSprite, brickTile, eraTile, shaftTile, carSprite, shaftTopSprite, mastTile, jibTile, cabSprite, weightSprite, trolleySprite, hookSprite, hexMix } from './props.js';
import { eraVis, onMoon } from './eravis.js';
import { facadeImg, spaceDecor } from './spacedecor.js';
import { avariaDoAndar } from '../sim/risco.js';
const hiTech = () => eraVis(altOf(S.floors)) >= 3; // andaime e elevador de era alta

const WIN_X = [12, 72, 132, 192];     // janelas: x relativo à borda esquerda
const WIN_W = 36, WIN_Y = 22, WIN_H = 48;
const CURTAINS = ['#c0504d', '#4f81bd', '#9bbb59', '#8064a2', '#f79646', '#2c8c8c'];
const FAR = ERA_STYLE.map(s => ({ occ: mix(s.wall, s.lit, 0.3), vac: mix(s.wall, '#000000', 0.25) }));

// janela acesa ou apagada, muda devagar com o tempo
// Obra Viva: Aluguel (mais moradores) acende mais janelas a cada nível
const litP = () => FLAGS.viva ? Math.min(0.7, 0.42 + 0.03 * (S.lv.aluguel || 0)) : 0.42;
export function lit(i, k) { return hash(i * 7 + k, Math.floor(V.t / 9 + hash(i, k) * 9)) < litP(); }
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

// Fachadas do PixelLab (assets/fachadas/<era>.png, 240×96) e onde ficam as janelas em cada uma [x, y, w, h]
// (pixels da imagem); a versão "-acesa" tem o vidro pintado de luz quente e é recortada por cima de cada janela acesa
const FAC_WIN = [[[11,23,24,41],[75,23,24,41],[141,23,23,41],[205,23,23,41]],[[16,28,33,40],[73,28,33,40],[134,28,33,40],[191,28,33,40]],[[0,0,15,88],[21,0,31,88],[62,0,26,88],[93,0,23,88],[123,0,24,88],[150,0,34,88],[194,0,25,88],[225,0,15,88]],[[8,30,28,32],[73,30,28,32],[139,30,28,32],[204,30,28,32]],[[10,34,28,29],[80,34,28,29],[134,34,26,29],[201,34,29,29]],[[11,35,22,22],[76,35,22,22],[142,35,22,22],[207,35,22,22]],[[9,34,24,24],[75,34,24,24],[141,34,24,24],[207,34,24,24]]];
function subImg(img, x0, y0, w, h, wx, wyTop) {
  const X = Math.round(sx(wx)), Y = Math.round(sy(wyTop)), X1 = Math.round(sx(wx + w)), Y1 = Math.round(sy(wyTop - h));
  if (X1 > X && Y1 > Y) ctx.drawImage(img, x0, y0, w, h, X, Y, X1 - X, Y1 - Y);
}

// Longe (andar pequeno na tela): versão reduzida e suavizada da fachada do PixelLab, para a cor de longe bater com a de perto.
// Reduz em passos de metade (cada passo tira a média de vizinhos) até 24×10; guarda também a cor média (faixas de muito longe).
const farCache = [];
function shrink(img, w, h) {
  let src = img, cw = img.width, ch = img.height;
  while (cw / 2 >= w) { const c = document.createElement('canvas'); c.width = Math.round(cw / 2); c.height = Math.max(h, Math.round(ch / 2)); const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.drawImage(src, 0, 0, c.width, c.height); src = c; cw = c.width; ch = c.height; }
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.drawImage(src, 0, 0, w, h);
  return c;
}
function avgColor(img) { const c = shrink(img, 1, 1), d = c.getContext('2d').getImageData(0, 0, 1, 1).data; return `rgb(${d[0]},${d[1]},${d[2]})`; }
function farFacade(e) {
  if (farCache[e]) return farCache[e];
  const fa = art('fachadas/' + e), fl = art('fachadas/' + e + '-acesa');
  if (!fa || !fl) return null;
  const off = shrink(fa, 24, 10), on = shrink(fl, 24, 10);
  return (farCache[e] = { off, on, vac: avgColor(fa), occ: mixRGB(avgColor(fa), avgColor(fl), 0.45) });
}

// janelas que somem na fachada quebrada (viraram painel rasgado): era → índices de FAC_WIN
const SUMIU = { 3: [1], 5: [1], 6: [1, 2] };
// Fachada do andar i. lvl: 1 simples, 2 molduras, 3 completo
export function facade(i, lvl = floorLOD()) {
  const e = eraVis(altOf(i)), s = ERA_STYLE[e], y0 = i * FH;
  // andar recém-concluído: todas as luzes acendem por um instante (Obra Viva)
  const flash = V.flash && V.flash.i === i, occ = i < S.assigned || flash;
  const lit = flash ? () => true : litW;
  if (lvl === 1) { // longe: a fachada reduzida (acesa nos andares com morador, metade das janelas)
    const ff = farFacade(e);
    if (ff) {
      const X = Math.round(sx(TL)), X1 = Math.round(sx(TL + TW)), Y = Math.round(sy(y0 + FH)), Y1 = Math.round(sy(y0));
      if (X1 > X && Y1 > Y) { ctx.drawImage(ff.off, X, Y, X1 - X, Y1 - Y); if (occ) { ctx.globalAlpha = 0.45; ctx.drawImage(ff.on, X, Y, X1 - X, Y1 - Y); ctx.globalAlpha = 1; } }
      return;
    }
  }
  // modo com risco: andar avariado usa a fachada trincada (1) ou quebrada (2), se a arte já chegou
  const av = FLAGS.risco && lvl >= 2 ? avariaDoAndar(i) : 0;
  const fa = lvl >= 2 && ((av && art('fachadas/' + e + (av === 2 ? '-quebrada' : '-trincada'))) || art('fachadas/' + e));
  if (fa) { // arte do PixelLab: parede pronta da era; janelas acesas vêm da versão acesa
    blit(facadeImg(fa, e, i), TL, y0, 0, fa.height);
    const fl = occ && art('fachadas/' + e + '-acesa');
    // na quebrada, metade das janelas fica apagada e as que viraram painel rasgado nunca acendem
    if (fl) FAC_WIN[e].forEach(([x, y, w, h], k) => { if (av === 2 && (k % 2 || (SUMIU[e] || []).includes(k))) return; if (lit(i, k)) subImg(fl, x, y, w, h, TL + x, y0 + FH - y); });
    if (e >= 5) spaceDecor(e, i, y0, occ); // espaço: detalhes por andar para a fachada não se repetir
    if (e >= 4 && i % 25 === 0 && Math.floor(V.t * 2) % 2) R(TL + TW - 10, y0 + FH - 10, 6, 4, '#ff3b3b');
    return;
  }
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
  if (lvl > 0) { for (let i = lo; i < hi; i++) { facade(i, lvl); techFacade(i, i * FH, lvl); } return; }
  // muito longe: faixas por era, separando andares com e sem destino
  const cuts = new Set([lo, hi, Math.min(Math.max(S.assigned, lo), hi)]);
  ERAS.forEach(e => { const f = Math.ceil(floorOf(e.m)); if (f > lo && f < hi) cuts.add(f); });
  const pts = [...cuts].sort((a, b) => a - b);
  for (let k = 0; k < pts.length - 1; k++) {
    const a = pts[k], b = pts[k + 1]; if (b <= a) continue;
    const ea = eraVis(altOf(a)), f = farFacade(ea) || FAR[ea]; // muito longe: cor média da fachada do PixelLab
    Rv(TL, a * FH, TW, (b - a) * FH, a < S.assigned ? f.occ : f.vac);
  }
}

// ---------- poços dos elevadores de carga ----------
// poços ampliados (SHAFT_K): a cabine fica do tamanho dos operários. Cada poço é desenhado no seu desenho de 30 px de
// largura, num referencial ampliado em volta da base dele (câmera escalada), então trilhos, cabine e carga crescem juntos.
export const SHAFT_K = 1.6, SHAFT_W = 30 * SHAFT_K;
export const SHAFT_X = i => TL + TW + 8 + i * (SHAFT_W + 8);
function inShaftFrame(x0, fn) {
  const { cx, cy, z } = cam;
  cam.z = z * SHAFT_K; cam.cx = x0 - (x0 - cx) / SHAFT_K; cam.cy = cy / SHAFT_K;
  try { fn(); } finally { cam.cx = cx; cam.cy = cy; cam.z = z; }
}
export function shafts(topWP, carrying) {
  const n = Math.min(S.lv.elevador, 6);
  for (let i = 0; i < n; i++) inShaftFrame(SHAFT_X(i), () => shaft(i, topWP / SHAFT_K, carrying));
  if (n > 0) inShaftFrame(SHAFT_X(n - 1), () => techShaftsExtra(SHAFT_X(n - 1) + 30, (topWP + 40 * SHAFT_K) / SHAFT_K, topWP / SHAFT_K, Math.max(0, worldY(H) - 30), worldY(0) + 30));
}
// um poço (coordenadas do referencial ampliado: x0 = base, topWP = altura do topo dividida por SHAFT_K)
function shaft(i, topWP, carrying) {
  const top = topWP + 40;
  const yLo = Math.max(0, worldY(H) - 30), yHi0 = Math.min(top, worldY(0) + 30);
  const bc = ERA_STYLE[eraVis(altOf(S.floors))].brick;
  const bars = 24 * cam.z >= 3, hi = hiTech();
  const load = Math.min(24, 10 + 1.5 * (S.lv.cacamba || 0)); // carrinho maior: carga mais alta a cada nível
  const mg = S.lv.maglev || 0, ml = S.lv.motor || 0;
  {
    const x0 = SHAFT_X(i), b = V.shaftBuild[i] ?? 1, h = top * b, yHi = Math.min(yHi0, h);
    Rv(x0, 0, 3, h, '#3b4152'); Rv(x0 + 27, 0, 3, h, '#3b4152');
    if (mg > 0 && cam.z >= 0.25) { // elevador magnético: trilhos brilham mais a cada nível
      const a = (0.25 + 0.12 * mg).toFixed(2);
      R(x0 + 2, Math.max(0, yLo), 1, Math.max(0, Math.min(h, yHi0) - Math.max(0, yLo)), `rgba(95,215,255,${a})`);
      R(x0 + 27, Math.max(0, yLo), 1, Math.max(0, Math.min(h, yHi0) - Math.max(0, yLo)), `rgba(95,215,255,${a})`);
      for (let y = Math.max(0, Math.floor(yLo / 96) * 96); y < Math.min(h, yHi0); y += Math.max(24, 96 - mg * 12)) R(x0 - 1, y, 32, 2, `rgba(95,215,255,${a})`);
    }
    if (bars && yHi > yLo) {
      const st = cam.z >= 0.5 ? (hi ? shaftHiTile() : shaftTile()) : null;
      for (let y = Math.max(0, Math.floor(yLo / 24) * 24); y < yHi; y += 24) {
        if (st) blit(st, x0, Math.min(y, yHi - 24), 0, 24);
        else R(x0, y, 30, 2, hi ? '#9aa0ad' : '#2a2f3d');
      }
    }
    if (b < 1) { // elevador novo sendo montado: a torre de trilhos sobe com faíscas na ponta
      if (Math.floor(V.t * 14) % 2) { R(x0 - 2, h - 3, 34, 3, '#ffe27a'); R(x0 + 4, h + 2, 3, 3, '#fff2a8'); R(x0 + 22, h + 4, 3, 3, '#fff2a8'); }
      return;
    }
    if (cam.z >= 0.4) blit(shaftTopSprite(), x0 - 4, top, 0, 13); else R(x0 - 3, top, 36, 12, '#6b7183');
    const jam = FLAGS.viva && V.signs && V.signs.groundJam; // elevadores não dão conta: sinais sem texto (render/signs.js)
    R(x0 + 12, top + 4, 6, 4, jam ? (Math.floor(V.t * 8) % 2 ? '#ffb020' : '#6a4a10') : Math.floor(V.t * 6) % 2 ? '#ff5a4a' : '#7a2a24');
    if (jam && Math.floor(V.t * 3 + i * 0.5) % 2) { // porta do térreo piscando em âmbar
      const c = '#f2b630';
      R(x0 - 3, 0, 36, 3, c); R(x0 - 3, 38, 36, 3, c); R(x0 - 3, 0, 3, 41, c); R(x0 + 30, 0, 3, 41, c);
    }
    if (ml > 0) { // motor mais forte: a casa de máquinas cresce a cada nível (mais polias, aletas e tinta nova)
      const q = Math.floor(V.t * (6 + 2 * Math.min(ml, 8))) % 4, np = Math.min(3, 1 + Math.floor(ml / 4));
      const body = mix('#7a8091', '#3b82c4', Math.min(1, ml / 10));
      const bw = Math.min(30, 14 + ml * 2), bx = x0 + 15 - bw / 2;
      R(bx - 1, top + 12, bw + 2, 13, '#2a2f3d'); R(bx, top + 13, bw, 10, body);
      for (let f = 0; f < Math.min(ml, 8); f++) R(bx + 2 + f * (bw - 4) / 8, top + 14, 1, 8, 'rgba(0,0,0,.25)'); // aletas
      for (let k = 0; k < np; k++) { const px = x0 + 15 + (k - (np - 1) / 2) * 9 - 4; R(px, top + 25, 8, 8, '#3b4152'); R(px + 1, top + 26, 6, 6, '#9aa0ad'); R(px + [1, 3, 5, 3][(q + k) % 4], top + [29, 27, 29, 31][(q + k) % 4], 2, 2, '#f2b630'); }
    }
    const ph = V.elev[i] % 1, a = ph < .45 ? ph / .45 : ph < .55 ? 1 : 1 - (ph - .55) / .45;
    const cy = a * topWP;
    R(x0 + 14, cy + 32, 2, Math.max(0, top - cy - 32), '#9aa0ad');
    if (cam.z >= 0.4) blit(hi ? capsuleSprite() : carSprite(), x0 + 3, cy, 1, 33);
    else { R(x0 + 3, cy, 24, 32, hi ? '#eef1f6' : '#c9a227'); R(x0 + 6, cy + 3, 18, 24, hi ? '#2f5fa8' : '#262a35'); }
    const bw = 16; // dentro da gaiola só o material (pedido do usuário)
    if (ph < .5 && carrying) { // carga: tijolos empilhados dentro da gaiola
      R(x0 + 7, cy + 4, bw, load, bc); R(x0 + 7, cy + 3 + load, bw, 1, shade(bc, 0.3));
      for (let yy = cy + 4 + 4; yy < cy + 4 + load; yy += 4) R(x0 + 7, yy, bw, 1, shade(bc, -0.25));
    }
    techShaft(i, x0, cy, top, yLo, yHi);
  }
}

// ---------- andaime no lado esquerdo do andar em obra ----------
// posts = false quando os pilares do andar são montados peça por peça (modo bloco a bloco)
export function scaffold(y0, posts = true) {
  const fr = ERA_STYLE[eraVis(altOf(S.floors))].frame;
  const hi = hiTech(); // Estratosfera em diante (e na Lua): liga leve com grade metálica e luz piscando
  if (cam.z >= 0.3) {
    const t = hi ? scaffoldHiTile() : scaffoldTile(); for (let y = y0 - FH; y < y0 + FH + 24; y += 32) blit(t, TL - 20, y, 0, 32);
    if (hi && Math.floor(V.t * 1.5) % 2) R(TL - 18, y0 + FH + 22, 3, 3, '#ff5a4a');
  }
  else { for (const px of [TL - 16, TL - 5]) R(px, y0 - FH, 4, FH * 2 + 24, hi ? '#dfe3ea' : '#8f969f'); for (let y = y0 - FH + 8; y < y0 + FH + 20; y += 32) R(TL - 20, y, 22, 4, hi ? '#6b7183' : '#a8814a'); }
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
  // a cada nível o guindaste cresce: lança mais longa, mais contrapeso, tinta do amarelo ao vermelho (faixas brancas
  // a partir do nv 8), luzes de sinalização e cabine maior
  const gl = Math.max(1, S.lv.guindaste || 1), tint = hexMix('#f2b630', '#d23c28', Math.min(1, (gl - 1) / 9));
  const x0 = TL - 120 - gl * 2, x1 = TL + TW + 100 + gl * 14;
  if (cam.z < 0.3) { // longe: traços simples
    R(mx, y0, 3, jy - y0, '#e3a823'); R(mx + 13, y0, 3, jy - y0, '#e3a823');
    R(x0, jy, x1 - x0, 3, '#e3a823'); R(x0, jy + 14, x1 - x0, 3, '#e3a823');
    R(x0 + 4, jy - 30, 38, 30, '#8d939e'); R(mx - 6, jy - 24, 28, 22, '#2f5d8a'); R(mx + 6, jy + 17, 4, 34, '#e3a823');
    R(trolX - 1, hookY, 2, Math.max(0, jy - 8 - hookY), '#c7ccd6'); R(trolX - 7, hookY - 9, 14, 9, '#3b4152');
    return jy;
  }
  // mastro treliçado e lança em seções de pixel art
  const mt = mastTile(tint), jt = jibTile(tint), jw = jibTile('#eef0f4');
  for (let y = y0; y < jy; y += 14) blit(gl >= 8 && Math.floor(y / 14) % 2 ? mastTile('#eef0f4') : mt, mx, Math.min(y, jy - 14), 0, 14);
  for (let x = x0, k = 0; x < x1; x += 16, k++) blit(gl >= 8 && k % 2 ? jw : jt, Math.min(x, x1 - 16), jy, 0, 17);
  const mk = S.lv.marketing || 0, pub = S.lv.publicidade || 0;
  if (mk > 0 || pub > 0) {
    const bw = Math.min(220, 50 + mk * 14 + pub * 30), bh = pub ? 20 : 14, bx = mx + 34, by = jy + 17;
    R(bx - 1, by, bw + 2, bh + 1, '#20242f');
    if (pub) { // painel de LED: fundo escuro, letreiro correndo e cor que muda
      R(bx, by + 1, bw, bh - 1, '#0e1220');
      const hue = ['#5fe0ff', '#ffd23a', '#ff6a9a', '#7aff8a'][Math.floor(V.t / 3) % 4];
      for (let x = 0; x < bw; x += 3) if ((x + Math.floor(V.t * 20) * 3) % 24 < 15) R(bx + x, by + 6, 2, 8, hue);
      if (pub >= 2) for (let x = 0; x < bw; x += 6) R(bx + x, by + 2, 3, 1, 'rgba(255,255,255,.25)');
    } else {
      R(bx, by + 1, bw, bh - 1, '#f4f1e6'); R(bx, by + 1, bw, 3, tint);
      T(bw >= 150 ? 'CONSTRUTORA VIGALUZ' : 'VIGALUZ', bx + bw / 2, by + 7, 8, '#20242f', 'center');
    }
    if (mk >= 3 && Math.floor(V.t * 3) % 2) for (let x = 4; x < bw; x += 24) R(bx + x, by + bh, 3, 2, '#ffe27a'); // lâmpadas
  }
  // torre do topo com tirantes até as pontas da lança
  R(mx + 5, jy + 17, 6, 34, '#d39a14'); R(mx + 5, jy + 17, 2, 34, '#ffd86a'); R(mx + 3, jy + 49, 10, 3, '#a8760c');
  const tie = xe => { const n = Math.ceil(Math.abs(xe - mx - 8) / 3); for (let k = 0; k < n; k++) { const t = k / n; R(mx + 8 + (xe - mx - 8) * t - (xe < mx ? 3 : 0), jy + 50 - 32 * t, 3, 1, '#5a5f6a'); } };
  tie(x1 - 10); tie(x0 + 10);
  const blink = Math.floor(V.t * 2) % 2;
  if (blink) { R(mx + 5, jy + 52, 6, 4, '#ff3b3b'); R(mx + 6, jy + 55, 4, 1, '#ffb0a8'); }
  if (gl >= 3 && blink) { R(x1 - 6, jy + 17, 5, 4, '#ff3b3b'); }                  // luz na ponta da lança
  if (gl >= 6 && !blink) { R(x0 + 1, jy + 17, 5, 4, '#ff3b3b'); }                 // e na contra-lança
  if (gl >= 9 && blink) for (let y = y0 + 40; y < jy; y += 60) R(mx + 6, y, 4, 3, '#ff3b3b'); // e ao longo do mastro
  const nw = Math.min(3, 1 + Math.floor(gl / 4));                                 // mais blocos de contrapeso
  for (let k = 0; k < nw; k++) blit(weightSprite(), x0 + 4 + k * 38, jy, 1, 1);
  blit(cabSprite(), mx - 6, jy - 2, 1, 1);
  if (gl >= 5) { R(mx - 7, jy - 26, 32, 3, shade(tint, -0.2)); R(mx - 4, jy - 29, 26, 3, shade(tint, 0.2)); } // cabine com teto/ar-condicionado
  // carrinho, cabo e gancho
  blit(trolleySprite(), trolX, jy + 2, 10, 0);
  R(trolX - 1, hookY, 2, Math.max(0, jy - 8 - hookY), '#c7ccd6'); R(trolX, hookY, 1, Math.max(0, jy - 8 - hookY), '#eef0f4');
  blit(hookSprite(), trolX, hookY, 8, 1);
  return jy;
}

