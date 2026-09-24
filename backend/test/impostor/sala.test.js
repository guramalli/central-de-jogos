import { test, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { ImpostorRoom, FASES, CONFIG } from "../../src/impostor/ImpostorRoom.js";

// Partidas simuladas com relógio falso: os timers de 10/30/15s andam com
// mock.timers.tick, sem esperar de verdade.

const PALAVRA = "Praia";
const TEMA = "Lugares";

beforeEach(() => mock.timers.enable({ apis: ["setTimeout", "setInterval", "Date"] }));
afterEach(() => mock.timers.reset());

// aleatorio = 0 → o impostor é sempre o PRIMEIRO a entrar ("j1").
function criarSala({ n = 4, aleatorio = () => 0, config } = {}) {
  const enviados = [];
  const resultados = [];
  const sala = new ImpostorRoom({
    codigo: "TST-01",
    enviar: (para, evento, dados) => enviados.push({ para, evento, dados: structuredClone(dados) }),
    sortearPalavra: async () => ({ tema: TEMA, palavra: PALAVRA }),
    aoFimDePartida: (r) => resultados.push(r),
    aleatorio,
    config,
  });
  const ids = [];
  for (let i = 1; i <= n; i++) {
    sala.entrar({ id: `j${i}`, nickname: `Jogador${i}` }, `s${i}`);
    ids.push(`j${i}`);
  }
  return { sala, enviados, resultados, ids };
}

async function iniciada(opcoes) {
  const ctx = criarSala(opcoes);
  const erro = await ctx.sala.iniciar("j1");
  assert.equal(erro, null);
  return ctx;
}

const segundos = (s) => mock.timers.tick(s * 1000);

// Pula a carta e dá as dicas das 2 rodadas (esperando a pausa da última
// dica de cada rodada, quando ninguém está na vez).
function jogarAteVotacao(sala) {
  segundos(CONFIG.SEG_CARTAS);
  let n = 0;
  while (sala.fase === FASES.DICAS) {
    if (sala.vezDe) assert.equal(sala.darDica(sala.vezDe, `dica${n++}`), null);
    else segundos(CONFIG.SEG_ULTIMA_DICA);
  }
  assert.equal(sala.fase, FASES.VOTACAO);
}

// Votos: { eleitor: alvo }
function votar(sala, votos) {
  for (const [eleitor, alvo] of Object.entries(votos)) assert.equal(sala.votar(eleitor, alvo), null);
}

const ultimoEstado = (enviados, para) =>
  enviados.filter((e) => e.para === para && e.evento === "impostor-estado").at(-1)?.dados;

// ======================================================================
// Início
// ======================================================================

test("não inicia com menos de 4 jogadores", async () => {
  const { sala } = criarSala({ n: 3 });
  assert.match(await sala.iniciar("j1"), /pelo menos 4/);
  assert.equal(sala.fase, FASES.LOBBY);
});

test("só o anfitrião inicia", async () => {
  const { sala } = criarSala();
  assert.equal(sala.anfitriaoId, "j1");
  assert.match(await sala.iniciar("j2"), /anfitrião/);
});

test("sala cheia com 12", () => {
  const { sala } = criarSala({ n: 12 });
  assert.match(sala.entrar({ id: "j13", nickname: "X" }, "s13"), /cheia/);
});

test("ao iniciar: 1 impostor, carta individual, impostor recebe só o tema", async () => {
  const { sala, enviados, ids } = await iniciada({ aleatorio: () => 0.99 });
  assert.equal(sala.fase, FASES.CARTAS);
  const cartas = enviados.filter((e) => e.evento === "impostor-carta");
  assert.equal(cartas.length, 4);
  assert.deepEqual(cartas.map((c) => c.para).sort(), ids);
  const impostores = cartas.filter((c) => c.dados.papel === "impostor");
  assert.equal(impostores.length, 1);
  assert.equal(impostores[0].para, sala.partida.impostorId);
  assert.deepEqual(impostores[0].dados, { papel: "impostor", tema: TEMA });
  for (const c of cartas.filter((c) => c.dados.papel === "tripulante")) {
    assert.deepEqual(c.dados, { papel: "tripulante", tema: TEMA, palavra: PALAVRA });
  }
});

test("carta: avança antes dos 10s quando todos confirmam, ou no tempo", async () => {
  const a = await iniciada();
  for (const id of a.ids) a.sala.cartaVista(id);
  assert.equal(a.sala.fase, FASES.DICAS);

  const b = await iniciada();
  b.sala.cartaVista("j1");
  segundos(CONFIG.SEG_CARTAS - 1);
  assert.equal(b.sala.fase, FASES.CARTAS);
  segundos(1);
  assert.equal(b.sala.fase, FASES.DICAS);
});

// ======================================================================
// Segurança: a palavra e o impostor
// ======================================================================

// Tudo que o impostor recebeu ANTES do primeiro estado de FIM.
function recebidoPeloImpostorAntesDoFim(enviados, impostorId) {
  const doImpostor = enviados.filter((e) => e.para === impostorId);
  const fim = doImpostor.findIndex((e) => e.evento === "impostor-estado" && e.dados.fase === FASES.FIM);
  return fim === -1 ? doImpostor : doImpostor.slice(0, fim);
}

test("SEGURANÇA: o impostor nunca recebe a palavra antes do fim (partida inteira, com queda e volta)", async () => {
  const { sala, enviados, resultados } = await iniciada();
  const imp = sala.partida.impostorId;
  // O impostor cai e volta no meio (a carta é reenviada nessa hora).
  sala.sair("s1");
  sala.entrar({ id: "j1", nickname: "Jogador1" }, "s1b");
  jogarAteVotacao(sala);
  votar(sala, { j1: "j2", j2: "j1", j3: "j1", j4: "j1" });
  assert.equal(sala.fase, FASES.REVELACAO);
  segundos(CONFIG.SEG_REVELACAO);
  assert.equal(sala.fase, FASES.ULTIMA_CHANCE);
  assert.equal(sala.chutar(imp, "hospital"), null);
  assert.equal(sala.fase, FASES.FIM);

  const antes = recebidoPeloImpostorAntesDoFim(enviados, imp);
  assert.ok(antes.length > 10);
  for (const e of antes) {
    assert.ok(!JSON.stringify(e.dados).toLowerCase().includes("praia"), `vazou em ${e.evento}`);
  }
  // Só no FIM a palavra é revelada, pra todo mundo.
  assert.equal(ultimoEstado(enviados, imp).resultado.palavra, PALAVRA);
  assert.equal(resultados.length, 1);
});

test("SEGURANÇA: quem é o impostor só aparece a partir da revelação", async () => {
  const { sala, enviados } = await iniciada();
  jogarAteVotacao(sala);
  votar(sala, { j1: "j2", j2: "j1", j3: "j1" });
  const antesDaRevelacao = enviados.filter((e) => e.evento === "impostor-estado");
  for (const e of antesDaRevelacao) {
    const s = JSON.stringify(e.dados);
    assert.ok(!s.includes("impostorId"), "impostorId no estado antes da hora");
    assert.ok(!s.includes("papel"), "papel no estado");
  }
  votar(sala, { j4: "j1" });
  const est = ultimoEstado(enviados, "j3");
  assert.equal(est.fase, FASES.REVELACAO);
  assert.equal(est.revelacao.impostorId, "j1");
  // Na revelação ainda não sai a palavra (a última chance vem depois).
  assert.equal(est.resultado, undefined);
  assert.ok(!JSON.stringify(ultimoEstado(enviados, "j1")).toLowerCase().includes("praia"));
});

test("SEGURANÇA: dica do impostor com a palavra não é recusada (não vira oráculo)", async () => {
  const { sala } = await iniciada();
  segundos(CONFIG.SEG_CARTAS);
  while (sala.vezDe !== "j1") sala.darDica(sala.vezDe, "outra");
  assert.equal(sala.darDica("j1", "praia"), null);
});

test("SEGURANÇA: em quem cada um votou nunca é enviado; só a própria escolha", async () => {
  const { sala, enviados } = await iniciada();
  jogarAteVotacao(sala);
  votar(sala, { j2: "j1" });
  const e3 = ultimoEstado(enviados, "j3");
  assert.equal(e3.votaram, 1);
  assert.equal(e3.meuVoto, null);
  assert.equal(ultimoEstado(enviados, "j2").meuVoto, "j1");
  votar(sala, { j1: "j2", j3: "j1", j4: "j1" });
  const rev = ultimoEstado(enviados, "j3").revelacao;
  assert.deepEqual(Object.keys(rev.contagem[0]).sort(), ["id", "votos"]);
});

test("SEGURANÇA: nenhum pacote é enviado a quem não está na sala", async () => {
  const { sala, enviados, ids } = await iniciada();
  jogarAteVotacao(sala);
  for (const e of enviados) assert.ok(ids.includes(e.para));
});

// ======================================================================
// Dicas
// ======================================================================

test("dicas: ordem sorteada com todos, 2 rodadas, só quem está na vez", async () => {
  const { sala, ids } = await iniciada();
  segundos(CONFIG.SEG_CARTAS);
  assert.equal(sala.fase, FASES.DICAS);
  assert.deepEqual([...sala.partida.ordem].sort(), ids);
  const vez = sala.vezDe;
  const outro = ids.find((i) => i !== vez);
  assert.match(sala.darDica(outro, "areia"), /vez/);
  jogarAteVotacao(sala);
  const dicas = sala.partida.dicas;
  assert.equal(dicas.length, 8);
  assert.equal(dicas.filter((d) => d.rodada === 1).length, 4);
  assert.equal(dicas.filter((d) => d.rodada === 2).length, 4);
});

test("dicas: tempo estourado deixa a dica em branco e passa a vez", async () => {
  const { sala } = await iniciada();
  segundos(CONFIG.SEG_CARTAS);
  const primeiro = sala.vezDe;
  segundos(CONFIG.SEG_DICA);
  const { rodada, jogadorId, texto } = sala.partida.dicas[0];
  assert.deepEqual({ rodada, jogadorId, texto }, { rodada: 1, jogadorId: primeiro, texto: "" });
  assert.notEqual(sala.vezDe, primeiro);
});

test("dicas: tripulante não pode dar dica com a palavra; limite e 1 palavra", async () => {
  const { sala } = await iniciada();
  segundos(CONFIG.SEG_CARTAS);
  while (sala.vezDe === "j1") sala.darDica("j1", "x");
  const vez = sala.vezDe;
  assert.match(sala.darDica(vez, "PRÁIA"), /palavra secreta/);
  assert.match(sala.darDica(vez, "praias"), /palavra secreta/);
  assert.match(sala.darDica(vez, "duas palavras"), /uma palavra/);
  assert.match(sala.darDica(vez, "x".repeat(25)), /máximo/);
  assert.match(sala.darDica(vez, "porra"), /não é permitida/);
  assert.equal(sala.vezDe, vez); // erro não passa a vez
});

test("dica recusada: a vez continua e o relógio NÃO é zerado", async () => {
  const { sala, enviados } = await iniciada();
  segundos(CONFIG.SEG_CARTAS);
  while (sala.vezDe === "j1") sala.darDica("j1", "x"); // j1 é o impostor: pula pra um tripulante
  const vez = sala.vezDe;
  segundos(20); // usou 20 dos 30s
  const antes = sala.restanteMs();
  const n = enviados.length;
  assert.match(sala.darDica(vez, "praia"), /palavra secreta/);
  assert.match(sala.darDica(vez, "duas palavras"), /uma palavra/);
  assert.equal(sala.vezDe, vez);
  assert.equal(sala.restanteMs(), antes); // nada reiniciou
  assert.equal(enviados.length, n); // e nada foi transmitido (a tela não pisca)
  assert.equal(sala.darDica(vez, "areia"), null); // corrigiu a tempo
  assert.notEqual(sala.vezDe, vez);
});

test("dica recusada e o tempo acaba: fica em branco no prazo ORIGINAL", async () => {
  const { sala } = await iniciada();
  segundos(CONFIG.SEG_CARTAS);
  while (sala.vezDe === "j1") sala.darDica("j1", "x");
  const vez = sala.vezDe;
  segundos(25);
  assert.ok(sala.darDica(vez, "PRAIA"));
  segundos(4);
  assert.equal(sala.vezDe, vez);
  segundos(1); // 30s desde o início da vez, não 30s desde a recusa
  assert.notEqual(sala.vezDe, vez);
  assert.equal(sala.partida.dicas.find((d) => d.jogadorId === vez).texto, "");
});

test("fora de fase: não dá pra votar nas dicas nem dar dica na votação", async () => {
  const { sala } = await iniciada();
  segundos(CONFIG.SEG_CARTAS);
  assert.match(sala.votar("j2", "j1"), /não é hora/);
  jogarAteVotacao(sala);
  assert.match(sala.darDica("j2", "areia"), /não é hora/);
  assert.match(sala.chutar("j1", "praia"), /não é hora/);
});

// Dá as dicas da rodada atual até sobrar só o último da ordem.
function ateOUltimoDaRodada(sala) {
  const p = sala.partida;
  while (p.vez < p.ordem.length - 1) assert.equal(sala.darDica(sala.vezDe, `d${p.vez}`), null);
}

test("ÚLTIMA DICA: pausa SEG_ULTIMA_DICA na tela antes da próxima rodada e da votação", async () => {
  const { sala, enviados } = await iniciada();
  segundos(CONFIG.SEG_CARTAS);
  ateOUltimoDaRodada(sala);
  const ultimo = sala.vezDe;
  assert.equal(sala.darDica(ultimo, "concha"), null);

  // Pausa: continua em DICAS, rodada 1, ninguém na vez, última dica destacada.
  assert.equal(sala.fase, FASES.DICAS);
  assert.equal(sala.partida.rodada, 1);
  assert.equal(sala.vezDe, null);
  assert.equal(sala.restanteMs(), CONFIG.SEG_ULTIMA_DICA * 1000);
  const est = ultimoEstado(enviados, "j2");
  assert.deepEqual(est.ultimaDica, { rodada: 1, jogadorId: ultimo });
  assert.equal(est.vezDe, null);
  assert.equal(est.dicas.at(-1).texto, "concha");
  assert.equal(est.dicas.at(-1).em, undefined); // hora da dica não vai pro cliente
  assert.match(sala.darDica(ultimo, "outra"), /vez/);

  segundos(CONFIG.SEG_ULTIMA_DICA - 1);
  assert.equal(sala.partida.rodada, 1);
  segundos(1);
  assert.equal(sala.partida.rodada, 2);
  assert.ok(sala.vezDe);
  assert.equal(ultimoEstado(enviados, "j2").ultimaDica, null);

  // Fim da rodada 2: mesma pausa, depois votação.
  ateOUltimoDaRodada(sala);
  assert.equal(sala.darDica(sala.vezDe, "sol"), null);
  assert.equal(sala.fase, FASES.DICAS);
  assert.equal(sala.vezDe, null);
  segundos(CONFIG.SEG_ULTIMA_DICA - 1);
  assert.equal(sala.fase, FASES.DICAS);
  segundos(1);
  assert.equal(sala.fase, FASES.VOTACAO);
  assert.equal(ultimoEstado(enviados, "j2").ultimaDica, undefined); // só existe em DICAS
});

test("ÚLTIMA DICA: sem pausa quando o último da rodada deixa o tempo estourar", async () => {
  const { sala } = await iniciada();
  segundos(CONFIG.SEG_CARTAS);
  ateOUltimoDaRodada(sala);
  segundos(CONFIG.SEG_DICA); // último ficou em branco; a dica anterior já estava na tela havia 30s
  assert.equal(sala.partida.rodada, 2);
  assert.ok(sala.vezDe);
});

test("ÚLTIMA DICA: pausa também quando o último da ordem caiu (dica em branco na hora)", async () => {
  const { sala } = await iniciada();
  segundos(CONFIG.SEG_CARTAS);
  const p = sala.partida;
  const ultimoDaOrdem = p.ordem.at(-1);
  sala.sair(`s${ultimoDaOrdem.slice(1)}`);
  while (p.vez < p.ordem.length - 2) sala.darDica(sala.vezDe, "ok");
  const penultimo = sala.vezDe;
  assert.equal(sala.darDica(penultimo, "areia"), null);
  assert.equal(sala.vezDe, null);
  assert.deepEqual(p.ultimaDica, { rodada: 1, jogadorId: penultimo });
  segundos(CONFIG.SEG_ULTIMA_DICA);
  assert.equal(p.rodada, 2);
});

test("ÚLTIMA DICA: quem sai durante a pausa não trava a sala", async () => {
  const { sala } = await iniciada({ n: 5 });
  segundos(CONFIG.SEG_CARTAS);
  ateOUltimoDaRodada(sala);
  sala.darDica(sala.vezDe, "ok");
  assert.equal(sala.vezDe, null);
  sala.sairDeVez("j5");
  assert.equal(sala.fase, FASES.DICAS);
  segundos(CONFIG.SEG_ULTIMA_DICA);
  assert.equal(sala.partida.rodada, 2);
  assert.ok(!sala.partida.ordem.includes("j5"));
});

// ======================================================================
// Chat
// ======================================================================

test("chat: mensagem vai pra todos da sala (por jogador), com nick e cor; sem mexer no estado", async () => {
  const { sala, enviados } = await iniciada();
  const estadosAntes = enviados.filter((e) => e.evento === "impostor-estado").length;
  assert.equal(sala.mensagemChat("j2", "   oi   gente  "), null);
  const msgs = enviados.filter((e) => e.evento === "impostor-chat");
  assert.deepEqual(msgs.map((m) => m.para).sort(), ["j1", "j2", "j3", "j4"]);
  const m = msgs[0].dados;
  assert.equal(m.texto, "oi gente");
  assert.equal(m.uid, "j2");
  assert.equal(m.nick, "Jogador2");
  assert.equal(m.cor, sala.jogadores.get("j2").cor);
  assert.equal(enviados.filter((e) => e.evento === "impostor-estado").length, estadosAntes);
});

test("chat: limite de tamanho, texto vazio, intervalo mínimo e só quem está na sala", () => {
  const { sala, enviados } = criarSala();
  assert.equal(sala.mensagemChat("j1", "x".repeat(500)), null);
  assert.equal(sala.chat.at(-1).texto.length, CONFIG.MAX_MSG_CHAT);
  assert.match(sala.mensagemChat("j1", "de novo"), /Calma/);
  mock.timers.tick(CONFIG.MS_ENTRE_MSGS);
  assert.equal(sala.mensagemChat("j1", "de novo"), null);
  const n = enviados.length;
  assert.equal(sala.mensagemChat("j2", "   "), null);
  assert.equal(enviados.length, n); // vazio: nada sai
  assert.match(sala.mensagemChat("intruso", "oi"), /não está nesta sala/);
});

test("chat: bot não fala nem recebe; quem entra recebe o histórico (limitado)", () => {
  const { sala, enviados } = salaComBots(2);
  const bot = [...sala.jogadores.values()].find((j) => j.bot);
  assert.match(sala.mensagemChat(bot.id, "bip"), /não está nesta sala/);
  for (let i = 0; i < CONFIG.MAX_HIST_CHAT + 5; i++) {
    assert.equal(sala.mensagemChat("j1", `msg ${i}`), null);
    mock.timers.tick(CONFIG.MS_ENTRE_MSGS);
  }
  assert.ok(enviados.every((e) => !String(e.para).startsWith("bot-")));
  sala.entrar({ id: "j7", nickname: "Novo" }, "s7");
  const hist = enviados.filter((e) => e.para === "j7" && e.evento === "impostor-chat-historico").at(-1).dados.mensagens;
  assert.equal(hist.length, CONFIG.MAX_HIST_CHAT);
  assert.equal(hist.at(-1).texto, `msg ${CONFIG.MAX_HIST_CHAT + 4}`);
});

// ======================================================================
// Votação
// ======================================================================

test("votação: não vota em si, não vota duas vezes, alvo precisa estar na partida", async () => {
  const { sala } = await iniciada();
  jogarAteVotacao(sala);
  assert.match(sala.votar("j2", "j2"), /si mesmo/);
  assert.match(sala.votar("j2", "fantasma"), /não está na partida/);
  assert.equal(sala.votar("j2", "j1"), null);
  assert.match(sala.votar("j2", "j3"), /já votou/);
});

test("votação: sem todos votarem, apura no fim dos 30s", async () => {
  const { sala } = await iniciada();
  jogarAteVotacao(sala);
  votar(sala, { j2: "j1", j3: "j1" });
  segundos(CONFIG.SEG_VOTACAO - 1);
  assert.equal(sala.fase, FASES.VOTACAO);
  segundos(1);
  assert.equal(sala.fase, FASES.REVELACAO);
  assert.equal(sala.partida.apuracao.acusadoId, "j1");
});

test("EMPATE: ninguém é eliminado e o impostor vence", async () => {
  const { sala, resultados } = await iniciada();
  jogarAteVotacao(sala);
  votar(sala, { j1: "j2", j2: "j1", j3: "j2", j4: "j1" });
  assert.equal(sala.partida.apuracao.empate, true);
  segundos(CONFIG.SEG_REVELACAO);
  assert.equal(sala.fase, FASES.FIM); // sem última chance
  const r = resultados[0];
  assert.equal(r.vencedor, "impostor");
  assert.equal(r.motivo, "empate");
  assert.equal(r.acusadoId, null);
  assert.deepEqual(r.pontos, { j1: 300, j2: 150, j3: 0, j4: 150 });
});

test("acusado inocente: impostor vence", async () => {
  const { sala, resultados } = await iniciada();
  jogarAteVotacao(sala);
  votar(sala, { j1: "j2", j2: "j3", j3: "j2", j4: "j2" });
  segundos(CONFIG.SEG_REVELACAO);
  assert.equal(sala.fase, FASES.FIM);
  assert.equal(resultados[0].vencedor, "impostor");
  assert.equal(resultados[0].motivo, "inocente");
  assert.deepEqual(resultados[0].pontos, { j1: 300, j2: 0, j3: 0, j4: 0 });
});

// ======================================================================
// Última chance
// ======================================================================

async function ateUltimaChance() {
  const ctx = await iniciada();
  jogarAteVotacao(ctx.sala);
  votar(ctx.sala, { j1: "j2", j2: "j1", j3: "j1", j4: "j3" });
  segundos(CONFIG.SEG_REVELACAO);
  assert.equal(ctx.sala.fase, FASES.ULTIMA_CHANCE);
  return ctx;
}

test("última chance: acertou (com acento/maiúscula/espaços) → impostor vence com +200", async () => {
  const { sala, resultados } = await ateUltimaChance();
  assert.match(sala.chutar("j2", "praia"), /Só o impostor/);
  assert.equal(sala.chutar("j1", "  PRÁIA "), null);
  assert.equal(resultados[0].vencedor, "impostor");
  assert.equal(resultados[0].motivo, "adivinhou");
  assert.deepEqual(resultados[0].pontos, { j1: 200, j2: 150, j3: 150, j4: 0 });
});

test("última chance: errou → tripulantes vencem", async () => {
  const { sala, resultados } = await ateUltimaChance();
  assert.equal(sala.chutar("j1", "escola"), null);
  assert.equal(resultados[0].vencedor, "tripulantes");
  assert.equal(resultados[0].motivo, "errou");
  assert.deepEqual(resultados[0].pontos, { j1: 0, j2: 200, j3: 200, j4: 50 });
});

test("última chance: 15s sem chute conta como erro; só um chute", async () => {
  const { sala, resultados } = await ateUltimaChance();
  segundos(CONFIG.SEG_ULTIMA_CHANCE);
  assert.equal(sala.fase, FASES.FIM);
  assert.equal(resultados[0].vencedor, "tripulantes");
  assert.match(sala.chutar("j1", "praia"), /não é hora/);
});

// ======================================================================
// Desconexão
// ======================================================================

test("desconexão: quem caiu tem a dica em branco na vez dele e volta dentro de 30s", async () => {
  const { sala, enviados } = await iniciada();
  segundos(CONFIG.SEG_CARTAS);
  const vez = sala.vezDe;
  const caido = sala.partida.ordem.find((id) => id !== vez);
  const n = caido.slice(1);
  sala.sair(`s${n}`);
  while (sala.fase === FASES.DICAS && sala.partida.rodada === 1) {
    if (sala.vezDe) sala.darDica(sala.vezDe, "ok");
    else segundos(1); // pausa da última dica
  }
  const dicaDoCaido = sala.partida.dicas.find((d) => d.jogadorId === caido && d.rodada === 1);
  assert.equal(dicaDoCaido.texto, "");
  assert.ok(sala.ehAtivo(caido));

  const cartasAntes = enviados.filter((e) => e.para === caido && e.evento === "impostor-carta").length;
  sala.entrar({ id: caido, nickname: "Volta" }, `s${n}b`);
  assert.ok(sala.ehAtivo(caido));
  assert.equal(enviados.filter((e) => e.para === caido && e.evento === "impostor-carta").length, cartasAntes + 1);
  segundos(CONFIG.SEG_TOLERANCIA + 5);
  assert.ok(sala.ehAtivo(caido)); // voltou a tempo: continua
});

test("desconexão: depois de 30s fora, sai da partida e é pulado", async () => {
  const { sala } = await iniciada({ n: 5 });
  sala.sair("s5"); // cai ainda na carta; a rodada 1 anda devagar (30s por dica)
  segundos(CONFIG.SEG_TOLERANCIA - 1);
  assert.equal(sala.ehAtivo("j5"), true);
  segundos(1);
  assert.equal(sala.ehAtivo("j5"), false);
  assert.equal(sala.partida.rodada, 1);
  while (sala.fase === FASES.DICAS) {
    if (sala.vezDe) sala.darDica(sala.vezDe, "ok");
    else segundos(1); // pausa da última dica
  }
  assert.equal(sala.fase, FASES.VOTACAO);
  assert.ok(!sala.partida.dicas.some((d) => d.jogadorId === "j5" && d.rodada === 2));
  assert.match(sala.votar("j2", "j5"), /não está na partida/);
});

test("desconexão: votação fecha quando todos os CONECTADOS votaram", async () => {
  const { sala } = await iniciada({ n: 5 });
  jogarAteVotacao(sala);
  sala.sair("s5");
  votar(sala, { j1: "j2", j2: "j1", j3: "j1", j4: "j1" });
  assert.equal(sala.fase, FASES.REVELACAO);
});

test("IMPOSTOR SAI DE VEZ: partida termina e ninguém pontua", async () => {
  const { sala, resultados } = await iniciada();
  jogarAteVotacao(sala);
  sala.sair("s1"); // impostor caiu
  segundos(CONFIG.SEG_TOLERANCIA - 1);
  assert.equal(resultados.length, 0);
  segundos(1);
  assert.equal(sala.fase, FASES.FIM);
  assert.equal(resultados[0].vencedor, "cancelada");
  assert.equal(resultados[0].motivo, "impostor_saiu");
  assert.deepEqual(resultados[0].pontos, {});
});

test("impostor clica em Sair: cancela na hora", async () => {
  const { sala, resultados } = await iniciada();
  segundos(CONFIG.SEG_CARTAS);
  sala.sairDeVez("j1");
  assert.equal(sala.fase, FASES.FIM);
  assert.equal(resultados[0].motivo, "impostor_saiu");
});

test("MENOS DE 3 JOGADORES: partida é encerrada", async () => {
  const { sala, resultados } = await iniciada();
  segundos(CONFIG.SEG_CARTAS);
  sala.sairDeVez("j2");
  assert.notEqual(sala.fase, FASES.FIM); // ainda 3
  sala.sairDeVez("j3");
  assert.equal(sala.fase, FASES.FIM);
  assert.equal(resultados[0].vencedor, "cancelada");
  assert.equal(resultados[0].motivo, "poucos_jogadores");
  assert.deepEqual(resultados[0].pontos, {});
});

test("quem sai não pontua; quem ficou pontua normalmente", async () => {
  const { sala, resultados } = await iniciada({ n: 5 });
  jogarAteVotacao(sala);
  votar(sala, { j5: "j1" });
  sala.sairDeVez("j5");
  votar(sala, { j1: "j2", j2: "j1", j3: "j1", j4: "j1" });
  segundos(CONFIG.SEG_REVELACAO);
  sala.chutar("j1", "nada");
  assert.equal(resultados[0].pontos.j5, undefined);
  assert.equal(resultados[0].pontos.j2, 200);
});

// ======================================================================
// Sala
// ======================================================================

test("quem entra no meio da partida só assiste (sem carta, sem dica, sem voto)", async () => {
  const { sala, enviados } = await iniciada();
  sala.entrar({ id: "j9", nickname: "Atrasado" }, "s9");
  assert.equal(enviados.filter((e) => e.para === "j9" && e.evento === "impostor-carta").length, 0);
  assert.match(sala.cartaVista("j9"), /não está nesta partida/);
  jogarAteVotacao(sala);
  assert.match(sala.votar("j9", "j1"), /não está nesta partida/);
  assert.ok(!sala.partida.ordem.includes("j9"));
  assert.ok(!JSON.stringify(ultimoEstado(enviados, "j9")).toLowerCase().includes("praia"));
});

test("anfitrião que recarrega a página no lobby continua anfitrião", async () => {
  const { sala } = criarSala();
  sala.sair("s1");
  assert.equal(sala.anfitriaoId, "j1");
  segundos(CONFIG.SEG_TOLERANCIA_SALA - 1);
  sala.entrar({ id: "j1", nickname: "Jogador1" }, "s1b");
  assert.equal(sala.anfitriaoId, "j1");
  segundos(CONFIG.SEG_TOLERANCIA_SALA * 2);
  assert.ok(sala.jogadores.has("j1"));
  assert.equal(await sala.iniciar("j1"), null);
});

test("anfitrião que não volta: o posto passa pro próximo depois da tolerância", () => {
  const { sala } = criarSala();
  sala.sair("s1");
  segundos(CONFIG.SEG_TOLERANCIA_SALA);
  assert.equal(sala.jogadores.has("j1"), false);
  assert.equal(sala.anfitriaoId, "j2");
});

test("anfitrião que clica em Sair perde o posto na hora", () => {
  const { sala } = criarSala();
  sala.sairDeVez("j1");
  assert.equal(sala.anfitriaoId, "j2");
  assert.equal(sala.jogadores.has("j1"), false);
});

test("quem cai no lobby não conta pro mínimo, mas segura a vaga", async () => {
  const { sala } = criarSala();
  sala.sair("s4");
  assert.match(await sala.iniciar("j1"), /pelo menos 4/);
  sala.entrar({ id: "j4", nickname: "Jogador4" }, "s4b");
  assert.equal(await sala.iniciar("j1"), null);
});

test("quem caiu na partida e não voltou até o FIM tem a tolerância da sala", async () => {
  const { sala } = await iniciada({ n: 5 });
  jogarAteVotacao(sala);
  sala.sair("s5");
  votar(sala, { j1: "j2", j2: "j1", j3: "j1", j4: "j1" });
  segundos(CONFIG.SEG_REVELACAO);
  sala.chutar("j1", "x");
  assert.equal(sala.fase, FASES.FIM);
  assert.ok(sala.jogadores.has("j5"));
  segundos(CONFIG.SEG_TOLERANCIA_SALA);
  assert.equal(sala.jogadores.has("j5"), false);
});

test("FIM → LOBBY: só o anfitrião, ou sozinho depois do tempo", async () => {
  const { sala } = await ateUltimaChance();
  sala.chutar("j1", "x");
  assert.match(sala.proxima("j2"), /anfitrião/);
  assert.equal(sala.proxima("j1"), null);
  assert.equal(sala.fase, FASES.LOBBY);
  assert.equal(sala.partida, null);
  assert.equal(await sala.iniciar("j1"), null); // dá pra jogar de novo

  const b = await ateUltimaChance();
  b.sala.chutar("j1", "x");
  segundos(CONFIG.SEG_FIM);
  assert.equal(b.sala.fase, FASES.LOBBY);
});

test("relógio: o servidor manda o tempo restante a cada segundo", async () => {
  const { enviados } = await iniciada();
  const antes = enviados.filter((e) => e.evento === "impostor-tempo").length;
  segundos(3);
  const tiques = enviados.filter((e) => e.evento === "impostor-tempo").slice(antes);
  assert.equal(tiques.length, 3 * 4);
  assert.equal(tiques.at(-1).dados.fase, FASES.CARTAS);
  assert.equal(tiques.at(-1).dados.restanteMs, (CONFIG.SEG_CARTAS - 3) * 1000);
});

test("parar() desliga todos os timers da sala", async () => {
  const { sala, enviados } = await iniciada();
  sala.parar();
  const n = enviados.length;
  segundos(120);
  assert.equal(enviados.length, n);
});

// ======================================================================
// Bots de teste
// ======================================================================

function salaComBots(nBots, { aleatorio = () => 0 } = {}) {
  const ctx = criarSala({ n: 1, aleatorio });
  ctx.sala.palavrasDoTema = () => ["Praia", "Escola"];
  for (let i = 0; i < nBots; i++) assert.equal(ctx.sala.adicionarBot("j1"), null);
  return ctx;
}

test("bots: só o anfitrião chama, só no lobby, e bot nunca vira anfitrião", async () => {
  const { sala } = criarSala({ n: 2 });
  assert.match(sala.adicionarBot("j2"), /anfitrião/);
  assert.equal(sala.adicionarBot("j1"), null);
  const bot = [...sala.jogadores.values()].find((j) => j.bot);
  assert.equal(bot.nickname, "Robô 1");
  sala.sairDeVez("j1");
  assert.equal(sala.anfitriaoId, "j2"); // pulou o bot
  sala.sairDeVez("j2");
  assert.equal(sala.anfitriaoId, null);
  assert.equal(sala.vazia(), true); // só bot = vazia (sala é descartada)
});

test("bots: contam pro mínimo de 4 e jogam a partida inteira sozinhos", async () => {
  const { sala, resultados } = salaComBots(3);
  assert.equal(await sala.iniciar("j1"), null);
  assert.match(sala.adicionarBot("j1"), /sala de espera/);
  for (let i = 0; i < 400 && sala.fase !== FASES.FIM; i++) {
    if (sala.fase === FASES.CARTAS) sala.cartaVista("j1");
    if (sala.vezDe === "j1") sala.darDica("j1", "areia");
    if (sala.fase === FASES.VOTACAO && !sala.partida.votos.has("j1")) {
      sala.votar("j1", [...sala.jogadores.keys()].find((id) => id !== "j1"));
    }
    if (sala.fase === FASES.ULTIMA_CHANCE && sala.partida.impostorId === "j1") sala.chutar("j1", "praia");
    segundos(1);
  }
  assert.equal(sala.fase, FASES.FIM);
  const dicasDosBots = sala.partida.dicas.filter((d) => d.jogadorId.startsWith("bot-"));
  assert.equal(dicasDosBots.length, 6); // 3 bots x 2 rodadas, nenhuma em branco por tempo
  assert.ok(dicasDosBots.every((d) => d.texto));
  assert.equal(sala.partida.votos.size, 4);
  assert.equal(resultados[0].comBots, true);
});

test("bots: bot impostor recebe só o tema e chuta uma palavra do tema", async () => {
  // aleatorio perto de 1: o impostor sorteado é o último a entrar (um bot).
  const { sala } = salaComBots(3, { aleatorio: () => 0.99 });
  await sala.iniciar("j1");
  const impId = sala.partida.impostorId;
  assert.ok(impId.startsWith("bot-"));
  assert.deepEqual(sala.cerebros.get(impId).carta, { papel: "impostor", tema: TEMA });
  for (const [id, c] of sala.cerebros) if (id !== impId) assert.equal(c.carta.palavra, PALAVRA);
  // Força o bot impostor a ser acusado e espera o chute dele.
  segundos(CONFIG.SEG_CARTAS);
  sala.cartaVista("j1");
  for (let i = 0; i < 300 && sala.fase !== FASES.VOTACAO; i++) { if (sala.vezDe === "j1") sala.darDica("j1", "areia"); segundos(1); }
  sala.votar("j1", impId);
  for (const id of sala.cerebros.keys()) if (id !== impId) sala.partida.votos.set(id, impId);
  sala.apurar();
  segundos(CONFIG.SEG_REVELACAO);
  assert.equal(sala.fase, FASES.ULTIMA_CHANCE);
  segundos(6);
  assert.equal(sala.fase, FASES.FIM);
  assert.ok(["Praia", "Escola"].includes(sala.partida.chute));
});

test("bots: estado avisa que a sala não vale ranking; remover bots limpa tudo", () => {
  const { sala, enviados } = salaComBots(2);
  const est = ultimoEstado(enviados, "j1");
  assert.equal(est.temBots, true);
  assert.equal(est.valeRanking, false);
  assert.equal(est.jogadores.filter((j) => j.bot).length, 2);
  assert.equal(sala.removerBots("j1"), null);
  assert.equal(sala.temBots(), false);
  assert.equal(sala.cerebros.size, 0);
  assert.equal(ultimoEstado(enviados, "j1").jogadores.length, 1);
});

test("bots: nenhum pacote de bot vai pro socket (enviar)", async () => {
  const { sala, enviados } = salaComBots(3);
  await sala.iniciar("j1");
  segundos(40);
  assert.ok(enviados.every((e) => !String(e.para).startsWith("bot-")));
});
