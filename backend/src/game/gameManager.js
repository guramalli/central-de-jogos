import crypto from "crypto";
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
// ===== Salas privadas =====
// Criadas por um jogador, com nome, temas e tempo à escolha dele. A senha
// é opcional: sem senha, qualquer um entra pela lista; com senha, só quem
// souber. A sala existe enquanto tiver gente — quando esvazia, é descartada.
const salasPrivadas = new Map(); // roomId -> { nome, senha, criador, config, criadaEm }

export async function criarSalaPrivada(io, { nome, senha, themeKeys, answerSeconds, maxPlayers, votingSeconds, minSecondsBeforeStop, usarGlossario, criadorId, criadorNickname }) {
  const nomeLimpo = String(nome || "").trim();

  // Nome repetido confundiria na lista — melhor avisar do que deixar duas
  // "Sala do João" sem distinção.
  for (const info of salasPrivadas.values()) {
    if (info.nome.toLowerCase() === nomeLimpo.toLowerCase()) {
      throw new Error("Já existe uma sala com esse nome. Escolha outro.");
    }
  }

  const allThemes = await prisma.theme.findMany();
  const escolhidos = allThemes.filter((t) => themeKeys.includes(t.key));
  if (escolhidos.length < 3) {
    throw new Error("Escolha pelo menos 3 temas para a sala.");
  }

  const roomId = `stop-privada-${crypto.randomUUID().slice(0, 8)}`;
  const senhaLimpa = String(senha || "").trim();
  const config = {
    // Cadeado fechado só quando a sala pede senha. Sala aberta leva o
    // cadeado destrancado — passa a mensagem certa pra quem chega.
    label: `${senhaLimpa ? "🔒" : "🔓"} ${nomeLimpo}`,
    nome: nomeLimpo,
    privada: true,
    // Sala privada não vale ranking: os temas são escolhidos a dedo e a
    // validação é feita pelos próprios jogadores.
    semPontuacao: true,
    // Duas formas de validar, à escolha de quem cria:
    //   - por voto: a mesa julga. Aceita temas livres e respostas
    //     criativas, e é o que permite os temas da Zoeira aqui.
    //   - pelo glossário: o site confere as palavras sozinho, igual às
    //     salas oficiais. Partida mais rápida, sem fase de votação.
    validacaoPorVoto: !usarGlossario,
    answerSeconds: answerSeconds || 40,
    intermissionSeconds: 15,
    // Tempo de votação escolhido pelo dono. O padrão subiu de 20 pra 40
    // segundos: com 6 temas e várias pessoas, 20s não davam pra ler e
    // julgar as palavras dos outros com calma.
    votingSeconds: votingSeconds || 40,
    minLifetimePoints: 0,
    difficulty: "basic",
    maxPlayers: maxPlayers || 10,
    // Quem criou é quem dá o start na partida.
    donoId: criadorId,
    // Trava contra STOP relâmpago. O dono escolhe, mas nunca pode passar
    // do tempo total da rodada — senão ninguém conseguiria pedir stop.
    minSecondsBeforeStop: Math.min(
      minSecondsBeforeStop ?? 15,
      Math.max(5, (answerSeconds || 40) - 5)
    ),
    // Exigir N palavras CERTAS pra pedir STOP só faz sentido quando existe
    // glossário pra dizer o que está certo. Na validação por voto, quem
    // julga é a mesa DEPOIS da rodada — não dá pra saber antes, então a
    // regra vira "preencheu tudo".
    minCorrectToStop: usarGlossario ? 3 : 0,
  };

  const room = new StopRoom(roomId, io, escolhidos, config);
  rooms.set(roomId, room);
  salasPrivadas.set(roomId, {
    roomId,
    nome: nomeLimpo,
    // Senha vazia significa sala aberta.
    senha: senhaLimpa,
    criadorId,
    criadorNickname,
    temas: escolhidos.map((t) => t.name),
    answerSeconds: config.answerSeconds,
    votingSeconds: config.votingSeconds,
    validacaoPorVoto: config.validacaoPorVoto,
    maxPlayers: config.maxPlayers,
    criadaEm: Date.now(),
  });

  // Quem criou já entra direto, sem passar pela senha.
  if (criadorId) jogadoresLiberados.add(`${criadorId}:${roomId}`);

  return { roomId, nome: nomeLimpo };
}

// Lista as salas privadas ativas, sem expor a senha.
export function listarSalasPrivadas() {
  const lista = [];
  for (const [roomId, info] of salasPrivadas.entries()) {
    const room = rooms.get(roomId);
    if (!room) {
      salasPrivadas.delete(roomId);
      continue;
    }
    lista.push({
      roomId,
      nome: info.nome,
      temSenha: !!info.senha,
      criador: info.criadorNickname,
      temas: info.temas,
      answerSeconds: info.answerSeconds,
      maxPlayers: info.maxPlayers,
      jogadores: room.countUniquePlayers ? room.countUniquePlayers() : room.players.size,
      criadaEm: info.criadaEm,
    });
  }
  return lista.sort((a, b) => b.jogadores - a.jogadores || b.criadaEm - a.criadaEm);
}

// Quem já passou pela conferência de senha. Sem isso, bastaria ter o link
// da sala pra entrar sem saber a senha.
export const jogadoresLiberados = new Set(); // "userId:roomId"

// Confere se a senha bate. Sala sem senha aceita qualquer um.
export function validarEntradaSalaPrivada(roomId, senha, userId) {
  const info = salasPrivadas.get(roomId);
  if (!info || !rooms.has(roomId)) return { ok: false, motivo: "inexistente" };

  if (info.senha && String(senha || "").trim() !== info.senha) {
    return { ok: false, motivo: "senha" };
  }

  if (userId) jogadoresLiberados.add(`${userId}:${roomId}`);
  return { ok: true };
}

// Quanto tempo uma sala privada sobrevive vazia antes de ser descartada.
// Precisa ser generoso: o caso mais comum é a pessoa criar a sala, sair
// pra chamar os amigos no zap, e voltar. Sem essa carência, a sala sumiria
// no instante em que o criador saísse.
const CARENCIA_SALA_VAZIA_MS = 10 * 60 * 1000; // 10 minutos

const descartesAgendados = new Map(); // roomId -> timeout

// Agenda o descarte de uma sala privada que ficou vazia. Se alguém entrar
// antes do prazo, o descarte é cancelado.
export function limparSalaPrivadaSeVazia(roomId) {
  const room = rooms.get(roomId);
  if (!room || !room.privada) return;
  if (room.players.size > 0) return;
  if (descartesAgendados.has(roomId)) return;

  const timeout = setTimeout(() => {
    descartesAgendados.delete(roomId);
    const atual = rooms.get(roomId);
    // Alguém pode ter entrado nesse meio-tempo.
    if (!atual || atual.players.size > 0) return;

    atual.clearTimer?.();
    rooms.delete(roomId);
    salasPrivadas.delete(roomId);
    for (const chave of jogadoresLiberados) {
      if (chave.endsWith(`:${roomId}`)) jogadoresLiberados.delete(chave);
    }
  }, CARENCIA_SALA_VAZIA_MS);

  descartesAgendados.set(roomId, timeout);
}

// Cancela o descarte agendado — chamado quando alguém entra na sala.
export function cancelarDescarteSala(roomId) {
  const t = descartesAgendados.get(roomId);
  if (t) {
    clearTimeout(t);
    descartesAgendados.delete(roomId);
  }
}

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
