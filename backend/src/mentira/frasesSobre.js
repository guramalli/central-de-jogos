// MENTIRA SINCERA — modo "SOBRE VOCÊS": frases sobre os próprios jogadores.
//
//   eu   — como a pessoa vê na hora de CONFESSAR a verdade;
//   ele  — como aparece na rodada ({n} = nick de quem confessou);
//   casa — mentiras da casa (completam as opções quando há pouca gente).
//
// Escritas sem marcar gênero ("o apelido de {n}", nunca "ele/ela") e sem
// temas sensíveis (saúde, vida íntima, crime) — é pra rir em live, não
// pra expor ninguém.

export const FRASES_SOBRE = [
  { id: "aposta", eu: "Uma vez eu comi ___ por aposta.", ele: "{n} uma vez comeu ___ por aposta.", casa: ["uma formiga viva", "ração de cachorro"] },
  { id: "apelido", eu: "O apelido mais vergonhoso que eu já tive foi ___.", ele: "O apelido mais vergonhoso que {n} já teve foi ___.", casa: ["Batata", "Pé de Pano"] },
  { id: "mega", eu: "Se eu ganhasse na Mega-Sena, a primeira coisa que eu compraria seria ___.", ele: "Se ganhasse na Mega-Sena, a primeira coisa que {n} compraria seria ___.", casa: ["um jet ski", "uma fazenda de alpacas"] },
  { id: "medo", eu: "Meu maior medo bobo é ___.", ele: "O maior medo bobo de {n} é ___.", casa: ["borboleta", "palhaço"] },
  { id: "chuveiro", eu: "A música que eu canto no chuveiro é ___.", ele: "A música que {n} canta no chuveiro é ___.", casa: ["Evidências", "Ai Se Eu Te Pego"] },
  { id: "bronca", eu: "Na escola, eu levei bronca por ___.", ele: "Na escola, {n} levou bronca por ___.", casa: ["colar na prova", "dormir na aula"] },
  { id: "emprego", eu: "Meu primeiro trabalho foi ___.", ele: "O primeiro trabalho de {n} foi ___.", casa: ["vender picolé na praia", "entregar panfleto"] },
  { id: "madrugada", eu: "Minha comida favorita de madrugada é ___.", ele: "A comida favorita de {n} de madrugada é ___.", casa: ["miojo cru", "pão com ovo"] },
  { id: "talento", eu: "Um talento inútil que eu tenho é ___.", ele: "Um talento inútil de {n} é ___.", casa: ["mexer as orelhas", "imitar galinha"] },
  { id: "rua", eu: "A coisa mais estranha que eu já achei na rua foi ___.", ele: "A coisa mais estranha que {n} já achou na rua foi ___.", casa: ["uma dentadura", "um pé de sapato só"] },
  { id: "animal", eu: "Se eu fosse um animal, seria ___.", ele: "Se fosse um animal, {n} seria ___.", casa: ["uma preguiça", "uma capivara"] },
  { id: "idolo", eu: "Meu ídolo de infância era ___.", ele: "O ídolo de infância de {n} era ___.", casa: ["a Xuxa", "o Power Ranger vermelho"] },
  { id: "vergonha", eu: "Eu já passei vergonha em público quando ___.", ele: "{n} já passou vergonha em público quando ___.", casa: ["tropeçou na escada rolante", "chamou a professora de mãe"] },
  { id: "presente", eu: "O pior presente que eu já ganhei foi ___.", ele: "O pior presente que {n} já ganhou foi ___.", casa: ["um par de meias", "um peso de porta"] },
  { id: "mania", eu: "Eu tenho mania de ___.", ele: "{n} tem mania de ___.", casa: ["estalar os dedos", "conferir se a porta está trancada"] },
  { id: "desenho", eu: "Meu desenho animado favorito era ___.", ele: "O desenho animado favorito de {n} era ___.", casa: ["o Pica-Pau", "a Pantera Cor-de-Rosa"] },
  { id: "dormir", eu: "O lugar mais estranho onde eu já dormi foi ___.", ele: "O lugar mais estranho onde {n} já dormiu foi ___.", casa: ["no ônibus", "numa rede de pesca"] },
  { id: "jantar", eu: "Se eu pudesse jantar com qualquer famoso, escolheria ___.", ele: "Se pudesse jantar com qualquer famoso, {n} escolheria ___.", casa: ["o Faustão", "a Anitta"] },
  { id: "odeio", eu: "Uma comida que eu odeio é ___.", ele: "Uma comida que {n} odeia é ___.", casa: ["jiló", "quiabo"] },
  { id: "pet", eu: "O nome do meu primeiro bicho de estimação foi ___.", ele: "O nome do primeiro bicho de estimação de {n} foi ___.", casa: ["Rex", "Bolinha"] },
  { id: "serie", eu: "Minha série favorita de todos os tempos é ___.", ele: "A série favorita de todos os tempos de {n} é ___.", casa: ["Chaves", "Friends"] },
  { id: "quebrei", eu: "A coisa mais cara que eu já quebrei foi ___.", ele: "A coisa mais cara que {n} já quebrou foi ___.", casa: ["a TV da sala", "o celular da mãe"] },
  { id: "poder", eu: "Meu superpoder ideal seria ___.", ele: "O superpoder ideal de {n} seria ___.", casa: ["voar", "teletransporte"] },
  { id: "mentira", eu: "Uma mentira que eu contava quando criança era ___.", ele: "Uma mentira que {n} contava quando criança era ___.", casa: ["que tinha um primo famoso", "que sabia karatê"] },
  { id: "chorar", eu: "Eu choro toda vez que assisto ___.", ele: "{n} chora toda vez que assiste ___.", casa: ["Marley e Eu", "Toy Story 3"] },
  { id: "inutil", eu: "O objeto mais inútil que eu tenho em casa é ___.", ele: "O objeto mais inútil que {n} tem em casa é ___.", casa: ["uma sanfona", "uma panela de fondue"] },
  { id: "palavra", eu: "Minha primeira palavra foi ___.", ele: "A primeira palavra de {n} foi ___.", casa: ["papai", "água"] },
  { id: "dia", eu: "Eu nunca vou esquecer o dia em que ___.", ele: "{n} nunca vai esquecer o dia em que ___.", casa: ["caiu na piscina de roupa", "viu o mar pela primeira vez"] },
  { id: "bordao", eu: "Se eu tivesse um bordão, seria ___.", ele: "Se tivesse um bordão, o de {n} seria ___.", casa: ["partiu!", "é nóis"] },
  { id: "karaoke", eu: "No karaokê, a música que eu escolho é ___.", ele: "No karaokê, a música que {n} escolhe é ___.", casa: ["Garçom", "Evidências"] },
];

// "Verdades" que os BOTS de teste confessam.
export const VERDADES_BOT = ["um pato de borracha", "uma bicicleta ergométrica", "o Silvio Santos", "pão de queijo congelado", "um fusca azul", "uma galinha d'angola", "a vizinha do 302", "um tamanduá de pelúcia"];
