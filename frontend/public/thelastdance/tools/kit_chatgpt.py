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
        "titulo": "Casa do amigo (varanda gourmet)",
        "contexto": "this set is the gourmet balcony of a friend's apartment at night: marble barbecue tower, island bar "
                    "with stools, beer fridge, round wooden table with blue rope chairs, big black planters, glass railing "
                    "with the city lights",
        # fotos reais do lugar (só na máquina; kit_chatgpt/ não vai para o git): móveis, materiais e cores
        "nota": "Images 4 and 5 are REAL PHOTOS of the place: copy its furniture, materials and colors, but ALWAYS draw "
                "in the pixel-art style of images 1 to 3, never photorealistic. ",
        "estilo": [
            ("estilo_1_padaria_moodboard.png", "reference/kit_v1.0/02_mapas/moodboard_locais.png", (1098, 372, 1536, 660)),
            ("estilo_2_apartamento_moodboard.png", "reference/kit_v1.0/02_mapas/moodboard_locais.png", (0, 662, 478, 1018)),
            ("estilo_3_pecas_do_jogo.png", "montagem", ["geladeira_bebidas", "mesa_grande", "balcao_modulo", "cadeira_bistro", "planta", "forno_pao"]),
            ("foto_4_cozinha_gourmet.jpg", "kit_chatgpt/casa_amigo/fotos/foto1.jpg", None),
            ("foto_5_mesa_e_vasos.jpg", "kit_chatgpt/casa_amigo/fotos/foto3.jpg", None),
        ],
        "pedidos": [
            ("churrasqueira_marmore", "Churrasqueira de mármore — FAÇA ESTA PRIMEIRO", "peca",
             "a tall built-in barbecue tower clad in dark gray marble porcelain tiles with thin light veins (photo 4), with a "
             "rectangular glass-front niche at waist height holding a stainless-steel rotisserie grill with skewers of meat and "
             "warm light inside. The front with the glass niche is the DARKEST front-left face.", ["--faces"]),
            ("ilha_marmore", "Ilha de mármore com tampo de madeira", "peca",
             "a bar island (photo 4): the base is clad in dark gray marble porcelain with light veins, on top a THICK light "
             "wood-look countertop slightly larger than the base (the upper thin block of the guide), with two small ceramic "
             "vases with dried flowers. The side where the stools go is the DARKEST front-left face.", []),
            ("banqueta_corda", "Banqueta preta de corda", "peca",
             "a tall black bar stool with a woven black rope seat and a low curved woven backrest, thin black metal legs with a "
             "footrest (photo 4). The backrest is at the BACK (the thin upright block on the far side of the guide).",
             ["--uniforme"]),
            ("bancada_cozinha", "Bancada da pia", "peca",
             "a kitchen counter against the wall (photo 4): dark marble countertop with a stainless sink and a tall black "
             "spring faucet, a small cooktop, a coffee machine, light wood-look cabinet doors below. The cabinet doors are on "
             "the DARKEST front-left face.", ["--faces"]),
            ("nicho_geladeiras", "Nicho com cervejeira e geladeira", "peca",
             "built-in light wood-look cabinetry (photo 4) holding, side by side, a stainless beer fridge with a glass door "
             "full of beer bottles and a small digital display showing -6.0, and a tall stainless-steel two-door fridge; "
             "cabinets above them. Both fridge doors are on the DARKEST front-left face. No logos.", ["--faces"]),
            ("mesa_redonda_madeira", "Mesa redonda de madeira", "peca",
             "a large round dining table (photo 5) with a top of light honey-colored wood slats, on a thick round base of "
             "woven navy-blue rope. Nothing on top.", ["--pela-largura"]),
            ("cadeira_corda", "Cadeira de corda azul (de frente)", "peca",
             "an outdoor armchair (photo 5): navy-blue woven rope seat and backrest in an open diamond pattern, wooden "
             "armrests, thin beige metal legs. The backrest is at the BACK (the thin upright block on the far side of the "
             "guide), the seat faces the viewer toward the lower-left.", ["--uniforme"]),
            ("cadeira_corda_costas", "Cadeira de corda azul (de costas)", "peca",
             "the same navy-blue woven rope armchair with wooden armrests seen from BEHIND: the backrest is the thin upright "
             "block on the NEAR right side of the guide, so we see the back of the woven backrest; the seat faces away.",
             ["--uniforme"]),
            ("vaso_planta_grande", "Vaso grande com planta", "peca",
             "a tall matte-black planter (photos 4 and 5) with a big leafy tropical plant (bird of paradise / strelitzia "
             "leaves), lit from below by a small spotlight.", ["--uniforme"]),
            ("caixa_som", "Caixa de som de festa", "peca",
             "a big portable party speaker standing on the floor, black, with two round woofers on the front and a glowing "
             "multicolor light ring around them, a carry handle on top. The speaker front is the DARKEST front-left face. "
             "No readable brand logo.", ["--uniforme"]),
            ("enfeite_cerveja", "Cerveja para as bancadas (garrafa + copo)", "peca",
             "a small tabletop prop seen from the same isometric angle: ONE amber glass beer bottle with a plain cream label "
             "(no brand, no text) standing on the left (the tall thin block of the guide) and ONE short Brazilian 'copo "
             "americano' glass full of golden beer with a white foam head on the right (the short block). Cold droplets on "
             "the glass. Nothing else, no table, no shadow on the ground. No logos.", ["--uniforme"]),
            ("enfeite_churrasco", "Churrasco para as bancadas (tábua com picanha)", "peca",
             "a small tabletop prop seen from the same isometric angle: a rectangular wooden cutting board (the flat block of "
             "the guide) with juicy sliced Brazilian picanha (pink inside, grilled crust, white fat cap) fanned out, a "
             "wooden fork stuck in it, and two tiny bowls on the board: one with farofa (toasted cassava flour) and one with "
             "vinagrete (diced tomato and onion). Warm light, appetizing. Nothing else, no table, no text.", ["--uniforme"]),
            ("parede_varanda", "Parede (textura)", "parede",
             "a seamless wall texture for a modern gourmet balcony, 2 m wide by 2.7 m tall: light greige wall with vertical "
             "light-wood-look panels (photo 4), soft warm light from ceiling spotlights. No objects, no text. It must tile "
             "seamlessly left-right.", ["--largura-m", "2", "--altura-m", "2.7"]),
            ("piso_porcelanato", "Piso (textura)", "piso",
             "a seamless tileable top-down floor texture: large light-gray porcelain tiles (90 x 90 cm look), almost "
             "seamless thin grout, subtle stone texture (photos 4 and 5). Seen from directly above. No objects.",
             ["--metros", "2"]),
            ("vidro_cidade", "Guarda-corpo de vidro com a cidade", "decal",
             "a glass balcony railing seen from inside at night (photo 5): tall clear glass panels with thin stainless posts, "
             "and behind them a dark city skyline with lit windows and a few buildings. No people.", []),
            ("parede_azulejo_luzes", "Parede de azulejo com arandelas", "decal",
             "a wall section covered with small square gray stone tiles with three black square wall lights casting light "
             "up and down (photo 5), a small white metal ventilation door at the bottom right.", []),
            ("porta_vidro_sala", "Portas de vidro para a sala", "decal",
             "large closed white-framed glass sliding doors seen from the balcony at night: through the glass a bright modern "
             "living and dining room with a white table and pendant lights. No people.", []),
            ("tv_parede", "TV", "decal",
             "a flat black TV screen, turned off, thin frame, seen straight on.", []),
        ],
        "derivados": [("cadeira_corda_lado", "cadeira_corda", "cadeira_corda_lado", ["--espelhar", "--uniforme"]),
                      ("cadeira_corda_sul", "cadeira_corda_costas", "cadeira_corda_sul", ["--espelhar", "--uniforme"])],
    },
    "balada": {
        "titulo": "Balada",
        "contexto": "this set is a big nightclub (balada) at night: entrance with a red carpet queue, coat check, VIP "
                    "lounge with red velvet sofas, DJ stage, dance floor, long bar, restrooms and a leather lounge; "
                    "dark room lit by deep purple, magenta, blue and red neon",
        "nota": "Image 1 is the LAYOUT AND MOOD reference of this exact nightclub: use its furniture, materials and neon "
                "colors. ",
        "estilo": [
            ("estilo_1_balada_referencia.png", "reference/kit_v1.0/02_mapas/balada_isometrica_referencia.png", None),
            ("estilo_2_balada_moodboard.png", "reference/kit_v1.0/02_mapas/moodboard_locais.png", (1024, 0, 1536, 368)),
            ("estilo_3_pecas_do_jogo.png", "montagem", ["balcao_modulo", "banqueta", "sofa", "geladeira_bebidas", "planta", "poltrona"]),
        ],
        "pedidos": [
            ("balcao_bar", "Balcão do bar (módulo) — FAÇA ESTE PRIMEIRO", "peca",
             "one module (1.3 m long, chest-high) of a nightclub bar counter. The customer side is the DARKEST front-left "
             "face: a glossy black front panel with a thin glowing RED LED strip along the bottom and a brass footrest rail. "
             "On top a dark polished stone countertop with two cocktail glasses and a small bowl of lime wedges. The "
             "medium-gray right end is a plain black panel. Several modules will stand side by side.", ["--faces", "--emenda"]),
            ("bar_fundo", "Fundo do bar: geladeiras (módulo)", "peca",
             "one module (1.3 m long, waist-high) of the back bar of a nightclub: under-counter fridges with GLASS doors "
             "lit by cold blue light, full of beer bottles, energy-drink cans and champagne; dark steel top with an ice "
             "bucket and a cocktail shaker. The glass doors are on the DARKEST front-left face. Several modules will stand "
             "side by side.", ["--faces", "--emenda"]),
            ("sofa_vip", "Sofá do camarote VIP (veludo vermelho)", "peca",
             "a luxurious long VIP sofa in deep RED tufted velvet (chesterfield buttons), with low gold metal legs and a "
             "few small black cushions. The backrest is at the BACK (the thin upright block on the far side of the guide); "
             "the seat faces the viewer, toward the lower-left.", ["--pela-largura"]),
            ("sofa_lounge", "Sofá do lounge (couro preto)", "peca",
             "a long modern lounge sofa in BLACK leather with stitched cushions and dark wooden legs. The backrest is at "
             "the BACK (the thin upright block on the far side of the guide); the seat faces the viewer, toward the "
             "lower-left.", ["--pela-largura"]),
            ("sofa_lounge_costas", "Sofá do lounge de costas", "peca",
             "the same long black leather lounge sofa seen from BEHIND: the backrest is the thin upright block on the NEAR "
             "side of the guide (lower-left), so we see the back of the backrest; the seat faces away from the viewer.", ["--pela-largura"]),
            ("mesinha_vip", "Mesinha do camarote (com champanhe)", "peca",
             "a small low round black lacquer table with a gold rim; on top a silver ice bucket with a champagne bottle "
             "(no label text), two champagne flutes and a small glowing candle.", ["--uniforme"]),
            ("mesinha_lounge", "Mesinha de centro do lounge", "peca",
             "a low square dark-wood coffee table; on top a tray with two whisky glasses, a small candle and a bowl of "
             "snacks.", ["--pela-largura"]),
            ("mesa_alta", "Mesa alta (barril)", "peca",
             "a tall round nightclub standing table made from an old dark wooden BARREL with black metal hoops and a round "
             "dark top; on top two beer bottles and a lit candle in a glass. No stools.", ["--uniforme"]),
            ("guarda_corpo", "Guarda-corpo do VIP (módulo de 1 m)", "peca",
             "a 1-meter section of the VIP area railing: polished GOLD metal posts at both ends and a gold top rail, with "
             "dark smoked-glass panel between them. Several sections will stand side by side.", ["--pela-largura"]),
            ("cordao_fila", "Cordão da fila (trecho)", "peca",
             "a 1.2 m section of a queue barrier at a nightclub entrance: TWO shiny gold stanchion posts with round heavy "
             "bases, one at each end of the gray block, connected by a sagging thick RED VELVET rope with gold hooks. The "
             "gray block is only the outer size: there is empty space between the two posts, under the rope.", ["--pela-largura"]),
            ("pulpito_hostess", "Púlpito da hostess", "peca",
             "a small black hostess podium at a nightclub entrance with a thin gold edge, a tablet with a guest list on the "
             "slanted top and a small gooseneck lamp. Its front faces the DARKEST front-left face.", ["--uniforme"]),
            ("palco_borda", "Borda do palco do DJ (módulo)", "peca",
             "one module (1.4 m long, knee-high) of the front edge of a nightclub DJ stage: black stage deck with a glowing "
             "VIOLET LED strip along the front edge and a black skirt. Several modules will stand side by side.",
             ["--faces", "--emenda"]),
            ("cabine_dj", "Cabine do DJ", "peca",
             "a nightclub DJ booth: a black desk whose front panel (the DARKEST front-left face, facing the crowd) has a "
             "glowing crown-shaped neon logo outline (no text); on top two turntables, a DJ mixer with colorful buttons, "
             "a laptop and headphones.", ["--faces"]),
            ("caixa_som_palco", "Caixas de som do palco", "peca",
             "a tall stack of professional black PA speakers (a subwoofer at the bottom and two speaker cabinets on top) "
             "with round woofers and black metal grilles. The speakers face the DARKEST front-left face. No logos.",
             ["--faces"]),
            ("pilar_balada", "Pilar", "peca",
             "a tall square dark-gray pillar of a nightclub with vertical glowing ORANGE LED strips at the corners and a "
             "small metal plate at the base.", ["--faces"]),
            ("floreira", "Floreira (módulo)", "peca",
             "one module (1.4 m long) of a low black planter box full of dense tropical leafy plants and ferns, with a soft "
             "warm uplight. Several modules will stand side by side.", ["--pela-largura"]),
            ("balcao_gv", "Balcão do guarda-volumes", "peca",
             "a coat-check counter of a nightclub: dark wood front panel (the DARKEST front-left face) with a small brass "
             "bell and a stack of numbered plastic tags on the dark top, a small glowing sign holder.", ["--faces"]),
            ("cabine_fotos", "Cabine de fotos", "peca",
             "a nightclub photo booth: a boxy cabin covered in glossy HOT PINK panels with bulb lights around the "
             "entrance, a black curtain half-open on the DARKEST front-left face showing a stool inside, a small screen "
             "on the side. No readable text.", ["--faces"]),
            ("parede_balada", "Parede (textura)", "parede",
             "a seamless wall texture for a dark nightclub, 2 m wide by 3.4 m tall: dark charcoal acoustic wall panels "
             "with subtle diamond quilting, a thin horizontal purple LED line near the top, faint colored light reflections. "
             "No objects, no text. It must tile seamlessly left-right.", ["--largura-m", "2", "--altura-m", "3.4"]),
            ("piso_balada", "Piso do salão (textura)", "piso",
             "a seamless tileable top-down floor texture: dark polished concrete/stone tiles of a nightclub with glossy "
             "reflections of purple and pink lights. Seen from directly above. No objects.", ["--metros", "2"]),
            ("piso_pista", "Piso da pista de dança (textura)", "piso",
             "a seamless tileable top-down floor texture: a nightclub DANCE FLOOR of square dark glass LED tiles (4 by 4), "
             "each tile softly glowing a different color (violet, magenta, blue, cyan), black grout. Seen from directly "
             "above. No objects.", ["--metros", "2"]),
            ("piso_vip", "Piso do camarote VIP (textura)", "piso",
             "a seamless tileable top-down floor texture: a plush dark RED carpet with a subtle gold baroque pattern. "
             "Seen from directly above. No objects.", ["--metros", "2"]),
            ("neon_vip", "Letreiro neon VIP", "decal",
             "a glowing neon sign: a hot pink/magenta neon crown outline above big neon letters \"VIP\", on a thin dark "
             "backboard, soft glow. Text must be spelled exactly.", ["--sem-fundo"]),
            ("neon_club", "Letreiro neon CLUB", "decal",
             "a glowing neon sign: a violet neon crown outline above magenta neon letters \"CLUB\", on a thin dark "
             "backboard, soft glow. Text must be spelled exactly.", ["--sem-fundo"]),
            ("neon_bar", "Letreiro neon BAR", "decal",
             "a glowing neon sign: big orange-red neon letters \"BAR\" with a small cocktail glass icon, on a thin dark "
             "backboard, soft glow. Text must be spelled exactly.", ["--sem-fundo"]),
            ("neon_banheiros", "Letreiro neon BANHEIROS", "decal",
             "a glowing neon sign: magenta neon letters \"BANHEIROS\" with a small blue man icon and a pink woman icon, "
             "on a thin dark backboard, soft glow. Text must be spelled exactly.", ["--sem-fundo"]),
            ("neon_guarda_volumes", "Letreiro GUARDA-VOLUMES", "decal",
             "a glowing yellow neon sign that reads \"GUARDA-VOLUMES\" in one line, on a thin dark backboard, soft glow. "
             "Text must be spelled exactly.", ["--sem-fundo"]),
            ("neon_dj", "Coroa neon do DJ", "decal",
             "a big glowing neon CROWN outline in hot pink and violet, no text, on a thin dark backboard, soft glow.",
             ["--sem-fundo"]),
            ("telao_palco", "Telão de LED do palco", "decal",
             "a big LED video wall behind a DJ stage showing abstract psychedelic visuals: purple and magenta light "
             "tunnels and laser lines, with a thin black frame. No text, no people.", []),
            ("prateleira_bebidas", "Prateleira de bebidas do bar", "decal",
             "back-bar wall shelves with warm backlight: three glass shelves full of colorful liquor bottles (whisky, gin, "
             "vodka, tequila, liqueurs), no readable labels, a small mirror behind them.", ["--sem-fundo"]),
            ("prateleiras_gv", "Prateleiras do guarda-volumes", "decal",
             "coat-check wall shelving: a rail with jackets and coats on hangers, cubbyholes with bags and backpacks, each "
             "with a small numbered tag.", ["--sem-fundo"]),
            ("porta_balada", "Porta da rua (por dentro)", "decal",
             "a heavy black padded nightclub entrance door with brass studs and a long brass push handle, a small green "
             "exit light above it.", []),
            ("porta_banheiro_masc", "Porta do banheiro masculino", "decal",
             "a closed dark restroom door with a small glowing BLUE neon man icon on it and a metal push plate. No text.", []),
            ("porta_banheiro_fem", "Porta do banheiro feminino", "decal",
             "a closed dark restroom door with a small glowing PINK neon woman icon on it and a metal push plate. No text.", []),
        ],
        # cópias que não se geram: (nome, de, guia, opções)
        "derivados": [("sofa_vip_lado", "sofa_vip", "sofa_vip_lado", ["--espelhar", "--pela-largura"]),
                      ("sofa_lounge_lado", "sofa_lounge", "sofa_lounge_lado", ["--espelhar", "--pela-largura"]),
                      ("guarda_corpo_lado", "guarda_corpo", "guarda_corpo_lado", ["--espelhar", "--pela-largura"]),
                      ("balcao_guarda_volumes", "balcao_gv", "balcao_guarda_volumes", ["--espelhar", "--faces"])],
    },
}

FORMATO = {"parede": "portrait", "piso": "square", "decal": None}
DECAL_FORMATO = {"prateleira_paes": "landscape", "cardapio_padaria": "landscape", "neon_padaria": "landscape",
                 "porta_banheiro": "portrait", "porta_rua": "portrait", "vitrine_rua": "landscape",
                 "porta_elevador_garagem": "landscape", "placa_saida": "landscape", "extintor": "portrait",
                 "porta_cabine": "portrait", "painel_elevador": "portrait",
                 "portao": "landscape", "varal_luzes": "landscape", "placa_churras": "landscape",
                 "vidro_cidade": "landscape", "parede_azulejo_luzes": "landscape", "porta_vidro_sala": "landscape",
                 "tv_parede": "landscape",
                 "neon_vip": "landscape", "neon_club": "landscape", "neon_bar": "landscape", "neon_banheiros": "landscape",
                 "neon_guarda_volumes": "landscape", "neon_dj": "landscape", "telao_palco": "landscape",
                 "prateleira_bebidas": "landscape", "prateleiras_gv": "landscape", "porta_balada": "portrait",
                 "porta_banheiro_masc": "portrait", "porta_banheiro_fem": "portrait"}
# imagens planas que têm forma própria (placa, objeto na parede): fundo transparente em volta
TRANSPARENTES = {"prateleira_paes", "cardapio_padaria", "neon_padaria", "placa_saida", "extintor", "painel_elevador",
                 "varal_luzes", "placa_churras", "neon_vip", "neon_club", "neon_bar", "neon_banheiros",
                 "neon_guarda_volumes", "neon_dj", "prateleira_bebidas", "prateleiras_gv"}


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
                f"{kit.get('nota', '')}"
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
  <li>Abra uma conversa nova no ChatGPT. Anexe as {len(kit['estilo'])} imagens da pasta <code>estilo/</code> (abaixo) e cole o texto da primeira mensagem.</li>
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
