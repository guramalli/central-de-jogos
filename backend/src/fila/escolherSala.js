// Pra onde vai o grupo que a fila juntou, nos jogos que têm salas públicas
// com pontuação (hoje, o Acromania).
//
// Antes, a fila criava uma sala privada só pro grupo — e sala privada não
// vale ponto. Agora o grupo entra numa sala PÚBLICA de verdade: a mais vazia
// que ainda tenha lugar pra todo mundo junto. Sem arquivo de banco aqui, pra
// dar pra testar isolado.
//
// salas: [{ roomId, onlineCount, maxPlayers, pontua }]
// Devolve o roomId escolhido, ou null se nenhuma sala pública comporta o
// grupo (aí quem chama decide o plano B).
export function escolherSalaParaGrupo(salas, tamanhoDoGrupo) {
  let melhor = null;
  for (const s of salas) {
    if (!s.pontua) continue;
    if (s.onlineCount + tamanhoDoGrupo > s.maxPlayers) continue;
    // Mais vazia primeiro; empate fica com a que vem antes na lista (a
    // "principal" do jogo).
    if (!melhor || s.onlineCount < melhor.onlineCount) melhor = s;
  }
  return melhor ? melhor.roomId : null;
}
