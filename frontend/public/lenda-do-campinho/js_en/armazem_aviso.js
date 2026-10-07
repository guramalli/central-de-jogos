/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   📜 HISTÓRICO DO ARMAZÉM (bug relatado pelo dono em 06/10/2026, nível 633: na Torre Infinita, andar 50, o drop avisou
   "2x Baú da Torre, 1x Caneleira de Gelo Eterno" e eles não estavam na mochila — tinham ido para o ARMAZÉM, porque a
   mochila estava sem espaço ou pesada demais, e o aviso se perdia no chat. Também apareceu no armazém uma "Caneleiras do
   Infinito" que ele não sabia de onde veio.)
   O núcleo está em game.js (recebeItem/avisaArmazem/armHistorico): todo prêmio que vai sozinho para o armazém avisa no
   registro e na faixa do topo e entra em s.armHist (últimos 30). Aqui:
   - de ONDE veio cada prêmio (missão, baú, troca, vitória...) para o histórico;
   - o botão "📜 Histórico" na janela do armazém (o que entrou sozinho, quando e de onde);
   - saves antigos com prêmios "guardados para depois" (s.pendentes, que não apareciam em lugar nenhum) recebem ao entrar.
   Prefixo: avz. Carregar NO FIM (depois de game.js, armazem.js, balanco_v407.js, torre_infinita.js e de todo embrulho de
   matar, usarItem, entregaMissao e modalArmazem).
   ============================================================ */
// de onde veio: cada caminho de prêmio marca a origem enquanto roda (o mais de dentro vence: o drop do chefão diz "drop de...")
function avzComOrigem(fn, origem) {
  return function () {
    const o0 = RECEBE_ORIGEM; if (!o0) { try { RECEBE_ORIGEM = typeof origem === 'function' ? origem.apply(this, arguments) : origem; } catch (e) { RECEBE_ORIGEM = ''; } }
    try { return fn.apply(this, arguments); } finally { RECEBE_ORIGEM = o0; }
  };
}
if (typeof entregaMissao === 'function') entregaMissao = avzComOrigem(entregaMissao, q => `mission "${(q && q.titulo) || '?'}"`);
if (typeof usarItem === 'function') usarItem = avzComOrigem(usarItem, id => `abriu ${(ITENS[id] && ITENS[id].nome) || 'an item'}`);
if (typeof matar === 'function') {
  // a vitória inteira (drop + Fragmentos do Despertar + prêmios dos Ecos/Torre que os outros arquivos dão) vira UM aviso só
  const _mtAvz = avzComOrigem(matar, m => `win over ${(m && m.d && m.d.nome) || 'an opponent'}${G.mapa && G.mapa.torre ? ` (Infinite Tower, floor ${G.mapa.torre})` : ''}`);
  matar = function () {
    if (RECEBE_LOTE) return _mtAvz.apply(this, arguments);
    const lote = RECEBE_LOTE = [];
    try { return _mtAvz.apply(this, arguments); } finally { RECEBE_LOTE = null; if (lote.length) avisaArmazem(lote, lote.motivo || 'espaco'); }
  };
}
if (typeof bzTrocaPeca === 'function') bzTrocaPeca = avzComOrigem(bzTrocaPeca, 'guaranteed trade with the Tower Master');
if (typeof torreLimpou === 'function') torreLimpou = avzComOrigem(torreLimpou, () => `floor ${(G.mapa && G.mapa.torre) || '?'} of the Infinite Tower cleared`);
// trocas de Fichas na janela da Mestra da Torre (torre_infinita.js): os botões são criados lá; a origem do clique vem daqui
document.addEventListener('click', ev => {
  try { const b = ev.target && ev.target.closest && ev.target.closest('#modalConteudo button'); const h2 = document.querySelector('#modalConteudo h2'); if (b && !RECEBE_ORIGEM && /ficha/i.test(b.textContent || '') && h2 && /Torre/.test(h2.textContent || '')) { RECEBE_ORIGEM = 'Tower Token trade'; setTimeout(() => { if (RECEBE_ORIGEM === 'Tower Token trade') RECEBE_ORIGEM = ''; }, 0); } } catch (e) { }
}, true);

// a janela do histórico
function avzHistorico() {
  const s = G.save, h = (s && Array.isArray(s.armHist)) ? s.armHist : [];
  const quando = t => { try { return new Date(t).toLocaleString('en-US', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };
  const linhas = h.filter(x => x && ITENS[x.id]).map(x => el('div', { class: 'avz-linha' },
    (() => { try { return iconeClone(iconeItem(x.id)); } catch (e) { return el('span', {}, '📦'); } })(),
    el('div', {}, el('b', {}, `${fmt(x.q)}x ${ITENS[x.id].nome}${x.r ? ' +' + x.r : ''}`), el('small', {}, `${quando(x.t)} · from: ${x.de}`))));
  abreModal(el('h2', {}, '📜 Storage history'),
    el('p', { class: 'dica' }, 'Prizes that went into storage ON THEIR OWN because your backpack was full or too heavy (the last 30). Things you store yourself don’t show up here.'),
    linhas.length ? el('div', { class: 'avz-lista' }, ...linhas) : el('p', { class: 'vazio' }, 'No prize has gone into storage on its own.'),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: () => modalArmazem() }, '📦 Back to storage'), el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Close')));
}
if (typeof modalArmazem === 'function') {
  const _maAvz = modalArmazem;
  modalArmazem = function () {
    const r = _maAvz.apply(this, arguments);
    try {
      const at = document.querySelector('#modalConteudo .arm-atalhos'), n = ((G.save && G.save.armHist) || []).length;
      if (at && !at.querySelector('.avz-bt')) at.append(el('button', { class: 'btn mini roxo avz-bt', type: 'button', onclick: avzHistorico }, `📜 History${n ? ` (${n})` : ''}`));
    } catch (e) { }
    return r;
  };
}
// save antigo com prêmios "guardados para depois": chegam ao entrar (mochila; o que não couber, armazém — com aviso)
{
  const _iniAvz = iniciarJogo;
  iniciarJogo = async function () {
    const r = await _iniAvz.apply(this, arguments);
    try { if (G.save && Array.isArray(G.save.pendentes) && G.save.pendentes.length) { RECEBE_ORIGEM = 'a prize that was being kept for you'; try { entregaPendentes(); } finally { RECEBE_ORIGEM = ''; } G.uiSujo = true; } } catch (e) { }
    return r;
  };
}
{
  const css = document.createElement('style');
  css.textContent = `.avz-lista { display: flex; flex-direction: column; gap: 4px; max-height: 55vh; overflow-y: auto; }
  .avz-linha { display: flex; align-items: center; gap: 8px; padding: 4px 6px; border-radius: 8px; background: rgba(0,0,0,.05); }
  .avz-linha > :first-child { width: 34px; height: 34px; flex-shrink: 0; }
  .avz-linha small { display: block; opacity: .8; }`;
  document.head.append(css);
}
