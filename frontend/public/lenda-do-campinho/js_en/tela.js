/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   TAMANHO DA TELA DO JOGO (botão ⛶ no topo)
   - Normal: como sempre (largura máxima e proporção 16:10);
   - Larga: usa toda a largura da página e toda a altura que sobra;
   - Tela cheia: Larga + o navegador em tela cheia (Esc sai).
   A escolha fica guardada neste navegador. Só no computador.
   Carregar DEPOIS de layout.js e topo.js.
   ============================================================ */
const TELA_KEY = 'rac_tela_v1';
const TELA_MODOS = { normal: ['🔲', 'Normal screen'], larga: ['⬛', 'Wide screen'], cheia: ['⛶', 'Fullscreen'] };
let TELA_MODO = 'normal';
try { const v = localStorage.getItem(TELA_KEY); if (v === 'larga') TELA_MODO = 'larga'; } catch (e) { } // "cheia" não volta sozinha (o navegador pede um clique)
// v407 (Raio-X R7): no computador com 1600 px ou mais a tela LARGA é o padrão (antes sobrava uma faixa roxa vazia dos
// dois lados do jogo). Quem já escolheu "normal" no botão continua com a normal.
const TELA_PC_LARGO = 1600;
try { if (localStorage.getItem(TELA_KEY) == null && innerWidth >= TELA_PC_LARGO && !matchMedia('(pointer: coarse)').matches) TELA_MODO = 'larga'; } catch (e) { }

function aplicaTela() {
  document.body.classList.toggle('tela-larga', TELA_MODO !== 'normal');
  const b = document.getElementById('btnTela');
  if (b) { const [ic, nm] = TELA_MODOS[TELA_MODO]; b.textContent = ic; b.title = `${nm} — click to switch (Normal → Wide → Fullscreen)`; }
  if (typeof encaixaTela === 'function') { encaixaTela(); setTimeout(() => { try { encaixaTela(); } catch (e) { } }, 120); }
}
async function trocaTela() {
  const prox = TELA_MODO === 'normal' ? 'larga' : TELA_MODO === 'larga' ? 'cheia' : 'normal';
  if (prox === 'cheia') {
    try { await document.documentElement.requestFullscreen(); } catch (e) { TELA_MODO = 'normal'; aplicaTela(); return; } // navegador não deixou: volta ao normal
  } else if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch (e) { } }
  TELA_MODO = prox; try { localStorage.setItem(TELA_KEY, prox === 'normal' ? 'normal' : 'larga'); } catch (e) { }
  aplicaTela();
  if (typeof log === 'function' && G.save) log(`🖥️ ${TELA_MODOS[prox][1]}${prox === 'cheia' ? ' (Esc to exit)' : ''}.`, 'l-sis');
}
// saiu da tela cheia pelo Esc: fica na larga
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && TELA_MODO === 'cheia') { TELA_MODO = 'larga'; aplicaTela(); } });

// a altura: no modo largo não trava em 16:10, usa tudo o que sobra
const _encaixaTelaT = encaixaTela;
encaixaTela = function () {
  if (!document.body.classList.contains('tela-larga')) return _encaixaTelaT();
  const tela = document.getElementById('tela'); if (!tela) return;
  if (innerWidth <= 900 || document.getElementById('app')?.hidden) { tela.style.height = ''; tela.style.aspectRatio = ''; return; }
  const topo = document.getElementById('topo'), barra = document.getElementById('barraAcoes'), log = document.getElementById('log');
  const topoH = topo ? topo.getBoundingClientRect().height : 0;
  document.documentElement.style.setProperty('--topoH', Math.ceil(topoH) + 'px');
  const resto = (barra ? barra.offsetHeight : 0) + (log ? log.offsetHeight : 0) + 16 + 20 + 6;
  const h = Math.floor(Math.max(300, innerHeight - topoH - resto));
  if (Math.abs((parseFloat(tela.style.height) || 0) - h) > 1) { tela.style.aspectRatio = 'auto'; tela.style.height = h + 'px'; }
};

// tela maior mostra MAIS campo (não bonecos maiores): cada quadro fica com ~66 px, como na tela normal
const _ajustaCanvasT = ajustaCanvas;
ajustaCanvas = function () {
  _ajustaCanvasT();
  if (!document.body.classList.contains('tela-larga') || (G.mapa && G.mapa.interior)) return;
  const r = CV.getBoundingClientRect(); if (r.width < 640) return;
  G.zoom = Math.min(G.zoom, 66 * G.dpr * (15.5 / (G.zoomVis || 15.5)) / T); // a rodinha do mouse continua aproximando/afastando
};

// v407 (Raio-X R7): computador (1280 px ou mais) sem layout salvo → painéis dos DOIS lados. Numa coluna só (1902×907) o Equipamento ficava
// cortado e a Mochila/bolsas saíam da tela. Direita: retrato, minimapa e Batalha; esquerda: Mochila/Equipamento/Habilidades
// e as bolsas abertas. Não grava nada: se o jogador arrastar um painel, aí sim vira o layout dele.
const telaPadraoDoisLados = () => ({ esq2: [], esq: [{ g: ['mochila', 'equip', 'skills'], a: 'equip', m: false }, 'bolsas'], dir: ['perfil', 'mini', { g: ['batalha'], a: 'batalha', m: false }], dir2: [], min: {} });
if (typeof leLayout === 'function') {
  const _leLayoutTl = leLayout;
  leLayout = function () {
    const L = _leLayoutTl.apply(this, arguments); if (L) return L;
    if (innerWidth >= 1280 && !matchMedia('(pointer: coarse)').matches && typeof normalizaLayout === 'function') return normalizaLayout(telaPadraoDoisLados()); // (de 1280 a 1599 px também: numa coluna só a Mochila ficava lá embaixo)
    return null;
  };
}

(function () {
  const grupo =document.querySelector('#topo .tb-som') || document.querySelector('#topo .topo-nav');
  if (grupo && !document.getElementById('btnTela')) { const b = el('button', { class: 'btn mini', id: 'btnTela', type: 'button', onclick: () => trocaTela() }); grupo.prepend(b); }
  const st = document.createElement('style');
  st.textContent = `
  @media (min-width: 901px) {
    body.tela-larga #principal, body.tela-larga #principal:has(#lateralEsq:not(.vazia)), body.tela-larga #principal:has(#lateralEsq2:not(.vazia)), body.tela-larga #principal:has(#lateral2:not(.vazia)), body.tela-larga.colunas-extras #principal { max-width: none; }
  }
  `;
  document.head.append(st);
  aplicaTela();
})();
