// Família Santos — historias/bira.js — o arco do Mestre Bira, "As casinhas do Bira" (T11 das conversas e histórias; spec
// docs/superpowers/specs/2026-10-15-conversas-historias-design.md, seção 8.3; o motor é o historias.js, seção 6).
// O Bira é do povo da Vila: as 4 cenas disparam por CORAÇÕES (2, 4, 6 e 8), como os eventos de coração do Stardew, e por um lugar e
// uma hora em que o Jocelino realmente passa (a obra, a Vila de tarde); no máximo 1 cena por dia (o motor cuida). Só temas leves (a
// seção 8): o mestre durão tem um capricho escondido. De cada casa que levanta, ele faz uma casinha de miniatura com a sobra de tijolo e
// de madeira; as casinhas viram a exposição "A Vila em miniatura" no Grêmio e, no fim, o presente do Bira para a firma do Jocelino.
//   B1 bira_2 "A casinha do Bira" (2♥): na obra, na folga (a lista do dia pronta, ou depois das 11h), dia de obra. → +XP de Alvenaria
//      (o truque do prumo ensina mais); depois, a casinha aparece às vezes ao lado do Bira no canteiro.
//   B2 bira_4 "As casinhas da praça" (4♥): domingo, na Vila (8h–17h, sem chuva); passados BIRA_ARCO.B2_PACIENCIA dias do arco pronto,
//      vale qualquer hora de folga da obra. → a casinha da Dona Zélia na casa da família; com "mostrar pra Vila inteira", a frase de
//      clima da aba Gente: "Anda medindo as paredes do Grêmio".
//   B3 bira_6 "A Vila em miniatura" (6♥): uma ala do Grêmio pronta e o bilhete do Bira (chega na manhã seguinte); qualquer tarde
//      (13h–17h) na Vila, sem chuva. → a exposição fica no Grêmio (gremio_tela.js: a vitrine entre o Grêmio e o Mercado, com a lista
//      das maquetes); o segredo de ofício "Ler planta" (habilidades.js: as tarefas da obra dão +10% de XP).
//   B4 bira_8 "O primeiro prédio do mestre" (8♥): o Edifício Maré entregue; de manhã (6h–12h), na Vila, sem chuva, na frente do prédio.
//      → a Colher do Mestre (ferramentas.js: assenta mais ligeiro e pesa menos na mão) e a maquete do prédio na casa; na inauguração
//      da firma, o Bira dá a maquete do escritório (firma.js), que vai para a exposição (com o B3) ou fica no escritório.
// A cena começa onde o Jocelino está (a obra, a Vila) e põe cada um no lugar dela, como o começo de um evento do Stardew. As falas são
// rascunho, revisadas com o dono (a seção 8). Nenhuma tela diz "história" nem "missão".

const BIRA_ARCO = {
  FOLGA_HORA: 11 * 60,   // B1: a folga do Bira na obra: a lista do dia pronta, ou depois das 11h (a hora do almoço)
  XP_PRUMO: 60, XP_CAPRICHO: 30,   // B1: a experiência de Alvenaria (o truque do prumo ensina mais)
  B2_PACIENCIA: 7,       // B2: o domingo é a preferência; 7 dias depois do arco pronto, vale qualquer hora de folga da obra
  CASINHA_DIAS: 3,       // B1: a casinha aparece ao lado do Bira 2 dias em cada 3
  // B2: a praça (ladrilhos da Vila; à esquerda da roda de samba, longe das peças do canteiro do Mercado), e as casinhas no chão (px)
  PRACA: { bira: [26, 18, 'direita'], ritinha: [25, 18, 'direita'], zezinho: [27, 17, 'baixo'], jocelino: [29, 18, 'esquerda'],
    casinhas: [[1288, 910, 0.6], [1316, 916, 0.55], [1342, 910, 0.5]] },
  // B3: a frente do Grêmio, em volta da vitrine (GREMIO_EXPOSICAO, gremio_tela.js)
  GREMIO: { bira: [39, 23, 'esquerda'], ritinha: [35, 25, 'cima'], zezinho: [40, 24, 'esquerda'], jocelino: [34, 24, 'direita'], camera: [36, 22] },
  // B4: a calçada do Edifício Maré (o lote 17,23 de LOTES_DAS_OBRAS)
  PREDIO: { bira: [20, 24, 'esquerda'], jocelino: [18, 24, 'direita'], camera: [19, 22] },
  // os enfeites na casa da família (o pé, em px do cômodo, e a escala da arte de 48): na casa do Tio Juca, a prateleira do rádio; na
  // casa nova, o baú verde do quarto das crianças. (rodada 1) Na do Tio Juca, o pé no tampo da bancada (o rádio fica no banquinho dele). O escritório (a sala da frente da casa do Tio Juca): a mesa, depois da firma.
  CASA: {
    casa_juca_dentro: { casinha: { x: 432, y: 78, escala: 0.55 }, predio: { x: 540, y: 78, escala: 0.42 }, escritorio: { x: 440, y: 296, escala: 0.55 } },
    casa_familia_dentro: { casinha: { x: 714, y: 324, escala: 0.5 }, predio: { x: 745, y: 324, escala: 0.4 } },
  },
};

const BiraArco = {
  _visto: id => typeof Historias !== 'undefined' && Historias.viu(id),
  _tocando: id => typeof Historias !== 'undefined' && Historias.tocando() === id,
  // ---------- os gatilhos ----------
  // A obra aberta hoje (dia de semana, sem chuva) e o Bira de folga: a lista pronta (ou paga, ou fechada), ou depois das 11h.
  folgaNaObra() {
    if (typeof Obra === 'undefined' || !G.obra || Obra.aberta(G.dia, 12 * 60)) return false;
    const l = typeof listaDeHoje === 'function' ? listaDeHoje() : null;
    return G.minutos >= BIRA_ARCO.FOLGA_HORA || !!(l && (l.paga || l.fechado || Obra.completa()));
  },
  // O Bira sem serviço agora: domingo, chuva, fora do horário da obra, ou a lista de hoje paga.
  semServico() {
    if (typeof Obra === 'undefined' || !G.obra || Obra.aberta(G.dia, G.minutos)) return true;
    const l = typeof listaDeHoje === 'function' ? listaDeHoje() : null;
    return !!(l && (l.paga || l.fechado));
  },
  _b2Pronto() { return BiraArco._visto('bira_2') && !BiraArco._visto('bira_4') && typeof Amizade !== 'undefined' && Amizade.coracoes('bira') >= 4; },
  b2Paciente() { const d = (G.biraArco || {}).b2; return !!d && G.dia - d >= BIRA_ARCO.B2_PACIENCIA; },
  alaPronta() { return !!G.gremio && Object.keys(G.gremio.alas || {}).length > 0; },
  _b3Pronto() { return BiraArco._visto('bira_4') && !BiraArco._visto('bira_6') && BiraArco.alaPronta() && typeof Amizade !== 'undefined' && Amizade.coracoes('bira') >= 6; },
  conviteChegou() { const c = G.correio; return !!c && (c.caixa.includes('bira_gremio') || c.lidas.includes('bira_gremio')); },
  predioEntregue() { return typeof Firma !== 'undefined' && Firma.predioEntregue(); },

  // ---------- B1: onde fica cada um no canteiro da vez ----------
  // O Bira no lugar dele no canteiro (CANTEIROS.gente) e o Jocelino num ladrilho livre a 2 dele (de lado: os dois de frente).
  lugarB1() {
    const C = typeof canteiroDaVez === 'function' ? canteiroDaVez() : null, b = C ? C.gente.bira : [31, 6];
    const M = typeof MAPAS !== 'undefined' && MAPAS.vila, anda = (x, y) => !M || typeof andaNaVila !== 'function' || andaNaVila(M, x, y);
    let j = null;
    for (const [dx, dy] of [[-2, 0], [2, 0], [0, 2], [-2, 1], [2, 1], [0, -2], [-1, 1], [1, 1]]) if (anda(b[0] + dx, b[1] + dy)) { j = [b[0] + dx, b[1] + dy]; break; }
    j = j || [b[0], b[1] + 1];
    return { bira: [b[0], b[1], j[0] < b[0] ? 'esquerda' : j[0] > b[0] ? 'direita' : 'baixo'], jocelino: [j[0], j[1], j[0] < b[0] ? 'direita' : j[0] > b[0] ? 'esquerda' : 'cima'] };
  },
  // A casinha ao lado do Bira no canteiro: durante o B1 e, depois dele, 2 dias em cada 3 (só no canteiro, de dia).
  casinhaNaObra() {
    if (BiraArco._tocando('bira_2')) return true;
    return BiraArco._visto('bira_2') && G.dia % BIRA_ARCO.CASINHA_DIAS !== 0 && !BiraArco._tocando('bira_4') && !BiraArco._tocando('bira_6') && !BiraArco._tocando('bira_8');
  },
  // B1: o que a cena dá (a experiência de Alvenaria; o prumo ensina mais).
  xpB1() {
    const xp = Conversas.respondeu('bira_ensina') ? BIRA_ARCO.XP_PRUMO : BIRA_ARCO.XP_CAPRICHO;
    if (typeof Habilidades !== 'undefined') Habilidades.ganhar('alvenaria', xp);
    avisar(`+${xp} de experiência de Alvenaria (${Conversas.respondeu('bira_ensina') ? 'o prumo de linha do Mestre Bira' : 'a conversa com o Mestre Bira'}).`);
  },

  // ---------- B2 e B4: os enfeites na casa da família ----------
  temCasinha() { return BiraArco._visto('bira_4'); },
  temPredio() { return BiraArco._visto('bira_8'); },
  ganhouCasinha() { avisar('A casinha da Dona Zélia, do Mestre Bira, vai para a casa da família.'); BiraArco.poeNaCasa(MAPAS[casaDaFamilia()]); },
  // O que cada enfeite diz no clique.
  _frase: {
    casinha: () => 'A casinha da casa da Dona Zélia, do tamanho de uma mão: tijolinho de sobra, telhado de lasca de telha e a janela pintada de azul. Presente do Mestre Bira.',
    predio: () => 'A maquete do Edifício Maré, o primeiro prédio do Mestre Jocelino: as varandas, a caixa d\'água azul, as janelas pintadas uma por uma.' +
      (Conversas.respondeu('bira_assinou') ? ' Embaixo, a lápis: "Bira, mestre".' : ''),
    escritorio: () => 'A maquete do escritório da Construtora Santos: a casa do Tio Juca, com a plaquinha na porta. O Mestre Bira fez "pra você não esquecer de onde veio".',
  },
  // Os enfeites do Bira na casa onde a família mora (a casinha, a maquete do prédio) e, depois da firma, a maquete do escritório na
  // casa do Tio Juca (a sala da frente) quando a exposição do Grêmio não aconteceu.
  poeNaCasa(b) {
    if (!b || !BIRA_ARCO.CASA[b.id]) return;
    for (const o of b.objs.filter(o => o.doBira)) b.tirar(o);
    const L = BIRA_ARCO.CASA[b.id], mora = typeof casaDaFamilia === 'function' && b.id === casaDaFamilia();
    const quer = [];
    if (mora && BiraArco.temCasinha()) quer.push(['casinha', 'objetos/maquete_casinha']);
    if (mora && BiraArco.temPredio()) quer.push(['predio', 'objetos/maquete_predio']);
    if (L.escritorio && BiraArco.escritorioEm() === 'escritorio') quer.push(['escritorio', 'objetos/maquete_escritorio']);
    for (const [k, arte] of quer) {
      const P = L[k], o = b.interativo('bira_' + k, arte, 0, 0, 1, 1, null, false);
      Object.assign(o, { x: P.x, y: P.y, doBira: true });
      o.desenha = ctx => desenhaPe(ctx, arte, o.x, o.y, 1, P.escala);
      o.acao = () => { abrirPlaca(BiraArco._frase[k]()); return true; };
    }
  },

  // ---------- B3: a exposição ----------
  // A exposição está no Grêmio (a vitrine): depois do B3, e durante ele (o Bira arruma as casinhas).
  exposicao() { return BiraArco._visto('bira_6') || BiraArco._tocando('bira_6'); },
  // As casas que o Jocelino levantou (a cena e a lista da exposição LEEM o jogo): as obras do Bira entregues, a reforma da pensão, a casa
  // da família e as casas e comércios do Bairro Novo. [{ id, nome, arte }], na ordem em que ficaram prontas (mais ou menos).
  obras() {
    const r = [], casinha = 'objetos/maquete_casinha';
    if (G.obra && typeof OBRAS !== 'undefined') {
      const nomes = { casa_zelia: 'A casa da Dona Zélia', mercado: 'O Mercado Municipal', escola: 'A Escola da Vila', predio: 'O Edifício Maré' };
      OBRAS.forEach((o, k) => { if (k < G.obra.indice && (o.id !== 'predio' || BiraArco.predioEntregue())) r.push({ id: o.id, nome: nomes[o.id] || o.nome, arte: o.id === 'predio' ? 'objetos/maquete_predio' : casinha }); });
    }
    if (G.pensao && G.pensao.estado === 'aberta') r.push({ id: 'pensao', nome: 'A Pensão da Rosa', arte: casinha });
    if (typeof CasaFamilia !== 'undefined' && CasaFamilia.mudou()) r.push({ id: 'casa_familia', nome: 'A casa da Família Santos', arte: casinha });
    if (G.bairro && typeof Bairro !== 'undefined') {
      for (const t in G.bairro.terrenos || {}) if (G.bairro.terrenos[t].mudou) { const d = Bairro.donoDe(t); r.push({ id: 'bairro_' + t, nome: `A casa ${d ? 'de ' + d.nome : 'nova'}, no Bairro Novo`, arte: casinha }); }
      for (const t in G.bairro.comercios || {}) if (Bairro.comercioPronto(t) && typeof COMERCIOS !== 'undefined') r.push({ id: 'bairro_' + t, nome: `${COMERCIOS[t].nome}, no Bairro Novo`, arte: casinha });
    }
    return r;
  },
  // As maquetes da exposição, na ordem da vitrine: as casas, com a pensão onde o Jocelino escolheu (no meio ou na esquina); a maquete
  // do escritório da firma (depois da inauguração, com o B4) por último. [{ id, nome, arte, plaquinha }]
  maquetes() {
    const todas = BiraArco.obras(), pensao = todas.find(o => o.id === 'pensao'), resto = todas.filter(o => o.id !== 'pensao');
    const r = resto.slice();
    if (pensao) { if (BiraArco.lugarDaPensao() === 'esquina') r.push(pensao); else r.splice(Math.floor(r.length / 2), 0, pensao); }
    if (BiraArco.escritorioEm() === 'exposicao') r.push({ id: 'escritorio', nome: 'O escritório da Construtora Santos', arte: 'objetos/maquete_escritorio' });
    return r;
  },
  lugarDaPensao() { return Conversas.resposta('bira_pensao_lugar') || 'meio'; },
  // A frase da cena com as casas que o Jocelino levantou (a cena LÊ o jogo).
  frasesDasObras() {
    const n = BiraArco.obras().filter(o => o.id !== 'pensao').map(o => o.nome.charAt(0).toLowerCase() + o.nome.slice(1));
    if (!n.length) return 'Cada casa em que você pôs a mão nessa Vila.';
    const lista = n.length > 1 ? n.slice(0, -1).join(', ') + ' e ' + n[n.length - 1] : n[0];
    return `${lista.charAt(0).toUpperCase() + lista.slice(1)}. Tudo o que você levantou desde que chegou de Aracaju.`;
  },
  exposicaoAberta() {
    if (typeof Habilidades !== 'undefined' && Habilidades.aprender('ler_planta')) avisar(`Segredo de ofício: Ler planta. ${SEGREDOS_OFICIO.ler_planta.frase} (tela H)`);
    avisar('A exposição "A Vila em miniatura" fica no Grêmio, na vitrine do lado do Mercado.');
    if (typeof poeExposicao === 'function') poeExposicao(MAPAS.vila);
  },

  // ---------- B4: a Colher do Mestre e a maquete do prédio ----------
  colherEMaquete() {
    G.colherMestre = true;
    const naOficina = G.ferreiro && G.ferreiro.oficina && G.ferreiro.oficina.id === 'colher';
    if (!G.mochila.total('colher') && !naOficina) { const sobra = G.mochila.adicionar('colher', 1); if (sobra && G.jog) soltar('colher', sobra, G.jog.x, G.jog.y); }
    if (typeof hudSujo === 'function') hudSujo();
    avisar('A Colher do Mestre: assenta mais ligeiro e pesa menos na mão. Ela fica no lugar da sua colher de pedreiro.');
    avisar('A maquete do Edifício Maré vai para a casa da família.');
    BiraArco.poeNaCasa(MAPAS[casaDaFamilia()]);
  },
  // A maquete do escritório (a firma inaugurada, com o B4): na exposição do Grêmio (com o B3) ou no escritório; '' sem ela.
  escritorioEm() {
    if (!G.firma || !G.firma.feita || !BiraArco.temPredio()) return '';
    return BiraArco._visto('bira_6') ? 'exposicao' : 'escritorio';
  },
};

// ---------- as cenas ----------
HISTORIAS.bira_2 = {
  quem: 'bira', coracoes: 2, titulo: 'A casinha do Bira', clima: 'Anda lixando uma coisa pequenininha na hora da folga',
  gatilho: { mapa: 'vila', lugar: 'obra', chuva: false, hora: [6 * 60, 17 * 60], se: () => BiraArco.folgaNaObra() },
  get elenco() { const L = BiraArco.lugarB1(); return { bira: L.bira, jocelino: L.jocelino }; },
  musica: 'musica_dia_2',
  passos: [
    ['camera', 'bira'],
    ['fala', null, 'Na folga da obra, o Mestre Bira está num canto do canteiro, lixando uma coisa pequenininha com um caco de tijolo.'],
    ['balao', 'bira', 'reticencias'],
    ['balao', 'bira', 'exclamacao'],
    ['vira', 'bira', 'jocelino'],
    ['fala', 'bira', '@surpreso Hã? Isso? Nada não.', '@surpreso Mão de pedreiro não descansa nem na folga.'],
    ['fala', null, 'Na mão dele, uma casinha do tamanho de uma mão: tijolinho de sobra, o telhado de lasca de telha, a janela pintada de azul.'],
    ['fala', 'bira', '@pensativo É a casa da Dona Zélia. De cada casa que eu levanto, faço uma pequenininha. Com a sobra, que tijolo bom não se joga fora.'],
    ['escolha', 'bira', '@pensativo Bobagem, né?', [
      { t: '"Me ensina?"', amizade: 20, marca: 'bira_ensina', ir: 'ensina' },
      { t: '"Que capricho, Mestre"', amizade: 10, marca: 'bira_capricho', ir: 'fim', resposta: ['@alegre Capricho é o que separa o pedreiro do empilhador de tijolo, rapaz.'] }]],
    ['rotulo', 'ensina'],
    ['fala', 'bira', '@alegre Ensinar? Então presta atenção.'],
    ['fala', null, 'O Bira amarra um fio de linha numa pedrinha e deixa o fio pendurado rente à parede da casinha.'],
    ['fala', 'bira', '@pensativo O prumo é isso: o fio não mente. Se a parede encosta no fio de cima a baixo, tá em pé. Na grande ou na pequena.'],
    ['balao', 'jocelino', 'exclamacao'],
    ['fala', 'bira', '@alegre Agora você não esquece mais.'],
    ['rotulo', 'fim'],
    ['fala', 'bira', '@alegre E não espalha, que mestre de obras tem fama de durão a zelar.'],
    ['fim', { depois: () => BiraArco.xpB1() }],
  ],
};

HISTORIAS.bira_4 = {
  quem: 'bira', coracoes: 4, titulo: 'As casinhas da praça', clima: 'Anda com um caixote de casinhas debaixo do braço',
  // o domingo é a preferência; passados BIRA_ARCO.B2_PACIENCIA dias do arco pronto, qualquer hora em que o Bira está sem serviço
  get gatilho() {
    const g = { mapa: 'vila', hora: [8 * 60, 17 * 60], chuva: false, depois: 'bira_2' };
    return BiraArco.b2Paciente() ? Object.assign(g, { se: () => BiraArco.semServico() }) : Object.assign(g, { semana: 'domingo' });
  },
  elenco: { bira: BIRA_ARCO.PRACA.bira, zezinho: BIRA_ARCO.PRACA.zezinho, ritinha: BIRA_ARCO.PRACA.ritinha, jocelino: BIRA_ARCO.PRACA.jocelino },
  musica: 'musica_dia_3',
  passos: [
    ['camera', 'bira'],
    ['fala', null, 'Na praça, o Mestre Bira, de camisa de passeio, tira casinhas de um caixote e dá para a criançada.'],
    ['balao', 'zezinho', 'exclamacao'],
    ['fala', 'zezinho', '@alegre Pai! O Mestre Bira tá dando casinha! A minha tem até chaminé!'],
    ['vira', 'bira', 'jocelino'],
    ['fala', 'bira', '@alegre Domingo é dia de esvaziar o caixote, rapaz. Cada casa que eu levanto, faço uma pequenininha. Já são trinta e duas.'],
    ['fala', 'bira', '@pensativo A casa fica pronta, o dono se muda, e a pequenininha fica comigo. Aí eu dou pra quem gosta.'],
    ['escolha', 'bira', '@alegre E você, vai querer uma?', [
      { t: 'Pedir a casinha da casa da Dona Zélia', amizade: 20, marca: 'bira_casinha_zelia', ir: 'zelia',
        resposta: ['@alegre A da Zélia! A primeira obra em que você pegou no pesado. Toma, essa é sua.'] },
      { t: '"O senhor devia mostrar pra Vila inteira"', amizade: 30, marca: 'bira_mostrar_vila', ir: 'mostrar' }]],
    ['rotulo', 'mostrar'],
    ['fala', 'bira', '@surpreso Mostrar? Pra Vila inteira?'],
    ['balao', 'bira', 'reticencias'],
    ['fala', 'bira', '@pensativo ...Será?', '@alegre Bom, essa aqui é sua, pra começar: a casa da Dona Zélia.'],
    ['ir', 'fim'],
    ['rotulo', 'zelia'],
    ['balao', 'ritinha', 'coracao'],
    ['rotulo', 'fim'],
    ['fala', 'ritinha', '@alegre A gente põe em casa, pai! No lugar mais bonito.'],
    ['fim', { depois: () => BiraArco.ganhouCasinha() }],
  ],
};

HISTORIAS.bira_6 = {
  quem: 'bira', coracoes: 6, titulo: 'A Vila em miniatura',
  // (8.3) com "mostrar pra Vila inteira" no B2, a frase de clima é a do Grêmio
  get clima() { return typeof Conversas !== 'undefined' && Conversas.respondeu('bira_mostrar_vila') ? 'Anda medindo as paredes do Grêmio' : 'Anda contando as casas que levantou na Vila'; },
  gatilho: { mapa: 'vila', hora: [13 * 60, 17 * 60], chuva: false, depois: 'bira_4', se: () => BiraArco.alaPronta() && BiraArco.conviteChegou() },
  elenco: { bira: BIRA_ARCO.GREMIO.bira, ritinha: BIRA_ARCO.GREMIO.ritinha, zezinho: BIRA_ARCO.GREMIO.zezinho, jocelino: BIRA_ARCO.GREMIO.jocelino },
  musica: 'musica_dia_2', falaNoAlto: true,   // (a vitrine fica na beira de baixo do mapa: a fala vai para cima)
  passos: [
    ['camera', BIRA_ARCO.GREMIO.camera[0], BIRA_ARCO.GREMIO.camera[1]],
    ['fala', null, 'Do lado do Grêmio, uma vitrine nova, de vidro. O Mestre Bira arruma casinha por casinha lá dentro, com a ponta dos dedos.'],
    ['vira', 'bira', 'jocelino'],
    ['fala', 'bira', '@alegre Chegou na hora, rapaz! Olha aí: a Vila em miniatura.'],
    ['fala', 'bira', () => ['@alegre ' + BiraArco.frasesDasObras()]],
    ['fala', 'ritinha', '@alegre Eu escrevi as plaquinhas! Com letra de mão, igual a da professora.'],
    ['fala', 'zezinho', '@alegre E eu pintei os telhados!'],
    ['vira', 'ritinha', 'zezinho'],
    ['fala', 'ritinha', '@alegre ...e o nariz também, né, Zezinho?'],
    ['balao', 'zezinho', 'gota_suor'],
    ['vira', 'bira', 'jocelino'],
    ['fala', 'bira', '@pensativo Só falta uma. Onde a gente põe a pensão da Rosa?'],
    ['escolha', 'bira', '@pensativo A pensão vai onde, rapaz?', [
      { t: '"No meio, que é o coração da Vila"', amizade: 30, valor: 'meio', resposta: ['@alegre No meio! Todo mundo passa por ela mesmo.'] },
      { t: '"Na esquina, igual de verdade"', amizade: 30, valor: 'esquina', resposta: ['@alegre Na esquina, do jeitinho que é. Mestre de obras gosta de maquete fiel.'] }],
      { id: 'bira_pensao_lugar' }],
    ['som', 'feito'],
    ['fala', 'bira', '@pensativo E já que você gosta de ver a obra inteira de uma vez... vou te ensinar a ler planta.',
      '@alegre Quem lê a planta sabe o que vem antes de chegar. Na obra, cada tarefa te ensina um pouco mais.'],
    ['fim', { topico: { id: 'exposicao_gremio', dias: 7 }, depois: () => BiraArco.exposicaoAberta() }],
  ],
};

HISTORIAS.bira_8 = {
  quem: 'bira', coracoes: 8, titulo: 'O primeiro prédio do mestre', clima: 'Anda com o lápis atrás da orelha, riscando alguma coisa em segredo',
  gatilho: { mapa: 'vila', hora: [6 * 60, 12 * 60], chuva: false, depois: 'bira_2', se: () => BiraArco.predioEntregue() },
  elenco: { bira: BIRA_ARCO.PREDIO.bira, jocelino: BIRA_ARCO.PREDIO.jocelino },
  musica: 'musica_dia_3', falaNoAlto: true,   // (a calçada do prédio fica na beira de baixo do mapa)
  passos: [
    ['camera', BIRA_ARCO.PREDIO.camera[0], BIRA_ARCO.PREDIO.camera[1]],
    ['fala', null, 'De manhã cedo, na frente do Edifício Maré pronto. O Mestre Bira espera com uma caixa debaixo do braço.'],
    ['vira', 'bira', 'jocelino'],
    ['fala', 'bira', '@alegre Quatro andares e a cobertura, rapaz. Prédio de mestre.'],
    ['fala', null, 'Da caixa, o Bira tira a maquete do Edifício Maré: as varandas, a caixa d\'água azul, as janelas pintadas uma por uma.'],
    ['fala', 'bira', '@alegre O primeiro prédio do Mestre Jocelino. Esse eu fiz com mais capricho que os outros.'],
    ['escolha', 'bira', '@pensativo E então?', [
      { t: 'Pedir que ele assine embaixo', amizade: 30, marca: 'bira_assinou', ir: 'assina' },
      { t: 'Bater palma', amizade: 30, marca: 'bira_palma', ir: 'palma' }]],
    ['rotulo', 'assina'],
    ['fala', 'bira', '@surpreso Assinar? Eu?'],
    ['fala', null, 'O Bira tira o lápis de trás da orelha, vira a maquete e escreve embaixo, devagar: "Bira, mestre".'],
    ['balao', 'bira', 'coracao'],
    ['ir', 'fim'],
    ['rotulo', 'palma'],
    ['som', 'noite_comemora_1', -14],
    ['balao', 'bira', 'gota_suor'],
    ['fala', 'bira', '@alegre Para com isso, rapaz, que eu fico sem graça.'],
    ['rotulo', 'fim'],
    ['fala', 'bira', '@alegre E toma isso aqui também: a minha colher de mestre. Assenta ligeiro e não pesa na mão. Mestre de obras tem que ter colher de mestre.'],
    ['fala', 'bira', '@pensativo E a próxima maquete... deixa que eu sei qual é.'],
    ['fim', { topico: { id: 'maquete_predio', dias: 5 }, depois: () => BiraArco.colherEMaquete() }],
  ],
};

// ---------- o estado do arco (no save) e o bilhete do Grêmio ----------
INICIADORES.push(s => { G.biraArco = Object.assign({}, s.biraArco || {}); });
COLETORES.push(s => { s.biraArco = Object.assign({}, G.biraArco || {}); });
CARTAS.bira_gremio = { de: 'Mestre Bira', dia: 1e9,
  texto: 'Jocelino: passa no Grêmio uma tarde dessas, que eu tenho uma coisa pra te mostrar. Traz a criançada. — Bira (escrito a lápis, no verso de uma lista da obra)' };
MANHA.push(() => {
  G.biraArco = G.biraArco || {};
  if (BiraArco._b2Pronto() && !G.biraArco.b2) G.biraArco.b2 = G.dia;
  if (BiraArco._b3Pronto() && !BiraArco.conviteChegou() && G.correio) G.correio.caixa.push('bira_gremio');
});

// ---------- o mundo muda ----------
// Os enfeites na casa da família (ao montar e ao entrar) e, de manhã, a exposição e os enfeites de novo (a firma, a mudança).
AO_MONTAR.push(b => BiraArco.poeNaCasa(b));
AO_ENTRAR_MAPA.push(id => { if (BIRA_ARCO.CASA[id] && G.mapa) BiraArco.poeNaCasa(G.mapa); });
MANHA.push(() => { if (typeof MAPAS === 'undefined') return; for (const id in BIRA_ARCO.CASA) if (MAPAS[id]) BiraArco.poeNaCasa(MAPAS[id]); });
// A casinha ao lado do Bira no canteiro (o B1 e os dias seguintes) e as casinhas da praça no B2: coisas da hora, na ordem do chão.
if (typeof EXTRAS_MUNDO !== 'undefined') EXTRAS_MUNDO.push(m => {
  if (!m || m.id !== 'vila') return [];
  const r = [];
  const bira = m.moradores.find(p => p.id === 'bira');
  if (bira && bira.visivel !== false && BiraArco.casinhaNaObra() && (typeof Conversas === 'undefined' || Conversas.lugar(bira) === 'obra')) {
    const lado = bira.dir === DIR.ESQUERDA ? -1 : 1;
    r.push({ y: bira.y + 1, desenha: ctx => desenhaPe(ctx, 'objetos/maquete_casinha', bira.x + lado * 32, bira.y - 2, 1, 0.6) });
  }
  if (BiraArco._tocando('bira_4')) for (const [x, y, e] of BIRA_ARCO.PRACA.casinhas) r.push({ y, desenha: ctx => desenhaPe(ctx, 'objetos/maquete_casinha', x, y, 1, e) });
  if (BiraArco._tocando('bira_8') && bira) r.push({ y: bira.y + 1, desenha: ctx => desenhaPe(ctx, 'objetos/maquete_predio', bira.x - 34, bira.y - 2, 1, 0.6) });
  return r;
});

// ---------- as falas (os tópicos da Vila) ----------
{
  const T = (quem, topico, fala, se) => { if (typeof _T === 'function') _T(quem, topico, fala, se); else if (CONVERSAS[quem]) CONVERSAS[quem].linhas.push({ quando: Object.assign({ topico }, se ? { se } : {}), fala }); };
  // B1: as casinhas do Bira (o tópico historia_bira_2, que o motor abre por 4 dias)
  T('ze', 'historia_bira_2', ['O Mestre te mostrou as casinhas dele, foi? Faz desde que eu era servente. Mas não conta pra ninguém que eu contei.']);
  // B2: a casinha da Zélia em casa
  T('zelia', 'historia_bira_4', ['O Bira me contou que a casinha da minha casa foi pra sua. Cuida bem dela, viu? Tem até a minha cortina pintada.'], () => Conversas.respondeu('bira_casinha_zelia'));
  T('zelia', 'historia_bira_4', ['Dizem que o Bira tá distribuindo casinha na praça. Aquele homem tem um coração de manteiga debaixo da casca.'], () => !Conversas.respondeu('bira_casinha_zelia'));
  T('zezinho', 'historia_bira_4', ['@alegre Pai, a minha casinha do Mestre Bira tem chaminé! A da Ritinha não tem.']);
  // B3: a exposição no Grêmio
  T('zelia', 'exposicao_gremio', ['Fui ver as casinhas no Grêmio! A minha tá lá, com a cortina pintada e tudo. Chorei, meu filho.']);
  T('lourival', 'exposicao_gremio', ['Vi a Vila em miniatura no Grêmio. Só faltou o meu barco, compadre. Fala pro Bira.']);
  T('juca', 'exposicao_gremio', ['@alegre A Vila inteirinha numa vitrine! E a placa da Ritinha com a letra caprichada. Essa menina vai longe.']);
  T('ritinha', 'exposicao_gremio', ['@alegre A professora levou a turma toda pra ver as plaquinhas que eu escrevi no Grêmio!']);
  T('rosa', 'exposicao_gremio', () => [Conversas.resposta('bira_pensao_lugar') === 'esquina'
    ? '@alegre A minha pensão na esquina da vitrine, igualzinha. O Bira caprichou até no letreiro.'
    : '@alegre A minha pensão bem no meio da vitrine! Coração da Vila, foi o que você disse? Seu bobo.']);
  // B4: a maquete do prédio
  T('rosa', 'maquete_predio', ['@amorosa A maquete do prédio tá em casa, e o Zezinho não tira o olho. Já disse que ninguém mexe sem lavar a mão.']);
  T('ze', 'maquete_predio', ['Ganhou a colher do Mestre? Ele nunca largou aquela colher nem pra mim, rapaz.']);
  T('juca', 'maquete_predio', ['@alegre O Bira te deu a maquete do prédio? Quando eu cheguei aqui, aquele terreno era só mato. Olha a gente agora.']);
}
