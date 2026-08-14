// Séries e Streaming — perguntas para a sala PADRÃO (fácil + médio).
//
// Estilo pedido pelo Gustavinho: protagonistas, personagens marcantes,
// plataformas e enredo básico. Regras de sempre:
//  - resposta nunca aparece no enunciado;
//  - só fato consolidado e sem ambiguidade (nada de "melhor série do ano");
//  - resposta curta; spoilers pesados evitados.
//
// Importado por: npm run import-series-padrao
export const SERIES_PADRAO = {
  series: [
    // ===== Protagonistas =====
    { question: "Qual é o nome do xerife que acorda de um coma e lidera sobreviventes em The Walking Dead?", answer: "Rick", difficulty: "facil" },
    { question: "Qual é o nome do professor de química que vira fabricante de drogas em Breaking Bad?", answer: "Walter White", difficulty: "facil" },
    { question: "Qual é o apelido criminoso que Walter White adota em Breaking Bad?", answer: "Heisenberg", difficulty: "medio" },
    { question: "Qual é o nome do agente de narcóticos que caça Pablo Escobar na série Narcos?", answer: "Murphy", difficulty: "medio" },
    { question: "Qual é o nome do protagonista publicitário da série Mad Men?", answer: "Don Draper", difficulty: "medio" },
    { question: "Qual é o advogado trapaceiro protagonista de Better Call Saul?", answer: "Saul Goodman", difficulty: "medio" },
    { question: "Qual é o nome do serial killer que trabalha como perito de análise de sangue na polícia de Miami?", answer: "Dexter", difficulty: "facil" },
    { question: "Qual é o sobrenome da família que comanda um império de mídia na série Succession?", answer: "Roy", difficulty: "medio" },
    { question: "Qual é o nome do líder da gangue na série Peaky Blinders?", answer: "Thomas Shelby", difficulty: "medio" },
    { question: "Qual é o nome do químico soviético que investiga o desastre na minissérie Chernobyl?", answer: "Legasov", difficulty: "medio" },

    // ===== Stranger Things =====
    { question: "Qual é o nome da menina com poderes telecinéticos em Stranger Things?", answer: "Eleven", difficulty: "facil" },
    { question: "Como é chamada a dimensão paralela e sombria de Stranger Things?", answer: "Mundo Invertido", difficulty: "medio" },
    { question: "Qual é o nome do garoto que desaparece no início da primeira temporada de Stranger Things?", answer: "Will", difficulty: "medio" },
    { question: "Em qual cidade fictícia americana se passa Stranger Things?", answer: "Hawkins", difficulty: "medio" },
    { question: "Qual é o nome do vilão humano-monstro da quarta temporada de Stranger Things?", answer: "Vecna", difficulty: "medio" },

    // ===== Game of Thrones =====
    { question: "Qual é o sobrenome da família a que Jon Snow foi criado como bastardo em Game of Thrones?", answer: "Stark", difficulty: "facil" },
    { question: "Qual personagem é chamada de Mãe dos Dragões em Game of Thrones?", answer: "Daenerys", difficulty: "facil" },
    { question: "Qual é o assento cobiçado que dá o poder sobre os Sete Reinos em Game of Thrones?", answer: "Trono de Ferro", difficulty: "facil" },
    { question: "Como são chamados os mortos-vivos que avançam do norte da Muralha em Game of Thrones?", answer: "Whitewalkers", difficulty: "medio" },
    { question: "Qual anão da família Lannister é conhecido por sua astúcia em Game of Thrones?", answer: "Tyrion", difficulty: "medio" },
    { question: "Qual série derivada de Game of Thrones conta a história da Casa Targaryen?", answer: "House of the Dragon", difficulty: "medio" },

    // ===== La Casa de Papel e internacionais =====
    { question: "Qual é o codinome do líder que planeja o assalto em La Casa de Papel?", answer: "Professor", difficulty: "facil" },
    { question: "Que tipo de máscara os assaltantes usam em La Casa de Papel?", answer: "Salvador Dalí", difficulty: "medio" },
    { question: "Qual jogo infantil dá nome mortal à competição da série sul-coreana Round 6?", answer: "Batatinha frita 1, 2, 3", difficulty: "medio" },
    { question: "Qual série alemã da Netflix envolve viagens no tempo na cidade de Winden?", answer: "Dark", difficulty: "medio" },
    { question: "Qual série britânica mostra futuros distópicos e tecnológicos em episódios independentes?", answer: "Black Mirror", difficulty: "facil" },
    { question: "Qual série da BBC moderniza o detetive de Baker Street com Benedict Cumberbatch?", answer: "Sherlock", difficulty: "medio" },

    // ===== Comédias e clássicos =====
    { question: "Qual sitcom acompanha um grupo de amigos num café chamado Central Perk em Nova York?", answer: "Friends", difficulty: "facil" },
    { question: "Qual sitcom sobre físicos nerds tem o personagem Sheldon Cooper?", answer: "The Big Bang Theory", difficulty: "facil" },
    { question: "Qual série de comédia se passa no escritório da empresa de papel Dunder Mifflin?", answer: "The Office", difficulty: "facil" },
    { question: "Qual desenho animado adulto acompanha a família amarela de Springfield?", answer: "Os Simpsons", difficulty: "facil" },
    { question: "Qual série animada tem um cientista alcoólatra e seu neto viajando por dimensões?", answer: "Rick and Morty", difficulty: "facil" },
    { question: "Qual sitcom narra como o protagonista Ted conheceu a mãe de seus filhos?", answer: "How I Met Your Mother", difficulty: "medio" },
    { question: "Qual desenho adulto de Seth MacFarlane acompanha os Griffin e o bebê genial Stewie?", answer: "Family Guy", difficulty: "medio" },

    // ===== Plataformas de streaming =====
    { question: "Qual plataforma de streaming produziu Stranger Things e La Casa de Papel?", answer: "Netflix", difficulty: "facil" },
    { question: "Qual serviço de streaming reúne os catálogos de Marvel, Star Wars, Pixar e dos clássicos animados do camundongo?", answer: "Disney+", difficulty: "facil" },
    { question: "Qual plataforma de streaming da Amazon exibe The Boys e The Lord of the Rings?", answer: "Prime Video", difficulty: "facil" },
    { question: "Qual serviço de streaming lançou The Last of Us e House of the Dragon?", answer: "HBO Max", difficulty: "medio" },
    { question: "Qual plataforma de streaming da fabricante do iPhone produziu Ted Lasso e Severance?", answer: "Apple TV+", difficulty: "medio" },

    // ===== Super-heróis e ação =====
    { question: "Qual série da Amazon mostra super-heróis corruptos e um grupo que os combate?", answer: "The Boys", difficulty: "facil" },
    { question: "Qual série da Marvel acompanha o arqueiro dos Vingadores numa aventura natalina em Nova York?", answer: "Hawkeye", difficulty: "medio" },
    { question: "Qual série da Marvel acompanha a Feiticeira Escarlate num subúrbio de sitcom?", answer: "WandaVision", difficulty: "medio" },
    { question: "Qual série derivada de Star Wars tem um caçador de recompensas e o Grogu?", answer: "The Mandalorian", difficulty: "facil" },
    { question: "Qual série da DC tem o anti-herói Pacificador vivido por John Cena?", answer: "Peacemaker", difficulty: "medio" },

    // ===== Drama e suspense =====
    { question: "Qual série mostra a rainha Elizabeth II e a família real britânica ao longo das décadas?", answer: "The Crown", difficulty: "facil" },
    { question: "Qual série de xadrez acompanha a órfã prodígio Beth Harmon?", answer: "O Gambito da Rainha", difficulty: "medio" },
    { question: "Qual série acompanha um contador que é forçado a lavar dinheiro para um cartel mexicano numa região de lagos?", answer: "Ozark", difficulty: "medio" },
    { question: "Qual série adaptada de videogame acompanha Joel e Ellie num mundo pós-apocalíptico?", answer: "The Last of Us", difficulty: "facil" },
    { question: "Qual série da Netflix dirigida por Tim Burton foca na filha sombria da Família Addams?", answer: "Wandinha", difficulty: "facil" },

    // ===== Brasileiras =====
    { question: "Qual série brasileira da Netflix se passa num futuro com o teste do Processo e o Maralto?", answer: "3%", difficulty: "medio" },
    { question: "Qual série brasileira acompanha os amigos Acerola e Laranjinha numa favela carioca?", answer: "Cidade dos Homens", difficulty: "medio" },
    { question: "Qual novela de época da Globo narra o romance de imigrantes italianos que vêm colher café no Brasil, com Ana Paula Arósio?", answer: "Terra Nostra", difficulty: "medio" },

    // ===== Personagens e bordões =====
    { question: "Qual médico misantropo e genial resolve casos impossíveis mancando com uma bengala?", answer: "Dr. House", difficulty: "medio" },
    { question: "Qual série médica se passa no hospital Seattle Grace e tem a protagonista Meredith?", answer: "Grey's Anatomy", difficulty: "facil" },
    { question: "Qual série de fantasia adaptada dos livros tem o bruxo Geralt de Rívia?", answer: "The Witcher", difficulty: "medio" },
    { question: "Qual série derivada da saga do xerife Rick se passa em Los Angeles no começo do apocalipse zumbi?", answer: "Fear the Walking Dead", difficulty: "medio" },
    { question: "Qual série policial teve as franquias SVU e Criminal Intent e a sigla que abre com dois toques sonoros?", answer: "Law & Order", difficulty: "medio" },
    { question: "Quantos episódios tem a série Game of Thrones ao todo?", answer: "73", difficulty: "medio" },
    { question: "Quantas temporadas tem a série Game of Thrones?", answer: "Oito", difficulty: "facil" },
    { question: "Qual série de comédia esportiva tem um técnico americano dirigindo um time de futebol inglês?", answer: "Ted Lasso", difficulty: "facil" },
  ],
};
