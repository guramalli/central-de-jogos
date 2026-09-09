import { QuizRoom } from "./QuizRoom.js";
import { ligarDicas } from "./dicasDoSistema.js";
import { aoPontuar } from "./eventosDePontuacao.js";
import { QUIZ_ROOM_CONFIGS, DEFAULT_QUIZ_ROOM_ID } from "./quizRoomConfigs.js";
import { prisma } from "../db.js";
import { cacheOuBuscar } from "../utils/cache.js";

const rooms = new Map();

// Pontuou numa sala de Quiz: as OUTRAS salas com esse jogador precisam
// atualizar. Diferente do Stop, aqui não basta reenviar a lista — o mensal
// do Quiz vive no `mensalCache` de cada sala, então o valor velho tem que
// ser RECARREGADO do banco antes. Descartar não serve: o cache só é
// preenchido na entrada do jogador, e a lista passaria a exibir zero.
aoPontuar(({ gameKey, userIds, salaOrigem }) => {
  if (gameKey !== "quiz") return;
  for (const [roomId, room] of rooms.entries()) {
    if (roomId === salaOrigem) continue;
    const presentes = [...room.players.values()].filter((p) => userIds.includes(p.userId));
    if (presentes.length === 0) continue;
    const ids = presentes.map((p) => p.userId);
    Promise.resolve(room.recarregarMensal(ids))
      .then(() => room.broadcastOnlinePlayers())
      .catch((err) => console.error(`Falha ao atualizar patente na sala ${roomId}:`, err.message));
  }
});
const pendingCreation = new Map();

export async function getOrCreateQuizRoom(io, roomId = DEFAULT_QUIZ_ROOM_ID) {
  if (rooms.has(roomId)) return rooms.get(roomId);
  if (pendingCreation.has(roomId)) return pendingCreation.get(roomId);

  const creation = (async () => {
    const config = QUIZ_ROOM_CONFIGS[roomId] || QUIZ_ROOM_CONFIGS[DEFAULT_QUIZ_ROOM_ID];
    const room = new QuizRoom(roomId, io, config);
    rooms.set(roomId, room);
    ligarDicas(room, "quiz");
    pendingCreation.delete(roomId);
    return room;
  })();

  pendingCreation.set(roomId, creation);
  return creation;
}

// Igual ao anterior, mas traz nickname e em qual sala a pessoa está —
// usado no painel admin pra acompanhar o movimento do site.
export function getOnlinePlayersDetailed() {
  const lista = [];
  const vistos = new Set();
  for (const [roomId, room] of rooms.entries()) {
    for (const p of room.players.values()) {
      const chave = `${p.userId}:${roomId}`;
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      lista.push({
        userId: p.userId,
        nickname: p.nickname,
        roomId,
        roomLabel: room.label || roomId,
      });
    }
  }
  return lista;
}

export function getAllOnlineUserIds() {
  const ids = new Set();
  for (const room of rooms.values()) {
    for (const p of room.players.values()) ids.add(p.userId);
  }
  return ids;
}

export async function getAllQuizRoomsStatus() {
  // A contagem de perguntas de cada sala é a parte cara desta rota: são 29
  // salas, ou seja, 29 consultas por carregamento da lobby. Esse número
  // praticamente não muda (só quando perguntas são importadas ou removidas),
  // então guardar por 5 minutos elimina quase todas essas consultas.
  //
  // A ocupação das salas (quantas pessoas estão jogando) NÃO entra no cache —
  // essa parte vem da memória e continua sempre atualizada.
  const contagens = await cacheOuBuscar("quiz:contagem-perguntas", 300, async () => {
    const resultado = {};
    await Promise.all(
      Object.entries(QUIZ_ROOM_CONFIGS).map(async ([roomId, config]) => {
        const where = { status: "approved" };
        if (config.themeKey) where.themeKey = config.themeKey;
        if (config.difficultyFilter) {
          where.difficulty = Array.isArray(config.difficultyFilter)
            ? { in: config.difficultyFilter }
            : config.difficultyFilter;
        }
        resultado[roomId] = await prisma.quizQuestion.count({ where });
      })
    );
    return resultado;
  });

  const records = await prisma.quizStreakRecord.findMany();

  // O apelido gravado no recorde é o da ÉPOCA. Quem trocou de nick aparecia
  // no card da sala com o nome antigo — parecia recorde de outra pessoa, e
  // quem o conquistou não se reconhecia ali. Resolve pelo userId, que não
  // muda. Uma consulta só pra todos os donos de recorde.
  const donos = records.length
    ? await prisma.user.findMany({
        where: { id: { in: [...new Set(records.map((r) => r.userId))] } },
        select: { id: true, nickname: true },
      })
    : [];
  const nickAtual = Object.fromEntries(donos.map((u) => [u.id, u.nickname]));

  const recordByRoom = Object.fromEntries(
    records.map((r) => [r.roomId, { ...r, nickname: nickAtual[r.userId] || r.nickname }])
  );

  return Promise.all(
    Object.entries(QUIZ_ROOM_CONFIGS).map(async ([roomId, config]) => {
      const room = rooms.get(roomId);
      const questionCount = contagens[roomId] ?? 0;

      return {
        roomId,
        label: config.label,
        themeKey: config.themeKey,
        description: config.description,
        tier: config.tier || null,
        arena: !!config.arena,
        roundsPerTurn: config.roundsPerTurn || null,
        questionSeconds: config.questionSeconds,
        // Bônus e pontos por acerto vão pro lobby pra a tela PARAR de repetir
        // números à mão. Estavam escritos direto no JSX e ficaram defasados
        // assim que a arena foi recalibrada — dizia 50 rodadas, 10 segundos e
        // bônus de 100, quando já eram 40, 14 e 1000.
        turnBonus: config.turnBonus || null,
        pointsPerCorrect: config.pointsPerCorrect ?? null,
        maxPlayers: config.maxPlayers ?? 10,
        onlineCount: room ? room.countUniquePlayers() : 0,
        streakRecord: recordByRoom[roomId] || null,
        questionCount,
      };
    })
  );
}

// AVISO DA ADMINISTRAÇÃO
//
// Manda uma mensagem de sistema em todas as salas COM GENTE. Usado pra avisar
// manutenção antes de um deploy — reiniciar o Render derruba as partidas em
// andamento, e avisar dois minutos antes é a diferença entre "caiu" e "avisou".
//
// Só salas com jogador: mandar pra sala vazia não avisa ninguém e ainda
// mentiria na contagem que volta pro painel.
export function avisarSalas(mensagem) {
  let alcancadas = 0;
  for (const room of rooms.values()) {
    if (!room.players || room.players.size === 0) continue;
    try {
      room.systemMessage(`📢 AVISO: ${mensagem}`, true, false, false, null, true);
      alcancadas += 1;
    } catch (err) {
      console.error(`Falha ao avisar a sala ${room.roomId}:`, err.message);
    }
  }
  return alcancadas;
}
