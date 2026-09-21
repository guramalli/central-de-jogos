import { prisma } from "../db.js";
import { THEMES, NOME_DO_TEMA } from "../game/quizRoomConfigs.js";

// DUELO — quiz por turnos (assíncrono), 1x1. Regras aprovadas:
//   - 6 temas sorteados na criação viram a roleta;
//   - múltipla escolha (4 alternativas), 20s por pergunta;
//   - acertar enche 1/3 do medidor; errar ou estourar o tempo passa a vez;
//   - medidor cheio => pergunta da MEDALHA (o jogador escolhe o tema);
//   - até 3 perguntas "normais" por turno (a da medalha não conta);
//   - vence quem fizer as 6 medalhas; em 25 turnos de cada, mais medalhas
//     (desempate: mais acertos; persistindo, empate);
//   - 24h por turno — passou, o outro vence;
//   - até 10 duelos abertos por pessoa.
// ISOLADO do ranking mensal e do Pix nesta etapa.
//
// Segurança: a resposta certa (indiceCerto) nunca sai do servidor antes da
// jogada, e o tempo é contado AQUI (perguntaEm), não no celular.

export const MEDALHAS_PRA_VENCER = 6;
export const PERGUNTAS_POR_TURNO = 3;
export const SEGUNDOS_POR_PERGUNTA = 20;
const TOLERANCIA_REDE_MS = 3000; // latência do celular
const TURNOS_MAXIMOS = 25;
const PRAZO_TURNO_MS = 24 * 60 * 60 * 1000;
const PRAZO_CONVITE_MS = 3 * 24 * 60 * 60 * 1000;
const MAX_DUELOS_ABERTOS = 10;
const DIFICULDADES = ["facil", "medio"]; // só o nível Padrão
const MAX_EVENTOS = 30;

export class ErroDuelo extends Error {
  constructor(msg, status = 400) { super(msg); this.status = status; }
}

// ---------------------------------------------------------------------------
// Trava por duelo: dois toques rápidos (ou o bot e a varredura juntos) não
// podem mexer no mesmo duelo ao mesmo tempo. Um servidor só (Render), então
// uma fila em memória basta.
const travas = new Map();
async function comTrava(id, fn) {
  const anterior = travas.get(id) || Promise.resolve();
  let liberar;
  const atual = new Promise((r) => (liberar = r));
  const cadeia = anterior.then(() => atual);
  travas.set(id, cadeia);
  await anterior;
  try {
    return await fn();
  } finally {
    liberar();
    if (travas.get(id) === cadeia) travas.delete(id);
  }
}

// ---------------------------------------------------------------------------
// Perguntas e alternativas.
const normalizar = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const ehNumero = (t) => /^\d[\d.,\s]*$/.test(String(t).trim());
function sorteio(lista) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Cache por tema (30 min): ids das perguntas do nível Padrão e respostas
// do tema inteiro (fonte das alternativas erradas).
const cacheTema = new Map();
const VALIDADE_CACHE_MS = 30 * 60 * 1000;
async function dadosDoTema(tema) {
  const c = cacheTema.get(tema);
  if (c && Date.now() - c.em < VALIDADE_CACHE_MS) return c;
  const [perguntas, respostas] = await Promise.all([
    prisma.quizQuestion.findMany({ where: { themeKey: tema, status: "approved", difficulty: { in: DIFICULDADES } }, select: { id: true } }),
    prisma.quizQuestion.findMany({ where: { themeKey: tema, status: "approved" }, select: { answer: true } }),
  ]);
  const vistas = new Set();
  const unicas = [];
  for (const { answer } of respostas) {
    const n = normalizar(answer);
    if (!n || vistas.has(n)) continue;
    vistas.add(n);
    unicas.push(answer.trim());
  }
  const novo = { em: Date.now(), ids: perguntas.map((p) => p.id), respostas: unicas };
  cacheTema.set(tema, novo);
  return novo;
}

// 3 alternativas erradas pra uma resposta. Mesmo crivo da curadoria: nada
// igual à certa, nem sinônimo "contido" nela ("Paris" x "Paris Saint-
// Germain"). Prefere o mesmo FORMATO (ano com ano) e tamanho parecido.
export function alternativasErradas(certa, respostasDoTema, quantas = 3) {
  const nc = normalizar(certa);
  const numero = ehNumero(certa);
  const candidatas = respostasDoTema.filter((r) => {
    const n = normalizar(r);
    if (!n || n === nc) return false;
    if (n.length >= 3 && nc.length >= 3 && (n.includes(nc) || nc.includes(n))) return false;
    return true;
  });
  const mesmoFormato = candidatas.filter((r) => ehNumero(r) === numero);
  const parecidas = mesmoFormato.filter((r) => {
    const a = r.length, b = String(certa).length;
    return Math.min(a, b) / Math.max(a, b) >= 0.4;
  });
  const escolhidas = [];
  const usadas = new Set();
  for (const grupo of [parecidas, mesmoFormato, candidatas]) {
    for (const r of sorteio(grupo)) {
      if (escolhidas.length >= quantas) break;
      const n = normalizar(r);
      // também não pode haver duas erradas "contidas" uma na outra
      if (usadas.has(n) || [...usadas].some((u) => u.length >= 3 && n.length >= 3 && (u.includes(n) || n.includes(u)))) continue;
      usadas.add(n);
      escolhidas.push(r);
    }
  }
  return escolhidas;
}

async function sortearPergunta(tema, usadas) {
  const { ids, respostas } = await dadosDoTema(tema);
  const livres = ids.filter((id) => !usadas.includes(id));
  const lista = livres.length ? livres : ids; // tema esgotado no duelo: repete
  for (const id of sorteio(lista).slice(0, 8)) {
    const q = await prisma.quizQuestion.findUnique({ where: { id }, select: { id: true, question: true, answer: true, status: true } });
    if (!q || q.status !== "approved") continue;
    const erradas = alternativasErradas(q.answer, respostas);
    if (erradas.length < 3) continue; // tema pobre de respostas: tenta outra
    const alternativas = sorteio([q.answer.trim(), ...erradas]);
    return { pergunta: q, alternativas, indiceCerto: alternativas.findIndex((a) => a === q.answer.trim()) };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Estado: helpers de "lado" (A ou B).
const lado = (d, userId) => (d.jogadorAId === userId ? "A" : d.jogadorBId === userId ? "B" : null);
const outro = (l) => (l === "A" ? "B" : "A");
const idDoLado = (d, l) => (l === "A" ? d.jogadorAId : d.jogadorBId);
const temasValidos = () => THEMES.map((t) => t.key);

function comEvento(d, evento) {
  const lista = Array.isArray(d.eventos) ? d.eventos : [];
  return [...lista, { ...evento, em: new Date().toISOString() }].slice(-MAX_EVENTOS);
}

async function contarAbertos(userId) {
  return prisma.duelo.count({ where: { status: { in: ["andamento", "aguardando"] }, OR: [{ jogadorAId: userId }, { jogadorBId: userId }] } });
}

// ---------------------------------------------------------------------------
// Criar.
export async function criarDuelo(userId, { adversarioId = null, bot = false, link = false } = {}) {
  if (await contarAbertos(userId) >= MAX_DUELOS_ABERTOS) throw new ErroDuelo(`Você já tem ${MAX_DUELOS_ABERTOS} duelos abertos. Termine algum antes de começar outro.`);
  let jogadorBId = null;
  if (bot) {
    jogadorBId = (await contaDoBot()).id;
  } else if (!link) {
    if (!adversarioId || adversarioId === userId) throw new ErroDuelo("Escolha um adversário.");
    const amizade = await prisma.friendship.findFirst({
      where: { status: "accepted", OR: [{ userAId: userId, userBId: adversarioId }, { userAId: adversarioId, userBId: userId }] },
    });
    if (!amizade) throw new ErroDuelo("Só dá pra desafiar quem é seu amigo — ou use o link de convite.");
    if (await contarAbertos(adversarioId) >= MAX_DUELOS_ABERTOS) throw new ErroDuelo("Esse amigo já está com duelos demais abertos.");
    jogadorBId = adversarioId;
  }
  // 6 temas com perguntas suficientes (tema vazio não entra na roleta).
  const temas = [];
  for (const t of sorteio(temasValidos())) {
    if (temas.length >= 6) break;
    const { ids, respostas } = await dadosDoTema(t);
    if (ids.length >= 10 && respostas.length >= 8) temas.push(t);
  }
  if (temas.length < 6) throw new ErroDuelo("Ainda não há perguntas suficientes pra montar um duelo.", 503);
  // Quem cria já joga o primeiro turno (como no Perguntados).
  return prisma.duelo.create({
    data: { jogadorAId: userId, jogadorBId, contraBot: !!bot, temas, status: "andamento", vezDeId: userId, prazoEm: new Date(Date.now() + PRAZO_TURNO_MS) },
  });
}

// Convite por link: quem abre entra como adversário.
export async function entrarNoDuelo(id, userId) {
  return comTrava(id, async () => {
    const d = await prisma.duelo.findUnique({ where: { id } });
    if (!d) throw new ErroDuelo("Duelo não encontrado.", 404);
    if (d.jogadorAId === userId || d.jogadorBId === userId) return d; // já é deste duelo
    if (d.jogadorBId || !["andamento", "aguardando"].includes(d.status)) throw new ErroDuelo("Esse convite já foi aceito por outra pessoa.", 409);
    if (await contarAbertos(userId) >= MAX_DUELOS_ABERTOS) throw new ErroDuelo(`Você já tem ${MAX_DUELOS_ABERTOS} duelos abertos.`);
    // Se o criador já terminou o primeiro turno, a vez é de quem entrou.
    const vezDoNovo = d.status === "aguardando";
    return prisma.duelo.update({
      where: { id },
      data: {
        jogadorBId: userId,
        status: "andamento",
        ...(vezDoNovo ? { vezDeId: userId, prazoEm: new Date(Date.now() + PRAZO_TURNO_MS), perguntasNoTurno: 0 } : {}),
      },
    });
  });
}

// ---------------------------------------------------------------------------
// Jogar.
function conferirVez(d, userId) {
  if (!d) throw new ErroDuelo("Duelo não encontrado.", 404);
  if (!lado(d, userId)) throw new ErroDuelo("Você não está neste duelo.", 403);
  if (d.status !== "andamento") throw new ErroDuelo("Este duelo não está em andamento.", 409);
  if (d.vezDeId !== userId) throw new ErroDuelo("Não é a sua vez.", 409);
}

async function abrirPergunta(d, userId, tema, tipo) {
  const sorteada = await sortearPergunta(tema, d.usadas);
  if (!sorteada) throw new ErroDuelo("Não achei pergunta pra esse tema agora. Tente de novo.", 503);
  return prisma.duelo.update({
    where: { id: d.id },
    data: {
      perguntaId: sorteada.pergunta.id,
      perguntaTema: tema,
      perguntaTipo: tipo,
      alternativas: sorteada.alternativas,
      indiceCerto: sorteada.indiceCerto,
      perguntaEm: new Date(),
      usadas: [...d.usadas, sorteada.pergunta.id].slice(-400),
    },
  });
}

// Gira a roleta (pergunta normal). Se já houver pergunta aberta, devolve ela
// (ex.: recarregou a página) — sem sortear outra.
export async function girar(id, userId) {
  return comTrava(id, async () => {
    let d = await prisma.duelo.findUnique({ where: { id } });
    conferirVez(d, userId);
    if (d.perguntaId) {
      if (!perguntaVencida(d)) return d;
      d = await resolver(d, userId, -1); // venceu o tempo com ela aberta
      if (d.vezDeId !== userId || d.status !== "andamento") return d;
    }
    const l = lado(d, userId);
    if (d[`medidor${l}`] >= 3) throw new ErroDuelo("Seu medidor está cheio: escolha o tema da medalha.");
    const tema = d.temas[Math.floor(Math.random() * d.temas.length)];
    return abrirPergunta(d, userId, tema, "normal");
  });
}

// Medidor cheio: a pergunta da medalha, do tema que o jogador escolher.
export async function escolherMedalha(id, userId, tema) {
  return comTrava(id, async () => {
    const d = await prisma.duelo.findUnique({ where: { id } });
    conferirVez(d, userId);
    if (d.perguntaId && !perguntaVencida(d)) return d;
    const l = lado(d, userId);
    if (d[`medidor${l}`] < 3) throw new ErroDuelo("Encha o medidor antes de ir pela medalha.");
    if (!d.temas.includes(tema)) throw new ErroDuelo("Esse tema não está neste duelo.");
    if (d[`medalhas${l}`].includes(tema)) throw new ErroDuelo("Você já tem essa medalha.");
    return abrirPergunta(d, userId, tema, "medalha");
  });
}

const perguntaVencida = (d) => d.perguntaEm && Date.now() - new Date(d.perguntaEm).getTime() > SEGUNDOS_POR_PERGUNTA * 1000 + TOLERANCIA_REDE_MS;

export async function responder(id, userId, indice) {
  return comTrava(id, async () => {
    const d = await prisma.duelo.findUnique({ where: { id } });
    conferirVez(d, userId);
    if (!d.perguntaId) throw new ErroDuelo("Não há pergunta aberta.");
    const correta = !perguntaVencida(d) && Number(indice) === d.indiceCerto;
    const resultado = { correta, indiceCerto: d.indiceCerto, respostaCerta: d.alternativas[d.indiceCerto], tempoEsgotado: perguntaVencida(d), tipo: d.perguntaTipo, tema: d.perguntaTema };
    const depois = await resolver(d, userId, correta ? d.indiceCerto : Number(indice), correta);
    return { ...resultado, ganhouMedalha: correta && d.perguntaTipo === "medalha", duelo: depois };
  });
}

// Aplica a resposta: pontos, medidor, medalha, fim do turno/duelo.
async function resolver(d, userId, indice, correta = false) {
  const l = lado(d, userId);
  const o = outro(l);
  const dados = {
    perguntaId: null, perguntaTema: null, perguntaTipo: null, alternativas: [], indiceCerto: null, perguntaEm: null,
  };
  let medalhas = [...d[`medalhas${l}`]];
  let medidor = d[`medidor${l}`];
  let perguntasNoTurno = d.perguntasNoTurno;
  const tipo = d.perguntaTipo;
  const tema = d.perguntaTema;

  if (tipo === "normal") perguntasNoTurno += 1;
  if (correta) {
    dados[`acertos${l}`] = d[`acertos${l}`] + 1;
    if (tipo === "medalha") {
      if (!medalhas.includes(tema)) medalhas.push(tema);
      medidor = 0;
    } else {
      medidor = Math.min(3, medidor + 1);
    }
  } else if (tipo === "medalha") {
    medidor = 0; // errou a da medalha: medidor recomeça
  }
  dados[`medalhas${l}`] = medalhas;
  dados[`medidor${l}`] = medidor;
  dados.perguntasNoTurno = perguntasNoTurno;
  dados.eventos = comEvento(d, { quem: userId, tipo: correta ? (tipo === "medalha" ? "medalha" : "acerto") : "erro", tema, perguntaId: d.perguntaId, tempo: indice === -1 });

  // Venceu nas medalhas.
  if (medalhas.length >= MEDALHAS_PRA_VENCER) {
    return prisma.duelo.update({ where: { id: d.id }, data: { ...dados, [`turnos${l}`]: d[`turnos${l}`] + 1, status: "encerrado", vencedorId: userId, motivoFim: "medalhas", vezDeId: null, prazoEm: null, encerradoEm: new Date() } });
  }

  // O turno continua? Acertou e (tem medalha pra buscar OU ainda cabe pergunta).
  const continua = correta && (medidor >= 3 || perguntasNoTurno < PERGUNTAS_POR_TURNO);
  if (continua) return prisma.duelo.update({ where: { id: d.id }, data: dados });

  // Fim do turno: passa a vez.
  dados[`turnos${l}`] = d[`turnos${l}`] + 1;
  dados.perguntasNoTurno = 0;
  const turnosL = dados[`turnos${l}`];
  const turnosO = d[`turnos${o}`];
  if (turnosL >= TURNOS_MAXIMOS && turnosO >= TURNOS_MAXIMOS) {
    const mL = medalhas.length, mO = d[`medalhas${o}`].length;
    const aL = dados[`acertos${l}`] ?? d[`acertos${l}`], aO = d[`acertos${o}`];
    const vencedor = mL !== mO ? (mL > mO ? userId : idDoLado(d, o)) : aL !== aO ? (aL > aO ? userId : idDoLado(d, o)) : null;
    return prisma.duelo.update({ where: { id: d.id }, data: { ...dados, status: "encerrado", vencedorId: vencedor, motivoFim: vencedor ? "turnos" : "empate", vezDeId: null, prazoEm: null, encerradoEm: new Date() } });
  }
  const idOutro = idDoLado(d, o);
  if (!idOutro) {
    // Convite por link ainda sem adversário: espera alguém entrar.
    return prisma.duelo.update({ where: { id: d.id }, data: { ...dados, status: "aguardando", vezDeId: null, prazoEm: new Date(Date.now() + PRAZO_CONVITE_MS) } });
  }
  const atualizado = await prisma.duelo.update({ where: { id: d.id }, data: { ...dados, vezDeId: idOutro, prazoEm: new Date(Date.now() + PRAZO_TURNO_MS) } });
  if (d.contraBot && idOutro === botId) agendarBot(d.id);
  return atualizado;
}

export async function desistir(id, userId) {
  return comTrava(id, async () => {
    const d = await prisma.duelo.findUnique({ where: { id } });
    if (!d || !lado(d, userId)) throw new ErroDuelo("Duelo não encontrado.", 404);
    if (!["andamento", "aguardando"].includes(d.status)) throw new ErroDuelo("Este duelo já terminou.", 409);
    const adversario = idDoLado(d, outro(lado(d, userId)));
    return prisma.duelo.update({
      where: { id },
      data: adversario
        ? { status: "encerrado", vencedorId: adversario, motivoFim: "desistencia", vezDeId: null, prazoEm: null, perguntaId: null, encerradoEm: new Date() }
        : { status: "cancelado", vezDeId: null, prazoEm: null, perguntaId: null, encerradoEm: new Date() },
    });
  });
}

// Quem foi desafiado pode recusar antes de jogar o primeiro turno.
export async function recusar(id, userId) {
  return comTrava(id, async () => {
    const d = await prisma.duelo.findUnique({ where: { id } });
    if (!d || d.jogadorBId !== userId) throw new ErroDuelo("Duelo não encontrado.", 404);
    if (d.status !== "andamento" || d.turnosB > 0 || d.perguntaId) throw new ErroDuelo("Esse duelo já começou — dá pra desistir, mas não recusar.", 409);
    return prisma.duelo.update({ where: { id }, data: { status: "recusado", vezDeId: null, prazoEm: null, encerradoEm: new Date() } });
  });
}

// ---------------------------------------------------------------------------
// O que cada jogador pode ver (a resposta certa fica de fora).
export async function estadoPara(d, userId) {
  const l = lado(d, userId);
  const o = outro(l);
  const [a, b] = await Promise.all([
    prisma.user.findUnique({ where: { id: d.jogadorAId }, select: { id: true, nickname: true } }),
    d.jogadorBId ? prisma.user.findUnique({ where: { id: d.jogadorBId }, select: { id: true, nickname: true } }) : null,
  ]);
  const pessoa = (x, lx) => (x ? { id: x.id, nickname: x.nickname, medalhas: d[`medalhas${lx}`], medidor: d[`medidor${lx}`], acertos: d[`acertos${lx}`], turnos: d[`turnos${lx}`] } : null);
  const minhaVez = d.status === "andamento" && d.vezDeId === userId;
  let pergunta = null;
  if (minhaVez && d.perguntaId) {
    const q = await prisma.quizQuestion.findUnique({ where: { id: d.perguntaId }, select: { question: true } });
    const restante = Math.max(0, SEGUNDOS_POR_PERGUNTA - Math.floor((Date.now() - new Date(d.perguntaEm).getTime()) / 1000));
    pergunta = { tema: d.perguntaTema, nomeTema: NOME_DO_TEMA[d.perguntaTema] || d.perguntaTema, tipo: d.perguntaTipo, texto: q?.question || "", alternativas: d.alternativas, segundos: SEGUNDOS_POR_PERGUNTA, restante };
  }
  const eu = pessoa(l === "A" ? a : b, l);
  return {
    id: d.id,
    status: d.status,
    contraBot: d.contraBot,
    temas: d.temas.map((t) => ({ key: t, nome: NOME_DO_TEMA[t] || t })),
    eu,
    adversario: pessoa(o === "A" ? a : b, o),
    minhaVez,
    vezDeId: d.vezDeId,
    prazoEm: d.prazoEm,
    perguntasNoTurno: d.perguntasNoTurno,
    perguntasPorTurno: PERGUNTAS_POR_TURNO,
    medalhasPraVencer: MEDALHAS_PRA_VENCER,
    precisaEscolherMedalha: minhaVez && !d.perguntaId && eu?.medidor >= 3,
    pergunta,
    eventos: d.eventos,
    vencedorId: d.vencedorId,
    motivoFim: d.motivoFim,
    criadoEm: d.criadoEm,
    atualizadoEm: d.atualizadoEm,
  };
}

export async function listarDuelos(userId) {
  const duelos = await prisma.duelo.findMany({
    where: { OR: [{ jogadorAId: userId }, { jogadorBId: userId }], NOT: { status: "cancelado" } },
    orderBy: { atualizadoEm: "desc" },
    take: 40,
    include: { jogadorA: { select: { id: true, nickname: true } }, jogadorB: { select: { id: true, nickname: true } } },
  });
  return duelos.map((d) => {
    const l = lado(d, userId);
    const adv = l === "A" ? d.jogadorB : d.jogadorA;
    return {
      id: d.id, status: d.status, contraBot: d.contraBot,
      adversario: adv ? { id: adv.id, nickname: adv.nickname } : null,
      minhaVez: d.status === "andamento" && d.vezDeId === userId,
      minhasMedalhas: d[`medalhas${l}`].length,
      medalhasDele: d[`medalhas${outro(l)}`].length,
      prazoEm: d.prazoEm, vencedorId: d.vencedorId, motivoFim: d.motivoFim, atualizadoEm: d.atualizadoEm,
    };
  });
}

export async function estatisticas(userId) {
  const base = { status: "encerrado", OR: [{ jogadorAId: userId }, { jogadorBId: userId }] };
  const [vitorias, empates, total] = await Promise.all([
    prisma.duelo.count({ where: { status: "encerrado", vencedorId: userId } }),
    prisma.duelo.count({ where: { ...base, vencedorId: null } }),
    prisma.duelo.count({ where: base }),
  ]);
  return { vitorias, empates, derrotas: total - vitorias - empates, total };
}

// ---------------------------------------------------------------------------
// BOT ("Robô Duelista"): pra jogar na hora. Acerta ~60% e responde uns
// minutos depois — parece um adversário de verdade.
let botId = null;
async function contaDoBot() {
  if (botId) return { id: botId };
  const conta = await prisma.user.upsert({
    where: { email: "duelobot@bots.educacaogamer.local" },
    update: { nickname: "Robô Duelista", isGuest: true, ocultoNoRanking: true, banned: false },
    create: { nickname: "Robô Duelista", email: "duelobot@bots.educacaogamer.local", isGuest: true, ocultoNoRanking: true },
  });
  botId = conta.id;
  return conta;
}
export const ehBot = (userId) => !!botId && userId === botId;

const agendados = new Set();
export function agendarBot(id, atrasoMs = 30000 + Math.random() * 90000) {
  if (agendados.has(id)) return;
  agendados.add(id);
  setTimeout(() => {
    agendados.delete(id);
    jogarTurnoDoBot(id).catch((err) => console.error("Duelo: bot falhou no turno:", err.message));
  }, atrasoMs);
}

export async function jogarTurnoDoBot(id) {
  await contaDoBot();
  for (let passo = 0; passo < 12; passo++) {
    const d = await prisma.duelo.findUnique({ where: { id } });
    if (!d || d.status !== "andamento" || d.vezDeId !== botId) return;
    const l = lado(d, botId);
    let aberto;
    if (d.perguntaId && !perguntaVencida(d)) aberto = d;
    else if (d[`medidor${l}`] >= 3) {
      const faltam = d.temas.filter((t) => !d[`medalhas${l}`].includes(t));
      aberto = await escolherMedalha(id, botId, faltam[Math.floor(Math.random() * faltam.length)]);
    } else aberto = await girar(id, botId);
    if (!aberto.perguntaId) continue;
    const acerta = Math.random() < (aberto.perguntaTipo === "medalha" ? 0.55 : 0.6);
    const errado = [0, 1, 2, 3].filter((i) => i !== aberto.indiceCerto);
    await responder(id, botId, acerta ? aberto.indiceCerto : errado[Math.floor(Math.random() * errado.length)]);
  }
}

// ---------------------------------------------------------------------------
// VARREDURA (a cada minuto): prazos vencidos, perguntas abandonadas e turnos
// do bot que ficaram pra trás (ex.: o servidor reiniciou no meio).
export async function varrer() {
  const agora = new Date();
  // Turno com prazo vencido: o outro vence.
  const vencidos = await prisma.duelo.findMany({ where: { status: "andamento", prazoEm: { lt: agora } }, take: 50 });
  for (const d of vencidos) {
    await comTrava(d.id, async () => {
      const atual = await prisma.duelo.findUnique({ where: { id: d.id } });
      if (!atual || atual.status !== "andamento" || !atual.prazoEm || atual.prazoEm > new Date()) return;
      const perdedor = atual.vezDeId;
      const vencedor = perdedor === atual.jogadorAId ? atual.jogadorBId : atual.jogadorAId;
      await prisma.duelo.update({ where: { id: d.id }, data: { status: vencedor ? "encerrado" : "cancelado", vencedorId: vencedor, motivoFim: "prazo", vezDeId: null, prazoEm: null, perguntaId: null, encerradoEm: new Date() } });
    });
  }
  // Convite por link que ninguém aceitou.
  await prisma.duelo.updateMany({ where: { status: "aguardando", prazoEm: { lt: agora } }, data: { status: "cancelado", encerradoEm: agora } });
  // Pergunta aberta e abandonada (fechou o app no meio): conta como erro.
  const abandonadas = await prisma.duelo.findMany({ where: { status: "andamento", perguntaId: { not: null }, perguntaEm: { lt: new Date(Date.now() - 60 * 1000) } }, take: 50 });
  for (const d of abandonadas) {
    await comTrava(d.id, async () => {
      const atual = await prisma.duelo.findUnique({ where: { id: d.id } });
      if (atual?.perguntaId && perguntaVencida(atual)) await resolver(atual, atual.vezDeId, -1);
    });
  }
  // Vez do bot parada (reinício do servidor apagou o agendamento).
  if (botId) {
    const doBot = await prisma.duelo.findMany({ where: { status: "andamento", vezDeId: botId, atualizadoEm: { lt: new Date(Date.now() - 3 * 60 * 1000) } }, select: { id: true }, take: 20 });
    for (const { id } of doBot) agendarBot(id, 1000);
  }
}

export function iniciarVarredura() {
  contaDoBot().catch(() => {});
  setInterval(() => {
    varrer().catch((err) => console.error("Duelo: varredura falhou:", err.message));
  }, 60 * 1000);
}
