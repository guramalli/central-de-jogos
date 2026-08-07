// Substitui o conteúdo antigo do Quiznet (não validado) pelo novo conjunto
// validado pela IA — rodando localmente contra o arquivo quiznet_validado.json
// gerado pelo validateQuiznetOffline.js.
//
// PRESERVA (nunca apaga):
//   - Perguntas sugeridas por jogadores (têm suggestedById preenchido)
//   - As perguntas originais escritas à mão (seedQuiz.js) — identificadas
//     pelo texto exato, lido direto do arquivo, então nunca fica desatualizado
//
// APAGA e SUBSTITUI:
//   - Tudo que veio do import antigo do Quiznet (sem validação)
//
// Depois disso, importa o quiznet_validado.json fresquinho.
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();
const BATCH_SIZE = 500;

const VALID_PATH = path.join(__dirname, "data", "quiznet_validado.json");
const SEED_PATH = path.join(__dirname, "seedQuiz.js");

function getHandWrittenQuestions() {
  const content = fs.readFileSync(SEED_PATH, "utf-8");
  const matches = [...content.matchAll(/question:\s*"([^"]+)"/g)];
  return new Set(matches.map((m) => m[1]));
}

async function main() {
  if (!fs.existsSync(VALID_PATH)) {
    console.error(`❌ Não achei o arquivo ${VALID_PATH}`);
    console.error(`   Roda "npm run validate-quiznet-offline" primeiro.`);
    process.exit(1);
  }

  const handWritten = getHandWrittenQuestions();
  console.log(`${handWritten.size} perguntas escritas à mão serão preservadas.`);

  // Apaga tudo que NÃO foi sugerido por jogador E NÃO é uma pergunta escrita à mão.
  const candidates = await prisma.quizQuestion.findMany({
    where: { suggestedById: null },
    select: { id: true, question: true },
  });
  const toDelete = candidates.filter((q) => !handWritten.has(q.question)).map((q) => q.id);

  console.log(`Apagando ${toDelete.length} perguntas antigas (import não validado)...`);
  for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
    const batchIds = toDelete.slice(i, i + BATCH_SIZE);
    await prisma.quizQuestion.deleteMany({ where: { id: { in: batchIds } } });
    process.stdout.write(`\r  ${Math.min(i + BATCH_SIZE, toDelete.length)}/${toDelete.length}`);
  }
  console.log("\nApagado.");

  const validated = JSON.parse(fs.readFileSync(VALID_PATH, "utf-8"));
  let totalInserted = 0;

  for (const [themeKey, items] of Object.entries(validated)) {
    const rows = items.map((it) => ({
      themeKey,
      question: it.question,
      answer: it.answer,
      status: "approved",
      difficulty: it.difficulty || "medio",
    }));

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      await prisma.quizQuestion.createMany({ data: batch });
      totalInserted += batch.length;
      process.stdout.write(`\r  ${themeKey}: ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`);
    }
    console.log(` ✔ ${themeKey}`);
  }

  console.log(`\n✅ Concluído! ${totalInserted} perguntas validadas importadas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
