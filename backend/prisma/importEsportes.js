// Importa (ou atualiza) o tema "Esportes" do Stop.
//
// POR QUE UM SCRIPT SÓ PRA ISSO, EM VEZ DE RODAR O SEED INTEIRO:
// O seed completo passa por TODOS os temas e todas as ~1.300 palavras. Ele
// é seguro (usa upsert), mas em produção é lento e mexe em muito mais coisa
// do que o necessário — e quanto menor a superfície de um comando rodado no
// banco de produção, melhor.
//
// É seguro rodar mais de uma vez: tudo é upsert. Rodar de novo depois de
// acrescentar palavras novas ao arquivo só adiciona as que faltam, sem
// duplicar nem apagar nada do que já existe.
//
// Uso:  npm run import-esportes
import { PrismaClient } from "@prisma/client";
import { ESPORTES_WORDS } from "./data/stopWordsEsportes.js";

const prisma = new PrismaClient();

const CHAVE = "esportes";
const NOME = "Esportes";

async function main() {
  const tema = await prisma.theme.upsert({
    where: { key: CHAVE },
    update: { name: NOME },
    create: { key: CHAVE, name: NOME },
  });
  console.log(`Tema "${NOME}" pronto (id ${tema.id}).`);

  let novas = 0;
  let jaExistiam = 0;

  for (const [letra, palavras] of Object.entries(ESPORTES_WORDS)) {
    for (const palavra of palavras) {
      const antes = await prisma.wordEntry.findFirst({
        where: { themeId: tema.id, letter: letra, word: palavra },
        select: { id: true },
      });

      await prisma.wordEntry.upsert({
        where: {
          themeId_letter_word: { themeId: tema.id, letter: letra, word: palavra },
        },
        update: { status: "approved" },
        create: { themeId: tema.id, letter: letra, word: palavra, status: "approved" },
      });

      if (antes) jaExistiam++;
      else novas++;
    }
  }

  const total = await prisma.wordEntry.count({ where: { themeId: tema.id } });
  console.log(`Palavras novas: ${novas} | já existiam: ${jaExistiam}`);
  console.log(`Total no tema "${NOME}": ${total}`);
  console.log("");
  console.log("As salas Intermediária e Avançada sorteiam de todos os temas,");
  console.log("então já vão incluir Carros. As salas Padrão usam lista fixa —");
  console.log("elas foram atualizadas em src/game/roomConfigs.js.");
}

main()
  .catch((e) => {
    console.error("Falha ao importar o tema Carros:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
