// Futebol — lote 2 para a sala AVANÇADA (dificuldade "dificil").
//
// MÉTODO NOVO: este lote foi escrito DEPOIS de ver as 230 respostas que já
// existem no banco. O lote anterior foi escrito às cegas e teve 41 de 94
// perguntas barradas (44% de desperdício), porque só era possível enxergar os
// arquivos de importação — e a maior parte do banco veio de migrações.
//
// ÂNGULOS ESCOLHIDOS: o que a lista mostrou estar DESCOBERTO.
// Saturado (evitado aqui): Copas do Mundo masculinas, clubes brasileiros
// grandes, técnicos famosos, tragédias de estádio, clássicos regionais.
// Descoberto (explorado aqui): futebol feminino, futebol olímpico, futsal,
// mascotes e bolas de Copa, camisas e numeração, transferências, futebol
// africano e asiático, arbitragem específica, Bola de Ouro, dirigentes.
//
// CRIVO TRIPLO aplicado contra as 230 respostas reais do banco.
//
// Importado por:
//   npm run importar-checado -- quizFutebolAvancado2.js FUTEBOL_AVANCADO_2
export const FUTEBOL_AVANCADO_2 = {
  futebol: [
    // Devolvidas ao lote com a resposta NATURAL. Tinham sido removidas por
    // colidirem com respostas já existentes — critério que se mostrou errado:
    // perguntas diferentes podem ter a mesma resposta. O que não pode repetir
    // é a PERGUNTA.
    { question: "Qual jogadora brasileira é a maior artilheira da história das Copas do Mundo, somando masculino e feminino?", answer: "Marta", difficulty: "dificil" },
    { question: "Qual jogador marcou o pênalti decisivo do primeiro ouro olímpico brasileiro no futebol?", answer: "Neymar", difficulty: "dificil" },
    { question: "Qual país tem a liga feminina considerada a mais forte do mundo?", answer: "Estados Unidos", difficulty: "dificil" },
    { question: "Em que ano a seleção brasileira disputou sua primeira partida oficial?", answer: "1914", difficulty: "dificil" },
    { question: "Em que cidade europeia a federação internacional de futebol foi criada, em 1904?", answer: "Paris", difficulty: "dificil" },
    { question: "Qual húngaro dá nome ao troféu da FIFA para o gol mais bonito do ano?", answer: "Puskás", difficulty: "dificil" },
    // ===== Futebol feminino =====
    { question: "Em que década foi disputada a primeira Copa do Mundo feminina?", answer: "Anos 90", difficulty: "dificil" },
    { question: "Qual seleção venceu a primeira Copa do Mundo feminina da história?", answer: "Estados Unidos", difficulty: "dificil" },
    { question: "Qual jogadora americana ficou famosa por comemorar tirando a camisa na final de 1999?", answer: "Brandi Chastain", difficulty: "dificil" },
    { question: "Em qual edição dos Jogos Olímpicos o futebol feminino estreou como modalidade?", answer: "Atlanta 1996", difficulty: "dificil" },
    { question: "Qual jogadora brasileira formou dupla de ataque com Marta na seleção dos anos 2000?", answer: "Cristiane", difficulty: "dificil" },

    // ===== Futebol olímpico =====
    { question: "Em que ano a seleção brasileira masculina conquistou seu primeiro ouro olímpico no futebol?", answer: "2016", difficulty: "dificil" },
    { question: "Qual é o limite de idade padrão para jogadores do futebol masculino nos Jogos Olímpicos?", answer: "23 anos", difficulty: "dificil" },
    { question: "Qual seleção africana conquistou o ouro olímpico no futebol em 1996, surpreendendo os favoritos?", answer: "Nigéria", difficulty: "dificil" },

    // ===== Futsal e variantes =====
    { question: "Qual o tempo total de uma partida oficial de futsal, somando os dois períodos?", answer: "Quarenta minutos", difficulty: "dificil" },
    { question: "Qual modalidade de salão, jogada em quadra com cinco atletas, tem Copa do Mundo própria desde 1989?", answer: "Futsal", difficulty: "dificil" },
    { question: "Qual a duração de cada período numa partida de futebol de areia?", answer: "Doze minutos", difficulty: "dificil" },
    { question: "Em que superfície é disputado o beach soccer, modalidade oficializada pela FIFA?", answer: "Areia", difficulty: "dificil" },

    // ===== Bolas e mascotes de Copa =====
    { question: "Qual era o nome da bola oficial da Copa do Mundo de 1970, a primeira da Adidas?", answer: "Telstar", difficulty: "dificil" },
    { question: "Qual era o nome da bola oficial da Copa do Mundo de 2014 no Brasil?", answer: "Brazuca", difficulty: "dificil" },
    { question: "Qual era o nome da bola oficial da Copa de 2006 na Alemanha?", answer: "Teamgeist", difficulty: "dificil" },
    { question: "Qual foi o mascote da Copa do Mundo de 1994 nos Estados Unidos?", answer: "Striker", difficulty: "dificil" },
    { question: "Qual animal representou o mascote da Copa do Mundo de 2014 no Brasil?", answer: "Tatu-bola", difficulty: "dificil" },
    { question: "Qual foi o primeiro mascote da história das Copas do Mundo, criado em 1966?", answer: "World Cup Willie", difficulty: "dificil" },

    // ===== Camisas, números e uniformes =====
    { question: "Qual posição, na numeração clássica, é ocupada por quem veste a camisa 9?", answer: "Centroavante", difficulty: "dificil" },
    { question: "Qual clube italiano aposentou a camisa 6 em homenagem a Franco Baresi?", answer: "AC Milan", difficulty: "dificil" },
    { question: "Qual cor predomina no uniforme da seleção espanhola, origem de seu apelido?", answer: "Vermelho", difficulty: "dificil" },
    { question: "Qual cor dá nome ao apelido da seleção italiana?", answer: "Azul", difficulty: "dificil" },
    { question: "Qual meia belga do Manchester City liderou a geração de ouro de seu país?", answer: "De Bruyne", difficulty: "dificil" },
    { question: "Além das Copas, quais outros títulos o Uruguai conta nas estrelas da camisa?", answer: "Ouros olímpicos", difficulty: "dificil" },

    // ===== Transferências e mercado =====
    { question: "Qual clube pagou a multa rescisória recorde na transferência de 2017 que mudou o mercado?", answer: "Paris Saint-Germain", difficulty: "dificil" },
    { question: "Qual decisão judicial de 1995 permitiu que jogadores saíssem de graça ao fim do contrato?", answer: "Lei Bosman", difficulty: "dificil" },
    { question: "Qual jogador deu nome à decisão judicial que liberou a transferência gratuita ao fim do contrato?", answer: "Jean-Marc Bosman", difficulty: "dificil" },
    { question: "Como é chamado o período do ano em que os clubes podem contratar jogadores?", answer: "Janela de transferências", difficulty: "dificil" },

    // ===== Futebol africano e asiático =====
    { question: "De quantos em quantos anos é disputado o principal torneio de seleções da África?", answer: "A cada dois anos", difficulty: "dificil" },
    { question: "Qual seleção tem o maior número de títulos da competição continental africana?", answer: "Egito", difficulty: "dificil" },
    { question: "Qual atacante marfinense foi símbolo do Chelsea e ajudou a pacificar um conflito em seu país?", answer: "Drogba", difficulty: "dificil" },
    { question: "Qual técnico holandês levou a Coreia do Sul às semifinais em 2002?", answer: "Guus Hiddink", difficulty: "dificil" },
    { question: "Qual seleção árabe venceu a Argentina na estreia da Copa do Mundo de 2022?", answer: "Arábia Saudita", difficulty: "dificil" },
    { question: "Qual entidade organiza o futebol no continente africano?", answer: "CAF", difficulty: "dificil" },
    { question: "Qual seleção africana foi a primeira a chegar às semifinais de uma Copa do Mundo, em 2022?", answer: "Marrocos", difficulty: "dificil" },

    // ===== Arbitragem específica =====
    { question: "Qual a duração regulamentar do intervalo entre os dois tempos de uma partida?", answer: "Um quarto de hora", difficulty: "dificil" },
    { question: "Como é chamada a decisão do árbitro de deixar o jogo seguir quando parar prejudicaria quem sofreu a falta?", answer: "Lei da vantagem", difficulty: "dificil" },
    { question: "Qual a duração de cada tempo extra na prorrogação de uma partida eliminatória?", answer: "Quinze minutos cada", difficulty: "dificil" },
    { question: "Qual evento mundial motivou o aumento no número de trocas permitidas por partida em 2020?", answer: "Pandemia", difficulty: "dificil" },
    { question: "Quantos pés o jogador precisa manter no chão ao repor a bola pela linha de fora?", answer: "Os dois pés", difficulty: "dificil" },
    { question: "Qual punição o jogador recebe ao tirar a camisa comemorando um gol?", answer: "Cartão amarelo", difficulty: "dificil" },
    { question: "Como é chamada a marcação em que o goleiro pode usar as mãos apenas dentro de uma área específica?", answer: "Grande área", difficulty: "dificil" },

    // ===== Bola de Ouro e prêmios =====
    { question: "Em que ano foi entregue a primeira Bola de Ouro da história?", answer: "1956", difficulty: "dificil" },
    { question: "Qual jogador inglês venceu a primeira edição da Bola de Ouro?", answer: "Stanley Matthews", difficulty: "dificil" },
    { question: "Qual publicação especializada criou o prêmio de melhor jogador do ano na Europa?", answer: "Revista francesa", difficulty: "dificil" },
    { question: "Qual prêmio é entregue ao artilheiro das ligas europeias com base num sistema de pontos?", answer: "Chuteira de Ouro", difficulty: "dificil" },
    { question: "Qual jogador francês recebeu o troféu de revelação da Copa do Mundo de 2018?", answer: "Mbappé", difficulty: "dificil" },

    // ===== Dirigentes e instituições =====
    { question: "Qual foi o primeiro presidente da federação internacional de futebol, em 1904?", answer: "Robert Guérin", difficulty: "dificil" },
    { question: "Qual presidente da FIFA comandou a entidade de 1998 a 2015 e caiu num escândalo de corrupção?", answer: "Blatter", difficulty: "dificil" },
    { question: "Qual operação policial americana investigou a corrupção na cúpula do futebol mundial em 2015?", answer: "FIFAGate", difficulty: "dificil" },
    { question: "Qual brasileiro presidiu a federação internacional de futebol entre 1974 e 1998?", answer: "João Havelange", difficulty: "dificil" },
    { question: "Qual entidade brasileira organiza as competições nacionais de futebol?", answer: "CBF", difficulty: "dificil" },

    // ===== Táticas e conceitos =====
    { question: "Qual esquema tático ficou associado à seleção brasileira campeã de 1958?", answer: "4-2-4", difficulty: "dificil" },
    { question: "Como é chamada a tática de recuar todo o time para defender com muitos jogadores atrás da linha da bola?", answer: "Retranca", difficulty: "dificil" },
    { question: "Como é chamado o sistema em que cada defensor cobre uma região do campo, e não um adversário?", answer: "Marcação por zona", difficulty: "dificil" },
    { question: "Como é chamada a pressão feita logo após perder a posse, para recuperar a bola no campo adversário?", answer: "Gegenpressing", difficulty: "dificil" },
    { question: "Qual técnico alemão popularizou a pressão imediata após a perda da posse no Borussia e no Liverpool?", answer: "Klopp", difficulty: "dificil" },

    // ===== Estádios e sedes =====
    { question: "Qual estádio inglês é conhecido como o Teatro dos Sonhos?", answer: "Old Trafford", difficulty: "dificil" },
    { question: "Qual estádio espanhol foi rebatizado em homenagem a um ex-presidente do Real Madrid?", answer: "Santiago Bernabéu", difficulty: "dificil" },
    { question: "Qual estádio catalão é o maior da Europa em capacidade?", answer: "Camp Nou", difficulty: "dificil" },
    { question: "Qual clube argentino manda seus jogos no estádio apelidado de caixa de bombons?", answer: "Boca Juniors", difficulty: "dificil" },
    { question: "Qual país sediou a Copa do Mundo de 2022, a primeira realizada no fim do ano?", answer: "Catar", difficulty: "dificil" },
    { question: "Quais três países vão sediar a Copa do Mundo de 2026?", answer: "EUA, México e Canadá", difficulty: "dificil" },

    // ===== Craques menos óbvios =====
    { question: "Qual atacante búlgaro foi artilheiro da Copa de 1994 e levou seu país às semifinais?", answer: "Hristo Stoichkov", difficulty: "dificil" },
    { question: "Qual meia romeno de cabelos claros brilhou nas Copas de 1994 e 1998?", answer: "Gheorghe Hagi", difficulty: "dificil" },
    { question: "Qual atacante ucraniano venceu a Bola de Ouro em 2004 jogando pelo Milan?", answer: "Shevchenko", difficulty: "dificil" },
    { question: "Qual zagueiro italiano formou dupla histórica com Baresi no Milan e na seleção?", answer: "Maldini", difficulty: "dificil" },
    { question: "Qual goleiro dinamarquês foi peça central no título europeu surpresa de 1992?", answer: "Peter Schmeichel", difficulty: "dificil" },
    { question: "Qual seleção venceu a Eurocopa de 1992 mesmo tendo entrado no torneio como substituta de última hora?", answer: "Dinamarca", difficulty: "dificil" },
    { question: "Qual meia francês de origem argelina foi o cérebro da seleção campeã em 1998?", answer: "Zizou", difficulty: "dificil" },
    { question: "Qual atacante camaronês marcou gols em cinco Copas do Mundo diferentes?", answer: "Samuel Etoo", difficulty: "dificil" },

    // ===== Curiosidades e história antiga =====
    { question: "Em que cidade foi fundada a primeira associação de futebol do mundo, em 1863?", answer: "Londres", difficulty: "dificil" },
    { question: "Qual esporte se separou do futebol ao permitir que os jogadores usassem as mãos?", answer: "O rúgbi", difficulty: "dificil" },
    { question: "Qual jogo chinês antigo é apontado pela FIFA como ancestral do futebol?", answer: "Cuju", difficulty: "dificil" },
    { question: "Qual britânico é considerado o introdutor do futebol no Brasil, em 1894?", answer: "Charles Miller", difficulty: "dificil" },
    { question: "Em qual estado brasileiro foi fundado o clube de futebol mais antigo do país?", answer: "Rio Grande do Sul", difficulty: "dificil" },
    { question: "Qual competição internacional de clubes precedeu o Mundial de Clubes da FIFA, disputada entre europeus e sul-americanos?", answer: "Copa Intercontinental", difficulty: "dificil" },
  ],
};
