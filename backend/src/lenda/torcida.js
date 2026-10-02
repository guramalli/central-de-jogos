// ===== Lenda do Campinho — "Torcida" entre amigos (social seguro para crianças) =====
//
// Só entre AMIGOS aceitos do site. Nada de texto livre: a torcida é uma de
// poucas frases prontas (TORCIDAS). No máximo 1 por amigo a cada 20 h, e o
// recebido some depois de 14 dias. Quem quer conversar usa o chat do site,
// que já tem as regras e a moderação dele.

export const TORCIDAS = {
  bora: "⚽ Bora jogar!",
  mandou: "👏 Mandou bem!",
  topo: "🏆 Rumo ao topo!",
  craque: "🔥 Que craque!",
  forca: "💪 Força, você consegue!",
  parabens: "🎉 Parabéns pelo nível!",
};
export const INTERVALO_MS = 20 * 60 * 60 * 1000;
export const GUARDAR_DIAS = 14;

export function validarTorcida(corpo) {
  const para = String(corpo?.para || "").trim();
  const tipo = String(corpo?.tipo || "");
  if (!para || para.length > 40) return { ok: false, erro: "Amigo inválido." };
  if (!Object.hasOwn(TORCIDAS, tipo)) return { ok: false, erro: "Torcida inválida." };
  return { ok: true, para, tipo };
}

// ids dos amigos aceitos de `eu`
export async function amigosDe(prisma, eu) {
  const f = await prisma.friendship.findMany({
    where: { status: "accepted", OR: [{ userAId: eu }, { userBId: eu }] },
    select: { userAId: true, userBId: true },
  });
  return [...new Set(f.map((x) => (x.userAId === eu ? x.userBId : x.userAId)))];
}

export async function podeTorcer(prisma, de, para, agora = Date.now()) {
  if (de === para) return { ok: false, erro: "Não dá para torcer para você mesmo." };
  const amigos = await amigosDe(prisma, de);
  if (!amigos.includes(para)) return { ok: false, erro: "Só dá para torcer por amigos." };
  const ultima = await prisma.lendaTorcida.findFirst({ where: { de, para }, orderBy: { criadoEm: "desc" }, select: { criadoEm: true } });
  if (ultima && agora - new Date(ultima.criadoEm).getTime() < INTERVALO_MS) return { ok: false, erro: "Você já torceu por esse amigo hoje. Amanhã tem mais!", cedo: true };
  return { ok: true };
}
