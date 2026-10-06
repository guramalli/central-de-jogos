import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { RAIZ } from "./util.js";

const KB = 1024, MB = 1024 * 1024;
const CAPTURAS = ["00_inicio", "01_toquio", "02_lava", "03_guardiao", "04_historia", "05_clube", "06_agencia", "07_vila"];
const LIMITES = [
  ["public/lenda-do-campinho/a/capa.webp", 450 * KB],
  ["public/lenda-do-campinho/a/capa_vertical.webp", 260 * KB],
  ["public/lenda/a/logo.webp", 120 * KB],
  ["public/lenda/a/og.jpg", 250 * KB],
  ["public/lenda/a/poster.webp", 150 * KB],
  ...CAPTURAS.map((n) => [`public/lenda/a/cap_${n}.webp`, 200 * KB]),
  ...CAPTURAS.map((n) => [`public/lenda/a/cap_${n}_p.webp`, 70 * KB]),
  ["public/lenda/video/trailer_pt.mp4", 15 * MB],
  ["public/lenda/video/trailer_en.mp4", 15 * MB],
  ["public/lenda/imprensa/logo.png", 2 * MB],
  ["public/lenda/imprensa/lenda-do-campinho-kit-imprensa.zip", 60 * MB],
];

for (const [rel, max] of LIMITES) {
  test(`arte ${rel} existe e cabe em ${Math.round(max / KB)} KB`, () => {
    const arq = path.join(RAIZ, rel);
    assert.ok(existsSync(arq), `falta ${rel} — rode: python frontend/tools/vitrine_lenda.py`);
    const tam = statSync(arq).size;
    assert.ok(tam > 0 && tam <= max, `${rel} tem ${Math.round(tam / KB)} KB`);
  });
}
