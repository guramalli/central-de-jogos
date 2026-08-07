import { QuizRoom } from "./QuizRoom.js";
import { QUIZ_ROOM_CONFIGS, DEFAULT_QUIZ_ROOM_ID } from "./quizRoomConfigs.js";
import { prisma } from "../db.js";

const rooms = new Map();
const pendingCreation = new Map();

export async function getOrCreateQuizRoom(io, roomId = DEFAULT_QUIZ_ROOM_ID) {
  if (rooms.has(roomId)) return rooms.get(roomId);
  if (pendingCreation.has(roomId)) return pendingCreation.get(roomId);

  const creation = (async () => {
    const config = QUIZ_ROOM_CONFIGS[roomId] || QUIZ_ROOM_CONFIGS[DEFAULT_QUIZ_ROOM_ID];
    const room = new QuizRoom(roomId, io, config);
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

export async function getAllQuizRoomsStatus() {
  const records = await prisma.quizStreakRecord.findMany();
  const recordByRoom = Object.fromEntries(records.map((r) => [r.roomId, r]));
  return Object.entries(QUIZ_ROOM_CONFIGS).map(([roomId, config]) => {
    const room = rooms.get(roomId);
    return {
      roomId,
      label: config.label,
      themeKey: config.themeKey,
      description: config.description,
      maxPlayers: config.maxPlayers ?? 10,
      onlineCount: room ? room.countUniquePlayers() : 0,
      streakRecord: recordByRoom[roomId] || null,
    };
  });
}
