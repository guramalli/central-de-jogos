// A versão Steam (lenda-steam/ferramentas/monta_steam.mjs) não aceita nada
// vindo da internet no index.html, além das fontes e da marca que ela troca
// por arquivos locais. Mesma regra aqui, pra pegar o problema antes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { le } from "./util.js";

test("index.html do jogo passa na checagem da versão Steam", () => {
  const h = le("public/lenda-do-campinho/index.html")
    .replace(/<link rel="preconnect" href="https:\/\/fonts\.(googleapis|gstatic)\.com"[^>]*>\s*/g, "")
    .replace(/<link href="https:\/\/fonts\.googleapis\.com\/css2[^"]*" rel="stylesheet">/, '<link href="fontes/fontes.css" rel="stylesheet">')
    .replace(/https:\/\/www\.educacaogamer\.com\.br\/favicon\.png/g, "marca/favicon.png")
    .replace(/https:\/\/www\.educacaogamer\.com\.br\/educacao-gamer-logo\.png/g, "marca/educacao-gamer-logo.png");
  assert.doesNotMatch(h, /fonts\.googleapis|fonts\.gstatic|educacaogamer\.com\.br\/[^"]*\.(png|jpg|webp|css|js)/);
});

test("marca.css e capa_viva.js não buscam nada da internet", () => {
  for (const f of ["public/lenda-do-campinho/css/marca.css", "public/lenda-do-campinho/js/capa_viva.js"]) {
    assert.doesNotMatch(le(f), /https?:\/\//, `${f} cita um endereço da internet`);
  }
});
