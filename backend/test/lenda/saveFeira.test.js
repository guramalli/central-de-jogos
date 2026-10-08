// v411.4 (revisão de 07/10/2026): save na nuvem (fechando a página, ordem dos envios) e feira (transação na compra,
// pedido repetido quando a internet cai). Banco de mentira com atrasos, para as requisições se cruzarem de verdade.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { criaGuardaSave, criaPutSave, ordemDoCorpo, SAVE_INTERVALO_MS, FECHANDO_INTERVALO_MS, FECHANDO_MAX } from "../../src/lenda/saveNuvem.js";
import { criaPedidos } from "../../src/lenda/pedidos.js";
process.env.JWT_SECRET ||= "teste-save-feira";
const { criaRotasMercado } = await import("../../src/routes/lendaMercado.js");

const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
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
// tabela com atraso em cada operação (as requisições se intercalam como num banco de verdade)
function tabela(atraso = 0, chave = "id") {
  const t = { linhas: [], seq: 0, falhar: {} };
  const aplica = (l, data) => { for (const [k, v] of Object.entries(data)) l[k] = v && typeof v === "object" && "decrement" in v ? l[k] - v.decrement : v && typeof v === "object" && "increment" in v ? (l[k] || 0) + v.increment : v; };
  const op = (nome, fn) => async (arg = {}) => { await espera(atraso); if (t.falhar[nome]) { t.falhar[nome]--; throw new Error("banco caiu"); } return fn(arg); };
  Object.assign(t, {
    findUnique: op("findUnique", ({ where }) => { const l = t.linhas.find((x) => casa(x, where.userId_dia || where)); return l ? { ...l } : null; }),
    findMany: op("findMany", ({ where = {} }) => t.linhas.filter((l) => casa(l, where)).map((l) => ({ ...l }))),
    create: op("create", ({ data }) => { const l = { coletado: false, refino: 0, ...data }; if (chave === "id" && !l.id) l.id = "v" + ++t.seq; t.linhas.push(l); return { ...l }; }),
    updateMany: op("updateMany", ({ where, data }) => { const ls = t.linhas.filter((l) => casa(l, where)); ls.forEach((l) => aplica(l, data)); return { count: ls.length }; }),
    deleteMany: op("deleteMany", ({ where = {} }) => { let n = 0; for (let i = t.linhas.length - 1; i >= 0; i--) if (casa(t.linhas[i], where)) { t.linhas.splice(i, 1); n++; } return { count: n }; }),
    upsert: op("upsert", ({ where, create, update }) => { const l = t.linhas.find((x) => casa(x, where.userId_dia || where)); if (l) { aplica(l, update); return { ...l }; } const n = { ...create }; t.linhas.push(n); return { ...n }; }),
  });
  return t;
}

// ================= SAVE NA NUVEM =================
let relogio = Date.UTC(2026, 9, 7, 15);
function bancoSave(atraso) {
  const s = tabela(atraso, "userId");
  const upsert0 = s.upsert; // o @updatedAt do Prisma: a hora do servidor
  s.upsert = async ({ where, create, update, select }) => { const r = await upsert0({ where, create: { ...create, atualizadoEm: new Date(relogio) }, update: { ...update, atualizadoEm: new Date(relogio) } }); return select ? { atualizadoEm: r.atualizadoEm } : r; };
  return { lendaSave: s };
}
function servidorSave(atraso = 0) {
  const prisma = bancoSave(atraso), guarda = criaGuardaSave({ agora: () => relogio });
  const app = express(); app.use(express.json({ limit: "200kb" }));
  app.put("/save", (req, _r, n) => { req.user = { id: req.headers["x-user"] }; n(); }, criaPutSave({ prisma, guarda }));
  const srv = app.listen(0); after(() => srv.close());
  const put = async (quem, corpo) => { const r = await fetch(`http://localhost:${srv.address().port}/save`, { method: "PUT", headers: { "Content-Type": "application/json", "x-user": quem }, body: JSON.stringify(corpo) }); return { status: r.status, ...(await r.json()) }; };
  return { prisma, guarda, put, dados: (quem) => prisma.lendaSave.linhas.find((l) => l.userId === quem)?.dados };
}
const pacote = (txt, salvoEm, extra = {}) => ({ dados: Buffer.from(txt).toString("base64"), nivel: 10, salvoEm, sessao: "pagina1", ...extra });
const txtDe = (b64) => (b64 ? Buffer.from(b64, "base64").toString() : null);

test("save: o que o jogo manda sobre a ordem (valor estranho é ignorado)", () => {
  assert.deepEqual(ordemDoCorpo({ salvoEm: 1759849200000, sessao: "abc123xyz", fechando: true }), { salvoEm: 1759849200000, sessao: "abc123xyz", fechando: true });
  assert.deepEqual(ordemDoCorpo({ salvoEm: "1759849200000", sessao: "a b", fechando: "sim" }), { salvoEm: null, sessao: null, fechando: false });
  assert.deepEqual(ordemDoCorpo({ salvoEm: -5, sessao: "x".repeat(50) }), { salvoEm: null, sessao: null, fechando: false });
  assert.deepEqual(ordemDoCorpo(null), { salvoEm: null, sessao: null, fechando: false });
});

test("save (achado 1): o envio de FECHAR a página passa com 1,5 s; o normal continua com 10 s; o 'fechando' tem teto", async () => {
  const s = servidorSave();
  assert.equal((await s.put("ana", pacote("v1", 1000))).status, 200);
  relogio += 3000;
  assert.equal((await s.put("ana", pacote("v2", 2000))).status, 429, "normal dentro dos 10 s: recusa como antes");
  assert.equal((await s.put("ana", pacote("v2", 2000, { fechando: true }))).status, 200, "fechando a página: passa");
  assert.equal(txtDe(s.dados("ana")), "v2");
  relogio += FECHANDO_INTERVALO_MS - 500;
  assert.equal((await s.put("ana", pacote("v3", 3000, { fechando: true }))).status, 429, "menos de 1,5 s do último: recusa");
  relogio += SAVE_INTERVALO_MS;
  assert.equal((await s.put("ana", pacote("v3", 3000))).status, 200, "passados 10 s, o normal passa");
  // teto: no máximo FECHANDO_MAX "fechando" furam os 10 s a cada 10 min
  let passou = 0;
  for (let i = 0; i < FECHANDO_MAX + 5; i++) { relogio += 2000; if ((await s.put("bia", pacote("b" + i, 10_000 + i, { fechando: true }))).status === 200) passou++; }
  assert.equal(passou, FECHANDO_MAX + 1, "o primeiro (sem save antes) + o teto");
  relogio += 11 * 60_000;
  assert.equal((await s.put("bia", pacote("depois", 99_999, { fechando: true }))).status, 200);
  relogio += 2000;
  assert.equal((await s.put("bia", pacote("depois2", 100_000, { fechando: true }))).status, 200, "a janela de 10 min andou: o teto volta");
});

test("save (achado 2): envio mais VELHO que chega depois não sobrescreve (409 velho); outra sessão e jogo antigo seguem", async () => {
  const s = servidorSave();
  assert.equal((await s.put("caio", pacote("novo", 5000))).status, 200);
  relogio += 20_000;
  const velho = await s.put("caio", pacote("velho", 4000));
  assert.equal(velho.status, 409); assert.equal(velho.velho, true);
  assert.equal(txtDe(s.dados("caio")), "novo", "não gravou o velho");
  assert.equal((await s.put("caio", pacote("novo", 5000, { fechando: true }))).status, 200, "o mesmo salvoEm não é 'velho'");
  relogio += 20_000;
  assert.equal((await s.put("caio", pacote("outro aparelho", 1000, { sessao: "pagina2" }))).status, 200, "outra sessão (outro relógio): não compara");
  relogio += 20_000;
  assert.equal((await s.put("caio", { dados: Buffer.from("jogo antigo").toString("base64"), nivel: 10 })).status, 200, "sem salvoEm/sessao: como antes");
  // servidor reiniciou (memória vazia): aceita o primeiro, depois volta a comparar
  s.guarda.esquece(); relogio += 20_000;
  assert.equal((await s.put("caio", pacote("pos reinicio", 7000))).status, 200);
  relogio += 2000;
  assert.equal((await s.put("caio", pacote("atrasado", 6000, { fechando: true }))).status, 409);
});

test("save (achado 2, concorrência): dois PUT ao mesmo tempo, o mais velho por último — fica o mais novo", async () => {
  const s = servidorSave(25); // cada ida ao banco demora 25 ms: sem a fila por conta, os dois leriam "sem save" e gravariam
  // (o velho sai 10 ms depois, para chegar em segundo; o novo ainda está gravando quando ele chega)
  const [a, b] = await Promise.all([s.put("dani", pacote("novo", 9000)), espera(10).then(() => s.put("dani", pacote("velho", 8000, { fechando: true })))]);
  assert.equal(a.status, 200); assert.equal(b.status, 409);
  assert.equal(txtDe(s.dados("dani")), "novo");
  // na ordem certa (o velho primeiro): os dois gravam e fica o novo
  relogio += 20_000;
  assert.equal((await s.put("dani", pacote("v10", 10_000))).status, 200);
  relogio += 2000;
  const d = await s.put("dani", pacote("v11", 11_000, { fechando: true }));
  assert.equal(d.status, 200); assert.equal(txtDe(s.dados("dani")), "v11");
  // muitos ao mesmo tempo, fora de ordem: nunca termina num mais velho que o maior aceito
  relogio += 20_000;
  const ordem = [15, 12, 14, 13, 16];
  const rs = await Promise.all(ordem.map((n) => s.put("dani", pacote("v" + n, n * 1000, { fechando: true }))));
  const aceitos = ordem.filter((_n, i) => rs[i].status === 200);
  assert.equal(txtDe(s.dados("dani")), "v" + aceitos[aceitos.length - 1]);
  assert.ok(rs.every((r) => [200, 409, 429].includes(r.status)));
});

test("save: corpo inválido continua 400 (o servidor confere o save antes de tudo)", async () => {
  const s = servidorSave();
  assert.equal((await s.put("eva", { dados: "@@@", nivel: 5, salvoEm: 1 })).status, 400);
  assert.equal((await s.put("eva", { dados: "QUJD", nivel: 0 })).status, 400);
});

// ================= FEIRA =================
const T0 = Date.UTC(2026, 9, 7, 15);
function bancoFeira(atraso = 5) {
  const prisma = {
    lendaAnuncio: tabela(atraso), lendaVenda: tabela(atraso), lendaMercadoCota: tabela(atraso, "userId"),
    lendaRanking: { findUnique: async () => ({ nivel: 50 }) },
    user: { findMany: async ({ where }) => where.id.in.map((id) => ({ id, nickname: id })), findUnique: async () => ({ role: "PLAYER" }) },
  };
  // transação de mentira: uma de cada vez; se der erro no meio, desfaz tudo (como o Postgres)
  let fila = Promise.resolve();
  const tabelas = ["lendaAnuncio", "lendaVenda", "lendaMercadoCota"];
  prisma.$transaction = (fn) => {
    const p = fila.then(async () => {
      const foto = tabelas.map((k) => prisma[k].linhas.map((l) => ({ ...l })));
      try { return await fn(prisma); } catch (e) { tabelas.forEach((k, i) => { prisma[k].linhas.length = 0; prisma[k].linhas.push(...foto[i]); }); throw e; }
    });
    fila = p.catch(() => {});
    return p;
  };
  return prisma;
}
function servidorFeira(prisma) {
  const app = express(); app.use(express.json());
  app.use("/m", criaRotasMercado({ prisma, agora: () => T0, pedidos: criaPedidos({ agora: () => T0 }), auth: (req, _r, n) => { req.user = { id: req.headers["x-user"] }; n(); } }));
  const srv = app.listen(0); after(() => srv.close());
  return async (quem, caminho, corpo) => { const r = await fetch(`http://localhost:${srv.address().port}/m${caminho}`, { method: "POST", headers: { "Content-Type": "application/json", "x-user": quem }, body: corpo ? JSON.stringify(corpo) : undefined }); return { status: r.status, repetido: r.headers.get("x-pedido-repetido") === "1", ...(await r.json()) }; };
}
const anuncio = (prisma, id, qtd, extra = {}) => prisma.lendaAnuncio.linhas.push({ id, vendedorId: "ana", itemId: "pocao", refino: 0, qtd, preco: 100, criadoEm: new Date(T0 - 1000), expiraEm: new Date(T0 + 864e5), ...extra });

test("feira (achado 4): se registrar a venda falhar, a compra é DESFEITA (o item não some do anúncio)", async () => {
  const prisma = bancoFeira(), post = servidorFeira(prisma);
  anuncio(prisma, "a1", 3);
  prisma.lendaVenda.falhar.create = 1;
  const r = await post("bia", "/comprar/a1", { qtd: 2 });
  assert.equal(r.status, 503);
  assert.equal(prisma.lendaAnuncio.linhas.find((a) => a.id === "a1").qtd, 3, "o anúncio voltou ao que era");
  assert.equal(prisma.lendaVenda.linhas.length, 0);
  // comprando o último: se falhar, o anúncio (que seria apagado) também volta
  anuncio(prisma, "a2", 1);
  prisma.lendaVenda.falhar.create = 1;
  assert.equal((await post("bia", "/comprar/a2", { qtd: 1 })).status, 503);
  assert.equal(prisma.lendaAnuncio.linhas.find((a) => a.id === "a2")?.qtd, 1);
  // sem falha: compra normal
  const ok = await post("bia", "/comprar/a2", { qtd: 1 });
  assert.equal(ok.ok, true); assert.deepEqual(ok.item, { itemId: "pocao", refino: 0, qtd: 1 }); assert.equal(ok.total, 100);
  assert.equal(prisma.lendaAnuncio.linhas.find((a) => a.id === "a2"), undefined, "o anúncio zerado saiu");
  assert.equal(prisma.lendaVenda.linhas.length, 1);
});

test("feira (achado 4, concorrência): duas compras ao mesmo tempo do ÚLTIMO item — só uma passa", async () => {
  const prisma = bancoFeira(15), post = servidorFeira(prisma);
  anuncio(prisma, "u1", 1);
  const rs = await Promise.all([post("bia", "/comprar/u1", { qtd: 1 }), post("caio", "/comprar/u1", { qtd: 1 }), post("dani", "/comprar/u1", { qtd: 1 })]);
  assert.equal(rs.filter((r) => r.status === 200).length, 1);
  assert.ok(rs.filter((r) => r.status !== 200).every((r) => r.status === 409 || r.status === 404));
  assert.equal(prisma.lendaVenda.linhas.length, 1, "uma venda só");
  assert.equal(prisma.lendaAnuncio.linhas.length, 0);
  // o vendedor não compra o próprio (proteção de sempre)
  anuncio(prisma, "u2", 2);
  assert.equal((await post("ana", "/comprar/u2", { qtd: 1, pedido: "pedidoDaAna1" })).status, 400);
});

test("feira (achado 5): o MESMO pedido repetido (internet caiu) devolve a mesma resposta e não compra duas vezes", async () => {
  const prisma = bancoFeira(10), post = servidorFeira(prisma);
  anuncio(prisma, "p1", 5);
  const r1 = await post("bia", "/comprar/p1", { qtd: 2, pedido: "pedidoBia0001" });
  const r2 = await post("bia", "/comprar/p1", { qtd: 2, pedido: "pedidoBia0001" });
  assert.equal(r1.status, 200); assert.equal(r1.repetido, false);
  assert.equal(r2.status, 200); assert.equal(r2.repetido, true);
  assert.deepEqual({ ...r2, repetido: false }, r1);
  assert.equal(prisma.lendaAnuncio.linhas[0].qtd, 3); assert.equal(prisma.lendaVenda.linhas.length, 1);
  // repetido AO MESMO TEMPO (a primeira ainda no caminho): espera a primeira e devolve igual
  const [r3, r4] = await Promise.all([post("bia", "/comprar/p1", { qtd: 1, pedido: "pedidoBia0002" }), post("bia", "/comprar/p1", { qtd: 1, pedido: "pedidoBia0002" })]);
  assert.equal(r3.status, 200); assert.equal(r4.status, 200);
  assert.equal(prisma.lendaAnuncio.linhas[0].qtd, 2); assert.equal(prisma.lendaVenda.linhas.length, 2);
  // pedido novo = compra nova; o mesmo código de OUTRA pessoa não pega a resposta dela
  assert.equal((await post("caio", "/comprar/p1", { qtd: 1, pedido: "pedidoBia0002" })).repetido, false);
  assert.equal(prisma.lendaAnuncio.linhas[0].qtd, 1);
  // a resposta "alguém comprou antes" também se repete igual (não tenta de novo escondido)
  // pedido em formato estranho: recusa
  assert.equal((await post("bia", "/comprar/p1", { qtd: 1, pedido: "x" })).status, 400);
  assert.equal((await post("bia", "/comprar/p1", { qtd: 1, pedido: { a: 1 } })).status, 400);
  // a primeira deu erro do servidor (nada foi feito): a repetição faz de verdade
  prisma.lendaVenda.falhar.create = 1;
  assert.equal((await post("bia", "/comprar/p1", { qtd: 1, pedido: "pedidoBia0003" })).status, 503);
  const r5 = await post("bia", "/comprar/p1", { qtd: 1, pedido: "pedidoBia0003" });
  assert.equal(r5.status, 200); assert.equal(r5.repetido, false);
  assert.equal(prisma.lendaVenda.linhas.length, 4); assert.equal(prisma.lendaAnuncio.linhas.length, 0);
});

test("feira (achado 5): cancelar e recolher repetidos com o mesmo pedido não perdem o item nem os tostões", async () => {
  const prisma = bancoFeira(5), post = servidorFeira(prisma);
  anuncio(prisma, "c1", 4, { refino: 2 });
  const c1 = await post("ana", "/cancelar/c1", { pedido: "cancelaAna01" });
  const c2 = await post("ana", "/cancelar/c1", { pedido: "cancelaAna01" });
  assert.equal(c1.ok, true); assert.deepEqual(c1.item, { itemId: "pocao", refino: 2, qtd: 4 });
  assert.equal(c2.status, 200); assert.equal(c2.repetido, true); assert.deepEqual(c2.item, c1.item, "a repetição recebe o item (antes: 404 e o item sumia)");
  assert.equal((await post("ana", "/cancelar/c1", { pedido: "cancelaAna02" })).status, 404, "pedido novo: não devolve duas vezes");
  assert.equal((await post("ana", "/cancelar/c1")).status, 404, "sem pedido (jogo antigo): como antes");
  // recolher
  prisma.lendaVenda.linhas.push({ id: "w1", vendedorId: "ana", compradorId: "bia", itemId: "pocao", refino: 0, qtd: 1, total: 1000, coletado: false, criadoEm: new Date(T0) });
  const [k1, k2] = await Promise.all([post("ana", "/coletar", { pedido: "coletaAna01" }), post("ana", "/coletar", { pedido: "coletaAna01" })]);
  assert.equal(k1.tostoes, 950); assert.equal(k2.tostoes, 950, "a repetição recebe os mesmos tostões");
  assert.equal(prisma.lendaMercadoCota.linhas.find((c) => c.dia.startsWith("t:")).n, 950, "contou uma vez só no teto do dia");
  assert.equal((await post("ana", "/coletar", { pedido: "coletaAna02" })).tostoes, 0, "pedido novo: nada a mais");
});

test("pedidos: a memória tem prazo e tamanho máximo", async () => {
  let t = 0; const p = criaPedidos({ ttlMs: 1000, max: 3, agora: () => t });
  const app = express(); app.use(express.json());
  let feitos = 0;
  app.post("/x/:id", (req, _r, n) => { req.user = { id: "u" }; n(); }, p.umaVez("x"), (_req, res) => { feitos++; res.json({ n: feitos }); });
  const srv = app.listen(0); after(() => srv.close());
  const post = (id, pedido) => fetch(`http://localhost:${srv.address().port}/x/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pedido }) }).then((r) => r.json());
  assert.equal((await post("a", "pedido0001")).n, 1);
  assert.equal((await post("a", "pedido0001")).n, 1);
  assert.equal((await post("b", "pedido0001")).n, 2, "outro anúncio: outra chave");
  t = 2000;
  assert.equal((await post("a", "pedido0001")).n, 3, "passou o prazo: vale como novo");
  for (let i = 0; i < 6; i++) await post("c", "pedidoZ00" + i);
  assert.ok(p.tamanho() <= 4);
});
