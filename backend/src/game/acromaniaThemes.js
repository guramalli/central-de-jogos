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

export function pickRandomTheme() {
  return ACROMANIA_THEMES[Math.floor(Math.random() * ACROMANIA_THEMES.length)];
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
