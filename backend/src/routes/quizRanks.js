import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { QUIZ_RANKS } from "../utils/quizRank.js";

const router = Router();

router.get("/", requireAuth, (req, res) => {
  res.json(QUIZ_RANKS);
});

export default router;
