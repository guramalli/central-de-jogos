import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { ACROMANIA_RANKS } from "../utils/acromaniaRank.js";

const router = Router();

router.get("/", requireAuth, (req, res) => {
  res.json(ACROMANIA_RANKS);
});

export default router;
