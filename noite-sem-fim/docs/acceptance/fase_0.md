# Relatório — FASE 0: auditoria dos arquivos e projeto base

- **Fase e versão:** FASE 0, `0.0.1-fase0`, branch `claude/noite-sem-fim-fase-0-mgmpts` (o commit está no histórico do git).
- **Data:** 16/10/2026
- **Ambiente de teste:** Linux x86_64 em contêiner, Godot 4.7.2-stable oficial (SHA-512 conferido), Mesa llvmpipe (OpenGL 4.5) via Xvfb para a captura.

## 1. Objetivo, insumos, riscos e critérios (protocolo, item 1)

- **Objetivo:** inventariar os anexos, confirmar o estado real de cada um, criar a estrutura mínima do projeto, a
  configuração de importação e uma cena vazia de testes, e registrar as decisões pendentes. Sem criar jogo.
- **Insumos:** os 8 arquivos do kit v1.0 + LEIA_PRIMEIRO.md.
- **Riscos identificados:** (a) usar a prancha ilustrativa como se fosse spritesheet; (b) inventar medidas a partir do
  vídeo; (c) publicar dados pessoais num repositório de site público; (d) decidir a plataforma sem o usuário.
- **Mitigação:** a prancha foi só analisada, não recortada; o vídeo só foi descrito (observável × suposição); os arquivos
  pessoais ficam fora do git; renderizador e resolução são provisórios e reversíveis.

## 2. Arquivos criados (nenhum arquivo existente do repositório foi modificado)

```
noite-sem-fim/
  project.godot, icon.svg, icon.svg.import, .gitignore, .gitattributes, README.md
  assets/characters/protagonist/{source,directions,animations}/.gitkeep
  assets/maps/room_01/{floor,walls,props,lighting}/.gitkeep
  scenes/tests/test_vazio.tscn         scenes/{characters,maps}/.gitkeep
  scripts/tests/test_vazio.gd (+.uid)  scripts/{characters,camera,occlusion}/.gitkeep
  tests/fase0_smoke_test.gd (+.uid), tests/run_tests.sh
  tools/audit_assets.py
  reference/kit_v1.0/...  (5 imagens + LEIA_PRIMEIRO.md, cópias idênticas)
  docs/decisions.md, docs/inventario_assets.md, docs/acceptance/fase_0.md
  docs/acceptance/fase_0/{inventario.json, evid_spritesheet_segmentacao.jpg, evid_cena_teste_vazia.png, logs/*}
```

## 3. O que foi implementado

- Inventário técnico automatizado (`tools/audit_assets.py`): formato, resolução, proporção, modo de cor, alpha,
  área vazia, SHA-256, metadados do vídeo e segmentação aproximada da prancha.
- Análise visual e o que é observável × suposição: `docs/inventario_assets.md`.
- Projeto Godot mínimo: configuração de janela, renderizador, filtro linear e padrões de importação de textura.
- Cena vazia de testes, teste de fumaça automatizado e script de execução.

## 4. Critérios de aceite

| Critério | Resultado | Evidência |
|---|---|---|
| Relatório de inventário de todos os anexos (formato, resolução, transparência, proporção, consistência, limitações) | **PASSOU** | `docs/inventario_assets.md`, `fase_0/inventario.json`, `logs/audit_assets.log` |
| Confirmar que a prancha é ilustrativa, não uma sequência pronta | **PASSOU** | Seção 2 do inventário + `evid_spritesheet_segmentacao.jpg` (39 figuras, 8/8/7/6 quadros, sem alpha, ~200 px) |
| Vídeo e referências de mapa: observável × suposições | **PASSOU** | Seções 4 e 7 do inventário |
| Estrutura mínima do repositório | **PASSOU** | Teste de fumaça: 15 pastas verificadas |
| Configuração de importação | **PASSOU** | Teste de fumaça + `icon.svg.import` gerado com `compress/mode=0` e `detect_3d/compress_to=0` |
| Cena vazia de testes | **PASSOU** | `evid_cena_teste_vazia.png` (renderizada de verdade em OpenGL), `logs/run.log` |
| Projeto abrindo sem erros | **PASSOU** | `logs/import.log` (editor headless, cache apagado antes), sem ERROR/WARNING |
| Nenhuma arte descartada | **PASSOU** | As 8 cópias têm o mesmo SHA-256 do zip original; nada recortado nem alterado |
| Pendências explicitadas | **PASSOU** | `docs/decisions.md` (D-A1 a D-A14) |
| Abrir o projeto no editor com interface gráfica, na máquina do usuário | **NÃO TESTADO** | Testei só no editor headless e no runtime com Xvfb; a máquina do usuário não está acessível |
| Export para navegador/PC | **NÃO TESTADO** | Fora do escopo da FASE 0; depende de D-A2 |

## 5. Testes executados (comandos reproduzíveis)

```bash
cd noite-sem-fim
rm -rf .godot build && tests/run_tests.sh godot    # 1) abre no editor headless; 2) teste de fumaça; 3) roda 30 quadros
python3 -I tools/audit_assets.py
xvfb-run -a -s "-screen 0 1280x720x24" godot --rendering-driver opengl3 --path . \
  --write-movie build/cap/frame.png --fixed-fps 30 --quit-after 10   # captura real da cena
```

Resultado da última execução: **RESULTADO GERAL: PASSOU** (27 verificações no teste de fumaça — 12 de configuração/cena + 15 pastas —, 0 falhas).

## 6. Problemas encontrados, correções e retestes

| # | Problema | Correção | Reteste |
|---|---|---|---|
| 1 | 1ª execução da suíte: **FALHOU** em "docs/decisions.md existe" (1 falha) | Escrevi `docs/decisions.md` | Reteste com cache apagado: PASSOU, 0 falhas |
| 2 | A suíte poderia "passar" mesmo com erro? | Teste negativo: numa cópia descartável, quebrei o script da cena (`$InfoInexistente`) | A suíte acusou `SCRIPT ERROR`, FALHOU e saiu com código 1 (`logs/teste_negativo_smoke.log`). O projeto real não foi tocado. |
| 3 | O Godot não estava instalado no ambiente, e o GitHub Releases está bloqueado pela rede | Baixei do espelho oficial no SourceForge e conferi o SHA-512 com o `SHA512-SUMS.txt` oficial | `godot --version` → 4.7.2.stable.official.ed1daf0bf |
| 4 | A imagem de evidência da prancha tinha 2,7 MB em PNG | Passei a salvar em JPEG q88 (536 KB). É só a evidência; a referência original segue intacta | Auditoria rodada de novo |
| 5 | Aviso "Could not set V-Sync mode" na captura via Xvfb | Nenhuma: é limitação do driver de software (llvmpipe) do contêiner, não do projeto | Não aparece no headless |

Achados nos **anexos** (não corrigidos, porque não se altera arte sem autorização): prancha sem alpha, de baixa
resolução e inconsistente (garrafa duplicada nas costas/perfil, cor da camisa variando, rosto diferente no 1º quadro,
"andando cima" que é uma vista frontal, falta de diagonais, sombra pintada); conceito sem alpha e com fundo
texturizado; `quadros_video_referencia.png` com 66,7% de preto vazio; vídeo de 512×910 com borrão; `conceito_geral.png`
em conflito com o escopo. Detalhes no inventário.

## 7. Validação técnica dos arquivos do personagem (pedido do usuário)

- **personagem_conceito.png:** adequado como **fonte mestre de identidade** (rosto, cabelo, barba, roupa, proporção
  ~2,1 cabeças). **Não é adequado** como sprite de jogo: não tem alpha, o fundo é texturizado, a sombra está pintada e
  existe só uma vista.
- **spritesheet_referencia_NAO_PRONTO.png:** **inadequado para uso técnico** (resolução ~200 px, sem alpha, canvas e
  quadros inconsistentes, acessórios trocando, sem diagonais). Adequado como referência de poses, expressões e ciclo de passada.
- Consequência para a FASE 1: as vistas limpas terão de ser **produzidas de novo** a partir do conceito, preservando
  fisionomia e proporções. Quem produz essa arte é a decisão **D-A10**.

## 8. Decisões que dependem do usuário

Ver `docs/decisions.md`. As mais urgentes antes da FASE 1: **D-A2** (plataforma), **D-A4** (altura do sprite),
**D-A6** (projeção), **D-A8** (8 direções × espelhamento), **D-A9** (garrafa separada), **D-A10** (quem produz a arte).

## STATUS: AGUARDANDO APROVAÇÃO DO USUÁRIO

Você aprova esta fase e autoriza iniciar a próxima?
