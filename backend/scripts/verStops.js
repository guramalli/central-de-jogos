// Diagnóstico dos contadores de STOP de um jogador (títulos de perfil).
// Mostra, por grupo de sala, quantos STOPs e quantos "relâmpagos" estão
// gravados — o número CRU do banco, sem depender da interface.
//
// USO (a partir de backend/):
//   npm run ver-stops -- NICK
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const nick = process.argv[2];
if (!nick) {
  console.log("Uso: npm run ver-stops -- NICK");
  process.exit(1);
}

async function main() {
  const user = await prisma.user.findFirst({
    where: { nickname: { equals: nick, mode: "insensitive" } },
    select: { id: true, nickname: true },
  });
  if (!user) {
    console.log(`Nenhum jogador com o nick "${nick}".`);
    return;
  }
  console.log(`Jogador: ${user.nickname} (${user.id})\n`);

  let stats = [];
  try {
    stats = await prisma.stopStat.findMany({
      where: { userId: user.id },
      select: { grupo: true, stops: true, rapidos: true },
    });
  } catch (err) {
    console.log("⚠ A tabela StopStat não existe ou deu erro:", err.message);
    console.log("  → Provavelmente falta rodar: npx prisma db push");
    return;
  }

  if (stats.length === 0) {
    console.log("Nenhum registro de STOP para este jogador ainda.");
    console.log("(Se você já deu STOPs na avançada após o deploy, isto indica");
    console.log(" que o incremento não está acontecendo — é bug a investigar.)");
    return;
  }

  for (const s of stats) {
    console.log(`  grupo "${s.grupo}": ${s.stops} stops, ${s.rapidos} relâmpagos`);
  }
  const av = stats.find((s) => s.grupo === "avancada");
  console.log("");
  if (av) {
    console.log(`Relâmpagos na avançada: ${av.rapidos}`);
    console.log(`Faltam ${Math.max(0, 500 - av.rapidos)} para o título "Relâmpago da Avançada".`);
    if (av.rapidos === 0 && av.stops > 0) {
      console.log("\n⚠ Você tem STOPs na avançada mas 0 relâmpagos — ou os STOPs");
      console.log("  foram acima da janela de tempo, ou o deploy com a janela nova");
      console.log("  ainda não estava no ar quando você jogou.");
    }
  } else {
    console.log("Sem registros na sala avançada ainda.");
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
