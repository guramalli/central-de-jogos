import "dotenv/config";
import express from "express";
// Faz erros dentro de rotas async caírem no tratador de erro global lá do
// fim deste arquivo. Sem isso (Express 4), um erro de banco numa rota sem
// try/catch deixaria a requisição PENDURADA pra sempre — o navegador da
// pessoa ficaria carregando até estourar o próprio timeout, sem resposta.
import "express-async-errors";
import rateLimit from "express-rate-limit";
import cors from "cors";
import helmet from "helmet";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import rankingRoutes from "./routes/ranking.js";
import glossaryRoutes from "./routes/glossary.js";
import adminRoutes from "./routes/admin.js";
import roomsRoutes from "./routes/rooms.js";
import clansRoutes from "./routes/clans.js";
import salasPrivadasRoutes from "./routes/salasPrivadas.js";
import premiumRoutes from "./routes/premium.js";
import avisosRoutes from "./routes/avisos.js";
import friendsRoutes from "./routes/friends.js";
import quizRoomsRoutes from "./routes/quizRooms.js";
import acromaniaRoomsRoutes from "./routes/acromaniaRooms.js";
import quizQuestionsRoutes from "./routes/quizQuestions.js";
import feedbackRoutes from "./routes/feedback.js";
import ranksRoutes from "./routes/ranks.js";
import platformStatsRoutes from "./routes/platformStats.js";
import quizRanksRoutes from "./routes/quizRanks.js";
import { setupSocket } from "./socket/index.js";

const app = express();
const server = createServer(app);

// Cabeçalhos de segurança padrão de mercado (esconde tecnologia usada,
// evita que o site seja carregado dentro de um iframe malicioso em outro
// site, entre outras proteções). CSP desligado porque esse servidor só
// serve API (JSON), não páginas HTML — CSP é mais relevante pra quem serve
// HTML/scripts direto pro navegador.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Aceita uma OU várias origens, separadas por vírgula na variável de
// ambiente. Isso permite hospedar o jogo em outro lugar além do site — o
// itch.io, por exemplo, serve o conteúdo embutido a partir de um domínio
// próprio, e sem essa lista o navegador bloquearia todas as chamadas.
// Exemplo: CORS_ORIGIN="https://www.educacaogamer.com.br,https://html.itch.zone"
const CORS_ORIGIN = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

// Teto global de requisições por IP. É generoso de propósito: jogador
// normal nem chega perto (o jogo em si roda por socket, não por essas
// rotas). Serve pra impedir que um script maluco ou um bug de front
// derrube o servidor inteiro pedindo dados em laço — importante quando
// muita gente chega de uma vez.
const limiteGlobal = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 300, // 300 requisições por minuto por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas requisições. Aguarde um instante e tente de novo." },
});
app.use("/api", limiteGlobal);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ranking", rankingRoutes);
app.use("/api/glossary", glossaryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/rooms", roomsRoutes);
app.use("/api/clans", clansRoutes);
app.use("/api/salas-privadas", salasPrivadasRoutes);
app.use("/api/premium", premiumRoutes);
app.use("/api/avisos", avisosRoutes);
// Alias neutro: as missões são pra todo mundo, então a URL não deve
// sugerir que fazem parte de um recurso pago.
app.use("/api/missoes", premiumRoutes);
app.use("/api/friends", friendsRoutes);
app.use("/api/quiz-rooms", quizRoomsRoutes);
app.use("/api/acromania-rooms", acromaniaRoomsRoutes);
app.use("/api/quiz-questions", quizQuestionsRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/ranks", ranksRoutes);
app.use("/api/platform-stats", platformStatsRoutes);
app.use("/api/quiz-ranks", quizRanksRoutes);

// Rede de segurança: qualquer erro não tratado numa rota (que ninguém
// prendeu com try/catch) cai aqui, em vez de vazar detalhe técnico interno
// (nome de arquivo, linha do código) pra resposta que o navegador recebe.
app.use((err, req, res, next) => {
  console.error("Erro não tratado numa rota:", err);
  res.status(500).json({ error: "Algo deu errado no servidor. Tenta de novo?" });
});

const io = new Server(server, {
  cors: { origin: CORS_ORIGIN },
});
setupSocket(io);

// Deixa o io acessível nas rotas HTTP — a criação de sala privada precisa
// dele pra montar a sala já conectada ao socket.
app.set("io", io);

// Rede de segurança: um erro assíncrono não tratado em algum lugar não
// esperado não deve derrubar o servidor inteiro — só registra no log.
process.on("unhandledRejection", (reason) => {
  console.error("Erro não tratado (unhandledRejection):", reason);
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Educação Gamer backend rodando em http://localhost:${PORT}`);
});
