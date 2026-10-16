#!/usr/bin/env python3
"""Gera o GUIA DE FORMA de uma peça do mapa: caixas cinzas no ângulo/escala exatos do jogo, sobre fundo verde.

Uso (a partir de frontend/public/thelastdance/):
    python3 -I tools/guia_props.py <nome> <pasta_saida> [--escala 2]

O guia vai junto como imagem de referência para o gerador de imagem pintar a peça POR CIMA da forma certa:
a arte já sai do tamanho da colisão, no ângulo 2:1 do mapa. Também grava <nome>.json com o ponto da imagem
onde fica a origem da peça (canto x0, y0, z = 0) — é o que o jogo usa para encaixar a arte no lugar.

Projeção igual a js/maps/iso.js: 1 m = 144 px de largura de losango (72 de altura), 1 m de altura = 100 px.
Faces: topo claro, frente-direita (x = x1) média, frente-esquerda (y = y1) escura — luz vindo do alto à direita.
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

LARG, ALT, VERT = 144, 72, 100

# Peças do piloto: caixas relativas à origem da peça (metros). A primeira caixa define o tamanho/colisão.
PECAS = {
    "cama": {
        "descricao": "cama de casal com cabeceira encostada na parede do fundo (lado y = 0)",
        "caixas": [
            {"x": (0, 1.9), "y": (0, 2.1), "z": (0, 0.55)},        # colchão/base (colisão)
            {"x": (0, 1.9), "y": (0, 0.1), "z": (0.55, 1.05)},     # cabeceira (sobre a base)
        ],
    },
    "armario": {
        "descricao": "guarda-roupa alto encostado na parede do fundo (y = 0), portas viradas para +y",
        "caixas": [{"x": (0, 0.9), "y": (0, 0.6), "z": (0, 2.1)}],
    },
    "criado_mudo": {
        "descricao": "criado-mudo baixo ao lado da cama, encostado na parede do fundo (y = 0)",
        "caixas": [{"x": (0, 0.5), "y": (0, 0.45), "z": (0, 0.55)}],
    },
    "mesa_computador": {
        "descricao": "mesa encostada na parede da frente-direita (x = 0,7), com monitor virado para dentro do quarto (-x)",
        "caixas": [
            {"x": (0, 0.7), "y": (0, 1.6), "z": (0, 0.75)},        # tampo/mesa (colisão)
            {"x": (0.5, 0.62), "y": (0.3, 1.3), "z": (0.75, 1.3)},  # monitor (de costas para a câmera)
        ],
    },
    "cadeira": {
        "descricao": "cadeira de escritório virada para a mesa (+x), encosto do lado x = 0",
        "caixas": [
            {"x": (0, 0.5), "y": (0, 0.5), "z": (0, 0.5)},          # assento (colisão)
            {"x": (0, 0.1), "y": (0.03, 0.47), "z": (0.5, 1.05)},   # encosto
        ],
    },
    "roupas_chao": {
        "descricao": "roupas e um tênis jogados no chão, bem baixos",
        "caixas": [{"x": (0, 0.8), "y": (0, 0.6), "z": (0, 0.08)}],
    },
    "planta": {
        "descricao": "planta em vaso, alta",
        "caixas": [{"x": (0, 0.45), "y": (0, 0.45), "z": (0, 1.2)}],
    },
    "sofa": {
        "descricao": "sofá de 3 lugares virado para a TV (para -x): da câmera vemos o ENCOSTO (lado x1) e o assento atrás dele",
        "caixas": [
            {"x": (0, 0.9), "y": (0, 2.6), "z": (0, 0.45)},        # base/assento (colisão)
            {"x": (0.65, 0.9), "y": (0, 2.6), "z": (0.45, 0.85)},  # encosto (lado da câmera)
            {"x": (0, 0.65), "y": (0, 0.2), "z": (0.45, 0.65)},    # braço
            {"x": (0, 0.65), "y": (2.4, 2.6), "z": (0.45, 0.65)},  # braço
        ],
    },
    "rack": {
        "descricao": "rack baixo de TV encostado na parede da esquerda (x = 0), frente virada para +x",
        "caixas": [{"x": (0, 0.45), "y": (0, 2.2), "z": (0, 0.5)}],
    },
    "mesa_lateral": {
        "descricao": "mesinha lateral pequena e baixa",
        "caixas": [{"x": (0, 0.5), "y": (0, 0.5), "z": (0, 0.5)}],
    },
    "mesa_redonda": {
        "descricao": "mesa de jantar redonda preta com pé central",
        "caixas": [{"x": (0, 1.1), "y": (0, 1.1), "z": (0, 0.75)}],
    },
    "poltrona": {
        "descricao": "poltrona/cadeira estofada cinza, arredondada (serve em qualquer lado da mesa)",
        "caixas": [{"x": (0, 0.55), "y": (0, 0.55), "z": (0, 0.85)}],
    },
    "aparador": {
        "descricao": "aparador cinza encostado na parede do fundo (y = 0), frente virada para +y",
        "caixas": [{"x": (0, 1.5), "y": (0, 0.45), "z": (0, 0.85)}],
    },
    "luminaria": {
        "descricao": "luminária de piso acobreada, alta e fina",
        "caixas": [{"x": (0, 0.3), "y": (0, 0.3), "z": (0, 1.6)}],
    },
    "parede_2m": {
        "descricao": "trecho de parede do fundo com 2 m de largura e 2,7 m de altura (plano y = 0, de frente para o jogador)",
        "caixas": [
            {"x": (0, 2.0), "y": (-0.15, 0), "z": (0, 2.7)},
        ],
    },
}

CORES = {"topo": (205, 205, 210), "dir": (150, 150, 158), "esq": (105, 105, 114), "linha": (40, 40, 48)}


def tela(x, y, z, e):
    return ((x - y) * LARG / 2 * e, ((x + y) * ALT / 2 - z * VERT) * e)


def faces(c, e):
    (x0, x1), (y0, y1), (z0, z1) = c["x"], c["y"], c["z"]
    T = lambda x, y, z: tela(x, y, z, e)  # noqa: E731
    return [
        ("esq", [T(x0, y1, z0), T(x1, y1, z0), T(x1, y1, z1), T(x0, y1, z1)]),
        ("dir", [T(x1, y0, z0), T(x1, y1, z0), T(x1, y1, z1), T(x1, y0, z1)]),
        ("topo", [T(x0, y0, z1), T(x1, y0, z1), T(x1, y1, z1), T(x0, y1, z1)]),
    ]


def ordem_desenho(caixas):
    """Atrás antes (mesma regra do jogo, js/maps/iso.js): A antes de B se A.x1 <= B.x0 ou A.y1 <= B.y0;
    empate (caixas empilhadas) pela altura da base."""
    restantes, saida = list(caixas), []
    while restantes:
        for c in sorted(restantes, key=lambda k: (k["z"][0], k["x"][0] + k["y"][0])):
            bloqueada = any(o is not c and (o["x"][1] <= c["x"][0] + 1e-9 or o["y"][1] <= c["y"][0] + 1e-9)
                            and not (c["x"][1] <= o["x"][0] + 1e-9 or c["y"][1] <= o["y"][0] + 1e-9)
                            for o in restantes)
            if not bloqueada:
                break
        restantes.remove(c)
        saida.append(c)
    return saida


def main():
    nome, saida = sys.argv[1], Path(sys.argv[2])
    e = float(sys.argv[sys.argv.index("--escala") + 1]) if "--escala" in sys.argv else 2.0
    peca = PECAS[nome]
    pts = [p for c in peca["caixas"] for _, f in faces(c, e) for p in f]
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    margem = 0.22  # folga em volta (a arte pode ter detalhes um pouco além da caixa)
    w, h = max(xs) - min(xs), max(ys) - min(ys)
    lado = int(max(w, h) * (1 + 2 * margem))
    ox = (lado - w) / 2 - min(xs)
    oy = (lado - h) / 2 - min(ys)
    im = Image.new("RGB", (lado, lado), (0, 255, 0))
    d = ImageDraw.Draw(im)
    for c in ordem_desenho(peca["caixas"]):
        for nome_face, poli in faces(c, e):
            d.polygon([(x + ox, y + oy) for x, y in poli], fill=CORES[nome_face], outline=CORES["linha"])
    saida.mkdir(parents=True, exist_ok=True)
    im.save(saida / f"{nome}_guia.png")
    c0 = peca["caixas"][0]
    info = {"nome": nome, "descricao": peca["descricao"], "escala_guia": e, "lado_px": lado,
            "origem_px": [round(ox, 1), round(oy, 1)],  # onde cai (0,0,0) da peça, no guia
            "tamanho_m": [c0["x"][1] - c0["x"][0], c0["y"][1] - c0["y"][0], c0["z"][1] - c0["z"][0]],
            "caixas": peca["caixas"]}
    (saida / f"{nome}_guia.json").write_text(json.dumps(info, ensure_ascii=False, indent=2), encoding="utf-8")
    print(nome, "guia", lado, "x", lado, "origem", info["origem_px"])


if __name__ == "__main__":
    main()
