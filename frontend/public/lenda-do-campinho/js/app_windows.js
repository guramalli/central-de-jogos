/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   APLICATIVO PARA WINDOWS (v146)
   O app (baixar/LendaDoCampinho.exe, código em Projects/lenda-exe) é uma
   JANELA do site: abre este mesmo endereço num WebView2. Então:
   - toda versão publicada aqui chega no app sozinha;
   - com a mesma conta, o save é o MESMO (nuvem.js / contas.js).
   Dentro do app existe window.LENDA_APP (o app injeta antes dos scripts).
   Aqui: bloco "Jogar no Windows" na tela inicial (só no computador com
   Windows e fora do app) com a explicação e o botão de baixar.
   Carregar ANTES de inicio.js.
   ============================================================ */
const APP_WIN = { url: 'baixar/LendaDoCampinho.exe', tamanho: '1,3 MB', noApp: !!window.LENDA_APP };

function modalAppWindows() {
  const conta = typeof PORTAL !== 'undefined' && PORTAL.token;
  abreModal(el('h2', {}, '💻 Lenda do Campinho para Windows'),
    el('p', {}, 'Jogue numa janela só do jogo, sem abas nem barra do navegador, com atalho na Área de Trabalho.'),
    el('ul', { class: 'ar-regras' },
      el('li', {}, '🔄 Atualiza sozinho: toda novidade do jogo já aparece no aplicativo.'),
      el('li', {}, '☁️ Mesmo progresso: entre com a MESMA conta do Educação Gamer e continue de onde parou, no site ou no aplicativo.'),
      el('li', {}, '🖥️ Tela cheia de verdade: aperte F11.'),
      el('li', {}, '🌐 Precisa de internet, igual ao site.')),
    conta ? null : el('p', { class: 'nuvem-aviso' }, '⚠️ Você está jogando sem conta: o progresso deste navegador não vai junto para o aplicativo. Crie sua conta grátis (ou use o 💾 Backup para levar o arquivo).'),
    el('div', { class: 'opcoes' },
      el('a', { class: 'btn amarelo', href: APP_WIN.url, download: 'LendaDoCampinho.exe' }, `⬇️ Baixar para Windows (${APP_WIN.tamanho})`)),
    el('p', { class: 'vazio' }, 'Na primeira vez o Windows pode avisar que o aplicativo é novo ("O Windows protegeu o computador"): clique em "Mais informações" e depois em "Executar assim mesmo". Para remover: Configurações do Windows › Aplicativos › Lenda do Campinho.'));
  if (!G.rodando) $('#modal').onclick = null;
}

(function () {
  const windows = /Windows NT/i.test(navigator.userAgent);
  const celular = typeof CEL !== 'undefined' && CEL;
  const menu = document.getElementById('inicioMenu');
  if (APP_WIN.noApp || !windows || celular || !menu || document.getElementById('btnAppWin')) return;
  menu.append(el('button', { class: 'btn', id: 'btnAppWin', type: 'button', onclick: modalAppWindows }, '💻 Jogar no Windows'));
  // na grade "Explore": uma faixa baixa na largura toda (e não um bloco sozinho na última linha)
  const st = document.createElement('style');
  st.textContent = `#btnAppWin.ini-tile { grid-column: 1 / -1; flex-direction: row; align-items: center; justify-content: center; gap: 8px; min-height: 0; padding-top: 8px; padding-bottom: 8px; }
  #btnAppWin.ini-tile .ini-ic { margin: 0; }`;
  document.head.append(st);
})();
