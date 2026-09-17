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


  // ===== SEXTA LEVA — 50 temas (setembro/2026) =====
  //
  // Escritos depois de jogar o próprio jogo umas vinte rodadas. O que rendeu
  // ali foi tema que dá uma CENA ou uma VOZ, não um campo aberto: "O que
  // tinha dentro da mala?" puxa uma frase pronta, "Objetos" não puxa nada.
  //
  // Divididos entre engraçado, reflexivo e criativo de propósito — o
  // Acromania fica repetitivo se tudo for piada.

  // --- Confissões e vergonhas ---
  "A pior mentira que eu já contei",
  "Algo que eu fingi que sabia",
  "O que eu faço quando estou sozinho em casa",
  "Minha maior vergonha na escola",
  "O que tem no meu histórico de busca",
  "Uma coisa que eu nunca contei pra ninguém",
  "O motivo real de eu ter chegado tarde",

  // --- Cenas e situações ---
  "O que o entregador viu pela janela",
  "O barulho que veio do porão era...",
  "Abri o armário e caiu...",
  "O que o vizinho estava fazendo às 3 da manhã",
  "A última coisa que vi antes de apagar",
  "O que tinha no bolso daquele casaco",
  "Achei um bilhete no livro usado, dizia...",
  "O que aconteceu quando a luz voltou",

  // --- Perguntas absurdas ---
  "O que o pinguim faria com um cartão de crédito?",
  "Por que o elevador parou no quinto andar?",
  "O que o cachorro diria se falasse por um dia?",
  "Por que tem um sapato no meio da estrada?",
  "O que a estátua faz quando ninguém olha?",
  "Por que a impressora só falha quando tem pressa?",

  // --- Reflexivos ---
  "O que eu aprendi tarde demais",
  "Algo que eu perdoaria",
  "O que me faz levantar da cama",
  "Uma coisa que o dinheiro não compra",
  "O que eu diria pra quem está desistindo",
  "O que eu levaria de uma casa em chamas",
  "Do que eu vou me orgulhar daqui a 20 anos",
  "Uma coisa que melhorou com o tempo",

  // --- Criativos ---
  "Uma placa que deveria existir",
  "O nome do meu restaurante seria...",
  "Uma profissão que ainda vão inventar",
  "O superpoder mais inútil do mundo",
  "Uma nova regra pro trânsito",
  "O feriado que faltava se chamaria...",
  "Uma invenção que ninguém pediu",
  "O nome da minha autobiografia",

  // --- Voz de outro personagem ---
  "O robô aspirador está pensando...",
  "A mensagem automática do banco dizia...",
  "O bilhete do professor pros pais dizia...",
  "O anúncio de emprego pedia...",
  "A bula do remédio avisava...",
  "O aviso no elevador dizia...",

  // --- Cotidiano com humor ---
  "O que estraga um churrasco",
  "Por que meu time perdeu de novo",
  "O que nunca deveria ir no micro-ondas",
  "A desculpa clássica do brasileiro",
  "O que atrasa qualquer reunião",
  "Como reconhecer alguém apaixonado",
  "O que sempre some em casa",
  "O pior tipo de vizinho",

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
// Letras de vocabulário estreito. O peso já faz cada uma aparecer pouco,
// mas peso é sorteio independente: nada impedia B, J e Q caírem na MESMA
// rodada. Acontecia em 2,4% delas — pouco no papel, uma a cada 40 pra quem
// joga muito, e são exatamente as rodadas em que a frase não sai.
const LETRAS_DIFICEIS = new Set(["B", "G", "J", "R", "H", "Q"]);
const MAX_DIFICEIS_POR_RODADA = 2;

// Letras que começam palavra de LIGAÇÃO — artigo, preposição, conjunção,
// pronome. São elas que amarram a frase: "de", "com", "não", "mas", "se",
// "que", "para", "o", "a", "e".
//
// Sem nenhuma delas a pessoa fica com um monte de substantivo solto e nada
// pra ligar. Medi em 200 mil rodadas: 0,91% saíam com no máximo UMA — como
// "E F I U V" ou "F I L S U". Pouco no papel, mas é uma a cada 110, e são
// justamente as rodadas em que ninguém escreve nada.
const LETRAS_DE_LIGACAO = new Set(["A", "E", "O", "D", "P", "C", "N", "M", "S", "Q", "T"]);
const MIN_LIGACOES_POR_RODADA = 2;

export function pickRandomLetters(count = 3) {
  const pool = [...LETTERS];
  const picked = [];
  let dificeis = 0;

  for (let i = 0; i < count && pool.length > 0; i++) {
    // TETO DE LETRAS DIFÍCEIS.
    //
    // Ao bater o limite, as difíceis saem do bolo para o resto do sorteio —
    // não é "sortear de novo até dar certo", que enviesaria as outras
    // letras. Elas voltam ao bolo na rodada seguinte.
    const bolo =
      dificeis >= MAX_DIFICEIS_POR_RODADA
        ? pool.filter((l) => !LETRAS_DIFICEIS.has(l))
        : pool;

    // Se o filtro esvaziar o bolo (não acontece com o alfabeto atual, mas
    // aconteceria se alguém reduzisse muito as letras), volta a usar o pool
    // inteiro em vez de sortear de um vazio.
    const disponiveis = bolo.length > 0 ? bolo : pool;

    const pesoTotal = disponiveis.reduce((soma, l) => soma + pesoDaLetra(l), 0);
    let sorteio = Math.random() * pesoTotal;
    let idx = disponiveis.length - 1;
    for (let j = 0; j < disponiveis.length; j++) {
      sorteio -= pesoDaLetra(disponiveis[j]);
      if (sorteio <= 0) {
        idx = j;
        break;
      }
    }

    const letra = disponiveis[idx];
    picked.push(letra);
    if (LETRAS_DIFICEIS.has(letra)) dificeis += 1;
    pool.splice(pool.indexOf(letra), 1);
  }

  // PISO DE LETRAS DE LIGAÇÃO.
  //
  // Feito no fim, e não durante o sorteio, de propósito: reservar vagas no
  // meio do caminho enviesaria todas as outras letras. Aqui a rodada é
  // sorteada normalmente e só as raras que ficaram pobres são corrigidas.
  //
  // A troca sai da letra MENOS útil da rodada (a mais difícil que estiver
  // lá), não de uma qualquer — trocar uma vogal pra pôr uma conectiva não
  // melhoraria nada.
  let ligacoes = picked.filter((l) => LETRAS_DE_LIGACAO.has(l)).length;
  while (ligacoes < MIN_LIGACOES_POR_RODADA) {
    const candidatas = pool.filter((l) => LETRAS_DE_LIGACAO.has(l));
    if (candidatas.length === 0) break;

    // Índice da pior letra presente: difícil primeiro, senão a de menor peso.
    let piorIdx = -1;
    let piorPeso = Infinity;
    for (let i = 0; i < picked.length; i++) {
      const l = picked[i];
      if (LETRAS_DE_LIGACAO.has(l)) continue; // não tira o que já ajuda
      const p = LETRAS_DIFICEIS.has(l) ? -1 : pesoDaLetra(l);
      if (p < piorPeso) {
        piorPeso = p;
        piorIdx = i;
      }
    }
    if (piorIdx === -1) break;

    // A entrante é sorteada pelo peso, pra não cair sempre na mesma.
    const total = candidatas.reduce((soma, l) => soma + pesoDaLetra(l), 0);
    let sorteio = Math.random() * total;
    let escolhida = candidatas[candidatas.length - 1];
    for (const l of candidatas) {
      sorteio -= pesoDaLetra(l);
      if (sorteio <= 0) {
        escolhida = l;
        break;
      }
    }

    pool.splice(pool.indexOf(escolhida), 1);
    pool.push(picked[piorIdx]);
    picked[piorIdx] = escolhida;
    ligacoes += 1;
  }

  return picked;
}
