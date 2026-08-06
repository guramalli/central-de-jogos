import { Router } from "express";
import { getPlatformStats } from "../game/platformStats.js";

const router = Router();

// Pública de propósito: essa informação não é sensível, e o rodapé (onde ela
// aparece) também é exibido em páginas sem login, como Login, Cadastro e
// Termos de Uso.
router.get("/", async (req, res) => {
  const stats = await getPlatformStats();
  res.json(stats);
});

export default router;
