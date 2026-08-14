// Importa o lote de futebol "papo de torcedor" para a sala Padrão.
// Soma ao que já existe, sem duplicar (compara pelo texto da pergunta).
import { PrismaClient } from "@prisma/client";
import { FUTEBOL_TORCEDOR } from "./data/quizFutebolTorcedor.js";

const prisma = new PrismaClient();

async function main() {
  let inseridas = 0;
  let puladas = 0;

  for (const [themeKey, perguntas] of Object.entries(FUTEBOL_TORCEDOR)) {
    for (const q of perguntas) {
      // Busca só pelo texto: os scripts de migração mudam o themeKey de
      // perguntas já importadas, e filtrar por tema criaria duplicatas.
      const existe = await prisma.quizQuestion.findFirst({ where: { question: q.question } });
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
          validated: true,
        },
      });
      inseridas++;
    }
  }

  console.log(`✅ ${inseridas} pergunta(s) nova(s) de futebol, ${puladas} já existiam.`);
  console.log("   Todas entram na sala Futebol — Padrão (fácil + médio).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
