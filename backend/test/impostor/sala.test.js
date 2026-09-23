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

// Pula a carta e dá as dicas das 2 rodadas.
function jogarAteVotacao(sala) {
  segundos(CONFIG.SEG_CARTAS);
  let n = 0;
  while (sala.fase === FASES.DICAS) {
    assert.equal(sala.darDica(sala.vezDe, `dica${n++}`), null);
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
  assert.deepEqual(sala.partida.dicas[0], { rodada: 1, jogadorId: primeiro, texto: "" });
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

test("fora de fase: não dá pra votar nas dicas nem dar dica na votação", async () => {
  const { sala } = await iniciada();
  segundos(CONFIG.SEG_CARTAS);
  assert.match(sala.votar("j2", "j1"), /não é hora/);
  jogarAteVotacao(sala);
  assert.match(sala.darDica("j2", "areia"), /não é hora/);
  assert.match(sala.chutar("j1", "praia"), /não é hora/);
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
  while (sala.fase === FASES.DICAS) sala.darDica(sala.vezDe, "ok");
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

test("anfitrião passa pro próximo quando sai", () => {
  const { sala } = criarSala();
  sala.sair("s1");
  assert.equal(sala.anfitriaoId, "j2");
  assert.equal(sala.jogadores.has("j1"), false);
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
