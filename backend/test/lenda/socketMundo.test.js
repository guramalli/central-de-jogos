import { test, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { io as conectar } from "socket.io-client";
import { registrarMundo, __configurarMundoParaTestes, __resetMundoParaTestes, __canaisMundo, MAX_POR_CANAL, mapaValido, limpaPos } from "../../src/lenda/socketMundo.js";

// Amizades de mentira: ana é amiga de bia.
const AMIGOS = { ana: ["bia"], bia: ["ana"] };
const GUILDAS = { ana: { id: "g1", nome: "Os Leões de Fogo", escudo: "🦁", cor: "#e74c3c" }, bia: { id: "g1", nome: "Os Leões de Fogo", escudo: "🦁", cor: "#e74c3c" } };
__configurarMundoParaTestes({ amigosDe: async (id) => AMIGOS[id] || [], guildaDe: async (id) => GUILDAS[id] || null, top3: async () => ["bia", "ana", "x9"] });

const http = createServer();
const io = new Server(http);
io.use((socket, next) => { const { id, nickname } = socket.handshake.auth; socket.user = { id, nickname }; next(); });
io.on("connection", (socket) => { socket.join(`user:${socket.user.id}`); registrarMundo(io, socket); });
await new Promise((r) => http.listen(0, r));
const url = `http://localhost:${http.address().port}`;
const clientes = [];
after(() => { for (const c of clientes) c.disconnect(); __resetMundoParaTestes(); io.close(); });

function cliente(id) {
  const s = conectar(url, { auth: { id, nickname: id.toUpperCase() }, transports: ["websocket"], forceNew: true });
  s.got = []; s.onAny((e, d) => s.got.push([e, d])); clientes.push(s); return s;
}
const pede = (s, ev, d) => new Promise((r) => s.emit(ev, d, r));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const recebeu = (s, ev) => s.got.filter(([e]) => e === ev).map(([, d]) => d);
const perfil = (nivel) => ({ nivel, look: { tipo: "humano" } });

test("validações", () => {
  assert.equal(mapaValido("rio"), true);
  assert.equal(mapaValido("caca_jacares"), true);
  assert.equal(mapaValido("../x"), false);
  assert.equal(mapaValido("A"), false);
  assert.equal(mapaValido(""), false);
  assert.deepEqual(limpaPos({ x: "12.345", y: -5, f: 1, m: 0, fa: 2.5, extra: "x" }), { x: 12.35, y: 0, f: 1, m: 0, fa: 2.5, v: 0 });
});

test("entrar, ver quem chegou, posições em retrato, emote/frase, sair", async () => {
  const ana = cliente("ana"), bia = cliente("bia");
  await espera(150);
  const ra = await pede(ana, "mundo-entrar", { mapa: "rio", perfil: perfil(200), x: 10, y: 10 });
  assert.equal(ra.ok, true); assert.equal(ra.canal, 1); assert.deepEqual(ra.membros, []);
  const rb = await pede(bia, "mundo-entrar", { mapa: "rio", perfil: perfil(150), x: 12, y: 11 });
  assert.equal(rb.ok, true); assert.equal(rb.membros.length, 1); assert.equal(rb.membros[0].apelido, "ANA");
  await espera(100);
  assert.equal(recebeu(ana, "mundo-chegou")[0].id, "bia");
  // posição: chega junto no retrato do canal
  bia.emit("mundo-eu", { x: 13, y: 11.5, f: 1, m: 1, fa: 3, v: 2 });
  await espera(300);
  const pos = recebeu(ana, "mundo-pos").flat();
  assert.ok(pos.some((p) => p[0] === "bia" && p[1] === 13 && p[2] === 11.5 && p[6] === 2));
  // emote e frase: só índices válidos; um a cada 1,2 s
  ana.emit("mundo-frase", { i: 3 }); ana.emit("mundo-frase", { i: 4 }); bia.emit("mundo-emote", { i: 99 });
  await espera(150);
  assert.deepEqual(recebeu(bia, "mundo-frase"), [{ de: "ana", i: 3 }]);
  assert.equal(recebeu(ana, "mundo-emote").length, 0);
  // trocou de mapa: sai do canal e o outro fica sabendo
  const r2 = await pede(bia, "mundo-entrar", { mapa: "vila", perfil: perfil(150), x: 1, y: 1 });
  assert.equal(r2.ok, true);
  await espera(100);
  assert.deepEqual(recebeu(ana, "mundo-saiu"), [{ id: "bia" }]);
  await pede(ana, "mundo-sair");
  await pede(bia, "mundo-sair");
  assert.equal(__canaisMundo.size, 0);
});

test("canais: enche até o limite, abre outro, e amigo vai para o canal do amigo", async () => {
  const lote = [];
  for (let i = 0; i < MAX_POR_CANAL; i++) lote.push(cliente("x" + i));
  await espera(200);
  for (const c of lote) assert.equal((await pede(c, "mundo-entrar", { mapa: "toquio", perfil: perfil(80) })).canal, 1);
  const ana = cliente("ana"); await espera(100);
  assert.equal((await pede(ana, "mundo-entrar", { mapa: "toquio", perfil: perfil(200) })).canal, 2);
  // alguém sai do canal 1: a bia (amiga da ana) vai para o canal 2, onde está a ana
  await pede(lote[0], "mundo-sair");
  const bia = cliente("bia"); await espera(100);
  assert.equal((await pede(bia, "mundo-entrar", { mapa: "toquio", perfil: perfil(150) })).canal, 2);
  // o próximo sem amigo vai para o mais cheio que ainda cabe (canal 1)
  const z = cliente("zeca"); await espera(100);
  assert.equal((await pede(z, "mundo-entrar", { mapa: "toquio", perfil: perfil(10) })).canal, 1);
});

test("caiu: sai do canal e avisa", async () => {
  const a = cliente("caio"), b = cliente("dani");
  await espera(150);
  await pede(a, "mundo-entrar", { mapa: "paris", perfil: perfil(1) });
  await pede(b, "mundo-entrar", { mapa: "paris", perfil: perfil(1) });
  b.disconnect(); await espera(200);
  assert.deepEqual(recebeu(a, "mundo-saiu"), [{ id: "dani" }]);
  const c = [...__canaisMundo.values()].find((k) => k.mapa === "paris");
  assert.equal(c.membros.size, 1);
});

test("guilda: escudo em cima do nome e frases para a guilda", async () => {
  const ana = cliente("ana"), bia = cliente("bia"), caio = cliente("caio");
  await espera(150);
  await pede(ana, "mundo-entrar", { mapa: "lisboa", perfil: perfil(10) });
  const rb = await pede(bia, "mundo-entrar", { mapa: "lisboa", perfil: perfil(10) });
  assert.equal(rb.membros[0].guilda.escudo, "🦁");
  assert.equal((await pede(ana, "guilda-ligar", {})).guilda.id, "g1");
  await pede(bia, "guilda-ligar", {}); await pede(caio, "guilda-ligar", {});
  ana.emit("guilda-frase", { i: 2 }); ana.emit("guilda-frase", { i: 3 }); caio.emit("guilda-frase", { i: 1 });
  await espera(150);
  assert.deepEqual(recebeu(bia, "guilda-frase"), [{ de: "ana", apelido: "ANA", i: 2 }]);
  assert.equal(recebeu(caio, "guilda-frase").length, 0, "quem não é da guilda não recebe");
});

test("top 3 do ranking vem junto ao entrar", async () => {
  const z = cliente("zeca"); await espera(120);
  const r = await pede(z, "mundo-entrar", { mapa: "madri", perfil: perfil(1) });
  assert.deepEqual(r.top, ["bia", "ana", "x9"]);
});

// ---------- v407 (Raio-X U5/I8) ----------
test("invisível: entra e vê os outros, mas ninguém vê nem ouve; voltar a aparecer avisa o canal", async () => {
  const gil = cliente("gil"), hugo = cliente("hugo");
  await espera(150);
  assert.equal((await pede(gil, "mundo-entrar", { mapa: "praia_inv", perfil: perfil(10), x: 1, y: 1 })).ok, true);
  const p = await pede(hugo, "lenda-prefs", { invisivel: true, convitesTodos: "lixo" });
  assert.deepEqual(p.prefs, { convitesTodos: false, invisivel: true });
  const r = await pede(hugo, "mundo-entrar", { mapa: "praia_inv", perfil: perfil(20), x: 2, y: 2 });
  assert.equal(r.invisivel, true); assert.equal(r.membros.length, 1, "o invisível vê o gil");
  hugo.emit("mundo-eu", { x: 5, y: 5 }); hugo.emit("mundo-emote", { i: 1 });
  await espera(400);
  assert.equal(recebeu(gil, "mundo-chegou").length, 0, "ninguém soube da chegada");
  assert.ok(!recebeu(gil, "mundo-pos").flat().some((x) => x[0] === "hugo"), "nem da posição");
  assert.equal(recebeu(gil, "mundo-emote").length, 0, "nem do emote");
  const q = await pede(gil, "mundo-quem");
  assert.ok(!q.lista.some((x) => x.id === "hugo"), "fora do 'jogando agora'");
  // aparece de novo
  await pede(hugo, "lenda-prefs", { invisivel: false });
  await espera(100);
  assert.equal(recebeu(gil, "mundo-chegou").at(-1).id, "hugo");
  // e some de novo no meio do mapa
  await pede(hugo, "lenda-prefs", { invisivel: true });
  await espera(100);
  assert.equal(recebeu(gil, "mundo-saiu").at(-1).id, "hugo");
  await pede(hugo, "lenda-prefs", { invisivel: false });
});

test("👥 jogando agora: todos os mapas, sem você, com limite de pedidos", async () => {
  const ivo = cliente("ivo"), juca = cliente("juca");
  await espera(150);
  await pede(ivo, "mundo-entrar", { mapa: "cidade_quem", perfil: perfil(7), x: 1, y: 1 });
  await pede(juca, "mundo-entrar", { mapa: "rio_quem", perfil: perfil(9), x: 1, y: 1 });
  const q = await pede(ivo, "mundo-quem");
  assert.equal(q.ok, true);
  const j = q.lista.find((x) => x.id === "juca");
  assert.deepEqual(j, { id: "juca", apelido: "JUCA", nivel: 9, mapa: "rio_quem" });
  assert.ok(!q.lista.some((x) => x.id === "ivo"));
  assert.equal(q.total, q.lista.length);
  assert.match((await pede(ivo, "mundo-quem")).erro, /Calma/, "um pedido a cada 2 s");
});
