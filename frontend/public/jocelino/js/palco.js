// Jocelino — palco.js — a Pensão da Rosa aberta, vista de lado em tela cheia, como o sushi bar do Bancho (Dave the
// Diver): um palco fixo de 1920×1080 px de mundo. Atrás, o salão à noite; a cozinha da Rosa à direita; o passa-prato
// em cima do balcão; os clientes sentados atrás do balcão, de frente; o balcão de azulejo; o Jocelino andando só para
// os lados no chão da frente; e as plantas do primeiro plano nas bordas. Toda a arte é de a/salao/ (Higgsfield).
// As camadas são objetos com y: a ordem por altura do desenhaMapa faz o empilhamento.

// Posições em px de mundo (1920×1080), as da prévia da arte (a/salao/LEIA.txt).
const PALCO = {
  LARG: 1920, ALT: 1080,
  LINHA_CHAO: 20,                 // ladrilho (48 px) da faixa onde o Jocelino anda
  CHAO_Y: 20 * TILE + 36,         // o pé do Jocelino (996: igual a qualquer mapa, ladrilho * 48 + 36)
  X_MIN: 6 * TILE + 14,           // 302
  X_MAX: 35 * TILE - 14,          // 1666
  PORTA_X: 6.5 * TILE,
  TAMPO_Y: 778,                   // o tampo do balcão: daqui para baixo o balcão cobre os clientes
  BALCAO: { x: 290, y: 757 },
  COZINHA: { x: 1300, y: 545 },
  ROSA: { x: 1542, y: 757, escala: 0.493 },   // o pé da Rosa no fogão (quadro de 200x300 reduzido)
  PASSA: { x: 590, y: 505 },
  FRENTE_ESQ: { x: -190, y: 0 }, FRENTE_DIR: { x: 1702, y: 0 },
  ASSENTOS: [400, 540, 680, 820, 960, 1100].map(x => ({ x, y: 812 })),    // o pé (escondido) de cada cliente: cabeça e tronco acima do tampo
  VAGAS: [672, 786, 895, 1005, 1114, 1224].map(x => ({ x, y: 570 })),     // o centro de cada nicho do passa-prato
  PRATO_Y: 602,                   // onde o prato assenta no nicho
  BEBEDOURO: { x: 1275, y: 758, w: 84, h: 126, escala: 0.42 },
  FARINHEIRA: { x: 1185, y: 730, w: 70, h: 62, cx: 1218, base: 786, escala: 0.36 },
  LOUCA: { base: 786, escala: 0.38 },
  ESCALA_GENTE: 1.3,
};
const noPalco = () => !!(G.mapa && G.mapa.palco);
const noSalaoDaPensao = () => G.mapaId === 'pensao_dentro' || G.mapaId === 'pensao_palco';
// A pensão aberta (ou pronta para abrir) usa o palco; na reforma, o salão antigo de cima.
const pensaoNoPalco = () => !!G.pensao && ['aberta', 'pronta'].includes(G.pensao.estado);

// Uma camada de arte (a/salao/<nome>) no canto (x, y), na altura de desenho yOrdem.
function camadaPalco(nome, x, y, yOrdem, escala = 1) {
  return { tipo: 'camada', y: yOrdem, desenha(ctx) { const img = spr('salao/' + nome); if (img) ctx.drawImage(img, x, y, img.naturalWidth * escala, img.naturalHeight * escala); } };
}

MAPAS_DEF.pensao_palco = () => {
  const b = new Construtor('pensao_palco', 40, 23, 1);
  Object.assign(b, { palco: true, dentro: true, cenario: 'salao/fundo_noite', enquadramento: { x: 0, y: 0, w: PALCO.LARG, h: PALCO.ALT } });
  b.livre = { x: 6, y: PALCO.LINHA_CHAO, w: 29, h: 1 };
  b.inicio = { x: 8, y: PALCO.LINHA_CHAO };
  b.saida(6, PALCO.LINHA_CHAO, 1, 1, 'vila', 15, 9);
  const P = PALCO;
  b.objs.push(
    camadaPalco('cozinha', P.COZINHA.x, P.COZINHA.y, 300),
    camadaPalco('passa_prato', P.PASSA.x, P.PASSA.y, 400),
    camadaPalco('balcao', P.BALCAO.x, P.BALCAO.y, P.TAMPO_Y + 80),
    camadaPalco('bebedouro', P.BEBEDOURO.x, P.BEBEDOURO.y, P.BEBEDOURO.y + P.BEBEDOURO.h, P.BEBEDOURO.escala),
    camadaPalco('frente_esquerda', P.FRENTE_ESQ.x, P.FRENTE_ESQ.y, 99999),
    camadaPalco('frente_direita', P.FRENTE_DIR.x, P.FRENTE_DIR.y, 99999));
  b.paredesDaBorda();
  return b;
};

function entrarPalco() {
  entrarMapa('pensao_palco', { x: 8, y: PALCO.LINHA_CHAO });
  G.jog.dir = DIR.DIREITA;
  sons.tocar('porta', 1, 0.05, -4);
}

// ---------- os clientes, o passa-prato, a louça, a farinheira e a Rosa (camadas que mudam com a janta) ----------
// Os clientes sentados atrás do balcão: a folha de frente parada (o balcão, desenhado depois, cobre da cintura para baixo).
function clientesDoPalco(b) {
  const t = G.turno;
  if (!t) { b._clientes = []; return []; }
  b._clientes = t.mesas.map((m, i) => {
    if (!['pedido', 'prato', 'comendo'].includes(m.estado) || i >= PALCO.ASSENTOS.length) return null;
    const ja = b._clientes && b._clientes[i];
    if (ja && ja.id === m.cliente.id) return ja;
    const A = PALCO.ASSENTOS[i];
    return new Personagem(m.cliente.id, m.cliente.nome, A.x, A.y, DIR.BAIXO);
  });
  return b._clientes.filter(Boolean);
}
const camadaViva = (y, desenha) => ({ tipo: 'camada', y, desenha });
function camadasDaJanta() {
  const t = G.turno, P = PALCO;
  return [
    // Pratos prontos nas vagas do passa-prato.
    camadaViva(401, ctx => { if (!t) return; t.passaPrato().forEach((i, k) => { const v = P.VAGAS[k]; desenhaPe(ctx, 'itens/prato_' + t.mesas[i].prato, v.x, P.PRATO_Y, 1, 1.35); }); }),
    // A Rosa mexendo a panela enquanto tem prato no fogo (parada no primeiro quadro quando não tem).
    camadaViva(301, ctx => {
      const img = spr('salao/rosa_cozinhando');
      if (!img) return;
      const fogo = t && t.farinha > 0 && t.mesas.some(m => m.estado === 'prato' && !m.pronto);
      const q = fogo ? Math.floor(G.agora / 0.16) % 4 : 0, w = img.naturalWidth / 4, h = img.naturalHeight, e = P.ROSA.escala;
      ctx.drawImage(img, q * w, 0, w, h, P.ROSA.x - w * e / 2, P.ROSA.y - h * e, w * e, h * e);
    }),
    // A louça no tampo de quem já foi embora, e a farinheira no balcão.
    camadaViva(P.TAMPO_Y + 81, ctx => {
      if (t) t.mesas.forEach((m, i) => { if (m.estado === 'suja' && i < P.ASSENTOS.length) desenhaPe(ctx, 'salao/louca_suja', P.ASSENTOS[i].x, P.LOUCA.base, 1, P.LOUCA.escala); });
      const F = P.FARINHEIRA; desenhaPe(ctx, 'salao/farinheira', F.cx, F.base, 1, F.escala);
    }),
  ];
}
MAPAS_DEF.pensao_palco = (orig => () => {
  const b = orig();
  b.extras = () => [...clientesDoPalco(b), ...camadasDaJanta()];
  b.desenhaPorCima = ctx => desenhaBaloesPalco(ctx, b);
  return b;
})(MAPAS_DEF.pensao_palco);

// Balões em cima de cada cliente: o pedido (cinza enquanto a Rosa faz), a bebida (balão menor), a paciência e as frases.
function desenhaBaloesPalco(ctx, b) {
  const t = G.turno;
  if (!t) return;
  t.mesas.forEach((m, i) => {
    if (i >= PALCO.ASSENTOS.length || !['pedido', 'prato', 'comendo'].includes(m.estado)) return;
    const A = PALCO.ASSENTOS[i], x = A.x, y = A.y - 114 * PALCO.ESCALA_GENTE - 34;
    if (m.estado === 'comendo') {
      const fr = FRASES_CLIENTE[m.reacao] || ['Hmm!'];
      texto(ctx, fr[(i + m.vezes) % fr.length], x, y + 20, 20, '#fff');
      if (m.reacao === 'coracao') desenhaFx(ctx, 'coracao', x, y - 10);
      return;
    }
    if (m.estado === 'pedido') { desenhaFx(ctx, 'balao_pensamento', x, y); texto(ctx, '...', x, y + 6, 30, '#555', '900'); return; }
    desenhaFx(ctx, m.pronto ? 'balao' : 'balao_pensamento', x, y);
    ctx.save(); ctx.globalAlpha = m.pronto ? 1 : 0.55; desenhaPe(ctx, 'itens/prato_' + m.prato, x, y + 18, 1, 0.8); ctx.restore();
    if (m.querBebida && !m.bebidaServida) { desenhaFx(ctx, 'balao', x + 44, y + 14, { escala: 0.62 }); desenhaPe(ctx, 'salao/bebida_' + m.bebida, x + 44, y + 28, 1, 0.5); }
    const f = clamp(1 - m.espera / TurnoJanta.PACIENCIA_PRATO, 0, 1);
    if (spr('fx/barra_moldura')) {
      desenhaFx(ctx, 'barra_moldura', x, y + 42);   // a moldura tem o miolo escuro: a cor vai por cima
      ctx.fillStyle = f > 0.5 ? '#5ec43a' : f > 0.25 ? '#e8c22c' : '#e8452c'; ctx.fillRect(x - 26, y + 40, 52 * f, 4);
    }
  });
}

// ---------- clicar, ir até e fazer ----------
function palcoAlvoEm(px, py) {
  const P = PALCO, t = G.turno;
  if (t) {
    const vs = t.passaPrato();
    for (let k = 0; k < vs.length; k++) if (Math.abs(px - P.VAGAS[k].x) < 52 && Math.abs(py - P.VAGAS[k].y) < 60) return { tipo: 'vaga', k, mesa: vs[k], x: P.VAGAS[k].x };
  }
  const dentro = (R) => px >= R.x && px <= R.x + R.w && py >= R.y && py <= R.y + R.h;
  if (dentro(P.FARINHEIRA)) return { tipo: 'farinheira', x: P.FARINHEIRA.x + P.FARINHEIRA.w / 2 };
  if (dentro(P.BEBEDOURO)) return { tipo: 'bebedouro', x: P.BEBEDOURO.x + P.BEBEDOURO.w / 2 };
  if (t) for (let i = 0; i < Math.min(t.mesas.length, P.ASSENTOS.length); i++) {
    const A = P.ASSENTOS[i], m = t.mesas[i];
    if (Math.abs(px - A.x) > 66 || py < A.y - 220 || py > P.TAMPO_Y + 60) continue;
    if (m.estado === 'suja') return { tipo: 'louca', i, x: A.x };
    if (['pedido', 'prato', 'comendo'].includes(m.estado)) return { tipo: 'cliente', i, x: A.x };
  }
  if (px < P.PORTA_X + 40) return { tipo: 'porta', x: P.X_MIN };
  return null;
}
// Clique no palco: o Jocelino anda até o alvo e faz ao chegar; um clique novo troca o alvo.
function palcoClique(px, py) {
  const alvo = palcoAlvoEm(px, py);
  G.jog.alvoPalco = { x: clamp(alvo ? alvo.x : px, PALCO.X_MIN, PALCO.X_MAX), alvo };
  return true;
}
ATUALIZADORES.push(dt => {
  const j = G.jog;
  if (!noPalco() || !j || !j.alvoPalco) return;
  const k = G.teclas;
  if ([TECLAS.esquerda, TECLAS.direita, 'ArrowLeft', 'ArrowRight'].some(c => k.has(c))) { j.alvoPalco = null; return; }   // tecla manda
  const dx = j.alvoPalco.x - j.x;
  if (Math.abs(dx) <= 6) {
    const a = j.alvoPalco.alvo; j.alvoPalco = null; j.andando = false;
    if (a) palcoAgir(a);
    return;
  }
  j.dir = dx < 0 ? DIR.ESQUERDA : DIR.DIREITA; j.andando = true;
  j.x += Math.sign(dx) * Math.min(Math.abs(dx), Jogador.VEL * dt);
});
// A tecla X: o alvo mais perto do Jocelino.
function palcoAgirNaFrente() {
  const P = PALCO, t = G.turno, cands = [];
  if (t) {
    t.passaPrato().forEach((i, k) => cands.push({ tipo: 'vaga', k, mesa: i, x: P.VAGAS[k].x }));
    t.mesas.forEach((m, i) => { if (i < P.ASSENTOS.length && m.estado !== 'livre') cands.push({ tipo: m.estado === 'suja' ? 'louca' : 'cliente', i, x: P.ASSENTOS[i].x }); });
  }
  cands.push({ tipo: 'farinheira', x: P.FARINHEIRA.x + P.FARINHEIRA.w / 2 }, { tipo: 'bebedouro', x: P.BEBEDOURO.x + P.BEBEDOURO.w / 2 });
  // Com algo na mão, prefere o cliente que espera aquilo.
  const mao = G.jog.carga || {};
  const peso = c => Math.abs(c.x - G.jog.x) - (mao.id && c.tipo === 'cliente' && c.i === mao.mesa ? 400 : 0);
  const a = cands.filter(c => Math.abs(c.x - G.jog.x) < 110).sort((p, q) => peso(p) - peso(q))[0];
  if (a) palcoAgir(a); else avisar('Nada aqui. Chegue perto de um cliente, do passa-prato, da farinheira ou do bebedouro.');
}
function palcoAgir(a) {
  const t = G.turno, j = G.jog, mao = j.carga || {};
  if (a.tipo === 'porta') { entrarMapa('vila', { x: 15, y: 9 }); return; }
  if (!t) { avisar(pensaoAbreHoje() ? 'A janta começa às 17h. Use o Adiantar ou espere.' : 'Hoje a pensão não abre.'); return; }
  if (a.tipo === 'vaga') {
    if (mao.id) { avisar('Primeiro entregue o que está na mão.'); return; }
    if (t.pegar(a.mesa)) { j.carga = { id: 'prato', mesa: a.mesa, icone: 'itens/prato_' + t.mesas[a.mesa].prato }; sons.tocar('pegar', 1, 0.05, -4); }
    return;
  }
  if (a.tipo === 'bebedouro') {
    if (mao.id) { avisar('Primeiro entregue o que está na mão.'); return; }
    const quem = t.mesas.map((m, i) => ({ m, i })).filter(({ m }) => ['prato', 'comendo'].includes(m.estado) && m.querBebida && !m.bebidaServida).sort((p, q) => q.m.espera - p.m.espera)[0];
    if (!quem) { avisar('Ninguém pediu bebida agora.'); return; }
    j.carga = { id: 'bebida', mesa: quem.i, icone: 'salao/bebida_' + quem.m.bebida };
    sons.tocar('agua', 1.3, 0.1, -6);
    avisar(`${Pratos.BEBIDAS[quem.m.bebida]} para ${quem.m.cliente.nome}.`);
    return;
  }
  if (a.tipo === 'farinheira') {
    const r = t.reporFarinha();
    if (r === 'ok') { avisar('Farinheira cheia de novo.'); sons.tocar('pegar', 0.8, 0.05, -4); }
    else avisar(r === 'cheia' ? 'A farinheira ainda está cheia.' : 'Acabou a farinha na despensa! Compre na Mercearia do Seu Ananias.');
    return;
  }
  if (a.tipo === 'louca') { if (t.limpar(a.i)) sons.tocar('pegar', 1.4, 0.05, -6); return; }
  if (a.tipo === 'cliente') {
    const m = t.mesas[a.i];
    if (mao.id === 'prato') {
      if (mao.mesa !== a.i) { avisar(`Esse prato é de ${t.mesas[mao.mesa].cliente.nome}.`); return; }
      if (t.servir(a.i)) { j.carga = {}; sons.tocar('pousar', 1, 0.05, -2); }
      return;
    }
    if (mao.id === 'bebida') {
      if (mao.mesa !== a.i) { avisar(`Essa bebida é de ${t.mesas[mao.mesa].cliente.nome}.`); return; }
      if (t.servirBebida(a.i)) { j.carga = {}; sons.tocar('pousar', 1.3, 0.05, -4); }
      return;
    }
    if (m.estado === 'pedido') avisar(`${m.cliente.nome} está lendo o cardápio.`);
    else if (m.estado === 'prato') avisar(`${m.cliente.nome} pediu ${Pratos.PRATOS[m.prato].nome}${m.querBebida && !m.bebidaServida ? ' e ' + Pratos.BEBIDAS[m.bebida].toLowerCase() : ''}. ${m.pronto ? 'Está no passa-prato!' : 'A Rosa está fazendo.'}`);
    else avisar(`${m.cliente.nome} está comendo.`);
  }
}
// Quem foi embora com o prato ou a bebida na mão do Jocelino: a mão esvazia (nada trava).
ATUALIZADORES.push(() => {
  const j = G.jog, t = G.turno;
  if (!noPalco() || !j || !j.carga || !j.carga.id) return;
  if (!t) { j.carga = {}; return; }
  const m = t.mesas[j.carga.mesa];
  if (!m || !['prato', 'comendo'].includes(m.estado) || (j.carga.id === 'prato' && m.estado !== 'prato')) j.carga = {};
});

// ---------- Adiantar (o "Time Skip" do Bancho) ----------
function palcoAdiantar() {
  const t = G.turno;
  if (!t) {
    if (pensaoAbreHoje() && G.pensao.ultimaJanta !== G.dia && G.minutos < TurnoJanta.ABRE) { G.minutos = TurnoJanta.ABRE; return true; }
    avisar('Não tem janta para adiantar agora.'); return false;
  }
  if (t.mesas.some(m => ['pedido', 'prato'].includes(m.estado))) { avisar('Ainda tem gente esperando.'); return false; }
  const prox = t.proximaChegada();
  if (prox < 0 || prox <= G.minutos) { avisar('Não vem mais ninguém hoje.'); return false; }
  G.minutos = prox; relogio._acum = 0;
  return true;
}

// ---------- o rodapé do Bancho (Cardápio, Despensa, Farinha, Adiantar, Sair) ----------
function rodapePalco() {
  let r = $('#rodape-palco');
  if (!r) {
    r = el('div', { id: 'rodape-palco', class: 'painel rodape-palco', hidden: true },
      el('button', { class: 'botao', onclick: e => { e.stopPropagation(); pensaoQuadro(); } }, 'Cardápio'),
      el('button', { class: 'botao', onclick: e => { e.stopPropagation(); guardarNaDespensa(); } }, 'Despensa'),
      el('div', { class: 'farinha' }, el('img', { src: 'a/salao/farinheira.webp' }), el('span', {}, '')),
      el('button', { class: 'botao', onclick: e => { e.stopPropagation(); palcoAdiantar(); } }, 'Adiantar ▸▸'),
      el('button', { class: 'botao', onclick: e => { e.stopPropagation(); entrarMapa('vila', { x: 15, y: 9 }); } }, 'Sair'));
    document.body.append(r);
  }
  return r;
}
ATUALIZADORES.push(() => {
  const r = rodapePalco(), ver = noPalco();
  if (r.hidden === ver) r.hidden = !ver;
  const barra = $('#hud .barra'); if (barra) barra.style.visibility = ver ? 'hidden' : '';
  if (!ver) return;
  const txt = G.turno ? `${G.turno.farinha}/${TurnoJanta.FARINHA_MAX}` : '—';
  const sp = r.querySelector('.farinha span'); if (sp.textContent !== txt) sp.textContent = txt;
});
