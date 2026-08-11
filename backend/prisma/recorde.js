// Ajusta ou zera o recorde de jogadores simultâneos.
//
// Útil quando o recorde foi inflado por teste de carga: o número fica
// exposto na página inicial, e um pico artificial que nunca mais será
// alcançado desanima em vez de motivar.
//
// Uso:
//   npm run recorde                 -> mostra o recorde atual
//   npm run recorde -- --zerar      -> zera (volta a contar do próximo pico)
//   npm run recorde -- --valor=12   -> define um número específico
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PEAK_KEY = "max_concurrent_players";

async function main() {
  const atual = await prisma.platformStat.findUnique({ where: { key: PEAK_KEY } });
  const valorAtual = atual?.value ?? 0;

  console.log(`Recorde atual: ${valorAtual} jogadores simultâneos\n`);

  const zerar = process.argv.includes("--zerar");
  const argValor = process.argv.find((a) => a.startsWith("--valor="));

  if (!zerar && !argValor) {
    console.log("Nada foi alterado. Opções:");
    console.log("  npm run recorde -- --zerar       zera o recorde");
    console.log("  npm run recorde -- --valor=12    define um valor");
    return;
  }

  let novo = 0;
  if (argValor) {
    novo = Number(argValor.split("=")[1]);
    if (!Number.isInteger(novo) || novo < 0 || novo > 100000) {
      console.log("Valor inválido. Use um número inteiro de 0 a 100000.");
      return;
    }
  }

  await prisma.platformStat.upsert({
    where: { key: PEAK_KEY },
    update: { value: novo },
    create: { key: PEAK_KEY, value: novo },
  });

  console.log(`✅ Recorde ajustado: ${valorAtual} → ${novo}`);
  console.log("\nO site pega a mudança em até 10 minutos (o valor fica em");
  console.log("cache no servidor). Se quiser na hora, reinicie o backend.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
