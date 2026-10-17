# Noite Sem Fim (protótipo)

Aventura narrativa 2.5D isométrica. Sem engine: HTML5 Canvas 2D e JavaScript puro, sem compilação.
Arte gerada no Higgsfield. **Estado: FASE 0** (auditoria dos anexos + projeto base). Ainda não existe jogo.

Hospedado no educacaogamer em `/thelastdance/` (pasta `frontend/public/thelastdance/`; fora do índice de busca). Só vai ao ar quando esta branch entrar no `main`.

## Abrir e testar

Requisitos: um navegador; para os testes, Node 22+ com Playwright (Chromium) e Python 3 com Pillow, numpy e scipy (+ ffprobe na auditoria).

```bash
cd frontend/public/thelastdance
python3 -m http.server 8000         # depois abra http://localhost:8000/  (ou ?test=1 para o modo de teste)
tests/run_tests.sh                  # todos os testes da FASE 0, headless (sai != 0 se algo falhar)
HEADED=1 tests/run_tests.sh         # o mesmo, com a janela do navegador visível
python3 -I tools/audit_assets.py    # refaz o inventário técnico dos anexos
python3 -I tools/verificar_asset.py arquivo.png   # confere um arquivo vindo do Higgsfield
```

O modo de teste (`?test=1`) limita a 30 fps e desliga efeitos e som; sem o parâmetro, nada muda.

## Estrutura

- `index.html`, `css/`, `js/base.js` (núcleo, laço de quadros, modo de teste), `js/cena_teste.js` (cena vazia).
- `js/{characters,camera,occlusion}/` — módulos das próximas fases (vazios).
- `assets/` — arte aprovada (vazio até a FASE 1).
- `reference/kit_v1.0/` — anexos do kit, cópias sem alteração.
- `reference/privado/` — foto e vídeo pessoais, **fora do git** (ver `docs/inventario_assets.md`).
- `docs/decisions.md`, `docs/pipeline_arte.md`, `docs/inventario_assets.md`, `docs/acceptance/fase_0.md`.

## Créditos de música

- Elevador: "Short Elevator Music Loop" — BlondPanda (Freesound), CC0 — https://freesound.org/s/659889/
- Peido do elevador: "WAV Fart Vegan 086" — frenkfurth (Freesound), CC0 — https://freesound.org/s/777448/
- Toque de telefone: "Electronic Landline Telephone Ringing" — G.M_Isaac (Freesound), CC0 — https://freesound.org/s/866047/
- Burburinho da padaria: "three minutes of crowded bakery" — mueckenjulie (Freesound), CC0 — https://freesound.org/s/455567/
- Ronco: "Snoring Sound _ Jabin" — sabuzkamruz (Freesound), CC0 — https://freesound.org/s/767487/
- Som da cena do quarto: "lovemaking1" — ddohler (Freesound), CC BY 4.0 — https://freesound.org/s/34216/ (trancado no pacote da área dos amigos)
