#!/usr/bin/env python3
"""Auditoria técnica dos anexos do kit Noite Sem Fim (FASE 0).

Uso (a partir de noite-sem-fim/):
    python3 -I tools/audit_assets.py

Lê reference/kit_v1.0/ e, se existir, reference/privado/ (fora do git).
Gera:
    docs/acceptance/fase_0/inventario.json
    docs/acceptance/fase_0/evid_spritesheet_segmentacao.jpg
Não altera nenhum arquivo de referência.
Depende de: Pillow, numpy, scipy e ffprobe (para o vídeo).
"""
import hashlib
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

RAIZ = Path(__file__).resolve().parent.parent
KIT = RAIZ / "reference" / "kit_v1.0"
PRIVADO = RAIZ / "reference" / "privado"
SAIDA = RAIZ / "docs" / "acceptance" / "fase_0"

ARQUIVOS = [
    (KIT / "01_personagem/personagem_conceito.png", "arte conceitual do protagonista"),
    (KIT / "01_personagem/spritesheet_referencia_NAO_PRONTO.png", "prancha ilustrativa de poses (NÃO é spritesheet)"),
    (KIT / "02_mapas/balada_isometrica_referencia.png", "referência artística da balada"),
    (KIT / "02_mapas/moodboard_locais.png", "moodboard de locais"),
    (KIT / "03_referencias/conceito_geral.png", "conceito geral / universo"),
    (PRIVADO / "foto_referencia_personagem.jpeg", "foto de referência facial (privada)"),
    (PRIVADO / "quadros_video_referencia.png", "quadros do vídeo (privado)"),
    (PRIVADO / "video_base_comodo.mp4", "vídeo do cômodo (privado)"),
]

# Linhas da prancha, de cima para baixo e da esquerda para a direita (faixas x/y medidas na própria prancha).
LINHAS_PRANCHA = [
    ("andando_baixo", (0, 280), (340, 1360)),
    ("parado_frente_lado_costas_cima", (0, 280), (1360, 1983)),
    ("andando_lado", (280, 540), (340, 1360)),
    ("acoes", (280, 540), (1360, 1983)),
    ("andando_costas", (540, 793), (340, 1100)),
    ("andando_cima", (540, 793), (1100, 1983)),
    ("conceito_grande", (0, 793), (0, 340)),
]


def sha256(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for bloco in iter(lambda: f.read(1 << 20), b""):
            h.update(bloco)
    return h.hexdigest()


def info_imagem(p):
    im = Image.open(p)
    d = {
        "formato": im.format,
        "largura": im.width,
        "altura": im.height,
        "proporcao": round(im.width / im.height, 4),
        "modo": im.mode,
        "canal_alpha": "A" in im.getbands() or "transparency" in im.info,
    }
    if d["canal_alpha"]:
        a = np.asarray(im.convert("RGBA"))[..., 3]
        d["pixels_transparentes_%"] = round(100 * float((a < 255).mean()), 3)
    rgb = np.asarray(im.convert("RGB")).astype(int)
    linhas_com_conteudo = np.where(rgb.max(axis=(1, 2)) > 20)[0]
    d["area_preta_inferior_%"] = round(100 * (1 - (linhas_com_conteudo.max() + 1) / im.height), 1)
    cantos = [rgb[0, 0], rgb[0, -1], rgb[-1, 0], rgb[-1, -1]]
    d["cor_cantos"] = [list(map(int, c)) for c in cantos]
    return d


def info_video(p):
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", str(p)],
        capture_output=True, text=True, check=True)
    j = json.loads(r.stdout)
    v = next(s for s in j["streams"] if s["codec_type"] == "video")
    return {
        "codec": v["codec_name"], "largura": v["width"], "altura": v["height"],
        "fps": v["r_frame_rate"], "quadros": int(v.get("nb_frames", 0)),
        "duracao_s": float(j["format"]["duration"]), "pix_fmt": v["pix_fmt"],
        "faixas_audio": sum(1 for s in j["streams"] if s["codec_type"] == "audio"),
    }


def segmenta_prancha(p):
    """Separa as figuras do fundo de papel por diferença de cor (aproximação, não recorte de produção)."""
    im = Image.open(p).convert("RGB")
    rgb = np.asarray(im).astype(int)
    fundo = np.median(np.concatenate([rgb[:5].reshape(-1, 3), rgb[-5:].reshape(-1, 3)]), axis=0)
    fg = np.abs(rgb - fundo).sum(axis=2) > 60
    fg = ndimage.binary_opening(fg, iterations=1)
    fg = ndimage.binary_closing(fg, iterations=4)
    rot, _ = ndimage.label(fg)
    figuras = []
    for i, s in enumerate(ndimage.find_objects(rot)):
        area = int((rot[s] == i + 1).sum())
        if area < 3000:  # textos e sujeira do papel
            continue
        y, x = s[0].start, s[1].start
        figuras.append({"x": x, "y": y, "l": s[1].stop - x, "a": s[0].stop - y, "base_y": s[0].stop, "area": area})
    grupos = {}
    for nome, (y0, y1), (x0, x1) in LINHAS_PRANCHA:
        sel = [f for f in figuras if y0 <= f["y"] < y1 and x0 <= f["x"] < x1]
        sel.sort(key=lambda f: f["x"])
        alt = [f["a"] for f in sel]
        base = [f["base_y"] for f in sel]
        grupos[nome] = {
            "quadros": len(sel),
            "altura_min_max_px": [min(alt), max(alt)] if alt else None,
            "largura_min_max_px": [min(f["l"] for f in sel), max(f["l"] for f in sel)] if sel else None,
            "variacao_linha_dos_pes_px": (max(base) - min(base)) if base else None,
            "caixas": sel,
        }
    # Imagem de evidência com as caixas numeradas.
    ev = im.copy()
    dr = ImageDraw.Draw(ev)
    for nome, g in grupos.items():
        for n, f in enumerate(g["caixas"], 1):
            dr.rectangle([f["x"], f["y"], f["x"] + f["l"], f["y"] + f["a"]], outline=(255, 0, 170), width=2)
            dr.text((f["x"] + 3, f["y"] + f["a"] - 12), "%d: %dx%d" % (n, f["l"], f["a"]), fill=(0, 90, 255))
    SAIDA.mkdir(parents=True, exist_ok=True)
    ev.save(SAIDA / "evid_spritesheet_segmentacao.jpg", quality=88)
    return {"fundo_rgb_mediano": list(map(int, fundo)), "figuras_total": len(figuras), "grupos": grupos}


def main():
    inventario = []
    for p, papel in ARQUIVOS:
        item = {"arquivo": str(p.relative_to(RAIZ)), "papel": papel}
        if not p.exists():
            item["status"] = "AUSENTE NESTA CÓPIA (arquivo privado fora do git)"
            inventario.append(item)
            continue
        item.update({"bytes": p.stat().st_size, "sha256": sha256(p)})
        item.update(info_video(p) if p.suffix == ".mp4" else info_imagem(p))
        if "spritesheet" in p.name:
            item["segmentacao"] = segmenta_prancha(p)
        inventario.append(item)
    SAIDA.mkdir(parents=True, exist_ok=True)
    (SAIDA / "inventario.json").write_text(json.dumps(inventario, ensure_ascii=False, indent=2), encoding="utf-8")
    for it in inventario:
        if "status" in it:
            print("%-60s %s" % (it["arquivo"], it["status"]))
        elif "codec" in it:
            print("%-60s %s %dx%d %s fps %d quadros %.1fs áudio=%d" % (
                it["arquivo"], it["codec"], it["largura"], it["altura"], it["fps"], it["quadros"], it["duracao_s"], it["faixas_audio"]))
        else:
            print("%-60s %s %dx%d modo=%s alpha=%s preto_inferior=%s%%" % (
                it["arquivo"], it["formato"], it["largura"], it["altura"], it["modo"], it["canal_alpha"], it["area_preta_inferior_%"]))
    seg = next(it["segmentacao"] for it in inventario if "segmentacao" in it)
    print("prancha: %d figuras" % seg["figuras_total"])
    for nome, g in seg["grupos"].items():
        print("  %-32s quadros=%d altura=%s largura=%s pés±=%s" % (
            nome, g["quadros"], g["altura_min_max_px"], g["largura_min_max_px"], g["variacao_linha_dos_pes_px"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
