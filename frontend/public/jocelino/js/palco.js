// Jocelino — palco.js — a Pensão da Rosa aberta, vista de lado em tela cheia, como o sushi bar do Bancho (Dave the
// Diver): um palco fixo de 1920×1080 px de mundo. Atrás, o salão (de dia ou de noite, com a hora); a cozinha da Rosa à direita com o passe; o
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
  // (14/10, Tarefa D1) A bancada do passe (a melhoria): no chão, à esquerda do passe, na frente da ponta do balcão; os pratos 5 e 6
  // do passe ficam em cima dela (vagas). A máquina de refresco: na parede atrás da ponta direita do balcão (pé no rodapé, y 760).
  BANCADA: { cx: 1239, base: 905, escala: 1, topo: 814, vagas: [1222, 1258], area: { x: 1193, y: 795, w: 92, h: 112 } },
  MAQUINA: { cx: 1276, base: 760 },
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
  pequeno: (({ ASSENTOS, BEBEDOURO, PASSE, PASSE_AREA, BACIA, LIXO, FARINHEIRA, BALCAO_ARTE, TOALHA_W, ROSA_PASSE, RITINHA_X, CASA_ZE, CASA_AJUDANTE, BANCADA, MAQUINA }) =>
    ({ ASSENTOS, BEBEDOURO, PASSE, PASSE_AREA, BACIA, LIXO, FARINHEIRA, BALCAO_ARTE, TOALHA_W, ROSA_PASSE, RITINHA_X, CASA_ZE, CASA_AJUDANTE, BANCADA, MAQUINA }))(PALCO),
  grande: {
    ASSENTOS: [400, 537, 674, 811, 948, 1085, 1222, 1359].map(x => ({ x, y: 856 })),
    BEBEDOURO: { x: 372, y: 774, w: 84, h: 126, escala: 0.42 },
    PASSE: { cx: 1597, base: 905, escala: 0.8, topo: 832, vagas: [1545, 1579, 1612, 1646] },
    PASSE_AREA: { x: 1525, y: 790, w: 145, h: 118 },
    BACIA: { x: 464, y: 825, w: 64, h: 80, escala: 1 },
    LIXO: { x: 534, y: 842, w: 39, h: 60, escala: 1 },
    FARINHEIRA: { x: 1440, y: 730, w: 70, h: 62, cx: 1475, base: 786, escala: 0.36 },
    BANCADA: { cx: 1489, base: 905, escala: 0.8, topo: 828, vagas: [1475, 1503], area: { x: 1452, y: 815, w: 73, h: 92 } },
    MAQUINA: { cx: 1290, base: 760 },
    BALCAO_ARTE: 'balcao_grande', TOALHA_W: 1240, ROSA_PASSE: 1600, RITINHA_X: 630, CASA_ZE: 600, CASA_AJUDANTE: 1480,
  },
};
function aplicaLayoutPalco() { Object.assign(PALCO, LAYOUT_PALCO[typeof temAmpliacao === 'function' && temAmpliacao('salao_maior') ? 'grande' : 'pequeno']); }
const noPalco = () => !!(G.mapa && G.mapa.palco);
ATUALIZADORES.push(() => { if (noPalco()) aplicaLayoutPalco(); });
ATUALIZADORES.push(() => document.body.classList.toggle('no-palco', noPalco()));
// (E8 das encomendas de festa) Na noite da festa, até a conta da turma, os avisos mudam de lugar na tela baixa (estilo.css,
// body.festa-turma): no alto da parede da 960 eles cobriam a ponta da turma. Com a ponta posta (17h45, a toalha), só os 2 últimos
// aparecem (body.festa-ponta); na abertura (17h) ainda não: o aviso da festa sai junto com outros dois e não pode ficar escondido.
ATUALIZADORES.push(() => { const e = noPalco() && G.turno && G.turno.encomenda && !G.turno.encomenda.saiu ? G.turno.encomenda : null;
  document.body.classList.toggle('festa-turma', !!e); document.body.classList.toggle('festa-ponta', !!(e && e.reservou)); });
const noSalaoDaPensao = () => G.mapaId === 'pensao_dentro' || G.mapaId === 'pensao_palco';
// (13/10, o tema do restaurante) Dentro do salão (o palco e o salão da reforma) as caixas do restaurante vestem a lousa de giz e
// madeira, como a pele única das telas do Bancho; fora dele nada muda. body.tema-salao pinta o selo da fama e os avisos; ao abrir
// uma janela (ui.js, abrirModal) a caixa do restaurante ganha a classe .lousa e os botões dela viram tábuas (estilo.css).
// As telas pessoais do Jocelino (mochila, Caderneta, mapa, opções) ficam de fora, como o celular do Dave.
const CAIXAS_DO_SALAO = '.placa, .equipe, .melhorias, .metas, .fechamento, .painel-pensao, .ampliacao, .concurso, .caderno, .calendario-pensao';
function marcaTemaDoSalao() { const sim = noSalaoDaPensao(); document.body.classList.toggle('tema-salao', sim); return sim; }
function vesteDoSalao(caixa) {
  if (!marcaTemaDoSalao() || !caixa || !caixa.matches || !caixa.matches(CAIXAS_DO_SALAO)) return;
  caixa.classList.add('lousa');
  caixa.classList.remove('com-arte');   // o caderno troca o papel desenhado pela lousa
}
// (tarefa 6) A lousa que passa só uns poucos px do teto (92vh) cresce o que falta, em vez de mostrar a barrinha de rolar por quase
// nada (o fechamento passava 1 px); quando sobra de verdade (mais de 40 px), rola como antes. Refaz a conta quando a caixa redesenha.
const FOLGA_LOUSA = 40;
function folgaDaLousa(caixa) {
  // (C5, 16/10) a janela com rodapé fixo (.com-pe) não rola por inteiro (só o miolo); e a folga nunca passa do teto da tela (a lousa
  // de 92vh + 40 px saía da 960x540 e cortava o botão de baixo)
  if (!caixa || !caixa.classList || !caixa.classList.contains('lousa') || caixa.classList.contains('caderno') || caixa.classList.contains('com-pe')) return;
  const ajusta = () => { if (!caixa.isConnected) return; caixa.style.maxHeight = '';
    const s = caixa.scrollHeight - caixa.clientHeight; if (s > 0 && s <= FOLGA_LOUSA) caixa.style.maxHeight = `min(calc(92vh + ${s + 1}px), calc(100vh - 24px))`; };
  let pedido = false;
  ajusta(); new MutationObserver(() => { if (pedido) return; pedido = true; requestAnimationFrame(() => { pedido = false; ajusta(); }); }).observe(caixa, { childList: true, subtree: true, characterData: true });
}
ATUALIZADORES.push(() => marcaTemaDoSalao());
// A pensão aberta (ou pronta para abrir) usa o palco; na reforma, o salão antigo de cima.
const pensaoNoPalco = () => !!G.pensao && ['aberta', 'pronta'].includes(G.pensao.estado);

// Uma camada de arte (a/salao/<nome>) no canto (x, y), na altura de desenho yOrdem.
function camadaPalco(nome, x, y, yOrdem, escala = 1) {
  return { tipo: 'camada', y: yOrdem, desenha(ctx) { const img = spr('salao/' + nome); if (img) ctx.drawImage(img, x, y, larguraArte(img) * escala, alturaArte(img) * escala); } };   // (arte ampliada: a densidade, arte.js)
}

// (14/10, o jogador: "está de dia e o fundo está de noite na janela") Como o sushi bar do Dave, o salão tem a luz da hora: de dia
// (a reforma, a manhã, a despensa) o fundo de dia, com o sol e os barquinhos na janela; ao entardecer, o de noite entra por cima
// acompanhando a escuridão (cenarioNoiteAlfa, mapas.js). A janta é a cena da noite: das 17h, com o turno, com o quadro da
// abertura esperando o cardápio ou depois da janta de hoje, o de noite vale inteiro, mesmo com a escuridão do relógio ainda baixa.
function palcoNaNoite() {
  if (G.turno) return true;
  const p = G.pensao; if (!p || G.minutos < TurnoJanta.ABRE) return false;
  return p.ultimaJanta === G.dia || (typeof jantaEsperaCardapio === 'function' && jantaEsperaCardapio());
}

MAPAS_DEF.pensao_palco = () => {
  const b = new Construtor('pensao_palco', 40, 23, 1);
  Object.assign(b, { palco: true, dentro: true, cenario: 'salao/fundo_dia', cenarioNoite: 'salao/fundo_noite', enquadramento: { x: 0, y: 0, w: PALCO.LARG, h: PALCO.ALT } });
  spr(b.cenario); spr(b.cenarioNoite);   // (já começam a carregar; sem a de dia, fica a de noite)
  b.livre = { x: 6, y: PALCO.LINHA_CHAO, w: 29, h: 1 };
  b.inicio = { x: 8, y: PALCO.LINHA_CHAO };
  b.saida(6, PALCO.LINHA_CHAO, 1, 1, 'vila', 15, 9);
  const P = PALCO;
  b.objs.push(
    { tipo: 'camada', y: 300, desenha(ctx) { const n = typeof Melhorias !== 'undefined' && G.pensao ? Melhorias.nivel(G.pensao, 'fogao_4bocas') : 0;
      const img = spr(n >= 2 ? 'salao/fogao_industrial' : n === 1 ? 'salao/cozinha_melhor' : 'salao/cozinha'); if (img) ctx.drawImage(img, P.COZINHA.x, P.COZINHA.y, larguraArte(img), alturaArte(img)); } },   // (densidade: arte.js)
    camadaPalco('passa_prato', P.PASSA.x, P.PASSA.y, 400),
    { tipo: 'camada', y: P.TAMPO_Y + 80, desenha(ctx) { const img = spr('salao/' + P.BALCAO_ARTE); if (img) ctx.drawImage(img, P.BALCAO.x, P.BALCAO.y, larguraArte(img), alturaArte(img)); } },
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
// (14/10, a rotatividade, o Dave: o cliente entra no salão andando e senta; ao terminar, levanta e sai andando) Entrando
// ('chegando'), ele anda da porta da esquerda (atrás da planta da frente) até a banqueta, na linha dos assentos (o balcão cobre da
// cintura para baixo); quem saiu da banqueta (pagou, cansou, a louça) anda de volta até a porta e some. A folha é a de andar dele.
// A frase curta de cada freguês de fora (clientes_avulsos.js), dita no primeiro clique da noite: de onde vem e o que sente ao
// chegar, sem sotaque nem estereótipo. (14/10, Tarefa E1) A frase combina com o jeito dele (clientes_avulsos.js): o apressado tem
// pressa, o paciente espera, o exigente avisa que repara e o generoso chega comemorando.
const FALAS_AVULSOS = {
  cliente_hiroshi: 'Vim lá da Liberdade só para provar o tempero da Rosa. Espero que esteja à altura.',
  cliente_jorge: 'Desci de Santos com a turma e o ônibus volta já. Capricha na pressa!',
  cliente_dandara: 'Me falaram desta pensão lá em São Vicente. Hoje é dia de comemorar!',
  cliente_severiano: 'Comida feita com capricho me lembra a minha terra. Pode fazer sem pressa.',
  cliente_greta: 'Estou conhecendo o litoral, tenho a noite toda. Que lugar simpático!',
  cliente_dona_pina: 'Lá na Mooca eu cozinho para a família inteira. Vamos ver se o tempero daqui é bom mesmo.',
  cliente_caicara: 'Vim da Ilha Comprida com uma fome danada. Sai rapidinho?',
  cliente_ana: 'Tenho prova amanhã cedo: janto rapidinho e volto para os livros.',
  cliente_benedito: 'Faz tempo que eu não janto fora. Sem pressa, meu filho, eu espero.',
  cliente_luana: 'Depois do mar, um prato quente cai bem! Hoje eu deixo um agrado.',
};
// (Tarefa E1) O jeito do freguês de fora para o texto: { nome, dica } (o nome concorda com ele ou ela), ou null.
function jeitoDoAvulso(c) {
  const J = c && c.jeito && typeof JEITOS_AVULSO !== 'undefined' ? JEITOS_AVULSO[c.jeito] : null; if (!J) return null;
  const a = typeof CLIENTES_AVULSOS !== 'undefined' ? CLIENTES_AVULSOS.find(x => x.id === c.id) : null;
  const nome = a && a.sexo === 'm' ? J.nome.replace(/o$/, 'a') : J.nome;
  return { nome, dica: J.dica.replace('{estrelas}', TurnoJanta.jeito(c).estrelasGorjeta || 5) };
}
// O ícone discreto do jeito, ao lado do balão de quem espera (a arte do JEITOS_AVULSO; o paciente não tem).
function desenhaJeito(ctx, m, x, y) {
  const J = m.cliente.jeito && typeof JEITOS_AVULSO !== 'undefined' ? JEITOS_AVULSO[m.cliente.jeito] : null;
  if (!J || !J.icone) return;
  desenhaPe(ctx, J.icone, x - 62, y + 14 + Math.sin((G.agora || 0) * 3 + x) * 1.5, 0.92, J.escala);
}
const CLIENTE_PORTA_X = 130, CLIENTE_VEL = 190;   // onde a porta do salão fica (px de mundo) e o passo do freguês (px/s)
const CLIENTES_SAINDO = [];
TurnoJanta.prototype.tempoAndar = function (i) {
  if (!noPalco() || !PALCO.ASSENTOS[i]) return 0;
  return Math.abs(PALCO.ASSENTOS[i].x - CLIENTE_PORTA_X) / CLIENTE_VEL;
};
// (E4a) A ponta da turma da festa são as banquetas de x menor (perto da porta): o x de verdade de cada banqueta no palco.
TurnoJanta.prototype.xDaBanqueta = function (i) { return PALCO.ASSENTOS[i] ? PALCO.ASSENTOS[i].x : i; };
function clientesDoPalco(b) {
  const t = G.turno;
  if (!t) { b._clientes = []; CLIENTES_SAINDO.length = 0; return []; }
  const antes = b._clientes || [];
  b._clientes = t.mesas.map((m, i) => {
    if (!['chegando', 'pedido', 'prato', 'comendo'].includes(m.estado) || i >= PALCO.ASSENTOS.length) return null;
    const A = PALCO.ASSENTOS[i], ja = antes[i];
    const p = ja && ja.id === m.cliente.id ? ja : new Personagem(m.cliente.id, m.cliente.nome, m.estado === 'chegando' ? CLIENTE_PORTA_X : A.x, A.y, DIR.BAIXO);
    if (m.estado === 'chegando') {
      const f = m.andaTotal > 0 ? clamp(1 - m.anda / m.andaTotal, 0, 1) : 1;
      p.x = lerp(CLIENTE_PORTA_X, A.x, f); p.y = A.y - 1; p.andando = true; p.dir = A.x >= CLIENTE_PORTA_X ? DIR.DIREITA : DIR.ESQUERDA; p.giro = 0;
      return p;
    }
    p.x = A.x; p.andando = false; p.dir = DIR.BAIXO; p.giro = giroDesgosto(i);   // (14/10) incomodado com a louça: balança a cabeça
    p.y = A.y - (m.estado === 'comendo' ? Math.abs(Math.sin(G.agora * 7 + i)) * 3 : 0);   // nunca passa da linha do balcão
    return p;
  });
  // Quem estava e não está mais (ou deu lugar a outro): levanta e sai andando até a porta.
  antes.forEach((p, i) => { if (p && (!b._clientes[i] || b._clientes[i] !== p) && !CLIENTES_SAINDO.includes(p)) { p.giro = 0; p.andando = true; p.dir = DIR.ESQUERDA; p.y = PALCO.ASSENTOS[0].y - 1; CLIENTES_SAINDO.push(p); } });
  return b._clientes.filter(Boolean).concat(CLIENTES_SAINDO);
}
ATUALIZADORES.push(dt => {
  if (!CLIENTES_SAINDO.length) return;
  if (!noPalco() || !G.turno) { CLIENTES_SAINDO.length = 0; return; }
  for (const p of CLIENTES_SAINDO) { p.t += dt; p.x -= CLIENTE_VEL * dt; }
  for (let k = CLIENTES_SAINDO.length - 1; k >= 0; k--) if (CLIENTES_SAINDO[k].x <= CLIENTE_PORTA_X) CLIENTES_SAINDO.splice(k, 1);
});
// O passo da folha de andar de quem entra (o Personagem só conta o tempo quando vagueia; aqui ele anda pelo turno).
ATUALIZADORES.push(dt => { const b = G.mapa; if (!G.turno || !b || !b._clientes) return; for (const p of b._clientes) if (p && p.andando) p.t += dt; });
const camadaViva = (y, desenha) => ({ tipo: 'camada', y, desenha });
// (13/10, o Dave) Os convidados da festa com o enfeite do tema na cabeça (o Dave: eles brilham), e o brilho verde de quem
// ganhou a bebida na medida (o Dave: a aura do chá bem servido). O enfeite e o carimbo são arte do Higgsfield; o brilho é luz.
const ENFEITE_FESTA = { 'Noite do PF em Dobro': ['enfeite_pf', 18], 'Festa do Peixe Frito': ['enfeite_peixe', 18], 'Arraiá da Pensão': ['enfeite_arraia', 16],
  'Noite dos Doces da Vó': ['enfeite_doces', 9], 'Jogo do Santos na Rádio': ['enfeite_santos', 22], '': ['enfeite_festa', 5] };
const CABECA_CLIENTE = 160;   // do pé do cliente ao alto da cabeça, no palco (o quadro de 114 px em escala 1,65)
// (E4a das encomendas de festa) O enfeite da ocasião na cabeça da turma (a arte da E6, salao/enfeite_*): o ENCAIXE de cada um, em px
// da base do enfeite abaixo do topo da cabeça (medido para a cabeça mediana, CABECA_CLIENTE). Sem a arte da ocasião, o genérico.
const ENFEITE_OCASIAO = { 'salao/enfeite_aniversario': 7, 'salao/enfeite_batizado': 9, 'salao/enfeite_bodas': 28, 'salao/enfeite_casamento': 9,
  'salao/enfeite_capacete': 18, 'salao/enfeite_malandro': 20, 'salao/enfeite_palha': 20, 'salao/enfeite_couro': 16, 'salao/enfeite_pescador': 18,
  'salao/enfeite_time': 37, 'salao/enfeite_festa': 5 };
// O enfeite de quem está na banqueta: [arte, encaixe] (a turma da festa encomendada, os convidados da festa do tema) ou null.
function enfeiteDoCliente(t, m) {
  if (m.cliente.turma && t.encomenda) { const a = t.encomenda.enfeite in ENFEITE_OCASIAO ? t.encomenda.enfeite : 'salao/enfeite_festa'; return [a, ENFEITE_OCASIAO[a]]; }
  const E = m.cliente.convidado && ENFEITE_FESTA[t.festa || ''];
  return E ? ['salao/' + E[0], E[1]] : null;
}
// O quanto o balão (e a barrinha da paciência) sobe para não tapar o enfeite: o que o enfeite passa da cabeça, menos a folga que já
// havia entre a cabeça e a barrinha.
function folgaDoEnfeite(t, m) {
  const E = t && m && m.cliente ? enfeiteDoCliente(t, m) : null, img = E && spr(E[0]);
  return img ? Math.max(0, Math.round(alturaArte(img) - E[1] - 14)) : 0;
}
function desenhaEnfeitesEBrilho(ctx) {
  const t = G.turno, b = G.mapa; if (!t || !b || !b._clientes) return;
  t.mesas.forEach((m, i) => {
    const p = b._clientes[i]; if (!p) return;
    if (m.aura > 0 && MODO_TESTE.efeitos) {   // (modo de teste: sem o brilho; a aura continua no estado)
      const y = p.y - CABECA_CLIENTE + 60, r = 95, a = Math.min(1, m.aura / 1.5) * 0.4, g = ctx.createRadialGradient(p.x, y, 0, p.x, y, r);
      g.addColorStop(0, `rgba(130,255,150,${a})`); g.addColorStop(1, 'rgba(130,255,150,0)');
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(p.x - r, y - r, r * 2, r * 2); ctx.restore();
    }
    const E = enfeiteDoCliente(t, m);
    p._enfeite = E;   // (E4a) o enfeite vai junto quando ele levanta e sai andando até a porta
    if (E) desenhaPe(ctx, E[0], p.x, p.y - CABECA_CLIENTE + E[1], 1, 1);
  });
  for (const p of CLIENTES_SAINDO) if (p._enfeite) desenhaPe(ctx, p._enfeite[0], p.x, p.y - CABECA_CLIENTE + p._enfeite[1], 1, 1);
}
// O carimbo da bebida servida (o Dave: a nota aparece na tela): "NA MEDIDA!" (PERFEITA), "QUASE!" (BOA) ou, desde a Tarefa C,
// "DERRAMOU!" (RUIM); bate grande e assenta, depois some. nota: 'medida', 'ok' ou 'ruim' (true/false valem como 'medida'/'ok').
const CARIMBOS_PALCO = [];
const ARTE_CARIMBO = { medida: 'ui/carimbo_medida', ok: 'ui/carimbo_quase', ruim: 'ui/carimbo_derramou' };
function carimboBebida(i, nota) {
  const A = PALCO.ASSENTOS[i]; if (!A) return;
  const q = nota === true ? 'medida' : ARTE_CARIMBO[nota] ? nota : 'ok';
  // (Tarefa E2) a caipirinha RUIM não derramou: desandou (o carimbo DESANDOU!)
  const caipi = q === 'ruim' && G.turno && G.turno.mesas[i] && G.turno.mesas[i].bebida === 'caipirinha';
  CARIMBOS_PALCO.push({ x: A.x, y: A.y - 240, arte: caipi ? 'ui/carimbo_desandou' : ARTE_CARIMBO[q], nota: q, t: 0 });
  if (q === 'medida' && G.turno && G.turno.mesas[i]) G.turno.mesas[i].aura = 6;
}
ATUALIZADORES.push(dt => {
  for (const c of CARIMBOS_PALCO) c.t += dt;
  for (let k = CARIMBOS_PALCO.length - 1; k >= 0; k--) if (CARIMBOS_PALCO[k].t > 1.6) CARIMBOS_PALCO.splice(k, 1);
  if (G.turno) for (const m of G.turno.mesas) if (m.aura > 0) m.aura -= dt;
});
// (14/10, o jogador: "sons de que a pessoa está gostando da comida"; o Dave mostra corações em cima de quem gostou) Quem prova o
// prato e gosta (4★ ou mais, prato certo) solta dois corações que sobem da cabeça e somem; o "huum, delícia!" é o som do evento
// 'servido' (somDoEvento, sons.js). O coração é a arte fx/coracao; o código só sobe e apaga.
const CORACOES_PALCO = [], CORACAO_DURA = 1.6;
function coracaoNoPalco(i) {
  const A = PALCO.ASSENTOS[i]; if (!A) return;
  const y = A.y - CABECA_CLIENTE - 10;
  CORACOES_PALCO.push({ x: A.x - 14, y, t: 0, mesa: i }, { x: A.x + 16, y: y + 8, t: -0.25, mesa: i });
}
ATUALIZADORES.push(dt => {
  for (const c of CORACOES_PALCO) c.t += dt;
  for (let k = CORACOES_PALCO.length - 1; k >= 0; k--) if (CORACOES_PALCO[k].t > CORACAO_DURA || !noPalco()) CORACOES_PALCO.splice(k, 1);
});
function desenhaCoracoesPalco(ctx) {
  for (const c of CORACOES_PALCO) { if (c.t < 0) continue;
    const k = c.t / CORACAO_DURA;
    desenhaFx(ctx, 'coracao', c.x + Math.sin(c.t * 6) * 5, c.y - k * 70, { alfa: Math.min(1, (1 - k) * 2), escala: 1 + k * 0.3 }); }
  for (const c of NOTAS_PALCO) { if (c.t < 0) continue;
    const k = c.t / NOTA_DURA;
    desenhaFx(ctx, 'nota_musical', c.x + Math.sin(c.t * 4 + c.x) * 9, c.y - k * 110, { alfa: Math.min(1, (1 - k) * 2), escala: 1.5 + k * 0.4, ang: Math.sin(c.t * 5) * 0.2 }); }
}
// ---- (E4a das encomendas de festa, spec 3.4) A ponta da turma e o momento da festa.
// O momento: quando o anfitrião recebe o prato (o evento 'festa_turma' do turno, guardado em t.encomenda.momento), sobem as notas
// (fx/nota_musical) e os corações sobre a ponta, e toca o rojão das noites de festa. Arte do Higgsfield; o código só sobe e apaga.
const NOTAS_PALCO = [], NOTA_DURA = 2.4;
ATUALIZADORES.push(dt => {
  for (const c of NOTAS_PALCO) c.t += dt;
  for (let k = NOTAS_PALCO.length - 1; k >= 0; k--) if (NOTAS_PALCO[k].t > NOTA_DURA || !noPalco()) NOTAS_PALCO.splice(k, 1);
  const t = G.turno, e = t && t.encomenda;
  if (!e || !e.momento || e._festejou || !noPalco()) return;
  e._festejou = true;
  e.ponta.forEach((i, k) => {
    const A = PALCO.ASSENTOS[i]; if (!A) return;
    NOTAS_PALCO.push({ x: A.x - 30, y: A.y - CABECA_CLIENTE - 30, t: -k * 0.18 }, { x: A.x + 34, y: A.y - CABECA_CLIENTE - 10, t: -k * 0.18 - 0.45 });
    if (t.mesas[i] && t.mesas[i].cliente.turma) coracaoNoPalco(i);
  });
  if (typeof tocarSomDoEvento === 'function') tocarSomDoEvento({ tipo: 'inauguracao' });
});
// A toalha de festa cobre o trecho da ponta, do canto do balcão (282, 790) até a última banqueta reservada: a de 2 banquetas, a de 4,
// ou duas toalhas lado a lado (a de 2 por cima da emenda) quando a ponta não bate com nenhuma. Só posiciona a arte da E6.
const TOALHA_FESTA = { x: 282, y: 790, sobra: 62, folga: 45 };
function toalhasDaPonta(k) {
  const A = PALCO.ASSENTOS[Math.max(0, k - 1)]; if (!A || k <= 0) return [];
  const T = TOALHA_FESTA, fim = A.x + T.sobra, w2 = 283, w4 = 600;
  if (fim <= T.x + w2 + T.folga) return [['salao/toalha_festa_2', T.x]];
  if (Math.abs(fim - (T.x + w4)) <= T.folga) return [['salao/toalha_festa_4', T.x]];
  if (fim < T.x + w4) return [['salao/toalha_festa_2', fim - w2], ['salao/toalha_festa_2', T.x]];
  return [['salao/toalha_festa_4', T.x], ['salao/toalha_festa_2', fim - w2]];
}
// A plaquinha de madeira (ui/madeira/plaquinha_nome, em 9 pedaços: as bordas numa escala fixa, o miolo esticado, como o border-image
// do estilo.css) com o texto em letra de giz, em duas linhas ("Reservado:" e o nome), grande o bastante para ler na tela de 960. O
// texto é fonte, não desenho.
const PLAQUINHA_TURMA = { x: 290, y: 794, escala: 0.8, borda: [30, 36], letra: 27, entre: 25, pad: 6 };
function desenhaPlaquinhaTurma(ctx, linhas) {
  const img = spr('ui/madeira/plaquinha_nome'); if (!img) return null;
  const P = PLAQUINHA_TURMA, [bv, bh] = P.borda, dv = bv * P.escala, dh = bh * P.escala, W = img.naturalWidth, H = img.naturalHeight;
  ctx.save();
  ctx.font = `400 ${P.letra}px 'Gochi Hand', Fredoka, cursive`;
  const w = Math.max(2 * dh + 4, Math.ceil(Math.max(...linhas.map(l => ctx.measureText(l).width)) + 2 * (dh * 0.45 + P.pad)));
  const h = Math.max(2 * dv + 2, Math.round(P.entre * linhas.length + 2 * (P.pad + 4))), x = P.x, y = P.y;
  const sx = [0, bh, W - bh, W], sy = [0, bv, H - bv, H], dx = [x, x + dh, x + w - dh, x + w], dy = [y, y + dv, y + h - dv, y + h];
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
    const sw = sx[a + 1] - sx[a], sh = sy[b + 1] - sy[b], ww = dx[a + 1] - dx[a], hh = dy[b + 1] - dy[b];
    if (sw > 0 && sh > 0 && ww > 0 && hh > 0) ctx.drawImage(img, sx[a], sy[b], sw, sh, dx[a], dy[b], ww, hh);
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(40,22,8,.9)'; ctx.fillStyle = '#f6f1e1';
  linhas.forEach((l, k) => { const ly = y + h / 2 + (k - (linhas.length - 1) / 2) * P.entre + 1; ctx.strokeText(l, x + w / 2, ly); ctx.fillText(l, x + w / 2, ly); });
  ctx.restore();
  return { x, y, w, h };
}
const PONTA_NA_TELA = { toalhas: [], plaquinha: null, bolo: null, texto: '' };   // o que saiu no último quadro (os testes conferem)
function desenhaPontaDaTurma(ctx) {
  const t = G.turno, e = t && t.encomenda;
  PONTA_NA_TELA.toalhas = []; PONTA_NA_TELA.plaquinha = null; PONTA_NA_TELA.bolo = null; PONTA_NA_TELA.texto = '';
  if (!e || !e.reservou || e.saiu || !e.ponta.length) return;
  const T = TOALHA_FESTA;
  for (const [nome, x] of toalhasDaPonta(e.ponta.length)) { const a = spr(nome); if (a) ctx.drawImage(a, x, T.y, larguraArte(a), alturaArte(a)); PONTA_NA_TELA.toalhas.push([nome, x]); }
  // o bolo com as velinhas, no aniversário: no tampo, entre o anfitrião e o vizinho dele
  if (e.enfeite === 'salao/enfeite_aniversario') {
    const A = PALCO.ASSENTOS[e.ponta[0]], B = PALCO.ASSENTOS[e.ponta[1] != null ? e.ponta[1] : e.ponta[0]];
    if (A && B) { const x = B === A ? A.x + 70 : (A.x + B.x) / 2; desenhaPe(ctx, 'salao/bolo_festa', x, PALCO.LOUCA.base, 1, 1); PONTA_NA_TELA.bolo = { x, y: PALCO.LOUCA.base }; }
  }
  // (revisão da E4a, na E4b) as porções da reserva que ainda restam, em letra de giz ("Dona Zélia · 3 porções")
  const n = t.reserva ? Math.max(0, t.reserva.porcoes | 0) : 0, nome = e.nome + (n ? ` · ${n} ${n === 1 ? 'porção' : 'porções'}` : '');
  PONTA_NA_TELA.texto = `Reservado: ${nome}`;
  PONTA_NA_TELA.plaquinha = desenhaPlaquinhaTurma(ctx, ['Reservado:', nome]);
}
// (14/10, o jogador: "tem hora que a bancada tá suja e a pessoa senta, faça uma imagem de 'desgosto' por causa da sujeira"; o Dave
// mostra a carinha de insatisfação em cima da cabeça de quem se incomoda) Enquanto o freguês está incomodado, o balão fx/desgosto
// (a carinha de nojo com as linhas verdes de mau cheiro) fica em cima da cabeça dele, com um pulinho de escala na entrada e um
// balanço leve, e ele balança a cabeça (o giro pequeno da camada dele, Personagem.giro). Incomodado: sentado do lado da louça suja
// lendo o cardápio (os LENDO_LOUCA s); ou, por DESGOSTO_CHEIRO s, o cheiro do Seu Lourival na banqueta do lado (a reação 'nojo').
// Some quando a louça é recolhida, quando ele vai embora e quando é atendido (comendo). Em cima da louça suja que ficou no balcão,
// a moscazinha (fx/mosca_1 e _2, as asas) voa em zigue-zague. A arte é do Higgsfield; o código só posiciona, gira, escala e apaga.
const DESGOSTO_PALCO = [], DESGOSTO_CHEIRO = 2.5, DESGOSTO_POP = 0.28;
const incomodadoPelaLouca = m => !!m && m.louca && m.estado === 'pedido' && m.lendo > 0;
function incomodado(i) {
  const t = G.turno, m = t && t.mesas[i], D = DESGOSTO_PALCO[i]; if (!m) return false;
  return incomodadoPelaLouca(m) || (!!D && D.cheiro > 0 && (m.estado === 'pedido' || m.estado === 'prato'));
}
// A reação 'nojo' (o cheiro do vizinho): o balão por DESGOSTO_CHEIRO s. A da louça não conta aqui: fica enquanto a louça estiver lá.
function desgostoNoPalco(i) {
  const t = G.turno, m = t && t.mesas[i]; if (!m || m.louca || i >= PALCO.ASSENTOS.length) return;
  const D = DESGOSTO_PALCO[i] || (DESGOSTO_PALCO[i] = { id: m.cliente.id, t: 0, cheiro: 0, vis: false });
  D.id = m.cliente.id; D.cheiro = DESGOSTO_CHEIRO;
}
ATUALIZADORES.push(dt => {
  const t = G.turno;
  if (!t || !noPalco()) { DESGOSTO_PALCO.length = 0; return; }
  t.mesas.forEach((m, i) => {
    let D = DESGOSTO_PALCO[i];
    if (!D || D.id !== m.cliente.id) D = DESGOSTO_PALCO[i] = { id: m.cliente.id, t: 0, cheiro: 0, vis: false };   // outro freguês na banqueta
    if (D.cheiro > 0) D.cheiro -= dt;
    if (incomodado(i)) { D.t = D.vis ? D.t + dt : 0; D.vis = true; } else { D.vis = false; D.t = 0; D.cheiro = 0; }
  });
});
// O balanço de cabeça de quem está incomodado (rad): sacode uns 0,6 s, para, sacode de novo.
function giroDesgosto(i) {
  const D = DESGOSTO_PALCO[i]; if (!D || !D.vis) return 0;
  const c = D.t % 1.6; return c < 0.6 ? Math.sin(c * 28) * 0.05 * (1 - c / 0.6) : 0;
}
function desenhaDesgostoPalco(ctx) {
  const t = G.turno; if (!t) return;
  t.mesas.forEach((m, i) => {
    const D = DESGOSTO_PALCO[i]; if (!D || !D.vis || i >= PALCO.ASSENTOS.length) return;
    const A = PALCO.ASSENTOS[i], y = A.y - 114 * PALCO.ESCALA_GENTE - 34 - folgaDoEnfeite(t, m);   // (E4a) acima do enfeite
    // lendo o cardápio, no lugar do "..."; esperando o prato (o cheiro), ao lado do balão do pedido
    const x = m.estado === 'pedido' ? A.x : A.x - 50, yb = m.estado === 'pedido' ? y - 12 : y - 26;
    const k = Math.min(1, D.t / DESGOSTO_POP), pop = k < 1 ? 0.3 + 0.7 * k + Math.sin(k * Math.PI) * 0.35 : 1;   // o pulinho da entrada
    desenhaFx(ctx, 'desgosto', x, yb + Math.sin(D.t * 4) * 2, { escala: pop, ang: Math.sin(D.t * 3.2) * 0.1, alfa: Math.min(1, k * 2) });
  });
}
// A moscazinha em cima da louça suja do balcão (a de quem já foi e a do lado de quem sentou): zigue-zague e asas batendo.
const MOSCA = { alto: 30, larg: 30, vel: 0.55 };   // (logo acima do prato sujo: mais alto, ela passava na frente da boca do freguês)
function desenhaMoscasLouca(ctx, i) {
  const A = PALCO.ASSENTOS[i]; if (!A) return;
  const s = (G.agora || 0) * MOSCA.vel + i * 0.37, f = s % 1, tri = f < 0.5 ? f * 4 - 1 : 3 - f * 4;   // vai e volta (o zigue-zague)
  const x = A.x + tri * MOSCA.larg, y = PALCO.LOUCA.base - MOSCA.alto + Math.sin(s * Math.PI * 6) * 5 + Math.sin(s * 11) * 2;
  desenhaFx(ctx, Math.floor((G.agora || 0) * 24) % 2 ? 'mosca_2' : 'mosca_1', x, y, { espelho: f >= 0.5 });
}
function desenhaCarimbosPalco(ctx) {
  for (const c of CARIMBOS_PALCO) desenhaPe(ctx, c.arte, c.x, c.y, c.t > 1.1 ? Math.max(0, 1 - (c.t - 1.1) / 0.5) : 1, c.t < 0.15 ? 1.5 - c.t / 0.15 * 0.8 : 0.7);
}
// A Rosa na cozinha, como o Bancho: mexe a panela o tempo todo (rápido com prato no fogo, devagar e com pausa à toa) e,
// quando um prato fica pronto, anda até o passe, larga o prato e volta para o fogão (quadros de lado da folha de andar dela).
const ROSA_COZ = { x: PALCO.ROSA.x, casa: PALCO.ROSA.x, estado: 'mexe', t: 0, quadro: 0, fila: 0, vistos: 0 };
const ROSA_VEL = 230, ROSA_LARGA = 0.45, ROSA_ESCALA_ANDAR = 1.25;
// (14/10) Enquanto a cozinha está em ruína (reforma antes da etapa "cozinha" acabar), a Rosa não cozinha nem busca prato (no Dave
// o cozinheiro só cozinha com a cozinha montada): fica parada no chão do salão, em frente ao passe, fora da área em ruína,
// olhando para o lado do Jocelino (quadro parado da folha de andar). Estado 'obra'; com a cozinha pronta, volta ao fogão.
const ROSA_OBRA = { x: 1590, y: 960, escala: 1.5 };
const cozinhaDaRosaPronta = () => typeof cozinhaPronta !== 'function' || cozinhaPronta();
const rosaLugar = () => cozinhaDaRosaPronta() ? PALCO.ROSA : ROSA_OBRA;   // o pé da Rosa: { x, y } (o fogão ou o salão em obra)
ATUALIZADORES.push(dt => {
  if (!noPalco()) return;
  const R = ROSA_COZ, t = G.turno;
  if (!cozinhaDaRosaPronta()) { R.estado = 'obra'; R.fila = 0; R.t = 0; R.x = ROSA_OBRA.x; R.lado = -1; R.quadro = 0; return; }
  if (R.estado === 'obra') { R.estado = 'mexe'; R.t = 0; R.x = R.casa; }
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
  if (typeof Historias !== 'undefined' && Historias._h && Historias._ator('rosa')) return;   // (T9) a Rosa da cena saiu da cozinha: a do fogão some
  const R = ROSA_COZ, P = PALCO;
  if (!cozinhaDaRosaPronta() || R.estado === 'obra') {   // em obra: parada no salão (linha 1, coluna 2 da folha = em pé olhando para a esquerda)
    const img = spr('personagens/rosa/andar');
    if (!img) return;
    const w = img.naturalWidth / 4, h = img.naturalHeight / 4, e = ROSA_OBRA.escala / fatorGente(img);   // (folha ampliada: arte.js)
    ctx.drawImage(img, 2 * w, 1 * h, w, h, ROSA_OBRA.x - w * e / 2, ROSA_OBRA.y - h * e, w * e, h * e);
    return;
  }
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
  const w = img.naturalWidth / 4, h = img.naturalHeight / 4, e = ROSA_ESCALA_ANDAR / fatorGente(img);   // (folha ampliada: arte.js)
  const esq = (R.lado || -1) < 0, col = (R.estado === 'volta') === esq ? 3 : 2, lin = R.estado === 'larga' ? 1 : R.quadro % 10;
  ctx.drawImage(img, col * w, lin * h, w, h, R.x - w * e / 2, P.ROSA.y - h * e, w * e, h * e);
}
// (tarefa 6) Os pratos dos nichos: só o que está de fato no cardápio da noite, com as porções (na janta, as da panela; antes de
// abrir, as que o quadro vai fazer). Prato sem panela não aparece (nada de "0" esmaecido), como o cardápio do Bancho na parede.
// (onda final) Antes de abrir, só no dia em que a pensão abre, e com a mesma conta do quadro (em sequência), guardada: refaz só
// quando a despensa, o cardápio ou o dia mudam (não a cada quadro). Na janta, o prato fica no nicho dele: o que acabou continua no
// lugar, marcado "acabou" (o Dave mantém o prato no cardápio da parede, esgotado), e nada desliza.
let _nichosGuardados = { chave: '', lista: [] };
function nichosDoCardapio() {
  const p = G.pensao, t = G.turno; if (!p) return [];
  if (t) {   // a ordem da noite: os pratos na ordem em que entraram na panela; o que acabou fica no lugar
    const ordem = t._nichos || (t._nichos = []);
    for (const id of p.pratosDaNoite()) if (!ordem.includes(id)) ordem.push(id);
    return ordem.slice(0, PALCO.VAGAS.length).map(id => p.porcoes(id) > 0 ? { id, n: p.porcoes(id) } : { id, n: 0, acabou: true });
  }
  if (p.ultimaJanta === G.dia || typeof pensaoAbreHoje !== 'function' || !pensaoAbreHoje()) return [];   // (depois da janta, a sobra foi para o lixo)
  const esc = p.cardapioNoite || {}, chave = JSON.stringify([G.dia, p.despensa, esc, p.receitas.length, p.vagas(), p.panela]);
  if (_nichosGuardados.chave !== chave) {
    const C = contaDoQuadro(p, esc);
    _nichosGuardados = { chave, lista: Object.keys(C.efe).filter(id => C.efe[id] > 0).map(id => ({ id, n: C.efe[id] * p.porcoesPorPanela(id) })).slice(0, PALCO.VAGAS.length) };
  }
  return _nichosGuardados.lista;
}
function camadasDaJanta() {
  const t = G.turno, P = PALCO;
  return [
    // O cardápio da noite nos nichos da parede (o do quadro de giz, 13/10): na janta, as porções na panela; antes de abrir, as
    // porções que o quadro vai fazer; depois da janta, os nichos vazios (a sobra foi para o lixo).
    camadaViva(401, ctx => {
      if (typeof emReforma === 'function' && emReforma()) return;   // na reforma, os nichos vazios
      nichosDoCardapio().forEach(({ id, n, acabou }, k) => {
        const v = P.VAGAS[k];
        if (acabou) {   // (onda final) o prato que acabou: a arte dele em transparência, no mesmo nicho, e a palavra "acabou"
          ctx.save(); ctx.globalAlpha = 0.3; desenhaPrato(ctx, id, v.x, P.PRATO_Y, 1, 1.35); ctx.restore();
          texto(ctx, 'acabou', v.x, P.PRATO_Y + 26, 15, 'rgba(255,255,255,.75)', '800');
          return;
        }
        desenhaPrato(ctx, id, v.x, P.PRATO_Y, 1, 1.35);
        texto(ctx, String(n), v.x, P.PRATO_Y + 26, 18, '#fff', '900');
        if (t && (t.pratoTema === id || (t.reserva && t.reserva.prato === id))) desenhaPe(ctx, 'salao/fita_tema', v.x, 539);   // (E4a) e o prato da festa encomendada
        // (revisão da E4a, na E4b) a reserva da turma fica fora do número do nicho: um "+N" pequeno na fitinha
        if (t && t.reserva && t.reserva.prato === id && t.reserva.porcoes > 0 && t.encomenda && !t.encomenda.saiu) texto(ctx, `+${t.reserva.porcoes}`, v.x + 30, 546, 14, '#ffe3ec', '900');
      });
    }),
    // Por cima dos clientes (856) e por baixo do balcão (858): o enfeite dos convidados e o brilho da bebida na medida.
    camadaViva(857, ctx => desenhaEnfeitesEBrilho(ctx)),
    // (E4a) A ponta da turma da festa encomendada: a toalha de festa por cima da xadrez, o bolo no aniversário e a plaquinha
    // "Reservado: Dona Zélia" pendurada na frente da toalha, das 17h45 até o último da turma sair.
    camadaViva(P.TAMPO_Y + 80.6, ctx => desenhaPontaDaTurma(ctx)),
    // A Rosa viva na cozinha (ROSA_COZ): mexendo a panela ou levando o prato até o passe.
    camadaViva(cozinhaDaRosaPronta() ? 301 : ROSA_OBRA.y, ctx => desenhaRosaCozinha(ctx)),   // (em obra, no chão do salão, na ordem do pé dela)
    // As moedas da gorjeta no tampo (o Jocelino recolhe ao passar).
    camadaViva(P.TAMPO_Y + 82, ctx => { if (t) for (const x of t.moedas) if (P.ASSENTOS[x.mesa]) desenhaPe(ctx, 'salao/moedas_balcao', P.ASSENTOS[x.mesa].x + 34, P.LOUCA.base + 1, 1, 1.2); }),
    // No tampo: o prato de quem está comendo, a louça de quem já foi, e a farinheira.
    camadaViva(P.TAMPO_Y + 81, ctx => {
      if (t) t.mesas.forEach((m, i) => {
        if (i >= P.ASSENTOS.length) return;
        if (m.estado === 'comendo') desenhaPrato(ctx, m.prato, P.ASSENTOS[i].x, P.LOUCA.base + 2, 1, 0.9);
        if (m.estado === 'suja' || m.louca) { desenhaPe(ctx, 'salao/louca_suja', P.ASSENTOS[i].x, P.LOUCA.base, 1, P.LOUCA.escala); desenhaMoscasLouca(ctx, i); }   // (14/10) a mosca em cima da louça
      });
      const F = P.FARINHEIRA, nf = typeof Melhorias !== 'undefined' && G.pensao ? Melhorias.nivel(G.pensao, 'farinheira_grande') : 0;
      // (14/10, o jogador: "faça o desenho da tigela de farinha vazia para quando faltar") sem farinha, a arte vazia (mesma largura e pé)
      // (16/10, o jogador: "não fica vazia quando acaba a farinha") fora da janta, a tigela mostra a despensa: sem farinha lá, vazia
      const vz = farinheiraVazia() ? '_vazia' : '';
      if (nf >= 2) desenhaPe(ctx, 'salao/farinheira_barril' + vz, F.cx + 10, 790, 1, 0.5);
      else desenhaPe(ctx, (nf ? 'salao/farinheira_grande' : 'salao/farinheira') + vz, nf ? F.cx + 13 : F.cx, nf ? 788 : F.base, 1, nf ? 0.55 : F.escala);
    }),
    // O passe da cozinha (a bancada), os pratos prontos em cima dele, a bacia e o lixo.
    camadaViva(878, ctx => {
      desenhaPe(ctx, 'salao/passe', P.PASSE.cx, P.PASSE.base, 1, P.PASSE.escala);
      if (t) t.passaPrato().forEach((x, k) => { const v = vagaDoPasse(k); desenhaPrato(ctx, x.prato, v.x, v.y, 1, 0.8); });
      // (revisão da Tarefa B) o prato que o ajudante "Leva prato" reservou: o "!" em cima (é dele)
      if (t) t.passaPrato().forEach((x, k) => { if (x.reservadoPara != null) { const v = vagaDoPasse(k); desenhaFx(ctx, 'exclamacao', v.x, v.y - 46 + Math.sin((G.agora || 0) * 5) * 3, { escala: 0.7 }); } });
    }),
    camadaViva(879, ctx => { desenhaPe(ctx, 'salao/bacia', P.BACIA.x + P.BACIA.w / 2, P.BACIA.y + P.BACIA.h, 1, P.BACIA.escala); }),
    camadaViva(878.5, ctx => { desenhaPe(ctx, 'salao/lixo', P.LIXO.x + P.LIXO.w / 2, P.LIXO.y + P.LIXO.h, 1, P.LIXO.escala); }),
  ];
}
MAPAS_DEF.pensao_palco = (orig => () => {
  const b = orig();
  b.extras = () => [...clientesDoPalco(b), ...camadasDaJanta(), ...(typeof ajudantesDoPalco === 'function' ? ajudantesDoPalco() : []), ...filhosDoPalco(), ...(typeof camadasMelhorias === 'function' ? camadasMelhorias() : [])];
  b.desenhaPorCima = ctx => { desenhaBaloesPalco(ctx, b); desenhaDesgostoPalco(ctx); desenhaAlertaFarinha(ctx); desenhaPeneira(ctx); desenhaBandeja(ctx); desenhaAjudantesBebida(ctx); desenhaCoracoesPalco(ctx); desenhaCarimbosPalco(ctx); if (typeof desenhaFlutuantes === 'function') desenhaFlutuantes(ctx); desenhaPlaquinhasAjudantes(ctx); };
  return b;
})(MAPAS_DEF.pensao_palco);

// Balões em cima de cada cliente: o pedido (branco quando o prato já está pronto), a bebida, a paciência e as frases.
function desenhaBaloesPalco(ctx, b) {
  const t = G.turno;
  if (!t) return;
  t.mesas.forEach((m, i) => {
    if (i >= PALCO.ASSENTOS.length || !['pedido', 'prato', 'comendo'].includes(m.estado)) return;
    const A = PALCO.ASSENTOS[i], x = A.x, y = A.y - 114 * PALCO.ESCALA_GENTE - 34 - folgaDoEnfeite(t, m);   // (E4a) o balão sobe acima do enfeite alto
    const bebe = t.querBebidaAgora(m);   // (Tarefa C) a cerveja só aparece no balão quando o prato chega
    if (m.cliente.mania === 'vip') texto(ctx, '★ ' + m.cliente.nome.split(',')[0], x, y - 42, 18, '#ffd34d', '900');
    if (m.estado === 'comendo') {
      const fr = FRASES_CLIENTE[m.reacao] || ['Hmm!'];
      texto(ctx, fr[(i + m.vezes) % fr.length], x, y + 20, 20, '#fff');
      if (m.reacao === 'coracao') desenhaFx(ctx, 'coracao', x, y - 10);
      if (bebe) { desenhaFx(ctx, 'balao', x + 44, y + 40, { escala: 0.62 }); desenhaPe(ctx, 'salao/bebida_' + m.bebida, x + 44, y + 54, 1, 0.5); }
      return;
    }
    if (m.estado === 'pedido') { if (DESGOSTO_PALCO[i] && DESGOSTO_PALCO[i].vis) return;   // (14/10) incomodado: o balão do desgosto no lugar do "..."
      desenhaFx(ctx, 'balao_pensamento', x, y); texto(ctx, '...', x, y + 6, 30, '#555', '900'); desenhaJeito(ctx, m, x, y); return; }
    const pronto = t.temPronto(m.prato);
    if (!(DESGOSTO_PALCO[i] && DESGOSTO_PALCO[i].vis)) desenhaJeito(ctx, m, x, y);   // (Tarefa E1) o jeito, do lado esquerdo do balão
    desenhaFx(ctx, pronto ? 'balao' : 'balao_pensamento', x, y);
    ctx.save(); ctx.globalAlpha = pronto ? 1 : 0.55; desenhaPrato(ctx, m.prato, x, y + 18, 1, 0.8); ctx.restore();
    if (bebe) { desenhaFx(ctx, 'balao', x + 44, y + 14, { escala: 0.62 }); desenhaPe(ctx, 'salao/bebida_' + m.bebida, x + 44, y + 28, 1, 0.5); }
    const f = clamp(1 - m.espera / (TurnoJanta.PACIENCIA_PRATO * (t.pacienciaDe ? t.pacienciaDe(m) : t.paciencia || 1)), 0, 1);   // (Tarefa E1) com o jeito
    if (spr('fx/barra_moldura')) {
      desenhaFx(ctx, 'barra_moldura', x, y + 42);   // a moldura tem o miolo escuro: a cor vai por cima
      ctx.fillStyle = f > 0.5 ? '#5ec43a' : f > 0.25 ? '#e8c22c' : '#e8452c'; ctx.fillRect(x - 26, y + 40, 52 * f, 4);
    }
  });
}
// (14/10, o jogador: "arrume a arte do jocelino quando ele segura um prato e alguma bebida, esta mal feito") O que o Jocelino leva
// vai numa BANDEJA de verdade (a "bandeja de até 3" do docs/comparativo_dave_pensao.md; arte salao/bandeja do Higgsfield, por
// ferramentas_arte/produzir_bandeja.sh e web_bandeja.py), segura pelas duas mãos na frente do peito: a folha jocelino_carregar_vazio
// (mãos juntas) e o ponto das mãos MAOS_CARGA por direção e quadro (personagens.js). A bandeja vai por cima das mãos, com a borda de
// baixo nelas (as mãos seguram por baixo), e sobe e desce com o passo. Tudo o que ele leva fica EM PÉ na superfície dela, lado a
// lado: os pratos e a louça do lado do corpo (encostando um no outro, um pouco por cima, quando não cabem) e o copo/garrafa na
// ponta de fora (de frente, do lado esquerdo dele), longe do rosto. De costas, a bandeja fica atrás do corpo (desenhada antes
// dele: só a borda aparece). Sem nada na mão, a folha de andar de sempre. Enquanto a folha de carregar não chegou, a bandeja em
// cima da cabeça (antes). Os itens são a arte de sempre: pratos/<id> (desenhaPrato), salao/bebida_<bebida> e salao/pilha_louca.
// Medidas em pixels do quadro da folha (66x114; o palco multiplica por PALCO.ESCALA_GENTE): escala da bandeja e de cada coisa em
// cima dela, quanto a bandeja passa das mãos para a frente (de lado), quanto a borda de baixo fica abaixo das mãos (de lado e de
// frente; as mãos aparecem por baixo dela), a sobra da borda e quanto um prato sobe ao encostar no outro.
const MAOS_SALAO = { bandeja: 0.3, prato: 0.44, bebida: 0.3, louca: 0.36, frente: 16, baixo: 1, baixoFrente: 3, borda: 0.86, empilha: 2 };
// A superfície de cima da bandeja, em fração da peça (medida pelo web_bandeja.py): o meio e a meia altura da faixa e a meia largura.
const BANDEJA_GEO = { meio: 0.49, faixa: 0.30, meia: 0.465 };
// O rosto na folha de carregar (medido no quadro, por direção: baixo, cima, esquerda, direita): de x0 a x1, e o queixo por quadro
// do passo. O que passa na frente do rosto não sobe acima do queixo (se subiria, a bandeja desce um pouco).
const ROSTO_CARGA = [{ x0: 15, x1: 42, queixo: [44, 48, 44, 48] }, null, { x0: 10, x1: 30, queixo: [46, 50, 46, 50] }, { x0: 34, x1: 54, queixo: [45, 49, 45, 49] }];
function bandejaNasMaos(p) { const t = G.turno; return p === G.jog && t && noPalco() && t.bandeja.length ? t.bandeja : []; }
// A parte com tinta de cada arte (em fração da peça), medida uma vez: os ícones têm sobra transparente embaixo e dos lados; sem
// descontar, o prato fica flutuando acima da bandeja.
const _TINTA = new WeakMap();
function tintaDa(img) {
  let c = _TINTA.get(img); if (c) return c;
  c = { x0: 0, x1: 1, y0: 0, y1: 1 };
  try {
    const w = img.naturalWidth, h = img.naturalHeight, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d'); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, w, h).data;
    let x0 = w, x1 = -1, y0 = h, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 60) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 >= 0) c = { x0: x0 / w, x1: (x1 + 1) / w, y0: y0 / h, y1: (y1 + 1) / h };
  } catch (e) { /* sem ler os pixels: a peça inteira */ }
  _TINTA.set(img, c); return c;
}
// O tamanho (no quadro) de cada coisa em cima da bandeja: a parte com tinta (para encostar uma na outra e pôr o pé na superfície),
// a sobra transparente embaixo (pe) e o quanto o meio da tinta sai do meio da peça (dx).
function itemDaBandeja(x) {
  const nome = x.tipo === 'prato' ? iconePratoGrande(x.prato) : x.tipo === 'bebida' ? 'salao/bebida_' + x.bebida : 'salao/pilha_louca';
  const s = x.tipo === 'prato' ? MAOS_SALAO.prato * (nome.startsWith('pratos/') ? 48 / 128 : 1) : x.tipo === 'bebida' ? MAOS_SALAO.bebida : MAOS_SALAO.louca;
  const img = spr(nome), w = img ? img.naturalWidth : 64, h = img ? img.naturalHeight : 64, c = img ? tintaDa(img) : { x0: 0.1, x1: 0.9, y0: 0, y1: 1 };
  return { nome, s, w: (c.x1 - c.x0) * w * s, alto: (c.y1 - c.y0) * h * s, pe: (1 - c.y1) * h * s, dx: ((c.x0 + c.x1) / 2 - 0.5) * w * s, chato: x.tipo !== 'bebida' };
}
// Onde fica tudo (em coordenadas do palco), para desenhar e para a s39 conferir: a bandeja (o pé dela, o meio da borda de baixo, a
// largura e a altura) e a faixa da superfície; cada item com o pé da tinta (dentro da faixa), a largura e a altura da tinta, e o
// ponto onde a peça é desenhada (px, py).
function arrumaBandeja(p, itens) {
  const e = PALCO.ESCALA_GENTE, M = MAOS_SALAO, passo = p.andando ? Math.floor(p.t * 8) % 4 : 1, m = MAOS_CARGA[p.dir][passo];
  const lado = p.dir === DIR.ESQUERDA ? -1 : 1, deLado = p.dir === DIR.ESQUERDA || p.dir === DIR.DIREITA;
  const img = spr('salao/bandeja'), bw = (img ? img.naturalWidth : 200) * M.bandeja, bh = (img ? img.naturalHeight : 51) * M.bandeja;
  const mx = p.x + (m[0] - 33) * e, my = p.y + (m[1] - 112) * e;
  const bx = mx + (deLado ? M.frente * lado : 0) * e;
  let by = my + (p.dir === DIR.BAIXO ? M.baixoFrente : M.baixo) * e;
  const util = 2 * bw * BANDEJA_GEO.meia * M.borda;
  // os chatos (pratos, louça) do lado do corpo e as bebidas na ponta de fora, lado a lado e no meio da bandeja; de lado, o que é
  // alto e ficaria na frente do rosto vai para a ponta de fora (só o que precisa). Se não cabem, os chatos encostam um no outro (o
  // de fora um pouco por cima); sem par de chatos, todos encostam por igual.
  const fila = [...itens.filter(x => x.tipo !== 'bebida'), ...itens.filter(x => x.tipo === 'bebida')].map(x => Object.assign({ item: x }, itemDaBandeja(x)));
  const n = fila.length, total = fila.reduce((s, f) => s + f.w, 0);
  const pares = fila.slice(1).map((f, k) => f.chato && fila[k].chato), nPares = pares.filter(Boolean).length;
  const vao = total <= util ? (n > 1 ? Math.min(1, (util - total) / (n - 1)) : 0) : 0;
  const tira = total > util ? (total - util) / (nPares || n - 1 || 1) : 0;
  let c = 0, sobe = 0; const cs = [], ss = [];
  fila.forEach((f, k) => {
    if (k) { const encosta = tira && (nPares ? pares[k - 1] : true); c += (fila[k - 1].w + f.w) / 2 + vao - (encosta ? tira : 0); if (encosta && pares[k - 1]) sobe += M.empilha; }
    cs.push(c); ss.push(sobe);
  });
  const ini = n ? cs[0] - fila[0].w / 2 : 0, fim = n ? cs[n - 1] + fila[n - 1].w / 2 : 0;
  let desloca = -(ini + fim) / 2;
  const sup0 = (by - p.y) / e + 112 - bh * (1 - BANDEJA_GEO.meio);   // o meio da superfície, no quadro
  // o rosto: o que passa na frente dele não sobe acima do queixo; de lado, primeiro empurra tudo para a ponta de fora; se ainda
  // subiria, a bandeja toda desce o que falta
  const R = ROSTO_CARGA[p.dir];
  if (R && deLado) {
    let empurra = 0;
    fila.forEach((f, k) => {
      if (sup0 - ss[k] - f.alto >= R.queixo[passo]) return;
      const xq = m[0] + M.frente * lado + (cs[k] + desloca) * lado;
      empurra = Math.max(empurra, 1 + (lado > 0 ? R.x1 - (xq - f.w / 2) : (xq + f.w / 2) - R.x0));   // 1 px de folga
    });
    desloca += Math.max(0, Math.min(empurra, util / 2 - fim - desloca));
  }
  if (R) {
    let desce = 0;
    fila.forEach((f, k) => {
      const xq = m[0] + (deLado ? M.frente * lado : 0) + (cs[k] + desloca) * lado, topo = sup0 - ss[k] - f.alto;
      if (xq + f.w / 2 > R.x0 && xq - f.w / 2 < R.x1) desce = Math.max(desce, R.queixo[passo] - topo);
    });
    by += desce * e;
  }
  const sy = by - bh * (1 - BANDEJA_GEO.meio) * e, faixa = bh * BANDEJA_GEO.faixa * e;
  const postos = fila.map((f, k) => {
    const x = bx + (cs[k] + desloca) * lado * e, y = sy - ss[k] * e;
    return { item: f.item, nome: f.nome, s: f.s * e, x, y, w: f.w * e, alto: f.alto * e, px: x - f.dx * e, py: y + f.pe * e };
  });
  return { x: bx, y: by, w: bw * e, h: bh * e, s: M.bandeja * e, sup: { y0: sy - faixa, y1: sy + faixa, x0: bx - bw * BANDEJA_GEO.meia * e, x1: bx + bw * BANDEJA_GEO.meia * e }, maos: { x: mx, y: my }, itens: postos };
}
function desenhaBandejaNasMaos(ctx, p, itens) {
  if (!spr(FOLHA_CARREGAR)) return;
  const a = arrumaBandeja(p, itens);
  desenhaPe(ctx, 'salao/bandeja', a.x, a.y, 1, a.s);   // sem a arte ainda: as coisas ficam no lugar (nada some)
  a.itens.forEach(x => desenhaPe(ctx, x.nome, x.px, x.py, 1, x.s));
}
// O Jogador (personagens.js) passa a "carregar" também com a bandeja do salão: a folha de mãos juntas e a pilha nas mãos.
(() => {
  const J = Jogador.prototype, carregando0 = J.carregando, desenhaCarga0 = J.desenhaCarga;
  J.carregando = function () { return bandejaNasMaos(this).length > 0 || carregando0.call(this); };
  J.desenhaCarga = function (ctx) { const b = bandejaNasMaos(this); return b.length ? desenhaBandejaNasMaos(ctx, this, b) : desenhaCarga0.call(this, ctx); };
})();
// A bandeja em cima da cabeça: só enquanto a folha de carregar não carregou (nada some da tela).
function desenhaBandeja(ctx) {
  const t = G.turno, j = G.jog;
  if (!t || !j || !t.bandeja.length || spr(FOLHA_CARREGAR)) return;
  const y = j.y - 114 * PALCO.ESCALA_GENTE - 26, n = t.bandeja.length;
  t.bandeja.forEach((x, k) => {
    const cx = j.x + (k - (n - 1) / 2) * 44;
    if (x.tipo === 'prato') desenhaPrato(ctx, x.prato, cx, y, 1, 0.85);
    else if (x.tipo === 'bebida') desenhaPe(ctx, 'salao/bebida_' + x.bebida, cx, y, 1, 0.6);
    else desenhaPe(ctx, 'salao/pilha_louca', cx, y, 1, 0.7);
  });
}

// (Tarefa D1) Onde fica o prato k do passe: as 4 vagas do passe e, depois delas, as da bancada (com a melhoria).
function vagaDoPasse(k) {
  const P = PALCO, n = P.PASSE.vagas.length;
  if (k < n) return { x: P.PASSE.vagas[k], y: P.PASSE.topo };
  const B = P.BANCADA; return { x: B.vagas[Math.min(k - n, B.vagas.length - 1)], y: B.topo };
}
// ---------- clicar, ir até e fazer ----------
function palcoAlvoEm(px, py) {
  const P = PALCO, t = G.turno;
  const dentro = (R) => px >= R.x && px <= R.x + R.w && py >= R.y && py <= R.y + R.h;
  if (t) {
    const ps = t.passaPrato();
    for (let k = 0; k < ps.length; k++) { const v = vagaDoPasse(k); if (Math.abs(px - v.x) < 22 && Math.abs(py - (v.y - 14)) < 40) return { tipo: 'passe', k, x: v.x }; }
  }
  if (dentro(P.PASSE_AREA)) return { tipo: 'passe', k: 0, x: P.PASSE.cx };
  if (typeof temMelhoria === 'function' && temMelhoria('bancada_passe') && dentro(P.BANCADA.area)) return { tipo: 'passe', k: P.PASSE.vagas.length, x: P.BANCADA.cx };
  if (dentro(P.FARINHEIRA)) return { tipo: 'farinheira', x: P.FARINHEIRA.cx };
  if (dentro(P.BEBEDOURO)) return { tipo: 'bebedouro', x: P.BEBEDOURO.x + P.BEBEDOURO.w / 2 };
  if (dentro(P.BACIA)) return { tipo: 'bacia', x: P.BACIA.x + P.BACIA.w / 2 };
  if (dentro(P.LIXO)) return { tipo: 'lixo', x: P.LIXO.x + P.LIXO.w / 2 };
  if (dentro(P.CARDAPIO)) return { tipo: 'cardapio', x: clamp(px, P.X_MIN, P.X_MAX) };
  if (t) for (let i = 0; i < Math.min(t.mesas.length, P.ASSENTOS.length); i++) {
    const A = P.ASSENTOS[i], m = t.mesas[i];
    if (Math.abs(px - A.x) > 66 || py < A.y - 220 || py > P.TAMPO_Y + 60) continue;
    if (m.estado !== 'livre' && m.estado !== 'reservada') return { tipo: 'cliente', i, x: A.x };   // (E4a) a banqueta reservada vazia não é alvo
  }
  if (dentro(P.PORTA)) return { tipo: 'porta', x: P.X_MIN };
  return null;
}
// Clique no palco: o Jocelino anda até o alvo e faz ao chegar; um clique novo troca o alvo.
function palcoClique(px, py) {
  if (G.copo) return true;
  if (G.peneira) pararPeneira();
  const alvo = palcoAlvoEm(px, py);
  // (15/10) clicou num ajudante, fora de qualquer alvo do serviço: a plaquinha e o que ele está fazendo (o Jocelino anda até lá)
  if (!alvo) { const aj = ajudanteEm(px, py); if (aj) falarComAjudante(aj); }
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
    // (revisão da Tarefa B) a tecla X pega o primeiro prato que o ajudante não reservou
    if (t.passaPrato().length) { const k = t.passe.findIndex(x => x.reservadoPara == null); cands.push({ tipo: 'passe', k: Math.max(0, k), x: P.PASSE.cx }); }
    // (revisão da D1) cada prato livre no lugar dele: perto da bancada do passe, a tecla X pega o prato de cima dela
    t.passe.forEach((x, k) => { if (x.reservadoPara == null && k >= P.PASSE.vagas.length) cands.push({ tipo: 'passe', k, x: vagaDoPasse(k).x }); });
    t.mesas.forEach((m, i) => { if (i < P.ASSENTOS.length && m.estado !== 'livre' && m.estado !== 'reservada') cands.push({ tipo: 'cliente', i, x: P.ASSENTOS[i].x, quer: m }); });
  }
  cands.push({ tipo: 'farinheira', x: P.FARINHEIRA.cx }, { tipo: 'bebedouro', x: P.BEBEDOURO.x + P.BEBEDOURO.w / 2 },
    { tipo: 'bacia', x: P.BACIA.x + P.BACIA.w / 2 }, { tipo: 'lixo', x: P.LIXO.x + P.LIXO.w / 2 });
  const leva = c => t && c.quer && t.bandeja.some(x => (x.tipo === 'prato' && x.prato === c.quer.prato && c.quer.estado === 'prato') || (x.tipo === 'bebida' && x.bebida === c.quer.bebida && t.querBebidaAgora(c.quer)));
  const peso = c => Math.abs(c.x - G.jog.x) - (leva(c) ? 400 : 0);
  const a = cands.filter(c => Math.abs(c.x - G.jog.x) < 110).sort((p, q) => peso(p) - peso(q))[0];
  if (a) palcoAgir(a); else avisar('Nada aqui. Chegue perto de um cliente, do passe, da farinheira, do bebedouro ou da bacia.');
}
function palcoAgir(a) {
  const t = G.turno, j = G.jog;
  if (a.tipo === 'porta') { sairDoPalco(); return; }
  if (a.tipo === 'cardapio') { pensaoQuadro(); return; }
  if (!t) {
    if (jantaEsperaCardapio()) { avisar('A janta espera o cardápio: monte o quadro e clique em "Abrir a pensão".'); pensaoQuadro(); return; }
    avisar(pensaoAbreHoje() ? 'A janta começa às 17h. Use o Adiantar ou espere.' : 'Hoje a pensão não abre.'); return; }
  // (14/10, o pacote de cozinha) o que não dá: o aviso e o "não!" (Error Action) no lugar do erro antigo
  const naoDa = txt => { avisar(txt); sons.tocar('acao_erro', 1, 0.04, -8); };
  const cheia = () => naoDa('A bandeja está cheia! Entregue alguma coisa primeiro.');
  if (a.tipo === 'passe') {
    if (!t.passaPrato().length) { naoDa(t.farinha <= 0 ? 'A farinheira acabou: a Rosa parou! Reponha a farinha.' : 'Nenhum prato pronto ainda.'); return; }
    // (Tarefa B) o prato reservado (com o "!") é do ajudante: clicou nele, pega o primeiro livre (como a tecla X); só avisa quando
    // todos os pratos do passe são do ajudante
    if (!t.livresNoPasse().length) { naoDa('Esse o ajudante já vai levar.'); return; }
    let kk = Math.min(a.k || 0, t.passaPrato().length - 1);
    if (t.passe[kk].reservadoPara != null) kk = t.passe.findIndex(x => x.reservadoPara == null);
    if (t.bandeja.length >= TurnoJanta.BANDEJA_MAX) return cheia();
    t.pegar(kk); sons.tocar('item_pega', 1, 0.05, -6);   // (o pacote de cozinha) o prato sai do passe (Drop_Pick Up)
    return;
  }
  if (a.tipo === 'bebedouro') {
    const b = t.bebidaPedida();
    if (!b) { naoDa('Ninguém está esperando bebida agora.'); return; }
    if (t.bandeja.length >= TurnoJanta.BANDEJA_MAX) return cheia();
    abrirCopo(b);
    return;
  }
  if (a.tipo === 'farinheira') {
    // (Tarefa C, o wasabi do Dave) Repor leva tempo: o Jocelino peneira a farinha (a barrinha em cima dele); clicar em outro lugar
    // ou andar interrompe, e o que já foi peneirado fica guardado (o Dave: fechar o minijogo antes mantém o que já foi moído).
    if (G.peneira) return;   // (revisão) já peneirando: o X de novo não reinicia a barrinha
    const r = t.podeReporFarinha();
    if (r === 'ok') { comecarPeneira(); return; }
    avisar(r === 'cheia' ? `A farinheira ainda tem ${t.farinha}. Repõe quando baixar de ${(t.farinhaMax || TurnoJanta.FARINHA_MAX) - (TurnoJanta.FARINHA_MAX - TurnoJanta.REPOR_ATE) + 1}.` : 'Acabou a farinha na despensa! Compre na Mercearia do Seu Ananias.');
    return;
  }
  if (a.tipo === 'bacia') {
    const n = t.largarLouca();
    // o ploft e, logo depois, a Rosa lavando (Wash Dishes, baixinho)
    if (n) { sons.tocar('bacia', 1, 0.08, -4); setTimeout(() => sons.tocar('lavando', 1, 0.06, -14), 700); avisar(n > 1 ? `${n} pratos na bacia. Ploft!` : 'Ploft! Louça na bacia.'); }
    else naoDa('A bacia é para a louça suja.');
    return;
  }
  if (a.tipo === 'lixo') {
    const n = t.jogarFora();
    if (n) { sons.tocar('lixo', 1, 0.05, -4); setTimeout(() => sons.tocar('rosa_resmunga', 1, 0.08, -6), 350); avisar('A Rosa resmungou: "Comida no lixo, Jocelino?!"'); }
    else naoDa('Não tem nada para jogar fora.');
    return;
  }
  if (a.tipo === 'cliente') {
    const m = t.mesas[a.i];
    // O estado pode ter mudado no caminho: revalida.
    if (!m || m.estado === 'livre') { avisar('A banqueta ficou vazia.'); return; }
    if (m.estado === 'reservada') { avisar(t.encomenda && typeof AvisoFesta !== 'undefined' ? `Reservada para a turma ${AvisoFesta.da(t.encomenda)}.` : 'Banqueta reservada para a festa.'); return; }   // (E4a)
    if (m.estado === 'suja' || m.louca) {   // (a louça ao lado de quem sentou sai primeiro: senão ele vai embora)
      if (t.bandeja.length >= TurnoJanta.BANDEJA_MAX) return cheia();
      t.recolher(a.i); servir(); sons.tocar('louca_recolhe', 1, 0.06, -5);   // (o pacote de cozinha) os pratos batendo (Wash Dishes)
      return;
    }
    if (t.servirBebida(a.i)) { const nb = t.mesas[a.i].bebidaNota; servir(); sons.tocar('servir', 1.2, 0.08, -4); setTimeout(() => sons.tocar('gole', 1, 0.1, -4), 400); carimboBebida(a.i, nb); if (nb !== 'ok') sons.tocar('carimbo', nb === 'ruim' ? 0.85 : 1, 0.05, -6); return; }
    if (m.estado === 'prato' && t.servir(a.i)) { servir(); sons.tocar('item_pousa', 1, 0.05, -6); sons.tocar('servir', 1, 0.08, -6); return; }   // o "pop" (Drop_Pick Up) e a louça   // (a reação do cliente vem do evento 'servido': somDoEvento)
    // (14/10) o freguês de fora diz uma frase curta na primeira vez que o Jocelino fala com ele na noite
    // (Tarefa E1) com o jeito dele: na primeira vez, o que o jeito muda; depois, só o jeito ao lado do nome
    const jt = jeitoDoAvulso(m.cliente);
    // (E4a) quem é da turma da festa encomendada: de quem é a festa
    const turma = m.cliente.turma && t.encomenda && typeof AvisoFesta !== 'undefined' ? `(${m.cliente.anfitriao ? 'a festa' : 'a turma'} ${AvisoFesta.da(t.encomenda)}) ` : '';
    const fala = turma + (m.cliente.avulso && !m.falou && FALAS_AVULSOS[m.cliente.id] ? `${m.cliente.nome}: "${FALAS_AVULSOS[m.cliente.id]}" ${jt ? `(${jt.nome}: ${jt.dica}.) ` : ''}` : jt ? `(${jt.nome}) ` : '');
    if (fala) m.falou = true;
    if (m.estado === 'chegando') avisar(`${fala}${m.cliente.nome} está chegando.`);
    else if (m.estado === 'pedido') avisar(`${fala}${m.cliente.nome} está lendo o cardápio.`);
    else if (m.estado === 'prato') {
      const quer = `${Pensao.prato(m.prato).nome}${t.querBebidaAgora(m) ? ' e ' + Pratos.BEBIDAS[m.bebida].toLowerCase() : ''}`;
      avisar(`${fala}${m.cliente.nome} quer ${quer}. ${t.temPronto(m.prato) ? 'Tem no passe!' : t.farinha <= 0 ? 'A farinheira acabou: a Rosa parou!' : 'A Rosa está fazendo.'}`);
    } else avisar(fala + (t.querBebidaAgora(m) ? `${m.cliente.nome} está comendo e ${TurnoJanta.depoisDoPrato(m.bebida) ? 'pediu uma' : 'ainda quer'} ${Pratos.BEBIDAS[m.bebida].toLowerCase()}.` : `${m.cliente.nome} está comendo.`));
  }
  function servir() { j.servindo = 0.35; j.dir = DIR.CIMA; }
}
// (14/10) O garçom dos robôs de teste (s20 e s23, o mesmo para os dois, como o quadroDoRobo): uma decisão por chamada, como um
// jogador que joga bem com a bandeja (até BANDEJA_MAX coisas): a farinheira baixa; a louça do lado de quem sentou (senão ele vai
// embora) e o banco sujo quando alguém vai chegar sem banco livre; a bebida pedida (o copo na linha, junto com os pratos); os pratos prontos que
// alguém espera (vários de uma vez); entregar o que está na bandeja a quem espera há mais tempo; a louça na bacia; o que ninguém
// quer mais no lixo; a louça das banquetas e as moedas.
// vai(x, y): o clique do robô que anda até lá e faz. Devolve true se fez alguma coisa.
function roboDoSalaoPasso(t, vai) {
  // (o clique na cabeça do cliente, como o jogador: no salão maior, y − 60 da banqueta 0 cai dentro do bebedouro)
  const P = PALCO, n = Math.min(t.mesas.length, P.ASSENTOS.length), assento = i => vai(P.ASSENTOS[i].x, P.ASSENTOS[i].y - 120);
  const cabe = t.bandeja.length < TurnoJanta.BANDEJA_MAX;
  const quer = (m, x) => x.tipo === 'prato' ? m.estado === 'prato' && m.prato === x.prato : x.tipo === 'bebida' && t.querBebidaAgora(m) && m.bebida === x.bebida;
  if (G.peneira) return true;   // (Tarefa C) peneirando: espera a barrinha encher (outro clique interromperia)
  // (Tarefa C) a peneira leva tempo: quem joga bem peneira com a farinheira quase no fim (FARINHA_URGENTE) ou num momento parado
  // (no fim desta lista, com o alerta aceso), não a cada prato
  const peneira = () => (t.pensao.despensa.farinha || 0) > 0 && t.podeReporFarinha() === 'ok' && (vai(P.FARINHEIRA.cx, P.FARINHEIRA.y + 20), true);
  if (t.farinha <= FARINHA_URGENTE && peneira()) return true;
  if (cabe) for (let i = 0; i < n; i++) if (t.mesas[i].louca) { assento(i); return true; }
  // alguém vai chegar e não há banco livre: limpa um banco sujo antes (senão ele senta do lado da louça e vai embora)
  // (E4a) a turma da festa na porta e a louça numa banqueta da ponta: limpa (a banqueta volta a ser reservada e a turma entra)
  if (cabe && t.turmaNaPorta && t.turmaNaPorta()) for (const i of t.encomenda.ponta) if (i < n && t.mesas[i].estado === 'suja') { assento(i); return true; }
  // (revisão da E4a, na E4b) para o freguês comum, a ponta reservada não é vaga nem é a louça a limpar primeiro
  const daPonta = i => !!(t._daTurma && t._daTurma(i));
  const vemGente = t._fila.length && t._fila[0].minuto <= G.minutos + 10 && !t.mesas.some((m, i) => i < n && m.estado === 'livre' && !daPonta(i));
  if (vemGente && cabe) for (let i = 0; i < n; i++) if (t.mesas[i].estado === 'suja' && !daPonta(i)) { assento(i); return true; }
  // a bebida pedida primeiro (o copo vai na bandeja junto com os pratos): sem ela o cliente come sem a 4ª estrela; deixa uma vaga
  // para o prato se alguém ainda espera prato
  const vagaPrato = t.mesas.some(m => m.estado === 'prato') ? 1 : 0;
  if (t.bandeja.length < TurnoJanta.BANDEJA_MAX - vagaPrato && t.bebidaPedida()) {
    vai(P.BEBEDOURO.x + 20, P.BEBEDOURO.y + 30);
    roboEncheCopo();
    return true;
  }
  // (14/10, Tarefa E2, a bebida de DEPOIS do prato; o rastro da s20 no degrau 3) Quem já come e pediu a cerveja ou a caipirinha só
  // espera ela até um pouco depois de acabar, e a espera dele parou de contar quando o prato chegou: no "quem espera há mais tempo"
  // lá de baixo ele ficava por último e ia embora com a bebida pronta na bandeja. O jogador atento entrega essa bebida assim que
  // ela fica pronta, antes de pegar mais prato (a de quem está mais perto de acabar primeiro). (Medido na s20: largar a louça na
  // bacia para abrir vaga, ou levar a bebida na vaga guardada do prato, servia mais bebida e menos prato: os pratos encalhavam no
  // passe. Jogar no lixo a bebida de quem já foi embora mudava a noite inteira, até o degrau 1, e adiantava todo mundo.)
  { let urg = -1;
    for (let i = 0; i < n; i++) { const m = t.mesas[i];
      if (m.estado === 'comendo' && TurnoJanta.depoisDoPrato(m.bebida) && t.bandeja.some(x => quer(m, x)) && (urg < 0 || m.come < t.mesas[urg].come)) urg = i; }
    if (urg >= 0) { assento(urg); return true; } }
  // os pratos prontos que alguém espera e ainda não estão na bandeja
  // (Tarefa B) sem quem o ajudante "Leva prato" já vai servir, e sem o prato que ele reservou no passe
  const querem = t.mesas.filter(m => m.estado === 'prato' && !m.pratoReservado).map(m => m.prato);
  for (const x of t.bandeja) if (x.tipo === 'prato') { const k = querem.indexOf(x.prato); if (k >= 0) querem.splice(k, 1); }
  const k = cabe ? t.passe.findIndex(x => x && x.reservadoPara == null && querem.includes(x.prato)) : -1;
  if (k >= 0) { const v = vagaDoPasse(k); vai(v.x, v.y - 10); return true; }
  // entregar: quem espera há mais tempo por alguma coisa da bandeja
  // (Tarefa E1: o robô por "menos paciência sobrando", com o jeito, foi testado na s20 e servia uma pessoa a menos no degrau 3, com
  // menos estrelas; com o "quem espera há mais tempo" a calibração fica a mesma de antes dos jeitos)
  let quem = -1;
  for (let i = 0; i < n; i++) if (t.bandeja.some(x => quer(t.mesas[i], x)) && (quem < 0 || t.mesas[i].espera > t.mesas[quem].espera)) quem = i;
  if (quem >= 0) { assento(quem); return true; }
  if (t.bandeja.some(x => x.tipo === 'louca') && (!cabe || !t.bandeja.some(x => x.tipo !== 'louca'))) { vai(P.BACIA.x + P.BACIA.w / 2, P.BACIA.y + 20); return true; }
  if (t.bandeja.some(x => x.tipo !== 'louca' && !t.mesas.some(m => quer(m, x)))) { vai(P.LIXO.x + P.LIXO.w / 2, P.LIXO.y + 20); return true; }
  if (cabe) for (let i = 0; i < n; i++) if (t.mesas[i].estado === 'suja') { assento(i); return true; }
  if (t.bandeja.some(x => x.tipo === 'louca')) { vai(P.BACIA.x + P.BACIA.w / 2, P.BACIA.y + 20); return true; }
  const mo = t.moedas.find(x => x.mesa < n); if (mo) { vai(P.ASSENTOS[mo.mesa].x, P.ASSENTOS[mo.mesa].y - 40); return true; }
  if (t.farinha <= TurnoJanta.REPOR_ATE && !t.bandeja.length && peneira()) return true;
  return false;
}
const FARINHA_URGENTE = 3;
function sairDoPalco() { G.jog.alvoPalco = null; G.copo = null; G.peneira = null; entrarMapa('vila', { x: 15, y: 9 }); }

// ---------- o copo do bebedouro: segurar para encher, soltar na linha ----------
// (14/10, Tarefa C, as notas do Dave) PERFEITA na linha ('medida'), BOA quase ('ok'); passar da boca DERRAMA: a bebida vai mesmo
// assim para a bandeja, com a nota RUIM ('ruim': sem a estrela da bebida e sem gorjeta extra), e a Rosa resmunga.
const COPO = { VEL: 0.42, MEDIDA: 0.05, MINIMO: 0.6,
  GEO: { cafe: { topo: 157, fundo: 295, linha: 187, espuma: false }, guarana: { topo: 17, fundo: 307, linha: 67, espuma: true }, caldo_cana: { topo: 19, fundo: 304, linha: 74, espuma: true }, cerveja: { topo: 19, fundo: 299, linha: 75, espuma: true } }, ART: { cafe: 'copo_cafe', guarana: 'copo_guarana', caldo_cana: 'copo_caldo', cerveja: 'copo_americano' }, LIQ: { cafe: 'liquido_cafe', guarana: 'liquido_guarana', caldo_cana: 'liquido_caldo', cerveja: 'liquido_cerveja' } };
// (Tarefa C, a cerveja do Dave: o copo começa inclinado, perto de 80% endireita e completa até ~20% de espuma) A cerveja de garrafa
// no copo americano: segurar despeja com a garrafa inclinada; soltar (ou o botão direito) endireita o copo; com o copo em pé, o
// que cai vira espuma depressa; soltar de novo serve. Velocidades por segundo (líquido e espuma) com o copo inclinado e em pé; a
// nota pela parte de espuma no copo: o colarinho de dois dedos (ALVO ± FAIXA, cheio de pelo menos CHEIO) é PERFEITA; espuma demais
// (mais que DEMAIS) é RUIM e a Rosa resmunga; pouca espuma (ou o copo baixo) é BOA. Passou da boca: derramou (RUIM).
const CERVEJA = { INCLINADO: { liq: 0.40, esp: 0.04 }, EM_PE: { liq: 0.13, esp: 0.40 }, ALVO: 0.2, FAIXA: 0.07, CHEIO: 0.85, DEMAIS: 0.32, ANGULO: 0.24 };
// A linha de medida do copo em fração do nível (0 = vazio, 1 = boca). (A cerveja: o colarinho de dois dedos cheio no alvo.)
function linhaDoCopo(b) { const g = COPO.GEO[b]; return (g.fundo - g.linha) / (g.fundo - g.topo); }
function abrirCopo(bebida) {
  G.copo = bebida === 'caipirinha' ? abrirCaipirinha() : bebida === 'cerveja' ? { bebida, cerveja: true, liq: 0, esp: 0, nivel: 0, inclinado: true, segurando: false, msg: 'Segure para despejar com o copo inclinado. Solte (ou botão direito) para endireitar.' }
    : { bebida, nivel: 0, segurando: false, msg: 'Segure para encher. Solte na linha!' };
  G.jog.alvoPalco = null;
  if (G.turno) G.turno.copoEnchendo = bebida;   // (revisão da D1) a banqueta dele: a máquina de refresco não enche o mesmo copo
}
// (revisão da D1) O copo do minijogo acompanha o turno: fechou (foi para a bandeja, derramou ou saiu do salão), a vaga se desfaz.
ATUALIZADORES.push(() => { const t = G.turno; if (t) t.copoEnchendo = G.copo && noPalco() ? G.copo.bebida : ''; });
// A nota da cerveja pela espuma: 'medida' (o colarinho de dois dedos), 'ok' (pouca espuma) ou 'ruim' (espuma demais).
function notaDaCerveja(liq, esp) {
  const tot = liq + esp, f = tot > 0 ? esp / tot : 0;
  if (f > CERVEJA.DEMAIS) return 'ruim';
  return Math.abs(f - CERVEJA.ALVO) <= CERVEJA.FAIXA && tot >= CERVEJA.CHEIO ? 'medida' : 'ok';
}
// O botão direito (ou soltar com o copo inclinado): o copo da cerveja fica em pé.
function copoEndireita() {
  const c = G.copo;
  if (!c || !c.cerveja || !c.inclinado) return false;
  c.inclinado = false; c.msg = 'Copo em pé! Segure e faça o colarinho de dois dedos. Solte para servir.';
  return true;
}
function copoSegura(sim) {
  const c = G.copo;
  if (!c) return false;
  if (c.caipi) return sim ? caipiSoco() || true : true;   // (E2) a caipirinha: segurar (o Espaço) soca; soltar não faz nada
  if (sim) { c.segurando = true; return true; }
  if (!c.segurando) return true;
  c.segurando = false;
  if (c.cerveja && c.inclinado) { copoEndireita(); return true; }
  if (c.nivel < COPO.MINIMO) { c.msg = 'Ainda falta! Segure de novo.'; return true; }
  const q = c.cerveja ? notaDaCerveja(c.liq, c.esp) : Math.abs(c.nivel - linhaDoCopo(c.bebida)) <= COPO.MEDIDA ? 'medida' : 'ok';
  copoFim(q);
  return true;
}
function copoFim(q, derramou = false) {
  const c = G.copo, t = G.turno;
  if (!c || !t) { G.copo = null; return; }
  t.encherBebida(c.bebida, q);
  G.copo = null;
  const nome = Pratos.BEBIDAS[c.bebida];
  if (c.caipi) {   // (Tarefa E2) a caipirinha: a receita certa, fora da ordem ou desandada
    if (q === 'medida') { sons.tocar('na_medida', 1, 0.03, -4); avisar('Caipirinha caprichada, do jeitinho do Seu Orlando! Leve para quem pediu.'); }
    else if (q === 'ruim') { setTimeout(() => sons.tocar('rosa_resmunga', 1, 0.08, -6), 250); avisar('A caipirinha desandou! A Rosa resmungou: "Cadê a receita, Jocelino?" Leve assim mesmo: sem estrela da bebida.'); }
    else avisar('Caipirinha boa, mas fora da receita. Leve para quem pediu.');
    return;
  }
  if (q === 'medida') { sons.tocar('na_medida', 1, 0.03, -4); avisar(c.cerveja ? `${nome} com o colarinho de dois dedos! O freguês vai gostar (a cerveja já paga o copo).` : `${nome} na medida! Gorjeta caprichada.`); }
  else if (q === 'ruim') {
    sons.tocar('derramar', 1, 0.05, -2); setTimeout(() => sons.tocar('rosa_resmunga', 1, 0.08, -6), 350);
    avisar(derramou ? `Derramou! A Rosa resmungou: "Olha o balcão, Jocelino!" Leve assim mesmo: sem estrela da bebida e sem gorjeta extra.`
      : `Espuma demais! A Rosa resmungou: "Isso é cerveja ou sabão?" Leve assim mesmo: sem estrela da bebida e sem gorjeta extra.`);
  }
  else avisar(c.cerveja ? `${nome} com pouca espuma. Leve para quem pediu.` : `${nome} servido(a). Leve para quem pediu.`);
}
ATUALIZADORES.push(dt => {
  const c = G.copo;
  if (!c) return;
  if (!noPalco()) { G.copo = null; return; }
  if (!c.segurando) return;
  if (c.cerveja) { const v = c.inclinado ? CERVEJA.INCLINADO : CERVEJA.EM_PE; c.liq += v.liq * dt; c.esp += v.esp * dt; c.nivel = c.liq + c.esp; }
  else c.nivel += COPO.VEL * dt;
  // (14/10, o pacote de cozinha) o som do despejo é o laço da mão (lacoDaMao, sons.js): toca enquanto segura e sobe de tom
  if (c.nivel >= 1) { c.nivel = 1; c.segurando = false; copoFim('ruim', true); }   // passou da boca: derramou
});
// (Tarefa C) O robô (s4, s10, s20, s23) joga o minijogo como quem joga bem: o copo até a linha; a cerveja inclinada até perto de 70%,
// endireita, e o colarinho até o copo ficar quase cheio. Devolve a nota (ou '' sem copo aberto).
function roboEncheCopo() {
  const c = G.copo; if (!c) return '';
  const passa = cond => { for (let j = 0; j < 600 && G.copo === c && cond(); j++) atualiza(0.01); };
  let q = '';
  const t = G.turno, n0 = t ? t.bandeja.length : 0;
  if (c.caipi) roboCaipirinha(c, passa);   // (E2) a caipirinha: os socos no ritmo e a receita na ordem
  else if (c.cerveja) {
    copoSegura(true); passa(() => c.liq < 0.7); copoSegura(false);
    copoSegura(true); passa(() => c.nivel < 0.92); copoSegura(false);
  } else { copoSegura(true); passa(() => c.nivel < linhaDoCopo(c.bebida)); copoSegura(false); }
  if (t && t.bandeja.length > n0) q = t.bandeja[t.bandeja.length - 1].qualidade;
  return q;
}
DESENHOS_TELA.push(ctx => {
  const c = G.copo;
  if (!c) return;
  if (c.caipi) return desenhaCaipirinha(ctx, c);
  if (c.cerveja) return desenhaCerveja(ctx, c);
  const copo = spr('salao/' + COPO.ART[c.bebida]), dentro = spr('salao/' + COPO.ART[c.bebida] + '_dentro'), liq = spr('salao/' + COPO.LIQ[c.bebida]), esp = spr('salao/espuma_topo');
  const W = G.larg, H = G.alt;
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 0, W, H); ctx.restore();
  if (!copo) return;
  const e = Math.min(1.4, H * 0.5 / alturaArte(copo)), w = larguraArte(copo) * e, h = alturaArte(copo) * e, x = W / 2 - w / 2, y = H / 2 - h / 2;
  // O líquido: a textura com o topo no nível (mais a espuma), recortada pelo formato de dentro do copo.
  if (dentro && liq) {
    const off = _copoTela || (_copoTela = document.createElement('canvas'));
    // (nitidez) o canvas do líquido no tamanho do ARQUIVO do copo; COPO.GEO é do desenho original: vezes a densidade (o copo, o
    // líquido, a espuma e a máscara foram ampliados juntos, no mesmo fator)
    const g0 = COPO.GEO[c.bebida], W0 = copo.naturalWidth, H0 = copo.naturalHeight, d = densidade(copo);
    off.width = W0; off.height = H0;
    const g = off.getContext('2d');
    g.clearRect(0, 0, W0, H0);
    const ny = (g0.fundo - (g0.fundo - g0.topo) * Math.min(1, c.nivel)) * d;
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
// (Tarefa D1) O copo da bebida b cheio até `nivel` (0 a 1), pequeno, com o pé em (x, y) e a altura alt: o mesmo copo e o mesmo
// líquido do minijogo, recortado por dentro do copo (a máquina de refresco enchendo o copo embaixo da torneira).
let _copoMaquina = null;
function desenhaCopoEnchendo(ctx, b, nivel, x, y, alt) {
  const copo = spr('salao/' + COPO.ART[b]), dentro = spr('salao/' + COPO.ART[b] + '_dentro'), liq = spr('salao/' + COPO.LIQ[b]), g0 = COPO.GEO[b];
  if (!copo || !g0) return;
  const W0 = copo.naturalWidth, H0 = copo.naturalHeight, e = alt / H0, w = W0 * e, d = densidade(copo);   // (COPO.GEO vezes a densidade)
  if (dentro && liq) {
    const off = _copoMaquina || (_copoMaquina = document.createElement('canvas')); off.width = W0; off.height = H0;
    const g = off.getContext('2d'); g.clearRect(0, 0, W0, H0);
    g.drawImage(liq, 0, (g0.fundo - (g0.fundo - g0.topo) * clamp(nivel, 0, 1)) * d);
    g.globalCompositeOperation = 'destination-in'; g.drawImage(dentro, 0, 0); g.globalCompositeOperation = 'source-over';
    ctx.drawImage(off, x - w / 2, y - alt, w, alt);
  }
  ctx.drawImage(copo, x - w / 2, y - alt, w, alt);
}
// (Tarefa C) A cerveja: o copo americano (inclinado no começo) e a garrafa, que gira para despejar. As camadas, de baixo para cima:
// o colarinho (espuma_cerveja) com o topo na espuma, a cerveja (liquido_cerveja) com o topo no líquido, recortados por dentro do
// copo; o copo por cima. Com o copo inclinado, as camadas giram ao contrário (a cerveja fica deitada) e crescem um pouco para
// cobrir o vidro. O fio que cai é uma fatia da própria textura da cerveja. Tudo arte do Higgsfield; o código só gira e recorta.
function desenhaCerveja(ctx, c) {
  const copo = spr('salao/copo_americano'), dentro = spr('salao/copo_americano_dentro'), liq = spr('salao/liquido_cerveja'), esp = spr('salao/espuma_cerveja'), gar = spr('salao/garrafa_cerveja');
  const W = G.larg, H = G.alt;
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 0, W, H); ctx.restore();
  if (!copo) return;
  const g0 = COPO.GEO.cerveja, W0 = copo.naturalWidth, H0 = copo.naturalHeight;
  // o copo um pouco menor que o do bebedouro e mais baixo: a garrafa despejando cabe em cima dele, abaixo do painel do topo
  const e = Math.min(1.2, H * 0.42 / H0), w = W0 * e, h = H0 * e, x = W / 2 - w / 2 - 60 * e, y = H / 2 - h / 2 + 40 * e;
  const ang = c.inclinado ? CERVEJA.ANGULO : 0, px = x + w / 2, py = y + h;   // o copo gira no pé
  const yLiq = g0.fundo - (g0.fundo - g0.topo) * Math.min(1, c.liq), yEsp = g0.fundo - (g0.fundo - g0.topo) * Math.min(1, c.liq + c.esp);
  if (dentro && liq && esp) {
    const off = _copoTela || (_copoTela = document.createElement('canvas'));
    off.width = W0; off.height = H0;
    const g = off.getContext('2d'), k = ang ? 1.35 : 1;
    g.clearRect(0, 0, W0, H0);
    if (c.nivel > 0.005) {
      g.save(); g.translate(W0 / 2, yLiq); g.rotate(-ang); g.scale(k, k);
      if (c.esp > 0.005) g.drawImage(esp, -W0 / 2, -(yLiq - yEsp) / k);
      g.drawImage(liq, -W0 / 2, 0);
      g.restore();
    }
    g.globalCompositeOperation = 'destination-in'; g.drawImage(dentro, 0, 0); g.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.translate(px, py); ctx.rotate(ang); ctx.drawImage(off, -w / 2, -h, w, h); ctx.restore();
  }
  ctx.save(); ctx.translate(px, py); ctx.rotate(ang); ctx.drawImage(copo, -w / 2, -h, w, h);
  // (revisão) a marquinha dos "dois dedos" do lado do copo (linha fina de interface, como a barrinha): onde a cerveja para e onde
  // o colarinho chega, com o copo cheio no ponto que o robô mira
  { const yA = f => -h + (g0.fundo - (g0.fundo - g0.topo) * f) * e, cheio = 0.92, liqA = cheio * (1 - CERVEJA.ALVO), xm = w / 2 + 8;
    ctx.strokeStyle = 'rgba(255,236,190,.85)'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(xm, yA(liqA)); ctx.lineTo(xm, yA(cheio)); ctx.moveTo(xm - 6, yA(liqA)); ctx.lineTo(xm + 4, yA(liqA)); ctx.moveTo(xm - 6, yA(cheio)); ctx.lineTo(xm + 4, yA(cheio));
    ctx.stroke(); }
  ctx.restore();
  // a boca do copo na tela (gira com ele), onde a garrafa mira
  const bx = px + Math.sin(ang) * (H0 - g0.topo) * e, by = py - Math.cos(ang) * (H0 - g0.topo) * e;
  if (gar) {
    const gw = gar.naturalWidth * e * 0.8, gh = gar.naturalHeight * e * 0.8;
    if (c.segurando) {
      const th = -1.95, dx = Math.sin(th), dy = -Math.cos(th);   // o gargalo para baixo e para a esquerda, em cima da boca
      const mx = bx + 12 * e, my = by - 40 * e, cx = mx - dx * gh / 2, cy = my - dy * gh / 2;
      if (liq) { const yS = c.inclinado ? by + 30 * e : py - (H0 - (c.liq + c.esp >= 1 ? g0.topo : yEsp)) * e;   // o fio de cerveja
        ctx.drawImage(liq, W0 / 2 - 5, 40, 10, 200, mx - 5 * e, my, 10 * e, Math.max(0, yS - my)); }
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(th); ctx.drawImage(gar, -gw / 2, -gh / 2, gw, gh); ctx.restore();
    } else { ctx.save(); ctx.translate(x + w + 120 * e, py - gh / 2); ctx.rotate(-0.12); ctx.drawImage(gar, -gw / 2, -gh / 2, gw, gh); ctx.restore(); }
  }
  texto(ctx, Pratos.BEBIDAS[c.bebida], x + w / 2, y + h + 30, 28, '#fff', '900');   // embaixo do copo (em cima fica a garrafa)
  texto(ctx, c.msg, W / 2, y + h + 62, 22, '#ffe08a', '800');
}
// ---------- (14/10, Tarefa E2) a caipirinha do Seu Orlando: o coquetel do Dave, em sequência ----------
// Como é no Dave: o coquetel do Bancho é uma sequência de ingredientes a seguir, liberado pelo presente de um VIP, com a nota na
// tela; um funcionário com a habilidade faz sozinho. Aqui, no balcão do bebedouro: 1) socar o limão no ritmo (o socador sobe e
// desce sozinho, com um tique a cada batida; clicar, ou o Espaço, com ele lá em cima soca: CAIPI.SOCOS socos no ritmo); 2) o
// açúcar, o gelo e a cachaça na ordem da receita, que aparece em cima (sorteada a cada caipirinha; clicar no ingrediente da
// bancada, ou as teclas 1, 2 e 3). Notas: a receita certa é PERFEITA ('medida', o carimbo NA MEDIDA!); um ingrediente fora da
// ordem, BOA ('ok', QUASE!); dois ou mais, RUIM ('ruim', DESANDOU!); socar fora do ritmo CAIPI.FORA_MAX vezes ou mais rebaixa uma
// nota. Toda a arte é do Higgsfield (produzir_caipirinha.sh + web_caipirinha.py); o código só move, gira, escala e esmaece.
const CAIPI = { BATIDA: 0.5, JANELA: 0.13, SOCOS: 4, FORA_MAX: 3, GOLPE: 0.12, CAI: 0.3, DESPEJO: 0.7, PRONTA: 0.7 };
// O lado de dentro do copo baixo (web_caipirinha.py imprime): a boca, o fundo e as paredes, em fração da tela do copo (a mesma
// tela da caipirinha pronta, que entra no lugar dele no fim).
const CAIPI_GEO = { boca: 0.243, fundo: 0.864, esq: 0.030, dir: 0.830 };
// Os ingredientes da bancada: o nome, a arte na bancada (alt: a altura em fração da tela), a arte que cai no copo (larg: a
// largura em fração do lado de dentro) e o som.
const CAIPI_ING = {
  acucar: { nome: 'Açúcar', arte: 'salao/acucareiro', alt: 0.15, dentro: 'salao/acucar_monte', larg: 0.5, som: 'caipi_acucar' },
  gelo: { nome: 'Gelo', arte: 'salao/gelo_pedras', alt: 0.13, dentro: 'salao/gelo_pedras', larg: 0.62, som: 'caipi_gelo' },
  cachaca: { nome: 'Cachaça', arte: 'salao/garrafa_cachaca', alt: 0.24, som: 'caipi_despeja' } };
const CAIPI_BOTOES = ['acucar', 'gelo', 'cachaca'];   // na bancada, da esquerda para a direita (as teclas 1, 2 e 3)
// A receita desta caipirinha: o açúcar, o gelo e a cachaça embaralhados (sorteio fixo pelo dia, a hora e as bebidas da noite).
function abrirCaipirinha() {
  const ord = CAIPI_BOTOES.slice(), f = mulberry(((G.dia || 1) * 977 + Math.round(G.minutos || 0) * 13 + ((G.turno && G.turno.relatorio.bebidas) || 0) * 7) >>> 0);
  for (let k = ord.length - 1; k > 0; k--) { const j = Math.floor(f() * (k + 1)); [ord[k], ord[j]] = [ord[j], ord[k]]; }
  return { bebida: 'caipirinha', caipi: true, fase: 'socar', t: 0, batidas: 0, socos: 0, foras: 0, golpe: 0, ordem: ord, postos: [], erros: 0,
    anim: null, nota: '', msg: 'Soque o limão: clique (ou Espaço) quando o socador subir todo!' };
}
// A nota: os erros de ordem (0 → PERFEITA, 1 → BOA, 2 ou mais → RUIM), uma abaixo com o ritmo ruim.
function notaDaCaipirinha(erros, foras) { return ['medida', 'ok', 'ruim'][Math.min(2, Math.min(2, erros) + (foras >= CAIPI.FORA_MAX ? 1 : 0))]; }
// O socador: a altura (0 embaixo, 1 lá em cima), no ritmo: lá em cima na batida. Na batida: perto dela (a janela), passada a 1ª.
function caipiAltura(c) { const f = c.t % CAIPI.BATIDA; return 1 - Math.min(f, CAIPI.BATIDA - f) / (CAIPI.BATIDA / 2); }
function caipiNaBatida(c) { const f = c.t % CAIPI.BATIDA; return c.t > CAIPI.BATIDA - CAIPI.JANELA && Math.min(f, CAIPI.BATIDA - f) <= CAIPI.JANELA; }
function caipiSoco() {
  const c = G.copo;
  if (!c || !c.caipi || c.fase !== 'socar' || c.golpe > CAIPI.GOLPE * 0.5) return false;
  c.golpe = CAIPI.GOLPE;
  if (caipiNaBatida(c)) { c.socos++; sons.tocar('caipi_soco', 1, 0.06, -4); c.msg = c.socos >= CAIPI.SOCOS ? 'Limão socado! Agora a receita, na ordem.' : `Isso! ${c.socos} de ${CAIPI.SOCOS}.`; }
  else { c.foras++; sons.tocar('caipi_soco', 0.8, 0.04, -12); c.msg = 'Fora do ritmo! Espere o socador subir todo.'; }
  if (c.socos >= CAIPI.SOCOS) { c.fase = 'montar'; if (G.limpou) G.limpou.caipi_socar = (G.limpou.caipi_socar || 0) + 1; }
  return true;
}
// Um ingrediente no copo: fora da ordem da receita conta um erro (vai assim mesmo); cada um uma vez.
function caipiPor(id) {
  const c = G.copo;
  if (!c || !c.caipi || c.fase !== 'montar' || c.anim || !CAIPI_ING[id] || c.postos.includes(id)) return false;
  const certo = c.ordem.find(x => !c.postos.includes(x)), I = CAIPI_ING[id];
  if (id !== certo) { c.erros++; sons.tocar('acao_erro', 1, 0.04, -10); c.msg = `Fora da receita! Era ${CAIPI_ING[certo].nome.toLowerCase()}.`; }
  else c.msg = id === 'cachaca' ? 'A cachaça!' : `${I.nome}!`;
  c.postos.push(id); c.anim = { id, t: 0, dur: id === 'cachaca' ? CAIPI.DESPEJO : CAIPI.CAI };
  sons.tocar(I.som, 1, 0.06, -4);
  return true;
}
function caipiTecla(n) { const c = G.copo; if (!c || !c.caipi) return false; return c.fase === 'socar' ? caipiSoco() : caipiPor(CAIPI_BOTOES[n - 1]); }
// O clique na tela (px de tela): socando, soca em qualquer lugar; montando, o ingrediente da bancada que foi clicado.
function caipiClique(x, y) {
  const c = G.copo; if (!c || !c.caipi) return false;
  if (c.fase === 'socar') return caipiSoco();
  const b = (c._botoes || []).find(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  return b ? caipiPor(b.id) : false;
}
function caipiPronta() {
  const c = G.copo; c.fase = 'pronta'; c.t = 0; c.nota = notaDaCaipirinha(c.erros, c.foras);
  sons.tocar('caipi_pronta', 1, 0.03, -4);
  c.msg = { medida: 'Caipirinha caprichada!', ok: 'Caipirinha boa, mas saiu da receita.', ruim: 'A caipirinha desandou...' }[c.nota];
  if (G.limpou) G.limpou.caipirinha = (G.limpou.caipirinha || 0) + 1;
}
ATUALIZADORES.push(dt => {
  const c = G.copo;
  if (!c || !c.caipi) return;
  if (!noPalco()) { G.copo = null; return; }
  c.t += dt; if (c.golpe > 0) c.golpe = Math.max(0, c.golpe - dt);
  if (c.fase === 'socar') { const k = Math.floor(c.t / CAIPI.BATIDA); if (k > c.batidas) { c.batidas = k; sons.tocar('cursor', 1.3, 0, -16); } }   // o tique da batida
  if (c.anim) { c.anim.t += dt; if (c.anim.t >= c.anim.dur) { c.anim = null; if (c.postos.length >= CAIPI_BOTOES.length) caipiPronta(); } }
  if (c.fase === 'pronta' && c.t >= CAIPI.PRONTA) copoFim(c.nota);
});
// O robô (como quem joga bem): soca lá em cima de cada batida e põe na ordem da receita. Devolve true quando terminou.
function roboCaipirinha(c, passa) {
  for (let k = 0; k < 30 && G.copo === c && c.fase === 'socar'; k++) {
    passa(() => c.t < CAIPI.BATIDA / 2 || caipiAltura(c) < 0.97 || c.golpe > CAIPI.GOLPE * 0.5);
    caipiSoco(); passa(() => caipiAltura(c) > 0.5);
  }
  for (const id of c.ordem.slice()) { passa(() => !!c.anim); caipiPor(id); }
  passa(() => true);
  return G.copo !== c;
}

// O desenho (em px de tela, entre o painel do topo e o rodapé do salão): o copo no meio da bancada (o limão, o açúcar e o gelo por
// dentro; socando, o socador sobe e desce), a receita em cima e, na bancada, o açúcar e o gelo à esquerda e a cachaça à direita.
const CAIPI_BANCADA = [-380, -220, 240];   // o x de cada ingrediente, do meio da tela (px de 1280 de largura)
function desenhaCaipirinha(ctx, c) {
  const W = G.larg, H = G.alt;
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, 0, W, H); ctx.restore();
  const copo = spr('salao/copo_caipirinha'); if (!copo) return;
  const g0 = CAIPI_GEO, chao = H * 0.6, e = Math.min(1.25, H * 0.29 / copo.naturalHeight), w = copo.naturalWidth * e, h = copo.naturalHeight * e;
  const x = W / 2 - (g0.esq + g0.dir) / 2 * w, y = chao - h;
  const fx = x + g0.esq * w, fw = (g0.dir - g0.esq) * w, cx = fx + fw / 2, fy = y + g0.fundo * h, by = y + g0.boca * h;
  // uma peça com o pé em (px, py) e a largura larg (a altura pela proporção da arte); esc: achata na altura
  const poe = (nome, px, py, larg, alfa = 1, esc = 1) => { const im = spr(nome); if (!im) return 0;
    const hh = im.naturalHeight * larg / im.naturalWidth * esc;
    if (alfa > 0) { ctx.save(); ctx.globalAlpha *= alfa; ctx.drawImage(im, px - larg / 2, py - hh, larg, hh); ctx.restore(); } return hh; };
  const frase = (linhas, xc, y0) => linhas.forEach((l, i) => texto(ctx, l, xc, y0 + i * 22, 18, i ? '#ffffff' : '#fff4cf', '900'));
  // por dentro: o limão (os gomos viram o limão socado a cada soco; achata no golpe), depois o açúcar e o gelo na ordem em que entraram
  const s = Math.min(1, c.socos / CAIPI.SOCOS), ach = 1 - 0.18 * (c.golpe / CAIPI.GOLPE), pe = fy + fw * 0.03;
  const hl = poe('salao/limao_gomos', cx, pe, fw * 0.62, 1 - s, ach) || fw * 0.5;
  poe('salao/limao_socado', cx, pe, fw * 0.66, s, ach);
  let base = pe - hl * 0.35;
  for (const id of c.postos) {
    const I = CAIPI_ING[id]; if (!I.dentro) continue;
    const an = c.anim && c.anim.id === id ? clamp(c.anim.t / c.anim.dur, 0, 1) : 1, cai = (1 - an) * (1 - an) * H * 0.2;
    const hh = poe(I.dentro, cx, base - cai, fw * I.larg, Math.min(1, 0.3 + an));
    base -= hh * (id === 'gelo' ? 0.25 : 0.35);
  }
  // o socador (socando): sobe e desce no ritmo; no golpe, a ponta no limão
  let soc = null;
  if (c.fase === 'socar') {
    const sc = spr('salao/socador');
    if (sc) { const sh = H * 0.21, sw = sc.naturalWidth * sh / sc.naturalHeight, baixo = pe - hl * 0.45, alto = by - H * 0.02;
      const ponta = c.golpe > 0 ? baixo : baixo - caipiAltura(c) * (baixo - alto), sx = cx + fw * 0.06;
      ctx.save(); ctx.translate(sx, ponta); ctx.rotate(0.06); ctx.drawImage(sc, -sw / 2, -sh, sw, sh); ctx.restore();
      soc = { x: sx, topo: ponta - sh, larg: sw }; }
  }
  ctx.drawImage(copo, x, y, w, h);
  // pronta: a caipirinha entra no lugar do copo, devagar
  if (c.fase === 'pronta') { const pr = spr('salao/caipirinha_pronta'); if (pr) { ctx.save(); ctx.globalAlpha = clamp(c.t / 0.4, 0, 1); ctx.drawImage(pr, x, y, w, h); ctx.restore(); } }
  // a bancada (montando): o açucareiro, o gelo e a garrafa, com o nome e a tecla; o que já foi para o copo fica apagado
  c._botoes = [];
  const k1 = Math.min(1, W / 1280), bxDe = k => W / 2 + CAIPI_BANCADA[k] * k1;
  if (c.fase !== 'socar') {
    CAIPI_BOTOES.forEach((id, k) => {
      const I = CAIPI_ING[id], im = spr(I.arte); if (!im) return;
      const bh = H * I.alt, bw = im.naturalWidth * bh / im.naturalHeight, bx = bxDe(k);
      const usado = c.postos.includes(id), despejando = c.anim && c.anim.id === id && id === 'cachaca';
      c._botoes.push({ id, x: bx - Math.max(bw, 100) / 2, y: chao - bh, w: Math.max(bw, 100), h: bh + 34 });
      if (!despejando) { ctx.save(); ctx.globalAlpha = usado ? 0.3 : 1; ctx.drawImage(im, bx - bw / 2, chao - bh, bw, bh); ctx.restore(); }
      texto(ctx, `${I.nome} (${k + 1})`, bx, chao + 26, 20, usado ? '#9a917f' : '#fff4cf', '900');
    });
    // a cachaça: a garrafa sai da bancada, deita em cima da boca do copo e despeja
    if (c.anim && c.anim.id === 'cachaca') {
      const gar = spr('salao/garrafa_cachaca'), I = CAIPI_ING.cachaca;
      if (gar) { const p = clamp(c.anim.t / (c.anim.dur * 0.35), 0, 1), gh = H * I.alt, gw = gar.naturalWidth * gh / gar.naturalHeight, th = -1.95;
        const x0 = bxDe(2), y0 = chao - gh / 2, mx = cx + fw * 0.12, my = by - 16, x1 = mx - Math.sin(th) * gh / 2, y1 = my + Math.cos(th) * gh / 2;
        ctx.save(); ctx.translate(x0 + (x1 - x0) * p, y0 + (y1 - y0) * p); ctx.rotate(th * p); ctx.drawImage(gar, -gw / 2, -gh / 2, gw, gh); ctx.restore(); }
    }
    // a receita, em cima: os três passos na ordem, com a arte de cada um; o que já foi feito fica apagado
    const rx = k => W / 2 + (k - 1) * 170, ry = H * 0.25;
    texto(ctx, 'Receita:', rx(0) - 140, ry - 14, 22, '#ffe08a', '900');
    c.ordem.forEach((id, k) => {
      const I = CAIPI_ING[id], im = spr(I.arte), feito = k < c.postos.length;
      if (im) { const ih = H * 0.08, iw = im.naturalWidth * ih / im.naturalHeight; ctx.save(); ctx.globalAlpha = feito ? 0.35 : 1; ctx.drawImage(im, rx(k) - iw / 2, ry - ih, iw, ih); ctx.restore(); }
      texto(ctx, `${k + 1}. ${I.nome}`, rx(k), ry + 26, 20, feito ? '#9a917f' : '#fff', '900');
      if (k < 2) texto(ctx, '→', rx(k) + 85, ry - 14, 26, '#ffe08a', '900');
    });
  } else texto(ctx, `Socos no ritmo: ${c.socos} de ${CAIPI.SOCOS}`, W / 2, H * 0.7, 24, '#ffe08a', '900');
  const guia = !((G.limpou || {}).caipirinha > 0) && c.fase !== 'pronta';
  texto(ctx, c.msg, W / 2, H * (c.fase === 'socar' ? 0.745 : guia ? 0.78 : 0.72), 24, c.fase === 'pronta' && c.nota === 'ruim' ? '#ffb4a8' : '#ffe08a', '800');
  // a primeira vez (o guia): a seta no socador e, montando, no ingrediente que a receita pede agora, com a frase junto
  if (guia) {
    const seta = spr('ui/seta'), sw = 68 * 0.7, sh = 96 * 0.7, bob = Math.sin((G.agora || 0) * 6) * 5;
    if (c.fase === 'socar' && soc) {   // da direita, apontando para o cabo do socador
      const py = soc.topo + H * 0.05, px = soc.x + soc.larg / 2 + 6;
      if (seta) { ctx.save(); ctx.translate(px + sh / 2 + bob, py); ctx.rotate(Math.PI / 2); ctx.drawImage(seta, -sw / 2, -sh / 2, sw, sh); ctx.restore(); }
      frase(['Clique (ou Espaço) quando o socador', 'subir todo: no tique, soca o limão!'], px + sh + 175, py - 4);
    } else if (c.fase === 'montar' && !c.anim) {   // de cima, apontando para o ingrediente; a frase embaixo do nome dele
      const prox = c.ordem.find(q => !c.postos.includes(q)), b = c._botoes.find(r => r.id === prox);
      if (b) { if (seta) ctx.drawImage(seta, b.x + b.w / 2 - sw / 2, b.y - sh - 6 - bob, sw, sh);
        frase([`A receita pede agora: ${CAIPI_ING[prox].nome.toLowerCase()}.`, 'Clique nele (ou na tecla do número)!'], b.x + b.w / 2, chao + 52); }
    }
  }
}
// ---------- (Tarefa C, o wasabi do Dave) a farinheira: o alerta e a peneira com tempo ----------
// (revisão, o Dave: só avisa com o wasabi no fim) Com t.alertaFarinha() ou menos (um terço da farinheira, no mínimo 3), a exclamação pisca em cima da farinheira (a arte fx/exclamacao; o código só acende e apaga); a Rosa
// chama uma vez (o evento 'farinha_baixa', pensao_tela.js). Repor: o Jocelino peneira PENEIRA.jocelino s parado (a barrinha em
// cima dele: a moldura é arte, o enchimento é luz de interface). Clicar em outro lugar ou andar interrompe: o que já foi peneirado
// fica em t._peneirado (o próximo clique continua de onde parou).
function desenhaAlertaFarinha(ctx) {
  const t = G.turno;
  if (!t || t.farinha > t.alertaFarinha() || G.peneira) return;
  if (Math.floor(performance.now() / 350) % 2 && MODO_TESTE.efeitos) return;   // pisca (no modo de teste, fica aceso para a foto)
  const F = PALCO.FARINHEIRA;
  desenhaFx(ctx, 'exclamacao', F.cx, F.y - 40, { escala: 2.2 });
}
function comecarPeneira() {
  const t = G.turno; if (!t || G.peneira) return false;
  G.peneira = { t: t._peneirado || 0, dur: TurnoJanta.peneira('jocelino') };
  G.jog.dir = DIR.CIMA; G.jog.andando = false;
  sons.tocar('farinha', 0.9, 0.05, -8);
  avisar(G.peneira.t > 0 ? 'Continuando a peneirar a farinha...' : 'Peneirando a farinha... (fique parado até a barrinha encher)');
  return true;
}
function pararPeneira() {
  const t = G.turno, pn = G.peneira; G.peneira = null;
  if (t && pn && pn.t < pn.dur) { t._peneirado = pn.t; avisar('Parou de peneirar: o que já peneirou fica guardado.'); }
}
ATUALIZADORES.push(dt => {
  const pn = G.peneira, t = G.turno, j = G.jog;
  if (!pn) return;
  if (!t || !noPalco()) { G.peneira = null; return; }
  const k = G.teclas;
  if (j.alvoPalco || [TECLAS.esquerda, TECLAS.direita, 'ArrowLeft', 'ArrowRight'].some(c => k.has(c))) { pararPeneira(); return; }
  j.dir = DIR.CIMA; j.andando = false;
  pn.t += dt;
  if (pn.t < pn.dur) return;
  G.peneira = null;
  const r = t.reporFarinha();
  if (r === 'ok') { avisar('Farinheira cheia de novo!'); sons.tocar('farinha', 1, 0.05, -4); }
  else avisar(r === 'cheia' ? 'A farinheira já estava cheia.' : 'Acabou a farinha na despensa! Compre na Mercearia do Seu Ananias.');
});
function desenhaPeneira(ctx) {
  const pn = G.peneira, j = G.jog;
  if (!pn || !j || !spr('fx/barra_moldura')) return;
  const y = j.y - 114 * PALCO.ESCALA_GENTE - 30, f = clamp(pn.t / pn.dur, 0, 1);
  desenhaFx(ctx, 'barra_moldura', j.x, y);
  ctx.fillStyle = '#e8c22c'; ctx.fillRect(j.x - 26, y - 2, 52 * f, 4);
}

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
    if (A && Math.abs(A.x + 34 - j.x) < 44) { const v = t.recolherMoedas(x.mesa); if (v) { tocarSomDoEvento({ tipo: 'gorjeta' }); flutuar(j.x, j.y - 170, `+Cr$ ${v} gorjeta`, '#ffd34d'); } }
  }
});
// O que acontece na janta e o jogador precisa ver (a farinheira acabou).
ATUALIZADORES.push(() => {
  const t = G.turno;
  if (!t || !noPalco()) return;
  if (t._avisouFarinha && !t._mostrouFarinha) { t._mostrouFarinha = true; avisar('A farinheira acabou! A Rosa parou: clique na farinheira e peneire mais farinha.'); setTimeout(() => sons.tocar('rosa_resmunga', 1, 0.05, -4), 600); }   // depois do "deu ruim" (somDoEvento 'farinha')
  if (!t._avisouFarinha) t._mostrouFarinha = false;
});

// ---------- Adiantar (o "Time Skip" do Bancho) ----------
// (C8, 16/10; o teste crítico C, solução 5) Fora da janta, o Adiantar anda em DOIS passos: antes do meio-dia leva às 13h ("depois do
// almoço"), e do meio-dia às 17h, à janta. O teste crítico viu o Adiantar das ~8h pular direto para as 17h: o meio do dia sumia e a vida
// de dia (a pesca, a horta, a coleta) não tinha vez. Como no Dave: o dia é o mergulho da manhã, o da tarde e a noite no Bancho. Quem quer
// pular tudo clica duas vezes; às 13h a Rosa traz o convite da tarde (cartao.js: o que falta no cardápio de hoje, com o valor na janta).
const ADIANTAR_ALMOCO = 12 * 60, ADIANTAR_TARDE = 13 * 60;
// Para onde o Adiantar leva agora, fora da janta: 13h, 17h (a janta) ou null (hoje não tem janta para adiantar).
function adiantarPara() {
  if (G.turno || !G.pensao || !pensaoAbreHoje() || G.pensao.ultimaJanta === G.dia || G.minutos >= TurnoJanta.ABRE) return null;
  return G.minutos < ADIANTAR_ALMOCO ? ADIANTAR_TARDE : TurnoJanta.ABRE;
}
// Às 13h, depois do Adiantar: a Rosa fala do almoço e do convite da tarde. A 1ª vez (G.limpou.adiantar_dois), ela explica os dois passos
// numa fala e a seta da tela vai no Adiantar ("de novo: até a janta", guia_setas.js); depois, só um aviso curto com o convite.
function depoisDoAlmoco() {
  const c = typeof conviteDaTarde === 'function' ? conviteDaTarde() : null, v = c && c.convite;
  const conv = v ? (v.tipo === 'melhora' ? ` ${v.fala}` : ` Pra janta de hoje falta ${nomeNaPanela(v.k)}: ${v.fala.charAt(0).toLowerCase() + v.fala.slice(1)}`) : ' A tarde é sua: a horta, a pesca, um passeio.';   // (C9) a melhora: "A janta já tá garantida, mas..."
  if (c && typeof marcaConvite === 'function') marcaConvite(c);
  if (v && G.limpou && !G.limpou.convite_tarde_dia) G.limpou.convite_tarde_dia = G.dia;   // (esta é a frase do 1º convite: a do cartao.js não repete)
  if (G.limpou && !G.limpou.adiantar_dois) {
    G.limpou.adiantar_dois = 1;
    abrirConversa('Rosa', urlArte('retratos/rosa_normal'), [`Uma da tarde: hora do almoço, Jocelino.${conv} Quando quiser ir direto pra janta, clica de novo no Adiantar: ele leva até as 17h.`]);
  } else avisar(`13h, depois do almoço.${conv}`);
}
function palcoAdiantar() {
  const t = G.turno;
  if (!t) {
    const para = adiantarPara();
    if (para != null) {
      G.minutos = para; relogio._acum = 0;
      if (para === ADIANTAR_TARDE) depoisDoAlmoco(); else if (G.limpou && G.limpou.adiantar_dois === 1) G.limpou.adiantar_dois = 2;   // (o 2º passo feito: a seta some)
      return true;
    }
    if (jantaEsperaCardapio()) { pensaoQuadro(); return false; }   // (o cardápio do Bancho) às 17h a janta espera o quadro
    avisar('Não tem janta para adiantar agora.'); return false;
  }
  if (t.mesas.some(m => ['chegando', 'pedido', 'prato'].includes(m.estado))) { avisar('Ainda tem gente esperando.'); return false; }
  const prox = t.proximaChegada();
  if (prox < 0) { if (t.mesas.some(m => m.estado === 'comendo')) { avisar('Ainda tem gente comendo.'); return false; } G.minutos = TurnoJanta.FECHA; relogio._acum = 0; return true; }
  // (revisão da E4a, na E4b) a banqueta da ponta reservada só conta para a turma: o próximo freguês comum não senta nela, e a turma
  // que vem a seguir senta (a reservada é a vaga dela, não "gente esperando banqueta")
  { const turmaVem = !!(t._turma && t._turma.length && t.encomenda && prox === t.encomenda.chegada), ponta = (t.encomenda && !t.encomenda.saiu && t.encomenda.ponta) || [];
    const vaga = t.mesas.some((m, i) => (m.estado === 'livre' && (turmaVem || !t.encomenda || !t.encomenda.reservou || !ponta.includes(i))) || (turmaVem && m.estado === 'reservada'));
    if (!vaga) { avisar(!turmaVem ? 'Recolha a louça: tem gente esperando banqueta.' : ponta.some(i => t.mesas[i] && t.mesas[i].estado === 'suja')
      ? 'Recolha a louça da ponta: a turma da festa espera banqueta.' : 'A turma da festa espera uma banqueta da ponta vagar.'); return false; } }
  if (prox <= G.minutos) { avisar('O próximo cliente já está chegando.'); return false; }
  G.minutos = prox; relogio._acum = 0;
  return true;
}

// ---------- o rodapé (Cardápio, Despensa, Semana, Farinha, Adiantar, Sair) ----------
function rodapePalco() {
  let r = $('#rodape-palco');
  if (!r) {
    // (13/10, o tema do restaurante) A barra de madeira com as tábuas (as abas do Bancho), a arte do kit a/ui/pensao.
    r = el('div', { id: 'rodape-palco', class: 'barra-madeira rodape-palco', hidden: true },
      el('button', { class: 'tabua', title: 'As metas da Rosa: cumpra para ganhar prêmios e subir a pensão', onclick: e => { e.stopPropagation(); abrirMetas(); } }, 'Metas'),
      el('button', { class: 'tabua', title: 'O cardápio da noite: os pratos e quantas panelas de cada um', onclick: e => { e.stopPropagation(); pensaoQuadro(); } }, 'Cardápio'),
      el('button', { class: 'tabua', title: 'O caderno da Rosa: caprichar os pratos e pesquisar receitas novas', onclick: e => { e.stopPropagation(); abrirCaderno(); } }, 'Receitas'),
      el('button', { class: 'tabua', title: 'A fama da pensão: as estrelas, o que cada degrau pede e o que abre', onclick: e => { e.stopPropagation(); abrirPainelPensao(); } }, 'A Pensão'),
      el('button', { class: 'tabua', title: 'Os ajudantes: contratar, treinar e escolher o posto de cada um', onclick: e => { e.stopPropagation(); abrirEquipe(); } }, 'Equipe'),
      el('button', { class: 'tabua', title: 'Comprar coisas para o salão: mais gorjeta, paciência, clientes', onclick: e => { e.stopPropagation(); abrirMelhorias(); } }, 'Melhorias'),
      el('button', { class: 'tabua', title: 'Os ingredientes guardados e quantas panelas cada prato dá', onclick: e => { e.stopPropagation(); abrirDespensa(); } }, 'Despensa'),
      // (14/10, Tarefa E1) o calendário: a semana da pensão na lousa, quem vem jantar, as festas, o domingo fechado (calendario_pensao.js;
      // "Semana" e não "Calendário": com o Concurso aceso, o rodapé não cabia em 1280 px, a s31)
      el('button', { class: 'tabua bt-calendario', title: 'A semana da pensão: quem vem jantar, as festas e o domingo fechado', onclick: e => { e.stopPropagation(); abrirCalendarioPensao(); } }, 'Semana'),
      el('button', { class: 'tabua acesa bt-concurso', hidden: true, onclick: e => { e.stopPropagation(); abrirConcurso(); } }, 'Concurso 🎙'),
      el('div', { class: 'farinha', title: 'A farinheira: cada prato que a Rosa termina gasta 1 de farinha; vazia, a cozinha para. Para repor, clique na farinheira do salão (usa a farinha da despensa).' }, el('img', { src: urlArte('salao/farinheira') }), el('span', {}, '')),
      el('button', { class: 'tabua bt-adiantar', title: 'Pula o tempo até o próximo cliente (antes das 17h, até a janta)', onclick: e => { e.stopPropagation(); palcoAdiantar(); } }, 'Adiantar ▸▸',
        el('span', { class: 'adiantar-para', style: 'display:block; font-size:max(10px, .75em); line-height:1; margin-top:-2px' }, '')),   // (C8) para onde vai, na linha de baixo (o rodapé não cabe mais largo); (C9, a revisão da C8) no mínimo 10 px: com .62em ficava ~8 px na 960 e no celular
      el('button', { class: 'tabua', onclick: e => { e.stopPropagation(); sairDoPalco(); } }, 'Sair'));
    document.body.append(r);
  }
  return r;
}
ATUALIZADORES.push(() => {
  const r = rodapePalco(), ver = noPalco() && !(typeof emReforma === 'function' && emReforma());   // na reforma, a barra de itens (não a da janta)
  if (r.hidden === ver) r.hidden = !ver;
  const barra = $('#hud .barra'); if (barra) barra.style.visibility = ver ? 'hidden' : '';
  { const dica = $('#hud .dica-barra'); if (dica) dica.style.visibility = ver ? 'hidden' : ''; }   // (tarefa 7: o "Tab: próxima fileira" da barra escondida flutuava em cima do rodapé)
  if (!ver) return;
  const bc = r.querySelector('.bt-concurso'), cv = typeof podeConcurso === 'function' && podeConcurso(); if (bc.hidden === cv) bc.hidden = !cv;
  // (C8) o Adiantar diz para onde vai: "até as 13h" (antes do meio-dia), "até a janta" (do meio-dia às 17h); na janta, o próximo cliente
  { const ba = r.querySelector('.bt-adiantar'), sp = ba.querySelector('.adiantar-para'), para = adiantarPara();
    const tx = para === ADIANTAR_TARDE ? 'até as 13h' : para != null ? 'até a janta' : '';
    if (sp.textContent !== tx) { sp.textContent = tx; sp.style.display = tx ? 'block' : 'none'; ba.title = para === ADIANTAR_TARDE ? 'Pula até as 13h, depois do almoço (de novo: até a janta, às 17h)' : para != null ? 'Pula até as 17h: a janta' : 'Pula o tempo até o próximo cliente'; } }
  const txt = G.turno ? `${G.turno.farinha}/${G.turno.farinhaMax || TurnoJanta.FARINHA_MAX}` : '—';
  const sp = r.querySelector('.farinha span'); if (sp.textContent !== txt) sp.textContent = txt;
  const im = r.querySelector('.farinha img'), src = urlArte(farinheiraVazia() ? 'salao/farinheira_vazia' : 'salao/farinheira');   // (16/10) o ícone também esvazia
  if (im.getAttribute('src') !== src) im.setAttribute('src', src);
});
// A farinheira está vazia? Na janta, a do balcão (t.farinha); fora dela, a da despensa (sem pacote de farinha, vazia).
function farinheiraVazia() {
  if (G.turno) return G.turno.farinha <= 0;
  return !!(G.pensao && G.pensao.despensa && (G.pensao.despensa.farinha || 0) <= 0);
}

// (revisão da D1) O lugar de esperar do Zezinho e dos ajudantes não fica em cima da bancada do passe: quem cairia nela (com uma
// folga de 30 px de cada lado) vai para a esquerda dela, a largura da faixa inteira (os ajudantes continuam a 60 px um do outro).
function foraDaBancada(x) {
  if (typeof temMelhoria !== 'function' || !temMelhoria('bancada_passe')) return x;
  const A = PALCO.BANCADA.area, l = A.x - 30, r = A.x + A.w + 30;
  return x > l && x < r ? x - (r - l) : x;
}
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
  if (!FILHOS.zezinho) { const z = FILHOS.zezinho = new Personagem('zezinho', 'Zezinho', foraDaBancada(PALCO.CASA_ZE), PALCO.CHAO_Y - 6, DIR.ESQUERDA); z.tarefa = null; z.espera = 5; }
  return [FILHOS.zezinho];
}
ATUALIZADORES.push(dt => {
  const t = G.turno, z = FILHOS.zezinho;
  if (FILHOS.ritinha) { FILHOS.ritinha.t += dt; FILHOS.ritinha.andando = false; FILHOS.ritinha.x = PALCO.RITINHA_X; }
  // (14/10) só o Zezinho da noite: o de uma janta anterior (FILHOS.zezinho ficava guardado) recolhia louça invisível
  if (!t || !noPalco() || !z || t.filho !== 'zezinho') return;
  z.t += dt;
  if (!z.tarefa) {
    z.andando = false; z.espera -= dt;
    if (z.espera > 0) return;
    z.espera = 6;                                                  // criança: faz uma coisa e para um pouco
    const i = t.mesas.findIndex((m, k) => k < PALCO.ASSENTOS.length && (m.estado === 'suja' || m.louca) && !AJUDANTES.some(o => o.tarefa && o.tarefa.i === k));
    const casaZe = foraDaBancada(PALCO.CASA_ZE);
    z.tarefa = i >= 0 ? { tipo: 'louca', i, x: PALCO.ASSENTOS[i].x } : (Math.abs(z.x - casaZe) > 4 ? { tipo: 'casa', x: casaZe } : null);
    if (!z.tarefa) return;
  }
  const dx = z.tarefa.x - z.x;
  if (Math.abs(dx) > 5) { z.x += Math.sign(dx) * Math.min(Math.abs(dx), FILHO_ZE_VEL * dt); z.dir = dx < 0 ? DIR.ESQUERDA : DIR.DIREITA; z.andando = true; return; }
  z.andando = false;
  if (z.tarefa.tipo === 'louca') { if (t.ajudanteRecolhe(z.tarefa.i)) { sons.tocar('louca_recolhe', 1.15, 0.05, -12); avisar('O Zezinho recolheu uma louça! (devagarinho, mas recolheu)'); } z.tarefa = { tipo: 'bacia', x: PALCO.BACIA.x + 30 }; }
  else if (z.tarefa.tipo === 'bacia') { sons.tocar('bacia', 1.3, 0.05, -12); z.tarefa = null; }
  else z.tarefa = null;
});

// ---------- os ajudantes de salão trabalhando no palco ----------
// Cada ajudante de salão anda na faixa do chão (como o Jocelino, um pouco atrás) e faz o que as habilidades dele deixam:
// recolher louça, servir bebida, repor a farinheira. Sem habilidade, fica no canto do bebedouro, de olho.
// (14/10, Tarefa B) Os Mestres: o da bebida serve sempre na medida (o carimbo e a aura); o da louça recolhe bem mais rápido; o da
// gorjeta recolhe as moedas do balcão; o "Leva prato" (raro) reserva o prato no passe, pega e leva a quem pediu, um por vez.
const AJUDANTES = [];
// (Tarefa C) Quem já ganhou o Mestre do posto dele (peneira a farinha tão rápido quanto o Jocelino).
const ehMestreDaEquipe = e => !!e && !!e.mestre && (e.habilidades || []).includes(e.mestre);
// O ajudante sai da tela (ou da equipe) no meio do que fazia: o prato que levava volta ao passe e a reserva se desfaz.
function largarTarefaDoAjudante(a) {
  const t = G.turno, tf = a && a.tarefa;
  if (!t || !tf) return;
  if (tf.item) t.devolverAoPasse(tf.item);
  if (tf.tipo === 'pegar_prato') { const x = t.passe.find(y => y.reservadoPara === tf.i); if (x) delete x.reservadoPara; }
  if ((tf.tipo === 'pegar_prato' || tf.tipo === 'levar_prato') && t.mesas[tf.i]) t.mesas[tf.i].pratoReservado = false;
  a.tarefa = null;
}
function ajudantesDoPalco() {
  const p = G.pensao;
  if (!p || !noPalco()) { if (AJUDANTES.length) { AJUDANTES.forEach(largarTarefaDoAjudante); if (G.turno) G.turno.soltarReservas(); } AJUDANTES.length = 0; return []; }
  const salao = p.equipe.filter(e => e.posto === 'salao'), cozinha = p.equipe.filter(e => e.posto === 'cozinha');
  while (AJUDANTES.length > salao.length + cozinha.length) largarTarefaDoAjudante(AJUDANTES.pop());
  [...salao, ...cozinha].forEach((e, k) => {
    let a = AJUDANTES[k];
    if (!a || a.id !== e.id) {
      if (a) largarTarefaDoAjudante(a);
      a = AJUDANTES[k] = new Personagem(e.id, e.nome, e.posto === 'cozinha' ? PALCO.ROSA.x - 90 : foraDaBancada(PALCO.CASA_AJUDANTE - k * 60), e.posto === 'cozinha' ? PALCO.ROSA.y : PALCO.CHAO_Y - 4, DIR.BAIXO);
      a.equipe = e; a.casa = a.x; a.tarefa = null; a.espera = 0;
      // (15/10, o guia da 1ª vez) a primeira vez que ele aparece no palco: a plaquinha "Nome · Posto" sozinha por uns segundos
      if (G.limpou && !G.limpou['ajudante_' + e.id]) { G.limpou['ajudante_' + e.id] = 1; a.plaquinhaAte = (G.agora || 0) + PLAQUINHA.primeira; }
    }
    if (e.posto !== 'cozinha') a.casa = foraDaBancada(PALCO.CASA_AJUDANTE - k * 60);   // (revisão da D1) a bancada comprada depois, o salão maior
  });
  return AJUDANTES;
}
ATUALIZADORES.push(dt => {
  const t = G.turno, p = G.pensao;
  // (revisão da Tarefa B) sem janta, nenhuma tarefa velha fica (a bebida, as moedas, o prato na mão): a noite seguinte começa do zero
  if (!t) { for (const a of AJUDANTES) if (a.tarefa) { a.tarefa = null; a.andando = false; } return; }
  if (!noPalco() || !p) return;
  ajudantesDoPalco();
  for (const a of AJUDANTES) {
    a.t += dt;
    const e = a.equipe;
    if (e.posto === 'cozinha') { a.andando = false; a.dir = DIR.DIREITA; continue; }   // ajuda a Rosa no fogão
    const tem = h => Equipe.faz(e, h);
    if (!a.tarefa) {
      a.espera -= dt;
      if (a.espera > 0) continue;
      a.espera = tem('mestre_louca') ? ECO.equipe.louca.olhar : 0.6;
      const n = Math.min(t.mesas.length, PALCO.ASSENTOS.length), livre = i => !AJUDANTES.some(o => o.tarefa && o.tarefa.i === i);
      const achaLouca = so => tem('louca') ? t.mesas.findIndex((m, i) => i < n && (so ? m.louca : m.estado === 'suja' || m.louca) && livre(i)) : -1;
      const doLado = achaLouca(true), suja = doLado >= 0 ? doLado : achaLouca(false);
      // (14/10, Tarefa E2) a caipirinha só quem tem a habilidade dela faz (a "bebida" serve as outras; o Mestre da bebida, as duas se tiver a rara)
      const faz = m => m.bebida === 'caipirinha' ? tem('caipirinha') : tem('bebida');
      const bebe = t.mesas.findIndex((m, i) => i < n && t.querBebidaAgora(m) && !m.bebidaReservada && faz(m) && livre(i));
      const prato = tem('leva_prato') ? pratoParaOAjudante(t, n) : -1;
      const moeda = tem('mestre_gorjeta') ? t.moedas.find(x => x.mesa < n && !AJUDANTES.some(o => o.tarefa && o.tarefa.tipo === 'moedas' && o.tarefa.mesa === x.mesa)) : null;
      const outroPeneira = G.peneira || AJUDANTES.some(o => o !== a && o.tarefa && (o.tarefa.tipo === 'farinha' || o.tarefa.tipo === 'peneirando'));
      if (tem('farinha') && !outroPeneira && t.farinha <= TurnoJanta.REPOR_ATE && (p.despensa.farinha || 0) > 0) a.tarefa = { tipo: 'farinha', x: PALCO.FARINHEIRA.cx };
      else if (doLado >= 0) a.tarefa = { tipo: 'louca', i: doLado, x: PALCO.ASSENTOS[doLado].x };   // a louça do lado de quem sentou: senão ele vai embora
      else if (prato >= 0 && t.reservarPrato(prato) >= 0) a.tarefa = { tipo: 'pegar_prato', i: prato, x: PALCO.PASSE.cx };
      else if (suja >= 0) a.tarefa = { tipo: 'louca', i: suja, x: PALCO.ASSENTOS[suja].x };
      else if (bebe >= 0) { const bb = t.reservarBebida(bebe); if (bb) a.tarefa = { tipo: 'bebida', i: bebe, bebida: bb, x: PALCO.BEBEDOURO.x + 20, depois: PALCO.ASSENTOS[bebe].x }; }
      else if (moeda) a.tarefa = { tipo: 'moedas', mesa: moeda.mesa, x: PALCO.ASSENTOS[moeda.mesa].x + 34 };
      else if (Math.abs(a.x - a.casa) > 4) a.tarefa = { tipo: 'casa', x: a.casa };
      if (!a.tarefa) { a.andando = false; continue; }
    }
    // (14/10, a bebida com tempo, o Dave: o funcionário serve 1 bebida em 3,0 s) No bebedouro ele enche o copo: alguns segundos
    // parado, com a barrinha em cima; depois leva o copo na mão até quem pediu.
    // (Tarefa C) Na farinheira ele peneira: PENEIRA.ajudante s (o Mestre, PENEIRA.mestre), parado, com a barrinha em cima.
    if (a.tarefa.tipo === 'peneirando') {
      a.andando = false; a.dir = DIR.CIMA; a.tarefa.t += dt;
      if (G.peneira) { a.tarefa = null; continue; }   // o Jocelino pegou a peneira: ele larga
      if (a.tarefa.t >= a.tarefa.dur) { if (t.reporFarinha() === 'ok') sons.tocar('farinha', 1.1, 0.05, -8); a.tarefa = null; }
      continue;
    }
    if (a.tarefa.tipo === 'enchendo') {
      a.andando = false; a.dir = DIR.CIMA; a.tarefa.t += dt;
      if (a.tarefa.t >= a.tarefa.dur) a.tarefa = { tipo: 'servir_bebida', i: a.tarefa.i, bebida: a.tarefa.bebida, x: a.tarefa.depois };
      continue;
    }
    const v = 150 * (1 + e.servico / 120) * ((tem('mestre_louca') && (a.tarefa.tipo === 'louca' || a.tarefa.tipo === 'bacia')) ? ECO.equipe.louca.velocidade : 1);
    const dx = a.tarefa.x - a.x;
    if (Math.abs(dx) > 5) { a.x += Math.sign(dx) * Math.min(Math.abs(dx), v * dt); a.dir = dx < 0 ? DIR.ESQUERDA : DIR.DIREITA; a.andando = true; continue; }
    a.andando = false;
    const tf = a.tarefa;
    if (tf.tipo === 'farinha') a.tarefa = t.podeReporFarinha() === 'ok' && !G.peneira ? { tipo: 'peneirando', x: a.x, t: 0, dur: TurnoJanta.peneira(ehMestreDaEquipe(e) ? 'mestre' : 'ajudante') } : null;
    else if (tf.tipo === 'louca') { if (t.ajudanteRecolhe(tf.i)) sons.tocar('louca_recolhe', 1.08, 0.05, -10); a.tarefa = { tipo: 'bacia', x: PALCO.BACIA.x + 30 }; }
    else if (tf.tipo === 'bacia') { sons.tocar('bacia', 1.1, 0.05, -10); setTimeout(() => sons.tocar('lavando', 1.05, 0.06, -16), 700); a.tarefa = null; }   // e lava, baixinho
    // (o pacote de cozinha) no bebedouro ele começa a encher: o despejo curto, mais baixo que o do Jocelino (Fill Drink)
    else if (tf.tipo === 'bebida' && tf.depois != null) {
      // (E2) a caipirinha leva mais tempo no balcão (socar, açúcar, gelo e cachaça): o soco do socador no lugar do despejo
      const caipi = tf.bebida === 'caipirinha';
      a.tarefa = { tipo: 'enchendo', i: tf.i, bebida: tf.bebida, x: a.x, depois: tf.depois, t: 0, dur: caipi ? ECO.pensao.janta.CAIPIRINHA_AJUDANTE : TurnoJanta.salao().bebidaAjudante };
      if (caipi) sons.tocar('caipi_soco', 1.05, 0.06, -12); else sons.tocar('copo_ajudante', tf.bebida === 'cerveja' ? 0.89 : 1, 0.05, -12); }
    else if (tf.tipo === 'servir_bebida') {
      const medida = tem('mestre_bebida');   // o Mestre da bebida: sempre na medida (o carimbo, a aura, a gorjeta)
      if (t.ajudanteBebida(tf.i, tf.bebida, medida)) { sons.tocar('servir', 1.25, 0.05, -8); if (medida) { carimboBebida(tf.i, 'medida'); sons.tocar('carimbo', 1.1, 0.05, -8); } }
      a.tarefa = null;
    }
    else if (tf.tipo === 'pegar_prato') { const x = t.ajudantePegaPrato(tf.i); a.tarefa = x ? { tipo: 'levar_prato', i: tf.i, item: x, x: PALCO.ASSENTOS[tf.i].x } : null; if (x) sons.tocar('item_pega', 1.08, 0.05, -10); }
    else if (tf.tipo === 'levar_prato') { if (t.ajudanteServePrato(tf.i, tf.item)) { sons.tocar('item_pousa', 1.08, 0.05, -10); sons.tocar('servir', 1.1, 0.05, -8); } a.tarefa = null; }
    else if (tf.tipo === 'moedas') { const v2 = t.recolherMoedas(tf.mesa); if (v2) { tocarSomDoEvento({ tipo: 'gorjeta' }); flutuar(a.x, a.y - 170, `+Cr$ ${v2} gorjeta`, '#ffd34d'); } a.tarefa = null; }
    else a.tarefa = null;
  }
});
// (Tarefa B) O prato que o "Leva prato" vai levar: de quem espera há mais tempo, que não é o VIP (servido só pelo Jocelino), que
// ninguém reservou, com o prato livre no passe e sem o mesmo prato já na bandeja do Jocelino para essa pessoa. Devolve a banqueta ou −1.
function pratoParaOAjudante(t, n) {
  const livres = {}; for (const x of t.passe) if (x.reservadoPara == null) livres[x.prato] = (livres[x.prato] || 0) + 1;
  const naMao = {}; for (const x of t.bandeja) if (x.tipo === 'prato') naMao[x.prato] = (naMao[x.prato] || 0) + 1;
  const querem = {}; t.mesas.forEach((m, i) => { if (i < n && m.estado === 'prato' && !m.pratoReservado && m.modo !== 'antigo') querem[m.prato] = (querem[m.prato] || 0) + 1; });
  let quem = -1;
  t.mesas.forEach((m, i) => {
    if (i >= n || m.estado !== 'prato' || m.pratoReservado || m.modo === 'antigo' || m.cliente.mania === 'vip' || !livres[m.prato]) return;
    if ((naMao[m.prato] || 0) >= querem[m.prato]) return;   // o Jocelino já leva um para cada um que espera esse prato
    if (quem < 0 || m.espera > t.mesas[quem].espera) quem = i;
  });
  return quem;
}

// (14/10, a bebida com tempo) Em cima do ajudante: enchendo, a barrinha (a moldura é arte; o enchimento é luz de interface) e o
// copo da bebida; levando, o copo cheio em cima da cabeça, até entregar.
function desenhaAjudantesBebida(ctx) {
  for (const a of AJUDANTES) {
    const tf = a.tarefa; if (!tf) continue;
    const alto = _altoDoAjudante(a);
    const y = a.y - alto + 34;   // logo acima da cabeça dela (a folha de cada um tem a altura dela, com uma folga em cima)
    // (Tarefa B) o "Leva prato" levando: o prato em cima da cabeça (a arte do prato, a mesma da bandeja do Jocelino)
    if (tf.tipo === 'levar_prato' && tf.item) { desenhaPrato(ctx, tf.item.prato, a.x, y, 1, 0.8); continue; }
    if (tf.tipo === 'peneirando' && spr('fx/barra_moldura')) {   // (Tarefa C) peneirando a farinha: a barrinha amarela
      desenhaFx(ctx, 'barra_moldura', a.x, y - 4); ctx.fillStyle = '#e8c22c'; ctx.fillRect(a.x - 26, y - 6, 52 * clamp(tf.t / tf.dur, 0, 1), 4); continue; }
    if (!tf.bebida || (tf.tipo !== 'enchendo' && tf.tipo !== 'servir_bebida')) continue;
    if (tf.tipo === 'enchendo') desenhaPe(ctx, 'salao/bebida_' + tf.bebida, a.x + 48, y + 40, 1, 0.8);   // o copo enchendo, do lado
    else desenhaPe(ctx, 'salao/bebida_' + tf.bebida, a.x, y, 1, 0.8);                                     // levando: em cima da cabeça
    if (tf.tipo === 'enchendo' && spr('fx/barra_moldura')) {
      const f = clamp(tf.t / tf.dur, 0, 1);
      desenhaFx(ctx, 'barra_moldura', a.x, y - 4);
      ctx.fillStyle = '#5ec43a'; ctx.fillRect(a.x - 26, y - 6, 52 * f, 4);
    }
  }
}

// (15/10, o jogador: "quem é essa senhora que apareceu na pensão e não sai mais?") Cada ajudante com a plaquinha do nome e do posto
// ("Nena · Salão") em cima da cabeça: ao passar o mouse; ao clicar nele (quando o clique não cai num alvo do serviço) por ~2 s, com
// a frase do que está fazendo; e na primeira vez que aparece no palco (o guia da 1ª vez), sozinha por uns segundos. O estilo é o do
// rótulo da seta do guia (texto(): o Nunito com o contorno escuro): só texto, nenhuma arte nova.
const PLAQUINHA = { clique: 2.2, primeira: 6 };
const PLAQUINHAS_NA_TELA = [];   // o que saiu no último quadro (os testes conferem o texto e o lugar)
const plaquinhaDoAjudante = a => `${a.nome} · ${Equipe.POSTOS[a.equipe.posto] || a.equipe.posto}`;
// (a altura do quadro no mundo: a folha ampliada tem fatorGente vezes os pixels, arte.js)
const _altoDoAjudante = a => { const img = spr(a.folha); return img ? (img.naturalHeight / 4 / fatorGente(img) - 2) * PALCO.ESCALA_GENTE : 114 * PALCO.ESCALA_GENTE; };
// O ajudante sob o ponto (px de mundo): o corpo dele, do pé até a cabeça; dois juntos, ganha o da frente (o y maior).
function ajudanteEm(px, py) {
  let quem = null;
  for (const a of AJUDANTES) {
    if (Math.abs(px - a.x) <= 34 && py <= a.y + 6 && py >= a.y - _altoDoAjudante(a) + 30 && (!quem || a.y > quem.y)) quem = a;
  }
  return quem;
}
function fraseDoAjudante(a) {
  if (a.equipe.posto === 'cozinha') return 'ajudando a Rosa no fogão';
  if (!G.turno) return 'esperando a janta começar';
  const tf = a.tarefa; if (!tf) return 'esperando serviço';
  const b = tf.bebida && Pratos.BEBIDAS[tf.bebida] ? Pratos.BEBIDAS[tf.bebida].toLowerCase() : 'a bebida';
  return ({ louca: 'indo recolher a louça', bacia: 'levando a louça para a bacia', farinha: 'indo repor a farinha', peneirando: 'peneirando a farinha',
    bebida: `indo buscar ${b}`, enchendo: tf.bebida === 'caipirinha' ? 'fazendo a caipirinha' : `enchendo o copo de ${b}`, servir_bebida: `levando ${b}`,
    pegar_prato: 'indo pegar o prato no passe', levar_prato: 'levando o prato', moedas: 'recolhendo a gorjeta', casa: 'voltando para o canto' })[tf.tipo] || 'esperando serviço';
}
function falarComAjudante(a) { a.fala = fraseDoAjudante(a); a.falaAte = (G.agora || 0) + PLAQUINHA.clique; }
function desenhaPlaquinhasAjudantes(ctx) {
  PLAQUINHAS_NA_TELA.length = 0;
  if (!AJUDANTES.length) return;
  const agora = G.agora || 0, mm = G.mouse && !G.copo ? mouseMundo() : null, sob = mm ? ajudanteEm(mm.x, mm.y) : null;
  const z = G.zoom || 1, x0 = G.cam.x, x1 = G.cam.x + (G.larg || 0) / z, y0 = G.cam.y;
  ctx.save();
  for (const a of AJUDANTES) {
    const fala = a.falaAte > agora, primeira = a.plaquinhaAte > agora;
    if (a !== sob && !fala && !primeira) continue;
    // logo acima da cabeça; com o prato, o copo ou a barrinha em cima dela (desenhaAjudantesBebida), mais alto
    const tf = a.tarefa, naCabeca = tf && ['levar_prato', 'servir_bebida', 'peneirando', 'enchendo'].includes(tf.tipo);
    const nome = plaquinhaDoAjudante(a), linhas = fala ? [a.fala, nome] : [nome];
    ctx.font = '900 26px Nunito'; const meia = Math.max(...linhas.map(l => ctx.measureText(l).width)) / 2 + 6;
    const x = G.larg ? clamp(a.x, x0 + meia, x1 - meia) : a.x;
    const y = Math.max(a.y - _altoDoAjudante(a) + 24 - (naCabeca ? 44 : 0), y0 + 30 + (linhas.length - 1) * 31);
    // a da 1ª vez some devagar no último meio segundo
    ctx.globalAlpha = a === sob || fala ? 1 : clamp((a.plaquinhaAte - agora) / 0.5, 0, 1);
    if (fala) texto(ctx, a.fala, x, y - 31, 23, '#ffffff', '900');   // (15/10) letra maior: 17 px no palco viravam ~11 na tela
    texto(ctx, nome, x, y, 26, '#fff4cf', '900');
    PLAQUINHAS_NA_TELA.push({ id: a.id, texto: nome, fala: fala ? a.fala : null, x, y, meia, porque: a === sob ? 'mouse' : fala ? 'clique' : 'primeira' });
  }
  ctx.restore();
}

// ---------- a tela Equipe ----------
// (14/10, Tarefa B, a ficha do funcionário do Dave) Cada pessoa: os 4 atributos, o nível e o salário, as 2 habilidades fixas e o
// Mestre (com o nível de cada uma e o que fazem; as já ganhas em giz amarelo), o posto ou a reserva, a expedição em curso. Os
// botões são tábuas: Treinar, Posto (os postos com vaga e a Reserva), Expedição (a lista dos ingredientes, com a origem) e Dispensar.
// O candidato já mostra a vocação e as 3 habilidades, antes de contratar.
const _nomePosto = posto => posto === 'reserva' ? Equipe.RESERVA : Equipe.POSTOS[posto] || '—';
const _nomeBusca = b => !b || b === 'sorteio' ? 'o que achar (sorteio)' : Itens.nome(b);
function _linhasHabilidades(e, cand) {
  const hs = [[3, e.habs[0]], [7, e.habs[1]], [Equipe.nivelDoMestre(e), e.mestre], [Equipe.nivelDaRara(), e.rara]].filter(x => x[1]);   // (E2) e a rara
  const fora = !cand && e.posto !== e.vocacao;
  const linhas = hs.map(([n, h]) => {
    const tem = !cand && e.habilidades.includes(h);
    return el('div', { class: tem ? 'eq-hab' : 'eq-at' }, `${tem ? '★' : '☆'} Nv ${n}: ${Equipe.textoHab(h)}`);
  });
  if (!cand && e.posto === 'salao' && e.habilidades.includes('louca') && !e.habs.includes('louca')) linhas.unshift(el('div', { class: 'eq-hab' }, `★ Do posto: ${Equipe.textoHab('louca')}`));
  if (fora) linhas.push(el('div', { class: 'eq-at' }, `Vocação: ${Equipe.POSTOS[e.vocacao]} (as habilidades valem no posto ${Equipe.POSTOS[e.vocacao]}).`));
  return linhas;
}
function _linhaExpedicao(e) {
  if (e.expedicao) return el('div', { class: 'eq-hab eq-fora' }, `Na expedição: volta amanhã de manhã com ${_nomeBusca(e.expedicao.busca)}.`);
  if (e.posto === 'compras') return el('div', { class: 'eq-at' }, `Expedição toda manhã: busca ${_nomeBusca(e.busca)}.`);
  return null;
}
// (15/10, a clareza; o dono: "contratei uma senhora e lá aparece 'posto', o que significa isso?") O posto é onde a pessoa trabalha
// na janta. Como no Dave (ao pôr o funcionário num lugar, o Bancho mostra o que ele faz ali), cada posto diz o que ELA faz lá, com as
// habilidades dela (a habilidade só vale no posto dela: Equipe.tem), quantas vagas há e, sem vaga, em que degrau a fama abre.
const _noPosto = k => (k === 'salao' ? 'No ' : 'Na ') + _nomePosto(k);
const _semSozinho = t => t.replace(/ sozinho\(a\)/g, '').replace(/^./, c => c.toLowerCase());
const _salarioReserva = e => Math.ceil(Equipe.salario(e) * ECO.equipe.reserva);
const POSTO_GERAL = { salao: 'recolhe a louça e ajuda no balcão; Serviço anda mais rápido, Simpatia dá mais gorjeta',
  cozinha: 'a Rosa cozinha mais rápido (o atributo Cozinha); treinando, ensina receitas',
  compras: 'toda manhã busca um ingrediente para a despensa (Compras traz mais)', reserva: 'fica parada, ganhando meio salário; pode sair numa expedição' };
function oQueFazNoPosto(p, e, k) {
  if (k === 'reserva') return `fica parada, ganhando meio salário (Cr$ ${_salarioReserva(e)}); pode sair numa expedição`;
  const habs = (e.habilidades || []).filter(h => Equipe.postoDaHab(h) === k && h !== 'louca').map(h => _semSozinho(Equipe.textoHab(h)));
  const base = { salao: `recolhe a louça`, cozinha: `a Rosa cozinha mais rápido (Cozinha ${e.cozinha})`,
    compras: `toda manhã busca ${_nomeBusca(e.busca)} para a despensa (${_textoTraz(Equipe.previsao(e, e.busca || 'sorteio', p))})` }[k];
  const fim = { salao: `; a Simpatia (${e.simpatia}) aumenta a gorjeta`, cozinha: '', compras: '' }[k];
  return [base, ...habs].join(', ') + fim;
}
// A vaga do posto, para a escolha: livre, a de agora, ou sem vaga (e em que degrau a fama abre).
function _vagaDoPosto(p, e, k) {
  if (k === e.posto) return 'é o posto de agora';
  const n = Equipe.vagasLivres(p, k);
  if (n > 0) return `${n} ${n === 1 ? 'vaga livre' : 'vagas livres'}`;
  if (k === 'reserva') return `a reserva está cheia (cabem ${ECO.equipe.reservaMax})`;
  const i = ['salao', 'cozinha', 'compras'].indexOf(k), ocup = p.equipe.filter(x => x.posto === k).length;
  for (let g = p.grau() + 1; g <= Equipe.VAGAS.length; g++) if (Equipe.VAGAS[g - 1][i] > ocup) return `sem vaga: a fama abre no ${nomeDoDegrau(g, Pensao.DEGRAUS[g - 1])}`;
  return 'sem vaga: todas ocupadas';
}
function abrirEquipe() {
  const p = G.pensao;
  const caixa = el('div', { class: 'painel equipe' });
  let escolha = null;   // { tipo: 'posto' | 'expedicao', i }: a pessoa com a escolha aberta
  const bt = (texto, cls, fn) => el('button', { class: 'botao ' + (cls || ''), onclick: ev => { ev.stopPropagation(); fn(); } }, texto);
  const desenha = () => {
    // (revisão da Tarefa B) a fala da Rosa (a faixa do guia) continua à vista ao redesenhar: a faixa nova nasce escondida e só o
    // guia (a cada 100 ms) a mostrava de novo; ela piscava e a lista pulava
    const fx0 = caixa.querySelector('.eq-faixa'), faixa0 = fx0 && !fx0.hidden ? { texto: fx0.querySelector('.guia-faixa-texto').textContent, direita: fx0.classList.contains('direita') } : null;
    caixa.innerHTML = '';
    p.equipe.forEach(e => Equipe.normalizar(e));
    const vagas = ['salao', 'cozinha', 'compras', 'reserva'].map(k => `${_nomePosto(k)} ${Equipe.vagasLivres(p, k)}`).join(' · ');
    caixa.append(el('div', { class: 'titulo titulo-tela' }, 'Equipe da Pensão'), el('div', { class: 'eq-vagas' }, `Vagas livres: ${vagas} · salários Cr$ ${Equipe.salarios(p)}/noite`),
      // (15/10, a clareza) o que é posto, vocação, os atributos, as estrelas das habilidades e o Mestre, no "(?)"
      linhaAjuda('equipe', 'Posto = onde a pessoa trabalha na janta. A fama da pensão abre mais vagas.', [
        ...['salao', 'cozinha', 'compras', 'reserva'].map(k => `${_nomePosto(k)}: ${POSTO_GERAL[k]}.`),
        'Vocação: o posto em que a pessoa é boa. As habilidades (★ já tem; ☆ aprende ao treinar até aquele nível) só valem no posto delas. Mestre: a habilidade mais forte, num nível alto.',
        'Atributos: Serviço (anda e entrega mais rápido), Cozinha (a Rosa prepara mais rápido), Compras (traz mais na expedição), Simpatia (mais gorjeta; na expedição, chance de vir a mais).',
        'Treinar: sobe o nível e o salário. Salário: sai toda noite que a pensão abre; na Reserva, a metade.']),
      faixaDaTela('eq-faixa'));
    if (faixa0) { const f = caixa.querySelector('.eq-faixa'); f.hidden = false; f.classList.toggle('direita', faixa0.direita); f.querySelector('.guia-faixa-texto').textContent = faixa0.texto; }
    // Ajudantes contratados.
    const lista = el('div', { class: 'eq-lista' });
    if (!p.equipe.length) lista.append(el('div', { class: 'rodape', style: 'text-align:left' }, p.grau() < 2 ? 'A pensão ainda é pequena para ter ajudante: no "Boteco Conhecido" abre a primeira vaga.' : 'Ninguém contratado ainda. Ponha um anúncio!'));
    p.equipe.forEach((e, i) => {
      const c = Equipe.custoTreino(e), max = e.nivel >= Equipe.NIVEL_MAX, sal = Equipe.salario(e), salNoite = Equipe.salarioDaNoite(e);
      const prox = max ? '' : Equipe.habilidadeDoNivel(e, e.nivel + 1);
      const proxSal = Math.min(ECO.equipe.salarioTeto, sal + ECO.equipe.salarioPorNivel);
      const ficha = el('div', {}, el('b', {}, `${e.nome} · ${_nomePosto(e.posto)} · Nv ${e.nivel}`),
        el('div', { class: 'eq-at' }, `Serviço ${e.servico} · Cozinha ${e.cozinha} · Compras ${e.compras} · Simpatia ${e.simpatia}`),
        el('div', { class: 'eq-at' }, `Salário Cr$ ${sal}/noite${salNoite !== sal ? ` (na reserva, parado: Cr$ ${salNoite})` : ''}` + (max ? ' · nível máximo.' : ` · ▸ treinar: nível ${e.nivel + 1}, salário Cr$ ${proxSal}${prox ? ` · ganha "${Equipe.textoHab(prox)}"` : ''}`)),
        // (15/10, a clareza) o que ela faz no posto de agora (a expedição em curso já diz)
        e.expedicao ? null : el('div', { class: 'eq-hab eq-faz' }, `${_noPosto(e.posto)}: ${oQueFazNoPosto(p, e, e.posto)}.`),
        ..._linhasHabilidades(e), e.posto === 'compras' ? null : _linhaExpedicao(e));
      const bts = el('div', { class: 'eq-bts' },
        bt(`Treinar (Cr$ ${c})`, 'forte' + (G.dinheiro >= c && !max ? '' : ' desligado'), () => {
          const pago = Equipe.treinar(p, i, G.dinheiro);
          if (pago) { G.dinheiro -= pago; sons.tocar('carimbo', 1.2, 0.05, -4); avisar(`${e.nome} treinou: nível ${e.nivel}!` + (e.ganhou ? ` Habilidade nova: ${Equipe.textoHab(e.ganhou)}.` : '')); hudSujo(); desenha(); }
          else avisar(max ? 'Já está no nível máximo.' : `Treinar custa Cr$ ${c}.`); }),
        // (15/10, a clareza) "Mudar de posto" (antes só "Posto"): abre a escolha com o que ela faz em cada um
        bt('Mudar de posto', 'eq-mudar-posto' + (escolha && escolha.tipo === 'posto' && escolha.i === i ? ' aceso' : ''), () => { escolha = escolha && escolha.tipo === 'posto' && escolha.i === i ? null : { tipo: 'posto', i };
          if (escolha && typeof _marcaTela === 'function') _marcaTela('posto');   // (a 1ª vez do posto: abriu a escolha e leu)
          desenha(); }),
        (e.posto === 'reserva' || e.posto === 'compras') ? el('button', { class: 'botao eq-expedir' + (e.expedicao ? ' desligado' : ''), 'data-posto': e.posto, onclick: ev => { ev.stopPropagation();
          if (e.expedicao) { avisar(`${e.nome} está na expedição: volta amanhã de manhã.`); return; }
          escolha = escolha && escolha.tipo === 'expedicao' && escolha.i === i ? null : { tipo: 'expedicao', i }; desenha(); } }, 'Expedição') : null,
        Object.assign(bt('Dispensar', 'eq-dispensar', () => { if (e.expedicao) { avisar(`${e.nome} está na expedição: dispense quando voltar.`); return; } Equipe.demitir(p, i); escolha = null; desenha(); }),
          { title: 'Manda embora da equipe (não custa nada; a vaga fica livre)' }));
      lista.append(el('div', { class: 'eq-pessoa' }, el('img', { src: urlArte(`retratos/${e.id}_normal`) }), ficha, bts));
      if (escolha && escolha.i === i) { const blk = escolha.tipo === 'posto' ? _escolhaPosto(p, e, i, () => { escolha = null; desenha(); }) : _escolhaExpedicao(p, e, i, () => { escolha = null; desenha(); });
        lista.append(blk); setTimeout(() => { if (blk.isConnected) blk.scrollIntoView({ block: 'start' }); }, 0); }   // (o começo da lista logo abaixo da fala presa da Rosa: scroll-margin-top)
    });
    caixa.append(lista);
    // Candidatos (do anúncio de ontem): a vocação e as habilidades já à vista, como no Dave.
    if (p.candidatos.length) {
      caixa.append(el('div', { class: 'cad-sub' }, 'Candidatos: clique no posto para contratar'));
      const cl = el('div', { class: 'eq-lista' });
      p.candidatos.forEach((c, i) => { Equipe.normalizar(c); cl.append(el('div', { class: 'eq-pessoa' }, el('img', { src: urlArte(`retratos/${c.id}_normal`) }),
        el('div', {}, el('b', {}, `${c.nome} · vocação: ${Equipe.POSTOS[c.vocacao]}`), el('div', { class: 'eq-at' }, `Serviço ${c.servico} · Cozinha ${c.cozinha} · Compras ${c.compras} · Simpatia ${c.simpatia}`),
          ..._linhasHabilidades(c, true), el('div', { class: 'eq-at' }, `Taxa de contratação: Cr$ ${Equipe.taxaContratacao(c)} · salário Cr$ ${Equipe.salario(c)}/noite`)),
        el('div', { class: 'eq-bts' }, ['salao', 'cozinha', 'compras', 'reserva'].map(k => el('button', { class: 'botao' + (Equipe.vagasLivres(p, k) > 0 ? '' : ' desligado'), onclick: ev => { ev.stopPropagation();
          const tx = Equipe.taxaContratacao(c), r = Equipe.contratar(p, i, k, G.dinheiro);
          if (r === 'dinheiro') { avisar(`A taxa de contratação é Cr$ ${tx}.`); return; }
          if (r === 'ok') { G.dinheiro -= tx; hudSujo(); sons.tocar('feito', 1, 0.03, -4); avisar(k === 'reserva' ? `${c.nome} entrou para a equipe e fica na reserva.` : `${c.nome} vai trabalhar no posto ${Equipe.POSTOS[k]}!`); desenha(); }
          else avisar(k === 'reserva' ? 'A reserva está cheia.' : 'Não tem vaga nesse posto (a fama abre mais). Dá para contratar na Reserva.'); }, title: `${_nomePosto(k)}: ${POSTO_GERAL[k]}.` }, _nomePosto(k)))))); });
      caixa.append(cl);
    }
    // Anunciar.
    caixa.append(el('div', { class: 'cad-sub' }, p.anuncio ? `Anúncio feito: ${Equipe.ANUNCIOS[p.anuncio].nome}. Os candidatos aparecem amanhã.` : 'Pôr anúncio (os candidatos aparecem amanhã)'));
    const temVaga = ['salao', 'cozinha', 'compras'].some(k => Equipe.vagasLivres(p, k) > 0) || (p.grau() >= 2 && Equipe.vagasLivres(p, 'reserva') > 0);
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
  // (revisão da Tarefa B) a 1ª expedição: a lousa rola até o botão Expedição (o de quem está na reserva, de preferência), uma vez
  if (typeof jaFezTela === 'function' && jaFezTela('equipe') && !jaFezTela('expedicao')) { const be = caixa.querySelector('.eq-expedir[data-posto="reserva"]:not(.desligado)') || caixa.querySelector('.eq-expedir:not(.desligado)'); if (be) be.scrollIntoView({ block: 'nearest' }); }
  sons.tocar('abrir', 1, 0.03, -6);
  return true;
}
// A escolha do posto: os postos com vaga e a Reserva (a vaga é por degrau).
// (15/10, a clareza) Os 4 lugares, cada um com o que ELA faria ali (com as habilidades dela), a vaga e, sem vaga, onde a fama abre.
// Depois de trocar, o aviso diz o que mudou.
function _escolhaPosto(p, e, i, fim) {
  const voc = Equipe.POSTOS[e.vocacao];
  return el('div', { class: 'eq-escolha eq-postos' }, el('div', { class: 'eq-at' }, `Onde ${e.nome} trabalha na janta? O salário é o mesmo em todo posto; na Reserva, a metade.` + (voc ? ` A vocação é ${voc}: as habilidades valem lá.` : '')),
    el('div', { class: 'eq-postos-grade' }, ['salao', 'cozinha', 'compras', 'reserva'].map(k => {
      const agora = k === e.posto, livre = agora || Equipe.vagasLivres(p, k) > 0, vaga = _vagaDoPosto(p, e, k);
      return el('button', { class: 'botao eq-posto' + (agora ? ' aceso' : livre ? '' : ' desligado'), 'data-posto': k, onclick: ev => { ev.stopPropagation();
        if (agora) { fim(); return; }
        const r = Equipe.mudarPosto(p, i, k);
        if (r === 'ok') { sons.tocar('feito', 1, 0.03, -6);
          avisar(`${e.nome} ${k === 'reserva' ? 'foi para a Reserva' : 'agora trabalha ' + _noPosto(k).toLowerCase()}: ${oQueFazNoPosto(p, e, k)}.` + (k !== 'reserva' && voc && k !== e.vocacao ? ` (A vocação é ${voc}: as habilidades da vocação só valem lá.)` : ''));
          fim(); }
        else avisar(r === 'fora' ? `${e.nome} está na expedição: volta amanhã.` : r === 'sem_vaga' ? `${_nomePosto(k)}: ${vaga}.` : 'Não deu.'); } },
        el('div', {}, el('b', {}, _nomePosto(k) + (agora ? ' (agora)' : '')), el('div', { class: 'eq-at' }, oQueFazNoPosto(p, e, k) + '.'), el('div', { class: 'eq-hab' }, vaga)));
    })));
}
// A escolha da expedição (o dispatch do Dave): o básico que a pensão aceita e já viu, cada um com o ícone, a raridade, a origem e
// quanto se espera que venha ("traz ~N"); ou o sorteio (a arte da caixa da encomenda).
// (revisão da Tarefa B, o domingo) A expedição custa o salário do dia, que sai na janta da noite. Num dia sem janta (o domingo, a
// pensão fechada) ou depois da janta de hoje, a noite não cobra mais: quem sai da reserva paga o dia na saída.
const _textoTraz = q => q >= 1 ? `traz ~${Math.round(q)}` : `traz 1 (chance de ${Math.round(q * 100)}%)`;
function _cobraNaSaida(p) { return (typeof pensaoAbreHoje === 'function' && !pensaoAbreHoje()) || (p.ultimaJanta === G.dia && !G.turno); }
function _escolhaExpedicao(p, e, i, fim) {
  const lista = Equipe.ingredientesDaExpedicao(p), fixo = e.posto === 'compras', paga = !fixo && _cobraNaSaida(p) ? Equipe.salario(e) : 0;
  const vai = busca => {
    if (paga && G.dinheiro < paga) { avisar(`Hoje a expedição paga o salário do dia na saída: Cr$ ${paga}.`); return; }
    const r = Equipe.expedir(p, i, busca);
    if (r === 'ok') {
      if (paga) { G.dinheiro -= paga; e.expedicao.pago = paga; hudSujo(); }
      sons.tocar('feito', 1, 0.03, -6);
      avisar(fixo ? `${e.nome} vai buscar ${_nomeBusca(busca)} toda manhã.` : `${e.nome} saiu na expedição atrás de ${_nomeBusca(busca)}: volta amanhã de manhã.` + (paga ? ` Salário do dia pago na saída: Cr$ ${paga}.` : ''));
      fim();
    } else avisar('Não deu para mandar buscar isso.'); };
  const item = (id, arte, nome, sub, fn) => el('button', { class: 'botao eq-ing', 'data-ing': id, onclick: ev => { ev.stopPropagation(); fn(); } },
    el('img', { src: urlArte(arte), alt: '' }), el('div', {}, el('b', {}, nome), el('div', { class: 'eq-at' }, sub)));
  return el('div', { class: 'eq-escolha', 'data-posto': e.posto },
    el('div', { class: 'eq-at' }, fixo ? `${e.nome} está no posto de Expedição: busca o escolhido toda manhã (é o trabalho dela; o salário é o do posto).`
      : `${e.nome} sai hoje e volta amanhã de manhã. É grátis: só o salário do dia${paga ? ` (hoje, Cr$ ${paga} na saída)` : ''}. O ★★ vem em menos unidades.`),
    el('div', { class: 'eq-ings' }, item('sorteio', 'ui/caixa_encomenda_ui', 'Sorteio', `o que achar · ${_textoTraz(Equipe.previsao(e, 'sorteio', p))} no total`, () => vai('sorteio')),
      ...lista.map(id => item(id, 'itens/' + id, Itens.nome(id), `${'★'.repeat(Pratos.raridade(id))} · ${Pratos.INGREDIENTES[id].origem} · ${_textoTraz(Equipe.previsao(e, id))}`, () => vai(id)))));
}
