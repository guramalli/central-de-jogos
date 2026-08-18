// Lista e apaga recordes de sequência das salas do Quiz.
//
// ATENÇÃO — A SALA GUARDA O RECORDE EM MEMÓRIA:
// O QuizRoom carrega o recorde do banco UMA vez (`loadRoomRecord`) e mantém
// em `this.roomRecord` enquanto a sala existe. Se você apagar do banco com a
// sala viva, ela continua achando que o recorde é o antigo — e na próxima vez
// que alguém passar dele, regrava o valor a partir da memória.
//
// Por isso, apagar exige um dos dois:
//   (a) rodar em horário vazio e dar um deploy logo em seguida (o restart do
//       Render zera a memória das salas), ou
//   (b) rodar quando ninguém estiver na sala há tempo suficiente pra ela ter
//       sido descartada.
//
// O script avisa disso ao final.
//
// Uso:
//   npm run recordes                      (lista todos)
//   npm run recordes -- SALA              (mostra o de uma sala)
//   npm run recordes -- SALA --apagar     (apaga o da sala)
//
// Exemplo: npm run recordes -- quiz-futebol-facil --apagar
import "dotenv/config";
import { prisma } from "../src/db.js";

async function main() {
  const [sala, flag] = process.argv.slice(2);

  if (!sala) {
    const todos = await prisma.quizStreakRecord.findMany({
      orderBy: { count: "desc" },
    });
    if (todos.length === 0) {
      console.log("Nenhum recorde de sequência registrado.");
      return;
    }
    console.log(`\n${todos.length} recorde(s) de sequência:\n`);
    console.log("  sala".padEnd(34) + "jogador".padEnd(20) + "seguidas");
    console.log("  " + "-".repeat(58));
    for (const r of todos) {
      console.log(`  ${r.roomId.padEnd(32)}${r.nickname.padEnd(20)}${String(r.count).padStart(5)}`);
    }
    console.log("\nPra apagar:  npm run recordes -- NOME_DA_SALA --apagar");
    return;
  }

  const r = await prisma.quizStreakRecord.findUnique({ where: { roomId: sala } });
  if (!r) {
    console.log(`Nenhum recorde registrado para a sala "${sala}".`);
    console.log("Rode sem argumentos pra ver a lista de salas com recorde.");
    return;
  }

  if (flag !== "--apagar") {
    console.log(`\n  sala     : ${r.roomId}`);
    console.log(`  jogador  : ${r.nickname}`);
    console.log(`  seguidas : ${r.count}`);
    console.log(`\nPra apagar:  npm run recordes -- ${sala} --apagar`);
    return;
  }

  await prisma.quizStreakRecord.delete({ where: { roomId: sala } });
  console.log(`\nRecorde apagado: ${r.nickname} — ${r.count} seguidas em ${sala}.`);
  console.log("A sala volta a não ter recorde; o próximo jogador que emendar");
  console.log("acertos estabelece o novo.");
  console.log("");
  console.log("IMPORTANTE: se a sala estiver rodando agora, ela ainda tem o");
  console.log("valor antigo na memória e pode regravar. Faça um deploy (ou");
  console.log("espere a sala esvaziar) pra garantir que o apagamento pegue.");
}

main()
  .catch((e) => {
    console.error("Erro:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
