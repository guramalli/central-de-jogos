import express, { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { verifyToken } from "../utils/jwt.js";
import { cacheOuBuscar, cacheInvalidar } from "../utils/cache.js";
import { validarCasa, escolherCasas, validarRanking, SKILLS_RANK } from "../lenda/validar.js";
import { abrirSave, fichaPublica } from "../lenda/ficha.js";
import { registrarSinal, JOGANDO_AGORA_MS, GUARDAR_DIAS } from "../lenda/sessoes.js";
import { TORCIDAS, validarTorcida, amigosDe, podeTorcer, GUARDAR_DIAS as TORCIDA_DIAS } from "../lenda/torcida.js";
import { validarContagens, podeContar, somarContagens, resumir, GUARDAR_DIAS as CONTAGEM_DIAS } from "../lenda/contagens.js";
import { conferirProgresso } from "../lenda/validar.js";
import { criaPutSave } from "../lenda/saveNuvem.js";
import { timePublico } from "../lenda/times.js";
import { contasForaDoRanking, registrarSuspeito, GAME_KEY, MOTIVOS_QUE_ESCONDEM } from "../lenda/suspeitos.js";
import { apagarDadosLenda, tabelasLenda } from "../lenda/apagar.js";
import { sendFeedbackEmail } from "../utils/mailer.js";
import { contaVisita, validarDenuncia, podeDenunciar, MOTIVOS_DENUNCIA } from "../lenda/limites.js";

// ===== Lenda do Campinho (RPG de futebol, em public/lenda-do-campinho/) =====
//
// O jogo roda no navegador de cada um. Aqui ficam só:
//   - o save na nuvem (pra continuar em outro aparelho);
//   - a casa publicada de cada jogador, que os outros veem e podem visitar.
// Tabelas próprias (LendaSave, LendaCasa), sem mexer em nenhuma outra.
// Nada aqui mexe em partida em andamento dos outros jogos.

const router = Router();

// Salvar muito seguido não ajuda ninguém: o limite do save (10 s; 1,5 s ao fechar a página) está em lenda/saveNuvem.js.
const CASA_INTERVALO_MS = 5_000;
const RANKING_INTERVALO_MS = 30_000;

// Quem está pedindo (opcional): as rotas públicas funcionam sem login, mas
// com login dá pra não mostrar a casa da própria pessoa pra ela mesma.
function quemPede(req) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return null;
  try { return verifyToken(h.split(" ")[1]).id || null; } catch { return null; }
}

// ---------- save na nuvem ----------
router.get("/save", requireAuth, async (req, res) => {
  const s = await prisma.lendaSave.findUnique({ where: { userId: req.user.id } });
  if (!s) return res.status(404).json({ error: "Nenhum save na nuvem ainda." });
  // O jogo confere o save a cada ~30 s enquanto roda (sessao_unica.js): vale como sinal de "está jogando".
  registrarSinal(prisma, req.user.id, s.nivel, req.headers["user-agent"]);
  res.json({ dados: s.dados, nivel: s.nivel, atualizadoEm: s.atualizadoEm });
});

// v407 (Raio-X A9): só QUANDO o save mudou e o nível, sem os ~90 kB do save. O jogo confere isto a cada ~30 s
// (sessao_unica.js: "abriram este personagem em outro aparelho?") e só baixa o save inteiro quando a data mudou.
router.get("/save/meta", requireAuth, async (req, res) => {
  const s = await prisma.lendaSave.findUnique({ where: { userId: req.user.id }, select: { nivel: true, atualizadoEm: true } });
  if (!s) return res.status(404).json({ error: "Nenhum save na nuvem ainda." });
  registrarSinal(prisma, req.user.id, s.nivel, req.headers["user-agent"]);
  res.json({ nivel: s.nivel, atualizadoEm: s.atualizadoEm });
});

// v411.4: as regras do envio (intervalo, "fechando a página", ordem dos envios) ficam em lenda/saveNuvem.js
router.put("/save", requireAuth, criaPutSave({ prisma, sinal: registrarSinal }));

// ---------- casas ----------
// Publicar (ou atualizar) a minha casa.
router.put("/casa", requireAuth, async (req, res) => {
  const v = validarCasa(req.body);
  if (!v.ok) return res.status(400).json({ error: v.erro });
  const antes = await prisma.lendaCasa.findUnique({ where: { userId: req.user.id }, select: { atualizadoEm: true, mapa: true } });
  if (antes && Date.now() - new Date(antes.atualizadoEm).getTime() < CASA_INTERVALO_MS) {
    return res.status(429).json({ error: "Atualizando rápido demais." });
  }
  // O nome mostrado é o APELIDO da conta (já passa pelas regras do site), não
  // o nome do personagem, que é livre.
  const eu = await prisma.user.findUnique({ where: { id: req.user.id }, select: { nickname: true } });
  const dados = { apelido: eu?.nickname || req.user.nickname || "Jogador", ...v.casa };
  await prisma.lendaCasa.upsert({ where: { userId: req.user.id }, create: { userId: req.user.id, ...dados }, update: dados });
  cacheInvalidar("lenda:casas:");
  res.json({ ok: true });
});

// Vendi a casa: some da vizinhança.
router.delete("/casa", requireAuth, async (req, res) => {
  await prisma.lendaCasa.deleteMany({ where: { userId: req.user.id } });
  cacheInvalidar("lenda:casas:");
  res.json({ ok: true });
});

// Casas de outros jogadores num lugar (para as portas do mapa). Público.
router.get("/casas", async (req, res) => {
  const mapa = String(req.query.mapa || "");
  if (!/^[a-z]{2,12}$/.test(mapa)) return res.status(400).json({ error: "Lugar inválido." });
  const limite = Math.min(12, Math.max(1, parseInt(req.query.limite, 10) || 6));
  const lista = await cacheOuBuscar(`lenda:casas:${mapa}`, 60, () =>
    prisma.lendaCasa.findMany({
      where: { mapa },
      orderBy: [{ prestigio: "desc" }, { atualizadoEm: "desc" }],
      take: 60,
      select: { userId: true, apelido: true, casaId: true, prestigio: true, vitrine: true, visitas: true },
    })
  );
  res.json(escolherCasas(lista, { excluir: quemPede(req), limite }));
});

// Ranking das casas mais incríveis. Público.
router.get("/casas-ranking", async (_req, res) => {
  const lista = await cacheOuBuscar("lenda:casas:ranking", 60, () =>
    prisma.lendaCasa.findMany({
      orderBy: [{ prestigio: "desc" }, { visitas: "desc" }],
      take: 20,
      select: { userId: true, apelido: true, casaId: true, mapa: true, prestigio: true, visitas: true, vitrine: true },
    })
  );
  res.json(lista);
});

// ---------- ranking online dos jogadores ----------
// Atualizar a minha linha (o jogo manda sozinho, no máximo 1x por minuto).
router.put("/ranking", requireAuth, async (req, res) => {
  const v = validarRanking(req.body);
  if (!v.ok) return res.status(400).json({ error: v.erro });
  const antes = await prisma.lendaRanking.findUnique({ where: { userId: req.user.id }, select: { atualizadoEm: true, nivel: true, xp: true } });
  if (antes && Date.now() - new Date(antes.atualizadoEm).getTime() < RANKING_INTERVALO_MS) {
    return res.status(429).json({ error: "Atualizando rápido demais." });
  }
  const eu = await prisma.user.findUnique({ where: { id: req.user.id }, select: { nickname: true, createdAt: true } });
  // v407 (Raio-X U7): o XP bate com o nível pela curva do jogo? ganhou rápido demais desde o último envio? o nível pulou?
  // Reprovado: a linha é guardada mesmo assim e o envio entra na lista do painel. Só XP fora da curva ou ganho
  // absurdo (MOTIVOS_QUE_ESCONDEM) tiram a conta dos rankings até o admin descartar (v409, lenda/suspeitos.js).
  const conf = conferirProgresso(v.ranking, antes, eu?.createdAt);
  if (!conf.ok) registrarSuspeito(prisma, req.user.id, "lenda_" + conf.motivo, conf.detalhe).then((novo) => { if (novo) cacheInvalidar("lenda:"); });
  const dados = { apelido: eu?.nickname || req.user.nickname || "Jogador", ...v.ranking };
  await prisma.lendaRanking.upsert({ where: { userId: req.user.id }, create: { userId: req.user.id, ...dados }, update: dados });
  // v388: as habilidades vão À PARTE — se as colunas ainda não existem no banco (antes do prisma db push), o ranking de nível segue normal
  if (v.skills) { try { await prisma.lendaRanking.update({ where: { userId: req.user.id }, data: v.skills }); cacheInvalidar("lenda:rankskill:"); } catch { /* sem as colunas ainda */ } }
  // Limpa a lista guardada: quem acabou de entrar aparece na hora (antes
  // esperava até 1 min, e a janela aberta logo em seguida vinha vazia).
  cacheInvalidar("lenda:ranking");
  registrarSinal(prisma, req.user.id, v.ranking.nivel, req.headers["user-agent"]);
  res.json(conf.ok || !MOTIVOS_QUE_ESCONDEM.includes("lenda_" + conf.motivo) ? { ok: true } : { ok: true, emRevisao: true });
});

// ---------- amigos e torcida (ver lenda/torcida.js) ----------
// Meus amigos do site que jogam o Lenda: só apelido, nível, fase e a casa publicada.
router.get("/amigos", requireAuth, async (req, res) => {
  const ids = await amigosDe(prisma, req.user.id);
  if (!ids.length) return res.json({ amigos: [], torcidas: TORCIDAS });
  const [users, ranks, casas] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: ids }, banned: false }, select: { id: true, nickname: true } }),
    prisma.lendaRanking.findMany({ where: { userId: { in: ids } }, select: { userId: true, nivel: true, fase: true, posicao: true, atualizadoEm: true } }),
    prisma.lendaCasa.findMany({ where: { userId: { in: ids } }, select: { userId: true, casaId: true } }),
  ]);
  const rk = new Map(ranks.map((r) => [r.userId, r])), cs = new Map(casas.map((c) => [c.userId, c.casaId]));
  const amigos = users.filter((u) => rk.has(u.id)).map((u) => ({
    id: u.id, apelido: u.nickname, nivel: rk.get(u.id).nivel, fase: rk.get(u.id).fase, posicao: rk.get(u.id).posicao,
    ultimoJogo: rk.get(u.id).atualizadoEm, casaId: cs.get(u.id) || null,
  })).sort((a, b) => b.nivel - a.nivel);
  res.json({ amigos, torcidas: TORCIDAS });
});
router.post("/torcida", requireAuth, async (req, res) => {
  const v = validarTorcida(req.body);
  if (!v.ok) return res.status(400).json({ error: v.erro });
  try {
    const p = await podeTorcer(prisma, req.user.id, v.para);
    if (!p.ok) return res.status(p.cedo ? 429 : 403).json({ error: p.erro });
    await prisma.lendaTorcida.create({ data: { de: req.user.id, para: v.para, tipo: v.tipo } });
    res.json({ ok: true });
  } catch { res.status(503).json({ error: "A torcida volta em instantes." }); } // (ex.: tabela ainda não criada)
});
// Torcidas recebidas e ainda não vistas (marca como vistas). Limpa as velhas de vez em quando.
router.get("/torcidas", requireAuth, async (req, res) => {
  try {
  const desde = new Date(Date.now() - TORCIDA_DIAS * 864e5);
  const lista = await prisma.lendaTorcida.findMany({ where: { para: req.user.id, vista: false, criadoEm: { gte: desde } }, orderBy: { criadoEm: "asc" }, take: 20 });
  if (lista.length) await prisma.lendaTorcida.updateMany({ where: { id: { in: lista.map((t) => t.id) } }, data: { vista: true } });
  const nomes = new Map((await prisma.user.findMany({ where: { id: { in: [...new Set(lista.map((t) => t.de))] } }, select: { id: true, nickname: true } })).map((u) => [u.id, u.nickname]));
  res.json({ torcidas: lista.map((t) => ({ de: nomes.get(t.de) || "Um amigo", texto: TORCIDAS[t.tipo] || "⚽", quando: t.criadoEm })) });
  if (Math.random() < 0.02) prisma.lendaTorcida.deleteMany({ where: { criadoEm: { lt: desde } } }).catch(() => {});
  } catch { if (!res.headersSent) res.json({ torcidas: [] }); }
});

// ---------- estatísticas anônimas (só contagens por dia; ver lenda/contagens.js) ----------
// Sem login e sem cookie; o corpo vem como texto (o navegador manda sem pedir licença antes).
// Responde na hora e soma depois: nunca atrasa o jogo.
router.post("/contagens", express.text({ type: "text/plain", limit: "4kb" }), (req, res) => {
  if (!podeContar(req.ip)) return res.status(429).end();
  const v = validarContagens(req.body);
  if (!v.ok) return res.status(400).json({ error: v.erro });
  res.status(204).end();
  if (v.itens.length) somarContagens(prisma, v.itens).catch(() => {});
});
// Painel do dono: ?dias=1..400
router.get("/admin/contagens", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const dias = Math.min(CONTAGEM_DIAS, Math.max(1, parseInt(req.query.dias, 10) || 30));
  const desde = new Date(Date.now() - dias * 864e5).toISOString().slice(0, 10);
  try {
    const linhas = await prisma.lendaContagem.findMany({ where: { dia: { gte: desde } }, orderBy: { dia: "asc" } });
    res.json({ dias, ...resumir(linhas) });
  } catch { res.status(503).json({ error: "Estatísticas ainda não ativadas no banco (rodar prisma db push)." }); }
});

// ---------- painel admin: quem está jogando e histórico de sessões ----------
// Só ADMIN (é o histórico de quando cada pessoa jogou). ?dias=1..90 e ?jogador=trecho do apelido.
router.get("/admin/sessoes", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const dias = Math.min(GUARDAR_DIAS, Math.max(1, parseInt(req.query.dias, 10) || 7));
  const busca = String(req.query.jogador || "").trim().slice(0, 30);
  const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
  let filtroUser = {};
  if (busca) {
    const achados = await prisma.user.findMany({ where: { nickname: { contains: busca, mode: "insensitive" } }, select: { id: true }, take: 200 });
    filtroUser = { userId: { in: achados.map((u) => u.id) } };
  }
  const sessoes = await prisma.lendaSessao.findMany({
    where: { ultimoSinal: { gte: desde }, ...filtroUser },
    orderBy: { inicio: "desc" },
    take: 500,
  });
  const nomes = new Map((await prisma.user.findMany({
    where: { id: { in: [...new Set(sessoes.map((s) => s.userId))] } },
    select: { id: true, nickname: true },
  })).map((u) => [u.id, u.nickname]));
  const agora = Date.now();
  const linhas = sessoes.map((s) => ({
    id: s.id,
    userId: s.userId,
    apelido: nomes.get(s.userId) || "(conta apagada)",
    inicio: s.inicio,
    ultimoSinal: s.ultimoSinal,
    minutos: Math.max(1, Math.round((new Date(s.ultimoSinal) - new Date(s.inicio)) / 60000)),
    nivelInicio: s.nivelInicio,
    nivelFim: s.nivelFim,
    plataforma: s.plataforma,
    jogandoAgora: agora - new Date(s.ultimoSinal).getTime() <= JOGANDO_AGORA_MS,
  }));
  res.json({
    dias,
    jogandoAgora: linhas.filter((l) => l.jogandoAgora),
    sessoes: linhas,
    resumo: {
      sessoes: linhas.length,
      jogadores: new Set(linhas.map((l) => l.userId)).size,
      minutos: linhas.reduce((t, l) => t + l.minutos, 0),
    },
  });
});

// Top dos jogadores por XP. Público; guardado 1 min (o banco não acorda a
// cada abertura da janela). Fica de fora conta banida ou oculta dos rankings.
// v407 (Raio-X U7): fora também os SUSPEITOS de trapaça (ver lenda/suspeitos.js). v409: conta de admin aparece.
// O nome do time sai sempre montado das listas (times.js), nunca o que foi digitado.
router.get("/ranking", async (_req, res) => {
  const lista = await cacheOuBuscar("lenda:ranking", 60, async () => {
    const topo = await prisma.lendaRanking.findMany({
      orderBy: [{ xp: "desc" }, { atualizadoEm: "asc" }],
      take: 100,
      select: { userId: true, apelido: true, nivel: true, xp: true, posicao: true, fase: true, time: true },
    });
    const fora = await contasForaDoRanking(prisma, topo.map((t) => t.userId));
    return topo.filter((t) => !fora.has(t.userId)).slice(0, 50).map((t) => ({ ...t, time: timePublico(t.time) }));
  });
  res.json(lista);
});

// v388: top 50 de cada HABILIDADE (o nível treinado). Público; guardado 1 min. Fora conta banida ou oculta.
router.get("/ranking/skill/:sk", async (req, res) => {
  const sk = req.params.sk;
  if (!SKILLS_RANK.includes(sk)) return res.status(400).json({ error: "Habilidade inválida." });
  try {
    const lista = await cacheOuBuscar("lenda:rankskill:" + sk, 60, async () => {
      const topo = await prisma.lendaRanking.findMany({
        where: { [sk]: { gt: 0 } }, orderBy: [{ [sk]: "desc" }, { xp: "desc" }], take: 80,
        select: { userId: true, apelido: true, nivel: true, posicao: true, [sk]: true },
      });
      const bloq = await contasForaDoRanking(prisma, topo.map((t) => t.userId));
      return topo.filter((t) => !bloq.has(t.userId)).slice(0, 50).map((t) => ({ userId: t.userId, apelido: t.apelido, nivel: t.nivel, posicao: t.posicao, valor: t[sk] }));
    });
    res.json(lista);
  } catch { res.status(503).json({ error: "O ranking de habilidades está chegando ao servidor." }); }
});

// ---------- personagens (página de cada jogador) ----------
// (as contas que ficam fora das listas: lenda/suspeitos.js, contasForaDoRanking)
// v407 (Raio-X U5): a ficha pública diz só se a pessoa "jogou esta semana" (sem dia e hora de quando joga)
const SEMANA_MS = 7 * 864e5;
const jogouSemana = (quando, agora = Date.now()) => !!quando && agora - new Date(quando).getTime() <= SEMANA_MS;
// Lista (com busca pelo apelido). Público; 1 min de cache por busca.
router.get("/personagens", async (req, res) => {
  const busca = String(req.query.busca || "").trim().slice(0, 30);
  const lista = await cacheOuBuscar("lenda:personagens:" + busca.toLowerCase(), 60, async () => {
    const achados = await prisma.lendaRanking.findMany({
      where: busca ? { apelido: { contains: busca, mode: "insensitive" } } : {},
      orderBy: [{ xp: "desc" }, { atualizadoEm: "asc" }], take: 70,
      select: { userId: true, apelido: true, nivel: true, xp: true, posicao: true, fase: true, time: true, atualizadoEm: true },
    });
    const bloq = await contasForaDoRanking(prisma, achados.map((a) => a.userId));
    return achados.filter((a) => !bloq.has(a.userId)).slice(0, 50)
      .map(({ userId, atualizadoEm, time, ...r }) => ({ ...r, time: timePublico(time), jogouSemana: jogouSemana(atualizadoEm) }));
  });
  res.json(lista);
});
// Ficha de um personagem pelo apelido da conta. Público; 1 min de cache.
// Vem do save na nuvem (fichaPublica escolhe só o que pode ser mostrado).
router.get("/personagem/:apelido", async (req, res) => {
  const apelido = String(req.params.apelido || "").trim().slice(0, 30);
  if (!apelido) return res.status(400).json({ error: "Diga o nome do personagem." });
  const r = await cacheOuBuscar("lenda:personagem:" + apelido.toLowerCase(), 60, async () => {
    const u = await prisma.user.findFirst({
      where: { nickname: { equals: apelido, mode: "insensitive" } },
      select: { id: true, nickname: true, createdAt: true, isGuest: true, banned: true, ocultoNoRanking: true },
    });
    if (!u || u.banned || u.ocultoNoRanking) return { naoAchou: true };
    const [save, rank] = await Promise.all([
      prisma.lendaSave.findUnique({ where: { userId: u.id }, select: { dados: true, atualizadoEm: true } }),
      prisma.lendaRanking.findUnique({ where: { userId: u.id }, select: { nivel: true, xp: true, fase: true, posicao: true, time: true, atualizadoEm: true } }),
    ]);
    if (!save && !rank) return { naoAchou: true };
    // v407 (Raio-X U5): sem o horário do último jogo (só "jogou esta semana") e "membro desde" só com mês e ano
    const desde = new Date(u.createdAt);
    return {
      apelido: u.nickname, membroDesde: new Date(Date.UTC(desde.getUTCFullYear(), desde.getUTCMonth(), 1)), visitante: !!u.isGuest,
      jogouSemana: jogouSemana((save || rank).atualizadoEm),
      ficha: save ? fichaPublica(abrirSave(save.dados)) : null,
      resumo: rank ? { nivel: rank.nivel, xp: rank.xp, fase: rank.fase, posicao: rank.posicao, time: timePublico(rank.time) } : null,
    };
  });
  if (r.naoAchou) return res.status(404).json({ error: "Personagem não encontrado." });
  res.json(r);
});

// Visitar a casa de alguém (só olhar). Conta a visita quando quem olha não é o dono.
router.get("/casa/:userId", async (req, res) => {
  const c = await prisma.lendaCasa.findUnique({ where: { userId: String(req.params.userId) } });
  if (!c) return res.status(404).json({ error: "Casa não encontrada." });
  const quem = quemPede(req);
  if (quem && quem !== c.userId && contaVisita(quem, c.userId)) { // v407 (Raio-X U7): 1 visita por visitante por dia
    prisma.lendaCasa.update({ where: { userId: c.userId }, data: { visitas: { increment: 1 } } }).catch(() => {});
  }
  res.json({ userId: c.userId, apelido: c.apelido, casaId: c.casaId, mapa: c.mapa, moveis: c.moveis, itens: c.itens, prestigio: c.prestigio, visitas: c.visitas });
});

// ---------- 🚩 denunciar um jogador (v407, Raio-X U5) ----------
// Sem texto livre: o jogo manda o ID do jogador e o NÚMERO de um motivo pronto. Vira um feedback (a lista de
// feedbacks do painel do admin, tipo "outro") e um e-mail para a equipe, com o apelido e o ID de quem foi denunciado.
router.get("/denunciar/motivos", (_req, res) => res.json({ motivos: MOTIVOS_DENUNCIA }));
router.post("/denunciar", requireAuth, async (req, res) => {
  const v = validarDenuncia(req.body);
  if (!v.ok) return res.status(400).json({ error: v.erro });
  if (v.alvoId === req.user.id) return res.status(400).json({ error: "Não dá para denunciar você mesmo." });
  const [eu, alvo] = await Promise.all([
    prisma.user.findUnique({ where: { id: req.user.id }, select: { nickname: true, email: true } }),
    prisma.user.findUnique({ where: { id: v.alvoId }, select: { id: true, nickname: true } }),
  ]);
  if (!alvo) return res.status(404).json({ error: "Jogador não encontrado." });
  const p = podeDenunciar(req.user.id, v.alvoId);
  if (!p.ok) return res.status(429).json({ error: p.erro });
  const message = `🚩 DENÚNCIA no Lenda do Campinho\nJogador denunciado: ${alvo.nickname} (id ${alvo.id})\nMotivo: ${MOTIVOS_DENUNCIA[v.motivo]}${v.onde ? `\nOnde: ${v.onde}` : ""}`;
  await prisma.feedback.create({ data: { userId: req.user.id, type: "outro", message } });
  sendFeedbackEmail({ nickname: eu?.nickname || "?", email: eu?.email || "?", type: "denúncia (Lenda)", message }).catch(() => {});
  res.json({ ok: true });
});

// ---------- 🗑️ apagar MEUS dados do jogo (v407, Raio-X U6) ----------
// Só o Lenda do Campinho (save na nuvem, ranking, casa, guilda, feira, torcidas, sessões); a conta do site continua.
// O personagem que está no aparelho não é apagado (o jogo avisa). Pede { confirmar: "APAGAR" } para não sair sem querer.
router.delete("/meus-dados", requireAuth, async (req, res) => {
  if (req.body?.confirmar !== "APAGAR") return res.status(400).json({ error: "Confirme para apagar." });
  try {
    const tabelas = await tabelasLenda(prisma);
    const feito = await prisma.$transaction((tx) => apagarDadosLenda(tx, req.user.id, tabelas));
    try { await prisma.suspiciousActivity.deleteMany({ where: { userId: req.user.id, gameKey: GAME_KEY } }); } catch { /* ok */ }
    cacheInvalidar("lenda:");
    res.json({ ok: true, apagado: feito });
  } catch (e) {
    console.error("Lenda: falha ao apagar os dados de", req.user.id, e.message);
    res.status(500).json({ error: "Não deu para apagar agora. Tente de novo daqui a pouco." });
  }
});

// ---------- painel do admin: SUSPEITOS do ranking (v407, Raio-X U7) ----------
// Quem teve um envio do ranking reprovado: fica fora dos rankings até o admin olhar. "Descartar" tira da lista.
router.get("/admin/suspeitos", requireAuth, requireRole("ADMIN"), async (_req, res) => {
  try {
    const regs = await prisma.suspiciousActivity.findMany({ where: { gameKey: GAME_KEY }, orderBy: { createdAt: "desc" }, take: 500 });
    const ids = [...new Set(regs.map((r) => r.userId))];
    const [users, ranks] = await Promise.all([
      prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, nickname: true, createdAt: true, isGuest: true, banned: true } }),
      prisma.lendaRanking.findMany({ where: { userId: { in: ids } }, select: { userId: true, nivel: true, xp: true, atualizadoEm: true } }),
    ]);
    const u = new Map(users.map((x) => [x.id, x])), rk = new Map(ranks.map((x) => [x.userId, x]));
    res.json({ suspeitos: ids.map((id) => ({
      userId: id, apelido: u.get(id)?.nickname || "(conta apagada)", contaDesde: u.get(id)?.createdAt, visitante: !!u.get(id)?.isGuest, banido: !!u.get(id)?.banned,
      ranking: rk.get(id) || null,
      registros: regs.filter((r) => r.userId === id).slice(0, 10).map((r) => ({ motivo: r.reason, detalhe: r.detail, quando: r.createdAt })),
    })) });
  } catch { res.status(503).json({ error: "Lista indisponível agora." }); }
});
router.delete("/admin/suspeitos/:userId", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const r = await prisma.suspiciousActivity.deleteMany({ where: { userId: String(req.params.userId), gameKey: GAME_KEY } });
  cacheInvalidar("lenda:");
  res.json({ ok: true, removidos: r.count });
});

export default router;
