// v407 (Raio-X U1/U5/U6/U7): regras novas de segurança e convivência do Lenda do Campinho. Sem banco de verdade.
import { test } from "node:test";
import assert from "node:assert/strict";
import { montaNomeTime, lePartesTime, timePublico, TIME_PREFIXOS, TIME_LUGARES } from "../../src/lenda/times.js";
import { contaVisita, podePedirAmizade, PEDIDOS_DIA, validarDenuncia, podeDenunciar, DENUNCIAS_DIA, MOTIVOS_DENUNCIA, __zeraLimites } from "../../src/lenda/limites.js";
import { contasForaDoRanking, registrarSuspeito, ehSuspeito, GAME_KEY } from "../../src/lenda/suspeitos.js";
import { apagarDadosLenda, sairDaGuilda, novoLider, COMPRADOR_APAGADO, MODELOS_LENDA } from "../../src/lenda/apagar.js";
import { prefsDe, definePrefs, PADRAO, __zeraPrefs } from "../../src/lenda/prefs.js";

test("U1: nome do time só das listas", () => {
  assert.equal(montaNomeTime("0.0"), "Esporte Clube Campinho");
  assert.equal(montaNomeTime(`${TIME_PREFIXOS.length - 1}.${TIME_LUGARES.length - 1}`), "União do Aroeira");
  for (const ruim of ["", "1", "1.1.1", "a.b", "99.0", "0.999", null, 3, "-1.0"]) assert.equal(montaNomeTime(ruim), null, String(ruim));
  assert.deepEqual(lePartesTime("2.5"), { p: 2, l: 5 });
  // v408: o nome digitado vale se passar no filtro; senão o das partes; senão nenhum
  assert.deepEqual(timePublico({ nome: "caralho", partes: "1.1", div: 2, titulos: 3 }), { nome: "Grêmio Poeirão", partes: "1.1", div: 2, titulos: 3 });
  assert.deepEqual(timePublico({ nome: "Skalzinho pika FC", div: 2 }), { nome: null, partes: null, div: 2, titulos: 0 }, "o nome guardado feio não sai");
  assert.equal(timePublico({ nome: "Skal FC", partes: "1.1", div: 2 }).nome, "Skal FC");
  assert.equal(timePublico(null), null);
});

test("U7: visita de casa conta 1 por visitante por dia", () => {
  __zeraLimites();
  const t = Date.UTC(2026, 9, 6, 15);
  assert.equal(contaVisita("a", "dono", t), true);
  assert.equal(contaVisita("a", "dono", t + 3600e3), false, "mesmo dia");
  assert.equal(contaVisita("b", "dono", t), true, "outro visitante");
  assert.equal(contaVisita("a", "outro", t), true, "outra casa");
  assert.equal(contaVisita("a", "dono", t + 864e5), true, "dia seguinte");
});

test("U5: pedidos de amizade por dia", () => {
  __zeraLimites();
  const t = Date.UTC(2026, 9, 6, 15);
  for (let i = 0; i < PEDIDOS_DIA; i++) assert.equal(podePedirAmizade("u", t), true);
  assert.equal(podePedirAmizade("u", t), false);
  assert.equal(podePedirAmizade("outro", t), true);
  assert.equal(podePedirAmizade("u", t + 864e5), true, "amanhã pode de novo");
});

test("U5: denúncia só com motivo pronto e com limites", () => {
  __zeraLimites();
  assert.ok(validarDenuncia({ alvoId: "cku123abc", motivo: 0 }).ok);
  assert.equal(validarDenuncia({ alvoId: "cku123abc", motivo: 0, onde: "rio" }).onde, "rio");
  assert.equal(validarDenuncia({ alvoId: "cku123abc", motivo: 0, onde: "<b>" }).onde, null);
  assert.ok(!validarDenuncia({ alvoId: "cku123abc", motivo: MOTIVOS_DENUNCIA.length }).ok);
  assert.ok(!validarDenuncia({ alvoId: "cku123abc", motivo: "xingou" }).ok, "texto livre não");
  assert.ok(!validarDenuncia({ alvoId: "<script>", motivo: 1 }).ok);
  const t = Date.UTC(2026, 9, 6, 15);
  assert.ok(podeDenunciar("eu", "alvo1", t).ok);
  assert.ok(!podeDenunciar("eu", "alvo1", t).ok, "o mesmo jogador 1 vez por dia");
  for (let i = 2; i <= DENUNCIAS_DIA; i++) assert.ok(podeDenunciar("eu", "alvo" + i, t).ok);
  assert.ok(!podeDenunciar("eu", "alvoX", t).ok, "teto do dia");
});

test("U5: preferências — padrão protegido (convites só de amigos, visível)", () => {
  __zeraPrefs();
  assert.deepEqual(prefsDe("x"), PADRAO);
  assert.equal(PADRAO.convitesTodos, false);
  assert.deepEqual(definePrefs("x", { invisivel: true }), { convitesTodos: false, invisivel: true });
  assert.deepEqual(definePrefs("x", { convitesTodos: "sim" }), { convitesTodos: false, invisivel: true }, "só aceita booleano");
  assert.deepEqual(definePrefs("x", { convitesTodos: true }), { convitesTodos: true, invisivel: true });
});

// ---------- banco de mentira (só o que os módulos usam) ----------
function tabela() {
  const linhas = [];
  const casa = (l, w = {}) => Object.entries(w).every(([k, v]) => {
    if (k === "OR") return v.some((x) => casa(l, x));
    if (v && typeof v === "object" && !(v instanceof Date)) {
      if ("in" in v) return v.in.includes(l[k]);
      if ("gte" in v) return l[k] >= v.gte;
      return true;
    }
    return l[k] === v;
  });
  return {
    linhas,
    findUnique: async ({ where }) => linhas.find((l) => casa(l, where)) || null,
    findFirst: async ({ where = {} } = {}) => linhas.find((l) => casa(l, where)) || null,
    findMany: async ({ where = {}, distinct } = {}) => { let r = linhas.filter((l) => casa(l, where)); if (distinct) { const vis = new Set(); r = r.filter((l) => { const k = distinct.map((d) => l[d]).join("|"); if (vis.has(k)) return false; vis.add(k); return true; }); } return r; },
    create: async ({ data }) => { linhas.push({ ...data }); return data; },
    update: async ({ where, data }) => { const l = linhas.find((x) => casa(x, where)); Object.assign(l, data); return l; },
    updateMany: async ({ where, data }) => { let n = 0; for (const l of linhas) if (casa(l, where)) { Object.assign(l, data); n++; } return { count: n }; },
    delete: async ({ where }) => { const i = linhas.findIndex((x) => casa(x, where)); return linhas.splice(i, 1)[0]; },
    deleteMany: async ({ where = {} } = {}) => { let n = 0; for (let i = linhas.length - 1; i >= 0; i--) if (casa(linhas[i], where)) { linhas.splice(i, 1); n++; } return { count: n }; },
  };
}
const banco = () => Object.fromEntries([...MODELOS_LENDA, "user", "suspiciousActivity"].map((m) => [m, tabela()]));

test("U7/v409: fora do ranking — banido, oculto e suspeito de trapaça (admin aparece; envio só 'rápido' não esconde)", async () => {
  const db = banco();
  for (const u of [{ id: "ok" }, { id: "ban", banned: true }, { id: "oc", ocultoNoRanking: true }, { id: "adm", role: "ADMIN" }, { id: "sus" }]) db.user.linhas.push({ banned: false, ocultoNoRanking: false, role: "PLAYER", ...u });
  // o fake não entende OR de booleanos do User: simula a consulta do Prisma
  db.user.findMany = async ({ where }) => db.user.linhas.filter((u) => where.id.in.includes(u.id) && (u.banned || u.ocultoNoRanking));
  const t = Date.UTC(2026, 9, 6, 15);
  assert.equal(await registrarSuspeito(db, "sus", "lenda_xp_rapido_demais", "teste", t), true);
  db.suspiciousActivity.linhas.forEach((l) => { l.createdAt = new Date(t); }); // (o banco põe a data sozinho)
  assert.equal(await registrarSuspeito(db, "sus", "lenda_xp_rapido_demais", "de novo", t + 60e3), false, "não repete em 6 h");
  assert.equal(await registrarSuspeito(db, "sus", "lenda_xp_rapido_demais", "depois", t + 7 * 3600e3), true, "depois de 6 h grava de novo");
  assert.equal(db.suspiciousActivity.linhas[0].gameKey, GAME_KEY);
  // só "rápido demais": aparece no painel, mas NÃO esconde (v409)
  let fora = await contasForaDoRanking(db, ["ok", "ban", "oc", "adm", "sus"]);
  assert.deepEqual([...fora].sort(), ["ban", "oc"], "admin aparece; 'rápido demais' não esconde");
  assert.equal(await ehSuspeito(db, "sus"), false);
  // XP fora da curva (ou absurdo) esconde e trava a feira
  await registrarSuspeito(db, "sus", "lenda_xp_fora_da_curva", "x", t);
  fora = await contasForaDoRanking(db, ["ok", "ban", "oc", "adm", "sus"]);
  assert.deepEqual([...fora].sort(), ["ban", "oc", "sus"]);
  assert.equal(await ehSuspeito(db, "sus"), true);
  assert.equal(await ehSuspeito(db, "ok"), false);
});

test("U6: apagar os dados do Lenda de uma conta (e passar a liderança da guilda)", async () => {
  const db = banco(), eu = "eu", outro = "outro";
  db.lendaSave.linhas.push({ userId: eu }, { userId: outro });
  db.lendaRanking.linhas.push({ userId: eu }); db.lendaCasa.linhas.push({ userId: eu }); db.lendaSessao.linhas.push({ userId: eu }, { userId: eu });
  db.lendaTorcida.linhas.push({ de: eu, para: outro }, { de: outro, para: eu }, { de: outro, para: "x" });
  db.lendaAnuncio.linhas.push({ vendedorId: eu }, { vendedorId: outro }); db.lendaBarraca.linhas.push({ vendedorId: eu }); db.lendaMercadoCota.linhas.push({ userId: eu });
  db.lendaVenda.linhas.push({ vendedorId: eu, compradorId: outro }, { vendedorId: outro, compradorId: eu });
  db.lendaGuilda.linhas.push({ id: "g", liderId: eu });
  db.lendaGuildaMembro.linhas.push({ userId: eu, guildaId: "g", papel: "lider", entrouEm: new Date(1) }, { userId: "m1", guildaId: "g", papel: "membro", entrouEm: new Date(2) }, { userId: "v1", guildaId: "g", papel: "vice", entrouEm: new Date(3) });
  db.lendaGuildaConvite.linhas.push({ userId: eu, guildaId: "h", deId: "z" }, { userId: "y", guildaId: "g", deId: eu });
  const feito = await apagarDadosLenda(db, eu);
  assert.equal(feito.guilda, "saiu");
  assert.equal(db.lendaGuilda.linhas[0].liderId, "v1", "o vice vira líder");
  assert.equal(db.lendaGuildaMembro.linhas.find((m) => m.userId === "v1").papel, "lider");
  for (const m of ["lendaSave", "lendaRanking", "lendaCasa", "lendaSessao", "lendaAnuncio", "lendaBarraca", "lendaMercadoCota", "lendaGuildaMembro", "lendaGuildaConvite", "lendaTorcida"]) {
    assert.ok(!JSON.stringify(db[m].linhas).includes(`"${eu}"`), m);
  }
  assert.equal(db.lendaSave.linhas.length, 1, "o save do outro fica");
  assert.equal(db.lendaTorcida.linhas.length, 1);
  assert.deepEqual(db.lendaVenda.linhas, [{ vendedorId: outro, compradorId: COMPRADOR_APAGADO }], "a venda do outro fica para ele recolher, sem o id");
});

test("U6: último membro sai → a guilda some; sem a tabela, pula", async () => {
  const db = banco();
  db.lendaGuilda.linhas.push({ id: "g" }); db.lendaGuildaMembro.linhas.push({ userId: "so", guildaId: "g", papel: "lider" }); db.lendaGuildaConvite.linhas.push({ guildaId: "g", userId: "a", deId: "so" });
  assert.equal(await sairDaGuilda(db, "so"), "apagada");
  assert.equal(db.lendaGuilda.linhas.length, 0); assert.equal(db.lendaGuildaConvite.linhas.length, 0);
  assert.equal(await sairDaGuilda(db, "ninguem"), null);
  assert.equal(novoLider([{ userId: "a", papel: "membro", entrouEm: new Date(5) }, { userId: "b", papel: "membro", entrouEm: new Date(1) }]).userId, "b", "sem vice: o mais antigo");
  const db2 = banco(); db2.lendaSave.linhas.push({ userId: "u" });
  await apagarDadosLenda(db2, "u", new Set(["lendaRanking"]));
  assert.equal(db2.lendaSave.linhas.length, 1, "tabela fora da lista não é mexida");
});
