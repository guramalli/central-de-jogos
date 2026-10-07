/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ⚖️ MISSÃO FÁCIL NÃO DÁ XP DE GRAÇA (v322 — desde a v369 só nas missões REPETÍVEIS, ver fatorXpMissao), pedido do dono: "nos níveis altos, não ter tanta XP fazendo
   missões fáceis; quem quer ser top level tem que jogar bastante". A XP de uma missão cai conforme você
   está ACIMA do nível dela (o ouro e os itens continuam iguais):
     até 10 níveis acima → 100% · 35 acima → 50% · 60 acima → 25% · 85 acima → 12% · bem mais → no mínimo 3%
   As missões feitas no nível certo não mudam nada. Os Desafios Lendários do Multiverso (multiverso.js) são
   pesados e pagam muito bem — esses sim são o caminho do topo.
   Carregar NO FIM (depois de balanco_xp.js).
   ============================================================ */
// v359 (dono: "pulei 12 níveis com uma missão só... acaba rápido"): o teto do balanco_xp.js rodava ANTES do
// Multiverso/Torre/relíquias criarem as missões delas (lendárias davam de 4 a 13 níveis). Agora o teto passa
// de novo aqui, no fim: Desafio Lendário e relíquia final no máximo 3 níveis; chefão/final 2; comum 1,2.
{
  const xpNivel = L => Math.max(1, xpPara(L + 1) - xpPara(L));
  const lendaria = q => /^⭐/.test(q.titulo || '') || /^rel_.*_2$/.test(q.id);
  const grande = q => { const k = q.req && q.req.kill && MONSTROS[q.req.kill]; return !!(k && k.chefe) || /_m[45]$|_rei5$|_lorde$|_chefe$|esp_m[2-6]$|atl_m4$|_final$|^mv_[agl]\d$/.test(q.id) || !!(q.rec && q.rec.flag); };
  let n = 0;
  for (const q of MISSOES) {
    const L = q.lvl || 1; if (L < 20 || !q.rec || typeof q.rec.xp !== 'number') continue;
    const teto = Math.round(xpNivel(L) * (lendaria(q) ? 3 : grande(q) ? 2 : 1.2));
    if (q.rec.xp > teto) { q.rec.xp = teto; n++; }
  }
  window.XP_MISSOES_AJUSTADAS = (window.XP_MISSOES_AJUSTADAS || 0) + n;
}
// v369 (dono: "existem missões que a gente acaba passando de nível e não faz; quando fazemos, a XP deve ser 100%; as que
// se repetem é que devem ser diminuídas"): missão de UMA VEZ só dá a XP cheia, em qualquer nível. A queda vale só para
// missão repetível (q.repete). (O que se repete hoje — Caçada da Vez, tarefas da semana, Ecos — já paga pelo nível dos
// adversários.) O teto de XP acima continua: uma missão antiga não dá vários níveis de uma vez.
function fatorXpMissao(q, nivel) {
  if (!q || !q.repete) return 1;
  const L = (q && q.lvl) || 1, n = nivel || (G.save && G.save.nivel) || 1, dif = n - L;
  if (dif <= 10) return 1;
  return Math.max(0.03, Math.pow(0.5, (dif - 10) / 25));
}
{
  const comXp = (q, f, fn) => { const r0 = q.rec; q.rec = Object.assign({}, r0, { xp: Math.max(1, Math.round(r0.xp * f)) }); try { return fn(); } finally { q.rec = r0; } };
  const _entregaAlto = entregaMissao;
  entregaMissao = function (q) {
    const f = fatorXpMissao(q); if (f >= 1 || !q || !q.rec || !q.rec.xp) return _entregaAlto.apply(this, arguments);
    const r = comXp(q, f, () => _entregaAlto.apply(this, arguments));
    log(`⚖️ Level ${q.lvl} mission for someone already level ${G.save.nivel}: its XP came at ${Math.round(f * 100)}%. Missions at your level give full XP!`, 'l-sis');
    return r;
  };
  const _modalMissaoAlto = modalMissao;
  modalMissao = function (npc, q) {
    const f = fatorXpMissao(q); if (f >= 1 || !q || !q.rec || !q.rec.xp) return _modalMissaoAlto.apply(this, arguments);
    const r = comXp(q, f, () => _modalMissaoAlto.apply(this, arguments));
    try { const fala = document.querySelector('#modalConteudo .fala'); if (fala) fala.append(el('p', { class: 'dica' }, `⚖️ You're ${G.save.nivel - q.lvl} levels above this mission (level ${q.lvl}): its XP drops to ${Math.round(f * 100)}%. Coins and items stay the same.`)); } catch (e) { }
    return r;
  };
}
