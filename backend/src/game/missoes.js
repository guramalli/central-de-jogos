import { prisma } from "../db.js";
import { concorreAoRanking } from "../utils/rankingElegivel.js";
import { currentMonthKey } from "../utils/monthKey.js";

// ===== Missões diárias e semanais =====
//
// As definições ficam aqui no código, não no banco: mudar objetivo ou
// recompensa não exige migration. O banco guarda só o progresso.
//
// Enquanto MISSOES_ATIVAS for false, nada é registrado nem aparece no site.
export const MISSOES_ATIVAS = true;

// Missões premium ficam marcadas com `premium: true`. As demais valem pra
// todo mundo — o premium ganha missões A MAIS, não missões melhores, pra
// não virar vantagem competitiva.
// Os pontos foram calibrados pela escala do jogo: um acerto no Quiz vale
// 10-15 e o 1º lugar de um bloco do Stop vale 150. As missões premiam a
// CONSTÂNCIA, não substituem o jogo — completar todas as diárias rende
// menos que uma sessão boa de partidas.
export const MISSOES = {
  diarias: [
    { key: "jogar_3_rodadas", nome: "Aquecimento", descricao: "Jogue 3 rodadas em qualquer jogo", meta: 3, evento: "rodada_jogada", pontos: 30 },
    { key: "acertar_10_quiz", nome: "Sabe-tudo", descricao: "Acerte 10 perguntas no Quiz", meta: 10, evento: "quiz_acerto", pontos: 40 },
    { key: "pedir_stop_1", nome: "Dedo rápido", descricao: "Peça STOP uma vez", meta: 1, evento: "stop_pedido", pontos: 25 },
    { key: "jogar_2_jogos", nome: "Versátil", descricao: "Jogue 2 jogos diferentes hoje", meta: 2, evento: "jogo_distinto", pontos: 35 },
    // Extras de premium
    { key: "premium_acertar_25", nome: "Maratonista", descricao: "Acerte 25 perguntas no Quiz", meta: 25, evento: "quiz_acerto", pontos: 60, premium: true },
    { key: "premium_vencer_bloco", nome: "Dominante", descricao: "Termine um bloco em 1º lugar", meta: 1, evento: "bloco_vencido", pontos: 70, premium: true },
  ],
  semanais: [
    { key: "sem_jogar_30", nome: "Frequente", descricao: "Jogue 30 rodadas na semana", meta: 30, evento: "rodada_jogada", pontos: 150 },
    { key: "sem_acertar_100", nome: "Enciclopédia", descricao: "Acerte 100 perguntas no Quiz", meta: 100, evento: "quiz_acerto", pontos: 200 },
    { key: "sem_5_temas", nome: "Curioso", descricao: "Jogue em 5 temas diferentes do Quiz", meta: 5, evento: "tema_distinto", pontos: 120 },
    // Extras de premium
    { key: "premium_sem_podio", nome: "Pódio", descricao: "Termine 3 blocos no pódio", meta: 3, evento: "bloco_podio", pontos: 250, premium: true },
  ],
};

// ===== Sequência de dias (streak) =====
//
// Premia quem volta todo dia. Zera se a pessoa faltar um dia — é o que
// dá peso à sequência. Os marcos são espaçados pra manter o interesse
// além da primeira semana.
export const RECOMPENSAS_STREAK = [
  { dias: 2, pontos: 20 },
  { dias: 3, pontos: 30 },
  { dias: 5, pontos: 60 },
  { dias: 7, pontos: 120, marco: "Uma semana seguida!" },
  { dias: 14, pontos: 250, marco: "Duas semanas!" },
  { dias: 30, pontos: 600, marco: "Um mês inteiro!" },
  { dias: 60, pontos: 1200, marco: "Dois meses!" },
  { dias: 100, pontos: 2500, marco: "100 dias!" },
];

// Depois do último marco, cada dia extra rende um valor fixo — assim quem
// passa de 100 dias continua tendo motivo pra voltar.
export const PONTOS_STREAK_APOS_MARCOS = 50;

// Chave do período atual. Diária usa a data; semanal usa ano + número da
// semana (ISO), pra virar toda segunda.
export function periodoAtual(tipo) {
  const agora = new Date();
  if (tipo === "diarias") {
    return agora.toISOString().slice(0, 10); // "2026-08-11"
  }
  const d = new Date(Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate()));
  const diaSemana = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - diaSemana);
  const inicioAno = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const semana = Math.ceil(((d - inicioAno) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(semana).padStart(2, "0")}`;
}

// Registra progresso num evento. Chamado dos jogos quando algo acontece.
// Não trava nada: falha em silêncio e nunca é esperado com await no meio
// de uma rodada.
export async function registrarEvento(userId, evento, quantidade = 1) {
  if (!MISSOES_ATIVAS || !userId) return;

  try {
    for (const tipo of ["diarias", "semanais"]) {
      const periodo = periodoAtual(tipo);
      const missoes = MISSOES[tipo].filter((m) => m.evento === evento);

      for (const m of missoes) {
        const atual = await prisma.missaoProgresso.findUnique({
          where: { userId_missaoKey_periodo: { userId, missaoKey: m.key, periodo } },
        });

        // Já concluída: não precisa mexer mais.
        if (atual?.concluida) continue;

        const novo = (atual?.progresso || 0) + quantidade;
        const concluiu = novo >= m.meta;

        await prisma.missaoProgresso.upsert({
          where: { userId_missaoKey_periodo: { userId, missaoKey: m.key, periodo } },
          update: {
            progresso: novo,
            concluida: concluiu,
            concluidaEm: concluiu ? new Date() : null,
          },
          create: {
            userId,
            missaoKey: m.key,
            periodo,
            progresso: novo,
            meta: m.meta,
            concluida: concluiu,
            concluidaEm: concluiu ? new Date() : null,
          },
        });
      }
    }
  } catch (err) {
    console.error("Falha ao registrar missão:", err.message);
  }
}

// Monta a lista de missões da pessoa, com o progresso de cada uma.
export async function missoesDe(userId, ehPremium) {
  if (!MISSOES_ATIVAS) return { ativas: false, diarias: [], semanais: [] };

  const resultado = { ativas: true, diarias: [], semanais: [] };

  for (const tipo of ["diarias", "semanais"]) {
    const periodo = periodoAtual(tipo);
    // Quem não é premium não vê as missões exclusivas na lista — elas
    // aparecem numa seção separada, como amostra do que o premium oferece.
    const disponiveis = MISSOES[tipo].filter((m) => !m.premium || ehPremium);

    const progressos = await prisma.missaoProgresso.findMany({
      where: { userId, periodo, missaoKey: { in: disponiveis.map((m) => m.key) } },
    });
    const porChave = Object.fromEntries(progressos.map((p) => [p.missaoKey, p]));

    resultado[tipo] = disponiveis.map((m) => ({
      ...m,
      progresso: porChave[m.key]?.progresso || 0,
      concluida: porChave[m.key]?.concluida || false,
      resgatada: porChave[m.key]?.resgatada || false,
    }));
  }

  return resultado;
}

// ===== Crédito de pontos =====
//
// Missões e streak somam no ranking mensal E vitalício, como os pontos de
// jogo. Usa o Stop como gameKey por ser o jogo principal do ranking geral.
const GAME_KEY_RECOMPENSA = "stop";

async function creditarPontos(userId, pontos, motivo) {
  if (!pontos || pontos <= 0) return false;

  // Visitante e ADMIN não entram em ranking nenhum — creditar pra eles
  // seria inconsistente com o resto do site.
  if (!(await concorreAoRanking(userId))) return false;

  const monthKey = currentMonthKey();
  await prisma.monthlyScore.upsert({
    where: { userId_gameKey_monthKey: { userId, gameKey: GAME_KEY_RECOMPENSA, monthKey } },
    update: { points: { increment: pontos } },
    create: { userId, gameKey: GAME_KEY_RECOMPENSA, monthKey, points: pontos },
  });
  await prisma.lifetimeScore.upsert({
    where: { userId_gameKey: { userId, gameKey: GAME_KEY_RECOMPENSA } },
    update: { points: { increment: pontos } },
    create: { userId, gameKey: GAME_KEY_RECOMPENSA, points: pontos },
  });

  console.log(`+${pontos} pts para ${userId} (${motivo})`);
  return true;
}

// Resgata a recompensa de uma missão concluída. Só funciona uma vez —
// `resgatada` no banco é a trava contra clique duplo ou requisição repetida.
export async function resgatarMissao(userId, missaoKey, periodo) {
  const todas = [...MISSOES.diarias, ...MISSOES.semanais];
  const missao = todas.find((m) => m.key === missaoKey);
  if (!missao) return { ok: false, erro: "Missão não encontrada." };

  const prog = await prisma.missaoProgresso.findUnique({
    where: { userId_missaoKey_periodo: { userId, missaoKey, periodo } },
  });

  if (!prog?.concluida) return { ok: false, erro: "Missão ainda não foi concluída." };
  if (prog.resgatada) return { ok: false, erro: "Recompensa já resgatada." };

  // Marca como resgatada ANTES de creditar: se o crédito falhar, a pessoa
  // perde os pontos dessa vez, mas nunca recebe em dobro.
  await prisma.missaoProgresso.update({
    where: { id: prog.id },
    data: { resgatada: true },
  });

  const creditou = await creditarPontos(userId, missao.pontos, `missão ${missaoKey}`);
  return { ok: true, pontos: creditou ? missao.pontos : 0, creditou };
}

// ===== Sequência de dias =====
//
// Chamado quando a pessoa entra numa sala. Compara o último dia registrado
// com hoje:
//   - mesmo dia   -> não faz nada (já contou)
//   - ontem       -> sequência continua
//   - antes disso -> sequência zera e recomeça em 1
export async function registrarDiaJogado(userId) {
  if (!MISSOES_ATIVAS || !userId) return null;

  try {
    const hoje = new Date().toISOString().slice(0, 10);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { streakAtual: true, streakRecorde: true, streakUltimoDia: true },
    });
    if (!user) return null;
    if (user.streakUltimoDia === hoje) return null; // já contou hoje

    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    const ontemStr = ontem.toISOString().slice(0, 10);

    const continua = user.streakUltimoDia === ontemStr;
    const novoStreak = continua ? user.streakAtual + 1 : 1;
    const novoRecorde = Math.max(novoStreak, user.streakRecorde || 0);

    await prisma.user.update({
      where: { id: userId },
      data: { streakAtual: novoStreak, streakRecorde: novoRecorde, streakUltimoDia: hoje },
    });

    // Recompensa do dia: marco exato, ou o valor fixo depois do último.
    const marco = RECOMPENSAS_STREAK.find((r) => r.dias === novoStreak);
    const ultimoMarco = RECOMPENSAS_STREAK[RECOMPENSAS_STREAK.length - 1];
    let pontos = 0;
    if (marco) pontos = marco.pontos;
    else if (novoStreak > ultimoMarco.dias) pontos = PONTOS_STREAK_APOS_MARCOS;

    if (pontos > 0) {
      await creditarPontos(userId, pontos, `sequência de ${novoStreak} dias`);
    }

    return {
      streak: novoStreak,
      recorde: novoRecorde,
      quebrou: !continua && user.streakAtual > 1,
      pontos,
      marco: marco?.marco || null,
    };
  } catch (err) {
    console.error("Falha ao registrar dia jogado:", err.message);
    return null;
  }
}
