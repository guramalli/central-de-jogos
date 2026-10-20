// Base Lunar (cidade da obra 5, 10, …): horizonte de crateras e montanhas cinzentas ao fundo, chão de regolito com
// crateras e pedras na frente, e a Terra grande no céu (em coordenadas de tela, como o satélite). Luz de cima e da frente.
import { R, ctx } from './canvas.js';
import { hash } from './canvas.js';
import { worldX, worldY } from './camera.js';
import { art } from './assets.js';

// fundo (faixa de 0 a 64 acima do chão, onde nas outras cidades fica o mar): planície e montanhas recortadas
export function moonBack() {
  R(-1e7, 0, 2e7, 64, '#4a4d55');
  const x0 = Math.floor(worldX(0) / 8) * 8 - 8, x1 = worldX(960) + 8;
  for (let x = x0; x < x1; x += 8) { // cordilheira distante: altura por ruído suave, borda de cima iluminada
    const i = Math.floor(x / 8), a = Math.sin(i * 0.11) * 0.5 + Math.sin(i * 0.037 + 1.3) * 0.8 + hash(i, 91) * 0.25;
    const h = Math.max(8, Math.round(36 + a * 20));
    R(x, 0, 8, h, '#6a6e78'); R(x, h - 3, 8, 3, '#8d919b'); R(x, h - 3, 8, 1, '#a4a8b1');
    if (hash(i, 92) < 0.18) R(x + 2, h - 6, 4, 2, '#4f525a'); // sombra de pico
  }
  R(-1e7, 0, 2e7, 6, '#575a62');
  for (let k = -30; k < 40; k++) { // crateras ao longe, achatadas
    const cx = k * 140 + hash(k, 93) * 90, w = 30 + hash(k, 94) * 40;
    if (cx + w < x0 || cx > x1) continue;
    R(cx, 8 + hash(k, 95) * 6, w, 3, '#43464d'); R(cx + 3, 11 + hash(k, 95) * 6, w - 6, 1, '#7d818b');
  }
}

// cratera vista de lado e um pouco de cima: fundo escuro, parede de trás iluminada, borda da frente clara
function crater(x, y, w) {
  const h = Math.max(4, Math.round(w * 0.28));
  for (let r = 0; r < h; r++) {
    const t = (r + 0.5) / h, half = Math.round(w / 2 * Math.sqrt(1 - (2 * t - 1) ** 2));
    const c = t < 0.35 ? '#878a92' : t < 0.75 ? '#5c5f67' : '#6c6f77';
    R(x + w / 2 - half, y - r, half * 2, 1, c);
  }
  R(x + 2, y + 1, w - 4, 1, '#b5b8bf'); // borda da frente
}

// chão da frente (y < 0): crateras e pedras espalhadas; fica atrás da obra (desenhado no fundo)
export function moonGround() {
  const x0 = worldX(0) - 80, x1 = worldX(960) + 80, ylo = worldY(480) - 20;
  for (let k = -60; k < 80; k++) {
    const cx = k * 47 + hash(k, 96) * 34, cy = -24 - hash(k, 97) * 380, w = 22 + hash(k, 98) * 70;
    if (cx + w < x0 || cx > x1 || cy < ylo) continue;
    if (cx > -140 && cx < 140) continue; // não por baixo da torre
    crater(cx, cy, w);
  }
  for (let k = -120; k < 160; k++) { // pedrinhas
    const px = k * 31 + hash(k, 99) * 24, py = -6 - hash(k, 100) * 400;
    if (px < x0 || px > x1 || py < ylo) continue;
    R(px, py, 3, 2, '#6c6f77'); R(px, py + 2, 3, 1, '#b5b8bf');
  }
}

// a Terra no céu da Lua (tela): globo do PixelLab com um leve halo azul, no alto à esquerda (à direita ficam os poços)
export function moonEarth(W) {
  const t = art('terra');
  if (!t) return;
  const x = Math.round(Math.min(90, W * 0.06)), y = 100;
  ctx.fillStyle = 'rgba(110,180,255,.10)'; ctx.beginPath(); ctx.arc(x + t.width / 2, y + t.height / 2, t.width / 2 + 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(110,180,255,.12)'; ctx.beginPath(); ctx.arc(x + t.width / 2, y + t.height / 2, t.width / 2 + 4, 0, Math.PI * 2); ctx.fill();
  ctx.drawImage(t, x, y);
}
