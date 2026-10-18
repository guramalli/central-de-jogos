// Testes das folhas de caminhada usadas no jogo (assets/characters/personagem_v2/pixel/jogo.json).
// Rodar: node --test tests/*.test.js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const RAIZ = path.resolve(__dirname, "..");
const PASTA = path.join(RAIZ, "assets/characters/personagem_v2/pixel");
const M = JSON.parse(fs.readFileSync(path.join(PASTA, "jogo.json"), "utf8"));
const NSF = require(path.join(RAIZ, "js/base.js"));

// largura, altura e se tem transparência, lidas do cabeçalho: PNG (IHDR; cor 6 = RGBA) ou WebP (VP8X; bit de alfa)
function tamanhoImagem(arq) {
  const b = fs.readFileSync(arq);
  if (b.toString("ascii", 1, 4) === "PNG") return [b.readUInt32BE(16), b.readUInt32BE(20), b[25] === 6];
  assert.equal(b.toString("ascii", 0, 4) + b.toString("ascii", 8, 12), "RIFFWEBP", arq + ": nem PNG nem WebP");
  assert.equal(b.toString("ascii", 12, 16), "VP8X", arq + ": WebP sem o cabeçalho estendido (não tem alfa)");
  return [b.readUIntLE(24, 3) + 1, b.readUIntLE(27, 3) + 1, (b[20] & 0x10) !== 0];
}
// cada tira usada: a de andar e, se o conjunto tiver, a de parado
const tiras = (c) => Object.entries(c).flatMap(([dir, f]) => [[dir, f], ...(f.parado ? [[dir + " parado", f.parado]] : [])]);

test("o conjunto padrão existe e todo conjunto tem as 4 direções", () => {
  assert.ok(M.conjuntos[M.padrao], "padrão: " + M.padrao);
  for (const [nome, c] of Object.entries(M.conjuntos)) {
    assert.deepEqual(Object.keys(c).sort(), ["baixo", "cima", "direita", "esquerda"], nome);
  }
});

test("cada folha existe, tem transparência (PNG ou WebP) e tem exatamente quadros × largura", () => {
  for (const [nome, c] of Object.entries(M.conjuntos)) {
    for (const [dir, f] of tiras(c)) {
      const arq = path.join(PASTA, f.folha);
      assert.ok(fs.existsSync(arq), `${nome}/${dir}: ${f.folha}`);
      const [w, h, alfa] = tamanhoImagem(arq);
      assert.ok(alfa, `${nome}/${dir}: com transparência`);
      assert.equal(w, f.larg * f.quadros, `${nome}/${dir}: largura da folha`);
      assert.equal(h, f.alt, `${nome}/${dir}: altura da folha`);
      assert.ok(f.fps > 0 && f.quadros >= 4, `${nome}/${dir}: fps/quadros`);
    }
  }
});

test("pés de todas as direções no mesmo lugar do quadro (personagem não pula ao virar)", () => {
  for (const [nome, c] of Object.entries(M.conjuntos)) {
    const pes = Object.values(c).map((f) => f.pes);
    const xs = pes.map((p) => p[0]), ys = pes.map((p) => p[1]);
    assert.ok(Math.max(...xs) - Math.min(...xs) <= 16, `${nome}: pés x ${xs}`);
    assert.ok(Math.max(...ys) - Math.min(...ys) <= 8, `${nome}: pés y ${ys}`);
    for (const f of Object.values(c)) {
      assert.ok(f.pes[0] > 0 && f.pes[0] < f.larg && f.pes[1] > f.alt * 0.8 && f.pes[1] < f.alt, `${nome}: pés dentro do quadro`);
    }
  }
});

test("tela adaptada: a largura lógica acompanha o formato (celular em pé fica estreito, mas não menos que 480)", () => {
  assert.equal(NSF.baseAdaptada(1920, 1080, 1080), 1920);
  assert.equal(NSF.baseAdaptada(812, 375, 1080), Math.round(1080 * 812 / 375)); // celular deitado: largo
  assert.equal(NSF.baseAdaptada(375, 812, 1080), 499);                          // celular em pé: estreito
  assert.equal(NSF.baseAdaptada(200, 1000, 1080), 480);                         // limite mínimo
});
