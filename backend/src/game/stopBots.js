import { prisma } from "../db.js";
import { marcarAtividade } from "./inatividade.js";
import { limparSalaPrivadaSeVazia } from "./gameManager.js";

// BOTS DE TESTE PRAS SALAS PRIVADAS DO STOP.
//
// Servem pra testar a sala (principalmente a VOTAÇÃO DA MESA) sem precisar
// juntar gente. Mesmo modelo dos bots do Acromania (acromaniaBots.js):
// contas próprias escondidas do ranking, "socket falso" e um relógio de 1s
// que decide o que cada bot faz.
//
// Limites deliberados:
//  - SÓ em sala privada (nunca nas oficiais — sala privada não vale ponto);
//  - só o dono da sala (ou admin) chama/dispensa — ver socket/index.js;
//  - no máximo 3, respeitando o limite de jogadores da sala;
//  - bot NUNCA pede STOP: a rodada é de quem está testando;
//  - saem sozinhos 30s depois que não sobra ninguém de verdade na sala.

const MAX_BOTS = 3;

const BOTS = [
  { nickname: "Bot Stop 1", email: "stopbot1@bots.educacaogamer.local" },
  { nickname: "Bot Stop 2", email: "stopbot2@bots.educacaogamer.local" },
  { nickname: "Bot Stop 3", email: "stopbot3@bots.educacaogamer.local" },
];

// Palavras genéricas por letra. Não precisam "acertar" o tema: numa sala
// com votação é a mesa que decide — e ter palavra duvidosa é justamente o
// que testa o ✓/✕/★.
const PALAVRAS = {
  A: ["Ana", "abacaxi", "azul", "arara", "advogado", "Amapá", "abelha"],
  B: ["Bruno", "banana", "bege", "baleia", "bombeiro", "Bahia", "bola"],
  C: ["Carla", "caju", "cinza", "cavalo", "cozinheiro", "Curitiba", "cadeira"],
  D: ["Diego", "damasco", "dourado", "dromedário", "dentista", "Dublin", "dado"],
  E: ["Elisa", "embaúba", "esmeralda", "elefante", "engenheiro", "Espanha", "escada"],
  F: ["Fábio", "figo", "fúcsia", "foca", "farmacêutico", "Fortaleza", "faca"],
  G: ["Gabi", "goiaba", "grená", "gato", "garçom", "Goiânia", "garfo"],
  H: ["Heitor", "hortelã", "hortênsia", "hipopótamo", "historiador", "Holanda", "harpa"],
  I: ["Igor", "ingá", "índigo", "iguana", "instrutor", "Itália", "ímã"],
  J: ["Júlia", "jabuticaba", "jade", "jacaré", "jornalista", "Japão", "jarra"],
  L: ["Lucas", "limão", "lilás", "leão", "lixeiro", "Londres", "lápis"],
  M: ["Marina", "manga", "marrom", "macaco", "médico", "Manaus", "mesa"],
  N: ["Nina", "nectarina", "nude", "narval", "nutricionista", "Natal", "navio"],
  O: ["Otávio", "oliva", "ocre", "onça", "oculista", "Olinda", "óculos"],
  P: ["Paula", "pera", "prata", "pato", "pedreiro", "Paraná", "panela"],
  Q: ["Quitéria", "quiabo", "quartzo", "quati", "químico", "Quênia", "quadro"],
  R: ["Rafael", "romã", "roxo", "rato", "radialista", "Recife", "relógio"],
  S: ["Sofia", "siriguela", "salmão", "sapo", "sapateiro", "Salvador", "sofá"],
  T: ["Tiago", "tangerina", "turquesa", "tatu", "taxista", "Toledo", "tesoura"],
  U: ["Ulisses", "uva", "urucum", "urso", "urbanista", "Uruguai", "urna"],
  V: ["Vitória", "vagem", "verde", "vaca", "vendedor", "Vitória", "vaso"],
  X: ["Xavier", "xixá", "xadrez", "xaréu", "xerife", "Xangai", "xícara"],
  Z: ["Zeca", "zimbro", "zinco", "zebra", "zelador", "Zâmbia", "zíper"],
};

function palavraPara(letra) {
  const balde = PALAVRAS[String(letra || "").toUpperCase()];
  if (!balde) return "";
  return balde[Math.floor(Math.random() * balde.length)];
}

async function garantirContas(quantos) {
  const contas = [];
  for (const def of BOTS.slice(0, quantos)) {
    contas.push(
      await prisma.user.upsert({
        where: { email: def.email },
        update: { nickname: def.nickname, isGuest: true, ocultoNoRanking: true, banned: false },
        create: { nickname: def.nickname, email: def.email, isGuest: true, ocultoNoRanking: true },
      })
    );
  }
  return contas;
}

function socketFalso(id) {
  return {
    id,
    ehBot: true,
    join() {},
    leave() {},
    emit() {},
    to() {
      return { emit() {} };
    },
  };
}

const entre = (min, max) => min + Math.random() * (max - min);

// Liga os bots na sala. Devolve quantos entraram (0 se não deu).
export async function chamarBotsNoStop(room, quantosPedidos = 2) {
  if (!room?.privada) return 0;
  if (room._stopBots?.length) return 0; // já tem bots

  const vagas = Math.max(0, (room.maxPlayers ?? 8) - room.countUniquePlayers());
  const quantos = Math.min(MAX_BOTS, Math.max(1, Number(quantosPedidos) || 2), vagas);
  if (quantos <= 0) return 0;

  let contas;
  try {
    contas = await garantirContas(quantos);
  } catch (err) {
    console.error("Stop: falha ao criar contas de bot:", err.message);
    return 0;
  }

  const bots = contas.map((c, i) => ({
    userId: c.id,
    nickname: c.nickname,
    socket: socketFalso(`stopbot-${i}-${room.roomId}`),
    rodadaEscrita: -1,
    escreveEm: null,
    votou: new Set(), // "rodada:indiceDoTema"
    votaEm: null,
  }));

  room._stopBots = [];
  for (const bot of bots) {
    try {
      const entrou = await room.addPlayer(bot.socket, bot.userId, bot.nickname);
      if (entrou !== false) room._stopBots.push(bot);
    } catch (err) {
      console.error(`Stop: bot ${bot.nickname} não entrou:`, err.message);
    }
  }
  if (!room._stopBots.length) {
    room._stopBots = null;
    return 0;
  }

  room.systemMessage?.(`🤖 ${room._stopBots.length} bot(s) de teste entraram na sala.`);
  let semGente = 0;

  room._stopBotsTimer = setInterval(() => {
    try {
      const temGente = [...room.players.values()].some((p) => !p.socket?.ehBot);
      if (!temGente) {
        semGente += 1;
        if (semGente >= 30) dispensarBotsDoStop(room, { motivo: "sala vazia" });
        return;
      }
      semGente = 0;

      for (const bot of room._stopBots || []) {
        // Bot não fica "parado": sem isto a vigia de inatividade tiraria
        // os bots da sala de espera depois de alguns minutos.
        marcarAtividade(room.players.get(bot.socket.id));

        // RODADA: preenche as lacunas uma vez por rodada, com um atraso
        // aleatório (parece gente) e às vezes deixa um tema em branco.
        if (room.state === "active" && bot.rodadaEscrita !== room.roundNumber) {
          if (bot.escreveEm == null) bot.escreveEm = Date.now() + entre(4000, 18000);
          if (Date.now() >= bot.escreveEm || room.timeLeft <= 4) {
            bot.rodadaEscrita = room.roundNumber;
            bot.escreveEm = null;
            const respostas = {};
            for (const t of room.currentThemes || []) {
              respostas[t.key] = Math.random() < 0.15 ? "" : palavraPara(room.currentLetter);
            }
            room.submitAnswers(bot.socket, bot.userId, respostas, { pasted: false, corrected: true });
          }
        }
        if (room.state !== "active") bot.escreveEm = null;

        // VOTAÇÃO DA MESA: vota em todas as palavras dos outros no tema
        // atual. Quase sempre aceita, às vezes recusa, de vez em quando ★.
        if (room.state === "voting") {
          const tema = room.votingTemas?.[room.temaAtualIndex];
          const chave = `${room.roundNumber}:${room.temaAtualIndex}`;
          if (tema && !bot.votou.has(chave)) {
            if (bot.votaEm == null) bot.votaEm = Date.now() + entre(1500, 5000);
            if (Date.now() >= bot.votaEm || room.timeLeft <= 2) {
              bot.votou.add(chave);
              bot.votaEm = null;
              for (const item of tema.itens.filter((i) => i.userId !== bot.userId)) {
                const sorte = Math.random();
                const voto = sorte < 0.1 ? "top" : sorte < 0.78 ? true : false;
                room.submitWordVote(bot.userId, item.userId, item.themeKey, voto);
                // Votar pode fechar o tema e abrir o próximo: para aqui e
                // deixa o próximo segundo cuidar do tema novo.
                if (room.votingTemas?.[room.temaAtualIndex] !== tema) break;
              }
            }
          }
        } else {
          bot.votaEm = null;
        }
      }
    } catch (err) {
      console.error("Stop: erro no timer dos bots:", err.message);
    }
  }, 1000);

  console.log(`Stop: ${room._stopBots.length} bot(s) de teste na sala ${room.roomId}`);
  return room._stopBots.length;
}

export function dispensarBotsDoStop(room, { motivo = "" } = {}) {
  if (!room?._stopBots?.length) return 0;
  clearInterval(room._stopBotsTimer);
  room._stopBotsTimer = null;
  const bots = room._stopBots;
  room._stopBots = null;
  for (const bot of bots) {
    try {
      room.removePlayer(bot.socket.id);
    } catch (err) {
      console.error(`Stop: falha ao remover bot ${bot.nickname}:`, err.message);
    }
  }
  // Sem ninguém de verdade, a sala privada precisa ser descartada como
  // sempre (os bots seguravam ela "ocupada").
  limparSalaPrivadaSeVazia(room.roomId);
  console.log(`Stop: bots dispensados da sala ${room.roomId}${motivo ? ` (${motivo})` : ""}`);
  return bots.length;
}
