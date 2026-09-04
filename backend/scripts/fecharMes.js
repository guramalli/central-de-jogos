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

  if (resultados.length === 0) {
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

  console.log(`\nOs troféus já aparecem no perfil dos campeões.`);
}

main()
  .catch((e) => { console.error("Erro:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
