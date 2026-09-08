// Temas do Acromania — cada rodada sorteia um tema + um punhado de letras.
// Sem precisar de banco de dados: é tudo sorteado na hora, então o jogo
// nunca fica "sem conteúdo" (diferente do Stop/Quiz, que dependem de
// glossário/perguntas cadastradas).
// O tema dá o CAMPO, não o formato. Uma palavra ou duas, um assunto que
// todo mundo reconhece, e liberdade total dentro dele.
//
// Por que não mais específico: o tema apertado briga com as letras. "Nome de
// borracharia" com C F L I S H vira quebra-cabeça, não piada — e a rodada
// tem 60 segundos. Quanto mais letras, mais o tema precisa afrouxar.
//
// Por que não mais genérico ainda ("Coisas", "Aleatório"): aí o tema deixa de
// existir. Todo mundo escreve qualquer coisa e a votação perde o critério —
// não dá pra julgar "a melhor" sem um terreno comum.
//
// O equilíbrio é ASSUNTO: guia sem segmentar.
export const ACROMANIA_THEMES = [
  // Dia a dia
  "Comida",
  "Trabalho",
  "Escola",
  "Dinheiro",
  "Família",
  "Vizinhos",
  "Trânsito",
  "Supermercado",
  "Academia",
  "Segunda-feira",
  "Fim de semana",
  "Feriado",
  "Madrugada",
  "Mudança de casa",

  // Sentimentos e situações
  "Amor",
  "Ciúme",
  "Saudade",
  "Medo",
  "Vergonha",
  "Preguiça",
  "Pressa",
  "Sorte",
  "Azar",
  "Mentira",
  "Fofoca",
  "Briga",
  "Desculpa",
  "Promessa",

  // Lazer
  "Futebol",
  "Música",
  "Cinema",
  "Videogame",
  "Festa",
  "Carnaval",
  "Praia",
  "Viagem",
  "Churrasco",
  "Aniversário",

  // Mundo
  "Internet",
  "Celular",
  "Animais",
  "Chuva",
  "Calor",
  "Escuro",
  "Comida estragada",
  "Hospital",
  "Política",
  "Ciência",
  "Espaço",
  "Futuro",
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
