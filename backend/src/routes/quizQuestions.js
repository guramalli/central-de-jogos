import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const VALID_THEMES = [
  "esportes", "ciencias", "historia", "cinema", "letras",
  "geral", "musica", "series", "novelas", "geografia",
];

// Qualquer jogador logado pode sugerir uma pergunta — entra como "pending"
// até um admin/moderador aprovar pelo painel.
router.post("/suggest", requireAuth, async (req, res) => {
  const { themeKey, question, answer } = req.body;
  if (!themeKey || !question?.trim() || !answer?.trim()) {
    return res.status(400).json({ error: "Tema, pergunta e resposta são obrigatórios." });
  }
  if (!VALID_THEMES.includes(themeKey)) {
    return res.status(400).json({ error: "Tema inválido." });
  }
  if (question.trim().length > 300) {
    return res.status(400).json({ error: "A pergunta pode ter no máximo 300 caracteres." });
  }
  if (answer.trim().length > 60) {
    return res.status(400).json({ error: "A resposta pode ter no máximo 60 caracteres." });
  }

  const entry = await prisma.quizQuestion.create({
    data: {
      themeKey,
      question: question.trim(),
      answer: answer.trim(),
      status: "pending",
      suggestedById: req.user.id,
    },
  });
  res.json(entry);
});

export default router;
