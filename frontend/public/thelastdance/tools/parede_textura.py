#!/usr/bin/env python3
"""Transforma uma parede isométrica gerada por IA numa TEXTURA RETA (vista de frente), que o jogo inclina sozinho.

Uso (a partir de frontend/public/thelastdance/):
    python3 -I tools/parede_textura.py <parede_gerada.png> <nome> [--largura-m 2] [--altura-m 2.7]

Por que: o gerador não acerta a proporção exata de uma parede isométrica, e esticar o desenho para caber no guia
entorta tudo. Já uma textura reta pode ser aplicada em QUALQUER parede (qualquer comprimento, plano x = 0 ou
y = 0) com a inclinação exata do mapa — o jogo faz isso com uma transformação afim (js/apartamento.js).

Como: separa a parede do fundo verde (chroma-clean da skill), descarta a faixa clara do topo (espessura da
parede) e, coluna a coluna, reamostra o trecho entre o topo e a base da face para uma altura fixa — isso
desfaz a inclinação. Depois redimensiona para largura-m × altura-m na escala 200 px por metro e registra em
assets/maps/props/props.json como {"tipo": "textura_parede", ...}.
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
PX_POR_M = 200


def main():
    gerado, nome = Path(sys.argv[1]), sys.argv[2]
    arg = lambda k, d: float(sys.argv[sys.argv.index(k) + 1]) if k in sys.argv else d  # noqa: E731
    larg_m, alt_m = arg("--largura-m", 2.0), arg("--altura-m", 2.7)
    with tempfile.TemporaryDirectory() as t:
        entrada, limpo = Path(t) / "e.png", Path(t) / "l.png"
        Image.open(gerado).convert("RGB").save(entrada)
        subprocess.run(["node", str(SK / "chroma-clean.mjs"), "clean", "--input", str(entrada), "--out", str(limpo),
                        "--keep-largest"], check=True, capture_output=True)
        rgba = np.asarray(Image.open(limpo).convert("RGBA"))
    a = rgba[..., 3] > 128
    cols = np.where(a.sum(0) > 20)[0]
    x0, x1 = cols.min(), cols.max() + 1
    # descarta as bordas laterais (contorno/espessura): 2% de cada lado
    m = max(2, int((x1 - x0) * 0.02))
    x0, x1 = x0 + m, x1 - m
    lum = rgba[..., :3].astype(int).sum(2)
    altura_alvo = 1000
    colunas = []
    for x in range(x0, x1):
        ys = np.where(a[:, x])[0]
        topo, base = ys.min(), ys.max()
        # pula a faixa do topo (espessura, mais clara) e o contorno: começa onde a luminância cai de novo
        seg = lum[topo:base + 1, x]
        inicio = topo + int(np.argmax(seg[: max(3, len(seg) // 8)] < seg[: max(3, len(seg) // 8)].max() - 40)) + 2
        fim = base - 2
        col = rgba[inicio:fim + 1, x, :3]
        col = np.asarray(Image.fromarray(col[:, None, :]).resize((1, altura_alvo), Image.LANCZOS))[:, 0, :]
        colunas.append(col)
    tex = np.stack(colunas, 1)
    # corta as sobras das bordas (quina da parede, faixa clara do topo) e deixa a textura contínua na horizontal:
    # o lado direito vai se misturando com o começo, para emendar sem marca a cada largura_m
    h, w = tex.shape[:2]
    tex = tex[int(h * 0.08):, int(w * 0.07):int(w * 0.93)].astype(float)
    # tira a variação de luz da esquerda para a direita (repetida, ela vira listras); mantém a de cima para baixo
    from scipy import ndimage as nd
    media_col = nd.uniform_filter1d(tex.mean(0, keepdims=True), size=max(9, tex.shape[1] // 6), axis=1, mode="nearest")
    tex = tex - media_col + tex.mean((0, 1), keepdims=True)
    w = tex.shape[1]
    faixa = max(8, w // 8)
    peso = np.linspace(0, 1, faixa)[None, :, None]
    tex[:, -faixa:] = tex[:, -faixa:] * (1 - peso) + tex[:, :faixa] * peso
    tex = tex[:, :-faixa // 2].clip(0, 255).astype(np.uint8)
    img = Image.fromarray(tex).resize((int(larg_m * PX_POR_M), int(alt_m * PX_POR_M)), Image.LANCZOS)
    PASTA.mkdir(parents=True, exist_ok=True)
    img.save(PASTA / f"{nome}.png", optimize=True)
    cat_path = PASTA / "props.json"
    catalogo = json.loads(cat_path.read_text(encoding="utf-8")) if cat_path.exists() else {"versao": 1, "props": {}}
    catalogo["props"][nome] = {"tipo": "textura_parede", "arquivo": f"{nome}.png", "px_por_m": PX_POR_M,
                               "largura_m": larg_m, "altura_m": alt_m,
                               "descricao": "textura reta de parede; o jogo inclina e repete a cada largura_m"}
    cat_path.write_text(json.dumps(catalogo, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{nome}: textura {img.size[0]}x{img.size[1]} px (de {x1 - x0} colunas da parede gerada)")


if __name__ == "__main__":
    main()
