"""Limpeza da máscara do personagem, compartilhada pelas ferramentas de recorte.

limpar_cabelo: tira as frestas de fundo (papel/branco) presas entre os fios na borda do cabelo e a franja clara
em volta delas. Sem isso, aparecem "pontos brancos" no contorno do cabelo sobre o cenário escuro.
"""
import numpy as np
from scipy import ndimage as nd


def limpar_cabelo(rgb, fg, y_max, protegidos=(), dist_max=28, rodadas=3):
    """Aplica _uma_rodada até 'rodadas' vezes: tirar as frestas de fora deixa as de dentro perto da borda."""
    for _ in range(rodadas):
        novo = _uma_rodada(rgb, fg, y_max, protegidos, dist_max)
        if (novo == fg).all():
            break
        fg = novo
    return fg


def _uma_rodada(rgb, fg, y_max, protegidos, dist_max):
    """Devolve a máscara sem as frestas claras do cabelo.

    rgb: imagem (H, W, 3); fg: máscara do personagem (já sem o fundo de fora).
    y_max: só mexe acima desta linha (altura do cabelo). protegidos: caixas (x0, y0, x1, y1) que nunca são
    tocadas, como dentes e olhos perto da borda. dist_max: só vale para claros a até N px do fundo de fora.
    """
    rgb = rgb.astype(int)
    lum = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]
    sat = rgb.max(2) - rgb.min(2)
    yy = np.arange(fg.shape[0])[:, None]
    zona = yy < y_max
    prot = np.zeros(fg.shape, bool)
    for x0, y0, x1, y1 in protegidos:
        prot[y0:y1, x0:x1] = True
    claro = fg & (lum > 140) & (sat < 85) & zona & ~prot
    perto = nd.distance_transform_edt(fg) <= dist_max
    rot, _ = nd.label(claro)
    ids = np.unique(rot[claro & perto])
    ids = ids[ids > 0]
    if len(ids):
        tam = nd.sum(np.ones(fg.shape), rot, ids)
        ids = ids[tam <= 4000]  # segurança: nunca come uma região clara grande (camiseta, rosto)
    # Sai cada pixel claro perto da borda externa, e também as regiões claras pequenas que encostam nele.
    limpo = fg & ~np.isin(rot, ids) & ~(claro & perto)
    borda = limpo & ~nd.binary_erosion(limpo)
    limpo &= ~(borda & (lum > 120) & (sat < 90) & zona & ~prot)  # franja de 1 px que sobrou encostada no fundo
    return limpo
