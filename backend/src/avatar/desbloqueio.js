import { prisma } from "../db.js";
import { cacheOuBuscar, cacheApagar } from "../utils/cache.js";
import { RANKS } from "../utils/rank.js";
import { QUIZ_RANKS } from "../utils/quizRank.js";
import { ACROMANIA_RANKS } from "../utils/acromaniaRank.js";
import { MENTIRA_RANKS } from "../utils/mentiraRank.js";
import { nomesDeTitulosDesbloqueados, fonteDoTitulo } from "../game/titulosConfig.js";
import { ITENS, ITEM_POR_ID, NOMES_DOS_SLOTS } from "./catalogo.js";

// ===== Quais peças do avatar uma pessoa já liberou =====
//
// Nada disso fica gravado: é recalculado das estatísticas que o site já
// guarda (títulos, patentes, sequência, pontos). Assim uma peça nova no
// catálogo já nasce liberada pra quem cumpre a regra, sem migração.
//
// CUSTO NO BANCO: só roda ao abrir o editor e ao salvar (nunca no hover do
// perfil), com cache de 60s. E só busca o que o catálogo PRECISA: se nenhuma
// peça depende de título do Quiz, a QuizRoomStat nem é lida. No pior caso
// são 6 consultas pequenas em paralelo, todas por índice que começa em
// userId (dezenas de linhas por pessoa, no máximo).

export const TABELAS_DE_PATENTE = {
  stop: RANKS,
  quiz: QUIZ_RANKS,
  acromania: ACROMANIA_RANKS,
  mentira: MENTIRA_RANKS,
};

const LIBERADOS_CACHE_SEGUNDOS = 60;
const chaveLiberados = (userId) => `avatar-liberados:${userId}`;

export function patenteDoCatalogo(jogo, key) {
  return (TABELAS_DE_PATENTE[jogo] || []).find((r) => r.key === key) || null;
}

// Que dados o conjunto de peças exige — pra não consultar tabela à toa.
export function dadosNecessarios(itens = ITENS) {
  const p = { quiz: false, stop: false, campeao: false, sequencia: false, jogosMensais: new Set(), jogosVitalicios: new Set() };
  for (const { desbloqueio: d } of itens) {
    if (d.tipo === "titulo") {
      // "comecaCom" pode casar com qualquer família de título: busca tudo.
      const fonte = d.nome ? fonteDoTitulo(d.nome) : { quiz: true, stop: true, campeao: true };
      if (fonte.quiz) p.quiz = true;
      if (fonte.stop) p.stop = true;
      if (fonte.campeao) p.campeao = true;
    } else if (d.tipo === "patente") {
      p.jogosMensais.add(d.jogo);
      // A patente máxima é exclusiva do 1º do mês: só vale com o troféu.
      if (patenteDoCatalogo(d.jogo, d.patente)?.exclusiva) p.campeao = true;
    } else if (d.tipo === "sequencia") {
      p.sequencia = true;
    } else if (d.tipo === "pontos") {
      p.jogosVitalicios.add(d.jogo);
    }
  }
  return p;
}

// Busca no banco só o que `precisa` pede. `db` é injetável pros testes.
export async function carregarDados(userId, precisa, db = prisma) {
  const nada = Promise.resolve([]);
  const [user, statsQuiz, statsStop, campeoes, mensais, vitalicios] = await Promise.all([
    precisa.sequencia
      ? db.user.findUnique({ where: { id: userId }, select: { streakRecorde: true } })
      : Promise.resolve(null),
    precisa.quiz
      ? db.quizRoomStat.findMany({ where: { userId, roomId: { startsWith: "quiz-" } }, select: { roomId: true, correct: true } })
      : nada,
    precisa.stop
      ? db.stopStat.findMany({ where: { userId }, select: { grupo: true, stops: true, rapidos: true } }).catch(() => [])
      : nada,
    precisa.campeao
      ? db.campeaoMensal.findMany({ where: { userId }, select: { gameKey: true, monthKey: true, points: true } })
      : nada,
    // Melhor mês de cada jogo: patente é mensal e zera todo dia 1º, mas as
    // linhas dos meses passados continuam no banco. Então "chegou ao Troféu
    // de Bronze" = em algum mês a pontuação passou do mínimo — a peça,
    // uma vez ganha, não some quando o mês vira.
    precisa.jogosMensais.size
      ? db.monthlyScore.groupBy({
        by: ["gameKey"],
        where: { userId, gameKey: { in: [...precisa.jogosMensais] } },
        _max: { points: true },
      })
      : nada,
    precisa.jogosVitalicios.size
      ? db.lifetimeScore.findMany({ where: { userId, gameKey: { in: [...precisa.jogosVitalicios] } }, select: { gameKey: true, points: true } })
      : nada,
  ]);

  return {
    titulos: precisa.quiz || precisa.stop || precisa.campeao
      ? nomesDeTitulosDesbloqueados({ statsQuiz, statsStop, registrosCampeao: campeoes })
      : new Set(),
    campeoes,
    melhorMes: Object.fromEntries(mensais.map((m) => [m.gameKey, m._max?.points || 0])),
    vitalicio: Object.fromEntries(vitalicios.map((l) => [l.gameKey, l.points])),
    streakRecorde: user?.streakRecorde || 0,
  };
}

// A regra de UMA peça contra os dados já carregados. Pura: sem banco.
export function itemLiberado(item, dados) {
  const d = item?.desbloqueio;
  if (!d) return false;
  switch (d.tipo) {
    case "inicial":
      return true;
    case "titulo": {
      if (d.nome) return dados.titulos.has(d.nome);
      if (d.comecaCom) return [...dados.titulos].some((n) => n.startsWith(d.comecaCom));
      return false;
    }
    case "patente": {
      const patente = patenteDoCatalogo(d.jogo, d.patente);
      if (!patente) return false;
      if ((dados.melhorMes[d.jogo] || 0) < patente.min) return false;
      // Passar do mínimo da patente exclusiva não basta: só o campeão do mês
      // a teve de fato (os outros ficaram na de baixo).
      if (patente.exclusiva) {
        return dados.campeoes.some((c) => c.gameKey === d.jogo && c.points >= patente.min);
      }
      return true;
    }
    case "sequencia":
      return dados.streakRecorde >= d.dias;
    case "pontos":
      return (dados.vitalicio[d.jogo] || 0) >= d.min;
    default:
      // Tipo desconhecido fica trancado: melhor que liberar por engano.
      return false;
  }
}

export function liberadosPelosDados(dados, itens = ITENS) {
  return itens.filter((i) => itemLiberado(i, dados)).map((i) => i.id);
}

// Lista de ids liberados pra essa pessoa (cache de 60s).
export function itensLiberados(userId) {
  return cacheOuBuscar(chaveLiberados(userId), LIBERADOS_CACHE_SEGUNDOS, async () => {
    const dados = await carregarDados(userId, dadosNecessarios());
    return liberadosPelosDados(dados);
  });
}

export function esquecerLiberados(userId) {
  cacheApagar(chaveLiberados(userId));
}

// ===== Validação da montagem =====
//
// Recebe o que o navegador mandou ({ slot: idDaPeça | null }) e o conjunto de
// ids liberados. Confere, pra cada slot: se o slot existe, se a peça existe,
// se é DESSE slot e se está liberada. `pele` é obrigatória. Devolve a
// montagem limpa (sem slots vazios) ou a mensagem de erro.
export function validarConfig(config, liberados) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return { erro: "Montagem inválida." };
  }
  const limpa = {};
  for (const [slot, id] of Object.entries(config)) {
    if (!NOMES_DOS_SLOTS.includes(slot)) return { erro: `Parte desconhecida: ${slot}.` };
    if (id === null || id === undefined || id === "") continue; // slot vazio
    if (typeof id !== "string") return { erro: "Montagem inválida." };
    const item = ITEM_POR_ID.get(id);
    if (!item) return { erro: "Essa peça não existe." };
    if (item.slot !== slot) return { erro: `"${item.nome}" não vai nessa parte.` };
    if (!liberados.has(id)) return { erro: `"${item.nome}" ainda está trancado. ${item.dica || ""}`.trim() };
    limpa[slot] = id;
  }
  if (!limpa.pele) return { erro: "Escolha a pele do seu avatar." };
  return { config: limpa };
}

// Montagem pra mostrar aos OUTROS (perfil público): descarta peças que
// saíram do catálogo ou mudaram de slot. Não reconfere o desbloqueio — isso
// foi feito ao salvar, e peça ganha não se perde. Sem pele válida = null
// (quem vê cai na foto/iniciais).
export function configPublica(salvo) {
  if (!salvo || typeof salvo !== "object" || Array.isArray(salvo)) return null;
  const limpa = {};
  for (const slot of NOMES_DOS_SLOTS) {
    const item = ITEM_POR_ID.get(salvo[slot]);
    if (item && item.slot === slot) limpa[slot] = item.id;
  }
  return limpa.pele ? limpa : null;
}

// ===== Salvar (PUT /api/avatar) =====
//
// Separado da rota pra dar pra testar sem Express nem banco: `deps` traz
// `liberados(userId)` e `gravar(userId, data)`. Devolve { status, corpo }.
export async function salvarAvatar(userId, corpo, deps) {
  const { config, mostrarAvatar } = corpo || {};
  const data = {};

  if (config !== undefined) {
    const liberados = new Set(await deps.liberados(userId));
    const r = validarConfig(config, liberados);
    if (r.erro) return { status: 400, corpo: { error: r.erro } };
    data.avatarMontado = r.config;
  }

  if (mostrarAvatar !== undefined) {
    if (typeof mostrarAvatar !== "boolean") return { status: 400, corpo: { error: "Preferência inválida." } };
    // Mesma trava da medalha no lugar da foto: ligar o avatar na bolinha sem
    // ter montado um deixaria a pessoa sem imagem nenhuma.
    if (mostrarAvatar && !data.avatarMontado && !configPublica(await deps.montagemAtual(userId))) {
      return { status: 400, corpo: { error: "Monte e salve seu avatar primeiro." } };
    }
    data.mostrarAvatar = mostrarAvatar;
  }

  if (!Object.keys(data).length) return { status: 400, corpo: { error: "Nada pra salvar." } };
  const salvo = await deps.gravar(userId, data);
  return {
    status: 200,
    corpo: { ok: true, avatar: configPublica(salvo.avatarMontado), mostrarAvatar: salvo.mostrarAvatar === true },
  };
}
