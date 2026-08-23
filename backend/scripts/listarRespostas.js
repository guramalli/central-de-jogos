// Lista TODAS as respostas já usadas num tema ou sala do Quiz.
//
// PARA QUE SERVE:
// Antes de escrever um lote novo de perguntas, é preciso saber o que já
// existe — senão metade do trabalho é jogada fora na hora de importar.
// No lote de Futebol Avançado, 41 de 94 perguntas foram barradas porque a
// resposta já existia: 44% do esforço perdido.
//
// O problema é que quem escreve o lote só enxerga os ARQUIVOS de importação,
// e boa parte do banco veio de migrações e do painel admin. Nos arquivos de
// futebol havia 91 respostas; no banco, 416.
//
// A saída deste script é feita pra ser COLADA numa conversa: lista enxuta,
// só as respostas, sem os enunciados.
//
// Uso:
//   npm run listar-respostas -- futebol              (tema inteiro)
//   npm run listar-respostas -- futebol dificil      (só a faixa da Avançada)
//   npm run listar-respostas -- futebol facil,medio  (só a faixa da Padrão)
import "dotenv/config";
import { prisma } from "../src/db.js";

async function main() {
  const [tema, dificuldades] = process.argv.slice(2);

  if (!tema) {
    const temas = await prisma.quizQuestion.groupBy({
      by: ["themeKey"],
      where: { status: "approved" },
      _count: { _all: true },
      orderBy: { _count: { themeKey: "desc" } },
    });
    console.log("Uso: npm run listar-respostas -- TEMA [dificuldades]\n");
    console.log("Temas disponíveis:");
    for (const t of temas) {
      console.log(`  ${String(t.themeKey).padEnd(18)} ${t._count._all} perguntas`);
    }
    return;
  }

  const where = { status: "approved", themeKey: tema };
  if (dificuldades) {
    const lista = dificuldades.split(",").map((d) => d.trim());
    where.difficulty = lista.length > 1 ? { in: lista } : lista[0];
  }

  const perguntas = await prisma.quizQuestion.findMany({
    where,
    select: { answer: true, difficulty: true },
    orderBy: { answer: "asc" },
  });

  if (perguntas.length === 0) {
    console.log(`Nenhuma pergunta encontrada para o tema "${tema}".`);
    return;
  }

  // Agrupa por resposta normalizada, mas mostra a grafia original — quem vai
  // ler é uma pessoa, não um programa.
  const chave = (t) =>
    (t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

  const mapa = new Map();
  for (const p of perguntas) {
    const c = chave(p.answer);
    if (!mapa.has(c)) mapa.set(c, { texto: p.answer, vezes: 0 });
    mapa.get(c).vezes++;
  }

  const ordenadas = [...mapa.values()].sort((a, b) =>
    a.texto.localeCompare(b.texto, "pt-BR")
  );

  console.log(`\n=== ${tema}${dificuldades ? ` (${dificuldades})` : ""} ===`);
  console.log(`${perguntas.length} perguntas · ${ordenadas.length} respostas distintas\n`);

  // Uma por linha, com a contagem só quando repete. Formato pensado pra
  // colar numa conversa sem ocupar espaço demais.
  console.log(
    ordenadas
      .map((r) => (r.vezes > 1 ? `${r.texto} (${r.vezes}x)` : r.texto))
      .join(" · ")
  );

  console.log(`\n--- fim (${ordenadas.length} respostas) ---`);
}

main()
  .catch((e) => { console.error("Erro:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
