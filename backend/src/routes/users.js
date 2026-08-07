import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { getRankForPoints, getNextRankInfo } from "../utils/rank.js";
import { getQuizRankForPoints, getQuizNextRankInfo } from "../utils/quizRank.js";

const router = Router();

// Limite generoso o bastante pra uma fotinho pequena já redimensionada no
// navegador (deve ficar bem abaixo disso na prática), mas protege o banco
// de alguém tentando mandar uma imagem gigante sem passar pelo redimensionamento.
const MAX_AVATAR_LENGTH = 300_000;

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Monta a lista de "conquistas" a partir de dados que já existem (patentes,
// recordes de sequência) — sem precisar de um sistema novo de conquistas
// do zero, só reaproveitando o que o site já calcula.
async function buildAchievements(userId, nickname, lifetimeByGame) {
  const achievements = [];

  const stopPoints = lifetimeByGame.get("stop") || 0;
  if (stopPoints > 0) {
    const rank = getRankForPoints(stopPoints);
    achievements.push({ iconUrl: rank.icon, label: `${rank.name} no Stop` });
  }
  const quizPoints = lifetimeByGame.get("quiz") || 0;
  if (quizPoints > 0) {
    const rank = getQuizRankForPoints(quizPoints);
    achievements.push({ iconUrl: rank.icon, label: `${rank.name} no Quiz` });
  }

  const streakRecords = await prisma.quizStreakRecord.findMany({ where: { nickname } });
  if (streakRecords.length > 0) {
    const best = streakRecords.reduce((a, b) => (b.count > a.count ? b : a));
    achievements.push({ icon: "🔥", label: `Recorde de ${best.count} seguidas no Quiz` });
  }

  return achievements;
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
  // Pra cada jogo em que a pessoa pontuou esse mês, calcula em qual posição
  // ela está no ranking mensal daquele jogo específico (mostrado no hover).
  const monthlyWithPosition = await Promise.all(
    monthly.map(async (m) => {
      const allInGame = await prisma.monthlyScore.findMany({
        where: { gameKey: m.gameKey, monthKey, user: { role: { not: "ADMIN" } } },
        orderBy: { points: "desc" },
        select: { userId: true },
      });
      const idx = allInGame.findIndex((s) => s.userId === id);
      return { gameKey: m.gameKey, points: m.points, position: idx >= 0 ? idx + 1 : null };
    })
  );
  // Exclui as pontuações vitalícias "por sala" (gameKey tipo "stop:stop-sala-1") —
  // aqui no tooltip de perfil só mostramos o total geral, pra não poluir com
  // muita informação. O placar por sala continua existindo, só não aparece aqui.
  const lifetime = await prisma.lifetimeScore.findMany({
    where: { userId: id, NOT: { gameKey: { contains: ":" } } },
  });
  const lifetimeByGame = new Map(lifetime.map((l) => [l.gameKey, l.points]));
  const achievements = await buildAchievements(id, user.nickname, lifetimeByGame);

  res.json({
    id: user.id,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl || null,
    clan: user.clan ? { name: user.clan.name, tag: user.clan.tag } : null,
    playtimeMinutes: user.playtimeMinutes,
    memberSince: user.createdAt,
    monthly: monthlyWithPosition,
    lifetime: lifetime.map((l) => ({
      gameKey: l.gameKey,
      points: l.points,
      rank: l.gameKey === "quiz" ? getQuizRankForPoints(l.points) : getRankForPoints(l.points),
      nextRank: l.gameKey === "quiz" ? getQuizNextRankInfo(l.points) : getNextRankInfo(l.points),
    })),
    achievements,
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
    avatarUrl: user.avatarUrl || null,
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

// Recebe a foto já redimensionada (o navegador faz isso antes de mandar) —
// guardada como base64 direto no banco, sem precisar de um serviço de
// armazenamento de arquivos externo.
router.post("/me/avatar", requireAuth, async (req, res) => {
  const { avatarUrl } = req.body;
  if (!avatarUrl || typeof avatarUrl !== "string") {
    return res.status(400).json({ error: "Nenhuma imagem enviada." });
  }
  if (!avatarUrl.startsWith("data:image/")) {
    return res.status(400).json({ error: "Formato de imagem inválido." });
  }
  if (avatarUrl.length > MAX_AVATAR_LENGTH) {
    return res.status(400).json({ error: "Imagem muito grande. Tenta outra foto." });
  }
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { avatarUrl },
  });
  res.json({ avatarUrl: user.avatarUrl });
});

router.delete("/me/avatar", requireAuth, async (req, res) => {
  await prisma.user.update({ where: { id: req.user.id }, data: { avatarUrl: null } });
  res.json({ ok: true });
});

export default router;
