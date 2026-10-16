// Testes do personagem v2 (recorte de frente e de lado). Rodar: node --test tests/*.test.js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const RAIZ = path.resolve(__dirname, "..");
const R = require(path.join(RAIZ, "js/characters/recorte.js"));
const ANIM = require(path.join(RAIZ, "js/characters/personagem_v2_anim.js"));
const VISTAS = ["frente", "lado"];
const pasta = (v) => path.join(RAIZ, "assets/characters/personagem_v2", v);
const rigs = Object.fromEntries(VISTAS.map((v) => [v, JSON.parse(fs.readFileSync(path.join(pasta(v), "rig.json"), "utf8"))]));
const perto = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;

test("alcance: o punho chega ao alvo quando dá, e o braço estica no máximo 12% quando não dá", () => {
  const rig = { ossos: [{ nome: "t", pai: null, pivo: [0, 0] }, { nome: "b", pai: "t", pivo: [0, 0] },
    { nome: "a", pai: "b", pivo: [0, 100] }, { nome: "m", pai: "a", pivo: [0, 150] }] };
  for (const alvo of [[60, 60], [0, 140], [120, -40], [-90, 30]]) {
    for (const dobra of [1, -1]) {
      const r = R.alcancar(rig, ["b", "a", "m"], alvo, { dobra });
      assert.equal(r.cotovelo.sy, undefined, "o antebraço não escala sozinho (herda do braço)");
      const [x, y] = R.aplicar(R.mundo(rig, { b: r.ombro, a: r.cotovelo }).m, 0, 150);
      assert.ok(perto(x, alvo[0], 1e-6) && perto(y, alvo[1], 1e-6), `alvo ${alvo} dobra ${dobra}: ${x},${y}`);
    }
  }
  const longe = R.alcancar(rig, ["b", "a", "m"], [1000, 0], {});
  assert.ok(longe.ombro.sy <= 1.12 + 1e-9 && perto(longe.ombro.sx, longe.ombro.sy), "esticar é uniforme e limitado");
  // esticado + ombro deslocado, o punho chega a um alvo além do alcance (150 px de braço, alvo a 200)
  const r = R.alcancar(rig, ["b", "a", "m"], [0, 200], {});
  const [x, y] = R.aplicar(R.mundo(rig, { b: r.ombro, a: r.cotovelo }).m, 0, 150);
  assert.ok(Math.hypot(x, y - 200) < 1e-6, `${x},${y}`);
});

for (const v of VISTAS) {
  const rig = rigs[v];

  test(`${v}: rig consistente (ordem dos ossos, peças existem, PNG com transparência)`, () => {
    const vistos = new Set();
    for (const o of rig.ossos) {
      if (o.pai) assert.ok(vistos.has(o.pai), `${o.nome} antes do pai ${o.pai}`);
      vistos.add(o.nome);
    }
    for (const p of rig.pecas) {
      assert.ok(vistos.has(p.osso), p.nome);
      const b = fs.readFileSync(path.join(pasta(v), p.arquivo));
      assert.equal(b.toString("ascii", 1, 4), "PNG", p.arquivo);
      assert.equal(b[25], 6, p.arquivo + ": RGBA");
    }
  });

  test(`${v}: garrafa, cigarro e fumaça começam escondidos; o corpo começa visível`, () => {
    const a = R.alfas(rig, {});
    for (const o of ["garrafa", "cigarro", "fumaca1", "fumaca2", "fumaca3"]) assert.equal(a[o], 0, o);
    for (const o of ["cabeca", "torso", "mao_dir", "canela_esq"]) assert.equal(a[o], 1, o);
  });

  test(`${v}: as 7 animações dão números válidos e fecham o ciclo`, () => {
    assert.deepEqual(Object.keys(ANIM[v]).sort(), ["andar", "beber", "danca", "fumar", "luta", "parado", "pegar"]);
    for (const [nome, an] of Object.entries(ANIM[v])) {
      for (let i = 0; i <= 24; i++) {
        for (const [osso, k] of Object.entries(an.pose(i / 24, rig))) {
          assert.ok(rig.ossos.some((o) => o.nome === osso), `${nome}: osso ${osso}`);
          for (const val of Object.values(k)) assert.ok(Number.isFinite(val), `${nome}/${osso}`);
        }
      }
      const m0 = R.mundo(rig, an.pose(0, rig)), m1 = R.mundo(rig, an.pose(1, rig));
      for (const o of rig.ossos) {
        for (let c = 0; c < 6; c++) assert.ok(perto(m0[o.nome][c], m1[o.nome][c], 1e-6), `${nome}: ${o.nome} não fecha o laço`);
      }
    }
  });

  test(`${v}: beber leva a boca da garrafa até a boca (com a cabeça inclinada)`, () => {
    const boca = { frente: [210, 425], lado: [1478, 425] }[v];
    const pose = ANIM[v].beber.pose(0.45, rig);
    const m = R.mundo(rig, pose);
    const g = rig.pecas.find((p) => p.nome === "garrafa");
    const ponta = R.aplicar(m.garrafa, g.origem[0] + 18, g.origem[1] + 4); // topo do gargalo na imagem
    const b = R.aplicar(m.cabeca, boca[0], boca[1]);
    assert.ok(Math.hypot(ponta[0] - b[0], ponta[1] - b[1]) < 6, `distância ${Math.hypot(ponta[0] - b[0], ponta[1] - b[1]).toFixed(1)} px`);
  });
}

test("frente: pés plantados em parado, dança, pegar, beber e fumar", () => {
  const rig = rigs.frente;
  const pe = (pose, lado) => {
    const o = rig.ossos.find((q) => q.nome === "canela_" + lado);
    return R.aplicar(R.mundo(rig, pose)["canela_" + lado], o.pivo[0], o.pivo[1] + 100);
  };
  for (const nome of ["parado", "danca", "pegar", "beber", "fumar"]) {
    for (const t of [0.1, 0.3, 0.5, 0.7]) {
      for (const lado of ["dir", "esq"]) {
        const [x0, y0] = pe({}, lado), [x, y] = pe(ANIM.frente[nome].pose(t, rig), lado);
        assert.ok(Math.hypot(x - x0, y - y0) < 8, `${nome} t=${t} pé ${lado}: ${Math.hypot(x - x0, y - y0).toFixed(1)} px`);
      }
    }
  }
});
