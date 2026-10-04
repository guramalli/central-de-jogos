import { test, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { CATALOGO, vendavel, faixaPreco, validaAnuncio, recebeVendedor, idsDaBusca, validaBarraca, MAX_ATIVOS, MAX_POR_DIA, NIVEL_VENDER, DURACAO_MS } from "../../src/lenda/mercado.js";
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
const NOMES = { ana: "Ana", bia: "Bia", caio: "Caio" };
const prisma = {
  lendaAnuncio: tabela("id", () => ({ refino: 0 })),
  lendaVenda: tabela("id", () => ({ coletado: false, refino: 0 })),
  lendaBarraca: tabela("vendedorId"),
  lendaMercadoCota: tabela("userId"),
  user: { findMany: async ({ where }) => where.id.in.map((id) => ({ id, nickname: NOMES[id] || id })) },
};
let relogio = Date.UTC(2026, 9, 6, 15);
const app = express(); app.use(express.json());
app.use("/m", criaRotasMercado({ prisma, agora: () => relogio, auth: (req, _r, n) => { req.user = { id: req.headers["x-user"] }; n(); } }));
const srv = app.listen(0); const url = `http://localhost:${srv.address().port}/m`;
after(() => srv.close());
const chama = async (quem, metodo, caminho, corpo) => { const r = await fetch(url + caminho, { method: metodo, headers: { "Content-Type": "application/json", "x-user": quem }, body: corpo ? JSON.stringify(corpo) : undefined }); return { status: r.status, ...(await r.json()) }; };

// um item comum empilhável e um equipamento do catálogo de verdade
const empilhavel = Object.keys(CATALOGO).find((id) => vendavel(id) && CATALOGO[id].e && CATALOGO[id].t === "loot");
const equip = Object.keys(CATALOGO).find((id) => vendavel(id) && CATALOGO[id].t === "equip" && CATALOGO[id].l >= 10);
const chave = Object.keys(CATALOGO).find((id) => CATALOGO[id].t === "chave");

test("regras: o que vende, faixa de preço, anúncio, taxa, busca, barraca", () => {
  assert.ok(empilhavel && equip && chave);
  assert.equal(vendavel(chave), false); assert.equal(vendavel("nao_existe"), false);
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
  assert.ok(validaBarraca({ mapa: "rio", x: 10.2, y: 5, titulo: 1, cor: 2 }).ok);
  assert.ok(validaBarraca({ mapa: "rio", x: 10, y: 5, titulo: 99, cor: 2 }).erro);
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
  assert.equal((await chama("bia", "POST", "/barraca", { mapa: "rio", x: 10, y: 10, titulo: 0, cor: 0 })).status, 400, "sem anúncio não monta");
  assert.equal((await chama("ana", "POST", "/barraca", { mapa: "rio", x: 10, y: 10, titulo: 3, cor: 1 })).ok, true);
  await chama("bia", "POST", "/anunciar", { itemId: empilhavel, qtd: 1, preco: f.min, nivel: 50 });
  assert.equal((await chama("bia", "POST", "/barraca", { mapa: "rio", x: 11, y: 10, titulo: 0, cor: 0 })).status, 409, "perto demais");
  assert.equal((await chama("bia", "POST", "/barraca", { mapa: "rio", x: 15, y: 10, titulo: 0, cor: 0 })).ok, true);
  const bs = await chama("caio", "GET", "/barracas?mapa=rio");
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
  assert.equal((await chama("caio", "GET", "/barracas?mapa=rio")).barracas.length, 0, "sem anúncio ativo a barraca some");
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
