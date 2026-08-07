import { verifyToken } from "../utils/jwt.js";
import { getOrCreateStopRoom } from "../game/gameManager.js";
import { getOrCreateQuizRoom } from "../game/quizGameManager.js";
import { getOrCreateAcromaniaRoom } from "../game/acromaniaGameManager.js";
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
      // pontuação para um userId que não existe mais. Também bloqueia quem
      // foi banido depois de já ter feito login (o token continuaria válido).
      const user = await prisma.user.findUnique({ where: { id: payload.id }, select: { id: true, banned: true } });
      if (!user || user.banned) {
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

    // ===== Acromania =====
    socket.on("join-acromania-room", async ({ roomId } = {}) => {
      const room = await getOrCreateAcromaniaRoom(io, roomId);
      const joined = await room.addPlayer(socket, userId, nickname);
      if (joined) {
        socket.currentAcromaniaRoom = room;
        recheckPeak().catch(() => {});
      }
    });

    socket.on("acromania-submit-phrase", ({ phrase }) => {
      socket.currentAcromaniaRoom?.submitPhrase(socket, userId, phrase || "");
    });

    socket.on("acromania-vote", ({ entryId }) => {
      socket.currentAcromaniaRoom?.vote(socket, userId, entryId);
    });

    socket.on("acromania-chat-message", ({ message }) => {
      if (!message?.trim()) return;
      socket.currentAcromaniaRoom?.chatMessage(userId, nickname, message.trim().slice(0, 300));
    });

    socket.on("disconnect", () => {
      socket.currentRoom?.removePlayer(socket.id);
      socket.currentQuizRoom?.removePlayer(socket.id);
      socket.currentAcromaniaRoom?.removePlayer(socket.id);
    });
  });
}
