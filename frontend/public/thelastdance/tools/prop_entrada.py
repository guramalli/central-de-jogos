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
- --faces: para peças em forma de caixa que se repetem lado a lado (balcão, vitrine): acha os 6 cantos do
  contorno da arte e encaixa CADA face (tampo, frente, lateral) no lugar exato da caixa do guia. Assim módulos
  vizinhos se emendam sem degrau, mesmo quando o gerador desenhou a peça com proporções internas diferentes.
  --emenda (junto com --faces): corta o contorno da ponta x = 0, para módulos repetidos não mostrarem uma linha.
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
from PIL import Image, ImageDraw, ImageFilter

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


def homografia(saida, entrada):
    """Coeficientes do Image.PERSPECTIVE do Pillow: ponto da imagem de saída -> ponto da imagem de entrada."""
    A, b = [], []
    for (x, y), (u, v) in zip(saida, entrada):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.append(u)
        A.append([0, 0, 0, x, y, 1, -v * x, -v * y]); b.append(v)
    return tuple(np.linalg.solve(np.array(A, float), np.array(b, float)))


def cantos_caixa(alfa):
    """Os 6 cantos do contorno de uma caixa isométrica (A topo, B direita-cima, C direita-baixo, D base,
    E esquerda-baixo, F esquerda-cima): ponto mais distante em cada direção entre as normais das arestas."""
    ys, xs = np.where(alfa)
    p = np.stack([xs, ys], 1).astype(float)
    k = 1 + 5 ** -0.5
    direcoes = {"A": (0, -1), "B": (k, -2 * 5 ** -0.5), "C": (k, 2 * 5 ** -0.5), "D": (0, 1),
                "E": (-k, 2 * 5 ** -0.5), "F": (-k, -2 * 5 ** -0.5)}
    cantos = {}
    for nome, d in direcoes.items():
        proj = p @ np.array(d) / np.hypot(*d)
        cantos[nome] = p[proj >= proj.max() - 1.5].mean(0)
    A, B, C, D, F = (cantos[n] for n in "ABCDF")
    cantos["G"] = ((F + B - A) + (D + B - C)) / 2  # canto da frente do tampo (escondido no contorno)
    return cantos


def encaixe_por_faces(arte, guia, lado, emenda=False):
    c = guia["caixas"][0]
    X, Y, Z = c["x"][1] - c["x"][0], c["y"][1] - c["y"][0], c["z"][1] - c["z"][0]
    e, (ox, oy) = guia["escala_guia"], guia["origem_px"]
    T = lambda x, y, z: (ox + (x - y) * 72 * e, oy + ((x + y) * 36 - z * 100) * e)  # noqa: E731
    k = cantos_caixa(np.asarray(arte)[..., 3] > 16)
    # Emenda: a ponta x = 0 fica encostada no módulo anterior; corta o contorno escuro dela (alguns px da arte)
    # para os módulos se juntarem sem uma linha entre eles.
    corte = 6.0 if emenda else 0.0
    for ponta, rumo in (("A", "B"), ("F", "G"), ("E", "D")):
        v = k[rumo] - k[ponta]
        k[ponta] = k[ponta] + v / np.hypot(*v) * corte
    faces = {  # (cantos na arte, cantos no guia)
        "tampo": ("ABGF", [T(0, 0, Z), T(X, 0, Z), T(X, Y, Z), T(0, Y, Z)]),
        "frente": ("FGDE", [T(0, Y, Z), T(X, Y, Z), T(X, Y, 0), T(0, Y, 0)]),
        "lateral": ("BCDG", [T(X, 0, Z), T(X, 0, 0), T(X, Y, 0), T(X, Y, Z)]),
    }
    tela = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
    for nome, (letras, alvo) in faces.items():
        m = homografia(alvo, [tuple(k[l]) for l in letras])
        face = arte.transform((lado, lado), Image.PERSPECTIVE, m, Image.BICUBIC)
        regiao = list(alvo)
        if nome == "tampo":  # o tampo leva junto o que está em cima dele (porta-guardanapo, registradora...)
            h = 0.6 * 100 * e
            a, b_, g, f = alvo
            regiao = [f, (f[0], f[1] - h), (a[0], a[1] - h), (b_[0], b_[1] - h), b_, g]
        mascara = Image.new("L", (lado, lado), 0)
        ImageDraw.Draw(mascara).polygon(regiao, fill=255)
        tela.paste(face, (0, 0), mascara.filter(ImageFilter.MaxFilter(5)))
    return tela


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
    if "--faces" in sys.argv:
        tela = encaixe_por_faces(arte, guia, lado, emenda="--emenda" in sys.argv)
        sx = sy = 1.0
    elif "--uniforme" in sys.argv or "--pela-largura" in sys.argv:
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
    aviso = "" if "--uniforme" in sys.argv or "--pela-largura" in sys.argv or "--faces" in sys.argv or 0.93 <= sx / sy <= 1.07 else "  ATENÇÃO: a arte foi esticada de forma desigual (proporção fora de 7%)"
    print(f"{nome}: {tela.size[0]}x{tela.size[1]} px (escala {guia['escala_guia']}), ajuste x{sx:.2f} y{sy:.2f}{aviso}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")  # acentos nas mensagens, mesmo com a saída redirecionada
    main()
