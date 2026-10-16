# Relatório — FASE 0: auditoria dos arquivos e projeto base (versão 2, sem engine)

- **Fase e versão:** FASE 0, revisão 2, branch `claude/noite-sem-fim-fase-0-mgmpts`. A revisão 1 (base em Godot) está no commit `5e154ff`.
- **Data:** 16/10/2026
- **Motivo da revisão 2:** decisão do usuário: "Não vamos usar engine, vai ser feito totalmente por IA. Arquivos gráficos: Higgsfield."
- **Ambiente de teste:** Linux x86_64 em contêiner, Node 22.22, Playwright 1.56.1 com Chromium headless, Python 3 + Pillow/numpy/scipy, ffprobe.

## 1. Objetivo, insumos, riscos e critérios

- **Objetivo:** inventariar os anexos, validar se os arquivos do personagem servem tecnicamente, criar a estrutura mínima
  do projeto, a regra de entrada de arte ("configuração de importação") e uma cena vazia de testes, e registrar as
  pendências. Sem criar jogo.
- **Insumos:** os 8 arquivos do kit v1.0 + LEIA_PRIMEIRO.md; decisões D-01 (sem engine) e D-10 (Higgsfield).
- **Riscos:** (a) tratar a prancha como spritesheet; (b) inventar medidas do vídeo; (c) publicar dados pessoais;
  (d) arte de IA inconsistente entre gerações; (e) testes de navegador pesando a CPU.
- **Mitigação:** a prancha só foi analisada; o vídeo só foi descrito; os arquivos pessoais ficam fora do git; há regras
  de entrega e um verificador automático para a arte do Higgsfield; os testes rodam headless, com `?test=1` e 1 navegador.

## 2. Arquivos (em `noite-sem-fim/`; nada fora desta pasta foi modificado)

Criados ou alterados na revisão 2:
```
index.html, css/estilo.css, js/base.js, js/cena_teste.js, js/{characters,camera,occlusion}/.gitkeep
tests/fase0.test.js, tests/navegador_fase0.js, tests/run_tests.sh
tools/verificar_asset.py
docs/pipeline_arte.md (novo), docs/decisions.md, docs/acceptance/fase_0.md, README.md, .gitignore, .gitattributes
docs/acceptance/fase_0/{evid_cena_teste_vazia.png, logs/*}
```
Removidos da revisão 1 (continuam no histórico do git): `project.godot`, `icon.svg(.import)`, `scenes/`, os scripts `.gd`
e os `.gdignore`.

Mantidos da revisão 1: `assets/**/.gitkeep`, `reference/kit_v1.0/` (cópias idênticas), `tools/audit_assets.py`,
`docs/inventario_assets.md`, `docs/acceptance/fase_0/{inventario.json, evid_spritesheet_segmentacao.jpg}`.

## 3. O que foi implementado

- **Inventário** técnico e visual dos 8 anexos (`docs/inventario_assets.md`, `inventario.json`).
- **Base sem engine:** página com `<canvas>`, núcleo (`js/base.js`) com resolução lógica de 1920×1080 encaixada na
  tela, suavização de imagem ligada (arte pintada), laço de quadros e **modo de teste `?test=1`** (30 fps, sem efeitos,
  sem som). Sem o parâmetro, o comportamento normal não muda.
- **Cena vazia de testes** (`js/cena_teste.js`).
- **Portão de entrada da arte do Higgsfield:** `docs/pipeline_arte.md` (regras, nomes, pastas e riscos) +
  `tools/verificar_asset.py` (PNG, alpha real, fundo transparente, margem, altura mínima, sem halo), com autoteste.
- **Testes:** 19 testes Node, autoteste do verificador (6 casos), teste em Chromium real (7 verificações) e checagem
  de que nenhum navegador ficou aberto.

## 4. Critérios de aceite

| Critério | Resultado | Evidência |
|---|---|---|
| Inventário de todos os anexos (formato, resolução, transparência, proporção, consistência, limitações) | **PASSOU** | `docs/inventario_assets.md`, `inventario.json`, `logs/audit_assets.log` |
| Prancha confirmada como ilustrativa, não sequência pronta | **PASSOU** | `evid_spritesheet_segmentacao.jpg` (39 figuras; 8/8/7/6 quadros; ~200 px; sem alpha) |
| Vídeo e mapas: observável × suposições | **PASSOU** | Seções 4 e 7 do inventário |
| Validação técnica dos arquivos do personagem | **PASSOU** (veredito: não servem como sprite; ver seção 7) | `logs/verificador_kit.log` (os dois PNG recusados: sem alpha) |
| Estrutura mínima do repositório | **PASSOU** | `logs/node.log` (13 pastas) |
| Configuração de importação (regra de entrada de arte) | **PASSOU** | `logs/verificador.log` (aceita o caso bom e recusa 5 casos ruins) |
| Cena vazia de testes abre sem erros | **PASSOU** | `evid_cena_teste_vazia.png` (captura real do Chromium), `logs/navegador.log`: 0 erros/avisos de console, 0 requisições falhas |
| Modo de teste: 30 fps; modo normal inalterado | **PASSOU** | 30,0 fps com `?test=1`; 60 fps sem ele |
| Nenhuma arte descartada | **PASSOU** | Teste Node compara o SHA-256 das 5 referências com o inventário; as 3 privadas também conferem com o zip |
| Pendências explicitadas | **PASSOU** | `docs/decisions.md` (D-A2 a D-A15) |
| Navegador com janela (`HEADED=1`) e na sua máquina | **NÃO TESTADO** | O contêiner não tem tela; só rodei headless |
| Navegadores além do Chromium (Firefox/Safari) | **NÃO TESTADO** | Depende da plataforma (D-A2) |

## 5. Como reproduzir

```bash
cd noite-sem-fim
tests/run_tests.sh                     # tudo, headless, 1 navegador; HEADED=1 para ver a janela
python3 -I tools/audit_assets.py       # inventário
python3 -I tools/verificar_asset.py reference/kit_v1.0/01_personagem/*.png
```

Última execução (`logs/run_tests.log`): **RESULTADO GERAL: PASSOU**. Node 19/19, autoteste 6/6, navegador 7/7,
nenhum navegador sobrando.

## 6. Problemas encontrados, correções e retestes

| # | Problema | Correção | Reteste |
|---|---|---|---|
| 1 | Rev. 1 — 1ª execução: faltava `docs/decisions.md` | Escrito | PASSOU |
| 2 | Rev. 1 — o Godot não estava instalado e o GitHub Releases está bloqueado | Download pelo espelho oficial no SourceForge, com SHA-512 conferido | Ficou obsoleto com a rev. 2 |
| 3 | Rev. 2 — o autoteste do verificador recusava a "figura boa" | O erro estava no caso de teste: a figura sintética ocupava 80% da imagem. Passei a usar uma silhueta realista | 6/6 PASSOU |
| 4 | Rev. 2 — 1ª suíte: faltava `docs/pipeline_arte.md` | Escrito | 19/19 PASSOU |
| 5 | Rev. 2 — "navegador ainda aberto" | **Falso positivo**: o `pgrep -f` casava com a linha de comando do próprio shell. Passei a procurar pelo nome exato do processo (`pgrep -x`) e confirmei que não havia nenhum navegador aberto | PASSOU |
| 6 | Rev. 2 — num teste que quebra, a mensagem dizia só "Timeout" | O teste passou a anexar os erros da página | Teste negativo: `TypeError ... getContext` aparece (`logs/teste_negativo_navegador.log`) |
| 7 | Os testes conseguem falhar? | Teste negativo numa cópia descartável com a cena quebrada | FALHOU e saiu com código 1; nenhum navegador ficou aberto |
| 8 | Push para o GitHub recusado (403: sem acesso de escrita do Claude ao repositório) | Depende de você reconectar o GitHub ou instalar o app Claude | Commit salvo localmente; pendente |

Achados nos **anexos** (não alterados sem autorização): ver o inventário. Os principais são a prancha sem alpha, de
baixa resolução e inconsistente; o conceito sem alpha; `quadros_video_referencia.png` com 66,7% de preto; o vídeo
de 512×910 com borrão; e o `conceito_geral.png` em conflito com o escopo.

## 7. Validação técnica dos arquivos do personagem

- **personagem_conceito.png:** é a **fonte mestre de identidade** (rosto, cabelo, barba, roupa, proporção de ~2,1
  cabeças) e deve ser **a referência a anexar no Higgsfield**. Não serve como sprite: o verificador recusa (sem
  alpha), o fundo é texturizado, a sombra está pintada e existe só uma vista.
- **spritesheet_referencia_NAO_PRONTO.png:** **inadequada para uso técnico** (verificador recusa; ~200 px; quadros e
  canvas inconsistentes; garrafa duplicada; cor da camisa variando; sem diagonais). Serve como referência de poses e
  expressões e como lista do que **não** pode se repetir nas gerações do Higgsfield.
- Consequência para a FASE 1: gerar no Higgsfield vistas novas, uma por arquivo, seguindo `docs/pipeline_arte.md`.
  Eu escrevo as fichas e valido; você gera e envia.

## 8. Decisões que dependem do usuário

Mais urgentes antes da FASE 1 (lista completa em `docs/decisions.md`):
**D-A2** plataforma · **D-A4** altura do sprite · **D-A6** projeção (vai na ficha do Higgsfield) ·
**D-A8** 8 direções × espelhamento · **D-A9** garrafa separada · **D-A15** o Higgsfield entrega PNG transparente?

## STATUS: AGUARDANDO APROVAÇÃO DO USUÁRIO

Você aprova esta fase e autoriza iniciar a próxima?
