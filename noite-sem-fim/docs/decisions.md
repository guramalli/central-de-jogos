# Decisões — Noite Sem Fim

Status: **P** = provisória (adotada para não bloquear, reversível) · **A** = aguardando o usuário · **OK** = aprovada.

## Tomadas na FASE 0 (provisórias, precisam de aprovação)

| # | Decisão | Status | Motivo / como reverter |
|---|---|---|---|
| D-01 | Engine **Godot 4.7.2-stable** (oficial, licença MIT), GDScript, cenas 2D nativas | P | Sugerida no escopo; versão estável mais recente disponível em 16/10/2026. Binário conferido por SHA-512 com a lista oficial. |
| D-02 | Renderizador **gl_compatibility** (desktop e mobile) | P | Único que exporta para navegador; roda em PC também. Trocar para Forward+ se a plataforma for só PC e precisar de efeitos que ele não tem. |
| D-03 | Viewport base **1920×1080**, stretch `canvas_items`, aspecto `expand`; janela de teste 1280×720 | P | Arte pintada em alta resolução; reduz bem para 720p. Depende da plataforma (D-A2). |
| D-04 | Filtro de textura **linear** (não "nearest") | P | Arte pintada, sem pixel art (direção visual imutável). |
| D-05 | Importação de textura padrão: **sem perdas**, sem mipmaps, `fix_alpha_border` ligado, sem pré-multiplicar alpha, detecção 3D desligada | P | Preserva a pintura e as bordas de alpha. Rever compressão VRAM na otimização (FASE 7). |
| D-06 | Referências em `reference/` com `.gdignore` (o Godot não importa) | P | Referência não é asset de jogo; evita importar 14 MB à toa. |
| D-07 | Projeto na pasta `noite-sem-fim/` deste repositório, branch `claude/noite-sem-fim-fase-0-mgmpts` | P | Repositório designado para a sessão. Pode virar repositório próprio depois. |
| D-11 | Foto do rosto e vídeo/quadros do cômodo **fora do git** (`reference/privado/`, ignorado) | P | Dados pessoais/de terceiros num repositório de site público. SHA-256 no inventário. |

## Pendentes — decididas pelo usuário

| # | Pergunta | Opções / observação |
|---|---|---|
| D-A1 | Engine Godot 4.7.2 está aprovada? | Alternativas: outra versão 4.x, outra engine. |
| D-A2 | **Plataforma prioritária**: PC/Steam ou navegador? | Navegador força gl_compatibility e limita shaders/memória; o jogo "Jocelino" deste repositório já usa export web do Godot. |
| D-A3 | Resolução base (1920×1080 ou 1280×720) | Afeta o tamanho de produção dos sprites. |
| D-A4 | **Altura do protagonista em pixels de produção** | Sugestão para a FASE 1: fonte mestre ~1024 px de altura e sprite de jogo ~280–320 px a 1080p. Pivô nos pés. |
| D-A5 | Zoom e câmera | Câmera ortográfica fixa? Seguir o jogador? Níveis de zoom permitidos? |
| D-A6 | Projeção isométrica | Dimétrica 2:1 (padrão de jogos, ~26,57°) ou isométrica verdadeira (30°). Afeta todo o mapa. |
| D-A7 | Escala do mundo | Relação altura do personagem × altura das portas × tamanho do tile. Não há medida real no vídeo. |
| D-A8 | **Número de direções** | 8 direções desenhadas, ou 5 desenhadas + 3 espelhadas. Espelhar troca a mão da garrafa e o lado do relógio. |
| D-A9 | Garrafa como **acessório em camada separada** | O escopo sugere separar. Recomendo separar e o idle base ficar sem garrafa. |
| D-A10 | **Quem produz a arte das vistas novas** (FASE 1) | Eu consigo recortar, limpar, padronizar canvas/pivô e validar; não consigo pintar à mão vistas novas com a mesma qualidade e fidelidade. Opções: ferramenta de geração de imagem do usuário, ilustrador, ou fluxo misto (geração + limpeza e validação minhas). |
| D-A11 | Arquivos privados fora do git estão OK? | Ou podem ir para um repositório privado separado. |
| D-A12 | Conflitos do `conceito_geral.png` | Título "Última Round", gênero beat 'em up, outro rosto de protagonista, ameaças por aparência/posição política. Proposta: prevalece o LEIA_PRIMEIRO; usar a prancha só como clima/paleta. |
| D-A13 | Licença/autoria das artes do kit | Para distribuição futura (Steam/web), confirmar a origem e os direitos das imagens. |
| D-A14 | O cômodo do vídeo é o **apartamento do protagonista** (início/fim)? A varanda entra no mapa? | Define o propósito da sala piloto da FASE 4. |
