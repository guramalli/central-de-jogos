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
  const jogos = {
    impostor: { nome: "Impostor", min: 4, max: 6, bots: true, criarSala: (g) => { salas.push({ jogo: "impostor", ...g }); return { mesa: `SALA${salas.length}` }; } },
    acromania: { nome: "Acromania", min: 3, max: 8, bots: false, minComecarAgora: 2, criarSala: (g) => { salas.push({ jogo: "acromania", ...g }); return { acro: "a1" }; } },
  };
  const f = new Filas({ jogos, enviar: (para, evento, dados) => enviados.push({ para, evento, dados }), contagem: (c) => contagens.push(c) });
  const entrar = (...ids) => ids.forEach((id) => assert.equal(f.entrar({ id, nickname: id.toUpperCase() }, "impostor"), null));
  const ultimo = (para, evento) => enviados.filter((e) => e.para === para && e.evento === evento).at(-1)?.dados;
  const idProposta = (para) => ultimo(para, "fila-proposta")?.id;
  return { f, enviados, salas, contagens, entrar, ultimo, idProposta };
}

test("fila: posição, contagem pública e uma fila por pessoa", () => {
  const { f, entrar, ultimo, contagens } = criar();
  entrar("a", "b");
  assert.deepEqual(contagens.at(-1), { impostor: 2, acromania: 0 });
  assert.equal(ultimo("b", "fila-estado").posicao, 2);
  assert.equal(f.entrar({ id: "a", nickname: "A" }, "acromania"), null); // trocou de fila
  assert.deepEqual(f.contagens(), { impostor: 1, acromania: 1 });
  assert.equal(ultimo("b", "fila-estado").posicao, 1);
  f.sair("a");
  assert.deepEqual(f.contagens(), { impostor: 1, acromania: 0 });
});

test("fila: com o mínimo, espera 10s por mais gente e aí propõe a partida", () => {
  const { f, entrar, ultimo } = criar();
  entrar("a", "b", "c", "d");
  assert.ok(ultimo("a", "fila-estado").fechaEmMs > 0);
  assert.equal(ultimo("a", "fila-proposta"), undefined);
  entrar("e");
  segundos(SEG_JUNTAR);
  const p = ultimo("a", "fila-proposta");
  assert.equal(p.total, 5);
  assert.equal(p.comBots, false);
  assert.equal(f.contagens().impostor, 0); // saíram da fila enquanto confirmam
  assert.equal(ultimo("a", "fila-estado").jogo, null); // e a tela deles sabe disso
});

test("fila: com o máximo, propõe na hora", () => {
  const { entrar, ultimo } = criar();
  entrar("a", "b", "c", "d", "e", "f", "g");
  assert.equal(ultimo("a", "fila-proposta").total, 6);
  assert.equal(ultimo("g", "fila-proposta"), undefined); // o 7º continua na fila
  assert.equal(ultimo("g", "fila-estado").posicao, 1);
});

test("proposta: todos aceitam → sala criada só com eles, e todos recebem o destino", () => {
  const { f, entrar, salas, ultimo, idProposta } = criar();
  entrar("a", "b", "c", "d");
  segundos(SEG_JUNTAR);
  for (const id of ["a", "b", "c", "d"]) assert.equal(f.responder(id, idProposta(id), true), null);
  assert.equal(salas.length, 1);
  assert.deepEqual(salas[0].membros.map((m) => m.id), ["a", "b", "c", "d"]);
  assert.deepEqual(ultimo("c", "fila-fim"), { ok: true, jogo: "impostor", destino: { mesa: "SALA1" } });
});

test("proposta: ninguém é levado sem confirmar; quem não responde sai da fila", () => {
  const { f, entrar, salas, ultimo, idProposta } = criar();
  entrar("a", "b", "c", "d", "e");
  segundos(SEG_JUNTAR);
  for (const id of ["a", "b", "c", "d"]) f.responder(id, idProposta(id), true);
  segundos(SEG_ACEITAR);
  assert.deepEqual(salas[0].membros.map((m) => m.id), ["a", "b", "c", "d"]); // "e" ficou de fora
  assert.equal(ultimo("e", "fila-fim").motivo, "sem-resposta");
  assert.equal(f.filaDe("e"), null);
});

test("proposta: abaixo do mínimo, quem aceitou volta pro COMEÇO da fila; quem recusou sai", () => {
  const { f, entrar, salas, ultimo, idProposta } = criar();
  entrar("a", "b", "c", "d");
  segundos(SEG_JUNTAR);
  entrar("z"); // chegou depois, enquanto os 4 confirmavam
  f.responder("a", idProposta("a"), true);
  f.responder("b", idProposta("b"), true);
  f.responder("c", idProposta("c"), false);
  segundos(SEG_ACEITAR);
  assert.equal(salas.length, 0);
  assert.equal(ultimo("a", "fila-fim").motivo, "voltou");
  assert.equal(ultimo("c", "fila-fim").motivo, "recusou");
  assert.equal(ultimo("a", "fila-estado").posicao, 1);
  assert.equal(ultimo("b", "fila-estado").posicao, 2);
  assert.equal(ultimo("z", "fila-estado").posicao, 3);
  assert.equal(f.filaDe("c"), null);
  assert.equal(f.filaDe("d"), null);
});

test("bots só no manual: 'Começar agora com bots' propõe com quem está na fila", () => {
  const { f, entrar, salas, ultimo, idProposta } = criar();
  entrar("a", "b");
  segundos(120);
  assert.equal(ultimo("a", "fila-proposta"), undefined); // nada automático
  assert.equal(f.comecarAgora("b"), null);
  const p = ultimo("a", "fila-proposta");
  assert.equal(p.comBots, true);
  assert.equal(p.aceitos, 1); // quem clicou já aceitou
  assert.equal(ultimo("b", "fila-proposta").eu, "aceitei");
  segundos(SEG_ACEITAR); // "a" não respondeu
  assert.equal(salas.length, 1);
  assert.deepEqual(salas[0].membros.map((m) => m.id), ["b"]);
  assert.equal(salas[0].comBots, true);
});

test("sozinho na fila + 'Começar agora com bots': sala criada na hora, sem esperar 20s", () => {
  const { f, entrar, salas, ultimo } = criar();
  entrar("a");
  assert.equal(f.comecarAgora("a"), null);
  assert.equal(salas.length, 1);
  assert.equal(salas[0].comBots, true);
  assert.equal(ultimo("a", "fila-fim").ok, true);
});

test("jogo sem bots (Acromania): 'Começar agora' precisa de 2 pessoas", () => {
  const { f, salas } = criar();
  f.entrar({ id: "a", nickname: "A" }, "acromania");
  assert.match(f.comecarAgora("a"), /pelo menos 2/);
  f.entrar({ id: "b", nickname: "B" }, "acromania");
  assert.equal(f.comecarAgora("a"), null);
  f.responder("b", f.propostaDe.get("b"), true);
  assert.equal(salas[0].comBots, false);
  assert.equal(salas[0].membros.length, 2);
});

test("fechou todas as abas: sai da fila e recusa a partida pendente", () => {
  const { f, entrar, ultimo, idProposta } = criar();
  entrar("a", "b", "c", "d");
  segundos(SEG_JUNTAR);
  f.desconectou("d");
  assert.equal(ultimo("a", "fila-proposta").total, 4); // a proposta segue pros outros
  assert.match(f.entrar({ id: "a", nickname: "A" }, "impostor"), /confirmação/);
  for (const id of ["a", "b", "c"]) assert.equal(f.responder(id, idProposta(id), true), null);
  // 3 aceitaram, abaixo do mínimo de 4: voltam pra fila; "d" saiu.
  assert.equal(ultimo("d", "fila-fim").motivo, "recusou");
  assert.equal(ultimo("a", "fila-fim").motivo, "voltou");
  assert.equal(f.filaDe("d"), null);
  assert.equal(f.filaDe("a"), "impostor");
});

test("proposta respondida duas vezes ou de outra pessoa é recusada", () => {
  const { f, entrar, idProposta } = criar();
  entrar("a", "b", "c", "d");
  segundos(SEG_JUNTAR);
  assert.match(f.responder("x", idProposta("a"), true), /não está mais/);
  for (const id of ["a", "b", "c", "d"]) f.responder(id, idProposta(id), true);
  assert.match(f.responder("a", "p1", true), /não está mais/);
});

test("erro ao criar a sala: todo mundo volta pra fila", () => {
  const { f, entrar, ultimo, idProposta } = criar();
  f.jogos.impostor.criarSala = () => { throw new Error("falhou"); };
  const erroOriginal = console.error;
  console.error = () => {};
  try {
    entrar("a", "b", "c", "d");
    segundos(SEG_JUNTAR);
    for (const id of ["a", "b", "c", "d"]) f.responder(id, idProposta(id), true);
  } finally { console.error = erroOriginal; }
  assert.equal(ultimo("a", "fila-fim").motivo, "voltou");
  assert.ok(f.filaDe("a"));
});
