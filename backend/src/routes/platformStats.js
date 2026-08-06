import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getPlatformStats } from "../game/platformStats.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const stats = await getPlatformStats();
  res.json(stats);
});

export default router;
