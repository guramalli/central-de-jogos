// ===== Lenda do Campinho — APAGAR os dados de uma conta (v407, Raio-X U6) =====
//
// Usado em três lugares, sempre DENTRO da transação de quem chama:
//   - o admin apaga uma conta (routes/admin.js);
//   - a limpeza de contas de visitante (prisma/limparVisitantes.js);
//   - o próprio jogador: "apagar meus dados do jogo" (DELETE /api/lenda/meus-dados) — só o Lenda, a conta do site fica.
// Apaga: save na nuvem, ranking, casa, sessões, torcidas (mandadas e recebidas), anúncios, barraca, cotas da feira,
// vendas que ele ainda ia recolher e convites de guilda; sai da guilda passando a liderança (ou apaga a guilda,
// se era o último). As compras que ele fez continuam no registro de quem vendeu (para o vendedor recolher), sem o id.
//
// As tabelas do Lenda não têm relação com User (nada de cascata), por isso tudo é feito aqui, à mão.
// `tabelas` (opcional) = quais modelos existem no banco; sem ela, tenta todos (ver tabelasLenda).

export const MODELOS_LENDA = ["lendaSave", "lendaRanking", "lendaCasa", "lendaSessao", "lendaTorcida", "lendaGuilda", "lendaGuildaMembro",
  "lendaGuildaConvite", "lendaAnuncio", "lendaVenda", "lendaBarraca", "lendaMercadoCota"];
export const COMPRADOR_APAGADO = "(conta apagada)";

// o líder saiu: o vice mais antigo vira líder (senão o membro mais antigo). `resto` = membros que ficaram.
export function novoLider(resto) {
  const antigo = (l) => [...l].sort((a, b) => new Date(a.entrouEm) - new Date(b.entrouEm))[0];
  return antigo(resto.filter((x) => x.papel === "vice")) || antigo(resto) || null;
}

// tira alguém da guilda: passa a liderança ou apaga a guilda vazia. Devolve "apagada" | "saiu" | null.
export async function sairDaGuilda(db, userId) {
  const m = await db.lendaGuildaMembro.findUnique({ where: { userId } });
  if (!m) return null;
  await db.lendaGuildaMembro.delete({ where: { userId } });
  const resto = await db.lendaGuildaMembro.findMany({ where: { guildaId: m.guildaId } });
  if (!resto.length) {
    await db.lendaGuildaConvite.deleteMany({ where: { guildaId: m.guildaId } });
    await db.lendaGuilda.deleteMany({ where: { id: m.guildaId } });
    return "apagada";
  }
  if (m.papel === "lider") {
    const novo = novoLider(resto);
    await db.lendaGuildaMembro.update({ where: { userId: novo.userId }, data: { papel: "lider" } });
    await db.lendaGuilda.update({ where: { id: m.guildaId }, data: { liderId: novo.userId } });
  }
  return "saiu";
}

// quais modelos do Lenda existem no banco (antes do "prisma db push" algum pode faltar; dentro de uma transação
// do Postgres um erro estraga a transação inteira, então quem chama confere antes, fora dela)
let tabelasOk = null;
export async function tabelasLenda(prisma) {
  if (tabelasOk) return tabelasOk;
  const ok = new Set();
  for (const m of MODELOS_LENDA) { try { await prisma[m].findFirst(); ok.add(m); } catch { /* ainda não existe */ } }
  if (ok.size === MODELOS_LENDA.length) tabelasOk = ok; // (só guarda quando está tudo lá)
  return ok;
}
export function __esqueceTabelas() { tabelasOk = null; }

export async function apagarDadosLenda(db, userId, tabelas = new Set(MODELOS_LENDA)) {
  const tem = (m) => tabelas.has(m) && db[m];
  const feito = {};
  const conta = async (nome, p) => { const r = await p; feito[nome] = r?.count ?? (r ? 1 : 0); };
  if (tem("lendaGuildaMembro") && tem("lendaGuilda") && tem("lendaGuildaConvite")) {
    feito.guilda = await sairDaGuilda(db, userId);
    await conta("convitesGuilda", db.lendaGuildaConvite.deleteMany({ where: { OR: [{ userId }, { deId: userId }] } }));
  }
  if (tem("lendaSave")) await conta("save", db.lendaSave.deleteMany({ where: { userId } }));
  if (tem("lendaRanking")) await conta("ranking", db.lendaRanking.deleteMany({ where: { userId } }));
  if (tem("lendaCasa")) await conta("casa", db.lendaCasa.deleteMany({ where: { userId } }));
  if (tem("lendaSessao")) await conta("sessoes", db.lendaSessao.deleteMany({ where: { userId } }));
  if (tem("lendaTorcida")) await conta("torcidas", db.lendaTorcida.deleteMany({ where: { OR: [{ de: userId }, { para: userId }] } }));
  if (tem("lendaAnuncio")) await conta("anuncios", db.lendaAnuncio.deleteMany({ where: { vendedorId: userId } }));
  if (tem("lendaBarraca")) await conta("barraca", db.lendaBarraca.deleteMany({ where: { vendedorId: userId } }));
  if (tem("lendaMercadoCota")) await conta("cotas", db.lendaMercadoCota.deleteMany({ where: { userId } }));
  if (tem("lendaVenda")) {
    await conta("vendas", db.lendaVenda.deleteMany({ where: { vendedorId: userId } }));
    await conta("compras", db.lendaVenda.updateMany({ where: { compradorId: userId }, data: { compradorId: COMPRADOR_APAGADO } }));
  }
  return feito;
}
