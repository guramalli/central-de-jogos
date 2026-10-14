// Família Santos (jogo em /jocelino/) — save na conta: GET /save, GET /save/meta, PUT /save (routes/jocelino.js).
// Banco de mentira (nada de Postgres): a tabela JocelinoSave e o @updatedAt do Prisma imitados aqui.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
// nunca encosta num banco de verdade: as rotas recebem o banco de mentira; o PrismaClient real (db.js) nem conecta
process.env.DATABASE_URL = "postgresql://ninguem:nada@127.0.0.1:1/teste_sem_banco";
process.env.JWT_SECRET ||= "teste-jocelino-save";
const { criaGuardaSave, SAVE_INTERVALO_MS, FECHANDO_INTERVALO_MS } = await import("../../src/lenda/saveNuvem.js");
const { validarSaveJocelino, LIMITES } = await import("../../src/jocelino/validar.js");
const { validarSave } = await import("../../src/lenda/validar.js");
const { criaRotasJocelino } = await import("../../src/routes/jocelino.js");
const { requireAuth } = await import("../../src/middleware/auth.js");

let relogio = Date.UTC(2026, 9, 14, 12);
function bancoDeMentira() {
  const linhas = [];
  const t = {
    linhas, falha: null,
    async findUnique({ where, select }) {
      if (t.falha) throw t.falha;
      const l = linhas.find((x) => x.userId === where.userId);
      if (!l) return null;
      if (!select) return { ...l };
      return Object.fromEntries(Object.keys(select).map((k) => [k, l[k]]));
    },
    async upsert({ where, create, update, select }) {
      if (t.falha) throw t.falha;
      let l = linhas.find((x) => x.userId === where.userId);
      if (l) Object.assign(l, update, { atualizadoEm: new Date(relogio) });
      else { l = { criadoEm: new Date(relogio), ...create, atualizadoEm: new Date(relogio) }; linhas.push(l); }
      return select ? { atualizadoEm: l.atualizadoEm } : { ...l };
    },
  };
  return { jocelinoSave: t };
}
function servidor({ auth } = {}) {
  const prisma = bancoDeMentira();
  const guarda = criaGuardaSave({ agora: () => relogio });
  const fingeLogin = (req, res, n) => { if (!req.headers["x-user"]) return res.status(401).json({ error: "Token não fornecido." }); req.user = { id: req.headers["x-user"] }; n(); };
  const app = express(); app.use(express.json());
  app.use("/api/jocelino", criaRotasJocelino({ prisma, auth: auth || fingeLogin, guarda }));
  const srv = app.listen(0); after(() => srv.close());
  const url = (p) => `http://localhost:${srv.address().port}/api/jocelino${p}`;
  const pede = async (metodo, p, quem, corpo) => {
    const h = { "Content-Type": "application/json" }; if (quem) h["x-user"] = quem;
    const r = await fetch(url(p), { method: metodo, headers: h, body: corpo ? JSON.stringify(corpo) : undefined });
    return { status: r.status, corpo: await r.json() };
  };
  return { prisma, pede, url };
}
const b64 = (txt) => Buffer.from(txt).toString("base64");
const txt = (b) => Buffer.from(b, "base64").toString();
const pacote = (t, dia, extra = {}) => ({ dados: b64(t), dia, salvoEm: relogio, sessao: "pagina1", ...extra });

test("validar: dados em base64 até 90.000 caracteres e dia inteiro de 1 a 100.000", () => {
  assert.equal(LIMITES.saveMaxChars, 90_000);
  assert.ok(validarSaveJocelino({ dados: b64("oi"), dia: 1 }).ok);
  assert.ok(validarSaveJocelino({ dados: b64("oi"), dia: 100_000 }).ok);
  assert.equal(validarSaveJocelino({ dados: "", dia: 3 }).erro, "Save vazio.");
  assert.equal(validarSaveJocelino({ dia: 3 }).erro, "Save vazio.");
  assert.equal(validarSaveJocelino({ dados: "A".repeat(90_001), dia: 3 }).erro, "Save grande demais.");
  assert.ok(validarSaveJocelino({ dados: "A".repeat(90_000), dia: 3 }).ok);
  assert.equal(validarSaveJocelino({ dados: "nao e base64 !", dia: 3 }).erro, "Save em formato inválido.");
  for (const dia of [0, -1, 100_001, 2.5, "7", null, undefined]) assert.equal(validarSaveJocelino({ dados: b64("x"), dia }).erro, "Dia inválido.", String(dia));
  assert.equal(validarSaveJocelino(null).erro, "Save vazio.");
});

test("o Lenda continua igual: validarSave pede `nivel`, não `dia`", () => {
  assert.ok(validarSave({ dados: b64("x"), nivel: 3 }).ok);
  assert.equal(validarSave({ dados: b64("x"), dia: 3 }).erro, "Nível inválido.");
});

test("sem login: 401 nas três rotas (requireAuth de verdade, sem tocar no banco)", async () => {
  const { pede } = servidor({ auth: requireAuth });
  assert.equal((await pede("GET", "/save")).status, 401);
  assert.equal((await pede("GET", "/save/meta")).status, 401);
  assert.equal((await pede("PUT", "/save", null, pacote("a", 1))).status, 401);
});

test("sem save ainda: 404 no /save e no /save/meta", async () => {
  const { pede } = servidor();
  assert.equal((await pede("GET", "/save", "ana")).status, 404);
  assert.equal((await pede("GET", "/save/meta", "ana")).status, 404);
});

test("PUT grava; GET devolve dados, dia e atualizadoEm; meta não manda os dados", async () => {
  const { pede, prisma } = servidor();
  relogio += 60_000;
  const r = await pede("PUT", "/save", "ana", pacote("dia 5 da ana", 5));
  assert.equal(r.status, 200); assert.equal(r.corpo.ok, true);
  assert.equal(new Date(r.corpo.atualizadoEm).getTime(), relogio);
  const l = prisma.jocelinoSave.linhas[0];
  assert.equal(l.dia, 5); assert.equal(l.tamanho, b64("dia 5 da ana").length); assert.equal(l.nivel, undefined);
  const g = await pede("GET", "/save", "ana");
  assert.equal(g.status, 200);
  assert.deepEqual(Object.keys(g.corpo).sort(), ["atualizadoEm", "dados", "dia"]);
  assert.equal(txt(g.corpo.dados), "dia 5 da ana");
  assert.equal(g.corpo.dia, 5);
  const m = await pede("GET", "/save/meta", "ana");
  assert.deepEqual(Object.keys(m.corpo).sort(), ["atualizadoEm", "dia"]);
  assert.equal(m.corpo.dia, 5);
});

test("cada conta vê só o próprio save", async () => {
  const { pede } = servidor();
  relogio += 60_000;
  await pede("PUT", "/save", "ana", pacote("da ana", 2));
  await pede("PUT", "/save", "bia", pacote("da bia", 9));
  assert.equal(txt((await pede("GET", "/save", "ana")).corpo.dados), "da ana");
  assert.equal((await pede("GET", "/save/meta", "bia")).corpo.dia, 9);
  assert.equal((await pede("GET", "/save", "caio")).status, 404);
});

test("mesmos limites do Lenda: 10 s entre envios, 'fechando' passa com 1,5 s, 409 para envio velho", async () => {
  const { pede } = servidor();
  relogio += 60_000;
  const t0 = relogio;
  assert.equal((await pede("PUT", "/save", "ana", pacote("um", 1, { salvoEm: t0 }))).status, 200);
  relogio += 2_000;
  const rapido = await pede("PUT", "/save", "ana", pacote("dois", 2, { salvoEm: t0 + 2_000 }));
  assert.equal(rapido.status, 429);
  assert.ok(FECHANDO_INTERVALO_MS <= 2_000);
  assert.equal((await pede("PUT", "/save", "ana", pacote("dois", 2, { salvoEm: t0 + 2_000, fechando: true }))).status, 200);
  relogio += SAVE_INTERVALO_MS + 1;
  const velho = await pede("PUT", "/save", "ana", pacote("velho", 1, { salvoEm: t0 + 1_000 }));
  assert.equal(velho.status, 409); assert.equal(velho.corpo.velho, true);
  assert.equal(txt((await pede("GET", "/save", "ana")).corpo.dados), "dois");
  // outra sessão (outro computador) não é comparada pela hora
  assert.equal((await pede("PUT", "/save", "ana", pacote("outro pc", 3, { salvoEm: 5, sessao: "outroPC1" }))).status, 200);
});

test("corpo inválido: 400 com a mensagem do validador, nada gravado", async () => {
  const { pede, prisma } = servidor();
  assert.equal((await pede("PUT", "/save", "ana", { dados: b64("x"), dia: 0 })).corpo.error, "Dia inválido.");
  assert.equal((await pede("PUT", "/save", "ana", { dados: "A".repeat(90_001), dia: 1 })).status, 400);
  assert.equal(prisma.jocelinoSave.linhas.length, 0);
});

test("tabela ainda não criada (antes do db push) ou banco fora: 503, nunca 500", async () => {
  const { pede, prisma } = servidor();
  prisma.jocelinoSave.falha = Object.assign(new Error("The table `public.JocelinoSave` does not exist"), { code: "P2021" });
  const g = await pede("GET", "/save/meta", "ana");
  assert.equal(g.status, 503); assert.match(g.corpo.error, /ainda não está ligado/);
  assert.equal((await pede("GET", "/save", "ana")).status, 503);
  relogio += 60_000;
  assert.equal((await pede("PUT", "/save", "ana", pacote("x", 1))).status, 503);
  prisma.jocelinoSave.falha = new Error("conexão caiu");
  const p = await pede("GET", "/save", "ana");
  assert.equal(p.status, 503); assert.match(p.corpo.error, /volta em instantes/);
});
