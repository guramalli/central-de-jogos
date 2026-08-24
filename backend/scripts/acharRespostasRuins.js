// Encontra perguntas com RESPOSTA CENSURADA — impossíveis de acertar.
//
// O PROBLEMA REAL:
// Um banco antigo importado (prisma/data/quiznet.json) trouxe perguntas cuja
// resposta veio com letras substituídas por asterisco:
//
//   "Qual o outro nome conhecido do Batman?"     -> "*****R* ******"
//   "Qual a profissão do Lanterna Verde?"        -> "******* F****A***"
//
// A validação em sala é correspondência exata. Ninguém consegue digitar isso.
// São perguntas MORTAS: ocupam espaço na fila, entram na rodada, todo mundo
// erra, e a rodada é desperdiçada. Numa sala Avançada, onde só o primeiro
// acerto pontua, a rodada inteira se perde.
//
// POR QUE NÃO DÁ PRA CORRIGIR AUTOMATICAMENTE:
// A informação foi perdida na origem. "*****R* ******" pode ser qualquer
// coisa — não há como recuperar as letras.
//
// (Uma versão anterior deste script tentava "limpar" removendo os asteriscos
// das pontas. Era destrutivo: transformava "VINHO D* ****S E ******" em
// "VINHO D* ****S E" — continua errada e ainda perde texto. A correção
// automática de asteriscos foi removida.)
//
// FALSOS POSITIVOS QUE ELE NÃO ACUSA MAIS:
//   - resposta de um caractere: "K" (potássio), "L" (Death Note), "X" (Twitter)
//   - terminada em pontuação: "WHAM!", "BRAVO!", "MAGIC!" — nomes reais
//   - símbolos: "HP<>MP" é a resposta correta de uma pergunta de Final Fantasy
//
// Uso:
//   npm run achar-respostas-ruins                     (todos os temas)
//   npm run achar-respostas-ruins -- futebol          (um tema)
//   npm run achar-respostas-ruins -- --apagar         (apaga as censuradas)
//   npm run achar-respostas-ruins -- --arrumar-espacos
import "dotenv/config";
import { prisma } from "../src/db.js";

// Uma resposta está censurada quando tem asterisco NO MEIO do texto. Markdown
// de verdade (**negrito**) fica só nas bordas; censura fica no miolo.
function censurada(a) {
  const t = (a || "").trim();
  if (!t.includes("*")) return false;
  const semBordas = t.replace(/^\*+/, "").replace(/\*+$/, "");
  return semBordas.includes("*") || /\*{2,}/.test(t);
}

const OUTROS = [
  { nome: "espaço duplo",      teste: (a) => /\s{2,}/.test(a),      corrige: (a) => a.replace(/\s{2,}/g, " ") },
  { nome: "espaço nas pontas", teste: (a) => a !== a.trim(),        corrige: (a) => a.trim() },
  { nome: "vazia",             teste: (a) => a.trim().length === 0, corrige: null },
];

async function main() {
  const args = process.argv.slice(2);
  const apagar = args.includes("--apagar");
  const arrumarEspacos = args.includes("--arrumar-espacos");
  const tema = args.find((a) => !a.startsWith("--")) || null;

  const where = { status: "approved" };
  if (tema) where.themeKey = tema;

  const perguntas = await prisma.quizQuestion.findMany({
    where,
    select: { id: true, themeKey: true, question: true, answer: true, difficulty: true },
  });

  const mortas = perguntas.filter((q) => censurada(q.answer));
  const espacos = perguntas.filter(
    (q) => !censurada(q.answer) && OUTROS.some((o) => o.teste(q.answer || ""))
  );

  console.log(`\nAnalisadas ${perguntas.length} perguntas${tema ? ` do tema "${tema}"` : ""}.\n`);
  console.log(`  ${String(mortas.length).padStart(4)}  RESPOSTA CENSURADA — impossíveis de acertar`);
  console.log(`  ${String(espacos.length).padStart(4)}  espaçamento irregular — corrigível`);

  if (mortas.length) {
    const porTema = {};
    for (const m of mortas) porTema[m.themeKey] = (porTema[m.themeKey] || 0) + 1;
    console.log(`\n--- censuradas por tema ---`);
    for (const [t, n] of Object.entries(porTema).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${String(n).padStart(3)}  ${t}`);
    }
    console.log(`\n--- lista ---`);
    for (const m of mortas) {
      console.log(`  [${m.themeKey}/${m.difficulty}] ${m.question.slice(0, 70)}`);
      console.log(`      R: "${m.answer}"`);
    }
  }

  if (espacos.length) {
    console.log(`\n--- espaçamento irregular ---`);
    for (const e of espacos) {
      let nova = e.answer;
      for (const o of OUTROS) if (o.corrige && o.teste(nova)) nova = o.corrige(nova);
      console.log(`  "${e.answer}"  ->  "${nova}"`);
    }
  }

  if (arrumarEspacos) {
    let n = 0;
    for (const e of espacos) {
      let nova = e.answer;
      for (const o of OUTROS) if (o.corrige && o.teste(nova)) nova = o.corrige(nova);
      if (nova !== e.answer) {
        await prisma.quizQuestion.update({ where: { id: e.id }, data: { answer: nova } });
        n++;
      }
    }
    console.log(`\n${n} resposta(s) com espaçamento corrigido.`);
  }

  if (apagar) {
    if (!mortas.length) { console.log("\nNada a apagar."); return; }
    await prisma.quizQuestion.deleteMany({ where: { id: { in: mortas.map((m) => m.id) } } });
    console.log(`\n${mortas.length} pergunta(s) com resposta censurada APAGADAS.`);
    console.log("Elas eram impossíveis de acertar — cada uma desperdiçava uma rodada.");
    return;
  }

  console.log(`\n\nO que fazer:`);
  console.log(`  As censuradas NÃO têm conserto automático — a informação se perdeu`);
  console.log(`  na origem (o banco antigo quiznet.json já as trouxe assim).`);
  console.log(``);
  console.log(`  Apagar todas:      npm run achar-respostas-ruins -- --apagar`);
  console.log(`  Corrigir espaços:  npm run achar-respostas-ruins -- --arrumar-espacos`);
  console.log(``);
  console.log(`  Pra salvar alguma, edite pelo painel admin com a resposta certa.`);
}

main()
  .catch((e) => { console.error("Erro:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
