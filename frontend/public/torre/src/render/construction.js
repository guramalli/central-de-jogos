// Obra Viva — montagem física do andar em obra (modo bloco a bloco).
// O progresso 0..1 do andar vem do motor (S.floors); aqui ele só vira imagem:
// estrutura → paredes → janelas → acabamento. Nada aqui altera a economia.
import { FH, SLAB, TW, TL } from '../data/constants.js';

// Marcos ajustáveis: fim de cada etapa, em fração do andar
export const PHASES = [
  { id: 'estrutura', n: 'Estrutura', end: 0.25 },
  { id: 'paredes', n: 'Paredes', end: 0.70 },
  { id: 'janelas', n: 'Janelas', end: 0.95 },
  { id: 'acabamento', n: 'Acabamento', end: 1 },
];

// Etapa do progresso p: { i, id, n, f } (f = 0..1 dentro da etapa)
export function phaseAt(p) {
  p = Math.min(1, Math.max(0, p));
  let a = 0;
  for (let i = 0; i < PHASES.length; i++) {
    const b = PHASES[i].end;
    if (p < b || i === PHASES.length - 1) return { i, id: PHASES[i].id, n: PHASES[i].n, f: b > a ? Math.min(1, (p - a) / (b - a)) : 1 };
    a = b;
  }
}

// Peças em posições fixas (x relativo à borda esquerda da torre)
export const COLS = [0, 58, 117, 176, 234];          // pilares, 6 de largura
export const WIN_X = [12, 72, 132, 192];
export const WIN_W = 36, WIN_Y = 22, WIN_H = 48;
const COL_W = 6, BEAM_H = 6;

// tijolos 20×11 fora dos vãos das janelas, em ordem de assentamento (de baixo para cima)
export const BRICKS = [];
for (let row = 0; row < 8; row++) for (let col = 0; col < 12; col++) {
  const x = col * 20 + 10, y = SLAB + row * 11 + 5;
  const inWin = WIN_X.some(wx => x > wx && x < wx + WIN_W) && y > WIN_Y && y < WIN_Y + WIN_H;
  if (!inWin) BRICKS.push({ x: col * 20, y: SLAB + row * 11 });
}

const PANES = WIN_X.length * 2;   // cada janela: caixilho, depois vidro
const FINISH = 4;                  // passadas de acabamento

// Quantas peças existem até o fim de cada etapa (para contar "peça nova" e soltar poeira/som)
export const UNITS = [COLS.length + 1, BRICKS.length, PANES, FINISH];

// Estado da montagem no progresso p: o que está pronto, qual peça é a próxima e onde fica
export function buildState(p) {
  const ph = phaseAt(p), f = ph.f;
  const st = { phase: ph, cols: 0, beam: 0, colGrow: 0, bricks: 0, panes: 0, finish: 0, unit: 0, target: 0, frac: 0 };
  const nc = COLS.length;
  if (ph.i === 0) {
    const u = f * (nc + 1);
    st.cols = Math.min(nc, Math.floor(u)); st.colGrow = st.cols < nc ? u - st.cols : 0;
    st.beam = st.cols >= nc ? u - nc : 0;
    st.unit = Math.floor(u); st.frac = u - Math.floor(u);
    st.target = st.cols < nc ? COLS[st.cols] + COL_W / 2 : TW * Math.min(1, st.beam);
  } else {
    st.cols = nc; st.beam = 1;
    const before = UNITS[0];
    if (ph.i === 1) {
      const u = f * BRICKS.length;
      st.bricks = Math.floor(u); st.frac = u - st.bricks;
      st.unit = before + st.bricks;
      const b = BRICKS[Math.min(st.bricks, BRICKS.length - 1)]; st.target = b.x + 10;
    } else {
      st.bricks = BRICKS.length;
      if (ph.i === 2) {
        const u = f * PANES;
        st.panes = Math.floor(u); st.frac = u - st.panes;
        st.unit = before + BRICKS.length + st.panes;
        st.target = WIN_X[Math.min(WIN_X.length - 1, Math.floor(st.panes / 2))] + WIN_W / 2;
      } else {
        st.panes = PANES;
        const u = f * FINISH;
        st.finish = f; st.frac = u - Math.floor(u);
        st.unit = before + BRICKS.length + PANES + Math.floor(u);
        st.target = TW * f;
      }
    }
  }
  return st;
}

// Desenha o andar em obra com base em y0. R: função de retângulo em mundo; s: paleta da era; lvl: detalhe
export function drawBuild(R, y0, st, s, lvl) {
  const base = y0 + SLAB, top = y0 + FH;
  // tijolos (atrás dos pilares)
  for (let k = 0; k < st.bricks; k++) {
    const b = BRICKS[k], x = TL + b.x, y = y0 + b.y;
    R(x, y, 20, 11, s.line); R(x, y + 1, 19, 10, s.brick);
    if (lvl >= 3) R(x, y + 10, 19, 1, s.hi);
  }
  // janelas: caixilho e depois vidro, uma de cada vez
  for (let w = 0; w < WIN_X.length; w++) {
    const frame = st.panes > w * 2, glass = st.panes > w * 2 + 1;
    if (!frame) continue;
    const wx = TL + WIN_X[w], wy = y0 + WIN_Y;
    R(wx - 3, wy - 3, WIN_W + 6, WIN_H + 6, s.frame);
    if (lvl >= 2) R(wx - 5, wy - 5, WIN_W + 10, 3, s.hi);
    R(wx, wy, WIN_W, WIN_H, glass ? s.glass : 'rgba(20,22,30,.55)');
    if (glass && lvl >= 3) { R(wx + 5, wy + 18, 4, 24, 'rgba(255,255,255,.22)'); R(wx + 17, wy, 2, WIN_H, s.frame); R(wx, wy + 22, WIN_W, 2, s.frame); }
  }
  // pilares (sobem um por um) e viga
  for (let c = 0; c < COLS.length; c++) {
    const g = c < st.cols ? 1 : c === st.cols ? st.colGrow : 0;
    if (g <= 0) continue;
    const h = Math.max(2, Math.round((FH - SLAB) * g));
    R(TL + COLS[c], base, COL_W, h, s.frame);
    if (lvl >= 2) R(TL + COLS[c] + 1, base, 1, h, s.hi);
  }
  if (st.beam > 0) R(TL, top - BEAM_H, TW * Math.min(1, st.beam), BEAM_H, s.frame);
  // acabamento: faixa de reboco/pintura varrendo da esquerda para a direita
  if (st.finish > 0) {
    const w = TW * st.finish;
    R(TL, base, w, 2, s.hi); R(TL, top - BEAM_H - 2, w, 2, s.hi);
    if (lvl >= 2) R(TL, base, 3, FH - SLAB, s.edge);
    if (st.finish < 1) R(TL + w - 2, base, 3, FH - SLAB, 'rgba(255,255,255,.35)');
  }
}

// Posição (x de mundo) do canto de trabalho atual
export const workX = st => TL + st.target;
