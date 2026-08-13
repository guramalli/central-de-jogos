// Importa o lote de perguntas DIFÍCEIS — feito pra abastecer as salas
// avançadas dos temas que tinham menos de 60 perguntas nesse nível.
// Soma ao que já existe, sem duplicar (compara pelo texto da pergunta).
import { PrismaClient } from "@prisma/client";
import { QUESTOES_DIFICEIS } from "./data/quizDificeis.js";

const prisma = new PrismaClient();

async function main() {
  let inseridas = 0;
  let puladas = 0;

  for (const [themeKey, perguntas] of Object.entries(QUESTOES_DIFICEIS)) {
    let doTema = 0;
    for (const q of perguntas) {
      // Busca só pelo texto: os scripts de migração mudam o themeKey de
      // perguntas já importadas, e filtrar por tema criaria duplicatas.
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
          difficulty: q.difficulty || "dificil",
          status: "approved",
          validated: true,
        },
      });
      inseridas++;
      doTema++;
    }
    console.log(`  ${themeKey.padEnd(12)} +${doTema}`);
  }

  console.log("");
  console.log(`✅ Concluído! ${inseridas} pergunta(s) nova(s), ${puladas} já existiam.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
