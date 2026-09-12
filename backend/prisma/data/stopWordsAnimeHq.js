// Tema "Anime e HQ" do Stop.
//
// ESCOPO: obras (animes, mangás, quadrinhos) e PERSONAGENS delas. É largo de
// propósito — quem joga escreve tanto "Naruto" (obra e personagem) quanto
// "Batman" (personagem). Restringir a só um dos dois recusaria resposta
// legítima.
//
// FICAM DE FORA, e a fronteira precisa ficar clara porque é ela que decide
// se a resposta vale na rodada:
//   - editoras e estúdios (Marvel, DC, Panini, Toei)
//   - termos do meio (mangá, otaku, cosplay, gibi)
//   - desenhos ocidentais de TV sem quadrinho (Bob Esponja, Kung Fu Panda)
//   - filmes live-action e pessoas reais
//
// CRITÉRIO DE INCLUSÃO — por que a lista é generosa:
// A validação em sala normal é correspondência EXATA. Palavra real ausente
// vira ponto perdido e sensação de injustiça. Por isso entram as formas que
// o brasileiro digita de fato: "Cavaleiros do Zodíaco" E "Saint Seiya",
// "Homem-Aranha" E "Spider-Man", "Dragon Ball" E "DBZ".
//
// A normalização tira acento e caixa, então "Pokémon" cobre "pokemon".
//
// TODA entrada aqui é obra ou personagem verificável. Nada inventado pra
// preencher letra difícil — uma palavra falsa no glossário é pior que uma
// letra magra, porque valida resposta errada pra sempre.
export const ANIME_HQ_WORDS = {
  A: [
    "Akira", "Astro Boy", "Attack on Titan", "Ataque dos Titãs", "Aquaman",
    "Arlequina", "Alucard", "Asterix", "Ayanami Rei", "Alphonse Elric",
    "Ash Ketchum", "Angel Beats", "Ai Yazawa", "Armin Arlert",
  ],
  B: [
    "Batman", "Bleach", "Berserk", "Boku no Hero", "Bulma",
    "Brook", "Bidu", "Black Clover", "Blue Lock", "Beyblade",
    "Bane", "Bakugo", "Bem 10", "Bruce Wayne",
  ],
  C: [
    "Cavaleiros do Zodíaco", "Capitão América", "Coringa", "Cebolinha",
    "Cascão", "Chico Bento", "Charlie Brown", "Cowboy Bebop", "Code Geass",
    "Chainsaw Man", "Cyborg", "Constantine", "Chopper", "Clark Kent",
  ],
  D: [
    "Dragon Ball", "Death Note", "Demon Slayer", "Doraemon", "Digimon",
    "Deadpool", "Doutor Estranho", "Dr. Slump", "DBZ", "Devilman",
    "Dandadan", "Dio Brando", "Duas Caras", "Deku",
  ],
  E: [
    "Evangelion", "Elektra", "Eren Yeager", "Edward Elric", "Erza Scarlet",
    "Esquadrão Suicida", "Eiichiro Oda", "Escanor", "Elfen Lied",
    "Eustáquio", "Ed Edd e Eddy", "Estrela Negra",
  ],
  F: [
    "Fullmetal Alchemist", "Fairy Tail", "Flash", "Freeza", "Franjinha",
    "Feiticeira Escarlate", "Fire Force", "Falcão", "Frieren",
    "Fantasma", "Fullmetal Panic", "Franky",
  ],
  G: [
    "Goku", "Gohan", "Gon", "Gintama", "Ghost in the Shell",
    "Gasparzinho", "Gavião Arqueiro", "Garfield", "Grendizer",
    "Gundam", "Gaara", "Guts", "Gwen Stacy",
  ],
  H: [
    "Hulk", "Homem-Aranha", "Homem de Ferro", "Hunter x Hunter", "Haikyuu",
    "Hinata", "Hellsing", "Hellboy", "Harley Quinn", "Homem-Formiga",
    "Hisoka", "Hawkgirl", "Hagar", "Hiei",
  ],
  I: [
    "Inuyasha", "Ichigo", "Itachi", "Iron Man", "Invencível",
    "Irmãos Metralha", "Ikki", "Inazuma Eleven", "Ivy Venenosa",
    "Ippo", "Isaac", "Inosuke",
  ],
  J: [
    "Jujutsu Kaisen", "JoJo", "Jotaro", "Justiceiro", "Jiraiya",
    "Jean Grey", "Jonathan Joestar", "Juvia", "Joseph Joestar",
    "Jiren", "Jean Kirstein",
  ],
  L: [
    "Luffy", "Liga da Justiça", "Lanterna Verde", "Levi Ackerman",
    "Light Yagami", "Luluca", "Loki", "Little Nemo", "Lupin",
    "Lion-O", "Lex Luthor", "Lucy",
  ],
  M: [
    "Mônica", "Magali", "Mulher-Maravilha", "My Hero Academia", "Mob Psycho",
    "Maurício de Sousa", "Madara", "Mewtwo", "Mafalda", "Mestre Kame",
    "Meliodas", "Magneto", "Mulher-Gato", "Mazinger", "Mikasa",
  ],
  N: [
    "Naruto", "Nami", "Nico Robin", "Nezuko", "Noragami",
    "Namor", "Nightwing", "Nana", "Nick Fury", "Nobita",
    "Neji", "Nightcrawler",
  ],
  O: [
    "One Piece", "One Punch Man", "Overlord", "Optimus Prime",
    "Orochimaru", "Olívia Palito", "Osamu Tezuka", "Obelix",
    "Oggy", "Obito", "Orihime",
  ],
  P: [
    "Pokémon", "Pikachu", "Piccolo", "Pantera Negra", "Popeye",
    "Professor Xavier", "Papa-Capim", "Pinguim", "Punisher",
    "Paranoia Agent", "Patrulha do Destino", "Pain", "Portgas D. Ace",
  ],
  Q: [
    "Quarteto Fantástico", "Quicksilver", "Quasar", "Queen Millennia",
    "Quatro Cavaleiros do Apocalipse",
  ],
  R: [
    "Robin", "Rock Lee", "Ranma", "Rurouni Kenshin", "Roronoa Zoro",
    "Riquinho", "Rorschach", "Rukia", "Ryuk", "Robotech",
    "Rogue", "Rei Piccolo", "Roy Mustang",
  ],
  S: [
    "Saint Seiya", "Sailor Moon", "Sasuke", "Sakura", "Shingeki no Kyojin",
    "Superman", "Shazam", "Slam Dunk", "Snoopy", "Sansão",
    "Seiya", "Spawn", "Sanji", "Shikamaru", "Spider-Man",
  ],
  T: [
    "Tokyo Ghoul", "Thor", "Tartarugas Ninja", "Trunks", "Tanjiro",
    "Tintim", "Titãs", "Tsubasa", "Turma da Mônica", "Tocha Humana",
    "Tenchi", "Tobi", "Toriyama",
  ],
  U: [
    "Ultraman", "Usopp", "Uzumaki", "Ulquiorra", "Urashiman",
    "Uryu Ishida", "Uub",
  ],
  V: [
    "Vegeta", "Vingadores", "Venom", "Vagabond", "Violet Evergarden",
    "Viúva Negra", "Visão", "Voltron", "Vovó Donalda", "Vash",
  ],
  X: [
    "X-Men", "Xamã Rei", "Xavier", "Xerxes",
  ],
  Z: [
    "Zoro", "Zatch Bell", "Zé Carioca", "Zatanna", "Zenitsu",
    "Zod", "Zabuza", "Zoldyck",
  ],
};
