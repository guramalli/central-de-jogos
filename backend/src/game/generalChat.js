import { prisma } from "../db.js";

// Chat Geral — diferente do chat de dentro das salas de jogo (que é
// passageiro, some quando a rodada muda), esse fica gravado no banco e
// sempre visível na página inicial, pra dar aquela sensação de "praça"
// onde sempre tem gente, mesmo quem não está jogando nada no momento.
const ROOM_ID = "geral";
const HISTORY_LIMIT = 50;

// Quem está com o chat geral aberto agora (socketId -> {userId, nickname}).
const connected = new Map();

export function addConnection(socket, userId, nickname) {
  connected.set(socket.id, { userId, nickname });
}

export function removeConnection(socketId) {
  connected.delete(socketId);
}

export function getOnlineList() {
  const seen = new Map();
  for (const p of connected.values()) seen.set(p.userId, p.nickname);
  return [...seen.entries()].map(([userId, nickname]) => ({ userId, nickname }));
}

export async function loadHistory() {
  const messages = await prisma.chatMessage.findMany({
    where: { roomId: ROOM_ID },
    include: { user: { select: { nickname: true } } },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
  });
  // Volta pra ordem cronológica (mais antiga primeiro), já que buscamos as
  // mais recentes primeiro pra respeitar o limite.
  return messages.reverse().map((m) => ({
    userId: m.userId,
    nickname: m.user.nickname,
    message: m.message,
    at: m.createdAt.getTime(),
  }));
}

export async function saveMessage(userId, message) {
  await prisma.chatMessage.create({ data: { roomId: ROOM_ID, userId, message } });
}
