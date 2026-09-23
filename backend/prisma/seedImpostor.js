import "dotenv/config";
import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";

// Palavras do Impostor — importa prisma/data/impostorPalavras.json
// ([{ tema, palavras: [...] }], 20 temas × 15 palavras).
//
// SÓ ACRESCENTA: nada é apagado nem alterado. Uma palavra que já existe no
// tema é pulada — e a comparação ignora maiúsculas, acentos e espaços nas
// pontas, porque o índice único do banco (tema + palavra) diferencia
// "Praia" de "praia". Pode rodar quantas vezes quiser.
//
//   npm run seed:impostor
const prisma = new PrismaClient();
const ARQUIVO = new URL("./data/impostorPalavras.json", import.meta.url);

const chave = (tema, palavra) =>
  [tema, palavra]
    .map((s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim())
    .join("|");

async function main() {
  const temas = JSON.parse(readFileSync(ARQUIVO, "utf8"));

  const existentes = await prisma.impostorPalavra.findMany({ select: { tema: true, palavra: true } });
  const vistas = new Set(existentes.map((l) => chave(l.tema, l.palavra)));

  const novas = [];
  let puladas = 0;
  for (const { tema, palavras } of temas) {
    for (const bruta of palavras) {
      const palavra = String(bruta).trim();
      const k = chave(tema, palavra);
      if (!palavra || vistas.has(k)) { puladas++; continue; }
      vistas.add(k);
      novas.push({ tema: tema.trim(), palavra });
    }
  }

  const r = await prisma.impostorPalavra.createMany({ data: novas, skipDuplicates: true });

  const porTema = await prisma.impostorPalavra.groupBy({ by: ["tema"], where: { ativo: true }, _count: true, orderBy: { tema: "asc" } });
  const total = porTema.reduce((n, t) => n + t._count, 0);
  console.log(`Impostor: ${r.count} palavras novas, ${puladas} já existiam (puladas).`);
  console.log(`Total ativo: ${porTema.length} temas, ${total} palavras.`);
  for (const t of porTema) console.log(`  ${t.tema}: ${t._count}`);
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
