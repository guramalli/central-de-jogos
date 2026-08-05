import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getAllQuizRoomsStatus } from "../game/quizGameManager.js";

const router = Router();

router.get("/", requireAuth, (req, res) => {
  res.json(getAllQuizRoomsStatus());
});

export default router;
