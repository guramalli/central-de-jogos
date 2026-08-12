// Script de manutenção: esconde (ou volta a mostrar) uma conta nos rankings.
//
// A conta continua jogando normalmente e pontuando no banco — ela só deixa
// de aparecer nas listas de ranking (mensal, vitalício, histórico) e nos
// anúncios de posição dentro das salas. Serve pras contas de teste do time,
// que jogam o tempo todo validando features e distorceriam a disputa.
//
// Uso (dentro da pasta backend):
//   node scripts/ocultarRanking.js Guramalli true    → esconde
//   node scripts/ocultarRanking.js Guramalli false   → volta a mostrar
//
// ou, via npm:
//   npm run ocultar-ranking -- Guramalli true
//
// Aceita o nickname OU o e-mail da conta.

import "dotenv/config";
import { prisma } from "../src/db.js";

const identificador = process.argv[2];
const valorBruto = (process.argv[3] || "true").toLowerCase();

async function main() {
  if (!identificador) {
    console.log("Uso: node scripts/ocultarRanking.js <nickname ou email> <true|false>");
    process.exit(1);
  }
  if (!["true", "false"].includes(valorBruto)) {
    console.log("O segundo argumento precisa ser true (esconder) ou false (mostrar).");
    process.exit(1);
  }
  const ocultar = valorBruto === "true";

  const user = await prisma.user.findFirst({
    where: { OR: [{ nickname: identificador }, { email: identificador }] },
  });
  if (!user) {
    console.log(`Conta não encontrada: ${identificador}`);
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { ocultoNoRanking: ocultar },
  });

  console.log(
    ocultar
      ? `✔ "${user.nickname}" agora está ESCONDIDA dos rankings (continua jogando e pontuando).`
      : `✔ "${user.nickname}" voltou a APARECER nos rankings.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
