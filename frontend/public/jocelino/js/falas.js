// Jocelino — falas.js — o que cada morador diz (de jogo/dados/falas.gd, adaptado à fase 1: a Pensão da Rosa no centro).
// Uma fala pode ser uma lista de páginas, uma lista de conversas (sorteia uma por dia) ou uma função.

const _porDia = lista => lista[(G.dia + lista.length) % lista.length];
Object.assign(FALAS, {
  juca: () => G.pensao && G.pensao.estado === 'aberta'
    ? ['A pensão da Rosa é o assunto da Vila inteira! Até o Seu Tonico perguntou se tem torresmo.']
    : ['Devagar e sempre, rapaz. Madeira é no machado: galho, toco e árvore.', 'O Seu Ananias compra o que sobrar. Dinheiro no bolso nunca é demais.'],
  rosa: () => {
    const e = G.pensao ? G.pensao.estado : 'fechada';
    if (e === 'fechada') return ['Jocelino... sabe o que eu sonho desde Aracaju? Cozinhar pra fora. Um PF caprichado, uma moqueca de domingo...', 'Quem sabe aqui na Vila aparece uma oportunidade, né?'];
    if (e === 'limpar' || e === 'telhas' || e === 'mesas') return ['A pensão da Dona Cotinha, meu bem! Eu já tô vendo o quadro de giz cheio de prato.', 'Telha o Seu Ananias vende. Madeira você tira com o machado.'];
    if (e === 'pronta') return ['Amanhã a gente abre! Eu não durmo hoje de tanta ansiedade.'];
    return [_porDia(['Traz ingrediente pra despensa, viu? Arroz, feijão e ovo o Seu Ananias vende na Mercearia.', 'Às cinco da tarde eu acendo o fogão. Não se atrasa!', 'O Severino lambeu o prato ontem, Jocelino. LAMBEU!'])];
  },
  zezinho: () => _porDia([['Pai! Pai! Achei uma pedra que parece um sapo!', '...Não, espera. Era um sapo mesmo. Ele fugiu.'], ['Quando eu crescer vou ser pedreiro igual o Mestre Bira!'], ['Aposto que eu quebro mais pedra que o senhor!']]),
  ritinha: () => _porDia([['Pai, se quiser eu faço as contas da pensão!', 'Doze cruzeiros o PF, vezes dez... dá cento e vinte!'], ['Cinco sacos de cimento a doze cruzeiros... dá sessenta! Viu só?']]),
  bira: ['Então você é o sobrinho do Juca? A obra da J. Santos é aqui. Por enquanto a turma tá completa, rapaz.', 'Mas ó: se a sua patroa abrir aquela pensão, a peãozada inteira vai jantar lá!'],
  ze: () => _porDia([['Massa boa é igual feijão: nem mole, nem dura.'], ['Tijolo por tijolo, Jocelino. Pressa só serve pra entortar parede.']]),
  zelia: () => _porDia([['Ai, meu filho, cuidado com as minhas plantas, viu?', 'Essa casa é pra minha filha que vem da capital. Capricha!'], ['Dizem que a pensão da Cotinha vai abrir de novo. Que saudade de um caldo verde!']]),
  ananias: ['Pois não, freguês? Ananias, às ordens.', 'Telha é dois cruzeiros. E pra pensão da sua patroa eu tenho a Mercearia: arroz, feijão, farinha e ovo.'],
  tonico: ['Ferramenta boa é meio caminho andado. Quando precisar reforçar, me procura.'],
});
// Depois da conversa: o Ananias abre o depósito (como o Pierre).
const FALAS_DEPOIS = { ananias: () => entrarDeposito() };

// O jogo novo: as boas-vindas do Tio Juca (o primeiro dia do Stardew, com a Pensão da Rosa no horizonte).
INICIADORES.push(s => { if (!s.boasVindas && !/teste=1|pensao=1/.test(location.search)) setTimeout(() => boasVindas(s), 600); });
function boasVindas(s) {
  s.boasVindas = true;
  abrirConversa('Tio Juca', 'a/retratos/juca_alegre.webp', [
    'Ô, Jocelino! Chegou inteiro de Aracaju? Dois dias de ônibus não é brincadeira, não.',
    'A Rosa e as crianças ficam aqui comigo por enquanto. Apertado, mas é de coração.',
    'Ela anda com uma ideia na cabeça: cozinhar pra fora. Diz que o PF dela é o melhor de Sergipe!',
    'Enquanto isso, ajuda aqui no quintal: mato é na foice, pedra na picareta; galho, toco e árvore no machado.',
    'Escolhe a ferramenta na barra lá embaixo (mouse ou números) e clica no que quer limpar. Botão direito conversa e abre as coisas.',
    'A Vila fica descendo o caminho. O Seu Ananias, do depósito, compra o que sobrar e vende de tudo.',
  ]);
}
