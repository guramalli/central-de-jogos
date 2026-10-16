#!/usr/bin/env python3
"""Monta poses do boneco de recorte em PNG (alta resolução), folha de sprites ou GIF — fora do navegador.

Uso (a partir de frontend/public/thelastdance/):
    python3 -I tools/exportar_recorte.py <anim> <t1,t2,...|quadros:N> <saida.png|saida.gif> [--altura PX] [--cores]
                                         [--rig PASTA --anims ARQUIVO.js --vista NOME --altura-fonte PX]

  --altura        altura do personagem na saída (padrão 1000 px)
  --cores         pinta cada peça de uma cor (para achar emendas e pedaços soltos)
  --rig/--anims/--vista  outro personagem (padrão: o protagonista do piloto)
  --altura-fonte  altura do personagem no desenho-fonte (padrão 1510 do piloto)
As matrizes vêm de tools/poses_recorte.js (as mesmas contas do jogo), então o resultado é igual ao do canvas.
"""
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw

RAIZ = Path(__file__).resolve().parent.parent
PASTA = RAIZ / "assets/characters/protagonist/recorte/v01"
ALTURA_FONTE = 1510
CORES = [(230, 25, 75), (60, 180, 75), (255, 225, 25), (0, 130, 200), (245, 130, 48), (145, 30, 180),
         (70, 240, 240), (240, 50, 230), (210, 245, 60), (250, 190, 212), (0, 128, 128)]


def poses(anim, quais, pasta=PASTA, arq_anim=None, vista=None):
    extra = [str(arq_anim), vista] if arq_anim else []
    r = subprocess.run(["node", str(RAIZ / "tools/poses_recorte.js"), str(pasta), anim, quais] + extra,
                       capture_output=True, text=True, check=True, encoding="utf-8")
    return json.loads(r.stdout)


def montar(rig, imagens, pose, altura, cores=False, altura_fonte=ALTURA_FONTE):
    e = altura / altura_fonte
    larg, alt = int(altura * 1.25), int(altura * 1.12)
    ox, oy = larg / 2, alt - altura * 0.04  # pés perto da base, centralizados
    tela = Image.new("RGBA", (larg, alt), (0, 0, 0, 0))
    for i, p in enumerate(rig["pecas"]):
        opac = pose.get("alfas", {}).get(p["nome"], 1)
        if opac <= 0:
            continue
        a, b, c, d, ex, fy = pose["pecas"][p["nome"]]
        # matriz final: tela = E · M · T(origem); PIL quer a inversa (tela -> imagem da peça)
        x0, y0 = p["origem"]
        A, B, C, D = e * a, e * b, e * c, e * d
        E = e * (a * x0 + c * y0 + ex) + ox
        F = e * (b * x0 + d * y0 + fy) + oy
        det = A * D - B * C
        inv = (D / det, -C / det, (C * F - D * E) / det, -B / det, A / det, (B * E - A * F) / det)
        img = imagens[p["nome"]]
        if cores:
            cor = Image.new("RGBA", img.size, CORES[i % len(CORES)] + (255,))
            img = Image.blend(img, cor, 0.5)
            img.putalpha(imagens[p["nome"]].getchannel("A"))
        if opac < 1:
            img = img.copy()
            img.putalpha(img.getchannel("A").point(lambda v: int(v * opac)))
        camada = img.transform((larg, alt), Image.AFFINE, inv, resample=Image.BICUBIC)
        tela.alpha_composite(camada)
    return tela


def main():
    argv = sys.argv[1:]
    altura = 1000
    opcoes = {}
    for chave in ("--rig", "--anims", "--vista", "--altura-fonte"):
        if chave in argv:
            i = argv.index(chave)
            opcoes[chave] = argv[i + 1]
            del argv[i:i + 2]
    if "--altura" in argv:
        i = argv.index("--altura")
        altura = int(argv[i + 1])
        del argv[i:i + 2]
    args = [a for a in argv if not a.startswith("--")]
    if len(args) != 3:
        sys.exit(__doc__)
    anim, quais, saida = args
    cores = "--cores" in sys.argv
    pasta = Path(opcoes["--rig"]) if "--rig" in opcoes else PASTA
    alt_fonte = float(opcoes.get("--altura-fonte", ALTURA_FONTE))
    rig = json.loads((pasta / "rig.json").read_text(encoding="utf-8"))
    imagens = {p["nome"]: Image.open(pasta / p["arquivo"]).convert("RGBA") for p in rig["pecas"]}
    lista = poses(anim, quais, pasta, opcoes.get("--anims"), opcoes.get("--vista"))
    quadros = [montar(rig, imagens, ps, altura, cores, alt_fonte) for ps in lista]
    saida = Path(saida)
    if saida.suffix == ".gif":
        fundo = (42, 15, 61, 255)
        gif = []
        for q in quadros:
            bg = Image.new("RGBA", q.size, fundo)
            bg.alpha_composite(q)
            gif.append(bg.convert("RGB").quantize(colors=255))
        ms = int(1000 * lista[0]["duracao"] / len(lista))
        gif[0].save(saida, save_all=True, append_images=gif[1:], duration=ms, loop=0)
    else:  # folha horizontal, com o t de cada quadro
        w, h = quadros[0].size
        folha = Image.new("RGBA", (w * len(quadros), h + 30), (42, 15, 61, 255))
        d = ImageDraw.Draw(folha)
        for i, (q, ps) in enumerate(zip(quadros, lista)):
            folha.alpha_composite(q, (i * w, 30))
            d.text((i * w + 10, 8), f"{anim} t={ps['t']:.2f}", fill=(255, 255, 255, 255))
        folha.save(saida)
    print("ok", saida, len(quadros), "quadro(s)")


if __name__ == "__main__":
    main()
