import { test } from "node:test";
import assert from "node:assert/strict";
import { carrega } from "./util.js";

const { CapaViva } = carrega("public/lenda-do-campinho/js/capa_viva.js");

test("fatorTempo: 60 Hz = 1 passo; proporcional; nunca negativo; no máximo 3", () => {
  assert.equal(CapaViva.fatorTempo(1000 / 60), 1);
  assert.ok(Math.abs(CapaViva.fatorTempo(1000 / 120) - 0.5) < 1e-9);
  assert.equal(CapaViva.fatorTempo(0), 0);
  assert.equal(CapaViva.fatorTempo(-5), 0);
  assert.equal(CapaViva.fatorTempo(NaN), 0);
  assert.equal(CapaViva.fatorTempo(5000), 3);
});

test("deveAnimar: só visível, com a aba aberta e sem reduzir movimento", () => {
  assert.equal(CapaViva.deveAnimar({ visivel: true, abaOculta: false, reduzMovimento: false }), true);
  assert.equal(CapaViva.deveAnimar({ visivel: false, abaOculta: false, reduzMovimento: false }), false);
  assert.equal(CapaViva.deveAnimar({ visivel: true, abaOculta: true, reduzMovimento: false }), false);
  assert.equal(CapaViva.deveAnimar({ visivel: true, abaOculta: false, reduzMovimento: true }), false);
  assert.equal(CapaViva.deveAnimar(undefined), false);
});

test("usaVertical: arte em pé quando largura/altura ≤ 0,8 e existe a vertical", () => {
  assert.equal(CapaViva.usaVertical(390, 844, true), true);
  assert.equal(CapaViva.usaVertical(800, 1000, true), true);
  assert.equal(CapaViva.usaVertical(1440, 900, true), false);
  assert.equal(CapaViva.usaVertical(390, 844, false), false);
  assert.equal(CapaViva.usaVertical(390, 0, true), false);
});
