import { prisma } from "../db.js";
import { getRankForPoints } from "../utils/rank.js";
import { isBirthdayToday } from "../utils/birthday.js";
import { trackPlaytime } from "./playtimeTracker.js";
import { currentMonthKey } from "../utils/monthKey.js";
import { concorreAoRanking } from "../utils/rankingElegivel.js";
import { carregarSaudacoes, mensagemDeEntrada, mensagemDeSaida } from "../utils/premium.js";
import { registrarEvento, registrarDistinto } from "./missoes.js";
import { criarAvisoDeAtividade } from "./avisoAtividade.js";
import { grupoDaSala, RAPIDO_SEGUNDOS, tituloStopDesbloqueado } from "./titulosConfig.js";
import { pareceePalavraReal } from "../utils/palavraPlausivel.js";
import { novoIdMensagem } from "../utils/chatIds.js";
import { nomeComTitulo, destaqueDeTitulo } from "../utils/tituloEntrada.js";

const ROUNDS_PER_BLOCK = 10;
const BLOCK_BONUS = [150, 100, 50]; // 1º, 2º, 3º lugar do bloco
const LETTERS = "ABCDEFGHIJLMNOPQRSTUVXZ".split(""); // agora inclui X e Z também

// Peso de cada letra no sorteio. Letras com poucas palavras em português
// (Q, X, Z) aparecem bem menos: quando caem, a rodada vira um sufoco nos
// seis temas ao mesmo tempo — "profissão com X" ou "fruta com Q" trava até
// quem joga há anos, e a rodada acaba 0 a 0.
//
// Peso 1 = frequência normal. As difíceis ficam ~5x mais raras, mas
// continuam existindo: quando saem, viram um evento na sala.
const PESO_LETRAS = {
  Q: 0.2,
  X: 0.2,
  Z: 0.25,
  // Não são raras como Q/X/Z, mas também limitam bastante os temas.
  H: 0.6,
  N: 0.7,
  U: 0.7,
  I: 0.8,
};

function pesoDaLetra(letra) {
  return PESO_LETRAS[letra] ?? 1;
}
const GAME_KEY = "stop";
const SKIP_VOTE_MIN_PLAYERS = 3;

// Pares de temas parecidos demais pra sair juntos na mesma rodada — dá pra
// adicionar mais pares aqui no futuro, sem mexer na lógica do sorteio.
const CONFLICTING_THEME_PAIRS = [
  ["idiomas", "gentilico_paises"],
];

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
    // Sala de brincadeira: nada aqui vai pra ranking, patente ou premiação.
    this.semPontuacao = !!config.semPontuacao;
    // Sala privada: criada por um jogador, com código de convite. A
    // validação das palavras é feita pelos próprios participantes.
    this.privada = !!config.privada;
    this.codigo = config.codigo || null;
    this.validacaoPorVoto = !!config.validacaoPorVoto;
    this.votingSeconds = config.votingSeconds ?? 20;
    this.wordVotes = new Map();
    this.votingItems = [];
    // Votação sincronizada: todos julgam o mesmo tema ao mesmo tempo.
    this.votingTemas = [];
    this.temaAtualIndex = -1;
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
    // Última posição no ranking mensal anunciada pra cada pessoa — evita
    // repetir o mesmo aviso rodada após rodada.
    this.lastAnnouncedPosition = new Map(); // userId -> posição
    this.timer = null;
    this.timeLeft = 0;

    // Sala privada começa parada, esperando o dono dar o start. Sem isso,
    // as rodadas rodariam sozinhas enquanto o criador ainda está chamando
    // a galera no zap — e ele voltaria pra sala já no meio do jogo.
    if (this.privada) {
      this.state = "aguardando";
      this.donoId = config.donoId || null;
    } else {
      this.startIntermission();
    }
  }

  // Estado da sala de espera, enviado pra quem está dentro.
  estadoDaEspera() {
    const jogadores = [...this.players.values()];
    const unicos = new Set(jogadores.map((p) => p.userId));
    return {
      aguardando: true,
      donoId: this.donoId,
      jogadores: [...unicos].map((id) => {
        const p = jogadores.find((x) => x.userId === id);
        return { userId: id, nickname: p?.nickname || "?" };
      }),
      minimoParaComecar: 2,
      podeComecar: unicos.size >= 2,
    };
  }

  broadcastEspera() {
    if (this.state !== "aguardando") return;
    this.broadcast("sala-aguardando", this.estadoDaEspera());
  }

  // Só o dono da sala inicia, e só com gente suficiente.
  iniciarPartida(userId) {
    if (this.state !== "aguardando") return;
    if (this.donoId && userId !== this.donoId) return;

    const unicos = new Set([...this.players.values()].map((p) => p.userId));
    if (unicos.size < 2) return;

    this.systemMessage("🎲 A partida vai começar! Boa sorte.");
    this.startIntermission();
  }

  broadcast(event, payload) {
    this.io.to(this.roomId).emit(event, payload);
  }

  async addPlayer(socket, userId, nickname) {
    // NENHUMA consulta ao banco pode segurar a entrada na sala. Se o banco
    // der um soluço aqui, o jogador ficaria olhando uma tela morta sem nunca
    // receber o estado da sala — foi exatamente um travamento assim que
    // aconteceu na entrada da Sala Avançada. Toda query deste caminho passa
    // por este helper: 3s de limite e, se falhar, usa o valor padrão e segue
    // (os pontos reais se ajustam nas próximas jogadas).
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
      const existing = await querySegura(
        prisma.lifetimeScore.findUnique({
          where: { userId_gameKey: { userId, gameKey: GAME_KEY } },
        }),
        null
      );
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

    this.players.set(socket.id, { userId, nickname, socket, joinedAt: Date.now() });

    // Sala sem pontuação começa do zero pra quem entra: não carrega nada do
    // banco. O placar dali é só da partida em andamento, e ninguém deve
    // chegar já com pontos de outras salas no marcador.
    if (this.semPontuacao) {
      if (!this.blockTotals.has(userId)) this.blockTotals.set(userId, 0);
    } else {
      if (!this.blockTotals.has(userId)) {
        // Recupera a pontuação do bloco atual salva no banco (se o jogador já
        // tinha pontuado nessa sala antes de sair, ou se o servidor reiniciou).
        const saved = await querySegura(
          prisma.blockScore.findUnique({
            where: { userId_gameKey_roomId: { userId, gameKey: GAME_KEY, roomId: this.roomId } },
          }),
          null
        );
        this.blockTotals.set(userId, saved?.points || 0);
      }

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
            where: { userId_gameKey: { userId, gameKey: this.roomGameKey } },
          }),
          null
        );
        this.roomLifetimeCache.set(userId, existingRoom?.points || 0);
      }
    }

    socket.join(this.roomId);
    socket.emit("room-state", { ...this.publicState(), myAnswers: this.answers.get(userId) || {} });
    socket.emit("skip-vote-update", {
      votes: this.skipVotes.size,
      needed: this.countUniquePlayers(),
      minPlayers: SKIP_VOTE_MIN_PLAYERS,
    });
    if (!alreadyInRoom) {
      // Título equipado ao lado do nick — vem do socket, sem consulta.
      const tituloEntrada = socket.tituloExibido || null;
      this.systemMessage(
        `👋 ${nomeComTitulo(nickname, tituloEntrada)} entrou na sala.`,
        false,
        false,
        false,
        destaqueDeTitulo(tituloEntrada)
      );

      // Se for aniversário de quem acabou de entrar, todo mundo vê os parabéns.
      try {
        const me = await prisma.user.findUnique({
          where: { id: userId },
          select: { birthDate: true },
        });
        if (isBirthdayToday(me?.birthDate)) {
          this.systemMessage(`🎉🎂 Hoje é aniversário de ${nickname}! Parabéns! 🎂🎉`, true, true);
        }

        // Saudação personalizada (premium). Sem nada configurado, não
        // acontece nada.
        const saudacoes = await carregarSaudacoes(userId);
        const msgEntrada = mensagemDeEntrada(nickname, saudacoes);
        if (msgEntrada) this.systemMessage(msgEntrada, false, true);
        // Guarda a de saída agora: quando a pessoa sair, o socket já pode
        // ter caído e não daria pra consultar o banco.
        const p = this.players.get(socket.id);
        if (p && saudacoes?.saida) p.saudacaoSaida = saudacoes.saida;
      } catch {
        // não deixa uma falha aqui atrapalhar a entrada na sala
      }
    }

    await this.broadcastOnlinePlayers();
    // Sala privada em espera: manda o estado pra quem acabou de entrar (e
    // atualiza os demais, que agora veem mais um na lista).
    this.broadcastEspera();

    // Avisa quem está em outras salas que apareceu movimento aqui. Salas
    // privadas ficam de fora: elas são pra grupos fechados, e anunciar
    // seria convidar estranhos pra uma partida entre amigos.
    if (!alreadyInRoom && !this.privada) {
      criarAvisoDeAtividade(this.io, {
        roomId: this.roomId,
        userId,
        roomLabel: this.label,
        jogo: "stop",
        nickname,
        totalNaSala: this.countUniquePlayers(),
      });
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
        if (this.skipVotes.has(leaving.userId)) {
          this.skipVotes.delete(leaving.userId);
          this.broadcastSkipVoteUpdate();
        }
        const msgSaida = mensagemDeSaida(leaving.nickname, leaving.saudacaoSaida);
        this.systemMessage(msgSaida || `🚪 ${leaving.nickname} saiu da sala.`, false, !!msgSaida);
      }
    }
    await this.broadcastOnlinePlayers();
    // Sala privada ainda esperando: atualiza a lista de quem está lá e se
    // já dá pra começar.
    this.broadcastEspera();
  }

  // Lista de jogadores online na sala com pontuação vitalícia (do jogo Stop) e patente —
  // usada na tabelinha lateral da tela do jogo. Inclui também pontos do bloco atual (sala)
  // e do mês corrente, usados na barra superior estilo "Pts Sala / Pts Mês".
  async broadcastOnlinePlayers() {
    const monthKey = currentMonthKey();
    const seen = new Set();
    const list = [];

    // Busca a pontuação mensal de TODOS de uma vez. Antes era uma consulta
    // por jogador (mais outra pra posição no ranking) toda vez que alguém
    // entrava ou saía — numa sala de 10 pessoas isso eram 20 idas ao banco
    // a cada movimento. Agora são 2, independente de quantos estão na sala.
    const idsNaSala = [...new Set([...this.players.values()].map((p) => p.userId))];
    const mensais = idsNaSala.length
      ? await prisma.monthlyScore.findMany({
          where: { userId: { in: idsNaSala }, gameKey: GAME_KEY, monthKey },
        })
      : [];
    const mensalPorUsuario = Object.fromEntries(mensais.map((m) => [m.userId, m.points]));

    // As posições no ranking também vêm juntas: uma consulta traz todo
    // mundo que pontuou mais que o menor pontuador da sala, e a posição
    // de cada um sai daí por contagem em memória.
    const posicaoPorUsuario = {};
    const pontuadores = idsNaSala.map((id) => mensalPorUsuario[id] || 0).filter((v) => v > 0);
    if (pontuadores.length > 0 && !this.semPontuacao) {
      try {
        const menor = Math.min(...pontuadores);
        const acima = await prisma.monthlyScore.findMany({
          where: {
            gameKey: GAME_KEY,
            monthKey,
            points: { gte: menor },
            user: {
            role: { not: "ADMIN" },
            isGuest: false,
            ocultoNoRanking: false,
            // Ocultação só deste jogo (ver ocultoNosRankings no schema).
            NOT: { ocultoNosRankings: { has: GAME_KEY } },
          },
          },
          select: { points: true },
        });
        const todosPontos = acima.map((a) => a.points);
        for (const id of idsNaSala) {
          const meus = mensalPorUsuario[id] || 0;
          if (meus > 0) {
            posicaoPorUsuario[id] = todosPontos.filter((p) => p > meus).length + 1;
          }
        }
      } catch {
        // Sem posição é melhor que travar a lista de jogadores.
      }
    }

    for (const p of this.players.values()) {
      if (seen.has(p.userId)) continue;
      seen.add(p.userId);

      // Sala sem pontuação: mostra só o placar da partida em andamento.
      // Exibir o vitalício e o mensal aqui daria a impressão de que os
      // pontos da brincadeira estão contando pro ranking — e não estão.
      if (this.semPontuacao) {
        list.push({
          userId: p.userId,
          nickname: p.nickname,
          lifetimePoints: 0,
          roomLifetimePoints: 0,
          monthlyPoints: 0,
          blockPoints: this.blockTotals.get(p.userId) || 0,
          rank: null,
          semPontuacao: true,
        });
        continue;
      }

      const lifetimePoints = this.lifetimeCache.get(p.userId) || 0;
      const roomLifetimePoints = this.roomLifetimeCache.get(p.userId) || 0;
      const pontosMes = mensalPorUsuario[p.userId] || 0;
      list.push({
        userId: p.userId,
        nickname: p.nickname,
        lifetimePoints,
        roomLifetimePoints,
        monthlyPoints: pontosMes,
        blockPoints: this.blockTotals.get(p.userId) || 0,
        // Patente é conceito MENSAL: usa os pontos do mês, não os vitalícios.
        // Os pontos vitalícios continuam sendo enviados (a interface mostra
        // os dois números), mas quem define a patente é o desempenho do mês.
        rank: getRankForPoints(pontosMes, { userId: p.userId, gameKey: GAME_KEY }),
        position: posicaoPorUsuario[p.userId] || null,
      });
    }

    // Ordena pelo MESMO número que aparece na coluna da lista: quem lidera
    // fica no topo. Antes ordenava pelo total vitalício enquanto a coluna
    // mostrava os pontos da sala — o que fazia a lista parecer desordenada.
    if (this.semPontuacao) {
      // Sala de brincadeira: o placar da partida é o único número que existe.
      list.sort((a, b) => b.blockPoints - a.blockPoints || a.nickname.localeCompare(b.nickname));
    } else {
      list.sort(
        (a, b) =>
          b.roomLifetimePoints - a.roomLifetimePoints ||
          b.lifetimePoints - a.lifetimePoints ||
          a.nickname.localeCompare(b.nickname)
      );
    }
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
      if (this.timeLeft <= 0) {
        // startRound é assíncrono e desliga o timer atual logo na primeira
        // linha. Se ele falhar no meio (banco instável, por exemplo), a sala
        // ficaria SEM timer nenhum — travada pra sempre. O catch abaixo
        // devolve a sala pro intervalo, que tenta a rodada de novo.
        Promise.resolve(this.startRound()).catch((err) => {
          console.error(`Falha ao iniciar rodada na sala ${this.roomId}:`, err);
          this.systemMessage("⚠️ Tivemos um problema técnico. Reiniciando a rodada...");
          setTimeout(() => this.startIntermission(), 3000);
        });
      }
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
    // Sala sem tema nenhum não tem como jogar. Isso não deveria acontecer,
    // mas se acontecer (banco sem os temas cadastrados, por exemplo), é
    // melhor avisar do que deixar a rodada rodar vazia e travar tudo.
    if (!this.allThemes || this.allThemes.length === 0) {
      console.error(`Sala ${this.roomId} está sem temas cadastrados no banco.`);
      return [];
    }

    const shuffled = [...this.allThemes].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 6);
    const rest = shuffled.slice(6);

    // Alguns pares de tema são parecidos demais (as respostas quase sempre
    // coincidem entre os dois) — nunca deixa os dois saírem juntos no
    // mesmo bloco. Ex.: "Alemão" serve tanto pra Idiomas quanto pra
    // Gentílico de Países, o que confunde e gera discussão sem necessidade.
    for (const [keyA, keyB] of CONFLICTING_THEME_PAIRS) {
      const hasA = selected.some((t) => t.key === keyA);
      const hasB = selected.some((t) => t.key === keyB);
      if (!hasA || !hasB) continue;

      // Troca o segundo dos dois por outro tema do restante do sorteio,
      // que ainda não esteja selecionado.
      const idxToRemove = selected.findIndex((t) => t.key === keyB);
      const replacementIdx = rest.findIndex((t) => !selected.includes(t));
      if (replacementIdx >= 0) {
        selected[idxToRemove] = rest[replacementIdx];
        rest.splice(replacementIdx, 1);
      }
      // Se não sobrar substituto (banco de temas muito pequeno), deixa os
      // dois juntos mesmo — é melhor que ter menos de 6 temas na rodada.
    }

    return selected;
  }

  pickLetter() {
    // Nunca repete uma letra já sorteada dentro do bloco atual de 10 rodadas.
    const available = LETTERS.filter((l) => !this.usedLettersInBlock.has(l));
    const pool = available.length > 0 ? available : LETTERS; // segurança: nunca deveria esvaziar

    // Sorteio ponderado: cada letra ocupa uma fatia proporcional ao seu peso
    // numa "roleta". Assim Q, X e Z continuam podendo sair, mas com uma
    // fração da chance das letras comuns.
    const pesoTotal = pool.reduce((soma, l) => soma + pesoDaLetra(l), 0);
    let sorteio = Math.random() * pesoTotal;

    let letter = pool[pool.length - 1]; // fallback por segurança de arredondamento
    for (const l of pool) {
      sorteio -= pesoDaLetra(l);
      if (sorteio <= 0) {
        letter = l;
        break;
      }
    }

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
    const roundInBlock = ((this.roundNumber - 1) % ROUNDS_PER_BLOCK) + 1;
    this.broadcast("round-start", {
      roundNumber: this.roundNumber,
      roundInBlock,
      themes: this.currentThemes.map((t) => ({ key: t.key, name: t.name })),
      letter: this.currentLetter,
      seconds: this.answerSeconds,
    });

    // Sala da Zoeira: lembra de tempos em tempos que ali é só diversão, pra
    // ninguém achar que está perdendo tempo achando que soma ranking. A cada
    // 5 rodadas é o suficiente pra quem chegou depois ver, sem virar spam.
    if (this.semPontuacao && this.roundNumber % 5 === 1) {
      this.systemMessage(
        "🤣 Lembrando: aqui é só resenha! Nada nesta sala conta pro ranking mensal, vitalício ou pra premiação — jogue à vontade.",
        true
      );
    }

    this.timer = setInterval(() => {
      this.timeLeft -= 1;
      this.broadcast("tick", { state: this.state, timeLeft: this.timeLeft });
      if (this.timeLeft <= 0) {
        // Mesma proteção do intervalo: endRound é assíncrono e desliga o
        // timer, então uma falha ali deixaria a sala parada.
        Promise.resolve(this.endRound(false)).catch((err) => {
          console.error(`Falha ao encerrar rodada na sala ${this.roomId}:`, err);
          this.systemMessage("⚠️ Tivemos um problema ao apurar a rodada. Seguindo pra próxima...");
          this.startIntermission();
        });
      }
    }, 1000);

    // Busca as palavras válidas dessa rodada (todos os temas + a letra
    // sorteada) em segundo plano — guarda em memória pra conferir STOP sem
    // precisar ir ao banco a cada tecla digitada.
    this.loadValidWordsCache();
  }

  async loadValidWordsCache() {
    this.validWordsCache = new Map();
    // Só busca o glossário quem realmente vai conferir contra ele. Uma
    // sala privada no modo automático não pontua no ranking, mas usa o
    // glossário — por isso a checagem é pelo modo de validação, não pela
    // pontuação.
    if (this.validacaoPorVoto) return;
    if (this.semPontuacao && !this.privada) return;
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
    if (!this.semPontuacao) registrarEvento(userId, "stop_pedido").catch(() => {});

    // Contadores dos TÍTULOS de perfil: soma o STOP no grupo da sala e, na
    // avançada, marca também se foi "relâmpago" (dentro da janela configurada).
    // Fire-and-forget de propósito: uma falha aqui não pode atrasar nem
    // travar o fechamento da rodada — no máximo o contador deixa de subir.
    if (!this.semPontuacao) {
      const grupo = grupoDaSala(this.minSecondsBeforeStop);
      if (grupo) {
        const rapido = grupo === "avancada" && elapsedSeconds <= RAPIDO_SEGUNDOS;
        prisma.stopStat
          .upsert({
            where: { userId_grupo: { userId, grupo } },
            update: { stops: { increment: 1 }, rapidos: rapido ? { increment: 1 } : undefined },
            create: { userId, grupo, stops: 1, rapidos: rapido ? 1 : 0 },
          })
          .then((stat) => {
            // Cruzou o limiar de algum título AGORA? Anuncia na sala — cada
            // desbloqueio vira um evento público (e propaganda do sistema).
            for (const nomeTitulo of tituloStopDesbloqueado(grupo, stat.stops, stat.rapidos)) {
              this.systemMessage(`🏅 ${nickname} desbloqueou o título ${nomeTitulo}!`, true, true);
            }
          })
          .catch((err) => console.error("Falha ao registrar STOP pra títulos:", err.message));
      }
    }

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

  // Quantas respostas ATUAIS do jogador já contam para atingir o
  // minCorrectToStop desta sala.
  hasEnoughCorrect(userId) {
    const ans = this.answers.get(userId);
    if (!ans) return false;
    let correctCount = 0;
    for (const theme of this.currentThemes) {
      const raw = (ans[theme.key] || "").trim();
      if (!raw) continue;
      const normRaw = normalize(raw);
      if (normRaw[0]?.toUpperCase() !== this.currentLetter) continue;

      // Sala com validação por voto: quem decide o que vale é a mesa, DEPOIS
      // da rodada. Aqui não dá pra pré-julgar — basta a palavra começar com
      // a letra sorteada pra contar como preenchida. Se pré-julgássemos, o
      // jogador ficaria impedido de pedir STOP por causa de uma palavra que
      // a mesa aceitaria numa boa.
      if (this.validacaoPorVoto) {
        correctCount++;
        continue;
      }

      if (this.isValidWord(theme.id, this.currentLetter, raw)) correctCount++;
    }
    return correctCount >= this.minCorrectToStop;
  }

  // Verifica se uma palavra está aprovada no glossário para o tema/letra da
  // rodada — agora é uma checagem em memória (o cache foi carregado no
  // início da rodada por loadValidWordsCache), não vai mais ao banco.
  isValidWord(themeId, letter, word) {
    // Sala com validação por voto (privadas): quem julga é a mesa, depois
    // da rodada. Aqui só conferimos o básico — que a palavra existe e
    // começa com a letra sorteada. O glossário não entra na conta.
    if (this.validacaoPorVoto) {
      const limpa = normalize(word).trim();
      if (!limpa) return false;
      return limpa[0] === normalize(this.currentLetter);
    }

    // Sala da Zoeira: os temas são subjetivos ("motivo de término", "minha
    // sogra é...") — não existe resposta "certa" pra conferir num glossário.
    // Mas isso não pode virar vale-tudo: sem nenhuma checagem, dava pra
    // pontuar digitando só a letra sorteada ou teclado batido ("mhudueieh").
    // Aqui a resposta precisa pelo menos PARECER uma palavra de verdade.
    //
    // Sala privada no modo automático NÃO cai aqui: ela usa o glossário
    // normalmente, mesmo não valendo pontos pro ranking.
    if (this.semPontuacao && !this.privada) {
      const limpa = normalize(word).trim();
      if (!limpa) return false;
      if (limpa[0] !== normalize(this.currentLetter)) return false;
      return pareceePalavraReal(limpa);
    }

    if (letter !== this.currentLetter) return false; // segurança: cache é só da letra atual
    const set = this.validWordsCache.get(themeId);
    if (!set) return false;
    return set.has(normalize(word));
  }

// Avisa no chat quando a pessoa SOBE de posição no ranking mensal do Stop.
  // Recebe a pontuação nova já calculada, pra não consultar o banco de novo.
  // Só anuncia quando a posição melhora — repetir a mesma posição ou avisar
  // que caiu só faria barulho.
  async announceRankingPosition(userId, nickname, monthlyPoints) {
    try {
      // Visitante e ADMIN não concorrem, então anunciar posição pra eles
      // seria confuso: mostraria uma colocação que não vale nada.
      if (!(await concorreAoRanking(userId))) return;

      const monthKey = currentMonthKey();
      const ahead = await prisma.monthlyScore.count({
        where: {
          gameKey: GAME_KEY,
          monthKey,
          user: {
            role: { not: "ADMIN" },
            isGuest: false,
            ocultoNoRanking: false,
            // Ocultação só deste jogo (ver ocultoNosRankings no schema).
            NOT: { ocultoNosRankings: { has: GAME_KEY } },
          },
          points: { gt: monthlyPoints },
        },
      });
      const position = ahead + 1;

      const previous = this.lastAnnouncedPosition.get(userId);
      if (previous === position) return;

      this.lastAnnouncedPosition.set(userId, position);

      if (previous === undefined || position < previous) {
        const emoji = position === 1 ? "👑" : position <= 3 ? "🔥" : "📈";
        this.systemMessage(
          `${emoji} ${nickname}, você está na ${position}ª posição do ranking mensal do Stop!`,
          false,
          true
        );
      }
    } catch (err) {
      console.error("Falha ao anunciar posição no ranking:", err.message);
    }
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

    // Sala privada: antes de corrigir, os jogadores votam nas palavras uns
    // dos outros. Como os temas são livres, não existe glossário pra
    // conferir — quem decide o que vale é a mesa.
    if (this.validacaoPorVoto) {
      return this.startVotingPhase(activePlayers);
    }

    return this.gradeRound(activePlayers, monthKey, null);
  }

  // ===== Fase de votação (só em sala privada) =====
  //
  // Monta a lista de palavras enviadas e abre um tempo pra cada jogador
  // marcar as dos outros como válidas ou não. Passado o tempo, apura: a
  // palavra cai se a MAIORIA dos que votaram nela marcou como inválida.
  // Quem não votar não atrapalha — o que não foi votado vale.
  startVotingPhase(activePlayers) {
    this.state = "voting";
    this.clearTimer();
    this.wordVotes = new Map(); // "voterId:targetId:themeKey" -> boolean

    const paraVotar = [];
    for (const theme of this.currentThemes) {
      for (const p of activePlayers) {
        const raw = (this.answers.get(p.userId)?.[theme.key] || "").trim();
        if (!raw) continue;
        // Palavra que nem começa com a letra sorteada já cai sem votação —
        // não faz sentido gastar o tempo da mesa com isso.
        if (normalize(raw)[0]?.toUpperCase() !== this.currentLetter) continue;
        // O nickname NÃO vai junto: a votação é anônima, e mandá-lo
        // permitiria descobrir de quem é cada palavra pelo inspetor do
        // navegador. O userId é necessário pra apurar, mas sozinho não
        // identifica ninguém na tela.
        paraVotar.push({
          userId: p.userId,
          themeKey: theme.key,
          themeName: theme.name,
          word: raw,
        });
      }
    }

    // Ninguém escreveu nada aproveitável: pula direto pra apuração.
    if (paraVotar.length === 0) {
      return this.gradeRound(activePlayers, currentMonthKey(), new Map());
    }

    this.votingItems = paraVotar;

    // Agrupa por tema, na mesma ordem das colunas da tabela. A votação
    // acontece um tema por vez, TODOS juntos: é como se confere no jogo de
    // papel, e evita que quem lê rápido fique olhando tela parada enquanto
    // os outros ainda estão no primeiro tema.
    this.votingTemas = [];
    for (const theme of this.currentThemes) {
      const itens = paraVotar.filter((i) => i.themeKey === theme.key);
      if (itens.length > 0) {
        this.votingTemas.push({ key: theme.key, name: theme.name, itens });
      }
    }

    this.temaAtualIndex = -1;
    this.avancarTemaVotacao(activePlayers);
  }

  // Segundos de votação por tema. O tempo escolhido na criação é o TOTAL
  // da rodada; aqui ele é dividido entre os temas, com um piso pra nunca
  // ficar curto demais pra ler.
  segundosPorTema() {
    const total = this.votingTemas?.length || 1;
    return Math.max(8, Math.round(this.votingSeconds / total));
  }

  // Passa pro próximo tema — ou encerra a votação se já foi o último.
  avancarTemaVotacao(activePlayers) {
    this.clearTimer();
    this.temaAtualIndex += 1;

    if (this.temaAtualIndex >= this.votingTemas.length) {
      return this.finishVoting(activePlayers);
    }

    const tema = this.votingTemas[this.temaAtualIndex];
    this.timeLeft = this.segundosPorTema();

    this.broadcast("voting-tema", {
      indice: this.temaAtualIndex,
      total: this.votingTemas.length,
      themeKey: tema.key,
      themeName: tema.name,
      // As palavras vão sem o nickname: a votação é anônima.
      itens: tema.itens.map((i) => ({
        userId: i.userId,
        themeKey: i.themeKey,
        word: i.word,
      })),
      seconds: this.timeLeft,
      letter: this.currentLetter,
    });

    this.timer = setInterval(() => {
      this.timeLeft -= 1;
      this.broadcast("tick", { state: this.state, timeLeft: this.timeLeft });
      if (this.timeLeft <= 0) {
        // Tempo esgotado: quem não votou aceitou. Segue pro próximo tema.
        Promise.resolve(this.avancarTemaVotacao(activePlayers)).catch((err) => {
          console.error(`Falha ao avançar votação na sala ${this.roomId}:`, err);
          this.startIntermission();
        });
      }
    }, 1000);
  }

  // Todo mundo já votou em tudo do tema atual?
  temaAtualCompleto() {
    const tema = this.votingTemas?.[this.temaAtualIndex];
    if (!tema) return false;

    const jogadores = [...new Set([...this.players.values()].map((p) => p.userId))];
    return jogadores.every((userId) => {
      const cabem = tema.itens.filter((i) => i.userId !== userId);
      return cabem.every((i) => this.wordVotes.has(`${userId}:${i.userId}:${i.themeKey}`));
    });
  }

  // Quantos jogadores já concluíram o tema atual (pro contador na tela).
  progressoVotacao() {
    const tema = this.votingTemas?.[this.temaAtualIndex];
    const jogadores = [...new Set([...this.players.values()].map((p) => p.userId))];
    if (!tema) return { prontos: 0, total: jogadores.length };

    let prontos = 0;
    for (const userId of jogadores) {
      const cabem = tema.itens.filter((i) => i.userId !== userId);
      const ok = cabem.every((i) => this.wordVotes.has(`${userId}:${i.userId}:${i.themeKey}`));
      if (ok) prontos++;
    }
    return { prontos, total: jogadores.length };
  }

  // Registra o voto de um jogador numa palavra específica.
  submitWordVote(userId, targetUserId, themeKey, valido) {
    if (this.state !== "voting") return;
    // Ninguém vota na própria palavra.
    if (userId === targetUserId) return;
    // Voto só vale pro tema que está em julgamento agora.
    const tema = this.votingTemas?.[this.temaAtualIndex];
    if (!tema || tema.key !== themeKey) return;

    this.wordVotes.set(`${userId}:${targetUserId}:${themeKey}`, !!valido);
    this.broadcast("voting-progress", this.progressoVotacao());

    // Todo mundo votou nesse tema: não faz sentido esperar o relógio.
    if (this.temaAtualCompleto()) {
      const ativos = [...this.players.values()];
      Promise.resolve(this.avancarTemaVotacao(ativos)).catch((err) => {
        console.error(`Falha ao avançar votação na sala ${this.roomId}:`, err);
        this.startIntermission();
      });
    }
  }

  async finishVoting(activePlayers) {
    if (this.state !== "voting") return;
    this.clearTimer();

    // Apura: monta o conjunto de palavras REPROVADAS pela maioria.
    const reprovadas = new Set(); // "targetId:themeKey"
    for (const item of this.votingItems || []) {
      let sim = 0;
      let nao = 0;
      for (const [chave, valido] of this.wordVotes.entries()) {
        const [, alvo, tema] = chave.split(":");
        if (alvo === item.userId && tema === item.themeKey) {
          valido ? sim++ : nao++;
        }
      }
      // Maioria simples entre quem votou. Empate mantém a palavra —
      // na dúvida, o benefício vai pra quem escreveu.
      if (nao > sim) reprovadas.add(`${item.userId}:${item.themeKey}`);
    }

    if (reprovadas.size > 0) {
      this.systemMessage(`🗳️ Votação encerrada: ${reprovadas.size} palavra(s) reprovada(s) pela mesa.`);
    } else {
      this.systemMessage("🗳️ Votação encerrada: todas as palavras foram aceitas!");
    }

    return this.gradeRound(activePlayers, currentMonthKey(), reprovadas);
  }

  // ===== Correção da rodada =====
  // `reprovadasPorVoto` só vem preenchido em sala privada; nas salas normais
  // é null e a validação segue pelo glossário, como sempre.
  async gradeRound(activePlayers, monthKey, reprovadasPorVoto) {
    this.state = "grading";

    // Progresso de missões. Sem await: é registro paralelo e não pode
    // segurar a apuração da rodada.
    if (!this.semPontuacao) {
      for (const p of activePlayers) {
        registrarEvento(p.userId, "rodada_stop").catch(() => {});
      }
    }

    // Vigia: o "finally" lá embaixo só roda se o try TERMINAR. Se alguma
    // consulta ao banco ficar pendurada pra sempre (Neon instável, conexão
    // caindo), o finally nunca executa e a sala congela — foi exatamente
    // isso que travava a sala no meio da correção. Este timer garante que,
    // dê o que der, em 25 segundos o jogo continua.
    let jaSeguiu = false;
    const seguirJogo = () => {
      if (jaSeguiu) return;
      jaSeguiu = true;
      this.startIntermission();
    };
    const vigia = setTimeout(() => {
      if (jaSeguiu) return;
      console.error(`Correção travou na sala ${this.roomId} — seguindo o jogo à força.`);
      this.systemMessage("⚠️ A apuração demorou demais. Seguindo pra próxima rodada.");
      seguirJogo();
    }, 25000);

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
          // Em sala privada, quem valida é a mesa: se a maioria reprovou,
          // a palavra cai; senão, vale. O glossário nem entra na conta.
          const valid = reprovadasPorVoto
            ? !reprovadasPorVoto.has(`${p.userId}:${theme.key}`)
            : await this.isValidWord(theme.id, this.currentLetter, raw);
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

      // Sala sem pontuação: o placar da partida continua rolando (a disputa
      // entre os amigos é a graça), mas fica só na memória — nada é gravado
      // no banco, nem soma no que a pessoa já tem de outras salas.
      if (this.semPontuacao) {
        for (const [userId, pts] of roundScores.entries()) {
          this.blockTotals.set(userId, (this.blockTotals.get(userId) || 0) + pts);
        }
      }

      for (const [userId, pts] of (this.semPontuacao ? [] : roundScores.entries())) {
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

      // Sala sem pontuação (Zoeira e salas privadas) não grava nada em
      // ranking nenhum — o placar dali existe só durante a partida.
      for (const [userId, pts] of (this.semPontuacao ? [] : roundScores.entries())) {
        if (pts <= 0) continue;
        try {
          // Busca os pontos mensais ANTES de somar, pra comparar a patente
          // de antes com a de depois — patente é conceito mensal, então é
          // essa pontuação que decide se a pessoa subiu de nível agora.
          const existingMonthly = await prisma.monthlyScore.findUnique({
            where: { userId_gameKey_monthKey: { userId, gameKey: GAME_KEY, monthKey } },
          });
          const oldMonthlyPoints = existingMonthly?.points || 0;
          const newMonthlyPoints = oldMonthlyPoints + pts;

          await prisma.monthlyScore.upsert({
            where: { userId_gameKey_monthKey: { userId, gameKey: GAME_KEY, monthKey } },
            update: { points: { increment: pts } },
            create: { userId, gameKey: GAME_KEY, monthKey, points: pts },
          });

          // Mesmo ajuste do Quiz: considera patente fixa/exclusiva na
          // promoção, pra mensagem e ícone nunca discordarem.
          const oldRank = getRankForPoints(oldMonthlyPoints, { userId });
          const newRank = getRankForPoints(newMonthlyPoints, { userId });
          // Só anuncia promoção pra quem concorre ao ranking — visitante
          // e ADMIN ficam de fora, senão viraria aviso de conquista que
          // na prática não vale nada.
          if (oldRank.key !== newRank.key && (await concorreAoRanking(userId))) {
            const player = [...this.players.values()].find((p) => p.userId === userId);
            const nickname = player?.nickname || "Jogador";
            this.systemMessage(`"${nickname}" você foi promovido para ${newRank.name}.`, false, false, true);
          }

          // Avisa quando a pessoa sobe de posição no ranking mensal — dá a
          // sensação de progresso sem precisar sair da sala pra conferir.
          //
          // Sem await de propósito: é um aviso cosmético e faz uma consulta
          // a mais no banco. Se ele travasse aqui, seguraria a correção da
          // rodada inteira — e a sala junto.
          const jogador = [...this.players.values()].find((p) => p.userId === userId);
          if (jogador) {
            this.announceRankingPosition(userId, jogador.nickname, newMonthlyPoints).catch(() => {});
          }

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

      const roundInBlock = ((this.roundNumber - 1) % ROUNDS_PER_BLOCK) + 1;
      this.broadcast("round-result", {
        roundNumber: this.roundNumber,
        roundInBlock,
        letter: this.currentLetter,
        themes: this.currentThemes.map((t) => ({ key: t.key, name: t.name })),
        // Ordenado pelo placar do bloco: quem lidera aparece no topo da
        // tabela. Antes vinha na ordem de entrada na sala, o que fazia a
        // tabela parecer aleatória justamente no momento em que todo mundo
        // olha pra ela — a apuração da rodada.
        players: activePlayers
          .map((p) => ({
            userId: p.userId,
            nickname: p.nickname,
            graded: graded.get(p.userId) || {},
            points: roundScores.get(p.userId) || 0,
            blockTotal: this.blockTotals.get(p.userId) || 0,
          }))
          .sort(
            (a, b) =>
              b.blockTotal - a.blockTotal ||
              b.points - a.points ||
              a.nickname.localeCompare(b.nickname)
          ),
      });

      await this.broadcastOnlinePlayers();

      if (this.roundNumber % ROUNDS_PER_BLOCK === 0) {
        await this.awardBlockBonus(monthKey);
      }
    } catch (err) {
      console.error(`Erro inesperado ao corrigir a rodada ${this.roundNumber} da sala ${this.roomId}:`, err);
      this.systemMessage("⚠️ Tivemos um probleminha para corrigir essa rodada, mas o jogo continua!");
    } finally {
      // Correção terminou (com ou sem erro): desliga o vigia e segue.
      clearTimeout(vigia);
      seguirJogo();
    }
  }

  async awardBlockBonus(monthKey) {
    // Sala de brincadeira não tem bônus de bloco — não pontua nada.
    if (this.semPontuacao) {
      this.systemMessage("🔄 Fim do bloco de 10 rodadas! Placar zerado — bora começar de novo. 😄");
      // Zera só na memória (não há nada gravado pra limpar no banco).
      for (const userId of this.blockTotals.keys()) this.blockTotals.set(userId, 0);
      await this.broadcastOnlinePlayers();
      return;
    }
    // Só entra no pódio quem realmente pontuou alguma coisa NESSE bloco — uma
    // entrada zerada (de quem não jogou nada nesse bloco, mesmo que tenha
    // pontuado em blocos anteriores) não deve "preencher vaga" só porque
    // sobrou posição no pódio.
    const candidates = [...this.blockTotals.entries()].filter(([, points]) => points > 0);

    // Contas ADMIN não competem pelo pódio nem pelo bônus — mesma regra já
    // aplicada no ranking mensal/vitalício da página de Ranking, só que
    // essa parte roda direto na sala, então precisa da mesma exclusão aqui.
    // Contas ADMIN e de visitante não competem pelo pódio nem pelo bônus —
    // mesma regra já aplicada no ranking mensal/vitalício.
    const foraDoRanking = await prisma.user.findMany({
      where: {
        id: { in: candidates.map(([userId]) => userId) },
        OR: [{ role: "ADMIN" }, { isGuest: true }],
      },
      select: { id: true },
    });
    const adminIds = new Set(foraDoRanking.map((a) => a.id));

    const ranked = candidates.filter(([userId]) => !adminIds.has(userId)).sort((a, b) => b[1] - a[1]);
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
      // Uma linha por colocado — bem mais legível que tudo espremido numa
      // linha só, do jeito que a Central de Jogos fazia.
      for (const b of bonusResults) {
        this.systemMessage(
          `${medals[b.position - 1]} Parabéns ${b.nickname}, você ficou em ${b.position}º nesse bloco e ganhou ${b.bonus} pontos.`,
          false,
          true
        );
      }
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
    // O id permite que moderadores apaguem uma mensagem específica depois.
    this.broadcast("chat-message", { id: novoIdMensagem(), userId, nickname, message, at: Date.now() });
  }

  // Apaga uma mensagem do chat pra todo mundo da sala. O chat de sala é
  // passageiro (vive só na memória de quem está com a tela aberta), então
  // "apagar" aqui é avisar todos os clientes pra removerem a linha.
  apagarMensagem(id) {
    if (!id) return;
    this.broadcast("chat-message-deleted", { id });
  }

  // Avisos automáticos do jogo, mostrados no chat como se fosse um histórico
  // (entradas/saídas, início/fim de rodada, fim de bloco, vencedores do top 3).
  // bold=true destaca a mensagem (ex.: quando alguém aperta STOP).
  // success=true deixa em verde (ex.: aniversário).
  systemMessage(message, bold = false, success = false, promotion = false, tituloDestaque = null) {
    this.broadcast("chat-message", { id: novoIdMensagem(), userId: null, nickname: "Sistema", message, system: true, bold, success, promotion, tituloDestaque, at: Date.now() });
  }
}
