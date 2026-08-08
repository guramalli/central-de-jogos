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
    // Quantas letras já aparecem reveladas ASSIM QUE a pergunta começa.
    // Antes, respostas longas ficavam quase impossíveis no início (as letras
    // pingavam de uma em uma, e uma palavra de 15 letras demorava demais pra
    // ficar legível). Agora começa com uma fatia já visível.
    this.initialRevealPercent = config.initialRevealPercent ?? 0.2;
    // Modo turno (arena): em vez de rodar pra sempre, joga N rodadas, monta
    // um ranking do turno e premia os melhores — igual ao bloco do Stop.
    this.roundsPerTurn = config.roundsPerTurn ?? null;
    this.turnBonus = config.turnBonus ?? [50, 30, 15];
    // Modo arena: todo mundo que acertar pontua na mesma pergunta (em vez de
    // só o primeiro). A pergunta segue até o tempo acabar.
    this.multiAnswer = !!config.multiAnswer;
    this.roomGameKey = `${GAME_KEY}:${roomId}`;

    this.players = new Map(); // socketId -> { userId, nickname, socket }
    this.lifetimeCache = new Map();
    this.roomLifetimeCache = new Map();

    this.state = "waiting"; // waiting | intermission | active
    this.currentQuestion = null; // { id, question, answer }
    this.revealedIndices = new Set(); // posições (índices) já reveladas na resposta atual
    this.timeLeft = 0;
    this.timer = null;
    this.revealTimer = null;
    this.usedQuestionIds = new Set(); // evita repetir pergunta enquanto o banco tiver opções

    // Placar do turno atual (só usado quando roundsPerTurn está definido).
    this.turnScores = new Map(); // userId -> pontos no turno
    this.turnRound = 0;
    // Quantas rodadas seguidas ninguém acertou — usado pra narrar no chat
    // ("esta é a 2ª rodada sem acertador"), do jeito que a Central fazia.
    this.roundsWithoutWinner = 0;
    // Última posição no ranking mensal que anunciamos pra cada pessoa —
    // evita repetir o mesmo aviso toda hora.
    this.lastAnnouncedPosition = new Map(); // userId -> posição

    // Quem tentou responder a pergunta atual — zerado a cada pergunta nova.
    this.attemptedThisQuestion = new Set();
    // Quem já acertou a pergunta atual (modo arena) — userId -> { nickname, at }
    this.correctThisQuestion = new Map();

    // Sequência de respostas certas seguidas (streak) — quebra se outra
    // pessoa acertar no meio, ou se ninguém acertar uma pergunta.
    this.streakUserId = null;
    this.streakCount = 0;
    this.roomRecord = null; // { userId, nickname, count } | null — carregado sob demanda

    // Começa parada: só roda pergunta quando alguém entrar. Evita o
    // problema de alguém entrar na sala e cair numa pergunta que já está
    // acabando (com 2 segundos pra responder, por exemplo).
    this.state = "waiting";
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

    // Sala só roda perguntas quando tem gente — assim ninguém entra e cai
    // no meio de uma pergunta que já está acabando.
    if (this.state === "waiting" && this.players.size > 0) {
      this.startIntermission();
    }

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

    // Sala vazia: para o ciclo e volta pro estado de espera, pra não ficar
    // consumindo perguntas e rodando timer à toa.
    if (this.players.size === 0) {
      this.clearTimers();
      this.state = "waiting";
      this.currentQuestion = null;
      this.turnScores = new Map();
      this.turnRound = 0;
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
      questionId: this.currentQuestion ? this.currentQuestion.id : null,
      masked: this.currentQuestion ? this.getMaskedAnswer() : null,
      streakRecord: this.roomRecord,
      turnRound: this.roundsPerTurn ? this.turnRound : null,
      roundsPerTurn: this.roundsPerTurn,
    };
  }

  clearTimers() {
    if (this.timer) clearInterval(this.timer);
    if (this.revealTimer) clearInterval(this.revealTimer);
    this.timer = null;
    this.revealTimer = null;
  }

  systemMessage(message, bold = false, success = false, promotion = false) {
    this.broadcast("quiz-chat-message", { userId: null, nickname: "Sistema", message, system: true, bold, success, promotion, at: Date.now() });
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
    this.attemptedThisQuestion = new Set();
    this.correctThisQuestion = new Map();
    this.timeLeft = this.questionSeconds;
    this.questionStartedAt = Date.now();
    if (this.roundsPerTurn) this.turnRound += 1;

    // Já revela uma fatia das letras de cara. Sem isso, respostas longas
    // ficavam praticamente ilegíveis no começo (as letras pingavam de uma em
    // uma, e uma palavra de 15 letras levava tempo demais pra dar qualquer
    // pista útil). Quanto maior a resposta, mais letras aparecem de início.
    const allIndices = this.letterIndices();
    const initialCount = Math.min(
      Math.floor(allIndices.length * this.initialRevealPercent),
      Math.floor(allIndices.length * this.maxRevealPercent)
    );
    const shuffled = [...allIndices].sort(() => Math.random() - 0.5);
    for (let i = 0; i < initialCount; i++) this.revealedIndices.add(shuffled[i]);

    this.broadcast("quiz-question-start", {
      questionId: question.id,
      question: question.question,
      masked: this.getMaskedAnswer(),
      seconds: this.questionSeconds,
      turnRound: this.roundsPerTurn ? this.turnRound : null,
      roundsPerTurn: this.roundsPerTurn,
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
    // Marca que essa pessoa tentou responder — usado no fim da pergunta pra
    // calcular o aproveitamento (% de acerto) dela nessa sala.
    this.attemptedThisQuestion.add(userId);

    const acertou = normalize(guess) === normalize(this.currentQuestion.answer);

    // Tempo decorrido desde que a pergunta começou, em milissegundos —
    // mostrado no log como "8s 342ms", pra dar aquela sensação de disputa
    // por décimo de segundo.
    const elapsedMs = this.questionStartedAt ? Date.now() - this.questionStartedAt : 0;

    const logEntry = {
      userId,
      nickname,
      guess: guess.trim(),
      correct: acertou,
      elapsedMs,
      at: Date.now(),
    };

    if (this.multiAnswer) {
      // Nas arenas todo mundo pode acertar a mesma pergunta — então o log
      // é PRIVADO: cada pessoa só vê o que ela mesma digitou. Se fosse
      // compartilhado, o acerto de um entregaria a resposta pros outros.
      socket.emit("quiz-answer-log", logEntry);
    } else {
      // Nas salas normais o log é compartilhado: só o primeiro acerto vale,
      // e ver as tentativas dos outros faz parte da graça.
      this.broadcast("quiz-answer-log", logEntry);
    }

    if (!acertou) {
      socket.emit("quiz-guess-wrong", {});
      return;
    }

    // ===== Modo arena: todo mundo que acertar pontua =====
    // A pergunta NÃO termina no primeiro acerto — segue até o tempo acabar,
    // pra dar chance de todos marcarem ponto na mesma rodada.
    if (this.multiAnswer) {
      if (this.correctThisQuestion.has(userId)) return; // já acertou essa

      this.correctThisQuestion.set(userId, { nickname, at: Date.now() });
      this.turnScores.set(userId, (this.turnScores.get(userId) || 0) + 1);

      // A pessoa "comemora" no chat automaticamente — com a frase que ela
      // escolheu no perfil, ou um "Ponto!" padrão se não tiver escolhido.
      const celebration = await this.getCelebration(userId);
      this.broadcast("quiz-chat-message", {
        userId,
        nickname,
        message: celebration || "Ponto!",
        system: false,
        at: Date.now(),
      });

      socket.emit("quiz-guess-correct-multi", { total: this.turnScores.get(userId) });
      this.broadcast("quiz-multi-correct-update", {
        scored: [...this.correctThisQuestion.entries()].map(([id, v]) => ({ userId: id, nickname: v.nickname })),
      });
      return;
    }

    // Modo normal: o primeiro que acerta encerra a pergunta.
    await this.endQuestion({ userId, nickname });
  }

  // Busca a frase de comemoração que a pessoa configurou no perfil.
  async getCelebration(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { celebration: true },
      });
      return user?.celebration || null;
    } catch {
      return null;
    }
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

    // ===== Modo arena: fecha a pergunta premiando todos que acertaram =====
    if (this.multiAnswer) {
      try {
        const scorers = [...this.correctThisQuestion.entries()];

        for (const [userId] of scorers) {
          try {
            await prisma.monthlyScore.upsert({
              where: { userId_gameKey_monthKey: { userId, gameKey: GAME_KEY, monthKey } },
              update: { points: { increment: this.pointsPerCorrect } },
              create: { userId, gameKey: GAME_KEY, monthKey, points: this.pointsPerCorrect },
            });
            await prisma.lifetimeScore.upsert({
              where: { userId_gameKey: { userId, gameKey: GAME_KEY } },
              update: { points: { increment: this.pointsPerCorrect } },
              create: { userId, gameKey: GAME_KEY, points: this.pointsPerCorrect },
            });
            this.lifetimeCache.set(userId, (this.lifetimeCache.get(userId) || 0) + this.pointsPerCorrect);

            // Pontuação específica DESSA sala — é ela que aparece no
            // "Pts Sala" e na lista de jogadores online. Estava faltando,
            // por isso o placar da arena ficava sempre zerado.
            await prisma.lifetimeScore.upsert({
              where: { userId_gameKey: { userId, gameKey: this.roomGameKey } },
              update: { points: { increment: this.pointsPerCorrect } },
              create: { userId, gameKey: this.roomGameKey, points: this.pointsPerCorrect },
            });
            this.roomLifetimeCache.set(
              userId,
              (this.roomLifetimeCache.get(userId) || 0) + this.pointsPerCorrect
            );
          } catch (err) {
            console.error("Falha ao pontuar na arena:", err.message);
          }
        }

        // Manda o ranking acumulado do turno pro painel da pergunta.
        this.broadcast("quiz-question-result", {
          winner: null,
          answer: question.answer,
          arenaScorers: scorers.map(([id, v]) => ({ userId: id, nickname: v.nickname })),
          turnRanking: this.buildTurnRanking(),
        });

        this.systemMessage(`❓ ${question.question}`);

        // Narra a "seca" quando ninguém acerta várias seguidas.
        if (scorers.length === 0) {
          this.roundsWithoutWinner += 1;
          if (this.roundsWithoutWinner >= 2) {
            this.systemMessage(
              `😶 Essa é a ${this.roundsWithoutWinner}ª rodada seguida sem ninguém acertar. Quem quebra a seca?`
            );
          }
        } else {
          this.roundsWithoutWinner = 0;
          // Anuncia a posição no ranking mensal de quem pontuou (a cada 10
          // rodadas, pra não poluir demais numa sala tão rápida).
          if (this.turnRound % 10 === 0) {
            for (const [userId, v] of scorers) {
              await this.announceRankingPosition(userId, v.nickname);
            }
          }
        }

        await this.recordArenaStats();
        await this.broadcastOnlinePlayers();
      } catch (err) {
        console.error(`Erro ao encerrar pergunta na arena ${this.roomId}:`, err);
      } finally {
        if (this.roundsPerTurn && this.turnRound >= this.roundsPerTurn) {
          await this.finishTurn();
        }
        this.startIntermission();
      }
      return;
    }

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
          // Busca os pontos mensais ANTES de somar, pra comparar a patente
          // de antes com a de depois — patente é conceito mensal, então é
          // essa pontuação que decide se a pessoa subiu de nível agora.
          const existingMonthly = await prisma.monthlyScore.findUnique({
            where: { userId_gameKey_monthKey: { userId: winner.userId, gameKey: GAME_KEY, monthKey } },
          });
          const oldMonthlyPoints = existingMonthly?.points || 0;
          const newMonthlyPoints = oldMonthlyPoints + pts;

          await prisma.monthlyScore.upsert({
            where: { userId_gameKey_monthKey: { userId: winner.userId, gameKey: GAME_KEY, monthKey } },
            update: { points: { increment: pts } },
            create: { userId: winner.userId, gameKey: GAME_KEY, monthKey, points: pts },
          });

          const oldRank = getQuizRankForPoints(oldMonthlyPoints);
          const newRank = getQuizRankForPoints(newMonthlyPoints);
          if (oldRank.key !== newRank.key) {
            this.systemMessage(`"${winner.nickname}" você foi promovido para ${newRank.name}.`, false, false, true);
          }

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

        // Teve acertador — zera a contagem de rodadas "secas".
        this.roundsWithoutWinner = 0;

        this.broadcast("quiz-question-result", {
          winner: winner.nickname,
          answer: question.answer,
          points: pts,
          elapsedSeconds,
          celebration,
        });

        const timeText = elapsedSeconds !== null ? ` em ${elapsedSeconds}s` : "";
        this.systemMessage(
          `✅ ${winner.nickname} acertou${timeText}! A resposta era "${question.answer}" (+${pts} pts)`,
          true,
          true // success = true -> aparece em verde no chat
        );

        // A pessoa "comemora" no chat automaticamente, no nome dela — com a
        // frase que escolheu no perfil, ou um "Ponto!" padrão se ainda não
        // configurou nenhuma. Mesmo comportamento das arenas.
        this.broadcast("quiz-chat-message", {
          userId: winner.userId,
          nickname: winner.nickname,
          message: celebration || "Ponto!",
          system: false,
          at: Date.now(),
        });

        // Placar do turno (modo arena) — 1 ponto por acerto, independente
        // da pontuação normal da sala.
        if (this.roundsPerTurn) {
          this.turnScores.set(winner.userId, (this.turnScores.get(winner.userId) || 0) + 1);
        }

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

        await this.announceRankingPosition(winner.userId, winner.nickname);
        await this.broadcastOnlinePlayers();
      } else {
        this.broadcast("quiz-question-result", { winner: null, answer: question.answer });
        // Ninguém acertou — quebra qualquer sequência em andamento.
        this.streakUserId = null;
        this.streakCount = 0;
        this.roundsWithoutWinner += 1;

        // Narra a "seca" quando ela começa a ficar relevante — a partir da
        // 2ª rodada seguida sem ninguém acertar, cria aquele clima de
        // desafio que a Central de Jogos tinha.
        if (this.roundsWithoutWinner >= 2) {
          this.systemMessage(
            `😶 Essa é a ${this.roundsWithoutWinner}ª rodada seguida sem ninguém acertar. Quem quebra a seca?`
          );
        }
      }

      // Registra o aproveitamento de quem tentou responder essa pergunta —
      // quem acertou e quem errou. É isso que alimenta o "% de acerto por
      // sala" mostrado no hover de perfil.
      await this.recordQuestionStats(winner);

      // Deixa a pergunta registrada no chat — assim quem entrou depois (ou
      // não conseguiu ler a tempo) ainda vê o que foi perguntado. A resposta
      // fica de fora de propósito: ela já aparece na mensagem de quem
      // acertou (ou na de "ninguém acertou"), então repetir aqui só poluiria.
      this.systemMessage(`❓ ${question.question}`);
    } catch (err) {
      console.error(`Erro ao encerrar pergunta na sala ${this.roomId}:`, err);
    } finally {
      // Modo arena: quando o turno completa as rodadas, premia e recomeça.
      if (this.roundsPerTurn && this.turnRound >= this.roundsPerTurn) {
        await this.finishTurn();
      }
      this.startIntermission();
    }
  }

  // Avisa no chat quando a posição da pessoa no ranking mensal muda — dá
  // aquela sensação de progresso constante, sem ela precisar sair da sala
  // pra conferir. Só anuncia quando MUDA (não repete a mesma posição).
  async announceRankingPosition(userId, nickname) {
    try {
      const monthKey = currentMonthKey();
      const myScore = await prisma.monthlyScore.findUnique({
        where: { userId_gameKey_monthKey: { userId, gameKey: GAME_KEY, monthKey } },
      });
      if (!myScore) return;

      const ahead = await prisma.monthlyScore.count({
        where: {
          gameKey: GAME_KEY,
          monthKey,
          user: { role: { not: "ADMIN" } },
          points: { gt: myScore.points },
        },
      });
      const position = ahead + 1;

      const previous = this.lastAnnouncedPosition.get(userId);
      if (previous === position) return; // nada mudou, não repete

      this.lastAnnouncedPosition.set(userId, position);

      // Só vale a pena narrar se ela SUBIU (ou é a primeira vez que vemos).
      if (previous === undefined || position < previous) {
        const emoji = position === 1 ? "👑" : position <= 3 ? "🔥" : "📈";
        this.systemMessage(
          `${emoji} ${nickname}, você está na ${position}ª posição do ranking mensal do Quiz!`,
          false,
          true
        );
      }
    } catch (err) {
      console.error("Falha ao anunciar posição no ranking:", err.message);
    }
  }

  // Monta o ranking acumulado do turno atual, já com as posições resolvidas
  // considerando empate: quem tem a mesma pontuação divide a MESMA posição
  // (e mais pra frente, o mesmo prêmio — sem dividir entre eles).
  buildTurnRanking() {
    const sorted = [...this.turnScores.entries()]
      .filter(([, pts]) => pts > 0)
      .sort((a, b) => b[1] - a[1]);

    const ranking = [];
    let lastPoints = null;
    let lastPosition = 0;

    sorted.forEach(([userId, points], idx) => {
      // Mesma pontuação = mesma posição do anterior (empate real).
      const position = points === lastPoints ? lastPosition : idx + 1;
      lastPoints = points;
      lastPosition = position;

      const player = [...this.players.values()].find((p) => p.userId === userId);
      ranking.push({
        userId,
        nickname: player?.nickname || "Jogador",
        points,
        position,
      });
    });

    return ranking;
  }

  // Registra as estatísticas de acerto na arena (quem tentou e quem acertou).
  async recordArenaStats() {
    for (const userId of this.attemptedThisQuestion) {
      const acertou = this.correctThisQuestion.has(userId);
      try {
        await prisma.quizRoomStat.upsert({
          where: { userId_roomId: { userId, roomId: this.roomId } },
          update: {
            attempts: { increment: 1 },
            correct: acertou ? { increment: 1 } : undefined,
          },
          create: { userId, roomId: this.roomId, attempts: 1, correct: acertou ? 1 : 0 },
        });
      } catch (err) {
        console.error("Falha ao registrar estatística da arena:", err.message);
      }
    }
    this.attemptedThisQuestion = new Set();
  }

  // Guarda quem tentou responder essa pergunta e se acertou — base do
  // cálculo de aproveitamento por sala.
  async recordQuestionStats(winner) {
    const attempted = [...this.attemptedThisQuestion];
    if (attempted.length === 0 && !winner) return;

    for (const userId of attempted) {
      const correct = winner?.userId === userId;
      try {
        await prisma.quizRoomStat.upsert({
          where: { userId_roomId: { userId, roomId: this.roomId } },
          update: {
            attempts: { increment: 1 },
            correct: correct ? { increment: 1 } : undefined,
          },
          create: { userId, roomId: this.roomId, attempts: 1, correct: correct ? 1 : 0 },
        });
      } catch (err) {
        console.error("Falha ao registrar estatística do Quiz:", err.message);
      }
    }
    this.attemptedThisQuestion = new Set();
  }

  // Fecha o turno da arena: monta o ranking das rodadas, premia o top 3 e
  // zera pro próximo turno.
  async finishTurn() {
    // Usa o ranking já com empates resolvidos: quem empatou tem a MESMA
    // posição, e por consequência recebe o MESMO prêmio — sem dividir o
    // valor entre os empatados.
    const ranking = this.buildTurnRanking();

    this.systemMessage(`🏁 Fim do turno de ${this.roundsPerTurn} rodadas!`, true);

    if (ranking.length === 0) {
      this.systemMessage("Ninguém pontuou nesse turno.");
    } else {
      const monthKey = currentMonthKey();
      const medals = ["🥇", "🥈", "🥉", "4º", "5º"];

      for (const entry of ranking) {
        // Só premia até onde a tabela de bônus alcança (top 5 por padrão).
        // Empatados na mesma posição recebem o mesmo valor cheio.
        const bonus = this.turnBonus[entry.position - 1];
        if (bonus === undefined) continue;

        const medal = medals[entry.position - 1] || `${entry.position}º`;
        // Uma linha por colocado — bem mais legível que tudo espremido numa
        // linha só, do jeito que a Central de Jogos fazia.
        this.systemMessage(
          `${medal} Parabéns ${entry.nickname}, você ficou em ${entry.position}º nesse turno e ganhou ${bonus} pontos.`,
          false,
          true
        );

        try {
          await prisma.monthlyScore.upsert({
            where: { userId_gameKey_monthKey: { userId: entry.userId, gameKey: GAME_KEY, monthKey } },
            update: { points: { increment: bonus } },
            create: { userId: entry.userId, gameKey: GAME_KEY, monthKey, points: bonus },
          });
          await prisma.lifetimeScore.upsert({
            where: { userId_gameKey: { userId: entry.userId, gameKey: GAME_KEY } },
            update: { points: { increment: bonus } },
            create: { userId: entry.userId, gameKey: GAME_KEY, points: bonus },
          });
          this.lifetimeCache.set(entry.userId, (this.lifetimeCache.get(entry.userId) || 0) + bonus);
        } catch (err) {
          console.error("Falha ao premiar turno da arena:", err.message);
        }
      }

      this.broadcast("quiz-turn-finished", { ranking });
    }

    this.turnScores = new Map();
    this.turnRound = 0;
    await this.broadcastOnlinePlayers();
  }
}
