# NOITE SEM FIM — ESCOPO MESTRE PARA IA PROGRAMADORA
Versão 1.0 — 15/10/2026

## MISSÃO E REGRA INEGOCIÁVEL
Construir gradualmente um jogo de aventura narrativa 2.5D isométrica, com visual cartoon adulto desenhado e pintado à mão, contornos escuros grossos, iluminação neon e personagens caricatos com cabeça maior que o corpo. **NÃO avançar para a próxima fase sem autorização explícita do usuário após testes e retestes da fase atual.** Não afirmar que algo foi testado sem executá-lo e apresentar evidências. Não refazer assets aprovados sem permissão.

## MATERIAIS INCLUSOS E ESTADO REAL
- `01_personagem/personagem_conceito.png`: arte conceitual aprovada como direção visual; não é sprite técnico.
- `01_personagem/spritesheet_referencia_NAO_PRONTO.png`: prancha ilustrativa de poses/direções; **NÃO é spritesheet de produção**. Tem fundo opaco, enquadramentos diferentes, número de quadros inconsistente e pode ter variações de anatomia/objetos. Não cortar automaticamente e declarar pronto.
- `03_referencias/foto_referencia_personagem.jpeg`: referência de aparência facial.
- `02_mapas/balada_isometrica_referencia.png`: referência artística, NÃO mapa navegável nem camadas editáveis.
- `02_mapas/moodboard_locais.png`: referências de ambientes.
- `04_video/video_base_comodo.mp4`: referência do cômodo fornecida pelo usuário; extrair layout/elementos somente após inspecionar o vídeo. Não assumir medidas reais.
- `04_video/quadros_video_referencia.png`: quadros de referência visual.
- `03_referencias/conceito_geral.png`: universo e direção artística, não especificação definitiva.

## VISÃO DE JOGO
Título provisório: Noite Sem Fim. Protagonista homem na faixa dos 40 anos que insiste em frequentar a noite de São Paulo. Humor adulto e situações sociais, perigos noturnos, escolhas com consequências, exploração e minigames. Evitar que aparência física ou posição política, por si, sejam tratadas como ameaça; criar conflitos por ações e personalidades individuais. O protótipo inicial não precisa implementar narrativa completa.

## DIREÇÃO VISUAL IMUTÁVEL ATÉ NOVA APROVAÇÃO
- Isométrico 2.5D, perspectiva ortográfica coerente; arte 2D pintada com textura manual e contornos pretos/azul-marinho escuro.
- Personagem caricatural: rosto semelhante à referência, cabelo escuro volumoso, barba, sorriso expressivo, cabeça muito maior que o tronco, camisa preta, jeans azul, tênis claro; acessórios em camadas opcionais (garrafa não deve ficar permanentemente fundida ao corpo se prejudicar animações).
- Paleta do ambiente: neon magenta, violeta, azul/ciano e laranja pontual; sombras fortes e leitura clara dos caminhos.
- Não usar pixel art, modelos genéricos 3D ou sprites com resolução baixa como versão final.
- O mapa deve preservar coerência de perspectiva, iluminação, tamanho das portas, escala dos móveis e caminhos navegáveis.

## TECNOLOGIA E DECISÃO DE PLATAFORMA
Sugestão inicial: Godot 4.x com GDScript, cenas e recursos nativos 2D; verificar versão estável instalada e licenças. **Antes de iniciar o projeto**, confirmar destino prioritário (PC/Steam ou navegador), pois o export web, shaders e performance podem alterar decisões. Se a plataforma ainda não estiver decidida, implementar protótipo independente de plataforma e registrar a pendência; não bloquear validação artística.

## PROTOCOLO OBRIGATÓRIO DE EXECUÇÃO (CADA FASE)
1. Mostrar objetivo, insumos, arquivos a criar/alterar, riscos e critérios de aceite.
2. Implementar SOMENTE a fase autorizada, com alterações pequenas e reversíveis.
3. Rodar testes automatizados quando possíveis, mais testes manuais com checklist e capturas/vídeos.
4. Registrar resultado PASSOU/FALHOU/NÃO TESTADO para cada critério, erros encontrados e correções.
5. Retestar regressões e documentar o antes/depois.
6. Entregar build executável ou instruções reproduzíveis, imagens e relatório da fase.
7. Perguntar: 'Você aprova esta fase e autoriza iniciar a próxima?' **Aguardar resposta**. Silêncio não significa aprovação.
8. Versionar checkpoint aprovado; nunca sobrescrever sem backup.

## FASE 0 — AUDITORIA DOS ARQUIVOS E PROJETO BASE (SEM CRIAR JOGO COMPLETO)
- Inventariar todos os assets: formato, resolução, transparência, proporção, consistência e limitações.
- Conferir que o spritesheet é ilustrativo, não uma sequência pronta.
- Conferir vídeo e referências de mapa; listar o que é observável versus suposições.
- Criar estrutura mínima do repositório, configuração de importação e uma cena vazia de testes (se autorizado).
- Registrar decisões pendentes: engine, plataforma, resolução, tamanho de sprite, zoom, câmera e escala.
**Aceite:** relatório de inventário, projeto abrindo sem erros, nenhuma arte descartada, pendências explicitadas. Parar para aprovação.

## FASE 1 — PERSONAGEM: ASSET MESTRE E VISTAS ESTÁTICAS
**Primeira fase artística obrigatória. Não começar mapa.**
- Definir guia de proporções (altura total em pixels de produção, proporção cabeça/corpo, pivô nos pés, direção de luz, paleta, espessura de contorno).
- Criar vistas limpas e consistentes: frente, costas, esquerda, direita e diagonais (8 direções se viável), a partir do conceito existente, mantendo fisionomia e roupa.
- Exportar PNGs individuais com alpha real e margens seguras; não incluir sombras no fundo do sprite (sombra de chão separada).
- Conferir visual lado a lado, sem distorções de cabeça, mãos, tênis, barba e cabelos; nenhum objeto muda de mão sem animação intencional.
**Testes:** alpha/transparência, tamanho e pivô padronizados, 8 direções distinguíveis, alinhamento dos pés, consistência facial, inspeção a 100% e em escala real de jogo.
**Aceite:** folha de comparação, arquivos fonte/editáveis quando disponíveis, PNGs separados, relatório. Usuário aprova antes da animação.

## FASE 2 — PERSONAGEM: ANIMAÇÕES DE MOVIMENTO
- Implementar primeiro idle e caminhada nas direções aprovadas; começar com um único sentido piloto e só multiplicar após aprovação desse teste.
- Meta inicial sugerida: 6 a 8 quadros de caminhada por direção; ajustar FPS e cadência após observar no jogo, sem forçar interpolação defeituosa.
- Manter dimensões de canvas e pivô dos pés idênticos em todos os quadros; nenhum 'pulo' de posição da cabeça, roupa, barba ou mãos.
- Criar atlas técnico e metadados (direção, frame, duração, origem, hitbox); PNGs individuais como fonte de verdade.
**Testes:** loop sem salto, nenhuma inversão indevida de acessórios, caminhada sem deslizar, sprite legível em 100% e zoom do jogo, uso de memória e alpha correto.
**Aceite:** vídeo curto de cada direção, checklist de inconsistências zeradas ou aceitas pelo usuário, arquivos organizados. Parar.

## FASE 3 — CONTROLE DO PERSONAGEM EM CENA VAZIA
- Configurar entrada por teclado, movimento em 8 direções, velocidade diagonal normalizada, estados idle/walk, câmera ortográfica/isométrica e ordenação de profundidade por posição dos pés.
- Separar coordenadas do mundo e projeção de tela; colisão provisória simples, debug opcional.
**Testes:** 8 direções, diagonal sem bônus de velocidade, transições sem travar, orientação correta, FPS estável na máquina de teste.
**Aceite:** cena de teste com chão neutro, captura de cada direção, relatório. Parar.

## FASE 4 — MAPA: PLANTA E GEOMETRIA DO CÔMODO REFERÊNCIA
**A base do vídeo e imagens enviadas é obrigatória. Não improvisar um novo cômodo sem validar.**
- Inspecionar vídeo, listar portas, janelas, sofá, painel, TV, aparador e demais itens realmente visíveis; identificar ambiguidades e solicitar confirmação.
- Desenhar planta simplificada e grid de colisão, posição da câmera, caminhos e medidas relativas (não inventar dimensões reais).
- Produzir 1 cômodo piloto em camadas independentes: piso, paredes de fundo, paredes frontais, móveis, portas, objetos e luzes.
- Apresentar layout esquemático ANTES da arte final; após aprovação, criar artes finais com mesmo estilo do protagonista.
**Testes:** escala coerente, portas transitáveis, circulação livre, geometria e perspectiva sem inconsistências, caminhos alcançáveis.
**Aceite:** planta validada + cena jogável do cômodo. Parar.

## FASE 5 — PAREDES CORTADAS E TRANSPARÊNCIA DINÂMICA
- Paredes desenhadas cortadas na altura visual aprovada; separar segmentos e objetos que podem ocultar o personagem.
- Tornar transparente SOMENTE o elemento que intercepta a linha visual câmera-personagem; sugestão de opacidade 15–25% e transição 0,2–0,3 s, ajustável.
- Preservar colisões mesmo quando invisível; evitar que paredes do fundo sumam sem necessidade.
- Tratar quinas, portas, móveis altos e retorno de opacidade; considerar sistema por sala/segmento.
**Testes:** personagem atrás de cada parede, atravessar porta, aproximar/afastar, entrar/sair de sala, ficar parado atrás de parede, câmera em movimento, flicker zero, colisão persistente.
**Aceite:** gravação de todos os casos, comportamento previsível e sem piscadas. Parar.

## FASE 6 — MÓVEIS, COLISÕES E INTERAÇÃO
- Inserir sofá, mesa, TV, balcão, portas e objetos coerentes com a referência, separadamente, com oclusão/ordem por Y quando apropriado.
- Interação contextual (tecla única), zonas de alcance, prompt e feedback, sem mecânicas narrativas complexas.
**Testes:** não atravessar sólidos, passar atrás/na frente corretamente, interagir apenas em alcance, sem objetos flutuando. Parar.

## FASE 7 — LUZ NEON E POLIMENTO DO CÔMODO
- Criar luzes e emissivos neon, reflexos seletivos e sombras coerentes com a arte pintada; preservar legibilidade do protagonista e colisões.
- Otimizar transparências e luzes; opção de qualidade gráfica se necessário.
**Testes:** visibilidade de personagens, estabilidade de FPS, ausência de cintilação e saturação excessiva, comparação com moodboard. Parar.

## FASE 8 — EXPANSÃO PARA BALADA
- Reutilizar módulos aprovados para entrada/fila, bar, pista, lounge, VIP e banheiros; cada sala aprovada isoladamente antes de conectar.
- Criar NPCs e interações só após validar mapa e navegação; depois introduzir diálogos, escolhas, reputação e eventos.
**Testes:** navegação entre salas, spawn, ordem de render, desempenho com NPCs, transparência sem conflitos, regressão de cenas anteriores. Parar em cada subetapa.

## PADRÃO DE PASTAS RECOMENDADO PARA O PROJETO
```
project/
  assets/characters/protagonist/source/
  assets/characters/protagonist/directions/
  assets/characters/protagonist/animations/
  assets/maps/room_01/{floor,walls,props,lighting}/
  scenes/tests/
  scenes/characters/
  scenes/maps/
  scripts/characters/
  scripts/camera/
  scripts/occlusion/
  tests/
  docs/acceptance/
  docs/decisions.md
```

## PADRÃO DO RELATÓRIO DE ENTREGA POR FASE
- Fase e versão/commit:
- Arquivos criados/modificados:
- O que foi implementado:
- Critérios de aceite (PASSOU/FALHOU/NÃO TESTADO):
- Evidências (capturas, vídeo, logs, comandos):
- Problemas pendentes:
- Retestes e regressões:
- Decisões que dependem do usuário:
- **STATUS: AGUARDANDO APROVAÇÃO DO USUÁRIO**

## PRIMEIRA INSTRUÇÃO PARA A IA
'Leia este escopo e inventarie os anexos. Comece SOMENTE pela FASE 0. Não gere uma balada completa, não trate a prancha de sprites como animação pronta, não invente medições do vídeo e não avance para FASE 1 até receber minha aprovação explícita. Entregue relatório e evidências.'
