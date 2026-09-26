/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   CADASTRO: convida quem joga SEM CONTA a criar uma (dentro do site)
   Sem conta o jogo funciona, mas a pessoa não aparece no Ranking e o
   progresso fica só neste aparelho. Então:
   - tela inicial: cartão "Crie sua conta grátis" (+ presente de boas-vindas);
   - antes de Novo jogador / Continuar: pergunta UMA vez por sessão;
   - no jogo: etiqueta "Sem conta" no topo e no menu do celular;
   - lembrete ao subir de nível em marcos (5, 10, 15, 20, 30…), no máximo 1 a cada 20 min;
   - no Ranking: botões para criar conta / entrar.
   Quem já tem conta ganha o presente de boas-vindas uma vez por personagem.
   O personagem continua: o save do aparelho passa a ser da conta (contas.js).
   Carregar DEPOIS de contas.js.
   ============================================================ */
const CADASTRO = {
  semConta: typeof PORTAL !== 'undefined' && PORTAL.ativo && !PORTAL.token,
  urlCriar: '/?pagina=cadastro', urlEntrar: '/?pagina=entrar',
  presente: [['pacotinho', 3]], ouroPresente: 500,
  marcos: [5, 10, 15, 20, 30, 40, 50, 75, 100, 125, 150, 175, 200],
  intervalo: 20 * 60000, ultimo: 0,
};
function irParaConta(url) { try { if (G.save) salvar(); } catch (e) { } location.href = url; }
function botoesConta(extraFechar) {
  return el('div', { class: 'opcoes cad-bts' },
    el('button', { class: 'btn amarelo', type: 'button', onclick: () => irParaConta(CADASTRO.urlCriar) }, '⭐ Criar conta grátis'),
    el('button', { class: 'btn', type: 'button', onclick: () => irParaConta(CADASTRO.urlEntrar) }, '🔑 Já tenho conta: entrar'),
    ...(extraFechar ? [extraFechar] : []));
}
const VANTAGENS_CONTA = () => el('ul', { class: 'cad-lista' },
  el('li', {}, '🏆 Seu nome aparece no ', el('b', {}, 'Ranking'), ' de todos os jogadores'),
  el('li', {}, '☁️ Seu progresso fica salvo na nuvem: jogue no celular e no computador'),
  el('li', {}, '🎁 Presente de boas-vindas: ', el('b', {}, '3 pacotinhos de figurinhas'), ' e 500 tostões'),
  el('li', {}, '✅ Seu personagem de agora ', el('b', {}, 'continua'), ' com você depois de entrar'));

// janela de convite (antes de jogar, e nos marcos de nível)
function modalConvite(titulo, texto, aoJogar) {
  const jogar = el('button', { class: 'btn', type: 'button', onclick: () => { fechaModal(); if (aoJogar) aoJogar(); } }, aoJogar ? 'Jogar sem conta' : 'Agora não');
  abreModal(el('h2', {}, titulo), el('p', {}, texto), VANTAGENS_CONTA(), botoesConta(jogar),
    el('p', { class: 'dica' }, 'É grátis e rapidinho. Peça ajuda para um adulto se precisar.'));
  if (!G.rodando) $('#modal').onclick = null;
}

if (CADASTRO.semConta) (function () {
  // ---------- tela inicial ----------
  const menu = document.getElementById('inicioMenu');
  if (menu && !document.querySelector('.cad-cartao')) {
    menu.prepend(el('div', { class: 'cad-cartao' },
      el('b', {}, '⭐ Você está jogando sem conta'),
      el('span', {}, 'Crie sua conta grátis no Educação Gamer para aparecer no Ranking, salvar na nuvem e ganhar um presente!'),
      botoesConta()));
  }
  document.querySelectorAll('a.portal-quem[href="/login"]').forEach(a => { a.href = CADASTRO.urlEntrar; });

  // ---------- antes de começar: pergunta uma vez por sessão ----------
  let perguntou = false; try { perguntou = sessionStorage.getItem('rac_convite_conta') === '1'; } catch (e) { }
  document.addEventListener('click', ev => {
    const b = ev.target && ev.target.closest && ev.target.closest('#btnNovo, #btnContinuar');
    if (!b || perguntou) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    perguntou = true; try { sessionStorage.setItem('rac_convite_conta', '1'); } catch (e) { }
    modalConvite('Antes de entrar em campo...', 'Sem conta você joga normalmente, mas NÃO aparece no Ranking e o progresso fica só neste aparelho.', () => b.click());
  }, true);

  // ---------- no jogo: etiqueta no topo e no menu do celular ----------
  const info = document.querySelector('#topo .topo-info');
  if (info) info.prepend(el('button', { class: 'tag cad-tag', type: 'button', title: 'Crie sua conta para aparecer no Ranking', onclick: () => modalConvite('Crie sua conta grátis', 'Você está jogando sem conta: seu progresso não aparece no Ranking.') }, '🔑 Sem conta · criar'));
  const grade = document.querySelector('#celMenu .cm-grade');
  if (grade) grade.prepend(el('button', { class: 'btn cm-bt amarelo', type: 'button', onclick: () => irParaConta(CADASTRO.urlCriar) }, el('span', { class: 'cm-ic' }, '⭐'), 'Criar conta'));

  // ---------- lembrete nos marcos de nível ----------
  const tentaLembrete = (nv, tent = 0) => {
    if (!G.rodando || !G.save) return;
    const hist = document.getElementById('historia'); // capítulo da história passando: espera acabar
    const ocupado = !$('#modal').hidden || G.pausado || (hist && hist.isConnected && getComputedStyle(hist).display !== 'none');
    if (ocupado) { if (tent < 80) setTimeout(() => tentaLembrete(nv, tent + 1), 3000); return; }
    CADASTRO.ultimo = Date.now();
    modalConvite(`🎉 Nível ${nv}!`, `Mandou bem! Mas o seu nível ${nv} ainda não aparece no Ranking, porque você está sem conta.`);
  };
  const _subiuNivelCad = subiuNivel;
  subiuNivel = function (...a) {
    const r = _subiuNivelCad.apply(this, a);
    const nv = G.save && G.save.nivel;
    if (CADASTRO.marcos.includes(nv) && Date.now() - CADASTRO.ultimo > CADASTRO.intervalo) { CADASTRO.ultimo = Date.now(); setTimeout(() => tentaLembrete(nv), 2500); }
    return r;
  };

  // ---------- Ranking: botões direto ----------
  const _modalRankingCad = modalRanking;
  modalRanking = async function (...a) {
    const r = await _modalRankingCad.apply(this, a);
    const cont = $('#modalConteudo'); const h = cont && cont.querySelector('h2');
    if (h && /Ranking/.test(h.textContent) && !cont.querySelector('.cad-rank')) h.after(el('div', { class: 'cad-cartao cad-rank' }, el('b', {}, 'Você não aparece aqui porque está sem conta.'), el('span', {}, 'Crie sua conta grátis: seu personagem continua e entra no Ranking!'), botoesConta()));
    return r;
  };
})();

// ---------- presente de boas-vindas para quem tem conta (uma vez por personagem) ----------
if (typeof PORTAL !== 'undefined' && PORTAL.ativo && PORTAL.token) {
  const _iniciarJogoCad = iniciarJogo;
  iniciarJogo = async function (...a) {
    const r = await _iniciarJogoCad.apply(this, a);
    setTimeout(() => {
      const s = G.save; if (!s || !G.rodando || (s.flags && s.flags.presente_conta) || !saveDaConta(s)) return;
      s.flags.presente_conta = true; s.ouro += CADASTRO.ouroPresente;
      for (const [id, n] of CADASTRO.presente) recebeItem(id, n);
      log(`🎁 Presente de boas-vindas da sua conta: ${CADASTRO.presente.map(([id, n]) => `${n}x ${ITENS[id].nome}`).join(', ')} e ${CADASTRO.ouroPresente} tostões!`, 'l-loot');
      banner('🎁 Presente da sua conta!', '3 pacotinhos de figurinhas e 500 tostões');
      som('moeda'); salvar(); G.uiSujo = true;
    }, 4000);
    return r;
  };
}

(function () {
  const st = document.createElement('style');
  st.textContent = `
  .cad-cartao { display: flex; flex-direction: column; gap: 4px; background: linear-gradient(135deg, #fff6c8, #ffe08a); border: 2px solid #d89a1a; border-radius: 12px; padding: 10px 12px; margin: 0 0 10px; color: #5e2f14; text-align: left; box-shadow: 0 2px 0 #b07a10; }
  .cad-cartao b { font-size: 15px; }
  .cad-cartao span { font-size: 13.5px; line-height: 1.3; }
  .cad-cartao .cad-bts { margin-top: 4px; justify-content: flex-start; }
  .cad-lista { margin: 6px 0 10px; padding-left: 4px; list-style: none; font-size: 14px; line-height: 1.5; }
  .cad-tag { cursor: pointer; background: #ffe08a !important; color: #7a3410 !important; border: 1px solid #d89a1a; font-weight: 800; animation: cadPisca 2.4s ease-in-out infinite; }
  @keyframes cadPisca { 0%,100% { box-shadow: 0 0 0 rgba(255,200,40,0); } 50% { box-shadow: 0 0 8px rgba(255,200,40,.9); } }
  `;
  document.head.append(st);
})();
