/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   🖥️ CONTADOR DE FPS (v301): quadros por segundo do jogo, num selinho no canto da tela.
   - liga/desliga no menu 🎵 ("Mostrar FPS"); começa desligado e a escolha fica salva neste navegador;
   - conta os quadros de verdade do laço do jogo (loop) e atualiza 2 vezes por segundo;
   - verde = liso (50+), amarelo = 30 a 49, vermelho = abaixo de 30.
   Carregar DEPOIS de game.js e audio.js.
   ============================================================ */
{
  const CHAVE = 'rac_fps';
  let ligado = false; try { ligado = localStorage.getItem(CHAVE) === '1'; } catch (e) { }
  let quadros = 0, desde = performance.now(), gasto = 0, selo = null;

  // conta cada volta do laço do jogo (e quanto tempo ela levou)
  const _loopFps = loop;
  loop = function (ts) {
    if (!ligado) return _loopFps.apply(this, arguments);
    const a = performance.now();
    try { return _loopFps.apply(this, arguments); } finally { quadros++; gasto += performance.now() - a; }
  };

  function posiciona() {
    const cv = document.getElementById('cv'); if (!selo || !cv) return; const r = cv.getBoundingClientRect();
    selo.style.left = (r.left + 8) + 'px'; selo.style.top = (r.bottom - 30) + 'px';
  }
  function mostra(on) {
    ligado = on; try { localStorage.setItem(CHAVE, on ? '1' : '0'); } catch (e) { }
    if (on && !selo) { selo = document.createElement('div'); selo.id = 'seloFps'; selo.textContent = '… FPS'; document.body.append(selo); posiciona(); }
    if (selo) selo.hidden = !on;
    quadros = 0; gasto = 0; desde = performance.now();
  }
  setInterval(() => {
    if (!ligado || !selo) return;
    const agora = performance.now(), dt = (agora - desde) / 1000; if (dt <= 0) return;
    const fps = Math.round(quadros / dt), ms = quadros ? gasto / quadros : 0;
    selo.textContent = (document.hidden ? '— ' : fps + ' ') + 'FPS';
    selo.title = `Quadros por segundo: ${fps} · cada quadro leva ~${ms.toFixed(1)} ms para desenhar`;
    selo.className = fps >= 50 ? 'bom' : fps >= 30 ? 'medio' : 'ruim';
    quadros = 0; gasto = 0; desde = agora; posiciona();
  }, 500);
  window.addEventListener('resize', posiciona);

  const st = document.createElement('style');
  st.textContent = `#seloFps { position: fixed; z-index: 40; pointer-events: auto; font: 800 13px Fredoka, Nunito, sans-serif; padding: 3px 8px; border-radius: 8px;
    background: rgba(20,14,30,.72); color: #7dff8a; border: 1.5px solid rgba(255,255,255,.25); letter-spacing: .3px; user-select: none; }
  #seloFps.medio { color: #ffe14a; } #seloFps.ruim { color: #ff6a5a; }
  .rac-audio-pop label.fps-opc { display: flex; align-items: center; gap: 8px; margin-top: 8px; cursor: pointer; }
  .rac-audio-pop label.fps-opc input { width: auto; accent-color: var(--madeira, #8a4b24); }`;
  document.head.append(st);

  // a opção fica no menu 🎵 (junto do volume)
  function poeOpcao() {
    const pop = document.querySelector('.rac-audio-pop'); if (!pop) return false; if (pop.querySelector('.fps-opc')) return true;
    const l = document.createElement('label'); l.className = 'fps-opc';
    const c = document.createElement('input'); c.type = 'checkbox'; c.checked = ligado; c.addEventListener('change', () => mostra(c.checked));
    const s = document.createElement('span'); s.textContent = 'Mostrar FPS (quadros por segundo)';
    l.append(c, s); const dica = pop.querySelector('small'); dica ? pop.insertBefore(l, dica) : pop.append(l);
    return true;
  }
  const tenta = () => { if (!poeOpcao()) setTimeout(tenta, 500); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { tenta(); if (ligado) mostra(true); }); else { tenta(); if (ligado) mostra(true); }
}
