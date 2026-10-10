// Jocelino — jogo.js — o canvas do tamanho da janela, a câmera, o laço (atualiza/desenha) e o começo do jogo.
// O canvas ocupa a janela toda (× devicePixelRatio, no máximo 2): o mundo aparece com uns 15 ladrilhos de largura;
// um cômodo "de tela cheia" (o salão da pensão) enquadra o cenário inteiro, como o sushi bar do Dave.

// Como o Stardew em 1080p com zoom 100%: uns 17 ladrilhos de altura (30 de largura numa tela larga).
const LADRILHOS_DE_ALTURA = 17;
let ctx = null;

function ajustaCanvas() {
  const cv = $('#tela');
  G.dpr = Math.min(2, window.devicePixelRatio || 1);
  G.larg = innerWidth; G.alt = innerHeight;
  cv.width = Math.round(G.larg * G.dpr);
  cv.height = Math.round(G.alt * G.dpr);
  ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ajustaZoom();
}
function ajustaZoom() {
  const q = G.mapa && G.mapa.enquadramento;
  if (q) G.zoom = Math.max(G.larg / q.w, G.alt / q.h);
  else {
    const pct = (G.opcoes && G.opcoes.zoom) || 100;
    G.zoom = G.alt / (LADRILHOS_DE_ALTURA * TILE) * pct / 100;
    // Nunca mais longe que o mapa inteiro (sem faixa preta em volta).
    if (G.mapa) G.zoom = Math.max(G.zoom, G.larg / (G.mapa.larg * TILE), G.alt / (G.mapa.alt * TILE));
  }
}

// Câmera presa ao mapa (ou ao enquadramento do cômodo); segue o Jocelino suavemente.
function alvoCamera() {
  const vw = G.larg / G.zoom, vh = G.alt / G.zoom;
  const q = G.mapa && G.mapa.enquadramento;
  const lim = q || { x: 0, y: 0, w: (G.mapa ? G.mapa.larg : 20) * TILE, h: (G.mapa ? G.mapa.alt : 12) * TILE };
  let x = (G.jog ? G.jog.x : 0) - vw / 2, y = (G.jog ? G.jog.y - 20 : 0) - vh / 2;
  x = lim.w <= vw ? lim.x + (lim.w - vw) / 2 : clamp(x, lim.x, lim.x + lim.w - vw);
  y = lim.h <= vh ? lim.y + (lim.h - vh) / 2 : clamp(y, lim.y, lim.y + lim.h - vh);
  return { x, y };
}

function atualiza(dt) {
  G.pausado = menuAberto();
  if (G.pausado || !G.comecou) return;
  G.agora += dt;
  relogio.avancar(dt);
  for (const f of ATUALIZADORES) f(dt);
}

function desenha(dt) {
  if (!ctx) return;
  const a = alvoCamera();
  const k = Math.min(1, (dt || 0.016) * 10);
  G.cam.x = G._camPronta ? lerp(G.cam.x, a.x, k) : a.x;
  G.cam.y = G._camPronta ? lerp(G.cam.y, a.y, k) : a.y;
  G._camPronta = true;
  const z = G.zoom * G.dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#120d0a';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  // Tremidinho no acerto forte (picareta na pedra, machado no toco).
  const tr = G.tremor > 0 ? G.tremor * 22 : 0;
  ctx.setTransform(z, 0, 0, z, (-G.cam.x + rnd(-tr, tr)) * z, (-G.cam.y + rnd(-tr, tr)) * z);
  if (G.mapa && typeof desenhaMapa === 'function') desenhaMapa(ctx);
  // Noite: o mundo escurece aos poucos das 18h às 21h (dentro de casa, menos).
  const esc = relogio.escuridao() * (G.mapa && G.mapa.dentro ? 0.25 : 0.62);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (esc > 0) { ctx.fillStyle = `rgba(20,24,70,${esc})`; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); }
  ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
  for (const f of DESENHOS_TELA) f(ctx);
}

let _ultimo = 0;
function quadro(ts) {
  const dt = Math.min(0.05, _ultimo ? (ts - _ultimo) / 1000 : 0.016);
  _ultimo = ts;
  G.quadros++;
  try { atualiza(dt); desenha(dt); }
  catch (e) { console.error(e); }
}
function loop(ts) {
  quadro(ts);
  requestAnimationFrame(loop);
}
// Reserva: janela escondida (testes) ou aba em segundo plano quase não chamam o requestAnimationFrame;
// se o quadro atrasar, o laço anda pelo relógio comum.
setInterval(() => { const t = performance.now(); if (t - _ultimo > 100) quadro(t); }, 33);

// Começa (ou continua) o jogo a partir de um save.
async function iniciarJogo(save) {
  G.save = migraSave(save);
  const s = G.save;
  G.dia = s.dia; G.minutos = s.minutos; G.dinheiro = s.dinheiro; G.energia = s.energia;
  relogio._acum = 0;
  for (const f of INICIADORES) f(s);
  if (typeof entrarMapa === 'function') entrarMapa(s.mapa || 'quintal', { x: s.tile[0], y: s.tile[1] });
  $('#capa').hidden = true;
  G.comecou = true;
  G._camPronta = false;
  if (typeof hudSujo === 'function') hudSujo();
  return true;
}

// Capa: Continuar (se houver save) ou Novo jogo.
function mostrarCapa() {
  const tem = !!lerSave();
  const capa = $('#capa');
  capa.innerHTML = '';
  capa.append(el('div', { class: 'painel' },
    el('h1', { class: 'titulo' }, 'JOCELINO'),
    el('div', { class: 'sub' }, 'Um legado em construção'),
    el('div', { class: 'teclas' }, 'WASD anda · clique usa a ferramenta · botão direito conversa e age · E mochila · F tela cheia'),
    el('div', { class: 'botoes' },
      tem ? el('button', { class: 'botao forte', onclick: () => iniciarJogo(lerSave()) }, 'Continuar') : null,
      el('button', { class: 'botao' + (tem ? '' : ' forte'), onclick: () => iniciarJogo(novoSave()) }, 'Novo jogo'))));
  capa.hidden = false;
}

addEventListener('resize', ajustaCanvas);
addEventListener('load', () => {
  ajustaCanvas();
  instalaEntrada();
  requestAnimationFrame(loop);
  if (/pensao=1/.test(location.search)) iniciarJogo(saveDaPensao());
  else if (!/teste=1/.test(location.search)) mostrarCapa();
});
// Atalho de conferência (?pensao=1): a pensão aberta e limpa, despensa cheia, 16h40 dentro do salão. Marcado soTeste:
// salvar() não grava nada (nem ao dormir), para não apagar o save de verdade.
function saveDaPensao() {
  return Object.assign(novoSave(), { dia: 3, minutos: 16 * 60 + 40, dinheiro: 300, mapa: 'pensao_dentro', tile: [14, 12], boasVindas: true, soTeste: true,
    pensao: { estado: 'aberta', abreDia: 3, mesas: 2, despensa: { arroz: 10, feijao: 10, ovo: 10, farinha: 5 }, cardapio: ['pf_peao'] },
    mapas: { pensao_dentro: { detritos: [] } } });
}
