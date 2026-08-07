import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { getAllOnlineUserIds as getStopOnline } from "../game/gameManager.js";
import { getAllOnlineUserIds as getQuizOnline } from "../game/quizGameManager.js";
import { getAllOnlineUserIds as getAcromaniaOnline } from "../game/acromaniaGameManager.js";

const router = Router();
router.use(requireAuth);

function getOnlineUserIds() {
  return new Set([...getStopOnline(), ...getQuizOnline(), ...getAcromaniaOnline()]);
}

// Lista os amigos aceitos (com status online) + pedidos pendentes (enviados
// e recebidos). A amizade é guardada como uma linha só (userA + userB), sem
// duplicar — então pra achar "meus amigos" precisamos olhar os dois lados.
router.get("/", async (req, res) => {
  const userId = req.user.id;
  const online = getOnlineUserIds();

  const friendships = await prisma.friendship.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    include: {
      userA: { select: { id: true, nickname: true } },
      userB: { select: { id: true, nickname: true } },
    },
  });

  const accepted = [];
  const receivedPending = [];
  const sentPending = [];

  for (const f of friendships) {
    const isUserA = f.userAId === userId;
    const other = isUserA ? f.userB : f.userA;
    const entry = { friendshipId: f.id, userId: other.id, nickname: other.nickname, online: online.has(other.id) };

    if (f.status === "accepted") {
      accepted.push(entry);
    } else if (f.status === "pending") {
      // Quem MANDOU o convite é sempre userA, na forma como criamos abaixo.
      if (isUserA) sentPending.push(entry);
      else receivedPending.push(entry);
    }
  }

  accepted.sort((a, b) => (b.online ? 1 : 0) - (a.online ? 1 : 0) || a.nickname.localeCompare(b.nickname, "pt-BR"));

  res.json({ friends: accepted, receivedPending, sentPending });
});

// Rota bem leve, só pra mostrar o avisinho no menu — não busca a lista
// inteira de amigos, só a contagem de pedidos recebidos.
router.get("/pending-count", async (req, res) => {
  const count = await prisma.friendship.count({
    where: { userBId: req.user.id, status: "pending" },
  });
  res.json({ count });
});

// Mesma ideia, mas pra mensagens privadas não lidas.
router.get("/messages/unread-count", async (req, res) => {
  const count = await prisma.privateMessage.count({
    where: { receiverId: req.user.id, read: false },
  });
  res.json({ count });
});

// Envia um pedido de amizade (por nickname, pra ser fácil de usar numa
// busca simples) ou por ID direto (usado pelo botão no hover de perfil).
router.post("/request", async (req, res) => {
  const userId = req.user.id;
  const { targetUserId, nickname } = req.body;

  let target;
  if (targetUserId) {
    target = await prisma.user.findUnique({ where: { id: targetUserId } });
  } else if (nickname) {
    target = await prisma.user.findUnique({ where: { nickname: nickname.trim() } });
  }
  if (!target) return res.status(404).json({ error: "Jogador não encontrado." });
  if (target.id === userId) return res.status(400).json({ error: "Você não pode adicionar a si mesmo." });

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userAId: userId, userBId: target.id },
        { userAId: target.id, userBId: userId },
      ],
    },
  });
  if (existing) {
    if (existing.status === "accepted") return res.status(409).json({ error: "Vocês já são amigos." });
    return res.status(409).json({ error: "Já existe um pedido de amizade pendente entre vocês." });
  }

  const friendship = await prisma.friendship.create({
    data: { userAId: userId, userBId: target.id, status: "pending" },
  });
  res.json({ ok: true, friendshipId: friendship.id, nickname: target.nickname });
});

// Aceita um pedido recebido — só quem RECEBEU (userB) pode aceitar.
router.post("/:friendshipId/accept", async (req, res) => {
  const userId = req.user.id;
  const friendship = await prisma.friendship.findUnique({ where: { id: req.params.friendshipId } });
  if (!friendship || friendship.userBId !== userId || friendship.status !== "pending") {
    return res.status(404).json({ error: "Pedido de amizade não encontrado." });
  }
  await prisma.friendship.update({ where: { id: friendship.id }, data: { status: "accepted" } });
  res.json({ ok: true });
});

// Recusa um pedido recebido, ou cancela um que você mesmo enviou, ou
// desfaz uma amizade já aceita — tudo é só apagar a linha.
router.delete("/:friendshipId", async (req, res) => {
  const userId = req.user.id;
  const friendship = await prisma.friendship.findUnique({ where: { id: req.params.friendshipId } });
  if (!friendship || (friendship.userAId !== userId && friendship.userBId !== userId)) {
    return res.status(404).json({ error: "Não encontrado." });
  }
  await prisma.friendship.delete({ where: { id: friendship.id } });
  res.json({ ok: true });
});

export default router;
