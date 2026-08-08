// Move perguntas de anime, mangá e HQ que estão espalhadas em outros temas
// (principalmente "series", "cinema" e "geral") para o tema novo "anime".
//
// Roda em dois modos:
//   npm run mover-anime          -> só MOSTRA o que seria movido (seguro)
//   npm run mover-anime -- --go  -> move de verdade
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Termos que indicam com bastante segurança que a pergunta é de anime/mangá
// ou de quadrinhos. Só move quando o termo aparece — na dúvida, deixa onde
// está (é melhor deixar passar uma do que mover algo que não é).
const TERMOS_ANIME = [
  "anime", "mangá", "mangá", "otaku", "shounen", "shonen", "shoujo",
  "naruto", "sasuke", "sakura", "konoha", "hokage", "akatsuki",
  "goku", "vegeta", "dragon ball", "kamehameha", "saiyajin", "namekusei",
  "one piece", "luffy", "zoro", "chapéu de palha", "akuma no mi",
  "bleach", "ichigo", "shinigami",
  "death note", "ryuk", "shinigami",
  "attack on titan", "shingeki", "mikasa", "titã",
  "demon slayer", "kimetsu", "tanjiro", "nezuko", "hashira",
  "jujutsu kaisen", "gojo", "itadori", "sukuna",
  "my hero academia", "boku no hero", "deku", "all might",
  "fullmetal alchemist", "alquimista de aço", "edward elric",
  "evangelion", "shinji", "eva-01",
  "sailor moon", "usagi",
  "cavaleiros do zodíaco", "saint seiya", "seiya", "athena",
  "pokemon", "pokémon", "pikachu", "ash ketchum", "pokébola",
  "digimon", "yu-gi-oh", "yugioh", "duelo de monstros",
  "hunter x hunter", "killua",
  "tokyo ghoul", "kaneki",
  "cowboy bebop", "spike spiegel",
  "studio ghibli", "ghibli", "miyazaki", "totoro", "chihiro",
  "one punch man", "saitama",
  "sword art online", "kirito",
  "cdz", "dbz", "dragon ball z",
  "samurai x", "rurouni kenshin", "kenshin",
  "yu yu hakusho", "yusuke",
  "inuyasha", "kagome",
  "shurato", "cybercops", "jaspion", "changeman", "jiraiya",
  // HQ / quadrinhos
  "quadrinho", "quadrinhos", "hq", "hqs", "graphic novel", "mangaká", "mangaka",
  "marvel comics", "dc comics", "stan lee", "jack kirby",
  "turma da monica", "cebolinha", "cascão", "chico bento",
  "maurício de sousa", "mauricio de sousa",
  "recruta zero", "hagar", "garfield", "snoopy", "calvin e haroldo",
  "tintim", "asterix", "obelix", "mafalda",
  "gibi", "almanaque",
];

function pareceAnime(texto) {
  const t = texto.toLowerCase();
  // Usa limite de palavra em vez de "contém solto" — sem isso, termos
  // curtos casavam no meio de outras palavras ("gon" dentro de
  // "Gonçalves", por exemplo), gerando centenas de falsos positivos.
  return TERMOS_ANIME.some((termo) => {
    const escapado = termo.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|[^\\p{L}\\p{N}])${escapado}([^\\p{L}\\p{N}]|$)`, "iu");
    return regex.test(t);
  });
}

async function main() {
  const executar = process.argv.includes("--go");

  // Não mexe nas que já estão no tema anime.
  const perguntas = await prisma.quizQuestion.findMany({
    where: { NOT: { themeKey: "anime" } },
  });

  const candidatas = perguntas.filter(
    (q) => pareceAnime(q.question) || pareceAnime(q.answer)
  );

  if (candidatas.length === 0) {
    console.log("Nenhuma pergunta de anime/HQ encontrada em outros temas.");
    return;
  }

  // Agrupa por tema de origem, só pra dar uma visão do que vai sair de onde.
  const porTema = {};
  for (const q of candidatas) {
    porTema[q.themeKey] = (porTema[q.themeKey] || 0) + 1;
  }

  console.log(`Encontradas ${candidatas.length} pergunta(s) de anime/HQ em outros temas:\n`);
  for (const [tema, qtd] of Object.entries(porTema).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${tema.padEnd(14)} ${qtd}`);
  }

  console.log("\nExemplos do que seria movido:");
  candidatas.slice(0, 10).forEach((q) => {
    console.log(`  [${q.themeKey}] ${q.question.slice(0, 70)}...`);
  });

  if (!executar) {
    console.log("\n⚠️  Nada foi alterado (modo de simulação).");
    console.log("    Pra mover de verdade, rode: npm run mover-anime -- --go");
    return;
  }

  let movidas = 0;
  for (const q of candidatas) {
    await prisma.quizQuestion.update({
      where: { id: q.id },
      data: { themeKey: "anime" },
    });
    movidas++;
  }

  console.log(`\n✅ ${movidas} pergunta(s) movida(s) para o tema "anime".`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
