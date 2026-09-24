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
    // Quantidade de letras por rodada: CRESCE ao longo do turno dentro desta
    // faixa (4,4,5,5,5,5,6,6 num turno de 8 — ver letrasDaRodada). Aquece com
    // poucas letras e aperta no fim; antes era sorteio 5–6 e metade das
    // rodadas tinha 6 letras pra 60s de escrita.
    lettersMin: 4,
    lettersMax: 6,
    pointsForWin: 50,
    // Partida de 8 rodadas (~7 min no ritmo atual). Curta o bastante pra
    // caber num intervalo de almoço e longa o bastante pra virar disputa.
    roundsPerTurn: 8,
    // Bônus do pódio da partida. Subiu de [100, 60, 30] por decisão de
    // produto: com 100, terminar em primeiro rendia ~10% do que a partida
    // inteira já pagava, e ninguém disputava as últimas rodadas. Em 1000 o
    // pódio passa a valer a pena — mais que todas as rodadas somadas.
    turnBonus: [1000, 700, 500],
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
    // Bônus do pódio da partida. Subiu de [100, 60, 30] por decisão de
    // produto: com 100, terminar em primeiro rendia ~10% do que a partida
    // inteira já pagava, e ninguém disputava as últimas rodadas. Em 1000 o
    // pódio passa a valer a pena — mais que todas as rodadas somadas.
    turnBonus: [1000, 700, 500],
    minPlayersToStart: 3,
    // SEM bots, nem com a variável ligada. É a sala pra quando você quiser
    // garantir que só há gente de verdade jogando — numa transmissão, por
    // exemplo, onde bot na lista de jogadores confundiria quem assiste.
    bots: false,
  },
};

export const DEFAULT_ACROMANIA_ROOM_ID = "acromania-sala-1";
