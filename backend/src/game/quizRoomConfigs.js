// Configuração de cada sala do Quiz. Igual ao Stop, adicionar uma sala nova
// (ex.: níveis de dificuldade maiores no futuro) é só acrescentar uma entrada
// aqui — a mecânica (revelação de letras, pontuação) continua a mesma,
// só os tempos/pontos por pergunta podem mudar por sala.
export const QUIZ_ROOM_CONFIGS = {
  "quiz-esportes": {
    label: "Esportes",
    themeKey: "esportes",
    description: "Perguntas de esportes — nível iniciante.",
    maxPlayers: 10,
    questionSeconds: 40,
    revealIntervalSeconds: 5,
    intermissionSeconds: 8,
    pointsPerCorrect: 10,
  },
  "quiz-ciencias": {
    label: "Ciências",
    themeKey: "ciencias",
    description: "Perguntas de ciências — nível iniciante.",
    maxPlayers: 10,
    questionSeconds: 40,
    revealIntervalSeconds: 5,
    intermissionSeconds: 8,
    pointsPerCorrect: 10,
  },
  "quiz-historia": {
    label: "História",
    themeKey: "historia",
    description: "Perguntas de história — nível iniciante.",
    maxPlayers: 10,
    questionSeconds: 40,
    revealIntervalSeconds: 5,
    intermissionSeconds: 8,
    pointsPerCorrect: 10,
  },
  "quiz-cinema": {
    label: "Cinema",
    themeKey: "cinema",
    description: "Perguntas de cinema — nível iniciante.",
    maxPlayers: 10,
    questionSeconds: 40,
    revealIntervalSeconds: 5,
    intermissionSeconds: 8,
    pointsPerCorrect: 10,
  },
  "quiz-letras": {
    label: "Letras",
    themeKey: "letras",
    description: "Perguntas de literatura — nível iniciante.",
    maxPlayers: 10,
    questionSeconds: 40,
    revealIntervalSeconds: 5,
    intermissionSeconds: 8,
    pointsPerCorrect: 10,
  },
};

export const DEFAULT_QUIZ_ROOM_ID = "quiz-esportes";
