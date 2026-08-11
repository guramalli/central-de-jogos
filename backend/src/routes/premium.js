import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import {
  PREMIUM_ATIVO, MOLDURAS, CORES_NICK, EMOJIS_PREMIUM,
  ehPremium, validarEscolhas,
} from "../utils/premium.js";
import { MISSOES_ATIVAS, missoesDe, resgatarMissao, periodoAtual, RECOMPENSAS_STREAK, NOMES_JOGOS } from "../game/missoes.js";
import { hojeBrasilia } from "../utils/monthKey.js";
import { cacheInvalidar } from "../utils/cache.js";

const router = Router();

// O que a pessoa tem e o que pode escolher.
router.get("/", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      premiumAte: true, premiumVitalicio: true, molduraAvatar: true,
      corNickname: true, tituloPerfil: true, saudacaoEntrada: true, saudacaoSaida: true,
    },
  });

  res.json({
    ativo: PREMIUM_ATIVO,
    souPremium: ehPremium(user),
    vitalicio: !!user?.premiumVitalicio,
    validoAte: user?.premiumAte || null,
    escolhas: {
      moldura: user?.molduraAvatar || null,
      corNickname: user?.corNickname || null,
      titulo: user?.tituloPerfil || null,
      saudacaoEntrada: user?.saudacaoEntrada || null,
      saudacaoSaida: user?.saudacaoSaida || null,
    },
    catalogo: { molduras: MOLDURAS, cores: CORES_NICK, emojis: EMOJIS_PREMIUM },
  });
});

// Salva as personalizações.
router.post("/escolhas", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { premiumAte: true, premiumVitalicio: true },
  });

  if (!ehPremium(user)) {
    return res.status(403).json({ error: "Esses ajustes são exclusivos de contas premium." });
  }

  const { limpo, erros } = validarEscolhas(req.body || {});
  if (erros.length) return res.status(400).json({ error: erros[0] });

  await prisma.user.update({ where: { id: req.user.id }, data: limpo });
  res.json({ ok: true, escolhas: limpo });
});

// Missões da pessoa.
// Responde tanto em /api/premium/missoes quanto em /api/missoes/lista —
// a segunda é a usada pelo site, pra não expor "premium" na URL.
router.get(["/missoes", "/lista"], requireAuth, async (req, res) => {
  if (!MISSOES_ATIVAS) return res.json({ ativas: false, diarias: [], semanais: [] });

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { premiumAte: true, premiumVitalicio: true },
  });
  const dados = await missoesDe(req.user.id, ehPremium(user));
  res.json({ ...dados, jogos: NOMES_JOGOS });
});

// Quantas missões estão concluídas e ainda não foram resgatadas. Usado
// pelo avisinho no menu, no mesmo esquema das mensagens privadas.
router.get("/pendentes", requireAuth, async (req, res) => {
  if (!MISSOES_ATIVAS) return res.json({ count: 0 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { premiumAte: true, premiumVitalicio: true },
    });
    const dados = await missoesDe(req.user.id, ehPremium(user));
    const count = [...dados.diarias, ...dados.semanais].filter(
      (m) => m.concluida && !m.resgatada
    ).length;
    res.json({ count });
  } catch {
    // Falha aqui não pode quebrar o menu: devolve zero e segue.
    res.json({ count: 0 });
  }
});

// Resgata a recompensa de uma missão concluída.
router.post("/resgatar", requireAuth, async (req, res) => {
  if (!MISSOES_ATIVAS) return res.status(400).json({ error: "Missões indisponíveis." });

  const { missaoKey, tipo } = req.body;
  if (!missaoKey || !["diarias", "semanais"].includes(tipo)) {
    return res.status(400).json({ error: "Missão inválida." });
  }

  const r = await resgatarMissao(req.user.id, missaoKey, periodoAtual(tipo));
  if (!r.ok) return res.status(400).json({ error: r.erro });

  // A contagem de avisos fica em cache por alguns segundos. Sem limpar
  // aqui, o avisinho do menu continuaria mostrando a missão que a pessoa
  // acabou de resgatar.
  cacheInvalidar(`avisos:${req.user.id}`);
  res.json(r);
});

// Sequência de dias da pessoa, com o próximo marco.
router.get("/streak", requireAuth, async (req, res) => {
  const u = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { streakAtual: true, streakRecorde: true, streakUltimoDia: true },
  });

  const atual = u?.streakAtual || 0;
  const proximo = RECOMPENSAS_STREAK.find((r) => r.dias > atual) || null;

  res.json({
    atual,
    recorde: u?.streakRecorde || 0,
    contouHoje: u?.streakUltimoDia === hojeBrasilia(),
    proximoMarco: proximo,
    marcos: RECOMPENSAS_STREAK,
  });
});

export default router;
