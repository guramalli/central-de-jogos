/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🦸👑 CAPA E COROA QUE ACOMPANHAM O BONECO (v391; dono: "arrume a animação da capa e da coroa ao virar o boneco")
   - COROA (Chamas Azuis / Auréola de Raios): era desenhada sempre no meio do quadradinho, parada, com um balanço próprio.
     Agora fica PRESA À CABEÇA: vira junto (espelha para a esquerda), acompanha o passo, a inclinação de lado, o chute e o
     tranco de quando apanha, e fica em cima do centro da cabeça de verdade em cada vista (de lado a cabeça não é o meio).
   - CAPA DO HERÓI: era um desenho parado. Agora balança a cada passo (de lado ela sobe para trás, como se ventasse; de
     frente e de costas, vai de um lado para o outro). Parado, fica caída.
   Carregar NO FIM (depois de luxo.js, adornos2.js e brilho_refino.js).
   ============================================================ */
{
  // ---------- capa: o quadro da caminhada que está sendo montado ----------
  let qCapa = 0;
  const _sbCapa = spriteBoneco;
  spriteBoneco = function (look, vista, q) {
    const ant = qCapa; qCapa = (q | 0) % 4;
    try { return _sbCapa.apply(this, arguments); } finally { qCapa = ant; }
  };
  const BALANCO = { l: [0, 0.16, 0.06, 0.16], f: [0, 0.06, 0, -0.06], c: [0, 0.07, 0, -0.07] };
  if (typeof desenhaCostasArte === 'function') {
    const _dcaCapa = desenhaCostasArte;
    desenhaCostasArte = function (x, k, v) {
      const ang = k === 'capa' ? (BALANCO[v] || BALANCO.f)[qCapa] : 0;
      if (!ang) return _dcaCapa.apply(this, arguments);
      // gira em volta do fecho: de lado o fecho fica no ombro (a capa sai para trás), de frente/costas no meio dos ombros
      const px = 50, py = v === 'l' ? 78 : 79;
      x.save(); x.translate(px, py); x.rotate(ang); x.translate(-px, -py);
      try { return _dcaCapa.apply(this, arguments); } finally { x.restore(); }
    };
  }

  // ---------- coroa: presa à cabeça ----------
  // o centro da cabeça no desenho: a média dos pixels do topo (o chapéu/capacete/cabelo), guardada por canvas
  const CAB = new WeakMap();
  function topoCabeca(c) {
    let r = CAB.get(c); if (r) return r; r = { x: c.width / 2 };
    try {
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, W = c.width;
      let ty = -1; for (let y = 0; y < c.height && ty < 0; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 120) { ty = y; break; }
      if (ty >= 0) {
        const fim = Math.min(c.height, ty + Math.round(c.height * 0.12)); let sx = 0, n = 0;
        for (let y = ty; y < fim; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 120) { sx += x; n++; }
        if (n) r = { x: sx / n };
      }
    } catch (e) { }
    CAB.set(c, r); return r;
  }
  // a mesma conta do desenho do boneco (game.js desenhaEnt): onde e como o corpo está neste instante
  function poseCorpo(e) {
    let vista = e.vista || 'frente';
    if (!e.mov && G.agora - (e.tVista || 0) > 2500) vista = 'frente';
    if (e.golpe && G.agora - e.golpe < 450) vista = 'lado';
    const quadro = e.mov ? Math.floor((e.fase || 0) / (Math.PI / 2)) % 4 : 0;
    const comp = spriteBoneco(lookJogador(), vista, quadro); if (!comp || !comp.c) return null;
    const h = alturaEnt(e) * T, w = h * comp.c.width / comp.c.height;
    const hit = e.hitT && G.agora - e.hitT < 180 ? Math.sin((G.agora - e.hitT) / 18) * 4 : 0;
    const golpe = e.golpe && G.agora - e.golpe < 220 ? Math.sin((G.agora - e.golpe) / 220 * Math.PI) : 0;
    const dir = e.flip ? -1 : 1, lado = e.mov && vista === 'lado', passo = Math.abs(Math.sin(e.fase || 0)), bob = e.mov ? passo * h * 0.03 : 0;
    const rot = lado ? dir * 0.04 : e.mov ? Math.sin(e.fase || 0) * 0.035 : 0;
    const sy = e.mov ? 1 - (1 - passo) * 0.02 : 1 + Math.sin(G.agora / 450 + (e.uid || 0)) * 0.012;
    return { comp, h, w, dir, sy, tx: e.x * T + hit + dir * golpe * 7, ty: e.y * T - bob, rot: rot + dir * golpe * 0.12 };
  }
  window.coroaNaCabeca = function (ctx, e, im, tipo, prancha, agora) {
    const P = poseCorpo(e); if (!P) return false;
    const wc = T * (tipo === 'chamas' ? 0.74 : 0.82), hc = wc * im.height / im.width, flut = Math.sin(agora / 420) * 1.6; // (flutua um pouquinho)
    const sobe = prancha ? T * 0.16 - Math.sin(agora / 350) * 1.5 : 0;
    const cx = -P.w / 2 + topoCabeca(P.comp.c).x * P.w / P.comp.c.width, topo = -P.h + flut;
    ctx.save(); ctx.translate(P.tx, P.ty - sobe); ctx.rotate(P.rot); ctx.scale(P.dir, P.sy);
    if (tipo === 'raios') ctx.globalAlpha *= 0.85 + 0.15 * Math.sin(agora / 70);
    ctx.drawImage(im, cx - wc / 2, topo - hc * (tipo === 'chamas' ? 0.42 : 0.38), wc, hc);
    ctx.restore(); return true;
  };
  window.CAPA_COROA = { topoCabeca, poseCorpo, BALANCO };
}
