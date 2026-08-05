// Bot de teste do jogo Stop.
//
// Entra na mesma sala que você, aguarda a rodada começar, escolhe (do banco de
// dados local) uma palavra válida para cada tema sorteado, "digita" com um
// pequeno atraso simulando uma pessoa de verdade, e às vezes aperta STOP antes
// do tempo acabar. Serve só para testar a experiência multiplayer sozinho.
//
// Como usar (dentro da pasta backend):
//   npm run bot
//
// Dá para rodar mais de um ao mesmo tempo em terminais diferentes, mudando o
// BOT_NICKNAME (ex.: BOT_NICKNAME=Bot2 npm run bot).

import "dotenv/config";
import axios from "axios";
import { io } from "socket.io-client";
import { prisma } from "../src/db.js";

const API_URL = process.env.API_URL || "http://localhost:4000";
const ROOM_ID = process.env.BOT_ROOM || "stop-sala-1";
const NICKNAME = process.env.BOT_NICKNAME || "BotTeste";
const EMAIL = process.env.BOT_EMAIL || `${NICKNAME.toLowerCase()}@bot.local`;
const PASSWORD = process.env.BOT_PASSWORD || "botsenha123";

// Chance do bot digitar algo errado de propósito, e chance de apertar STOP assim
// que terminar (em vez de esperar o tempo acabar) — deixa o teste mais realista.
const CHANCE_ERRO_PROPOSITAL = 0.08;
const CHANCE_STOP_ANTECIPADO = 0.5;

function log(...args) {
  console.log(`[${NICKNAME}]`, ...args);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(minMs, maxMs) {
  return minMs + Math.random() * (maxMs - minMs);
}

async function ensureBotAccount() {
  try {
    const { data } = await axios.post(`${API_URL}/api/auth/register`, {
      nickname: NICKNAME,
      email: EMAIL,
      password: PASSWORD,
    });
    log("Conta criada.");
    return data.token;
  } catch (err) {
    if (err.response?.status === 409) {
      const { data } = await axios.post(`${API_URL}/api/auth/login`, {
        email: EMAIL,
        password: PASSWORD,
      });
      log("Login realizado (conta já existia).");
      return data.token;
    }
    throw err;
  }
}

async function loadThemeMap() {
  const themes = await prisma.theme.findMany();
  const map = new Map();
  for (const t of themes) map.set(t.key, t.id);
  return map;
}

// Escolhe uma palavra aprovada aleatória para o tema/letra da rodada.
// Às vezes escolhe uma palavra ERRADA de propósito, ou deixa em branco, só
// para o teste também exibir esses casos (vermelho/branco) na tabela.
async function pickWord(themeId, letter) {
  if (Math.random() < CHANCE_ERRO_PROPOSITAL * 0.4) return ""; // deixa em branco
  if (Math.random() < CHANCE_ERRO_PROPOSITAL) return `${letter}rradaDeProposito`;

  const candidates = await prisma.wordEntry.findMany({
    where: { themeId, letter, status: "approved" },
  });
  if (candidates.length === 0) return "";
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return pick.word;
}

async function main() {
  const token = await ensureBotAccount();
  const themeMap = await loadThemeMap();

  const socket = io(API_URL, { auth: { token } });
  let currentAnswers = {};
  let currentThemes = [];
  let currentLetter = null;
  let filling = false;

  socket.on("connect", () => {
    log("Conectado, entrando na sala:", ROOM_ID);
    socket.emit("join-stop-room", { roomId: ROOM_ID });
  });

  socket.on("round-start", async (data) => {
    currentThemes = data.themes;
    currentLetter = data.letter;
    currentAnswers = {};
    filling = true;
    log(`Rodada ${data.roundNumber} — letra "${data.letter}". Pensando nas respostas...`);

    for (const theme of currentThemes) {
      if (!filling) break; // rodada já terminou (STOP de outro jogador, ex.)
      await sleep(randomDelay(400, 2200));
      const themeId = themeMap.get(theme.key);
      const word = themeId ? await pickWord(themeId, currentLetter) : "";
      currentAnswers[theme.key] = word;
      socket.emit("submit-answers", { answers: currentAnswers });
      log(`  ${theme.name}: ${word || "(em branco)"}`);
    }

    const allFilled = currentThemes.every((t) => (currentAnswers[t.key] || "").trim().length > 0);
    if (filling && allFilled && Math.random() < CHANCE_STOP_ANTECIPADO) {
      await sleep(randomDelay(200, 900));
      if (filling) {
        log("Apertando STOP!");
        socket.emit("stop");
      }
    }
  });

  socket.on("round-result", (data) => {
    filling = false;
    const me = data.players.find((p) => p.nickname === NICKNAME);
    if (me) log(`Resultado da rodada ${data.roundNumber}: ${me.points} pontos (total do bloco: ${me.blockTotal})`);
  });

  socket.on("round-intermission", () => {
    filling = false;
  });

  socket.on("block-bonus", (data) => {
    const meu = data.bonusResults.find((b) => b.userId === socket.id);
    if (meu) log(`Bônus de bloco! +${meu.bonus} pontos`);
  });

  socket.on("chat-message", (msg) => {
    if (msg.nickname !== NICKNAME) log(`Chat - ${msg.nickname}: ${msg.message}`);
  });

  socket.on("connect_error", (err) => {
    log("Erro de conexão:", err.message);
  });

  socket.on("disconnect", () => {
    log("Desconectado.");
  });

  process.on("SIGINT", async () => {
    log("Encerrando bot...");
    socket.disconnect();
    await prisma.$disconnect();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Erro fatal no bot:", err.response?.data || err.message);
  process.exit(1);
});
