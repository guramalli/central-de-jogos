// Importa as perguntas novas do Quiz — soma ao que já existe no banco,
// sem duplicar (compara tema + texto da pergunta).
import { PrismaClient } from "@prisma/client";
import { AVANCADAS } from "./data/quizAvancadas.js";

const prisma = new PrismaClient();

async function main() {
  let inseridas = 0;
  let puladas = 0;

  for (const [themeKey, perguntas] of Object.entries(AVANCADAS)) {
    let doTema = 0;
    for (const q of perguntas) {
      // Busca SÓ pelo texto da pergunta, sem filtrar por tema. Isso é
      // essencial: os scripts de migração (mover-anime, mover-mitologia,
      // mover-games) mudam o themeKey de perguntas já importadas. Se a
      // busca considerasse o tema, o script não encontraria a pergunta no
      // tema original e criaria uma duplicata.
      const existe = await prisma.quizQuestion.findFirst({
        where: { question: q.question },
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
