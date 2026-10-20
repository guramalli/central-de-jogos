// Torre Infinita — moderação do ranking online (routes/torre.js, tabela torre_jogadores).
// Tira do ranking quem usa um apelido ofensivo que passou pelo filtro de nomes.
//
// Uso (dentro da pasta backend, com o DATABASE_URL de produção no .env):
//   npm run torre-ranking                       (lista os 30 primeiros de cada lista)
//   npm run torre-ranking -- --remover Fulano   (apaga quem usa esse apelido; sem diferença de maiúsculas)
import "dotenv/config";
import { prisma } from "../src/db.js";
import { bancoPrisma, removerApelido } from "../src/routes/torre.js";

const db = bancoPrisma(async () => prisma);
const args = process.argv.slice(2);
try {
  const i = args.indexOf("--remover");
  if (i >= 0) {
    const apelido = args[i + 1];
    if (!apelido) throw new Error("Diga o apelido: npm run torre-ranking -- --remover Fulano");
    const n = await removerApelido(db, apelido);
    console.log(n ? `Removido(s) ${n} jogador(es) com o apelido "${apelido}".` : `Ninguém com o apelido "${apelido}".`);
  } else {
    for (const l of ["obra", "total", "orbita"]) {
      const top = await db.top(l, 30);
      console.log(`\n== ${l} (${await db.total(l)} no total)`);
      top.forEach((x, k) => console.log(`${String(k + 1).padStart(3)}. ${x.apelido} — ${Math.round(x.valor)}`));
    }
  }
} catch (e) {
  console.error(e.message || e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
