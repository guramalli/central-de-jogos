import { prisma } from "../db.js";
import { cacheOuBuscar } from "./cache.js";

// PONTOS DO MÊS de quem concorre ao ranking de um jogo — pra calcular a
// posição dos jogadores na lista lateral das salas.
//
// A lista das salas é recalculada a cada entrada e saída de jogador, em cada
// sala. Antes, cada recálculo ia ao banco buscar os pontos do mês; agora a
// lista fica 60s em cache, COMPARTILHADA entre todas as salas do jogo. A
// posição pode aparecer até 1 min atrasada — na lista lateral, não faz
// diferença; o anúncio de posição no fim da rodada continua indo ao banco.
//
// Mesmos filtros do ranking: sem ADMIN, sem visitante, sem quem se ocultou
// (no geral ou só neste jogo).
export function pontosDoMes(gameKey, monthKey) {
  return cacheOuBuscar(`pontos-mes:${gameKey}:${monthKey}`, 60, async () => {
    const linhas = await prisma.monthlyScore.findMany({
      where: {
        gameKey,
        monthKey,
        points: { gt: 0 },
        user: {
          role: { not: "ADMIN" },
          isGuest: false,
          ocultoNoRanking: false,
          NOT: { ocultoNosRankings: { has: gameKey } },
        },
      },
      select: { points: true },
    });
    return linhas.map((l) => l.points);
  });
}

// Posição de quem tem `meus` pontos: 1 + quantos têm mais.
export function posicaoNoMes(todos, meus) {
  let acima = 0;
  for (const p of todos) if (p > meus) acima++;
  return acima + 1;
}
