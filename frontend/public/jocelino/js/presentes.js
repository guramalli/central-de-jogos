// Família Santos — presentes.js — os presentes e os aniversários (T5 das conversas e histórias; spec
// docs/superpowers/specs/2026-10-15-conversas-historias-design.md, seções 5, 1.2, 4.1 e a decisão 3 da 13).
// Como é no Stardew (Friendship): com um item na mão, o clique no morador dá o presente; 1 por dia e 2 por semana por pessoa; no
// aniversário sempre pode (fora do limite da semana) e vale ×8; ama +80, gosta +45, neutro +20, não gosta −20, odeia −40; o amado
// mostra o balão de coração, o odiado o de raiva; a fala de reação é a do item exato, senão a do gosto, senão a genérica; o gosto
// fica anotado no registro de presentes. Aqui, do nosso jeito:
// - O POVO DA VILA: 1 por dia e 2 por semana (a semana começa na segunda; o dia 1 é uma segunda). No aniversário sempre pode (o
//   1 por dia continua) e vale ×5. Os pontos são os da seção 4.1 (Amizade.PONTOS.presente: 40/20/10/−10/−20); a Lábia vale.
// - A FAMÍLIA (Rosa, Tio Juca, Ritinha e Zezinho): 1 por dia, SEM NÚMERO (decisão 3). Ela reage com a fala, a emoção e o balão; no
//   aniversário a reação é especial (a Rosa guarda o presente no caderno; o Zezinho corre mostrar ao Caramelo).
// - Como dar: o item comum na mão (não ferramenta, não o que se coloca no chão) e o botão direito no morador: o presente sai direto,
//   como no Stardew. Pergunta antes ("Dar 1 marmita da Rosa de presente para o Mestre Bira?") só no 1º presente, no item que faz
//   falta a um pedido aceito, na comida pronta e no item raro: um clique errado não dá a marmita. "Agora não" é a conversa de
//   sempre. O presente não conta como a conversa do dia (no Stardew são duas coisas).
// - O que vem na frente do presente: o recado aceito da pessoa com esse item (recadoComItem, recados_jogo.js: a entrega, ou a
//   conversa com o aviso do que falta), o peixe lendário e a conversa do sonho da Rosa. Com o presente de hoje (ou os 2 da semana)
//   já dado, ela diz "Já ganhei presente seu essa semana!" e a conversa segue normal.
// - Os gostos moram na tabela das falas (CONVERSAS[id].gostos, falas.js; a T4 os pôs lá); o presente descobre o gosto
//   (Conversas.descobrir; a aba Gente mostra). Os da Ritinha e do Zezinho (as descrições do lápis e da pedra bonita) entram aqui.
// - Os aniversários: CONVERSAS[id].aniversario (estação 0..3, dia 1..28; o ano começa no Outono) e, de quem não tem tabela de
//   falas, PRESENTE.ANIVERSARIO_FORA (o Seu Moreira). O calendário da pensão mostra os da semana (uma linha pequena com o retrato
//   e o bolo). Na véspera, a Rosa lembra no café (um aviso; o da Rosa, o Tio Juca lembra): "Amanhã é aniversário da Dona Zélia,
//   viu? Ela ama flor do mato." E vira assunto: o tópico `aniversario_<id>` (um marco do topicos.js, na véspera e no dia), que ela e
//   mais 3 vizinhos comentam uma vez. Informa, não manda (vivência, não missões).
// - A 1ª vez: no aniversário de alguém que está no mapa, com algo para dar na mochila, a seta aponta a pessoa ("presente_vez") e,
//   na tela, o presente na barra; o 1º presente dado explica a regra numa frase. Some depois do 1º presente.
// Nada desenhado por código: o balão é a arte a/fx (coracao, desgosto, raiva), o retrato e o bolo (salao/bolo_festa) são artes prontas.

const PRESENTE = {
  POR_SEMANA: 2,
  BALAO_MS: 2400,
  // O balão de cada gosto (o neutro não tem: no Stardew também não). DECISÃO (T5, revisão): o odiado mostra a `raiva`, e não o
  // `desgosto` que a seção 5 da spec pedia para os dois. A seção 5 foi escrita antes da arte fx/raiva existir (T8), e a 1.2 diz que
  // o Stardew mostra o balão de raiva no presente odiado. O "não gosta" fica com o desgosto.
  // E o ×5 do aniversário vale também no presente ruim (−50 e −100), como o ×8 do Stardew, que multiplica o odiado no aniversário.
  BALAO: { ama: 'coracao', gosta: 'coracao', naoGosta: 'desgosto', odeia: 'raiva' },
  // A pergunta antes de dar ("Dar 1 marmita de presente para o Mestre Bira?"). No Stardew o presente sai direto; aqui também, menos:
  // no 1º presente (ensina), quando o item faz falta a um pedido aceito, na comida pronta (o prato, a marmita, o peixe frito...) e no
  // item raro (o lendário, o do museu, o cristal, as peças das histórias), que não se perde por um clique errado.
  COMIDA_PRONTA: ['marmita', 'moqueca', 'cocada', 'suco_caju', 'goiabada', 'caldo_caranguejo', 'peixe_frito', 'quentao', 'pamonha', 'bolo', 'rabanada', 'panetone', 'pao'],
  RAROS: ['cristal', 'crucifixo_prata', 'fita_azul', 'barra_aco', 'barra_bronze', 'caderno_via', 'viola_juca', 'maquete_casinha', 'maquete_predio', 'maquete_escritorio', 'taca_dividida', 'muda_roseira'],
  // A cena em que a Marisa se muda para a Vila (o Z4 da spec 8.4, a de 8 corações; o arco é da T12: se o id for outro, trocar aqui).
  // Antes dela, a Zélia fala da filha na capital (por carta); depois, as falas ficam neutras.
  MARISA_NA_VILA: 'zelia_8',
  // o gosto da tabela (Conversas.GOSTOS) → a chave dos pontos (Amizade.PONTOS.presente)
  PONTO: { ama: 'ama', gosta: 'gosta', neutro: 'neutro', naoGosta: 'nao_gosta', odeia: 'odeia' },
  // quem faz aniversário e não tem tabela de falas (o Seu Moreira conversa pela proposta do mestre)
  ANIVERSARIO_FORA: { santos: [3, 22] },
  // as crianças não estão na tabela da seção 5; as descrições dos itens já dizem ("O Zezinho coleciona", "Presente para a Ritinha")
  GOSTOS_CRIANCAS: {
    zezinho: { ama: ['pedra_bonita', 'confete'], gosta: ['cocada', 'caju', 'goiaba'], naoGosta: ['couve'], odeia: [] },
    ritinha: { ama: ['lapis', 'mascara'], gosta: ['cocada', 'flor', 'boneca_pano'], naoGosta: [], odeia: [] },
  },
};
function marisaNaVila() { return typeof Historias !== 'undefined' && typeof Historias.viu === 'function' && !!Historias.viu(PRESENTE.MARISA_NA_VILA); }
for (const id in PRESENTE.GOSTOS_CRIANCAS) if (typeof CONVERSAS !== 'undefined' && CONVERSAS[id] && !CONVERSAS[id].gostos) CONVERSAS[id].gostos = PRESENTE.GOSTOS_CRIANCAS[id];

// As falas de reação. A ordem do Stardew: o item exato, depois o gosto, depois a genérica (PRESENTE_FALAS._). {item} = o nome do
// item; {obrigado} = obrigado/obrigada. A página pode ter a @emoção (só troca o retrato; a que não tem arte volta ao normal).
const PRESENTE_FALAS = {
  _: {
    ama: '@alegre Que maravilha, Jocelino! {Obrigado} mesmo!', gosta: '@alegre {Obrigado}, Jocelino! Gostei.', neutro: 'Ora, {obrigado}, Jocelino.',
    naoGosta: 'Hum... {obrigado}, Jocelino.', odeia: '@bravo Isso não, Jocelino!',
    aniversario: '@alegre Lembrou do meu aniversário? Muito {obrigado}, Jocelino!', aniversarioRuim: 'Mas {obrigado} por lembrar do meu aniversário.',
    hoje: '@alegre Hoje você já me deu presente, Jocelino!', semana: '@alegre Já ganhei presente seu essa semana, Jocelino!',
  },
  rosa: {
    item: { sucata_aco: '@bravo Isso é lixo, Jocelino! Sucata de aço é pro Seu Tonico, não pra sua mulher.',
      flor: '@amorosa Uma flor do mato... Você ainda lembra do que eu gosto, né, amor?',
      pedra_bonita: '@alegre Que pedra bonita! Vou pôr na janela, junto da coleção do Zezinho.',
      caju: '@alegre Caju! Cheirinho de Aracaju... Vou fazer um suco pra gente.' },
    ama: '@amorosa Ai, Jocelino... Você sabe mesmo me agradar.', gosta: '@alegre Que bom, meu bem! Isso vai pra panela hoje mesmo.',
    neutro: 'Obrigada, amor. Vou achar um lugar pra isso.', naoGosta: '@pensativo Hum... Obrigada, amor. A intenção é que vale.', odeia: '@bravo Jocelino, isso é lixo!',
    aniversario: '@emocionada Você lembrou do meu aniversário... Vou guardar no meu caderno, viu? Pra nunca esquecer.',
    aniversarioRuim: '@amorosa Mas você lembrou do meu dia. Isso eu guardo no caderno.',
    hoje: '@alegre Hoje você já me deu presente, amor. Guarda pra amanhã!',
  },
  juca: {
    item: { flor: '@pensativo Flor, rapaz? Flor é pra Zélia. Mas tá bom, eu ponho num copo d\'água.',
      cafe: '@alegre Um cafezinho! Senta aí que a gente toma junto.',
      cachimbo: '@surpreso Um cachimbo entalhado! Igual o do meu pai. Vai pra estante, de enfeite.',
      mandioca: '@alegre Mandioca boa! Vou pedir pra Rosa fazer aquele bolo de aipim.' },
    ama: '@alegre Ô, rapaz! Isso sim é presente de sobrinho.', gosta: '@alegre Obrigado, Jocelino. Isso tem serventia.',
    neutro: 'Hum... Obrigado, rapaz. Vou guardar aqui.', naoGosta: '@pensativo Isso aí, rapaz? Bom... a intenção é que vale.', odeia: '@bravo Rapaz, que é isso? Leva daqui!',
    aniversario: '@alegre Lembrou do aniversário do velho! Você é dos bons, Jocelino.', aniversarioRuim: '@alegre Mas lembrou do aniversário do velho, e isso é o que conta.',
    hoje: '@alegre Hoje você já me agradou, rapaz. Amanhã tem mais prosa.',
  },
  bira: {
    item: { cocada: '@bravo Cocada não, rapaz! Doce gruda no dente, e dente de mestre é ferramenta.',
      marmita: '@alegre Marmita da Rosa! Hoje eu almoço que nem patrão.', cafe: '@alegre Café! É ele que levanta parede, sabia?',
      lapis: '@surpreso Lápis bom de ponta! Tem coisa que a gente só risca no papel... Valeu, rapaz.', madeira: '@alegre Madeira boa! Na obra nada se perde.' },
    ama: '@alegre Isso é que é presente, rapaz!', gosta: '@alegre Serve sim, rapaz. Obrigado.', neutro: 'Hm. Valeu, rapaz.',
    naoGosta: '@pensativo Isso aí? Bom... valeu a lembrança.', odeia: '@bravo Isso não, rapaz!',
    aniversario: '@surpreso Lembrou do meu aniversário, rapaz? Vou contar pra peãozada inteira!',
    hoje: '@alegre Hoje já ganhei o meu, rapaz. Agora é serviço!', semana: '@alegre Já ganhei presente seu essa semana, rapaz. Assim você me acostuma mal!',
  },
  zelia: {
    item: { flor: '@alegre Ai, que flor linda! Vai direto pro vaso da janela, meu filho.',
      cocada: '@alegre Cocada! Você quer me ver gorda, é? Obrigada, meu filho!',
      pedra: '@pensativo Uma... pedra? Ai, meu filho, pedra eu já tenho demais no quintal.',
      sardinha: '@pensativo Sardinha? Ai, o cheiro fica na casa inteira...',
      ferro_velho: '@bravo Ferro velho, meu filho?! Leva isso daqui antes que enferruje a minha calçada!' },
    ama: '@alegre Ai, que amor de rapaz!', gosta: '@alegre Que gentileza, meu filho! Obrigada.', neutro: 'Obrigada, meu filho. Você é um amor.',
    naoGosta: '@pensativo Hum... Obrigada, meu filho.', odeia: '@bravo Ai, meu filho, isso não!',
    aniversario: () => marisaNaVila() ? '@alegre Lembrou do meu aniversário! Ai, meu filho, que alegria!' : '@alegre Lembrou do meu aniversário! Ai, meu filho, vou contar pra Marisa na carta!',
    hoje: '@alegre Hoje você já me mimou, meu filho!', semana: '@alegre Já ganhei presente seu essa semana, meu filho!',
  },
  ze: {
    item: { quentao: '@alegre Quentão! Esse esquenta a voz pro samba, parceiro.', pamonha: '@alegre Pamonha! Igualzinha a da minha mãe.',
      pedra: '@pensativo Pedra, Jocelino? Já carrego o dia todo, rapaz!' },
    ama: '@alegre Opa! Isso é coisa fina, parceiro!', gosta: '@alegre Opa! Obrigado, Jocelino.', neutro: 'Valeu, parceiro.',
    naoGosta: '@pensativo Isso aí, parceiro? Bom... valeu.', odeia: '@bravo Isso não, parceiro!',
    aniversario: '@alegre Lembrou do meu aniversário! Hoje eu canto um samba pra você na masseira!',
    hoje: '@alegre Hoje já ganhei o meu, parceiro!', semana: '@alegre Já ganhei presente seu essa semana, parceiro! Assim eu fico mal-acostumado.',
  },
  lourival: {
    item: { caranguejo: '@alegre Caranguejo dos bons! Hoje tem caldo lá em casa, compadre.',
      cachimbo: '@surpreso Um cachimbo entalhado! Igual o do meu avô pescador. Vai pra parede do rancho.',
      peixe_frito: '@bravo Peixe frito comprado, compadre? Peixe frito eu frito o meu!' },
    ama: '@alegre Isso é presente de pescador, compadre!', gosta: '@alegre Obrigado, compadre!', neutro: 'Hum. Valeu, compadre.',
    naoGosta: '@pensativo Isso aí, compadre? Bom... obrigado.', odeia: '@bravo Isso não, compadre!',
    aniversario: '@alegre Lembrou do aniversário do velho pescador! Isso vale mais que rede cheia, compadre.',
    hoje: '@alegre Hoje já ganhei, compadre. O mar não dá dois peixes no mesmo anzol!', semana: '@alegre Já ganhei presente seu essa semana, compadre!',
  },
  ritinha: {
    item: { lapis: '@alegre Lápis de cor! Vou desenhar a pensão inteirinha, pai!', mascara: '@alegre Uma máscara! Vou assustar o Zezinho!' },
    ama: '@alegre Pai, eu amei!', gosta: '@alegre Obrigada, pai!', neutro: 'Obrigada, pai.', naoGosta: 'Hum... Obrigada, pai.', odeia: 'Pai, isso não!',
    aniversario: '@alegre Você lembrou, pai! Vou guardar na minha caixinha de tesouros.', aniversarioRuim: '@alegre Mas você lembrou do meu aniversário, pai!',
    hoje: '@alegre Hoje você já me deu presente, pai!',
  },
  zezinho: {
    item: { pedra_bonita: '@alegre Uma pedra bonita! Vai pra minha coleção, pai!', confete: '@alegre Confete! Vou jogar no Caramelo!',
      couve: 'Couve, pai? Isso é comida de gente grande...' },
    ama: '@alegre Oba! Valeu, pai!', gosta: '@alegre Valeu, pai!', neutro: 'Valeu, pai.', naoGosta: 'Hum... Valeu, pai.', odeia: 'Eca, pai!',
    aniversario: '@alegre É meu aniversário e você lembrou! Vou correr mostrar pro Caramelo!', aniversarioRuim: '@alegre Mas você lembrou do meu aniversário, pai!',
    hoje: '@alegre Hoje você já me deu presente, pai!',
  },
};
// O que cada um diz no dia do aniversário (a regra 3 do motor de falas: na frente das falas do dia a dia, abaixo do tópico).
const PRESENTE_FALA_ANIVERSARIO = {
  rosa: ['@alegre Hoje é meu aniversário, amor! Trinta e poucos... e o resto é segredo.'],
  juca: ['@alegre Mais um ano, rapaz! Aniversário bom é com a família inteira no quintal.'],
  ritinha: ['@alegre Pai! Hoje é meu aniversário! Já fiz a conta: faltam poucos anos pros quinze!'],
  zezinho: ['@alegre Pai, hoje é meu aniversário! O Caramelo já sabe!'],
  bira: ['@alegre Hoje o mestre tá de aniversário, rapaz. Mas a massa não sabe disso: vamos ao serviço!'],
  zelia: () => [marisaNaVila() ? '@alegre Hoje é meu aniversário, meu filho! À noite tem bolo lá em casa.' : '@alegre Hoje é meu aniversário, meu filho! Chegou carta da Marisa, lá da capital.'],
  ze: ['@alegre Aniversário hoje, parceiro! Vou cantar até a massa ficar no ponto.'],
  lourival: ['@alegre Hoje faço anos, compadre! O mar até amanheceu mais calmo.'],
  ananias: ['@alegre Hoje é meu aniversário, Jocelino. No depósito, o freguês que lembrar ganha um cafezinho.'],
  tonico: ['@alegre Aniversário hoje, rapaz. Na ferraria a gente comemora batendo ferro.'],
};

const Presentes = {
  // ---------- quem, quando e o quê ----------
  semana(d = G.dia) { return Math.floor(((d || 1) - 1) / 7); },   // 0 = a 1ª semana (o dia 1 é uma segunda)
  estacao(d = G.dia) { return Math.floor(((d || 1) - 1) / 28) % 4; },
  noEstacao(d = G.dia) { return ((d || 1) - 1) % 28 + 1; },
  // [estação, dia] do aniversário (ou null)
  aniversario(id) { const C = typeof CONVERSAS !== 'undefined' && CONVERSAS[id]; return (C && C.aniversario) || PRESENTE.ANIVERSARIO_FORA[id] || null; },
  aniversarioEm(id, d = G.dia) { const a = Presentes.aniversario(id); return !!a && a[0] === Presentes.estacao(d) && a[1] === Presentes.noEstacao(d); },
  // Todos que fazem aniversário (as tabelas de falas e os de fora).
  aniversariantes() {
    const ids = [];
    if (typeof CONVERSAS !== 'undefined') for (const id in CONVERSAS) if (CONVERSAS[id] && CONVERSAS[id].aniversario) ids.push(id);
    for (const id in PRESENTE.ANIVERSARIO_FORA) if (!ids.includes(id)) ids.push(id);
    return ids;
  },
  // Quem faz aniversário no dia d: [{ id, nome }] (o calendário, a véspera).
  noDia(d) { return Presentes.aniversariantes().filter(id => Presentes.aniversarioEm(id, d)).map(id => ({ id, nome: Presentes.nome(id) })); },
  nome(id) { const C = typeof CONVERSAS !== 'undefined' && CONVERSAS[id]; return typeof Amizade !== 'undefined' ? Amizade.nome(id) : (C && C.nome) || id; },
  ehDona(id) { const n = Presentes.nome(id); return /^Dona /.test(n) || ['rosa', 'ritinha', 'lurdes', 'neide', 'tonha', 'rosinete', 'marisa', 'zefa'].includes(id); },
  artigo(id) { return (typeof RECADO_ARTIGO !== 'undefined' && RECADO_ARTIGO[id]) || (Presentes.ehDona(id) ? 'a' : 'o'); },
  para(id) { return `para ${Presentes.artigo(id)} ${Presentes.nome(id)}`; },                   // "para a Dona Zélia"
  da(id) { return (Presentes.artigo(id) === 'a' ? 'da ' : 'do ') + Presentes.nome(id); },      // "da Dona Zélia", "do Zé"
  // "flor do mato", "marmita da Rosa" (o nome do item com a 1ª letra minúscula)
  nomeItem(item) { const n = typeof Itens !== 'undefined' ? Itens.nome(item) : item; return n.charAt(0).toLowerCase() + n.slice(1); },
  retrato(id) { return 'retratos/' + id + '_normal'; },
  temRetrato(id) { return typeof ARTE_LISTA === 'undefined' || ARTE_LISTA.includes(Presentes.retrato(id)); },
  // Quem recebe presente: a família e o povo da Vila que tem retrato (o cachorro, o Viajante e os banhistas da praia, não). Devolve o
  // id da amizade ('' se não recebe).
  recebe(p) {
    if (!p || p.banhista || typeof Amizade === 'undefined') return '';
    const id = Amizade.idDe(p);
    return id && (Amizade.familia(id) || Amizade.daVila(id)) && Presentes.temRetrato(id) ? id : '';
  },
  // O que se dá: o item comum (não a ferramenta, não o que se coloca no chão: baú, cerca, forja).
  presenteavel(item) { return !!item && typeof Itens !== 'undefined' && Itens.existe(item) && !Itens.ehFerramenta(item) && !Itens.colocavel(item); },
  // 'ama' | 'gosta' | 'neutro' | 'naoGosta' | 'odeia' (a tabela das falas; Conversas.gosto)
  gosto(id, item) {
    if (typeof Conversas !== 'undefined' && typeof Conversas.gosto === 'function') return Conversas.gosto(id, item);
    const g = (typeof CONVERSAS !== 'undefined' && CONVERSAS[id] && CONVERSAS[id].gostos) || {};
    return ['ama', 'gosta', 'naoGosta', 'odeia'].find(k => (g[k] || []).includes(item)) || 'neutro';
  },
  // Os pontos de amizade do presente (antes da Lábia): o gosto, ×5 no aniversário. A família: 0 (sem número).
  pontos(id, item, aniv = Presentes.aniversarioEm(id)) {
    if (typeof Amizade === 'undefined' || !Amizade.daVila(id)) return 0;
    const v = Amizade.PONTOS.presente[PRESENTE.PONTO[Presentes.gosto(id, item)]] || 0;
    return aniv ? v * Amizade.PONTOS.aniversario : v;
  },

  // ---------- os limites ----------
  _reg(id) { return (G.presentes && G.presentes.por && G.presentes.por[id]) || null; },
  deuHoje(id) { const r = Presentes._reg(id); return !!r && r.dia === G.dia; },
  naSemana(id) { const r = Presentes._reg(id); return r && r.semana === Presentes.semana() ? r.n : 0; },   // (a aba Gente: as 2 caixinhas)
  // '' = pode dar; 'hoje' = já deu hoje; 'semana' = já deu os 2 da semana (o povo da Vila; no aniversário sempre pode).
  pode(id) {
    if (Presentes.deuHoje(id)) return 'hoje';
    if (typeof Amizade !== 'undefined' && Amizade.familia(id)) return '';
    if (Presentes.aniversarioEm(id)) return '';
    return Presentes.naSemana(id) >= PRESENTE.POR_SEMANA ? 'semana' : '';
  },
  // Lembrou do aniversário (deu presente no dia) neste ano? (a aba Gente)
  lembrou(id) { const a = G.presentes && G.presentes.aniv && G.presentes.aniv[id]; return !!a && a === Math.floor(((G.dia || 1) - 1) / 112) + 1; },

  // ---------- dar ----------
  // A regra pura: tira 1 item da mochila, conta o limite, dá a amizade (a Vila), descobre o gosto. Devolve
  // { ok, gosto, pontos, aniversario, paginas, balao } (ok false com o motivo: 'hoje', 'semana', 'item', 'quem').
  dar(id, item) {
    if (!id) return { ok: false, motivo: 'quem' };
    if (!Presentes.presenteavel(item) || !G.mochila || G.mochila.total(item) < 1) return { ok: false, motivo: 'item' };
    const nao = Presentes.pode(id); if (nao) return { ok: false, motivo: nao };
    const aniv = Presentes.aniversarioEm(id), gosto = Presentes.gosto(id, item);
    G.mochila.remover(item, 1);
    const P = G.presentes || (G.presentes = { por: {}, total: 0, aniv: {} }), r = P.por[id], sem = Presentes.semana();
    P.por[id] = { dia: G.dia, semana: sem, n: (r && r.semana === sem ? r.n : 0) + 1 };
    P.total = (P.total || 0) + 1;
    if (aniv) (P.aniv || (P.aniv = {}))[id] = Math.floor((G.dia - 1) / 112) + 1;
    const pontos = typeof Amizade !== 'undefined' ? Amizade.ganhar(id, Presentes.pontos(id, item, aniv), 'presente') : 0;
    const novo = typeof Conversas !== 'undefined' && typeof Conversas.descobrir === 'function' ? Conversas.descobrir(id, item) : false;
    return { ok: true, gosto, pontos, aniversario: aniv, descobriu: novo, paginas: Presentes.paginas(id, item, gosto, aniv), balao: PRESENTE.BALAO[gosto] || '' };
  },
  // As páginas da reação: a do item (ou do gosto, ou a genérica) e, no aniversário, a do aniversário.
  paginas(id, item, gosto, aniv) {
    const F = PRESENTE_FALAS[id] || {}, _ = PRESENTE_FALAS._, ruim = gosto === 'naoGosta' || gosto === 'odeia';
    const pega = k => F[k] || _[k];
    const pgs = [(F.item && F.item[item]) || pega(gosto)];
    if (aniv) pgs.push(pega(ruim ? 'aniversarioRuim' : 'aniversario'));
    return pgs.map(t => Presentes._troca(t, id, item));
  },
  _troca(t, id, item) {
    const a = Presentes.artigo(id) === 'a';
    if (typeof t === 'function') t = t();   // (a fala que depende do jogo: a Zélia antes e depois da Marisa se mudar)
    return String(t).replace(/\{item\}/g, Presentes.nomeItem(item)).replace(/\{obrigado\}/g, a ? 'obrigada' : 'obrigado').replace(/\{Obrigado\}/g, a ? 'Obrigada' : 'Obrigado');
  },
  // A frase de quem já ganhou (hoje ou os 2 da semana).
  jaGanhou(id, motivo) { const F = PRESENTE_FALAS[id] || {}; return Presentes._troca(F[motivo] || PRESENTE_FALAS._[motivo] || PRESENTE_FALAS._.hoje, id, ''); },

  // ---------- na tela ----------
  _pulado: null,
  // Sem o presente: a conversa de sempre (o "Agora não" e quem já ganhou).
  conversaSem(p) { Presentes._pulado = p; try { conversar(p); } finally { Presentes._pulado = null; } },
  // O que vem na frente do presente: o recado aceito da pessoa com esse item; na Rosa, o peixe lendário e a conversa do sonho.
  cede(p, item) {
    if (typeof recadoComItem === 'function' && recadoComItem(p, item)) return true;
    if (typeof QUIM !== 'undefined' && p.id === QUIM.ID && item === 'cipo') return true;   // (os cipós que o Nhô Quim pediu: serra_jogo.js)
    if (p.id === 'rosa') {
      if (typeof LENDARIOS !== 'undefined' && G.mochila && Object.keys(LENDARIOS).some(k => G.mochila.total(k) > 0)) return true;
      if (G.lojinha && G.lojinha.sonho && !G.lojinha.conversou) return true;
    }
    return false;
  },
  // O gancho da conversa (o primeiro de todos: o presente não conta como a conversa do dia). true = tomou o clique.
  antesDeConversar(p) {
    if (!p || p === Presentes._pulado || typeof itemDaMao !== 'function') return false;
    if (Presentes._reacao) return true;   // (a batida do balão: o clique de novo não abre nada por cima da reação)
    const item = itemDaMao(); if (!Presentes.presenteavel(item)) return false;
    const id = Presentes.recebe(p); if (!id) return false;
    if ((typeof noPalco === 'function' && noPalco()) || G.turno) return false;   // (no salão da pensão, o restaurante manda)
    if (Presentes.cede(p, item)) return false;
    const nao = Presentes.pode(id);
    if (nao) { abrirConversa(Presentes.nome(id), urlArte(Presentes.retrato(id)), [Presentes.jaGanhou(id, nao)], () => Presentes.conversaSem(p)); return true; }
    const um = `1 ${Presentes.nomeItem(item)}`, falta = typeof recadoOutrosPedidos === 'function' ? recadoOutrosPedidos(item, 1) : null;
    // (revisão da T5) como no Stardew, o presente sai direto; a pergunta só no 1º presente, no item que faz falta a um pedido aceito,
    // na comida pronta e no item raro (PRESENTE.COMIDA_PRONTA, PRESENTE.RAROS)
    if (!falta && !Presentes.perguntaAntes(item)) { Presentes.entregar(p, id, item); return true; }
    const texto = falta ? `Você vai precisar de ${falta}. Dar ${um} de presente ${Presentes.para(id)} mesmo assim?` : `Dar ${um} de presente ${Presentes.para(id)}?`;
    perguntar(texto, ['Dar', 'Agora não'], i => { if (i === 0) Presentes.entregar(p, id, item); else Presentes.conversaSem(p); });
    return true;
  },
  // Pergunta antes de dar? O 1º presente de todos; a comida pronta (o prato da pensão, a marmita...); o raro (o lendário, o do museu,
  // o cristal, as peças das histórias). (O item que faz falta a um pedido aceito também pergunta: o antesDeConversar confere.)
  raro(item) {
    return PRESENTE.RAROS.includes(item) || (typeof LENDARIOS !== 'undefined' && item in LENDARIOS)
      || (typeof Itens !== 'undefined' && /Museu/.test(Itens.descricao(item)));
  },
  perguntaAntes(item) {
    return !(G.limpou && G.limpou.presente) || PRESENTE.COMIDA_PRONTA.includes(item) || /^prato_/.test(item) || Presentes.raro(item);
  },
  // Dá e mostra: o balão em cima da cabeça primeiro (a placa da conversa fica no meio da tela e cobriria a pessoa), depois de uma
  // batida curta a fala com o retrato e, no 1º presente, a frase da regra. Como no Stardew: o coração sobe e ela fala.
  BATIDA_MS: 700,
  _reacao: null,
  entregar(p, id, item) {
    const r = Presentes.dar(id, item);
    if (!r.ok) { if (r.motivo === 'hoje' || r.motivo === 'semana') abrirConversa(Presentes.nome(id), urlArte(Presentes.retrato(id)), [Presentes.jaGanhou(id, r.motivo)]); return r; }
    const ag = performance.now(), batida = r.balao && p ? Presentes.BATIDA_MS : 0;
    if (batida) p._balaoH = { nome: r.balao, de: ag, ate: ag + batida + PRESENTE.BALAO_MS };
    if (typeof sons !== 'undefined') sons.tocar(r.balao === 'coracao' ? 'feito_1' : 'pegar', 1, 0.05, -6);
    if (typeof hudSujo === 'function') hudSujo();
    if (Array.isArray(G.feitosHoje) && r.aniversario) G.feitosHoje.push(`Presente de aniversário ${Presentes.para(id)}: ${Presentes.nomeItem(item)}.`);
    const primeiro = !!G.limpou && !G.limpou.presente;
    if (G.limpou) G.limpou.presente = (G.limpou.presente || 0) + 1;
    if (typeof _setaT !== 'undefined') _setaT = NaN;   // (a seta da 1ª vez some já: o jogo pausa na fala e a seta guardada ficaria)
    const fim = () => { if (primeiro) avisar(typeof Amizade !== 'undefined' && Amizade.familia(id)
      ? 'Presente dado! Para a família, um por dia. O que cada um gosta fica anotado; no aniversário, a reação é especial.'
      : 'Presente dado! Cada vizinho aceita um por dia e dois por semana; no aniversário vale cinco vezes mais. O que cada um gosta fica anotado.'); };
    Presentes._reacao = { quando: ag + batida, id, paginas: r.paginas, fim };
    if (!batida) Presentes.reagir();
    return r;
  },
  // A fala da reação (depois da batida, com a tela livre: se outra janela abriu no meio, ela espera).
  reagir() {
    const R = Presentes._reacao; if (!R) return false;
    Presentes._reacao = null;
    abrirConversa(Presentes.nome(R.id), urlArte(Presentes.retrato(R.id)), R.paginas, R.fim);
    return true;
  },

  // ---------- a véspera: a Rosa lembra no café ----------
  // O texto da Rosa (o da Rosa, quem lembra é o Tio Juca): "Amanhã é aniversário da Dona Zélia, viu? Ela ama flor do mato."
  quemLembra(id) { return id === 'rosa' ? 'juca' : 'rosa'; },
  amado(id) { const g = (typeof CONVERSAS !== 'undefined' && CONVERSAS[id] && CONVERSAS[id].gostos) || {}; return (g.ama || [])[0] || ''; },
  textoVespera(id, hoje = false) {
    const ama = Presentes.amado(id), ele = Presentes.artigo(id) === 'a' ? 'Ela' : 'Ele';
    const chama = Presentes.quemLembra(id) === 'juca' ? 'rapaz!' : 'viu?';
    const nome = id === 'rosa' ? 'da Rosa' : Presentes.da(id);
    return `${hoje ? 'Hoje' : 'Amanhã'} é aniversário ${nome}, ${chama} ` + (ama ? `${ele} ama ${Presentes.nomeItem(ama)}.` : 'Qualquer lembrancinha alegra.');
  },
  // Quantas vésperas do aniversário já chegaram até o dia d (um número que só sobe: o marco do tópico, topicos.js).
  vesperas(id, d = G.dia) {
    const a = Presentes.aniversario(id); if (!a) return 0;
    const vespera = a[0] * 28 + a[1] - 1;   // (no 1º ano; o ano tem 112 dias)
    return vespera >= 1 && d >= vespera ? Math.floor((d - vespera) / 112) + 1 : 0;
  },
  _lembrete: null,
  // De manhã: a Rosa lembra no café quem faz aniversário amanhã (o aviso sai quando a tela fica livre). O tópico da conversa é o
  // marco `aniversario_<id>` do topicos.js (lá embaixo).
  manha() {
    Presentes._lembrete = null;
    const am = Presentes.noDia(G.dia + 1); if (!am.length) return;
    const a = am[0], quem = Presentes.quemLembra(a.id) === 'juca' ? 'Tio Juca' : 'Rosa';
    Presentes._lembrete = { id: a.id, texto: `${quem}, no café: "${Presentes.textoVespera(a.id)}"` };
  },
  mostrarLembrete() {
    const L = Presentes._lembrete; if (!L) return false;
    Presentes._lembrete = null;
    avisar(L.texto);
    const ama = Presentes.amado(L.id);
    if (ama && typeof Conversas !== 'undefined' && typeof Conversas.descobrir === 'function') Conversas.descobrir(L.id, ama);
    return true;
  },

  // ---------- o save ----------
  iniciar(s) {
    const P = s.presentes || {};
    G.presentes = { por: {}, total: P.total || 0, aniv: Object.assign({}, P.aniv || {}) };
    for (const k in P.por || {}) G.presentes.por[k] = Object.assign({}, P.por[k]);
    Presentes._lembrete = null; Presentes._reacao = null;
  },
  salvar(s) {
    const P = G.presentes || {};
    s.presentes = { por: {}, total: P.total || 0, aniv: Object.assign({}, P.aniv || {}) };
    for (const k in P.por || {}) s.presentes.por[k] = Object.assign({}, P.por[k]);
  },
};
INICIADORES.push(s => Presentes.iniciar(s));
COLETORES.push(s => Presentes.salvar(s));
// O presente vem antes de todos os ganchos da conversa (e não conta como a conversa do dia); cede ao recado e às coisas da Rosa.
ANTES_DE_CONVERSAR.unshift(p => { try { return Presentes.antesDeConversar(p); } catch (e) { console.error(e); return false; } });
MANHA.push(() => Presentes.manha());
ATUALIZADORES.push(() => {
  if (Presentes._reacao && !menuAberto() && performance.now() >= Presentes._reacao.quando) Presentes.reagir();
  if (Presentes._lembrete && G.comecou && !menuAberto()) Presentes.mostrarLembrete();
});

// O tópico da véspera (os Conversation Topics do Stardew, topicos.js): o marco `aniversario_<id>` sobe na véspera e abre o tópico por
// 2 dias (a véspera e o dia). Quem lembra (a Rosa; o da Rosa, o Tio Juca) dá a dica do gosto; mais 3 vizinhos comentam, cada um no tom
// dele (um tópico é assunto da Vila: a regra da T4, 4 pessoas ou mais). Cada um comenta uma vez: "Amanhã é..." ou, no dia, "Hoje é...".
// Quem faz aniversário não comenta o próprio. E a fala do dia do aniversário (a regra 3 do motor de falas).
// (revisão da T5) 2 ou 3 jeitos de cada um, escolhidos pelo aniversariante (o mesmo aniversário, a mesma fala; outro, outra). O jeito
// que dá a dica do gosto (x.gosto: algo que a pessoa gosta) só vale para quem tem gosto na tabela; sem ele, vale o 1º jeito.
const PRESENTE_COMENTAM = {
  juca: [(Q, x) => `${Q} é aniversário ${x.da}, rapaz. Aniversário na Vila é abraço na porta e bolo na mesa.`,
    (Q, x) => x.gosto && `${Q} é aniversário ${x.da}, rapaz. Já vi ${x.ele} de olho em ${x.gosto} na feira...`,
    (Q, x) => `${Q} ${x.o} faz anos, rapaz. No meu tempo, aniversário era sanfona até de madrugada.`],
  zelia: [(Q, x) => `${Q} é aniversário ${x.da}, meu filho! Eu já separei uma toalhinha de crochê.`,
    (Q, x) => x.gosto && `${Q} é aniversário ${x.da}, meu filho! Cá entre nós: ${x.gosto} sempre agrada.`,
    (Q, x) => `${Q} ${x.o} faz anos, meu filho. Vou fazer um bolo de fubá pra levar.`],
  bira: [(Q, x) => `${Q} ${x.o} faz anos, rapaz. Merece um parabéns caprichado.`,
    (Q, x) => x.gosto && `${Q} ${x.o} faz anos, rapaz. Leva ${x.gosto} que não tem erro.`],
  ze: [(Q, x) => `${Q} é aniversário ${x.da}! Já tô ensaiando o parabéns em ritmo de samba.`,
    (Q, x) => x.gosto && `${Q} ${x.o} faz anos, parceiro! Dizem que ${x.ele} não recusa ${x.gosto}.`,
    (Q, x) => `${Q} é aniversário ${x.da}! Parabéns cantado na masseira vale dobrado.`],
  lourival: [(Q, x) => `${Q} ${x.o} faz anos, compadre. Aniversário é dia de mesa farta.`,
    (Q, x) => x.gosto && `${Q} ${x.o} faz anos, compadre. Quem leva ${x.gosto} ganha um sorriso.`],
  ananias: [(Q, x) => `${Q} é aniversário ${x.da}. A Vila inteira vai dar os parabéns.`,
    (Q, x) => x.gosto && `${Q} é aniversário ${x.da}. Freguês antigo: ${x.ele} sempre leva ${x.gosto}.`],
  tonico: [(Q, x) => `${Q} ${x.o} faz anos, rapaz. Idade é que nem ferro: com o tempo fica mais forte.`,
    (Q, x) => `${Q} é aniversário ${x.da}. Mais um ano batendo firme, que nem bigorna.`],
};
// A fala de quem comenta o aniversário de `id` (o jeito escolhido pelo id; o da dica sem gosto cai no 1º).
function comentaAniversario(q, id, Q) {
  const g = (typeof CONVERSAS !== 'undefined' && CONVERSAS[id] && CONVERSAS[id].gostos) || {}, gi = (g.gosta || [])[0] || (g.ama || [])[0] || '';
  const x = { da: id === 'rosa' ? 'da Rosa' : Presentes.da(id), o: (Presentes.artigo(id) === 'a' ? 'a ' : 'o ') + Presentes.nome(id),
    ele: Presentes.artigo(id) === 'a' ? 'ela' : 'ele', gosto: gi ? Presentes.nomeItem(gi) : '' };
  let h = 0; for (const c of id) h += c.charCodeAt(0);
  const V = PRESENTE_COMENTAM[q];
  return V[h % V.length](Q, x) || V[0](Q, x);
}
Presentes.aniversariantes().forEach((id, k) => {
  // (só abre se o marco sobe na própria véspera: o save que pula dias, ou o de antes, fica calado, como os outros marcos)
  if (typeof TOPICOS_MARCOS !== 'undefined') TOPICOS_MARCOS.push({ id: 'aniversario_' + id, topico: 'aniversario_' + id, dias: 2,
    valor: () => Presentes.vesperas(id), abre: () => Presentes.aniversarioEm(id, G.dia + 1) });
  const topico = 'aniversario_' + id, lembra = Presentes.quemLembra(id), linha = (quem, fala) => { const C = typeof CONVERSAS !== 'undefined' && CONVERSAS[quem]; if (C && C.linhas) C.linhas.push({ quando: { topico }, fala }); };
  linha(lembra, () => ['@alegre ' + Presentes.textoVespera(id, Presentes.aniversarioEm(id))]);
  const pool = Object.keys(PRESENTE_COMENTAM), outros = pool.slice(k % pool.length).concat(pool.slice(0, k % pool.length)).filter(q => q !== id && q !== lembra).slice(0, 3);
  for (const q of outros) linha(q, () => ['@alegre ' + comentaAniversario(q, id, Presentes.aniversarioEm(id) ? 'Hoje' : 'Amanhã')]);
});
for (const id in PRESENTE_FALA_ANIVERSARIO) {
  const C = typeof CONVERSAS !== 'undefined' && CONVERSAS[id];
  if (C && C.linhas) C.linhas.push({ quando: { aniversario: true }, fala: PRESENTE_FALA_ANIVERSARIO[id] });
}

// ---------- a 1ª vez: a seta na pessoa do aniversário e, na tela, o presente na barra ----------
// O melhor presente da mochila para a pessoa (ama > gosta > neutro; nunca o que ela não gosta).
function presenteBomNaMochila(id) {
  if (!G.mochila) return '';
  const nota = { ama: 3, gosta: 2, neutro: 1 }; let melhor = '', n = 0;
  for (const s of G.mochila.slots) if (s && Presentes.presenteavel(s.id)) { const v = nota[Presentes.gosto(id, s.id)] || 0; if (v > n) { n = v; melhor = s.id; } }
  return melhor;
}
// No aniversário de alguém que está aqui (e ainda sem presente hoje), com algo bom para dar: a seta nela. Só até o 1º presente.
function alvoDoPresente() {
  if (!G.guia || !G.guia.ativo || !G.limpou || G.limpou.presente || !G.mapa || !G.jog || !G.mochila) return null;
  if ((typeof noPalco === 'function' && noPalco()) || (typeof _horaDaJanta === 'function' && _horaDaJanta())) return null;
  for (const m of G.mapa.moradores) {
    if (m.visivel === false || Math.hypot(m.x - G.jog.x, m.y - G.jog.y) > PRESENTE.PERTO * TILE) continue;
    const id = Presentes.recebe(m); if (!id || !Presentes.aniversarioEm(id) || Presentes.pode(id)) continue;
    const item = presenteBomNaMochila(id); if (!item) continue;
    const ele = Presentes.artigo(id) === 'a' ? 'nela' : 'nele';
    return { mapa: G.mapaId, morador: m.id, item, rotuloFixo: `Aniversário ${Presentes.da(id)}! Com ${Presentes.nomeItem(item)} na mão, botão direito ${ele}` };
  }
  return null;
}
// (revisão, a ordem da C3) A seta do presente vem DEPOIS do que se faz na hora e do urgente: a reforma da pensão, a obra (a do dia e a
// do guia), a janta, a 1ª vez de cada passo da casa e da janta, a firma, a Mercearia, o convite da tarde, o serviço e o recado de hoje
// e o Mostrar da Caderneta. Só no lugar do resto (as setas de fundo: o achado, a árvore, a serra) ou sem seta nenhuma, e só com a
// pessoa do aniversário por perto (PRESENTE.PERTO ladrilhos).
const PRESENTE_SETA_CEDE = ['pensao', 'obra_dia', 'obra', 'janta', 'domingo', 'janta_vez', 'reforma_vez', 'casa_vez', 'tela_pedreira', 'aula',
  'rosa_sonho', 'lojinha', 'firma_vez', 'mercearia', 'convite', 'servico', 'recado', 'caderneta'];
PRESENTE.PERTO = 8;
if (typeof guiaSetaMundo === 'function') { const s0 = guiaSetaMundo; guiaSetaMundo = function () {
  const s = s0(); if (s && PRESENTE_SETA_CEDE.includes(s.missao)) return s;
  const a = alvoDoPresente(); if (a) { const sp = _setaDe([['presente_vez', a]]); if (sp) return sp; }
  return s;
}; }
if (typeof guiaSetaUI === 'function') { const u0 = guiaSetaUI; guiaSetaUI = function () {
  const r = u0(); if (r) return r;   // (as outras setas da tela vêm antes; a do presente só com a seta do mundo no presente)
  const sm = typeof setaAgora === 'function' ? setaAgora() : null;
  const a = $('#modal').hidden && sm && sm.missao === 'presente_vez' ? alvoDoPresente() : null;
  if (a && itemDaMao() !== a.item) {
    const i = G.mochila.slots.slice(0, Mochila.BARRA).findIndex(s => s && s.id === a.item), e = i >= 0 && document.querySelectorAll('#hud .barra .espaco')[i];
    if (e) return { chave: 'presente:' + i, el: e, rotulo: 'Clique aqui: ' + Itens.nome(a.item) };
  }
  return null;
}; }
