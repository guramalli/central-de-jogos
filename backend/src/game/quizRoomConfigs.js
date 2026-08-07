// Configuração de cada sala do Quiz. Cada tema vira DUAS salas — fácil e
// difícil — geradas automaticamente aqui embaixo, pra não repetir bloco por
// bloco. Direito é exceção: fica só uma sala (o assunto já é nichado o
// suficiente sem precisar dividir mais ainda).
const THEMES = [
  { key: "esportes", name: "Esportes" },
  { key: "ciencias", name: "Ciências" },
  { key: "historia", name: "História" },
  { key: "cinema", name: "Cinema" },
  { key: "letras", name: "Letras" },
  { key: "geral", name: "Conhecimentos Gerais" },
  { key: "musica", name: "Música" },
  { key: "series", name: "Séries e TV" },
  { key: "novelas", name: "Novelas" },
  { key: "geografia", name: "Geografia" },
];

function buildDifficultyRooms(themeKey, themeName) {
  return {
    [`quiz-${themeKey}-facil`]: {
      label: `${themeName} — Fácil`,
      themeKey,
      difficultyFilter: "facil",
      description: `Perguntas mais tranquilas de ${themeName.toLowerCase()}.`,
      maxPlayers: 10,
      questionSeconds: 40,
      revealIntervalSeconds: 6,
      intermissionSeconds: 8,
      pointsPerCorrect: 8,
    },
    [`quiz-${themeKey}-dificil`]: {
      label: `${themeName} — Difícil`,
      themeKey,
      difficultyFilter: "dificil",
      description: `Perguntas mais puxadas de ${themeName.toLowerCase()}.`,
      maxPlayers: 10,
      questionSeconds: 35,
      revealIntervalSeconds: 4,
      intermissionSeconds: 8,
      pointsPerCorrect: 15,
    },
  };
}

export const QUIZ_ROOM_CONFIGS = {
  ...THEMES.reduce((acc, t) => ({ ...acc, ...buildDifficultyRooms(t.key, t.name) }), {}),

  "quiz-direito": {
    label: "Direito",
    themeKey: "direito",
    description: "Código Civil, Penal, Tributário e mais — pra quem manja de leis.",
    maxPlayers: 10,
    questionSeconds: 45,
    revealIntervalSeconds: 5,
    intermissionSeconds: 8,
    pointsPerCorrect: 15,
  },
};

export const DEFAULT_QUIZ_ROOM_ID = "quiz-esportes-facil";
