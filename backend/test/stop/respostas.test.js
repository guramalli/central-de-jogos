import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizarRespostas, sanitizarComportamento, MAX_RESPOSTA } from "../../src/game/stopRespostas.js";

const TEMAS = [{ key: "animal", id: 1 }, { key: "fruta", id: 2 }, { key: "cor", id: 3 }];

test("respostas: só aceita objeto comum", () => {
  for (const ruim of [null, undefined, "abc", 42, true, ["a", "b"], () => {}]) {
    assert.deepEqual(sanitizarRespostas(ruim, TEMAS), {});
  }
});

test("respostas: mantém só os temas da rodada, apara e corta no limite", () => {
  const r = sanitizarRespostas(
    { animal: "  Abelha ", fruta: "a".repeat(500), extra: "x", outroTema: "y" },
    TEMAS
  );
  assert.deepEqual(Object.keys(r).sort(), ["animal", "fruta"]);
  assert.equal(r.animal, "Abelha");
  assert.equal(r.fruta.length, MAX_RESPOSTA);
});

test("respostas: número vira texto; objeto, array e null são ignorados", () => {
  const r = sanitizarRespostas({ animal: 7, fruta: { a: 1 }, cor: ["azul"] }, TEMAS);
  assert.deepEqual(r, { animal: "7" });
  assert.deepEqual(sanitizarRespostas({ animal: null, fruta: undefined }, TEMAS), {});
});

test("respostas: não pega chave herdada nem __proto__", () => {
  const temas = [{ key: "constructor" }, { key: "__proto__" }, { key: "toString" }];
  assert.deepEqual(sanitizarRespostas({}, temas), {});
  const malicioso = JSON.parse('{"__proto__": {"animal": "Abelha"}}');
  assert.deepEqual(sanitizarRespostas(malicioso, TEMAS), {});
});

test("comportamento: só objeto, reduzido a booleanos", () => {
  assert.equal(sanitizarComportamento(null), null);
  assert.equal(sanitizarComportamento("pasted"), null);
  assert.equal(sanitizarComportamento([true]), null);
  assert.deepEqual(sanitizarComportamento({ pasted: true, lixo: 1 }), { pasted: true, corrected: false });
});
