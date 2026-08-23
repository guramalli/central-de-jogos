// Importa o lote de games (sala Padrão). Soma ao banco sem duplicar (texto).
import { PrismaClient } from "@prisma/client";
import { FUTEBOL_AVANCADO } from "./data/quizFutebolAvancado.js";

const prisma = new PrismaClient();

async function main() {
  let inseridas = 0, puladas = 0;
  for (const [themeKey, perguntas] of Object.entries(FUTEBOL_AVANCADO)) {
    for (const q of perguntas) {
      const existe = await prisma.quizQuestion.findFirst({ where: { question: q.question } });
      if (existe) { puladas++; continue; }
      await prisma.quizQuestion.create({
        data: { themeKey, question: q.question, answer: q.answer, difficulty: q.difficulty, status: "approved", validated: true },
      });
      inseridas++;
    }
  }
  console.log(`✅ ${inseridas} pergunta(s) nova(s) de games (Futebol Avançado), ${puladas} já existiam.`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
