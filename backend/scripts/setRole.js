// Script de manutenção: promove (ou rebaixa) o cargo de um usuário.
// Útil para dar o primeiro admin do banco, já que sem nenhum admin existente
// não dá pra fazer isso pela própria interface do site.
//
// Uso (dentro da pasta backend):
//   node scripts/setRole.js seu@email.com ADMIN
//
// ou, via npm:
//   npm run set-role -- seu@email.com ADMIN
//
// Cargos válidos: PLAYER | MODERATOR | ADMIN

import "dotenv/config";
import { prisma } from "../src/db.js";

const email = process.argv[2];
const role = process.argv[3];
const VALID_ROLES = ["PLAYER", "MODERATOR", "ADMIN"];

async function main() {
  if (!email || !VALID_ROLES.includes(role)) {
    console.log("Uso: node scripts/setRole.js <email> <PLAYER|MODERATOR|ADMIN>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log(`Usuário não encontrado para o e-mail: ${email}`);
    process.exit(1);
  }

  await prisma.user.update({ where: { id: user.id }, data: { role } });
  console.log(`✔ Cargo de "${user.nickname}" definido para ${role}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
