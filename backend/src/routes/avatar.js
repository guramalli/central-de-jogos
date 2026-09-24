import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { cacheInvalidar } from "../utils/cache.js";
import { catalogoPublico, VERSAO_CATALOGO, CONFIG_PADRAO } from "../avatar/catalogo.js";
import { itensLiberados, configPublica, salvarAvatar } from "../avatar/desbloqueio.js";

// ===== Avatar montado (boneco em camadas) =====
// Catálogo em src/avatar/catalogo.js; regras de desbloqueio em
// src/avatar/desbloqueio.js.

const router = Router();

// Catálogo inteiro. Sem login: é o mesmo pra todo mundo, e qualquer tela
// que desenhe o avatar de alguém precisa dele. O navegador guarda em cache;
// o "?v=" que o frontend manda muda com VERSAO_CATALOGO.
router.get("/catalogo", (_req, res) => {
  res.set("Cache-Control", "public, max-age=3600");
  res.json(catalogoPublico());
});

// Minha montagem + o que já liberei (pro editor).
router.get("/meu", requireAuth, async (req, res) => {
  const [eu, liberados] = await Promise.all([
    prisma.user.findUnique({ where: { id: req.user.id }, select: { avatarMontado: true, mostrarAvatar: true } }),
    itensLiberados(req.user.id),
  ]);
  const montado = configPublica(eu?.avatarMontado);
  res.json({
    // Quem nunca montou recebe o padrão pra já começar com um boneco na tela.
    config: montado || CONFIG_PADRAO,
    jaMontou: !!montado,
    mostrarAvatar: eu?.mostrarAvatar === true && !!montado,
    liberados,
    versaoCatalogo: VERSAO_CATALOGO,
  });
});

// Salva a montagem e/ou a preferência da bolinha. Corpo:
//   { config?: { slot: idDaPeça | null }, mostrarAvatar?: boolean }
router.put("/", requireAuth, async (req, res) => {
  const { status, corpo } = await salvarAvatar(req.user.id, req.body, {
    liberados: itensLiberados,
    montagemAtual: async (id) =>
      (await prisma.user.findUnique({ where: { id }, select: { avatarMontado: true } }))?.avatarMontado,
    gravar: (id, data) =>
      prisma.user.update({ where: { id }, data, select: { avatarMontado: true, mostrarAvatar: true } }),
  });
  // O perfil (que leva o avatar pros outros) tem cache de 15s: descarta
  // pra montagem nova aparecer na hora.
  if (status === 200) cacheInvalidar(`perfil:${req.user.id}:`);
  res.status(status).json(corpo);
});

export default router;
