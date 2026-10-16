#!/usr/bin/env python3
"""Refaz as folhas de caminhada em ALTA RESOLUÇÃO (sem "pixel snap"), com o pipeline da skill animated-spritesheets.

Uso (a partir de frontend/public/thelastdance/):
    python3 -I tools/folhas_hd.py <prancha.png> <pasta_saida> [--quadros 8] [--altura 320] [--quadro 512]

Por que: o pixel snap (padrão da skill, feito para pixel art) reduz o personagem para a grade "nativa" de poucos
pixels e joga fora o detalhe que o vídeo/prancha tinham. Aqui: process-sheet --no-pixel-snap (recorta e tira o
fundo verde) -> normalize-canvas com quadro grande (reduz com Lanczos, pés alinhados) -> pack -> QC -> GIF.
"""
import subprocess
import sys
import tempfile
from pathlib import Path

SK = Path.home() / ".claude/skills/animated-spritesheets/scripts"


def node(*args):
    r = subprocess.run(["node", *map(str, args)], capture_output=True, text=True, encoding="utf-8")
    if r.returncode:
        sys.exit(f"falhou: {' '.join(map(str, args[:2]))}\n{r.stdout[-600:]}\n{r.stderr[-600:]}")
    return r.stdout


def main():
    prancha, saida = Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve()
    arg = lambda k, d: int(sys.argv[sys.argv.index(k) + 1]) if k in sys.argv else d  # noqa: E731
    n, altura, quadro = arg("--quadros", 8), arg("--altura", 320), arg("--quadro", 512)
    with tempfile.TemporaryDirectory() as t:
        node(SK / "process-sheet.mjs", prancha, "--action", "walk", "--rows", 3, "--cols", 4, "--frames", n,
             "--no-pixel-snap", "--no-qc", "--out-dir", t)
        # apaga só os ARQUIVOS antigos (no Windows/OneDrive a pasta pode estar em uso e não pode ser removida)
        for sub in ("runtime", "review"):
            (saida / sub).mkdir(parents=True, exist_ok=True)
            for f in (saida / sub).iterdir():
                if f.is_file():
                    f.unlink()
        node(SK / "normalize-canvas.mjs", "--input-dir", Path(t) / "_keyed", "--out-dir", saida / "runtime",
             "--canvas", f"{quadro}x{quadro}", "--target-height", altura, "--pad", 8)
    node(SK / "pack-spritesheet.mjs", "--input-dir", saida / "runtime", "--out", saida / "spritesheet.png",
         "--json-out", saida / "spritesheet.json")
    qc = node(SK / "sheet-qc.mjs", saida / "spritesheet.png").strip().splitlines()[0]
    ordem = ",".join(f"{i:02d}" for i in range(1, n + 1))
    node(SK / "build-sequence-gif.mjs", "--input-dir", saida / "runtime", "--order", ordem,
         "--out", saida / "review/walk.gif", "--durations-ms", ",".join(["100"] * n), "--flat-bg", "#2a0f3d")
    print(qc)


if __name__ == "__main__":
    main()
