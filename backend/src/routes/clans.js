import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { currentMonthKey } from "../utils/monthKey.js";
import { cacheOuBuscar, cacheInvalidar } from "../utils/cache.js";

const router = Router();

const GAME_KEY = "stop";
const MAX_MEMBERS = 10;
// Pontuação vitalícia mínima (geral, no jogo Stop) exigida pra poder CRIAR um
// clã — corresponde aproximadamente à patente "Avançado". Só criar é restrito;
// entrar num clã (por convite) não exige pontuação nenhuma.
// Mínimo pra CRIAR um clã. Entrar num (por convite) não exige nada.
//
// Era 1.000 pontos vitalícios SÓ DO STOP — quem jogava apenas Quiz ou
// Acromania não conseguia criar clã por mais que jogasse. Agora soma os três
// jogos, e o valor subiu pra 50.000: criar clã deixou de ser algo das
// primeiras horas e passou a exigir alguma estrada no site.
const CREATE_MIN_POINTS = 50000;

// Soma vitalícia de TODOS os jogos.
//
// O filtro de ":" exclui as linhas por sala (gameKey tipo "stop:sala-1"),
// que existem só pra alimentar o placar dentro da sala — sem ele cada ponto
// entraria duas vezes e o requisito valeria metade.
async function getMyLifetimePoints(userId) {
  const scores = await prisma.lifetimeScore.findMany({
    where: { userId, NOT: { gameKey: { contains: ":" } } },
    select: { points: true },
  });
  return scores.reduce((soma, s) => soma + (s.points || 0), 0);
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
  const lista = await cacheOuBuscar("clans:todos", 90, async () => {
  const clans = await prisma.clan.findMany({
    include: {
      owner: { select: { id: true, nickname: true } },
      members: {
        select: { id: true, nickname: true, avatarUrl: true, role: true, isGuest: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (clans.length === 0) return [];

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
        // Exclui as linhas "por sala" (gameKey tipo "stop:stop-sala-1"), que
        // existem só pra alimentar a lista de jogadores dentro da sala. Sem
        // este filtro cada ponto seria contado DUAS vezes no total do clã.
        where: { userId: { in: todosIds }, monthKey, NOT: { gameKey: { contains: ":" } } },
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
    return lista;
  });

  res.json(lista);
});

// IMPORTANTE: estas rotas ficam ANTES do GET /:id. O Express casa na ordem
// de declaração — depois dele, "solicitacoes" seria lido como o id de um
// clã e a resposta viraria 404.
// Meus pedidos pendentes — a tela usa pra mostrar "pedido enviado" em vez
// de oferecer o botão de novo.
router.get("/solicitacoes/minhas", requireAuth, async (req, res) => {
  const pedidos = await prisma.clanJoinRequest.findMany({
    where: { userId: req.user.id, status: "pending" },
    select: { clanId: true },
  });
  res.json(pedidos.map((p) => p.clanId));
});

// Pedidos recebidos pelo clã que EU lidero.
router.get("/solicitacoes/recebidas", requireAuth, async (req, res) => {
  const meu = await prisma.clan.findFirst({ where: { ownerId: req.user.id } });
  if (!meu) return res.json([]);
  const pedidos = await prisma.clanJoinRequest.findMany({
    where: { clanId: meu.id, status: "pending" },
    include: { user: { select: { id: true, nickname: true } } },
    orderBy: { createdAt: "asc" },
  });
  res.json(pedidos);
});

// Perfil público do clã: membros, troféus e pontuação do mês.
router.get("/:id", requireAuth, async (req, res) => {
  const clan = await prisma.clan.findUnique({
    where: { id: req.params.id },
    include: {
      owner: { select: { id: true, nickname: true } },
      members: { select: { id: true, nickname: true, avatarUrl: true, role: true, isGuest: true } },
      // Troféus congelados no fechamento do mês, do mais recente pro mais
      // antigo — a vitrine é o motivo principal desta página existir.
      campeonatos: { orderBy: [{ monthKey: "desc" }, { gameKey: "asc" }] },
    },
  });
  if (!clan) return res.status(404).json({ error: "Clã não encontrado." });

  // Pontuação do mês corrente, pra página não mostrar só passado.
  const contaNoRanking = (m) => m.role !== "ADMIN" && !m.isGuest;
  const ids = clan.members.filter(contaNoRanking).map((m) => m.id);
  const scores = ids.length
    ? await prisma.monthlyScore.groupBy({
        by: ["userId"],
        where: { userId: { in: ids }, monthKey: currentMonthKey(), NOT: { gameKey: { contains: ":" } } },
        _sum: { points: true },
      })
    : [];

  const porUsuario = Object.fromEntries(scores.map((x) => [x.userId, x._sum.points || 0]));
  const total = scores.reduce((soma, x) => soma + (x._sum.points || 0), 0);

  // Pontos e contribuição de cada membro. Com o total do clã já calculado, a
  // porcentagem sai de graça — e é ela que mostra quem está puxando o time.
  //
  // Ordenado do maior pro menor: numa lista alfabética, quem carrega o clã
  // some no meio.
  const membros = clan.members
    .map(({ id, nickname, avatarUrl, role, isGuest }) => {
      const pontos = porUsuario[id] || 0;
      return {
        id,
        nickname,
        avatarUrl,
        points: pontos,
        // Sem pontos no clã inteiro, 0% pra todo mundo em vez de divisão por
        // zero (que daria NaN na tela).
        percent: total > 0 ? Math.round((pontos / total) * 1000) / 10 : 0,
        // Admin e visitante são membros, mas não somam pro clã. A tela mostra
        // isso em vez de deixar parecer que a pessoa não jogou.
        contaPontos: contaNoRanking({ role, isGuest }),
      };
    })
    .sort((a, b) => b.points - a.points || a.nickname.localeCompare(b.nickname, "pt-BR"));

  res.json({
    ...clan,
    members: membros,
    monthlyPoints: total,
  });
});

// Cria um clã novo — só quem tem pontuação suficiente, e só quem ainda não
// está em nenhum clã.
router.post("/", requireAuth, async (req, res) => {
  // Cria/altera clã: o cache das listagens precisa cair.
  cacheInvalidar("clans:");
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
      error: `Você precisa de pelo menos ${CREATE_MIN_POINTS.toLocaleString("pt-BR")} pontos vitalícios (somando Stop, Quiz e Acromania) para criar um clã. Você tem ${points.toLocaleString("pt-BR")}.`,
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

// ===== PEDIDOS DE INGRESSO (o jogador bate na porta) =====

// Pedir pra entrar num clã.
router.post("/:id/solicitar", requireAuth, async (req, res) => {
  const me = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (me.clanId) return res.status(409).json({ error: "Você já está em um clã." });

  const clan = await prisma.clan.findUnique({
    where: { id: req.params.id },
    include: { members: { select: { id: true } } },
  });
  if (!clan) return res.status(404).json({ error: "Clã não encontrado." });
  if (clan.members.length >= MAX_MEMBERS) {
    return res.status(409).json({ error: `Esse clã já está no limite de ${MAX_MEMBERS} membros.` });
  }

  try {
    // upsert e não create: quem já pediu e foi recusado pode pedir de novo,
    // e quem clicar duas vezes não gera erro nem duplica.
    const pedido = await prisma.clanJoinRequest.upsert({
      where: { clanId_userId: { clanId: clan.id, userId: req.user.id } },
      update: { status: "pending" },
      create: { clanId: clan.id, userId: req.user.id, status: "pending" },
    });
    cacheInvalidar(`avisos:${clan.ownerId}`);
    res.json(pedido);
  } catch {
    res.status(500).json({ error: "Não foi possível enviar o pedido." });
  }
});

router.post("/solicitacoes/:id/aceitar", requireAuth, async (req, res) => {
  const pedido = await prisma.clanJoinRequest.findUnique({
    where: { id: req.params.id },
    include: { clan: { include: { members: { select: { id: true } } } } },
  });
  if (!pedido) return res.status(404).json({ error: "Pedido não encontrado." });
  if (pedido.clan.ownerId !== req.user.id) {
    return res.status(403).json({ error: "Só o dono do clã pode aceitar." });
  }
  if (pedido.clan.members.length >= MAX_MEMBERS) {
    return res.status(409).json({ error: `O clã já está no limite de ${MAX_MEMBERS} membros.` });
  }

  // Entre o pedido e o aceite a pessoa pode ter entrado em outro clã.
  const candidato = await prisma.user.findUnique({ where: { id: pedido.userId } });
  if (!candidato) return res.status(404).json({ error: "Jogador não encontrado." });
  if (candidato.clanId) {
    await prisma.clanJoinRequest.delete({ where: { id: pedido.id } });
    return res.status(409).json({ error: `${candidato.nickname} já entrou em outro clã.` });
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: pedido.userId }, data: { clanId: pedido.clanId } }),
    prisma.clanJoinRequest.delete({ where: { id: pedido.id } }),
  ]);
  // NOTA: a tag do clã que aparece no chat é lida quando a pessoa ENTRA na
  // sala (ou no chat geral). Quem acabou de ser aceito só vai vê-la depois
  // de recarregar ou trocar de sala — trocar de clã no meio de uma partida
  // é raro o bastante pra não valer manter uma consulta por mensagem.

  cacheInvalidar("clans:");
  cacheInvalidar(`avisos:${req.user.id}`);
  res.json({ ok: true });
});

router.post("/solicitacoes/:id/recusar", requireAuth, async (req, res) => {
  const pedido = await prisma.clanJoinRequest.findUnique({
    where: { id: req.params.id },
    include: { clan: { select: { ownerId: true } } },
  });
  if (!pedido) return res.status(404).json({ error: "Pedido não encontrado." });
  if (pedido.clan.ownerId !== req.user.id) {
    return res.status(403).json({ error: "Só o dono do clã pode recusar." });
  }
  // Apaga em vez de marcar como recusado: assim a pessoa pode tentar de novo
  // mais tarde sem esbarrar na restrição de um pedido por clã.
  await prisma.clanJoinRequest.delete({ where: { id: pedido.id } });
  cacheInvalidar(`avisos:${req.user.id}`);
  res.json({ ok: true });
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
  cacheInvalidar("clans:");
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
  cacheInvalidar("clans:");
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
// Ranking mensal de clãs, por jogo ou geral.
//
// ?jogo=stop | quiz | acromania | geral   (padrão: geral)
//
// Antes esta rota somava SÓ o Stop, com o gameKey fixo no código, e a tela
// não dizia isso em lugar nenhum — quem jogava Quiz achava que estava
// somando pro clã e não estava. Pior: a rota /todos somava TODOS os jogos,
// então o site tinha duas contas diferentes chamadas de "pontos do clã".
const JOGOS_VALIDOS = ["stop", "quiz", "acromania"];

router.get("/ranking/mensal", requireAuth, async (req, res) => {
  const jogo = String(req.query.jogo || "geral").toLowerCase();
  if (jogo !== "geral" && !JOGOS_VALIDOS.includes(jogo)) {
    return res.status(400).json({ error: "Jogo inválido." });
  }

  // Cache por jogo: sem o sufixo, o primeiro a carregar guardaria o resultado
  // e os outros jogos serviriam o dele por 2 minutos.
  const dados = await cacheOuBuscar(`clans:ranking-mensal:${jogo}`, 120, async () => {
    const monthKey = currentMonthKey();
    const clans = await prisma.clan.findMany({
      include: { members: { select: { id: true, nickname: true, role: true, isGuest: true } } },
    });
    if (clans.length === 0) return [];

    // Admins e visitantes não contam pontos pro ranking do clã, mesmo que
    // sejam membros — a mesma regra vale nos rankings individuais.
    const contaNoRanking = (m) => m.role !== "ADMIN" && !m.isGuest;
    const todosIds = clans.flatMap((c) => c.members.filter(contaNoRanking).map((m) => m.id));

    // UMA consulta pra todos os clãs, em vez de uma por clã: com 20 clãs
    // isso era 21 idas ao banco a cada carregamento da página.
    // No "geral", exclui as linhas por sala (gameKey com ":"), que existem
    // só pra alimentar a lista dentro da sala — sem isso cada ponto entraria
    // duas vezes. Num jogo específico, o gameKey exato já resolve.
    const filtroJogo =
      jogo === "geral" ? { NOT: { gameKey: { contains: ":" } } } : { gameKey: jogo };

    const scores = todosIds.length
      ? await prisma.monthlyScore.groupBy({
          by: ["userId"],
          where: { userId: { in: todosIds }, monthKey, ...filtroJogo },
          _sum: { points: true },
        })
      : [];
    const porUsuario = Object.fromEntries(scores.map((s) => [s.userId, s._sum.points || 0]));

    const results = [];
    for (const clan of clans) {
      const membros = clan.members.filter(contaNoRanking);
      if (membros.length === 0) continue;
      const total = membros.reduce((soma, m) => soma + (porUsuario[m.id] || 0), 0);
      results.push({
        id: clan.id,
        name: clan.name,
        tag: clan.tag,
        memberCount: membros.length,
        points: total,
      });
    }

    results.sort((a, b) => b.points - a.points);
    return results.map((r, i) => ({ position: i + 1, ...r }));
  });

  res.json(dados);
});

export default router;
