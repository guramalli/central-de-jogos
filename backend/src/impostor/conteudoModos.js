// O IMPOSTOR — conteúdo dos modos Situação, Pergunta e História.
//
// O modo Palavra continua lendo do banco (palavras.js). Estes três modos
// usam listas fixas daqui: são poucas dezenas de itens, mudam pouco, e assim
// não precisa de tabela nova no Prisma.
//
// Tudo em português do Brasil, pra jogar em família.

import { embaralhar } from "./regras.js";

// ---------------- SITUAÇÃO ----------------
// `texto` é o que os tripulantes recebem. `dicas` são só pros BOTS
// tripulantes (1 a 3 palavras, sem usar palavras da situação — há um teste
// que passa cada uma pela validação da sala).
export const SITUACOES = [
  { texto: "Num velório", dicas: ["tristeza", "flores", "silêncio"] },
  { texto: "Na fila do SUS", dicas: ["espera longa", "senha", "paciência"] },
  { texto: "Num casamento", dicas: ["bolo", "vestido branco", "buquê"] },
  { texto: "Numa festa de aniversário infantil", dicas: ["brigadeiro", "palhaço", "bexiga"] },
  { texto: "No dentista", dicas: ["cadeira reclinável", "motorzinho", "boca aberta"] },
  { texto: "Num show de rock", dicas: ["guitarra", "multidão", "barulho alto"] },
  { texto: "Na praia lotada", dicas: ["guarda-sol", "areia quente", "vendedor de mate"] },
  { texto: "Numa entrevista de emprego", dicas: ["currículo", "nervosismo", "roupa social"] },
  { texto: "No ônibus lotado", dicas: ["catraca", "aperto", "em pé"] },
  { texto: "Num churrasco de domingo", dicas: ["picanha", "tio do pavê", "carvão"] },
  { texto: "Na academia", dicas: ["suor", "halteres", "esteira"] },
  { texto: "Numa sala de aula", dicas: ["professor", "prova", "quadro"] },
  { texto: "No supermercado", dicas: ["carrinho", "promoção", "caixa"] },
  { texto: "Num avião", dicas: ["cinto", "turbulência", "janelinha"] },
  { texto: "No cinema", dicas: ["pipoca", "tela grande", "escuro"] },
  { texto: "Num hospital", dicas: ["enfermeira", "maca", "soro"] },
  { texto: "Num estádio de futebol", dicas: ["torcida", "gol", "juiz ladrão"] },
  { texto: "No salão de beleza", dicas: ["secador", "fofoca", "tesoura"] },
  { texto: "Numa festa junina", dicas: ["quentão", "quadrilha", "pescaria"] },
  { texto: "No Carnaval", dicas: ["fantasia", "bloco", "confete"] },
  { texto: "Num engarrafamento", dicas: ["buzina", "trânsito parado", "atraso"] },
  { texto: "No banco", dicas: ["gerente", "senha", "boleto"] },
  { texto: "Numa reunião de condomínio", dicas: ["síndico", "reclamação", "vizinhos"] },
  { texto: "Num acampamento", dicas: ["barraca", "fogueira", "mosquito"] },
  { texto: "Na cozinha da vó", dicas: ["bolo quentinho", "cheirinho bom", "avental"] },
  { texto: "Num parque de diversões", dicas: ["montanha-russa", "algodão-doce", "fila"] },
  { texto: "No zoológico", dicas: ["jaula", "girafa", "pipoca"] },
  { texto: "Numa biblioteca", dicas: ["silêncio", "estante", "livros"] },
  { texto: "Num restaurante chique", dicas: ["garçom", "conta cara", "guardanapo de pano"] },
  { texto: "Num elevador parado", dicas: ["aperto", "botão", "música ambiente"] },
  { texto: "Na feira de domingo", dicas: ["pastel", "caldo de cana", "barraca"] },
  { texto: "Numa mudança de casa", dicas: ["caixas", "caminhão", "fita adesiva"] },
  { texto: "Numa gincana da escola", dicas: ["equipes", "prova", "torcida"] },
  { texto: "Num navio de cruzeiro", dicas: ["piscina", "enjoo", "mar aberto"] },
  { texto: "Numa loja de roupas", dicas: ["provador", "cabide", "liquidação"] },
  { texto: "Num karaokê", dicas: ["microfone", "desafinado", "letra na tela"] },
  { texto: "Numa pescaria", dicas: ["anzol", "isca", "paciência"] },
  { texto: "No shopping", dicas: ["escada rolante", "vitrine", "praça de alimentação"] },
  { texto: "Num cartório", dicas: ["carimbo", "fila", "papelada"] },
  { texto: "Numa formatura", dicas: ["beca", "diploma", "discurso"] },
  { texto: "Na neve", dicas: ["frio", "boneco", "casaco"] },
  { texto: "Num aeroporto", dicas: ["mala", "embarque", "passaporte"] },
  { texto: "Numa padaria de manhã", dicas: ["pão francês", "café", "fila"] },
];

// Dicas do BOT impostor na Situação (ele não sabe a situação): coisas que
// servem pra quase qualquer lugar.
export const DICAS_GENERICAS_SITUACAO = [
  "muita gente", "barulho", "esperando", "cansaço", "conversa", "fila", "calor",
  "risada", "dinheiro", "celular", "pressa", "sentado", "em pé", "gente estranha",
];

// ---------------- PERGUNTA ----------------
// Pares: `pergunta` e `impostor` pedem respostas do MESMO TIPO (os dois
// números, os dois comidas, os dois lugares...), pra resposta do impostor
// poder passar batida. Na partida, qual das duas é a "da maioria" é
// sorteado (dobra as combinações). `tipo` escolhe o banco de respostas dos
// bots (RESPOSTAS_POR_TIPO); tipo "numero" usa a `faixa` [mín, máx].
export const PERGUNTAS = [
  { pergunta: "Quantas horas você dorme por noite?", impostor: "Quantas horas você passa no celular por dia?", tipo: "numero", faixa: [3, 10] },
  { pergunta: "Quantos irmãos você gostaria de ter?", impostor: "Quantos bichos de estimação você gostaria de ter?", tipo: "numero", faixa: [0, 5] },
  { pergunta: "Com quantos anos alguém vira adulto de verdade?", impostor: "Com quantos anos uma criança pode ter o primeiro celular?", tipo: "numero", faixa: [10, 25] },
  { pergunta: "Quantas vezes por semana você come arroz e feijão?", impostor: "Quantas vezes por semana você faz exercício?", tipo: "numero", faixa: [0, 7] },
  { pergunta: "De 0 a 10, quanto você gosta de acordar cedo?", impostor: "De 0 a 10, quanto você gosta de dia de chuva?", tipo: "numero", faixa: [0, 10] },
  { pergunta: "Quantos pães você come no café da manhã?", impostor: "Quantos copos de água você bebe por dia?", tipo: "numero", faixa: [1, 8] },
  { pergunta: "Quantos minutos você leva no banho?", impostor: "Quantos minutos você leva pra se arrumar pra sair?", tipo: "numero", faixa: [5, 40] },
  { pergunta: "De 0 a 10, quanto você cozinha bem?", impostor: "De 0 a 10, quanto você dança bem?", tipo: "numero", faixa: [0, 10] },
  { pergunta: "Quantos dias de férias seriam o ideal?", impostor: "Quantos dias você aguentaria sem internet?", tipo: "numero", faixa: [2, 30] },
  { pergunta: "Quantas fatias de pizza você come de uma vez?", impostor: "Quantos pastéis você come na feira?", tipo: "numero", faixa: [1, 6] },
  { pergunta: "Até que horas você fica acordado no fim de semana?", impostor: "Que horas você acorda no fim de semana?", tipo: "hora" },
  { pergunta: "Qual o horário perfeito pro almoço?", impostor: "Qual o horário perfeito pro jantar?", tipo: "hora" },
  { pergunta: "Qual comida você levaria pra uma ilha deserta?", impostor: "Qual comida você pediria no seu aniversário?", tipo: "comida" },
  { pergunta: "Qual o melhor sabor de pizza?", impostor: "Qual o melhor recheio de pastel?", tipo: "recheio" },
  { pergunta: "Qual comida você mais odeia?", impostor: "Qual comida você mais comia quando era criança?", tipo: "comida" },
  { pergunta: "Qual o melhor lanche da madrugada?", impostor: "Qual o melhor lanche pra levar pra escola?", tipo: "comida" },
  { pergunta: "Qual sabor de sorvete você escolheria?", impostor: "Qual sabor de bolo você escolheria?", tipo: "sabor" },
  { pergunta: "Qual lugar do mundo você mais quer conhecer?", impostor: "Pra onde você iria nas próximas férias?", tipo: "viagem" },
  { pergunta: "Onde você mais gosta de passar o domingo?", impostor: "Onde você passaria um dia inteiro sem enjoar?", tipo: "lugar" },
  { pergunta: "Qual o melhor esconderijo numa casa?", impostor: "Onde você guarda o que não quer que ninguém ache?", tipo: "comodo" },
  { pergunta: "Em qual cidade você moraria?", impostor: "Em qual cidade você passaria o Carnaval?", tipo: "viagem" },
  { pergunta: "Que animal você seria?", impostor: "Que animal você teria de estimação?", tipo: "animal" },
  { pergunta: "Qual o animal mais fofo?", impostor: "Qual o animal mais inteligente?", tipo: "animal" },
  { pergunta: "Qual animal você teria medo de encontrar numa trilha?", impostor: "Qual animal você gostaria de ver de perto?", tipo: "animal" },
  { pergunta: "O que você levaria pra uma ilha deserta?", impostor: "O que você nunca esquece quando sai de casa?", tipo: "objeto" },
  { pergunta: "Qual objeto da casa você mais usa?", impostor: "Qual objeto você vive perdendo?", tipo: "objeto" },
  { pergunta: "Que presente você gostaria de ganhar?", impostor: "Que presente você daria pro seu melhor amigo?", tipo: "objeto" },
  { pergunta: "Quem você chamaria pra dividir um apartamento?", impostor: "Quem você levaria numa viagem de carro?", tipo: "pessoa" },
  { pergunta: "Quem da sua família cozinha melhor?", impostor: "Quem da sua família é o mais engraçado?", tipo: "parente" },
  { pergunta: "Pra quem você ligaria numa emergência?", impostor: "Quem você chamaria pra jogar videogame?", tipo: "pessoa" },
  { pergunta: "Qual a cor do quarto dos seus sonhos?", impostor: "Qual a cor do carro dos seus sonhos?", tipo: "cor" },
  { pergunta: "Qual cor combina com segunda-feira?", impostor: "Qual cor combina com sexta-feira?", tipo: "cor" },
  { pergunta: "Com que frequência você canta no banho?", impostor: "Com que frequência você fala sozinho?", tipo: "frequencia" },
  { pergunta: "Com que frequência você come doce?", impostor: "Com que frequência você come fritura?", tipo: "frequencia" },
  { pergunta: "O que você faz quando está entediado?", impostor: "O que você faz num domingo de chuva?", tipo: "atividade" },
  { pergunta: "Qual superpoder você queria ter?", impostor: "Qual talento você queria ter?", tipo: "habilidade" },
  { pergunta: "Qual esporte você jogaria numa olimpíada?", impostor: "Qual esporte você mais gosta de assistir?", tipo: "esporte" },
  { pergunta: "Qual profissão você teria se dinheiro não importasse?", impostor: "Qual profissão você queria ter quando era criança?", tipo: "profissao" },
  { pergunta: "Qual estilo de música você ouve limpando a casa?", impostor: "Qual estilo de música você ouve na academia?", tipo: "estilo" },
  { pergunta: "Qual bebida você pede num restaurante?", impostor: "Qual bebida você toma no café da manhã?", tipo: "bebida" },
  { pergunta: "Que meio de transporte você mais usa?", impostor: "Que meio de transporte seria o mais divertido pra ir trabalhar?", tipo: "transporte" },
  { pergunta: "Qual o pior dia da semana?", impostor: "Qual o melhor dia pra fazer faxina?", tipo: "dia" },
];

// Respostas dos BOTS por tipo (as duas perguntas do par têm o mesmo tipo,
// então o bot impostor responde "no mesmo idioma" dos outros).
export const RESPOSTAS_POR_TIPO = {
  hora: ["7h", "8h", "9h", "10h", "11h", "meio-dia", "13h", "19h", "20h", "22h", "meia-noite", "1h da manhã"],
  comida: ["pizza", "lasanha", "feijoada", "coxinha", "hambúrguer", "sushi", "macarrão", "churrasco", "pão de queijo", "brigadeiro", "arroz e feijão", "strogonoff"],
  recheio: ["queijo", "calabresa", "frango com catupiry", "carne", "palmito", "portuguesa", "chocolate", "pizza", "milho"],
  sabor: ["chocolate", "morango", "baunilha", "coco", "limão", "doce de leite", "maracujá", "flocos", "prestígio"],
  viagem: ["Paris", "Disney", "Japão", "Fernando de Noronha", "Gramado", "Salvador", "Rio de Janeiro", "Nova York", "Portugal", "Recife"],
  lugar: ["em casa", "no parque", "na praia", "no shopping", "na casa da vó", "no sofá", "na piscina", "no cinema"],
  comodo: ["debaixo da cama", "no guarda-roupa", "na gaveta", "atrás do sofá", "na despensa", "no porão", "dentro de uma caixa"],
  animal: ["cachorro", "gato", "leão", "golfinho", "coruja", "capivara", "preguiça", "tubarão", "papagaio", "tartaruga", "cobra", "onça"],
  objeto: ["celular", "carregador", "fone de ouvido", "livro", "travesseiro", "guarda-chuva", "chave", "óculos", "controle remoto", "mochila", "videogame"],
  pessoa: ["minha mãe", "meu pai", "meu melhor amigo", "minha avó", "meu irmão", "minha prima", "um vizinho", "meu tio"],
  parente: ["minha mãe", "meu pai", "minha avó", "meu avô", "meu tio", "minha tia", "meu irmão", "minha irmã", "minha prima"],
  cor: ["azul", "verde", "amarelo", "roxo", "preto", "branco", "vermelho", "laranja", "rosa", "cinza"],
  frequencia: ["sempre", "nunca", "todo dia", "às vezes", "uma vez por semana", "quase nunca", "toda hora"],
  atividade: ["durmo", "vejo série", "jogo videogame", "como alguma coisa", "fico no celular", "leio", "saio pra andar", "cozinho", "arrumo o quarto"],
  habilidade: ["voar", "ficar invisível", "cantar bem", "tocar violão", "falar várias línguas", "ler mentes", "teletransporte", "desenhar"],
  esporte: ["futebol", "vôlei", "natação", "basquete", "skate", "tênis", "judô", "ginástica", "atletismo", "surfe"],
  profissao: ["professor", "médico", "astronauta", "bombeiro", "veterinário", "cozinheiro", "jogador de futebol", "cantor", "piloto"],
  estilo: ["funk", "sertanejo", "pagode", "rock", "pop", "MPB", "forró", "samba", "eletrônica", "rap"],
  bebida: ["suco de laranja", "café", "refrigerante", "água", "chá", "leite", "guaraná", "água de coco", "limonada"],
  transporte: ["ônibus", "bicicleta", "carro", "metrô", "a pé", "patinete", "moto", "helicóptero", "barco"],
  dia: ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"],
};

// ---------------- HISTÓRIA ----------------
export const HISTORIAS = [
  "Uma viagem à praia",
  "O primeiro dia na escola nova",
  "Um casamento que deu tudo errado",
  "Uma festa surpresa",
  "Perdidos no shopping",
  "Um acampamento na floresta",
  "Uma ceia de Natal em família",
  "A mudança para uma casa nova",
  "Um dia no zoológico",
  "Uma viagem de ônibus pra casa da vó",
  "A final do campeonato de futebol",
  "Uma noite de tempestade sem luz",
  "O cachorro que fugiu de casa",
  "Uma aventura no espaço",
  "Um passeio no parque de diversões",
  "Gravando um vídeo pra internet",
  "Uma receita que deu errado",
  "O show da banda favorita",
  "Uma caça ao tesouro",
  "Um dia trabalhando no supermercado",
  "A primeira viagem de avião",
  "A apresentação de trabalho na escola",
  "Uma festa junina no interior",
  "Um piquenique no parque",
  "Um passeio de barco",
  "O primeiro dia no emprego novo",
  "Uma consulta no dentista",
  "Um feriado na fazenda",
  "Uma maratona de videogame",
  "Uma competição de dança",
  "Um navio pirata",
  "Um mistério na biblioteca",
];

// Frases dos BOTS na História (servem pra qualquer tema — o bot impostor
// não sabe o tema, e o tripulante bot também não tenta ser esperto).
export const FRASES_GENERICAS = [
  "De repente, todo mundo começou a rir sem parar.",
  "Foi aí que alguém gritou lá do fundo.",
  "Ninguém esperava o que aconteceu depois.",
  "Eu fiquei parado sem saber o que fazer.",
  "Então apareceu um cara estranho de chapéu.",
  "Todo mundo ficou olhando pra mim.",
  "No fim deu tudo certo, ou quase.",
  "Começou a chover bem na hora errada.",
  "Meu celular descarregou no pior momento.",
  "A gente resolveu parar um pouco pra pensar.",
  "Alguém esqueceu a coisa mais importante.",
  "Aí bateu uma fome absurda.",
  "Parecia um sonho, mas era real.",
  "Minha mãe ligou perguntando se estava tudo bem.",
  "Eu tirei um monte de fotos pra lembrar depois.",
  "Um barulho estranho veio lá de fora.",
  "Foi o momento mais engraçado da minha vida.",
  "O plano era perfeito, só que não.",
  "Tivemos que correr pra não perder a hora.",
  "Meu amigo tropeçou e quase caiu de cara.",
  "Aí o tempo começou a passar voando.",
  "Todo mundo aplaudiu no final.",
  "Eu jurei que nunca mais faria aquilo.",
];

// ---------------- sorteio ----------------
const sortear = (lista, aleatorio) => lista[Math.floor(aleatorio() * lista.length)];

// Sorteia o conteúdo da partida, evitando o que a sala já usou (`jaUsados`
// = histórico de segredos da sala). Quando esgota, libera tudo de novo.
// Devolve { tema, palavra, ... }: `palavra` é SEMPRE o segredo da partida
// (situação, pergunta da maioria ou tema da história) — a sala trata esse
// campo igual à palavra do modo Palavra (nunca vai pro impostor antes da hora).
export function sortearConteudo(modo, jaUsados = [], aleatorio = Math.random) {
  const usados = new Set(jaUsados);
  const livres = (lista, chave) => {
    const l = lista.filter((x) => !usados.has(chave(x)));
    return l.length ? l : lista;
  };
  if (modo === "situacao") {
    const s = sortear(livres(SITUACOES, (x) => x.texto), aleatorio);
    return { tema: "Situação", palavra: s.texto };
  }
  if (modo === "historia") {
    return { tema: "História", palavra: sortear(livres(HISTORIAS, (x) => x), aleatorio) };
  }
  if (modo === "pergunta") {
    const par = sortear(livres(PERGUNTAS, (x) => x.pergunta), aleatorio);
    // Metade das vezes a pergunta "do impostor" é a da maioria.
    const trocar = aleatorio() < 0.5;
    return {
      tema: "Pergunta",
      palavra: trocar ? par.impostor : par.pergunta,
      perguntaImpostor: trocar ? par.pergunta : par.impostor,
    };
  }
  return null;
}

// As 6 opções da última chance (Situação e História): o segredo + 5 outras
// da mesma lista, embaralhadas.
export function opcoesDoChute(modo, segredo, aleatorio = Math.random, total = 6) {
  const lista = modo === "situacao" ? SITUACOES.map((s) => s.texto) : modo === "historia" ? HISTORIAS : [];
  const outras = lista.filter((x) => x !== segredo);
  const escolhidas = [];
  while (escolhidas.length < total - 1 && outras.length) {
    escolhidas.push(outras.splice(Math.floor(aleatorio() * outras.length), 1)[0]);
  }
  return embaralhar([segredo, ...escolhidas], aleatorio);
}

// Pros bots: acham o par/situação a partir do texto que receberam na carta.
export function situacaoPorTexto(texto) {
  return SITUACOES.find((s) => s.texto === texto) || null;
}
export function parDaPergunta(texto) {
  return PERGUNTAS.find((p) => p.pergunta === texto || p.impostor === texto) || null;
}
