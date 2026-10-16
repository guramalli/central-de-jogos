// Jocelino — falas.js — o que cada morador diz (de jogo/dados/falas.gd, adaptado à fase 1: a Pensão da Rosa no centro).
// (T2 das conversas) No formato do motor de falas (conversas.js; spec 3.1): cada pessoa tem `linhas`, e vale a de maior prioridade
// que casar (a ordem do Stardew, seção 3.2). As funções de estado de antes viraram linhas com `quando: { se }` (a Rosa da pensão e
// da reforma, o Tio Juca com a pensão aberta, o Lourival na chuva — que continua valendo sempre que chove, como antes, e não só em
// 50% das vezes como a regra `chuva`). As listas sorteadas pelo dia viraram linhas gerais: o empate sorteia pelo dia com a mesma
// conta do _porDia antigo (a linha G.dia % n). O texto é o mesmo de antes; a emoção vai na página (@alegre, @pensativo...) e só
// troca o retrato. Os aniversários são os da seção 5 (a T5 usa).
const _falaEstadoPensao = () => G.pensao ? G.pensao.estado : 'fechada';
const _falaRosaSonho = 'Jocelino... sabe o que eu sonho desde Aracaju? Cozinhar pra fora. Um PF caprichado, uma moqueca de domingo...';
const _falaRosaCotinha = 'A pensão da Dona Cotinha, meu bem! Eu já tô vendo o quadro de giz cheio de prato.';
// (as 5 etapas da reforma) o que a etapa pede, na boca da Rosa
const _FALA_ROSA_ETAPA = { telhado: 'O buraco do telhado primeiro, amor: telha o Seu Ananias vende no depósito.', balcao: 'O balcão e as banquetas: madeira você tira com o machado.',
  cozinha: 'Minha cozinha! Tijolo e cimento pro fogão de alvenaria, o Seu Ananias tem.', pintura: 'Só falta a pintura e o letreiro... tinta tem no depósito.' };
const _falaRosaReforma = () => _falaEstadoPensao() !== 'limpar' && !!ECO.reforma.find(x => x.id === _falaEstadoPensao());
Object.assign(CONVERSAS, {
  rosa: { nome: 'Rosa', aniversario: [1, 12], linhas: [
    { quando: { se: () => _falaEstadoPensao() === 'fechada' && !(G.lojinha && G.lojinha.conversou) }, fala: ['@pensativo ' + _falaRosaSonho, 'Quem sabe aqui na Vila aparece uma oportunidade, né?'] },
    { quando: { se: () => _falaEstadoPensao() === 'fechada' && !!(G.lojinha && G.lojinha.conversou) }, fala: ['@pensativo ' + _falaRosaSonho, '@alegre A lojinha da Dona Cotinha, meu bem... a entrada e ela é nossa!'] },
    { quando: { se: () => _falaEstadoPensao() === 'limpar' }, fala: ['@alegre ' + _falaRosaCotinha, 'Primeiro a limpeza: entulho e mato no chão do salão.'] },
    ...Object.keys(_FALA_ROSA_ETAPA).map(e => ({ quando: { se: () => _falaRosaReforma() && _falaEstadoPensao() === e }, fala: ['@alegre ' + _falaRosaCotinha, _FALA_ROSA_ETAPA[e]] })),
    { quando: { se: () => _falaRosaReforma() && !_FALA_ROSA_ETAPA[_falaEstadoPensao()] }, fala: ['@alegre ' + _falaRosaCotinha, 'Traz o material que eu guardo aqui.'] },
    // (C3, 16/10) pronta no sábado depois das 15h, a inauguração é na segunda (domingo a pensão não abre): a Rosa não diz "amanhã"
    { quando: { se: () => _falaEstadoPensao() === 'pronta' && !(G.pensao.abreDia > G.dia + 1) }, fala: ['@alegre Amanhã a gente abre! Eu não durmo hoje de tanta ansiedade.'] },
    { quando: { se: () => _falaEstadoPensao() === 'pronta' && G.pensao.abreDia > G.dia + 1 }, fala: ['@alegre Segunda a gente abre! Eu não durmo hoje de tanta ansiedade.'] },
    { fala: ['Traz ingrediente pra despensa, viu? Arroz, feijão e ovo o Seu Ananias vende na Mercearia.'] },
    { fala: ['Às cinco da tarde eu acendo o fogão. Não se atrasa!'] },
    { fala: ['@alegre O Severino lambeu o prato ontem, Jocelino. LAMBEU!'] },
  ] },
  juca: { nome: 'Tio Juca', aniversario: [0, 20], linhas: [
    { quando: { se: () => !!G.pensao && G.pensao.estado === 'aberta' }, fala: ['@alegre A pensão da Rosa é o assunto da Vila inteira! Até o Seu Tonico perguntou se tem torresmo.'] },
    { fala: ['O terreno das bandeirinhas tá esperando, rapaz. Vira meio-oficial com o Bira que a gente começa a casa de vocês.', 'Devagar e sempre. Madeira é no machado: galho, toco e árvore. O que sobrar, a caixa de venda leva.'] },
  ] },
  zezinho: { nome: 'Zezinho', aniversario: [3, 15], linhas: [
    { fala: ['@alegre Pai! Pai! Achei uma pedra que parece um sapo!', '...Não, espera. Era um sapo mesmo. Ele fugiu.'] },
    { fala: ['@alegre Quando eu crescer vou ser pedreiro igual o Mestre Bira!'] },
    { fala: ['Aposto que eu quebro mais pedra que o senhor!'] },
  ] },
  ritinha: { nome: 'Ritinha', aniversario: [2, 3], linhas: [
    { fala: ['@alegre Pai, se quiser eu faço as contas da pensão!', 'Doze cruzeiros o PF, vezes dez... dá cento e vinte!'] },
    { fala: ['@alegre Cinco sacos de cimento a doze cruzeiros... dá sessenta! Viu só?'] },
  ] },
  bira: { nome: 'Mestre Bira', aniversario: [2, 7], linhas: [
    { fala: ['A obra da J. Moreira é de sol a sol, rapaz: chegou, trabalhou.', '@alegre E ó: se a sua patroa abrir aquela pensão, a peãozada inteira vai jantar lá!'] },
  ] },
  ze: { nome: 'Zé', aniversario: [3, 2], linhas: [
    { fala: ['Massa boa é igual feijão: nem mole, nem dura.'] },
    { fala: ['Tijolo por tijolo, Jocelino. Pressa só serve pra entortar parede.'] },
  ] },
  zelia: { nome: 'Dona Zélia', aniversario: [0, 9], linhas: [
    { fala: ['Ai, meu filho, cuidado com as minhas plantas, viu?', '@alegre Essa casa é pra minha filha que vem da capital. Capricha!'] },
    { fala: ['@pensativo Dizem que a pensão da Cotinha vai abrir de novo. Que saudade de um caldo verde!'] },
  ] },
  // Depois da conversa, o Ananias abre o depósito (como o Pierre).
  ananias: { nome: 'Seu Ananias', aniversario: [1, 18], depois: () => entrarDeposito(), linhas: [
    { fala: ['@alegre Pois não, freguês? Ananias, às ordens.', 'Telha é dois cruzeiros. E pra pensão da sua patroa eu tenho a Mercearia: arroz, feijão, farinha e ovo.'] },
  ] },
  tonico: { nome: 'Seu Tonico', aniversario: [0, 26], linhas: [
    { fala: ['Ferramenta boa é meio caminho andado. Quando precisar reforçar, me procura.'] },
  ] },
  lourival: { nome: 'Seu Lourival', aniversario: [2, 19], linhas: [
    { quando: { se: () => Conversas.chove() }, fala: ['@alegre Chuva boa, compadre! Com chuva o peixe raro aparece, ainda mais na ponta do píer.', 'Pega a vara e vai pra ponta do píer, compadre.'] },
    { fala: ['O mar hoje tá bom pra tainha... segura firme quando ele puxar!'] },
    { fala: ['Pescador de verdade acorda antes do sol, compadre.', 'O peixe frito da Rosa? Esse eu vendo de olho fechado.'] },
  ] },
});

// O jogo novo: a chegada (a abertura, abertura.js, conta Aracaju, a carta e a viagem; aqui o Tio Juca recebe no quintal). Como
// o Lewis do Stardew: o norte (o terreno é de vocês), o serviço (o Bira paga por dia) e o objeto na mão (as sementes, para a
// necessidade de limpar nascer da semente, e não de uma ordem). 13/10: "a pessoa entra e sabe exatamente do que se trata".
const FALA_CHEGADA = [
  'Ô, Jocelino! Chegou inteiro de Aracaju? Aquele terreno das bandeirinhas, do lado da minha casa, é de vocês. Um dia vocês levantam a casa de vocês ali.',
  'Mas casa não sai do chão sem ofício e sem dinheiro. Dinheiro, por enquanto, vem da Vila: o Mestre Bira paga diária pra servente. Vai lá falar com ele, descendo o caminho; a obra dele é de sol a sol.',
  'O canteiro do lado da casa é a comida da família: planta, rega todo dia e colhe. O que sobrar a Rosa cozinha ou a caixa de venda leva. Toma essas sementes de alface: planta com o botão direito e rega com o regador (o barril enche).',
  'O resto do quintal tá tomado de mato: mato é na foice, pedra na picareta, galho e toco no machado. Quanto mais limpo, mais horta. E a Rosa mandou duas marmitas: botão direito na barra pra comer.',
];
INICIADORES.push(s => { if (!s.boasVindas && !MODO_TESTE.ativo && !/pensao=1/.test(location.search)) setTimeout(() => boasVindas(s), 600); });
function boasVindas(s) {
  s.boasVindas = true;
  if (typeof Conversas !== 'undefined') Conversas.conhecer('juca');   // (a chegada é a apresentação do Tio Juca)
  presentesDaChegada();
  abrirConversa('Tio Juca', urlArte('retratos/juca_alegre'), FALA_CHEGADA);
}
// O que o Tio Juca e a Rosa dão na chegada (o pacote de presente do Stardew: 15 sementes, exatamente o canteiro).
function presentesDaChegada() {
  for (const [id, n] of [['semente_alface', 15], ['marmita', 2]]) { const sobra = G.mochila.adicionar(id, n); if (sobra && typeof soltar === 'function' && G.jog) soltar(id, sobra, G.jog.x, G.jog.y); }
  hudSujo();
}
