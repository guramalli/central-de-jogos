/**
 * RENOMEIA "ESTILOS MUSICAIS" PARA "GÊNERO MUSICAL"
 *
 * Uso:
 *   npm run renomear-musica                 -> mostra o que faria
 *   npm run renomear-musica -- --confirmar  -> renomeia
 *
 * O PROBLEMA: "Estilos Musicais" e "Instrumentos Musicais" terminam com a
 * mesma palavra. Na pressa da rodada o olho bate em "Musicais" e para — a
 * palavra que DISTINGUE os dois está no começo, que é justamente onde menos
 * se olha. O jogador escreve o gênero na linha do instrumento e perde o
 * ponto sem entender o motivo.
 *
 * "Gênero Musical" quebra essa simetria: muda a última palavra, que é onde a
 * leitura rápida termina.
 *
 * A CHAVE NÃO MUDA (continua "estilosMusicais"): ela aparece em
 * roomConfigs.js e em vários scripts. O jogador só vê o nome.
 */
import { prisma } from "../src/db.js";

const confirmar = process.argv.includes("--confirmar");

const TROCAS = [
  { key: "estilosMusicais", nome: "Gênero Musical" },
];

async function main() {
  console.log("");
  const aplicar = [];

  for (const t of TROCAS) {
    const tema = await prisma.theme.findUnique({ where: { key: t.key } });
    if (!tema) {
      console.log(`  ⚠️  tema "${t.key}" não encontrado`);
      continue;
    }
    if (tema.name === t.nome) {
      console.log(`  já está: ${tema.name}`);
      continue;
    }
    console.log(`  "${tema.name}"  ->  "${t.nome}"`);
    aplicar.push({ id: tema.id, nome: t.nome });
  }

  if (aplicar.length === 0) {
    console.log("\nNada a mudar.\n");
    return;
  }

  if (!confirmar) {
    console.log("\n--- SIMULAÇÃO — nada foi alterado ---");
    console.log("Pra renomear:\n");
    console.log("  npm run renomear-musica -- --confirmar\n");
    return;
  }

  for (const t of aplicar) {
    await prisma.theme.update({ where: { id: t.id }, data: { name: t.nome } });
  }
  console.log(`\n✅ ${aplicar.length} tema(s) renomeado(s).`);
  console.log("As palavras cadastradas não foram tocadas — só o nome mudou.\n");
}

main()
  .catch((e) => {
    console.error("Erro:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
