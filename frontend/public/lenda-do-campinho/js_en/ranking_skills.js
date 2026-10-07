/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🏆 RANKING DE HABILIDADES (v388; dono: "vamos implementar um rank de skills também?")
   A janela Ranking ganha abas: 🏆 Nível · 🔶 Drible · 🎯 Chute · 🛡️ Defesa · 🧠 Visão. Cada aba de habilidade mostra o
   top 50 pelo nível TREINADO (sem os bônus de itens). O jogo manda as habilidades junto com o ranking (game.js).
   Servidor: GET /api/lenda/ranking/skill/:sk. Steam: não tem (sem conta do site).
   ============================================================ */
const RKS_ABAS = [['nivel', '🏆 Level'], ['drible', '🔶 Dribbling'], ['chute', '🎯 Shooting'], ['defesa', '🛡️ Defense'], ['visao', '🧠 Vision']];
function rksAbas(ativa) {
  return el('div', { class: 'rks-abas' }, ...RKS_ABAS.map(([k, t]) => el('button', { class: 'btn mini' + (k === ativa ? ' amarelo' : ''), type: 'button', onclick: () => k === 'nivel' ? modalRanking() : rksMostra(k) }, t)));
}
async function rksMostra(sk) {
  const titulo = SKILLS[sk] ? SKILLS[sk].nome : sk;
  abreModal(el('h2', {}, 'Leaderboard'), rksAbas(sk), el('p', { class: 'vazio' }, 'Loading...'));
  let lista = null, erro = '';
  try { const r = await fetch(PORTAL.api + '/api/lenda/ranking/skill/' + sk); if (r.ok) lista = await r.json(); else erro = (await r.json().catch(() => ({}))).error || ''; } catch (e) { erro = 'No connection to the server.'; }
  const euId = PORTAL.user && PORTAL.user.id;
  if (!lista) return abreModal(el('h2', {}, 'Leaderboard'), rksAbas(sk), el('p', {}, erro || 'Couldn\'t load right now. Try again in a moment.'));
  const tab = el('table', { class: 'rank-tab' }, el('tr', {}, el('th', {}, '#'), el('th', {}, 'Player'), el('th', {}, 'Position'), el('th', {}, 'Level'), el('th', {}, titulo)));
  lista.forEach((x, i) => tab.append(el('tr', { class: x.userId === euId ? 'eu' : '' }, el('td', {}, i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1), el('td', {}, typeof linkPers === 'function' ? linkPers(x.apelido) : x.apelido),
    el('td', {}, x.posicao && POSICOES[x.posicao] ? POSICOES[x.posicao].nome : '—'), el('td', {}, x.nivel), el('td', {}, el('b', {}, x.valor)))));
  const meu = G.save && G.save.sk && G.save.sk[sk] ? G.save.sk[sk].lv : null;
  abreModal(el('h2', {}, 'Leaderboard'), rksAbas(sk),
    el('p', {}, `Who has trained ${titulo} the most (the trained level, without item bonuses).${meu != null ? ` Yours: ${meu}.` : ''} Updates on its own while you play (within 1 minute).`),
    lista.length ? tab : el('p', { class: 'vazio' }, 'No one on this leaderboard yet — it fills up as players join the game.'));
  if (!G.rodando) $('#modal').onclick = null;
}
{ // as abas também na aba "Nível" (o ranking de sempre)
  const _mrRks = modalRanking;
  modalRanking = async function () {
    const r = await _mrRks.apply(this, arguments);
    try {
      if (typeof PORTAL !== 'undefined' && PORTAL.ativo && !window.LENDA_STEAM) {
        const h = document.querySelector('#modal h2'); if (h && h.textContent === 'Leaderboard' && !document.querySelector('#modal .rks-abas')) h.after(rksAbas('nivel'));
      }
    } catch (e) { }
    return r;
  };
}
{
  const css = document.createElement('style');
  css.textContent = `.rks-abas { display: flex; flex-wrap: wrap; gap: 4px; margin: 4px 0 8px; }`;
  document.head.append(css);
}
window.RANK_SKILLS = { rksMostra };
