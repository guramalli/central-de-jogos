import { verifyToken } from "../utils/jwt.js";
import { cacheInvalidar } from "../utils/cache.js";
import { getOrCreateStopRoom, limparSalaPrivadaSeVazia, jogadoresLiberados, cancelarDescarteSala } from "../game/gameManager.js";
import { registrarDiaJogado } from "../game/missoes.js";
import { getOrCreateQuizRoom } from "../game/quizGameManager.js";
import { getOrCreateAcromaniaRoom } from "../game/acromaniaGameManager.js";
import * as generalChat from "../game/generalChat.js";
import * as presence from "../game/presence.js";
import { recheckPeak } from "../game/platformStats.js";
import { prisma } from "../db.js";

export function setupSocket(io) {
  // ===== Amortecedor de consultas por conexão =====
  // Com a presença global, o socket reconecta a cada navegação entre
  // páginas. Sem amortecedor, CADA reconexão faria 2 leituras + 1 escrita
  // no banco (conferir usuário/banimento, streak do dia, plataforma) — e o
  // Neon cobra por tempo de banco acordado. Este Map em memória lembra o
  // que já foi conferido/gravado há pouco e pula as idas repetidas.
  const conexoesRecentes = new Map(); // userId -> { authOkAte, plataformaEm, diaJogadoEm }
  const AUTH_CACHE_MS = 60 * 1000; // reconferir usuário/banimento a cada 1 min no máximo
  const PLATAFORMA_CADA_MS = 30 * 60 * 1000; // regravar plataforma a cada 30 min no máximo
  const DIA_JOGADO_CADA_MS = 6 * 60 * 60 * 1000; // streak: conferir no máximo a cada 6h (a função já é diária)

  // Limpeza horária pra o Map não crescer pra sempre.
  setInterval(() => {
    const agora = Date.now();
    for (const [id, info] of conexoesRecentes.entries()) {
      if ((info.plataformaEm || 0) < agora - 24 * 60 * 60 * 1000 && (info.authOkAte || 0) < agora) {
        conexoesRecentes.delete(id);
      }
    }
  }, 60 * 60 * 1000).unref?.();

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const payload = verifyToken(token);

      const agora = Date.now();
      const recente = conexoesRecentes.get(payload.id) || {};

      // Confere se o usuário do token ainda existe de verdade no banco —
      // evita "fantasmas" (tokens antigos de antes de um reset de banco, por
      // exemplo) entrarem na sala e derrubarem o servidor ao tentar salvar
      // pontuação para um userId que não existe mais. Também bloqueia quem
      // foi banido depois de já ter feito login (o token continuaria válido).
      // Só o resultado POSITIVO fica em cache (1 min): reconexões de
      // navegação não repetem a consulta, e um banimento passa a valer em
      // novas conexões em no máximo 1 minuto.
      if (!(recente.authOkAte > agora)) {
        // `tituloExibido` entra de carona nesta consulta que já acontecia:
        // é usado na mensagem de entrada na sala e, vindo junto do cache de
        // autenticação, não custa NENHUMA query nova. O preço é que trocar
        // de título leva até AUTH_CACHE_MS pra refletir na mensagem — a
        // mesma janela que um banimento já tem.
        const user = await prisma.user.findUnique({
          where: { id: payload.id },
          select: { id: true, banned: true, tituloExibido: true },
        });
        if (!user || user.banned) {
          return next(new Error("SESSAO_INVALIDA"));
        }
        recente.tituloExibido = user.tituloExibido || null;
        recente.authOkAte = agora + AUTH_CACHE_MS;
      }

      // Registra em qual plataforma a pessoa está jogando. Não bloqueia a
      // conexão: se falhar, o jogo segue normalmente — é só métrica.
      // Sequência de dias: conta uma vez por dia, na primeira conexão.
      if (!(recente.diaJogadoEm > agora - DIA_JOGADO_CADA_MS)) {
        recente.diaJogadoEm = agora;
        registrarDiaJogado(payload.id).catch(() => {});
      }

      const plataforma = socket.handshake.auth?.plataforma;
      if ((plataforma === "mobile" || plataforma === "desktop") && !(recente.plataformaEm > agora - PLATAFORMA_CADA_MS)) {
        recente.plataformaEm = agora;
        prisma.user
          .update({
            where: { id: payload.id },
            data: { ultimaPlataforma: plataforma, ultimoAcesso: new Date() },
          })
          .catch(() => {});
      }

      conexoesRecentes.set(payload.id, recente);

      socket.user = payload;
      // Fica no socket pra as salas lerem sem consultar o banco na entrada.
      socket.tituloExibido = recente.tituloExibido || null;
      next();
    } catch {
      next(new Error("Autenticação inválida."));
    }
  });

  io.on("connection", async (socket) => {
    const { id: userId, nickname } = socket.user;

    // Toda conexão autenticada conta como "no site" — independente da
    // página. É daqui que o painel admin tira quem está online.
    presence.addConnection(socket, userId, nickname);

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
      // Corta o palpite no portão, como já era feito com as mensagens de
      // chat. O texto é retransmitido pra sala INTEIRA no log de respostas,
      // então sem limite um cliente adulterado podia mandar uma string
      // gigante e o servidor a multiplicava por todo mundo na sala.
      // 100 caracteres passam longe de qualquer resposta legítima.
      const limpo = typeof guess === "string" ? guess.slice(0, 100) : "";
      socket.currentQuizRoom?.submitGuess(socket, userId, nickname, limpo);
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

      // Intervalo mínimo entre mensagens da praça.
      //
      // Diferente dos chats de sala (que são só retransmissão), CADA
      // mensagem daqui vira uma ESCRITA no Neon — e o Neon cobra por tempo
      // de banco acordado. O limite de requisições do Express protege só as
      // rotas /api; conexões de socket não passam por ele. Sem este freio,
      // um cliente adulterado podia gravar milhares de linhas por minuto.
      //
      // 700ms é folgado pra conversa humana (ninguém digita mais rápido que
      // isso) e ainda assim fecha a porta pra script.
      const agora = Date.now();
      if (socket.ultimaMsgGeral && agora - socket.ultimaMsgGeral < 700) return;
      socket.ultimaMsgGeral = agora;

      const clean = message.trim().slice(0, 300);
      const salva = await generalChat.saveMessage(userId, clean);
      io.to("general-chat-room").emit("general-chat-message", {
        id: salva.id,
        userId,
        nickname,
        message: clean,
        at: Date.now(),
      });
    });

    // ===== Moderação de chat (MODERATOR e ADMIN) =====
    // Apaga uma mensagem de qualquer chat: praça (geral), Stop, Quiz ou
    // Acromania. O cargo vem do banco na hora, e não do token, porque o
    // token dura 7 dias — alguém rebaixado hoje não pode continuar
    // moderando com um token emitido antes.
    socket.on("delete-chat-message", async ({ escopo, id } = {}) => {
      if (!id || !escopo) return;
      const quem = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (!quem || (quem.role !== "ADMIN" && quem.role !== "MODERATOR")) {
        socket.emit("chat-moderation-error", { error: "Você não tem permissão pra apagar mensagens." });
        return;
      }

      if (escopo === "geral") {
        await generalChat.deleteMessage(id);
        io.to("general-chat-room").emit("chat-message-deleted", { id });
      } else if (escopo === "stop") {
        socket.currentRoom?.apagarMensagem(id);
      } else if (escopo === "quiz") {
        socket.currentQuizRoom?.apagarMensagem(id);
      } else if (escopo === "acromania") {
        socket.currentAcromaniaRoom?.apagarMensagem(id);
      }
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
      // Zera o cache de avisos: as mensagens acabaram de virar "lidas",
      // e sem isso o avisinho do menu continuaria com o número velho.
      cacheInvalidar(`avisos:${userId}`);
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
      // Quem recebeu tem uma mensagem nova: limpa o cache dele pra o
      // avisinho aparecer no próximo ciclo, e não só quando o cache expirar.
      cacheInvalidar(`avisos:${socket.currentDmFriendId}`);
      io.to(socket.currentDmRoom).emit("dm-message", {
        id: saved.id,
        senderId: userId,
        message: clean,
        at: saved.createdAt.getTime(),
      });
    });

    socket.on("disconnect", () => {
      presence.removeConnection(socket.id);
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
