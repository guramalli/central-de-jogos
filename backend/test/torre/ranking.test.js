// Torre Infinita — ranking online (routes/torre.js), com banco em memória e relógio controlado.
// O servidor soma ele mesmo as obras recebidas (cada uma com uma ficha de uso único): o jogo não informa totais.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
const { criaRotasTorre, assinarFicha, lerFicha, TORRE, bancoMemoria } = await import("../../src/routes/torre.js");

const servidores = [];
async function servidor() {
  const relogio = { t: 1_800_000_000_000 };
  const db = bancoMemoria();
  const app = express();
  app.use(express.json());
  app.use("/api/torre", criaRotasTorre({ db, segredo: "segredo-de-teste", limite: false, agora: () => relogio.t }));
  const s = app.listen(0); servidores.push(s);
  await new Promise((ok) => s.once("listening", ok));
  const base = `http://127.0.0.1:${s.address().port}/api/torre`;
  const req = (m, c, corpo) => fetch(base + c, { method: m, headers: { "Content-Type": "application/json" }, body: corpo ? JSON.stringify(corpo) : undefined });
  const ficha = async (jogador) => { const f = (await (await req("POST", "/partida", { jogador })).json()).ficha; relogio.t += 1000; return f; };
  // uma obra "de verdade": pega a ficha, passa o tempo e envia
  async function obra(jogador, apelido, { alt = 5000, seg = 1200, passar = seg } = {}) {
    const f = await ficha(jogador);
    relogio.t += passar * 1000;
    return req("POST", "/ranking", { ficha: f, jogador, apelido, obra: { alt, seg } });
  }
  return { req, ficha, obra, db, relogio };
}
after(() => { for (const s of servidores) s.close(); });
const J = (n) => `jogador-${n}-0000-aaaa`;
const pega = async (req, l, j) => (await req("GET", `/ranking?lista=${l}${j ? "&jogador=" + j : ""}`)).json();

test("ficha: só o servidor fabrica, vale para o jogador dela e por até 7 dias", () => {
  const f = assinarFicha("s", 1_800_000_000_000, J(1));
  assert.deepEqual(lerFicha("s", f, J(1)), { inicio: 1_800_000_000_000 });
  assert.equal(lerFicha("s", f, J(2)), null, "de outro jogador");
  assert.equal(lerFicha("outro", f, J(1)), null);
  assert.equal(lerFicha("s", "lixo", J(1)), null);
  assert.equal(TORRE.fichaDias, 7);
});

test("melhor obra e soma das obras: o servidor soma; GET mostra o top e a minha posição", async () => {
  const { obra, req } = await servidor();
  assert.equal((await obra(J(1), "Ana", { alt: 9000 })).status, 200);
  await obra(J(2), "Bia", { alt: 3000 }); await obra(J(2), "Bia", { alt: 4000 }); await obra(J(2), "Bia", { alt: 5000 });
  const r = await obra(J(3), "Caio", { alt: 6000 });
  const j = await r.json();
  assert.equal(j.posicoes.obra, 2); assert.equal(j.posicoes.total, 3);
  const ob = await pega(req, "obra", J(3));
  assert.deepEqual(ob.top.map((x) => x.apelido), ["Ana", "Caio", "Bia"]); assert.equal(ob.eu.posicao, 2);
  const to = await pega(req, "total");
  assert.deepEqual(to.top, [{ apelido: "Bia", valor: 12000 }, { apelido: "Ana", valor: 9000 }, { apelido: "Caio", valor: 6000 }]);
});

test("ficha de uso único: a mesma obra não conta duas vezes", async () => {
  const { ficha, req, relogio } = await servidor();
  const f = await ficha(J(1)); relogio.t += 1200e3;
  const corpo = { ficha: f, jogador: J(1), apelido: "Ana", obra: { alt: 5000, seg: 1200 } };
  assert.equal((await req("POST", "/ranking", corpo)).status, 200);
  assert.equal((await req("POST", "/ranking", corpo)).status, 409);
  assert.equal((await pega(req, "total")).top[0].valor, 5000);
});

test("conferências da obra: rápida demais, altura impossível, ficha de outro jogador", async () => {
  const { obra, req, ficha } = await servidor();
  assert.equal((await obra(J(1), "Ana", { seg: 1200, passar: 300 })).status, 400, "jogou mais rápido que o relógio");
  assert.equal((await obra(J(1), "Ana", { alt: TORRE.altMax + 1 })).status, 400, "acima do teto absoluto");
  assert.equal((await obra(J(1), "Ana", { alt: TORRE.altPorSegundo * 100 + 10, seg: 100, passar: 100 })).status, 400, "acima do teto por segundo");
  const f = await ficha(J(2));
  assert.equal((await req("POST", "/ranking", { ficha: f, jogador: J(3), apelido: "Caio", obra: { alt: 1000, seg: 0 } })).status, 400, "ficha de outro jogador");
});

test("Órbita: conta o tempo somado das obras e só depois do mínimo de jogo", async () => {
  const { obra, req } = await servidor();
  // uma obra de 400 km logo de cara (sem horas de jogo antes) não entra na lista da Órbita
  await obra(J(1), "Rapidinho", { alt: 400_000, seg: 1200 });
  assert.equal((await pega(req, "orbita")).total, 0);
  // quem jogou o mínimo e chega a 400 km entra com o tempo somado das obras
  const n = Math.ceil(TORRE.orbitaMin / 1200);
  for (let i = 0; i < n; i++) await obra(J(2), "Bia", { alt: 50_000, seg: 1200 });
  await obra(J(2), "Bia", { alt: 410_000, seg: 1200 });
  const o = await pega(req, "orbita", J(2));
  assert.equal(o.top[0].apelido, "Bia"); assert.equal(o.top[0].valor, (n + 1) * 1200); assert.equal(o.eu.posicao, 1);
});

test("apelido: 3 a 12 letras, sem palavrão, com o motivo; trocar vale em todas as listas", async () => {
  const { obra, req } = await servidor();
  const r = await obra(J(1), "p0rr4");
  assert.equal(r.status, 400); const j = await r.json(); assert.equal(j.erro, "nome"); assert.ok(j.error.length > 10);
  assert.equal((await obra(J(1), "ab")).status, 400);
  assert.equal((await obra(J(1), "Gustavo")).status, 200);
  await obra(J(1), "Guga");
  assert.equal((await pega(req, "total")).top[0].apelido, "Guga");
});

test("sair do ranking apaga o jogador", async () => {
  const { obra, req } = await servidor();
  await obra(J(1), "Ana"); await obra(J(2), "Bia");
  assert.equal((await req("DELETE", "/ranking", { jogador: J(1) })).status, 200);
  assert.deepEqual((await pega(req, "obra")).top.map((x) => x.apelido), ["Bia"]);
});
