/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   CELULAR 2 (v145): mais leve e mais fácil de jogar no celular
   - Botões sem letras de teclado ("X · Drible" → "🦶 Drible")
   - Barra de atalhos: 1 fileira de 5 por vez (botão troca a página)
   - Mensagens: 2 linhas que somem sozinhas
   - MODO LEVE: 30 quadros/s, resolução um pouco menor e sem balanço das
     árvores. Liga sozinho se o aparelho estiver lento (e no menu ☰).
   - Com uma janela aberta (loja, mochila...), o campo quase não é
     redesenhado (economiza bateria).
   Só vale no modo celular. Carregar DEPOIS de celular.js.
   ============================================================ */
if (typeof CEL !== 'undefined' && CEL) (function () {
  const PREF_LEVE = 'rac_leve_v1';
  const lePref = () => { try { return localStorage.getItem(PREF_LEVE); } catch (e) { return null; } };
  function aplicaLeve(on, avisa) {
    G.leve = !!on; G.dprMax = on ? 1.5 : 2; if (typeof VENTO !== 'undefined') VENTO.on = !on;
    try { if (G.rodando) ajustaCanvas(); } catch (e) { }
    const b = document.getElementById('cmLeve'); if (b) b.lastChild.textContent = on ? 'Modo leve: SIM' : 'Modo leve: não';
    if (avisa) log(on ? '⚡ Modo leve ligado: o jogo fica mais liso e gasta menos bateria.' : '✨ Modo leve desligado: gráficos completos.', 'l-sis');
  }
  const pref = lePref(); aplicaLeve(pref === 'on', false);

  // ---------- desenho: 30 quadros/s no modo leve; quase parado com janela aberta ----------
  let ultimo = 0, dtAcum = 0;
  const _desenhaCel2 = desenha;
  desenha = function (dt) {
    const agora = performance.now(); dtAcum += dt || 0;
    const modal = G.pausado && !document.getElementById('modal').hidden;
    if (modal && agora - ultimo < 250) return;
    if (G.leve && agora - ultimo < 30) return;
    ultimo = agora; const d = dtAcum; dtAcum = 0;
    return _desenhaCel2.call(this, Math.min(100, d));
  };

  // ---------- mede se o aparelho aguenta (só se a pessoa não escolheu) ----------
  function medeDesempenho() {
    if (lePref() !== null || G.leve) return;
    const amostras = []; let ant = 0, fim = performance.now() + 6000;
    const passo = ts => {
      if (!G.rodando) return;
      if (ant && !G.pausado && document.visibilityState === 'visible') amostras.push(ts - ant);
      ant = ts;
      if (performance.now() < fim) return requestAnimationFrame(passo);
      if (amostras.length < 60) return; // pouca amostra (janela aberta, aba escondida): tenta outra vez mais tarde
      amostras.sort((a, b) => a - b); const med = amostras[amostras.length >> 1];
      if (med > 24) aplicaLeve(true, true); // abaixo de ~40 quadros/s
    };
    setTimeout(() => requestAnimationFrame(passo), 4000); // deixa o mapa carregar primeiro
  }
  const _iniciarJogoCel2 = iniciarJogo;
  iniciarJogo = async function (...a) { const r = await _iniciarJogoCel2.apply(this, a); medeDesempenho(); return r; };

  // ---------- botões sem letras de teclado ----------
  const _atualizaPaineisCel2 = atualizaPaineis;
  atualizaPaineis = function () {
    const r = _atualizaPaineisCel2.apply(this, arguments);
    const bm = document.getElementById('btnModo'); if (bm) bm.textContent = G.modo === 'drible' ? '🦶 Drible' : '⚽ Chute';
    const bc = document.getElementById('btnCaca'); if (bc) bc.textContent = G.caca ? '🎯 Caça: SIM' : '🎯 Caça: não';
    const dm = document.querySelector('#mochila > .vazio'); if (dm && /Botão direito/.test(dm.textContent)) dm.textContent = 'Toque num item para ver e usar / equipar.';
    return r;
  };

  // ---------- textos sem "tecla X" (no celular não tem teclado) ----------
  const semTecla = t => typeof t !== 'string' ? t : t
    .replace(/\s*\((?:tecla|teclas)\s[^)]*\)/gi, '')
    .replace(/aperte a tecla/gi, 'toque no botão')
    .replace(/\(ou botão direito\)\s*/gi, '')
    // v150b: mais textos de computador
    .replace(/Arraste por cima de um atalho para trocar, ou clique com o botão direito para liberar\.?/gi, 'Use Menu ☰ › Editar barra para liberar um espaço.')
    .replace(/Clique com o botão direito num atalho para liberar\.?/gi, 'Use Menu ☰ › Editar barra para liberar um espaço.')
    .replace(/aperte E\b/g, 'toque em Falar / Usar')
    .replace(/Aperte C \(ou o botão Ficha\)/g, 'Abra a Ficha (menu ☰)').replace(/Aperte C\b/g, 'Abra a Ficha (menu ☰)')
    .replace(/Aperte U para abrir a Carreira/g, 'Abra a Carreira (menu ☰)').replace(/Aperte U\b/g, 'Abra a Carreira (menu ☰)')
    .replace(/Aperte P para subir e descer( do skate)?/g, 'Toque em Montar para subir e descer$1').replace(/Aperte P\b/g, 'Toque em Montar')
    .replace(/Aperte R para beber isotônico/g, 'Use o isotônico da barra de atalhos')
    .replace(/aperte X \(ou o botão "Modo"\)/g, 'toque no botão Drible / Chute')
    .replace(/aperte ESPAÇO \(ou toque no campo\)/g, 'toque no campo (ou em 🎯 Alvo)').replace(/aperte ESPAÇO\)/g, 'toque em 🎯 Alvo)').replace(/aperte ESPAÇO \(ou clique\)/g, 'toque na tela')
    .replace(/\s*\((?:E|Q|V|X|G|C|I|M|J|F|R|U)\)/g, '');
  const _logCel2 = log; log = function (m, ...r) { return _logCel2.call(this, semTecla(m), ...r); };
  const _bannerCel2 = banner; banner = function (a, b) { return _bannerCel2.call(this, semTecla(a), semTecla(b)); };
  if (typeof dica === 'function') { const _dicaCel2 = dica; dica = function (id, txt, ...r) { return _dicaCel2.call(this, id, semTecla(txt), ...r); }; }
  // janelas também (ex.: "habilidade especial (tecla Q)")
  const _abreModalCel2 = abreModal;
  abreModal = function () {
    const r = _abreModalCel2.apply(this, arguments);
    const box = document.getElementById('modalConteudo');
    if (box) { const tw = document.createTreeWalker(box, NodeFilter.SHOW_TEXT); for (let n = tw.nextNode(); n; n = tw.nextNode()) if (/tecla/i.test(n.nodeValue)) n.nodeValue = semTecla(n.nodeValue); }
    return r;
  };

  // ---------- vários dedos ao mesmo tempo (v147) ----------
  // O navegador só gera "click"/"mousedown" quando há UM dedo na tela: com o dedo
  // no joystick, os botões e o toque no campo não respondiam. Aqui:
  // - o joystick segue o SEU dedo (identifier), não "o primeiro dedo da tela";
  // - botões do jogo e o campo agem no fim do toque, sem esperar o clique do navegador.
  const toque = document.getElementById('toque'), joy = document.getElementById('joy');
  if (toque && joy) {
    let joyId = null;
    const acha = lista => { for (const t of lista) if (t.identifier === joyId) return t; return null; };
    const mv = t => {
      const base = joy.querySelector('.joy-base'), bot = joy.querySelector('.joy-bot'); if (!base) return;
      const r = base.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let dx = (t.clientX - cx) / (r.width / 2), dy = (t.clientY - cy) / (r.height / 2); const d = Math.hypot(dx, dy); if (d > 1) { dx /= d; dy /= d; }
      G.joy = d < 0.15 ? null : { x: dx, y: dy }; if (bot) bot.style.transform = `translate(${dx * 30}px, ${dy * 30}px)`;
    };
    const solta = () => { joyId = null; G.joy = null; const bot = joy.querySelector('.joy-bot'); if (bot) bot.style.transform = ''; };
    // na captura do #toque: os ouvintes antigos do #joy (game.js) não recebem mais nada
    toque.addEventListener('touchstart', e => {
      if (!joy.contains(e.target)) return; e.stopPropagation(); e.preventDefault();
      if (joyId === null) { const t = e.changedTouches[0]; joyId = t.identifier; mv(t); }
    }, { capture: true, passive: false });
    toque.addEventListener('touchmove', e => {
      if (!joy.contains(e.target)) return; e.stopPropagation(); e.preventDefault();
      const t = joyId !== null && acha(e.changedTouches); if (t) mv(t);
    }, { capture: true, passive: false });
    const fim = e => { if (!joy.contains(e.target)) return; e.stopPropagation(); if (joyId !== null && acha(e.changedTouches)) solta(); };
    toque.addEventListener('touchend', fim, true); toque.addEventListener('touchcancel', fim, true);
    addEventListener('blur', solta);
  }
  const SEL_TOQUE = '#toque button, #barraAcoes button, #barraAcoes .slot, #celHud button';
  const toques = new Map(); // dedo → onde começou
  const temDica = el => { for (let a = el; a && a !== document.body; a = a.parentNode) if (a._tip) return true; return false; };
  document.addEventListener('touchstart', e => {
    if (!G.rodando) return;
    for (const t of e.changedTouches) {
      const alvo = t.target; if (!alvo || !alvo.closest) continue;
      const bt = alvo.closest(SEL_TOQUE), cv = alvo === CV;
      if (bt || cv) toques.set(t.identifier, { el: bt || CV, cv, x: t.clientX, y: t.clientY, t: performance.now(), dica: bt ? temDica(alvo) : false });
    }
  }, { capture: true, passive: true });
  document.addEventListener('touchend', e => {
    for (const t of e.changedTouches) {
      const r = toques.get(t.identifier); if (!r) continue; toques.delete(t.identifier);
      const longe = Math.hypot(t.clientX - r.x, t.clientY - r.y) > (r.cv ? 14 : 30);
      const segurou = performance.now() - r.t > (r.dica ? 420 : 1200); // segurar um atalho = dica do item (celular.js)
      if (longe || segurou) continue;
      if (e.cancelable) e.preventDefault(); // sem o clique do navegador: quem clica somos nós (uma vez só)
      if (r.cv) CV.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window, clientX: t.clientX, clientY: t.clientY, button: 0 }));
      else if (!r.el.disabled) r.el.click();
    }
  }, { capture: true, passive: false });
  document.addEventListener('touchcancel', e => { for (const t of e.changedTouches) toques.delete(t.identifier); }, true);

  // ---------- v150b: tutorial com joystick e botões (não "W A S D" / "aperte E") ----------
  if (typeof TUTORIAL !== 'undefined') {
    const T = [
      ['Use o JOYSTICK (o círculo embaixo, à esquerda) para andar. Também dá pra tocar no chão.', 'Joystick'],
      ['Fale com a sua MÃE: chegue perto dela e toque em FALAR / USAR.', 'Falar'],
      ['Saia de casa pela porta (embaixo) e abra o BAÚ do quintal: chegue perto e toque em FALAR / USAR.', 'Falar'],
      ['Achou sua bola! Volte para casa e ENTREGUE a missão para a Mãe (FALAR / USAR).', 'Falar'],
      ['Sua bola e os tostões foram para a MOCHILA (botão 🎒 embaixo do mapinha). Tudo que você ganha fica lá.', null, '#chMochila'],
      [null, 'Falar'],
      ['TOQUE num Pombo Folgado para desafiá-lo (ou use o botão 🎯 ALVO). Você corre até ele e dribla sozinho!', 'Toque'],
    ];
    T.forEach(([txt, tecla, dest], i) => { const st = TUTORIAL[i]; if (!st) return; if (txt) st.txt = txt; if (tecla && st.tecla) st.tecla = tecla; if (dest) st.destaque = dest; });
  }
  // dica flutuante dos itens (segurar o dedo): "Botão direito: EQUIPAR" → como é no celular
  if (typeof mostraTip === 'function') {
    const _mostraTipCel2 = mostraTip;
    mostraTip = function (ev, conteudo) {
      if (conteudo && conteudo.nodeType) { const tw = document.createTreeWalker(conteudo, NodeFilter.SHOW_TEXT); for (let n = tw.nextNode(); n; n = tw.nextNode()) if (/Botão direito|botão direito|arraste/i.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/Botão direito:\s*/g, 'Toque no item: ').replace(/\s*·\s*arraste para a barra/gi, '').replace(/\s*[—-]?\s*botão direito remove\.?/gi, ''); }
      return _mostraTipCel2.call(this, ev, conteudo);
    };
  }

  // ---------- barra de atalhos: páginas de 5 ----------
  const hb = document.getElementById('hotbar'); const pag = document.getElementById('celPag');
  if (hb) hb.dataset.pag = '0';
  const rotPag = p => `▦ ${p * 5 + 1}-${p * 5 + 5}`;
  if (pag && hb) {
    const novo = pag.cloneNode(false); novo.textContent = rotPag(0); novo.title = 'Mostrar os próximos 5 atalhos'; pag.replaceWith(novo);
    novo.addEventListener('click', () => { const p = (+hb.dataset.pag + 1) % 4; hb.dataset.pag = String(p); novo.textContent = rotPag(p); });
  }

  // ---------- mensagens: somem sozinhas ----------
  const logEl = document.getElementById('log');
  if (logEl) {
    let t = null;
    new MutationObserver(() => { logEl.classList.remove('cel-some'); clearTimeout(t); t = setTimeout(() => logEl.classList.add('cel-some'), 5000); }).observe(logEl, { childList: true });
  }

  // ---------- seta guia (missão) só na área livre do campo ----------
  const margensGuia = () => { G.guiaMg = innerHeight > innerWidth ? { t: 215, b: 360, l: 26, r: 26 } : { t: 60, b: 70, l: 215, r: 235 }; };
  margensGuia(); addEventListener('resize', margensGuia);

  // ---------- menu ☰: modo leve ----------
  const grade = document.querySelector('#celMenu .cm-grade');
  if (grade && !document.getElementById('cmLeve')) {
    const b = el('button', { class: 'btn cm-bt', id: 'cmLeve', type: 'button', onclick: () => { const on = !G.leve; try { localStorage.setItem(PREF_LEVE, on ? 'on' : 'off'); } catch (e) { } aplicaLeve(on, true); } },
      el('span', { class: 'cm-ic' }, '⚡'), G.leve ? 'Modo leve: SIM' : 'Modo leve: não');
    grade.append(b);
  }

  // ---------- pontos para distribuir (v149): selo no ☰, "Ficha +N" no menu e etiqueta no painel ----------
  const chPontos = el('button', { class: 'btn', id: 'chPontos', type: 'button', hidden: 'hidden', onclick: () => { const b = document.getElementById('btnFicha'); if (b) b.click(); } });
  const chEsq = document.querySelector('#celHud .ch-esq'); if (chEsq) chEsq.append(chPontos);
  const fichaMenu = grade && [...grade.children].find(b => /Ficha/.test(b.textContent));
  let pontosAntes = -1;
  const _atualizaBarrasCel2 = atualizaBarras;
  atualizaBarras = function () {
    const r = _atualizaBarrasCel2.apply(this, arguments);
    const p = (G.save && G.save.pontos) || 0; if (p === pontosAntes) return r; pontosAntes = p;
    chPontos.hidden = !p; chPontos.textContent = `⭐ Distribuir ${p} ponto${p > 1 ? 's' : ''}`;
    const bm = document.getElementById('chMenu'); if (bm) { if (p) bm.dataset.pontos = p; else delete bm.dataset.pontos; }
    if (fichaMenu) { fichaMenu.classList.toggle('cm-pontos', !!p); fichaMenu.lastChild.textContent = p ? `Ficha +${p}` : 'Ficha'; }
    return r;
  };

  // ---------- v150: Mochila e Equipamento a um toque (embaixo do minimapa) ----------
  const abrePainel = aba => { if (typeof fechaMenuCel === 'function') fechaMenuCel(); if (typeof abrePaineisCel === 'function') abrePaineisCel(); if (typeof abreAba === 'function') abreAba(aba); const l = document.getElementById('lateral'); if (l) l.scrollTop = 0; };
  const chDir = document.querySelector('#celHud .ch-dir');
  if (chDir && !document.getElementById('chRapido')) chDir.append(el('div', { id: 'chRapido' },
    el('button', { class: 'btn', type: 'button', id: 'chMochila', 'aria-label': 'Mochila', onclick: () => abrePainel('mochila') }, '🎒'),
    el('button', { class: 'btn', type: 'button', id: 'chEquip', 'aria-label': 'Equipamento', onclick: () => abrePainel('equip') }, '🧍')));
  // botão de atacar (Alvo) diferente dos outros: vermelho, com a mira
  const tAlvo = document.getElementById('tAlvo'); if (tAlvo) tAlvo.textContent = '🎯 Alvo';

  // ---------- menu ☰: "Sair" sempre por último (outros arquivos põem botões depois) ----------
  if (grade) {
    const sairFim = () => { const s = document.getElementById('cmSair'); if (s && grade.lastElementChild !== s) grade.append(s); };
    new MutationObserver(sairFim).observe(grade, { childList: true }); sairFim();
  }

  // ---------- estilo ----------
  const st = document.createElement('style');
  st.textContent = `
  /* atalhos: 1 fileira de 5, maiores */
  body.modo-celular #hotbar[data-pag] .slot { display: none !important; }
  body.modo-celular #hotbar[data-pag="0"] .slot:nth-child(-n+5),
  body.modo-celular #hotbar[data-pag="1"] .slot:nth-child(n+6):nth-child(-n+10),
  body.modo-celular #hotbar[data-pag="2"] .slot:nth-child(n+11):nth-child(-n+15),
  body.modo-celular #hotbar[data-pag="3"] .slot:nth-child(n+16):nth-child(-n+20) { display: flex !important; }
  body.modo-celular #hotbar { grid-template-columns: repeat(5, 50px) !important; grid-auto-rows: 50px; flex: 0 0 auto !important; }
  body.modo-celular #barraAcoes { width: 344px !important; max-width: calc(100vw - 20px); justify-content: flex-end !important; }
  body.modo-celular #celPag { order: 10; min-height: 50px !important; width: 46px; padding: 2px !important; font-size: 11px !important; line-height: 1.1; white-space: normal !important; }
  body.modo-celular #hotbar .slot { width: 50px; height: 50px; }
  body.modo-celular #btnClasse .tecla, body.modo-celular #hotbar .slot .tecla { display: none !important; }
  /* botões de modo: altura boa para o dedo */
  body.modo-celular #barraAcoes > .btn { min-height: 40px; font-size: 12.5px !important; padding: 6px 10px !important; }
  /* Mochila / Equipamento a um toque */
  body.modo-celular #chRapido { display: flex; gap: 6px; margin-top: 6px; justify-content: flex-end; }
  body.modo-celular #chRapido .btn { width: 46px; height: 46px; padding: 0 !important; font-size: 22px !important; line-height: 1; border-radius: 12px; }
  /* Alvo = atacar: vermelho e com mira, para não confundir com os outros */
  body.modo-celular #tAlvo { background: linear-gradient(#ef5a4c, #b8281d) !important; color: #fff !important; border-color: #6e150e !important; box-shadow: 0 3px 0 #6e150e !important; text-shadow: 0 1px 0 rgba(0,0,0,.35); font-weight: 800; }
  /* pontos para distribuir */
  body.modo-celular #chPontos { display: block; margin-top: 4px; padding: 4px 9px !important; min-height: 30px; font-size: 12px !important; font-weight: 800; background: #f5b82e !important; color: #3d2410 !important; border: 2px solid #6b3f1d !important; border-radius: 10px; animation: chPisca 1.6s ease-in-out infinite; }
  body.modo-celular #chPontos[hidden] { display: none; }
  body.modo-celular #chMenu { position: relative; }
  body.modo-celular #chMenu[data-pontos]::after { content: attr(data-pontos); position: absolute; top: -6px; right: -6px; min-width: 20px; height: 20px; padding: 0 4px; border-radius: 10px; background: #e03a3a; color: #fff; font: 800 12px/20px system-ui, sans-serif; border: 2px solid #fff; box-sizing: border-box; }
  body.modo-celular .cm-bt.cm-pontos { background: #f5b82e !important; color: #3d2410 !important; box-shadow: 0 0 0 2px #fff inset; }
  @keyframes chPisca { 50% { transform: scale(1.05); filter: brightness(1.12); } }
  /* botão "Entendi" das dicas: bom para o dedo */
  body.modo-celular .cartao-dica .btn { min-height: 38px; min-width: 96px; }
  /* mensagens: 2 linhas, somem sozinhas */
  body.modo-celular #log { height: 34px !important; transition: opacity .6s; }
  body.modo-celular #log.cel-some { opacity: 0; }
  @media (max-height: 380px) {
    body.modo-celular #hotbar { grid-template-columns: repeat(5, 44px) !important; grid-auto-rows: 44px; }
    body.modo-celular #hotbar .slot { width: 44px; height: 44px; }
    body.modo-celular #barraAcoes > .btn { min-height: 36px; }
    body.modo-celular #celPag { min-height: 44px !important; }
  }
  @media (orientation: portrait) {
    body.modo-celular #barraAcoes { bottom: calc(160px + env(safe-area-inset-bottom)) !important; width: min(356px, 96vw) !important; justify-content: center !important; }
    body.modo-celular #hotbar { grid-template-columns: repeat(5, 52px) !important; grid-auto-rows: 52px; }
    body.modo-celular #hotbar .slot { width: 52px; height: 52px; }
    body.modo-celular #celPag { min-height: 52px !important; }
  }
  /* lojas/listas em tela estreita: nome e descrição na largura toda, preço e botão embaixo */
  @media (max-width: 560px) {
    body.modo-celular .linha-item { flex-wrap: wrap; row-gap: 6px; }
    body.modo-celular .linha-item > .nm { flex: 1 1 calc(100% - 64px); min-width: 0; }
    body.modo-celular .linha-item > .preco { margin-left: auto; }
    body.modo-celular .linha-item > input[type=number] { width: 56px; }
  }
  `;
  document.head.append(st);
})();
