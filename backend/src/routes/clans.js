import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { currentMonthKey } from "../utils/monthKey.js";

const router = Router();

const GAME_KEY = "stop";
const MAX_MEMBERS = 10;
// Pontuação vitalícia mínima (geral, no jogo Stop) exigida pra poder CRIAR um
// clã — corresponde aproximadamente à patente "Avançado". Só criar é restrito;
// entrar num clã (por convite) não exige pontuação nenhuma.
const CREATE_MIN_POINTS = 1000;

async function getMyLifetimePoints(userId) {
  const score = await prisma.lifetimeScore.findUnique({
    where: { userId_gameKey: { userId, gameKey: GAME_KEY } },
  });
  return score?.points || 0;
}

// Clã do usuário logado (se tiver), com membros e — se for o dono — convites
// pendentes enviados. Também retorna se ele pode criar um clã, caso não tenha.
router.get("/mine", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      clan: {
        include: {
          owner: { select: { id: true, nickname: true } },
          members: { select: { id: true, nickname: true } },
          invites: {
            where: { status: "pending" },
            include: { invited: { select: { id: true, nickname: true } } },
          },
        },
      },
    },
  });

  if (!user.clan) {
    const points = await getMyLifetimePoints(req.user.id);
    return res.json({
      clan: null,
      canCreate: points >= CREATE_MIN_POINTS,
      requiredPoints: CREATE_MIN_POINTS,
      myPoints: points,
    });
  }

  res.json({
    clan: {
      id: user.clan.id,
      name: user.clan.name,
      tag: user.clan.tag,
      ownerId: user.clan.ownerId,
      isOwner: user.clan.ownerId === req.user.id,
      members: user.clan.members,
      maxMembers: MAX_MEMBERS,
      pendingInvites: user.clan.ownerId === req.user.id ? user.clan.invites : [],
    },
  });
});

// Perfil público de um clã (visível por qualquer jogador, ex.: a partir do ranking)
// Lista todos os clãs do site, com seus membros e a pontuação somada do
// mês. É o "diretório de clãs": serve pra quem quer conhecer os grupos
// existentes antes de pedir pra entrar num.
router.get("/todos", requireAuth, async (req, res) => {
  const clans = await prisma.clan.findMany({
    include: {
      owner: { select: { id: true, nickname: true } },
      members: {
        select: { id: true, nickname: true, avatarUrl: true, role: true, isGuest: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (clans.length === 0) return res.json([]);

  // Soma a pontuação mensal de cada clã numa consulta só, em vez de uma por
  // clã — com muitos clãs isso faria muita diferença.
  //
  // Contas ADMIN e de visitante não entram na soma: elas já ficam de fora
  // de todos os outros rankings do site, então incluí-las aqui daria uma
  // vantagem artificial ao clã que tivesse uma.
  const monthKey = currentMonthKey();
  const contaNoRanking = (m) => m.role !== "ADMIN" && !m.isGuest;
  const todosIds = clans.flatMap((c) => c.members.filter(contaNoRanking).map((m) => m.id));

  const pontos = todosIds.length
    ? await prisma.monthlyScore.groupBy({
        by: ["userId"],
        where: { userId: { in: todosIds }, monthKey },
        _sum: { points: true },
      })
    : [];
  const pontosPorUsuario = Object.fromEntries(
    pontos.map((p) => [p.userId, p._sum.points || 0])
  );

  const lista = clans.map((c) => ({
    id: c.id,
    name: c.name,
    tag: c.tag,
    createdAt: c.createdAt,
    owner: c.owner,
    memberCount: c.members.length,
    members: c.members.map(({ id, nickname, avatarUrl }) => ({ id, nickname, avatarUrl })),
    monthlyPoints: c.members
      .filter(contaNoRanking)
      .reduce((s, m) => s + (pontosPorUsuario[m.id] || 0), 0),
  }));

  // Ordena pelo desempenho do mês — dá um ar de disputa e destaca quem
  // está jogando de verdade.
  lista.sort((a, b) => b.monthlyPoints - a.monthlyPoints || b.memberCount - a.memberCount);

  res.json(lista);
});

router.get("/:id", requireAuth, async (req, res) => {
  const clan = await prisma.clan.findUnique({
    where: { id: req.params.id },
    include: {
      owner: { select: { id: true, nickname: true } },
      members: { select: { id: true, nickname: true } },
    },
  });
  if (!clan) return res.status(404).json({ error: "Clã não encontrado." });
  res.json(clan);
});

// Cria um clã novo — só quem tem pontuação suficiente, e só quem ainda não
// está em nenhum clã.
router.post("/", requireAuth, async (req, res) => {
  const { name, tag } = req.body;
  if (!name?.trim() || !tag?.trim()) {
    return res.status(400).json({ error: "Nome e tag do clã são obrigatórios." });
  }
  if (tag.trim().length > 5) {
    return res.status(400).json({ error: "A tag do clã deve ter no máximo 5 caracteres." });
  }

  const me = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (me.clanId) return res.status(409).json({ error: "Você já está em um clã." });

  const points = await getMyLifetimePoints(req.user.id);
  if (points < CREATE_MIN_POINTS) {
    return res.status(403).json({
      error: `Você precisa de pelo menos ${CREATE_MIN_POINTS} pontos vitalícios no Stop para criar um clã.`,
    });
  }

  try {
    const clan = await prisma.clan.create({
      data: { name: name.trim(), tag: tag.trim().toUpperCase(), ownerId: req.user.id },
    });
    await prisma.user.update({ where: { id: req.user.id }, data: { clanId: clan.id } });
    res.json(clan);
  } catch {
    res.status(409).json({ error: "Já existe um clã com esse nome." });
  }
});

// Dono do clã convida um jogador (pelo id do usuário — usado no clique
// direito em cima do nick, em qualquer lista de jogadores).
router.post("/invite", requireAuth, async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId é obrigatório." });

  const myClan = await prisma.clan.findUnique({
    where: { ownerId: req.user.id },
    include: { members: true, invites: { where: { status: "pending" } } },
  });
  if (!myClan) return res.status(403).json({ error: "Só o dono do clã pode convidar." });

  if (myClan.members.length >= MAX_MEMBERS) {
    return res.status(409).json({ error: `O clã já está no limite de ${MAX_MEMBERS} membros.` });
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return res.status(404).json({ error: "Jogador não encontrado." });
  if (target.clanId) return res.status(409).json({ error: `${target.nickname} já está em um clã.` });

  try {
    const invite = await prisma.clanInvite.upsert({
      where: { clanId_invitedId: { clanId: myClan.id, invitedId: userId } },
      update: { status: "pending" },
      create: { clanId: myClan.id, invitedId: userId, status: "pending" },
    });
    res.json(invite);
  } catch (e) {
    res.status(500).json({ error: "Erro ao criar convite." });
  }
});

// Convites pendentes recebidos pelo usuário logado (pra ele aceitar/recusar)
router.get("/invites/mine", requireAuth, async (req, res) => {
  const invites = await prisma.clanInvite.findMany({
    where: { invitedId: req.user.id, status: "pending" },
    include: { clan: { select: { id: true, name: true, tag: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(invites);
});

router.post("/invites/:id/accept", requireAuth, async (req, res) => {
  const invite = await prisma.clanInvite.findUnique({
    where: { id: req.params.id },
    include: { clan: { include: { members: true } } },
  });
  if (!invite || invite.invitedId !== req.user.id || invite.status !== "pending") {
    return res.status(404).json({ error: "Convite não encontrado." });
  }

  const me = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (me.clanId) return res.status(409).json({ error: "Você já está em um clã." });
  if (invite.clan.members.length >= MAX_MEMBERS) {
    return res.status(409).json({ error: "Esse clã já está lotado." });
  }

  await prisma.user.update({ where: { id: req.user.id }, data: { clanId: invite.clanId } });
  await prisma.clanInvite.update({ where: { id: invite.id }, data: { status: "accepted" } });
  // Limpa outros convites pendentes que essa pessoa tinha de outros clãs.
  await prisma.clanInvite.deleteMany({
    where: { invitedId: req.user.id, status: "pending", NOT: { id: invite.id } },
  });

  res.json({ ok: true });
});

router.post("/invites/:id/decline", requireAuth, async (req, res) => {
  const invite = await prisma.clanInvite.findUnique({ where: { id: req.params.id } });
  if (!invite || invite.invitedId !== req.user.id) {
    return res.status(404).json({ error: "Convite não encontrado." });
  }
  await prisma.clanInvite.delete({ where: { id: invite.id } });
  res.json({ ok: true });
});

// Remove um membro do clã — o dono pode remover qualquer um; um membro comum
// só pode "remover" a si mesmo (ou seja, sair do clã).
router.delete("/members/:userId", requireAuth, async (req, res) => {
  const targetId = req.params.userId;
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target?.clanId) return res.status(404).json({ error: "Jogador não está em um clã." });

  const clan = await prisma.clan.findUnique({ where: { id: target.clanId } });
  const isSelf = targetId === req.user.id;
  const isOwner = clan.ownerId === req.user.id;
  if (!isSelf && !isOwner) {
    return res.status(403).json({ error: "Só o dono do clã pode remover outros membros." });
  }
  if (isSelf && isOwner) {
    return res.status(400).json({ error: "O dono não pode sair do próprio clã — exclua o clã ou transfira antes." });
  }

  await prisma.user.update({ where: { id: targetId }, data: { clanId: null } });
  res.json({ ok: true });
});

// Ranking mensal de clãs: soma os pontos mensais (Stop) de todos os membros.
router.get("/ranking/mensal", requireAuth, async (req, res) => {
  const monthKey = currentMonthKey();
  const clans = await prisma.clan.findMany({
    include: { members: { select: { id: true, nickname: true, role: true, isGuest: true } } },
  });

  const results = [];
  for (const clan of clans) {
    // Admins e visitantes não contam pontos pro ranking do clã, mesmo que
    // sejam membros — a mesma regra vale nos rankings individuais.
    const memberIds = clan.members
      .filter((m) => m.role !== "ADMIN" && !m.isGuest)
      .map((m) => m.id);
    if (memberIds.length === 0) continue;
    const scores = await prisma.monthlyScore.findMany({
      where: { userId: { in: memberIds }, gameKey: GAME_KEY, monthKey },
    });
    const total = scores.reduce((sum, s) => sum + s.points, 0);
    results.push({ id: clan.id, name: clan.name, tag: clan.tag, memberCount: memberIds.length, points: total });
  }

  results.sort((a, b) => b.points - a.points);
  res.json(results.map((r, i) => ({ position: i + 1, ...r })));
});

export default router;
