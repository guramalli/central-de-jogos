/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   VENTO: o mapa respira
   - árvores, coqueiros e arbustos balançam de leve (a base fica parada,
     a copa vai e volta); as rajadas passam como uma onda pelo mapa;
   - de vez em quando cai uma folha das árvores que estão na tela;
   - sombras de nuvens passam devagar pelo chão nos dias de sol.
   Chuva/tempestade = vento mais forte. Dentro de casa: nada disso.
   Carregar no FIM (depois de game.js e clima.js).
   ============================================================ */
const VENTO = { on: true, folhas: [], visiveis: [], ultimo: 0, nuvens: null };
const VENTO_AMP = { arvore: 0.065, mangueira: 0.06, coqueiro: 0.1, coqueiro2: 0.1, arbusto: 0.05, guarda_sol: 0.022 };
const VENTO_FOLHA = new Set(['arvore', 'mangueira', 'arbusto']);

function forcaVento() {
  const t = G.climaCache && G.climaCache.tempo;
  return t === 'tempestade' ? 2.6 : t === 'areia' ? 2 : t === 'chuva' ? 1.7 : t === 'neve' ? 1.2 : 1;
}
// rajada: sobe e desce devagar; a onda anda da esquerda para a direita pelo mapa
function rajadaVento(x, t) { return 0.55 + 0.45 * Math.sin(t / 4300 - x * 0.04) * Math.sin(t / 2700 + 1.3); }
function balancoVento(x, y, t) {
  const r = rajadaVento(x, t);
  return (0.35 * r + Math.sin(t / 1300 - x * 0.35 + y * 0.12) * 0.5 * r + Math.sin(t / 530 + x * 1.7 + y) * 0.15);
}

const _desenhaObjVento = desenhaObj;
desenhaObj = function (ctx, o, x, y) {
  const amp = VENTO_AMP[o.t];
  if (!amp || !VENTO.on || !G.mapa || G.mapa.interior) return _desenhaObjVento(ctx, o, x, y);
  if (VENTO_FOLHA.has(o.t) && VENTO.visiveis.length < 40) VENTO.visiveis.push(o.t === 'arbusto' ? { x, y, h: 0.8 } : { x, y, h: 2.1 });
  const k = amp * forcaVento() * balancoVento(x, y, G.agora);
  const base = (y + 0.94) * T;
  ctx.save(); ctx.transform(1, 0, k, 1, -k * base, 0); // inclina: a base fica, o topo vai
  _desenhaObjVento(ctx, o, x, y);
  ctx.restore();
};

/* ---------- folhas caindo das árvores ---------- */
function corFolha() {
  const c = G.climaCache; const r = Math.random();
  if (c && c.estacao === 'Outono') return ['#e07a2a', '#c8502a', '#e8b030'][(r * 3) | 0];
  return r < 0.8 ? ['#4f9a3a', '#6bb04a', '#3d7f30'][(r * 3.75) | 0] : '#c8b040';
}
function atualizaFolhas(dt) {
  const f = forcaVento(), t = G.agora;
  // cai mais folha nas rajadas; no máximo ~1 a cada segundo na tela
  if (VENTO.visiveis.length && VENTO.folhas.length < 22 && Math.random() < dt / 1000 * 0.9 * f * rajadaVento(0, t)) {
    const a = VENTO.visiveis[(Math.random() * VENTO.visiveis.length) | 0];
    const topo = (a.y + 0.94 - a.h * 0.75) * T;
    VENTO.folhas.push({ x: (a.x + 0.5 + (Math.random() - 0.5) * a.h * 0.6) * T, y: topo + Math.random() * a.h * 0.3 * T, chao: (a.y + 0.9 + Math.random() * 0.8) * T, fase: Math.random() * 6, giro: 0.002 + Math.random() * 0.003, tam: 0.07 + Math.random() * 0.04, cor: corFolha(), pousou: 0 });
  }
  const k = dt / 1000;
  for (const l of VENTO.folhas) {
    if (l.pousou) { l.pousou += dt; continue; }
    l.fase += l.giro * dt;
    l.x += (Math.sin(l.fase) * 0.9 + 0.5 * f) * T * k;
    l.y += (0.45 + Math.cos(l.fase * 2) * 0.12) * T * k;
    if (l.y >= l.chao) l.pousou = 1;
  }
  VENTO.folhas = VENTO.folhas.filter(l => l.pousou < 2500); // pousada no chão, some devagar
}
function desenhaFolhas(ctx) {
  for (const l of VENTO.folhas) {
    const a = l.pousou ? 1 - l.pousou / 2500 : 1;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(l.x, l.y); ctx.rotate(l.pousou ? 0.4 : Math.sin(l.fase) * 0.9);
    ctx.fillStyle = l.cor; ctx.beginPath(); ctx.ellipse(0, 0, l.tam * T, l.tam * T * 0.5, 0, 0, 7); ctx.fill();
    ctx.restore();
  }
}

/* ---------- sombras de nuvens ---------- */
function blocoNuvem(seed) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
  let s = seed * 9301 + 49297; const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 7; i++) {
    const cx = 50 + r() * 156, cy = 44 + r() * 40, rad = 26 + r() * 30;
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad); g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, rad, 0, 7); x.fill();
  }
  return c;
}
function desenhaSombrasNuvens(ctx, cam, vw, vh) {
  const c = G.climaCache; const tempo = c && c.tempo;
  if (!(tempo === 'sol' || tempo === 'calor' || tempo === 'nublado')) return;
  const h = G.save ? G.save.hora : 12 * 60; // some de manhã cedo e no fim da tarde
  const luz = Math.max(0, Math.min(1, (h - 6.5 * 60) / 60, (18 * 60 - h) / 60)); if (luz <= 0) return;
  if (!VENTO.nuvens) VENTO.nuvens = [0, 1, 2].map(blocoNuvem);
  const m = G.mapa, W = m.w * T, H = m.h * T;
  const n = Math.max(3, Math.round(m.w * m.h / 260)); const larg = 9 * T, alt = 4.5 * T;
  ctx.save(); ctx.globalAlpha = (tempo === 'nublado' ? 0.14 : 0.22) * luz;
  for (let i = 0; i < n; i++) {
    const vel = (0.28 + (i % 3) * 0.06) * T; // tiles por segundo
    const volta = W + larg * 2; const x = ((hash2(i, 7) * volta + G.agora / 1000 * vel) % volta) - larg;
    const y = hash2(3, i) * (H + alt) - alt + Math.sin(G.agora / 20000 + i) * T;
    if (x > cam.x + vw || x + larg < cam.x || y > cam.y + vh || y + alt < cam.y) continue;
    ctx.drawImage(VENTO.nuvens[i % 3], x, y, larg, alt);
  }
  ctx.restore();
}

const _desenhaNoiteVento = desenhaNoite;
desenhaNoite = function (ctx, cam, vw, vh, x0, y0, x1, y1) {
  if (VENTO.mapa !== G.mapa) { VENTO.mapa = G.mapa; VENTO.folhas.length = 0; }
  if (VENTO.on && G.mapa && !G.mapa.interior) {
    const dt = Math.min(100, Math.max(0, G.agora - (VENTO.ultimo || G.agora))); VENTO.ultimo = G.agora;
    atualizaFolhas(dt); desenhaFolhas(ctx);
    desenhaSombrasNuvens(ctx, cam, vw, vh);
  } else VENTO.folhas.length = 0;
  VENTO.visiveis.length = 0;
  return _desenhaNoiteVento(ctx, cam, vw, vh, x0, y0, x1, y1);
};
