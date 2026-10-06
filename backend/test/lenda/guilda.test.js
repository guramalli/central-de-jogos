import { test, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { montaNome, validaCriacao, semanaId, faixasAtingidas, podeMexer, pontosDoEnvio, normalizaSemana, METAS, MIN_AJUDA, TETO_POR_ENVIO, ENVIO_MIN_MS, TETO_SEMANA_MEMBRO, cabeNaSemana } from "../../src/lenda/guilda.js";
// (as rotas importam o middleware de login, que exige JWT_SECRET; nos testes o login é de mentira)
process.env.JWT_SECRET ||= "teste-guilda";
const { criaRotasGuilda } = await import("../../src/routes/lendaGuilda.js");

// ---------- banco de mentira (só o que as rotas usam) ----------
function tabela(chave, defaults = () => ({})) {
  const linhas = []; let seq = 0;
  const igual = (a, b) => (a instanceof Date || b instanceof Date ? a != null && b != null && new Date(a).getTime() === new Date(b).getTime() : (a ?? null) === (b ?? null));
  const casa = (l, w = {}) => Object.entries(w).every(([k, v]) => v && typeof v === "object" && !(v instanceof Date) && "in" in v ? v.in.includes(l[k]) : igual(l[k], v));
  // v407: "increment" no update (como o Prisma)
  const aplica = (l, data) => { for (const [k, v] of Object.entries(data)) l[k] = v && typeof v === "object" && "increment" in v ? (l[k] || 0) + v.increment : v; };
  const acha = (where) => {
    const k = Object.keys(where)[0], v = where[k];
    if (v && typeof v === "object" && !Array.isArray(v)) return linhas.find((l) => Object.entries(v).every(([a, b]) => l[a] === b));
    return linhas.find((l) => l[k] === v);
  };
  return {
    linhas,
    findUnique: async ({ where }) => { const l = acha(where); return l ? { ...l } : null; },
    findMany: async ({ where = {}, orderBy, take } = {}) => {
      let r = linhas.filter((l) => casa(l, where)).map((l) => ({ ...l }));
      if (orderBy) { const [k, d] = Object.entries(orderBy)[0]; r.sort((a, b) => (d === "desc" ? b[k] - a[k] : a[k] - b[k])); }
      return take ? r.slice(0, take) : r;
    },
    count: async ({ where = {} } = {}) => linhas.filter((l) => casa(l, where)).length,
    create: async ({ data }) => { seq++; const l = { ...defaults(seq), ...data }; if (chave === "id" && !l.id) l.id = "id" + seq; linhas.push(l); return { ...l }; },
    update: async ({ where, data }) => { const l = acha(where); if (!l) throw new Error("não achou"); aplica(l, data); return { ...l }; },
    updateMany: async ({ where = {}, data }) => { let n = 0; for (const l of linhas) if (casa(l, where)) { aplica(l, data); n++; } return { count: n }; },
    delete: async ({ where }) => { const l = acha(where); const i = linhas.indexOf(l); if (i < 0) throw new Error("não achou"); linhas.splice(i, 1); return l; },
    deleteMany: async ({ where = {} } = {}) => { let n = 0; for (let i = linhas.length - 1; i >= 0; i--) if (casa(linhas[i], where)) { linhas.splice(i, 1); n++; } return { count: n }; },
    upsert: async ({ where, create, update }) => { const l = acha(where); if (l) { Object.assign(l, update); return { ...l }; } seq++; const n = { id: "c" + seq, ...create }; linhas.push(n); return { ...n }; },
  };
}
const NOMES = { ana: "Ana", bia: "Bia", caio: "Caio", davi: "Davi", edu: "Edu" };
const prisma = {
  lendaGuilda: tabela("id", (n) => ({ numero: n, semana: "", pontosSemana: 0, pontosTotal: 0 })),
  lendaGuildaMembro: tabela("userId", () => ({ entrouEm: new Date(Date.now() + Math.random()), semana: "", pontosSemana: 0, premios: 0, papel: "membro" })),
  lendaGuildaConvite: tabela("id"),
  lendaRanking: tabela("userId"),
  user: { findMany: async ({ where }) => where.id.in.map((id) => ({ id, nickname: NOMES[id] || id })) },
};
const AMIGOS = { ana: ["bia", "caio", "edu"], bia: ["ana", "davi"], caio: ["ana"], davi: ["bia"], edu: ["ana"] };
const app = express(); app.use(express.json());
app.use("/g", criaRotasGuilda({ prisma, amigosDe: async (id) => AMIGOS[id] || [], auth: (req, _res, next) => { const id = req.headers["x-user"]; req.user = { id, nickname: NOMES[id] }; next(); } }));
const srv = app.listen(0); const url = `http://localhost:${srv.address().port}/g`;
after(() => srv.close());
const chama = async (quem, metodo, caminho, corpo) => { const r = await fetch(url + caminho, { method: metodo, headers: { "Content-Type": "application/json", "x-user": quem }, body: corpo ? JSON.stringify(corpo) : undefined }); return { status: r.status, ...(await r.json()) }; };

test("regras: nome com concordância, validação, semana, faixas, cargos, envio", () => {
  assert.equal(montaNome(0, 0), "Os Leões de Fogo");
  assert.equal(montaNome(1, 10), "As Águias Douradas");
  assert.equal(montaNome(0, 10), "Os Leões Dourados");
  assert.equal(montaNome(99, 0), null);
  assert.ok(validaCriacao({ nome: 1, complemento: 2, escudo: 3, cor: 4 }).ok);
  assert.ok(validaCriacao({ nome: "1", complemento: 2, escudo: 3, cor: 4 }).ok);
  assert.ok(validaCriacao({ nome: "Palavrão", complemento: 2, escudo: 3, cor: 4 }).erro);
  assert.ok(validaCriacao({ nome: 1, complemento: 2, escudo: 99, cor: 4 }).erro);
  assert.equal(semanaId(Date.UTC(2026, 9, 5, 12)), "2026-10-05");          // segunda
  assert.equal(semanaId(Date.UTC(2026, 9, 12, 2)), "2026-10-05");          // segunda 02h UTC = domingo 23h em Brasília
  assert.equal(semanaId(Date.UTC(2026, 9, 11, 20)), "2026-10-05");         // domingo
  assert.equal(faixasAtingidas(METAS[1]), 2); assert.equal(faixasAtingidas(0), 0);
  assert.equal(podeMexer("lider", "vice"), true); assert.equal(podeMexer("vice", "vice"), false); assert.equal(podeMexer("membro", "membro"), false);
  assert.equal(pontosDoEnvio(99999, 0), TETO_POR_ENVIO);
  assert.equal(pontosDoEnvio(10, Date.now() - 1000), 0);
  assert.equal(pontosDoEnvio(10, Date.now() - ENVIO_MIN_MS - 1), 10);
  assert.equal(pontosDoEnvio(-5, 0), 0);
  assert.deepEqual(normalizaSemana({ semana: "2000-01-03", pontosSemana: 50, premios: 3 }, Date.UTC(2026, 9, 6)), { semana: "2026-10-05", pontosSemana: 0, premios: 0 });
});

test("guilda ponta a ponta: criar, convidar só amigo, aceitar, cargos, pontos, prêmio, ranking, sair", async () => {
  // v407 (U7): o nível vem do RANKING do servidor; o "nivel" que o jogo manda no corpo é ignorado
  assert.match((await chama("ana", "POST", "/criar", { nome: 0, complemento: 0, escudo: 0, cor: 0, nivel: 50 })).error, /nível 20/);
  await prisma.lendaRanking.create({ data: { userId: "ana", nivel: 5 } });
  assert.match((await chama("ana", "POST", "/criar", { nome: 0, complemento: 0, escudo: 0, cor: 0, nivel: 50 })).error, /nível 20/);
  prisma.lendaRanking.linhas[0].nivel = 50;
  const c = await chama("ana", "POST", "/criar", { nome: 0, complemento: 0, escudo: 0, cor: 0, nivel: 1 });
  assert.equal(c.ok, true); assert.equal(c.guilda.nome, "Os Leões de Fogo");
  assert.equal((await chama("ana", "POST", "/criar", { nome: 1, complemento: 1, escudo: 1, cor: 1, nivel: 50 })).status, 409);
  // convite: só amigo; davi não é amigo da ana
  assert.equal((await chama("ana", "POST", "/convidar", { userId: "davi" })).status, 403);
  assert.equal((await chama("ana", "POST", "/convidar", { userId: "bia" })).ok, true);
  const mb = await chama("bia", "GET", "/minha");
  assert.equal(mb.guilda, null); assert.equal(mb.convites.length, 1); assert.equal(mb.convites[0].de, "Ana");
  assert.equal((await chama("bia", "POST", `/convite/${mb.convites[0].id}/aceitar`)).ok, true);
  // membro comum não convida; vice convida
  assert.equal((await chama("bia", "POST", "/convidar", { userId: "davi" })).status, 403);
  assert.equal((await chama("ana", "POST", "/cargo", { userId: "bia", papel: "vice" })).ok, true);
  assert.equal((await chama("bia", "POST", "/convidar", { userId: "davi" })).ok, true);
  const md = await chama("davi", "GET", "/minha"); await chama("davi", "POST", `/convite/${md.convites[0].id}/aceitar`);
  // vice não tira vice, mas tira membro... (aqui tira o davi e ele volta pelo convite de novo)
  assert.equal((await chama("bia", "POST", "/expulsar", { userId: "ana" })).status, 403);
  // pontos: teto por envio e intervalo mínimo
  const p1 = await chama("bia", "POST", "/pontos", { n: 99999 });
  assert.equal(p1.pontos, TETO_POR_ENVIO);
  assert.equal((await chama("bia", "POST", "/pontos", { n: 50 })).pontos, 0, "envio rápido demais não conta");
  // v407 (U7): soma por increment na guilda e no membro; teto da SEMANA por membro
  const mbBia = prisma.lendaGuildaMembro.linhas.find((m) => m.userId === "bia");
  assert.equal(mbBia.pontosSemana, TETO_POR_ENVIO);
  assert.equal(prisma.lendaGuilda.linhas[0].pontosSemana, TETO_POR_ENVIO);
  mbBia.pontosSemana = TETO_SEMANA_MEMBRO - 10; mbBia.ultimoEnvio = new Date(Date.now() - ENVIO_MIN_MS - 5);
  assert.equal((await chama("bia", "POST", "/pontos", { n: 300 })).pontos, 10, "só o que cabe no teto da semana");
  mbBia.ultimoEnvio = new Date(Date.now() - ENVIO_MIN_MS - 5);
  assert.equal((await chama("bia", "POST", "/pontos", { n: 300 })).pontos, 0, "teto da semana cheio");
  assert.equal(cabeNaSemana(500, TETO_SEMANA_MEMBRO - 100), 100);
  // a guilda chega na 1ª meta (forçando os pontos da guilda) e a bia (ajudou) resgata 1 vez; a ana (0 pontos) não
  const g = prisma.lendaGuilda.linhas[0]; g.pontosSemana = METAS[0] + 1;
  assert.equal((await chama("bia", "POST", "/premio", { faixa: 0 })).ok, true);
  assert.equal((await chama("bia", "POST", "/premio", { faixa: 0 })).status, 409);
  assert.equal((await chama("bia", "POST", "/premio", { faixa: 1 })).status, 400);
  assert.match((await chama("ana", "POST", "/premio", { faixa: 0 })).error, new RegExp(String(MIN_AJUDA)));
  const minha = await chama("ana", "GET", "/minha");
  assert.equal(minha.membros.length, 3); assert.equal(minha.membros[0].papel, "lider"); assert.equal(minha.guilda.faixas, 1);
  const rk = await chama("caio", "GET", "/ranking");
  assert.equal(rk.ranking[0].nome, "Os Leões de Fogo");
  // a líder sai: a vice (bia) vira líder; depois todos saem e a guilda some
  await chama("ana", "POST", "/sair");
  assert.equal(prisma.lendaGuildaMembro.linhas.find((m) => m.userId === "bia").papel, "lider");
  await chama("davi", "POST", "/sair"); const fim = await chama("bia", "POST", "/sair");
  assert.equal(fim.apagada, true); assert.equal(prisma.lendaGuilda.linhas.length, 0);
});

test("sem as tabelas: 503 com mensagem", async () => {
  const app2 = express(); app2.use(express.json());
  const quebrado = new Proxy({}, { get: () => new Proxy({}, { get: () => async () => { throw new Error("P2021 tabela não existe"); } }) });
  app2.use("/g", criaRotasGuilda({ prisma: quebrado, amigosDe: async () => [], auth: (req, _r, n) => { req.user = { id: "ana" }; n(); } }));
  const s2 = app2.listen(0);
  const r = await fetch(`http://localhost:${s2.address().port}/g/minha`); s2.close();
  assert.equal(r.status, 503);
});
