/**
 * LISTA O GLOSSÁRIO DO STOP
 *
 * Uso:
 *   npm run listar-palavras              -> resumo de todos os temas
 *   npm run listar-palavras -- TEMA      -> todas as palavras de um tema
 *
 * Exemplos:
 *   npm run listar-palavras
 *   npm run listar-palavras -- cidade
 *   npm run listar-palavras -- estilosMusicais
 *
 * PRA QUE SERVE: colar a saída numa conversa antes de escrever palavras
 * novas. Escrever sem ver o que já existe gera repetição — foi a lição do
 * Quiz, onde um lote escrito às cegas teve 41 colisões e o mesmo trabalho
 * feito com a lista em mãos teve zero.
 *
 * O resumo (sem argumento) mostra onde estão os buracos: tema com poucas
 * palavras, e dentro dele as letras mais magras.
 */
import { prisma } from "../src/db.js";

const LETRAS_DO_SORTEIO = "ABCDEFGHIJLMNOPQRSTUVXZ".split("");
const alvo = process.argv[2];

async function main() {
  const temas = await prisma.theme.findMany({ orderBy: { name: "asc" } });

  // ===== Um tema específico: lista tudo =====
  if (alvo) {
    const tema =
      temas.find((t) => t.key === alvo) ||
      temas.find((t) => t.name.toLowerCase() === alvo.toLowerCase());

    if (!tema) {
      console.log(`\nTema "${alvo}" não encontrado. Os que existem:\n`);
      for (const t of temas) console.log(`  ${t.key.padEnd(22)} ${t.name}`);
      console.log("");
      return;
    }

    const palavras = await prisma.wordEntry.findMany({
      where: { themeId: tema.id, status: "approved" },
      orderBy: [{ letter: "asc" }, { word: "asc" }],
      select: { letter: true, word: true },
    });

    console.log(`\n=== ${tema.name} (${tema.key}) — ${palavras.length} palavras ===\n`);

    const porLetra = {};
    for (const p of palavras) (porLetra[p.letter] ||= []).push(p.word);

    for (const letra of LETRAS_DO_SORTEIO) {
      const lista = porLetra[letra] || [];
      console.log(`${letra} (${lista.length}): ${lista.join(", ")}`);
    }

    const vazias = LETRAS_DO_SORTEIO.filter((l) => !(porLetra[l] || []).length);
    const magras = LETRAS_DO_SORTEIO.filter(
      (l) => (porLetra[l] || []).length > 0 && porLetra[l].length < 8
    );
    console.log("");
    if (vazias.length) console.log(`SEM NENHUMA palavra: ${vazias.join(", ")}`);
    if (magras.length) console.log(`Menos de 8 palavras: ${magras.join(", ")}`);
    console.log("");
    return;
  }

  // ===== Resumo de todos os temas =====
  const contagens = await prisma.wordEntry.groupBy({
    by: ["themeId"],
    where: { status: "approved" },
    _count: { _all: true },
  });
  const porTema = Object.fromEntries(contagens.map((c) => [c.themeId, c._count._all]));

  console.log("\n=== GLOSSÁRIO DO STOP ===\n");
  console.log("tema                   chave                  palavras");

  const linhas = temas
    .map((t) => ({ ...t, total: porTema[t.id] || 0 }))
    .sort((a, b) => a.total - b.total);

  for (const t of linhas) {
    const aviso = t.total < 50 ? "  ← abaixo de 50" : "";
    console.log(
      `  ${t.name.slice(0, 20).padEnd(21)} ${t.key.padEnd(22)} ${String(t.total).padStart(5)}${aviso}`
    );
  }

  const total = linhas.reduce((s, t) => s + t.total, 0);
  console.log(`\n  TOTAL: ${total} palavras aprovadas em ${temas.length} temas\n`);
  console.log("Pra ver um tema inteiro:  npm run listar-palavras -- CHAVE\n");
}

main()
  .catch((e) => {
    console.error("Erro:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
