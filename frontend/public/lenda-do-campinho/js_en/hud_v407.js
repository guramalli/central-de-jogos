/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🧭 HUD MAIS LIMPO (v407, Raio-X A1 — parte visual; a lógica de liberar botões por nível e a fila de dicas é da frente DESIGN)
   - botões do topo numa cor só, cada um com o seu ícone (antes: verde, laranja, roxo, amarelo... cada um de uma cor);
   - barra de atalhos: só a 1ª fileira (1..0) até o nível 10, a não ser que já tenha algo na 2ª; no celular só os espaços usados;
   - cartões "Agora" e "Dica" não ficam sempre por cima: quando o seu boneco passa por baixo deles ficam quase transparentes
     (e deixam o clique passar), e o "Agora" encolhe para uma linha curta depois de alguns segundos (passar o mouse mostra tudo).
   (Arcos menores: arcos.js · nomes dos bichos só no alvo: game.js · ícones do minimapa da casa: minimapa.js.)
   Prefixo: hv. Carregar DEPOIS de ui.js, objetivo_agora.js e celular.js.
   ============================================================ */
const HV_NIVEL_FILEIRA2 = 10;
{
  // ---------- barra de atalhos ----------
  const hvHotbar = () => {
    const s = G.save; if (!s || !Array.isArray(s.hotbar)) return;
    const usa2 = s.hotbar.slice(10).some(Boolean);
    document.body.classList.toggle('hv-so1', s.nivel < HV_NIVEL_FILEIRA2 && !usa2);
    document.querySelectorAll('#hotbar .slot').forEach((b, i) => b.classList.toggle('hv-vazio', !s.hotbar[i]));
  };
  const _apHv = atualizaPaineis;
  atualizaPaineis = function () { const r = _apHv.apply(this, arguments); try { hvHotbar(); } catch (e) { } return r; };
  // arrastando algo para a barra: os espaços vazios aparecem (para poder soltar)
  document.addEventListener('dragstart', () => document.body.classList.add('hv-arrasta'));
  document.addEventListener('dragend', () => document.body.classList.remove('hv-arrasta'));

  // ---------- "Agora" encolhe depois de um tempo ----------
  let hvAgoraTxt = '', hvAgoraT = 0;
  if (typeof atualizaRastreador === 'function') {
    const _rastHv = atualizaRastreador;
    atualizaRastreador = function () {
      const r = _rastHv.apply(this, arguments);
      const b = document.querySelector('#rastreador .obj-agora');
      if (b) {
        if (b.textContent !== hvAgoraTxt) { hvAgoraTxt = b.textContent; hvAgoraT = performance.now(); }
        b.classList.toggle('hv-curto', performance.now() - hvAgoraT > 8000);
      }
      return r;
    };
  }
  // ---------- cartões ficam transparentes quando o boneco passa por baixo ----------
  setInterval(() => {
    try {
      if (!G.rodando || !G.p || !G.cam) return;
      const R = document.getElementById('rastreador'), cv = document.getElementById('cv'); if (!R || !cv) return;
      const b = document.querySelector('#rastreador .obj-agora');
      if (b && !b.classList.contains('hv-curto') && performance.now() - hvAgoraT > 8000) b.classList.add('hv-curto');
      const rc = cv.getBoundingClientRect(); if (!rc.width) return;
      const k = rc.width / cv.width, z = G.zoom;
      const px = rc.left + (G.p.x * T - G.cam.x) * z * k, py = rc.top + (G.p.y * T - G.cam.y) * z * k;
      const alt = (typeof alturaEnt === 'function' ? alturaEnt(G.p) : 1.2) * T * z * k;
      let atras = false;
      for (const c of R.children) {
        const r = c.getBoundingClientRect(); if (!r.width) continue;
        if (px > r.left - 30 && px < r.right + 30 && py > r.top - 10 && py - alt < r.bottom + 10) { atras = true; break; }
      }
      R.classList.toggle('hv-atras', atras);
    } catch (e) { }
  }, 200);

  const st = document.createElement('style'); st.id = 'hud-v407-css';
  st.textContent = `
  /* topo: uma cor só (madeira escura com borda dourada), o ícone diz o que é */
  #topo .topo-nav > .btn, #topo .topo-nav > .tb-mais > .btn, #topo .tb-som > .btn {
    background: linear-gradient(#4a3290, #33206e) !important; color: #fff3cf !important; border-color: #8a6ad8 !important; text-shadow: 0 1px 0 rgba(0,0,0,.45) !important; }
  #topo .topo-nav > .btn:hover, #topo .topo-nav > .tb-mais > .btn:hover, #topo .tb-som > .btn:hover, #topo .tb-mais > .btn.aberto { background: linear-gradient(#5d43ad, #402a86) !important; border-color: var(--amarelo) !important; filter: none; }
  #topo .topo-nav > .btn.tem-pontos { border-color: var(--amarelo) !important; box-shadow: 0 0 0 2px rgba(255,210,63,.45) !important; }
  /* barra de atalhos */
  @media (min-width: 901px) { body.hv-so1:not(.hv-arrasta) #hotbar .slot.num { display: none; } }
  body.modo-celular:not(.hv-arrasta) #hotbar .slot.hv-vazio { display: none !important; }
  /* cartões Agora / Dica */
  #rastreador { transition: opacity .25s; }
  #rastreador.hv-atras { opacity: .28; }
  #rastreador.hv-atras, #rastreador.hv-atras * { pointer-events: none !important; }
  #rastreador .obj-agora.hv-curto { max-width: 260px; opacity: .85; }
  #rastreador .obj-agora.hv-curto:hover { max-width: 100%; opacity: 1; }
  `;
  document.head.append(st);
}
