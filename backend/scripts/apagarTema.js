/**
 * APAGA UM TEMA DO STOP E TODAS AS PALAVRAS DELE
 *
 * Uso:
 *   npm run apagar-tema -- CHAVE
 *   npm run apagar-tema -- CHAVE --confirmar
 *
 * Exemplo:
 *   npm run apagar-tema -- repteis
 *   npm run apagar-tema -- repteis --confirmar
 *
 * É IRREVERSÍVEL: as palavras somem junto. Por isso a simulação mostra tudo
 * o que será perdido antes de qualquer coisa acontecer.
 *
 * ANTES DE APAGAR, confira se a chave não está sendo usada em:
 *   - backend/src/game/roomConfigs.js (fixedThemeKeys, TEMAS_SO_EM_SALA_PRIVADA)
 *   - scripts de migração (moverBichos, segmentarAnimais)
 * O script avisa se encontrar a chave em algum desses lugares.
 */
import { prisma } from "../src/db.js";
import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const confirmar = args.includes("--confirmar");
const chave = args.find((a) => !a.startsWith("--"));

const ARQUIVOS_A_CHECAR = [
  "src/game/roomConfigs.js",
  "scripts/moverBichos.js",
  "scripts/segmentarAnimais.js",
  "scripts/addTemas.js",
];

async function main() {
  if (!chave) {
    console.log("\nUso: npm run apagar-tema -- CHAVE [--confirmar]\n");
    const temas = await prisma.theme.findMany({ orderBy: { name: "asc" } });
    console.log("Temas existentes:\n");
    for (const t of temas) console.log(`  ${t.key.padEnd(24)} ${t.name}`);
    console.log("");
    return;
  }

  const tema = await prisma.theme.findUnique({ where: { key: chave } });
  if (!tema) {
    console.log(`\nTema "${chave}" não encontrado.\n`);
    return;
  }

  const palavras = await prisma.wordEntry.findMany({
    where: { themeId: tema.id },
    select: { letter: true, word: true },
    orderBy: [{ letter: "asc" }, { word: "asc" }],
  });

  console.log(`\n=== ${tema.name} (${tema.key}) ===\n`);
  console.log(`${palavras.length} palavras seriam APAGADAS:\n`);
  if (palavras.length) {
    console.log(" ", palavras.map((p) => p.word).join(", "), "\n");
  }

  // Aviso de referência no código: apagar o tema sem tirar a chave dos
  // arquivos deixaria scripts apontando pra algo que não existe mais.
  const raiz = path.resolve(process.cwd());
  const achados = [];
  for (const rel of ARQUIVOS_A_CHECAR) {
    try {
      const conteudo = fs.readFileSync(path.join(raiz, rel), "utf8");
      if (conteudo.includes(`"${chave}"`)) achados.push(rel);
    } catch {
      // arquivo pode não existir nessa versão — não é problema
    }
  }
  if (achados.length) {
    console.log("⚠️  A chave ainda aparece no código:");
    for (const a of achados) console.log(`     ${a}`);
    console.log("   Tire as referências antes de apagar, senão scripts vão");
    console.log("   procurar um tema que não existe mais.\n");
  }

  if (!confirmar) {
    console.log("--- SIMULAÇÃO — nada foi apagado ---");
    console.log("Pra apagar de verdade:\n");
    console.log(`  npm run apagar-tema -- ${chave} --confirmar\n`);
    return;
  }

  await prisma.wordEntry.deleteMany({ where: { themeId: tema.id } });
  await prisma.theme.delete({ where: { id: tema.id } });
  console.log(`✅ Tema "${tema.name}" e ${palavras.length} palavras apagados.\n`);
}

main()
  .catch((e) => {
    console.error("Erro:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
