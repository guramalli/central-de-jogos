// MENTIRA SINCERA — "SOBRE VOCÊS": frases sobre os próprios jogadores.
//
//   tema — pacote que o dono escolhe na sala de espera;
//   eu   — como a pessoa vê na hora de CONFESSAR a verdade;
//   ele  — como aparece na rodada ({n} = nick de quem confessou);
//   casa — mentiras da casa (completam as opções quando há pouca gente).
//
// Escritas sem marcar gênero ("o apelido de {n}", nunca "ele/ela") e sem
// temas sensíveis (saúde, vida íntima, crime) — é pra rir em live, não
// pra expor ninguém.

export const TEMAS_SOBRE = [
  { key: "tudo", nome: "Tudo misturado", icone: "🎲" },
  { key: "infancia", nome: "Infância", icone: "🧒" },
  { key: "micos", nome: "Micos e vergonhas", icone: "😳" },
  { key: "comida", nome: "Comida", icone: "🍔" },
  { key: "ese", nome: "E se…?", icone: "🔮" },
  { key: "internet", nome: "Internet e celular", icone: "📱" },
  { key: "roles", nome: "Rolês e festas", icone: "🎉" },
  { key: "familia", nome: "Família", icone: "🏠" },
  { key: "games", nome: "Games e cultura pop", icone: "🎮" },
  { key: "escola", nome: "Escola e trabalho", icone: "🏫" },
  { key: "amor", nome: "Relacionamentos", icone: "💘" },
  { key: "trabalho", nome: "Trabalho", icone: "💼" },
  { key: "naoacredito", nome: "Não acredito que você fez isso", icone: "😱" },
  { key: "imagine", nome: "Complete como se fosse verdade", icone: "🎭" },
];

export const FRASES_SOBRE = [
  // 🧒 INFÂNCIA
  { id: "idolo", tema: "infancia", eu: "Meu ídolo de infância era ___.", ele: "O ídolo de infância de {n} era ___.", casa: ["a Xuxa", "o Power Ranger vermelho"] },
  { id: "desenho", tema: "infancia", eu: "Meu desenho animado favorito era ___.", ele: "O desenho animado favorito de {n} era ___.", casa: ["o Pica-Pau", "a Pantera Cor-de-Rosa"] },
  { id: "mentira", tema: "infancia", eu: "Uma mentira que eu contava quando criança era ___.", ele: "Uma mentira que {n} contava quando criança era ___.", casa: ["que tinha um primo famoso", "que sabia karatê"] },
  { id: "palavra", tema: "infancia", eu: "Minha primeira palavra foi ___.", ele: "A primeira palavra de {n} foi ___.", casa: ["papai", "água"] },
  { id: "pet", tema: "infancia", eu: "O nome do meu primeiro bicho de estimação foi ___.", ele: "O nome do primeiro bicho de estimação de {n} foi ___.", casa: ["Rex", "Bolinha"] },
  { id: "querer", tema: "infancia", eu: "Quando criança, eu queria ser ___ quando crescesse.", ele: "Quando criança, {n} queria ser ___ quando crescesse.", casa: ["astronauta", "dono de sorveteria"] },
  { id: "brinquedo", tema: "infancia", eu: "Meu brinquedo favorito da infância era ___.", ele: "O brinquedo favorito de {n} na infância era ___.", casa: ["um Tamagotchi", "uma bola murcha"] },
  { id: "castigo", tema: "infancia", eu: "O pior castigo que eu já levei foi por ___.", ele: "O pior castigo que {n} já levou foi por ___.", casa: ["pintar a parede", "cortar o cabelo do irmão"] },
  { id: "medoinfancia", tema: "infancia", eu: "Quando criança, eu morria de medo de ___.", ele: "Quando criança, {n} morria de medo de ___.", casa: ["homem do saco", "boneca assombrada"] },
  { id: "lanche", tema: "infancia", eu: "O lanche que eu levava pra escola era ___.", ele: "O lanche que {n} levava pra escola era ___.", casa: ["bolacha recheada", "pão com mortadela"] },
  { id: "fantasia", tema: "infancia", eu: "A fantasia de carnaval que eu mais usei foi de ___.", ele: "A fantasia de carnaval que {n} mais usou foi de ___.", casa: ["Chapolin", "bailarina"] },

  // 😳 MICOS E VERGONHAS
  { id: "vergonha", tema: "micos", eu: "Eu já passei vergonha em público quando ___.", ele: "{n} já passou vergonha em público quando ___.", casa: ["tropeçou na escada rolante", "chamou a professora de mãe"] },
  { id: "apelido", tema: "micos", eu: "O apelido mais vergonhoso que eu já tive foi ___.", ele: "O apelido mais vergonhoso que {n} já teve foi ___.", casa: ["Batata", "Pé de Pano"] },
  { id: "quebrei", tema: "micos", eu: "A coisa mais cara que eu já quebrei foi ___.", ele: "A coisa mais cara que {n} já quebrou foi ___.", casa: ["a TV da sala", "o celular da mãe"] },
  { id: "dormir", tema: "micos", eu: "O lugar mais estranho onde eu já dormi foi ___.", ele: "O lugar mais estranho onde {n} já dormiu foi ___.", casa: ["no ônibus", "numa rede de pesca"] },
  { id: "mania", tema: "micos", eu: "Eu tenho mania de ___.", ele: "{n} tem mania de ___.", casa: ["estalar os dedos", "conferir se a porta está trancada"] },
  { id: "talento", tema: "micos", eu: "Um talento inútil que eu tenho é ___.", ele: "Um talento inútil de {n} é ___.", casa: ["mexer as orelhas", "imitar galinha"] },
  { id: "medo", tema: "micos", eu: "Meu maior medo bobo é ___.", ele: "O maior medo bobo de {n} é ___.", casa: ["borboleta", "palhaço"] },
  { id: "rua", tema: "micos", eu: "A coisa mais estranha que eu já achei na rua foi ___.", ele: "A coisa mais estranha que {n} já achou na rua foi ___.", casa: ["uma dentadura", "um pé de sapato só"] },
  { id: "tombo", tema: "micos", eu: "O tombo mais vergonhoso que eu já levei foi ___.", ele: "O tombo mais vergonhoso que {n} já levou foi ___.", casa: ["na frente da escola inteira", "saindo do ônibus"] },
  { id: "mae", tema: "micos", eu: "Uma vez eu chamei ___ de mãe sem querer.", ele: "Uma vez {n} chamou ___ de mãe sem querer.", casa: ["o professor", "o motorista do ônibus"] },
  { id: "mensagem", tema: "micos", eu: "Já mandei mensagem pra pessoa errada falando de ___.", ele: "{n} já mandou mensagem pra pessoa errada falando de ___.", casa: ["uma festa surpresa", "a fofoca da firma"] },

  // 🍔 COMIDA
  { id: "aposta", tema: "comida", eu: "Uma vez eu comi ___ por aposta.", ele: "{n} uma vez comeu ___ por aposta.", casa: ["uma formiga viva", "ração de cachorro"] },
  { id: "madrugada", tema: "comida", eu: "Minha comida favorita de madrugada é ___.", ele: "A comida favorita de {n} de madrugada é ___.", casa: ["miojo cru", "pão com ovo"] },
  { id: "odeio", tema: "comida", eu: "Uma comida que eu odeio é ___.", ele: "Uma comida que {n} odeia é ___.", casa: ["jiló", "quiabo"] },
  { id: "combinacao", tema: "comida", eu: "Uma combinação estranha de comida que eu amo é ___.", ele: "Uma combinação estranha de comida que {n} ama é ___.", casa: ["pizza com mel", "feijão com açúcar"] },
  { id: "ultima", tema: "comida", eu: "Se fosse minha última refeição, eu pediria ___.", ele: "Se fosse a última refeição, {n} pediria ___.", casa: ["lasanha da vó", "um X-tudo"] },
  { id: "cozinhar", tema: "comida", eu: "O único prato que eu sei fazer direito é ___.", ele: "O único prato que {n} sabe fazer direito é ___.", casa: ["miojo", "ovo frito"] },
  { id: "lanchonete", tema: "comida", eu: "Meu pedido de lanchonete de sempre é ___.", ele: "O pedido de lanchonete de sempre de {n} é ___.", casa: ["X-bacon sem salada", "pastel de palmito"] },
  { id: "doce", tema: "comida", eu: "O doce que eu não consigo parar de comer é ___.", ele: "O doce que {n} não consegue parar de comer é ___.", casa: ["brigadeiro de panela", "paçoca"] },
  { id: "bagunca", tema: "comida", eu: "A maior bagunça que eu já fiz na cozinha foi ___.", ele: "A maior bagunça que {n} já fez na cozinha foi ___.", casa: ["explodir um ovo no micro-ondas", "queimar o arroz"] },
  { id: "bebida", tema: "comida", eu: "A bebida que eu mais peço é ___.", ele: "A bebida que {n} mais pede é ___.", casa: ["suco de caixinha", "guaraná"] },

  // 🔮 E SE…?
  { id: "mega", tema: "ese", eu: "Se eu ganhasse na Mega-Sena, a primeira coisa que eu compraria seria ___.", ele: "Se ganhasse na Mega-Sena, a primeira coisa que {n} compraria seria ___.", casa: ["um jet ski", "uma fazenda de alpacas"] },
  { id: "animal", tema: "ese", eu: "Se eu fosse um animal, seria ___.", ele: "Se fosse um animal, {n} seria ___.", casa: ["uma preguiça", "uma capivara"] },
  { id: "poder", tema: "ese", eu: "Meu superpoder ideal seria ___.", ele: "O superpoder ideal de {n} seria ___.", casa: ["voar", "teletransporte"] },
  { id: "jantar", tema: "ese", eu: "Se eu pudesse jantar com qualquer famoso, escolheria ___.", ele: "Se pudesse jantar com qualquer famoso, {n} escolheria ___.", casa: ["o Faustão", "a Anitta"] },
  { id: "bordao", tema: "ese", eu: "Se eu tivesse um bordão, seria ___.", ele: "Se tivesse um bordão, o de {n} seria ___.", casa: ["partiu!", "é nóis"] },
  { id: "ilha", tema: "ese", eu: "Se eu fosse pra uma ilha deserta, levaria ___.", ele: "Se fosse pra uma ilha deserta, {n} levaria ___.", casa: ["um carregador portátil", "uma rede"] },
  { id: "invisivel", tema: "ese", eu: "Se eu ficasse invisível por um dia, eu iria ___.", ele: "Se ficasse invisível por um dia, {n} iria ___.", casa: ["entrar no cinema de graça", "dormir no shopping"] },
  { id: "semdinheiro", tema: "ese", eu: "Se eu não precisasse de dinheiro, eu trabalharia com ___.", ele: "Se não precisasse de dinheiro, {n} trabalharia com ___.", casa: ["pescaria", "degustação de pizza"] },
  { id: "filme", tema: "ese", eu: "Se a minha vida fosse um filme, o título seria ___.", ele: "Se a vida de {n} fosse um filme, o título seria ___.", casa: ["O Atrasado", "Missão: Acordar Cedo"] },
  { id: "programa", tema: "ese", eu: "Se eu tivesse um programa de TV, ele seria sobre ___.", ele: "Se {n} tivesse um programa de TV, seria sobre ___.", casa: ["reforma de sofá", "fofoca de celebridade"] },

  // 📱 INTERNET E CELULAR
  { id: "google", tema: "internet", eu: "A última coisa que eu pesquisei no Google foi ___.", ele: "A última coisa que {n} pesquisou no Google foi ___.", casa: ["como tirar mancha de café", "horário do ônibus"] },
  { id: "nick", tema: "internet", eu: "Meu primeiro nick na internet foi ___.", ele: "O primeiro nick de {n} na internet foi ___.", casa: ["xX_Matador_Xx", "Gatinho2009"] },
  { id: "app", tema: "internet", eu: "O aplicativo que eu mais abro no dia é ___.", ele: "O aplicativo que {n} mais abre no dia é ___.", casa: ["calculadora", "previsão do tempo"] },
  { id: "video", tema: "internet", eu: "O vídeo que eu já vi umas cem vezes é ___.", ele: "O vídeo que {n} já viu umas cem vezes é ___.", casa: ["o do gato tocando piano", "gol do Ronaldinho"] },
  { id: "figurinha", tema: "internet", eu: "A figurinha que eu mais mando no WhatsApp é ___.", ele: "A figurinha que {n} mais manda no WhatsApp é ___.", casa: ["o Faustão chorando", "um cachorro de óculos"] },
  { id: "grupo", tema: "internet", eu: "O grupo de WhatsApp mais caótico que eu participo é o ___.", ele: "O grupo de WhatsApp mais caótico de {n} é o ___.", casa: ["da família", "do condomínio"] },
  { id: "celular", tema: "internet", eu: "Se meu celular fosse vasculhado, a maior vergonha seria ___.", ele: "Se o celular de {n} fosse vasculhado, a maior vergonha seria ___.", casa: ["as selfies de biquinho", "as fotos de comida"] },
  { id: "acompanho", tema: "internet", eu: "O tipo de perfil que eu mais acompanho nas redes é ___.", ele: "O tipo de perfil que {n} mais acompanha nas redes é ___.", casa: ["de receita de bolo", "de cachorro fazendo besteira"] },
  { id: "bateria", tema: "internet", eu: "Eu só carrego o celular quando a bateria chega a ___.", ele: "{n} só carrega o celular quando a bateria chega a ___.", casa: ["50%", "1%"] },
  { id: "tela", tema: "internet", eu: "Por dia, eu passo umas ___ no celular.", ele: "Por dia, {n} passa umas ___ no celular.", casa: ["2 horas", "12 horas"] },

  // 🎉 ROLÊS E FESTAS
  { id: "chuveiro", tema: "roles", eu: "A música que eu canto no chuveiro é ___.", ele: "A música que {n} canta no chuveiro é ___.", casa: ["Evidências", "Ai Se Eu Te Pego"] },
  { id: "karaoke", tema: "roles", eu: "No karaokê, a música que eu escolho é ___.", ele: "No karaokê, a música que {n} escolhe é ___.", casa: ["Garçom", "Sozinho"] },
  { id: "dia", tema: "roles", eu: "Eu nunca vou esquecer o dia em que ___.", ele: "{n} nunca vai esquecer o dia em que ___.", casa: ["caiu na piscina de roupa", "viu o mar pela primeira vez"] },
  { id: "piorrole", tema: "roles", eu: "O pior rolê da minha vida foi ___.", ele: "O pior rolê da vida de {n} foi ___.", casa: ["um casamento no sítio", "um show debaixo de chuva"] },
  { id: "pista", tema: "roles", eu: "A música que me faz ir direto pra pista é ___.", ele: "A música que faz {n} ir direto pra pista é ___.", casa: ["Macarena", "Na Boquinha da Garrafa"] },
  { id: "embora", tema: "roles", eu: "A desculpa que eu mais uso pra ir embora cedo é ___.", ele: "A desculpa que {n} mais usa pra ir embora cedo é ___.", casa: ["amanhã eu acordo cedo", "esqueci o fogão ligado"] },
  { id: "festa", tema: "roles", eu: "Numa festa, eu sempre acabo ___.", ele: "Numa festa, {n} sempre acaba ___.", casa: ["na cozinha", "dormindo no sofá"] },
  { id: "viagem", tema: "roles", eu: "A viagem mais doida que eu já fiz foi pra ___.", ele: "A viagem mais doida que {n} já fez foi pra ___.", casa: ["Aparecida", "a praia de ônibus fretado"] },
  { id: "show", tema: "roles", eu: "O show que eu mais quero ver na vida é de ___.", ele: "O show que {n} mais quer ver na vida é de ___.", casa: ["Roberto Carlos", "Beyoncé"] },
  { id: "carnaval", tema: "roles", eu: "No carnaval, eu costumo ___.", ele: "No carnaval, {n} costuma ___.", casa: ["fugir pra praia", "maratonar série"] },

  // 🏠 FAMÍLIA
  { id: "inutil", tema: "familia", eu: "O objeto mais inútil que eu tenho em casa é ___.", ele: "O objeto mais inútil que {n} tem em casa é ___.", casa: ["uma sanfona", "uma panela de fondue"] },
  { id: "presente", tema: "familia", eu: "O pior presente que eu já ganhei foi ___.", ele: "O pior presente que {n} já ganhou foi ___.", casa: ["um par de meias", "um peso de porta"] },
  { id: "apelidofamilia", tema: "familia", eu: "O apelido que minha família me dá é ___.", ele: "O apelido que a família dá pra {n} é ___.", casa: ["Neném", "Pimpolho"] },
  { id: "proibido", tema: "familia", eu: "Na minha casa, é proibido ___.", ele: "Na casa de {n}, é proibido ___.", casa: ["comer no sofá", "gritar no almoço de domingo"] },
  { id: "domingo", tema: "familia", eu: "O almoço de domingo lá em casa é sempre ___.", ele: "O almoço de domingo na casa de {n} é sempre ___.", casa: ["macarronada", "churrasco"] },
  { id: "briga", tema: "familia", eu: "Uma briga de família começou por causa de ___.", ele: "Uma briga na família de {n} começou por causa de ___.", casa: ["controle remoto", "último pedaço de pizza"] },
  { id: "frasemae", tema: "familia", eu: "A frase que minha mãe mais repete é ___.", ele: "A frase que a mãe de {n} mais repete é ___.", casa: ["leva um casaco", "eu não sou sua empregada"] },
  { id: "tradicao", tema: "familia", eu: "Uma tradição esquisita da minha família é ___.", ele: "Uma tradição esquisita da família de {n} é ___.", casa: ["comer lentilha pulando onda", "tirar foto com o peru de Natal"] },
  { id: "parente", tema: "familia", eu: "O parente mais engraçado da minha família é ___.", ele: "O parente mais engraçado da família de {n} é ___.", casa: ["o tio do pavê", "a vó"] },
  { id: "pote", tema: "familia", eu: "Lá em casa, o pote de sorvete na verdade guarda ___.", ele: "Na casa de {n}, o pote de sorvete na verdade guarda ___.", casa: ["feijão", "linha de costura"] },
  { id: "herdei", tema: "familia", eu: "Uma mania que eu herdei da família é ___.", ele: "Uma mania que {n} herdou da família é ___.", casa: ["guardar sacola de mercado", "falar alto no telefone"] },

  // 🎮 GAMES E CULTURA POP
  { id: "serie", tema: "games", eu: "Minha série favorita de todos os tempos é ___.", ele: "A série favorita de todos os tempos de {n} é ___.", casa: ["Chaves", "Friends"] },
  { id: "chorar", tema: "games", eu: "Eu choro toda vez que assisto ___.", ele: "{n} chora toda vez que assiste ___.", casa: ["Marley e Eu", "Toy Story 3"] },
  { id: "jogovida", tema: "games", eu: "O jogo que eu mais joguei na vida foi ___.", ele: "O jogo que {n} mais jogou na vida foi ___.", casa: ["Paciência", "Campo Minado"] },
  { id: "personagem", tema: "games", eu: "Se eu fosse um personagem de game, seria ___.", ele: "Se fosse um personagem de game, {n} seria ___.", casa: ["o Pac-Man", "um NPC que vende poção"] },
  { id: "raiva", tema: "games", eu: "O jogo que mais me fez passar raiva foi ___.", ele: "O jogo que mais fez {n} passar raiva foi ___.", casa: ["Flappy Bird", "Dark Souls"] },
  { id: "console", tema: "games", eu: "Meu primeiro videogame foi ___.", ele: "O primeiro videogame de {n} foi ___.", casa: ["um Polystation", "um Game Boy"] },
  { id: "maratona", tema: "games", eu: "Meu recorde jogando sem parar foi de ___.", ele: "O recorde de {n} jogando sem parar foi de ___.", casa: ["6 horas", "2 dias"] },
  { id: "filmevezes", tema: "games", eu: "O filme que eu já assisti mais vezes é ___.", ele: "O filme que {n} já assistiu mais vezes é ___.", casa: ["Shrek", "Titanic"] },
  { id: "pareco", tema: "games", eu: "O personagem de filme que eu mais pareço é ___.", ele: "O personagem de filme que {n} mais parece é ___.", casa: ["o Burro do Shrek", "a Dory"] },
  { id: "cantar", tema: "games", eu: "A música que eu sei cantar inteira sem errar é ___.", ele: "A música que {n} sabe cantar inteira sem errar é ___.", casa: ["o hino nacional", "Evidências"] },

  // 🏫 ESCOLA E TRABALHO
  { id: "bronca", tema: "escola", eu: "Na escola, eu levei bronca por ___.", ele: "Na escola, {n} levou bronca por ___.", casa: ["colar na prova", "dormir na aula"] },
  { id: "emprego", tema: "escola", eu: "Meu primeiro trabalho foi ___.", ele: "O primeiro trabalho de {n} foi ___.", casa: ["vender picolé na praia", "entregar panfleto"] },
  { id: "materia", tema: "escola", eu: "A matéria que eu mais odiava na escola era ___.", ele: "A matéria que {n} mais odiava na escola era ___.", casa: ["Educação Física", "Química"] },
  { id: "faltar", tema: "escola", eu: "A desculpa mais esfarrapada que eu já dei pra faltar foi ___.", ele: "A desculpa mais esfarrapada que {n} já deu pra faltar foi ___.", casa: ["meu peixe morreu", "o ônibus quebrou"] },
  { id: "apelidoescola", tema: "escola", eu: "Na escola, meu apelido era ___.", ele: "Na escola, o apelido de {n} era ___.", casa: ["Palito", "Cabeção"] },
  { id: "cola", tema: "escola", eu: "O jeito mais criativo de colar na prova que eu já vi foi ___.", ele: "O jeito mais criativo de colar na prova que {n} já viu foi ___.", casa: ["escrever na borracha", "colar no rótulo da garrafa"] },
  { id: "sempre", tema: "escola", eu: "No trabalho ou na escola, eu sou quem sempre ___.", ele: "No trabalho ou na escola, {n} é quem sempre ___.", casa: ["chega em cima da hora", "esquece o material"] },
  { id: "sonho", tema: "escola", eu: "O emprego dos meus sonhos seria ___.", ele: "O emprego dos sonhos de {n} seria ___.", casa: ["provador de colchão", "testador de videogame"] },
  { id: "excursao", tema: "escola", eu: "A excursão da escola que eu nunca esqueci foi pra ___.", ele: "A excursão da escola que {n} nunca esqueceu foi pra ___.", casa: ["o zoológico", "uma fábrica de biscoito"] },
  { id: "recreio", tema: "escola", eu: "No recreio, eu passava o tempo todo ___.", ele: "No recreio, {n} passava o tempo todo ___.", casa: ["jogando bafo", "trocando figurinha"] },

  // ---------------- lote 2 (lista do Gustavinho) ----------------
  // 🧒 INFÂNCIA
  { id: "achavaverdade", tema: "infancia", eu: "Quando eu era criança, eu achava que ___ era verdade.", ele: "Quando criança, {n} achava que ___ era verdade.", casa: ["o bicho-papão", "a fada do dente"] },
  { id: "pais", tema: "infancia", eu: "Quando eu era criança, eu acreditava que meus pais ___.", ele: "Quando criança, {n} acreditava que os pais ___.", casa: ["eram espiões", "nunca tinham sido crianças"] },
  { id: "expulsaramcrianca", tema: "infancia", eu: "Quando eu era criança, me expulsaram de ___.", ele: "Quando criança, expulsaram {n} de ___.", casa: ["uma aula de natação", "uma festa junina"] },
  { id: "escondiapais", tema: "infancia", eu: "Quando eu era criança, eu escondia ___ dos meus pais.", ele: "Quando criança, {n} escondia ___ dos pais.", casa: ["o boletim", "um gato de rua"] },
  { id: "culpa", tema: "infancia", eu: "Quando eu era criança, eu quebrei ___ e coloquei a culpa em outra pessoa.", ele: "Quando criança, {n} quebrou ___ e colocou a culpa em outra pessoa.", casa: ["o vaso da avó", "a janela do vizinho"] },
  { id: "chorava", tema: "infancia", eu: "Quando eu era criança, eu chorava sempre que ___.", ele: "Quando criança, {n} chorava sempre que ___.", casa: ["cortava o cabelo", "acabava o desenho"] },
  { id: "televisao", tema: "infancia", eu: "Quando eu era criança, eu achava que dentro da televisão moravam ___.", ele: "Quando criança, {n} achava que dentro da televisão moravam ___.", casa: ["pessoas pequenininhas", "os apresentadores"] },
  { id: "careta", tema: "infancia", eu: "Quando eu era criança, eu tinha certeza de que, se eu fizesse careta, ___.", ele: "Quando criança, {n} tinha certeza de que, se fizesse careta, ___.", casa: ["a cara ficava assim pra sempre", "o vento levava o rosto"] },
  { id: "segredo", tema: "infancia", eu: "Quando eu era criança, meu maior segredo era ___.", ele: "Quando criança, o maior segredo de {n} era ___.", casa: ["que dormia de luz acesa", "que comia massinha"] },

  // 😳 VERGONHA
  { id: "vergonhaescola", tema: "micos", eu: "A coisa mais vergonhosa que eu já fiz na escola foi ___.", ele: "A coisa mais vergonhosa que {n} já fez na escola foi ___.", casa: ["cantar no microfone da diretoria", "chamar a professora de tia"] },
  { id: "lugarerrado", tema: "micos", eu: "Uma vez eu entrei no lugar errado e ___.", ele: "Uma vez {n} entrou no lugar errado e ___.", casa: ["ficou pra festa", "cumprimentou todo mundo"] },
  { id: "acenei", tema: "micos", eu: "Uma vez eu acenei pra alguém que estava acenando para ___.", ele: "Uma vez {n} acenou pra alguém que estava acenando para ___.", casa: ["o ônibus", "a pessoa de trás"] },
  { id: "nomeerrado", tema: "micos", eu: "Já chamei uma pessoa pelo nome errado e ___.", ele: "{n} já chamou uma pessoa pelo nome errado e ___.", casa: ["continuou chamando assim", "ela respondeu"] },
  { id: "fingisabia", tema: "micos", eu: "Já fingi que sabia ___, mas não fazia ideia do que era.", ele: "{n} já fingiu que sabia ___, mas não fazia ideia do que era.", casa: ["o que era bitcoin", "a letra do hino"] },
  { id: "pegaram", tema: "micos", eu: "Uma vez me pegaram ___.", ele: "Uma vez pegaram {n} ___.", casa: ["cantando no carro com o vidro aberto", "conversando com uma planta"] },
  { id: "desculpa", tema: "micos", eu: "A desculpa mais ridícula que eu já dei foi ___.", ele: "A desculpa mais ridícula que {n} já deu foi ___.", casa: ["o cachorro comeu a lição", "esqueci que era segunda"] },
  { id: "impressionar", tema: "micos", eu: "Já tentei impressionar alguém fazendo ___.", ele: "{n} já tentou impressionar alguém fazendo ___.", casa: ["embaixadinha", "truque de mágica"] },

  // 💘 RELACIONAMENTOS
  { id: "piorencontro", tema: "amor", eu: "Meu pior encontro terminou quando ___.", ele: "O pior encontro de {n} terminou quando ___.", casa: ["a conta chegou", "a mãe ligou"] },
  { id: "terminei", tema: "amor", eu: "Já terminei um relacionamento por causa de ___.", ele: "{n} já terminou um relacionamento por causa de ___.", casa: ["um time de futebol", "um signo"] },
  { id: "msgnamoro", tema: "amor", eu: "Já mandei uma mensagem pra quem eu namorava dizendo ___ e me arrependi.", ele: "{n} já mandou uma mensagem pra quem namorava dizendo ___ e se arrependeu.", casa: ["te amo, mãe", "precisamos conversar"] },
  { id: "descobri", tema: "amor", eu: "Já fiquei com alguém e descobri depois que ___.", ele: "{n} já ficou com alguém e descobriu depois que ___.", casa: ["era primo de um amigo", "torcia pro time rival"] },
  { id: "fizerampormim", tema: "amor", eu: "A coisa mais estranha que já fizeram por mim foi ___.", ele: "A coisa mais estranha que já fizeram por {n} foi ___.", casa: ["uma serenata às 6 da manhã", "uma tatuagem com o nome"] },
  { id: "fingigostar", tema: "amor", eu: "Já fingi gostar de ___ só pra impressionar alguém.", ele: "{n} já fingiu gostar de ___ só pra impressionar alguém.", casa: ["jazz", "pescaria"] },
  { id: "mentiencontro", tema: "amor", eu: "Já menti num encontro dizendo que ___.", ele: "{n} já mentiu num encontro dizendo que ___.", casa: ["falava francês", "era atleta"] },
  { id: "correndoencontro", tema: "amor", eu: "Já saí correndo de um encontro porque ___.", ele: "{n} já saiu correndo de um encontro porque ___.", casa: ["a pessoa trouxe a mãe", "começou a chover"] },

  // 💼 TRABALHO
  { id: "trabalheiestando", tema: "trabalho", eu: "Já fui trabalhar mesmo estando ___.", ele: "{n} já foi trabalhar mesmo estando ___.", casa: ["de pijama", "com uma meia de cada cor"] },
  { id: "chefepegou", tema: "trabalho", eu: "Uma vez meu chefe me pegou ___.", ele: "Uma vez o chefe pegou {n} ___.", casa: ["dormindo na reunião", "jogando no computador"] },
  { id: "reclamei", tema: "trabalho", eu: "Já mandei uma mensagem reclamando do chefe pra ___.", ele: "{n} já mandou uma mensagem reclamando do chefe pra ___.", casa: ["o próprio chefe", "o grupo da firma"] },
  { id: "estranhotrabalho", tema: "trabalho", eu: "A coisa mais estranha que já aconteceu no meu trabalho foi ___.", ele: "A coisa mais estranha que já aconteceu no trabalho de {n} foi ___.", casa: ["um pombo entrou na reunião", "o elevador parou com a diretoria"] },
  { id: "fingitrabalhando", tema: "trabalho", eu: "Já fingi que estava trabalhando enquanto ___.", ele: "{n} já fingiu que estava trabalhando enquanto ___.", casa: ["assistia série", "via vídeo de receita"] },
  { id: "sechefesoubesse", tema: "trabalho", eu: "Se meu chefe soubesse ___, provavelmente me demitiria na hora.", ele: "Se o chefe de {n} soubesse ___, provavelmente demitiria na hora.", casa: ["quem come o iogurte da geladeira", "que o relatório é copiado da internet"] },
  { id: "atrasei", tema: "trabalho", eu: "Uma vez eu me atrasei pro trabalho porque ___.", ele: "Uma vez {n} se atrasou pro trabalho porque ___.", casa: ["dormiu no ônibus", "o cachorro fugiu"] },

  // 🏠 FAMÍLIA
  { id: "maepegou", tema: "familia", eu: "Uma vez minha mãe me pegou ___.", ele: "Uma vez a mãe pegou {n} ___.", casa: ["dançando na frente do espelho", "comendo o bolo da visita"] },
  { id: "paiensinou", tema: "familia", eu: "Uma vez meu pai me ensinou a ___.", ele: "Uma vez o pai ensinou {n} a ___.", casa: ["pescar com as mãos", "trocar pneu"] },
  { id: "estranhofamilia", tema: "familia", eu: "A coisa mais estranha que alguém da minha família faz é ___.", ele: "A coisa mais estranha que alguém da família de {n} faz é ___.", casa: ["guardar dente de leite", "falar com as plantas"] },
  { id: "escondifamilia", tema: "familia", eu: "Já escondi ___ de alguém da minha família.", ele: "{n} já escondeu ___ de alguém da família.", casa: ["uma nota vermelha", "um cachorro"] },
  { id: "familiaacha", tema: "familia", eu: "Minha família acredita que eu sou ___.", ele: "Pra família, {n} é ___.", casa: ["a pessoa mais responsável da casa", "gênio da informática"] },
  { id: "descobriram", tema: "familia", eu: "Uma vez meus pais descobriram que eu ___.", ele: "Uma vez os pais de {n} descobriram que ___.", casa: ["matava aula", "tinha tatuagem escondida"] },

  // 🎉 FESTAS
  { id: "absurdofesta", tema: "roles", eu: "A coisa mais absurda que eu já fiz numa festa foi ___.", ele: "A coisa mais absurda que {n} já fez numa festa foi ___.", casa: ["dormir dentro da banheira", "virar DJ sem saber"] },
  { id: "expulsaramfesta", tema: "roles", eu: "Já me expulsaram de uma festa porque ___.", ele: "Já expulsaram {n} de uma festa porque ___.", casa: ["comeu o bolo antes do parabéns", "trocou a música"] },
  { id: "festaestranha", tema: "roles", eu: "Uma festa ficou completamente estranha quando ___.", ele: "Uma festa com {n} ficou completamente estranha quando ___.", casa: ["apareceu o ex", "acabou a luz no parabéns"] },
  { id: "acordeisemsaber", tema: "roles", eu: "Já acordei depois de uma festa sem saber como ___.", ele: "{n} já acordou depois de uma festa sem saber como ___.", casa: ["chegou em casa", "ganhou um chapéu de cowboy"] },
  { id: "derrubei", tema: "roles", eu: "A pior coisa que eu já derrubei numa festa foi ___.", ele: "A pior coisa que {n} já derrubou numa festa foi ___.", casa: ["o bolo de aniversário", "a caixa de som"] },
  { id: "dancei", tema: "roles", eu: "Já dancei ___ numa festa achando que ninguém estava olhando.", ele: "{n} já dançou ___ numa festa achando que ninguém estava olhando.", casa: ["a coreografia do Tchan", "funk de costas"] },
  { id: "conhecifesta", tema: "roles", eu: "Uma vez, numa festa, eu conheci alguém que ___.", ele: "Uma vez, numa festa, {n} conheceu alguém que ___.", casa: ["era sósia do Faustão", "dizia ser vampiro"] },
  { id: "denope", tema: "roles", eu: "Já dei no pé de uma festa sem ninguém ver porque ___.", ele: "{n} já deu no pé de uma festa sem ninguém ver porque ___.", casa: ["ia ter que lavar a louça", "o ex chegou"] },

  // 😱 NÃO ACREDITO QUE VOCÊ FEZ ISSO
  { id: "hospital", tema: "naoacredito", eu: "Já fui parar no hospital por causa de ___.", ele: "{n} já foi parar no hospital por causa de ___.", casa: ["um patinete", "uma espinha de peixe"] },
  { id: "quebreitentando", tema: "naoacredito", eu: "Já quebrei alguma coisa tentando ___.", ele: "{n} já quebrou alguma coisa tentando ___.", casa: ["fazer embaixadinha dentro de casa", "abrir um pote de azeitona"] },
  { id: "perseguiu", tema: "naoacredito", eu: "Uma vez ___ me perseguiu na rua.", ele: "Uma vez ___ perseguiu {n} na rua.", casa: ["um ganso", "um palhaço"] },
  { id: "semsair", tema: "naoacredito", eu: "Uma vez eu fiquei sem conseguir sair de ___.", ele: "Uma vez {n} ficou sem conseguir sair de ___.", casa: ["um elevador", "um banheiro químico"] },
  { id: "comiachando", tema: "naoacredito", eu: "Já comi ___ achando que era outra coisa.", ele: "{n} já comeu ___ achando que era outra coisa.", casa: ["sabonete", "ração de gato"] },
  { id: "entreiachando", tema: "naoacredito", eu: "Já entrei em ___ achando que era outro lugar.", ele: "{n} já entrou em ___ achando que era outro lugar.", casa: ["um velório", "uma igreja"] },
  { id: "liguei", tema: "naoacredito", eu: "Já liguei pra ___ achando que era outra pessoa.", ele: "{n} já ligou pra ___ achando que era outra pessoa.", casa: ["o ex", "o chefe"] },
  { id: "confundiram", tema: "naoacredito", eu: "Já me confundiram com ___.", ele: "Já confundiram {n} com ___.", casa: ["um jogador de futebol", "o garçom"] },
  { id: "fugide", tema: "naoacredito", eu: "Já fugi de ___.", ele: "{n} já fugiu de ___.", casa: ["uma galinha", "um casamento"] },
  { id: "leveisemperceber", tema: "naoacredito", eu: "Já levei ___ pra casa sem perceber.", ele: "{n} já levou ___ pra casa sem perceber.", casa: ["a caneta do banco", "o controle da TV do hotel"] },
  { id: "perdi", tema: "naoacredito", eu: "Já perdi ___ de um jeito completamente idiota.", ele: "{n} já perdeu ___ de um jeito completamente idiota.", casa: ["um dente", "o celular"] },
  { id: "policia", tema: "naoacredito", eu: "Já tive que explicar pra polícia que ___.", ele: "{n} já teve que explicar pra polícia que ___.", casa: ["o jacaré era de pelúcia", "a galinha fugiu sozinha"] },
  { id: "menti", tema: "naoacredito", eu: "Já menti pra alguém dizendo que ___.", ele: "{n} já mentiu pra alguém dizendo que ___.", casa: ["era primo do Neymar", "tinha um irmão gêmeo"] },

  // 🎭 COMPLETE COMO SE FOSSE VERDADE
  { id: "vizinho", tema: "imagine", eu: "Meu vizinho bateu na minha porta às 3 da manhã porque ___.", ele: "O vizinho de {n} bateu na porta às 3 da manhã porque ___.", casa: ["queria um pouco de açúcar", "o gato estava no telhado"] },
  { id: "geladeira", tema: "imagine", eu: "Abri a geladeira e encontrei ___.", ele: "{n} abriu a geladeira e encontrou ___.", casa: ["o controle remoto", "um pinguim"] },
  { id: "msgchefe", tema: "imagine", eu: "Recebi uma mensagem do meu chefe dizendo ___.", ele: "{n} recebeu uma mensagem do chefe dizendo ___.", casa: ["hoje é dia de pijama", "pode vir de chinelo"] },
  { id: "medico", tema: "imagine", eu: "O médico olhou pra mim e disse: \"Você precisa parar de ___.\"", ele: "O médico olhou pra {n} e disse: \"Você precisa parar de ___.\"", casa: ["comer miojo cru", "dormir de meia"] },
  { id: "policiaparou", tema: "imagine", eu: "A polícia me parou porque ___.", ele: "A polícia parou {n} porque ___.", casa: ["estava cantando alto demais", "o carro estava limpo demais"] },
  { id: "cachorrolatiu", tema: "imagine", eu: "Meu cachorro começou a latir para ___.", ele: "O cachorro de {n} começou a latir para ___.", casa: ["a própria sombra", "o aspirador"] },
  { id: "acordeidentro", tema: "imagine", eu: "Acordei e percebi que estava dentro de ___.", ele: "{n} acordou e percebeu que estava dentro de ___.", casa: ["um ônibus pra Aparecida", "uma piscina de bolinhas"] },
  { id: "maeentrou", tema: "imagine", eu: "Minha mãe entrou no quarto e encontrou ___.", ele: "A mãe de {n} entrou no quarto e encontrou ___.", casa: ["um bode", "três pizzas"] },
  { id: "casamento", tema: "imagine", eu: "No meu casamento, o padre parou a cerimônia porque ___.", ele: "No casamento de {n}, o padre parou a cerimônia porque ___.", casa: ["o noivo dormiu", "tocou funk no celular"] },
  { id: "piloto", tema: "imagine", eu: "O piloto anunciou no avião: \"Senhores passageiros, temos um pequeno problema: ___.\"", ele: "No avião de {n}, o piloto anunciou: \"Senhores passageiros, temos um pequeno problema: ___.\"", casa: ["o café acabou", "esqueci a chave do avião"] },
];

// "Verdades" que os BOTS de teste confessam.
export const VERDADES_BOT = ["um pato de borracha", "uma bicicleta ergométrica", "o Silvio Santos", "pão de queijo congelado", "um fusca azul", "uma galinha d'angola", "a vizinha do 302", "um tamanduá de pelúcia"];
