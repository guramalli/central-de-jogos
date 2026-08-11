import { prisma } from "../db.js";
import { getAllOnlineUserIds as getStopOnlineIds } from "./gameManager.js";
import { getAllOnlineUserIds as getQuizOnlineIds } from "./quizGameManager.js";
import { getAllOnlineUserIds as getAcromaniaOnlineIds } from "./acromaniaGameManager.js";

const PEAK_KEY = "max_concurrent_players";
let peakCache = null;

let peakCarregadoEm = 0;

// O recorde fica em cache pra não consultar o banco a cada entrada numa
// sala. Mas o cache expira a cada 10 minutos: assim, se o valor for
// ajustado direto no banco (pelo script `npm run recorde`), o site pega a
// mudança sozinho, sem precisar reiniciar o servidor.
async function loadPeak() {
  const agora = Date.now();
  if (peakCache === null || agora - peakCarregadoEm > 10 * 60 * 1000) {
    const row = await prisma.platformStat.findUnique({ where: { key: PEAK_KEY } });
    peakCache = row?.value || 0;
    peakCarregadoEm = agora;
  }
  return peakCache;
}

function currentOnlineCount() {
  const ids = new Set([...getStopOnlineIds(), ...getQuizOnlineIds(), ...getAcromaniaOnlineIds()]);
  return ids.size;
}

// Chamado toda vez que alguém entra/sai de uma sala (Stop ou Quiz) — confere
// se o total de jogadores únicos online agora bateu um recorde novo, e se
// bateu, salva no banco (pra sobreviver a reinícios do servidor).
export async function recheckPeak() {
  const current = currentOnlineCount();
  const peak = await loadPeak();
  if (current > peak) {
    peakCache = current;
    peakCarregadoEm = Date.now();
    await prisma.platformStat.upsert({
      where: { key: PEAK_KEY },
      update: { value: current },
      create: { key: PEAK_KEY, value: current },
    });
  }
}

// Usado pela rota pública que alimenta a página inicial.
export async function getPlatformStats() {
  const [totalUsers, peak] = await Promise.all([prisma.user.count(), loadPeak()]);
  const current = currentOnlineCount();
  return {
    totalUsers,
    peakConcurrentPlayers: Math.max(peak, current),
    currentOnline: current,
  };
}
