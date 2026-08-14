import { prisma } from "../db.js";
import { getQuizRankForPoints } from "../utils/quizRank.js";
import { isBirthdayToday } from "../utils/birthday.js";
import { trackPlaytime } from "./playtimeTracker.js";
import { currentMonthKey } from "../utils/monthKey.js";
import { concorreAoRanking } from "../utils/rankingElegivel.js";
import { registrarEvento, registrarDistinto } from "./missoes.js";
import { criarAvisoDeAtividade } from "./avisoAtividade.js";
import { carregarSaudacoes, mensagemDeEntrada, mensagemDeSaida } from "../utils/premium.js";
import { novoIdMensagem } from "../utils/chatIds.js";

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
    // Nível da sala ("padrao", "avancado", "arena"). Usado pra decidir se
    // a resposta recebe dicas.
    this.tier = config.tier || "padrao";
    // Respostas com poucas letras não recebem dica nenhuma nas salas
    // avançadas: revelar 2 de 4 letras praticamente entrega a resposta, e
    // o objetivo da sala avançada é justamente exigir conhecimento.
    this.minLetrasParaDica = config.minLetrasParaDica ?? (config.tier === "avancado" ? 5 : 0);
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
    // Pontos do MÊS por jogador — é o que define a patente (patente é
    // conceito mensal). Fica em cache igual ao vitalício: uma leitura na
    // entrada e incremento em memória a cada acerto, sem consultar o banco
    // a cada atualização da lista.
    this.mensalCache = new Map();
    this.roomLifetimeCache = new Map();

    this.state = "waiting"; // waiting | intermission | active
    this.currentQuestion = null; // { id, question, answer }
    this.revealedIndices = new Set(); // posições (índices) já reveladas na resposta atual
    this.timeLeft = 0;
    this.timer = null;
    this.revealTimer = null;
    // Watchdog: guarda o instante do último "sinal de vida" da sala (um tick,
    // uma pergunta nova, um intervalo iniciado). Um vigia independente checa
    // periodicamente se esse instante ficou velho demais — se ficou, a sala
    // congelou e precisa ser reiniciada. É a mesma proteção que resolveu o
    // freeze do Stop; o Quiz não tinha, e por isso uma falha rara no
    // agendamento do intervalo deixava a rodada parada pra sempre.
    this.ultimoSinalDeVida = Date.now();
    this.watchdogTimer = null;
    // Fila de perguntas embaralhada da volta atual. Vai sendo consumida a
    // cada rodada; quando esvazia, uma nova volta é montada e reembaralhada.
    this.filaPerguntas = [];

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
    // Quem estava na sala quando a pergunta atual começou — base do cálculo
    // de aproveitamento.
    this.playersAtQuestionStart = new Set();

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
    // Busca a tag do clã uma vez, na entrada — assim ela pode ser usada em
    // toda mensagem da pessoa sem consultar o banco de novo a cada acerto.
    let clanTag = null;
    try {
      const u = await prisma.user.findUnique({
        where: { id: userId },
        select: { clan: { select: { tag: true } } },
      });
      clanTag = u?.clan?.tag || null;
    } catch {
      // Sem clã ou falha momentânea: segue sem a tag, não atrapalha o jogo.
    }

    this.players.set(socket.id, { userId, nickname, socket, clanTag, joinedAt: Date.now() });

    if (!this.lifetimeCache.has(userId)) {
      const existing = await prisma.lifetimeScore.findUnique({
        where: { userId_gameKey: { userId, gameKey: GAME_KEY } },
      });
      this.lifetimeCache.set(userId, existing?.points || 0);
    }
    if (!this.mensalCache.has(userId)) {
      const mes = await prisma.monthlyScore.findUnique({
        where: { userId_gameKey_monthKey: { userId, gameKey: GAME_KEY, monthKey: currentMonthKey() } },
      });
      this.mensalCache.set(userId, mes?.points || 0);
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
      // Saudação personalizada (premium) substitui o "entrou na sala"
      // padrão; sem nada configurado, segue o texto de sempre.
      const saudacoes = await carregarSaudacoes(userId);
      const msgEntrada = mensagemDeEntrada(nickname, saudacoes);
      this.systemMessage(msgEntrada || `👋 ${nickname} entrou na sala.`, false, !!msgEntrada);
      // Guarda a saudação de saída: na hora de sair, o socket pode já ter
      // caído e não daria pra consultar o banco.
      const eu = this.players.get(socket.id);
      if (eu && saudacoes?.saida) eu.saudacaoSaida = saudacoes.saida;

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

    // Avisa as outras salas que apareceu movimento aqui.
    if (!alreadyInRoom) {
      criarAvisoDeAtividade(this.io, {
        roomId: this.roomId,
        roomLabel: this.label,
        jogo: "quiz",
        nickname,
        totalNaSala: this.countUniquePlayers(),
      });
    }

    // Sala só roda perguntas quando tem gente — assim ninguém entra e cai
    // no meio de uma pergunta que já está acabando.
    if (this.state === "waiting" && this.players.size > 0) {
      this.iniciarWatchdog();
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

    // Sala vazia: para o ciclo e volta pro estado de espera, pra não ficar
    // consumindo perguntas e rodando timer à toa.
    if (this.players.size === 0) {
      this.clearTimers();
      this.pararWatchdog();
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
        // Patente é conceito MENSAL: quem define é o desempenho do mês.
        rank: getQuizRankForPoints(this.mensalCache.get(p.userId) || 0, { userId: p.userId }),
      });
    }
    // Desempate por nome: sem isso, jogadores com a mesma pontuação trocam
    // de posição a cada atualização da lista, o que fica visualmente ruim.
    list.sort(
      (a, b) =>
        b.roomLifetimePoints - a.roomLifetimePoints ||
        a.nickname.localeCompare(b.nickname)
    );
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

  // Registra que a sala deu sinal de vida agora. Chamado a cada tick e a cada
  // transição de estado. O watchdog usa isso pra saber se a sala travou.
  marcarVida() {
    this.ultimoSinalDeVida = Date.now();
  }

  // Liga o vigia independente. Ele roda num timer próprio, separado do timer
  // do jogo — de propósito: se o timer do jogo morrer (o bug que causava o
  // freeze), o do watchdog continua vivo e percebe a parada.
  iniciarWatchdog() {
    if (this.watchdogTimer) return; // já ligado
    this.marcarVida();
    this.watchdogTimer = setInterval(() => {
      // Sala sem gente não precisa de vigia — ela fica em "waiting" de
      // propósito, sem timer, e isso não é um travamento.
      if (this.players.size === 0 || this.state === "waiting") return;

      const paradaHa = Date.now() - this.ultimoSinalDeVida;
      // Um ciclo normal (pergunta + intervalo) leva no máximo ~60s numa sala
      // lenta. 45s sem NENHUM sinal de vida só acontece se o timer do jogo
      // morreu. Aí forçamos um recomeço limpo.
      if (paradaHa > 45000) {
        console.error(
          `[watchdog] Sala ${this.roomId} parada há ${Math.round(paradaHa / 1000)}s no estado "${this.state}". Reiniciando.`
        );
        this.marcarVida(); // evita disparar de novo antes do restart assentar
        this.systemMessage("⚠️ A sala travou e foi reiniciada automaticamente.");
        try {
          this.startIntermission();
        } catch (err) {
          console.error(`[watchdog] Falha ao reiniciar a sala ${this.roomId}:`, err);
        }
      }
    }, 15000);
  }

  pararWatchdog() {
    if (this.watchdogTimer) clearInterval(this.watchdogTimer);
    this.watchdogTimer = null;
  }

  systemMessage(message, bold = false, success = false, promotion = false) {
    this.broadcast("quiz-chat-message", { userId: null, nickname: "Sistema", message, system: true, bold, success, promotion, at: Date.now() });
  }

  // Tag do clã de quem está na sala. Vem do cache carregado na entrada, pra
  // não consultar o banco a cada mensagem.
  clanTagDe(userId) {
    const p = [...this.players.values()].find((x) => x.userId === userId);
    return p?.clanTag || null;
  }

  chatMessage(userId, nickname, message) {
    this.broadcast("quiz-chat-message", {
      id: novoIdMensagem(),
      userId,
      nickname,
      clanTag: this.clanTagDe(userId),
      message,
      at: Date.now(),
    });
  }

  apagarMensagem(id) {
    if (!id) return;
    this.broadcast("chat-message-deleted", { id });
  }

  startIntermission() {
    this.clearTimers();
    // Garante o vigia ligado sempre que a sala dá um passo. Antes, o watchdog
    // só ligava quando a primeira pessoa entrava numa sala em "waiting" — se a
    // sala já estava rodando por outro caminho (ex.: servidor reiniciou no
    // meio de uma partida), ela ficava sem vigia e um travamento não era
    // resgatado. Como iniciarWatchdog é idempotente, chamar aqui é seguro.
    if (this.players.size > 0) this.iniciarWatchdog();
    this.state = "intermission";
    this.currentQuestion = null;
    this.timeLeft = this.intermissionSeconds;
    this.marcarVida();
    this.broadcast("quiz-intermission", { seconds: this.intermissionSeconds });

    this.timer = setInterval(() => {
      this.timeLeft -= 1;
      this.marcarVida();
      this.broadcast("quiz-tick", { state: this.state, timeLeft: this.timeLeft });
      if (this.timeLeft <= 0) {
        // Protegido: essas funções são assíncronas e desligam o timer logo
        // no início. Sem o catch, uma falha no meio deixaria a sala parada
        // pra sempre, sem timer nenhum.
        Promise.resolve(this.startQuestion()).catch((err) => {
          console.error(`Falha ao iniciar pergunta na sala ${this.roomId}:`, err);
          this.systemMessage("⚠️ Problema técnico. Reiniciando...");
          setTimeout(() => this.startIntermission(), 3000);
        });
      }
    }, 1000);
  }

  // Monta a "fila da rodada": pega todos os IDs disponíveis pra essa sala,
  // embaralha uma vez e guarda. As perguntas são servidas nessa ordem até
  // acabar, e só então a fila é remontada (com embaralhamento novo).
  //
  // Isso troca o sorteio aleatório antigo, que tentava até 20 vezes achar
  // uma pergunta ainda não usada — quanto mais perto de esgotar a lista,
  // mais ele falhava (com 195 de 200 usadas, falhava 61% das vezes). Além
  // de nunca falhar, agora é 1 consulta por volta inteira em vez de até 20
  // por pergunta, o que alivia bastante o banco.
  async montarFilaDePerguntas() {
    const where = { status: "approved" };
    if (this.themeKey) where.themeKey = this.themeKey;
    if (this.difficultyFilter) {
      where.difficulty = Array.isArray(this.difficultyFilter)
        ? { in: this.difficultyFilter }
        : this.difficultyFilter;
    }

    const ids = await Promise.race([
      prisma.quizQuestion.findMany({ where, select: { id: true } }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout ao montar fila")), 8000)),
    ]);

    // Embaralhamento Fisher-Yates: cada ordem possível tem a mesma chance.
    const fila = ids.map((q) => q.id);
    for (let i = fila.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fila[i], fila[j]] = [fila[j], fila[i]];
    }

    this.filaPerguntas = fila;
    return fila.length;
  }

  async pickQuestion() {
    // Toda ida ao banco aqui passa por este helper com timeout. Sem ele, a
    // query da VIRADA DE FILA (quando as perguntas da volta acabam e a fila é
    // remontada) ficava sem proteção: se o banco travasse nesse instante, o
    // await nunca resolvia e a sala congelava pra sempre — exatamente na
    // pergunta em que a volta fecha (ex.: a 66ª numa sala de 66 perguntas).
    const comTimeout = (promessa) =>
      Promise.race([
        promessa,
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout no banco")), 8000)),
      ]);

    // Fila vazia (primeira pergunta da sala, ou a volta anterior acabou):
    // monta uma nova, já embaralhada.
    if (!this.filaPerguntas || this.filaPerguntas.length === 0) {
      const total = await this.montarFilaDePerguntas();
      if (total === 0) return null;
    }

    // Serve a próxima da fila. O laço cobre o caso raro de uma pergunta ter
    // sido apagada ou reprovada depois que a fila foi montada.
    while (this.filaPerguntas.length > 0) {
      const id = this.filaPerguntas.shift();
      const question = await comTimeout(
        prisma.quizQuestion.findFirst({ where: { id, status: "approved" } })
      );
      if (question) return question;
    }

    // A fila inteira ficou inválida — remonta e tenta de novo, uma vez só
    // (evita laço infinito se a sala tiver ficado sem perguntas).
    const total = await this.montarFilaDePerguntas();
    if (total === 0) return null;
    const id = this.filaPerguntas.shift();
    return comTimeout(
      prisma.quizQuestion.findFirst({ where: { id, status: "approved" } })
    );
  }

  // Índices (posições) da resposta que contam como "letra" — espaços e
  // pontuação não são escondidos nem contam pro limite de 50%.
  // Índices que PODEM ser revelados como dica. Na sala avançada, só letras
  // entram na dica — números nunca são revelados (mostrar o dígito de um ano
  // ou o "1" de "Fórmula 1" praticamente entrega a resposta). Nas outras
  // salas, letras e números continuam valendo.
  revealableIndices() {
    const answer = this.currentQuestion.answer;
    const regex = this.tier === "avancado" ? /[a-zA-ZÀ-ÿ]/ : /[a-zA-ZÀ-ÿ0-9]/;
    const indices = [];
    for (let i = 0; i < answer.length; i++) {
      if (regex.test(answer[i])) indices.push(i);
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

  // A resposta é curta demais pra receber dicas nesta sala?
  respostaCurtaDemais() {
    if (!this.minLetrasParaDica) return false;
    // Conta só o que pode virar dica: na sala avançada, números ficam de
    // fora — "Fórmula 1" tem 7 letras de dica, não 8. A resposta precisa
    // ter MAIS de 4 letras (>= 5) pra receber qualquer revelação.
    return this.revealableIndices().length < this.minLetrasParaDica;
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
    // Guarda quem já estava na sala quando a pergunta COMEÇOU. É esse o
    // conjunto usado pra calcular aproveitamento: quem viu a pergunta
    // inteira e não respondeu conta como erro, mas quem entrou no meio
    // (ou saiu antes do fim) não é penalizado por algo que não viu.
    this.playersAtQuestionStart = new Set([...this.players.values()].map((p) => p.userId));
    this.timeLeft = this.questionSeconds;
    this.questionStartedAt = Date.now();
    if (this.roundsPerTurn) this.turnRound += 1;

    // Já revela uma fatia das letras de cara. Sem isso, respostas longas
    // ficavam praticamente ilegíveis no começo (as letras pingavam de uma em
    // uma, e uma palavra de 15 letras levava tempo demais pra dar qualquer
    // pista útil). Quanto maior a resposta, mais letras aparecem de início.
    const allIndices = this.revealableIndices();
    if (!this.respostaCurtaDemais()) {
      const initialCount = Math.min(
        Math.floor(allIndices.length * this.initialRevealPercent),
        Math.floor(allIndices.length * this.maxRevealPercent)
      );
      const shuffled = [...allIndices].sort(() => Math.random() - 0.5);
      for (let i = 0; i < initialCount; i++) this.revealedIndices.add(shuffled[i]);
    }

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
      this.marcarVida();
      this.broadcast("quiz-tick", { state: this.state, timeLeft: this.timeLeft });
      if (this.timeLeft <= 0) {
        Promise.resolve(this.endQuestion(null)).catch((err) => {
          console.error(`Falha ao encerrar pergunta na sala ${this.roomId}:`, err);
          this.startIntermission();
        });
      }
    }, 1000);

    // Resposta curta em sala avançada não recebe dica nenhuma: nem a
    // revelação inicial, nem as letras que pingam durante a rodada. Numa
    // palavra de 4 letras, revelar uma já entrega quase tudo.
    if (this.respostaCurtaDemais()) return;

    // Revela mais uma letra a cada X segundos, nunca passando do limite
    // configurado pra essa sala (salas avançadas revelam menos, pra ficar
    // mais difícil de verdade). Se a resposta passou do filtro de tamanho
    // mínimo, garante pelo menos 1 letra de dica — sem isso, 10% de uma
    // resposta de 5 a 9 letras arredondaria pra zero e a sala ficaria sem
    // dica nenhuma mesmo em respostas longas o bastante pra merecer uma.
    this.revealTimer = setInterval(() => {
      const indices = this.revealableIndices();
      const maxReveal = Math.max(1, Math.floor(indices.length * this.maxRevealPercent));
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
        clanTag: this.clanTagDe(userId),
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
            this.mensalCache.set(userId, (this.mensalCache.get(userId) || 0) + this.pointsPerCorrect);

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

          // Missões: na arena todo mundo que acerta pontua, então todos
          // registram o acerto.
          for (const [userId] of scorers) {
            registrarEvento(userId, "quiz_acerto").catch(() => {});
            if (this.themeKey) {
              registrarDistinto(userId, "tema_distinto", this.themeKey).catch(() => {});
            }
          }

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
        // finishTurn protegido: se ele falhar, a sala AINDA precisa reagendar
        // a próxima pergunta. Sem esse try, uma exceção aqui pulava o
        // startIntermission e a sala congelava justamente ao fechar o turno.
        try {
          if (this.roundsPerTurn && this.turnRound >= this.roundsPerTurn) {
            await this.finishTurn();
          }
        } catch (err) {
          console.error(`Falha ao fechar turno na arena ${this.roomId}:`, err);
        }
        this.startIntermission();
      }
      return;
    }

    try {
      if (winner) {
        const pts = this.pointsPerCorrect;

        // A sequência de acertos é calculada AGORA, antes de qualquer escrita
        // no banco. O acerto já é fato consumado no momento em que a pessoa
        // acerta — se uma gravação de pontos falhar mais adiante e cair no
        // catch, a streak NÃO pode ser perdida junto. Antes, o incremento
        // ficava lá embaixo e uma exceção anterior o deixava órfão: o
        // jogador acertava e mesmo assim perdia a sequência.
        if (this.streakUserId === winner.userId) {
          this.streakCount += 1;
        } else {
          this.streakUserId = winner.userId;
          this.streakCount = 1;
        }

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
          this.mensalCache.set(winner.userId, (this.mensalCache.get(winner.userId) || 0) + pts);

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

        // Missões: acerto no Quiz e variedade de temas.
        registrarEvento(winner.userId, "quiz_acerto").catch(() => {});
        if (this.themeKey) {
          registrarDistinto(winner.userId, "tema_distinto", this.themeKey).catch(() => {});
        }

        const timeText = elapsedSeconds !== null ? ` em ${elapsedSeconds}s` : "";
        const tag = this.clanTagDe(winner.userId);
        const tagText = tag ? `[${tag}] ` : "";
        this.systemMessage(
          `✅ ${tagText}${winner.nickname} acertou${timeText}! A resposta era "${question.answer}" (+${pts} pts)`,
          true,
          true // success = true -> aparece em verde no chat
        );

        // A pessoa "comemora" no chat automaticamente, no nome dela — com a
        // frase que escolheu no perfil, ou um "Ponto!" padrão se ainda não
        // configurou nenhuma. Mesmo comportamento das arenas.
        this.broadcast("quiz-chat-message", {
          userId: winner.userId,
          nickname: winner.nickname,
          clanTag: this.clanTagDe(winner.userId),
          message: celebration || "Ponto!",
          system: false,
          at: Date.now(),
        });

        // Placar do turno (modo arena) — 1 ponto por acerto, independente
        // da pontuação normal da sala.
        if (this.roundsPerTurn) {
          this.turnScores.set(winner.userId, (this.turnScores.get(winner.userId) || 0) + 1);
        }

        // Sequência de respostas certas seguidas (streak) — o cálculo já foi
        // feito lá no início do bloco, à prova de falhas nas gravações. Aqui
        // só anunciamos, a partir da 2ª seguida (a 1ª sozinha ainda não é
        // uma "sequência"). Todo o anúncio fica isolado num try próprio: se
        // salvar o recorde falhar, a sequência do jogador na memória segue
        // intacta e o jogo continua.
        if (this.streakCount >= 2) {
          try {
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
          } catch (err) {
            console.error(`Falha ao anunciar sequência na sala ${this.roomId}:`, err.message);
          }
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
      // finishTurn protegido: se ele lançar, o startIntermission abaixo ainda
      // roda. Sem isso, uma falha ao fechar o turno (a cada X rodadas)
      // deixava a sala parada pra sempre — o freeze "depois de acertar".
      try {
        if (this.roundsPerTurn && this.turnRound >= this.roundsPerTurn) {
          await this.finishTurn();
        }
      } catch (err) {
        console.error(`Falha ao fechar turno na sala ${this.roomId}:`, err);
      }
      this.startIntermission();
    }
  }

  // Avisa no chat quando a posição da pessoa no ranking mensal muda — dá
  // aquela sensação de progresso constante, sem ela precisar sair da sala
  // pra conferir. Só anuncia quando MUDA (não repete a mesma posição).
  async announceRankingPosition(userId, nickname) {
    try {
      // Quem não concorre ao ranking (visitante ou ADMIN) não recebe aviso
      // de posição — seria confuso anunciar uma colocação que não vale.
      if (!(await concorreAoRanking(userId))) return;

      const monthKey = currentMonthKey();
      const myScore = await prisma.monthlyScore.findUnique({
        where: { userId_gameKey_monthKey: { userId, gameKey: GAME_KEY, monthKey } },
      });
      if (!myScore) return;

      const ahead = await prisma.monthlyScore.count({
        where: {
          gameKey: GAME_KEY,
          monthKey,
          user: { role: { not: "ADMIN" }, isGuest: false, ocultoNoRanking: false },
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
    // Mesma regra do modo normal: conta todo mundo que viu a pergunta
    // inteira, não só quem arriscou responder.
    const aindaPresentes = new Set([...this.players.values()].map((p) => p.userId));
    const viramAPergunta = [...(this.playersAtQuestionStart || [])].filter((id) =>
      aindaPresentes.has(id)
    );

    for (const userId of viramAPergunta) {
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
    // Conta TODO MUNDO que viu a pergunta do início ao fim — não só quem
    // arriscou uma resposta. Sem isso, quem só responde quando tem certeza
    // absoluta ficava com 100% de aproveitamento, o que media "precisão ao
    // arriscar" em vez de conhecimento do tema.
    //
    // Quem entrou no meio da pergunta fica de fora (não viu tudo), e quem
    // saiu antes do fim também — só conta quem estava presente nos dois
    // momentos.
    const aindaPresentes = new Set([...this.players.values()].map((p) => p.userId));
    const viramAPergunta = [...(this.playersAtQuestionStart || [])].filter((id) =>
      aindaPresentes.has(id)
    );

    if (viramAPergunta.length === 0) return;

    for (const userId of viramAPergunta) {
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
          this.mensalCache.set(entry.userId, (this.mensalCache.get(entry.userId) || 0) + bonus);
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
