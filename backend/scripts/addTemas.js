/**
 * ADICIONA TEMAS NOVOS AO STOP
 *
 * Uso:
 *   npm run add-temas                 -> mostra o que faria
 *   npm run add-temas -- --confirmar  -> cria de verdade
 *
 * Tema criado aqui nasce SEM glossário, e isso é proposital: ele fica
 * disponível apenas nas salas privadas com validação por VOTO, onde quem
 * julga é a mesa. Nas salas normais (e nas privadas com glossário) ele não
 * aparece, porque sem palavras cadastradas tudo seria marcado como errado.
 *
 * Com 50+ palavras aprovadas, o tema também passa a valer no modo "banco de
 * dados" das salas privadas — isso é automático, por contagem.
 *
 * Já a entrada nas SALAS OFICIAIS que pontuam é manual e deliberada: some a
 * chave do tema de TEMAS_SO_EM_SALA_PRIVADA, em roomConfigs.js, quando
 * decidir liberar.
 */
import { prisma } from "../src/db.js";

const confirmar = process.argv.includes("--confirmar");

const NOVOS = [
  { key: "animeHq", name: "Anime e HQ" },
  { key: "estilosMusicais", name: "Estilos Musicais" },
];

async function main() {
  console.log("");
  const criar = [];

  for (const t of NOVOS) {
    const existente = await prisma.theme.findUnique({ where: { key: t.key } });
    if (existente) {
      console.log(`  já existe: ${t.name} (${t.key})`);
      continue;
    }
    criar.push(t);
    console.log(`  criar: ${t.name} (${t.key})`);
  }

  if (criar.length === 0) {
    console.log("\nNada a fazer.\n");
    return;
  }

  if (!confirmar) {
    console.log("\n--- SIMULAÇÃO — nada foi criado ---");
    console.log("Pra criar de verdade:\n");
    console.log("  npm run add-temas -- --confirmar\n");
    return;
  }

  for (const t of criar) {
    await prisma.theme.create({ data: { key: t.key, name: t.name } });
    console.log(`\n✅ ${t.name} criado.`);
  }

  console.log("\nOs temas já aparecem na criação de sala privada com validação por VOTO.");
  console.log("Com 50+ palavras no glossário, também ficam disponíveis no modo");
  console.log("\"banco de dados\" das salas privadas.");
  console.log("\nNAS SALAS OFICIAIS eles NÃO entram automaticamente: a liberação é");
  console.log("manual, apagando a chave de TEMAS_SO_EM_SALA_PRIVADA em");
  console.log("backend/src/game/roomConfigs.js.\n");
}

main()
  .catch((e) => {
    console.error("Erro:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
