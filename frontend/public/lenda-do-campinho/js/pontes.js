/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🌉 PONTES (v289): as ruas que atravessam rios ganham uma PONTE de verdade, no estilo de cada cidade:
   Cairo (arenito com leões, no Nilo), Tóquio (madeira vermelha), Munique (pedra com floreiras, no Isar),
   Paris (lampiões dourados, no Sena) e Londres (grades azuis, no Tâmisa).
   A ponte é pintada no CHÃO (os personagens andam por cima dela, como numa rua); os parapeitos e os
   arcos ficam sobre a água, que já não deixa passar. As pontes são achadas sozinhas: rua de asfalto
   com água dos dois lados.
   Carregar NO FIM.
   ============================================================ */
{
  // o tabuleiro (a parte onde se anda) de cada arte: fração da imagem [início, fim]
  const PONTE_ARTE = {
    cairo: { spr: 'ponte_cairo', eixo: 'h', fx: [0.157, 0.843], fy: [0.22, 0.56] },
    toquio: { spr: 'ponte_toquio', eixo: 'h', fx: [0.1516, 0.8484], fy: [0.25, 0.58] },
    munique: { spr: 'ponte_munique', eixo: 'h', fx: [0.0941, 0.9059], fy: [0.26, 0.57] },
    paris: { spr: 'ponte_paris', eixo: 'v', fx: [0.21, 0.79], fy: [0, 1] },
    londres: { spr: 'ponte_londres', eixo: 'v', fx: [0.225, 0.82], fy: [0, 1] },
  };
  for (const d of Object.values(PONTE_ARTE)) if (!ASSET_SET.has(d.spr)) { ASSETS.push(d.spr); ASSET_SET.add(d.spr); }

  // acha as pontes: pedaços de asfalto com água dos dois lados (h = a rua cruza um rio "em pé"; v = um rio "deitado")
  function achaPontes(m) {
    const W = m.w, H = m.h, A = CH.AGUA, R = CH.ASFALTO, ch = (x, y) => m.chao[y * W + x], marca = new Uint8Array(W * H), res = [];
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      if (ch(x, y) !== R) continue;
      let a = y, b = y; while (a > 0 && ch(x, a - 1) === R) a--; while (b < H - 1 && ch(x, b + 1) === R) b++;
      if (b - a <= 6 && ch(x, a - 1) === A && ch(x, b + 1) === A) { marca[y * W + x] = 1; continue; }
      let l = x, r = x; while (l > 0 && ch(l - 1, y) === R) l--; while (r < W - 1 && ch(r + 1, y) === R) r++;
      if (r - l <= 6 && ch(l - 1, y) === A && ch(r + 1, y) === A) marca[y * W + x] = 2;
    }
    const vis = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) if (marca[i] && !vis[i]) {
      const f = [i], o = marca[i]; vis[i] = 1; let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, n = 0;
      while (f.length) { const k = f.pop(), x = k % W, y = (k / W) | 0; n++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = (y + dy) * W + x + dx; if (marca[q] === o && !vis[q]) { vis[q] = 1; f.push(q); } } }
      if (n >= 6) res.push({ eixo: o === 1 ? 'h' : 'v', x0, x1, y0, y1 });
    }
    return res;
  }
  // onde a arte vai (em quadros): o tabuleiro cobre a rua sobre o rio + 1 quadro de margem (h) / o cais dos dois lados (v)
  function encaixa(p, d) {
    const im = aSprite(d.spr); if (!im) return null;
    const alvo = p.eixo === 'h' ? { x: p.x0 - 1, y: p.y0, w: p.x1 - p.x0 + 3, h: p.y1 - p.y0 + 1 } : { x: p.x0, y: p.y0 - 2, w: p.x1 - p.x0 + 1, h: p.y1 - p.y0 + 5 };
    const sx = alvo.w * T / ((d.fx[1] - d.fx[0]) * im.width), sy = alvo.h * T / ((d.fy[1] - d.fy[0]) * im.height);
    return { im, x: alvo.x * T - d.fx[0] * im.width * sx, y: alvo.y * T - d.fy[0] * im.height * sy, w: im.width * sx, h: im.height * sy };
  }
  // as cabeceiras da ponte ficam livres: enfeite em cima sai, placa vai um pouco para o lado
  function limpaCabeceiras(m, p) {
    const W = m.w, fixo = new Set(['placa', 'x', 'gol', 'grafite', 'grade']);
    const fileiras = p.eixo === 'h' ? [p.y0 - 2, p.y0 - 1, p.y1 + 1, p.y1 + 2] : [];
    for (const y of fileiras) for (let x = p.x0 - 3; x <= p.x1 + 3; x++) {
      const i = y * W + x, o = m.obj[i]; if (!o || o.predio || m.chao[i] === CH.AGUA) continue;
      if (!fixo.has(o.t)) { m.obj[i] = null; continue; }
      if (o.t !== 'placa') continue;
      const pl = (m.placas || []).find(k => k.x === x && k.y === y); const lado = x < (p.x0 + p.x1) / 2 ? -1 : 1;
      for (let d = 1; d < 6; d++) {
        const nx = (lado < 0 ? p.x0 - 3 : p.x1 + 3) + lado * d, j = y * W + nx;
        if (nx < 2 || nx >= W - 2 || m.obj[j] || m.chao[j] === CH.AGUA || m.saidas.some(s => s.x === nx && s.y === y) || m.npcs.some(n => n.x === nx && n.y === y)) continue;
        m.obj[j] = o; m.obj[i] = null; if (pl) pl.x = nx; break;
      }
    }
  }
  for (const id of Object.keys(PONTE_ARTE)) {
    const base = MAPAS_DEF[id]; if (!base) continue;
    MAPAS_DEF[id] = function () {
      const m = base.apply(this, arguments);
      try { const d = PONTE_ARTE[id]; m.pontes = achaPontes(m).filter(p => p.eixo === d.eixo).map(p => Object.assign(p, { arte: id })); m.pontes.forEach(p => limpaCabeceiras(m, p)); if (m.pontes.length) spr(d.spr); /* já começa a carregar a arte */ } catch (e) { console.error('pontes', e); }
      return m;
    };
  }
  // pinta as pontes no chão já desenhado (uma vez por desenho do chão; espera a arte carregar)
  const _chaoPonte = renderChao;
  renderChao = function (m) {
    const c = _chaoPonte.apply(this, arguments);
    if (m && m.pontes && m.pontes.length && c && m._pontesEm !== c) {
      const x = c.getContext && c.getContext('2d'); let todas = !!x; const sem = new Set(), des = [];
      if (x) for (const p of m.pontes) {
        const r = encaixa(p, PONTE_ARTE[p.arte]); if (!r) { todas = false; continue; }
        x.drawImage(r.im, r.x, r.y, r.w, r.h); des.push(r);
        for (let j = Math.floor(r.y / T); j < Math.ceil((r.y + r.h) / T); j++) for (let i = Math.floor(r.x / T); i < Math.ceil((r.x + r.w) / T); i++) sem.add(j * m.w + i);
      }
      if (todas) { m._pontesEm = c; m._semBrilho = sem; m._pontesDes = des; }
    }
    return c;
  };
  // as ondas e a espuma da beira do rio são desenhadas a cada quadro: a ponte vai de novo por cima delas
  if (typeof desenhaOndas === 'function') {
    const _ondasPonte = desenhaOndas;
    desenhaOndas = function (ctx, sx, sy, sw, sh) {
      const r = _ondasPonte.apply(this, arguments);
      const m = G.mapa; if (m && m._pontesDes && m._pontesEm) for (const p of m._pontesDes) if (p.x < sx + sw && p.x + p.w > sx && p.y < sy + sh && p.y + p.h > sy) ctx.drawImage(p.im, p.x, p.y, p.w, p.h);
      return r;
    };
  }
  // o brilho da água não passa por cima da ponte
  if (typeof drawAguaBrilho === 'function') {
    const _brilhoPonte = drawAguaBrilho;
    drawAguaBrilho = function (ctx, x, y) { const m = G.mapa; if (m && m._semBrilho && m._semBrilho.has(y * m.w + x)) return; return _brilhoPonte.apply(this, arguments); };
  }
}
