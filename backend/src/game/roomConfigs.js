// Configuração de cada sala do jogo Stop. Adicionar uma sala nova é só
// acrescentar uma entrada aqui — StopRoom.js lê esses valores no lugar de
// usar tempos fixos, e a checagem de pontuação mínima já é aplicada
// automaticamente na entrada (join) de cada sala.
export const ROOM_CONFIGS = {
  // ===== Sala da Zoeira =====
  // Sala pra rir, não pra competir. Usa temas escrachados que não caem nas
  // outras salas, e NÃO pontua em ranking nenhum — a ideia é justamente
  // tirar a pressão e deixar a galera brincar sem se preocupar com nota.
  "stop-sala-1": {
    label: "Sala Padrão",
    description: "Sala livre para todos os jogadores.",
    answerSeconds: 50,
    intermissionSeconds: 20,
    minLifetimePoints: 0,
    difficulty: "basic",
    maxPlayers: 10,
    // Só pode pedir STOP com pelo menos 3 das 6 palavras já corretas
    // (não precisa preencher todos os campos).
    minCorrectToStop: 3,
    // Ninguém pode pedir STOP antes desses segundos, mesmo já com 3+ certas.
    minSecondsBeforeStop: 40,
    // Sala iniciante: só sorteia temas dessa lista fixa (mais fáceis),
    // em vez de qualquer tema cadastrado no site. Ajustável por enquanto —
    // dá pra adicionar/remover temas dessa lista quando quiser.
    fixedThemeKeys: [
      "nomes_pessoas",
      "cor",
      "cep",
      "profissao",
      "idiomas",
      "novelas_series",
      "bandas_musicais",
      "verbos",
    ],
  },
  "stop-sala-1b": {
    label: "Sala Padrão 2",
    description: "Segunda sala livre para todos os jogadores.",
    answerSeconds: 50,
    intermissionSeconds: 20,
    minLifetimePoints: 0,
    difficulty: "basic",
    maxPlayers: 10,
    minCorrectToStop: 3,
    minSecondsBeforeStop: 40,
    fixedThemeKeys: [
      "nomes_pessoas",
      "cor",
      "cep",
      "profissao",
      "idiomas",
      "novelas_series",
      "bandas_musicais",
      "verbos",
    ],
  },
  "stop-sala-intermediaria": {
    label: "Intermediário",
    description: "Resposta em 30s, intervalo de 10s.",
    answerSeconds: 30,
    intermissionSeconds: 10,
    // Limite de pontuação removido por enquanto — qualquer um pode entrar.
    minLifetimePoints: 0,
    difficulty: "mid",
    // Só pode pedir STOP com pelo menos 4 das 6 palavras já corretas.
    minCorrectToStop: 4,
    maxPlayers: 10,
    // Trava de tempo com degrau real entre as salas: na intermediária
    // ninguém corta a rodada antes dos 15s (na avançada continua 5s).
    minSecondsBeforeStop: 15,
  },
  "stop-sala-intermediaria-2": {
    label: "Intermediário 2",
    description: "Segunda sala de resposta em 30s, intervalo de 10s.",
    answerSeconds: 30,
    intermissionSeconds: 10,
    minLifetimePoints: 0,
    difficulty: "mid",
    minCorrectToStop: 4,
    maxPlayers: 10,
    // Trava de tempo com degrau real entre as salas: na intermediária
    // ninguém corta a rodada antes dos 15s (na avançada continua 5s).
    minSecondsBeforeStop: 15,
  },
  "stop-sala-avancada": {
    label: "Sala Avançada",
    description: "Resposta rápida, intervalo curto.",
    answerSeconds: 20,
    intermissionSeconds: 10,
    // Limite de pontuação removido por enquanto — qualquer um pode entrar.
    minLifetimePoints: 0,
    difficulty: "advanced",
    // Só pode pedir STOP com pelo menos 5 das 6 palavras já corretas.
    minCorrectToStop: 5,
    maxPlayers: 10,
    minSecondsBeforeStop: 5,
  },
  "stop-sala-avancada-2": {
    label: "Sala Avançada 2",
    description: "Segunda sala de resposta rápida, intervalo curto.",
    answerSeconds: 20,
    intermissionSeconds: 10,
    minLifetimePoints: 0,
    difficulty: "advanced",
    minCorrectToStop: 5,
    maxPlayers: 10,
    minSecondsBeforeStop: 5,
  },

  "stop-sala-zoeira": {
    label: "🤣 Sala da Zoeira",
    description: "Temas escrachados só pra rir. Não vale ponto nenhum — é resenha pura!",
    answerSeconds: 60,
    intermissionSeconds: 25,
    minLifetimePoints: 0,
    difficulty: "basic",
    maxPlayers: 12,
    minCorrectToStop: 3,
    minSecondsBeforeStop: 45,
    // Nada aqui conta pra ranking, patente ou premiação.
    semPontuacao: true,
    fixedThemeKeys: [
      "coisa_da_sogra",
      "coisas_todo_mundo_odeia",
      "motivo_termino",
      "coisas_pegam_fogo",
      "bebida",
      "comida_estranha",
      "apelido",
      "meme_internet",
      "grito_de_torcida",
    ],
  },
};

export const DEFAULT_ROOM_ID = "stop-sala-1";
