import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { le, RAIZ } from "./util.js";

const html = le("public/lenda-do-campinho/index.html");
const inicioJs = le("public/lenda-do-campinho/js/inicio.js");
const IDS = ["inicio", "inicioMenu", "btnContinuar", "btnNovo", "btnHistoria", "resumoSave", "criacao", "retratoCriacao", "inpNome",
  "opCorpo", "opPele", "opCabelo", "opCorCabelo", "opRoupa", "opBaixo", "opRosto", "opClasse", "btnVoltar", "btnNascer"];

test("contrato: todos os ids da tela inicial e da criação continuam no index.html", () => {
  for (const id of IDS) assert.match(html, new RegExp(`id="${id}"`), `sumiu o #${id}`);
  assert.match(html, /class="inicio-caixa/);
  assert.match(html, /data-abre="ranking"/);
  assert.match(html, /data-abre="ajuda"/);
});

test("contrato: o inicio.js continua organizando os mesmos blocos", () => {
  for (const trecho of ["btnContinuar", "btnNovo", "#contaEscolha", ".cad-cartao, .nuvem-caixa", ".portal-barra", "resumoSave"]) {
    assert.ok(inicioJs.includes(trecho), `o inicio.js não cita mais ${trecho}`);
  }
});

test("a base visual e a capa viva vêm antes da tela inicial", () => {
  const marca = html.indexOf("css/marca.css"), inicioCss = html.indexOf("css/inicio.css");
  const capa = html.indexOf("js/capa_viva.js"), inicioScript = html.indexOf("js/inicio.js");
  assert.ok(marca > 0 && marca < inicioCss, "marca.css tem de vir antes de inicio.css");
  assert.ok(capa > 0 && capa < inicioScript, "capa_viva.js tem de vir antes de inicio.js");
  for (const a of ["a/capa.webp", "a/capa_vertical.webp"]) assert.ok(existsSync(path.join(RAIZ, "public/lenda-do-campinho", a)), `falta ${a}`);
});

test("o link pra vitrine só aparece na web (a versão Steam não tem /lenda/)", () => {
  assert.match(inicioJs, /btnConhecaJogo/);
  assert.match(inicioJs, /naWeb\s*&&/);
});
