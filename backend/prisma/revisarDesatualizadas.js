// Identifica perguntas que "envelhecem" — as que perguntam pelo estado
// ATUAL de algo (presidente, campeão, time do jogador) e por isso viram
// resposta errada com o tempo.
//
// Em vez de apagar, marca como "pending": a pergunta sai do ar e vai pro
// painel de moderação, onde você decide corrigir, aprovar ou descartar.
//
// Uso:
//   npm run revisar-desatualizadas          -> só MOSTRA a classificação
//   npm run revisar-desatualizadas -- --go  -> tira do ar as problemáticas
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Marcas de que a pergunta depende do "agora".
const MARCAS_TEMPO = [
  "atual", "atuais", "atualmente", "hoje em dia", "nos dias de hoje",
  "mais recente", "ultimo campeao", "ultima copa", "em vigor",
  "neste ano", "no ano passado", "recentemente", "nos ultimos anos",
];

// Quando "atual" vem colado a uma palavra de território, quase sempre é
// uso geográfico estável ("no atual território do México") — não envelhece.
const CONTEXTO_GEOGRAFICO = [
  "territorio", "estado", "regiao", "provincia", "prefeitura", "cidade",
  "pais", "municipio", "area", "local", "continente", "capital do imperio",
];

function temMarcaDeTempo(texto) {
  const t = norm(texto);
  return MARCAS_TEMPO.some((m) =>
    new RegExp(`(^|[^a-z0-9])${norm(m)}([^a-z0-9]|$)`).test(t)
  );
}

// Pergunta que já traz o ano entre parênteses ou solto continua
// respondível — "Atualmente (2008), quem era o PM?" tem contexto.
function temAnoExplicito(texto) {
  return /\b(19|20)\d{2}\b/.test(String(texto || ""));
}

function ehUsoGeografico(texto) {
  const t = norm(texto);
  return CONTEXTO_GEOGRAFICO.some((palavra) =>
    // "atual" seguido (em até 2 palavras) de termo geográfico
    new RegExp(`atual\\w*\\s+(\\w+\\s+)?${palavra}`).test(t)
  );
}

async function main() {
  const executar = process.argv.includes("--go");

  const perguntas = await prisma.quizQuestion.findMany({
    where: { status: "approved" },
  });

  const problematicas = [];
  const datadas = [];
  const geograficas = [];

  for (const q of perguntas) {
    if (!temMarcaDeTempo(q.question)) continue;

    if (ehUsoGeografico(q.question)) {
      geograficas.push(q);
    } else if (temAnoExplicito(q.question)) {
      datadas.push(q);
    } else {
      problematicas.push(q);
    }
  }

  console.log("Classificação das perguntas que mencionam o 'agora':\n");
  console.log(`  🔴 Quebradas (sem data, resposta muda)  ${String(problematicas.length).padStart(5)}`);
  console.log(`  🟡 Datadas (têm o ano na pergunta)      ${String(datadas.length).padStart(5)}`);
  console.log(`  🟢 Uso geográfico (não envelhecem)      ${String(geograficas.length).padStart(5)}`);

  if (problematicas.length > 0) {
    console.log("\n🔴 Exemplos das que seriam tiradas do ar:");
    problematicas.slice(0, 12).forEach((q) => {
      console.log(`   [${q.themeKey}] ${q.question.slice(0, 68)}`);
      console.log(`   ${"".padEnd(10)} -> ${q.answer.slice(0, 42)}`);
    });
  }

  if (geograficas.length > 0) {
    console.log("\n🟢 Exemplos das preservadas (uso geográfico):");
    geograficas.slice(0, 4).forEach((q) => {
      console.log(`   ${q.question.slice(0, 72)}`);
    });
  }

  if (!executar) {
    console.log("\n⚠️  Nada foi alterado (modo de simulação).");
    console.log("    As 🔴 iriam pro painel de moderação (saem do ar, mas não são apagadas).");
    console.log("    Pra aplicar: npm run revisar-desatualizadas -- --go");
    return;
  }

  if (problematicas.length === 0) {
    console.log("\nNada a fazer. ✨");
    return;
  }

  const r = await prisma.quizQuestion.updateMany({
    where: { id: { in: problematicas.map((q) => q.id) } },
    data: {
      status: "pending",
      validationNote: "Pergunta depende do momento atual — precisa de revisão ou data explícita.",
    },
  });

  console.log(`\n✅ ${r.count} pergunta(s) tirada(s) do ar e enviada(s) pro painel de moderação.`);
  console.log("   Elas não foram apagadas: você pode corrigir e reaprovar quando quiser.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
