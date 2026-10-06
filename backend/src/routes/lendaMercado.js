// Lenda do Campinho — rotas das LOJAS DOS JOGADORES (regras em ../lenda/mercado.js). Montado em /api/lenda/mercado.
// Tabelas: LendaAnuncio, LendaVenda, LendaBarraca, LendaMercadoCota (prisma db push). Sem as tabelas, responde 503.
import { Router } from "express";
import { prisma as prismaReal } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import {
  CATALOGO, MAX_ATIVOS, MAX_POR_DIA, DURACAO_MS, TAXA, TITULOS, BARRACA_MS, VAGAS, NIVEL_VENDER,
  validaAnuncio, faixaPreco, vendavel, recebeVendedor, inicioDoDia, idsDaBusca, validaBarraca,
  podeVender, tetoColetaDia, vendasQueCabem, quantosNoSave, CONTA_DIAS_VENDER,
} from "../lenda/mercado.js";
import { abrirSave } from "../lenda/ficha.js";
import { ehSuspeito, paresRepetidos } from "../lenda/suspeitos.js";

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
  const ehAdmin = async (id) => (await db().user.findUnique({ where: { id }, select: { role: true } }))?.role === "ADMIN";
  const publico = (a, nomes) => ({ id: a.id, itemId: a.itemId, nome: CATALOGO[a.itemId]?.n || a.itemId, refino: a.refino || 0, qtd: a.qtd, preco: a.preco,
    vendedorId: a.vendedorId, vendedor: nomes?.get(a.vendedorId) || "Jogador", expiraEm: a.expiraEm });

  r.get("/opcoes", (_req, res) => res.json({ vagas: VAGAS, titulos: TITULOS, taxa: TAXA, nivelVender: NIVEL_VENDER, maxAtivos: MAX_ATIVOS, maxPorDia: MAX_POR_DIA, duracaoMs: DURACAO_MS, contaDiasVender: CONTA_DIAS_VENDER }));
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

  // v407 (Raio-X U7): quem anuncia — conta do site com 7+ dias, nível do RANKING do servidor (não o que o jogo manda),
  // fora da lista de suspeitos; e o item precisa aparecer no último save na nuvem (mochila + armazém).
  r.post("/anunciar", rota(async (req, res) => {
    const eu = req.user.id, t = agora();
    const [conta, rank] = await Promise.all([
      db().user.findUnique({ where: { id: eu }, select: { isGuest: true, createdAt: true } }),
      db().lendaRanking.findUnique({ where: { userId: eu }, select: { nivel: true } }),
    ]);
    const pv = podeVender(conta, t);
    if (pv.erro) return res.status(403).json({ error: pv.erro });
    const v = validaAnuncio({ ...(req.body || {}), nivel: rank?.nivel || 0 });
    if (v.erro) return res.status(400).json({ error: v.erro + (rank ? "" : " (jogue um pouquinho com a conta do site para o servidor ver o seu nível)") });
    if (await ehSuspeito(db(), eu)) return res.status(403).json({ error: "A sua loja está em revisão. Fale com a equipe do site pelo botão de ajuda." });
    const save = await db().lendaSave.findUnique({ where: { userId: eu }, select: { dados: true, atualizadoEm: true } });
    if (!save) return res.status(409).json({ error: "Salve o jogo online primeiro (o jogo salva sozinho a cada minuto) e tente de novo." });
    const aberto = abrirSave(save.dados);
    if (aberto) { // (save que não abre: não bloqueia — fica o registro de pares para o admin)
      const depois = await db().lendaAnuncio.findMany({ where: { vendedorId: eu, itemId: v.itemId, refino: v.refino, criadoEm: { gt: save.atualizadoEm } }, select: { qtd: true } });
      const tem = quantosNoSave(aberto, v.itemId, v.refino) - depois.reduce((s, a) => s + a.qtd, 0);
      if (tem < v.qtd) return res.status(409).json({ error: "Esse item ainda não apareceu no seu jogo salvo online. Espere um minutinho (o jogo salva sozinho) e tente de novo." });
    }
    if ((await db().lendaAnuncio.count({ where: { vendedorId: eu, expiraEm: { gt: new Date(t) } } })) >= MAX_ATIVOS) return res.status(409).json({ error: `Você já tem ${MAX_ATIVOS} anúncios ativos. Espere vender (ou cancele algum).` });
    const dia = inicioDoDia(t).toISOString().slice(0, 10);
    const cota = await db().lendaMercadoCota.findUnique({ where: { userId_dia: { userId: eu, dia } } });
    if ((cota?.n || 0) >= MAX_POR_DIA) return res.status(409).json({ error: `Hoje você já anunciou ${MAX_POR_DIA} vezes. Amanhã tem mais!` });
    await db().lendaMercadoCota.upsert({ where: { userId_dia: { userId: eu, dia } }, create: { userId: eu, dia, n: 1 }, update: { n: { increment: 1 } } });
    const a = await db().lendaAnuncio.create({ data: { vendedorId: eu, itemId: v.itemId, refino: v.refino, qtd: v.qtd, preco: v.preco, criadoEm: new Date(t), expiraEm: new Date(t + DURACAO_MS) } });
    res.json({ ok: true, anuncio: publico(a) });
  }));

  // cancelar (ou recolher o vencido): o item volta para o vendedor (o jogo põe na mochila)
  // v407 (Raio-X U7) — o que o servidor GARANTE aqui, sem guardar o inventário de ninguém:
  //   - só devolve um anúncio que existe, é da pessoa e ainda não foi vendido; e no máximo UMA vez (deleteMany atômico);
  //   - devolve exatamente o que foi anunciado (item, refino, quantidade) — nunca mais;
  //   - o anúncio só nasceu se o item estava no último save na nuvem, descontado o que já foi anunciado depois dele
  //     (anunciar → cancelar não "cria" item do nada), e só de conta com 7+ dias, nível 30 pelo ranking, fora dos suspeitos,
  //     com 20 anúncios por dia no máximo.
  // LIMITE (documentado): o save na nuvem também é escrito pelo jogo. Quem altera o próprio save (jogo modificado) pode
  // "ter" o item; isso só se resolve com o inventário morando no servidor. O que segura esse caso: a lista de pares
  // repetidos vendedor↔comprador e os suspeitos do ranking no painel do admin, o teto de tostões recolhidos por dia e
  // míticos/troféus de arena fora da feira.
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

  // recolher os tostões das vendas — v407 (Raio-X U7): até o teto do dia (pelo nível do ranking); o resto fica para amanhã.
  // O que já saiu hoje fica em LendaMercadoCota com o dia "t:AAAA-MM-DD" (a mesma tabela da cota de anúncios, sem schema novo).
  r.post("/coletar", rota(async (req, res) => {
    const eu = req.user.id, t = agora();
    const vendas = await db().lendaVenda.findMany({ where: { vendedorId: eu, coletado: false } });
    if (!vendas.length) return res.json({ ok: true, tostoes: 0 });
    const diaT = "t:" + inicioDoDia(t).toISOString().slice(0, 10);
    const [cotaT, rank] = await Promise.all([
      db().lendaMercadoCota.findUnique({ where: { userId_dia: { userId: eu, dia: diaT } } }),
      db().lendaRanking.findUnique({ where: { userId: eu }, select: { nivel: true } }),
    ]);
    const teto = tetoColetaDia(rank?.nivel || 1), jaHoje = cotaT?.n || 0;
    const sai = vendasQueCabem(vendas, jaHoje, teto);
    if (!sai.length) return res.json({ ok: true, tostoes: 0, vendas: 0, faltam: vendas.length, teto, aviso: `Hoje você já recolheu o máximo do dia (${teto.toLocaleString("pt-BR")} tostões). O resto fica guardado para amanhã!` });
    const marcou = await db().lendaVenda.updateMany({ where: { id: { in: sai.map((v) => v.id) }, coletado: false }, data: { coletado: true } });
    if (marcou.count !== sai.length) return res.status(409).json({ error: "Tente de novo." });
    const tostoes = sai.reduce((s, v) => s + recebeVendedor(v.total), 0);
    await db().lendaMercadoCota.upsert({ where: { userId_dia: { userId: eu, dia: diaT } }, create: { userId: eu, dia: diaT, n: Math.min(2e9, tostoes) }, update: { n: { increment: Math.min(2e9, tostoes) } } }).catch(() => {});
    const faltam = vendas.length - sai.length;
    res.json({ ok: true, tostoes, vendas: sai.length, faltam, teto, ...(faltam ? { aviso: `Você chegou no máximo de hoje (${teto.toLocaleString("pt-BR")} tostões). ${faltam} venda(s) ficam guardadas para amanhã.` } : {}) });
  }));

  // ---- painel do admin: pares vendedor ↔ comprador que se repetem (v407, Raio-X U7) ----
  r.get("/admin/pares", rota(async (req, res) => {
    if (!(await ehAdmin(req.user.id))) return res.status(403).json({ error: "Só admin." });
    const dias = Math.min(90, Math.max(1, parseInt(req.query.dias, 10) || 30));
    const vendas = await db().lendaVenda.findMany({ where: { criadoEm: { gte: new Date(agora() - dias * 864e5) } }, select: { vendedorId: true, compradorId: true, total: true, criadoEm: true }, take: 20000 });
    const pares = paresRepetidos(vendas, Math.max(2, parseInt(req.query.minimo, 10) || 3)).slice(0, 100);
    const nomes = await apelidos(pares.flatMap((p) => [p.vendedorId, p.compradorId]));
    res.json({ dias, pares: pares.map((p) => ({ ...p, vendedor: nomes.get(p.vendedorId) || p.vendedorId, comprador: nomes.get(p.compradorId) || p.compradorId })) });
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
