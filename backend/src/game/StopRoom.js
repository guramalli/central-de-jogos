import { prisma } from "../db.js";
import { getRankForPoints } from "../utils/rank.js";
import { isBirthdayToday } from "../utils/birthday.js";

const ROUNDS_PER_BLOCK = 10;
const BLOCK_BONUS = [150, 100, 50]; // 1º, 2º, 3º lugar do bloco
const LETTERS = "ABCDEFGHIJLMNOPQRSTUVXZ".split(""); // agora inclui X e Z também
const GAME_KEY = "stop";
const SKIP_VOTE_MIN_PLAYERS = 3;

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Remove acentuação e normaliza para comparação — assim "cha" bate com "chá",
// "sao paulo" bate com "São Paulo", etc. O jogador não é obrigado a acentuar.
function normalize(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Uma StopRoom representa uma sala/mesa do jogo Stop rodando em loop infinito,
 * em blocos de 10 rodadas, conforme a especificação da Educação Gamer.
 */
export class StopRoom {
  constructor(roomId, io, allThemes, config = {}) {
    this.roomId = roomId;
    this.io = io;
    this.allThemes = allThemes; // [{id, key, name}]
    this.label = config.label || roomId;
    this.answerSeconds = config.answerSeconds ?? 50;
    this.intermissionSeconds = config.intermissionSeconds ?? 20;
    // Pontuação vitalícia mínima (geral, em todas as salas) exigida para entrar
    // nesta sala — usada por salas "avançadas" restritas a jogadores experientes.
    this.minLifetimePoints = config.minLifetimePoints ?? 0;
    // Se definido (> 0), o jogador só pode pedir STOP com pelo menos essa
    // quantidade de palavras CORRETAS (não basta só preencher todas as lacunas).
    // Se 0/indefinido, mantém a regra padrão: precisa preencher todas as lacunas.
    this.minCorrectToStop = config.minCorrectToStop ?? 0;
    this.minSecondsBeforeStop = config.minSecondsBeforeStop ?? 0;
    this.maxPlayers = config.maxPlayers ?? 10;
    // Reaproveita a tabela LifetimeScore com uma "gameKey" própria por sala
    // (ex.: "stop:stop-sala-1"), assim cada sala tem sua pontuação histórica
    // separada, sem precisar de uma tabela nova nem migration.
    this.roomGameKey = `${GAME_KEY}:${roomId}`;
    this.players = new Map(); // socketId -> { userId, nickname, socket }
    this.roundNumber = 0;
    this.blockTotals = new Map(); // userId -> pontos acumulados no bloco atual de 10 rodadas
    this.lifetimeCache = new Map(); // userId -> pontos vitalícios do jogo Stop em TODAS as salas
    this.roomLifetimeCache = new Map(); // userId -> pontos vitalícios SÓ nesta sala (nunca reseta)
    this.state = "intermission"; // intermission | active | grading
    this.currentThemes = [];
    this.usedLettersInBlock = new Set(); // letras já sorteadas no bloco atual (não repetem)
    this.currentLetter = null;
    this.answers = new Map(); // userId -> { [themeKey]: word }
    // Sinais comportamentais reportados pelo cliente pra essa rodada (colar
    // texto, nunca corrigir nada) — usados só pra SINALIZAR possível uso de
    // IA/automação, nunca pra bloquear ninguém automaticamente.
    this.behaviorFlags = new Map(); // userId -> { pasted, corrected }
    this.skipVotes = new Set(); // userIds que votaram para pular o intervalo atual
    this.readyCache = new Map(); // userId -> já tem palavras corretas suficientes para pedir STOP?
    this.lastStopAttempt = new Map(); // userId -> timestamp da última tentativa de STOP (evita spam)
    this.validWordsCache = new Map(); // themeId -> Set de palavras aprovadas (normalizadas) para a letra atual
    this.timer = null;
    this.timeLeft = 0;

    this.startIntermission();
  }

  broadcast(event, payload) {
    this.io.to(this.roomId).emit(event, payload);
  }

  async addPlayer(socket, userId, nickname) {
    // Sala lotada: bloqueia só quem ainda NÃO está na sala (reconexão de quem
    // já estava sempre é permitida, mesmo com a sala cheia).
    const alreadyInRoom = [...this.players.values()].some((p) => p.userId === userId);
    if (!alreadyInRoom && this.countUniquePlayers() >= this.maxPlayers) {
      socket.emit("room-access-denied", {
        roomLabel: this.label,
        full: true,
        maxPlayers: this.maxPlayers,
      });
      return false;
    }

    // Salas com exigência de pontuação (ex.: sala avançada) barram quem não
    // tem pontos vitalícios suficientes, ANTES de adicionar à sala.
    if (this.minLifetimePoints > 0) {
      const existing = await prisma.lifetimeScore.findUnique({
        where: { userId_gameKey: { userId, gameKey: GAME_KEY } },
      });
      const current = existing?.points || 0;
      if (current < this.minLifetimePoints) {
        socket.emit("room-access-denied", {
          roomLabel: this.label,
          required: this.minLifetimePoints,
          current,
        });
        return false;
      }
    }

    // Se esse jogador já tinha uma conexão antiga na sala (ex.: reconectou rápido),
    // remove a antiga primeiro para não aparecer duplicado nas listas/tabelas.
    for (const [oldSocketId, p] of this.players.entries()) {
      if (p.userId === userId && oldSocketId !== socket.id) {
        this.players.delete(oldSocketId);
      }
    }

    this.players.set(socket.id, { userId, nickname, socket });

    if (!this.blockTotals.has(userId)) {
      // Recupera a pontuação do bloco atual salva no banco (se o jogador já
      // tinha pontuado nessa sala antes de sair, ou se o servidor reiniciou).
      const saved = await prisma.blockScore.findUnique({
        where: { userId_gameKey_roomId: { userId, gameKey: GAME_KEY, roomId: this.roomId } },
      });
      this.blockTotals.set(userId, saved?.points || 0);
    }

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
    socket.emit("room-state", { ...this.publicState(), myAnswers: this.answers.get(userId) || {} });
    socket.emit("skip-vote-update", {
      votes: this.skipVotes.size,
      needed: this.countUniquePlayers(),
      minPlayers: SKIP_VOTE_MIN_PLAYERS,
    });
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
      if (!stillConnected) {
        if (this.skipVotes.has(leaving.userId)) {
          this.skipVotes.delete(leaving.userId);
          this.broadcastSkipVoteUpdate();
        }
        this.systemMessage(`🚪 ${leaving.nickname} saiu da sala.`);
      }
    }
    await this.broadcastOnlinePlayers();
  }

  // Lista de jogadores online na sala com pontuação vitalícia (do jogo Stop) e patente —
  // usada na tabelinha lateral da tela do jogo. Inclui também pontos do bloco atual (sala)
  // e do mês corrente, usados na barra superior estilo "Pts Sala / Pts Mês".
  async broadcastOnlinePlayers() {
    const monthKey = currentMonthKey();
    const seen = new Set();
    const list = [];
    for (const p of this.players.values()) {
      if (seen.has(p.userId)) continue;
      seen.add(p.userId);
      const lifetimePoints = this.lifetimeCache.get(p.userId) || 0;
      const roomLifetimePoints = this.roomLifetimeCache.get(p.userId) || 0;
      const monthly = await prisma.monthlyScore.findUnique({
        where: { userId_gameKey_monthKey: { userId: p.userId, gameKey: GAME_KEY, monthKey } },
      });
      list.push({
        userId: p.userId,
        nickname: p.nickname,
        lifetimePoints,
        roomLifetimePoints,
        monthlyPoints: monthly?.points || 0,
        blockPoints: this.blockTotals.get(p.userId) || 0,
        rank: getRankForPoints(lifetimePoints),
      });
    }
    list.sort((a, b) => b.lifetimePoints - a.lifetimePoints);
    this.broadcast("players-online", { players: list });
  }

  publicState() {
    return {
      roomId: this.roomId,
      label: this.label,
      answerSeconds: this.answerSeconds,
      intermissionSeconds: this.intermissionSeconds,
      minCorrectToStop: this.minCorrectToStop,
      state: this.state,
      roundNumber: this.roundNumber,
      roundInBlock: ((this.roundNumber - 1) % ROUNDS_PER_BLOCK) + 1,
      themes: this.currentThemes,
      letter: this.currentLetter,
      timeLeft: this.timeLeft,
    };
  }

  clearTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  startIntermission() {
    this.clearTimer();
    this.state = "intermission";
    this.timeLeft = this.intermissionSeconds;
    this.skipVotes = new Set();
    this.broadcast("round-intermission", { seconds: this.intermissionSeconds });
    this.broadcastSkipVoteUpdate();

    this.timer = setInterval(() => {
      this.timeLeft -= 1;
      this.broadcast("tick", { state: this.state, timeLeft: this.timeLeft });
      if (this.timeLeft <= 0) this.startRound();
    }, 1000);
  }

  countUniquePlayers() {
    return new Set([...this.players.values()].map((p) => p.userId)).size;
  }

  broadcastSkipVoteUpdate() {
    this.broadcast("skip-vote-update", {
      votes: this.skipVotes.size,
      needed: this.countUniquePlayers(),
      minPlayers: SKIP_VOTE_MIN_PLAYERS,
    });
  }

  // Votação para pular o intervalo entre rodadas: com 3+ jogadores na sala,
  // se TODOS votarem, o cronômetro zera e a próxima rodada começa na hora.
  voteSkip(userId) {
    if (this.state !== "intermission") return;
    this.skipVotes.add(userId);
    this.broadcastSkipVoteUpdate();

    const uniqueIds = new Set([...this.players.values()].map((p) => p.userId));
    const everyoneVoted = uniqueIds.size > 0 && [...uniqueIds].every((id) => this.skipVotes.has(id));

    if (uniqueIds.size >= SKIP_VOTE_MIN_PLAYERS && everyoneVoted) {
      this.startRound();
    }
  }

  pickThemes() {
    const shuffled = [...this.allThemes].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 6);
  }

  pickLetter() {
    // Nunca repete uma letra já sorteada dentro do bloco atual de 10 rodadas.
    const available = LETTERS.filter((l) => !this.usedLettersInBlock.has(l));
    const pool = available.length > 0 ? available : LETTERS; // segurança: nunca deveria esvaziar
    const letter = pool[Math.floor(Math.random() * pool.length)];
    this.usedLettersInBlock.add(letter);
    return letter;
  }

  async startRound() {
    this.clearTimer();
    this.roundNumber += 1;
    this.state = "active";

    // Os 6 temas só são sorteados de novo no início de cada bloco de 10 rodadas;
    // dentro do mesmo bloco, eles se mantêm e só a letra muda a cada rodada.
    const isFirstRoundOfBlock = (this.roundNumber - 1) % ROUNDS_PER_BLOCK === 0;
    if (isFirstRoundOfBlock || this.currentThemes.length === 0) {
      this.currentThemes = this.pickThemes();
      this.usedLettersInBlock = new Set(); // novo bloco: letras podem repetir de novo
    }
    this.currentLetter = this.pickLetter();
    this.answers = new Map();
    this.behaviorFlags = new Map();
    this.readyCache = new Map();
    this.timeLeft = this.answerSeconds;
    this.roundStartedAt = Date.now();
    this.validWordsCache = new Map(); // vazio até a busca abaixo terminar

    // O relógio começa a contar JÁ — não espera o banco responder antes de
    // ligar o timer. Antes, se o banco demorasse (ex.: "acordando" depois de
    // ficar inativo), a sala inteira travava esperando essa resposta. Agora
    // o glossário carrega em paralelo, em segundo plano.
    this.broadcast("round-start", {
      roundNumber: this.roundNumber,
      roundInBlock: ((this.roundNumber - 1) % ROUNDS_PER_BLOCK) + 1,
      themes: this.currentThemes.map((t) => ({ key: t.key, name: t.name })),
      letter: this.currentLetter,
      seconds: this.answerSeconds,
    });
    this.systemMessage(`🎲 Rodada ${this.roundNumber} começou — letra sorteada: ${this.currentLetter}`);

    this.timer = setInterval(() => {
      this.timeLeft -= 1;
      this.broadcast("tick", { state: this.state, timeLeft: this.timeLeft });
      if (this.timeLeft <= 0) this.endRound(false);
    }, 1000);

    // Busca as palavras válidas dessa rodada (todos os temas + a letra
    // sorteada) em segundo plano — guarda em memória pra conferir STOP sem
    // precisar ir ao banco a cada tecla digitada.
    this.loadValidWordsCache();
  }

  async loadValidWordsCache() {
    this.validWordsCache = new Map();
    try {
      const themeIds = this.currentThemes.map((t) => t.id);
      // Timeout de segurança: se o banco demorar demais pra responder (ex.:
      // "acordando" depois de ficar inativo), desiste depois de 8s em vez de
      // ficar pendurado pra sempre — as respostas ficam "erradas" só até a
      // próxima tentativa conseguir carregar.
      const words = await Promise.race([
        prisma.wordEntry.findMany({
          where: { themeId: { in: themeIds }, letter: this.currentLetter, status: "approved" },
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout ao buscar glossário")), 8000)),
      ]);
      for (const w of words) {
        if (!this.validWordsCache.has(w.themeId)) this.validWordsCache.set(w.themeId, new Set());
        this.validWordsCache.get(w.themeId).add(normalize(w.word));
      }
    } catch (err) {
      console.error("Falha ao carregar glossário da rodada:", err.message);
      // mantém o cache vazio — as respostas dessa rodada serão tratadas como
      // erradas até a próxima rodada conseguir recarregar, mas o jogo não trava.
    }
  }

  async playerStop(socket, userId) {
    if (this.state !== "active") return;
    // Se a pessoa não digitou nada ainda, trata como um objeto vazio (em vez
    // de sair calado) — assim o resto da função avisa o motivo certo (mínimo
    // de palavras ou campos por preencher), em vez do clique não fazer nada.
    const ans = this.answers.get(userId) || {};

    // Evita que cliques repetidos no botão (ou Ctrl+Enter espetado) disparem
    // várias tentativas em sequência — ignora tentativas muito próximas.
    const now = Date.now();
    const last = this.lastStopAttempt.get(userId) || 0;
    if (now - last < 400) return;
    this.lastStopAttempt.set(userId, now);

    // Ninguém pode pedir STOP antes do tempo mínimo da sala, mesmo já com
    // tudo preenchido/correto — evita respostas "bots" ou tempo suspeito.
    const elapsedSeconds = (now - this.roundStartedAt) / 1000;
    if (elapsedSeconds < this.minSecondsBeforeStop) {
      socket.emit("stop-denied", { reason: "too-early", minSeconds: this.minSecondsBeforeStop });
      return;
    }

    if (this.minCorrectToStop > 0) {
      let ready = false;
      try {
        ready = await this.hasEnoughCorrect(userId);
      } catch (err) {
        console.error("Falha ao validar STOP para", userId, err.message);
        socket.emit("stop-denied", { reason: "not-ready" });
        return;
      }
      if (!ready) {
        socket.emit("stop-denied", { reason: "not-ready" });
        return;
      }
    } else {
      // Regra padrão: precisa preencher todas as lacunas (não precisam estar certas).
      const filled = this.currentThemes.every((t) => (ans[t.key] || "").trim().length > 0);
      if (!filled) {
        socket.emit("stop-denied", { reason: "not-filled" });
        return;
      }
    }

    const player = [...this.players.values()].find((p) => p.userId === userId);
    const nickname = player?.nickname || "Alguém";

    this.broadcast("player-stopped", { userId, nickname });
    this.systemMessage(`🛑 ${nickname} apertou STOP!`, true);
    this.endRound(true);
  }

  submitAnswers(socket, userId, answers, behavior) {
    if (this.state !== "active") return;
    this.answers.set(userId, answers);
    if (behavior) {
      const prev = this.behaviorFlags.get(userId) || { pasted: false, corrected: false };
      this.behaviorFlags.set(userId, {
        pasted: prev.pasted || !!behavior.pasted,
        corrected: prev.corrected || !!behavior.corrected,
      });
    }

    // Sala com exigência de acertos: reavalia se o jogador já atingiu o mínimo.
    // Como as palavras válidas da rodada já estão em memória (carregadas no
    // início da rodada), essa checagem é instantânea — sem precisar de atraso
    // artificial nem ir ao banco a cada tecla digitada.
    if (this.minCorrectToStop > 0) {
      try {
        const ready = this.hasEnoughCorrect(userId);
        if (this.readyCache.get(userId) !== ready) {
          this.readyCache.set(userId, ready);
          socket.emit("stop-readiness", { ready });
        }
      } catch (err) {
        console.error("Falha ao checar prontidão de STOP para", userId, err.message);
      }
    }
  }

  // Quantas respostas ATUAIS do jogador já são palavras corretas (validadas
  // contra o glossário) é suficiente para atingir minCorrectToStop desta sala.
  hasEnoughCorrect(userId) {
    const ans = this.answers.get(userId);
    if (!ans) return false;
    let correctCount = 0;
    for (const theme of this.currentThemes) {
      const raw = (ans[theme.key] || "").trim();
      if (!raw) continue;
      const normRaw = normalize(raw);
      if (normRaw[0]?.toUpperCase() !== this.currentLetter) continue;
      const valid = this.isValidWord(theme.id, this.currentLetter, raw);
      if (valid) correctCount++;
    }
    return correctCount >= this.minCorrectToStop;
  }

  // Verifica se uma palavra está aprovada no glossário para o tema/letra da
  // rodada — agora é uma checagem em memória (o cache foi carregado no
  // início da rodada por loadValidWordsCache), não vai mais ao banco.
  isValidWord(themeId, letter, word) {
    if (letter !== this.currentLetter) return false; // segurança: cache é só da letra atual
    const set = this.validWordsCache.get(themeId);
    if (!set) return false;
    return set.has(normalize(word));
  }

  async logSuspiciousActivity(userId, reason, detail) {
    try {
      await prisma.suspiciousActivity.create({
        data: { userId, gameKey: GAME_KEY, roomId: this.roomId, reason, detail },
      });
    } catch (err) {
      console.error("Falha ao registrar atividade suspeita:", err.message);
    }
  }

  async endRound(stoppedByPlayer = false) {
    if (this.state !== "active") return;
    this.clearTimer();
    this.state = "grading";
    const monthKey = currentMonthKey();
    const activePlayers = [...this.players.values()];

    if (!stoppedByPlayer) {
      this.systemMessage("⏰ Tempo esgotado! Ninguém pediu STOP.");
    }

    // Tudo daqui pra baixo fica protegido: se QUALQUER coisa falhar no meio da
    // correção (ex.: uma instabilidade momentânea no banco de dados), o "finally"
    // garante que a sala nunca fica travada — sempre volta pro intervalo e segue
    // o loop, mesmo que essa rodada específica não tenha sido salva corretamente.
    try {
      // graded[userId][themeKey] = { word, status, points }
      const graded = new Map();
      for (const p of activePlayers) graded.set(p.userId, {});

      for (const theme of this.currentThemes) {
        const wordCount = new Map();
        const playerNorm = new Map();

        for (const p of activePlayers) {
          const raw = (this.answers.get(p.userId)?.[theme.key] || "").trim();
          if (!raw) continue;
          const normRaw = normalize(raw);
          if (normRaw[0]?.toUpperCase() !== this.currentLetter) continue;
          const valid = await this.isValidWord(theme.id, this.currentLetter, raw);
          if (!valid) continue;
          playerNorm.set(p.userId, normRaw);
          wordCount.set(normRaw, (wordCount.get(normRaw) || 0) + 1);
        }

        for (const p of activePlayers) {
          const raw = (this.answers.get(p.userId)?.[theme.key] || "").trim();
          const entry = graded.get(p.userId);

          if (!raw) {
            entry[theme.key] = { word: "", status: "blank", points: 0 };
            continue;
          }

          const norm = playerNorm.get(p.userId);
          if (!norm) {
            entry[theme.key] = { word: raw, status: "wrong", points: 0 };
            continue;
          }

          const count = wordCount.get(norm) || 1;
          if (count > 1) {
            entry[theme.key] = { word: raw, status: "duplicate", points: 5 };
          } else if (playerNorm.size === 1) {
            // Foi o ÚNICO jogador da sala a acertar QUALQUER palavra nesse tema
            // (não só a única palavra diferente) — vale um bônus extra.
            entry[theme.key] = { word: raw, status: "solo", points: 15 };
          } else {
            entry[theme.key] = { word: raw, status: "correct", points: 10 };
          }
        }
      }

      const roundScores = new Map();
      for (const [userId, themeResults] of graded.entries()) {
        const total = Object.values(themeResults).reduce((sum, r) => sum + r.points, 0);
        roundScores.set(userId, total);
      }

      // Sinalização de possíveis ferramentas externas — nunca bloqueia
      // ninguém, só registra pra revisão manual depois. Dois sinais:
      //  1) colou texto em algum campo nessa rodada;
      //  2) acertou tudo, sem NENHUMA correção (nunca apagou nada), e ainda
      //     sobrava bastante tempo quando a rodada terminou — padrão raro
      //     em digitação humana ao vivo (a gente hesita, erra, corrige).
      for (const [userId, themeResults] of graded.entries()) {
        const flags = this.behaviorFlags.get(userId) || { pasted: false, corrected: false };
        const results = Object.values(themeResults);
        const allFilled = results.length > 0 && results.every((r) => r.status !== "blank");
        const allCorrectish = results.every(
          (r) => r.status === "correct" || r.status === "duplicate" || r.status === "solo"
        );
        const fastFinish = this.timeLeft > this.answerSeconds * 0.6;

        if (flags.pasted) {
          this.logSuspiciousActivity(userId, "paste", `Rodada ${this.roundNumber}`);
        } else if (allFilled && allCorrectish && !flags.corrected && fastFinish) {
          this.logSuspiciousActivity(
            userId,
            "too_perfect",
            `Rodada ${this.roundNumber} — acertou tudo sem nenhuma correção, ${this.timeLeft}s ainda restantes`
          );
        }
      }

      for (const [userId, pts] of roundScores.entries()) {
        this.blockTotals.set(userId, (this.blockTotals.get(userId) || 0) + pts);
        try {
          await prisma.blockScore.upsert({
            where: { userId_gameKey_roomId: { userId, gameKey: GAME_KEY, roomId: this.roomId } },
            update: { points: this.blockTotals.get(userId) },
            create: { userId, gameKey: GAME_KEY, roomId: this.roomId, points: this.blockTotals.get(userId) },
          });
        } catch (err) {
          console.error("Falha ao salvar BlockScore para", userId, err.message);
        }
      }

      for (const [userId, pts] of roundScores.entries()) {
        if (pts <= 0) continue;
        try {
          await prisma.monthlyScore.upsert({
            where: { userId_gameKey_monthKey: { userId, gameKey: GAME_KEY, monthKey } },
            update: { points: { increment: pts } },
            create: { userId, gameKey: GAME_KEY, monthKey, points: pts },
          });
          await prisma.lifetimeScore.upsert({
            where: { userId_gameKey: { userId, gameKey: GAME_KEY } },
            update: { points: { increment: pts } },
            create: { userId, gameKey: GAME_KEY, points: pts },
          });
          this.lifetimeCache.set(userId, (this.lifetimeCache.get(userId) || 0) + pts);

          await prisma.lifetimeScore.upsert({
            where: { userId_gameKey: { userId, gameKey: this.roomGameKey } },
            update: { points: { increment: pts } },
            create: { userId, gameKey: this.roomGameKey, points: pts },
          });
          this.roomLifetimeCache.set(userId, (this.roomLifetimeCache.get(userId) || 0) + pts);
        } catch (err) {
          console.error("Falha ao salvar pontuação para", userId, err.message);
        }
      }

      this.broadcast("round-result", {
        roundNumber: this.roundNumber,
        roundInBlock: ((this.roundNumber - 1) % ROUNDS_PER_BLOCK) + 1,
        letter: this.currentLetter,
        themes: this.currentThemes.map((t) => ({ key: t.key, name: t.name })),
        players: activePlayers.map((p) => ({
          userId: p.userId,
          nickname: p.nickname,
          graded: graded.get(p.userId) || {},
          points: roundScores.get(p.userId) || 0,
          blockTotal: this.blockTotals.get(p.userId) || 0,
        })),
      });
      this.systemMessage(`🏁 Rodada ${this.roundNumber} encerrada!`);

      await this.broadcastOnlinePlayers();

      if (this.roundNumber % ROUNDS_PER_BLOCK === 0) {
        await this.awardBlockBonus(monthKey);
      }
    } catch (err) {
      console.error(`Erro inesperado ao corrigir a rodada ${this.roundNumber} da sala ${this.roomId}:`, err);
      this.systemMessage("⚠️ Tivemos um probleminha para corrigir essa rodada, mas o jogo continua!");
    } finally {
      this.startIntermission();
    }
  }

  async awardBlockBonus(monthKey) {
    // Só entra no pódio quem realmente pontuou alguma coisa NESSE bloco — uma
    // entrada zerada (de quem não jogou nada nesse bloco, mesmo que tenha
    // pontuado em blocos anteriores) não deve "preencher vaga" só porque
    // sobrou posição no pódio.
    const ranked = [...this.blockTotals.entries()]
      .filter(([, points]) => points > 0)
      .sort((a, b) => b[1] - a[1]);
    const bonusResults = [];

    this.systemMessage("🔄 Fim do bloco de 10 rodadas! Um novo sorteio de temas vai começar no próximo bloco.");

    for (let i = 0; i < Math.min(3, ranked.length); i++) {
      const [userId] = ranked[i];
      const bonus = BLOCK_BONUS[i];
      try {
        await prisma.monthlyScore.upsert({
          where: { userId_gameKey_monthKey: { userId, gameKey: GAME_KEY, monthKey } },
          update: { points: { increment: bonus } },
          create: { userId, gameKey: GAME_KEY, monthKey, points: bonus },
        });
        await prisma.lifetimeScore.upsert({
          where: { userId_gameKey: { userId, gameKey: GAME_KEY } },
          update: { points: { increment: bonus } },
          create: { userId, gameKey: GAME_KEY, points: bonus },
        });
        this.lifetimeCache.set(userId, (this.lifetimeCache.get(userId) || 0) + bonus);

        await prisma.lifetimeScore.upsert({
          where: { userId_gameKey: { userId, gameKey: this.roomGameKey } },
          update: { points: { increment: bonus } },
          create: { userId, gameKey: this.roomGameKey, points: bonus },
        });
        this.roomLifetimeCache.set(userId, (this.roomLifetimeCache.get(userId) || 0) + bonus);
      } catch (err) {
        console.error("Falha ao salvar bônus de bloco para", userId, err.message);
      }

      const winner = await prisma.user.findUnique({ where: { id: userId } });
      bonusResults.push({ userId, position: i + 1, bonus, nickname: winner?.nickname || "?" });
    }

    this.broadcast("block-bonus", { bonusResults });

    if (bonusResults.length > 0) {
      const medals = ["🥇", "🥈", "🥉"];
      const summary = bonusResults
        .map((b) => `${medals[b.position - 1]} ${b.nickname} (+${b.bonus} pts)`)
        .join("  ·  ");
      this.systemMessage(`🏆 Top 3 do bloco: ${summary}`);
    }

    await this.broadcastOnlinePlayers();

    // Reseta os totais do bloco (memória E banco) para o próximo ciclo de 10 rodadas
    for (const userId of this.blockTotals.keys()) {
      this.blockTotals.set(userId, 0);
      await prisma.blockScore.upsert({
        where: { userId_gameKey_roomId: { userId, gameKey: GAME_KEY, roomId: this.roomId } },
        update: { points: 0 },
        create: { userId, gameKey: GAME_KEY, roomId: this.roomId, points: 0 },
      });
    }
  }

  chatMessage(userId, nickname, message) {
    this.broadcast("chat-message", { userId, nickname, message, at: Date.now() });
  }

  // Avisos automáticos do jogo, mostrados no chat como se fosse um histórico
  // (entradas/saídas, início/fim de rodada, fim de bloco, vencedores do top 3).
  // bold=true destaca a mensagem (ex.: quando alguém aperta STOP).
  // success=true deixa em verde (ex.: aniversário).
  systemMessage(message, bold = false, success = false) {
    this.broadcast("chat-message", { userId: null, nickname: "Sistema", message, system: true, bold, success, at: Date.now() });
  }
}
