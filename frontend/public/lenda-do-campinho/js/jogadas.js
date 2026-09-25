/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   LENDA DO CAMPINHO — JOGADAS ANIMADAS
   Cada drible vira uma jogada de verdade: a bola faz o movimento
   (pedalada, chapéu por cima da cabeça, caneta entre as pernas,
   elástico, embaixadinhas...) e o jogador acompanha (gingado,
   pulo, bicicleta). No chapéu e na caneta você PASSA pelo
   adversário e termina do outro lado. Só visual + posição final;
   o dano continua sendo calculado em usarDrible (game.js).
   Carregar DEPOIS de game.js (e de clima.js, que também envolve atualiza).
   ============================================================ */
const JOGADA_DUR = { pedalada: 750, chapeu: 900, elastico: 700, caneta: 850, chute_colocado: 600, voleio: 520, bicicleta: 750, tabela: 900, relampago: 800, respiro: 900, folego_campeao: 1100, arrancada: 600 };
const PERNAS_JOGADA = { pedalada: 3, relampago: 5 }; // ciclos de passo (4 quadros cada) durante a jogada
const jLerp = (a, b, k) => a + (b - a) * k;
// Chute colocado: ângulo da perna (radianos; + = pé pra trás, − = pé pra frente e pra cima)
// preparo rápido → batida → segura a finalização → volta
function anguloChute(k) {
  if (k < 0.12) return jLerp(0, 0.75, k / 0.12);
  if (k < 0.26) return jLerp(0.75, -1.25, (k - 0.12) / 0.14);
  if (k < 0.6) return jLerp(-1.25, -1.0, (k - 0.26) / 0.34);
  return jLerp(-1.0, 0, (k - 0.6) / 0.4);
}
// Monta o boneco chutando a partir do quadro de lado parado (pernas juntas):
// recorta a parte das pernas e desenha uma cópia girada no quadril por cima.
const PERNA_INFO = new WeakMap(); let CHUTE_CV = null;
function pernaDe(c) {
  let inf = PERNA_INFO.get(c); if (inf) return inf;
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, W = c.width;
  const linha = y => { let a = -1, b = -1; for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 128) { if (a < 0) a = x; b = x; } return [a, b]; };
  let fim = c.height - 1; while (fim > 0 && linha(fim)[0] < 0) fim--;
  let ini = 0; while (ini < fim && linha(ini)[0] < 0) ini++;
  const quadril = Math.round(fim - (fim - ini) * 0.175); const [a, b] = linha(quadril); // da barra do calção pra baixo
  inf = { quadril, fim, px: a >= 0 ? (a + b) / 2 : W / 2, py: quadril - 8 }; // gira no quadril (um pouco acima, dentro do calção)
  PERNA_INFO.set(c, inf); return inf;
}
function spriteChute(base, ang) {
  const p = pernaDe(base);
  if (!CHUTE_CV || CHUTE_CV.width !== base.width || CHUTE_CV.height !== base.height) CHUTE_CV = mkCanvas(base.width, base.height);
  const x = CHUTE_CV.getContext('2d'); x.clearRect(0, 0, base.width, base.height);
  x.drawImage(base, 0, 0); // corpo + perna de apoio
  const h = p.fim - p.quadril + 2;
  x.save(); x.translate(p.px, p.py); x.rotate(ang); x.translate(-p.px, -p.py);
  x.drawImage(base, 0, p.quadril, base.width, h, 0, p.quadril, base.width, h); // perna que chuta
  x.restore();
  return CHUTE_CV;
}
const jSuave = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;

function iniciaJogada(id) {
  const p = G.p; const a = G.alvo && G.mons.includes(G.alvo) ? G.alvo : null;
  const dur = JOGADA_DUR[id]; if (!dur) return;
  let dx = a ? a.x - p.x : (p.flip ? -1 : 1), dy = a ? a.y - p.y : 0; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
  const j = { id, t0: G.agora, dur, x0: p.x, y0: p.y, dx, dy, alvo: a, rastro: [] };
  // chapéu e caneta: você passa pelo adversário e termina do outro lado (se o chão estiver livre)
  if ((id === 'chapeu' || id === 'caneta') && a) {
    const fx = a.x + dx * 0.95, fy = a.y + dy * 0.95;
    if (!colide(fx, fy, R_ENT)) { j.fim = { x: fx, y: fy }; }
  }
  if (Math.abs(dx) > 0.2) p.flip = dx < 0;
  if (typeof olha === 'function') olha(p, dx, dy);
  G.caminho = null; G.acaoChegar = null; if (G.teclas && G.teclas.clear) G.teclas.clear();
  // os efeitos antigos desses dribles (giro/chapéu/elástico/caneta) brigavam com a jogada: saem; ficam o anel e o impacto
  G.fx = G.fx.filter(f => !(G.agora - f.t0 < 50 && ['giro', 'chapeu', 'elastico', 'caneta', 'vento'].includes(f.tipo)));
  G.jogada = j;
}

// posição da bola (em tiles) e altura (em tiles acima do chão) ao longo da jogada
function bolaDaJogada(j, k) {
  const p = G.p, a = j.alvo; const px = p.x, py = p.y; const lado = -j.dy, lx = j.dx; // perpendicular
  const pe = (dist = 0.32) => ({ x: px + j.dx * dist, y: py + j.dy * dist + 0.02 });
  switch (j.id) {
    case 'pedalada': { const b = pe(0.34); return { x: b.x + Math.sin(k * Math.PI * 4) * 0.04 * lado, y: b.y, h: 0, giro: k * 6 }; }
    case 'chapeu': {
      const ini = { x: j.x0 + j.dx * 0.3, y: j.y0 + j.dy * 0.3 }; const fim = j.fim || { x: (a ? a.x : j.x0 + j.dx) + j.dx * 0.9, y: (a ? a.y : j.y0) + j.dy * 0.9 };
      const kk = Math.min(1, k / 0.8); const alt = (a ? alturaEnt(a) : 1.5) + 0.35;
      return { x: jLerp(ini.x, fim.x, kk), y: jLerp(ini.y, fim.y, kk), h: Math.sin(kk * Math.PI) * alt, giro: k * 10 };
    }
    case 'elastico': { const b = pe(0.32); const s = k < 0.45 ? Math.sin(k / 0.45 * Math.PI / 2) : k < 0.6 ? 1 - (k - 0.45) / 0.15 * 2 : -1 + (k - 0.6) / 0.4; return { x: b.x + lado * 0.42 * s, y: b.y + lx * 0.42 * s * 0.4, h: 0, giro: k * 8 }; }
    case 'caneta': {
      const ini = { x: j.x0 + j.dx * 0.3, y: j.y0 + j.dy * 0.3 }; const fim = j.fim || { x: (a ? a.x : j.x0) + j.dx * 1.0, y: (a ? a.y : j.y0) + j.dy * 1.0 };
      const kk = Math.min(1, k / 0.55); return { x: jLerp(ini.x, fim.x, jSuave(kk)), y: jLerp(ini.y, fim.y, jSuave(kk)), h: 0, giro: k * 14 };
    }
    case 'tabela': { // vai para um "companheiro" imaginário ao lado e volta na frente
      const comp = { x: j.x0 + lado * 1.3 + j.dx * 0.5, y: j.y0 + lx * 1.3 * 0.5 + j.dy * 0.5 }; const volta = { x: j.x0 + j.dx * 0.9, y: j.y0 + j.dy * 0.9 };
      const ini = pe(0.3);
      return k < 0.45 ? { x: jLerp(ini.x, comp.x, k / 0.45), y: jLerp(ini.y, comp.y, k / 0.45), h: Math.sin(k / 0.45 * Math.PI) * 0.15, giro: k * 12 }
        : { x: jLerp(comp.x, volta.x, (k - 0.45) / 0.55), y: jLerp(comp.y, volta.y, (k - 0.45) / 0.55), h: Math.sin((k - 0.45) / 0.55 * Math.PI) * 0.15, giro: k * 12 };
    }
    case 'relampago': { const b = pe(0.35); return { x: b.x + Math.sin(k * Math.PI * 6) * 0.3 * lado, y: b.y + Math.cos(k * Math.PI * 6) * 0.12, h: 0, giro: k * 20 }; }
    case 'respiro': case 'folego_campeao': { const b = pe(0.2); const n = j.id === 'respiro' ? 3 : 4; return { x: b.x, y: b.y, h: Math.abs(Math.sin(k * Math.PI * n)) * 0.75, giro: k * 8 }; }
    case 'arrancada': { const b = pe(0.4 + k * 0.3); return { x: b.x, y: b.y, h: 0, giro: k * 16 }; }
    case 'voleio': case 'bicicleta': { const b = pe(0.1); const sobe = j.id === 'bicicleta' ? 1.4 : 0.9; return { x: b.x, y: b.y, h: Math.sin(Math.min(1, k / 0.5) * Math.PI / 2) * sobe * (k < 0.5 ? 1 : 0), giro: k * 10, some: k >= 0.5 }; }
    case 'chute_colocado': return { x: px, y: py, h: 0, some: true };
  }
  return null;
}
// deslocamento/pose do jogador (visual) — dx, dy em tiles, sobe em tiles, rot em radianos
function poseDaJogada(j, k) {
  const lado = -j.dy;
  switch (j.id) {
    case 'pedalada': return { ox: Math.sin(k * Math.PI * 4) * 0.08 * lado, oy: 0, sobe: Math.abs(Math.sin(k * Math.PI * 4)) * 0.03, rot: Math.sin(k * Math.PI * 4) * 0.04 };
    case 'elastico': return { ox: lado * 0.1 * Math.sin(k * Math.PI * 2), oy: 0, sobe: 0, rot: Math.sin(k * Math.PI * 2) * 0.15 };
    case 'relampago': return { ox: Math.sin(k * Math.PI * 6) * 0.25 * lado, oy: 0, sobe: 0.05, rot: 0, rastro: true };
    case 'voleio': return { ox: 0, oy: 0, sobe: Math.sin(Math.min(1, k / 0.6) * Math.PI) * 0.35, rot: k < 0.6 ? -0.2 : 0 };
    case 'bicicleta': { const kk = Math.min(1, k / 0.75); return { ox: 0, oy: 0, sobe: Math.sin(kk * Math.PI) * 0.9, rot: (G.p.flip ? 1 : -1) * kk * Math.PI * 2 }; }
    case 'chapeu': case 'caneta': return { ox: 0, oy: 0, sobe: j.id === 'chapeu' ? Math.sin(Math.min(1, k / 0.9) * Math.PI) * 0.18 : 0, rot: 0, rastro: true };
    case 'arrancada': return { ox: 0, oy: 0, sobe: 0, rot: (G.p.flip ? -1 : 1) * 0.12, rastro: true, poeira: true };
    case 'respiro': case 'folego_campeao': return { ox: 0, oy: 0, sobe: 0, rot: 0 };
    case 'tabela': return { ox: 0, oy: 0, sobe: 0, rot: 0 };
  }
  return { ox: 0, oy: 0, sobe: 0, rot: 0 };
}

/* ---------- ganchos ---------- */
const _usarDribleJ = usarDrible;
usarDrible = function (id) {
  const antes = G.cds[id];
  _usarDribleJ(id);
  if (G.cds[id] !== antes) iniciaJogada(id); // só anima se o drible foi usado de verdade
};
const _atualizaJ = atualiza;
atualiza = function (dt) {
  _atualizaJ(dt);
  const j = G.jogada; if (!j) return;
  const k = (G.agora - j.t0) / j.dur;
  if (j.fim) { // movimento real: passa pelo adversário
    const kk = jSuave(Math.min(1, k / (j.id === 'chapeu' ? 0.85 : 0.75)));
    const x = jLerp(j.x0, j.fim.x, kk), y = jLerp(j.y0, j.fim.y, kk);
    // dá a volta por fora do adversário (curva) em vez de atravessá-lo
    const curva = Math.sin(kk * Math.PI) * 0.55; G.p.x = x + -j.dy * curva; G.p.y = y + j.dx * curva * 0.6;
    G.p.mov = true; G.p.fase = (G.p.fase || 0) + dt * 0.02;
  }
  if (k >= 1) {
    if (j.fim && colide(G.p.x, G.p.y, R_ENT)) { G.p.x = j.fim.x; G.p.y = j.fim.y; }
    G.jogada = null;
  }
};
const _desenhaEntJ = desenhaEnt;
desenhaEnt = function (ctx, e) {
  const j = G.jogada;
  if (e !== G.p || !j) return _desenhaEntJ(ctx, e);
  const k = Math.min(1, (G.agora - j.t0) / j.dur);
  const pose = poseDaJogada(j, k);
  // rastros (imagens fantasma) nas jogadas rápidas
  if (pose.rastro) {
    const ult = j.rastro[j.rastro.length - 1];
    if (!ult || G.agora - ult.t >= 45) j.rastro.push({ x: e.x + pose.ox, y: e.y, t: G.agora }); // poucas cópias espaçadas (não vira borrão)
    j.rastro = j.rastro.filter(r => G.agora - r.t < 200).slice(-4);
    const flag = G.save.flags.pegou_bola; G.save.flags.pegou_bola = false;
    for (const r of j.rastro.slice(0, -1)) { ctx.save(); ctx.globalAlpha = 0.16 * (1 - (G.agora - r.t) / 200); ctx.translate((r.x - e.x) * T, (r.y - e.y) * T); _desenhaEntJ(ctx, e); ctx.restore(); }
    G.save.flags.pegou_bola = flag;
  }
  if (pose.poeira && Math.random() < 0.4) efeito('puff', e.x - (e.flip ? -1 : 1) * 0.3, e.y + 0.1, '#e8d8b0');
  // o jogador (sem a bola padrão) com gingado/pulo/giro
  const flag = G.save.flags.pegou_bola; G.save.flags.pegou_bola = false;
  ctx.save();
  const cx = (e.x + pose.ox) * T, base = e.y * T;
  ctx.translate(cx, base - pose.sobe * T);
  if (pose.rot) { const meio = alturaEnt(e) * T * 0.5; ctx.translate(0, -meio); ctx.rotate(pose.rot); ctx.translate(0, meio); }
  ctx.translate(-e.x * T, -e.y * T);
  // pedalada: as perninhas passam por cima da bola (quadros de passo bem rápidos, no lugar)
  const pernas = PERNAS_JOGADA[j.id];
  if (j.id === 'chute_colocado' && typeof spriteBoneco === 'function') {
    // chute: o boneco de lado, parado, e a perna da frente (direita) balança no quadril
    const g = { mov: e.mov, vista: e.vista, tVista: e.tVista, golpe: e.golpe }, orig = spriteBoneco;
    e.mov = false; e.vista = 'lado'; e.tVista = G.agora; e.golpe = 0;
    spriteBoneco = function (look, vista, q) { const s = orig(look, vista, q); return e === G.p && vista === 'lado' && s && s.c ? { c: spriteChute(s.c, anguloChute(k)) } : s; };
    try { _desenhaEntJ(ctx, e); } finally { spriteBoneco = orig; Object.assign(e, g); }
  } else if (pernas) {
    const g = { mov: e.mov, fase: e.fase, vista: e.vista, tVista: e.tVista, golpe: e.golpe };
    e.mov = true; e.fase = k * pernas * Math.PI * 2; e.vista = 'lado'; e.tVista = G.agora; e.golpe = 0;
    _desenhaEntJ(ctx, e);
    Object.assign(e, g);
  } else _desenhaEntJ(ctx, e);
  ctx.restore();
  G.save.flags.pegou_bola = flag;
  // a bola coreografada
  const b = bolaDaJogada(j, k);
  if (b && !b.some) {
    if (b.h > 0.05) { ctx.fillStyle = 'rgba(30,20,40,0.25)'; ctx.beginPath(); ctx.ellipse(b.x * T, b.y * T, 7 - Math.min(4, b.h * 3), 3, 0, 0, 7); ctx.fill(); } // sombra no chão
    desenhaBola(ctx, b.x * T, b.y * T - 5 - b.h * T, 6.5, b.giro || 0);
  }
  // traços de movimento das pernas na pedalada e no elástico
  if (j.id === 'pedalada' || j.id === 'elastico') {
    const fase = (k * (j.id === 'pedalada' ? 4 : 2)) % 1; ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - fase)})`; ctx.lineWidth = 2.5;
    const bx = (e.x + j.dx * 0.34) * T, by = e.y * T - 4; ctx.beginPath(); ctx.arc(bx, by, 10 + fase * 6, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  }
};
