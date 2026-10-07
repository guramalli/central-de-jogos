/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🏎️ DESEMPENHO v410.2 (dono, vídeo de 06/10: "pequenas travadas que atrapalham a jogabilidade" — em rajadas nas
   vitórias, no chefão e na subida de nível). Medido numa caçada no CT (nível 50, 13 missões ativas): cada vitória
   escrevia 2–7 linhas no registro (cada uma refazia o layout da página: ui.js) e refazia os painéis (8–13 ms:
   rastreador de missões, barra de atalhos, mochila, equipamento — com ~60 telinhas de ícone novas a cada vez).
   Aqui, sem mudar o que aparece:
   1) ícones dos painéis: as telinhas do redesenho anterior são reaproveitadas (ICONE_POOL, ui.js);
   2) rastreador de missões: dentro do laço do jogo, só é refeito quando algo que ele MOSTRA mudou (missões e
      progresso, tutorial, dicas, "🎯 Agora", 📅 Hoje, avisos, mapa...) — e de qualquer jeito a cada 2 s;
   3) retrato do jogador: só é refeito quando o boneco muda (antes: a cada subida de nível, ~8 ms).
   Prefixo dsq. Carregar NO FIM (depois de todos os embrulhos de atualizaPaineis, atualizaRastreador e atualizaRetrato).
   ============================================================ */
const DSQ = { noLaco: false, rastSig: null, rastT: 0, rastN: -1, retSig: null, pulos: 0 };
{
  const _atDsq = atualiza;
  atualiza = function () { DSQ.noLaco = true; try { return _atDsq.apply(this, arguments); } finally { DSQ.noLaco = false; } };

  /* ---------- 1) ícones reaproveitados durante o redesenho dos painéis ---------- */
  const _apDsq = atualizaPaineis;
  atualizaPaineis = function () {
    if (typeof ICONE_POOL === 'undefined' || ICONE_POOL.on) return _apDsq.apply(this, arguments);
    ICONE_POOL.on = true; ICONE_POOL.ger++;
    try { return _apDsq.apply(this, arguments); } finally { ICONE_POOL.on = false; }
  };

  /* ---------- 2) rastreador: refaz só quando o que ele mostra mudou ---------- */
  const porId = new Map(); let nMis = -1;
  const missao = id => { if (MISSOES.length !== nMis) { porId.clear(); for (const q of MISSOES) porId.set(q.id, q); nMis = MISSOES.length; } return porId.get(id); };
  const js = v => { try { return JSON.stringify(v); } catch (e) { return String(Math.random()); } };
  function assinatura() {
    const s = G.save; if (!s) return null;
    let q = '';
    for (const id in s.quests) {
      const e = s.quests[id]; if (!e || e.s === 'feita') continue;
      const m = missao(id); let pr = '';
      try { if (m) pr = progressoMissao(m).join('/') + (m.req && m.req.espera ? descMissao(m) : ''); } catch (er) { pr = 'x'; }
      q += id + js(e) + pr + ';';
    }
    const extra = [];
    try { if (typeof objetivoTexto === 'function') extra.push(js(objetivoTexto())); } catch (e) { extra.push('x'); }
    try { if (typeof hjEtiqueta === 'function') { const b = hjEtiqueta(); extra.push(b ? b.className + b.textContent : '-'); } } catch (e) { extra.push('x'); } // (o que a etiqueta 📅 Hoje mostra)
    try { if (typeof alertasAtuais === 'function') extra.push(alertasAtuais().map(a => a.id + a.txt).join(',')); } catch (e) { extra.push('x'); }
    try { if (typeof OA_CC_ABERTO !== 'undefined') extra.push([...OA_CC_ABERTO].join(',')); } catch (e) { }
    const d0 = G.dicasFila && G.dicasFila[0];
    return [q, s.tut, G.tutMin, G.dicasFila ? G.dicasFila.length : 0, d0 ? d0.txt : '', js(s.tarefa || null), s.nivel, s.pontos, G.mapa && G.mapa.id,
      js(G.guiaPedido || null), G.guiaOn, typeof RAST_FIXO !== 'undefined' ? RAST_FIXO : '', typeof RAST_ATE !== 'undefined' ? RAST_ATE > (G.agora || 0) : '',
      Object.keys(s.flags || {}).length, s.dia, new Date().getDate(), document.body.className, ...extra].join('|');
  }
  DSQ.assinatura = assinatura; // (testes)
  const _rastDsq = atualizaRastreador;
  atualizaRastreador = function () {
    const R = document.getElementById('rastreador');
    let sig = null;
    if (DSQ.noLaco && R) {
      try { sig = assinatura(); } catch (e) { sig = null; }
      if (sig && sig === DSQ.rastSig && R.childElementCount === DSQ.rastN && performance.now() - DSQ.rastT < 2000) { DSQ.pulos++; return; } // nada mudou: fica como está
    }
    const r = _rastDsq.apply(this, arguments);
    if (R) { DSQ.rastN = R.childElementCount; DSQ.rastT = performance.now(); try { DSQ.rastSig = sig || assinatura(); } catch (e) { DSQ.rastSig = null; } }
    return r;
  };

  /* ---------- 4) seta-guia: o objetivo (que passa por TODAS as missões) é calculado 2x por quadro (seta e minimapa),
     ~1,5 ms por quadro. Agora fica guardado por até 1/4 de segundo enquanto nada muda (mapa, vitórias, missões,
     painéis refeitos); o adversário seguido continua com a posição de agora. ---------- */
  if (typeof objetivoAtual === 'function') {
    const _oaDsq = objetivoAtual; let memo = null;
    objetivoAtual = function () {
      const s = G.save; if (!s || !G.mapa) return _oaDsq.apply(this, arguments);
      const k = [G.mapa.id, s.tut, G.guiaOn, JSON.stringify(G.guiaPedido || null), (s.st && s.st.abates) || 0, G.mons ? G.mons.length : 0, G.respawns ? G.respawns.length : 0,
        typeof ICONE_POOL !== 'undefined' ? ICONE_POOL.ger : 0, s.nivel].join('|');
      const ag = G.agora || 0;
      if (memo && memo.k === k && ag >= memo.t && ag - memo.t < 250) {
        const r = memo.r; if (!r) return r;
        if (r.ent) { if (!G.mons.includes(r.ent)) { memo = null; return objetivoAtual.apply(this, arguments); } return Object.assign({}, r, { x: r.ent.x, y: r.ent.y }); }
        if (r.espera != null) return Object.assign({}, r, { espera: r.espera - (ag - memo.t) }); // (a contagem "volta em…" continua andando)
        return Object.assign({}, r);
      }
      const r = _oaDsq.apply(this, arguments);
      memo = { k, t: ag, r: r ? Object.assign({}, r) : r };
      return r;
    };
  }

  /* ---------- 3) retrato: só quando o boneco muda ---------- */
  const _retDsq = atualizaRetrato;
  atualizaRetrato = function () {
    let sig = null;
    try {
      const s = G.save, r = document.getElementById('retrato'), l = lookJogador(true);
      const f = typeof FOLHAS !== 'undefined' && typeof folhaDoLook === 'function' ? FOLHAS[folhaDoLook(specDe(l), l)] : null;
      if (s && r && f && f.ok) sig = JSON.stringify(l) + '|' + (faseIdx(s.nivel) >= 3) + '|' + r.childElementCount; // (folha ainda chegando: refaz sempre, como antes)
      if (sig && sig === DSQ.retSig && r.querySelector('canvas')) return;
    } catch (e) { sig = null; }
    const res = _retDsq.apply(this, arguments);
    try { const r = document.getElementById('retrato'); DSQ.retSig = sig ? sig.replace(/\|\d+$/, '|' + (r ? r.childElementCount : 0)) : null; } catch (e) { DSQ.retSig = null; }
    return res;
  };
}

/* ---------- 4) v410.7: travadinhas em combate (rastro do navegador, 07/10/2026) ----------
   O medidor do dono mostrou o código leve e as pausas FORA dele; o rastro do navegador achou o porquê:
   - os embrulhos de atualizaPaineis carregados depois do limitador de 250 ms (desempenho.js) rodavam em TODA chamada
     (~70/s em combate): mtPosiciona forçava o navegador a recalcular a página, o 🔒 dos travados se acumulava...
     → o limite de 250 ms agora fica por FORA de todos (este embrulho é o último antes do medidor);
   - ajustaCanvas() lia o tamanho da tela em todo quadro (getBoundingClientRect), o que obriga o navegador a refazer
     o layout da página na hora se algo mudou → só refaz quando a tela muda de tamanho (ResizeObserver) ou o zoom/mapa muda. */
{
  const _apFora = atualizaPaineis; let ultFora = 0;
  atualizaPaineis = function () {
    const ag = performance.now();
    if (DSQ.noLaco && ag - ultFora < 250) { G.uiSujo = true; return; } // fica para daqui a pouco
    ultFora = ag; return _apFora.apply(this, arguments);
  };

  let cvSujo = true, cvSig = '';
  let cvObs = null; // v410.8: o CV só existe depois de iniciarJogo (no carregamento ele era undefined e o atalho nunca ligava)
  const vigia = () => { if (cvObs || DSQ.semRO || typeof CV === 'undefined' || !CV) return; try { cvObs = new ResizeObserver(() => { cvSujo = true; }); cvObs.observe(CV); cvSujo = true; } catch (e) { DSQ.semRO = true; } };
  addEventListener('resize', () => { cvSujo = true; });
  const _ajDsq = ajustaCanvas;
  ajustaCanvas = function () {
    vigia();
    if (DSQ.noDesenho && cvObs) {
      const m = G.mapa, sig = (m && m.id) + '|' + (m && m.interior ? 1 : 0) + '|' + G.zoomVis + '|' + devicePixelRatio + '|' + G.dprMax + '|' + document.body.classList.contains('tela-larga');
      if (!cvSujo && sig === cvSig) return;
      cvSig = sig;
    }
    cvSujo = false; return _ajDsq.apply(this, arguments);
  };
  const _desDsq = desenha;
  desenha = function () { DSQ.noDesenho = true; try { return _desDsq.apply(this, arguments); } finally { DSQ.noDesenho = false; } };
}

/* ---------- 5) v410.8: o quadro da vitória (rastro no Labirinto Jurássico, 07/10/2026) ----------
   - vitória e mochila refeita (o loot entrou) caíam no MESMO quadro em quase metade das vezes → o redesenho dos
     painéis espera o quadro seguinte (no máximo 3 quadros seguidos; ninguém percebe 1 quadro);
   - mtPosiciona (mochila_tibia.js) media a coluna da direita (offsetParent/getComputedStyle/getBoundingClientRect) a
     cada redesenho, obrigando o navegador a recalcular a página na hora (~4 ms) → no laço, só mede de novo se a
     janela, as classes da página ou o painel das bolsas mudaram (e a cada 2 s, por garantia). */
{
  DSQ.vitAgora = false; DSQ.adiou = 0;
  const _atVit = atualiza;
  atualiza = function () { DSQ.vitAgora = false; return _atVit.apply(this, arguments); };
  if (typeof matar === 'function') { const _matVit = matar; matar = function () { DSQ.vitAgora = true; return _matVit.apply(this, arguments); }; }
  const _apVit = atualizaPaineis;
  atualizaPaineis = function () {
    if (DSQ.noLaco && DSQ.vitAgora && DSQ.adiou < 3) { DSQ.adiou++; G.uiSujo = true; return; } // fica para o próximo quadro
    DSQ.adiou = 0; return _apVit.apply(this, arguments);
  };
  if (typeof mtPosiciona === 'function') {
    const _mtp = mtPosiciona; let sigP = '', tP = 0;
    mtPosiciona = function () {
      const painel = document.querySelector('[data-painel="bolsas"] .bolsas-painel'), bloco = painel && painel.closest('[data-painel]'), mo = document.getElementById('mochila'), ag = performance.now();
      const sig = innerWidth + 'x' + innerHeight + '|' + document.body.className + '|' + (bloco ? bloco.className + '|' + bloco.hidden + '|' + bloco.style.cssText + '|' + (bloco.parentElement ? bloco.parentElement.className + '|' + bloco.parentElement.hidden : '') : '-') + '|' + (mo && mo.parentElement ? mo.parentElement.id || mo.parentElement.className : '');
      if (DSQ.noLaco && sig === sigP && ag - tP < 2000) return;
      sigP = sig; tP = ag; return _mtp.apply(this, arguments);
    };
  }
}
