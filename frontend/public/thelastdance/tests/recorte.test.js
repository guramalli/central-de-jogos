// Testes do piloto de animação por recorte (sem navegador). Rodar: node --test tests/*.test.js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const RAIZ = path.resolve(__dirname, "..");
const R = require(path.join(RAIZ, "js/characters/recorte.js"));
const ANIM = require(path.join(RAIZ, "js/characters/protagonista_anim.js"));
const PASTA = path.join(RAIZ, "assets/characters/protagonist/recorte/v01");
const rig = JSON.parse(fs.readFileSync(path.join(PASTA, "rig.json"), "utf8"));

const perto = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;

test("giro em torno do pivô mantém o pivô parado", () => {
  const m = R.local([100, 50], { rot: 90 });
  const [x, y] = R.aplicar(m, 100, 50);
  assert.ok(perto(x, 100) && perto(y, 50));
  const [x2, y2] = R.aplicar(m, 110, 50); // 10 px à direita do pivô -> 10 px abaixo (horário na tela)
  assert.ok(perto(x2, 100) && perto(y2, 60), `${x2},${y2}`);
});

test("filho herda o movimento do pai", () => {
  const mini = { ossos: [{ nome: "a", pai: null, pivo: [0, 0] }, { nome: "b", pai: "a", pivo: [10, 0] }] };
  const m = R.mundo(mini, { a: { x: 5 }, b: { rot: 90 } });
  const [x, y] = R.aplicar(m.b, 20, 0); // gira 90° em torno de (10,0) -> (10,10); depois desloca 5
  assert.ok(perto(x, 15) && perto(y, 10), `${x},${y}`);
});

test("rig: ossos na ordem pai-antes-do-filho e peças apontando para ossos existentes", () => {
  const vistos = new Set();
  for (const o of rig.ossos) {
    if (o.pai) assert.ok(vistos.has(o.pai), `${o.nome} vem antes do pai ${o.pai}`);
    vistos.add(o.nome);
  }
  for (const p of rig.pecas) {
    assert.ok(vistos.has(p.osso), p.nome);
    assert.ok(fs.existsSync(path.join(PASTA, p.arquivo)), p.arquivo);
  }
  const zs = rig.pecas.map((p) => p.z);
  assert.deepEqual(zs, [...zs].sort((a, b) => a - b), "peças em ordem de desenho");
});

test("peças são PNG com transparência (RGBA)", () => {
  for (const p of rig.pecas) {
    const b = fs.readFileSync(path.join(PASTA, p.arquivo));
    assert.equal(b.toString("ascii", 1, 4), "PNG", p.arquivo);
    assert.equal(b[25], 6, p.arquivo + ": tipo de cor 6 = RGBA");
  }
});

test("animações dão números válidos e fecham o ciclo (pose em t=0 igual a t=1)", () => {
  for (const [nome, a] of Object.entries(ANIM)) {
    assert.ok(a.duracao > 0, nome);
    for (let i = 0; i <= 20; i++) {
      const pose = a.pose(i / 20);
      for (const [osso, k] of Object.entries(pose)) {
        assert.ok(rig.ossos.some((o) => o.nome === osso), `${nome}: osso ${osso} não existe`);
        for (const v of Object.values(k)) assert.ok(Number.isFinite(v), `${nome}/${osso}`);
      }
    }
    const p0 = a.pose(0), p1 = a.pose(1);
    for (const osso of Object.keys(p0)) {
      for (const c of Object.keys(p0[osso])) {
        assert.ok(perto(p0[osso][c], (p1[osso] || {})[c] ?? 0, 1e-6), `${nome}: ${osso}.${c} não fecha o laço`);
      }
    }
  }
});

test("pés plantados: o pé que não está levantando não sai do lugar", () => {
  const pe = (pose, lado) => {
    const m = R.mundo(rig, pose)["canela_" + lado];
    const osso = rig.ossos.find((o) => o.nome === "canela_" + lado);
    return R.aplicar(m, osso.pivo[0], osso.pivo[1] + 200); // ponto no tênis
  };
  const casos = [["parado", "dir", 0.3], ["parado", "esq", 0.6], ["danca", "dir", 0.25], ["brinde", "esq", 0.5],
    ["andar", "esq", 0.25], ["andar", "dir", 0.75]];
  for (const [nome, lado, t] of casos) {
    const [x0, y0] = pe({}, lado);
    const [x, y] = pe(ANIM[nome].pose(t), lado);
    assert.ok(Math.hypot(x - x0, y - y0) < 12, `${nome} t=${t}: pé ${lado} andou ${Math.hypot(x - x0, y - y0).toFixed(1)} px`);
  }
});
