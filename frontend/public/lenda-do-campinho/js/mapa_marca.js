/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   📍 SUA MARCA NO MAPA + VOCÊ EM DESTAQUE (v287)
   - No mapa grande (tecla M), um CLIQUE marca um lugar: aparece um pino TURQUESA no mapa e no minimapa,
     e uma SETA TURQUESA no jogo (igual à amarela do objetivo) te leva até lá. Clicar perto da marca tira;
     chegando lá, ela some sozinha. Botão "❌ Tirar marca" no mapa. Uma marca por vez (fica salva).
   - Você no minimapa e no mapa grande: seta maior, anel pulsando e "VOCÊ" escrito no mapa grande.
   Carregar DEPOIS de minimapa.js e game.js.
   ============================================================ */
const MARCA_COR = '#3ae8e0';
function marcaMapa() { const s = G.save; return s && s.marca && s.marca.mapa && MAPAS_DEF[s.marca.mapa] ? s.marca : null; }
function marcaMapaTira() { if (G.save && G.save.marca) { G.save.marca = null; log('📍 Marca tirada do mapa.', 'l-sis'); salvar(); } }
function marcaMapaToggle(mapa, x, y) {
  const s = G.save; if (!s) return; const m = marcaMapa();
  if (m && m.mapa === mapa && Math.hypot(m.x - x, m.y - y) < 2.2) return marcaMapaTira();
  s.marca = { mapa, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  log('📍 Lugar marcado! Siga a SETA TURQUESA até lá (no mapa grande, clique de novo na marca para tirar).', 'l-info'); som('toque'); salvar();
}
// a seta turquesa (igual à amarela, com outra cor)
function setaCor(ctx, ang, s, cor) {
  ctx.rotate(ang);
  ctx.fillStyle = cor; ctx.strokeStyle = '#0a2a3a'; ctx.lineWidth = 3.5 * s; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(18 * s, 0); ctx.lineTo(-4 * s, -16 * s); ctx.lineTo(-4 * s, -7 * s); ctx.lineTo(-20 * s, -7 * s); ctx.lineTo(-20 * s, 7 * s); ctx.lineTo(-4 * s, 7 * s); ctx.lineTo(-4 * s, 16 * s); ctx.closePath();
  ctx.fill(); ctx.stroke();
}
{
  const _guiaMarca = desenhaGuia;
  desenhaGuia = function (ctx, tela) {
    const r = _guiaMarca.apply(this, arguments);
    try {
      const mk = marcaMapa(); if (!mk || !G.mapa || mk.mapa !== G.mapa.id || G.mapa.interior && !G.mapa.caca) return r;
      if (Math.hypot(G.p.x - mk.x, G.p.y - mk.y) < 1.3) { G.save.marca = null; log('📍 Você chegou na sua marca!', 'l-info'); som('moeda'); salvar(); return r; }
      const t = tela(mk.x, mk.y - 0.9), s = G.dpr || 1, b = Math.sin(G.agora / 200 + 1) * 7 * s;
      const W = CV.width, H = CV.height, gm = G.guiaMg || {};
      const ml = (gm.l || 44) * s, mr = (gm.r || 44) * s, mt = (gm.t || 44) * s, mb = (gm.b || 44) * s;
      if (t.x > ml && t.x < W - mr && t.y > mt && t.y < H - mb) {
        // na tela: pino no chão + seta em cima
        const ch = tela(mk.x, mk.y);
        ctx.save(); ctx.strokeStyle = MARCA_COR; ctx.lineWidth = 3 * s; const k = 1 + 0.15 * Math.sin(G.agora / 250);
        ctx.beginPath(); ctx.ellipse(ch.x, ch.y, 18 * s * k, 7 * s * k, 0, 0, 7); ctx.stroke(); ctx.restore();
        ctx.save(); ctx.translate(t.x, t.y + b); setaCor(ctx, Math.PI / 2, s, MARCA_COR); ctx.restore();
      } else {
        const c = { x: (ml + W - mr) / 2, y: (mt + H - mb) / 2 }; const ang = Math.atan2(t.y - c.y, t.x - c.x);
        const ex = clamp(c.x + Math.cos(ang) * W, ml, W - mr), ey = clamp(c.y + Math.sin(ang) * H, mt, H - mb);
        ctx.save(); ctx.translate(ex - Math.cos(ang) * Math.abs(b), ey - Math.sin(ang) * Math.abs(b)); setaCor(ctx, ang, s, MARCA_COR); ctx.restore();
      }
    } catch (e) { }
    return r;
  };
  // minimapa e mapa grande: o pino da marca e VOCÊ em destaque
  const _marcFx = desenhaMarcadores;
  desenhaMarcadores = function (x, tx, ty, e, grande) {
    const r = _marcFx.apply(this, arguments);
    try {
      const t = G.agora || performance.now();
      const mk = marcaMapa();
      if (mk && G.mapa && mk.mapa === G.mapa.id) {
        const cx = tx(mk.x), cy = ty(mk.y), k = 1 + 0.2 * Math.sin(t / 220);
        x.save(); x.strokeStyle = MARCA_COR; x.lineWidth = 2.4 * e; x.beginPath(); x.arc(cx, cy, 7 * e * k, 0, 7); x.stroke();
        x.fillStyle = MARCA_COR; x.strokeStyle = '#0a2a3a'; x.lineWidth = 1.6 * e;
        x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx - 4.5 * e, cy - 9 * e); x.arc(cx, cy - 11 * e, 5 * e, Math.PI * 0.8, Math.PI * 2.2); x.closePath(); x.fill(); x.stroke();
        x.fillStyle = '#ffffff'; x.beginPath(); x.arc(cx, cy - 11 * e, 1.8 * e, 0, 7); x.fill(); x.restore();
        if (grande && typeof rotuloMini === 'function') rotuloMini(x, '📍 Sua marca', cx, cy - 20 * e, e * 0.9, '#b8fff8');
      }
      // você: anel pulsando + seta maior por cima (a de antes às vezes sumia no meio dos ícones)
      const p = G.p; if (!p) return r;
      const px = tx(p.x), py = ty(p.y), pul = 1 + 0.3 * Math.abs(Math.sin(t / 300));
      x.save();
      x.fillStyle = 'rgba(255,58,255,0.22)'; x.beginPath(); x.arc(px, py, 11 * e * pul, 0, 7); x.fill();
      x.strokeStyle = '#ffffff'; x.lineWidth = 2.2 * e; x.beginPath(); x.arc(px, py, 11 * e * pul, 0, 7); x.stroke();
      x.strokeStyle = '#ff3aff'; x.lineWidth = 1.4 * e; x.beginPath(); x.arc(px, py, 11 * e * pul + 2 * e, 0, 7); x.stroke();
      const vista = p.vista || 'frente', ang = vista === 'costas' ? -Math.PI / 2 : vista === 'frente' ? Math.PI / 2 : p.flip ? Math.PI : 0;
      x.translate(px, py); x.rotate(ang); const q = 1.5;
      x.fillStyle = '#ff3aff'; x.strokeStyle = '#ffffff'; x.lineWidth = 2.4 * e; x.beginPath(); x.moveTo(7 * e * q, 0); x.lineTo(-5 * e * q, -5.5 * e * q); x.lineTo(-2.5 * e * q, 0); x.lineTo(-5 * e * q, 5.5 * e * q); x.closePath(); x.fill(); x.stroke();
      x.restore();
      if (grande && typeof rotuloMini === 'function') rotuloMini(x, 'VOCÊ', px, py - 18 * e, e * 1.05, '#ffb8ff');
    } catch (err) { }
    return r;
  };
}
