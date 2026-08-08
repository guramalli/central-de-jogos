import { prisma } from "../db.js";

// Quem NÃO concorre ao ranking: visitantes (contas temporárias sem cadastro)
// e contas ADMIN. Serve pra decidir se vale anunciar promoção de patente,
// posição no ranking e afins — anunciar colocação pra quem está fora da
// disputa só confunde.
//
// Em caso de erro na consulta, devolve `false` (não concorre) de propósito:
// é melhor deixar de anunciar do que anunciar errado.
export async function concorreAoRanking(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isGuest: true, role: true },
    });
    if (!user) return false;
    return !user.isGuest && user.role !== "ADMIN";
  } catch {
    return false;
  }
}
