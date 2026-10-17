// Regras que valem para TODO mapa (apartamento, padaria...). Rodar: node --test tests/*.test.js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const RAIZ = path.resolve(__dirname, "..");
const ISO = require(path.join(RAIZ, "js/maps/iso.js"));
const RAIO = 0.22;
const MAPAS = fs.readdirSync(path.join(RAIZ, "js/maps")).filter((f) => f.endsWith("_planta.js"))
  .map((f) => require(path.join(RAIZ, "js/maps", f)));
const sobrepoe = (a, b) => a.x0 < b.x1 - 1e-9 && b.x0 < a.x1 - 1e-9 && a.y0 < b.y1 - 1e-9 && b.y0 < a.y1 - 1e-9;

test("todos os mapas do caminho existem: apartamento, elevador, garagem, padaria", () => {
  const ids = MAPAS.map((m) => m.id).sort();
  for (const id of ["apartamento", "elevador", "garagem", "padaria", "casa_amigo"]) assert.ok(ids.includes(id), ids.join(","));
});

for (const P of MAPAS) {
  test(`${P.id}: móveis dentro do mapa e sem sobreposição`, () => {
    const moveis = P.caixas.filter((c) => c.tipo !== "parede");
    for (const c of moveis) {
      assert.ok(c.x0 >= 0 && c.y0 >= 0 && c.x1 <= P.largura && c.y1 <= P.profundidade, c.nome);
    }
    for (let i = 0; i < moveis.length; i++) {
      for (let j = i + 1; j < moveis.length; j++) assert.ok(!sobrepoe(moveis[i], moveis[j]), `${moveis[i].nome} × ${moveis[j].nome}`);
    }
  });

  test(`${P.id}: todos os inícios livres e todos os pontos alcançáveis a pé`, () => {
    const inicios = Object.assign({ inicio: P.inicio }, P.inicios || {});
    const g = ISO.alcance(P, P.inicio.x, P.inicio.y, RAIO, 0.1);
    for (const [nome, i] of Object.entries(inicios)) {
      assert.ok(ISO.livre(P, i.x, i.y, RAIO), `início "${nome}" bloqueado`);
      assert.ok(g.alcancavel(i.x, i.y), `início "${nome}" isolado`);
    }
    for (const p of P.pontos) assert.ok(g.alcancavel(p.x, p.y), `${p.nome}: não dá para chegar`);
  });

  test(`${P.id}: tem exatamente uma porta de saída, alcançável, que leva a uma página que existe`, () => {
    const portas = P.naParede.filter((w) => w.saida);
    assert.equal(portas.length, 1);
    const w = portas[0], m = (w.a + w.b) / 2;
    const frente = w.plano === "x0" ? { x: 0.5, y: m } : { x: m, y: 0.5 };
    const g = ISO.alcance(P, P.inicio.x, P.inicio.y, RAIO, 0.1);
    assert.ok(g.alcancavel(frente.x, frente.y), "frente da porta inacessível");
    // a porta leva direto ("vai") ou abre o menu de destinos da planta
    const ativos = w.vai ? [w.vai] : (P.destinos || []).filter((d) => d.ativo);
    assert.ok(ativos.length >= 1, "porta sem destino");
    for (const d of [...ativos, ...(P.destinos || []).filter((d) => d.ativo)]) {
      assert.ok(fs.existsSync(path.join(RAIZ, d.url.split("?")[0])), d.url);
    }
  });

  if (P.caixas.some((c) => c.destinos || c.interacao)) test(`${P.id}: dá para chegar nos objetos de tocar (carro, armário)`, () => {
    const g = ISO.alcance(P, P.inicio.x, P.inicio.y, RAIO, 0.1);
    for (const c of P.caixas.filter((k) => k.destinos || k.interacao)) {
      assert.ok(c.falarDe && ISO.livre(P, c.falarDe.x, c.falarDe.y, RAIO) && g.alcancavel(c.falarDe.x, c.falarDe.y), c.nome);
      if (c.destinos) assert.ok((P.destinos || []).some((d) => d.ativo), "carro sem destino ativo");
    }
  });

  if (P.npcs) test(`${P.id}: pessoas sentadas numa cadeira, dá para chegar perto de todas, roteiros existem`, () => {
    const g = ISO.alcance(P, P.inicio.x, P.inicio.y, RAIO, 0.1);
    const ids = new Set();
    for (const n of P.npcs) {
      assert.ok(!ids.has(n.id), `id repetido: ${n.id}`); ids.add(n.id);
      if (n.postura === "sentado") {
        const cad = P.caixas.filter((c) => c.tipo === "cadeira" && n.x > c.x0 && n.x < c.x1 && n.y > c.y0 && n.y < c.y1);
        assert.equal(cad.length, 1, `${n.id}: não está numa cadeira`);
      }
      let perto = false; // alguma célula alcançável a até 1 m dele
      for (let j = 0; j < g.ny && !perto; j++) for (let i = 0; i < g.nx && !perto; i++) {
        if (g.ok[j * g.nx + i] && Math.hypot((i + 0.5) * g.passo - n.x, (j + 0.5) * g.passo - n.y) < 1.0) perto = true;
      }
      assert.ok(perto, `${n.id}: ninguém consegue chegar perto`);
      if (n.falarDe) {
        assert.ok(ISO.livre(P, n.falarDe.x, n.falarDe.y, RAIO), `${n.id}: falarDe bloqueado`);
        assert.ok(g.alcancavel(n.falarDe.x, n.falarDe.y), `${n.id}: falarDe isolado`);
        assert.ok(Math.hypot(n.falarDe.x - n.x, n.falarDe.y - n.y) < 2.0, `${n.id}: falarDe longe demais`);
      }
      assert.ok(n.dialogo || n.fala, `${n.id}: sem dialogo nem fala`);
      if (n.personagem) { // personagem fora do git (rosto real) precisa ter o boneco provisório de reserva
        const existe = fs.existsSync(path.join(RAIZ, "assets/characters/npcs", n.personagem, "personagem.json"));
        assert.ok(existe || n.visual, `${n.id}: personagem ${n.personagem} não existe e não tem "visual" de reserva`);
      }
      if (n.dialogo) assert.ok(fs.existsSync(path.join(RAIZ, "js/dialogos", n.dialogo + ".js")), `${n.id}: roteiro ${n.dialogo}`);
    }
  });
}
