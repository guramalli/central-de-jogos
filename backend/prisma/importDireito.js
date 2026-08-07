// Importa as perguntas adicionais de Direito (seedDireito.js) — evita
// duplicar caso alguma já exista (checagem pelo texto exato da pergunta).
import { PrismaClient } from "@prisma/client";
import { DIREITO_QUESTIONS } from "./seedDireito.js";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.quizQuestion.findMany({
    where: { themeKey: "direito" },
    select: { question: true },
  });
  const existingSet = new Set(existing.map((q) => q.question));

  const toInsert = DIREITO_QUESTIONS.filter((q) => !existingSet.has(q.question)).map((q) => ({
    themeKey: "direito",
    question: q.question,
    answer: q.answer,
    status: "approved",
    difficulty: q.difficulty,
  }));

  if (toInsert.length === 0) {
    console.log("Nenhuma pergunta nova pra adicionar — todas já existem.");
    return;
  }

  await prisma.quizQuestion.createMany({ data: toInsert });
  console.log(`✅ ${toInsert.length} novas perguntas de Direito adicionadas.`);
  console.log(`   (${DIREITO_QUESTIONS.length - toInsert.length} já existiam e foram puladas.)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
