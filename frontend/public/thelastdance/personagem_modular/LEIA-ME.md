# Personagem modular (HTML / canvas)

O personagem é montado em tempo real a partir das peças (cabeça, tronco, braços, pernas) presas
a um esqueleto. As roupas são camadas extras presas aos mesmos ossos, então **qualquer roupa
funciona com qualquer animação**, sem gerar spritesheet.

## Arquivos

| Arquivo | O que é |
|---|---|
| `personagem-modular.js` | O player. Sem dependências: funciona com `<script>` ou `import`/`require`. |
| `dados.js` | Esqueleto + animações + roupas num só arquivo (`window.PERSONAGEM_MODULAR`). |
| `rig.json`, `animacoes.json`, `roupas/*/roupa.json` | Os mesmos dados separados, para quem preferir `fetch`. |
| `personagem/<vista>/*.png` | Peças do corpo nas 4 vistas. |
| `roupas/jaqueta_couro/` | A jaqueta (4 vistas). |
| `roupas/calca_jeans_baggy/` | A calça jeans baggy (4 vistas). |
| `teste.html` | Página de teste: abra no navegador e ande com as setas. Os botões (ou **J** e **C**) vestem e tiram cada roupa. |

Vistas: `frente`, `costas`, `lado_direito`, `lado_esquerdo`
Animações: `andar` (8 quadros, 10 fps) e `parado` (8 quadros, 5 fps)

## Como usar no jogo

```html
<script src="thelastdance/personagem_modular/dados.js"></script>
<script src="thelastdance/personagem_modular/personagem-modular.js"></script>
<script>
  const heroi = new PersonagemModular(window.PERSONAGEM_MODULAR, 'thelastdance/personagem_modular/');
  await heroi.carregar();
  heroi.vestir('jaqueta_couro');            // tirar: heroi.tirar('jaqueta_couro')

  // dentro do loop do jogo:
  heroi.olharPara(dx, dy);                  // escolhe a vista pela direção do movimento
  heroi.tocar(andando ? 'andar' : 'parado');
  heroi.atualizar(dt);                      // dt em segundos
  heroi.desenhar(ctx, x, y, 0.25);          // (x, y) = posição dos PÉS; 0.25 = 384 px de altura
</script>
```

O segundo parâmetro do construtor é o caminho da pasta `personagem_modular/` como o navegador
enxerga. Em projeto Vite/React, tudo que está em `public/` é servido a partir da raiz do site, então
com a pasta em `public/thelastdance/personagem_modular/` o caminho é
`'/thelastdance/personagem_modular/'`.

Em React (ou outro framework com módulos), pode ser assim:
```js
import '/thelastdance/personagem_modular/personagem-modular.js'; // ou copie o arquivo para src/
const resp = await Promise.all(['rig.json', 'animacoes.json', 'roupas/jaqueta_couro/roupa.json']
  .map(f => fetch('/thelastdance/personagem_modular/' + f).then(r => r.json())));
const heroi = new window.PersonagemModular(
  { rig: resp[0], animacoes: resp[1], roupas: { jaqueta_couro: resp[2] } },
  '/thelastdance/personagem_modular/');
```

### Outras funções
- `heroi.definirVista('costas')`: força uma vista.
- `heroi.alternar('jaqueta_couro')`: veste ou tira (retorna `true` se ficou vestido).
- `heroi.adicionarRoupa(objetoDoRoupaJson)`: registra uma roupa nova em tempo de execução.
- `heroi.velocidade = 1.5`: acelera a animação (ex.: correr).
- `heroi.pixelado = false`: suaviza as peças ao girar (o padrão é pixelado, combinando com a arte).
- Vários personagens: crie várias instâncias. As imagens são compartilhadas na memória.

## Como funciona uma roupa (`roupa.json`)

```json
{ "id": "jaqueta_couro", "nome": "Jaqueta de couro",
  "vistas": {
    "frente": {
      "camadas": [ { "osso": "tronco", "z": 12.5, "img": "roupas/jaqueta_couro/frente/tronco_0.png", "x": 316, "y": 708 } ],
      "substituir": { "cabeca": { "z": 12.9, "img": "...cabeca_sem_pescoco.png", "x": 150, "y": 78 } }
    } } }
```
- `osso`: em qual osso a camada fica presa (ela acompanha o movimento dele).
- `z`: ordem de desenho. As peças do corpo usam números inteiros (veja `rig.json`), e a roupa usa um
  valor entre eles: `tronco` = 12, então a jaqueta = 12.5 fica logo acima da camiseta.
- `x`, `y`: posição da imagem no canvas padrão 1024x1536 da vista (o mesmo do kit de molde).
- `substituir` (opcional): troca uma peça do corpo enquanto a roupa está vestida. Aqui a cabeça
  passa para cima da gola, para a barba não ficar coberta.

Roupa desenhada no **kit de molde** (como a calça) entra sem ajuste manual: cada `roupa_<peça>.png`
vai para o osso da peça de mesmo nome, e as laterais ganham a perna/braço do lado de lá automaticamente.

Roupa nova = pasta nova em `roupas/` + `roupa.json` + registrar em `dados.js` (ou com
`adicionarRoupa`). Nada da animação muda.

## Testes automáticos
`teste.html?test=1` limita o teste a 30 fps (para poupar CPU em testes automatizados no navegador).
Sem o parâmetro, a página roda normal.
