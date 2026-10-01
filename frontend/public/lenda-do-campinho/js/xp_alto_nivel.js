/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ⚖️ MISSÃO FÁCIL NÃO DÁ XP DE GRAÇA (v322), pedido do dono: "nos níveis altos, não ter tanta XP fazendo
   missões fáceis; quem quer ser top level tem que jogar bastante". A XP de uma missão cai conforme você
   está ACIMA do nível dela (o ouro e os itens continuam iguais):
     até 10 níveis acima → 100% · 35 acima → 50% · 60 acima → 25% · 85 acima → 12% · bem mais → no mínimo 3%
   As missões feitas no nível certo não mudam nada. Os Desafios Lendários do Multiverso (multiverso.js) são
   pesados e pagam muito bem — esses sim são o caminho do topo.
   Carregar NO FIM (depois de balanco_xp.js).
   ============================================================ */
function fatorXpMissao(q, nivel) {
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
    log(`⚖️ Missão de nível ${q.lvl} para quem já é nível ${G.save.nivel}: a XP dela veio com ${Math.round(f * 100)}%. Missões do seu nível rendem a XP cheia!`, 'l-sis');
    return r;
  };
  const _modalMissaoAlto = modalMissao;
  modalMissao = function (npc, q) {
    const f = fatorXpMissao(q); if (f >= 1 || !q || !q.rec || !q.rec.xp) return _modalMissaoAlto.apply(this, arguments);
    const r = comXp(q, f, () => _modalMissaoAlto.apply(this, arguments));
    try { const fala = document.querySelector('#modalConteudo .fala'); if (fala) fala.append(el('p', { class: 'dica' }, `⚖️ Você está ${G.save.nivel - q.lvl} níveis acima desta missão (nível ${q.lvl}): a XP dela cai para ${Math.round(f * 100)}%. Os tostões e itens continuam iguais.`)); } catch (e) { }
    return r;
  };
}
