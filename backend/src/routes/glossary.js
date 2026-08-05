import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/themes", requireAuth, async (req, res) => {
  const themes = await prisma.theme.findMany();
  res.json(themes);
});

router.post("/suggest", requireAuth, async (req, res) => {
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
        status: "pending",
        suggestedById: req.user.id,
      },
    });
    res.json(entry);
  } catch (e) {
    res.status(409).json({ error: "Essa palavra já existe (ou está pendente) para este tema/letra." });
  }
});

export default router;
