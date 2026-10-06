import { test } from "node:test";
import assert from "node:assert/strict";
import { carrega, le } from "./util.js";

const { TEXTOS } = carrega("public/lenda/js/textos.js");
const { Idioma } = carrega("public/lenda/js/idioma.js");
const html = le("public/lenda/index.html");

const chavesDoHtml = () => {
  const ch = new Set();
  for (const m of html.matchAll(/data-t(?:-html|-alt|-aria)?="([^"]+)"/g)) ch.add(m[1]);
  return ch;
};

test("PT e EN têm exatamente as mesmas chaves, nenhuma vazia", () => {
  const pt = Object.keys(TEXTOS.pt).sort(), en = Object.keys(TEXTOS.en).sort();
  assert.deepEqual(en, pt);
  for (const lang of ["pt", "en"]) for (const [k, v] of Object.entries(TEXTOS[lang])) assert.ok(String(v).trim().length > 0, `${lang}.${k} vazio`);
});

test("toda chave usada no index.html existe no dicionário", () => {
  for (const k of chavesDoHtml()) assert.ok(k in TEXTOS.pt, `falta a chave ${k}`);
});

test("o texto em português do HTML é igual ao do dicionário (data-t simples)", () => {
  for (const m of html.matchAll(/data-t="([^"]+)"[^>]*>([^<]*)</g)) {
    const [, k, txt] = m;
    assert.equal(txt.replace(/\s+/g, " ").trim(), TEXTOS.pt[k], `HTML e dicionário diferentes em ${k}`);
  }
});

test("textos em inglês seguem os termos oficiais", () => {
  const tudo = Object.values(TEXTOS.en).join(" ");
  assert.match(tudo, /Campinho Village/);
  assert.match(tudo, /Sandlot League/);
  assert.match(tudo, /First Division/);
  assert.doesNotMatch(tudo, /Várzea|Primeirona|Vila do Campinho/);
});

test("Idioma.inicial: parâmetro > escolha salva > navegador > português", () => {
  assert.equal(Idioma.inicial({ param: "en", salvo: "pt", navegador: "pt-BR" }), "en");
  assert.equal(Idioma.inicial({ param: null, salvo: "en", navegador: "pt-BR" }), "en");
  assert.equal(Idioma.inicial({ param: "xx", salvo: null, navegador: "en-US" }), "en");
  assert.equal(Idioma.inicial({ param: null, salvo: null, navegador: "es-AR" }), "pt");
  assert.equal(Idioma.inicial({}), "pt");
  assert.equal(Idioma.inicial({ param: "EN" }), "en");
});
