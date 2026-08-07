import { AcromaniaRoom } from "./AcromaniaRoom.js";
import { ACROMANIA_ROOM_CONFIGS, DEFAULT_ACROMANIA_ROOM_ID } from "./acromaniaRoomConfigs.js";

const rooms = new Map();
const pendingCreation = new Map();

export async function getOrCreateAcromaniaRoom(io, roomId = DEFAULT_ACROMANIA_ROOM_ID) {
  if (rooms.has(roomId)) return rooms.get(roomId);
  if (pendingCreation.has(roomId)) return pendingCreation.get(roomId);

  const creation = (async () => {
    const config = ACROMANIA_ROOM_CONFIGS[roomId] || ACROMANIA_ROOM_CONFIGS[DEFAULT_ACROMANIA_ROOM_ID];
    const room = new AcromaniaRoom(roomId, io, config);
    rooms.set(roomId, room);
    pendingCreation.delete(roomId);
    return room;
  })();

  pendingCreation.set(roomId, creation);
  return creation;
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
