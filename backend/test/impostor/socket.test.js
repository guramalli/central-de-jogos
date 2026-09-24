import { test, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { io as conectar } from "socket.io-client";
import {
  registrarImpostor, __configurarImpostorParaTestes, __resetImpostorParaTestes, __salasImpostor,
} from "../../src/impostor/socketImpostor.js";

// Ponta a ponta com Socket.IO DE VERDADE: 4 clientes jogam uma partida
// inteira e cada um grava TUDO que chegou pela rede. É a prova de que a
// palavra não chega ao impostor por nenhum caminho (nem broadcast da sala).

const resultados = [];
__configurarImpostorParaTestes({
  sortearPalavra: async () => ({ tema: "Lugares", palavra: "Praia" }),
  gravarResultado: (r) => resultados.push(r),
  config: { SEG_ULTIMA_DICA: 0.2 }, // relógio de verdade aqui: pausa curtinha
});

const http = createServer();
const io = new Server(http);
// No servidor real quem preenche socket.user é o middleware de JWT.
io.use((socket, next) => {
  const { id, nickname } = socket.handshake.auth;
  socket.user = { id, nickname };
  next();
});
io.on("connection", (socket) => registrarImpostor(io, socket));
await new Promise((r) => http.listen(0, r));
const url = `http://localhost:${http.address().port}`;

const clientes = [];
after(async () => {
  for (const c of clientes) c.socket.disconnect();
  __resetImpostorParaTestes();
  io.close();
});

function novoCliente(id) {
  const socket = conectar(url, { auth: { id, nickname: id.toUpperCase() }, transports: ["websocket"], forceNew: true });
  const c = { id, socket, recebidos: [], estado: null, carta: null };
  socket.onAny((evento, dados) => {
    c.recebidos.push({ evento, dados });
    if (evento === "impostor-estado") c.estado = dados;
    if (evento === "impostor-carta") c.carta = dados;
  });
  clientes.push(c);
  return c;
}

const emitir = (c, evento, dados = {}) => new Promise((r) => c.socket.emit(evento, dados, r));

async function esperar(cond, ms = 3000) {
  const ate = Date.now() + ms;
  while (!cond()) {
    if (Date.now() > ate) throw new Error("tempo esgotado esperando condição");
    await new Promise((r) => setTimeout(r, 10));
  }
}

test("partida completa pela rede: impostor nunca recebe a palavra; cada um recebe só a sua carta", async () => {
  const [a, b, c, d] = ["ana", "bia", "caio", "davi"].map(novoCliente);
  await Promise.all(clientes.map((x) => new Promise((r) => x.socket.on("connect", r))));

  const { codigo } = await emitir(a, "impostor-criar");
  assert.match(codigo, /^[A-Z0-9]{3}-\d{2}$/);
  for (const x of [b, c, d]) {
    // Código digitado de qualquer jeito também serve.
    assert.deepEqual(await emitir(x, "impostor-entrar", { codigo: codigo.toLowerCase().replace("-", " ") }), { codigo });
  }
  assert.deepEqual(await emitir(b, "impostor-iniciar"), { erro: "Só o anfitrião inicia a partida." });
  assert.deepEqual(await emitir(a, "impostor-iniciar"), { ok: true });

  await esperar(() => clientes.every((x) => x.carta));
  const impostor = clientes.find((x) => x.carta.papel === "impostor");
  const tripulantes = clientes.filter((x) => x !== impostor);
  assert.ok(impostor);
  assert.equal(tripulantes.length, 3);
  assert.deepEqual(impostor.carta, { papel: "impostor", tema: "Lugares" });
  for (const t of tripulantes) assert.equal(t.carta.palavra, "Praia");

  for (const x of clientes) await emitir(x, "impostor-carta-vista");
  await esperar(() => a.estado.fase === "DICAS");

  // 2 rodadas de dicas, sempre de quem está na vez.
  let n = 0;
  while (a.estado.fase === "DICAS") {
    // Pausa da última dica da rodada: ninguém na vez por um instante.
    if (!a.estado.vezDe) { await esperar(() => a.estado.vezDe || a.estado.fase !== "DICAS"); continue; }
    const vez = clientes.find((x) => x.id === a.estado.vezDe);
    const outro = clientes.find((x) => x !== vez);
    assert.deepEqual(await emitir(outro, "impostor-dica", { texto: "fura" }), { erro: "Não é a sua vez." });
    const antes = a.estado.dicas.length;
    assert.deepEqual(await emitir(vez, "impostor-dica", { texto: `dica${n++}` }), { ok: true });
    await esperar(() => a.estado.dicas.length > antes || a.estado.fase !== "DICAS");
  }
  assert.equal(a.estado.fase, "VOTACAO");

  // Chat no meio da partida: chega a todos da sala, com o nick de quem falou.
  assert.deepEqual(await emitir(b, "impostor-chat", { texto: "  quem foi?  " }), { ok: true });
  await esperar(() => clientes.every((x) => x.recebidos.some((e) => e.evento === "impostor-chat")));
  for (const x of clientes) {
    const m = x.recebidos.find((e) => e.evento === "impostor-chat").dados;
    assert.equal(m.texto, "quem foi?");
    assert.equal(m.nick, "BIA");
  }
  assert.match((await emitir(b, "impostor-chat", { texto: "de novo" })).erro, /Devagar|Calma/);

  // Todos os tripulantes votam no impostor; o impostor vota em alguém.
  assert.deepEqual(await emitir(impostor, "impostor-votar", { alvoId: impostor.id }), { erro: "Você não pode votar em si mesmo." });
  await emitir(impostor, "impostor-votar", { alvoId: tripulantes[0].id });
  for (const t of tripulantes) await emitir(t, "impostor-votar", { alvoId: impostor.id });
  await esperar(() => a.estado.fase === "REVELACAO");
  assert.equal(a.estado.revelacao.impostorId, impostor.id);
  await esperar(() => impostor.estado.fase === "ULTIMA_CHANCE", 15000);

  assert.deepEqual(await emitir(impostor, "impostor-chute", { palavra: "escola" }), { ok: true });
  await esperar(() => clientes.every((x) => x.estado.fase === "FIM"));

  // A PROVA: tudo que chegou ao impostor antes do FIM, sem a palavra.
  const fim = impostor.recebidos.findIndex((e) => e.evento === "impostor-estado" && e.dados.fase === "FIM");
  const antesDoFim = impostor.recebidos.slice(0, fim);
  assert.ok(antesDoFim.length > 10);
  for (const e of antesDoFim) {
    assert.ok(!JSON.stringify(e.dados ?? null).toLowerCase().includes("praia"), `vazou em ${e.evento}`);
  }
  // Cada um recebeu exatamente UMA carta: a sua.
  for (const x of clientes) assert.equal(x.recebidos.filter((e) => e.evento === "impostor-carta").length, 1);

  assert.equal(impostor.estado.resultado.palavra, "Praia");
  assert.equal(impostor.estado.resultado.vencedor, "tripulantes");
  assert.equal(resultados.length, 1);
  assert.equal(resultados[0].pontos[impostor.id], 0);
  for (const t of tripulantes) assert.equal(resultados[0].pontos[t.id], 200);
});

test("série pela rede: impostor-serie (anfitrião, 1/3/5) e `partidas` no impostor-iniciar", async () => {
  const grupo = ["ivo", "jana", "kel", "lia"].map(novoCliente);
  await Promise.all(grupo.map((x) => new Promise((r) => x.socket.on("connect", r))));
  const [i, j] = grupo;
  const { codigo } = await emitir(i, "impostor-criar");
  for (const x of grupo.slice(1)) await emitir(x, "impostor-entrar", { codigo });
  await esperar(() => j.estado?.jogadores.length === 4);
  assert.equal(j.estado.partidasDaSerie, 3);
  assert.deepEqual(await emitir(j, "impostor-serie", { partidas: 5 }), { erro: "Só o anfitrião escolhe quantas partidas." });
  assert.match((await emitir(i, "impostor-serie", { partidas: 2 })).erro, /1, 3 ou 5/);
  assert.deepEqual(await emitir(i, "impostor-serie", { partidas: 5 }), { ok: true });
  await esperar(() => j.estado.partidasDaSerie === 5);
  assert.deepEqual(await emitir(i, "impostor-iniciar", { partidas: 1 }), { ok: true });
  await esperar(() => grupo.every((x) => x.estado.fase === "CARTAS"));
  assert.deepEqual(j.estado.serie, { partida: 1, total: 1, encerrada: false, motivoFim: null });
  assert.match((await emitir(i, "impostor-serie", { partidas: 3 })).erro, /sala de espera/);
});

test("modo PERGUNTA pela rede: impostor-modo, impostor-resposta; a pergunta real só chega ao impostor na votação", async () => {
  const grupo = ["eva", "fabi", "gui", "hugo"].map(novoCliente);
  await Promise.all(grupo.map((x) => new Promise((r) => x.socket.on("connect", r))));
  const [e, f] = grupo;
  const { codigo } = await emitir(e, "impostor-criar");
  for (const x of grupo.slice(1)) await emitir(x, "impostor-entrar", { codigo });
  assert.deepEqual(await emitir(f, "impostor-modo", { modo: "pergunta" }), { erro: "Só o anfitrião escolhe o modo." });
  assert.deepEqual(await emitir(e, "impostor-modo", { modo: "pergunta" }), { ok: true });
  await esperar(() => f.estado?.modo === "pergunta");
  // Relógio de verdade: confronto e revelação curtinhos.
  Object.assign(__salasImpostor.get(codigo).cfg, { SEG_CONFRONTO: 0.2, SEG_REVELACAO: 0.2 });
  assert.deepEqual(await emitir(e, "impostor-iniciar"), { ok: true });

  await esperar(() => grupo.every((x) => x.carta));
  const perguntas = grupo.map((x) => x.carta.pergunta);
  const real = perguntas.find((p) => perguntas.filter((q) => q === p).length === 3);
  const impostor = grupo.find((x) => x.carta.pergunta !== real);
  assert.ok(real && impostor);
  for (const x of grupo) assert.equal(x.carta.papel, undefined);

  for (const x of grupo) await emitir(x, "impostor-carta-vista");
  await esperar(() => e.estado.fase === "RESPOSTAS");
  for (const x of grupo) assert.deepEqual(await emitir(x, "impostor-resposta", { texto: `resp-${x.id}` }), { ok: true });
  await esperar(() => grupo.every((x) => x.estado.fase === "CONFRONTO"));
  assert.equal(e.estado.respostas.length, 4);
  assert.equal(e.estado.perguntaReal, undefined);
  await esperar(() => grupo.every((x) => x.estado.fase === "VOTACAO"));
  assert.equal(impostor.estado.perguntaReal, real);

  for (const x of grupo) {
    const alvo = x === impostor ? grupo.find((y) => y !== impostor) : impostor;
    await emitir(x, "impostor-votar", { alvoId: alvo.id });
  }
  await esperar(() => grupo.every((x) => x.estado.fase === "FIM"));
  assert.equal(impostor.estado.resultado.motivo, "descoberto");

  const i = impostor.recebidos.findIndex((r) => r.evento === "impostor-estado" && r.dados.fase === "VOTACAO");
  for (const r of impostor.recebidos.slice(0, i)) {
    assert.ok(!JSON.stringify(r.dados ?? null).includes(real), `pergunta real vazou em ${r.evento}`);
  }
  assert.equal(resultados.at(-1).modo, "pergunta");
});
