# Noite Sem Fim (protótipo)

Aventura narrativa 2.5D isométrica. **Estado: FASE 0** (auditoria dos anexos + projeto base). Ainda não existe jogo.

## Abrir e testar

Requisitos: Godot **4.7.2-stable** (padrão, não-mono). Para a auditoria dos anexos: Python 3 com Pillow, numpy e scipy, além do ffprobe.

```bash
cd noite-sem-fim
godot --path . --editor            # abre no editor
godot --path .                     # roda a cena de teste vazia
tests/run_tests.sh /caminho/do/godot   # testes da FASE 0 (sai != 0 se algo falhar)
python3 -I tools/audit_assets.py   # refaz o inventário técnico dos anexos
```

## Estrutura

- `assets/` — assets de jogo (vazio até a FASE 1).
- `scenes/tests/test_vazio.tscn` — cena vazia de testes (cena principal provisória).
- `reference/kit_v1.0/` — anexos do kit, cópias sem alteração (o Godot não importa: `.gdignore`).
- `reference/privado/` — foto e vídeo pessoais: **fora do git**, ver `docs/inventario_assets.md`.
- `docs/decisions.md` — decisões provisórias e pendentes.
- `docs/inventario_assets.md` — inventário e análise dos anexos.
- `docs/acceptance/fase_0.md` — relatório da FASE 0 e evidências.
