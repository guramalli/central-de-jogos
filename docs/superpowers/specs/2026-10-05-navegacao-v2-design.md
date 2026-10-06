# Navegação da v2 — design

Data: 2026-10-05 · Branch: `v2-navegacao` (a partir de `publica-v406`)

## Problema

A v2 (`frontend/v2/`) é a versão principal do site. A navegação confunde em
quatro pontos, todos confirmados pelo dono do site:

1. **Achar os jogos** — Stop, Quiz e Acromania estão no menu; Tribunal,
   Impostor e Lenda do Campinho só aparecem nos cards da página inicial.
2. **Entrar numa partida** — sala pública, fila de espera, sala privada e
   "várias salas" ficam espalhadas pela página do jogo, sem um caminho
   principal.
3. **Menu lotado** — 9 itens no topo (Lobby, Stop, Quiz, Acromania, Ranking,
   Hall da Fama, Missões, Clã, Amigos), sem agrupamento; no celular, 4 itens +
   "Mais".
4. **Páginas perdidas** — Patentes, Novidades, Editar perfil e Várias salas
   só têm links soltos dentro de outras páginas.

## Decisões

- Base: só a v2. O site clássico (`frontend/src/`) não muda.
- Visual mantido: roxo/amarelo, Fredoka/Nunito, botões atuais, variáveis do
  `v2.css`. Muda a estrutura, não a identidade.
- Telas de dentro das partidas (salas do Stop, Quiz, Acromania, Tribunal,
  Mentira e Impostor) não mudam de layout.
- Abordagem escolhida: **central de jogos + 5 seções fixas**, iguais no
  computador e no celular.
- Nenhum endereço novo: as seções reaproveitam os `?pagina=` que já existem,
  e todos os links antigos (convites, salas privadas, mesas, compartilhamentos)
  continuam funcionando.
- Sem mudanças no backend.

## As 5 seções

| Seção | Abre em | Páginas que pertencem a ela |
|---|---|---|
| **Jogar** | `/v2/` | início, `jogar&jogo=…`, `varias`, `privadas`, `tribunal`, `impostor`, `mentira` |
| **Competir** | `?pagina=ranking` | `ranking`, `hall`, `patentes` |
| **Social** | `?pagina=amigos` | `amigos`, `clas`, `cla`, `jogador&id=<outra pessoa>` |
| **Missões** | `?pagina=missoes` | `missoes` |
| **Eu** | `?pagina=jogador&id=<eu>` | `jogador&id=<eu>`, `editar-perfil`, `novidades`, `admin` |

`termos` e `privacidade` não pertencem a nenhuma seção (nenhuma fica marcada).

### Topo (computador, ≥ 1000px)

Logo · Jogar · Competir · Social · Missões · (espaço) · lupa de busca ·
avatar com o nick (= seção Eu). Somem do topo: "Versão clássica" e o botão
Sair (vão para Eu). O selo "beta" ao lado do logo continua.

### Barra do celular (< 1000px)

Jogar · Competir · Social · Missões · Eu (o ícone de Eu é o avatar). Sem
"Mais" e sem a gaveta `v2-mais`. O "Painel Admin" aparece em Eu.

### Contadores

Mesma rota `/avisos` e mesmo ritmo (2 min). Somas por seção:
Social = amigos + mensagens + clã; Missões = missões. O contador aparece no
item da seção, no topo e na barra do celular.

## Páginas

### Jogar (`Inicio.jsx`)

De cima para baixo:

1. **Continuar** — só aparece se houver um último jogo guardado. Mostra o
   logo do jogo, o nome da sala e o botão "Continuar", que leva à mesma sala
   (ou à página do jogo, se a sala não existir mais).
2. **Grade de jogos** — Stop, Quiz, Acromania, Tribunal, Impostor (a lista
   `JOGOS` atual), com "N jogando agora" e o selo "em testes". Acromania some
   quando estiver desativada, como hoje.
3. **Lenda do Campinho** — o `LendaDestaque` atual.
4. **Fila de espera** — os `CardPartidaRapida` atuais.
5. **Praça** — o chat geral, como hoje.
6. Aviso de ranking, Últimas atualizações, Sobre e o bloco beta/feedback
   continuam, em seguida, como hoje.

Sai daqui e vai para Eu: o bloco de boas-vindas com o avatar, o painel do
jogador (patente do mês por jogo e próximo título), a "Próxima peça" e o
`AvisoPecaNova`. O atalho "Painel admin" sai daqui (fica em Eu).

**Último jogo guardado**: o `App.jsx` grava em `localStorage`
(`eg_v2_ultimo_jogo`, JSON `{ jogo, sala, nome, quando }`) sempre que abre uma
sala: `?sala=` → quiz, `?stop=` → stop, `?acro=` → acromania. Leitura e
escrita dentro de `try/catch`; sem o valor, o bloco Continuar não aparece.
`nome` é preenchido pela página do jogo no clique (o App só conhece o id);
quando faltar, mostra só o nome do jogo.

### Página de jogo (`Lobby.jsx`, Stop/Quiz/Acromania)

Modelo único, de cima para baixo:

1. **Cabeçalho compacto** — "← todos os jogos", logo, frase do jogo,
   "N jogando agora" e a patente do mês resumida (ícone, nome, pontos), que
   leva a `?pagina=patentes&jogo=…`. A barra de progresso e os pontos
   vitalícios continuam, na mesma caixa.
2. **Jogar agora** — um bloco com destaque e um botão principal:
   - Stop: a sala pública com mais gente jogando; se nenhuma tiver gente, a
     última sala de Stop guardada; senão, Iniciante.
   - Quiz: a última sala de Quiz guardada, se ainda existir na lista; senão,
     a sala com mais gente no nível escolhido; senão, a primeira da lista.
   - Acromania: o controle de fila de espera (`PartidaRapida`) que já existe
     ocupa este bloco.
   O texto do bloco diz para onde o botão leva ("Sala com mais gente agora:
   Intermediária (7 jogando)").
3. **Escolha a sala** — o conteúdo atual: as salas do Stop por dificuldade,
   o filtro Padrão/Avançada, a grade de temas e as Arenas do Quiz, e as salas
   da Acromania.
4. **Outras formas de jogar** — uma linha de botões secundários: "Criar sala
   privada" e "Entrar com código" (Stop e Acromania, levam a
   `?pagina=privadas&jogo=…`), "Várias salas ao mesmo tempo" (Stop e Quiz,
   `?pagina=varias&jogo=…`). As listas de "Salas dos jogadores" (privadas
   abertas) continuam logo abaixo, quando houver alguma. No celular, a linha
   vira um botão "Outras formas de jogar" que abre/fecha os mesmos botões.
5. **Top 3 do mês** — o `Top3` atual, com o link "ver ranking →".

Sai daqui: a `EscadaPatentes` (continua em Patentes) e a chamada grande de
"Várias salas" (vira botão do item 4).

Tribunal, Impostor e Mentira mantêm as páginas atuais; só recebem o topo novo
com a seção Jogar marcada.

### Competir (`Competir.jsx`, novo)

Topo + abas **Ranking · Hall da Fama · Patentes**, e embaixo a página
correspondente (`Ranking`, `HallFama` e `Patentes` atuais, sem o topo e o
rodapé próprios). A aba é escolhida pelo `?pagina=` (`ranking`, `hall`,
`patentes`); trocar de aba troca o `?pagina=` mantendo o `jogo=`. Cada aba
mantém os seus seletores internos (jogo, mensal/vitalício/clãs), como hoje.

### Social (`Social.jsx`, novo)

Topo + abas **Amigos · Clã** + um campo "Buscar jogador pelo nick" (mesma
busca da lupa do topo, extraída para um componente reutilizável).
`?pagina=amigos` abre Amigos (com `id=` abre a conversa, como hoje);
`?pagina=clas` abre a lista de clãs; `?pagina=cla&id=` abre o clã. A aba Clã
fica marcada nos dois últimos casos. O perfil de outra pessoa
(`jogador&id=<outro>`) continua sendo a página `Perfil` atual, com a seção
Social marcada.

### Eu (`Eu.jsx`, novo)

Abre em `?pagina=jogador&id=<eu>`. De cima para baixo:

1. O resumo que saiu da página inicial: avatar (leva a editar), nick, painel
   do jogador, Próxima peça e `AvisoPecaNova`.
2. Atalhos em lista: Editar avatar e perfil, Novidades, Painel Admin (só
   ADMIN/MODERATOR), Versão clássica do site, Sair da conta (com a confirmação
   atual).
3. O conteúdo atual do `Perfil` de si mesmo (títulos, conquistas, patentes
   por jogo), sem o topo e o rodapé próprios.

`editar-perfil`, `novidades` e `admin` continuam páginas próprias, com a
seção Eu marcada.

## Código

- **`App.jsx`**
  - `secaoDaPagina(local, usuario)` devolve `"jogar" | "competir" | "social" |
    "missoes" | "eu" | null` a partir do `?pagina=`/`id=`, seguindo a tabela
    das 5 seções. É a única fonte de verdade da seção ativa.
  - O `switch` passa `ranking`/`hall`/`patentes` para `Competir` (com a aba),
    `amigos`/`clas`/`cla` para `Social` (com a aba) e `jogador` com o id de
    quem está logado para `Eu`.
  - Grava o último jogo ao abrir uma sala (ver Jogar).
- **`Topo.jsx`**
  - Lista única `SECOES` usada no topo e na barra do celular; remove
    `ITENS`, `NO_CELULAR` e a gaveta "Mais".
  - Descobre a seção ativa sozinho, chamando `secaoDaPagina` com o endereço
    atual. A prop `ativo` deixa de existir e é removida das páginas que hoje
    a passam (só essa linha muda em cada uma).
  - `BuscaJogador` vira um componente exportado, usado também em Social.
- **`Inicio.jsx`**, **`Lobby.jsx`** — conforme as seções acima.
- **`Ranking.jsx`, `HallFama.jsx`, `Patentes.jsx`, `Amigos.jsx`,
  `Clas.jsx`, `Cla.jsx`, `Perfil.jsx`** — ganham a prop `embutido`: quando
  verdadeira, não renderizam o `Topo`, o `Rodape` nem o invólucro
  `v2-app v2-com-menu` (quem embute cuida disso). Sem `embutido`, nada muda.
- **Novos**: `Competir.jsx`, `Social.jsx`, `Eu.jsx`, mais um componente de
  abas simples (`Abas.jsx`) usado por Competir e Social.
- **`v2.css`** — classes novas (`v2-secoes`, `v2-abas`, `v2-continuar`,
  `v2-jogar-agora`, `v2-outras-formas`, `v2-eu-*`) usando só as variáveis
  existentes; remove as regras de `v2-mais*` e ajusta `v2-menu` e
  `v2-menu-celular` para 5 itens. Breakpoints atuais (700px e 1000px).

## Fora do escopo

Layout das salas de jogo; site clássico; backend; Lenda do Campinho (a
landing dela vira um projeto separado, logo depois deste); Mentira Sincera
continua fora da grade de jogos.

## Testes

O frontend não tem testes automáticos. Verificação:

1. `npm run build` em `frontend/` sem erro.
2. No navegador, em 1280px e em 375px, abrir cada endereço abaixo e conferir
   a página aberta e a seção marcada:
   `/v2/` (Jogar) · `?pagina=jogar&jogo=stop|quiz|acromania` (Jogar) ·
   `?pagina=varias&jogo=stop` (Jogar) · `?pagina=privadas&jogo=stop` e com
   `&privada=<id>` (Jogar) · `?pagina=tribunal` e `&mesa=` (Jogar) ·
   `?pagina=impostor` (Jogar) · `?pagina=ranking&jogo=quiz` (Competir/Ranking)
   · `?pagina=hall` (Competir/Hall) · `?pagina=patentes&jogo=stop`
   (Competir/Patentes) · `?pagina=amigos` e `&id=<id>` (Social/Amigos) ·
   `?pagina=clas` e `?pagina=cla&id=<id>` (Social/Clã) ·
   `?pagina=jogador&id=<outro>` (Social) · `?pagina=jogador&id=<eu>` (Eu) ·
   `?pagina=editar-perfil`, `?pagina=novidades`, `?pagina=admin` (Eu) ·
   `?pagina=missoes` (Missões) · `?pagina=termos` (nenhuma) ·
   `?sala=`, `?stop=`, `?acro=` (sala abre como hoje).
3. Contadores aparecem em Social e Missões (com dados de teste ou conta com
   avisos).
4. Jogar agora leva à sala anunciada no texto; Continuar aparece depois de
   entrar numa sala e voltar.
5. Sem "Mais" no celular, sem rolagem horizontal em 375px, e a barra de baixo
   não cobre conteúdo.
