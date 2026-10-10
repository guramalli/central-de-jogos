// Jocelino — ferramentas.js — o item da mão: ferramentas (foice, machado, picareta, pá, regador) golpeiam o ladrilho
// alvo (o do mouse, se estiver colado no Jocelino; senão o da frente), como no Stardew. Cada golpe dura 0,32 s, acerta
// no meio (0,15 s) e gasta 2 de energia (de 270). O detrito certo treme, perde vida e, quando quebra, solta os itens no
// chão, que pulam e vêm para a mochila quando o Jocelino passa perto. Comida na mão: botão direito come.

const DURACAO_GOLPE = 0.32, MOMENTO_ACERTO = 0.15;
const ENERGIA_MAX = 270, CUSTO_GOLPE = 2;
const NOME_FERRAMENTA = { foice: 'a foice', machado: 'o machado', picareta: 'a picareta', pa: 'a pá', regador: 'o regador' };

// O começo do jogo: a mochila com as ferramentas (as mesmas do Godot) e a energia cheia.
INICIADORES.push(s => {
  G.mochila = new Mochila();
  if (s.mochila) G.mochila.deDict(s.mochila);
  else for (const f of ['foice', 'machado', 'picareta', 'pa', 'regador']) G.mochila.adicionar(f, 1);
  G.sel = s.sel || 0;
  G.energiaMax = ENERGIA_MAX;
  G.energia = s.energia == null || s.energia === 100 && !s.mochila ? ENERGIA_MAX : s.energia;
});
COLETORES.push(s => { s.mochila = G.mochila.paraDict(); s.sel = G.sel; });

const itemDaMao = () => G.mochila ? G.mochila.idEm(G.sel) : '';

// Ladrilho alvo: o do mouse, se estiver a 1 ladrilho do Jocelino; senão o da frente.
function ladrilhoAlvo() {
  const m = ladrilhoDoMouse(), p = G.jog.ladrilho();
  if (Math.abs(m.x - p.x) <= 1 && Math.abs(m.y - p.y) <= 1 && (m.x !== p.x || m.y !== p.y)) return m;
  const v = DIR_VET[G.jog.dir];
  return { x: p.x + v[0], y: p.y + v[1] };
}

function usarItemDaMao() {
  const j = G.jog;
  if (!j || menuAberto() || j.golpe > 0 || j.travado > 0) return;
  const id = itemDaMao();
  if (!Itens.ehFerramenta(id)) return;
  if (j.carga && j.carga.id) { avisar('Primeiro entregue o que está carregando.'); return; }
  if (G.energia < CUSTO_GOLPE) { avisar('O Jocelino está esgotado. Coma alguma coisa ou vá dormir.'); return; }
  const alvo = ladrilhoAlvo();
  const dx = alvo.x - j.ladrilho().x, dy = alvo.y - j.ladrilho().y;
  if (dx || dy) j.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? DIR.ESQUERDA : DIR.DIREITA) : (dy < 0 ? DIR.CIMA : DIR.BAIXO);
  j.golpe = DURACAO_GOLPE; j.golpeItem = id; j.golpeT = 0; j.golpeAlvo = alvo; j.acertou = false;
  G.energia = Math.max(0, G.energia - CUSTO_GOLPE);
  sons.tocar('golpe', id === 'foice' ? 1.15 : 0.95, 0.08, -8);
  hudSujo();
}

// O acerto (no meio do golpe).
function acertar(id, alvo) {
  const m = G.mapa;
  const o = m.ocupado.get(chaveT(alvo.x, alvo.y));
  if (o && o.tipo === 'detrito') {
    const D = DETRITOS[o.det];
    const certa = D.ferramenta === id || (D.aceita || []).includes(id);
    if (!certa) { o.treme = 0.25; sons.tocar('madeira', 1.6, 0.05, -10); avisar('Isso sai com ' + (NOME_FERRAMENTA[D.ferramenta] || D.ferramenta) + '.'); return; }
    o.vida -= 1; o.treme = 0.3;
    lascas(o.x, o.y - 20, D.material);
    sons.tocar(D.material === 'pedra' ? 'pedra' : D.material === 'mato' ? 'foice' : 'madeira', 1, 0.08, -4);
    if (o.vida <= 0) quebrar(o);
    return;
  }
  if (o && o.tipo === 'inter' && o.ferramenta) { o.ferramenta(o, id, alvo); return; }
  if (id === 'regador') { lascas((alvo.x + 0.5) * TILE, (alvo.y + 0.5) * TILE, 'agua'); sons.tocar('agua', 1, 0.1, -4); }
  else sons.tocar('terra', 1.3, 0.1, -10);
}
function quebrar(o) {
  const m = G.mapa, D = DETRITOS[o.det];
  m.tirar(o);
  for (const id in D.solta) soltar(id, D.solta[id], o.x, o.y - 10);
  if (D.vira) m.detrito(D.vira, o.tiles[0].x, o.tiles[0].y);
  sons.tocar('quebra', 1, 0.1, -4);
}

// ---------- itens no chão ----------
function soltar(id, qtd, x, y) {
  for (let k = 0; k < qtd; k++) G.mapa.itens.push({ id, qtd: 1, x: x + rnd(-14, 14), y, vx: rnd(-80, 80), vy: rnd(-30, 30), z: 0, vz: rnd(260, 340), t: 0,
    desenha(ctx) { ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(this.x, this.y, 12, 4, 0, 0, Math.PI * 2); ctx.fill(); desenhaPe(ctx, 'itens/' + this.id, this.x, this.y - this.z - 2, 1, 0.6); } });
}
ATUALIZADORES.push(dt => {
  const m = G.mapa, j = G.jog;
  if (!m || !j) return;
  // Golpe: a ferramenta gira e acerta no meio.
  if (j.golpe > 0) {
    j.golpeT = (j.golpeT || 0) + dt;
    if (!j.acertou && j.golpeT >= MOMENTO_ACERTO) { j.acertou = true; acertar(j.golpeItem, j.golpeAlvo); }
  }
  for (const it of m.itens) {
    it.t += dt;
    if (it.z > 0 || it.vz > 0) { it.vz -= 900 * dt; it.z = Math.max(0, it.z + it.vz * dt); if (it.z === 0) { it.vz = it.vz < -60 ? -it.vz * 0.35 : 0; it.vx *= 0.6; } it.x += it.vx * dt; it.y += it.vy * dt; }
    // Depois de assentar, vem para o Jocelino quando ele passa perto.
    const d = Math.hypot(j.x - it.x, j.y - it.y);
    if (it.t > 0.45 && d < 1.6 * TILE) { it.x += (j.x - it.x) * Math.min(1, dt * 9); it.y += (j.y - it.y) * Math.min(1, dt * 9); }
    if (it.t > 0.45 && d < 22) {
      const sobra = G.mochila.adicionar(it.id, it.qtd);
      if (sobra < it.qtd) { it.pegou = true; avisar('+ ' + Itens.qtd(it.qtd - sobra, it.id)); sons.tocar('pegar', 1, 0.05, -4); hudSujo(); }
    }
  }
  m.itens = m.itens.filter(i => !i.pegou);
  for (const l of LASCAS) { l.t += dt; l.x += l.vx * dt; l.y += l.vy * dt; l.vy += 600 * dt; }
  for (let i = LASCAS.length - 1; i >= 0; i--) if (LASCAS[i].t > 0.5) LASCAS.splice(i, 1);
});

// Lascas que voam no golpe (terra, madeira, pedra, água).
const LASCAS = [];
const COR_LASCA = { pedra: '#8a8a8a', madeira: '#8a5a2b', mato: '#5e9a3a', agua: '#8cc8ff' };
function lascas(x, y, tipo) { for (let k = 0; k < 7; k++) LASCAS.push({ x, y, vx: rnd(-140, 140), vy: rnd(-260, -80), t: 0, cor: COR_LASCA[tipo] || '#a07850' }); }

// O desenho do golpe: o corpo na pose de golpe (folha jocelino/golpe, 4 direções na vertical) e a ferramenta girando
// na mão (de -150° a 45°, como no Godot).
function desenhaGolpe(ctx, j) {
  for (const l of LASCAS) { ctx.fillStyle = l.cor; ctx.fillRect(l.x - 3, l.y - 3, 6, 6); }
  if (!(j.golpe > 0)) return;
  const t = clamp((j.golpeT || 0) / MOMENTO_ACERTO, 0, 1);
  const ini = { [DIR.BAIXO]: -150, [DIR.CIMA]: 30, [DIR.ESQUERDA]: -100, [DIR.DIREITA]: -100 }[j.dir];
  const fim = { [DIR.BAIXO]: 45, [DIR.CIMA]: -95, [DIR.ESQUERDA]: 45, [DIR.DIREITA]: 45 }[j.dir];
  const ang = (ini + (fim - ini) * t * t + 45) * Math.PI / 180;
  const mao = { [DIR.BAIXO]: [-3, -60], [DIR.CIMA]: [0, -63], [DIR.ESQUERDA]: [-18, -63], [DIR.DIREITA]: [18, -63] }[j.dir];
  const img = spr('itens/' + j.golpeItem);
  if (!img) return;
  ctx.save();
  ctx.translate(j.x + mao[0], j.y + mao[1]);
  if (j.dir === DIR.ESQUERDA) ctx.scale(-1, 1);
  ctx.rotate(ang);
  ctx.drawImage(img, -9, -39, 42, 42);
  ctx.restore();
}

// ---------- comer (botão direito com comida na mão) ----------
function comerDaMao() {
  const id = itemDaMao(), e = Itens.energia(id);
  if (!e) return false;
  if (G.energia >= G.energiaMax) { avisar('Jocelino está sem fome agora.'); return true; }
  // Como o Stardew: pergunta antes (um clique errado não come o ovo da pensão).
  perguntar(`Comer ${Itens.nome(id).toLowerCase()}? (+${e} de energia)`, ['Comer', 'Agora não'], i => { if (i === 0) comer(id, e); });
  return true;
}
function comer(id, e) {
  if (G.mochila.total(id) < 1) return;
  G.mochila.remover(id, 1);
  G.energia = Math.min(G.energiaMax, G.energia + e);
  sons.tocar('pegar', 0.7, 0.05, -4);
  avisar(`Comeu ${Itens.nome(id).toLowerCase()}: +${e} de energia.`);
  hudSujo();
}
