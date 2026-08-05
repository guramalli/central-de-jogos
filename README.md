# Educação Gamer — Código-fonte Full-Stack

Plataforma de jogos online com cadastro obrigatório, jogo **Stop** em tempo real
(rodadas automáticas em blocos infinitos de 10), sistema de patentes, ranking
mensal (premiação) e vitalício, glossário moderado por admins/moderadores, chat,
lista de jogadores online, e visual próprio (retrô, inspirado no clássico Stop Central).

## Stack

- **Backend:** Node.js + Express + Socket.io + Prisma ORM + PostgreSQL (Neon)
- **Frontend:** React + Vite + React Router + Axios + Socket.io-client
- **Auth:** JWT + bcrypt

## Bot de teste (jogar sozinho como se tivesse mais gente)

Com o backend rodando (`npm run dev`), abra **outro terminal**, na pasta `backend`, e rode:

```
npm run bot
```

Isso cria/loga um usuário chamado `BotTeste`, entra na mesma sala (`stop-sala-1`)
e joga sozinho: escolhe palavras válidas do banco pro tema/letra sorteados,
"digita" com um pequeno atraso (pra parecer humano), às vezes erra de propósito,
às vezes deixa em branco, e às vezes aperta STOP antes do tempo acabar. Assim dá
pra ver a tabela de resultado, o chat e o placar com mais de um jogador, mesmo
testando sozinho.

Quer mais de um bot ao mesmo tempo? Roda em outro terminal com um nickname
diferente:
```
BOT_NICKNAME=Bot2 npm run bot
```

Pra parar o bot, `Ctrl+C` no terminal dele.

## Como rodar localmente

### 1. Backend

```bash
cd backend
copy .env.example .env      (Windows)  ou  cp .env.example .env  (Mac/Linux)
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

Usuário admin criado pelo seed: `admin@educaogamer.com` / `admin123`

### 2. Frontend

```bash
cd frontend
copy .env.example .env      (Windows)  ou  cp .env.example .env  (Mac/Linux)
npm install
npm run dev
```

Abra `http://localhost:5173`.

## O que já funciona

- Cadastro/login com JWT.
- Jogo Stop completo: sorteio de 6 temas + 1 letra, 30s de intervalo, 50s de
  resposta, botão STOP habilitado só com todas as lacunas preenchidas,
  pontuação (10 = única correta, 5 = correta repetida entre jogadores, 0 =
  errada/em branco), bônus de bloco a cada 10 rodadas (150/100/50), loop
  infinito automático.
- Tabela de preenchimento e tabela de resultado sempre visíveis, no mesmo
  padrão visual (jogador em cinza, temas em laranja, lacunas em branco).
- Pontuação mensal (zera todo mês) e vitalícia (soma histórica), separadas por
  jogo, com sistema de patentes configurável (`utils/rank.js`).
- Glossário: jogadores sugerem palavras erradas direto na tabela de resultado;
  ficam pendentes até um moderador/admin aprovar no painel `/admin`.
- Painel admin isolado por `role` (PLAYER/MODERATOR/ADMIN).
- Chat da sala, lista de jogadores online (com patente e pontos), barra
  "Pts Sala / Pts Mês", logotipos da marca e do jogo Stop em SVG.
- Visual próprio nas telas de Lobby, Login/Cadastro e Ranking (hero banner,
  cards de jogo, pódio com medalhas).

## Correções importantes já aplicadas (não reverter)

- `gameManager.js`: cache de criação pendente por `roomId`, para nunca criar
  duas `StopRoom` concorrentes para a mesma sala (bug que causava tela
  piscando e cronômetro perdido).
- `StopRoom.addPlayer`: remove conexões antigas do mesmo jogador antes de
  adicionar a nova (evita duplicidade em reconexões rápidas).
- `schema.prisma`: `role` é `String`, não `enum` (mantido assim por simplicidade e compatibilidade).

## O que está com estrutura pronta mas precisa ser expandido

- **Quiz de perguntas:** os modelos de pontuação/ranking já são genéricos por
  `gameKey`; basta criar um `QuizRoom.js` similar ao `StopRoom.js`.
- **Clãs e amigos:** os modelos `Clan` e `Friendship` já existem no schema;
  faltam as rotas e telas correspondentes.
- **Premiação mensal automática:** falta um job agendado (ex.: `node-cron`)
  para aplicar o prêmio no início de cada mês com base no ranking do mês
  anterior.

## Observações de produção

- Já usa PostgreSQL (Neon) — bom tanto para desenvolvimento em múltiplas
  máquinas quanto para produção. Se quiser trocar de provedor de Postgres no
  futuro, é só trocar a `DATABASE_URL`.
- Configure um `JWT_SECRET` forte em produção.
- Adicione rate limiting nas rotas de auth antes de ir para produção.
