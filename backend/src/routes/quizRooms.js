import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getAllQuizRoomsStatus } from "../game/quizGameManager.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  res.json(await getAllQuizRoomsStatus());
});

export default router;
