import { test } from "node:test";
import assert from "node:assert/strict";
import { escolherSalaParaGrupo } from "../../src/fila/escolherSala.js";

const sala = (roomId, onlineCount, extra = {}) => ({ roomId, onlineCount, maxPlayers: 15, pontua: true, ...extra });

test("fila: grupo vai pra sala pública mais vazia que comporta todos", () => {
  assert.equal(escolherSalaParaGrupo([sala("s1", 6), sala("s2", 2)], 3), "s2");
  // Empate: fica a primeira (a principal do jogo).
  assert.equal(escolherSalaParaGrupo([sala("s1", 0), sala("s2", 0)], 3), "s1");
});

test("fila: pula sala sem lugar pro grupo inteiro e sala que não pontua", () => {
  assert.equal(escolherSalaParaGrupo([sala("s1", 13), sala("s2", 10)], 4), "s2");
  assert.equal(escolherSalaParaGrupo([sala("priv", 0, { pontua: false }), sala("s1", 5)], 3), "s1");
  assert.equal(escolherSalaParaGrupo([sala("s1", 14), sala("s2", 13)], 3), null);
});
