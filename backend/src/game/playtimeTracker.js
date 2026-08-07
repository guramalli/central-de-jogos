import { prisma } from "../db.js";

// Soma o tempo de jogo de alguém quando ela sai de uma sala (ou desconecta) —
// calcula quantos minutos se passaram desde que entrou, e soma no total
// vitalício guardado no perfil. Usado igual nos três jogos (Stop, Quiz,
// Acromania), pra não duplicar essa lógica em cada um.
export async function trackPlaytime(userId, joinedAt) {
  if (!joinedAt) return;
  const elapsedMs = Date.now() - joinedAt;
  const minutes = Math.floor(elapsedMs / 60000);
  if (minutes <= 0) return; // menos de 1 minuto não soma nada ainda

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { playtimeMinutes: { increment: minutes } },
    });
  } catch (err) {
    console.error("Falha ao registrar tempo de jogo para", userId, err.message);
  }
}
