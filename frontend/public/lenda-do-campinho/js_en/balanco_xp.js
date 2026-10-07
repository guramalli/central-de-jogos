/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ⚖️ XP DAS MISSÕES (v296): algumas missões davam 3, 4 e até 8 NÍVEIS de uma vez (o dono subiu do 185 para o
   189 com uma quest só). Agora, a partir do nível 20, o XP de cada missão tem um teto em "níveis" da faixa dela:
   - missão comum: no máximo 1,2 nível;
   - missão de chefão ou final de cidade/história: no máximo 2 níveis.
   Abaixo do nível 20 fica como era (no começo, subir rápido faz parte). O ouro e os itens não mudam.
   Carregar NO FIM (depois de todos os arquivos que criam missões).
   ============================================================ */
{
  const NIVEL_MIN = 20, TETO_COMUM = 1.2, TETO_GRANDE = 2.0;
  const xpNivel = L => Math.max(1, xpPara(L + 1) - xpPara(L));
  const grande = q => {
    const k = q.req && q.req.kill && MONSTROS[q.req.kill];
    return !!(k && k.chefe) || /_m[45]$|_rei5$|_lorde$|_chefe$|esp_m[2-6]$|atl_m4$|_final$/.test(q.id) || !!(q.rec && q.rec.flag);
  };
  let n = 0;
  for (const q of MISSOES) {
    const L = q.lvl || 1; if (L < NIVEL_MIN || !q.rec || typeof q.rec.xp !== 'number') continue;
    const teto = Math.round(xpNivel(L) * (grande(q) ? TETO_GRANDE : TETO_COMUM));
    if (q.rec.xp > teto) { q.rec.xp = teto; n++; }
  }
  window.XP_MISSOES_AJUSTADAS = n; // (para os testes)
}
