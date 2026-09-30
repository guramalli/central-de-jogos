/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   📱 CELULAR 3 (v273): a tela do celular repaginada — MENOS É MAIS.
   O dono jogou no iPhone e achou "péssimo": botões fora do lugar, missões pipocando no meio
   da tela, a barra de habilidades perdida. Agora, só o essencial fica na tela:
   - canto de cima à esquerda: nível, fôlego, foco e XP (um cartão pequeno);
   - canto de cima à direita: o mapinha e o menu ☰ (mochila, equipamento etc. estão no ☰);
   - embaixo à esquerda: o joystick;
   - embaixo à direita: o botão ALVO grande, e acima dele o especial da classe e a caça;
     à esquerda dele, UMA fileira com 5 atalhos (o ▦ troca a página);
   - "Falar / Usar" só aparece quando tem alguém ou alguma coisa perto;
   - Drible/Chute, Montar e Editar barra ficam no botão "⋯";
   - missões: só uma etiqueta pequena (📜 2 · 🎯 33/60) que abre quando você toca — não abre
     mais sozinha no meio da tela;
   - mensagens: o chat não fica mais na tela; só as importantes (nível, drible novo, item raro)
     aparecem num aviso pequeno em cima, uma de cada vez (o histórico está no ☰ › Mensagens);
   - o letreiro grande do meio da tela virou uma faixa pequena em cima.
   No computador NADA muda. Carregar POR ÚLTIMO.
   ============================================================ */
if (typeof CEL !== 'undefined' && CEL) (function () {
  document.body.classList.add('cel3');
  const $id = id => document.getElementById(id);

  /* ---------- 1) Alvo, Falar, especial e caça: ícone grande + nome pequeno ---------- */
  const rotulo = (b, ic, txt) => { if (!b) return; b.innerHTML = ''; b.append(el('span', { class: 'c3-ic' }, ic), el('small', {}, txt)); };
  rotulo($id('tAlvo'), '🎯', 'ALVO');
  rotulo($id('tFalar'), '💬', 'FALAR');
  // o botão da caça: o jogo reescreve o texto ("🎯 Caça: SIM") — aqui vira um ícone que acende
  const _atualizaPaineisC3 = atualizaPaineis;
  atualizaPaineis = function () {
    const r = _atualizaPaineisC3.apply(this, arguments);
    const bc = $id('btnCaca'); if (bc) { if (!bc.querySelector('.c3-ic')) rotulo(bc, '🔁', 'CAÇA'); bc.classList.toggle('c3-ligado', !!G.caca); }
    const bcl = $id('btnClasse'), cl = G.save && typeof CLASSES !== 'undefined' && CLASSES[G.save.classe];
    if (bcl && cl && !bcl.querySelector('.c3-ic')) { const cd = bcl.querySelector('.cd'); rotulo(bcl, cl.emoji, cl.especial.nome); if (cd) bcl.append(cd); }
    const bm = $id('btnModo'); if (bm) bm.textContent = G.modo === 'drible' ? '🦶 Atacar driblando' : '⚽ Atacar chutando';
    return r;
  };
  // "Falar / Usar" só quando tem alguém/algo perto (e diz o que é)
  setInterval(() => {
    const b = $id('tFalar'); if (!b || !G.rodando) return;
    let it = null; try { if (!G.pausado && typeof interacaoPerto === 'function') it = interacaoPerto(); } catch (e) { }
    b.classList.toggle('c3-on', !!it);
    if (it) { const ic = it.tipo === 'npc' ? '💬' : it.tipo === 'placa' ? '📜' : '✋', txt = it.tipo === 'npc' ? 'FALAR' : it.tipo === 'placa' ? 'LER' : 'USAR'; const s = b.querySelector('small'); if (!s || s.textContent !== txt) rotulo(b, ic, txt); }
  }, 200);

  // o especial da classe e a caça saem da barra (que no celular em pé fica centralizada com "transform")
  for (const id of ['btnClasse', 'btnCaca']) { const b = $id(id); if (b) $id('app').append(b); }

  /* ---------- 2) o botão "⋯": Drible/Chute, Montar, Editar barra ---------- */
  const bandeja = el('div', { id: 'c3Bandeja', hidden: 'hidden' });
  const mais = el('button', { class: 'btn', id: 'c3Mais', type: 'button', 'aria-label': 'Mais ações' }, '⋯');
  mais.addEventListener('click', () => { bandeja.hidden = !bandeja.hidden; mais.classList.toggle('c3-aberto', !bandeja.hidden); });
  const fechaBandeja = () => { bandeja.hidden = true; mais.classList.remove('c3-aberto'); };
  const bm = $id('btnModo'), tm = $id('tMontar');
  if (bm) { bandeja.append(bm); bm.addEventListener('click', () => setTimeout(fechaBandeja, 150)); }
  if (tm) { bandeja.append(tm); tm.addEventListener('click', () => setTimeout(fechaBandeja, 150)); }
  bandeja.append(el('button', { class: 'btn', type: 'button', onclick: () => { fechaBandeja(); if (typeof alternaEdicaoBarra === 'function') alternaEdicaoBarra(); } }, '✏️ Editar barra'));
  { const ba = $id('barraAcoes'); if (ba) ba.prepend(mais); else $id('app').append(mais); $id('app').append(bandeja); }
  mais.addEventListener('click', () => { if (bandeja.hidden) return; const r = mais.getBoundingClientRect(); bandeja.style.left = Math.max(6, Math.min(innerWidth - 200, r.left)) + 'px'; bandeja.style.right = 'auto'; bandeja.style.bottom = (innerHeight - r.top + 8) + 'px'; });

  /* ---------- 2b) v277: ATALHOS — deitado, a fileira ocupa o espaço livre de baixo; em pé, 2 fileiras de 5 ---------- */
  const TOTAL_AT = typeof HOTBAR_N !== 'undefined' ? HOTBAR_N : 20;
  let porPag = 5, colunas = 5;
  function calculaAtalhos() {
    const deitado = innerWidth > innerHeight;
    if (!deitado) { porPag = 10; colunas = 5; return; }
    const joy = $id('joy'), alvo = $id('tAlvo'); if (!joy || !alvo) return;
    const jr = joy.getBoundingClientRect().right, al = alvo.getBoundingClientRect().left;
    const passo = innerHeight <= 380 ? 46 : 52;            // atalho + espaço
    const livre = al - 8 - (jr + 12) - 44 - 46;            // tira o ▦ e o ⋯
    porPag = Math.max(5, Math.min(10, Math.floor(livre / passo))); colunas = porPag;
  }
  function aplicaAtalhos() {
    const hb = $id('hotbar'); if (!hb) return;
    const slots = [...hb.querySelectorAll(':scope > .slot')]; if (!slots.length) return;
    const pags = Math.max(1, Math.ceil(Math.min(TOTAL_AT, slots.length) / porPag));
    let p = +hb.dataset.pag || 0; if (p >= pags) p = 0; hb.dataset.pag = String(p);
    slots.forEach((sl, i) => sl.classList.toggle('c3-vis', i >= p * porPag && i < (p + 1) * porPag));
    hb.style.setProperty("grid-template-columns", `repeat(${colunas}, var(--c3-at))`, "important");
    const pg = $id('celPag'); if (pg) { const a = p * porPag + 1, b = Math.min(slots.length, (p + 1) * porPag); pg.textContent = `▦ ${a}-${b}`; pg.hidden = pags < 2; }
  }
  { // o ▦ troca de página do jeito novo (o de antes só conhecia páginas de 5)
    const pg = $id('celPag');
    if (pg) { const novo = pg.cloneNode(false); pg.replaceWith(novo); novo.addEventListener('click', () => { const hb = $id('hotbar'); if (!hb) return; const n = hb.querySelectorAll(':scope > .slot').length; const pags = Math.max(1, Math.ceil(Math.min(TOTAL_AT, n) / porPag)); hb.dataset.pag = String(((+hb.dataset.pag || 0) + 1) % pags); aplicaAtalhos(); }); }
  }
  const refazAtalhos = () => { calculaAtalhos(); aplicaAtalhos(); };
  addEventListener('resize', () => setTimeout(refazAtalhos, 80)); addEventListener('orientationchange', () => setTimeout(refazAtalhos, 300));
  { const hb = $id('hotbar'); if (hb) new MutationObserver(() => aplicaAtalhos()).observe(hb, { childList: true }); }
  setTimeout(refazAtalhos, 300);
  const _iniciarJogoC3 = iniciarJogo;
  iniciarJogo = async function () { const r = await _iniciarJogoC3.apply(this, arguments); setTimeout(refazAtalhos, 200); return r; };

  /* ---------- 3) missões: uma etiqueta pequena, que só abre quando você toca ---------- */
  if (typeof atualizaRastreador === 'function') {
    const _rastC3 = atualizaRastreador;
    atualizaRastreador = function () {
      let r = _rastC3.apply(this, arguments);
      // o progresso mudou? no computador a lista abre sozinha por 6 s; no celular, não
      try { if (typeof RAST_ATE !== 'undefined' && RAST_ATE && !RAST_FIXO) { RAST_ATE = 0; r = _rastC3.apply(this, arguments); } } catch (e) { }
      const R = $id('rastreador'); if (!R) return r;
      const et = R.querySelector('.rast-etiqueta');
      if (et) { const n = (et.textContent.match(/\((\d+)\)/) || [])[1] || ''; const pr = /pronta/.test(et.textContent); et.textContent = `📜 ${n}${pr ? ' ✔' : ''} ${/▾/.test(et.textContent) ? '▾' : '▸'}`; }
      const tar = R.querySelector('.rast-tarefa > span'); if (tar) tar.textContent = tar.textContent.replace(/^🎯\s*(\d+\/\d+).*$/, '🎯 $1');
      return r;
    };
  }

  /* ---------- 4) mensagens: só as importantes, pequenas, em cima ---------- */
  const avisos = el('div', { id: 'c3Avisos' }); $id('app').append(avisos);
  const fila = []; let mostrando = false;
  const IMPORTA = /\bl-(lvl|raro|epico|lendario|mitico)\b/;
  function proximo() {
    if (!fila.length) { mostrando = false; return; } mostrando = true;
    const txt = fila.shift(); const a = el('div', { class: 'c3-aviso' }, txt); avisos.append(a);
    setTimeout(() => a.classList.add('c3-sai'), 2600); setTimeout(() => { a.remove(); proximo(); }, 3000);
  }
  const _logC3 = log;
  log = function (m, cls, ...r) {
    const res = _logC3.call(this, m, cls, ...r);
    try {
      if (typeof m === 'string' && IMPORTA.test(' ' + (cls || ''))) {
        const t = m.replace(/\s*—\s*tecla\s+\S+\.?/i, '').replace(/\s+/g, ' ').trim();
        if (!fila.includes(t) && fila.length < 3) fila.push(t.length > 90 ? t.slice(0, 88) + '…' : t);
        if (!mostrando) proximo();
      }
    } catch (e) { }
    return res;
  };
  // o histórico continua no ☰
  const grade = document.querySelector('#celMenu .cm-grade');
  if (grade) {
    grade.prepend(el('button', { class: 'btn cm-bt', type: 'button', onclick: () => {
      if (typeof fechaMenuCel === 'function') fechaMenuCel();
      const linhas = [...(($id('log') || {}).children || [])].slice(-40).reverse().map(d => el('div', { class: 'c3-linha ' + d.className }, d.textContent));
      abreModal(el('h2', {}, '💬 Mensagens'), el('div', { class: 'c3-historico' }, ...(linhas.length ? linhas : [el('p', {}, 'Nenhuma mensagem ainda.')])));
    } }, el('span', { class: 'cm-ic' }, '💬'), 'Mensagens'));
  }

  /* ---------- 5) etiquetas do canto (caça, modo chute, buffs): embaixo do mapinha, sem as que já têm botão ---------- */
  if (typeof desenhaBuffs === 'function') {
    desenhaBuffs = function (ctx) {
      const s = G.dpr; const itens = [];
      if ((G.buffs.muralha || 0) > G.agora) itens.push(['🛡️', Math.ceil((G.buffs.muralha - G.agora) / 1000) + 's', '#4a8ae8']);
      if ((G.buffs.arrancada || 0) > G.agora) itens.push(['⚡', Math.ceil((G.buffs.arrancada - G.agora) / 1000) + 's', '#2ab0c8']);
      if (G.firula > 0) itens.push(['✨', 'x' + G.firula, '#ff9a3a']);
      for (const c of comidasAtivas(G.save)) { if (!ITENS[c.id]) continue; const r = Math.ceil(c.resta); itens.push(['🍽️', `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`, '#e8a020']); }
      if (!itens.length) return;
      const mini = $id('chMini'), rc = mini && mini.getBoundingClientRect(), cr = CV.getBoundingClientRect();
      let y = ((rc && rc.height ? rc.bottom : 110) - cr.top + 8) * s; const dir = ((rc && rc.width ? cr.right - rc.right : 8)) * s;
      ctx.font = `700 ${11 * s}px Fredoka, sans-serif`; ctx.textBaseline = 'middle';
      for (const [t, v, cor] of itens) {
        const txt = `${t} ${v}`; const w = ctx.measureText(txt).width + 16 * s; const x = CV.width - dir - w;
        ctx.fillStyle = 'rgba(30,18,40,0.75)'; ctx.beginPath(); ctx.roundRect(x, y, w, 20 * s, 10 * s); ctx.fill();
        ctx.fillStyle = cor; ctx.beginPath(); ctx.roundRect(x, y, 5 * s, 20 * s, 3 * s); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText(txt, x + 9 * s, y + 10 * s);
        y += 24 * s;
      }
      ctx.textBaseline = 'alphabetic';
    };
  }

  // em cima de quem dá para falar aparecia a tecla "E" do computador: no celular, a mãozinha
  if (typeof dicaTecla === 'function') { const _dicaTeclaC3 = dicaTecla; dicaTecla = function (ctx, x, y, tecla, ...r) { return _dicaTeclaC3.call(this, ctx, x, y, '👆', ...r); }; }

  /* ---------- 6) a seta de guia (missão) evita os cantos com botões ---------- */
  const margens = () => { G.guiaMg = innerHeight > innerWidth ? { t: 130, b: 250, l: 24, r: 24 } : { t: 90, b: 90, l: 170, r: 200 }; };
  margens(); addEventListener('resize', margens);

  /* ---------- 7) estilo ---------- */
  const st = document.createElement('style');
  // v274: nos CANTOS dá para chegar bem mais perto da borda do que a "margem de segurança" inteira do iPhone
  // (ela existe por causa da câmera, que fica no MEIO da lateral, e da barrinha de baixo). O que fica no meio
  // da lateral (especial da classe e caça) guarda mais distância.
  const SL = 'calc(env(safe-area-inset-left) * .4)', SR = 'calc(env(safe-area-inset-right) * .4)', SB = 'calc(env(safe-area-inset-bottom) * .35)', ST = 'env(safe-area-inset-top)';
  const SRm = 'calc(env(safe-area-inset-right) * .8)';
  st.textContent = `
  /* ===== topo: cartão pequeno à esquerda, mapinha + ☰ à direita ===== */
  body.cel3 #celHud { top: calc(4px + ${ST}) !important; left: calc(4px + ${SL}) !important; right: calc(4px + ${SR}) !important; }
  body.cel3 #celHud .ch-esq { width: 168px; padding: 4px 7px 5px; border-width: 1.5px; background: rgba(20,10,40,.55); }
  body.cel3 #celHud .ch-nome { font-size: 12px; }
  body.cel3 #celHud .ch-nome .beta, body.cel3 #celHud .ch-nome [class*=beta], body.cel3 #celHud .selo-beta { display: none !important; }
  body.cel3 #celHud .ch-barra { height: 9px; margin-top: 2px; } body.cel3 #celHud .ch-barra span { font-size: 8px; line-height: 9px; }
  body.cel3 #celHud .ch-barra.xp { height: 4px; }
  body.cel3 #celHud .ch-ouro { font-size: 10.5px; margin-top: 2px; } body.cel3 #chMapa { display: none; }
  body.cel3 #celHud .ch-dir { flex-direction: row-reverse; align-items: flex-start; gap: 6px; }
  body.cel3 #chMini { width: 84px !important; height: 84px !important; border-radius: 50% !important; border: 2px solid rgba(184,115,58,.9) !important; }
  body.cel3 #chMenu { width: 40px !important; height: 40px !important; font-size: 20px !important; border-radius: 12px; }
  body.cel3 #chRapido { display: none !important; }
  body.cel3 #chPontos { font-size: 11px !important; min-height: 26px !important; padding: 3px 8px !important; }
  /* ===== mensagens: o chat sai da tela; avisos pequenos em cima ===== */
  body.cel3 #log { display: none !important; }
  #c3Avisos { position: fixed; z-index: 8; top: calc(8px + ${ST}); left: 50%; transform: translateX(-50%); width: min(52vw, 440px); display: flex; flex-direction: column; align-items: center; gap: 4px; pointer-events: none; }
  .c3-aviso { background: rgba(20,10,40,.82); color: #fff6d8; border: 1.5px solid #ffd23f; border-radius: 14px; padding: 4px 12px; font: 700 12.5px/1.3 Nunito, sans-serif; text-align: center; box-shadow: 0 3px 10px rgba(0,0,0,.35); animation: c3Entra .25s ease-out; transition: opacity .4s, transform .4s; }
  .c3-aviso.c3-sai { opacity: 0; transform: translateY(-8px); }
  @keyframes c3Entra { from { opacity: 0; transform: translateY(-8px); } }
  .c3-historico { max-height: 60vh; overflow-y: auto; font-size: 13px; line-height: 1.35; } .c3-historico .c3-linha { padding: 3px 0; border-bottom: 1px solid rgba(0,0,0,.08); }
  /* ===== letreiro (nível, drible novo...): faixa pequena em cima, não mais no meio ===== */
  body.cel3 #banner { top: calc(46px + ${ST}) !important; transform: translateX(-50%) !important; width: min(60vw, 480px); }
  body.cel3 #banner .b1 { font-size: 19px !important; text-shadow: 2px 2px 0 #000 !important; }
  body.cel3 #banner .b2 { font-size: 12px !important; }
  /* ===== missões e avisos: pequenos, embaixo do cartão ===== */
  body.cel3 #rastreador { top: calc(78px + ${ST}) !important; bottom: auto !important; left: calc(4px + ${SL}) !important; max-width: min(300px, 40vw) !important; gap: 4px; flex-direction: column !important;
    max-height: calc(100dvh - 80px - 140px - ${ST} - ${SB}); overflow: hidden; }
  body.cel3 #rastreador:has(> .cartao-dica) > .rast { display: none !important; } /* com uma dica na tela, a missão aberta espera */
  body.cel3 #rastreador > .alertas-box { order: 0; } body.cel3 #rastreador > .rast-linha, body.cel3 #rastreador > .rast-etiqueta { order: 1; }
  body.cel3 #rastreador > .cartao-dica { order: 2; } body.cel3 #rastreador > .rast { order: 3; }
  body.cel3 #rastreador .rast-etiqueta, body.cel3 #rastreador .rast-tarefa { font-size: 12px !important; padding: 4px 10px !important; min-height: 32px; min-width: 40px; margin: 0 !important; }
  body.cel3 #rastreador .rast-tarefa { max-width: 120px; padding-bottom: 5px !important; }
  body.cel3 #rastreador .rast-linha { gap: 4px; }
  body.cel3 #rastreador .rast { font-size: 11.5px !important; padding: 5px 8px !important; max-width: 300px; }
  body.cel3 #rastreador .rast-onde { font-size: 10.5px; }
  body.cel3 .cartao-alerta { font-size: 11.5px !important; padding: 4px 6px 4px 8px !important; border-width: 2px !important; max-width: 290px !important; gap: 5px; box-shadow: 0 2px 0 rgba(0,0,0,.3) !important; animation: none !important; }
  body.cel3 .cartao-alerta .ca-ic { font-size: 16px; } body.cel3 .cartao-alerta .btn { min-height: 28px !important; min-width: 0 !important; padding: 2px 8px !important; font-size: 11px !important; }
  /* dicas: cartão pequeno na coluna da esquerda, embaixo das missões (em cima e no meio ficam os avisos) */
  body.cel3 .cartao-dica { position: static !important; transform: none !important; max-width: min(290px, 38vw) !important; font-size: 11.5px !important; padding: 5px 9px !important; pointer-events: auto; }
  body.cel3 .cartao-dica p, body.cel3 .cartao-dica b { margin: 3px 0 5px; line-height: 1.3; font-size: 11.5px !important; }
  body.cel3 .cartao-dica .btn { min-height: 30px !important; min-width: 80px !important; font-size: 12px !important; padding: 3px 10px !important; }
  /* ===== controles ===== */
  body.cel3 .toque-acoes { display: contents !important; }
  body.cel3 #tAlvo, body.cel3 #tFalar, body.cel3 #btnCaca, body.cel3 #btnClasse, body.cel3 #c3Mais { position: fixed !important; z-index: 6; margin: 0 !important; padding: 0 !important; min-width: 0 !important; display: flex !important; flex-direction: column; align-items: center; justify-content: center; line-height: 1; opacity: .95; }
  body.cel3 .c3-ic { font-size: 26px; line-height: 1; } body.cel3 #tAlvo small, body.cel3 #tFalar small, body.cel3 #btnCaca small, body.cel3 #btnClasse small { font: 900 9.5px/1 Nunito, sans-serif; letter-spacing: .5px; margin-top: 2px; }
  body.cel3 #tAlvo { right: calc(8px + ${SR}); bottom: calc(8px + ${SB}); width: 80px; height: 80px; border-radius: 50% !important; }
  body.cel3 #tAlvo .c3-ic { font-size: 34px; }
  body.cel3 #btnClasse { right: calc(18px + ${SRm}); bottom: calc(100px + ${SB}); width: 68px; height: 50px; border-radius: 16px !important; font-size: 10px !important; white-space: normal !important; text-align: center; padding: 2px 3px !important; line-height: 1.1 !important; }
  body.cel3 #btnCaca { right: calc(29px + ${SRm}); bottom: calc(158px + ${SB}); width: 46px; height: 46px; border-radius: 50% !important; font-size: 10px !important; background: rgba(40,24,60,.75) !important; color: #fff !important; border: 2px solid #7a5a9a !important; box-shadow: none !important; }
  body.cel3 #btnClasse .c3-ic { font-size: 20px; } body.cel3 #btnClasse small { font-size: 8.5px !important; letter-spacing: 0 !important; line-height: 1.05 !important; max-width: 64px; }
  body.cel3 #btnClasse .cd { border-radius: 16px; }
  body.cel3 #btnCaca .c3-ic { font-size: 18px; } body.cel3 #btnCaca small { font-size: 8px; }
  body.cel3 #btnCaca.c3-ligado { background: linear-gradient(#ef5a4c, #b8281d) !important; border-color: #ffd23f !important; box-shadow: 0 0 10px 2px rgba(255,210,63,.7) !important; }
  body.cel3 #tFalar { display: none !important; right: calc(104px + ${SR}); bottom: calc(72px + ${SB}); width: 64px; height: 56px; border-radius: 16px !important; }
  body.cel3 #tFalar.c3-on { display: flex !important; animation: c3Pula .35s ease-out; }
  @keyframes c3Pula { from { transform: scale(.6); opacity: 0; } }
  /* a fileira de atalhos: à esquerda do Alvo, colada embaixo */
  body.cel3 #barraAcoes { right: calc(96px + ${SR}) !important; bottom: calc(8px + ${SB}) !important; width: auto !important; max-width: none !important; gap: 4px !important; flex-wrap: nowrap !important; align-items: flex-end !important; transform: none !important; }
  body.cel3 #barraAcoes > #btnModo, body.cel3 #barraAcoes > #btnCaca, body.cel3 #barraAcoes > #btnClasse { order: 0; }
  body.cel3 #hotbar { --c3-at: 48px; grid-auto-rows: var(--c3-at) !important; gap: 4px !important; }
  body.cel3 #hotbar .slot { width: var(--c3-at) !important; height: var(--c3-at) !important; }
  body.cel3 #hotbar[data-pag] .slot:not(.c3-vis) { display: none !important; }
  body.cel3 #hotbar[data-pag] .slot.c3-vis { display: flex !important; }
  body.cel3 #celPag[hidden] { display: none !important; }
  body.cel3 #celPag { min-height: 48px !important; width: 38px !important; font-size: 10px !important; padding: 0 !important; }
  body.cel3 #c3Mais { position: static !important; order: -1; width: 40px; height: 48px; border-radius: 12px !important; font-size: 22px !important; font-weight: 900; align-self: flex-end; margin-right: 2px !important; }
  body.cel3 #c3Mais.c3-aberto { background: #ffd23f !important; }
  #c3Bandeja { position: fixed; z-index: 9; left: 50%; bottom: calc(66px + ${SB}); display: flex; flex-direction: column; gap: 6px; padding: 8px; background: rgba(20,10,40,.85); border: 2px solid #b8733a; border-radius: 14px; }
  #c3Bandeja[hidden] { display: none; }
  #c3Bandeja .btn { position: static !important; display: block !important; width: auto !important; min-width: 170px !important; min-height: 42px; padding: 6px 12px !important; font-size: 13.5px !important; text-align: left; opacity: 1; }
  body.cel3 #toque { left: calc(8px + ${SL}) !important; bottom: calc(8px + ${SB}) !important; }
  body.cel3 #joy, body.cel3 .joy-base { width: 120px !important; height: 120px !important; }
  body.cel3 .joy-base { background: rgba(30,18,60,.28) !important; border-width: 2px !important; }
  body.cel3 .joy-bot { left: 34px !important; top: 34px !important; width: 48px !important; height: 48px !important; opacity: .9; }
  /* ===== celular EM PÉ ===== */
  @media (orientation: portrait) {
    body.cel3 #c3Avisos { top: auto; bottom: calc(268px + ${SB}); width: 88vw; flex-direction: column-reverse; }
    body.cel3 #banner { top: auto !important; bottom: calc(304px + ${SB}); width: 90vw; }
    body.cel3 .cartao-dica { max-width: 62vw !important; }
    body.cel3 #rastreador { top: calc(80px + ${ST}) !important; max-width: 62vw !important; max-height: calc(100dvh - 80px - 290px - ${ST} - ${SB}); }
    body.cel3 #btnClasse { right: calc(104px + ${SR}); bottom: calc(26px + ${SB}); }
    body.cel3 #btnCaca { right: calc(180px + ${SR}); bottom: calc(28px + ${SB}); }
    body.cel3 #barraAcoes { right: 50% !important; transform: translateX(50%) !important; bottom: calc(150px + ${SB}) !important; }
    body.cel3 #tFalar { right: calc(14px + ${SR}); bottom: calc(262px + ${SB}); }
    body.cel3 #hotbar { --c3-at: 50px; }
  }
  /* ===== telas bem baixas (celular pequeno deitado) ===== */
  @media (max-height: 380px) and (orientation: landscape) {
    body.cel3 #hotbar { --c3-at: 42px; }
    body.cel3 #celPag { min-height: 42px !important; }
    body.cel3 #tAlvo { width: 70px; height: 70px; }
    body.cel3 #btnClasse { bottom: calc(88px + ${SB}); height: 44px; }
    body.cel3 #btnCaca { bottom: calc(138px + ${SB}); width: 40px; height: 40px; }
    body.cel3 #barraAcoes { right: calc(90px + ${SR}) !important; }
    body.cel3 #c3Mais { height: 42px; }
    body.cel3 #chMini { width: 70px !important; height: 70px !important; }
    body.cel3 #rastreador { top: calc(72px + ${ST}) !important; max-height: calc(100dvh - 72px - 138px - ${ST} - ${SB}); }
    body.cel3 .cartao-dica p, body.cel3 .cartao-dica b { font-size: 11px !important; line-height: 1.25; }
  }
  `;
  document.head.append(st);
  try { atualizaPaineis(); } catch (e) { }

  /* ---------- 8) v274: JANELAS no celular (o Meu Time era o pior caso) ---------- */
  // abre com a aba escolhida à vista (as abas agora rolam de lado)
  const _abreModalC3 = abreModal;
  abreModal = function () {
    const r = _abreModalC3.apply(this, arguments);
    try { const a = document.querySelector('#modalConteudo .tabs-modal .btn.amarelo'); if (a) a.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) { }
    return r;
  };
  const sj = document.createElement('style');
  sj.textContent = `
  /* nunca embaixo do relógio/bateria do iPhone; no ícone da Tela de Início o iPhone deixava uma faixa sem cobrir embaixo */
  html, body.cel3 { background: #120a22 !important; }
  body.cel3 #modal { align-items: flex-start !important; bottom: calc(-1 * env(safe-area-inset-top)) !important;
    padding: calc(6px + env(safe-area-inset-top)) calc(6px + env(safe-area-inset-right)) 6px calc(6px + env(safe-area-inset-left)) !important; }
  body.cel3 .modal-caixa { width: min(760px, 100%) !important; max-height: calc(100dvh - 12px - env(safe-area-inset-top) - env(safe-area-inset-bottom)) !important; margin: 0 auto; }
  @media (orientation: portrait) { body.cel3 #tela { height: calc(100dvh + env(safe-area-inset-top)) !important; } }
  /* abas: uma fileira que rola de lado, botões baixos */
  body.cel3 .tabs-modal { flex-wrap: nowrap !important; overflow-x: auto; scrollbar-width: none; gap: 5px !important; padding: 2px 0 4px; margin-bottom: 6px !important; }
  body.cel3 .tabs-modal::-webkit-scrollbar { display: none; }
  body.cel3 .tabs-modal > .btn { flex: 0 0 auto !important; padding: 6px 12px !important; font-size: 13.5px !important; min-height: 38px; height: auto !important; white-space: nowrap !important; }
  /* MEU TIME: cabeçalho, guia e escalação compactos */
  body.cel3 .modal-caixa:has(.time-cab) { padding: 10px 10px 12px !important; font-size: 14px; }
  body.cel3 .time-cab { gap: 8px !important; margin: 0 40px 6px 0 !important; }
  body.cel3 .time-cab h2 { font-size: 19px !important; line-height: 1.15; } body.cel3 .time-cab > div > div { font-size: 12px; line-height: 1.3; }
  body.cel3 .time-cab > canvas { width: 30px !important; height: 34px !important; }
  body.cel3 .guia-passo { font-size: 12.5px !important; padding: 6px 8px !important; margin: 4px 0 8px !important; }
  body.cel3 .guia-passo .btn { min-height: 32px; font-size: 12px !important; }
  body.cel3 .modal-caixa:has(.time-cab) .opcoes { gap: 6px !important; }
  body.cel3 .modal-caixa:has(.time-cab) .opcoes .btn { min-height: 38px; padding: 6px 12px !important; font-size: 13.5px !important; }
  body.cel3 .modal-caixa:has(.time-cab) .sel { font-size: 14px !important; min-height: 36px; }
  body.cel3 .modal-caixa label, body.cel3 .modal-caixa .sel, body.cel3 .modal-caixa select { max-width: 100%; box-sizing: border-box; }
  body.cel3 .modal-caixa label:has(> .sel) { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; }
  body.cel3 .setores { padding: 6px 8px !important; gap: 3px !important; font-size: 13px; }
  body.cel3 .guia-legenda { font-size: 11.5px !important; line-height: 1.3; }
  body.cel3 .slot-esc { grid-template-columns: 34px minmax(0, 1fr) !important; gap: 4px 6px !important; padding: 4px 6px 5px 4px !important; margin-bottom: 4px; }
  body.cel3 .slot-esc > div:last-child { grid-column: 1 / -1; }
  body.cel3 .slot-esc .pos-tag { font-size: 11px !important; padding: 2px 0 !important; }
  body.cel3 .slot-esc .sel { font-size: 13px !important; min-height: 34px; padding: 3px 6px; }
  /* cartão do jogador: foto | nome e números | força — numa linha só (o botão, se tiver, vai embaixo à direita) */
  body.cel3 .pc-card { display: grid !important; grid-template-columns: 32px minmax(0, 1fr) auto; column-gap: 8px; row-gap: 4px; align-items: center; padding: 5px 8px 5px 10px !important; }
  body.cel3 .pc-card > canvas { width: 32px !important; height: 40px !important; grid-row: span 2; }
  body.cel3 .pc-card > .nm { min-width: 0; grid-column: 2; }
  body.cel3 .pc-card > .nm b { font-size: 14px; } body.cel3 .pc-card > .nm small { display: block; font-size: 11.5px !important; line-height: 1.25; }
  body.cel3 .pc-card > .ovr { grid-column: 3; grid-row: 1; font-size: 20px !important; margin: 0 !important; }
  body.cel3 .pc-card > :not(canvas):not(.nm):not(.ovr) { grid-column: 2 / 4; justify-self: end; }
  `;
  document.head.append(sj);
})();
