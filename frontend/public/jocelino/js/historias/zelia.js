// Família Santos — historias/zelia.js — o arco da Dona Zélia, "A novidade da Marisa" (T12 das conversas e histórias; spec
// docs/superpowers/specs/2026-10-15-conversas-historias-design.md, seção 8.4; o motor é o historias.js, seção 6).
// A Zélia é do povo da Vila: as 4 cenas disparam por CORAÇÕES (2, 4, 6 e 8), como os eventos de coração do Stardew, num lugar e numa
// hora em que o Jocelino realmente passa (a Vila de tarde e de manhã, o salão da pensão antes da janta); no máximo 1 cena por dia (o
// motor cuida). Só temas leves (a seção 8): o sonho dela é a casa cheia. A casa que o Jocelino levantou "é pra minha filha que vem da
// capital"; a filha vem no Natal com uma NOVIDADE e acaba se mudando para a Vila, com o neto.
//   Z1 zelia_2 "O quarto da Marisa" (2♥): a casa da Zélia entregue; de tarde (13h–17h) na Vila, sem chuva (passados
//      ZELIA_ARCO.Z1_PACIENCIA dias do arco pronto, com chuva também); a cena acontece na calçada dela. → a dica de gosto (ama flor)
//      fica descoberta na aba Gente; o tópico casa_zelia_pronta ("Já botei a cortina no quarto da Marisa!").
//   Z2 zelia_4 "A novidade da Marisa" (4♥): de manhã (7h–12h) na Vila, com chuva (passados ZELIA_ARCO.Z2_PACIENCIA dias, qualquer
//      manhã); na porta dela. A carta da Marisa com NOVIDADE em letra maiúscula; a aposta do Jocelino fica gravada (casamento ou
//      neném). → o tópico novidade_marisa; a Zélia convida a família para o Natal dela.
//   Z3 zelia_6 "O caldo verde" (6♥): a pensão aberta; no sábado, no salão, antes das 17h (o bilhete dela chega no sábado de manhã;
//      passados ZELIA_ARCO.Z3_PACIENCIA dias, qualquer dia menos o domingo). A Zélia entra com a panela; a Rosa e o Jocelino provam.
//      → a receita com nome "Caldo Verde da Dona Zélia" (o caminho 'amizade', receitas.js); a Zélia passa a jantar também aos sábados
//      (CLIENTELA_ARCOS, clientela.js).
//   Z4 zelia_8 "O Natal da Dona Zélia" (8♥): o Natal (Verão 5). Na véspera (ou na 1ª manhã depois, se o arco ficar pronto mais tarde;
//      com o Natal a mais de 28 dias, na 1ª manhã do arco pronto: a Marisa vem nas férias do Tiaguinho, "A chegada da Marisa")
//      chega a carta-convite da Zélia; da manhã seguinte em diante, de manhã (7h–13h) na Vila, a cena acontece na rua de cima: a Marisa
//      e o Tiaguinho descem do ônibus. A NOVIDADE: a Marisa foi transferida para o banco de Praia Grande. → a Marisa e o Tiaguinho
//      MORAM NA VILA (mapa_vila.js: andam na calçada da Zélia; a Marisa janta às quintas; o Tiaguinho passa as tardes no quintal com o
//      Zezinho) e a Zélia planta uma muda de roseira no quintal da família (na manhã seguinte). O id 'zelia_8' é o que o presentes.js
//      espera (PRESENTE.MARISA_NA_VILA).
// A cena começa onde o Jocelino está (a Vila, o salão) e põe cada um no lugar dela, como o começo de um evento do Stardew. As falas são
// rascunho, revisadas com o dono (a seção 8). Nenhuma tela diz "história" nem "missão".

const ZELIA_ARCO = {
  Z1_PACIENCIA: 5,    // Z1: a tarde seca é a preferência; 5 dias depois do arco pronto, vale com chuva também
  Z2_PACIENCIA: 5,    // Z2: a manhã de chuva é a preferência; 5 dias depois do arco pronto, qualquer manhã
  Z3_PACIENCIA: 7,    // Z3: o sábado é a preferência (o bilhete); 7 dias depois do arco pronto, qualquer dia em que a pensão abre
  NATAL: [3, 5],      // Z4: o Natal da Vila Maré: Verão, dia 5 (spec 8.4); a carta-convite chega na véspera
  NATAL_LONGE: 28,    // Z4 (rodada 1): com o Natal a mais de 28 dias, a carta sai na 1ª manhã do arco pronto (as férias do Tiaguinho)
  // Z1 e Z2: a calçada da casa da Zélia (o terreno 36,8, 5×3; a cerca na linha 9 com o portão no ladrilho 38; a calçada nas linhas 10–11)
  CALCADA: { zelia: [38, 10, 'cima'], jocelino: [35, 11, 'direita'], jocelinoVai: [37, 11] },
  PORTAO: { zelia: [38, 9, 'baixo'], jocelino: [36, 12, 'cima'], jocelinoVai: [38, 11], camera: [38, 12] },   // (a câmera abaixo dos dois: a fala não tapa o Jocelino)
  // Z3: o salão de lado (a linha do chão do palco); a Zélia entra pela porta (o ladrilho 7) e anda até a frente do balcão
  SALAO: { rosa: [30, 18, 'esquerda'], rosaVai: [25, 18], jocelino: [17, 18, 'direita'], zeliaEntra: [7, 18], zeliaVai: [21, 18] },
  // Z4: a rua de cima (a rua do quintal, ladrilhos 23–24, com as calçadas 22 e 25), onde o ônibus para
  // (o Caramelo cochila na grama ao lado da rua e sai correndo pela linha 6, acima de todo mundo, com o Tiaguinho atrás: tudo acima da
  // caixa da fala)
  RUA: { zelia: [25, 8, 'cima'], jocelino: [22, 8, 'direita'], cachorro: [20, 6, 'direita'], camera: [24, 6],
    marisaDesce: [24, 2], tiaguinhoDesce: [23, 2], marisaVai: [24, 7], tiaguinhoVai: [23, 7], tiaguinhoCorre: [[23, 6], [29, 6]], cachorroCorre: [32, 6] },
  // Z4: a muda de roseira no quintal: o 1º ladrilho de grama livre desta lista (perto do caminho, na frente do terreno da casa)
  ROSEIRA: [[16, 11], [16, 10], [15, 11], [17, 11], [16, 9]],
  // Z4: o Tiaguinho no quintal com o Zezinho: nas tardes sem chuva (13h–17h), na área em que o Zezinho brinca
  QUINTAL: { tiaguinho: [8, 12], area: { x: 3, y: 10, w: 11, h: 4 }, de: 13 * 60, ate: 17 * 60 },
};

const ZeliaArco = {
  _visto: id => typeof Historias !== 'undefined' && Historias.viu(id),
  _tocando: id => typeof Historias !== 'undefined' && Historias.tocando() === id,
  _cor: () => typeof Amizade !== 'undefined' ? Amizade.coracoes('zelia') : 0,
  _arco: () => G.zeliaArco || (G.zeliaArco = {}),
  diasDesde(id) { return ZeliaArco._visto(id) ? G.dia - Historias.vistaEm(id) : -1; },
  // ---------- os marcos (os gatilhos leem) ----------
  // A casa da Dona Zélia entregue (a 1ª obra do Bira: o índice só passa dela quando ela fica pronta; como o _obraFeitaT do topicos.js).
  casaPronta() { return !!G.obra && typeof OBRAS !== 'undefined' && G.obra.indice > OBRAS.findIndex(o => o.id === 'casa_zelia'); },
  pensaoAberta() { return !!G.pensao && G.pensao.estado === 'aberta'; },
  // A paciência de cada cena: o dia em que o arco ficou pronto (marcado de manhã, G.zeliaArco no save) e se já passou a espera.
  paciente(k, dias) { const d = ZeliaArco._arco()[k]; return !!d && G.dia - d >= dias; },
  _z1Pronto() { return !ZeliaArco._visto('zelia_2') && ZeliaArco._cor() >= 2 && ZeliaArco.casaPronta(); },
  _z2Pronto() { return ZeliaArco._visto('zelia_2') && !ZeliaArco._visto('zelia_4') && ZeliaArco._cor() >= 4; },
  _z3Pronto() { return ZeliaArco._visto('zelia_4') && !ZeliaArco._visto('zelia_6') && ZeliaArco._cor() >= 6 && ZeliaArco.pensaoAberta(); },
  _z4Pronto() { return ZeliaArco._visto('zelia_6') && !ZeliaArco._visto('zelia_8') && ZeliaArco._cor() >= 8; },
  // Z3: o bilhete do sábado (na caixa ou lido).
  bilheteChegou() { const c = G.correio; return !!c && (c.caixa.includes('zelia_caldo') || c.lidas.includes('zelia_caldo')); },
  // Z4: a carta-convite chegou num dia de antes (a cena é "amanhã cedo"): G.zeliaArco.convite = o dia em que chegou.
  conviteChegou() { const c = G.correio; return !!c && (c.caixa.includes('zelia_natal') || c.lidas.includes('zelia_natal')); },
  conviteDeOntem() { const d = ZeliaArco._arco().convite; return !!d && G.dia > d && ZeliaArco.conviteChegou(); },
  // O Natal (Verão 5) e a véspera (para a carta).
  ehNatal(dia = G.dia) { return typeof Conversas !== 'undefined' && Conversas.estacao(dia) === ZELIA_ARCO.NATAL[0] && Conversas.noEstacao(dia) === ZELIA_ARCO.NATAL[1]; },
  // (rodada 1) Os dias até a próxima véspera do Natal (Verão 4); 0 na véspera.
  diasAteAVespera(dia = G.dia) {
    const ano = typeof Conversas !== 'undefined' ? Conversas.DIAS_ANO : 112, v0 = ZELIA_ARCO.NATAL[0] * 28 + ZELIA_ARCO.NATAL[1] - 1;
    let v = Math.floor((dia - 1) / ano) * ano + v0; if (v < dia) v += ano;
    return v - dia;
  },
  // A carta-convite pode sair: do Natal ao fim do verão (a véspera e depois), ou a qualquer hora quando o Natal está a mais de
  // ZELIA_ARCO.NATAL_LONGE dias (a Marisa vem nas férias do Tiaguinho, em vez de esperar quase um ano).
  _naEpocaDoConvite(dia = G.dia) {
    if (typeof Conversas === 'undefined') return false;
    if (Conversas.estacao(dia) === ZELIA_ARCO.NATAL[0] && Conversas.noEstacao(dia) >= ZELIA_ARCO.NATAL[1] - 1) return true;
    return ZeliaArco.diasAteAVespera(dia) > ZELIA_ARCO.NATAL_LONGE;
  },
  // A manhã da chegada: "Manhã de Natal" só no Natal; nos outros dias, a estação.
  manhaDaChegada(dia = G.dia) {
    if (ZeliaArco.ehNatal(dia)) return 'Manhã de Natal na Vila Maré. A Dona Zélia, de vestido novo, espera na rua de cima, de olho no relógio.';
    const e = typeof ESTACOES !== 'undefined' && typeof Conversas !== 'undefined' ? ESTACOES[Conversas.estacao(dia)].toLowerCase() : 'verão';
    return `Manhã de ${e} na Vila Maré. A Marisa vem nas férias do Tiaguinho, e a Dona Zélia, de vestido novo, espera na rua de cima, de olho no relógio.`;
  },

  // ---------- o que muda no mundo ----------
  // A Marisa e o Tiaguinho moram na Vila (depois do Z4; durante ele, ainda não: a cena traz os dois).
  moram() { return ZeliaArco._visto('zelia_8'); },
  // O Tiaguinho passa a tarde no quintal com o Zezinho (sem chuva).
  tiaguinhoNoQuintal(dia = G.dia, min = G.minutos) {
    const Q = ZELIA_ARCO.QUINTAL;
    return ZeliaArco.moram() && Historias.vistaEm('zelia_8') !== dia && min >= Q.de && min < Q.ate && !(typeof Clima !== 'undefined' && Clima.chove(dia));
  },
  // A roseira da Zélia no quintal: da manhã seguinte ao Z4 em diante (ela planta "amanhã cedo").
  temRoseira() { return ZeliaArco.moram() && G.dia > Historias.vistaEm('zelia_8'); },
  // O lugar da roseira: o 1º ladrilho de grama livre da lista (nada colocado, nenhuma planta, fora do terreno da casa).
  _lugarRoseira(b) {
    const livre = (x, y) => b.livreEm(x, y) && !b.saidaEm(x, y) && (typeof CH === 'undefined' || b.chaoEm(x, y) === CH.GRAMA)
      && !(typeof reservadoQuintal === 'function' && reservadoQuintal(x, y)) && !(typeof Horta !== 'undefined' && Horta.cova && Horta.cova(x, y))
      && (!b.ocupado.has(chaveT(x, y)) || b.ocupado.get(chaveT(x, y)).tipo === 'detrito');
    return ZELIA_ARCO.ROSEIRA.find(([x, y]) => livre(x, y)) || null;
  },
  poeRoseira(b) {
    if (!b || b.id !== 'quintal') return;
    const ja = b.objs.find(o => o.id === 'roseira_zelia');
    if (!ZeliaArco.temRoseira()) { if (ja) b.tirar(ja); return; }
    if (ja) return;
    const t = ZeliaArco._lugarRoseira(b); if (!t) return;
    const d = b.ocupado.get(chaveT(t[0], t[1])); if (d && d.tipo === 'detrito') b.tirar(d);   // (o mato que nasceu ali sai: a Zélia capinou)
    const o = b.interativo('roseira_zelia', 'objetos/roseira', t[0], t[1], 1, 1, [10, 6]);
    o.acao = () => { abrirPlaca('A roseira da Dona Zélia, de muda do canteiro dela. "Rosa no quintal da Rosa", ela disse, e plantou com as próprias mãos.'); return true; };
    return o;
  },
  // O Tiaguinho no quintal (o morador fica no mapa; aparece só nas tardes sem chuva).
  poeTiaguinhoNoQuintal(b) {
    if (!b || b.id !== 'quintal') return;
    const ja = b.moradores.find(m => m.id === 'tiaguinho' && !m._daHistoria);
    if (!ZeliaArco.moram()) { if (ja) b.moradores = b.moradores.filter(m => m !== ja); return; }
    if (ja) return;
    const Q = ZELIA_ARCO.QUINTAL, A = Q.area;
    const m = b.morador('tiaguinho', 'Tiaguinho', Q.tiaguinho[0], Q.tiaguinho[1], DIR.BAIXO, { vagueia: true, area: { x: A.x * TILE, y: A.y * TILE, w: A.w * TILE, h: A.h * TILE }, daZelia: true });
    m.visivel = ZeliaArco.tiaguinhoNoQuintal();
  },
  // Todos os mapas montados de uma vez (o fim da cena, a manhã, o carregar).
  arruma() {
    if (typeof MAPAS === 'undefined') return;
    if (MAPAS.vila && typeof poeFamiliaDaZelia === 'function') poeFamiliaDaZelia(MAPAS.vila);
    if (MAPAS.quintal) { ZeliaArco.poeTiaguinhoNoQuintal(MAPAS.quintal); ZeliaArco.poeRoseira(MAPAS.quintal); }
    if (typeof Clientela !== 'undefined' && Clientela.arcos) Clientela.arcos();
  },

  // ---------- o que as cenas dão ----------
  // Z1: a dica de gosto (ama flor), como a fofoca dos gostos (topicos.js): fica descoberta na aba Gente.
  descobreFlor() { if (typeof Conversas !== 'undefined' && Conversas.descobrir('zelia', 'flor')) avisar('A Dona Zélia ama flor (aba Gente, na Caderneta).'); },
  // Z3: o caldo verde no caderno (o fim.receita) e a Zélia aos sábados.
  caldoNaPensao() { ZeliaArco.arruma(); avisar('A Dona Zélia agora janta na pensão também aos sábados.'); },
  // Z4: a filha e o neto moram na Vila; a roseira amanhã.
  mudaram() {
    ZeliaArco.arruma();
    avisar('A Marisa e o Tiaguinho agora moram na Vila Maré, no quarto da cortina.');
    avisar('Amanhã cedo, a Dona Zélia planta uma muda de roseira no quintal de vocês.');
  },
  // A aposta do Z2 (a cena do Natal lembra): 'casamento' | 'nenem' | ''.
  aposta() { return Conversas.respondeu('zelia_aposta_casamento') ? 'casamento' : Conversas.respondeu('zelia_aposta_nenem') ? 'nenem' : ''; },
  // (para a festa final, T15: spec 9.2.3, "a Zélia vem com a Marisa e o Tiaguinho, se o Z4 aconteceu") '' sem o Z4.
  naFesta() { return ZeliaArco.moram() ? 'Numa mesa só, a Dona Zélia, a Marisa e o Tiaguinho.' : ''; },
};

// ---------- as cenas ----------
HISTORIAS.zelia_2 = {
  quem: 'zelia', coracoes: 2, titulo: 'O quarto da Marisa', clima: 'Anda arrumando o quarto da filha, de cortina nova',
  // a tarde seca é a preferência; passados ZELIA_ARCO.Z1_PACIENCIA dias do arco pronto, qualquer tarde
  get gatilho() {
    const g = { mapa: 'vila', hora: [13 * 60, 17 * 60], se: () => ZeliaArco.casaPronta() };
    return ZeliaArco.paciente('z1', ZELIA_ARCO.Z1_PACIENCIA) ? g : Object.assign(g, { chuva: false });
  },
  elenco: { zelia: ZELIA_ARCO.CALCADA.zelia, jocelino: ZELIA_ARCO.CALCADA.jocelino },
  musica: 'musica_dia_2',
  passos: [
    ['camera', 'zelia'],
    ['fala', null, 'De tarde, a Dona Zélia está na calçada, de mãos na cintura, olhando a janela da casa nova.'],
    ['anda', 'jocelino', ZELIA_ARCO.CALCADA.jocelinoVai[0], ZELIA_ARCO.CALCADA.jocelinoVai[1]],
    ['vira', 'zelia', 'jocelino'],
    ['balao', 'zelia', 'exclamacao'],
    ['fala', 'zelia', '@alegre Jocelino! Vem cá, olha pela janela.', '@alegre A Marisa vem logo, logo, com o menino. O quarto já tá pronto, olha a cortina!'],
    ['vira', 'zelia', 'cima'],
    ['vira', 'jocelino', 'cima'],
    ['fala', null, 'Pela janela, um quarto pequeno, de cama arrumada, e uma cortina de chita amarela com florzinha.'],
    ['vira', 'zelia', 'jocelino'],
    ['escolha', 'zelia', '@pensativo Ficou bonito, não ficou?', [
      { t: 'Perguntar do menino', amizade: 20, marca: 'zelia_perguntou_menino', resposta: ['@alegre Tiaguinho! Seis anos e já sabe o hino.', '@alegre O hino inteiro, meu filho. Até a parte difícil.'] },
      { t: 'Elogiar a cortina', amizade: 10, marca: 'zelia_cortina', resposta: ['@alegre Chita do Seu Ananias! Eu mesma costurei, ponto por ponto.'] }]],
    ['fala', 'zelia', '@pensativo Todo dia eu ponho uma flor do mato na janela, pro quarto ficar cheiroso quando ela chegar.', '@alegre Flor é a minha paixão, sabia?'],
    ['balao', 'zelia', 'coracao'],
    ['fim', { topico: { id: 'casa_zelia_pronta', dias: 7 }, depois: () => ZeliaArco.descobreFlor() }],
  ],
};

HISTORIAS.zelia_4 = {
  quem: 'zelia', coracoes: 4, titulo: 'A novidade da Marisa', clima: 'Anda olhando muito o correio',
  // a manhã de chuva é a preferência; passados ZELIA_ARCO.Z2_PACIENCIA dias do arco pronto, qualquer manhã
  get gatilho() {
    const g = { mapa: 'vila', hora: [7 * 60, 12 * 60], depois: 'zelia_2' };
    return ZeliaArco.paciente('z2', ZELIA_ARCO.Z2_PACIENCIA) ? g : Object.assign(g, { chuva: true });
  },
  elenco: { zelia: ZELIA_ARCO.PORTAO.zelia, jocelino: ZELIA_ARCO.PORTAO.jocelino },
  musica: 'musica_dia_2',
  passos: [
    ['camera', ZELIA_ARCO.PORTAO.camera[0], ZELIA_ARCO.PORTAO.camera[1]],
    ['fala', null, () => [typeof Conversas !== 'undefined' && Conversas.chove()
      ? 'Manhã de chuva. A Dona Zélia está no portão, de guarda-chuva, com uma carta aberta na mão.'
      : 'De manhã, a Dona Zélia está no portão, com uma carta aberta na mão.']],
    ['anda', 'jocelino', ZELIA_ARCO.PORTAO.jocelinoVai[0], ZELIA_ARCO.PORTAO.jocelinoVai[1]],
    ['vira', 'zelia', 'jocelino'],
    ['balao', 'zelia', 'exclamacao'],
    ['fala', 'zelia', '@surpreso Jocelino! Chegou carta da Marisa! Ela vem logo, logo...', '@alegre ...e diz que tem NOVIDADE! Com letra maiúscula!'],
    ['fala', null, 'Na carta, com a letra redondinha da Marisa: "Mãe, quando eu chegar eu conto a NOVIDADE. Deixa o quarto arrumado."'],
    ['fala', 'zelia', '@pensativo Novidade com letra maiúscula, meu filho. Isso não é coisa pequena.'],
    ['escolha', 'zelia', '@pensativo Que novidade será?', [
      { t: '"Casamento, aposto"', amizade: 20, marca: 'zelia_aposta_casamento', resposta: ['@surpreso Casamento! Ai, meu Deus, e eu sem vestido novo!'] },
      { t: '"Neném a caminho, com certeza"', amizade: 20, marca: 'zelia_aposta_nenem', resposta: ['@surpreso Um irmãozinho pro Tiaguinho? Ai, meu filho, vou começar o tricô hoje mesmo!'] }]],
    ['fala', 'zelia', '@alegre Seja o que for, no Natal vocês vêm lá em casa. A família toda, viu? Eu faço a ceia.'],
    ['fala', 'zelia', '@alegre Ai, meu filho, eu não vou dormir até ela chegar!'],
    ['fim', { topico: { id: 'novidade_marisa', dias: 5 }, marca: 'zelia_convite_natal' }],
  ],
};

HISTORIAS.zelia_6 = {
  quem: 'zelia', coracoes: 6, titulo: 'O caldo verde', clima: 'Anda picando couve fininha e cantarolando',
  // o sábado (o bilhete dela chega de manhã) é a preferência; passados ZELIA_ARCO.Z3_PACIENCIA dias do arco pronto, qualquer dia em que
  // a pensão abre (o domingo não)
  get gatilho() {
    const g = { mapa: 'pensao_palco', hora: [6 * 60, 17 * 60], depois: 'zelia_4' };
    if (ZeliaArco.paciente('z3', ZELIA_ARCO.Z3_PACIENCIA)) return Object.assign(g, { se: () => ZeliaArco.pensaoAberta() && Conversas.semana() !== 6 });
    return Object.assign(g, { semana: 'Sáb', se: () => ZeliaArco.pensaoAberta() });
  },
  elenco: { rosa: ZELIA_ARCO.SALAO.rosa, jocelino: ZELIA_ARCO.SALAO.jocelino },
  musica: 'musica_dia_3',
  passos: [
    ['aparece', 'zelia', ZELIA_ARCO.SALAO.zeliaEntra[0], ZELIA_ARCO.SALAO.zeliaEntra[1], 'direita'],
    ['som', 'porta', -8],
    ['fala', null, 'Antes da janta, a porta do salão abre. É a Dona Zélia, com uma panela embrulhada num pano de prato.'],
    ['anda', 'zelia', ZELIA_ARCO.SALAO.zeliaVai[0], ZELIA_ARCO.SALAO.zeliaVai[1]],
    ['anda', 'rosa', ZELIA_ARCO.SALAO.rosaVai[0], ZELIA_ARCO.SALAO.rosaVai[1]],
    ['vira', 'jocelino', 'zelia'],
    ['vira', 'rosa', 'zelia'],
    ['vira', 'zelia', 'rosa'],
    ['fala', 'zelia', '@alegre Rosa, prova. Caldo verde de quarenta anos de prática.'],
    ['fala', 'rosa', '@surpreso Dona Zélia! Trouxe pra mim?'],
    ['som', 'mastigar_1'],
    ['balao', 'rosa', 'reticencias'],
    ['fala', 'rosa', '@pensativo Hum... A couve fininha, a linguiça... e mandioca no lugar da batata!'],
    ['fala', 'zelia', '@pensativo E então? Fala a verdade, que eu aguento.'],
    ['vira', 'zelia', 'jocelino'],
    ['fala', 'zelia', '@alegre Prova você também, Jocelino. Duas bocas não mentem.'],
    ['som', 'mastigar_2'],
    ['balao', 'jocelino', 'reticencias'],
    ['escolha', 'zelia', '@pensativo E aí, meu filho?', [
      { t: 'Dizer, com jeito, que falta sal', amizade: 30, marca: 'zelia_falta_sal', ir: 'sal' },
      { t: 'Elogiar', amizade: 20, marca: 'zelia_elogio_caldo', ir: 'elogio' }]],
    ['rotulo', 'sal'],
    ['fala', 'jocelino', 'Tá uma delícia, Dona Zélia. Só... uma pitadinha de sal a mais, quem sabe?'],
    ['balao', 'zelia', 'exclamacao'],
    ['fala', 'zelia', '@surpreso Falta mesmo! Ninguém tem coragem de me dizer nada nessa Vila.'],
    ['fala', 'rosa', '@alegre Com a pitada, fica perfeito. Eu escrevo assim no caderno: com uma pitada a mais.'],
    ['ir', 'fim'],
    ['rotulo', 'elogio'],
    ['fala', 'jocelino', '@alegre Tá uma delícia, Dona Zélia. Caldo de restaurante da capital.'],
    ['balao', 'zelia', 'coracao'],
    ['fala', 'zelia', '@alegre Ai, que menino bom. Quarenta anos de prática, eu disse!'],
    ['rotulo', 'fim'],
    ['vira', 'zelia', 'rosa'],
    ['fala', 'zelia', '@alegre Então tá decidido: a receita é sua, Rosa. E sábado agora eu janto aqui também, que caldo verde não se toma sozinha.'],
    ['fala', 'rosa', '@alegre Vai ter caldo verde no quadro de giz, Dona Zélia. Com o seu nome.'],
    ['fim', { receita: 'caldo_verde_zelia', topico: { id: 'caldo_verde', dias: 5 }, depois: () => ZeliaArco.caldoNaPensao() }],
  ],
};

HISTORIAS.zelia_8 = {
  quem: 'zelia', coracoes: 8, clima: 'Anda contando os dias para a filha chegar',
  // (rodada 1) a chegada pode ser fora do Natal (o Natal longe: as férias do Tiaguinho); a Lembrança tem o nome do dia em que foi
  get titulo() { const d = typeof Historias !== 'undefined' && Historias.vistaEm('zelia_8'); return d && !ZeliaArco.ehNatal(d) ? 'A chegada da Marisa' : 'O Natal da Dona Zélia'; },
  // a carta-convite chega na véspera do Natal (ou na 1ª manhã depois, se o arco ficar pronto mais tarde; com o Natal a mais de 28 dias,
  // na 1ª manhã do arco pronto); a cena, da manhã seguinte em diante
  gatilho: { mapa: 'vila', hora: [7 * 60, 13 * 60], depois: 'zelia_6', se: () => ZeliaArco.conviteDeOntem() },
  elenco: { zelia: ZELIA_ARCO.RUA.zelia, jocelino: ZELIA_ARCO.RUA.jocelino, cachorro: ZELIA_ARCO.RUA.cachorro },
  nomes: { marisa: 'Marisa', tiaguinho: 'Tiaguinho' },
  musica: 'musica_festa',
  passos: [
    ['camera', ZELIA_ARCO.RUA.camera[0], ZELIA_ARCO.RUA.camera[1]],
    ['fala', null, () => [ZeliaArco.manhaDaChegada()]],
    ['vira', 'zelia', 'jocelino'],
    ['fala', 'zelia', '@alegre Veio, meu filho! Olha o ônibus descendo a serra.'],
    ['aparece', 'marisa', ZELIA_ARCO.RUA.marisaDesce[0], ZELIA_ARCO.RUA.marisaDesce[1], 'baixo'],
    ['aparece', 'tiaguinho', ZELIA_ARCO.RUA.tiaguinhoDesce[0], ZELIA_ARCO.RUA.tiaguinhoDesce[1], 'baixo'],
    ['fala', null, 'Lá em cima, o ônibus para e buzina. Desce uma moça de mala de couro e um menino de boné.'],
    ['anda', 'tiaguinho', ZELIA_ARCO.RUA.tiaguinhoVai[0], ZELIA_ARCO.RUA.tiaguinhoVai[1], 'junto'],
    ['anda', 'marisa', ZELIA_ARCO.RUA.marisaVai[0], ZELIA_ARCO.RUA.marisaVai[1]],
    ['vira', 'zelia', 'marisa'],
    ['vira', 'marisa', 'zelia'],
    ['balao', 'zelia', 'coracao'],
    ['fala', 'zelia', '@alegre Marisa! Minha filha!'],
    ['fala', 'marisa', '@alegre Mãe! Que saudade!'],
    ['vira', 'marisa', 'jocelino'],
    ['fala', 'marisa', '@alegre E esse é o Jocelino das cartas? A mãe não fala de outra coisa.'],
    ['vira', 'marisa', 'zelia'],
    ['fala', 'zelia', '@pensativo Agora conta, menina. Que NOVIDADE é essa?'],
    ['fala', 'marisa', '@alegre Mãe, me transferiram pro banco de Praia Grande. A gente vai morar no quarto da cortina!'],
    ['balao', 'zelia', 'exclamacao'],
    ['fala', 'zelia', () => {
      const a = ZeliaArco.aposta();
      if (!a) return ['@surpreso Morar aqui? Com a gente? Ai, meu Deus, eu nem sabia que podia pedir uma coisa dessas!'];   // (o save sem a aposta)
      return ['@surpreso Morar aqui? Com a gente? ' + (a === 'casamento' ? 'O Jocelino apostou em casamento!' : 'O Jocelino apostou em neném!'),
        '@alegre ...A aposta do Jocelino tava errada, mas eu tô tão feliz que nem ligo!'];
    }],
    ['vira', 'tiaguinho', 'cachorro'],
    ['balao', 'tiaguinho', 'exclamacao'],
    ['fala', 'tiaguinho', '@alegre Um cachorro! Vó, ele tem nome?'],
    ['fala', 'zelia', '@alegre Caramelo. É da Vila inteira.'],
    ['anda', 'cachorro', ZELIA_ARCO.RUA.cachorroCorre[0], ZELIA_ARCO.RUA.cachorroCorre[1], 'junto'],
    ['anda', 'tiaguinho', ZELIA_ARCO.RUA.tiaguinhoCorre[0][0], ZELIA_ARCO.RUA.tiaguinhoCorre[0][1]],
    ['anda', 'tiaguinho', ZELIA_ARCO.RUA.tiaguinhoCorre[1][0], ZELIA_ARCO.RUA.tiaguinhoCorre[1][1], 'junto'],
    ['fala', 'marisa', '@alegre Tiaguinho! Não corre na rua, menino!'],
    ['vira', 'zelia', 'jocelino'],
    ['escolha', 'zelia', '@alegre Ai, meu filho, que alegria! E agora?', [
      { t: 'Levar todo mundo para jantar na pensão', amizade: 30, marca: 'zelia_natal_pensao',
        resposta: ['@alegre Jantar na pensão da Rosa, todo mundo junto! Eu levo a sobremesa.'] },
      { t: 'Ajudar a carregar as malas', amizade: 30, marca: 'zelia_natal_malas',
        resposta: ['@alegre Que menino prestativo! Essa mala da Marisa pesa mais que o Tiaguinho.'] }]],
    ['fala', 'zelia', '@alegre E toma, meu filho: uma muda da minha roseira, pro quintal de vocês. Amanhã cedo eu mesma vou lá plantar.'],
    ['fala', 'marisa', '@alegre A mãe me contou da pensão da Rosa. Pode avisar que quinta eu tô lá!'],
    ['fim', { topico: { id: 'marisa_chegou', dias: 7 }, depois: () => ZeliaArco.mudaram() }],
  ],
};

// ---------- o estado do arco (no save), o bilhete do sábado e a carta-convite do Natal ----------
INICIADORES.push(s => {
  G.zeliaArco = Object.assign({}, s.zeliaArco || {});
  // (o save de antes do motor de falas dá a Vila inteira por conhecida depois de 2 semanas, conversas.js: a filha e o neto da Zélia só
  // se conhecem quando chegam; senão a 1ª conversa não sai e a aba Gente mostraria quem ainda vai chegar)
  if (!s.conhecidos && G.conhecidos) for (const k of ['marisa', 'tiaguinho']) delete G.conhecidos[k];
  ZeliaArco.arruma();
});
COLETORES.push(s => { s.zeliaArco = Object.assign({}, G.zeliaArco || {}); });
CARTAS.zelia_caldo = { de: 'Dona Zélia', dia: 1e9,
  texto: 'Jocelino: hoje à tarde, antes da janta, eu passo na pensão com uma panela. Avisa a Rosa pra deixar uma boca do fogão livre. — Zélia' };
CARTAS.zelia_natal = { de: 'Dona Zélia', dia: 1e9,
  texto: 'Jocelino e Rosa: amanhã cedo a Marisa chega no ônibus das nove, lá na rua de cima. Vem esperar comigo? Vou estar de vestido novo. A NOVIDADE, enfim! — Zélia' };
MANHA.push(() => {
  const A = ZeliaArco._arco();
  if (ZeliaArco._z1Pronto() && !A.z1) A.z1 = G.dia;
  if (ZeliaArco._z2Pronto() && !A.z2) A.z2 = G.dia;
  if (ZeliaArco._z3Pronto() && !A.z3) A.z3 = G.dia;
  // Z3: o bilhete no sábado de manhã (uma vez)
  if (ZeliaArco._z3Pronto() && !ZeliaArco.bilheteChegou() && G.correio && Conversas.semana() === 5) G.correio.caixa.push('zelia_caldo');
  // Z4: a carta-convite na véspera do Natal (ou na 1ª manhã depois, se o arco ficou pronto mais tarde no verão; com o Natal a mais de
  // 28 dias, na 1ª manhã do arco pronto; uma vez)
  if (ZeliaArco._z4Pronto() && !A.convite && G.correio && ZeliaArco._naEpocaDoConvite()) { G.correio.caixa.push('zelia_natal'); A.convite = G.dia; }
  ZeliaArco.arruma();
});
// A lembrança do dia na Caderneta (Hoje): o caldo verde no sábado (com o bilhete) e a chegada da Marisa (com a carta), antes da hora.
if (typeof CADERNETA !== 'undefined') CADERNETA.push(() => {
  const r = [];
  if (ZeliaArco._z3Pronto() && ZeliaArco.bilheteChegou() && Conversas.semana() === 5 && G.minutos < 17 * 60)
    r.push({ id: 'hoje_zelia_caldo', aba: 'hoje', texto: 'A Dona Zélia passa na pensão com uma panela, antes da janta (o bilhete dela)' });
  if (ZeliaArco._z4Pronto() && ZeliaArco.conviteDeOntem() && G.minutos < 13 * 60)
    r.push({ id: 'hoje_zelia_natal', aba: 'hoje', texto: 'A Marisa chega no ônibus das nove: a Dona Zélia espera na rua de cima da Vila (a carta dela)' });
  return r;
});

// ---------- o mundo muda ----------
// A Zélia aos sábados (depois do Z3) e a Marisa às quintas (depois do Z4): CLIENTELA_ARCOS (clientela.js).
if (typeof CLIENTELA_ARCOS !== 'undefined') CLIENTELA_ARCOS.push(
  { id: 'zelia_sabado', dia: 5, se: () => ZeliaArco._visto('zelia_6'),
    entrada: { id: 'zelia', nome: 'Dona Zélia', prato: 'caldo_verde_zelia', fala: 'Sábado agora é dia de caldo verde, Rosa! Com a pitada a mais.', elogio: 'Esse caldo tá melhor que o meu. Não conta pra ninguém!' } },
  { id: 'marisa_quinta', dia: 3, se: () => ZeliaArco.moram(),
    entrada: { id: 'marisa', nome: 'Marisa', prato: 'virado', fala: 'Quinta é o meu dia, Rosa! Saí do banco direto pra cá.', elogio: 'Virado igual ao da capital. Melhor, até!' } });
// O Tiaguinho e a roseira no quintal (ao montar; a Marisa e o Tiaguinho na Vila: mapa_vila.js).
AO_MONTAR.push(b => { if (b.id === 'quintal') { ZeliaArco.poeTiaguinhoNoQuintal(b); ZeliaArco.poeRoseira(b); } });
AO_ENTRAR_MAPA.push(id => { if (id === 'quintal' && G.mapa) ZeliaArco.poeRoseira(G.mapa); });
ATUALIZADORES.push(() => {
  if (G.mapaId !== 'quintal' || !G.mapa) return;
  for (const m of G.mapa.moradores) if (m.daZelia) m.visivel = ZeliaArco.tiaguinhoNoQuintal();
});
// Z3: a panela de caldo verde na mão da Zélia, enquanto ela está no salão (o palco não roda no simulador).
if (typeof EXTRAS_MUNDO !== 'undefined') EXTRAS_MUNDO.push(m => {
  if (!m || m.id !== 'pensao_palco' || !ZeliaArco._tocando('zelia_6')) return [];
  const z = Historias._ator('zelia'); if (!z || z.visivel === false) return [];
  const lado = z.dir === DIR.ESQUERDA ? -1 : 1;
  return [{ y: z.y + 1, desenha: ctx => desenhaPrato(ctx, 'caldo_verde_zelia', z.x + lado * 24, z.y - 36, 1, 0.95) }];   // (nas mãos, na altura da cintura)
});

// ---------- a gente nova: a Marisa e o Tiaguinho (as falas; o retrato normal e o alegre são da T8) ----------
CONVERSAS.marisa = {
  nome: 'Marisa',
  primeira: ['@alegre Você é o Jocelino! A mãe fala de você numa carta sim, na outra também.', '@alegre Marisa, filha da Dona Zélia. Agora moradora da Vila Maré!'],
  gostos: { ama: ['flor', 'goiabada'], gosta: ['cafe', 'bolo', 'pao'], naoGosta: ['pedra', 'sardinha'], odeia: ['ferro_velho'] },
  linhas: [
    { quando: { semana: 'Qui' }, fala: ['@alegre Quinta é o meu dia na pensão da Rosa. Já tô contando as horas.'] },
    { quando: { semana: ['Sáb', 'Dom'] }, fala: ['Sábado sem banco, que coisa boa. Vou levar o Tiaguinho pra ver o mar.'] },
    { quando: { chuva: true }, fala: ['Com chuva, a mãe fica olhando as roseiras pela janela, igual criança.'] },
    { fala: ['O banco de Praia Grande é pequenininho. Já conheço todo mundo pelo nome.'] },
    { fala: ['@alegre A mãe acorda às cinco pra regar as roseiras. Eu acordo às sete e ela já fez café, bolo e fofoca.'] },
    { fala: ['Se você vir o Tiaguinho correndo atrás do Caramelo, manda ele pra casa antes do sol baixar, viu?'] },
  ],
};
CONVERSAS.tiaguinho = {
  nome: 'Tiaguinho',
  primeira: ['@alegre Oi! Eu sou o Tiaguinho. Tenho seis anos e sei o hino inteiro!'],
  gostos: { ama: ['pedra_bonita', 'cocada'], gosta: ['concha', 'caju', 'bolo'], naoGosta: ['couve'], odeia: ['pedra'] },
  linhas: [
    { quando: { lugar: 'quintal' }, fala: ['@alegre Eu e o Zezinho tamo caçando tatuzinho! Já achei três.'] },
    { quando: { chuva: true }, fala: ['A vó não deixa eu pular na poça. Mas o Zezinho disse que no quintal pode.'] },
    { fala: ['@alegre O Zezinho me mostrou onde o Caramelo dorme!'] },
    { fala: ['@alegre Na capital não tinha mar. Aqui tem mar até no fim da rua!'] },
    { fala: ['A vó diz que caldo verde só presta com uma pitada a mais de sal. Eu que tiro a couve do pé.'] },
  ],
};

// ---------- as falas (os tópicos da Vila e a Zélia depois de cada cena) ----------
{
  const T = (quem, topico, fala, se) => { if (typeof _T === 'function') _T(quem, topico, fala, se); else if (CONVERSAS[quem]) CONVERSAS[quem].linhas.push({ quando: Object.assign({ topico }, se ? { se } : {}), fala }); };
  // Z1: o quarto da Marisa (a fala da spec, 3.1)
  T('zelia', 'casa_zelia_pronta', ['@alegre Já botei a cortina no quarto da Marisa!']);
  T('rosa', 'casa_zelia_pronta', ['@alegre A Dona Zélia me mostrou a cortina do quarto da filha. Chita amarela, florida. Ficou um encanto.']);
  T('ananias', 'casa_zelia_pronta', ['A Dona Zélia levou três metros de chita amarela. Disse que é pro quarto da filha da capital.']);
  // Z2: a NOVIDADE
  T('zelia', 'novidade_marisa', () => [ZeliaArco.aposta() === 'nenem' ? '@pensativo Neném, você acha mesmo? Já comecei o sapatinho de tricô, só por garantia.' : '@pensativo Casamento, você acha mesmo? Já tô de olho num vestido, só por garantia.']);
  T('rosa', 'novidade_marisa', ['@alegre A Zélia leu a carta da Marisa pro salão inteiro. NOVIDADE, com letra maiúscula! Que será, hein?']);
  T('ze', 'novidade_marisa', ['A Dona Zélia contou da NOVIDADE da filha até pro pessoal da obra. A Vila inteira tá apostando, rapaz.']);
  T('lourival', 'novidade_marisa', ['A Dona Zélia não para de falar da carta da filha, compadre. Eu aposto que a moça vem morar aqui. Pescador sente essas coisas.']);
  // Z3: o caldo verde
  T('zelia', 'caldo_verde', () => [Conversas.respondeu('zelia_falta_sal') ? '@alegre Quarenta anos sem ninguém me dizer que faltava sal! Agora o meu caldo tá perfeito, meu filho.' : '@alegre A Rosa pôs o meu caldo verde no quadro de giz! Com o meu nome!']);
  T('rosa', 'caldo_verde', ['@alegre O caldo verde da Dona Zélia entrou no caderno. Quarenta anos de prática, e eu achando que sabia fazer caldo!']);
  T('bira', 'caldo_verde', ['Caldo verde no sábado da pensão? Esse eu não perco, rapaz.']);
  T('juca', 'caldo_verde', ['@alegre A Zélia ensinou o caldo verde pra Rosa? Então sábado eu janto fora, sobrinho. Na pensão, é claro.']);
  // Z4: a Marisa e o Tiaguinho chegaram
  T('zelia', 'marisa_chegou', ['@alegre Casa cheia, meu filho! O Tiaguinho acorda cantando o hino e a Marisa já arrumou o quarto do jeito dela.']);
  T('rosa', 'marisa_chegou', ['@alegre A Marisa veio morar com a Zélia! E quinta ela janta na pensão. Vou caprichar no virado, que ela é da capital.']);
  T('ritinha', 'marisa_chegou', ['@alegre O Tiaguinho sabe o hino inteiro, pai! Até a parte difícil. Eu ensinei a tabuada pra ele.']);
  T('zezinho', 'marisa_chegou', ['@alegre Pai, o Tiaguinho corre mais que o Caramelo! Amanhã ele vem brincar no quintal.']);
  T('juca', 'marisa_chegou', ['@alegre A filha da Zélia veio pra ficar? A Vila tá enchendo, sobrinho. Daqui a pouco precisa de outro prédio.']);
  T('ananias', 'marisa_chegou', ['A Marisa abriu conta no banco e já me ensinou a fazer cheque. Moça da capital, mas de coração daqui.']);
  // a Zélia depois (de vez em quando: o estado do arco, a regra 5, só em 1 de cada 3 dias)
  if (CONVERSAS.zelia) CONVERSAS.zelia.linhas.push(
    { quando: { se: () => ZeliaArco.moram() && G.dia % 3 === 0 }, fala: ['@alegre Casa cheia é casa feliz, meu filho. O Tiaguinho já sabe o nome de todo mundo da Vila.'] },
    { quando: { se: () => ZeliaArco._visto('zelia_6') && !ZeliaArco.moram() && G.dia % 4 === 0 }, fala: ['@alegre Sábado tem caldo verde na pensão, viu? Com a pitada a mais.'] });
}
