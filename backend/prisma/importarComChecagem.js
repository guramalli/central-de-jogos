// Importador de perguntas do Quiz com checagem contra o BANCO.
//
// A REGRA (corrigida):
//   O que NÃO pode repetir é a PERGUNTA.
//   Resposta repetida é NORMAL e permitida.
//
// Várias perguntas diferentes podem legitimamente levar à mesma resposta:
//
//   "Qual clube tem mais títulos da Copa do Brasil?"        -> Cruzeiro
//   "Qual clube brasileiro venceu a Libertadores em 1997?"  -> Cruzeiro
//
// São fatos distintos. Quem sabe um pode não saber o outro. Bloquear a
// segunda seria jogar fora uma pergunta boa.
//
// POR QUE ISSO PRECISOU SER CORRIGIDO:
// A versão anterior bloqueava por resposta repetida. Num lote de futebol,
// barrou 41 de 94 perguntas — quase metade do trabalho, sem motivo. Pior:
// induziu a contornar o bloqueio distorcendo respostas ("Marta Vieira" em
// vez de "Marta", "Neymar ao PSG" em vez de "Neymar"), o que passava no
// teste e estragava o jogo, porque ninguém digitaria aquilo.
//
// O QUE ELE FAZ AGORA:
//  1. BLOQUEIA pergunta com texto idêntico;
//  2. BLOQUEIA pergunta MUITO parecida com uma já existente (>= 70% de
//     palavras em comum) — é aí que mora a repetição de verdade;
//  3. AVISA sobre resposta repetida, mas INSERE mesmo assim;
//  4. Insere o resto.
//
// O aviso do item 3 serve pra você olhar depois no painel de respostas
// repetidas do admin e decidir — decisão sua, não do script.
//
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Conjunto de palavras relevantes de uma pergunta, pra medir semelhança.
// Palavras curtas ("de", "qual", "o") entram em quase tudo e só atrapalham.
function palavras(t) {
  return new Set(
    (t || "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      .split(/\W+/).filter((w) => w.length > 3)
  );
}

// Jaccard: quanto as duas perguntas compartilham do vocabulário somado.
function semelhanca(a, b) {
  const comuns = [...a].filter((w) => b.has(w)).length;
  const total = a.size + b.size - comuns;
  return total === 0 ? 0 : comuns / total;
}

function chave(s) {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

async function main() {
  const [arquivo, constante] = process.argv.slice(2);
  if (!arquivo || !constante) {
    console.log("Uso: node prisma/importarComChecagem.js <arquivo> <CONSTANTE>");
    console.log("Ex.: node prisma/importarComChecagem.js quizFutebolAvancado.js FUTEBOL_AVANCADO");
    return;
  }

  const mod = await import(`./data/${arquivo}`);
  const dados = mod[constante];
  if (!dados) {
    console.log(`A constante "${constante}" não foi encontrada em ${arquivo}.`);
    console.log(`Disponíveis: ${Object.keys(mod).join(", ")}`);
    return;
  }

  let inseridas = 0;
  const puladasTexto = [];
  const puladasParecidas = [];
  const avisosResposta = [];

  for (const [themeKey, perguntas] of Object.entries(dados)) {
    // Todas as respostas que o tema já tem. Uma consulta só, no começo —
    // consultar por pergunta seria lento e desnecessário.
    const existentes = await prisma.quizQuestion.findMany({
      where: { themeKey, status: "approved" },
      select: { question: true, answer: true },
    });
    const respostasNoBanco = new Set(existentes.map((q) => chave(q.answer)));
    // Guarda as perguntas já existentes em forma de conjunto de palavras,
    // pra comparar semelhança sem refazer o trabalho a cada item do lote.
    const perguntasNoBanco = existentes.map((q) => palavras(q.question));

    console.log(`\nTema "${themeKey}": ${existentes.length} perguntas já aprovadas, ` +
                `${respostasNoBanco.size} respostas distintas.`);

    for (const q of perguntas) {
      const jaTemTexto = await prisma.quizQuestion.findFirst({
        where: { question: q.question },
        select: { id: true },
      });
      if (jaTemTexto) { puladasTexto.push(q.question); continue; }

      // A checagem que importa: pergunta MUITO parecida com uma existente.
      const minha = palavras(q.question);
      const parecida = perguntasNoBanco.find((outra) => semelhanca(minha, outra) >= 0.7);
      if (parecida) { puladasParecidas.push(q); continue; }

      // Resposta repetida NÃO bloqueia — só avisa.
      const c = chave(q.answer);
      if (respostasNoBanco.has(c)) avisosResposta.push(q);

      await prisma.quizQuestion.create({
        data: {
          themeKey,
          question: q.question,
          answer: q.answer,
          difficulty: q.difficulty,
          status: "approved",
          validated: true,
        },
      });
      respostasNoBanco.add(c);
      perguntasNoBanco.push(minha);
      inseridas++;
    }
  }

  console.log(`\n=== RESULTADO ===`);
  console.log(`  inseridas                    : ${inseridas}`);
  console.log(`  bloqueadas (texto idêntico)  : ${puladasTexto.length}`);
  console.log(`  bloqueadas (pergunta parecida): ${puladasParecidas.length}`);
  console.log(`  inseridas com resposta repetida: ${avisosResposta.length}`);

  if (puladasParecidas.length) {
    console.log(`\n--- BLOQUEADAS: pergunta muito parecida com uma já existente ---`);
    for (const q of puladasParecidas) {
      console.log(`  ${q.question.slice(0, 78)}`);
    }
  }

  if (avisosResposta.length) {
    console.log(`\n--- inseridas, mas a resposta já existia no tema ---`);
    console.log(`(não é erro — perguntas diferentes podem ter a mesma resposta.`);
    console.log(` Se achar que ficou repetitivo, use o painel de respostas`);
    console.log(` repetidas no admin pra decidir o que fica.)`);
    for (const q of avisosResposta) {
      console.log(`  "${q.answer}" — ${q.question.slice(0, 66)}`);
    }
  }
}

main()
  .catch((e) => { console.error("Erro:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
