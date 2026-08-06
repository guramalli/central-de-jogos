import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { getRankForPoints, getNextRankInfo } from "../utils/rank.js";

const router = Router();

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

router.get("/:id/profile", requireAuth, async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: { clan: true },
  });
  if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

  const monthKey = currentMonthKey();
  const monthly = await prisma.monthlyScore.findMany({ where: { userId: id, monthKey } });
  // Exclui as pontuações vitalícias "por sala" (gameKey tipo "stop:stop-sala-1") —
  // aqui no tooltip de perfil só mostramos o total geral, pra não poluir com
  // muita informação. O placar por sala continua existindo, só não aparece aqui.
  const lifetime = await prisma.lifetimeScore.findMany({
    where: { userId: id, NOT: { gameKey: { contains: ":" } } },
  });

  res.json({
    id: user.id,
    nickname: user.nickname,
    clan: user.clan ? { name: user.clan.name, tag: user.clan.tag } : null,
    playtimeMinutes: user.playtimeMinutes,
    memberSince: user.createdAt,
    monthly: monthly.map((m) => ({ gameKey: m.gameKey, points: m.points })),
    lifetime: lifetime.map((l) => ({
      gameKey: l.gameKey,
      points: l.points,
      rank: getRankForPoints(l.points),
      nextRank: getNextRankInfo(l.points),
    })),
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json({
    id: user.id,
    nickname: user.nickname,
    email: user.email,
    role: user.role,
    celebration: user.celebration || "",
  });
});

// Atualiza dados do próprio perfil (por enquanto, só a frase de comemoração do Quiz).
router.patch("/me", requireAuth, async (req, res) => {
  const { celebration } = req.body;
  if (celebration && celebration.length > 20) {
    return res.status(400).json({ error: "A comemoração pode ter no máximo 20 caracteres." });
  }
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { celebration: celebration?.trim() || null },
  });
  res.json({ celebration: user.celebration || "" });
});

export default router;
