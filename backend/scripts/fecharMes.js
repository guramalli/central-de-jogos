// Fecha um mês: grava quem foi campeão do Stop e do Quiz.
//
// POR QUE MANUAL E NÃO AUTOMÁTICO:
// Não existe rotina agendada de fechamento no projeto, e isso é proposital —
// uma tarefa que roda sozinha à meia-noite é ponto único de falha, e aqui há
// dinheiro envolvido. Você vai olhar o ranking de qualquer jeito pra pagar o
// Pix; rodar um comando junto não custa nada e ainda dá a chance de conferir
// antes de congelar.
//
// O QUE ELE CONGELA:
// O campeão de cada jogo naquele mês, com os pontos. Depois de gravado, o
// troféu no perfil não muda mais — nem se uma conta for banida, ocultada ou
// apagada depois. Sem isso, alguém poderia perder um troféu já conquistado
// (e já pago) meses depois.
//
// Usa EXATAMENTE o mesmo filtro da página de histórico (/ranking/history),
// pra o campeão gravado bater com o que o site mostra.
//
// Uso:
//   npm run fechar-mes -- 2026-08
//   npm run fechar-mes -- 2026-08 --confirmar
//
// Sem --confirmar ele só MOSTRA quem seriam os campeões, sem gravar nada.
import "dotenv/config";
import { prisma } from "../src/db.js";
import { currentMonthKey } from "../src/utils/monthKey.js";

const JOGOS = ["stop", "quiz"];

// Clãs fecham TAMBÉM no Acromania. Os campeões individuais só existem onde
// há premiação em Pix (Stop e Quiz); o troféu de clã é reconhecimento, não
// dinheiro, então não há motivo pra deixar o Acromania de fora.
const JOGOS_CLA = ["stop", "quiz", "acromania"];

function nomeDoMes(monthKey) {
  const [ano, mes] = monthKey.split("-");
  const nomes = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                 "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  return `${nomes[Number(mes) - 1]}/${ano}`;
}

async function main() {
  const args = process.argv.slice(2);
  const confirmar = args.includes("--confirmar");
  const monthKey = args.find((a) => /^\d{4}-\d{2}$/.test(a));

  if (!monthKey) {
    console.log("Uso: npm run fechar-mes -- AAAA-MM [--confirmar]\n");
    console.log("Exemplo: npm run fechar-mes -- 2026-08");
    const jaFechados = await prisma.campeaoMensal.findMany({
      orderBy: { monthKey: "desc" },
      select: { monthKey: true, gameKey: true, nickname: true, points: true },
    });
    if (jaFechados.length) {
      console.log("\nMeses já fechados:");
      for (const c of jaFechados) {
        console.log(`  ${c.monthKey}  ${c.gameKey.padEnd(5)}  ${c.nickname} (${c.points.toLocaleString("pt-BR")} pts)`);
      }
    }
    return;
  }

  // Mês corrente ainda está em disputa — fechar agora congelaria um campeão
  // que pode mudar até o dia 1º.
  if (monthKey >= currentMonthKey()) {
    console.log(`\n❌ "${monthKey}" ainda não terminou. Só dá pra fechar um mês passado.`);
    console.log(`   Mês atual: ${currentMonthKey()}`);
    return;
  }

  console.log(`\n=== ${nomeDoMes(monthKey)} ===\n`);

  const resultados = [];
  for (const gameKey of JOGOS) {
    const jaTem = await prisma.campeaoMensal.findUnique({
      where: { monthKey_gameKey: { monthKey, gameKey } },
    });
    if (jaTem) {
      console.log(`  ${gameKey.toUpperCase().padEnd(5)} já fechado: ${jaTem.nickname} (${jaTem.points.toLocaleString("pt-BR")} pts)`);
      continue;
    }

    // Mesmo filtro do /ranking/history: sem admin, sem visitante, sem quem
    // pediu pra ficar fora do ranking (geral ou daquele jogo).
    const top = await prisma.monthlyScore.findMany({
      where: {
        gameKey, monthKey,
        user: {
          role: { not: "ADMIN" },
          isGuest: false,
          ocultoNoRanking: false,
          NOT: { ocultoNosRankings: { has: gameKey } },
        },
      },
      orderBy: { points: "desc" },
      take: 3,
      include: { user: { select: { id: true, nickname: true } } },
    });

    if (top.length === 0) {
      console.log(`  ${gameKey.toUpperCase().padEnd(5)} ninguém pontuou neste mês.`);
      continue;
    }

    console.log(`  ${gameKey.toUpperCase()}`);
    top.forEach((s, i) => {
      const medalha = ["🥇", "🥈", "🥉"][i];
      console.log(`    ${medalha} ${s.user.nickname.padEnd(20)} ${s.points.toLocaleString("pt-BR").padStart(9)} pts`);
    });

    resultados.push({
      gameKey,
      userId: top[0].user.id,
      nickname: top[0].user.nickname,
      points: top[0].points,
    });
  }

  // ===== CLÃS =====
  //
  // Um campeão por jogo mais um "geral" (soma dos três). Mesma regra de
  // elegibilidade dos jogadores: admin e visitante não somam pontos pro clã.
  const resultadosClas = [];
  const clas = await prisma.clan.findMany({
    include: { members: { select: { id: true, role: true, isGuest: true } } },
  });

  if (clas.length > 0) {
    const contaNoRanking = (m) => m.role !== "ADMIN" && !m.isGuest;
    const todosIds = clas.flatMap((c) => c.members.filter(contaNoRanking).map((m) => m.id));

    for (const gameKey of [...JOGOS_CLA, "geral"]) {
      const jaTem = await prisma.campeaoClaMensal.findUnique({
        where: { monthKey_gameKey: { monthKey, gameKey } },
      });
      if (jaTem) {
        console.log(`  CLÃ ${gameKey.toUpperCase().padEnd(9)} já fechado: [${jaTem.clanTag}] ${jaTem.clanName}`);
        continue;
      }

      // No "geral", exclui as linhas por sala (gameKey com ":") — senão cada
      // ponto contaria duas vezes.
      const filtro =
        gameKey === "geral" ? { NOT: { gameKey: { contains: ":" } } } : { gameKey };

      const scores = todosIds.length
        ? await prisma.monthlyScore.groupBy({
            by: ["userId"],
            where: { userId: { in: todosIds }, monthKey, ...filtro },
            _sum: { points: true },
          })
        : [];
      const porUsuario = Object.fromEntries(scores.map((x) => [x.userId, x._sum.points || 0]));

      const somados = clas
        .map((c) => {
          const membros = c.members.filter(contaNoRanking);
          return {
            clan: c,
            memberCount: membros.length,
            points: membros.reduce((soma, m) => soma + (porUsuario[m.id] || 0), 0),
          };
        })
        .filter((x) => x.points > 0)
        .sort((a, b) => b.points - a.points);

      if (somados.length === 0) {
        console.log(`  CLÃ ${gameKey.toUpperCase().padEnd(9)} nenhum clã pontuou.`);
        continue;
      }

      const vencedor = somados[0];
      console.log(
        `  CLÃ ${gameKey.toUpperCase().padEnd(9)} 🏆 [${vencedor.clan.tag}] ${vencedor.clan.name} — ${vencedor.points.toLocaleString("pt-BR")} pts`
      );
      resultadosClas.push({
        gameKey,
        clanId: vencedor.clan.id,
        clanName: vencedor.clan.name,
        clanTag: vencedor.clan.tag,
        points: vencedor.points,
        memberCount: vencedor.memberCount,
      });
    }
  }

  if (resultados.length === 0 && resultadosClas.length === 0) {
    console.log("\nNada a fazer.");
    return;
  }

  if (!confirmar) {
    console.log(`\n--- SIMULAÇÃO — nada foi gravado ---`);
    console.log(`\nConfira se os campeões acima batem com quem você pagou.`);
    console.log(`Se estiver certo, rode de novo com --confirmar:`);
    console.log(`\n  npm run fechar-mes -- ${monthKey} --confirmar\n`);
    return;
  }

  for (const r of resultados) {
    await prisma.campeaoMensal.create({
      data: { monthKey, gameKey: r.gameKey, userId: r.userId, nickname: r.nickname, points: r.points },
    });
    console.log(`\n✅ ${r.gameKey.toUpperCase()}: ${r.nickname} congelado como campeão de ${nomeDoMes(monthKey)}.`);
  }

  for (const r of resultadosClas) {
    await prisma.campeaoClaMensal.create({ data: { monthKey, ...r } });
    console.log(`\n🏆 CLÃ ${r.gameKey.toUpperCase()}: [${r.clanTag}] ${r.clanName} congelado.`);
  }

  console.log(`\nOs troféus já aparecem no perfil dos campeões e dos clãs.`);
}

main()
  .catch((e) => { console.error("Erro:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
