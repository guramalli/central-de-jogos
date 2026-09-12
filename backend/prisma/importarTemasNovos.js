/**
 * IMPORTA as palavras dos temas "Anime e HQ" e "Estilos Musicais".
 *
 * Uso:
 *   npm run importar-temas-novos                 -> mostra o que faria
 *   npm run importar-temas-novos -- --confirmar  -> grava
 *
 * Roda depois do `npm run add-temas`, que cria os temas em si.
 *
 * IMPORTADOR RODADO É IMPORTADOR APOSENTADO: não rode de novo depois de
 * gravar. Os arquivos continuam com as palavras, e se você tiver apagado
 * alguma pelo painel, reimportar a traria de volta.
 *
 * As palavras entram como "approved" — elas vêm de lista curada, não de
 * sugestão de jogador.
 */
import { prisma } from "../src/db.js";
import { ANIME_HQ_WORDS } from "./data/stopWordsAnimeHq.js";
import { ESTILOS_MUSICAIS_WORDS } from "./data/stopWordsEstilosMusicais.js";
import { ANIMAIS_NOVAS } from "./data/stopWordsAnimaisNovas.js";
import { COR_NOVAS } from "./data/stopWordsCorNovas.js";
import { IDIOMAS_NOVAS } from "./data/stopWordsIdiomasNovas.js";
import { FRUTAS_NOVAS } from "./data/stopWordsFrutasNovas.js";

const confirmar = process.argv.includes("--confirmar");

// As letras que o Stop REALMENTE sorteia (ver LETTERS no StopRoom.js).
// K, W e Y não estão no sorteio: palavra cadastrada nelas nunca seria usada,
// e ainda contaria no total do tema, dando a impressão de um glossário maior
// do que ele é de fato.
const LETRAS_DO_SORTEIO = new Set("ABCDEFGHIJLMNOPQRSTUVXZ".split(""));

const LOTES = [
  { key: "animeHq", nome: "Anime e HQ", palavras: ANIME_HQ_WORDS },
  { key: "estilosMusicais", nome: "Estilos Musicais", palavras: ESTILOS_MUSICAIS_WORDS },
  // Reforço do tema Animais: X estava vazia e 18 letras tinham menos de 8
  // palavras. As que já existiam não estão aqui — o @@unique protegeria de
  // qualquer forma, mas a lista foi escrita conferindo o que já havia.
  { key: "animais", nome: "Animais (reforço)", palavras: ANIMAIS_NOVAS },
  // Cor está nas duas Salas Padrão — as mais movimentadas do site.
  { key: "cor", nome: "Cor (reforço)", palavras: COR_NOVAS },
  // Idiomas também está nas duas Salas Padrão.
  { key: "idiomas", nome: "Idiomas (reforço)", palavras: IDIOMAS_NOVAS },
  { key: "frutas", nome: "Frutas (reforço)", palavras: FRUTAS_NOVAS },
];

async function main() {
  console.log("");

  for (const lote of LOTES) {
    const tema = await prisma.theme.findUnique({ where: { key: lote.key } });
    if (!tema) {
      console.log(`⚠️  Tema "${lote.nome}" não existe ainda.`);
      console.log(`   Rode antes:  npm run add-temas -- --confirmar\n`);
      continue;
    }

    const foraDoSorteio = Object.keys(lote.palavras).filter(
      (l) => !LETRAS_DO_SORTEIO.has(l)
    );
    if (foraDoSorteio.length > 0) {
      console.log(`⚠️  ${lote.nome}: letras fora do sorteio serão ignoradas — ${foraDoSorteio.join(", ")}`);
    }

    const porLetra = Object.entries(lote.palavras).filter(([letra]) =>
      LETRAS_DO_SORTEIO.has(letra)
    );
    const total = porLetra.reduce((soma, [, lista]) => soma + lista.length, 0);
    const letras = porLetra.length;
    const menores = porLetra
      .filter(([, lista]) => lista.length < 5)
      .map(([letra, lista]) => `${letra}(${lista.length})`);

    console.log(`${lote.nome}: ${total} palavras em ${letras} letras`);
    if (menores.length > 0) {
      console.log(`  letras magras: ${menores.join(" ")}`);
    }

    if (!confirmar) continue;

    let inseridas = 0;
    let repetidas = 0;
    for (const [letra, lista] of porLetra) {
      for (const palavra of lista) {
        try {
          await prisma.wordEntry.create({
            data: { themeId: tema.id, letter: letra, word: palavra, status: "approved" },
          });
          inseridas++;
        } catch {
          // @@unique([themeId, letter, word]) — já existia, segue adiante.
          repetidas++;
        }
      }
    }
    console.log(`  ✅ ${inseridas} inseridas${repetidas ? `, ${repetidas} já existiam` : ""}\n`);
  }

  if (!confirmar) {
    console.log("\n--- SIMULAÇÃO — nada foi gravado ---");
    console.log("Pra importar de verdade:\n");
    console.log("  npm run importar-temas-novos -- --confirmar\n");
  }
}

main()
  .catch((e) => {
    console.error("Erro:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
