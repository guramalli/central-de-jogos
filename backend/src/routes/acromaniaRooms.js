import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getAllAcromaniaRoomsStatus } from "../game/acromaniaGameManager.js";
import { acromaniaAtivo } from "../utils/acromaniaAtivo.js";

const router = Router();

router.get("/", requireAuth, (req, res) => {
  // Desligado pelo painel do Render: devolve lista vazia e avisa o motivo.
  // O front usa o campo `ativo` pra mostrar "em manutenção" em vez de ficar
  // eternamente em "Carregando salas...".
  if (!acromaniaAtivo()) {
    return res.json({ ativo: false, rooms: [] });
  }
  res.json({ ativo: true, rooms: getAllAcromaniaRoomsStatus() });
});

export default router;
