import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import {
  ErroDuelo, criarDuelo, entrarNoDuelo, girar, escolherMedalha, responder,
  desistir, recusar, estadoPara, listarDuelos, estatisticas,
} from "../duelo/duelo.js";

// DUELO — quiz por turnos. Tudo por rotas comuns (sem sala em tempo real):
// cada jogada é uma requisição, e o estado mora no banco.
const router = Router();
router.use(requireAuth);

// Erros de regra viram mensagem pro jogador; o resto é erro de servidor.
const tratar = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    if (err instanceof ErroDuelo) return res.status(err.status).json({ error: err.message });
    console.error("Duelo:", err);
    res.status(500).json({ error: "Algo deu errado no duelo. Tente de novo." });
  }
};

router.get("/", tratar(async (req, res) => {
  res.json(await listarDuelos(req.user.id));
}));

// { adversarioId } (amigo) | { bot: true } | { link: true }
router.post("/", tratar(async (req, res) => {
  const { adversarioId, bot, link } = req.body || {};
  const d = await criarDuelo(req.user.id, { adversarioId, bot: !!bot, link: !!link });
  res.json(await estadoPara(d, req.user.id));
}));

router.get("/estatisticas/:userId", tratar(async (req, res) => {
  res.json(await estatisticas(req.params.userId));
}));

router.get("/:id", tratar(async (req, res) => {
  const d = await prisma.duelo.findUnique({ where: { id: req.params.id } });
  if (!d) throw new ErroDuelo("Duelo não encontrado.", 404);
  const participa = d.jogadorAId === req.user.id || d.jogadorBId === req.user.id;
  // Convite por link: quem ainda não entrou vê só o necessário pra aceitar.
  if (!participa) {
    if (d.jogadorBId || !["andamento", "aguardando"].includes(d.status)) throw new ErroDuelo("Esse duelo não é seu.", 403);
    const criador = await prisma.user.findUnique({ where: { id: d.jogadorAId }, select: { nickname: true } });
    return res.json({ id: d.id, convite: true, criador: criador?.nickname || "Alguém" });
  }
  res.json(await estadoPara(d, req.user.id));
}));

router.post("/:id/entrar", tratar(async (req, res) => {
  res.json(await estadoPara(await entrarNoDuelo(req.params.id, req.user.id), req.user.id));
}));

router.post("/:id/girar", tratar(async (req, res) => {
  res.json(await estadoPara(await girar(req.params.id, req.user.id), req.user.id));
}));

router.post("/:id/medalha", tratar(async (req, res) => {
  res.json(await estadoPara(await escolherMedalha(req.params.id, req.user.id, String(req.body?.tema || "")), req.user.id));
}));

router.post("/:id/responder", tratar(async (req, res) => {
  const r = await responder(req.params.id, req.user.id, req.body?.indice);
  const { duelo, ...resultado } = r;
  res.json({ ...resultado, estado: await estadoPara(duelo, req.user.id) });
}));

router.post("/:id/desistir", tratar(async (req, res) => {
  res.json(await estadoPara(await desistir(req.params.id, req.user.id), req.user.id));
}));

router.post("/:id/recusar", tratar(async (req, res) => {
  await recusar(req.params.id, req.user.id);
  res.json({ ok: true });
}));

// Reportar a ÚLTIMA pergunta respondida neste duelo — cai nas mesmas
// denúncias do Quiz (painel admin).
const MOTIVOS = ["tema_errado", "resposta_errada", "escrita", "outro"];
router.post("/:id/reportar", tratar(async (req, res) => {
  const { motivo, comentario } = req.body || {};
  if (!MOTIVOS.includes(motivo)) throw new ErroDuelo("Motivo inválido.");
  const d = await prisma.duelo.findUnique({ where: { id: req.params.id } });
  if (!d || (d.jogadorAId !== req.user.id && d.jogadorBId !== req.user.id)) throw new ErroDuelo("Duelo não encontrado.", 404);
  const ultima = [...(Array.isArray(d.eventos) ? d.eventos : [])].reverse().find((e) => e.quem === req.user.id && e.perguntaId);
  if (!ultima) throw new ErroDuelo("Nenhuma pergunta pra reportar ainda.");
  await prisma.quizQuestionReport.upsert({
    where: { questionId_userId: { questionId: ultima.perguntaId, userId: req.user.id } },
    update: { reason: motivo, comment: String(comentario || "Pelo Duelo").slice(0, 300), resolved: false },
    create: { questionId: ultima.perguntaId, userId: req.user.id, reason: motivo, comment: String(comentario || "Pelo Duelo").slice(0, 300) },
  });
  res.json({ ok: true });
}));

export default router;
