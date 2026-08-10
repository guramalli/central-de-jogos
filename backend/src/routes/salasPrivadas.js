import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { ROOM_CONFIGS } from "../game/roomConfigs.js";
import {
  criarSalaPrivada,
  listarSalasPrivadas,
  validarEntradaSalaPrivada,
} from "../game/gameManager.js";

const router = Router();

// Temas exclusivos da Sala da Zoeira. Aqui eles são permitidos (a validação
// é por voto), mas vêm marcados pra ficar claro na hora de escolher.
const TEMAS_DA_ZOEIRA = new Set(
  Object.values(ROOM_CONFIGS)
    .filter((c) => c.semPontuacao && Array.isArray(c.fixedThemeKeys) && !c.privada)
    .flatMap((c) => c.fixedThemeKeys)
);

// Temas disponíveis para montar a sala.
router.get("/temas", requireAuth, async (req, res) => {
  const temas = await prisma.theme.findMany({
    select: { key: true, name: true },
    orderBy: { name: "asc" },
  });
  res.json(
    temas
      .filter((t) => t.key !== "adminEG")
      .map((t) => ({ ...t, zoeira: TEMAS_DA_ZOEIRA.has(t.key) }))
  );
});

// Lista as salas abertas no momento — sem expor senha nenhuma.
router.get("/", requireAuth, (req, res) => {
  res.json(listarSalasPrivadas());
});

router.post("/criar", requireAuth, async (req, res) => {
  const { nome, senha, themeKeys, answerSeconds, maxPlayers } = req.body;

  const nomeLimpo = String(nome || "").trim();
  if (nomeLimpo.length < 3 || nomeLimpo.length > 30) {
    return res.status(400).json({ error: "O nome da sala precisa ter entre 3 e 30 caracteres." });
  }
  if (!/^[\p{L}\p{N} _'-]+$/u.test(nomeLimpo)) {
    return res.status(400).json({ error: "Use apenas letras, números e espaços no nome." });
  }

  const senhaLimpa = String(senha || "").trim();
  if (senhaLimpa && (senhaLimpa.length < 3 || senhaLimpa.length > 20)) {
    return res.status(400).json({ error: "A senha precisa ter entre 3 e 20 caracteres." });
  }

  if (!Array.isArray(themeKeys) || themeKeys.length < 3) {
    return res.status(400).json({ error: "Escolha pelo menos 3 temas." });
  }
  if (themeKeys.length > 12) {
    return res.status(400).json({ error: "Escolha no máximo 12 temas." });
  }

  const seg = Number(answerSeconds);
  if (!Number.isFinite(seg) || seg < 20 || seg > 90) {
    return res.status(400).json({ error: "O tempo deve ficar entre 20 e 90 segundos." });
  }
  const max = Number(maxPlayers);
  if (!Number.isFinite(max) || max < 2 || max > 16) {
    return res.status(400).json({ error: "A sala aceita de 2 a 16 jogadores." });
  }

  try {
    const io = req.app.get("io");
    const { roomId, nome: nomeCriado } = await criarSalaPrivada(io, {
      nome: nomeLimpo,
      senha: senhaLimpa,
      themeKeys,
      answerSeconds: seg,
      maxPlayers: max,
      criadorId: req.user.id,
      criadorNickname: req.user.nickname,
    });
    res.json({ roomId, nome: nomeCriado });
  } catch (e) {
    res.status(400).json({ error: e.message || "Não foi possível criar a sala." });
  }
});

// Confere a senha antes de liberar a entrada.
router.post("/entrar", requireAuth, (req, res) => {
  const { roomId, senha } = req.body;
  const r = validarEntradaSalaPrivada(roomId, senha, req.user.id);

  if (r.ok) return res.json({ roomId });

  if (r.motivo === "senha") {
    return res.status(403).json({ error: "Senha incorreta." });
  }
  return res.status(404).json({
    error: "Essa sala não existe mais — ela é encerrada quando todo mundo sai.",
  });
});

export default router;
