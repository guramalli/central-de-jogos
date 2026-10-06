// Lenda do Campinho — rotas das GUILDAS (regras em ../lenda/guilda.js). Montado em /api/lenda/guilda.
// Tabelas: LendaGuilda, LendaGuildaMembro, LendaGuildaConvite (prisma db push). Sem as tabelas, responde 503.
import { Router } from "express";
import { prisma as prismaReal } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { amigosDe as amigosDeReal } from "../lenda/torcida.js";
import {
  MAX_MEMBROS, NIVEL_CRIAR, MIN_AJUDA, METAS, NOMES, COMPLEMENTOS, ESCUDOS, CORES,
  validaCriacao, semanaId, faixasAtingidas, podeMexer, podeConvidar, pontosDoEnvio, normalizaSemana, resumoGuilda, montaNome,
  TETO_SEMANA_MEMBRO, cabeNaSemana,
} from "../lenda/guilda.js";
import { sairDaGuilda } from "../lenda/apagar.js";

export function criaRotasGuilda({ prisma = prismaReal, amigosDe = (id) => amigosDeReal(prismaReal, id), auth = requireAuth } = {}) {
  const r = Router();
  r.use(auth);
  const db = () => prisma;
  // erro de banco (ex.: tabela ainda não criada) → 503; erro de regra → 400
  const rota = (fn) => async (req, res) => {
    try { await fn(req, res); } catch (e) { if (!res.headersSent) res.status(503).json({ error: "As guildas voltam em instantes." }); }
  };
  const apelidos = async (ids) => {
    if (!ids.length) return new Map();
    const us = await db().user.findMany({ where: { id: { in: ids } }, select: { id: true, nickname: true } });
    return new Map(us.map((u) => [u.id, u.nickname]));
  };
  const meuMembro = (id) => db().lendaGuildaMembro.findUnique({ where: { userId: id } });
  const nivelDe = async (id) => (await db().lendaRanking.findUnique({ where: { userId: id }, select: { nivel: true } }))?.nivel || 0;
  const guildaPorId = (id) => db().lendaGuilda.findUnique({ where: { id } });
  const avisa = (req, userId, evento, dados) => { try { req.app?.get?.("io")?.to(`user:${userId}`).emit(evento, dados); } catch { /* sem socket: tudo bem */ } };

  r.get("/opcoes", (_req, res) => res.json({ nomes: NOMES, complementos: COMPLEMENTOS, escudos: ESCUDOS, cores: CORES, metas: METAS, maxMembros: MAX_MEMBROS, nivelCriar: NIVEL_CRIAR, minAjuda: MIN_AJUDA }));

  r.get("/minha", rota(async (req, res) => {
    const eu = req.user.id, agora = Date.now(), sem = semanaId(agora);
    const convs = await db().lendaGuildaConvite.findMany({ where: { userId: eu } });
    const gConv = convs.length ? await db().lendaGuilda.findMany({ where: { id: { in: convs.map((c) => c.guildaId) } } }) : [];
    const nomesConv = await apelidos(convs.map((c) => c.deId));
    const convites = convs.map((c) => { const g = gConv.find((x) => x.id === c.guildaId); return g ? { id: c.id, guilda: resumoGuilda(g), de: nomesConv.get(c.deId) || "Alguém" } : null; }).filter(Boolean);
    const m = await meuMembro(eu);
    if (!m) return res.json({ guilda: null, convites, semana: sem });
    const g = await guildaPorId(m.guildaId);
    if (!g) return res.json({ guilda: null, convites, semana: sem });
    const gs = normalizaSemana(g, agora);
    const ms = (await db().lendaGuildaMembro.findMany({ where: { guildaId: g.id } })).map((x) => normalizaSemana(x, agora));
    const nomes = await apelidos(ms.map((x) => x.userId));
    const ordem = { lider: 0, vice: 1, membro: 2 };
    const membros = ms.map((x) => ({ userId: x.userId, apelido: nomes.get(x.userId) || "Jogador", papel: x.papel, pontosSemana: x.pontosSemana }))
      .sort((a, b) => ordem[a.papel] - ordem[b.papel] || b.pontosSemana - a.pontosSemana);
    const euM = ms.find((x) => x.userId === eu);
    res.json({ guilda: { ...resumoGuilda(g), pontosSemana: gs.pontosSemana, pontosTotal: g.pontosTotal || 0, faixas: faixasAtingidas(gs.pontosSemana) }, membros,
      eu: { papel: euM.papel, pontosSemana: euM.pontosSemana, premios: euM.premios || 0 }, convites, semana: sem, metas: METAS, minAjuda: MIN_AJUDA });
  }));

  r.post("/criar", rota(async (req, res) => {
    const eu = req.user.id, v = validaCriacao(req.body || {});
    if (v.erro) return res.status(400).json({ error: v.erro });
    // v407 (Raio-X U7): o nível vem do ranking guardado no servidor, não do que o jogo diz
    if (!((await nivelDe(eu)) >= NIVEL_CRIAR)) return res.status(400).json({ error: `Para criar uma guilda é preciso estar no nível ${NIVEL_CRIAR} (jogue um pouquinho com a conta do site para o servidor ver o seu nível).` });
    if (await meuMembro(eu)) return res.status(409).json({ error: "Você já está numa guilda. Saia dela antes de criar outra." });
    const g = await db().lendaGuilda.create({ data: { partes: v.partes, escudo: v.escudo, cor: v.cor, liderId: eu, semana: semanaId() } });
    await db().lendaGuildaMembro.create({ data: { userId: eu, guildaId: g.id, papel: "lider", semana: semanaId() } });
    await db().lendaGuildaConvite.deleteMany({ where: { userId: eu } });
    res.json({ ok: true, guilda: resumoGuilda(g) });
  }));

  r.post("/convidar", rota(async (req, res) => {
    const eu = req.user.id, alvo = String(req.body?.userId || "");
    const m = await meuMembro(eu);
    if (!m) return res.status(400).json({ error: "Você não está numa guilda." });
    if (!podeConvidar(m.papel)) return res.status(403).json({ error: "Só o líder e os vices convidam." });
    if (!(await amigosDe(eu)).includes(alvo)) return res.status(403).json({ error: "Só dá para convidar amigos (☰ Mais › 🤝 Amigos)." });
    if (await meuMembro(alvo)) return res.status(409).json({ error: "Esse amigo já está numa guilda." });
    if ((await db().lendaGuildaMembro.count({ where: { guildaId: m.guildaId } })) >= MAX_MEMBROS) return res.status(409).json({ error: `A guilda já tem ${MAX_MEMBROS} membros.` });
    const c = await db().lendaGuildaConvite.upsert({ where: { guildaId_userId: { guildaId: m.guildaId, userId: alvo } }, create: { guildaId: m.guildaId, userId: alvo, deId: eu }, update: { deId: eu } });
    const g = await guildaPorId(m.guildaId);
    avisa(req, alvo, "guilda-convite", { id: c.id, guilda: resumoGuilda(g), de: req.user.nickname });
    res.json({ ok: true });
  }));

  r.post("/convite/:id/aceitar", rota(async (req, res) => {
    const eu = req.user.id;
    const c = await db().lendaGuildaConvite.findUnique({ where: { id: req.params.id } });
    if (!c || c.userId !== eu) return res.status(404).json({ error: "Convite não encontrado." });
    if (await meuMembro(eu)) return res.status(409).json({ error: "Você já está numa guilda. Saia dela antes." });
    const g = await guildaPorId(c.guildaId);
    if (!g) { await db().lendaGuildaConvite.delete({ where: { id: c.id } }); return res.status(404).json({ error: "Essa guilda não existe mais." }); }
    if ((await db().lendaGuildaMembro.count({ where: { guildaId: g.id } })) >= MAX_MEMBROS) return res.status(409).json({ error: `A guilda já tem ${MAX_MEMBROS} membros.` });
    await db().lendaGuildaMembro.create({ data: { userId: eu, guildaId: g.id, papel: "membro", semana: semanaId() } });
    await db().lendaGuildaConvite.deleteMany({ where: { userId: eu } });
    res.json({ ok: true, guilda: resumoGuilda(g) });
  }));
  r.delete("/convite/:id", rota(async (req, res) => {
    const c = await db().lendaGuildaConvite.findUnique({ where: { id: req.params.id } });
    if (!c || c.userId !== req.user.id) return res.status(404).json({ error: "Convite não encontrado." });
    await db().lendaGuildaConvite.delete({ where: { id: c.id } });
    res.json({ ok: true });
  }));

  // sair: o líder passa a liderança (vice mais antigo, senão o membro mais antigo); último a sair apaga a guilda
  r.post("/sair", rota(async (req, res) => {
    const r2 = await sairDaGuilda(db(), req.user.id); // (a mesma regra de quando a conta é apagada: lenda/apagar.js)
    res.json(r2 === "apagada" ? { ok: true, apagada: true } : { ok: true });
  }));

  r.post("/expulsar", rota(async (req, res) => {
    const eu = req.user.id, alvo = String(req.body?.userId || "");
    const [m, a] = [await meuMembro(eu), await meuMembro(alvo)];
    if (!m || !a || a.guildaId !== m.guildaId || alvo === eu) return res.status(404).json({ error: "Membro não encontrado." });
    if (!podeMexer(m.papel, a.papel)) return res.status(403).json({ error: "Você não pode tirar esse membro." });
    await db().lendaGuildaMembro.delete({ where: { userId: alvo } });
    res.json({ ok: true });
  }));

  r.post("/cargo", rota(async (req, res) => {
    const eu = req.user.id, alvo = String(req.body?.userId || ""), papel = req.body?.papel;
    if (!["vice", "membro"].includes(papel)) return res.status(400).json({ error: "Cargo inválido." });
    const [m, a] = [await meuMembro(eu), await meuMembro(alvo)];
    if (!m || m.papel !== "lider") return res.status(403).json({ error: "Só o líder muda cargos." });
    if (!a || a.guildaId !== m.guildaId || alvo === eu) return res.status(404).json({ error: "Membro não encontrado." });
    await db().lendaGuildaMembro.update({ where: { userId: alvo }, data: { papel } });
    res.json({ ok: true });
  }));

  r.post("/lider", rota(async (req, res) => {
    const eu = req.user.id, alvo = String(req.body?.userId || "");
    const [m, a] = [await meuMembro(eu), await meuMembro(alvo)];
    if (!m || m.papel !== "lider") return res.status(403).json({ error: "Só o líder passa a liderança." });
    if (!a || a.guildaId !== m.guildaId || alvo === eu) return res.status(404).json({ error: "Membro não encontrado." });
    await db().lendaGuildaMembro.update({ where: { userId: alvo }, data: { papel: "lider" } });
    await db().lendaGuildaMembro.update({ where: { userId: eu }, data: { papel: "vice" } });
    await db().lendaGuilda.update({ where: { id: m.guildaId }, data: { liderId: alvo } });
    res.json({ ok: true });
  }));

  // o jogo manda os adversários derrotados (de tempos em tempos, com teto)
  // v407 (Raio-X U7): soma com INCREMENT no banco (dois envios ao mesmo tempo não se apagam mais um ao outro) e com
  // teto da semana por membro. A virada de semana zera com um "set" só se o registro ainda está na semana velha.
  r.post("/pontos", rota(async (req, res) => {
    const eu = req.user.id, agora = Date.now(), m0 = await meuMembro(eu);
    if (!m0) return res.json({ ok: true, pontos: 0 });
    const m = normalizaSemana(m0, agora), sem = m.semana;
    const n = cabeNaSemana(pontosDoEnvio(req.body?.n, m0.ultimoEnvio ? new Date(m0.ultimoEnvio).getTime() : 0, agora), m.pontosSemana);
    if (!n) return res.json({ ok: true, pontos: 0, teto: m.pontosSemana >= TETO_SEMANA_MEMBRO });
    // o envio anterior precisa ser o mesmo que eu li (senão outro envio passou na frente: este não conta)
    const marca = { userId: eu, ultimoEnvio: m0.ultimoEnvio ?? null };
    if (m0.semana !== sem) {
      const virou = await db().lendaGuildaMembro.updateMany({ where: { ...marca, semana: m0.semana }, data: { semana: sem, pontosSemana: n, premios: 0, ultimoEnvio: new Date(agora) } });
      if (!virou.count) return res.json({ ok: true, pontos: 0 });
    } else {
      const somou = await db().lendaGuildaMembro.updateMany({ where: { ...marca, semana: sem }, data: { pontosSemana: { increment: n }, ultimoEnvio: new Date(agora) } });
      if (!somou.count) return res.json({ ok: true, pontos: 0 });
    }
    const g0 = await guildaPorId(m.guildaId);
    if (g0.semana !== sem) await db().lendaGuilda.updateMany({ where: { id: g0.id, semana: g0.semana }, data: { semana: sem, pontosSemana: 0 } });
    const g = await db().lendaGuilda.update({ where: { id: g0.id }, data: { pontosSemana: { increment: n }, pontosTotal: { increment: n } } });
    res.json({ ok: true, pontos: n, guildaSemana: g.pontosSemana, meusSemana: m.pontosSemana + n });
  }));

  // resgatar o prêmio de uma faixa da meta (1 vez por semana, para quem ajudou)
  r.post("/premio", rota(async (req, res) => {
    const eu = req.user.id, agora = Date.now(), faixa = Math.floor(Number(req.body?.faixa));
    const m0 = await meuMembro(eu);
    if (!m0) return res.status(400).json({ error: "Você não está numa guilda." });
    if (!(faixa >= 0 && faixa < METAS.length)) return res.status(400).json({ error: "Faixa inválida." });
    const m = normalizaSemana(m0, agora), g = normalizaSemana(await guildaPorId(m.guildaId), agora);
    if (faixa >= faixasAtingidas(g.pontosSemana)) return res.status(400).json({ error: "A guilda ainda não chegou nessa meta." });
    if (m.pontosSemana < MIN_AJUDA) return res.status(400).json({ error: `Ajude a guilda com pelo menos ${MIN_AJUDA} adversários nesta semana para resgatar.` });
    if ((m.premios || 0) & (1 << faixa)) return res.status(409).json({ error: "Você já resgatou esse prêmio nesta semana." });
    await db().lendaGuildaMembro.update({ where: { userId: eu }, data: { semana: m.semana, pontosSemana: m.pontosSemana, premios: (m.premios || 0) | (1 << faixa) } });
    res.json({ ok: true, faixa });
  }));

  r.get("/ranking", rota(async (_req, res) => {
    const sem = semanaId();
    const gs = await db().lendaGuilda.findMany({ where: { semana: sem }, orderBy: { pontosSemana: "desc" }, take: 20 });
    res.json({ semana: sem, ranking: gs.filter((g) => g.pontosSemana > 0).map((g, i) => ({ pos: i + 1, ...resumoGuilda(g), pontosSemana: g.pontosSemana })) });
  }));

  return r;
}

export default criaRotasGuilda();
export { montaNome };
