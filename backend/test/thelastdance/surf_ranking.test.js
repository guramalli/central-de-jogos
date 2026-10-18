// The Last Dance — ranking do surf (routes/thelastdanceSurf.js), com um banco em memória no lugar do Postgres.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
const { criaRotasTheLastDance } = await import("../../src/routes/thelastdance.js");
const { limparNome, assinarPartida, lerPartida, SURF } = await import("../../src/routes/thelastdanceSurf.js");

function bancoMemoria() {
  const linhas = [];
  return {
    linhas,
    async inserir({ nome, pontos, partida, ip }) {
      if (linhas.some((l) => l.partida === partida)) return null;
      const id = linhas.length + 1;
      linhas.push({ id, nome, pontos, partida, ip });
      return id;
    },
    async top(n) { return [...linhas].sort((a, b) => b.pontos - a.pontos || a.id - b.id).slice(0, n); },
    async total() { return linhas.length; },
    async naFrente(pontos, id) { return linhas.filter((l) => l.pontos > pontos || (id != null && l.pontos === pontos && l.id < id)).length; },
  };
}

const servidores = [];
async function servidor({ segredo = "segredo-de-teste" } = {}) {
  const relogio = { t: 1_800_000_000_000 };
  const db = bancoMemoria();
  const app = express();
  app.use(express.json());
  app.use("/api/thelastdance", criaRotasTheLastDance({ env: { JWT_SECRET: segredo }, limite: false, surfDb: db, agora: () => relogio.t }));
  const s = app.listen(0);
  servidores.push(s);
  await new Promise((ok) => s.once("listening", ok));
  const base = `http://127.0.0.1:${s.address().port}/api/thelastdance/surf`;
  const post = (c, corpo) => fetch(base + c, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo || {}) });
  const get = (c) => fetch(base + c);
  // joga uma partida "de verdade": pega a ficha, passa o tempo das 3 ondas e grava
  async function jogar(nome, pontos, segundos = 110) {
    const { partida } = await (await post("/partida")).json();
    relogio.t += segundos * 1000;
    return post("/ranking", { partida, nome, pontos });
  }
  return { post, get, jogar, db, relogio };
}
after(() => { for (const s of servidores) s.close(); });

test("nome: até 10 letras, sem símbolo estranho e sem palavrão", () => {
  assert.equal(limparNome("  Gustavo  "), "Gustavo");
  assert.equal(limparNome("João Zé"), "João Zé");
  assert.equal(limparNome("Brabo_99"), "Brabo_99");
  assert.equal(limparNome("Carolaine"), "Carolaine");
  assert.equal(limparNome("12345678901"), null); // 11
  assert.equal(limparNome(""), null);
  assert.equal(limparNome("<script>"), null);
  assert.equal(limparNome("p0rr4"), null);
  assert.equal(limparNome("P.O.R.R.A"), null);
  assert.equal(limparNome(42), null);
});

test("partida assinada: só o servidor fabrica; mexer no horário invalida", () => {
  const p = assinarPartida("s", 1_800_000_000_000);
  assert.deepEqual(lerPartida("s", p), { inicio: 1_800_000_000_000 });
  assert.equal(lerPartida("outro", p), null);
  const [, a, sig] = p.split(".");
  assert.equal(lerPartida("s", `1700000000000.${a}.${sig}`), null);
  assert.equal(lerPartida("s", "lixo"), null);
});

test("grava, devolve a posição e o top 10 com a pessoa marcada", async () => {
  const { jogar, get } = await servidor();
  for (const [n, p] of [["Ana", 30000], ["Bia", 12000], ["Caio", 45000]]) assert.equal((await jogar(n, p)).status, 200);
  const r = await jogar("Gustavinho", 20000);
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.posicao, 3);
  assert.equal(j.total, 4);
  assert.deepEqual(j.top.map((x) => x.nome), ["Caio", "Ana", "Gustavinho", "Bia"]);
  assert.equal(j.top.find((x) => x.eu).nome, "Gustavinho");
  const g = await (await get("/ranking?pontos=25000")).json();
  assert.equal(g.total, 4);
  assert.equal(g.posicao, 3);           // ficaria em 3º
  assert.equal(g.top[0].nome, "Caio");
  assert.equal(g.top[0].eu, undefined); // o GET não marca ninguém
});

test("empate: quem gravou antes fica na frente", async () => {
  const { jogar } = await servidor();
  await jogar("Primeiro", 10000);
  const j = await (await jogar("Segundo", 10000)).json();
  assert.equal(j.posicao, 2);
});

test("anti-trapaça: partida rápida demais, pontos demais, ficha falsa ou repetida", async () => {
  const { post, jogar, relogio } = await servidor();
  assert.equal((await jogar("Rapido", 1000, 20)).status, 400);                     // não deu tempo das 3 ondas
  assert.equal((await jogar("Muito", SURF.pontosPorSegundo * 200, 110)).status, 400); // mais pontos que o possível
  assert.equal((await jogar("Fracao", 10.5)).status, 400);
  assert.equal((await post("/ranking", { partida: "1800000000000.abc.def", nome: "Falso", pontos: 100 })).status, 400);
  const { partida } = await (await post("/partida")).json();
  relogio.t += 110_000;
  assert.equal((await post("/ranking", { partida, nome: "Uma", pontos: 5000 })).status, 200);
  assert.equal((await post("/ranking", { partida, nome: "Duas", pontos: 9000 })).status, 409);
  assert.equal((await post("/ranking", { partida, nome: "porra", pontos: 9000 })).status, 400);
});

test("sem JWT_SECRET no servidor: 503 (não grava nada)", async () => {
  const { post, db } = await servidor({ segredo: "" });
  assert.equal((await post("/partida")).status, 503);
  assert.equal(db.linhas.length, 0);
});
