import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { ROOM_CONFIGS } from "../game/roomConfigs.js";

const router = Router();

// Temas usados só na Sala da Zoeira. São subjetivos ("motivo de término",
// "coisa que a sogra fala") e por isso não têm glossário — não faz sentido
// sugerir palavra pra eles, já que não existe resposta "certa" a cadastrar.
const TEMAS_SEM_GLOSSARIO = new Set(
  Object.values(ROOM_CONFIGS)
    .filter((c) => c.semPontuacao && Array.isArray(c.fixedThemeKeys))
    .flatMap((c) => c.fixedThemeKeys)
);

router.get("/themes", requireAuth, async (req, res) => {
  const themes = await prisma.theme.findMany();
  // Marca os temas da Sala da Zoeira: eles aparecem na lista do admin, mas
  // não têm glossário (são subjetivos), então não faz sentido cadastrar
  // palavras neles. O painel usa essa marca pra avisar quem for tentar.
  res.json(
    themes.map((t) => ({ ...t, semGlossario: TEMAS_SEM_GLOSSARIO.has(t.key) }))
  );
});

router.post("/suggest", requireAuth, async (req, res) => {
  const { themeKey, letter, word } = req.body;
  if (!themeKey || !letter || !word) {
    return res.status(400).json({ error: "themeKey, letter e word são obrigatórios." });
  }

  // Temas da Sala da Zoeira não têm glossário — quem julga a resposta é a
  // galera na hora, não uma lista de palavras aceitas.
  if (TEMAS_SEM_GLOSSARIO.has(themeKey)) {
    return res.status(400).json({
      error: "Os temas da Sala da Zoeira não têm lista de palavras — vale o que a galera aceitar!",
    });
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
