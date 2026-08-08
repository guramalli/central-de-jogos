// Configuração de cada sala do Quiz. Cada tema vira DUAS salas — fácil e
// difícil — geradas automaticamente aqui embaixo, pra não repetir bloco por
// bloco. Direito é exceção: fica só uma sala (o assunto já é nichado o
// suficiente sem precisar dividir mais ainda).
const THEMES = [
  { key: "esportes", name: "Esportes" },
  { key: "futebol", name: "Futebol" },
  { key: "automobilismo", name: "Automobilismo" },
  { key: "anime", name: "Anime e HQ" },
  { key: "ciencias", name: "Ciências" },
  { key: "historia", name: "História" },
  { key: "cinema", name: "Cinema" },
  { key: "letras", name: "Letras" },
  { key: "geral", name: "Conhecimentos Gerais" },
  { key: "musica", name: "Música" },
  { key: "series", name: "Séries e Streaming" },
  { key: "novelas", name: "Novelas" },
  { key: "geografia", name: "Geografia" },
];

function buildDifficultyRooms(themeKey, themeName) {
  return {
    [`quiz-${themeKey}-facil`]: {
      label: `${themeName} — Padrão`,
      themeKey,
      tier: "padrao",
      // Médio fica só aqui (não se repete na avançada) — sala mais cheia,
      // boa pra maioria dos jogadores.
      difficultyFilter: ["facil", "medio"],
      description: `Perguntas de ${themeName.toLowerCase()} pra todo mundo.`,
      maxPlayers: 10,
      questionSeconds: 40,
      revealIntervalSeconds: 6,
      maxRevealPercent: 0.5, // revela até metade da resposta
      intermissionSeconds: 8,
      pointsPerCorrect: 10,
    },
    [`quiz-${themeKey}-dificil`]: {
      label: `${themeName} — Avançado`,
      themeKey,
      tier: "avancado",
      difficultyFilter: ["dificil"],
      description: `Só as perguntas mais puxadas de ${themeName.toLowerCase()}.`,
      maxPlayers: 10,
      questionSeconds: 35,
      revealIntervalSeconds: 4,
      maxRevealPercent: 0.3, // revela bem menos — mais difícil de adivinhar
      intermissionSeconds: 8,
      pointsPerCorrect: 15, // vale mais, já que é bem mais difícil
    },
  };
}

export const QUIZ_ROOM_CONFIGS = {
  // ===== Arenas Boca Livre Relâmpago =====
  // Modo turno (igual aos blocos do Stop): 50 rodadas rápidas, cada acerto
  // vale 1 ponto no placar do turno, e no fim o pódio leva bônus. Tempo
  // curto de propósito — a graça é ser relâmpago.
  "quiz-arena-relampago-iniciante": {
    label: "⚡ Arena Boca Livre Relâmpago — Iniciante",
    tier: "arena",
    arena: true,
    multiAnswer: true,
    difficultyFilter: ["facil", "medio"],
    description: "50 rodadas relâmpago de todos os temas. Todo mundo que acertar pontua — e os 5 primeiros do turno ainda levam bônus!",
    maxPlayers: 20,
    questionSeconds: 10,
    revealIntervalSeconds: 2,
    initialRevealPercent: 0.25,
    maxRevealPercent: 0.5,
    intermissionSeconds: 10,
    pointsPerCorrect: 1,
    roundsPerTurn: 50,
    turnBonus: [100, 60, 40, 20, 10],
  },
  "quiz-arena-relampago-avancada": {
    label: "⚡ Arena Boca Livre Relâmpago — Avançada",
    tier: "arena",
    arena: true,
    multiAnswer: true,
    difficultyFilter: ["dificil"],
    description: "50 rodadas relâmpago só com as perguntas mais puxadas. Todo mundo que acertar pontua. Pra quem é rápido de verdade.",
    maxPlayers: 20,
    questionSeconds: 10,
    revealIntervalSeconds: 2,
    initialRevealPercent: 0.2,
    maxRevealPercent: 0.35,
    intermissionSeconds: 10,
    pointsPerCorrect: 1,
    roundsPerTurn: 50,
    turnBonus: [100, 60, 40, 20, 10],
  },

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
