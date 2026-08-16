// ===== TÍTULOS DE PERFIL =====
//
// Conquistas de longo prazo, desbloqueadas jogando. Duas famílias:
//
// QUIZ — por TEMA (soma os acertos das salas Padrão + Avançada do tema,
// lidos da tabela QuizRoomStat que o jogo já alimenta a cada rodada):
//   nível 1 (100 acertos)  → "Conhecedor de <tema>"
//   nível 2 (1000 acertos) → "Mestre de <tema>"
//   nível 3 (5000 acertos) → título ÉPICO exclusivo do tema (abaixo)
//
// STOP — por NÍVEL de sala (contadores da tabela StopStat):
//   quantidade de STOPs pedidos em salas padrão / intermediárias / avançadas,
//   mais o título relâmpago: STOP pedido em até RAPIDO_SEGUNDOS na avançada
//   (o tempo mínimo lá é 5s — sobra 1 segundo de janela; coisa de elite).
//
// Pra ajustar um número ou um nome, é só editar aqui: o endpoint de títulos
// e o perfil leem desta config.

export const QUIZ_NIVEIS = [
  { min: 1000, prefixo: "Conhecedor de" },
  { min: 5000, prefixo: "Mestre de" },
  { min: 10000, prefixo: null }, // usa o épico do tema
];

// Título épico (nível 3) de cada tema do Quiz.
export const QUIZ_EPICOS = {
  mitologia: "Oráculo Supremo",
  games: "Lenda Viva dos Games",
  terceirao: "Gabaritador Nato",
  esportes: "Almanaque Esportivo",
  futebol: "Enciclopédia Futebolística",
  automobilismo: "Pole Position Eterna",
  anime: "Sábio Otaku",
  ciencias: "Cientista de Plantão",
  historia: "Guardião da História",
  cinema: "Cinéfilo Absoluto",
  letras: "Imortal da Academia",
  geral: "Enciclopédia Ambulante",
  musica: "Ouvido Absoluto",
  series: "Maratonista Supremo",
  novelas: "Folhetinista Supremo",
  geografia: "Atlas Humano",
};

// Nome bonito de cada tema (pra montar "Conhecedor de Futebol" etc.)
export const QUIZ_NOMES = {
  mitologia: "Mitologia",
  games: "Games",
  terceirao: "Terceirão",
  esportes: "Esportes",
  futebol: "Futebol",
  automobilismo: "Automobilismo",
  anime: "Anime",
  ciencias: "Ciências",
  historia: "História",
  cinema: "Cinema",
  letras: "Letras",
  geral: "Conhecimentos Gerais",
  musica: "Música",
  series: "Séries",
  novelas: "Novelas",
  geografia: "Geografia",
};

// STOP: títulos por grupo de sala e quantidade de STOPs pedidos.
export const STOP_TITULOS = {
  padrao: [
    { min: 200, nome: "Dedo Nervoso" },
    { min: 1000, nome: "Xerife da Sala Padrão" },
    { min: 5000, nome: "Dono da Sala Padrão" },
  ],
  intermediario: [
    { min: 200, nome: "Gatilho Rápido" },
    { min: 1000, nome: "Veterano do Intermediário" },
    { min: 5000, nome: "Mestre do Intermediário" },
  ],
  avancada: [
    { min: 200, nome: "Elite do STOP" },
    { min: 1000, nome: "Lenda da Avançada" },
    { min: 5000, nome: "Imortal da Avançada" },
  ],
};

// Título relâmpago: STOP pedido em até este tempo (segundos) desde o início
// da rodada, contado só nas salas avançadas.
export const RAPIDO_SEGUNDOS = 6;
export const RAPIDO_TITULOS = [
  { min: 500, nome: "Relâmpago da Avançada" },
  { min: 2000, nome: "STOP Supersônico" },
];

// Mapeia o tempo mínimo de STOP da sala pro grupo de título. Salas fora
// destes tempos (ex.: Zoeira com 45s, salas privadas) não contam.
export function grupoDaSala(minSecondsBeforeStop) {
  if (minSecondsBeforeStop === 40) return "padrao";
  if (minSecondsBeforeStop === 15) return "intermediario";
  if (minSecondsBeforeStop === 5) return "avancada";
  return null;
}

// ===== Cálculo dos títulos a partir das estatísticas =====

// quizPorTema: { futebol: 4200, games: 130, ... } (acertos somados por tema)
export function titulosDoQuiz(quizPorTema) {
  const resultado = [];
  for (const [tema, nomeTema] of Object.entries(QUIZ_NOMES)) {
    const acertos = quizPorTema[tema] || 0;
    const titulos = QUIZ_NIVEIS.map((n) => ({
      nome: n.prefixo ? `${n.prefixo} ${nomeTema}` : (QUIZ_EPICOS[tema] || `Lenda de ${nomeTema}`),
      min: n.min,
      desbloqueado: acertos >= n.min,
    }));
    const desbloqueados = titulos.filter((t) => t.desbloqueado);
    const proximo = titulos.find((t) => !t.desbloqueado) || null;
    // Só entra na resposta se há algo a mostrar (desbloqueado ou progresso)
    if (desbloqueados.length > 0 || acertos > 0) {
      resultado.push({ tema, nomeTema, acertos, desbloqueados, proximo });
    }
  }
  return resultado;
}

// stopStats: [{ grupo, stops, rapidos }]
export function titulosDoStop(stopStats) {
  const porGrupo = new Map(stopStats.map((s) => [s.grupo, s]));
  const resultado = [];
  const rotulos = { padrao: "Salas Padrão", intermediario: "Salas Intermediárias", avancada: "Salas Avançadas" };
  for (const [grupo, tiers] of Object.entries(STOP_TITULOS)) {
    const stat = porGrupo.get(grupo);
    const stops = stat?.stops || 0;
    const titulos = tiers.map((t) => ({ ...t, desbloqueado: stops >= t.min }));
    const desbloqueados = titulos.filter((t) => t.desbloqueado);
    const proximo = titulos.find((t) => !t.desbloqueado) || null;
    if (desbloqueados.length > 0 || stops > 0) {
      resultado.push({ grupo, rotulo: rotulos[grupo], stops, desbloqueados, proximo });
    }
  }
  // Relâmpago (só avançada)
  const rapidos = porGrupo.get("avancada")?.rapidos || 0;
  const titulosRapido = RAPIDO_TITULOS.map((t) => ({ ...t, desbloqueado: rapidos >= t.min }));
  const desbloqueadosRapido = titulosRapido.filter((t) => t.desbloqueado);
  const proximoRapido = titulosRapido.find((t) => !t.desbloqueado) || null;
  if (desbloqueadosRapido.length > 0 || rapidos > 0) {
    resultado.push({
      grupo: "rapido",
      rotulo: `STOPs em até ${RAPIDO_SEGUNDOS}s (Avançada)`,
      stops: rapidos,
      desbloqueados: desbloqueadosRapido,
      proximo: proximoRapido,
    });
  }
  return resultado;
}

// ===== Detecção de desbloqueio em tempo real (pro anúncio no chat) =====
// Os contadores sobem de 1 em 1, então "desbloqueou agora" = o valor novo é
// EXATAMENTE o mínimo de algum título. Retorna o nome do título ou null.

export function tituloQuizDesbloqueado(tema, totalAcertosDoTema) {
  const nomeTema = QUIZ_NOMES[tema];
  if (!nomeTema) return null;
  for (const n of QUIZ_NIVEIS) {
    if (totalAcertosDoTema === n.min) {
      return n.prefixo ? `${n.prefixo} ${nomeTema}` : (QUIZ_EPICOS[tema] || `Lenda de ${nomeTema}`);
    }
  }
  return null;
}

export function tituloStopDesbloqueado(grupo, stops, rapidos) {
  const nomes = [];
  for (const t of STOP_TITULOS[grupo] || []) {
    if (stops === t.min) nomes.push(t.nome);
  }
  if (grupo === "avancada") {
    for (const t of RAPIDO_TITULOS) {
      if (rapidos === t.min) nomes.push(t.nome);
    }
  }
  return nomes;
}
