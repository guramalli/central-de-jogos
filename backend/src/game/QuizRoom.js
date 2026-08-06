import { prisma } from "../db.js";
import { getQuizRankForPoints } from "../utils/quizRank.js";
import { isBirthdayToday } from "../utils/birthday.js";

const GAME_KEY = "quiz";

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function normalize(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Uma QuizRoom representa uma sala/mesa do jogo Quiz, com um tema fixo.
 * Loop infinito: pergunta -> (alguém acerta OU tempo acaba) -> intervalo -> próxima pergunta.
 */
export class QuizRoom {
  constructor(roomId, io, config = {}) {
    this.roomId = roomId;
    this.io = io;
    this.label = config.label || roomId;
    this.themeKey = config.themeKey;
    this.maxPlayers = config.maxPlayers ?? 10;
    this.questionSeconds = config.questionSeconds ?? 30;
    this.revealIntervalSeconds = config.revealIntervalSeconds ?? 5;
    this.intermissionSeconds = config.intermissionSeconds ?? 8;
    this.pointsPerCorrect = config.pointsPerCorrect ?? 10;
    this.roomGameKey = `${GAME_KEY}:${roomId}`;

    this.players = new Map(); // socketId -> { userId, nickname, socket }
    this.lifetimeCache = new Map();
    this.roomLifetimeCache = new Map();

    this.state = "intermission"; // intermission | active
    this.currentQuestion = null; // { id, question, answer }
    this.revealedIndices = new Set(); // posições (índices) já reveladas na resposta atual
    this.timeLeft = 0;
    this.timer = null;
    this.revealTimer = null;
    this.usedQuestionIds = new Set(); // evita repetir pergunta enquanto o banco tiver opções

    this.startIntermission();
  }

  broadcast(event, payload) {
    this.io.to(this.roomId).emit(event, payload);
  }

  countUniquePlayers() {
    return new Set([...this.players.values()].map((p) => p.userId)).size;
  }

  async addPlayer(socket, userId, nickname) {
    const alreadyInRoom = [...this.players.values()].some((p) => p.userId === userId);
    if (!alreadyInRoom && this.countUniquePlayers() >= this.maxPlayers) {
      socket.emit("quiz-room-full", { roomLabel: this.label, maxPlayers: this.maxPlayers });
      return false;
    }

    for (const [oldSocketId, p] of this.players.entries()) {
      if (p.userId === userId && oldSocketId !== socket.id) {
        this.players.delete(oldSocketId);
      }
    }
    this.players.set(socket.id, { userId, nickname, socket });

    if (!this.lifetimeCache.has(userId)) {
      const existing = await prisma.lifetimeScore.findUnique({
        where: { userId_gameKey: { userId, gameKey: GAME_KEY } },
      });
      this.lifetimeCache.set(userId, existing?.points || 0);
    }
    if (!this.roomLifetimeCache.has(userId)) {
      const existingRoom = await prisma.lifetimeScore.findUnique({
        where: { userId_gameKey: { userId, gameKey: this.roomGameKey } },
      });
      this.roomLifetimeCache.set(userId, existingRoom?.points || 0);
    }

    socket.join(this.roomId);
    socket.emit("quiz-room-state", this.publicState());
    if (!alreadyInRoom) {
      this.systemMessage(`👋 ${nickname} entrou na sala.`);

      // Se for aniversário de quem acabou de entrar, todo mundo vê os parabéns.
      try {
        const me = await prisma.user.findUnique({ where: { id: userId }, select: { birthDate: true } });
        if (isBirthdayToday(me?.birthDate)) {
          this.systemMessage(`🎉🎂 Hoje é aniversário de ${nickname}! Parabéns! 🎂🎉`, true, true);
        }
      } catch {
        // não deixa uma falha aqui atrapalhar a entrada na sala
      }
    }

    await this.broadcastOnlinePlayers();
    return true;
  }

  async removePlayer(socketId) {
    const leaving = this.players.get(socketId);
    this.players.delete(socketId);
    if (leaving) {
      const stillConnected = [...this.players.values()].some((p) => p.userId === leaving.userId);
      if (!stillConnected) this.systemMessage(`🚪 ${leaving.nickname} saiu da sala.`);
    }
    await this.broadcastOnlinePlayers();
  }

  async broadcastOnlinePlayers() {
    const seen = new Set();
    const list = [];
    for (const p of this.players.values()) {
      if (seen.has(p.userId)) continue;
      seen.add(p.userId);
      const lifetimePoints = this.lifetimeCache.get(p.userId) || 0;
      const roomLifetimePoints = this.roomLifetimeCache.get(p.userId) || 0;
      list.push({
        userId: p.userId,
        nickname: p.nickname,
        lifetimePoints,
        roomLifetimePoints,
        rank: getQuizRankForPoints(lifetimePoints),
      });
    }
    list.sort((a, b) => b.roomLifetimePoints - a.roomLifetimePoints);
    this.broadcast("quiz-players-online", { players: list });
  }

  publicState() {
    return {
      roomId: this.roomId,
      label: this.label,
      themeKey: this.themeKey,
      state: this.state,
      timeLeft: this.timeLeft,
      question: this.currentQuestion ? this.currentQuestion.question : null,
      masked: this.currentQuestion ? this.getMaskedAnswer() : null,
    };
  }

  clearTimers() {
    if (this.timer) clearInterval(this.timer);
    if (this.revealTimer) clearInterval(this.revealTimer);
    this.timer = null;
    this.revealTimer = null;
  }

  systemMessage(message, bold = false, success = false) {
    this.broadcast("quiz-chat-message", { userId: null, nickname: "Sistema", message, system: true, bold, success, at: Date.now() });
  }

  chatMessage(userId, nickname, message) {
    this.broadcast("quiz-chat-message", { userId, nickname, message, at: Date.now() });
  }

  startIntermission() {
    this.clearTimers();
    this.state = "intermission";
    this.currentQuestion = null;
    this.timeLeft = this.intermissionSeconds;
    this.broadcast("quiz-intermission", { seconds: this.intermissionSeconds });

    this.timer = setInterval(() => {
      this.timeLeft -= 1;
      this.broadcast("quiz-tick", { state: this.state, timeLeft: this.timeLeft });
      if (this.timeLeft <= 0) this.startQuestion();
    }, 1000);
  }

  async pickQuestion() {
    const where = { themeKey: this.themeKey, status: "approved" };
    const total = await prisma.quizQuestion.count({ where });
    if (total === 0) return null;

    // Evita repetir enquanto ainda houver perguntas não usadas nessa "volta".
    if (this.usedQuestionIds.size >= total) this.usedQuestionIds = new Set();

    let question = null;
    for (let tries = 0; tries < 20 && !question; tries++) {
      const skip = Math.floor(Math.random() * total);
      const [candidate] = await prisma.quizQuestion.findMany({
        where,
        skip,
        take: 1,
      });
      if (candidate && !this.usedQuestionIds.has(candidate.id)) question = candidate;
    }
    if (question) this.usedQuestionIds.add(question.id);
    return question;
  }

  // Índices (posições) da resposta que contam como "letra" — espaços e
  // pontuação não são escondidos nem contam pro limite de 50%.
  letterIndices() {
    const answer = this.currentQuestion.answer;
    const indices = [];
    for (let i = 0; i < answer.length; i++) {
      if (/[a-zA-ZÀ-ÿ0-9]/.test(answer[i])) indices.push(i);
    }
    return indices;
  }

  getMaskedAnswer() {
    const answer = this.currentQuestion.answer;
    return answer
      .split("")
      .map((ch, i) => {
        if (!/[a-zA-ZÀ-ÿ0-9]/.test(ch)) return ch; // espaço/pontuação sempre visível
        return this.revealedIndices.has(i) ? ch : "*";
      })
      .join("");
  }

  async startQuestion() {
    this.clearTimers();
    const question = await this.pickQuestion();

    if (!question) {
      // Sem perguntas cadastradas pro tema — avisa e tenta de novo mais tarde.
      this.systemMessage("⚠️ Nenhuma pergunta cadastrada pra esse tema ainda.");
      this.startIntermission();
      return;
    }

    this.state = "active";
    this.currentQuestion = question;
    this.revealedIndices = new Set();
    this.timeLeft = this.questionSeconds;
    this.questionStartedAt = Date.now();

    this.broadcast("quiz-question-start", {
      question: question.question,
      masked: this.getMaskedAnswer(),
      seconds: this.questionSeconds,
    });

    this.timer = setInterval(() => {
      this.timeLeft -= 1;
      this.broadcast("quiz-tick", { state: this.state, timeLeft: this.timeLeft });
      if (this.timeLeft <= 0) this.endQuestion(null);
    }, 1000);

    // Revela mais uma letra a cada X segundos, nunca passando de 50% do total.
    this.revealTimer = setInterval(() => {
      const indices = this.letterIndices();
      const maxReveal = Math.floor(indices.length * 0.5);
      const hidden = indices.filter((i) => !this.revealedIndices.has(i));
      if (this.revealedIndices.size >= maxReveal || hidden.length === 0) return;
      const pick = hidden[Math.floor(Math.random() * hidden.length)];
      this.revealedIndices.add(pick);
      this.broadcast("quiz-reveal-update", { masked: this.getMaskedAnswer() });
    }, this.revealIntervalSeconds * 1000);
  }

  async submitGuess(socket, userId, nickname, guess) {
    if (this.state !== "active" || !this.currentQuestion) return;
    if (normalize(guess) !== normalize(this.currentQuestion.answer)) {
      socket.emit("quiz-guess-wrong", {});
      this.broadcast("quiz-wrong-log", { guess: guess.trim(), at: Date.now() });
      return;
    }
    await this.endQuestion({ userId, nickname });
  }

  // winner = { userId, nickname } | null (null = ninguém acertou, tempo esgotou)
  async endQuestion(winner) {
    if (this.state !== "active") return;
    this.clearTimers();
    const question = this.currentQuestion;
    const monthKey = currentMonthKey();

    try {
      if (winner) {
        const pts = this.pointsPerCorrect;
        const elapsedSeconds = this.questionStartedAt
          ? Math.max(0, Math.round((Date.now() - this.questionStartedAt) / 1000))
          : null;

        let celebration = "";
        try {
          const winnerUser = await prisma.user.findUnique({
            where: { id: winner.userId },
            select: { celebration: true },
          });
          celebration = winnerUser?.celebration || "";
        } catch {
          // sem comemoração cadastrada, segue sem ela
        }

        try {
          await prisma.monthlyScore.upsert({
            where: { userId_gameKey_monthKey: { userId: winner.userId, gameKey: GAME_KEY, monthKey } },
            update: { points: { increment: pts } },
            create: { userId: winner.userId, gameKey: GAME_KEY, monthKey, points: pts },
          });
          await prisma.lifetimeScore.upsert({
            where: { userId_gameKey: { userId: winner.userId, gameKey: GAME_KEY } },
            update: { points: { increment: pts } },
            create: { userId: winner.userId, gameKey: GAME_KEY, points: pts },
          });
          this.lifetimeCache.set(winner.userId, (this.lifetimeCache.get(winner.userId) || 0) + pts);

          await prisma.lifetimeScore.upsert({
            where: { userId_gameKey: { userId: winner.userId, gameKey: this.roomGameKey } },
            update: { points: { increment: pts } },
            create: { userId: winner.userId, gameKey: this.roomGameKey, points: pts },
          });
          this.roomLifetimeCache.set(winner.userId, (this.roomLifetimeCache.get(winner.userId) || 0) + pts);
        } catch (err) {
          console.error("Falha ao salvar pontuação do Quiz para", winner.userId, err.message);
        }

        this.broadcast("quiz-question-result", {
          winner: winner.nickname,
          answer: question.answer,
          points: pts,
          elapsedSeconds,
          celebration,
        });

        const celebrationText = celebration ? ` "${celebration}"` : "";
        const timeText = elapsedSeconds !== null ? ` em ${elapsedSeconds}s` : "";
        this.systemMessage(
          `✅ ${winner.nickname} acertou${timeText}!${celebrationText} A resposta era "${question.answer}" (+${pts} pts)`,
          true,
          true // success = true -> aparece em verde no chat
        );
        await this.broadcastOnlinePlayers();
      } else {
        this.broadcast("quiz-question-result", { winner: null, answer: null });
        this.systemMessage("⏰ Ninguém acertou dessa vez. Próxima pergunta!");
      }
    } catch (err) {
      console.error(`Erro ao encerrar pergunta na sala ${this.roomId}:`, err);
    } finally {
      this.startIntermission();
    }
  }
}
