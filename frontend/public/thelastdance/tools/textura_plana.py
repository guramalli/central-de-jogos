#!/usr/bin/env python3
"""Entrada de imagens PLANAS do mapa (vistas de frente ou de cima) que o jogo inclina sozinho no ângulo isométrico.

Uso (a partir de frontend/public/thelastdance/):
    python3 -I tools/textura_plana.py <gerado.png> <nome> --tipo decal|piso|parede [--sem-fundo] [--metros 2]
        [--largura-m 2 --altura-m 3]

  --tipo decal  imagem vista de FRENTE para colar numa parede (neon, quadro, janela, porta). O jogo estica a
                imagem para o retângulo da parede definido na planta (naParede: a..b, z0..z1).
  --tipo piso   textura vista de CIMA, repetida no chão; --metros = quantos metros cada repetição cobre.
  --tipo parede textura de parede vista de FRENTE (ex.: azulejo embaixo, pintura em cima), largura-m × altura-m,
                repetida ao longo das paredes do fundo (mesmo formato que tools/parede_textura.py grava).
  --sem-fundo   a imagem tem fundo verde: tira com chroma-clean (skill animated-spritesheets) e recorta.
                Se a imagem já tem fundo transparente (PNG do ChatGPT), só recorta.
Registra em assets/maps/props/props.json.
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
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
    ja_transparente = (np.asarray(im)[..., 3] < 128).mean() > 0.05
    if "--sem-fundo" in sys.argv and ja_transparente:
        im = im.crop(im.getbbox())
    elif "--sem-fundo" in sys.argv:
        with tempfile.TemporaryDirectory() as t:
            e, s = Path(t) / "e.png", Path(t) / "s.png"
            im.convert("RGB").save(e)
            subprocess.run(["node", str(SK / "chroma-clean.mjs"), "clean", "--input", str(e), "--out", str(s)],
                           check=True, capture_output=True)
            im = Image.open(s).convert("RGBA")
        im = im.crop(im.getbbox())
    else:
        im = im.convert("RGB")
    if tipo == "parede":  # 200 px por metro, como as texturas de parede de tools/parede_textura.py
        lm = float(sys.argv[sys.argv.index("--largura-m") + 1]) if "--largura-m" in sys.argv else 2.0
        am = float(sys.argv[sys.argv.index("--altura-m") + 1]) if "--altura-m" in sys.argv else 3.0
        im = im.convert("RGB").resize((round(lm * 200), round(am * 200)), Image.LANCZOS)
    elif max(im.size) > LADO_MAX:
        f = LADO_MAX / max(im.size)
        im = im.resize((round(im.width * f), round(im.height * f)), Image.LANCZOS)
    PASTA.mkdir(parents=True, exist_ok=True)
    im.save(PASTA / f"{nome}.png", optimize=True)
    cat_path = PASTA / "props.json"
    cat = json.loads(cat_path.read_text(encoding="utf-8")) if cat_path.exists() else {"versao": 1, "props": {}}
    item = {"tipo": "decal" if tipo == "decal" else "textura_piso", "arquivo": f"{nome}.png",
            "tamanho_px": list(im.size)}
    if tipo == "parede":
        item = {"tipo": "textura_parede", "arquivo": f"{nome}.png", "px_por_m": 200, "largura_m": lm, "altura_m": am,
                "descricao": "textura reta de parede; o jogo inclina e repete a cada largura_m"}
    if tipo == "piso":
        item["metros"] = metros
    cat["props"][nome] = item
    cat_path.write_text(json.dumps(cat, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{nome}: {tipo} {im.size[0]}x{im.size[1]} px")


if __name__ == "__main__":
    main()
