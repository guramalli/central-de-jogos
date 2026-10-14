// Jocelino — falas.js — o que cada morador diz (de jogo/dados/falas.gd, adaptado à fase 1: a Pensão da Rosa no centro).
// Uma fala pode ser uma lista de páginas, uma lista de conversas (sorteia uma por dia) ou uma função.

const _porDia = lista => lista[(G.dia + lista.length) % lista.length];
Object.assign(FALAS, {
  juca: () => G.pensao && G.pensao.estado === 'aberta'
    ? ['A pensão da Rosa é o assunto da Vila inteira! Até o Seu Tonico perguntou se tem torresmo.']
    : ['O terreno das bandeirinhas tá esperando, rapaz. Vira meio-oficial com o Bira que a gente começa a casa de vocês.', 'Devagar e sempre. Madeira é no machado: galho, toco e árvore. O que sobrar, a caixa de venda leva.'],
  rosa: () => {
    const e = G.pensao ? G.pensao.estado : 'fechada';
    if (e === 'fechada') return ['Jocelino... sabe o que eu sonho desde Aracaju? Cozinhar pra fora. Um PF caprichado, uma moqueca de domingo...', G.lojinha && G.lojinha.conversou ? 'A lojinha da Dona Cotinha, meu bem... a entrada e ela é nossa!' : 'Quem sabe aqui na Vila aparece uma oportunidade, né?'];
    if (e === 'limpar') return ['A pensão da Dona Cotinha, meu bem! Eu já tô vendo o quadro de giz cheio de prato.', 'Primeiro a limpeza: entulho e mato no chão do salão.'];
    const E = ECO.reforma.find(x => x.id === e);   // (as 5 etapas) o que a etapa pede, na boca da Rosa
    if (E) return ['A pensão da Dona Cotinha, meu bem! Eu já tô vendo o quadro de giz cheio de prato.', {
      telhado: 'O buraco do telhado primeiro, amor: telha o Seu Ananias vende no depósito.', balcao: 'O balcão e as banquetas: madeira você tira com o machado.',
      cozinha: 'Minha cozinha! Tijolo e cimento pro fogão de alvenaria, o Seu Ananias tem.', pintura: 'Só falta a pintura e o letreiro... tinta tem no depósito.' }[e] || 'Traz o material que eu guardo aqui.'];
    if (e === 'pronta') return ['Amanhã a gente abre! Eu não durmo hoje de tanta ansiedade.'];
    return [_porDia(['Traz ingrediente pra despensa, viu? Arroz, feijão e ovo o Seu Ananias vende na Mercearia.', 'Às cinco da tarde eu acendo o fogão. Não se atrasa!', 'O Severino lambeu o prato ontem, Jocelino. LAMBEU!'])];
  },
  zezinho: () => _porDia([['Pai! Pai! Achei uma pedra que parece um sapo!', '...Não, espera. Era um sapo mesmo. Ele fugiu.'], ['Quando eu crescer vou ser pedreiro igual o Mestre Bira!'], ['Aposto que eu quebro mais pedra que o senhor!']]),
  ritinha: () => _porDia([['Pai, se quiser eu faço as contas da pensão!', 'Doze cruzeiros o PF, vezes dez... dá cento e vinte!'], ['Cinco sacos de cimento a doze cruzeiros... dá sessenta! Viu só?']]),
  bira: ['A obra da J. Moreira é de sol a sol, rapaz: chegou, trabalhou.', 'E ó: se a sua patroa abrir aquela pensão, a peãozada inteira vai jantar lá!'],
  ze: () => _porDia([['Massa boa é igual feijão: nem mole, nem dura.'], ['Tijolo por tijolo, Jocelino. Pressa só serve pra entortar parede.']]),
  zelia: () => _porDia([['Ai, meu filho, cuidado com as minhas plantas, viu?', 'Essa casa é pra minha filha que vem da capital. Capricha!'], ['Dizem que a pensão da Cotinha vai abrir de novo. Que saudade de um caldo verde!']]),
  ananias: ['Pois não, freguês? Ananias, às ordens.', 'Telha é dois cruzeiros. E pra pensão da sua patroa eu tenho a Mercearia: arroz, feijão, farinha e ovo.'],
  tonico: ['Ferramenta boa é meio caminho andado. Quando precisar reforçar, me procura.'],
  lourival: () => typeof Clima !== 'undefined' && Clima.chove(G.dia)
    ? ['Chuva boa, compadre! Com chuva o peixe raro aparece, ainda mais na ponta do píer.', 'Pega a vara e vai pra ponta do píer, compadre.']
    : _porDia([['O mar hoje tá bom pra tainha... segura firme quando ele puxar!'], ['Pescador de verdade acorda antes do sol, compadre.', 'O peixe frito da Rosa? Esse eu vendo de olho fechado.']]),
});
// Depois da conversa: o Ananias abre o depósito (como o Pierre).
const FALAS_DEPOIS = { ananias: () => entrarDeposito() };

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
  presentesDaChegada();
  abrirConversa('Tio Juca', urlArte('retratos/juca_alegre'), FALA_CHEGADA);
}
// O que o Tio Juca e a Rosa dão na chegada (o pacote de presente do Stardew: 15 sementes, exatamente o canteiro).
function presentesDaChegada() {
  for (const [id, n] of [['semente_alface', 15], ['marmita', 2]]) { const sobra = G.mochila.adicionar(id, n); if (sobra && typeof soltar === 'function' && G.jog) soltar(id, sobra, G.jog.x, G.jog.y); }
  hudSujo();
}
