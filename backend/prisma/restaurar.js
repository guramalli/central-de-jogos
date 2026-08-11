// Restaura um backup gerado pelo `npm run backup`.
//
// ⚠️ ESTE SCRIPT ESCREVE NO BANCO. Por padrão ele só SIMULA: mostra o que
// faria sem alterar nada. Só com --go ele grava de verdade.
//
// Uso:
//   npm run restaurar -- --de=backups/2026-08-10_14-30
//   npm run restaurar -- --de=backups/2026-08-10_14-30 --go
//   npm run restaurar -- --de=... --go --tabelas=quizQuestion,theme
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import readline from "readline";

const prisma = new PrismaClient();

function perguntar(texto) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(texto, (r) => { rl.close(); resolve(r); }));
}

async function main() {
  const argDe = process.argv.find((a) => a.startsWith("--de="));
  const argTabelas = process.argv.find((a) => a.startsWith("--tabelas="));
  const executar = process.argv.includes("--go");

  if (!argDe) {
    console.log("Informe a pasta do backup:");
    console.log("  npm run restaurar -- --de=backups/2026-08-10_14-30");
    return;
  }

  const pasta = path.resolve(argDe.split("=")[1]);
  const indicePath = path.join(pasta, "_indice.json");

  if (!fs.existsSync(indicePath)) {
    console.log(`Não encontrei _indice.json em ${pasta}`);
    console.log("Confira o caminho — deve apontar pra pasta gerada pelo backup.");
    return;
  }

  const indice = JSON.parse(fs.readFileSync(indicePath, "utf8"));
  const filtro = argTabelas ? argTabelas.split("=")[1].split(",") : null;
  const tabelas = indice.ordemParaRestaurar.filter(
    (t) => (!filtro || filtro.includes(t)) && (indice.tabelas[t] || 0) > 0
  );

  console.log(`Backup de ${new Date(indice.geradoEm).toLocaleString("pt-BR")}`);
  console.log(`${indice.totalRegistros.toLocaleString("pt-BR")} registros no total\n`);

  console.log("O que seria restaurado:");
  for (const t of tabelas) {
    const atual = prisma[t] ? await prisma[t].count() : 0;
    console.log(`  ${t.padEnd(22)} backup: ${String(indice.tabelas[t]).padStart(7)}  |  banco agora: ${String(atual).padStart(7)}`);
  }

  if (!executar) {
    console.log("\n⚠️  Nada foi alterado (modo de simulação).");
    console.log("    Pra restaurar de verdade, acrescente --go");
    return;
  }

  // Restauração é destrutiva o bastante pra merecer confirmação digitada,
  // não só uma flag — flag a gente cola sem ler.
  console.log("\n" + "!".repeat(60));
  console.log("  ATENÇÃO: isso vai GRAVAR no banco atual.");
  console.log("  Registros com o mesmo id serão SOBRESCRITOS.");
  console.log("!".repeat(60));
  const resposta = await perguntar('\nDigite "RESTAURAR" para confirmar: ');
  if (resposta.trim() !== "RESTAURAR") {
    console.log("Cancelado.");
    return;
  }

  console.log("");
  for (const tabela of tabelas) {
    const arquivo = path.join(pasta, `${tabela}.json`);
    if (!fs.existsSync(arquivo) || !prisma[tabela]) continue;

    const registros = JSON.parse(fs.readFileSync(arquivo, "utf8"));
    let ok = 0;
    let erros = 0;

    for (const r of registros) {
      try {
        // upsert em vez de create: rodar o mesmo backup duas vezes não
        // duplica nada, e dá pra restaurar por cima de um banco parcial.
        await prisma[tabela].upsert({
          where: { id: r.id },
          update: r,
          create: r,
        });
        ok++;
      } catch {
        erros++;
      }
      if ((ok + erros) % 500 === 0) {
        process.stdout.write(`\r  ${tabela}: ${ok + erros}/${registros.length}`);
      }
    }

    const aviso = erros > 0 ? `  (${erros} com erro)` : "";
    console.log(`\r  ${tabela.padEnd(22)} ${String(ok).padStart(7)} restaurados${aviso}`);
  }

  console.log("\n✅ Restauração concluída.");
  console.log("   Confira o site antes de considerar resolvido.");
}

main()
  .catch((e) => {
    console.error("\nFalha na restauração:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
