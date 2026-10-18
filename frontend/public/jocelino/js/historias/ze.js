// Família Santos — historias/ze.js — o arco do Zé, "O samba da masseira" (T13 das conversas e histórias; spec
// docs/superpowers/specs/2026-10-15-conversas-historias-design.md, seção 8.5; o motor é o historias.js, seção 6; o samba entra pela
// decisão 5 da seção 13: a cena de cinema e a música, da T8).
// O Zé é do povo da Vila: as 4 cenas disparam por CORAÇÕES (2, 4, 6 e 8), como os eventos de coração do Stardew, num lugar e numa
// hora em que o Jocelino realmente passa (a obra de manhã, a praça à noite depois da janta, o salão depois da janta de festa); no
// máximo 1 cena por dia (o motor cuida). Só temas leves (a seção 8): o sonho do Zé é cantar. Ele compõe samba enquanto bate massa e
// fica sem graça de cantar para os outros; no fim, canta na pensão, e a pensão ganha uma festa nova.
//   E1 ze_2 "O samba da masseira" (2♥): dia de obra, no canteiro, das 10h às 12h (passados ZE_ARCO.E1_PACIENCIA dias do arco pronto,
//      qualquer hora da obra), com o Zé na masseira e o Jocelino de mãos livres. → depois, a nota musical aparece às vezes em cima do
//      Zé na obra (só a arte; a conversa da obra, a massa e a diária seguem iguais).
//   E2 ze_4 "A roda de sexta" (4♥): sexta, das 19h às 22h30, na Vila, sem chuva (passados ZE_ARCO.E2_PACIENCIA dias, qualquer noite):
//      quem fez a janta passa pela praça na volta para casa. A cena é na roda de samba. → O ZÉ CANTA NA RODA TODA SEXTA (mapa_vila.js:
//      das 19h às 22h30 ele sai do canteiro e fica na roda, com a nota musical; a placa da roda diz).
//   E3 ze_6 "O nome do samba" (6♥): a pensão aberta (o Concurso da Rádio Maré existe), no canteiro, de dia, no meio da estação (dias
//      8 a 21; passados ZE_ARCO.E3_PACIENCIA dias, qualquer dia). A inscrição do calouro da Rádio Maré: o nome do samba fica em
//      G.respostas.ze_samba ('tijolo', 'aracaju' ou 'pensao') e volta nas falas, no E4, na Noite do Samba e no final (ZeArco.naFesta).
//   E4 ze_8 "O samba na pensão" (8♥): a noite de festa na pensão (a festa do tema da agenda, a festa encomendada por um morador ou a
//      festa do Patrimônio), no salão, depois da janta: o Zé sobe no banquinho (a cena de cinema do samba, com a música do samba) e
//      o salão inteiro bate na mesa. → A NOITE DO SAMBA DO ZÉ, uma festa nova da pensão (FESTAS, eventos.js): entra no rodízio das
//      festas do tema (a 1ª festa depois da cena é ela); na noite, a turma da roda vem junto (ECO.pensao.convidados.samba) e, às 19h,
//      o Zé sobe no banquinho: a cena de cinema do samba toca com a música do samba (a Noite do Samba é a dona dela).
// A cena começa onde o Jocelino está (o canteiro, a praça, o salão) e põe cada um no lugar dela, como o começo de um evento do Stardew.
// O Zé fala como sempre falou (falas.js, topicos.js, recados.js): "parceiro", "rapaz", "Lá laiá" e, às vezes, de si mesmo na 3ª pessoa
// ("o Zé aqui"). As falas são rascunho, revisadas com o dono (a seção 8). Nenhuma tela diz "história" nem "missão".

const ZE_ARCO = {
  E1_HORA: [10 * 60, 12 * 60],        // E1: a manhã de obra (a 8.5)
  E1_HORA_LARGA: [6 * 60, 17 * 60],   // E1: passados E1_PACIENCIA dias do arco pronto, qualquer hora de obra
  E1_PACIENCIA: 5,
  E2_HORA: [19 * 60, 22 * 60 + 30],   // E2: a roda de samba de sexta (a placa da roda: das 7 da noite às 10 e meia)
  E2_PACIENCIA: 7,                    // E2: 7 dias depois do arco pronto, qualquer noite (o ensaio da roda)
  E3_HORA: [7 * 60, 18 * 60],         // E3: de dia, no canteiro (a obra aberta ou não: o Zé fica lá)
  E3_MEIO: [8, 21],                   // E3: "no meio da estação" (os dias da estação)
  E3_PACIENCIA: 7,
  NOTA_MS: 1500, NOTA_CADA: 7000,     // a nota musical em cima do Zé (na obra, depois do E1; na roda, depois do E2): 1,5 s a cada 7 s
  NOTA_RODA_CADA: 3200,               // ... na roda ele canta de verdade: mais vezes
  SAMBA_HORA: 19 * 60,                // a Noite do Samba: às 7 da noite o Zé sobe no banquinho (a cena de cinema)
  SAMBA_MUSICA_MS: 86000,             // a música do samba (90 s, som/musica_samba_ze) toca depois da cena; depois volta a da pensão
  // E2: a praça, em volta da roda de samba (objetos/roda_samba em 30,19); a turma da roda: o Severino e o Cícero
  RODA: { ze: [29, 19, 'baixo'], severino: [28, 18, 'direita'], cicero: [31, 18, 'esquerda'], jocelino: [25, 19, 'direita'], jocelinoVai: [27, 19], camera: [29, 18] },
  // E4: o salão de lado (a linha do chão do palco, como a do caldo verde da Zélia); o Zé entra pela porta (o ladrilho 7)
  SALAO: { rosa: [30, 18, 'esquerda'], rosaVai: [24, 18], jocelino: [16, 18, 'direita'], zeEntra: [7, 18], zeVai: [20, 18], severino: [10, 18], cicero: [12, 18] },
  // a cena de cinema: o banquinho do Zé no salão (o pé, no quadro de 1920×1080) e o ponto do zoom lento (o mesmo da festa da firma)
  BANQUINHO: { x: 950, y: 995, h: 900, zoom: { x: 950, y: 700 } },
  // os nomes do samba (o E3: G.respostas.ze_samba)
  NOMES: { tijolo: 'Tijolo e Tempero', aracaju: 'Saudade de Aracaju', pensao: 'A Pensão da Rosa' },
  // a turma da roda que vem jantar na Noite do Samba (os da Pratos.CLIENTES; o Zé primeiro)
  TURMA: ['ze', 'severino', 'cicero', 'damiao', 'valdir'],
};

const ZeArco = {
  _visto: id => typeof Historias !== 'undefined' && Historias.viu(id),
  _tocando: id => typeof Historias !== 'undefined' && Historias.tocando() === id,
  _cor: () => typeof Amizade !== 'undefined' ? Amizade.coracoes('ze') : 0,
  _arco: () => G.zeArco || (G.zeArco = {}),
  // A paciência de cada cena: o dia em que o arco ficou pronto (marcado de manhã, G.zeArco no save) e se já passou a espera.
  paciente(k, dias) { const d = ZeArco._arco()[k]; return !!d && G.dia - d >= dias; },
  _e1Pronto() { return !ZeArco._visto('ze_2') && ZeArco._cor() >= 2; },
  _e2Pronto() { return ZeArco._visto('ze_2') && !ZeArco._visto('ze_4') && ZeArco._cor() >= 4; },
  _e3Pronto() { return ZeArco._visto('ze_4') && !ZeArco._visto('ze_6') && ZeArco._cor() >= 6 && ZeArco.concursoExiste(); },

  // ---------- os gatilhos ----------
  // O Zé da Vila (o morador do canteiro), visível: na turma do mestre ele pode ter faltado (equipe_obra.js: some do canteiro).
  zeDaVila() { const V = typeof MAPAS !== 'undefined' && MAPAS.vila; return V ? V.moradores.find(m => m.id === 'ze' && !m._daHistoria) || null : null; },
  zeNoCanteiro() { const z = ZeArco.zeDaVila(); return !!z && z.visivel !== false && !z._naRoda; },
  obraAbertaAgora() { return typeof Obra !== 'undefined' && !!G.obra && !Obra.aberta(G.dia, G.minutos); },
  // As mãos livres: com a massa (ou o tijolo) nos braços o Jocelino está no meio de um serviço da lista; a cena espera ele largar.
  maosLivres() { return !G.jog || !G.jog.carga || !G.jog.carga.id; },
  // E1: o Zé batendo massa (a obra aberta agora) e o Jocelino de mãos livres.
  naMasseira() { return ZeArco.obraAbertaAgora() && ZeArco.zeNoCanteiro() && ZeArco.maosLivres(); },
  // E3: o Concurso da Rádio Maré existe com a pensão aberta (concurso.js: a cada 14 dias, no domingo).
  concursoExiste() { return !!G.pensao && G.pensao.estado === 'aberta'; },
  meioDaEstacao() { const d = typeof Conversas !== 'undefined' ? Conversas.noEstacao() : 0; return d >= ZE_ARCO.E3_MEIO[0] && d <= ZE_ARCO.E3_MEIO[1]; },
  // E4: a janta de hoje foi uma noite de festa e já acabou (o Zé chega quando a turma da noite ainda está no salão).
  depoisDaFesta(p = G.pensao) {
    if (!p || G.turno || p.ultimaJanta !== G.dia) return false;
    return (!!p.festaDia && p.festaDia === G.dia) || (p.agenda || []).some(e => e.dia === G.dia && e.fim === 'feita' && (e.tipo === 'festa' || e.tipo === 'encomenda'));
  },
  sexta(d = G.dia) { return (d - 1) % 7 === 4; },

  // ---------- onde fica cada um no canteiro da vez (E1, E3) ----------
  // O Zé no lugar dele no canteiro (CANTEIROS.gente, ao lado da masseira) e o Jocelino num ladrilho livre a 2 dele.
  lugarNaObra() {
    const C = typeof canteiroDaVez === 'function' ? canteiroDaVez() : null, z = C ? C.gente.ze : [35, 4];
    const M = typeof MAPAS !== 'undefined' && MAPAS.vila, anda = (x, y) => !M || typeof andaNaVila !== 'function' || andaNaVila(M, x, y);
    let j = null;
    for (const [dx, dy] of [[-2, 0], [2, 0], [0, 2], [-2, 1], [2, 1], [0, -2], [-1, 1], [1, 1]]) if (anda(z[0] + dx, z[1] + dy)) { j = [z[0] + dx, z[1] + dy]; break; }
    j = j || [z[0], z[1] + 1];
    return { ze: [z[0], z[1], 'cima'], jocelino: [j[0], j[1], j[0] < z[0] ? 'direita' : j[0] > z[0] ? 'esquerda' : 'cima'] };
  },

  // ---------- o que muda no mundo ----------
  cantaNaObra() { return ZeArco._visto('ze_2'); },
  cantaNaRoda() { return ZeArco._visto('ze_4'); },
  // O nome do samba (o E3): 'Saudade de Aracaju'... ou '' antes dele.
  nome() { return ZE_ARCO.NOMES[typeof Conversas !== 'undefined' ? Conversas.resposta('ze_samba') : ''] || ''; },
  nomeDoSamba() { return ZeArco.nome() || 'o samba da masseira'; },
  // A Noite do Samba do Zé: entra nas festas da pensão depois do E4.
  noiteAberta() { return ZeArco._visto('ze_8'); },
  // A estreia: a 1ª festa do tema depois do E4 é a do samba (Eventos.planejar, festaDaVez); depois, o rodízio de sempre.
  // (rodada 1, M2) A estreia só conta quando a Noite do Samba sai de verdade (a janta dela abriu: naJanta grava G.zeArco.feita); se a
  // pensão não abriu naquela noite, a próxima festa do tema é o samba de novo. marcou guarda só a noite marcada (G.zeArco.marcada).
  estreiaPendente() { return ZeArco.noiteAberta() && !ZeArco._arco().feita; },
  marcou(noite) { ZeArco._arco().marcada = noite; },
  // (rodada 1, M1) O samba nunca cai em duas festas do tema seguidas: a noite que vem a menos de 10 dias da última Noite do Samba feita
  // passa a vez para a festa seguinte do rodízio (festaDaVez, eventos.js: o `evita` da festa).
  sambaRecente(noite) { const f = ZeArco._arco().feita; return !!f && noite > f && noite - f < 10; },
  abriuANoite() { avisar('A Noite do Samba do Zé entrou nas festas da pensão: numa das próximas, o Zé canta e a turma da roda vem junto.'); },
  // A festa de hoje é a Noite do Samba (a entrada da agenda), ou null.
  sambaHoje(p = G.pensao, dia = G.dia) { const f = typeof Eventos !== 'undefined' ? Eventos.hoje(p, dia, 'festa') : null; return f && f.samba ? f : null; },
  // (rodada 1, I3) A noite d é a da Noite do Samba (antes ou depois da janta): a roda da praça não acontece, a roda foi pra pensão.
  noiteDoSamba(dia = G.dia, p = G.pensao) { return !!p && (p.agenda || []).some(e => e.tipo === 'festa' && e.samba && e.dia === dia); },
  // Na janta da Noite do Samba (pensao_tela.js, iniciarJanta, depois dos moradores da semana): a turma da roda entra na fila e pede o
  // prato da festa: o Zé (se ainda não vem nesta noite; nunca em dobro) e os da roda que não vêm; faltando, outro freguês da Vila que
  // não vem (rodada 1, M9: nunca um desconhecido de fora; com todos já na fila, vêm menos). Devolve quantos entraram
  // (ECO.pensao.convidados.samba). A noite conta como a Noite do Samba feita (a estreia, o rodízio).
  naJanta(t, festa) {
    if (!t || !festa) return 0;
    t.samba = true;
    const n = (ECO.pensao.convidados && ECO.pensao.convidados.samba) || 0, ja = new Set(t._fila.map(f => f.cliente.id));
    ZeArco._arco().feita = G.dia;
    const quem = [...ZE_ARCO.TURMA.map(id => Pratos.CLIENTES.find(x => x.id === id)), ...Pratos.CLIENTES].filter(Boolean);
    let k = 0;
    for (const c of quem) {
      if (k >= n) break;
      if (ja.has(c.id)) continue;
      t._fila.push({ minuto: 17 * 60 + 50 + k * 25, cliente: Object.assign({}, c, { pedeTema: festa.prato, convidado: true, doSamba: true }) });
      ja.add(c.id); k++;
    }
    t._fila.sort((a, b) => a.minuto - b.minuto);
    return k;
  },
  // A cena de cinema do samba na Noite do Samba (às 19h, no salão, uma vez por noite) e a música do samba depois dela.
  _sambaAte: 0,
  sambaTocando() { return !!G.turno && !!G.turno.samba && performance.now() < ZeArco._sambaAte && typeof noSalaoDaPensao === 'function' && noSalaoDaPensao(); },
  cantaNaNoite(t = G.turno) {
    if (!t || !t.samba || t._sambaFoi) return false;
    t._sambaFoi = true;
    const A = ZeArco._arco(); A.noites = (A.noites || 0) + 1;
    ZeArco._sambaAte = performance.now() + ZE_ARCO.SAMBA_MUSICA_MS;
    if (typeof CenaPrato !== 'undefined') CenaPrato.tocarEspecial('samba_noite');
    return true;
  },
  // (rodada 1, M11) As legendas da Noite do Samba que mudam a cada noite (G.zeArco.noites: a 1ª, a 2ª, a 3ª... em rodízio). k: 0 a abertura,
  // 1 o fim.
  legendaDaNoite(k) {
    const L = [['O Zé sobe no banquinho, ajeita o chapéu de jornal e puxa o pandeiro.', 'A turma da roda: "Mais um, Zé!"'],
      ['O Zé, no banquinho: "Boa noite, Pensão da Rosa! Esse aqui é da masseira."', 'O Severino no surdo, o Cícero na lata, e o salão no coro.'],
      ['O Zé sobe no banquinho de olho fechado, que de olho aberto ainda dá vergonha.', 'O salão pede bis, e o Zé canta o refrão mais uma vez.']];
    return L[Math.max(0, (ZeArco._arco().noites || 1) - 1) % L.length][k];
  },
  // (para a festa final, T15: spec 9.2.3, "o Zé canta o samba, com o nome do E3") a frase da festa; '' sem o E3.
  naFesta() { const n = ZeArco.nome(); return n ? `O Zé, no banquinho, canta "${n}": "Esse samba é pra Família Santos!"` : ''; },
};

// ---------- as cenas ----------
HISTORIAS.ze_2 = {
  quem: 'ze', coracoes: 2, titulo: 'O samba da masseira', clima: 'Anda cantarolando baixinho na masseira',
  // a manhã de obra é a preferência; passados ZE_ARCO.E1_PACIENCIA dias do arco pronto, qualquer hora em que a obra está aberta
  get gatilho() {
    return { mapa: 'vila', lugar: 'obra', chuva: false, hora: ZeArco.paciente('e1', ZE_ARCO.E1_PACIENCIA) ? ZE_ARCO.E1_HORA_LARGA : ZE_ARCO.E1_HORA,
      se: () => ZeArco.naMasseira() };
  },
  get elenco() { const L = ZeArco.lugarNaObra(); return { ze: L.ze, jocelino: L.jocelino }; },
  musica: 'musica_dia_3',
  passos: [
    ['camera', 'ze'],
    ['fala', null, 'Na obra, o Zé bate a massa na masseira, no compasso da enxada. E cantarola baixinho, de olho fechado.'],
    ['balao', 'ze', 'nota_musical'],
    ['balao', 'ze', 'nota_musical'],
    ['vira', 'ze', 'jocelino'],
    ['balao', 'ze', 'gota_suor'],
    ['fala', 'ze', '@surpreso Ih, tava ouvindo? É só pra massa não empelotar.'],
    ['escolha', 'ze', '@pensativo Ficou feio, né?', [
      { t: '"Canta de novo"', amizade: 20, marca: 'ze_canta_de_novo', ir: 'canta' },
      { t: '"Volta pro serviço, Zé"', marca: 'ze_volta_servico', ir: 'servico' }]],
    ['rotulo', 'canta'],
    ['fala', 'ze', '@pensativo De novo? Bom... só um pedacinho, que a massa espera.'],
    ['balao', 'ze', 'nota_musical'],
    ['fala', 'ze', '@alegre "Tijolo por tijolo, a casa vai subir... massa no ponto, a Vila vai sorrir..."'],
    ['fala', 'ze', '@alegre Não tem nome nem final ainda. Samba de masseira sai assim, parceiro: um verso por carrinho de massa.'],
    ['ir', 'fim'],
    ['rotulo', 'servico'],
    ['fala', 'ze', '@alegre Hahaha! Tá certo, chefe. O Zé aqui canta pra massa, não pra plateia.'],
    ['rotulo', 'fim'],
    ['fala', 'ze', '@alegre Mas não espalha, hein? Peão que canta na obra vira assunto no almoço.'],
    ['fim', {}],
  ],
};

HISTORIAS.ze_4 = {
  quem: 'ze', coracoes: 4, titulo: 'A roda de sexta', clima: 'Anda batucando na marmita na hora do almoço',
  // a sexta seca é a preferência (a roda de samba da praça); passados ZE_ARCO.E2_PACIENCIA dias do arco pronto, qualquer noite (o
  // ensaio da roda). Quem faz a janta passa pela praça depois dela, na volta para casa.
  get gatilho() {
    const g = { mapa: 'vila', hora: ZE_ARCO.E2_HORA, depois: 'ze_2' };
    return ZeArco.paciente('e2', ZE_ARCO.E2_PACIENCIA) ? Object.assign(g, { chuva: false }) : Object.assign(g, { semana: 'Sex', chuva: false });   // (rodada 1, M8: a roda é ao ar livre)
  },
  elenco: { ze: ZE_ARCO.RODA.ze, severino: ZE_ARCO.RODA.severino, cicero: ZE_ARCO.RODA.cicero, jocelino: ZE_ARCO.RODA.jocelino },
  nomes: { severino: 'Severino', cicero: 'Cícero' },
  musica: 'pensao_animada_1',
  passos: [
    ['camera', ZE_ARCO.RODA.camera[0], ZE_ARCO.RODA.camera[1]],
    ['fala', null, () => [ZeArco.sexta()
      ? 'Sexta-feira, roda de samba na praça. O Severino puxa um samba antigo, o Cícero batuca numa lata, e o Zé fica no pandeiro, só tocando.'
      : 'Noite de ensaio na praça: a turma da roda passa o samba de sexta. O Severino puxa, o Cícero batuca numa lata, e o Zé fica no pandeiro, só tocando.']],
    ['balao', 'ze', 'nota_musical'],
    ['anda', 'jocelino', ZE_ARCO.RODA.jocelinoVai[0], ZE_ARCO.RODA.jocelinoVai[1]],
    ['vira', 'ze', 'jocelino'],
    ['vira', 'severino', 'ze'],
    ['fala', 'severino', '@alegre Ô Zé! Canta aquele seu, o da masseira! O Jocelino tá aí, ó.'],
    ['balao', 'ze', 'gota_suor'],
    ['fala', 'ze', '@pensativo Cantar? Na frente de todo mundo? Minha voz é de masseira, Jocelino.'],
    ['escolha', 'ze', '@pensativo Ah, não... ou canto?', [
      { t: 'Puxar o samba dele em voz alta', amizade: 30, marca: 'ze_puxou_samba', ir: 'puxa' },
      { t: 'Bater palma do lado', amizade: 10, marca: 'ze_palma_roda', ir: 'palma' }]],
    ['rotulo', 'puxa'],
    ['se', () => !Conversas.respondeu('ze_canta_de_novo'), 'melodia'],   // (rodada 1, M4: no E1 ele não ouviu a letra)
    ['fala', 'jocelino', '@alegre "Tijolo por tijolo, a casa vai subir..."'],
    ['balao', 'ze', 'exclamacao'],
    ['fala', 'ze', '@surpreso Ih! Ele sabe a letra!'],
    ['ir', 'solta'],
    ['rotulo', 'melodia'],
    ['fala', 'jocelino', '@alegre "Lá laiá, laiá..." Aquele da masseira, Zé!'],
    ['balao', 'ze', 'exclamacao'],
    ['fala', 'ze', '@surpreso Ih! Ele lembrou da masseira!'],
    ['rotulo', 'solta'],
    ['fala', null, 'O Zé entra baixinho, sem graça, olhando pro chão. No segundo verso, levanta a cabeça e solta a voz. A roda inteira para pra ouvir.'],
    ['balao', 'ze', 'nota_musical'],
    ['balao', 'ze', 'nota_musical'],
    ['fala', 'ze', '@alegre Lá laiá, laiá! Ô, parceiro, que vergonha boa!'],
    ['ir', 'fim'],
    ['rotulo', 'palma'],
    ['fala', null, 'O Jocelino bate palma no compasso, do lado do Zé. O pandeiro acompanha... e, quase sem querer, o Zé canta o refrão.'],
    ['balao', 'ze', 'nota_musical'],
    ['fala', 'ze', '@alegre Viu? Só o refrão. O resto ainda tá na masseira.'],
    ['rotulo', 'fim'],
    ['vira', 'cicero', 'ze'],
    ['fala', 'cicero', '@alegre Agora toda sexta tem o samba do Zé, hein!'],
    ['fala', 'ze', '@alegre Toda sexta, parceiro. Se a voz deixar.'],
    ['fim', { topico: { id: 'ze_roda', dias: 5 } }],
  ],
};

HISTORIAS.ze_6 = {
  quem: 'ze', coracoes: 6, titulo: 'O nome do samba', clima: 'Anda com um papel da Rádio Maré dobrado no bolso',
  // no meio da estação é a preferência (a inscrição do calouro); passados ZE_ARCO.E3_PACIENCIA dias do arco pronto, qualquer dia
  get gatilho() {
    const meio = ZeArco.paciente('e3', ZE_ARCO.E3_PACIENCIA);
    return { mapa: 'vila', lugar: 'obra', hora: ZE_ARCO.E3_HORA, depois: 'ze_4',
      se: () => ZeArco.concursoExiste() && ZeArco.zeNoCanteiro() && ZeArco.maosLivres() && (meio || ZeArco.meioDaEstacao()) };
  },
  get elenco() { const L = ZeArco.lugarNaObra(); return { ze: L.ze, jocelino: L.jocelino }; },
  musica: 'musica_dia_3',
  passos: [
    ['camera', 'ze'],
    ['fala', null, 'Num canto do canteiro, o Zé lê e relê um papel dobrado em quatro.'],
    ['vira', 'ze', 'jocelino'],
    ['balao', 'ze', 'exclamacao'],
    ['fala', 'ze', '@alegre Jocelino! Olha isso: a Rádio Maré abriu inscrição pro calouro. "Samba inédito, de compositor da Baixada."',
      '@alegre Compositor da Baixada sou eu, parceiro!'],
    ['fala', 'ze', '@pensativo Só que a ficha pede o nome do samba. E o meu nunca teve nome.'],
    ['escolha', 'ze', '@pensativo Samba precisa de nome. Me ajuda?', [
      { t: '"Tijolo e Tempero"', amizade: 20, valor: 'tijolo', resposta: ['@alegre Tijolo e Tempero! A obra e a pensão num samba só. Gostei, parceiro!'] },
      { t: '"Saudade de Aracaju"', amizade: 20, valor: 'aracaju', resposta: ['@pensativo Saudade de Aracaju... pra família que veio de lá e trouxe o tempero junto. Bonito, Jocelino.'] },
      { t: '"A Pensão da Rosa"', amizade: 20, valor: 'pensao', resposta: ['@alegre A Pensão da Rosa! A Dona Rosa vai ficar vermelha. Melhor ainda!'] }],
      { id: 'ze_samba' }],
    ['fala', 'ze', '@alegre Então tá batizado. Vou escrever na ficha com a letra mais bonita que eu tenho.'],
    ['fala', 'ze', '@pensativo E se a Rádio chamar... o Zé aqui vai ter que cantar no microfone. Ai, ai.'],
    ['fim', { topico: { id: 'ze_samba_nome', dias: 6 } }],
  ],
};

HISTORIAS.ze_8 = {
  quem: 'ze', coracoes: 8, titulo: 'O samba na pensão', clima: 'Anda ensaiando um samba de olho fechado',
  // a noite de festa na pensão (a agenda: a festa do tema, a festa encomendada, a festa do Patrimônio), no salão, depois da janta
  gatilho: { mapa: 'pensao_palco', depois: 'ze_6', se: () => ZeArco.depoisDaFesta() },
  elenco: { rosa: ZE_ARCO.SALAO.rosa, jocelino: ZE_ARCO.SALAO.jocelino },
  nomes: { severino: 'Severino', cicero: 'Cícero' },
  passos: [
    ['aparece', 'ze', ZE_ARCO.SALAO.zeEntra[0], ZE_ARCO.SALAO.zeEntra[1], 'direita'],
    ['som', 'porta', -8],
    ['fala', null, 'A janta da festa acabou, mas ninguém quer ir embora. A porta do salão abre: é o Zé, de pandeiro debaixo do braço, com a turma da roda atrás.'],
    ['anda', 'ze', ZE_ARCO.SALAO.zeVai[0], ZE_ARCO.SALAO.zeVai[1]],
    ['aparece', 'severino', ZE_ARCO.SALAO.severino[0], ZE_ARCO.SALAO.severino[1], 'direita'],
    ['aparece', 'cicero', ZE_ARCO.SALAO.cicero[0], ZE_ARCO.SALAO.cicero[1], 'direita'],
    ['anda', 'rosa', ZE_ARCO.SALAO.rosaVai[0], ZE_ARCO.SALAO.rosaVai[1]],
    ['vira', 'jocelino', 'ze'],
    ['vira', 'rosa', 'ze'],
    ['vira', 'ze', 'rosa'],
    ['fala', 'ze', () => [`@alegre Dona Rosa! Jocelino! O samba ficou pronto: "${ZeArco.nomeDoSamba()}". Posso?`]],
    ['fala', 'rosa', '@surpreso Aqui, Zé? Agora?', '@alegre Sobe no banquinho, que o salão é seu!'],
    ['balao', 'ze', 'gota_suor'],
    ['fala', 'ze', '@alegre Gente, esse samba é pra Dona Rosa e pro Jocelino!'],
    ['musica', 'musica_samba_ze'],
    ['cena', 'samba_ze'],
    ['balao', 'ze', 'nota_musical'],
    ['escolha', 'ze', '@alegre E aí, parceiro? Samba não se escuta sentado!', [
      { t: 'Acompanhar na palma', amizade: 30, marca: 'ze_samba_palma', ir: 'palma' },
      { t: 'Puxar a Rosa para dançar', amizade: 30, marca: 'ze_samba_danca', ir: 'danca' }]],
    ['rotulo', 'palma'],
    ['fala', null, 'O Jocelino puxa a palma, a turma da roda acompanha, e o salão inteiro bate na mesa até o último verso.'],
    ['balao', 'ze', 'nota_musical'],
    ['fala', 'severino', '@alegre Mais um, Zé! Mais um!'],
    ['ir', 'fim'],
    ['rotulo', 'danca'],
    ['cena', 'samba_danca'],
    ['balao', 'rosa', 'coracao'],
    ['fala', 'rosa', '@amorosa Ai, Jocelino, na frente da Vila inteira!', '@alegre ...Dança de novo?'],
    ['rotulo', 'fim'],
    ['vira', 'ze', 'jocelino'],
    ['fala', 'ze', '@alegre Valeu, parceiro! O Zé aqui nunca cantou pra tanta gente.',
      '@pensativo Sabe o que eu pensei? Se a Dona Rosa deixar, uma noite de festa nessa pensão podia ser do samba...'],
    ['vira', 'rosa', 'ze'],
    ['fala', 'rosa', '@alegre Deixar? Vou escrever no calendário: a Noite do Samba do Zé!'],
    ['fim', { topico: { id: 'samba_ze_pensao', dias: 7 }, depois: () => ZeArco.abriuANoite() }],
  ],
};

// ---------- a cena de cinema do samba (a arte da T8: cenas/samba_fundo, samba_ze, samba_notas e samba_reacao; a música, da T8) ----------
// A Noite do Samba do Zé é a dona dela; o E4 toca os pedaços dela (o Zé no banquinho; a dança). As camadas: o salão de noite cheio
// com o banquinho vazio; o Zé sobe no banquinho (a peça tem o banquinho dela) e balança no samba; as notas sobem; a reação (a Rosa e
// o Jocelino dançando, o salão batendo palma). A música do samba segue alta (abafa: false): no E4 é a trilha da cena; na Noite do
// Samba, o rodízio toca o samba (ZeArco.sambaTocando). O título da faixa de baixo é o nome do samba (o E3).
const _sambaZe = (d, t, ate) => {
  const B = ZE_ARCO.BANQUINHO, zoom = 1 + 0.05 * _eo(_cs(t, 0, ate)), z = y => B.zoom.y + (y - B.zoom.y) * zoom;
  d.fundo('cenas/samba_fundo', zoom, 1, B.zoom.x, B.zoom.y);
  const u = _eo(_cs(t, 0.2, 0.9));
  d.peca('cenas/samba_ze', B.x, z(B.y) + (1 - u) * 900, B.h * zoom, { ancora: 'base', rot: 0.03 * Math.sin(t * 5) * u });
  d.peca('cenas/samba_notas', 960, 470 - 70 * _cs(t, 1, ate), 820, { alfa: _cs(t, 1.0, 1.6) * (1 - _cs(t, ate - 0.7, ate)) });
};
const _tituloSamba = () => `"${ZeArco.nome() || 'Samba da masseira'}", o samba do Zé`;
Object.assign(CENAS_ESPECIAIS, {
  // E4 (7,4 s): o Zé no banquinho e o salão batendo na mesa.
  samba_ze: { dur: 7.4, legenda: [0.4, 7.1], abafa: false, titulo: _tituloSamba,
    falas: [[0.6, 3.6, 'O Zé sobe no banquinho, fecha os olhos e solta a voz.'], [3.7, 7.1, 'O salão inteiro bate na mesa no compasso do pandeiro!']],
    artes: ['cenas/samba_fundo', 'cenas/samba_ze', 'cenas/samba_notas'],
    sons: [[0.9, 'cena_tchan', 1, -10]],
    desenha(d, t) { _sambaZe(d, t, 7.4); } },
  // E4, a dança (6 s): o Jocelino e a Rosa dançando entre as mesas, o Zé no banquinho ao fundo.
  samba_danca: { dur: 6.0, legenda: [0.4, 5.8], abafa: false, titulo: _tituloSamba,
    falas: [[0.4, 3.0, 'O Jocelino puxa a Rosa pra dançar entre as mesas.'], [3.0, 5.8, 'A Vila inteira assobia, e o Zé canta mais alto!']],
    artes: ['cenas/samba_reacao'],
    sons: [[0.3, 'cena_tchan', 1, -10]],
    desenha(d, t) { d.fundo('cenas/samba_reacao', 1.08 - 0.08 * _eo(_cs(t, 0, 6.0)), 1, 960, 450); } },
  // A Noite do Samba do Zé (12 s): o Zé no banquinho com o nome do samba; o salão bate na mesa; a Rosa e o Jocelino dançam.
  samba_noite: { dur: 12.0, legenda: [0.4, 6.0], abafa: false, titulo: 'Noite do Samba do Zé',
    falas: () => [
      [0.6, 3.4, ZeArco.legendaDaNoite(0)],
      [3.5, 6.0, ZeArco.nome() ? `"${ZeArco.nome()}"! O salão inteiro bate na mesa.` : 'O salão inteiro bate na mesa no compasso do pandeiro!'],
      [6.4, 9.2, 'A Rosa sai da cozinha e puxa o Jocelino pra dançar.'],
      [9.2, 11.8, ZeArco.legendaDaNoite(1)],
    ],
    artes: ['cenas/samba_fundo', 'cenas/samba_ze', 'cenas/samba_notas', 'cenas/samba_reacao'],
    sons: [[0.9, 'cena_tchan', 1, -10], [6.3, 'cena_tchan', 1, -10]],
    desenha(d, t) {
      if (t < 6.4) _sambaZe(d, t, 6.4);
      if (t >= 6.1) d.fundo('cenas/samba_reacao', 1.08 - 0.08 * _eo(_cs(t, 6.1, 12)), _cs(t, 6.1, 6.4), 960, 450);
    } },
});

// ---------- o estado do arco (no save) e a paciência ----------
INICIADORES.push(s => { G.zeArco = Object.assign({}, s.zeArco || {}); ZeArco._sambaAte = 0; });
COLETORES.push(s => { s.zeArco = Object.assign({}, G.zeArco || {}); });
MANHA.push(() => {
  const A = ZeArco._arco();
  if (ZeArco._e1Pronto() && !A.e1) A.e1 = G.dia;
  if (ZeArco._e2Pronto() && !A.e2) A.e2 = G.dia;
  if (ZeArco._e3Pronto() && !A.e3) A.e3 = G.dia;
});

// ---------- o mundo muda ----------
// A nota musical em cima do Zé: na obra, depois do E1 (às vezes: 1,5 s a cada 7 s, na hora da obra); na roda de sexta, depois do E2
// (mais vezes). Só a arte (o balão do Personagem): não mexe na conversa, na massa nem na diária. Some quando o guia marca o Zé.
ATUALIZADORES.push(() => {
  if (G.mapaId !== 'vila' || !G.mapa) return;
  const z = G.mapa.moradores.find(m => m.id === 'ze' && !m._daHistoria); if (!z || z.visivel === false) return;
  const naRoda = !!z._naRoda && ZeArco.cantaNaRoda(), naObra = !naRoda && ZeArco.cantaNaObra() && ZeArco.obraAbertaAgora()
    && typeof Conversas !== 'undefined' && Conversas.lugar(z) === 'obra';
  if (!naRoda && !naObra) return;
  if (typeof guiaMarcaMorador === 'function' && guiaMarcaMorador('ze')) { z._balaoH = null; return; }
  const agora = performance.now(), b = z._balaoH, cada = naRoda ? ZE_ARCO.NOTA_RODA_CADA : ZE_ARCO.NOTA_CADA;
  if (!b || agora > b.ate + cada - ZE_ARCO.NOTA_MS) z._balaoH = { nome: 'nota_musical', de: agora, ate: agora + ZE_ARCO.NOTA_MS };
});
// A Noite do Samba: às 19h, no salão, o Zé sobe no banquinho (a cena de cinema, uma vez por noite; espera a cena de prato que estiver
// tocando). Com as cenas desligadas (a bateria de testes), ela fica registrada e a música do samba toca igual.
ATUALIZADORES.push(() => {
  const t = G.turno;
  if (!t || !t.samba || t._sambaFoi || G.minutos < ZE_ARCO.SAMBA_HORA || typeof noSalaoDaPensao !== 'function' || !noSalaoDaPensao()) return;
  if (typeof CenaPrato !== 'undefined' && CenaPrato._cena) return;
  ZeArco.cantaNaNoite(t);
});
// (rodada 1, M10) A turma da Noite do Samba entra com o enfeite da festa na cabeça, como a das outras festas do tema (palco.js,
// ENFEITE_FESTA): o chapéu de malandro (salao/enfeite_malandro, arte pronta da E6, com o encaixe já medido em ENFEITE_OCASIAO).
if (typeof ENFEITE_FESTA !== 'undefined') ENFEITE_FESTA['Noite do Samba do Zé'] = ['enfeite_malandro', 20];
// (rodada 1, I1) A Caderneta: no dia da Noite do Samba, até as 19h, a linha de Hoje (a pensão); depois do E2, a roda de sexta (na
// sexta, até as 22h30, em Hoje; nos outros dias, na aba Vila). Só informa, como as outras linhas de hora marcada dos arcos.
if (typeof CADERNETA !== 'undefined') CADERNETA.push(() => {
  const r = [];
  if (ZeArco.sambaHoje() && G.minutos < ZE_ARCO.SAMBA_HORA)
    r.push({ id: 'hoje_noite_samba', aba: 'hoje', hoje: true, texto: 'Hoje é a Noite do Samba do Zé: às 7 da noite ele canta no salão, e a turma da roda janta junto', alvo: { mapa: 'vila', objeto: 'pensao' } });
  if (ZeArco.cantaNaRoda()) {
    const hoje = typeof zeNaRoda === 'function' && zeNaRoda(G.dia, ZE_RODA.de) && G.minutos < ZE_RODA.ate;
    r.push({ id: 'vila_roda_ze', aba: hoje ? 'hoje' : 'vila', hoje, texto: hoje ? 'Hoje é sexta: das 7 às 10 e meia da noite, o Zé canta na roda da praça'
      : 'Sexta à noite, das 7 às 10 e meia, o Zé canta na roda da praça (com chuva, não tem roda)', alvo: { mapa: 'vila', objeto: 'roda_samba' } });
  }
  return r;
});
// A música do samba na Noite do Samba (o rodízio, sons.js): da cena até o fim da faixa; depois, a da pensão de novo.
if (typeof MUSICAS !== 'undefined') MUSICAS.samba = ['musica_samba_ze'];
if (typeof momentoMusica === 'function') { const _mmZe = momentoMusica; momentoMusica = function () { return ZeArco.sambaTocando() ? 'samba' : _mmZe(); }; }

// ---------- as falas (o Zé depois de cada cena, os tópicos da Vila) ----------
{
  const T = (quem, topico, fala, se) => { if (typeof _T === 'function') _T(quem, topico, fala, se); else if (CONVERSAS[quem]) CONVERSAS[quem].linhas.push({ quando: Object.assign({ topico }, se ? { se } : {}), fala }); };
  const nomeEh = v => typeof Conversas !== 'undefined' && Conversas.resposta('ze_samba') === v;
  // E1: o samba da masseira (o tópico historia_ze_2, que o motor abre por 4 dias)
  T('bira', 'historia_ze_2', ['O Zé cantando na masseira? Desde que eu conheço, rapaz. E a massa dele sai no ponto, então eu deixo.']);
  T('rosa', 'historia_ze_2', ['@alegre O Zé canta na masseira? Ai, que bonito. Diz pra ele cantar aqui na pensão um dia.']);
  // E2: a roda de sexta
  T('zelia', 'ze_roda', ['@alegre Ouvi o Zé cantar na roda da praça! Sentei no banco só pra ver. Que voz, meu filho!']);
  T('lourival', 'ze_roda', ['O Zé soltou a voz na roda da praça, compadre. Até os pescadores pararam de remendar rede.']);
  T('juca', 'ze_roda', ['@alegre O moço da masseira canta bonito, sobrinho! Na próxima sexta eu levo a viola.']);
  T('ritinha', 'ze_roda', ['@alegre Pai, o Zé da obra cantou na praça! O Zezinho dançou até cair sentado.']);
  // E3: o nome do samba
  T('rosa', 'ze_samba_nome', () => [nomeEh('pensao') ? '@amorosa O Zé batizou o samba de "A Pensão da Rosa"! Fiquei toda boba, amor.'
    : nomeEh('aracaju') ? '@pensativo "Saudade de Aracaju"... O Zé pegou o nosso coração e pôs num samba.'
      : '@alegre "Tijolo e Tempero"! A obra e a pensão num samba. Ideia sua, né?']);
  T('juca', 'ze_samba_nome', () => [nomeEh('aracaju') ? '@alegre "Saudade de Aracaju"! Esse Zé me ganhou, sobrinho. Vou tirar na viola.'
    : `@alegre O samba do Zé tem nome agora: "${ZeArco.nome()}". Vai pra Rádio e tudo!`]);
  T('bira', 'ze_samba_nome', () => [`O Zé só fala da Rádio Maré, rapaz. "${ZeArco.nome()}", "${ZeArco.nome()}"... Hoje errou a massa duas vezes de tanto cantar.`]);
  // E4: o samba na pensão (a Noite do Samba do Zé)
  T('zelia', 'samba_ze_pensao', ['@alegre O Zé cantou na pensão da Rosa! Disseram que o salão inteiro batia na mesa. Na próxima eu vou, nem que seja de chinelo.']);
  T('lourival', 'samba_ze_pensao', ['Noite do Samba do Zé, compadre? Pescador também samba. Me guarda uma banqueta.']);
  T('juca', 'samba_ze_pensao', () => [Conversas.respondeu('ze_samba_danca') ? '@alegre Vi você dançando com a Rosa, sobrinho! Fazia doze anos que eu não via isso.' : '@alegre A palma da Vila inteira no salão da Rosa! Coisa linda, sobrinho.']);
  T('bira', 'samba_ze_pensao', ['O Zé no banquinho da pensão... Quem diria. Cantava só pra massa, rapaz.']);
  T('rosa', 'samba_ze_pensao', ['@alegre Já escrevi no calendário: a Noite do Samba do Zé. Festa com samba, o salão enche!']);
  // o Zé depois de cada cena (de vez em quando: o estado do arco, só em alguns dias). A roda e a Noite do Samba passam na frente das
  // outras (o lugar e o dia a mais no `quando`: a regra de desempate do conversas.js, a linha com mais condições).
  const VILA = ['vila', 'obra'];
  if (CONVERSAS.ze) CONVERSAS.ze.linhas.push(
    { quando: { lugar: VILA, se: () => !!ZeArco.sambaHoje() && G.minutos < 19 * 60 }, fala: ['@alegre Hoje tem Noite do Samba na pensão, parceiro! Às sete o Zé sobe no banquinho.'] },
    { quando: { lugar: VILA, semana: 'Sex', se: () => !ZeArco.noiteDoSamba() && !!ZeArco.zeDaVila() && !!ZeArco.zeDaVila()._naRoda },
      fala: () => [ZeArco.nome() ? `@alegre Sexta é dia de roda, parceiro! Hoje tem "${ZeArco.nome()}" de novo.` : '@alegre Sexta é dia de roda, parceiro! Hoje o Zé canta, que a vergonha ficou na masseira.'] },
    { quando: { se: () => ZeArco.noiteAberta() && G.dia % 3 === 0 }, fala: ['@alegre Agora tem noite de festa só do samba, parceiro! Tá no calendário da Dona Rosa.'] },
    { quando: { se: () => ZeArco._visto('ze_6') && !ZeArco.noiteAberta() && G.dia % 3 === 1 }, fala: () => [`@pensativo "${ZeArco.nome()}" tá quase pronto, parceiro. Falta só o final... e a coragem.`] },
    { quando: { se: () => ZeArco.cantaNaRoda() && !ZeArco._visto('ze_6') && G.dia % 3 === 2 }, fala: ['@alegre Depois daquela sexta, o pessoal da roda não me deixa mais só no pandeiro.'] },
    { quando: { se: () => ZeArco.cantaNaObra() && !ZeArco.cantaNaRoda() && G.dia % 3 === 2 }, fala: ['Massa boa tem ritmo, parceiro. Um verso, uma enxadada.'] });
}
