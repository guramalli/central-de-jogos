// Backup completo do banco em arquivos JSON.
//
// Por que via Prisma e não pg_dump: o pg_dump exige as ferramentas do
// Postgres instaladas na máquina e na MESMA versão do servidor (18, no
// caso). Este script roda com o que o projeto já tem, em qualquer
// computador, e gera arquivos legíveis que dá pra inspecionar e restaurar
// seletivamente.
//
// Uso:
//   npm run backup                 -> salva em backups/AAAA-MM-DD_HH-MM/
//   npm run backup -- --pasta=D:/  -> salva em outro lugar (ex.: pendrive)
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// Ordem importa na hora de restaurar: tabelas referenciadas primeiro.
// Quem depende de outra vem depois (um ClanInvite precisa do Clan e do
// User já existirem).
const TABELAS = [
  "user",
  "theme",
  "wordEntry",
  "quizQuestion",
  "clan",
  "clanInvite",
  "friendship",
  "privateMessage",
  "chatMessage",
  "monthlyScore",
  "lifetimeScore",
  "blockScore",
  "quizRoomStat",
  "quizStreakRecord",
  "quizQuestionReport",
  "missaoProgresso",
  "feedback",
  "platformStat",
  "suspiciousActivity",
];

// Tabelas grandes são salvas em pedaços, pra não estourar a memória nem
// gerar um JSON gigante impossível de abrir.
const TAMANHO_LOTE = 5000;

function formatarData() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}`;
}

function tamanhoLegivel(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function main() {
  const argPasta = process.argv.find((a) => a.startsWith("--pasta="));
  const base = argPasta ? argPasta.split("=")[1] : path.resolve("backups");
  const destino = path.join(base, formatarData());

  fs.mkdirSync(destino, { recursive: true });

  console.log(`Salvando backup em: ${destino}\n`);

  const resumo = {};
  let totalRegistros = 0;
  let totalBytes = 0;
  const falhas = [];

  for (const tabela of TABELAS) {
    if (!prisma[tabela]) {
      // Tabela pode não existir ainda (migration não rodada). Registra e
      // segue: um backup parcial é melhor que nenhum.
      falhas.push(`${tabela} (não existe no schema)`);
      continue;
    }

    try {
      const total = await prisma[tabela].count();
      if (total === 0) {
        resumo[tabela] = 0;
        continue;
      }

      const registros = [];
      for (let pulo = 0; pulo < total; pulo += TAMANHO_LOTE) {
        const lote = await prisma[tabela].findMany({ skip: pulo, take: TAMANHO_LOTE });
        registros.push(...lote);
        if (total > TAMANHO_LOTE) {
          process.stdout.write(`\r  ${tabela}: ${registros.length}/${total}`);
        }
      }

      const arquivo = path.join(destino, `${tabela}.json`);
      const conteudo = JSON.stringify(registros, null, 1);
      fs.writeFileSync(arquivo, conteudo);

      const bytes = Buffer.byteLength(conteudo);
      totalBytes += bytes;
      totalRegistros += registros.length;
      resumo[tabela] = registros.length;

      const linha = `  ${tabela.padEnd(22)} ${String(registros.length).padStart(7)} registros  ${tamanhoLegivel(bytes)}`;
      console.log(total > TAMANHO_LOTE ? `\r${linha}` : linha);
    } catch (err) {
      falhas.push(`${tabela}: ${err.message.slice(0, 60)}`);
      console.log(`  ${tabela.padEnd(22)} ⚠️  falhou`);
    }
  }

  // Um índice com o que foi salvo, pra saber o que tem no backup sem
  // precisar abrir todos os arquivos.
  const indice = {
    geradoEm: new Date().toISOString(),
    totalRegistros,
    tabelas: resumo,
    falhas,
    ordemParaRestaurar: TABELAS,
  };
  fs.writeFileSync(path.join(destino, "_indice.json"), JSON.stringify(indice, null, 2));

  console.log("\n" + "=".repeat(52));
  console.log(`  Total: ${totalRegistros.toLocaleString("pt-BR")} registros · ${tamanhoLegivel(totalBytes)}`);
  console.log(`  Pasta: ${destino}`);
  if (falhas.length) {
    console.log(`\n  ⚠️  ${falhas.length} tabela(s) com problema:`);
    falhas.forEach((f) => console.log(`     ${f}`));
  }
  console.log("=".repeat(52));
  console.log("\n💡 Guarde essa pasta FORA do computador (Drive, pendrive, e-mail).");
  console.log("   Backup que mora no mesmo lugar que o original não é backup.");
}

main()
  .catch((e) => {
    console.error("\nFalha no backup:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
