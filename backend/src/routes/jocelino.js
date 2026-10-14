// ===== Família Santos: Tijolo e Tempero (jogo em frontend/public/jocelino/) — SAVE NA CONTA =====
// Montado em /api/jocelino. Tabela própria: JocelinoSave (prisma/schema.prisma; SQL em prisma/sql/20261014_jocelino_save.sql).
// Antes do "prisma db push" a tabela não existe: as rotas respondem 503 e o jogo segue só com o save do navegador.
//
//   GET /save       → { dados, dia, atualizadoEm } ou 404 (sem save ainda)
//   GET /save/meta  → { dia, atualizadoEm } ou 404 — o jogo consulta isto ao abrir, sem baixar o save inteiro
//   PUT /save       ← { dados, dia, salvoEm, sessao, fechando } — as MESMAS regras do save do Lenda
//                     (lenda/saveNuvem.js: fila por conta, 10 s entre envios, "fechando", 409 para envio velho)
import { Router } from "express";
import { prisma as prismaReal } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { criaGuardaSave, criaPutSave } from "../lenda/saveNuvem.js";
import { validarSaveJocelino } from "../jocelino/validar.js";

const FORA = "O save na conta ainda não está ligado no servidor. O jogo continua salvando neste computador.";
// tabela ainda não criada (P2021) ou banco fora do ar: 503, nunca 500
const rota = (fn) => async (req, res) => {
  try { await fn(req, res); } catch (e) {
    if (!res.headersSent) res.status(503).json({ error: e && e.code === "P2021" ? FORA : "O save na conta volta em instantes." });
  }
};

export function criaRotasJocelino({ prisma = prismaReal, auth = requireAuth, guarda = criaGuardaSave() } = {}) {
  const r = Router();
  r.use(auth);

  r.get("/save", rota(async (req, res) => {
    const s = await prisma.jocelinoSave.findUnique({ where: { userId: req.user.id }, select: { dados: true, dia: true, atualizadoEm: true } });
    if (!s) return res.status(404).json({ error: "Nenhum save na conta ainda." });
    res.json({ dados: s.dados, dia: s.dia, atualizadoEm: s.atualizadoEm });
  }));

  r.get("/save/meta", rota(async (req, res) => {
    const s = await prisma.jocelinoSave.findUnique({ where: { userId: req.user.id }, select: { dia: true, atualizadoEm: true } });
    if (!s) return res.status(404).json({ error: "Nenhum save na conta ainda." });
    res.json({ dia: s.dia, atualizadoEm: s.atualizadoEm });
  }));

  r.put("/save", rota(criaPutSave({ prisma, guarda, tabela: "jocelinoSave", validar: validarSaveJocelino, campo: "dia" })));

  return r;
}

export default criaRotasJocelino();
