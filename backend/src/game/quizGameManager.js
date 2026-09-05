import { QuizRoom } from "./QuizRoom.js";
import { ligarDicas } from "./dicasDoSistema.js";
import { QUIZ_ROOM_CONFIGS, DEFAULT_QUIZ_ROOM_ID } from "./quizRoomConfigs.js";
import { prisma } from "../db.js";
import { cacheOuBuscar } from "../utils/cache.js";

const rooms = new Map();
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
  const recordByRoom = Object.fromEntries(records.map((r) => [r.roomId, r]));

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
      room.systemMessage(`📢 AVISO: ${mensagem}`, true);
      alcancadas += 1;
    } catch (err) {
      console.error(`Falha ao avisar a sala ${room.roomId}:`, err.message);
    }
  }
  return alcancadas;
}
