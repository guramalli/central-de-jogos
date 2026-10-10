// Jocelino — entrada.js — teclado e mouse.
// WASD/setas andam; Shift corre; clique esquerdo usa o item da mão no ladrilho-alvo; clique direito (ou X) age
// (conversa, abre, colhe, entrega); E abre a mochila; Tab troca a fileira da barra; 1-0 escolhem o espaço;
// Esc abre as opções; F alterna a tela cheia. As teclas de ação podem ser trocadas nas opções (TECLAS).

const TECLAS_PADRAO = { cima: 'KeyW', baixo: 'KeyS', esquerda: 'KeyA', direita: 'KeyD', usar: 'KeyC', acao: 'KeyX', mochila: 'KeyE',
  fileira: 'Tab', correr: 'ShiftLeft', opcoes: 'Escape', telacheia: 'KeyF' };
const TECLAS = Object.assign({}, TECLAS_PADRAO);
const ehTecla = (e, acao) => e.code === TECLAS[acao];

function instalaEntrada() {
  addEventListener('keydown', e => {
    if (e.code === 'Tab') e.preventDefault();
    if (teclaNoModal(e)) { e.preventDefault(); return; }
    if (!$('#capa').hidden) return;
    G.teclas.add(e.code);
    if (e.repeat) return;
    if (ehTecla(e, 'telacheia')) { alternaTelaCheia(); return; }
    if (ehTecla(e, 'opcoes') && typeof abrirOpcoes === 'function') { abrirOpcoes(); return; }
    if (ehTecla(e, 'mochila') && typeof abrirMochila === 'function') { abrirMochila(); return; }
    if (ehTecla(e, 'fileira') && G.mochila) { G.mochila.girarFileiras(e.shiftKey ? -1 : 1); hudSujo(); return; }
    if (ehTecla(e, 'acao')) { acaoNaFrente(); return; }
    if (ehTecla(e, 'usar')) { usarItemDaMao(); return; }
    const n = e.code.startsWith('Digit') ? Number(e.code.slice(5)) : NaN;
    if (!isNaN(n)) { G.sel = n === 0 ? 9 : n - 1; hudSujo(); }
  });
  addEventListener('keyup', e => G.teclas.delete(e.code));
  addEventListener('blur', () => G.teclas.clear());
  const cv = $('#tela');
  cv.addEventListener('mousemove', e => { G.mouse.x = e.clientX; G.mouse.y = e.clientY; });
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('mousedown', e => {
    G.mouse.x = e.clientX; G.mouse.y = e.clientY;
    if (menuAberto()) return;
    if (e.button === 0) usarItemDaMao();
    else if (e.button === 2) acaoNoMouse();
  });
  cv.addEventListener('wheel', e => { if (!menuAberto() && G.mochila) { G.sel = (G.sel + (e.deltaY > 0 ? 1 : 11)) % 12; hudSujo(); } }, { passive: true });
}

// Posição do mouse no mundo (pixels de mundo) e o ladrilho.
function mouseMundo() {
  return { x: G.mouse.x / G.zoom + G.cam.x, y: G.mouse.y / G.zoom + G.cam.y };
}
function ladrilhoDoMouse() { const m = mouseMundo(); return { x: Math.floor(m.x / TILE), y: Math.floor(m.y / TILE) }; }

function alternaTelaCheia() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
  else document.exitFullscreen().catch(() => {});
}
