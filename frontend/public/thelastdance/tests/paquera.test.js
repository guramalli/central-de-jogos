// Paquera (js/dialogos/paquera.js): perfis completos, opções com nota e NPCs apontando para perfis que existem.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const RAIZ = path.resolve(__dirname, "..");
const PQ = require(path.join(RAIZ, "js/dialogos/paquera.js"));
const TIPOS = ["simpatica", "engracada", "metida", "timida", "fitness", "freira"];
const NOTAS = ["boa", "media", "ruim"];

test("cada perfil tem tipo, dificuldade, retrato que existe e as falas de fim", () => {
  for (const [id, p] of Object.entries(PQ.perfis)) {
    if (p.rapido) continue; // balada: paquera rápida (teste próprio abaixo)
    assert.ok(TIPOS.includes(p.tipo), id);
    assert.ok(p.dificuldade >= 1, id);
    assert.ok(p.ignora >= 0 && p.ignora < 1, id);
    assert.ok(fs.existsSync(path.join(RAIZ, p.retrato)), id + ": retrato " + p.retrato);
    assert.ok(p.fora, id);
    if (p.tipo !== "freira") assert.ok(p.topou && p.ignorou && p.zap, id);
  }
});

test("toda opção tem fala e nota; cada rodada geral tem opção boa, média e ruim", () => {
  const todas = [...PQ.aberturas, ...PQ.convites, ...PQ.perguntas.flatMap((q) => q.respostas),
    ...Object.values(PQ.perfis).flatMap((p) => (p.perguntas || []).flatMap((q) => q.respostas))];
  for (const o of todas) { assert.ok(o.t, JSON.stringify(o)); assert.ok(NOTAS.includes(o.nota), o.t); }
  for (const lista of [PQ.aberturas, PQ.convites, ...PQ.perguntas.map((q) => q.respostas)])
    for (const n of NOTAS) assert.ok(lista.some((o) => o.nota === n), "falta nota " + n);
});

test("reações gerais cobrem todos os níveis", () => {
  for (const nv of ["amou", "gostou", "neutro", "nao_curtiu", "odiou"]) assert.ok(PQ.reacoes.geral[nv].length, nv);
});

test("NPCs com paquera apontam para um perfil que existe", () => {
  const mapas = fs.readdirSync(path.join(RAIZ, "js/maps")).filter((f) => f.endsWith("_planta.js"))
    .map((f) => require(path.join(RAIZ, "js/maps", f)));
  let n = 0;
  for (const P of mapas) for (const npc of P.npcs || []) if (npc.paquera) { n++; assert.ok(PQ.perfis[npc.paquera], `${P.id}/${npc.id}`); }
  assert.ok(n >= 4, "esperava as meninas da padaria");
});

test("balada: paquera rápida — cada menina tem retrato, chance para o tipo dela e cenas de beijo e tapa", () => {
  const B = PQ.balada;
  for (const tipo of ["direta", "piada", "pesada"]) assert.ok(B.opcoes.some((o) => o.tipo === tipo), tipo);
  for (const [id, p] of Object.entries(PQ.perfis).filter(([, p]) => p.rapido)) {
    assert.ok(fs.existsSync(path.join(RAIZ, p.retrato)), id + ": retrato");
    for (const tipo of ["direta", "piada", "pesada"]) assert.ok(B.chance[tipo][p.tipo] >= 0, `${id}: chance ${tipo}`);
    const m = JSON.parse(fs.readFileSync(path.join(RAIZ, "assets/characters/npcs", id, "sprites3d.json"), "utf8"));
    for (const c of ["beijo", "tapa"]) {
      assert.ok(m.cenas && m.cenas[c], `${id}: cena ${c}`);
      assert.ok(fs.existsSync(path.join(RAIZ, "assets/characters/npcs", id, m.cenas[c].folha)), `${id}: folha ${c}`);
    }
  }
});
