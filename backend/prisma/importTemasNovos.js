// Importa as perguntas novas do Quiz — soma ao que já existe no banco,
// sem duplicar (compara tema + texto da pergunta).
import { PrismaClient } from "@prisma/client";
import { TEMAS_NOVOS } from "./data/quizTemasNovos.js";

const prisma = new PrismaClient();

async function main() {
  let inseridas = 0;
  let puladas = 0;

  for (const [themeKey, perguntas] of Object.entries(TEMAS_NOVOS)) {
    let doTema = 0;
    for (const q of perguntas) {
      const existe = await prisma.quizQuestion.findFirst({
        where: { themeKey, question: q.question },
      });
      if (existe) {
        puladas++;
        continue;
      }
      await prisma.quizQuestion.create({
        data: {
          themeKey,
          question: q.question,
          answer: q.answer,
          difficulty: q.difficulty || "medio",
          status: "approved",
          validated: true, // escritas e revisadas manualmente
        },
      });
      inseridas++;
      doTema++;
    }
    console.log(`  ${themeKey.padEnd(12)} +${doTema}`);
  }

  console.log("");
  console.log(`✅ Concluído! ${inseridas} pergunta(s) nova(s) inserida(s), ${puladas} já existiam.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
