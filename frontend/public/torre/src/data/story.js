// História do Obra Viva: abertura em 4 quadros, manchetes por era e frases de descoberta das tecnologias.
// Só conteúdo (a interface fica em ui/intro.js). Nome da construtora: Vigaluz (fictício; decisão do usuário, 21/10/2026 —
// antes J. Santos).
import { FLAGS } from './flags.js';
import { t, LANG } from '../i18n.js';
export const COMPANY = 'Vigaluz';

// cam: 'descend' (do céu até o terreno), 'ground' (térreo), 'rise' (sobe pelas eras até a Órbita), 'fans' (curiosos no tapume)
// dur: segundos até passar sozinho (0 = espera o botão)
// A história (revista com o usuário, out/2026): uma construtora pequena ganha o primeiro contrato — 365 dias, meta de
// 100 m — e cada torre entregue leva a fama da construtora a outra cidade, com uma obra mais alta, até a Órbita.
// Torre única (modo principal): o terreno da orla onde três torres já desabaram; a Vigaluz quer a mais alta do mundo e de pé.
const INTRO_RISCO = [
  { cam: 'descend', dur: 6, kicker: 'SANTA BRISA · 2026', text: 'Um terreno vazio na orla. Três torres já caíram aqui: o vento do mar, a areia fofa e a pressa derrubaram todas.' },
  { cam: 'ground', dur: 7.5, kicker: `CONSTRUTORA ${COMPANY.toUpperCase()}`,
    text: `A ${COMPANY}, uma construtora estreante, comprou o terreno que ninguém quer. O plano: erguer a torre mais alta do mundo — e mantê-la de pé.`,
    clips: ['Terreno da orla volta à venda depois do 3º desabamento', 'Construtora estreante compra o "terreno maldito"', `Engenheira-chefe da ${COMPANY}: "desta vez a torre fica de pé"`] },
  { cam: 'rise', dur: 7.5, kicker: 'O DESAFIO', text: 'Cada ano traz ventos mais fortes, tempestades, terremotos e até meteoros. Cada ano de pé deixa a construtora mais respeitada. Até onde a torre aguenta?' },
  { cam: 'fans', dur: 0, kicker: 'ANO 1 · DIA 1', text: 'Os curiosos já apostam quanto tempo ela dura. Com o dinheiro dos sócios, a obra começa hoje.', cheque: true },
];
export const INTRO = INTRO_RISCO;
// quem assina o cheque da abertura
export const CHEQUE_DE = ['Sócios da construtora', 'CAPITAL INICIAL'];

// manchete quando a torre entra numa era (a Órbita fecha a história na tela de parabéns)
// {0} vira o nome da cidade da obra atual (headline); o texto passa por t() (a chave é o português)
export const HEADLINES = {
  1: `Torre da ${COMPANY} já é o prédio mais alto de {0}`,
  2: 'Passou o Burj Khalifa! Engenheiros do mundo todo visitam a obra em {0}',
  3: 'Acima dos aviões: operários agora trabalham com trajes pressurizados',
  4: 'Na mesosfera, a torre cruza a camada onde os meteoros queimam',
  5: `A torre chega ao espaço: a ${COMPANY} é a primeira construtora fora da Terra`,
};

export const headline = (era, cidade) => HEADLINES[era] && t(HEADLINES[era], t(cidade));

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

// Capa de jornal nos marcos de andares (decisão do usuário, out/2026): 100, 500, 1.000 e depois a cada 1.000.
// Cada marco sai uma vez só na campanha (S.jornais); se passar de vários de uma vez, a capa é do maior.
export const ehMarcoJornal = n => n === 100 || n === 500 || (n >= 1000 && n % 1000 === 0);
export function proximoJornal(andares, vistos) {
  const v = new Set(vistos);
  let melhor = null;
  for (const n of [100, 500]) if (andares >= n && !v.has(n)) melhor = n;
  for (let n = 1000; n <= andares; n += 1000) if (!v.has(n)) melhor = n;
  return melhor;
}
const fmtN = n => n.toLocaleString(LANG === 'en' ? 'en-US' : 'pt-BR');
// capas dos marcos: 100, 500 e 1.000 têm texto próprio; depois, um destes em rodízio ({0} = andares, {1} = cidade).
// Os textos são as chaves de t() (src/i18n/en-historia.js).
export const MANCHETE_100 = 'Construtora Vigaluz chega a 100 andares numa torre que desafia as leis da física';
export const MANCHETE_500 = '500 andares! Engenheiros do mundo inteiro vêm a {0} ver a torre da Vigaluz';
export const MANCHETE_1000 = 'Mil andares: a torre da Vigaluz já é a obra mais alta da história';
export const MANCHETES = [
  '{0} andares: a Construtora Vigaluz não para de subir',
  '{0} andares em {1}: cientistas ainda tentam explicar como a torre fica de pé',
  'Torre da Vigaluz passa de {0} andares e vizinhos já usam telescópio para ver o topo',
  'Marco histórico: {0} andares na torre da Construtora Vigaluz',
];
export function manchete(n, cidade) {
  const c = t(cidade);
  if (n === 100) return t(MANCHETE_100);
  if (n === 500) return t(MANCHETE_500, c);
  if (n === 1000) return t(MANCHETE_1000);
  return t(MANCHETES[(n / 1000) % MANCHETES.length], fmtN(n), c);
}
// marcos do mundo real: só uma marca na régua de altura da tela (sem jornal)
export const MARCOS_MUNDO = [
  { m: 165, n: 'Edifício Itália' }, { m: 330, n: 'Torre Eiffel' }, { m: 828, n: 'Burj Khalifa' },
  { m: 8849, n: 'Everest' }, { m: 10500, n: 'Altura dos aviões' }, { m: 100000, n: 'Linha de Kármán' }, { m: 408000, n: 'Estação Espacial' },
];
