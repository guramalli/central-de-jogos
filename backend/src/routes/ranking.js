import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { getRankForPoints } from "../utils/rank.js";
import { getQuizRankForPoints } from "../utils/quizRank.js";
import { cacheOuBuscar } from "../utils/cache.js";
import { currentMonthKey, formatMonthKey } from "../utils/monthKey.js";

const router = Router();

// Patente agora é um conceito só do ranking MENSAL — reflete o desempenho
// desse mês específico, não a soma histórica de tudo.
router.get("/monthly/:gameKey", requireAuth, async (req, res) => {
  const { gameKey } = req.params;
  const monthKey = req.query.month || currentMonthKey();

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
      rank:
        gameKey === "quiz"
          ? getQuizRankForPoints(s.points, { userId: s.user.id })
          : getRankForPoints(s.points, { userId: s.user.id, gameKey }),
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

// Vencedores (top 3) de um mês já encerrado, num jogo específico — a "prova"
// de quem foi campeão naquele mês, guardada pra sempre (os dados nunca são
// apagados, então isso funciona pra qualquer mês passado, sem precisar de
// nenhum processo especial de "arquivar" quando o mês vira).
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
      rank:
        gameKey === "quiz"
          ? getQuizRankForPoints(s.points, { userId: s.user.id })
          : getRankForPoints(s.points, { userId: s.user.id, gameKey }),
    })),
  });
});

export default router;
