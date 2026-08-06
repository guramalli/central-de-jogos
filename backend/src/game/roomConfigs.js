// Configuração de cada sala do jogo Stop. Adicionar uma sala nova é só
// acrescentar uma entrada aqui — StopRoom.js lê esses valores no lugar de
// usar tempos fixos, e a checagem de pontuação mínima já é aplicada
// automaticamente na entrada (join) de cada sala.
export const ROOM_CONFIGS = {
  "stop-sala-1": {
    label: "Sala Padrão",
    description: "Sala livre para todos os jogadores.",
    answerSeconds: 50,
    intermissionSeconds: 20,
    minLifetimePoints: 0,
    difficulty: "basic",
    maxPlayers: 10,
    // Ninguém pode pedir STOP antes desses segundos, mesmo já preenchido tudo.
    minSecondsBeforeStop: 5,
  },
  "stop-sala-intermediaria": {
    label: "Sala Intermediária",
    description: "Resposta em 30s, intervalo de 10s.",
    answerSeconds: 30,
    intermissionSeconds: 10,
    // Limite de pontuação removido por enquanto — qualquer um pode entrar.
    minLifetimePoints: 0,
    difficulty: "mid",
    // Só pode pedir STOP com pelo menos 4 das 6 palavras já corretas.
    minCorrectToStop: 4,
    maxPlayers: 10,
    minSecondsBeforeStop: 5,
  },
  "stop-sala-avancada": {
    label: "Sala Avançada",
    description: "Resposta rápida, intervalo curto.",
    answerSeconds: 20,
    intermissionSeconds: 5,
    // Limite de pontuação removido por enquanto — qualquer um pode entrar.
    minLifetimePoints: 0,
    difficulty: "advanced",
    // Só pode pedir STOP com pelo menos 5 das 6 palavras já corretas.
    minCorrectToStop: 5,
    maxPlayers: 10,
    minSecondsBeforeStop: 5,
  },
};

export const DEFAULT_ROOM_ID = "stop-sala-1";
