// Testes da planta do apartamento (FASE 4, esquema em blocos). Rodar: node --test tests/*.test.js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const RAIZ = path.resolve(__dirname, "..");
const ISO = require(path.join(RAIZ, "js/maps/iso.js"));
const P = require(path.join(RAIZ, "js/maps/apartamento_planta.js"));
const RAIO = 0.22;

const sobrepoe = (a, b) => a.x0 < b.x1 - 1e-9 && b.x0 < a.x1 - 1e-9 && a.y0 < b.y1 - 1e-9 && b.y0 < a.y1 - 1e-9;

test("projeção 2:1: um metro em x anda 2 px na horizontal para cada 1 px na vertical", () => {
  const [x, y] = ISO.tela(1, 0, 0);
  assert.equal(x / y, 2);
  assert.deepEqual(ISO.tela(0, 0, 1), [0, -ISO.VERT]);
});

test("setas viram direções no mundo normalizadas (diagonal sem bônus de velocidade)", () => {
  for (const [sx, sy] of [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1]]) {
    const [x, y] = ISO.direcaoMundo(sx, sy);
    assert.ok(Math.abs(Math.hypot(x, y) - 1) < 1e-9);
  }
  const [x, y] = ISO.direcaoMundo(1, 0); // seta para a direita: anda na tela para a direita (x − y > 0, x + y = 0)
  assert.ok(x - y > 0 && Math.abs(x + y) < 1e-9);
});

test("móveis dentro do apartamento e sem sobreposição", () => {
  const moveis = P.caixas.filter((c) => c.tipo !== "parede");
  for (const c of moveis) {
    assert.ok(c.x0 >= 0 && c.y0 >= 0 && c.x1 <= P.largura && c.y1 <= P.profundidade, c.nome);
    assert.ok(c.x1 > c.x0 && c.y1 > c.y0 && c.z1 > 0, c.nome);
  }
  for (let i = 0; i < moveis.length; i++) {
    for (let j = i + 1; j < moveis.length; j++) {
      assert.ok(!sobrepoe(moveis[i], moveis[j]), `${moveis[i].nome} × ${moveis[j].nome}`);
    }
  }
});

test("início livre e todos os pontos de interesse alcançáveis a pé (inclusive o quarto, pela porta)", () => {
  assert.ok(ISO.livre(P, P.inicio.x, P.inicio.y, RAIO), "início bloqueado");
  const g = ISO.alcance(P, P.inicio.x, P.inicio.y, RAIO, 0.1);
  for (const p of P.pontos) {
    assert.ok(ISO.livre(P, p.x, p.y, RAIO), `${p.nome}: ponto bloqueado`);
    assert.ok(g.alcancavel(p.x, p.y), `${p.nome}: não dá para chegar`);
  }
});

test("a parede entre sala e quarto só deixa passar pela porta", () => {
  const g = ISO.alcance(P, P.inicio.x, P.inicio.y, RAIO, 0.1);
  let passagens = 0;
  for (let y = 0.05; y < P.profundidade; y += 0.1) {
    if (g.alcancavel(5.9, y) && g.alcancavel(6.3, y)) passagens++;
  }
  assert.ok(passagens > 0, "sem passagem para o quarto");
  assert.ok(passagens <= 10, `passagem larga demais: ${passagens} faixas de 10 cm`);
});

test("colisão: não atravessa o sofá nem a parede; desliza ao encostar", () => {
  const j = { x: 1.6, y: 2.3 };
  for (let i = 0; i < 100; i++) ISO.mover(P, j, 0.05, 0, RAIO); // anda em +x contra o sofá (x0 = 2.4)
  assert.ok(j.x <= 2.4 - RAIO + 1e-9, `entrou no sofá: x = ${j.x}`);
  const k = { x: 1.0, y: 6.0 };
  for (let i = 0; i < 100; i++) ISO.mover(P, k, 0.05, 0.05, RAIO); // diagonal contra a parede da frente
  assert.ok(k.y <= P.profundidade - RAIO + 1e-9 && k.x > 2, "não deslizou pela parede");
});

test("ordem de desenho: quem está atrás vem antes", () => {
  const sofa = P.caixas.find((c) => c.nome === "Sofá cinza");
  const atras = { nome: "j", x0: 1.5, y0: 2.0, x1: 1.6, y1: 2.1 };   // entre a TV e o sofá
  const frente = { nome: "k", x0: 3.6, y0: 2.0, x1: 3.7, y1: 2.1 };  // depois do sofá
  const ord = ISO.ordenar([frente, sofa, atras]).map((c) => c.nome);
  assert.ok(ord.indexOf("j") < ord.indexOf("Sofá cinza") && ord.indexOf("Sofá cinza") < ord.indexOf("k"), ord.join(","));
});
