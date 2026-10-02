import { test, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { io as conectar } from "socket.io-client";
import { registrarTorre, __configurarTorreParaTestes, __resetTorreParaTestes, __salasTorre, limpaPerfil, andarMaximo } from "../../src/lenda/socketTorre.js";

// Amizades de mentira: ana é amiga de bia e caio; davi não é amigo de ninguém.
const AMIGOS = { ana: ["bia", "caio", "edu", "fabi"], bia: ["ana"], caio: ["ana"], davi: [], edu: ["ana"], fabi: ["ana"] };
__configurarTorreParaTestes({ amigosDe: async (id) => AMIGOS[id] || [] });

const http = createServer();
const io = new Server(http);
io.use((socket, next) => { const { id, nickname } = socket.handshake.auth; socket.user = { id, nickname }; next(); });
io.on("connection", (socket) => { socket.join(`user:${socket.user.id}`); registrarTorre(io, socket); });
await new Promise((r) => http.listen(0, r));
const url = `http://localhost:${http.address().port}`;
const clientes = [];
after(() => { for (const c of clientes) c.disconnect(); __resetTorreParaTestes(); io.close(); });

function cliente(id) {
  const s = conectar(url, { auth: { id, nickname: id.toUpperCase() }, transports: ["websocket"], forceNew: true });
  s.got = []; s.onAny((e, d) => s.got.push([e, d])); clientes.push(s); return s;
}
const pede = (s, ev, d) => new Promise((r) => s.emit(ev, d, r));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const recebeu = (s, ev) => s.got.filter(([e]) => e === ev).map(([, d]) => d);

test("perfil limpo e andar máximo do grupo", () => {
  const p = limpaPerfil({ nivel: "450", max: 12.7, look: { tipo: "humano" }, extra: "x" }, "Ana");
  assert.deepEqual(p, { apelido: "Ana", nivel: 450, max: 13, look: { tipo: "humano" } });
  assert.equal(limpaPerfil({ look: { x: "a".repeat(3000) } }, "A").look, null);
  const sala = { membros: new Map([["a", { max: 30 }], ["b", { max: 7 }]]) };
  assert.equal(andarMaximo(sala), 8);
});

test("sala ponta a ponta: criar, convidar, entrar só amigo, começar, repassar, emote, fim", async () => {
  const ana = cliente("ana"), bia = cliente("bia"), davi = cliente("davi");
  await espera(150);
  const r = await pede(ana, "torre-criar", { perfil: { nivel: 450, max: 20 } });
  assert.equal(r.ok, true); const cod = r.sala.codigo; assert.match(cod, /^[A-Z0-9]{5}$/);
  // convite chega na bia
  assert.equal((await pede(ana, "torre-convidar", { amigoId: "bia" })).ok, true);
  assert.equal((await pede(ana, "torre-convidar", { amigoId: "davi" })).erro !== undefined, true);
  await espera(100);
  assert.equal(recebeu(bia, "torre-convite")[0].codigo, cod);
  // davi não é amigo: não entra
  assert.match((await pede(davi, "torre-entrar", { codigo: cod })).erro, /amigos/);
  // bia entra
  const rb = await pede(bia, "torre-entrar", { codigo: cod.toLowerCase(), perfil: { nivel: 300, max: 9 } });
  assert.equal(rb.ok, true); assert.equal(rb.sala.membros.length, 2);
  // só o anfitrião começa e só até o andar máximo do grupo (10)
  assert.ok((await pede(bia, "torre-comecar", { andar: 5 })).erro);
  assert.match((await pede(ana, "torre-comecar", { andar: 11 })).erro, /até o andar 10/);
  assert.equal((await pede(ana, "torre-comecar", { andar: 10 })).ok, true);
  await espera(100);
  assert.equal(recebeu(bia, "torre-comeca")[0].andar, 10);
  // repasse: mundo só do anfitrião; dano só para o anfitrião; eu para os outros
  ana.emit("torre-mundo", { t: 90, m: [[1, "x", 1, 2, 100]] });
  bia.emit("torre-mundo", { falso: true });
  bia.emit("torre-dano", { uid: 1, dano: 50 });
  ana.emit("torre-mundo", { grande: "x".repeat(20000) }); // grande demais: não passa
  bia.emit("torre-emote", { i: 3 }); bia.emit("torre-emote", { i: 99 });
  await espera(150); bia.emit("torre-eu", { x: 3, y: 4 }); await espera(120);
  assert.equal(recebeu(bia, "torre-mundo").length, 1);
  assert.equal(recebeu(ana, "torre-mundo").length, 0);
  assert.deepEqual(recebeu(ana, "torre-dano")[0], { de: "bia", d: { uid: 1, dano: 50 } });
  assert.equal(recebeu(bia, "torre-dano").length, 0);
  assert.deepEqual(recebeu(ana, "torre-eu")[0].d, { x: 3, y: 4 });
  assert.equal(recebeu(ana, "torre-emote").length, 1); assert.equal(recebeu(ana, "torre-emote")[0].i, 3);
  // fim: volta para o lobby
  ana.emit("torre-fim", { res: "limpou" }); await espera(100);
  assert.deepEqual(recebeu(bia, "torre-fim")[0], { res: "limpou", andar: 10 });
  assert.equal(__salasTorre.get(cod).fase, "lobby");
  // anfitrião sai: a sala acaba para todos
  await pede(ana, "torre-sair"); await espera(100);
  assert.equal(recebeu(bia, "torre-fim").at(-1).res, "anfitriao_saiu");
  assert.equal(__salasTorre.has(cod), false);
});

test("no máximo 4 jogadores", async () => {
  const [ana, bia, caio, edu, fabi] = ["ana", "bia", "caio", "edu", "fabi"].map(cliente);
  await espera(150);
  const cod = (await pede(ana, "torre-criar", {})).sala.codigo;
  for (const c of [bia, caio, edu]) assert.equal((await pede(c, "torre-entrar", { codigo: cod })).ok, true);
  assert.match((await pede(fabi, "torre-entrar", { codigo: cod })).erro, /4 jogadores/);
});
