import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { getRankForPoints, RANKS } from "../utils/rank.js";
import { getQuizRankForPoints, QUIZ_RANKS } from "../utils/quizRank.js";
import { getAcromaniaRankForPoints, ACROMANIA_RANKS } from "../utils/acromaniaRank.js";
import { cacheOuBuscar } from "../utils/cache.js";
import { currentMonthKey, formatMonthKey } from "../utils/monthKey.js";

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
        : getRankForPoints;
  // Sem userId: nenhuma checagem de detentor vigente é feita.
  const bruta = calcular(points);

  const escada =
    gameKey === "quiz" ? QUIZ_RANKS : gameKey === "acromania" ? ACROMANIA_RANKS : RANKS;
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
              ? getAcromaniaRankForPoints(s.points)
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
  res.json({
    monthKey,
    label: formatMonthKey(monthKey),
    winners: scores.map((s, idx) => ({
      position: idx + 1,
      userId: s.user.id,
      nickname: s.user.nickname,
      points: s.points,
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
