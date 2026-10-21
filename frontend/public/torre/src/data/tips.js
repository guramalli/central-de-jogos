// Dicas para quem começa (Obra Viva): aparecem uma vez, no momento certo, com um quadro em volta do ponto da tela.
// t: texto do balão; a: true = dica de ação (só avança clicando no lugar destacado). Nunca dizem qual etapa está
// mais lenta agora: só explicam o que cada sinal e cada número significa (o jogador tira a conclusão).
import { FLAGS } from './flags.js';
export const TIPS = {
  andar: { t: 'Esta é a altura da torre. Cada andar que fica pronto é alugado sozinho e passa a render dinheiro.' },
  dinheiro: { t: 'Seu caixa. Ele sobe com o aluguel dos andares e com o pagamento de cada andar entregue.' },
  relogio: { t: FLAGS.risco ? 'Cada ano da torre tem 365 dias. Embaixo fica a integridade: ventania, chuva, terremoto e outros problemas tiram integridade; se chegar a zero, a torre desaba. Sobreviva ao ano para ganhar Reputação e escolher um prêmio.' : 'Cada obra é um contrato de 365 dias. Quando o prazo vence, a torre entregue aumenta a Reputação da construtora e você começa uma obra nova, mais forte.' },
  melhorias: { t: 'Toque em Melhorias para contratar gente e comprar máquinas.', a: true },
  ramos: { t: 'Cada cor é uma etapa da obra: Fornecimento traz o material, Logística sobe, Mão de obra assenta, Engenharia aumenta o limite de altura e Mercado aumenta a renda.' },
  pedreiro: { t: 'Toque no Pedreiro extra para ver o que ele faz.', a: true },
  efeito: { t: 'Aqui aparece o efeito da compra. "Pedreiros assentando" é o volume de assentamento: quantos tijolos por segundo a equipe coloca na obra.' },
  comprar: { t: 'Compre o pedreiro.', a: true },
  subida: { t: '"Material subindo" é a velocidade de subida: quanto material os elevadores levam até o topo por segundo.' },
  aluguel: { t: '"Renda" mostra quanto a torre rende por segundo. Melhorias do Mercado aumentam o valor do aluguel.' },
  dormindo: { t: 'Pedreiros dormindo 💤 querem dizer que falta material lá em cima: ou chega pouco no térreo, ou os elevadores sobem pouco.' },
  pilha: { t: 'Quando o material empilha no térreo e os serventes ficam esperando, é sinal de que os elevadores não dão conta do que chega.' },
  limite: { t: 'A obra parou: chegou ao limite da fundação. Abra Melhorias e reforce a Fundação, na Engenharia.' },
  contrato: { t: 'Proposta de contrato! Escolha 1 dos 3 bônus. Ele vale até o fim desta obra. Se tocar fora, os cartões ficam guardados no botão Proposta.' },
  fimobra: { t: 'Fim do prazo! Assine o aditivo para ficar mais 365 dias nesta torre, ou aceite o contrato da próxima cidade: a torre é entregue, aumenta a Reputação (a construtora fica mais forte em tudo, para sempre) e continua pagando uma taxa.' },
  gerente: { t: 'Chegou um gerente: ele compra o básico do ramo dele sozinho, com metade da renda. Toque no cartão para ligar ou desligar.' },
};
export const START_SEQ = ['andar', 'dinheiro', 'relogio', 'melhorias'];
export const TREE_SEQ = ['ramos', 'pedreiro', 'efeito', 'comprar'];

// "Como jogar" (página de Início): capturas do jogo em assets/tutorial/N.jpg (tools/tutorial-capturas.mjs)
export const TUTORIAL = FLAGS.risco ? [
  { titulo: 'A torre sobe sozinha', texto: 'Você é dono da Construtora J. Santos. Os operários constroem sozinhos; você decide no que investir. Em cima: o andar, o dinheiro, o ano e o dia (cada ano tem 365 dias) e a integridade da torre.' },
  { titulo: 'Melhorias', texto: 'Toque em Melhorias para abrir a árvore. Fornecimento traz o material, Logística sobe, Mão de obra assenta, Mercado aumenta a renda e Engenharia aumenta o limite e guarda as defesas da torre.' },
  { titulo: 'O efeito de cada compra', texto: 'Ao escolher uma melhoria, o painel mostra o que muda. Nas defesas, mostra quanto dano a ameaça mais forte da sua altura vai fazer agora → depois da compra.' },
  { titulo: 'Leia a obra', texto: 'A obra mostra o que falta: pedreiros dormindo 💤 = falta material lá em cima; material empilhado no térreo = os elevadores não dão conta; fachadas trincadas e quebradas = a integridade está caindo.' },
  { titulo: 'Intempéries', texto: 'Ventania, chuva, terremoto, tsunami, raios e muito mais chegam avisados, com o dano estimado e a defesa que protege. Aviso vermelho com "DERRUBA A TORRE": reforce já. A fiscalização do Ministério do Trabalho embarga a obra se faltar Segurança do trabalho.' },
  { titulo: 'Fim do ano', texto: 'Sobreviveu aos 365 dias? Você ganha Reputação e escolhe 1 de 3 prêmios, que valem até a torre cair e se somam. A integridade que sobrou vira reforço: metade dela soma na integridade máxima do ano seguinte.' },
  { titulo: 'Se a torre cair', texto: 'Os anos ficam mais difíceis e uma hora a torre cai. Aí você escolhe 1 prêmio para guardar e começa uma torre nova com toda a Reputação. Quanto mais alto você chegar, mais forte volta.' },
] : [
  { titulo: 'A obra sobe sozinha', texto: 'Você é dono da Construtora J. Santos. Os operários constroem sozinhos; você decide no que investir. Em cima: o andar, o dinheiro e o dia da obra (o contrato vence no dia 365).' },
  { titulo: 'Melhorias', texto: 'Toque em Melhorias para abrir a árvore. Cada cor é uma etapa: Fornecimento traz o material, Logística sobe, Mão de obra assenta, Engenharia aumenta o limite e Mercado aumenta a renda.' },
  { titulo: 'O efeito de cada compra', texto: 'Ao escolher uma melhoria, o painel mostra o que muda: quantos tijolos por segundo os pedreiros assentam, quanto material sobe, quanto a torre rende.' },
  { titulo: 'Leia a obra', texto: 'A obra mostra o que falta: pedreiros dormindo 💤 = falta material lá em cima; material empilhado no térreo = os elevadores não dão conta; rachaduras = chegou ao limite da fundação.' },
  { titulo: 'Contratos de altura', texto: 'Em certas alturas chega uma proposta (a primeira aos 2 km): escolha 1 de 3 bônus. Ele vale até o fim da obra. Escolher bem faz a obra ir muito mais longe.' },
  { titulo: 'Fim do prazo', texto: 'No dia 365 você escolhe: um aditivo de mais 365 dias na mesma torre, ou entregar e aceitar o contrato de outra cidade. A torre entregue aumenta a Reputação (para sempre) e paga uma taxa em todas as obras seguintes. Bateu a meta do contrato antes? Dá para entregar antes do prazo, com bônus.' },
  { titulo: 'Gerentes e ranking', texto: 'A partir da 2ª obra chegam gerentes que compram o básico sozinhos. Entre no ranking com um apelido e tente chegar mais alto que todo mundo — até a Órbita!' },
];
