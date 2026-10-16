#!/usr/bin/env python3
"""Vídeo de caminhada no lugar (fundo verde) -> 1 ciclo de N quadros -> prancha 4×3 para a skill animated-spritesheets.

Uso (a partir de frontend/public/thelastdance/):
    python3 -I tools/video_para_sprites.py <video.mp4> <pasta_saida> [--quadros 8] [--acao walk]
        [--periodo-min 6] [--periodo P]

1. Extrai todos os quadros (ffmpeg) e separa o personagem do fundo verde.
2. Acha o PERÍODO do ciclo: o intervalo k em que a silhueta volta a ser igual (maior IoU médio entre t e t+k).
   Funciona de frente, de costas e de perfil (não depende de qual pé é qual).
   ATENÇÃO: um múltiplo do período (2 ciclos) também "fecha" o laço. Confira o ciclo.json e as pernas; se o
   vídeo deu passos curtos, use --periodo-min menor ou force --periodo.
3. Escolhe o trecho de 1 ciclo no MEIO do vídeo (o começo e o fim tendem a ficar parados) cujo fechamento
   (quadro t × t+k) é o mais parecido, e tira N quadros igualmente espaçados dele.
4. Monta uma prancha 4×3 (mesmo recorte para todos os quadros, para não perder o movimento) e chama
   process-sheet.mjs da skill: tira o fundo, recupera os pixels, normaliza, empacota e faz a conferência (QC).
Grava ciclo.json com o período, os quadros escolhidos e a nota de fechamento do laço.
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

SKILL = Path.home() / ".claude/skills/animated-spritesheets/scripts"


def mascara(a):
    a = a.astype(int)
    return ~((a[..., 1] > 150) & (a[..., 1] > a[..., 0] + 60) & (a[..., 1] > a[..., 2] + 60))


def iou(a, b):
    return float((a & b).sum() / max(1, (a | b).sum()))


def main():
    video, saida = Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve()
    n = int(sys.argv[sys.argv.index("--quadros") + 1]) if "--quadros" in sys.argv else 8
    acao = sys.argv[sys.argv.index("--acao") + 1] if "--acao" in sys.argv else "walk"
    saida.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(video), f"{tmp}/q_%04d.png"], check=True)
        arqs = sorted(Path(tmp).glob("q_*.png"))
        quadros = [np.asarray(Image.open(f).convert("RGB")) for f in arqs]
    ms = [mascara(q) for q in quadros]
    # reduz para comparar rápido, recortando na caixa do personagem
    ys, xs = np.where(np.any(ms, 0))
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    peq = [m[y0:y1:4, x0:x1:4] for m in ms]
    T = len(peq)
    # período: maior IoU médio entre t e t+k, para k entre 12 e T/2 (no trecho do meio)
    meio = slice(T // 6, T - T // 6)
    idx = list(range(T))[meio]
    notas = {}
    kmin = int(sys.argv[sys.argv.index("--periodo-min") + 1]) if "--periodo-min" in sys.argv else 12
    for k in range(kmin, T // 2):
        pares = [(t, t + k) for t in idx if t + k < T]
        if len(pares) > 5:
            notas[k] = float(np.mean([iou(peq[a], peq[b]) for a, b in pares]))
    periodo = max(notas, key=notas.get)
    if "--periodo" in sys.argv:
        periodo = int(sys.argv[sys.argv.index("--periodo") + 1])
        notas.setdefault(periodo, float("nan"))
    # início: no trecho do meio, o t cujo laço (t vs t+período) fecha melhor
    candidatos = [t for t in idx if t + periodo < T]
    t0 = max(candidatos, key=lambda t: iou(peq[t], peq[t + periodo]))
    escolhidos = [t0 + round(i * periodo / n) for i in range(n)]
    print(f"quadros no vídeo: {T} | período: {periodo} quadros (IoU {notas[periodo]:.3f}) | início {t0} | "
          f"escolhidos {escolhidos}", flush=True)
    # prancha 4×3 com o mesmo recorte para todos
    m = 40
    H, W = ms[0].shape
    cy0, cy1, cx0, cx1 = max(0, y0 - m), min(H, y1 + m), max(0, x0 - m), min(W, x1 + m)
    cw, ch = cx1 - cx0, cy1 - cy0
    prancha = Image.new("RGB", (cw * 4, ch * 3), (0, 255, 0))
    for k, t in enumerate(escolhidos):
        prancha.paste(Image.fromarray(quadros[t][cy0:cy1, cx0:cx1]), ((k % 4) * cw, (k // 4) * ch))
    caminho_prancha = saida / "prancha_do_video.png"
    prancha.save(caminho_prancha)
    r = subprocess.run(["node", str(SKILL / "process-sheet.mjs"), str(caminho_prancha), "--action", acao,
                        "--rows", "3", "--cols", "4", "--frames", str(n), "--out-dir", str(saida)],
                       capture_output=True, text=True, encoding="utf-8")
    print(r.stdout.strip()[-400:], r.stderr.strip()[-400:], sep="\n")
    (saida / "ciclo.json").write_text(json.dumps({
        "video": video.name, "quadros_video": T, "periodo": periodo, "nota_periodo": round(notas[periodo], 4),
        "inicio": t0, "escolhidos": escolhidos, "fechamento_laco": round(iou(peq[t0], peq[t0 + periodo]), 4),
    }, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
