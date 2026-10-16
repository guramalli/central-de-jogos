#!/usr/bin/env python3
"""Personagem novo do kit (4 vistas inteiras, kit_chatgpt/personagens) -> personagem modular que anda.

Uso (a partir de frontend/public/thelastdance/):
    python -I tools/personagem_kit.py <pasta com frente.png costas.png lado_direito.png lado_esquerdo.png> <id>
        [--espelhar-esquerdo]   (lado esquerdo = lado direito espelhado, quando a vista esquerda veio com defeito)

Usa o MESMO esqueleto e as MESMAS animações do protagonista (personagem_modular/rig.json e animacoes.json):
cada pixel do desenho vai para o osso mais próximo (cápsula entre a junta da peça e a ponta dela no protagonista),
com uma sobra pequena nas juntas para não abrir buraco quando o osso gira. Nas laterais, a perna e o braço "de trás"
são a cópia escurecida dos da frente (como o importador de roupas faz).
Saída: assets/characters/npcs/<id>/<vista>/<peça>.png + personagem.json ({rig, animacoes} para PersonagemModular).
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import roupa_ia as R  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
TRAS = {"coxa_tras": "coxa", "canela_tras": "canela", "pe_tras": "pe_frente", "braco_tras": "braco"}
SOBRA = 6  # px de sobra nas juntas


def dist_segmento(px, py, a, b):
    ax, ay = a; bx, by = b
    vx, vy = bx - ax, by - ay
    L = vx * vx + vy * vy or 1.0
    t = np.clip(((px - ax) * vx + (py - ay) * vy) / L, 0, 1)
    return np.hypot(px - (ax + t * vx), py - (ay + t * vy))


def recortar(img, vista):
    rig = R.rig()
    v = rig["vistas"][vista]
    W, H = rig["canvas"]
    m, _ = R.mascaras(vista)
    a = np.asarray(img.convert("RGBA"))
    alfa = a[..., 3] > 16
    ys, xs = np.mgrid[0:H, 0:W]
    pecas = [c["nome"] for c in v["camadas"] if c["nome"] not in TRAS]
    # cada peça: cápsula da junta (pivô do osso) até o ponto mais distante da peça no protagonista
    dist = []
    for nome in pecas:
        osso = next(c["osso"] for c in v["camadas"] if c["nome"] == nome)
        piv = v["ossos"][osso]["pivo"] if osso != "root" else [W / 2, H * 0.7]
        py_, px_ = np.where(m[nome])
        d = np.hypot(px_ - piv[0], py_ - piv[1])
        ponta = (px_[d.argmax()], py_[d.argmax()])
        if nome in ("tronco", "cabeca"):  # peças largas: do pivô ao centro (não à ponta)
            ponta = (px_.mean(), py_.mean())
        dd = dist_segmento(xs, ys, piv, ponta).astype(np.float32)
        # dentro da peça original vale mais (desempata ombro/tronco, quadril/coxa)
        dd[m[nome]] -= 25
        if nome not in ("tronco", "cabeca"):
            # braço/perna só pega o que está perto do membro do protagonista; quadril, short e barriga ficam no
            # tronco (senão saem andando junto com a perna)
            perto = R.dilatar(m[nome], 18)
            if nome.startswith("coxa"):
                perto &= ys > piv[1] + 45   # a coxa começa abaixo da virilha
            dd[~perto] = 1e6
        dist.append(dd)
    dist = np.stack(dist)
    dono = dist.argmin(0)
    saida = {}
    for i, nome in enumerate(pecas):
        sel = alfa & (dono == i)
        if sel.sum() < 30:
            continue
        sel = R.dilatar(sel, SOBRA) & alfa  # sobra nas juntas
        peca = np.zeros_like(a); peca[sel] = a[sel]
        saida[nome] = peca
    # o tronco precisa ter "o que fica atrás do braço": quando o braço balança, mostraria um buraco.
    # Preenche essa área do tronco com a cor do tronco mais próxima.
    if "tronco" in saida:
        tronco = saida["tronco"]
        braco = np.zeros((H, W), bool)
        for nome in saida:
            if nome.startswith(("braco", "antbraco", "mao")):
                braco |= saida[nome][..., 3] > 0
        conhecido = tronco[..., 3] > 0
        cobrir = braco & R.dilatar(conhecido, 40) & ~conhecido
        for _ in range(60):
            falta = cobrir & ~conhecido
            if not falta.any():
                break
            for sh in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                vem = np.roll(conhecido, sh, axis=(0, 1)) & falta
                tronco[vem] = np.roll(tronco, sh, axis=(0, 1))[vem]
                conhecido |= vem
                falta &= ~vem
    for tras, frente in TRAS.items():  # cópia (um pouco mais escura) para o membro de trás (laterais)
        if frente in saida and any(c["nome"] == tras for c in v["camadas"]):
            p = saida[frente].copy(); p[..., :3] = (p[..., :3] * 0.9).astype(np.uint8)
            saida[tras] = p
    return saida


def suavizar_bracos(anim, rig, fator):
    """Nas laterais, o braço desenhado colado no corpo não pode balançar tanto quanto o do protagonista:
    reduz o ângulo do braço (girando em volta da junta) pelo fator dado."""
    import math
    for vista in ("lado_direito", "lado_esquerdo"):
        ossos = rig["vistas"][vista]["ossos"]
        for nome_anim in anim:
            for q in anim[nome_anim]["vistas"].get(vista, []):
                for osso in ("braco", "braco_tras"):
                    if osso not in q or osso not in ossos:
                        continue
                    a, b = q[osso][0], q[osso][1]
                    ang = math.atan2(b, a) * fator
                    c_, s_ = math.cos(ang), math.sin(ang)
                    px, py = ossos[osso]["pivo"]
                    q[osso] = [c_, s_, -s_, c_, px - c_ * px + s_ * py, py - s_ * px - c_ * py]


def main():
    pasta, ident = Path(sys.argv[1]), sys.argv[2]
    destino = RAIZ / "assets" / "characters" / "npcs" / ident
    rig = json.loads((R.PACOTE / "rig.json").read_text(encoding="utf-8"))
    anim = json.loads((R.PACOTE / "animacoes.json").read_text(encoding="utf-8"))
    suavizar_bracos(anim, rig, 0.35)
    for vista in R.PASTAS:
        if vista == "lado_esquerdo" and "--espelhar-esquerdo" in sys.argv:
            # espelha o lado direito e encaixa nos limites do manequim esquerdo
            dir_ = Image.open(pasta / "lado_direito.png").convert("RGBA").transpose(Image.FLIP_LEFT_RIGHT)
            a = np.asarray(dir_)[..., 3] > 16
            man = np.asarray(R.montar("lado_esquerdo"))[..., 3] > 16
            dx = int(np.where(man)[1].mean() - np.where(a)[1].mean())
            img = Image.new("RGBA", dir_.size); img.alpha_composite(dir_, (dx, 0))
        else:
            img = Image.open(pasta / f"{vista}.png")
        pecas = recortar(img, vista)
        camadas = []
        for c in rig["vistas"][vista]["camadas"]:
            p = pecas.get(c["nome"])
            if p is None:
                continue
            ys, xs = np.where(p[..., 3] > 0)
            x0, y0 = int(xs.min()), int(ys.min())
            rel = f"{vista}/{c['nome']}.png"
            (destino / vista).mkdir(parents=True, exist_ok=True)
            Image.fromarray(p[y0:ys.max() + 1, x0:xs.max() + 1]).save(destino / rel, optimize=True)
            camadas.append(dict(c, img=rel, x=x0, y=y0))
        rig["vistas"][vista]["camadas"] = camadas
        print(vista, len(camadas), "peças")
    (destino / "personagem.json").write_text(json.dumps({"rig": rig, "animacoes": anim}, ensure_ascii=False),
                                             encoding="utf-8")
    print("ok:", destino)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
