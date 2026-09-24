import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { cacheInvalidar } from "../utils/cache.js";
import { catalogoPublico, VERSAO_CATALOGO, ITENS } from "../avatar/catalogo.js";
import { resumoDoAvatar, itensLiberados, configPublica, avatarDoUsuario, salvarAvatar } from "../avatar/desbloqueio.js";

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

// Minha montagem + o que já liberei + a próxima peça (editor e "Bem-vindo
// de volta" do início).
router.get("/meu", requireAuth, async (req, res) => {
  const eu = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, isGuest: true, avatarMontado: true, mostrarAvatar: true },
  });
  const convidado = !!(eu?.isGuest ?? req.user.isGuest);
  const { liberados, proxima } = await resumoDoAvatar(req.user.id, { convidado });
  res.json({
    // Quem nunca montou recebe o padrão (sorteado do id), o mesmo que os
    // outros já veem.
    config: avatarDoUsuario(eu || { id: req.user.id }),
    jaMontou: !!configPublica(eu?.avatarMontado),
    mostrarAvatar: eu?.mostrarAvatar === true,
    convidado,
    liberados,
    proxima,
    versaoCatalogo: VERSAO_CATALOGO,
  });
});

// Coleção de outra pessoa (vitrine do perfil): só os ids liberados. Mesmo
// cache de 60s do editor; só a página do perfil pede (nunca o hover).
router.get("/colecao/:userId", requireAuth, async (req, res) => {
  const dono = await prisma.user.findUnique({ where: { id: req.params.userId }, select: { isGuest: true } });
  if (!dono) return res.status(404).json({ error: "Usuário não encontrado." });
  const liberados = await itensLiberados(req.params.userId, { convidado: dono.isGuest });
  res.json({ liberados, total: ITENS.length });
});

// Salva a montagem e/ou a preferência da bolinha. Corpo:
//   { config?: { slot: idDaPeça | null, corCabelo?: chaveDaPaleta }, mostrarAvatar?: boolean }
router.put("/", requireAuth, async (req, res) => {
  const eu = await prisma.user.findUnique({ where: { id: req.user.id }, select: { isGuest: true } });
  const { status, corpo } = await salvarAvatar(req.user.id, req.body, {
    liberados: (id) => itensLiberados(id),
    gravar: (id, data) =>
      prisma.user.update({ where: { id }, data, select: { avatarMontado: true, mostrarAvatar: true } }),
  }, { convidado: !!(eu?.isGuest ?? req.user.isGuest) });
  // O perfil (que leva o avatar pros outros) tem cache de 15s: descarta
  // pra montagem nova aparecer na hora.
  if (status === 200) cacheInvalidar(`perfil:${req.user.id}:`);
  res.status(status).json(corpo);
});

export default router;
