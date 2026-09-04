// Procura, numa sala do Quiz, perguntas DIFERENTES que têm a MESMA resposta.
//
// POR QUE ISSO IMPORTA:
// Os importadores evitam duplicata comparando o TEXTO da pergunta. Isso pega
// a mesma linha importada duas vezes, mas não pega duas perguntas escritas
// de formas diferentes sobre o mesmo assunto:
//
//   "Qual empresa criou o Counter-Strike como um mod de Half-Life?"
//   "Qual estúdio desenvolveu o Counter-Strike a partir de um mod?"
//
// Textos distintos, resposta idêntica — para quem joga, é a mesma pergunta
// voltando. É a explicação mais provável para a sensação de repetição numa
// sala que tem perguntas suficientes no banco.
//
// A comparação da resposta ignora acento, caixa e pontuação, porque
// "Pokémon", "pokemon" e "Pokemon!" são a mesma resposta na prática.
//
// Uso:
//   npm run respostas-repetidas -- quiz-games-facil
//   npm run respostas-repetidas -- quiz-games-facil --detalhe
//
// Sem --detalhe mostra só o resumo; com, lista cada pergunta envolvida.
import "dotenv/config";
import { prisma } from "../src/db.js";
import { QUIZ_ROOM_CONFIGS } from "../src/game/quizRoomConfigs.js";

function normalizar(s) {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

async function main() {
  const [sala, flag] = process.argv.slice(2);

  if (!sala) {
    console.log("Uso: npm run respostas-repetidas -- NOME_DA_SALA [--detalhe]\n");
    console.log("Salas de tema disponíveis:");
    for (const [id, c] of Object.entries(QUIZ_ROOM_CONFIGS)) {
      if (c.themeKey) console.log(`  ${id.padEnd(28)} ${c.label}`);
    }
    return;
  }

  const config = QUIZ_ROOM_CONFIGS[sala];
  if (!config) {
    console.log(`Sala "${sala}" não existe. Rode sem argumentos pra ver a lista.`);
    return;
  }

  // Mesmo filtro que a sala usa pra montar a fila — assim o resultado
  // corresponde exatamente ao que o jogador vê naquela sala.
  const where = { status: "approved" };
  if (config.themeKey) where.themeKey = config.themeKey;
  if (config.difficultyFilter) {
    where.difficulty = Array.isArray(config.difficultyFilter)
      ? { in: config.difficultyFilter }
      : config.difficultyFilter;
  }

  const perguntas = await prisma.quizQuestion.findMany({
    where,
    select: { id: true, question: true, answer: true, difficulty: true },
  });

  console.log(`\n=== ${config.label} (${sala}) ===`);
  console.log(`Perguntas na sala: ${perguntas.length}\n`);

  const porResposta = new Map();
  for (const p of perguntas) {
    const chave = normalizar(p.answer);
    if (!porResposta.has(chave)) porResposta.set(chave, []);
    porResposta.get(chave).push(p);
  }

  const repetidas = [...porResposta.values()]
    .filter((g) => g.length > 1)
    .sort((a, b) => b.length - a.length);

  const envolvidas = repetidas.reduce((s, g) => s + g.length, 0);
  const distintas = porResposta.size;

  console.log(`Respostas distintas      : ${distintas}`);
  console.log(`Respostas que se repetem : ${repetidas.length}`);
  console.log(`Perguntas envolvidas     : ${envolvidas} (${Math.round((envolvidas / perguntas.length) * 100)}% da sala)`);
  console.log("");
  console.log(`VARIEDADE REAL: ${distintas} respostas diferentes em ${perguntas.length} perguntas.`);
  console.log(`Ou seja, a sala parece ter ${perguntas.length} perguntas mas soa como ${distintas}.`);

  if (repetidas.length === 0) {
    console.log("\nNenhuma resposta repetida — a repetição que você sentiu tem outra causa.");
    return;
  }

  console.log("\n--- respostas mais repetidas ---");
  const mostrar = flag === "--detalhe" ? repetidas : repetidas.slice(0, 15);
  for (const grupo of mostrar) {
    console.log(`\n  ▸ "${grupo[0].answer}" — ${grupo.length} perguntas`);
    for (const p of grupo) {
      console.log(`      [${p.difficulty}] ${p.question.slice(0, 90)}`);
    }
  }

  if (flag !== "--detalhe" && repetidas.length > 15) {
    console.log(`\n  ... e mais ${repetidas.length - 15} respostas repetidas.`);
    console.log(`  Rode com --detalhe pra ver todas.`);
  }
}

main()
  .catch((e) => {
    console.error("Erro:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
