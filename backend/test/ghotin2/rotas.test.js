// Ghotin2 — as rotas de /api/ghotin2 (routes/ghotin2.js): conta, travas, sessão, 4 personagens, save, comum, ranking e
// recuperação de senha (com o e-mail simulado).
//
// Padrão: banco de mentira (test/ghotin2/bancoDeMentira.js), nada de Postgres.
// Com G2_TESTE_DB=1 o MESMO teste roda num Postgres de verdade, com o Prisma de verdade, apontado por DATABASE_URL para
// um banco DESCARTÁVEL (as tabelas Ghotin2* são esvaziadas a cada servidor). Recusa rodar contra o Neon.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
const BANCO_REAL = process.env.G2_TESTE_DB === "1";
if (BANCO_REAL) {
  if (!process.env.DATABASE_URL || /neon\.tech|render\.com|amazonaws/i.test(process.env.DATABASE_URL)) throw new Error("G2_TESTE_DB=1 só com um banco local descartável");
} else {
  process.env.DATABASE_URL = "postgresql://ninguem:nada@127.0.0.1:1/teste_sem_banco"; // o PrismaClient de db.js nem conecta
}
process.env.JWT_SECRET ||= "teste-ghotin2-segredo";
const { criaRotasGhotin2, LIMITES_IP, TRAVA } = await import("../../src/routes/ghotin2.js");
const { criaGuardaSave } = await import("../../src/lenda/saveNuvem.js");
const { esquecerContaG2 } = await import("../../src/ghotin2/auth.js");
const { signToken } = await import("../../src/utils/jwt.js");
const R = await import("../../src/ghotin2/regras.js");
const { bancoDeMentira } = await import("./bancoDeMentira.js");

let relogio = Date.UTC(2026, 10, 3, 12);
const anda = (ms) => { relogio += ms; };
const MIN = 60_000, H = 60 * MIN;

let prismaReal = null;
if (BANCO_REAL) {
  const { PrismaClient } = await import("@prisma/client");
  prismaReal = new PrismaClient();
  after(() => prismaReal.$disconnect());
}
const FOLGADOS = Object.fromEntries(Object.entries(LIMITES_IP).map(([k, v]) => [k, { ...v, max: 1000 }]));

async function servidor({ limites = FOLGADOS } = {}) {
  let prisma;
  if (BANCO_REAL) {
    prisma = prismaReal;
    await prisma.ghotin2Comum.deleteMany({}); await prisma.ghotin2Personagem.deleteMany({}); await prisma.ghotin2Conta.deleteMany({});
  } else prisma = bancoDeMentira({ agora: () => relogio });
  const emails = [];
  const app = express(); app.use(express.json());
  app.use("/api/ghotin2", criaRotasGhotin2({
    prisma, agora: () => relogio, guarda: criaGuardaSave({ agora: () => relogio }), limites, rankingCacheS: 0,
    enviarEmail: async (m) => { emails.push(m); return true; }, urlJogo: "https://jogo.teste/ghotin2/",
  }));
  const srv = app.listen(0); after(() => srv.close());
  const base = `http://localhost:${srv.address().port}/api/ghotin2`;
  const pede = async (metodo, p, { token, corpo } = {}) => {
    const h = { "Content-Type": "application/json" }; if (token) h.Authorization = "Bearer " + token;
    const r = await fetch(base + p, { method: metodo, headers: h, body: corpo ? JSON.stringify(corpo) : undefined });
    return { status: r.status, corpo: await r.json() };
  };
  const cadastra = async (usuario, extra = {}) => {
    const r = await pede("POST", "/conta/cadastrar", { corpo: { usuario, senha: "senha-forte-1", email: `${usuario}@gmail.com`, tenho13: true, ...extra } });
    assert.equal(r.status, 201, JSON.stringify(r.corpo));
    return r.corpo.token;
  };
  const sessao = async (token) => (await pede("POST", "/sessao", { token })).corpo.sessao;
  const conta = (usuario) => prisma.ghotin2Conta.findUnique({ where: { usuario } });
  return { prisma, pede, cadastra, sessao, conta, emails };
}
const b64 = (t) => Buffer.from(t).toString("base64");
const salva = (s, { token, ses, espaco = 0, versaoBase, resumo = { nivel: 1, exp: 0 }, dados = b64("save"), ...extra }) =>
  s.pede("PUT", `/personagens/${espaco}`, { token, corpo: { dados, versaoBase, sessao: ses, resumo, salvoEm: relogio, ...extra } });

test("sem token, token do site ou token estragado: 401 token_invalido", async () => {
  const s = await servidor();
  for (const token of [undefined, signToken({ id: "x", nickname: "Kim", role: "ADMIN" }), "abc.def.ghi"]) {
    const r = await s.pede("GET", "/personagens", { token });
    assert.equal(r.status, 401); assert.equal(r.corpo.codigo, "token_invalido");
  }
});

test("cadastrar: cria a conta, guarda só a impressão do e-mail e recusa o que não pode", async () => {
  const s = await servidor();
  const r = await s.pede("POST", "/conta/cadastrar", { corpo: { usuario: "Kim_23", senha: "senha-forte-1", email: "Kim.Real@Gmail.com", tenho13: true } });
  assert.equal(r.status, 201);
  assert.deepEqual(Object.keys(r.corpo.conta).sort(), ["criadoEm", "nome", "usuario"]);
  assert.equal(r.corpo.conta.usuario, "kim_23"); assert.equal(r.corpo.conta.nome, "Kim_23");
  assert.equal((await s.pede("GET", "/conta/quem-sou", { token: r.corpo.token })).status, 200);
  const c = await s.conta("kim_23");
  const tudo = JSON.stringify(c).toLowerCase();
  assert.ok(!tudo.includes("kim.real") && !tudo.includes("gmail"), "o e-mail não fica no banco");
  assert.ok(!tudo.includes("senha-forte-1"), "a senha não fica no banco");
  assert.match(c.senhaHash, /^\$2[aby]\$10\$/); assert.match(c.emailHash, /^\$2[aby]\$10\$/);
  const casos = [
    [{ usuario: "KIM_23" }, 409, "usuario_em_uso"],
    [{ usuario: "ab" }, 400, "usuario_invalido"],
    [{ usuario: "caralho1" }, 400, "usuario_invalido"],
    [{ usuario: "admin_kim" }, 400, "usuario_invalido"],
    [{ usuario: "novo1", senha: "curta" }, 400, "senha_invalida"],
    [{ usuario: "novo1", email: "nada" }, 400, "email_invalido"],
    [{ usuario: "novo1", tenho13: false }, 400, "idade"],
    [{ usuario: "novo1", tenho13: "sim" }, 400, "idade"],
  ];
  for (const [mud, status, codigo] of casos) {
    const e = await s.pede("POST", "/conta/cadastrar", { corpo: { usuario: "x", senha: "senha-forte-1", email: "a@gmail.com", tenho13: true, ...mud } });
    assert.equal(e.status, status, JSON.stringify(mud)); assert.equal(e.corpo.codigo, codigo, JSON.stringify(mud));
  }
});

test("cadastro: 5 por IP a cada 10 min (o 6º leva 429 limite)", async () => {
  const s = await servidor({ limites: LIMITES_IP });
  for (let i = 0; i < 5; i++) await s.cadastra("conta" + i);
  const r = await s.pede("POST", "/conta/cadastrar", { corpo: { usuario: "conta9", senha: "senha-forte-1", email: "c9@gmail.com", tenho13: true } });
  assert.equal(r.status, 429); assert.equal(r.corpo.codigo, "limite"); assert.ok(r.corpo.tenteEmS > 0);
});

test("entrar: certo, errado, usuário que não existe e a trava de 5 erros por 15 min", async () => {
  const s = await servidor();
  await s.cadastra("kim");
  const ok = await s.pede("POST", "/conta/entrar", { corpo: { usuario: "KIM", senha: "senha-forte-1" } });
  assert.equal(ok.status, 200); assert.ok(ok.corpo.token);
  const errada = () => s.pede("POST", "/conta/entrar", { corpo: { usuario: "kim", senha: "errada-123" } });
  const ninguem = await s.pede("POST", "/conta/entrar", { corpo: { usuario: "ninguem", senha: "errada-123" } });
  assert.equal(ninguem.status, 401); assert.equal(ninguem.corpo.codigo, "credenciais");
  const e1 = await errada();
  assert.equal(e1.status, 401); assert.equal(e1.corpo.error, ninguem.corpo.error, "a mesma mensagem: não diz se o usuário existe");
  // acertar zera a contagem
  for (let i = 0; i < 3; i++) await errada();
  assert.equal((await s.pede("POST", "/conta/entrar", { corpo: { usuario: "kim", senha: "senha-forte-1" } })).status, 200);
  for (let i = 0; i < TRAVA.erros - 1; i++) assert.equal((await errada()).corpo.codigo, "credenciais", `erro ${i + 1}`);
  const quinto = await errada();
  assert.equal(quinto.status, 429); assert.equal(quinto.corpo.codigo, "conta_travada"); assert.equal(quinto.corpo.tenteEmS, 900);
  anda(5 * MIN);
  const travada = await s.pede("POST", "/conta/entrar", { corpo: { usuario: "kim", senha: "senha-forte-1" } });
  assert.equal(travada.status, 429, "nem a senha certa entra com a conta travada"); assert.equal(travada.corpo.tenteEmS, 600);
  anda(10 * MIN + 1000);
  assert.equal((await s.pede("POST", "/conta/entrar", { corpo: { usuario: "kim", senha: "senha-forte-1" } })).status, 200);
  const c = await s.conta("kim"); assert.equal(c.falhasLogin, 0); assert.equal(c.travadoAte, null);
});

test("entrar: 10 tentativas por IP a cada 15 min (aqui 3, para o teste)", async () => {
  const s = await servidor({ limites: { ...FOLGADOS, entrar: { windowMs: 15 * MIN, max: 3 } } });
  for (let i = 0; i < 3; i++) await s.pede("POST", "/conta/entrar", { corpo: { usuario: "x" + i, senha: "errada-123" } });
  const r = await s.pede("POST", "/conta/entrar", { corpo: { usuario: "kim", senha: "senha-forte-1" } });
  assert.equal(r.status, 429); assert.equal(r.corpo.codigo, "limite");
  assert.equal(LIMITES_IP.entrar.max, 10);
});

test("personagens: até 4 por conta, classe repetida pode, nome único no jogo, escrita só com a sessão", async () => {
  const s = await servidor();
  const tk = await s.cadastra("kim");
  const cria = (corpo) => s.pede("POST", "/personagens", { token: tk, corpo });
  const sem = await cria({ nome: "Kim", classe: "viking" });
  assert.equal(sem.status, 409); assert.equal(sem.corpo.codigo, "sessao_tomada");
  const ses = await s.sessao(tk);
  assert.equal(ses.length, 22);
  const r1 = await cria({ nome: "Kim", classe: "viking", sessao: ses });
  assert.equal(r1.status, 201); assert.equal(r1.corpo.personagem.espaco, 0); assert.equal(r1.corpo.personagem.versao, 0);
  assert.equal((await cria({ nome: "Kim Dois", classe: "viking", sessao: ses })).corpo.personagem.espaco, 1, "dois vikings");
  assert.equal((await cria({ nome: "Aprendiz", classe: "aprendiz", vocacao: "dragao", espaco: 3, sessao: ses })).corpo.personagem.espaco, 3);
  for (const [corpo, status, codigo] of [
    [{ nome: "KÍM", classe: "ninja" }, 409, "nome_em_uso"],
    [{ nome: "Ki", classe: "ninja" }, 400, "nome_invalido"],
    [{ nome: "Porra Loka", classe: "ninja" }, 400, "nome_invalido"],
    [{ nome: "Outro", classe: "mago" }, 400, "classe_invalida"],
    [{ nome: "Outro", classe: "aprendiz" }, 400, "vocacao_invalida"],
    [{ nome: "Outro", classe: "ninja", vocacao: "norte" }, 400, "vocacao_invalida"],
    [{ nome: "Outro", classe: "ninja", espaco: 3 }, 409, "espaco_ocupado"],
    [{ nome: "Outro", classe: "ninja", espaco: 7 }, 400, "espaco_invalido"],
  ]) {
    const r = await cria({ ...corpo, sessao: ses });
    assert.equal(r.status, status, JSON.stringify(corpo)); assert.equal(r.corpo.codigo, codigo, JSON.stringify(corpo));
  }
  assert.equal((await cria({ nome: "Quarto", classe: "shura", sessao: ses })).corpo.personagem.espaco, 2, "o primeiro livre");
  const cheio = await cria({ nome: "Quinto", classe: "shura", sessao: ses });
  assert.equal(cheio.status, 409); assert.equal(cheio.corpo.codigo, "sem_espaco");
  // o nome é único no jogo todo, entre contas
  const tk2 = await s.cadastra("lee"); const ses2 = await s.sessao(tk2);
  assert.equal((await s.pede("POST", "/personagens", { token: tk2, corpo: { nome: "kim", classe: "ninja", sessao: ses2 } })).corpo.codigo, "nome_em_uso");
  const lista = await s.pede("GET", "/personagens", { token: tk });
  assert.equal(lista.corpo.maxEspacos, 4);
  assert.deepEqual(lista.corpo.personagens.map((p) => [p.espaco, p.nome, p.classe]), [[0, "Kim", "viking"], [1, "Kim Dois", "viking"], [2, "Quarto", "shura"], [3, "Aprendiz", "aprendiz"]]);
  assert.ok(!("dados" in lista.corpo.personagens[0]), "a lista não leva o save");
});

test("salvar e carregar: versão, 10 s entre saves, fechando, versão antiga, tamanho e resumo", async () => {
  const s = await servidor();
  const tk = await s.cadastra("kim"); const ses = await s.sessao(tk);
  await s.pede("POST", "/personagens", { token: tk, corpo: { nome: "Kim", classe: "aprendiz", vocacao: "norte", sessao: ses } });
  const vazio = await s.pede("GET", "/personagens/0", { token: tk });
  assert.equal(vazio.status, 200); assert.equal(vazio.corpo.dados, null); assert.equal(vazio.corpo.personagem.versao, 0);
  assert.equal((await s.pede("GET", "/personagens/1", { token: tk })).corpo.codigo, "nao_encontrado");
  const r1 = await salva(s, { token: tk, ses, versaoBase: 0, dados: b64("v1"), resumo: { nivel: 2, exp: 100, mapa: "vila1" } });
  assert.equal(r1.status, 200, JSON.stringify(r1.corpo)); assert.equal(r1.corpo.versao, 1);
  const g = await s.pede("GET", "/personagens/0", { token: tk });
  assert.equal(Buffer.from(g.corpo.dados, "base64").toString(), "v1");
  assert.deepEqual([g.corpo.personagem.nivel, g.corpo.personagem.exp, g.corpo.personagem.mapa, g.corpo.personagem.versao], [2, 100, "vila1", 1]);
  // menos de 10 s: 429 rapido com o tempo de espera
  anda(3000);
  const rapido = await salva(s, { token: tk, ses, versaoBase: 1 });
  assert.equal(rapido.status, 429); assert.equal(rapido.corpo.codigo, "rapido"); assert.equal(rapido.corpo.tenteEmS, 7);
  // "fechando" passa com 1,5 s
  const fechando = await salva(s, { token: tk, ses, versaoBase: 1, fechando: true, dados: b64("v2") });
  assert.equal(fechando.status, 200); assert.equal(fechando.corpo.versao, 2);
  // versão antiga: a conta está à frente
  anda(11_000);
  const antiga = await salva(s, { token: tk, ses, versaoBase: 1 });
  assert.equal(antiga.status, 409); assert.equal(antiga.corpo.codigo, "versao_antiga"); assert.equal(antiga.corpo.versao, 2); assert.equal(antiga.corpo.nivel, 1, "o resumo do último save gravado");
  // "este computador": reenviar com a versão da conta como base
  assert.equal((await salva(s, { token: tk, ses, versaoBase: 2, dados: b64("v3") })).corpo.versao, 3);
  anda(11_000);
  // envio fora de ordem da mesma página (salvoEm menor que o último gravado): 409 velho
  const velho = await salva(s, { token: tk, ses, versaoBase: 3, salvoEm: relogio - 60_000 });
  assert.equal(velho.status, 409); assert.equal(velho.corpo.codigo, "velho");
  // tamanho e formato
  const grande = await salva(s, { token: tk, ses, versaoBase: 3, dados: "A".repeat(90_004) });
  assert.equal(grande.status, 413); assert.equal(grande.corpo.codigo, "grande_demais");
  assert.equal((await salva(s, { token: tk, ses, versaoBase: 3, dados: "não base64" })).corpo.codigo, "save_invalido");
  assert.equal((await salva(s, { token: tk, ses, versaoBase: -1 })).corpo.codigo, "save_invalido");
  assert.equal((await salva(s, { token: tk, ses, versaoBase: 3, resumo: { nivel: 0, exp: 0 } })).corpo.codigo, "resumo_invalido");
  assert.equal((await salva(s, { token: tk, ses, versaoBase: 3, resumo: { nivel: 5, exp: 0, classe: "ninja" } })).corpo.codigo, "resumo_invalido", "ninja não é da vocação norte");
  // no Altar: aprendiz → guerreiro (da vocação norte)
  const altar = await salva(s, { token: tk, ses, versaoBase: 3, resumo: { nivel: 5, exp: 0, classe: "guerreiro" } });
  assert.equal(altar.status, 200);
  assert.equal((await s.pede("GET", "/personagens/0", { token: tk })).corpo.personagem.classe, "guerreiro");
  anda(11_000);
  assert.equal((await salva(s, { token: tk, ses, versaoBase: 4, resumo: { nivel: 5, exp: 0, classe: "viking" } })).corpo.codigo, "resumo_invalido", "depois do Altar a classe não muda");
  assert.equal((await salva(s, { token: tk, ses, espaco: 2, versaoBase: 0 })).corpo.codigo, "nao_encontrado");
});

test("dois computadores: o último que entra fica com a conta; 'Jogar aqui' toma de volta", async () => {
  const s = await servidor();
  const tkA = await s.cadastra("kim"); const sesA = await s.sessao(tkA);
  await s.pede("POST", "/personagens", { token: tkA, corpo: { nome: "Kim", classe: "viking", sessao: sesA } });
  assert.equal((await salva(s, { token: tkA, ses: sesA, versaoBase: 0 })).status, 200);
  // o computador B entra e escolhe o personagem
  const tkB = (await s.pede("POST", "/conta/entrar", { corpo: { usuario: "kim", senha: "senha-forte-1" } })).corpo.token;
  const sesB = await s.sessao(tkB);
  assert.notEqual(sesA, sesB);
  anda(11_000);
  const tomada = await salva(s, { token: tkA, ses: sesA, versaoBase: 1 });
  assert.equal(tomada.status, 409); assert.equal(tomada.corpo.codigo, "sessao_tomada");
  assert.equal((await s.pede("PUT", "/comum", { token: tkA, corpo: { dados: b64("arm"), versaoBase: 0, sessao: sesA } })).corpo.codigo, "sessao_tomada");
  assert.equal((await s.pede("DELETE", "/personagens/0", { token: tkA, corpo: { nome: "Kim", sessao: sesA } })).corpo.codigo, "sessao_tomada");
  assert.equal((await salva(s, { token: tkB, ses: sesB, versaoBase: 1 })).corpo.versao, 2);
  // A aperta "Jogar aqui"
  const sesA2 = await s.sessao(tkA);
  anda(11_000);
  assert.equal((await salva(s, { token: tkB, ses: sesB, versaoBase: 2 })).corpo.codigo, "sessao_tomada");
  const deVolta = await salva(s, { token: tkA, ses: sesA2, versaoBase: 1 });
  assert.equal(deVolta.corpo.codigo, "versao_antiga", "A ainda partia da versão 1: a conta mostra a escolha");
  assert.equal((await salva(s, { token: tkA, ses: sesA2, versaoBase: 2 })).corpo.versao, 3);
  // ler não precisa de sessão
  assert.equal((await s.pede("GET", "/personagens/0", { token: tkB })).status, 200);
});

test("apagar personagem: confirma o nome, libera espaço e nome na hora e some de vez em 7 dias", async () => {
  const s = await servidor();
  const tk = await s.cadastra("kim"); const ses = await s.sessao(tk);
  await s.pede("POST", "/personagens", { token: tk, corpo: { nome: "João Kim", classe: "viking", sessao: ses } });
  const errado = await s.pede("DELETE", "/personagens/0", { token: tk, corpo: { nome: "Outro", sessao: ses } });
  assert.equal(errado.status, 400); assert.equal(errado.corpo.codigo, "nome_nao_confere");
  assert.equal((await s.pede("DELETE", "/personagens/0", { token: tk, corpo: { nome: "joao kim", sessao: ses } })).status, 200);
  assert.equal((await s.pede("GET", "/personagens", { token: tk })).corpo.personagens.length, 0);
  assert.equal((await s.pede("DELETE", "/personagens/0", { token: tk, corpo: { nome: "joao kim", sessao: ses } })).corpo.codigo, "nao_encontrado");
  const de_novo = await s.pede("POST", "/personagens", { token: tk, corpo: { nome: "João Kim", classe: "ninja", sessao: ses } });
  assert.equal(de_novo.status, 201); assert.equal(de_novo.corpo.personagem.espaco, 0);
  const c = await s.conta("kim");
  assert.equal((await s.prisma.ghotin2Personagem.findMany({ where: { contaId: c.id } })).length, 2, "o apagado ainda está guardado");
  anda(7 * 24 * H + MIN);
  await s.pede("GET", "/personagens", { token: tk });
  assert.equal((await s.prisma.ghotin2Personagem.findMany({ where: { contaId: c.id } })).length, 1, "depois de 7 dias, some");
});

test("comum (armazém + mapa): 404 sem nada, versão, sessão", async () => {
  const s = await servidor();
  const tk = await s.cadastra("kim"); const ses = await s.sessao(tk);
  assert.equal((await s.pede("GET", "/comum", { token: tk })).corpo.codigo, "nao_encontrado");
  const put = (corpo) => s.pede("PUT", "/comum", { token: tk, corpo: { sessao: ses, salvoEm: relogio, ...corpo } });
  assert.equal((await put({ dados: b64("a1"), versaoBase: 1 })).corpo.codigo, "versao_antiga");
  const r1 = await put({ dados: b64("a1"), versaoBase: 0 });
  assert.equal(r1.status, 200); assert.equal(r1.corpo.versao, 1);
  const g = await s.pede("GET", "/comum", { token: tk });
  assert.equal(Buffer.from(g.corpo.dados, "base64").toString(), "a1"); assert.equal(g.corpo.versao, 1);
  anda(2000);
  assert.equal((await put({ dados: b64("a2"), versaoBase: 1 })).corpo.codigo, "rapido");
  anda(9000);
  assert.equal((await put({ dados: b64("a2"), versaoBase: 0 })).corpo.codigo, "versao_antiga");
  assert.equal((await put({ dados: b64("a2"), versaoBase: 1 })).corpo.versao, 2);
  assert.equal((await put({ dados: "A".repeat(90_001), versaoBase: 2 })).status, 413);
});

test("ranking: ordem por nível e EXP, filtro por classe, sem dado da conta, fora quem não pode", async () => {
  const s = await servidor();
  const heroi = async (usuario, nome, classe, passos, vocacao) => {
    const tk = await s.cadastra(usuario); const ses = await s.sessao(tk);
    const c = await s.pede("POST", "/personagens", { token: tk, corpo: { nome, classe, vocacao, sessao: ses } });
    assert.equal(c.status, 201, JSON.stringify(c.corpo));
    let v = 0;
    for (const [esperaMs, resumo] of passos) {
      anda(esperaMs);
      const r = await salva(s, { token: tk, ses, versaoBase: v, resumo });
      assert.equal(r.status, 200, `${nome}: ${JSON.stringify(r.corpo)}`); v = r.corpo.versao;
    }
    return { tk, ses, v };
  };
  await heroi("ana", "Ana", "viking", [[0, { nivel: 1, exp: 50 }], [3 * H, { nivel: 30, exp: 1000 }]]);
  await heroi("bia", "Bia", "ninja", [[0, { nivel: 1, exp: 0 }], [3 * H, { nivel: 30, exp: 5000 }]]);
  await heroi("caio", "Caio", "viking", [[0, { nivel: 1, exp: 0 }], [H, { nivel: 12, exp: 0 }]]);
  // empate de nível e EXP: quem chegou primeiro fica na frente
  await heroi("davi", "Davi", "viking", [[0, { nivel: 1, exp: 0 }], [H, { nivel: 12, exp: 0 }]]);
  // forjado: nível 60 com 1 minuto de vida (gravado, mas fora do ranking)
  const forjado = await heroi("eva", "Eva", "shura", [[MIN, { nivel: 60, exp: 0 }]]);
  // EXP acima do nível (forjado)
  await heroi("fred", "Fred", "viking", [[2 * H, { nivel: 10, exp: 999_999 }]]);
  // nunca salvo
  const tkG = await s.cadastra("gil"); const sesG = await s.sessao(tkG);
  await s.pede("POST", "/personagens", { token: tkG, corpo: { nome: "Gil", classe: "viking", sessao: sesG } });
  // conta banida
  await heroi("hugo", "Hugo", "viking", [[3 * H, { nivel: 40, exp: 0 }]]);
  const hugo = await s.conta("hugo");
  await s.prisma.ghotin2Conta.update({ where: { id: hugo.id }, data: { banido: true } }); esquecerContaG2(hugo.id);
  // apagado
  const ivo = await heroi("ivo", "Ivo", "viking", [[3 * H, { nivel: 41, exp: 0 }]]);
  assert.equal((await s.pede("DELETE", "/personagens/0", { token: ivo.tk, corpo: { nome: "Ivo", sessao: ivo.ses } })).status, 200);

  const r = await s.pede("GET", "/ranking");
  assert.equal(r.status, 200);
  assert.deepEqual(r.corpo.lista.map((p) => p.nome), ["Bia", "Ana", "Caio", "Davi"]);
  assert.deepEqual(r.corpo.lista[0], { posicao: 1, nome: "Bia", classe: "ninja", nivel: 30, exp: 5000, expTotal: R.expTotal(30, 5000) });
  for (const p of r.corpo.lista) assert.deepEqual(Object.keys(p).sort(), ["classe", "exp", "expTotal", "nivel", "nome", "posicao"], "nada da conta");
  assert.ok(!JSON.stringify(r.corpo).includes("@"), "sem e-mail");
  const vik = await s.pede("GET", "/ranking?classe=viking&limite=2");
  assert.deepEqual(vik.corpo.lista.map((p) => [p.posicao, p.nome]), [[1, "Ana"], [2, "Caio"]]);
  assert.equal(vik.corpo.classe, "viking");
  assert.equal((await s.pede("GET", "/ranking?classe=mago")).corpo.codigo, "classe_invalida");
  assert.equal((await s.pede("GET", "/ranking?limite=999")).status, 200);
  // o forjado continua com o save dele (nada se perde) e o motivo fica no banco para o admin
  const eva = await s.pede("GET", "/personagens/0", { token: forjado.tk });
  assert.equal(eva.corpo.personagem.nivel, 60);
  const linha = (await s.prisma.ghotin2Personagem.findMany({ where: { nome: "Eva" } }))[0];
  assert.equal(linha.suspeito, true); assert.match(linha.suspeitoMotivo, /min de vida/);
  // e não sai da marcação depois que o tempo "alcança"
  anda(20 * H);
  assert.equal((await salva(s, { token: forjado.tk, ses: forjado.ses, versaoBase: forjado.v, resumo: { nivel: 60, exp: 0 } })).status, 200);
  assert.ok(!(await s.pede("GET", "/ranking")).corpo.lista.some((p) => p.nome === "Eva"));
  // conta banida: 403 nas rotas com conta e no entrar
  assert.equal((await s.pede("POST", "/conta/entrar", { corpo: { usuario: "hugo", senha: "senha-forte-1" } })).corpo.codigo, "banido");
});

test("esqueci e redefinir a senha: resposta sempre igual, e-mail para o endereço digitado, link de 1 h e uma vez só", async () => {
  const s = await servidor();
  const antigo = await s.cadastra("kim", { email: "kim@gmail.com" });
  const esqueci = (corpo) => s.pede("POST", "/conta/esqueci-senha", { corpo });
  const r0 = await esqueci({ usuario: "kim", email: "outro@gmail.com" });
  const r1 = await esqueci({ usuario: "ninguem", email: "kim@gmail.com" });
  assert.equal(r0.status, 200); assert.deepEqual(r0.corpo, r1.corpo);
  assert.equal(s.emails.length, 0, "e-mail errado ou usuário que não existe: nada é enviado");
  assert.equal((await esqueci({ usuario: "kim", email: "nada" })).corpo.codigo, "email_invalido");
  const r2 = await esqueci({ usuario: "KIM", email: " KIM@gmail.com " });
  assert.deepEqual(r2.corpo, r0.corpo);
  await new Promise((ok) => setTimeout(ok, 20));
  assert.equal(s.emails.length, 1);
  assert.equal(s.emails[0].email, "kim@gmail.com"); assert.equal(s.emails[0].usuario, "kim");
  const codigo = s.emails[0].link.match(/^https:\/\/jogo\.teste\/ghotin2\/#redefinir=([0-9a-f]{64})$/)[1];
  const c = await s.conta("kim");
  assert.notEqual(c.resetHash, codigo, "o banco guarda só o hash do código");
  const redef = (corpo) => s.pede("POST", "/conta/redefinir-senha", { corpo });
  assert.equal((await redef({ codigo: "f".repeat(64), senha: "nova-senha-1" })).corpo.codigo, "codigo_invalido");
  assert.equal((await redef({ codigo, senha: "curta" })).corpo.codigo, "senha_invalida");
  const ok = await redef({ codigo, senha: "nova-senha-1" });
  assert.equal(ok.status, 200); assert.ok(ok.corpo.token);
  assert.equal((await redef({ codigo, senha: "outra-senha-2" })).corpo.codigo, "codigo_invalido", "uma vez só");
  assert.equal((await s.pede("GET", "/conta/quem-sou", { token: antigo })).corpo.codigo, "token_invalido", "o token antigo caiu");
  assert.equal((await s.pede("GET", "/conta/quem-sou", { token: ok.corpo.token })).status, 200);
  assert.equal((await s.pede("POST", "/conta/entrar", { corpo: { usuario: "kim", senha: "senha-forte-1" } })).status, 401);
  assert.equal((await s.pede("POST", "/conta/entrar", { corpo: { usuario: "kim", senha: "nova-senha-1" } })).status, 200);
  // o link vence em 1 hora
  await esqueci({ usuario: "kim", email: "kim@gmail.com" });
  await new Promise((ok2) => setTimeout(ok2, 20));
  const codigo2 = s.emails[1].link.split("=")[1];
  anda(H + 1000);
  assert.equal((await redef({ codigo: codigo2, senha: "nova-senha-3" })).corpo.codigo, "codigo_invalido");
});

test("esqueci a senha: 3 pedidos por hora por usuário", async () => {
  const s = await servidor({ limites: { ...FOLGADOS, esqueciUsuario: LIMITES_IP.esqueciUsuario } });
  await s.cadastra("kim");
  for (let i = 0; i < 3; i++) assert.equal((await s.pede("POST", "/conta/esqueci-senha", { corpo: { usuario: "kim", email: "kim@gmail.com" } })).status, 200);
  const r = await s.pede("POST", "/conta/esqueci-senha", { corpo: { usuario: "Kim", email: "kim@gmail.com" } });
  assert.equal(r.status, 429); assert.equal(r.corpo.codigo, "limite");
  assert.equal((await s.pede("POST", "/conta/esqueci-senha", { corpo: { usuario: "lee", email: "kim@gmail.com" } })).status, 200, "outro usuário não é afetado");
});

test("trocar senha, sair, sair de todos, renovar o token e apagar a conta", async () => {
  const s = await servidor();
  const tk = await s.cadastra("kim"); const ses = await s.sessao(tk);
  await s.pede("POST", "/personagens", { token: tk, corpo: { nome: "Kim", classe: "viking", sessao: ses } });
  await s.pede("PUT", "/comum", { token: tk, corpo: { dados: b64("arm"), versaoBase: 0, sessao: ses } });
  // quem-sou: sessão ativa; renova o token depois de 1 dia (o iat do token é da hora de verdade)
  relogio = Date.now();
  let q = await s.pede("GET", "/conta/quem-sou", { token: tk });
  assert.equal(q.corpo.sessaoAtiva, true); assert.equal(q.corpo.token, undefined);
  anda(25 * H);
  q = await s.pede("GET", "/conta/quem-sou", { token: tk });
  assert.ok(q.corpo.token, "token renovado");
  // sair libera a sessão (só a dele)
  await s.pede("POST", "/conta/sair", { token: tk, corpo: { sessao: "outra-sessao-qualquer" } });
  assert.equal((await s.pede("GET", "/conta/quem-sou", { token: tk })).corpo.sessaoAtiva, true);
  await s.pede("POST", "/conta/sair", { token: tk, corpo: { sessao: ses } });
  assert.equal((await s.pede("GET", "/conta/quem-sou", { token: tk })).corpo.sessaoAtiva, false);
  // trocar a senha
  assert.equal((await s.pede("POST", "/conta/trocar-senha", { token: tk, corpo: { senhaAtual: "errada-123", senhaNova: "nova-senha-1" } })).corpo.codigo, "credenciais");
  const t2 = await s.pede("POST", "/conta/trocar-senha", { token: tk, corpo: { senhaAtual: "senha-forte-1", senhaNova: "nova-senha-1" } });
  assert.equal(t2.status, 200);
  assert.equal((await s.pede("GET", "/personagens", { token: tk })).status, 401, "o token de antes caiu");
  const tk2 = t2.corpo.token;
  // sair de todos
  const tk3 = (await s.pede("POST", "/conta/entrar", { corpo: { usuario: "kim", senha: "nova-senha-1" } })).corpo.token;
  await s.pede("POST", "/conta/sair", { token: tk2, corpo: { todos: true } });
  assert.equal((await s.pede("GET", "/personagens", { token: tk3 })).status, 401);
  // apagar a conta (LGPD): leva tudo junto
  const tk4 = (await s.pede("POST", "/conta/entrar", { corpo: { usuario: "kim", senha: "nova-senha-1" } })).corpo.token;
  assert.equal((await s.pede("DELETE", "/conta", { token: tk4, corpo: { senha: "errada-123" } })).corpo.codigo, "credenciais");
  const c = await s.conta("kim");
  assert.equal((await s.pede("DELETE", "/conta", { token: tk4, corpo: { senha: "nova-senha-1" } })).status, 200);
  assert.equal(await s.conta("kim"), null);
  assert.equal((await s.prisma.ghotin2Personagem.findMany({ where: { contaId: c.id } })).length, 0);
  assert.equal(await s.prisma.ghotin2Comum.findUnique({ where: { contaId: c.id } }), null);
  assert.equal((await s.pede("GET", "/personagens", { token: tk4 })).status, 401);
  assert.equal((await s.cadastra("kim")).length > 0, true, "o usuário fica livre de novo");
});

test("banco fora do ar ou tabela ainda não criada: 503 fora_do_ar, nunca 500", async (t) => {
  if (BANCO_REAL) return t.skip("só no banco de mentira");
  const s = await servidor();
  const tk = await s.cadastra("kim");
  s.prisma.falha = Object.assign(new Error("The table `public.Ghotin2Conta` does not exist"), { code: "P2021" });
  for (const [m, p, token] of [["GET", "/ranking"], ["GET", "/personagens", tk], ["POST", "/conta/entrar"]]) {
    const r = await s.pede(m, p, { token, corpo: m === "POST" ? { usuario: "kim", senha: "senha-forte-1" } : undefined });
    assert.equal(r.status, 503, p); assert.equal(r.corpo.codigo, "fora_do_ar", p);
  }
});
