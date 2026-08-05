import { QuizRoom } from "./QuizRoom.js";
import { QUIZ_ROOM_CONFIGS, DEFAULT_QUIZ_ROOM_ID } from "./quizRoomConfigs.js";

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

export function getAllQuizRoomsStatus() {
  return Object.entries(QUIZ_ROOM_CONFIGS).map(([roomId, config]) => {
    const room = rooms.get(roomId);
    return {
      roomId,
      label: config.label,
      themeKey: config.themeKey,
      maxPlayers: config.maxPlayers ?? 10,
      onlineCount: room ? room.countUniquePlayers() : 0,
    };
  });
}
