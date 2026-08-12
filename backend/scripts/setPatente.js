// Script de manutenção: fixa (ou remove) a patente exibida por uma conta.
//
// A conta passa a mostrar a patente escolhida em qualquer lugar do site —
// lista de sala, chat, ranking, perfil — sem precisar de pontuação. É só
// exibição: não altera pontos e NÃO tira a patente exclusiva de quem a
// conquistou jogando (o 1º colocado do mês continua sendo o dono legítimo).
//
// Uso (dentro da pasta backend):
//   node scripts/setPatente.js admineg stop coroa_imperial_ouro
//   node scripts/setPatente.js admineg quiz enciclopedia
//   node scripts/setPatente.js admineg stop --remover
//
// ou, via npm:
//   npm run set-patente -- admineg stop coroa_imperial_ouro
//
// Sem os argumentos de patente, lista as chaves disponíveis.

import "dotenv/config";
import { prisma } from "../src/db.js";
import { RANKS } from "../src/utils/rank.js";
import { QUIZ_RANKS } from "../src/utils/quizRank.js";

const identificador = process.argv[2];
const jogo = process.argv[3];
const chave = process.argv[4];

function listar(lista, titulo) {
  console.log(`\n${titulo}:`);
  for (const r of lista) console.log(`  ${r.key.padEnd(24)} ${r.name}`);
}

async function main() {
  if (!identificador || !jogo) {
    console.log('Uso: node scripts/setPatente.js <nickname|email> <stop|quiz> <chave|--remover>');
    listar(RANKS, "Patentes do Stop");
    listar(QUIZ_RANKS, "Patentes do Quiz");
    process.exit(1);
  }
  if (!["stop", "quiz"].includes(jogo)) {
    console.log("Jogo inválido. Use: stop ou quiz.");
    process.exit(1);
  }

  const lista = jogo === "quiz" ? QUIZ_RANKS : RANKS;
  const remover = chave === "--remover";
  if (!remover) {
    if (!chave) {
      console.log("Informe a chave da patente (ou --remover).");
      listar(lista, `Patentes do ${jogo === "quiz" ? "Quiz" : "Stop"}`);
      process.exit(1);
    }
    if (!lista.some((r) => r.key === chave)) {
      console.log(`Patente "${chave}" não existe nesse jogo.`);
      listar(lista, `Patentes do ${jogo === "quiz" ? "Quiz" : "Stop"}`);
      process.exit(1);
    }
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ nickname: identificador }, { email: identificador }] },
    select: { id: true, nickname: true },
  });
  if (!user) {
    console.log(`Conta não encontrada: ${identificador}`);
    process.exit(1);
  }

  const campo = jogo === "quiz" ? "patenteQuizFixa" : "patenteStopFixa";
  await prisma.user.update({
    where: { id: user.id },
    data: { [campo]: remover ? null : chave },
  });

  if (remover) {
    console.log(`✔ "${user.nickname}" volta a exibir a patente pela pontuação no ${jogo}.`);
  } else {
    const patente = lista.find((r) => r.key === chave);
    console.log(`✔ "${user.nickname}" agora exibe "${patente.name}" no ${jogo}, independente de pontos.`);
    console.log("  (A patente exclusiva de verdade continua com quem lidera o ranking do mês.)");
    console.log("  Pode levar até 5 minutos pra aparecer no site.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
