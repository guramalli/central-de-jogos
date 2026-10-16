# Inventário dos anexos — kit "Noite Sem Fim" v1.0 (FASE 0)

Dados técnicos gerados por `tools/audit_assets.py` (saída completa em `docs/acceptance/fase_0/inventario.json`).
As observações visuais foram feitas por inspeção das imagens ampliadas (2×), sem ferramenta de medição.
Nenhum arquivo foi alterado, recortado ou descartado. As cópias em `reference/` têm o mesmo SHA-256 do zip original.

Legenda: **[OBS]** observável no arquivo · **[SUP]** suposição/interpretação, precisa de confirmação.

## Resumo técnico

| Arquivo | Formato | Resolução | Proporção | Alpha | Tamanho | No git? |
|---|---|---|---|---|---|---|
| 01_personagem/personagem_conceito.png | PNG RGB 8 bit | 1024×1536 | 2:3 | **não** | 2,8 MB | sim |
| 01_personagem/spritesheet_referencia_NAO_PRONTO.png | PNG RGB 8 bit | 1983×793 | ~2,5:1 | **não** | 2,8 MB | sim |
| 02_mapas/balada_isometrica_referencia.png | PNG RGB 8 bit | 1536×1024 | 3:2 | não | 2,7 MB | sim |
| 02_mapas/moodboard_locais.png | PNG RGB 8 bit | 1536×1024 | 3:2 | não | 3,5 MB | sim |
| 03_referencias/conceito_geral.png | PNG RGB 8 bit | 1312×1199 | ~1,09:1 | não | 3,0 MB | sim |
| 03_referencias/foto_referencia_personagem.jpeg | JPEG RGB, 72 dpi | 1080×1440 | 3:4 | não | 0,3 MB | **não** (privado) |
| 04_video/quadros_video_referencia.png | PNG RGB 8 bit | 1440×2559 | ~9:16 | não | 1,6 MB | **não** (privado) |
| 04_video/video_base_comodo.mp4 | H.264 yuv420p, sem áudio | 512×910 (retrato) | ~9:16 | — | 7,8 MB | **não** (privado) |

Por que três arquivos ficam fora do git: a foto é o rosto de uma pessoa real e o vídeo/quadros mostram terceiros
dentro de uma residência. O repositório serve um site público. Eles estão em `reference/privado/` (ignorado pelo git)
e o SHA-256 de cada um está no `inventario.json` para conferir a cópia local. **Decisão pendente do usuário (D-11).**

---

## 1. personagem_conceito.png — arte conceitual aprovada (direção visual)

- [OBS] 1024×1536, sem canal alpha. Fundo de papel bege com rabiscos de textura e sombra de chão pintada sob os pés:
  **não dá para usar diretamente como sprite** (exige recorte manual; o fundo não é uniforme para chroma key).
- [OBS] Corpo inteiro, pose frontal levemente 3/4. Cabeça muito grande (cabelo + rosto ocupam cerca de metade da altura,
  estimativa visual ≈ 2,1 "cabeças" de altura total). Cabelo escuro volumoso e cacheado, barba cheia, sorriso aberto
  mostrando os dentes.
- [OBS] Camisa preta de botão com mangas dobradas, jeans azul, tênis branco, relógio preto no pulso esquerdo do personagem.
- [OBS] Garrafa verde na mão direita do personagem; mão esquerda no bolso. Contorno escuro grosso; textura pintada.
- [OBS] Resolução suficiente para servir de **fonte mestre** do rosto/roupa (o personagem ocupa ~1.500 px de altura).
- Limitação: só existe esta vista. Costas, perfis e diagonais **não existem** em qualidade equivalente.

## 2. spritesheet_referencia_NAO_PRONTO.png — prancha ilustrativa (NÃO é spritesheet de produção)

Confirmado: é ilustrativa, não é uma sequência pronta. Evidência: `docs/acceptance/fase_0/evid_spritesheet_segmentacao.jpg`.

- [OBS] Sem alpha; fundo de papel bege texturizado (RGB mediano 240,225,204); textos de título e legendas
  desenhados na própria imagem, colados nas figuras.
- [OBS] 39 figuras detectadas: 1 conceito grande à esquerda + 38 pequenas.

| Grupo | Quadros | Altura (px)* | Largura (px)* | Variação da linha dos pés |
|---|---|---|---|---|
| Andando (baixo) | 8 | 198–219 | 99–103 | 9 px |
| Parado (frente, lado, costas, cima) | 4 | 183–223 | 99–108 | 37 px (vista "cima" é outra câmera) |
| Andando (lado) | 8 | 209–219 | 102–109 | 2 px |
| Ações (bebendo, conversando, celular, dançando, fumando) | 5 | 201–206 | 100–121 | 1 px |
| Andando (costas) | 7 | 188–197 | 85–89 | 3 px |
| Andando (cima) | 6 | 198–208 | 99–104 | 4 px |

\* Caixa aproximada por segmentação de cor, incluindo a sombra de chão; em dois casos a caixa encosta na legenda.

Problemas encontrados (inspeção visual ampliada):

1. [OBS] **Resolução baixa**: cada figura tem ~85–121 × ~190–220 px. O escopo proíbe sprites de baixa resolução como versão final.
2. [OBS] **Número de quadros inconsistente** entre direções: 8 / 8 / 7 / 6.
3. [OBS] **Sem diagonais**: não há nenhuma vista 3/4 isométrica (NE/NO/SE/SO). Um jogo isométrico precisa delas.
4. [OBS] **"Andando (cima)" mostra o rosto**, ou seja, é uma vista frontal com câmera alta, não o personagem de costas
   subindo. O rótulo conflita com "Parado – cima", que mostra o topo da cabeça.
5. [OBS] **Garrafa duplicada**: em "Andando (costas)" (todos os 7 quadros), "Parado costas", "Parado lado" e no
   8º quadro de "Andando (lado)" o personagem aparece com **uma garrafa em cada mão**; nas vistas de frente há só uma.
6. [OBS] **Cor da camisa varia**: castanha no 1º quadro de "Andando (baixo)", azul-marinho em vários quadros
   (baixo 2–4, cima 6), preta nos demais.
7. [OBS] **Rosto/proporção variam**: o 1º quadro de "Andando (baixo)" tem rosto mais largo e cabeça menor que os outros.
8. [OBS] **Sombra de chão pintada em cada quadro** (o escopo pede sombra separada).
9. [OBS] Apenas um lado do perfil (virado para a direita). Espelhar para a esquerda **inverteria a mão da garrafa e o
   lado do relógio**, o que viola "nenhum objeto muda de mão".
10. [OBS] Ações: "dançando" segura um objeto não identificado (parece uma coxinha/espeto); "celular" mostra um objeto
    verde e um celular vermelho; "fumando" tem cigarro e fumaça fora da caixa.
11. [SUP] Os quadros de caminhada não parecem formar um ciclo com fases de passada regulares (contato/passagem);
    não foi testado em animação porque a fase não autoriza animar.

**Conclusão técnica:** a prancha **não é adequada para uso direto no jogo**. Serve como referência de poses,
expressões, roupa e silhueta para a FASE 1, que terá de produzir vistas novas, limpas, com alpha real e em resolução
de produção.

## 3. foto_referencia_personagem.jpeg — referência facial (privada)

- [OBS] 1080×1440, JPEG. Homem deitado num sofá cinza-claro, foto de cima, sorrindo. Cabelo escuro ondulado,
  barba e bigode, sobrancelhas grossas, dentes à mostra, camiseta cinza (roupa diferente do personagem — irrelevante).
- [OBS] A caricatura do conceito é coerente com a foto (cabelo, barba, formato do sorriso, sobrancelhas).
- Uso: conferir semelhança facial nas vistas novas da FASE 1. Não vai para o jogo.

## 4. balada_isometrica_referencia.png — referência artística (não é mapa navegável)

- [OBS] 1536×1024, imagem única achatada (sem camadas), com legendas de texto sobrepostas.
- [OBS] Vista isométrica/dimétrica com **paredes frontais cortadas baixas** e paredes do fundo inteiras.
- [OBS] Áreas rotuladas: Entrada/Fila (tapete vermelho, pedestais com cordão), Guarda-volumes, Camarotes/Área VIP
  (nível elevado com escada), Pista de dança (DJ, caixas de som, treliça com moving heads, globo), Bar (balcão com
  banquetas e prateleira de garrafas), Banheiros (placas masc./fem.), Lounge (sofás e mesinhas), Saída, letreiros "CLUB"/"VIP"/"BAR".
- [OBS] Paleta neon magenta, violeta, ciano e laranja; piso refletivo; muitas plantas e pilares com luz.
- [SUP] Ângulo de projeção aparenta ser ~2:1 (dimétrico), mas **não foi medido**; a imagem pode ter pequenas
  incoerências de perspectiva por ser ilustração.
- [OBS] Na ampliação, o traço é mais fino/detalhado e com aspecto próximo de pixel art em alguns pontos;
  a direção imutável pede "não usar pixel art" — usar como referência de **layout e clima**, não de técnica de traço.
- Não há escala, grid, colisão nem medidas.

## 5. moodboard_locais.png — referências de ambientes

- [OBS] 1536×1024, 10 painéis: Rua Augusta, Vila Madalena, Balada principal (interior), Itaim Bibi, Moema,
  Padaria pós-balada, Apartamento (início/fim), Transporte, Praia/Ressaca, Outros locais.
- [OBS] O painel "Apartamento" mostra quarto com cama, armário, computador e letreiro "Mais uma noite?".
- [SUP] O cômodo do vídeo (sala de estar) pode corresponder ao apartamento do protagonista — **confirmar (D-14)**.

## 6. conceito_geral.png — universo e direção (não é especificação)

- [OBS] 1312×1199. Mostra o título **"Última Round – Sobrevivendo às nights de SP"**, gênero "Beat 'em up / Ação
  com elementos de RPG", plataformas sugeridas PC/Console/Mobile, atributos (Disposição, Grana, Aparência, Fama, Juízo),
  itens, ambientes e mockups de HUD/diálogo.
- [OBS] **O protagonista desta prancha é outro rosto** (cabelo curto e liso, aparência abatida), diferente do conceito aprovado.
- [OBS] **Conflitos com o escopo mestre (LEIA_PRIMEIRO):**
  - Título "Última Round" × "Noite Sem Fim"; gênero beat 'em up × aventura narrativa.
  - A seção "Personagens e ameaças da noite" trata como ameaça uma "menina com sobrepeso" e uma "menina de esquerda".
    O escopo manda **não tratar aparência física nem posição política, por si, como ameaça**. Prevalece o escopo.
- Uso proposto: só clima, paleta e ideias de HUD/atributos, após confirmação do usuário (D-12).

## 7. video_base_comodo.mp4 e quadros_video_referencia.png — cômodo de referência (privados)

Técnico [OBS]: H.264, 512×910 em retrato, 30 fps, 399 quadros, 13,3 s, sem áudio, câmera na mão com borrão de
movimento e estouro de luz em vários trechos. Resolução baixa para leitura de detalhes.

`quadros_video_referencia.png` [OBS]: 1440×2559, mas **66,7% da imagem é preto vazio** — só o terço superior tem
conteúdo (3 quadros lado a lado: TV, sofá, parede vermelha com porta).

Conteúdo **observável** no vídeo (giro de ~360° pela sala, inspecionado em quadros a cada 0,5 s):

- TV grande na parede, sobre painel de **ripado de madeira**; rack/aparador baixo cinza sob a TV com objeto de vidro decorativo.
- Porta/janela de vidro para **varanda** com cortina clara; na varanda, mesa alta com banquetas e plantas; vista noturna da cidade.
- **Sofá cinza-claro** grande (aparenta retrátil/reclinável) de frente para a TV, mesas laterais pequenas.
- Parede de **textura cimentícia cinza** com escultura de varetas metálicas; **fita de LED vertical** na parede.
- Teto de concreto com vigas e **spots embutidos**.
- **Mesa redonda preta** de pé central com cadeiras/poltronas cinza estofadas; luminária de piso acobreada; planta alta.
- **Parede vermelho-escuro** com quadro pop-art, **porta com puxador vertical longo** e fechadura digital, interruptores.
- **Aparador cinza** com garrafas, petiscos e chaves; segundo painel de ripado de madeira; tapete cinza; tapete claro
  de formato irregular sob a mesa.
- Pessoas presentes (não serão modeladas).

**Suposições / não observável** [SUP]:

- Medidas reais, pé-direito e distâncias: **não inferíveis** (não serão inventadas).
- Se a porta da parede vermelha é a entrada do apartamento (o puxador e a fechadura digital sugerem que sim).
- Se a varanda faz parte do mapa jogável.
- Planta exata: a ordem dos elementos no giro sugere TV/varanda → sofá → jantar → parede vermelha → aparador → TV,
  mas as distâncias entre eles não são confiáveis.
- Quantidade exata de cadeiras e o formato do sofá (L, chaise ou retrátil).

Tudo isso será detalhado na FASE 4, com planta esquemática para aprovação **antes** de qualquer arte.
