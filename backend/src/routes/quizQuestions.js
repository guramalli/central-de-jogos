import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const VALID_THEMES = [
  "esportes", "ciencias", "historia", "cinema", "letras",
  "geral", "musica", "series", "novelas", "geografia", "direito",
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

const VALID_REPORT_REASONS = ["tema_errado", "resposta_errada", "escrita", "outro"];

// Qualquer jogador pode denunciar uma pergunta com problema (fora do tema,
// resposta errada, erro de escrita). Fica registrado pro admin revisar no
// painel — a pergunta continua no ar até alguém decidir o que fazer.
router.post("/report", requireAuth, async (req, res) => {
  const { questionId, reason, comment } = req.body;

  if (!questionId) return res.status(400).json({ error: "Pergunta não informada." });
  if (!VALID_REPORT_REASONS.includes(reason)) {
    return res.status(400).json({ error: "Motivo inválido." });
  }
  if (comment && comment.length > 300) {
    return res.status(400).json({ error: "O comentário pode ter no máximo 300 caracteres." });
  }

  const question = await prisma.quizQuestion.findUnique({ where: { id: questionId } });
  if (!question) return res.status(404).json({ error: "Pergunta não encontrada." });

  try {
    await prisma.quizQuestionReport.create({
      data: {
        questionId,
        userId: req.user.id,
        reason,
        comment: comment?.trim() || null,
      },
    });
    res.json({ ok: true, message: "Obrigado! O time vai revisar essa pergunta." });
  } catch (err) {
    // índice único: mesma pessoa já denunciou essa pergunta antes
    if (err.code === "P2002") {
      return res.json({ ok: true, message: "Você já tinha reportado essa pergunta. Obrigado!" });
    }
    console.error("Falha ao registrar denúncia de pergunta:", err.message);
    res.status(500).json({ error: "Erro ao enviar. Tenta de novo?" });
  }
});

export default router;
