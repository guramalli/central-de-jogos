import { test, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { ImpostorRoom, FASES, CONFIG } from "../../src/impostor/ImpostorRoom.js";

// SÉRIE de partidas (1, 3 ou 5 no mesmo modo, placar somado). Relógio falso
// como em sala.test.js; o início de cada partida é assíncrono (o sorteio vai
// ao banco), então depois de um tique que começa partida é preciso `soltar()`.

beforeEach(() => mock.timers.enable({ apis: ["setTimeout", "setInterval", "Date"] }));
afterEach(() => mock.timers.reset());

const segundos = (s) => mock.timers.tick(s * 1000);
// Deixa terminar o que ficou pendente em promessas (setImmediate não é falso).
const soltar = () => new Promise((r) => setImmediate(r));

// Gerador previsível (os bots e o sorteio usam `aleatorio`).
function semente(n) {
  let x = n >>> 0;
  return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 2 ** 32; };
}

function criarSala({ n = 4, aleatorio = () => 0, config } = {}) {
  const enviados = [];
  const resultados = [];
  let k = 0;
  const sala = new ImpostorRoom({
    codigo: "SER-01",
    enviar: (para, evento, dados) => enviados.push({ para, evento, dados: structuredClone(dados) }),
    sortearPalavra: async () => ({ tema: "Lugares", palavra: `Palavra${++k}` }),
    aoFimDePartida: (r) => resultados.push(r),
    aleatorio,
    config,
  });
  for (let i = 1; i <= n; i++) sala.entrar({ id: `j${i}`, nickname: `Jogador${i}` }, `s${i}`);
  return { sala, enviados, resultados };
}

const ultimoEstado = (enviados, para) =>
  enviados.filter((e) => e.para === para && e.evento === "impostor-estado").at(-1)?.dados;

// Joga uma partida inteira com humanos. pegar = todos votam no impostor (e
// ele erra a última chance); senão, todos votam num inocente.
function jogarPartida(sala, { pegar = true } = {}) {
  assert.equal(sala.fase, FASES.CARTAS);
  const p = sala.partida;
  for (const j of sala.ativos()) sala.cartaVista(j.id);
  let n = 0;
  while (sala.fase === FASES.DICAS) {
    if (sala.vezDe) assert.equal(sala.darDica(sala.vezDe, `dica${n++}`), null);
    else segundos(CONFIG.SEG_ULTIMA_DICA);
  }
  assert.equal(sala.fase, FASES.VOTACAO);
  const ids = sala.ativos().map((j) => j.id);
  const inocentes = ids.filter((id) => id !== p.impostorId);
  const alvo = pegar ? p.impostorId : inocentes[0];
  for (const id of ids) {
    const voto = id !== alvo ? alvo : (pegar ? inocentes[0] : inocentes[1]);
    if (sala.fase === FASES.VOTACAO) assert.equal(sala.votar(id, voto), null);
  }
  assert.equal(sala.fase, FASES.REVELACAO);
  segundos(CONFIG.SEG_REVELACAO);
  if (sala.fase === FASES.ULTIMA_CHANCE) {
    const chute = p.opcoes ? p.opcoes.findIndex((o) => o !== p.palavra) : "nada a ver";
    assert.equal(sala.chutar(p.impostorId, chute), null);
  }
  assert.equal(sala.fase, FASES.FIM);
}

async function proximaPelaContagem(sala) {
  segundos(CONFIG.SEG_ENTRE_PARTIDAS);
  await soltar();
  assert.equal(sala.fase, FASES.CARTAS);
}

// ======================================================================
// Escolha do tamanho da série
// ======================================================================

test("série: padrão 3 no lobby; só o anfitrião, só no lobby e só 1/3/5", async () => {
  const { sala, enviados } = criarSala();
  const lobby = ultimoEstado(enviados, "j2");
  assert.equal(lobby.partidasDaSerie, CONFIG.PARTIDAS_SERIE);
  assert.equal(CONFIG.PARTIDAS_SERIE, 3);
  assert.deepEqual(lobby.opcoesSerie, [1, 3, 5]);
  assert.equal(lobby.serie, undefined);

  assert.match(sala.definirSerie("j2", 5), /anfitrião/);
  for (const ruim of [0, 2, 4, 6, "3", 3.5, null, undefined]) assert.match(sala.definirSerie("j1", ruim), /1, 3 ou 5/);
  assert.equal(sala.partidasSerie, 3);
  assert.equal(sala.definirSerie("j1", 5), null);
  assert.equal(ultimoEstado(enviados, "j3").partidasDaSerie, 5);

  // Junto do "Iniciar": valor ruim não começa nada.
  assert.match(await sala.iniciar("j1", null, 7), /1, 3 ou 5/);
  assert.equal(sala.fase, FASES.LOBBY);
  assert.equal(await sala.iniciar("j1", null, 1), null);
  assert.equal(sala.serie.total, 1);
  assert.match(sala.definirSerie("j1", 3), /sala de espera/);
  const est = ultimoEstado(enviados, "j2");
  assert.deepEqual(est.serie, { partida: 1, total: 1, encerrada: false, motivoFim: null });
  assert.equal(est.partidasDaSerie, undefined); // só no lobby
});

// ======================================================================
// Série inteira
// ======================================================================

test("série de 3: soma por partida, impostor muda, contagem entre partidas, ranking final e volta ao lobby", async () => {
  const { sala, enviados, resultados } = criarSala({ n: 5 });
  assert.equal(await sala.iniciar("j1"), null);
  const impostores = [];

  for (let n = 1; n <= 3; n++) {
    assert.equal(sala.partida.numero, n);
    assert.equal(ultimoEstado(enviados, "j2").serie.partida, n);
    // Durante a partida, nada de placar (nem de quem já foi impostor).
    assert.equal(ultimoEstado(enviados, "j2").serie.ranking, undefined);
    impostores.push(sala.partida.impostorId);
    jogarPartida(sala, { pegar: n !== 2 });
    const est = ultimoEstado(enviados, "j3");
    assert.equal(est.fase, FASES.FIM);
    assert.equal(est.serie.ranking.length, 5);
    if (n < 3) {
      assert.equal(est.serie.encerrada, false);
      assert.equal(est.restanteMs, CONFIG.SEG_ENTRE_PARTIDAS * 1000);
      await proximaPelaContagem(sala);
    }
  }

  // Um ImpostorPartida por partida, como antes.
  assert.equal(resultados.length, 3);
  assert.deepEqual(resultados.map((r) => r.serie), [1, 2, 3].map((partida) => ({ partida, total: 3 })));
  // Nunca o mesmo impostor em duas partidas seguidas.
  for (let i = 1; i < impostores.length; i++) assert.notEqual(impostores[i], impostores[i - 1]);
  // aleatorio = 0: o primeiro dos que ainda não foram.
  assert.deepEqual(impostores, ["j1", "j2", "j3"]);

  const final = ultimoEstado(enviados, "j4");
  assert.equal(final.serie.encerrada, true);
  assert.equal(final.serie.motivoFim, "completa");
  assert.equal(final.restanteMs, CONFIG.SEG_FIM * 1000);
  for (const linha of final.serie.ranking) {
    const porPartida = resultados.map((r) => r.pontos[linha.id] ?? 0);
    assert.deepEqual(linha.pontos, porPartida);
    assert.equal(linha.total, porPartida.reduce((a, b) => a + b, 0));
    assert.equal(linha.impostor, impostores.filter((id) => id === linha.id).length);
    assert.equal(linha.nickname, `Jogador${linha.id.slice(1)}`);
  }
  // Pegos: j1 (partida 1) e j3 (partida 3); j2 escapou.
  const por = Object.fromEntries(final.serie.ranking.map((l) => [l.id, l]));
  assert.equal(por.j1.descoberto, 1);
  assert.equal(por.j2.descoberto, 0);
  assert.equal(por.j3.descoberto, 1);
  // Ordenado, com posição repetida no empate.
  const r = final.serie.ranking;
  for (let i = 1; i < r.length; i++) {
    assert.ok(r[i - 1].total >= r[i].total);
    assert.equal(r[i].posicao, r[i - 1].total === r[i].total ? r[i - 1].posicao : i + 1);
  }

  // Não começa uma 4ª: no fim do SEG_FIM, lobby (série zerada, jogadores ficam).
  segundos(CONFIG.SEG_FIM - 1);
  await soltar();
  assert.equal(sala.fase, FASES.FIM);
  segundos(1);
  assert.equal(sala.fase, FASES.LOBBY);
  assert.equal(sala.serie, null);
  assert.equal(sala.jogadores.size, 5);
  assert.equal(ultimoEstado(enviados, "j1").serie, undefined);
});

test("série: a partida seguinte tem segredo novo, carta nova e o mesmo modo", async () => {
  const { sala, enviados } = criarSala({ config: { PARTIDAS_SERIE: 3 } });
  sala.definirModo("j1", "situacao");
  await sala.iniciar("j1");
  const s1 = sala.partida.palavra;
  jogarPartida(sala);
  const cartasAntes = enviados.filter((e) => e.evento === "impostor-carta").length;
  await proximaPelaContagem(sala);
  assert.equal(sala.partida.modo, "situacao");
  assert.notEqual(sala.partida.palavra, s1);
  assert.equal(enviados.filter((e) => e.evento === "impostor-carta").length, cartasAntes + 4);
  assert.equal(ultimoEstado(enviados, "j1").modo, "situacao");
});

test("série: 'Próxima partida' do anfitrião pula a contagem; os outros não podem", async () => {
  const { sala, enviados } = criarSala();
  await sala.iniciar("j1");
  jogarPartida(sala);
  segundos(3);
  assert.match(sala.proxima("j2"), /anfitrião/);
  assert.equal(sala.proxima("j1"), null);
  await soltar();
  assert.equal(sala.fase, FASES.CARTAS);
  assert.equal(sala.partida.numero, 2);
  assert.equal(ultimoEstado(enviados, "j2").restanteMs, CONFIG.SEG_CARTAS * 1000);
  // A contagem antiga não dispara de novo por cima da partida 2.
  segundos(CONFIG.SEG_ENTRE_PARTIDAS);
  await soltar();
  assert.equal(sala.partida.numero, 2);
  assert.notEqual(sala.fase, FASES.FIM);
});

test("série: no fim da última, 'Jogar outra série' (proxima) volta ao lobby com todos", async () => {
  const { sala } = criarSala({ config: { PARTIDAS_SERIE: 3 } });
  sala.definirSerie("j1", 3);
  await sala.iniciar("j1");
  for (let n = 1; n <= 3; n++) {
    jogarPartida(sala);
    if (n < 3) { assert.equal(sala.proxima("j1"), null); await soltar(); }
  }
  assert.equal(sala.serie.encerrada, true);
  assert.equal(sala.proxima("j1"), null);
  assert.equal(sala.fase, FASES.LOBBY);
  assert.equal(sala.partidasSerie, 3); // a escolha continua
  assert.equal(await sala.iniciar("j1"), null);
  assert.equal(sala.serie.numero, 1);
});

// ======================================================================
// Impostor da série
// ======================================================================

test("série: impostor nunca repete em partidas seguidas (5 partidas, 4 jogadores, sorteio aleatório)", async () => {
  for (let s = 1; s <= 8; s++) {
    const { sala } = criarSala({ aleatorio: semente(s) });
    sala.definirSerie("j1", 5);
    await sala.iniciar("j1");
    const vistos = [];
    for (let n = 1; n <= 5; n++) {
      vistos.push(sala.partida.impostorId);
      jogarPartida(sala, { pegar: n % 2 === 0 });
      if (n < 5) await proximaPelaContagem(sala);
    }
    for (let i = 1; i < vistos.length; i++) assert.notEqual(vistos[i], vistos[i - 1], `semente ${s}: ${vistos}`);
    sala.parar();
  }
});

test("série: quem ainda não foi impostor tem preferência (peso), sem virar regra", () => {
  const { sala } = criarSala({ n: 4 });
  const participantes = sala.ativos().length ? sala.ativos() : [...sala.jogadores.values()];
  const serie = sala.novaSerie();
  serie.impostores = new Set(["j1", "j2"]);
  serie.ultimoImpostor = "j2";
  // Lista: j3, j4 (inéditos, peso 2) e j1 (peso 1) → total 5.
  const sorteio = (r) => { sala.aleatorio = () => r; return sala.sortearImpostor(participantes, serie).id; };
  assert.equal(sorteio(0), "j3");
  assert.equal(sorteio(0.39), "j3");
  assert.equal(sorteio(0.41), "j4");
  assert.equal(sorteio(0.81), "j1"); // já foi, mas pode de novo
  for (const r of [0, 0.2, 0.5, 0.7, 0.99]) assert.notEqual(sorteio(r), "j2"); // o anterior, nunca
});

// ======================================================================
// Gente saindo
// ======================================================================

test("série: alguém sai de vez entre partidas e a sala fica abaixo do mínimo → ranking final na hora", async () => {
  const { sala, enviados, resultados } = criarSala();
  await sala.iniciar("j1");
  jogarPartida(sala);
  assert.equal(sala.serie.encerrada, false);
  sala.sairDeVez("j4");
  const est = ultimoEstado(enviados, "j2");
  assert.equal(est.fase, FASES.FIM);
  assert.equal(est.serie.encerrada, true);
  assert.equal(est.serie.motivoFim, "poucos_jogadores");
  assert.equal(est.restanteMs, CONFIG.SEG_FIM * 1000);
  // Quem saiu continua no ranking, com nome e cor.
  const j4 = est.serie.ranking.find((l) => l.id === "j4");
  assert.equal(j4.nickname, "Jogador4");
  assert.ok(j4.cor);
  segundos(CONFIG.SEG_ENTRE_PARTIDAS);
  await soltar();
  assert.equal(sala.fase, FASES.FIM); // não começa outra
  assert.equal(resultados.length, 1);
  segundos(CONFIG.SEG_FIM - CONFIG.SEG_ENTRE_PARTIDAS);
  assert.equal(sala.fase, FASES.LOBBY);
});

test("série: queda entre partidas — se na hora da próxima não houver o mínimo conectado, a série acaba", async () => {
  const { sala, enviados } = criarSala();
  await sala.iniciar("j1");
  jogarPartida(sala);
  sala.sair("s4"); // caiu (ainda segura a vaga)
  assert.equal(sala.serie.encerrada, false);
  segundos(CONFIG.SEG_ENTRE_PARTIDAS);
  await soltar();
  assert.equal(sala.fase, FASES.FIM);
  const est = ultimoEstado(enviados, "j1");
  assert.equal(est.serie.encerrada, true);
  assert.equal(est.serie.motivoFim, "poucos_jogadores");
});

test("série: quem cai e volta durante a contagem joga a próxima", async () => {
  const { sala } = criarSala();
  await sala.iniciar("j1");
  jogarPartida(sala);
  sala.sair("s4");
  segundos(5);
  sala.entrar({ id: "j4", nickname: "Jogador4" }, "s4b");
  await proximaPelaContagem(sala);
  assert.equal(sala.ativos().length, 4);
});

test("série: partida cancelada (impostor saiu) conta 0 e a série segue; quem saiu fica no ranking", async () => {
  const { sala, enviados, resultados } = criarSala({ n: 5 });
  await sala.iniciar("j1");
  jogarPartida(sala);
  await proximaPelaContagem(sala);
  const imp = sala.partida.impostorId;
  sala.sairDeVez(imp);
  assert.equal(sala.fase, FASES.FIM);
  assert.equal(resultados[1].vencedor, "cancelada");
  const est = ultimoEstado(enviados, "j3");
  assert.equal(est.serie.encerrada, false); // ainda 4 na sala
  const saiu = est.serie.ranking.find((l) => l.id === imp);
  assert.equal(saiu.pontos[1], 0);
  assert.equal(saiu.impostor, 1);
  assert.equal(saiu.descoberto, 0);
  await proximaPelaContagem(sala);
  assert.equal(sala.partida.numero, 3);
  assert.ok(!sala.partida.participantes.includes(imp));
});

test("série: quem chega no meio assiste e entra na partida seguinte (null nas que não jogou)", async () => {
  const { sala, enviados } = criarSala();
  await sala.iniciar("j1");
  sala.entrar({ id: "j9", nickname: "Atrasado" }, "s9");
  jogarPartida(sala);
  await proximaPelaContagem(sala);
  assert.ok(sala.partida.participantes.includes("j9"));
  jogarPartida(sala);
  const j9 = ultimoEstado(enviados, "j9").serie.ranking.find((l) => l.id === "j9");
  assert.equal(j9.pontos[0], null);
  assert.equal(typeof j9.pontos[1], "number");
});

// ======================================================================
// Bots
// ======================================================================

test("série com bots: 3 partidas inteiras sozinhas, placar somado e volta ao lobby", async () => {
  const { sala, resultados, enviados } = criarSala({ n: 1, aleatorio: semente(7) });
  sala.palavrasDoTema = () => ["Praia", "Escola"];
  for (let i = 0; i < 4; i++) assert.equal(sala.adicionarBot("j1"), null);
  assert.equal(await sala.iniciar("j1"), null);
  const impostores = [sala.partida.impostorId];
  const conferidas = new Set();

  for (let i = 0; i < 2000 && !(sala.fase === FASES.FIM && sala.serie.encerrada); i++) {
    const p = sala.partida;
    if (sala.fase === FASES.CARTAS) sala.cartaVista("j1");
    if (sala.vezDe === "j1") sala.darDica("j1", "areia");
    if (sala.fase === FASES.VOTACAO && !p.votos.has("j1")) sala.votar("j1", sala.ativos().find((j) => j.id !== "j1").id);
    if (sala.fase === FASES.ULTIMA_CHANCE && p.impostorId === "j1") sala.chutar("j1", "praia");
    segundos(1);
    await soltar();
    if (sala.partida && sala.partida !== p && sala.fase !== FASES.FIM) impostores.push(sala.partida.impostorId);
    if (sala.fase === FASES.FIM && !conferidas.has(sala.partida)) {
      conferidas.add(sala.partida);
      const dosBots = sala.partida.dicas.filter((d) => d.jogadorId.startsWith("bot-"));
      assert.equal(dosBots.length, 8); // 4 bots x 2 rodadas, nenhuma em branco por tempo
      assert.ok(dosBots.every((d) => d.texto));
      assert.equal(sala.partida.votos.size, 5);
    }
  }
  assert.equal(conferidas.size, 3);
  assert.equal(sala.fase, FASES.FIM);
  assert.equal(sala.serie.encerrada, true);
  assert.equal(resultados.length, 3);
  assert.ok(resultados.every((r) => r.vencedor !== "cancelada" && r.comBots));
  assert.equal(impostores.length, 3);
  for (let i = 1; i < 3; i++) assert.notEqual(impostores[i], impostores[i - 1]);
  for (const r of resultados) assert.equal(Object.keys(r.pontos).length, 5);
  const ranking = ultimoEstado(enviados, "j1").serie.ranking;
  assert.equal(ranking.length, 5);
  assert.equal(ranking.filter((l) => l.bot).length, 4);
  for (const l of ranking) assert.equal(l.total, resultados.reduce((s, r) => s + (r.pontos[l.id] ?? 0), 0));
  segundos(CONFIG.SEG_FIM);
  assert.equal(sala.fase, FASES.LOBBY);
});

// ======================================================================
// Privacidade
// ======================================================================

test("SEGURANÇA série: segredo da partida 2 não vaza ao impostor antes do FIM dela; placar só no FIM", async () => {
  const { sala, enviados } = criarSala();
  await sala.iniciar("j1");
  jogarPartida(sala);
  const desde = enviados.length;
  await proximaPelaContagem(sala);
  const p = sala.partida;
  const segredo = p.palavra.toLowerCase();
  jogarPartida(sala, { pegar: false });
  const doImpostor = enviados.slice(desde).filter((e) => e.para === p.impostorId);
  const fim = doImpostor.findIndex((e) => e.evento === "impostor-estado" && e.dados.fase === FASES.FIM);
  assert.ok(fim > 0);
  for (const e of doImpostor.slice(0, fim)) {
    assert.ok(!JSON.stringify(e.dados).toLowerCase().includes(segredo), `vazou em ${e.evento}`);
    if (e.evento === "impostor-estado") assert.equal(e.dados.serie.ranking, undefined);
  }
});
