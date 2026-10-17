// Família Santos — historias/rosa.js — o arco da Rosa, "O caderno da Vó Ia" (T9 das conversas e histórias; spec
// docs/superpowers/specs/2026-10-15-conversas-historias-design.md, seção 8.1; o motor é o historias.js, seção 6).
// A Rosa é da família: sem corações (decisão 3 da seção 13). As 4 cenas disparam por MARCOS DA VIDA DA CASA (a pensão aberta, a
// 2ª estrela, a casa mudada, a 4ª estrela), por acaso, no lugar e na hora certos; no máximo 1 cena por dia (o motor cuida).
// O arco: a Vó Ia (a avó dela, viva, em Itabaiana) manda o caderno de receitas; a Rosa inventa "o prato da Vila"; os dois comemoram
// os doze anos de casados na praia; a Rosa escreve a moqueca dela no caderno, a 1ª página com a letra dela. Ela deixa de seguir
// receitas e passa a escrevê-las. Só temas leves (a seção 8): a saudadezinha da sogra se resolve na mesma cena.
//   R1 rosa_1 "O caderno da Vó Ia": a pensão aberta há 7 dias; domingo à noite, dentro de casa. → a receita com nome "Bolo de
//      Macaxeira da Vó Ia" (o caminho 'amizade', receitas.js), o tópico caderno_ia (a Ritinha conta na pensão que leu a letra da
//      bisavó) e o caderno na mesa de casa.
//   R2 rosa_2 "O prato da Vila": a pensão ★★ (o degrau 3); tarde de chuva, no salão, antes das 17h. → o prato escolhido (a couve,
//      a tainha ou o caju) sobe 1 nível de capricho, +3 pitadas; a Rosa fala da escolha nas noites seguintes.
//   R3 rosa_3 "Doze anos na areia": a casa mudada; sexta sem chuva, depois da janta (21h30+), na praia. → amanhã a energia começa
//      cheia e com bônus ("dormiu feliz"); a promessa (`promessa_zefa`) volta no final (firma.js) e vira o nome da Lembrança.
//   R4 rosa_4 "Duas cozinheiras": a pensão ★★★★ (Casa Tradicional, o degrau 5); de dia, no salão, antes da janta. → o caderno vira
//      enfeite no balcão do salão, a Moqueca da Rosa sobe 1 nível, a capa escolhida (`rosa_capa`) volta na festa final (firma.js).
// As falas são rascunho, revisadas com o dono (a seção 8). Nenhuma tela diz "história" nem "missão".

const ROSA_ARCO = {
  DORMIU_FELIZ: 1.2,   // R3: na manhã seguinte, a energia começa em 120% (o quarto do casal dá 110%; ECO.casa.quarto)
  PITADAS: 3,          // R2: as pitadas de tempero do prato da Vila
  // R2: a escolha → o prato que sobe (a couve: a Couve à Mineira; a tainha: o Peixe Ensopado, o prato da tainha; o caju: a cocada)
  PRATO_DA_VILA: { couve: 'couve_mineira', tainha: 'peixe_ensopado', caju: 'cocada_tijolinho' },
  NOITES: 6,           // R2: a Rosa fala do prato escolhido nos 6 dias seguintes
  R2_SEM_CHUVA: 5,     // R2: a tarde de chuva é a preferência; 5 dias depois de o arco ficar pronto, vale qualquer tarde
  CONVITE_DIA: 4,      // R3: o bilhete da Rosa chega na sexta de manhã (Conversas.semana: 0 = segunda)
  // R1: onde cada um está em cada casa (a do Tio Juca, a da família depois da mudança): ladrilhos de 48 px, em volta da mesa e longe
  // das fileiras de baixo (a caixa da fala cobre a parte de baixo do cômodo); a Ritinha vem andando; `junto`: o Jocelino senta perto
  CASA: {
    casa_juca_dentro: { rosa: [10, 4, 'baixo'], jocelino: [12, 6, 'esquerda'], ritinha: [6, 4, 'direita'], ritinhaVai: [9, 4], junto: [[12, 4], [11, 4]] },
    casa_familia_dentro: { rosa: [6, 4, 'esquerda'], jocelino: [8, 4, 'esquerda'], ritinha: [9, 3, 'esquerda'], ritinhaVai: [7, 3], junto: [[7, 4]] },
  },
  // o caderno da Vó Ia na mesa de casa (o pé, em px do cômodo, e a escala da arte de 48), entre o R1 e o R4
  MESA: { casa_juca_dentro: { x: 500, y: 300, escala: 0.55 }, casa_familia_dentro: { x: 205, y: 182, escala: 0.45 } },
  // R4: o caderno no balcão do salão: à direita da última banqueta, no tampo (o pé da louça, PALCO.LOUCA.base)
  BALCAO: { dx: 56, base: 786, escala: 1 },
};

const RosaArco = {
  _aviso: '',
  // (rodada 1) R2: desde quando o arco está pronto (G.rosaArco.r2, no save) e se já passou a espera da chuva.
  r2Paciente() { const d = (G.rosaArco || {}).r2; return !!d && G.dia - d >= ROSA_ARCO.R2_SEM_CHUVA; },
  _r2Pronto() { return Historias.viu('rosa_1') && !Historias.viu('rosa_2') && _grauRosa() >= 3; },
  // R3: a casa mudada (o marco) e o bilhete da Rosa já chegou (na caixa ou lido).
  r3Pronto() { return typeof CasaFamilia !== 'undefined' && CasaFamilia.mudou(); },
  conviteChegou() { const c = G.correio; return !!c && (c.caixa.includes('rosa_praia') || c.lidas.includes('rosa_praia')); },
  _r3Espera() { return Historias.viu('rosa_1') && !Historias.viu('rosa_3') && RosaArco.r3Pronto(); },
  // Quantos dias desde a cena (−1: não viu).
  diasDesde(id) { return Historias.viu(id) ? G.dia - Historias.vistaEm(id) : -1; },
  // Sobe 1 nível o prato (o presente da cena): fora do caderno, entra nele (nível 1); no caderno, +1 (até o máximo). → texto do aviso
  subirPrato(id) {
    const p = G.pensao; if (!p || !Pratos.PRATOS[id]) return '';
    const nome = Pratos.PRATOS[id].nome;
    if (!p.receitas.includes(id)) { p.liberarReceita(id); return `${nome} entrou no caderno da Rosa.`; }
    const n = p.nivel(id); if (n >= Pensao.NIVEL_MAX) return '';
    p.niveis[id] = n + 1;
    return `${nome} subiu para o nível ${n + 1}.`;
  },
  // R2: o prato da Vila (a escolha gravada em G.respostas.rosa_prato_vila) e as pitadas.
  pratoEscolhido() { return ROSA_ARCO.PRATO_DA_VILA[Conversas.resposta('rosa_prato_vila')] || ''; },
  pratoDaVila() {
    const id = RosaArco.pratoEscolhido(), t = id ? RosaArco.subirPrato(id) : '';
    if (G.pensao) G.pensao.pitadas += ROSA_ARCO.PITADAS;
    avisar(`O prato da Vila: ${t ? t + ' ' : ''}+${ROSA_ARCO.PITADAS} pitadas de tempero.`);
  },
  // R4: a moqueca sobe e o caderno vai para o balcão.
  moqueca() {
    const t = RosaArco.subirPrato('moqueca');
    avisar(`${t ? t + ' ' : ''}O caderno da Vó Ia fica no balcão da pensão.`);
    if (G.mapa) RosaArco.poeCaderno(G.mapa);
  },
  // A capa escolhida no R4 (o final lê): 'Pensão da Rosa' | 'Caderno da Vó Ia e da Rosa' | ''.
  capa() { return Historias.viu('rosa_4') ? Conversas.resposta('rosa_capa') || 'Caderno da Vó Ia e da Rosa' : ''; },
  // Onde está o caderno da Vó Ia: 'mesa' (depois do R1), 'balcao' (depois do R4, e durante o R4) ou ''.
  cadernoEm() {
    if (Historias.viu('rosa_4') || Historias.tocando() === 'rosa_4') return 'balcao';
    return Historias.viu('rosa_1') ? 'mesa' : '';
  },
  // O caderno na mesa da casa onde a família mora (casa_dentro.js: as marmitas e o Bazar também ficam na mesa).
  poeCaderno(b) {
    if (!b || !ROSA_ARCO.MESA[b.id]) return;
    for (const o of b.objs.filter(o => o.id === 'caderno_via')) b.tirar(o);
    if (RosaArco.cadernoEm() !== 'mesa' || typeof casaDaFamilia !== 'function' || b.id !== casaDaFamilia()) return;
    const M = ROSA_ARCO.MESA[b.id], o = b.interativo('caderno_via', 'objetos/caderno_via', 0, 0, 1, 1, null, false);
    Object.assign(o, { x: M.x, y: M.y });
    o.desenha = ctx => desenhaPe(ctx, 'objetos/caderno_via', o.x, o.y, 1, M.escala);
    o.acao = () => { abrirPlaca('O caderno da Vó Ia, de capa de pano, com as páginas manchadas de dendê. Na capa, com a letra dela: "agora é teu".'); return true; };
    return o;
  },
};

// ---------- as cenas ----------
const _grauRosa = () => G.pensao && G.pensao.estado === 'aberta' && typeof G.pensao.grau === 'function' ? Math.max(G.pensao.grau(), G.pensao.grauMinimo || 1) : 0;
const _lugarR1 = () => ROSA_ARCO.CASA[G.mapaId] || ROSA_ARCO.CASA.casa_juca_dentro;

HISTORIAS.rosa_1 = {
  quem: 'rosa', titulo: 'O caderno da Vó Ia', clima: 'Anda falando da Vó Ia, lá de Itabaiana',
  // (o gatilho da 8.1 é 19h–22h; aqui até a meia-noite: quem volta da janta de domingo depois das 22h também encontra a cena)
  gatilho: { mapa: ['casa_juca_dentro', 'casa_familia_dentro'], semana: 'domingo', hora: [19 * 60, 24 * 60],
    se: () => !!G.pensao && G.pensao.estado === 'aberta' && G.pensao.abreDia != null && G.dia >= G.pensao.abreDia + 7 },
  get elenco() { const L = _lugarR1(); return { rosa: L.rosa, jocelino: L.jocelino, ritinha: L.ritinha }; },
  musica: 'musica_noite_2',
  get passos() {
    const L = _lugarR1(), v = L.ritinhaVai;
    return [
      ['balao', 'rosa', 'exclamacao'],
      ['fala', 'rosa', '@surpreso Jocelino, olha o que chegou pelo correio! Um caderno velho, todo manchado de dendê...', '@surpreso A Vó Ia mandou o caderno dela! Escreveu na capa: "agora é teu".'],
      ['fala', 'rosa', '@pensativo Só que a letra dela... isso aqui é "cebola" ou "canela"?'],
      ['balao', 'ritinha', 'exclamacao', 'junto'],
      ['anda', 'ritinha', v[0], v[1]],
      ['vira', 'ritinha', 'rosa'],
      ['fala', 'ritinha', '@alegre Deixa que eu leio, mãe! Eu leio até a letra do Seu Ananias na nota da venda.'],
      ['vira', 'rosa', 'jocelino'],
      ['escolha', 'rosa', '@alegre E você, meu velho? Ajuda a gente?', [
        { t: 'Sentar e ajudar a decifrar', marca: 'rosa_caderno_junto', ir: 'junto', resposta: ['@alegre Senta aqui, meu velho.'] },
        { t: '"Amanhã a gente vê, tô morto"', marca: 'rosa_caderno_cansado', ir: 'cansado', resposta: ['@amorosa Vai deitar. Eu fico mais um pouco com a Vó.'] }]],
      ['rotulo', 'junto'],
      ...L.junto.map(([x, y]) => ['anda', 'jocelino', x, y]),
      ['vira', 'jocelino', 'rosa'],
      ['som', 'pagina'],
      ['fala', 'ritinha', '@alegre "Duas xícaras de macaxeira ralada, um coco, açúcar... e canela por cima"! É canela, mãe!'],
      ['fala', 'jocelino', '@alegre O bolo de macaxeira da Vó Ia! O das festas de São João.'],
      ['fala', 'rosa', '@emocionada Esse bolo para a rua inteira. Eu tinha a idade da Ritinha quando aprendi a ralar a macaxeira.'],
      ['balao', 'rosa', 'coracao'],
      ['ir', 'fim'],
      ['rotulo', 'cansado'],
      ['fala', null, 'O Jocelino já está quase dormindo quando ouve as duas cochichando na mesa, virando as páginas devagar.'],
      ['som', 'pagina'],
      ['fala', 'ritinha', '@alegre (baixinho) É canela, mãe! "Bolo de macaxeira, com canela por cima."'],
      ['rotulo', 'fim'],
      ['fala', 'rosa', '@alegre Bolo de Macaxeira da Vó Ia. Amanhã ele já entra no meu caderno da pensão.'],
      ['fim', { receita: 'bolo_macaxeira_via', topico: { id: 'caderno_ia', dias: 5 }, depois: () => RosaArco.poeCaderno(G.mapa) }],
    ];
  },
};

HISTORIAS.rosa_2 = {
  quem: 'rosa', titulo: 'O prato da Vila', clima: 'Anda provando as panelas e dizendo que falta alguma coisa',
  // (rodada 1) a chuva é a preferência: passados ROSA_ARCO.R2_SEM_CHUVA dias do arco pronto (o R1 visto e a ★★), vale qualquer tarde
  get gatilho() {
    const g = { mapa: 'pensao_palco', hora: [12 * 60, 17 * 60], depois: 'rosa_1', se: () => _grauRosa() >= 3 };
    return RosaArco.r2Paciente() ? g : Object.assign({ chuva: true }, g);
  },
  elenco: { rosa: [30, 18, 'esquerda'], jocelino: [20, 18, 'direita'] },
  musica: 'musica_dia_3',
  passos: [
    ['anda', 'rosa', 24, 18],
    ['vira', 'jocelino', 'rosa'],
    ['fala', 'rosa', '@pensativo Jocelino, chega aqui. Prova isso. Uma colherada.'],
    ['som', 'mastigar_1'],
    ['balao', 'jocelino', 'reticencias'],
    ['fala', 'rosa', '@pensativo Outra. Agora com o caldinho.'],
    ['som', 'mastigar_2'],
    ['balao', 'jocelino', 'reticencias'],
    ['fala', 'rosa', '@pensativo E a terceira... Tá bom, né? Mas falta alguma coisa daqui. Da nossa terra nova.',
      '@alegre Eu quero um prato que só a Vila Maré tem. Que quem vier de fora diga: "isso só tem aqui".'],
    ['escolha', 'rosa', '@pensativo O que é que a Vila tem que Aracaju não tem?', [
      { t: 'A couve da horta do quintal', valor: 'couve', resposta: ['@alegre A couve que você planta! Fininha, no alho, com farinha... A Couve à Mineira vai ser o prato da Vila.'] },
      { t: 'A tainha do Seu Lourival', valor: 'tainha', resposta: ['@alegre A tainha do Lourival, no molho com tomate! O Peixe Ensopado vai ser o prato da Vila.'] },
      { t: 'O caju do quintal', valor: 'caju', resposta: ['@alegre Caju do pé, cozido na cocada! Isso só tem aqui. A cocada vai ser o prato da Vila.'] }],
      { id: 'rosa_prato_vila' }],
    ['balao', 'rosa', 'coracao'],
    ['fala', 'rosa', '@alegre Hoje mesmo eu capricho nele. E ainda ganhei um jeito novo de temperar.'],
    ['fim', { topico: { id: 'prato_vila', dias: 5 }, depois: () => RosaArco.pratoDaVila() }],
  ],
};

HISTORIAS.rosa_3 = {
  quem: 'rosa', clima: 'Anda cantarolando um forró antigo',
  // a Lembrança muda de nome com a promessa (a 8.1: "a promessa vira lembrança na aba Gente")
  get titulo() { return typeof Conversas !== 'undefined' && Conversas.respondeu('promessa_zefa') ? 'A promessa na areia' : 'Doze anos na areia'; },
  // (rodada 1) sexta OU sábado: a janta vai até umas 21h e pouca gente passa na praia depois; o bilhete da Rosa (a carta rosa_praia,
  // na sexta de manhã depois da mudança) chama, e a Caderneta lembra nesses dias
  gatilho: { mapa: 'praia', semana: ['Sex', 'Sáb'], chuva: false, hora: [21 * 60 + 30, 26 * 60], depois: 'rosa_1',
    se: () => RosaArco.r3Pronto() && RosaArco.conviteChegou() },
  elenco: { rosa: [24, 14, 'baixo'], jocelino: [21, 12, 'baixo'] },
  musica: 'musica_noite_3',
  passos: [
    ['camera', 'rosa'],
    ['fala', null, 'Depois da janta. A Rosa está sentada na areia, com duas cocadas e um guaraná.'],
    ['anda', 'jocelino', 23, 14],
    ['vira', 'rosa', 'jocelino'],
    ['vira', 'jocelino', 'rosa'],
    ['fala', 'rosa', '@alegre Achei que você não vinha. Senta aqui.', '@alegre Doze anos, sabia? Você pisou no meu pé no forró de São João e pediu desculpa três vezes.'],
    ['fala', 'jocelino', '@alegre E você disse que só dançava comigo de novo se eu aprendesse o passo.'],
    ['som', 'mar'],
    ['fala', 'rosa', '@pensativo Sua mãe vai adorar ver isso aqui um dia. O mar, a Vila, a pensão...'],
    ['escolha', 'rosa', '@amorosa E agora, seu Jocelino?', [
      { t: 'Prometer trazer a Dona Zefa', marca: 'promessa_zefa', ir: 'promessa' },
      { t: 'Dançar ali mesmo, na areia', marca: 'rosa_danca_areia', ir: 'danca' }]],
    ['rotulo', 'promessa'],
    ['fala', 'jocelino', 'Um dia eu trago a mãe pra cá. Pra ver a pensão, a casa e esse mar. Prometo.'],
    ['fala', 'rosa', '@emocionada Promete mesmo? Então eu vou guardar essa promessa.'],
    ['balao', 'rosa', 'coracao'],
    ['ir', 'fim'],
    ['rotulo', 'danca'],
    ['balao', 'rosa', 'nota_musical'],
    ['anda', 'rosa', 24, 13, 'junto'], ['anda', 'jocelino', 23, 13],
    ['anda', 'rosa', 24, 14, 'junto'], ['anda', 'jocelino', 23, 14],
    ['vira', 'rosa', 'jocelino'], ['vira', 'jocelino', 'rosa'],
    ['balao', 'jocelino', 'coracao', 'junto'], ['balao', 'rosa', 'coracao'],
    ['fala', 'rosa', '@amorosa Olha só: aprendeu o passo. Doze anos depois.'],
    ['rotulo', 'fim'],
    ['fala', null, 'Os dois ficam na areia, dividindo a cocada, até a maré subir.'],
    ['fim', {}],
  ],
};

HISTORIAS.rosa_4 = {
  quem: 'rosa', titulo: 'Duas cozinheiras', clima: 'Anda escrevendo alguma coisa no caderno da Vó Ia, escondido',
  // (a 8.1 diz "manhã"; aqui de dia até a janta: de manhã o Jocelino quase nunca passa no salão, e a cena esperaria demais)
  gatilho: { mapa: 'pensao_palco', hora: [6 * 60, 17 * 60], depois: 'rosa_2', se: () => _grauRosa() >= 5 },
  elenco: { rosa: [30, 18, 'esquerda'], jocelino: [19, 18, 'direita'] },
  musica: 'musica_dia_2',
  passos: [
    ['anda', 'rosa', 23, 18],
    ['vira', 'jocelino', 'rosa'],
    ['balao', 'rosa', 'exclamacao'],
    ['fala', 'rosa', '@alegre Jocelino, vem ver. O caderno da Vó Ia.', '@pensativo Todas as páginas são da letra dela. O bolo, o mungunzá, o arroz-doce...'],
    ['som', 'pagina'],
    ['fala', 'rosa', '@alegre Hoje eu escrevi a primeira com a minha letra: a minha moqueca. Do jeito que eu faço aqui, com o peixe da Vila.'],
    ['fala', 'rosa', '@emocionada Agora o caderno tem duas cozinheiras.'],
    ['fala', 'rosa', '@amorosa Escreve a capa pra mim? Você tem a letra mais bonita da casa... depois da Ritinha.'],
    ['escolha', 'rosa', '@alegre O que a gente escreve na capa?', [
      { t: '"Pensão da Rosa"', valor: 'Pensão da Rosa', resposta: ['@alegre "Pensão da Rosa"! Parece livro de receita de verdade, desses da banca de jornal.'] },
      { t: '"Caderno da Vó Ia e da Rosa"', valor: 'Caderno da Vó Ia e da Rosa', resposta: ['@emocionada As duas juntas na capa. A Vó Ia vai gostar quando eu contar na carta.'] }],
      { id: 'rosa_capa' }],
    ['som', 'letra'],
    ['fala', 'rosa', '@alegre Vai ficar aqui no balcão. Quem quiser, olha. Quem quiser copiar... pergunta pra mim primeiro!'],
    ['fim', { topico: { id: 'caderno_balcao', dias: 7 }, depois: () => RosaArco.moqueca() }],
  ],
};

// ---------- o estado do arco (no save) e o bilhete da praia ----------
INICIADORES.push(s => { G.rosaArco = Object.assign({}, s.rosaArco || {}); });
COLETORES.push(s => { s.rosaArco = Object.assign({}, G.rosaArco || {}); });
CARTAS.rosa_praia = { de: 'Rosa', dia: 1e9,
  texto: 'Jocelino: sexta, depois da janta, me encontra na praia. Se não der, sábado. Leva o chapéu, que de noite venta. — Rosa' };
MANHA.push(() => {
  G.rosaArco = G.rosaArco || {};
  if (RosaArco._r2Pronto() && !G.rosaArco.r2) G.rosaArco.r2 = G.dia;
  if (RosaArco._r3Espera() && !RosaArco.conviteChegou() && G.correio && Conversas.semana() === ROSA_ARCO.CONVITE_DIA) G.correio.caixa.push('rosa_praia');
});
// A lembrança do dia na Caderneta (Hoje): na sexta e no sábado sem chuva, com o bilhete chegado e a praia ainda por acontecer.
if (typeof CADERNETA !== 'undefined') CADERNETA.push(() => {
  if (!RosaArco._r3Espera() || !RosaArco.conviteChegou() || ![4, 5].includes(Conversas.semana()) || Conversas.chove()) return [];
  return [{ id: 'hoje_rosa_praia', aba: 'hoje', texto: 'Depois da janta, a Rosa espera você na praia (o bilhete dela)' }];
});

// ---------- o mundo muda ----------
// O caderno na mesa de casa (entre o R1 e o R4): ao montar e ao entrar na casa.
AO_MONTAR.push(b => RosaArco.poeCaderno(b));
AO_ENTRAR_MAPA.push(id => { if (ROSA_ARCO.MESA[id] && G.mapa) RosaArco.poeCaderno(G.mapa); });
// O caderno no balcão do salão (do R4 em diante; no R4, desde o começo da cena: a Rosa escreve nele). O palco não roda no simulador.
AO_MONTAR.push(b => {
  if (b.id !== 'pensao_palco' || typeof PALCO === 'undefined') return;
  b.objs.push({ tipo: 'camada', id: 'caderno_balcao', y: PALCO.TAMPO_Y + 81, desenha(ctx) {
    if (RosaArco.cadernoEm() !== 'balcao') return;
    const B = ROSA_ARCO.BALCAO, A = PALCO.ASSENTOS;
    desenhaPe(ctx, 'objetos/caderno_via', A[A.length - 1].x + B.dx, B.base, 1, B.escala);
  } });
});
// R3: dormiu feliz. Na manhã seguinte à praia, a energia começa cheia e com bônus (não depois do desmaio: a energia já veio menor).
MANHA.push(() => {
  if (RosaArco.diasDesde('rosa_3') !== 1 || G.energia < G.energiaMax) return;
  G.energia = Math.max(G.energia, Math.round(G.energiaMax * ROSA_ARCO.DORMIU_FELIZ));
  RosaArco._aviso = 'O Jocelino acordou cantarolando o forró da praia: energia de sobra hoje.';
});
// O aviso espera o jogo livre (depois do resumo da noite e da tela clareando), como o da marmita (casa_dentro.js).
ATUALIZADORES.push(() => {
  if (!RosaArco._aviso || (typeof menuAberto === 'function' && menuAberto()) || (typeof _fade !== 'undefined' && _fade) || !G.jog || G.jog.deitado) return;
  avisar(RosaArco._aviso); RosaArco._aviso = '';
});

// ---------- as falas (os tópicos da Vila e as noites seguintes da Rosa) ----------
// Cada linha entra na tabela da pessoa (CONVERSAS, falas.js); as de tópico pelo _T do topicos.js (quem tem a festa dela comenta depois).
{
  const T = (quem, topico, fala, se) => { if (typeof _T === 'function') _T(quem, topico, fala, se); else if (CONVERSAS[quem]) CONVERSAS[quem].linhas.push({ quando: Object.assign({ topico }, se ? { se } : {}), fala }); };
  const escolheu = v => () => Conversas.resposta('rosa_prato_vila') === v;
  // R1: o caderno da Vó Ia (a Ritinha conta na pensão que leu a letra da bisavó)
  T('ritinha', 'caderno_ia', ctx => Conversas.respondeu('rosa_caderno_cansado')
    ? ['@alegre Pai, você dormiu e eu li o caderno da bisavó Ia inteirinho com a mãe! Contei pra todo mundo na pensão.']
    : ['@alegre Contei pra todo mundo na pensão que eu leio a letra da bisavó Ia. Ninguém acreditou!']);
  T('zelia', 'caderno_ia', ['A Ritinha me contou, lá na pensão, que lê a letra da bisavó dela. Menina de ouro, essa.']);
  T('juca', 'caderno_ia', ['@alegre A Dona Ia mandou o caderno? Conheci, lá em Itabaiana. Faz um bolo de macaxeira que para a feira!']);
  // R2: o prato da Vila (quem tem a ver com a escolha comenta)
  T('lourival', 'prato_vila', ['A tainha entrou no prato da Vila, é? Vou separar as mais gordas pra Rosa, pode dizer a ela.'], escolheu('tainha'));
  T('zelia', 'prato_vila', ['Couve à Mineira como o prato da Vila! A Rosa tem bom gosto: couve é a cara daqui.'], escolheu('couve'));
  T('ze', 'prato_vila', ['Caju do quintal na cocada da Rosa? Me guarda um pedaço, Jocelino, que o guaraná é por minha conta.'], escolheu('caju'));
  // ... e a Rosa nas noites seguintes (a regra 5: a escolha gravada + os dias depois da cena)
  const noites = () => { const d = RosaArco.diasDesde('rosa_2'); return d >= 1 && d <= ROSA_ARCO.NOITES; };
  const FALA_DA_VILA = {
    couve: ['@alegre Um freguês de Santos perguntou se a Couve à Mineira era receita da Vila. Eu disse que era, ué!', '@alegre A couve da horta tá saindo que nem pão quente. Planta mais, meu velho.'],
    tainha: ['@alegre O Peixe Ensopado com a tainha do Lourival... teve gente pedindo duas vezes!', '@alegre O Lourival agora separa a tainha mais gorda pra mim. O prato da Vila tá ficando famoso.'],
    caju: ['@alegre A cocada de caju acabou antes das oito! Amanhã eu faço o dobro.', '@alegre Até o Zé veio pedir a cocada de caju. Disse que é a mais gostosa da Vila.'],
  };
  for (const v in FALA_DA_VILA) if (CONVERSAS.rosa) CONVERSAS.rosa.linhas.push({ quando: { se: noites, resposta: { rosa_prato_vila: v } }, fala: () => [FALA_DA_VILA[v][G.dia % 2]] });
  // R3: a praia (o tópico historia_rosa_3, que o motor abre por 4 dias)
  T('ritinha', 'historia_rosa_3', ['@alegre A mãe voltou da praia cantando forró. Vocês dançaram, foi? Que vergonha, pai!'], () => Conversas.respondeu('rosa_danca_areia'));
  T('juca', 'historia_rosa_3', ['@alegre Doze anos de casados! E a Rosa ainda conta do pé pisado no forró. Tem coisa que não se esquece, rapaz.']);
  // R4: o caderno no balcão
  T('zelia', 'caderno_balcao', ['Vi o caderno da Rosa no balcão da pensão. Que letra caprichada! Será que ela me deixa copiar a moqueca?']);
  T('bira', 'caderno_balcao', ['O caderno da Rosa no balcão, hein? Receita escrita é que nem planta de obra: quem tem, não erra.']);
  T('lourival', 'caderno_balcao', ['A moqueca da Rosa agora tá escrita no caderno? Então o meu peixe entrou pra família, rapaz.']);
  T('rosa', 'caderno_balcao', ['@amorosa Ninguém mexe no meu caderno, viu? Só você, a Ritinha e a Vó Ia.']);
}
