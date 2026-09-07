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
