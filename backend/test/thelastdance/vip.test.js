// The Last Dance — área dos amigos: POST /vip entrega a chave só com a senha certa (routes/thelastdance.js).
import { test, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
const { criaRotasTheLastDance, senhaConfere } = await import("../../src/routes/thelastdance.js");

const CHAVE = "a".repeat(64);
const servidores = [];
async function servidor(env, limite = false) {
  const app = express();
  app.use(express.json());
  app.use("/api/thelastdance", criaRotasTheLastDance({ env, limite }));
  const s = app.listen(0);
  servidores.push(s);
  await new Promise((ok) => s.once("listening", ok));
  const url = `http://127.0.0.1:${s.address().port}/api/thelastdance/vip`;
  return (corpo) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
}
after(() => { for (const s of servidores) s.close(); });

test("senha certa devolve a chave (sem diferenciar maiúsculas e espaços nas pontas)", async () => {
  const post = await servidor({ TLD_SENHA: "Churrasco do Brabo", TLD_CHAVE: CHAVE });
  const r = await post({ senha: "  churrasco do brabo " });
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { chave: CHAVE });
  assert.equal(r.headers.get("cache-control"), "no-store");
});

test("senha errada: 401 e nada de chave", async () => {
  const post = await servidor({ TLD_SENHA: "certa", TLD_CHAVE: CHAVE });
  const r = await post({ senha: "errada" });
  assert.equal(r.status, 401);
  assert.equal((await r.json()).chave, undefined);
});

test("sem senha ou senha enorme: 400", async () => {
  const post = await servidor({ TLD_SENHA: "certa", TLD_CHAVE: CHAVE });
  assert.equal((await post({})).status, 400);
  assert.equal((await post({ senha: 123 })).status, 400);
  assert.equal((await post({ senha: "x".repeat(201) })).status, 400);
});

test("servidor sem TLD_SENHA ou com chave inválida: 503", async () => {
  assert.equal((await (await servidor({ TLD_CHAVE: CHAVE }))({ senha: "x" })).status, 503);
  assert.equal((await (await servidor({ TLD_SENHA: "x", TLD_CHAVE: "curta" }))({ senha: "x" })).status, 503);
});

test("tentativas demais do mesmo IP: 429", async () => {
  const post = await servidor({ TLD_SENHA: "certa", TLD_CHAVE: CHAVE }, true);
  let ultimo = 0;
  for (let i = 0; i < 9; i++) ultimo = (await post({ senha: "chute" + i })).status;
  assert.equal(ultimo, 429);
});

test("senhaConfere", () => {
  assert.equal(senhaConfere("Abc", "abc"), true);
  assert.equal(senhaConfere("abd", "abc"), false);
  assert.equal(senhaConfere(undefined, "abc"), false);
  assert.equal(senhaConfere("abc", ""), false);
});
