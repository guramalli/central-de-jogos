import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { getRankForPoints, getNextRankInfo } from "../utils/rank.js";
import { getQuizRankForPoints, getQuizNextRankInfo } from "../utils/quizRank.js";
import { currentMonthKey } from "../utils/monthKey.js";
import { QUIZ_ROOM_CONFIGS } from "../game/quizRoomConfigs.js";

const router = Router();

// Limite generoso o bastante pra uma fotinho pequena já redimensionada no
// navegador (deve ficar bem abaixo disso na prática), mas protege o banco
// de alguém tentando mandar uma imagem gigante sem passar pelo redimensionamento.
const MAX_AVATAR_LENGTH = 300_000;

// Monta a lista de "conquistas" a partir de dados que já existem (patente
// atual do MÊS, recordes de sequência) — sem precisar de um sistema novo de
// conquistas do zero, só reaproveitando o que o site já calcula. Como
// patente agora é conceito mensal, a conquista mostra a patente do mês
// vigente (se a pessoa ainda não pontuou esse mês, não mostra patente).
async function buildAchievements(nickname, monthlyByGame) {
  const achievements = [];

  const stopPoints = monthlyByGame.get("stop") || 0;
  if (stopPoints > 0) {
    const rank = getRankForPoints(stopPoints);
    achievements.push({ iconUrl: rank.icon, label: `${rank.name} no Stop (este mês)` });
  }
  const quizPoints = monthlyByGame.get("quiz") || 0;
  if (quizPoints > 0) {
    const rank = getQuizRankForPoints(quizPoints);
    achievements.push({ iconUrl: rank.icon, label: `${rank.name} no Quiz (este mês)` });
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
  // Pra cada jogo em que a pessoa pontuou esse mês, calcula a patente (que
  // agora é conceito exclusivo do ranking mensal) e a posição no ranking
  // mensal daquele jogo específico — usando CONTAGEM (quantos têm pontuação
  // maior que a dela), não buscando a lista inteira de todo mundo. Isso
  // importa de verdade com muita gente online ao mesmo tempo: essa rota
  // roda toda vez que alguém passa o mouse num nick, em qualquer lugar do
  // site, então precisa ser bem mais leve pro banco.
  const monthlyWithPosition = await Promise.all(
    monthly.map(async (m) => {
      // Contas ADMIN não competem no ranking — nem contam como concorrente
      // pra calcular a posição de outra pessoa (já filtrado abaixo), nem
      // aparecem com posição nenhuma quando o próprio perfil é de admin
      // (senão, se ninguém "de verdade" tiver mais pontos, o admin aparece
      // como 1º por padrão, mesmo estando fora do ranking).
      if (user.role === "ADMIN") {
        return {
          gameKey: m.gameKey,
          points: m.points,
          position: null,
          rank: m.gameKey === "quiz" ? getQuizRankForPoints(m.points) : getRankForPoints(m.points),
          nextRank: m.gameKey === "quiz" ? getQuizNextRankInfo(m.points) : getNextRankInfo(m.points),
        };
      }
      const betterCount = await prisma.monthlyScore.count({
        where: {
          gameKey: m.gameKey,
          monthKey,
          user: { role: { not: "ADMIN" } },
          points: { gt: m.points },
        },
      });
      return {
        gameKey: m.gameKey,
        points: m.points,
        position: betterCount + 1,
        rank: m.gameKey === "quiz" ? getQuizRankForPoints(m.points) : getRankForPoints(m.points),
        nextRank: m.gameKey === "quiz" ? getQuizNextRankInfo(m.points) : getNextRankInfo(m.points),
      };
    })
  );
  const monthlyByGame = new Map(monthly.map((m) => [m.gameKey, m.points]));
  // Exclui as pontuações vitalícias "por sala" (gameKey tipo "stop:stop-sala-1") —
  // aqui no tooltip de perfil só mostramos o total geral, pra não poluir com
  // muita informação. O placar por sala continua existindo, só não aparece aqui.
  // O vitalício agora é só um título de maior pontuador histórico — sem
  // patente vinculada (patente é conceito exclusivo do ranking mensal).
  const lifetime = await prisma.lifetimeScore.findMany({
    where: { userId: id, NOT: { gameKey: { contains: ":" } } },
  });
  const achievements = await buildAchievements(user.nickname, monthlyByGame);

  // Aproveitamento por sala do Quiz — só das salas onde a pessoa já tentou
  // um número mínimo de perguntas (senão "1 de 1 = 100%" viraria destaque
  // sem significar nada). Sem limite de quantidade: o hover filtra pela
  // sala em que está, e essa pode não estar entre as mais jogadas.
  const quizStats = await prisma.quizRoomStat.findMany({
    where: { userId: id, attempts: { gte: 5 } },
    orderBy: { attempts: "desc" },
  });
  const quizAccuracy = quizStats.map((s) => ({
    roomId: s.roomId,
    roomLabel: QUIZ_ROOM_CONFIGS[s.roomId]?.label || s.roomId,
    attempts: s.attempts,
    correct: s.correct,
    percent: Math.round((s.correct / s.attempts) * 100),
  }));

  // Status de amizade em relação a quem está VENDO o perfil (não em
  // relação ao dono do perfil) — usado pra decidir se mostra o botão de
  // adicionar amigo, ou "Já são amigos", ou "Pedido já enviado".
  let friendshipStatus = null; // null | "friends" | "pending_sent" | "pending_received"
  if (req.user.id !== id) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userAId: req.user.id, userBId: id },
          { userAId: id, userBId: req.user.id },
        ],
      },
    });
    if (friendship) {
      if (friendship.status === "accepted") friendshipStatus = "friends";
      else friendshipStatus = friendship.userAId === req.user.id ? "pending_sent" : "pending_received";
    }
  }

  // Se quem está vendo o perfil é líder (dono) de algum clã, manda essa
  // info junto — usada pra mostrar o botão "Convidar pro clã" no hover,
  // quando a pessoa do perfil ainda não tem clã nenhum.
  let viewerClan = null;
  if (req.user.id !== id) {
    viewerClan = await prisma.clan.findUnique({
      where: { ownerId: req.user.id },
      select: { id: true, name: true, tag: true },
    });
  }

  res.json({
    id: user.id,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl || null,
    clan: user.clan ? { name: user.clan.name, tag: user.clan.tag } : null,
    playtimeMinutes: user.playtimeMinutes,
    memberSince: user.createdAt,
    monthly: monthlyWithPosition,
    lifetime: lifetime.map((l) => ({ gameKey: l.gameKey, points: l.points })),
    achievements,
    quizAccuracy,
    friendshipStatus,
    viewerClan,
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
    hasPassword: !!user.password,
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

// Troca (ou define, se a conta nunca teve uma — caso de quem entrou só pelo
// Google) a senha da própria conta. Se já existe senha, exige a atual pra
// confirmar antes de trocar.
router.patch("/me/password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: "A nova senha deve ter ao menos 8 caracteres." });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  if (user.password) {
    if (!currentPassword) {
      return res.status(400).json({ error: "Informe sua senha atual." });
    }
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Senha atual incorreta." });
    }
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

  res.json({ ok: true, message: user.password ? "Senha alterada com sucesso!" : "Senha definida com sucesso!" });
});

export default router;
