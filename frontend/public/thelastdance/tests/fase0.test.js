// Testes da FASE 0 sem navegador. Rodar: node --test tests/*.test.js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const RAIZ = path.resolve(__dirname, "..");
const NSF = require(path.join(RAIZ, "js/base.js"));

const PASTAS = [
  "assets/characters/protagonist/source",
  "assets/characters/protagonist/directions",
  "assets/characters/protagonist/animations",
  "assets/maps/room_01/floor",
  "assets/maps/room_01/walls",
  "assets/maps/room_01/props",
  "assets/maps/room_01/lighting",
  "js/characters",
  "js/camera",
  "js/occlusion",
  "tests",
  "tools",
  "docs/acceptance",
];

for (const p of PASTAS) {
  test(`pasta ${p} existe`, () => assert.ok(fs.statSync(path.join(RAIZ, p)).isDirectory()));
}

test("docs obrigatórios existem", () => {
  for (const d of ["docs/decisions.md", "docs/inventario_assets.md", "docs/pipeline_arte.md", "docs/acceptance/fase_0.md"]) {
    assert.ok(fs.existsSync(path.join(RAIZ, d)), d);
  }
});

test("index.html carrega só scripts locais que existem, sem engine nem CDN", () => {
  const html = fs.readFileSync(path.join(RAIZ, "index.html"), "utf8");
  const srcs = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(srcs, ["js/base.js", "js/cena_teste.js"]);
  for (const s of srcs) assert.ok(fs.existsSync(path.join(RAIZ, s)), s);
  assert.doesNotMatch(html, /https?:\/\//, "nenhum recurso externo");
});

test("modo de teste só liga com ?test=1", () => {
  assert.equal(NSF.lerModoTeste("?test=1"), true);
  assert.equal(NSF.lerModoTeste("?a=2&test=1"), true);
  assert.equal(NSF.lerModoTeste(""), false);
  assert.equal(NSF.lerModoTeste("?test=0"), false);
  assert.equal(NSF.lerModoTeste(undefined), false);
});

test("limite de fps: 30 no teste, livre fora dele", () => {
  assert.equal(NSF.deveDesenhar(1000, 990, 30), false); // 10 ms depois: cedo demais para 30 fps
  assert.equal(NSF.deveDesenhar(1000, 966, 30), true); // 34 ms depois: pode
  assert.equal(NSF.deveDesenhar(1000, 999, 0), true); // sem limite
});

test("escala mantém a proporção da resolução base (letterbox)", () => {
  const e = NSF.escalaParaTela(1280, 720, 1920, 1080);
  assert.ok(Math.abs(e.escala - 2 / 3) < 1e-9);
  assert.equal(e.dx, 0);
  const u = NSF.escalaParaTela(2560, 1080, 1920, 1080); // ultrawide: barras laterais
  assert.equal(u.escala, 1);
  assert.equal(u.dx, 320);
});

test("referências do kit preservadas (SHA-256 igual ao inventário)", () => {
  const inv = JSON.parse(fs.readFileSync(path.join(RAIZ, "docs/acceptance/fase_0/inventario.json"), "utf8"));
  const publicos = inv.filter((i) => i.arquivo.startsWith("reference/kit_v1.0/"));
  assert.equal(publicos.length, 5);
  for (const i of publicos) {
    const h = crypto.createHash("sha256").update(fs.readFileSync(path.join(RAIZ, i.arquivo))).digest("hex");
    assert.equal(h, i.sha256, i.arquivo);
  }
});
