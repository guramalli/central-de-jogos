// Lenda do Campinho — rotas das LOJAS DOS JOGADORES (regras em ../lenda/mercado.js). Montado em /api/lenda/mercado.
// Tabelas: LendaAnuncio, LendaVenda, LendaBarraca, LendaMercadoCota (prisma db push). Sem as tabelas, responde 503.
import { Router } from "express";
import { prisma as prismaReal } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import {
  CATALOGO, MAX_ATIVOS, MAX_POR_DIA, DURACAO_MS, TAXA, TITULOS, BARRACA_MS, VAGAS, NIVEL_VENDER,
  validaAnuncio, faixaPreco, vendavel, recebeVendedor, inicioDoDia, idsDaBusca, validaBarraca,
} from "../lenda/mercado.js";

export function criaRotasMercado({ prisma = prismaReal, auth = requireAuth, agora = () => Date.now() } = {}) {
  const r = Router();
  r.use(auth);
  const db = () => prisma;
  const rota = (fn) => async (req, res) => {
    try { await fn(req, res); } catch (e) { if (!res.headersSent) res.status(503).json({ error: "A feira volta em instantes." }); }
  };
  const apelidos = async (ids) => {
    const u = [...new Set(ids)]; if (!u.length) return new Map();
    const us = await db().user.findMany({ where: { id: { in: u } }, select: { id: true, nickname: true } });
    return new Map(us.map((x) => [x.id, x.nickname]));
  };
  const publico = (a, nomes) => ({ id: a.id, itemId: a.itemId, nome: CATALOGO[a.itemId]?.n || a.itemId, refino: a.refino || 0, qtd: a.qtd, preco: a.preco,
    vendedorId: a.vendedorId, vendedor: nomes?.get(a.vendedorId) || "Jogador", expiraEm: a.expiraEm });

  r.get("/opcoes", (_req, res) => res.json({ vagas: VAGAS, titulos: TITULOS, taxa: TAXA, nivelVender: NIVEL_VENDER, maxAtivos: MAX_ATIVOS, maxPorDia: MAX_POR_DIA, duracaoMs: DURACAO_MS }));
  // faixa de preço de um item (o jogo mostra antes de anunciar)
  r.get("/faixa/:itemId", (req, res) => {
    if (!vendavel(req.params.itemId)) return res.status(400).json({ error: "Esse item não pode ser vendido." });
    res.json(faixaPreco(req.params.itemId, req.query.refino));
  });

  // mercado central: busca pelo nome (ou os mais recentes), do mais barato para o mais caro
  r.get("/busca", rota(async (req, res) => {
    const ids = idsDaBusca(req.query.q);
    if (ids && !ids.length) return res.json({ anuncios: [] });
    const where = { expiraEm: { gt: new Date(agora()) }, ...(ids ? { itemId: { in: ids } } : {}) };
    const lista = await db().lendaAnuncio.findMany({ where, orderBy: ids ? { preco: "asc" } : { criadoEm: "desc" }, take: 60 });
    const nomes = await apelidos(lista.map((a) => a.vendedorId));
    res.json({ anuncios: lista.map((a) => publico(a, nomes)) });
  }));
  r.get("/loja/:vendedorId", rota(async (req, res) => {
    const lista = await db().lendaAnuncio.findMany({ where: { vendedorId: req.params.vendedorId, expiraEm: { gt: new Date(agora()) } }, orderBy: { criadoEm: "desc" }, take: MAX_ATIVOS });
    const nomes = await apelidos([req.params.vendedorId]);
    res.json({ vendedor: nomes.get(req.params.vendedorId) || "Jogador", anuncios: lista.map((a) => publico(a, nomes)) });
  }));

  // minha loja: anúncios ativos, vencidos (para recolher), tostões a receber e últimas vendas
  r.get("/minhas", rota(async (req, res) => {
    const eu = req.user.id, t = new Date(agora());
    const todos = await db().lendaAnuncio.findMany({ where: { vendedorId: eu }, orderBy: { criadoEm: "desc" } });
    const vendas = await db().lendaVenda.findMany({ where: { vendedorId: eu }, orderBy: { criadoEm: "desc" }, take: 30 });
    const aReceber = vendas.filter((v) => !v.coletado).reduce((s, v) => s + recebeVendedor(v.total), 0);
    const nomes = await apelidos(vendas.map((v) => v.compradorId));
    const cota = await db().lendaMercadoCota.findUnique({ where: { userId_dia: { userId: eu, dia: inicioDoDia(agora()).toISOString().slice(0, 10) } } }), hoje = cota?.n || 0;
    const barraca = await db().lendaBarraca.findUnique({ where: { vendedorId: eu } });
    res.json({
      ativos: todos.filter((a) => a.expiraEm > t).map((a) => publico(a)), vencidos: todos.filter((a) => a.expiraEm <= t).map((a) => publico(a)),
      aReceber, vendas: vendas.slice(0, 10).map((v) => ({ itemId: v.itemId, nome: CATALOGO[v.itemId]?.n || v.itemId, refino: v.refino || 0, qtd: v.qtd, total: v.total, recebe: recebeVendedor(v.total), comprador: nomes.get(v.compradorId) || "Jogador", quando: v.criadoEm, coletado: v.coletado })),
      anunciosHoje: hoje, barraca: barraca && barraca.expiraEm > t ? barraca : null,
    });
  }));

  r.post("/anunciar", rota(async (req, res) => {
    const eu = req.user.id, v = validaAnuncio(req.body || {});
    if (v.erro) return res.status(400).json({ error: v.erro });
    const t = agora();
    if ((await db().lendaAnuncio.count({ where: { vendedorId: eu, expiraEm: { gt: new Date(t) } } })) >= MAX_ATIVOS) return res.status(409).json({ error: `Você já tem ${MAX_ATIVOS} anúncios ativos. Espere vender (ou cancele algum).` });
    const dia = inicioDoDia(t).toISOString().slice(0, 10);
    const cota = await db().lendaMercadoCota.findUnique({ where: { userId_dia: { userId: eu, dia } } });
    if ((cota?.n || 0) >= MAX_POR_DIA) return res.status(409).json({ error: `Hoje você já anunciou ${MAX_POR_DIA} vezes. Amanhã tem mais!` });
    await db().lendaMercadoCota.upsert({ where: { userId_dia: { userId: eu, dia } }, create: { userId: eu, dia, n: 1 }, update: { n: { increment: 1 } } });
    const a = await db().lendaAnuncio.create({ data: { vendedorId: eu, itemId: v.itemId, refino: v.refino, qtd: v.qtd, preco: v.preco, criadoEm: new Date(t), expiraEm: new Date(t + DURACAO_MS) } });
    res.json({ ok: true, anuncio: publico(a) });
  }));

  // cancelar (ou recolher o vencido): o item volta para o vendedor (o jogo põe na mochila)
  r.post("/cancelar/:id", rota(async (req, res) => {
    const a = await db().lendaAnuncio.findUnique({ where: { id: req.params.id } });
    if (!a || a.vendedorId !== req.user.id) return res.status(404).json({ error: "Anúncio não encontrado." });
    const apagou = await db().lendaAnuncio.deleteMany({ where: { id: a.id, vendedorId: req.user.id } });
    if (!apagou.count) return res.status(409).json({ error: "Esse anúncio acabou de ser vendido." });
    res.json({ ok: true, item: { itemId: a.itemId, refino: a.refino || 0, qtd: a.qtd } });
  }));

  // comprar: tira do anúncio (sem vender duas vezes a mesma coisa) e registra a venda para o vendedor recolher
  r.post("/comprar/:id", rota(async (req, res) => {
    const eu = req.user.id, t = new Date(agora());
    const a = await db().lendaAnuncio.findUnique({ where: { id: req.params.id } });
    if (!a || a.expiraEm <= t) return res.status(404).json({ error: "Esse anúncio não está mais na feira." });
    if (a.vendedorId === eu) return res.status(400).json({ error: "Esse anúncio é seu." });
    const q = Math.floor(Number(req.body?.qtd) || 1);
    if (!(q >= 1 && q <= a.qtd)) return res.status(400).json({ error: `Dá para comprar de 1 a ${a.qtd}.` });
    const tirou = await db().lendaAnuncio.updateMany({ where: { id: a.id, qtd: { gte: q }, expiraEm: { gt: t } }, data: { qtd: { decrement: q } } });
    if (!tirou.count) return res.status(409).json({ error: "Alguém comprou antes de você!" });
    await db().lendaAnuncio.deleteMany({ where: { id: a.id, qtd: { lte: 0 } } });
    const total = a.preco * q;
    await db().lendaVenda.create({ data: { vendedorId: a.vendedorId, compradorId: eu, itemId: a.itemId, refino: a.refino || 0, qtd: q, total, criadoEm: t } });
    res.json({ ok: true, item: { itemId: a.itemId, refino: a.refino || 0, qtd: q }, total });
  }));

  // recolher os tostões das vendas
  r.post("/coletar", rota(async (req, res) => {
    const eu = req.user.id;
    const vendas = await db().lendaVenda.findMany({ where: { vendedorId: eu, coletado: false } });
    if (!vendas.length) return res.json({ ok: true, tostoes: 0 });
    const marcou = await db().lendaVenda.updateMany({ where: { id: { in: vendas.map((v) => v.id) }, coletado: false }, data: { coletado: true } });
    if (marcou.count !== vendas.length) return res.status(409).json({ error: "Tente de novo." });
    res.json({ ok: true, tostoes: vendas.reduce((s, v) => s + recebeVendedor(v.total), 0), vendas: vendas.length });
  }));

  // ---- barraca na PRAÇA DA FEIRA (vagas fixas) ----
  // barracas ativas com pelo menos 1 anúncio (sem anúncio, a vaga fica livre)
  const barracasAtivas = async (t) => {
    const bs = await db().lendaBarraca.findMany({ where: { expiraEm: { gt: t } } });
    if (!bs.length) return [];
    const ativos = await db().lendaAnuncio.findMany({ where: { vendedorId: { in: bs.map((b) => b.vendedorId) }, expiraEm: { gt: t } } });
    return bs.map((b) => ({ ...b, itens: ativos.filter((a) => a.vendedorId === b.vendedorId).length })).filter((b) => b.itens > 0);
  };
  r.get("/barracas", rota(async (_req, res) => {
    const bs = await barracasAtivas(new Date(agora()));
    const nomes = await apelidos(bs.map((b) => b.vendedorId));
    res.json({ vagas: VAGAS, barracas: bs.map((b) => ({ vendedorId: b.vendedorId, vendedor: nomes.get(b.vendedorId) || "Jogador", vaga: b.vaga, titulo: b.titulo, cor: b.cor, itens: b.itens })) });
  }));
  r.post("/barraca", rota(async (req, res) => {
    const eu = req.user.id, v = validaBarraca(req.body || {}), t = agora();
    if (v.erro) return res.status(400).json({ error: v.erro });
    if (!(await db().lendaAnuncio.count({ where: { vendedorId: eu, expiraEm: { gt: new Date(t) } } }))) return res.status(400).json({ error: "Anuncie pelo menos um item antes de montar a barraca." });
    const ocupada = (await barracasAtivas(new Date(t))).find((b) => b.vaga === v.vaga && b.vendedorId !== eu);
    if (ocupada) return res.status(409).json({ error: "Essa vaga já tem barraca. Escolha outra vaga livre." });
    const dados = { vaga: v.vaga, titulo: v.titulo, cor: v.cor, abertaEm: new Date(t), expiraEm: new Date(t + BARRACA_MS) };
    await db().lendaBarraca.upsert({ where: { vendedorId: eu }, create: { vendedorId: eu, ...dados }, update: dados });
    res.json({ ok: true, barraca: { vendedorId: eu, ...dados } });
  }));
  r.delete("/barraca", rota(async (req, res) => {
    await db().lendaBarraca.deleteMany({ where: { vendedorId: req.user.id } });
    res.json({ ok: true });
  }));

  return r;
}
export default criaRotasMercado();
