/**
 * LIMPA PALAVRAS EM LETRAS QUE O STOP NÃO SORTEIA
 *
 * Uso:
 *   npm run limpar-letras                 -> mostra o que encontrou
 *   npm run limpar-letras -- --confirmar  -> apaga
 *
 * O Stop sorteia 23 letras (ver LETTERS no StopRoom.js). K, W e Y ficam de
 * fora. Palavra cadastrada nelas nunca sai numa rodada, mas continua contando
 * no total do tema — o que faz o glossário parecer mais completo do que é e
 * atrapalha a decisão de abrir ou não um tema nas salas oficiais.
 *
 * Este script existe pro caso de já terem entrado no banco antes da trava no
 * importador (zip 315). Rodar depois disso deve encontrar zero.
 */
import { prisma } from "../src/db.js";

const confirmar = process.argv.includes("--confirmar");
const LETRAS_DO_SORTEIO = "ABCDEFGHIJLMNOPQRSTUVXZ".split("");

async function main() {
  const sobrando = await prisma.wordEntry.findMany({
    where: { letter: { notIn: LETRAS_DO_SORTEIO } },
    include: { theme: { select: { name: true } } },
    orderBy: [{ letter: "asc" }, { word: "asc" }],
  });

  if (sobrando.length === 0) {
    console.log("\nNenhuma palavra em letra fora do sorteio. 🎉\n");
    return;
  }

  console.log(`\n${sobrando.length} palavras em letras que nunca são sorteadas:\n`);

  const porTema = {};
  for (const p of sobrando) {
    const chave = `${p.theme.name} · ${p.letter}`;
    (porTema[chave] ||= []).push(p.word);
  }
  for (const [chave, palavras] of Object.entries(porTema)) {
    console.log(`  ${chave} (${palavras.length}): ${palavras.slice(0, 8).join(", ")}${palavras.length > 8 ? "..." : ""}`);
  }

  if (!confirmar) {
    console.log("\n--- SIMULAÇÃO — nada foi apagado ---");
    console.log("Pra apagar:\n");
    console.log("  npm run limpar-letras -- --confirmar\n");
    return;
  }

  const { count } = await prisma.wordEntry.deleteMany({
    where: { letter: { notIn: LETRAS_DO_SORTEIO } },
  });
  console.log(`\n✅ ${count} palavras apagadas.\n`);
}

main()
  .catch((e) => {
    console.error("Erro:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
