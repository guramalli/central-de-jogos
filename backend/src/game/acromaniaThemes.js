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

export function pickRandomTheme() {
  return ACROMANIA_THEMES[Math.floor(Math.random() * ACROMANIA_THEMES.length)];
}

// Sorteia N letras distintas (sem repetir), na ordem em que a frase deve seguir.
export function pickRandomLetters(count = 3) {
  const pool = [...LETTERS];
  const picked = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picked;
}
