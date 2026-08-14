// Futebol — campeões internacionais, artilheiros e curiosidades de
// jogadores, para a sala PADRÃO (fácil + médio).
//
// Regras seguidas:
//  - temporadas europeias sempre no formato "2009/10", nunca "em 2010"
//    (o ano solto pode ser duas temporadas diferentes);
//  - só fatos consolidados e amplamente documentados — nada de número
//    que varia conforme a fonte;
//  - resposta nunca aparece no enunciado; resposta curta.
//
// Importado por: npm run import-futebol-campeoes
export const FUTEBOL_CAMPEOES = {
  futebol: [
    // ===== Campeões históricos e marcantes — Europa =====
    { question: "Qual clube de Londres venceu o Campeonato Inglês na temporada 2009/10, comandado por Carlo Ancelotti?", answer: "Chelsea", difficulty: "medio" },
    { question: "Qual clube surpreendeu o mundo ao vencer o Campeonato Inglês de 2015/16, sendo apontado como zebra histórica?", answer: "Leicester", difficulty: "facil" },
    { question: "Qual clube encerrou um jejum de 30 anos ao vencer o Campeonato Inglês de 2019/20, com Jürgen Klopp?", answer: "Liverpool", difficulty: "facil" },
    { question: "Qual clube inglês completou a temporada 2003/04 invicto, com o time apelidado de Invencíveis?", answer: "Arsenal", difficulty: "medio" },
    { question: "Qual clube espanhol quebrou a hegemonia de Barcelona e Real ao vencer o Espanhol de 2013/14, com Diego Simeone?", answer: "Atlético de Madrid", difficulty: "medio" },
    { question: "Qual clube italiano venceu o Italiano de 2022/23, seu primeiro título nacional desde a era Maradona?", answer: "Napoli", difficulty: "medio" },
    { question: "Qual clube alemão venceu a Bundesliga de 2023/24 de forma invicta, sob o comando de Xabi Alonso?", answer: "Bayer Leverkusen", difficulty: "medio" },
    { question: "Qual clube do Principado venceu o Campeonato Francês de 2016/17, com um jovem Mbappé no elenco?", answer: "Monaco", difficulty: "medio" },

    // ===== Champions League =====
    { question: "Qual clube venceu a Champions de 2004/05 após estar perdendo por 3 a 0 no intervalo da decisão, em Istambul?", answer: "Liverpool", difficulty: "medio" },
    { question: "Qual clube italiano venceu a Champions de 2009/10, completando a tríplice coroa com Mourinho?", answer: "Inter de Milão", difficulty: "medio" },
    { question: "Qual clube inglês venceu sua primeira Champions em 2011/12, com gol de empate de Drogba na decisão?", answer: "Chelsea", difficulty: "medio" },
    { question: "Qual clube conquistou em 2013/14 o título europeu apelidado de La Décima?", answer: "Real Madrid", difficulty: "medio" },
    { question: "Qual clube português venceu a Champions de 2003/04, revelando o treinador José Mourinho ao mundo?", answer: "Porto", difficulty: "medio" },
    { question: "Qual clube inglês completou a tríplice coroa em 2022/23, vencendo sua primeira Champions com Guardiola?", answer: "Manchester City", difficulty: "facil" },
    { question: "Quantos gols Cristiano Ronaldo marcou na Champions de 2013/14, recorde de uma única edição?", answer: "17", difficulty: "medio" },
    { question: "Contra qual clube alemão Messi marcou cinco gols numa única partida de Champions, em 2012?", answer: "Bayer Leverkusen", difficulty: "medio" },

    // ===== Copa do Mundo: artilheiros e campeões =====
    { question: "Quem foi o artilheiro da Copa de 2002, com oito gols?", answer: "Ronaldo", difficulty: "facil" },
    { question: "Qual colombiano foi o artilheiro da Copa de 2014, com seis gols?", answer: "James Rodríguez", difficulty: "medio" },
    { question: "Qual inglês foi o artilheiro da Copa de 2018?", answer: "Harry Kane", difficulty: "medio" },
    { question: "Quem foi o artilheiro da Copa de 2022, com oito gols, incluindo três na decisão?", answer: "Mbappé", difficulty: "facil" },
    { question: "Qual seleção venceu a Eurocopa de 2016, com gol de Éder na prorrogação da decisão?", answer: "Portugal", difficulty: "medio" },
    { question: "Qual seleção conquistou a Copa de 2014 vencendo a Argentina na decisão do Maracanã?", answer: "Alemanha", difficulty: "facil" },
    { question: "Qual alemão se tornou o maior artilheiro da história das Copas ao marcar seu 16º gol, em 2014?", answer: "Klose", difficulty: "medio" },

    // ===== Brasileirão: campeões e artilheiros =====
    { question: "Qual atacante do Goiás foi o artilheiro do Brasileirão de 2003, com 31 gols?", answer: "Dimba", difficulty: "medio" },
    { question: "Qual centroavante apelidado de Coração Valente foi o artilheiro do Brasileirão de 2004 pelo Athletico-PR?", answer: "Washington", difficulty: "medio" },
    { question: "Qual atacante do Flamengo foi o artilheiro do Brasileirão de 2019, ano do título nacional e da Libertadores?", answer: "Gabigol", difficulty: "facil" },
    { question: "Qual clube mineiro venceu o Brasileirão de 2003, no primeiro ano dos pontos corridos, com Alex de camisa 10?", answer: "Cruzeiro", difficulty: "medio" },
    { question: "Qual clube venceu o Brasileirão de 2009 com Adriano e Petkovic no elenco?", answer: "Flamengo", difficulty: "medio" },
    { question: "Qual clube paulista encerrou em 2016 um jejum de 22 anos sem títulos brasileiros?", answer: "Palmeiras", difficulty: "medio" },
    { question: "Qual clube venceu o Brasileirão de 2021 encerrando um jejum de 50 anos, com Hulk no ataque e Cuca no comando?", answer: "Atlético Mineiro", difficulty: "facil" },
    { question: "Qual clube carioca venceu Brasileirão e Libertadores no mesmo ano de 2024, com John Textor como dono?", answer: "Botafogo", difficulty: "facil" },
    { question: "Qual treinador português comandou o Flamengo nos títulos do Brasileirão e da Libertadores de 2019?", answer: "Jorge Jesus", difficulty: "facil" },

    // ===== Onde nasceram =====
    { question: "Em qual cidade paulista nasceu Neymar?", answer: "Mogi das Cruzes", difficulty: "medio" },
    { question: "Em qual cidade mineira nasceu Pelé?", answer: "Três Corações", difficulty: "medio" },
    { question: "Em qual cidade argentina nasceu Lionel Messi?", answer: "Rosário", difficulty: "medio" },
    { question: "Em qual ilha portuguesa nasceu Cristiano Ronaldo?", answer: "Madeira", difficulty: "medio" },
    { question: "Em qual cidade nasceu Kaká?", answer: "Brasília", difficulty: "medio" },
    { question: "Em qual cidade gaúcha nasceu Ronaldinho Gaúcho?", answer: "Porto Alegre", difficulty: "facil" },
    { question: "Em qual cidade inglesa nasceu Erling Haaland, na época em que seu pai jogava por lá?", answer: "Leeds", difficulty: "medio" },

    // ===== Onde começaram =====
    { question: "Em qual clube argentino Messi jogou nas categorias de base antes de se mudar para o Barcelona?", answer: "Newell's Old Boys", difficulty: "medio" },
    { question: "Qual clube português revelou Cristiano Ronaldo antes da venda ao Manchester United?", answer: "Sporting", difficulty: "medio" },
    { question: "Em qual clube mineiro Ronaldo Fenômeno começou a carreira profissional?", answer: "Cruzeiro", difficulty: "medio" },
    { question: "Qual clube gaúcho revelou Ronaldinho Gaúcho?", answer: "Grêmio", difficulty: "facil" },
    { question: "Em qual clube de Buenos Aires Maradona estreou como profissional, em 1976?", answer: "Argentinos Juniors", difficulty: "medio" },
    { question: "Qual clube francês revelou Mbappé antes da transferência ao PSG?", answer: "Monaco", difficulty: "medio" },
    { question: "Em qual clube paulista Kaká foi revelado antes de ir ao Milan?", answer: "São Paulo", difficulty: "facil" },
    { question: "Qual clube carioca revelou Romário?", answer: "Vasco", difficulty: "medio" },

    // ===== Números e feitos de carreira =====
    { question: "Com quantos gols na carreira Pelé entrou para o Guinness, contando amistosos?", answer: "1283", difficulty: "medio" },
    { question: "Quantas Copas do Mundo Pelé venceu como jogador, feito único na história?", answer: "Três", difficulty: "facil" },
    { question: "Aos quantos anos Pelé conquistou sua primeira Copa do Mundo, em 1958?", answer: "17", difficulty: "medio" },
    { question: "Qual brasileiro venceu a Bola de Ouro de 2007, então no Milan?", answer: "Kaká", difficulty: "medio" },
    { question: "Quantos gols Gerd Müller marcou pela Alemanha na Copa de 1970, recorde de uma edição no pós-guerra?", answer: "Dez", difficulty: "medio" },
    { question: "Qual meia brasileiro divide com o argentino Norberto Méndez o posto de maior artilheiro da história da Copa América?", answer: "Zizinho", difficulty: "medio" },
  ],
};
