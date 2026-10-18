// Família Santos — historias/juca.js — o arco do Tio Juca, "A viola e a mangueira" (T10 das conversas e histórias; spec
// docs/superpowers/specs/2026-10-15-conversas-historias-design.md, seção 8.2; o motor é o historias.js, seção 6).
// O Juca é da família: sem corações (decisão 3 da seção 13). As cenas disparam por MARCOS DA VIDA DA CASA, num lugar e numa hora em
// que o Jocelino passa todo dia (o quintal de manhã cedo ou no fim da tarde; a casa nova à noite); no máximo 1 cena por dia (o motor
// cuida). O sonho dele: ver a família plantada na terra que ele guardou. O tio brincalhão, que tocou viola nos forrós de Aracaju.
// Só temas leves (a seção 8).
//   J1 juca_1 "A viola de dez cordas": a partir do dia 5; sem chuva, no quintal (6h–10h ou 16h–19h). → a viola fica na varanda da
//      casa dele (QUINTAL.VIOLA, mapa_quintal.js), com clique; nas festas da Vila o Juca fala que vai tocar (a fala de festa).
//   J2 juca_2 "O papel da roça": o dia 2 do arco do loteamento (mata-sítio 2.1, "A roça é nossa"): à noite, na casa nova, o Juca
//      chega com a pasta da posse da roça velha e a Rosa conta o sonho do sítio. O arco do loteamento ainda não toca no jogo
//      (loteamento.js são só as regras): até ele tocar, o J2 é uma CONVERSA SIMPLES com o mesmo marco que abre o arco (pedreiro e a
//      casa mudada: Loteamento.gatilho). Com o arco andando, o J2 espera o passo 'posse' e é ele que dá o passo (Loteamento.fazer);
//      com o anúncio do Moreira feito, ganha as falas do Moreira (@bravo / @alegre).
//      PARA QUEM LIGAR O ARCO DO LOTEAMENTO (a T9 da mata): se o J2 simples já tocou antes do arco (JucaArco.posseJaContada()), o Juca
//      já mostrou o papel da posse: o passo 'posse' tem de andar sem cena (Loteamento.fazer('posse') no dia dele, com uma fala curta
//      do Juca lembrando a pasta), e não esperar o J2, que não volta. Sem isso, o arco para na posse.
//   J3 juca_3 "A primeira mangueira": o sítio aberto (a serra tombada e a licença), manhã sem chuva, NO SÍTIO. → a plaquinha com o
//      nome escolhido ao lado da muda; a mangueira dá fruta uma estação mais cedo (JUCA_ARCO.MANGUEIRA_ADIANTA, para o pomar ler).
//      O mapa do sítio ainda não existe (mata-sítio T8 em diante): a cena fica pronta em JUCA_J3 e só entra em HISTORIAS quando
//      MAPAS_DEF.sitio existir (JucaArco.registrarJ3). Até lá, o J3 espera.
//   J4 juca_4 "A passagem para Aracaju": o Edifício Maré entregue (o ato 5); logo depois, qualquer manhã ou fim de tarde no quintal
//      (a inauguração espera o J4 no máximo 3 dias: firma.js, a carta da Prefeitura). → a
//      marca `juca_vai_buscar`: na inauguração, a Dona Zefa chega com o Juca, de viola (firma.js); a escolha `juca_viagem` diz como
//      (de ônibus, com a passagem paga, ou no caminhão do Calixto). Sem o J4, quem traz a Zefa é o Calixto, e o Juca a recebe no quintal.
// As falas são rascunho, revisadas com o dono (a seção 8). Nenhuma tela diz "história" nem "missão".

const JUCA_ARCO = {
  J1_DIA: 5,                 // J1: a partir do dia 5
  // o quintal nas horas em que o Jocelino passa: saindo de casa de manhã e voltando no fim da tarde (antes da janta)
  HORA_QUINTAL: { manha: [6 * 60, 10 * 60], tardinha: [16 * 60, 19 * 60] },
  HORA_CASA: [19 * 60, 24 * 60],   // J2: à noite, em casa (a mata-sítio 2.1: "à noite, na casa da família")
  J2_SIMPLES: true,          // J2: sem o arco do loteamento tocando, a conversa simples (o marco do arco). false: só com o passo 'posse'
  J4_ESPERA: 3,              // J4: a inauguração da firma espera o J4 no máximo 3 dias depois do arco pronto (firma.js)
  PASSAGEM: 300,             // J4: a passagem de ida e volta do Juca a Aracaju (Cr$), se o Jocelino paga
  MANGUEIRA_ADIANTA: 1,      // J3: a mangueira com nome dá fruta 1 estação mais cedo (o pomar do sítio lê JucaArco.adiantaFruta)
  // as cenas do quintal: o Juca na frente da casa dele, ao lado da viola (QUINTAL.VIOLA), o Jocelino chegando pelo caminho
  QUINTAL: { juca: [10, 10, 'esquerda'], jocelino: [12, 12, 'cima'], jocelinoVai: [11, 11], zezinho: [15, 12, 'esquerda'], ritinha: [9, 12, 'direita'] },
  // J2: a casa nova por dentro (a volta da mesa da cozinha; a caixa da fala cobre a parte de baixo do cômodo); o Juca entra pela porta
  CASA: { rosa: [5, 4, 'direita'], jocelino: [7, 3, 'direita'], juca: [8, 8, 'cima'], jucaVai: [[8, 5], [8, 4]] },   // (T16) antes parava em (9,3), com o chapéu em cima do baú do canto da cozinha (9,2)
  // os nomes da plaquinha (J3) e quem comenta
  MANGUEIRA: { ritinha: 'Mangueira da Ritinha', zezinho: 'Mangueira do Zezinho', juca: 'Mangueira do Juca' },
};

const JucaArco = {
  _visto: id => typeof Historias !== 'undefined' && Historias.viu(id),
  _tocando: id => typeof Historias !== 'undefined' && Historias.tocando() === id,
  // A hora do quintal que vale agora (de manhã, a da manhã; de tarde, a do fim da tarde): o gatilho casa nas duas.
  horaQuintal() { return G.minutos < 13 * 60 ? JUCA_ARCO.HORA_QUINTAL.manha : JUCA_ARCO.HORA_QUINTAL.tardinha; },

  // ---------- J1: a viola na varanda ----------
  // A viola está na varanda: depois do J1, e durante ele (o Juca afinando).
  violaNaVaranda() { return JucaArco._visto('juca_1') || JucaArco._tocando('juca_1'); },
  cordaNova() { return typeof Conversas !== 'undefined' && Conversas.respondeu('juca_corda'); },
  // A viola encostada na parede da casa do Juca, do lado da porta (um interativo sem ladrilho sólido: o Jocelino passa na frente).
  poeViola(b) {
    if (!b || b.id !== 'quintal') return;
    for (const o of b.objs.filter(o => o.id === 'viola_juca')) b.tirar(o);
    if (!JucaArco.violaNaVaranda()) return;
    const V = QUINTAL.VIOLA, o = { tipo: 'inter', id: 'viola_juca', nome: 'objetos/viola_juca', x: V.x, y: V.y, solido: false, tiles: [{ x: V.tx, y: V.ty }], acao: null, ferramenta: null };
    if (!b.ocupado.has(chaveT(V.tx, V.ty))) b.ocupado.set(chaveT(V.tx, V.ty), o);
    o.desenha = ctx => desenhaPe(ctx, 'objetos/viola_juca', o.x, o.y, 1, V.escala);
    o.acao = () => { abrirPlaca(JucaArco.fraseViola()); return true; };
    b.objs.push(o);
    return o;
  },
  fraseViola() {
    return 'A viola de dez cordas do Tio Juca, encostada na parede da varanda. Tocou em forró de Aracaju a Caruaru.' +
      (JucaArco.cordaNova() && JucaArco._visto('juca_1') && G.dia - Historias.vistaEm('juca_1') >= 2 ? ' A quarta corda é nova: o Seu Tonico esticou.' : ' "Viola guardada no armário esquece a música", diz ele.');
  },
  violaFicou() {
    avisar('A viola do Tio Juca fica na varanda da casa dele.');
    if (G.mapa) JucaArco.poeViola(G.mapa);
  },

  // ---------- J2: o papel da roça (o loteamento) ----------
  _temLoteamento: () => typeof Loteamento !== 'undefined' && !!G.loteamento,
  // O arco do loteamento já começou (o anúncio do Moreira feito, ou mais).
  loteamentoAndando() { return JucaArco._temLoteamento() && Loteamento.comecou(); },
  // O J2 pode tocar: com o arco andando, só no dia do passo 'posse' (ou depois dele); sem o arco, a conversa simples com o marco
  // que abre o arco (o Jocelino pedreiro e a casa mudada).
  j2Pronto() {
    if (!JucaArco._temLoteamento()) return false;
    if (JucaArco.loteamentoAndando()) return Loteamento.devido() === 'posse' || Loteamento.feito('posse');
    return JUCA_ARCO.J2_SIMPLES && Loteamento.gatilho();
  },
  moreiraNoArco() { return JucaArco.loteamentoAndando() && Loteamento.feito('anuncio'); },
  // O fim do J2: com o arco andando, o J2 é o passo 'posse' do loteamento.
  posseMostrada() { if (JucaArco._temLoteamento() && Loteamento.devido() === 'posse') Loteamento.fazer('posse'); },
  // (rodada 1) O Juca já mostrou o papel da posse (o J2 visto, simples ou do arco): o arco do loteamento, quando tocar, não espera
  // outra cena para o passo 'posse' (ver o cabeçalho).
  posseJaContada() { return JucaArco._visto('juca_2'); },

  // ---------- J3: a primeira mangueira (no sítio) ----------
  sitioAberto() {
    return typeof Loteamento !== 'undefined' && !!G.loteamento && Loteamento.serraTombada() && typeof Sitio !== 'undefined' && !!G.sitio && Sitio.temLicenca();
  },
  // Onde fica cada um no sítio: o Jocelino onde está, o Juca 2 ladrilhos ao lado, a muda do outro lado do Juca (num ladrilho livre).
  // Calculado no começo da cena (o elenco) e guardado para a muda aparecer no lugar certo.
  _lugarJ3: null,
  lugarJ3() {
    if (!G.jog) return { s: 1, juca: [3, 3], muda: [4, 3] };
    const b = G.mapa, jx = Math.floor(G.jog.x / TILE), jy = Math.floor((G.jog.y - 6) / TILE);
    const livre = (x, y) => !b || (x > 0 && y > 0 && x < b.larg - 1 && y < b.alt - 1 && (!b.livreEm || b.livreEm(x, y)) && !b.ocupado.has(chaveT(x, y)));
    let L = null;
    for (const s of [1, -1]) if (livre(jx + 2 * s, jy) && livre(jx + 3 * s, jy) && livre(jx + 3 * s, jy + 1)) { L = { s, juca: [jx + 2 * s, jy], muda: [jx + 3 * s, jy] }; break; }
    L = L || { s: 1, juca: [jx + 2, jy], muda: [jx + 3, jy] };
    return (JucaArco._lugarJ3 = L);
  },
  nomeMangueira() { return JUCA_ARCO.MANGUEIRA[(G.jucaArco || {}).mangueira && G.jucaArco.mangueira.nome] || ''; },
  // A mangueira com nome dá fruta mais cedo: quantas estações (o pomar do sítio, quando existir, lê isto). 0 sem o J3.
  adiantaFruta() { return G.jucaArco && G.jucaArco.mangueira ? JUCA_ARCO.MANGUEIRA_ADIANTA : 0; },
  plantou() {
    const L = JucaArco._lugarJ3 || JucaArco.lugarJ3(), nome = Conversas.resposta('juca_mangueira') || 'juca';
    G.jucaArco = G.jucaArco || {};
    G.jucaArco.mangueira = { mapa: G.mapaId, x: L.muda[0], y: L.muda[1], nome, dia: G.dia };
    avisar(`A muda de mangueira está plantada no sítio, com a plaquinha "${JUCA_ARCO.MANGUEIRA[nome]}". Mangueira com nome dá fruta mais cedo.`);
    if (G.mapa) JucaArco.poeMangueira(G.mapa);
  },
  // A muda e a plaquinha no mapa do sítio (a arte da mangueira grande é do mata-sítio: até lá, a muda de árvore).
  poeMangueira(b) {
    const M = (G.jucaArco || {}).mangueira; if (!b) return;
    for (const o of b.objs.filter(o => o.daMangueira)) b.tirar(o);
    if (!M || b.id !== M.mapa) return;
    const muda = b.enfeite('objetos/muda_arvore', M.x, M.y, false); muda.daMangueira = true;
    const pl = b.interativo('plaquinha_mangueira', 'objetos/plaquinha', M.x, M.y + 1, 1, 1, null, false); pl.daMangueira = true;
    pl.acao = () => { abrirPlaca(`"${JUCA_ARCO.MANGUEIRA[M.nome]}", na letra caprichada da Ritinha. Plantada pelo Tio Juca: "Mangueira demora pra dar manga. Eu espero sentado."`); return true; };
    return pl;
  },
  registrarJ3() {
    if (typeof MAPAS_DEF !== 'undefined' && MAPAS_DEF.sitio && !HISTORIAS.juca_3) HISTORIAS.juca_3 = JUCA_J3;
    return !!HISTORIAS.juca_3;
  },

  // ---------- J4: a passagem para Aracaju ----------
  predioEntregue() { return typeof Firma !== 'undefined' && Firma.predioEntregue(); },
  _j4Pronto() { return JucaArco._visto('juca_1') && !JucaArco._visto('juca_4') && JucaArco.predioEntregue() && !(G.firma && G.firma.feita); },
  // (rodada 1) A inauguração espera o J4? Só enquanto ele pode tocar de verdade, e no máximo JUCA_ARCO.J4_ESPERA dias (firma.js).
  seguraInauguracao() { return JucaArco._j4Pronto() && G.dia - ((G.jucaArco || {}).j4 || G.dia) < JUCA_ARCO.J4_ESPERA; },
  podePagar() { return G.dinheiro >= JUCA_ARCO.PASSAGEM; },
  // O que o final lê (firma.js): '' sem o J4; 'onibus' (a passagem paga) ou 'calixto' (o caminhão do Calixto).
  viagem() {
    if (typeof Conversas === 'undefined' || !Conversas.respondeu('juca_vai_buscar')) return '';
    return Conversas.resposta('juca_viagem') === 'onibus' ? 'onibus' : 'calixto';
  },
  passagem() {
    if (Conversas.resposta('juca_viagem') === 'onibus' && G.dinheiro >= JUCA_ARCO.PASSAGEM) {
      G.dinheiro -= JUCA_ARCO.PASSAGEM; G.gastoHoje = (G.gastoHoje || 0) + JUCA_ARCO.PASSAGEM;
      if (typeof sons !== 'undefined' && sons.tocar) sons.tocar('contagem_dinheiro', 1, 0.05, -8);
      avisar(`A passagem do Tio Juca: Cr$ ${JUCA_ARCO.PASSAGEM}. Na inauguração, ele traz a Dona Zefa de Aracaju.`);
    } else avisar('O Calixto leva o Tio Juca no caminhão. Na inauguração, ele traz a Dona Zefa de Aracaju.');
    if (typeof hudSujo === 'function') hudSujo();
  },
};

// ---------- as cenas ----------
const _QJ = JUCA_ARCO.QUINTAL;

HISTORIAS.juca_1 = {
  quem: 'juca', titulo: 'A viola de dez cordas', clima: 'Anda mexendo numa viola velha que achou no fundo do armário',
  get gatilho() { return { mapa: 'quintal', hora: JucaArco.horaQuintal(), chuva: false, se: () => G.dia >= JUCA_ARCO.J1_DIA }; },
  elenco: { juca: _QJ.juca, jocelino: _QJ.jocelino, zezinho: _QJ.zezinho, ritinha: _QJ.ritinha },   // (as crianças no lugar: passeando, ficavam na frente do Jocelino)
  musica: 'musica_dia_2',
  passos: [
    ['camera', 'juca'],
    ['fala', null, () => [(G.minutos < 13 * 60 ? 'De manhãzinha' : 'No fim da tarde') + ', o Tio Juca está na frente de casa, afinando uma viola velha de dez cordas.']],
    ['balao', 'juca', 'nota_musical'],
    ['anda', 'jocelino', _QJ.jocelinoVai[0], _QJ.jocelinoVai[1]],
    ['vira', 'juca', 'jocelino'],
    ['fala', 'juca', '@alegre Achei no fundo do armário, sobrinho. E ainda afina, olha só!'],
    ['fala', 'juca', '@alegre Toquei em forró de Aracaju a Caruaru, sabia? As moças faziam fila.', '@pensativo ...Ou era fila pro banheiro. Faz tempo.'],
    ['balao', 'zezinho', 'exclamacao'],
    ['anda', 'zezinho', 13, 12],
    ['fala', 'zezinho', '@alegre O Tio Juca tem viola?!'],
    ['vira', 'juca', 'jocelino'],
    ['escolha', 'juca', '@alegre E aí, sobrinho?', [
      { t: '"Toca uma de Aracaju, Tio"', marca: 'juca_tocou', ir: 'toca' },
      { t: '"Tá precisando de corda nova"', marca: 'juca_corda', ir: 'corda' }]],
    ['rotulo', 'toca'],
    ['musica', 'musica_festa'],
    ['balao', 'juca', 'nota_musical', 'junto'],
    ['anda', 'zezinho', 14, 12],
    ['balao', 'zezinho', 'nota_musical', 'junto'],
    ['anda', 'zezinho', 13, 12],
    ['anda', 'zezinho', 14, 12],
    ['anda', 'zezinho', 13, 12],
    ['vira', 'zezinho', 'juca'],
    ['balao', 'zezinho', 'coracao'],
    ['fala', 'juca', '@alegre Isso, Zezinho! Pé de forró a gente traz de berço.'],
    ['musica', 'musica_dia_2'],
    ['ir', 'fim'],
    ['rotulo', 'corda'],
    ['balao', 'juca', 'exclamacao'],
    ['fala', 'juca', '@surpreso Olha o ouvido do rapaz!', '@alegre A quarta corda tá frouxa faz uns quinze anos. O Seu Tonico arruma: ele estica até arame de cerca.'],
    ['rotulo', 'fim'],
    ['fala', 'juca', '@alegre Vou deixar ela aqui na varanda. Viola guardada no armário esquece a música.'],
    ['fim', { topico: { id: 'viola_juca', dias: 5 }, depois: () => JucaArco.violaFicou() }],
  ],
};

HISTORIAS.juca_2 = {
  quem: 'juca', titulo: 'O papel da roça', clima: 'Anda procurando um papel antigo nas gavetas',
  gatilho: { mapa: 'casa_familia_dentro', hora: JUCA_ARCO.HORA_CASA, depois: 'juca_1', se: () => JucaArco.j2Pronto() },
  elenco: { rosa: JUCA_ARCO.CASA.rosa, jocelino: JUCA_ARCO.CASA.jocelino, juca: JUCA_ARCO.CASA.juca },
  musica: 'musica_noite_2',
  passos: [
    ['fala', null, 'Batem na porta. É o Tio Juca, com uma pasta de papelão amarrada com barbante debaixo do braço.'],
    ...JUCA_ARCO.CASA.jucaVai.map(([x, y]) => ['anda', 'juca', x, y]),
    ['vira', 'juca', 'jocelino'],
    ['vira', 'jocelino', 'juca'],
    ['fala', 'juca', '@alegre Boa noite, gente. Arrumando a casa, agora que vocês se mudaram, achei isso aqui no fundo da gaveta.'],
    ['fala', null, 'Dentro da pasta, um papel amarelado, carimbado e assinado: a posse da roça velha, no pé da serra.'],
    ['fala', 'juca', '@pensativo A roça velha. Meu pai abriu ela com a enxada, e o papel veio parar comigo. Tá no mato faz tempo.'],
    ['se', () => !JucaArco.moreiraNoArco(), 'simples'],
    ['fala', 'juca', '@bravo E esse Moreira querendo fazer loteamento lá em cima! Esse Moreira acha que terra é só papel!', '@alegre Mas o papel tá aqui, ó!'],
    ['ir', 'sonho'],
    ['rotulo', 'simples'],
    ['fala', 'juca', '@alegre Tá tudo aqui, ó: carimbado e assinado. Um dia aquilo vira o sítio de vocês.'],
    ['rotulo', 'sonho'],
    ['vira', 'rosa', 'juca'],
    ['fala', 'rosa', '@pensativo Um sítio... Umas galinhas, uma vaquinha...', '@alegre O queijo ia ser nosso, Jocelino. E o ovo da pensão também.'],
    ['balao', 'rosa', 'coracao'],
    ['fala', 'juca', '@alegre Então tá decidido. Terra parada não dá nem capim. Vou guardar essa pasta com cuidado.'],
    ['fim', { topico: { id: 'roca_velha', dias: 5 }, depois: () => JucaArco.posseMostrada() }],
  ],
};

// J3: pronto, mas só entra em HISTORIAS quando o mapa do sítio existir (o mata-sítio). A cena começa onde o Jocelino está no sítio.
const JUCA_J3 = {
  quem: 'juca', titulo: 'A primeira mangueira', clima: 'Anda falando de plantar uma árvore que dê sombra pra criançada',
  gatilho: { mapa: 'sitio', hora: [6 * 60, 12 * 60], chuva: false, depois: 'juca_1', se: () => JucaArco.sitioAberto() },
  get elenco() { const L = JucaArco.lugarJ3(), j = [L.juca[0] - 2 * L.s, L.juca[1]]; return { juca: [L.juca[0], L.juca[1], L.s > 0 ? 'esquerda' : 'direita'], jocelino: [j[0], j[1], L.s > 0 ? 'direita' : 'esquerda'] }; },
  musica: 'musica_dia_3',
  passos: [
    ['camera', 'juca'],
    ['fala', null, 'O Tio Juca chegou cedo ao sítio, com a enxada no ombro e uma muda de mangueira numa lata de óleo.'],
    ['vira', 'juca', 'jocelino'],
    ['fala', 'juca', '@alegre A primeira árvore do sítio quem planta sou eu, sobrinho. Já combinei comigo mesmo.'],
    ['fala', 'juca', '@alegre Mangueira demora pra dar manga. Eu espero sentado, que pé de velho não tem pressa.'],
    ['balao', 'juca', 'reticencias'],
    ['escolha', 'juca', '@pensativo Que nome a gente põe nela?', [
      { t: '"Mangueira da Ritinha"', valor: 'ritinha', resposta: ['@alegre Da Ritinha! Ela vai contar as mangas uma por uma e fazer a conta de quanto dá.'] },
      { t: '"Mangueira do Zezinho"', valor: 'zezinho', resposta: ['@alegre Do Zezinho! Esse vai subir nela antes de ela dar a primeira flor.'] },
      { t: '"Mangueira do Juca"', valor: 'juca', resposta: ['@surpreso Do Juca? Ora, rapaz...', '@alegre Então eu venho todo dia conferir se ela tá crescendo direito.'] }],
      { id: 'juca_mangueira' }],
    ['fala', null, 'O Juca cava a cova, planta a muda e aperta a terra com a mão. A Ritinha vai pintar a plaquinha com letra caprichada.'],
    ['balao', 'juca', 'coracao'],
    ['fim', { topico: { id: 'mangueira_juca', dias: 5 }, depois: () => JucaArco.plantou() }],
  ],
};
JucaArco.registrarJ3();

HISTORIAS.juca_4 = {
  quem: 'juca', titulo: 'A passagem para Aracaju', clima: 'Anda contando moedas numa lata de biscoito',
  // (rodada 1) logo depois do prédio entregue, qualquer manhã ou fim de tarde no quintal (a inauguração espera até 3 dias por ele)
  get gatilho() { return { mapa: 'quintal', hora: JucaArco.horaQuintal(), depois: 'juca_1', se: () => JucaArco._j4Pronto() }; },
  elenco: { juca: _QJ.juca, jocelino: _QJ.jocelino, zezinho: [14, 12, 'esquerda'], ritinha: _QJ.ritinha },
  musica: 'musica_dia_3',
  get passos() {
    const P = JUCA_ARCO.PASSAGEM, ops = [];
    if (JucaArco.podePagar()) ops.push({ t: `Pagar a passagem dele (Cr$ ${P})`, valor: 'onibus', marca: 'juca_vai_buscar', ir: 'onibus' });
    ops.push({ t: '"O Calixto leva o senhor no caminhão"', valor: 'calixto', marca: 'juca_vai_buscar', ir: 'calixto' });
    return [
      ['camera', 'juca'],
      ['fala', null, 'O Tio Juca está na varanda, com a viola no colo e uma lata de biscoito cheia de moedas do lado.'],
      ['anda', 'jocelino', _QJ.jocelinoVai[0], _QJ.jocelinoVai[1]],
      ['vira', 'juca', 'jocelino'],
      ['fala', 'juca', '@pensativo Sobrinho, quando vocês abrirem essa firma, quem vai buscar a sua mãe sou eu.',
        '@alegre Já tô juntando a passagem. E a viola vai junto, que dois dias de ônibus sem música não dá.'],
      ['escolha', 'juca', '@alegre A cunhada Zefa merece chegar com música, não merece?', ops, { id: 'juca_viagem' }],
      ['rotulo', 'onibus'],
      ['fala', 'juca', '@surpreso Pagar a minha passagem? Ora, rapaz...', '@alegre Então a lata de biscoito vira lata de cocada pra cunhada. Ida e volta de viola!'],
      ['ir', 'fim'],
      ['rotulo', 'calixto'],
      ['fala', 'juca', '@alegre O Calixto! Aquele caminhão chacoalha mais que forró, mas chega.', '@alegre Eu falo com ele quando ele passar pra jantar na pensão. Ele conhece cada buraco da estrada até Aracaju.'],
      ['rotulo', 'fim'],
      ['balao', 'juca', 'nota_musical'],
      ['fala', 'juca', '@alegre Quando a firma abrir, a Dona Zefa desce aqui de braço dado comigo. Pode escrever.'],
      ['fim', { topico: { id: 'juca_viagem', dias: 7 }, depois: () => JucaArco.passagem() }],
    ];
  },
};

// ---------- o estado do arco (no save) ----------
INICIADORES.push(s => {
  const v = s.jucaArco && typeof s.jucaArco === 'object' ? s.jucaArco : {};
  G.jucaArco = Object.assign({}, v);
  const m = v.mangueira;
  G.jucaArco.mangueira = m && typeof m === 'object' && JUCA_ARCO.MANGUEIRA[m.nome] && Number.isFinite(m.x) && Number.isFinite(m.y) ? Object.assign({}, m) : null;
  JucaArco._lugarJ3 = null;
});
COLETORES.push(s => { s.jucaArco = JSON.parse(JSON.stringify(G.jucaArco || {})); });
// J4: a manhã marca o dia em que o arco ficou pronto (a paciência conta daí).
MANHA.push(() => {
  G.jucaArco = G.jucaArco || {};
  if (JucaArco._j4Pronto() && !G.jucaArco.j4) G.jucaArco.j4 = G.dia;
});

// ---------- o mundo muda ----------
// A viola na varanda (ao montar o quintal e ao entrar nele) e a mangueira no sítio.
AO_MONTAR.push(b => { JucaArco.poeViola(b); JucaArco.poeMangueira(b); });
AO_ENTRAR_MAPA.push(id => { if (id === 'quintal' && G.mapa) JucaArco.poeViola(G.mapa); });
// Durante as cenas: a viola na varanda já no começo do J1 (o Juca afinando) e a muda na lata no J3, antes de plantar.
JucaArco.extras = m => {
  if (!m) return [];
  const r = [];
  if (m.id === 'quintal' && JucaArco._tocando('juca_1') && !m.objs.some(o => o.id === 'viola_juca')) {
    const V = QUINTAL.VIOLA; r.push({ y: V.y, desenha: ctx => desenhaPe(ctx, 'objetos/viola_juca', V.x, V.y, 1, V.escala) });
  }
  if (JucaArco._tocando('juca_3') && JucaArco._lugarJ3 && !(G.jucaArco || {}).mangueira) {
    const [x, y] = JucaArco._lugarJ3.muda, px = (x + 0.5) * TILE, py = (y + 1) * TILE;
    r.push({ y: py, desenha: ctx => desenhaPe(ctx, 'objetos/muda_arvore', px, py, 1, 0.8) });
  }
  return r;
};
if (typeof EXTRAS_MUNDO !== 'undefined') EXTRAS_MUNDO.push(m => JucaArco.extras(m));

// ---------- as falas (os tópicos da Vila e a fala de festa) ----------
{
  const T = (quem, topico, fala, se) => { if (typeof _T === 'function') _T(quem, topico, fala, se); else if (CONVERSAS[quem]) CONVERSAS[quem].linhas.push({ quando: Object.assign({ topico }, se ? { se } : {}), fala }); };
  // J1: a viola
  T('rosa', 'viola_juca', ['@alegre O Juca tirou a viola do armário! Quando eu era menina, em Aracaju, já ouvia falar do forró dele.']);
  T('zelia', 'viola_juca', ['Ouvi uma viola no quintal de vocês. Fazia anos que eu não ouvia forró de manhã cedo.']);
  T('ritinha', 'viola_juca', ['@alegre O Zezinho dançou forró com o Tio Juca e agora não para de rodar na sala!'], () => Conversas.respondeu('juca_tocou'));
  T('ritinha', 'viola_juca', ['@alegre O Tio Juca disse que a viola tem dez cordas. Eu contei: tem dez mesmo!'], () => !Conversas.respondeu('juca_tocou'));
  T('zezinho', 'viola_juca', ['@alegre Pai, quando eu crescer eu vou ser pedreiro E tocador de viola!']);
  // J2: a roça velha
  T('rosa', 'roca_velha', ['@alegre Não paro de pensar no sítio do Juca. Ovo da casa, queijo da casa... a pensão ia ficar outra.']);
  T('ritinha', 'roca_velha', ['@alegre O Tio Juca tem uma roça! Lá dá pra ter vaca? Eu quero uma vaca chamada Mimosa.']);
  T('zelia', 'roca_velha', ['O Juca me mostrou o papel da roça velha. Guardado num barbante desde antes de eu casar, menino!']);
  // J3: a mangueira com nome
  T('ritinha', 'mangueira_juca', ['@alegre Tem uma mangueira com o meu nome lá no sítio! Vou contar pra professora.'], () => Conversas.resposta('juca_mangueira') === 'ritinha');
  T('zezinho', 'mangueira_juca', ['@alegre A mangueira do Zezinho vai ser a mais alta do sítio! Mais alta que a casa!'], () => Conversas.resposta('juca_mangueira') === 'zezinho');
  T('rosa', 'mangueira_juca', ['@alegre Mangueira do Juca! Ele já foi lá três vezes hoje só pra ver se cresceu.'], () => Conversas.resposta('juca_mangueira') === 'juca');
  T('rosa', 'mangueira_juca', ['@alegre O Juca plantou a primeira árvore do sítio. Disse que quer comer manga com a criançada na sombra.'], () => Conversas.resposta('juca_mangueira') !== 'juca');
  // J4: a viagem
  T('rosa', 'juca_viagem', ['@alegre O Juca já separou a camisa de ir pra Aracaju. A sua mãe vai chegar de viola e tudo!']);
  T('zelia', 'juca_viagem', ['O Juca me disse que vai buscar a cunhada em Aracaju. Vou fazer um bolo pra receber a Dona Zefa.']);
  T('ritinha', 'juca_viagem', ['@alegre A vó Zefa vem pra festa! O Tio Juca prometeu tocar viola na estrada inteira.']);
  // A fala de festa nova (8.2: "nas festas da Vila, o Juca toca"): num dia de festa, depois do J1, ele vai de viola.
  if (CONVERSAS.juca) CONVERSAS.juca.linhas.push({ quando: { festa: true, se: () => Historias.viu('juca_1') }, fala: () => [JucaArco.cordaNova()
    ? '@alegre Dia de festa! A viola tá de corda nova, do Seu Tonico. Hoje ela canta até o último pé cansar de dançar.'
    : '@alegre Dia de festa! Já peguei a viola na varanda: a primeira é um forró de Aracaju, e a segunda também.'] });
}
