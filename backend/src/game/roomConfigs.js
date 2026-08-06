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
    maxPlayers: 10,
  },
  "stop-sala-avancada": {
    label: "Sala Avançada",
    description: "Só para jogadores experientes — resposta rápida, intervalo curto.",
    answerSeconds: 20,
    intermissionSeconds: 5,
    // Requer pelo menos 6000 pts vitalícios no Stop (por volta da patente "Troféu de Prata") para entrar.
    minLifetimePoints: 6000,
    // Só pode pedir STOP com pelo menos 5 das 6 palavras já corretas.
    minCorrectToStop: 5,
    maxPlayers: 10,
  },
};

export const DEFAULT_ROOM_ID = "stop-sala-1";
