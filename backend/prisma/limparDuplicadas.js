// Encontra e remove perguntas duplicadas no banco.
//
// Por que existem duplicatas: os importadores antigos verificavam se a
// pergunta já existia buscando por TEMA + TEXTO. Só que os scripts de
// migração (mover-anime, mover-mitologia, mover-games) mudam o tema de
// perguntas já importadas. Ao rodar o import de novo, o script não achava
// a pergunta no tema original e criava uma cópia.
//
// O importador já foi corrigido (agora busca só pelo texto). Este script
// limpa as duplicatas que entraram antes da correção.
//
// Ao escolher qual cópia manter, prioriza:
//   1. A que está aprovada (status = "approved")
//   2. A mais antiga (provavelmente a que já tem histórico de uso)
//
// Uso:
//   npm run limpar-duplicadas          -> só MOSTRA o que seria removido
//   npm run limpar-duplicadas -- --go  -> remove de verdade
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const executar = process.argv.includes("--go");

  const todas = await prisma.quizQuestion.findMany({
    select: {
      id: true,
      question: true,
      answer: true,
      themeKey: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Analisando ${todas.length} perguntas...\n`);

  // Agrupa por texto normalizado (ignora acento, maiúscula e pontuação,
  // pra pegar também variações que escaparam do importador).
  const grupos = new Map();
  for (const q of todas) {
    const chave = normalizar(q.question);
    if (!chave) continue;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(q);
  }

  const duplicados = [...grupos.values()].filter((g) => g.length > 1);

  if (duplicados.length === 0) {
    console.log("Nenhuma pergunta duplicada. ✨");
    return;
  }

  const paraRemover = [];
  const temasEnvolvidos = {};

  for (const grupo of duplicados) {
    // Mantém a aprovada mais antiga; se nenhuma estiver aprovada, a mais
    // antiga mesmo. As demais são removidas.
    const ordenado = [...grupo].sort((a, b) => {
      const aOk = a.status === "approved" ? 0 : 1;
      const bOk = b.status === "approved" ? 0 : 1;
      if (aOk !== bOk) return aOk - bOk;
      return a.createdAt - b.createdAt;
    });
    const [manter, ...remover] = ordenado;
    for (const r of remover) {
      paraRemover.push(r);
      const par = `${r.themeKey} (dup de ${manter.themeKey})`;
      temasEnvolvidos[par] = (temasEnvolvidos[par] || 0) + 1;
    }
  }

  console.log(`Grupos com repetição:  ${String(duplicados.length).padStart(5)}`);
  console.log(`Cópias a remover:      ${String(paraRemover.length).padStart(5)}`);

  console.log("\nDe onde saem as cópias:");
  Object.entries(temasEnvolvidos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([par, n]) => console.log(`  ${par.padEnd(38)} ${n}`));

  console.log("\nExemplos:");
  duplicados.slice(0, 6).forEach((g) => {
    console.log(`  "${g[0].question.slice(0, 60)}"`);
    g.forEach((q) => {
      console.log(`     ${q.themeKey.padEnd(14)} ${q.status.padEnd(9)} ${q.createdAt.toISOString().slice(0, 10)}`);
    });
  });

  if (!executar) {
    console.log("\n⚠️  Nada foi removido (modo de simulação).");
    console.log("    Cada grupo mantém uma cópia (a aprovada mais antiga).");
    console.log("    Pra aplicar: npm run limpar-duplicadas -- --go");
    return;
  }

  const r = await prisma.quizQuestion.deleteMany({
    where: { id: { in: paraRemover.map((q) => q.id) } },
  });

  console.log(`\n✅ ${r.count} cópia(s) removida(s). Cada pergunta ficou com uma única versão.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
