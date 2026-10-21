# Intempéries: arte (out/2026)

Arte do modo com risco (`?risco`): fachadas avariadas, chuva, vento, destroços, poeira e extras.
Tudo em RGBA, pixels nítidos (sem suavizar). Ao desenhar, use `imageSmoothingEnabled = false` e
posições inteiras, como o resto da cena. 1 pixel da imagem = 1 pixel de mundo.
Fontes, candidatos e scripts ficam em `pixellab/intemperies/` (não publicar): `gen_fx.py` (chuva,
respingo, rajada), `gen_extra.py` (neve, granizo, aurora), `fin_fac.py` (monta as fachadas).

## A. Fachadas avariadas: `assets/fachadas/`

| arquivo | tamanho | uso |
|---|---|---|
| `<era>-trincada.png` (era 0–6) | 240×96, opaca | avaria leve: trincas saindo dos cantos das janelas, 1 a 3 vidros rachados |
| `<era>-quebrada.png` (era 0–6) | 240×96, opaca | avaria pesada: buracos com vergalhão (0–1), tijolos soltos e floreiras tortas (0), vidros estilhaçados (2), painéis rasgados com estrutura e fios à mostra (3, 5, 6), manchas de poeira e fuligem |

- Mesmo tamanho, mesma silhueta (opaca, como a original) e janelas no mesmo lugar de `FAC_WIN`
  (`src/render/tower.js`). Usar no lugar de `fachadas/<era>.png` no andar avariado
  (ex.: integridade < 60% → trincada; < 25% → quebrada). Feitas editando a própria fachada no PixelLab.
  Nas trincadas, o que não é trinca voltou exatamente à cor original.
- **Janelas acesas:** `<era>-acesa.png` continua servindo, mas acender por cima apaga a
  avaria do vidro. Sugestão: na quebrada, não acender as janelas, ou acender só metade; na trincada, tanto faz.
  Janelas que **sumiram** na quebrada (não recortar a acesa nelas):
  - era 3: 2ª janela (x 73) virou painel rasgado;
  - era 5: 2ª escotilha (x 76) virou painel rasgado;
  - era 6: 2ª e 3ª escotilhas (x 75 e x 141) ficaram sob a chapa rasgada.
- **De longe** (`farFacade`): basta reduzir a versão avariada do mesmo jeito (cache por era + estado).
- Os rasgos das eras 0 e 6 e as trincas de várias eras tocam a borda de cima ou de baixo; empilhados,
  andares avariados vizinhos não emendam a trinca exatamente (fica como trinca nova em cada andar).

## B. Chuva densa

| arquivo | tamanho | quadros | uso |
|---|---|---|---|
| `chuva-perto.png` | 128×128 | 1 (textura) | gotas compridas e claras (12–22 px), inclinadas 1 px para a direita a cada 4 px para baixo. Emenda nos 4 lados. Encher a tela com `createPattern` e rolar **240 px/s para baixo e 60 px/s para a direita** (a mesma inclinação das gotas), alfa 0,8. Na tempestade, desenhar duas vezes deslocada (64, 37) para dobrar a densidade. |
| `chuva-longe.png` | 128×128 | 1 (textura) | gotas curtas e fracas (4–9 px), mesma inclinação. Atrás da torre, **120 px/s para baixo e 30 px/s para a direita**, alfa 0,6. Para dar profundidade, desenhar também em escala 2 (pixels dobrados). |
| `respingo-0..3.png` | 12×6 | 4 | gota batendo na laje ou no chão. Âncora no meio da base (6, 6). ~12 fps, uma vez só. Sortear vários por segundo no topo da laje, nos peitoris e no chão. |

As texturas estão em espaço de tela; com zoom, dá para manter 1:1 na tela (chuva não precisa seguir o zoom).

## C. Vento aparente

| arquivo | tamanho | quadros | uso |
|---|---|---|---|
| `rajada-0..5.png` | 96×32 | 6 | traço de vento branco semitransparente que entra pela esquerda, enrola numa espiral e some. Âncora à esquerda no meio (0, 20). ~10 fps, uma vez só, andando para a direita ~80 px/s enquanto toca (espelhar para vento da direita). Várias ao mesmo tempo em alturas diferentes, mais no topo da torre. |
| `detrito-<nome>-0..3.png` | 12–15 px | 4 | coisas levadas pelo vento, cada quadro girado 90° (o tamanho muda 1 px entre quadros: desenhar pelo centro). ~8–12 fps em loop, voando com a rajada e oscilando para cima e para baixo. Nomes: `folha`, `folha-seca`, `papel`, `saco`, `tabua`, `lona` (azul), `lona-laranja`. |

## D. Terremoto e desabamento

| arquivo | tamanho | quadros | uso |
|---|---|---|---|
| `entulho-0..5.png` | 18–20 px | 1 cada | 0 tijolo quebrado · 1 concreto com vergalhão · 2 cacos de vidro · 3 viga retorcida · 4 cascalho de tijolo e concreto · 5 laje quebrada com vergalhão pendurado. Âncora no centro. Cair com gravidade e girar com `ctx.rotate` em passos de 90° (ou espelhar a cada quique) para não borrar. |
| `entulho-6..13.png` | 14–20 px | 1 cada | extras: 6 meio tijolo · 7 concreto pequeno com vergalhão · 8 caco de vidro grande · 9 painel branco rebitado (eras 3 e 5) · 10 chapa roxa (era 6) · 11 painel de vidro rachado (era 2) · 12 bloco de concreto · 13 cacos de tijolo. Sortear pela era do andar. |
| `poeira-0..4.png` | 48×32 | 5 | nuvem de poeira que cresce e some. Âncora no meio da base (24, 31). ~7 fps, uma vez só. Usar no pé da torre no terremoto e nos andares que caem; várias lado a lado ao longo dos 240 px do andar. |

## E. Extras

| arquivo | tamanho | quadros | uso |
|---|---|---|---|
| `raio-0..2.png` | 56×200 | 3 | 0 descendo, 1 inteiro com ramos, 2 branco sumindo. Ponta de baixo em (27, 197). ~12 fps; junto com o quadro 1, um clarão branco na tela (alfa 0,3 por 2 quadros). Esticar na vertical em múltiplos inteiros (×2, ×3) para raios maiores. |
| `granizo-0..2.png` | 4×4 | 1 cada | pedrinhas de gelo. Cair reto e rápido (~300 px/s), quicando uma vez na laje. |
| `neve-perto.png` / `neve-longe.png` | 128×128 | 1 (texturas) | como a chuva: emendam nos 4 lados. Perto: 40 px/s para baixo, balanço lateral `sin(t)`×10 px, alfa 0,9. Longe: 20 px/s, alfa 0,6. |
| `onda-0..5.png` | 320×120 | 6 | tsunami de lado, crista quebrando para a esquerda. 0–3 a onda sobe do nível do mar; 4–5 avança e afunda. Base da onda na última linha (âncora no meio da base: 160, 119). ~6 fps. |
| `onda-espuma.png` | 320×120 | 1 | onda menor coberta de espuma, para o momento em que a onda arrebenta (depois de `onda-3`) ou para o mar agitado. |
| `meteoro-0..2.png` | 48×24 | 3 | meteoro descendo para a esquerda com rastro de fogo. Âncora na cabeça (~10, 18). Trocar de quadro a ~10 fps para o fogo tremer, e mover na diagonal do rastro (para baixo e para a esquerda). |
| `aurora.png` | 256×64 | 1 (faixa) | aurora para a tempestade solar; emenda na horizontal. Repetir na largura e rolar ~6 px/s para o lado, alfa pulsando entre 0,5 e 0,9, de preferência com `globalCompositeOperation = 'lighter'`. |

## Créditos e origem

- Fachadas avariadas: edição das fachadas existentes no PixelLab (Pro Flash).
- Entulho e detritos: PixelLab (objetos de 1 direção, candidatos escolhidos à mão).
- Poeira e raio: efeitos do PixelLab (VFX, salvos como "Torre poeira" e "Torre raio").
- Onda: PixelLab (Pixen). Meteoro: PixelLab (Pro).
- Chuva, respingos, rajadas, neve, granizo e aurora: desenhados por código (scripts em `pixellab/intemperies/`).
