/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   LANCES DO ATAQUE AUTOMÁTICO (só visual; o dano continua em game.js)
   Antes os dois davam um "tranco" um no outro. Agora parece futebol:
   - seu drible comum: GINGA — o corpo balança pra um lado, a bola
     passa do lado do marcador e volta (alterna esquerda/direita);
   - quem foi driblado PERDE O EQUILÍBRIO (balança) em vez de tremer
     e ser empurrado;
   - ataque do adversário: tenta o DESARME esticando a perna na bola;
   - chute automático: um chutinho com a perna (como o chute colocado).
   Carregar DEPOIS de jogadas.js e montarias.js (usa spriteChute/anguloChute).
   ============================================================ */
const LANCE_DUR = { ginga: 430, chute: 420, bote: 380, equilibrio: 520 };

// ---------- quando acontecem ----------
const _ataqueAutoL = ataqueAutomatico;
ataqueAutomatico = function () {
  const a = G.alvo, antes = G.cdAtaque, modo = G.modo;
  G.semEmpurrao = modo === 'drible';
  try { _ataqueAutoL(); } finally { G.semEmpurrao = false; }
  if (G.cdAtaque === antes || !a) return; // não atacou agora
  const p = G.p; p.golpe = 0; // sem o "tranco" pra frente
  let dx = a.x - p.x, dy = a.y - p.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
  G.lanceLado = -(G.lanceLado || 1); // alterna o lado da ginga
  G.lance = { tipo: modo === 'drible' ? 'ginga' : 'chute', t0: G.agora, dx, dy, lado: G.lanceLado };
  if (modo === 'drible' && G.mons.includes(a)) { a.equilibrio = G.agora; a.equilibrioLado = G.lanceLado; }
};
const _monstroAtacaL = monstroAtaca;
monstroAtaca = function (m) {
  _monstroAtacaL(m);
  m.golpe = 0; m.bote = G.agora; // tentativa de desarme em vez do tranco
};
const _recebeDanoL = recebeDano;
recebeDano = function (dano, m) {
  const r = _recebeDanoL(dano, m);
  if (G.p.hitT === G.agora) { G.p.equilibrio = G.agora; G.p.equilibrioLado = m && m.x > G.p.x ? -1 : 1; }
  return r;
};

// ---------- desenho ----------
const humanoL = e => { const look = e === G.p ? lookJogador() : e.d && e.d.look; return !!look && (!look.tipo || look.tipo === 'humano'); };
// desenha a entidade trocando o sprite de lado pela perna esticada (ângulo em radianos)
function desenhaComPerna(ctx, e, ang, inner) {
  const g = { mov: e.mov, vista: e.vista, tVista: e.tVista, golpe: e.golpe, hitT: e.hitT }, orig = spriteBoneco;
  e.mov = false; e.vista = 'lado'; e.tVista = G.agora; e.golpe = 0; e.hitT = 0;
  spriteBoneco = function (look, vista, q) { const s = orig(look, vista, q); return vista === 'lado' && s && s.c ? { c: spriteChute(s.c, ang) } : s; };
  try { inner(ctx, e); } finally { spriteBoneco = orig; Object.assign(e, g); }
}
const _desenhaEntL = desenhaEnt;
desenhaEnt = function (ctx, e) {
  // jogada especial em andamento ou montado: fica como está
  if (e === G.p && (G.jogada || (typeof montadoAgora === 'function' && montadoAgora()))) return _desenhaEntL(ctx, e);
  if (typeof spriteChute !== 'function' || !humanoL(e)) return _desenhaEntL(ctx, e);
  const x = e.x * T, y = e.y * T;
  ctx.save();
  // perdeu o equilíbrio (driblado / levou o desarme): balança no pé, sem tremer
  const eq = e.equilibrio != null ? (G.agora - e.equilibrio) / LANCE_DUR.equilibrio : 2;
  let hitGuard = null;
  if (eq < 1) {
    const ang = Math.sin(eq * Math.PI * 3) * 0.2 * (1 - eq) * (e.equilibrioLado || 1);
    ctx.translate(x, y); ctx.rotate(ang); ctx.translate(-x, -y);
    hitGuard = e.hitT; e.hitT = 0; // o tremido antigo sai
  }
  try {
    const L = e === G.p ? G.lance : null, kL = L ? (G.agora - L.t0) / LANCE_DUR[L.tipo] : 2;
    const kB = e.bote != null ? (G.agora - e.bote) / LANCE_DUR.bote : 2;
    if (L && kL < 1 && L.tipo === 'ginga') desenhaGinga(ctx, e, L, kL);
    else if (L && kL < 1 && L.tipo === 'chute') desenhaComPerna(ctx, e, anguloChute(Math.min(1, kL * 1.25)), _desenhaEntL);
    else if (kB < 1) { // desarme: inclina pra frente e estica a perna na bola
      const dir = G.p.x < e.x ? -1 : 1; e.flip = dir < 0;
      const s = Math.sin(kB * Math.PI);
      ctx.translate(dir * s * 5, 0);
      desenhaComPerna(ctx, e, -1.15 * s, _desenhaEntL);
    } else _desenhaEntL(ctx, e);
  } finally {
    ctx.restore();
    if (hitGuard != null) e.hitT = hitGuard;
  }
};
// ginga: corpo vai pro lado, perninhas mexem, a bola passa do lado do marcador e volta
function desenhaGinga(ctx, e, L, k) {
  const perp = { x: -L.dy * L.lado, y: L.dx * L.lado * 0.5 };
  const s = Math.sin(k * Math.PI);
  const g = { mov: e.mov, fase: e.fase, vista: e.vista, tVista: e.tVista, golpe: e.golpe };
  const flag = G.save.flags.pegou_bola; G.save.flags.pegou_bola = false; // a bola da ginga é desenhada aqui
  e.mov = true; e.fase = k * Math.PI * 2; e.vista = 'lado'; e.tVista = G.agora; e.golpe = 0;
  ctx.save(); ctx.translate(perp.x * s * 0.22 * T, perp.y * s * 0.3 * T); // o corpo vai pro lado da bola
  const meio = alturaEnt(e) * T * 0.5; ctx.translate(e.x * T, e.y * T - meio); ctx.rotate(L.lado * s * 0.12); ctx.translate(-e.x * T, -(e.y * T - meio)); // inclina na ginga
  try { _desenhaEntL(ctx, e); } finally { ctx.restore(); Object.assign(e, g); G.save.flags.pegou_bola = flag; }
  // a bola: do pé → passa pelo lado do marcador → volta pro pé (um "corte")
  const pe = { x: e.x + L.dx * 0.3, y: e.y + L.dy * 0.3 + 0.02 };
  const bx = pe.x + L.dx * 0.45 * s + perp.x * 0.55 * s, by = pe.y + L.dy * 0.45 * s + perp.y * 0.55 * s;
  ctx.fillStyle = 'rgba(30,20,40,0.22)'; ctx.beginPath(); ctx.ellipse(bx * T, by * T, 6, 2.5, 0, 0, 7); ctx.fill();
  desenhaBola(ctx, bx * T, by * T - 5, 6.5, k * 14 * L.lado);
  // rastrinho de movimento da bola
  if (k > 0.1 && k < 0.9) { ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bx * T, by * T - 5, 10, 0, Math.PI * 2 * 0.25); ctx.stroke(); }
}
