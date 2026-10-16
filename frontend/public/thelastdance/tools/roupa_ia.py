#!/usr/bin/env python3
"""Roupa nova para o personagem modular feita por IA (Higgsfield/Nano Banana, ChatGPT...) dentro dos moldes.

Uso (a partir de frontend/public/thelastdance/):
    python -I tools/roupa_ia.py moldes <pasta>
        -> <pasta>/molde_<vista>.png: o corpo montado em pé, no canvas 1024x1536 da vista, sobre verde
           (é a imagem que vai para o gerador, com o pedido de vestir a roupa sem mexer em mais nada)
    python -I tools/roupa_ia.py extrair <pasta> --pecas camisa|regata|shorts
    python -I tools/roupa_ia.py grade <pasta>   (uma folha 2x2 gerada a partir de molde_grade.png -> gerado_<vista>.png)
        -> lê <pasta>/gerado_<vista>.png, alinha com o molde, separa o que mudou (a roupa) e divide pelas peças
           do corpo; grava <pasta>/kit/1_frente/roupa_<peça>.png ... no formato do kit de molde, pronto para
           node scripts/importar-roupa.mjs <pasta>/kit --id ... (na pasta frontend)

Peças por tipo de roupa (--pecas): camisa = tronco + braços. Nas laterais o importador cria sozinho a cópia
escurecida do braço da frente para o de trás; o braco_tras daqui só cobre a manga da camiseta dele.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
PACOTE = RAIZ / "personagem_modular"
PASTAS = {"frente": "1_frente", "costas": "2_costas", "lado_direito": "3_lado_direito", "lado_esquerdo": "4_lado_esquerdo"}
PECAS = {
    "camisa": {
        "frente": ["tronco", "braco_sup_esq", "antbraco_esq", "braco_sup_dir", "antbraco_dir"],
        "costas": ["tronco", "braco_dir", "braco_esq"],
        "lado_direito": ["tronco", "braco", "braco_tras"],   # braco_tras: só cobre a manga dele (aparece ao andar)
        "lado_esquerdo": ["tronco", "braco", "braco_tras"],
    },
    # shorts: as pernas inteiras (a parte de baixo vira pele + meia); o jeans da base tem de sumir por completo
    "shorts": {
        "frente": ["coxa_esq", "coxa_dir", "canela_esq", "canela_dir"],
        "costas": ["coxa_esq", "coxa_dir", "canela_esq", "canela_dir"],
        "lado_direito": ["coxa", "canela", "coxa_tras", "canela_tras"],
        "lado_esquerdo": ["coxa", "canela", "coxa_tras", "canela_tras"],
    },
}
PECAS["regata"] = PECAS["camisa"]  # regata: mesmas peças (os braços viram pele)
COBRIR_TUDO = {"shorts"}  # a peça inteira da base é coberta (não só o branco da camiseta)
VERDE = (0, 255, 0)


def rig():
    return json.loads((PACOTE / "rig.json").read_text(encoding="utf-8"))


def camadas(vista):
    """Peças da vista em ordem de desenho: (nome, z, imagem RGBA, x, y)."""
    v = rig()["vistas"][vista]
    out = []
    for c in sorted(v["camadas"], key=lambda c: c["z"]):
        out.append((c["nome"], c["z"], Image.open(PACOTE / c["img"]).convert("RGBA"), c["x"], c["y"]))
    return out


def montar(vista):
    W, H = rig()["canvas"]
    tela = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    for _, _, im, x, y in camadas(vista):
        tela.alpha_composite(im, (x, y))
    return tela


def mascaras(vista):
    """Máscara de cada peça no canvas e o mapa de 'quem aparece por cima' (nome da peça de maior z)."""
    W, H = rig()["canvas"]
    m, topo = {}, np.full((H, W), "", dtype=object)
    for nome, _, im, x, y in camadas(vista):
        a = np.zeros((H, W), bool)
        alfa = np.asarray(im)[..., 3] > 16
        a[y:y + alfa.shape[0], x:x + alfa.shape[1]] = alfa[:H - y, :W - x]
        m[nome] = a
        topo[a] = nome
    return m, topo


def dilatar(a, r):
    out = a.copy()
    for _ in range(r):
        b = out.copy()
        b[1:] |= out[:-1]; b[:-1] |= out[1:]; b[:, 1:] |= out[:, :-1]; b[:, :-1] |= out[:, 1:]
        out = b
    return out


def erodir(a, r):
    return ~dilatar(~a, r)


def cmd_moldes(pasta):
    pasta.mkdir(parents=True, exist_ok=True)
    for vista in PASTAS:
        t = montar(vista)
        fundo = Image.new("RGBA", t.size, VERDE + (255,))
        fundo.alpha_composite(t)
        fundo.convert("RGB").save(pasta / f"molde_{vista}.png")
        print("molde", vista, t.size)


def alinhar(base, gerado, mascara_ref):
    """Desloca o gerado (dx, dy até ±40 px) para bater com o molde na região que não muda (cabeça)."""
    b = base.astype(np.int32)
    ys, xs = np.where(mascara_ref)
    melhor, d_melhor = (0, 0), None
    for passo, raio, centro in ((4, 40, (0, 0)), (1, 4, None)):
        cx, cy = centro if centro else melhor
        for dy in range(cy - raio, cy + raio + 1, passo):
            for dx in range(cx - raio, cx + raio + 1, passo):
                y2, x2 = ys + dy, xs + dx
                ok = (y2 >= 0) & (y2 < gerado.shape[0]) & (x2 >= 0) & (x2 < gerado.shape[1])
                d = np.abs(gerado[y2[ok], x2[ok]].astype(np.int32) - b[ys[ok], xs[ok]]).sum() / max(1, ok.sum())
                if d_melhor is None or d < d_melhor:
                    d_melhor, melhor = d, (dx, dy)
    dx, dy = melhor
    H, W = base.shape[:2]
    saida = np.zeros_like(base)
    ys2, xs2 = np.mgrid[0:H, 0:W]
    ys3, xs3 = np.clip(ys2 + dy, 0, gerado.shape[0] - 1), np.clip(xs2 + dx, 0, gerado.shape[1] - 1)
    saida[:] = gerado[ys3, xs3]
    return saida, melhor, d_melhor


def cmd_extrair(pasta, tipo):
    W, H = rig()["canvas"]
    kit = pasta / "kit"
    for vista, nome_pasta in PASTAS.items():
        arq = pasta / f"gerado_{vista}.png"
        if not arq.exists():
            print("sem", arq.name, "(vista ignorada)")
            continue
        base_rgba = np.asarray(montar(vista))
        base = np.asarray(Image.open(pasta / f"molde_{vista}.png").convert("RGB"))
        ger = np.asarray(Image.open(arq).convert("RGB").resize((W, H), Image.LANCZOS))
        m, topo = mascaras(vista)
        ger, desl, erro = alinhar(base, ger, erodir(m["cabeca"], 3))
        pecas = PECAS[tipo][vista]
        regiao = dilatar(np.any([m[p] for p in pecas], axis=0), 22)
        for proibida in ("cabeca", "mao_esq", "mao_dir"):  # rosto e mãos não são roupa
            if proibida in m:
                regiao &= ~m[proibida]
        mudou = np.abs(ger.astype(np.int32) - base.astype(np.int32)).sum(-1) > 90
        # fundo verde que sobrou no gerado não é roupa
        verde = (ger[..., 1] > 150) & (ger[..., 1] > ger[..., 0] + 60) & (ger[..., 1] > ger[..., 2] + 60)
        # franja verde do fundo misturada no contorno: tira o que é bem verde e "despila" o resto (verde <= max(r, b))
        gi = ger.astype(np.int32)
        verde |= (gi[..., 1] > gi[..., 0] + 35) & (gi[..., 1] > gi[..., 2] + 35)
        ger = ger.copy()
        ger[..., 1] = np.minimum(gi[..., 1], np.maximum(gi[..., 0], gi[..., 2]) + 8).astype(ger.dtype)
        roupa = regiao & mudou & ~verde
        roupa = erodir(dilatar(roupa, 3), 3)          # fecha buraquinhos (contorno igual ao do molde)
        roupa = dilatar(erodir(roupa, 2), 2) & regiao  # tira pontinhos soltos
        # a roupa nova precisa cobrir a camiseta branca do corpo: onde ela não chega (desenho mais estreito),
        # pinta com a cor da roupa mais próxima — senão a camiseta aparece por baixo
        # (peça por peça, inclusive a parte que outra peça esconde parada: ao andar, o braço balança e ela aparece)
        camiseta, camiseta_de = np.zeros((H, W), bool), {}
        for nome, _, im, x, y in camadas(vista):
            if nome not in pecas:
                continue
            px = np.asarray(im).astype(np.int32)
            claro = (px[..., :3].min(-1) > 110) & (px[..., :3].max(-1) - px[..., :3].min(-1) < 50) & (px[..., 3] > 16)
            if tipo in COBRIR_TUDO:
                claro = px[..., 3] > 16
            cp = np.zeros((H, W), bool)
            cp[y:y + claro.shape[0], x:x + claro.shape[1]] = claro[:H - y, :W - x]
            camiseta_de[nome] = cp
            camiseta |= cp
        cobrir = camiseta & ~roupa
        cor, conhecido = ger.copy(), roupa.copy()
        for _ in range(160):
            falta = cobrir & ~conhecido
            if not falta.any():
                break
            for sh in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                vem = np.roll(conhecido, sh, axis=(0, 1)) & falta
                cor[vem] = np.roll(cor, sh, axis=(0, 1))[vem]
                conhecido |= vem
                falta &= ~vem
        ger = cor
        coberto = cobrir & conhecido
        # cada pixel da roupa vai para a peça que aparece por cima ali; fora das peças, para a mais próxima
        rotulo = np.full((H, W), -1, np.int32)
        for i, p in enumerate(pecas):
            rotulo[(topo == p)] = i
        for _ in range(40):
            falta = roupa & (rotulo < 0)
            if not falta.any():
                break
            viz = rotulo.copy()
            for sh in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                r2 = np.roll(rotulo, sh, axis=(0, 1))
                viz = np.where((viz < 0) & (r2 >= 0), r2, viz)
            rotulo = np.where(falta, viz, rotulo)
        (kit / nome_pasta).mkdir(parents=True, exist_ok=True)
        resumo = []
        for i, p in enumerate(pecas):
            # o que aparece desta peça + a camiseta dela que precisou ser coberta (mesmo escondida por outra)
            sel = (roupa & (rotulo == i)) | ((roupa | coberto) & camiseta_de.get(p, np.zeros((H, W), bool)))
            if sel.sum() < 50:
                continue
            img = np.zeros((H, W, 4), np.uint8)
            img[..., :3] = ger
            img[..., 3] = np.where(sel, 255, 0)
            Image.fromarray(img, "RGBA").save(kit / nome_pasta / f"roupa_{p}.png")
            resumo.append(f"{p}:{int(sel.sum())}")
        # conferência: roupa recortada por cima do molde
        conf = Image.fromarray(base).convert("RGBA")
        sobre = np.zeros((H, W, 4), np.uint8); sobre[..., :3] = ger; sobre[..., 3] = np.where(roupa | coberto, 255, 0)
        conf.alpha_composite(Image.fromarray(sobre, "RGBA"))
        conf.convert("RGB").save(pasta / f"conferir_{vista}.png")
        print(vista, "deslocamento", desl, "erro %.1f" % erro, " ".join(resumo))


def cmd_grade(pasta):
    """Folha 2x2 (frente, costas / lado direito, lado esquerdo) gerada sobre molde_grade.png -> 4 gerado_<vista>.png."""
    W, H = rig()["canvas"]
    g = Image.open(pasta / "gerado_grade.png").convert("RGB").resize((2 * W, 2 * H), Image.LANCZOS)
    for i, vista in enumerate(["frente", "costas", "lado_direito", "lado_esquerdo"]):
        x, y = (i % 2) * W, (i // 2) * H
        g.crop((x, y, x + W, y + H)).save(pasta / f"gerado_{vista}.png")
    print("grade ->", pasta)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    acao, pasta = sys.argv[1], Path(sys.argv[2])
    if acao == "moldes":
        cmd_moldes(pasta)
    elif acao == "grade":
        cmd_grade(pasta)
    elif acao == "extrair":
        cmd_extrair(pasta, sys.argv[sys.argv.index("--pecas") + 1] if "--pecas" in sys.argv else "camisa")
