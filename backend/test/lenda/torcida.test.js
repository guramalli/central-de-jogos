import { test } from "node:test";
import assert from "node:assert/strict";
import { validarTorcida, amigosDe, podeTorcer, TORCIDAS, INTERVALO_MS } from "../../src/lenda/torcida.js";

const banco = (amizades, ultima = null) => ({
  friendship: { findMany: async ({ where }) => amizades.filter((f) => f.status === where.status && (f.userAId === where.OR[0].userAId || f.userBId === where.OR[1].userBId)) },
  lendaTorcida: { findFirst: async () => ultima },
});

test("só frases prontas", () => {
  assert.equal(validarTorcida({ para: "u2", tipo: "mandou" }).ok, true);
  assert.equal(validarTorcida({ para: "u2", tipo: "qualquer texto" }).ok, false);
  assert.equal(validarTorcida({ para: "", tipo: "bora" }).ok, false);
  assert.ok(Object.values(TORCIDAS).every((t) => t.length < 40));
});

test("amigos aceitos nos dois sentidos", async () => {
  const p = banco([{ userAId: "eu", userBId: "a", status: "accepted" }, { userAId: "b", userBId: "eu", status: "accepted" }, { userAId: "eu", userBId: "c", status: "pending" }]);
  assert.deepEqual((await amigosDe(p, "eu")).sort(), ["a", "b"]);
});

test("só para amigo, não para si, 1 por dia", async () => {
  const p = banco([{ userAId: "eu", userBId: "a", status: "accepted" }]);
  assert.equal((await podeTorcer(p, "eu", "eu")).ok, false);
  assert.equal((await podeTorcer(p, "eu", "x")).ok, false);
  assert.equal((await podeTorcer(p, "eu", "a")).ok, true);
  const agora = Date.now();
  const p2 = banco([{ userAId: "eu", userBId: "a", status: "accepted" }], { criadoEm: new Date(agora - 3600e3) });
  const r = await podeTorcer(p2, "eu", "a", agora);
  assert.equal(r.ok, false); assert.equal(r.cedo, true);
  const p3 = banco([{ userAId: "eu", userBId: "a", status: "accepted" }], { criadoEm: new Date(agora - INTERVALO_MS - 1) });
  assert.equal((await podeTorcer(p3, "eu", "a", agora)).ok, true);
});
