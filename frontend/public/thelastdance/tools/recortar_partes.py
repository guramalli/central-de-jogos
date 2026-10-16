#!/usr/bin/env python3
"""Corta o conceito do protagonista em peças para animação por recorte (cutout). PILOTO, vista de frente.

Uso (a partir de frontend/public/thelastdance/):
    python3 -I tools/recortar_partes.py

Lê   reference/kit_v1.0/01_personagem/personagem_conceito.png (não altera).
Gera assets/characters/protagonist/recorte/v01/<peça>.png  (RGBA, recortadas na caixa útil)
     assets/characters/protagonist/recorte/v01/rig.json     (ossos, pivôs, ordem de desenho)
     docs/acceptance/piloto_recorte/pecas_conferencia.png  (todas as peças coloridas, para conferir os cortes)

Como funciona:
1. Fundo de papel e sombra pintada saem por inundação a partir das bordas (o contorno escuro segura);
   depois saem as frestas de papel presas entre os fios do cabelo (tools/limpeza.py).
2. Cada pixel do personagem vai para UMA peça (polígonos abaixo, em coordenadas do conceito 1024×1536).
3. Cada peça tem uma "aba" escondida sob a vizinha (extensão), para a junta não abrir buraco ao girar.
   Na aba, pixel do mesmo material (lista "copia") é copiado do original; o resto é preenchido com a cor
   mais próxima da própria peça. É um preenchimento técnico: some sob a peça de cima na pose de repouso.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd

sys.path.insert(0, str(Path(__file__).resolve().parent))
from limpeza import limpar_cabelo  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
CONCEITO = RAIZ / "reference/kit_v1.0/01_personagem/personagem_conceito.png"
SAIDA = RAIZ / "assets/characters/protagonist/recorte/v01"
CONFERENCIA = RAIZ / "docs/acceptance/piloto_recorte"

# "dir"/"esq" = lado do PERSONAGEM (o braço direito dele, com a garrafa, fica à esquerda da tela).
# z: ordem de desenho (menor = mais ao fundo). Ossos virtuais sem imagem: raiz (chão) e corpo (sobe e desce).
# As coxas são filhas do corpo; as animações compensam o balanço para os pés ficarem plantados.
OSSOS = [
    # nome,           pai,           pivô (x, y no conceito)
    ("raiz",          None,          (545, 1500)),
    ("corpo",         "raiz",        (545, 1100)),
    ("quadril",       "corpo",       (545, 1100)),
    ("torso",         "quadril",     (545, 1060)),
    ("cabeca",        "torso",       (510, 740)),
    ("braco_dir",     "torso",       (378, 790)),
    ("antebraco_dir", "braco_dir",   (302, 920)),   # cotovelo = centro do tampão escondido
    ("mao_dir",       "antebraco_dir", (350, 930)),   # pulso: a mão com a garrafa gira aqui
    ("braco_esq",     "torso",       (700, 790)),
    ("antebraco_esq", "braco_esq",   (728, 972)),
    ("coxa_dir",      "corpo",        (468, 1115)),
    ("canela_dir",    "coxa_dir",    (462, 1245)),
    ("coxa_esq",      "corpo",        (618, 1115)),
    ("canela_esq",    "coxa_esq",    (628, 1250)),
]

# Peças: polígono do que é visível dela; extensão escondida (polígono e/ou círculo na junta); de quem copiar.
PECAS = {
    "canela_dir": dict(z=0, poli=[(395, 1240), (532, 1240), (532, 1395), (522, 1475), (318, 1475), (328, 1390)],
                       ext=[(395, 1195), (532, 1195), (532, 1245), (395, 1245)], copia=["coxa_dir"]),
    "canela_esq": dict(z=1, poli=[(558, 1245), (708, 1245), (722, 1380), (765, 1520), (588, 1520), (588, 1390)],
                       ext=[(558, 1200), (708, 1200), (708, 1250), (558, 1250)], copia=["coxa_esq"]),
    "coxa_dir": dict(z=2, poli=[(388, 1138), (532, 1150), (545, 1170), (532, 1240), (395, 1240)],
                     ext=[(392, 1060), (545, 1060), (545, 1150), (392, 1150)], copia=["quadril"]),
    "coxa_esq": dict(z=3, poli=[(558, 1150), (700, 1138), (708, 1245), (558, 1245), (548, 1172)],
                     ext=[(545, 1060), (700, 1060), (700, 1150), (545, 1150)], copia=["quadril"]),
    "quadril": dict(z=4, poli=[(385, 1030), (705, 1030), (705, 1138), (558, 1150), (545, 1172), (532, 1150), (385, 1138)],
                    ext=[(390, 990), (700, 990), (700, 1040), (390, 1040)], copia=[]),
    "torso": dict(z=5, poli=None,  # o que sobrar do personagem acima do quadril
                  ext=[(385, 640), (640, 640), (705, 780), (695, 1085), (392, 1090), (380, 790)], copia=[]),
    "antebraco_esq": dict(z=6, poli=[(640, 958), (690, 966), (788, 945), (762, 1012), (702, 1066), (668, 1102),
                                     (594, 1102), (590, 1046), (624, 1020)],
                          circ=((728, 972), 34), copia=[]),
    "braco_esq": dict(z=7, poli=[(655, 722), (742, 762), (772, 850), (790, 955), (690, 970), (668, 930), (660, 860),
                                 (668, 800), (645, 758)],
                      circ=((700, 790), 46), copia=["torso"]),
    "cabeca": dict(z=8, poli=[(90, 0), (960, 0), (960, 610), (700, 640), (640, 700), (580, 742), (500, 760),
                              (430, 752), (372, 728), (300, 660), (90, 602)], copia=[]),
    "antebraco_dir": dict(z=9, poli=[(272, 930), (298, 906), (338, 880), (346, 874), (342, 930), (354, 968),
                                     (345, 988), (298, 1004), (272, 978)],
                          circ=((302, 920), 34), copia=[]),
    "braco_dir": dict(z=10, poli=[(398, 758), (402, 800), (374, 850), (346, 866), (300, 905), (272, 930), (266, 880),
                                  (288, 818), (330, 772), (360, 756)],
                      circ=((378, 790), 46), copia=["torso"]),
    # Mão + garrafa por cima de tudo: assim a manga não cobre a garrafa quando o braço gira.
    "mao_dir": dict(z=11, poli=[(393, 793), (420, 793), (423, 840), (436, 855), (450, 875), (452, 935), (436, 965),
                                (436, 1004), (376, 1006), (370, 978), (354, 968), (342, 930), (346, 874), (376, 850),
                                (390, 840)],
                    circ=((348, 932), 20), copia=["antebraco_dir"]),
}


def poligono(forma, pts):
    m = Image.new("L", (forma[1], forma[0]), 0)
    ImageDraw.Draw(m).polygon(pts, fill=1)
    return np.asarray(m, bool)


def circulo(forma, centro, raio):
    yy, xx = np.ogrid[:forma[0], :forma[1]]
    return (xx - centro[0]) ** 2 + (yy - centro[1]) ** 2 <= raio ** 2


def mascara_personagem(rgb):
    """Fundo de papel + sombra pintada sob os pés, removidos por inundação a partir das bordas."""
    r, g, b = (rgb[..., i].astype(int) for i in range(3))
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    sat = rgb.max(2).astype(int) - rgb.min(2)
    yy = np.arange(rgb.shape[0])[:, None]
    cand = ((lum > 150) & (sat < 70)) | ((yy > 1385) & (sat < 45) & (lum > 58))
    rot, _ = nd.label(cand)
    borda = set(np.unique(np.concatenate([rot[0], rot[-1], rot[:, 0], rot[:, -1]]))) - {0}
    fg = nd.binary_opening(~np.isin(rot, list(borda)), iterations=1)
    rot, n = nd.label(fg)
    fg = rot == 1 + int(np.argmax(nd.sum(fg, rot, range(1, n + 1))))
    fg = nd.binary_fill_holes(fg)
    # Frestas de papel entre os fios do cabelo (pontos brancos na borda). Dentes e olhos protegidos.
    return limpar_cabelo(rgb, fg, y_max=700, protegidos=[(380, 520, 600, 640), (300, 360, 640, 430)])


def preencher(rgb, conhecido, alvo):
    """Pinta 'alvo' com a cor do pixel conhecido mais próximo e suaviza só a área pintada."""
    _, (iy, ix) = nd.distance_transform_edt(~conhecido, return_indices=True)
    cheio = rgb[iy, ix].astype(float)
    suave = np.stack([nd.uniform_filter(cheio[..., c], 9) for c in range(3)], -1)
    out = rgb.astype(float).copy()
    out[alvo] = suave[alvo]
    return out.astype(np.uint8)


def main():
    rgb = np.asarray(Image.open(CONCEITO).convert("RGB"))
    forma = rgb.shape[:2]
    fg = mascara_personagem(rgb)

    # 1) Dono de cada pixel visível: a peça de z mais alto cujo polígono o contém.
    dono = np.full(forma, "", dtype=object)
    for nome, p in sorted(PECAS.items(), key=lambda kv: -kv[1]["z"]):
        if p["poli"]:
            m = poligono(forma, p["poli"]) & fg & (dono == "")
            dono[m] = nome
    # Lascas da manga direita fora dos polígonos (à esquerda do tronco) vão para o braço, não para o tronco:
    # se ficassem no tronco, apareceriam soltas no ar quando o braço se mexe.
    yy, xx = np.mgrid[:forma[0], :forma[1]]
    lasca = fg & (dono == "") & (xx < 392) & (yy > 740) & (yy < 1040)
    dono[lasca & (yy < 905)] = "braco_dir"
    dono[lasca & (yy >= 905)] = "antebraco_dir"  # (x < 392: à esquerda da mão)
    # Garrafa (verde) e pontas dos dedos (pele) que passaram da borda do polígono também são da mão.
    r_, g_, b_ = (rgb[..., i].astype(int) for i in range(3))
    perto_mao = (xx > 365) & (xx < 462) & (yy > 785) & (yy < 1012)
    verde = (g_ > r_ + 15) & (g_ > b_)
    pele = (r_ > 150) & (r_ > g_ + 25) & (g_ > b_) & (yy > 858) & (yy < 972) & (xx < 455)
    dono[fg & perto_mao & (verde | pele)] = "mao_dir"
    # Pedacinhos desconectados nas peças dos braços (lascas de borda) voltam para o tronco.
    for nome in ("braco_dir", "antebraco_dir", "mao_dir", "braco_esq", "antebraco_esq"):
        rot, n = nd.label(dono == nome)
        if n > 1:
            tam = nd.sum(np.ones(forma), rot, range(1, n + 1))
            for i, t in enumerate(tam, 1):
                if t < 0.02 * tam.max():
                    dono[rot == i] = ""
    resto = fg & (dono == "") & (np.arange(forma[0])[:, None] < 1100)
    dono[resto] = "torso"
    sobra = fg & (dono == "")
    dono[sobra] = "quadril"  # pixels soltos na altura do quadril

    SAIDA.mkdir(parents=True, exist_ok=True)
    CONFERENCIA.mkdir(parents=True, exist_ok=True)
    rig = {"versao": 1, "vista": "S", "fonte": "reference/kit_v1.0/01_personagem/personagem_conceito.png",
           "tamanho_fonte": [forma[1], forma[0]],
           "ossos": [{"nome": n, "pai": pai, "pivo": list(pv)} for n, pai, pv in OSSOS], "pecas": []}
    z_de = {n: p["z"] for n, p in PECAS.items()}
    for nome, p in PECAS.items():
        visivel = dono == nome
        ext = np.zeros(forma, bool)
        if p.get("ext"):
            ext |= poligono(forma, p["ext"])
        if p.get("circ"):
            ext |= circulo(forma, *p["circ"])
        ext &= fg & ~visivel
        # Na aba: copia o original se o dono for do mesmo material ou estiver ATRÁS desta peça; senão, preenche.
        copia = np.isin(dono, p["copia"]) | np.vectorize(lambda d: d != "" and z_de.get(d, -1) < p["z"])(dono)
        copia &= ext
        pinta = ext & ~copia
        conhecido = visivel | copia
        cor = preencher(rgb, conhecido, pinta) if pinta.any() else rgb
        alfa = (visivel | ext)
        ys, xs = np.where(alfa)
        x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
        rgba = np.dstack([cor, (alfa * 255).astype(np.uint8)])[y0:y1, x0:x1]
        Image.fromarray(rgba, "RGBA").save(SAIDA / f"{nome}.png", optimize=True)
        rig["pecas"].append({"nome": nome, "osso": nome, "arquivo": f"{nome}.png", "origem": [int(x0), int(y0)],
                             "tamanho": [int(x1 - x0), int(y1 - y0)], "z": p["z"],
                             "pixels_visiveis": int(visivel.sum()), "pixels_aba": int(ext.sum())})
    rig["pecas"].sort(key=lambda q: q["z"])
    (SAIDA / "rig.json").write_text(json.dumps(rig, ensure_ascii=False, indent=2), encoding="utf-8")

    # Conferência: cada peça com uma cor por cima do original, pivôs marcados.
    cores = np.array([(230, 25, 75), (60, 180, 75), (255, 225, 25), (0, 130, 200), (245, 130, 48), (145, 30, 180),
                      (70, 240, 240), (240, 50, 230), (210, 245, 60), (250, 190, 212), (0, 128, 128), (170, 110, 40)])
    vis = rgb.astype(float) * 0.45
    for i, nome in enumerate(sorted(PECAS, key=lambda n: PECAS[n]["z"])):
        vis[dono == nome] = vis[dono == nome] * 0.5 + cores[i % len(cores)] * 0.55
    im = Image.fromarray(np.clip(vis, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    for n, _, (x, y) in OSSOS:
        d.ellipse([x - 7, y - 7, x + 7, y + 7], outline=(255, 255, 255), width=3)
        d.text((x + 9, y - 6), n, fill=(255, 255, 255))
    im.save(CONFERENCIA / "pecas_conferencia.png")
    print("peças:", ", ".join(f"{q['nome']}({q['pixels_visiveis']}+{q['pixels_aba']})" for q in rig["pecas"]))
    print("sem dono (deve ser 0):", int((fg & (dono == "")).sum()))


if __name__ == "__main__":
    main()
