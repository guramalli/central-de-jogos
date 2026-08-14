// Futebol — perguntas para a sala PADRÃO (fácil + médio).
//
// Estilo "papo de torcedor": lances, decisões e histórias que quem
// acompanha reconhece na hora, em vez de estatística seca. Todas checadas
// em fato consolidado — nada de número de detalhe que muda conforme a fonte.
//
// Cuidados seguidos em todas:
//  - a resposta NUNCA aparece no enunciado;
//  - nada que envelhece ("atual", "recordista de hoje", campeão vigente);
//  - resposta curta, de uma ou duas palavras.
//
// Importado por: npm run import-futebol-torcedor
export const FUTEBOL_TORCEDOR = {
  futebol: [
    // ===== Lances eternizados =====
    { question: "Quem aplicou as famosas oito pedaladas em Rogério na decisão do Brasileirão de 2002, no Morumbi?", answer: "Robinho", difficulty: "facil" },
    { question: "Contra qual clube o Santos conquistou o Brasileirão de 2002 com os Meninos da Vila?", answer: "Corinthians", difficulty: "facil" },
    { question: "Qual goleiro salvou o Corinthians num mano a mano de Diego Souza nas quartas da Libertadores de 2012?", answer: "Cássio", difficulty: "medio" },
    { question: "Quem marcou de cabeça aos 42 do segundo tempo e classificou o Corinthians sobre o Vasco na Libertadores de 2012?", answer: "Paulinho", difficulty: "medio" },
    { question: "Qual jogador do Flamengo virou o jogo com dois gols nos minutos finais da decisão da Libertadores de 2019?", answer: "Gabigol", difficulty: "facil" },
    { question: "Contra qual clube argentino o Flamengo conquistou a Libertadores de 2019, no Peru?", answer: "River Plate", difficulty: "facil" },
    { question: "Quem fez o gol do título do Internacional sobre o Barcelona no Mundial de 2006?", answer: "Adriano Gabiru", difficulty: "medio" },
    { question: "Quem marcou o gol do São Paulo na final do Mundial de 2005 contra o Liverpool?", answer: "Mineiro", difficulty: "medio" },
    { question: "Quem fez o gol do Corinthians na decisão do Mundial de 2012 contra o Chelsea?", answer: "Guerrero", difficulty: "medio" },
    { question: "Qual goleiro defendeu o pênalti nos acréscimos contra o Tijuana e manteve vivo o título do Atlético-MG em 2013?", answer: "Victor", difficulty: "medio" },

    // ===== Decisões e títulos =====
    { question: "Contra qual time o Corinthians venceu a decisão do primeiro Mundial de Clubes da FIFA, em 2000?", answer: "Vasco", difficulty: "medio" },
    { question: "Qual clube carioca conquistou sua primeira Copa do Brasil em 2011, batendo o Coritiba na decisão?", answer: "Vasco", difficulty: "medio" },
    { question: "Qual time terminou como vice do Brasileirão de 2011, decidido na última rodada contra o Corinthians?", answer: "Vasco", difficulty: "medio" },
    { question: "Qual clube brasileiro venceu a Libertadores de 2012 sem perder uma única partida?", answer: "Corinthians", difficulty: "medio" },
    { question: "Contra qual clube argentino o Corinthians decidiu a Libertadores de 2012?", answer: "Boca Juniors", difficulty: "medio" },
    { question: "Qual clube gaúcho venceu o Mundial Interclubes de 1983 contra o Hamburgo, no Japão?", answer: "Grêmio", difficulty: "medio" },
    { question: "Qual clube brasileiro derrotou o Liverpool por 3 a 0 no Mundial de 1981?", answer: "Flamengo", difficulty: "medio" },
    { question: "Quem foi o camisa 10 do Flamengo naquele time que goleou o Liverpool em 1981?", answer: "Zico", difficulty: "facil" },
    { question: "Qual goleiro defendeu o pênalti decisivo que deu ao Palmeiras a Libertadores de 1999?", answer: "Marcos", difficulty: "medio" },
    { question: "Qual clube gaúcho conquistou a Libertadores de 2006 batendo o São Paulo na decisão?", answer: "Internacional", difficulty: "medio" },

    // ===== Seleção brasileira =====
    { question: "Quantos gols Ronaldo marcou na decisão da Copa de 2002 contra a Alemanha?", answer: "Dois", difficulty: "facil" },
    { question: "Em qual estádio o Brasil sofreu a goleada por 7 a 1 na Copa de 2014?", answer: "Mineirão", difficulty: "facil" },
    { question: "Quem marcou o gol de honra do Brasil naquela partida de 7 a 1, em 2014?", answer: "Oscar", difficulty: "medio" },
    { question: "Qual atacante brasileiro comemorou seu gol na Copa de 1994 embalando os braços, em homenagem ao filho recém-nascido?", answer: "Bebeto", difficulty: "facil" },
    { question: "Qual goleiro brasileiro defendeu a cobrança de Daniele Massaro na decisão por pênaltis de 1994?", answer: "Taffarel", difficulty: "medio" },
    { question: "Qual jogador italiano isolou a cobrança que deu o tetra ao Brasil em 1994?", answer: "Roberto Baggio", difficulty: "medio" },
    { question: "Contra qual seleção o Brasil perdeu a decisão da Copa de 1950 no Maracanã?", answer: "Uruguai", difficulty: "facil" },
    { question: "Qual uruguaio marcou o gol que calou o Maracanã em 1950?", answer: "Ghiggia", difficulty: "medio" },
    { question: "Quem cobrou a falta de efeito inacreditável contra a França no Torneio da França, em 1997?", answer: "Roberto Carlos", difficulty: "medio" },
    { question: "Qual seleção eliminou o Brasil nas quartas da Copa de 2006, com gol de Thierry Henry?", answer: "França", difficulty: "medio" },

    // ===== Ídolos e carreiras =====
    { question: "De qual clube italiano o Flamengo contratou Gabriel Barbosa por empréstimo em 2019?", answer: "Inter de Milão", difficulty: "medio" },
    { question: "Em qual clube da Vila Belmiro Neymar foi revelado antes de ir para a Europa?", answer: "Santos", difficulty: "facil" },
    { question: "Para qual clube espanhol Neymar foi vendido em 2013?", answer: "Barcelona", difficulty: "facil" },
    { question: "Qual meia foi companheiro de Robinho nos Meninos da Vila e depois brilhou no futebol europeu?", answer: "Diego", difficulty: "medio" },
    { question: "Em qual clube paulista Sócrates liderou, nos anos 1980, o movimento em que o elenco votava as decisões do dia a dia?", answer: "Corinthians", difficulty: "medio" },
    { question: "Qual atacante ficou conhecido como Baixinho e usou a camisa 11 do Brasil em 1994?", answer: "Romário", difficulty: "facil" },
    { question: "Contra qual clube Pelé marcou seu milésimo gol, no Maracanã, em 1969?", answer: "Vasco", difficulty: "medio" },
    { question: "Qual ponta direita encantou o mundo na Copa de 1962 e ficou conhecido como Anjo das Pernas Tortas?", answer: "Garrincha", difficulty: "medio" },
    { question: "Qual jogadora brasileira é a maior artilheira da história das Copas do Mundo, somando masculino e feminino?", answer: "Marta", difficulty: "facil" },
    { question: "Qual volante brasileiro saiu do Corinthians para o Tottenham em 2013, após a Libertadores e o Mundial?", answer: "Paulinho", difficulty: "medio" },

    // ===== Momentos difíceis e curiosidades =====
    { question: "Em qual ano o Corinthians foi rebaixado para a Série B do Brasileiro?", answer: "2007", difficulty: "medio" },
    { question: "Qual clube paulista foi rebaixado no mesmo ano em que o Santos foi campeão com Robinho e Diego?", answer: "Palmeiras", difficulty: "medio" },
    { question: "Qual apelido tem o clássico entre Corinthians e Palmeiras?", answer: "Derby Paulista", difficulty: "medio" },
    { question: "Qual clube carioca foi rebaixado em 1997 e voltou à elite após uma reviravolta nos tribunais?", answer: "Fluminense", difficulty: "medio" },
    { question: "Qual atacante ficou conhecido por comemorar gols fazendo o sinal de um telefone no ouvido e foi ídolo do Botafogo nos anos 1990?", answer: "Túlio", difficulty: "medio" },
    { question: "Qual estádio é conhecido como Vila Belmiro?", answer: "Urbano Caldeira", difficulty: "medio" },
    { question: "Em qual cidade fica o estádio Beira-Rio?", answer: "Porto Alegre", difficulty: "facil" },
    { question: "Qual é o apelido do estádio do Atlético-MG inaugurado em 2023?", answer: "Arena MRV", difficulty: "medio" },
    { question: "Qual clube mineiro tem a Raposa como mascote?", answer: "Cruzeiro", difficulty: "facil" },
    { question: "Qual clube brasileiro é apelidado de Peixe?", answer: "Santos", difficulty: "facil" },
    { question: "Qual clube cearense tem o Leão como mascote e é rival do Ceará no Clássico-Rei?", answer: "Fortaleza", difficulty: "medio" },

    // ===== Táticas, regras e bastidores =====
    { question: "Qual treinador comandou o Corinthians no título da Libertadores de 2012?", answer: "Tite", difficulty: "facil" },
    { question: "Qual treinador levou o Santos ao Brasileirão de 2002 comandando do vestiário após ser expulso na decisão?", answer: "Émerson Leão", difficulty: "medio" },
    { question: "Qual treinador brasileiro conquistou a Copa de 1994 com a seleção?", answer: "Parreira", difficulty: "medio" },
    { question: "Qual treinador comandou o São Paulo nos títulos mundiais de 1992 e 1993?", answer: "Telê Santana", difficulty: "medio" },
    { question: "Quantos jogadores de linha, sem contar o goleiro, cada time tem em campo?", answer: "Dez", difficulty: "facil" },
    { question: "Qual é a duração regulamentar de cada tempo numa partida profissional, em minutos?", answer: "45", difficulty: "facil" },
    { question: "Como se chama a punição aplicada quando um jogador comete falta dentro da própria área?", answer: "Pênalti", difficulty: "facil" },
    { question: "Qual é o nome do torneio de clubes mais importante da América do Sul?", answer: "Libertadores", difficulty: "facil" },
    { question: "Quantos clubes disputam a Série A do Campeonato Brasileiro no formato de pontos corridos?", answer: "Vinte", difficulty: "facil" },
  ],
};
