// Jocelino — ferramentas.js — o item da mão: ferramentas (foice, machado, picareta, pá, regador) golpeiam o ladrilho
// alvo como no Stardew: o ladrilho do clique se for um dos 8 em volta do Jocelino (clicar no desenho de uma pedra ou na
// copa de uma árvore mira nela); clique longe faz ele virar para o lado do clique e bater na frente; a tecla C bate na
// frente. Segurar o botão repete o golpe. Gasta 2 de energia (de 270). O detrito certo treme, perde vida e, quando quebra, solta os itens no
// chão, que pulam e vêm para a mochila quando o Jocelino passa perto. Comida na mão: botão direito come.

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
// O nível da ferramenta (0 = comum; o Seu Tonico melhora na etapa 5).
const nivelFerramenta = id => (G.nivelFerr && G.nivelFerr[id]) || 0;

// O detrito cujo desenho está sob o ponto (a copa da árvore, o alto da pedra), não só o ladrilho do pé.
function detritoSob(px, py) {
  let melhor = null, d = 1e9;
  for (const o of G.mapa.objs) {
    if (o.tipo !== 'detrito') continue;
    const img = spr(o.nome);
    const w = img ? img.naturalWidth : TILE, h = img ? img.naturalHeight : TILE;
    if (px < o.x - w / 2 || px > o.x + w / 2 || py < o.y - h || py > o.y + 4) continue;
    const dist = Math.hypot(o.x - px, o.y - 20 - py);
    if (dist < d) { d = dist; melhor = o; }
  }
  return melhor;
}
// O alvo do golpe e a direção em que o Jocelino vira.
function alvoDoGolpe(peloTeclado) {
  const j = G.jog, p = j.ladrilho();
  const frente = dir => ({ dir, x: p.x + DIR_VET[dir][0], y: p.y + DIR_VET[dir][1] });
  if (peloTeclado) return frente(j.dir);
  const mm = mouseMundo();
  let t = { x: Math.floor(mm.x / TILE), y: Math.floor(mm.y / TILE) };
  const o = detritoSob(mm.x, mm.y);
  const cheb = a => Math.max(Math.abs(a.x - p.x), Math.abs(a.y - p.y));
  if (o) t = o.tiles.reduce((a, b) => cheb(b) < cheb(a) ? b : a);
  const perto = cheb(t) <= 1 && (t.x !== p.x || t.y !== p.y);
  // Vira pelo vetor do Jocelino até o alvo (ou até o clique, quando é longe).
  const ax = perto ? (t.x + 0.5) * TILE : mm.x, ay = perto ? (t.y + 0.5) * TILE : mm.y;
  const dx = ax - j.x, dy = ay - (j.y - 18);
  const dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? DIR.ESQUERDA : DIR.DIREITA) : (dy < 0 ? DIR.CIMA : DIR.BAIXO);
  if (perto) return { dir, x: t.x, y: t.y };
  if (Math.hypot(dx, dy) < TILE * 0.5) return frente(j.dir);      // clique em cima do próprio Jocelino
  return frente(dir);
}

function usarItemDaMao(peloTeclado) {
  const j = G.jog;
  if (!j || menuAberto() || j.golpe > 0 || j.travado > 0) return;
  const id = itemDaMao();
  if (!Itens.ehFerramenta(id)) return;
  if (j.carga && j.carga.id) { avisar('Primeiro entregue o que está carregando.'); return; }
  const custo = (typeof Habilidades !== 'undefined' ? Habilidades.custo(id) : CUSTO_GOLPE) * (1 + 0.5 * nivelFerramenta(id));
  if (G.energia < custo) { avisar('O Jocelino está esgotado. Coma alguma coisa ou vá dormir.'); return; }
  const alvo = alvoDoGolpe(peloTeclado);
  j.dir = alvo.dir;
  const pf = PERFIL_GOLPE[perfilDe(id)];
  j.golpe = pf.dur; j.golpeItem = id; j.golpeT = 0; j.golpeAlvo = { x: alvo.x, y: alvo.y }; j.acertou = false; j._somSubida = false;
  G.energia = Math.max(0, G.energia - custo);
  if (id === 'foice') sons.tocar('golpe', 1.2, 0.08, -8);
  hudSujo();
}

// O acerto (no meio do golpe).
// O acerto: o ladrilho do alvo e, com a ferramenta reforçada (pá, regador, colher), os seguintes em linha.
function acertar(id, alvo) {
  const vistos = new Set();   // a casa ou o lote de 3 ladrilhos leva um golpe só
  acertarUm(id, alvo, vistos);
  const area = typeof areaDaFerramenta === 'function' ? areaDaFerramenta(id) : 1, v = DIR_VET[G.jog ? G.jog.dir : 0];
  for (let k = 1; k < area; k++) acertarUm(id, { x: alvo.x + v[0] * k, y: alvo.y + v[1] * k }, vistos);
}
function acertarUm(id, alvo, vistos) {
  const m = G.mapa;
  const o = m.ocupado.get(chaveT(alvo.x, alvo.y));
  if (o && vistos) { if (vistos.has(o)) return; vistos.add(o); }
  if (o && o.tipo === 'detrito') {
    const D = DETRITOS[o.det];
    const certa = D.ferramenta === id || (D.aceita || []).includes(id);
    if (!certa) { o.treme = 0.25; sons.tocar('madeira', 1.6, 0.05, -10); avisar('Isso sai com ' + (NOME_FERRAMENTA[D.ferramenta] || D.ferramenta) + '.'); return; }
    if (D.nivel && nivelFerramenta(id) < D.nivel) { o.treme = 0.25; sons.tocar('madeira', 1.6, 0.05, -10); avisar(`Isso pede ${NOME_FERRAMENTA[id] || id} mais forte (o Seu Tonico melhora).`); return; }
    o.vida -= typeof danoDaFerramenta === 'function' ? danoDaFerramenta(id) : 1; o.treme = 0.3;
    if (id !== 'foice') G.tremor = Math.max(G.tremor || 0, D.material === 'pedra' ? 0.14 : 0.1);
    lascas(o.x, o.y - 20, D.material);
    sons.tocar(D.material === 'pedra' ? 'pedra' : D.material === 'mato' ? 'foice' : 'madeira', 1, 0.08, -4);
    if (o.vida <= 0) quebrar(o);
    return;
  }
  if (o && o.tipo === 'inter' && o.ferramenta) { o.ferramenta(o, id, alvo); return; }
  if (typeof chaoAcertado === 'function' && chaoAcertado(id, alvo)) return;   // a horta: a pá cava, o regador rega
  if (id === 'regador') { lascas((alvo.x + 0.5) * TILE, (alvo.y + 0.5) * TILE, 'agua'); sons.tocar('agua', 1, 0.1, -4); if (typeof Habilidades !== 'undefined') Habilidades.ganhar('acabamento', 1); }
  else sons.tocar('terra', 1.3, 0.1, -10);
}
function quebrar(o) {
  const m = G.mapa, D = DETRITOS[o.det];
  m.tirar(o);
  for (const id in D.solta) soltar(id, D.solta[id], o.x, o.y - 10);
  if (o.det === 'entulho' && Math.random() < (typeof Habilidades !== 'undefined' && Habilidades.tem('limpinho') ? 0.25 : 0.15)) soltar('ferro_velho', 1, o.x, o.y - 10);
  if (typeof quebrouNaObra === 'function') quebrouNaObra(o);
  if (typeof quebrouEmpreita === 'function') quebrouEmpreita(o);
  if (typeof Habilidades !== 'undefined') {
    const limpeza = ['mato', 'galho', 'entulho'].includes(o.det) && Habilidades.tem('faxineiro') ? 2 : 1;
    Habilidades.ganhar(o.det === 'entulho' ? 'alvenaria' : 'folego', limpeza * (o.det === 'entulho' ? 2 : 1));
  }
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
    const pf = PERFIL_GOLPE[perfilDe(j.golpeItem)];
    j.golpeT = (j.golpeT || 0) + dt;
    if (!j._somSubida && j.golpeItem !== 'foice' && j.golpeT >= pf.subida - 0.06) { j._somSubida = true; sons.tocar('golpe', j.golpeItem === 'picareta' ? 0.9 : 1, 0.08, -10); }
    if (!j.acertou && j.golpeT >= pf.acerto) { j.acertou = true; acertar(j.golpeItem, j.golpeAlvo); }
  }
  // Segurar o botão repete o golpe (como no Stardew).
  if (G.mouse.segura && !(j.golpe > 0) && !menuAberto()) usarItemDaMao();
  if (G.tremor > 0) G.tremor = Math.max(0, G.tremor - dt);
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
  if (LASCAS._mapa !== G.mapaId) { LASCAS.length = 0; LASCAS._mapa = G.mapaId; }   // trocou de mapa: as lascas ficam para trás
  for (const l of LASCAS) { l.t += dt; l.x += l.vx * dt; l.y += l.vy * dt; l.vy += 600 * dt; }
  for (let i = LASCAS.length - 1; i >= 0; i--) if (LASCAS[i].t > 0.5) LASCAS.splice(i, 1);
});

// Lascas que voam no golpe (terra, madeira, pedra, água).
const LASCAS = [];
const FX_LASCA = { pedra: 'lasca_pedra', madeira: 'lasca_madeira', mato: 'lasca_mato', agua: 'gota' };
function lascas(x, y, tipo) { for (let k = 0; k < 7; k++) LASCAS.push({ x, y, vx: rnd(-140, 140), vy: rnd(-260, -80), t: 0, fx: FX_LASCA[tipo] || 'lasca_terra' }); }

// ---------- a animação do golpe ----------
// Como o Stardew: o golpe pesado (picareta, machado, pá) sobe a ferramenta por cima da cabeça, segura um instante e desce
// rápido até o ladrilho alvo (no acerto, a ponta está em cima dele); a foice varre em arco na frente; o regador inclina e
// derrama. Cada quadro-chave: tempo, ângulo da ferramenta (graus, 0 = para a direita, 90 = para baixo), a mão (relativa ao
// pé do Jocelino), tamanho, encurtamento (quando aponta para a câmera ou para longe) e se fica atrás do corpo.
// O lado esquerdo é o direito espelhado.
const K = (t, ang, hx, hy, esc = 1, enc = 1, atras = false) => ({ t, ang, hx, hy, esc, enc, atras });
const PERFIL_GOLPE = {
  pesada: { dur: 0.40, subida: 0.17, acerto: 0.22, quadros: {
    [DIR.BAIXO]: [K(0, -84, 6, -74, 1, 1, true), K(0.15, -96, 2, -100, 1, 1, true), K(0.19, -100, 2, -104, 1, 1, true), K(0.205, 90, 1, -86, 1.05, 0.35),
      K(0.22, 90, 0, -45, 1.15), K(0.30, 86, 0, -44, 1.15), K(0.40, -84, 6, -74, 1, 1, true)],
    [DIR.CIMA]: [K(0, -70, 6, -64, 1, 1, true), K(0.15, -90, 0, -104), K(0.19, -92, 0, -108), K(0.205, -90, 0, -84, 1, 0.5, true),
      K(0.22, -90, 0, -50, 1.05, 0.2, true), K(0.30, -90, 0, -50, 1.05, 0.22, true), K(0.40, -70, 6, -64, 1, 1, true)],
    [DIR.DIREITA]: [K(0, -110, 6, -74, 1, 1, true), K(0.15, -150, -2, -96, 1, 1, true), K(0.19, -158, -4, -98, 1, 1, true), K(0.205, -40, 14, -84, 1.05),
      K(0.22, 50, 20, -54, 1.15), K(0.30, 46, 20, -53, 1.15), K(0.40, -110, 6, -74, 1, 1, true)],
  } },
  pa: { dur: 0.38, subida: 0.15, acerto: 0.21, quadros: {
    [DIR.BAIXO]: [K(0, -84, 6, -74, 1, 1, true), K(0.14, -84, 4, -88, 1, 1, true), K(0.18, -86, 4, -90, 1, 1, true), K(0.195, 90, 2, -76, 1, 0.4), K(0.21, 92, 0, -48, 1.15),
      K(0.29, 88, 0, -50, 1.15), K(0.38, -84, 6, -74, 1, 1, true)],
    [DIR.CIMA]: [K(0, -70, 6, -64, 1, 1, true), K(0.14, -90, 0, -96), K(0.18, -90, 0, -98), K(0.21, -90, 0, -50, 1.05, 0.2, true),
      K(0.29, -90, 0, -52, 1.05, 0.24, true), K(0.38, -70, 6, -64, 1, 1, true)],
    [DIR.DIREITA]: [K(0, -110, 6, -74, 1, 1, true), K(0.14, -120, 2, -88, 1, 1, true), K(0.18, -126, 0, -90, 1, 1, true), K(0.21, 52, 20, -54, 1.15),
      K(0.29, 48, 18, -56, 1.15), K(0.38, -110, 6, -74, 1, 1, true)],
  } },
  foice: { dur: 0.30, subida: 0.06, acerto: 0.13, quadros: {
    [DIR.BAIXO]: [K(0, -10, 10, -58, 1.1), K(0.06, 10, 8, -56, 1.1), K(0.13, 90, 0, -48, 1.15), K(0.20, 170, -8, -56, 1.1), K(0.30, 190, -10, -58, 1.1)],
    [DIR.CIMA]: [K(0, 190, -10, -66, 1.1, 1, true), K(0.06, 210, -8, -68, 1.1, 1, true), K(0.13, 270, 0, -52, 1.1, 0.17, true), K(0.20, 330, 8, -68, 1.1, 1, true), K(0.30, 350, 10, -66, 1.1, 1, true)],
    [DIR.DIREITA]: [K(0, -100, 12, -64, 1.1, 1, true), K(0.06, -70, 14, -62, 1.1), K(0.13, 30, 20, -54, 1.15), K(0.20, 80, 16, -52, 1.1), K(0.30, 95, 14, -54, 1.1)],
  } },
  regador: { dur: 0.55, subida: 0.12, acerto: 0.22, quadros: {
    [DIR.BAIXO]: [K(0, -45, 0, -54), K(0.12, -45, 0, -50), K(0.22, -10, 0, -48), K(0.45, -10, 0, -48), K(0.55, -45, 0, -54)],
    [DIR.CIMA]: [K(0, -45, 0, -70, 1, 1, true), K(0.12, -45, 0, -74, 1, 1, true), K(0.22, -80, 0, -78, 1, 1, true), K(0.45, -80, 0, -78, 1, 1, true), K(0.55, -45, 0, -70, 1, 1, true)],
    [DIR.DIREITA]: [K(0, -45, 18, -58), K(0.12, -45, 20, -56), K(0.22, 0, 24, -52), K(0.45, 0, 24, -52), K(0.55, -45, 18, -58)],
  } },
};
function perfilDe(id) { return id === 'foice' ? 'foice' : id === 'regador' ? 'regador' : id === 'pa' ? 'pa' : 'pesada'; }
const _suave = (a, b, u) => a + (b - a) * u;
// A pose da ferramenta no instante t (interpolada entre os quadros-chave; a subida desacelera, a descida acelera).
function poseFerramenta(j) {
  const pf = PERFIL_GOLPE[perfilDe(j.golpeItem)];
  const esq = j.dir === DIR.ESQUERDA;
  const ks = pf.quadros[esq ? DIR.DIREITA : j.dir];
  const t = clamp(j.golpeT || 0, 0, pf.dur);
  let i = 0;
  while (i < ks.length - 2 && t > ks[i + 1].t) i++;
  const a = ks[i], b = ks[i + 1];
  let u = clamp((t - a.t) / Math.max(0.001, b.t - a.t), 0, 1);
  u = b.t <= pf.subida ? 1 - (1 - u) * (1 - u) : b.t <= pf.acerto ? u * u : u * u * (3 - 2 * u);
  const r = { ang: _suave(a.ang, b.ang, u), hx: _suave(a.hx, b.hx, u), hy: _suave(a.hy, b.hy, u), esc: _suave(a.esc, b.esc, u), enc: _suave(a.enc, b.enc, u), atras: u < 0.5 ? a.atras : b.atras };
  // Alvo na diagonal: na descida a mão puxa para o lado do alvo.
  const p = j.ladrilho(), al = j.golpeAlvo || p;
  const ddx = clamp(al.x - p.x, -1, 1), ddy = clamp(al.y - p.y, -1, 1);
  const k = t > pf.acerto + 0.1 ? 0 : clamp((t - pf.subida) / Math.max(0.001, pf.acerto - pf.subida), 0, 1);
  if (j.dir === DIR.BAIXO || j.dir === DIR.CIMA) { r.hx += ddx * 30 * k; r.ang += ddx * (j.dir === DIR.BAIXO ? -28 : 28) * k; }
  else r.hy += ddy * 26 * k;
  if (esq) { r.ang = 180 - r.ang; r.hx = -r.hx; }
  return r;
}
const COMPR_FERRAMENTA = 50;           // da mão até a cabeça da ferramenta (pixels, no tamanho 1)
function pontaDaFerramenta(j) {
  const q = poseFerramenta(j), L = COMPR_FERRAMENTA * q.esc * q.enc, a = q.ang * Math.PI / 180;
  return { x: j.x + q.hx + Math.cos(a) * L, y: j.y + q.hy + Math.sin(a) * L };
}
// O corpo acompanha: estica na subida, encolhe e inclina para a frente no impacto.
function poseCorpo(j) {
  const pf = PERFIL_GOLPE[perfilDe(j.golpeItem)], t = j.golpeT || 0;
  if (j.golpeItem === 'regador') return { sx: 1, sy: 1, inc: 0, dy: 0 };
  const sobe = t < pf.subida ? Math.sin(Math.PI / 2 * t / pf.subida) : t < pf.acerto ? 1 - (t - pf.subida) / (pf.acerto - pf.subida) : 0;
  const bate = t >= pf.acerto - 0.015 ? Math.max(0, 1 - (t - pf.acerto) / (pf.dur - pf.acerto)) : 0;
  const lado = j.dir === DIR.DIREITA ? 1 : j.dir === DIR.ESQUERDA ? -1 : 0;
  return { sx: 1 - 0.02 * sobe + 0.05 * bate, sy: 1 + 0.045 * sobe - 0.07 * bate, inc: (-4 * sobe + 6 * bate) * lado * Math.PI / 180, dy: 2 * bate };
}
function _desenhaFerr(ctx, j, q, img, alfa) {
  ctx.save();
  ctx.globalAlpha = alfa;
  ctx.translate(j.x + q.hx, j.y + q.hy);
  if (j.golpeItem === 'regador') {
    // O regador fica de pé e inclina para o lado em que o Jocelino olha.
    ctx.scale(j.dir === DIR.ESQUERDA ? -1 : 1, 1);
    ctx.rotate((q.ang + 45) * Math.PI / 180 * 0.9);
    ctx.drawImage(img, -21, -30, 42, 42);
  } else {
    // Gira para o ângulo, encurta ao longo do cabo e desenha o ícone (cabo embaixo à esquerda, cabeça em cima à direita).
    ctx.rotate(q.ang * Math.PI / 180);
    ctx.scale(q.esc * q.enc, q.esc * (j.dir === DIR.ESQUERDA ? -1 : 1));
    ctx.rotate(Math.PI / 4);
    ctx.drawImage(img, -9, -39, 42, 42);
  }
  ctx.restore();
}
// Desenha a ferramenta: atras = antes do corpo (erguida atrás da cabeça, ou virado para cima); senão, depois do corpo.
function desenhaFerramenta(ctx, j, atras) {
  if (!(j.golpe > 0) || !j.golpeItem) return;
  const q = poseFerramenta(j);
  if (q.atras !== atras) return;
  const img = spr('itens/' + j.golpeItem);
  if (!img) return;
  const pf = PERFIL_GOLPE[perfilDe(j.golpeItem)], t = j.golpeT || 0;
  // Rastro na descida rápida (e na varrida da foice): duas sombras um pouco atrás no tempo.
  if (j.golpeItem !== 'regador' && t > pf.subida && t < pf.acerto + 0.04) {
    for (const [antes, alfa] of [[0.03, 0.18], [0.015, 0.32]]) {
      const sombra = { x: j.x, y: j.y, dir: j.dir, golpeItem: j.golpeItem, golpeAlvo: j.golpeAlvo, golpeT: t - antes, ladrilho: () => j.ladrilho() };
      _desenhaFerr(ctx, j, poseFerramenta(sombra), img, alfa);
    }
  }
  _desenhaFerr(ctx, j, q, img, 1);
  // Água do regador: gotas da bica até o ladrilho.
  if (j.golpeItem === 'regador' && t > 0.18 && t < 0.47 && j.golpeAlvo) {
    const bx = j.x + q.hx + (j.dir === DIR.ESQUERDA ? -16 : j.dir === DIR.DIREITA ? 16 : 0), by = j.y + q.hy;
    const cx = (j.golpeAlvo.x + 0.5) * TILE, cy = (j.golpeAlvo.y + 0.5) * TILE;
    for (let k = 0; k < 6; k++) { const u = (t * 5 + k / 6) % 1; desenhaFx(ctx, 'gota', _suave(bx, cx, u) + Math.sin(k * 7) * 6, _suave(by, cy, u)); }
  }
}
// O quadro da folha de golpe desenhada (a/personagens/jocelino/golpe_<ferramenta>, 4 direções × 4 quadros:
// 0 preparo, 1 no alto, 2 descendo, 3 impacto), pelo tempo do golpe. Quadro de 132x204 com o pé em (66, 162).
const GOLPE_QUADRO = { w: 132, h: 204, peX: 66, peY: 162 };
function quadroGolpe(j) {
  const pf = PERFIL_GOLPE[perfilDe(j.golpeItem)], t = j.golpeT || 0;
  if (t < pf.subida * 0.4) return 0;
  if (t < pf.subida) return 1;
  if (t < pf.acerto) return 2;
  return t < pf.dur - 0.05 ? 3 : 0;
}
function desenhaGolpeDesenhado(ctx, j) {
  const img = spr('personagens/jocelino/golpe_' + j.golpeItem);
  if (!img) return false;
  const q = quadroGolpe(j), Q = GOLPE_QUADRO;
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(j.x, j.y - 2, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.drawImage(img, j.dir * Q.w, q * Q.h, Q.w, Q.h, j.x - Q.peX, j.y + 2 - Q.peY, Q.w, Q.h);
  return true;
}
// As lascas (sempre) e a ferramenta da frente (chamado depois do corpo).
function desenhaGolpe(ctx, j) {
  for (const l of LASCAS) desenhaFx(ctx, l.fx, l.x, l.y, { ang: l.t * 9, alfa: Math.max(0, 1 - l.t * 1.6) });
  desenhaFerramenta(ctx, j, false);
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
  if (typeof Habilidades !== 'undefined' && Habilidades.tem('cafe_no_sangue')) e *= 2;
  if (G.mochila.total(id) < 1) return;
  G.mochila.remover(id, 1);
  G.energia = Math.min(G.energiaMax, G.energia + e);
  sons.tocar('pegar', 0.7, 0.05, -4);
  avisar(`Comeu ${Itens.nome(id).toLowerCase()}: +${e} de energia.`);
  hudSujo();
}
