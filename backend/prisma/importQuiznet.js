// Importação em massa do banco de perguntas "Quiznet 2014" — roda UMA VEZ
// (não precisa rodar de novo depois, a menos que você troque o arquivo de
// dados). Diferente do seedQuiz.js normal, esse aqui não confere duplicata
// pergunta por pergunta (seria lentíssimo pra mais de 10 mil perguntas) —
// já foi filtrado antes de virar esse arquivo, então é seguro rodar 1x.
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();
const BATCH_SIZE = 500;

async function main() {
  const dataPath = path.join(__dirname, "data", "quiznet.json");
  const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  let totalInserted = 0;
  for (const [themeKey, items] of Object.entries(data)) {
    const rows = items.map((it) => ({
      themeKey,
      question: it.question,
      answer: it.answer,
      status: "approved",
    }));

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      await prisma.quizQuestion.createMany({ data: batch });
      totalInserted += batch.length;
      process.stdout.write(`\r  ${themeKey}: ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`);
    }
    console.log(` ✔`);
  }
  console.log(`\nImportação concluída! ${totalInserted} perguntas novas adicionadas ao todo.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
