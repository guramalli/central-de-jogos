import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getAllRoomsStatus } from "../game/gameManager.js";

const router = Router();

// Status de ocupação de todas as salas do Stop (usado no Lobby).
router.get("/", requireAuth, (req, res) => {
  res.json(getAllRoomsStatus());
});

export default router;
