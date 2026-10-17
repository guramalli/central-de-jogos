#!/usr/bin/env python3
"""Roupa entregue como FOLHA DE PEÇAS SOLTAS (3 linhas x 4 colunas, fundo xadrez):
    linha 1 = tronco, linha 2 = quadril + coxas, linha 3 = canelas (em par na frente e nas costas);
    colunas = frente, costas, lado (virado para a direita), lado (virado para a esquerda).
Cada peça é encaixada (escala e posição) na peça do corpo correspondente do manequim, e sai no formato do kit de
molde, em DUAS roupas: a parte de cima (tronco) e a parte de baixo (pernas) — o guarda-roupa troca cada uma à parte.

Uso (a partir de frontend/public/thelastdance/):
    python -I tools/roupa_folha.py <folha.png> <pasta_saida> <id_base> [<kit da regata>]  (roupa sem manga:
        os braços saem do kit de uma regata, que já são pele)
        -> <pasta_saida>/<id_base>_cima/1_frente/roupa_tronco.png ... e <pasta_saida>/<id_base>_calca/...
    depois, na pasta frontend:
        node scripts/importar-roupa.mjs <pasta_saida>/<id_base>_cima --id <id_base>_cima --nome "..."
        node scripts/importar-roupa.mjs <pasta_saida>/<id_base>_calca --id <id_base>_calca --nome "..."
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as nd

sys.path.insert(0, str(Path(__file__).resolve().parent))
from folha_personagem import fundo  # noqa: E402  (tira o xadrez de "transparente" que o gerador pinta)
from roupa_ia import PASTAS, mascaras, rig  # noqa: E402

COLUNAS = ["frente", "costas", "lado_direito", "lado_esquerdo"]  # 3º desenho = de perfil olhando para a direita


def pecas_da_folha(caminho):
    a = np.asarray(Image.open(caminho).convert("RGB"))
    f, _ = fundo(a)
    obj = nd.binary_opening(~f, iterations=2)
    rot, n = nd.label(obj)
    tam = nd.sum(obj, rot, range(1, n + 1))
    H, W = obj.shape
    rgba = np.dstack([a, np.where(obj, 255, 0).astype(np.uint8)])
    grade = {}
    caixas = nd.find_objects(rot)
    for k in range(1, n + 1):
        if tam[k - 1] < 1500:
            continue
        sl = caixas[k - 1]
        cy = (sl[0].start + sl[0].stop) / 2 / H
        cx = (sl[1].start + sl[1].stop) / 2 / W
        linha = 0 if cy < 0.38 else 1 if cy < 0.63 else 2
        col = min(3, int(cx * 4))
        so = rgba[sl].copy()
        so[..., 3] = np.where(rot[sl] == k, so[..., 3], 0)
        # resto do xadrez grudado na borda (cinza claro, sem cor): some — a roupa em si é escura
        rgb = so[..., :3].astype(int)
        claro_sem_cor = (rgb.mean(-1) > 150) & ((rgb.max(-1) - rgb.min(-1)) < 35)
        borda = ~nd.binary_erosion(so[..., 3] > 0, iterations=8)
        so[..., 3] = np.where(claro_sem_cor & borda, 0, so[..., 3])
        # e a beirada de 2 px (mistura do contorno com o xadrez): o importador desenha o contorno de novo
        so[..., 3] = np.where(nd.binary_erosion(so[..., 3] > 0, iterations=2), so[..., 3], 0)
        grade.setdefault((linha, col), []).append((sl[1].start, Image.fromarray(so)))
    out = {k: [im for _, im in sorted(v, key=lambda t: t[0])] for k, v in grade.items() if k[0] < 2}
    # canelas: 6 peças em ordem da esquerda para a direita = par da frente, par de costas, lado esq., lado dir.
    canelas = [im for _, im in sorted((t for k, v in grade.items() if k[0] == 2 for t in v), key=lambda t: t[0])]
    if len(canelas) != 6:
        raise SystemExit(f"esperava 6 canelas na linha de baixo, achei {len(canelas)}")
    out[(2, 0)], out[(2, 1)], out[(2, 2)], out[(2, 3)] = canelas[0:2], canelas[2:4], canelas[4:5], canelas[5:6]
    return out


def caixa(m):
    ys, xs = np.where(m)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def encaixar(peca, alvo, folga=0.04, recorte=None):
    """estica a peça na caixa da máscara-alvo (com uma folguinha) e corta pelo contorno do corpo (dilatado)"""
    W, H = rig()["canvas"]
    x0, y0, x1, y1 = caixa(alvo)
    fx, fy = (x1 - x0) * folga, (y1 - y0) * folga
    x0, y0, x1, y1 = int(x0 - fx), int(y0 - fy), int(x1 + fx), int(y1 + fy)
    tela = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    tela.alpha_composite(peca.resize((x1 - x0, y1 - y0), Image.LANCZOS), (x0, y0))
    if recorte is not None:
        arr = np.asarray(tela).copy()
        arr[..., 3] = np.where(nd.binary_dilation(recorte, iterations=10), arr[..., 3], 0)
        tela = Image.fromarray(arr)
    return tela


def cobrir(tela, mascara):
    """o que a peça do corpo tem e a roupa não cobriu (pontinhos do jeans/camiseta de baixo) ganha a cor da roupa
    mais próxima: nada da roupa de baixo aparece por baixo desta"""
    arr = np.asarray(tela).copy()
    coberto = arr[..., 3] > 128
    if not coberto.any():
        return tela
    falta = mascara & ~coberto
    # a cor vem de dentro da roupa (longe da beirada, que é mais clara/acinzentada)
    fonte = nd.binary_erosion(coberto, iterations=4)
    if not fonte.any():
        fonte = coberto
    _, (iy, ix) = nd.distance_transform_edt(~fonte, return_indices=True)
    arr[falta, :3] = arr[iy[falta], ix[falta], :3]
    arr[falta, 3] = 255
    return Image.fromarray(arr)


def main():
    folha, saida, base = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3]
    g = pecas_da_folha(folha)
    for (l, c), v in sorted(g.items()):
        print(f"linha {l + 1}, coluna {c + 1}: {len(v)} peça(s)")
    for col, vista in enumerate(COLUNAS):
        m, _ = mascaras(vista)
        cima = saida / f"{base}_cima" / PASTAS[vista]
        baixo = saida / f"{base}_calca" / PASTAS[vista]
        cima.mkdir(parents=True, exist_ok=True); baixo.mkdir(parents=True, exist_ok=True)
        cobrir(encaixar(g[(0, col)][0], m["tronco"], recorte=m["tronco"]), m["tronco"]).save(cima / "roupa_tronco.png")
        canelas = g[(2, col)]
        if vista in ("frente", "costas"):
            coxas = m["coxa_esq"] | m["coxa_dir"]
            pernas = np.asarray(encaixar(g[(1, col)][0], coxas, folga=0.07, recorte=coxas)).copy()
            # divide as pernas no meio das duas coxas
            ce, cd = (caixa(m[n]) for n in ("coxa_esq", "coxa_dir"))
            meio = int(((ce[0] + ce[2]) / 2 + (cd[0] + cd[2]) / 2) / 2)
            esq_a_esquerda = (ce[0] + ce[2]) < (cd[0] + cd[2])
            for nome, lado_esq in (("coxa_esq", esq_a_esquerda), ("coxa_dir", not esq_a_esquerda)):
                p = pernas.copy()
                if lado_esq: p[:, meio:, 3] = 0
                else: p[:, :meio, 3] = 0
                cobrir(Image.fromarray(p), m[nome]).save(baixo / f"roupa_{nome}.png")
            # canelas em par: a da esquerda da folha vai na canela que está mais à esquerda na tela
            alvos = sorted(("canela_esq", "canela_dir"), key=lambda n: caixa(m[n])[0])
            for peca, nome in zip(canelas, alvos):
                cobrir(encaixar(peca, m[nome], folga=0.12, recorte=m[nome]), m[nome]).save(baixo / f"roupa_{nome}.png")
        else:  # laterais: o importador cria sozinho a perna "de lá" escurecida
            cobrir(encaixar(g[(1, col)][0], m["coxa"], folga=0.07, recorte=m["coxa"]), m["coxa"]).save(baixo / "roupa_coxa.png")
            cobrir(encaixar(canelas[0], m["canela"], folga=0.12, recorte=m["canela"]), m["canela"]).save(baixo / "roupa_canela.png")
        braco = Path(sys.argv[4]) / PASTAS[vista] if len(sys.argv) > 4 else None  # kit de uma regata (braços de pele)
        if braco and braco.exists():
            for f in braco.glob("roupa_*.png"):
                if "tronco" not in f.name:
                    Image.open(f).save(cima / f.name)
    print("ok:", saida)


if __name__ == "__main__":
    main()
