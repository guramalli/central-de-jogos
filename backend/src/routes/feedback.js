import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { sendFeedbackEmail } from "../utils/mailer.js";

const router = Router();

const VALID_TYPES = ["ideia", "bug", "outro"];

router.post("/", requireAuth, async (req, res) => {
  const { type, message } = req.body;
  if (!VALID_TYPES.includes(type) || !message?.trim()) {
    return res.status(400).json({ error: "Tipo e mensagem são obrigatórios." });
  }
  if (message.trim().length > 2000) {
    return res.status(400).json({ error: "Mensagem muito longa (máximo 2000 caracteres)." });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  const feedback = await prisma.feedback.create({
    data: { userId: req.user.id, type, message: message.trim() },
  });

  // Envio de e-mail é best-effort — nunca trava a resposta pro usuário.
  sendFeedbackEmail({ nickname: user.nickname, email: user.email, type, message: message.trim() }).catch(() => {});

  res.json(feedback);
});

export default router;
