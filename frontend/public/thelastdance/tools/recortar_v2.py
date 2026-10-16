#!/usr/bin/env python3
"""Recorte do PERSONAGEM V2 (camiseta branca) em peças para animação, nas vistas de FRENTE e de LADO.

Uso (a partir de frontend/public/thelastdance/):
    python3 -I tools/recortar_v2.py

Lê   reference/personagem_v2/vistas.png (prancha com 4 vistas; não altera)
Gera assets/characters/personagem_v2/<vista>/<peça>.png + rig.json   (vista = frente, lado)
     docs/acceptance/personagem_v2/pecas_<vista>.png                (conferência dos cortes)

Mesma técnica do piloto (tools/recortar_partes.py), com três acréscimos:
- "copias": peças do lado de longe no perfil (braço e perna escondidos no desenho) = cópia escurecida da peça
  do lado de perto, desenhada atrás do corpo;
- "apagar": área do desenho que sai (o tênis de longe original, substituído pela cópia da perna);
- "objetos": garrafa, cigarro e fumaça pintados por código, presos à mão/cabeça e escondidos por padrão
  (cada animação decide quando aparecem).
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as nd

sys.path.insert(0, str(Path(__file__).resolve().parent))
from limpeza import limpar_cabelo  # noqa: E402
from recortar_partes import circulo, poligono, preencher  # noqa: E402


def preencher_textura(rgb, conhecido, alvo, alfa):
    """Pinta a área escondida de uma peça com um "carimbo" da própria peça: para cada área escondida, procura
    o deslocamento que cobre melhor a área com pixels visíveis da peça (sem o contorno preto) e copia o bloco
    inteiro, mantendo a textura da camiseta/jeans. O que sobrar vai pela cor mais próxima. Na borda da peça,
    onde o contorno estava escondido, redesenha a linha escura."""
    lum = rgb.astype(int) @ np.array([0.299, 0.587, 0.114])
    fonte = conhecido & (lum >= 45)  # contorno é ~25; o jeans escuro fica acima de 50
    if fonte.sum() < 200:
        fonte = conhecido
    out = preencher(rgb, fonte, alvo)
    H, W = alvo.shape
    rot, n = nd.label(alvo)
    for i in range(1, n + 1):
        ys, xs = np.where(rot == i)
        melhor, desl = -1.0, None
        for dy in range(-80, 81, 10):
            for dx in range(-160, 161, 10):
                if abs(dx) < 20 and abs(dy) < 20:
                    continue
                sy, sx = ys + dy, xs + dx
                ok = (sy >= 0) & (sy < H) & (sx >= 0) & (sx < W)
                cob = (fonte[sy[ok], sx[ok]]).sum() / len(ys)
                if cob > melhor:
                    melhor, desl = cob, (dy, dx)
        if desl is None or melhor < 0.3:
            continue
        sy, sx = ys + desl[0], xs + desl[1]
        ok = (sy >= 0) & (sy < H) & (sx >= 0) & (sx < W)
        ok[ok] = fonte[sy[ok], sx[ok]]
        out[ys[ok], xs[ok]] = rgb[sy[ok], sx[ok]]
    borda = alvo & (nd.distance_transform_edt(alfa) <= 3.5)
    out[borda] = (24, 22, 30)
    return out


RAIZ = Path(__file__).resolve().parent.parent
PRANCHA = RAIZ / "reference/personagem_v2/vistas.png"
SAIDA = RAIZ / "assets/characters/personagem_v2"
CONFERENCIA = RAIZ / "docs/acceptance/personagem_v2"

# "dir"/"esq" = lado do PERSONAGEM. De frente, o braço direito dele fica à esquerda da tela.
# No perfil (olhando para a direita da tela) vemos o lado direito dele: "dir" = perto, "esq" = longe.
VISTAS = {
    "frente": dict(
        caixa=(0, 0, 430, 1024),
        dentes=[(120, 380, 310, 450)],
        ossos=[
            ("raiz", None, (215, 905)), ("corpo", "raiz", (215, 700)), ("quadril", "corpo", (215, 700)),
            ("torso", "quadril", (215, 690)), ("cabeca", "torso", (212, 495)),
            ("braco_dir", "torso", (105, 545)), ("antebraco_dir", "braco_dir", (88, 650)),
            ("mao_dir", "antebraco_dir", (85, 700)),
            ("braco_esq", "torso", (325, 545)), ("antebraco_esq", "braco_esq", (342, 650)),
            ("mao_esq", "antebraco_esq", (350, 700)),
            ("coxa_dir", "corpo", (160, 720)), ("canela_dir", "coxa_dir", (158, 790)),
            ("coxa_esq", "corpo", (268, 720)), ("canela_esq", "coxa_esq", (268, 790)),
        ],
        pecas={
            "canela_dir": dict(z=0, poli=[(40, 788), (208, 788), (212, 925), (40, 925)],
                               ext=[(110, 755), (208, 755), (208, 792), (110, 792)], copia=["coxa_dir"]),
            "canela_esq": dict(z=1, poli=[(220, 788), (390, 788), (395, 925), (220, 925)],
                               ext=[(222, 755), (322, 755), (322, 792), (222, 792)], copia=["coxa_esq"]),
            "coxa_dir": dict(z=2, poli=[(108, 738), (203, 742), (212, 760), (206, 790), (108, 790)],
                             ext=[(115, 688), (214, 688), (214, 745), (115, 745)], copia=["quadril"]),
            "coxa_esq": dict(z=3, poli=[(225, 742), (320, 738), (326, 790), (220, 790), (216, 760)],
                             ext=[(214, 688), (318, 688), (318, 745), (214, 745)], copia=["quadril"]),
            "quadril": dict(z=4, poli=[(112, 690), (320, 690), (320, 740), (225, 742), (214, 760), (203, 742),
                                       (112, 740)],
                            ext=[(122, 655), (312, 655), (312, 695), (122, 695)], copia=[]),
            "torso": dict(z=5, poli=None,
                          ext=[(122, 425), (308, 425), (318, 600), (312, 700), (122, 700), (124, 600)], copia=[]),
            "cabeca": dict(z=6, poli=[(0, 0), (430, 0), (430, 488), (290, 490), (250, 498), (160, 498), (130, 490),
                                      (0, 488)], copia=[]),
            "antebraco_dir": dict(z=7, poli=[(44, 650), (128, 650), (120, 700), (44, 700)],
                                  circ=((88, 650), 26), copia=[]),
            "braco_dir": dict(z=8, poli=[(112, 500), (134, 520), (134, 600), (130, 655), (44, 655), (50, 600),
                                         (60, 572), (85, 518)],
                              circ=((105, 545), 28), copia=["torso"]),
            "mao_dir": dict(z=10, poli=[(40, 695), (124, 695), (128, 762), (40, 762)],
                            circ=((85, 700), 20), copia=["antebraco_dir"]),
            "antebraco_esq": dict(z=12, poli=[(305, 650), (378, 650), (395, 700), (305, 700)],
                                  circ=((342, 650), 26), copia=[]),
            "braco_esq": dict(z=13, poli=[(312, 500), (338, 512), (372, 572), (378, 600), (375, 655), (306, 655),
                                          (302, 600), (298, 540)],
                              circ=((325, 545), 28), copia=["torso"]),
            "mao_esq": dict(z=14, poli=[(306, 695), (396, 695), (396, 762), (306, 762)],
                            circ=((350, 700), 20), copia=["antebraco_esq"]),
        },
        copias={},
        apagar=[],
        # objetos: osso, pai, pivô (ponto da mão/boca onde o objeto fica), z
        objetos=[("garrafa", "mao_dir", (80, 726), 9), ("cigarro", "mao_dir", (104, 712), 11),
                 ("fumaca1", "cabeca", (212, 432), 30), ("fumaca2", "cabeca", (212, 432), 31),
                 ("fumaca3", "cabeca", (212, 432), 32)],
        resto_torso_y=695,
    ),
    "lado": dict(
        caixa=(1150, 0, 1536, 1024),
        dentes=[(1420, 390, 1515, 450)],
        ossos=[
            ("raiz", None, (1335, 905)), ("corpo", "raiz", (1335, 700)), ("quadril", "corpo", (1335, 700)),
            ("torso", "quadril", (1335, 690)), ("cabeca", "torso", (1350, 480)),
            ("braco_esq", "torso", (1300, 540)), ("antebraco_esq", "braco_esq", (1300, 655)),
            ("mao_esq", "antebraco_esq", (1315, 700)),
            ("braco_dir", "torso", (1300, 540)), ("antebraco_dir", "braco_dir", (1300, 655)),
            ("mao_dir", "antebraco_dir", (1315, 700)),
            ("coxa_esq", "corpo", (1335, 720)), ("canela_esq", "coxa_esq", (1325, 795)),
            ("coxa_dir", "corpo", (1335, 720)), ("canela_dir", "coxa_dir", (1325, 795)),
        ],
        pecas={
            "canela_dir": dict(z=5, poli=[(1240, 790), (1405, 790), (1396, 850), (1425, 920), (1240, 920)],
                               ext=[(1260, 762), (1400, 762), (1400, 795), (1260, 795)], copia=["coxa_dir"]),
            "coxa_dir": dict(z=6, poli=[(1252, 740), (1420, 740), (1406, 795), (1255, 795)],
                             ext=[(1260, 688), (1415, 688), (1415, 745), (1260, 745)], copia=["quadril"]),
            "quadril": dict(z=7, poli=[(1250, 688), (1428, 688), (1422, 745), (1250, 745)],
                            ext=[(1258, 655), (1420, 655), (1420, 695), (1258, 695)], copia=[]),
            "torso": dict(z=8, poli=None, ext=[(1255, 420), (1425, 420), (1428, 700), (1255, 700)], copia=[]),
            "cabeca": dict(z=9, poli=[(1150, 0), (1536, 0), (1536, 530), (1400, 530), (1396, 494), (1340, 480),
                                      (1300, 474), (1250, 482), (1150, 482)], copia=[]),
            "antebraco_dir": dict(z=10, poli=[(1258, 650), (1342, 650), (1348, 702), (1262, 702)],
                                  circ=((1300, 655), 26), copia=[]),
            "braco_dir": dict(z=11, poli=[(1252, 488), (1345, 498), (1354, 560), (1347, 615), (1338, 655),
                                          (1258, 655), (1254, 600)],
                              circ=((1300, 540), 34), copia=["torso"]),
            "mao_dir": dict(z=13, poli=[(1262, 697), (1368, 697), (1370, 768), (1262, 768)],
                            circ=((1315, 700), 20), copia=["antebraco_dir"]),
        },
        # lado de longe: cópia escurecida do lado de perto (z atrás do corpo)
        copias={"mao_esq": ("mao_dir", 0), "antebraco_esq": ("antebraco_dir", 1), "braco_esq": ("braco_dir", 2),
                "canela_esq": ("canela_dir", 3), "coxa_esq": ("coxa_dir", 4)},
        apagar=[[(1392, 812), (1475, 812), (1475, 905), (1410, 905), (1404, 862), (1392, 850)]],
        objetos=[("garrafa", "mao_dir", (1322, 728), 12), ("cigarro", "mao_dir", (1350, 712), 14),
                 ("fumaca1", "cabeca", (1482, 432), 30), ("fumaca2", "cabeca", (1482, 432), 31),
                 ("fumaca3", "cabeca", (1482, 432), 32)],
        resto_torso_y=695,
    ),
}
ESCURECER = 0.72  # cópias do lado de longe ficam mais escuras (estão na sombra do corpo)


def mascara(rgb):
    """Fundo branco + sombras dos pés por inundação a partir das bordas; 4 figuras grandes; cabelo limpo."""
    lum = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]
    sat = rgb.max(2).astype(int) - rgb.min(2)
    rot, _ = nd.label((lum > 150) & (sat < 40))
    borda = set(np.unique(np.concatenate([rot[0], rot[-1], rot[:, 0], rot[:, -1]]))) - {0}
    fg = nd.binary_opening(~np.isin(rot, list(borda)), iterations=1)
    rot, n = nd.label(fg)
    tam = nd.sum(fg, rot, range(1, n + 1))
    fg = np.isin(rot, [i + 1 for i, t in enumerate(tam) if t > 20000])
    fg = nd.binary_fill_holes(fg)
    dentes = [c for v in VISTAS.values() for c in v["dentes"]]
    dentes.append((440, 380, 545, 455))  # dentes do perfil olhando para a esquerda (2ª vista da ficha)
    return limpar_cabelo(rgb, fg, y_max=480, protegidos=dentes)


# ---------- objetos pintados por código (4× maior e reduzidos, para borda suave) ----------
def _reduz(im, f=4):
    return im.resize((im.width // f, im.height // f), Image.LANCZOS)


def desenhar_garrafa():
    f, w, h = 4, 36, 128
    im = Image.new("RGBA", (w * f, h * f), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    s = lambda *p: [v * f for v in p]  # noqa: E731
    contorno, vidro, vidro_claro = (22, 20, 28, 255), (34, 112, 52, 255), (88, 170, 96, 255)
    corpo = s(4, 52, 32, 124)
    d.rounded_rectangle(corpo, radius=7 * f, fill=vidro, outline=contorno, width=3 * f)
    d.polygon(s(8, 54, 28, 54, 22, 30, 14, 30), fill=vidro, outline=contorno)
    d.rectangle(s(13, 8, 23, 34), fill=vidro, outline=contorno, width=3 * f)
    d.rectangle(s(12, 2, 24, 10), fill=(196, 166, 60, 255), outline=contorno, width=3 * f)  # tampa
    d.rectangle(s(6, 76, 30, 100), fill=(236, 226, 196, 255), outline=contorno, width=2 * f)  # rótulo
    d.rectangle(s(6, 84, 30, 91), fill=(178, 40, 44, 255))
    d.rectangle(s(9, 58, 12, 120), fill=vidro_claro)  # reflexo
    d.rectangle(s(16, 12, 18, 30), fill=vidro_claro)
    return _reduz(im), (18, 82)  # imagem, ponto de pega (onde fica o punho)


def desenhar_cigarro():
    f, w, h = 4, 52, 12
    im = Image.new("RGBA", (w * f, h * f), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    s = lambda *p: [v * f for v in p]  # noqa: E731
    contorno = (28, 24, 28, 255)
    d.rectangle(s(2, 3, 16, 9), fill=(214, 128, 52, 255), outline=contorno, width=2 * f)  # filtro
    d.rectangle(s(16, 3, 46, 9), fill=(246, 244, 236, 255), outline=contorno, width=2 * f)  # papel
    d.rectangle(s(44, 3, 50, 9), fill=(255, 92, 30, 255), outline=contorno, width=2 * f)  # brasa
    d.rectangle(s(46, 4, 49, 6), fill=(255, 220, 120, 255))
    return _reduz(im), (26, 6)  # segurado pelo meio: o filtro sai 24 px para um lado, a brasa para o outro


def desenhar_fumaca():
    t = 64
    yy, xx = np.mgrid[:t, :t]
    r = np.hypot(xx - t / 2, yy - t / 2) / (t / 2)
    a = np.clip(1 - r, 0, 1) ** 1.2 * 215
    rgba = np.dstack([np.full((t, t), 222), np.full((t, t), 218), np.full((t, t), 228), a]).astype(np.uint8)
    im = Image.fromarray(rgba, "RGBA").filter(ImageFilter.GaussianBlur(2))
    return im, (t // 2, t // 2)


OBJETOS = {"garrafa": desenhar_garrafa, "cigarro": desenhar_cigarro, "fumaca": desenhar_fumaca}


def recortar_vista(nome_vista, cfg, rgb, fg_total):
    forma = rgb.shape[:2]
    x0c, y0c, x1c, y1c = cfg["caixa"]
    fg = np.zeros(forma, bool)
    fg[y0c:y1c, x0c:x1c] = fg_total[y0c:y1c, x0c:x1c]
    rot, n = nd.label(fg)  # só a figura desta vista (pontas das vizinhas que entram na caixa ficam de fora)
    if n > 1:
        fg = rot == 1 + int(np.argmax(nd.sum(fg, rot, range(1, n + 1))))
    for pts in cfg["apagar"]:
        fg &= ~poligono(forma, pts)

    pecas = cfg["pecas"]
    r_, g_, b_ = (rgb[..., i].astype(int) for i in range(3))
    jeans = (b_ > r_ + 15) & (b_ > 70)  # azul da calça: nunca vai junto com mão/antebraço
    dono = np.full(forma, "", dtype=object)
    for nome, p in sorted(pecas.items(), key=lambda kv: -kv[1]["z"]):
        if p["poli"]:
            m = poligono(forma, p["poli"]) & fg & (dono == "")
            if nome.startswith(("mao_", "antebraco_")):
                m &= ~jeans
            dono[m] = nome
    yy = np.arange(forma[0])[:, None]
    dono[fg & (dono == "") & (yy < cfg["resto_torso_y"])] = "torso"
    dono[fg & (dono == "")] = "quadril"

    pasta = SAIDA / nome_vista
    pasta.mkdir(parents=True, exist_ok=True)
    rig = {"versao": 1, "personagem": "personagem_v2", "vista": nome_vista,
           "fonte": "reference/personagem_v2/vistas.png", "ossos": [], "pecas": []}
    rig["ossos"] = [{"nome": n, "pai": pai, "pivo": list(pv)} for n, pai, pv in cfg["ossos"]]
    pivo = {n: pv for n, _, pv in cfg["ossos"]}
    z_de = {n: p["z"] for n, p in pecas.items()}
    imagens = {}
    for nome, p in pecas.items():
        visivel = dono == nome
        ext = np.zeros(forma, bool)
        if p.get("ext"):
            ext |= poligono(forma, p["ext"])
        if p.get("circ"):
            ext |= circulo(forma, *p["circ"])
        ext &= fg & ~visivel
        atras = np.vectorize(lambda d: d != "" and z_de.get(d, -1) < p["z"])(dono)
        copia = (np.isin(dono, p["copia"]) | atras) & ext
        pinta = ext & ~copia
        alfa = visivel | ext
        cor = preencher_textura(rgb, visivel | copia, pinta, alfa) if pinta.any() else rgb
        ys, xs = np.where(alfa)
        bx0, by0, bx1, by1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
        rgba = np.dstack([cor, (alfa * 255).astype(np.uint8)])[by0:by1, bx0:bx1]
        imagens[nome] = (rgba, (int(bx0), int(by0)), p["z"])

    for nome, (fonte, z) in cfg["copias"].items():
        rgba, origem, _ = imagens[fonte]
        escura = rgba.copy()
        escura[..., :3] = (escura[..., :3] * ESCURECER).astype(np.uint8)
        imagens[nome] = (escura, origem, z)

    for nome, (rgba, origem, z) in imagens.items():
        Image.fromarray(rgba, "RGBA").save(pasta / f"{nome}.png", optimize=True)
        rig["pecas"].append({"nome": nome, "osso": nome, "arquivo": f"{nome}.png", "origem": list(origem),
                             "tamanho": [rgba.shape[1], rgba.shape[0]], "z": z})

    for osso, pai, pv, z in cfg["objetos"]:
        tipo = "fumaca" if osso.startswith("fumaca") else osso
        img, pega = OBJETOS[tipo]()
        arquivo = f"{tipo}.png"
        img.save(pasta / arquivo, optimize=True)
        rig["ossos"].append({"nome": osso, "pai": pai, "pivo": list(pv), "oculto": True})
        rig["pecas"].append({"nome": osso, "osso": osso, "arquivo": arquivo,
                             "origem": [pv[0] - pega[0], pv[1] - pega[1]], "tamanho": list(img.size), "z": z,
                             "objeto": True})
    rig["pecas"].sort(key=lambda q: q["z"])
    (pasta / "rig.json").write_text(json.dumps(rig, ensure_ascii=False, indent=2), encoding="utf-8")

    # conferência: peças coloridas + pivôs
    cores = np.array([(230, 25, 75), (60, 180, 75), (255, 225, 25), (0, 130, 200), (245, 130, 48),
                      (145, 30, 180), (70, 240, 240), (240, 50, 230), (210, 245, 60), (250, 190, 212),
                      (0, 128, 128), (170, 110, 40), (128, 0, 0), (0, 0, 128)])
    vis = rgb.astype(float) * 0.45
    for i, nome in enumerate(sorted(pecas, key=lambda n: pecas[n]["z"])):
        m = dono == nome
        vis[m] = vis[m] * 0.5 + cores[i % len(cores)] * 0.55
    im = Image.fromarray(np.clip(vis, 0, 255).astype(np.uint8)).crop(cfg["caixa"])
    d = ImageDraw.Draw(im)
    for n, (x, y) in pivo.items():
        x, y = x - x0c, y - y0c
        d.ellipse([x - 5, y - 5, x + 5, y + 5], outline=(255, 255, 255), width=2)
        d.text((x + 7, y - 5), n, fill=(255, 255, 255))
    im.save(CONFERENCIA / f"pecas_{nome_vista}.png")
    print(nome_vista, "peças:", len(rig["pecas"]), "| sem dono:", int((fg & (dono == "")).sum()))


def main():
    rgb = np.asarray(Image.open(PRANCHA).convert("RGB"))
    CONFERENCIA.mkdir(parents=True, exist_ok=True)
    fg = mascara(rgb)
    for nome, cfg in VISTAS.items():
        recortar_vista(nome, cfg, rgb, fg)


if __name__ == "__main__":
    main()
