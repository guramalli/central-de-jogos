/**
 * SEGMENTA O TEMA "ANIMAIS" EM "MAMÍFEROS"
 *
 * Uso:
 *   npm run segmentar-animais                 -> só mostra o plano
 *   npm run segmentar-animais -- --confirmar  -> executa
 *
 * O PROBLEMA: o tema "Animais" aceita qualquer bicho — tem abelha, arara,
 * tubarão, jacaré e sapo misturados com os mamíferos. Renomear pra
 * "Mamíferos" sem limpar faria "abelha" valer ponto numa rodada de
 * mamíferos, que é o oposto do objetivo da segmentação.
 *
 * O QUE ESTE SCRIPT FAZ:
 *   1. Renomeia o tema "Animais" para "Mamíferos"
 *   2. Move os PEIXES pro tema "Peixes"
 *   3. Move as COBRAS pro tema "Cobras"
 *   4. REPORTA o resto (aves, insetos, répteis, anfíbios) sem tocar neles
 *
 * POR QUE NÃO APAGA O RESTO: não existe tema de aves nem de insetos, então
 * apagar perderia trabalho que pode ser reaproveitado se esses temas forem
 * criados depois. Ficam onde estão e aparecem na lista pra você decidir.
 *
 * COMO O ERRO CAI PRO LADO SEGURO: a classificação abaixo foi escrita à mão
 * e pode ter esquecimentos. Palavra que não estiver em nenhuma das listas é
 * tratada como MAMÍFERO e permanece no tema.
 *
 * Isso quer dizer que um esquecimento meu nunca apaga nem move nada por
 * engano — no pior caso, um bicho que não é mamífero continua valendo ponto
 * até alguém notar. Por isso o script IMPRIME a lista inteira de mamíferos
 * antes de confirmar: é ali que um "arara" esquecido aparece.
 *
 * CONFIRA ESSA LISTA antes de rodar com --confirmar.
 */
import { prisma } from "../src/db.js";

const confirmar = process.argv.includes("--confirmar");

const norm = (p) =>
  String(p || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// ===== PEIXES =====
const PEIXES = [
  "peixe", "tubarao", "enguia", "jamanta", "lula", "polvo", "bagre",
  "baiacu", "dourado", "lambari", "mandi", "robalo", "sardinha", "salmao",
  "tainha", "tilapia", "traira", "tucunare", "pirarucu", "piranha",
  "poraque", "acara", "xareu", "xexeu", "xerelete", "ubarana", "arraia",
  "cavalo-marinho", "hipocampo", "esturjao",
  // Pegos na conferência da lista de mamíferos — eu tinha deixado passar:
  "dourada", "remora", "namorado", "xereu", "lula-gigante",
];

// ===== COBRAS =====
const COBRAS = [
  "cobra", "naja", "serpente", "jiboia", "jararaca", "anaconda",
  "cobra-coral", "urutu", "sucuri", "cascavel", "vibora",
  "serpente-cascavel",
];

// ===== NÃO SÃO MAMÍFEROS, mas não têm tema pra ir =====
// Aves, insetos, répteis, anfíbios, aracnídeos, moluscos.
const OUTROS = [
  "abelha", "aranha", "arara", "aguia", "borboleta", "coruja", "corvo",
  "dinossauro", "escorpiao", "ema", "falcao", "formiga", "gaivota", "galo",
  "iguana", "jacare", "lagarto", "papagaio", "pato", "pinguim",
  "quero quero", "ra", "sapo", "tartaruga", "tucano", "urubu", "avestruz",
  "andorinha", "albatroz", "aracari", "anu", "bem-te-vi", "besouro",
  "barata", "caranguejo", "cupim", "cagado", "codorna", "caracol",
  "carrapato", "camaleao", "faisao", "flamingo", "fragata", "ganso",
  "gafanhoto", "gaviao", "gralha", "grilo", "guara", "garca", "galinha",
  "harpia", "hidra", "ibis", "inhambu", "joao-de-barro", "jaburu",
  "juriti", "joaninha", "lagartixa", "lagosta", "libelula",
  "louva-a-deus", "lagarta", "mosca", "mosquito", "marreco", "maritaca",
  "marimbondo", "minhoca", "mexilhao", "nhandu", "ostra", "ourico",
  "osga", "oropendola", "pavao", "perereca", "pardal", "percevejo",
  "pernilongo", "pombo", "peru", "piolho", "quiriquiri", "rouxinol",
  "ra-touro", "salamandra", "siri", "sabia", "seriema", "sanguessuga",
  "soco", "tuiuiu", "uirapuru", "vespa", "verdelhao", "zangao", "zabele",
  // "quatipuru", "irara" e "nutria" ESTAVAM aqui por erro meu: os três são
  // mamíferos (esquilo, mustelídeo e roedor). Como este grupo nunca é movido,
  // eles seguiram no tema certo — mas a lista estava mentindo.
  // Pegos na conferência: insetos, aves, aracnídeos e equinodermos que eu
  // tinha classificado como mamífero por esquecimento.
  "bicho-da-seda", "estrela-do-mar", "formiga-cortadeira", "frango", "emu",
  "vaga-lume", "viuva negra", "tarantula", "tanajura", "taturana", "siriema",
];

// Entradas que não são animal. Ficam num grupo próprio pra você apagar —
// "ilh" é lixo de digitação e "dragão" é bicho de ficção.
const LIXO = ["ilh", "dragao"];

const classificar = (palavra) => {
  const n = norm(palavra);
  if (PEIXES.includes(n)) return "peixes";
  if (COBRAS.includes(n)) return "cobras";
  if (OUTROS.includes(n)) return "outro";
  if (LIXO.includes(n)) return "lixo";
  return "mamifero";
};

async function main() {
  const animais = await prisma.theme.findUnique({ where: { key: "animais" } });
  if (!animais) {
    console.log('\nTema "animais" não encontrado.\n');
    return;
  }

  const [temaPeixes, temaCobras] = await Promise.all([
    prisma.theme.findUnique({ where: { key: "peixes" } }),
    prisma.theme.findUnique({ where: { key: "cobras" } }),
  ]);
  if (!temaPeixes || !temaCobras) {
    console.log("\n⚠️  Os temas Peixes e Cobras ainda não existem.");
    console.log("   Rode antes:  npm run add-temas -- --confirmar\n");
    return;
  }

  const palavras = await prisma.wordEntry.findMany({
    where: { themeId: animais.id },
    select: { id: true, letter: true, word: true },
    orderBy: [{ letter: "asc" }, { word: "asc" }],
  });

  const grupos = { mamifero: [], peixes: [], cobras: [], outro: [], lixo: [] };
  for (const p of palavras) grupos[classificar(p.word)].push(p);

  console.log(`\n=== ${palavras.length} palavras em "Animais" ===\n`);
  console.log(`  ficam como MAMÍFEROS:  ${grupos.mamifero.length}`);
  console.log(`  vão pra PEIXES:        ${grupos.peixes.length}`);
  console.log(`  vão pra COBRAS:        ${grupos.cobras.length}`);
  console.log(`  não são mamíferos e ficam onde estão: ${grupos.outro.length}`);
  console.log(`  não são animal nenhum: ${grupos.lixo.length}\n`);

  if (grupos.lixo.length) {
    console.log("NÃO SÃO ANIMAL:", grupos.lixo.map((p) => p.word).join(", "));
    console.log("  (apague pelo painel)\n");
  }

  if (grupos.peixes.length) {
    console.log("PEIXES:", grupos.peixes.map((p) => p.word).join(", "), "\n");
  }
  if (grupos.cobras.length) {
    console.log("COBRAS:", grupos.cobras.map((p) => p.word).join(", "), "\n");
  }
  if (grupos.outro.length) {
    console.log("NÃO SÃO MAMÍFEROS (aves, insetos, répteis...):");
    console.log(" ", grupos.outro.map((p) => p.word).join(", "));
    console.log("\n  Estes NÃO serão movidos nem apagados — não há tema pra eles.");
    console.log("  Apague pelo painel, ou crie os temas e me peça pra mover.\n");
  }

  console.log("CONFIRA A LISTA DE MAMÍFEROS que vai ficar:");
  console.log(" ", grupos.mamifero.map((p) => p.word).join(", "), "\n");

  if (!confirmar) {
    console.log("--- SIMULAÇÃO — nada foi alterado ---");
    console.log("Se a classificação acima estiver certa:\n");
    console.log("  npm run segmentar-animais -- --confirmar\n");
    return;
  }

  // Move primeiro, renomeia depois: se algo falhar no meio, o tema ainda se
  // chama "Animais" e o estado continua coerente.
  for (const [chave, tema] of [["peixes", temaPeixes], ["cobras", temaCobras]]) {
    for (const p of grupos[chave]) {
      try {
        await prisma.wordEntry.update({
          where: { id: p.id },
          data: { themeId: tema.id },
        });
      } catch {
        // @@unique([themeId, letter, word]): já existe lá. Apaga a duplicata.
        await prisma.wordEntry.delete({ where: { id: p.id } });
      }
    }
    console.log(`✅ ${grupos[chave].length} movidas pra ${tema.name}`);
  }

  await prisma.theme.update({
    where: { id: animais.id },
    data: { name: "Mamíferos" },
  });
  console.log(`\n✅ Tema renomeado: Animais -> Mamíferos`);
  console.log(`\nA CHAVE continua "animais" de propósito: ela aparece em`);
  console.log(`roomConfigs.js e em scripts. Mudar a chave exigiria caçar todas`);
  console.log(`as referências, e o jogador só vê o NOME.\n`);

  if (grupos.outro.length) {
    console.log(`⚠️  ${grupos.outro.length} palavras que não são mamíferos continuam no tema.`);
    console.log(`   Elas valem ponto numa rodada de Mamíferos até você apagá-las.\n`);
  }
}

main()
  .catch((e) => {
    console.error("Erro:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
