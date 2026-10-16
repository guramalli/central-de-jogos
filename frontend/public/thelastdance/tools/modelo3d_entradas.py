#!/usr/bin/env python3
"""Prepara as 4 vistas da ficha do personagem para o gerador 3D (Hunyuan3D-2mv): frente, esquerda, costas, direita.

Uso (a partir de frontend/public/thelastdance/):
    python3 -I tools/modelo3d_entradas.py [ficha.png] [pasta_saida]
Padrão: reference/personagem_v2/vistas.png -> assets/characters/personagem_v2/modelo3d/entrada/

Convenção do Hunyuan3D-2mv: "left" = personagem olhando para a ESQUERDA da tela; "right" = para a direita.
A ficha padrão tem as 4 vistas lado a lado nessa ordem: frente, esquerda, costas, direita.
Cada saída: PNG RGBA, fundo transparente, figura inteira com margem, todas na MESMA escala (mesmo fator), pés
na mesma altura — o gerador recentraliza, mas a escala igual ajuda a casar as proporções.
Também grava medidas.json (caixas e alturas) para a conferência de silhueta depois.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as nd

sys.path.insert(0, str(Path(__file__).resolve().parent))
from recortar_v2 import mascara  # noqa: E402  (fundo branco + sombra + cabelo limpo)

RAIZ = Path(__file__).resolve().parent.parent
VISTAS = ["front", "left", "back", "right"]


def main():
    ficha = Path(sys.argv[1]) if len(sys.argv) > 1 else RAIZ / "reference/personagem_v2/vistas.png"
    saida = Path(sys.argv[2]) if len(sys.argv) > 2 else RAIZ / "assets/characters/personagem_v2/modelo3d/entrada"
    saida.mkdir(parents=True, exist_ok=True)
    rgb = np.asarray(Image.open(ficha).convert("RGB"))
    fg = mascara(rgb)
    rot, n = nd.label(fg)
    tam = nd.sum(fg, rot, range(1, n + 1))
    figs = sorted([i + 1 for i, t in enumerate(tam) if t > 20000],
                  key=lambda i: np.where(rot == i)[1].mean())
    if len(figs) != 4:
        sys.exit(f"esperava 4 figuras na ficha, achei {len(figs)}")
    caixas = []
    for i in figs:
        ys, xs = np.where(rot == i)
        caixas.append((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    alt = max(c[3] - c[1] for c in caixas)
    lado = int(alt * 1.15)  # quadro quadrado com 7,5% de margem em cima e embaixo
    medidas = {}
    for nome, i, (x0, y0, x1, y1) in zip(VISTAS, figs, caixas):
        m = (rot == i)[y0:y1, x0:x1]
        rgba = np.dstack([rgb[y0:y1, x0:x1], (m * 255).astype(np.uint8)])
        fig = Image.fromarray(rgba, "RGBA")
        quadro = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
        base = lado - int(alt * 0.075)  # pés todos na mesma linha
        quadro.alpha_composite(fig, ((lado - fig.width) // 2, base - fig.height))
        quadro.save(saida / f"{nome}.png")
        medidas[nome] = {"caixa": [int(x0), int(y0), int(x1), int(y1)], "altura": int(y1 - y0), "largura": int(x1 - x0)}
    (saida / "medidas.json").write_text(json.dumps(medidas, indent=2), encoding="utf-8")
    print("ok", {k: v["altura"] for k, v in medidas.items()}, "quadro", lado)


if __name__ == "__main__":
    main()
