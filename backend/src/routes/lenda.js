import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { verifyToken } from "../utils/jwt.js";
import { cacheOuBuscar, cacheInvalidar } from "../utils/cache.js";
import { validarSave, validarCasa, escolherCasas } from "../lenda/validar.js";

// ===== Lenda do Campinho (RPG de futebol, em public/lenda-do-campinho/) =====
//
// O jogo roda no navegador de cada um. Aqui ficam só:
//   - o save na nuvem (pra continuar em outro aparelho);
//   - a casa publicada de cada jogador, que os outros veem e podem visitar.
// Tabelas próprias (LendaSave, LendaCasa), sem mexer em nenhuma outra.
// Nada aqui mexe em partida em andamento dos outros jogos.

const router = Router();

// Salvar muito seguido não ajuda ninguém: o jogo manda no máximo a cada
// minuto; o limite aqui só barra abuso.
const SAVE_INTERVALO_MS = 10_000;
const CASA_INTERVALO_MS = 5_000;

// Quem está pedindo (opcional): as rotas públicas funcionam sem login, mas
// com login dá pra não mostrar a casa da própria pessoa pra ela mesma.
function quemPede(req) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return null;
  try { return verifyToken(h.split(" ")[1]).id || null; } catch { return null; }
}

// ---------- save na nuvem ----------
router.get("/save", requireAuth, async (req, res) => {
  const s = await prisma.lendaSave.findUnique({ where: { userId: req.user.id } });
  if (!s) return res.status(404).json({ error: "Nenhum save na nuvem ainda." });
  res.json({ dados: s.dados, nivel: s.nivel, atualizadoEm: s.atualizadoEm });
});

router.put("/save", requireAuth, async (req, res) => {
  const v = validarSave(req.body);
  if (!v.ok) return res.status(400).json({ error: v.erro });
  const antes = await prisma.lendaSave.findUnique({ where: { userId: req.user.id }, select: { atualizadoEm: true } });
  if (antes && Date.now() - new Date(antes.atualizadoEm).getTime() < SAVE_INTERVALO_MS) {
    return res.status(429).json({ error: "Salvando rápido demais. Tente em alguns segundos." });
  }
  const s = await prisma.lendaSave.upsert({
    where: { userId: req.user.id },
    create: { userId: req.user.id, dados: v.dados, nivel: v.nivel, tamanho: v.dados.length },
    update: { dados: v.dados, nivel: v.nivel, tamanho: v.dados.length },
    select: { atualizadoEm: true },
  });
  res.json({ ok: true, atualizadoEm: s.atualizadoEm });
});

// ---------- casas ----------
// Publicar (ou atualizar) a minha casa.
router.put("/casa", requireAuth, async (req, res) => {
  const v = validarCasa(req.body);
  if (!v.ok) return res.status(400).json({ error: v.erro });
  const antes = await prisma.lendaCasa.findUnique({ where: { userId: req.user.id }, select: { atualizadoEm: true, mapa: true } });
  if (antes && Date.now() - new Date(antes.atualizadoEm).getTime() < CASA_INTERVALO_MS) {
    return res.status(429).json({ error: "Atualizando rápido demais." });
  }
  // O nome mostrado é o APELIDO da conta (já passa pelas regras do site), não
  // o nome do personagem, que é livre.
  const eu = await prisma.user.findUnique({ where: { id: req.user.id }, select: { nickname: true } });
  const dados = { apelido: eu?.nickname || req.user.nickname || "Jogador", ...v.casa };
  await prisma.lendaCasa.upsert({ where: { userId: req.user.id }, create: { userId: req.user.id, ...dados }, update: dados });
  cacheInvalidar("lenda:casas:");
  res.json({ ok: true });
});

// Vendi a casa: some da vizinhança.
router.delete("/casa", requireAuth, async (req, res) => {
  await prisma.lendaCasa.deleteMany({ where: { userId: req.user.id } });
  cacheInvalidar("lenda:casas:");
  res.json({ ok: true });
});

// Casas de outros jogadores num lugar (para as portas do mapa). Público.
router.get("/casas", async (req, res) => {
  const mapa = String(req.query.mapa || "");
  if (!/^[a-z]{2,12}$/.test(mapa)) return res.status(400).json({ error: "Lugar inválido." });
  const limite = Math.min(12, Math.max(1, parseInt(req.query.limite, 10) || 6));
  const lista = await cacheOuBuscar(`lenda:casas:${mapa}`, 60, () =>
    prisma.lendaCasa.findMany({
      where: { mapa },
      orderBy: [{ prestigio: "desc" }, { atualizadoEm: "desc" }],
      take: 60,
      select: { userId: true, apelido: true, casaId: true, prestigio: true, vitrine: true, visitas: true },
    })
  );
  res.json(escolherCasas(lista, { excluir: quemPede(req), limite }));
});

// Ranking das casas mais incríveis. Público.
router.get("/casas-ranking", async (_req, res) => {
  const lista = await cacheOuBuscar("lenda:casas:ranking", 60, () =>
    prisma.lendaCasa.findMany({
      orderBy: [{ prestigio: "desc" }, { visitas: "desc" }],
      take: 20,
      select: { userId: true, apelido: true, casaId: true, mapa: true, prestigio: true, visitas: true, vitrine: true },
    })
  );
  res.json(lista);
});

// Visitar a casa de alguém (só olhar). Conta a visita quando quem olha não é o dono.
router.get("/casa/:userId", async (req, res) => {
  const c = await prisma.lendaCasa.findUnique({ where: { userId: String(req.params.userId) } });
  if (!c) return res.status(404).json({ error: "Casa não encontrada." });
  const quem = quemPede(req);
  if (quem && quem !== c.userId) {
    prisma.lendaCasa.update({ where: { userId: c.userId }, data: { visitas: { increment: 1 } } }).catch(() => {});
  }
  res.json({ userId: c.userId, apelido: c.apelido, casaId: c.casaId, mapa: c.mapa, moveis: c.moveis, itens: c.itens, prestigio: c.prestigio, visitas: c.visitas });
});

export default router;
