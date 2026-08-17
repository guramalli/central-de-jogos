import { prisma } from "../db.js";
import { currentMonthKey } from "./monthKey.js";

// ===== Patente máxima exclusiva =====
//
// Só UMA pessoa por jogo pode ostentar a patente mais alta (Coroa Imperial
// de Ouro no Stop, Enciclopédia no Quiz): quem tiver mais pontos NO MÊS
// vigente naquele jogo. Quem também passou da marca, mas não é o primeiro,
// fica na patente logo abaixo — então o topo é um título disputado, que
// troca de dono, e não um clube que só cresce.
//
// A base é mensal porque patente é um conceito mensal no site: ela reflete
// o desempenho do mês corrente, não a soma histórica. Quando o mês vira, o
// título fica vago e a disputa recomeça do zero.
//
// O detentor fica guardado em memória e é reapurado de tempos em tempos, e
// não a cada consulta: a patente é lida em lista de sala, ranking, perfil e
// chat o tempo todo, e uma consulta por leitura acordaria o banco à toa.
const detentores = new Map(); // gameKey -> userId | null
const REAPURAR_A_CADA_MS = 3 * 60 * 1000;

// O controle de tempo é POR JOGO. Quando era compartilhado, o Stop apurava
// primeiro e "consumia" a janela, e o Quiz ficava sem detentor nenhum —
// ninguém jamais receberia a Enciclopédia.
const apuradoEm = new Map(); // gameKey -> timestamp
const apurando = new Map();  // gameKey -> Promise

async function apurar(gameKey, pontosMinimos) {
  // Pega quem tem mais pontos no mês corrente, ignorando contas que não
  // disputam ranking (ADMIN, visitantes e contas de teste ocultas).
  const topo = await prisma.monthlyScore.findFirst({
    where: {
      gameKey,
      monthKey: currentMonthKey(),
      points: { gte: pontosMinimos },
      user: {
            role: { not: "ADMIN" },
            isGuest: false,
            ocultoNoRanking: false,
            // Ocultação só deste jogo (ver ocultoNosRankings no schema).
            NOT: { ocultoNosRankings: { has: gameKey } },
          },
    },
    orderBy: { points: "desc" },
    select: { userId: true },
  });
  detentores.set(gameKey, topo?.userId || null);
}

// Reapura em segundo plano quando o cache daquele jogo está velho. Não
// bloqueia nada: quem perguntar durante a apuração recebe a resposta
// anterior, e a lista se corrige na leitura seguinte — alguns segundos de
// atraso pra trocar o dono de um título é irrelevante.
export function agendarApuracao(alvos) {
  const agora = Date.now();
  for (const { gameKey, min } of alvos) {
    if (apurando.has(gameKey)) continue;
    if (agora - (apuradoEm.get(gameKey) || 0) < REAPURAR_A_CADA_MS) continue;
    apuradoEm.set(gameKey, agora);
    apurando.set(
      gameKey,
      apurar(gameKey, min)
        .catch(() => {})
        .finally(() => apurando.delete(gameKey))
    );
  }
}

export function ehDetentor(gameKey, userId) {
  return detentores.get(gameKey) === userId;
}
