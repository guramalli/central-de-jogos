import { prisma } from "../db.js";
import { marcarAtividade, verificarInativos, minutosRestantes } from "./inatividade.js";
import { isBirthdayToday } from "../utils/birthday.js";
import { criarSorteadorDeTemas, pickRandomLetters } from "./acromaniaThemes.js";
import { trackPlaytime } from "./playtimeTracker.js";
import { currentMonthKey } from "../utils/monthKey.js";
import { concorreAoRanking } from "../utils/rankingElegivel.js";
import { getAcromaniaRankForPoints } from "../utils/acromaniaRank.js";
import { carregarSaudacoes, mensagemDeEntrada, mensagemDeSaida } from "../utils/premium.js";
import { registrarEvento } from "./missoes.js";
import { criarAvisoDeAtividade } from "./avisoAtividade.js";
import { novoIdMensagem } from "../utils/chatIds.js";
import { nomeComTitulo, destaqueDeTitulo } from "../utils/tituloEntrada.js";

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
    // Quando a sala deu sinal de vida pela última vez, e o timer do vigia.
    this.ultimoSinalDeVida = Date.now();
    this.watchdogTimer = null;
    // Faixa de letras por rodada. Mantém `lettersCount` como valor único
    // caso alguma config antiga ainda use — assim nenhuma sala quebra.
    this.lettersMin = config.lettersMin ?? config.lettersCount ?? 3;
    this.lettersMax = config.lettersMax ?? config.lettersCount ?? 3;
    this.pointsForWin = config.pointsForWin ?? 50;
    // Pontos por VOTO RECEBIDO. Antes só o vencedor pontuava: numa sala de 4
    // pessoas, 3 saíam de cada rodada com zero depois de escrever e esperar
    // 90 segundos — o pior desenho possível pra um jogo cujo problema é
    // retenção. Agora quem escreve bem pontua mesmo sem vencer.
    //
    // Propriedade importante: cada rodada distribui um voto por jogador,
    // então a média recebida é 1 seja qual for o tamanho da sala. Ao
    // contrário do bônus de vitória (que dilui em 1/N), esta parte NÃO
    // encolhe quando a sala enche.
    this.pointsPerVote = config.pointsPerVote ?? 15;
    this.minPlayersToStart = config.minPlayersToStart ?? 1;
    this.maxPlayers = config.maxPlayers ?? 10;

    this.players = new Map(); // socketId -> {userId, nickname, socket}
    this.state = "intermission"; // intermission | writing | voting | grading
    this.timeLeft = 0;
    this.timer = null;
    this.roundNumber = 0;

    this.currentTheme = "";
    // Baralho de temas próprio de cada sala (ver criarSorteadorDeTemas).
    this.sortearTema = criarSorteadorDeTemas();
    this.currentLetters = [];
    this.submissions = new Map(); // userId -> phrase
    this.votes = new Map(); // voterId -> targetUserId
    this.lastResult = null;

    this.lifetimeCache = new Map(); // userId -> pts vitalícios (geral, Acromania)
    this.roomLifetimeCache = new Map(); // userId -> pts vitalícios (só nesta sala)
    // userId -> pts feitos SÓ nesta sala e SÓ no mês corrente. É o número
    // exibido na lista de jogadores; o mês vai junto por causa da virada.
    this.roomMonthlyCache = new Map();
    this.roomMonthlyCacheMonth = null;

    this.startedLoop = false;
  }

  // ===== Watchdog =====
  // Vigia independente, no mesmo modelo que já resolveu o freeze do Stop e
  // do Quiz. Roda num timer PRÓPRIO, separado do timer do jogo — de
  // propósito: se o timer do jogo morrer, o do vigia continua vivo e percebe
  // a parada.
  //
  // O Acromania não tinha isso, e havia um comentário no finishRound
  // dizendo literalmente que a sala "congelava pra sempre (ela não tem
  // watchdog)". Agora tem.
  marcarVida() {
    this.ultimoSinalDeVida = Date.now();
  }

  iniciarWatchdog() {
    if (this.watchdogTimer) return;
    this.marcarVida();
    this.watchdogTimer = setInterval(() => {
      // Sala vazia ou esperando gente não é sala travada: ela fica sem timer
      // de propósito.
      if (this.players.size === 0) return;

      const paradaHa = Date.now() - this.ultimoSinalDeVida;
      // Ciclo completo mais longo: 60s escrevendo + 20s votando + 10s de
      // intervalo = 90s. 120s sem NENHUM sinal só acontece se o timer morreu.
      if (paradaHa > 120000) {
        console.error(
          `[watchdog] Sala ${this.roomId} parada há ${Math.round(paradaHa / 1000)}s no estado "${this.state}". Reiniciando.`
        );
        this.marcarVida();
        this.systemMessage("⚠️ A sala travou e foi reiniciada automaticamente.");
        try {
          this.startIntermission();
        } catch (err) {
          console.error(`[watchdog] Falha ao reiniciar a sala ${this.roomId}:`, err);
        }
      }
    }, 20000);
  }

  pararWatchdog() {
    if (this.watchdogTimer) clearInterval(this.watchdogTimer);
    this.watchdogTimer = null;
  }

  countUniquePlayers() {
    return new Set([...this.players.values()].map((p) => p.userId)).size;
  }

  // Verifica inativos a cada minuto, em timer próprio.
  iniciarVigiaInatividade() {
    if (this.vigiaIdleTimer) return;
    this.vigiaIdleTimer = setInterval(() => {
      if (this.players.size === 0) return;
      const { avisar, remover } = verificarInativos(this.players, "acromania");

      for (const { player } of avisar) {
        player.socket?.emit("aviso-inatividade", {
          minutos: minutosRestantes(),
          mensagem: `Você está parado há um tempo. Jogue ou converse em ${minutosRestantes()} min pra não sair da sala.`,
        });
      }

      for (const { socketId, player } of remover) {
        player.socket?.emit("removido-por-inatividade", {
          mensagem: "Você saiu da sala por inatividade.",
        });
        this.systemMessage(`💤 ${player.nickname} saiu por inatividade.`);
        this.removePlayer(socketId);
        player.socket?.leave(this.roomId);
      }
    }, 60000);
  }

  pararVigiaInatividade() {
    if (this.vigiaIdleTimer) clearInterval(this.vigiaIdleTimer);
    this.vigiaIdleTimer = null;
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

    // Nenhuma consulta ao banco pode segurar a entrada na sala: se o banco
    // soluçar aqui, o jogador ficaria numa tela morta sem nunca receber o
    // estado. Cada query tem 3s de limite e, se falhar, usa o padrão e segue.
    // Mesma proteção que o Quiz e o Stop já usam.
    const querySegura = async (promessa, padrao) => {
      try {
        return await Promise.race([
          promessa,
          new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
        ]);
      } catch {
        return padrao;
      }
    };

    if (!this.lifetimeCache.has(userId)) {
      const existing = await querySegura(
        prisma.lifetimeScore.findUnique({
          where: { userId_gameKey: { userId, gameKey: GAME_KEY } },
        }),
        null
      );
      this.lifetimeCache.set(userId, existing?.points || 0);
    }
    if (!this.roomLifetimeCache.has(userId)) {
      const existingRoom = await querySegura(
        prisma.lifetimeScore.findUnique({
          where: { userId_gameKey: { userId, gameKey: `${GAME_KEY}:${this.roomId}` } },
        }),
        null
      );
      this.roomLifetimeCache.set(userId, existingRoom?.points || 0);
    }
    const mesAtual = currentMonthKey();
    if (this.roomMonthlyCacheMonth !== mesAtual) {
      this.roomMonthlyCache.clear();
      this.roomMonthlyCacheMonth = mesAtual;
    }
    if (!this.roomMonthlyCache.has(userId)) {
      const roomMes = await querySegura(
        prisma.monthlyScore.findUnique({
          where: {
            userId_gameKey_monthKey: {
              userId,
              gameKey: `${GAME_KEY}:${this.roomId}`,
              monthKey: mesAtual,
            },
          },
        }),
        null
      );
      this.roomMonthlyCache.set(userId, roomMes?.points || 0);
    }

    socket.join(this.roomId);
    this.iniciarVigiaInatividade();
    socket.emit("acromania-room-state", this.publicState());
    this.iniciarWatchdog();

    if (!alreadyInRoom) {
      // Saudação personalizada (premium) no lugar do texto padrão.
      const saudacoes = await querySegura(carregarSaudacoes(userId), null);
      // Título equipado ao lado do nick — vem do socket, sem consulta.
      const titulo = socket.tituloExibido || null;
      const nomeExibido = nomeComTitulo(nickname, titulo);
      const msgEntrada = mensagemDeEntrada(nomeExibido, saudacoes);
      this.systemMessage(
        msgEntrada || `👋 ${nomeExibido} entrou na sala.`,
        false,
        !!msgEntrada,
        false,
        destaqueDeTitulo(titulo)
      );
      // Guarda a de saída: na hora de sair o socket já pode ter caído.
      const eu = this.players.get(socket.id);
      if (eu && saudacoes?.saida) eu.saudacaoSaida = saudacoes.saida;
      try {
        const me = await querySegura(
          prisma.user.findUnique({ where: { id: userId }, select: { birthDate: true } }),
          null
        );
        if (isBirthdayToday(me?.birthDate)) {
          this.systemMessage(`🎉🎂 Hoje é aniversário de ${nickname}! Parabéns! 🎂🎉`, true, true);
        }
      } catch {
        // não deixa uma falha aqui atrapalhar a entrada na sala
      }
    }

    await this.broadcastOnlinePlayers();

    if (!alreadyInRoom) {
      criarAvisoDeAtividade(this.io, {
        roomId: this.roomId,
        userId,
        roomLabel: this.label,
        jogo: "acromania",
        nickname,
        totalNaSala: new Set([...this.players.values()].map((p) => p.userId)).size,
      });
    }

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
        // Mesma correção do QuizRoom: o addPlayer só consulta o banco quando
        // o userId não está no cache, então sem limpar aqui o valor antigo
        // ficaria preso na memória da sala e a pessoa voltaria vendo a
        // pontuação de antes.
        this.lifetimeCache.delete(leaving.userId);
        this.roomLifetimeCache.delete(leaving.userId);
        this.roomMonthlyCache.delete(leaving.userId);

        const msgSaida = mensagemDeSaida(leaving.nickname, leaving.saudacaoSaida);
        this.systemMessage(msgSaida || `🚪 ${leaving.nickname} saiu da sala.`, false, !!msgSaida);
      }
    }
    await this.broadcastOnlinePlayers();

    // Sala vazia: desliga o vigia. Um timer rodando pra sempre numa sala sem
    // ninguém é vazamento de memória — e são 3 salas de Acromania.
    if (this.players.size === 0) this.pararWatchdog();

    if (this.players.size === 0) this.pararVigiaInatividade();
  }

  async broadcastOnlinePlayers() {
    const monthKey = currentMonthKey();
    if (this.roomMonthlyCacheMonth !== monthKey) {
      this.roomMonthlyCache.clear();
      this.roomMonthlyCacheMonth = monthKey;
    }
    const seen = new Set();
    const list = [];

    // Uma consulta pra todos, em vez de uma por jogador — antes, cada
    // entrada ou saída gerava N consultas ao banco.
    const idsNaSala = [...new Set([...this.players.values()].map((p) => p.userId))];
    // Com timeout: esta consulta roda a cada entrada e saída de jogador. Se o
    // banco soluçar, a lista sai sem os pontos do mês em vez de travar o
    // broadcast inteiro.
    const mensais = idsNaSala.length
      ? await Promise.race([
          prisma.monthlyScore.findMany({
            where: { userId: { in: idsNaSala }, gameKey: GAME_KEY, monthKey },
          }),
          new Promise((resolve) => setTimeout(() => resolve([]), 3000)),
        ]).catch(() => [])
      : [];
    const mensalPorUsuario = Object.fromEntries(mensais.map((m) => [m.userId, m.points]));

    for (const p of this.players.values()) {
      if (seen.has(p.userId)) continue;
      seen.add(p.userId);
      const monthly = { points: mensalPorUsuario[p.userId] || 0 };
      list.push({
        userId: p.userId,
        nickname: p.nickname,
        lifetimePoints: this.lifetimeCache.get(p.userId) || 0,
        roomLifetimePoints: this.roomLifetimeCache.get(p.userId) || 0,
        roomMonthlyPoints: this.roomMonthlyCache.get(p.userId) || 0,
        monthlyPoints: monthly?.points || 0,
      });
    }
    // Ordena pelo mesmo número exibido na lista (pontos da sala), não pelo
    // total vitalício — senão a lista parece fora de ordem pra quem olha.
    list.sort(
      (a, b) =>
        b.roomMonthlyPoints - a.roomMonthlyPoints ||
        b.roomLifetimePoints - a.roomLifetimePoints ||
        a.nickname.localeCompare(b.nickname)
    );
    this.broadcast("acromania-online-players", { players: list });
  }

  broadcast(event, data) {
    this.io.to(this.roomId).emit(event, data);
  }

  systemMessage(message, bold = false, success = false, promotion = false, tituloDestaque = null) {
    this.broadcast("acromania-chat-message", {
      userId: null,
      nickname: "Sistema",
      message,
      system: true,
      bold,
      success,
      promotion,
      tituloDestaque,
      at: Date.now(),
    });
  }

  chatMessage(userId, nickname, message) {
    for (const p of this.players.values()) if (p.userId === userId) marcarAtividade(p);
    this.broadcast("acromania-chat-message", { id: novoIdMensagem(), userId, nickname, message, system: false, at: Date.now() });
  }

  apagarMensagem(id) {
    if (!id) return;
    this.broadcast("chat-message-deleted", { id });
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
      this.marcarVida();
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
    this.currentTheme = this.sortearTema();
    const quantasLetras =
      this.lettersMin + Math.floor(Math.random() * (this.lettersMax - this.lettersMin + 1));
    this.currentLetters = pickRandomLetters(quantasLetras);
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
      this.marcarVida();
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
    marcarAtividade(this.players.get(socket.id));
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

    // Cada jogador recebe, SÓ PRA ELE, o id da própria frase — assim a tela
    // consegue desabilitar o botão dela. A lista pública continua anônima
    // (sem userId), que é o ponto do jogo: ninguém sabe de quem é o quê.
    // Antes disso, o servidor recusava o voto na própria frase em silêncio e
    // a tela marcava como registrado: a pessoa ficava sem voto sem saber.
    for (const p of this.players.values()) {
      const minha = entries.find((e) => e.userId === p.userId);
      if (minha) p.socket?.emit("acromania-minha-frase", { entryId: minha.entryId });
    }
    this.systemMessage("🗳️ Hora de votar na melhor frase!");

    this.timer = setInterval(() => {
      this.timeLeft -= 1;
      this.marcarVida();
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
    marcarAtividade(this.players.get(socket.id));
    if (this.state !== "voting") return;
    const entry = (this.voteEntries || []).find((e) => e.entryId === entryId);
    if (!entry) return;
    if (entry.userId === userId) return; // não pode votar na própria frase
    this.votes.set(userId, entryId);
    socket.emit("acromania-vote-registered", { ok: true, entryId });

    // Simétrico ao submitPhrase: se todo mundo que está na sala já votou,
    // não faz sentido segurar a rodada até o cronômetro zerar. Com pouca
    // gente, essa espera morta era o que mais fazia o jogo parecer lento.
    const totalPlayers = this.countUniquePlayers();
    if (totalPlayers > 0 && this.votes.size >= totalPlayers) {
      // Protegido, como as outras transições assíncronas desta sala: uma
      // falha aqui não pode deixar a rodada sem fim.
      Promise.resolve(this.endVoting()).catch((err) => {
        console.error(`Falha em endVoting (todos votaram) na sala ${this.roomId}:`, err);
        setTimeout(() => this.startIntermission(), 3000);
      });
    }
  }

  async endVoting() {
    this.clearTimer();
    await this.finishRound(this.voteEntries || [], this.votes);
  }

  async finishRound(entries, votes) {
    this.state = "grading";
    this.clearTimer();

    // Tudo daqui pra baixo fica protegido: se qualquer coisa falhar (um
    // broadcast que consulta o banco, por exemplo), o "finally" garante que
    // a sala volta pro intervalo e o jogo continua. Sem isso, uma exceção
    // depois da apuração deixava a linha do startIntermission sem rodar e a
    // sala do Acromania congelava pra sempre (ela não tem watchdog).
    try {
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

    // Quem pontua: todo mundo que recebeu ao menos um voto, mais o bônus de
    // vitória pra quem teve mais votos. Quem não recebeu voto não gera
    // escrita nenhuma no banco.
    const pontosPorEntry = new Map();
    const aPontuar = [];
    for (const e of entries) {
      const recebidos = voteCounts.get(e.entryId) || 0;
      const venceu = winners.some((w) => w.entryId === e.entryId);
      const total = recebidos * this.pointsPerVote + (venceu ? this.pointsForWin : 0);
      pontosPorEntry.set(e.entryId, total);
      if (total > 0) aPontuar.push({ userId: e.userId, pts: total });
    }

    for (const winner of aPontuar) {
      const pts = winner.pts;
      try {
        // Busca os pontos mensais ANTES de somar, pra comparar a patente de
        // antes com a de depois — é assim que a promoção é anunciada.
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

        const oldRank = getAcromaniaRankForPoints(oldMonthlyPoints);
        const newRank = getAcromaniaRankForPoints(newMonthlyPoints);
        // Só anuncia promoção pra quem concorre ao ranking.
        if (oldRank.key !== newRank.key && (await concorreAoRanking(winner.userId))) {
          this.systemMessage(`"${winner.nickname}" você foi promovido para ${newRank.name}.`, false, false, true);
        }

        await prisma.lifetimeScore.upsert({
          where: { userId_gameKey: { userId: winner.userId, gameKey: GAME_KEY } },
          update: { points: { increment: pts } },
          create: { userId: winner.userId, gameKey: GAME_KEY, points: pts },
        });
        this.lifetimeCache.set(winner.userId, (this.lifetimeCache.get(winner.userId) || 0) + pts);

        const roomGameKey = `${GAME_KEY}:${this.roomId}`;
        await prisma.lifetimeScore.upsert({
          where: { userId_gameKey: { userId: winner.userId, gameKey: roomGameKey } },
          update: { points: { increment: pts } },
          create: { userId: winner.userId, gameKey: roomGameKey, points: pts },
        });
        this.roomLifetimeCache.set(winner.userId, (this.roomLifetimeCache.get(winner.userId) || 0) + pts);

        // Mesma pontuação recortada por mês (gameKey com ":" — fora do ranking).
        await prisma.monthlyScore.upsert({
          where: {
            userId_gameKey_monthKey: { userId: winner.userId, gameKey: roomGameKey, monthKey },
          },
          update: { points: { increment: pts } },
          create: { userId: winner.userId, gameKey: roomGameKey, monthKey, points: pts },
        });
        this.roomMonthlyCache.set(
          winner.userId,
          (this.roomMonthlyCache.get(winner.userId) || 0) + pts
        );
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
        // Pontos REAIS daquela frase (votos recebidos + bônus de vitória).
        // Um valor fixo aqui mentiria: agora cada frase vale coisa diferente.
        pontos: pontosPorEntry.get(e.entryId) || 0,
      })),
    };
    this.broadcast("acromania-round-result", this.lastResult);

    if (winners.length > 0) {
      const names = winners.map((w) => this.getNickname(w.userId)).join(" e ");
      const ptsDoVencedor = pontosPorEntry.get(winners[0].entryId) || this.pointsForWin;
      this.systemMessage(`🏆 ${names} venceu a rodada com a frase mais votada! (+${ptsDoVencedor} pts)`, true, true);
    } else {
      this.systemMessage("🤷 Ninguém votou nessa rodada — sem pontos dessa vez.");
    }

    await this.broadcastOnlinePlayers();
    } catch (err) {
      console.error(`Erro ao finalizar rodada do Acromania na sala ${this.roomId}:`, err);
    } finally {
      // Aconteça o que acontecer acima, a sala sempre segue pro intervalo.
      this.startIntermission();
    }
  }

  getNickname(userId) {
    const found = [...this.players.values()].find((p) => p.userId === userId);
    return found?.nickname || "Jogador";
  }
}
