import { Router } from "express";
import { statusSalasAbertasTribunal } from "../tribunal/socketTribunal.js";

// Lobby do Tribunal: as salas abertas e quantas pessoas há em cada uma.
const router = Router();
router.get("/", (_req, res) => res.json(statusSalasAbertasTribunal()));
export default router;
