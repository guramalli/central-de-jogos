// Script de manutenção: conta as perguntas do Quiz DIRETO NO BANCO,
// mostrando por tema, por dificuldade e por sala.
//
// É a resposta certa pra "quantas perguntas essa sala tem de verdade": os
// arquivos em prisma/data são só a fonte das importações, e não batem com o
// banco depois das migrações de tema e das sugestões aprovadas.
//
// Uso (dentro da pasta backend):
//   node scripts/contarPerguntas.js
//
// ou, via npm:
//   npm run contar-perguntas

import "dotenv/config";
import { prisma } from "../src/db.js";
import { QUIZ_ROOM_CONFIGS } from "../src/game/quizRoomConfigs.js";

const MINIMO_SAUDAVEL = 80; // abaixo disso a fila embaralhada repete rápido

async function main() {
  const todas = await prisma.quizQuestion.groupBy({
    by: ["themeKey", "difficulty"],
    where: { status: "approved" },
    _count: { _all: true },
  });

  const porTema = {};
  for (const linha of todas) {
    const t = (porTema[linha.themeKey] ||= { facil: 0, medio: 0, dificil: 0, total: 0 });
    t[linha.difficulty] = (t[linha.difficulty] || 0) + linha._count._all;
    t.total += linha._count._all;
  }

  console.log("═══ POR TEMA (perguntas aprovadas no banco) ═══\n");
  console.log(`${"tema".padEnd(16)}${"fácil".padStart(7)}${"médio".padStart(8)}${"difícil".padStart(9)}${"total".padStart(8)}`);
  const temas = Object.entries(porTema).sort((a, b) => b[1].total - a[1].total);
  for (const [tema, v] of temas) {
    console.log(
      `${tema.padEnd(16)}${String(v.facil).padStart(7)}${String(v.medio).padStart(8)}${String(v.dificil).padStart(9)}${String(v.total).padStart(8)}`
    );
  }
  const total = temas.reduce((s, [, v]) => s + v.total, 0);
  console.log(`${"TOTAL".padEnd(16)}${String(total).padStart(32)}\n`);

  // Contagem por sala: é exatamente o número que aparece no card da lobby,
  // porque usa o mesmo filtro (tema + faixa de dificuldade da sala).
  console.log("═══ POR SALA (o número que aparece no card) ═══\n");
  const linhas = [];
  for (const [roomId, config] of Object.entries(QUIZ_ROOM_CONFIGS)) {
    const where = { status: "approved" };
    if (config.themeKey) where.themeKey = config.themeKey;
    if (config.difficultyFilter) {
      where.difficulty = Array.isArray(config.difficultyFilter)
        ? { in: config.difficultyFilter }
        : config.difficultyFilter;
    }
    const n = await prisma.quizQuestion.count({ where });
    linhas.push({ label: config.label, n });
  }
  linhas.sort((a, b) => a.n - b.n);
  for (const l of linhas) {
    const aviso = l.n < MINIMO_SAUDAVEL ? "  ⚠ pouca pergunta" : "";
    console.log(`  ${String(l.n).padStart(5)}  ${l.label}${aviso}`);
  }

  const fracas = linhas.filter((l) => l.n < MINIMO_SAUDAVEL);
  console.log("");
  if (fracas.length) {
    console.log(`⚠ ${fracas.length} sala(s) com menos de ${MINIMO_SAUDAVEL} perguntas — a fila embaralhada repete rápido nelas.`);
  } else {
    console.log("✅ Todas as salas têm um volume saudável de perguntas.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
