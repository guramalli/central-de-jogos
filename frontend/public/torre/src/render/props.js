// Peças da cena em pixel art desenhada por código (sprites cacheados em render/sprites.js):
// parede de tijolos do andar, caminhão/betoneira e as partes do guindaste.
// Todas em pixels de mundo (1 pixel do sprite = 1 pixel de mundo), com 3–4 tons por material.
import { FH, TW, SLAB } from '../data/constants.js';
import { makeSprite, shade } from './sprites.js';
import { hash } from './canvas.js';

// janelas do andar (iguais às de tower.js)
export const WIN_X = [12, 72, 132, 192], WIN_W = 36, WIN_Y = 22, WIN_H = 48;

// ---------- parede de tijolos (era Tijolo e Madeira), 240×96, 4 variações ----------
const BRICK = ['#8a4c32', '#97573a', '#a3603f', '#ad6946', '#9c5a3c'];
const STONE = ['#a48a64', '#c9b089', '#ddc7a0', '#efe0c0'];
export function brickTile(v) {
  return makeSprite('brick-' + v, TW, FH, p => {
    const Q = (lx, ly, w, h, c) => p.r(lx, FH - ly - h, w, h, c); // y para cima, como no mundo
    Q(0, 0, TW, FH, '#6e3b26'); // argamassa
    for (let k = 0; k < 11; k++) {
      const ly = SLAB + k * 8;
      for (let x = (k % 2) * -8; x < TW; x += 16) {
        const c = BRICK[Math.floor(hash(v * 97 + x, k) * BRICK.length)];
        Q(x, ly, 15, 7, c); Q(x, ly + 6, 15, 1, shade(c, 0.16)); Q(x, ly, 15, 1, shade(c, -0.14));
        if (hash(x + v, k * 3) < 0.12) Q(x + 3 + Math.floor(hash(x, k) * 8), ly + 2, 2, 2, shade(c, -0.22)); // tijolo gasto
      }
    }
    // cunhais de pedra nas quinas
    for (let k = 0; k < 6; k++) {
      const ly = SLAB + k * 16, w = k % 2 ? 7 : 11;
      for (const [x, ww] of [[0, w], [TW - w, w]]) { Q(x, ly, ww, 15, STONE[1]); Q(x, ly + 14, ww, 1, STONE[3]); Q(x, ly, ww, 1, STONE[0]); }
    }
    for (const wx of WIN_X) {
      // sombra do vão, batente de madeira, verga com pedra-chave e peitoril
      Q(wx - 4, WIN_Y - 4, WIN_W + 8, WIN_H + 8, '#3a1f14');
      Q(wx - 3, WIN_Y - 3, WIN_W + 6, WIN_H + 6, '#5a3322'); Q(wx - 3, WIN_Y + WIN_H + 2, WIN_W + 6, 1, '#7a4a30'); Q(wx - 3, WIN_Y - 3, 1, WIN_H + 6, '#7a4a30');
      Q(wx - 7, WIN_Y + WIN_H + 4, WIN_W + 14, 6, STONE[1]); Q(wx - 7, WIN_Y + WIN_H + 9, WIN_W + 14, 1, STONE[3]); Q(wx - 7, WIN_Y + WIN_H + 4, WIN_W + 14, 1, STONE[0]);
      Q(wx + WIN_W / 2 - 4, WIN_Y + WIN_H + 3, 8, 9, STONE[2]); Q(wx + WIN_W / 2 - 4, WIN_Y + WIN_H + 11, 8, 1, STONE[3]); Q(wx + WIN_W / 2 + 3, WIN_Y + WIN_H + 3, 1, 9, STONE[0]);
      Q(wx - 6, WIN_Y - 9, WIN_W + 12, 5, STONE[1]); Q(wx - 6, WIN_Y - 5, WIN_W + 12, 1, STONE[3]); Q(wx - 6, WIN_Y - 9, WIN_W + 12, 1, STONE[0]);
      Q(wx - 5, WIN_Y - 11, WIN_W + 10, 2, 'rgba(40,16,8,.35)'); // sombra do peitoril
    }
    // sujeira escorrendo da laje e sob os peitoris
    for (let k = 0; k < 6; k++) { const x = 20 + Math.floor(hash(v, k + 40) * 200); Q(x, FH - 10 - Math.floor(hash(v, k) * 14), 1, 10, 'rgba(40,16,8,.18)'); }
  }, { outline: null });
}

// ---------- caminhão: carroceria basculante (nível 0) ou betoneira (Caminhão maior) ----------
// ponto de apoio = canto inferior esquerdo da carroceria, no chão (TRUCK_AX pixels da borda do sprite)
export const TRUCK_AX = 12;
const TRK = { cab: ['#1c3f63', '#2a5a8a', '#3a77b0', '#6aa2d6'], bed: ['#8f5a10', '#c47f17', '#ee9f26', '#ffc35a'], drum: ['#7e8594', '#a6adba', '#c9ced8', '#eef0f4'] };
export function truckSprite(kind, f, tilt, load) {
  return makeSprite(`truck-${kind}-${f}-${tilt ? 1 : 0}-${load || ''}`, 134, 78, p => {
    const Q = (lx, ly, w, h, c) => p.r(lx + TRUCK_AX, 76 - ly - h, w, h, c);
    // chassi e para-choques
    Q(-2, 10, 118, 5, '#2a2d36'); Q(-2, 14, 118, 1, '#4a4f5c'); Q(112, 9, 6, 8, '#7c818c'); Q(112, 16, 6, 1, '#b4bac4'); Q(-4, 10, 4, 6, '#7c818c');
    // cabine
    const c = TRK.cab;
    Q(76, 14, 38, 40, c[2]); Q(76, 14, 3, 40, c[1]); Q(111, 15, 2, 38, c[3]); Q(76, 50, 38, 4, c[1]); Q(78, 54, 34, 2, c[0]);
    Q(84, 32, 24, 16, '#9fd0f0'); Q(84, 46, 24, 2, '#d9f1ff'); Q(86, 34, 3, 10, '#d9f1ff'); Q(90, 40, 2, 5, '#d9f1ff'); Q(84, 32, 24, 1, c[0]);
    Q(95, 33, 6, 7, '#2a2a33'); Q(96, 40, 4, 4, '#e0a878'); Q(95, 43, 6, 2, '#f7c824');                 // motorista de capacete
    Q(81, 18, 1, 30, c[0]); Q(84, 28, 5, 2, c[0]);                                                       // porta e maçaneta
    Q(114, 36, 3, 9, '#3b4152'); Q(110, 18, 4, 4, '#ffe27a'); Q(110, 18, 4, 1, '#c9a227');               // espelho e farol
    Q(100, 18, 9, 7, c[1]); for (let k = 0; k < 3; k++) Q(101, 19 + k * 2, 7, 1, c[0]);                  // grade
    Q(78, 56, 4, 3, '#ff8a1e');                                                                          // giroflex
    if (kind === 'mixer') {
      // tambor da betoneira: barril com as pontas afinando, faixas espirais girando
      Q(2, 14, 72, 5, '#3e434d'); Q(2, 18, 72, 1, '#5a5f6a');                                          // longarina
      Q(10, 19, 5, 20, '#4a4f5c'); Q(10, 19, 1, 20, '#7c818c'); Q(58, 19, 5, 20, '#4a4f5c'); Q(58, 19, 1, 20, '#7c818c'); // apoios do tambor
      Q(8, 19, 30, 4, '#2a2d36'); Q(8, 22, 30, 1, '#4a4f5c');                                          // para-lama
      const d = TRK.drum;
      for (let y = 0; y < 30; y++) {
        const t = (y - 14.5) / 15, half = Math.round(34 * Math.sqrt(Math.max(0, 1 - t * t * 0.55)));
        const tone = y < 6 ? d[1] : y > 23 ? d[3] : y > 17 ? d[2] : d[2];
        Q(39 - half, 38 + y, half * 2, 1, y === 29 ? d[0] : tone);
        for (let s = 0; s < 4; s++) { const sx = 39 - half + ((s * 17 + f * 4 + y * 0.6) % (half * 2)); Q(sx, 38 + y, 4, 1, y > 23 ? '#ffc35a' : '#ee9f26'); }
      }
      Q(5, 40, 2, 26, d[0]); Q(-6, 42, 12, 5, '#7c818c'); Q(-6, 46, 12, 1, '#b4bac4');                // calha
      if (tilt) { Q(-10, 28, 6, 15, '#7c818c'); Q(-10, 28, 6, 3, '#9aa0ab'); }
      Q(70, 36, 5, 18, '#5a5f6a'); Q(66, 52, 10, 4, '#7c818c');                                         // suporte do motor do tambor
    } else {
      // caçamba basculante com nervuras
      const b = TRK.bed, up = tilt ? 4 : 0;
      Q(0, 14 + up, 76, 26, b[2]); Q(0, 38 + up, 76, 3, b[3]); Q(0, 14 + up, 76, 3, b[1]); Q(0, 14 + up, 2, 26, b[0]);
      for (let x = 7; x < 72; x += 14) { Q(x, 17 + up, 3, 21, b[1]); Q(x, 17 + up, 1, 21, b[3]); }
      Q(2, 20 + up, 10, 6, '#f4f1e6'); Q(3, 21 + up, 8, 4, '#c0504d');                                  // placa
      if (load) { for (let x = 4; x < 72; x += 8) { const hgt = 3 + Math.round(4 * Math.sin((x - 4) / 68 * Math.PI)); Q(x, 41 + up, 7, hgt, load); Q(x, 40 + up + hgt, 7, 1, shade(load, 0.25)); Q(x + 7, 41 + up, 1, hgt, shade(load, -0.3)); } }
    }
  });
}
export function wheelSprite(f) {
  return makeSprite('wheel-' + f, 20, 20, p => {
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) {
      const d = Math.hypot(x + 0.5 - 10, y + 0.5 - 10);
      if (d > 9.2) continue;
      p.px(x, y, d > 5.6 ? (y < 6 && d > 8.2 ? '#3a3e48' : '#1d1f25') : d > 4.6 ? '#6f7581' : y + x < 18 ? '#d2d7df' : '#a3a9b4');
    }
    p.r(8, 8, 4, 4, '#4a4f5c'); p.r(9, 9, 1, 1, '#d2d7df');
    const bolts = f ? [[10, 6], [14, 10], [9, 13], [5, 9]] : [[13, 7], [12, 13], [6, 12], [7, 6]];
    for (const [x, y] of bolts) p.px(x, y, '#4a4f5c');
  });
}

// ---------- guindaste ----------
const Y3 = ['#a8760c', '#d39a14', '#f2b630', '#ffd86a'];
// seção do mastro 16×14 (treliça: dois montantes, travessa e diagonal)
export const mastTile = () => makeSprite('crane-mast', 16, 14, p => {
  p.r(0, 0, 3, 14, Y3[2]); p.r(0, 0, 1, 14, Y3[3]); p.r(13, 0, 3, 14, Y3[1]); p.r(15, 0, 1, 14, Y3[0]);
  p.r(0, 12, 16, 2, Y3[1]); p.r(0, 12, 16, 1, Y3[2]);
  for (let d = 0; d < 10; d++) p.r(3 + d, 11 - d, 1, 2, d % 3 ? Y3[1] : Y3[0]);
  p.px(1, 13, '#5a5f6a'); p.px(14, 13, '#5a5f6a');
}, { outline: null });
// seção da lança 16×17 (banzo de cima, banzo de baixo e diagonais)
export const jibTile = () => makeSprite('crane-jib', 16, 17, p => {
  p.r(0, 0, 16, 3, Y3[2]); p.r(0, 0, 16, 1, Y3[3]); p.r(0, 14, 16, 3, Y3[1]); p.r(0, 16, 16, 1, Y3[0]);
  p.r(0, 3, 2, 11, Y3[1]); p.r(0, 3, 1, 11, Y3[2]);
  for (let d = 0; d < 11; d++) p.r(2 + d, 3 + d, 2, 1, d % 3 ? Y3[1] : Y3[0]);
}, { outline: null });
// cabine do operador 30×26
export const cabSprite = () => makeSprite('crane-cab', 30, 26, p => {
  p.r(1, 1, 28, 24, '#2a5a8a'); p.r(1, 1, 28, 2, '#3a77b0'); p.r(1, 1, 2, 24, '#1c3f63'); p.r(27, 3, 1, 21, '#6aa2d6');
  p.r(6, 5, 20, 11, '#9fd0f0'); p.r(6, 5, 20, 1, '#1c3f63'); p.r(8, 7, 2, 6, '#d9f1ff'); p.r(11, 7, 1, 3, '#d9f1ff');
  p.r(16, 8, 5, 5, '#2a2a33'); p.r(17, 11, 4, 4, '#e0a878'); p.r(16, 8, 6, 2, '#f7c824');              // operador
  p.r(3, 18, 24, 2, '#1c3f63'); p.r(5, 21, 3, 2, '#ffe27a');
});
// contrapeso de blocos de concreto 40×32
export const weightSprite = () => makeSprite('crane-weight', 40, 32, p => {
  for (let k = 0; k < 3; k++) {
    const y = 1 + k * 10;
    p.r(1, y, 38, 10, '#8d939e'); p.r(1, y, 38, 1, '#b8bec8'); p.r(1, y + 9, 38, 1, '#5e636e'); p.r(1, y, 2, 10, '#6f7581');
    p.r(19, y + 1, 1, 8, '#6f7581');
  }
  p.r(6, 13, 8, 2, '#f2b630'); p.r(26, 13, 8, 2, '#f2b630');
});
// carrinho da lança 20×10 e moitão com gancho 16×18
export const trolleySprite = () => makeSprite('crane-trolley', 20, 10, p => {
  p.r(1, 2, 18, 6, '#3b4152'); p.r(1, 2, 18, 1, '#5a5f6a'); p.r(3, 0, 4, 3, '#1d1f25'); p.r(13, 0, 4, 3, '#1d1f25'); p.r(9, 8, 2, 2, '#9aa0ab');
});
export const hookSprite = () => makeSprite('crane-hook', 16, 20, p => {
  p.r(1, 1, 14, 9, '#3b4152'); p.r(1, 1, 14, 1, '#5a5f6a'); p.r(1, 6, 14, 2, '#f2b630'); p.r(5, 3, 6, 2, '#7c818c');
  p.r(7, 10, 3, 4, '#f2b630'); p.r(5, 14, 2, 4, '#f2b630'); p.r(5, 17, 6, 2, '#f2b630'); p.r(10, 15, 2, 3, '#f2b630'); p.px(8, 11, '#ffd86a');
});

// ---------- paredes das outras eras (240×96, 3 variações; janelas desenhadas por cima em tower.js) ----------
// e: 1 concreto, 3 estratosfera, 4 mesosfera, 5 espaço, 6 órbita (o 2, pele de vidro, é desenhado direto)
export function eraTile(e, v, s) {
  return makeSprite(`era-${e}-${v}`, TW, FH, p => {
    const Q = (lx, ly, w, h, c) => p.r(lx, FH - ly - h, w, h, c);
    const W0 = s.wall, dk = shade(W0, -0.14), dk2 = shade(W0, -0.3), lt = shade(W0, 0.12), lt2 = shade(W0, 0.28);
    Q(0, 0, TW, FH, W0);
    const noise = (n, c, h = FH) => { for (let k = 0; k < n; k++) Q(Math.floor(hash(v * 13 + k, e) * TW), SLAB + Math.floor(hash(k, v + e * 7) * (h - SLAB)), 1, 1, c); };
    // janela com moldura em relevo (luz em cima/esquerda); cut = cantos recortados
    const frame = (wx, fc, cut) => {
      Q(wx - 5, WIN_Y - 5, WIN_W + 10, WIN_H + 10, shade(W0, -0.38));
      Q(wx - 4, WIN_Y - 4, WIN_W + 8, WIN_H + 8, fc); Q(wx - 4, WIN_Y + WIN_H + 3, WIN_W + 8, 1, shade(fc, 0.35)); Q(wx - 4, WIN_Y - 4, 1, WIN_H + 8, shade(fc, 0.2));
      Q(wx + WIN_W + 3, WIN_Y - 4, 1, WIN_H + 8, shade(fc, -0.3)); Q(wx - 4, WIN_Y - 4, WIN_W + 8, 1, shade(fc, -0.35));
      if (cut) for (const [cx, cy] of [[wx - 5, WIN_Y - 5], [wx + WIN_W + 3, WIN_Y - 5], [wx - 5, WIN_Y + WIN_H + 3], [wx + WIN_W + 3, WIN_Y + WIN_H + 3]]) Q(cx, cy, 2, 2, W0);
    };
    if (e === 1) { // concreto pré-moldado: placas de 60 com juntas, furos de forma, manchas
      noise(260, dk); noise(160, lt);
      for (let x = 60; x < TW; x += 60) { Q(x - 1, SLAB, 1, FH - SLAB, dk2); Q(x, SLAB, 1, FH - SLAB, lt2); }
      Q(0, 51, TW, 1, dk2); Q(0, 52, TW, 1, lt2);
      for (let x = 0; x < TW; x += 60) for (const yy of [14, 44, 60, 88]) for (const dx of [8, 50]) { Q(x + dx, yy, 2, 2, dk2); Q(x + dx, yy - 1, 2, 1, lt); }
      for (let k = 0; k < 7; k++) { const x = Math.floor(hash(v, k + 3) * TW); Q(x, SLAB + 4, 2, 10 + Math.floor(hash(k, v) * 30), 'rgba(40,44,52,.10)'); }
      for (const wx of WIN_X) { frame(wx, lt, false); Q(wx - 7, WIN_Y - 9, WIN_W + 14, 5, lt2); Q(wx - 7, WIN_Y - 9, WIN_W + 14, 1, dk); Q(wx - 6, WIN_Y - 12, WIN_W + 12, 3, 'rgba(30,34,40,.22)'); }
    } else if (e === 3) { // estratosfera: painéis brancos aerodinâmicos com rebites e faixa luminosa
      noise(80, lt2);
      for (let x = 30; x < TW; x += 60) { Q(x, SLAB, 1, FH - SLAB, dk); for (let y = SLAB + 3; y < FH; y += 6) { Q(x - 2, y, 1, 1, dk2); Q(x + 2, y, 1, 1, dk2); } }
      Q(0, 80, TW, 3, s.lit); Q(0, 83, TW, 1, shade(s.lit, 0.5)); Q(0, 79, TW, 1, dk2);
      for (const wx of WIN_X) { frame(wx, s.frame, true); Q(wx + 4, WIN_Y - 9, WIN_W - 8, 3, dk); for (let k = 0; k < 5; k++) Q(wx + 6 + k * 6, WIN_Y - 8, 3, 1, dk2); }
    } else if (e === 4) { // mesosfera: chapas de metal escuro com rebites, bisel e grades de ventilação
      for (let y = SLAB; y < FH; y += 44) for (let x = 0; x < TW; x += 40) {
        Q(x, y, 40, 44, W0); Q(x, y + 43, 40, 1, lt2); Q(x, y, 1, 44, lt); Q(x + 39, y, 1, 44, dk2); Q(x, y, 40, 1, dk2);
        for (const [rx, ry] of [[3, 3], [35, 3], [3, 39], [35, 39]]) { Q(x + rx, y + ry, 2, 2, dk2); Q(x + rx, y + ry + 1, 1, 1, lt2); }
      }
      noise(120, dk);
      for (const wx of WIN_X) { frame(wx, s.frame, true); Q(wx + 6, WIN_Y - 10, WIN_W - 12, 4, dk2); for (let k = 0; k < 6; k++) Q(wx + 8 + k * 4, WIN_Y - 9, 2, 2, shade(s.lit, -0.2)); }
    } else if (e === 5) { // espaço: casco azul-marinho com frisos dourados
      for (let x = 0; x < TW; x += 30) Q(x, SLAB, 1, FH - SLAB, dk);
      noise(90, lt);
      Q(0, 82, TW, 3, s.frame); Q(0, 84, TW, 1, shade(s.frame, 0.45)); Q(0, 81, TW, 1, dk2);
      for (let x = 15; x < TW; x += 30) { Q(x, 86, 2, 2, s.frame); Q(x, 87, 1, 1, shade(s.frame, 0.5)); }
      for (const wx of WIN_X) { frame(wx, s.frame, true); Q(wx - 2, WIN_Y - 8, WIN_W + 4, 2, shade(s.frame, -0.2)); }
    } else { // órbita: placas roxas com costuras que brilham
      for (let y = SLAB; y < FH; y += 22) Q(0, y, TW, 1, dk2);
      for (let x = 0; x < TW; x += 48) Q(x, SLAB, 1, FH - SLAB, dk2);
      noise(110, lt);
      for (let k = 0; k < 10; k++) { const x = Math.floor(hash(v, k) * TW / 48) * 48, y = SLAB + Math.floor(hash(k, v + 1) * 4) * 22; Q(x - 3, y, 7, 1, s.frame); Q(x, y - 1, 1, 3, s.lit); }
      for (const wx of WIN_X) { frame(wx, s.frame, true); Q(wx + WIN_W / 2 - 3, WIN_Y + WIN_H + 6, 6, 2, s.lit); }
    }
  }, { outline: null });
}

// ---------- elevador de carga ----------
const ST = ['#1c2029', '#2a2f3d', '#3b4152', '#56607a', '#7d89a6'];
// seção do poço 30×24: dois trilhos, travessa e diagonal
export const shaftTile = () => makeSprite('shaft', 30, 24, p => {
  p.r(0, 0, 3, 24, ST[2]); p.r(0, 0, 1, 24, ST[4]); p.r(2, 0, 1, 24, ST[1]);
  p.r(27, 0, 3, 24, ST[2]); p.r(27, 0, 1, 24, ST[3]); p.r(29, 0, 1, 24, ST[0]);
  p.r(0, 22, 30, 2, ST[1]); p.r(0, 22, 30, 1, ST[3]);
  for (let d = 0; d < 12; d++) { p.r(3 + d * 2, 20 - d * 1.7, 2, 2, d % 4 ? ST[1] : ST[0]); }
  p.px(1, 23, '#8f95a1'); p.px(28, 23, '#8f95a1');
}, { outline: null });
// cabine de carga 26×34 (gaiola amarela com tela)
export const carSprite = () => makeSprite('elev-car', 26, 34, p => {
  p.r(1, 1, 24, 32, '#c9a227'); p.r(1, 1, 24, 2, '#e8c450'); p.r(1, 1, 2, 32, '#a8860f'); p.r(23, 3, 1, 30, '#f2d36a');
  p.r(4, 5, 18, 24, '#262a35');
  for (let y = 7; y < 29; y += 4) p.r(4, y, 18, 1, '#343a4a');
  for (let x = 7; x < 22; x += 4) p.r(x, 5, 1, 24, '#343a4a');
  p.r(1, 30, 24, 3, '#8a6a10'); p.r(10, 0, 6, 2, '#5a5f6a');
});
// casa de máquinas no topo do poço 38×14
export const shaftTopSprite = () => makeSprite('shaft-top', 38, 14, p => {
  p.r(1, 1, 36, 12, '#6b7183'); p.r(1, 1, 36, 2, '#8f95a8'); p.r(1, 11, 36, 2, '#4a4f5c');
  for (let x = 3; x < 35; x += 6) { p.r(x, 9, 3, 2, '#f2b630'); p.r(x + 3, 9, 3, 2, '#2a2d36'); }
  p.r(4, 4, 6, 4, '#4a4f5c'); p.r(28, 4, 6, 4, '#4a4f5c'); for (let k = 0; k < 3; k++) p.r(5, 5 + k, 4, 1, k % 2 ? '#6b7183' : '#3a3e48');
});

// ---------- coqueiro ----------
// tronco curvo afinando para cima, com casca em escamas (44×200)
export const palmTrunk = () => makeSprite('palm-trunk2', 44, 200, p => {
  for (let s = 0; s < 192; s++) {
    const bend = Math.sin(s / 192 * 1.4) * 14, w = Math.round(12 - 4 * s / 192), x = Math.round(6 + bend - w / 2 + 4), y = 199 - s;
    const k = s % 8, scale = k < 2;
    p.r(x, y, w, 1, scale ? '#6a4626' : '#86603a');
    p.r(x, y, 2, 1, '#5a3a1e'); p.r(x + w - 3, y, 2, 1, scale ? '#86603a' : '#a87c4c');
    if (scale) p.r(x + Math.round(w / 2) - 1 + (k ? 1 : -1), y, 2, 1, '#4e321a');      // escama (chevron)
    if (k === 2) p.r(x + 2, y, w - 5, 1, '#9a7044');
  }
  for (let k = 0; k < 7; k++) p.r(18 + (k % 3) - 1 + Math.round(k * 1.2), 6 + k, 12 - k, 1, k % 2 ? '#7a5a2a' : '#5e4420'); // colar de fibras no alto
}, { outline: '#3a2614' });

// copa: folhas arqueadas com folíolos dos dois lados; sway desloca e muda a curva (7 posições)
export function palmCrown(sway) {
  return makeSprite('palm-crown3-' + sway, 140, 100, p => {
    const cx = 70 + sway * 0.6, cy = 26;
    const line = (x0, y0, x1, y1, c) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0 || 1; for (let k = 0; k <= n; k++) p.px(Math.round(x0 + (x1 - x0) * k / n), Math.round(y0 + (y1 - y0) * k / n), c); };
    // folha: dir (−1/1), comprimento, ângulo de saída (graus acima da horizontal), queda; cores [folíolo claro, folíolo escuro, nervura]
    const frond = (dir, L, up, droop, pal) => {
      const a = up * Math.PI / 180, bend = sway * 0.02 * dir;
      let px0 = cx, py0 = cy;
      for (let k = 1; k <= L; k++) {
        const t = k / L, x = cx + dir * Math.cos(a) * k, y = cy - Math.sin(a) * k + droop * t * t * L * (1 + bend);
        // folíolos: saem para baixo e para fora, mais curtos na ponta
        if (k % 3 === 0 && t > 0.1) {
          const len = 10 * (1 - t * 0.6), tx = x - px0, ty = y - py0, tl = Math.hypot(tx, ty) || 1, ux = tx / tl, uy = ty / tl;
          for (const side of [1, -1]) {
            const ang = side * 1.05, rx = ux * Math.cos(ang) - uy * Math.sin(ang), ry = ux * Math.sin(ang) + uy * Math.cos(ang);
            const dy = Math.abs(ry) + 0.6; // sempre caindo um pouco
            line(x, y, x + rx * len * 0.8, y + dy * len * 0.8, side > 0 ? pal[1] : pal[0]);
          }
        }
        line(px0, py0, x, y, pal[2]); px0 = x; py0 = y;
      }
    };
    const back = ['#2f6e33', '#245a28', '#3a5a22'], mid = ['#3f9142', '#2f7434', '#5a7a2a'], front = ['#5cbf5e', '#3f9142', '#7a9a3a'];
    frond(-1, 46, 42, 1.55, back); frond(1, 46, 42, 1.55, back); frond(-1, 30, 74, 1.7, back);
    frond(-1, 60, 22, 1.25, mid); frond(1, 60, 22, 1.25, mid); frond(-1, 50, 2, 0.8, mid); frond(1, 52, 2, 0.8, mid);
    frond(-1, 38, 58, 1.7, front); frond(1, 38, 58, 1.7, front); frond(1, 26, 86, 1.9, front);
    for (const [dx, dy] of [[-5, 3], [1, 4], [-2, 7], [4, 1]]) { p.r(cx + dx, cy + dy, 5, 5, '#6b4a24'); p.r(cx + dx, cy + dy + 4, 5, 1, '#4e3418'); p.r(cx + dx + 1, cy + dy + 1, 2, 1, '#a07848'); }
  }, { outline: '#1e3a1c' });
}

// ---------- prédios da orla (fundo) ----------
export function orlaSprite(i, bw, bh, base) {
  bw = Math.round(bw); bh = Math.round(bh);
  return makeSprite(`orla-${i}-${bw}-${bh}`, bw, bh + 16, p => {
    const Q = (lx, ly, w, h, c) => p.r(lx, bh + 16 - ly - h, w, h, c);
    const dk = shade(base, -0.12), lt = shade(base, 0.1);
    Q(0, 0, bw, bh, base); Q(bw - 6, 0, 6, bh, dk); Q(0, 0, 1, bh, lt);
    const balc = hash(i, 9) < 0.5;
    for (let wy = 16; wy < bh - 12; wy += 18) {
      for (let wx = 6; wx < bw - 10; wx += 14) {
        const lit = hash(i * 31 + wx, wy) < 0.22;
        Q(wx - 1, wy - 1, 8, 11, dk); Q(wx, wy, 6, 9, lit ? '#ffe7a3' : '#c3d5e2'); Q(wx, wy + 6, 6, 3, lit ? '#fff3c8' : '#dde9f2');
      }
      if (balc) { Q(2, wy - 4, bw - 8, 2, lt); for (let x = 3; x < bw - 7; x += 3) Q(x, wy - 2, 1, 3, dk); }
    }
    Q(0, bh, bw, 3, dk); Q(0, bh + 2, bw, 1, lt); // platibanda
    if (hash(i, 23) < 0.6) { const tx = 6 + Math.floor(hash(i, 24) * (bw - 26)); Q(tx, bh + 3, 14, 9, '#8a97a3'); Q(tx, bh + 11, 14, 1, '#aab5bf'); Q(tx + 2, bh + 3, 1, 9, '#6f7b87'); }
    if (hash(i, 25) < 0.5) { const ax = bw - 14; Q(ax, bh + 3, 1, 12, '#5b6570'); Q(ax - 2, bh + 10, 5, 1, '#5b6570'); }
  }, { outline: null });
}

// ---------- calçadão de Praia Grande: ondas pretas e brancas (64×14) ----------
export const calcadaoTile = () => makeSprite('calcadao', 64, 14, p => {
  for (let y = 0; y < 14; y++) for (let x = 0; x < 64; x++) {
    const band = Math.floor((y + 3.2 * Math.sin(2 * Math.PI * x / 32) + 20) / 3.5) % 2;
    p.px(x, y, band ? '#2e2a26' : '#efe6d2');
  }
}, { outline: null });

// ---------- olaria: forno de tijolos com chaminé (72×100), fogo em 2 quadros ----------
export function kilnSprite(f) {
  return makeSprite('kiln-' + f, 74, 102, p => {
    const Q = (lx, ly, w, h, c) => p.r(lx + 1, 101 - ly - h, w, h, c);
    for (let r = 0; r < 6; r++) for (let x = (r % 2) * -6; x < 70; x += 12) {
      const c = BRICK[Math.floor(hash(x + 5, r) * BRICK.length)];
      Q(Math.max(0, x), r * 8, Math.min(11, 70 - Math.max(0, x)), 7, c); Q(Math.max(0, x), r * 8 + 6, Math.min(11, 70 - Math.max(0, x)), 1, shade(c, 0.15));
    }
    Q(0, 46, 70, 4, '#7d4630'); Q(0, 49, 70, 1, '#a8603e');
    Q(46, 50, 12, 46, '#8a4c32'); for (let y = 50; y < 96; y += 6) Q(46, y, 12, 1, '#6e3b26'); Q(44, 94, 16, 4, '#5a3322'); Q(44, 97, 16, 1, '#7a4a30');
    Q(18, 0, 26, 24, '#5a3322'); Q(20, 0, 22, 22, '#2a1a12');                     // boca do forno em arco
    Q(19, 22, 24, 2, STONE[1]); Q(28, 23, 6, 3, STONE[2]);
    const fire = f ? ['#ff8a1e', '#ffb347', '#ffe27a'] : ['#ffb347', '#ff8a1e', '#fff2a8'];
    Q(22, 2, 18, 10, fire[0]); Q(25, 4, 12, 9, fire[1]); Q(28 + f, 6, 5, 6, fire[2]); Q(22, 0, 18, 3, '#3a2216');
  });
}

// ---------- palete com tijolos (22×14) ----------
export function palletSprite(c) {
  return makeSprite('pallet-' + c, 22, 14, p => {
    p.r(1, 10, 20, 3, '#8b5a2b'); p.r(1, 10, 20, 1, '#a87440'); p.r(3, 12, 3, 1, '#4e3218'); p.r(10, 12, 3, 1, '#4e3218'); p.r(16, 12, 3, 1, '#4e3218');
    const cd = shade(c, -0.25), cl = shade(c, 0.25);
    p.r(2, 1, 18, 9, c); p.r(2, 1, 18, 1, cl); p.r(2, 5, 18, 1, cd); p.r(2, 9, 18, 1, cd);
    for (const [x, y] of [[8, 2], [14, 2], [5, 6], [11, 6], [17, 6]]) p.r(x, y, 1, 3, cd);
  });
}

// ---------- céu: nuvem cúmulo (largura em passos de 20 px), avião e balão ----------
export function cloudSprite(w) {
  w = Math.max(40, Math.round(w / 20) * 20);
  const h = Math.round(w * 0.5);
  return makeSprite('cloud-' + w, w, h, p => {
    const puffs = [[0.2, 0.6, 0.18], [0.4, 0.42, 0.25], [0.63, 0.5, 0.21], [0.82, 0.64, 0.14], [0.3, 0.72, 0.16], [0.56, 0.72, 0.19]];
    const m = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (y > h * 0.84) continue;
      for (const [fx, fy, fr] of puffs) if (Math.hypot(x + 0.5 - fx * w, (y + 0.5 - fy * h) * 1.15) < Math.min(fr * w, fy * h * 1.15 - 1)) { m[y * w + x] = 1; break; }
    }
    const at = (x, y) => x >= 0 && y >= 0 && x < w && y < h && m[y * w + x];
    const sh = Math.max(2, Math.round(h * 0.12));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!at(x, y)) continue;
      const top = !at(x, y - 2) || !at(x - 1, y - 3), bottom = !at(x, y + sh) || y > h * 0.74;
      p.px(x, y, top ? '#ffffff' : bottom ? (!at(x, y + 2) ? '#b9cadd' : '#d2deeb') : '#eef4fa');
    }
  }, { outline: null });
}
// avião voando para a direita: fuselagem com nariz arredondado, deriva atrás, asa enflechada e turbina
export const planeSprite = () => makeSprite('plane', 168, 60, p => {
  const Q = (lx, ly, w, h, c) => p.r(lx + 4, 56 - ly - h, w, h, c);
  // deriva (cauda vertical) e estabilizador
  for (let k = 0; k < 26; k++) Q(4 + Math.round(k * 0.7), 18 + k, 22 - Math.round(k * 0.55), 1, k > 20 ? '#2c4a7a' : '#3b6fd1');
  Q(0, 14, 26, 4, '#c3c9d2'); Q(0, 14, 26, 1, '#9aa3b0');
  // fuselagem: cone da cauda subindo, corpo, nariz arredondado
  for (let y = 0; y < 20; y++) {
    const tail = Math.max(0, Math.round((8 - y) * 3)), nose = Math.round(14 - Math.sqrt(Math.max(0, 100 - (y - 10) * (y - 10))) * 1.4);
    const c = y < 4 ? '#b8c0cb' : y < 8 ? '#d3d9e1' : y < 16 ? '#e9edf2' : '#ffffff';
    Q(tail, 8 + y, 160 - tail - Math.max(0, nose), 1, c);
  }
  Q(30, 17, 112, 1, '#3b6fd1'); Q(30, 15, 112, 1, '#86aee6');
  for (let k = 0; k < 11; k++) { Q(40 + k * 9, 19, 4, 4, '#2c4a7a'); Q(40 + k * 9, 22, 4, 1, '#86aee6'); }
  Q(145, 19, 5, 4, '#2c4a7a'); Q(150, 19, 3, 3, '#2c4a7a'); Q(145, 22, 6, 1, '#86aee6');
  // asa enflechada (de baixo da fuselagem para trás) e turbina
  for (let k = 0; k < 9; k++) Q(66 - k * 4, 8 - k, 34, 1, k < 2 ? '#9aa3b0' : '#c3c9d2');
  Q(70, 2, 20, 6, '#8d939e'); Q(70, 6, 20, 2, '#b8c0cb'); Q(88, 3, 3, 4, '#3e434d');
});

export const balloonSprite = () => makeSprite('balloon', 64, 140, p => {
  const Q = (lx, ly, w, h, c) => p.r(lx + 32, 136 - ly - h, w, h, c);
  for (let dy = 0; dy < 70; dy++) {
    const t = (dy - 35) / 35, hw = Math.round(30 * Math.sqrt(Math.max(0, 1 - t * t)));
    Q(-hw, 64 + dy, hw * 2, 1, dy > 52 ? '#ffffff' : dy > 30 ? '#eeeeee' : '#d6d6d6'); Q(-hw, 64 + dy, Math.min(3, hw), 1, '#c4c4c4');
  }
  Q(-1, 14, 2, 50, '#9a9a9a'); Q(-8, 0, 16, 14, '#e05a3c'); Q(-8, 12, 16, 2, '#ff8a6a'); Q(-6, 4, 4, 4, '#f7f8fa');
});

// ---------- dirigível dos megablocos (310×116), hélices em 2 quadros ----------
export function airshipSprite(f) {
  return makeSprite('airship-' + f, 316, 118, p => {
    const Q = (lx, ly, w, h, c) => p.r(lx + 158, 88 - ly - h, w, h, c);
    for (let dy = 0; dy < 80; dy++) {
      const t = (dy - 38) / 40, hw = Math.round(150 * Math.sqrt(Math.max(0, 1 - t * t)));
      const c = dy < 12 ? '#8d939e' : dy < 26 ? '#a8adb8' : dy < 56 ? '#c8ccd4' : dy < 70 ? '#dfe2e8' : '#eef0f4';
      Q(-hw, dy, hw * 2, 1, c);
      for (let x = -120; x <= 120; x += 30) if (Math.abs(x) < hw - 4) Q(x, dy, 1, 1, shade(c, -0.08));
    }
    Q(-150, 36, 300, 6, '#f2b630'); Q(-150, 41, 300, 1, '#ffd86a'); Q(-150, 36, 300, 1, '#c98f15');
    Q(128, 30, 28, 4, '#8d939e'); Q(146, 12, 10, 50, '#a8adb8'); Q(146, 12, 3, 50, '#8d939e'); Q(146, 36, 10, 6, '#f2b630');
    Q(-44, -26, 88, 26, '#3b4152'); Q(-44, -4, 88, 4, '#56607a'); Q(-44, -26, 88, 2, '#2a2d36');
    for (let k = 0; k < 5; k++) { Q(-36 + k * 16, -18, 10, 9, '#9fd0f0'); Q(-36 + k * 16, -11, 10, 2, '#d9f1ff'); }
    for (const sx of [-64, 60]) { Q(sx, -12, 4, 14, '#5a5f6a'); const l = f ? 18 : 8; Q(sx - 1, -12 - (f ? 0 : 5), 6, l, '#dfe3ea'); }
  });
}

// ---------- turismo: bilheteria, cabine panorâmica, helicóptero, foguete ----------
export const boothSprite = () => makeSprite('booth', 44, 78, p => {
  const Q = (lx, ly, w, h, c) => p.r(lx + 3, 76 - ly - h, w, h, c);
  Q(0, 0, 34, 62, '#2f5d8a'); Q(0, 0, 3, 62, '#24476a'); Q(31, 0, 3, 62, '#3a77b0');
  Q(4, 28, 26, 22, '#24476a'); Q(6, 30, 22, 18, '#bfe3ff'); Q(6, 44, 22, 4, '#e2f4ff');
  Q(14, 32, 7, 8, '#2a2a33'); Q(15, 38, 5, 5, '#e0a878'); Q(13, 30, 9, 3, '#c0504d');            // atendente
  Q(2, 24, 30, 3, '#8b5a2b'); Q(2, 26, 30, 1, '#a87440');
  for (let k = 0; k < 5; k++) Q(-2 + k * 8, 62, 8, 8, k % 2 ? '#f7f8fa' : '#c0504d');               // toldo listrado
  Q(-2, 62, 40, 1, '#8a3a36'); for (let k = 0; k < 5; k++) Q(-1 + k * 8, 60, 6, 2, k % 2 ? '#e8ebf0' : '#a8403c');
  Q(6, 6, 22, 14, '#24476a'); Q(8, 8, 18, 10, '#3a77b0');
});
export const panoSprite = (a, b) => makeSprite(`pano-${a}-${b}`, 28, 38, p => {
  p.r(1, 1, 26, 36, '#2b3142'); p.r(1, 1, 26, 2, '#56607a');
  p.r(3, 4, 22, 28, '#9fd8ef'); p.r(3, 4, 22, 6, '#c8ecf8'); p.r(14, 4, 1, 28, '#7ab8d0');
  p.r(6, 18, 5, 12, a); p.r(6, 13, 5, 5, '#e0a878'); p.r(6, 12, 5, 2, '#3a2a1a');
  p.r(16, 18, 5, 12, b); p.r(16, 13, 5, 5, '#8d5524'); p.r(16, 12, 5, 2, '#1d1d22');
  p.r(3, 30, 22, 2, '#e9f6fb'); p.r(1, 34, 26, 3, '#3b4152');
});
export function heliSprite(f) {
  return makeSprite('heli-' + f, 110, 40, p => {
    const Q = (lx, ly, w, h, c) => p.r(lx + 56, 32 - ly - h, w, h, c);
    Q(-18, 0, 38, 20, '#d94a3a'); Q(-18, 0, 38, 3, '#a8342a'); Q(-18, 17, 38, 3, '#f06a5a');
    Q(6, 6, 13, 11, '#9fd0f0'); Q(6, 14, 13, 3, '#d9f1ff'); Q(10, 8, 4, 5, '#2a2a33');
    Q(-48, 10, 32, 5, '#d94a3a'); Q(-48, 10, 32, 1, '#a8342a'); Q(-52, 6, 6, 16, '#d94a3a'); Q(-52, 6, 2, 16, '#a8342a');
    Q(-54, 12, 3, 3, f ? '#2d3340' : '#8d939e');
    Q(-14, -6, 32, 3, '#3b4152'); Q(-10, -4, 2, 4, '#3b4152'); Q(12, -4, 2, 4, '#3b4152');
    Q(-1, 20, 3, 3, '#2d3340');
    const w = f ? 76 : 44; Q(1 - w / 2, 23, w, 2, '#2d3340');
  });
}
export const rocketSprite = () => makeSprite('rocket', 22, 58, p => {
  const Q = (lx, ly, w, h, c) => p.r(lx + 2, 56 - ly - h, w, h, c);
  Q(0, 0, 18, 42, '#eef1f6'); Q(0, 0, 4, 42, '#c9ced8'); Q(14, 0, 2, 42, '#ffffff');
  Q(3, 42, 12, 8, '#d94a3a'); Q(6, 50, 6, 4, '#d94a3a'); Q(3, 42, 3, 8, '#a8342a');
  Q(0, 24, 18, 4, '#3b6fd1'); Q(6, 30, 6, 6, '#22407a'); Q(7, 31, 4, 4, '#5fb8ff');
  Q(-2, 0, 4, 10, '#a8342a'); Q(16, 0, 4, 10, '#a8342a');
});

// ---------- andaime: tubos de aço, travessas, tábuas e braçadeiras (26×32, repete na vertical) ----------
export const scaffoldTile = () => makeSprite('scaffold', 26, 32, p => {
  for (const x of [4, 15]) { p.r(x, 0, 4, 32, '#8f969f'); p.r(x, 0, 1, 32, '#c7ccd6'); p.r(x + 3, 0, 1, 32, '#5e646e'); }
  for (let d = 0; d < 11; d++) p.r(8 + d * 0.65, 4 + d * 2, 2, 2, '#6f7680');
  p.r(0, 24, 26, 4, '#a8814a'); p.r(0, 24, 26, 1, '#c89a5e'); p.r(0, 27, 26, 1, '#6b4f28');
  for (const x of [5, 13, 20]) p.r(x, 25, 1, 2, '#8b6a3a');
  p.r(0, 28, 26, 1, 'rgba(0,0,0,.25)');
  for (const x of [3, 14]) { p.r(x, 22, 6, 2, '#5a5f6a'); p.r(x + 1, 22, 1, 1, '#b4bac4'); }
}, { outline: null });
