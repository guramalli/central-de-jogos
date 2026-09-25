/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   MODO CELULAR
   Só liga em celular/tablet com tela de toque (ou com ?celular=1).
   No computador NADA muda: todo o estilo fica em body.modo-celular.
   - Jogo em tela cheia, com joystick, botões e barra de atalhos por cima
   - HUD compacto (nível, fôlego, foco, XP, tostões, minimapa) e menu ☰
   - Painéis (mochila, equipamento...) abrem numa gaveta
   - Segurar o dedo = dica do item; "Editar barra" remove atalhos
   - Instalável (ícone na tela inicial, abre em tela cheia) e mais rápido
     na segunda vez (service worker só no modo celular)
   Carregar por ÚLTIMO.
   ============================================================ */

const CEL_PREF = 'rac_celular_v1';
function prefCelular() { try { return localStorage.getItem(CEL_PREF); } catch (e) { return null; } }
function detectaCelular() {
  const p = prefCelular(); if (p === 'on') return true; if (p === 'off') return false;
  if (/[?&]celular=1/.test(location.search)) return true;
  const toque = matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints > 1 && matchMedia('(hover: none)').matches);
  return toque && Math.min(screen.width, screen.height) <= 820;
}
const CEL = detectaCelular();

if (CEL) (function () {
  document.body.classList.add('modo-celular');

  /* ---------- instalável (PWA) ---------- */
  const cab = document.head;
  const meta = (n, c) => { let m = document.querySelector(`meta[name="${n}"]`); if (!m) { m = document.createElement('meta'); m.name = n; cab.append(m); } m.content = c; };
  meta('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
  meta('theme-color', '#2b1b5e'); meta('mobile-web-app-capable', 'yes'); meta('apple-mobile-web-app-capable', 'yes');
  meta('apple-mobile-web-app-status-bar-style', 'black-translucent'); meta('apple-mobile-web-app-title', 'Lenda');
  if (!document.querySelector('link[rel=manifest]')) { const l = document.createElement('link'); l.rel = 'manifest'; l.href = 'manifest.webmanifest'; cab.append(l); }
  if (!document.querySelector('link[rel=apple-touch-icon]')) { const l = document.createElement('link'); l.rel = 'apple-touch-icon'; l.href = 'a/icone_192.png'; cab.append(l); }
  const seguro = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if ('serviceWorker' in navigator && seguro) {
    const v = ((document.querySelector('script[src*="celular.js"]') || {}).src || '').split('v=')[1] || '1';
    addEventListener('load', () => navigator.serviceWorker.register('sw.js?v=' + v).catch(() => { }));
  }

  /* ---------- HUD, menu e gaveta ---------- */
  const barra = (id, cls) => el('div', { class: 'ch-barra ' + cls }, el('i', { id }), el('span', { id: id + 'T' }));
  const hud = el('div', { id: 'celHud' },
    el('div', { class: 'ch-esq' },
      el('div', { class: 'ch-nome' }, el('b', { id: 'chNv' }, ''), ' ', el('span', { id: 'chNome' }, '')),
      barra('chHp', 'hp'), barra('chFoco', 'foco'), barra('chXp', 'xp'),
      el('div', { class: 'ch-ouro' }, el('i', { class: 'coin' }), el('b', { id: 'chOuro' }, '0'), el('span', { id: 'chMapa' }, ''))),
    el('div', { class: 'ch-dir' },
      el('button', { class: 'btn', id: 'chMenu', type: 'button', 'aria-label': 'Menu' }, '☰'),
      el('canvas', { id: 'chMini', width: 132, height: 132 })));
  const clica = sel => () => { fechaMenuCel(); const b = document.querySelector(sel); if (b) b.click(); };
  const painel = aba => () => { fechaMenuCel(); abrePaineisCel(); if (typeof abreAba === 'function') abreAba(aba); const l = document.getElementById('lateral'); if (l) l.scrollTop = 0; };
  const itensMenu = [
    ['🎒', 'Mochila', painel('mochila')], ['🧍', 'Equipamento', painel('equip')], ['⚽', 'Habilidades', painel('skills')], ['⚔️', 'Batalha', painel('batalha')],
    ['📋', 'Ficha', clica('#btnFicha')], ['🗺️', 'Mapa', clica('[data-abre="mapa"]')], ['❗', 'Missões', clica('[data-abre="missoes"]')], ['🏟️', 'Arenas', clica('#btnArenas')],
    ['✨', 'Visual', clica('#btnVisual')], ['💼', 'Carreira', clica('[data-abre="carreira"]')], ['🏆', 'Meu Time', clica('[data-abre="time"]')], ['🎴', 'Álbum', clica('[data-abre="album"]')],
    ['📊', 'Ranking', clica('[data-abre="ranking"]')], ['💾', 'Save', clica('#btnBackup')], ['🎵', 'Sons', clica('#btnAudio')], ['❓', 'Como jogar', clica('[data-abre="ajuda"]')],
    ['⛶', 'Tela cheia', () => { fechaMenuCel(); telaCheiaCel(); }], ['✏️', 'Editar barra', () => { fechaMenuCel(); alternaEdicaoBarra(); }],
    ['🔍', 'Zoom +', () => { mudaZoom(-1.5); }], ['🔎', 'Zoom −', () => { mudaZoom(1.5); }],
    ['🖥️', 'Versão PC', () => { if (confirm('Usar a versão de computador neste aparelho? (dá para voltar no menu ☰ dela, em "?")')) { try { localStorage.setItem(CEL_PREF, 'off'); } catch (e) { } location.reload(); } }],
  ];
  const menu = el('div', { id: 'celMenu', hidden: 'hidden' },
    el('div', { class: 'cm-caixa madeira' },
      el('div', { class: 'cm-topo' }, el('b', {}, 'Menu'), el('button', { class: 'btn mini', type: 'button', onclick: () => fechaMenuCel() }, '✕ Fechar')),
      el('div', { class: 'cm-grade' }, ...itensMenu.map(([ic, nome, fn]) => el('button', { class: 'btn cm-bt', type: 'button', onclick: fn }, el('span', { class: 'cm-ic' }, ic), nome)))));
  menu.addEventListener('click', ev => { if (ev.target === menu) fechaMenuCel(); });
  const fechaPaineis = el('button', { class: 'btn amarelo', id: 'celFechaPaineis', type: 'button', onclick: () => fechaPaineisCel() }, '✕ Voltar ao jogo');
  const pag = el('button', { class: 'btn mini', id: 'celPag', type: 'button', title: 'Trocar a fileira da barra' }, '⇅ 2ª');
  pag.addEventListener('click', () => { const hb = $('#hotbar'); const p2 = hb.classList.toggle('pag2'); pag.textContent = p2 ? '⇅ 1ª' : '⇅ 2ª'; });
  const editando = el('div', { id: 'celEditando', hidden: 'hidden' }, '✏️ Toque num atalho para tirá-lo da barra · ', el('button', { class: 'btn mini amarelo', type: 'button', onclick: () => alternaEdicaoBarra(false) }, 'Pronto'));
  document.getElementById('app').append(hud, menu, fechaPaineis, editando);
  const ba = document.getElementById('barraAcoes'); if (ba) ba.append(pag);
  $('#chMenu').addEventListener('click', () => { menu.hidden = false; });

  window.fechaMenuCel = () => { menu.hidden = true; };
  window.abrePaineisCel = () => { document.body.classList.add('cel-paineis'); };
  window.fechaPaineisCel = () => { document.body.classList.remove('cel-paineis'); if (typeof escondeTip === 'function') escondeTip(); };
  window.telaCheiaCel = () => {
    const d = document.documentElement; const pede = d.requestFullscreen || d.webkitRequestFullscreen;
    if (!document.fullscreenElement && pede) Promise.resolve(pede.call(d, { navigationUI: 'hide' })).then(() => { try { screen.orientation.lock('landscape').catch(() => { }); } catch (e) { } }).catch(() => { });
    else if (document.exitFullscreen) document.exitFullscreen().catch(() => { });
  };
  window.alternaEdicaoBarra = (liga) => {
    const on = liga === undefined ? !document.body.classList.contains('cel-editar') : liga;
    document.body.classList.toggle('cel-editar', on); editando.hidden = !on;
  };
  // editando: tocar num atalho tira ele da barra
  document.getElementById('hotbar').addEventListener('click', ev => {
    if (!document.body.classList.contains('cel-editar')) return;
    const slot = ev.target.closest('.slot'); if (!slot) return;
    ev.stopImmediatePropagation(); ev.preventDefault();
    const i = [...slot.parentNode.children].indexOf(slot); if (i >= 0 && G.save) { G.save.hotbar[i] = null; G.uiSujo = true; }
  }, true);

  /* ---------- atualiza HUD ---------- */
  const _atualizaBarrasCel = atualizaBarras;
  atualizaBarras = function () {
    _atualizaBarrasCel();
    const s = G.save; if (!s) return; const st = stats();
    const a = xpPara(s.nivel), b = xpPara(s.nivel + 1);
    $('#chHp').style.width = (s.hp / st.maxHp * 100) + '%'; $('#chHpT').textContent = `${fmt(s.hp)}/${fmt(st.maxHp)}`;
    $('#chFoco').style.width = (s.foco / st.maxFoco * 100) + '%'; $('#chFocoT').textContent = `${fmt(s.foco)}/${fmt(st.maxFoco)}`;
    $('#chXp').style.width = ((s.xp - a) / (b - a) * 100) + '%'; $('#chXpT').textContent = `${Math.floor((s.xp - a) / (b - a) * 100)}%`;
    $('#chNv').textContent = 'Nv ' + s.nivel; $('#chNome').textContent = s.nome;
    $('#chOuro').textContent = fmt(s.ouro); $('#chMapa').textContent = G.mapa ? ' · ' + G.mapa.nome.split(' — ')[0] : '';
  };
  // minimapa pequeno no canto (cópia do minimapa do painel)
  setInterval(() => {
    if (!G.rodando || document.body.classList.contains('cel-paineis')) return;
    const src = document.getElementById('mini'), dst = document.getElementById('chMini'); if (!src || !dst || !src.width) return;
    const x = dst.getContext('2d'); x.clearRect(0, 0, dst.width, dst.height);
    const s = Math.min(dst.width / src.width, dst.height / src.height); const w = src.width * s, h = src.height * s;
    x.drawImage(src, (dst.width - w) / 2, (dst.height - h) / 2, w, h);
  }, 350);
  // a altura da tela é a tela inteira: não deixa o ajuste do computador mexer
  if (typeof encaixaTela === 'function') { encaixaTela = function () { const t = document.getElementById('tela'); if (t) { t.style.height = ''; t.style.aspectRatio = ''; } }; }
  const _iniciarJogoCel = iniciarJogo;
  iniciarJogo = async function (...a) {
    const r = await _iniciarJogoCel.apply(this, a); document.body.classList.add('cel-jogando');
    setTimeout(() => { try { ajustaCanvas(); atualizaBarras(); } catch (e) { } }, 100);
    if (innerHeight > innerWidth) log('📱 Dica: deite o celular para ver mais do campo! Menu ☰ → Tela cheia deixa ainda melhor.', 'l-sis');
    return r;
  };
  addEventListener('resize', () => { setTimeout(() => { try { if (G.rodando) ajustaCanvas(); } catch (e) { } }, 60); });

  /* ---------- segurar o dedo = dica do item ---------- */
  let tipTimer = null, tipDe = null, bloqueiaClique = 0;
  document.addEventListener('touchstart', ev => {
    if (typeof escondeTip === 'function') escondeTip();
    clearTimeout(tipTimer); const t = ev.touches[0]; if (!t) return;
    let alvo = ev.target; while (alvo && alvo !== document.body && !alvo._tip) alvo = alvo.parentNode;
    if (!alvo || !alvo._tip) return;
    tipDe = { x: t.clientX, y: t.clientY };
    tipTimer = setTimeout(() => { try { mostraTip({ clientX: tipDe.x, clientY: tipDe.y - 20 }, alvo._tip()); bloqueiaClique = Date.now(); if (navigator.vibrate) navigator.vibrate(15); } catch (e) { } }, 450);
  }, { passive: true, capture: true });
  document.addEventListener('touchmove', ev => { const t = ev.touches[0]; if (tipDe && t && Math.hypot(t.clientX - tipDe.x, t.clientY - tipDe.y) > 12) clearTimeout(tipTimer); }, { passive: true, capture: true });
  document.addEventListener('touchend', () => clearTimeout(tipTimer), { passive: true, capture: true });
  document.addEventListener('click', ev => { if (Date.now() - bloqueiaClique < 700) { ev.stopPropagation(); ev.preventDefault(); bloqueiaClique = 0; } }, true);
  document.addEventListener('contextmenu', ev => { if (ev.target.closest && ev.target.closest('#app')) ev.preventDefault(); }, true); // segurar não abre o menu do navegador

  /* ---------- estilo (só no modo celular) ---------- */
  const st = document.createElement('style');
  st.textContent = `
  body.modo-celular { -webkit-tap-highlight-color: transparent; }
  body.modo-celular.cel-jogando { overflow: hidden; overscroll-behavior: none; position: fixed; inset: 0; }
  body.modo-celular #app .btn, body.modo-celular #celMenu .btn { touch-action: manipulation; }
  body.modo-celular #topo { display: none !important; }
  body.modo-celular #principal { display: block !important; padding: 0 !important; max-width: none !important; }
  body.modo-celular #colJogo { container-type: normal !important; display: block !important; }
  body.modo-celular #tela { position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100dvh !important; aspect-ratio: auto !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; z-index: 1; }
  body.modo-celular #lateral, body.modo-celular #lateralEsq { display: none !important; }
  /* HUD */
  body.modo-celular #celHud { position: fixed; z-index: 6; top: calc(6px + env(safe-area-inset-top)); left: calc(6px + env(safe-area-inset-left)); right: calc(6px + env(safe-area-inset-right)); display: flex; justify-content: space-between; align-items: flex-start; pointer-events: none; }
  #celHud .ch-esq { width: 190px; background: rgba(20,10,40,.62); border: 2px solid rgba(184,115,58,.8); border-radius: 10px; padding: 4px 6px 5px; pointer-events: auto; }
  #celHud .ch-nome { font-size: 12.5px; color: #ffe14a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2; margin-bottom: 2px; }
  #celHud .ch-nome span { color: #fff6e0; }
  #celHud .ch-barra { position: relative; height: 11px; background: rgba(0,0,0,.5); border-radius: 6px; margin-top: 3px; overflow: hidden; }
  #celHud .ch-barra i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 6px; transition: width .15s; }
  #celHud .ch-barra.hp i { background: linear-gradient(#ff7a6a, #d8303a); } #celHud .ch-barra.foco i { background: linear-gradient(#7ab8ff, #2a6ad9); } #celHud .ch-barra.xp i { background: linear-gradient(#a8f07a, #3aa83a); }
  #celHud .ch-barra.xp { height: 7px; }
  #celHud .ch-barra span { position: relative; display: block; text-align: center; font-size: 9px; line-height: 11px; color: #fff; font-weight: 800; text-shadow: 0 1px 1px #000; }
  #celHud .ch-barra.xp span { display: none; }
  #celHud .ch-ouro { font-size: 11.5px; color: #fff6e0; margin-top: 3px; display: flex; align-items: center; gap: 4px; white-space: nowrap; overflow: hidden; }
  #celHud .ch-dir { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; pointer-events: auto; }
  #chMenu { width: 46px; height: 42px; font-size: 22px; padding: 0; }
  #chMini { width: 92px; height: 92px; border-radius: 10px; border: 2px solid rgba(184,115,58,.8); background: rgba(20,10,40,.5); }
  /* chat: só as últimas linhas, por cima do jogo */
  body.modo-celular #log { position: fixed; z-index: 4; top: calc(6px + env(safe-area-inset-top)); left: 50%; transform: translateX(-50%); width: min(40vw, 400px); height: 48px; overflow: hidden; background: rgba(10,4,24,.42); border: 0; border-radius: 8px; font-size: 11px; line-height: 1.3; padding: 3px 7px; pointer-events: none; }
  body.modo-celular #log div { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  body.modo-celular #rastreador { top: 100px; left: calc(6px + env(safe-area-inset-left)); max-width: 36vw; }
  body.modo-celular .cartao-dica { pointer-events: auto; font-size: 12px; max-width: 46vw; }
  /* controles */
  body.modo-celular #toque { display: block !important; position: fixed; z-index: 5; left: calc(14px + env(safe-area-inset-left)); bottom: calc(12px + env(safe-area-inset-bottom)); padding: 0; background: none; }
  body.modo-celular #joy { width: 128px; height: 128px; touch-action: none; }
  body.modo-celular .joy-base { width: 128px; height: 128px; border-radius: 50%; background: rgba(30,18,60,.4); border: 3px solid var(--madeira3); position: relative; box-sizing: border-box; }
  body.modo-celular .joy-bot { position: absolute; left: 35px; top: 35px; width: 52px; height: 52px; border-radius: 50%; background: var(--amarelo); border: 3px solid var(--madeira2); transition: transform .05s; box-sizing: border-box; }
  body.modo-celular .toque-acoes { position: fixed; z-index: 5; right: calc(10px + env(safe-area-inset-right)); bottom: calc(12px + env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: 6px; }
  body.modo-celular .toque-acoes .btn { min-width: 92px; padding: 9px 8px; font-size: 13.5px; opacity: .93; }
  body.modo-celular #tFalar { padding: 14px 8px; font-size: 15px; }
  body.modo-celular #barraAcoes { position: fixed; z-index: 5; right: calc(114px + env(safe-area-inset-right)); bottom: calc(10px + env(safe-area-inset-bottom)); display: flex !important; flex-direction: row !important; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: 4px; width: 250px; }
  body.modo-celular #barraAcoes > .btn { min-width: 0 !important; width: auto; padding: 5px 7px; font-size: 11px; white-space: nowrap; opacity: .93; margin: 0; flex: 0 0 auto; }
  body.modo-celular #hotbar { order: 9; flex: 0 0 100%; display: grid !important; grid-template-columns: repeat(5, 46px) !important; grid-auto-rows: 46px; gap: 4px; min-width: 0 !important; justify-content: end; }
  body.modo-celular #hotbar .slot { width: 46px; height: 46px; opacity: .95; }
  body.modo-celular #hotbar .slot:nth-child(n+11) { display: none; }
  body.modo-celular #hotbar.pag2 .slot:nth-child(-n+10) { display: none; }
  body.modo-celular #hotbar.pag2 .slot:nth-child(n+11) { display: flex; }
  body.modo-celular .slot .tecla { display: block !important; font-size: 9px; }
  body.cel-editar #hotbar .slot { animation: celTreme .35s ease-in-out infinite alternate; border-color: #ff5a4a !important; }
  @keyframes celTreme { from { transform: rotate(-3deg); } to { transform: rotate(3deg); } }
  #celEditando { position: fixed; z-index: 7; left: 50%; transform: translateX(-50%); top: 60px; background: #fff2d0; color: #3b2410; border: 2px solid #8a4b24; border-radius: 10px; padding: 6px 10px; font-size: 13px; font-weight: 800; }
  /* menu ☰ */
  #celMenu { position: fixed; inset: 0; z-index: 40; background: rgba(10,4,24,.6); display: flex; align-items: center; justify-content: center; padding: 8px; }
  #celMenu[hidden] { display: none; }
  #celMenu .cm-caixa { width: min(720px, 96vw); max-height: calc(100dvh - 16px); overflow-y: auto; padding: 10px 12px; background: var(--papel); border-radius: 14px; }
  #celMenu .cm-topo { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; color: #5e2f14; font-size: 18px; }
  #celMenu .cm-grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 7px; }
  #celMenu .cm-bt { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 8px 4px; font-size: 13px; }
  #celMenu .cm-ic { font-size: 22px; line-height: 1; }
  /* gaveta de painéis */
  #celFechaPaineis { display: none; }
  body.modo-celular.cel-paineis #lateral { display: flex !important; flex-direction: column; position: fixed; z-index: 30; top: 0; bottom: 0; right: 0; width: min(390px, 100vw); max-height: none !important; overflow-y: auto; padding: 8px calc(8px + env(safe-area-inset-right)) 60px 8px; background: rgba(43,27,94,.97); box-shadow: -6px 0 20px rgba(0,0,0,.5); }
  body.modo-celular.cel-paineis #lateralEsq:not(.vazia) { display: flex !important; flex-direction: column; position: fixed; z-index: 30; top: 0; bottom: 0; left: 0; width: min(390px, 100vw); overflow-y: auto; padding: 8px 8px 60px calc(8px + env(safe-area-inset-left)); background: rgba(43,27,94,.97); }
  body.modo-celular.cel-paineis #celFechaPaineis { display: block; position: fixed; z-index: 31; bottom: calc(10px + env(safe-area-inset-bottom)); right: calc(14px + env(safe-area-inset-right)); padding: 10px 16px; }
  body.modo-celular.cel-paineis #lateral .grip, body.modo-celular.cel-paineis #lateral .bloco-volta { display: none !important; }
  body.modo-celular.cel-paineis [data-painel="perfil"], body.modo-celular.cel-paineis [data-painel="mini"] { display: none !important; } /* já estão no HUD */
  /* janelas cabem na tela */
  body.modo-celular #modal { padding: 6px; }
  body.modo-celular .modal-caixa { max-height: calc(100dvh - 12px) !important; width: min(96vw, 760px) !important; padding: 10px 12px !important; }
  body.modo-celular .tip-item { max-width: 78vw; }
  /* celular em pé: controles embaixo, barra acima deles */
  @media (orientation: portrait) {
    body.modo-celular #celHud .ch-esq { width: 170px; }
    body.modo-celular #log { top: calc(150px + env(safe-area-inset-top)); left: 8px; right: 8px; transform: none; width: auto; }
    body.modo-celular #barraAcoes { right: 50%; transform: translateX(50%); bottom: calc(150px + env(safe-area-inset-bottom)); width: min(330px, 94vw); justify-content: center; }
    body.modo-celular #hotbar { justify-content: center; }
    body.modo-celular #rastreador { top: calc(206px + env(safe-area-inset-top)); max-width: 62vw; }
    body.modo-celular .cartao-dica { max-width: 70vw; }
  }
  /* telas bem baixas (celular deitado pequeno) */
  @media (max-height: 380px) {
    body.modo-celular #hotbar { grid-template-columns: repeat(5, 40px) !important; grid-auto-rows: 40px; }
    body.modo-celular #hotbar .slot { width: 40px; height: 40px; }
    body.modo-celular #chMini { width: 76px; height: 76px; }
    body.modo-celular .toque-acoes .btn { padding: 7px 6px; font-size: 12.5px; min-width: 84px; }
    body.modo-celular #barraAcoes { right: calc(104px + env(safe-area-inset-right)); }
  }
  `;
  document.head.append(st);
})();

// no computador, o "?" ganha um jeito de voltar para o modo celular (só aparece em tela de toque)
if (!CEL && prefCelular() === 'off' && typeof modalAjuda === 'function') {
  const _modalAjudaCel = modalAjuda;
  modalAjuda = function () { _modalAjudaCel(); const box = document.getElementById('modalConteudo'); if (box) box.append(el('div', { class: 'opcoes' }, el('button', { class: 'btn amarelo', type: 'button', onclick: () => { try { localStorage.removeItem(CEL_PREF); } catch (e) { } location.reload(); } }, '📱 Voltar para o modo celular'))); };
}
