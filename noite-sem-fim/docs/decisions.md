# Decisões — Noite Sem Fim

Status: **OK** = decidida pelo usuário · **P** = provisória (adotada para não bloquear, reversível) · **A** = aguardando o usuário.

## Decididas pelo usuário

| # | Decisão | Data |
|---|---|---|
| D-01 | **Sem engine.** O jogo é feito por IA: código escrito pela IA programadora | 16/10/2026 |
| D-10 | **Arquivos gráficos gerados no Higgsfield** (fluxo em `docs/pipeline_arte.md`) | 16/10/2026 |

Histórico: a primeira versão da FASE 0 montou uma base em Godot 4.7.2. Ela foi substituída por esta após a decisão D-01
e continua salva no histórico do git (commit `5e154ff`), como backup.

## Provisórias (FASE 0, precisam de aprovação)

| # | Decisão | Status | Motivo / como reverter |
|---|---|---|---|
| D-02 | **HTML5 Canvas 2D + JavaScript puro**, scripts globais em ordem, **sem compilação e sem bibliotecas** | P | Mesmo padrão do Jocelino neste repositório. Se a iluminação neon da FASE 7 exigir, dá para trocar só o desenho por WebGL próprio, ainda sem engine. |
| D-03 | Resolução lógica **1920×1080**, encaixada na tela mantendo a proporção (barras se o formato for outro) | P | A arte pintada reduz bem. Depende da plataforma (D-A2). |
| D-04 | Suavização de imagem **ligada** (`imageSmoothingQuality = "high"`) | P | Arte pintada, não pixel art. |
| D-05 | "Importação" = regras de entrega + `tools/verificar_asset.py` (PNG, alpha real, margem, altura mínima, sem halo) | P | Sem engine não existe importador; o verificador faz o papel de portão de entrada. Formato final de jogo (WebP/PNG) fica para a otimização. |
| D-06 | Modo de teste `?test=1`: 30 fps, sem efeitos, sem som. Sem o parâmetro, nada muda | P | Mantém os testes de navegador leves. |
| D-07 | Projeto na pasta `noite-sem-fim/` na raiz deste repositório, **fora de `frontend/public`**, portanto **não publicado no site** | P | Nada vai ao ar sem aprovação. Publicar depois = mover/copiar para `frontend/public/noite-sem-fim/`. |
| D-11 | Foto do rosto e vídeo/quadros do cômodo **fora do git** (`reference/privado/`, ignorado) | P | Dados pessoais e de terceiros num repositório de site público. SHA-256 no inventário. |

## Pendentes — decididas pelo usuário

| # | Pergunta | Opções / observação |
|---|---|---|
| D-A2 | **Plataforma prioritária**: navegador ou PC/Steam? | Sem engine, o jogo roda nativamente no navegador. PC/Steam exigiria empacotar (ex.: Electron), como o Lenda deste repositório já prevê. |
| D-A3 | Resolução base (1920×1080 ou 1280×720) | Afeta o tamanho dos sprites de jogo. |
| D-A4 | **Altura do protagonista em pixels** | Sugestão: fonte mestre ≥ 1000 px (Higgsfield) e sprite de jogo ~280–320 px a 1080p. Pivô nos pés. |
| D-A5 | Zoom e câmera | Câmera fixa ou seguindo o jogador? Níveis de zoom? |
| D-A6 | Projeção isométrica | Dimétrica 2:1 (~26,57°, padrão de jogos) ou isométrica verdadeira (30°). Precisa ir nas fichas do Higgsfield. |
| D-A7 | Escala do mundo | Relação personagem × porta × tile. Não há medida real no vídeo. |
| D-A8 | **Número de direções** | 8 geradas no Higgsfield, ou 5 + 3 espelhadas. Espelhar troca a mão da garrafa e o lado do relógio. |
| D-A9 | Garrafa como **acessório em camada separada** | Recomendo gerar o personagem sem garrafa e a garrafa à parte. |
| D-A11 | Arquivos privados fora do git estão OK? | Ou podem ir para um repositório privado separado. |
| D-A12 | Conflitos do `conceito_geral.png` | Título "Última Round", beat 'em up, outro rosto, ameaças por aparência/posição política. Proposta: prevalece o LEIA_PRIMEIRO. |
| D-A13 | Licença/termos das imagens geradas | Confirmar se o plano do Higgsfield permite uso comercial (Steam/web). |
| D-A14 | O cômodo do vídeo é o **apartamento do protagonista**? A varanda entra no mapa? | Define a sala piloto da FASE 4. |
| D-A15 | O Higgsfield entrega **PNG com fundo transparente**? | Se não, usar fundo liso magenta #FF00FF e eu recorto. Aqui não há conector do Higgsfield: você gera e me envia os arquivos. |
