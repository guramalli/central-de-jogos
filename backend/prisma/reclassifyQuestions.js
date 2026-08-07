// Script de reclassificação — roda UMA VEZ contra o banco já populado.
// Faz duas coisas:
//   1) Encontra perguntas de Direito (que hoje estão misturadas, principalmente
//      dentro de "geral") e move elas pro tema "direito".
//   2) Calcula uma dificuldade (fácil/médio/difícil) pra TODAS as perguntas,
//      usando uma heurística baseada no tamanho da pergunta/resposta e
//      presença de jargão técnico — não é perfeito, mas dá uma boa triagem
//      inicial. Dá pra ajustar manualmente depois pelo painel admin.
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

  // Calcula os limites (P33/P66) em cima da base inteira, pra dividir em 3 faixas parecidas.
  const scores = all.map((q) => difficultyScore(q.question, q.answer)).sort((a, b) => a - b);
  const p33 = scores[Math.floor(scores.length / 3)];
  const p66 = scores[Math.floor((2 * scores.length) / 3)];
  console.log(`Limites calculados — fácil até ${p33.toFixed(1)}, difícil acima de ${p66.toFixed(1)}`);

  let movedToLaw = 0;
  let updated = 0;

  for (let i = 0; i < all.length; i += BATCH_SIZE) {
    const batch = all.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (q) => {
        const score = difficultyScore(q.question, q.answer);
        const difficulty = score <= p33 ? "facil" : score >= p66 ? "dificil" : "medio";
        const newThemeKey = isLawQuestion(q.question) ? "direito" : q.themeKey;
        if (newThemeKey !== q.themeKey) movedToLaw++;

        await prisma.quizQuestion.update({
          where: { id: q.id },
          data: { difficulty, themeKey: newThemeKey },
        });
        updated++;
      })
    );
    process.stdout.write(`\r  ${Math.min(i + BATCH_SIZE, all.length)}/${all.length}`);
  }

  console.log(`\n\nConcluído! ${updated} perguntas atualizadas, ${movedToLaw} movidas pro tema "direito".`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
