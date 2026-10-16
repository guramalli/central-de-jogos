#!/usr/bin/env python3
"""Gera uma imagem com a API de imagens da OpenAI (no lugar do Nano Banana/Higgsfield) — mesmo fluxo das peças.

Uso (a partir de frontend/public/thelastdance/):
    python -I tools/gerar_openai.py --prompt-arquivo PROMPT.txt --saida gerado.png
        [--imagem guia.png --imagem estilo.png ...] [--modelo gpt-image-2.5-sunburst]
        [--qualidade low|medium|high|xhigh|max|auto] [--tamanho auto|1024x1024|1536x1024|1024x1536]
        [--transparente]

- Com --imagem: endpoint de edição (/v1/images/edits) — a 1ª imagem é o guia de forma (tools/guia_props.py),
  as outras são referência de estilo. Sem --imagem: geração só pelo texto (/v1/images/generations).
- --transparente: pede fundo transparente e grava a peça sobre verde #00FF00 puro, para que
  tools/prop_entrada.py (que tira o fundo verde) continue funcionando igual.
- A chave NUNCA fica no projeto: vem da variável OPENAI_API_KEY ou do arquivo ~/.openai_api_key (uma linha).
- Mostra o consumo de tokens que a API devolve, para acompanhar o gasto.
Só biblioteca padrão + Pillow (já usado pelas outras ferramentas).
"""
import argparse
import base64
import io
import json
import mimetypes
import os
import sys
import urllib.error
import urllib.request
import uuid
from pathlib import Path

from PIL import Image

BASE = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
ARQUIVO_CHAVE = Path.home() / ".openai_api_key"


def chave():
    k = os.environ.get("OPENAI_API_KEY", "").strip()
    if not k and ARQUIVO_CHAVE.exists():
        k = ARQUIVO_CHAVE.read_text(encoding="utf-8").strip()
    if not k:
        sys.exit("Sem chave da OpenAI. Crie em https://platform.openai.com/api-keys e salve numa destas formas:\n"
                 f"  - arquivo {ARQUIVO_CHAVE} (só a chave, uma linha), ou\n"
                 "  - variável de ambiente OPENAI_API_KEY")
    return k


def multipart(campos, arquivos):
    """campos: [(nome, valor)], arquivos: [(nome, caminho)] -> (corpo, content-type)."""
    b = uuid.uuid4().hex
    partes = []
    for nome, valor in campos:
        partes.append(f'--{b}\r\nContent-Disposition: form-data; name="{nome}"\r\n\r\n{valor}\r\n'.encode())
    for nome, caminho in arquivos:
        tipo = mimetypes.guess_type(caminho.name)[0] or "application/octet-stream"
        cab = (f'--{b}\r\nContent-Disposition: form-data; name="{nome}"; filename="{caminho.name}"\r\n'
               f"Content-Type: {tipo}\r\n\r\n").encode()
        partes.append(cab + caminho.read_bytes() + b"\r\n")
    partes.append(f"--{b}--\r\n".encode())
    return b"".join(partes), f"multipart/form-data; boundary={b}"


def pedir(caminho_api, corpo, tipo):
    req = urllib.request.Request(BASE + caminho_api, data=corpo, method="POST",
                                 headers={"Authorization": "Bearer " + chave(), "Content-Type": tipo})
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        detalhe = e.read().decode("utf-8", "replace")
        try:
            detalhe = json.loads(detalhe)["error"]["message"]
        except (ValueError, KeyError, TypeError):
            pass
        sys.exit(f"A OpenAI recusou o pedido (HTTP {e.code}): {detalhe}")


def main():
    for fluxo in (sys.stdout, sys.stderr):  # acentos certos no terminal do Windows
        fluxo.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--prompt-arquivo", type=Path, required=True)
    ap.add_argument("--saida", type=Path, required=True)
    ap.add_argument("--imagem", type=Path, action="append", default=[])
    ap.add_argument("--modelo", default="gpt-image-2.5-sunburst")   # o "de precisão em edição" da OpenAI
    ap.add_argument("--qualidade", default="high")
    ap.add_argument("--tamanho", default="auto")
    ap.add_argument("--transparente", action="store_true")
    a = ap.parse_args()

    prompt = a.prompt_arquivo.read_text(encoding="utf-8").strip()
    campos = [("model", a.modelo), ("prompt", prompt), ("quality", a.qualidade), ("size", a.tamanho),
              ("output_format", "png")]
    if a.transparente:
        campos.append(("background", "transparent"))
    for im in a.imagem:
        if not im.exists():
            sys.exit(f"imagem não encontrada: {im}")

    if a.imagem:
        corpo, tipo = multipart(campos, [("image[]", im) for im in a.imagem])
        resp = pedir("/images/edits", corpo, tipo)
    else:
        resp = pedir("/images/generations", json.dumps(dict(campos)).encode(), "application/json")

    img = Image.open(io.BytesIO(base64.b64decode(resp["data"][0]["b64_json"])))
    if a.transparente and img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGBA")
        fundo = Image.new("RGBA", img.size, (0, 255, 0, 255))
        img = Image.alpha_composite(fundo, img).convert("RGB")
    a.saida.parent.mkdir(parents=True, exist_ok=True)
    img.save(a.saida)
    uso = resp.get("usage") or {}
    print(f"ok: {a.saida} ({img.width}x{img.height}) modelo {a.modelo}, qualidade {a.qualidade}"
          + (f" — tokens: entrada {uso.get('input_tokens')}, saída {uso.get('output_tokens')}" if uso else ""))


if __name__ == "__main__":
    main()
