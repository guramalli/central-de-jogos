import { test } from "node:test";
import assert from "node:assert/strict";
import { carrega } from "./util.js";

const { Vitrine } = carrega("public/lenda/js/vitrine.js");

test("progressoJornada: 0 antes, 1 depois, proporcional no meio", () => {
  assert.equal(Vitrine.progressoJornada(100, 5000, 1000), 0);   // seção ainda abaixo
  assert.equal(Vitrine.progressoJornada(0, 5000, 1000), 0);
  assert.equal(Vitrine.progressoJornada(-2000, 5000, 1000), 0.5);
  assert.equal(Vitrine.progressoJornada(-4000, 5000, 1000), 1);
  assert.equal(Vitrine.progressoJornada(-9000, 5000, 1000), 1);  // já passou
});

test("progressoJornada: seção menor que a tela não divide por zero", () => {
  assert.equal(Vitrine.progressoJornada(-50, 800, 1000), 0);
  assert.equal(Vitrine.progressoJornada(-50, 1000, 1000), 0);
});

test("etapaAtiva: arredonda pra etapa mais próxima e fica nos limites", () => {
  assert.equal(Vitrine.etapaAtiva(0, 6), 0);
  assert.equal(Vitrine.etapaAtiva(1, 6), 5);
  assert.equal(Vitrine.etapaAtiva(0.5, 6), 3);
  assert.equal(Vitrine.etapaAtiva(0.09, 6), 0);
  assert.equal(Vitrine.etapaAtiva(0.11, 6), 1);
  assert.equal(Vitrine.etapaAtiva(2, 6), 5);
  assert.equal(Vitrine.etapaAtiva(0.5, 0), 0);
});

test("proximoIndice: dá a volta nas duas pontas", () => {
  assert.equal(Vitrine.proximoIndice(7, 1, 8), 0);
  assert.equal(Vitrine.proximoIndice(0, -1, 8), 7);
  assert.equal(Vitrine.proximoIndice(3, 0, 8), 3);
  assert.equal(Vitrine.proximoIndice(2, -11, 8), 7);
  assert.equal(Vitrine.proximoIndice(0, 1, 0), 0);
});
