// Família Santos — historias/lourival.js — o arco do Seu Lourival, "A corrida de canoas de São Pedro" (T14 das conversas e
// histórias; spec docs/superpowers/specs/2026-10-15-conversas-historias-design.md, seção 8.6; o motor é o historias.js, seção 6).
// O Lourival é do povo da Vila: as 4 cenas disparam por CORAÇÕES (2, 4, 6 e 8), como os eventos de coração do Stardew, na praia, numa
// hora em que o Jocelino passa por lá (a pesca, a banca, o barco do alto-mar); no máximo 1 cena por dia (o motor cuida). Só temas leves
// (a seção 8): o sonho dele é ganhar, ao menos uma vez, a corrida de canoas da Festa de São Pedro dos Pescadores. Chegou três vezes em
// segundo, sempre atrás do Seu Bento de Mongaguá, o rival e velho amigo (o retrato e a folha de andar `cliente_caicara`, com o nome
// trocado nesta cena e na clientela). O arco: ler o mar, a canoa e a corrida, que acaba em empate.
//   L1 lourival_2 "Ler o mar" (2♥): de manhã cedo (6h–9h; o dia começa às 6h) na praia, sem chuva (passados LOURIVAL_ARCO.L1_PACIENCIA
//      dias do arco pronto, qualquer hora de dia, sem chuva). Ele puxa a rede no raso. "Ajudar a puxar a rede" (+20, 3 sardinhas) ou
//      "Só olhar e aprender" (+10). → o segredo de ofício "Ler o mar" (SEGREDOS_OFICIO.ler_mar, habilidades.js): o rádio da manhã diz
//      se o mar está liso ou picado e onde está o peixe; no lugar certo, o peixe melhor morde mais (ECO.niveis.lerMar, pesca.js).
//   L2 lourival_4 "A flâmula de segundo lugar" (4♥): no domingo, de tardinha (16h–19h), na praia; a cena é na ponta do píer (passados
//      LOURIVAL_ARCO.L2_PACIENCIA dias, qualquer tarde). A flâmula desbotada: 61, 64, 68. "Esse ano a gente ganha!" (+30) ou "Segundo
//      lugar também é bonito" (+20). → o convite para remar (a marca lourival_convite_remar) e o tópico corrida_sao_pedro.
//   L3 lourival_6 "A Esperança na pedra" (6♥): de manhã (6h–12h) na praia, com chuva (passados LOURIVAL_ARCO.L3_PACIENCIA dias, qualquer
//      manhã). A canoa Esperança abriu a costura numa pedra. "Consertar a canoa" (+50; com 10 madeiras e 1 tinta na mochila, na hora;
//      sem, a canoa fica na areia como lugar de entrega, SEM PRAZO) ou "Puxar para a areia e combinar o conserto" (+10; também dá para
//      consertar depois). → a canoa consertada (objetos/canoa_esperanca, pintura nova) fica na areia; o alto-mar fica mais barato
//      (ECO.pesca.esperanca.oleo, mapa_alto_mar.js) e com mais chance do peixe graúdo, ★★★ (ECO.pesca.esperanca.raro, pesca.js).
//   L4 lourival_8 "A corrida de São Pedro" (8♥; a canoa consertada): a Festa de São Pedro é no Inverno 9 (FESTAS_DO_DIA 'sao_pedro': a
//      praia enfeitada, o barco do santo na areia). A carta-convite do Lourival chega na véspera. Para ninguém esperar quase um ano
//      (a regra das revisões): se o arco fica pronto com São Pedro a mais de LOURIVAL_ARCO.PERTO dias (ou se o dia da festa passa sem a
//      corrida), o Seu Bento manda o DESAFIO: "esperar São Pedro é muito tempo pra dois velhos" — a carta chega na 1ª manhã, e a corrida
//      vale da tarde seguinte em diante, sem prazo ("O desafio do Seu Bento"). De tarde (14h–18h) na praia. O Jocelino rema na proa;
//      "Remar no ritmo do samba do Zé" ou "Remar contando como o Lourival" (+30 cada; muda a torcida); as duas canoas cruzam juntas:
//      EMPATE. → a receita com nome "Azul-Marinho do Lourival" (o caminho 'amizade', receitas.js; a banana verde vem do pomar do
//      sítio, e enquanto o pomar não existe o Lourival diz "quando tiver banana verde, faz": o risco 7), a TAÇA DIVIDIDA de enfeite
//      no balcão do salão da pensão, e o Seu Bento janta na pensão uma vez por estação (a 2ª sexta, CLIENTELA_ARCOS).
// A cena começa onde o Jocelino está (a praia) e põe cada um no lugar dela, como o começo de um evento do Stardew. As falas são
// rascunho, revisadas com o dono (a seção 8). Nenhuma tela diz "história" nem "missão".

const LOURIVAL_ARCO = {
  L1_PACIENCIA: 5,    // L1: a manhã cedo é a preferência; 5 dias depois do arco pronto, qualquer hora de dia (sem chuva)
  L2_PACIENCIA: 7,    // L2: o domingo de tardinha é a preferência; 7 dias depois, qualquer tarde
  L3_PACIENCIA: 5,    // L3: a manhã de chuva é a preferência; 5 dias depois, qualquer manhã
  SAO_PEDRO: [1, 9],  // L4: a Festa de São Pedro dos Pescadores: Inverno, dia 9 (spec 8.6); a carta-convite chega na véspera
  PERTO: 28,          // L4: com São Pedro a mais de 28 dias (ou passado sem a corrida), vem o desafio do Seu Bento
  MATERIAL: { madeira: 10, tinta: 1 },   // L3: o conserto da canoa
  BENTO: 'cliente_caicara',              // a folha de andar e o retrato do Seu Bento de Mongaguá (T8: reaproveita o caiçara)
  // L1: a beira da água, à esquerda do barco (o mar começa na linha 16)
  REDE: { lourival: [6, 15, 'baixo'], jocelino: [9, 13, 'esquerda'], jocelinoVai: [8, 15], jocelinoPuxa: [7, 15] },
  // L2: a ponta do píer (as tábuas nas colunas 30–31, até a linha 22)
  PIER: { lourival: [31, 21, 'baixo'], jocelino: [30, 16, 'baixo'], jocelinoVai: [30, 20], camera: [30, 19] },
  // L3: a canoa na areia (4 ladrilhos, de 19 a 22, na linha 15; a arte sobe até a linha 14); o Lourival à esquerda, o Jocelino chega por cima
  CANOA: { x: 19, y: 15, w: 4 },
  AREIA: { lourival: [18, 14, 'direita'], jocelino: [24, 11, 'baixo'], jocelinoVai: [21, 13], camera: [21, 13] },
  // L4: a turma na areia, a largada e a chegada (as raias nas linhas 18 e 20; a chegada antes do píer)
  FESTA: { lourival: [23, 13, 'esquerda'], bento: [25, 13, 'esquerda'], jocelino: [21, 13, 'direita'], zezinho: [19, 12, 'baixo'],
    ze: [17, 12, 'baixo'], camera: [21, 12] },
  RAIA: { esperanca: 18, bento: 20, de: 3, ate: 26, ms: 7000 },
  // a praia enfeitada no dia de São Pedro: o barco do santo e os varais de bandeirinhas
  ENFEITES: [['objetos/barco_enfeitado', 15, 8], ['objetos/varal_bandeirinhas', 20, 10], ['objetos/varal_bandeirinhas', 26, 10]],
  // a taça dividida no balcão do salão (a 1ª banqueta, do lado de fora: o caderno da Rosa fica na outra ponta)
  TACA: { dx: -62, base: 786, escala: 1.25 },
};

const LourivalArco = {
  _visto: id => typeof Historias !== 'undefined' && Historias.viu(id),
  _tocando: id => typeof Historias !== 'undefined' && Historias.tocando() === id,
  _cor: () => typeof Amizade !== 'undefined' ? Amizade.coracoes('lourival') : 0,
  _arco: () => G.lourivalArco || (G.lourivalArco = {}),
  diasDesde(id) { return LourivalArco._visto(id) ? G.dia - Historias.vistaEm(id) : -1; },
  // A paciência de cada cena: o dia em que o arco ficou pronto (marcado de manhã, G.lourivalArco no save) e se já passou a espera.
  paciente(k, dias) { const d = LourivalArco._arco()[k]; return !!d && G.dia - d >= dias; },
  _l1Pronto() { return !LourivalArco._visto('lourival_2') && LourivalArco._cor() >= 2; },
  _l2Pronto() { return LourivalArco._visto('lourival_2') && !LourivalArco._visto('lourival_4') && LourivalArco._cor() >= 4; },
  _l3Pronto() { return LourivalArco._visto('lourival_4') && !LourivalArco._visto('lourival_6') && LourivalArco._cor() >= 6; },
  // L4: o arco pronto para a corrida (o L3, a canoa consertada e os 8♥)
  prontoL4() { return LourivalArco._visto('lourival_6') && !LourivalArco._visto('lourival_8') && LourivalArco._cor() >= 8 && LourivalArco.consertada(); },

  // ---------- ler o mar (L1) ----------
  // O mar do dia: 'liso' ou 'picado' (com chuva, sempre picado; nos outros dias, metade de cada, fixo pelo dia).
  mar(dia = G.dia) { if (typeof Clima !== 'undefined' && Clima.chove(dia)) return 'picado'; return mulberry(dia * 7331 + 17)() < 0.5 ? 'liso' : 'picado'; },
  sabeLerMar() { return typeof Habilidades !== 'undefined' && Habilidades.sabe('ler_mar'); },
  // O lugar certo de hoje: o raso (longe da ponta do píer) com o mar liso; o fundo (a ponta do píer) com o mar picado.
  lugarCerto(fundo, dia = G.dia) { return LourivalArco.mar(dia) === 'liso' ? !fundo : !!fundo; },
  // A linha do rádio da manhã (radio.js), só para quem sabe ler o mar.
  radio(dia = G.dia) {
    if (!LourivalArco.sabeLerMar()) return '';
    return LourivalArco.mar(dia) === 'liso'
      ? '\n\nE o mar de hoje, do jeito que o Seu Lourival ensinou: mar liso. Peixe no raso: pesque da areia, longe da ponta do píer.'
      : '\n\nE o mar de hoje, do jeito que o Seu Lourival ensinou: mar picado. Peixe no fundo: pesque da ponta do píer.';
  },
  aprendeuMar() {
    if (typeof Habilidades !== 'undefined' && Habilidades.aprender('ler_mar')) avisar(`Segredo de ofício: Ler o mar. ${SEGREDOS_OFICIO.ler_mar.frase} (tela H)`, 6000);
  },

  // ---------- a canoa Esperança (L3) ----------
  _canoa() { return LourivalArco._arco().canoa || 0; },   // o dia do conserto (0 = ainda rachada)
  consertada() { return !!LourivalArco._canoa(); },
  // Onde está a canoa: '' (antes do L3, e durante a corrida, que ela está no mar), 'rachada' ou 'nova'.
  canoaEm() {
    if (LourivalArco._tocando('lourival_8')) return '';
    if (!LourivalArco._visto('lourival_6') && !LourivalArco._tocando('lourival_6')) return '';
    return LourivalArco.consertada() ? 'nova' : 'rachada';
  },
  temMaterial() { const M = LOURIVAL_ARCO.MATERIAL; return !!G.mochila && Object.keys(M).every(id => G.mochila.total(id) >= M[id]); },
  // O conserto: gasta o material, a canoa ganha pintura nova. Devolve true se consertou agora.
  consertar() {
    if (LourivalArco.consertada()) return false;
    if (!LourivalArco.temMaterial()) return false;
    const M = LOURIVAL_ARCO.MATERIAL; for (const id in M) G.mochila.remover(id, M[id]);
    LourivalArco._arco().canoa = G.dia;
    if (typeof hudSujo === 'function') hudSujo();
    return true;
  },
  _avisoConserto() {
    avisar('A Esperança está de pintura nova! O alto-mar com o Lourival agora custa a metade do óleo, e o peixe graúdo aparece mais.', 6000);
  },
  // O clique na canoa da areia (lugar de entrega, sem prazo).
  cliqueCanoa() {
    if (LourivalArco.consertada()) { abrirPlaca('A canoa Esperança, de pintura nova: azul, branca e vermelha. O Seu Lourival passa a mão no casco toda vez que passa.'); return true; }
    const M = LOURIVAL_ARCO.MATERIAL, tem = id => G.mochila.total(id);
    if (!LourivalArco.temMaterial()) {
      abrirPlaca(`A canoa Esperança, com a costura aberta. Para consertar: ${M.madeira} madeiras e ${M.tinta} lata de tinta (o Depósito do Seu Ananias vende a tinta). Na mochila: ${tem('madeira')} madeiras e ${tem('tinta')} de tinta.`);
      return true;
    }
    perguntar(`Consertar a Esperança? (${M.madeira} madeiras e ${M.tinta} lata de tinta)`, ['Consertar', 'Agora não'], i => {
      if (i !== 0 || !LourivalArco.consertar()) return;
      if (typeof sons !== 'undefined') sons.tocar('madeira', 1, 0.05, -4);
      LourivalArco._avisoConserto();
    });
    return true;
  },
  poeCanoa(b) {
    if (!b || b.id !== 'praia') return;
    const quer = LourivalArco.canoaEm(), ja = b.objs.find(o => o.id === 'canoa_esperanca'), arte = quer === 'nova' ? 'objetos/canoa_esperanca' : 'objetos/canoa_esperanca_rachada';
    if (!quer) { if (ja) b.tirar(ja); return; }
    if (ja && ja.nome === arte) return;
    if (ja) { ja.nome = arte; return; }
    const C = LOURIVAL_ARCO.CANOA, o = b.interativo('canoa_esperanca', arte, C.x, C.y, C.w, 1, [56, 10]);
    o.acao = () => LourivalArco.cliqueCanoa();
    return o;
  },

  // ---------- a Festa de São Pedro e o desafio (L4) ----------
  ehSaoPedro(dia = G.dia) { return typeof Conversas !== 'undefined' && Conversas.estacao(dia) === LOURIVAL_ARCO.SAO_PEDRO[0] && Conversas.noEstacao(dia) === LOURIVAL_ARCO.SAO_PEDRO[1]; },
  // Os dias até o próximo São Pedro (0 no dia da festa).
  diasAteSaoPedro(dia = G.dia) {
    const ano = typeof Conversas !== 'undefined' ? Conversas.DIAS_ANO : 112, s0 = LOURIVAL_ARCO.SAO_PEDRO[0] * 28 + LOURIVAL_ARCO.SAO_PEDRO[1];
    let s = Math.floor((dia - 1) / ano) * ano + s0; if (s < dia) s += ano;
    return s - dia;
  },
  _chegou: id => !!G.correio && (G.correio.caixa.includes(id) || G.correio.lidas.includes(id)),
  // O desafio do Seu Bento: a carta chegou num dia de antes (a corrida é "amanhã de tardinha" em diante, sem prazo).
  desafioDeOntem() { const d = LourivalArco._arco().desafio; return !!d && G.dia > d && LourivalArco._chegou('lourival_desafio'); },
  // A corrida pode ser hoje: no dia de São Pedro ou depois da carta do desafio (o resto do arco é do gatilho).
  corridaHoje() { return LourivalArco.consertada() && (LourivalArco.ehSaoPedro() || LourivalArco.desafioDeOntem()); },
  // A corrida que aconteceu (ou acontece) foi a de São Pedro? (o título da Lembrança e as falas)
  foiSaoPedro() { const d = Historias.vistaEm('lourival_8'); return d ? LourivalArco.ehSaoPedro(d) : LourivalArco.ehSaoPedro(); },
  // A praia enfeitada no dia de São Pedro (todo ano, com ou sem o arco).
  poeFesta(b) {
    if (!b || b.id !== 'praia') return;
    const quer = LourivalArco.ehSaoPedro(), tem = b.objs.some(o => o.saoPedro);
    if (quer === tem) return;
    if (!quer) { for (const o of b.objs.filter(o => o.saoPedro)) b.tirar(o); return; }
    for (const [arte, x, y] of LOURIVAL_ARCO.ENFEITES) { const o = b.enfeite(arte, x, y, true, 30, 8); o.saoPedro = true; }
  },
  // O banana verde do azul-marinho vem do pomar do sítio (mata-sítio 3.5): enquanto ela não existe no jogo, o Lourival avisa.
  semBanana() { return typeof ITENS === 'undefined' || !ITENS.banana; },

  // ---------- a corrida (o passo ['pausa', ms, 'corrida'] do L4: o motor espera, e aqui as canoas andam) ----------
  _naCorrida() {
    const h = typeof Historias !== 'undefined' && Historias._h;
    if (!h || h.id !== 'lourival_8' || !h.espera || h.espera.tipo !== 'tempo') return -1;
    const p = (h.def.passos || [])[h.i - 1];
    if (!p || p[0] !== 'pausa' || p[2] !== 'corrida') return -1;
    return Math.max(0, Math.min(1, 1 - (h.espera.ate - performance.now()) / (+p[1] || 1)));
  },
  // A cada quadro da corrida: as duas canoas saem juntas, uma passa a outra e volta, e cruzam a chegada proa com proa.
  _anda(k) {
    const R = LOURIVAL_ARCO.RAIA, liso = t => t * t * (3 - 2 * t), onda = Math.sin(k * Math.PI * 3) * 0.035 * (1 - k * 0.2);
    const pos = (q, t, linha, dx = 0, dy = 0) => { const a = Historias._ator(q); if (!a) return;
      a.x = (R.de + (R.ate - R.de) * Math.max(0, Math.min(1, t)) + 0.5) * TILE + dx; a.y = linha * TILE + (a === G.jog ? 36 : 42) + dy + Math.sin(performance.now() / 260 + linha) * 1.5;
      a.andando = false; a.dir = DIR.DIREITA; };
    pos('lourival', liso(k) + onda, R.esperanca); pos(LOURIVAL_ARCO.BENTO, liso(k) - onda, R.bento);
  },
  // O Jocelino na proa da Esperança enquanto o Lourival está no mar (na largada, na corrida e na chegada): de pé dentro da canoa.
  _naProa() {
    const L = Historias._ator('lourival'); if (!L || !G.jog || L.y < PRAIA.MAR_Y * TILE) return;
    G.jog.x = L.x + 2 * TILE; G.jog.y = L.y + 8; G.jog.dir = L.dir; G.jog.andando = false;
  },
  // A canoa debaixo de quem está no mar: o Lourival na popa da Esperança; o Bento na dele (a arte `objetos/canoa_bento`, verde e
  // vermelha, com a fita vermelha; o mesmo quadro da Esperança). O nome "Seu Bento" fica sobre a canoa dele (mapas.js: p.nomeEm), e não
  // em cima da cabeça, que na raia de baixo cai em cima da Esperança.
  _canoaNoMar(q, outra) {
    const a = Historias._ator(q); if (!a || a.visivel === false || a.y < PRAIA.MAR_Y * TILE) return null;
    if (outra) a.nomeEm = () => a.y >= PRAIA.MAR_Y * TILE ? a.y + 14 : 0;
    const arte = outra ? 'objetos/canoa_bento' : 'objetos/canoa_esperanca';
    return { y: a.y - 3, desenha: ctx => desenhaPe(ctx, arte, a.x + TILE, a.y + 22) };
  },

  // ---------- o que muda depois ----------
  // L4: a taça no salão, o Seu Bento na clientela
  empate() {
    if (typeof Clientela !== 'undefined' && Clientela.arcos) Clientela.arcos();
    avisar('A taça dividida vai para o balcão do salão da pensão.', 6000);
    avisar('O Seu Bento de Mongaguá agora janta na pensão uma vez por estação.', 6000);
  },
  tacaNaPensao() { return LourivalArco._visto('lourival_8'); },
  // O Seu Bento janta na 2ª sexta de cada estação (o dia 12; a estação começa na segunda).
  bentoNaSemana(dia = G.dia) { const n = typeof Conversas !== 'undefined' ? Conversas.noEstacao(dia) : 0; return LourivalArco._visto('lourival_8') && n >= 8 && n <= 14; },
  // A escolha da remada (a torcida): 'samba' | 'conta' | ''.
  remada() { return Conversas.respondeu('lourival_remo_samba') ? 'samba' : Conversas.respondeu('lourival_remo_conta') ? 'conta' : ''; },
  // (para a festa final, T15: spec 9.2.3, "o Lourival e o Seu Bento trazem a taça dividida, se o L4 aconteceu") '' sem o L4.
  naFesta() { return LourivalArco._visto('lourival_8') ? 'O Seu Lourival e o Seu Bento chegam juntos, cada um segurando uma alça da taça dividida.' : ''; },
};

// O segredo de ofício do L1 (a tela H mostra "do Seu Lourival").
if (typeof SEGREDOS_OFICIO !== 'undefined') SEGREDOS_OFICIO.ler_mar = { nome: 'Ler o mar', de: 'Seu Lourival',
  get frase() { return `O rádio da manhã diz se o mar está liso (peixe no raso) ou picado (peixe no fundo, na ponta do píer). No lugar certo, o peixe melhor morde ${Math.round((ECO.niveis.lerMar - 1) * 100)}% mais.`; } };
// O peso do peixe (pesca.js, PESO_PESCA_EXTRA): o Ler o mar no lugar certo (a praia) e a Esperança consertada (o alto-mar).
if (typeof PESO_PESCA_EXTRA !== 'undefined') PESO_PESCA_EXTRA.push((p, c) => {
  if (c.local === 'mar' && p.peso < 6 && LourivalArco.sabeLerMar() && LourivalArco.lugarCerto(c.fundo, c.dia)) return ECO.niveis.lerMar;
  if (c.local === 'alto' && p.peso <= 4 && LourivalArco.consertada() && typeof Pratos !== 'undefined' && Pratos.raridade(p.id) >= 3) return ECO.pesca.esperanca.raro;
  return 1;
});
// A Festa de São Pedro (a regra 4 das conversas e a das cenas: nesse dia, só a cena da festa).
if (typeof FESTAS_DO_DIA !== 'undefined') FESTAS_DO_DIA.push(() => LourivalArco.ehSaoPedro() ? 'sao_pedro' : null);

// ---------- as cenas ----------
HISTORIAS.lourival_2 = {
  quem: 'lourival', coracoes: 2, titulo: 'Ler o mar', clima: 'Anda puxando a rede bem cedo, olhando o jeito do mar',
  // a manhã cedo é a preferência; passados LOURIVAL_ARCO.L1_PACIENCIA dias do arco pronto, qualquer hora de dia
  get gatilho() {
    const pac = LourivalArco.paciente('l1', LOURIVAL_ARCO.L1_PACIENCIA);
    return { mapa: 'praia', hora: [6 * 60, (pac ? 17 : 9) * 60], chuva: false };
  },
  elenco: { lourival: LOURIVAL_ARCO.REDE.lourival, jocelino: LOURIVAL_ARCO.REDE.jocelino },
  musica: 'musica_dia_4',
  passos: [
    ['camera', 'lourival'],
    ['fala', null, () => [G.minutos < 9 * 60 ? 'De manhãzinha, com o sol ainda baixo, o Seu Lourival puxa a rede no raso, com a água pelo joelho.'
      : 'Na beira da praia, o Seu Lourival puxa a rede do raso, devagar, sem pressa.']],
    ['anda', 'jocelino', LOURIVAL_ARCO.REDE.jocelinoVai[0], LOURIVAL_ARCO.REDE.jocelinoVai[1]],
    ['vira', 'lourival', 'jocelino'],
    ['balao', 'lourival', 'exclamacao'],
    ['fala', 'lourival', '@alegre Chegou na hora, compadre! Olha só o mar hoje.'],
    ['vira', 'lourival', 'baixo'],
    ['vira', 'jocelino', 'baixo'],
    ['fala', 'lourival', '@pensativo Mar liso de manhã, peixe no raso. Mar picado, peixe no fundo.', '@normal Isso não tem em livro. É olhar todo dia, que o mar conta.'],
    ['vira', 'lourival', 'jocelino'],
    ['escolha', 'lourival', '@alegre Vai ficar aí parado?', [
      { t: 'Ajudar a puxar a rede', amizade: 20, marca: 'lourival_puxou_rede', ir: 'rede' },
      { t: 'Só olhar e aprender', amizade: 10, marca: 'lourival_so_olhou', ir: 'olhar' }]],
    ['rotulo', 'rede'],
    ['anda', 'jocelino', LOURIVAL_ARCO.REDE.jocelinoPuxa[0], LOURIVAL_ARCO.REDE.jocelinoPuxa[1]],
    ['vira', 'jocelino', 'baixo'],
    ['som', 'agua', -4],
    ['fala', null, 'Os dois puxam juntos. A rede vem pesada e, na areia, pulam umas sardinhas prateadas.'],
    ['vira', 'lourival', 'jocelino'],
    ['fala', 'lourival', '@alegre Mão boa de rede, compadre! Três sardinhas são tuas: pra isca ou pra panela da Rosa.', '@normal Amanhã tu olha o mar primeiro e me diz onde tá o peixe.'],
    ['fim', { item: { sardinha: 3 }, topico: { id: 'ler_mar', dias: 5 }, depois: () => LourivalArco.aprendeuMar() }],
    ['rotulo', 'olhar'],
    ['fala', null, 'O Jocelino fica olhando. O Seu Lourival puxa sozinho, de costas para o sol, e aponta a cor da água com o queixo.'],
    ['fala', 'lourival', '@alegre Água clarinha e parada assim, o peixe tá no raso. Amanhã tu olha o mar primeiro e me diz onde tá o peixe.'],
    ['fim', { topico: { id: 'ler_mar', dias: 5 }, depois: () => LourivalArco.aprendeuMar() }],
  ],
};

HISTORIAS.lourival_4 = {
  quem: 'lourival', coracoes: 4, titulo: 'A flâmula de segundo lugar', clima: 'Anda falando da corrida de canoas de São Pedro',
  // o domingo de tardinha é a preferência (a pensão fecha); passados LOURIVAL_ARCO.L2_PACIENCIA dias do arco pronto, qualquer tarde
  get gatilho() {
    const g = { mapa: 'praia', depois: 'lourival_2' };
    return LourivalArco.paciente('l2', LOURIVAL_ARCO.L2_PACIENCIA) ? Object.assign(g, { hora: [14 * 60, 19 * 60] }) : Object.assign(g, { hora: [16 * 60, 19 * 60], semana: 'domingo' });
  },
  elenco: { lourival: LOURIVAL_ARCO.PIER.lourival, jocelino: LOURIVAL_ARCO.PIER.jocelino },
  falaNoAlto: true,   // (a ponta do píer fica na beira de baixo do mapa: a fala embaixo tapava os dois)
  musica: 'musica_dia_3',
  passos: [
    ['camera', LOURIVAL_ARCO.PIER.camera[0], LOURIVAL_ARCO.PIER.camera[1]],
    ['fala', null, () => [Conversas.semana() === 6 ? 'Fim de tarde de domingo. Na ponta do píer, o Seu Lourival segura uma flâmula velha, desbotada de sol.'
      : 'Fim de tarde. Na ponta do píer, o Seu Lourival segura uma flâmula velha, desbotada de sol.']],
    ['anda', 'jocelino', LOURIVAL_ARCO.PIER.jocelinoVai[0], LOURIVAL_ARCO.PIER.jocelinoVai[1]],
    ['vira', 'lourival', 'jocelino'],
    ['fala', 'lourival', '@pensativo Olha isso, compadre. A corrida de canoas da Festa de São Pedro.'],
    ['fala', null, 'Na flâmula, bordado em linha azul: "2º lugar". E, embaixo, três anos costurados à mão.'],
    ['fala', 'lourival', '@pensativo Sessenta e um, sessenta e quatro, sessenta e oito. Sempre atrás do Bento de Mongaguá.',
      '@alegre Gente boa, o Bento. Meu compadre de pescaria. Mas na corrida eu queria passar ele uma vez, só uma.'],
    ['fala', 'lourival', '@alegre Esse ano eu quero um proeiro forte. Tu rema?'],
    ['escolha', 'lourival', '@pensativo E então, compadre?', [
      { t: '"Esse ano a gente ganha!"', amizade: 30, marca: 'lourival_vai_ganhar', resposta: ['@alegre Isso! Assim que eu gosto. Proeiro com fé vale por dois.'] },
      { t: '"Segundo lugar também é bonito"', amizade: 20, marca: 'lourival_segundo_bonito', resposta: ['@bravo Bonito é o primeiro!', '@alegre ...Tô brincando, compadre. Mas tu rema comigo assim mesmo.'] }]],
    ['fala', 'lourival', '@alegre Tá combinado, então: na Festa de São Pedro, tu vai na proa da Esperança.'],
    ['balao', 'lourival', 'coracao'],
    ['fim', { topico: { id: 'corrida_sao_pedro', dias: 5 }, marca: 'lourival_convite_remar' }],
  ],
};

HISTORIAS.lourival_6 = {
  quem: 'lourival', coracoes: 6, titulo: 'A Esperança na pedra', clima: 'Anda olhando o céu, preocupado com a canoa velha',
  // a manhã de chuva é a preferência; passados LOURIVAL_ARCO.L3_PACIENCIA dias do arco pronto, qualquer manhã
  get gatilho() {
    const g = { mapa: 'praia', hora: [6 * 60, 12 * 60], depois: 'lourival_4' };
    return LourivalArco.paciente('l3', LOURIVAL_ARCO.L3_PACIENCIA) ? g : Object.assign(g, { chuva: true });
  },
  elenco: { lourival: LOURIVAL_ARCO.AREIA.lourival, jocelino: LOURIVAL_ARCO.AREIA.jocelino },
  falaNoAlto: true,   // (a canoa fica na beira da água, embaixo: a fala embaixo tapava a canoa)
  musica: 'musica_dia_2',
  passos: [
    ['camera', LOURIVAL_ARCO.AREIA.camera[0], LOURIVAL_ARCO.AREIA.camera[1]],
    ['fala', null, () => [Conversas.chove() ? 'Manhã de chuva fina. Na beira da praia, a canoa Esperança está de lado na areia, com a costura aberta.'
      : 'De manhã, na beira da praia, a canoa Esperança está de lado na areia, com a costura aberta.']],
    ['anda', 'jocelino', LOURIVAL_ARCO.AREIA.jocelinoVai[0], LOURIVAL_ARCO.AREIA.jocelinoVai[1]],
    ['vira', 'jocelino', 'baixo'],
    ['vira', 'lourival', 'jocelino'],
    ['fala', 'lourival', () => ['@triste Bateu numa pedra ontem, na volta do mar. Abriu a costura de ponta a ponta.',
      LourivalArco.diasAteSaoPedro() <= 35 ? '@triste Logo agora, compadre, a um mês da corrida.' : '@triste Logo agora, compadre, que eu já tava treinando pra corrida.']],
    ['fala', 'lourival', '@pensativo Madeira boa e uma lata de tinta resolvem. Mas mão de carpinteiro, isso eu não tenho.'],
    ['escolha', 'lourival', '@pensativo Tu entende de obra, né?', [
      { t: 'Consertar a canoa (10 madeiras e 1 tinta)', amizade: 50, marca: 'lourival_conserta', ir: 'conserta' },
      { t: 'Puxar para a areia e combinar o conserto', amizade: 10, marca: 'lourival_combinou', ir: 'combina' }]],
    ['rotulo', 'conserta'],
    // com o material na mochila, o conserto é na hora (o `se` também faz o conserto: o passo que muda o mundo no meio da cena)
    ['se', () => { LourivalArco._agora = !LourivalArco.consertada() && !Historias._h.revendo && LourivalArco.consertar(); return LourivalArco.consertada(); }, 'agora'],
    ['fala', 'lourival', '@alegre Então tá prometido! A Esperança fica aqui na areia, esperando a tua mão.'],
    ['fala', null, 'Para consertar a canoa: 10 madeiras e 1 lata de tinta (o Depósito do Seu Ananias vende a tinta). É só trazer e clicar nela. Sem pressa: ela espera.'],
    ['ir', 'fim'],
    ['rotulo', 'agora'],
    // (rodada 2) a cena de novo com a canoa já consertada (o save do meio): sem tirar o material outra vez da mochila
    ['se', () => !LourivalArco._agora && !Historias._h.revendo, 'pronta'],
    ['fala', null, 'O Jocelino tira da mochila a madeira e a tinta. Serrote, prego de cobre e pincel: a manhã inteira de serviço.'],
    ['som', 'madeira', -4],
    ['escurece', 120],
    ['clareia'],
    ['rotulo', 'pronta'],
    ['balao', 'lourival', 'exclamacao'],
    ['fala', 'lourival', '@surpreso Olha a Esperança, compadre! De pintura nova, azul, branca e vermelha!', '@alegre Ficou mais bonita que no dia em que ela chegou da Ilha Comprida.'],
    ['ir', 'fim'],
    ['rotulo', 'combina'],
    ['fala', 'lourival', '@normal Tá certo. A gente puxa ela pra areia e ela espera. Canoa velha tem paciência.'],
    ['fala', null, 'Para consertar a canoa: 10 madeiras e 1 lata de tinta (o Depósito do Seu Ananias vende a tinta). É só trazer e clicar nela. Sem pressa: ela espera.'],
    ['rotulo', 'fim'],
    ['fala', 'lourival', () => [LourivalArco.consertada() ? '@alegre Te devo essa, compadre. Pro alto-mar, daqui pra frente, metade do óleo é por minha conta.'
      : '@normal Enquanto ela descansa, a gente vai pro alto-mar no barco mesmo.']],
    ['fim', { topico: { id: 'canoa_esperanca', dias: 5 }, depois: () => { if (LourivalArco._agora) LourivalArco._avisoConserto(); LourivalArco._agora = false; } }],
  ],
};

HISTORIAS.lourival_8 = {
  quem: 'lourival', coracoes: 8, clima: 'Anda treinando a remada todo fim de tarde',
  // a Lembrança tem o nome do dia em que foi (São Pedro ou o desafio do Seu Bento)
  get titulo() { return typeof Historias !== 'undefined' && Historias.viu('lourival_8') && !LourivalArco.foiSaoPedro() ? 'O desafio do Seu Bento' : 'A corrida de São Pedro'; },
  // no dia de São Pedro (a cena É da festa) ou da tarde seguinte à carta do desafio em diante (sem prazo); a canoa consertada
  get gatilho() {
    const g = { mapa: 'praia', hora: [14 * 60, 18 * 60], depois: 'lourival_6', se: () => LourivalArco.corridaHoje() };
    if (LourivalArco.ehSaoPedro()) g.festa = 'sao_pedro';
    return g;
  },
  elenco: { lourival: LOURIVAL_ARCO.FESTA.lourival, cliente_caicara: LOURIVAL_ARCO.FESTA.bento, jocelino: LOURIVAL_ARCO.FESTA.jocelino,
    zezinho: LOURIVAL_ARCO.FESTA.zezinho, ze: LOURIVAL_ARCO.FESTA.ze },
  nomes: { cliente_caicara: 'Seu Bento' },
  musica: 'musica_festa',
  passos: [
    ['camera', LOURIVAL_ARCO.FESTA.camera[0], LOURIVAL_ARCO.FESTA.camera[1]],
    ['som', 'festa_rojao', -6],
    ['fala', null, () => [LourivalArco.ehSaoPedro()
      ? 'Dia de São Pedro dos Pescadores. A procissão desceu a rua com o barco do santo enfeitado de fita, e a Colônia inteira veio para a areia.'
      : 'Tarde de desafio na praia. A notícia correu a Vila: o Seu Bento veio de Mongaguá na canoa dele, e a Colônia inteira desceu para a areia.']],
    ['vira', 'cliente_caicara', 'lourival'],
    ['fala', 'cliente_caicara', () => [LourivalArco.ehSaoPedro() ? '@alegre Lourival, velho de guerra! Canoa de pintura nova, é? Vai precisar de mais que tinta pra me passar.'
      : '@alegre Lourival, velho de guerra! Soube da canoa de pintura nova. Esperar São Pedro é muito tempo pra dois velhos: corrida hoje!']],
    ['vira', 'lourival', 'cliente_caicara'],
    ['fala', 'lourival', '@alegre Bento! Esse ano eu trouxe proeiro. Mão de pedreiro: rema que nem levanta parede.'],
    ['vira', 'cliente_caicara', 'jocelino'],
    ['fala', 'cliente_caicara', 'Prazer, moço. Vamos ver essa mão de pedreiro na água.'],
    ['vira', 'lourival', 'jocelino'],
    ['escolha', 'lourival', '@pensativo Proeiro, como é que a gente rema?', [
      { t: 'Remar no ritmo do samba do Zé', amizade: 30, marca: 'lourival_remo_samba', ir: 'samba' },
      { t: 'Remar contando como o Lourival', amizade: 30, marca: 'lourival_remo_conta', ir: 'conta' }]],
    ['rotulo', 'samba'],
    ['vira', 'ze', 'jocelino'],
    ['balao', 'ze', 'nota_musical'],
    ['fala', 'ze', '@alegre Deixa comigo! Pandeiro no compasso, que remo e samba é tudo a mesma coisa.'],
    ['ir', 'largada'],
    ['rotulo', 'conta'],
    ['fala', 'lourival', '@alegre Isso! Um, dois. Um, dois. Remo junto, que canoa não gosta de pressa desencontrada.'],
    ['rotulo', 'largada'],
    ['escurece'],
    ['aparece', 'lourival', LOURIVAL_ARCO.RAIA.de, LOURIVAL_ARCO.RAIA.esperanca, 'direita'],
    ['aparece', 'jocelino', LOURIVAL_ARCO.RAIA.de + 2, LOURIVAL_ARCO.RAIA.esperanca, 'direita'],
    ['aparece', 'cliente_caicara', LOURIVAL_ARCO.RAIA.de, LOURIVAL_ARCO.RAIA.bento, 'direita'],
    ['camera', 'lourival', 'junto'],
    ['clareia'],
    ['fala', null, 'Na linha da largada, as duas canoas lado a lado. O juiz da Colônia levanta o lenço branco...'],
    ['som', 'festa_rojao', -4],
    ['fala', 'zezinho', () => [LourivalArco.remada() === 'samba' ? '@alegre Rema, pai! No compasso do pandeiro do Zé!' : '@alegre Um, dois! Um, dois! A praia inteira tá contando, pai!']],
    ['pausa', LOURIVAL_ARCO.RAIA.ms, 'corrida'],
    ['aparece', 'lourival', LOURIVAL_ARCO.RAIA.ate, LOURIVAL_ARCO.RAIA.esperanca, 'direita'],
    ['aparece', 'jocelino', LOURIVAL_ARCO.RAIA.ate + 2, LOURIVAL_ARCO.RAIA.esperanca, 'direita'],
    ['aparece', 'cliente_caicara', LOURIVAL_ARCO.RAIA.ate, LOURIVAL_ARCO.RAIA.bento, 'direita'],
    ['balao', 'lourival', 'exclamacao', 'junto'],
    ['balao', 'cliente_caicara', 'exclamacao'],
    ['fala', null, 'As duas canoas cruzam a boia juntas, proa com proa. O juiz da Colônia coça a cabeça, olha de novo... e grita: empate!'],
    ['escurece'],
    ['aparece', 'lourival', LOURIVAL_ARCO.FESTA.lourival[0], LOURIVAL_ARCO.FESTA.lourival[1], 'esquerda'],
    ['aparece', 'cliente_caicara', LOURIVAL_ARCO.FESTA.bento[0], LOURIVAL_ARCO.FESTA.bento[1], 'esquerda'],
    ['aparece', 'jocelino', LOURIVAL_ARCO.FESTA.jocelino[0], LOURIVAL_ARCO.FESTA.jocelino[1], 'direita'],
    ['camera', LOURIVAL_ARCO.FESTA.camera[0], LOURIVAL_ARCO.FESTA.camera[1], 'junto'],
    ['clareia'],
    ['fala', 'zezinho', '@alegre Pai! Vocês empataram! Eu vi, eu vi!'],
    ['vira', 'cliente_caicara', 'lourival'],
    ['fala', 'cliente_caicara', '@alegre Tanta corrida na vida e nunca vi isso. Dividimos a taça, Lourival?'],
    ['fala', 'lourival', '@alegre Dividimos. E o azul-marinho é por minha conta.'],
    ['balao', 'lourival', 'coracao'],
    ['fala', null, 'A taça da Colônia vai de mão em mão. Numa alça, a fita azul da Esperança; na outra, a fita vermelha do Bento.'],
    ['vira', 'lourival', 'jocelino'],
    ['fala', 'lourival', () => ['@alegre Compadre, o azul-marinho é peixe cozido com banana verde, do jeito caiçara. A receita é tua: leva pra Rosa.',
      LourivalArco.semBanana() ? '@pensativo A banana verde vem do pé. Quando tiver banana verde, faz.' : '@alegre Banana verde do pomar de vocês, que a minha acabou.',
      '@alegre E a taça fica na pensão. Foi lá que tu ganhou braço pra remar.']],
    ['fim', { receita: 'azul_marinho_lourival', topico: { id: 'corrida_empate', dias: 7 }, depois: () => LourivalArco.empate() }],
  ],
};

// ---------- o estado do arco (no save) e as cartas do L4 ----------
INICIADORES.push(s => { G.lourivalArco = Object.assign({}, s.lourivalArco || {}); LourivalArco._agora = false; if (typeof Clientela !== 'undefined' && Clientela.arcos) Clientela.arcos(); });
COLETORES.push(s => { s.lourivalArco = Object.assign({}, G.lourivalArco || {}); });
CARTAS.lourival_sao_pedro = { de: 'Seu Lourival', dia: 1e9,
  texto: 'Compadre: amanhã é São Pedro! A procissão desce de manhã e a corrida de canoas é de tarde, na praia. A Esperança tá pronta e a proa é tua. — Lourival' };
CARTAS.lourival_desafio = { de: 'Seu Lourival', dia: 1e9,
  texto: 'Compadre: o Bento de Mongaguá soube da Esperança de pintura nova e mandou recado. Diz que esperar São Pedro é muito tempo pra dois velhos: quer corrida já, valendo a taça da Colônia. Passa na praia amanhã de tardinha. Tu rema na proa? — Lourival' };
MANHA.push(() => {
  const A = LourivalArco._arco();
  if (LourivalArco._l1Pronto() && !A.l1) A.l1 = G.dia;
  if (LourivalArco._l2Pronto() && !A.l2) A.l2 = G.dia;
  if (LourivalArco._l3Pronto() && !A.l3) A.l3 = G.dia;
  // L4: a carta-convite na véspera de São Pedro; com a festa longe (ou passada sem a corrida), o desafio do Seu Bento (uma vez cada)
  if (LourivalArco.prontoL4() && G.correio) {
    const d = LourivalArco.diasAteSaoPedro();
    if (d === 1 && !A.convite) { G.correio.caixa.push('lourival_sao_pedro'); A.convite = G.dia; }
    else if (d > LOURIVAL_ARCO.PERTO && !A.desafio) { G.correio.caixa.push('lourival_desafio'); A.desafio = G.dia; }
  }
  if (typeof Clientela !== 'undefined' && Clientela.arcos) Clientela.arcos();
});
// A lembrança do dia na Caderneta (Hoje): a corrida de tarde (São Pedro ou o desafio), antes da hora.
if (typeof CADERNETA !== 'undefined') CADERNETA.push(() => {
  if (!LourivalArco.prontoL4() || G.minutos >= 18 * 60) return [];
  if (LourivalArco.ehSaoPedro()) return [{ id: 'hoje_lourival_corrida', aba: 'hoje', texto: 'Festa de São Pedro na praia: a corrida de canoas é de tarde, e o Seu Lourival conta com você na proa' }];
  if (LourivalArco.desafioDeOntem()) return [{ id: 'hoje_lourival_corrida', aba: 'hoje', texto: 'O desafio do Seu Bento: a corrida de canoas é de tarde, na praia (a carta do Lourival)' }];
  return [];
});

// ---------- o mundo muda ----------
// O Seu Bento na 2ª sexta de cada estação (CLIENTELA_ARCOS, clientela.js), com o azul-marinho.
if (typeof CLIENTELA_ARCOS !== 'undefined') CLIENTELA_ARCOS.push(
  { id: 'bento_estacao', dia: 4, se: () => LourivalArco.bentoNaSemana(),
    entrada: { id: LOURIVAL_ARCO.BENTO, nome: 'Seu Bento de Mongaguá', prato: 'azul_marinho_lourival', fala: 'Vim de Mongaguá pro azul-marinho, Dona Rosa! Metade da taça é minha, metade da panela também.',
      elogio: 'Igualzinho ao do Lourival. Só não conta pra ele que eu disse!' } });
// A canoa na areia (do L3 em diante) e a praia enfeitada no dia de São Pedro: ao montar, ao entrar e a cada quadro na praia (a cena
// muda a canoa no meio: o conserto na hora; o desenho do mundo roda também com a cena tocando).
AO_MONTAR.push(b => { if (b.id === 'praia') { LourivalArco.poeCanoa(b); LourivalArco.poeFesta(b); } });
AO_ENTRAR_MAPA.push(id => { if (id === 'praia' && G.mapa) { LourivalArco.poeCanoa(G.mapa); LourivalArco.poeFesta(G.mapa); } });
if (typeof EXTRAS_MUNDO !== 'undefined') EXTRAS_MUNDO.push(m => {
  if (!m || m.id !== 'praia') return [];
  LourivalArco.poeCanoa(m);
  if (!LourivalArco._tocando('lourival_8')) return [];
  const k = LourivalArco._naCorrida(); if (k >= 0) LourivalArco._anda(k);
  LourivalArco._naProa();
  return [LourivalArco._canoaNoMar('lourival', false), LourivalArco._canoaNoMar(LOURIVAL_ARCO.BENTO, true)].filter(Boolean);
});
// A taça dividida no balcão do salão (do L4 em diante). O palco não roda no simulador.
AO_MONTAR.push(b => {
  if (b.id !== 'pensao_palco' || typeof PALCO === 'undefined') return;
  b.objs.push({ tipo: 'camada', id: 'taca_balcao', y: PALCO.TAMPO_Y + 81, desenha(ctx) {
    if (!LourivalArco.tacaNaPensao()) return;
    const T = LOURIVAL_ARCO.TACA, A = PALCO.ASSENTOS;
    desenhaPe(ctx, 'objetos/taca_dividida', A[0].x + T.dx, T.base, 1, T.escala);
  } });
});

// ---------- as falas (os tópicos da Vila e o Lourival depois de cada cena) ----------
{
  const T = (quem, topico, fala, se) => { if (typeof _T === 'function') _T(quem, topico, fala, se); else if (CONVERSAS[quem]) CONVERSAS[quem].linhas.push({ quando: Object.assign({ topico }, se ? { se } : {}), fala }); };
  // L1: ler o mar
  T('lourival', 'ler_mar', () => [`@alegre E o mar hoje, compadre? Eu digo: ${LourivalArco.mar() === 'liso' ? 'liso. Peixe no raso.' : 'picado. Peixe no fundo, lá da ponta do píer.'}`]);
  T('rosa', 'ler_mar', ['@alegre Você agora olha o mar antes do café, igual o Lourival. Daqui a pouco tá de chapéu de palha e rede no ombro, igual o Lourival.']);
  T('zezinho', 'ler_mar', ['@alegre Pai, o Seu Lourival disse que você puxou a rede! Me leva da próxima vez?'], () => Conversas.respondeu('lourival_puxou_rede'));
  // L2: a corrida de São Pedro
  T('lourival', 'corrida_sao_pedro', ['@alegre Proeiro da Esperança! Tô contando os dias pra São Pedro, compadre.']);
  T('ze', 'corrida_sao_pedro', ['@alegre O Seu Lourival vive falando da corrida de canoas. Diz que esse ano o Bento vai ver a popa dele, rapaz.']);
  T('zelia', 'corrida_sao_pedro', ['O Lourival me mostrou a flâmula de segundo lugar. Três vezes! Esse homem tem paciência de pescador.']);
  // L3: a canoa
  T('lourival', 'canoa_esperanca', () => [LourivalArco.consertada() ? '@alegre A Esperança tá de pintura nova, compadre. Até o Bento vai querer uma igual.'
    : '@pensativo A Esperança tá lá na areia, esperando. Madeira e tinta, compadre, quando der.']);
  T('bira', 'canoa_esperanca', () => [LourivalArco.consertada() ? 'Vi a canoa do Lourival. Costura bem feita, rapaz. Tem mão de carpinteiro aí também.'
    : 'Canoa aberta na costura? Madeira seca e prego de cobre, rapaz. O resto é paciência.']);
  T('ananias', 'canoa_esperanca', ['O Lourival passou no depósito perguntando de tinta azul e vermelha. Pra canoa, ele disse.']);
  // L4: o empate
  T('lourival', 'corrida_empate', ['@alegre Empate, compadre! Tantos anos atrás do Bento, e agora a taça mora na pensão. Melhor que ganhar.']);
  T('rosa', 'corrida_empate', () => [LourivalArco.semBanana() ? '@alegre O Lourival me ditou o azul-marinho. Peixe com banana verde! Só falta a banana, que vem do pé.'
    : '@alegre O Lourival me ditou o azul-marinho. Peixe com banana verde! E a taça ficou linda no balcão.']);
  T('zezinho', 'corrida_empate', () => [LourivalArco.remada() === 'samba' ? '@alegre Pai, o Zé tocou o pandeiro até a mão ficar vermelha! E vocês empataram!'
    : '@alegre Pai, a praia inteira contou "um, dois" junto! E vocês empataram!']);
  T('ze', 'corrida_empate', ['@alegre Que corrida, rapaz! Proa com proa. Até eu, que sou de terra firme, me molhei de emoção.']);
  T('juca', 'corrida_empate', ['@alegre Sobrinho remando na Festa de São Pedro! Em Aracaju ninguém ia acreditar!']);
  // a Festa de São Pedro (todo ano, a regra 4)
  if (CONVERSAS.lourival) CONVERSAS.lourival.linhas.push(
    { quando: { festa: 'sao_pedro' }, fala: () => [LourivalArco._visto('lourival_8') ? '@alegre Dia de São Pedro, compadre! A Esperança tá enfeitada, e a metade da taça também.'
      : '@alegre Dia de São Pedro, compadre! Procissão de manhã e corrida de canoas de tarde. Viva o santo dos pescadores!'] },
    // o Lourival depois (de vez em quando: 1 em cada 4 dias)
    { quando: { se: () => LourivalArco._visto('lourival_8') && G.dia % 4 === 1 }, fala: ['@alegre O Bento mandou recado de Mongaguá: ano que vem tem revanche. Tu rema?'] });
  if (CONVERSAS.ze) CONVERSAS.ze.linhas.push({ quando: { festa: 'sao_pedro' }, fala: ['@alegre Dia de São Pedro, rapaz! Procissão na praia e peixe frito na barraca. Hoje a massa descansa.'] });
}
