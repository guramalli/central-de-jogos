// Regras do minigame de surf (js/surf.js): nota dos juízes, bônus perto da espuma, repetição e resultado final.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const R = require("../js/surf.js");

test("surf: nota vai de 0 a 10 e cresce com os pontos", () => {
  assert.strictEqual(R.nota(0), 0);
  assert.strictEqual(R.nota(-50), 0);
  assert.ok(R.nota(5000) < R.nota(10000));
  assert.ok(R.nota(1e9) <= 10);
  assert.strictEqual(R.nota(10000), 6.3);
});

test("surf: perto da espuma vale até 3x, longe vale 1x", () => {
  assert.strictEqual(R.proximidade(0), 3);
  assert.strictEqual(R.proximidade(-40), 3);
  assert.strictEqual(R.proximidade(800), 1);
  assert.strictEqual(R.proximidade(5000), 1);
  assert.ok(R.proximidade(200) > R.proximidade(600));
});

test("surf: repetir a mesma manobra vale menos; variar volta ao normal", () => {
  assert.strictEqual(R.repeticao([], "batida"), 1);
  assert.strictEqual(R.repeticao(["batida"], "batida"), 0.6);
  assert.strictEqual(R.repeticao(["batida", "batida"], "batida"), 0.35);
  assert.strictEqual(R.repeticao(["batida", "batida", "batida", "batida"], "batida"), 0.2);
  assert.strictEqual(R.repeticao(["batida", "cavada"], "batida"), 1);
});

test("surf: resultado = soma das 2 melhores notas", () => {
  assert.strictEqual(R.resultado([3, 8.2, 7]), 15.2);
  assert.strictEqual(R.resultado([5]), 5);
  assert.strictEqual(R.resultado([]), 0);
  assert.match(R.titulo(18), /Campeão/);
  assert.match(R.titulo(2), /churrasco/);
});

test("surf: a página existe, está atrás da senha e o carro leva até ela", () => {
  const raiz = path.join(__dirname, "..");
  const html = fs.readFileSync(path.join(raiz, "surf.html"), "utf8");
  for (const s of ["js/base.js", "js/vip.js", "js/audio.js", "personagem_modular/dados.js", "personagem_modular/personagem-modular.js", "js/surf.js"]) {
    assert.ok(html.includes(`src="${s}"`), s);
  }
  assert.match(fs.readFileSync(path.join(raiz, "js/vip.js"), "utf8"), /"surf\.html":/);
  // a Praia só aparece no carro depois de aceitar o convite do Carioca (logo após a ligação da Gatinha de Campinas)
  const garagem = fs.readFileSync(path.join(raiz, "js/maps/garagem_planta.js"), "utf8");
  assert.match(garagem, /url: "surf\.html", ativo: true, so: "nsf_surf"/);
  const apto = fs.readFileSync(path.join(raiz, "js/maps/apartamento_planta.js"), "utf8");
  assert.match(apto, /PLANTA\.aoTerminarLigacao/);
  assert.match(apto, /nome: "Carioca"/);
  assert.match(apto, /sessionStorage\.setItem\("nsf_surf", "1"\)/);
  assert.match(fs.readFileSync(path.join(raiz, "personagem_modular/dados.js"), "utf8"), /neoprene_calca/);
});
