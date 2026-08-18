import { prisma } from "../db.js";
import { concorreAoRanking } from "../utils/rankingElegivel.js";
import { currentMonthKey, hojeBrasilia, ontemBrasilia, semanaBrasilia } from "../utils/monthKey.js";

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
// BALANCEAMENTO DAS RECOMPENSAS
//
// A régua usada não foi "quantos pontos parece bastante", e sim a recompensa
// como BÔNUS sobre o que a pessoa já ganha cumprindo a missão. Isso importa
// porque Stop e Quiz têm economias muito diferentes: uma hora de Stop rende
// cerca de 6.240 pontos e uma hora de Quiz cerca de 580 — no Quiz só o
// primeiro a acertar pontua.
//
// Pela régua antiga, as missões de Stop davam 19% de bônus e a "Sabe-tudo"
// do Quiz dava 100%: a mesma quantia significava coisas opostas. Agora quase
// todas ficam entre 37% e 45%, ou seja, cumprir a missão vale de verdade nos
// dois jogos.
//
// As metas subiram junto (10 → 12 rodadas, 3 → 4 temas, 30 → 40 na semana):
// prêmio maior sem exigir mais viraria pontuação de graça.
//
// EFEITO NO RANKING: estes pontos entram no monthlyScore, que é o ranking
// premiado. No mês somam ~23 mil no Stop (3,3% da escada de patentes) e
// ~14 mil no Quiz (6,7%). É bônus que ajuda, não caminho alternativo pra
// ganhar o Pix sem jogar.
export const MISSOES = {
  diarias: [
    // --- Stop ---
    { key: "stop_10_rodadas", jogo: "stop", nome: "Aquecimento", descricao: "Jogue 12 rodadas de Stop", meta: 12, evento: "rodada_stop", pontos: 280 },
    { key: "stop_10_stops", jogo: "stop", nome: "Dedo rápido", descricao: "Peça STOP 12 vezes", meta: 12, evento: "stop_pedido", pontos: 280 },
    // --- Quiz ---
    { key: "quiz_10_acertos", jogo: "quiz", nome: "Sabe-tudo", descricao: "Acerte 14 perguntas no Quiz", meta: 14, evento: "quiz_acerto", pontos: 160 },
    { key: "quiz_3_temas", jogo: "quiz", nome: "Passeio", descricao: "Acerte perguntas em 4 temas diferentes", meta: 4, evento: "tema_distinto", pontos: 180 },
    // --- Acromania ---
    { key: "acro_3_frases", jogo: "acromania", nome: "Criativo", descricao: "Envie 4 frases na Acromania", meta: 4, evento: "acro_frase", pontos: 180 },
    // --- Premium (escondidas enquanto o recurso está desligado) ---
    { key: "premium_quiz_25", jogo: "quiz", nome: "Maratonista", descricao: "Acerte 30 perguntas no Quiz", meta: 30, evento: "quiz_acerto", pontos: 400, premium: true },
    { key: "premium_stop_bloco", jogo: "stop", nome: "Dominante", descricao: "Termine um bloco em 1º lugar", meta: 1, evento: "bloco_vencido", pontos: 500, premium: true },
  ],
  semanais: [
    // --- Stop ---
    { key: "stop_sem_30", jogo: "stop", nome: "Frequente", descricao: "Jogue 40 rodadas de Stop na semana", meta: 40, evento: "rodada_stop", pontos: 800 },
    // Semanal de STOPs pedidos: reaproveita o evento "stop_pedido", que já
    // existe e já alimenta a "Dedo rápido" diária — nenhuma linha nova no
    // código do jogo. Premia quem arrisca fechar a rodada, não só quem
    // preenche os campos e espera.
    { key: "stop_sem_40_stops", jogo: "stop", nome: "Mão firme", descricao: "Peça STOP 40 vezes na semana", meta: 40, evento: "stop_pedido", pontos: 800 },
    // --- Quiz ---
    { key: "quiz_sem_100", jogo: "quiz", nome: "Enciclopédia", descricao: "Acerte 120 perguntas no Quiz", meta: 120, evento: "quiz_acerto", pontos: 650 },
    { key: "quiz_sem_5_temas", jogo: "quiz", nome: "Curioso", descricao: "Acerte perguntas em 6 temas diferentes", meta: 6, evento: "tema_distinto", pontos: 400 },
    // --- Acromania ---
    { key: "acro_sem_votos", jogo: "acromania", nome: "Popular", descricao: "Receba 12 votos nas suas frases", meta: 12, evento: "acro_voto_recebido", pontos: 450 },
    // --- Premium ---
    { key: "premium_stop_podio", jogo: "stop", nome: "Pódio", descricao: "Termine 3 blocos no pódio", meta: 3, evento: "bloco_podio", pontos: 900, premium: true },
  ],
};

// Nome de cada jogo, pra exibir na tela agrupada.
export const NOMES_JOGOS = {
  stop: { nome: "Stop", icone: "✏️" },
  quiz: { nome: "Quiz", icone: "🧠" },
  acromania: { nome: "Acromania", icone: "💬" },
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
  // Sempre no horário de Brasília: o servidor roda em UTC, e usar o fuso
  // dele faria as missões virarem às 21h em vez da meia-noite.
  return tipo === "diarias" ? hojeBrasilia() : semanaBrasilia();
}

// Registra progresso num evento. Chamado dos jogos quando algo acontece.
// Não trava nada: falha em silêncio e nunca é esperado com await no meio
// de uma rodada.
// Mesmo mecanismo do premium: se a tabela de missões ainda não existe no
// banco, o sistema se desliga sozinho em vez de logar erro a cada rodada.
let tabelaIndisponivel = false;

export async function registrarEvento(userId, evento, quantidade = 1) {
  if (!MISSOES_ATIVAS || !userId || tabelaIndisponivel) return;

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
    if (/does not exist|relation|Unknown arg|column/i.test(err.message || "")) {
      tabelaIndisponivel = true;
      console.warn("Tabela de missões ausente — rode `npx prisma db push`. Missões desativadas por ora.");
      return;
    }
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
      key: m.key,
      jogo: m.jogo,
      nome: m.nome,
      descricao: m.descricao,
      meta: m.meta,
      pontos: m.pontos,
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
// jogo. Cada missão credita no ranking do SEU jogo: uma missão de Quiz não
// pode fazer alguém subir no ranking do Stop sem ter jogado Stop.
async function creditarPontos(userId, pontos, motivo, gameKey) {
  if (!pontos || pontos <= 0) return false;

  // Visitante e ADMIN não entram em ranking nenhum — creditar pra eles
  // seria inconsistente com o resto do site.
  if (!(await concorreAoRanking(userId))) return false;

  const jogo = gameKey || "stop";
  const monthKey = currentMonthKey();
  await prisma.monthlyScore.upsert({
    where: { userId_gameKey_monthKey: { userId, gameKey: jogo, monthKey } },
    update: { points: { increment: pontos } },
    create: { userId, gameKey: jogo, monthKey, points: pontos },
  });
  await prisma.lifetimeScore.upsert({
    where: { userId_gameKey: { userId, gameKey: jogo } },
    update: { points: { increment: pontos } },
    create: { userId, gameKey: jogo, points: pontos },
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

  const creditou = await creditarPontos(userId, missao.pontos, `missão ${missaoKey}`, missao.jogo);
  return { ok: true, pontos: creditou ? missao.pontos : 0, creditou, jogo: missao.jogo };
}

// Descobre em qual jogo a pessoa mais pontuou no mês. Usado pra decidir
// onde creditar recompensas que não pertencem a um jogo específico.
async function jogoMaisJogadoNoMes(userId) {
  try {
    const scores = await prisma.monthlyScore.findMany({
      where: { userId, monthKey: currentMonthKey() },
      orderBy: { points: "desc" },
      take: 1,
    });
    return scores[0]?.gameKey || "stop";
  } catch {
    return "stop";
  }
}

// ===== Sequência de dias =====
//
// Chamado quando a pessoa entra numa sala. Compara o último dia registrado
// com hoje:
//   - mesmo dia   -> não faz nada (já contou)
//   - ontem       -> sequência continua
//   - antes disso -> sequência zera e recomeça em 1
export async function registrarDiaJogado(userId) {
  if (!MISSOES_ATIVAS || !userId || tabelaIndisponivel) return null;

  try {
    const hoje = hojeBrasilia();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { streakAtual: true, streakRecorde: true, streakUltimoDia: true },
    });
    if (!user) return null;
    if (user.streakUltimoDia === hoje) return null; // já contou hoje

    const ontemStr = ontemBrasilia();

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
      // A sequência não é de nenhum jogo específico, então credita no que a
      // pessoa mais jogou no mês — é onde o ponto faz mais sentido pra ela.
      const jogoPreferido = await jogoMaisJogadoNoMes(userId);
      await creditarPontos(userId, pontos, `sequência de ${novoStreak} dias`, jogoPreferido);
    }

    return {
      streak: novoStreak,
      recorde: novoRecorde,
      quebrou: !continua && user.streakAtual > 1,
      pontos,
      marco: marco?.marco || null,
    };
  } catch (err) {
    if (/does not exist|relation|Unknown arg|column/i.test(err.message || "")) {
      tabelaIndisponivel = true;
      console.warn("Colunas de sequência ausentes — rode `npx prisma db push`.");
      return null;
    }
    console.error("Falha ao registrar dia jogado:", err.message);
    return null;
  }
}

// ===== Eventos "distintos" =====
//
// Algumas missões pedem VARIEDADE ("2 jogos diferentes", "5 temas
// diferentes"), não repetição. Para essas, incrementar a cada acerto
// estaria errado: acertar 5 vezes no mesmo tema não é 5 temas.
//
// A solução é guardar o que já foi contado no próprio progresso, numa
// tabela auxiliar em memória por período. Como o progresso é pequeno e
// reseta todo dia/semana, isso não pesa.
const distintosVistos = new Map(); // "userId:evento:periodo" -> Set de valores

export async function registrarDistinto(userId, evento, valor) {
  if (!MISSOES_ATIVAS || !userId || !valor || tabelaIndisponivel) return;

  for (const tipo of ["diarias", "semanais"]) {
    const missoes = MISSOES[tipo].filter((m) => m.evento === evento);
    if (missoes.length === 0) continue;

    const periodo = periodoAtual(tipo);
    const chave = `${userId}:${evento}:${periodo}`;

    if (!distintosVistos.has(chave)) distintosVistos.set(chave, new Set());
    const jaVistos = distintosVistos.get(chave);

    // Já contou esse valor nesse período: não incrementa de novo.
    if (jaVistos.has(valor)) continue;
    jaVistos.add(valor);

    // Registra +1 só nas missões desse tipo de período.
    for (const m of missoes) {
      try {
        const atual = await prisma.missaoProgresso.findUnique({
          where: { userId_missaoKey_periodo: { userId, missaoKey: m.key, periodo } },
        });
        if (atual?.concluida) continue;

        const novo = (atual?.progresso || 0) + 1;
        const concluiu = novo >= m.meta;

        await prisma.missaoProgresso.upsert({
          where: { userId_missaoKey_periodo: { userId, missaoKey: m.key, periodo } },
          update: { progresso: novo, concluida: concluiu, concluidaEm: concluiu ? new Date() : null },
          create: {
            userId, missaoKey: m.key, periodo, progresso: novo, meta: m.meta,
            concluida: concluiu, concluidaEm: concluiu ? new Date() : null,
          },
        });
      } catch (err) {
        console.error("Falha ao registrar missão distinta:", err.message);
      }
    }
  }
}

// Limpa o cache de valores distintos de períodos antigos. Roda de hora em
// hora pra memória não crescer sem fim com o site rodando por semanas.
setInterval(() => {
  const diaAtual = periodoAtual("diarias");
  const semanaAtual = periodoAtual("semanais");
  for (const chave of distintosVistos.keys()) {
    const periodo = chave.split(":").pop();
    if (periodo !== diaAtual && periodo !== semanaAtual) {
      distintosVistos.delete(chave);
    }
  }
}, 60 * 60 * 1000);
