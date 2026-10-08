import { test } from "node:test";
import assert from "node:assert/strict";
import { validarContagens, diaDe, podeContar, somarContagens, resumir, MAX_EVENTOS } from "../../src/lenda/contagens.js";

test("aceita só eventos conhecidos com valor válido", () => {
  const r = validarContagens(JSON.stringify({ v: "353", p: "celular", ev: [
    { e: "nivel", v: "10" }, { e: "mapa", v: "atlantida" }, { e: "abriu", v: "novo" },
    { e: "nome", v: "Joao" }, { e: "mapa", v: "<script>" }, { e: "nivel", v: "dez" }, { e: "sessao", v: "m5_15" },
  ] }));
  assert.equal(r.ok, true);
  assert.deepEqual(r.itens.map((i) => i.evento + ":" + i.valor), ["nivel:10", "mapa:atlantida", "abriu:novo", "sessao:m5_15"]);
  assert.equal(r.itens[0].plataforma, "celular");
  assert.equal(r.itens[0].versao, "353");
});

test("nada de texto livre: plataforma/versão estranhas viram '?'", () => {
  const r = validarContagens({ v: "abc", p: "iPhone do Joao", ev: [{ e: "jogou", v: "" }] });
  assert.equal(r.itens[0].plataforma, "?");
  assert.equal(r.itens[0].versao, "?");
});

test("corpo inválido e limite de eventos", () => {
  assert.equal(validarContagens("{oi").ok, false);
  assert.equal(validarContagens({ ev: "x" }).ok, false);
  const muitos = Array.from({ length: 50 }, () => ({ e: "jogou", v: "" }));
  assert.equal(validarContagens({ v: "1", p: "computador", ev: muitos }).itens.length, MAX_EVENTOS);
});

test("dia no horário de Brasília", () => {
  assert.equal(diaDe(Date.UTC(2026, 9, 3, 2, 0)), "2026-10-02"); // 23h em Brasília
  assert.equal(diaDe(Date.UTC(2026, 9, 3, 4, 0)), "2026-10-03");
});

test("barreira de abuso por minuto", () => {
  const t = 1e12; let ok = 0;
  for (let i = 0; i < 40; i++) if (podeContar("1.2.3.4", t)) ok++;
  assert.equal(ok, 30);
  assert.equal(podeContar("1.2.3.4", t + 61_000), true);
});

test("soma iguais no mesmo envio e usa upsert com increment", async () => {
  const chamadas = [];
  const prisma = { lendaContagem: { upsert: async (a) => chamadas.push(a) } };
  await somarContagens(prisma, [
    { evento: "jogou", valor: "", plataforma: "celular", versao: "353" },
    { evento: "jogou", valor: "", plataforma: "celular", versao: "353" },
    { evento: "nivel", valor: "5", plataforma: "celular", versao: "353" },
  ], Date.UTC(2026, 9, 2, 15));
  assert.equal(chamadas.length, 2);
  assert.deepEqual(chamadas[0].update, { n: { increment: 2 } });
  assert.equal(chamadas[0].where.dia_evento_valor_plataforma_versao.dia, "2026-10-02");
});

test("resumo por evento e por dia", () => {
  const r = resumir([{ dia: "2026-10-01", evento: "nivel", valor: "10", n: 3 }, { dia: "2026-10-02", evento: "nivel", valor: "10", n: 2 }, { dia: "2026-10-02", evento: "jogou", valor: "", n: 7 }]);
  assert.equal(r.total["nivel:10"], 5);
  assert.equal(r.total.jogou, 7);
  assert.equal(r.porDia["2026-10-02"].jogou, 7);
  // v407 (I7): menos de 5 pessoas não aparece (no total do período nem no dia)
  assert.equal(r.porDia["2026-10-02"]["nivel:10"], undefined);
  const r2 = resumir([{ dia: "2026-10-01", evento: "missao", valor: "q_pombos", n: 4 }, { dia: "2026-10-01", evento: "abriu", valor: "novo", n: 9 }]);
  assert.equal(r2.total["missao:q_pombos"], undefined);
  assert.deepEqual(r2.poucos, ["missao:q_pombos"]);
  assert.equal(r2.total["abriu:novo"], 9);
});

test("eventos novos da v407 (I7): missão por ID, desistiu na criação, primeira caça/chefão", () => {
  const v = validarContagens({ v: 407, p: "celular", ev: [{ e: "missao", v: "q_tonhao_2" }, { e: "desistiu", v: "criacao" }, { e: "primeira", v: "caca" }, { e: "primeira", v: "chefe" },
    { e: "missao", v: "Nome Livre!" }, { e: "desistiu", v: "outra" }, { e: "primeira", v: "beijo" }] });
  assert.deepEqual(v.itens.map((i) => i.evento + ":" + i.valor), ["missao:q_tonhao_2", "desistiu:criacao", "primeira:caca", "primeira:chefe"]);
});

test("v411.8: conta com/sem conta é aceita; outro valor não", () => {
  const r = validarContagens({ v: "1", p: "computador", ev: [{ e: "conta", v: "com" }, { e: "conta", v: "sem" }, { e: "conta", v: "talvez" }] });
  assert.equal(r.ok, true);
  assert.deepEqual(r.itens.map((i) => i.valor ?? i.v ?? i[1]).filter(Boolean).length >= 2, true);
  assert.equal(r.itens.length, 2);
});
