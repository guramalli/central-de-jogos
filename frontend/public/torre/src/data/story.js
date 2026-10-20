// História do Obra Viva: abertura em 4 quadros, manchetes por era e frases de descoberta das tecnologias.
// Só conteúdo (a interface fica em ui/intro.js). Nome da construtora decidido com o usuário: J. Santos.
export const COMPANY = 'J. Santos';

// cam: 'descend' (do céu até o terreno), 'ground' (térreo), 'rise' (sobe pelas eras até a Órbita), 'fans' (curiosos no tapume)
// dur: segundos até passar sozinho (0 = espera o botão)
export const INTRO = [
  { cam: 'descend', dur: 6, kicker: 'PRAIA GRANDE · 2026', text: 'Um terreno vazio na orla. Por enquanto.' },
  { cam: 'ground', dur: 7.5, kicker: `CONSTRUTORA ${COMPANY.toUpperCase()}`,
    text: `A Construtora ${COMPANY} anunciou o projeto mais ousado da história: uma torre que não para de subir.`,
    clips: ['Loucura ou gênio?', 'Engenheiros dizem que é impossível', `Torre da ${COMPANY} vira notícia no mundo todo`] },
  { cam: 'rise', dur: 7.5, kicker: 'ATÉ ONDE?', text: 'Pressão, frio, gravidade… ninguém sabe o que existe lá em cima. Nós vamos descobrir.' },
  { cam: 'fans', dur: 0, kicker: 'O MUNDO ESTÁ DE OLHO', text: 'E os primeiros turistas já chegaram para ver o começo da obra.', cheque: true },
];

// manchete quando a torre entra numa era (a Órbita fecha a história na tela de parabéns)
// {cidade} vira o nome da cidade da obra atual (headline)
export const HEADLINES = {
  1: `Torre da ${COMPANY} já é o prédio mais alto de {cidade}`,
  2: 'Passou o Burj Khalifa! Engenheiros do mundo todo visitam a obra em {cidade}',
  3: 'Acima dos aviões: operários agora trabalham com trajes pressurizados',
  4: 'Na mesosfera, a torre cruza a camada onde os meteoros queimam',
  5: `A torre chega ao espaço: a ${COMPANY} é a primeira construtora fora da Terra`,
};

export const headline = (era, cidade) => HEADLINES[era] && HEADLINES[era].replace('{cidade}', cidade);

// frase de descoberta ao comprar o 1º nível de cada tecnologia de era
export const DISCOVERY = {
  escoramento: 'Escoras de aço que se ajustam sozinhas ao peso da laje',
  soldadores: 'Solda que une vigas de aço em segundos, sem esfriar',
  mutirao: 'Equipe polivalente: quem assenta também sobe material',
  robos: 'Braços robóticos que assentam dia e noite sem cansar',
  drones: 'Drones que montam peças onde o ar é rarefeito demais',
  usina: 'Concreto que cura em minutos, não em semanas',
  siderurgica: 'Aço mais leve que alumínio e mais forte que titânio',
  usinaTopo: 'Uma fábrica inteira funcionando lá no alto da torre',
  fabrica: 'Linha de produção que nunca para',
  asteroides: 'Material de construção vindo direto do espaço',
  cabos: 'Cabos de aço trançado que aguentam o dobro da carga',
  expresso: 'Elevadores que sobem quilômetros sem parar',
  pressurizada: 'Cabines que levam carga e gente ao ar rarefeito',
  linear: 'Motor magnético: o elevador sobe sem cabo nenhum',
  teleporte: 'Teletransporte de carga: o material some no térreo e aparece no topo',
  calculo: 'Estrutura mais leve calculada por supercomputador',
  prefab: 'Andares inteiros saindo prontos da fábrica',
  flutuante: 'Fundação flutuante que distribui o peso da torre',
  amortecedor: 'Amortecedores gigantes que seguram a torre contra o vento',
  gravidade: 'Gravidade artificial: quanto mais alto, mais leve',
  imobiliaria: 'Fila de espera para morar na torre mais famosa do mundo',
  agencia: 'Excursões de todos os continentes para ver a obra',
  hotelNuvens: 'O primeiro hotel acima das nuvens',
  publicidade: 'A torre virou cartão-postal do planeta',
  turismoEsp: 'Passeios turísticos até o espaço',
  argamassa: 'Argamassa que rende o dobro com metade do material',
  parafusada: 'Vigas que se encaixam e se parafusam como brinquedo',
  turnoNoite: 'A obra agora não para nem de madrugada',
  impressao3d: 'Paredes impressas camada por camada, sem desperdício',
  exoesqueleto: 'Pedreiros com força de guindaste',
  concretoAD: 'Concreto tão bom que os andares valem mais',
  vidroSolar: 'A fachada inteira virou uma usina solar',
  modulosProntos: 'Andares inteiros saindo prontos da fábrica',
  nanotubos: 'Material mais leve que o ar e mais forte que o aço',
  reciclagem: 'Nada se perde: o entulho vira andar novo',
  gaiolaDupla: 'Elevadores com o dobro de espaço',
  contrapeso: 'Contrapeso que deixa os elevadores quase sem esforço',
  esteira: 'Uma esteira que sobe a torre inteira',
  tuboPneumatico: 'Material soprado do térreo até o topo',
  elevadorEspacial: 'Um cabo esticado do chão até a órbita',
  estacas: 'Estacas que descem até a rocha mais funda',
  fundacaoBarata: 'Formas de fundação que se montam em minutos',
  contrafortes: 'Apoios gigantes que seguram a torre de fora',
  grafeno: 'Uma coluna de grafeno no coração da torre',
  ancoraOrbital: 'A torre presa à órbita como uma âncora',
  corretores: 'Corretores próprios vendendo andar por andar',
  lojas: 'Lojas lotadas na base da torre',
  eventos: 'Salões de festa disputados acima das nuvens',
  leilao: 'Coberturas vendidas em leilão para o mundo todo',
  condominioOrbital: 'O primeiro condomínio de luxo no espaço',
};
