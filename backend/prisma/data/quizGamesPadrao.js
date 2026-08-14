// Games — 100 perguntas para a sala PADRÃO (fácil + médio).
//
// Mistura pedida pelo Gustavinho: FPS/eSports (com destaque pro CS),
// franquias famosas, protagonistas e vilões, e curiosidades. Regras:
//  - resposta nunca aparece no enunciado;
//  - nada ambíguo (evitado "jogo mais vendido de 2020", que muda conforme
//    a métrica); ano de lançamento só quando é consenso;
//  - resposta curta.
//
// Importado por: npm run import-games-padrao
export const GAMES_PADRAO = {
  games: [
    // ===== Counter-Strike e FPS competitivo =====
    { question: "Qual FPS tático de bombas e reféns lançou nomes como FalleN, coldzera e fer no cenário brasileiro?", answer: "Counter-Strike", difficulty: "facil" },
    { question: "Qual organização brasileira venceu os dois Majors de CS:GO em 2016, com FalleN e coldzera?", answer: "SK Gaming", difficulty: "medio" },
    { question: "Qual FPS tático da Riot Games mistura tiro com habilidades de personagens chamados agentes?", answer: "Valorant", difficulty: "facil" },
    { question: "Qual empresa criou o Counter-Strike originalmente como um mod de Half-Life?", answer: "Valve", difficulty: "medio" },
    { question: "Em Valorant, como são chamados os personagens jogáveis com habilidades próprias?", answer: "Agentes", difficulty: "facil" },
    { question: "Qual FPS da Blizzard tem heróis como Tracer, Reinhardt e Genji em partidas 6 contra 6?", answer: "Overwatch", difficulty: "facil" },
    { question: "Qual franquia de FPS militar tem edições como Modern Warfare e Black Ops?", answer: "Call of Duty", difficulty: "facil" },
    { question: "Qual FPS clássico da id Software popularizou o gênero em 1993 com um fuzileiro em Marte?", answer: "Doom", difficulty: "medio" },
    { question: "Qual jogo de tiro da Epic Games popularizou o battle royale com construção de estruturas?", answer: "Fortnite", difficulty: "facil" },
    { question: "Qual battle royale ficou famoso pela sigla PUBG?", answer: "PlayerUnknown's Battlegrounds", difficulty: "medio" },

    // ===== Zelda, Mario e Nintendo =====
    { question: "Qual é o nome do vilão recorrente da série The Legend of Zelda, geralmente um rei do mal?", answer: "Ganon", difficulty: "medio" },
    { question: "Qual é o nome do herói de orelhas pontudas e roupa verde da série Zelda?", answer: "Link", difficulty: "facil" },
    { question: "Qual encanador de bigode é o mascote da Nintendo?", answer: "Mario", difficulty: "facil" },
    { question: "Qual é o nome do irmão de Mario, sempre de verde?", answer: "Luigi", difficulty: "facil" },
    { question: "Qual tartaruga gigante é a vilã que sequestra a Princesa Peach nos jogos do Mario?", answer: "Bowser", difficulty: "facil" },
    { question: "Qual ouriço azul super veloz é o mascote da SEGA?", answer: "Sonic", difficulty: "facil" },
    { question: "Qual é o nome do vilão de bigode que é o arqui-inimigo do Sonic?", answer: "Dr. Robotnik", difficulty: "medio" },
    { question: "Qual jogo de plataforma da Nintendo de 2017 tem o encanador explorando reinos com o chapéu Cappy?", answer: "Super Mario Odyssey", difficulty: "medio" },
    { question: "Qual caçadora de recompensas usa uma armadura e é protagonista da série Metroid?", answer: "Samus", difficulty: "medio" },

    // ===== Protagonistas e personagens =====
    { question: "Qual é o nome do protagonista samurai de Ghost of Tsushima?", answer: "Jin Sakai", difficulty: "medio" },
    { question: "Qual é o nome do protagonista careca e de código de barras da série Hitman?", answer: "Agente 47", difficulty: "medio" },
    { question: "Qual caçador de tesouros é o protagonista da série Uncharted?", answer: "Nathan Drake", difficulty: "medio" },
    { question: "Qual é o nome do espartano protagonista da série God of War?", answer: "Kratos", difficulty: "facil" },
    { question: "Qual arqueóloga aventureira é a protagonista da série Tomb Raider?", answer: "Lara Croft", difficulty: "facil" },
    { question: "Qual é o nome do protagonista de The Witcher, um caçador de monstros de cabelos brancos?", answer: "Geralt", difficulty: "medio" },
    { question: "Qual super-soldado de armadura verde é o protagonista da série Halo?", answer: "Master Chief", difficulty: "medio" },
    { question: "Qual é o nome do protagonista de The Last of Us que protege Ellie numa América pós-apocalíptica?", answer: "Joel", difficulty: "medio" },
    { question: "Qual é o nome do protagonista cowboy de Red Dead Redemption 2?", answer: "Arthur Morgan", difficulty: "medio" },
    { question: "Qual marsupial laranja de calças jeans é o mascote clássico da Naughty Dog nos anos 1990?", answer: "Crash Bandicoot", difficulty: "facil" },

    // ===== Franquias e estúdios =====
    { question: "Qual empresa desenvolve tanto o League of Legends quanto o Valorant?", answer: "Riot Games", difficulty: "medio" },
    { question: "Qual jogo de mundo aberto da Rockstar se passa na fictícia Los Santos?", answer: "GTA V", difficulty: "facil" },
    { question: "Qual jogo de blocos permite construir qualquer coisa e é o mais vendido da história?", answer: "Minecraft", difficulty: "facil" },
    { question: "Qual empresa sueca criou o Minecraft antes de ser comprada pela Microsoft?", answer: "Mojang", difficulty: "medio" },
    { question: "Qual MOBA da Valve é conhecido pelo torneio The International e seu prêmio milionário?", answer: "Dota 2", difficulty: "medio" },
    { question: "Qual é o nome do MOBA da Riot com campeões e a Summoner's Rift?", answer: "League of Legends", difficulty: "facil" },
    { question: "Qual jogo de terror da Capcom tem o protagonista Leon e a vilã corporação Umbrella?", answer: "Resident Evil", difficulty: "medio" },
    { question: "Qual série de luta da Capcom tem Ryu e Ken lançando o golpe Hadouken?", answer: "Street Fighter", difficulty: "facil" },
    { question: "Qual série de luta é famosa pelos fatalities e por personagens como Scorpion e Sub-Zero?", answer: "Mortal Kombat", difficulty: "facil" },
    { question: "Qual RPG polonês baseado em livros tem o bruxo Geralt como protagonista?", answer: "The Witcher", difficulty: "medio" },

    // ===== Golpes, itens e termos icônicos =====
    { question: "Em Street Fighter, qual é o nome do golpe de energia lançado com as mãos por Ryu?", answer: "Hadouken", difficulty: "medio" },
    { question: "Em Mortal Kombat, como é chamado o golpe finalizador brutal aplicado no fim do round?", answer: "Fatality", difficulty: "facil" },
    { question: "Em Pokémon, qual é o item usado para capturar os monstrinhos?", answer: "Pokébola", difficulty: "facil" },
    { question: "Qual é o Pokémon elétrico amarelo que é o mascote da franquia?", answer: "Pikachu", difficulty: "facil" },
    { question: "Em Minecraft, qual criatura verde explode ao chegar perto do jogador?", answer: "Creeper", difficulty: "facil" },
    { question: "Qual instrumento de sopro Link usa para viajar no tempo no clássico de Nintendo 64 de 1998?", answer: "Ocarina", difficulty: "medio" },
    { question: "Qual moeda dourada é coletada aos milhares nos jogos do Sonic?", answer: "Anéis", difficulty: "medio" },
    { question: "Em Among Us, como é chamado o jogador que sabota e elimina os outros?", answer: "Impostor", difficulty: "facil" },
    { question: "Em Fortnite, qual é o nome do veículo voador que transporta os cem jogadores até a ilha no início da partida?", answer: "Ônibus de batalha", difficulty: "medio" },
    { question: "Qual espada lendária Link busca em vários jogos da série Zelda?", answer: "Master Sword", difficulty: "medio" },

    // ===== Consoles e história =====
    { question: "Qual empresa fabrica o console PlayStation?", answer: "Sony", difficulty: "facil" },
    { question: "Qual empresa fabrica o console Xbox?", answer: "Microsoft", difficulty: "facil" },
    { question: "Qual console híbrido da Nintendo pode ser usado na TV ou como portátil?", answer: "Nintendo Switch", difficulty: "facil" },
    { question: "Qual foi o console de 8 bits da Nintendo que ajudou a reerguer os videogames nos anos 1980?", answer: "NES", difficulty: "medio" },
    { question: "Qual portátil da Nintendo com duas telas fez enorme sucesso nos anos 2000?", answer: "Nintendo DS", difficulty: "medio" },
    { question: "Qual acessório da Nintendo Wii revolucionou os jogos com controle de movimento?", answer: "Wii Remote", difficulty: "medio" },
    { question: "Qual loja digital é a principal plataforma de jogos de PC, criada pela Valve?", answer: "Steam", difficulty: "facil" },
    { question: "Qual console da Sony foi o primeiro a usar CDs em vez de cartuchos, em 1994?", answer: "PlayStation", difficulty: "medio" },
    { question: "Qual empresa japonesa criou o Pac-Man?", answer: "Namco", difficulty: "medio" },
    { question: "Qual clássico de fliperama tem o objetivo de comer pontos fugindo de fantasmas?", answer: "Pac-Man", difficulty: "facil" },

    // ===== Mundo aberto e aventura =====
    { question: "Qual jogo de mundo aberto da Nintendo de 2017 tem Link explorando Hyrule livremente?", answer: "Breath of the Wild", difficulty: "medio" },
    { question: "Qual jogo da Rockstar se passa no Velho Oeste e tem Arthur Morgan na gangue de Dutch?", answer: "Red Dead Redemption 2", difficulty: "medio" },
    { question: "Qual série de mundo aberto histórico tem o personagem Ezio Auditore na Itália renascentista?", answer: "Assassin's Creed", difficulty: "medio" },
    { question: "Qual RPG de ação futurista da CD Projekt se passa em Night City?", answer: "Cyberpunk 2077", difficulty: "medio" },
    { question: "Qual RPG da FromSoftware de 2022 se passa nas Terras Intermédias e foi eleito jogo do ano?", answer: "Elden Ring", difficulty: "medio" },
    { question: "Qual série de RPG da Square tem cristais, chocobos e o personagem recorrente Cid?", answer: "Final Fantasy", difficulty: "medio" },
    { question: "Qual jogo de fazenda e vida no interior ficou febre com plantações e relacionamentos?", answer: "Stardew Valley", difficulty: "medio" },
    { question: "Qual jogo da Nintendo permite montar sua própria ilha habitada por bichinhos falantes e pagar dívidas ao Tom Nook?", answer: "Animal Crossing", difficulty: "medio" },
    { question: "Qual jogo indie de plataforma difícil tem a protagonista Madeline escalando uma montanha?", answer: "Celeste", difficulty: "medio" },
    { question: "Qual jogo cooperativo de fantasmas ficou popular no fim de 2020, com investigação paranormal?", answer: "Phasmophobia", difficulty: "medio" },

    // ===== Terror e suspense =====
    { question: "Qual série de terror tem freiras, animatrônicos e câmeras de segurança numa pizzaria?", answer: "Five Nights at Freddy's", difficulty: "medio" },
    { question: "Qual série de terror da Konami tem uma cidade coberta de névoa e sirenes?", answer: "Silent Hill", difficulty: "medio" },
    { question: "Em Resident Evil, qual é o nome da corporação farmacêutica vilã?", answer: "Umbrella", difficulty: "medio" },
    { question: "Qual jogo de terror indie tem o personagem preso num hospital abandonado com uma câmera?", answer: "Outlast", difficulty: "medio" },
    { question: "Qual criatura alta e sem rosto persegue o jogador na série de terror que leva seu nome?", answer: "Slender Man", difficulty: "medio" },

    // ===== Mobile e casual =====
    { question: "Qual jogo mobile de pássaros irritados lançando-se em porcos fez febre em 2010?", answer: "Angry Birds", difficulty: "facil" },
    { question: "Qual jogo de doces em fileiras foi um dos maiores sucessos mobile da década de 2010?", answer: "Candy Crush", difficulty: "facil" },
    { question: "Qual RPG de mundo aberto da HoYoverse ficou famoso por seu sistema gacha e personagens de elementos?", answer: "Genshin Impact", difficulty: "medio" },
    { question: "Qual jogo mobile de realidade aumentada fez as pessoas saírem às ruas caçando monstrinhos em 2016?", answer: "Pokémon GO", difficulty: "facil" },
    { question: "Qual plataforma de jogos criados por usuários é enorme entre crianças e tem avatares de blocos?", answer: "Roblox", difficulty: "facil" },

    // ===== Esports e competitivo =====
    { question: "Qual é o nome do campeonato mundial anual de League of Legends?", answer: "Worlds", difficulty: "medio" },
    { question: "Qual organização brasileira é uma das mais tradicionais do CS e do LoL, de camisa preta e branca?", answer: "paiN Gaming", difficulty: "medio" },
    { question: "Qual é o nome do maior torneio de Dota 2, com premiação recorde arrecadada pela comunidade?", answer: "The International", difficulty: "medio" },

    // ===== Curiosidades e clássicos =====
    { question: "Qual foi o jogo de blocos que caem, criado na União Soviética, febre mundial dos anos 1980?", answer: "Tetris", difficulty: "facil" },
    { question: "Qual jogo de simulação de vida permite criar pessoas, casas e famílias virtuais?", answer: "The Sims", difficulty: "facil" },
    { question: "Qual clássico de corrida da Nintendo tem itens como casco de tartaruga e casca de banana?", answer: "Mario Kart", difficulty: "facil" },
    { question: "Qual jogo de plataforma da Microsoft/Rare tem um urso e um pássaro na mochila?", answer: "Banjo-Kazooie", difficulty: "medio" },
    { question: "Qual série musical usava um controle em formato de violão de plástico e fez febre no fim dos anos 2000?", answer: "Guitar Hero", difficulty: "facil" },
    { question: "Qual jogo de sobrevivência tem visual sombrio de desenho e um cientista chamado Wilson preso numa terra selvagem?", answer: "Don't Starve", difficulty: "medio" },
    { question: "Qual jogo de exploração espacial permite viajar por planetas gerados proceduralmente, prometido em 2016?", answer: "No Man's Sky", difficulty: "medio" },
    { question: "Qual jogo de plataforma indie tem um vaso de cavaleiro explorando o reino subterrâneo de Hallownest?", answer: "Hollow Knight", difficulty: "medio" },

    // ===== Personagens e vilões extras =====
    { question: "Qual é o nome do dinossauro verde que ajuda o Mario carregando-o nas costas?", answer: "Yoshi", difficulty: "facil" },
    { question: "Qual é o nome da princesa que Mario costuma resgatar?", answer: "Peach", difficulty: "facil" },
    { question: "Qual é o nome do fantasma roxo da série Luigi's Mansion, o rei dos boos?", answer: "King Boo", difficulty: "medio" },
    { question: "Em God of War, qual é o nome do filho de Kratos que o acompanha na saga nórdica?", answer: "Atreus", difficulty: "medio" },
    { question: "Em The Last of Us, qual é o nome da adolescente imune que Joel escolta?", answer: "Ellie", difficulty: "medio" },
    { question: "Qual é o nome do ícone de Sonic que a Dr. Robotnik quer roubar, gemas coloridas de poder?", answer: "Esmeraldas do Caos", difficulty: "medio" },
    { question: "Em Portal, qual é o nome da inteligência artificial vilã que comanda os testes?", answer: "GLaDOS", difficulty: "medio" },
    { question: "Qual é o nome do protagonista silencioso de Half-Life, um físico de óculos e pé de cabra?", answer: "Gordon Freeman", difficulty: "medio" },
    { question: "Em Cyberpunk 2077, qual músico digital vivido por Keanu Reeves acompanha o protagonista?", answer: "Johnny Silverhand", difficulty: "medio" },
    { question: "Qual é o nome do ninja de roupa amarela cujo bordão é 'Get over here!' em Mortal Kombat?", answer: "Scorpion", difficulty: "medio" },
  ],
};
