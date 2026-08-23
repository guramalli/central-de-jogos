import { Router } from "express";
import { prisma } from "../db.js";
import { cacheGet, cacheSet, cacheOuBuscar, cacheInvalidar } from "../utils/cache.js";
import { getOnlinePlayersDetailed as getStopOnlineDetailed } from "../game/gameManager.js";
import { getOnlinePlayersDetailed as getQuizOnlineDetailed } from "../game/quizGameManager.js";
import { getOnlinePlayersDetailed as getAcromaniaOnlineDetailed } from "../game/acromaniaGameManager.js";
import { getOnlineList as getGeneralChatOnline } from "../game/generalChat.js";
import { getOnlineList as getPresenceOnline } from "../game/presence.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requireRole("MODERATOR", "ADMIN"));

router.get("/glossary/pending", async (req, res) => {
  const pending = await prisma.wordEntry.findMany({
    where: { status: "pending" },
    include: { theme: true, suggestedBy: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(pending);
});

router.post("/glossary/:id/approve", async (req, res) => {
  const entry = await prisma.wordEntry.update({
    where: { id: req.params.id },
    data: { status: "approved" },
  });
  res.json(entry);
});

router.post("/glossary/:id/reject", async (req, res) => {
  const entry = await prisma.wordEntry.update({
    where: { id: req.params.id },
    data: { status: "rejected" },
  });
  res.json(entry);
});

// Índice completo de palavras de um tema (para o painel de gerenciamento do glossário)
router.get("/glossary/words", async (req, res) => {
  const { themeKey } = req.query;
  if (!themeKey) return res.status(400).json({ error: "themeKey é obrigatório." });
  const theme = await prisma.theme.findUnique({ where: { key: themeKey } });
  if (!theme) return res.status(404).json({ error: "Tema não encontrado." });
  const words = await prisma.wordEntry.findMany({
    where: { themeId: theme.id },
    orderBy: [{ letter: "asc" }, { word: "asc" }],
  });
  res.json(words);
});

// Admin/moderador insere uma palavra diretamente já aprovada (não precisa de fila de aprovação)
router.post("/glossary/words", async (req, res) => {
  const { themeKey, letter, word } = req.body;
  if (!themeKey || !letter || !word) {
    return res.status(400).json({ error: "themeKey, letter e word são obrigatórios." });
  }
  const theme = await prisma.theme.findUnique({ where: { key: themeKey } });
  if (!theme) return res.status(404).json({ error: "Tema não encontrado." });

  try {
    const entry = await prisma.wordEntry.create({
      data: {
        themeId: theme.id,
        letter: letter.toUpperCase(),
        word: word.trim(),
        status: "approved",
      },
    });
    res.json(entry);
  } catch {
    res.status(409).json({ error: "Essa palavra já existe para esse tema/letra." });
  }
});

// Remove uma palavra do glossário (qualquer status)
router.delete("/glossary/words/:id", async (req, res) => {
  await prisma.wordEntry.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

router.get("/feedback", async (req, res) => {
  const feedbacks = await prisma.feedback.findMany({
    include: { user: { select: { nickname: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(feedbacks);
});

router.delete("/feedback/:id", async (req, res) => {
  await prisma.feedback.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ===== Glossário de perguntas do Quiz =====

router.get("/quiz-questions/pending", async (req, res) => {
  const pending = await prisma.quizQuestion.findMany({
    where: { status: "pending" },
    include: { suggestedBy: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(pending);
});

router.post("/quiz-questions/:id/approve", async (req, res) => {
  const pendente = await prisma.quizQuestion.findUnique({ where: { id: req.params.id } });
  if (!pendente) return res.status(404).json({ error: "Pergunta não encontrada." });

  // Antes de aprovar, confere se já não existe igual ou muito parecida no
  // acervo. Sem isso, uma sugestão idêntica a uma pergunta antiga entrava
  // duplicada e ia parar na mesma fila da sala.
  const normalizar = (t) =>
    t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const semelhanca = (a, b) => {
    const A = new Set(a); const B = new Set(b);
    let c = 0; for (const p of A) if (B.has(p)) c++;
    return c / (A.size + B.size - c);
  };

  const doTema = await prisma.quizQuestion.findMany({
    where: { status: "approved", themeKey: pendente.themeKey },
    select: { id: true, question: true, answer: true, difficulty: true },
  });
  const nq = normalizar(pendente.question);
  const faixaDe = (d) => (d === "dificil" ? "Avançado" : "Padrão");

  let parecida = null;
  for (const e of doTema) {
    if (normalizar(e.question) === nq) {
      // Idêntica: bloqueia a aprovação e mostra qual já existe.
      return res.status(409).json({
        error: `Já existe uma pergunta idêntica aprovada neste tema: "${e.question}" (resposta: ${e.answer}). Rejeite a sugestão ou edite-a antes de aprovar.`,
      });
    }
    // Parecida: mesma sala (faixa) e mesma resposta, enunciado 60%+ igual.
    if (
      !parecida &&
      faixaDe(e.difficulty) === faixaDe(pendente.difficulty) &&
      normalizar(e.answer) === normalizar(pendente.answer) &&
      semelhanca(nq.split(" "), normalizar(e.question).split(" ")) >= 0.6
    ) {
      parecida = e;
    }
  }

  const entry = await prisma.quizQuestion.update({
    where: { id: req.params.id },
    data: { status: "approved", validationNote: null },
  });
  cacheInvalidar("quiz:parecidas");
  res.json({
    ...entry,
    // Aprovada, mas com aviso: existe uma parecida na mesma sala. Ela também
    // vai aparecer no painel de parecidas pra revisão com calma.
    aviso: parecida
      ? `Aprovada, mas atenção: existe uma parecida na mesma sala — "${parecida.question}" (resposta: ${parecida.answer}). Confira depois no painel de parecidas.`
      : undefined,
  });
});

router.post("/quiz-questions/:id/reject", async (req, res) => {
  const entry = await prisma.quizQuestion.update({
    where: { id: req.params.id },
    data: { status: "rejected" },
  });
  res.json(entry);
});

// Índice completo de perguntas de um tema (para o painel de gerenciamento)
router.get("/quiz-questions", async (req, res) => {
  const { themeKey } = req.query;
  if (!themeKey) return res.status(400).json({ error: "themeKey é obrigatório." });
  const questions = await prisma.quizQuestion.findMany({
    where: { themeKey },
    orderBy: { createdAt: "desc" },
  });
  res.json(questions);
});

// Admin/moderador insere uma pergunta direto, já aprovada (sem fila)
router.post("/quiz-questions", async (req, res) => {
  const { themeKey, question, answer, difficulty } = req.body;
  if (!themeKey || !question?.trim() || !answer?.trim()) {
    return res.status(400).json({ error: "themeKey, question e answer são obrigatórios." });
  }
  const entry = await prisma.quizQuestion.create({
    data: {
      themeKey,
      question: question.trim(),
      answer: answer.trim(),
      status: "approved",
      difficulty: ["facil", "medio", "dificil"].includes(difficulty) ? difficulty : "medio",
    },
  });
  res.json(entry);
});

// Pares de perguntas PARECIDAS dentro da mesma sala — pra revisão manual.
//
// Repetição entre salas diferentes é legítima (a mesma pergunta pode caber
// em Futebol e em Esportes), então o agrupamento é por sala: tema + faixa de
// dificuldade, já que "Padrão" (fácil/médio) e "Avançado" (difícil) nunca se
// cruzam pro mesmo jogador.
//
// O cálculo é pesado o bastante pra não valer rodar a cada abertura da tela:
// fica em cache por 10 minutos.
// Perguntas do mesmo TEMA que compartilham a MESMA RESPOSTA.
//
// Diferente do painel de "parecidas", que compara o texto das perguntas, aqui
// o critério é a resposta. Duas perguntas escritas de formas completamente
// diferentes podem levar ao mesmo lugar:
//
//   "Qual clube tem mais títulos da Copa do Brasil?"        -> Cruzeiro
//   "Qual clube brasileiro venceu a Libertadores em 1997?"  -> Cruzeiro
//
// Para quem joga, é o mesmo assunto voltando. Num tema com 604 perguntas e
// 416 respostas distintas, quase um terço da sala soa repetida.
//
// A comparação ignora acento, caixa e pontuação: "Pokémon" e "pokemon" são a
// mesma resposta.
router.get("/quiz-respostas-repetidas", requireRole("ADMIN"), async (req, res) => {
  const tema = req.query.tema || null;

  const where = { status: "approved" };
  if (tema) where.themeKey = tema;

  const perguntas = await prisma.quizQuestion.findMany({
    where,
    select: { id: true, themeKey: true, question: true, answer: true, difficulty: true },
  });

  const chave = (t) =>
    (t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

  // Agrupa por tema + resposta: a mesma resposta em temas diferentes é
  // legítima (ex.: "Brasil" em Geografia e em Futebol).
  const grupos = new Map();
  for (const q of perguntas) {
    const k = `${q.themeKey}::${chave(q.answer)}`;
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(q);
  }

  const repetidas = [...grupos.values()]
    .filter((g) => g.length > 1)
    .sort((a, b) => b.length - a.length)
    .map((g) => ({
      themeKey: g[0].themeKey,
      answer: g[0].answer,
      total: g.length,
      perguntas: g,
    }));

  const distintas = grupos.size;
  res.json({
    total: perguntas.length,
    distintas,
    grupos: repetidas,
    // Quantas perguntas estão envolvidas em alguma repetição.
    envolvidas: repetidas.reduce((s, g) => s + g.total, 0),
  });
});

router.get("/quiz-parecidas", requireRole("ADMIN"), async (req, res) => {
  const limite = Math.min(Math.max(Number(req.query.limite) || 60, 10), 95) / 100;

  const pares = await cacheOuBuscar(`quiz:parecidas:${limite}`, 600, async () => {
    const perguntas = await prisma.quizQuestion.findMany({
      where: { status: "approved" },
      select: { id: true, themeKey: true, question: true, answer: true, difficulty: true },
    });

    const normalizar = (t) =>
      t
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const semelhanca = (a, b) => {
      const A = new Set(a);
      const B = new Set(b);
      let comuns = 0;
      for (const p of A) if (B.has(p)) comuns++;
      return comuns / (A.size + B.size - comuns);
    };

    // Agrupa por sala + resposta. Comparar todas contra todas seriam milhões
    // de combinações; duplicata de verdade quase sempre tem a mesma resposta.
    const grupos = new Map();
    for (const q of perguntas) {
      const faixa = q.difficulty === "dificil" ? "Avançado" : "Padrão";
      const chave = `${q.themeKey}|${faixa}|${normalizar(q.answer)}`;
      if (!grupos.has(chave)) grupos.set(chave, []);
      grupos.get(chave).push(q);
    }

    const achados = [];
    for (const [chave, grupo] of grupos) {
      if (grupo.length < 2) continue;
      const [themeKey, faixa] = chave.split("|");
      for (let i = 0; i < grupo.length; i++) {
        for (let j = i + 1; j < grupo.length; j++) {
          const ta = normalizar(grupo[i].question);
          const tb = normalizar(grupo[j].question);
          const s = ta === tb ? 1 : semelhanca(ta.split(" "), tb.split(" "));
          if (s >= limite) {
            achados.push({
              sala: `${themeKey} — ${faixa}`,
              themeKey,
              semelhanca: Math.round(s * 100),
              a: grupo[i],
              b: grupo[j],
            });
          }
        }
      }
    }
    achados.sort((x, y) => y.semelhanca - x.semelhanca);
    return achados;
  });

  // Remove os pares que o admin já revisou e marcou como legítimos. Isso é
  // feito fora do cache de propósito: assim, aprovar um par tem efeito
  // imediato sem precisar esperar o cache expirar.
  const aprovados = await prisma.quizParDiferente.findMany({ select: { idA: true, idB: true } });
  const jaAprovado = new Set(aprovados.map((p) => `${p.idA}|${p.idB}`));
  const chaveDe = (a, b) => [a, b].sort().join("|");
  const filtrados = pares.filter((p) => !jaAprovado.has(chaveDe(p.a.id, p.b.id)));

  res.json({ total: filtrados.length, pares: filtrados });
});

// Marca um par como "são diferentes" — decisão do admin persistida no banco,
// pra não reaparecer quando a lista for recalculada após novas importações.
router.post("/quiz-parecidas/aprovar", requireRole("ADMIN"), async (req, res) => {
  // Aceita um par único ({ idA, idB }) ou vários de uma vez ({ pares: [...] }).
  // O lote existe porque perguntas parecidas costumam vir em "cachos": 4
  // variantes da mesma resposta geram 6 combinações de pares, e aprovar uma
  // por uma dava a impressão de que os pares "voltavam" — eram os irmãos do
  // mesmo cacho aparecendo um a um.
  const lote = Array.isArray(req.body.pares)
    ? req.body.pares
    : req.body.idA && req.body.idB
      ? [{ idA: req.body.idA, idB: req.body.idB }]
      : [];
  if (lote.length === 0) return res.status(400).json({ error: "Informe os ids do par (ou a lista em pares)." });

  try {
    for (const { idA, idB } of lote) {
      if (!idA || !idB) continue;
      // Ordena pra que o par (X, Y) e (Y, X) virem a mesma linha.
      const [menor, maior] = [idA, idB].sort();
      await prisma.quizParDiferente.upsert({
        where: { idA_idB: { idA: menor, idB: maior } },
        create: { idA: menor, idB: maior },
        update: {},
      });
    }
  } catch (err) {
    // O caso clássico é a tabela ainda não existir no banco (o deploy do
    // código não cria tabela — isso exige rodar "npx prisma db push" uma
    // vez). Sem esta mensagem, o painel só dizia "erro ao salvar" e ficava
    // impossível saber o motivo de os pares voltarem.
    console.error("Falha ao salvar par aprovado:", err.message);
    return res.status(500).json({
      error:
        "Não consegui gravar no banco. Se for a primeira vez usando este recurso, rode `npx prisma db push` na pasta backend (cria a tabela QuizParDiferente) e tente de novo.",
    });
  }
  res.json({ ok: true, aprovados: lote.length });
});

router.delete("/quiz-questions/:id", async (req, res) => {
  const id = req.params.id;
  await prisma.quizQuestion.delete({ where: { id } });
  // Limpa pares aprovados que citavam essa pergunta — viraram lixo agora.
  await prisma.quizParDiferente.deleteMany({ where: { OR: [{ idA: id }, { idB: id }] } });
  // A lista de parecidas é calculada em cima do banco: apagar uma pergunta
  // invalida o cache, senão o par apagado continuaria aparecendo na tela.
  cacheInvalidar("quiz:parecidas");
  res.json({ ok: true });
});

// Busca por pergunta/resposta em TODOS os temas de uma vez — usado pra achar
// e corrigir/apagar uma pergunta específica sem precisar navegar tema por tema.
router.get("/quiz-questions/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json([]);
  const results = await prisma.quizQuestion.findMany({
    where: {
      OR: [
        { question: { contains: q, mode: "insensitive" } },
        { answer: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(results);
});

router.patch("/quiz-questions/:id", async (req, res) => {
  const { question, answer, themeKey, difficulty } = req.body;
  const data = {};
  if (question !== undefined) {
    if (!question.trim()) return res.status(400).json({ error: "A pergunta não pode ficar vazia." });
    data.question = question.trim();
  }
  if (answer !== undefined) {
    if (!answer.trim()) return res.status(400).json({ error: "A resposta não pode ficar vazia." });
    data.answer = answer.trim();
  }
  if (themeKey !== undefined) data.themeKey = themeKey;
  if (difficulty !== undefined && ["facil", "medio", "dificil"].includes(difficulty)) {
    data.difficulty = difficulty;
  }
  const updated = await prisma.quizQuestion.update({ where: { id: req.params.id }, data });
  // Se o texto mudou, aprovações antigas desse par podem não fazer mais
  // sentido — remove pra que a pergunta seja reavaliada na próxima listagem.
  if (data.question !== undefined) {
    await prisma.quizParDiferente.deleteMany({ where: { OR: [{ idA: req.params.id }, { idB: req.params.id }] } });
  }
  cacheInvalidar("quiz:parecidas");
  res.json(updated);
});

// Histórico de cadastros por dia. Serve pra enxergar o efeito de anúncios,
// posts e divulgações: um pico no gráfico indica que algo daquele dia
// funcionou. Visitantes não contam — só contas de verdade.
router.get("/cadastros-por-dia", requireRole("ADMIN"), async (req, res) => {
  const dias = Math.min(Number(req.query.dias) || 90, 365);
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);
  desde.setHours(0, 0, 0, 0);

  const contas = await prisma.user.findMany({
    where: { isGuest: false, createdAt: { gte: desde } },
    select: { createdAt: true, ultimaPlataforma: true },
    orderBy: { createdAt: "asc" },
  });

  // Agrupa por data local (America/Sao_Paulo). Fazer isso na aplicação, e
  // não no banco, evita depender do fuso configurado no Postgres — que no
  // Neon é UTC e jogaria os cadastros da madrugada pro dia seguinte.
  const porDia = new Map();
  for (const c of contas) {
    const chave = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(c.createdAt);
    const reg = porDia.get(chave) || { data: chave, total: 0, mobile: 0, desktop: 0 };
    reg.total += 1;
    if (c.ultimaPlataforma === "mobile") reg.mobile += 1;
    else if (c.ultimaPlataforma === "desktop") reg.desktop += 1;
    porDia.set(chave, reg);
  }

  // Preenche os dias sem nenhum cadastro com zero, senão o gráfico "pula"
  // datas e dá a impressão de movimento contínuo onde não houve.
  const serie = [];
  const cursor = new Date(desde);
  const hoje = new Date();
  while (cursor <= hoje) {
    const chave = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(cursor);
    serie.push(porDia.get(chave) || { data: chave, total: 0, mobile: 0, desktop: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  const total = serie.reduce((s, d) => s + d.total, 0);
  const melhor = serie.reduce((a, b) => (b.total > a.total ? b : a), serie[0] || null);
  res.json({
    dias,
    total,
    mediaPorDia: serie.length ? Number((total / serie.length).toFixed(1)) : 0,
    melhorDia: melhor,
    serie,
  });
});

router.get("/users", requireRole("ADMIN"), async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true, nickname: true, email: true, role: true, banned: true, createdAt: true,
      ultimaPlataforma: true, ultimoAcesso: true,
      premiumAte: true, premiumVitalicio: true,
    },
    orderBy: { createdAt: "asc" },
  });
  res.json(users);
});

// Resumo de quantos jogam no celular e quantos no computador. Útil pra
// decidir onde vale investir esforço de interface.
router.get("/plataformas", requireRole("ADMIN"), async (req, res) => {
  const grupos = await prisma.user.groupBy({
    by: ["ultimaPlataforma"],
    _count: { _all: true },
    where: { isGuest: false },
  });

  const resumo = { mobile: 0, desktop: 0, desconhecido: 0 };
  for (const g of grupos) {
    if (g.ultimaPlataforma === "mobile") resumo.mobile = g._count._all;
    else if (g.ultimaPlataforma === "desktop") resumo.desktop = g._count._all;
    else resumo.desconhecido += g._count._all;
  }

  // Últimos 30 dias — mostra a tendência atual, não o histórico todo.
  const desde = new Date();
  desde.setDate(desde.getDate() - 30);
  const recentes = await prisma.user.groupBy({
    by: ["ultimaPlataforma"],
    _count: { _all: true },
    where: { isGuest: false, ultimoAcesso: { gte: desde } },
  });
  const ultimos30 = { mobile: 0, desktop: 0 };
  for (const g of recentes) {
    if (g.ultimaPlataforma === "mobile") ultimos30.mobile = g._count._all;
    else if (g.ultimaPlataforma === "desktop") ultimos30.desktop = g._count._all;
  }

  res.json({ total: resumo, ultimos30 });
});

// Concede ou remove premium na mão. Enquanto não há pagamento integrado,
// é assim que damos cortesia pra fundadores, parceiros e testes.
router.post("/users/:id/premium", requireRole("ADMIN"), async (req, res) => {
  const { dias, vitalicio, remover } = req.body;

  if (remover) {
    await prisma.user.update({
      where: { id: req.params.id },
      data: { premiumAte: null, premiumVitalicio: false },
    });
    return res.json({ ok: true, premium: false });
  }

  if (vitalicio) {
    await prisma.user.update({
      where: { id: req.params.id },
      data: { premiumVitalicio: true },
    });
    return res.json({ ok: true, vitalicio: true });
  }

  const n = Number(dias);
  if (!Number.isFinite(n) || n < 1 || n > 3650) {
    return res.status(400).json({ error: "Informe de 1 a 3650 dias." });
  }

  // Se já tem premium válido, soma ao prazo em vez de substituir.
  const atual = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { premiumAte: true },
  });
  const base = atual?.premiumAte && new Date(atual.premiumAte) > new Date()
    ? new Date(atual.premiumAte)
    : new Date();
  base.setDate(base.getDate() + n);

  await prisma.user.update({ where: { id: req.params.id }, data: { premiumAte: base } });
  res.json({ ok: true, premiumAte: base });
});

router.post("/users/:id/role", requireRole("ADMIN"), async (req, res) => {
  const { role } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role },
  });
  res.json({ id: user.id, role: user.role });
});

// Banir/desbanir: reversível — bloqueia login e desconecta sessões ativas,
// mas não apaga nada. É a opção mais segura pro dia a dia.
router.post("/users/:id/ban", requireRole("ADMIN"), async (req, res) => {
  if (req.user.id === req.params.id) {
    return res.status(400).json({ error: "Você não pode banir sua própria conta." });
  }
  const { banned } = req.body;
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) return res.status(404).json({ error: "Usuário não encontrado." });
  if (target.role === "ADMIN") {
    return res.status(400).json({ error: "Não é possível banir uma conta de administrador." });
  }
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { banned: !!banned },
  });
  res.json({ id: user.id, banned: user.banned });
});

// Apagar de vez: remove a conta e todo o histórico associado (pontuações,
// mensagens salvas, sugestões, amizades, feedback). Se a pessoa for dona de
// um clã, o clã também é desfeito (os outros membros só perdem o clã, não
// são apagados). Ação PERMANENTE — não tem como desfazer.
router.delete("/users/:id", requireRole("ADMIN"), async (req, res) => {
  const userId = req.params.id;
  if (req.user.id === userId) {
    return res.status(400).json({ error: "Você não pode apagar sua própria conta por aqui." });
  }
  const target = await prisma.user.findUnique({ where: { id: userId }, include: { ownedClan: true } });
  if (!target) return res.status(404).json({ error: "Usuário não encontrado." });
  if (target.role === "ADMIN") {
    return res.status(400).json({ error: "Não é possível apagar uma conta de administrador por aqui." });
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (target.ownedClan) {
        const clanId = target.ownedClan.id;
        await tx.user.updateMany({ where: { clanId }, data: { clanId: null } });
        await tx.clanInvite.deleteMany({ where: { clanId } });
        await tx.clan.delete({ where: { id: clanId } });
      }
      await tx.clanInvite.deleteMany({ where: { invitedId: userId } });
      await tx.feedback.deleteMany({ where: { userId } });
      await tx.chatMessage.deleteMany({ where: { userId } });
      await tx.friendship.deleteMany({ where: { OR: [{ userAId: userId }, { userBId: userId }] } });
      await tx.monthlyScore.deleteMany({ where: { userId } });
      await tx.lifetimeScore.deleteMany({ where: { userId } });
      await tx.blockScore.deleteMany({ where: { userId } });
      await tx.wordEntry.updateMany({ where: { suggestedById: userId }, data: { suggestedById: null } });
      await tx.quizQuestion.updateMany({ where: { suggestedById: userId }, data: { suggestedById: null } });
      await tx.user.delete({ where: { id: userId } });
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("Falha ao apagar usuário", userId, err.message);
    res.status(500).json({ error: "Erro ao apagar usuário. Tenta de novo?" });
  }
});

// Lista os sinais suspeitos agrupados por jogador, do mais sinalizado pro
// menos — só pra revisão manual, nunca aplica nenhuma ação sozinho.
router.get("/suspicious-activity", async (req, res) => {
  const entries = await prisma.suspiciousActivity.findMany({
    include: { user: { select: { id: true, nickname: true, email: true, banned: true } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const byUser = new Map();
  for (const e of entries) {
    if (!byUser.has(e.userId)) {
      byUser.set(e.userId, { user: e.user, count: 0, pasteCount: 0, tooPerfectCount: 0, latest: e.createdAt, items: [] });
    }
    const group = byUser.get(e.userId);
    group.count++;
    if (e.reason === "paste") group.pasteCount++;
    if (e.reason === "too_perfect") group.tooPerfectCount++;
    if (group.items.length < 10) {
      group.items.push({ reason: e.reason, detail: e.detail, roomId: e.roomId, createdAt: e.createdAt });
    }
  }

  const grouped = [...byUser.values()].sort((a, b) => b.count - a.count);
  res.json(grouped);
});

// Descarta os registros de atividade suspeita de um jogador — pra quando o
// admin revisa e conclui que foi alarme falso (a detecção é por sinais
// indiretos, então erra de vez em quando). Só apaga o registro; a conta
// da pessoa não é afetada de forma nenhuma.
router.delete("/suspicious-activity/:userId", async (req, res) => {
  const { userId } = req.params;
  const r = await prisma.suspiciousActivity.deleteMany({ where: { userId } });
  res.json({ ok: true, removidos: r.count });
});

// Perguntas denunciadas por jogadores, agrupadas — a com mais denúncias
// primeiro, já que é a mais provável de ter problema real.
router.get("/question-reports", async (req, res) => {
  const reports = await prisma.quizQuestionReport.findMany({
    where: { resolved: false },
    include: {
      question: true,
      user: { select: { nickname: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const byQuestion = new Map();
  for (const r of reports) {
    if (!byQuestion.has(r.questionId)) {
      byQuestion.set(r.questionId, {
        questionId: r.questionId,
        question: r.question,
        count: 0,
        reports: [],
      });
    }
    const g = byQuestion.get(r.questionId);
    g.count++;
    g.reports.push({
      id: r.id,
      nickname: r.user.nickname,
      reason: r.reason,
      comment: r.comment,
      createdAt: r.createdAt,
    });
  }

  res.json([...byQuestion.values()].sort((a, b) => b.count - a.count));
});

// Marca todas as denúncias de uma pergunta como resolvidas (depois que o
// admin corrigiu ou decidiu que estava tudo certo).
router.post("/question-reports/:questionId/resolve", async (req, res) => {
  await prisma.quizQuestionReport.updateMany({
    where: { questionId: req.params.questionId },
    data: { resolved: true },
  });
  res.json({ ok: true });
});

// Quem está online agora, e onde. Junta as quatro fontes possíveis: as três
// de salas de jogo e o chat geral (quem está só na página inicial).
router.get("/online", async (req, res) => {
  // Cache de 5 segundos: o painel se atualiza sozinho a cada 15s e pode ter
  // mais de um admin com a página aberta. Sem isso, cada um dispararia a
  // consulta de forma independente — sem ganho nenhum, já que o dado é o
  // mesmo pra todos.
  const emCache = cacheGet("admin:online");
  if (emCache) return res.json(emCache);

  const porJogo = [
    ["Stop", getStopOnlineDetailed()],
    ["Quiz", getQuizOnlineDetailed()],
    ["Acromania", getAcromaniaOnlineDetailed()],
  ];

  // userId -> { nickname, locais: [] }
  const pessoas = new Map();

  for (const [jogo, lista] of porJogo) {
    for (const p of lista) {
      if (!pessoas.has(p.userId)) {
        pessoas.set(p.userId, { userId: p.userId, nickname: p.nickname, locais: [] });
      }
      pessoas.get(p.userId).locais.push({ jogo, sala: p.roomLabel });
    }
  }

  // Quem está conectado em QUALQUER página do site (presença global) e não
  // apareceu em sala nenhuma — inclui painel admin, ranking, perfil etc.
  // Antes essa fonte era só o chat geral da página inicial, e quem estava
  // navegando em outras páginas ficava invisível.
  for (const p of getPresenceOnline()) {
    if (!pessoas.has(p.userId)) {
      pessoas.set(p.userId, { userId: p.userId, nickname: p.nickname, locais: [] });
    }
  }
  // Mantém o chat geral como fonte extra por segurança (é subconjunto da
  // presença global, mas não custa nada e cobre qualquer aresta).
  for (const p of getGeneralChatOnline()) {
    if (!pessoas.has(p.userId)) {
      pessoas.set(p.userId, { userId: p.userId, nickname: p.nickname, locais: [] });
    }
  }

  const lista = [...pessoas.values()];

  // Marca quem é visitante, pra dar contexto ao número total.
  const ids = lista.map((p) => p.userId);
  let visitantes = new Set();
  if (ids.length > 0) {
    try {
      const guests = await prisma.user.findMany({
        where: { id: { in: ids }, isGuest: true },
        select: { id: true },
      });
      visitantes = new Set(guests.map((g) => g.id));
    } catch {
      // se falhar, segue sem a marcação — não vale derrubar a rota por isso
    }
  }

  const resultado = lista.map((p) => ({
    ...p,
    isGuest: visitantes.has(p.userId),
    local: p.locais.length > 0 ? p.locais.map((l) => `${l.jogo}: ${l.sala}`).join(" · ") : "Navegando no site",
  }));

  // Quem está jogando aparece primeiro; depois ordem alfabética.
  resultado.sort(
    (a, b) =>
      b.locais.length - a.locais.length || a.nickname.localeCompare(b.nickname, "pt-BR")
  );

  // Manda no máximo 150 nomes. Os CONTADORES continuam completos — só a
  // lista é cortada, pra resposta não crescer sem limite se o site bombar.
  // Quem está jogando vem primeiro na ordenação, então os cortados são os
  // que estão parados na página inicial.
  const LIMITE_LISTA = 150;
  const resposta = {
    total: resultado.length,
    registrados: resultado.filter((p) => !p.isGuest).length,
    visitantes: resultado.filter((p) => p.isGuest).length,
    jogando: resultado.filter((p) => p.locais.length > 0).length,
    jogadores: resultado.slice(0, LIMITE_LISTA),
    ocultos: Math.max(0, resultado.length - LIMITE_LISTA),
  };

  cacheSet("admin:online", resposta, 5);
  res.json(resposta);
});

export default router;
