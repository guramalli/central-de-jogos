import { prisma } from "../db.js";
import { cacheOuBuscar, cacheApagar } from "../utils/cache.js";
import { RANKS } from "../utils/rank.js";
import { QUIZ_RANKS } from "../utils/quizRank.js";
import { ACROMANIA_RANKS } from "../utils/acromaniaRank.js";
import { nomesDeTitulosDesbloqueados, fonteDoTitulo, acertosPorTema, QUIZ_NIVEIS, QUIZ_NOMES } from "../game/titulosConfig.js";
import { ITENS, ITEM_POR_ID, NOMES_DOS_SLOTS, CORES_CABELO, CHAVE_DO_MES, avatarPadrao, corDoCabeloValida, pecaCabeNoSlot } from "./catalogo.js";

// ===== Quais peças do avatar uma pessoa já liberou =====
//
// Nada disso fica gravado: é recalculado das estatísticas que o site já
// guarda (títulos, patentes, sequência, pontos). Assim uma peça nova no
// catálogo já nasce liberada pra quem cumpre a regra, sem migração.
//
// CUSTO NO BANCO: só roda no editor, no "Bem-vindo de volta" do início, na
// coleção do perfil e ao salvar (nunca no hover do perfil), com cache de
// 60s. E só busca o que o catálogo PRECISA: se nenhuma peça depende de
// título do Stop, a StopStat nem é lida. No pior caso são 6 consultas
// pequenas em paralelo, todas por índice que começa em userId (dezenas de
// linhas por pessoa, no máximo). A CampeaoMensal (coroas, troféus e
// patentes exclusivas) é lida UMA vez e serve pra tudo: libera as peças e
// dá os meses de campeão de cada jogo (plaqueta do troféu, "como ganhei").
//
// O Mentira Sincera está desligado: não libera peça nenhuma e nem entra na
// soma de "todos os jogos".
//
// VISITANTE (conta sem cadastro) não libera nada, nem as iniciais: fica com
// o avatar padrão e não pode salvar — o convite é criar a conta.

export const TABELAS_DE_PATENTE = {
  stop: RANKS,
  quiz: QUIZ_RANKS,
  acromania: ACROMANIA_RANKS,
};

// Jogos cujos pontos NÃO contam na soma de "todos os jogos" (desligados).
const FORA_DO_TOTAL = new Set(["mentira"]);

const RESUMO_CACHE_SEGUNDOS = 60;
const chaveResumo = (userId) => `avatar-liberados:${userId}`;

export function patenteDoCatalogo(jogo, key) {
  return (TABELAS_DE_PATENTE[jogo] || []).find((r) => r.key === key) || null;
}

// Que dados o conjunto de peças exige — pra não consultar tabela à toa.
export function dadosNecessarios(itens = ITENS) {
  const p = {
    quiz: false, stop: false, campeao: false, sequencia: false,
    jogosMensais: new Set(), jogosVitalicios: new Set(), vitalicioTotal: false,
  };
  for (const { desbloqueio: d } of itens) {
    if (d.tipo === "titulo") {
      const fonte = d.tema ? { quiz: true } : fonteDoTitulo(d.nome || "");
      if (fonte.quiz) p.quiz = true;
      if (fonte.stop) p.stop = true;
      if (fonte.campeao) p.campeao = true;
    } else if (d.tipo === "campeao") {
      p.campeao = true;
    } else if (d.tipo === "patente") {
      p.jogosMensais.add(d.jogo);
      // A patente máxima é exclusiva do 1º do mês: só vale com o troféu.
      if (patenteDoCatalogo(d.jogo, d.patente)?.exclusiva) p.campeao = true;
    } else if (d.tipo === "sequencia") {
      p.sequencia = true;
    } else if (d.tipo === "pontos") {
      if (d.jogo === "total") p.vitalicioTotal = true;
      else p.jogosVitalicios.add(d.jogo);
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
    // Vitalício: com peça de "todos os jogos", lê todas as linhas da pessoa
    // (uma por jogo, menos as "por sala", que têm ":" e repetiriam pontos);
    // senão, só os jogos pedidos.
    precisa.vitalicioTotal || precisa.jogosVitalicios.size
      ? db.lifetimeScore.findMany({
        where: precisa.vitalicioTotal
          ? { userId, NOT: { gameKey: { contains: ":" } } }
          : { userId, gameKey: { in: [...precisa.jogosVitalicios] } },
        select: { gameKey: true, points: true },
      })
      : nada,
  ]);

  const contam = vitalicios.filter((l) => !FORA_DO_TOTAL.has(l.gameKey));
  const vitalicio = Object.fromEntries(contam.map((l) => [l.gameKey, l.points]));
  if (precisa.vitalicioTotal) vitalicio.total = contam.reduce((s, l) => s + (l.points || 0), 0);

  return {
    titulos: precisa.quiz || precisa.stop || precisa.campeao
      ? nomesDeTitulosDesbloqueados({ statsQuiz, statsStop, registrosCampeao: campeoes })
      : new Set(),
    acertosPorTema: acertosPorTema(statsQuiz),
    campeoes,
    campeonatos: campeonatosDe(campeoes),
    melhorMes: Object.fromEntries(mensais.map((m) => [m.gameKey, m._max?.points || 0])),
    vitalicio,
    streakRecorde: user?.streakRecorde || 0,
  };
}

// Meses em que a pessoa foi campeã, por jogo, do mais recente pro mais
// antigo: { stop: ["2026-09", "2026-07"], acromania: ["2026-08"] }.
export function campeonatosDe(campeoes = []) {
  const porJogo = {};
  for (const c of campeoes) (porJogo[c.gameKey] ||= []).push(c.monthKey);
  for (const meses of Object.values(porJogo)) meses.sort((a, b) => String(b).localeCompare(String(a)));
  return porJogo;
}

// A regra de UMA peça contra os dados já carregados. Pura: sem banco.
export function itemLiberado(item, dados) {
  const d = item?.desbloqueio;
  if (!d) return false;
  switch (d.tipo) {
    case "inicial":
      return true;
    case "titulo":
      return !!d.nome && dados.titulos.has(d.nome);
    case "campeao":
      return dados.campeoes.some((c) => c.gameKey === d.jogo);
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

// ===== Progresso até uma peça trancada =====
//
// Só pras regras MEDÍVEIS (um número que sobe até uma meta). Título
// lendário e troféu de campeão não têm barra: ou tem, ou não tem.
// Patente exclusiva também fica de fora — passar da marca não basta.
const INDICE_DO_NIVEL = { bronze: 0, prata: 1, ouro: 2 };
const NOME_DO_JOGO = { stop: "Stop", quiz: "Quiz", acromania: "Acromania" };

export function progressoDaPeca(item, dados) {
  const d = item.desbloqueio;
  if (d.tipo === "sequencia") {
    // Conta o RECORDE (é ele que libera), não a sequência atual.
    return { atual: dados.streakRecorde, meta: d.dias, unidade: "dias seguidos" };
  }
  if (d.tipo === "pontos") {
    return { atual: dados.vitalicio[d.jogo] || 0, meta: d.min, unidade: d.jogo === "total" ? "pontos somando todos os jogos" : `pontos no ${NOME_DO_JOGO[d.jogo] || d.jogo}` };
  }
  if (d.tipo === "patente") {
    const p = patenteDoCatalogo(d.jogo, d.patente);
    if (!p || p.exclusiva) return null;
    return { atual: dados.melhorMes[d.jogo] || 0, meta: p.min, unidade: `pontos num mês no ${NOME_DO_JOGO[d.jogo] || d.jogo}` };
  }
  if (d.tipo === "titulo" && d.tema) {
    const nivel = QUIZ_NIVEIS[INDICE_DO_NIVEL[d.nivel]];
    if (!nivel) return null;
    return { atual: dados.acertosPorTema[d.tema] || 0, meta: nivel.min, unidade: `acertos em ${QUIZ_NOMES[d.tema]} no Quiz` };
  }
  return null;
}

// A peça trancada mais perto de sair (maior fração atual/meta). Empate: a
// de meta menor (menos trabalho absoluto). null se nada for medível.
export function proximaPeca(dados, liberados, itens = ITENS) {
  const jaTem = new Set(liberados);
  let melhor = null;
  for (const item of itens) {
    if (jaTem.has(item.id)) continue;
    const p = progressoDaPeca(item, dados);
    if (!p || p.meta <= 0) continue;
    const fracao = Math.min(1, p.atual / p.meta);
    if (!melhor || fracao > melhor.fracao || (fracao === melhor.fracao && p.meta < melhor.meta)) {
      melhor = { id: item.id, slot: item.slot, nome: item.nome, dica: item.dica, ...p, fracao };
    }
  }
  if (!melhor) return null;
  const { fracao, ...resto } = melhor;
  return { ...resto, atual: Math.min(resto.atual, resto.meta), faltam: Math.max(0, resto.meta - resto.atual) };
}

// Liberados + próxima peça + meses de campeão por jogo (cache de 60s).
// `convidado`: visitante não libera nada (e nem consulta o banco).
export function resumoDoAvatar(userId, { convidado = false } = {}) {
  if (convidado) return Promise.resolve({ liberados: [], proxima: null, campeonatos: {} });
  return cacheOuBuscar(chaveResumo(userId), RESUMO_CACHE_SEGUNDOS, async () => {
    const dados = await carregarDados(userId, dadosNecessarios());
    const liberados = liberadosPelosDados(dados);
    return { liberados, proxima: proximaPeca(dados, liberados), campeonatos: dados.campeonatos };
  });
}

// Só a lista de ids liberados.
export async function itensLiberados(userId, opcoes) {
  return (await resumoDoAvatar(userId, opcoes)).liberados;
}

export function esquecerLiberados(userId) {
  cacheApagar(chaveResumo(userId));
}

// ===== Validação da montagem =====
//
// Recebe o que o navegador mandou ({ slot: idDaPeça | null }) e o conjunto de
// ids liberados. Confere, pra cada slot: se o slot existe, se a peça existe,
// se cabe NESSE slot (a mão esquerda aceita as peças da mão) e se está
// liberada. `pele` é obrigatória. Chaves extras:
//   corCabelo          — paleta CORES_CABELO, vale pra cabelo pintável;
//   mesTrofeu          — mês escrito na plaqueta do troféu da mão direita;
//   mesTrofeuEsquerda  — idem, mão esquerda.
// O mês precisa ser um em que a pessoa foi campeã do jogo DAQUELE troféu
// (`campeonatos`, de campeonatosDe); sem mês, vale o mais recente. Mão sem
// troféu não grava mês. Devolve a montagem limpa (sem slots vazios) ou a
// mensagem de erro.
export function validarConfig(config, liberados, campeonatos = {}) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return { erro: "Montagem inválida." };
  }
  const limpa = {};
  // Cor do cabelo: não é uma peça (não tranca nada), só uma chave da
  // paleta. Cor fora da paleta é erro; "original", ou cabelo que não se
  // pinta (moicano, chamas, sem cabelo), simplesmente não é gravado.
  const { corCabelo, mesTrofeu, mesTrofeuEsquerda, ...pecas } = config;
  if (corCabelo !== undefined && corCabelo !== null && (typeof corCabelo !== "string" || !Object.hasOwn(CORES_CABELO, corCabelo))) {
    return { erro: "Cor de cabelo inválida." };
  }
  for (const [slot, id] of Object.entries(pecas)) {
    if (!NOMES_DOS_SLOTS.includes(slot)) return { erro: `Parte desconhecida: ${slot}.` };
    if (id === null || id === undefined || id === "") continue; // slot vazio
    if (typeof id !== "string") return { erro: "Montagem inválida." };
    const item = ITEM_POR_ID.get(id);
    if (!item) return { erro: "Essa peça não existe." };
    if (!pecaCabeNoSlot(item, slot)) return { erro: `"${item.nome}" não vai nessa parte.` };
    if (!liberados.has(id)) return { erro: `"${item.nome}" ainda está trancado. ${item.dica || ""}`.trim() };
    limpa[slot] = id;
  }
  if (!limpa.pele) return { erro: "Escolha a pele do seu avatar." };
  const cor = corDoCabeloValida(limpa.cabelo, corCabelo);
  if (cor) limpa.corCabelo = cor;

  const pedidos = { mesTrofeu, mesTrofeuEsquerda };
  for (const [slot, chave] of Object.entries(CHAVE_DO_MES)) {
    const item = ITEM_POR_ID.get(limpa[slot]);
    if (!item?.placa) continue; // sem troféu nessa mão: nada de mês
    const meses = campeonatos[item.desbloqueio.jogo] || [];
    const pedido = pedidos[chave];
    if (pedido === undefined || pedido === null || pedido === "") {
      if (meses[0]) limpa[chave] = meses[0];
    } else if (typeof pedido === "string" && meses.includes(pedido)) {
      limpa[chave] = pedido;
    } else {
      return { erro: `Mês do troféu inválido: escolha um mês em que você foi campeão do ${item.nome.replace(/^Troféu do /, "")}.` };
    }
  }
  return { config: limpa };
}

// Montagem SALVA, limpa pra mostrar aos outros: descarta peças que saíram
// do catálogo ou mudaram de slot (o troféu genérico antigo, por exemplo).
// Não reconfere o desbloqueio nem os meses do troféu — isso foi feito ao
// salvar, e peça ganha não se perde. Sem pele válida = null.
export function configPublica(salvo) {
  if (!salvo || typeof salvo !== "object" || Array.isArray(salvo)) return null;
  const limpa = {};
  for (const slot of NOMES_DOS_SLOTS) {
    const item = ITEM_POR_ID.get(salvo[slot]);
    if (pecaCabeNoSlot(item, slot)) limpa[slot] = item.id;
  }
  // A cor só vai junto se ainda vale pro cabelo gravado.
  const cor = corDoCabeloValida(limpa.cabelo, salvo.corCabelo);
  if (cor) limpa.corCabelo = cor;
  // O mês da plaqueta só vai junto se a mão ainda segura um troféu.
  for (const [slot, chave] of Object.entries(CHAVE_DO_MES)) {
    if (ITEM_POR_ID.get(limpa[slot])?.placa && /^\d{4}-\d{2}$/.test(salvo[chave] || "")) limpa[chave] = salvo[chave];
  }
  return limpa.pele ? limpa : null;
}

// O avatar que os outros veem: o montado, ou o padrão (sorteado do id) de
// quem nunca montou — inclusive visitante.
export function avatarDoUsuario(user) {
  return configPublica(user?.avatarMontado) || avatarPadrao(user?.id || "");
}

// Foto do avatar pro Hall da Fama, congelada no fechamento do mês
// (scripts/fecharMes.js): o que o campeão vestia naquele mês, mesmo que ele
// troque tudo depois.
export function avatarParaCongelar(user) {
  return avatarDoUsuario(user);
}

// ===== Salvar (PUT /api/avatar) =====
//
// Separado da rota pra dar pra testar sem Express nem banco: `deps` traz
// `liberados(userId)`, `campeonatos(userId)` (opcional: meses de campeão
// por jogo, pro mês do troféu) e `gravar(userId, data)`. Devolve
// { status, corpo }.
//
// PRIMEIRO avatar (`jaMontou` false: nada montado antes deste PUT): liga
// sozinho o avatar nas bolinhas. Quem tem foto começava com "Foto" e montava
// o boneco sem nunca vê-lo no placar das salas. Se o mesmo pedido manda
// mostrarAvatar: false, vale o pedido; e o editor continua deixando voltar
// pra foto. `corpo.avatarLigado` avisa a tela que isso aconteceu.
export async function salvarAvatar(userId, corpo, deps, { convidado = false, jaMontou = true } = {}) {
  if (convidado) return { status: 403, corpo: { error: "Crie sua conta para desbloquear peças e salvar seu avatar." } };
  const { config, mostrarAvatar } = corpo || {};
  const data = {};

  if (config !== undefined) {
    const liberados = new Set(await deps.liberados(userId));
    const campeonatos = (await deps.campeonatos?.(userId)) || {};
    const r = validarConfig(config, liberados, campeonatos);
    if (r.erro) return { status: 400, corpo: { error: r.erro } };
    data.avatarMontado = r.config;
    if (!jaMontou && mostrarAvatar === undefined) data.mostrarAvatar = true;
  }

  if (mostrarAvatar !== undefined) {
    if (typeof mostrarAvatar !== "boolean") return { status: 400, corpo: { error: "Preferência inválida." } };
    // Sem montagem salva vale o avatar padrão, então ligar não deixa
    // ninguém sem imagem.
    data.mostrarAvatar = mostrarAvatar;
  }

  if (!Object.keys(data).length) return { status: 400, corpo: { error: "Nada pra salvar." } };
  const salvo = await deps.gravar(userId, data);
  return {
    status: 200,
    corpo: { ok: true, avatarLigado: !jaMontou && data.mostrarAvatar === true && mostrarAvatar === undefined, avatar: avatarDoUsuario({ id: userId, avatarMontado: salvo.avatarMontado }), avatarProprio: !!configPublica(salvo.avatarMontado), mostrarAvatar: salvo.mostrarAvatar === true },
  };
}
