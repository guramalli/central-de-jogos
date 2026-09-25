import { test } from "node:test";
import assert from "node:assert/strict";
import { validarSave, validarCasa, escolherCasas, LIMITES, validarRanking } from "../../src/lenda/validar.js";

// Nada aqui toca o banco: só as regras do que o jogo pode mandar.

const casaBoa = () => ({
  casaId: "casa_vila_1", mapa: "vila", prestigio: 51,
  moveis: [{ x: 3, y: 3, id: "mv_sofa" }, { x: 6, y: 4, id: "mv_mesa" }],
  itens: [{ x: 6, y: 4, id: "chuteira_trovao", r: 0 }, { x: 3, y: 6, id: "coroa" }],
  vitrine: [{ id: "chuteira_trovao", r: 0 }, { id: "coroa" }],
});

test("save: aceita base64 dentro do limite", () => {
  const v = validarSave({ dados: "H4sIAAAAAAAAA6tWSs7PS8tMLVKyUkpKLEpVqgUAkXPmqhYAAAA=", nivel: 12 });
  assert.equal(v.ok, true);
});
test("save: recusa vazio, grande, fora do formato e nível errado", () => {
  assert.ok(validarSave({ dados: "", nivel: 1 }).erro);
  assert.ok(validarSave({ dados: "A".repeat(LIMITES.saveMaxChars + 4), nivel: 1 }).erro);
  assert.ok(validarSave({ dados: "<script>", nivel: 1 }).erro);
  assert.ok(validarSave({ dados: "QUJD", nivel: 0 }).erro);
  assert.ok(validarSave({ dados: "QUJD", nivel: 1.5 }).erro);
  assert.ok(validarSave(null).erro);
});

test("casa: aceita uma casa normal e limpa campos extras", () => {
  const b = casaBoa(); b.moveis[0].extra = "x"; b.hack = true;
  const v = validarCasa(b);
  assert.equal(v.ok, true);
  assert.deepEqual(v.casa.moveis[0], { x: 3, y: 3, id: "mv_sofa" });
  assert.equal(v.casa.itens[1].r, 0); // refino ausente vira 0
  assert.equal("hack" in v.casa, false);
});
test("casa: id e lugar precisam combinar", () => {
  assert.ok(validarCasa({ ...casaBoa(), casaId: "casa_cidade_1" }).erro);
  assert.ok(validarCasa({ ...casaBoa(), casaId: "../../etc" }).erro);
  assert.ok(validarCasa({ ...casaBoa(), mapa: "VILA" }).erro);
});
test("casa: recusa móveis/itens inválidos, repetidos ou demais", () => {
  const b = casaBoa();
  assert.ok(validarCasa({ ...b, moveis: [{ x: 1, y: 1, id: "sofa" }] }).erro);            // sem prefixo mv_
  assert.ok(validarCasa({ ...b, moveis: [{ x: 1, y: 1, id: "mv_sofa" }, { x: 1, y: 1, id: "mv_tv" }] }).erro);
  assert.ok(validarCasa({ ...b, itens: [{ x: 99, y: 1, id: "coroa" }] }).erro);          // fora da casa
  assert.ok(validarCasa({ ...b, itens: [{ x: 1, y: 1, id: "coroa", r: 11 }] }).erro);    // refino acima de +10
  assert.ok(validarCasa({ ...b, itens: [{ x: 1, y: 1, id: "<b>oi</b>" }] }).erro);
  assert.ok(validarCasa({ ...b, moveis: Array.from({ length: LIMITES.moveisMax + 1 }, (_, i) => ({ x: i % 40, y: Math.floor(i / 40), id: "mv_vaso" })) }).erro);
  assert.ok(validarCasa({ ...b, vitrine: [{ id: "a1" }, { id: "a2" }, { id: "a3" }, { id: "a4" }] }).erro);
  assert.ok(validarCasa({ ...b, prestigio: -1 }).erro);
  assert.ok(validarCasa({ ...b, prestigio: LIMITES.prestigioMax + 1 }).erro);
});

test("escolherCasas: tira a própria pessoa, põe as mais prestigiadas primeiro e respeita o limite", () => {
  const lista = [
    { userId: "a", prestigio: 5 }, { userId: "b", prestigio: 90 }, { userId: "eu", prestigio: 500 },
    { userId: "c", prestigio: 40 }, { userId: "d", prestigio: 1 }, { userId: "e", prestigio: 12 },
  ];
  const r = escolherCasas(lista, { excluir: "eu", limite: 4, topo: 2, sortear: () => 0 });
  assert.equal(r.length, 4);
  assert.deepEqual(r.slice(0, 2).map((c) => c.userId), ["b", "c"]);
  assert.equal(r.some((c) => c.userId === "eu"), false);
  assert.equal(new Set(r.map((c) => c.userId)).size, 4);
  assert.deepEqual(escolherCasas([], { limite: 3 }), []);
});

test("ranking: aceita o resumo do progresso e limpa o nome do time", () => {
  const v = validarRanking({ nivel: 27, xp: 15400, posicao: "atacante", fase: "Sub-20", time: { nome: " <b>Campinho</b> FC ", div: 3, titulos: 1 }, chefes: 4, figs: 30 });
  assert.equal(v.ok, true);
  assert.equal(v.ranking.time.nome, "bCampinho/b FC");
  assert.equal(v.ranking.nivel, 27);
});

test("ranking: recusa números absurdos, fase inventada e posição estranha", () => {
  assert.ok(!validarRanking({ nivel: 0, xp: 10, fase: "Criança" }).ok);
  assert.ok(!validarRanking({ nivel: 5, xp: -1, fase: "Criança" }).ok);
  assert.ok(!validarRanking({ nivel: 5, xp: 1.5, fase: "Criança" }).ok);
  assert.ok(!validarRanking({ nivel: 5, xp: 10, fase: "Deus" }).ok);
  assert.ok(!validarRanking({ nivel: 5, xp: 10, fase: "Criança", posicao: "<script>" }).ok);
  assert.ok(!validarRanking({ nivel: 5, xp: 10, fase: "Criança", time: { nome: "", div: 1 } }).ok);
  assert.ok(validarRanking({ nivel: 5, xp: 10, fase: "Criança" }).ok);
});
