import crypto from "crypto";
import { AcromaniaRoom } from "./AcromaniaRoom.js";
import { ligarDicas, desligarDicas } from "./dicasDoSistema.js";
import { ACROMANIA_ROOM_CONFIGS, DEFAULT_ACROMANIA_ROOM_ID } from "./acromaniaRoomConfigs.js";
import { ligarBotsNaSala, quantidadeDeBots } from "./acromaniaBots.js";

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

// ===== SALAS PRIVADAS DO ACROMANIA =====
//
// Mesma ideia das do Stop: criadas por um jogador, com tempos à escolha
// dele, senha opcional, e descartadas quando esvaziam.
//
// NÃO VALEM RANKING (semPontuacao). A partida é entre amigos e os tempos são
// escolhidos a dedo — contar isso no mesmo ranking que paga prêmio seria
// abrir uma porta óbvia pra combinar pontos.
const salasPrivadas = new Map();
const jogadoresLiberados = new Set(); // "userId:roomId"

export function criarSalaPrivadaAcromania(io, {
  nome, senha, writingSeconds, votingSeconds, roundsPerTurn, maxPlayers,
  criadorId, criadorNickname,
}) {
  const nomeLimpo = String(nome || "").trim();
  if (nomeLimpo.length < 3) throw new Error("O nome da sala precisa de pelo menos 3 letras.");

  for (const info of salasPrivadas.values()) {
    if (info.nome.toLowerCase() === nomeLimpo.toLowerCase()) {
      throw new Error("Já existe uma sala com esse nome. Escolha outro.");
    }
  }

  const roomId = `acromania-privada-${crypto.randomUUID().slice(0, 8)}`;
  const senhaLimpa = String(senha || "").trim();

  const base = ACROMANIA_ROOM_CONFIGS[DEFAULT_ACROMANIA_ROOM_ID];
  const config = {
    ...base,
    label: `${senhaLimpa ? "🔒" : "🔓"} ${nomeLimpo}`,
    nome: nomeLimpo,
    privada: true,
    semPontuacao: true,
    // Sala privada nunca recebe bot: a graça é jogar com quem você chamou.
    bots: false,
    writingSeconds: writingSeconds || base.writingSeconds,
    votingSeconds: votingSeconds || base.votingSeconds,
    roundsPerTurn: roundsPerTurn || base.roundsPerTurn,
    maxPlayers: maxPlayers || 10,
    // Numa sala de amigos, esperar 3 pessoas trava a diversão. Dois já
    // conseguem jogar — a votação fica pobre, mas é escolha de quem criou.
    minPlayersToStart: 2,
    donoId: criadorId,
  };

  const room = new AcromaniaRoom(roomId, io, config);
  rooms.set(roomId, room);
  ligarDicas(room, "acromania");
  salasPrivadas.set(roomId, {
    roomId,
    nome: nomeLimpo,
    senha: senhaLimpa,
    criadorId,
    criadorNickname,
    writingSeconds: config.writingSeconds,
    votingSeconds: config.votingSeconds,
    roundsPerTurn: config.roundsPerTurn,
    maxPlayers: config.maxPlayers,
    criadaEm: Date.now(),
  });

  if (criadorId) jogadoresLiberados.add(`${criadorId}:${roomId}`);
  return { roomId, nome: nomeLimpo };
}

export function listarSalasPrivadasAcromania() {
  const lista = [];
  for (const info of salasPrivadas.values()) {
    const room = rooms.get(info.roomId);
    lista.push({
      roomId: info.roomId,
      nome: info.nome,
      // A senha NUNCA sai daqui — só se ela existe.
      temSenha: !!info.senha,
      criador: info.criadorNickname,
      writingSeconds: info.writingSeconds,
      votingSeconds: info.votingSeconds,
      roundsPerTurn: info.roundsPerTurn,
      maxPlayers: info.maxPlayers,
      onlineCount: room ? room.countUniquePlayers() : 0,
    });
  }
  return lista;
}

export function conferirSenhaAcromania(roomId, userId, senha) {
  const info = salasPrivadas.get(roomId);
  // Sala que não é privada (as oficiais) passa direto — a função também é
  // usada como "pode entrar?" no socket.
  if (!info) return true;
  if (!info.senha) return true;
  if (jogadoresLiberados.has(`${userId}:${roomId}`)) return true;
  const ok = String(senha || "").trim() === info.senha;
  if (ok) jogadoresLiberados.add(`${userId}:${roomId}`);
  return ok;
}

export function ehSalaPrivadaAcromania(roomId) {
  return salasPrivadas.has(roomId);
}

// Descarta a sala quando ela fica vazia — mesma janela do Stop.
const MINUTOS_ATE_DESCARTAR = 10;
export function agendarDescarteAcromania(roomId) {
  const room = rooms.get(roomId);
  if (!room || !room.privada) return;
  setTimeout(() => {
    const atual = rooms.get(roomId);
    if (!atual || atual.countUniquePlayers() > 0) return;
    desligarDicas(atual);
    atual.clearTimer?.();
    rooms.delete(roomId);
    salasPrivadas.delete(roomId);
    for (const chave of [...jogadoresLiberados]) {
      if (chave.endsWith(`:${roomId}`)) jogadoresLiberados.delete(chave);
    }
  }, MINUTOS_ATE_DESCARTAR * 60 * 1000).unref?.();
}

export function getAllAcromaniaRoomsStatus() {
  return Object.entries(ACROMANIA_ROOM_CONFIGS).map(([roomId, config]) => {
    const room = rooms.get(roomId);
    return {
      roomId,
      label: config.label,
      description: config.description,
      maxPlayers: config.maxPlayers ?? 15,
      minPlayersToStart: config.minPlayersToStart ?? 1,
      onlineCount: room ? room.countUniquePlayers() : 0,
      // Só avisa quando há bot DE VERDADE: a sala precisa aceitar (config) e
      // a variável ACROMANIA_BOTS precisa estar ligada. Marcar a sala como
      // "tem bots" com eles desligados seria avisar de algo que não acontece.
      comBots: config.bots !== false && quantidadeDeBots() > 0,
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
