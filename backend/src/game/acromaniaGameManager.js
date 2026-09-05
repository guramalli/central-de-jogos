import { AcromaniaRoom } from "./AcromaniaRoom.js";
import { ligarDicas } from "./dicasDoSistema.js";
import { ACROMANIA_ROOM_CONFIGS, DEFAULT_ACROMANIA_ROOM_ID } from "./acromaniaRoomConfigs.js";
import { ligarBotsNaSala } from "./acromaniaBots.js";

const rooms = new Map();
const pendingCreation = new Map();

export async function getOrCreateAcromaniaRoom(io, roomId = DEFAULT_ACROMANIA_ROOM_ID) {
  if (rooms.has(roomId)) return rooms.get(roomId);
  if (pendingCreation.has(roomId)) return pendingCreation.get(roomId);

  const creation = (async () => {
    const config = ACROMANIA_ROOM_CONFIGS[roomId] || ACROMANIA_ROOM_CONFIGS[DEFAULT_ACROMANIA_ROOM_ID];
    const room = new AcromaniaRoom(roomId, io, config);
    rooms.set(roomId, room);
    ligarDicas(room, "acromania");
    pendingCreation.delete(roomId);
    // Bots de teste. Desligados por padrão (só ligam com ACROMANIA_BOTS
    // definido). Não usa await: se der ruim ao criar as contas, o jogador
    // real entra na sala do mesmo jeito — bot nunca segura a sala.
    ligarBotsNaSala(room).catch((err) =>
      console.error("Acromania: falha ao ligar bots:", err.message)
    );
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

export function getAllAcromaniaRoomsStatus() {
  return Object.entries(ACROMANIA_ROOM_CONFIGS).map(([roomId, config]) => {
    const room = rooms.get(roomId);
    return {
      roomId,
      label: config.label,
      description: config.description,
      maxPlayers: config.maxPlayers ?? 10,
      minPlayersToStart: config.minPlayersToStart ?? 1,
      onlineCount: room ? room.countUniquePlayers() : 0,
    };
  });
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
