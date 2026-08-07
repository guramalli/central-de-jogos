import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getAllAcromaniaRoomsStatus } from "../game/acromaniaGameManager.js";

const router = Router();

router.get("/", requireAuth, (req, res) => {
  res.json(getAllAcromaniaRoomsStatus());
});

export default router;
