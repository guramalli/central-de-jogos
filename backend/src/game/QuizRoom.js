import { prisma } from "../db.js";
import { getQuizRankForPoints } from "../utils/quizRank.js";
import { isBirthdayToday } from "../utils/birthday.js";
import { trackPlaytime } from "./playtimeTracker.js";
import { currentMonthKey } from "../utils/monthKey.js";

const GAME_KEY = "quiz";

// Ordinal feminino em português (concorda com "resposta"): 1ª, 2ª, 3ª...
function ordinalFem(n) {
  return `${n}ª`;
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
    this.themeKey = config.themeKey; // se definido, filtra por tema específico
    this.difficultyFilter = config.difficultyFilter; // se definido, filtra por dificuldade (qualquer tema)
    this.maxPlayers = config.maxPlayers ?? 10;
    this.questionSeconds = config.questionSeconds ?? 30;
    this.revealIntervalSeconds = config.revealIntervalSeconds ?? 5;
    this.maxRevealPercent = config.maxRevealPercent ?? 0.5;
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

    // Sequência de respostas certas seguidas (streak) — quebra se outra
    // pessoa acertar no meio, ou se ninguém acertar uma pergunta.
    this.streakUserId = null;
    this.streakCount = 0;
    this.roomRecord = null; // { userId, nickname, count } | null — carregado sob demanda

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
    this.players.set(socket.id, { userId, nickname, socket, joinedAt: Date.now() });

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
    await this.loadRoomRecord();
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
      trackPlaytime(leaving.userId, leaving.joinedAt);
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
      streakRecord: this.roomRecord,
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
    const where = { status: "approved" };
    if (this.themeKey) where.themeKey = this.themeKey;
    if (this.difficultyFilter) {
      where.difficulty = Array.isArray(this.difficultyFilter)
        ? { in: this.difficultyFilter }
        : this.difficultyFilter;
    }
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

    // Timeout de segurança: se o banco demorar demais pra responder (ex.:
    // "acordando" depois de ficar inativo), desiste depois de 8s em vez de
    // travar o timer da sala pra sempre — tenta de novo no próximo intervalo.
    let question = null;
    try {
      question = await Promise.race([
        this.pickQuestion(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout ao buscar pergunta")), 8000)),
      ]);
    } catch (err) {
      console.error(`Falha ao buscar pergunta na sala ${this.roomId}:`, err.message);
    }

    if (!question) {
      // Sem perguntas cadastradas pro tema (ou o banco demorou demais) —
      // avisa e tenta de novo mais tarde.
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

    // Revela mais uma letra a cada X segundos, nunca passando do limite
    // configurado pra essa sala (salas avançadas revelam menos, pra ficar
    // mais difícil de verdade).
    this.revealTimer = setInterval(() => {
      const indices = this.letterIndices();
      const maxReveal = Math.floor(indices.length * this.maxRevealPercent);
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
  async loadRoomRecord() {
    if (this.roomRecord !== null) return this.roomRecord;
    try {
      const saved = await prisma.quizStreakRecord.findUnique({ where: { roomId: this.roomId } });
      this.roomRecord = saved || { userId: null, nickname: null, count: 0 };
    } catch (err) {
      console.error("Falha ao carregar recorde de sequência da sala", this.roomId, err.message);
      this.roomRecord = { userId: null, nickname: null, count: 0 };
    }
    return this.roomRecord;
  }

  async saveRoomRecord(userId, nickname, count) {
    this.roomRecord = { userId, nickname, count };
    try {
      await prisma.quizStreakRecord.upsert({
        where: { roomId: this.roomId },
        update: { userId, nickname, count },
        create: { roomId: this.roomId, userId, nickname, count },
      });
    } catch (err) {
      console.error("Falha ao salvar recorde de sequência da sala", this.roomId, err.message);
    }
  }

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

        // Sequência de respostas certas seguidas (streak) — só anuncia a
        // partir da 2ª seguida (a 1ª sozinha não é bem uma "sequência" ainda).
        if (this.streakUserId === winner.userId) {
          this.streakCount += 1;
        } else {
          this.streakUserId = winner.userId;
          this.streakCount = 1;
        }
        if (this.streakCount >= 2) {
          const record = await this.loadRoomRecord();
          const brokeRecord = this.streakCount > (record.count || 0);
          if (brokeRecord) {
            await this.saveRoomRecord(winner.userId, winner.nickname, this.streakCount);
            this.broadcast("quiz-streak-record-update", { record: this.roomRecord });
          }
          this.systemMessage(
            `🔥 ${winner.nickname} acertou a ${ordinalFem(this.streakCount)} resposta consecutiva!${
              brokeRecord ? " 🏆 NOVO RECORDE da sala!" : ""
            }`,
            true,
            true
          );
        }

        await this.broadcastOnlinePlayers();
      } else {
        this.broadcast("quiz-question-result", { winner: null, answer: null });
        this.systemMessage("⏰ Ninguém acertou dessa vez. Próxima pergunta!");
        // Ninguém acertou — quebra qualquer sequência em andamento.
        this.streakUserId = null;
        this.streakCount = 0;
      }
    } catch (err) {
      console.error(`Erro ao encerrar pergunta na sala ${this.roomId}:`, err);
    } finally {
      this.startIntermission();
    }
  }
}
