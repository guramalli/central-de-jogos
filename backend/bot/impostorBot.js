// Bots de teste do Impostor.
//
// Entram numa sala já criada (pelo código) e jogam sozinhos: confirmam a
// carta, dão dicas quando é a vez, votam e, se forem o impostor acusado,
// chutam uma palavra do tema. Servem pra testar as telas com 4+ jogadores
// sem precisar de várias pessoas (várias abas do mesmo navegador são a
// MESMA conta, então viram o mesmo jogador).
//
// Como usar (dentro da pasta backend, com o servidor rodando):
//   1. abra /v2/?pagina=impostor no navegador e crie a sala;
//   2. em outro terminal:  IMPOSTOR_SALA=KX7-42 BOTS=3 npm run bot:impostor
//      (no PowerShell:  $env:IMPOSTOR_SALA="KX7-42"; $env:BOTS=3; npm run bot:impostor)
//
// BOT_VOTO=acerta faz os bots tripulantes votarem no impostor (pra testar a
// última chance sem depender da sorte). Como todos os bots rodam neste mesmo
// processo, eles sabem qual bot recebeu a carta de impostor; se nenhum
// recebeu e só há UMA pessoa de verdade na partida, o impostor é ela.
//
// AS CONTAS SÃO CRIADAS DIRETO NO BANCO do .env (ImpBot1..N, e-mail
// @bot.local, ocultas do ranking) — o cadastro normal pede captcha e tem
// limite por IP. Use só com o .env apontando pro banco de TESTES.

import "dotenv/config";
import { io } from "socket.io-client";
import { prisma } from "../src/db.js";
import { signToken } from "../src/utils/jwt.js";

const API_URL = process.env.API_URL || "http://localhost:4000";
const SALA = process.env.IMPOSTOR_SALA;
const BOTS = Math.min(11, Math.max(1, Number(process.env.BOTS) || 3));
const VOTO_CERTO = process.env.BOT_VOTO === "acerta";

// Compartilhado entre os bots deste processo (só usado com BOT_VOTO=acerta).
const idsDosBots = new Set();
let botImpostorId = null;

const DICAS = [
  "grande", "pequeno", "barulho", "cor", "rápido", "antigo", "cheiro", "família",
  "verão", "noite", "dinheiro", "festa", "doce", "gelado", "quente", "cidade",
  "viagem", "trabalho", "brilho", "macio", "forte", "comum", "raro", "redondo",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const entre = (a, b) => a + Math.random() * (b - a);
const sortear = (lista) => lista[Math.floor(Math.random() * lista.length)];
const semAcento = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

async function contaDoBot(n) {
  const email = `impbot${n}@bot.local`;
  const nickname = `ImpBot${n}`;
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, nickname, ocultoNoRanking: true, termsAcceptedAt: new Date() },
  });
  return { user, token: signToken(user) };
}

function ligarBot({ user, token }) {
  const nome = user.nickname;
  idsDosBots.add(user.id);
  const log = (...a) => console.log(`[${nome}]`, ...a);
  const socket = io(API_URL, { auth: { token, plataforma: "desktop" }, transports: ["websocket"] });
  let carta = null;
  const feito = new Set(); // ações já feitas nesta partida (o estado chega várias vezes)

  const pedir = (evento, dados = {}) =>
    new Promise((r) => socket.emit(evento, dados, (resp) => { if (resp?.erro) log("⚠", evento, "→", resp.erro); r(resp); }));

  async function umaVez(chave, atrasoMs, acao) {
    if (feito.has(chave)) return;
    feito.add(chave);
    await sleep(atrasoMs);
    await acao();
  }

  socket.on("connect", async () => {
    const r = await pedir("impostor-entrar", { codigo: SALA });
    if (r?.codigo) log("entrou na sala", r.codigo);
  });
  socket.on("connect_error", (err) => log("não conectou:", err.message));
  socket.on("impostor-carta", (c) => {
    carta = c;
    if (c.papel === "impostor") botImpostorId = user.id;
    log(c.papel === "impostor" ? "🟥 sou o IMPOSTOR (tema: " + c.tema + ")" : "carta: " + c.palavra);
  });

  socket.on("impostor-estado", async (e) => {
    const eu = user.id;
    if (e.fase === "LOBBY") { feito.clear(); carta = null; botImpostorId = null; return; }
    if (!e.participo) return;

    if (e.fase === "CARTAS" && !e.cartaVista) {
      umaVez("carta", entre(1000, 3500), () => pedir("impostor-carta-vista"));
    }

    if (e.fase === "DICAS" && e.vezDe === eu) {
      umaVez(`dica-${e.rodada}`, entre(2000, 6000), async () => {
        const palavra = carta?.palavra ? semAcento(carta.palavra) : null;
        const opcoes = DICAS.filter((d) => !palavra || !semAcento(d).includes(palavra));
        const dica = sortear(opcoes);
        const r = await pedir("impostor-dica", { texto: dica });
        if (r?.ok) log(`dica (rodada ${e.rodada}): ${dica}`);
      });
    }

    if (e.fase === "VOTACAO" && e.meuVoto == null) {
      umaVez("voto", entre(2000, 7000), async () => {
        const alvos = e.jogadores.filter((j) => j.naPartida && j.id !== eu);
        let alvo = sortear(alvos);
        if (VOTO_CERTO && carta?.papel === "tripulante") {
          const humanos = alvos.filter((j) => !idsDosBots.has(j.id));
          const suspeito = botImpostorId || (humanos.length === 1 ? humanos[0].id : null);
          alvo = alvos.find((j) => j.id === suspeito) || alvo;
        }
        const r = await pedir("impostor-votar", { alvoId: alvo.id });
        if (r?.ok) log("votou em", alvo.nickname);
      });
    }

    if (e.fase === "ULTIMA_CHANCE" && e.revelacao?.impostorId === eu) {
      umaVez("chute", entre(3000, 8000), async () => {
        const doTema = await prisma.impostorPalavra.findMany({ where: { tema: carta?.tema, ativo: true }, select: { palavra: true } });
        const chute = doTema.length ? sortear(doTema).palavra : "nao sei";
        await pedir("impostor-chute", { palavra: chute });
        log("chutou:", chute);
      });
    }

    if (e.fase === "FIM") {
      umaVez("fim", 0, async () => {
        const r = e.resultado;
        log(`fim: ${r.vencedor} (${r.motivo}) — meus pontos: ${r.pontos?.[eu] ?? 0}`);
      });
    }
  });

  socket.on("disconnect", () => log("desconectou"));
  return socket;
}

async function main() {
  if (!SALA) {
    console.error("Informe o código da sala: IMPOSTOR_SALA=KX7-42 npm run bot:impostor");
    process.exit(1);
  }
  const host = (process.env.DATABASE_URL || "").replace(/^.*@([^/:?]+).*$/, "$1");
  console.log(`Banco: ${host} · servidor: ${API_URL} · sala: ${SALA} · ${BOTS} bot(s)${VOTO_CERTO ? " · votam no impostor" : ""}`);
  const sockets = [];
  for (let n = 1; n <= BOTS; n++) sockets.push(ligarBot(await contaDoBot(n)));
  process.on("SIGINT", async () => {
    for (const s of sockets) { s.emit("impostor-sair"); s.disconnect(); }
    await prisma.$disconnect();
    process.exit(0);
  });
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
