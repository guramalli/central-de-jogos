import { Router } from "express";
import { QUIZ_ROOM_CONFIGS } from "../game/quizRoomConfigs.js";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { getRankForPoints, RANKS } from "../utils/rank.js";
import { getQuizRankForPoints, QUIZ_RANKS } from "../utils/quizRank.js";
import { getAcromaniaRankForPoints, ACROMANIA_RANKS } from "../utils/acromaniaRank.js";
import { getMentiraRankForPoints, MENTIRA_RANKS } from "../utils/mentiraRank.js";
import { cacheOuBuscar } from "../utils/cache.js";
import { currentMonthKey, formatMonthKey } from "../utils/monthKey.js";
import { configPublica } from "../avatar/desbloqueio.js";

const router = Router();

// Patente de um mês passado, sem consultar quem é o detentor de hoje.
//
// `ehPrimeiro` decide a exclusiva: naquele mês, quem estava em 1º é o dono do
// topo. Quem passou da marca mas não era o primeiro fica um degrau abaixo.
function patenteDoHistorico(points, gameKey, ehPrimeiro) {
  const calcular =
    gameKey === "quiz"
      ? getQuizRankForPoints
      : gameKey === "acromania"
        ? getAcromaniaRankForPoints
        : gameKey === "mentira"
          ? getMentiraRankForPoints
          : getRankForPoints;
  // Sem userId: nenhuma checagem de detentor vigente é feita.
  const bruta = calcular(points);

  const escada =
    gameKey === "quiz" ? QUIZ_RANKS : gameKey === "acromania" ? ACROMANIA_RANKS : gameKey === "mentira" ? MENTIRA_RANKS : RANKS;
  const topo = escada[escada.length - 1];

  // Alcançou o topo mas não era o primeiro daquele mês: um degrau abaixo.
  // Só vale onde o topo é EXCLUSIVO (Stop e Quiz). O Acromania não tem
  // patente exclusiva, então lá quem chegou no topo fica no topo.
  if (topo.exclusiva && bruta.key === topo.key && !ehPrimeiro) return escada[escada.length - 2];
  return bruta;
}

// Patente agora é um conceito só do ranking MENSAL — reflete o desempenho
// desse mês específico, não a soma histórica de tudo.
router.get("/monthly/:gameKey", requireAuth, async (req, res) => {
  const { gameKey } = req.params;
  const monthKey = req.query.month || currentMonthKey();
  const ehMesCorrente = monthKey === currentMonthKey();

  // Ranking é a mesma resposta pra todo mundo e muda devagar — guardar por
  // 20 segundos evita que dezenas de pessoas disparem a mesma consulta
  // pesada ao mesmo tempo, sem que ninguém perceba atraso na prática.
  const cacheKey = `ranking:monthly:${gameKey}:${monthKey}`;
  const resposta = await cacheOuBuscar(cacheKey, 20, async () => {
    const scores = await prisma.monthlyScore.findMany({
      where: { gameKey, monthKey, user: {
        role: { not: "ADMIN" },
        isGuest: false,
        ocultoNoRanking: false,
        // Ocultação só deste jogo (ver ocultoNosRankings no schema).
        NOT: { ocultoNosRankings: { has: gameKey } },
      } },
      orderBy: { points: "desc" },
      take: 100,
      include: { user: true },
    });
    return scores.map((s, idx) => ({
      position: idx + 1,
      userId: s.user.id,
      nickname: s.user.nickname,
      points: s.points,
      // Esta rota serve o mês CORRENTE e também meses passados (?month=).
      //
      // No mês corrente, a patente exclusiva é decidida por quem lidera AGORA
      // — e é isso que o cálculo normal faz, com o userId.
      //
      // Num mês passado, perguntar "quem lidera agora?" dá a resposta errada:
      // o campeão de agosto perderia a Coroa Imperial de Ouro assim que
      // setembro começasse. Ali a exclusividade vem da POSIÇÃO naquele mês.
      rank: ehMesCorrente
        ? (gameKey === "quiz"
            ? getQuizRankForPoints(s.points, { userId: s.user.id })
            : gameKey === "acromania"
              ? getAcromaniaRankForPoints(s.points, { userId: s.user.id })
              : gameKey === "mentira"
                ? getMentiraRankForPoints(s.points, { userId: s.user.id })
                : getRankForPoints(s.points, { userId: s.user.id, gameKey }))
        : patenteDoHistorico(s.points, gameKey, idx === 0),
    }));
  });
  res.json(resposta);
});

// Ranking vitalício é só um "título" de quem pontuou mais desde o início —
// sem patente vinculada (patente é conceito exclusivo do ranking mensal).
router.get("/lifetime/:gameKey", requireAuth, async (req, res) => {
  const { gameKey } = req.params;
  const scores = await prisma.lifetimeScore.findMany({
    where: { gameKey, user: {
        role: { not: "ADMIN" },
        isGuest: false,
        ocultoNoRanking: false,
        // Ocultação só deste jogo (ver ocultoNosRankings no schema).
        NOT: { ocultoNosRankings: { has: gameKey } },
      } },
    orderBy: { points: "desc" },
    take: 100,
    include: { user: true },
  });
  res.json(
    scores.map((s, idx) => ({
      position: idx + 1,
      userId: s.user.id,
      nickname: s.user.nickname,
      points: s.points,
    }))
  );
});

// Lista os meses passados que têm alguma pontuação registrada — usado pra
// montar a página de histórico ("Hall da Fama").
router.get("/history", requireAuth, async (req, res) => {
  const currentMonth = currentMonthKey();
  const rows = await prisma.monthlyScore.findMany({
    where: { monthKey: { not: currentMonth } },
    select: { monthKey: true },
    distinct: ["monthKey"],
    orderBy: { monthKey: "desc" },
  });
  res.json(rows.map((r) => ({ monthKey: r.monthKey, label: formatMonthKey(r.monthKey) })));
});


// Números do Hall da Fama: quem mais venceu, a maior pontuação já registrada
// e quantos meses já fecharam.
//
// Sai da CampeaoMensal (troféus congelados no fechamento) e não do
// monthlyScore: campeão é quem foi PAGO, e recalcular hoje poderia dar outro
// resultado se uma conta tiver sido banida depois.
router.get("/hall-stats", requireAuth, async (req, res) => {
  const dados = await cacheOuBuscar("ranking:hall-stats", 300, async () => {
    const [campeoes, mesesFechados] = await Promise.all([
      prisma.campeaoMensal.findMany({
        include: { user: { select: { id: true, nickname: true } } },
        orderBy: { monthKey: "desc" },
      }),
      prisma.monthlyScore.findMany({
        where: { monthKey: { not: currentMonthKey() } },
        select: { monthKey: true },
        distinct: ["monthKey"],
      }),
    ]);

    // Quantos títulos cada pessoa tem — no total e POR JOGO.
    //
    // Um número só ("4 títulos") não diz onde a pessoa é forte: quem ganhou
    // quatro vezes no Stop e quem ganhou duas em cada jogo apareciam iguais.
    const contar = (filtro) => {
      const porJogador = new Map();
      for (const c of campeoes) {
        if (filtro && c.gameKey !== filtro) continue;
        const atual = porJogador.get(c.userId) || {
          userId: c.userId,
          // O nickname do registro é o da ÉPOCA; o do usuário é o de hoje.
          // Mostrar o atual evita a lista parecer de gente que não existe mais.
          nickname: c.user?.nickname || c.nickname,
          titulos: 0,
        };
        atual.titulos += 1;
        porJogador.set(c.userId, atual);
      }
      return [...porJogador.values()]
        .sort((a, b) => b.titulos - a.titulos || a.nickname.localeCompare(b.nickname, "pt-BR"))
        .slice(0, 5);
    };

    const maisTitulos = contar(null);
    // Só os jogos que REALMENTE têm campeão congelado (o Acromania aparece a
    // partir do primeiro mês fechado com ele) — coluna vazia seria prometer
    // o que não existe.
    const porJogo = {};
    for (const jogo of [...new Set(campeoes.map((c) => c.gameKey))]) {
      porJogo[jogo] = contar(jogo);
    }

    // Maior pontuação já feita num mês, por jogo.
    const recordes = {};
    for (const c of campeoes) {
      if (!recordes[c.gameKey] || c.points > recordes[c.gameKey].points) {
        recordes[c.gameKey] = {
          nickname: c.user?.nickname || c.nickname,
          userId: c.userId,
          points: c.points,
          monthKey: c.monthKey,
          label: formatMonthKey(c.monthKey),
        };
      }
    }

    // ===== MARCAS VITALÍCIAS =====
    //
    // Diferente dos títulos acima, que são mensais e zeram: estas são marcas
    // que ficam pra sempre e não dependem de ganhar o mês. Quem joga muito e
    // nunca levou um Pix também tem lugar no Hall.
    //
    // As três consultas rodam juntas, e cada uma sozinha é barata (ordena e
    // pega o primeiro). O cache de 5 minutos do endpoint já cobre o resto.
    const [recordeSequencia, usuariosAtuais, statsStop, maiorTempo] = await Promise.all([
      // Maior sequência de acertos seguidos no Quiz. A tabela guarda o
      // recorde POR SALA, então o maior de todos é o topo geral.
      prisma.quizStreakRecord.findFirst({
        orderBy: { count: "desc" },
        where: { count: { gt: 0 } },
      }),
      // Lista de nicks ATUAIS. A tabela de recordes guarda o nick da época,
      // e quem trocou de nome depois aparecia com o antigo no Hall.
      //
      // Não dá pra usar `include` aqui: QuizStreakRecord não tem relação
      // declarada com User no schema, só o userId solto. Por isso a busca é
      // separada e o cruzamento é feito abaixo.
      prisma.user.findMany({ select: { id: true, nickname: true } }),

      // STOPs: a tabela guarda por GRUPO de sala (padrão, intermediário,
      // avançada). O recordista geral é quem tem a maior SOMA, não o maior
      // número numa sala só — por isso não dá pra usar findFirst aqui.
      prisma.stopStat.groupBy({
        by: ["userId"],
        _sum: { stops: true },
        orderBy: { _sum: { stops: "desc" } },
        take: 1,
      }),

      // Tempo de jogo acumulado. `playtimeMinutes` é minuto de partida, não
      // de aba aberta — quem deixa o site ligado sem jogar não sobe.
      prisma.user.findFirst({
        where: { playtimeMinutes: { gt: 0 }, isGuest: false, banned: false },
        orderBy: { playtimeMinutes: "desc" },
        select: { id: true, nickname: true, playtimeMinutes: true },
      }),
    ]);

    // O groupBy devolve só o userId; o nick vem numa segunda consulta.
    let recordeStops = null;
    if (statsStop.length > 0 && statsStop[0]._sum.stops > 0) {
      const dono = await prisma.user.findUnique({
        where: { id: statsStop[0].userId },
        select: { id: true, nickname: true, isGuest: true, banned: true },
      });
      // Visitante e banido ficam de fora: o Hall é uma vitrine pública, e
      // conta sem cadastro não tem perfil pra onde apontar.
      if (dono && !dono.isGuest && !dono.banned) {
        recordeStops = {
          userId: dono.id,
          nickname: dono.nickname,
          valor: statsStop[0]._sum.stops,
        };
      }
    }

    const nickAtual = new Map(usuariosAtuais.map((u) => [u.id, u.nickname]));

    const marcas = {
      sequenciaQuiz: recordeSequencia
        ? {
            userId: recordeSequencia.userId,
            // Nick ATUAL, com o guardado como reserva (caso a conta tenha
            // sido apagada).
            nickname:
              nickAtual.get(recordeSequencia.userId) || recordeSequencia.nickname,
            valor: recordeSequencia.count,
            // A sala vai junto: o recorde é POR SALA, e saber que foi na
            // Futebol Padrão é metade da história.
            sala: QUIZ_ROOM_CONFIGS[recordeSequencia.roomId]?.label || null,
          }
        : null,
      stopsTotal: recordeStops,
      tempoDeJogo: maiorTempo
        ? {
            userId: maiorTempo.id,
            nickname: maiorTempo.nickname,
            valor: maiorTempo.playtimeMinutes,
          }
        : null,
    };

    return {
      mesesFechados: mesesFechados.length,
      totalTitulos: campeoes.length,
      maisTitulos,
      maisTitulosPorJogo: porJogo,
      recordes,
      marcas,
    };
  });

  res.json(dados);
});

// Vencedores (top 10) de um mês já encerrado, num jogo específico — a "prova"
// de quem foi campeão naquele mês, guardada pra sempre.
router.get("/history/:monthKey/:gameKey", requireAuth, async (req, res) => {
  const { monthKey, gameKey } = req.params;
  const scores = await prisma.monthlyScore.findMany({
    where: { gameKey, monthKey, user: {
        role: { not: "ADMIN" },
        isGuest: false,
        ocultoNoRanking: false,
        // Ocultação só deste jogo (ver ocultoNosRankings no schema).
        NOT: { ocultoNosRankings: { has: gameKey } },
      } },
    orderBy: { points: "desc" },
    take: 10,
    include: { user: true },
  });
  // Boneco que o campeão vestia no fechamento do mês (uma busca pela chave
  // única). Mês sem fechamento, ou fechado antes do avatar existir: null, e
  // a tela mostra o avatar atual.
  const fechado = await prisma.campeaoMensal.findUnique({
    where: { monthKey_gameKey: { monthKey, gameKey } },
    select: { userId: true, avatarNoMes: true },
  });
  res.json({
    monthKey,
    label: formatMonthKey(monthKey),
    winners: scores.map((s, idx) => ({
      position: idx + 1,
      userId: s.user.id,
      nickname: s.user.nickname,
      points: s.points,
      avatarNoMes: fechado?.userId === s.user.id ? configPublica(fechado.avatarNoMes) : null,
      // A patente do HISTÓRICO reflete aquele mês, não o de hoje.
      //
      // Passar o userId dispara a checagem de patente exclusiva, que pergunta
      // "essa pessoa é a dona do topo AGORA?" — e "agora" é sempre o mês
      // corrente. Resultado: quem foi campeão em agosto perdia a Coroa
      // Imperial de Ouro no histórico assim que setembro começava.
      //
      // Aqui a exclusividade é decidida pela POSIÇÃO naquele mês: o primeiro
      // colocado é, por definição, quem tinha o topo.
      rank: patenteDoHistorico(s.points, gameKey, idx === 0),
    })),
  });
});

export default router;
