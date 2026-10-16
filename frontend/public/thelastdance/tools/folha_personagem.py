#!/usr/bin/env python3
"""Folha com as 4 vistas lado a lado (frente, lado direito, costas, lado esquerdo — a ordem que o ChatGPT entrega)
-> 4 PNGs no canvas do kit (1024x1536), sem fundo e encaixados no manequim (mesma altura e mesmo lugar dos pés).

Uso (a partir de frontend/public/thelastdance/):
    python -I tools/folha_personagem.py <folha.png> <id> [--ordem frente,lado_direito,costas,lado_esquerdo]
        [--roupa-branca]  (roupa branca/cinza clara: o tecido tem os tons do xadrez; não apaga pedaços dela)
        [--grade]   (folha 2x2: lidas por linha, da esquerda para a direita; padrão da ordem vira
                     frente,costas,lado_direito,lado_esquerdo)
-> kit_chatgpt/personagens/prontas/<id>/<vista>.png ; depois: python -I tools/personagem_kit.py <essa pasta> <id>

Fundo: o "xadrez de transparente" que o gerador pinta na imagem. Os dois tons dele são lidos nos cantos da folha;
pixel cinza neutro perto de um desses tons é fundo, inclusive as ilhas presas entre o cabelo e o pescoço.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as nd

sys.path.insert(0, str(Path(__file__).resolve().parent))
import roupa_ia as R  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent


def tons_do_xadrez(a):
    cantos = np.concatenate([a[:40, :40].reshape(-1, 3), a[:40, -40:].reshape(-1, 3),
                             a[-40:, :40].reshape(-1, 3), a[-40:, -40:].reshape(-1, 3)]).astype(int)
    lum = cantos.mean(1)
    if lum.max() - lum.min() < 20:  # fundo liso (branco), não xadrez
        return [round(lum.mean())]
    corte = (lum.min() + lum.max()) / 2
    return sorted({round(lum[lum < corte].mean()), round(lum[lum >= corte].mean())})


def fundo(a, roupa_branca=False):
    a = a.astype(int)
    tons = tons_do_xadrez(a)
    lum = a.mean(-1)
    spread = a.max(-1) - a.min(-1)
    if len(tons) == 1:
        return fundo_liso(a, lum, spread, tons), tons
    neutro = spread <= 7
    perto = np.zeros(lum.shape, bool)
    for t in tons:
        perto |= np.abs(lum - t) <= 14
    candidato = neutro & perto
    # riscos/manchas claras do "papel" ligados à borda também são fundo
    claro = (spread < 22) & (lum > min(tons) - 15)
    rot, _ = nd.label(claro)
    borda = set(np.unique(np.concatenate([rot[0], rot[-1], rot[:, 0], rot[:, -1]]))) - {0}
    f = np.isin(rot, list(borda))
    # ilhas de xadrez presas no desenho (entre cabelo e pescoço): pixels do xadrez em grupos de 20+ px, desde que
    # na vizinhança (~2 casas) apareçam OS DOIS tons — uma regata branca com sombreado tem só um.
    # --roupa-branca: roupa branca com sombreado cinza (tem os mesmos tons do xadrez) -> critério bem mais rígido
    tol, janela, minimo = (8, 25, 0.22) if roupa_branca else (14, 31, 0.06)
    tomA = candidato & (np.abs(lum - tons[0]) <= tol)
    tomB = candidato & (np.abs(lum - tons[1]) <= tol)
    fa = nd.uniform_filter(tomA.astype(float), janela)
    fb = nd.uniform_filter(tomB.astype(float), janela)
    xadrez = (tomA | tomB) & (fa > minimo) & (fb > minimo)
    rot2, n2 = nd.label(xadrez)
    tam = nd.sum(xadrez, rot2, range(1, n2 + 1))
    f |= np.isin(rot2, np.where(tam >= 20)[0] + 1)
    # fiapos: borda acinzentada (xadrez misturado com a ponta do cabelo) encostada no fundo vai embora, aos poucos
    lum_ok = (lum > min(tons) - 25) & (lum < max(tons) + 25)
    acinzentado = (spread < 28) & lum_ok
    acinzentado &= ~((a[..., 0] - a[..., 2] >= 6) & (lum > 175))  # claro e quente = tecido branco, não fundo
    acinzentado &= ~(lum > max(tons) - 3)  # branco limpo (regata, jaleco) encostado no fundo não é fiapo
    for _ in range(3):
        encosta = nd.binary_dilation(f) & ~f & acinzentado
        if not encosta.any():
            break
        f |= encosta
    return limpar_sobras(f), tons


def fundo_liso(a, lum, spread, tons):
    """Fundo branco liso: roupa branca (jaleco, toalha) também é quase branca, então só é fundo o branco ligado à
    borda e os vãos fechados (entre braço e corpo) cercados pelo contorno escuro — não o branco do tecido, que
    encosta em sombreado cinza."""
    t = tons[0]
    branco = (lum >= t - 8) & (spread <= 8)
    rot, n = nd.label(branco)
    borda = set(np.unique(np.concatenate([rot[0], rot[-1], rot[:, 0], rot[:, -1]]))) - {0}
    f = np.isin(rot, list(borda))
    tam = nd.sum(branco, rot, range(1, n + 1))
    escuro = lum < 95
    for k in np.where(tam >= 150)[0] + 1:
        if k in borda:
            continue
        ilha = rot == k
        anel = nd.binary_dilation(ilha, iterations=3) & ~ilha
        if escuro[anel].mean() > 0.55:   # cercada de contorno: é vão, não tecido
            f |= ilha
    return limpar_sobras(f)


def limpar_sobras(f):
    # pedacinhos soltos que sobraram no meio do fundo
    sobra, n3 = nd.label(~f)
    tam3 = nd.sum(~f, sobra, range(1, n3 + 1))
    return f | np.isin(sobra, np.where(tam3 < 400)[0] + 1)


def main():
    folha, ident = Path(sys.argv[1]), sys.argv[2]
    grade = "--grade" in sys.argv
    ordem = (sys.argv[sys.argv.index("--ordem") + 1].split(",") if "--ordem" in sys.argv
             else ["frente", "costas", "lado_direito", "lado_esquerdo"] if grade
             else ["frente", "lado_direito", "costas", "lado_esquerdo"])
    a = np.asarray(Image.open(folha).convert("RGB"))
    f, tons = fundo(a, roupa_branca="--roupa-branca" in sys.argv)
    obj = nd.binary_opening(~f, iterations=1)
    rot, n = nd.label(obj)
    tam = nd.sum(obj, rot, range(1, n + 1))
    maiores = np.argsort(tam)[::-1][:len(ordem)] + 1
    caixas = nd.find_objects(rot)
    meio_y = a.shape[0] / 2
    chave = ((lambda t: ((t[0][0].start + t[0][0].stop) / 2 > meio_y, t[0][1].start)) if grade
             else (lambda t: t[0][1].start))
    itens = sorted([(caixas[k - 1], k) for k in maiores], key=chave)
    W, H = R.rig()["canvas"]
    destino = RAIZ / "kit_chatgpt" / "personagens" / "prontas" / ident
    destino.mkdir(parents=True, exist_ok=True)
    for vista, ((sy, sx), k) in zip(ordem, itens):
        mask = rot == k
        mask |= nd.binary_fill_holes(mask) & ~f  # buraquinhos do contorno voltam; os de xadrez não
        rgba = np.zeros(a.shape[:2] + (4,), np.uint8)
        rgba[..., :3] = a
        rgba[..., 3] = np.where(mask, 255, 0)
        peca = Image.fromarray(rgba).crop((sx.start, sy.start, sx.stop, sy.stop))
        man = np.asarray(R.montar(vista))[..., 3] > 16
        ym, _ = np.where(man)
        esc = (ym.max() - ym.min()) / peca.height
        peca = peca.resize((max(1, round(peca.width * esc)), round(peca.height * esc)), Image.LANCZOS)
        cx = np.where(man[ym.max() - 40: ym.max() + 1].any(0))[0].mean()
        tela = Image.new("RGBA", (W, H))
        tela.alpha_composite(peca, (int(cx - peca.width / 2), int(ym.min())))
        tela.save(destino / f"{vista}.png")
        print(vista, "escala %.2f" % esc)
    print("xadrez", tons, "->", destino)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
