// Ghotin2 — o mundo online da fase 1 (ghotin2/socketMundo.js e ghotin2/chatMundo.js): a autenticação, as salas e os canais,
// o tick, a velocidade, o teleporte, a aparência, o nível, o chat (filtro, flood, global), a denúncia e a limpeza.
// Molde: test/lenda/socketMundo.test.js. Banco de mentira (só o que o mundo lê), relógio de mentira (as contas de tempo do
// servidor usam o `agora` daqui; só o tick de 100 ms e os timers de "caindo" e da faxina correm no tempo de verdade).
// Escrito em 19/11/2026 sem rodar (o usuário autoriza os testes depois).
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { io as conectar } from "socket.io-client";

process.env.DATABASE_URL = "postgresql://ninguem:nada@127.0.0.1:1/teste_sem_banco"; // (o PrismaClient de db.js nem conecta)
process.env.JWT_SECRET ||= "teste-ghotin2-segredo";
const W = await import("../../src/ghotin2/socketMundo.js");
const M = await import("../../src/ghotin2/mapas.js");
const C = await import("../../src/ghotin2/chatMundo.js");
const { assinarTokenG2 } = await import("../../src/ghotin2/token.js");
const { esquecerContaG2 } = await import("../../src/ghotin2/auth.js");

// ---------------------------------------------------------------- o banco de mentira
const contas = new Map();   // id -> { id, banido, tokenVersao, sessao }
const personagens = [];     // { id, contaId, espaco, nome, classe, nivel, apagadoEm }
let leituras = 0;
const escolhe = (l, select) => (select ? Object.fromEntries(Object.keys(select).map((k) => [k, l[k]])) : { ...l });
const prisma = {
  ghotin2Conta: { findUnique: async ({ where, select }) => { const c = contas.get(where.id); return c ? escolhe(c, select) : null; } },
  ghotin2Personagem: {
    findFirst: async ({ where, select }) => {
      leituras++;
      const p = personagens.find((x) => x.contaId === where.contaId && x.espaco === where.espaco && x.apagadoEm === null);
      return p ? escolhe(p, select) : null;
    },
  },
};
// cria a conta (com um personagem no espaço 0: nome = o id em maiúsculas, viking, nível 20); `muda` troca campos do personagem
function novaConta(id, muda = {}) {
  if (!contas.has(id)) {
    contas.set(id, { id, banido: false, tokenVersao: 0, sessao: "sessao-" + id });
    personagens.push({ id: "p-" + id, contaId: id, espaco: 0, nome: id.toUpperCase(), classe: "viking", nivel: 20, apagadoEm: null });
  }
  Object.assign(personagens.find((x) => x.contaId === id), muda);
  return { token: assinarTokenG2({ id, tokenVersao: 0 }), sessao: contas.get(id).sessao };
}

// ---------------------------------------------------------------- o servidor
let relogio = Date.UTC(2026, 10, 19, 12);
const anda = (ms) => { relogio += ms; };
let ligado = true;
W.CFG.CAINDO_MS = 300;   // (5 s no jogo; aqui 0,3 s de verdade)
W.CFG.FAXINA_MS = 50;
const http = createServer();
const io = new Server(http);
W.registrarMundoG2(io, {
  prisma, ligado: () => ligado, agora: () => relogio,
  ipDoSocket: (s) => s.handshake.auth?.ipTeste || "127.0.0.1",   // (cada cliente com um IP próprio, fora o teste do limite por IP)
  ipEstaBanido: (ip) => ip === "6.6.6.6",
});
// o namespace padrão continua sem nada do Ghotin2
io.on("connection", (s) => s.emit("padrao-ok"));
await new Promise((r) => http.listen(0, r));
const base = `http://localhost:${http.address().port}`;
const url = `${base}/ghotin2`;
let clientes = [];
after(() => { for (const c of clientes) c.disconnect(); W.__resetMundoG2ParaTestes(); io.close(); });

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
function cliente(conta, { token, sessao, v = W.PROTO, ip, transports = ["websocket"] } = {}) {
  const k = novaConta(conta);
  const s = conectar(url, { auth: { token: token ?? k.token, sessao: sessao ?? k.sessao, v, ipTeste: ip || "ip-" + conta }, transports, forceNew: true, reconnection: false });
  s.got = []; s.onAny((e, d) => s.got.push([e, d])); s.on("disconnect", (r) => { s.caiu = r; });
  s.pronto = new Promise((res) => { s.once("connect", () => res({ ok: true })); s.once("connect_error", (e) => res({ ok: false, codigo: e.message, data: e.data })); });
  clientes.push(s); return s;
}
async function entra(conta, opcoes) { const s = cliente(conta, opcoes); const r = await s.pronto; assert.equal(r.ok, true, `${conta} não conectou: ${r.codigo}`); return s; }
const pede = (s, ev, d) => new Promise((r) => s.emit(ev, d, r));
const recebeu = (s, ev) => s.got.filter(([e]) => e === ev).map(([, d]) => d);
const esquece = (...ss) => { for (const s of ss) s.got = []; };
// entrar no mundo (x, y em cm) — anda 1 s antes, por causa do limite de 1 g2-entrar por segundo
async function noMapa(s, mapa, x, y, extra = {}) { anda(1000); return pede(s, "g2-entrar", { espaco: 0, mapa, x, y, d: 0, a: 0, vis: { arm: 1, arma: 2, rara: 0, ref: 0, cav: 0 }, ...extra }); }
let seqs = new WeakMap();
const eu = (s, x, y, f = 0, d = 0, a = 0) => { const n = (seqs.get(s) || 0) + 1; seqs.set(s, n); s.emit("g2-eu", [n, x, y, d, a, f]); };
// cada teste começa do zero: derruba os clientes do teste anterior e zera o mundo
async function limpa() {
  for (const c of clientes) c.disconnect();
  clientes = []; seqs = new WeakMap(); ligado = true;
  await espera(80);
  W.__resetMundoG2ParaTestes();
}
const membro = (conta) => W.__estadoMundoG2.regs.get(conta)?.mb;

// ================================================================= os mapas
test("mapas: a cópia de idMapa, a caixa do mundo e as salas", () => {
  assert.equal(M.idMapa(0, 0), "vila1");
  assert.equal(M.idMapa(0, 700), "hahoe");
  assert.equal(M.idMapa(-700, 0), "montanha");
  assert.equal(M.idMapa(0, -700), "daiyu");
  assert.equal(M.idMapa(0, 1400), "deserto");
  assert.equal(M.idMapa(300, 0), "dg3");      // Caverna dos Ratos
  assert.equal(M.idMapa(420, 5), "dg4");      // Toca das Aranhas
  assert.equal(M.idMapa(810, 0), "dg8");      // Vale dos Dragões 1
  assert.equal(M.idMapa(1450, 0), "dg15");    // Grutas da Seda 1
  assert.equal(M.idMapa(1780, 0), "dg18");    // Grutas da Seda 2
  assert.equal(M.mapaDoPonto(0, 0), "vila1");
  assert.equal(M.mapaDoPonto(5000, 0), null, "longe de tudo");
  assert.equal(M.mapaDoPonto(0, 1000), null, "o mar entre a Hahoe e o deserto");
  assert.equal(M.mapaDoPonto(NaN, 0), null);
  for (const m of ["vila1", "hahoe", "montanha", "daiyu", "deserto", "dg3", "dg4", "dg5", "dg7", "dg8", "dg10", "dg12", "dg15", "dg18"]) assert.ok(M.mapaComSala(m), m);
  assert.equal(M.mapaComSala("dg99"), false);
  assert.equal(M.mapaComSala("../x"), false);
  assert.equal(M.VMAX, 8.5);
});

test("limpaPos e limpaVis prendem os números", () => {
  assert.deepEqual(W.limpaPos({ x: "123.6", y: -50, d: 9, a: 300, f: 99, extra: 1 }), { x: 124, y: -50, d: 7, a: 255, f: 63 });
  assert.equal(W.limpaPos({ x: "abc", y: 1 }), null);
  assert.equal(W.limpaPos({ x: 1e9, y: 1 }), null);
  assert.deepEqual(W.limpaVis({ arm: 99, arma: -3, rara: "sim", ref: 4.6, cav: 50, lixo: 1 }), { arm: 8, arma: 0, rara: 1, ref: 5, cav: 21 });
  assert.deepEqual(W.limpaVis(null), { arm: null, arma: 0, rara: 0, ref: 0, cav: 0 });
  assert.deepEqual(W.limpaVis({ arm: "x" }), { arm: null, arma: 0, rara: 0, ref: 0, cav: 0 });
});

// ================================================================= a autenticação
test("autenticação: desligado, websocket, PROTO, token, sessão, banido, IP banido", async () => {
  await limpa();
  ligado = false;
  assert.equal((await cliente("ana").pronto).codigo, "desligado");
  ligado = true;
  assert.equal((await cliente("ana", { transports: ["polling"] }).pronto).codigo, "so_websocket");
  const r = await cliente("ana", { v: 0 }).pronto;
  assert.equal(r.codigo, "versao_velha"); assert.match(r.data.txt, /Atualize a página/);
  assert.equal((await cliente("ana", { token: "lixo" }).pronto).codigo, "token_invalido");
  assert.equal((await cliente("ana", { sessao: "outra" }).pronto).codigo, "sessao_tomada");
  assert.equal((await cliente("ana", { ip: "6.6.6.6" }).pronto).codigo, "banido");
  novaConta("dino"); contas.get("dino").banido = true; esquecerContaG2("dino");
  assert.equal((await cliente("dino").pronto).codigo, "banido");
  // um token do site (o JWT_SECRET puro) não entra
  const { signToken } = await import("../../src/utils/jwt.js");
  assert.equal((await cliente("ana", { token: signToken({ id: "ana" }) }).pronto).codigo, "token_invalido");
  assert.equal((await cliente("ana").pronto).ok, true);
  // e o namespace padrão continua o de antes (sem o middleware do Ghotin2)
  const p = conectar(base, { transports: ["websocket"], forceNew: true, reconnection: false }); clientes.push(p);
  await new Promise((res) => p.once("padrao-ok", res));
});

test("limite por IP: 4 contas por endereço (a mesma conta de novo não conta)", async () => {
  await limpa();
  for (const c of ["ip1", "ip2", "ip3", "ip4"]) await entra(c, { ip: "9.9.9.9" });
  assert.equal((await cliente("ip5", { ip: "9.9.9.9" }).pronto).codigo, "limite_ip");
  assert.equal((await cliente("ip1", { ip: "9.9.9.9" }).pronto).ok, true, "a outra aba da mesma conta entra");
});

// ================================================================= as salas e os canais
test("entrar: o nome, a classe e o nível vêm do banco; chegou, g2-pos só de quem mudou, retrato e saiu", async () => {
  await limpa();
  novaConta("ana", { nivel: 12, classe: "arqueiro" }); novaConta("bia", { nivel: 30, classe: "shura" }); novaConta("caio");
  const ana = await entra("ana"), bia = await entra("bia"), caio = await entra("caio");
  const ra = await noMapa(ana, "vila1", 1000, 2000, { nome: "HACKER", nivel: 99 });
  assert.equal(ra.ok, true); assert.equal(ra.canal, 1); assert.deepEqual(ra.membros, []); assert.ok(Number.isInteger(ra.eu) && ra.eu > 0);
  assert.ok(Number.isInteger(ra.t));
  const rb = await noMapa(bia, "vila1", 1200, 2000);
  assert.equal(rb.membros.length, 1);
  assert.deepEqual(rb.membros[0], { id: ra.eu, nome: "ANA", nivel: 12, classe: "arqueiro", vis: { arm: 1, arma: 2, rara: 0, ref: 0, cav: 0 }, x: 1000, y: 2000, d: 0, a: 0, f: 0 });
  assert.notEqual(rb.eu, ra.eu);
  await noMapa(caio, "vila1", 900, 2000);
  await espera(100);
  assert.deepEqual(recebeu(ana, "g2-chegou").map((m) => m.nome), ["BIA", "CAIO"]);
  // a bia anda; o caio fica parado: o g2-pos traz só a bia
  esquece(ana);
  anda(100); eu(bia, 1250, 2000, 1, 2, 3);
  await espera(250);
  const linhas = recebeu(ana, "g2-pos").flatMap((x) => x.p);
  assert.deepEqual(linhas, [[rb.eu, 1250, 2000, 2, 3, 1]]);
  assert.ok(Number.isInteger(recebeu(ana, "g2-pos")[0].k));
  // o retrato (a cada 1 s) traz todos do canal, e não é volátil
  esquece(ana); anda(1000); await espera(250);
  const ret = recebeu(ana, "g2-retrato");
  assert.ok(ret.length >= 1);
  assert.equal(ret[0].p.length, 3);
  // saiu
  await pede(bia, "g2-sair");
  await espera(100);
  assert.deepEqual(recebeu(ana, "g2-saiu"), [{ id: rb.eu }]);
  assert.ok(!membro("bia"), "a bia saiu e continua como membro do canal");
});

test("trocar de mapa troca de sala, sem ler o banco de novo; a posição tem de cair no mapa", async () => {
  await limpa();
  const ana = await entra("ana"), bia = await entra("bia");
  await noMapa(ana, "vila1", 0, 0);
  const rb = await noMapa(bia, "vila1", 100, 0);
  const antes = leituras;
  const r2 = await noMapa(bia, "hahoe", 0, 70000);
  assert.equal(r2.ok, true); assert.equal(r2.eu, rb.eu, "o mesmo id");
  assert.equal(leituras, antes, "o personagem é o mesmo: sem leitura");
  await espera(100);
  assert.deepEqual(recebeu(ana, "g2-saiu"), [{ id: rb.eu }]);
  assert.equal(W.__estadoMundoG2.canais.get("hahoe#1").membros.size, 1);
  assert.equal((await noMapa(bia, "hahoe", 0, 0)).codigo, "fora_do_mapa", "a posição é da Vila 1");
  assert.equal((await noMapa(bia, "atlantida", 0, 0)).codigo, "mapa_invalido");
  assert.equal((await noMapa(bia, "dg3", 30000, 0)).ok, true, "as cavernas têm sala compartilhada");
  assert.equal((await pede(bia, "g2-entrar", { espaco: 0, mapa: "dg3", x: 30000, y: 0 })).codigo, "rapido", "1 g2-entrar por segundo");
  anda(1000);
  assert.equal((await pede(bia, "g2-entrar", { espaco: 7, mapa: "dg3", x: 30000, y: 0 })).codigo, "espaco_invalido");
});

test("canais: enche o CH1 até 30 e abre o CH2; o mais cheio que cabe recebe o próximo", async () => {
  await limpa();
  const lote = [];
  for (let i = 0; i < W.MAX_POR_CANAL; i++) lote.push(await entra("lote" + i));
  for (const s of lote) assert.equal((await noMapa(s, "daiyu", 0, -70000)).canal, 1);
  const extra = await entra("extra");
  assert.equal((await noMapa(extra, "daiyu", 0, -70000)).canal, 2);
  await pede(lote[0], "g2-sair");
  const outro = await entra("outro");
  assert.equal((await noMapa(outro, "daiyu", 0, -70000)).canal, 1, "o CH1 voltou a ter vaga e é o mais cheio");
});

test("privado (o salão do chefe, as cenas): some para os outros e não manda posição", async () => {
  await limpa();
  const ana = await entra("ana"), bia = await entra("bia");
  await noMapa(ana, "dg3", 30000, 0);
  const rb = await noMapa(bia, "dg3", 30100, 0);
  const rp = await noMapa(bia, null, 0, 0, { privado: 1 });
  assert.equal(rp.ok, true); assert.equal(rp.canal, 0); assert.equal(rp.privado, 1);
  await espera(100);
  assert.deepEqual(recebeu(ana, "g2-saiu"), [{ id: rb.eu }]);
  esquece(ana); anda(100); eu(bia, 30150, 0); await espera(250);
  assert.equal(recebeu(ana, "g2-pos").length, 0);
});

// ================================================================= as posições
test("g2-eu: seq velho descartado, no máximo 15 por segundo, fora da caixa descartado", async () => {
  await limpa();
  const ana = await entra("ana"), bia = await entra("bia");
  await noMapa(ana, "vila1", 0, 0); await noMapa(bia, "vila1", 100, 0);
  anda(100);
  bia.emit("g2-eu", [10, 120, 0, 3, 0, 0]);
  bia.emit("g2-eu", [9, 120, 0, 5, 0, 0]);   // velho
  await espera(80);
  assert.equal(membro("bia").d, 3);
  anda(1000);
  for (let i = 0; i < 20; i++) bia.emit("g2-eu", [100 + i, 120, 0, i % 8, 0, 0]);
  await espera(120);
  assert.equal(membro("bia").d, 14 % 8, "o 16º em diante foi descartado");
  anda(1000);
  bia.emit("g2-eu", [500, 900000, 0, 0, 0, 0]);   // x = 9 km: fora de tudo
  await espera(80);
  assert.equal(membro("bia").x, 120);
  assert.equal(membro("bia").faltas.length, 0, "fora da caixa só descarta, sem falta");
});

test("velocidade: o balde, o salto não repassado, reposiciona depois de 3 s coerentes, o teleporte e a suspensão", async () => {
  await limpa();
  const ana = await entra("ana"), bia = await entra("bia");
  await noMapa(ana, "vila1", 0, 0);
  const rb = await noMapa(bia, "vila1", 0, 0);
  const avisos = []; const warn = console.warn; console.warn = (...a) => avisos.push(a.join(" "));
  try {
    // 1,5 m em 0,1 s cabe em VMAX × dt + 1 m (1,85 m); 4 m em 0,1 s passa disso, mas cabe pelo balde
    anda(100); eu(bia, 150, 0); await espera(60);
    assert.equal(membro("bia").x, 150);
    anda(100); eu(bia, 550, 0); await espera(60);
    assert.equal(membro("bia").x, 550, "a Investida cabe no balde");
    assert.ok(membro("bia").balde < W.VEL.BALDE_M);
    // um salto de 30 m: não repassa e conta uma falta
    esquece(ana);
    anda(100); eu(bia, 3550, 0); await espera(250);
    assert.equal(membro("bia").x, 550);
    assert.equal(membro("bia").faltas.length, 1);
    assert.ok(!recebeu(ana, "g2-pos").flatMap((x) => x.p).some((l) => l[0] === rb.eu && l[1] === 3550));
    // as posições seguintes, coerentes entre si: depois de 3 s o servidor aceita (era lag) e conta mais uma falta
    for (let k = 1; k <= 6; k++) { anda(500); eu(bia, 3550 + k * 100, 0); }
    await espera(80);
    assert.equal(membro("bia").x, 4150);
    assert.equal(membro("bia").faltas.length, 2);
    // o teleporte (bit 16): vale um a cada 3 s
    anda(3000); eu(bia, 4150, 5000, W.BIT.TELEPORTE); await espera(60);
    assert.equal(membro("bia").y, 5000, "o teleporte vale");
    anda(100); eu(bia, 4150, 10000, W.BIT.TELEPORTE); await espera(60);
    assert.equal(membro("bia").y, 5000, "o segundo, antes dos 3 s, não vale");
    assert.equal(membro("bia").faltas.length, 3);
    // mais 3 saltos sem coerência: 6 faltas em 5 min → 60 s sem repasse e um console.warn
    for (const x of [-10000, 10000, -10000]) { anda(100); eu(bia, x, 5000); }
    await espera(80);
    assert.ok(membro("bia").suspensoAte > relogio);
    assert.ok(avisos.some((a) => a.includes("BIA") && a.includes("sem repasse")), avisos.join("\n"));
    // suspenso: o passo comum é aceito, mas ninguém recebe
    const linhasDaBia = () => [...recebeu(ana, "g2-pos"), ...recebeu(ana, "g2-retrato")].flatMap((x) => x.p).filter((l) => l[0] === rb.eu);
    esquece(ana);
    anda(100); eu(bia, 4200, 5000); await espera(250);
    assert.equal(membro("bia").x, 4200);
    assert.deepEqual(linhasDaBia(), [], "nem no g2-pos nem no retrato");
    // passou o castigo: volta a aparecer
    anda(W.VEL.SUSPENSO_MS); eu(bia, 4250, 5000); await espera(250);
    assert.ok(linhasDaBia().some((l) => l[1] === 4250));
  } finally { console.warn = warn; }
});

test("posição em outro mapa sem o bit do teleporte: descarta e conta falta; com o bit, só descarta", async () => {
  await limpa();
  const bia = await entra("bia");
  await noMapa(bia, "vila1", 0, 0);
  anda(100); eu(bia, 0, 70000); await espera(60);
  assert.equal(membro("bia").y, 0); assert.equal(membro("bia").faltas.length, 1);
  anda(100); eu(bia, 0, 70000, W.BIT.TELEPORTE); await espera(60);
  assert.equal(membro("bia").y, 0); assert.equal(membro("bia").faltas.length, 1);
});

// ================================================================= a aparência e o nível
test("g2-vis preso e com limite; g2-nivel pelo gancho do PUT", async () => {
  await limpa();
  const ana = await entra("ana"), bia = await entra("bia");
  await noMapa(ana, "vila1", 0, 0);
  const rb = await noMapa(bia, "vila1", 100, 0);
  anda(2000);
  assert.equal((await pede(bia, "g2-vis", { vis: { arm: 99, arma: 3, rara: "x", ref: -5, cav: 7 } })).ok, true);
  assert.equal((await pede(bia, "g2-vis", { vis: { arm: 2 } })).codigo, "rapido", "1 a cada 2 s");
  await espera(100);
  assert.deepEqual(recebeu(ana, "g2-vis"), [{ id: rb.eu, vis: { arm: 8, arma: 3, rara: 1, ref: 0, cav: 7 } }]);
  assert.equal(W.mundoG2.nivel("bia", 0, 33), true);
  assert.equal(W.mundoG2.nivel("bia", 1, 40), false, "outro espaço: nada");
  await espera(100);
  assert.deepEqual(recebeu(ana, "g2-nivel"), [{ id: rb.eu, nivel: 33 }]);
  ligado = false;
  assert.equal(W.mundoG2.nivel("bia", 0, 34), false, "desligado: no-op");
  assert.equal(W.mundoG2.derrubar("bia"), false, "desligado: no-op");
});

// ================================================================= a limpeza
test("caindo: 5 s sem aparecer para ninguém novo; voltando, o mesmo lugar e o mesmo id, sem g2-saiu", async () => {
  await limpa();
  const ana = await entra("ana");
  let bia = await entra("bia");
  await noMapa(ana, "vila1", 0, 0);
  const rb = await noMapa(bia, "vila1", 100, 0);
  bia.disconnect(); await espera(80);
  const caio = await entra("caio");
  const rc = await noMapa(caio, "vila1", 200, 0);
  const antes = leituras;
  assert.ok(!rc.membros.some((m) => m.id === rb.eu), "quem chega não vê quem está caindo");
  bia = await entra("bia");
  const r2 = await noMapa(bia, "vila1", 150, 0);
  assert.equal(r2.eu, rb.eu); assert.equal(r2.canal, rb.canal);
  assert.equal(leituras, antes, "voltou com o mesmo personagem: sem leitura");
  await espera(400);
  assert.equal(recebeu(ana, "g2-saiu").length, 0, "sem piscar");
  assert.ok(recebeu(caio, "g2-chegou").some((m) => m.id === rb.eu), "o caio passa a ver a bia");
  // agora cai de vez: depois do prazo, g2-saiu e o canal fica com 2
  bia.disconnect(); await espera(W.CFG.CAINDO_MS + 200);
  assert.deepEqual(recebeu(ana, "g2-saiu"), [{ id: rb.eu }]);
  assert.equal(W.__estadoMundoG2.canais.get("vila1#1").membros.size, 2);
  assert.equal(W.__estadoMundoG2.regs.has("bia"), false);
});

test("outra aba com a mesma sessão substitui a velha (aviso outra_aba)", async () => {
  await limpa();
  const ana = await entra("ana");
  const bia1 = await entra("bia");
  await noMapa(ana, "vila1", 0, 0);
  const rb = await noMapa(bia1, "vila1", 100, 0);
  const bia2 = await entra("bia");
  await espera(100);
  assert.equal(recebeu(bia1, "g2-aviso")[0].codigo, "outra_aba");
  assert.equal(bia1.caiu, "io server disconnect");
  const r2 = await noMapa(bia2, "vila1", 100, 0);
  assert.equal(r2.eu, rb.eu);
  assert.equal(recebeu(ana, "g2-saiu").length, 0);
});

test("ganchos: a sessão nova derruba a velha na hora; a mesma sessão fica", async () => {
  await limpa();
  const ana = await entra("ana"), bia = await entra("bia");
  await noMapa(ana, "vila1", 0, 0);
  const rb = await noMapa(bia, "vila1", 100, 0);
  assert.equal(W.mundoG2.derrubar("bia", { excetoSessao: "sessao-bia", codigo: "sessao_tomada" }), false, "a sessão atual fica");
  assert.equal(W.mundoG2.derrubar("bia", { soSessao: "outra", codigo: "saiu" }), false);
  assert.equal(W.mundoG2.derrubar("bia", { excetoSessao: "nova", codigo: "sessao_tomada" }), true);
  await espera(100);
  assert.deepEqual(recebeu(bia, "g2-aviso"), [{ codigo: "sessao_tomada", txt: "Você entrou nesta conta em outro computador." }]);
  assert.equal(bia.caiu, "io server disconnect");
  assert.deepEqual(recebeu(ana, "g2-saiu"), [{ id: rb.eu }], "sem os 5 s do caindo");
  assert.equal(W.mundoG2.derrubar("ninguem"), false);
});

test("10 min sem g2-eu: aviso e derruba", async () => {
  await limpa();
  const ana = await entra("ana"), bia = await entra("bia");
  await noMapa(ana, "vila1", 0, 0); await noMapa(bia, "vila1", 100, 0);
  anda(W.CFG.PARADO_MS - 3000); eu(ana, 0, 0, 0, 1);   // (a ana mandou; a bia não)
  anda(2000); await espera(200);
  assert.equal(recebeu(bia, "g2-aviso")[0].codigo, "parado");
  assert.equal(bia.caiu, "io server disconnect");
  assert.equal(ana.connected, true);
});

// ================================================================= o chat
test("filtraFala: palavrão vira ***, contato vira *** e só contato é recusado", () => {
  assert.deepEqual(C.filtraFala("  oi   pessoal  "), { ok: true, txt: "oi pessoal" });
  assert.equal(C.filtraFala("seu porra!").txt, "seu ***");
  assert.equal(C.filtraFala("p o r r a mesmo").txt, "*** *** *** *** *** mesmo");
  assert.equal(C.filtraFala("o Pikachu e o Pica-Pau").txt, "o Pikachu e o Pica-Pau");
  assert.equal(C.filtraFala("me chama no zap 11 99999-8888").txt, "me chama no *** ***");
  assert.equal(C.filtraFala("@fulano123").codigo, "contato");
  assert.equal(C.filtraFala("www.site.com").codigo, "contato");
  assert.equal(C.filtraFala("").codigo, "vazio");
  assert.equal(C.filtraFala(42).codigo, "vazio");
  assert.equal(C.filtraFala("a".repeat(300)).txt.length, C.CHAT.maxTxt);
});

test("chat do mapa: vai para o canal (com quem falou), com nome e nível do banco; flood recusado", async () => {
  await limpa();
  novaConta("ana", { nivel: 3, classe: "ninja" });
  const ana = await entra("ana"), bia = await entra("bia"), zeca = await entra("zeca");
  await noMapa(ana, "vila1", 0, 0); const rb = await noMapa(bia, "vila1", 100, 0); await noMapa(zeca, "hahoe", 0, 70000);
  const ra = W.__estadoMundoG2.regs.get("ana").id;
  assert.deepEqual(await pede(ana, "g2-falar", { canal: "mapa", txt: "oi seu porra" }), { ok: true });
  await espera(100);
  const f = { id: ra, nome: "ANA", nivel: 3, classe: "ninja", canal: "mapa", txt: "oi seu ***" };
  assert.deepEqual(recebeu(bia, "g2-fala"), [f]);
  assert.deepEqual(recebeu(ana, "g2-fala"), [f], "a linha volta para quem falou");
  assert.equal(recebeu(zeca, "g2-fala").length, 0, "outro mapa não ouve");
  assert.equal((await pede(ana, "g2-falar", { canal: "mapa", txt: "de novo" })).codigo, "flood", "900 ms entre falas");
  assert.equal((await pede(ana, "g2-falar", { canal: "mapa", txt: "@fulano" })).codigo, "contato");
  assert.equal((await pede(ana, "g2-falar", { canal: "sussurro", txt: "oi" })).codigo, "canal_invalido");
  assert.ok(rb.ok);
});

test("chat global: só do nível 10, uma fala a cada 15 s, para todos (até no privado)", async () => {
  await limpa();
  novaConta("baixo", { nivel: 9 }); novaConta("alto", { nivel: 10 });
  const baixo = await entra("baixo"), alto = await entra("alto"), longe = await entra("longe"), priv = await entra("priv");
  await noMapa(baixo, "vila1", 0, 0); await noMapa(alto, "vila1", 100, 0); await noMapa(longe, "daiyu", 0, -70000);
  await noMapa(priv, null, 0, 0, { privado: 1 });
  assert.equal((await pede(baixo, "g2-falar", { canal: "global", txt: "alguém?" })).codigo, "nivel_baixo");
  assert.deepEqual(await pede(alto, "g2-falar", { canal: "global", txt: "vendo nada, só testando" }), { ok: true });
  await espera(100);
  for (const s of [baixo, alto, longe, priv]) assert.equal(recebeu(s, "g2-fala").filter((x) => x.canal === "global").length, 1);
  anda(5000);
  const r = await pede(alto, "g2-falar", { canal: "global", txt: "de novo" });
  assert.equal(r.codigo, "espera"); assert.ok(r.esperaMs > 9000 && r.esperaMs <= 10000);
  anda(10000);
  assert.deepEqual(await pede(alto, "g2-falar", { canal: "global", txt: "agora sim" }), { ok: true });
  await pede(alto, "g2-sair");
  assert.equal((await pede(alto, "g2-falar", { canal: "global", txt: "fora do mundo" })).codigo, "sem_personagem");
});

test("silenciado por rajada: g2-aviso e recusa", async () => {
  await limpa();
  const ana = await entra("ana");
  await noMapa(ana, "vila1", 0, 0);
  for (let i = 0; i < 8; i++) { anda(1000); await pede(ana, "g2-falar", { canal: "mapa", txt: "msg " + i }); }
  anda(1000);
  const r = await pede(ana, "g2-falar", { canal: "mapa", txt: "mais uma" });
  assert.equal(r.codigo, "silenciado");
  await espera(50);
  assert.equal(recebeu(ana, "g2-aviso").at(-1).codigo, "silenciado");
});

test("g2-denunciar: guarda as últimas falas daquele id; não vale contra si mesmo nem seguido", async () => {
  await limpa();
  const ana = await entra("ana"), bia = await entra("bia");
  const ra = await noMapa(ana, "vila1", 0, 0); const rb = await noMapa(bia, "vila1", 100, 0);
  const warn = console.warn; console.warn = () => {};
  try {
    for (let i = 0; i < 3; i++) { anda(1000); await pede(ana, "g2-falar", { canal: "mapa", txt: "fala " + i }); }
    assert.deepEqual(await pede(bia, "g2-denunciar", { id: ra.eu }), { ok: true });
    assert.equal(C.__denunciasG2.length, 1);
    const d = C.__denunciasG2[0];
    assert.equal(d.contra.nome, "ANA"); assert.equal(d.de.nome, "BIA");
    assert.deepEqual(d.falas.map((x) => x.txt), ["fala 0", "fala 1", "fala 2"]);
    assert.equal((await pede(bia, "g2-denunciar", { id: ra.eu })).codigo, "espera");
    assert.equal((await pede(bia, "g2-denunciar", { id: rb.eu })).codigo, "id_invalido");
    assert.equal((await pede(ana, "g2-denunciar", { id: rb.eu })).codigo, "sem_falas");
  } finally { console.warn = warn; }
});
