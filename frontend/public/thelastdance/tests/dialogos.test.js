// Testes dos roteiros de ligação (js/dialogos/*.js) e do catálogo de peças do mapa. Rodar: node --test tests/*.test.js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const RAIZ = path.resolve(__dirname, "..");
const PASTA = path.join(RAIZ, "js/dialogos");
const roteiros = fs.readdirSync(PASTA).filter((f) => f.endsWith(".js")).map((f) => require(path.join(PASTA, f)));

test("há pelo menos um roteiro, com foto que existe", () => {
  assert.ok(roteiros.length >= 1);
  for (const r of roteiros) assert.ok(fs.existsSync(path.join(RAIZ, r.foto)), r.foto);
});

for (const r of roteiros) {
  test(`${r.id}: todo nó tem falas e termina em opções ou fim; toda opção leva a um nó que existe`, () => {
    assert.ok(r.nos[r.inicio], "nó inicial");
    for (const [id, n] of Object.entries(r.nos)) {
      assert.ok(Array.isArray(n.falas) && n.falas.length > 0, `${id}: falas`);
      for (const f of n.falas) {
        assert.ok(f.quem === "ela" || f.quem === "eu", `${id}: quem = ${f.quem}`);
        assert.ok(typeof f.texto === "string" && f.texto.trim().length > 0, `${id}: texto vazio`);
      }
      assert.ok(!!n.opcoes !== !!n.fim, `${id}: precisa ter opções OU fim`);
      for (const o of n.opcoes || []) assert.ok(r.nos[o.vai], `${id}: opção leva a "${o.vai}"`);
      if (n.fim) assert.ok(n.fim.texto && n.fim.resultado, `${id}: fim sem texto/resultado`);
    }
  });

  test(`${r.id}: todo nó é alcançável a partir do início e todo caminho chega a um fim`, () => {
    const vistos = new Set();
    const visitar = (id) => {
      if (vistos.has(id)) return;
      vistos.add(id);
      for (const o of r.nos[id].opcoes || []) visitar(o.vai);
    };
    visitar(r.inicio);
    assert.deepEqual([...vistos].sort(), Object.keys(r.nos).sort(), "nós soltos");
    const chegaAoFim = (id, pilha = new Set()) => {
      if (r.nos[id].fim) return true;
      if (pilha.has(id)) return false;
      pilha.add(id);
      return (r.nos[id].opcoes || []).every((o) => chegaAoFim(o.vai, new Set(pilha)));
    };
    assert.ok(chegaAoFim(r.inicio), "algum caminho não termina");
  });
}

test("catálogo de peças: todo arquivo existe e toda arte citada na planta está no catálogo", () => {
  const cat = JSON.parse(fs.readFileSync(path.join(RAIZ, "assets/maps/props/props.json"), "utf8"));
  for (const [nome, p] of Object.entries(cat.props)) {
    assert.ok(fs.existsSync(path.join(RAIZ, "assets/maps/props", p.arquivo)), nome);
  }
  const P = require(path.join(RAIZ, "js/maps/apartamento_planta.js"));
  const citadas = [...P.caixas.map((c) => c.arte), ...P.naParede.map((w) => w.arte), ...P.comodos.map((c) => c.piso_arte)]
    .filter(Boolean);
  for (const n of citadas) assert.ok(cat.props[n], `planta cita "${n}" que não está no catálogo`);
});
