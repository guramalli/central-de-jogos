// Script de reclassificação — roda UMA VEZ contra o banco já populado.
// Faz duas coisas:
//   1) Encontra perguntas de Direito (que hoje estão misturadas, principalmente
//      dentro de "geral") e move elas pro tema "direito".
//   2) Calcula a dificuldade (fácil/difícil) de cada pergunta, comparando ela
//      só com as outras perguntas DO MESMO TEMA (não com a base toda) — assim
//      cada tema fica com uma divisão equilibrada de metade fácil, metade
//      difícil, mesmo que um tema seja "naturalmente" mais difícil que outro.
//      Não é perfeito, mas dá uma boa triagem inicial pra separar as salas.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BATCH_SIZE = 300;

const LAW_KEYWORDS = [
  "direito civil", "direito penal", "direito constitucional", "direito administrativo",
  "código civil", "código penal", "constituição federal", "stf", "supremo tribunal",
  "oab", "jurisprudência", "processo civil", "processo penal", "habeas corpus",
  "ministério público", "tribunal de justiça", "código de defesa do consumidor",
  "clt", "direito trabalhista", "direito tributário", "código tributário",
  "lei nº", "artigo da constituição", "poder judiciário", "direito do trabalho",
  "contrato de trabalho", "direito penal brasileiro",
];

function isLawQuestion(question) {
  const q = question.toLowerCase();
  return LAW_KEYWORDS.some((kw) => q.includes(kw));
}

function difficultyScore(question, answer) {
  let score = 0;
  score += answer.length / 3;
  score += answer.split(/\s+/).length * 4;
  score += question.length / 40;
  if (/\d{4}/.test(question)) score += 3;
  if (/[Aa]rt\.|§|Lei n[ºo°]/.test(question)) score += 8;
  return score;
}

async function main() {
  console.log("Carregando todas as perguntas...");
  const all = await prisma.quizQuestion.findMany({
    select: { id: true, themeKey: true, question: true, answer: true },
  });
  console.log(`${all.length} perguntas encontradas.`);

  // Primeiro passo: decide o tema final de cada pergunta (move Direito).
  const withFinalTheme = all.map((q) => ({
    ...q,
    finalTheme: isLawQuestion(q.question) ? "direito" : q.themeKey,
    score: difficultyScore(q.question, q.answer),
  }));

  // Agrupa por tema FINAL, pra calcular a mediana de cada tema separadamente.
  const byTheme = new Map();
  for (const q of withFinalTheme) {
    if (!byTheme.has(q.finalTheme)) byTheme.set(q.finalTheme, []);
    byTheme.get(q.finalTheme).push(q.score);
  }
  const medianByTheme = new Map();
  for (const [theme, scores] of byTheme.entries()) {
    const sorted = [...scores].sort((a, b) => a - b);
    medianByTheme.set(theme, sorted[Math.floor(sorted.length / 2)]);
  }

  console.log("Medianas por tema:");
  for (const [theme, median] of medianByTheme.entries()) {
    console.log(`  ${theme}: ${median.toFixed(1)} (${byTheme.get(theme).length} perguntas)`);
  }

  let movedToLaw = 0;
  let updated = 0;

  for (let i = 0; i < withFinalTheme.length; i += BATCH_SIZE) {
    const batch = withFinalTheme.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (q) => {
        const median = medianByTheme.get(q.finalTheme);
        const difficulty = q.score <= median ? "facil" : "dificil";
        if (q.finalTheme !== q.themeKey) movedToLaw++;

        await prisma.quizQuestion.update({
          where: { id: q.id },
          data: { difficulty, themeKey: q.finalTheme },
        });
        updated++;
      })
    );
    process.stdout.write(`\r  ${Math.min(i + BATCH_SIZE, withFinalTheme.length)}/${withFinalTheme.length}`);
  }

  console.log(`\n\nConcluído! ${updated} perguntas atualizadas, ${movedToLaw} movidas pro tema "direito".`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
