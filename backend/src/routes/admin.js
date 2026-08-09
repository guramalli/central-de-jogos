import { Router } from "express";
import { prisma } from "../db.js";
import { getOnlinePlayersDetailed as getStopOnlineDetailed } from "../game/gameManager.js";
import { getOnlinePlayersDetailed as getQuizOnlineDetailed } from "../game/quizGameManager.js";
import { getOnlinePlayersDetailed as getAcromaniaOnlineDetailed } from "../game/acromaniaGameManager.js";
import { getOnlineList as getGeneralChatOnline } from "../game/generalChat.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requireRole("MODERATOR", "ADMIN"));

router.get("/glossary/pending", async (req, res) => {
  const pending = await prisma.wordEntry.findMany({
    where: { status: "pending" },
    include: { theme: true, suggestedBy: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(pending);
});

router.post("/glossary/:id/approve", async (req, res) => {
  const entry = await prisma.wordEntry.update({
    where: { id: req.params.id },
    data: { status: "approved" },
  });
  res.json(entry);
});

router.post("/glossary/:id/reject", async (req, res) => {
  const entry = await prisma.wordEntry.update({
    where: { id: req.params.id },
    data: { status: "rejected" },
  });
  res.json(entry);
});

// Índice completo de palavras de um tema (para o painel de gerenciamento do glossário)
router.get("/glossary/words", async (req, res) => {
  const { themeKey } = req.query;
  if (!themeKey) return res.status(400).json({ error: "themeKey é obrigatório." });
  const theme = await prisma.theme.findUnique({ where: { key: themeKey } });
  if (!theme) return res.status(404).json({ error: "Tema não encontrado." });
  const words = await prisma.wordEntry.findMany({
    where: { themeId: theme.id },
    orderBy: [{ letter: "asc" }, { word: "asc" }],
  });
  res.json(words);
});

// Admin/moderador insere uma palavra diretamente já aprovada (não precisa de fila de aprovação)
router.post("/glossary/words", async (req, res) => {
  const { themeKey, letter, word } = req.body;
  if (!themeKey || !letter || !word) {
    return res.status(400).json({ error: "themeKey, letter e word são obrigatórios." });
  }
  const theme = await prisma.theme.findUnique({ where: { key: themeKey } });
  if (!theme) return res.status(404).json({ error: "Tema não encontrado." });

  try {
    const entry = await prisma.wordEntry.create({
      data: {
        themeId: theme.id,
        letter: letter.toUpperCase(),
        word: word.trim(),
        status: "approved",
      },
    });
    res.json(entry);
  } catch {
    res.status(409).json({ error: "Essa palavra já existe para esse tema/letra." });
  }
});

// Remove uma palavra do glossário (qualquer status)
router.delete("/glossary/words/:id", async (req, res) => {
  await prisma.wordEntry.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

router.get("/feedback", async (req, res) => {
  const feedbacks = await prisma.feedback.findMany({
    include: { user: { select: { nickname: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(feedbacks);
});

router.delete("/feedback/:id", async (req, res) => {
  await prisma.feedback.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ===== Glossário de perguntas do Quiz =====

router.get("/quiz-questions/pending", async (req, res) => {
  const pending = await prisma.quizQuestion.findMany({
    where: { status: "pending" },
    include: { suggestedBy: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(pending);
});

router.post("/quiz-questions/:id/approve", async (req, res) => {
  const entry = await prisma.quizQuestion.update({
    where: { id: req.params.id },
    data: { status: "approved", validationNote: null },
  });
  res.json(entry);
});

router.post("/quiz-questions/:id/reject", async (req, res) => {
  const entry = await prisma.quizQuestion.update({
    where: { id: req.params.id },
    data: { status: "rejected" },
  });
  res.json(entry);
});

// Índice completo de perguntas de um tema (para o painel de gerenciamento)
router.get("/quiz-questions", async (req, res) => {
  const { themeKey } = req.query;
  if (!themeKey) return res.status(400).json({ error: "themeKey é obrigatório." });
  const questions = await prisma.quizQuestion.findMany({
    where: { themeKey },
    orderBy: { createdAt: "desc" },
  });
  res.json(questions);
});

// Admin/moderador insere uma pergunta direto, já aprovada (sem fila)
router.post("/quiz-questions", async (req, res) => {
  const { themeKey, question, answer, difficulty } = req.body;
  if (!themeKey || !question?.trim() || !answer?.trim()) {
    return res.status(400).json({ error: "themeKey, question e answer são obrigatórios." });
  }
  const entry = await prisma.quizQuestion.create({
    data: {
      themeKey,
      question: question.trim(),
      answer: answer.trim(),
      status: "approved",
      difficulty: ["facil", "medio", "dificil"].includes(difficulty) ? difficulty : "medio",
    },
  });
  res.json(entry);
});

router.delete("/quiz-questions/:id", async (req, res) => {
  await prisma.quizQuestion.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// Busca por pergunta/resposta em TODOS os temas de uma vez — usado pra achar
// e corrigir/apagar uma pergunta específica sem precisar navegar tema por tema.
router.get("/quiz-questions/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json([]);
  const results = await prisma.quizQuestion.findMany({
    where: {
      OR: [
        { question: { contains: q, mode: "insensitive" } },
        { answer: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(results);
});

router.patch("/quiz-questions/:id", async (req, res) => {
  const { question, answer, themeKey, difficulty } = req.body;
  const data = {};
  if (question !== undefined) {
    if (!question.trim()) return res.status(400).json({ error: "A pergunta não pode ficar vazia." });
    data.question = question.trim();
  }
  if (answer !== undefined) {
    if (!answer.trim()) return res.status(400).json({ error: "A resposta não pode ficar vazia." });
    data.answer = answer.trim();
  }
  if (themeKey !== undefined) data.themeKey = themeKey;
  if (difficulty !== undefined && ["facil", "medio", "dificil"].includes(difficulty)) {
    data.difficulty = difficulty;
  }
  const updated = await prisma.quizQuestion.update({ where: { id: req.params.id }, data });
  res.json(updated);
});

router.get("/users", requireRole("ADMIN"), async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, nickname: true, email: true, role: true, banned: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(users);
});

router.post("/users/:id/role", requireRole("ADMIN"), async (req, res) => {
  const { role } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role },
  });
  res.json({ id: user.id, role: user.role });
});

// Banir/desbanir: reversível — bloqueia login e desconecta sessões ativas,
// mas não apaga nada. É a opção mais segura pro dia a dia.
router.post("/users/:id/ban", requireRole("ADMIN"), async (req, res) => {
  if (req.user.id === req.params.id) {
    return res.status(400).json({ error: "Você não pode banir sua própria conta." });
  }
  const { banned } = req.body;
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) return res.status(404).json({ error: "Usuário não encontrado." });
  if (target.role === "ADMIN") {
    return res.status(400).json({ error: "Não é possível banir uma conta de administrador." });
  }
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { banned: !!banned },
  });
  res.json({ id: user.id, banned: user.banned });
});

// Apagar de vez: remove a conta e todo o histórico associado (pontuações,
// mensagens salvas, sugestões, amizades, feedback). Se a pessoa for dona de
// um clã, o clã também é desfeito (os outros membros só perdem o clã, não
// são apagados). Ação PERMANENTE — não tem como desfazer.
router.delete("/users/:id", requireRole("ADMIN"), async (req, res) => {
  const userId = req.params.id;
  if (req.user.id === userId) {
    return res.status(400).json({ error: "Você não pode apagar sua própria conta por aqui." });
  }
  const target = await prisma.user.findUnique({ where: { id: userId }, include: { ownedClan: true } });
  if (!target) return res.status(404).json({ error: "Usuário não encontrado." });
  if (target.role === "ADMIN") {
    return res.status(400).json({ error: "Não é possível apagar uma conta de administrador por aqui." });
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (target.ownedClan) {
        const clanId = target.ownedClan.id;
        await tx.user.updateMany({ where: { clanId }, data: { clanId: null } });
        await tx.clanInvite.deleteMany({ where: { clanId } });
        await tx.clan.delete({ where: { id: clanId } });
      }
      await tx.clanInvite.deleteMany({ where: { invitedId: userId } });
      await tx.feedback.deleteMany({ where: { userId } });
      await tx.chatMessage.deleteMany({ where: { userId } });
      await tx.friendship.deleteMany({ where: { OR: [{ userAId: userId }, { userBId: userId }] } });
      await tx.monthlyScore.deleteMany({ where: { userId } });
      await tx.lifetimeScore.deleteMany({ where: { userId } });
      await tx.blockScore.deleteMany({ where: { userId } });
      await tx.wordEntry.updateMany({ where: { suggestedById: userId }, data: { suggestedById: null } });
      await tx.quizQuestion.updateMany({ where: { suggestedById: userId }, data: { suggestedById: null } });
      await tx.user.delete({ where: { id: userId } });
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("Falha ao apagar usuário", userId, err.message);
    res.status(500).json({ error: "Erro ao apagar usuário. Tenta de novo?" });
  }
});

// Lista os sinais suspeitos agrupados por jogador, do mais sinalizado pro
// menos — só pra revisão manual, nunca aplica nenhuma ação sozinho.
router.get("/suspicious-activity", async (req, res) => {
  const entries = await prisma.suspiciousActivity.findMany({
    include: { user: { select: { id: true, nickname: true, email: true, banned: true } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const byUser = new Map();
  for (const e of entries) {
    if (!byUser.has(e.userId)) {
      byUser.set(e.userId, { user: e.user, count: 0, pasteCount: 0, tooPerfectCount: 0, latest: e.createdAt, items: [] });
    }
    const group = byUser.get(e.userId);
    group.count++;
    if (e.reason === "paste") group.pasteCount++;
    if (e.reason === "too_perfect") group.tooPerfectCount++;
    if (group.items.length < 10) {
      group.items.push({ reason: e.reason, detail: e.detail, roomId: e.roomId, createdAt: e.createdAt });
    }
  }

  const grouped = [...byUser.values()].sort((a, b) => b.count - a.count);
  res.json(grouped);
});

// Perguntas denunciadas por jogadores, agrupadas — a com mais denúncias
// primeiro, já que é a mais provável de ter problema real.
router.get("/question-reports", async (req, res) => {
  const reports = await prisma.quizQuestionReport.findMany({
    where: { resolved: false },
    include: {
      question: true,
      user: { select: { nickname: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const byQuestion = new Map();
  for (const r of reports) {
    if (!byQuestion.has(r.questionId)) {
      byQuestion.set(r.questionId, {
        questionId: r.questionId,
        question: r.question,
        count: 0,
        reports: [],
      });
    }
    const g = byQuestion.get(r.questionId);
    g.count++;
    g.reports.push({
      id: r.id,
      nickname: r.user.nickname,
      reason: r.reason,
      comment: r.comment,
      createdAt: r.createdAt,
    });
  }

  res.json([...byQuestion.values()].sort((a, b) => b.count - a.count));
});

// Marca todas as denúncias de uma pergunta como resolvidas (depois que o
// admin corrigiu ou decidiu que estava tudo certo).
router.post("/question-reports/:questionId/resolve", async (req, res) => {
  await prisma.quizQuestionReport.updateMany({
    where: { questionId: req.params.questionId },
    data: { resolved: true },
  });
  res.json({ ok: true });
});

// Quem está online agora, e onde. Junta as quatro fontes possíveis: as três
// de salas de jogo e o chat geral (quem está só na página inicial).
router.get("/online", async (req, res) => {
  const porJogo = [
    ["Stop", getStopOnlineDetailed()],
    ["Quiz", getQuizOnlineDetailed()],
    ["Acromania", getAcromaniaOnlineDetailed()],
  ];

  // userId -> { nickname, locais: [] }
  const pessoas = new Map();

  for (const [jogo, lista] of porJogo) {
    for (const p of lista) {
      if (!pessoas.has(p.userId)) {
        pessoas.set(p.userId, { userId: p.userId, nickname: p.nickname, locais: [] });
      }
      pessoas.get(p.userId).locais.push({ jogo, sala: p.roomLabel });
    }
  }

  // Quem está no chat geral (página inicial) e não apareceu em sala nenhuma.
  for (const p of getGeneralChatOnline()) {
    if (!pessoas.has(p.userId)) {
      pessoas.set(p.userId, { userId: p.userId, nickname: p.nickname, locais: [] });
    }
  }

  const lista = [...pessoas.values()];

  // Marca quem é visitante, pra dar contexto ao número total.
  const ids = lista.map((p) => p.userId);
  let visitantes = new Set();
  if (ids.length > 0) {
    try {
      const guests = await prisma.user.findMany({
        where: { id: { in: ids }, isGuest: true },
        select: { id: true },
      });
      visitantes = new Set(guests.map((g) => g.id));
    } catch {
      // se falhar, segue sem a marcação — não vale derrubar a rota por isso
    }
  }

  const resultado = lista.map((p) => ({
    ...p,
    isGuest: visitantes.has(p.userId),
    local: p.locais.length > 0 ? p.locais.map((l) => `${l.jogo}: ${l.sala}`).join(" · ") : "Página inicial",
  }));

  // Quem está jogando aparece primeiro; depois ordem alfabética.
  resultado.sort(
    (a, b) =>
      b.locais.length - a.locais.length || a.nickname.localeCompare(b.nickname, "pt-BR")
  );

  res.json({
    total: resultado.length,
    registrados: resultado.filter((p) => !p.isGuest).length,
    visitantes: resultado.filter((p) => p.isGuest).length,
    jogando: resultado.filter((p) => p.locais.length > 0).length,
    jogadores: resultado,
  });
});

export default router;
