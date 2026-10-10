// Jocelino — mapas.js — os mapas montados em código (como o Construtor do Lenda), com as posições do Godot × 3
// (lá 16 px por ladrilho com a arte encolhida 3 vezes; aqui 48 px, a arte no tamanho original).
// Chão: grama de fundo + caminho/calçada/terra por ladrilho, pintados UMA vez num canvas fora da tela.
// Objetos: enfeites, interativos (botão direito / ferramenta) e detritos; cada um com a caixa do pé (só a base
// bloqueia, como no Stardew), desenhados em ordem de altura; quem cobre o Jocelino fica transparente.

const CH = { GRAMA: 0, CAMINHO: 1, CALCADA: 2, TERRA: 3 };
const MAPAS_DEF = {};          // id -> função (construtor) que monta o mapa
const MAPAS = {};              // id -> mapa já montado (fica na memória: guarda o estado do dia)
const ALCANCE_ACAO = 2.2 * TILE;

// Nome discreto em cima de cada estabelecimento (o objeto pode trocar com o.placa = '...').
const PLACAS = { deposito: 'Depósito do Seu Ananias', oficina: 'Ferraria do Seu Tonico', mercado: 'Mercado Municipal', museu: 'Museu da Vila',
  casa_juca: 'Casa do Tio Juca', pensao: 'Pensão da Rosa', casa_zelia: 'Obra da Dona Zélia' };
const DICAS_OBJ = {
  casa_juca: ['Casa do Tio Juca', 'Botão direito na porta: dormir (salva o jogo).'],
  caixa_correio: ['Caixa de correio', 'Botão direito: ler as cartas.'],
  caixa_venda: ['Caixa de venda', 'Com um item na mão, botão direito: vende de madrugada.'],
  radio: ['Rádio', 'Botão direito: a previsão do tempo de amanhã.'],
  deposito: ['Depósito do Seu Ananias', 'Botão direito: entrar e comprar (das 9h às 17h).'],
  pensao: ['Pensão da Rosa', 'Botão direito: entrar. Janta das 17h às 21h.'],
};

class Construtor {
  constructor(id, larg, alt, semente = 1) {
    Object.assign(this, { id, larg, alt, chao: new Uint8Array(larg * alt), objs: [], ocupado: new Map(), solidos: [], moradores: [],
      saidas: [], itens: [], livre: { x: 2, y: 3, w: larg - 4, h: alt - 5 }, fundo: 'texturas/grama', dentro: false,
      enquadramento: null, cenario: null, rng: mulberry(semente), chaoCanvas: null, inicio: { x: 2, y: 3 } });
  }
  pinta(x, y, w, h, tipo = CH.CAMINHO) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < this.larg && j < this.alt) this.chao[j * this.larg + i] = tipo; }
  chaoEm(x, y) { return (x < 0 || y < 0 || x >= this.larg || y >= this.alt) ? CH.GRAMA : this.chao[y * this.larg + x]; }
  // Enfeite com o pé no ladrilho (tx, ty); sólido = a caixa do pé bloqueia (larguraPe/alturaPe em px do Godot).
  enfeite(nome, tx, ty, solido = true, larguraPe = 12, alturaPe = 8) {
    const o = { tipo: 'enfeite', nome, x: (tx + 0.5) * TILE, y: (ty + 1) * TILE, solido };
    if (solido) o.caixa = this._caixa(o.x, o.y, larguraPe * 3, alturaPe * 3);
    this.objs.push(o);
    if (solido) { this.solidos.push(o.caixa); for (let i = Math.floor((o.caixa.x + 3) / TILE); i <= Math.floor((o.caixa.x + o.caixa.w - 3) / TILE); i++) this.ocupado.set(chaveT(i, ty), o); }
    return o;
  }
  // Interativo: base = ladrilho de baixo à esquerda; area em ladrilhos; colisao [w, h] em px do Godot (ou automática).
  interativo(id, nome, bx, by, aw = 1, ah = 1, colisao = null, solido = true) {
    const o = { tipo: 'inter', id, nome, x: (bx + aw / 2) * TILE, y: (by + 1) * TILE, solido, tiles: [], acao: null, ferramenta: null };
    for (let i = 0; i < aw; i++) for (let j = 0; j < ah; j++) { o.tiles.push({ x: bx + i, y: by - j }); this.ocupado.set(chaveT(bx + i, by - j), o); }
    if (solido) {
      let w = colisao ? colisao[0] : aw * 16 - 2, h = colisao ? colisao[1] : ah * 16 - 4;
      if (!colisao && ah >= 3) h = (ah - 1) * 16 - 4;         // prédio: só a base bloqueia, atrás do telhado se passa
      o.caixa = this._caixa(o.x, o.y, w * 3, h * 3);
      this.solidos.push(o.caixa);
    }
    this.objs.push(o);
    return o;
  }
  _caixa(x, y, w, h) { return { x: x - w / 2, y: y - h - 3, w, h }; }
  tirar(o) {
    this.objs = this.objs.filter(x => x !== o);
    if (o.caixa) this.solidos = this.solidos.filter(c => c !== o.caixa);
    for (const [k, v] of [...this.ocupado]) if (v === o) this.ocupado.delete(k);
  }
  detrito(tipo, tx, ty, variacao = -1) {
    const vis = VISUAL_DETRITO[tipo];
    if (!vis) return null;
    const tam = vis.tam || 1;
    for (let i = 0; i < tam; i++) for (let j = 0; j < tam; j++) if (this.ocupado.has(chaveT(tx + i, ty + j))) return null;
    const v = variacao >= 0 ? variacao : Math.floor(this.rng() * 97);
    const o = { tipo: 'detrito', det: tipo, nome: vis.nomes[v % vis.nomes.length], x: (tx + tam / 2) * TILE, y: (ty + tam) * TILE,
      tiles: [], vida: DETRITOS[tipo].golpes, solido: true, treme: 0, variacao: v };
    for (let i = 0; i < tam; i++) for (let j = 0; j < tam; j++) { o.tiles.push({ x: tx + i, y: ty + j }); this.ocupado.set(chaveT(tx + i, ty + j), o); }
    const c = tipo === 'arvore' ? [12, 10] : tipo === 'pedregulho' ? [30, 24] : [14, 11];
    o.caixa = this._caixa(o.x, o.y, c[0] * 3, c[1] * 3);
    this.solidos.push(o.caixa);
    this.objs.push(o);
    return o;
  }
  morador(id, nome, tx, ty, dir = DIR.BAIXO, opc = {}) {
    const m = new Personagem(id, nome, (tx + 0.5) * TILE, ty * TILE + 42, dir);
    Object.assign(m, opc);
    this.moradores.push(m);
    return m;
  }
  saida(x, y, w, h, destino, cx, cy) { this.saidas.push({ x, y, w, h, destino, chegada: { x: cx, y: cy } }); }
  // Paredes invisíveis em volta da área livre (o mapa termina onde termina a área andável).
  paredesDaBorda() {
    const L = this.livre, W = this.larg * TILE, H = this.alt * TILE;
    const px = L.x * TILE, py = L.y * TILE, fx = (L.x + L.w) * TILE, fy = (L.y + L.h) * TILE;
    this.bordas = [{ x: -200, y: -200, w: W + 400, h: py + 200 - 12 }, { x: -200, y: fy, w: W + 400, h: 400 },
      { x: -200, y: -200, w: px + 200, h: H + 400 }, { x: fx, y: -200, w: 400, h: H + 400 }];
    // As saídas abrem a borda (o pé passa por cima delas).
  }
  livreEm(tx, ty) { const L = this.livre; return tx >= L.x && ty >= L.y && tx < L.x + L.w && ty < L.y + L.h; }
  saidaEm(tx, ty) { return this.saidas.find(s => tx >= s.x && ty >= s.y && tx < s.x + s.w && ty < s.y + s.h) || null; }
  interativo_(id) { return this.objs.find(o => o.id === id) || null; }
}

// Arte e tamanho (em ladrilhos) de cada detrito (jogo/mundo/detrito.gd).
const VISUAL_DETRITO = {
  mato: { nomes: ['objetos/mato_1', 'objetos/mato_2', 'objetos/mato_3'] }, galho: { nomes: ['objetos/galho_1', 'objetos/galho_2'] },
  toco: { nomes: ['objetos/toco_1', 'objetos/toco_2'] }, pedra: { nomes: ['objetos/pedra_1', 'objetos/pedra_2', 'objetos/pedra_3'] },
  pedregulho: { nomes: ['objetos/pedregulho'], tam: 2 }, arvore: { nomes: ['objetos/arvore'] },
  entulho: { nomes: ['objetos/entulho_1', 'objetos/entulho_2', 'objetos/entulho_3'] },
};

function getMapa(id) {
  if (!MAPAS[id]) {
    const def = MAPAS_DEF[id];
    if (!def) throw new Error('mapa não existe: ' + id);
    const b = def();
    // Detritos e itens do save (o que o jogador já tirou não volta).
    const salvo = G.save && G.save.mapas && G.save.mapas[id];
    if (salvo && salvo.detritos) {
      for (const o of b.objs.filter(o => o.tipo === 'detrito')) b.tirar(o);
      for (const d of salvo.detritos) { const o = b.detrito(d[0], d[1], d[2], d[4] ?? -1); if (o) o.vida = d[3]; }
    }
    if (b.aoMontar) b.aoMontar();
    for (const f of AO_MONTAR) f(b);
    MAPAS[id] = b;
  }
  return MAPAS[id];
}
COLETORES.push(s => {
  s.mapas = s.mapas || {};
  for (const id in MAPAS) {
    const m = MAPAS[id];
    s.mapas[id] = { detritos: m.objs.filter(o => o.tipo === 'detrito').map(o => [o.det, o.tiles[0].x, o.tiles[0].y, o.vida, o.variacao]) };
  }
  if (G.mapa && G.jog) { s.mapa = G.mapaId; s.tile = [Math.floor(G.jog.x / TILE), Math.floor((G.jog.y - 6) / TILE)]; }
});
INICIADORES.push(() => { for (const k in MAPAS) delete MAPAS[k]; });

function entrarMapa(id, tile) {
  const m = getMapa(id);
  G.mapa = m; G.mapaId = id;
  if (!G.jog) G.jog = new Jogador();
  G.jog.x = (tile.x + 0.5) * TILE; G.jog.y = tile.y * TILE + 36;
  G.jog.parar();
  ajustaZoom();
  G._camPronta = false;
  if (m.aoEntrar) m.aoEntrar();
  for (const f of AO_ENTRAR_MAPA) f(id);
}
const AO_ENTRAR_MAPA = [];

// ---------- colisão ----------
function bate(caixa, m = G.mapa) {
  const sobre = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  for (const s of m.solidos) if (sobre(caixa, s)) return true;
  if (m.bordas) {
    const tx = Math.floor((caixa.x + caixa.w / 2) / TILE), ty = Math.floor((caixa.y + caixa.h / 2) / TILE);
    if (!m.saidaEm(tx, ty)) for (const s of m.bordas) if (sobre(caixa, s)) return true;
  }
  return false;
}

// ---------- chão (pintado uma vez) ----------
function montaChao(m) {
  const texs = { grama: spr(m.fundo), [CH.CAMINHO]: spr('texturas/caminho'), [CH.CALCADA]: spr('texturas/calcada'), [CH.TERRA]: spr('texturas/terra') };
  if (Object.values(texs).some(t => !t)) return null;
  const c = document.createElement('canvas');
  c.width = m.larg * TILE; c.height = m.alt * TILE;
  const g = c.getContext('2d');
  g.fillStyle = g.createPattern(texs.grama, 'repeat');
  g.fillRect(0, 0, c.width, c.height);
  for (const tipo of [CH.TERRA, CH.CAMINHO, CH.CALCADA]) {
    const pat = g.createPattern(texs[tipo], 'repeat');
    g.save();
    g.beginPath();
    for (let y = 0; y < m.alt; y++) for (let x = 0; x < m.larg; x++) if (m.chaoEm(x, y) === tipo) caminhoArredondado(g, m, x, y, tipo);
    // Sombra macia na borda (o caminho "afunda" um pouco na grama).
    g.shadowColor = 'rgba(40,25,10,.55)'; g.shadowBlur = 10;
    g.fillStyle = pat; g.fill();
    g.restore();
    // Contorno só na borda de fora (onde o vizinho não é do mesmo tipo).
    g.save(); g.lineWidth = 3; g.strokeStyle = tipo === CH.CALCADA ? 'rgba(60,60,64,.55)' : 'rgba(90,62,30,.5)'; g.beginPath();
    for (let y = 0; y < m.alt; y++) for (let x = 0; x < m.larg; x++) {
      if (m.chaoEm(x, y) !== tipo) continue;
      const X = x * TILE, Y = y * TILE;
      if (m.chaoEm(x, y - 1) !== tipo) { g.moveTo(X, Y + 1.5); g.lineTo(X + TILE, Y + 1.5); }
      if (m.chaoEm(x, y + 1) !== tipo) { g.moveTo(X, Y + TILE - 1.5); g.lineTo(X + TILE, Y + TILE - 1.5); }
      if (m.chaoEm(x - 1, y) !== tipo) { g.moveTo(X + 1.5, Y); g.lineTo(X + 1.5, Y + TILE); }
      if (m.chaoEm(x + 1, y) !== tipo) { g.moveTo(X + TILE - 1.5, Y); g.lineTo(X + TILE - 1.5, Y + TILE); }
    }
    g.stroke(); g.restore();
  }
  return c;
}
// Ladrilho com os cantos de fora arredondados (o autotile do Godot, simplificado).
function caminhoArredondado(g, m, x, y, tipo) {
  const r = 12, X = x * TILE, Y = y * TILE, T = TILE;
  const igual = (i, j) => m.chaoEm(i, j) === tipo;
  const cima = igual(x, y - 1), baixo = igual(x, y + 1), esq = igual(x - 1, y), dir = igual(x + 1, y);
  const rTL = !cima && !esq ? r : 0, rTR = !cima && !dir ? r : 0, rBR = !baixo && !dir ? r : 0, rBL = !baixo && !esq ? r : 0;
  g.moveTo(X + rTL, Y); g.lineTo(X + T - rTR, Y); if (rTR) g.arcTo(X + T, Y, X + T, Y + rTR, rTR); else g.lineTo(X + T, Y);
  g.lineTo(X + T, Y + T - rBR); if (rBR) g.arcTo(X + T, Y + T, X + T - rBR, Y + T, rBR); else g.lineTo(X + T, Y + T);
  g.lineTo(X + rBL, Y + T); if (rBL) g.arcTo(X, Y + T, X, Y + T - rBL, rBL); else g.lineTo(X, Y + T);
  g.lineTo(X, Y + rTL); if (rTL) g.arcTo(X, Y, X + rTL, Y, rTL); else g.lineTo(X, Y);
  g.closePath();
}

// ---------- desenho ----------
function desenhaMapa(ctx) {
  const m = G.mapa;
  if (m.cenario) {
    const img = spr(m.cenario);
    if (img) ctx.drawImage(img, m.enquadramento.x, m.enquadramento.y, m.enquadramento.w, m.enquadramento.h);
  } else {
    if (!m.chaoCanvas) m.chaoCanvas = montaChao(m);
    if (m.chaoCanvas) ctx.drawImage(m.chaoCanvas, 0, 0);
    else { ctx.fillStyle = '#5a8a3a'; ctx.fillRect(0, 0, m.larg * TILE, m.alt * TILE); }
  }
  if (m.desenhaChao) m.desenhaChao(ctx);
  // Tudo de pé, em ordem de altura (quem está mais embaixo na tela é desenhado por cima).
  const lista = [...m.objs, ...m.moradores.filter(p => p.visivel !== false), ...m.itens];
  if (G.jog) lista.push(G.jog);
  if (m.extras) lista.push(...m.extras());
  lista.sort((a, b) => a.y - b.y);
  const jx = G.jog ? G.jog.x : 0, jy = G.jog ? G.jog.y : 0;
  for (const o of lista) {
    if (o.desenha) { o.desenha(ctx); continue; }
    const img = spr(o.nome);
    let alfa = 1;
    // Transparência: objeto alto na frente do Jocelino (como no Stardew).
    if (img && o !== G.jog && o.y > jy && img.naturalHeight > 90) {
      const w = img.naturalWidth, h = img.naturalHeight;
      if (jx > o.x - w / 2 + 8 && jx < o.x + w / 2 - 8 && jy - 30 > o.y - h && jy - 30 < o.y - 10) alfa = 0.45;
    }
    let dx = 0;
    if (o.treme > 0) { o.treme = Math.max(0, o.treme - 0.016); dx = Math.sin(o.treme * 60) * 3; }
    desenhaPe(ctx, o.nome, o.x + dx, o.y, alfa);
    if (o.realce) desenhaRealce(ctx, o);
  }
  if (m.desenhaPorCima) m.desenhaPorCima(ctx);
  desenhaNomes(ctx, m);
}
function desenhaRealce(ctx, o) {
  ctx.save(); ctx.strokeStyle = 'rgba(255,240,160,.9)'; ctx.lineWidth = 3;
  const img = spr(o.nome); if (img) ctx.strokeRect(o.x - img.naturalWidth / 2 + 4, o.y - img.naturalHeight + 4, img.naturalWidth - 8, img.naturalHeight - 8);
  ctx.restore();
}
// Nomes: pequenos e meio transparentes em cima dos estabelecimentos; o do morador quando o Jocelino chega perto.
function desenhaNomes(ctx, m) {
  const modo = G.opcoes ? G.opcoes.nomes : 1;
  if (modo === 0) return;
  const tam = 13 / G.zoom;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = `800 ${tam}px Nunito`;
  ctx.lineJoin = 'round';
  for (const o of m.objs) {
    const n = o.placa || PLACAS[o.id];
    if (!n) continue;
    const img = spr(o.nome);
    if (!img) continue;
    const y = o.y - img.naturalHeight + (o.margemTopo || 10) - 4;
    ctx.lineWidth = 3 / G.zoom; ctx.strokeStyle = 'rgba(20,12,6,.55)'; ctx.strokeText(n, o.x, y);
    ctx.fillStyle = 'rgba(255,246,220,.88)'; ctx.fillText(n, o.x, y);
  }
  for (const p of m.moradores) {
    if (p.visivel === false || !p.nome) continue;
    const perto = G.jog && Math.hypot(p.x - G.jog.x, p.y - G.jog.y) < 2.6 * TILE;
    const mm = mouseMundo();
    const sob = Math.hypot(mm.x - p.x, mm.y - (p.y - 50)) < 40;
    if (modo === 2 || perto || sob) {
      ctx.lineWidth = 4 / G.zoom; ctx.strokeStyle = 'rgba(19,27,27,.9)'; ctx.strokeText(p.nome, p.x, p.y - 118);
      ctx.fillStyle = '#fff'; ctx.fillText(p.nome, p.x, p.y - 118);
    }
  }
  ctx.restore();
}

// ---------- ação (botão direito / X) ----------
function interativoSob(px, py) {
  const m = G.mapa;
  let melhor = null, d = 1e9;
  for (const o of m.objs) {
    if (o.tipo !== 'inter' || !o.acao) continue;
    const img = spr(o.nome);
    const w = img ? img.naturalWidth : TILE, h = img ? img.naturalHeight : TILE;
    const dentro = px > o.x - w / 2 && px < o.x + w / 2 && py > o.y - h && py < o.y + 4;
    const noTile = o.tiles.some(t => Math.floor(px / TILE) === t.x && Math.floor(py / TILE) === t.y);
    if (!dentro && !noTile) continue;
    const dist = Math.hypot(o.x - px, o.y - py);
    if (dist < d) { d = dist; melhor = o; }
  }
  return melhor;
}
function pertoDoJogador(o) {
  const j = G.jog;
  if (o.caixa) { const c = o.caixa; const dx = Math.max(c.x - j.x, 0, j.x - (c.x + c.w)), dy = Math.max(c.y - j.y, 0, j.y - (c.y + c.h)); return Math.hypot(dx, dy) <= ALCANCE_ACAO; }
  return Math.hypot(o.x - j.x, o.y - j.y) <= ALCANCE_ACAO + TILE;
}
function moradorSob(px, py) {
  return G.mapa.moradores.find(p => p.visivel !== false && Math.abs(px - p.x) < 26 && py < p.y + 4 && py > p.y - 110) || null;
}
function acaoEm(px, py) {
  if (!G.mapa || !G.jog) return false;
  const p = moradorSob(px, py);
  if (p && Math.hypot(p.x - G.jog.x, p.y - G.jog.y) < 2.2 * TILE) { G.jog.virarPara(p.x, p.y); conversar(p); return true; }
  const o = interativoSob(px, py);
  if (o && pertoDoJogador(o)) { G.jog.virarPara(o.x, o.y - 20); return o.acao(o) !== false; }
  return false;
}
function acaoNoMouse() {
  const mm = mouseMundo();
  if (!acaoEm(mm.x, mm.y) && typeof comerDaMao === 'function') comerDaMao();
}
function acaoNaFrente() {
  const f = G.jog.frente();
  if (!acaoEm(f.x, f.y) && typeof comerDaMao === 'function') comerDaMao();
}

// Conversa: as falas do morador (FALAS) ou uma frase de bom dia.
const FALAS = {};
function conversar(p) {
  p.virarPara(G.jog.x, G.jog.y);
  const f = FALAS[p.id];
  const paginas = typeof f === 'function' ? f() : (f || ['Bom dia, Jocelino!']);
  const lista = Array.isArray(paginas[0]) ? paginas[0] : paginas;
  abrirConversa(p.nome, 'a/retratos/' + p.id + '_normal.webp', lista, typeof FALAS_DEPOIS !== 'undefined' && FALAS_DEPOIS[p.id]);
}
