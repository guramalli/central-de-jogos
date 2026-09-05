// Temas do Acromania — cada rodada sorteia um tema + um punhado de letras.
// Sem precisar de banco de dados: é tudo sorteado na hora, então o jogo
// nunca fica "sem conteúdo" (diferente do Stop/Quiz, que dependem de
// glossário/perguntas cadastradas).
// O tema precisa ACENDER alguma coisa na cabeça de quem lê. A diferença não
// está no formato ("nome de X" pode ser ótimo), está na especificidade e na
// âncora cultural: "nome de aplicativo" não sugere nada, "nome de música de
// axé" sugere um mundo inteiro. Genérico trava a rodada; específico e
// brasileiro faz a pessoa rir antes de terminar de ler.
//
// Três formatos, de propósito misturados — o mesmo molde repetido o tempo
// todo cansa:
//   1. FRASE INACABADA  ("Fui ao mercado e...")   -> conta uma história
//   2. PERGUNTA         ("Qual a razão da vida?") -> pede resposta
//   3. COISA CONCRETA   ("Fantasia de carnaval")  -> pede invenção
export const ACROMANIA_THEMES = [
  // --- Frases inacabadas: a pessoa completa a história ---
  "Fui ao mercado e...",
  "Acordei atrasado porque...",
  "A festa acabou quando...",
  "O churrasco deu errado porque...",
  "Cheguei em casa e encontrei...",
  "Terminei o namoro por causa de...",
  "Perdi o ônibus porque...",
  "Fui demitido por...",
  "O professor cancelou a aula porque...",
  "A internet caiu bem na hora que...",
  "Não fiz o trabalho porque...",
  "O bolo desandou quando...",
  "Sumiu da geladeira o...",
  "A viagem virou pesadelo quando...",

  // --- Perguntas: pedem uma resposta, não um rótulo ---
  "Qual a razão da vida?",
  "Por que segunda-feira existe?",
  "O que os cachorros pensam da gente?",
  "Por que o pão sempre cai com a manteiga pra baixo?",
  "O que fazer quando acaba o dinheiro?",
  "Como conquistar alguém?",
  "Por que os gatos ignoram todo mundo?",
  "O que tem no fundo do mar?",
  "Como explicar isso pra minha mãe?",
  "Por que ninguém me avisou?",

  // --- Concretos e bem brasileiros ---
  "Fantasia de carnaval",
  "Nome de música de axé",
  "Nome de bloco de carnaval",
  "Nome de escola de samba",
  "Nome de banda de forró",
  "Nome de time de várzea",
  "Nome de pizzaria de bairro",
  "Nome de salão de beleza",
  "Nome de borracharia",
  "Prato do dia de restaurante duvidoso",
  "Sabor de sorvete que não deveria existir",
  "Nome de novela das nove",
  "Nome de reality show",
  "Apelido do vizinho",
  "Conselho de avó",
  "Promessa de ano novo",
  "Frase de tatuagem arrependida",
  "Recado colado na geladeira",
  "Bilhete deixado no para-brisa",
  "Placa escrita à mão em comércio",
  "Última palavra antes de fazer besteira",
  "Desculpa pra não ir na academia",
  "Mensagem da tia no grupo da família",
  "Nome de rede de Wi-Fi do vizinho",
  "Título de vídeo clickbait",
  "Nome de curso online duvidoso",
  "Manchete de jornal de cidade pequena",
  "Grito de torcida",

  // --- Os que já funcionavam antes ---
  "Desculpa esfarrapada",
  "Frase de para-choque de caminhão",
  "Frase de biscoito da sorte",
  "Desculpa de político",
  "Lema de empresa falida",
];

// Mesmo alfabeto usado no Stop (sem K, W, Y — mais fácil de criar frase em português).
const LETTERS = "ABCDEFGHIJLMNOPQRSTUVXZ".split("");

// Sorteio ponderado, mesmo esquema do Stop (ver PESO_LETRAS no StopRoom).
// Peso 1 = frequência normal. No Acromania pesa ainda mais que no Stop: lá
// a letra difícil atrapalha uma palavra, aqui ela trava a frase inteira,
// porque toda palavra precisa começar pela letra que saiu.
const PESO_LETRAS = {
  X: 0.15,
  Z: 0.2,
  Q: 0.25,
  H: 0.6,
  U: 0.6,
  J: 0.7,
  N: 0.7,
};

function pesoDaLetra(letra) {
  return PESO_LETRAS[letra] ?? 1;
}

// Sorteio de tema por BARALHO, não por acaso — mesmo esquema que o Quiz usa
// pras perguntas. Sorteio puro repetia tema em rodadas seguidas com uma
// frequência incômoda (com N temas, a chance de repetir na rodada seguinte é
// 1/N, o que aparece rápido). Com baralho, nenhum tema volta até todos terem
// saído, e ao reembaralhar o primeiro nunca é igual ao último servido — que
// é justamente a repetição que mais chateia.
export function criarSorteadorDeTemas(temas = ACROMANIA_THEMES) {
  let fila = [];
  let ultimo = null;

  function embaralhar() {
    fila = [...temas];
    for (let i = fila.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fila[i], fila[j]] = [fila[j], fila[i]];
    }
    // Evita emendar o fim de um baralho com o começo do próximo.
    if (fila.length > 1 && fila[0] === ultimo) {
      [fila[0], fila[1]] = [fila[1], fila[0]];
    }
  }

  return function proximoTema() {
    if (fila.length === 0) embaralhar();
    ultimo = fila.shift();
    return ultimo;
  };
}

// Sorteia N letras distintas (sem repetir), na ordem em que a frase deve
// seguir. Cada letra ocupa uma fatia proporcional ao peso, então X e Z
// continuam existindo — só ficam raras.
export function pickRandomLetters(count = 3) {
  const pool = [...LETTERS];
  const picked = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const pesoTotal = pool.reduce((soma, l) => soma + pesoDaLetra(l), 0);
    let sorteio = Math.random() * pesoTotal;
    let idx = pool.length - 1;
    for (let j = 0; j < pool.length; j++) {
      sorteio -= pesoDaLetra(pool[j]);
      if (sorteio <= 0) {
        idx = j;
        break;
      }
    }
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picked;
}
