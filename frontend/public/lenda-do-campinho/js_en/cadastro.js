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
  urlCriar: urlConta('cadastro'), urlEntrar: urlConta('entrar'), // v290: o site volta para o jogo depois
  presente: [['pacotinho', 3]], ouroPresente: 500,
  marcos: [5, 10, 15, 20, 30, 40, 50, 75, 100, 125, 150, 175, 200],
  intervalo: 20 * 60000, ultimo: 0,
};
function irParaConta(url) { try { if (G.save) salvar(); } catch (e) { } location.href = url; }
function botoesConta(extraFechar) {
  return el('div', { class: 'opcoes cad-bts' },
    el('button', { class: 'btn amarelo', type: 'button', onclick: () => irParaConta(CADASTRO.urlCriar) }, '⭐ Create a free account'),
    el('button', { class: 'btn', type: 'button', onclick: () => irParaConta(CADASTRO.urlEntrar) }, '🔑 I already have an account: sign in'),
    ...(extraFechar ? [extraFechar] : []));
}
const VANTAGENS_CONTA = () => el('ul', { class: 'cad-lista' },
  el('li', {}, '🏆 Your name shows up on the ', el('b', {}, 'Leaderboard'), ' with all the players'),
  el('li', {}, '☁️ Your progress is saved in the cloud: play on your phone and your computer'),
  el('li', {}, '🎁 Welcome gift: ', el('b', {}, '3 sticker packs'), ' and 500 coins'),
  el('li', {}, '✅ Your current character ', el('b', {}, 'continua'), ' with you after you sign in'));

// janela de convite (antes de jogar, e nos marcos de nível)
function modalConvite(titulo, texto, aoJogar) {
  // v407 (Raio-X): "Jogar sem conta" era o botão menos visível; agora é verde, grande e vem primeiro
  const jogar = el('button', { class: aoJogar ? 'btn verde cad-jogar' : 'btn', type: 'button', style: aoJogar ? 'font-size:17px;padding:10px 22px' : '', onclick: () => { fechaModal(); if (aoJogar) aoJogar(); } }, aoJogar ? '▶ Play without an account' : 'Not now');
  if (aoJogar) { abreModal(el('h2', {}, titulo), el('p', {}, texto), el('div', { class: 'opcoes' }, jogar), VANTAGENS_CONTA(), botoesConta(), el('p', { class: 'dica' }, 'It\'s free and quick. Ask a grown-up for help if you need it.')); if (!G.rodando) $('#modal').onclick = null; return; }
  abreModal(el('h2', {}, titulo), el('p', {}, texto), VANTAGENS_CONTA(), botoesConta(jogar),
    el('p', { class: 'dica' }, 'It\'s free and quick. Ask a grown-up for help if you need it.'));
  if (!G.rodando) $('#modal').onclick = null;
}

if (CADASTRO.semConta) (function () {
  // ---------- tela inicial ----------
  const menu = document.getElementById('inicioMenu');
  if (menu && !document.querySelector('.cad-cartao')) {
    menu.prepend(el('div', { class: 'cad-cartao' },
      el('b', {}, '⭐ You\'re playing without an account'),
      el('span', {}, 'Create your free Educação Gamer account to show up on the Leaderboard, save to the cloud and get a gift!'),
      botoesConta()));
  }
  document.querySelectorAll('a.portal-quem[href^="/login"]').forEach(a => { a.href = CADASTRO.urlEntrar; });

  // ---------- antes de começar: pergunta uma vez por sessão ----------
  let perguntou = false; try { perguntou = sessionStorage.getItem('rac_convite_conta') === '1'; } catch (e) { }
  // v407 (Raio-X): o convite vinha ANTES da 1ª partida. Agora: "Novo jogador" entra direto; o convite só aparece no
  // "Continuar" de quem já terminou o tutorial (e nos marcos de nível, logo abaixo)
  const tutFeitoSave = () => { try { const s = typeof lerSave === 'function' && lerSave(); return !!s && typeof TUTORIAL !== 'undefined' && (s.tut | 0) >= TUTORIAL.length; } catch (e) { return false; } };
  document.addEventListener('click', ev => {
    const b = ev.target && ev.target.closest && ev.target.closest('#btnContinuar');
    if (!b || perguntou || !tutFeitoSave()) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    perguntou = true; try { sessionStorage.setItem('rac_convite_conta', '1'); } catch (e) { }
    modalConvite('Before you take the field...', 'Without an account you play normally, but you DON\'T show up on the Leaderboard and your progress stays only on this device.', () => b.click());
  }, true);

  // ---------- no jogo: etiqueta no topo e no menu do celular ----------
  const info = document.querySelector('#topo .topo-info');
  if (info) info.prepend(el('button', { class: 'tag cad-tag', type: 'button', title: 'Create your account to show up on the Leaderboard', onclick: () => modalConvite('Create your free account', 'You\'re playing without an account: your progress doesn\'t show up on the Leaderboard.') }, '🔑 No account · create'));
  const grade = document.querySelector('#celMenu .cm-grade');
  if (grade) grade.prepend(el('button', { class: 'btn cm-bt amarelo', type: 'button', onclick: () => irParaConta(CADASTRO.urlCriar) }, el('span', { class: 'cm-ic' }, '⭐'), 'Create account'));

  // ---------- lembrete nos marcos de nível ----------
  const tentaLembrete = (nv, tent = 0) => {
    if (!G.rodando || !G.save) return;
    const hist = document.getElementById('historia'); // capítulo da história passando: espera acabar
    const ocupado = !$('#modal').hidden || G.pausado || (hist && hist.isConnected && getComputedStyle(hist).display !== 'none');
    if (ocupado) { if (tent < 80) setTimeout(() => tentaLembrete(nv, tent + 1), 3000); return; }
    CADASTRO.ultimo = Date.now();
    modalConvite(`🎉 Level ${nv}!`, `Nice job! But your level ${nv} doesn't show up on the Leaderboard yet, because you don't have an account.`);
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
    if (h && /Ranking|Leaderboard/.test(h.textContent) && !cont.querySelector('.cad-rank')) h.after(el('div', { class: 'cad-cartao cad-rank' }, el('b', {}, 'You don\'t show up here because you don\'t have an account.'), el('span', {}, 'Create your free account: your character stays and joins the Leaderboard!'), botoesConta()));
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
      log(`🎁 Welcome gift for your account: ${CADASTRO.presente.map(([id, n]) => `${n}x ${ITENS[id].nome}`).join(', ')} and ${CADASTRO.ouroPresente} coins!`, 'l-loot');
      banner('🎁 A gift for your account!', '3 sticker packs and 500 coins');
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
