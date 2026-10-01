import { test } from "node:test";
import assert from "node:assert/strict";
import { decidirSessao, plataformaDoUA, registrarSinal, PAUSA_MS } from "../../src/lenda/sessoes.js";

// Regras das sessões do Lenda (painel admin). As duas primeiras não tocam o
// banco; a última usa um prisma de mentira, só pra ver o que seria gravado.

test("sessão: sem sessão anterior abre uma nova", () => {
  assert.equal(decidirSessao(null, Date.now()), "nova");
  assert.equal(decidirSessao({}, Date.now()), "nova");
});

test("sessão: sinal dentro da pausa continua; depois da pausa, abre outra", () => {
  const agora = Date.parse("2026-10-01T12:00:00Z");
  assert.equal(decidirSessao({ ultimoSinal: new Date(agora - 60_000) }, agora), "estender");
  assert.equal(decidirSessao({ ultimoSinal: new Date(agora - PAUSA_MS) }, agora), "estender");
  assert.equal(decidirSessao({ ultimoSinal: new Date(agora - PAUSA_MS - 1) }, agora), "nova");
});

test("plataforma: celular x computador pelo navegador", () => {
  assert.equal(plataformaDoUA("Mozilla/5.0 (Linux; Android 14) AppleWebKit Mobile Safari"), "celular");
  assert.equal(plataformaDoUA("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"), "celular");
  assert.equal(plataformaDoUA("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128 Edg/128"), "computador");
  assert.equal(plataformaDoUA(""), null);
  assert.equal(plataformaDoUA(undefined), null);
});

function prismaFalso() {
  const gravado = { criadas: [], estendidas: [] };
  let sessao = null;
  return {
    gravado,
    lendaSessao: {
      findFirst: async () => sessao,
      create: async ({ data }) => { sessao = { id: "s1", ...data }; gravado.criadas.push(data); return sessao; },
      update: async ({ data }) => { Object.assign(sessao, data); gravado.estendidas.push(data); return sessao; },
      deleteMany: async () => ({ count: 0 }),
    },
  };
}
const espera = () => new Promise((r) => setTimeout(r, 20));

test("registrarSinal: 1º sinal cria a sessão com nível e aparelho; repetido em seguida não escreve de novo", async () => {
  const p = prismaFalso();
  registrarSinal(p, "user-teste-1", 12, "Mozilla/5.0 (iPhone)");
  await espera();
  assert.equal(p.gravado.criadas.length, 1);
  assert.equal(p.gravado.criadas[0].nivelInicio, 12);
  assert.equal(p.gravado.criadas[0].plataforma, "celular");
  registrarSinal(p, "user-teste-1", 13, "Mozilla/5.0 (iPhone)"); // menos de 20 s depois: ignorado
  await espera();
  assert.equal(p.gravado.criadas.length + p.gravado.estendidas.length, 1);
});

test("registrarSinal: sem usuário não faz nada e erro do banco não estoura", async () => {
  registrarSinal(prismaFalso(), null, 5, "x");
  const quebrado = { lendaSessao: { findFirst: async () => { throw new Error("banco fora"); } } };
  const erroOriginal = console.error; console.error = () => {};
  try { registrarSinal(quebrado, "user-teste-2", 5, "x"); await espera(); } finally { console.error = erroOriginal; }
});
