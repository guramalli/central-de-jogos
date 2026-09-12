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
  // Vogais: começam as palavras que amarram qualquer frase.
  A: 2.5,
  E: 2.5,
  O: 2.5,
  I: 2,
  U: 1.8,
  // Únicas que seguem abaixo do normal. Não por serem "difíceis", mas
  // porque puxam pra um vocabulário estreito demais quando saem juntas.
  H: 0.8,
  G: 0.9,
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
