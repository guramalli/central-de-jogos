import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { RANKS } from "../utils/rank.js";

const router = Router();

// Índice completo de patentes (nome, ícone, pontos necessários) — usado na
// página "Patentes" pra qualquer jogador conferir a progressão completa.
router.get("/", requireAuth, (req, res) => {
  res.json(RANKS);
});

export default router;
