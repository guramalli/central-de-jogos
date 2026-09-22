import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../db.js";
import { MENTIRA_RANKS, getMentiraRankForPoints, getMentiraNextRankInfo } from "../utils/mentiraRank.js";
import { currentMonthKey } from "../utils/monthKey.js";

const router = Router();

// Escada de patentes do Mentira Sincera.
router.get("/", requireAuth, (_req, res) => res.json(MENTIRA_RANKS));

// Minha situação no mês: pontos, patente e quanto falta pra próxima.
router.get("/meu", requireAuth, async (req, res) => {
  const reg = await prisma.monthlyScore.findUnique({
    where: { userId_gameKey_monthKey: { userId: req.user.id, gameKey: "mentira", monthKey: currentMonthKey() } },
  });
  const points = reg?.points || 0;
  res.json({ points, rank: getMentiraRankForPoints(points, { userId: req.user.id }), proxima: getMentiraNextRankInfo(points) });
});

export default router;
