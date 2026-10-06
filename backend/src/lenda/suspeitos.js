// ===== Lenda do Campinho — quem fica FORA dos rankings e a lista de SUSPEITOS (v407, Raio-X U7) =====
//
// Fora de todos os rankings do Lenda (XP, habilidades, lista de personagens, louros do top 3 no mundo):
//   - conta banida ou oculta dos rankings (contas de teste do time: ocultoNoRanking);
//   - conta de ADMIN (o dono testa o jogo o tempo todo);
//   - conta com um envio do ranking REPROVADO (XP que não bate com o nível, ganho rápido demais, nível que pulou):
//     vira uma linha em SuspiciousActivity (gameKey "lenda") e fica escondida até o admin olhar e descartar
//     (painel › Lenda › Suspeitos). Nada é apagado nem bloqueado: a pessoa continua jogando normalmente.
// Usa a tabela SuspiciousActivity que o site já tem (sem mudar o schema).

export const GAME_KEY = "lenda";
const REPETIR_MS = 6 * 3600e3; // o mesmo motivo para a mesma conta só é gravado de novo depois de 6 h (sem encher a tabela)

// ids (dentre `ids`) que não aparecem nos rankings
export async function contasForaDoRanking(prisma, ids) {
  const lista = [...new Set(ids)].filter(Boolean);
  if (!lista.length) return new Set();
  const fora = new Set((await prisma.user.findMany({
    where: { id: { in: lista }, OR: [{ banned: true }, { ocultoNoRanking: true }, { role: "ADMIN" }] },
    select: { id: true },
  })).map((u) => u.id));
  try {
    const sus = await prisma.suspiciousActivity.findMany({ where: { userId: { in: lista }, gameKey: GAME_KEY }, select: { userId: true }, distinct: ["userId"] });
    for (const s of sus) fora.add(s.userId);
  } catch { /* sem a tabela: segue sem esse filtro */ }
  return fora;
}

// a conta está na lista de suspeitos do Lenda? (a feira não deixa vender enquanto o admin não olhar)
export async function ehSuspeito(prisma, userId) {
  try { return !!(await prisma.suspiciousActivity.findFirst({ where: { userId, gameKey: GAME_KEY }, select: { id: true } })); } catch { return false; }
}

// grava um envio reprovado (não repete o mesmo motivo em menos de REPETIR_MS)
export async function registrarSuspeito(prisma, userId, motivo, detalhe, agora = Date.now()) {
  try {
    const ja = await prisma.suspiciousActivity.findFirst({
      where: { userId, gameKey: GAME_KEY, reason: motivo, createdAt: { gte: new Date(agora - REPETIR_MS) } }, select: { id: true },
    });
    if (ja) return false;
    await prisma.suspiciousActivity.create({ data: { userId, gameKey: GAME_KEY, roomId: "ranking", reason: motivo, detail: String(detalhe || "").slice(0, 300) } });
    return true;
  } catch { return false; }
}

// pares vendedor ↔ comprador que se repetem na feira (possível troca entre contas do mesmo dono, para o admin olhar)
export function paresRepetidos(vendas, minimo = 3) {
  const m = new Map();
  for (const v of vendas) {
    const k = v.vendedorId + "|" + v.compradorId;
    const e = m.get(k) || { vendedorId: v.vendedorId, compradorId: v.compradorId, vendas: 0, tostoes: 0, ultima: null };
    e.vendas++; e.tostoes += Number(v.total) || 0;
    if (!e.ultima || new Date(v.criadoEm) > new Date(e.ultima)) e.ultima = v.criadoEm;
    m.set(k, e);
  }
  return [...m.values()].filter((e) => e.vendas >= minimo).sort((a, b) => b.vendas - a.vendas || b.tostoes - a.tostoes);
}
