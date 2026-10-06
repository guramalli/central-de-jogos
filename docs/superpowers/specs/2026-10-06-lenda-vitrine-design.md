# Vitrine da Lenda do Campinho — design

Data: 2026-10-06 · Branch: `lenda-vitrine` (a partir de `main`, `87a4be6`)

## Objetivo

Uma página-vitrine **profissional e animada** para divulgar a Lenda do
Campinho como produto: imprensa, parceiros, a futura página da Steam e quem
baixa a versão para Windows. Sucesso = quem chega entende em segundos o que o
jogo é, se impressiona e clica em **Jogar** ou **Baixar**; a imprensa acha
tudo (ficha, textos, artes) sem precisar pedir.

## Decisões (confirmadas com o dono do jogo)

- Direção visual **cinematográfica** (A), aprovada na prévia em
  `scratch/prototipo/index.html` (abertura + jornada). A prévia é a
  referência de visual e de movimento.
- Endereço próprio: **`/lenda/`** (`www.educacaogamer.com.br/lenda/`).
- **Vitrine pra quem chega:** quem abre `/lenda-do-campinho/` pela primeira
  vez, sem jogador salvo e sem login, é levado à vitrine. Quem já joga entra
  direto no jogo, como hoje.
- Idiomas: **português e inglês**, com botão PT/EN.
- Steam: **"Em breve na Steam"** (sem link de loja e sem preços — a página da
  loja ainda não está pública).
- Contato da imprensa: **guramalli@gmail.com**.
- Paleta: **Indigo do Tailwind** + dourado (mesma da prévia).
- A **tela inicial e a criação de personagem** do jogo são refeitas no mesmo
  padrão visual (Parte 2). O jogo por dentro (mapa, menus, partidas) **não
  muda**.

## Estrutura da página (de cima para baixo)

1. **Barra do topo** (fixa). Transparente sobre a abertura e "vidro" escuro
   depois de rolar. Logo pequeno (só aparece no celular depois de rolar),
   links âncora (A jornada · Trailer · O jogo · Expansão · Imprensa), botão
   PT/EN e botão dourado "Jogar grátis". No celular, os links ficam num menu
   que abre por um botão.
2. **Abertura** — igual à prévia:
   - capa `capa_horizontal` (16:9) no computador e `capa_vertical` (2:3) em
     telas estreitas (proporção ≤ 4:5);
   - entrada da câmera (desfoque/escuro → nítido, 2,6 s), "respiração" lenta,
     paralaxe com o mouse e com a rolagem;
   - brilho pulsando na bola, faíscas douradas saindo da bola, poeira de luz
     subindo, raios de sol girando;
   - selo "Grátis · RPG de futebol para toda a família", logo com quique e
     reflexo, frase, botões **Jogar grátis no navegador** e **Baixar para
     Windows**, plataformas (Navegador · Windows · Português · English) e
     selo **Em breve na Steam**;
   - no celular: logo no céu, frase curta e botões embaixo, sem cobrir o
     garoto.
3. **A jornada** — igual à prévia: a seção prende a tela e a rolagem vertical
   anda 6 capítulos de lado, com o fundo mudando de cor e uma régua de
   progresso. Capítulos:
   1. A Vila do Campinho (`07_vila`)
   2. Uma história de verdade (`04_historia`)
   3. Seu clube, sua carreira (`05_clube`)
   4. Volta ao mundo (`01_toquio`)
   5. Chefões nas arenas (`02_lava`)
   6. Além do mundo — Atlântida, Interestelar, Multiverso (`03_guardiao`)
   Em telas estreitas (< 700 px) a seção não prende a tela: vira uma faixa
   rolável de lado com o dedo (scroll-snap), com a mesma régua.
4. **Trailer** — quadro 16:9 grande com a capa do trailer e um botão de play
   que pulsa. O vídeo (`<video>`, não YouTube) só é baixado no clique; PT ou EN
   conforme o idioma. Legenda curta ao lado/abaixo.
5. **O jogo em 6 destaques** — cartões que entram em cascata ao aparecer e
   inclinam levemente seguindo o mouse (só com mouse):
   - RPG de verdade (nível, dribles, classes, equipamento)
   - Mundo enorme (dezenas de cidades e áreas de caça)
   - Carreira e clube (temporadas, elenco, ligas)
   - Agência de talentos (descobrir e formar jogadores)
   - Para toda a família (sem sangue, sem palavrão, sem caixas de recompensa
     pagas)
   - Grátis até o nível 195
6. **Galeria** — as 8 capturas em mosaico; clique abre em tela cheia
   (lightbox) com setas, teclado (← → Esc) e arrastar no celular.
7. **Expansão Fim de Jogo** — bloco com fundo de estrelas em movimento e
   tons violeta: Atlântida, Área Interestelar e Multiverso, do nível 195 ao
   600+, selo "Em breve na Steam". Sem preços.
8. **Chamada final** — a capa de novo como fundo, "Comece sua lenda hoje" e
   os botões Jogar · Baixar · Em breve na Steam.
9. **Kit de imprensa** —
   - ficha técnica: Desenvolvedor e distribuidora Educação Gamer · Lançamento
     em breve (Steam) / disponível no navegador · Plataformas: navegador e
     Windows · Preço: grátis para jogar · Idiomas: português e inglês ·
     Gênero: RPG, futebol, aventura, para toda a família;
   - descrição curta e longa (textos da loja), cada uma com botão "Copiar";
   - downloads: kit completo em ZIP + logo PNG separado;
   - contato: guramalli@gmail.com.
10. **Rodapé** — © 2026 Educação Gamer · Direitos autorais e privacidade
    (`/lenda-do-campinho/direitos.html`) · link para o site.

Botões e destinos:
- Jogar → `/lenda-do-campinho/?jogar=1` (o parâmetro também marca a vitrine
  como vista — ver Entrada do jogo).
- Baixar para Windows → `/lenda-do-campinho/baixar/LendaDoCampinho.exe`.
- Em breve na Steam → selo, sem link.

## Textos

- Português: base nos textos da prévia e na descrição da loja
  (`lenda-steam/loja/previa_pagina/index.html`).
- Inglês: tradução fiel, seguindo **sempre** `lenda-steam/i18n/termos_oficiais.md`
  (ex.: Campinho Village, Sandlot League). O nome do jogo não se traduz.
- Todos os textos ficam num dicionário único (`textos.js`) com as mesmas
  chaves em PT e EN; o HTML marca cada texto com `data-t="chave"`.
- Idioma inicial: `?lang=pt|en` > escolha guardada > idioma do navegador
  (`en*` → EN, o resto → PT). A troca não recarrega a página, atualiza
  `<html lang>`, o título e o trailer.

## Entrada do jogo (vitrine pra quem chega)

Um script pequeno, `lenda-do-campinho/js/vitrine_entrada.js`, carregado de
forma síncrona no `<head>` de `/lenda-do-campinho/index.html` (antes de
qualquer outro script e do CSS do jogo, para não piscar a tela do jogo),
decide. Ele fica **dentro da pasta do jogo** de propósito: a versão Steam
copia essa pasta, então o arquivo existe lá também (e a regra 1 impede o
redirecionamento).

Redireciona para `/lenda/` **somente se todas** forem verdadeiras:
1. o endereço é web real: `location.protocol` é `http:` ou `https:` **e** o
   host é `educacaogamer.com.br`, `www.educacaogamer.com.br`, `localhost` ou
   `127.0.0.1` (a versão Steam/Electron nunca redireciona);
2. não existe `rac_save_v2`, `rac_save_v1` nem nenhuma chave começando com
   `rac_save_conta_` no `localStorage`;
3. não existe `eg_token` (não está logado no site);
4. não existe a marca `lenda_vitrine_vista`;
5. a URL não tem `?jogar` (nem qualquer outro parâmetro — links com
   parâmetro, como `?volta=`, vêm de dentro do site e vão direto ao jogo).

Se `?jogar` estiver na URL, o script grava `lenda_vitrine_vista` e não
redireciona. A vitrine também grava `lenda_vitrine_vista` ao abrir. Qualquer
erro (armazenamento bloqueado etc.) = **não redireciona**.

É um script clássico (sem `import`/`export`), que lê `location` e
`localStorage` e chama `location.replace("/lenda/")`. Os testes executam o
**próprio arquivo** com `node:vm`, passando `location`/`localStorage` de
mentira, e conferem se `replace` foi chamado — teste e jogo usam exatamente o
mesmo código.

A tela inicial do jogo ganha um link discreto **"Conheça o jogo"** para
`/lenda/`.

O redirecionamento vai num **commit separado** e só é publicado depois que a
vitrine estiver no ar e conferida.

## Parte 2 — tela inicial e criação do jogo no mesmo padrão

`/lenda-do-campinho/` (tela de entrada + criação de personagem) passa a
seguir o visual da vitrine. **O jogo depois de "Continuar"/"Nascer!" não
muda.**

### Base visual compartilhada

Dentro da pasta do jogo (a versão Steam só copia essa pasta e não pode buscar
nada da internet):
- `lenda-do-campinho/css/marca.css` — cores (Indigo do Tailwind + dourado),
  fontes, botões dourado/vidro com reflexo, painel de vidro, "chips",
  entradas em cascata, regras de "reduzir movimento".
- `lenda-do-campinho/js/capa_viva.js` — a abertura animada (palco 16:9 ou
  2:3, câmera, brilho da bola, faíscas, poeira de luz, raios, paralaxe), como
  um componente: `CapaViva.monta(elemento, { arte, bola, sol, ... })`.
- `lenda-do-campinho/a/capa.webp` e `capa_vertical.webp` — a arte da capa.

A **vitrine usa esses mesmos arquivos** (`/lenda-do-campinho/css/marca.css`,
`/lenda-do-campinho/js/capa_viva.js`, as capas), então as duas páginas ficam
iguais por construção.

### Tela inicial

- Fundo: a capa viva (no lugar da arte parada `titulo.webp`), com véu escuro
  à direita para o painel.
- Esquerda: logo (quique + reflexo) e a frase.
- Direita: painel de **vidro escuro** (no lugar de papel/madeira) com:
  - cartão do jogador (retrato, nome, nível, posição, lugar) + **Continuar**
    dourado com brilho; sem save, "Comece sua lenda" + **Criar meu jogador**;
  - avisos de conta/nuvem/escolha de save em vidro;
  - "Explore" em blocos com ícone que entram em cascata e inclinam no mouse.
- Barra do portal ("Voltar ao Educação Gamer", "Entrar na conta") em vidro.
- Link novo **"Conheça o jogo"** → `/lenda/` (fica com os blocos Explore).
- Celular: cartão do jogador primeiro, logo pequeno no céu, blocos 4 por
  linha sem a linha de explicação.

### Criação de personagem

- Mesmo fundo, mais escuro.
- Retrato do boneco grande à esquerda, com luz e leve balanço.
- Opções (corpo, pele, cabelo, cor do cabelo, camiseta, parte de baixo,
  óculos) em "chips" de vidro; o escolhido em dourado.
- Classes em cartões com ícone e descrição; a escolhida com borda dourada.
- Campo do nome em vidro; **Nascer!** como o botão dourado grande; Voltar em
  vidro.
- Celular: retrato em cima, opções embaixo, "Nascer!" sempre visível no fim.

### O que não muda (contrato)

- Todos os ids e atributos usados pelos scripts continuam existindo e com o
  mesmo papel: `#inicio`, `.inicio-caixa`, `#inicioMenu`, `#btnContinuar`,
  `#btnNovo`, `#btnHistoria`, `[data-abre]`, `#resumoSave`, `#criacao`,
  `#retratoCriacao`, `#inpNome`, `#opCorpo`, `#opPele`, `#opCabelo`,
  `#opCorCabelo`, `#opRoupa`, `#opBaixo`, `#opRosto`, `#opClasse`,
  `#btnVoltar`, `#btnNascer`, `#contaEscolha`, `.cad-cartao`,
  `.nuvem-caixa`, `.portal-barra`.
- O `inicio.js` continua reorganizando os mesmos blocos (cartão, avisos,
  Explore) e só ganha classes/elementos de enfeite; a lógica de saves, conta
  e nuvem não é tocada.
- `inicio.css` é reescrito (mesmos seletores-raiz `#inicio.ini-v2`), em cima
  do `marca.css`.

## Animações (regras gerais)

- Tudo baseado em tempo (não em quadros): mesmo ritmo em telas de 60, 120,
  144 ou 360 Hz.
- Partículas e loops param quando a seção sai da tela
  (`IntersectionObserver`) e quando a aba fica oculta.
- `prefers-reduced-motion: reduce`: sem partículas, sem paralaxe, sem
  câmera; a jornada vira lista vertical; tudo legível e clicável.
- Sem bibliotecas externas (JS e CSS próprios).

## Arquivos

```
frontend/public/lenda/
  index.html
  css/vitrine.css
  js/vitrine.js          jornada, galeria, trailer, menu, destaques (usa capa_viva.js)
  js/textos.js           dicionário PT/EN
  js/idioma.js           escolha e troca de idioma
  css/vitrine.css        só o que é da vitrine (em cima do marca.css)
  a/                     webp gerados (logo, capturas, miniaturas, OG)
frontend/public/lenda-do-campinho/
  css/marca.css          base visual compartilhada (novo)
  js/capa_viva.js        abertura animada compartilhada (novo)
  a/capa.webp, a/capa_vertical.webp (novos)
  css/inicio.css         reescrito (parte 2)
  js/inicio.js           só ganha classes/enfeites (parte 2)
  index.html             liga marca.css e capa_viva.js; link "Conheça o jogo"
  video/trailer_pt.mp4, trailer_en.mp4, poster.webp
  imprensa/lenda-do-campinho-kit-imprensa.zip, logo.png
frontend/tools/vitrine_lenda.py   gera a/, video/ e imprensa/ a partir de lenda-steam/loja
frontend/tests/lenda/*.test.js    testes node --test
```

Alterações fora da pasta:
- `frontend/vercel.json`: redirect `/lenda` → `/lenda/`; rewrite `/lenda/` →
  `/lenda/index.html` (antes do catch-all); `mp4` e `zip` na regra de cache
  de arquivos.
- `frontend/public/sitemap.xml`: entrada de `/lenda/`.
- `frontend/public/lenda-do-campinho/js/vitrine_entrada.js` (novo) e
  `frontend/public/lenda-do-campinho/index.html`: script de entrada no
  `<head>` e link "Conheça o jogo" (commit separado).
- `frontend/package.json`: script `test` = `node --test "tests/**/*.test.js"`.

## Mídia e peso

- Abertura: capa ≤ 450 KB (webp 2560 px) no computador, ≤ 260 KB (1200 px) no
  celular, logo ≤ 120 KB. Carregamento inicial total (HTML+CSS+JS+imagens da
  abertura+fontes) **≤ 1 MB**.
- Demais imagens com `loading="lazy"`; capturas webp 1280 px (miniaturas
  640 px na galeria).
- Trailers: 720p H.264, ~10–12 MB cada, gerados com o ffmpeg do
  `imageio-ffmpeg`; `preload="none"`.
- Kit de imprensa: capas e capturas em JPG de alta qualidade + logo PNG.
- Imagem de compartilhamento (Open Graph) 1200×630 a partir da capa.

## SEO e compartilhamento

`<title>`, `description`, Open Graph e Twitter Card (PT; o título muda com o
idioma na tela), `canonical` para `/lenda/`, favicon do site.

## Fora do escopo

Página da loja Steam em si; preços e DLCs à venda; o jogo por dentro (barra
do topo, painéis, mapa) — só a tela inicial e a criação mudam; o site `v2` e
o clássico; a paleta Indigo no resto do site.

## Testes e verificação

1. `node --test` cobre: `vitrine_entrada.js` em todas as combinações das 5
   condições (incluindo armazenamento que lança erro e hosts da Steam);
   dicionário com as mesmas chaves em PT e EN e nenhum texto vazio; cálculo
   de progresso da jornada (limites 0 e 1, seção menor que a tela).
2. No navegador (preview local), em 1440×900, 1024×768, 768×1024 e 390×844:
   sem rolagem lateral, abertura sem cobrir o garoto no celular, jornada,
   trailer abre e toca, galeria (setas, Esc, arrastar), troca PT/EN em todos
   os textos, links e botões com o destino certo, console sem erros.
3. Com "reduzir movimento" emulado: nada se mexe e tudo continua legível.
4. Peso inicial ≤ 1 MB medido na aba de rede.
5. Entrada do jogo: abrir `/lenda-do-campinho/` sem save → vitrine; clicar
   Jogar → jogo sem voltar à vitrine; com `rac_save_v2` → jogo direto; com
   `eg_token` → jogo direto.
6. Tela do jogo (parte 2), em 1440×900 e 390×844: sem save (Criar meu
   jogador → criação completa → Nascer! entra no jogo); com save (cartão com
   retrato e Continuar entra no jogo); com dois saves (a escolha aparece no
   cartão); todos os blocos Explore abrem o que abriam antes. Um teste
   automático lista os ids/seletores do contrato e confere que todos
   continuam no `index.html`.
7. Versão Steam: rodar a checagem do `monta_steam` (nada vindo da internet)
   sobre a pasta do jogo.
8. **O dono aprova as duas páginas no navegador dele antes do push.**
