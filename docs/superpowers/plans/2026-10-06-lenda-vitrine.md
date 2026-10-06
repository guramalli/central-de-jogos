# Vitrine da Lenda do Campinho + tela inicial no mesmo padrão — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a vitrine animada da Lenda do Campinho em `/lenda/` (PT/EN, trailer, galeria, Expansão, kit de imprensa) e refazer a tela inicial e a criação de personagem do jogo no mesmo padrão visual, com a vitrine recebendo quem chega pela primeira vez.

**Architecture:** Arquivos estáticos em `frontend/public/` (a Vercel publica como estão). A base visual compartilhada (`marca.css`) e a abertura animada (`capa_viva.js`, script clássico com `window.CapaViva`) moram **dentro da pasta do jogo**, porque a versão Steam só copia essa pasta. A vitrine usa esses mesmos arquivos. As contas puras (tempo das animações, progresso da jornada, galeria, idioma, regra de entrada) são testadas com `node --test`, carregando os próprios scripts com `node:vm`.

**Tech Stack:** HTML/CSS/JS puros (sem build, sem bibliotecas), Python 3 + Pillow + `imageio-ffmpeg` (gerar artes e vídeos), Node 24 (`node --test`), Vercel.

**Spec:** `docs/superpowers/specs/2026-10-06-lenda-vitrine-design.md`
**Protótipo aprovado (referência de visual e movimento):** `docs/superpowers/prototipos/lenda-vitrine-abertura.html`

## Global Constraints

- Paleta: Indigo do Tailwind (`#eef2ff` … `#1e1b4b`) + dourado (`#ffc928`, `#ffe066`, `#f2a900`, `#c98a00`); fundo `#0d0b26`.
- Fontes: Fredoka (títulos) e Nunito (texto). `marca.css` **não** importa fontes (o jogo e a vitrine já ligam o Google Fonts; a versão Steam troca por fontes locais).
- Nada em `frontend/public/lenda-do-campinho/` pode buscar arquivo da internet além do que o `index.html` do jogo já busca (regra do `lenda-steam/ferramentas/monta_steam.mjs`).
- Animações por tempo (não por quadro), param fora da tela e com a aba oculta, e somem com `prefers-reduced-motion: reduce`.
- Peso inicial da vitrine ≤ 1 MB; capa ≤ 450 KB (2560 px), capa vertical ≤ 260 KB, logo ≤ 120 KB.
- Endereços: vitrine `/lenda/`; jogo `/lenda-do-campinho/`; "Jogar" → `/lenda-do-campinho/?jogar=1`; Windows → `/lenda-do-campinho/baixar/LendaDoCampinho.exe`.
- Steam: só o selo "Em breve na Steam" (sem link, sem preço). Contato: `guramalli@gmail.com`.
- Textos em inglês seguem `C:/Users/gh0st/Projects/lenda-steam/i18n/termos_oficiais.md`; o nome do jogo não se traduz.
- Contrato da tela do jogo (não remover/renomear): `#inicio`, `.inicio-caixa`, `#inicioMenu`, `#btnContinuar`, `#btnNovo`, `#btnHistoria`, `[data-abre="ranking"]`, `[data-abre="ajuda"]`, `#resumoSave`, `#criacao`, `#retratoCriacao`, `#inpNome`, `#opCorpo`, `#opPele`, `#opCabelo`, `#opCorCabelo`, `#opRoupa`, `#opBaixo`, `#opRosto`, `#opClasse`, `#btnVoltar`, `#btnNascer`.
- Estilos de `.chip` e `.card-classe` mudam **só dentro de `#criacao`** (as mesmas classes aparecem dentro do jogo).
- Comentários no código em português, no estilo do jogo (explicam o porquê). Arquivos novos do jogo começam com o aviso de direitos autorais igual aos outros.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Nada é publicado (push) sem o dono aprovar as páginas no navegador dele.**

## Review Focus

1. **A capa viva gastando CPU dentro do jogo** — depois de "Continuar"/"Nascer!", `#inicio` fica oculto; o laço de animação tem de parar (IntersectionObserver) e não voltar. Teste: `deveAnimar` (Tarefa 2) + conferência no navegador (Tarefa 6, Step 7).
2. **Laço vitrine ↔ jogo** — quem clica "Jogar" na vitrine nunca é mandado de volta; armazenamento bloqueado nunca redireciona; a versão Steam nunca redireciona. Testes na Tarefa 8.
3. **Botões e avisos que outros scripts colocam na tela inicial** (conta, nuvem, escolha de save, backup, Windows) continuam aparecendo e funcionando com o visual novo. Teste de contrato (Tarefa 6) + conferência com dois saves (Tarefa 6, Step 7).
4. **Telas estreitas e baixas** (celular deitado, notebook 1366×768) — abertura sem cortar botões, criação de personagem com "Nascer!" alcançável. Conferência nas Tarefas 3, 6, 7 e 9.
5. **Idioma trocado no meio** — todos os textos, o título, o trailer e os textos do kit mudam; nada fica meio PT meio EN. Teste de dicionário (Tarefa 5) + conferência (Tarefa 9).

---

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `frontend/tools/vitrine_lenda.py` (novo) | Gera artes webp, OG, pôster, trailers 720p e kit de imprensa a partir de `lenda-steam/loja` |
| `frontend/tests/lenda/util.js` (novo) | Ajudantes dos testes (`carrega` com `node:vm`, `le`) |
| `frontend/tests/lenda/*.test.js` (novos) | Testes `node --test` |
| `frontend/public/lenda-do-campinho/css/marca.css` (novo) | Cores, botões, vidro, selos, cascata, estilos da capa viva |
| `frontend/public/lenda-do-campinho/js/capa_viva.js` (novo) | `window.CapaViva` (abertura animada) |
| `frontend/public/lenda-do-campinho/a/capa.webp`, `capa_vertical.webp` (novos) | Arte da capa |
| `frontend/public/lenda/index.html` (novo) | A vitrine |
| `frontend/public/lenda/css/vitrine.css` (novo) | Estilos só da vitrine |
| `frontend/public/lenda/js/vitrine.js` (novo) | `window.Vitrine` + comportamento das seções |
| `frontend/public/lenda/js/textos.js` (novo) | `window.TEXTOS` (PT/EN) |
| `frontend/public/lenda/js/idioma.js` (novo) | `window.Idioma` + troca de idioma |
| `frontend/public/lenda/a/`, `video/`, `imprensa/` (gerados) | Artes, trailers, kit |
| `frontend/public/lenda-do-campinho/css/inicio.css` | Reescrito no padrão novo |
| `frontend/public/lenda-do-campinho/js/inicio.js` | Capa viva, classes dos botões, cascata/inclinação, "Conheça o jogo" |
| `frontend/public/lenda-do-campinho/index.html` | Liga `marca.css` e `capa_viva.js`; depois (Tarefa 8) `vitrine_entrada.js` |
| `frontend/public/lenda-do-campinho/js/vitrine_entrada.js` (novo, Tarefa 8) | Manda quem chega para `/lenda/` |
| `frontend/vercel.json`, `frontend/public/sitemap.xml`, `frontend/package.json` | Rotas/cache, sitemap, script de teste |

Os blocos de código abaixo marcados com **Arquivo: `caminho`** são o conteúdo completo do arquivo.

---

### Task 1: Artes, trailers e kit de imprensa

**Files:**
- Create: `frontend/tools/vitrine_lenda.py`
- Create: `frontend/tests/lenda/util.js`, `frontend/tests/lenda/artes.test.js`
- Create (gerados): `frontend/public/lenda-do-campinho/a/capa.webp`, `capa_vertical.webp`; `frontend/public/lenda/a/*`, `frontend/public/lenda/video/*`, `frontend/public/lenda/imprensa/*`
- Modify: `frontend/package.json` (script `test`)
- Add: `docs/superpowers/prototipos/lenda-vitrine-abertura.html` (já copiado; só entra no commit)

**Interfaces:**
- Produces: os arquivos de mídia com os nomes da tabela do teste; `tests/lenda/util.js` exporta `RAIZ` (pasta `frontend/`), `le(rel)` e `carrega(rel, contexto)`.

- [ ] **Step 1: Ajudantes de teste e teste das artes (vai falhar)**

Arquivo: `frontend/tests/lenda/util.js`
```js
// Ajudantes dos testes da Lenda: lê arquivos de frontend/ e roda scripts
// clássicos do jogo/vitrine dentro de um "navegador de mentira" (node:vm).
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const le = (rel) => readFileSync(path.join(RAIZ, rel), "utf8");
export function carrega(rel, contexto = {}) {
  const ctx = vm.createContext(contexto);
  vm.runInContext(le(rel), ctx, { filename: rel });
  return ctx;
}
```

Arquivo: `frontend/tests/lenda/artes.test.js`
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { RAIZ } from "./util.js";

const KB = 1024, MB = 1024 * 1024;
const CAPTURAS = ["00_inicio", "01_toquio", "02_lava", "03_guardiao", "04_historia", "05_clube", "06_agencia", "07_vila"];
const LIMITES = [
  ["public/lenda-do-campinho/a/capa.webp", 450 * KB],
  ["public/lenda-do-campinho/a/capa_vertical.webp", 260 * KB],
  ["public/lenda/a/logo.webp", 120 * KB],
  ["public/lenda/a/og.jpg", 250 * KB],
  ["public/lenda/a/poster.webp", 150 * KB],
  ...CAPTURAS.map((n) => [`public/lenda/a/cap_${n}.webp`, 200 * KB]),
  ...CAPTURAS.map((n) => [`public/lenda/a/cap_${n}_p.webp`, 70 * KB]),
  ["public/lenda/video/trailer_pt.mp4", 15 * MB],
  ["public/lenda/video/trailer_en.mp4", 15 * MB],
  ["public/lenda/imprensa/logo.png", 2 * MB],
  ["public/lenda/imprensa/lenda-do-campinho-kit-imprensa.zip", 60 * MB],
];

for (const [rel, max] of LIMITES) {
  test(`arte ${rel} existe e cabe em ${Math.round(max / KB)} KB`, () => {
    const arq = path.join(RAIZ, rel);
    assert.ok(existsSync(arq), `falta ${rel} — rode: python frontend/tools/vitrine_lenda.py`);
    const tam = statSync(arq).size;
    assert.ok(tam > 0 && tam <= max, `${rel} tem ${Math.round(tam / KB)} KB`);
  });
}
```

Em `frontend/package.json`, no bloco `"scripts"`, depois de `"preview": "vite preview"`:
```json
    "preview": "vite preview",
    "test": "node --test \"tests/**/*.test.js\""
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm --prefix frontend test`
Expected: FAIL — vários `falta public/... — rode: python frontend/tools/vitrine_lenda.py`.

- [ ] **Step 3: Script de artes**

Arquivo: `frontend/tools/vitrine_lenda.py`
```python
"""Gera a mídia da vitrine da Lenda do Campinho a partir do material da loja
(C:/Users/gh0st/Projects/lenda-steam/loja): capas e logo em webp leves, as
capturas (grandes e miniaturas), a imagem de compartilhamento (OG), o pôster
e os trailers em 720p, e o kit de imprensa (logo PNG + ZIP).

Uso:  python frontend/tools/vitrine_lenda.py [--loja CAMINHO] [--sem-video]

Cada imagem tem um limite de peso: a qualidade baixa aos poucos (e, se
precisar, a largura) até caber. Rodar de novo sobrescreve tudo.
"""
import argparse
import io
import os
import subprocess
import zipfile

from PIL import Image
import imageio_ffmpeg

AQUI = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.normpath(os.path.join(AQUI, "..", "public"))
JOGO_A = os.path.join(PUBLIC, "lenda-do-campinho", "a")
VIT = os.path.join(PUBLIC, "lenda")
CAPTURAS = ["00_inicio", "01_toquio", "02_lava", "03_guardiao", "04_historia", "05_clube", "06_agencia", "07_vila"]
KB, MB = 1024, 1024 * 1024
LOGO_CORTE = (137, 40, 1143, 680)  # área útil do library_logo_1280x720.png

LEIA_ME = """LENDA DO CAMPINHO — KIT DE IMPRENSA / PRESS KIT
Educação Gamer · https://www.educacaogamer.com.br/lenda/

PT — Um RPG de futebol para toda a família! Comece no campinho da vila,
drible criaturas, enfrente chefões nas arenas, jogue a temporada pelo seu
clube e viaje pelo mundo inteiro. Grátis para jogar, em português e inglês.

EN — A soccer RPG for the whole family! Start on the village dirt pitch,
dribble past creatures, face bosses in the arenas, play the season for your
club and travel the whole world. Free to play, in Portuguese and English.

Contato / Contact: guramalli@gmail.com
© 2026 Educação Gamer. Todos os direitos reservados. All rights reserved.
"""


def rel(p):
    return os.path.relpath(p, PUBLIC).replace("\\", "/")


def webp(src, dst, largura, limite_kb, q=82, corte=None):
    im = Image.open(src)
    if corte:
        im = im.crop(corte)
    im = im.convert("RGBA") if im.mode in ("RGBA", "LA", "P") else im.convert("RGB")
    w = largura
    while w >= 400:
        atual = im if im.width <= w else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        for qual in range(q, 49, -4):
            buf = io.BytesIO()
            atual.save(buf, "WEBP", quality=qual, method=6)
            if buf.tell() <= limite_kb * KB:
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                with open(dst, "wb") as f:
                    f.write(buf.getvalue())
                print(f"{rel(dst):48} {atual.size[0]}x{atual.size[1]}  q{qual}  {buf.tell() // KB} KB")
                return
        w = int(w * 0.85)
    raise SystemExit(f"{dst}: não coube em {limite_kb} KB")


def og(src, dst, limite_kb=240):
    im = Image.open(src).convert("RGB")
    alvo = 1200 / 630
    w, h = im.size
    if w / h > alvo:  # corta dos lados, puxando pro centro-direita (garoto e bola)
        nw = round(h * alvo)
        x = min(w - nw, max(0, round(w * 0.55 - nw / 2)))
        im = im.crop((x, 0, x + nw, h))
    else:
        nh = round(w / alvo)
        y = min(h - nh, max(0, round(h * 0.4 - nh / 2)))
        im = im.crop((0, y, w, y + nh))
    im = im.resize((1200, 630), Image.LANCZOS)
    for qual in range(86, 49, -4):
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=qual, optimize=True, progressive=True)
        if buf.tell() <= limite_kb * KB:
            with open(dst, "wb") as f:
                f.write(buf.getvalue())
            print(f"{rel(dst):48} 1200x630  q{qual}  {buf.tell() // KB} KB")
            return
    raise SystemExit(f"{dst}: não coube em {limite_kb} KB")


def video(src, dst, limite_mb=14):
    exe = imageio_ffmpeg.get_ffmpeg_exe()
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    for crf in (26, 28, 30, 32):
        subprocess.run([exe, "-y", "-loglevel", "error", "-i", src, "-vf", "scale=-2:720",
                        "-c:v", "libx264", "-preset", "slow", "-crf", str(crf), "-pix_fmt", "yuv420p",
                        "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", dst], check=True)
        tam = os.path.getsize(dst)
        if tam <= limite_mb * MB:
            print(f"{rel(dst):48} 720p  crf{crf}  {tam / MB:.1f} MB")
            return
    raise SystemExit(f"{dst}: não coube em {limite_mb} MB")


def kit(loja):
    pasta = os.path.join(VIT, "imprensa")
    os.makedirs(pasta, exist_ok=True)
    logo_png = os.path.join(pasta, "logo.png")
    Image.open(os.path.join(loja, "steam", "library_logo_1280x720.png")).crop(LOGO_CORTE).save(logo_png, "PNG", optimize=True)
    print(f"{rel(logo_png):48} {os.path.getsize(logo_png) // KB} KB")
    zp = os.path.join(pasta, "lenda-do-campinho-kit-imprensa.zip")
    with zipfile.ZipFile(zp, "w", zipfile.ZIP_DEFLATED) as z:
        z.write(logo_png, "logo/lenda-do-campinho-logo.png")
        z.write(os.path.join(loja, "arte", "logo_letreiro.png"), "logo/lenda-do-campinho-logo-fundo-escuro.png")
        for nome in ("capa_horizontal", "capa_vertical", "capa_panoramica"):
            buf = io.BytesIO()
            Image.open(os.path.join(loja, "arte", nome + ".png")).convert("RGB").save(buf, "JPEG", quality=90, optimize=True)
            z.writestr(f"capas/{nome}.jpg", buf.getvalue())
        for n in CAPTURAS:
            z.write(os.path.join(loja, "capturas", n + ".jpg"), f"capturas/{n}.jpg")
        z.writestr("LEIA-ME.txt", LEIA_ME)
    print(f"{rel(zp):48} {os.path.getsize(zp) / MB:.1f} MB")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--loja", default="C:/Users/gh0st/Projects/lenda-steam/loja")
    ap.add_argument("--sem-video", action="store_true")
    a = ap.parse_args()
    L = a.loja
    webp(os.path.join(L, "arte", "capa_horizontal.png"), os.path.join(JOGO_A, "capa.webp"), 2560, 440)
    webp(os.path.join(L, "arte", "capa_vertical.png"), os.path.join(JOGO_A, "capa_vertical.webp"), 1200, 250)
    webp(os.path.join(L, "steam", "library_logo_1280x720.png"), os.path.join(VIT, "a", "logo.webp"), 1006, 115, q=90, corte=LOGO_CORTE)
    webp(os.path.join(L, "previa_pagina", "trailer_poster.jpg"), os.path.join(VIT, "a", "poster.webp"), 1280, 140)
    og(os.path.join(L, "arte", "capa_horizontal.png"), os.path.join(VIT, "a", "og.jpg"))
    for n in CAPTURAS:
        src = os.path.join(L, "capturas", n + ".jpg")
        webp(src, os.path.join(VIT, "a", f"cap_{n}.webp"), 1280, 190, q=80)
        webp(src, os.path.join(VIT, "a", f"cap_{n}_p.webp"), 640, 65, q=78)
    if not a.sem_video:
        for lang in ("pt", "en"):
            video(os.path.join(L, "trailer", f"trailer_{lang}.mp4"), os.path.join(VIT, "video", f"trailer_{lang}.mp4"))
    kit(L)


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Gerar a mídia**

Run: `python frontend/tools/vitrine_lenda.py`
Expected: uma linha por arquivo (nome, tamanho, qualidade, KB) e nenhum `não coube`. Os trailers levam alguns minutos.

- [ ] **Step 5: Rodar e ver passar**

Run: `npm --prefix frontend test`
Expected: PASS — todos os `arte ... existe e cabe` com `ok`, `# fail 0`.

- [ ] **Step 6: Commit**

```bash
git add frontend/tools/vitrine_lenda.py frontend/tests/lenda frontend/package.json frontend/public/lenda-do-campinho/a/capa.webp frontend/public/lenda-do-campinho/a/capa_vertical.webp frontend/public/lenda docs/superpowers/prototipos/lenda-vitrine-abertura.html
git commit -m "Lenda: mídia da vitrine (capas, capturas, OG, trailers 720p, kit de imprensa) e script que gera

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Base compartilhada — `marca.css` e `capa_viva.js`

**Files:**
- Create: `frontend/public/lenda-do-campinho/css/marca.css`
- Create: `frontend/public/lenda-do-campinho/js/capa_viva.js`
- Test: `frontend/tests/lenda/capa_viva.test.js`

**Interfaces:**
- Consumes: `capa.webp`, `capa_vertical.webp` (Tarefa 1) — só pelos chamadores.
- Produces: `window.CapaViva = { monta(alvo, opcoes) → { destroi() }, fatorTempo(dtMs) → number, deveAnimar({visivel, abaOculta, reduzMovimento}) → boolean, usaVertical(largura, altura, temVertical) → boolean }`. `opcoes = { horizontal: {src, bola:[x%,y%], sol:[x%,y%]}, vertical?: {…}, alt?: string, rolagem?: boolean, aoQuadro?: ({mx, my, rolagem}) => void }`. Classes CSS: `.capa-viva`, `.cv-palco`, `.cv-vertical`, `.cv-camera`, `.cv-raios`, `.cv-brilho`, `.cv-faiscas`; `.lc-btn`, `.lc-btn-ouro`, `.lc-btn-vidro`, `.lc-btn-pequeno`, `.lc-vidro`, `.lc-selo`, `.lc-sobretitulo`, `.lc-entra`/`.lc-visivel` (com `--i`).

- [ ] **Step 1: Teste (vai falhar)**

Arquivo: `frontend/tests/lenda/capa_viva.test.js`
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { carrega } from "./util.js";

const { CapaViva } = carrega("public/lenda-do-campinho/js/capa_viva.js");

test("fatorTempo: 60 Hz = 1 passo; proporcional; nunca negativo; no máximo 3", () => {
  assert.equal(CapaViva.fatorTempo(1000 / 60), 1);
  assert.ok(Math.abs(CapaViva.fatorTempo(1000 / 120) - 0.5) < 1e-9);
  assert.equal(CapaViva.fatorTempo(0), 0);
  assert.equal(CapaViva.fatorTempo(-5), 0);
  assert.equal(CapaViva.fatorTempo(NaN), 0);
  assert.equal(CapaViva.fatorTempo(5000), 3);
});

test("deveAnimar: só visível, com a aba aberta e sem reduzir movimento", () => {
  assert.equal(CapaViva.deveAnimar({ visivel: true, abaOculta: false, reduzMovimento: false }), true);
  assert.equal(CapaViva.deveAnimar({ visivel: false, abaOculta: false, reduzMovimento: false }), false);
  assert.equal(CapaViva.deveAnimar({ visivel: true, abaOculta: true, reduzMovimento: false }), false);
  assert.equal(CapaViva.deveAnimar({ visivel: true, abaOculta: false, reduzMovimento: true }), false);
  assert.equal(CapaViva.deveAnimar(undefined), false);
});

test("usaVertical: arte em pé quando largura/altura ≤ 0,8 e existe a vertical", () => {
  assert.equal(CapaViva.usaVertical(390, 844, true), true);
  assert.equal(CapaViva.usaVertical(800, 1000, true), true);
  assert.equal(CapaViva.usaVertical(1440, 900, true), false);
  assert.equal(CapaViva.usaVertical(390, 844, false), false);
  assert.equal(CapaViva.usaVertical(390, 0, true), false);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm --prefix frontend test`
Expected: FAIL — `ENOENT ... capa_viva.js`.

- [ ] **Step 3: `capa_viva.js`**

Arquivo: `frontend/public/lenda-do-campinho/js/capa_viva.js`
```js
/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   CAPA VIVA — a arte da capa "respirando": a câmera entra e respira,
   a bola pulsa e solta faíscas douradas, sobe poeira de luz, os raios de
   sol giram, e tudo acompanha o mouse (e, se pedido, a rolagem).
   Usada pela tela inicial do jogo (js/inicio.js) e pela vitrine (/lenda/).
   Script clássico (sem import/export): o jogo — e a versão Steam — carrega
   tudo sem módulos. Expõe window.CapaViva.
   O laço só roda com a capa na tela e a aba visível: quando o jogo começa,
   #inicio some e a animação para. Com "reduzir movimento" fica só a arte.
   ============================================================ */
(function (raiz) {
  'use strict';

  // Quantos "passos de 60 quadros por segundo" cabem no tempo que passou: a
  // animação anda igual em 60, 120, 144 ou 360 Hz. No máximo 3 (aba que volta
  // depois de muito tempo não dá um salto).
  function fatorTempo(dtMs) { return dtMs > 0 ? Math.min(3, dtMs / (1000 / 60)) : 0; }
  function deveAnimar(e) { return !!(e && e.visivel && !e.abaOculta && !e.reduzMovimento); }
  // Arte em pé (2:3) quando o espaço é "em pé" (largura/altura ≤ 0,8).
  function usaVertical(largura, altura, temVertical) { return !!temVertical && altura > 0 && largura / altura <= 0.8; }

  function monta(alvo, op) {
    const doc = alvo.ownerDocument, win = doc.defaultView;
    const mm = (q) => !!(win.matchMedia && win.matchMedia(q).matches);
    const reduz = mm('(prefers-reduced-motion: reduce)'), mouseFino = mm('(pointer: fine)');
    alvo.classList.add('capa-viva');
    const palco = doc.createElement('div'); palco.className = 'cv-palco';
    const camera = doc.createElement('div'); camera.className = 'cv-camera';
    const img = doc.createElement('img'); img.alt = op.alt || ''; img.decoding = 'async'; img.setAttribute('fetchpriority', 'high');
    const raios = doc.createElement('div'); raios.className = 'cv-raios';
    const brilho = doc.createElement('div'); brilho.className = 'cv-brilho';
    camera.append(img, raios, brilho); palco.append(camera);
    const cv = doc.createElement('canvas'); cv.className = 'cv-faiscas'; cv.setAttribute('aria-hidden', 'true');
    alvo.append(palco, cv);
    const ctx = cv.getContext('2d');

    // Uma arte só é baixada: a que serve pro formato do espaço agora.
    let cfg = null;
    function escolheArte() {
      const vert = usaVertical(alvo.clientWidth, alvo.clientHeight, !!op.vertical);
      const novo = vert ? op.vertical : op.horizontal;
      if (novo === cfg) return;
      cfg = novo;
      palco.classList.toggle('cv-vertical', vert);
      img.src = cfg.src;
      raios.style.left = cfg.sol[0] + '%'; raios.style.top = cfg.sol[1] + '%';
      brilho.style.left = cfg.bola[0] + '%'; brilho.style.top = cfg.bola[1] + '%';
    }

    let W = 0, H = 0, dpr = 1;
    function medir() {
      dpr = Math.min(2, win.devicePixelRatio || 1);
      W = cv.width = Math.round(alvo.clientWidth * dpr); H = cv.height = Math.round(alvo.clientHeight * dpr);
      escolheArte();
    }

    const parts = [];
    function bolaNaTela() {
      const r = palco.getBoundingClientRect(), a = alvo.getBoundingClientRect();
      return { x: (r.left - a.left + r.width * cfg.bola[0] / 100) * dpr, y: (r.top - a.top + r.height * cfg.bola[1] / 100) * dpr, raio: r.width * 0.03 * dpr };
    }
    function nasceFaisca() {
      const b = bolaNaTela();
      const ang = Math.PI * (0.62 + Math.random() * 0.28); // rastro para baixo-esquerda, como na arte
      const v = (1.2 + Math.random() * 2.6) * dpr;
      parts.push({ x: b.x + (Math.random() - 0.5) * b.raio, y: b.y + (Math.random() - 0.5) * b.raio, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v * 0.7 - 0.4 * dpr,
        vida: 1, dec: 0.012 + Math.random() * 0.018, t: (1 + Math.random() * 2.2) * dpr, cor: Math.random() < 0.7 ? '255,214,102' : '255,255,255', poeira: false });
    }
    function nascePoeira() {
      parts.push({ x: Math.random() * W, y: H + 10, vx: (Math.random() - 0.5) * 0.3 * dpr, vy: -(0.3 + Math.random() * 0.7) * dpr,
        vida: 1, dec: 0.002 + Math.random() * 0.003, t: (1 + Math.random() * 2.5) * dpr, cor: Math.random() < 0.5 ? '165,180,252' : '255,226,150', poeira: true });
    }

    let mx = 0, my = 0, ax = 0, ay = 0, antes = 0, rafId = 0, visivel = true, acF = 0, acP = 0;
    function quadro(agora) {
      rafId = 0;
      const k = fatorTempo(agora - antes); antes = agora;
      const suave = Math.min(1, 0.06 * k);
      mx += (ax - mx) * suave; my += (ay - my) * suave;
      const rolagem = op.rolagem ? Math.min(1, Math.max(0, win.scrollY / Math.max(1, alvo.clientHeight))) : 0;
      palco.style.transform = `translate(calc(-50% + ${(-mx * 22).toFixed(2)}px), calc(-50% + ${(-my * 14 + rolagem * 120).toFixed(2)}px)) scale(${(1 + rolagem * 0.08).toFixed(4)})`;
      if (op.aoQuadro) op.aoQuadro({ mx, my, rolagem });
      ctx.clearRect(0, 0, W, H);
      if (rolagem < 1) {
        acF += 3 * k; acP += 0.35 * k;
        while (acF >= 1) { nasceFaisca(); acF--; }
        while (acP >= 1) { nascePoeira(); acP--; }
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const q = parts[i];
        q.x += q.vx * k; q.y += q.vy * k; q.vida -= q.dec * k;
        if (q.poeira) q.x += Math.sin((q.y + i) * 0.01) * 0.3 * dpr * k;
        else { q.vy += 0.03 * dpr * k; q.vx *= Math.pow(0.99, k); }
        if (q.vida <= 0) { parts.splice(i, 1); continue; }
        const a = q.poeira ? Math.sin(q.vida * Math.PI) * 0.7 : q.vida;
        ctx.beginPath(); ctx.fillStyle = `rgba(${q.cor},${a.toFixed(3)})`; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8 * dpr;
        ctx.arc(q.x, q.y, q.t * (q.poeira ? 1 : q.vida + 0.3), 0, Math.PI * 2); ctx.fill();
      }
      liga();
    }
    function liga() {
      const pode = deveAnimar({ visivel, abaOculta: doc.hidden, reduzMovimento: reduz });
      if (pode && !rafId) { if (!antes) antes = win.performance.now(); rafId = win.requestAnimationFrame(quadro); }
      else if (!pode && rafId) { win.cancelAnimationFrame(rafId); rafId = 0; }
      if (!pode) { antes = 0; parts.length = 0; ctx.clearRect(0, 0, W, H); }
    }

    const aoMover = (e) => { ax = e.clientX / win.innerWidth - 0.5; ay = e.clientY / win.innerHeight - 0.5; };
    if (mouseFino && !reduz) win.addEventListener('pointermove', aoMover, { passive: true });
    win.addEventListener('resize', medir);
    doc.addEventListener('visibilitychange', liga);
    let io = null;
    if (win.IntersectionObserver) {
      io = new win.IntersectionObserver((ents) => { visivel = ents[ents.length - 1].isIntersecting; if (visivel) medir(); liga(); });
      io.observe(alvo);
    }
    medir(); liga();
    return {
      destroi() {
        if (rafId) win.cancelAnimationFrame(rafId); rafId = 0;
        if (io) io.disconnect();
        win.removeEventListener('pointermove', aoMover); win.removeEventListener('resize', medir); doc.removeEventListener('visibilitychange', liga);
        palco.remove(); cv.remove(); alvo.classList.remove('capa-viva');
      },
    };
  }

  raiz.CapaViva = { monta, fatorTempo, deveAnimar, usaVertical };
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: `marca.css`**

Arquivo: `frontend/public/lenda-do-campinho/css/marca.css`
```css
/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   MARCA — base visual compartilhada entre a tela inicial do jogo e a
   vitrine (/lenda/): cores (Indigo do Tailwind + dourado), botões dourado e
   vidro, painel de vidro, selos, entrada em cascata e a capa viva
   (js/capa_viva.js). Prefixo lc- pra não esbarrar nas classes do jogo.
   Não importa fontes nem nada da internet (a versão Steam é offline).
   ============================================================ */
:root {
  --lc-indigo-50: #eef2ff; --lc-indigo-100: #e0e7ff; --lc-indigo-200: #c7d2fe; --lc-indigo-300: #a5b4fc;
  --lc-indigo-400: #818cf8; --lc-indigo-500: #6366f1; --lc-indigo-600: #4f46e5; --lc-indigo-700: #4338ca;
  --lc-indigo-800: #3730a3; --lc-indigo-900: #312e81; --lc-indigo-950: #1e1b4b;
  --lc-noite: #0d0b26; --lc-ouro: #ffc928; --lc-ouro-claro: #ffe066; --lc-ouro-fundo: #f2a900; --lc-ouro-escuro: #c98a00; --lc-tinta-ouro: #2a1600;
  --lc-titulo: "Fredoka", system-ui, sans-serif; --lc-texto: "Nunito", system-ui, sans-serif;
  --lc-vidro: rgba(13, 11, 38, .62); --lc-vidro-borda: rgba(165, 180, 252, .22);
  --lc-mola: cubic-bezier(.16, 1, .3, 1);
}

/* ---------- Botões ---------- */
.lc-btn { position: relative; display: inline-flex; align-items: center; justify-content: center; gap: 10px; height: 54px; padding: 0 26px; border-radius: 16px; font-family: var(--lc-titulo); font-weight: 600; font-size: 18px; letter-spacing: .2px; border: 0; cursor: pointer; overflow: hidden; text-decoration: none; white-space: nowrap; transition: transform .18s ease, box-shadow .18s ease, background .18s ease; }
.lc-btn:hover { transform: translateY(-2px); }
.lc-btn:active { transform: translateY(1px); }
.lc-btn:focus-visible { outline: 3px solid var(--lc-ouro); outline-offset: 3px; }
.lc-btn svg { width: 22px; height: 22px; flex-shrink: 0; }
.lc-btn-ouro, .btn.lc-btn-ouro { background: linear-gradient(180deg, var(--lc-ouro-claro), var(--lc-ouro) 55%, var(--lc-ouro-fundo)); color: var(--lc-tinta-ouro); border: 0; text-shadow: none; box-shadow: 0 6px 0 var(--lc-ouro-escuro), 0 14px 30px rgba(255, 201, 40, .35); }
.lc-btn-ouro:hover, .btn.lc-btn-ouro:hover { filter: none; box-shadow: 0 8px 0 var(--lc-ouro-escuro), 0 20px 40px rgba(255, 201, 40, .45); }
.lc-btn-ouro::before, .btn.lc-btn-ouro::before { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, .75) 48%, transparent 66%); transform: translateX(-120%); animation: lcReflexoBotao 4.5s ease-in-out 2.6s infinite; }
@keyframes lcReflexoBotao { 0%, 70% { transform: translateX(-120%); } 100% { transform: translateX(120%); } }
.lc-btn-vidro, .btn.lc-btn-vidro { background: rgba(255, 255, 255, .1); color: #fff; border: 0; text-shadow: none; box-shadow: inset 0 0 0 1.5px rgba(255, 255, 255, .35); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.lc-btn-vidro:hover, .btn.lc-btn-vidro:hover { filter: none; background: rgba(255, 255, 255, .18); }
.lc-btn-pequeno { height: 42px; padding: 0 18px; font-size: 16px; border-radius: 13px; }

/* ---------- Vidro, selos, sobretítulo ---------- */
.lc-vidro { background: var(--lc-vidro); border: 1px solid var(--lc-vidro-borda); border-radius: 22px; backdrop-filter: blur(16px) saturate(140%); -webkit-backdrop-filter: blur(16px) saturate(140%); box-shadow: 0 24px 60px rgba(0, 0, 0, .45), inset 0 1px 0 rgba(255, 255, 255, .08); }
.lc-selo { display: inline-flex; align-items: center; gap: 8px; padding: 5px 12px; border-radius: 999px; background: rgba(99, 102, 241, .25); box-shadow: inset 0 0 0 1px rgba(165, 180, 252, .45); color: #fff; font-family: var(--lc-texto); font-weight: 800; font-size: 13px; }
.lc-sobretitulo { font-family: var(--lc-texto); font-size: 13px; font-weight: 900; letter-spacing: 2.2px; text-transform: uppercase; color: var(--lc-ouro); }

/* ---------- Entrada em cascata (o JS põe .lc-visivel; --i = posição) ---------- */
.lc-entra { opacity: 0; transform: translateY(26px); transition: opacity .8s var(--lc-mola), transform .8s var(--lc-mola); transition-delay: calc(var(--i, 0) * 90ms); }
.lc-entra.lc-visivel { opacity: 1; transform: none; }

/* ---------- Capa viva (js/capa_viva.js) ---------- */
.capa-viva { position: absolute; inset: 0; overflow: hidden; isolation: isolate; container-type: size; background: var(--lc-noite); }
.cv-palco { position: absolute; left: 50%; top: 50%; width: max(100cqw, 177.78cqh); aspect-ratio: 16 / 9; transform: translate(-50%, -50%); will-change: transform; }
.cv-palco.cv-vertical { width: max(100cqw, 66.67cqh); aspect-ratio: 2 / 3; }
.cv-camera { position: absolute; inset: 0; transform-origin: 62% 40%; animation: cvEntrada 2.6s var(--lc-mola) both, cvRespira 22s ease-in-out 2.6s infinite alternate; }
@keyframes cvEntrada { from { transform: scale(1.16); filter: brightness(.35) saturate(.6) blur(6px); } to { transform: scale(1); filter: none; } }
@keyframes cvRespira { from { transform: scale(1); } to { transform: scale(1.045) translate(-.6%, .4%); } }
.cv-camera img { display: block; width: 100%; height: 100%; object-fit: cover; }
.cv-brilho { position: absolute; width: 22%; aspect-ratio: 1; transform: translate(-50%, -50%); border-radius: 50%; pointer-events: none; mix-blend-mode: screen; background: radial-gradient(circle, rgba(255, 236, 160, .85) 0%, rgba(255, 196, 64, .45) 22%, rgba(255, 160, 40, 0) 62%); animation: cvPulsa 2.2s ease-in-out infinite; }
@keyframes cvPulsa { 0%, 100% { opacity: .55; transform: translate(-50%, -50%) scale(.92); } 50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); } }
.cv-raios { position: absolute; width: 140%; aspect-ratio: 1; transform: translate(-50%, -50%); pointer-events: none; mix-blend-mode: screen; background: repeating-conic-gradient(from 0deg, rgba(255, 220, 150, .16) 0deg 4deg, transparent 4deg 13deg); -webkit-mask: radial-gradient(circle, #000 0%, transparent 55%); mask: radial-gradient(circle, #000 0%, transparent 55%); animation: cvGira 90s linear infinite; }
@keyframes cvGira { to { transform: translate(-50%, -50%) rotate(360deg); } }
.cv-faiscas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; mix-blend-mode: screen; }

@media (prefers-reduced-motion: reduce) {
  .cv-camera, .cv-brilho, .cv-raios, .lc-btn-ouro::before, .btn.lc-btn-ouro::before { animation: none !important; }
  .cv-faiscas { display: none; }
  .lc-entra { opacity: 1; transform: none; transition: none; }
  .lc-btn { transition: none; }
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm --prefix frontend test`
Expected: PASS — `# fail 0` (inclui os 3 testes da capa viva).

- [ ] **Step 6: Commit**

```bash
git add frontend/public/lenda-do-campinho/css/marca.css frontend/public/lenda-do-campinho/js/capa_viva.js frontend/tests/lenda/capa_viva.test.js
git commit -m "Lenda: base visual compartilhada (marca.css) e capa viva animada (capa_viva.js)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Vitrine — página completa (estrutura, abertura e jornada; seções novas com conteúdo)

A página inteira é criada aqui (HTML e CSS completos); o comportamento das seções novas vem na Tarefa 4 e os idiomas na Tarefa 5.

**Files:**
- Create: `frontend/public/lenda/index.html`, `frontend/public/lenda/css/vitrine.css`, `frontend/public/lenda/js/vitrine.js`
- Modify: `frontend/vercel.json`, `frontend/public/sitemap.xml`
- Test: `frontend/tests/lenda/vitrine.test.js`

**Interfaces:**
- Consumes: `CapaViva.monta` (Tarefa 2), mídia (Tarefa 1).
- Produces: `window.Vitrine = { progressoJornada(topo, alturaSecao, alturaTela) → 0..1, etapaAtiva(prog, n) → índice, proximoIndice(i, delta, n) → índice }`; ids usados pela Tarefa 4: `#trailerQuadro`, `#trailerPlay`, `.galeria-item[data-grande]`, `#caixaFoto`, `#caixaFotoImg`, `#caixaFotoLegenda`, `#caixaAnterior`, `#caixaProxima`, `#caixaFechar`, `[data-copia]`, `.destaque`; pela Tarefa 5: `data-t`, `data-t-html`, `data-t-alt`, `data-t-aria`, `[data-idioma]`.

- [ ] **Step 1: Teste das contas da vitrine (vai falhar)**

Arquivo: `frontend/tests/lenda/vitrine.test.js`
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { carrega } from "./util.js";

const { Vitrine } = carrega("public/lenda/js/vitrine.js");

test("progressoJornada: 0 antes, 1 depois, proporcional no meio", () => {
  assert.equal(Vitrine.progressoJornada(100, 5000, 1000), 0);   // seção ainda abaixo
  assert.equal(Vitrine.progressoJornada(0, 5000, 1000), 0);
  assert.equal(Vitrine.progressoJornada(-2000, 5000, 1000), 0.5);
  assert.equal(Vitrine.progressoJornada(-4000, 5000, 1000), 1);
  assert.equal(Vitrine.progressoJornada(-9000, 5000, 1000), 1);  // já passou
});

test("progressoJornada: seção menor que a tela não divide por zero", () => {
  assert.equal(Vitrine.progressoJornada(-50, 800, 1000), 0);
  assert.equal(Vitrine.progressoJornada(-50, 1000, 1000), 0);
});

test("etapaAtiva: arredonda pra etapa mais próxima e fica nos limites", () => {
  assert.equal(Vitrine.etapaAtiva(0, 6), 0);
  assert.equal(Vitrine.etapaAtiva(1, 6), 5);
  assert.equal(Vitrine.etapaAtiva(0.5, 6), 3);
  assert.equal(Vitrine.etapaAtiva(0.09, 6), 0);
  assert.equal(Vitrine.etapaAtiva(0.11, 6), 1);
  assert.equal(Vitrine.etapaAtiva(2, 6), 5);
  assert.equal(Vitrine.etapaAtiva(0.5, 0), 0);
});

test("proximoIndice: dá a volta nas duas pontas", () => {
  assert.equal(Vitrine.proximoIndice(7, 1, 8), 0);
  assert.equal(Vitrine.proximoIndice(0, -1, 8), 7);
  assert.equal(Vitrine.proximoIndice(3, 0, 8), 3);
  assert.equal(Vitrine.proximoIndice(2, -11, 8), 7);
  assert.equal(Vitrine.proximoIndice(0, 1, 0), 0);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm --prefix frontend test`
Expected: FAIL — `ENOENT ... public/lenda/js/vitrine.js`.

- [ ] **Step 3: `index.html` da vitrine**

Arquivo: `frontend/public/lenda/index.html`
```html
<!doctype html>
<html lang="pt-BR">
<!-- Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados. -->
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lenda do Campinho — RPG de futebol grátis para toda a família</title>
<meta name="description" content="Um RPG de futebol para toda a família! Comece no campinho da vila, drible criaturas, enfrente chefões nas arenas, jogue a temporada pelo seu clube e viaje pelo mundo inteiro. Grátis para jogar.">
<link rel="canonical" href="https://www.educacaogamer.com.br/lenda/">
<meta name="theme-color" content="#0d0b26">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Educação Gamer">
<meta property="og:title" content="Lenda do Campinho — RPG de futebol grátis para toda a família">
<meta property="og:description" content="Do campinho de terra da vila até a Torre Infinita do Multiverso. Jogue grátis no navegador ou no Windows.">
<meta property="og:url" content="https://www.educacaogamer.com.br/lenda/">
<meta property="og:image" content="https://www.educacaogamer.com.br/lenda/a/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@600;700;800;900&display=swap" rel="stylesheet">
<link rel="preload" as="image" href="/lenda-do-campinho/a/capa.webp" media="(min-aspect-ratio: 4/5)">
<link rel="preload" as="image" href="/lenda-do-campinho/a/capa_vertical.webp" media="(max-aspect-ratio: 4/5)">
<link rel="stylesheet" href="/lenda-do-campinho/css/marca.css">
<link rel="stylesheet" href="css/vitrine.css">
</head>
<body>

<nav class="nav" id="nav">
  <a class="nav-logo" href="#topo"><img src="a/logo.webp" alt="Lenda do Campinho" width="1006" height="640"></a>
  <div class="nav-links" id="navLinks">
    <a href="#jornada" data-t="nav.jornada">A jornada</a>
    <a href="#trailer" data-t="nav.trailer">Trailer</a>
    <a href="#jogo" data-t="nav.jogo">O jogo</a>
    <a href="#expansao" data-t="nav.expansao">Expansão</a>
    <a href="#imprensa" data-t="nav.imprensa">Imprensa</a>
  </div>
  <div class="nav-dir">
    <div class="idiomas" role="group" aria-label="Idioma / Language">
      <button type="button" data-idioma="pt" aria-pressed="true">PT</button>
      <button type="button" data-idioma="en" aria-pressed="false">EN</button>
    </div>
    <a class="lc-btn lc-btn-ouro lc-btn-pequeno nav-cta" href="/lenda-do-campinho/?jogar=1" data-t="nav.jogar">Jogar grátis</a>
    <button type="button" class="nav-menu" id="navMenu" aria-expanded="false" aria-controls="navLinks" data-t-aria="nav.menu" aria-label="Abrir menu"><span></span><span></span><span></span></button>
  </div>
</nav>

<header class="hero" id="topo">
  <div class="hero-capa" id="heroCapa" data-t-alt="hero.alt" data-alt="Garoto dá uma bicicleta na bola enquanto chefões e um mundo fantástico aparecem ao fundo"></div>
  <div class="hero-veu"></div>
  <div class="hero-conteudo" id="heroConteudo">
    <span class="selo-topo entra" style="--atraso:.9s"><b data-t="hero.gratis">Grátis</b><span data-t="hero.selo">RPG de futebol para toda a família</span></span>
    <h1 class="logo-grande entra" style="--atraso:1.25s"><img src="a/logo.webp" alt="Lenda do Campinho" width="1006" height="640"></h1>
    <p class="frase entra" style="--atraso:1.85s" data-t-html="hero.frase">Do campinho de terra da vila até a <strong>Torre Infinita do Multiverso</strong>.<span class="so-largo"> Drible criaturas, vença chefões nas arenas e transforme um garoto do bairro em <strong>lenda do futebol</strong>.</span></p>
    <div class="acoes entra" style="--atraso:2.1s">
      <a class="lc-btn lc-btn-ouro" href="/lenda-do-campinho/?jogar=1">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.98-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14z"/></svg>
        <span data-t="hero.jogar">Jogar grátis no navegador</span>
      </a>
      <a class="lc-btn lc-btn-vidro" href="/lenda-do-campinho/baixar/LendaDoCampinho.exe" download>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
        <span data-t="hero.baixar">Baixar para Windows</span>
      </a>
    </div>
    <div class="plataformas entra" style="--atraso:2.35s">
      <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg><span data-t="hero.navegador">Navegador</span></span>
      <span><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 5.5 10 4.5v7H3zM11 4.3 21 3v8.5H11zM3 12.5h7v7l-7-1zM11 12.5h10V21l-10-1.3z"/></svg>Windows</span>
      <span>Português · English</span>
      <span class="lc-selo" data-t="hero.steam">Em breve na Steam</span>
    </div>
  </div>
  <a class="desce" href="#jornada"><i></i><span data-t="hero.rolar">Role para a jornada</span></a>
</header>

<section class="jornada" id="jornada">
  <div class="jornada-fixa">
    <div class="jornada-fundo" id="jornadaFundo"></div>
    <div class="secao-cabeca">
      <span class="lc-sobretitulo" data-t="jor.sobre">A jornada</span>
      <h2 data-t-html="jor.titulo">Do campinho da vila<br>até <em>o mundo inteiro</em></h2>
    </div>
    <div class="trilho" id="trilho">
      <article class="etapa" data-cor="#6b3a12"><img src="a/cap_07_vila.webp" alt="" loading="lazy" width="1280" height="720"><div class="etapa-texto"><span class="etapa-num" data-t="jor.c1.num">CAPÍTULO 1</span><h3 data-t="jor.c1.titulo">A Vila do Campinho</h3><p data-t="jor.c1.texto">Nasça na vila, faça amigos e dê os primeiros dribles no campinho de terra.</p></div></article>
      <article class="etapa" data-cor="#3b2a8f"><img src="a/cap_04_historia.webp" alt="" loading="lazy" width="1280" height="720"><div class="etapa-texto"><span class="etapa-num" data-t="jor.c2.num">CAPÍTULO 2</span><h3 data-t="jor.c2.titulo">Uma história de verdade</h3><p data-t="jor.c2.texto">Capítulos com personagens, escolhas e missões que contam como um garoto vira craque.</p></div></article>
      <article class="etapa" data-cor="#0f5a3d"><img src="a/cap_05_clube.webp" alt="" loading="lazy" width="1280" height="720"><div class="etapa-texto"><span class="etapa-num" data-t="jor.c3.num">CAPÍTULO 3</span><h3 data-t="jor.c3.titulo">Seu clube, sua carreira</h3><p data-t="jor.c3.texto">Funde o seu time, monte o elenco e suba da Várzea até a Primeirona.</p></div></article>
      <article class="etapa" data-cor="#7a1f5c"><img src="a/cap_01_toquio.webp" alt="" loading="lazy" width="1280" height="720"><div class="etapa-texto"><span class="etapa-num" data-t="jor.c4.num">CAPÍTULO 4</span><h3 data-t="jor.c4.titulo">Volta ao mundo</h3><p data-t="jor.c4.texto">Tóquio, Cairo, Londres, Paris, Buenos Aires — dezenas de cidades e áreas de caça.</p></div></article>
      <article class="etapa" data-cor="#8a2410"><img src="a/cap_02_lava.webp" alt="" loading="lazy" width="1280" height="720"><div class="etapa-texto"><span class="etapa-num" data-t="jor.c5.num">CAPÍTULO 5</span><h3 data-t="jor.c5.titulo">Chefões nas arenas</h3><p data-t="jor.c5.texto">Terras de lava, guardiões gigantes e chefões que exigem time, equipamento e estratégia.</p></div></article>
      <article class="etapa" data-cor="#1b3f8f"><img src="a/cap_03_guardiao.webp" alt="" loading="lazy" width="1280" height="720"><div class="etapa-texto"><span class="etapa-num" data-t="jor.c6.num">CAPÍTULO 6</span><h3 data-t="jor.c6.titulo">Além do mundo</h3><p data-t="jor.c6.texto">Atlântida, a Área Interestelar e o Multiverso esperam quem chegar ao topo.</p></div></article>
    </div>
    <div class="regua"><i id="regua"></i>
      <div class="regua-marcos" id="marcos"><span data-t="jor.m1">Vila</span><span data-t="jor.m2">História</span><span data-t="jor.m3">Clube</span><span data-t="jor.m4">Mundo</span><span data-t="jor.m5">Arenas</span><span data-t="jor.m6">Multiverso</span></div>
    </div>
  </div>
</section>

<section class="secao trailer" id="trailer">
  <div class="secao-cabeca centro lc-entra">
    <span class="lc-sobretitulo" data-t="tr.sobre">Trailer</span>
    <h2 data-t="tr.titulo">Veja a lenda em ação</h2>
    <p data-t="tr.texto">Do campinho de terra ao Multiverso, em um minuto.</p>
  </div>
  <div class="trailer-quadro lc-entra" id="trailerQuadro" style="--i:1">
    <button type="button" class="trailer-play" id="trailerPlay" data-t-aria="tr.assistir" aria-label="Assistir ao trailer">
      <img src="a/poster.webp" alt="" loading="lazy" width="1280" height="720">
      <span class="trailer-botao"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.98-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14z"/></svg></span>
    </button>
  </div>
</section>

<section class="secao jogo" id="jogo">
  <div class="secao-cabeca centro lc-entra">
    <span class="lc-sobretitulo" data-t="jg.sobre">O jogo</span>
    <h2 data-t="jg.titulo">Tudo o que cabe numa lenda</h2>
  </div>
  <div class="destaques">
    <article class="destaque lc-entra" style="--i:0"><div class="destaque-corpo">
      <svg class="destaque-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>
      <h3 data-t="jg.d1.titulo">RPG de verdade</h3><p data-t="jg.d1.texto">Suba de nível, aprenda dribles, escolha sua classe e monte seu equipamento.</p></div></article>
    <article class="destaque lc-entra" style="--i:1"><div class="destaque-corpo">
      <svg class="destaque-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>
      <h3 data-t="jg.d2.titulo">Mundo enorme</h3><p data-t="jg.d2.texto">A Vila, o Brasil, a Europa, Tóquio, o Cairo e muito mais: dezenas de áreas de caça.</p></div></article>
    <article class="destaque lc-entra" style="--i:2"><div class="destaque-corpo">
      <svg class="destaque-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 6h3v2a3 3 0 0 1-3 3M7 6H4v2a3 3 0 0 0 3 3"/></svg>
      <h3 data-t="jg.d3.titulo">Carreira e clube</h3><p data-t="jg.d3.texto">Jogue temporadas pelo seu time, monte o elenco e dispute ligas pelo mundo.</p></div></article>
    <article class="destaque lc-entra" style="--i:3"><div class="destaque-corpo">
      <svg class="destaque-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/></svg>
      <h3 data-t="jg.d4.titulo">Agência de talentos</h3><p data-t="jg.d4.texto">Descubra garotos com futuro, cuide das famílias e transforme promessas em lendas.</p></div></article>
    <article class="destaque lc-entra" style="--i:4"><div class="destaque-corpo">
      <svg class="destaque-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.7 3 5 6.5 5c2 0 3.5 1.2 5.5 3.2C14 6.2 15.5 5 17.5 5 21 5 22.8 8.7 21.5 11.8 19.5 16.4 12 21 12 21z"/></svg>
      <h3 data-t="jg.d5.titulo">Para toda a família</h3><p data-t="jg.d5.texto">Sem sangue, sem palavrão e sem caixas de recompensa pagas.</p></div></article>
    <article class="destaque lc-entra" style="--i:5"><div class="destaque-corpo">
      <svg class="destaque-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M3 12h18M12 8v13M12 8S10.5 3 7.5 3a2.5 2.5 0 0 0 0 5M12 8s1.5-5 4.5-5a2.5 2.5 0 0 1 0 5"/></svg>
      <h3 data-t="jg.d6.titulo">Grátis até o nível 195</h3><p data-t="jg.d6.texto">O jogo-base é completo e gratuito até o nível 195, no navegador ou no Windows.</p></div></article>
  </div>
</section>

<section class="secao galeria" id="galeria">
  <div class="secao-cabeca centro lc-entra">
    <span class="lc-sobretitulo" data-t="gal.sobre">Galeria</span>
    <h2 data-t="gal.titulo">Um mundo para explorar</h2>
  </div>
  <div class="galeria-grade">
    <button type="button" class="galeria-item grande lc-entra" style="--i:0" data-grande="a/cap_07_vila.webp"><img src="a/cap_07_vila_p.webp" alt="A Vila do Campinho" data-t-alt="gal.f1" loading="lazy" width="640" height="360"><span class="galeria-legenda" data-t="gal.f1">A Vila do Campinho</span></button>
    <button type="button" class="galeria-item lc-entra" style="--i:1" data-grande="a/cap_01_toquio.webp"><img src="a/cap_01_toquio_p.webp" alt="Tóquio — Distrito Neon" data-t-alt="gal.f2" loading="lazy" width="640" height="360"><span class="galeria-legenda" data-t="gal.f2">Tóquio — Distrito Neon</span></button>
    <button type="button" class="galeria-item lc-entra" style="--i:2" data-grande="a/cap_02_lava.webp"><img src="a/cap_02_lava_p.webp" alt="Terras de lava" data-t-alt="gal.f3" loading="lazy" width="640" height="360"><span class="galeria-legenda" data-t="gal.f3">Terras de lava</span></button>
    <button type="button" class="galeria-item lc-entra" style="--i:3" data-grande="a/cap_03_guardiao.webp"><img src="a/cap_03_guardiao_p.webp" alt="Guardiões gigantes" data-t-alt="gal.f4" loading="lazy" width="640" height="360"><span class="galeria-legenda" data-t="gal.f4">Guardiões gigantes</span></button>
    <button type="button" class="galeria-item lc-entra" style="--i:4" data-grande="a/cap_04_historia.webp"><img src="a/cap_04_historia_p.webp" alt="Capítulos da história" data-t-alt="gal.f5" loading="lazy" width="640" height="360"><span class="galeria-legenda" data-t="gal.f5">Capítulos da história</span></button>
    <button type="button" class="galeria-item lc-entra" style="--i:5" data-grande="a/cap_05_clube.webp"><img src="a/cap_05_clube_p.webp" alt="Seu clube" data-t-alt="gal.f6" loading="lazy" width="640" height="360"><span class="galeria-legenda" data-t="gal.f6">Seu clube</span></button>
    <button type="button" class="galeria-item lc-entra" style="--i:6" data-grande="a/cap_06_agencia.webp"><img src="a/cap_06_agencia_p.webp" alt="A agência de talentos" data-t-alt="gal.f7" loading="lazy" width="640" height="360"><span class="galeria-legenda" data-t="gal.f7">A agência de talentos</span></button>
    <button type="button" class="galeria-item lc-entra" style="--i:7" data-grande="a/cap_00_inicio.webp"><img src="a/cap_00_inicio_p.webp" alt="Onde sua lenda começa" data-t-alt="gal.f8" loading="lazy" width="640" height="360"><span class="galeria-legenda" data-t="gal.f8">Onde sua lenda começa</span></button>
  </div>
</section>

<section class="secao expansao" id="expansao">
  <div class="estrelas" aria-hidden="true"><i></i><i></i><i></i></div>
  <div class="expansao-conteudo">
    <div class="secao-cabeca centro lc-entra">
      <span class="lc-sobretitulo" data-t="exp.sobre">Expansão Fim de Jogo</span>
      <h2 data-t="exp.titulo">Além do nível 195</h2>
      <p data-t="exp.texto">Atlântida, a Área Interestelar e o Multiverso: do nível 195 ao 600+, com chefões, cidades e desafios novos.</p>
    </div>
    <div class="mundos">
      <article class="mundo lc-entra" style="--i:0"><span class="mundo-orbe atlantida" aria-hidden="true"></span><h3 data-t="exp.a1.titulo">Atlântida</h3><p data-t="exp.a1.texto">Uma cidade inteira no fundo do mar.</p></article>
      <article class="mundo lc-entra" style="--i:1"><span class="mundo-orbe espaco" aria-hidden="true"></span><h3 data-t="exp.a2.titulo">Área Interestelar</h3><p data-t="exp.a2.texto">Planetas, estações e a Copa Intergaláctica.</p></article>
      <article class="mundo lc-entra" style="--i:2"><span class="mundo-orbe multiverso" aria-hidden="true"></span><h3 data-t="exp.a3.titulo">Multiverso</h3><p data-t="exp.a3.texto">A Torre Infinita e chefões de outras dimensões.</p></article>
    </div>
    <p class="expansao-selo lc-entra" style="--i:3"><span class="lc-selo" data-t="exp.niveis">Nível 195 → 600+</span><span class="lc-selo" data-t="hero.steam">Em breve na Steam</span></p>
  </div>
</section>

<section class="fim" id="comecar">
  <div class="fim-fundo" aria-hidden="true"></div>
  <div class="fim-conteudo lc-entra">
    <h2 data-t="fim.titulo">Comece sua lenda hoje</h2>
    <p data-t="fim.texto">Grátis, no navegador ou no Windows.</p>
    <div class="acoes centro">
      <a class="lc-btn lc-btn-ouro" href="/lenda-do-campinho/?jogar=1"><span data-t="hero.jogar">Jogar grátis no navegador</span></a>
      <a class="lc-btn lc-btn-vidro" href="/lenda-do-campinho/baixar/LendaDoCampinho.exe" download><span data-t="hero.baixar">Baixar para Windows</span></a>
    </div>
    <span class="lc-selo" data-t="hero.steam">Em breve na Steam</span>
  </div>
</section>

<section class="secao imprensa" id="imprensa">
  <div class="secao-cabeca lc-entra">
    <span class="lc-sobretitulo" data-t="imp.sobre">Imprensa</span>
    <h2 data-t="imp.titulo">Kit de imprensa</h2>
  </div>
  <div class="imprensa-grade">
    <div class="lc-vidro imprensa-ficha lc-entra">
      <h3 data-t="imp.ficha">Ficha técnica</h3>
      <dl>
        <dt data-t="imp.dev.rot">Desenvolvedor</dt><dd>Educação Gamer</dd>
        <dt data-t="imp.dist.rot">Distribuidora</dt><dd>Educação Gamer</dd>
        <dt data-t="imp.lanc.rot">Lançamento</dt><dd data-t="imp.lanc">No navegador desde 2026 · Em breve na Steam</dd>
        <dt data-t="imp.plat.rot">Plataformas</dt><dd data-t="imp.plat">Navegador e Windows</dd>
        <dt data-t="imp.preco.rot">Preço</dt><dd data-t="imp.preco">Grátis para jogar (até o nível 195)</dd>
        <dt data-t="imp.idiomas.rot">Idiomas</dt><dd data-t="imp.idiomas">Português e inglês</dd>
        <dt data-t="imp.genero.rot">Gênero</dt><dd data-t="imp.genero">RPG, futebol, aventura, para toda a família</dd>
        <dt>Site</dt><dd><a href="https://www.educacaogamer.com.br/lenda/">educacaogamer.com.br/lenda</a></dd>
      </dl>
    </div>
    <div class="imprensa-textos">
      <div class="lc-vidro texto-copiavel lc-entra" style="--i:1">
        <div class="texto-cabeca"><h3 data-t="imp.curta.titulo">Descrição curta</h3><button type="button" class="lc-btn lc-btn-vidro lc-btn-pequeno" data-copia="textoCurto" data-t="imp.copiar">Copiar</button></div>
        <p id="textoCurto" data-t="imp.curta">Um RPG de futebol para toda a família! Comece no campinho da vila, drible criaturas, enfrente chefões nas arenas, jogue a temporada pelo seu clube e viaje pelo mundo inteiro. Grátis para jogar, em português e inglês.</p>
      </div>
      <div class="lc-vidro texto-copiavel lc-entra" style="--i:2">
        <div class="texto-cabeca"><h3 data-t="imp.longa.titulo">Descrição longa</h3><button type="button" class="lc-btn lc-btn-vidro lc-btn-pequeno" data-copia="textoLongo" data-t="imp.copiar">Copiar</button></div>
        <div id="textoLongo" class="texto-longo" data-t-html="imp.longa"><p>Do campinho de terra da vila até a Torre Infinita do Multiverso: no <strong>Lenda do Campinho</strong> você é um garoto (ou garota) que sonha em virar lenda do futebol — e a bola é a sua arma para driblar criaturas, vencer chefões e conquistar o mundo.</p><ul><li><strong>RPG de verdade:</strong> suba de nível, aprenda dribles, escolha a sua classe e monte o seu equipamento.</li><li><strong>Mundo enorme:</strong> a Vila, a Cidade, o Brasil, a Europa, Tóquio, o Cairo, Londres e muito mais — dezenas de áreas de caça e chefões nas arenas.</li><li><strong>Carreira e Clube:</strong> jogue temporadas pelo seu time, monte o elenco e dispute ligas pelo mundo.</li><li><strong>Agência:</strong> descubra talentos, cuide das famílias e transforme garotos em lendas.</li><li><strong>Para toda a família:</strong> sem sangue, sem palavrão, sem caixas de recompensa pagas.</li></ul><p>O jogo-base é <strong>gratuito e completo até o nível 195</strong>. Quem quiser ir além encontra a <strong>Expansão Fim de Jogo</strong> — Atlântida, a Área Interestelar e o Multiverso — e pacotes opcionais de visual.</p></div>
      </div>
      <div class="imprensa-acoes lc-entra" style="--i:3">
        <a class="lc-btn lc-btn-ouro" href="imprensa/lenda-do-campinho-kit-imprensa.zip" download><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg><span data-t="imp.kit">Baixar kit completo (ZIP)</span></a>
        <a class="lc-btn lc-btn-vidro" href="imprensa/logo.png" download><span data-t="imp.logo">Logo (PNG)</span></a>
      </div>
      <p class="imprensa-contato lc-entra" style="--i:4"><span data-t="imp.contato">Imprensa e parcerias:</span> <a href="mailto:guramalli@gmail.com">guramalli@gmail.com</a></p>
    </div>
  </div>
</section>

<footer class="rodape">
  <img src="a/logo.webp" alt="Lenda do Campinho" width="1006" height="640" loading="lazy">
  <p><span data-t="rod.direitos">© 2026 Educação Gamer. Todos os direitos reservados.</span></p>
  <p class="rodape-links"><a href="/lenda-do-campinho/direitos.html" data-t="rod.privacidade">Direitos autorais e privacidade</a> · <a href="https://www.educacaogamer.com.br/" data-t="rod.voltar">Voltar ao Educação Gamer</a></p>
</footer>

<dialog class="caixa-foto" id="caixaFoto">
  <button type="button" class="caixa-fechar" id="caixaFechar" data-t-aria="gal.fechar" aria-label="Fechar">×</button>
  <button type="button" class="caixa-seta esq" id="caixaAnterior" data-t-aria="gal.anterior" aria-label="Foto anterior">‹</button>
  <figure><img id="caixaFotoImg" alt=""><figcaption id="caixaFotoLegenda"></figcaption></figure>
  <button type="button" class="caixa-seta dir" id="caixaProxima" data-t-aria="gal.proxima" aria-label="Próxima foto">›</button>
</dialog>

<script src="js/textos.js"></script>
<script src="js/idioma.js"></script>
<script src="/lenda-do-campinho/js/capa_viva.js"></script>
<script src="js/vitrine.js"></script>
</body>
</html>
```

(`js/textos.js` e `js/idioma.js` só existem a partir da Tarefa 5; até lá o navegador mostra 404 no console para eles — esperado — e a página fica em português.)

- [ ] **Step 4: `vitrine.css`**

Arquivo: `frontend/public/lenda/css/vitrine.css`
```css
/* Lenda do Campinho — vitrine (/lenda/). © 2026 Educação Gamer. Todos os direitos reservados.
   Base (cores, botões, vidro, capa viva): /lenda-do-campinho/css/marca.css. */
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--lc-noite); color: #fff; font-family: var(--lc-texto); overflow-x: hidden; -webkit-font-smoothing: antialiased; }
a { color: inherit; text-decoration: none; }
img { display: block; max-width: 100%; height: auto; }
h1, h2, h3 { margin: 0; }
:focus-visible { outline: 3px solid var(--lc-ouro); outline-offset: 3px; }

/* ---------- Barra do topo ---------- */
.nav { position: fixed; inset: 0 0 auto 0; z-index: 50; display: flex; align-items: center; gap: 28px; padding: 14px clamp(16px, 4vw, 48px); transition: background .4s, padding .4s, box-shadow .4s; }
.nav.solida { background: rgba(13, 11, 38, .74); backdrop-filter: blur(14px) saturate(140%); -webkit-backdrop-filter: blur(14px) saturate(140%); padding-top: 10px; padding-bottom: 10px; box-shadow: 0 1px 0 rgba(165, 180, 252, .12); }
.nav-logo { transition: opacity .3s; }
.nav-logo img { height: 38px; width: auto; filter: drop-shadow(0 2px 6px rgba(0, 0, 0, .5)); }
.nav-links { display: flex; gap: 26px; margin-left: 8px; font-weight: 800; font-size: 15px; }
.nav-links a { opacity: .82; position: relative; }
.nav-links a::after { content: ""; position: absolute; left: 0; right: 0; bottom: -6px; height: 2px; background: var(--lc-ouro); transform: scaleX(0); transform-origin: left; transition: transform .25s; }
.nav-links a:hover { opacity: 1; }
.nav-links a:hover::after { transform: scaleX(1); }
.nav-dir { margin-left: auto; display: flex; align-items: center; gap: 12px; }
.idiomas { display: flex; padding: 3px; border-radius: 999px; background: rgba(255, 255, 255, .08); box-shadow: inset 0 0 0 1px rgba(165, 180, 252, .25); }
.idiomas button { border: 0; background: transparent; color: var(--lc-indigo-200); font: 800 13px var(--lc-texto); padding: 6px 10px; border-radius: 999px; cursor: pointer; }
.idiomas button[aria-pressed="true"] { background: var(--lc-ouro); color: var(--lc-tinta-ouro); }
.nav-menu { display: none; width: 42px; height: 42px; border: 0; border-radius: 12px; background: rgba(255, 255, 255, .1); cursor: pointer; flex-direction: column; justify-content: center; align-items: center; gap: 5px; }
.nav-menu span { width: 18px; height: 2px; border-radius: 2px; background: #fff; transition: transform .25s, opacity .25s; }
.nav.aberta .nav-menu span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.nav.aberta .nav-menu span:nth-child(2) { opacity: 0; }
.nav.aberta .nav-menu span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
@media (max-width: 960px) {
  .nav-menu { display: flex; }
  .nav-links { position: absolute; top: 100%; left: 12px; right: 12px; margin: 6px 0 0; flex-direction: column; gap: 0; padding: 8px; border-radius: 18px; background: rgba(13, 11, 38, .94); backdrop-filter: blur(14px); box-shadow: 0 20px 40px rgba(0, 0, 0, .5); opacity: 0; transform: translateY(-8px); pointer-events: none; transition: opacity .2s, transform .2s; }
  .nav.aberta .nav-links { opacity: 1; transform: none; pointer-events: auto; }
  .nav-links a { padding: 12px 14px; border-radius: 12px; font-size: 17px; }
  .nav-links a::after { display: none; }
  .nav-links a:hover { background: rgba(255, 255, 255, .06); }
}
@media (max-width: 520px) { .nav-cta { display: none; } .nav { gap: 12px; } }

/* ---------- Abertura ---------- */
.hero { position: relative; height: 100svh; min-height: 600px; overflow: hidden; isolation: isolate; }
.hero-capa { position: absolute; inset: 0; z-index: 0; }
.hero-veu { position: absolute; inset: 0; z-index: 1; pointer-events: none;
  background: linear-gradient(90deg, rgba(13, 11, 38, .82) 0%, rgba(13, 11, 38, .55) 28%, rgba(13, 11, 38, 0) 55%),
              linear-gradient(0deg, var(--lc-noite) 0%, rgba(13, 11, 38, .55) 14%, rgba(13, 11, 38, 0) 34%),
              linear-gradient(180deg, rgba(13, 11, 38, .55) 0%, rgba(13, 11, 38, 0) 16%); }
.hero-conteudo { position: absolute; z-index: 2; left: clamp(16px, 6vw, 96px); top: 50%; width: min(640px, 48vw); transform: translate(var(--mx, 0px), calc(-46% + var(--my, 0px) - var(--rol, 0) * 160px)); will-change: transform, opacity; }
.selo-topo { display: inline-flex; align-items: center; gap: 8px; padding: 7px 14px 7px 8px; border-radius: 999px; background: rgba(255, 255, 255, .1); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .22); backdrop-filter: blur(8px); font-size: 13px; font-weight: 900; letter-spacing: .6px; text-transform: uppercase; }
.selo-topo b { background: var(--lc-ouro); color: var(--lc-tinta-ouro); padding: 3px 9px; border-radius: 999px; font-size: 11px; }
.logo-grande { position: relative; width: min(500px, 88%); margin: 18px 0 6px -2%; }
.logo-grande img { width: 100%; filter: drop-shadow(0 18px 30px rgba(0, 0, 0, .55)); }
.logo-grande::after { content: ""; position: absolute; inset: 0; background: linear-gradient(105deg, transparent 35%, rgba(255, 255, 255, .85) 50%, transparent 65%); background-size: 250% 100%; background-position: 150% 0; -webkit-mask: url(../a/logo.webp) center / contain no-repeat; mask: url(../a/logo.webp) center / contain no-repeat; mix-blend-mode: overlay; animation: reflexoLogo 6s ease-in-out 3.4s infinite; }
@keyframes reflexoLogo { 0%, 60% { background-position: 150% 0; } 100% { background-position: -50% 0; } }
.frase { font-size: clamp(17px, 1.45vw, 21px); line-height: 1.55; font-weight: 700; color: #eef0ff; margin: 6px 0 26px; text-shadow: 0 2px 12px rgba(0, 0, 0, .6); }
.frase strong { color: var(--lc-ouro); font-weight: 900; }
.acoes { display: flex; flex-wrap: wrap; gap: 14px; }
.acoes.centro { justify-content: center; }
.plataformas { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 18px; margin-top: 22px; font-size: 14px; font-weight: 800; color: var(--lc-indigo-100); }
.plataformas > span { display: inline-flex; align-items: center; gap: 7px; }
.plataformas svg { width: 18px; height: 18px; opacity: .85; }
.desce { position: absolute; z-index: 2; left: 50%; bottom: 22px; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 8px; font-size: 12px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; opacity: .8; }
.desce i { width: 26px; height: 42px; border-radius: 14px; box-shadow: inset 0 0 0 2px rgba(255, 255, 255, .7); position: relative; }
.desce i::after { content: ""; position: absolute; left: 50%; top: 8px; width: 4px; height: 8px; margin-left: -2px; border-radius: 2px; background: #fff; animation: rolinho 1.8s ease-in-out infinite; }
@keyframes rolinho { 0% { transform: translateY(0); opacity: 1; } 80% { transform: translateY(14px); opacity: 0; } 100% { opacity: 0; } }
.entra { opacity: 0; transform: translateY(26px); animation: sobe .9s var(--lc-mola) var(--atraso, 0s) forwards; }
@keyframes sobe { to { opacity: 1; transform: none; } }
.logo-grande.entra { animation: logoCai 1.15s cubic-bezier(.34, 1.56, .64, 1) var(--atraso, 0s) forwards; }
@keyframes logoCai { 0% { opacity: 0; transform: translateY(-40px) scale(.8) rotate(-3deg); } 60% { opacity: 1; } 100% { opacity: 1; transform: none; } }

@media (max-aspect-ratio: 4/5) {
  .hero-veu { background: linear-gradient(180deg, rgba(13, 11, 38, .7) 0%, rgba(13, 11, 38, .15) 30%, rgba(13, 11, 38, 0) 45%),
                          linear-gradient(0deg, var(--lc-noite) 0%, rgba(13, 11, 38, .92) 22%, rgba(13, 11, 38, .4) 42%, rgba(13, 11, 38, 0) 58%); }
  /* Celular: logo no céu, lá em cima; frase e botões embaixo. O garoto fica livre no meio. */
  .hero-conteudo { left: 18px; right: 18px; width: auto; top: 72px; bottom: 26px; transform: none; text-align: center; display: flex; flex-direction: column; align-items: center; }
  .selo-topo { display: none; }
  .logo-grande { order: 1; margin: 0 auto; width: min(300px, 78%); }
  .frase { order: 3; font-size: 15px; margin: auto 0 16px; }
  .frase .so-largo { display: none; }
  .acoes { order: 4; width: 100%; justify-content: center; }
  .acoes .lc-btn { width: 100%; height: 50px; font-size: 17px; }
  .plataformas { order: 5; margin-top: 14px; font-size: 12px; justify-content: center; }
  .desce { display: none; }
  .nav:not(.solida) .nav-logo { opacity: 0; pointer-events: none; }
}

/* ---------- Seções (cabeçalho comum) ---------- */
.secao { position: relative; padding: clamp(80px, 12vh, 140px) clamp(16px, 6vw, 96px); }
.secao-cabeca { position: relative; z-index: 1; margin-bottom: clamp(28px, 5vh, 56px); }
.secao-cabeca.centro { text-align: center; max-width: 760px; margin-left: auto; margin-right: auto; }
.secao-cabeca h2 { font-family: var(--lc-titulo); font-weight: 700; font-size: clamp(32px, 4.4vw, 64px); line-height: 1.04; margin-top: 8px; letter-spacing: -.5px; }
.secao-cabeca h2 em { font-style: normal; background: linear-gradient(90deg, var(--lc-ouro), #ff9f43); -webkit-background-clip: text; background-clip: text; color: transparent; }
.secao-cabeca p { color: var(--lc-indigo-100); font-weight: 700; font-size: clamp(16px, 1.3vw, 19px); line-height: 1.6; margin: 14px 0 0; }

/* ---------- Jornada ---------- */
.jornada { position: relative; height: 520vh; }
.jornada-fixa { position: sticky; top: 0; height: 100svh; overflow: hidden; display: flex; flex-direction: column; justify-content: center; }
.jornada .secao-cabeca { padding: 0 clamp(16px, 6vw, 96px); margin-bottom: 4vh; }
.jornada-fundo { position: absolute; inset: 0; z-index: 0; transition: background 1.2s ease; }
.jornada-fundo::after { content: ""; position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 120%, rgba(13, 11, 38, 0) 0%, var(--lc-noite) 70%); }
.trilho { position: relative; z-index: 1; display: flex; gap: clamp(18px, 2.4vw, 36px); padding: 0 clamp(16px, 6vw, 96px); will-change: transform; }
.etapa { position: relative; flex: 0 0 clamp(290px, 46vw, 720px); border-radius: 26px; overflow: hidden; background: #1a1740; box-shadow: 0 30px 60px rgba(0, 0, 0, .45), inset 0 0 0 1px rgba(165, 180, 252, .14); transition: transform .5s var(--lc-mola), opacity .5s; }
.etapa img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; transform: scale(1.08); transition: transform 1.2s var(--lc-mola); }
.etapa.ativa img { transform: scale(1); }
.etapa:not(.ativa) { opacity: .55; transform: scale(.94); }
.etapa-texto { position: absolute; inset: auto 0 0 0; padding: 60px 26px 22px; background: linear-gradient(0deg, rgba(13, 11, 38, .95) 0%, rgba(13, 11, 38, .7) 55%, transparent); }
.etapa-num { font-family: var(--lc-titulo); font-weight: 700; font-size: 14px; letter-spacing: 1.5px; color: var(--lc-ouro); }
.etapa h3 { font-family: var(--lc-titulo); font-weight: 600; font-size: clamp(22px, 2.2vw, 32px); margin: 4px 0 6px; }
.etapa p { margin: 0; font-weight: 700; color: #d9dcff; font-size: clamp(14px, 1.1vw, 17px); line-height: 1.5; max-width: 52ch; }
.regua { position: relative; z-index: 1; margin: 5vh clamp(16px, 6vw, 96px) 0; height: 4px; border-radius: 4px; background: rgba(255, 255, 255, .12); }
.regua i { position: absolute; inset: 0 auto 0 0; width: 0; border-radius: 4px; background: linear-gradient(90deg, var(--lc-ouro), #ff9f43); box-shadow: 0 0 18px rgba(255, 201, 40, .6); }
.regua-marcos { display: flex; justify-content: space-between; margin-top: 12px; font-size: 12px; font-weight: 900; letter-spacing: .8px; text-transform: uppercase; color: rgba(255, 255, 255, .45); }
.regua-marcos span.feito { color: #fff; }
/* Celular: sem prender a tela — faixa que se arrasta com o dedo */
@media (max-width: 699px) {
  .jornada { height: auto; }
  .jornada-fixa { position: relative; height: auto; padding: 90px 0 70px; }
  .trilho { overflow-x: auto; scroll-snap-type: x mandatory; transform: none !important; scrollbar-width: none; padding-bottom: 6px; }
  .trilho::-webkit-scrollbar { display: none; }
  .etapa { flex-basis: 84vw; scroll-snap-align: center; }
  .regua-marcos span:nth-child(even) { visibility: hidden; }
}

/* ---------- Trailer ---------- */
.trailer { background: radial-gradient(ellipse at 50% 0%, rgba(79, 70, 229, .22), transparent 60%); }
.trailer-quadro { position: relative; max-width: 1100px; margin: 0 auto; aspect-ratio: 16 / 9; border-radius: 26px; overflow: hidden; background: #000; box-shadow: 0 40px 80px rgba(0, 0, 0, .55), 0 0 0 1px rgba(165, 180, 252, .2); }
.trailer-quadro video { width: 100%; height: 100%; display: block; background: #000; }
.trailer-play { position: absolute; inset: 0; width: 100%; height: 100%; padding: 0; border: 0; cursor: pointer; background: none; }
.trailer-play img { width: 100%; height: 100%; object-fit: cover; transition: transform .8s var(--lc-mola), filter .4s; }
.trailer-play:hover img { transform: scale(1.03); filter: brightness(.85); }
.trailer-botao { position: absolute; left: 50%; top: 50%; width: 96px; height: 96px; margin: -48px 0 0 -48px; border-radius: 50%; display: grid; place-items: center; color: var(--lc-tinta-ouro); background: linear-gradient(180deg, var(--lc-ouro-claro), var(--lc-ouro)); box-shadow: 0 0 0 0 rgba(255, 201, 40, .6), 0 18px 40px rgba(0, 0, 0, .5); animation: pulsoPlay 2.2s ease-out infinite; }
.trailer-botao svg { width: 40px; height: 40px; margin-left: 6px; }
@keyframes pulsoPlay { 0% { box-shadow: 0 0 0 0 rgba(255, 201, 40, .55), 0 18px 40px rgba(0, 0, 0, .5); } 100% { box-shadow: 0 0 0 28px rgba(255, 201, 40, 0), 0 18px 40px rgba(0, 0, 0, .5); } }

/* ---------- Destaques ---------- */
.destaques { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; max-width: 1200px; margin: 0 auto; }
@media (max-width: 960px) { .destaques { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 600px) { .destaques { grid-template-columns: minmax(0, 1fr); } }
.destaque { perspective: 900px; }
.destaque-corpo { position: relative; height: 100%; padding: 28px 26px; border-radius: 22px; overflow: hidden; background: linear-gradient(160deg, rgba(79, 70, 229, .28), rgba(30, 27, 75, .55)); border: 1px solid rgba(165, 180, 252, .2); transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)); transition: transform .3s ease, border-color .3s; transform-style: preserve-3d; }
.destaque-corpo::before { content: ""; position: absolute; inset: 0; background: radial-gradient(circle at var(--gx, 50%) var(--gy, 0%), rgba(255, 201, 40, .16), transparent 55%); opacity: 0; transition: opacity .3s; pointer-events: none; }
.destaque:hover .destaque-corpo { border-color: rgba(255, 201, 40, .45); }
.destaque:hover .destaque-corpo::before { opacity: 1; }
.destaque-icone { width: 46px; height: 46px; padding: 10px; border-radius: 14px; color: var(--lc-ouro); background: rgba(255, 201, 40, .12); box-shadow: inset 0 0 0 1px rgba(255, 201, 40, .3); }
.destaque h3 { font-family: var(--lc-titulo); font-weight: 600; font-size: 24px; margin: 18px 0 8px; }
.destaque p { margin: 0; color: var(--lc-indigo-100); font-weight: 700; line-height: 1.55; }

/* ---------- Galeria ---------- */
.galeria-grade { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; max-width: 1280px; margin: 0 auto; }
.galeria-item { position: relative; padding: 0; border: 0; border-radius: 18px; overflow: hidden; cursor: zoom-in; background: #1a1740; aspect-ratio: 16 / 9; box-shadow: 0 16px 34px rgba(0, 0, 0, .4); }
.galeria-item.grande { grid-column: span 2; grid-row: span 2; }
.galeria-item img { width: 100%; height: 100%; object-fit: cover; transition: transform .7s var(--lc-mola); }
.galeria-item:hover img { transform: scale(1.06); }
.galeria-legenda { position: absolute; inset: auto 0 0 0; padding: 26px 14px 10px; text-align: left; font: 800 13px var(--lc-texto); color: #fff; background: linear-gradient(0deg, rgba(13, 11, 38, .9), transparent); opacity: 0; transform: translateY(6px); transition: opacity .3s, transform .3s; }
.galeria-item:hover .galeria-legenda, .galeria-item:focus-visible .galeria-legenda { opacity: 1; transform: none; }
@media (max-width: 760px) { .galeria-grade { grid-template-columns: repeat(2, minmax(0, 1fr)); } .galeria-legenda { opacity: 1; transform: none; } }
.caixa-foto { width: 100vw; height: 100vh; max-width: none; max-height: none; margin: 0; padding: 0; border: 0; background: rgba(8, 6, 26, .94); color: #fff; }
.caixa-foto[open] { display: grid; place-items: center; animation: aparece .25s ease; }
.caixa-foto::backdrop { background: transparent; }
@keyframes aparece { from { opacity: 0; } to { opacity: 1; } }
.caixa-foto figure { margin: 0; max-width: min(1280px, 92vw); }
.caixa-foto img { max-height: 80vh; width: auto; margin: 0 auto; border-radius: 14px; box-shadow: 0 30px 80px rgba(0, 0, 0, .6); touch-action: pan-y; user-select: none; }
.caixa-foto figcaption { text-align: center; margin-top: 14px; font-weight: 800; color: var(--lc-indigo-100); }
.caixa-fechar, .caixa-seta { position: fixed; border: 0; cursor: pointer; color: #fff; background: rgba(255, 255, 255, .12); border-radius: 50%; width: 52px; height: 52px; font-size: 30px; line-height: 1; }
.caixa-fechar:hover, .caixa-seta:hover { background: rgba(255, 255, 255, .22); }
.caixa-fechar { top: 18px; right: 18px; }
.caixa-seta { top: 50%; margin-top: -26px; }
.caixa-seta.esq { left: 18px; }
.caixa-seta.dir { right: 18px; }

/* ---------- Expansão ---------- */
.expansao { overflow: hidden; background: radial-gradient(ellipse at 50% 30%, #3b1d78 0%, #1a0f45 45%, var(--lc-noite) 80%); }
.estrelas i { position: absolute; inset: -50% 0 0 0; background-repeat: repeat; animation: deriva linear infinite; pointer-events: none; }
.estrelas i:nth-child(1) { background-image: radial-gradient(1px 1px at 20px 30px, #fff 50%, transparent 51%), radial-gradient(1px 1px at 140px 90px, #c7d2fe 50%, transparent 51%), radial-gradient(1px 1px at 260px 170px, #fff 50%, transparent 51%); background-size: 300px 220px; opacity: .55; animation-duration: 90s; }
.estrelas i:nth-child(2) { background-image: radial-gradient(1.5px 1.5px at 60px 120px, #fde68a 50%, transparent 51%), radial-gradient(1.5px 1.5px at 210px 40px, #fff 50%, transparent 51%); background-size: 420px 300px; opacity: .7; animation-duration: 60s; }
.estrelas i:nth-child(3) { background-image: radial-gradient(2px 2px at 120px 200px, #a5b4fc 50%, transparent 51%), radial-gradient(2px 2px at 330px 80px, #fff 50%, transparent 51%); background-size: 520px 380px; opacity: .8; animation-duration: 40s; }
@keyframes deriva { from { transform: translateY(0); } to { transform: translateY(50%); } }
.expansao-conteudo { position: relative; z-index: 1; }
.mundos { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px; max-width: 1100px; margin: 0 auto; }
@media (max-width: 760px) { .mundos { grid-template-columns: minmax(0, 1fr); } }
.mundo { text-align: center; padding: 30px 22px; border-radius: 24px; background: rgba(255, 255, 255, .05); border: 1px solid rgba(199, 210, 254, .18); }
.mundo-orbe { display: block; width: 110px; height: 110px; margin: 0 auto 18px; border-radius: 50%; animation: flutua 6s ease-in-out infinite; }
.mundo:nth-child(2) .mundo-orbe { animation-delay: -2s; }
.mundo:nth-child(3) .mundo-orbe { animation-delay: -4s; }
@keyframes flutua { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.mundo-orbe.atlantida { background: radial-gradient(circle at 35% 30%, #a5f3fc, #0891b2 45%, #083344 80%); box-shadow: 0 0 50px rgba(34, 211, 238, .45); }
.mundo-orbe.espaco { background: radial-gradient(circle at 35% 30%, #fde68a, #f97316 40%, #7c2d12 80%); box-shadow: 0 0 50px rgba(251, 146, 60, .45), inset -12px -8px 0 rgba(0, 0, 0, .2); }
.mundo-orbe.multiverso { background: conic-gradient(from 0deg, #818cf8, #e879f9, #22d3ee, #818cf8); box-shadow: 0 0 60px rgba(167, 139, 250, .55); animation: flutua 6s ease-in-out -4s infinite, giraOrbe 12s linear infinite; }
@keyframes giraOrbe { to { rotate: 360deg; } }
.mundo h3 { font-family: var(--lc-titulo); font-size: 26px; font-weight: 600; }
.mundo p { margin: 8px 0 0; color: var(--lc-indigo-100); font-weight: 700; }
.expansao-selo { display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; margin: 36px 0 0; }

/* ---------- Chamada final ---------- */
.fim { position: relative; min-height: 80vh; display: grid; place-items: center; text-align: center; overflow: hidden; padding: 100px 20px; }
.fim-fundo { position: absolute; inset: -10%; background: url(/lenda-do-campinho/a/capa.webp) center / cover no-repeat; filter: saturate(1.1) brightness(.55); }
.fim-fundo::after { content: ""; position: absolute; inset: 0; background: radial-gradient(ellipse at center, rgba(13, 11, 38, .35), var(--lc-noite) 78%); }
.fim-conteudo { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 22px; }
.fim h2 { font-family: var(--lc-titulo); font-weight: 700; font-size: clamp(36px, 5vw, 72px); text-shadow: 0 6px 30px rgba(0, 0, 0, .6); }
.fim p { margin: 0; font-weight: 800; font-size: 19px; color: var(--lc-indigo-100); }

/* ---------- Imprensa ---------- */
.imprensa-grade { display: grid; grid-template-columns: minmax(0, 380px) minmax(0, 1fr); gap: 24px; max-width: 1200px; margin: 0 auto; align-items: start; }
@media (max-width: 900px) { .imprensa-grade { grid-template-columns: minmax(0, 1fr); } }
.imprensa .secao-cabeca { max-width: 1200px; margin-left: auto; margin-right: auto; }
.imprensa-ficha { padding: 26px; }
.imprensa h3 { font-family: var(--lc-titulo); font-weight: 600; font-size: 22px; }
.imprensa-ficha dl { margin: 16px 0 0; display: grid; grid-template-columns: auto 1fr; gap: 10px 16px; font-size: 15px; }
.imprensa-ficha dt { color: var(--lc-indigo-300); font-weight: 800; }
.imprensa-ficha dd { margin: 0; font-weight: 700; }
.imprensa-ficha dd a { color: var(--lc-ouro); }
.imprensa-textos { display: flex; flex-direction: column; gap: 18px; }
.texto-copiavel { padding: 22px 24px; }
.texto-cabeca { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 10px; }
.texto-copiavel p, .texto-longo { color: var(--lc-indigo-100); font-weight: 700; line-height: 1.65; margin: 0; }
.texto-longo p { margin: 0 0 10px; }
.texto-longo ul { margin: 0 0 10px; padding-left: 20px; }
.texto-longo strong { color: #fff; }
.imprensa-acoes { display: flex; flex-wrap: wrap; gap: 14px; }
.imprensa-contato { margin: 0; font-weight: 800; color: var(--lc-indigo-100); }
.imprensa-contato a { color: var(--lc-ouro); }

/* ---------- Rodapé ---------- */
.rodape { padding: 60px 20px 50px; text-align: center; border-top: 1px solid rgba(165, 180, 252, .12); color: var(--lc-indigo-200); font-weight: 700; font-size: 14px; }
.rodape img { width: 160px; margin: 0 auto 14px; opacity: .9; }
.rodape p { margin: 6px 0; }
.rodape-links a { color: var(--lc-indigo-100); text-decoration: underline; }

/* ---------- Reduzir movimento ---------- */
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .entra, .logo-grande.entra { opacity: 1; transform: none; animation: none; }
  .logo-grande::after, .desce i::after, .trailer-botao, .mundo-orbe, .estrelas i { animation: none !important; }
  .jornada { height: auto; }
  .jornada-fixa { position: relative; height: auto; padding: 90px 0; }
  .trilho { flex-direction: column; transform: none !important; }
  .etapa, .etapa:not(.ativa) { flex-basis: auto; opacity: 1; transform: none; }
  .etapa img { transform: none; }
  .destaque-corpo { transform: none !important; }
}
```

- [ ] **Step 5: `vitrine.js` (abertura, barra, jornada, cascata)**

Arquivo: `frontend/public/lenda/js/vitrine.js`
```js
/* Lenda do Campinho — vitrine (/lenda/). © 2026 Educação Gamer. Todos os direitos reservados. */
/* ============================================================
   VITRINE — liga a capa viva na abertura e cuida das seções: barra do topo
   (vidro ao rolar, menu no celular), jornada (rolagem presa no computador,
   faixa de arrastar no celular), entradas em cascata, destaques que
   inclinam no mouse, trailer que só baixa no clique, galeria em tela cheia,
   botões de copiar e a marca "já viu a vitrine" (o jogo não manda de novo).
   Expõe window.Vitrine com as contas puras (testadas em tests/lenda).
   ============================================================ */
(function (raiz) {
  'use strict';

  // Quanto da jornada já passou (0 a 1), pela posição da seção na tela.
  function progressoJornada(topo, alturaSecao, alturaTela) {
    const total = alturaSecao - alturaTela;
    if (!(total > 0)) return 0;
    return Math.min(1, Math.max(0, -topo / total));
  }
  function etapaAtiva(prog, n) { return n > 0 ? Math.min(n - 1, Math.max(0, Math.round(prog * (n - 1)))) : 0; }
  function proximoIndice(i, delta, n) { return n > 0 ? (((i + delta) % n) + n) % n : 0; }
  raiz.Vitrine = { progressoJornada, etapaAtiva, proximoIndice };
  if (typeof document === 'undefined') return;

  const doc = document, win = window;
  const reduz = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mouseFino = win.matchMedia('(pointer: fine)').matches;
  const $ = (s, r = doc) => r.querySelector(s);
  const $$ = (s, r = doc) => [...r.querySelectorAll(s)];
  const idioma = () => (doc.documentElement.lang === 'en' ? 'en' : 'pt');
  const texto = (k) => ((win.TEXTOS && win.TEXTOS[idioma()] && win.TEXTOS[idioma()][k]) || '');

  // Quem viu a vitrine não é mais mandado pra cá pelo jogo (js/vitrine_entrada.js).
  try { win.localStorage.setItem('lenda_vitrine_vista', '1'); } catch (e) { /* armazenamento bloqueado */ }

  // ---------- Abertura ----------
  const nav = $('#nav'), conteudo = $('#heroConteudo'), heroCapa = $('#heroCapa');
  const largo = () => win.innerWidth / win.innerHeight > 0.8;
  if (win.CapaViva) {
    win.CapaViva.monta(heroCapa, {
      horizontal: { src: '/lenda-do-campinho/a/capa.webp', bola: [76, 19], sol: [45, 77] },
      vertical: { src: '/lenda-do-campinho/a/capa_vertical.webp', bola: [70, 40.5], sol: [50, 70] },
      alt: heroCapa.dataset.alt || '',
      rolagem: true,
      aoQuadro: ({ mx, my }) => {
        if (!largo()) return;
        conteudo.style.setProperty('--mx', (mx * 10).toFixed(2) + 'px');
        conteudo.style.setProperty('--my', (my * 6).toFixed(2) + 'px');
      },
    });
  }

  // ---------- Barra do topo ----------
  const botaoMenu = $('#navMenu');
  const fechaMenu = () => { nav.classList.remove('aberta'); botaoMenu.setAttribute('aria-expanded', 'false'); };
  botaoMenu.addEventListener('click', () => botaoMenu.setAttribute('aria-expanded', String(nav.classList.toggle('aberta'))));
  $$('#navLinks a').forEach((a) => a.addEventListener('click', fechaMenu));
  doc.addEventListener('keydown', (e) => { if (e.key === 'Escape') fechaMenu(); });

  // ---------- Jornada ----------
  const secao = $('#jornada'), trilho = $('#trilho'), etapas = $$('.etapa', trilho);
  const fundo = $('#jornadaFundo'), regua = $('#regua'), marcos = $$('#marcos span');
  const presa = () => win.innerWidth >= 700 && !reduz;
  let ativaAntes = -1;
  function marcaEtapa(prog) {
    regua.style.width = (prog * 100).toFixed(2) + '%';
    const ativa = etapaAtiva(prog, etapas.length);
    if (ativa === ativaAntes) return;
    ativaAntes = ativa;
    etapas.forEach((e, i) => e.classList.toggle('ativa', i === ativa));
    marcos.forEach((m, i) => m.classList.toggle('feito', i <= ativa));
    fundo.style.background = `radial-gradient(ellipse at 70% 30%, ${etapas[ativa].dataset.cor}, transparent 70%)`;
  }
  function jornada() {
    if (!presa()) { trilho.style.transform = ''; if (reduz) etapas.forEach((e) => e.classList.add('ativa')); return; }
    const r = secao.getBoundingClientRect();
    const prog = progressoJornada(r.top, secao.offsetHeight, win.innerHeight);
    trilho.style.transform = `translateX(${(-prog * Math.max(0, trilho.scrollWidth - win.innerWidth)).toFixed(1)}px)`;
    marcaEtapa(prog);
  }
  trilho.addEventListener('scroll', () => {
    if (presa()) return;
    const max = trilho.scrollWidth - trilho.clientWidth;
    marcaEtapa(max > 0 ? trilho.scrollLeft / max : 0);
  }, { passive: true });

  // ---------- Rolagem ----------
  function aoRolar() {
    const rol = Math.min(1, win.scrollY / win.innerHeight);
    conteudo.style.setProperty('--rol', rol.toFixed(3));
    conteudo.style.opacity = String(Math.max(0, 1 - rol * 1.4));
    nav.classList.toggle('solida', win.scrollY > 40);
    jornada();
  }
  win.addEventListener('scroll', aoRolar, { passive: true });
  win.addEventListener('resize', aoRolar);
  aoRolar();
  if (!presa()) marcaEtapa(0);

  // ---------- Entradas em cascata ----------
  if ('IntersectionObserver' in win) {
    const io = new IntersectionObserver((ents) => {
      for (const e of ents) if (e.isIntersecting) { e.target.classList.add('lc-visivel'); io.unobserve(e.target); }
    }, { threshold: 0.15 });
    $$('.lc-entra').forEach((el) => io.observe(el));
  } else {
    $$('.lc-entra').forEach((el) => el.classList.add('lc-visivel'));
  }

  // Tarefa 4 completa daqui pra baixo (destaques, trailer, galeria, copiar).
  raiz.Vitrine.interno = { doc, win, $, $$, idioma, texto, reduz, mouseFino };
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 6: Rotas da Vercel e sitemap**

Em `frontend/vercel.json`:
- em `"redirects"`, depois da linha de `/lenda-do-campinho`, acrescentar:
  ```json
      { "source": "/lenda", "destination": "/lenda/", "permanent": false }
  ```
  (lembrar da vírgula no item anterior);
- em `"rewrites"`, logo depois de `{ "source": "/lenda-do-campinho/", "destination": "/lenda-do-campinho/index.html" },` acrescentar:
  ```json
      { "source": "/lenda/", "destination": "/lenda/index.html" },
  ```
- na regra de cache de arquivos, trocar `mp3|ogg|wav|woff|woff2` por `mp3|ogg|wav|woff|woff2|mp4|zip`.

Em `frontend/public/sitemap.xml`, copiar o bloco `<url>…</url>` de `https://www.educacaogamer.com.br/` (mesmo formato) e acrescentar um com `<loc>https://www.educacaogamer.com.br/lenda/</loc>` e `<lastmod>2026-10-06</lastmod>`.

Run: `node -e "JSON.parse(require('fs').readFileSync('frontend/vercel.json','utf8')); console.log('vercel.json ok')"`
Expected: `vercel.json ok`.

- [ ] **Step 7: Rodar os testes**

Run: `npm --prefix frontend test`
Expected: PASS — `# fail 0`.

- [ ] **Step 8: Conferir no navegador**

Servidor local: na pasta de trabalho da sessão, criar a configuração `lenda-site` em `.claude/launch.json` com `python -m http.server 5181 --directory C:/Users/gh0st/Projects/educacao-gamer-site/frontend/public` e abrir `http://localhost:5181/lenda/` (o `http.server` serve `index.html` de pastas).

Conferir em 1440×900 e 390×844:
- abertura igual à prévia aprovada (capa entrando, logo com quique, faíscas, botões, plataformas);
- no celular, o logo no céu e os botões embaixo, sem rolagem lateral;
- jornada: no computador prende a tela e anda de lado; no celular arrasta com o dedo e a régua acompanha;
- trailer, destaques, galeria, Expansão, chamada final, imprensa e rodapé aparecem (em cascata) com o conteúdo;
- console: só os 404 esperados de `textos.js` e `idioma.js`.

- [ ] **Step 9: Commit**

```bash
git add frontend/public/lenda/index.html frontend/public/lenda/css/vitrine.css frontend/public/lenda/js/vitrine.js frontend/tests/lenda/vitrine.test.js frontend/vercel.json frontend/public/sitemap.xml
git commit -m "Lenda: vitrine em /lenda/ — página completa, abertura com capa viva e jornada

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Vitrine — trailer, destaques, galeria e copiar

**Files:**
- Modify: `frontend/public/lenda/js/vitrine.js` (troca o último bloco)

**Interfaces:**
- Consumes: `Vitrine.proximoIndice`, os ids da Tarefa 3; evento `idioma` no `document` (Tarefa 5 dispara; até lá nunca acontece).
- Produces: nada novo para outras tarefas.

- [ ] **Step 1: Trocar o fim do `vitrine.js`**

Substituir as duas linhas

```js
  // Tarefa 4 completa daqui pra baixo (destaques, trailer, galeria, copiar).
  raiz.Vitrine.interno = { doc, win, $, $$, idioma, texto, reduz, mouseFino };
```

por:

```js
  // ---------- Destaques: inclinam seguindo o mouse ----------
  if (mouseFino && !reduz) {
    $$('.destaque').forEach((c) => {
      const corpo = $('.destaque-corpo', c);
      c.addEventListener('pointermove', (e) => {
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        corpo.style.setProperty('--rx', (-y * 8).toFixed(2) + 'deg');
        corpo.style.setProperty('--ry', (x * 10).toFixed(2) + 'deg');
        corpo.style.setProperty('--gx', ((x + 0.5) * 100).toFixed(1) + '%');
        corpo.style.setProperty('--gy', ((y + 0.5) * 100).toFixed(1) + '%');
      });
      c.addEventListener('pointerleave', () => { corpo.style.setProperty('--rx', '0deg'); corpo.style.setProperty('--ry', '0deg'); });
    });
  }

  // ---------- Trailer: o vídeo só é baixado no clique ----------
  const quadroTrailer = $('#trailerQuadro');
  const fonteTrailer = () => `video/trailer_${idioma()}.mp4`;
  $('#trailerPlay').addEventListener('click', () => {
    const v = doc.createElement('video');
    v.controls = true; v.playsInline = true; v.preload = 'auto'; v.poster = 'a/poster.webp'; v.src = fonteTrailer();
    quadroTrailer.replaceChildren(v);
    v.play().catch(() => { /* navegador bloqueou o play automático: fica o botão do player */ });
  });
  // Trocou o idioma com o vídeo parado: troca o trailer também.
  doc.addEventListener('idioma', () => { const v = $('video', quadroTrailer); if (v && v.paused) v.src = fonteTrailer(); });

  // ---------- Galeria em tela cheia ----------
  const fotos = $$('.galeria-item'), caixa = $('#caixaFoto'), imgGrande = $('#caixaFotoImg'), legenda = $('#caixaFotoLegenda');
  let atual = 0;
  function mostra(i) {
    atual = proximoIndice(i, 0, fotos.length);
    const f = fotos[atual];
    imgGrande.src = f.dataset.grande;
    imgGrande.alt = $('img', f).alt;
    legenda.textContent = $('.galeria-legenda', f).textContent;
  }
  fotos.forEach((f, i) => f.addEventListener('click', () => { mostra(i); caixa.showModal(); }));
  $('#caixaAnterior').addEventListener('click', () => mostra(atual - 1));
  $('#caixaProxima').addEventListener('click', () => mostra(atual + 1));
  $('#caixaFechar').addEventListener('click', () => caixa.close());
  caixa.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); mostra(atual - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); mostra(atual + 1); }
  });
  caixa.addEventListener('click', (e) => { if (e.target === caixa) caixa.close(); });
  let x0 = null;
  imgGrande.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
  imgGrande.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) mostra(atual + (dx < 0 ? 1 : -1));
  });

  // ---------- Copiar descrições (kit de imprensa) ----------
  $$('[data-copia]').forEach((b) => b.addEventListener('click', async () => {
    const alvo = doc.getElementById(b.dataset.copia);
    const txt = alvo.innerText.trim();
    try { await win.navigator.clipboard.writeText(txt); }
    catch (e) {
      const r = doc.createRange(); r.selectNodeContents(alvo);
      const s = win.getSelection(); s.removeAllRanges(); s.addRange(r); doc.execCommand('copy'); s.removeAllRanges();
    }
    b.textContent = texto('imp.copiado') || 'Copiado!';
    setTimeout(() => { b.textContent = texto('imp.copiar') || 'Copiar'; }, 1600);
  }));
```

- [ ] **Step 2: Testes**

Run: `npm --prefix frontend test`
Expected: PASS — `# fail 0` (o `proximoIndice` da galeria já está coberto em `vitrine.test.js`).

- [ ] **Step 3: Conferir no navegador** (`http://localhost:5181/lenda/`)

- Trailer: clicar no play abre o vídeo e toca, com som e controles.
- Destaques: com mouse, cada cartão inclina e ganha brilho dourado onde o mouse está.
- Galeria: clicar abre em tela cheia; setas na tela e no teclado (← →) passam e dão a volta nas pontas; Esc e clique fora fecham; em 390×844, arrastar a foto para o lado troca.
- Kit: "Copiar" muda para "Copiado!" e volta; colar num editor mostra o texto.
- Os downloads do ZIP, do logo e do Windows baixam o arquivo certo.

- [ ] **Step 4: Commit**

```bash
git add frontend/public/lenda/js/vitrine.js
git commit -m "Lenda: vitrine com trailer sob demanda, destaques que inclinam, galeria em tela cheia e copiar

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Vitrine — português e inglês

**Files:**
- Create: `frontend/public/lenda/js/textos.js`, `frontend/public/lenda/js/idioma.js`
- Test: `frontend/tests/lenda/idioma.test.js`

**Interfaces:**
- Consumes: atributos `data-t`, `data-t-html`, `data-t-alt`, `data-t-aria`, `[data-idioma]` do `index.html` (Tarefa 3).
- Produces: `window.TEXTOS = { pt: {chave: texto}, en: {chave: texto} }`; `window.Idioma = { IDIOMAS, inicial({param, salvo, navegador}) → 'pt'|'en', aplica(doc, textos, lang) }`; evento `idioma` (CustomEvent, `detail` = lang) no `document` a cada troca.

- [ ] **Step 1: Testes (vão falhar)**

Arquivo: `frontend/tests/lenda/idioma.test.js`
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { carrega, le } from "./util.js";

const { TEXTOS } = carrega("public/lenda/js/textos.js");
const { Idioma } = carrega("public/lenda/js/idioma.js");
const html = le("public/lenda/index.html");

const chavesDoHtml = () => {
  const ch = new Set();
  for (const m of html.matchAll(/data-t(?:-html|-alt|-aria)?="([^"]+)"/g)) ch.add(m[1]);
  return ch;
};

test("PT e EN têm exatamente as mesmas chaves, nenhuma vazia", () => {
  const pt = Object.keys(TEXTOS.pt).sort(), en = Object.keys(TEXTOS.en).sort();
  assert.deepEqual(en, pt);
  for (const lang of ["pt", "en"]) for (const [k, v] of Object.entries(TEXTOS[lang])) assert.ok(String(v).trim().length > 0, `${lang}.${k} vazio`);
});

test("toda chave usada no index.html existe no dicionário", () => {
  for (const k of chavesDoHtml()) assert.ok(k in TEXTOS.pt, `falta a chave ${k}`);
});

test("o texto em português do HTML é igual ao do dicionário (data-t simples)", () => {
  for (const m of html.matchAll(/data-t="([^"]+)"[^>]*>([^<]*)</g)) {
    const [, k, txt] = m;
    assert.equal(txt.replace(/\s+/g, " ").trim(), TEXTOS.pt[k], `HTML e dicionário diferentes em ${k}`);
  }
});

test("textos em inglês seguem os termos oficiais", () => {
  const tudo = Object.values(TEXTOS.en).join(" ");
  assert.match(tudo, /Campinho Village/);
  assert.match(tudo, /Sandlot League/);
  assert.match(tudo, /First Division/);
  assert.doesNotMatch(tudo, /Várzea|Primeirona|Vila do Campinho/);
});

test("Idioma.inicial: parâmetro > escolha salva > navegador > português", () => {
  assert.equal(Idioma.inicial({ param: "en", salvo: "pt", navegador: "pt-BR" }), "en");
  assert.equal(Idioma.inicial({ param: null, salvo: "en", navegador: "pt-BR" }), "en");
  assert.equal(Idioma.inicial({ param: "xx", salvo: null, navegador: "en-US" }), "en");
  assert.equal(Idioma.inicial({ param: null, salvo: null, navegador: "es-AR" }), "pt");
  assert.equal(Idioma.inicial({}), "pt");
  assert.equal(Idioma.inicial({ param: "EN" }), "en");
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm --prefix frontend test`
Expected: FAIL — `ENOENT ... textos.js`.

- [ ] **Step 3: `textos.js`**

Arquivo: `frontend/public/lenda/js/textos.js`
```js
/* Lenda do Campinho — vitrine (/lenda/). © 2026 Educação Gamer. Todos os direitos reservados. */
/* Textos da vitrine em português e inglês. As chaves são as mesmas dos
   atributos data-t* do index.html (o teste em tests/lenda confere).
   Inglês: termos oficiais em lenda-steam/i18n/termos_oficiais.md. */
(function (raiz) {
  'use strict';
  raiz.TEXTOS = {
    pt: {
      'meta.titulo': 'Lenda do Campinho — RPG de futebol grátis para toda a família',
      'nav.jornada': 'A jornada', 'nav.trailer': 'Trailer', 'nav.jogo': 'O jogo', 'nav.expansao': 'Expansão', 'nav.imprensa': 'Imprensa',
      'nav.jogar': 'Jogar grátis', 'nav.menu': 'Abrir menu',
      'hero.alt': 'Garoto dá uma bicicleta na bola enquanto chefões e um mundo fantástico aparecem ao fundo',
      'hero.gratis': 'Grátis', 'hero.selo': 'RPG de futebol para toda a família',
      'hero.frase': 'Do campinho de terra da vila até a <strong>Torre Infinita do Multiverso</strong>.<span class="so-largo"> Drible criaturas, vença chefões nas arenas e transforme um garoto do bairro em <strong>lenda do futebol</strong>.</span>',
      'hero.jogar': 'Jogar grátis no navegador', 'hero.baixar': 'Baixar para Windows', 'hero.navegador': 'Navegador',
      'hero.steam': 'Em breve na Steam', 'hero.rolar': 'Role para a jornada',
      'jor.sobre': 'A jornada', 'jor.titulo': 'Do campinho da vila<br>até <em>o mundo inteiro</em>',
      'jor.c1.num': 'CAPÍTULO 1', 'jor.c1.titulo': 'A Vila do Campinho', 'jor.c1.texto': 'Nasça na vila, faça amigos e dê os primeiros dribles no campinho de terra.',
      'jor.c2.num': 'CAPÍTULO 2', 'jor.c2.titulo': 'Uma história de verdade', 'jor.c2.texto': 'Capítulos com personagens, escolhas e missões que contam como um garoto vira craque.',
      'jor.c3.num': 'CAPÍTULO 3', 'jor.c3.titulo': 'Seu clube, sua carreira', 'jor.c3.texto': 'Funde o seu time, monte o elenco e suba da Várzea até a Primeirona.',
      'jor.c4.num': 'CAPÍTULO 4', 'jor.c4.titulo': 'Volta ao mundo', 'jor.c4.texto': 'Tóquio, Cairo, Londres, Paris, Buenos Aires — dezenas de cidades e áreas de caça.',
      'jor.c5.num': 'CAPÍTULO 5', 'jor.c5.titulo': 'Chefões nas arenas', 'jor.c5.texto': 'Terras de lava, guardiões gigantes e chefões que exigem time, equipamento e estratégia.',
      'jor.c6.num': 'CAPÍTULO 6', 'jor.c6.titulo': 'Além do mundo', 'jor.c6.texto': 'Atlântida, a Área Interestelar e o Multiverso esperam quem chegar ao topo.',
      'jor.m1': 'Vila', 'jor.m2': 'História', 'jor.m3': 'Clube', 'jor.m4': 'Mundo', 'jor.m5': 'Arenas', 'jor.m6': 'Multiverso',
      'tr.sobre': 'Trailer', 'tr.titulo': 'Veja a lenda em ação', 'tr.texto': 'Do campinho de terra ao Multiverso, em um minuto.', 'tr.assistir': 'Assistir ao trailer',
      'jg.sobre': 'O jogo', 'jg.titulo': 'Tudo o que cabe numa lenda',
      'jg.d1.titulo': 'RPG de verdade', 'jg.d1.texto': 'Suba de nível, aprenda dribles, escolha sua classe e monte seu equipamento.',
      'jg.d2.titulo': 'Mundo enorme', 'jg.d2.texto': 'A Vila, o Brasil, a Europa, Tóquio, o Cairo e muito mais: dezenas de áreas de caça.',
      'jg.d3.titulo': 'Carreira e clube', 'jg.d3.texto': 'Jogue temporadas pelo seu time, monte o elenco e dispute ligas pelo mundo.',
      'jg.d4.titulo': 'Agência de talentos', 'jg.d4.texto': 'Descubra garotos com futuro, cuide das famílias e transforme promessas em lendas.',
      'jg.d5.titulo': 'Para toda a família', 'jg.d5.texto': 'Sem sangue, sem palavrão e sem caixas de recompensa pagas.',
      'jg.d6.titulo': 'Grátis até o nível 195', 'jg.d6.texto': 'O jogo-base é completo e gratuito até o nível 195, no navegador ou no Windows.',
      'gal.sobre': 'Galeria', 'gal.titulo': 'Um mundo para explorar',
      'gal.f1': 'A Vila do Campinho', 'gal.f2': 'Tóquio — Distrito Neon', 'gal.f3': 'Terras de lava', 'gal.f4': 'Guardiões gigantes',
      'gal.f5': 'Capítulos da história', 'gal.f6': 'Seu clube', 'gal.f7': 'A agência de talentos', 'gal.f8': 'Onde sua lenda começa',
      'gal.fechar': 'Fechar', 'gal.anterior': 'Foto anterior', 'gal.proxima': 'Próxima foto',
      'exp.sobre': 'Expansão Fim de Jogo', 'exp.titulo': 'Além do nível 195',
      'exp.texto': 'Atlântida, a Área Interestelar e o Multiverso: do nível 195 ao 600+, com chefões, cidades e desafios novos.',
      'exp.a1.titulo': 'Atlântida', 'exp.a1.texto': 'Uma cidade inteira no fundo do mar.',
      'exp.a2.titulo': 'Área Interestelar', 'exp.a2.texto': 'Planetas, estações e a Copa Intergaláctica.',
      'exp.a3.titulo': 'Multiverso', 'exp.a3.texto': 'A Torre Infinita e chefões de outras dimensões.',
      'exp.niveis': 'Nível 195 → 600+',
      'fim.titulo': 'Comece sua lenda hoje', 'fim.texto': 'Grátis, no navegador ou no Windows.',
      'imp.sobre': 'Imprensa', 'imp.titulo': 'Kit de imprensa', 'imp.ficha': 'Ficha técnica',
      'imp.dev.rot': 'Desenvolvedor', 'imp.dist.rot': 'Distribuidora', 'imp.lanc.rot': 'Lançamento', 'imp.lanc': 'No navegador desde 2026 · Em breve na Steam',
      'imp.plat.rot': 'Plataformas', 'imp.plat': 'Navegador e Windows', 'imp.preco.rot': 'Preço', 'imp.preco': 'Grátis para jogar (até o nível 195)',
      'imp.idiomas.rot': 'Idiomas', 'imp.idiomas': 'Português e inglês', 'imp.genero.rot': 'Gênero', 'imp.genero': 'RPG, futebol, aventura, para toda a família',
      'imp.curta.titulo': 'Descrição curta',
      'imp.curta': 'Um RPG de futebol para toda a família! Comece no campinho da vila, drible criaturas, enfrente chefões nas arenas, jogue a temporada pelo seu clube e viaje pelo mundo inteiro. Grátis para jogar, em português e inglês.',
      'imp.longa.titulo': 'Descrição longa',
      'imp.longa': '<p>Do campinho de terra da vila até a Torre Infinita do Multiverso: no <strong>Lenda do Campinho</strong> você é um garoto (ou garota) que sonha em virar lenda do futebol — e a bola é a sua arma para driblar criaturas, vencer chefões e conquistar o mundo.</p><ul><li><strong>RPG de verdade:</strong> suba de nível, aprenda dribles, escolha a sua classe e monte o seu equipamento.</li><li><strong>Mundo enorme:</strong> a Vila, a Cidade, o Brasil, a Europa, Tóquio, o Cairo, Londres e muito mais — dezenas de áreas de caça e chefões nas arenas.</li><li><strong>Carreira e Clube:</strong> jogue temporadas pelo seu time, monte o elenco e dispute ligas pelo mundo.</li><li><strong>Agência:</strong> descubra talentos, cuide das famílias e transforme garotos em lendas.</li><li><strong>Para toda a família:</strong> sem sangue, sem palavrão, sem caixas de recompensa pagas.</li></ul><p>O jogo-base é <strong>gratuito e completo até o nível 195</strong>. Quem quiser ir além encontra a <strong>Expansão Fim de Jogo</strong> — Atlântida, a Área Interestelar e o Multiverso — e pacotes opcionais de visual.</p>',
      'imp.copiar': 'Copiar', 'imp.copiado': 'Copiado!', 'imp.kit': 'Baixar kit completo (ZIP)', 'imp.logo': 'Logo (PNG)', 'imp.contato': 'Imprensa e parcerias:',
      'rod.direitos': '© 2026 Educação Gamer. Todos os direitos reservados.', 'rod.privacidade': 'Direitos autorais e privacidade', 'rod.voltar': 'Voltar ao Educação Gamer',
    },
    en: {
      'meta.titulo': 'Lenda do Campinho — a free soccer RPG for the whole family',
      'nav.jornada': 'The journey', 'nav.trailer': 'Trailer', 'nav.jogo': 'The game', 'nav.expansao': 'Expansion', 'nav.imprensa': 'Press',
      'nav.jogar': 'Play free', 'nav.menu': 'Open menu',
      'hero.alt': 'A kid does a bicycle kick while bosses and a fantastic world appear in the background',
      'hero.gratis': 'Free', 'hero.selo': 'A soccer RPG for the whole family',
      'hero.frase': 'From the village dirt pitch to the <strong>Infinite Tower of the Multiverse</strong>.<span class="so-largo"> Dribble past creatures, beat bosses in the arenas and turn a neighborhood kid into a <strong>soccer legend</strong>.</span>',
      'hero.jogar': 'Play free in your browser', 'hero.baixar': 'Download for Windows', 'hero.navegador': 'Browser',
      'hero.steam': 'Coming soon to Steam', 'hero.rolar': 'Scroll to the journey',
      'jor.sobre': 'The journey', 'jor.titulo': 'From the village pitch<br>to <em>the whole world</em>',
      'jor.c1.num': 'CHAPTER 1', 'jor.c1.titulo': 'Campinho Village', 'jor.c1.texto': 'Be born in the village, make friends and pull off your first dribbles on the dirt pitch.',
      'jor.c2.num': 'CHAPTER 2', 'jor.c2.titulo': 'A real story', 'jor.c2.texto': 'Chapters with characters, choices and missions that tell how a kid becomes a star.',
      'jor.c3.num': 'CHAPTER 3', 'jor.c3.titulo': 'Your club, your career', 'jor.c3.texto': 'Found your own team, build the squad and climb from the Sandlot League to the First Division.',
      'jor.c4.num': 'CHAPTER 4', 'jor.c4.titulo': 'Around the world', 'jor.c4.texto': 'Tokyo, Cairo, London, Paris, Buenos Aires — dozens of cities and hunting grounds.',
      'jor.c5.num': 'CHAPTER 5', 'jor.c5.titulo': 'Bosses in the arenas', 'jor.c5.texto': 'Lava lands, giant guardians and bosses that call for a team, gear and strategy.',
      'jor.c6.num': 'CHAPTER 6', 'jor.c6.titulo': 'Beyond the world', 'jor.c6.texto': 'Atlantis, the Interstellar Zone and the Multiverse await those who reach the top.',
      'jor.m1': 'Village', 'jor.m2': 'Story', 'jor.m3': 'Club', 'jor.m4': 'World', 'jor.m5': 'Arenas', 'jor.m6': 'Multiverse',
      'tr.sobre': 'Trailer', 'tr.titulo': 'See the legend in action', 'tr.texto': 'From the dirt pitch to the Multiverse, in one minute.', 'tr.assistir': 'Watch the trailer',
      'jg.sobre': 'The game', 'jg.titulo': 'Everything a legend needs',
      'jg.d1.titulo': 'A real RPG', 'jg.d1.texto': 'Level up, learn dribbles, choose your class and build your gear.',
      'jg.d2.titulo': 'A huge world', 'jg.d2.texto': 'The Village, Brazil, Europe, Tokyo, Cairo and much more: dozens of hunting grounds.',
      'jg.d3.titulo': 'Career and club', 'jg.d3.texto': 'Play seasons for your team, build the squad and compete in leagues around the world.',
      'jg.d4.titulo': 'Talent agency', 'jg.d4.texto': 'Scout kids with a future, look after their families and turn prospects into legends.',
      'jg.d5.titulo': 'For the whole family', 'jg.d5.texto': 'No blood, no swearing and no paid loot boxes.',
      'jg.d6.titulo': 'Free up to level 195', 'jg.d6.texto': 'The base game is complete and free up to level 195, in your browser or on Windows.',
      'gal.sobre': 'Gallery', 'gal.titulo': 'A world to explore',
      'gal.f1': 'Campinho Village', 'gal.f2': 'Tokyo — Neon District', 'gal.f3': 'Lava lands', 'gal.f4': 'Giant guardians',
      'gal.f5': 'Story chapters', 'gal.f6': 'Your club', 'gal.f7': 'The talent agency', 'gal.f8': 'Where your legend begins',
      'gal.fechar': 'Close', 'gal.anterior': 'Previous photo', 'gal.proxima': 'Next photo',
      'exp.sobre': 'Endgame Expansion', 'exp.titulo': 'Beyond level 195',
      'exp.texto': 'Atlantis, the Interstellar Zone and the Multiverse: from level 195 to 600+, with new bosses, cities and challenges.',
      'exp.a1.titulo': 'Atlantis', 'exp.a1.texto': 'A whole city at the bottom of the sea.',
      'exp.a2.titulo': 'Interstellar Zone', 'exp.a2.texto': 'Planets, stations and the Intergalactic Cup.',
      'exp.a3.titulo': 'Multiverse', 'exp.a3.texto': 'The Infinite Tower and bosses from other dimensions.',
      'exp.niveis': 'Level 195 → 600+',
      'fim.titulo': 'Start your legend today', 'fim.texto': 'Free, in your browser or on Windows.',
      'imp.sobre': 'Press', 'imp.titulo': 'Press kit', 'imp.ficha': 'Fact sheet',
      'imp.dev.rot': 'Developer', 'imp.dist.rot': 'Publisher', 'imp.lanc.rot': 'Release', 'imp.lanc': 'In the browser since 2026 · Coming soon to Steam',
      'imp.plat.rot': 'Platforms', 'imp.plat': 'Browser and Windows', 'imp.preco.rot': 'Price', 'imp.preco': 'Free to play (up to level 195)',
      'imp.idiomas.rot': 'Languages', 'imp.idiomas': 'Portuguese and English', 'imp.genero.rot': 'Genre', 'imp.genero': 'RPG, soccer, adventure, for the whole family',
      'imp.curta.titulo': 'Short description',
      'imp.curta': 'A soccer RPG for the whole family! Start on the village dirt pitch, dribble past creatures, face bosses in the arenas, play the season for your club and travel the whole world. Free to play, in Portuguese and English.',
      'imp.longa.titulo': 'Long description',
      'imp.longa': '<p>From the village dirt pitch to the Infinite Tower of the Multiverse: in <strong>Lenda do Campinho</strong> you are a boy (or girl) who dreams of becoming a soccer legend — and the ball is your weapon to dribble past creatures, beat bosses and conquer the world.</p><ul><li><strong>A real RPG:</strong> level up, learn dribbles, choose your class and build your gear.</li><li><strong>A huge world:</strong> the Village, the City, Brazil, Europe, Tokyo, Cairo, London and much more — dozens of hunting grounds and bosses in the arenas.</li><li><strong>Career and Club:</strong> play seasons for your team, build the squad and compete in leagues around the world.</li><li><strong>Agency:</strong> scout talent, look after families and turn kids into legends.</li><li><strong>For the whole family:</strong> no blood, no swearing, no paid loot boxes.</li></ul><p>The base game is <strong>free and complete up to level 195</strong>. Those who want to go further will find the <strong>Endgame Expansion</strong> — Atlantis, the Interstellar Zone and the Multiverse — and optional cosmetic packs.</p>',
      'imp.copiar': 'Copy', 'imp.copiado': 'Copied!', 'imp.kit': 'Download full kit (ZIP)', 'imp.logo': 'Logo (PNG)', 'imp.contato': 'Press and partnerships:',
      'rod.direitos': '© 2026 Educação Gamer. All rights reserved.', 'rod.privacidade': 'Copyright and privacy', 'rod.voltar': 'Back to Educação Gamer',
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 4: `idioma.js`**

Arquivo: `frontend/public/lenda/js/idioma.js`
```js
/* Lenda do Campinho — vitrine (/lenda/). © 2026 Educação Gamer. Todos os direitos reservados. */
/* Idioma da vitrine (PT/EN): escolhe o inicial (?lang= > escolha salva >
   idioma do navegador > português), aplica os textos de window.TEXTOS nos
   elementos marcados com data-t* e troca pelo botão PT/EN sem recarregar.
   Avisa a página com o evento "idioma" (o trailer troca de língua). */
(function (raiz) {
  'use strict';
  const IDIOMAS = ['pt', 'en'];
  function inicial(op) {
    const o = op || {};
    for (const v of [o.param, o.salvo]) { const c = String(v || '').toLowerCase(); if (IDIOMAS.includes(c)) return c; }
    return /^en\b/i.test(String(o.navegador || '')) ? 'en' : 'pt';
  }
  function aplica(doc, textos, lang) {
    const T = (textos && textos[lang]) || (textos && textos.pt) || {};
    doc.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
    const cada = (attr, fn) => doc.querySelectorAll(`[${attr}]`).forEach((el) => { const v = T[el.getAttribute(attr)]; if (v != null) fn(el, v); });
    cada('data-t', (el, v) => { el.textContent = v; });
    cada('data-t-html', (el, v) => { el.innerHTML = v; });
    cada('data-t-alt', (el, v) => { if (el.tagName === 'IMG') el.alt = v; else el.dataset.alt = v; });
    cada('data-t-aria', (el, v) => { el.setAttribute('aria-label', v); });
    if (T['meta.titulo']) doc.title = T['meta.titulo'];
    doc.querySelectorAll('[data-idioma]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.idioma === lang)));
    doc.dispatchEvent(new doc.defaultView.CustomEvent('idioma', { detail: lang }));
  }
  raiz.Idioma = { IDIOMAS, inicial, aplica };
  if (typeof document === 'undefined') return;

  let salvo = null;
  try { salvo = localStorage.getItem('lenda_idioma'); } catch (e) { /* armazenamento bloqueado */ }
  const param = new URLSearchParams(location.search).get('lang');
  aplica(document, raiz.TEXTOS, inicial({ param, salvo, navegador: navigator.language }));
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-idioma]');
    if (!b) return;
    try { localStorage.setItem('lenda_idioma', b.dataset.idioma); } catch (er) { /* sem memória */ }
    aplica(document, raiz.TEXTOS, b.dataset.idioma);
  });
})(typeof window !== 'undefined' ? window : globalThis);
```

A capa viva usa `heroCapa.dataset.alt`, e o `idioma.js` roda antes do `vitrine.js`, então o texto alternativo da capa já sai no idioma certo.

- [ ] **Step 5: Rodar e ver passar**

Run: `npm --prefix frontend test`
Expected: PASS — `# fail 0`. Se o teste "texto em português do HTML é igual" apontar diferença, corrigir o **HTML** (o dicionário é a fonte).

- [ ] **Step 6: Conferir no navegador**

Abrir `http://localhost:5181/lenda/`, clicar EN: todos os textos, o título da aba, os rótulos das setas da galeria e o texto de "Copiar" mudam; recarregar continua em EN; `?lang=pt` força português. Com o trailer parado, trocar o idioma e dar play toca o trailer da outra língua. Console sem erros.

- [ ] **Step 7: Commit**

```bash
git add frontend/public/lenda/js/textos.js frontend/public/lenda/js/idioma.js frontend/tests/lenda/idioma.test.js frontend/public/lenda/index.html
git commit -m "Lenda: vitrine em português e inglês (botão PT/EN, termos oficiais)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Tela inicial do jogo no padrão da vitrine

**Files:**
- Modify: `frontend/public/lenda-do-campinho/index.html` (liga `marca.css` e `capa_viva.js`)
- Modify: `frontend/public/lenda-do-campinho/js/inicio.js`
- Modify: `frontend/public/lenda-do-campinho/css/inicio.css` (reescrito)
- Test: `frontend/tests/lenda/contrato_inicio.test.js`, `frontend/tests/lenda/steam.test.js`

**Interfaces:**
- Consumes: `CapaViva.monta`, `marca.css` (Tarefa 2), `a/capa.webp`, `a/capa_vertical.webp` (Tarefa 1).
- Produces: `#btnConhecaJogo` (só na web) → `/lenda/`; classes `lc-btn lc-btn-ouro|lc-btn-vidro` em `#btnContinuar`, `#btnNovo`, `#btnNascer`, `#btnVoltar`; `.ini-capa` dentro de `#inicio`.

- [ ] **Step 1: Testes de contrato e da versão Steam (contrato vai falhar)**

Arquivo: `frontend/tests/lenda/contrato_inicio.test.js`
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { le, RAIZ } from "./util.js";

const html = le("public/lenda-do-campinho/index.html");
const inicioJs = le("public/lenda-do-campinho/js/inicio.js");
const IDS = ["inicio", "inicioMenu", "btnContinuar", "btnNovo", "btnHistoria", "resumoSave", "criacao", "retratoCriacao", "inpNome",
  "opCorpo", "opPele", "opCabelo", "opCorCabelo", "opRoupa", "opBaixo", "opRosto", "opClasse", "btnVoltar", "btnNascer"];

test("contrato: todos os ids da tela inicial e da criação continuam no index.html", () => {
  for (const id of IDS) assert.match(html, new RegExp(`id="${id}"`), `sumiu o #${id}`);
  assert.match(html, /class="inicio-caixa/);
  assert.match(html, /data-abre="ranking"/);
  assert.match(html, /data-abre="ajuda"/);
});

test("contrato: o inicio.js continua organizando os mesmos blocos", () => {
  for (const trecho of ["btnContinuar", "btnNovo", "#contaEscolha", ".cad-cartao, .nuvem-caixa", ".portal-barra", "resumoSave"]) {
    assert.ok(inicioJs.includes(trecho), `o inicio.js não cita mais ${trecho}`);
  }
});

test("a base visual e a capa viva vêm antes da tela inicial", () => {
  const marca = html.indexOf("css/marca.css"), inicioCss = html.indexOf("css/inicio.css");
  const capa = html.indexOf("js/capa_viva.js"), inicioScript = html.indexOf("js/inicio.js");
  assert.ok(marca > 0 && marca < inicioCss, "marca.css tem de vir antes de inicio.css");
  assert.ok(capa > 0 && capa < inicioScript, "capa_viva.js tem de vir antes de inicio.js");
  for (const a of ["a/capa.webp", "a/capa_vertical.webp"]) assert.ok(existsSync(path.join(RAIZ, "public/lenda-do-campinho", a)), `falta ${a}`);
});

test("o link pra vitrine só aparece na web (a versão Steam não tem /lenda/)", () => {
  assert.match(inicioJs, /btnConhecaJogo/);
  assert.match(inicioJs, /naWeb\s*&&/);
});
```

Arquivo: `frontend/tests/lenda/steam.test.js`
```js
// A versão Steam (lenda-steam/ferramentas/monta_steam.mjs) não aceita nada
// vindo da internet no index.html, além das fontes e da marca que ela troca
// por arquivos locais. Mesma regra aqui, pra pegar o problema antes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { le } from "./util.js";

test("index.html do jogo passa na checagem da versão Steam", () => {
  const h = le("public/lenda-do-campinho/index.html")
    .replace(/<link rel="preconnect" href="https:\/\/fonts\.(googleapis|gstatic)\.com"[^>]*>\s*/g, "")
    .replace(/<link href="https:\/\/fonts\.googleapis\.com\/css2[^"]*" rel="stylesheet">/, '<link href="fontes/fontes.css" rel="stylesheet">')
    .replace(/https:\/\/www\.educacaogamer\.com\.br\/favicon\.png/g, "marca/favicon.png")
    .replace(/https:\/\/www\.educacaogamer\.com\.br\/educacao-gamer-logo\.png/g, "marca/educacao-gamer-logo.png");
  assert.doesNotMatch(h, /fonts\.googleapis|fonts\.gstatic|educacaogamer\.com\.br\/[^"]*\.(png|jpg|webp|css|js)/);
});

test("marca.css e capa_viva.js não buscam nada da internet", () => {
  for (const f of ["public/lenda-do-campinho/css/marca.css", "public/lenda-do-campinho/js/capa_viva.js"]) {
    assert.doesNotMatch(le(f), /https?:\/\//, `${f} cita um endereço da internet`);
  }
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm --prefix frontend test`
Expected: FAIL — "marca.css tem de vir antes de inicio.css" e "o inicio.js não cita ... btnConhecaJogo" / `naWeb`. (Os testes da Steam passam: são uma trava.)

- [ ] **Step 3: Ligar os arquivos no `index.html` do jogo**

Em `frontend/public/lenda-do-campinho/index.html`:
- trocar `<link rel="stylesheet" href="css/inicio.css?v=406">` por
  ```html
  <link rel="stylesheet" href="css/marca.css?v=406">
  <link rel="stylesheet" href="css/inicio.css?v=406">
  ```
- trocar `<script src="js/inicio.js?v=406"></script>` por
  ```html
  <script src="js/capa_viva.js?v=406"></script>
  <script src="js/inicio.js?v=406"></script>
  ```

- [ ] **Step 4: Mudanças no `inicio.js`**

Em `frontend/public/lenda-do-campinho/js/inicio.js`:

1. Trocar o comentário do topo (linhas 3–12) por:
```js
/* ============================================================
   TELA INICIAL (padrão da vitrine /lenda/, 2026-10): capa viva ao fundo
   (js/capa_viva.js), logo grande à esquerda e um painel de vidro à direita:
   - avisos (conta, save na nuvem, qual personagem usar);
   - cartão do jogador (retrato, nome, nível, onde parou) + Continuar;
   - atalhos em blocos (História, Ranking, Como jogar, Wiki...).
   Não cria botões do jogo: REORGANIZA os que o jogo e os outros arquivos
   já colocam em #inicioMenu (e continua arrumando os que chegarem depois).
   O único botão novo é "Conheça o jogo" (vitrine), e só no site.
   Carregar por ÚLTIMO (depois de todos que mexem na tela inicial).
   ============================================================ */
```

2. Logo depois de `ini.classList.add('ini-v2');` acrescentar:
```js
  // Capa viva ao fundo (a mesma da vitrine): arte animada no lugar da imagem
  // parada. Para sozinha quando #inicio some (o jogo começou).
  const capa = el('div', { class: 'ini-capa' }); ini.prepend(capa);
  if (window.CapaViva) CapaViva.monta(capa, {
    horizontal: { src: 'a/capa.webp', bola: [76, 19], sol: [45, 77] },
    vertical: { src: 'a/capa_vertical.webp', bola: [70, 40.5], sol: [50, 70] },
  });
  // Botões de criação no estilo novo (dourado = ação principal).
  for (const [id, estilo] of [['btnNascer', 'lc-btn-ouro'], ['btnVoltar', 'lc-btn-vidro']]) {
    const b = document.getElementById(id); if (b) { b.classList.remove('amarelo', 'grande'); b.classList.add('lc-btn', estilo); }
  }
```

3. Na lista `TILE`, depois da linha de `#btnAppWin`, acrescentar:
```js
    ['#btnConhecaJogo', '🌟', 'Conheça o jogo', 'trailer e galeria'],
```

4. Em `atualizaCartao`, logo depois de `cartao.classList.toggle('tem-save', tem);` acrescentar:
```js
    // Continuar sempre dourado; "Criar" dourado só pra quem ainda não tem jogador.
    if (cont) { cont.classList.remove('amarelo', 'grande'); cont.classList.add('lc-btn', 'lc-btn-ouro'); }
    if (novo) { novo.classList.remove('amarelo', 'grande'); novo.classList.add('lc-btn'); novo.classList.toggle('lc-btn-ouro', !tem); novo.classList.toggle('lc-btn-vidro', tem); }
```

5. Em `arruma`, trocar `else if (c.tagName === 'BUTTON') { fazTile(c); tiles.append(c); }` por:
```js
      else if (c.tagName === 'BUTTON') { fazTile(c); c.style.setProperty('--i', String(tiles.children.length)); tiles.append(c); }
```

6. Logo antes de `new MutationObserver(arruma).observe(menu, { childList: true });` acrescentar:
```js
  // "Conheça o jogo" → vitrine (/lenda/). Só no site: a versão Steam não tem essa página.
  const naWeb = /^https?:$/.test(location.protocol) && /^(www\.)?educacaogamer\.com\.br$|^localhost$|^127\.0\.0\.1$/.test(location.hostname);
  if (naWeb && !document.getElementById('btnConhecaJogo')) menu.append(el('button', { class: 'btn', id: 'btnConhecaJogo', type: 'button', onclick: () => { location.href = '/lenda/'; } }, '🌟 Conheça o jogo'));
  // Blocos que inclinam seguindo o mouse (só com mouse e sem "reduzir movimento").
  if (matchMedia('(pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    tiles.addEventListener('pointermove', (e) => {
      const t = e.target.closest('.ini-tile'); if (!t) return;
      const r = t.getBoundingClientRect();
      t.style.setProperty('--rx', (((e.clientY - r.top) / r.height - 0.5) * -10).toFixed(1) + 'deg');
      t.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 12).toFixed(1) + 'deg');
    });
    tiles.addEventListener('pointerout', (e) => {
      const t = e.target.closest('.ini-tile');
      if (t && !t.contains(e.relatedTarget)) { t.style.setProperty('--rx', '0deg'); t.style.setProperty('--ry', '0deg'); }
    });
  }
```

- [ ] **Step 5: Reescrever `inicio.css`**

Arquivo: `frontend/public/lenda-do-campinho/css/inicio.css`
```css
/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   TELA INICIAL (js/inicio.js) no padrão da vitrine /lenda/: capa viva ao
   fundo, logo à esquerda, painel de vidro à direita (avisos, cartão do
   jogador, blocos "Explore") e a criação de personagem em vidro.
   Cores, botões e capa viva: css/marca.css. Os estilos de .chip e
   .card-classe só mudam dentro de #criacao (as mesmas classes aparecem
   dentro do jogo e lá ficam como estão).
   ============================================================ */
#inicio.ini-v2 { position: relative; isolation: isolate; align-items: center; padding: 14px 18px 18px; background: var(--lc-noite); font-family: var(--lc-texto); }
.ini-v2 .ini-capa.capa-viva { position: fixed; inset: 0; z-index: -2; }
#inicio.ini-v2::before { content: ""; position: fixed; inset: 0; z-index: -1; pointer-events: none; transition: background .6s ease;
  background: linear-gradient(90deg, rgba(13, 11, 38, 0) 28%, rgba(13, 11, 38, .5) 60%, rgba(13, 11, 38, .82) 100%),
              linear-gradient(0deg, rgba(13, 11, 38, .85) 0%, rgba(13, 11, 38, 0) 30%),
              linear-gradient(180deg, rgba(13, 11, 38, .5) 0%, rgba(13, 11, 38, 0) 18%); }
#inicio.ini-v2 .inicio-caixa {
  width: min(1240px, 100%); padding: 0; background: transparent; border: 0; box-shadow: none; border-radius: 0;
  display: grid; grid-template-columns: minmax(0, 1fr) minmax(360px, 460px); grid-template-areas: "barra barra" "topo menu" "rodape rodape";
  gap: 14px 44px; align-items: center;
}
/* barra do portal (Voltar ao Educação Gamer · Entrar na conta) em vidro */
.ini-v2 .ini-barra { grid-area: barra; min-height: 8px; }
.ini-v2 .ini-barra .portal-barra { margin: 0; }
.ini-v2 .ini-barra .portal-barra .btn, .ini-v2 .ini-barra .portal-quem { background: rgba(13, 11, 38, .55); color: #fff; border: 1px solid rgba(165, 180, 252, .3); border-radius: 999px; padding: 6px 14px; font-family: var(--lc-texto); font-weight: 800; font-size: 13px; text-shadow: none; box-shadow: 0 6px 16px rgba(0, 0, 0, .3); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.ini-v2 .ini-barra .portal-quem b { color: var(--lc-ouro); }
/* logo e frase */
.ini-v2 .inicio-topo { grid-area: topo; text-align: center; align-self: center; }
.ini-v2 .logo-eg { height: 44px; filter: drop-shadow(0 2px 6px rgba(0, 0, 0, .6)); }
.ini-v2 .logo-jogo { position: relative; width: min(600px, 96%) !important; margin: 4px auto 12px !important; filter: drop-shadow(0 18px 30px rgba(0, 0, 0, .55)); animation: iniLogoCai 1.15s cubic-bezier(.34, 1.56, .64, 1) .3s both; }
.ini-v2 .logo-jogo img { width: 100%; height: auto; display: block; }
.ini-v2 .logo-jogo::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(105deg, transparent 35%, rgba(255, 255, 255, .85) 50%, transparent 65%); background-size: 250% 100%; background-position: 150% 0; -webkit-mask: url(../a/logo_jogo.webp) center / contain no-repeat; mask: url(../a/logo_jogo.webp) center / contain no-repeat; mix-blend-mode: overlay; animation: iniReflexo 6s ease-in-out 2.4s infinite; }
@keyframes iniLogoCai { 0% { opacity: 0; transform: translateY(-40px) scale(.8) rotate(-3deg); } 60% { opacity: 1; } 100% { opacity: 1; transform: none; } }
@keyframes iniReflexo { 0%, 60% { background-position: 150% 0; } 100% { background-position: -50% 0; } }
.ini-v2 .sub { display: block; max-width: 560px; margin: 0 auto 8px; padding: 0; background: none; box-shadow: none; color: #eef0ff; font-size: 18px; font-weight: 700; line-height: 1.5; text-shadow: 0 2px 12px rgba(0, 0, 0, .7); }
.ini-v2 .aviso-beta { display: inline-block; max-width: 520px; margin: 6px auto 0; font-size: 12px; padding: 5px 12px; border-radius: 999px; border: 1px solid rgba(255, 201, 40, .45); background: rgba(13, 11, 38, .55); color: var(--lc-indigo-100); }
/* painel de vidro */
.ini-v2 .inicio-menu {
  grid-area: menu; display: flex; flex-direction: column; align-items: stretch; gap: 14px; padding: 18px;
  background: var(--lc-vidro); color: #fff; border: 1px solid var(--lc-vidro-borda); border-radius: 24px;
  backdrop-filter: blur(16px) saturate(140%); -webkit-backdrop-filter: blur(16px) saturate(140%);
  box-shadow: 0 24px 60px rgba(0, 0, 0, .45), inset 0 1px 0 rgba(255, 255, 255, .08);
  animation: iniSobe .9s var(--lc-mola) .5s both;
}
@keyframes iniSobe { from { opacity: 0; translate: 0 24px; } to { opacity: 1; translate: 0 0; } }
.ini-v2 .inicio-menu .btn { min-width: 0; }
.ini-v2 .inicio-menu[hidden] { display: none; }
/* avisos (conta, nuvem, escolha de save) */
.ini-avisos { display: flex; flex-direction: column; gap: 8px; }
.ini-avisos[hidden] { display: none; }
.ini-v2 .ini-avisos .cad-cartao, .ini-v2 .ini-avisos .nuvem-caixa { margin: 0; background: rgba(255, 201, 40, .1); border: 1px solid rgba(255, 201, 40, .38); border-radius: 16px; color: #fff; box-shadow: none; }
.ini-v2 .ini-avisos .btn { background: rgba(255, 255, 255, .12); color: #fff; border: 1px solid rgba(255, 255, 255, .3); border-radius: 12px; text-shadow: none; box-shadow: none; }
/* cartão do jogador */
.ini-cartao { display: flex; flex-direction: column; gap: 10px; padding: 14px; color: #fff; border-radius: 18px; background: linear-gradient(135deg, rgba(79, 70, 229, .55), rgba(49, 46, 129, .72)); border: 1px solid rgba(165, 180, 252, .35); box-shadow: inset 0 1px 0 rgba(255, 255, 255, .12); }
.ini-cartao-topo { display: flex; gap: 14px; align-items: center; }
.ini-retrato { position: relative; width: 82px; height: 110px; flex-shrink: 0; border-radius: 14px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at 50% 35%, #6ad86a, #2e8a3a 70%); border: 3px solid var(--lc-ouro); box-shadow: 0 0 24px rgba(255, 201, 40, .35); }
.ini-retrato canvas { width: 100%; height: 100%; object-fit: contain; }
.ini-bola { font-size: 44px; animation: iniQuica 1.4s ease-in-out infinite; }
@keyframes iniQuica { 0%, 100% { transform: translateY(6px) rotate(0); } 50% { transform: translateY(-8px) rotate(180deg); } }
.ini-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; font-weight: 700; font-size: 13.5px; color: var(--lc-indigo-100); }
.ini-info small { font-size: 11px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; color: var(--lc-ouro); }
.ini-info .ini-nome { font-family: var(--lc-titulo); font-weight: 600; font-size: 24px; line-height: 1.1; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ini-info .ini-nivel { color: var(--lc-ouro-claro); font-size: 15px; }
.ini-cartao .lc-btn { width: 100%; }
.ini-cartao #btnContinuar { height: 58px; font-size: 22px; }
.ini-cartao.tem-save #btnNovo { height: 40px; font-size: 15px; }
.ini-cartao:not(.tem-save) #btnNovo { height: 58px; font-size: 21px; }
/* blocos "Explore" */
.ini-titulo { margin: 2px 0 -4px; font-size: 12px; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; color: var(--lc-indigo-300); }
.ini-tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; perspective: 700px; }
.ini-tiles #btnHistoria { grid-column: span 2; }
.btn.ini-tile { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; padding: 9px 6px 8px; min-height: 80px; border-radius: 16px; color: #fff; text-shadow: none; background: rgba(255, 255, 255, .07); border: 1px solid rgba(165, 180, 252, .2); box-shadow: none;
  transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)); transition: transform .25s ease, border-color .2s, background .2s, translate .2s;
  animation: iniSobe .7s var(--lc-mola) backwards; animation-delay: calc(var(--i, 0) * 70ms + .7s); }
.btn.ini-tile:hover { translate: 0 -3px; filter: none; border-color: rgba(255, 201, 40, .6); background: rgba(255, 201, 40, .1); }
.btn.ini-tile:active { translate: 0 1px; }
.ini-tile .ini-ic { font-size: 24px; line-height: 1.1; }
.ini-tile b { font-family: var(--lc-titulo); font-weight: 600; font-size: 14px; }
.ini-tile small { font-size: 11px; font-weight: 700; color: var(--lc-indigo-200); line-height: 1.15; text-align: center; }
/* rodapé */
.ini-v2 .copyright-inicio { grid-area: rodape; color: var(--lc-indigo-100); text-shadow: 0 1px 3px rgba(0, 0, 0, .8); margin: 0; }
.ini-v2 .copyright-inicio a { color: var(--lc-ouro); }
/* escolhendo qual save usar: a pergunta ocupa o lugar do Continuar */
.ini-cartao.escolhendo #btnContinuar, .ini-cartao.escolhendo #btnNovo { display: none; }
.ini-cartao #contaEscolha { margin: 0; background: rgba(13, 11, 38, .7); color: #fff; border: 2px solid var(--lc-ouro); border-radius: 16px; box-shadow: 0 0 24px rgba(255, 201, 40, .35); }
.ini-cartao #contaEscolha .conta-bts { flex-direction: column; align-items: stretch; }
.ini-cartao #contaEscolha .btn { width: 100%; }
.inicio-menu.escolhendo .ini-avisos .nuvem-caixa { display: none; }

/* ---------- Criação de personagem ---------- */
#inicio.ini-v2.modo-criacao::before { background: rgba(13, 11, 38, .72); }
#inicio.ini-v2.modo-criacao .inicio-caixa { grid-template-columns: minmax(0, 1fr); grid-template-areas: "barra" "topo" "criacao" "rodape"; width: min(1040px, 100%); }
.ini-v2.modo-criacao .logo-jogo { width: min(300px, 64%) !important; animation: none; }
.ini-v2.modo-criacao .sub, .ini-v2.modo-criacao .aviso-beta { display: none; }
.ini-v2 .criacao { grid-area: criacao; display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 24px; padding: 22px; color: #fff; background: var(--lc-vidro); border: 1px solid var(--lc-vidro-borda); border-radius: 24px; backdrop-filter: blur(16px) saturate(140%); -webkit-backdrop-filter: blur(16px) saturate(140%); box-shadow: 0 24px 60px rgba(0, 0, 0, .45); animation: iniSobe .7s var(--lc-mola) both; }
.ini-v2 .criacao-preview { position: sticky; top: 16px; align-self: start; display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 20px; border-radius: 20px; background: radial-gradient(circle at 50% 30%, rgba(99, 102, 241, .5), rgba(13, 11, 38, .25) 72%); border: 1px solid rgba(165, 180, 252, .25); }
.ini-v2 #retratoCriacao { width: 200px; height: 266px; border-radius: 18px; border: 3px solid var(--lc-ouro); background: radial-gradient(circle at 50% 35%, #6ad86a, #2e8a3a 70%); box-shadow: 0 0 44px rgba(255, 201, 40, .35); animation: iniBalanca 4s ease-in-out infinite; }
@keyframes iniBalanca { 0%, 100% { transform: translateY(0) rotate(-1deg); } 50% { transform: translateY(-6px) rotate(1deg); } }
.ini-v2 .criacao .dica { margin: 0; text-align: center; font-size: 13px; font-weight: 700; color: var(--lc-indigo-200); }
.ini-v2 .criacao-opcoes label, .ini-v2 #criacao .opc > span { display: block; color: var(--lc-indigo-200); font-weight: 900; font-size: 12px; letter-spacing: .12em; text-transform: uppercase; }
.ini-v2 #inpNome { margin-top: 6px; width: 100%; padding: 12px 14px; font: 700 18px var(--lc-texto); color: #fff; background: rgba(255, 255, 255, .08); border: 1.5px solid rgba(165, 180, 252, .35); border-radius: 14px; }
.ini-v2 #inpNome::placeholder { color: var(--lc-indigo-300); }
.ini-v2 #inpNome:focus { outline: none; border-color: var(--lc-ouro); box-shadow: 0 0 0 4px rgba(255, 201, 40, .2); }
.ini-v2 #criacao .opc { margin: 12px 0; }
.ini-v2 #criacao .chips { gap: 7px; margin-top: 7px; }
.ini-v2 #criacao .chip { padding: 7px 13px; border-radius: 999px; font: 700 13px var(--lc-texto); color: #fff; background: rgba(255, 255, 255, .07); border: 1px solid rgba(165, 180, 252, .25); cursor: pointer; transition: border-color .15s, background .15s, transform .15s; }
.ini-v2 #criacao .chip:hover { border-color: rgba(255, 201, 40, .6); transform: translateY(-1px); }
.ini-v2 #criacao .chip.sel { color: var(--lc-tinta-ouro); background: linear-gradient(180deg, var(--lc-ouro-claro), var(--lc-ouro)); border-color: transparent; box-shadow: 0 4px 14px rgba(255, 201, 40, .35); }
.ini-v2 #criacao .chip i { border: 2px solid rgba(255, 255, 255, .75); }
.ini-v2 #criacao .grade-classes { gap: 10px; margin-top: 8px; }
.ini-v2 #criacao .card-classe { padding: 12px 14px; border-radius: 16px; color: #fff; background: rgba(255, 255, 255, .06); border: 1px solid rgba(165, 180, 252, .22); transition: transform .2s, border-color .2s, box-shadow .2s; }
.ini-v2 #criacao .card-classe:hover { transform: translateY(-3px); border-color: var(--cor); }
.ini-v2 #criacao .card-classe.sel { background: rgba(255, 201, 40, .1); border-color: var(--lc-ouro); box-shadow: inset 0 0 0 2px var(--lc-ouro), 0 10px 28px rgba(255, 201, 40, .22); }
.ini-v2 #criacao .card-classe b { color: #fff; font-family: var(--lc-titulo); font-weight: 600; }
.ini-v2 #criacao .card-classe p { color: var(--lc-indigo-100); }
.ini-v2 #criacao .card-classe .cc-attr { color: var(--lc-ouro); }
.ini-v2 .criacao-acoes { position: sticky; bottom: 0; margin-top: 16px; padding-top: 14px; display: flex; justify-content: space-between; gap: 12px; background: linear-gradient(0deg, rgba(13, 11, 38, .92) 60%, rgba(13, 11, 38, 0)); }
.ini-v2 .criacao-acoes #btnNascer { height: 58px; font-size: 22px; flex: 1; max-width: 340px; }

/* ---------- Telas estreitas (celular / janela pequena) ---------- */
@media (max-width: 860px) {
  #inicio.ini-v2 { padding: 10px 10px 14px; }
  #inicio.ini-v2::before { background: linear-gradient(180deg, rgba(13, 11, 38, .55) 0%, rgba(13, 11, 38, .1) 26%, rgba(13, 11, 38, .55) 55%, rgba(13, 11, 38, .9) 100%); }
  #inicio.ini-v2 .inicio-caixa { grid-template-columns: minmax(0, 1fr); grid-template-areas: "barra" "topo" "menu" "rodape"; gap: 10px; }
  .ini-v2 .logo-eg { height: 30px; }
  .ini-v2 .logo-jogo { width: min(300px, 72%) !important; margin: 0 auto 2px !important; }
  .ini-v2 .sub { font-size: 13.5px; }
  .ini-v2 .aviso-beta { display: none; }
  .ini-v2 .inicio-menu { padding: 12px; }
  .ini-v2 .ini-cartao { order: -1; }
  .ini-tiles { grid-template-columns: repeat(4, 1fr); gap: 6px; }
  .btn.ini-tile { min-height: 68px; padding: 6px 4px; }
  .ini-tile small { display: none; }
  .ini-v2 .ini-barra .portal-barra { flex-wrap: nowrap; gap: 6px; min-width: 0; }
  .ini-v2 .ini-barra .portal-barra > * { min-width: 0; flex: 0 1 auto; }
  .ini-v2 .ini-barra .portal-barra .btn, .ini-v2 .ini-barra .portal-quem { font-size: 11.5px; padding: 4px 9px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ini-info .ini-nome { font-size: 20px; }
  .ini-cartao #btnContinuar { font-size: 20px; height: 52px; }
  .ini-v2 .criacao { grid-template-columns: minmax(0, 1fr); padding: 14px; gap: 14px; }
  .ini-v2 .criacao-preview { position: static; flex-direction: row; justify-content: center; }
  .ini-v2 #retratoCriacao { width: 120px; height: 160px; }
  .ini-v2 .criacao .dica { text-align: left; }
  .ini-v2 .criacao-acoes #btnNascer { height: 52px; font-size: 20px; }
}

@media (prefers-reduced-motion: reduce) {
  .ini-v2 .logo-jogo, .ini-v2 .logo-jogo::after, .ini-v2 .inicio-menu, .btn.ini-tile, .ini-bola, .ini-v2 #retratoCriacao, .ini-v2 .criacao { animation: none !important; }
  .btn.ini-tile { transform: none !important; }
}
```

- [ ] **Step 6: Rodar e ver passar**

Run: `npm --prefix frontend test`
Expected: PASS — `# fail 0` (contrato, Steam e todos os anteriores).

- [ ] **Step 7: Conferir no navegador** (`http://localhost:5181/lenda-do-campinho/`)

Em 1440×900, 1366×768 e 390×844:
- **Sem save** (limpar `localStorage`): capa viva ao fundo, logo com quique e reflexo, painel de vidro com "Comece sua lenda" e "⚽ Criar meu jogador" dourado; "Explore" em blocos entrando em cascata, inclinando no mouse; o bloco "🌟 Conheça o jogo" aparece e leva a `/lenda/`.
- **Com save** (criar um jogador e voltar à tela inicial recarregando): cartão com retrato, nome, nível e lugar; "▶ Continuar" dourado entra no jogo.
- **Dentro do jogo**, no console: `performance.now()` antes/depois de 3 s com `requestAnimationFrame` contando quadros da capa — o canvas `.cv-faiscas` não é mais redesenhado (o `#inicio` está oculto). Verificação: `document.querySelector('.cv-faiscas').getContext('2d').getImageData(0,0,1,1)` não muda e o perfil de desempenho (aba Performance, 3 s) não mostra `quadro` da capa.
- **Dois saves**: colocar um segundo save de conta (`rac_save_conta_x`) e logar como outra conta — a pergunta "qual save usar?" aparece no lugar do Continuar.
- Todos os blocos Explore abrem o que abriam antes (História, Ranking, Como jogar, Wiki, Personagens, Backup, Informar bug, Windows).
- Console sem erros.

- [ ] **Step 8: Commit**

```bash
git add frontend/public/lenda-do-campinho/index.html frontend/public/lenda-do-campinho/js/inicio.js frontend/public/lenda-do-campinho/css/inicio.css frontend/tests/lenda/contrato_inicio.test.js frontend/tests/lenda/steam.test.js
git commit -m "Lenda: tela inicial no padrão da vitrine (capa viva, painel de vidro, botões dourados, Conheça o jogo)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Criação de personagem — conferência e ajustes finos

O CSS da criação já entrou na Tarefa 6 (`inicio.css`). Esta tarefa é a conferência dedicada e os ajustes que ela pedir.

**Files:**
- Modify (se a conferência pedir): `frontend/public/lenda-do-campinho/css/inicio.css` (só a seção "Criação de personagem")

- [ ] **Step 1: Conferir no navegador** (`http://localhost:5181/lenda-do-campinho/`, sem save)

Em 1440×900, 1366×768 e 390×844, clicar "Criar meu jogador":
- fundo mais escuro, logo menor, painel de vidro com o retrato grande à esquerda (com luz e leve balanço) e as opções à direita;
- os chips trocam o retrato na hora; o escolhido fica dourado;
- as classes são cartões de vidro; a escolhida tem borda dourada;
- nome com menos de 2 letras: "Nascer!" não deixa e a borda do campo fica vermelha (comportamento do jogo);
- nome válido + "Nascer!" entra na história/jogo;
- "Voltar" volta para a tela inicial;
- em 390×844, "Nascer!" fica visível no fim sem precisar de zoom, sem rolagem lateral;
- **dentro do jogo**, abrir a janela "Escolha sua classe" (se acessível) ou a escolha de cores do time: `.card-classe` e `.chip` continuam com o visual antigo.

- [ ] **Step 2: Ajustar se preciso e rodar os testes**

Só mexer na seção "Criação de personagem" do `inicio.css`. Run: `npm --prefix frontend test` → `# fail 0`.

- [ ] **Step 3: Commit (só se houve ajuste)**

```bash
git add frontend/public/lenda-do-campinho/css/inicio.css
git commit -m "Lenda: ajustes finos da criação de personagem no padrão novo

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Entrada do jogo → vitrine (branch separada)

**Files:**
- Create: `frontend/public/lenda-do-campinho/js/vitrine_entrada.js`
- Modify: `frontend/public/lenda-do-campinho/index.html` (`<head>`)
- Test: `frontend/tests/lenda/entrada.test.js`

**Interfaces:**
- Consumes: marca `lenda_vitrine_vista` (gravada pela vitrine, Tarefa 3, e pelo `?jogar`).
- Produces: redirecionamento `location.replace('/lenda/')`.

- [ ] **Step 0: Branch própria**

Run: `git switch -c lenda-vitrine-entrada`
(Assim a vitrine e a tela nova podem ser publicadas antes, e a entrada depois — ou desligada sozinha.)

- [ ] **Step 1: Testes (vão falhar)**

Arquivo: `frontend/tests/lenda/entrada.test.js`
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { carrega } from "./util.js";

// Roda o próprio vitrine_entrada.js num "navegador de mentira" e devolve pra
// onde ele mandou (ou null) e o que ficou guardado.
function roda({ protocol = "https:", hostname = "www.educacaogamer.com.br", search = "", guardado = {}, armazenamentoQuebrado = false } = {}) {
  const dados = { ...guardado };
  const ls = {
    getItem: (k) => (k in dados ? dados[k] : null),
    setItem: (k, v) => { dados[k] = String(v); },
    key: (i) => Object.keys(dados)[i] ?? null,
    get length() { return Object.keys(dados).length; },
  };
  let destino = null;
  const location = { protocol, hostname, search, replace: (u) => { destino = u; } };
  const window = { location };
  Object.defineProperty(window, "localStorage", { get() { if (armazenamentoQuebrado) throw new Error("bloqueado"); return ls; } });
  carrega("public/lenda-do-campinho/js/vitrine_entrada.js", { window });
  return { destino, dados };
}

test("quem chega pela primeira vez vai pra vitrine", () => {
  for (const hostname of ["www.educacaogamer.com.br", "educacaogamer.com.br", "localhost", "127.0.0.1"]) {
    assert.equal(roda({ hostname }).destino, "/lenda/", hostname);
  }
  assert.equal(roda({ protocol: "http:", hostname: "localhost" }).destino, "/lenda/");
});

test("quem já tem jogador salvo entra direto no jogo", () => {
  assert.equal(roda({ guardado: { rac_save_v2: "{}" } }).destino, null);
  assert.equal(roda({ guardado: { rac_save_v1: "{}" } }).destino, null);
  assert.equal(roda({ guardado: { rac_save_conta_abc123: "{}" } }).destino, null);
});

test("quem está logado no site ou já viu a vitrine entra direto", () => {
  assert.equal(roda({ guardado: { eg_token: "x" } }).destino, null);
  assert.equal(roda({ guardado: { lenda_vitrine_vista: "1" } }).destino, null);
});

test("?jogar (vindo da vitrine) não redireciona e marca a vitrine como vista", () => {
  const r = roda({ search: "?jogar=1" });
  assert.equal(r.destino, null);
  assert.equal(r.dados.lenda_vitrine_vista, "1");
  assert.equal(roda({ search: "?a=1&jogar" }).dados.lenda_vitrine_vista, "1");
});

test("qualquer outro parâmetro (links de dentro do site) não redireciona", () => {
  const r = roda({ search: "?volta=1" });
  assert.equal(r.destino, null);
  assert.equal(r.dados.lenda_vitrine_vista, undefined);
});

test("versão Steam / outros endereços nunca redirecionam", () => {
  assert.equal(roda({ protocol: "file:", hostname: "" }).destino, null);
  assert.equal(roda({ protocol: "app:", hostname: "lenda" }).destino, null);
  assert.equal(roda({ hostname: "lenda.example.com" }).destino, null);
  assert.equal(roda({ hostname: "educacaogamer.com.br.golpe.com" }).destino, null);
});

test("armazenamento bloqueado: fica no jogo", () => {
  assert.equal(roda({ armazenamentoQuebrado: true }).destino, null);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm --prefix frontend test`
Expected: FAIL — `ENOENT ... vitrine_entrada.js`.

- [ ] **Step 3: `vitrine_entrada.js`**

Arquivo: `frontend/public/lenda-do-campinho/js/vitrine_entrada.js`
```js
/* Lenda do Campinho — © 2026 Educação Gamer (www.educacaogamer.com.br). Todos os direitos reservados.
   Proibida a cópia, redistribuição ou modificação sem autorização por escrito. Lei 9.610/98 e Lei 9.609/98. */
/* ============================================================
   ENTRADA — quem abre o jogo pela primeira vez (sem jogador salvo, sem
   login no site e sem ter visto a vitrine) vai pra vitrine (/lenda/), que
   mostra o jogo antes. Quem já joga entra direto, como sempre.
   Carregado no <head>, antes de tudo (não pisca a tela do jogo).
   Nunca redireciona fora do site (versão Steam, arquivo local) nem com
   parâmetros na URL (?jogar vem da vitrine; os outros, de dentro do site).
   Qualquer erro (armazenamento bloqueado...) = fica no jogo.
   ============================================================ */
(function (w) {
  'use strict';
  try {
    var l = w.location;
    var naWeb = /^https?:$/.test(l.protocol) && /^(www\.)?educacaogamer\.com\.br$|^localhost$|^127\.0\.0\.1$/.test(l.hostname);
    if (!naWeb) return;
    var ls = w.localStorage;
    if (l.search) {
      if (/[?&]jogar(=|&|$)/.test(l.search)) ls.setItem('lenda_vitrine_vista', '1');
      return;
    }
    if (ls.getItem('lenda_vitrine_vista') || ls.getItem('eg_token') || ls.getItem('rac_save_v2') || ls.getItem('rac_save_v1')) return;
    for (var i = 0; i < ls.length; i++) {
      var k = ls.key(i);
      if (k && k.indexOf('rac_save_conta_') === 0) return;
    }
    l.replace('/lenda/');
  } catch (e) { /* fica no jogo */ }
})(window);
```

- [ ] **Step 4: Ligar no `<head>` do jogo**

Em `frontend/public/lenda-do-campinho/index.html`, logo depois de `<meta name="viewport" ...>`:
```html
<script src="js/vitrine_entrada.js?v=406"></script>
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm --prefix frontend test`
Expected: PASS — `# fail 0` (inclui os 7 testes de entrada e a checagem Steam).

- [ ] **Step 6: Conferir no navegador** (`http://localhost:5181/`)

- `localStorage.clear()` e abrir `/lenda-do-campinho/` → vai para `/lenda/`.
- Na vitrine, "Jogar grátis" → `/lenda-do-campinho/?jogar=1` → fica no jogo; abrir de novo `/lenda-do-campinho/` (sem parâmetro) → fica no jogo.
- `localStorage.clear(); localStorage.setItem('rac_save_v2','{"v":2}')` e abrir `/lenda-do-campinho/` → fica no jogo.

- [ ] **Step 7: Commit**

```bash
git add frontend/public/lenda-do-campinho/js/vitrine_entrada.js frontend/public/lenda-do-campinho/index.html frontend/tests/lenda/entrada.test.js
git commit -m "Lenda: quem chega pela primeira vez ao jogo vê a vitrine antes (só no site)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Run: `git switch lenda-vitrine`

---

### Task 9: Conferência final e aprovação do dono

**Files:** nenhum (correções voltam para a tarefa dona, na branch `lenda-vitrine`; depois `git switch lenda-vitrine-entrada && git merge lenda-vitrine` para a entrada ficar em dia).

- [ ] **Step 1: Testes**

Run: `npm --prefix frontend test` (na `lenda-vitrine` e na `lenda-vitrine-entrada`)
Expected: `# fail 0` nas duas.

- [ ] **Step 2: Matriz da vitrine** (`http://localhost:5181/lenda/`)

Em 1440×900, 1024×768, 768×1024 e 390×844, em PT e em EN:
- sem rolagem lateral (`document.documentElement.scrollWidth <= innerWidth`);
- abertura sem cobrir o garoto no celular; botões acessíveis em 1024×768;
- jornada, trailer (abre e toca no idioma certo), destaques, galeria (setas, teclado, Esc, arrastar), Expansão, chamada final, imprensa (copiar, downloads, e-mail), rodapé;
- todos os botões "Jogar" → `/lenda-do-campinho/?jogar=1`; "Baixar" → o `.exe`;
- console sem erros.

- [ ] **Step 3: Reduzir movimento**

Emular `prefers-reduced-motion: reduce` (DevTools › Rendering): nada se mexe (capa parada, sem faíscas, sem cascata), jornada vira lista, tudo legível e clicável — na vitrine e na tela do jogo.

- [ ] **Step 4: Peso inicial**

Aba Rede, cache desligado, `http://localhost:5181/lenda/` até o fim da abertura (sem rolar): total transferido ≤ 1 MB.

- [ ] **Step 5: Revisão independente da branch** (executing-plans: revisor no modelo mais capaz, com a Review Focus deste plano).

- [ ] **Step 6: Aprovação do dono**

Mostrar ao dono as duas páginas (`/lenda/` e `/lenda-do-campinho/` com e sem save) no navegador dele (`http://localhost:5181/...`). **Só seguir com a aprovação explícita.**

- [ ] **Step 7: Publicar em duas etapas (com autorização do dono para cada push)**

1. `git switch main && git merge --no-ff lenda-vitrine -m "Merge: vitrine da Lenda do Campinho (/lenda/) e tela inicial no mesmo padrão"` → testes → `git push origin main` → esperar a Vercel e conferir `https://www.educacaogamer.com.br/lenda/` e `/lenda-do-campinho/` no ar.
2. Depois do dono conferir no ar: `git merge --no-ff lenda-vitrine-entrada -m "Merge: quem chega ao jogo vê a vitrine antes"` → testes → `git push origin main` → conferir com `localStorage` limpo.
