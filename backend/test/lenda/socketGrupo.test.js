import { test, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { io as conectar } from "socket.io-client";
import { registrarGrupo, __configurarGrupoParaTestes, __resetGrupoParaTestes, __grupos, faixaOk, faixaDe } from "../../src/lenda/socketGrupo.js";
import { definePrefs } from "../../src/lenda/prefs.js";

// ana (líder) é amiga de bia, caio, edu e fabi; davi não é amigo de ninguém.
const AMIGOS = { ana: ["bia", "caio", "edu", "fabi"], bia: ["ana"], caio: ["ana"], davi: [], edu: ["ana"], fabi: ["ana"] };
__configurarGrupoParaTestes({ amigosDe: async (id) => AMIGOS[id] || [] });

const http = createServer();
const io = new Server(http);
io.use((socket, next) => { const { id, nickname } = socket.handshake.auth; socket.user = { id, nickname }; next(); });
io.on("connection", (socket) => { socket.join(`user:${socket.user.id}`); registrarGrupo(io, socket); });
await new Promise((r) => http.listen(0, r));
const url = `http://localhost:${http.address().port}`;
const clientes = [];
after(() => { for (const c of clientes) c.disconnect(); __resetGrupoParaTestes(); io.close(); });
function cliente(id) {
  const s = conectar(url, { auth: { id, nickname: id.toUpperCase() }, transports: ["websocket"], forceNew: true });
  s.got = []; s.onAny((e, d) => s.got.push([e, d])); clientes.push(s); return s;
}
const pede = (s, ev, d) => new Promise((r) => s.emit(ev, d, r));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const recebeu = (s, ev) => s.got.filter(([e]) => e === ev).map(([, d]) => d);

test("grupo: criar, convidar, só amigo entra, onde, repasse só no mesmo mapa, dano para o líder, líder sai = fim", async () => {
  const ana = cliente("ana"), bia = cliente("bia"), caio = cliente("caio"), davi = cliente("davi");
  await espera(150);
  const r = await pede(ana, "grupo-criar", { perfil: { nivel: 250 }, mapa: "rio" });
  assert.equal(r.ok, true); const cod = r.grupo.codigo;
  assert.equal((await pede(ana, "grupo-convidar", { amigoId: "bia" })).ok, true);
  await espera(3100); // (um convite a cada 3 s)
  await espera(80); assert.equal(recebeu(bia, "grupo-convite")[0].codigo, cod);
  assert.match((await pede(davi, "grupo-entrar", { codigo: cod })).erro, /chamou/);
  assert.equal((await pede(bia, "grupo-entrar", { codigo: cod.toLowerCase(), perfil: { nivel: 200 }, mapa: "rio" })).ok, true);
  assert.equal((await pede(caio, "grupo-entrar", { codigo: cod, perfil: { nivel: 180 }, mapa: "vila" })).ok, true);
  // líder e bia entram na caça; caio fica na vila
  ana.emit("grupo-onde", { mapa: "caca_jacares" }); bia.emit("grupo-onde", { mapa: "caca_jacares" });
  await espera(100);
  const ult = recebeu(caio, "grupo-sala").at(-1);
  assert.equal(ult.membros.find((m) => m.id === "ana").mapa, "caca_jacares");
  ana.emit("grupo-mundo", { m: [[1, "jacare", 3, 4, 100, 0, 0]] });
  bia.emit("grupo-eu", { x: 3, y: 5 });
  bia.emit("grupo-dano", { u: 1, d: 50 });
  await espera(150);
  assert.equal(recebeu(bia, "grupo-mundo").length, 1);
  assert.equal(recebeu(caio, "grupo-mundo").length, 0, "quem está em outro mapa não recebe o retrato");
  assert.equal(recebeu(ana, "grupo-eu")[0].d.x, 3);
  assert.deepEqual(recebeu(ana, "grupo-dano")[0].d, { u: 1, d: 50 });
  // só o líder manda o retrato
  bia.emit("grupo-mundo", { m: [] }); await espera(100);
  assert.equal(recebeu(ana, "grupo-mundo").length, 0);
  // emote vai para todos (limite 1/s)
  caio.emit("grupo-emote", { i: 2 }); caio.emit("grupo-emote", { i: 3 }); await espera(100);
  assert.deepEqual(recebeu(ana, "grupo-emote"), [{ de: "caio", i: 2 }]);
  // bia sai: o grupo continua; líder sai: acaba para todos
  await pede(bia, "grupo-sair"); await espera(80);
  assert.equal(recebeu(ana, "grupo-saiu")[0].id, "bia");
  await pede(ana, "grupo-sair"); await espera(80);
  assert.equal(recebeu(caio, "grupo-fim")[0].motivo, "lider_saiu");
  assert.equal(__grupos.size, 0);
});

test("no máximo 4", async () => {
  const ana = cliente("ana"), outros = ["bia", "caio", "edu", "fabi"].map(cliente);
  await espera(150);
  const cod = (await pede(ana, "grupo-criar", {})).grupo.codigo;
  for (const o of outros.slice(0, 3)) assert.equal((await pede(o, "grupo-entrar", { codigo: cod })).ok, true);
  assert.match((await pede(outros[3], "grupo-entrar", { codigo: cod })).erro, /4/);
});

test("diferença de nível do grupo", async () => {
  assert.equal(faixaOk(100, 150), true); assert.equal(faixaOk(100, 151), false);
  assert.equal(faixaOk(5, 15), true); assert.equal(faixaOk(5, 16), false);
  assert.deepEqual(faixaDe(300), { de: 200, ate: 450 });
  const ana = cliente("ana"), bia = cliente("bia");
  await espera(150);
  const cod = (await pede(ana, "grupo-criar", { perfil: { nivel: 300 } })).grupo.codigo;
  const r = await pede(bia, "grupo-entrar", { codigo: cod, perfil: { nivel: 150 } });
  assert.match(r.erro, /entre os níveis 200 e 450/);
  assert.equal((await pede(bia, "grupo-entrar", { codigo: cod, perfil: { nivel: 210 } })).ok, true);
});

test("chamar qualquer jogador (botão direito): só quem LIGOU 'aceitar convites de todos' (v407, U5); limite contra spam", async () => {
  const ana = cliente("ana"), davi = cliente("davi"), edu = cliente("edu");
  await espera(150);
  const cod = (await pede(ana, "grupo-criar", { perfil: { nivel: 100 } })).grupo.codigo;
  assert.match((await pede(davi, "grupo-entrar", { codigo: cod, perfil: { nivel: 100 } })).erro, /chamou/);
  // padrão: convite só de amigos — o davi não é amigo da ana
  assert.match((await pede(ana, "grupo-convidar", { amigoId: "davi" })).erro, /amigos/);
  assert.equal(recebeu(davi, "grupo-convite").length, 0);
  definePrefs("davi", { convitesTodos: true }); // (o jogo manda "lenda-prefs" — ver socketMundo)
  assert.equal((await pede(ana, "grupo-convidar", { amigoId: "davi" })).ok, true);
  assert.match((await pede(ana, "grupo-convidar", { amigoId: "edu" })).erro, /Calma/, "um convite a cada 3 s");
  await espera(100);
  assert.equal(recebeu(davi, "grupo-convite")[0].codigo, cod);
  assert.equal((await pede(davi, "grupo-entrar", { codigo: cod, perfil: { nivel: 100 } })).ok, true);
});
