import { test, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { gzipSync } from "node:zlib";
import { CATALOGO, vendavel, faixaPreco, validaAnuncio, recebeVendedor, idsDaBusca, validaBarraca, MAX_ATIVOS, MAX_POR_DIA, NIVEL_VENDER, DURACAO_MS,
  podeVender, tetoColetaDia, vendasQueCabem, quantosNoSave, ITENS_ARENA } from "../../src/lenda/mercado.js";
import { paresRepetidos } from "../../src/lenda/suspeitos.js";
process.env.JWT_SECRET ||= "teste-mercado";
const { criaRotasMercado } = await import("../../src/routes/lendaMercado.js");

// ---------- banco de mentira (operadores que as rotas usam) ----------
const val = (v) => (v instanceof Date ? v.getTime() : v);
function casa(l, w = {}) {
  return Object.entries(w).every(([k, v]) => {
    if (v && typeof v === "object" && !(v instanceof Date)) {
      if ("in" in v && !v.in.includes(l[k])) return false;
      if ("gt" in v && !(val(l[k]) > val(v.gt))) return false;
      if ("gte" in v && !(val(l[k]) >= val(v.gte))) return false;
      if ("lte" in v && !(val(l[k]) <= val(v.lte))) return false;
      return true;
    }
    return val(l[k]) === val(v);
  });
}
function tabela(chave, defaults = () => ({})) {
  const linhas = []; let seq = 0;
  const aplica = (l, data) => { for (const [k, v] of Object.entries(data)) l[k] = v && typeof v === "object" && "decrement" in v ? l[k] - v.decrement : v && typeof v === "object" && "increment" in v ? (l[k] || 0) + v.increment : v; };
  return {
    linhas,
    findUnique: async ({ where }) => { const w = where.userId_dia || where; const l = linhas.find((x) => casa(x, w)); return l ? { ...l } : null; },
    findMany: async ({ where = {}, orderBy, take } = {}) => {
      let r = linhas.filter((l) => casa(l, where)).map((l) => ({ ...l }));
      if (orderBy) { const [k, d] = Object.entries(orderBy)[0]; r.sort((a, b) => (d === "desc" ? val(b[k]) - val(a[k]) : val(a[k]) - val(b[k]))); }
      return take ? r.slice(0, take) : r;
    },
    count: async ({ where = {} } = {}) => linhas.filter((l) => casa(l, where)).length,
    create: async ({ data }) => { seq++; const l = { ...defaults(seq), ...data }; if (chave === "id" && !l.id) l.id = "a" + seq; linhas.push(l); return { ...l }; },
    updateMany: async ({ where, data }) => { const ls = linhas.filter((l) => casa(l, where)); ls.forEach((l) => aplica(l, data)); return { count: ls.length }; },
    deleteMany: async ({ where = {} } = {}) => { let n = 0; for (let i = linhas.length - 1; i >= 0; i--) if (casa(linhas[i], where)) { linhas.splice(i, 1); n++; } return { count: n }; },
    upsert: async ({ where, create, update }) => { const l = linhas.find((x) => casa(x, where.userId_dia || where)); if (l) { aplica(l, update); return { ...l }; } const n = { ...create }; linhas.push(n); return { ...n }; },
  };
}
const NOMES = { ana: "Ana", bia: "Bia", caio: "Caio", novo: "Novo", visita: "Visita", baixo: "Baixo", sem: "SemItem", sus: "Suspeito" };
let relogio = Date.UTC(2026, 9, 6, 15);
// v407 (U7): a conta (idade, visitante), o nível do RANKING e o save na nuvem (mochila) que a feira confere
const CONTAS = { ana: {}, bia: {}, caio: {}, novo: { dias: 2 }, visita: { guest: true }, baixo: {}, sem: {}, sus: {} };
const NIVEIS = { ana: 50, bia: 50, caio: 50, novo: 50, visita: 50, baixo: 12, sem: 50, sus: 50 };
const prisma = {
  lendaAnuncio: tabela("id", () => ({ refino: 0 })),
  lendaVenda: tabela("id", () => ({ coletado: false, refino: 0 })),
  lendaBarraca: tabela("vendedorId"),
  lendaMercadoCota: tabela("userId"),
  lendaRanking: { findUnique: async ({ where }) => (NIVEIS[where.userId] ? { nivel: NIVEIS[where.userId] } : null) },
  lendaSave: tabela("userId"),
  suspiciousActivity: { findFirst: async ({ where }) => (where.userId === "sus" ? { id: "s1" } : null) },
  user: {
    findMany: async ({ where }) => where.id.in.map((id) => ({ id, nickname: NOMES[id] || id })),
    findUnique: async ({ where }) => { const c = CONTAS[where.id]; return c ? { isGuest: !!c.guest, createdAt: new Date(relogio - (c.dias ?? 30) * 864e5), role: where.id === "ana" ? "ADMIN" : "PLAYER" } : null; },
  },
};
const app = express(); app.use(express.json());
app.use("/m", criaRotasMercado({ prisma, agora: () => relogio, auth: (req, _r, n) => { req.user = { id: req.headers["x-user"] }; n(); } }));
const srv = app.listen(0); const url = `http://localhost:${srv.address().port}/m`;
after(() => srv.close());
const chama = async (quem, metodo, caminho, corpo) => { const r = await fetch(url + caminho, { method: metodo, headers: { "Content-Type": "application/json", "x-user": quem }, body: corpo ? JSON.stringify(corpo) : undefined }); return { status: r.status, ...(await r.json()) }; };

// um item comum empilhável e um equipamento do catálogo de verdade
const empilhavel = Object.keys(CATALOGO).find((id) => vendavel(id) && CATALOGO[id].e && CATALOGO[id].t === "loot");
const equip = Object.keys(CATALOGO).find((id) => vendavel(id) && CATALOGO[id].t === "equip" && CATALOGO[id].l >= 10);
const chave = Object.keys(CATALOGO).find((id) => CATALOGO[id].t === "chave");
// o save na nuvem de cada um (gzip+base64, igual ao jogo), gravado ANTES dos anúncios
const salva = (userId, mochila, armazem = []) => prisma.lendaSave.create({ data: { userId, dados: gzipSync(Buffer.from(JSON.stringify({ nivel: 50, mochila, armazem }))).toString("base64"), atualizadoEm: new Date(relogio - 60e3) } });
await salva("ana", [{ id: empilhavel, q: 10 }, { id: equip, q: 1, r: 3 }]);
await salva("bia", [{ id: empilhavel, q: 1 }]);
await salva("caio", [{ id: empilhavel, q: 30 }], [{ id: empilhavel, q: 20 }]);
for (const u of ["novo", "visita", "baixo", "sus"]) await salva(u, [{ id: empilhavel, q: 5 }]);
await salva("sem", [{ id: equip, q: 1 }]);

test("regras: o que vende, faixa de preço, anúncio, taxa, busca, barraca", () => {
  assert.ok(empilhavel && equip && chave);
  assert.equal(vendavel(chave), false); assert.equal(vendavel("nao_existe"), false);
  assert.equal(vendavel("lemb_camisa"), false, "lembrança (vale 1) não vende"); assert.equal(vendavel("fragmento_desperto"), true);
  assert.equal(faixaPreco("fragmento_desperto").min, 10000); assert.ok(faixaPreco("lr_caca_mv_pico_1").max > 4700, "loot de caça com o valor de verdade");
  const f = faixaPreco(empilhavel), f5 = faixaPreco(equip, 5);
  assert.ok(f.min >= 1 && f.max > f.min); assert.ok(f5.max > faixaPreco(equip).max);
  assert.ok(validaAnuncio({ itemId: empilhavel, qtd: 10, preco: f.min, nivel: NIVEL_VENDER }).ok);
  assert.match(validaAnuncio({ itemId: empilhavel, qtd: 10, preco: f.max + 1, nivel: 99 }).erro, /entre/);
  assert.match(validaAnuncio({ itemId: empilhavel, qtd: 10, preco: f.min, nivel: 5 }).erro, /nível/);
  assert.match(validaAnuncio({ itemId: equip, refino: 2, qtd: 2, preco: faixaPreco(equip, 2).min, nivel: 99 }).erro, /um de cada vez/);
  assert.ok(validaAnuncio({ itemId: equip, qtd: 2, preco: faixaPreco(equip).min, nivel: 99 }).ok, "equipamento sem refino empilha (v326)");
  assert.match(validaAnuncio({ itemId: chave, qtd: 1, preco: 10, nivel: 99 }).erro, /não pode/);
  assert.equal(recebeVendedor(1000), 950);
  assert.ok(idsDaBusca(CATALOGO[empilhavel].n.toUpperCase()).includes(empilhavel));
  assert.equal(idsDaBusca(""), null);
  assert.ok(validaBarraca({ vaga: 3, titulo: 1, cor: 2 }).ok);
  assert.ok(validaBarraca({ vaga: 99, titulo: 1, cor: 2 }).erro);
  assert.ok(validaBarraca({ vaga: 3, titulo: 99, cor: 2 }).erro);
});

test("feira ponta a ponta: anunciar, buscar, comprar em partes, não vender duas vezes, recolher, vencer, barraca", async () => {
  const f = faixaPreco(empilhavel);
  const a1 = await chama("ana", "POST", "/anunciar", { itemId: empilhavel, qtd: 10, preco: f.min * 2, nivel: 50 });
  assert.equal(a1.ok, true);
  const busca = await chama("bia", "GET", "/busca?q=" + encodeURIComponent(CATALOGO[empilhavel].n.slice(0, 4)));
  assert.equal(busca.anuncios[0].vendedor, "Ana");
  assert.equal((await chama("ana", "POST", `/comprar/${a1.anuncio.id}`, { qtd: 1 })).status, 400, "não compra o próprio");
  const c1 = await chama("bia", "POST", `/comprar/${a1.anuncio.id}`, { qtd: 4 });
  assert.deepEqual(c1.item, { itemId: empilhavel, refino: 0, qtd: 4 }); assert.equal(c1.total, f.min * 2 * 4);
  assert.equal((await chama("caio", "POST", `/comprar/${a1.anuncio.id}`, { qtd: 7 })).status, 400, "só sobraram 6");
  assert.equal((await chama("caio", "POST", `/comprar/${a1.anuncio.id}`, { qtd: 6 })).ok, true);
  assert.equal((await chama("bia", "POST", `/comprar/${a1.anuncio.id}`, { qtd: 1 })).status, 404, "acabou");
  // a Ana recolhe (menos 5%) uma vez só
  const minhas = await chama("ana", "GET", "/minhas");
  assert.equal(minhas.aReceber, recebeVendedor(f.min * 2 * 4) + recebeVendedor(f.min * 2 * 6));
  const col = await chama("ana", "POST", "/coletar");
  assert.equal(col.tostoes, minhas.aReceber);
  assert.equal((await chama("ana", "POST", "/coletar")).tostoes, 0);
  // equipamento refinado: anúncio, barraca, vence e volta
  const fe = faixaPreco(equip, 3);
  const a2 = await chama("ana", "POST", "/anunciar", { itemId: equip, refino: 3, qtd: 1, preco: fe.max, nivel: 50 });
  assert.equal(a2.ok, true);
  assert.equal((await chama("bia", "POST", "/barraca", { vaga: 5, titulo: 0, cor: 0 })).status, 400, "sem anúncio não monta");
  assert.equal((await chama("ana", "POST", "/barraca", { vaga: 5, titulo: 3, cor: 1 })).ok, true);
  await chama("bia", "POST", "/anunciar", { itemId: empilhavel, qtd: 1, preco: f.min, nivel: 50 });
  assert.equal((await chama("bia", "POST", "/barraca", { vaga: 5, titulo: 0, cor: 0 })).status, 409, "vaga ocupada");
  assert.equal((await chama("bia", "POST", "/barraca", { vaga: 6, titulo: 0, cor: 0 })).ok, true);
  const bs = await chama("caio", "GET", "/barracas");
  assert.equal(bs.barracas.length, 2); assert.equal(bs.barracas.find((b) => b.vendedor === "Ana").itens, 1);
  const loja = await chama("caio", "GET", "/loja/ana");
  assert.equal(loja.anuncios[0].refino, 3);
  relogio += DURACAO_MS + 1000; // venceu
  assert.equal((await chama("caio", "POST", `/comprar/${a2.anuncio.id}`, {})).status, 404);
  const m2 = await chama("ana", "GET", "/minhas");
  assert.equal(m2.vencidos.length, 1);
  const volta = await chama("ana", "POST", `/cancelar/${a2.anuncio.id}`);
  assert.deepEqual(volta.item, { itemId: equip, refino: 3, qtd: 1 });
  assert.equal((await chama("ana", "POST", `/cancelar/${a2.anuncio.id}`)).status, 404, "não devolve duas vezes");
  assert.equal((await chama("caio", "GET", "/barracas")).barracas.filter((b) => b.vendedor === "Ana").length, 0, "sem anúncio ativo a barraca some (e a vaga fica livre)");
});

test("limites: anúncios ativos e por dia", async () => {
  const f = faixaPreco(empilhavel);
  for (let i = 0; i < MAX_ATIVOS; i++) assert.equal((await chama("caio", "POST", "/anunciar", { itemId: empilhavel, qtd: 1, preco: f.min, nivel: 50 })).ok, true);
  assert.equal((await chama("caio", "POST", "/anunciar", { itemId: empilhavel, qtd: 1, preco: f.min, nivel: 50 })).status, 409);
  const ids = (await chama("caio", "GET", "/minhas")).ativos.map((a) => a.id);
  for (const id of ids) await chama("caio", "POST", `/cancelar/${id}`);
  // cancelar não devolve a cota do dia: ele já criou 12 hoje, então só cabem mais 8
  let ok = 0; for (let i = 0; i < MAX_ATIVOS; i++) if ((await chama("caio", "POST", "/anunciar", { itemId: empilhavel, qtd: 1, preco: f.min, nivel: 50 })).ok) ok++;
  assert.equal(ok, MAX_POR_DIA - MAX_ATIVOS);
  assert.match((await chama("caio", "POST", "/anunciar", { itemId: empilhavel, qtd: 1, preco: f.min, nivel: 50 })).error, /Hoje/);
  assert.equal((await chama("caio", "GET", "/minhas")).anunciosHoje, MAX_POR_DIA);
});

// ---------- v407 (Raio-X U7) ----------
test("v407: míticos e troféus de arena fora da feira; conta com 7 dias e não visitante", () => {
  const mitico = Object.keys(CATALOGO).find((id) => CATALOGO[id].r === "mitico");
  assert.ok(mitico); assert.equal(vendavel(mitico), false, "mítico não vende");
  for (const id of ITENS_ARENA) if (CATALOGO[id]) assert.equal(vendavel(id), false, id);
  const agora = Date.UTC(2026, 9, 6);
  assert.ok(podeVender({ isGuest: false, createdAt: new Date(agora - 8 * 864e5) }, agora).ok);
  assert.match(podeVender({ isGuest: false, createdAt: new Date(agora - 2 * 864e5) }, agora).erro, /7 dias/);
  assert.match(podeVender({ isGuest: true, createdAt: new Date(0) }, agora).erro, /visitante/);
  assert.equal(quantosNoSave({ mochila: [{ id: "x", q: 3 }, { id: "x", q: 1, r: 2 }], armazem: [{ id: "x", q: 4 }] }, "x", 0), 7);
  assert.equal(quantosNoSave({ mochila: [{ id: "x", q: 3 }, { id: "x", q: 1, r: 2 }] }, "x", 2), 1);
  assert.equal(quantosNoSave(null, "x"), 0);
});

test("v407: anunciar confere conta, nível do RANKING (não o do corpo), suspeitos e o save na nuvem", async () => {
  const f = faixaPreco(empilhavel);
  const anuncia = (quem, extra = {}) => chama(quem, "POST", "/anunciar", { itemId: empilhavel, qtd: 1, preco: f.min, nivel: 999, ...extra });
  assert.equal((await anuncia("novo")).status, 403, "conta com 2 dias");
  assert.equal((await anuncia("visita")).status, 403, "visitante");
  assert.match((await anuncia("baixo")).error, /nível 30/, "nível 12 no ranking, mesmo mandando 999");
  assert.equal((await anuncia("sus")).status, 403, "suspeito do ranking");
  assert.equal((await anuncia("sem")).status, 409, "o item não está no save na nuvem");
  // o que já foi anunciado depois do save conta (o item saiu da mochila, mas o save ainda mostra):
  // a Bia tinha 1 e o anúncio dela (vencido, ainda não recolhido) segura esse 1 — anunciar de novo não cria outro
  assert.equal((await anuncia("bia")).status, 409);
});

test("v407: teto de tostões recolhidos por dia e pares repetidos para o admin", async () => {
  assert.equal(tetoColetaDia(30), 180000); assert.equal(tetoColetaDia(1), 100000);
  const v = (total, min) => ({ total, criadoEm: new Date(Date.UTC(2026, 9, 6, 10, min)) });
  assert.equal(vendasQueCabem([v(1000, 3), v(1000, 1), v(1000, 2)], 0, 1900).length, 2, "950 + 950 cabem em 1900");
  assert.equal(vendasQueCabem([v(1000, 3), v(1000, 1), v(1000, 2)], 0, 1899)[0].criadoEm.getUTCMinutes(), 1, "as mais antigas primeiro");
  assert.equal(vendasQueCabem([v(1e9, 1)], 0, 1000).length, 1, "a primeira do dia sempre sai (não fica presa)");
  assert.equal(vendasQueCabem([v(1000, 1)], 500, 1000).length, 0);
  // rota: a Ana vende 3 coisas caras para o Caio; recolhe só até o teto do dia (nível 50 → 500 mil)
  const teto = tetoColetaDia(50);
  for (let i = 0; i < 3; i++) await prisma.lendaVenda.create({ data: { vendedorId: "ana", compradorId: "caio", itemId: empilhavel, qtd: 1, total: Math.ceil(teto / 2 / 0.95) + 10, criadoEm: new Date(relogio - (3 - i) * 1000) } });
  const c1 = await chama("ana", "POST", "/coletar");
  assert.equal(c1.vendas, 1); assert.equal(c1.faltam, 2); assert.match(c1.aviso, /máximo/);
  const c2 = await chama("ana", "POST", "/coletar");
  assert.equal(c2.tostoes, 0); assert.equal(c2.faltam, 3 - 1);
  relogio += 864e5; // dia seguinte
  assert.equal((await chama("ana", "POST", "/coletar")).vendas, 1);
  // pares repetidos (Ana → Caio, 3 vezes)
  const pares = paresRepetidos(prisma.lendaVenda.linhas, 3);
  assert.ok(pares.some((p) => p.vendedorId === "ana" && p.compradorId === "caio" && p.vendas >= 3));
  const rota = await chama("ana", "GET", "/admin/pares");
  assert.ok(rota.pares.some((p) => p.vendedor === "Ana" && p.comprador === "Caio"));
  assert.equal((await chama("bia", "GET", "/admin/pares")).status, 403, "só admin");
});
