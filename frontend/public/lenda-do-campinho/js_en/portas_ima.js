/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🚪 ÍMÃ DE PORTA (v341). O dono: "algumas dungeons só se entra na diagonal". As portas (casas, prédios, entradas
   das áreas de caça e dungeons) têm 1 quadrado de largura entre duas paredes; andando reto um pouquinho fora do
   centro, o corpo do personagem batia na quina e travava — só entrava quem vinha na diagonal (o ângulo escorregava).
   Teste: chegando 0,3 quadrado de lado, travava em 151 de 197 portas.
   Agora, andando NA DIREÇÃO de uma porta e já perto dela, o personagem se alinha sozinho com a abertura.
   Vale para teclado e joystick no modo livre (no modo quadradinho o personagem já anda no centro dos quadrados).
   Carregar no fim.
   ============================================================ */
(function () {
  const VEL = 0.005; // quadrados por ms de alinhamento (~5 por segundo: suave, mas rápido o bastante)
  function imaPorta(dt) {
    const p = G.p; if (!p || !G.mapa || !G.rodando || G.pausado || (typeof GRADE !== 'undefined' && GRADE.on)) return;
    let ix = 0, iy = 0; const v = dirTeclas(); ix += v[0]; iy += v[1]; if (G.joy) { ix = G.joy.x; iy = G.joy.y; }
    if (!ix && !iy) return;
    const r = p.r || R_ENT;
    for (const sd of G.mapa.saidas) {
      const cx = sd.x + 0.5, cy = sd.y + 0.5, dx = cx - p.x, dy = cy - p.y;
      if (Math.abs(dx) > 1.7 || Math.abs(dy) > 1.7) continue;
      const vertical = tileBloq(sd.x - 1, sd.y) && tileBloq(sd.x + 1, sd.y), horizontal = tileBloq(sd.x, sd.y - 1) && tileBloq(sd.x, sd.y + 1);
      if (vertical && Math.abs(dx) > 0.02 && Math.abs(dx) <= 0.95 && iy * dy > 0) { // entrando por cima/baixo: centraliza no x
        const nx = p.x + Math.sign(dx) * Math.min(Math.abs(dx), VEL * dt); if (!colide(nx, p.y, r)) p.x = nx; return;
      }
      if (horizontal && Math.abs(dy) > 0.02 && Math.abs(dy) <= 0.95 && ix * dx > 0) { // entrando pelo lado: centraliza no y
        const ny = p.y + Math.sign(dy) * Math.min(Math.abs(dy), VEL * dt); if (!colide(p.x, ny, r)) p.y = ny; return;
      }
    }
  }
  const _atualizaIma = atualiza;
  atualiza = function (dt) { try { imaPorta(dt || 16); } catch (e) { } return _atualizaIma.apply(this, arguments); };
})();
