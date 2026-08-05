import { Router } from "express";
import { prisma } from "../db.js";
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
    data: { status: "approved" },
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
  const { themeKey, question, answer } = req.body;
  if (!themeKey || !question?.trim() || !answer?.trim()) {
    return res.status(400).json({ error: "themeKey, question e answer são obrigatórios." });
  }
  const entry = await prisma.quizQuestion.create({
    data: { themeKey, question: question.trim(), answer: answer.trim(), status: "approved" },
  });
  res.json(entry);
});

router.delete("/quiz-questions/:id", async (req, res) => {
  await prisma.quizQuestion.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

router.get("/users", requireRole("ADMIN"), async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, nickname: true, email: true, role: true, createdAt: true },
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

export default router;
