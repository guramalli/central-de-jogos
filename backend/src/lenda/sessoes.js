// ===== Lenda do Campinho — sessões de jogo (quem jogou, quando e por quanto tempo) =====
//
// O jogo NÃO manda nada novo pra isso: enquanto alguém joga logado, ele já
// fala com o servidor a cada 30–60 s (confere o save na nuvem, sobe o save,
// atualiza o ranking). Cada uma dessas chamadas vira um "sinal". Sinais com
// menos de PAUSA_MS entre si são a mesma sessão; depois de uma pausa maior,
// começa outra. Assim o próximo zip do jogo não quebra o histórico.
//
// Quem joga SEM entrar na conta não fala com o servidor e não aparece aqui.
//
// O registro nunca atrapalha o jogo: roda sem esperar e engole erro.

export const PAUSA_MS = 10 * 60 * 1000;      // mais que isso sem sinal = sessão nova
export const JOGANDO_AGORA_MS = 3 * 60 * 1000; // sinal mais recente que isso = "jogando agora"
export const GUARDAR_DIAS = 90;               // histórico mais velho que isso é apagado
const INTERVALO_MIN_MS = 20 * 1000;           // no máximo 1 escrita por pessoa a cada 20 s

// Celular ou computador, pelo navegador. O app do Windows abre o site num
// WebView2 (Edge) e aparece como computador.
export function plataformaDoUA(ua) {
  const s = String(ua || "");
  if (!s) return null;
  return /Mobi|Android|iPhone|iPad|iPod/i.test(s) ? "celular" : "computador";
}

// Continua a última sessão ou abre outra? `ultima` = { ultimoSinal } ou null.
export function decidirSessao(ultima, agora = Date.now(), pausaMs = PAUSA_MS) {
  if (!ultima || !ultima.ultimoSinal) return "nova";
  const t = new Date(ultima.ultimoSinal).getTime();
  return agora - t <= pausaMs ? "estender" : "nova";
}

const ultimaEscrita = new Map(); // userId -> horário da última escrita (memória do servidor)
let ultimaLimpeza = 0;

export function registrarSinal(prisma, userId, nivel, ua) {
  if (!userId) return;
  const agora = Date.now();
  if (agora - (ultimaEscrita.get(userId) || 0) < INTERVALO_MIN_MS) return;
  ultimaEscrita.set(userId, agora);
  const nv = Number.isInteger(nivel) && nivel > 0 ? nivel : null;
  (async () => {
    const ultima = await prisma.lendaSessao.findFirst({
      where: { userId },
      orderBy: { ultimoSinal: "desc" },
      select: { id: true, ultimoSinal: true, nivelFim: true },
    });
    if (decidirSessao(ultima, agora) === "estender") {
      await prisma.lendaSessao.update({
        where: { id: ultima.id },
        data: { ultimoSinal: new Date(agora), ...(nv ? { nivelFim: Math.max(nv, ultima.nivelFim || 0) } : {}) },
      });
    } else {
      await prisma.lendaSessao.create({
        data: { userId, inicio: new Date(agora), ultimoSinal: new Date(agora), nivelInicio: nv, nivelFim: nv, plataforma: plataformaDoUA(ua) },
      });
    }
    // Faxina de vez em quando (no máximo 1x por hora): histórico velho sai.
    if (agora - ultimaLimpeza > 60 * 60 * 1000) {
      ultimaLimpeza = agora;
      for (const [id, t] of ultimaEscrita) if (agora - t > PAUSA_MS) ultimaEscrita.delete(id);
      await prisma.lendaSessao.deleteMany({ where: { ultimoSinal: { lt: new Date(agora - GUARDAR_DIAS * 24 * 60 * 60 * 1000) } } });
    }
  })().catch((e) => console.error("Lenda: falha ao registrar sessão:", e.message));
}
