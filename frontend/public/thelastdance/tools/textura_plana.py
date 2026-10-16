#!/usr/bin/env python3
"""Entrada de imagens PLANAS do mapa (vistas de frente ou de cima) que o jogo inclina sozinho no ângulo isométrico.

Uso (a partir de frontend/public/thelastdance/):
    python3 -I tools/textura_plana.py <gerado.png> <nome> --tipo decal|piso [--sem-fundo] [--metros 2]

  --tipo decal  imagem vista de FRENTE para colar numa parede (neon, quadro, janela, porta). O jogo estica a
                imagem para o retângulo da parede definido na planta (naParede: a..b, z0..z1).
  --tipo piso   textura vista de CIMA, repetida no chão; --metros = quantos metros cada repetição cobre.
  --sem-fundo   a imagem tem fundo verde: tira com chroma-clean (skill animated-spritesheets) e recorta.
Registra em assets/maps/props/props.json.
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
SK = Path.home() / ".claude/skills/animated-spritesheets/scripts"
PASTA = RAIZ / "assets/maps/props"
LADO_MAX = 768  # no jogo essas imagens aparecem com poucas centenas de px; mais que isso só pesa


def main():
    gerado, nome = Path(sys.argv[1]), sys.argv[2]
    tipo = sys.argv[sys.argv.index("--tipo") + 1]
    metros = float(sys.argv[sys.argv.index("--metros") + 1]) if "--metros" in sys.argv else 2.0
    im = Image.open(gerado).convert("RGBA")
    if "--sem-fundo" in sys.argv:
        with tempfile.TemporaryDirectory() as t:
            e, s = Path(t) / "e.png", Path(t) / "s.png"
            im.convert("RGB").save(e)
            subprocess.run(["node", str(SK / "chroma-clean.mjs"), "clean", "--input", str(e), "--out", str(s)],
                           check=True, capture_output=True)
            im = Image.open(s).convert("RGBA")
        im = im.crop(im.getbbox())
    else:
        im = im.convert("RGB")
    if max(im.size) > LADO_MAX:
        f = LADO_MAX / max(im.size)
        im = im.resize((round(im.width * f), round(im.height * f)), Image.LANCZOS)
    PASTA.mkdir(parents=True, exist_ok=True)
    im.save(PASTA / f"{nome}.png", optimize=True)
    cat_path = PASTA / "props.json"
    cat = json.loads(cat_path.read_text(encoding="utf-8")) if cat_path.exists() else {"versao": 1, "props": {}}
    item = {"tipo": "decal" if tipo == "decal" else "textura_piso", "arquivo": f"{nome}.png",
            "tamanho_px": list(im.size)}
    if tipo == "piso":
        item["metros"] = metros
    cat["props"][nome] = item
    cat_path.write_text(json.dumps(cat, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{nome}: {tipo} {im.size[0]}x{im.size[1]} px")


if __name__ == "__main__":
    main()
