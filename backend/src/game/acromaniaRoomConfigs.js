// Por enquanto só uma sala — o Acromania está começando (v1). Depois dá pra
// criar mais salas com dificuldades diferentes, igual fizemos no Stop/Quiz.
export const ACROMANIA_ROOM_CONFIGS = {
  "acromania-sala-1": {
    label: "Sala Livre",
    description: "Crie a frase mais criativa e vote na melhor da rodada.",
    maxPlayers: 10,
    writingSeconds: 60,     // tempo pra escrever a frase
    votingSeconds: 20,      // tempo pra votar na melhor
    intermissionSeconds: 10, // intervalo entre rodadas
    lettersCount: 3,
    pointsForWin: 50,
    // Ideal ter 3+ jogadores pra votação fazer sentido de verdade, mas como o
    // site ainda tem pouco público, deixamos sem essa trava por enquanto —
    // dá pra reativar isso facilmente aumentando esse número depois.
    minPlayersToStart: 1,
  },
};

export const DEFAULT_ACROMANIA_ROOM_ID = "acromania-sala-1";
