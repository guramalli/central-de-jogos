import { prisma } from "../db.js";
import { StopRoom } from "./StopRoom.js";
import { ROOM_CONFIGS, DEFAULT_ROOM_ID } from "./roomConfigs.js";

const rooms = new Map(); // roomId -> StopRoom
const pendingCreation = new Map(); // roomId -> Promise<StopRoom> (evita criar a sala em duplicidade)

// Importante: essa função pode ser chamada quase ao mesmo tempo por duas conexões
// diferentes antes da sala existir. Sem o cache de "criação pendente" abaixo, as
// duas chamadas veriam "a sala ainda não existe" (já que a consulta ao banco é
// assíncrona) e cada uma criaria sua PRÓPRIA StopRoom — resultando em dois loops
// de rodada rodando ao mesmo tempo e brigando pelos mesmos eventos (causa da tela
// piscando / cronômetro perdido). Por isso reaproveitamos a mesma Promise entre
// chamadas concorrentes para o mesmo roomId.
export async function getOrCreateStopRoom(io, roomId = DEFAULT_ROOM_ID) {
  if (rooms.has(roomId)) return rooms.get(roomId);
  if (pendingCreation.has(roomId)) return pendingCreation.get(roomId);

  const creation = (async () => {
    const allThemes = await prisma.theme.findMany();
    const config = ROOM_CONFIGS[roomId] || ROOM_CONFIGS[DEFAULT_ROOM_ID];

    // Temas que só existem na Sala da Zoeira ("coisa da sogra", "motivo de
    // término"...). São subjetivos e não têm glossário, então NÃO podem
    // aparecer nas salas normais: lá tudo seria marcado como errado, já que
    // não existe lista de palavras válidas pra conferir.
    const temasExclusivosDaZoeira = new Set(
      Object.values(ROOM_CONFIGS)
        .filter((c) => c.semPontuacao && Array.isArray(c.fixedThemeKeys))
        .flatMap((c) => c.fixedThemeKeys)
    );

    // Sala com lista fixa de temas (iniciante, Zoeira) sorteia só entre os
    // dela. As demais (intermediária, avançada) pegam todos os temas.
    //
    // Em ambos os casos, os temas da Zoeira ficam de fora de qualquer sala
    // que não seja a própria Zoeira — inclusive se um deles for parar numa
    // lista fixa por engano no futuro.
    const ehSalaZoeira = !!config.semPontuacao;
    const themes = (config.fixedThemeKeys
      ? allThemes.filter((t) => config.fixedThemeKeys.includes(t.key))
      : allThemes
    ).filter((t) => ehSalaZoeira || !temasExclusivosDaZoeira.has(t.key));

    const room = new StopRoom(roomId, io, themes, config);
    rooms.set(roomId, room);
    pendingCreation.delete(roomId);
    return room;
  })();

  pendingCreation.set(roomId, creation);
  return creation;
}

// Lista todas as salas configuradas com a ocupação atual — usado pelo Lobby
// para mostrar "vazia", "lotada" ou "X/Y jogadores online" em cada card.
// Salas que ainda não foram criadas (ninguém entrou ainda) contam como 0.
// Todos os userIds únicos online em QUALQUER sala do Stop agora — usado pra
// calcular o total de jogadores simultâneos na plataforma (Stop + Quiz juntos).
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

export function getAllRoomsStatus() {
  return Object.entries(ROOM_CONFIGS).map(([roomId, config]) => {
    const room = rooms.get(roomId);
    return {
      roomId,
      label: config.label,
      maxPlayers: config.maxPlayers ?? 10,
      onlineCount: room ? room.countUniquePlayers() : 0,
      minLifetimePoints: config.minLifetimePoints ?? 0,
      difficulty: config.difficulty ?? "basic",
      description: config.description || null,
      semPontuacao: !!config.semPontuacao,
    };
  });
}
