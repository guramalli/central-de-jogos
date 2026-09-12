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
//
// AMPLIADO com a curadoria do Gustavinho (setembro/2026), que trouxe muito
// personagem de HQ americana e de anime recente.
//
// O QUE FICOU DE FORA daquela lista:
//   - "Eimi Fukada": é atriz de filme adulto japonesa, não personagem. Num
//     site com público de todas as idades, isso não entra em glossário
//     nenhum.
//   - o que não é anime nem HQ: Pac-Man (jogo), Euphoria (série), Dobby e
//     Legolas (livros), Furiosa (filme), Frankenstein, Quasimodo.
//   - personagens de Star Wars (Luke Skywalker, Jango Fett, Palpatine).
//     Existem HQs, mas a origem é cinema — se entrarem, a fronteira do tema
//     deixa de existir.
//   - K, W e Y: letras que o Stop não sorteia. Isso descartou blocos
//     inteiros da lista (Kakashi, Wolverine, Yu-Gi-Oh).
export const ANIME_HQ_WORDS = {
  A: [
    "Akira", "Astro Boy", "Attack on Titan", "Ataque dos Titãs",
    "Aquaman", "Arlequina", "Alucard", "Asterix",
    "Ayanami Rei", "Alphonse Elric", "Ash Ketchum", "Angel Beats",
    "Ai Yazawa", "Armin Arlert", "Avengers", "Aang",
    "Asuka-Langley", "Arqueiro-Verde", "All-Might", "Anya-Forger",
    "Ant-Man", "Agent-Venom", "Azazel", "Apocalypse",
    "Aqualad",
  ],
  B: [
    "Batman", "Bleach", "Berserk", "Boku no Hero",
    "Bulma", "Brook", "Bidu", "Black Clover",
    "Blue Lock", "Beyblade", "Bane", "Bakugo",
    "Bem 10", "Bruce Wayne", "Batgirl", "Black-Panther",
    "Blade", "Boruto", "Baki", "Blue-Beetle",
    "Bucky-Barnes", "Beast-Boy", "Broly", "Black-Widow",
    "Brainiac", "Bloodshot", "Bizarro", "Booster-Gold",
  ],
  C: [
    "Cavaleiros do Zodíaco", "Capitão América", "Coringa", "Cebolinha",
    "Cascão", "Chico Bento", "Charlie Brown", "Cowboy Bebop",
    "Code Geass", "Chainsaw Man", "Cyborg", "Constantine",
    "Chopper", "Clark Kent", "Captain-America", "Catwoman",
    "Captain-Marvel", "Cyberpunk-Edgerunners", "Cardcaptor-Sakura", "Cyclops",
    "Cable", "Carnage", "Cell", "Chun-Li",
    "Chise-Hatori", "Ciel-Phantomhive",
  ],
  D: [
    "Dragon Ball", "Death Note", "Demon Slayer", "Doraemon",
    "Digimon", "Deadpool", "Doutor Estranho", "Dr. Slump",
    "DBZ", "Devilman", "Dandadan", "Dio Brando",
    "Duas Caras", "Deku", "Darkseid", "Doomsday",
    "Dick-Grayson", "Damian-Wayne", "Denji", "Dazai-Osamu",
    "Doflamingo", "Dororo", "Dr-Stone", "Deathstroke",
    "Dazzler", "Dr-Manhattan",
  ],
  E: [
    "Evangelion", "Elektra", "Eren Yeager", "Edward Elric",
    "Erza Scarlet", "Esquadrão Suicida", "Eiichiro Oda", "Escanor",
    "Elfen Lied", "Eustáquio", "Ed Edd e Eddy", "Estrela Negra",
    "Emma-Frost", "Etrigan", "Eobard-Thawne", "Enid-Sinclair",
    "Eijiro-Kirishima", "Esdeath", "Echo", "Elongated-Man",
    "Enchantress", "Emiya-Shirou", "Eru-Chitanda",
  ],
  F: [
    "Fullmetal Alchemist", "Fairy Tail", "Flash", "Freeza",
    "Franjinha", "Feiticeira Escarlate", "Fire Force", "Falcão",
    "Frieren", "Fantasma", "Fullmetal Panic", "Franky",
    "Fantastic-Four", "Falcon", "Firestorm", "Fushiguro-Megumi",
    "Frank-Castle", "Flash-Thompson", "Fênix-Negra", "Fuu",
    "Fujiko-Mine", "Fubuki", "Fate-Stay-Night", "Fire-Punch",
    "Fruits-Basket",
  ],
  G: [
    "Goku", "Gohan", "Gon", "Gintama",
    "Ghost in the Shell", "Gasparzinho", "Gavião Arqueiro", "Garfield",
    "Grendizer", "Gundam", "Gaara", "Guts",
    "Gwen Stacy", "Griffith", "Green-Lantern", "Green-Arrow",
    "Groot", "Ghost-Rider", "Gamora", "Great-Teacher-Onizuka",
    "Gon-Freecss", "Gilgamesh", "Goro-Majima", "Gorilla-Grodd",
    "Gambit", "Galactus",
  ],
  H: [
    "Hulk", "Homem-Aranha", "Homem de Ferro", "Hunter x Hunter",
    "Haikyuu", "Hinata", "Hellsing", "Hellboy",
    "Harley Quinn", "Homem-Formiga", "Hisoka", "Hawkgirl",
    "Hagar", "Hiei", "Hawkeye", "Hinata-Hyuga",
    "Hajime-no-Ippo", "Himiko-Toga", "Hela", "Havok",
    "Hawkman", "Hush", "Hyouka",
  ],
  I: [
    "Inuyasha", "Ichigo", "Itachi", "Iron Man",
    "Invencível", "Irmãos Metralha", "Ikki", "Inazuma Eleven",
    "Ivy Venenosa", "Ippo", "Isaac", "Inosuke",
    "Initial-D", "Ichigo-Kurosaki", "Itachi-Uchiha", "Inosuke-Hashibira",
    "Invisible-Woman", "Ikaris", "Iceman", "Izuku-Midoriya",
    "Iria", "Issei-Hyoudou", "Izo", "Iris-West",
    "Ironheart", "Iznogoud",
  ],
  J: [
    "Jujutsu Kaisen", "JoJo", "Jotaro", "Justiceiro",
    "Jiraiya", "Jean Grey", "Jonathan Joestar", "Juvia",
    "Joseph Joestar", "Jiren", "Jean Kirstein", "Joker",
    "Jean-Grey", "Juggernaut", "Jonah-Hex", "Jessica-Jones",
    "John-Constantine", "Jotaro-Kujo", "Jolyne-Cujoh", "Jin-Sakai",
    "Jace-Beleren", "Justice-League", "Juuzou-Suzuya", "Johan-Liebert",
  ],
  L: [
    "Luffy", "Liga da Justiça", "Lanterna Verde", "Levi Ackerman",
    "Light Yagami", "Luluca", "Loki", "Little Nemo",
    "Lupin", "Lion-O", "Lex Luthor", "Lucy",
    "Lawliet", "Lelouch-Lamperouge", "Lex-Luthor", "Lois-Lane",
    "Luke-Cage", "Lobo", "Launch", "Lizard",
    "Lady-Deathstrike", "Lucky-Luke", "Love-Hina", "Lupin-III",
  ],
  M: [
    "Mônica", "Magali", "Mulher-Maravilha", "My Hero Academia",
    "Mob Psycho", "Maurício de Sousa", "Madara", "Mewtwo",
    "Mafalda", "Mestre Kame", "Meliodas", "Magneto",
    "Mulher-Gato", "Mazinger", "Mikasa", "Mob-Psycho",
    "Monster", "Mushishi", "Mystique", "Moon-Knight",
    "Miles-Morales", "Martian-Manhunter", "Mera", "Mikasa-Ackerman",
    "Madara-Uchiha", "Minato-Namikaze", "Misa-Amane", "Muzan-Kibutsuji",
    "Miki-Sayaka", "Mysterio", "Morbius", "Mr-Fantastic",
  ],
  N: [
    "Naruto", "Nami", "Nico Robin", "Nezuko",
    "Noragami", "Namor", "Nightwing", "Nana",
    "Nick Fury", "Nobita", "Neji", "Nightcrawler",
    "Neon-Genesis-Evangelion", "Natsu-Dragneel", "Nezuko-Kamado", "Nova",
    "Nebula", "Norman-Osborn", "Negan", "Naofumi-Iwatani",
    "Nobara-Kugisaki", "Noelle-Silva", "Nite-Owl", "New-Gods",
  ],
  O: [
    "One Piece", "One Punch Man", "Overlord", "Optimus Prime",
    "Orochimaru", "Olívia Palito", "Osamu Tezuka", "Obelix",
    "Oggy", "Obito", "Orihime", "Oshinoko",
    "Orion", "Odin", "Obito-Uchiha", "Oolong",
    "Okabe-Rintarou", "Onizuka", "Ozymandias", "Omega-Red",
    "Oracle", "Obsidian", "Omni-Man", "Outlaws",
  ],
  P: [
    "Pokémon", "Pikachu", "Piccolo", "Pantera Negra",
    "Popeye", "Professor Xavier", "Papa-Capim", "Pinguim",
    "Punisher", "Paranoia Agent", "Patrulha do Destino", "Pain",
    "Portgas D. Ace", "Poison-Ivy", "Penguin", "Prowler",
    "Psylocke", "Power-Girl", "Plastic-Man", "Peter-Parker",
    "Pochita", "Power", "Pip-the-Troll", "Parasite",
    "Peacemaker", "Pandora-Hearts", "Psycho-Pass", "Parasyte",
  ],
  Q: [
    "Quarteto Fantástico", "Quicksilver", "Quasar", "Queen Millennia",
    "Quatro Cavaleiros do Apocalipse", "Question", "Queen-Maeve", "Quentin-Quire",
    "Queen-Bee", "Quake", "Queen-Hippolyta", "Quill",
  ],
  R: [
    "Robin", "Rock Lee", "Ranma", "Rurouni Kenshin",
    "Roronoa Zoro", "Riquinho", "Rorschach", "Rukia",
    "Ryuk", "Robotech", "Rogue", "Rei Piccolo",
    "Roy Mustang", "Rukia-Kuchiki", "Roy-Mustang", "Riddler",
    "Red-Hood", "Rocket-Raccoon", "Riri-Williams", "Ras-al-Ghul",
    "Raven", "Reverse-Flash", "Re-Zero", "Red-Skull",
  ],
  S: [
    "Saint Seiya", "Sailor Moon", "Sasuke", "Sakura",
    "Shingeki no Kyojin", "Superman", "Shazam", "Slam Dunk",
    "Snoopy", "Sansão", "Seiya", "Spawn",
    "Sanji", "Shikamaru", "Spider-Man", "Soul-Eater",
    "Spy-x-Family", "Steins-Gate", "Sword-Art-Online", "Supergirl",
    "Silver-Surfer", "Storm", "Sabretooth", "She-Hulk",
    "Star-Lord", "Sinestro", "Sasuke-Uchiha", "Sakata-Gintoki",
    "Saitama",
  ],
  T: [
    "Tokyo Ghoul", "Thor", "Tartarugas Ninja", "Trunks",
    "Tanjiro", "Tintim", "Titãs", "Tsubasa",
    "Turma da Mônica", "Tocha Humana", "Tenchi", "Tobi",
    "Toriyama", "Toriko", "Trigun", "To-Your-Eternity",
    "Thanos", "Tony-Stark", "The-Thing", "Two-Face",
    "Trigon", "Toad", "Taskmaster", "Tanjiro-Kamado",
    "Tsunade", "Trafalgar-Law", "Tengen-Uzui", "Todoroki-Shouto",
    "The-Sandman", "Teen-Titans",
  ],
  U: [
    "Ultraman", "Usopp", "Uzumaki", "Ulquiorra",
    "Urashiman", "Uryu Ishida", "Uub", "Uchiha-Sasuke",
    "Uzumaki-Naruto", "Uryu-Ishida", "Urahara-Kisuke", "Uraraka-Ochaco",
    "Ultron", "Uncle-Sam", "Ultraman-Tiga", "Ultimate-Spider-Man",
    "Umbrella-Academy", "Urusei-Yatsura", "Ubel", "Uta",
    "Undertaker", "Usagi-Yojimbo",
  ],
  V: [
    "Vegeta", "Vingadores", "Venom", "Vagabond",
    "Violet Evergarden", "Viúva Negra", "Visão", "Voltron",
    "Vovó Donalda", "Vash", "Vash-the-Stampede", "Vinland-Saga",
    "Vision", "Valkyrie", "Vulture", "Viper",
    "Vandal-Savage", "Ventriloquist", "Vic-Sage", "V-for-Vendetta",
    "Vampire-Knight", "Vinsmoke-Sanji", "Villetta-Nu", "Vados",
    "Van-Hohenheim",
  ],
  X: [
    "X-Men", "Xamã Rei", "Xavier", "Xerxes",
    "X-Force", "X-23", "Xavin", "Xorn",
    "X-Man", "X-Drake", "Xerneas", "Xellos",
    "Xanxus", "Xigbar", "Xaldin", "Xion",
    "Xianghua", "X-O-Manowar", "Xeno", "XxxHolic",
    "X-Treme-X-Men",
  ],
  Z: [
    "Zoro", "Zatch Bell", "Zé Carioca", "Zatanna",
    "Zenitsu", "Zod", "Zabuza", "Zoldyck",
    "Zabuza-Momochi", "Zeref-Dragneel", "Zeno", "Zangetsu",
    "Zoom", "Zemo", "Zzzax", "Zauriel",
    "Zebra", "Zartan", "Zombieman", "Zazie",
    "Zoids", "Zombie-Land-Saga",
  ],
};
