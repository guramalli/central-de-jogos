/**
 * MOVE O QUE SOBROU EM "MAMÍFEROS" PROS TEMAS CERTOS
 *
 * Uso:
 *   npm run mover-bichos                 -> mostra o plano
 *   npm run mover-bichos -- --confirmar  -> executa
 *
 * Roda DEPOIS do segmentar-animais. Aquele script tirou peixes e cobras; este
 * tira aves, insetos e répteis — as 123 palavras que ficaram no tema porque
 * ainda não havia pra onde mandá-las.
 *
 * Enquanto elas estiverem lá, "abelha" e "arara" valem ponto numa rodada de
 * Mamíferos.
 *
 * MESMA REGRA DE SEGURANÇA do outro script: só mexe no que está classificado
 * abaixo. Palavra fora das listas é tratada como mamífero e FICA. No pior
 * caso um bicho errado continua valendo ponto — nunca some por engano.
 *
 * O QUE SOBRA DEPOIS: aracnídeos, moluscos, crustáceos e vermes (aranha,
 * ostra, siri, minhoca). São poucos e não rendem tema próprio; a lista sai no
 * relatório pra você apagar pelo painel.
 */
import { prisma } from "../src/db.js";

const confirmar = process.argv.includes("--confirmar");
const norm = (p) =>
  String(p || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const AVES = [
  "albatroz", "andorinha", "anu", "arara", "aracari", "avestruz", "aguia",
  "bem-te-vi", "codorna", "coruja", "corvo", "ema", "emu", "faisao",
  "falcao", "flamingo", "fragata", "frango", "gaivota", "galinha", "galo",
  "ganso", "garca", "gaviao", "gralha", "guara", "harpia", "inhambu",
  "ibis", "jaburu", "joao-de-barro", "juriti", "maritaca", "marreco",
  "nhandu", "oropendola", "papagaio", "pardal", "pato", "pavao", "peru",
  "pinguim", "pombo", "quiriquiri", "quero quero", "rouxinol", "sabia",
  "seriema", "siriema", "soco", "tucano", "tuiuiu", "uirapuru", "urubu",
  "verdelhao", "zabele",
];

const INSETOS = [
  "abelha", "barata", "besouro", "bicho-da-seda", "borboleta", "cupim",
  "formiga", "formiga-cortadeira", "gafanhoto", "grilo", "joaninha",
  "lagarta", "libelula", "louva-a-deus", "marimbondo", "mosca", "mosquito",
  "percevejo", "pernilongo", "piolho", "tanajura", "taturana", "vaga-lume",
  "vespa", "zangao",
];

const REPTEIS = [
  "camaleao", "cagado", "iguana", "jacare", "lagartixa", "lagarto", "osga",
  "perereca", "ra-touro", "ra", "salamandra", "sapo", "tartaruga",
  "dinossauro",
];

// Sem tema próprio: aracnídeos, moluscos, crustáceos, vermes, equinodermos.
const SEM_TEMA = [
  "aranha", "caracol", "caranguejo", "carrapato", "escorpiao",
  "estrela-do-mar", "lagosta", "mexilhao", "minhoca", "ostra", "ourico",
  "sanguessuga", "siri", "tarantula", "viuva negra", "hidra",
];

function classificar(palavra) {
  const n = norm(palavra);
  if (AVES.includes(n)) return "aves";
  if (INSETOS.includes(n)) return "insetos";
  if (REPTEIS.includes(n)) return "repteis";
  if (SEM_TEMA.includes(n)) return "semTema";
  return "fica";
}

async function main() {
  const origem = await prisma.theme.findUnique({ where: { key: "animais" } });
  if (!origem) {
    console.log('\nTema "animais" não encontrado.\n');
    return;
  }

  const destinos = {};
  for (const chave of ["aves", "insetos", "repteis"]) {
    destinos[chave] = await prisma.theme.findUnique({ where: { key: chave } });
    if (!destinos[chave]) {
      console.log(`\n⚠️  O tema "${chave}" ainda não existe.`);
      console.log("   Rode antes:  npm run add-temas -- --confirmar\n");
      return;
    }
  }

  const palavras = await prisma.wordEntry.findMany({
    where: { themeId: origem.id },
    select: { id: true, word: true },
    orderBy: { word: "asc" },
  });

  const grupos = { aves: [], insetos: [], repteis: [], semTema: [], fica: [] };
  for (const p of palavras) grupos[classificar(p.word)].push(p);

  console.log(`\n=== ${palavras.length} palavras em "${origem.name}" ===\n`);
  console.log(`  vão pra AVES:               ${grupos.aves.length}`);
  console.log(`  vão pra INSETOS:            ${grupos.insetos.length}`);
  console.log(`  vão pra RÉPTEIS E ANFÍBIOS: ${grupos.repteis.length}`);
  console.log(`  sem tema (apagar à mão):    ${grupos.semTema.length}`);
  console.log(`  ficam como mamíferos:       ${grupos.fica.length}\n`);

  for (const [chave, rotulo] of [["aves", "AVES"], ["insetos", "INSETOS"], ["repteis", "RÉPTEIS"]]) {
    if (grupos[chave].length) {
      console.log(`${rotulo}: ${grupos[chave].map((p) => p.word).join(", ")}\n`);
    }
  }
  if (grupos.semTema.length) {
    console.log("SEM TEMA (aracnídeos, moluscos, crustáceos, vermes):");
    console.log(" ", grupos.semTema.map((p) => p.word).join(", "));
    console.log("  Não serão movidos. Apague pelo painel.\n");
  }

  console.log("MAMÍFEROS que ficam:");
  console.log(" ", grupos.fica.map((p) => p.word).join(", "), "\n");

  if (!confirmar) {
    console.log("--- SIMULAÇÃO — nada foi alterado ---");
    console.log("Se estiver certo:\n");
    console.log("  npm run mover-bichos -- --confirmar\n");
    return;
  }

  for (const chave of ["aves", "insetos", "repteis"]) {
    for (const p of grupos[chave]) {
      try {
        await prisma.wordEntry.update({
          where: { id: p.id },
          data: { themeId: destinos[chave].id },
        });
      } catch {
        // Já existe lá (tema+letra+palavra é único): apaga a duplicata.
        await prisma.wordEntry.delete({ where: { id: p.id } });
      }
    }
    console.log(`✅ ${grupos[chave].length} movidas pra ${destinos[chave].name}`);
  }

  if (grupos.semTema.length) {
    console.log(`\n⚠️  ${grupos.semTema.length} continuam no tema (sem destino). Apague pelo painel.`);
  }
  console.log("");
}

main()
  .catch((e) => {
    console.error("Erro:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
