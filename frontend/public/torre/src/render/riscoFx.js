// Modo com risco: efeitos por cima da cena já desenhada.
// towerFx: a torre balança no vento (as linhas da faixa da torre são deslocadas, mais no alto), treme no terremoto e
// tomba no desabamento. weatherFx: as intempéries com a arte do PixelLab (assets/intemperies/, ver LEIAME.md) — chuva
// densa em duas camadas com respingos, rajadas de vento com detritos, entulho e poeira no terremoto, onda do tsunami,
// raios, granizo, neve, gelo, meteoros e aurora. Sem a arte, cada efeito tem uma reserva simples por código.
import { W, H, FH, TW, TL } from '../data/constants.js';
import { ctxMain } from './canvas.js';
import { sx, sy } from './camera.js';
import { S } from '../sim/state.js';
import { art } from './assets.js';
import { eraVis } from './eravis.js';
import { SHAFT_X, SHAFT_W } from './tower.js';
import { V } from './view.js';
import { altOf, floorOf } from '../data/height.js';
import { soEmbaixo, RISCO } from '../sim/risco.js';
import { sfx } from '../ui/audio.js';

const g = () => ctxMain;
const buf = document.createElement('canvas'), bctx = buf.getContext('2d');
const DETRITOS = ['folha', 'folha-seca', 'papel', 'saco', 'tabua', 'lona', 'lona-laranja'];
// entulho por era do andar (índices dos arquivos entulho-N)
const ENTULHO = { 0: [0, 4, 6, 13], 1: [1, 4, 7, 12, 5], 2: [2, 8, 11, 3], 3: [9, 3, 1], 4: [9, 3, 12], 5: [9, 3, 8], 6: [10, 3, 8] };
export const ARTE_RISCO = ['chuva-perto', 'chuva-longe', 'neve-perto', 'neve-longe', 'aurora', 'onda-espuma',
  ...[0, 1, 2, 3].map(k => 'respingo-' + k), ...[0, 1, 2, 3, 4, 5].map(k => 'rajada-' + k), ...[0, 1, 2, 3, 4].map(k => 'poeira-' + k),
  ...[0, 1, 2].map(k => 'raio-' + k), ...[0, 1, 2].map(k => 'granizo-' + k), ...[0, 1, 2, 3, 4, 5].map(k => 'onda-' + k), ...[0, 1, 2].map(k => 'meteoro-' + k),
  ...Array.from({ length: 14 }, (_, k) => 'entulho-' + k), ...DETRITOS.flatMap(d => [0, 1, 2, 3].map(k => `detrito-${d}-${k}`))].map(n => 'intemperies/' + n);
const A = n => art('intemperies/' + n);

// ---------- torre: balanço, tremor, tombo ----------
// o: { lean (px no topo), shake (px), f0 (andares, para a altura do tombo) }
export function towerFx(o) {
  const ctx = g(), gy = sy(0), fl = o.f0 ?? Math.floor(S.floors), span = Math.max(40, gy - sy((fl + 1) * FH));
  // rachaduras por código só enquanto as fachadas avariadas não carregaram
  if ((o.dano || 0) > 0 && !art('fachadas/0-trincada')) {
    const n = Math.floor(o.dano * 16);
    for (let i = 0; i < n; i++) {
      const f = Math.floor(((i * 7919) % 97) / 97 * Math.max(1, Math.floor(S.floors))), x0 = TL + 20 + ((i * 131) % 200);
      ctx.strokeStyle = 'rgba(30,20,20,.75)'; ctx.lineWidth = 2; ctx.beginPath();
      let x = sx(x0), y = sy(f * FH + 70); ctx.moveTo(x, y);
      for (let k = 0; k < 4; k++) { x += ((i + k) % 2 ? 1 : -1) * 10; y += 18; ctx.lineTo(x, y); }
      ctx.stroke();
    }
  }
  const lean = o.lean || 0, shake = o.shake || 0;
  if (!lean && !shake) return;
  if (buf.width !== W || buf.height !== H) { buf.width = W; buf.height = H; } // realocar a cada quadro custava caro (memória da placa de vídeo)
  bctx.drawImage(ctx.canvas, 0, 0);
  if (shake) {
    const jx = (Math.random() * 2 - 1) * shake, jy = (Math.random() * 2 - 1) * shake * 0.3;
    ctx.fillStyle = '#1b1622'; ctx.fillRect(0, 0, W, H); ctx.drawImage(buf, jx, jy); bctx.drawImage(ctx.canvas, 0, 0);
  }
  // só a faixa da torre entorta: o fundo da faixa é refeito com a coluna de céu ao lado e a torre é desenhada deslocada
  // a faixa que entorta vai da lança do guindaste (que passa do andaime para a esquerda) até o último poço de elevador e as
  // colunas extras dele: a obra inteira balança junto
  const nPocos = Math.max(1, Math.min(S.lv.elevador || 1, 6)), dir = SHAFT_X(nPocos - 1) + SHAFT_W + 90;
  const x0 = Math.max(1, Math.floor(sx(TL - 170))), bw = Math.min(W - x0, Math.ceil(sx(dir)) - x0);
  const y0 = Math.max(0, Math.floor(sy((fl + 3.2) * FH))); // até acima das casas de máquinas, da cabine no alto e do guindaste; mais acima só há céu
  // linhas vizinhas com o mesmo deslocamento viram uma cópia só (perto da base o deslocamento muda devagar)
  const y1 = Math.min(H, Math.ceil(gy)), faixa = (ya, yb, dx) => {
    if (!dx || yb <= ya) return;
    ctx.drawImage(buf, x0 - 1, ya, 1, yb - ya, x0, ya, bw, yb - ya);
    ctx.drawImage(buf, x0, ya, bw, yb - ya, x0 + dx, ya, bw, yb - ya);
  };
  if (lean && bw > 0) {
    let ini = y0, dxIni = null;
    for (let y = y0; y < y1; y++) {
      const h = Math.max(0, Math.min(1.3, (gy - y) / span)), dx = Math.round(lean * h * h);
      if (dx !== dxIni) { if (dxIni !== null) faixa(ini, y, dxIni); ini = y; dxIni = dx; }
    }
    if (dxIni !== null) faixa(ini, y1, dxIni);
  }
}

// ---------- obra interditada: fita zebrada na base e faixa no alto da torre ----------
export function interdFx() {
  const ctx = g(), x0 = Math.round(sx(TL - 30)), x1 = Math.round(sx(TL + TW + 30)), yb = Math.round(sy(26));
  const fita = (y, h) => { for (let x = x0, k = 0; x < x1; x += 12, k++) { ctx.fillStyle = k % 2 ? '#1b1622' : '#f2c230'; ctx.fillRect(x, y, Math.min(12, x1 - x), h); } };
  if (yb > -10 && yb < H + 10) { fita(yb, 6); fita(yb + 14, 6); }
  const topo = Math.max(70, Math.round(sy((Math.floor(S.floors) + 0.6) * FH)));
  if (topo < H - 40) {
    const w = Math.min(W - 20, Math.max(170, x1 - x0)), cx = Math.round(sx(0)), x = Math.round(cx - w / 2);
    ctx.fillStyle = 'rgba(160,24,20,.92)'; ctx.fillRect(x, topo, w, 26); fita(topo - 6, 4); fita(topo + 28, 4);
    ctx.font = '700 15px "Chakra Petch", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
    ctx.fillText('OBRA INTERDITADA', cx, topo + 13); ctx.textAlign = 'left';
  }
}

// ---------- intempéries ----------
const pats = new Map();
// textura que emenda (chuva, neve) rolando pela tela inteira
function layer(nome, t, vx, vy, alpha, ox = 0, oy = 0) {
  const im = A(nome); if (!im) return false;
  const ctx = g();
  let p = pats.get(nome); if (!p) { p = ctx.createPattern(im, 'repeat'); pats.set(nome, p); }
  const dx = ((t * vx + ox) % 128 + 128) % 128, dy = ((t * vy + oy) % 128 + 128) % 128;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(Math.round(dx) - 128, Math.round(dy) - 128);
  ctx.fillStyle = p; ctx.fillRect(0, 0, W + 256, H + 256); ctx.restore();
  return true;
}
const parts = []; // partículas em coordenadas de tela { k, x, y, vx, vy, t, vida, ... }
const add = p => { if (parts.length < 260) parts.push(p); };
let spawn = 0, flash = 0;

// o: { tipo (ativo ou clima que continua), forca 0..1, prog 0..1 (quanto da ameaça já passou), aviso (tipo que vem), t, dt }
export function weatherFx(o) {
  const ctx = g(), { t, dt } = o, tipo = o.tipo, f = Math.min(1, o.forca || 0.4);
  const topY = sy((Math.floor(S.floors) + 1) * FH), gy = sy(0), tx0 = sx(TL), tx1 = sx(TL + TW);
  spawn += dt; if (V.choque > 0) V.choque = Math.max(0, V.choque - dt);
  // torre acima das nuvens: temporal (chuva, raios, granizo, neve) só na parte da tela abaixo de RISCO.nuvens; o topo fica limpo
  const embaixo = soEmbaixo(tipo) || soEmbaixo(o.aviso), yNuv = embaixo ? Math.max(0, Math.round(sy(floorOf(RISCO.nuvens) * FH))) : 0;
  const topoChuva = embaixo ? Math.max(topY, yNuv) : topY;
  if (embaixo) { ctx.save(); ctx.beginPath(); ctx.rect(0, yNuv, W, Math.max(0, H - yNuv)); ctx.clip(); }
  // aviso: o céu já mostra o que vem (chuva fraca, rajadas leves)
  if (!tipo && o.aviso) {
    if (['chuva', 'raios', 'granizo'].includes(o.aviso)) { ctx.fillStyle = 'rgba(20,28,45,.18)'; ctx.fillRect(0, 0, W, H); layer('chuva-longe', t, 30, 120, 0.25); }
    if (['vento', 'furacao', 'ventoAlt'].includes(o.aviso) && spawn > 0.9) { spawn = 0; add({ k: 'rajada', x: Math.random() * W, y: Math.max(10, topY) + Math.random() * 120, vx: 120, t: 0, vida: 0.6 }); }
  }
  if (tipo === 'chuva' || tipo === 'raios' || tipo === 'granizo') {
    ctx.fillStyle = `rgba(18,24,40,${0.22 + 0.18 * f})`; ctx.fillRect(0, 0, W, H);
    const ok = layer('chuva-longe', t, 30, 120, 0.6);
    layer('chuva-perto', t, 60, 240, 0.8); if (tipo !== 'granizo' || f > 0.5) layer('chuva-perto', t, 60, 240, 0.8, 64, 37);
    if (!ok) { ctx.fillStyle = 'rgba(190,210,255,.5)'; for (let i = 0; i < 160; i++) ctx.fillRect((i * 97 + t * 60) % W, (i * 53 + t * 240) % H, 1, 8); }
    if (spawn > 0.04) { spawn = 0; add({ k: 'respingo', x: tx0 + Math.random() * (tx1 - tx0), y: topoChuva + 4, t: 0, vida: 0.33 }); add({ k: 'respingo', x: Math.random() * W, y: gy, t: 0, vida: 0.33 }); }
  }
  if (tipo === 'granizo' && Math.random() < 0.8) for (let i = 0; i < 3; i++) add({ k: 'granizo', v: i % 3, x: Math.random() * W, y: (embaixo ? yNuv : 0) - 6, vy: 300, t: 0, vida: 3, chao: gy });
  if (tipo === 'raios') {
    if (Math.random() < dt * 0.9) { flash = 0.25; add({ k: 'raio', x: sx(-40 + Math.random() * 80), y: topoChuva, t: 0, vida: 0.3 }); sfx('trovao', (embaixo ? 0.4 : 1) * (0.15 + Math.random() * 0.4)); if (!embaixo) V.choque = 0.8; } // o raio dá choque nos pedreiros do topo
  }
  if (tipo === 'nevasca' || tipo === 'gelo') {
    ctx.fillStyle = tipo === 'gelo' ? 'rgba(170,215,255,.22)' : 'rgba(230,238,255,.2)'; ctx.fillRect(0, 0, W, H);
    layer('neve-longe', t, 6 * Math.sin(t), 20, 0.6); layer('neve-perto', t, 10 * Math.sin(t * 0.7), 40, 0.9);
    if (tipo === 'gelo') { ctx.fillStyle = 'rgba(190,230,255,.28)'; ctx.fillRect(tx0, topY, tx1 - tx0, gy - topY); }
  }
  if (tipo === 'vento' || tipo === 'furacao' || tipo === 'ventoAlt') {
    const n = Math.round(14 + 26 * f), vel = 500 + 500 * f;
    ctx.fillStyle = 'rgba(255,255,255,.45)';
    for (let i = 0; i < n; i++) { const L = 30 + (i * 37) % 90, y = (i * 113.7) % H, x = ((i * 211 + t * vel * (0.7 + (i % 3) * 0.2)) % (W + L)) - L; ctx.fillRect(Math.round(x), Math.round(y), L, 1); }
    const cad = tipo === 'furacao' ? 0.06 : 0.12;
    if (spawn > cad) {
      spawn = 0;
      add({ k: 'rajada', x: -96 + Math.random() * (W + 96), y: Math.max(10, topY - 60) + Math.random() * Math.min(H, gy - topY + 120), vx: 160 + 120 * f, t: 0, vida: 0.6 });
      if (tipo !== 'ventoAlt' && Math.random() < 0.7) add({ k: 'detrito', d: DETRITOS[Math.floor(Math.random() * DETRITOS.length)], x: -16, y: topY + Math.random() * Math.min(H, gy - topY), vx: 160 + 160 * f, ph: Math.random() * 6, t: 0, vida: (W + 40) / (160 + 160 * f) });
    }
  }
  if (tipo === 'sismo' || tipo === 'recalque' || tipo === 'tsunami') {
    if (spawn > 0.05) {
      spawn = 0;
      const fl = Math.max(0, Math.floor(S.floors) - Math.floor(Math.random() * 6)), e = eraVis(altOf(fl)), lista = ENTULHO[e] || ENTULHO[0];
      add({ k: 'entulho', n: lista[Math.floor(Math.random() * lista.length)], x: tx0 + Math.random() * (tx1 - tx0), y: sy(fl * FH + 40), vx: (Math.random() - 0.5) * 60, vy: -40 - Math.random() * 60, rot: 0, t: 0, vida: 4, chao: gy });
      if (Math.random() < 0.5) add({ k: 'poeira', x: tx0 + Math.random() * (tx1 - tx0), y: gy, t: 0, vida: 0.72 });
    }
  }
  if (tipo === 'tsunami') { // a onda vem do mar (direita) até a base da torre
    const p = Math.min(1, o.prog || 0), fr = Math.min(5, Math.floor(p * 6)), im = p > 0.7 ? (A('onda-espuma') || A('onda-' + fr)) : A('onda-' + fr);
    const x = W + 160 - p * (W + 160 - (tx1 + 60));
    if (im) ctx.drawImage(im, Math.round(x - 160), Math.round(gy - 112)); else { ctx.fillStyle = 'rgba(40,120,170,.8)'; ctx.fillRect(x - 160, gy - 60 * p, 320, 60 * p); }
  }
  if (tipo === 'meteoros' && Math.random() < dt * 3) { add({ k: 'meteoro', x: W + 40, y: -30 + Math.random() * H * 0.4, vx: -260, vy: 130, t: 0, vida: 3 }); sfx('meteoro'); }
  if (tipo === 'solar') {
    const im = A('aurora');
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 + 0.4 * (0.5 + 0.5 * Math.sin(t * 3));
    if (im) { const ox = -((t * 6) % 256); for (let x = ox; x < W; x += 256) ctx.drawImage(im, Math.round(x), 20); }
    else { ctx.fillStyle = 'rgba(80,255,160,.25)'; ctx.fillRect(0, 20, W, 64); }
    ctx.restore();
    ctx.fillStyle = `rgba(120,60,200,${0.08 + 0.08 * Math.sin(t * 7)})`; ctx.fillRect(0, 0, W, H);
  }
  // partículas
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.t += dt;
    if (p.t >= p.vida) { parts.splice(i, 1); continue; }
    if (p.vx) p.x += p.vx * dt;
    if (p.k === 'entulho') { p.vy += 500 * dt; if (p.y + p.vy * dt > p.chao) { p.vy *= -0.3; p.vx *= 0.6; } }
    if (p.vy) p.y += p.vy * dt;
    let im = null, ax = 0, ay = 0;
    if (p.k === 'respingo') { im = A('respingo-' + Math.min(3, Math.floor(p.t * 12))); ax = 6; ay = 6; }
    else if (p.k === 'rajada') { const r = A('rajada-' + Math.min(5, Math.floor(p.t * 10))); if (r) ctx.drawImage(r, Math.round(p.x), Math.round(p.y - 40), r.width * 2, r.height * 2); continue; }
    else if (p.k === 'detrito') { im = A(`detrito-${p.d}-${Math.floor(p.t * 10) % 4}`); p.y += Math.sin(p.t * 6 + p.ph) * 0.8; ax = 7; ay = 7; }
    else if (p.k === 'poeira') { im = A('poeira-' + Math.min(4, Math.floor(p.t * 7))); ax = 24; ay = 31; }
    else if (p.k === 'raio') { im = A('raio-' + Math.min(2, Math.floor(p.t * 12))); ax = 27; ay = 197; }
    else if (p.k === 'granizo') { im = A('granizo-' + p.v); if (p.y > p.chao) { p.vy = -60; p.chao = 1e9; } }
    else if (p.k === 'meteoro') { im = A('meteoro-' + Math.floor(p.t * 10) % 3); ax = 10; ay = 18; }
    else if (p.k === 'entulho') { im = A('entulho-' + p.n); ax = im ? im.width >> 1 : 0; ay = im ? im.height >> 1 : 0; }
    if (im) ctx.drawImage(im, Math.round(p.x - ax), Math.round(p.y - ay));
    else if (p.k !== 'rajada') { ctx.fillStyle = p.k === 'raio' ? '#fff8c0' : p.k === 'granizo' ? '#e8f4ff' : 'rgba(200,190,170,.8)'; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.k === 'raio' ? 3 : 4, p.k === 'raio' ? 120 : 4); }
  }
  if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${0.3 * flash / 0.25})`; ctx.fillRect(0, 0, W, H); flash -= dt; }
  if (embaixo) ctx.restore();
}
