// Ghotin2 — regras puras (ghotin2/regras.js) e o token próprio (ghotin2/token.js). Sem banco.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import crypto from "crypto";
process.env.DATABASE_URL = "postgresql://ninguem:nada@127.0.0.1:1/teste_sem_banco";
process.env.JWT_SECRET ||= "teste-ghotin2-segredo";
const R = await import("../../src/ghotin2/regras.js");
const { assinarTokenG2, verificarTokenG2, contaDoCabecalhoG2 } = await import("../../src/ghotin2/token.js");
const { signToken, verifyToken } = await import("../../src/utils/jwt.js");

const aqui = path.dirname(fileURLToPath(import.meta.url));

test("a tabela de EXP é a mesma do jogo publicado (frontend/public/ghotin2/index.html)", (t) => {
  const arq = path.join(aqui, "../../../frontend/public/ghotin2/index.html");
  if (!fs.existsSync(arq)) return t.skip("jogo publicado não está nesta cópia");
  const html = fs.readFileSync(arq, "utf8");
  const m = html.match(/const EXP_NIVEL = \[([\s\S]*?)\];/);
  assert.ok(m, "EXP_NIVEL não encontrada no jogo");
  const doJogo = m[1].split("\n").map((l) => l.replace(/\/\/.*$/, "")).join("").split(",").map((s) => s.trim()).filter(Boolean).map(Number);
  assert.deepEqual(doJogo, R.EXP_NIVEL, "o jogo mudou a tabela: atualize src/ghotin2/regras.js");
  assert.equal(R.NIVEL_MAX, 70);
});

test("usuário: 3 a 16, letras sem acento, números e _, com o filtro de nomes", () => {
  assert.deepEqual(R.confereUsuario("Kim_23"), { ok: true, usuario: "kim_23", nome: "Kim_23" });
  assert.ok(R.confereUsuario("  abc ").ok);
  for (const u of ["ab", "a".repeat(17), "joão", "kim 23", "kim-23", "123", "", null, 42]) assert.ok(!R.confereUsuario(u).ok, String(u));
  for (const u of ["admin_g2", "Moderador1", "porra123", "p0rr4", "suporte"]) assert.ok(!R.confereUsuario(u).ok, u);
});

test("senha: 8 a 72 bytes; e-mail com a regra do site", () => {
  assert.ok(R.confereSenha("12345678").ok);
  assert.ok(!R.confereSenha("1234567").ok);
  assert.ok(!R.confereSenha("ç".repeat(37)).ok); // 74 bytes
  assert.ok(!R.confereSenha(undefined).ok);
  assert.deepEqual(R.confereEmail(" Kim@Gmail.COM "), { ok: true, email: "kim@gmail.com" });
  for (const e of ["a@a.a", "sem-arroba", "x@example.com", "", null]) assert.ok(!R.confereEmail(e).ok, String(e));
});

test("nome do personagem: a regra do jogo (3 a 16, letras, números, espaço) + filtro; chave sem maiúscula/acento/espaço", () => {
  assert.deepEqual(R.confereNomePersonagem("  João   Kim "), { ok: true, nome: "João Kim" });
  for (const n of ["Jo", "x".repeat(17), "Kim!", "Kim_1", "Pika Pau", "Admin Kim", "www site com"]) assert.ok(!R.confereNomePersonagem(n).ok, n);
  assert.equal(R.chaveNome("João Kim"), R.chaveNome("joaokim"));
  assert.equal(R.chaveNome("JOÃO  KIM"), "joaokim");
});

test("classe e vocação: o aprendiz precisa de vocação; a classe tem de ser da vocação", () => {
  assert.ok(R.confereClasse("viking", null).ok);
  assert.ok(R.confereClasse("viking", "norte").ok);
  assert.ok(R.confereClasse("aprendiz", "dragao").ok);
  assert.equal(R.confereClasse("aprendiz", null).codigo, "vocacao_invalida");
  assert.equal(R.confereClasse("ninja", "norte").codigo, "vocacao_invalida");
  assert.equal(R.confereClasse("mago", null).codigo, "classe_invalida");
  assert.equal(R.confereClasse("viking", "toString").codigo, "vocacao_invalida");
  assert.equal(R.confereEspaco(3), 3); assert.equal(R.confereEspaco("0"), 0);
  for (const e of [4, -1, "x", 1.5, "10"]) assert.equal(R.confereEspaco(e), null, String(e));
});

test("dados: base64 até 90.000 caracteres (413 acima)", () => {
  assert.ok(R.confereDados("QUJD").ok);
  assert.equal(R.confereDados("A".repeat(90_001)).status, 413);
  assert.ok(R.confereDados("A".repeat(90_000)).ok);
  assert.equal(R.confereDados("não é base64").codigo, "save_invalido");
  assert.equal(R.confereDados("").codigo, "save_invalido");
});

test("resumo: formato; a classe só sai de aprendiz para uma da vocação", () => {
  assert.deepEqual(R.confereResumo({ nivel: 5, exp: 10, mapa: "vila1" }, { classeAtual: "viking" }), { ok: true, nivel: 5, exp: 10, mapa: "vila1", classe: "viking" });
  assert.equal(R.confereResumo({ nivel: 6, exp: 0, classe: "guerreiro" }, { classeAtual: "aprendiz", vocacao: "norte" }).classe, "guerreiro");
  for (const [r, ctx] of [
    [{ nivel: 0, exp: 0 }, {}], [{ nivel: 121, exp: 0 }, {}], [{ nivel: 2.5, exp: 0 }, {}], [{ nivel: 3, exp: -1 }, {}],
    [{ nivel: 3, exp: 2_000_000_001 }, {}], [{ nivel: 3, exp: 0, mapa: "Vila 1" }, {}], [null, {}],
    [{ nivel: 6, exp: 0, classe: "ninja" }, { classeAtual: "aprendiz", vocacao: "norte" }],
    [{ nivel: 6, exp: 0, classe: "ninja" }, { classeAtual: "viking" }],
    [{ nivel: 6, exp: 0, classe: "aprendiz" }, { classeAtual: "viking" }],
  ]) assert.equal(R.confereResumo(r, ctx).codigo, "resumo_invalido", JSON.stringify(r));
});

test("ranking: EXP total e a conferência de plausibilidade", () => {
  assert.equal(R.expTotal(1, 0), 0);
  assert.equal(R.expTotal(2, 50), 350);
  assert.equal(R.expTotal(3, 0), 1100);
  assert.equal(R.expTotal(70, 0), R.EXP_NIVEL.slice(1, 70).reduce((a, b) => a + b, 0));
  // ritmo: 5 na hora; o 20 só com 26 min; o 45 com 2 h 19; o 70 com 5 h 49
  assert.equal(R.nivelPossivel(0), 5);
  assert.equal(R.nivelPossivel(26), 20);
  assert.ok(R.nivelPossivel(25) < 20);
  assert.equal(R.nivelPossivel(139.4), 45);
  assert.equal(R.nivelPossivel(349), 70);
  assert.equal(R.nivelPossivel(10_000), 70);
  const h = 3_600_000, t0 = Date.UTC(2026, 10, 3);
  assert.equal(R.motivoSuspeito({ nivel: 5, exp: 0 }, t0, t0), null);
  assert.equal(R.motivoSuspeito({ nivel: 20, exp: 0 }, t0, t0 + h), null);
  assert.match(R.motivoSuspeito({ nivel: 30, exp: 0 }, t0, t0 + 10 * 60_000), /min de vida/);
  assert.match(R.motivoSuspeito({ nivel: 71, exp: 0 }, t0, t0 + 1000 * h), /acima do maximo/);
  assert.match(R.motivoSuspeito({ nivel: 2, exp: 900 }, t0, t0 + h), /exp 900 acima/);
  assert.equal(R.motivoSuspeito({ nivel: 2, exp: 799 }, t0, t0 + h), null);
  assert.equal(R.motivoSuspeito({ nivel: 70, exp: 1_000_000 }, t0, t0 + 10 * h), null);
});

test("token: o do Ghotin2 não vale no site, o do site não vale no Ghotin2", () => {
  const g2 = assinarTokenG2({ id: "conta1", tokenVersao: 3 });
  assert.deepEqual({ ...verificarTokenG2(g2), iat: 0 }, { id: "conta1", tv: 3, iat: 0 });
  assert.throws(() => verifyToken(g2), "o utils/jwt.js do site recusa o token do Ghotin2");
  const site = signToken({ id: "conta1", nickname: "Kim", role: "ADMIN" });
  assert.throws(() => verificarTokenG2(site), "o Ghotin2 recusa o token do site");
  // mesmo com a chave do Ghotin2, claims errados não passam
  const chave = crypto.createHmac("sha256", process.env.JWT_SECRET).update("ghotin2/token/v1").digest();
  assert.throws(() => verificarTokenG2(jwt.sign({ tipo: "ghotin2_conta", tv: 0 }, chave, { audience: "site", issuer: "educacaogamer", subject: "x" })));
  assert.throws(() => verificarTokenG2(jwt.sign({ tipo: "outro", tv: 0 }, chave, { audience: "ghotin2", issuer: "educacaogamer", subject: "x" })));
  assert.throws(() => verificarTokenG2(jwt.sign({ tipo: "ghotin2_conta", tv: 0 }, chave, { audience: "ghotin2", issuer: "educacaogamer", subject: "x", expiresIn: -10 })));
  assert.throws(() => verificarTokenG2(jwt.sign({ tipo: "ghotin2_conta", tv: 0 }, process.env.JWT_SECRET, { audience: "ghotin2", issuer: "educacaogamer", subject: "x" })), "assinado com o JWT_SECRET puro");
  // o limite por conta do index.js
  assert.equal(contaDoCabecalhoG2({ headers: { authorization: "Bearer " + g2 } }), "conta1");
  assert.equal(contaDoCabecalhoG2({ headers: { authorization: "Bearer " + site } }), null);
  assert.equal(contaDoCabecalhoG2({ headers: {} }), null);
});
