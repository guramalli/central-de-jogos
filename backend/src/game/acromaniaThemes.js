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


  // ===== FRASES E SITUAÇÕES =====
  //
  // Formato diferente dos assuntos acima: em vez de dar o CAMPO, dá a
  // SITUAÇÃO e a pessoa completa com as letras sorteadas. A graça vem do
  // contraste — a frase precisa fazer sentido no contexto E respeitar as
  // letras.
  //
  // Os dois formatos convivem de propósito: o sorteio pega dos dois, e a
  // rodada alterna entre "Comida" e "O pior conselho possível". Isso quebra
  // a monotonia melhor do que só um deles.
  "O pior conselho possível",
  "Uma desculpa inacreditável",
  "Uma lei absurda",
  "O pior presente possível",
  "Uma viagem que deu errado",
  "Se eu ganhasse 100 milhões",
  "Se eu pudesse voltar no tempo",
  "Se eu fosse o presidente",
  "Se eu tivesse superpoderes",
  "Se extraterrestres chegassem hoje...",
  "Se amanhã fosse o fim do mundo...",
  "O prato perfeito",
  "Uma receita maluca",
  "Um pedido do delivery",
  "Algo que você não gostaria de descobrir sobre seu vizinho",
  "Algo que você não gostaria de ouvir do piloto do avião",
  "Algo que você não gostaria de ouvir do mecânico",
  "Se eu pudesse controlar o clima...",
  "Se eu pudesse inventar uma nova lei...",
  "Se eu fosse um vilão...",
  "Um pedido de namoro",
  "Uma mensagem para o(a) ex",
  "A humanidade no futuro",
  "Se eu fosse o último humano na Terra...",
  "Terminei o namoro porque...",
  "Fui despedido porque...",
  "Minha sogra é...",
  "Qual a razão da vida?",

  "O que aconteceu depois daquela festa...",
  "Acordei e descobri que...",
  "Abri a porta e vi...",
  "Recebi uma mensagem dizendo...",
  "Fui preso porque...",
  "Fugi de casa porque...",
  "Se eu pudesse parar o tempo...",
  "Se eu pudesse trocar de corpo com alguém...",
  "Eu nunca deveria ter...",
  "Eu sabia que ia dar errado quando...",
  "Minha mãe descobriu que...",
  "Meu chefe descobriu que...",
  "Meu vizinho gritou...",
  "O rei ordenou...",
  "Fiquei milionário porque...",
  "Fiquei pobre porque...",
  "Meu novo emprego é...",
  "O segredo que destruiria sua reputação",
  "O que o pombo estava fazendo na sala do presidente?",
  "O que tinha dentro da mala?",
  "O que aconteceu dentro do elevador?",

  "Olhei pela janela e vi...",
  "Tudo estava indo bem até...",
  "Quando olhei para trás...",
  "Quando abri aquela caixa...",
  "Por que a polícia estava na minha casa?",
  "Por que o médico saiu correndo?",
  "Se eu pudesse falar com os mortos...",
  "Eu só fiz isso porque...",
  "A verdadeira razão foi...",
  "Se minha família descobrisse...",
  "A coisa mais estranha que já fiz foi...",
  "A coisa mais idiota que já fiz foi...",
  "O alienígena pediu...",
  "O fantasma deixou um bilhete dizendo...",
  "Minha inteligência artificial decidiu...",
  "O corretor automático escreveu...",
  "Descobri que herdei...",
  "Comprei uma ilha e...",
  "Perdi toda minha fortuna porque...",
  "Fiquei famoso depois de...",
  "Meu primeiro milhão veio de...",
  "O banco ligou para avisar que...",
  "Minha sogra decidiu que...",
  "Meu ex apareceu na festa e...",
  "Minha namorada descobriu que...",
  "O que aconteceu naquela noite?",

];

// ALFABETO DO ACROMANIA — sem K, W, Y (que o Stop também não usa) e SEM X e Z.
//
// X e Z saíram porque a régua aqui é outra. No Stop, letra difícil custa uma
// palavra; no Acromania ela trava a frase inteira, já que TODA palavra
// precisa começar pela letra sorteada. Mesmo com peso baixinho, X ou Z
// apareciam em 7,7% das rodadas — uma em treze saía capenga.
const LETTERS = "ABCDEFGHIJLMNOPQRSTUV".split("");

// PESOS REFEITOS: o objetivo do Acromania NÃO é ser difícil.
//
// A graça está na criatividade da frase, não em vencer um quebra-cabeça de
// letras. Se a pessoa gasta os 60 segundos tentando lembrar uma palavra com
// Z, ela não teve tempo de ser engraçada — e é a piada que ganha voto.
//
// Por isso as vogais são reforçadas: antes 30% das rodadas saíam SEM NENHUMA
// vogal, quatro consoantes seguidas, e a frase ficava forçada.
//
// E as penalidades antigas foram quase todas removidas, porque vinham
// copiadas do Stop e lá a régua é outra. "Que", "não", "um" e "já" estão
// entre as palavras mais usadas do português — penalizar Q, N, U e J era
// tirar do jogo justamente o que faz uma frase fluir.
const PESO_LETRAS = {
  // ÍNDICE DE VOCABULÁRIO PARA FRASE.
  //
  // O critério NÃO é quantas palavras existem com a letra — é quantas
  // PALAVRAS DE LIGAÇÃO ela oferece: artigo, preposição, conjunção, verbo
  // comum. São elas que fazem a frase fluir. "Zoológico" é uma palavra
  // ótima e não ajuda em nada a montar uma frase.
  //
  // ===== DEGRAU 1 — o esqueleto do português (3,0) =====
  // Artigos e conectivos que entram em quase toda frase.
  //   A: a, as, ao, à, agora, ainda, antes
  //   E: e, ele, ela, em, então, eu, era
  //   O: o, os, ou, onde, ontem, outro
  A: 3,
  E: 3,
  O: 3,

  // ===== DEGRAU 2 — preposições e conjunções (2,0) =====
  // Estavam TODAS em peso 1 até aqui, o que era o maior erro da tabela
  // anterior: são as letras de "de", "para", "com", "não", "mas", "se" e
  // "que" — sem elas a frase não tem como se ligar.
  //   D: de, do, da, depois, dar, dizer
  //   P: para, por, porque, pelo, pode, pensar
  //   C: com, como, cada, coisa, chegar
  //   N: não, nada, nunca, no, na, nem
  //   M: mas, mais, me, meu, muito, mesmo
  //   S: se, sem, sempre, só, ser, saber
  //   Q: que, quando, quem, qual, quase
  //   T: também, todo, tudo, ter, tempo, tão
  D: 2,
  P: 2,
  C: 2,
  N: 2,
  M: 2,
  S: 2,
  Q: 2,
  T: 2,

  // ===== DEGRAU 3 — verbos e palavras comuns (1,3) =====
  // Não ligam a frase, mas dão o conteúdo dela sem esforço.
  //   V: você, vai, ver, vida, vamos
  //   F: fazer, foi, falar, ficar, feliz
  //   U: um, uma, único, último, usar
  //   I: isso, ir, igual, imagina
  //   L: lá, logo, levar, lembrar, lugar
  V: 1.3,
  F: 1.3,
  U: 1.3,
  I: 1.3,
  L: 1.3,

  // ===== DEGRAU 4 — vocabulário mais estreito (0,8) =====
  //   B: bem, bom, beber, brincar
  //   G: gente, grande, gostar, ganhar
  //   J: já, jogar, jeito, juntos
  B: 0.8,
  G: 0.8,
  J: 0.8,

  // ===== DEGRAU 5 — as duas mais pobres (0,4) =====
  // R tem verbos bons (rir, roubar, resolver), mas a mesa cai sempre nos
  // mesmos. H é o caso extremo: quase tudo é substantivo (hoje, hora,
  // homem, hotel), e substantivo sozinho não constrói piada.
  R: 0.4,
  H: 0.4,
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
