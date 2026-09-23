import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizar, chuteCorreto, validarDica, apurarVotos, calcularPontuacao, PONTOS, MAX_DICA,
} from "../../src/impostor/regras.js";
import { ehPalavrao } from "../../src/impostor/filtroPalavroes.js";
import { escolherPalavra } from "../../src/impostor/palavras.js";

test("normalizar ignora maiúsculas, acentos e espaços nas pontas", () => {
  assert.equal(normalizar("  PrÁia "), "praia");
  assert.equal(normalizar("Açaí"), "acai");
});

test("chute: compara sem maiúsculas, acentos e espaços nas pontas", () => {
  assert.ok(chuteCorreto("  práia ", "Praia"));
  assert.ok(chuteCorreto("ACAI", "Açaí"));
  assert.ok(chuteCorreto("pão de queijo", "Pão de Queijo"));
  assert.ok(!chuteCorreto("praias", "Praia"));
  assert.ok(!chuteCorreto("", "Praia"));
  assert.ok(!chuteCorreto("   ", "Praia"));
});

test("dica: aceita uma palavra, com hífen", () => {
  assert.deepEqual(validarDica("  areia ", "Praia"), { dica: "areia" });
  assert.deepEqual(validarDica("guarda-sol", "Praia"), { dica: "guarda-sol" });
});

test("dica: recusa vazia, longa, com espaço ou só símbolos", () => {
  assert.ok(validarDica("", "Praia").erro);
  assert.ok(validarDica("   ", "Praia").erro);
  assert.ok(validarDica("a".repeat(MAX_DICA + 1), "Praia").erro);
  assert.ok(!validarDica("a".repeat(MAX_DICA), "Praia").erro);
  assert.ok(validarDica("duas palavras", "Praia").erro);
  assert.ok(validarDica("!!!", "Praia").erro);
});

test("dica: recusa igual à palavra ou contendo a palavra (sem acento/caixa/hífen)", () => {
  assert.ok(validarDica("praia", "Praia").erro);
  assert.ok(validarDica("PRÁIA", "Praia").erro);
  assert.ok(validarDica("praiano", "Praia").erro);
  assert.ok(validarDica("pao-de-queijo", "Pão de queijo").erro);
  assert.ok(validarDica("paodequeijo", "Pão de queijo").erro);
  assert.ok(!validarDica("mineiro", "Pão de queijo").erro);
});

test("dica do impostor (palavra = null) não é checada contra a palavra", () => {
  // Sem isso a recusa viraria um oráculo: o impostor descobriria a palavra.
  assert.deepEqual(validarDica("praia", null), { dica: "praia" });
});

test("filtro de palavrões: pega a palavra inteira, não pedaço de outra", () => {
  assert.ok(ehPalavrao("Porra"));
  assert.ok(ehPalavrao("CARALHO"));
  assert.ok(ehPalavrao("vai-porra"));
  assert.ok(!ehPalavrao("cupim"));
  assert.ok(!ehPalavrao("escudo"));
  assert.ok(!ehPalavrao("veado"));
  assert.ok(!ehPalavrao("pica-pau"));
  assert.ok(validarDica("merda", "Praia").erro);
});

test("apuração: mais votado é o acusado", () => {
  const votos = new Map([["a", "c"], ["b", "c"], ["c", "a"], ["d", "c"]]);
  const r = apurarVotos(votos, ["a", "b", "c", "d"]);
  assert.equal(r.acusadoId, "c");
  assert.equal(r.empate, false);
  assert.deepEqual(r.contagem[0], { id: "c", votos: 3 });
});

test("apuração: empate no topo = ninguém acusado", () => {
  const votos = new Map([["a", "c"], ["b", "d"], ["c", "a"], ["d", "b"]]);
  const r = apurarVotos(votos, ["a", "b", "c", "d"]);
  assert.equal(r.acusadoId, null);
  assert.equal(r.empate, true);
});

test("apuração: ninguém votou = empate", () => {
  const r = apurarVotos(new Map(), ["a", "b", "c"]);
  assert.equal(r.empate, true);
  assert.equal(r.acusadoId, null);
});

test("apuração: ignora voto em quem saiu, de quem saiu e em si mesmo", () => {
  const votos = new Map([["a", "x"], ["x", "b"], ["b", "b"], ["c", "a"]]);
  const r = apurarVotos(votos, ["a", "b", "c"]);
  assert.equal(r.acusadoId, "a");
});

const jogadores = ["imp", "t1", "t2", "t3"];

test("pontuação: impostor não descoberto (+300); voto certo ainda vale +150", () => {
  const votos = new Map([["t1", "imp"], ["t2", "t3"], ["t3", "t2"], ["imp", "t1"]]);
  const { vencedor, pontos } = calcularPontuacao({ jogadores, impostorId: "imp", votos, descoberto: false, adivinhou: false });
  assert.equal(vencedor, "impostor");
  assert.deepEqual(pontos, { imp: PONTOS.impostorNaoDescoberto, t1: 150, t2: 0, t3: 0 });
});

test("pontuação: descoberto e errou — tripulantes vencem (+50 cada, +150 quem acertou)", () => {
  const votos = new Map([["t1", "imp"], ["t2", "imp"], ["t3", "t1"], ["imp", "t1"]]);
  const { vencedor, pontos } = calcularPontuacao({ jogadores, impostorId: "imp", votos, descoberto: true, adivinhou: false });
  assert.equal(vencedor, "tripulantes");
  assert.deepEqual(pontos, { imp: 0, t1: 200, t2: 200, t3: 50 });
});

test("pontuação: descoberto e adivinhou — impostor vence com +200", () => {
  const votos = new Map([["t1", "imp"], ["t2", "imp"], ["t3", "imp"], ["imp", "t1"]]);
  const { vencedor, pontos } = calcularPontuacao({ jogadores, impostorId: "imp", votos, descoberto: true, adivinhou: true });
  assert.equal(vencedor, "impostor");
  assert.deepEqual(pontos, { imp: 200, t1: 150, t2: 150, t3: 150 });
});

test("sorteio de palavra evita repetir as já usadas na sala", () => {
  const lista = [{ tema: "A", palavra: "x" }, { tema: "A", palavra: "y" }, { tema: "B", palavra: "z" }];
  for (let i = 0; i < 30; i++) {
    const r = escolherPalavra(lista, ["x", "z"]);
    assert.deepEqual(r, { tema: "A", palavra: "y" });
  }
  // Esgotou: libera tudo de novo em vez de travar.
  assert.ok(escolherPalavra(lista, ["x", "y", "z"]));
  assert.equal(escolherPalavra([], []), null);
});
