"""Alinha a forma 3D com a ficha e mede a QUALIDADE (semelhança das silhuetas em cada vista).

Roda no Python das ferramentas 3D:
    C:/Users/gh0st/Projects/ferramentas3d/.venv/Scripts/python.exe tools/modelo3d_alinhar.py <forma.glb> <pasta_entrada>

1. Testa as 8 orientações possíveis (4 giros em torno do eixo vertical × espelhado ou não) e escolhe a que
   faz as silhuetas do modelo baterem com as da ficha (frente, esquerda, costas, direita).
2. Calcula escala e deslocamento de cada vista (a pintura projeta os desenhos usando isso).
3. Mede a semelhança (IoU: área em comum ÷ área total) por vista. Padrão de qualidade: >= 0,90 em todas.
Gera alinhamento.json e silhuetas.png (desenho × modelo, por vista) na pasta da forma.
"""
import json
import sys
from pathlib import Path

import numpy as np
import trimesh
from PIL import Image, ImageDraw

VISTAS = ["front", "left", "back", "right"]
LIMITE = 0.90
RES = 512  # resolução da comparação


def carregar(caminho):
    cena = trimesh.load(caminho, force="scene")
    malha = trimesh.util.concatenate([g for g in cena.dump()])  # aplica as transformações da cena
    return malha


def rot_y(graus):  # glTF: Y para cima
    r = np.radians(graus)
    c, s = np.cos(r), np.sin(r)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])


# Câmera de cada vista olhando o personagem: tela-x = eixo do mundo, tela-y = -Y (para baixo).
# Frente: olha de +Z (personagem olha para +Z). Esquerda (personagem olhando p/ a esquerda da tela): câmera em +X.
EIXO_TELA = {"front": np.array([1, 0, 0]), "left": np.array([0, 0, -1]),
             "back": np.array([-1, 0, 0]), "right": np.array([0, 0, 1])}


def silhueta(v, faces, vista):
    """Rasteriza a silhueta ortográfica; devolve máscara RES×RES e a caixa (em unidades do mundo)."""
    u = v @ EIXO_TELA[vista]
    w = -v[:, 1]
    u0, u1, w0, w1 = u.min(), u.max(), w.min(), w.max()
    esc = (RES * 0.9) / (w1 - w0)              # mesma ALTURA para modelo e desenho
    px = (u - (u0 + u1) / 2) * esc + RES / 2
    py = (w - w1) * esc + RES * 0.95            # pés na mesma linha
    im = Image.new("L", (RES, RES), 0)
    d = ImageDraw.Draw(im)
    for f in faces:
        d.polygon([(px[i], py[i]) for i in f], fill=255)
    return np.asarray(im) > 0, (u0, u1, w0, w1)


def mascara_desenho(caminho):
    a = np.asarray(Image.open(caminho).convert("RGBA"))[..., 3] > 127
    ys, xs = np.where(a)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    recorte = a[y0:y1, x0:x1]
    h, w = recorte.shape
    esc = (RES * 0.9) / h
    im = Image.fromarray(recorte.astype(np.uint8) * 255).resize((max(1, round(w * esc)), max(1, round(h * esc))))
    tela = Image.new("L", (RES, RES), 0)
    tela.paste(im, ((RES - im.width) // 2, round(RES * 0.95) - im.height))
    return np.asarray(tela) > 127, (int(x0), int(y0), int(x1), int(y1)), a.shape


def iou(a, b, desloc=False):
    """IoU; com desloc=True procura o melhor encaixe horizontal (±8% da largura) e devolve (nota, dx)."""
    if not desloc:
        return float((a & b).sum() / max(1, (a | b).sum()))
    melhor = (-1.0, 0)
    for dx in range(-40, 41, 2):
        bb = np.roll(b, dx, axis=1)
        n = float((a & bb).sum() / max(1, (a | bb).sum()))
        melhor = max(melhor, (n, dx))
    return melhor


CORTE_CABECA = 0.47  # fração da altura (de cima) que conta como cabeça + cabelo


def encaixe_faixa(des, sil, y0, y1):
    """Melhor encaixe horizontal (deslocamento e largura) de uma faixa da silhueta do modelo sobre o desenho."""
    d = des[y0:y1]
    s_ = sil[y0:y1]
    cx = np.where(s_.any(0))[0]
    if len(cx) == 0:
        return {"dx": 0, "escala_x": 1.0, "iou": 0.0}
    centro = (cx.min() + cx.max()) / 2
    melhor = (-1.0, 0, 1.0)
    xs = np.arange(RES)
    for ex in np.arange(0.8, 1.351, 0.025):
        # escala horizontal em torno do centro da faixa do modelo
        orig = np.clip(((xs - centro) / ex + centro).round().astype(int), 0, RES - 1)
        se = s_[:, orig]
        for dx in range(-50, 51, 2):
            sb = np.roll(se, dx, axis=1)
            n = float((d & sb).sum() / max(1, (d | sb).sum()))
            if n > melhor[0]:
                melhor = (n, dx, float(ex))
    return {"dx": melhor[1], "escala_x": round(melhor[2], 4), "iou": round(melhor[0], 4), "centro_px": float(centro)}


def main():
    forma, entrada = Path(sys.argv[1]), Path(sys.argv[2])
    malha = carregar(forma)
    v0 = np.asarray(malha.vertices, float)
    faces = np.asarray(malha.faces)
    # amostra de faces para a busca (rápido); a medida final usa todas
    amostra = faces[np.random.default_rng(0).choice(len(faces), min(len(faces), 15000), replace=False)]
    desenhos = {k: mascara_desenho(entrada / f"{k}.png") for k in VISTAS}

    melhor = None
    for espelho in (False, True):
        for giro in (0, 90, 180, 270):
            m = rot_y(giro) @ (np.diag([-1, 1, 1]) if espelho else np.eye(3))
            v = v0 @ m.T
            notas = {k: iou(silhueta(v, amostra, k)[0], desenhos[k][0], True)[0] for k in VISTAS}
            media = sum(notas.values()) / 4
            if not melhor or media > melhor[0]:
                melhor = (media, giro, espelho, m)
    _, giro, espelho, m = melhor
    v = v0 @ m.T
    res = {"giro_graus": giro, "espelhado": espelho, "matriz": m.tolist(), "vistas": {}}
    painel = Image.new("RGB", (RES * 4, RES + 40), (30, 30, 36))
    dr = ImageDraw.Draw(painel)
    for k, vista in enumerate(VISTAS):
        sil, (u0, u1, w0, w1) = silhueta(v, faces, vista)
        des, caixa, forma_img = desenhos[vista]
        nota, dx = iou(des, sil, True)
        topo = int(RES * 0.95 - RES * 0.9)
        corte = int(topo + RES * 0.9 * CORTE_CABECA)
        cab = encaixe_faixa(des, sil, topo, corte)
        corpo = encaixe_faixa(des, sil, corte, int(RES * 0.95))
        sil = np.roll(sil, dx, axis=1)
        # mapeamento mundo -> pixel do desenho original (pela caixa de cada um)
        x0, y0, x1, y1 = caixa
        res["vistas"][vista] = {
            "iou": round(nota, 4), "passou": nota >= LIMITE,
            "eixo_tela": EIXO_TELA[vista].tolist(), "desloc_px_comparacao": dx,
            "cabeca": cab, "corpo": corpo, "corte_cabeca": CORTE_CABECA,
            "mundo_u": [float(u0), float(u1)], "mundo_w": [float(w0), float(w1)],
            "pixels_x": [x0, x1], "pixels_y": [y0, y1], "tamanho_imagem": [forma_img[1], forma_img[0]],
        }
        cor = np.zeros((RES, RES, 3), np.uint8)
        cor[des & sil] = (230, 230, 230)
        cor[des & ~sil] = (255, 70, 90)    # só no desenho: faltou no modelo
        cor[sil & ~des] = (60, 170, 255)   # só no modelo: sobrou
        painel.paste(Image.fromarray(cor), (k * RES, 40))
        dr.text((k * RES + 8, 10), f"{vista}: IoU {nota:.3f} {'OK' if nota >= LIMITE else 'ABAIXO'}",
                fill=(255, 255, 255))
    res["media_iou"] = round(sum(x["iou"] for x in res["vistas"].values()) / 4, 4)
    res["passou"] = all(x["passou"] for x in res["vistas"].values())
    (forma.parent / "alinhamento.json").write_text(json.dumps(res, indent=2), encoding="utf-8")
    painel.save(forma.parent / "silhuetas.png")
    print(f"orientação: giro {giro}°, espelhado={espelho} | IoU:",
          {k: x["iou"] for k, x in res["vistas"].items()}, "| passou:", res["passou"])


if __name__ == "__main__":
    main()
