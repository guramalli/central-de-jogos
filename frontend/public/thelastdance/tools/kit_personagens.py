#!/usr/bin/env python3
"""Kit para criar PERSONAGENS novos no app do ChatGPT, nos moldes do personagem modular (4 vistas, mesma pose).

Uso (a partir de frontend/public/thelastdance/):
    python -I tools/kit_personagens.py      -> kit_chatgpt/personagens/index.html

Cada personagem sai em 4 imagens 1024x1536 (frente, costas, lado direito, lado esquerdo) na pose do manequim
cinza, que é o corpo do protagonista em pé. Assim, depois, dá para recortar cada vista nas peças do mesmo esqueleto
(tools/roupa_ia.py usa as mesmas máscaras) e o personagem anda com as animações que já existem.
Salvar em kit_chatgpt/personagens/prontas/<id>/<vista>.png. A pasta kit_chatgpt/ não vai para o git.
"""
import html
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import roupa_ia as R  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
PASTA = RAIZ / "kit_chatgpt" / "personagens"
VISTAS = [("frente", "Front view, facing the viewer"), ("costas", "Back view, seen from behind"),
          ("lado_direito", "Side profile view, facing right"), ("lado_esquerdo", "Side profile view, facing left")]

MODELO = """Image 1 is the ART STYLE reference (the game's main character, same view). Image 2 is the gray mannequin: the exact pose, size, height and position on the canvas.

Create a NEW character for the same 2D pixel-art game, in exactly the same style as Image 1: same pixel art with thick black outlines, same chibi proportions (big head, short body), same height as the mannequin, standing in the same neutral pose (arms hanging slightly away from the torso, legs slightly apart). {view}.

THE CHARACTER: {descricao}

Full body, centered, the feet at the same place as the mannequin's feet. Plain flat white background, no shadow, no text, no other objects, only this one character."""

# Sugestões para começar (personagens que já existem no jogo como bonecos provisórios). Todas adultas.
SUGESTOES = [
    ("gatinha_campinas", "Gatinha de Campinas",
     "an adult woman in her late 20s, long wavy dark-brown hair, warm brown skin, big confident smile, small hoop earrings, "
     "a fitted pink crop top and high-waisted light-blue jeans, white sneakers, a small handbag strap across the chest"),
    ("menina_vestido", "Menina de vestido vermelho (padaria)",
     "an adult woman in her mid 20s, long straight black hair, light-brown skin, a red short party dress, black heels, "
     "a thin gold necklace, slightly tired after a night out but still elegant"),
    ("menina_loira", "Menina loira (padaria)",
     "an adult woman in her mid 20s, long blond hair in a high ponytail, fair skin, light-pink oversized hoodie, dark-blue "
     "jeans, white sneakers, holding nothing"),
    ("menina_cacheada", "Menina de cabelo cacheado (padaria)",
     "an adult woman in her late 20s, big voluminous curly black hair, dark skin, black sleeveless top, black wide pants, "
     "chunky silver earrings, confident expression"),
    ("dona_cida", "Dona Cida, a atendente",
     "a friendly woman in her late 50s, dark hair in a bun with a hairnet, light-brown skin, white bakery uniform shirt with "
     "a dark-green apron, black pants, black work shoes"),
    ("seu_ze", "Seu Zé, o garçom",
     "a man in his 60s, short gray hair and gray mustache, tan skin, white short-sleeve shirt, a dark-red apron, black pants, "
     "black shoes, a towel over one shoulder"),
]


def montar():
    (PASTA / "moldes").mkdir(parents=True, exist_ok=True)
    (PASTA / "prontas").mkdir(exist_ok=True)
    W, H = R.rig()["canvas"]
    for vista, _ in VISTAS:
        t = np.asarray(R.montar(vista))
        alfa = t[..., 3] > 16
        man = np.full((H, W, 3), 255, np.uint8)
        man[R.dilatar(alfa, 4)] = (60, 60, 66)
        man[alfa] = (160, 160, 168)
        Image.fromarray(man).save(PASTA / "moldes" / f"manequim_{vista}.png")
        a = t[..., 3:4] / 255.0
        Image.fromarray((t[..., :3] * a + 255 * (1 - a)).astype(np.uint8)).save(PASTA / "moldes" / f"estilo_{vista}.png")
    sugestoes = json.dumps([{"id": i, "nome": n, "descricao": d} for i, n, d in SUGESTOES], ensure_ascii=False)
    modelo = json.dumps(MODELO, ensure_ascii=False)
    vistas = json.dumps(VISTAS, ensure_ascii=False)
    pagina = f"""<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Kit ChatGPT — Personagens</title>
<style>
:root {{ --fundo:#120b1c; --cartao:#1d1330; --borda:#4a3570; --texto:#f1e9ff; --sub:#b9a8dd; --rosa:#ff5ad8; }}
body {{ margin:0; background:var(--fundo); color:var(--texto); font:15px/1.5 system-ui, sans-serif; }}
main {{ max-width:1000px; margin:0 auto; padding:20px 16px 60px; }}
h1 {{ font-size:24px; margin:0 0 6px; }} h2 {{ font-size:18px; margin:0 0 8px; }}
.caixa {{ background:var(--cartao); border:1px solid var(--borda); border-radius:14px; padding:14px 18px; margin:14px 0; }}
code {{ background:#2c1f45; padding:1px 6px; border-radius:6px; }}
label {{ display:block; color:var(--sub); font-size:13px; margin:10px 0 4px; }}
input, textarea {{ width:100%; box-sizing:border-box; background:#0d0814; color:#e6dcff; border:1px solid var(--borda); border-radius:8px; padding:8px; font:14px system-ui, sans-serif; }}
textarea {{ font:12.5px/1.45 ui-monospace, monospace; resize:vertical; }}
.sug {{ display:flex; flex-wrap:wrap; gap:6px; }}
button {{ font:600 14px system-ui, sans-serif; color:#fff; background:#5b2d86; border:1px solid var(--rosa); border-radius:9px; padding:8px 14px; cursor:pointer; }}
.sug button {{ background:#2c1f45; border-color:var(--borda); font-weight:500; }}
button.ok {{ background:#1f8f4e; border-color:#3ddc84; }}
.vista {{ display:grid; grid-template-columns:150px 1fr; gap:14px; align-items:start; }}
.vista .imgs {{ display:flex; gap:6px; }} .vista img {{ width:70px; border-radius:6px; border:1px solid var(--borda); background:#fff; }}
.aviso {{ color:#ffd36b; }}
@media (max-width:640px) {{ .vista {{ grid-template-columns:1fr; }} }}
</style></head><body><main>
<h1>Kit ChatGPT — Personagens</h1>
<div class="caixa"><ol>
  <li>Escolha uma sugestão abaixo ou escreva a sua (nome + descrição em inglês: idade, cabelo, pele, roupa, sapato).</li>
  <li>Abra uma conversa nova no ChatGPT para cada personagem. Para cada vista: anexe as <b>2 imagens</b> indicadas
      (<code>moldes/estilo_…</code> e <code>moldes/manequim_…</code>) e cole o texto daquela vista.</li>
  <li>Salve as 4 em <code>prontas/&lt;id&gt;/frente.png</code>, <code>costas.png</code>, <code>lado_direito.png</code> e <code>lado_esquerdo.png</code>.</li>
  <li>Faça a <b>primeira personagem</b> e me mostre antes das outras: assim conferimos se cabe no esqueleto.</li>
</ol>
<p class="aviso">Toda personagem deve ser claramente adulta (escreva a idade na descrição).</p></div>

<div class="caixa">
  <h2>Personagem</h2>
  <div class="sug" id="sug"></div>
  <label for="id">id (sem espaços — é o nome da pasta em prontas/)</label><input id="id">
  <label for="desc">Descrição (em inglês)</label><textarea id="desc" rows="3"></textarea>
</div>
<div id="vistas"></div>
</main>
<script>
const MODELO = {modelo}, SUG = {sugestoes}, VISTAS = {vistas};
const $ = (s) => document.querySelector(s);
function copiar(b, texto) {{
  const fim = () => {{ const t = b.textContent; b.textContent = "Copiado!"; b.classList.add("ok"); setTimeout(() => {{ b.textContent = t; b.classList.remove("ok"); }}, 1300); }};
  navigator.clipboard ? navigator.clipboard.writeText(texto).then(fim) : fim();
}}
function montar() {{
  const desc = $("#desc").value.trim() || "(describe the character here)";
  const id = $("#id").value.trim() || "personagem";
  $("#vistas").innerHTML = "";
  for (const [v, view] of VISTAS) {{
    const sec = document.createElement("section"); sec.className = "caixa";
    const texto = MODELO.replace("{{view}}", view).replace("{{descricao}}", desc);
    sec.innerHTML = `<h2>${{v.replace("_", " ")}}</h2><div class="vista"><div class="imgs">
      <img src="moldes/estilo_${{v}}.png" alt="estilo ${{v}}"><img src="moldes/manequim_${{v}}.png" alt="manequim ${{v}}"></div>
      <div><p style="margin:0 0 6px;color:var(--sub)">Anexe <code>moldes/estilo_${{v}}.png</code> e <code>moldes/manequim_${{v}}.png</code>.
      Salve como <code>prontas/${{id}}/${{v}}.png</code></p><textarea rows="9" readonly></textarea>
      <button>Copiar texto</button></div></div>`;
    sec.querySelector("textarea").value = texto;
    sec.querySelector("button").onclick = (e) => copiar(e.target, texto);
    $("#vistas").appendChild(sec);
  }}
}}
for (const s of SUG) {{
  const b = document.createElement("button"); b.textContent = s.nome;
  b.onclick = () => {{ $("#id").value = s.id; $("#desc").value = s.descricao; montar(); }};
  $("#sug").appendChild(b);
}}
$("#id").oninput = montar; $("#desc").oninput = montar;
$("#sug button").click();
</script></body></html>"""
    (PASTA / "index.html").write_text(pagina, encoding="utf-8")
    print("kit pronto:", PASTA / "index.html")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    montar()
