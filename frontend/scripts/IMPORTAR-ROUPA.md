# Importar roupa nova no personagem modular

Instruções para o Claude Code (e para quem mais for importar roupas) no projeto THE LAST DANCE.

## Instalação (uma vez)

Coloque `importar-roupa.mjs` e este arquivo em `frontend/scripts/` e rode, na pasta `frontend`:

```
npm install --save-dev pngjs
```

## Quando chegar uma roupa nova

A roupa precisa ter sido desenhada no **kit de molde**: uma pasta (ou .zip) com as subpastas
`1_frente`, `2_costas`, `3_lado_direito`, `4_lado_esquerdo` e, dentro delas, PNGs 1024x1536 chamados
`roupa_<peça>.png` (ex.: `roupa_tronco.png`, `roupa_coxa_esq.png`, `roupa_braco.png`).

1. Se veio em .zip, extraia numa pasta temporária fora de `public/` (ex.: `frontend/roupas_novas/<nome>/`).
2. Na pasta `frontend`, rode:
   ```
   node scripts/importar-roupa.mjs roupas_novas/<nome> --id <id_sem_espacos> --nome "<Nome bonito>"
   ```
   Exemplo: `node scripts/importar-roupa.mjs roupas_novas/calca_cargo --id calca_cargo --nome "Calça cargo"`
3. Leia os **avisos** do script: PNG com nome de peça errado, vista faltando, tamanho diferente de 1024x1536.
4. Confira abrindo `public/thelastdance/personagem_modular/teste.html`. Vai aparecer um botão para a
   roupa nova; ande nas 4 direções com ela vestida.
5. No jogo, use `heroi.vestir('<id>')` / `heroi.tirar('<id>')`.

## Opções úteis

| Opção | Quando usar |
|---|---|
| `--contorno 0` | A arte da roupa **já tem** contorno preto grosso (não desenhar outro). Padrão: 8 px. |
| `--contorno 5` | Contorno mais fino. |
| `--escurecer 0.7` | O braço/perna do lado de lá (nas laterais) está claro demais. Padrão: 0.8. |
| `--substituir` | Reimportar uma roupa que já existe (mesmo `--id`). |
| `--nao-registrar` | Gerar só a pasta e o `roupa.json`, sem mexer no `dados.js`. |
| `--pacote <pasta>` | Se o personagem_modular estiver em outro lugar. |

## O que o script faz sozinho
- Prende cada `roupa_<peça>.png` no osso da peça de mesmo nome, logo acima dela (z da peça + 0.5).
- Desenha o contorno preto do estilo do personagem só nas bordas de fora (sem emenda nas juntas).
- Nas laterais, cria a cópia escurecida para o braço/perna/pé do lado de lá.
- Recorta os PNGs, salva em `personagem_modular/roupas/<id>/`, escreve `roupa.json` e registra a roupa
  em `dados.js` (o jogo e o `teste.html` já enxergam a roupa nova).

## Quando o script NÃO resolve (precisa de ajuste manual)
- **PNGs que não são 1024x1536** ou peças soltas numa folha (como a folha da jaqueta de couro): a
  roupa não foi feita no molde. Cada peça precisa ser posicionada à mão (escala, rotação, ponto de
  junta) antes. O melhor é refazer a roupa em cima do kit de molde.
- **Peça que precisa ir por cima de outra parte do corpo** (ex.: gola alta cobrindo o queixo, cabelo
  por dentro do capuz): ajuste o `z` no `roupa.json` ou use `"substituir"`, como a jaqueta faz com a
  cabeça na vista de frente (veja `roupas/jaqueta_couro/roupa.json`).
- **Casaco comprido, saia, capa** (passam por cima da junta do quadril): precisam de tratamento à
  parte, porque um pedaço só não dobra junto com as duas pernas.
