// Remove do painel de moderação as sugestões de palavra feitas nos temas
// da Sala da Zoeira.
//
// Esses temas são subjetivos ("motivo de término", "coisa da sogra") e não
// têm glossário — as sugestões só apareceram por causa de um bug já
// corrigido, e não fazem sentido nenhum aprovar ou rejeitar.
//
// Uso:
//   npm run limpar-sugestoes-zoeira          -> simula (não apaga nada)
//   npm run limpar-sugestoes-zoeira -- --go  -> apaga de verdade
import { PrismaClient } from "@prisma/client";
import { ROOM_CONFIGS } from "../src/game/roomConfigs.js";

const prisma = new PrismaClient();

const TEMAS_ZOEIRA = Object.values(ROOM_CONFIGS)
  .filter((c) => c.semPontuacao && Array.isArray(c.fixedThemeKeys))
  .flatMap((c) => c.fixedThemeKeys);

async function main() {
  const executar = process.argv.includes("--go");

  if (TEMAS_ZOEIRA.length === 0) {
    console.log("Nenhum tema de sala sem pontuação configurado. Nada a fazer.");
    return;
  }

  const temas = await prisma.theme.findMany({
    where: { key: { in: TEMAS_ZOEIRA } },
    select: { id: true, key: true, name: true },
  });

  if (temas.length === 0) {
    console.log("Os temas da Zoeira não existem no banco. Nada a limpar. ✨");
    return;
  }

  const temaIds = temas.map((t) => t.id);
  const nomePorId = new Map(temas.map((t) => [t.id, t.name || t.key]));

  // Só as pendentes — palavra já aprovada ou rejeitada fica como histórico.
  const sugestoes = await prisma.wordEntry.findMany({
    where: { themeId: { in: temaIds }, status: "pending" },
    select: { id: true, word: true, letter: true, themeId: true },
  });

  if (sugestoes.length === 0) {
    console.log("Nenhuma sugestão pendente nos temas da Zoeira. ✨");
    return;
  }

  // Agrupa por tema, só pra dar uma visão do que está saindo de onde.
  const porTema = {};
  for (const s of sugestoes) {
    const nome = nomePorId.get(s.themeId) || "?";
    porTema[nome] = (porTema[nome] || 0) + 1;
  }

  console.log(`Encontradas ${sugestoes.length} sugestão(ões) pendente(s) nos temas da Zoeira:\n`);
  for (const [nome, qtd] of Object.entries(porTema).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${nome.padEnd(30)} ${qtd}`);
  }

  console.log("\nExemplos:");
  sugestoes.slice(0, 8).forEach((s) => {
    console.log(`  [${nomePorId.get(s.themeId)}] ${s.letter} — ${s.word}`);
  });

  if (!executar) {
    console.log("\n⚠️  Nada foi apagado (modo de simulação).");
    console.log("    Pra apagar de verdade, rode: npm run limpar-sugestoes-zoeira -- --go");
    return;
  }

  const removidas = await prisma.wordEntry.deleteMany({
    where: { id: { in: sugestoes.map((s) => s.id) } },
  });

  console.log(`\n✅ ${removidas.count} sugestão(ões) removida(s) do painel.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
