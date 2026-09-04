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
//   (a sala dá 20s; cravar em até 10s = metade do tempo = jogada rápida).
//
// Pra ajustar um número ou um nome, é só editar aqui: o endpoint de títulos
// e o perfil leem desta config.

// Caminho da logo de um título. A imagem é opcional: se o arquivo não
// existir em /public/titulos, o frontend cai na medalha 🏅. Convenção:
// titulo-<chave>-<nivel>.png  (nivel: bronze | prata | ouro)
const NIVEL_SLUG = ["bronze", "prata", "ouro"];
export function logoQuiz(tema, indiceNivel) {
  return `/titulos/titulo-${tema}-${NIVEL_SLUG[indiceNivel]}.png`;
}
export function logoStop(grupo, indiceNivel) {
  return `/titulos/titulo-stop-${grupo}-${NIVEL_SLUG[indiceNivel]}.png`;
}
export function logoRapido(indiceNivel) {
  // relâmpago começa em prata (500) e vai a ouro (2000)
  return `/titulos/titulo-rapido-${NIVEL_SLUG[indiceNivel + 1]}.png`;
}

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
  direito: "Jurista Supremo",
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
  direito: "Direito",
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
    { min: 2500, nome: "Lenda da Avançada" },
    { min: 5000, nome: "Imortal da Avançada" },
  ],
};

// Título relâmpago: STOP pedido em até este tempo (segundos) desde o início
// da rodada, contado só nas salas avançadas.
export const RAPIDO_SEGUNDOS = 10;
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
    const titulos = QUIZ_NIVEIS.map((n, i) => ({
      nome: n.prefixo ? `${n.prefixo} ${nomeTema}` : (QUIZ_EPICOS[tema] || `Lenda de ${nomeTema}`),
      min: n.min,
      logo: logoQuiz(tema, i),
      desbloqueado: acertos >= n.min,
    }));
    const desbloqueados = titulos.filter((t) => t.desbloqueado);
    const proximo = titulos.find((t) => !t.desbloqueado) || null;
    // Só entra na resposta se há algo a mostrar (desbloqueado ou progresso).
    // "titulos" leva TODOS os níveis (com desbloqueado true/false) pra que o
    // perfil mostre a jornada inteira desde o começo.
    if (desbloqueados.length > 0 || acertos > 0) {
      resultado.push({ tema, nomeTema, acertos, titulos, desbloqueados, proximo });
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
    const titulos = tiers.map((t, i) => ({ ...t, logo: logoStop(grupo, i), desbloqueado: stops >= t.min }));
    const desbloqueados = titulos.filter((t) => t.desbloqueado);
    const proximo = titulos.find((t) => !t.desbloqueado) || null;
    if (desbloqueados.length > 0 || stops > 0) {
      resultado.push({ grupo, rotulo: rotulos[grupo], stops, titulos, desbloqueados, proximo });
    }
  }
  // Relâmpago (só avançada)
  const rapidos = porGrupo.get("avancada")?.rapidos || 0;
  const titulosRapido = RAPIDO_TITULOS.map((t, i) => ({ ...t, logo: logoRapido(i), desbloqueado: rapidos >= t.min }));
  const desbloqueadosRapido = titulosRapido.filter((t) => t.desbloqueado);
  const proximoRapido = titulosRapido.find((t) => !t.desbloqueado) || null;
  if (desbloqueadosRapido.length > 0 || rapidos > 0) {
    resultado.push({
      grupo: "rapido",
      rotulo: `STOPs em até ${RAPIDO_SEGUNDOS}s (Avançada)`,
      stops: rapidos,
      titulos: titulosRapido,
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

// Dado o NOME de um título (o que fica salvo em user.tituloExibido), acha a
// logo correspondente. Varre Quiz (todos os temas/níveis), Stop e relâmpago.
// Retorna o caminho da logo ou null se não encontrar.
// Nome do título lendário. Declarado aqui em cima porque
// logoPorNomeDeTitulo precisa dele e roda antes da definição completa
// lá embaixo.
const TITULO_LENDARIO_NOME = "Lenda do Educação Gamer";

export function logoPorNomeDeTitulo(nome) {
  if (!nome) return null;
  // O lendário é definido fora das tabelas (não pertence a tema nem grupo),
  // então precisa ser resolvido à parte — senão quem o equipasse ficaria
  // sem logo nenhuma no hover e na vitrine.
  if (nome === TITULO_LENDARIO_NOME) return "/titulos/titulo-lendario.png";

  // Troféu de campeão mensal: o nome tem formato próprio ("Campeão Stop
  // Ago/2026", com "(2x)" opcional), então é resolvido por padrão em vez de
  // busca em tabela. Sem isto, quem equipasse o troféu ficaria sem emblema
  // nenhum no hover e na lista de jogadores.
  const campeao = /^Campeão (Stop|Quiz) /.exec(nome);
  if (campeao) {
    return `/titulos/titulo-campeao-${campeao[1].toLowerCase()}.png`;
  }
  // Quiz: reconstrói os nomes de cada tema/nível
  for (const [tema, nomeTema] of Object.entries(QUIZ_NOMES)) {
    for (let i = 0; i < QUIZ_NIVEIS.length; i++) {
      const n = QUIZ_NIVEIS[i];
      const nomeTitulo = n.prefixo ? `${n.prefixo} ${nomeTema}` : (QUIZ_EPICOS[tema] || `Lenda de ${nomeTema}`);
      if (nomeTitulo === nome) return logoQuiz(tema, i);
    }
  }
  // Stop por grupo
  for (const [grupo, tiers] of Object.entries(STOP_TITULOS)) {
    for (let i = 0; i < tiers.length; i++) {
      if (tiers[i].nome === nome) return logoStop(grupo, i);
    }
  }
  // Relâmpago
  for (let i = 0; i < RAPIDO_TITULOS.length; i++) {
    if (RAPIDO_TITULOS[i].nome === nome) return logoRapido(i);
  }
  return null;
}

// Nível (bronze/prata/ouro) de um título, a partir do nome salvo.
//
// Reaproveita a busca acima em vez de repetir os três laços: o caminho da
// logo já termina no nível, pela convenção de nomes dos arquivos
// (`titulo-<tema>-<nivel>.png`). Conferido nos 59 emblemas.
// Devolve null pra título desconhecido — quem chama trata como "sem cor".
export function nivelPorNomeDeTitulo(nome) {
  // Troféu de campeão e título lendário não seguem o padrão
  // "-bronze/prata/ouro.png" do nome do arquivo, então a regex abaixo
  // devolvia null e eles apareciam SEM COR na saudação de entrada — logo os
  // dois títulos mais raros do site, que são justamente os que merecem
  // destaque. Tratados aqui, antes da regra geral.
  if (/^Campeão (Stop|Quiz) /.test(nome)) return "campeao";
  if (nome === TITULO_LENDARIO_NOME) return "lendario";

  const logo = logoPorNomeDeTitulo(nome);
  if (!logo) return null;
  const achado = logo.match(/-(bronze|prata|ouro)\.png$/i);
  return achado ? achado[1].toLowerCase() : null;
}

// ===== Título lendário: ter TODOS os outros =====
//
// Conquistado só depois de desbloquear os 62 títulos do portal: os três
// níveis de cada um dos 17 temas do Quiz, os três de cada grupo do Stop e os
// dois de relâmpago.
//
// O QUE ISSO EXIGE DE FATO:
//   170.000 acertos no Quiz (10.000 em CADA tema)
//    15.000 STOPs (5.000 em cada grupo de sala)
//     2.000 STOPs relâmpago
// No ritmo de um jogador dedicado, isso passa de 2.400 horas — mais de três
// anos jogando duas horas por dia.
//
// Isso é intencional e só funciona porque título é VITALÍCIO: ao contrário
// da patente, que zera todo mês, aqui o progresso nunca se perde. É um feito
// de carreira, não de temporada.
export const TITULO_LENDARIO = {
  nome: TITULO_LENDARIO_NOME,
  descricao: "Conquistou todos os 62 títulos do portal",
  logo: "/titulos/titulo-lendario.png",
};

// Quantos títulos existem no total. Calculado a partir das próprias tabelas
// em vez de escrito na mão: se um tema novo entrar no Quiz (como o Direito
// entrou), o número se ajusta sozinho e ninguém precisa lembrar de mexer aqui.
export function totalDeTitulos() {
  const quiz = Object.keys(QUIZ_NOMES).length * QUIZ_NIVEIS.length;
  const stop = Object.values(STOP_TITULOS).reduce((s, tiers) => s + tiers.length, 0);
  return quiz + stop + RAPIDO_TITULOS.length;
}

// Recebe o resultado de titulosDoQuiz() e titulosDoStop() e devolve o estado
// do lendário: se está desbloqueado e quanto falta.
//
// Conta os desbloqueados em vez de reconferir cada limiar — assim esta função
// não precisa saber nada sobre acertos, STOPs ou grupos, e não sai do lugar
// quando aquelas regras mudarem.
export function tituloLendario(titulosQuiz, titulosStop) {
  const conquistados =
    titulosQuiz.reduce((s, t) => s + t.desbloqueados.length, 0) +
    titulosStop.reduce((s, t) => s + t.desbloqueados.length, 0);

  const total = totalDeTitulos();
  return {
    ...TITULO_LENDARIO,
    conquistados,
    total,
    faltam: Math.max(0, total - conquistados),
    desbloqueado: conquistados >= total,
  };
}

// ===== Troféus de campeão mensal =====
//
// Diferente dos 62 títulos de conquista, que dependem de acumular acertos ou
// STOPs, estes vêm de ter sido o PRIMEIRO do ranking mensal — e o ranking
// paga Pix. São os únicos títulos que ninguém consegue por insistência: só
// vencendo alguém.
//
// Ficam guardados na tabela CampeaoMensal, congelados no fechamento do mês.
// Aqui só transformamos aquele registro em título exibível.

const MESES_CURTOS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

// "2026-08" -> "Ago/2026"
export function mesCurto(monthKey) {
  const [ano, mes] = String(monthKey).split("-");
  return `${MESES_CURTOS[Number(mes) - 1] || mes}/${ano}`;
}

export function nomeDoTrofeu(gameKey, monthKey) {
  const jogo = gameKey === "quiz" ? "Quiz" : "Stop";
  return `Campeão ${jogo} ${mesCurto(monthKey)}`;
}

export function logoDoTrofeu(gameKey) {
  return `/titulos/titulo-campeao-${gameKey === "quiz" ? "quiz" : "stop"}.png`;
}

// Recebe as linhas de CampeaoMensal de uma pessoa e devolve os troféus
// prontos pra exibição, do mais recente pro mais antigo.
//
// A CONTAGEM (2x, 3x) aparece por JOGO: quem venceu o Stop três vezes vê
// "Campeão Stop Set/2026 (3x)" — o feito acumulado num rótulo só, em vez de
// uma lista de três emblemas iguais ao lado do nick.
export function trofeusDeCampeao(registros = []) {
  const ordenados = [...registros].sort((a, b) => String(b.monthKey).localeCompare(String(a.monthKey)));

  const totalPorJogo = {};
  for (const r of ordenados) totalPorJogo[r.gameKey] = (totalPorJogo[r.gameKey] || 0) + 1;

  // Para o hover/saudação: o mais recente de cada jogo, com a contagem.
  const vistos = new Set();
  const resumo = [];
  for (const r of ordenados) {
    if (vistos.has(r.gameKey)) continue;
    vistos.add(r.gameKey);
    const total = totalPorJogo[r.gameKey];
    resumo.push({
      gameKey: r.gameKey,
      monthKey: r.monthKey,
      nome: nomeDoTrofeu(r.gameKey, r.monthKey),
      // O sufixo só aparece a partir do segundo: "(1x)" seria ruído.
      rotulo: total > 1
        ? `${nomeDoTrofeu(r.gameKey, r.monthKey)} (${total}x)`
        : nomeDoTrofeu(r.gameKey, r.monthKey),
      logo: logoDoTrofeu(r.gameKey),
      total,
      points: r.points,
    });
  }

  return {
    // Todos, pra vitrine do perfil.
    todos: ordenados.map((r) => ({
      gameKey: r.gameKey,
      monthKey: r.monthKey,
      nome: nomeDoTrofeu(r.gameKey, r.monthKey),
      logo: logoDoTrofeu(r.gameKey),
      points: r.points,
    })),
    // Um por jogo, com contagem — pro hover e pra saudação de entrada.
    resumo,
  };
}
