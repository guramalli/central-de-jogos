import { test } from "node:test";
import assert from "node:assert/strict";
import { ITENS, ITEM_POR_ID, NOMES_DOS_SLOTS, CAMADAS, CONFIG_PADRAO, TIPOS_DE_DESBLOQUEIO, catalogoPublico } from "../../src/avatar/catalogo.js";
import {
  itemLiberado, liberadosPelosDados, dadosNecessarios, carregarDados, patenteDoCatalogo,
  validarConfig, configPublica, salvarAvatar, TABELAS_DE_PATENTE,
} from "../../src/avatar/desbloqueio.js";
import { logoPorNomeDeTitulo, nomesDeTitulosDesbloqueados, fonteDoTitulo } from "../../src/game/titulosConfig.js";

// Nada aqui toca o banco: as regras são funções puras sobre os dados, e a
// busca recebe um "db" de mentira que só registra o que foi consultado.

const semNada = () => ({ titulos: new Set(), campeoes: [], melhorMes: {}, vitalicio: {}, streakRecorde: 0 });
const peca = (desbloqueio) => ({ id: "x", slot: "chapeu", nome: "X", desbloqueio });

// ---------------- catálogo ----------------

test("catálogo: ids únicos, slots válidos, arquivo no padrão", () => {
  assert.equal(ITEM_POR_ID.size, ITENS.length, "id repetido no catálogo");
  for (const i of ITENS) {
    assert.ok(NOMES_DOS_SLOTS.includes(i.slot), `${i.id}: slot ${i.slot}`);
    assert.match(i.arquivo, /^\/avatar\/.+-v\d+\.(webp|png)$/, i.id);
    assert.ok(i.nome && i.dica, `${i.id}: nome e dica`);
  }
  assert.deepEqual([...CAMADAS].sort(), [...NOMES_DOS_SLOTS].sort(), "toda camada é um slot e vice-versa");
  assert.equal(catalogoPublico().itens.length, ITENS.length);
});

test("catálogo: toda regra aponta pra algo que existe", () => {
  for (const { id, desbloqueio: d } of ITENS) {
    assert.ok(TIPOS_DE_DESBLOQUEIO.includes(d.tipo), `${id}: tipo ${d.tipo}`);
    if (d.tipo === "patente") assert.ok(patenteDoCatalogo(d.jogo, d.patente), `${id}: patente ${d.jogo}/${d.patente}`);
    if (d.tipo === "titulo" && d.nome) {
      const existe = logoPorNomeDeTitulo(d.nome) !== null;
      assert.ok(existe, `${id}: título "${d.nome}" não existe`);
    }
    if (d.tipo === "titulo") assert.ok(d.nome || d.comecaCom, id);
    if (d.tipo === "sequencia") assert.ok(d.dias > 0, id);
    if (d.tipo === "pontos") assert.ok(d.jogo && d.min > 0, id);
  }
});

test("catálogo: cobre todo slot e todo tipo; montagem padrão é válida e inicial", () => {
  for (const s of NOMES_DOS_SLOTS) assert.ok(ITENS.some((i) => i.slot === s), `slot sem peça: ${s}`);
  for (const t of TIPOS_DE_DESBLOQUEIO) assert.ok(ITENS.some((i) => i.desbloqueio.tipo === t), `tipo sem peça: ${t}`);
  const iniciais = new Set(ITENS.filter((i) => i.desbloqueio.tipo === "inicial").map((i) => i.id));
  assert.deepEqual(validarConfig(CONFIG_PADRAO, iniciais), { config: CONFIG_PADRAO });
});

// ---------------- regras de desbloqueio ----------------

test("inicial: liberado pra todo mundo", () => {
  assert.equal(itemLiberado(peca({ tipo: "inicial" }), semNada()), true);
});

test("tipo desconhecido ou sem regra fica trancado", () => {
  assert.equal(itemLiberado(peca({ tipo: "vitoria", min: 1 }), semNada()), false);
  assert.equal(itemLiberado({ id: "y" }, semNada()), false);
});

test("titulo: nome exato e começo do nome", () => {
  const dados = { ...semNada(), titulos: new Set(["Conhecedor de Games", "Campeão Stop Ago/2026"]) };
  assert.equal(itemLiberado(peca({ tipo: "titulo", nome: "Conhecedor de Games" }), dados), true);
  assert.equal(itemLiberado(peca({ tipo: "titulo", nome: "Mestre de Games" }), dados), false);
  assert.equal(itemLiberado(peca({ tipo: "titulo", comecaCom: "Campeão " }), dados), true);
  assert.equal(itemLiberado(peca({ tipo: "titulo", comecaCom: "Campeão Quiz " }), dados), false);
});

test("titulo: os nomes vêm das mesmas estatísticas do título exibido", () => {
  const nomes = nomesDeTitulosDesbloqueados({
    statsQuiz: [
      { roomId: "quiz-games", correct: 600 },
      { roomId: "quiz-games-dificil", correct: 400 }, // soma por tema: 1000
      { roomId: "quiz-cinema", correct: 999 },
    ],
    statsStop: [{ grupo: "padrao", stops: 200, rapidos: 0 }],
    registrosCampeao: [
      { gameKey: "stop", monthKey: "2026-08", points: 1 },
      { gameKey: "stop", monthKey: "2026-07", points: 1 },
    ],
  });
  assert.ok(nomes.has("Conhecedor de Games"));
  assert.ok(!nomes.has("Conhecedor de Cinema"));
  assert.ok(nomes.has("Dedo Nervoso"));
  assert.ok(nomes.has("Campeão Stop Ago/2026"));
  assert.ok(nomes.has("Campeão Stop Ago/2026 (2x)"));
  assert.deepEqual(fonteDoTitulo("Dedo Nervoso"), { stop: true });
  assert.deepEqual(fonteDoTitulo("Campeão Quiz Set/2026"), { campeao: true });
});

test("patente: vale o MELHOR mês, não o mês atual", () => {
  const bronze = patenteDoCatalogo("stop", "trofeu_bronze");
  const regra = peca({ tipo: "patente", jogo: "stop", patente: "trofeu_bronze" });
  assert.equal(itemLiberado(regra, { ...semNada(), melhorMes: { stop: bronze.min } }), true);
  assert.equal(itemLiberado(regra, { ...semNada(), melhorMes: { stop: bronze.min - 1 } }), false);
  // Pontos em outro jogo não contam.
  assert.equal(itemLiberado(regra, { ...semNada(), melhorMes: { quiz: 10_000_000 } }), false);
  // Patente inexistente: trancado.
  assert.equal(itemLiberado(peca({ tipo: "patente", jogo: "stop", patente: "nao_existe" }), { ...semNada(), melhorMes: { stop: 1e9 } }), false);
});

test("patente exclusiva (topo): só com o troféu de campeão do jogo", () => {
  const topo = TABELAS_DE_PATENTE.quiz.find((r) => r.exclusiva);
  const regra = peca({ tipo: "patente", jogo: "quiz", patente: topo.key });
  const passou = { ...semNada(), melhorMes: { quiz: topo.min + 10 } };
  assert.equal(itemLiberado(regra, passou), false, "passou da marca mas não foi o 1º");
  assert.equal(itemLiberado(regra, { ...passou, campeoes: [{ gameKey: "stop", points: topo.min + 10 }] }), false);
  assert.equal(itemLiberado(regra, { ...passou, campeoes: [{ gameKey: "quiz", points: topo.min + 10 }] }), true);
});

test("sequencia: recorde de dias seguidos", () => {
  const regra = peca({ tipo: "sequencia", dias: 30 });
  assert.equal(itemLiberado(regra, { ...semNada(), streakRecorde: 29 }), false);
  assert.equal(itemLiberado(regra, { ...semNada(), streakRecorde: 30 }), true);
});

test("pontos: vitalício do jogo", () => {
  const regra = peca({ tipo: "pontos", jogo: "stop", min: 50000 });
  assert.equal(itemLiberado(regra, { ...semNada(), vitalicio: { stop: 49999, quiz: 1e6 } }), false);
  assert.equal(itemLiberado(regra, { ...semNada(), vitalicio: { stop: 50000 } }), true);
});

test("liberadosPelosDados: sem dado nenhum, só as iniciais", () => {
  const ids = liberadosPelosDados(semNada());
  assert.deepEqual(ids, ITENS.filter((i) => i.desbloqueio.tipo === "inicial").map((i) => i.id));
});

// ---------------- custo no banco ----------------

function dbFalso(respostas = {}) {
  const chamadas = [];
  const tabela = (nome, metodo) => async (args) => { chamadas.push(`${nome}.${metodo}`); return respostas[`${nome}.${metodo}`]?.(args) ?? (metodo === "findUnique" ? null : []); };
  const db = {
    user: { findUnique: tabela("user", "findUnique") },
    quizRoomStat: { findMany: tabela("quizRoomStat", "findMany") },
    stopStat: { findMany: tabela("stopStat", "findMany") },
    campeaoMensal: { findMany: tabela("campeaoMensal", "findMany") },
    monthlyScore: { groupBy: tabela("monthlyScore", "groupBy") },
    lifetimeScore: { findMany: tabela("lifetimeScore", "findMany") },
  };
  return { db, chamadas };
}

test("carregarDados: só consulta as tabelas que o catálogo exige", async () => {
  const soIniciais = ITENS.filter((i) => i.desbloqueio.tipo === "inicial");
  const vazio = dbFalso();
  await carregarDados("u1", dadosNecessarios(soIniciais), vazio.db);
  assert.deepEqual(vazio.chamadas, [], "catálogo só de iniciais não toca o banco");

  const soStop = [peca({ tipo: "titulo", nome: "Dedo Nervoso" }), peca({ tipo: "pontos", jogo: "stop", min: 1 })];
  const f = dbFalso();
  await carregarDados("u1", dadosNecessarios(soStop), f.db);
  assert.deepEqual(f.chamadas.sort(), ["lifetimeScore.findMany", "stopStat.findMany"]);
});

test("carregarDados: monta os dados a partir das linhas do banco", async () => {
  const { db } = dbFalso({
    "user.findUnique": () => ({ streakRecorde: 31 }),
    "monthlyScore.groupBy": (args) => {
      assert.deepEqual(args.where.gameKey.in.sort(), ["quiz", "stop"]);
      return [{ gameKey: "stop", _max: { points: 9000 } }];
    },
    "lifetimeScore.findMany": () => [{ gameKey: "stop", points: 60000 }],
    "campeaoMensal.findMany": () => [{ gameKey: "stop", monthKey: "2026-08", points: 700000 }],
    "quizRoomStat.findMany": () => [{ roomId: "quiz-games", correct: 1000 }],
  });
  const dados = await carregarDados("u1", dadosNecessarios(ITENS), db);
  const ids = liberadosPelosDados(dados);
  for (const id of ["fundo-arena", "rosto-oculos-gamer", "pescoco-medalha-campeao", "costas-capa-fogo", "mao-controle"]) {
    assert.ok(ids.includes(id), id);
  }
  assert.ok(!ids.includes("chapeu-capelo"), "sem pontos no Quiz, sem capelo");
});

// ---------------- validação do PUT ----------------

const liberados = new Set(["pele-1", "pele-2", "cabelo-curto", "roupa-camiseta"]);

test("validarConfig: aceita montagem liberada e ignora slot vazio", () => {
  assert.deepEqual(
    validarConfig({ pele: "pele-2", cabelo: "cabelo-curto", chapeu: null, rosto: "" }, liberados),
    { config: { pele: "pele-2", cabelo: "cabelo-curto" } },
  );
});

test("validarConfig: peça trancada é recusada", () => {
  const r = validarConfig({ pele: "pele-1", mao: "mao-controle" }, liberados);
  assert.match(r.erro, /trancado/);
});

test("validarConfig: peça no slot errado é recusada", () => {
  assert.match(validarConfig({ pele: "pele-1", chapeu: "cabelo-curto" }, liberados).erro, /não vai nessa parte/);
  assert.match(validarConfig({ pele: "cabelo-curto" }, liberados).erro, /não vai nessa parte/);
});

test("validarConfig: pele é obrigatória", () => {
  assert.match(validarConfig({ cabelo: "cabelo-curto" }, liberados).erro, /pele/);
  assert.match(validarConfig({ pele: null }, liberados).erro, /pele/);
});

test("validarConfig: slot, peça ou formato desconhecidos", () => {
  assert.match(validarConfig({ pele: "pele-1", asa: "x" }, liberados).erro, /desconhecida/);
  assert.match(validarConfig({ pele: "pele-999" }, liberados).erro, /não existe/);
  assert.ok(validarConfig(null, liberados).erro);
  assert.ok(validarConfig(["pele-1"], liberados).erro);
  assert.ok(validarConfig({ pele: 3 }, liberados).erro);
});

test("configPublica: descarta peça que saiu do catálogo; sem pele = null", () => {
  assert.deepEqual(configPublica({ pele: "pele-1", chapeu: "sumiu", cabelo: "cabelo-curto" }), { pele: "pele-1", cabelo: "cabelo-curto" });
  assert.equal(configPublica({ cabelo: "cabelo-curto" }), null);
  assert.equal(configPublica(null), null);
  assert.deepEqual(configPublica({ pele: "pele-1", chapeu: "cabelo-curto" }), { pele: "pele-1" }, "slot errado some");
});

function depsFalsas({ montagem = null } = {}) {
  const gravados = [];
  return {
    gravados,
    liberados: async () => [...liberados],
    montagemAtual: async () => montagem,
    gravar: async (_id, data) => { gravados.push(data); return { avatarMontado: data.avatarMontado ?? montagem, mostrarAvatar: data.mostrarAvatar ?? false }; },
  };
}

test("salvarAvatar: grava a montagem válida", async () => {
  const deps = depsFalsas();
  const r = await salvarAvatar("u1", { config: { pele: "pele-1", cabelo: "cabelo-curto" }, mostrarAvatar: true }, deps);
  assert.equal(r.status, 200);
  assert.deepEqual(deps.gravados, [{ avatarMontado: { pele: "pele-1", cabelo: "cabelo-curto" }, mostrarAvatar: true }]);
  assert.equal(r.corpo.mostrarAvatar, true);
});

test("salvarAvatar: trancada, slot errado e sem pele não gravam nada", async () => {
  for (const config of [{ pele: "pele-1", mao: "mao-controle" }, { pele: "pele-1", chapeu: "cabelo-curto" }, { cabelo: "cabelo-curto" }]) {
    const deps = depsFalsas();
    const r = await salvarAvatar("u1", { config }, deps);
    assert.equal(r.status, 400, JSON.stringify(config));
    assert.equal(deps.gravados.length, 0);
  }
});

test("salvarAvatar: avatar na bolinha exige montagem salva", async () => {
  const semMontagem = depsFalsas();
  assert.equal((await salvarAvatar("u1", { mostrarAvatar: true }, semMontagem)).status, 400);
  const comMontagem = depsFalsas({ montagem: { pele: "pele-1" } });
  assert.equal((await salvarAvatar("u1", { mostrarAvatar: true }, comMontagem)).status, 200);
  assert.equal((await salvarAvatar("u1", { mostrarAvatar: "sim" }, comMontagem)).status, 400);
  assert.equal((await salvarAvatar("u1", {}, comMontagem)).status, 400);
});
