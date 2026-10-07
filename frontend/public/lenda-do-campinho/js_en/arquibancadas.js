/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🏟️ ARQUIBANCADAS VIRADAS PARA O CAMPO (v227)
   O desenho da arquibancada só existia de frente (virada para baixo): as de baixo do campo
   ficavam de costas para o jogo e as das laterais também. Agora cada uma olha para o campo:
   em cima = de frente, embaixo = de costas (arquibancada_costas), laterais = de lado (arquibancada_lado,
   espelhada do lado direito). O campo de referência é o maior campo do mapa.
   ============================================================ */
{
  const lado = (m, x, y) => {
    const c = (m.campos || []).slice().sort((a, b) => b.w * b.h - a.w * a.h)[0]; if (!c) return 'frente';
    if (y < c.y) return 'frente';
    if (y >= c.y + c.h) return 'costas';
    if (x < c.x) return 'dir';          // à esquerda do campo: olha para a direita
    if (x >= c.x + c.w) return 'esq';   // à direita do campo: olha para a esquerda
    return 'frente';
  };
  const _desenhaObjArq = desenhaObj;
  desenhaObj = function (ctx, o, x, y) {
    if (o.t !== 'arquibancada' || !G.mapa) return _desenhaObjArq.apply(this, arguments);
    if (!o._dir) o._dir = lado(G.mapa, x, y);
    if (o._dir === 'frente') return _desenhaObjArq.apply(this, arguments);
    const im = aSprite(o._dir === 'costas' ? 'arquibancada_costas' : 'arquibancada_lado');
    if (!im) return _desenhaObjArq.apply(this, arguments); // ainda carregando: desenha a de sempre
    const cx = (x + 0.5) * T, base = (y + 0.94) * T;
    let w, h;
    if (o._dir === 'costas') { w = OBJ_INFO.arquibancada.w * T; h = w * im.height / im.width; }
    else { h = 1.3 * T; w = h * im.width / im.height; }
    if (o._dir === 'esq') { ctx.save(); ctx.translate(cx, 0); ctx.scale(-1, 1); ctx.drawImage(im, -w / 2, base - h, w, h); ctx.restore(); }
    else ctx.drawImage(im, cx - w / 2, base - h, w, h);
  };
}
