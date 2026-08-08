// Remove contas de visitante antigas e inativas.
//
// Contas de visitante são criadas sem cadastro, só pra pessoa experimentar
// o jogo. Elas se acumulam com o tempo, então este script limpa as que já
// passaram do prazo — junto com tudo que elas deixaram para trás
// (mensagens, estatísticas, pontuação).
//
// Uso:
//   npm run limpar-visitantes              -> simula (não apaga nada)
//   npm run limpar-visitantes -- --go      -> apaga de verdade
//   npm run limpar-visitantes -- --dias=30 -> muda o prazo (padrão: 7 dias)
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function lerDias() {
  const arg = process.argv.find((a) => a.startsWith("--dias="));
  if (!arg) return 7;
  const n = parseInt(arg.split("=")[1], 10);
  return Number.isFinite(n) && n > 0 ? n : 7;
}

async function main() {
  const executar = process.argv.includes("--go");
  const dias = lerDias();

  const limite = new Date();
  limite.setDate(limite.getDate() - dias);

  const visitantes = await prisma.user.findMany({
    where: { isGuest: true, createdAt: { lt: limite } },
    select: { id: true, nickname: true, createdAt: true },
  });

  if (visitantes.length === 0) {
    console.log(`Nenhuma conta de visitante com mais de ${dias} dia(s). Nada a limpar. ✨`);
    return;
  }

  console.log(`Encontradas ${visitantes.length} conta(s) de visitante com mais de ${dias} dia(s):\n`);
  visitantes.slice(0, 10).forEach((v) => {
    const idade = Math.floor((Date.now() - v.createdAt.getTime()) / 86400000);
    console.log(`  ${v.nickname.padEnd(28)} criada há ${idade} dia(s)`);
  });
  if (visitantes.length > 10) console.log(`  ... e mais ${visitantes.length - 10}`);

  if (!executar) {
    console.log("\n⚠️  Nada foi apagado (modo de simulação).");
    console.log("    Pra apagar de verdade, rode: npm run limpar-visitantes -- --go");
    return;
  }

  const ids = visitantes.map((v) => v.id);

  // Apaga primeiro tudo que depende do usuário — as relações do schema não
  // têm exclusão em cascata, então tentar apagar a conta direto daria erro
  // de chave estrangeira.
  console.log("\nLimpando registros ligados a essas contas...");

  const etapas = [
    ["mensagens privadas", () => prisma.privateMessage.deleteMany({ where: { OR: [{ senderId: { in: ids } }, { receiverId: { in: ids } }] } })],
    ["mensagens de chat", () => prisma.chatMessage.deleteMany({ where: { userId: { in: ids } } })],
    ["amizades", () => prisma.friendship.deleteMany({ where: { OR: [{ userAId: { in: ids } }, { userBId: { in: ids } }] } })],
    ["pontuação mensal", () => prisma.monthlyScore.deleteMany({ where: { userId: { in: ids } } })],
    ["pontuação vitalícia", () => prisma.lifetimeScore.deleteMany({ where: { userId: { in: ids } } })],
    ["pontuação de bloco", () => prisma.blockScore.deleteMany({ where: { userId: { in: ids } } })],
    ["estatísticas do Quiz", () => prisma.quizRoomStat.deleteMany({ where: { userId: { in: ids } } })],
    ["denúncias de pergunta", () => prisma.quizQuestionReport.deleteMany({ where: { userId: { in: ids } } })],
    ["atividades suspeitas", () => prisma.suspiciousActivity.deleteMany({ where: { userId: { in: ids } } })],
    ["feedbacks", () => prisma.feedback.deleteMany({ where: { userId: { in: ids } } })],
  ];

  for (const [nome, fn] of etapas) {
    try {
      const r = await fn();
      if (r.count > 0) console.log(`  ${nome.padEnd(24)} ${r.count} removido(s)`);
    } catch (err) {
      console.error(`  ⚠️  Falha ao limpar ${nome}: ${err.message}`);
    }
  }

  // Sugestões (palavras e perguntas) não são apagadas — se um visitante
  // sugeriu algo útil, isso continua valendo. Só desvincula o autor.
  try {
    const w = await prisma.wordEntry.updateMany({ where: { suggestedById: { in: ids } }, data: { suggestedById: null } });
    const q = await prisma.quizQuestion.updateMany({ where: { suggestedById: { in: ids } }, data: { suggestedById: null } });
    if (w.count || q.count) {
      console.log(`  ${"sugestões preservadas".padEnd(24)} ${w.count + q.count} desvinculada(s)`);
    }
  } catch (err) {
    console.error(`  ⚠️  Falha ao desvincular sugestões: ${err.message}`);
  }

  const removidas = await prisma.user.deleteMany({ where: { id: { in: ids } } });
  console.log(`\n✅ ${removidas.count} conta(s) de visitante removida(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
