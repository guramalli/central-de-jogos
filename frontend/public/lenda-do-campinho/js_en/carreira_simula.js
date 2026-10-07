/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   📋 SIMULAR O JOGO DA CARREIRA (v314), a pedido do dono: no dia de jogo dá para escolher
   "⚽ Entrar em campo" (jogar os lances, como sempre) ou "📋 Simular jogo" (o resultado sai na hora).
   - Mesmo motor da partida: os gols dos companheiros e do rival saem igual (cjSegmento);
   - os SEUS lances são decididos pela sua fase (média das últimas notas): quem vem jogando bem rende mais.
     Ataque certo = gol seu; passe certo = gol do companheiro com a sua assistência; defesa certa = bola
     recuperada (errar a defesa pode virar gol deles); pênalti = 75% de chance;
   - no fim, a mesma tela de resultado: nota, gols, bicho, tabela, metas e XP (sem ir ao estádio).
   Carregar DEPOIS de carreira_jogos.js.
   ============================================================ */
{
  function chance(t) { // pela fase: nota média 6,5 → 50%; 8 → 62%; 5 → 38%
    const ult = (t.eu.notas || []).slice(-3), forma = ult.length ? ult.reduce((a, b) => a + b, 0) / ult.length : 6.5;
    return Math.max(0.3, Math.min(0.68, 0.5 + (forma - 6.5) * 0.08));
  }
  function cjSimulaJogo(titular) {
    const t = cjTemp(); if (!t || G.jogoC || !cjHojeTemJogo()) return;
    const rd = t.rodada, adv = cjAdversario(t, rd), p = chance(t);
    G.jogoC = { t, rd, adv, titular, lances: cjSorteiaLances(titular, t.tier), idx: 0, gn: 0, ga: 0, min: 0, nota: 6.0, meusG: 0, meusA: 0, feed: ['📋 Simulated game'], fase: 'sim', proxFase: 0, caca: G.caca, simulado: true };
    const J = G.jogoC, _banner = banner, _som = som;
    banner = () => { }; som = () => { }; // os lances e gols do meio do jogo não piscam na tela: o resumo vem no fim
    try {
      const corre = ate => { cjSegmento(ate); const S = J.seg; while (S.eventos.length) cjEventoGol(S.eventos.shift()); J.min = ate; };
      for (const L of J.lances) {
        corre(L.min); J.idx++; J.lance = L;
        let res;
        if (L.tipo === 'penalti') res = Math.random() < 0.75 ? { ok: true, gol: 'eu' } : { ok: false, gol: null, motivo: 'defesa' };
        else if (L.tipo === 'ataque') res = Math.random() < p ? { ok: true, gol: 'eu' } : { ok: false, gol: null, motivo: Math.random() < 0.5 ? 'goleiro' : 'perdeu' };
        else if (L.tipo === 'passe') res = Math.random() < p ? { ok: true, gol: 'comp', assist: true } : { ok: false, gol: null, motivo: 'tempo' };
        else res = Math.random() < p ? { ok: true, gol: null, motivo: 'tempo' } : (Math.random() < 0.45 ? { ok: false, gol: 'contra' } : { ok: false, gol: null, motivo: 'perdeu' });
        cjFimLanceFut(res);
      }
      corre(90);
    } finally { banner = _banner; som = _som; }
    cjFimJogo();
  }
  window.cjSimulaJogo = cjSimulaJogo;
  // o jogo simulado não acontece no estádio: não é "abandono"; termina quando você fecha a tela do resultado
  const _tickSim = cjTick;
  cjTick = function (dt) {
    const J = G.jogoC;
    if (J && J.simulado) { if (J.fase === 'fim' && J.fimMostrado && $('#modal').hidden) cjSaiDoCampo(); return; }
    return _tickSim.apply(this, arguments);
  };
  // o botão no pré-jogo
  const _preSim = cjPreJogo;
  cjPreJogo = function () {
    const r = _preSim.apply(this, arguments);
    try {
      const t = cjTemp(); if (!t || !cjHojeTemJogo()) return r;
      const ops = document.querySelector('#modalConteudo .opcoes'); if (!ops) return r;
      const tt = cjTitular(t), entrar = ops.querySelector('button');
      const b = el('button', { class: 'btn verde grande', type: 'button', title: 'The result comes out right away, without going to the stadium. Your plays depend on your form (recent ratings).', onclick: () => { fechaModal(); cjSimulaJogo(tt.titular); } }, '📋 Simulate game');
      if (entrar && entrar.nextSibling) ops.insertBefore(b, entrar.nextSibling); else ops.append(b);
      ops.after(el('p', { class: 'dica' }, `📋 Simulate: the game happens instantly, without you taking the field. Your plays depend on your form (${Math.round(chance(t) * 100)}% success right now). When you play for real, it's all up to you!`));
    } catch (e) { }
    return r;
  };
  // na tela do resultado de um jogo simulado, o botão é "Fechar" (não há campo para sair)
  const _fimSim = cjTelaFimJogo;
  cjTelaFimJogo = function () {
    const r = _fimSim.apply(this, arguments);
    try { if (G.jogoC && G.jogoC.simulado) { const b = [...document.querySelectorAll('#modalConteudo .opcoes button')].find(x => /Sair do campo|Leave the field/.test(x.textContent)); if (b) b.textContent = 'Close ▶'; } } catch (e) { }
    return r;
  };
}
