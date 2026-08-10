import { prisma } from "../db.js";
import { isBirthdayToday } from "../utils/birthday.js";
import { pickRandomTheme, pickRandomLetters } from "./acromaniaThemes.js";
import { trackPlaytime } from "./playtimeTracker.js";
import { currentMonthKey } from "../utils/monthKey.js";
import { concorreAoRanking } from "../utils/rankingElegivel.js";
import { getRankForPoints } from "../utils/rank.js";
import { carregarSaudacoes, mensagemDeEntrada, mensagemDeSaida } from "../utils/premium.js";
import { registrarEvento } from "./missoes.js";

const GAME_KEY = "acromania";

// Embaralha um array (Fisher-Yates) sem alterar o original.
function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Sala do Acromania: sorteia tema+letras, todo mundo escreve uma frase, todo
// mundo vota secretamente na melhor (sem saber de quem é cada uma), e quem
// tiver mais votos leva os pontos da rodada. Ciclo eterno: escrever -> votar
// -> resultado -> intervalo -> escrever de novo.
export class AcromaniaRoom {
  constructor(roomId, io, config = {}) {
    this.roomId = roomId;
    this.io = io;
    this.label = config.label || "Acromania";
    this.writingSeconds = config.writingSeconds ?? 60;
    this.votingSeconds = config.votingSeconds ?? 20;
    this.intermissionSeconds = config.intermissionSeconds ?? 10;
    this.lettersCount = config.lettersCount ?? 3;
    this.pointsForWin = config.pointsForWin ?? 50;
    this.minPlayersToStart = config.minPlayersToStart ?? 1;
    this.maxPlayers = config.maxPlayers ?? 10;

    this.players = new Map(); // socketId -> {userId, nickname, socket}
    this.state = "intermission"; // intermission | writing | voting | grading
    this.timeLeft = 0;
    this.timer = null;
    this.roundNumber = 0;

    this.currentTheme = "";
    this.currentLetters = [];
    this.submissions = new Map(); // userId -> phrase
    this.votes = new Map(); // voterId -> targetUserId
    this.lastResult = null;

    this.lifetimeCache = new Map(); // userId -> pts vitalícios (geral, Acromania)
    this.roomLifetimeCache = new Map(); // userId -> pts vitalícios (só nesta sala)

    this.startedLoop = false;
  }

  countUniquePlayers() {
    return new Set([...this.players.values()].map((p) => p.userId)).size;
  }

  async addPlayer(socket, userId, nickname) {
    const alreadyInRoom = [...this.players.values()].some((p) => p.userId === userId);
    if (!alreadyInRoom && this.countUniquePlayers() >= this.maxPlayers) {
      socket.emit("acromania-room-full", { roomId: this.roomId });
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
        where: { userId_gameKey: { userId, gameKey: `${GAME_KEY}:${this.roomId}` } },
      });
      this.roomLifetimeCache.set(userId, existingRoom?.points || 0);
    }

    socket.join(this.roomId);
    socket.emit("acromania-room-state", this.publicState());

    if (!alreadyInRoom) {
      // Saudação personalizada (premium) no lugar do texto padrão.
      const saudacoes = await carregarSaudacoes(userId);
      const msgEntrada = mensagemDeEntrada(nickname, saudacoes);
      this.systemMessage(msgEntrada || `👋 ${nickname} entrou na sala.`, false, !!msgEntrada);
      // Guarda a de saída: na hora de sair o socket já pode ter caído.
      const eu = this.players.get(socket.id);
      if (eu && saudacoes?.saida) eu.saudacaoSaida = saudacoes.saida;
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

    if (!this.startedLoop) {
      this.startedLoop = true;
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
      if (!stillConnected) {
        const msgSaida = mensagemDeSaida(leaving.nickname, leaving.saudacaoSaida);
        this.systemMessage(msgSaida || `🚪 ${leaving.nickname} saiu da sala.`, false, !!msgSaida);
      }
    }
    await this.broadcastOnlinePlayers();
  }

  async broadcastOnlinePlayers() {
    const monthKey = currentMonthKey();
    const seen = new Set();
    const list = [];
    for (const p of this.players.values()) {
      if (seen.has(p.userId)) continue;
      seen.add(p.userId);
      const monthly = await prisma.monthlyScore.findUnique({
        where: { userId_gameKey_monthKey: { userId: p.userId, gameKey: GAME_KEY, monthKey } },
      });
      list.push({
        userId: p.userId,
        nickname: p.nickname,
        lifetimePoints: this.lifetimeCache.get(p.userId) || 0,
        roomLifetimePoints: this.roomLifetimeCache.get(p.userId) || 0,
        monthlyPoints: monthly?.points || 0,
      });
    }
    list.sort((a, b) => b.lifetimePoints - a.lifetimePoints);
    this.broadcast("acromania-online-players", { players: list });
  }

  broadcast(event, data) {
    this.io.to(this.roomId).emit(event, data);
  }

  systemMessage(message, bold = false, success = false, promotion = false) {
    this.broadcast("acromania-chat-message", {
      userId: null,
      nickname: "Sistema",
      message,
      system: true,
      bold,
      success,
      promotion,
      at: Date.now(),
    });
  }

  chatMessage(userId, nickname, message) {
    this.broadcast("acromania-chat-message", { userId, nickname, message, system: false, at: Date.now() });
  }

  publicState() {
    return {
      roomId: this.roomId,
      label: this.label,
      state: this.state,
      timeLeft: this.timeLeft,
      theme: this.currentTheme,
      letters: this.currentLetters,
      writingSeconds: this.writingSeconds,
      votingSeconds: this.votingSeconds,
      minPlayersToStart: this.minPlayersToStart,
      onlineCount: this.countUniquePlayers(),
    };
  }

  clearTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async startIntermission(waitingForPlayers = false) {
    this.clearTimer();
    this.state = "intermission";
    this.timeLeft = this.intermissionSeconds;
    this.broadcast("acromania-intermission", {
      waitingForPlayers,
      minPlayersToStart: this.minPlayersToStart,
      onlineCount: this.countUniquePlayers(),
    });

    this.timer = setInterval(() => {
      this.timeLeft -= 1;
      this.broadcast("acromania-tick", { state: this.state, timeLeft: this.timeLeft });
      if (this.timeLeft <= 0) {
        // Protegido: função assíncrona que desliga o timer. Sem o catch,
        // uma falha deixaria a sala travada sem timer.
        Promise.resolve(this.startWriting()).catch((err) => {
          console.error(`Falha em startWriting na sala ${this.roomId}:`, err);
          setTimeout(() => this.startIntermission(), 3000);
        });
      }
    }, 1000);
  }

  async startWriting() {
    this.clearTimer();

    if (this.countUniquePlayers() < this.minPlayersToStart) {
      // Ninguém suficiente pra jogar agora — espera mais um pouco e checa de novo.
      this.systemMessage(
        `⏳ Aguardando mais jogadores (mínimo de ${this.minPlayersToStart} pra começar — agora tem ${this.countUniquePlayers()}).`
      );
      this.startIntermission(true);
      return;
    }

    this.roundNumber += 1;
    this.state = "writing";
    this.currentTheme = pickRandomTheme();
    this.currentLetters = pickRandomLetters(this.lettersCount);
    this.submissions = new Map();
    this.votes = new Map();
    this.timeLeft = this.writingSeconds;

    this.broadcast("acromania-round-start", {
      roundNumber: this.roundNumber,
      theme: this.currentTheme,
      letters: this.currentLetters,
      seconds: this.writingSeconds,
    });
    this.systemMessage(`✍️ Nova rodada! Tema: "${this.currentTheme}" — letras: ${this.currentLetters.join(" ")}`);

    this.timer = setInterval(() => {
      this.timeLeft -= 1;
      this.broadcast("acromania-tick", { state: this.state, timeLeft: this.timeLeft });
      if (this.timeLeft <= 0) {
        // Protegido: função assíncrona que desliga o timer. Sem o catch,
        // uma falha deixaria a sala travada sem timer.
        Promise.resolve(this.startVoting()).catch((err) => {
          console.error(`Falha em startVoting na sala ${this.roomId}:`, err);
          setTimeout(() => this.startIntermission(), 3000);
        });
      }
    }, 1000);
  }

  submitPhrase(socket, userId, phrase) {
    if (this.state !== "writing") return;
    const clean = (phrase || "").trim().slice(0, 200);
    if (!clean) return;
    this.submissions.set(userId, clean);
    registrarEvento(userId, "acro_frase").catch(() => {});
    socket.emit("acromania-phrase-submitted", { ok: true });
    this.broadcastSubmittedList();

    // Se todo mundo que está na sala agora já mandou a frase, não tem por
    // que esperar o tempo acabar — já pula direto pra votação.
    const totalPlayers = this.countUniquePlayers();
    if (totalPlayers > 0 && this.submissions.size >= totalPlayers) {
      this.startVoting();
    }
  }

  // Avisa a sala inteira QUEM já mandou a frase (só o nick, nunca o
  // conteúdo) — mostrado como uma lista de espera, tipo "aguardando".
  broadcastSubmittedList() {
    const nicknames = [...this.submissions.keys()].map((userId) => this.getNickname(userId));
    this.broadcast("acromania-submissions-update", { nicknames });
  }

  async startVoting() {
    this.clearTimer();
    this.state = "voting";
    this.timeLeft = this.votingSeconds;

    // Embaralha as frases e dá um ID anônimo (não é o userId) pra cada uma —
    // assim ninguém sabe de quem é qual frase na hora de votar.
    const entries = shuffle([...this.submissions.entries()]).map(([userId, phrase], i) => ({
      entryId: `e${i}`,
      userId,
      phrase,
    }));
    this.voteEntries = entries;

    if (entries.length === 0) {
      this.systemMessage("😶 Ninguém escreveu uma frase nessa rodada.");
      this.lastResult = { theme: this.currentTheme, letters: this.currentLetters, entries: [], noOneWrote: true };
      this.broadcast("acromania-round-result", this.lastResult);
      this.startIntermission();
      return;
    }

    if (entries.length === 1) {
      // Só uma frase — não tem quem votar contra, já ganha os pontos direto.
      await this.finishRound(entries, new Map());
      return;
    }

    this.broadcast("acromania-voting-start", {
      entries: entries.map((e) => ({ entryId: e.entryId, phrase: e.phrase })),
      seconds: this.votingSeconds,
    });
    this.systemMessage("🗳️ Hora de votar na melhor frase!");

    this.timer = setInterval(() => {
      this.timeLeft -= 1;
      this.broadcast("acromania-tick", { state: this.state, timeLeft: this.timeLeft });
      if (this.timeLeft <= 0) {
        // Protegido: função assíncrona que desliga o timer. Sem o catch,
        // uma falha deixaria a sala travada sem timer.
        Promise.resolve(this.endVoting()).catch((err) => {
          console.error(`Falha em endVoting na sala ${this.roomId}:`, err);
          setTimeout(() => this.startIntermission(), 3000);
        });
      }
    }, 1000);
  }

  vote(socket, userId, entryId) {
    if (this.state !== "voting") return;
    const entry = (this.voteEntries || []).find((e) => e.entryId === entryId);
    if (!entry) return;
    if (entry.userId === userId) return; // não pode votar na própria frase
    this.votes.set(userId, entryId);
    socket.emit("acromania-vote-registered", { ok: true });
  }

  async endVoting() {
    this.clearTimer();
    await this.finishRound(this.voteEntries || [], this.votes);
  }

  async finishRound(entries, votes) {
    this.state = "grading";
    this.clearTimer();

    // Conta os votos por frase
    const voteCounts = new Map(entries.map((e) => [e.entryId, 0]));
    for (const targetEntryId of votes.values()) {
      voteCounts.set(targetEntryId, (voteCounts.get(targetEntryId) || 0) + 1);
    }

    // Missões: cada voto recebido conta pra quem escreveu a frase.
    for (const e of entries) {
      const recebidos = voteCounts.get(e.entryId) || 0;
      if (recebidos > 0) {
        registrarEvento(e.userId, "acro_voto_recebido", recebidos).catch(() => {});
      }
    }

    const maxVotes = Math.max(0, ...voteCounts.values());
    const winners = maxVotes > 0 ? entries.filter((e) => voteCounts.get(e.entryId) === maxVotes) : [];

    const monthKey = currentMonthKey();
    for (const winner of winners) {
      try {
        // Busca os pontos mensais ANTES de somar, pra comparar a patente
        // de antes com a de depois. O Acromania ainda não tem sistema de
        // patente próprio, então usa as mesmas do Stop como provisório —
        // mesmo padrão já usado no Ranking e no perfil público.
        const existingMonthly = await prisma.monthlyScore.findUnique({
          where: { userId_gameKey_monthKey: { userId: winner.userId, gameKey: GAME_KEY, monthKey } },
        });
        const oldMonthlyPoints = existingMonthly?.points || 0;
        const newMonthlyPoints = oldMonthlyPoints + this.pointsForWin;

        await prisma.monthlyScore.upsert({
          where: { userId_gameKey_monthKey: { userId: winner.userId, gameKey: GAME_KEY, monthKey } },
          update: { points: { increment: this.pointsForWin } },
          create: { userId: winner.userId, gameKey: GAME_KEY, monthKey, points: this.pointsForWin },
        });

        const oldRank = getRankForPoints(oldMonthlyPoints);
        const newRank = getRankForPoints(newMonthlyPoints);
        // Só anuncia promoção pra quem concorre ao ranking.
        if (oldRank.key !== newRank.key && (await concorreAoRanking(winner.userId))) {
          this.systemMessage(`"${winner.nickname}" você foi promovido para ${newRank.name}.`, false, false, true);
        }

        await prisma.lifetimeScore.upsert({
          where: { userId_gameKey: { userId: winner.userId, gameKey: GAME_KEY } },
          update: { points: { increment: this.pointsForWin } },
          create: { userId: winner.userId, gameKey: GAME_KEY, points: this.pointsForWin },
        });
        this.lifetimeCache.set(winner.userId, (this.lifetimeCache.get(winner.userId) || 0) + this.pointsForWin);

        const roomGameKey = `${GAME_KEY}:${this.roomId}`;
        await prisma.lifetimeScore.upsert({
          where: { userId_gameKey: { userId: winner.userId, gameKey: roomGameKey } },
          update: { points: { increment: this.pointsForWin } },
          create: { userId: winner.userId, gameKey: roomGameKey, points: this.pointsForWin },
        });
        this.roomLifetimeCache.set(winner.userId, (this.roomLifetimeCache.get(winner.userId) || 0) + this.pointsForWin);
      } catch (err) {
        console.error("Falha ao salvar pontuação do Acromania para", winner.userId, err.message);
      }
    }

    this.lastResult = {
      theme: this.currentTheme,
      letters: this.currentLetters,
      entries: entries.map((e) => ({
        entryId: e.entryId,
        userId: e.userId,
        nickname: this.getNickname(e.userId),
        phrase: e.phrase,
        votes: voteCounts.get(e.entryId) || 0,
        won: winners.some((w) => w.entryId === e.entryId),
      })),
    };
    this.broadcast("acromania-round-result", this.lastResult);

    if (winners.length > 0) {
      const names = winners.map((w) => this.getNickname(w.userId)).join(" e ");
      this.systemMessage(`🏆 ${names} venceu a rodada com a frase mais votada! (+${this.pointsForWin} pts)`, true, true);
    } else {
      this.systemMessage("🤷 Ninguém votou nessa rodada — sem pontos dessa vez.");
    }

    await this.broadcastOnlinePlayers();
    this.startIntermission();
  }

  getNickname(userId) {
    const found = [...this.players.values()].find((p) => p.userId === userId);
    return found?.nickname || "Jogador";
  }
}
