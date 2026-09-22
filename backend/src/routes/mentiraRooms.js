import { Router } from "express";
import { statusSalasAbertas } from "../mentira/socketMentira.js";

// Lobby do Mentira Sincera: as salas abertas e quantas pessoas há em cada uma.
const router = Router();
router.get("/", (_req, res) => res.json(statusSalasAbertas()));
export default router;
