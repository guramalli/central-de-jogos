#!/usr/bin/env python3
"""Entrada de uma peça do mapa gerada por IA: tira o fundo verde, encaixa no guia de forma e registra no catálogo.

Uso (a partir de frontend/public/thelastdance/):
    python3 -I tools/prop_entrada.py <gerado.png> <guia.json> [--espelhar] [--uniforme] [--nome NOME]

- O fundo verde sai com chroma-clean.mjs da skill animated-spritesheets (tira a franja e o verde refletido).
  Imagem que já vem com fundo TRANSPARENTE (ex.: PNG do ChatGPT) é usada direto, sem chroma.
- --espelhar: inverte na horizontal antes de encaixar (o gerador às vezes desenha a peça espelhada; paredes e
  peças simétricas podem ser espelhadas sem problema).
- Encaixe: a caixa da arte é esticada para a caixa do objeto no guia (tools/guia_props.py), então a arte fica
  no tamanho e na posição da colisão. O quanto foi preciso esticar fica registrado ("ajuste") para conferência.
- --uniforme: para peças de formato livre (planta, cadeira): mesma escala nos dois eixos, pela ALTURA do guia,
  com a base da arte centrada na base do guia — não deforma; folhas/braços podem passar um pouco da caixa.
Saída: assets/maps/props/<nome>.png + entrada em assets/maps/props/props.json:
    { arquivo, escala (px da imagem por px do jogo), origem_px (ponto da imagem = canto x0,y0,z=0 da peça),
      tamanho_m, ajuste }
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


def caixa_nao_verde(rgb):
    r, g, b = (rgb[..., i].astype(int) for i in range(3))
    obj = ~((g > 150) & (g > r + 60) & (g > b + 60))
    ys, xs = np.where(obj)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def transparente(im):
    """PNG com fundo transparente de verdade (pelo menos 5% da imagem quase invisível)."""
    if im.mode not in ("RGBA", "LA", "P"):
        return False
    a = np.asarray(im.convert("RGBA"))[..., 3]
    return (a < 128).mean() > 0.05


def main():
    gerado, guia_json = Path(sys.argv[1]), Path(sys.argv[2])
    guia = json.loads(guia_json.read_text(encoding="utf-8"))
    nome = sys.argv[sys.argv.index("--nome") + 1] if "--nome" in sys.argv else guia["nome"]
    espelhar = "--espelhar" in sys.argv
    lado = guia["lado_px"]
    guia_img = np.asarray(Image.open(guia_json.with_name(f"{guia['nome']}_guia.png")).convert("RGB"))
    gx0, gy0, gx1, gy1 = caixa_nao_verde(guia_img)

    original = Image.open(gerado)
    if transparente(original):
        arte = original.convert("RGBA")
        if espelhar:
            arte = arte.transpose(Image.FLIP_LEFT_RIGHT)
    else:
        with tempfile.TemporaryDirectory() as t:
            entrada = Path(t) / "entrada.png"
            im = original.convert("RGB")
            if espelhar:
                im = im.transpose(Image.FLIP_LEFT_RIGHT)
            im.save(entrada)
            limpo = Path(t) / "limpo.png"
            subprocess.run(["node", str(SK / "chroma-clean.mjs"), "clean", "--input", str(entrada), "--out", str(limpo),
                            "--keep-largest"], check=True, capture_output=True)
            arte = Image.open(limpo).convert("RGBA")
    a = np.asarray(arte)[..., 3] > 16
    ys, xs = np.where(a)
    ax0, ay0, ax1, ay1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
    recorte = arte.crop((ax0, ay0, ax1, ay1))
    # escala do gerado para o guia (o gerado costuma vir maior): estica a caixa da arte para a do guia
    sx, sy = (gx1 - gx0) / (ax1 - ax0), (gy1 - gy0) / (ay1 - ay0)
    if "--uniforme" in sys.argv or "--pela-largura" in sys.argv:
        f = sx if "--pela-largura" in sys.argv else sy  # peças baixas e largas: pela largura
        sx = sy = f
        nw, nh = max(1, round((ax1 - ax0) * f)), max(1, round((ay1 - ay0) * f))
        recorte = recorte.resize((nw, nh), Image.LANCZOS)
        px = round((gx0 + gx1) / 2 - nw / 2)
        gy0 = gy1 - nh  # base da arte na base do guia
        lado2 = max(lado, nw + 2 * abs(min(0, px)) + 4, px + nw + 4, gy1 + 4)
        if gy0 < 0:  # arte mais alta que a tela do guia: desce tudo
            guia["origem_px"] = [guia["origem_px"][0], guia["origem_px"][1] - gy0]
            gy1 -= gy0; gy0 = 0
            lado2 = max(lado2, gy1 + 4)
        tela = Image.new("RGBA", (lado2, lado2), (0, 0, 0, 0))
        desl = max(0, -px)  # se a arte passa da borda esquerda, aumenta a tela
        tela.alpha_composite(recorte, (px + desl, gy0))
        guia["origem_px"] = [guia["origem_px"][0] + desl, guia["origem_px"][1]]
    else:
        recorte = recorte.resize((gx1 - gx0, gy1 - gy0), Image.LANCZOS)
        tela = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
        tela.alpha_composite(recorte, (gx0, gy0))
    # corta a sobra transparente e corrige a origem
    bx0, by0, bx1, by1 = tela.getbbox()
    tela = tela.crop((bx0, by0, bx1, by1))
    origem = [round(guia["origem_px"][0] - bx0, 1), round(guia["origem_px"][1] - by0, 1)]
    PASTA.mkdir(parents=True, exist_ok=True)
    tela.save(PASTA / f"{nome}.png", optimize=True)
    cat_path = PASTA / "props.json"
    catalogo = json.loads(cat_path.read_text(encoding="utf-8")) if cat_path.exists() else {"versao": 1, "props": {}}
    catalogo["props"][nome] = {
        "arquivo": f"{nome}.png", "escala": guia["escala_guia"], "origem_px": origem,
        "tamanho_m": guia["tamanho_m"], "descricao": guia["descricao"],
        "ajuste": {"x": round(sx, 3), "y": round(sy, 3), "espelhado": espelhar,
                   "proporcao": round(sx / sy, 3)},
    }
    cat_path.write_text(json.dumps(catalogo, ensure_ascii=False, indent=2), encoding="utf-8")
    aviso = "" if "--uniforme" in sys.argv or "--pela-largura" in sys.argv or 0.93 <= sx / sy <= 1.07 else "  ATENÇÃO: a arte foi esticada de forma desigual (proporção fora de 7%)"
    print(f"{nome}: {tela.size[0]}x{tela.size[1]} px (escala {guia['escala_guia']}), ajuste x{sx:.2f} y{sy:.2f}{aviso}")


if __name__ == "__main__":
    main()
