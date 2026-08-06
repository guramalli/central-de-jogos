import { verifyToken } from "../utils/jwt.js";
import { getOrCreateStopRoom } from "../game/gameManager.js";
import { getOrCreateQuizRoom } from "../game/quizGameManager.js";
import { recheckPeak } from "../game/platformStats.js";
import { prisma } from "../db.js";

export function setupSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const payload = verifyToken(token);

      // Confere se o usuário do token ainda existe de verdade no banco —
      // evita "fantasmas" (tokens antigos de antes de um reset de banco, por
      // exemplo) entrarem na sala e derrubarem o servidor ao tentar salvar
      // pontuação para um userId que não existe mais.
      const user = await prisma.user.findUnique({ where: { id: payload.id }, select: { id: true } });
      if (!user) {
        return next(new Error("SESSAO_INVALIDA"));
      }

      socket.user = payload;
      next();
    } catch {
      next(new Error("Autenticação inválida."));
    }
  });

  io.on("connection", async (socket) => {
    const { id: userId, nickname } = socket.user;

    socket.on("join-stop-room", async ({ roomId } = {}) => {
      const room = await getOrCreateStopRoom(io, roomId);
      const joined = await room.addPlayer(socket, userId, nickname);
      if (joined) {
        socket.currentRoom = room;
        recheckPeak().catch(() => {});
      }
    });

    socket.on("submit-answers", ({ answers }) => {
      socket.currentRoom?.submitAnswers(socket, userId, answers);
    });

    socket.on("stop", () => {
      socket.currentRoom?.playerStop(socket, userId);
    });

    socket.on("vote-skip-intermission", () => {
      socket.currentRoom?.voteSkip(userId);
    });

    socket.on("chat-message", ({ message }) => {
      if (!message?.trim()) return;
      socket.currentRoom?.chatMessage(userId, nickname, message.trim().slice(0, 300));
    });

    // ===== Quiz =====
    socket.on("join-quiz-room", async ({ roomId } = {}) => {
      const room = await getOrCreateQuizRoom(io, roomId);
      const joined = await room.addPlayer(socket, userId, nickname);
      if (joined) {
        socket.currentQuizRoom = room;
        recheckPeak().catch(() => {});
      }
    });

    socket.on("quiz-submit-guess", ({ guess }) => {
      socket.currentQuizRoom?.submitGuess(socket, userId, nickname, guess || "");
    });

    socket.on("quiz-chat-message", ({ message }) => {
      if (!message?.trim()) return;
      socket.currentQuizRoom?.chatMessage(userId, nickname, message.trim().slice(0, 300));
    });

    socket.on("disconnect", () => {
      socket.currentRoom?.removePlayer(socket.id);
      socket.currentQuizRoom?.removePlayer(socket.id);
    });
  });
}
