// Script de teste: ajusta manualmente a pontuação vitalícia GERAL (em todas as
// salas) de um usuário no jogo Stop — útil para testar salas com exigência de
// pontuação mínima (ex.: a Sala Avançada) sem precisar jogar de verdade.
//
// Uso (dentro da pasta backend):
//   node scripts/setTestScore.js seu@email.com 6001
//
// ou, via npm:
//   npm run set-score -- seu@email.com 6001

import "dotenv/config";
import { prisma } from "../src/db.js";

const email = process.argv[2];
const points = Number(process.argv[3]);

async function main() {
  if (!email || Number.isNaN(points)) {
    console.log("Uso: node scripts/setTestScore.js <email> <pontos>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log(`Usuário não encontrado para o e-mail: ${email}`);
    process.exit(1);
  }

  await prisma.lifetimeScore.upsert({
    where: { userId_gameKey: { userId: user.id, gameKey: "stop" } },
    update: { points },
    create: { userId: user.id, gameKey: "stop", points },
  });

  console.log(`✔ Pontuação vitalícia geral de "${user.nickname}" definida para ${points} pontos.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
