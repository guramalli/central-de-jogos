/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🏆 RANKING DE HABILIDADES (v388; dono: "vamos implementar um rank de skills também?")
   A janela Ranking ganha abas: 🏆 Nível · 🔶 Drible · 🎯 Chute · 🛡️ Defesa · 🧠 Visão. Cada aba de habilidade mostra o
   top 50 pelo nível TREINADO (sem os bônus de itens). O jogo manda as habilidades junto com o ranking (game.js).
   Servidor: GET /api/lenda/ranking/skill/:sk. Steam: não tem (sem conta do site).
   ============================================================ */
const RKS_ABAS = [['nivel', '🏆 Nível'], ['drible', '🔶 Drible'], ['chute', '🎯 Chute'], ['defesa', '🛡️ Defesa'], ['visao', '🧠 Visão']];
function rksAbas(ativa) {
  return el('div', { class: 'rks-abas' }, ...RKS_ABAS.map(([k, t]) => el('button', { class: 'btn mini' + (k === ativa ? ' amarelo' : ''), type: 'button', onclick: () => k === 'nivel' ? modalRanking() : rksMostra(k) }, t)));
}
async function rksMostra(sk) {
  const titulo = SKILLS[sk] ? SKILLS[sk].nome : sk;
  abreModal(el('h2', {}, 'Ranking'), rksAbas(sk), el('p', { class: 'vazio' }, 'Carregando...'));
  let lista = null, erro = '';
  try { const r = await fetch(PORTAL.api + '/api/lenda/ranking/skill/' + sk); if (r.ok) lista = await r.json(); else erro = (await r.json().catch(() => ({}))).error || ''; } catch (e) { erro = 'Sem conexão com o site.'; }
  const euId = PORTAL.user && PORTAL.user.id;
  if (!lista) return abreModal(el('h2', {}, 'Ranking'), rksAbas(sk), el('p', {}, erro || 'Não deu para carregar agora. Tente de novo em instantes.'));
  const tab = el('table', { class: 'rank-tab' }, el('tr', {}, el('th', {}, '#'), el('th', {}, 'Jogador'), el('th', {}, 'Posição'), el('th', {}, 'Nível'), el('th', {}, titulo)));
  lista.forEach((x, i) => tab.append(el('tr', { class: x.userId === euId ? 'eu' : '' }, el('td', {}, i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1), el('td', {}, typeof linkPers === 'function' ? linkPers(x.apelido) : x.apelido),
    el('td', {}, x.posicao && POSICOES[x.posicao] ? POSICOES[x.posicao].nome : '—'), el('td', {}, x.nivel), el('td', {}, el('b', {}, x.valor)))));
  const meu = G.save && G.save.sk && G.save.sk[sk] ? G.save.sk[sk].lv : null;
  abreModal(el('h2', {}, 'Ranking'), rksAbas(sk),
    el('p', {}, `Quem treinou mais ${titulo} (o nível treinado, sem os bônus de itens).${meu != null ? ` O seu: ${meu}.` : ''} Entra sozinho enquanto você joga (até 1 minuto).`),
    lista.length ? tab : el('p', { class: 'vazio' }, 'Ninguém neste ranking ainda — ele enche conforme os jogadores entram no jogo.'));
  if (!G.rodando) $('#modal').onclick = null;
}
{ // as abas também na aba "Nível" (o ranking de sempre)
  const _mrRks = modalRanking;
  modalRanking = async function () {
    const r = await _mrRks.apply(this, arguments);
    try {
      if (typeof PORTAL !== 'undefined' && PORTAL.ativo && !window.LENDA_STEAM) {
        const h = document.querySelector('#modal h2'); if (h && h.textContent === 'Ranking' && !document.querySelector('#modal .rks-abas')) h.after(rksAbas('nivel'));
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
