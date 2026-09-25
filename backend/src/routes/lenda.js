import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { verifyToken } from "../utils/jwt.js";
import { cacheOuBuscar, cacheInvalidar } from "../utils/cache.js";
import { validarSave, validarCasa, escolherCasas, validarRanking } from "../lenda/validar.js";
import { abrirSave, fichaPublica } from "../lenda/ficha.js";

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
const RANKING_INTERVALO_MS = 30_000;

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

// ---------- ranking online dos jogadores ----------
// Atualizar a minha linha (o jogo manda sozinho, no máximo 1x por minuto).
router.put("/ranking", requireAuth, async (req, res) => {
  const v = validarRanking(req.body);
  if (!v.ok) return res.status(400).json({ error: v.erro });
  const antes = await prisma.lendaRanking.findUnique({ where: { userId: req.user.id }, select: { atualizadoEm: true } });
  if (antes && Date.now() - new Date(antes.atualizadoEm).getTime() < RANKING_INTERVALO_MS) {
    return res.status(429).json({ error: "Atualizando rápido demais." });
  }
  const eu = await prisma.user.findUnique({ where: { id: req.user.id }, select: { nickname: true } });
  const dados = { apelido: eu?.nickname || req.user.nickname || "Jogador", ...v.ranking };
  await prisma.lendaRanking.upsert({ where: { userId: req.user.id }, create: { userId: req.user.id, ...dados }, update: dados });
  // Limpa a lista guardada: quem acabou de entrar aparece na hora (antes
  // esperava até 1 min, e a janela aberta logo em seguida vinha vazia).
  cacheInvalidar("lenda:ranking");
  res.json({ ok: true });
});

// Top dos jogadores por XP. Público; guardado 1 min (o banco não acorda a
// cada abertura da janela). Fica de fora conta banida ou oculta dos rankings.
// Admin ENTRA: este ranking não vale prêmio (os rankings com premiação do
// site é que tiram admin) — e tirar deixava a lista vazia pra quem testava.
router.get("/ranking", async (_req, res) => {
  const lista = await cacheOuBuscar("lenda:ranking", 60, async () => {
    const topo = await prisma.lendaRanking.findMany({
      orderBy: [{ xp: "desc" }, { atualizadoEm: "asc" }],
      take: 80,
      select: { userId: true, apelido: true, nivel: true, xp: true, posicao: true, fase: true, time: true },
    });
    const bloqueados = new Set(
      (await prisma.user.findMany({
        where: { id: { in: topo.map((t) => t.userId) }, OR: [{ banned: true }, { ocultoNoRanking: true }] },
        select: { id: true },
      })).map((u) => u.id)
    );
    return topo.filter((t) => !bloqueados.has(t.userId)).slice(0, 50);
  });
  res.json(lista);
});

// ---------- personagens (página tipo Tibia) ----------
// Contas que não aparecem em lugar nenhum: banida ou oculta dos rankings.
async function contasBloqueadas(ids) {
  if (!ids.length) return new Set();
  return new Set((await prisma.user.findMany({ where: { id: { in: ids }, OR: [{ banned: true }, { ocultoNoRanking: true }] }, select: { id: true } })).map((u) => u.id));
}
// Lista (com busca pelo apelido). Público; 1 min de cache por busca.
router.get("/personagens", async (req, res) => {
  const busca = String(req.query.busca || "").trim().slice(0, 30);
  const lista = await cacheOuBuscar("lenda:personagens:" + busca.toLowerCase(), 60, async () => {
    const achados = await prisma.lendaRanking.findMany({
      where: busca ? { apelido: { contains: busca, mode: "insensitive" } } : {},
      orderBy: [{ xp: "desc" }, { atualizadoEm: "asc" }], take: 60,
      select: { userId: true, apelido: true, nivel: true, xp: true, posicao: true, fase: true, time: true, atualizadoEm: true },
    });
    const bloq = await contasBloqueadas(achados.map((a) => a.userId));
    return achados.filter((a) => !bloq.has(a.userId)).slice(0, 50).map(({ userId, ...r }) => r);
  });
  res.json(lista);
});
// Ficha de um personagem pelo apelido da conta. Público; 1 min de cache.
// Vem do save na nuvem (fichaPublica escolhe só o que pode ser mostrado).
router.get("/personagem/:apelido", async (req, res) => {
  const apelido = String(req.params.apelido || "").trim().slice(0, 30);
  if (!apelido) return res.status(400).json({ error: "Diga o nome do personagem." });
  const r = await cacheOuBuscar("lenda:personagem:" + apelido.toLowerCase(), 60, async () => {
    const u = await prisma.user.findFirst({
      where: { nickname: { equals: apelido, mode: "insensitive" } },
      select: { id: true, nickname: true, createdAt: true, isGuest: true, banned: true, ocultoNoRanking: true },
    });
    if (!u || u.banned || u.ocultoNoRanking) return { naoAchou: true };
    const [save, rank] = await Promise.all([
      prisma.lendaSave.findUnique({ where: { userId: u.id }, select: { dados: true, atualizadoEm: true } }),
      prisma.lendaRanking.findUnique({ where: { userId: u.id }, select: { nivel: true, xp: true, fase: true, posicao: true, time: true, atualizadoEm: true } }),
    ]);
    if (!save && !rank) return { naoAchou: true };
    return {
      apelido: u.nickname, membroDesde: u.createdAt, visitante: !!u.isGuest,
      ultimoJogo: (save || rank).atualizadoEm,
      ficha: save ? fichaPublica(abrirSave(save.dados)) : null,
      resumo: rank ? { nivel: rank.nivel, xp: rank.xp, fase: rank.fase, posicao: rank.posicao, time: rank.time } : null,
    };
  });
  if (r.naoAchou) return res.status(404).json({ error: "Personagem não encontrado." });
  res.json(r);
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
