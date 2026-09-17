/**
 * LIMPA AS PERGUNTAS COM EXPLICAÇÃO NO ENUNCIADO
 *
 * Uso:
 *   npm run limpar-explicacao              -> só mostra o que faria
 *   npm run limpar-explicacao -- --apagar  -> apaga de verdade
 *
 * POR QUE ESTE SCRIPT EXISTE
 *
 * 86 perguntas foram escritas com um remendo no fim do enunciado — "A
 * pergunta é sobre..." — e depois reescritas nos arquivos. Só que o
 * importador **nunca atualiza nem apaga**: ele compara pelo texto e pula o
 * que já existe. Como o texto reescrito é diferente, ele entrou como
 * pergunta NOVA, e a versão ruim continuou no banco.
 *
 * Resultado: as duas versões convivem, e a antiga ainda aparece no jogo.
 * Reimportar não resolve — só este script resolve.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APAGAR = process.argv.includes("--apagar");

// Marcas do remendo. A segunda pega variações que possam ter escapado.
const MARCAS = ["A pergunta é", "A pergunta e sobre"];

async function main() {
  const todas = await prisma.quizQuestion.findMany({
    select: { id: true, question: true, answer: true, themeKey: true, difficulty: true },
  });

  const ruins = todas.filter((q) => MARCAS.some((m) => q.question.includes(m)));

  if (ruins.length === 0) {
    console.log("\n✅ Nenhuma pergunta com explicação no enunciado no banco.\n");
    return;
  }

  console.log(`\nEncontradas ${ruins.length} perguntas com explicação no enunciado:\n`);

  const porTema = {};
  for (const q of ruins) {
    porTema[q.themeKey] = (porTema[q.themeKey] || 0) + 1;
  }
  for (const [tema, n] of Object.entries(porTema).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${tema}: ${n}`);
  }

  console.log("\nExemplos:\n");
  for (const q of ruins.slice(0, 8)) {
    console.log(`  [${q.themeKey}/${q.difficulty}] "${q.question.slice(0, 70)}..."`);
    console.log(`     -> ${q.answer}`);
  }

  if (!APAGAR) {
    console.log(`\n⚠️  Isto foi só a prévia. Pra apagar de verdade:`);
    console.log(`    npm run limpar-explicacao -- --apagar\n`);
    return;
  }

  const res = await prisma.quizQuestion.deleteMany({
    where: { id: { in: ruins.map((q) => q.id) } },
  });
  console.log(`\n🗑️  ${res.count} perguntas apagadas.`);
  console.log(`\nAs versões reescritas já estão no banco (entraram como novas`);
  console.log(`no import), então nada precisa ser reimportado.\n`);
}

main()
  .catch((e) => {
    console.error("Falhou:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
