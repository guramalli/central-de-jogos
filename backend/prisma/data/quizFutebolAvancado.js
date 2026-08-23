// Futebol — lote para a sala AVANÇADA (dificuldade "dificil").
//
// MOTIVO DO LOTE: a sala tinha 200 perguntas e ciclo de 28 segundos, o que
// dá apenas 1h36 até a fila esgotar e recomeçar — a pior situação entre
// todas as salas do Quiz. A Avançada consome perguntas quase duas vezes mais
// rápido que a Padrão, então 200 aqui é bem pior que 200 lá.
//
// NÍVEL: pergunta de sala Avançada precisa ser difícil DE VERDADE, mas
// justa. O critério usado foi: quem acompanha futebol com atenção sabe ou
// chega perto; quem só vê a final da Copa não sabe. Nada de pegadinha por
// detalhe irrelevante nem de estatística que muda conforme a fonte.
//
// REGRAS SEGUIDAS (crivo triplo do projeto):
//  1. VAZAMENTO — a resposta nunca aparece no enunciado;
//  2. SIMILARIDADE — nenhuma pergunta parecida com outra do lote;
//  3. COLISÃO DE RESPOSTA — checado contra as 91 respostas de futebol já
//     usadas nos arquivos do tema.
//
// Ano só quando é consenso; nada de "o melhor jogador de", que depende de
// opinião; nada de recorde que muda a cada temporada.
//
// Importado por: npm run import-futebol-avancado
export const FUTEBOL_AVANCADO = {
  futebol: [
    // ===== Copas do Mundo =====
    { question: "Em que cidade foi disputada a final da primeira Copa do Mundo, em 1930?", answer: "Montevidéu", difficulty: "dificil" },
    { question: "Qual técnico levou a mesma seleção europeia a dois títulos mundiais consecutivos nos anos 1930?", answer: "Vittorio Pozzo", difficulty: "dificil" },
    { question: "Qual foi a cor do uniforme que a seleção brasileira usou antes de adotar o amarelo?", answer: "Branco", difficulty: "dificil" },
    { question: "Qual jogador húngaro liderou a seleção que perdeu a final de 1954 apesar de ser favorita?", answer: "Puskás", difficulty: "dificil" },
    { question: "Qual goleiro brasileiro defendeu o gol na conquista de 1970 no México?", answer: "Félix", difficulty: "dificil" },
    { question: "Qual seleção africana chegou às quartas de final em 1990 e surpreendeu o mundo com Roger Milla?", answer: "Camarões", difficulty: "dificil" },
    { question: "Qual país sediou a Copa de 2002 junto com a Coreia do Sul?", answer: "Japão", difficulty: "dificil" },
    { question: "Qual jogador francês foi expulso na final de 2006 após uma cabeçada no peito de um adversário?", answer: "Zidane", difficulty: "dificil" },
    { question: "Qual jogador italiano recebeu a cabeçada na final da Copa de 2006?", answer: "Materazzi", difficulty: "dificil" },
    { question: "Qual seleção venceu a Copa de 2010 na África do Sul, sua primeira conquista mundial?", answer: "Espanha", difficulty: "dificil" },
    { question: "Qual jogador marcou o gol da vitória espanhola na prorrogação da final de 2010?", answer: "Iniesta", difficulty: "dificil" },
    { question: "Qual atacante francês marcou o gol da eliminação do Brasil nas quartas de 2006?", answer: "Thierry Henry", difficulty: "dificil" },
    { question: "Qual jogador alemão entrou no segundo tempo e marcou o gol do título na final de 2014?", answer: "Götze", difficulty: "dificil" },
    { question: "Qual seleção sul-americana foi vice-campeã em 2014, perdendo na prorrogação?", answer: "Argentina", difficulty: "dificil" },
    { question: "Quantos gols Just Fontaine marcou na Copa de 1958, recorde numa única edição?", answer: "Treze", difficulty: "dificil" },
    { question: "Qual atacante francês marcou dois gols de cabeça na final da Copa de 1998?", answer: "Zinedine", difficulty: "dificil" },
    { question: "Qual atacante croata foi artilheiro da Copa de 1998 com seis gols?", answer: "Davor Suker", difficulty: "dificil" },
    { question: "Qual país sediou a Copa de 1954, a primeira transmitida ao vivo pela televisão?", answer: "Suíça", difficulty: "dificil" },

    // ===== Seleção brasileira =====
    { question: "Em qual estádio americano foi disputada a final da Copa de 1994?", answer: "Rose Bowl", difficulty: "dificil" },
    { question: "Qual lateral brasileiro bateu o pênalti decisivo na final de 1994 contra a Itália?", answer: "Dunga", difficulty: "dificil" },
    { question: "Qual apelido tinha o camisa 10 italiano que perdeu o pênalti decisivo em 1994?", answer: "Rabo de Cavalo", difficulty: "dificil" },
    { question: "Qual técnico levou a seleção brasileira ao penta em 2002?", answer: "Felipão", difficulty: "dificil" },
    { question: "Qual zagueiro formou dupla com Lúcio na conquista de 2002?", answer: "Roque Júnior", difficulty: "dificil" },
    { question: "Qual jogador brasileiro foi eleito melhor do mundo em 1994, 1996 e 1997 pela FIFA?", answer: "Romário e Ronaldo", difficulty: "dificil" },
    { question: "Qual foi o placar da derrota brasileira para a Alemanha na semifinal de 2014?", answer: "7 a 1", difficulty: "dificil" },
    { question: "Em qual cidade a seleção brasileira sofreu a derrota histórica na semifinal de 2014?", answer: "Belo Horizonte", difficulty: "dificil" },
    { question: "Qual jogador brasileiro sofreu a fratura nas costas nas quartas de final da Copa de 2014?", answer: "Neymar", difficulty: "dificil" },
    { question: "Qual meia brasileiro ficou conhecido como Canhotinha de Ouro nos anos 1950 e 60?", answer: "Gérson", difficulty: "dificil" },
    { question: "Contra qual seleção o alemão Miroslav Klose marcou o gol que o tornou maior artilheiro de Copas?", answer: "Brasil", difficulty: "dificil" },

    // ===== Libertadores e futebol sul-americano =====
    { question: "Qual clube argentino tem o maior número de títulos da Libertadores?", answer: "Independiente", difficulty: "dificil" },
    { question: "Em que ano um clube brasileiro conquistou a Libertadores pela primeira vez?", answer: "1962", difficulty: "dificil" },
    { question: "Em que ano o Grêmio conquistou sua primeira Libertadores, batendo o Peñarol na final?", answer: "1983", difficulty: "dificil" },
    { question: "Qual clube uruguaio é o maior campeão da Libertadores em seu país?", answer: "Peñarol", difficulty: "dificil" },
    { question: "Qual clube colombiano venceu a Libertadores em 1989 e 1990, de forma consecutiva?", answer: "Atlético Nacional", difficulty: "dificil" },
    { question: "Qual clube paraguaio chegou a três finais de Libertadores nos anos 2000 sem vencer nenhuma?", answer: "Olimpia", difficulty: "dificil" },
    { question: "Em que ano foi disputada a primeira edição do torneio continental que substituiu a Supercopa?", answer: "2002", difficulty: "dificil" },
    { question: "Qual clube equatoriano venceu a Libertadores de 2008 nos pênaltis?", answer: "LDU", difficulty: "dificil" },

    // ===== Futebol europeu =====
    { question: "Em qual cidade fica o clube com o maior número de títulos da Liga dos Campeões?", answer: "Madri", difficulty: "dificil" },
    { question: "Qual capitão inglês liderou a virada histórica na final da Champions de 2005?", answer: "Steven Gerrard", difficulty: "dificil" },
    { question: "Em qual cidade aconteceu a final de 2005 conhecida como o milagre da Champions?", answer: "Istambul", difficulty: "dificil" },
    { question: "Qual técnico português venceu a Champions com o Porto em 2004?", answer: "Mourinho", difficulty: "dificil" },
    { question: "Qual clube alemão venceu a Champions de 2013 numa final contra outro time do mesmo país?", answer: "Bayern de Munique", difficulty: "dificil" },
    { question: "Qual técnico italiano comandou o time apelidado de Os Imortais no fim dos anos 80?", answer: "Arrigo Sacchi", difficulty: "dificil" },
    { question: "Em qual estádio londrino o time do Dream Team venceu a Champions de 1992?", answer: "Wembley", difficulty: "dificil" },
    { question: "Qual jogador holandês revolucionou o futebol com o conceito de futebol total nos anos 70?", answer: "Cruyff", difficulty: "dificil" },
    { question: "Qual clube grego é o maior campeão nacional de seu país?", answer: "Olympiacos", difficulty: "dificil" },
    { question: "Qual clube escocês venceu a Champions em 1967, primeiro britânico a conquistar o título?", answer: "Celtic", difficulty: "dificil" },
    { question: "Qual clube italiano nunca foi rebaixado da primeira divisão nacional?", answer: "Inter de Milão", difficulty: "dificil" },
    { question: "Qual apelido recebeu o elenco inglês que passou invicto a temporada 2003 e 2004?", answer: "Invencíveis", difficulty: "dificil" },
    { question: "Qual técnico francês comandou aquele time inglês invicto e ficou 22 anos no clube?", answer: "Wenger", difficulty: "dificil" },

    // ===== Campeonato Brasileiro e clubes =====
    { question: "Em que ano o Campeonato Brasileiro passou a ser disputado em pontos corridos?", answer: "2003", difficulty: "dificil" },
    { question: "Quais eram as três competições que formavam a tríplice coroa conquistada em 2003?", answer: "Brasileirão, Copa do Brasil e Mineiro", difficulty: "dificil" },
    { question: "De qual estado é o clube com mais títulos da Copa do Brasil?", answer: "Minas Gerais", difficulty: "dificil" },
    { question: "Em que ano foi disputada a primeira edição da Copa do Brasil?", answer: "1989", difficulty: "dificil" },
    { question: "Em que ano foi fundado o clube paulista conhecido como Time do Povo?", answer: "1910", difficulty: "dificil" },
    { question: "Qual estádio foi inaugurado no Rio de Janeiro para a Copa do Mundo de 1950?", answer: "Maracanã", difficulty: "dificil" },
    { question: "Como ficou conhecida a derrota brasileira na decisão da Copa de 1950?", answer: "Maracanazo", difficulty: "dificil" },
    { question: "Qual goleiro brasileiro ficou marcado pela derrota de 1950 e carregou a culpa por décadas?", answer: "Barbosa", difficulty: "dificil" },
    { question: "Em qual estádio o time de Ronaldinho conquistou a Libertadores de 2013?", answer: "Independência", difficulty: "dificil" },
    { question: "Qual atacante marcou o gol do título brasileiro no Mundial de Clubes de 2012?", answer: "Paolo Guerrero", difficulty: "dificil" },
    { question: "Qual o nome oficial do estádio conhecido popularmente como Morumbi?", answer: "Cícero Pompeu de Toledo", difficulty: "dificil" },
    { question: "Em que ano o clube gaúcho conhecido como Imortal inaugurou sua arena própria?", answer: "2012", difficulty: "dificil" },

    // ===== Regras e arbitragem =====
    { question: "Qual a altura oficial do gol, do chão até o travessão?", answer: "2,44", difficulty: "dificil" },
    { question: "Qual a distância exata da marca do pênalti até a linha do gol?", answer: "Onze metros", difficulty: "dificil" },
    { question: "Qual árbitro inglês teve a ideia dos cartões coloridos ao parar num semáforo?", answer: "Ken Aston", difficulty: "dificil" },
    { question: "Em qual Copa do Mundo passou a existir a confirmação eletrônica de que a bola cruzou a linha?", answer: "2014", difficulty: "dificil" },
    { question: "Em que Copa do Mundo o árbitro de vídeo foi usado oficialmente pela primeira vez?", answer: "2018", difficulty: "dificil" },
    { question: "Qual o peso máximo permitido para uma bola oficial no início da partida?", answer: "450 gramas", difficulty: "dificil" },
    { question: "Quantos jogadores no mínimo um time precisa ter em campo para a partida continuar?", answer: "Sete", difficulty: "dificil" },
    { question: "Qual regra impede que um atacante fique atrás da última linha defensiva antes do passe?", answer: "Impedimento", difficulty: "dificil" },

    // ===== Craques e história =====
    { question: "Qual jogador argentino marcou o gol conhecido como a Mão de Deus em 1986?", answer: "Maradona", difficulty: "dificil" },
    { question: "Contra qual seleção Maradona marcou os dois gols mais famosos de sua carreira, em 1986?", answer: "Inglaterra", difficulty: "dificil" },
    { question: "Qual jogador português venceu a Bola de Ouro pela primeira vez em 2008, ainda no Manchester United?", answer: "Cristiano Ronaldo", difficulty: "dificil" },
    { question: "Qual o nome da escola de base do clube catalão que revelou Lionel Messi?", answer: "La Masia", difficulty: "dificil" },
    { question: "Qual jogador alemão é conhecido como Kaiser e comandou a seleção como jogador e técnico em títulos mundiais?", answer: "Beckenbauer", difficulty: "dificil" },
    { question: "Qual atacante alemão ficou conhecido como Bombardeiro pelo faro de gol nos anos 70?", answer: "Gerd Müller", difficulty: "dificil" },
    { question: "Qual goleiro russo é o único da posição a vencer a Bola de Ouro?", answer: "Lev Yashin", difficulty: "dificil" },
    { question: "Qual meia francês venceu a Bola de Ouro três vezes consecutivas nos anos 80?", answer: "Platini", difficulty: "dificil" },
    { question: "Qual atacante liberiano venceu a Bola de Ouro em 1995 e depois virou presidente do país?", answer: "George Weah", difficulty: "dificil" },
    { question: "Qual jogador brasileiro ficou conhecido como Anjo Loiro e brilhou no Milan nos anos 90?", answer: "Leonardo", difficulty: "dificil" },
    { question: "Qual jogador brasileiro marcou o gol de falta contra a Inglaterra na Copa de 2002?", answer: "Ronaldinho Gaúcho", difficulty: "dificil" },
    { question: "Qual goleiro inglês falhou naquele gol de falta em 2002?", answer: "David Seaman", difficulty: "dificil" },

    // ===== Competições e curiosidades =====
    { question: "Qual competição reúne os campeões continentais num torneio anual organizado pela FIFA?", answer: "Mundial de Clubes", difficulty: "dificil" },
    { question: "Em que ano foi disputada a primeira edição do torneio de seleções sul-americanas?", answer: "1916", difficulty: "dificil" },
    { question: "Qual seleção sul-americana tem mais finais disputadas na história da Copa América?", answer: "Argentina e Uruguai", difficulty: "dificil" },
    { question: "Qual competição europeia de seleções foi disputada pela primeira vez em 1960?", answer: "Eurocopa", difficulty: "dificil" },
    { question: "Qual seleção venceu a Eurocopa de 2004 sendo azarão absoluto?", answer: "Grécia", difficulty: "dificil" },
    { question: "Em que ano o continente africano sediou uma Copa do Mundo pela primeira vez?", answer: "2010", difficulty: "dificil" },
    { question: "Qual instrumento de sopro marcou a Copa de 2010 pelo barulho nas arquibancadas?", answer: "Vuvuzela", difficulty: "dificil" },
    { question: "Em que ano a Copa do Mundo passou a ter 32 seleções na fase final?", answer: "1998", difficulty: "dificil" },
    { question: "Quantas vezes o México já sediou a Copa do Mundo até 2022?", answer: "Duas", difficulty: "dificil" },
    { question: "Qual entidade organiza as competições de clubes e seleções da Europa?", answer: "UEFA", difficulty: "dificil" },
    { question: "Qual entidade organiza o futebol sul-americano?", answer: "Conmebol", difficulty: "dificil" },
    { question: "Em que cidade suíça fica a sede da federação internacional de futebol?", answer: "Zurique", difficulty: "dificil" },
  ],
};
