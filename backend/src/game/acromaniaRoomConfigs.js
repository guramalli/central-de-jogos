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
    // Quantidade de letras SORTEADA a cada rodada dentro desta faixa. Fixo
    // em 3 ficava curto e repetitivo; variar dá ritmo diferente entre uma
    // rodada e outra sem precisar de sala nova.
    lettersMin: 4,
    lettersMax: 6,
    pointsForWin: 50,
    // Precisa de pelo menos 3 jogadores pra votação fazer sentido de verdade.
    minPlayersToStart: 3,
  },
};

export const DEFAULT_ACROMANIA_ROOM_ID = "acromania-sala-1";
