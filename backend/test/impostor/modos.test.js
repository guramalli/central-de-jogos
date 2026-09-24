import { test, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { ImpostorRoom, FASES, CONFIG } from "../../src/impostor/ImpostorRoom.js";
import {
  validarDica, validarFrase, validarResposta, validarTextoDaVez, LIMITES, MODOS,
} from "../../src/impostor/regras.js";
import { temPalavrao } from "../../src/impostor/filtroPalavroes.js";
import {
  SITUACOES, PERGUNTAS, HISTORIAS, RESPOSTAS_POR_TIPO, DICAS_GENERICAS_SITUACAO, FRASES_GENERICAS,
  sortearConteudo, opcoesDoChute,
} from "../../src/impostor/conteudoModos.js";
import { temaParaGravar } from "../../src/impostor/socketImpostor.js";

// Modos Situação, Pergunta e História (o modo Palavra está em sala.test.js).
// Relógio falso, como em sala.test.js.

beforeEach(() => mock.timers.enable({ apis: ["setTimeout", "setInterval", "Date"] }));
afterEach(() => mock.timers.reset());

const SITUACAO = "Na fila do SUS";
const HISTORIA = "Uma viagem à praia";
const PERGUNTA = "Quantas horas você dorme por noite?";
const PERGUNTA_IMP = "Quantas horas você passa no celular por dia?";

const CONTEUDO_FIXO = (modo) => ({
  situacao: { tema: "Situação", palavra: SITUACAO },
  historia: { tema: "História", palavra: HISTORIA },
  pergunta: { tema: "Pergunta", palavra: PERGUNTA, perguntaImpostor: PERGUNTA_IMP },
}[modo]);

// aleatorio = 0 → o impostor é sempre "j1" (o primeiro a entrar).
function criarSala({ modo, n = 4, aleatorio = () => 0, config, conteudo = CONTEUDO_FIXO } = {}) {
  const enviados = [];
  const resultados = [];
  const sala = new ImpostorRoom({
    codigo: "MOD-01",
    enviar: (para, evento, dados) => enviados.push({ para, evento, dados: structuredClone(dados) }),
    sortearPalavra: async () => ({ tema: "Lugares", palavra: "Praia" }),
    sortearConteudo: conteudo,
    aoFimDePartida: (r) => resultados.push(r),
    aleatorio,
    config,
  });
  const ids = [];
  for (let i = 1; i <= n; i++) {
    sala.entrar({ id: `j${i}`, nickname: `Jogador${i}` }, `s${i}`);
    ids.push(`j${i}`);
  }
  if (modo) assert.equal(sala.definirModo("j1", modo), null);
  return { sala, enviados, resultados, ids };
}

async function iniciada(opcoes) {
  const ctx = criarSala(opcoes);
  assert.equal(await ctx.sala.iniciar("j1"), null);
  return ctx;
}

const segundos = (s) => mock.timers.tick(s * 1000);
const ultimoEstado = (enviados, para) =>
  enviados.filter((e) => e.para === para && e.evento === "impostor-estado").at(-1)?.dados;
const votar = (sala, votos) => {
  for (const [eleitor, alvo] of Object.entries(votos)) assert.equal(sala.votar(eleitor, alvo), null);
};

// Tudo que `uid` recebeu antes do primeiro estado na fase `fase`.
function recebidoAntesDe(enviados, uid, fase) {
  const dele = enviados.filter((e) => e.para === uid);
  const i = dele.findIndex((e) => e.evento === "impostor-estado" && e.dados.fase === fase);
  return i === -1 ? dele : dele.slice(0, i);
}
const contem = (pacotes, texto) => pacotes.some((e) => JSON.stringify(e.dados ?? null).toLowerCase().includes(texto.toLowerCase()));

// Dá as dicas/frases das 2 rodadas (esperando a pausa da última de cada rodada).
function jogarAteVotacao(sala, texto = (n) => `dica${n}`) {
  segundos(CONFIG.SEG_CARTAS);
  let n = 0;
  while (sala.fase === FASES.DICAS) {
    if (sala.vezDe) assert.equal(sala.darDica(sala.vezDe, texto(n++)), null);
    else segundos(CONFIG.SEG_ULTIMA_DICA);
  }
  assert.equal(sala.fase, FASES.VOTACAO);
}

// ======================================================================
// Regras (validações)
// ======================================================================

test("situação: dica de 1 a 3 palavras, até 40 letras; palavras da situação são proibidas", () => {
  assert.deepEqual(validarDica("espera muito longa", SITUACAO, "situacao"), { dica: "espera muito longa" });
  assert.match(validarDica("uma espera muito longa", SITUACAO, "situacao").erro, /3 palavras/);
  assert.match(validarDica("x".repeat(41), SITUACAO, "situacao").erro, /40/);
  assert.equal(validarDica("x".repeat(40), SITUACAO, "situacao").erro, undefined);
  for (const d of ["fila", "Filas enormes", "o SUS", "fila-do-sus", "nafiladosus"]) {
    assert.ok(validarDica(d, SITUACAO, "situacao").erro, `devia recusar "${d}"`);
  }
  // Palavras "vazias" da situação ("na", "do") e trechos dentro de outra palavra passam.
  assert.equal(validarDica("na espera", SITUACAO, "situacao").erro, undefined);
  assert.equal(validarDica("perfilado", SITUACAO, "situacao").erro, undefined);
  // Situação de uma palavra importante só ("No banco").
  assert.ok(validarDica("banco", "No banco", "situacao").erro);
  // Impostor (segredo null): sem checagem contra a situação — não vira oráculo.
  assert.equal(validarDica("fila", null, "situacao").erro, undefined);
  assert.match(validarDica("que porra", null, "situacao").erro, /não é permitida/);
  // Modo palavra continua com uma palavra só.
  assert.match(validarDica("duas palavras", "Praia").erro, /uma palavra/);
});

test("história: frase até 120, sem palavrão e sem palavras (4+ letras) do tema", () => {
  const f120 = "a".repeat(120);
  assert.deepEqual(validarFrase(f120, HISTORIA), { frase: f120 });
  assert.match(validarFrase("a".repeat(121), HISTORIA).erro, /120/);
  assert.match(validarFrase("   ", HISTORIA).erro, /Escreva/);
  assert.match(validarFrase("Aí deu merda total", null).erro, /não é permitida/);
  assert.ok(validarFrase("Chegamos na PRAIA cedinho.", HISTORIA).erro);
  assert.ok(validarFrase("A viagem foi longa.", HISTORIA).erro);
  assert.equal(validarFrase("O sol estava forte e a areia quente.", HISTORIA).erro, undefined);
  assert.equal(validarFrase("O dia estava lindo.", "Um dia no mar").erro, undefined); // 3 letras: livres
  assert.equal(validarFrase("Chegamos na praia.", null).erro, undefined); // impostor
  assert.deepEqual(validarTextoDaVez("historia", "  Tudo   certo. ", HISTORIA), { texto: "Tudo certo." });
});

test("pergunta: resposta curta (até 60), sem palavrão", () => {
  assert.deepEqual(validarResposta("  umas 8 horas "), { resposta: "umas 8 horas" });
  assert.equal(validarResposta("x".repeat(60)).erro, undefined);
  assert.match(validarResposta("x".repeat(61)).erro, /60/);
  assert.match(validarResposta("").erro, /Escreva/);
  assert.match(validarResposta("sei la porra").erro, /não é permitida/);
  assert.ok(temPalavrao("vai tnc!"));
  assert.ok(!temPalavrao("escudo cupim curral"));
  assert.deepEqual(Object.keys(LIMITES).sort(), [...MODOS].sort());
});

// ======================================================================
// Conteúdo
// ======================================================================

test("conteúdo: quantidades, sem repetição, pares com o mesmo tipo de resposta", () => {
  assert.ok(SITUACOES.length >= 40, `situações: ${SITUACOES.length}`);
  assert.ok(PERGUNTAS.length >= 40, `perguntas: ${PERGUNTAS.length}`);
  assert.ok(HISTORIAS.length >= 30, `histórias: ${HISTORIAS.length}`);
  assert.equal(new Set(SITUACOES.map((s) => s.texto)).size, SITUACOES.length);
  assert.equal(new Set(HISTORIAS).size, HISTORIAS.length);
  const todasPerguntas = PERGUNTAS.flatMap((p) => [p.pergunta, p.impostor]);
  assert.equal(new Set(todasPerguntas).size, todasPerguntas.length);
  for (const p of PERGUNTAS) {
    if (p.tipo === "numero") assert.ok(Array.isArray(p.faixa) && p.faixa[0] <= p.faixa[1], p.pergunta);
    else assert.ok(RESPOSTAS_POR_TIPO[p.tipo]?.length >= 5, `tipo sem banco: ${p.tipo}`);
  }
});

test("conteúdo: tudo que os bots usam passa pela validação da sala", () => {
  for (const s of SITUACOES) {
    assert.equal(s.dicas.length, 3);
    for (const d of s.dicas) assert.equal(validarDica(d, s.texto, "situacao").erro, undefined, `"${d}" em "${s.texto}"`);
  }
  for (const d of DICAS_GENERICAS_SITUACAO) assert.equal(validarDica(d, null, "situacao").erro, undefined, d);
  for (const h of HISTORIAS) {
    const ok = FRASES_GENERICAS.filter((f) => !validarFrase(f, h).erro);
    assert.ok(ok.length >= 4, `poucas frases válidas pra "${h}"`);
  }
  for (const f of FRASES_GENERICAS) assert.equal(validarFrase(f, null).erro, undefined, f);
  for (const lista of Object.values(RESPOSTAS_POR_TIPO)) {
    for (const r of lista) assert.equal(validarResposta(r).erro, undefined, r);
  }
});

test("conteúdo: sorteio evita o que a sala já usou; 6 opções com o segredo", () => {
  const usados = SITUACOES.slice(1).map((s) => s.texto);
  assert.equal(sortearConteudo("situacao", usados, () => 0.99).palavra, SITUACOES[0].texto);
  const p = sortearConteudo("pergunta", [], () => 0.7); // 0.7 ≥ 0.5: sem troca
  const par = PERGUNTAS.find((x) => x.pergunta === p.palavra);
  assert.equal(p.perguntaImpostor, par.impostor);
  const q = sortearConteudo("pergunta", [], () => 0.2); // troca: a do impostor vira a da maioria
  assert.ok(PERGUNTAS.some((x) => x.impostor === q.palavra && x.pergunta === q.perguntaImpostor));
  assert.ok(HISTORIAS.includes(sortearConteudo("historia", []).palavra));
  for (const modo of ["situacao", "historia"]) {
    const segredo = modo === "situacao" ? SITUACAO : HISTORIA;
    const op = opcoesDoChute(modo, segredo);
    assert.equal(op.length, 6);
    assert.equal(new Set(op).size, 6);
    assert.ok(op.includes(segredo));
  }
});

// ======================================================================
// Escolha do modo
// ======================================================================

test("modo: só o anfitrião, só no lobby, só modos conhecidos; vai no estado", async () => {
  const { sala, enviados } = criarSala();
  assert.equal(ultimoEstado(enviados, "j2").modo, "palavra");
  assert.deepEqual(ultimoEstado(enviados, "j2").modos.map((m) => m.id), MODOS);
  assert.match(sala.definirModo("j2", "situacao"), /anfitrião/);
  assert.match(sala.definirModo("j1", "xadrez"), /desconhecido/);
  assert.equal(sala.definirModo("j1", "historia"), null);
  assert.equal(ultimoEstado(enviados, "j2").modo, "historia");
  // Também dá pra mandar o modo junto do "Iniciar".
  assert.equal(await sala.iniciar("j1", "situacao"), null);
  assert.equal(sala.partida.modo, "situacao");
  const est = ultimoEstado(enviados, "j2");
  assert.equal(est.modo, "situacao");
  assert.equal(est.modos, undefined); // lista só no lobby
  assert.deepEqual(est.limites, { caracteres: 40, palavras: 3 });
  assert.match(sala.definirModo("j1", "palavra"), /sala de espera/);
});

test("modo: iniciar com modo inválido não começa a partida", async () => {
  const { sala } = criarSala();
  assert.match(await sala.iniciar("j1", "xadrez"), /desconhecido/);
  assert.equal(sala.fase, FASES.LOBBY);
});

// ======================================================================
// SITUAÇÃO
// ======================================================================

test("SITUAÇÃO: carta — impostor recebe só o papel; tripulantes, a situação", async () => {
  const { enviados } = await iniciada({ modo: "situacao" });
  const cartas = enviados.filter((e) => e.evento === "impostor-carta");
  assert.equal(cartas.length, 4);
  for (const c of cartas) {
    if (c.para === "j1") assert.deepEqual(c.dados, { papel: "impostor" });
    else assert.deepEqual(c.dados, { papel: "tripulante", situacao: SITUACAO });
  }
});

test("SITUAÇÃO: dicas de até 3 palavras, sem palavras da situação; mesmo relógio e pausa da última dica", async () => {
  const { sala, enviados } = await iniciada({ modo: "situacao" });
  segundos(CONFIG.SEG_CARTAS);
  while (sala.vezDe === "j1") sala.darDica("j1", "fila de gente"); // impostor pode (sem oráculo)
  const vez = sala.vezDe;
  assert.match(sala.darDica(vez, "uma fila muito grande"), /3 palavras/);
  assert.match(sala.darDica(vez, "fila grande"), /situação/);
  assert.equal(sala.vezDe, vez);
  assert.equal(sala.restanteMs(), CONFIG.SEG_DICA * 1000);
  assert.equal(sala.darDica(vez, "espera muito longa"), null);
  assert.equal(ultimoEstado(enviados, "j3").dicas.find((d) => d.jogadorId === vez).texto, "espera muito longa");
  // Pausa da última dica também aqui.
  const p = sala.partida;
  while (p.vez < p.ordem.length - 1) sala.darDica(sala.vezDe, "ok");
  sala.darDica(sala.vezDe, "senha na mão");
  assert.equal(sala.fase, FASES.DICAS);
  assert.equal(sala.vezDe, null);
  assert.equal(sala.restanteMs(), CONFIG.SEG_ULTIMA_DICA * 1000);
});

test("SITUAÇÃO: SEGURANÇA — impostor não recebe a situação até a última chance; lá, 6 opções; acertar dá a vitória", async () => {
  const { sala, enviados, resultados } = await iniciada({ modo: "situacao" });
  // Cai e volta no meio (a carta é reenviada).
  sala.sair("s1");
  sala.entrar({ id: "j1", nickname: "Jogador1" }, "s1b");
  jogarAteVotacao(sala);
  votar(sala, { j1: "j2", j2: "j1", j3: "j1", j4: "j1" });
  segundos(CONFIG.SEG_REVELACAO);
  assert.equal(sala.fase, FASES.ULTIMA_CHANCE);

  const antes = recebidoAntesDe(enviados, "j1", FASES.ULTIMA_CHANCE);
  assert.ok(antes.length > 10);
  assert.ok(!contem(antes, SITUACAO), "situação vazou pro impostor antes da última chance");

  const est = ultimoEstado(enviados, "j1");
  assert.equal(est.opcoes.length, 6);
  assert.ok(est.opcoes.includes(SITUACAO));
  assert.equal(ultimoEstado(enviados, "j2").opcoes.length, 6); // todos veem as opções
  assert.match(sala.chutar("j1", 99), /opções/);
  assert.match(sala.chutar("j1", "Num lugar que não existe"), /opções/);
  assert.equal(sala.fase, FASES.ULTIMA_CHANCE);
  assert.equal(sala.chutar("j1", est.opcoes.indexOf(SITUACAO)), null);

  assert.equal(sala.fase, FASES.FIM);
  const r = resultados[0];
  assert.equal(r.modo, "situacao");
  assert.equal(r.palavra, SITUACAO);
  assert.equal(r.vencedor, "impostor");
  assert.equal(r.motivo, "adivinhou");
  assert.deepEqual(r.pontos, { j1: 200, j2: 150, j3: 150, j4: 150 });
  const fim = ultimoEstado(enviados, "j2").resultado;
  assert.equal(fim.modo, "situacao");
  assert.equal(fim.palavra, SITUACAO);
  assert.equal(fim.chute, SITUACAO);
});

test("SITUAÇÃO: opção errada (ou pelo texto) → tripulantes; sem escolha em 15s → errou", async () => {
  const a = await iniciada({ modo: "situacao" });
  jogarAteVotacao(a.sala);
  votar(a.sala, { j1: "j2", j2: "j1", j3: "j1", j4: "j1" });
  segundos(CONFIG.SEG_REVELACAO);
  const errada = a.sala.partida.opcoes.find((o) => o !== SITUACAO);
  assert.equal(a.sala.chutar("j1", errada.toUpperCase()), null); // texto exato da opção (sem caixa/acento)
  assert.equal(a.resultados[0].vencedor, "tripulantes");
  assert.equal(a.resultados[0].motivo, "errou");
  assert.equal(a.resultados[0].tema, "Situação");

  const b = await iniciada({ modo: "situacao" });
  jogarAteVotacao(b.sala);
  votar(b.sala, { j1: "j2", j2: "j1", j3: "j1", j4: "j1" });
  segundos(CONFIG.SEG_REVELACAO);
  segundos(CONFIG.SEG_ULTIMA_CHANCE);
  assert.equal(b.sala.fase, FASES.FIM);
  assert.equal(b.resultados[0].motivo, "errou");
});

// ======================================================================
// HISTÓRIA
// ======================================================================

test("HISTÓRIA: carta, frases de até 120 com SEG_FRASE, história acumulada com autor", async () => {
  const { sala, enviados } = await iniciada({ modo: "historia" });
  const cartas = enviados.filter((e) => e.evento === "impostor-carta");
  for (const c of cartas) {
    if (c.para === "j1") assert.deepEqual(c.dados, { papel: "impostor" });
    else assert.deepEqual(c.dados, { papel: "tripulante", historia: HISTORIA });
  }
  segundos(CONFIG.SEG_CARTAS);
  assert.equal(ultimoEstado(enviados, "j2").limites.caracteres, 120);
  while (sala.vezDe === "j1") sala.darDica("j1", "Fomos pra praia de manhã."); // impostor: sem oráculo
  const vez = sala.vezDe;
  assert.equal(sala.restanteMs(), CONFIG.SEG_FRASE * 1000);
  assert.match(sala.darDica(vez, "a".repeat(121)), /120/);
  assert.match(sala.darDica(vez, "A praia estava cheia."), /tema/);
  assert.equal(sala.darDica(vez, "O sol estava de rachar, e todo mundo correu pra água."), null);
  const est = ultimoEstado(enviados, "j3");
  assert.deepEqual(est.dicas.at(-1), { rodada: 1, jogadorId: vez, texto: "O sol estava de rachar, e todo mundo correu pra água." });
  // Quem não escreve a tempo fica em branco (no prazo de 45s, não 30).
  const proximo = sala.vezDe;
  segundos(CONFIG.SEG_DICA);
  assert.equal(sala.vezDe, proximo);
  segundos(CONFIG.SEG_FRASE - CONFIG.SEG_DICA);
  assert.notEqual(sala.vezDe, proximo);
  assert.equal(sala.partida.dicas.find((d) => d.jogadorId === proximo).texto, "");
});

test("HISTÓRIA: SEGURANÇA e partida inteira até a última chance em múltipla escolha", async () => {
  const { sala, enviados, resultados } = await iniciada({ modo: "historia" });
  jogarAteVotacao(sala, (n) => `Frase número ${n} da nossa aventura.`);
  assert.equal(sala.partida.dicas.length, 8);
  assert.ok(sala.partida.dicas.every((d) => d.texto.startsWith("Frase")));
  votar(sala, { j1: "j2", j2: "j1", j3: "j1", j4: "j1" });
  segundos(CONFIG.SEG_REVELACAO);
  assert.equal(sala.fase, FASES.ULTIMA_CHANCE);
  assert.ok(!contem(recebidoAntesDe(enviados, "j1", FASES.ULTIMA_CHANCE), HISTORIA));
  const op = ultimoEstado(enviados, "j1").opcoes;
  assert.ok(op.includes(HISTORIA));
  assert.ok(op.every((o) => HISTORIAS.includes(o)));
  assert.equal(sala.chutar("j1", op.findIndex((o) => o !== HISTORIA)), null);
  assert.equal(resultados[0].modo, "historia");
  assert.equal(resultados[0].vencedor, "tripulantes");
  assert.equal(ultimoEstado(enviados, "j1").resultado.palavra, HISTORIA);
});

// ======================================================================
// PERGUNTA
// ======================================================================

async function ateRespostas(opcoes = {}) {
  const ctx = await iniciada({ modo: "pergunta", ...opcoes });
  for (const id of ctx.ids) ctx.sala.cartaVista(id);
  assert.equal(ctx.sala.fase, FASES.RESPOSTAS);
  return ctx;
}

test("PERGUNTA: carta — cada um a sua pergunta, sem papel (o impostor não sabe)", async () => {
  const { enviados } = await iniciada({ modo: "pergunta" });
  for (const c of enviados.filter((e) => e.evento === "impostor-carta")) {
    assert.deepEqual(c.dados, { pergunta: c.para === "j1" ? PERGUNTA_IMP : PERGUNTA });
  }
  const b = await iniciada({ modo: "pergunta", config: { PERGUNTA_IMPOSTOR_SABE: true } });
  const doImp = b.enviados.find((e) => e.evento === "impostor-carta" && e.para === "j1").dados;
  assert.deepEqual(doImp, { pergunta: PERGUNTA_IMP, papel: "impostor" });
});

test("PERGUNTA: respostas simultâneas, só a sua no estado; uma por pessoa; 60 letras", async () => {
  const { sala, enviados } = await ateRespostas();
  assert.equal(sala.vezDe, null);
  assert.equal(sala.restanteMs(), CONFIG.SEG_RESPOSTA * 1000);
  assert.match(sala.darDica("j2", "oi"), /não é hora/);
  assert.match(sala.responder("j2", "x".repeat(61)), /60/);
  assert.equal(sala.responder("j2", "umas 8"), null);
  assert.match(sala.responder("j2", "9"), /já respondeu/);
  assert.equal(sala.responder("j1", "5 horas"), null);
  const e2 = ultimoEstado(enviados, "j2");
  assert.equal(e2.fase, FASES.RESPOSTAS);
  assert.equal(e2.responderam, 2);
  assert.equal(e2.totalRespondentes, 4);
  assert.equal(e2.minhaResposta, "umas 8");
  assert.equal(e2.respostas, undefined);
  assert.equal(ultimoEstado(enviados, "j3").minhaResposta, null);
  assert.ok(!JSON.stringify(ultimoEstado(enviados, "j3")).includes("5 horas"));
});

test("PERGUNTA: tempo acaba → quem não respondeu fica em branco; confronto sem a pergunta; depois votação com ela", async () => {
  const { sala, enviados } = await ateRespostas();
  sala.responder("j1", "6");
  sala.responder("j2", "8");
  segundos(CONFIG.SEG_RESPOSTA);
  assert.equal(sala.fase, FASES.CONFRONTO);
  const c = ultimoEstado(enviados, "j1");
  assert.deepEqual(
    [...c.respostas].sort((a, b) => a.jogadorId.localeCompare(b.jogadorId)),
    [{ jogadorId: "j1", texto: "6" }, { jogadorId: "j2", texto: "8" }, { jogadorId: "j3", texto: "" }, { jogadorId: "j4", texto: "" }],
  );
  assert.equal(c.perguntaReal, undefined);
  assert.match(sala.votar("j2", "j1"), /não é hora/);
  segundos(CONFIG.SEG_CONFRONTO);
  assert.equal(sala.fase, FASES.VOTACAO);
  assert.equal(sala.restanteMs(), CONFIG.SEG_VOTACAO_PERGUNTA * 1000);
  const v = ultimoEstado(enviados, "j1");
  assert.equal(v.perguntaReal, PERGUNTA);
  assert.equal(v.respostas.length, 4);
});

test("PERGUNTA: SEGURANÇA — impostor só vê a pergunta real na votação; a dele só sai no fim; descoberto = sem última chance", async () => {
  const { sala, enviados, resultados } = await ateRespostas();
  // Impostor cai e volta durante as respostas.
  sala.sair("s1");
  sala.entrar({ id: "j1", nickname: "Jogador1" }, "s1b");
  for (const [id, r] of [["j1", "7"], ["j2", "8"], ["j3", "6"], ["j4", "9"]]) assert.equal(sala.responder(id, r), null);
  assert.equal(sala.fase, FASES.CONFRONTO); // todos responderam: não espera os 40s
  segundos(CONFIG.SEG_CONFRONTO);
  votar(sala, { j1: "j2", j2: "j1", j3: "j1", j4: "j1" });
  assert.equal(sala.fase, FASES.REVELACAO);
  segundos(CONFIG.SEG_REVELACAO);
  assert.equal(sala.fase, FASES.FIM); // sem ULTIMA_CHANCE
  assert.match(sala.chutar("j1", "qualquer"), /não é hora/);

  assert.ok(!contem(recebidoAntesDe(enviados, "j1", FASES.VOTACAO), PERGUNTA), "pergunta real vazou pro impostor");
  for (const t of ["j2", "j3", "j4"]) {
    assert.ok(!contem(recebidoAntesDe(enviados, t, FASES.FIM), PERGUNTA_IMP), `pergunta do impostor vazou pra ${t}`);
  }
  const r = resultados[0];
  assert.equal(r.modo, "pergunta");
  assert.equal(r.vencedor, "tripulantes");
  assert.equal(r.motivo, "descoberto");
  assert.deepEqual(r.pontos, { j1: 0, j2: 200, j3: 200, j4: 200 });
  const fim = ultimoEstado(enviados, "j2").resultado;
  assert.equal(fim.palavra, PERGUNTA);
  assert.equal(fim.perguntaImpostor, PERGUNTA_IMP);
  assert.equal(ultimoEstado(enviados, "j2").respostas.length, 4);
});

test("PERGUNTA: não votado (inocente ou empate) → impostor vence", async () => {
  const a = await ateRespostas();
  segundos(CONFIG.SEG_RESPOSTA);
  segundos(CONFIG.SEG_CONFRONTO);
  votar(a.sala, { j1: "j2", j2: "j3", j3: "j2", j4: "j2" });
  segundos(CONFIG.SEG_REVELACAO);
  assert.equal(a.resultados[0].vencedor, "impostor");
  assert.equal(a.resultados[0].motivo, "inocente");

  const b = await ateRespostas();
  segundos(CONFIG.SEG_RESPOSTA);
  segundos(CONFIG.SEG_CONFRONTO);
  votar(b.sala, { j1: "j2", j2: "j1", j3: "j2", j4: "j1" });
  segundos(CONFIG.SEG_REVELACAO);
  assert.equal(b.resultados[0].vencedor, "impostor");
  assert.equal(b.resultados[0].motivo, "empate");
});

test("PERGUNTA: quem cai não trava as respostas; quem sai de vez some das respostas", async () => {
  const { sala } = await ateRespostas({ n: 5 });
  sala.responder("j5", "10");
  sala.sairDeVez("j5");
  assert.equal(sala.partida.respostas.has("j5"), false);
  sala.sair("s4"); // caiu (tolerância): não precisa esperar por ele
  for (const id of ["j1", "j2", "j3"]) sala.responder(id, "8");
  assert.equal(sala.fase, FASES.CONFRONTO);
  assert.deepEqual(sala.partida.respostasReveladas.map((r) => r.jogadorId).sort(), ["j1", "j2", "j3", "j4"]);
});

// ======================================================================
// Gravação
// ======================================================================

test("gravação: o modo vai no tema; palavra = segredo", () => {
  assert.equal(temaParaGravar({ modo: "palavra", tema: "Lugares" }), "Lugares");
  assert.equal(temaParaGravar({ tema: "Lugares" }), "Lugares"); // resultado antigo, sem modo
  assert.equal(temaParaGravar({ modo: "situacao", tema: "Situação" }), "Modo Situação");
  assert.equal(temaParaGravar({ modo: "historia", tema: "História" }), "Modo História");
  assert.equal(temaParaGravar({ modo: "pergunta", tema: "Pergunta", perguntaImpostor: PERGUNTA_IMP }), `Modo Pergunta | impostor: ${PERGUNTA_IMP}`);
});

// ======================================================================
// Bots jogam todos os modos (com o conteúdo de verdade)
// ======================================================================

function salaComBots(modo, { aleatorio = () => 0 } = {}) {
  const ctx = criarSala({ n: 1, aleatorio, conteudo: sortearConteudo });
  for (let i = 0; i < 3; i++) assert.equal(ctx.sala.adicionarBot("j1"), null);
  assert.equal(ctx.sala.definirModo("j1", modo), null);
  return ctx;
}

// O humano "j1" faz o mínimo; os bots fazem o resto sozinhos.
async function jogarComBots(sala) {
  assert.equal(await sala.iniciar("j1"), null);
  for (let i = 0; i < 600 && sala.fase !== FASES.FIM; i++) {
    const p = sala.partida;
    if (sala.fase === FASES.CARTAS) sala.cartaVista("j1");
    if (sala.vezDe === "j1") sala.darDica("j1", p.modo === "historia" ? "E aí aconteceu uma coisa." : "gente");
    if (sala.fase === FASES.RESPOSTAS && !p.respostas.has("j1")) sala.responder("j1", "sei lá");
    if (sala.fase === FASES.VOTACAO && !p.votos.has("j1")) sala.votar("j1", [...sala.jogadores.keys()].find((id) => id !== "j1"));
    if (sala.fase === FASES.ULTIMA_CHANCE && p.impostorId === "j1") sala.chutar("j1", 0);
    segundos(1);
  }
  assert.equal(sala.fase, FASES.FIM);
}

for (const modo of ["situacao", "historia"]) {
  test(`bots: jogam uma partida inteira no modo ${modo}`, async () => {
    const { sala, resultados } = salaComBots(modo);
    await jogarComBots(sala);
    const dosBots = sala.partida.dicas.filter((d) => d.jogadorId.startsWith("bot-"));
    assert.equal(dosBots.length, 6); // 3 bots x 2 rodadas, nenhuma em branco
    for (const d of dosBots) {
      assert.ok(d.texto);
      const segredo = d.jogadorId === sala.partida.impostorId ? null : sala.partida.palavra;
      assert.equal(validarTextoDaVez(modo, d.texto, segredo).erro, undefined);
      if (modo === "situacao") assert.ok(d.texto.split(" ").length <= 3);
    }
    assert.equal(sala.partida.votos.size, 4);
    assert.equal(resultados[0].modo, modo);
    assert.equal(resultados[0].comBots, true);
  });
}

test("bots: jogam uma partida inteira no modo pergunta (respostas do mesmo tipo)", async () => {
  const { sala, resultados } = salaComBots("pergunta");
  await jogarComBots(sala);
  const p = sala.partida;
  assert.equal(p.respostasReveladas.length, 4);
  for (const r of p.respostasReveladas) assert.ok(r.texto, `${r.jogadorId} ficou em branco`);
  assert.equal(p.votos.size, 4);
  assert.equal(resultados[0].modo, "pergunta");
  assert.ok(resultados[0].perguntaImpostor);
});

for (const modo of ["situacao", "historia"]) {
  test(`bots: bot impostor escolhe uma das 6 opções no modo ${modo}`, async () => {
    // aleatorio perto de 1: o impostor é o último a entrar (um bot).
    const { sala } = salaComBots(modo, { aleatorio: () => 0.99 });
    assert.equal(await sala.iniciar("j1"), null);
    const impId = sala.partida.impostorId;
    assert.ok(impId.startsWith("bot-"));
    assert.deepEqual(sala.cerebros.get(impId).carta, { papel: "impostor" });
    sala.cartaVista("j1");
    for (let i = 0; i < 400 && sala.fase !== FASES.VOTACAO; i++) {
      if (sala.vezDe === "j1") sala.darDica("j1", modo === "historia" ? "Tudo parecia normal." : "gente");
      segundos(1);
    }
    sala.votar("j1", impId);
    for (const id of sala.cerebros.keys()) if (id !== impId) sala.partida.votos.set(id, impId);
    sala.apurar();
    segundos(CONFIG.SEG_REVELACAO);
    assert.equal(sala.fase, FASES.ULTIMA_CHANCE);
    segundos(6);
    assert.equal(sala.fase, FASES.FIM);
    assert.ok(sala.partida.opcoes.includes(sala.partida.chute));
  });
}
