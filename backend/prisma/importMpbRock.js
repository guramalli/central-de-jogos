// Importa as perguntas das salas NOVAS de MPB e Rock'n Roll.
// Uso: npm run import-mpb-rock
//
// Soma ao banco sem duplicar — a busca é pelo TEXTO da pergunta, não pelo
// tema, pra o script não recriar perguntas que já mudaram de sala.
//
// A sala Música continua intacta: estas são salas novas, não uma divisão
// dela. Dividir exigiria reclassificar cada pergunta já cadastrada e
// deixaria pop, sertanejo e funk sem lugar.
import { PrismaClient } from "@prisma/client";
import { MPB } from "./data/quizMpb.js";
import { ROCK } from "./data/quizRock.js";
import { METAL } from "./data/quizMetal.js";
import { MPB2 } from "./data/quizMpb2.js";
import { MPB3 } from "./data/quizMpb3.js";
import { ROCK2 } from "./data/quizRock2.js";
import { FECHAMENTO } from "./data/quizFechamento.js";

const prisma = new PrismaClient();

async function main() {
  let inseridas = 0;
  let puladas = 0;

  for (const [themeKey, perguntas] of Object.entries({
    // Cada tema tem VÁRIOS arquivos, e todos usam a mesma chave. Espalhar
    // os objetos com spread faria um sobrescrever o outro e metade das
    // perguntas sumiria em silêncio — por isso as listas são concatenadas
    // à mão, e não com { ...A, ...B }.
    mpb: [...MPB.mpb, ...MPB2.mpb, ...MPB3.mpb, ...FECHAMENTO.mpb],
    rock: [...ROCK.rock, ...METAL.rock, ...ROCK2.rock, ...FECHAMENTO.rock],
  })) {
    let doTema = 0;
    for (const q of perguntas) {
      // Busca SÓ pelo texto da pergunta, sem filtrar por tema. Isso é
      // essencial: os scripts de migração (mover-anime, mover-mitologia,
      // mover-games) mudam o themeKey de perguntas já importadas. Se a
      // busca considerasse o tema, o script não encontraria a pergunta no
      // tema original e criaria uma duplicata.
      const existe = await prisma.quizQuestion.findFirst({
        where: { question: q.question },
      });
      if (existe) {
        puladas++;
        continue;
      }
      await prisma.quizQuestion.create({
        data: {
          themeKey,
          question: q.question,
          answer: q.answer,
          difficulty: q.difficulty || "medio",
          status: "approved",
          validated: true, // escritas e revisadas manualmente
        },
      });
      inseridas++;
      doTema++;
    }
    console.log(`  ${themeKey.padEnd(12)} +${doTema}`);
  }

  console.log("");
  console.log(`✅ Concluído! ${inseridas} pergunta(s) nova(s) inserida(s), ${puladas} já existiam.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
