#!/usr/bin/env python3
"""Recorta a prancha de caminhada em 4 direções (personagem v2) e gera os sprites do jogo.

Uso (a partir de frontend/public/thelastdance/):
    python3 -I tools/sprites_v2.py

Lê   reference/personagem_v2/sprites_4dir_v2.png  (grade 4 linhas × 3 colunas, fundo degradê; não altera)
     linhas: baixo (de frente), esquerda, direita, cima (de costas); colunas: passo A, passo B, parado
Gera assets/characters/personagem_v2/sprites/<direção>_<0|1|2>.png  (RGBA, todos do mesmo tamanho)
     assets/characters/personagem_v2/sprites/sprites.json            (pivô dos pés, ciclos, tempos)
     docs/acceptance/sprites_v2/folha_normalizada.png                 (conferência)

Passos: fundo degradê sai por inundação a partir das bordas da célula (pixels lisos e não escuros; o contorno
preto segura); a elipse do chão sai pela cor (bege quente, ligada ao fundo); a franja marrom do brilho do fundo
sai da borda; cada direção é reescalada para o quadro PARADO ter ALTURA px (a prancha desenhou cada linha de
um tamanho); os quadros são alinhados pelos pés e pelo centro da cabeça (estável durante o passo).
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as nd

RAIZ = Path(__file__).resolve().parent.parent
PRANCHA = RAIZ / "reference/personagem_v2/sprites_4dir_v2.png"
SAIDA = RAIZ / "assets/characters/personagem_v2/sprites"
CONFERENCIA = RAIZ / "docs/acceptance/sprites_v2"

COLUNAS = [(7, 509), (515, 1019), (1025, 1527)]
LINHAS = {"baixo": (7, 287), "esquerda": (294, 542), "direita": (547, 784), "cima": (790, 1015)}
ALTURA = 240                    # altura do personagem parado no jogo, em px
TELA = (200, 262)               # tamanho de todos os quadros
PES = (100, 252)                # onde ficam os pés (meio da cabeça na vertical dos pés) dentro do quadro


def maior(f):
    r, n = nd.label(f)
    return r == 1 + int(np.argmax(nd.sum(f, r, range(1, n + 1)))) if n else f


def mascara_celula(rgb, lum, sat, grad):
    """Máscara do personagem numa célula."""
    r_, g_, b_ = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    # 1) fundo degradê: liso e não escuro, ligado à borda
    rot, _ = nd.label((grad < 22) & (lum > 34))
    borda = set(np.unique(np.concatenate([rot[0], rot[-1], rot[:, 0], rot[:, -1]]))) - {0}
    f = maior(nd.binary_opening(~np.isin(rot, list(borda)), iterations=2))
    f = nd.binary_fill_holes(f)
    ys = np.where(f.any(1))[0]
    topo, base = ys.min(), ys.max()
    # 2) elipse do chão: bege quente na faixa dos pés, ligada ao fundo (em camadas)
    zona = np.zeros_like(f)
    zona[base - int((base - topo) * 0.22):] = True
    piso = zona & (r_ > g_) & (g_ >= b_ - 3) & (sat >= 20) & (sat <= 80) & (lum >= 70) & (lum <= 215)
    for _ in range(3):
        fora = nd.binary_dilation(~f)
        rot, _ = nd.label(piso & f)
        toca = set(np.unique(rot[fora & piso & f])) - {0}
        if not toca:
            break
        f &= ~np.isin(rot, list(toca))
    # 3) franja marrom do brilho do fundo grudada no contorno
    d = nd.distance_transform_edt(f)
    for _ in range(2):  # o brilho chega a ~6 px; o cabelo (marrom saturado) e o contorno preto ficam
        d = nd.distance_transform_edt(f)
        f &= ~((d <= 4) & (sat < 55) & (lum > 36) & (lum < 150) & (r_ >= b_))
    # 4) fundo que ficou preso (entre as pernas), agora aberto para fora
    bgl = (grad < 22) & (lum > 34) & (sat < 60) & f
    rot, _ = nd.label(bgl)
    toca = set(np.unique(rot[nd.binary_dilation(~f) & bgl])) - {0}
    f &= ~np.isin(rot, [i for i in toca if (rot == i).sum() > 30])
    f = maior(nd.binary_opening(f, iterations=1))
    buracos, nb = nd.label(nd.binary_fill_holes(f) & ~f)
    for i in range(1, nb + 1):
        if (buracos == i).sum() < 150:
            f |= buracos == i
    return f


def main():
    rgb = np.asarray(Image.open(PRANCHA).convert("RGB")).astype(float)
    lum = rgb @ np.array([0.299, 0.587, 0.114])
    sat = rgb.max(2) - rgb.min(2)
    g = nd.gaussian_filter(lum, 1)
    grad = np.hypot(nd.sobel(g, 1), nd.sobel(g, 0))
    SAIDA.mkdir(parents=True, exist_ok=True)
    CONFERENCIA.mkdir(parents=True, exist_ok=True)

    info = {"versao": 1, "fonte": "reference/personagem_v2/sprites_4dir_v2.png", "tamanho": list(TELA),
            "pes": list(PES), "altura": ALTURA, "quadros": {}, "escala_por_direcao": {},
            # passo A, parado, passo B, parado: o quadro parado serve de "passagem" entre os passos
            "ciclos": {d: [f"{d}_0", f"{d}_2", f"{d}_1", f"{d}_2"] for d in LINHAS},
            "duracoes_ms": [160, 110, 160, 110], "parado": {d: f"{d}_2" for d in LINHAS}}
    folha = Image.new("RGBA", (TELA[0] * 3, TELA[1] * 4), (42, 15, 61, 255))
    dr = ImageDraw.Draw(folha)
    for li, (direcao, (y0, y1)) in enumerate(LINHAS.items()):
        cel = []
        for x0, x1 in COLUNAS:
            sl = (slice(y0, y1 + 1), slice(x0, x1 + 1))
            cel.append((sl, mascara_celula(rgb[sl], lum[sl], sat[sl], grad[sl])))
        alt_parado = np.ptp(np.where(cel[2][1].any(1))[0]) + 1
        esc = ALTURA / alt_parado
        info["escala_por_direcao"][direcao] = round(float(esc), 4)
        for k, (sl, f) in enumerate(cel):
            ys, xs = np.where(f)
            by0, by1 = ys.min(), ys.max()
            cab = f[by0:by0 + int((by1 - by0) * 0.4)]
            cx = (np.where(cab.any(0))[0].min() + np.where(cab.any(0))[0].max()) / 2
            alfa = Image.fromarray((f * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
            img = Image.fromarray(rgb[sl].astype(np.uint8)).convert("RGBA")
            img.putalpha(alfa)
            img = img.crop((0, 0, img.width, by1 + 1))
            img = img.resize((round(img.width * esc), round(img.height * esc)), Image.LANCZOS)
            quadro = Image.new("RGBA", TELA, (0, 0, 0, 0))
            quadro.alpha_composite(img, (round(PES[0] - cx * esc), round(PES[1] - img.height)))
            nome = f"{direcao}_{k}"
            quadro.save(SAIDA / f"{nome}.png", optimize=True)
            info["quadros"][nome] = f"{nome}.png"
            folha.alpha_composite(quadro, (k * TELA[0], li * TELA[1]))
            dr.line([(k * TELA[0], li * TELA[1] + PES[1]), ((k + 1) * TELA[0] - 4, li * TELA[1] + PES[1])],
                    fill=(255, 80, 200, 255))
            dr.text((k * TELA[0] + 4, li * TELA[1] + 4), nome, fill=(255, 255, 255, 255))
    (SAIDA / "sprites.json").write_text(json.dumps(info, ensure_ascii=False, indent=2), encoding="utf-8")
    folha.save(CONFERENCIA / "folha_normalizada.png")
    print("ok:", len(info["quadros"]), "quadros | escala por direção:", info["escala_por_direcao"])


if __name__ == "__main__":
    main()
