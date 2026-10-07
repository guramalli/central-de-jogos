/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🖥️ TELA E PAINÉIS (v361, dono: "dê a opção de diminuir o tamanho da tela de jogo e adicionar mais uma fileira de
   janelas dos lados igual no Tibia, para abrir várias backpacks e deixar organizadas").
   ☰ Mais › 🖥️ Tela e painéis:
   - tamanho da tela do jogo: Grande (100%), Média, Pequena, Mini — sobra espaço para as colunas de painéis;
   - colunas extras: mais uma coluna de cada lado (as vazias aparecem como lugar para soltar painéis);
   - o painel "🎒 Bolsas abertas" (as janelas das bolsas) pode ir para qualquer coluna pela alça ⠿;
   - tela normal / larga / cheia (o mesmo do botão ⛶) e restaurar o layout.
   Guardado neste navegador. Só no computador (no celular o layout é fixo).
   Carregar DEPOIS de layout.js, tela.js e mochilas.js.
   ============================================================ */
const TP_TAM_KEY = 'rac_tela_jogo', TP_COL_KEY = 'rac_colunas_extras';
const TP_TAMANHOS = { grande: ['Big', null], media: ['Medium', '85%'], pequena: ['Small', '70%'], mini: ['Mini', '55%'] };
const tpLe = (k, pad) => { try { return localStorage.getItem(k) || pad; } catch (e) { return pad; } };
const tpGrava = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } };
function aplicaTelaPaineis() {
  const tam = TP_TAMANHOS[tpLe(TP_TAM_KEY, 'grande')] ? tpLe(TP_TAM_KEY, 'grande') : 'grande';
  const v = TP_TAMANHOS[tam][1];
  if (v) document.documentElement.style.setProperty('--tela-jogo', v); else document.documentElement.style.removeProperty('--tela-jogo');
  document.body.classList.toggle('colunas-extras', tpLe(TP_COL_KEY, '0') === '1');
  try { if (typeof encaixaTela === 'function') encaixaTela(); if (G.rodando && typeof ajustaCanvas === 'function') ajustaCanvas(); } catch (e) { }
  window.dispatchEvent(new Event('resize'));
}
function modalTelaPaineis() {
  const tam = tpLe(TP_TAM_KEY, 'grande'), extras = tpLe(TP_COL_KEY, '0') === '1';
  const chip = (txt, on, fn, dica) => el('button', { class: 'btn mini' + (on ? ' amarelo' : ''), type: 'button', title: dica || '', onclick: () => { fn(); aplicaTelaPaineis(); modalTelaPaineis(); } }, txt);
  abreModal(el('h2', {}, '🖥️ Screen and panels'),
    el('p', {}, 'Set up the game your way, like in classic RPGs: shrink the game screen to fit more panels on the sides (open bags, battle, equipment...).'),
    el('h3', {}, 'Game screen size'),
    el('div', { class: 'opcoes' }, ...Object.entries(TP_TAMANHOS).map(([k, [nome]]) => chip(nome, k === tam, () => tpGrava(TP_TAM_KEY, k)))),
    el('h3', {}, 'Panel columns'),
    el('p', { class: 'dica' }, 'With the extra columns, each side of the game has TWO columns. Drag a panel\'s ⠿ handle (or a tab) to the column you want. The "🎒 Open bags" panel shows the bag windows: open several and keep everything in its place.'),
    el('div', { class: 'opcoes' },
      chip(extras ? '✅ Extra columns on' : '➕ Turn on extra columns', extras, () => tpGrava(TP_COL_KEY, extras ? '0' : '1')),
      el('button', { class: 'btn mini', type: 'button', onclick: () => { if (typeof restauraLayout === 'function') restauraLayout(); modalTelaPaineis(); } }, '↺ Restore panels')),
    el('h3', {}, 'Screen'),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn mini', type: 'button', onclick: () => { if (typeof trocaTela === 'function') trocaTela(); } }, '⛶ Normal → Wide → Full screen')),
    el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: fechaModal }, 'Done')));
}
(function poeBotaoTP(t = 0) {
  const lista = document.querySelector('.tb-lista'); if (!lista) { if (t < 40) setTimeout(() => poeBotaoTP(t + 1), 500); return; }
  if (document.getElementById('btnTelaPaineis')) return;
  const b = el('button', { class: 'btn', id: 'btnTelaPaineis', type: 'button', role: 'menuitem' }, '🖥️ Screen and panels'); b.onclick = modalTelaPaineis;
  lista.append(b);
})();
// a ajuda ("Como jogar") também aponta para cá
if (typeof modalAjuda === 'function') { const _ajTP = modalAjuda; modalAjuda = function () { _ajTP.apply(this, arguments); const box = document.getElementById('modalConteudo'); if (box) box.append(el('div', { class: 'opcoes' }, el('button', { class: 'btn', type: 'button', onclick: modalTelaPaineis }, '🖥️ Screen and panels (game size, extra columns)'))); }; }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', aplicaTelaPaineis); else aplicaTelaPaineis();
{ const _iniTP = iniciarJogo; iniciarJogo = async function () { const r = await _iniTP.apply(this, arguments); try { aplicaTelaPaineis(); } catch (e) { } return r; }; }
