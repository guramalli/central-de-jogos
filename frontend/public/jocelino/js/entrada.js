// Jocelino — entrada.js — teclado e mouse.
// WASD/setas andam; Shift corre; clique esquerdo usa o item da mão no ladrilho-alvo; clique direito (ou X) age
// (conversa, abre, colhe, entrega); E abre a mochila; Tab troca a fileira da barra; 1-0 escolhem o espaço;
// Esc abre as opções; F alterna a tela cheia. As teclas ficam em TECLAS (trocar pelas opções: fase 2).

const TECLAS_PADRAO = { cima: 'KeyW', baixo: 'KeyS', esquerda: 'KeyA', direita: 'KeyD', usar: 'KeyC', acao: 'KeyX', mochila: 'KeyE', habilidades: 'KeyH', fabricar: 'KeyB', caderneta: 'KeyJ',
  fileira: 'Tab', correr: 'ShiftLeft', opcoes: 'Escape', telacheia: 'KeyF' };
const TECLAS = Object.assign({}, TECLAS_PADRAO);
const ehTecla = (e, acao) => e.code === TECLAS[acao];

function instalaEntrada() {
  addEventListener('keydown', e => {
    // Digitando num campo de texto (a nota da caixa-preta): a tecla é do texto, não do jogo; Esc fecha o menu.
    // (com a caixinha da nota aberta, o teclado é dela mesmo fora do campo, como no botão depois de um Tab)
    if (/^(TEXTAREA|INPUT)$/.test((e.target && e.target.tagName) || '') || (!$('#modal').hidden && $('#modal .nota-caixa'))) { if (e.code === 'Escape') fecharModal(); return; }
    if (e.code === 'Tab') e.preventDefault();
    if (teclaNoModal(e)) { e.preventDefault(); return; }
    if (!$('#capa').hidden) return;
    G.teclas.add(e.code);
    if (e.repeat) return;
    if (ehTecla(e, 'telacheia')) { alternaTelaCheia(); return; }
    if (ehTecla(e, 'opcoes') && typeof abrirOpcoes === 'function') { abrirOpcoes(); return; }
    if (ehTecla(e, 'mochila') && typeof abrirMochila === 'function') { abrirMochila(); return; }
    if (ehTecla(e, 'habilidades') && typeof abrirHabilidades === 'function' && !(typeof noPalco === 'function' && noPalco())) { abrirHabilidades(); return; }
    if (ehTecla(e, 'fabricar') && typeof abrirFabricar === 'function' && !(typeof noPalco === 'function' && noPalco()) && !menuAberto()) { abrirFabricar(); return; }
    if (ehTecla(e, 'caderneta') && typeof abrirCaderneta === 'function' && !(typeof noPalco === 'function' && noPalco())) { if ($('#modal .caderneta')) fecharModal(); else if (!menuAberto()) abrirCaderneta(); return; }
    if (ehTecla(e, 'fileira') && G.mochila) { G.mochila.girarFileiras(e.shiftKey ? -1 : 1); hudSujo(); return; }
    if (G.copo && (e.code === 'Space' || ehTecla(e, 'usar') || ehTecla(e, 'acao'))) { if (!e.repeat) copoSegura(true); return; }
    if (G.copo && G.copo.caipi && /^Digit[1-3]$/.test(e.code)) { caipiTecla(Number(e.code.slice(5))); return; }   // (E2) a caipirinha: 1, 2 e 3 são os ingredientes
    if (ehTecla(e, 'acao')) { if (typeof noPalco === 'function' && noPalco()) palcoAgirNaFrente(); else acaoNaFrente(); return; }
    if (ehTecla(e, 'usar')) { if (typeof noPalco === 'function' && noPalco()) return; usarItemDaMao(true); return; }
    const n = e.code.startsWith('Digit') ? Number(e.code.slice(5)) : NaN;
    if (!isNaN(n)) { G.sel = n === 0 ? 9 : n - 1; hudSujo(); }
  });
  addEventListener('keyup', e => { G.teclas.delete(e.code); if (G.copo && (e.code === 'Space' || ehTecla(e, 'usar') || ehTecla(e, 'acao'))) copoSegura(false); });
  addEventListener('blur', () => { G.teclas.clear(); G.mouse.segura = false; });
  const cv = $('#tela');
  cv.addEventListener('mousemove', e => { G.mouse.x = e.clientX; G.mouse.y = e.clientY; });
  // O botão direito é do jogo em qualquer lugar da página (conversa, mochila, loja): nunca abre o menu do navegador.
  addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('mousedown', e => {
    G.mouse.x = e.clientX; G.mouse.y = e.clientY;
    if (menuAberto()) return;
    // (Tarefa C) no copo: o esquerdo segura para despejar; o direito endireita o copo da cerveja
    if (typeof noPalco === 'function' && noPalco()) { if (G.copo) { if (G.copo.caipi) caipiClique(e.clientX, e.clientY); else if (e.button === 2) copoEndireita(); else copoSegura(true); return; } const mm = mouseMundo(); palcoClique(mm.x, mm.y); return; }
    // (onda final; o Stardew: clicar no HUD não usa a ferramenta) o clique esquerdo em cima do quadro de tarefas ou do cartão (que deixam
    // o clique passar para o mundo) não dá golpe; o direito continua passando (abre o depósito embaixo deles)
    if (e.button === 0 && typeof mouseNoPainelDoHud === 'function' && mouseNoPainelDoHud(e.clientX, e.clientY)) return;
    if (e.button === 0) { G.mouse.segura = true; G.mouse.apertou = true; usarItemDaMao(); }
    else if (e.button === 2) acaoNoMouse();
  });
  addEventListener('mouseup', e => { if (e.button === 0) G.mouse.segura = false; if (G.copo && e.button !== 2) copoSegura(false); });
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
