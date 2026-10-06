"""Gera a mídia da vitrine da Lenda do Campinho a partir do material da loja
(C:/Users/gh0st/Projects/lenda-steam/loja): capas e logo em webp leves, as
capturas (grandes e miniaturas), a imagem de compartilhamento (OG), o pôster
e os trailers em 720p, e o kit de imprensa (logo PNG + ZIP).

Uso:  python frontend/tools/vitrine_lenda.py [--loja CAMINHO] [--sem-video]

Cada imagem tem um limite de peso: a qualidade baixa aos poucos (e, se
precisar, a largura) até caber. Rodar de novo sobrescreve tudo.
"""
import argparse
import io
import os
import subprocess
import zipfile

from PIL import Image
import imageio_ffmpeg

AQUI = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.normpath(os.path.join(AQUI, "..", "public"))
JOGO_A = os.path.join(PUBLIC, "lenda-do-campinho", "a")
VIT = os.path.join(PUBLIC, "lenda")
CAPTURAS = ["00_inicio", "01_toquio", "02_lava", "03_guardiao", "04_historia", "05_clube", "06_agencia", "07_vila"]
KB, MB = 1024, 1024 * 1024
LOGO_CORTE = (137, 40, 1143, 680)  # área útil do library_logo_1280x720.png

LEIA_ME = """LENDA DO CAMPINHO — KIT DE IMPRENSA / PRESS KIT
Educação Gamer · https://www.educacaogamer.com.br/lenda/

PT — Um RPG de futebol para toda a família! Comece no campinho da vila,
drible criaturas, enfrente chefões nas arenas, jogue a temporada pelo seu
clube e viaje pelo mundo inteiro. Grátis para jogar, em português e inglês.

EN — A soccer RPG for the whole family! Start on the village dirt pitch,
dribble past creatures, face bosses in the arenas, play the season for your
club and travel the whole world. Free to play, in Portuguese and English.

Contato / Contact: guramalli@gmail.com
© 2026 Educação Gamer. Todos os direitos reservados. All rights reserved.
"""


def rel(p):
    return os.path.relpath(p, PUBLIC).replace("\\", "/")


def webp(src, dst, largura, limite_kb, q=82, corte=None):
    im = Image.open(src)
    if corte:
        im = im.crop(corte)
    im = im.convert("RGBA") if im.mode in ("RGBA", "LA", "P") else im.convert("RGB")
    w = largura
    while w >= 400:
        atual = im if im.width <= w else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        for qual in range(q, 49, -4):
            buf = io.BytesIO()
            atual.save(buf, "WEBP", quality=qual, method=6)
            if buf.tell() <= limite_kb * KB:
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                with open(dst, "wb") as f:
                    f.write(buf.getvalue())
                print(f"{rel(dst):48} {atual.size[0]}x{atual.size[1]}  q{qual}  {buf.tell() // KB} KB")
                return
        w = int(w * 0.85)
    raise SystemExit(f"{dst}: não coube em {limite_kb} KB")


def og(src, dst, limite_kb=240):
    im = Image.open(src).convert("RGB")
    alvo = 1200 / 630
    w, h = im.size
    if w / h > alvo:  # corta dos lados, puxando pro centro-direita (garoto e bola)
        nw = round(h * alvo)
        x = min(w - nw, max(0, round(w * 0.55 - nw / 2)))
        im = im.crop((x, 0, x + nw, h))
    else:
        nh = round(w / alvo)
        y = min(h - nh, max(0, round(h * 0.4 - nh / 2)))
        im = im.crop((0, y, w, y + nh))
    im = im.resize((1200, 630), Image.LANCZOS)
    for qual in range(86, 49, -4):
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=qual, optimize=True, progressive=True)
        if buf.tell() <= limite_kb * KB:
            with open(dst, "wb") as f:
                f.write(buf.getvalue())
            print(f"{rel(dst):48} 1200x630  q{qual}  {buf.tell() // KB} KB")
            return
    raise SystemExit(f"{dst}: não coube em {limite_kb} KB")


def video(src, dst, limite_mb=14):
    exe = imageio_ffmpeg.get_ffmpeg_exe()
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    for crf in (26, 28, 30, 32):
        subprocess.run([exe, "-y", "-loglevel", "error", "-i", src, "-vf", "scale=-2:720",
                        "-c:v", "libx264", "-preset", "slow", "-crf", str(crf), "-pix_fmt", "yuv420p",
                        "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", dst], check=True)
        tam = os.path.getsize(dst)
        if tam <= limite_mb * MB:
            print(f"{rel(dst):48} 720p  crf{crf}  {tam / MB:.1f} MB")
            return
    raise SystemExit(f"{dst}: não coube em {limite_mb} MB")


def kit(loja):
    pasta = os.path.join(VIT, "imprensa")
    os.makedirs(pasta, exist_ok=True)
    logo_png = os.path.join(pasta, "logo.png")
    Image.open(os.path.join(loja, "steam", "library_logo_1280x720.png")).crop(LOGO_CORTE).save(logo_png, "PNG", optimize=True)
    print(f"{rel(logo_png):48} {os.path.getsize(logo_png) // KB} KB")
    zp = os.path.join(pasta, "lenda-do-campinho-kit-imprensa.zip")
    with zipfile.ZipFile(zp, "w", zipfile.ZIP_DEFLATED) as z:
        z.write(logo_png, "logo/lenda-do-campinho-logo.png")
        z.write(os.path.join(loja, "arte", "logo_letreiro.png"), "logo/lenda-do-campinho-logo-fundo-escuro.png")
        for nome in ("capa_horizontal", "capa_vertical", "capa_panoramica"):
            buf = io.BytesIO()
            Image.open(os.path.join(loja, "arte", nome + ".png")).convert("RGB").save(buf, "JPEG", quality=90, optimize=True)
            z.writestr(f"capas/{nome}.jpg", buf.getvalue())
        for n in CAPTURAS:
            z.write(os.path.join(loja, "capturas", n + ".jpg"), f"capturas/{n}.jpg")
        z.writestr("LEIA-ME.txt", LEIA_ME)
    print(f"{rel(zp):48} {os.path.getsize(zp) / MB:.1f} MB")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--loja", default="C:/Users/gh0st/Projects/lenda-steam/loja")
    ap.add_argument("--sem-video", action="store_true")
    a = ap.parse_args()
    L = a.loja
    webp(os.path.join(L, "arte", "capa_horizontal.png"), os.path.join(JOGO_A, "capa.webp"), 2560, 440)
    webp(os.path.join(L, "arte", "capa_vertical.png"), os.path.join(JOGO_A, "capa_vertical.webp"), 1200, 250)
    # card da Lenda no Início do site (v2/LendaDestaque.jsx): a capa num tamanho de card
    webp(os.path.join(L, "arte", "capa_horizontal.png"), os.path.join(VIT, "a", "capa_card.webp"), 1400, 210)
    webp(os.path.join(L, "steam", "library_logo_1280x720.png"), os.path.join(VIT, "a", "logo.webp"), 1006, 115, q=90, corte=LOGO_CORTE)
    webp(os.path.join(L, "previa_pagina", "trailer_poster.jpg"), os.path.join(VIT, "a", "poster.webp"), 1280, 140)
    og(os.path.join(L, "arte", "capa_horizontal.png"), os.path.join(VIT, "a", "og.jpg"))
    for n in CAPTURAS:
        src = os.path.join(L, "capturas", n + ".jpg")
        webp(src, os.path.join(VIT, "a", f"cap_{n}.webp"), 1280, 190, q=80)
        webp(src, os.path.join(VIT, "a", f"cap_{n}_p.webp"), 640, 65, q=78)
    if not a.sem_video:
        for lang in ("pt", "en"):
            video(os.path.join(L, "trailer", f"trailer_{lang}.mp4"), os.path.join(VIT, "video", f"trailer_{lang}.mp4"))
    kit(L)


if __name__ == "__main__":
    main()
