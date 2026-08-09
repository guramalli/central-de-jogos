// Move perguntas sobre mitologia e religião que estão espalhadas em outros
// temas (principalmente no "geral") para o tema novo "mitologia".
//
// Uso:
//   npm run mover-mitologia          -> só MOSTRA o que seria movido
//   npm run mover-mitologia -- --go  -> move de verdade
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Termos inequívocos de mitologia e religião. Escolhidos com cuidado para
// não pegar homônimos: "marte" e "vênus" ficaram de fora porque são
// planetas com mais frequência que deuses romanos; "santo" e "papa" também,
// porque casam com nomes de cidade ("Santo André") e apelidos ("Papa Doc").
const TERMOS = [
  // Genéricos
  "mitologia", "mitologico", "mitologica", "deusa", "deuses", "divindade",
  "panteao", "olimpo", "oraculo", "semideus", "profecia divina",
  // Grega e romana
  "zeus", "hera", "poseidon", "hades", "atena", "apolo", "artemis",
  "afrodite", "hermes", "dionisio", "hefesto", "cronos", "gaia",
  "prometeu", "pandora", "hercules", "aquiles", "odisseu", "medusa",
  "centauro", "minotauro", "ciclope", "ninfa", "musa grega",
  "minerva", "juno", "netuno romano", "baco", "cupido",
  // Nórdica
  "odin", "thor mitologia", "loki", "valquiria", "valhalla", "ragnarok",
  "asgard", "yggdrasil", "freya", "midgard",
  // Egípcia e mesopotâmica
  "osiris", "isis", "anubis", "horus", "ra deus", "faraó divino",
  "inana", "marduk", "gilgamesh",
  // Africana e afro-brasileira
  "orixa", "orixas", "iemanja", "oxala", "ogum", "xango", "oxossi",
  "candomble", "umbanda", "exu", "iansa", "oxum",
  // Judaico-cristã
  "biblia", "biblico", "biblica", "apostolo", "evangelho", "testamento",
  "profeta", "arcanjo", "moises", "abraao", "salomao", "jesus cristo",
  "crucificacao", "ressurreicao", "mandamentos", "parabola biblica",
  "vaticano", "papado", "sacramento", "pentateuco", "genesis biblico",
  // Islâmica, oriental e outras
  "alcorao", "maome", "islamismo", "buda", "budismo", "hinduismo",
  "xintoismo", "vishnu", "shiva deus", "karma", "nirvana",
  "espiritismo", "kardec", "reencarnacao",
];

function pareceMitologia(texto) {
  const t = String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return TERMOS.some((termo) => {
    const esc = termo.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^\\p{L}\\p{N}])${esc}([^\\p{L}\\p{N}]|$)`, "iu").test(t);
  });
}

async function main() {
  const executar = process.argv.includes("--go");

  const perguntas = await prisma.quizQuestion.findMany({
    where: { NOT: { themeKey: "mitologia" } },
  });

  const candidatas = perguntas.filter(
    (q) => pareceMitologia(q.question) || pareceMitologia(q.answer)
  );

  if (candidatas.length === 0) {
    console.log("Nenhuma pergunta de mitologia/religião encontrada em outros temas.");
    return;
  }

  const porTema = {};
  for (const q of candidatas) {
    porTema[q.themeKey] = (porTema[q.themeKey] || 0) + 1;
  }

  console.log(`Encontradas ${candidatas.length} pergunta(s) de mitologia/religião:\n`);
  for (const [tema, qtd] of Object.entries(porTema).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${tema.padEnd(14)} ${qtd}`);
  }

  console.log("\nExemplos do que seria movido:");
  candidatas.slice(0, 12).forEach((q) => {
    console.log(`  [${q.themeKey}] ${q.question.slice(0, 66)}`);
  });

  if (!executar) {
    console.log("\n⚠️  Nada foi alterado (modo de simulação).");
    console.log("    Confira a lista. Pra mover de verdade:");
    console.log("    npm run mover-mitologia -- --go");
    return;
  }

  let movidas = 0;
  for (const q of candidatas) {
    await prisma.quizQuestion.update({
      where: { id: q.id },
      data: { themeKey: "mitologia" },
    });
    movidas++;
  }

  console.log(`\n✅ ${movidas} pergunta(s) movida(s) para o tema "mitologia".`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
