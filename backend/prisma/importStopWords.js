// Importa o banco de palavras gerado (stopWords.js) pro banco de dados —
// soma ao que já existe, sem duplicar (respeitando o índice único de
// themeId+letter+word que já existe no schema).
import { PrismaClient } from "@prisma/client";
import { STOP_WORDS } from "./data/stopWords.js";

const prisma = new PrismaClient();

async function main() {
  const themes = await prisma.theme.findMany();
  const themeByKey = Object.fromEntries(themes.map((t) => [t.key, t]));

  let inserted = 0;
  let skipped = 0;
  let unknownThemes = [];

  for (const [themeKey, letterMap] of Object.entries(STOP_WORDS)) {
    const theme = themeByKey[themeKey];
    if (!theme) {
      unknownThemes.push(themeKey);
      continue;
    }

    for (const [letter, words] of Object.entries(letterMap)) {
      for (const word of words) {
        try {
          await prisma.wordEntry.create({
            data: { themeId: theme.id, letter, word, status: "approved" },
          });
          inserted++;
        } catch (err) {
          // erro de índice único = palavra já existe pra esse tema+letra — pula
          if (err.code === "P2002") {
            skipped++;
          } else {
            console.error(`Erro ao inserir "${word}" (${themeKey}/${letter}):`, err.message);
          }
        }
      }
    }
  }

  console.log(`✅ Concluído! ${inserted} palavras novas inseridas, ${skipped} já existiam (puladas).`);
  if (unknownThemes.length > 0) {
    console.log(`⚠️ Temas não encontrados no banco (verifique o key): ${unknownThemes.join(", ")}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
