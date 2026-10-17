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
// (C4, 16/10; o teste crítico: o píer, a obra, o galho e a sujeira do salão atrás do relógio, da barra e do painel da esquerda) Como no
// Stardew, o HUD fica nos cantos e o que importa fica na área livre: (1) o Jocelino fica no meio da área livre (a tela sem a faixa de
// cima, a do cartão, e sem a barra embaixo), não no meio da tela; (2) com o alvo da seta na tela e embaixo de um painel, a câmera anda o
// mínimo para ele sair de baixo (o Jocelino continua à vista e fora dos painéis). Na borda do mapa a câmera não passa (o clamp de
// sempre); aí o painel recua (hud.js).
const _limCamera = () => { const q = G.mapa && G.mapa.enquadramento; return q || { x: 0, y: 0, w: (G.mapa ? G.mapa.larg : 20) * TILE, h: (G.mapa ? G.mapa.alt : 12) * TILE }; };
function _prendeCamera(x, y) {
  const vw = G.larg / G.zoom, vh = G.alt / G.zoom, lim = _limCamera();
  return { x: lim.w <= vw ? lim.x + (lim.w - vw) / 2 : clamp(x, lim.x, lim.x + lim.w - vw), y: lim.h <= vh ? lim.y + (lim.h - vh) / 2 : clamp(y, lim.y, lim.y + lim.h - vh) };
}
// A câmera com o Jocelino em (px, py), no meio da área livre (sem o empurrão do alvo). guia_setas.js usa para saber a tela de quando ele
// chegar a um lugar (_camChegando).
function cameraBase(px, py) {
  const vw = G.larg / G.zoom, vh = G.alt / G.zoom, f = typeof faixasDoHud === 'function' ? faixasDoHud() : { cima: 0, baixo: 0 };
  return _prendeCamera(px - vw / 2, py - 20 - vh / 2 - (f.cima - f.baixo) / 2 / G.zoom);
}
let _empurrao = null;   // o último empurrão da câmera: { chave do alvo, dx, dy } (fica o mesmo enquanto valer: a câmera não vai e volta)
function alvoCamera() {
  // (T7) durante uma história, a câmera é da cena (historias.js: o passo 'camera' leva devagar até a pessoa ou o ladrilho)
  { const ch = typeof cameraDaHistoria === 'function' ? cameraDaHistoria() : null; if (ch) { _empurrao = null; return ch; } }
  const base = cameraBase(G.jog ? G.jog.x : 0, G.jog ? G.jog.y : 0);
  const s = G.jog && G.mapa && typeof setaAgora === 'function' ? setaAgora() : null;
  if (!s || s.tipo !== 'alvo' || (s.mapa && s.mapa !== G.mapaId) || typeof paineisDaCamera !== 'function') { _empurrao = null; return base; }
  return _cameraComAlvo(base, s);
}
// A caixa do alvo da seta em px de mundo (o que precisa ficar à vista): o detrito/ponto embaixo da seta, a pessoa inteira ou o pé do
// objeto. s.x/s.y é o lugar da seta (em cima do alvo).
function caixaDoAlvo(s) {
  const ob = s.objeto && G.mapa && G.mapa.objs.find(o => o.id === s.objeto);
  const h = s.morador ? 120 : ob ? clamp(ob.y - s.y, 30, 110) : 52;
  return { x0: s.x - 22, x1: s.x + 22, y0: s.y + (s.morador ? 20 : 10), y1: s.y + h };
}
function _cameraComAlvo(base, s) {
  const z = G.zoom, L = G.larg, A = G.alt, P = paineisDaCamera(), b = caixaDoAlvo(s), j = G.jog;
  const tela = (c, x0, y0, x1, y1) => ({ l: (x0 - c.x) * z, t: (y0 - c.y) * z, r: (x1 - c.x) * z, b: (y1 - c.y) * z });
  const bate = (q, p) => q.l < p.r && q.r > p.l && q.t < p.b && q.b > p.t;
  const naTela = (q, m) => q.l >= m && q.t >= m && q.r <= L - m && q.b <= A - m;
  const alvoT = c => tela(c, b.x0, b.y0, b.x1, b.y1), jogT = c => tela(c, j.x - 16, j.y - 70, j.x + 16, j.y);
  const livre = c => { const a = alvoT(c), q = jogT(c); return naTela(a, 4) && !P.some(p => bate(a, p)) && naTela(q, 24) && !P.some(p => bate(q, p)); };
  const a0 = alvoT(base);
  // Fora da tela (a seta fica na borda, apontando) ou já à vista: a câmera de sempre.
  if (a0.r < 0 || a0.l > L || a0.b < 0 || a0.t > A || livre(base)) { _empurrao = null; return base; }
  // Os deslocamentos que tiram o alvo de baixo de cada painel (ou o trazem para dentro da tela), em px de tela; o menor que deixa tudo livre.
  const dxs = [0], dys = [0], m = 6;
  for (const p of P) { if (a0.t < p.b && a0.b > p.t) dxs.push(p.l - m - a0.r, p.r + m - a0.l); if (a0.l < p.r && a0.r > p.l) dys.push(p.t - m - a0.b, p.b + m - a0.t); }
  if (a0.l < 4) dxs.push(4 - a0.l); if (a0.r > L - 4) dxs.push(L - 4 - a0.r); if (a0.t < 4) dys.push(4 - a0.t); if (a0.b > A - 4) dys.push(A - 4 - a0.b);
  const chave = `${G.mapaId}:${Math.round(s.x)}:${Math.round(s.y)}`;
  const tenta = (dx, dy) => { const c = _prendeCamera(base.x - dx / z, base.y - dy / z); return livre(c) ? c : null; };
  let melhor = null, custo = 1e9;
  for (const dx of dxs) for (const dy of dys) { const c = tenta(dx, dy); if (!c) continue; const k = Math.hypot(c.x - base.x, c.y - base.y); if (k < custo - 0.5) { custo = k; melhor = { c, dx, dy }; } }
  // (sem vaivém) o empurrão de antes, para o mesmo alvo, continua se ainda serve e não é muito maior que o melhor
  if (_empurrao && _empurrao.chave === chave) { const c = tenta(_empurrao.dx, _empurrao.dy); if (c && Math.hypot(c.x - base.x, c.y - base.y) <= custo + 48 / z) return c; }
  if (!melhor) { _empurrao = null; return base; }
  _empurrao = { chave, dx: melhor.dx, dy: melhor.dy };
  return melhor.c;
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
  const tr = G.tremor > 0 && MODO_TESTE.efeitos ? G.tremor * 22 : 0;
  ctx.setTransform(z, 0, 0, z, (-G.cam.x + rnd(-tr, tr)) * z, (-G.cam.y + rnd(-tr, tr)) * z);
  if (G.mapa && typeof desenhaMapa === 'function') desenhaMapa(ctx);
  desenhaMarcadorMouse(ctx);
  // Noite: o mundo escurece aos poucos das 18h às 21h, multiplicando por um azul (escurece sem lavar as cores, como
  // a noite do Stardew); dentro de casa, menos; o palco da pensão já é a arte da hora. Depois, as luzes quentes acesas.
  const esc = relogio.escuridao() * fatorNoite(G.mapa);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (esc > 0) {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgb(${Math.round(255 - esc * 150)},${Math.round(255 - esc * 138)},${Math.round(255 - esc * 72)})`;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalCompositeOperation = 'source-over';
    if (G.mapa && typeof desenhaLuzes === 'function') { ctx.setTransform(z, 0, 0, z, -G.cam.x * z, -G.cam.y * z); desenhaLuzes(ctx, G.mapa, esc); ctx.setTransform(1, 0, 0, 1, 0, 0); }
  }
  ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
  for (const f of DESENHOS_TELA) f(ctx);
}

// (15/10, o jogador: "o sqm que o mouse estiver apontando fica com um marcador") Como o cursor de ladrilho do Stardew: o ladrilho
// debaixo do mouse ganha o marcador (arte ui/marcador, do Higgsfield); forte ao alcance do Jocelino (o ladrilho dele e os 8 em volta,
// onde a ferramenta e o botão direito agem), mais apagado longe. Some com janela aberta, em cima do HUD, no salão de lado e fora da tela.
function desenhaMarcadorMouse(ctx) {
  const m = G.mapa; if (!G.comecou || !m || m.palco || !G.mouse || !G.mouse.dentro || menuAberto()) return;
  if (typeof mouseNoPainelDoHud === 'function' && mouseNoPainelDoHud(G.mouse.x, G.mouse.y)) return;
  const t = ladrilhoDoMouse(); if (t.x < 0 || t.y < 0 || t.x >= m.larg || t.y >= m.alt) return;
  const p = G.jog.ladrilho(), perto = Math.max(Math.abs(t.x - p.x), Math.abs(t.y - p.y)) <= 1;
  // (15/10, o dono: "achei que está demais... use aquela que tira um pouco a cor do sqm") um véu claro e suave no ladrilho, como o do
  // Stardew, em vez dos cantinhos: desbota um pouco a cor do chão (mais forte ao alcance do Jocelino)
  ctx.save(); ctx.fillStyle = `rgba(255,252,235,${perto ? 0.26 : 0.13})`; ctx.strokeStyle = `rgba(255,255,255,${perto ? 0.45 : 0.22})`; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(t.x * TILE + 1, t.y * TILE + 1, TILE - 2, TILE - 2, 6); ctx.fill(); ctx.stroke(); ctx.restore();
}

let _ultimo = 0;
// O maior passo de tempo de um quadro. No modo de teste o limitador de 30 FPS pula quadros do rAF: com o rAF entre 32 e
// 39 Hz o intervalo chega a ~60 ms, e o teto de 50 ms comeria tempo da lógica; ali o teto é de 3 quadros (100 ms).
const TETO_DT = MODO_TESTE.fps ? Math.max(0.05, 3 / MODO_TESTE.fps) : 0.05;
function quadro(ts) {
  const dt = Math.min(TETO_DT, _ultimo ? (ts - _ultimo) / 1000 : 0.016);
  _ultimo = ts;
  G.quadros++;
  try { atualiza(dt); desenha(dt); }
  catch (e) { console.error(e); }
}
function loop(ts) {
  // No modo de teste (?test=1), no máximo MODO_TESTE.fps quadros por segundo (a folga de 2 ms pega o quadro de 60 Hz certo).
  if (!MODO_TESTE.fps || ts - _ultimo >= 1000 / MODO_TESTE.fps - 2) quadro(ts);
  requestAnimationFrame(loop);
}
// Reserva: janela escondida (testes) ou aba em segundo plano quase não chamam o requestAnimationFrame;
// se o quadro atrasar, o laço anda pelo relógio comum.
setInterval(() => { const t = performance.now(); if (t - _ultimo > 100) quadro(t); }, 33);

// Começa (ou continua) o jogo a partir de um save.
async function iniciarJogo(save) {
  // A arte do jogo inteiro vai sendo baixada aos poucos logo depois do começo (fora dos testes, que medem o jogo sem isso).
  if (!window._precarregou && typeof ARTE_LISTA !== 'undefined' && !MODO_TESTE.ativo) { window._precarregou = true; setTimeout(() => precarregarArtes(ARTE_LISTA), 1500); }
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
  { const d = document.getElementById('guia-dica'); if (d) { d.hidden = true; d._chave = ''; } }   // a dica do guia não fica por cima da capa
  const tem = !!lerSave();
  const capa = $('#capa');
  capa.innerHTML = '';
  capa.append(el('div', { class: 'painel' },
    // (15/10) o logotipo escolhido pelo dono (a placa de madeira com a casa, o mar, o muro e a panela; produzir_logo.sh, opção 2)
    el('img', { class: 'logo-capa', src: urlArte('ui/logo'), alt: 'Família Santos' }),
    el('div', { class: 'teclas' }, 'WASD anda · clique usa a ferramenta · botão direito conversa e age · E mochila · F tela cheia'),
    el('div', { class: 'botoes' },
      tem ? el('button', { class: 'botao forte', onclick: () => iniciarJogo(lerSave()) }, 'Continuar') : null,
      el('button', { class: 'botao' + (tem ? '' : ' forte'), onclick: () => novoJogo() }, 'Novo jogo'))));
  capa.hidden = false;
}

addEventListener('resize', ajustaCanvas);
addEventListener('load', () => {
  ajustaCanvas();
  instalaEntrada();
  requestAnimationFrame(loop);
  if (/pensao=1/.test(location.search)) iniciarJogo(saveDaPensao());
  else if (!MODO_TESTE.ativo) mostrarCapa();
});
// Atalho de conferência (?pensao=1): a pensão aberta e limpa, despensa cheia, 16h40 dentro do salão. Marcado soTeste:
// salvar() não grava nada (nem ao dormir), para não apagar o save de verdade.
function saveDaPensao() {
  return Object.assign(novoSave(), { dia: 3, minutos: 16 * 60 + 40, dinheiro: 300, mapa: 'pensao_palco', tile: [8, 18], boasVindas: true, soTeste: true,
    pensao: { estado: 'aberta', abreDia: 3, mesas: 2, despensa: { arroz: 10, feijao: 10, ovo: 10, farinha: 5 }, cardapio: ['pf_peao'] },
    mapas: { pensao_dentro: { detritos: [] } },
    guia: Object.assign(Guia.novo(true), { feitas: GUIA_MISSOES.map(m => m.id), antes: GUIA_SISTEMAS.slice() }) });   // o atalho já passou do guia (Frente 4)
}
// Quanto a noite escurece o mapa: o palco da pensão já é a arte da hora (o fundo de dia e o de noite, 14/10) e as bancadas da pedreira são debaixo da terra (0); dentro de casa, menos;
// e, com o cenário pintado de noite (a casa por dentro, 14/10), quase nada: a arte já vem na penumbra (só os móveis soltos acompanham).
const NOITE_DENTRO = 0.35, NOITE_DENTRO_PINTADA = 0.15;
function fatorNoite(m) { return m && (m.palco || m.subsolo) ? 0 : m && m.dentro ? (cenarioNoiteAlfa(m) > 0 ? NOITE_DENTRO_PINTADA : NOITE_DENTRO) : 1; }
