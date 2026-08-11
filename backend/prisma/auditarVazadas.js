// Encontra perguntas cuja RESPOSTA aparece dentro do próprio enunciado.
//
// Exemplo do problema:
//   "Qual filme de 1994 tem Forrest Gump como protagonista?" -> Forrest Gump
//
// A pessoa não precisa saber nada: é só copiar a palavra da pergunta. Isso
// estraga a rodada pra todo mundo, porque quem percebe o padrão acerta
// sempre e quem não percebe fica achando que é lento.
//
// Uso:
//   npm run auditar-vazadas              -> só lista (não altera nada)
//   npm run auditar-vazadas -- --go      -> remove as encontradas
//   npm run auditar-vazadas -- --go --leves  -> remove também os casos leves
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Palavras curtas ou genéricas demais pra contar como "entrega". Sem essa
// lista, "Qual ciclo termodinâmico..." -> "Ciclo Otto" seria acusado, mesmo
// sem entregar nada (o que importa ali é "Otto").
const GENERICAS = new Set([
  "nome", "tipo", "jogo", "filme", "serie", "novela", "time", "clube",
  "pais", "cidade", "estado", "grupo", "banda", "clube", "equipe", "sala",
  "ciclo", "lei", "regra", "teoria", "modelo", "sistema", "processo",
  "movimento", "periodo", "guerra", "batalha", "revolucao", "copa",
  "campeonato", "torneio", "premio", "titulo", "livro", "obra", "album",
  "musica", "cancao", "personagem", "protagonista", "heroi", "vilao",
  "deus", "deusa", "santo", "rio", "mar", "monte", "ilha", "brasil",
  "mundo", "anos", "tempo", "show", "efeito", "principio", "escala",
  "funcao", "formula", "unidade", "ponto", "linha", "area", "forca",
]);

function analisar(question, answer) {
  const perg = norm(question);
  const palavras = norm(answer)
    .split(/\s+/)
    .filter((w) => w.length > 3 && !GENERICAS.has(w));

  if (palavras.length === 0) return null;

  const achadas = palavras.filter((w) => perg.includes(w));
  if (achadas.length === 0) return null;

  // Grave: TODAS as palavras significativas da resposta estão no enunciado.
  // Leve: só parte aparece — costuma ser coincidência de vocabulário.
  return {
    grave: achadas.length === palavras.length,
    achadas,
  };
}

async function main() {
  const executar = process.argv.includes("--go");
  const incluirLeves = process.argv.includes("--leves");

  const perguntas = await prisma.quizQuestion.findMany({
    where: { status: "approved" },
    select: { id: true, question: true, answer: true, themeKey: true },
  });

  console.log(`Analisando ${perguntas.length} perguntas aprovadas...\n`);

  const graves = [];
  const leves = [];

  for (const q of perguntas) {
    const r = analisar(q.question, q.answer);
    if (!r) continue;
    (r.grave ? graves : leves).push({ ...q, achadas: r.achadas });
  }

  const porTema = {};
  for (const g of graves) porTema[g.themeKey] = (porTema[g.themeKey] || 0) + 1;

  console.log(`🔴 GRAVES (resposta inteira no enunciado): ${graves.length}`);
  Object.entries(porTema)
    .sort((a, b) => b[1] - a[1])
    .forEach(([t, n]) => console.log(`     ${t.padEnd(16)} ${n}`));

  console.log(`\n🟡 LEVES (parte da resposta aparece):      ${leves.length}`);

  console.log("\nExemplos de GRAVES:");
  graves.slice(0, 10).forEach((g) => {
    console.log(`  ${g.question.slice(0, 66)}`);
    console.log(`     -> ${g.answer}`);
  });

  const alvos = incluirLeves ? [...graves, ...leves] : graves;

  if (!executar) {
    console.log(`\n⚠️  Nada foi alterado (modo de simulação).`);
    console.log(`    Pra remover as ${graves.length} graves:`);
    console.log(`      npm run auditar-vazadas -- --go`);
    console.log(`    Pra remover graves + leves (${alvos.length + leves.length} no total):`);
    console.log(`      npm run auditar-vazadas -- --go --leves`);
    return;
  }

  if (alvos.length === 0) {
    console.log("\nNada a remover. ✨");
    return;
  }

  // Marca como rejeitada em vez de apagar: assim dá pra revisar depois no
  // painel e reaproveitar as que valem a pena reescrever.
  const r = await prisma.quizQuestion.updateMany({
    where: { id: { in: alvos.map((a) => a.id) } },
    data: {
      status: "rejected",
      validationNote: "Resposta aparece no enunciado — precisa ser reescrita.",
    },
  });

  console.log(`\n✅ ${r.count} pergunta(s) tirada(s) do ar.`);
  console.log("   Elas não foram apagadas: ficam no painel pra revisão.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
