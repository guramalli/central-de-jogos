// Configuração de cada sala do Quiz. Cada tema vira DUAS salas — fácil e
// difícil — geradas automaticamente aqui embaixo, pra não repetir bloco por
// bloco. Direito é exceção: fica só uma sala (o assunto já é nichado o
// suficiente sem precisar dividir mais ainda).
// O `escopo` diz O QUE CAI na sala, e é isso que aparece no card do lobby.
//
// Antes a descrição era gerada: "Perguntas de música pra todo mundo" — que
// não informa nada. A Central de Jogos antiga fazia melhor: "Biologia,
// Física, Química, Matemática e Tecnologia" embaixo de "Ciências". Quem lê
// sabe na hora se é a sala dele, em vez de entrar pra descobrir.
export const THEMES = [
  { key: "mitologia", name: "Mitologia e Religião", escopo: "Deuses gregos e nórdicos, lendas do folclore, religiões do mundo" },
  { key: "games", name: "Games", escopo: "Consoles, personagens, franquias e clássicos do fliperama ao online" },
  { key: "terceirao", name: "Terceirão", escopo: "Conteúdo de ensino médio — ENEM e vestibulares" },
  { key: "esportes", name: "Esportes", escopo: "Olimpíadas, basquete, vôlei, lutas, tênis e modalidades em geral" },
  { key: "futebol", name: "Futebol", escopo: "Clubes, craques, Copas, Libertadores e história do futebol" },
  { key: "automobilismo", name: "Automobilismo", escopo: "Fórmula 1, pilotos, escuderias, circuitos e carros de corrida" },
  { key: "anime", name: "Anime e HQ", escopo: "Mangás, animes, super-heróis da Marvel e DC, personagens e obras" },
  { key: "ciencias", name: "Ciências", escopo: "Biologia, Física, Química, Matemática e Tecnologia" },
  { key: "historia", name: "História", escopo: "Brasil e mundo — guerras, impérios, revoluções e personagens" },
  { key: "cinema", name: "Cinema", escopo: "Filmes, diretores, atores, Oscar e frases famosas do cinema" },
  { key: "letras", name: "Letras", escopo: "Literatura, gramática, escritores e escolas literárias" },
  { key: "geral", name: "Conhecimentos Gerais", escopo: "Um pouco de tudo — curiosidades, atualidades e cultura geral" },
  { key: "musica", name: "Música", escopo: "Cantores, bandas, álbuns e hits de todos os estilos" },
  // MPB e Rock são salas NOVAS, não uma divisão da Música.
  //
  // Dividir exigiria reclassificar cada pergunta já cadastrada uma a uma, e
  // deixaria pop, sertanejo, funk e rap sem sala nenhuma. Assim a Música
  // continua inteira e quem gosta desses dois estilos ganha uma sala com
  // perguntas escritas pra ela.
  { key: "mpb", name: "MPB", escopo: "Bossa nova, Tropicália, samba, Chico, Caetano, Elis e a música brasileira" },
  { key: "rock", name: "Rock'n Roll", escopo: "Do Elvis ao metal — Beatles, Metallica, Iron Maiden, Slipknot, Angra e o rock nacional" },
  { key: "series", name: "Séries e Streaming", escopo: "Netflix, HBO, Prime — séries, elencos e temporadas" },
  { key: "novelas", name: "Novelas", escopo: "Novelas brasileiras, autores, bordões e personagens marcantes" },
  { key: "geografia", name: "Geografia", escopo: "Países, capitais, rios, relevo, climas e mapas do mundo" },
];

// Chave -> nome legível. Usado nas ARENAS, que misturam temas: lá a
// pergunta vem sem contexto nenhum, e "Qual o elemento de símbolo Fe?"
// depois de uma de futebol pega o jogador desprevenido. Nas salas de tema
// único isso não é preciso — o tema já está no nome da sala.
export const NOME_DO_TEMA = Object.fromEntries(THEMES.map((t) => [t.key, t.name]));

function buildDifficultyRooms(themeKey, themeName, escopo) {
  return {
    [`quiz-${themeKey}-facil`]: {
      label: `${themeName} — Padrão`,
      themeKey,
      tier: "padrao",
      // Médio fica só aqui (não se repete na avançada) — sala mais cheia,
      // boa pra maioria dos jogadores.
      difficultyFilter: ["facil", "medio"],
      description: escopo || `Perguntas de ${themeName.toLowerCase()} pra todo mundo.`,
      maxPlayers: 15,
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
      description: escopo
        ? `${escopo} — só as perguntas mais puxadas.`
        : `Só as perguntas mais puxadas de ${themeName.toLowerCase()}.`,
      maxPlayers: 15,
      questionSeconds: 20, // tempo curto: na avançada tem que saber de cabeça
      revealIntervalSeconds: 4,
      // Começa sem nenhuma letra revelada: com o teto de 10%, se a fatia
      // inicial padrão (20%) fosse aplicada, o pouquíssimo de dica que
      // existe apareceria todo de uma vez e o gotejamento não faria nada.
      // Assim as letras pingam aos poucos até o limite de 10%.
      initialRevealPercent: 0,
      maxRevealPercent: 0.2, // revela até 20% da resposta — ajuda pouca, mas ajuda
      intermissionSeconds: 8,
      pointsPerCorrect: 15, // vale mais, já que é bem mais difícil
    },
  };
}

export const QUIZ_ROOM_CONFIGS = {
  // ===== Arenas Boca Livre Relâmpago =====
  // Modo turno (igual aos blocos do Stop): rodadas rápidas, cada acerto
  // vale 1 ponto no placar do turno, e no fim o pódio leva bônus. Tempo
  // curto de propósito — a graça é ser relâmpago.
  "quiz-arena-relampago-iniciante": {
    label: "⚡ Arena Boca Livre Relâmpago — Iniciante",
    tier: "arena",
    arena: true,
    multiAnswer: true,
    difficultyFilter: ["facil", "medio"],
    description: "Rodadas relâmpago de todos os temas. Todo mundo que acertar pontua, e o pódio do turno leva bônus — quanto mais gente na sala, mais posições premiadas.",
    maxPlayers: 20,
    questionSeconds: 14,
    revealIntervalSeconds: 2,
    initialRevealPercent: 0.25,
    maxRevealPercent: 0.5,
    intermissionSeconds: 5,
    pointsPerCorrect: 5,
    roundsPerTurn: 40,
    turnBonus: [1000, 700, 350, 200, 100],
    // Sem pelo menos 2 pessoas pontuando, o turno não paga bônus: sozinho o
    // jogador venceria todos os turnos sem disputa e faria ~45 mil pontos
    // por dia — estourando o teto mensal em dois dias. Começando em 2 pra
    // não travar a sala enquanto ela tem pouca gente; sobe se virar combinação.
    minScorersForBonus: 2,
  },
  "quiz-arena-relampago-avancada": {
    label: "⚡ Arena Boca Livre Relâmpago — Avançada",
    tier: "arena",
    arena: true,
    multiAnswer: true,
    difficultyFilter: ["dificil"],
    description: "Só as perguntas mais puxadas, e menos letras reveladas. Cada acerto vale mais e o bônus do pódio também. Pra quem é rápido de verdade.",
    maxPlayers: 20,
    questionSeconds: 14,
    revealIntervalSeconds: 2,
    initialRevealPercent: 0.2,
    maxRevealPercent: 0.35,
    intermissionSeconds: 5,
    // 8 e não 5: a Avançada só tem perguntas difíceis e revela menos letras
    // (20% a 35%, contra 25% a 50% da Iniciante). Pagando igual, quem
    // pontua racionalmente escolheria sempre a Iniciante e esta viraria sala
    // vazia. Mesma proporção que separa a Futebol Padrão (10) da Avançada
    // (15) nas salas normais.
    pointsPerCorrect: 8,
    roundsPerTurn: 40,
    // Bônus escalado pelo mesmo fator (×1,6), pra manter a proporção entre
    // acertar e vencer igual à da Iniciante.
    turnBonus: [1600, 1120, 560, 320, 160],
    // Sem pelo menos 2 pessoas pontuando, o turno não paga bônus: sozinho o
    // jogador venceria todos os turnos sem disputa e faria ~45 mil pontos
    // por dia — estourando o teto mensal em dois dias. Começando em 2 pra
    // não travar a sala enquanto ela tem pouca gente; sobe se virar combinação.
    minScorersForBonus: 2,
  },

  ...THEMES.reduce((acc, t) => ({ ...acc, ...buildDifficultyRooms(t.key, t.name, t.escopo) }), {}),

  "quiz-direito": {
    label: "Direito",
    themeKey: "direito",
    description: "Código Civil, Penal, Tributário e mais — pra quem manja de leis.",
    maxPlayers: 15,
    questionSeconds: 45,
    revealIntervalSeconds: 5,
    intermissionSeconds: 8,
    // 10 pontos, igual às salas padrão: a dica aqui é generosa (revela até
    // metade da resposta), então não faz sentido pagar como sala avançada.
    pointsPerCorrect: 10,
  },
};

export const DEFAULT_QUIZ_ROOM_ID = "quiz-esportes-facil";
