// Diagnóstico: descobre quantas perguntas do banco NÃO aparecem em sala
// nenhuma, e por quê.
//
// Uma pergunta só chega numa sala se passar por três filtros:
//   1. status = "approved"  (pendente ou rejeitada não entra)
//   2. themeKey bate com o tema de alguma sala configurada
//   3. difficulty é "facil"/"medio" (sala Padrão) ou "dificil" (Avançada)
//
// Se falhar em qualquer um, a pergunta fica órfã: ocupa espaço no banco mas
// nunca é sorteada.
//
// Uso: npm run diagnostico-salas
import { PrismaClient } from "@prisma/client";
import { QUIZ_ROOM_CONFIGS } from "../src/game/quizRoomConfigs.js";

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.quizQuestion.count();
  console.log(`Total de perguntas no banco: ${total}\n`);

  // ===== 1. Status =====
  const porStatus = await prisma.quizQuestion.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  console.log("POR STATUS:");
  porStatus.forEach((s) => {
    const marca = s.status === "approved" ? "✓" : "✗ (fora das salas)";
    console.log(`  ${s.status.padEnd(12)} ${String(s._count._all).padStart(6)}  ${marca}`);
  });

  const aprovadas = porStatus.find((s) => s.status === "approved")?._count._all || 0;

  // ===== 2. Dificuldade =====
  const porDif = await prisma.quizQuestion.groupBy({
    by: ["difficulty"],
    where: { status: "approved" },
    _count: { _all: true },
  });
  console.log("\nPOR DIFICULDADE (só aprovadas):");
  const VALIDAS = ["facil", "medio", "dificil"];
  let difInvalida = 0;
  porDif.forEach((d) => {
    const ok = VALIDAS.includes(d.difficulty);
    if (!ok) difInvalida += d._count._all;
    console.log(
      `  ${String(d.difficulty).padEnd(12)} ${String(d._count._all).padStart(6)}  ${ok ? "✓" : "✗ (fora das salas)"}`
    );
  });

  // ===== 3. Tema =====
  const temasComSala = new Set(
    Object.values(QUIZ_ROOM_CONFIGS).map((c) => c.themeKey).filter(Boolean)
  );
  const porTema = await prisma.quizQuestion.groupBy({
    by: ["themeKey"],
    where: { status: "approved" },
    _count: { _all: true },
  });

  const semSala = porTema.filter((t) => !temasComSala.has(t.themeKey));
  console.log("\nTEMAS SEM SALA CONFIGURADA:");
  if (semSala.length === 0) {
    console.log("  nenhum ✓");
  } else {
    semSala
      .sort((a, b) => b._count._all - a._count._all)
      .forEach((t) => console.log(`  ${String(t.themeKey).padEnd(16)} ${String(t._count._all).padStart(6)}  ✗`));
  }
  const orfasPorTema = semSala.reduce((s, t) => s + t._count._all, 0);

  // ===== Resumo =====
  const alcancaveis = await prisma.quizQuestion.count({
    where: {
      status: "approved",
      difficulty: { in: VALIDAS },
      themeKey: { in: [...temasComSala] },
    },
  });

  console.log("\n" + "=".repeat(50));
  console.log("RESUMO");
  console.log("=".repeat(50));
  console.log(`  Total no banco:                 ${String(total).padStart(6)}`);
  console.log(`  Aparecem em alguma sala:        ${String(alcancaveis).padStart(6)}`);
  console.log(`  ÓRFÃS (nunca são sorteadas):    ${String(total - alcancaveis).padStart(6)}`);
  console.log("");
  console.log("  Motivos:");
  console.log(`    - não aprovadas:              ${String(total - aprovadas).padStart(6)}`);
  console.log(`    - dificuldade inválida:       ${String(difInvalida).padStart(6)}`);
  console.log(`    - tema sem sala:              ${String(orfasPorTema).padStart(6)}`);

  // ===== Contagem por sala (o que aparece no card) =====
  console.log("\n" + "=".repeat(50));
  console.log("PERGUNTAS POR SALA (o número do card)");
  console.log("=".repeat(50));
  const linhas = [];
  for (const [roomId, config] of Object.entries(QUIZ_ROOM_CONFIGS)) {
    const where = { status: "approved" };
    if (config.themeKey) where.themeKey = config.themeKey;
    if (config.difficultyFilter) {
      where.difficulty = Array.isArray(config.difficultyFilter)
        ? { in: config.difficultyFilter }
        : config.difficultyFilter;
    }
    linhas.push({ label: config.label, n: await prisma.quizQuestion.count({ where }), arena: !!config.arena });
  }
  const semArena = linhas.filter((l) => !l.arena);
  semArena.sort((a, b) => b.n - a.n).forEach((l) => {
    console.log(`  ${l.label.slice(0, 38).padEnd(38)} ${String(l.n).padStart(6)}`);
  });
  const soma = semArena.reduce((s, l) => s + l.n, 0);
  console.log("  " + "-".repeat(45));
  console.log(`  ${"SOMA DOS CARDS (sem arenas)".padEnd(38)} ${String(soma).padStart(6)}`);
  console.log(`  ${"Alcançáveis (deveria bater)".padEnd(38)} ${String(alcancaveis).padStart(6)}`);
  if (soma !== alcancaveis) {
    console.log(`\n  ⚠️  Diferença de ${Math.abs(soma - alcancaveis)} — provável tema com sala única`);
    console.log("      (sem divisão Padrão/Avançada) ou filtro sobreposto.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
