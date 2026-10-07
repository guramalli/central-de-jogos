/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ⚡ GRÁFICOS LEVES NO COMPUTADOR (v279)
   O celular já tinha o "Modo leve" (celular2.js). Agora o computador também tem, no menu ☰ Mais:
   - desenha a 30 quadros por segundo (o jogo continua rodando igual por baixo);
   - resolução normal mesmo em tela "retina"/4K (a que mais pesa);
   - sem o balanço das árvores com o vento, sem o brilho animado da água;
   - metade das gotas de chuva, flocos de neve e folhas.
   Se o computador estiver lento, o jogo PERGUNTA uma vez se quer ligar.
   Só no computador (no celular o botão é o do menu ☰ do celular). Carregar POR ÚLTIMO.
   ============================================================ */
if (typeof CEL === 'undefined' || !CEL) (function () {
  const PREF = 'rac_leve_pc_v1';
  const lePref = () => { try { return localStorage.getItem(PREF); } catch (e) { return null; } };
  const gravaPref = v => { try { localStorage.setItem(PREF, v); } catch (e) { } };
  let botao = null;
  function aplica(on, avisa) {
    G.leve = !!on; G.dprMax = on ? 1 : 2;
    if (typeof VENTO !== 'undefined') VENTO.on = !on;
    try { if (G.rodando) ajustaCanvas(); } catch (e) { }
    if (botao) botao.textContent = on ? '⚡ Light graphics: YES' : '⚡ Light graphics: no';
    if (avisa && typeof log === 'function') log(on ? '⚡ Light graphics on: the game runs smoother on simpler computers.' : '✨ Full graphics are back.', 'l-sis');
  }
  // 30 quadros por segundo no modo leve
  let ultimo = 0, acum = 0;
  const _desenhaPC = desenha;
  desenha = function (dt) {
    acum += dt || 0;
    if (G.leve) { const agora = performance.now(); if (agora - ultimo < 30) return; ultimo = agora; }
    const d = acum; acum = 0;
    return _desenhaPC.call(this, Math.min(100, d));
  };
  // água sem o brilho andando
  if (typeof desenhaOndas === 'function') { const _ondas = desenhaOndas; desenhaOndas = function () { if (G.leve) return; return _ondas.apply(this, arguments); }; }
  // botão no menu ☰ Mais
  const lista = document.querySelector('#topo .tb-lista');
  if (lista) {
    botao = el('button', { class: 'btn', type: 'button', role: 'menuitem', id: 'btnLevePC', onclick: () => { const on = !G.leve; gravaPref(on ? 'on' : 'off'); aplica(on, true); } }, '⚡ Light graphics: no');
    const bug = lista.querySelector('#btnBug'); if (bug) lista.insertBefore(botao, bug); else lista.append(botao);
  }
  aplica(lePref() === 'on', false);
  // computador lento? pergunta UMA vez (só se a pessoa nunca escolheu)
  function mede() {
    if (lePref() !== null || G.leve) return;
    const amostras = []; let ant = 0; const fim = performance.now() + 8000;
    const passo = ts => {
      if (!G.rodando) return;
      if (ant && !G.pausado && document.visibilityState === 'visible') amostras.push(ts - ant);
      ant = ts;
      if (performance.now() < fim) return requestAnimationFrame(passo);
      if (amostras.length < 80) return;
      amostras.sort((a, b) => a - b); const med = amostras[amostras.length >> 1];
      if (med > 26 && typeof perguntaJogo === 'function') // abaixo de ~38 quadros por segundo
        perguntaJogo('The game is running a little slow on this computer. Want to turn on LIGHT GRAPHICS? (You can change it anytime in ☰ More.)', { titulo: '⚡ Light graphics', sim: 'Turn on', nao: 'Not now' })
          .then(sim => { gravaPref(sim ? 'on' : 'off'); if (sim) aplica(true, true); });
    };
    setTimeout(() => requestAnimationFrame(passo), 6000);
  }
  const _iniciarJogoPC = iniciarJogo;
  iniciarJogo = async function () { const r = await _iniciarJogoPC.apply(this, arguments); mede(); return r; };
})();
