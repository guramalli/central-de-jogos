export const ACROMANIA_ROOM_CONFIGS = {
  "acromania-sala-1": {
    label: "Sala Livre",
    description: "Crie a frase mais criativa e vote na melhor da rodada.",
    maxPlayers: 15,
    writingSeconds: 60,     // tempo pra escrever a frase
    votingSeconds: 20,      // tempo pra votar na melhor
    // Intervalo entre rodadas. É também o tempo de LEITURA do resultado: as
    // frases e os votos ficam na tela durante ele. 10s era pouco pra ler 4 ou
    // 5 frases. Sobrou espaço no ciclo porque escrita e votação agora
    // encerram assim que todos respondem.
    intermissionSeconds: 16,
    // Quantidade de letras SORTEADA a cada rodada dentro desta faixa. Fixo
    // em 3 ficava curto e repetitivo; variar dá ritmo diferente entre uma
    // rodada e outra sem precisar de sala nova.
    lettersMin: 4,
    lettersMax: 6,
    pointsForWin: 50,
    // Partida de 8 rodadas (~7 min no ritmo atual). Curta o bastante pra
    // caber num intervalo de almoço e longa o bastante pra virar disputa.
    roundsPerTurn: 8,
    turnBonus: [100, 60, 30],
    // Precisa de pelo menos 3 jogadores pra votação fazer sentido de verdade.
    minPlayersToStart: 3,
    // Bots de teste podem entrar AQUI. Ligados pela variável ACROMANIA_BOTS
    // no Render; sem ela, nenhuma sala recebe bot.
    bots: true,
  },

  "acromania-sala-2": {
    label: "Sala 2",
    description: "Mesma partida da Sala Livre, só com gente de verdade.",
    maxPlayers: 15,
    writingSeconds: 60,
    votingSeconds: 20,
    intermissionSeconds: 16,
    lettersMin: 4,
    lettersMax: 6,
    pointsForWin: 50,
    roundsPerTurn: 8,
    turnBonus: [100, 60, 30],
    minPlayersToStart: 3,
    // SEM bots, nem com a variável ligada. É a sala pra quando você quiser
    // garantir que só há gente de verdade jogando — numa transmissão, por
    // exemplo, onde bot na lista de jogadores confundiria quem assiste.
    bots: false,
  },
};

export const DEFAULT_ACROMANIA_ROOM_ID = "acromania-sala-1";
