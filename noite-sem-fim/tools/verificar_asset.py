#!/usr/bin/env python3
"""Confere se um arquivo de arte (ex.: gerado no Higgsfield) cumpre as regras técnicas de entrada do projeto.

Uso:
    python3 -I tools/verificar_asset.py arquivo.png [mais.png ...] [--altura-min 900] [--margem 16]
    python3 -I tools/verificar_asset.py --autoteste      # testa o próprio verificador com imagens sintéticas

Regras (provisórias, docs/pipeline_arte.md):
  1. PNG (sem perdas; JPEG/WebP com perdas não entram como fonte mestre)
  2. canal alpha real (RGBA) com fundo de fato transparente
  3. margem segura transparente em volta da figura (padrão 16 px)
  4. altura da figura >= altura mínima (padrão 900 px para fonte mestre)
  5. sem "halo" de fundo: no máximo 2% dos pixels são semitransparentes
Sai com código 0 se todos os arquivos passarem.
"""
import argparse
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image


def verificar(caminho, altura_min=900, margem=16):
    """Retorna lista de (regra, passou, detalhe)."""
    r = []
    im = Image.open(caminho)
    r.append(("PNG", im.format == "PNG", im.format))
    tem_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
    r.append(("canal alpha", tem_alpha, im.mode))
    if not tem_alpha:
        return r
    a = np.asarray(im.convert("RGBA"))[..., 3]
    transp = float((a == 0).mean())
    r.append(("fundo transparente", transp >= 0.2, "%.1f%% transparente" % (100 * transp)))
    ys, xs = np.where(a > 0)
    if len(ys) == 0:
        r.append(("figura presente", False, "imagem vazia"))
        return r
    folga = min(ys.min(), xs.min(), a.shape[0] - 1 - ys.max(), a.shape[1] - 1 - xs.max())
    r.append(("margem segura >= %d px" % margem, folga >= margem, "%d px" % folga))
    altura = int(ys.max() - ys.min() + 1)
    r.append(("altura da figura >= %d px" % altura_min, altura >= altura_min, "%d px" % altura))
    semi = float(((a > 0) & (a < 255)).sum()) / max(1, int((a > 0).sum()))
    r.append(("halo semitransparente <= 2%", semi <= 0.02, "%.2f%%" % (100 * semi)))
    return r


def _figura(tam, alpha=True, margem=40, halo=False):
    w, h = tam
    arr = np.zeros((h, w, 4), np.uint8)
    # Silhueta estreita (metade da largura útil), como um personagem de pé.
    x0 = max(margem, w // 4)
    arr[margem:h - margem, x0:w - x0] = (30, 30, 30, 255)
    if margem < w // 4:
        arr[margem:h - margem, margem:x0] = (30, 30, 30, 255)
    if halo:
        arr[margem - 10:margem, :, 3] = 128
        arr[margem - 10:margem, :, :3] = 200
    im = Image.fromarray(arr, "RGBA")
    return im if alpha else im.convert("RGB")


def autoteste():
    casos = [  # (nome, imagem, formato, deve_passar)
        ("figura boa", _figura((600, 1100)), "PNG", True),
        ("sem alpha", _figura((600, 1100), alpha=False), "PNG", False),
        ("figura baixa", _figura((300, 400)), "PNG", False),
        ("encostada na borda", _figura((600, 1100), margem=2), "PNG", False),
        ("com halo", _figura((600, 1100), halo=True), "PNG", False),
        ("JPEG", _figura((600, 1100), alpha=False), "JPEG", False),
    ]
    falhas = 0
    with tempfile.TemporaryDirectory() as d:
        for nome, im, fmt, esperado in casos:
            p = Path(d) / ("caso." + fmt.lower())
            im.save(p, fmt)
            passou = all(ok for _, ok, _ in verificar(p))
            ok = passou == esperado
            falhas += not ok
            print("%s  autoteste: %-20s esperado=%s obtido=%s" % (
                "PASSOU" if ok else "FALHOU", nome, "aceita" if esperado else "recusa", "aceita" if passou else "recusa"))
    print("RESULTADO autoteste: %s" % ("PASSOU" if not falhas else "FALHOU"))
    return 1 if falhas else 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("arquivos", nargs="*")
    ap.add_argument("--altura-min", type=int, default=900)
    ap.add_argument("--margem", type=int, default=16)
    ap.add_argument("--autoteste", action="store_true")
    a = ap.parse_args()
    if a.autoteste:
        return autoteste()
    status = 0
    for arq in a.arquivos:
        print("==", arq)
        for regra, ok, det in verificar(arq, a.altura_min, a.margem):
            print("  %s  %s (%s)" % ("PASSOU" if ok else "FALHOU", regra, det))
            status |= not ok
    return status


if __name__ == "__main__":
    sys.exit(main())
