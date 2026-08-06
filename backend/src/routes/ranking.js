import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { getRankForPoints } from "../utils/rank.js";
import { getQuizRankForPoints } from "../utils/quizRank.js";

const router = Router();

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

router.get("/monthly/:gameKey", requireAuth, async (req, res) => {
  const { gameKey } = req.params;
  const monthKey = currentMonthKey();
  const scores = await prisma.monthlyScore.findMany({
    where: { gameKey, monthKey, user: { role: { not: "ADMIN" } } },
    orderBy: { points: "desc" },
    take: 100,
    include: { user: true },
  });
  res.json(
    scores.map((s, idx) => ({
      position: idx + 1,
      nickname: s.user.nickname,
      points: s.points,
    }))
  );
});

router.get("/lifetime/:gameKey", requireAuth, async (req, res) => {
  const { gameKey } = req.params;
  const scores = await prisma.lifetimeScore.findMany({
    where: { gameKey, user: { role: { not: "ADMIN" } } },
    orderBy: { points: "desc" },
    take: 100,
    include: { user: true },
  });
  res.json(
    scores.map((s, idx) => ({
      position: idx + 1,
      nickname: s.user.nickname,
      points: s.points,
      rank: gameKey === "quiz" ? getQuizRankForPoints(s.points) : getRankForPoints(s.points),
    }))
  );
});

export default router;
