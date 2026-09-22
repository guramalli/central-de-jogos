import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { sendFeedbackEmail } from "../utils/mailer.js";

const router = Router();

const VALID_TYPES = ["ideia", "bug", "outro"];

// ANTI-FLOOD do feedback. Cada envio grava no banco E dispara e-mail pro
// Gustavinho — sem limite, um engraçadinho enchia os dois. A contagem vem do
// BANCO (não da memória): um deploy não zera, e vale pra todas as abas.
//   - 1 a cada minuto;
//   - no máximo 5 por dia (24h);
//   - a mesma mensagem não pode ser repetida no mesmo dia.
// Admin e moderador ficam fora.
const FEEDBACK_INTERVALO_MS = 60 * 1000;
const FEEDBACK_POR_DIA = 5;
const normalizar = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

router.post("/", requireAuth, async (req, res) => {
  const { type, message } = req.body;
  if (!VALID_TYPES.includes(type) || !message?.trim()) {
    return res.status(400).json({ error: "Tipo e mensagem são obrigatórios." });
  }
  if (message.trim().length > 2000) {
    return res.status(400).json({ error: "Mensagem muito longa (máximo 2000 caracteres)." });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  if (user.role !== "ADMIN" && user.role !== "MODERATOR") {
    const desde = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentes = await prisma.feedback.findMany({
      where: { userId: req.user.id, createdAt: { gte: desde } },
      select: { message: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    if (recentes[0] && Date.now() - new Date(recentes[0].createdAt).getTime() < FEEDBACK_INTERVALO_MS) {
      return res.status(429).json({ error: "Espere 1 minuto antes de mandar outro feedback." });
    }
    if (recentes.length >= FEEDBACK_POR_DIA) {
      return res.status(429).json({ error: `Você já mandou ${FEEDBACK_POR_DIA} feedbacks hoje. Obrigado! Tente de novo amanhã.` });
    }
    const esta = normalizar(message);
    if (recentes.some((f) => normalizar(f.message) === esta)) {
      return res.status(429).json({ error: "Você já mandou essa mesma mensagem hoje." });
    }
  }

  const feedback = await prisma.feedback.create({
    data: { userId: req.user.id, type, message: message.trim() },
  });

  // Envio de e-mail é best-effort — nunca trava a resposta pro usuário.
  sendFeedbackEmail({ nickname: user.nickname, email: user.email, type, message: message.trim() }).catch(() => {});

  res.json(feedback);
});

export default router;
