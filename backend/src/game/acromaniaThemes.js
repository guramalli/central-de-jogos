// Temas do Acromania — cada rodada sorteia um tema + um punhado de letras.
// Sem precisar de banco de dados: é tudo sorteado na hora, então o jogo
// nunca fica "sem conteúdo" (diferente do Stop/Quiz, que dependem de
// glossário/perguntas cadastradas).
export const ACROMANIA_THEMES = [
  "Desculpa esfarrapada",
  "Frase de para-choque de caminhão",
  "Nome de banda de rock",
  "Motivo pra chegar atrasado",
  "Título de filme nacional",
  "Manchete de jornal",
  "Nome de aplicativo",
  "Grito de torcida",
  "Lema de empresa falida",
  "Post de rede social",
  "Nome de time de futebol",
  "Frase de casamenteiro",
  "Slogan de propaganda",
  "Título de novela",
  "Nome de banda de pagode",
  "Desculpa de político",
  "Frase de biscoito da sorte",

  // --- Internet e vida online ---
  // O jogo é de acrônimo: o tema precisa ser algo que a pessoa consiga
  // INVENTAR na hora, não algo que ela precise lembrar. Por isso são todos
  // "nome de", "título de", "frase de" — moldes vazios pra preencher.
  "Nome de grupo do WhatsApp",
  "Comentário de vídeo do YouTube",
  "Título de vídeo clickbait",
  "Bio do Instagram",
  "Nome de canal do YouTube",
  "Nome de rede de Wi-Fi do vizinho",
  "Nome de playlist do Spotify",
  "Título de live de streamer",
  "Nome de servidor do Discord",
  "Nome de clã de jogo online",
  "Nick de jogador online",
  "Nome de pasta secreta no computador",
  "Mensagem de erro do computador",
  "Resposta automática de suporte técnico",
  "Frase de perfil do LinkedIn",
  "Legenda de foto de perfil",
  "Nome de aplicativo que ninguém baixaria",
  "Nome de emoji que deveria existir",
  "Título de tutorial da internet",
  "Regra do grupo da família",
  "Nome de trend de dança",
  "Aviso de spoiler",
  "Nome de meme brasileiro",
  "Comentário de quem chegou atrasado na live",
  "Nome de startup de tecnologia",
  "Título de thread polêmica",
  "Recado de status",
  "Nome de filtro de rede social",
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
