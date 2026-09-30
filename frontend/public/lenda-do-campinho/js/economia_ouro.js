/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   💰 MAIS TOSTÕES NOS ADVERSÁRIOS (v310), a pedido do dono ("falta dinheiro para forjar").
   Medido: no nível 240–280 cada adversário dava ~860 tostões (menos que no 200–240!) e forjar uma camisa
   lendária +1 custava ~236 mil (≈ 270 adversários); +3, ~1,5 milhão (≈ 1.800).
   Agora, a partir do nível 60, ninguém dá menos que nível^1,5 (±20%): nível 100 ≈ 1.000, 190 ≈ 2.600,
   245 ≈ 3.800, 300 ≈ 5.200, 400 ≈ 8.000; chefões, o triplo. Quem já dava mais continua igual.
   Carregar NO FIM (depois de todos os arquivos que criam adversários).
   ============================================================ */
{
  let n = 0;
  for (const d of Object.values(MONSTROS)) {
    if (!d || !Array.isArray(d.ouro) || d.treino) continue;
    const L = typeof nivelMonstro === 'function' ? nivelMonstro(d) : d.nivel; if (!L || L < 60) continue;
    const base = Math.pow(L, 1.5) * (d.chefe ? 3 : 1), lo = Math.round(base * 0.8), hi = Math.round(base * 1.2);
    if (d.ouro[1] < hi) { d.ouro = [Math.max(d.ouro[0], lo), Math.max(d.ouro[1], hi)]; n++; }
  }
  window.OURO_AJUSTADOS = n; // (para os testes)
}
