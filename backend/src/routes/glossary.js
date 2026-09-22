import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { ROOM_CONFIGS } from "../game/roomConfigs.js";
import { autoBanirIP } from "../ipBan.js";

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

  // Validação que faltava (achado num ataque real, zip 604): a rota aceitava
  // QUALQUER string, sem tamanho nem conteúdo — chegou a receber
  // "<script>" e "<img src=x onerror=alert(1)>" como sugestão de palavra.
  // O React escapa tudo automaticamente (não existe dangerouslySetInnerHTML
  // em lugar nenhum do site, então nada disso executaria), mas depender só
  // disso é frágil — uma função nova no futuro podia abrir essa porta sem
  // ninguém perceber. Aqui a barreira é na ORIGEM: só entra o que parece
  // palavra de verdade.
  const palavra = String(word).trim();
  if (palavra.length < 1 || palavra.length > 60) {
    return res.status(400).json({ error: "A palavra precisa ter entre 1 e 60 caracteres." });
  }
  if (!/^[\p{L}\p{N} '-]+$/u.test(palavra)) {
    // zip 612: bane na hora — ninguém sugere "<script>" por engano, é
    // sondagem de propósito (foi um ataque real, ver zip 604).
    await autoBanirIP(req.ip, "conteúdo malicioso numa sugestão de palavra");
    return res.status(400).json({ error: "Use apenas letras, números, espaço, apóstrofo e hífen." });
  }
  const letraUnica = String(letter).trim();
  if (letraUnica.length !== 1 || !/^\p{L}$/u.test(letraUnica)) {
    return res.status(400).json({ error: "A letra precisa ser um único caractere." });
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
        letter: letraUnica.toUpperCase(),
        word: palavra,
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
