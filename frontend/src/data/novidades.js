// NOVIDADES DO SITE
//
// Lista fixa no código, e não uma tabela no banco: você já faz deploy a cada
// mudança, então escrever a entrada aqui junto com o código é natural — e
// evita schema, rota e formulário de admin pra uma coisa que muda de dez em
// dez dias.
//
// COMO ADICIONAR: nova entrada NO TOPO da lista. A ordem do arquivo é a
// ordem da tela.
//
// O `id` precisa ser único e estável — é ele que marca o que a pessoa já viu.
// Nunca reaproveite um id antigo em conteúdo novo: quem já tinha visto o
// antigo não veria o novo.
//
// `data` no formato AAAA-MM-DD.
// `tipo`: "novo" (função nova) | "melhoria" | "correcao" | "aviso"
//
// AVISO SOBRE MANTER ISTO VIVO: uma página de novidades parada há três meses
// comunica abandono — é pior que não ter página nenhuma. Se parar de
// alimentar, é melhor tirar o link do menu.

export const NOVIDADES = [
  {
    id: "2026-09-multi-sala",
    data: "2026-09-15",
    tipo: "novo",
    titulo: "Jogue em várias salas na mesma tela",
    texto:
      "No Stop e no Quiz, o botão “Várias salas” abre até 4 partidas lado a lado, sem precisar de outra aba. Cada painel é uma partida independente, com chat e placar próprios.",
  },
  {
    id: "2026-09-tela-cheia",
    data: "2026-09-15",
    tipo: "melhoria",
    titulo: "O site agora usa a tela inteira",
    texto:
      "As páginas deixaram de ficar espremidas no meio do monitor. Ranking, salas e painéis aproveitam toda a largura — e em telas grandes cabem mais salas por linha.",
  },
  {
    id: "2026-09-temas-novos-stop",
    data: "2026-09-14",
    tipo: "novo",
    titulo: "Seis temas novos no Stop",
    texto:
      "Anime e HQ, Flores, Peixes, Cobras, Aves e Sistema Solar entraram nas salas Intermediária e Avançada, com mais de 3 mil palavras cadastradas. O tema Animais virou Mamíferos — aves, peixes e cobras agora têm tema próprio.",
  },
  {
    id: "2026-09-acento-hifen",
    data: "2026-09-14",
    tipo: "correcao",
    titulo: "Hífen e pontuação deixaram de derrubar palavra certa",
    texto:
      "“bem-te-vi”, “bem te vi” e “bemtevi” valem igual agora. O mesmo pra título com barra ou exclamação. Mais de um terço do glossário é palavra composta — antes só a grafia exata contava ponto.",
  },
  {
    id: "2026-09-acromania-bots",
    data: "2026-09-13",
    tipo: "novo",
    titulo: "Sala vazia no Acromania? Chame jogadores automáticos",
    texto:
      "Botão dentro da sala enche a mesa pra você não ficar esperando. As frases deles são bobas de propósito — servem pra dar movimento. Dá pra dispensá-los a qualquer momento.",
  },
  {
    id: "2026-09-acromania-privada",
    data: "2026-09-13",
    tipo: "novo",
    titulo: "Salas privadas no Acromania",
    texto:
      "Crie uma sala com os seus tempos e número de rodadas, com senha se quiser, e chame quem você quer. Partidas em sala privada não valem pontos no ranking.",
  },
  {
    id: "2026-09-acromania-melhorias",
    data: "2026-09-13",
    tipo: "melhoria",
    titulo: "Acromania: trocar a frase, trocar o voto e letras mais fáceis",
    texto:
      "Dá pra reenviar a frase enquanto o tempo não acaba e clicar noutra frase pra mudar o voto. As letras sorteadas mudaram: X e Z saíram, e as que rendem mais vocabulário aparecem com mais frequência. O bônus do pódio subiu pra 1000, 700 e 500.",
  },
  {
    id: "2026-09-stop-muito-boa",
    data: "2026-09-12",
    tipo: "novo",
    titulo: "Voto “muito boa” nas salas privadas do Stop",
    texto:
      "Na validação por votos, dá pra marcar uma palavra como muito boa: ela vale e ainda rende 5 pontos extras pra quem escreveu. E agora qualquer jogador pode sugerir a palavra de qualquer um pro glossário.",
  },
  {
    id: "2026-09-acromania-sala-2",
    data: "2026-09-09",
    tipo: "novo",
    titulo: "Acromania ganhou uma segunda sala",
    texto:
      "Mais uma sala pra quando a primeira estiver cheia. Mesmas regras, mesma partida de 8 rodadas, e os pontos das duas somam no mesmo ranking.",
  },
  {
    id: "2026-09-acromania-votar",
    data: "2026-09-09",
    tipo: "aviso",
    titulo: "No Acromania, agora é preciso votar pra pontuar",
    texto:
      "Quem escreve a frase e não vota fica sem os pontos daquela rodada. Antes dava pra ignorar a votação e ainda levar tudo, o que deixava todo mundo esperando o cronômetro. Votar na frase vencedora continua valendo 10 pontos extras.",
  },
  {
    id: "2026-09-clas-perfil",
    data: "2026-09-08",
    tipo: "novo",
    titulo: "Clãs com perfil próprio, troféus e pedido de entrada",
    texto:
      "Cada clã agora tem uma página com os membros, quanto cada um pontuou e a porcentagem de contribuição. No fim do mês, o clã que mais pontuar em cada jogo ganha um troféu. E quem não tem clã pode pedir pra entrar direto pela lista — o líder recebe o aviso.",
  },
  {
    id: "2026-09-hall-da-fama",
    data: "2026-09-08",
    tipo: "melhoria",
    titulo: "Hall da Fama com recordes e quem mais venceu",
    texto:
      "Além dos campeões mês a mês, a página mostra quem tem mais títulos e as maiores pontuações já registradas em cada jogo.",
  },
  {
    id: "2026-09-arroba-chat",
    data: "2026-09-07",
    tipo: "novo",
    titulo: "Marque alguém no chat com @",
    texto:
      "Digite @ e aparece a lista de quem está na sala. O nome fica destacado na mensagem, e quando marcam você, salta na tela.",
  },

  {
    id: "2026-09-discord",
    data: "2026-09-07",
    tipo: "novo",
    titulo: "O Educação Gamer agora tem Discord",
    texto:
      "Criamos um servidor pra combinar partida, avisar da premiação e ouvir o que vocês têm a dizer. O canal de combinar partida é o mais útil: sala cheia é bem mais divertida que sala vazia. O link fica no rodapé do site.",
  },
  {
    id: "2026-09-patentes-recalibradas",
    data: "2026-09-07",
    tipo: "aviso",
    titulo: "Escadas de patente do Stop e do Quiz ficaram mais longas",
    texto:
      "Dava pra chegar no topo na primeira semana do mês, principalmente jogando em várias salas ao mesmo tempo. Os limiares subiram (Stop até 600.000, Quiz até 300.000) e a progressão continua com a mesma curva. Seus pontos não mudaram — só a escada ficou maior.",
  },
  {
    id: "2026-09-marcacao-chat",
    data: "2026-09-07",
    tipo: "novo",
    titulo: "Marque alguém no chat com @",
    texto:
      "Digite @ no chat e aparece a lista de quem está na sala. O nome fica destacado na mensagem, e quando marcam você, salta na tela.",
  },
  {
    id: "2026-09-acromania-partidas",
    data: "2026-09-06",
    tipo: "novo",
    titulo: "Acromania com partidas de 8 rodadas e patentes próprias",
    texto:
      "O jogo passou a ter começo, meio e fim: a cada 8 rodadas sai um pódio e os três primeiros levam bônus. Também ganhou escada de patentes própria — Balão, Megafone, Microfone e Coroa — e você pontua por cada voto que recebe, não só vencendo.",
  },
  {
    id: "2026-09-site-mais-leve",
    data: "2026-09-06",
    tipo: "melhoria",
    titulo: "Site mais rápido pra carregar",
    texto:
      "As imagens foram recomprimidas e as páginas passaram a carregar sob demanda. O primeiro acesso ficou bem mais leve, principalmente no celular com internet ruim.",
  },
  {
    id: "2026-09-tela-preta",
    data: "2026-09-06",
    tipo: "correcao",
    titulo: "Fim da tela preta ao trocar de página",
    texto:
      "Quando saía uma atualização com o site aberto, mudar de página às vezes deixava a tela em branco e só o F5 resolvia. Agora a página se recarrega sozinha quando isso acontece.",
  },
];
