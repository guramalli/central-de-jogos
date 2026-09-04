// Games — lote RETRÔ para a sala PADRÃO (fácil + médio).
//
// Foco: a era PlayStation 1, PlayStation 2, Nintendo 64, Dreamcast e Xbox —
// exatamente o repertório de quem jogava na LAN house e no PC da sala, que é
// o público que o portal quer de volta.
//
// MOTIVO DO LOTE: a sala Games — Padrão tinha 270 perguntas com 227 respostas
// distintas, contra 619 de Conhecimentos Gerais e 503 de Ciências. Era a
// menor das salas principais, e a repetição aparecia em sessão longa.
//
// REGRAS SEGUIDAS (o crivo triplo do projeto):
//  1. VAZAMENTO — a resposta nunca aparece no enunciado;
//  2. SIMILARIDADE — nenhuma pergunta parecida com outra do lote nem com as
//     que já existem;
//  3. COLISÃO DE RESPOSTA — nenhuma resposta repete dentro do lote nem bate
//     com as 190 já usadas no tema.
//
// Além disso: resposta curta e sem ambiguidade; nada de "o melhor jogo de X",
// que muda conforme quem responde; ano só quando é consenso.
//
// Importado por: npm run import-games-retro
export const GAMES_RETRO = {
  games: [
    // ===== PlayStation 1 =====
    { question: "Qual jogo de corrida da Namco foi lançado junto com o primeiro PlayStation e virou vitrine do console?", answer: "Ridge Racer", difficulty: "medio" },
    { question: "Qual o nome da filha que Harry Mason procura na cidade nublada do terror da Konami?", answer: "Cheryl", difficulty: "medio" },
    { question: "Qual é o nome do soldado infiltrado na base de Shadow Moses, protagonista da série da Konami?", answer: "Solid Snake", difficulty: "facil" },
    { question: "Qual jogo colocava um dragão roxo colecionando gemas em mundos coloridos no primeiro PlayStation?", answer: "Spyro", difficulty: "facil" },
    { question: "Qual dupla de marsupial e irmã enfrentava o doutor Neo Cortex nas ilhas Wumpa?", answer: "Crash e Coco", difficulty: "medio" },
    { question: "Qual jogo de skate reuniu profissionais reais e trilha punk, virando febre no fim dos anos 90?", answer: "Tony Hawk", difficulty: "facil" },
    { question: "Qual RPG japonês do PlayStation ficou marcado pela morte de Aerith nas mãos de Sephiroth?", answer: "Final Fantasy VII", difficulty: "medio" },
    { question: "Que tipo de criatura o jogador criava e treinava em Monster Rancher usando CDs de música?", answer: "Monstros", difficulty: "medio" },
    { question: "Qual jogo de luta da Namco trazia Yoshimitsu, Nina Williams e o torneio da família Mishima?", answer: "Tekken", difficulty: "facil" },
    { question: "Qual o sobrenome de Jill, integrante da equipe S.T.A.R.S. que explora a mansão Spencer?", answer: "Valentine", difficulty: "medio" },
    { question: "Qual jogo de tabuleiro digital da Squaresoft misturava cartas e um gato chamado Cait Sith?", answer: "Final Fantasy Tactics", difficulty: "medio" },
    { question: "Qual acessório do PlayStation permitia salvar o progresso e era vendido separadamente?", answer: "Memory Card", difficulty: "facil" },

    // ===== PlayStation 2 =====
    { question: "Qual jogo do PS2 colocava o jogador como um deus grego caçando Ares com lâminas acorrentadas?", answer: "God of War", difficulty: "facil" },
    { question: "Qual série de furtividade do PS2 acompanhava um assassino albino de código de barras na nuca?", answer: "Hitman", difficulty: "medio" },
    { question: "Qual é o nome do protagonista do Grand Theft Auto ambientado nos anos 80, dublado por Ray Liotta?", answer: "Tommy Vercetti", difficulty: "medio" },
    { question: "Qual jogo do PS2 colocava o jogador controlando uma bola pegajosa que engolia objetos cada vez maiores?", answer: "Katamari Damacy", difficulty: "medio" },
    { question: "Qual franquia de corrida da Polyphony Digital era chamada de simulador definitivo no PlayStation?", answer: "Gran Turismo", difficulty: "facil" },
    { question: "Qual jogo do PS2 acompanha Wander derrubando dezesseis gigantes para salvar uma garota?", answer: "Shadow of the Colossus", difficulty: "medio" },
    { question: "Que acessório do PS2 ficava no chão e registrava os pés do jogador seguindo setas na tela?", answer: "Tapete de dança", difficulty: "medio" },
    { question: "Qual série de plataforma do PS2 juntava um garoto e uma doninha laranja em busca de eco?", answer: "Jak and Daxter", difficulty: "medio" },
    { question: "Qual jogo de guerra do PS2 recriava batalhas da Segunda Guerra com a série Frontline?", answer: "Medal of Honor", difficulty: "medio" },
    { question: "Qual dupla de ladrão guaxinim e sua turma roubava de outros criminosos no PS2?", answer: "Sly Cooper", difficulty: "medio" },

    // ===== Nintendo 64 =====
    { question: "Qual jogo do Nintendo 64 é apontado como o que definiu o controle de câmera em três dimensões?", answer: "Super Mario 64", difficulty: "facil" },
    { question: "Quantos controles podiam ser ligados ao Nintendo 64 ao mesmo tempo, sem adaptador?", answer: "Quatro", difficulty: "facil" },
    { question: "Qual jogo de tiro do Nintendo 64 baseado num filme de espionagem popularizou o multiplayer em tela dividida?", answer: "GoldenEye 007", difficulty: "medio" },
    { question: "Qual personagem pilota a nave Arwing e comanda uma equipe de animais no espaço?", answer: "Fox McCloud", difficulty: "medio" },
    { question: "Qual jogo do Nintendo 64 dava ao jogador apenas três dias antes da lua cair sobre Termina?", answer: "Majoras Mask", difficulty: "medio" },
    { question: "Qual acessório encaixado no controle do Nintendo 64 fazia ele vibrar durante o jogo?", answer: "Rumble Pak", difficulty: "medio" },
    { question: "Qual jogo de luta do Nintendo 64 reuniu personagens de várias franquias da Nintendo numa arena?", answer: "Super Smash Bros", difficulty: "facil" },
    { question: "Qual dupla de urso e passarinho enfrentava a bruxa Gruntilda?", answer: "Banjo e Kazooie", difficulty: "medio" },
    { question: "Qual jogo de corrida do Nintendo 64 trazia cascos, cascas de banana e a Rainbow Road?", answer: "Mario Kart 64", difficulty: "facil" },
    { question: "Qual personagem da Rare, um Kong com boné e camisa, ganhou seu próprio jogo em 1999?", answer: "Donkey Kong 64", difficulty: "medio" },

    // ===== Dreamcast =====
    { question: "Qual foi o último console doméstico lançado pela Sega, em 1999?", answer: "Dreamcast", difficulty: "facil" },
    { question: "Qual acessório do Dreamcast servia como cartão de memória e minigame portátil ao mesmo tempo?", answer: "VMU", difficulty: "medio" },
    { question: "Qual jogo do Dreamcast colocava jovens de patins pichando as ruas de Tokyo-to?", answer: "Jet Set Radio", difficulty: "medio" },
    { question: "Qual jogo de pesca do Dreamcast vinha com uma vara de pescar como controle?", answer: "Sega Bass Fishing", difficulty: "medio" },
    { question: "Qual RPG do Dreamcast foi pioneiro em partidas pela internet no console, com quatro classes de caçadores?", answer: "Phantasy Star Online", difficulty: "medio" },
    { question: "Qual jogo do Dreamcast pedia que o jogador criasse músicas e movimentos com um maracá?", answer: "Samba de Amigo", difficulty: "medio" },
    { question: "Qual série de luta em arena da Sega trazia lutadores em polígonos e começou nos fliperamas?", answer: "Virtua Fighter", difficulty: "medio" },
    { question: "Qual jogo do Dreamcast acompanhava Ryo Hazuki procurando o assassino do pai no Japão?", answer: "Shenmue", difficulty: "medio" },

    // ===== Xbox (primeiro) =====
    { question: "Qual jogo de tiro foi lançado junto com o primeiro Xbox e virou o carro-chefe do console?", answer: "Halo", difficulty: "facil" },
    { question: "Qual serviço online da Microsoft estreou no primeiro Xbox e cobrava assinatura para jogar em rede?", answer: "Xbox Live", difficulty: "facil" },
    { question: "Qual série de RPG de ficção científica da BioWare estreou no primeiro Xbox ambientada em Star Wars?", answer: "Knights of the Old Republic", difficulty: "medio" },
    { question: "Qual jogo de luta do primeiro Xbox trazia praias e vôlei além dos combates?", answer: "Dead or Alive", difficulty: "medio" },
    { question: "Qual jogo de furtividade do Xbox acompanhava um agente com três luzes verdes nos óculos?", answer: "Splinter Cell", difficulty: "medio" },
    { question: "Qual jogo de corrida da Microsoft estreou como resposta ao Gran Turismo?", answer: "Forza Motorsport", difficulty: "medio" },
    { question: "Qual jogo do Xbox colocava o jogador como um mercenário controlando naves e mundos abertos no espaço?", answer: "Freelancer", difficulty: "medio" },

    // ===== Fliperama e era 16 bits (contexto da mesma geração) =====
    { question: "Qual jogo de fliperama pedia que o jogador salvasse a Terra atirando em invasores em fileiras?", answer: "Space Invaders", difficulty: "facil" },
    { question: "Qual jogo de fliperama trazia um macaco jogando barris num encanador de macacão?", answer: "Donkey Kong", difficulty: "facil" },
    { question: "Qual dupla de irmãos encanadores estreou nos fliperamas antes de ganhar console próprio?", answer: "Mario e Luigi", difficulty: "facil" },
    { question: "Qual ninja de azul da Midway congela o adversário antes de acertar o golpe?", answer: "Sub-Zero", difficulty: "facil" },
    { question: "Qual personagem da Capcom lança bolas de energia gritando um golpe conhecido no mundo todo?", answer: "Ryu", difficulty: "facil" },
    { question: "Qual console de 16 bits da Sega concorreu diretamente com o Super Nintendo?", answer: "Mega Drive", difficulty: "facil" },
    { question: "Qual foi o primeiro jogo com o ouriço azul, lançado em 1991 para o console de 16 bits da Sega?", answer: "Sonic the Hedgehog", difficulty: "facil" },
    { question: "Em qual jogo o encanador da Nintendo ganhou pela primeira vez um dinossauro verde como montaria?", answer: "Super Mario World", difficulty: "facil" },
    { question: "Qual jogo de RPG do Super Nintendo acompanha Crono e seus amigos viajando entre eras?", answer: "Chrono Trigger", difficulty: "medio" },
    { question: "Qual jogo de luta da SNK reunia times de três lutadores em torneios anuais?", answer: "King of Fighters", difficulty: "medio" },
    { question: "Qual jogo de beat em up do Mega Drive colocava três ex-policiais limpando as ruas a socos?", answer: "Streets of Rage", difficulty: "medio" },
    { question: "Qual jogo do Super Nintendo colocava o jogador pilotando uma nave em corridas antigravitacionais?", answer: "F-Zero", difficulty: "medio" },

    // ===== Curiosidades e história dos consoles =====
    { question: "Qual empresa japonesa começou fabricando cartas de baralho antes de entrar nos videogames?", answer: "Nintendo", difficulty: "medio" },
    { question: "Qual acessório de mídia a Sony desenvolvia em parceria com a rival antes de criar seu próprio console?", answer: "CD-ROM", difficulty: "medio" },
    { question: "Que formato de mídia o Nintendo 64 usava, em vez do CD adotado pelos concorrentes?", answer: "Cartucho", difficulty: "facil" },
    { question: "Qual console portátil da Nintendo, lançado em 1989, tinha tela monocromática esverdeada?", answer: "Game Boy", difficulty: "facil" },
    { question: "De qual país era o programador que criou o jogo de blocos que acompanhava o portátil da Nintendo?", answer: "Rússia", difficulty: "medio" },
    { question: "Qual console detém o recorde de mais unidades vendidas na história, com mais de 150 milhões?", answer: "PS2", difficulty: "medio" },
    { question: "Qual acessório do PS2 permitia jogar dançando e cantando com uma câmera que capturava o jogador?", answer: "EyeToy", difficulty: "medio" },
    { question: "Que cor era o console da Sega lançado em 1994 no Japão, conhecido por seus 32 bits?", answer: "Sega Saturn", difficulty: "medio" },
    { question: "Qual estúdio japonês criou tanto Metal Gear quanto Castlevania?", answer: "Konami", difficulty: "medio" },
    { question: "Qual empresa britânica criou Banjo-Kazooie, Perfect Dark e Donkey Kong Country?", answer: "Rare", difficulty: "medio" },
  ],
};
