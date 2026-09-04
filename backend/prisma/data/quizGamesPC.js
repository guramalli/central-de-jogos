// Games — lote PC / LAN HOUSE para a sala PADRÃO (fácil + médio).
//
// Foco: o que se jogava em LAN house e no PC de casa nos anos 2000 —
// estratégia, MMORPG, tiro em rede, casuais de navegador. É o repertório
// mais próximo de quem frequentava a Central de Jogos, que é o público que
// o portal quer de volta.
//
// Junto com o lote retrô, leva a sala Games — Padrão de 270 para ~450
// perguntas, alinhando com Ciências (503) e Cinema (519).
//
// REGRAS SEGUIDAS (crivo triplo do projeto):
//  1. VAZAMENTO — a resposta nunca aparece no enunciado;
//  2. SIMILARIDADE — nenhuma pergunta parecida com outra;
//  3. COLISÃO DE RESPOSTA — checado contra as 259 respostas que já existem
//     no tema (190 antigas + 69 do lote retrô).
//
// Importado por: npm run import-games-pc
export const GAMES_PC = {
  games: [
    // ===== Estratégia em tempo real =====
    { question: "Em Age of Empires II, qual recurso é obtido cortando árvores com os aldeões?", answer: "Madeira", difficulty: "facil" },
    { question: "Em Age of Empires II, qual construção é necessária para treinar o guerreiro exclusivo de cada civilização?", answer: "Castelo", difficulty: "medio" },
    { question: "Qual é a última era que o jogador alcança numa partida padrão de Age of Empires II?", answer: "Era Imperial", difficulty: "medio" },
    { question: "Qual jogo de estratégia da Blizzard ambientado no espaço tem Terranos, Zergs e Protoss?", answer: "StarCraft", difficulty: "facil" },
    { question: "Qual raça de StarCraft é composta por criaturas biológicas que evoluem e se multiplicam rapidamente?", answer: "Zerg", difficulty: "facil" },
    { question: "Qual jogo da Blizzard de orcs e humanos deu origem ao universo do MMORPG mais jogado do mundo?", answer: "Warcraft", difficulty: "facil" },
    { question: "Em Command and Conquer, qual recurso alienígena verde é colhido pelos veículos para financiar a base?", answer: "Tiberium", difficulty: "medio" },
    { question: "Qual série de estratégia por turnos coloca o jogador conduzindo uma civilização da Idade da Pedra ao espaço?", answer: "Civilization", difficulty: "facil" },
    { question: "Qual jogo de estratégia da Ensemble Studios levou o jogador aos povos antigos com pirâmides e falanges?", answer: "Age of Mythology", difficulty: "medio" },
    { question: "Em jogos de estratégia em tempo real, como é chamada a tática de atacar o adversário bem cedo, antes de ele se preparar?", answer: "Rush", difficulty: "medio" },

    // ===== MMORPG de LAN house =====
    { question: "Qual MMORPG coreano de gráficos em duas dimensões e visual fofo fez enorme sucesso nas LAN houses brasileiras?", answer: "Ragnarok Online", difficulty: "facil" },
    { question: "Em Ragnarok Online, qual é a primeira classe que quase todo jogador precisa passar antes de evoluir?", answer: "Novato", difficulty: "medio" },
    { question: "Qual MMORPG gratuito de visão isométrica ficou conhecido pelo mundo aberto e pelo sistema de guildas em Rookgaard?", answer: "Tibia", difficulty: "medio" },
    { question: "Qual MMORPG coreano de visual sombrio e asas nos personagens de alto nível foi febre nos cybercafés?", answer: "MU Online", difficulty: "medio" },
    { question: "Qual MMORPG da Blizzard lançado em 2004 se tornou o mais assinado do mundo?", answer: "World of Warcraft", difficulty: "facil" },
    { question: "Como são chamados os grupos organizados de jogadores que enfrentam chefes difíceis nos MMORPGs?", answer: "Guilda", difficulty: "facil" },
    { question: "Qual termo descreve o ato de derrotar monstros repetidamente para acumular experiência num MMORPG?", answer: "Grind", difficulty: "medio" },
    { question: "Qual MMORPG brasileiro de navegador ficou conhecido pelas batalhas de clãs e pelo visual em pixels?", answer: "Ninja Saga", difficulty: "medio" },

    // ===== Tiro e multiplayer online =====
    { question: "Qual jogo de tiro da Valve tem o cientista Gordon Freeman e o incidente em Black Mesa?", answer: "Half-Life", difficulty: "facil" },
    { question: "Qual ferramenta o protagonista de Half-Life usa como arma corpo a corpo característica?", answer: "Pé de cabra", difficulty: "medio" },
    { question: "Qual jogo cooperativo da Valve coloca quatro sobreviventes atravessando campanhas cheias de zumbis?", answer: "Left 4 Dead", difficulty: "facil" },
    { question: "Qual jogo de tiro da Valve tem nove classes distintas, entre elas o Heavy e o Engenheiro?", answer: "Team Fortress", difficulty: "medio" },
    { question: "Qual jogo de tiro coreano com estética de desenho e armas variadas foi popular nas LAN houses brasileiras?", answer: "CrossFire", difficulty: "medio" },
    { question: "Qual jogo de tiro em primeira pessoa da id Software popularizou as arenas rápidas com saltos por foguete?", answer: "Quake", difficulty: "facil" },
    { question: "Qual empresa lançou em 1993 o jogo apontado como pai dos tiros em primeira pessoa?", answer: "id Software", difficulty: "facil" },
    { question: "Qual jogo de tiro tático russo ficou conhecido pelo realismo extremo e pelo risco de perder tudo ao morrer?", answer: "Escape from Tarkov", difficulty: "medio" },

    // ===== Casuais e navegador =====
    { question: "Qual jogo de tiro em turnos com bonecos coloridos ficou famoso pela mira por ângulo e força do vento?", answer: "Gunbound", difficulty: "facil" },
    { question: "Qual jogo de vermes armados popularizou as batalhas por turnos com bazucas e ovelhas explosivas?", answer: "Worms", difficulty: "medio" },
    { question: "Qual jogo de dança em teclado com setas e música pop foi febre nos cybercafés brasileiros?", answer: "Audition", difficulty: "medio" },
    { question: "Qual jogo de corrida de carrinhos coreano com visual de desenho fez sucesso no Brasil nos anos 2000?", answer: "KartRider", difficulty: "medio" },
    { question: "Qual jogo de futebol jogado pelo navegador colocava o jogador como técnico administrando um time?", answer: "Hattrick", difficulty: "medio" },
    { question: "Qual jogo de plataforma com um boneco laranja se tornou febre no Brasil com fases criadas por usuários?", answer: "Super Mario Flash", difficulty: "medio" },
    { question: "Qual tecnologia da Adobe rodava a maioria dos jogos de navegador nos anos 2000 e foi descontinuada em 2020?", answer: "Flash", difficulty: "medio" },
    { question: "Qual navegador da Microsoft vinha instalado nos computadores de LAN house nos anos 2000?", answer: "Internet Explorer", difficulty: "medio" },

    // ===== MOBA e competitivo =====
    { question: "De qual jogo de estratégia da Blizzard nasceu o modo personalizado que originou os MOBAs?", answer: "Warcraft III", difficulty: "medio" },
    { question: "Como são chamadas as três rotas principais de um mapa clássico de MOBA?", answer: "Lanes", difficulty: "medio" },
    { question: "Qual estrutura principal precisa ser destruída para vencer uma partida na maioria dos MOBAs?", answer: "Nexus", difficulty: "medio" },
    { question: "Como é chamado o jogador que fica na selva entre as rotas, caçando monstros neutros?", answer: "Jungler", difficulty: "medio" },
    { question: "Qual continente fictício abriga a maioria das regiões do universo do MOBA mais jogado do mundo?", answer: "Runeterra", difficulty: "facil" },
    { question: "Como é chamada a criatura neutra mais poderosa do mapa, disputada pelos dois times num MOBA?", answer: "Barão", difficulty: "medio" },

    // ===== Sandbox e mundo aberto =====
    { question: "Qual o apelido do programador sueco que criou o jogo de blocos mais vendido da história?", answer: "Notch", difficulty: "facil" },
    { question: "Qual dimensão vermelha e infernal do Minecraft é acessada por um portal de obsidiana?", answer: "Nether", difficulty: "facil" },
    { question: "Qual tarefa da nave, no jogo de dedução social, envolve arrastar fios coloridos para conectá-los?", answer: "Fiação", difficulty: "medio" },
    { question: "Qual moeda virtual é usada para compras dentro da plataforma de criação de jogos popular entre crianças?", answer: "Robux", difficulty: "facil" },
    { question: "Qual código digitado na série de simulação de vida da Maxis dava dinheiro extra ao jogador?", answer: "Rosebud", difficulty: "facil" },
    { question: "Em que idioma fictício os personagens da série de simulação de vida da Maxis conversam?", answer: "Simlish", difficulty: "medio" },
    { question: "Qual série japonesa de simulação rural inspirou a onda de jogos de fazenda independentes?", answer: "Harvest Moon", difficulty: "medio" },

    // ===== Battle royale e era recente =====
    { question: "Qual jogo popularizou o gênero de sobrevivência com cem jogadores e círculo que encolhe?", answer: "PUBG", difficulty: "facil" },
    { question: "Qual motor gráfico da criadora do battle royale de construção é usado por milhares de estúdios?", answer: "Unreal Engine", difficulty: "medio" },
    { question: "Qual battle royale brasileiro de celular da Garena fez enorme sucesso no país?", answer: "Free Fire", difficulty: "facil" },
    { question: "Qual jogo de dedução social ambientado numa nave espacial explodiu em popularidade durante a pandemia?", answer: "Among Us", difficulty: "facil" },
    { question: "De qual cidade fictícia vem o caçador de monstros dos livros poloneses adaptados para videogame?", answer: "Rívia", difficulty: "facil" },
    { question: "Qual diretor japonês é conhecido por criar Dark Souls, Bloodborne e Elden Ring?", answer: "Miyazaki", difficulty: "medio" },

    // ===== Personagens e franquias =====
    { question: "Qual item faz o encanador da Nintendo crescer de tamanho ao ser coletado?", answer: "Cogumelo", difficulty: "facil" },
    { question: "Qual é o nome da raposa de duas caudas que acompanha o ouriço azul da Sega?", answer: "Tails", difficulty: "facil" },
    { question: "Qual profissão têm os dois irmãos italianos mais famosos dos videogames?", answer: "Encanador", difficulty: "facil" },
    { question: "Qual é o sobrenome da arqueóloga britânica que explora tumbas nos jogos da Eidos?", answer: "Croft", difficulty: "facil" },
    { question: "Qual é o nome do ouriço vermelho rival do protagonista nos jogos da Sega?", answer: "Knuckles", difficulty: "medio" },
    { question: "Em qual jogo de fliperama de 1981 o mascote da Nintendo apareceu pela primeira vez, ainda como carpinteiro?", answer: "Donkey Kong Jr", difficulty: "facil" },
    { question: "Qual objeto sagrado de três partes é disputado por Link, Zelda e Ganon?", answer: "Trifórcia", difficulty: "medio" },
    { question: "Qual é o nome da princesa cujo nome dá título à série de aventura da Nintendo protagonizada por Link?", answer: "Zelda", difficulty: "facil" },
    { question: "Qual tipo elemental é a especialidade do mascote amarelo da franquia da Game Freak?", answer: "Elétrico", difficulty: "facil" },
    { question: "Qual é o nome do professor que entrega o primeiro companheiro ao treinador na região de Kanto?", answer: "Carvalho", difficulty: "facil" },
    { question: "Qual é o nome do filho do vilão tartaruga que aparece como chefe nos jogos da Nintendo?", answer: "Bowser Jr", difficulty: "facil" },
    { question: "Qual empresa japonesa criou a franquia de luta com Ryu, Ken e Chun-Li?", answer: "Capcom", difficulty: "facil" },

    // ===== Termos e cultura gamer =====
    { question: "Como é chamado o erro de programação que causa comportamento inesperado num jogo?", answer: "Bug", difficulty: "facil" },
    { question: "Como é chamada a fase de testes fechada, anterior ao beta, com poucos participantes?", answer: "Alpha", difficulty: "facil" },
    { question: "Como são chamados os personagens controlados pelo computador, que não são jogadores?", answer: "NPC", difficulty: "facil" },
    { question: "Como se chama o conjunto de alterações feitas por fãs que expande um jogo original?", answer: "Mod", difficulty: "facil" },
    { question: "Como é chamado o travamento momentâneo causado por conexão instável numa partida online?", answer: "Lag", difficulty: "facil" },
    { question: "Como é chamada a conquista desbloqueável registrada no perfil do jogador?", answer: "Troféu", difficulty: "medio" },
    { question: "Como é chamado o jogador que abandona a partida no meio, prejudicando o time?", answer: "Leaver", difficulty: "medio" },
    { question: "Qual termo descreve jogar de forma exageradamente cautelosa, esperando o adversário se expor?", answer: "Camper", difficulty: "medio" },
    { question: "Como é chamado o pacote pago que adiciona fases e personagens a um jogo já lançado?", answer: "DLC pago", difficulty: "facil" },
    { question: "Como é chamado o modo em que dois jogadores dividem a mesma tela em partes?", answer: "Tela dividida", difficulty: "facil" },
    { question: "Qual peça do computador é a principal responsável por processar os gráficos de um jogo?", answer: "Placa de vídeo", difficulty: "medio" },
    { question: "Qual palavra descreve jogar sem parar por longas horas seguidas?", answer: "Maratonar", difficulty: "medio" },
    { question: "Como é chamado o jogador muito experiente e habilidoso, em oposição ao iniciante?", answer: "Pro", difficulty: "facil" },
    { question: "Como é chamado o jogo que conta fatos anteriores ao original da série?", answer: "Prequel", difficulty: "medio" },
    { question: "Qual termo descreve programas ilegais que dão vantagem injusta em partidas online?", answer: "Cheat", difficulty: "facil" },
    { question: "Como é chamado o evento competitivo em que equipes profissionais disputam prêmios em dinheiro?", answer: "Campeonato", difficulty: "facil" },

    // ===== Empresas e história =====
    { question: "Qual animal é o mascote azul criado pela empresa japonesa que fabricou consoles até o Dreamcast?", answer: "Ouriço", difficulty: "facil" },
    { question: "De qual país era o estúdio criador do jogo de blocos comprado pela Microsoft em 2014?", answer: "Suécia", difficulty: "medio" },
    { question: "Qual promoção sazonal da loja digital da Valve ficou famosa pelos descontos agressivos?", answer: "Summer Sale", difficulty: "facil" },
    { question: "Qual estúdio japonês é responsável pelas franquias Final Fantasy e Dragon Quest?", answer: "Square Enix", difficulty: "medio" },
    { question: "Qual empresa francesa criou Assassins Creed, Far Cry e Rayman?", answer: "Ubisoft", difficulty: "medio" },
    { question: "Qual estúdio criou Grand Theft Auto e Red Dead Redemption?", answer: "Rockstar", difficulty: "facil" },
    { question: "Qual empresa publicou as franquias FIFA, The Sims e Battlefield?", answer: "Electronic Arts", difficulty: "medio" },
    { question: "Em que ano a indústria americana de jogos sofreu a crise que quase acabou com o setor?", answer: "1983", difficulty: "medio" },
    { question: "Qual empresa lançou em 1977 o console que popularizou os cartuchos intercambiáveis?", answer: "Atari", difficulty: "medio" },
    { question: "Em que década foi lançado o jogo de tênis simplificado apontado como primeiro sucesso comercial dos videogames?", answer: "Anos 70", difficulty: "medio" },

    // ===== Mecânicas e gêneros =====
    { question: "Como é chamado o gênero de jogo em que o jogador assume o papel de um personagem e evolui seus atributos?", answer: "RPG", difficulty: "facil" },
    { question: "Como é chamado o gênero de jogo focado em combates corpo a corpo entre dois personagens?", answer: "Luta", difficulty: "facil" },
    { question: "Como é chamado o ponto onde o jogador reaparece após ser derrotado?", answer: "Spawn", difficulty: "medio" },
    { question: "Como é chamado o inimigo mais forte, geralmente enfrentado ao fim de uma fase?", answer: "Chefe", difficulty: "facil" },
    { question: "Como é chamado o gênero de jogo focado em resolver quebra-cabeças?", answer: "Puzzle", difficulty: "facil" },
    { question: "Qual sigla designa os pontos de vida de um personagem em jogos de RPG?", answer: "HP", difficulty: "facil" },
    { question: "Como é chamado o modo em que o jogador enfrenta outros jogadores em vez do computador?", answer: "PvP", difficulty: "medio" },
    { question: "Como é chamado o ponto do mapa onde o jogo é gravado automaticamente?", answer: "Checkpoint", difficulty: "facil" },
    { question: "Como é chamado o gênero de jogos em que a morte é permanente e o progresso recomeça do zero?", answer: "Roguelike", difficulty: "medio" },
    { question: "Como é chamado o comércio entre jogadores dentro de um mundo virtual?", answer: "Troca", difficulty: "medio" },
    { question: "Como é chamada a habilidade especial que precisa de tempo de recarga antes de ser usada novamente?", answer: "Cooldown", difficulty: "medio" },
    { question: "Como é chamado o mapa reduzido exibido num canto da tela para orientação?", answer: "Minimapa", difficulty: "facil" },
    { question: "Como é chamada a moeda virtual comprada com dinheiro real dentro de um jogo?", answer: "Microtransação", difficulty: "medio" },
    { question: "Como é chamado o item cosmético que muda a aparência do personagem sem afetar o desempenho?", answer: "Skin", difficulty: "facil" },
    { question: "Como é chamada a série de abates consecutivos sem morrer num jogo de tiro?", answer: "Killstreak", difficulty: "medio" },
    { question: "Como é chamado o sistema que aproxima jogadores de habilidade parecida numa partida?", answer: "Matchmaking", difficulty: "medio" },
    { question: "Como é chamada a caixa surpresa comprada dentro do jogo com itens aleatórios?", answer: "Loot box", difficulty: "medio" },
  ],
};
