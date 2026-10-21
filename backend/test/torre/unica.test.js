// Torre Infinita — ranking da torre única (modo principal): quem chegou mais alto numa torre. Banco em memória e relógio controlado.
// A ficha é pedida no começo de cada torre e pode ser usada várias vezes enquanto a torre cresce (vale a maior altura);
// uma ficha mais velha que a última aceita (de uma torre anterior) é recusada.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
const { criaRotasTorre, bancoMemoria, TORRE } = await import("../../src/routes/torre.js");

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
  const ficha = async (jogador) => { const f = (await (await req("POST", "/unica/partida", { jogador })).json()).ficha; relogio.t += 1000; return f; };
  const envia = (ficha, jogador, apelido, alt, seg) => req("POST", "/unica/ranking", { ficha, jogador, apelido, alt, seg });
  return { req, ficha, envia, relogio };
}
after(() => { for (const s of servidores) s.close(); });
const J = (n) => `jogador-${n}-0000-bbbb`;
const lista = async (req, j) => (await req("GET", `/unica/ranking${j ? "?jogador=" + j : ""}`)).json();

test("torre única: entra no ranking, a mesma ficha atualiza para cima e nunca baixa", async () => {
  const { ficha, envia, relogio, req } = await servidor();
  const f = await ficha(J(1));
  relogio.t += 600_000;
  let r = await envia(f, J(1), "Ana", 2000, 600);
  assert.equal(r.status, 200); assert.equal((await r.json()).posicao, 1);
  relogio.t += 600_000;
  assert.equal((await envia(f, J(1), "Ana", 5000, 1200)).status, 200);
  relogio.t += 60_000;
  assert.equal((await envia(f, J(1), "Ana", 3000, 1260)).status, 200); // altura menor não baixa o recorde
  const l = await lista(req, J(1));
  assert.deepEqual(l.top, [{ apelido: "Ana", valor: 5000 }]);
  assert.deepEqual(l.eu, { posicao: 1, valor: 5000 });
  assert.equal(l.corte, 0, "com menos de 20 no ranking, qualquer altura entra");
});

test("torre única: ficha de uma torre anterior é recusada depois de usar a da torre nova", async () => {
  const { ficha, envia, relogio } = await servidor();
  const f1 = await ficha(J(2)); relogio.t += 100_000;
  const f2 = await ficha(J(2)); relogio.t += 100_000;
  assert.equal((await envia(f2, J(2), "Bia", 1000, 90)).status, 200);
  assert.equal((await envia(f1, J(2), "Bia", 9000, 190)).status, 409);
});

test("torre única: tempo e altura conferidos; apelido filtrado", async () => {
  const { ficha, envia, relogio } = await servidor();
  const f = await ficha(J(3)); relogio.t += 100_000;
  assert.equal((await envia(f, J(3), "Caio", 1000, 500)).status, 400, "tempo de jogo maior que o tempo real");
  assert.equal((await envia(f, J(3), "Caio", TORRE.altPorSegundo * 100 + TORRE.altMinTeto, 100)).status, 400, "alto demais para o tempo");
  const r = await envia(f, J(3), "x", 1000, 90);
  assert.equal(r.status, 400); assert.equal((await r.json()).erro, "nome");
});

test("torre única: top 20 em ordem; corte = altura do 20º; sair apaga", async () => {
  const { ficha, envia, relogio, req } = await servidor();
  for (let i = 1; i <= 22; i++) { const f = await ficha(J(100 + i)); relogio.t += 100_000; assert.equal((await envia(f, J(100 + i), `Jog${i}`, i * 100, 90)).status, 200); }
  const l = await lista(req, J(101));
  assert.equal(l.top.length, 20); assert.equal(l.top[0].valor, 2200); assert.equal(l.total, 22);
  assert.equal(l.corte, 300, "o 20º tem 300 m"); assert.deepEqual(l.eu, { posicao: 22, valor: 100 });
  assert.equal((await req("DELETE", "/unica/ranking", { jogador: J(122) })).status, 200);
  assert.equal((await lista(req)).total, 21);
});

test("torre única: lista 'Mais rápido até a Órbita' (menor tempo de jogo; só acima do mínimo e com a torre na Órbita)", async () => {
  const { ficha, envia, relogio, req } = await servidor();
  const manda = (f, j, ap, alt, seg, orbita) => req("POST", "/unica/ranking", { ficha: f, jogador: j, apelido: ap, alt, seg, orbita });
  const f1 = await ficha(J(201)); relogio.t += 1000 * 1000;
  assert.equal((await manda(f1, J(201), "Rapido", 420000, 900, TORRE.orbitaMinUnica + 100)).status, 200);
  const f2 = await ficha(J(202)); relogio.t += 1000 * 1000;
  assert.equal((await manda(f2, J(202), "Lento", 410000, 900, TORRE.orbitaMinUnica + 5000)).status, 200);
  const f3 = await ficha(J(203)); relogio.t += 1000 * 1000;
  assert.equal((await manda(f3, J(203), "Trapaca", 410000, 900, 60)).status, 400, "tempo até a Órbita abaixo do mínimo");
  const f4 = await ficha(J(204)); relogio.t += 1000 * 1000;
  assert.equal((await manda(f4, J(204), "Baixo", 5000, 900, TORRE.orbitaMinUnica + 10)).status, 200, "envio vale, mas sem Órbita");
  const l = await (await req("GET", `/unica/ranking?lista=orbita&jogador=${J(202)}`)).json();
  assert.deepEqual(l.top.map((x) => x.apelido), ["Rapido", "Lento"]);
  assert.deepEqual(l.eu, { posicao: 2, valor: TORRE.orbitaMinUnica + 5000 });
  const a = await (await req("GET", "/unica/ranking?lista=altura")).json();
  assert.equal(a.top[0].apelido, "Rapido");
});
