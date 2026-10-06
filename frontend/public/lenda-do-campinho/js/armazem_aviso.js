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
if (typeof entregaMissao === 'function') entregaMissao = avzComOrigem(entregaMissao, q => `missão "${(q && q.titulo) || '?'}"`);
if (typeof usarItem === 'function') usarItem = avzComOrigem(usarItem, id => `abriu ${(ITENS[id] && ITENS[id].nome) || 'um item'}`);
if (typeof matar === 'function') {
  // a vitória inteira (drop + Fragmentos do Despertar + prêmios dos Ecos/Torre que os outros arquivos dão) vira UM aviso só
  const _mtAvz = avzComOrigem(matar, m => `vitória sobre ${(m && m.d && m.d.nome) || 'um adversário'}${G.mapa && G.mapa.torre ? ` (Torre Infinita, andar ${G.mapa.torre})` : ''}`);
  matar = function () {
    if (RECEBE_LOTE) return _mtAvz.apply(this, arguments);
    const lote = RECEBE_LOTE = [];
    try { return _mtAvz.apply(this, arguments); } finally { RECEBE_LOTE = null; if (lote.length) avisaArmazem(lote, lote.motivo || 'espaco'); }
  };
}
if (typeof bzTrocaPeca === 'function') bzTrocaPeca = avzComOrigem(bzTrocaPeca, 'troca garantida com a Mestra da Torre');
if (typeof torreLimpou === 'function') torreLimpou = avzComOrigem(torreLimpou, () => `andar ${(G.mapa && G.mapa.torre) || '?'} da Torre Infinita vencido`);
// trocas de Fichas na janela da Mestra da Torre (torre_infinita.js): os botões são criados lá; a origem do clique vem daqui
document.addEventListener('click', ev => {
  try { const b = ev.target && ev.target.closest && ev.target.closest('#modalConteudo button'); const h2 = document.querySelector('#modalConteudo h2'); if (b && !RECEBE_ORIGEM && /ficha/i.test(b.textContent || '') && h2 && /Torre/.test(h2.textContent || '')) { RECEBE_ORIGEM = 'troca de Fichas da Torre'; setTimeout(() => { if (RECEBE_ORIGEM === 'troca de Fichas da Torre') RECEBE_ORIGEM = ''; }, 0); } } catch (e) { }
}, true);

// a janela do histórico
function avzHistorico() {
  const s = G.save, h = (s && Array.isArray(s.armHist)) ? s.armHist : [];
  const quando = t => { try { return new Date(t).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };
  const linhas = h.filter(x => x && ITENS[x.id]).map(x => el('div', { class: 'avz-linha' },
    (() => { try { return iconeClone(iconeItem(x.id)); } catch (e) { return el('span', {}, '📦'); } })(),
    el('div', {}, el('b', {}, `${fmt(x.q)}x ${ITENS[x.id].nome}${x.r ? ' +' + x.r : ''}`), el('small', {}, `${quando(x.t)} · de: ${x.de}`))));
  abreModal(el('h2', {}, '📜 Histórico do armazém'),
    el('p', { class: 'dica' }, 'Prêmios que entraram SOZINHOS no armazém porque a mochila estava cheia ou pesada demais (os últimos 30). O que você mesmo guarda não aparece aqui.'),
    linhas.length ? el('div', { class: 'avz-lista' }, ...linhas) : el('p', { class: 'vazio' }, 'Nenhum prêmio foi para o armazém sozinho.'),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: () => modalArmazem() }, '📦 Voltar ao armazém'), el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Fechar')));
}
if (typeof modalArmazem === 'function') {
  const _maAvz = modalArmazem;
  modalArmazem = function () {
    const r = _maAvz.apply(this, arguments);
    try {
      const at = document.querySelector('#modalConteudo .arm-atalhos'), n = ((G.save && G.save.armHist) || []).length;
      if (at && !at.querySelector('.avz-bt')) at.append(el('button', { class: 'btn mini roxo avz-bt', type: 'button', onclick: avzHistorico }, `📜 Histórico${n ? ` (${n})` : ''}`));
    } catch (e) { }
    return r;
  };
}
// save antigo com prêmios "guardados para depois": chegam ao entrar (mochila; o que não couber, armazém — com aviso)
{
  const _iniAvz = iniciarJogo;
  iniciarJogo = async function () {
    const r = await _iniAvz.apply(this, arguments);
    try { if (G.save && Array.isArray(G.save.pendentes) && G.save.pendentes.length) { RECEBE_ORIGEM = 'prêmio que estava guardado para você'; try { entregaPendentes(); } finally { RECEBE_ORIGEM = ''; } G.uiSujo = true; } } catch (e) { }
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
