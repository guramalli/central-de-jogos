#!/usr/bin/env python3
"""Kit para gerar a arte de um mapa no app do ChatGPT (sem API): guias, referências de estilo e textos prontos.

Uso (a partir de frontend/public/thelastdance/):
    python -I tools/kit_chatgpt.py padaria              # monta kit_chatgpt/padaria/ (abrir index.html)
    python -I tools/kit_chatgpt.py padaria --processar  # encaixa no jogo tudo o que estiver em prontas/

Fluxo: o jogador abre index.html, manda as referências de estilo uma vez numa conversa do ChatGPT e, para cada
peça, anexa o guia (quando tem) e cola o texto. Salva a imagem em prontas/<nome>.png. Depois --processar passa
cada arquivo pelo encaixe certo (tools/prop_entrada.py para peças, tools/textura_plana.py para planas).
A pasta kit_chatgpt/ não vai para o git (.gitignore): é material de trabalho.
"""
import html
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
FERR = RAIZ / "tools"

# Instruções comuns. As peças (com guia) usam o guia de forma de tools/guia_props.py; as planas não têm guia.
PECA = """Use the gray-block image I attached in THIS message as an exact SHAPE GUIDE, and the style references from the start of this conversation.

Draw ONE isometric game prop for a 2D isometric pixel-art game (2:1 dimetric projection), high-resolution pixel art with crisp chunky pixels and a dark navy/black outline, cozy late-night palette (warm lamp light, small magenta/violet neon accents), same look as the reference props.

SHAPE GUIDE (most important): the gray blocks show the EXACT isometric angle and proportions of the prop. Paint the prop so it fills exactly that silhouette: same outline, same angle, same proportions. Do not rotate it, mirror it or change the viewing angle. The lightest gray face is the top, the medium gray face is the front-right side, the darkest gray face is the front-left side; keep that lighting (light from the upper right).

THE PROP: {desc}

Output: a PNG with a fully TRANSPARENT background. Only the prop: no floor, no room, no ground shadow, no text, no labels, no frame, no people."""

PLANA = """Use the style references from the start of this conversation.

Pixel-art game asset, high-resolution pixel art with crisp chunky pixels and a dark navy/black outline, cozy late-night palette (warm lamp light, small magenta/violet neon accents). Seen perfectly FRONT-ON (flat, straight-on, NOT isometric, no perspective). No people.

THE ASSET: {desc}

{fundo}"""

FUNDO_CHEIO = "It fills the whole image edge to edge ({formato} image). No border, no frame around it, no background."
FUNDO_TRANSP = "{formato} image, PNG with a fully TRANSPARENT background around the object. No wall, no frame, no other text."

KITS = {
    "padaria": {
        "titulo": "Padaria",
        "contexto": "this set is a Brazilian bakery, a \"padaria\" open 24h",
        "estilo": [  # (arquivo no kit, origem, recorte opcional (x0, y0, x1, y1) em px da origem)
            ("estilo_1_padaria_moodboard.png", "reference/kit_v1.0/02_mapas/moodboard_locais.png", (1098, 372, 1536, 660)),
            ("estilo_2_apartamento_moodboard.png", "reference/kit_v1.0/02_mapas/moodboard_locais.png", (0, 662, 478, 1018)),
            ("estilo_3_pecas_do_jogo.png", "montagem", ["sofa", "cama", "armario", "planta", "mesa_redonda", "poltrona", "aparador"]),
        ],
        "pedidos": [
            # nome, rótulo, tipo (peca|parede|piso|decal), descrição, opções do encaixe
            ("balcao_modulo", "Balcão (módulo) — FAÇA ESTE PRIMEIRO", "peca",
             "one module (1.3 m long, waist-high) of a Brazilian bakery (padaria) counter. The customer side is the DARKEST "
             "front-left face: a front panel of small cream ceramic tiles with a thin stainless-steel kick plate at the bottom. "
             "On top a polished dark granite countertop with just a napkin holder. The medium-gray right end is a plain panel. "
             "Several modules will stand side by side.", ["--faces", "--emenda"]),
            ("vitrine_doces", "Vitrine de doces (módulo)", "peca",
             "one module (1.3 m long) of a refrigerated glass pastry display case of a Brazilian bakery. The curved glass front is "
             "the DARKEST front-left face; inside, on two lit shelves: brigadeiros, slices of cake, sonhos (cream donuts), pudim, "
             "tiny white price tags. Stainless-steel base. The medium-gray right end is a glass side panel.", ["--faces", "--emenda"]),
            ("caixa_registradora", "Caixa (registradora)", "peca",
             "the cashier counter of a Brazilian bakery: a counter whose front panel is the DARKEST front-left face; on top (the "
             "small block of the guide) an old cash register, next to it a card machine and a little bowl of mints.", ["--faces"]),
            ("maquina_cafe", "Máquina de café", "peca",
             "a small cabinet with a chrome espresso machine on top (two group heads, steam wand), a stack of small white coffee "
             "cups and a jar of sugar. Its front faces the DARKEST front-left face.", []),
            ("chapa", "Chapa", "peca",
             "a stainless-steel griddle station (chapa): a flat hot griddle on top with two buttered French rolls (pão na chapa) "
             "and a spatula, a steel cabinet below. Its front is the DARKEST front-left face.", ["--faces"]),
            ("estufa_salgados", "Estufa de salgados", "peca",
             "a heated glass display case (estufa) on a small counter, warm orange inner light, full of Brazilian salgados: "
             "coxinhas, esfihas, pão de queijo, risoles. The glass front is the DARKEST front-left face.", []),  # frente curva: o encaixe por faces entorta; esticar inteira fica melhor
            ("forno_pao", "Forno de pão", "peca",
             "a tall stainless-steel bakery oven with a glass door showing warm light and loaves of pão francês inside, a control "
             "panel at the top. The door is on the DARKEST front-left face.", ["--faces"]),
            ("geladeira_bebidas", "Geladeira de bebidas", "peca",
             "a tall drinks refrigerator with two glass doors, cold white inner light, shelves full of soda cans, guaraná bottles, "
             "beer bottles and water. The glass doors are on the MEDIUM-gray front-right face (the long side of the guide).", ["--faces"]),
            ("banqueta", "Banqueta do balcão", "peca",
             "a tall round bar stool: chrome pole, round red vinyl seat, a footrest ring. No backrest.", ["--uniforme"]),
            ("mesa_bistro", "Mesa pequena", "peca",
             "a small square bakery table with a white marble-look top on a single black metal pedestal leg; on top a napkin "
             "holder and a small sugar dispenser.", ["--pela-largura"]),
            ("mesa_grande", "Mesa grande (4 lugares)", "peca",
             "a rectangular bakery table for four with a white marble-look top on black metal legs; on top a napkin holder, a "
             "sugar dispenser and two empty coffee cups.", ["--pela-largura"]),
            ("cadeira_bistro", "Cadeira (de frente)", "peca",
             "a simple bakery café chair: black metal frame, wooden seat and wooden backrest. The backrest is at the BACK (the far "
             "side, the thin upright block of the guide); the seat faces the viewer, toward the lower-left.", ["--uniforme"]),
            ("cadeira_bistro_costas", "Cadeira (de costas)", "peca",
             "the same bakery café chair (black metal frame, wooden seat and backrest) seen from BEHIND: the backrest is the thin "
             "upright block on the NEAR right side of the guide, so we see the back of the backrest; the seat faces away, toward "
             "the upper-left.", ["--uniforme"]),
            ("lixeira", "Lixeira", "peca",
             "a stainless-steel pedal trash bin with a lid.", ["--uniforme"]),
            ("parede_padaria", "Parede (textura)", "parede",
             "a seamless wall texture for a Brazilian bakery, 2 m wide by 3 m tall: the bottom 47% is small square white/cream "
             "ceramic wall tiles (azulejo) with gray grout, topped by a thin decorative tile border; above it the wall is painted "
             "warm muted yellow-beige with a subtle pixel texture. No objects, no text. It must tile seamlessly left-right.",
             ["--largura-m", "2", "--altura-m", "3"]),
            ("piso_padaria", "Piso (textura)", "piso",
             "a seamless tileable top-down floor texture: classic Brazilian bakery floor of small square ceramic tiles in a black "
             "and white checkerboard, 8 by 8 tiles, slightly worn, thin gray grout. Seen from directly above. No objects.",
             ["--metros", "2"]),
            ("prateleira_paes", "Prateleira de pães", "decal",
             "wooden wall shelves (three shelves) full of bread: pão francês in a wire basket, baguettes, sweet bread loaves, "
             "bread in paper bags.", ["--sem-fundo"]),
            ("cardapio_padaria", "Cardápio", "decal",
             "a chalkboard menu in a wooden frame with handwritten chalk text in Portuguese: title \"CARDÁPIO\", then "
             "\"Pingado ... R$ 6\", \"Pão na chapa ... R$ 8\", \"Misto quente ... R$ 14\", \"Coxinha ... R$ 9\", "
             "\"Pão de queijo ... R$ 5\". Text must be spelled exactly.", ["--sem-fundo"]),
            ("neon_padaria", "Letreiro neon PADARIA", "decal",
             "a glowing neon sign: hot pink/magenta neon tube letters \"PADARIA\" and below, smaller, cyan neon \"24H\", on a "
             "thin dark backboard, soft glow. Text must be spelled exactly.", ["--sem-fundo"]),
            ("porta_banheiro", "Porta do banheiro", "decal",
             "a closed bathroom door: wooden door painted dark teal, a small white sign \"BANHEIRO\" with a toilet icon, a metal "
             "handle, a thin door frame.", []),
            ("porta_rua", "Porta da rua", "decal",
             "a glass shop entrance door with an aluminum frame; through the glass a dark city street at night with a streetlight; "
             "a small sticker \"ABERTO 24H\" on the glass.", []),
            ("vitrine_rua", "Vitrine para a rua", "decal",
             "a big shop window seen from inside, aluminum frame; through the glass a city street at night: wet asphalt, a parked "
             "car, a streetlight, neon reflections. No text.", []),
        ],
        # cópias que não se geram: (nome, de, guia, opções)
        "derivados": [("cadeira_bistro_lado", "cadeira_bistro", "cadeira_bistro_lado", ["--espelhar", "--uniforme"])],
    },
    "garagem": {
        "titulo": "Garagem e elevador do prédio",
        "contexto": "this set is the underground parking garage of his apartment building and the inside of its elevator",
        "estilo": [
            ("estilo_1_transporte_moodboard.png", "reference/kit_v1.0/02_mapas/moodboard_locais.png", (482, 662, 800, 1018)),
            ("estilo_2_apartamento_moodboard.png", "reference/kit_v1.0/02_mapas/moodboard_locais.png", (0, 662, 478, 1018)),
            ("estilo_3_pecas_do_jogo.png", "montagem", ["geladeira_bebidas", "forno_pao", "balcao_modulo", "sofa", "armario", "planta"]),
        ],
        "pedidos": [
            ("carro_x1", "Carro dele: BMW X1 2025 cinza — FAÇA ESTE PRIMEIRO", "peca",
             "the protagonist's car: a 2025 BMW X1 compact luxury SUV in metallic GRAY, parked in reverse. The FRONT of the car "
             "(headlights, grille, hood) is the DARKEST front-left face of the guide (the short end, lower-left); the car's right "
             "side (doors, windows, wheels) is the MEDIUM-gray front-right face (the long side). The upper block of the guide is the "
             "cabin/windows. Clean and shiny, dark tinted windows, alloy wheels. No logos or badges, no readable license plate.",
             ["--pela-largura"]),  # carro: mantém a proporção do desenho
            ("carro_hatch", "Carro do vizinho: hatch vermelho", "peca",
             "a small RED hatchback car, a little dusty, parked in reverse: the FRONT (headlights) is the DARKEST front-left face "
             "(the short end), the right side with doors and wheels is the MEDIUM-gray front-right face. Upper block = cabin/windows. "
             "No logos, no readable license plate.", ["--pela-largura"]),  # carro: mantém a proporção do desenho
            ("carro_sedan", "Carro do vizinho: sedã preto", "peca",
             "a BLACK sedan car, parked in reverse: the FRONT (headlights) is the DARKEST front-left face (the short end), the right "
             "side with doors and wheels is the MEDIUM-gray front-right face, the trunk is at the far end. Upper block = cabin/windows. "
             "No logos, no readable license plate.", ["--pela-largura"]),  # carro: mantém a proporção do desenho
            ("pilar", "Pilar da garagem", "peca",
             "a square concrete pillar of an underground parking garage, bare gray concrete, the bottom 70 cm painted with diagonal "
             "yellow and black hazard stripes, a small painted parking number \"12\" on it.", ["--faces"]),
            ("parede_garagem", "Parede da garagem (textura)", "parede",
             "a seamless wall texture for an underground parking garage, 2 m wide by 3 m tall: bare gray concrete with formwork "
             "lines and a few water stains; the bottom 30% is a band of diagonal yellow and black hazard stripes. No text, no "
             "objects. It must tile seamlessly left-right.", ["--largura-m", "2", "--altura-m", "3"]),
            ("piso_garagem", "Piso da garagem (textura)", "piso",
             "a seamless tileable top-down floor texture: dark gray polished concrete of a parking garage, subtle cracks, a couple "
             "of small oil stains, no painted lines, no text. Seen from directly above.", ["--metros", "3"]),
            ("porta_elevador_garagem", "Porta do elevador (na garagem)", "decal",
             "closed brushed stainless-steel elevator doors set in a concrete wall, with a thin steel frame; to the right a small "
             "call button panel with an up and a down arrow (one glowing); above the doors a small digital floor display showing "
             "\"G\".", []),
            ("placa_saida", "Placa SAÍDA", "decal",
             "a rectangular green emergency/exit sign that reads \"SAÍDA\" in white letters with a white arrow pointing right, "
             "softly glowing. Text must be spelled exactly.", []),
            ("extintor", "Extintor na parede", "decal",
             "a red fire extinguisher hanging on a small wall bracket, with a small red square sign above it.", []),
            ("parede_elevador", "Elevador por dentro: parede (textura)", "parede",
             "a seamless wall texture for the inside of an elevator cabin, 2 m wide by 3 m tall: vertical brushed stainless-steel "
             "panels with thin dark seams, a horizontal steel handrail at hip height, warm reflections. No text. It must tile "
             "seamlessly left-right.", ["--largura-m", "2", "--altura-m", "3"]),
            ("piso_elevador", "Elevador por dentro: piso (textura)", "piso",
             "a seamless tileable top-down floor texture for an elevator: dark gray granite with small light speckles, polished. "
             "Seen from directly above. No objects.", ["--metros", "2"]),
            ("porta_cabine", "Elevador por dentro: porta fechada", "decal",
             "the inside of closed elevator doors: two brushed stainless-steel sliding door panels meeting in the middle, thin "
             "steel frame. No floor display (the game draws it above the doors).", []),
            ("painel_elevador", "Elevador por dentro: painel de botões", "decal",
             "a tall narrow elevator button panel in brushed steel: two columns of round buttons numbered 1 to 12 plus \"G\", "
             "\"T\" and an alarm bell button, button \"G\" glowing orange.", []),
        ],
        "derivados": [],
    },
    "casa_amigo": {
        "titulo": "Casa do amigo (churrasco)",
        "contexto": "this set is the backyard of a friend's house in São Paulo where friends gather for a Brazilian barbecue (churrasco) at night: brick barbecue grill, beer fridge, long wooden table, swimming pool, string lights",
        "estilo": [
            ("estilo_1_padaria_moodboard.png", "reference/kit_v1.0/02_mapas/moodboard_locais.png", (1098, 372, 1536, 660)),
            ("estilo_2_apartamento_moodboard.png", "reference/kit_v1.0/02_mapas/moodboard_locais.png", (0, 662, 478, 1018)),
            ("estilo_3_pecas_do_jogo.png", "montagem", ["geladeira_bebidas", "mesa_grande", "chapa", "cadeira_bistro", "planta", "balcao_modulo"]),
        ],
        "pedidos": [
            ("churrasqueira", "Churrasqueira — FAÇA ESTA PRIMEIRO", "peca",
             "a classic Brazilian brick barbecue grill (churrasqueira de tijolinho): a red-brick base with a stainless-steel grill "
             "rack holding skewers of picanha and sausages over glowing charcoal, and on top (the upper block of the guide) a "
             "brick hood and chimney with a little smoke. The opening of the grill is on the DARKEST front-left face.", ["--faces"]),
            ("bancada_pia", "Bancada com pia", "peca",
             "an outdoor kitchen counter: dark granite top with a stainless-steel sink and faucet, a cutting board with a knife "
             "and a bowl of farofa, wooden cabinet doors below. The cabinet doors are on the DARKEST front-left face.", ["--faces"]),
            ("cervejeira", "Cervejeira", "peca",
             "a tall beer fridge (cervejeira) in black with a glass door showing rows of beer bottles and cans, a cold blue inner "
             "light and frost on the glass. The glass door is on the DARKEST front-left face.", ["--faces"]),
            ("mesa_madeira", "Mesa grande de madeira", "peca",
             "a long rustic wooden table for 8 people (thick planks), on top: a wooden board with sliced meat, a bowl of "
             "vinaigrette, beer bottles and cups.", ["--pela-largura"]),
            ("banco_madeira", "Banco de madeira", "peca",
             "a long rustic wooden bench without backrest, thick planks, matching the wooden table.", ["--pela-largura"]),
            ("piscina", "Piscina", "peca",
             "a rectangular swimming pool seen from the game's isometric angle: clear turquoise water with light reflections, "
             "small blue tiles inside, a light stone border around it, a small stainless-steel ladder on one side, an inflatable "
             "flamingo floating. The guide block is very flat: the water surface is the top face.", []),
            ("espreguicadeira", "Espreguiçadeira", "peca",
             "a white pool lounger (sun lounger) with a raised backrest on the far side (the taller block of the guide), "
             "with a striped towel on it.", ["--uniforme"]),
            ("guarda_sol", "Guarda-sol", "peca",
             "an open beach umbrella with red and white stripes on a pole fixed in a heavy base; the canopy can be wider than the "
             "guide block.", ["--uniforme"]),
            ("caixa_termica", "Caixa térmica", "peca",
             "a blue and white cooler box with the lid open, full of ice and beer cans.", ["--uniforme"]),
            ("mesa_plastico", "Mesa de plástico", "peca",
             "a square white plastic bar table (the classic Brazilian 'mesa de bar'), with a few beer cans on it.", ["--pela-largura"]),
            ("cadeira_plastico", "Cadeira de plástico", "peca",
             "a white plastic bar chair (classic Brazilian 'cadeira de bar'): the backrest is at the BACK (the thin upright block "
             "on the far side of the guide), the seat faces the viewer toward the lower-left.", ["--uniforme"]),
            ("arvore", "Árvore", "peca",
             "a leafy backyard mango tree (mangueira) with a thick trunk, round dense crown and a few mangoes; the crown can be "
             "wider than the guide block.", ["--uniforme"]),
            ("muro", "Muro (textura)", "parede",
             "a seamless wall texture for a backyard wall, 2 m wide by 2.4 m tall: painted cream concrete wall with a few climbing "
             "plants and small cracks, a darker stone strip at the bottom, warm light. No objects, no text. It must tile seamlessly "
             "left-right.", ["--largura-m", "2", "--altura-m", "2.4"]),
            ("grama", "Gramado (textura)", "piso",
             "a seamless tileable top-down lawn texture: green grass with small tufts and a few tiny flowers, at night with soft "
             "warm light. Seen from directly above. No objects.", ["--metros", "2"]),
            ("piso_gourmet", "Piso da área gourmet (textura)", "piso",
             "a seamless tileable top-down floor texture: large terracotta-colored outdoor ceramic tiles with thin grout, a bit "
             "worn. Seen from directly above. No objects.", ["--metros", "2"]),
            ("portao", "Portão", "decal",
             "a closed metal garden gate for a house, dark gray bars with a small mailbox, seen straight on.", []),
            ("varal_luzes", "Varal de luzinhas", "decal",
             "a string of warm round light bulbs (festoon lights) hanging in gentle curves, glowing. Only the string and bulbs.",
             ["--sem-fundo"]),
            ("placa_churras", "Placa do churrasco", "decal",
             "a rustic wooden sign hanging on the wall that reads \"CHURRASCO DOS AMIGOS\" in white painted letters, with a small "
             "painted beer mug and a skewer. Text must be spelled exactly.", ["--sem-fundo"]),
        ],
        "derivados": [("cadeira_plastico_lado", "cadeira_plastico", "cadeira_plastico_lado", ["--espelhar", "--uniforme"])],
    },
}

FORMATO = {"parede": "portrait", "piso": "square", "decal": None}
DECAL_FORMATO = {"prateleira_paes": "landscape", "cardapio_padaria": "landscape", "neon_padaria": "landscape",
                 "porta_banheiro": "portrait", "porta_rua": "portrait", "vitrine_rua": "landscape",
                 "porta_elevador_garagem": "landscape", "placa_saida": "landscape", "extintor": "portrait",
                 "porta_cabine": "portrait", "painel_elevador": "portrait",
                 "portao": "landscape", "varal_luzes": "landscape", "placa_churras": "landscape"}
# imagens planas que têm forma própria (placa, objeto na parede): fundo transparente em volta
TRANSPARENTES = {"prateleira_paes", "cardapio_padaria", "neon_padaria", "placa_saida", "extintor", "painel_elevador",
                 "varal_luzes", "placa_churras"}


def texto_pedido(nome, tipo, desc):
    if tipo == "peca":
        return PECA.format(desc=desc)
    formato = FORMATO[tipo] or DECAL_FORMATO.get(nome, "square")
    transparente = nome in TRANSPARENTES
    fundo = (FUNDO_TRANSP if transparente else FUNDO_CHEIO).format(formato=formato.capitalize() if transparente else formato)
    return PLANA.format(desc=desc, fundo=fundo)


def montagem(nomes, destino):
    cat = json.loads((RAIZ / "assets/maps/props/props.json").read_text(encoding="utf-8"))["props"]
    ims = [Image.open(RAIZ / "assets/maps/props" / cat[n]["arquivo"]).convert("RGBA") for n in nomes if n in cat]
    alt = 300
    ims = [im.resize((max(1, round(im.width * alt / im.height)), alt), Image.LANCZOS) for im in ims]
    larg = sum(im.width for im in ims) + 30 * (len(ims) + 1)
    tela = Image.new("RGBA", (larg, alt + 60), (24, 16, 34, 255))
    x = 30
    for im in ims:
        tela.alpha_composite(im, (x, 30))
        x += im.width + 30
    tela.convert("RGB").save(destino)


def montar(mapa):
    kit = KITS[mapa]
    pasta = RAIZ / "kit_chatgpt" / mapa
    (pasta / "guias").mkdir(parents=True, exist_ok=True)
    (pasta / "prontas").mkdir(exist_ok=True)
    (pasta / "estilo").mkdir(exist_ok=True)
    for arq, origem, extra in kit["estilo"]:
        if origem == "montagem":
            montagem(extra, pasta / "estilo" / arq)
        else:
            im = Image.open(RAIZ / origem)
            (im.crop(extra) if extra else im).convert("RGB").save(pasta / "estilo" / arq)
    guias = [p[0] for p in kit["pedidos"] if p[2] == "peca"] + [d[2] for d in kit["derivados"]]
    for g in guias:
        subprocess.run([sys.executable, "-I", str(FERR / "guia_props.py"), g, str(pasta / "guias")], check=True,
                       capture_output=True)
    cartoes = []
    for i, (nome, rotulo, tipo, desc, _) in enumerate(kit["pedidos"], 1):
        texto = texto_pedido(nome, tipo, desc)
        guia = f'<img src="guias/{nome}_guia.png" alt="guia de forma de {html.escape(rotulo)}">' if tipo == "peca" else \
            '<div class="semguia">sem guia<br>(só o texto)</div>'
        anexo = f"anexe <code>guias/{nome}_guia.png</code> e cole o texto" if tipo == "peca" else "só cole o texto"
        cartoes.append(f"""
<section class="cartao" id="{nome}">
  <div class="guia">{guia}</div>
  <div class="corpo">
    <h2><span class="num">{i}</span> {html.escape(rotulo)}</h2>
    <p class="como">Na mesma conversa: {anexo}. Salve a imagem como <code>prontas/{nome}.png</code>
      <button class="copiar-nome" data-texto="{nome}.png">copiar nome do arquivo</button></p>
    <textarea readonly rows="7">{html.escape(texto)}</textarea>
    <button class="copiar">Copiar texto</button>
  </div>
</section>""")
    estilos = "".join(f'<img src="estilo/{a}" alt="referência de estilo {k}">' for k, (a, _, _) in enumerate(kit["estilo"], 1))
    primeira = ("These images are the ART STYLE REFERENCE for a series of game assets I will ask you for next, one per "
                f"message: an isometric pixel-art game set at night in São Paulo ({kit['contexto']}). "
                "The third image shows props already in the game: match that finish. "
                "Do not generate anything now, just confirm.")
    pagina = f"""<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Kit ChatGPT — {kit['titulo']}</title>
<style>
:root {{ --fundo:#120b1c; --cartao:#1d1330; --borda:#4a3570; --texto:#f1e9ff; --sub:#b9a8dd; --rosa:#ff5ad8; }}
body {{ margin:0; background:var(--fundo); color:var(--texto); font:15px/1.5 system-ui, sans-serif; }}
main {{ max-width:1000px; margin:0 auto; padding:20px 16px 60px; }}
h1 {{ font-size:24px; margin:0 0 6px; }} h2 {{ font-size:18px; margin:0 0 6px; }}
.passos {{ background:var(--cartao); border:1px solid var(--borda); border-radius:14px; padding:14px 18px; }}
.passos li {{ margin:6px 0; }} code {{ background:#2c1f45; padding:1px 6px; border-radius:6px; }}
.estilos {{ display:flex; gap:10px; flex-wrap:wrap; margin:10px 0; }} .estilos img {{ height:110px; border-radius:8px; border:1px solid var(--borda); }}
.cartao {{ display:flex; gap:16px; background:var(--cartao); border:1px solid var(--borda); border-radius:14px; padding:14px; margin:14px 0; }}
.guia {{ flex:none; width:170px; display:grid; place-items:center; background:#0d0814; border-radius:10px; }}
.guia img {{ max-width:160px; max-height:160px; }} .semguia {{ color:var(--sub); text-align:center; font-size:13px; padding:20px 0; }}
.corpo {{ flex:1; min-width:0; }} .num {{ display:inline-grid; place-items:center; width:26px; height:26px; border-radius:50%; background:var(--rosa); color:#1a0820; font-size:14px; margin-right:4px; }}
.como {{ color:var(--sub); margin:0 0 8px; }}
textarea {{ width:100%; box-sizing:border-box; background:#0d0814; color:#e6dcff; border:1px solid var(--borda); border-radius:8px; padding:8px; font:12.5px/1.45 ui-monospace, monospace; resize:vertical; }}
button {{ font:600 14px system-ui, sans-serif; color:#fff; background:#5b2d86; border:1px solid var(--rosa); border-radius:9px; padding:8px 14px; cursor:pointer; margin-top:6px; }}
button.copiar-nome {{ background:transparent; border-color:var(--borda); font-weight:500; padding:2px 8px; font-size:12.5px; margin:0 0 0 6px; }}
button.ok {{ background:#1f8f4e; border-color:#3ddc84; }}
@media (max-width:640px) {{ .cartao {{ flex-direction:column; }} .guia {{ width:100%; }} }}
</style></head><body><main>
<h1>Kit ChatGPT — {kit['titulo']}</h1>
<div class="passos"><ol>
  <li>Abra uma conversa nova no ChatGPT. Anexe as 3 imagens da pasta <code>estilo/</code> (abaixo) e cole o texto da primeira mensagem.</li>
  <li>Na MESMA conversa, faça uma peça por mensagem: anexe o guia (quando tiver) e cole o texto da peça.</li>
  <li>Se o fundo não vier transparente, peça: <i>"make the background transparent"</i>. Se vier no ângulo errado, peça de novo lembrando: <i>"match the gray guide angle exactly"</i>.</li>
  <li>Salve cada imagem em <code>prontas/</code> com o nome indicado. Comece pelo <b>1 (balcão)</b> e me mostre antes de fazer o resto.</li>
</ol>
<div class="estilos">{estilos}</div>
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
    (pasta / "index.html").write_text(pagina, encoding="utf-8")
    print(f"kit pronto: {pasta / 'index.html'} ({len(kit['pedidos'])} pedidos)")


def processar(mapa):
    kit = KITS[mapa]
    pasta = RAIZ / "kit_chatgpt" / mapa
    feitos = []
    for nome, _, tipo, _, opcoes in kit["pedidos"]:
        arq = pasta / "prontas" / f"{nome}.png"
        if not arq.exists():
            continue
        if tipo == "peca":
            cmd = [str(FERR / "prop_entrada.py"), str(arq), str(pasta / "guias" / f"{nome}_guia.json"), *opcoes]
        else:
            cmd = [str(FERR / "textura_plana.py"), str(arq), nome, "--tipo", tipo, *opcoes]
        r = subprocess.run([sys.executable, "-I", *cmd], capture_output=True, text=True, encoding="utf-8")
        print((r.stdout or r.stderr).strip())
        feitos.append(nome)
    for nome, de, guia, opcoes in kit["derivados"]:
        arq = pasta / "prontas" / f"{de}.png"
        if arq.exists():
            r = subprocess.run([sys.executable, "-I", str(FERR / "prop_entrada.py"), str(arq),
                                str(pasta / "guias" / f"{guia}_guia.json"), *opcoes, "--nome", nome],
                               capture_output=True, text=True, encoding="utf-8")
            print((r.stdout or r.stderr).strip())
    faltam = [p[0] for p in kit["pedidos"] if p[0] not in feitos]
    print(f"{len(feitos)} encaixadas; faltam {len(faltam)}: {', '.join(faltam) or 'nenhuma'}")


if __name__ == "__main__":
    for fluxo in (sys.stdout, sys.stderr):
        fluxo.reconfigure(encoding="utf-8")
    mapa = sys.argv[1] if len(sys.argv) > 1 else "padaria"
    (processar if "--processar" in sys.argv else montar)(mapa)
