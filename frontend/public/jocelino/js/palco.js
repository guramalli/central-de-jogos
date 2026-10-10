// Jocelino — palco.js — a Pensão da Rosa aberta, vista de lado em tela cheia, como o sushi bar do Bancho (Dave the
// Diver): um palco fixo de 1920×1080 px de mundo. Atrás, o salão à noite; a cozinha da Rosa à direita com o passe; o
// cardápio da noite nos nichos da parede; os clientes sentados atrás do balcão, de frente; o balcão de azulejo; o Jocelino andando só para
// os lados no chão da frente; e as plantas do primeiro plano nas bordas. Toda a arte é de a/salao/ (Higgsfield).
// As camadas são objetos com y: a ordem por altura do desenhaMapa faz o empilhamento.

// Posições em px de mundo (1920×1080), as da prévia da arte (a/salao/LEIA.txt).
const PALCO = {
  LARG: 1920, ALT: 1080,
  LINHA_CHAO: 18,                 // ladrilho (48 px) da faixa onde o Jocelino anda: colado na frente do balcão
  CHAO_Y: 18 * TILE + 36,         // o pé do Jocelino (900: logo abaixo da base do balcão, 882)
  X_MIN: 6 * TILE + 14,           // 302
  X_MAX: 35 * TILE - 14,          // 1666
  PORTA_X: 6.5 * TILE,
  TAMPO_Y: 778,                   // o tampo do balcão: daqui para baixo o balcão cobre os clientes
  BALCAO: { x: 290, y: 757 },
  COZINHA: { x: 1300, y: 545 },
  ROSA: { x: 1542, y: 757, escala: 0.493 },   // o pé da Rosa no fogão (quadro de 200x300 reduzido)
  PASSA: { x: 590, y: 505 },
  FRENTE_ESQ: { x: -190, y: 0 }, FRENTE_DIR: { x: 1702, y: 0 },
  ASSENTOS: [400, 540, 680, 820, 960, 1100].map(x => ({ x, y: 856 })),    // o pé (escondido) de cada cliente: cabeça e tronco acima do tampo
  VAGAS: [672, 786, 895, 1005, 1114, 1224].map(x => ({ x, y: 570 })),     // o centro de cada nicho do passa-prato
  PRATO_Y: 602,                   // onde o prato assenta no nicho
  BEBEDOURO: { x: 1576, y: 774, w: 84, h: 126, escala: 0.42 },
  // O passe da cozinha (os pratos prontos), a bacia da louça e o lixo, na ponta direita (a/salao/LEIA_servico.txt).
  PASSE: { cx: 1375, base: 905, escala: 1, topo: 814, vagas: [1310, 1352, 1394, 1436] },
  PASSE_AREA: { x: 1285, y: 760, w: 180, h: 150 },
  BACIA: { x: 1466, y: 825, w: 64, h: 80, escala: 1 },
  LIXO: { x: 1528, y: 842, w: 39, h: 60, escala: 1 },
  CARDAPIO: { x: 590, y: 505, w: 720, h: 130 },     // os nichos da parede: o cardápio da noite
  PORTA: { x: 250, y: 680, w: 110, h: 300 },
  FARINHEIRA: { x: 1185, y: 730, w: 70, h: 62, cx: 1218, base: 786, escala: 0.36 },
  LOUCA: { base: 786, escala: 0.38 },
  ESCALA_GENTE: 1.65,             // gente grande como no Dave: o balcão bate na cintura do Jocelino
  BALCAO_ARTE: 'balcao', TOALHA_W: 995,
  ROSA_PASSE: 1430,               // até onde a Rosa anda para largar o prato no passe
  RITINHA_X: 336, CASA_ZE: 1240, CASA_AJUDANTE: 1536,
};
// O salão maior (ampliação): o balcão comprido de 8 banquetas vai até x 1515; o passe passa para a ponta direita (80%)
// e o bebedouro, a bacia e o lixo para a frente da ponta esquerda do balcão (a/salao/LEIA_ampliacao.txt).
const LAYOUT_PALCO = {
  pequeno: (({ ASSENTOS, BEBEDOURO, PASSE, PASSE_AREA, BACIA, LIXO, FARINHEIRA, BALCAO_ARTE, TOALHA_W, ROSA_PASSE, RITINHA_X, CASA_ZE, CASA_AJUDANTE }) =>
    ({ ASSENTOS, BEBEDOURO, PASSE, PASSE_AREA, BACIA, LIXO, FARINHEIRA, BALCAO_ARTE, TOALHA_W, ROSA_PASSE, RITINHA_X, CASA_ZE, CASA_AJUDANTE }))(PALCO),
  grande: {
    ASSENTOS: [400, 537, 674, 811, 948, 1085, 1222, 1359].map(x => ({ x, y: 856 })),
    BEBEDOURO: { x: 372, y: 774, w: 84, h: 126, escala: 0.42 },
    PASSE: { cx: 1597, base: 905, escala: 0.8, topo: 832, vagas: [1545, 1579, 1612, 1646] },
    PASSE_AREA: { x: 1525, y: 790, w: 145, h: 118 },
    BACIA: { x: 464, y: 825, w: 64, h: 80, escala: 1 },
    LIXO: { x: 534, y: 842, w: 39, h: 60, escala: 1 },
    FARINHEIRA: { x: 1440, y: 730, w: 70, h: 62, cx: 1475, base: 786, escala: 0.36 },
    BALCAO_ARTE: 'balcao_grande', TOALHA_W: 1240, ROSA_PASSE: 1600, RITINHA_X: 630, CASA_ZE: 600, CASA_AJUDANTE: 1480,
  },
};
function aplicaLayoutPalco() { Object.assign(PALCO, LAYOUT_PALCO[typeof temAmpliacao === 'function' && temAmpliacao('salao_maior') ? 'grande' : 'pequeno']); }
const noPalco = () => !!(G.mapa && G.mapa.palco);
ATUALIZADORES.push(() => { if (noPalco()) aplicaLayoutPalco(); });
ATUALIZADORES.push(() => document.body.classList.toggle('no-palco', noPalco()));
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
    { tipo: 'camada', y: 300, desenha(ctx) { const n = typeof Melhorias !== 'undefined' && G.pensao ? Melhorias.nivel(G.pensao, 'fogao_4bocas') : 0;
      const img = spr(n >= 2 ? 'salao/fogao_industrial' : n === 1 ? 'salao/cozinha_melhor' : 'salao/cozinha'); if (img) ctx.drawImage(img, P.COZINHA.x, P.COZINHA.y); } },
    camadaPalco('passa_prato', P.PASSA.x, P.PASSA.y, 400),
    { tipo: 'camada', y: P.TAMPO_Y + 80, desenha(ctx) { const img = spr('salao/' + P.BALCAO_ARTE); if (img) ctx.drawImage(img, P.BALCAO.x, P.BALCAO.y); } },
    { tipo: 'camada', y: 880, desenha(ctx) { const B = P.BEBEDOURO, img = spr('salao/bebedouro'); if (img) ctx.drawImage(img, B.x, B.y, img.naturalWidth * B.escala, img.naturalHeight * B.escala); } },
    camadaPalco('frente_esquerda', P.FRENTE_ESQ.x, P.FRENTE_ESQ.y, 99999),
    camadaPalco('frente_direita', P.FRENTE_DIR.x, P.FRENTE_DIR.y, 99999));
  b.paredesDaBorda();
  return b;
};

function entrarPalco() {
  aplicaLayoutPalco();
  entrarMapa('pensao_palco', { x: 8, y: PALCO.LINHA_CHAO });
  G.jog.dir = DIR.DIREITA; G.jog.alvoPalco = null; G.jog.servindo = 0; G.copo = null;
  if (typeof rosaPerguntaGuardar === 'function') rosaPerguntaGuardar();
  sons.tocar('porta', 1, 0.05, -4);
}

// ---------- os clientes, o passe, a louça, a farinheira, a Rosa e o cardápio da noite (camadas que mudam com a janta) ----------
// Os clientes sentados atrás do balcão: a folha de frente parada (o balcão, desenhado depois, cobre da cintura para baixo).
// Comendo, balançam de leve (mastigando).
function clientesDoPalco(b) {
  const t = G.turno;
  if (!t) { b._clientes = []; return []; }
  b._clientes = t.mesas.map((m, i) => {
    if (!['pedido', 'prato', 'comendo'].includes(m.estado) || i >= PALCO.ASSENTOS.length) return null;
    const ja = b._clientes && b._clientes[i];
    const p = ja && ja.id === m.cliente.id ? ja : new Personagem(m.cliente.id, m.cliente.nome, PALCO.ASSENTOS[i].x, PALCO.ASSENTOS[i].y, DIR.BAIXO);
    p.y = PALCO.ASSENTOS[i].y - (m.estado === 'comendo' ? Math.abs(Math.sin(G.agora * 7 + i)) * 3 : 0);   // nunca passa da linha do balcão
    return p;
  });
  return b._clientes.filter(Boolean);
}
const camadaViva = (y, desenha) => ({ tipo: 'camada', y, desenha });
// A Rosa na cozinha, como o Bancho: mexe a panela o tempo todo (rápido com prato no fogo, devagar e com pausa à toa) e,
// quando um prato fica pronto, anda até o passe, larga o prato e volta para o fogão (quadros de lado da folha de andar dela).
const ROSA_COZ = { x: PALCO.ROSA.x, casa: PALCO.ROSA.x, estado: 'mexe', t: 0, quadro: 0, fila: 0, vistos: 0 };
const ROSA_VEL = 230, ROSA_LARGA = 0.45, ROSA_ESCALA_ANDAR = 1.25;
ATUALIZADORES.push(dt => {
  if (!noPalco()) return;
  const R = ROSA_COZ, t = G.turno;
  R.casa = typeof Melhorias !== 'undefined' && G.pensao && Melhorias.nivel(G.pensao, 'fogao_4bocas') === 1 ? 1470 : PALCO.ROSA.x;
  const lado = Math.sign(PALCO.ROSA_PASSE - R.casa) || -1;   // -1: o passe fica à esquerda do fogão; +1: à direita (salão maior)
  const saidos = t ? (t.saidos || 0) : 0;
  if (saidos < R.vistos) R.vistos = saidos;                        // janta nova: o contador recomeça
  if (saidos > R.vistos) { R.fila = Math.min(2, R.fila + saidos - R.vistos); R.vistos = saidos; }
  R.t += dt;
  if (R.estado === 'mexe') {
    R.x = R.casa;
    const rapido = t && t.fogo.length > 0 && t.farinha > 0;
    if (rapido) R.quadro = Math.floor(R.t / 0.16) % 4;
    else { const c = R.t % 2.4; R.quadro = c < 1.2 ? Math.floor(c / 0.3) % 4 : 0; }   // à toa: uma mexida e uma pausa
    if (R.fila > 0) { R.fila--; R.estado = 'vai'; R.t = 0; }
  } else if (R.estado === 'vai') {
    R.x += lado * ROSA_VEL * dt; R.quadro = 10 + Math.floor(R.t / 0.13) % 4; R.lado = lado;
    if ((R.x - PALCO.ROSA_PASSE) * lado >= 0) { R.x = PALCO.ROSA_PASSE; R.estado = 'larga'; R.t = 0; sons.tocar('louca', 1.2, 0.05, -12); }
  } else if (R.estado === 'larga') {
    R.quadro = 20;
    if (R.t >= ROSA_LARGA) { R.estado = 'volta'; R.t = 0; }
  } else {
    R.x -= lado * ROSA_VEL * dt; R.quadro = 30 + Math.floor(R.t / 0.13) % 4;
    if ((R.x - R.casa) * lado <= 0) { R.x = R.casa; R.estado = R.fila > 0 ? 'vai' : 'mexe'; if (R.fila > 0) R.fila--; R.t = 0; }
  }
});
function desenhaRosaCozinha(ctx) {
  const R = ROSA_COZ, P = PALCO;
  if (R.estado === 'mexe') {
    const img = spr('salao/rosa_cozinhando');
    if (!img) return;
    const w = img.naturalWidth / 4, h = img.naturalHeight, e = P.ROSA.escala;
    ctx.drawImage(img, R.quadro * w, 0, w, h, R.x - w * e / 2, P.ROSA.y - h * e, w * e, h * e);
    return;
  }
  // Andando: coluna 2 (esquerda) ou 3 (direita) da folha de andar; linhas 1 e 3 são o quadro parado.
  const img = spr('personagens/rosa/andar');
  if (!img) return;
  const w = img.naturalWidth / 4, h = img.naturalHeight / 4, e = ROSA_ESCALA_ANDAR;
  const esq = (R.lado || -1) < 0, col = (R.estado === 'volta') === esq ? 3 : 2, lin = R.estado === 'larga' ? 1 : R.quadro % 10;
  ctx.drawImage(img, col * w, lin * h, w, h, R.x - w * e / 2, P.ROSA.y - h * e, w * e, h * e);
}
function camadasDaJanta() {
  const t = G.turno, P = PALCO;
  return [
    // O cardápio da noite nos nichos da parede: o prato marcado e quantas porções a despensa ainda rende.
    camadaViva(401, ctx => {
      const ids = (G.pensao && (G.pensao.cardapio.length ? G.pensao.cardapio : G.pensao.receitas)) || [];
      ids.slice(0, P.VAGAS.length).forEach((id, k) => {
        const v = P.VAGAS[k], n = G.pensao.porcoes(id) || G.pensao.rende(id) * G.pensao.porcoesPorPanela(id);
        ctx.save(); ctx.globalAlpha = n > 0 ? 1 : 0.35; desenhaPrato(ctx, id, v.x, P.PRATO_Y, 1, 1.35); ctx.restore();
        texto(ctx, n > 0 ? String(n) : '0', v.x, P.PRATO_Y + 26, 18, n > 0 ? '#fff' : '#e8452c', '900');
        if (t && t.pratoTema === id) desenhaPe(ctx, 'salao/fita_tema', v.x, 539);
      });
    }),
    // A Rosa viva na cozinha (ROSA_COZ): mexendo a panela ou levando o prato até o passe.
    camadaViva(301, ctx => desenhaRosaCozinha(ctx)),
    // As moedas da gorjeta no tampo (o Jocelino recolhe ao passar).
    camadaViva(P.TAMPO_Y + 82, ctx => { if (t) for (const x of t.moedas) if (P.ASSENTOS[x.mesa]) desenhaPe(ctx, 'salao/moedas_balcao', P.ASSENTOS[x.mesa].x + 34, P.LOUCA.base + 1, 1, 1.2); }),
    // No tampo: o prato de quem está comendo, a louça de quem já foi, e a farinheira.
    camadaViva(P.TAMPO_Y + 81, ctx => {
      if (t) t.mesas.forEach((m, i) => {
        if (i >= P.ASSENTOS.length) return;
        if (m.estado === 'comendo') desenhaPrato(ctx, m.prato, P.ASSENTOS[i].x, P.LOUCA.base + 2, 1, 0.9);
        if (m.estado === 'suja') desenhaPe(ctx, 'salao/louca_suja', P.ASSENTOS[i].x, P.LOUCA.base, 1, P.LOUCA.escala);
      });
      const F = P.FARINHEIRA, nf = typeof Melhorias !== 'undefined' && G.pensao ? Melhorias.nivel(G.pensao, 'farinheira_grande') : 0;
      if (nf >= 2) desenhaPe(ctx, 'salao/farinheira_barril', F.cx + 10, 790, 1, 0.5);
      else desenhaPe(ctx, nf ? 'salao/farinheira_grande' : 'salao/farinheira', nf ? F.cx + 13 : F.cx, nf ? 788 : F.base, 1, nf ? 0.55 : F.escala);
    }),
    // O passe da cozinha (a bancada), os pratos prontos em cima dele, a bacia e o lixo.
    camadaViva(878, ctx => {
      desenhaPe(ctx, 'salao/passe', P.PASSE.cx, P.PASSE.base, 1, P.PASSE.escala);
      if (t) t.passaPrato().forEach((x, k) => desenhaPrato(ctx, x.prato, P.PASSE.vagas[k], P.PASSE.topo, 1, 0.8));
    }),
    camadaViva(879, ctx => { desenhaPe(ctx, 'salao/bacia', P.BACIA.x + P.BACIA.w / 2, P.BACIA.y + P.BACIA.h, 1, P.BACIA.escala); }),
    camadaViva(878.5, ctx => { desenhaPe(ctx, 'salao/lixo', P.LIXO.x + P.LIXO.w / 2, P.LIXO.y + P.LIXO.h, 1, P.LIXO.escala); }),
  ];
}
MAPAS_DEF.pensao_palco = (orig => () => {
  const b = orig();
  b.extras = () => [...clientesDoPalco(b), ...camadasDaJanta(), ...(typeof ajudantesDoPalco === 'function' ? ajudantesDoPalco() : []), ...filhosDoPalco(), ...(typeof camadasMelhorias === 'function' ? camadasMelhorias() : [])];
  b.desenhaPorCima = ctx => { desenhaBaloesPalco(ctx, b); desenhaBandeja(ctx); if (typeof desenhaFlutuantes === 'function') desenhaFlutuantes(ctx); };
  return b;
})(MAPAS_DEF.pensao_palco);

// Balões em cima de cada cliente: o pedido (branco quando o prato já está pronto), a bebida, a paciência e as frases.
function desenhaBaloesPalco(ctx, b) {
  const t = G.turno;
  if (!t) return;
  t.mesas.forEach((m, i) => {
    if (i >= PALCO.ASSENTOS.length || !['pedido', 'prato', 'comendo'].includes(m.estado)) return;
    const A = PALCO.ASSENTOS[i], x = A.x, y = A.y - 114 * PALCO.ESCALA_GENTE - 34;
    const bebe = m.querBebida && !m.bebidaServida;
    if (m.cliente.mania === 'vip') texto(ctx, '★ ' + m.cliente.nome.split(',')[0], x, y - 42, 18, '#ffd34d', '900');
    if (m.estado === 'comendo') {
      const fr = FRASES_CLIENTE[m.reacao] || ['Hmm!'];
      texto(ctx, fr[(i + m.vezes) % fr.length], x, y + 20, 20, '#fff');
      if (m.reacao === 'coracao') desenhaFx(ctx, 'coracao', x, y - 10);
      if (bebe) { desenhaFx(ctx, 'balao', x + 44, y + 40, { escala: 0.62 }); desenhaPe(ctx, 'salao/bebida_' + m.bebida, x + 44, y + 54, 1, 0.5); }
      return;
    }
    if (m.estado === 'pedido') { desenhaFx(ctx, 'balao_pensamento', x, y); texto(ctx, '...', x, y + 6, 30, '#555', '900'); return; }
    const pronto = t.temPronto(m.prato);
    desenhaFx(ctx, pronto ? 'balao' : 'balao_pensamento', x, y);
    ctx.save(); ctx.globalAlpha = pronto ? 1 : 0.55; desenhaPrato(ctx, m.prato, x, y + 18, 1, 0.8); ctx.restore();
    if (bebe) { desenhaFx(ctx, 'balao', x + 44, y + 14, { escala: 0.62 }); desenhaPe(ctx, 'salao/bebida_' + m.bebida, x + 44, y + 28, 1, 0.5); }
    const f = clamp(1 - m.espera / (TurnoJanta.PACIENCIA_PRATO * (t.paciencia || 1)), 0, 1);
    if (spr('fx/barra_moldura')) {
      desenhaFx(ctx, 'barra_moldura', x, y + 42);   // a moldura tem o miolo escuro: a cor vai por cima
      ctx.fillStyle = f > 0.5 ? '#5ec43a' : f > 0.25 ? '#e8c22c' : '#e8452c'; ctx.fillRect(x - 26, y + 40, 52 * f, 4);
    }
  });
}
// A bandeja: o que o Jocelino carrega, em fila em cima da cabeça.
function desenhaBandeja(ctx) {
  const t = G.turno, j = G.jog;
  if (!t || !j || !t.bandeja.length) return;
  const y = j.y - 114 * PALCO.ESCALA_GENTE - 26, n = t.bandeja.length;
  t.bandeja.forEach((x, k) => {
    const cx = j.x + (k - (n - 1) / 2) * 44;
    if (x.tipo === 'prato') desenhaPrato(ctx, x.prato, cx, y, 1, 0.85);
    else if (x.tipo === 'bebida') desenhaPe(ctx, 'salao/bebida_' + x.bebida, cx, y, 1, 0.6);
    else desenhaPe(ctx, 'salao/pilha_louca', cx, y, 1, 0.7);
  });
}

// ---------- clicar, ir até e fazer ----------
function palcoAlvoEm(px, py) {
  const P = PALCO, t = G.turno;
  const dentro = (R) => px >= R.x && px <= R.x + R.w && py >= R.y && py <= R.y + R.h;
  if (t) {
    const ps = t.passaPrato();
    for (let k = 0; k < ps.length; k++) if (Math.abs(px - P.PASSE.vagas[k]) < 22 && Math.abs(py - (P.PASSE.topo - 14)) < 40) return { tipo: 'passe', k, x: P.PASSE.vagas[k] };
  }
  if (dentro(P.PASSE_AREA)) return { tipo: 'passe', k: 0, x: P.PASSE.cx };
  if (dentro(P.FARINHEIRA)) return { tipo: 'farinheira', x: P.FARINHEIRA.cx };
  if (dentro(P.BEBEDOURO)) return { tipo: 'bebedouro', x: P.BEBEDOURO.x + P.BEBEDOURO.w / 2 };
  if (dentro(P.BACIA)) return { tipo: 'bacia', x: P.BACIA.x + P.BACIA.w / 2 };
  if (dentro(P.LIXO)) return { tipo: 'lixo', x: P.LIXO.x + P.LIXO.w / 2 };
  if (dentro(P.CARDAPIO)) return { tipo: 'cardapio', x: clamp(px, P.X_MIN, P.X_MAX) };
  if (t) for (let i = 0; i < Math.min(t.mesas.length, P.ASSENTOS.length); i++) {
    const A = P.ASSENTOS[i], m = t.mesas[i];
    if (Math.abs(px - A.x) > 66 || py < A.y - 220 || py > P.TAMPO_Y + 60) continue;
    if (m.estado !== 'livre') return { tipo: 'cliente', i, x: A.x };
  }
  if (dentro(P.PORTA)) return { tipo: 'porta', x: P.X_MIN };
  return null;
}
// Clique no palco: o Jocelino anda até o alvo e faz ao chegar; um clique novo troca o alvo.
function palcoClique(px, py) {
  if (G.copo) return true;
  const alvo = palcoAlvoEm(px, py);
  G.jog.alvoPalco = { x: clamp(alvo ? alvo.x : px, PALCO.X_MIN, PALCO.X_MAX), alvo };
  return true;
}
ATUALIZADORES.push(dt => {
  const j = G.jog;
  if (!noPalco() || !j) return;
  if (j.servindo > 0) { j.servindo -= dt; j.dir = DIR.CIMA; j.andando = false; if (j.servindo <= 0) j.dir = DIR.BAIXO; return; }
  if (!j.alvoPalco || G.copo) return;
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
// A tecla X: o alvo mais perto do Jocelino (com a bandeja cheia, prefere quem espera o que ele leva).
function palcoAgirNaFrente() {
  const P = PALCO, t = G.turno, cands = [];
  if (t) {
    if (t.passaPrato().length) cands.push({ tipo: 'passe', k: 0, x: P.PASSE.cx });
    t.mesas.forEach((m, i) => { if (i < P.ASSENTOS.length && m.estado !== 'livre') cands.push({ tipo: 'cliente', i, x: P.ASSENTOS[i].x, quer: m }); });
  }
  cands.push({ tipo: 'farinheira', x: P.FARINHEIRA.cx }, { tipo: 'bebedouro', x: P.BEBEDOURO.x + P.BEBEDOURO.w / 2 },
    { tipo: 'bacia', x: P.BACIA.x + P.BACIA.w / 2 }, { tipo: 'lixo', x: P.LIXO.x + P.LIXO.w / 2 });
  const leva = c => t && c.quer && t.bandeja.some(x => (x.tipo === 'prato' && x.prato === c.quer.prato && c.quer.estado === 'prato') || (x.tipo === 'bebida' && x.bebida === c.quer.bebida));
  const peso = c => Math.abs(c.x - G.jog.x) - (leva(c) ? 400 : 0);
  const a = cands.filter(c => Math.abs(c.x - G.jog.x) < 110).sort((p, q) => peso(p) - peso(q))[0];
  if (a) palcoAgir(a); else avisar('Nada aqui. Chegue perto de um cliente, do passe, da farinheira, do bebedouro ou da bacia.');
}
function palcoAgir(a) {
  const t = G.turno, j = G.jog;
  if (a.tipo === 'porta') { sairDoPalco(); return; }
  if (a.tipo === 'cardapio') { pensaoQuadro(); return; }
  if (!t) { avisar(pensaoAbreHoje() ? 'A janta começa às 17h. Use o Adiantar ou espere.' : 'Hoje a pensão não abre.'); return; }
  const cheia = () => { avisar('A bandeja está cheia! Entregue alguma coisa primeiro.'); sons.tocar('erro', 1, 0.05, -6); };
  if (a.tipo === 'passe') {
    if (!t.passaPrato().length) { avisar(t.farinha <= 0 ? 'A farinheira acabou: a Rosa parou! Reponha a farinha.' : 'Nenhum prato pronto ainda.'); return; }
    if (t.bandeja.length >= TurnoJanta.BANDEJA_MAX) return cheia();
    t.pegar(Math.min(a.k || 0, t.passaPrato().length - 1)); sons.tocar('louca', 1.2, 0.05, -8);
    return;
  }
  if (a.tipo === 'bebedouro') {
    const b = t.bebidaPedida();
    if (!b) { avisar('Ninguém está esperando bebida agora.'); return; }
    if (t.bandeja.length >= TurnoJanta.BANDEJA_MAX) return cheia();
    abrirCopo(b);
    return;
  }
  if (a.tipo === 'farinheira') {
    const r = t.reporFarinha();
    if (r === 'ok') { avisar('Farinheira cheia de novo!'); sons.tocar('farinha', 1, 0.05, -4); }
    else avisar(r === 'cheia' ? `A farinheira ainda tem ${t.farinha}. Repõe quando baixar de ${(t.farinhaMax || TurnoJanta.FARINHA_MAX) - (TurnoJanta.FARINHA_MAX - TurnoJanta.REPOR_ATE) + 1}.` : 'Acabou a farinha na despensa! Compre na Mercearia do Seu Ananias.');
    return;
  }
  if (a.tipo === 'bacia') {
    const n = t.largarLouca();
    if (n) { sons.tocar('bacia', 1, 0.08, -4); avisar(n > 1 ? `${n} pratos na bacia. Ploft!` : 'Ploft! Louça na bacia.'); }
    else avisar('A bacia é para a louça suja.');
    return;
  }
  if (a.tipo === 'lixo') {
    const n = t.jogarFora();
    if (n) { sons.tocar('lixo', 1, 0.05, -4); setTimeout(() => sons.tocar('rosa_resmunga', 1, 0.08, -6), 350); avisar('A Rosa resmungou: "Comida no lixo, Jocelino?!"'); }
    else avisar('Não tem nada para jogar fora.');
    return;
  }
  if (a.tipo === 'cliente') {
    const m = t.mesas[a.i];
    // O estado pode ter mudado no caminho: revalida.
    if (!m || m.estado === 'livre') { avisar('A banqueta ficou vazia.'); return; }
    if (m.estado === 'suja') {
      if (t.bandeja.length >= TurnoJanta.BANDEJA_MAX) return cheia();
      t.recolher(a.i); servir(); sons.tocar('louca', 1, 0.08, -4);
      return;
    }
    if (t.servirBebida(a.i)) { servir(); sons.tocar('servir', 1.2, 0.08, -4); setTimeout(() => sons.tocar('gole', 1, 0.1, -4), 400); return; }
    if (m.estado === 'prato' && t.servir(a.i)) { servir(); sons.tocar('servir', 1, 0.08, -2); setTimeout(() => sons.tocar(m.reacao === 'nojo' ? 'cliente_eca' : 'cliente_hmm', 1, 0.1, -4), 450); return; }
    if (m.estado === 'pedido') avisar(`${m.cliente.nome} está lendo o cardápio.`);
    else if (m.estado === 'prato') {
      const quer = `${Pratos.PRATOS[m.prato].nome}${m.querBebida && !m.bebidaServida ? ' e ' + Pratos.BEBIDAS[m.bebida].toLowerCase() : ''}`;
      avisar(`${m.cliente.nome} quer ${quer}. ${t.temPronto(m.prato) ? 'Tem no passe!' : t.farinha <= 0 ? 'A farinheira acabou: a Rosa parou!' : 'A Rosa está fazendo.'}`);
    } else avisar(m.querBebida && !m.bebidaServida ? `${m.cliente.nome} está comendo e ainda quer ${Pratos.BEBIDAS[m.bebida].toLowerCase()}.` : `${m.cliente.nome} está comendo.`);
  }
  function servir() { j.servindo = 0.35; j.dir = DIR.CIMA; }
}
function sairDoPalco() { G.jog.alvoPalco = null; G.copo = null; entrarMapa('vila', { x: 15, y: 9 }); }

// ---------- o copo do bebedouro: segurar para encher, soltar na linha ----------
const COPO = { VEL: 0.42, MEDIDA: 0.05, MINIMO: 0.6,
  GEO: { cafe: { topo: 157, fundo: 295, linha: 187, espuma: false }, guarana: { topo: 17, fundo: 307, linha: 67, espuma: true }, caldo_cana: { topo: 19, fundo: 304, linha: 74, espuma: true }, cerveja: { topo: 17, fundo: 307, linha: 67, espuma: true } }, ART: { cafe: 'copo_cafe', guarana: 'copo_guarana', caldo_cana: 'copo_caldo', cerveja: 'copo_guarana' }, LIQ: { cafe: 'liquido_cafe', guarana: 'liquido_guarana', caldo_cana: 'liquido_caldo', cerveja: 'liquido_guarana' } };
// A linha de medida do copo em fração do nível (0 = vazio, 1 = boca).
function linhaDoCopo(b) { const g = COPO.GEO[b]; return (g.fundo - g.linha) / (g.fundo - g.topo); }
function abrirCopo(bebida) { G.copo = { bebida, nivel: 0, segurando: false, msg: 'Segure para encher. Solte na linha!' }; G.jog.alvoPalco = null; }
function copoSegura(sim) {
  const c = G.copo;
  if (!c) return false;
  if (sim) { c.segurando = true; return true; }
  if (!c.segurando) return true;
  c.segurando = false;
  if (c.nivel < COPO.MINIMO) { c.msg = 'Ainda falta! Segure de novo.'; return true; }
  const q = Math.abs(c.nivel - linhaDoCopo(c.bebida)) <= COPO.MEDIDA ? 'medida' : 'ok';
  copoFim(q);
  return true;
}
function copoFim(q) {
  const c = G.copo, t = G.turno;
  if (!c || !t) { G.copo = null; return; }
  t.encherBebida(c.bebida, q);
  G.copo = null;
  if (q === 'medida') { sons.tocar('na_medida', 1, 0.03, -4); avisar(`${Pratos.BEBIDAS[c.bebida]} na medida! Gorjeta caprichada.`); }
  else avisar(`${Pratos.BEBIDAS[c.bebida]} servido(a). Leve para quem pediu.`);
}
ATUALIZADORES.push(dt => {
  const c = G.copo;
  if (!c) return;
  if (!noPalco()) { G.copo = null; return; }
  if (!c.segurando) return;
  c.nivel += COPO.VEL * dt;
  if (Math.floor(c.nivel * 10) !== Math.floor((c.nivel - COPO.VEL * dt) * 10)) sons.tocar('encher', 1 + c.nivel * 0.3, 0.02, -10);
  if (c.nivel >= 1) { c.nivel = 0; c.segurando = false; c.msg = 'Derramou! Comece de novo.'; sons.tocar('derramar', 1, 0.05, -2); }
});
DESENHOS_TELA.push(ctx => {
  const c = G.copo;
  if (!c) return;
  const copo = spr('salao/' + COPO.ART[c.bebida]), dentro = spr('salao/' + COPO.ART[c.bebida] + '_dentro'), liq = spr('salao/' + COPO.LIQ[c.bebida]), esp = spr('salao/espuma_topo');
  const W = G.larg, H = G.alt;
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 0, W, H); ctx.restore();
  if (!copo) return;
  const e = Math.min(1.4, H * 0.5 / copo.naturalHeight), w = copo.naturalWidth * e, h = copo.naturalHeight * e, x = W / 2 - w / 2, y = H / 2 - h / 2;
  // O líquido: a textura com o topo no nível (mais a espuma), recortada pelo formato de dentro do copo.
  if (dentro && liq) {
    const off = _copoTela || (_copoTela = document.createElement('canvas'));
    const g0 = COPO.GEO[c.bebida], W0 = copo.naturalWidth, H0 = copo.naturalHeight;
    off.width = W0; off.height = H0;
    const g = off.getContext('2d');
    g.clearRect(0, 0, W0, H0);
    const ny = g0.fundo - (g0.fundo - g0.topo) * Math.min(1, c.nivel);
    g.drawImage(liq, 0, ny);
    if (g0.espuma && esp && c.nivel > 0.05) { const eh = esp.naturalHeight * W0 / esp.naturalWidth; g.drawImage(esp, 0, ny - eh * 0.35, W0, eh * 0.6); }
    g.globalCompositeOperation = 'destination-in'; g.drawImage(dentro, 0, 0); g.globalCompositeOperation = 'source-over';
    ctx.drawImage(off, x, y, w, h);
  }
  ctx.drawImage(copo, x, y, w, h);
  texto(ctx, Pratos.BEBIDAS[c.bebida], W / 2, y - 24, 30, '#fff', '900');
  texto(ctx, c.msg, W / 2, y + h + 44, 24, '#ffe08a', '800');
});
let _copoTela = null;

// Quem está comendo mastiga (de vez em quando, um de cada vez, baixinho).
let _mastiga = 1.5;
ATUALIZADORES.push(dt => {
  const t = G.turno;
  if (!t || !noPalco()) return;
  _mastiga -= dt;
  if (_mastiga > 0) return;
  _mastiga = rnd(1.4, 3);
  const comendo = t.mesas.map((m, i) => ({ m, i })).filter(x => x.m.estado === 'comendo' && x.i < PALCO.ASSENTOS.length);
  if (comendo.length) sons.tocar('mastigar', 1 + rnd(-0.08, 0.08), 0.05, -12);
});
// Recolher as moedas da gorjeta: basta o Jocelino passar perto (como o Dave pegando a gorjeta).
ATUALIZADORES.push(() => {
  const t = G.turno, j = G.jog;
  if (!t || !noPalco() || !j || !t.moedas.length) return;
  for (const x of [...t.moedas]) {
    const A = PALCO.ASSENTOS[x.mesa];
    if (A && Math.abs(A.x + 34 - j.x) < 44) { const v = t.recolherMoedas(x.mesa); if (v) { sons.tocar('moedas', 1.2, 0.05, -6); flutuar(j.x, j.y - 170, `+Cr$ ${v} gorjeta`, '#ffd34d'); } }
  }
});
// O que acontece na janta e o jogador precisa ver (a farinheira acabou).
ATUALIZADORES.push(() => {
  const t = G.turno;
  if (!t || !noPalco()) return;
  if (t._avisouFarinha && !t._mostrouFarinha) { t._mostrouFarinha = true; avisar('A farinheira acabou! A Rosa parou: clique na farinheira para repor.'); sons.tocar('rosa_resmunga', 1, 0.05, -4); }
  if (!t._avisouFarinha) t._mostrouFarinha = false;
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
  if (prox < 0) { if (t.mesas.some(m => m.estado === 'comendo')) { avisar('Ainda tem gente comendo.'); return false; } G.minutos = TurnoJanta.FECHA; relogio._acum = 0; return true; }
  if (!t.mesas.some(m => m.estado === 'livre')) { avisar('Recolha a louça: tem gente esperando banqueta.'); return false; }
  if (prox <= G.minutos) { avisar('O próximo cliente já está chegando.'); return false; }
  G.minutos = prox; relogio._acum = 0;
  return true;
}

// ---------- o rodapé (Cardápio, Despensa, Farinha, Adiantar, Sair) ----------
function rodapePalco() {
  let r = $('#rodape-palco');
  if (!r) {
    r = el('div', { id: 'rodape-palco', class: 'painel rodape-palco', hidden: true },
      el('button', { class: 'botao', onclick: e => { e.stopPropagation(); abrirMetas(); } }, 'Metas'),
      el('button', { class: 'botao', onclick: e => { e.stopPropagation(); pensaoQuadro(); } }, 'Cardápio'),
      el('button', { class: 'botao', onclick: e => { e.stopPropagation(); abrirCaderno(); } }, 'Receitas'),
      el('button', { class: 'botao', onclick: e => { e.stopPropagation(); abrirPainelPensao(); } }, 'A Pensão'),
      el('button', { class: 'botao', onclick: e => { e.stopPropagation(); abrirEquipe(); } }, 'Equipe'),
      el('button', { class: 'botao', onclick: e => { e.stopPropagation(); abrirMelhorias(); } }, 'Melhorias'),
      el('button', { class: 'botao', onclick: e => { e.stopPropagation(); abrirDespensa(); } }, 'Despensa'),
      el('button', { class: 'botao forte bt-concurso', hidden: true, onclick: e => { e.stopPropagation(); abrirConcurso(); } }, 'Concurso 🎙'),
      el('div', { class: 'farinha' }, el('img', { src: urlArte('salao/farinheira') }), el('span', {}, '')),
      el('button', { class: 'botao', onclick: e => { e.stopPropagation(); palcoAdiantar(); } }, 'Adiantar ▸▸'),
      el('button', { class: 'botao', onclick: e => { e.stopPropagation(); sairDoPalco(); } }, 'Sair'));
    document.body.append(r);
  }
  return r;
}
ATUALIZADORES.push(() => {
  const r = rodapePalco(), ver = noPalco();
  if (r.hidden === ver) r.hidden = !ver;
  const barra = $('#hud .barra'); if (barra) barra.style.visibility = ver ? 'hidden' : '';
  if (!ver) return;
  const bc = r.querySelector('.bt-concurso'), cv = typeof podeConcurso === 'function' && podeConcurso(); if (bc.hidden === cv) bc.hidden = !cv;
  const txt = G.turno ? `${G.turno.farinha}/${G.turno.farinhaMax || TurnoJanta.FARINHA_MAX}` : '—';
  const sp = r.querySelector('.farinha span'); if (sp.textContent !== txt) sp.textContent = txt;
});

// ---------- os filhos na pensão ----------
// A Ritinha na porta, cuidando do caixa (a gorjeta da noite sai 10% maior); o Zezinho na faixa do chão, devagarinho,
// recolhendo a louça que ninguém pegou (e de olho nas cocadas). A arte é a deles do quintal (folha de criança).
const FILHOS = { ritinha: null, zezinho: null };
const FILHO_ZE_VEL = 85;
function filhosDoPalco() {
  const t = G.turno;
  if (!t || !noPalco() || !t.filho) { FILHOS.ritinha = FILHOS.zezinho = null; return []; }
  if (t.filho === 'ritinha') {
    if (!FILHOS.ritinha) FILHOS.ritinha = new Personagem('ritinha', 'Ritinha', PALCO.RITINHA_X, PALCO.CHAO_Y - 4, DIR.BAIXO);
    return [FILHOS.ritinha];
  }
  if (!FILHOS.zezinho) { const z = FILHOS.zezinho = new Personagem('zezinho', 'Zezinho', PALCO.CASA_ZE, PALCO.CHAO_Y - 6, DIR.ESQUERDA); z.tarefa = null; z.espera = 5; }
  return [FILHOS.zezinho];
}
ATUALIZADORES.push(dt => {
  const t = G.turno, z = FILHOS.zezinho;
  if (FILHOS.ritinha) { FILHOS.ritinha.t += dt; FILHOS.ritinha.andando = false; FILHOS.ritinha.x = PALCO.RITINHA_X; }
  if (!t || !noPalco() || !z) return;
  z.t += dt;
  if (!z.tarefa) {
    z.andando = false; z.espera -= dt;
    if (z.espera > 0) return;
    z.espera = 6;                                                  // criança: faz uma coisa e para um pouco
    const i = t.mesas.findIndex((m, k) => k < PALCO.ASSENTOS.length && m.estado === 'suja' && !AJUDANTES.some(o => o.tarefa && o.tarefa.i === k));
    z.tarefa = i >= 0 ? { tipo: 'louca', i, x: PALCO.ASSENTOS[i].x } : (Math.abs(z.x - PALCO.CASA_ZE) > 4 ? { tipo: 'casa', x: PALCO.CASA_ZE } : null);
    if (!z.tarefa) return;
  }
  const dx = z.tarefa.x - z.x;
  if (Math.abs(dx) > 5) { z.x += Math.sign(dx) * Math.min(Math.abs(dx), FILHO_ZE_VEL * dt); z.dir = dx < 0 ? DIR.ESQUERDA : DIR.DIREITA; z.andando = true; return; }
  z.andando = false;
  if (z.tarefa.tipo === 'louca') { if (t.ajudanteRecolhe(z.tarefa.i)) { sons.tocar('louca', 1.3, 0.05, -10); avisar('O Zezinho recolheu uma louça! (devagarinho, mas recolheu)'); } z.tarefa = { tipo: 'bacia', x: PALCO.BACIA.x + 30 }; }
  else if (z.tarefa.tipo === 'bacia') { sons.tocar('bacia', 1.3, 0.05, -12); z.tarefa = null; }
  else z.tarefa = null;
});

// ---------- os ajudantes de salão trabalhando no palco ----------
// Cada ajudante de salão anda na faixa do chão (como o Jocelino, um pouco atrás) e faz o que as habilidades dele deixam:
// recolher louça, servir bebida, repor a farinheira. Sem habilidade, fica no canto do bebedouro, de olho.
const AJUDANTES = [];
function ajudantesDoPalco() {
  const p = G.pensao;
  if (!p || !noPalco()) { AJUDANTES.length = 0; return []; }
  const salao = p.equipe.filter(e => e.posto === 'salao'), cozinha = p.equipe.filter(e => e.posto === 'cozinha');
  while (AJUDANTES.length > salao.length + cozinha.length) AJUDANTES.pop();
  [...salao, ...cozinha].forEach((e, k) => {
    let a = AJUDANTES[k];
    if (!a || a.id !== e.id) {
      a = AJUDANTES[k] = new Personagem(e.id, e.nome, e.posto === 'cozinha' ? PALCO.ROSA.x - 90 : PALCO.CASA_AJUDANTE - k * 60, e.posto === 'cozinha' ? PALCO.ROSA.y : PALCO.CHAO_Y - 4, DIR.BAIXO);
      a.equipe = e; a.casa = a.x; a.tarefa = null; a.espera = 0;
    }
  });
  return AJUDANTES;
}
ATUALIZADORES.push(dt => {
  const t = G.turno, p = G.pensao;
  if (!t || !noPalco() || !p) return;
  ajudantesDoPalco();
  for (const a of AJUDANTES) {
    a.t += dt;
    const e = a.equipe;
    if (e.posto === 'cozinha') { a.andando = false; a.dir = DIR.DIREITA; continue; }   // ajuda a Rosa no fogão
    if (!a.tarefa) {
      a.espera -= dt;
      if (a.espera > 0) continue;
      a.espera = 0.6;
      const tem = h => e.habilidades.includes(h);
      const suja = tem('louca') ? t.mesas.findIndex((m, i) => i < PALCO.ASSENTOS.length && m.estado === 'suja' && !AJUDANTES.some(o => o.tarefa && o.tarefa.i === i)) : -1;
      const bebe = tem('bebida') ? t.mesas.findIndex((m, i) => i < PALCO.ASSENTOS.length && ['prato', 'comendo'].includes(m.estado) && m.querBebida && !m.bebidaServida && !AJUDANTES.some(o => o.tarefa && o.tarefa.i === i)) : -1;
      if (tem('farinha') && t.farinha <= TurnoJanta.REPOR_ATE && (p.despensa.farinha || 0) > 0) a.tarefa = { tipo: 'farinha', x: PALCO.FARINHEIRA.cx };
      else if (suja >= 0) a.tarefa = { tipo: 'louca', i: suja, x: PALCO.ASSENTOS[suja].x };
      else if (bebe >= 0) a.tarefa = { tipo: 'bebida', i: bebe, x: PALCO.BEBEDOURO.x + 20, depois: PALCO.ASSENTOS[bebe].x };
      else if (Math.abs(a.x - a.casa) > 4) a.tarefa = { tipo: 'casa', x: a.casa };
      if (!a.tarefa) { a.andando = false; continue; }
    }
    const v = 150 * (1 + e.servico / 120);
    const dx = a.tarefa.x - a.x;
    if (Math.abs(dx) > 5) { a.x += Math.sign(dx) * Math.min(Math.abs(dx), v * dt); a.dir = dx < 0 ? DIR.ESQUERDA : DIR.DIREITA; a.andando = true; continue; }
    a.andando = false;
    const tf = a.tarefa;
    if (tf.tipo === 'farinha') { if (t.reporFarinha() === 'ok') sons.tocar('farinha', 1.1, 0.05, -8); a.tarefa = null; }
    else if (tf.tipo === 'louca') { if (t.ajudanteRecolhe(tf.i)) sons.tocar('louca', 1.1, 0.05, -8); a.tarefa = { tipo: 'bacia', x: PALCO.BACIA.x + 30 }; }
    else if (tf.tipo === 'bacia') { sons.tocar('bacia', 1.1, 0.05, -10); a.tarefa = null; }
    else if (tf.tipo === 'bebida' && tf.depois != null) { a.tarefa = { tipo: 'servir_bebida', i: tf.i, x: tf.depois }; }
    else if (tf.tipo === 'servir_bebida') { if (t.ajudanteBebida(tf.i)) sons.tocar('servir', 1.25, 0.05, -8); a.tarefa = null; }
    else a.tarefa = null;
  }
});

// ---------- a tela Equipe ----------
function abrirEquipe() {
  const p = G.pensao;
  const caixa = el('div', { class: 'painel equipe' });
  const desenha = () => {
    caixa.innerHTML = '';
    const vagas = ['salao', 'cozinha', 'compras'].map(k => `${Equipe.POSTOS[k]}: ${Equipe.vagasLivres(p, k)} vaga(s)`).join(' · ');
    caixa.append(el('div', { class: 'titulo', style: 'font-size:28px' }, 'Equipe da Pensão'), el('div', { class: 'eq-vagas' }, vagas + ` · salários Cr$ ${Equipe.salarios(p)}/noite`));
    // Ajudantes contratados.
    const lista = el('div', { class: 'eq-lista' });
    if (!p.equipe.length) lista.append(el('div', { class: 'rodape', style: 'text-align:left' }, p.grau() < 2 ? 'A pensão ainda é pequena para ter ajudante: no "Boteco Conhecido" abre a primeira vaga.' : 'Ninguém contratado ainda. Ponha um anúncio!'));
    p.equipe.forEach((e, i) => {
      const c = Equipe.custoTreino(e);
      lista.append(el('div', { class: 'eq-pessoa' }, el('img', { src: urlArte(`retratos/${e.id}_normal`) }),
        el('div', {}, el('b', {}, `${e.nome} · ${Equipe.POSTOS[e.posto]} · Nv ${e.nivel}`),
          el('div', { class: 'eq-at' }, `Serviço ${e.servico} · Cozinha ${e.cozinha} · Compras ${e.compras} · Simpatia ${e.simpatia}`),
          el('div', { class: 'eq-at' }, e.nivel < 10 ? `▸ Treinar: nível ${e.nivel} → ${e.nivel + 1}, salário Cr$ ${Equipe.salario(e)} → ${Equipe.salario(e) + 2}/noite` + ((e.nivel + 1 === 3 || e.nivel + 1 === 7) ? ' · ganha habilidade nova!' : '') : 'Nível máximo.'),
          el('div', { class: 'eq-hab' }, e.habilidades.length ? '★ ' + e.habilidades.map(h => (Object.values(Equipe.HABILIDADES).flat().find(x => x[0] === h) || [h, h])[1]).join(' · ') : 'Habilidade nova no nível 3 e no 7.')),
        el('div', { class: 'eq-bts' },
          el('button', { class: 'botao forte' + (G.dinheiro >= c && e.nivel < 10 ? '' : ' desligado'), onclick: ev => { ev.stopPropagation();
            const pago = Equipe.treinar(p, i, G.dinheiro);
            if (pago) { G.dinheiro -= pago; sons.tocar('carimbo', 1.2, 0.05, -4); avisar(`${e.nome} treinou: nível ${e.nivel}!`); hudSujo(); desenha(); }
            else avisar(e.nivel >= 10 ? 'Já está no nível máximo.' : `Treinar custa Cr$ ${c}.`); } }, `Treinar (Cr$ ${c})`),
          el('button', { class: 'botao', onclick: ev => { ev.stopPropagation(); Equipe.demitir(p, i); desenha(); } }, 'Dispensar'))));
    });
    caixa.append(lista);
    // Candidatos (do anúncio de ontem).
    if (p.candidatos.length) {
      caixa.append(el('div', { class: 'cad-sub' }, 'Candidatos'));
      const cl = el('div', { class: 'eq-lista' });
      p.candidatos.forEach((c, i) => cl.append(el('div', { class: 'eq-pessoa' }, el('img', { src: urlArte(`retratos/${c.id}_normal`) }),
        el('div', {}, el('b', {}, c.nome), el('div', { class: 'eq-at' }, `Serviço ${c.servico} · Cozinha ${c.cozinha} · Compras ${c.compras} · Simpatia ${c.simpatia}`), el('div', { class: 'eq-hab' }, `Taxa de contratação: Cr$ ${Equipe.taxaContratacao(c)}`)),
        el('div', { class: 'eq-bts' }, ['salao', 'cozinha', 'compras'].map(k => el('button', { class: 'botao' + (Equipe.vagasLivres(p, k) > 0 ? '' : ' desligado'), onclick: ev => { ev.stopPropagation();
          const tx = Equipe.taxaContratacao(c), r = Equipe.contratar(p, i, k, G.dinheiro);
          if (r === 'dinheiro') { avisar(`A taxa de contratação é Cr$ ${tx}.`); return; }
          if (r === 'ok') { G.dinheiro -= tx; hudSujo(); sons.tocar('feito', 1, 0.03, -4); avisar(`${c.nome} vai trabalhar na ${Equipe.POSTOS[k].toLowerCase()}!`); desenha(); }
          else avisar('Não tem vaga nesse posto (a fama abre mais).'); } }, Equipe.POSTOS[k]))))));
      caixa.append(cl);
    }
    // Anunciar.
    caixa.append(el('div', { class: 'cad-sub' }, p.anuncio ? `Anúncio feito: ${Equipe.ANUNCIOS[p.anuncio].nome}. Os candidatos aparecem amanhã.` : 'Pôr anúncio (os candidatos aparecem amanhã)'));
    const temVaga = ['salao', 'cozinha', 'compras'].some(k => Equipe.vagasLivres(p, k) > 0);
    if (!p.anuncio && !temVaga) caixa.append(el('div', { class: 'rodape', style: 'text-align:left' }, 'Sem vaga agora: a fama abre mais.'));
    if (!p.anuncio && temVaga) caixa.append(el('div', { class: 'eq-anuncios' }, Object.entries(Equipe.ANUNCIOS).map(([k, a]) => el('button', { class: 'botao eq-anuncio', onclick: ev => { ev.stopPropagation();
      if (G.dinheiro < a.preco) { avisar(`${a.nome} custa Cr$ ${a.preco}.`); return; }
      G.dinheiro -= a.preco; Equipe.anunciar(p, k); sons.tocar('moedas', 1, 0.05, -6); hudSujo(); desenha(); } },
      spr('ui/' + { cartaz: 'cartaz_padaria', radio: 'radio_anuncio', jornal: 'jornal_anuncio' }[k]) ? el('img', { src: urlArte(`ui/${{ cartaz: 'cartaz_padaria', radio: 'radio_anuncio', jornal: 'jornal_anuncio' }[k]}`) }) : null,
      el('div', {}, el('b', {}, a.nome), el('div', { class: 'eq-at' }, `Cr$ ${a.preco} · ${k === 'cartaz' ? 'gente da Vila' : k === 'radio' ? 'gente melhor' : 'os melhores'}`))))));
    caixa.append(el('div', { style: 'text-align:right;margin-top:10px' }, el('button', { class: 'botao forte', onclick: ev => { ev.stopPropagation(); fecharModal(); } }, 'Fechar')));
  };
  desenha();
  abrirModal(caixa);
  sons.tocar('abrir', 1, 0.03, -6);
  return true;
}
