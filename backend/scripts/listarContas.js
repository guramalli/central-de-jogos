// Script de manutenção: lista contas do site, pra você achar o nickname exato.
//
// Uso (dentro da pasta backend):
//   node scripts/listarContas.js              → mostra ADMIN e MODERATOR
//   node scripts/listarContas.js admin        → busca por trecho do nickname
//
// ou, via npm:
//   npm run listar-contas -- admin

import "dotenv/config";
import { prisma } from "../src/db.js";

const busca = process.argv[2];

async function main() {
  const where = busca
    ? { nickname: { contains: busca, mode: "insensitive" } }
    : { role: { in: ["ADMIN", "MODERATOR"] } };

  const contas = await prisma.user.findMany({
    where,
    select: {
      nickname: true,
      email: true,
      role: true,
      isGuest: true,
      ocultoNoRanking: true,
      patenteStopFixa: true,
      patenteQuizFixa: true,
    },
    take: 40,
    orderBy: { nickname: "asc" },
  });

  if (!contas.length) {
    console.log(busca ? `Nenhuma conta contendo "${busca}".` : "Nenhuma conta ADMIN ou MODERATOR.");
    return;
  }

  console.log(busca ? `Contas contendo "${busca}":\n` : "Contas ADMIN e MODERATOR:\n");
  for (const c of contas) {
    const marcas = [];
    if (c.isGuest) marcas.push("visitante");
    if (c.ocultoNoRanking) marcas.push("oculta no ranking");
    if (c.patenteStopFixa) marcas.push(`patente Stop fixa: ${c.patenteStopFixa}`);
    if (c.patenteQuizFixa) marcas.push(`patente Quiz fixa: ${c.patenteQuizFixa}`);
    console.log(`  ${c.nickname.padEnd(20)} ${c.role.padEnd(10)} ${c.email || "-"}`);
    if (marcas.length) console.log(`    ↳ ${marcas.join(" · ")}`);
  }
  console.log(`\n${contas.length} conta(s). Use o nickname exatamente como aparece acima.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
