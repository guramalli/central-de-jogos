// Script de manutenção: troca o NOME VISÍVEL de um tema do Stop.
//
// A chave interna (key) NÃO muda — é ela que liga o tema às palavras já
// aprovadas no glossário. Trocar só o nome é seguro: nenhuma palavra fica
// órfã, nenhum histórico se perde.
//
// Uso (dentro da pasta backend):
//   node scripts/renomearTema.js bandas_musicais "Cantor ou Banda"
//
// ou, via npm:
//   npm run renomear-tema -- bandas_musicais "Cantor ou Banda"

import "dotenv/config";
import { prisma } from "../src/db.js";

const key = process.argv[2];
const novoNome = process.argv[3];

async function main() {
  if (!key || !novoNome) {
    console.log('Uso: node scripts/renomearTema.js <key> "<Novo Nome>"');
    process.exit(1);
  }

  const tema = await prisma.theme.findUnique({
    where: { key },
    include: { _count: { select: { words: true } } },
  });
  if (!tema) {
    console.log(`Tema não encontrado para a chave: ${key}`);
    process.exit(1);
  }

  await prisma.theme.update({ where: { key }, data: { name: novoNome } });
  console.log(`✔ "${tema.name}" agora se chama "${novoNome}".`);
  console.log(`  ${tema._count.words} palavra(s) do glossário seguem intactas neste tema.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
