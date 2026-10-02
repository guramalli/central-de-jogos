/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   👑 CHEFÃO VENCIDO VALE (v350, dono: "venci o Imperador Nebular mas não liberou o portal")
   - O portal da Copa Intergaláctica conferia a marca 'venceu_imperador', que só vinha ao ENTREGAR a missão
     "O Imperador Nebular" (esp_m5). Quem venceu e não entregou — ou venceu ANTES de pegar a missão — ficava preso.
     Agora vencer o Imperador (marca 'venceu_ch_imperador_nebular', que o jogo grava em toda vitória de chefão) já abre.
   - Missão "vença o chefão X" (1 vez) pega a vitória que você JÁ tinha: fica pronta na hora, é só entregar.
     Fica de fora o chefão que tem mais de uma missão seguida (ex.: Santos), em que a revanche é de propósito.
   ============================================================ */
{
  const UNICO = {}; // chefão -> a única missão "vença 1 vez"
  for (const q of MISSOES) { const k = q.req && q.req.kill; if (k && MONSTROS[k] && MONSTROS[k].chefe && q.req.n === 1) UNICO[k] = UNICO[k] === undefined ? q : null; }
  function confereChefes() {
    const s = G.save; if (!s || !s.flags || !s.quests) return;
    if (s.flags.venceu_ch_imperador_nebular && !s.flags.venceu_imperador) s.flags.venceu_imperador = true;
    for (const k in UNICO) {
      const q = UNICO[k]; if (!q || !s.flags['venceu_' + k]) continue;
      const e = s.quests[q.id]; if (!e || e.s !== 'ativa' || (e.p || 0) >= 1) continue;
      e.p = 1; G.uiSujo = true;
      const npc = NPCS[q.npc] ? NPCS[q.npc].nome : 'quem te deu a missão';
      log(`Missão "${q.titulo}" pronta! Você já tinha vencido esse chefão. Volte para falar com ${npc}.`, 'l-xp');
      try { banner('Missão pronta!', `Fale com ${npc}`); } catch (er) { }
    }
  }
  setInterval(confereChefes, 3000);
  window.confereChefes = confereChefes; // (para os testes)
}
