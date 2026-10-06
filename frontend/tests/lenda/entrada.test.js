import { test } from "node:test";
import assert from "node:assert/strict";
import { carrega } from "./util.js";

// Roda o próprio vitrine_entrada.js num "navegador de mentira" e devolve pra
// onde ele mandou (ou null) e o que ficou guardado.
function roda({ protocol = "https:", hostname = "www.educacaogamer.com.br", search = "", guardado = {}, armazenamentoQuebrado = false } = {}) {
  const dados = { ...guardado };
  const ls = {
    getItem: (k) => (k in dados ? dados[k] : null),
    setItem: (k, v) => { dados[k] = String(v); },
    key: (i) => Object.keys(dados)[i] ?? null,
    get length() { return Object.keys(dados).length; },
  };
  let destino = null;
  const location = { protocol, hostname, search, replace: (u) => { destino = u; } };
  const window = { location };
  Object.defineProperty(window, "localStorage", { get() { if (armazenamentoQuebrado) throw new Error("bloqueado"); return ls; } });
  carrega("public/lenda-do-campinho/js/vitrine_entrada.js", { window });
  return { destino, dados };
}

test("quem chega pela primeira vez vai pra vitrine", () => {
  for (const hostname of ["www.educacaogamer.com.br", "educacaogamer.com.br", "localhost", "127.0.0.1"]) {
    assert.equal(roda({ hostname }).destino, "/lenda/", hostname);
  }
  assert.equal(roda({ protocol: "http:", hostname: "localhost" }).destino, "/lenda/");
});

test("quem já tem jogador salvo entra direto no jogo", () => {
  assert.equal(roda({ guardado: { rac_save_v2: "{}" } }).destino, null);
  assert.equal(roda({ guardado: { rac_save_v1: "{}" } }).destino, null);
  assert.equal(roda({ guardado: { rac_save_conta_abc123: "{}" } }).destino, null);
});

test("quem está logado no site ou já viu a vitrine entra direto", () => {
  assert.equal(roda({ guardado: { eg_token: "x" } }).destino, null);
  assert.equal(roda({ guardado: { lenda_vitrine_vista: "1" } }).destino, null);
});

test("?jogar (vindo da vitrine) não redireciona e marca a vitrine como vista", () => {
  const r = roda({ search: "?jogar=1" });
  assert.equal(r.destino, null);
  assert.equal(r.dados.lenda_vitrine_vista, "1");
  assert.equal(roda({ search: "?a=1&jogar" }).dados.lenda_vitrine_vista, "1");
});

test("qualquer outro parâmetro (links de dentro do site) não redireciona", () => {
  const r = roda({ search: "?volta=1" });
  assert.equal(r.destino, null);
  assert.equal(r.dados.lenda_vitrine_vista, undefined);
});

test("versão Steam / outros endereços nunca redirecionam", () => {
  assert.equal(roda({ protocol: "file:", hostname: "" }).destino, null);
  assert.equal(roda({ protocol: "app:", hostname: "lenda" }).destino, null);
  assert.equal(roda({ hostname: "lenda.example.com" }).destino, null);
  assert.equal(roda({ hostname: "educacaogamer.com.br.golpe.com" }).destino, null);
});

test("armazenamento bloqueado: fica no jogo", () => {
  assert.equal(roda({ armazenamentoQuebrado: true }).destino, null);
});
