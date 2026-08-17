// Esconde ou mostra um jogador no ranking de um jogo específico.
//
// Existem DOIS mecanismos de ocultação, e eles convivem:
//   - ocultoNoRanking  (booleano) — interruptor GERAL: some de todos
//   - ocultoNosRankings (lista)   — por jogo: ex. ["stop"] some só do Stop
//
// A pessoa fica oculta se o geral estiver ligado OU se o jogo estiver na
// lista. Por isso, pra aparecer só em um jogo, o geral precisa estar
// desligado — o script avisa quando esse é o caso.
//
// Uso:
//   npm run ranking-oculto -- NICK                 (só mostra a situação)
//   npm run ranking-oculto -- NICK stop            (esconde do Stop)
//   npm run ranking-oculto -- NICK stop --mostrar  (volta a aparecer no Stop)
//
// Jogos válidos: stop, quiz, acromania
// Mesmo padrão do ocultarRanking.js: o dotenv precisa vir antes, senão a
// DATABASE_URL não é lida e a conexão falha ao rodar fora do servidor.
import "dotenv/config";
import { prisma } from "../src/db.js";

const JOGOS = ["stop", "quiz", "acromania"];

function relatorio(u) {
  const lista = u.ocultoNosRankings || [];
  console.log("");
  console.log(`  Jogador : ${u.nickname}`);
  console.log(`  Cargo   : ${u.role}${u.role === "ADMIN" ? "   <-- ATENÇÃO, veja o aviso abaixo" : ""}`);
  console.log(`  Visitante: ${u.isGuest ? "sim" : "não"}`);
  console.log(`  Oculto em TODOS os rankings: ${u.ocultoNoRanking ? "SIM" : "não"}`);
  console.log(`  Oculto por jogo: ${lista.length ? lista.join(", ") : "nenhum"}`);
  console.log("");
  console.log("  Situação por jogo:");
  for (const j of JOGOS) {
    const escondido =
      u.role === "ADMIN" || u.isGuest || u.ocultoNoRanking || lista.includes(j);
    const motivo =
      u.role === "ADMIN" ? "conta ADMIN"
      : u.isGuest ? "conta de visitante"
      : u.ocultoNoRanking ? "interruptor geral ligado"
      : lista.includes(j) ? "oculto neste jogo"
      : "";
    console.log(`    ${j.padEnd(10)} ${escondido ? "OCULTO  (" + motivo + ")" : "APARECE"}`);
  }
  console.log("");

  if (u.role === "ADMIN") {
    console.log("  AVISO: contas ADMIN são excluídas de TODOS os rankings por regra");
    console.log("  do sistema, independente destes campos. Pra esta conta aparecer");
    console.log("  em algum ranking, o cargo precisaria deixar de ser ADMIN.");
    console.log("");
  }
}

async function main() {
  const [nick, jogo, flag] = process.argv.slice(2);

  if (!nick) {
    console.log("Uso: npm run ranking-oculto -- NICK [jogo] [--mostrar]");
    console.log("Jogos:", JOGOS.join(", "));
    return;
  }

  const u = await prisma.user.findFirst({
    where: { OR: [{ nickname: nick }, { email: nick }] },
    select: {
      id: true, nickname: true, role: true, isGuest: true,
      ocultoNoRanking: true, ocultoNosRankings: true,
    },
  });

  if (!u) {
    console.log(`Jogador "${nick}" não encontrado.`);
    return;
  }

  // Sem jogo informado: só relata, não altera nada.
  if (!jogo) {
    console.log("=== SITUAÇÃO ATUAL (nada foi alterado) ===");
    relatorio(u);
    return;
  }

  if (!JOGOS.includes(jogo)) {
    console.log(`Jogo inválido: "${jogo}". Use um destes: ${JOGOS.join(", ")}`);
    return;
  }

  const mostrar = flag === "--mostrar";
  const atual = new Set(u.ocultoNosRankings || []);
  if (mostrar) atual.delete(jogo);
  else atual.add(jogo);

  const dados = { ocultoNosRankings: [...atual] };

  // Se o interruptor geral está ligado, esconder por jogo não teria efeito
  // visível — a pessoa continuaria fora de tudo. Ao pedir pra MOSTRAR num
  // jogo, desligamos o geral e passamos os outros jogos pra lista, mantendo
  // exatamente a mesma ocultação de antes nos demais.
  if (mostrar && u.ocultoNoRanking) {
    dados.ocultoNoRanking = false;
    for (const j of JOGOS) if (j !== jogo) atual.add(j);
    dados.ocultoNosRankings = [...atual];
    console.log("");
    console.log("  O interruptor GERAL estava ligado. Ele foi desligado e os");
    console.log("  outros jogos foram para a lista, pra nada mudar neles.");
  }

  await prisma.user.update({ where: { id: u.id }, data: dados });

  const depois = await prisma.user.findUnique({
    where: { id: u.id },
    select: {
      nickname: true, role: true, isGuest: true,
      ocultoNoRanking: true, ocultoNosRankings: true,
    },
  });

  console.log(`=== ${mostrar ? "MOSTRANDO" : "OCULTANDO"} "${u.nickname}" no ranking de ${jogo} ===`);
  relatorio(depois);
  console.log("  Obs.: o ranking tem cache de 20 segundos — aguarde um pouco");
  console.log("  antes de conferir no site.");
}

main()
  .catch((e) => {
    console.error("Erro:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
