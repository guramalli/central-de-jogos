import { test, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { Filas, SEG_JUNTAR, SEG_ACEITAR } from "../../src/fila/filaDeEspera.js";

beforeEach(() => mock.timers.enable({ apis: ["setTimeout", "Date"] }));
afterEach(() => mock.timers.reset());
const segundos = (s) => mock.timers.tick(s * 1000);

function criar() {
  const enviados = [];
  const salas = [];
  const contagens = [];
  const sala = (jogo) => (g) => { salas.push({ jogo, ...g }); return { mesa: `SALA${salas.length}` }; };
  const jogos = {
    impostor: { nome: "Impostor", min: 4, max: 6, bots: true, criarSala: sala("impostor") },
    tribunal: { nome: "Tribunal", min: 3, max: 6, bots: true, criarSala: sala("tribunal") },
    acromania: { nome: "Acromania", min: 3, max: 8, bots: false, minComecarAgora: 2, criarSala: sala("acromania") },
  };
  const f = new Filas({ jogos, enviar: (para, evento, dados) => enviados.push({ para, evento, dados }), contagem: (c) => contagens.push(c) });
  const u = (id) => ({ id, nickname: id.toUpperCase() });
  const entrar = (jogo, ...ids) => ids.forEach((id) => assert.equal(f.entrar(u(id), jogo), null));
  const ultimo = (para, evento) => enviados.filter((e) => e.para === para && e.evento === evento).at(-1)?.dados;
  const idProposta = (para) => ultimo(para, "fila-proposta")?.id;
  const aceitar = (...ids) => ids.forEach((id) => assert.equal(f.responder(id, idProposta(id), true), null));
  return { f, u, enviados, salas, contagens, entrar, ultimo, idProposta, aceitar };
}

// ---------------- uma fila ----------------

test("fila: posição, contagem pública e sair", () => {
  const { f, entrar, ultimo, contagens } = criar();
  entrar("impostor", "a", "b");
  assert.deepEqual(contagens.at(-1), { impostor: 2, tribunal: 0, acromania: 0 });
  assert.equal(ultimo("b", "fila-estado").filas.impostor.posicao, 2);
  f.sair("a", "impostor");
  assert.equal(ultimo("b", "fila-estado").filas.impostor.posicao, 1);
  assert.deepEqual(ultimo("a", "fila-estado").filas, {});
});

test("fila: com o mínimo, espera 10s por mais gente e aí propõe a partida", () => {
  const { f, entrar, ultimo } = criar();
  entrar("impostor", "a", "b", "c", "d");
  assert.ok(ultimo("a", "fila-estado").filas.impostor.fechaEmMs > 0);
  entrar("impostor", "e");
  segundos(SEG_JUNTAR);
  assert.equal(ultimo("a", "fila-proposta").total, 5);
  assert.equal(f.contagens().impostor, 0);
  assert.deepEqual(ultimo("a", "fila-estado").filas, {});
});

test("fila: com o máximo, propõe na hora; o 7º continua esperando", () => {
  const { entrar, ultimo } = criar();
  entrar("impostor", "a", "b", "c", "d", "e", "f", "g");
  assert.equal(ultimo("a", "fila-proposta").total, 6);
  assert.equal(ultimo("g", "fila-proposta"), undefined);
  assert.equal(ultimo("g", "fila-estado").filas.impostor.posicao, 1);
});

test("proposta: todos aceitam → sala só com eles e todos recebem o destino", () => {
  const { entrar, salas, ultimo, aceitar } = criar();
  entrar("impostor", "a", "b", "c", "d");
  segundos(SEG_JUNTAR);
  aceitar("a", "b", "c", "d");
  assert.deepEqual(salas[0].membros.map((m) => m.id), ["a", "b", "c", "d"]);
  assert.deepEqual(ultimo("c", "fila-fim"), { ok: true, jogo: "impostor", destino: { mesa: "SALA1" } });
});

test("proposta: abaixo do mínimo, quem aceitou volta pro COMEÇO; quem recusou sai", () => {
  const { f, entrar, salas, ultimo, idProposta, aceitar } = criar();
  entrar("impostor", "a", "b", "c", "d");
  segundos(SEG_JUNTAR);
  entrar("impostor", "z");
  aceitar("a", "b");
  f.responder("c", idProposta("c"), false);
  segundos(SEG_ACEITAR);
  assert.equal(salas.length, 0);
  assert.equal(ultimo("a", "fila-fim").motivo, "voltou");
  assert.equal(ultimo("c", "fila-fim").motivo, "recusou");
  assert.equal(ultimo("a", "fila-estado").filas.impostor.posicao, 1);
  assert.equal(ultimo("b", "fila-estado").filas.impostor.posicao, 2);
  assert.equal(ultimo("z", "fila-estado").filas.impostor.posicao, 3);
  assert.deepEqual(f.filasDe("c"), []);
  assert.deepEqual(f.filasDe("d"), []);
});

test("bots só no manual; sozinho com bots, a sala sai na hora", () => {
  const { f, entrar, salas, ultimo } = criar();
  entrar("impostor", "a");
  segundos(120);
  assert.equal(ultimo("a", "fila-proposta"), undefined);
  assert.equal(f.comecarAgora("a", "impostor"), null);
  assert.equal(salas.length, 1);
  assert.equal(salas[0].comBots, true);
  assert.equal(ultimo("a", "fila-fim").ok, true);
});

test("'Jogar agora com bots' com outros na fila: quem clicou já aceitou, os outros confirmam", () => {
  const { f, entrar, salas, ultimo } = criar();
  entrar("impostor", "a", "b");
  assert.equal(f.comecarAgora("b", "impostor"), null);
  assert.equal(ultimo("a", "fila-proposta").aceitos, 1);
  segundos(SEG_ACEITAR);
  assert.deepEqual(salas[0].membros.map((m) => m.id), ["b"]);
});

test("jogo sem bots (Acromania): 'Começar com quem está' precisa de 2", () => {
  const { f, entrar, salas } = criar();
  entrar("acromania", "a");
  assert.match(f.comecarAgora("a", "acromania"), /pelo menos 2/);
  entrar("acromania", "b");
  assert.equal(f.comecarAgora("a", "acromania"), null);
  f.responder("b", f.propostaDe.get("b"), true);
  assert.equal(salas[0].comBots, false);
  assert.equal(salas[0].membros.length, 2);
});

// ---------------- várias filas ----------------

test("várias filas: dá pra colocar o nome em todas", () => {
  const { f, u, ultimo } = criar();
  assert.equal(f.entrarEmTodas(u("a")), null);
  assert.deepEqual(f.filasDe("a").sort(), ["acromania", "impostor", "tribunal"]);
  assert.deepEqual(Object.keys(ultimo("a", "fila-estado").filas).sort(), ["acromania", "impostor", "tribunal"]);
  f.sair("a"); // sem jogo: tira de todas
  assert.deepEqual(f.filasDe("a"), []);
});

test("várias filas: aceitou e a partida saiu → sai das outras filas", () => {
  const { f, u, entrar, salas, ultimo, aceitar } = criar();
  f.entrarEmTodas(u("a"));
  entrar("tribunal", "b", "c");
  segundos(SEG_JUNTAR);
  assert.equal(ultimo("a", "fila-proposta").jogo, "tribunal");
  aceitar("a", "b", "c");
  assert.equal(salas[0].jogo, "tribunal");
  assert.deepEqual(f.filasDe("a"), []);
  assert.deepEqual(ultimo("a", "fila-estado").filas, {});
  assert.equal(f.contagens().impostor, 0);
});

test("várias filas: enquanto confirma, fica PAUSADO nas outras (sem proposta dupla)", () => {
  const { f, u, entrar, ultimo } = criar();
  f.entrarEmTodas(u("a"));
  entrar("tribunal", "b", "c");
  segundos(SEG_JUNTAR); // proposta do Tribunal para a, b, c
  entrar("impostor", "x", "y", "z"); // Impostor tem a + x + y + z = 4, mas "a" está pausado
  segundos(SEG_JUNTAR);
  assert.equal(ultimo("x", "fila-proposta"), undefined); // não fechou grupo sem o "a"
  assert.equal(ultimo("a", "fila-estado").filas.impostor.pausado, true);
  assert.equal(ultimo("a", "fila-estado").filas.impostor.posicao, 1); // não perdeu o lugar
});

test("várias filas: recusou → sai só dessa fila e a outra volta a contar", () => {
  const { f, u, entrar, ultimo, idProposta, aceitar } = criar();
  f.entrarEmTodas(u("a"));
  entrar("tribunal", "b", "c");
  segundos(SEG_JUNTAR);
  entrar("impostor", "x", "y", "z");
  f.responder("a", idProposta("a"), false); // recusou o Tribunal
  aceitar("b", "c");
  assert.deepEqual(f.filasDe("a").sort(), ["acromania", "impostor"]);
  // Pausa acabou: o Impostor (a, x, y, z) começa a juntar e propõe.
  segundos(SEG_JUNTAR);
  assert.equal(ultimo("x", "fila-proposta").jogo, "impostor");
  assert.equal(ultimo("a", "fila-proposta").jogo, "impostor");
});

test("várias filas: não respondeu → tira o nome de TODAS", () => {
  const { f, u, entrar, ultimo, aceitar } = criar();
  f.entrarEmTodas(u("a"));
  entrar("tribunal", "b", "c");
  segundos(SEG_JUNTAR);
  aceitar("b", "c");
  segundos(SEG_ACEITAR);
  assert.deepEqual(f.filasDe("a"), []);
  assert.equal(ultimo("a", "fila-fim").motivo, "sem-resposta");
});

test("fechou todas as abas: sai de todas as filas e recusa a partida pendente", () => {
  const { f, u, entrar, ultimo, aceitar } = criar();
  f.entrarEmTodas(u("d"));
  entrar("impostor", "a", "b", "c");
  segundos(SEG_JUNTAR);
  f.desconectou("d");
  aceitar("a", "b", "c"); // 3 < 4: voltam pra fila
  assert.equal(ultimo("d", "fila-fim").motivo, "recusou");
  assert.deepEqual(f.filasDe("d"), []);
  assert.deepEqual(f.filasDe("a"), ["impostor"]);
});

test("com partida esperando confirmação, não dá pra colocar o nome em outra fila", () => {
  const { f, u, entrar } = criar();
  entrar("impostor", "a", "b", "c", "d");
  segundos(SEG_JUNTAR);
  assert.match(f.entrar(u("a"), "tribunal"), /confirmação/);
});

test("erro ao criar a sala: todo mundo volta pra fila", () => {
  const { f, entrar, ultimo, aceitar } = criar();
  f.jogos.impostor.criarSala = () => { throw new Error("falhou"); };
  const erroOriginal = console.error;
  console.error = () => {};
  try {
    entrar("impostor", "a", "b", "c", "d");
    segundos(SEG_JUNTAR);
    aceitar("a", "b", "c", "d");
  } finally { console.error = erroOriginal; }
  assert.equal(ultimo("a", "fila-fim").motivo, "voltou");
  assert.deepEqual(f.filasDe("a"), ["impostor"]);
});
