#!/usr/bin/env python3
"""Kit para gerar a arte da PRAIA do minigame de surf no app do ChatGPT (vista de lado, da areia olhando o mar).

Uso (a partir de frontend/public/thelastdance/):
    python -I tools/kit_praia.py              # monta kit_chatgpt/praia/index.html (abrir no navegador)
    python -I tools/kit_praia.py --processar  # recorta o que estiver em kit_chatgpt/praia/prontas/ para
                                              # assets/maps/praia/ (folhas de 3 quadros viram _0, _1, _2)

A onda é animada: cada parte dela (crista quebrando, parede, espuma) vem numa FOLHA DE 3 QUADROS lado a lado,
do mesmo tamanho, que o jogo vai trocando (0 -> 1 -> 2 -> 0...). As outras peças são imagens únicas.
Fundo transparente; se vier sólido, peça verde puro #00FF00 (o --processar tira o verde).
"""
import html
import sys
from pathlib import Path

import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
KIT = RAIZ / "kit_chatgpt" / "praia"
SAIDA = RAIZ / "assets" / "maps" / "praia"

ESTILO_COMUM = ("high-resolution pixel art with crisp chunky pixels (each art pixel clearly visible, no blur, no "
                "anti-aliasing gradients), flat color bands for shading, a dark navy outline only where it helps "
                "readability, sunny tropical Brazilian beach palette (turquoise, teal, deep blue, warm sand, white foam), "
                "same finish as the reference images")

FOLHA3 = ("Make ONE image with THREE animation frames side by side, left to right, separated by a clear empty gap, "
          "every frame exactly the same size and the same framing, so they loop smoothly: frame 1 -> frame 2 -> "
          "frame 3 -> frame 1. Only the water motion changes between frames (small, smooth changes), the shape and "
          "position stay the same. ")

FUNDO_TRANSP = "PNG with a fully TRANSPARENT background (if transparency is not possible, use a flat pure green #00FF00 background). No text, no labels, no frame, no people, no surfers."

# nome, rótulo, tipo (folha3 | unica), formato, descrição
PEDIDOS = [
    ("onda_crista", "Crista da onda quebrando (3 quadros) — FAÇA ESTA PRIMEIRO", "folha3", "landscape",
     "THE BREAKING PART OF A WAVE seen from the SIDE (from the beach, like the first reference image): the wave travels "
     "to the RIGHT and breaks toward the LEFT. A tall turquoise wall of water whose top curls over and falls down to "
     "the LEFT as a hollow tube (a barrel: the lip throws forward and there is a dark hollow space inside the curl), "
     "with white foam exploding at the bottom left where the lip lands, spray flying off the top. The light shines "
     "through the thin upper part of the wave (lighter turquoise near the top, deep teal-blue at the bottom). "
     "Each frame shows the same curl a moment later: the lip curling, foam and spray moving."),
    ("onda_parede", "Parede da onda (textura, 3 quadros)", "folha3", "landscape",
     "a seamless, horizontally TILEABLE texture of the FACE of an ocean wave seen from the side: a wall of water "
     "filling the whole frame, lighter turquoise at the top (light through the water) going down to deep teal-blue "
     "at the bottom, with thin light horizontal streaks of water running along it and a few small foam flecks near "
     "the top edge. The left and right edges must match perfectly so it can repeat. Each frame: the streaks moved a "
     "little to the left. No curl, no sky, fills the whole frame edge to edge (no transparent area)."),
    ("onda_espuma", "Espuma da onda (3 quadros)", "folha3", "landscape",
     "a horizontally TILEABLE band of WHITEWATER (the foam of a wave that already broke), seen from the side: a "
     "rolling mass of white and light-blue foam, bubbly and lumpy on top, flat at the bottom, with small splashes. "
     "The left and right edges must match so it can repeat. Each frame: the foam churns and bubbles move."),
    ("prancha", "Prancha dele (a que ele surfa)", "unica", "landscape",
     "ONE SURFBOARD on its own (no surfer), lying perfectly HORIZONTAL, seen from the SIDE and a little from above "
     "(so the top deck shows as a thin strip): a 6-foot shortboard, white deck with a thin hot-pink stripe running "
     "along the rail from nose to tail (same board as the one stuck in the sand), the NOSE pointing to the RIGHT and "
     "slightly raised (rocker), the squash TAIL on the LEFT with three small dark fins under it and a coiled black "
     "leash cord at the tail. Clean dark navy outline, simple flat shading. It fills the width of the image, "
     "centered, no water, no shadow, no logos or text."),
    ("ceu_mar", "Fundo: céu e mar ao longe", "unica", "landscape",
     "a wide panoramic BACKGROUND: a bright sunny tropical sky with soft color bands (deep blue at the top to pale "
     "warm near the horizon), a few fluffy pixel clouds, and the calm open sea below the horizon (the horizon line at "
     "about one third from the top), with sparkles of the sun reflecting on the water. No waves breaking, no islands, "
     "no beach, no people. The left and right edges must match so it can repeat horizontally. It fills the whole "
     "image edge to edge."),
    ("ilhas", "Ilhas ao longe com farol", "unica", "landscape",
     "distant tropical islands on the horizon seen from far away: two low green-blue hills with a few palm trees "
     "and a small white-and-red LIGHTHOUSE on the right hill, slightly faded by distance (bluish). Only the islands "
     "sitting on a flat horizon line at the bottom of the image."),
    ("nuvens", "Nuvens (4 nuvens)", "unica", "landscape",
     "FOUR separate fluffy white cumulus clouds in a row, different sizes, with light gray-blue shading at the "
     "bottom, well separated from each other."),
    ("areia", "Areia em primeiro plano (faixa)", "unica", "landscape",
     "a horizontally TILEABLE strip of BEACH SAND seen from the side, in the foreground: at the top a thin line of "
     "wet darker sand with a lacy white foam line from the last wave, then warm dry golden sand going down, with "
     "small shells, footprints and grains. The left and right edges must match so it can repeat. It fills the whole "
     "width; the top edge is the shoreline."),
    ("guarda_sol", "Guarda-sol com toalha", "unica", "portrait",
     "a beach umbrella stuck in the sand (pink and white stripes, wooden pole) with a striped beach towel on the "
     "sand under it, seen from the side/front at eye level."),
    ("isopor", "Isopor com latinhas", "unica", "square",
     "a white-and-blue beach cooler (isopor) on the sand with two soda/beer cans and a bottle of water on top, no "
     "readable brand logos."),
    ("prancha_fincada", "Prancha fincada na areia", "unica", "portrait",
     "a white surfboard with a thin pink stripe standing upright, stuck nose-up in the sand, seen from the front, a "
     "small pile of sand at its base."),
    ("coqueiro", "Coqueiro (canto da tela)", "unica", "portrait",
     "a tall leaning coconut palm tree with coconuts, its trunk curving, seen from the side at eye level, as if at "
     "the edge of the beach."),
    ("cadeira_praia", "Cadeira de praia", "unica", "square",
     "a folding beach chair with blue and white striped fabric, seen from behind and slightly to the side, as if "
     "someone left it facing the sea."),
]


def texto_pedido(tipo, formato, desc):
    corpo = (FOLHA3 if tipo == "folha3" else "") + "THE ASSET: " + desc
    return (f"Use the style reference images from the start of this conversation.\n\n"
            f"2D side-view game asset for a pixel-art surf mini-game seen from the beach: {ESTILO_COMUM}.\n\n"
            f"{corpo}\n\n{formato.capitalize()} image. {'' if desc.endswith('edge to edge.') or 'no transparent area' in desc else FUNDO_TRANSP}").strip()


def montar():
    estilos = sorted((KIT / "estilo").glob("*.png"))
    primeira = ("These images are the ART STYLE REFERENCE for a series of game assets I will ask you for next, one per "
                "message: the pixel-art surf mini-game of a game set in Brazil (image 1 is the current beach scene, "
                "image 2 the surfer sprite, image 3 props already in the game: match that pixel size and finish). "
                "Everything is seen from the SIDE, from the sand, looking at the sea. Do not generate anything now, "
                "just confirm.")
    cartoes = []
    for i, (nome, rotulo, tipo, formato, desc) in enumerate(PEDIDOS, 1):
        texto = texto_pedido(tipo, formato, desc)
        selo = '<span class="selo">3 quadros</span>' if tipo == "folha3" else ""
        cartoes.append(f"""
<section class="cartao" id="{nome}">
  <h2><span class="num">{i}</span> {html.escape(rotulo)} {selo}</h2>
  <p class="como">Na mesma conversa, só cole o texto. Salve como <code>prontas/{nome}.png</code>
    <button class="copiar-nome" data-texto="{nome}.png">copiar nome do arquivo</button></p>
  <textarea readonly rows="8">{html.escape(texto)}</textarea>
  <button class="copiar">Copiar texto</button>
</section>""")
    imgs = "".join(f'<img src="estilo/{p.name}" alt="referência de estilo">' for p in estilos)
    pagina = f"""<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Kit ChatGPT — Praia (surf)</title>
<style>
:root {{ --fundo:#0d1b26; --cartao:#12293a; --borda:#2b6c8a; --texto:#eaf7ff; --sub:#a8cfe0; --rosa:#ff5ad8; }}
body {{ margin:0; background:var(--fundo); color:var(--texto); font:15px/1.5 system-ui, sans-serif; }}
main {{ max-width:960px; margin:0 auto; padding:20px 16px 60px; }}
h1 {{ font-size:24px; margin:0 0 6px; }} h2 {{ font-size:18px; margin:0 0 6px; }}
.passos, .cartao {{ background:var(--cartao); border:1px solid var(--borda); border-radius:14px; padding:14px 18px; margin:14px 0; }}
.passos li {{ margin:6px 0; }} code {{ background:#1d3d52; padding:1px 6px; border-radius:6px; }}
.estilos {{ display:flex; gap:10px; flex-wrap:wrap; margin:10px 0; }} .estilos img {{ height:110px; border-radius:8px; border:1px solid var(--borda); }}
.num {{ display:inline-grid; place-items:center; width:26px; height:26px; border-radius:50%; background:var(--rosa); color:#1a0820; font-size:14px; margin-right:4px; }}
.selo {{ font-size:12px; background:#2b6c8a; border-radius:999px; padding:2px 8px; vertical-align:middle; }}
.como {{ color:var(--sub); margin:0 0 8px; }}
textarea {{ width:100%; box-sizing:border-box; background:#08131b; color:#dff3ff; border:1px solid var(--borda); border-radius:8px; padding:8px; font:12.5px/1.45 ui-monospace, monospace; resize:vertical; }}
button {{ font:600 14px system-ui, sans-serif; color:#fff; background:#1f5f7d; border:1px solid var(--rosa); border-radius:9px; padding:8px 14px; cursor:pointer; margin-top:6px; }}
button.copiar-nome {{ background:transparent; border-color:var(--borda); font-weight:500; padding:2px 8px; font-size:12.5px; margin:0 0 0 6px; }}
button.ok {{ background:#1f8f4e; border-color:#3ddc84; }}
</style></head><body><main>
<h1>Kit ChatGPT — Praia do surf</h1>
<div class="passos"><ol>
  <li>Abra uma conversa nova no ChatGPT. Anexe as {len(estilos)} imagens da pasta <code>estilo/</code> (abaixo) e cole a primeira mensagem.</li>
  <li>Na MESMA conversa, uma peça por mensagem: só cole o texto da peça.</li>
  <li>As peças da <b>onda</b> vêm em <b>3 quadros lado a lado</b> (a animação). Se vierem desiguais (tamanho ou posição
      diferentes), peça: <i>"same size and same position in the 3 frames, only the water moves"</i>.</li>
  <li>Se o fundo não vier transparente, peça: <i>"make the background transparent"</i> (ou verde puro #00FF00).</li>
  <li>Salve em <code>prontas/</code> com o nome indicado. <b>Comece pela 1 (crista da onda)</b> e me mostre antes de fazer o resto.</li>
</ol>
<div class="estilos">{imgs}</div>
<textarea readonly rows="4">{html.escape(primeira)}</textarea>
<button class="copiar">Copiar primeira mensagem</button>
</div>
{''.join(cartoes)}
</main>
<script>
function copiar(b, texto) {{
  const fim = () => {{ const t = b.textContent; b.textContent = "Copiado!"; b.classList.add("ok"); setTimeout(() => {{ b.textContent = t; b.classList.remove("ok"); }}, 1400); }};
  if (navigator.clipboard) navigator.clipboard.writeText(texto).then(fim, () => {{ const ta = b.parentElement.querySelector("textarea"); ta.select(); document.execCommand("copy"); fim(); }});
}}
document.querySelectorAll("button.copiar").forEach((b) => b.addEventListener("click", () => copiar(b, b.parentElement.querySelector("textarea").value)));
document.querySelectorAll("button.copiar-nome").forEach((b) => b.addEventListener("click", () => copiar(b, b.dataset.texto)));
</script></body></html>"""
    (KIT / "index.html").write_text(pagina, encoding="utf-8")
    print(f"kit pronto: {KIT / 'index.html'} ({len(PEDIDOS)} pedidos)")


def sem_fundo(im):
    """transparência de verdade; se a imagem veio com fundo sólido verde (#00FF00), tira o verde"""
    a = np.asarray(im.convert("RGBA")).copy()
    if (a[..., 3] < 250).mean() > 0.02:
        return Image.fromarray(a)
    r, g, b = (a[..., i].astype(int) for i in range(3))
    verde = (g > 150) & (g > r + 60) & (g > b + 60)
    a[..., 3] = np.where(verde, 0, 255)
    return Image.fromarray(a)


def quadros(im, n=3):
    """divide a folha em n quadros pelas colunas vazias (ou em partes iguais, se não achar o vão)"""
    a = np.asarray(im)[..., 3] > 20
    cols = a.any(0)
    trechos, ini = [], None
    for x, c in enumerate(list(cols) + [False]):
        if c and ini is None:
            ini = x
        elif not c and ini is not None:
            if x - ini > im.width * 0.08:
                trechos.append((ini, x))
            ini = None
    if len(trechos) != n:
        w = im.width // n
        trechos = [(i * w, (i + 1) * w) for i in range(n)]
    out = [im.crop((x0, 0, x1, im.height)) for x0, x1 in trechos]
    alt = [q.getbbox() or (0, 0, q.width, q.height) for q in out]
    y0, y1 = min(b[1] for b in alt), max(b[3] for b in alt)  # mesma altura em todos (não pula)
    larg = max(q.width for q in out)
    return [q.crop((0, y0, larg, y1)) for q in out]


def processar():
    SAIDA.mkdir(parents=True, exist_ok=True)
    feitos = []
    for nome, _, tipo, _, desc in PEDIDOS:
        arq = KIT / "prontas" / f"{nome}.png"
        if not arq.exists():
            continue
        im = Image.open(arq)
        cheia = "edge to edge" in desc or "no transparent area" in desc
        im = im.convert("RGBA") if cheia else sem_fundo(im)
        if tipo == "folha3":
            for i, q in enumerate(quadros(im)):
                q.save(SAIDA / f"{nome}_{i}.png")
            print(nome, "-> 3 quadros", quadros(im)[0].size)
        else:
            b = im.getbbox() if not cheia else None
            (im.crop(b) if b else im).save(SAIDA / f"{nome}.png")
            print(nome, "->", (im.crop(b) if b else im).size)
        feitos.append(nome)
    faltam = [p[0] for p in PEDIDOS if p[0] not in feitos]
    print(f"{len(feitos)} prontas; faltam {len(faltam)}: {', '.join(faltam) or 'nenhuma'}")


if __name__ == "__main__":
    for fluxo in (sys.stdout, sys.stderr):
        fluxo.reconfigure(encoding="utf-8")
    (processar if "--processar" in sys.argv else montar)()
