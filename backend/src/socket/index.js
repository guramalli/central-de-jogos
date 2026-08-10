import { verifyToken } from "../utils/jwt.js";
import { getOrCreateStopRoom, limparSalaPrivadaSeVazia, jogadoresLiberados, cancelarDescarteSala } from "../game/gameManager.js";
import { registrarDiaJogado } from "../game/missoes.js";
import { getOrCreateQuizRoom } from "../game/quizGameManager.js";
import { getOrCreateAcromaniaRoom } from "../game/acromaniaGameManager.js";
import * as generalChat from "../game/generalChat.js";
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

      // Registra em qual plataforma a pessoa está jogando. Não bloqueia a
      // conexão: se falhar, o jogo segue normalmente — é só métrica.
      // Sequência de dias: conta uma vez por dia, na primeira conexão.
      registrarDiaJogado(user.id).catch(() => {});

      const plataforma = socket.handshake.auth?.plataforma;
      if (plataforma === "mobile" || plataforma === "desktop") {
        prisma.user
          .update({
            where: { id: user.id },
            data: { ultimaPlataforma: plataforma, ultimoAcesso: new Date() },
          })
          .catch(() => {});
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
      // Sala privada com senha só aceita quem passou pela conferência na
      // tela de entrada. Sem isso, bastaria ter o link pra furar a senha.
      if (String(roomId || "").startsWith("stop-privada-") && !jogadoresLiberados.has(`${userId}:${roomId}`)) {
        socket.emit("stop-sala-bloqueada", {
          error: "Entre pela lista de salas — essa sala pede senha.",
        });
        return;
      }
      const room = await getOrCreateStopRoom(io, roomId);
      const joined = await room.addPlayer(socket, userId, nickname);
      if (joined) {
        // Entrou: se a sala estava marcada pra ser descartada por estar
        // vazia, cancela o descarte.
        if (room.privada) cancelarDescarteSala(roomId);
        socket.currentRoom = room;
        recheckPeak().catch(() => {});
      }
    });

    socket.on("submit-answers", ({ answers, behavior }) => {
      socket.currentRoom?.submitAnswers(socket, userId, answers, behavior);
    });

    socket.on("stop", () => {
      socket.currentRoom?.playerStop(socket, userId);
    });

    socket.on("vote-skip-intermission", () => {
      socket.currentRoom?.voteSkip(userId);
    });

    // Voto numa palavra de outro jogador (só nas salas privadas, onde a
    // validação é feita pela mesa em vez do glossário).
    // Dono da sala privada dá o start na partida.
    socket.on("iniciar-partida", () => {
      socket.currentRoom?.iniciarPartida?.(userId);
    });

    socket.on("vote-word", ({ targetUserId, themeKey, valido } = {}) => {
      if (!targetUserId || !themeKey) return;
      socket.currentRoom?.submitWordVote?.(userId, targetUserId, themeKey, valido);
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

    // ===== Chat Geral (fora das salas, sempre disponível) =====
    socket.on("join-general-chat", async () => {
      socket.join("general-chat-room");
      generalChat.addConnection(socket, userId, nickname);
      const history = await generalChat.loadHistory();
      socket.emit("general-chat-history", { messages: history });
      io.to("general-chat-room").emit("general-chat-online", { players: generalChat.getOnlineList() });
      socket.inGeneralChat = true;
    });

    socket.on("general-chat-message", async ({ message }) => {
      if (!socket.inGeneralChat || !message?.trim()) return;
      const clean = message.trim().slice(0, 300);
      await generalChat.saveMessage(userId, clean);
      io.to("general-chat-room").emit("general-chat-message", {
        userId,
        nickname,
        message: clean,
        at: Date.now(),
      });
    });

    // ===== Mensagem privada (só entre amigos) =====
    socket.on("join-dm", async ({ friendUserId } = {}) => {
      if (!friendUserId) return;
      const friendship = await prisma.friendship.findFirst({
        where: {
          status: "accepted",
          OR: [
            { userAId: userId, userBId: friendUserId },
            { userAId: friendUserId, userBId: userId },
          ],
        },
      });
      if (!friendship) {
        socket.emit("dm-error", { error: "Vocês precisam ser amigos pra conversar." });
        return;
      }

      const roomId = ["dm", ...[userId, friendUserId].sort()].join(":");
      socket.join(roomId);
      socket.currentDmRoom = roomId;
      socket.currentDmFriendId = friendUserId;

      const history = await prisma.privateMessage.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: friendUserId },
            { senderId: friendUserId, receiverId: userId },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      // Marca como lidas as mensagens que o amigo mandou pra mim.
      await prisma.privateMessage.updateMany({
        where: { senderId: friendUserId, receiverId: userId, read: false },
        data: { read: true },
      });

      socket.emit("dm-history", {
        messages: history.reverse().map((m) => ({
          id: m.id,
          senderId: m.senderId,
          message: m.message,
          at: m.createdAt.getTime(),
        })),
      });
    });

    socket.on("dm-message", async ({ message } = {}) => {
      if (!socket.currentDmRoom || !socket.currentDmFriendId || !message?.trim()) return;
      const clean = message.trim().slice(0, 500);

      // Se o destinatário já estiver com essa conversa aberta agora (tem
      // outro socket na mesma sala de DM), a mensagem já nasce "lida" —
      // evita o avisinho ficar marcado por engano enquanto os dois já
      // estão conversando ao vivo.
      const roomSockets = io.sockets.adapter.rooms.get(socket.currentDmRoom);
      const receiverPresent = roomSockets && [...roomSockets].some((id) => id !== socket.id);

      const saved = await prisma.privateMessage.create({
        data: {
          senderId: userId,
          receiverId: socket.currentDmFriendId,
          message: clean,
          read: !!receiverPresent,
        },
      });
      io.to(socket.currentDmRoom).emit("dm-message", {
        id: saved.id,
        senderId: userId,
        message: clean,
        at: saved.createdAt.getTime(),
      });
    });

    socket.on("disconnect", () => {
      const salaQueSaiu = socket.currentRoom;
      socket.currentRoom?.removePlayer(socket.id);
      // Sala privada vazia é descartada: o código deixa de valer e a sala
      // some da memória, em vez de ficar rodando timer pra ninguém.
      if (salaQueSaiu?.privada) limparSalaPrivadaSeVazia(salaQueSaiu.roomId);
      socket.currentQuizRoom?.removePlayer(socket.id);
      socket.currentAcromaniaRoom?.removePlayer(socket.id);
      if (socket.inGeneralChat) {
        generalChat.removeConnection(socket.id);
        io.to("general-chat-room").emit("general-chat-online", { players: generalChat.getOnlineList() });
      }
    });
  });
}
