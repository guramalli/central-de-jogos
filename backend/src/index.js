import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import rankingRoutes from "./routes/ranking.js";
import glossaryRoutes from "./routes/glossary.js";
import adminRoutes from "./routes/admin.js";
import roomsRoutes from "./routes/rooms.js";
import clansRoutes from "./routes/clans.js";
import quizRoomsRoutes from "./routes/quizRooms.js";
import acromaniaRoomsRoutes from "./routes/acromaniaRooms.js";
import quizQuestionsRoutes from "./routes/quizQuestions.js";
import feedbackRoutes from "./routes/feedback.js";
import ranksRoutes from "./routes/ranks.js";
import platformStatsRoutes from "./routes/platformStats.js";
import quizRanksRoutes from "./routes/quizRanks.js";
import { setupSocket } from "./socket/index.js";

const app = express();
const server = createServer(app);

const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ranking", rankingRoutes);
app.use("/api/glossary", glossaryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/rooms", roomsRoutes);
app.use("/api/clans", clansRoutes);
app.use("/api/quiz-rooms", quizRoomsRoutes);
app.use("/api/acromania-rooms", acromaniaRoomsRoutes);
app.use("/api/quiz-questions", quizQuestionsRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/ranks", ranksRoutes);
app.use("/api/platform-stats", platformStatsRoutes);
app.use("/api/quiz-ranks", quizRanksRoutes);

const io = new Server(server, {
  cors: { origin: CORS_ORIGIN },
});
setupSocket(io);

// Rede de segurança: um erro assíncrono não tratado em algum lugar não
// esperado não deve derrubar o servidor inteiro — só registra no log.
process.on("unhandledRejection", (reason) => {
  console.error("Erro não tratado (unhandledRejection):", reason);
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Educação Gamer backend rodando em http://localhost:${PORT}`);
});
