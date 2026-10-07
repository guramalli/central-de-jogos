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
const APP_WIN = { url: 'baixar/LendaDoCampinho.exe', tamanho: '1.3 MB', noApp: !!window.LENDA_APP };

function modalAppWindows() {
  const conta = typeof PORTAL !== 'undefined' && PORTAL.token;
  abreModal(el('h2', {}, '💻 Lenda do Campinho for Windows'),
    el('p', {}, 'Play in a window just for the game, with no tabs or browser bar, and a shortcut on your Desktop.'),
    el('ul', { class: 'ar-regras' },
      el('li', {}, '🔄 Updates by itself: every new thing in the game shows up in the app right away.'),
      el('li', {}, '☁️ Same progress: sign in with the SAME Educação Gamer account and pick up where you left off, on the website or in the app.'),
      el('li', {}, '🖥️ Real full screen: press F11.'),
      el('li', {}, '🌐 Needs internet, just like the website.')),
    conta ? null : el('p', { class: 'nuvem-aviso' }, '⚠️ You\'re playing without an account: this browser\'s progress won\'t carry over to the app. Create your free account (or use 💾 Backup to bring the file along).'),
    el('div', { class: 'opcoes' },
      el('a', { class: 'btn amarelo', href: APP_WIN.url, download: 'LendaDoCampinho.exe' }, `⬇️ Download for Windows (${APP_WIN.tamanho})`)),
    el('p', { class: 'vazio' }, 'The first time, Windows may warn you that the app is new ("Windows protected your PC"): click "More info" and then "Run anyway". To remove it: Windows Settings › Apps › Lenda do Campinho.'));
  if (!G.rodando) $('#modal').onclick = null;
}

(function () {
  const windows = /Windows NT/i.test(navigator.userAgent);
  const celular = typeof CEL !== 'undefined' && CEL;
  const menu = document.getElementById('inicioMenu');
  if (APP_WIN.noApp || !windows || celular || !menu || document.getElementById('btnAppWin')) return;
  menu.append(el('button', { class: 'btn', id: 'btnAppWin', type: 'button', onclick: modalAppWindows }, '💻 Play on Windows'));
  // na grade "Explore": uma faixa baixa na largura toda (e não um bloco sozinho na última linha)
  const st = document.createElement('style');
  st.textContent = `#btnAppWin.ini-tile { grid-column: 1 / -1; flex-direction: row; align-items: center; justify-content: center; gap: 8px; min-height: 0; padding-top: 8px; padding-bottom: 8px; }
  #btnAppWin.ini-tile .ini-ic { margin: 0; }`;
  document.head.append(st);
})();
