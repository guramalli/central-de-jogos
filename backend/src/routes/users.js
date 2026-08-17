import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { getRankForPoints, getNextRankInfo } from "../utils/rank.js";
import { getQuizRankForPoints, getQuizNextRankInfo } from "../utils/quizRank.js";
import { cacheGet, cacheSet, cacheInvalidar } from "../utils/cache.js";
import { currentMonthKey } from "../utils/monthKey.js";
import { QUIZ_ROOM_CONFIGS } from "../game/quizRoomConfigs.js";
import { titulosDoQuiz, titulosDoStop, logoPorNomeDeTitulo } from "../game/titulosConfig.js";

const router = Router();

// Limite generoso o bastante pra uma fotinho pequena já redimensionada no
// navegador (deve ficar bem abaixo disso na prática), mas protege o banco
// de alguém tentando mandar uma imagem gigante sem passar pelo redimensionamento.
const MAX_AVATAR_LENGTH = 300_000;

// Monta a lista de "conquistas" a partir de dados que já existem (patente
// atual do MÊS, recordes de sequência) — sem precisar de um sistema novo de
// conquistas do zero, só reaproveitando o que o site já calcula. Como
// patente agora é conceito mensal, a conquista mostra a patente do mês
// vigente (se a pessoa ainda não pontuou esse mês, não mostra patente).
async function buildAchievements(nickname, monthlyByGame, userId) {
  const achievements = [];

  const stopPoints = monthlyByGame.get("stop") || 0;
  if (stopPoints > 0) {
    const rank = getRankForPoints(stopPoints, { userId, gameKey: "stop" });
    achievements.push({ iconUrl: rank.icon, label: `${rank.name} no Stop (este mês)` });
  }
  const quizPoints = monthlyByGame.get("quiz") || 0;
  if (quizPoints > 0) {
    const rank = getQuizRankForPoints(quizPoints, { userId });
    achievements.push({ iconUrl: rank.icon, label: `${rank.name} no Quiz (este mês)` });
  }

  const streakRecords = await prisma.quizStreakRecord.findMany({ where: { nickname } });
  if (streakRecords.length > 0) {
    const best = streakRecords.reduce((a, b) => (b.count > a.count ? b : a));
    achievements.push({ icon: "🔥", label: `Recorde de ${best.count} seguidas no Quiz` });
  }

  return achievements;
}

router.get("/:id/profile", requireAuth, async (req, res) => {
  const { id } = req.params;
  const monthKey = currentMonthKey();

  // O hover de perfil dispara muito (toda vez que alguém passa o mouse num
  // nick). Guardar por 15 segundos corta a maior parte das consultas
  // repetidas sem que o dado fique visivelmente desatualizado. A chave
  // inclui quem está vendo, porque a resposta muda conforme o observador
  // (status de amizade, se pode convidar pro clã).
  const cacheKey = `perfil:${id}:${req.user.id}:${monthKey}`;
  const emCache = cacheGet(cacheKey);
  if (emCache) return res.json(emCache);

  // Essas consultas não dependem umas das outras, então rodam em paralelo.
  // Antes elas eram sequenciais (cada uma esperando a anterior terminar), o
  // que somava o tempo de todas — e essa rota dispara toda vez que alguém
  // passa o mouse num nick, em qualquer tela do site.
  const [user, monthly, lifetime, quizStats] = await Promise.all([
    prisma.user.findUnique({ where: { id }, include: { clan: true } }),
    prisma.monthlyScore.findMany({ where: { userId: id, monthKey } }),
    // Exclui as pontuações "por sala" (gameKey tipo "stop:stop-sala-1") —
    // no perfil só mostramos o total geral de cada jogo.
    prisma.lifetimeScore.findMany({
      where: { userId: id, NOT: { gameKey: { contains: ":" } } },
    }),
    prisma.quizRoomStat.findMany({
      where: { userId: id, attempts: { gte: 10 } },
      orderBy: { attempts: "desc" },
    }),
  ]);

  if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

  // Pra cada jogo em que a pessoa pontuou esse mês, calcula a patente (que
  // agora é conceito exclusivo do ranking mensal) e a posição no ranking
  // mensal daquele jogo específico — usando CONTAGEM (quantos têm pontuação
  // maior que a dela), não buscando a lista inteira de todo mundo. Isso
  // importa de verdade com muita gente online ao mesmo tempo: essa rota
  // roda toda vez que alguém passa o mouse num nick, em qualquer lugar do
  // site, então precisa ser bem mais leve pro banco.
  const monthlyWithPosition = await Promise.all(
    monthly.map(async (m) => {
      // Contas ADMIN não competem no ranking — nem contam como concorrente
      // pra calcular a posição de outra pessoa (já filtrado abaixo), nem
      // aparecem com posição nenhuma quando o próprio perfil é de admin
      // (senão, se ninguém "de verdade" tiver mais pontos, o admin aparece
      // como 1º por padrão, mesmo estando fora do ranking).
      if (user.role === "ADMIN") {
        return {
          gameKey: m.gameKey,
          points: m.points,
          position: null,
          rank:
          m.gameKey === "quiz"
            ? getQuizRankForPoints(m.points, { userId: user.id })
            : getRankForPoints(m.points, { userId: user.id, gameKey: m.gameKey }),
          nextRank: m.gameKey === "quiz" ? getQuizNextRankInfo(m.points) : getNextRankInfo(m.points),
        };
      }
      const betterCount = await prisma.monthlyScore.count({
        where: {
          gameKey: m.gameKey,
          monthKey,
          user: { role: { not: "ADMIN" }, isGuest: false, ocultoNoRanking: false },
          points: { gt: m.points },
        },
      });
      return {
        gameKey: m.gameKey,
        points: m.points,
        position: betterCount + 1,
        rank:
          m.gameKey === "quiz"
            ? getQuizRankForPoints(m.points, { userId: user.id })
            : getRankForPoints(m.points, { userId: user.id, gameKey: m.gameKey }),
        nextRank: m.gameKey === "quiz" ? getQuizNextRankInfo(m.points) : getNextRankInfo(m.points),
      };
    })
  );
  const monthlyByGame = new Map(monthly.map((m) => [m.gameKey, m.points]));
  const achievements = await buildAchievements(user.nickname, monthlyByGame, user.id);

  // Aproveitamento por sala do Quiz — só das salas com pelo menos 10
  // perguntas vistas, senão o número não significaria nada.
  const quizAccuracy = quizStats.map((s) => ({
    roomId: s.roomId,
    roomLabel: QUIZ_ROOM_CONFIGS[s.roomId]?.label || s.roomId,
    attempts: s.attempts,
    correct: s.correct,
    percent: Math.round((s.correct / s.attempts) * 100),
  }));

  // Status de amizade em relação a quem está VENDO o perfil (não em
  // relação ao dono do perfil) — usado pra decidir se mostra o botão de
  // adicionar amigo, ou "Já são amigos", ou "Pedido já enviado".
  let friendshipStatus = null; // null | "friends" | "pending_sent" | "pending_received"
  if (req.user.id !== id) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userAId: req.user.id, userBId: id },
          { userAId: id, userBId: req.user.id },
        ],
      },
    });
    if (friendship) {
      if (friendship.status === "accepted") friendshipStatus = "friends";
      else friendshipStatus = friendship.userAId === req.user.id ? "pending_sent" : "pending_received";
    }
  }

  // Se quem está vendo o perfil é líder (dono) de algum clã, manda essa
  // info junto — usada pra mostrar o botão "Convidar pro clã" no hover,
  // quando a pessoa do perfil ainda não tem clã nenhum.
  let viewerClan = null;
  if (req.user.id !== id) {
    viewerClan = await prisma.clan.findUnique({
      where: { ownerId: req.user.id },
      select: { id: true, name: true, tag: true },
    });
  }

  const resposta = {
    id: user.id,
    nickname: user.nickname,
    tituloExibido: user.tituloExibido || null,
    tituloExibidoLogo: logoPorNomeDeTitulo(user.tituloExibido),
    // Só vale como "true" se REALMENTE existe um título escolhido. Assim o
    // hover nunca fica sem imagem, mesmo se o banco tiver a preferência
    // ligada de um estado antigo.
    medalhaNoLugarDaFoto: !!user.tituloExibido && user.medalhaNoLugarDaFoto === true,
    avatarUrl: user.avatarUrl || null,
    clan: user.clan ? { name: user.clan.name, tag: user.clan.tag } : null,
    playtimeMinutes: user.playtimeMinutes,
    memberSince: user.createdAt,
    monthly: monthlyWithPosition,
    lifetime: lifetime.map((l) => ({ gameKey: l.gameKey, points: l.points })),
    achievements,
    quizAccuracy,
    friendshipStatus,
    viewerClan,
  };
  cacheSet(cacheKey, resposta, 15);
  res.json(resposta);
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json({
    id: user.id,
    nickname: user.nickname,
    email: user.email,
    role: user.role,
    celebration: user.celebration || "",
    tituloExibido: user.tituloExibido || null,
    medalhaNoLugarDaFoto: !!user.tituloExibido && user.medalhaNoLugarDaFoto === true,
    avatarUrl: user.avatarUrl || null,
    hasPassword: !!user.password,
  });
});

// ===== Escolher o título exibido =====
// Guarda qual título desbloqueado a pessoa quer ostentar (aparece no hover
// de perfil em qualquer sala). Valida contra a lista REAL de desbloqueados —
// recalculada das estatísticas — senão bastava um PATCH pra virar
// "Enciclopédia" sem nunca ter jogado. null = não exibir nenhum.
router.patch("/me/titulo-exibido", requireAuth, async (req, res) => {
  const { titulo } = req.body;
  if (titulo === null || titulo === undefined || titulo === "") {
    // Desliga a medalha-no-lugar-da-foto junto: sem título escolhido não há
    // medalha pra mostrar, e deixar a preferência ligada faria o hover ficar
    // sem imagem nenhuma.
    await prisma.user.update({
      where: { id: req.user.id },
      data: { tituloExibido: null, medalhaNoLugarDaFoto: false },
    });
    cacheInvalidar(`titulos:${req.user.id}`);
    return res.json({ ok: true, tituloExibido: null, medalhaNoLugarDaFoto: false });
  }

  // Recalcula os desbloqueados (mesma lógica do GET /titulos)
  const statsQuiz = await prisma.quizRoomStat.findMany({
    where: { userId: req.user.id, roomId: { startsWith: "quiz-" } },
    select: { roomId: true, correct: true },
  });
  const porTema = {};
  for (const s of statsQuiz) {
    const tema = s.roomId.replace(/^quiz-/, "").replace(/-(facil|dificil)$/, "");
    porTema[tema] = (porTema[tema] || 0) + s.correct;
  }
  let statsStop = [];
  try {
    statsStop = await prisma.stopStat.findMany({
      where: { userId: req.user.id },
      select: { grupo: true, stops: true, rapidos: true },
    });
  } catch {
    // tabela ainda não criada (db push pendente) — segue só com o Quiz
  }
  const desbloqueados = new Set();
  for (const t of titulosDoQuiz(porTema)) for (const d of t.desbloqueados) desbloqueados.add(d.nome);
  for (const t of titulosDoStop(statsStop)) for (const d of t.desbloqueados) desbloqueados.add(d.nome);

  if (!desbloqueados.has(titulo)) {
    return res.status(400).json({ error: "Esse título ainda não foi desbloqueado." });
  }
  await prisma.user.update({ where: { id: req.user.id }, data: { tituloExibido: titulo } });
  res.json({ ok: true, tituloExibido: titulo });
});

// Liga/desliga a medalha no lugar da foto no hover do nick.
//
// Endpoint separado do titulo-exibido de propósito: são duas escolhas
// independentes (QUAL título ostentar × COMO ostentar), e juntar as duas num
// PATCH só obrigaria a reenviar o título a cada vez que a pessoa mexe no
// interruptor.
//
// Não precisa revalidar os títulos desbloqueados aqui: o que autoriza a troca
// é ter um tituloExibido, e ESSE já foi validado quando foi escolhido.
router.patch("/me/medalha-no-lugar-da-foto", requireAuth, async (req, res) => {
  const ligado = req.body?.ligado === true;

  const eu = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { tituloExibido: true },
  });

  // Trava: sem título escolhido não há medalha pra mostrar, e ligar a opção
  // deixaria a pessoa sem imagem nenhuma no hover.
  if (ligado && !eu?.tituloExibido) {
    return res.status(400).json({
      error: "Escolha primeiro um título pra exibir.",
    });
  }

  await prisma.user.update({
    where: { id: req.user.id },
    data: { medalhaNoLugarDaFoto: ligado },
  });
  res.json({ ok: true, medalhaNoLugarDaFoto: ligado });
});

// Atualiza dados do próprio perfil (por enquanto, só a frase de comemoração do Quiz).
router.patch("/me", requireAuth, async (req, res) => {
  const { celebration } = req.body;
  if (celebration && celebration.length > 20) {
    return res.status(400).json({ error: "A comemoração pode ter no máximo 20 caracteres." });
  }
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { celebration: celebration?.trim() || null },
  });
  res.json({ celebration: user.celebration || "" });
});

// Recebe a foto já redimensionada (o navegador faz isso antes de mandar) —
// guardada como base64 direto no banco, sem precisar de um serviço de
// armazenamento de arquivos externo.
router.post("/me/avatar", requireAuth, async (req, res) => {
  const { avatarUrl } = req.body;
  if (!avatarUrl || typeof avatarUrl !== "string") {
    return res.status(400).json({ error: "Nenhuma imagem enviada." });
  }
  if (!avatarUrl.startsWith("data:image/")) {
    return res.status(400).json({ error: "Formato de imagem inválido." });
  }
  if (avatarUrl.length > MAX_AVATAR_LENGTH) {
    return res.status(400).json({ error: "Imagem muito grande. Tenta outra foto." });
  }
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { avatarUrl },
  });
  // Descarta o cache do perfil pra foto nova aparecer na hora.
  cacheInvalidar(`perfil:${req.user.id}:`);
  res.json({ avatarUrl: user.avatarUrl });
});

router.delete("/me/avatar", requireAuth, async (req, res) => {
  await prisma.user.update({ where: { id: req.user.id }, data: { avatarUrl: null } });
  cacheInvalidar(`perfil:${req.user.id}:`);
  res.json({ ok: true });
});

// Troca (ou define, se a conta nunca teve uma — caso de quem entrou só pelo
// Google) a senha da própria conta. Se já existe senha, exige a atual pra
// confirmar antes de trocar.
router.patch("/me/password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: "A nova senha deve ter ao menos 8 caracteres." });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  if (user.password) {
    if (!currentPassword) {
      return res.status(400).json({ error: "Informe sua senha atual." });
    }
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Senha atual incorreta." });
    }
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

  res.json({ ok: true, message: user.password ? "Senha alterada com sucesso!" : "Senha definida com sucesso!" });
});

// ===== Títulos de perfil =====
// Conquistas de longo prazo calculadas na hora a partir das estatísticas que
// o jogo já grava (QuizRoomStat) e dos contadores de STOP (StopStat).
// Cache de 10 min: os números mudam devagar e o perfil é muito visitado.
router.get("/:id/titulos", requireAuth, async (req, res) => {
  const { id } = req.params;
  const cacheKey = `titulos:${id}`;
  const emCache = cacheGet(cacheKey);
  if (emCache) return res.json(emCache);

  try {
    // Acertos do Quiz somados por tema (as salas têm id "quiz-<tema>-...").
    const statsQuiz = await prisma.quizRoomStat.findMany({
      where: { userId: id, roomId: { startsWith: "quiz-" } },
      select: { roomId: true, correct: true },
    });
    const porTema = {};
    for (const s of statsQuiz) {
      const tema = s.roomId.replace(/^quiz-/, "").replace(/-(facil|dificil)$/, "");
      porTema[tema] = (porTema[tema] || 0) + s.correct;
    }

    const statsStop = await prisma.stopStat.findMany({
      where: { userId: id },
      select: { grupo: true, stops: true, rapidos: true },
    });

    const payload = {
      quiz: titulosDoQuiz(porTema),
      stop: titulosDoStop(statsStop),
    };
    cacheSet(cacheKey, payload, 600);
    res.json(payload);
  } catch (err) {
    // Antes do "prisma db push" a tabela StopStat não existe — devolve os
    // títulos do Quiz mesmo assim, em vez de quebrar o perfil inteiro.
    console.error("Falha ao montar títulos:", err.message);
    try {
      const statsQuiz = await prisma.quizRoomStat.findMany({
        where: { userId: id, roomId: { startsWith: "quiz-" } },
        select: { roomId: true, correct: true },
      });
      const porTema = {};
      for (const s of statsQuiz) {
        const tema = s.roomId.replace(/^quiz-/, "").replace(/-(facil|dificil)$/, "");
        porTema[tema] = (porTema[tema] || 0) + s.correct;
      }
      res.json({ quiz: titulosDoQuiz(porTema), stop: [] });
    } catch {
      res.json({ quiz: [], stop: [] });
    }
  }
});

export default router;