#!/usr/bin/env python3
"""Caminhada de FRENTE (sul), no lugar, para o sprite em pixel art — sem gerar arte nova.

Uso (a partir de frontend/public/thelastdance/):
    python3 -I tools/pixel_andar_frente.py <sprite_nativo.png> <pasta_saida> [--escala 3]

Entrada: o sprite na resolução NATIVA (1 pixel do desenho = 1 pixel da imagem), fundo transparente
(recuperado com o pixel-snapper da skill animated-spritesheets).
Saída: <pasta_saida>/frame-01..08.png (já ampliados por --escala, vizinho mais próximo) + recorte.json.

Como anima (recorte em pixels inteiros, nada é redesenhado):
- separa perna esquerda e direita da tela (abaixo do quadril), braço esquerdo e direito, e o resto (corpo);
- ciclo de 8 quadros a 10 qps (padrão "walk" da skill): contato, sobe, passagem, desce — e o outro lado;
- a perna que dá o passo sobe até 3 px; o corpo desce 1 px no contato e sobe 1 px na passagem;
- os braços balançam 1 px, opostos às pernas; desenho: pernas atrás do corpo, braços na frente.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as nd

# Quadros: (sobe perna esq. da tela, sobe perna dir. da tela, corpo y, braço esq. y, braço dir. y)
# y positivo = para baixo. Primeira metade: passo da perna esquerda da tela; segunda: da direita.
CICLO = [
    (0, 0, 1, 0, 0),    # 1 contato (corpo baixo)
    (2, 0, 0, 0, 1),    # 2 perna esq. sobe; braço dir. vai à frente
    (3, 0, -1, 0, 1),   # 3 passagem (corpo alto)
    (1, 0, 0, 0, 0),    # 4 desce
    (0, 0, 1, 0, 0),    # 5 contato
    (0, 2, 0, 1, 0),    # 6 perna dir. sobe; braço esq. vai à frente
    (0, 3, -1, 1, 0),   # 7 passagem
    (0, 1, 0, 0, 0),    # 8 desce
]
DURACAO_MS = 100


def partes(a):
    """Máscaras das partes, achadas pelo próprio desenho."""
    alfa = a[..., 3] > 0
    H, W = alfa.shape
    ys, xs = np.where(alfa)
    topo, base = ys.min(), ys.max()
    altura = base - topo + 1
    # vão entre as pernas: coluna transparente mais central na faixa baixa
    faixa = alfa[base - int(altura * 0.12):base - int(altura * 0.04)]
    centro_x = (xs.min() + xs.max()) / 2
    vazias = [x for x in range(W) if not faixa[:, x].any() and abs(x - centro_x) < W * 0.15]
    vao = int(round(np.mean(vazias))) if vazias else int(centro_x)
    # início das pernas: primeira linha (de cima) em que o vão aparece
    inicio = base
    for y in range(base, topo, -1):
        if alfa[y, vao]:
            inicio = y + 1
            break
    # braços: componentes fora da largura do tronco/calça na altura das mãos
    linha_quadril = inicio - 3
    larg_calca = np.where(alfa[inicio + 2])[0]
    calca_x0, calca_x1 = larg_calca.min(), larg_calca.max()
    yy, xx = np.mgrid[:H, :W]
    perna_esq = alfa & (yy >= inicio - 4) & (xx <= vao)   # começa sob o quadril: o corpo sobe 1 px sem abrir vão
    perna_dir = alfa & (yy >= inicio - 4) & (xx > vao)
    zona_bracos = alfa & (yy < inicio + 2) & (yy > topo + altura * 0.5)
    braco_esq = zona_bracos & (xx < calca_x0 - 1)
    braco_dir = zona_bracos & (xx > calca_x1 + 1)
    # completa cada braço com a parte conectada acima (ombro/manga fica no corpo: corta na manga)
    for m in (braco_esq, braco_dir):
        rot, n = nd.label(m)
        if n > 1:
            maior = 1 + int(np.argmax(nd.sum(m, rot, range(1, n + 1))))
            m &= rot == maior
    # o quadril (3 linhas acima do início das pernas) fica no corpo E nas pernas: sobreposição que impede
    # vão quando o corpo sobe/desce 1 px ou a perna sobe
    corpo = alfa & ~((perna_esq | perna_dir) & (yy >= inicio)) & ~braco_esq & ~braco_dir
    info = {"vao_x": vao, "inicio_pernas_y": int(inicio), "calca_x": [int(calca_x0), int(calca_x1)],
            "quadril_y": int(linha_quadril), "tamanho": [W, H]}
    return {"perna_esq": perna_esq, "perna_dir": perna_dir, "corpo": corpo,
            "braco_esq": braco_esq, "braco_dir": braco_dir}, info


def colar(destino, a, mascara, dy):
    """Cola os pixels da máscara deslocados dy (inteiro) por cima do destino."""
    H = a.shape[0]
    ys, xs = np.where(mascara)
    ny = ys + dy
    ok = (ny >= 0) & (ny < H)
    destino[ny[ok], xs[ok]] = a[ys[ok], xs[ok]]


def main():
    entrada, saida = Path(sys.argv[1]), Path(sys.argv[2])
    escala = int(sys.argv[sys.argv.index("--escala") + 1]) if "--escala" in sys.argv else 3
    a = np.asarray(Image.open(entrada).convert("RGBA")).copy()
    a[..., 3] = np.where(a[..., 3] > 127, 255, 0)
    m, info = partes(a)
    # margem: 4 px em cima (corpo sobe) e embaixo
    pad = 4
    a = np.pad(a, ((pad, pad), (pad, pad), (0, 0)))
    m = {k: np.pad(v, pad) for k, v in m.items()}
    saida.mkdir(parents=True, exist_ok=True)
    for i, (pe, pd, cy, be, bd) in enumerate(CICLO, 1):
        q = np.zeros_like(a)
        colar(q, a, m["perna_esq"], -pe)          # pernas primeiro (ficam atrás do quadril)
        colar(q, a, m["perna_dir"], -pd)
        colar(q, a, m["corpo"], cy)
        for k, b in (("braco_esq", be), ("braco_dir", bd)):  # braços acompanham o corpo + balanço próprio
            if b:
                colar(q, a, m[k], cy)     # por baixo, na posição do corpo: tapa o furo de 1 px na manga
            colar(q, a, m[k], cy + b)
        im = Image.fromarray(q, "RGBA")
        im = im.resize((im.width * escala, im.height * escala), Image.NEAREST)
        im.save(saida / f"frame-{i:02d}.png")
    info.update({"quadros": len(CICLO), "duracao_ms": DURACAO_MS, "escala": escala, "margem_px": pad,
                 "ciclo": CICLO})
    (saida / "recorte.json").write_text(json.dumps(info, indent=2), encoding="utf-8")
    # conferência das partes (cada uma de uma cor)
    cores = {"perna_esq": (230, 60, 60), "perna_dir": (60, 120, 230), "corpo": (90, 200, 90),
             "braco_esq": (240, 200, 40), "braco_dir": (200, 80, 220)}
    vis = np.zeros(a.shape[:2] + (3,), np.uint8) + 40
    for k, c in cores.items():
        vis[m[k]] = (np.array(c) * 0.55 + a[m[k]][:, :3] * 0.45).astype(np.uint8)
    Image.fromarray(vis).resize((vis.shape[1] * 6, vis.shape[0] * 6), Image.NEAREST).save(saida / "partes.png")
    print("ok", info)


if __name__ == "__main__":
    main()
