import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ITENS, ITEM_POR_ID, NOMES_DOS_SLOTS, CAMADAS, CONFIG_PADRAO, TIPOS_DE_DESBLOQUEIO, catalogoPublico,
  avatarPadrao, hashDoTexto, TELA,
} from "../../src/avatar/catalogo.js";
import {
  itemLiberado, liberadosPelosDados, dadosNecessarios, carregarDados, patenteDoCatalogo,
  validarConfig, configPublica, salvarAvatar, TABELAS_DE_PATENTE, progressoDaPeca, proximaPeca,
  resumoDoAvatar, avatarDoUsuario, avatarParaCongelar,
} from "../../src/avatar/desbloqueio.js";
import { logoPorNomeDeTitulo, nomesDeTitulosDesbloqueados, fonteDoTitulo, nomeDoTituloQuiz } from "../../src/game/titulosConfig.js";

// Nada aqui toca o banco: as regras são funções puras sobre os dados, e a
// busca recebe um "db" de mentira que só registra o que foi consultado.

const semNada = () => ({ titulos: new Set(), acertosPorTema: {}, campeoes: [], melhorMes: {}, vitalicio: {}, streakRecorde: 0 });
const peca = (desbloqueio) => ({ id: "x", slot: "chapeu", nome: "X", desbloqueio });
const iniciais = () => ITENS.filter((i) => i.desbloqueio.tipo === "inicial").map((i) => i.id);

// ---------------- catálogo ----------------

test("catálogo: 73 peças, ids únicos, slots válidos, arquivo no padrão", () => {
  assert.equal(ITENS.length, 73);
  assert.equal(ITEM_POR_ID.size, ITENS.length, "id repetido no catálogo");
  for (const i of ITENS) {
    assert.ok(NOMES_DOS_SLOTS.includes(i.slot), `${i.id}: slot ${i.slot}`);
    assert.equal(i.arquivo, `/avatar/${i.slot}/${i.id}-v1.webp`);
    assert.ok(i.nome && i.dica, `${i.id}: nome e dica`);
  }
  assert.deepEqual([...CAMADAS].sort(), [...NOMES_DOS_SLOTS].sort(), "toda camada é um slot e vice-versa");
  assert.equal(catalogoPublico().itens.length, ITENS.length);
  // Recorte da cabeça cabe na tela e é mais fechado que o busto.
  assert.ok(TELA.cabeca.lado < TELA.busto.lado);
  assert.ok(TELA.cabeca.x + TELA.cabeca.lado <= TELA.largura && TELA.cabeca.y + TELA.cabeca.lado <= TELA.altura);
});

test("catálogo bate com a arte: todo arquivo existe, toda máscara está listada, toda pele tem cor", () => {
  const pasta = fileURLToPath(new URL("../../../frontend/public/avatar", import.meta.url));
  if (!existsSync(pasta)) return; // backend isolado, sem o frontend ao lado
  const noDisco = new Set();
  for (const slot of readdirSync(pasta)) for (const f of readdirSync(join(pasta, slot))) noDisco.add(`/avatar/${slot}/${f}`);
  for (const i of ITENS) {
    assert.ok(noDisco.has(i.arquivo), `falta a arte ${i.arquivo}`);
    if (i.mascaraPele) assert.ok(noDisco.has(i.mascaraPele), `falta a máscara ${i.mascaraPele}`);
    if (i.slot === "pele") assert.match(i.cor || "", /^#[0-9a-f]{6}$/i, `${i.id} sem cor`);
  }
  const mascaras = [...noDisco].filter((f) => f.endsWith("-pele-v1.webp"));
  const listadas = new Set(ITENS.filter((i) => i.mascaraPele).map((i) => i.mascaraPele));
  for (const m of mascaras) assert.ok(listadas.has(m), `máscara sem peça no catálogo: ${m}`);
  assert.equal(listadas.size, 26);
  assert.equal(noDisco.size, 73 + 26, "nenhum arquivo sobrando na pasta");
});

test("catálogo: toda regra aponta pra algo que existe", () => {
  for (const { id, desbloqueio: d } of ITENS) {
    assert.ok(TIPOS_DE_DESBLOQUEIO.includes(d.tipo), `${id}: tipo ${d.tipo}`);
    if (d.tipo === "patente") assert.ok(patenteDoCatalogo(d.jogo, d.patente), `${id}: patente ${d.jogo}/${d.patente}`);
    if (d.tipo === "titulo" && d.nome) assert.ok(logoPorNomeDeTitulo(d.nome) !== null, `${id}: título "${d.nome}" não existe`);
    if (d.tipo === "titulo") assert.ok(d.nome || d.comecaCom, id);
    if (d.tipo === "sequencia") assert.ok(d.dias > 0, id);
    if (d.tipo === "pontos") assert.ok(d.jogo && d.min > 0, id);
  }
  assert.equal(ITEM_POR_ID.get("cabelo-anime").desbloqueio.nome, "Sábio Otaku");
  assert.equal(ITEM_POR_ID.get("rosto-pintura").desbloqueio.nome, "Conhecedor de Futebol");
  assert.equal(ITEM_POR_ID.get("roupa-couro").desbloqueio.nome, "Mestre de Rock'n Roll");
  assert.equal(nomeDoTituloQuiz("xyz", "ouro"), null);
  assert.match(ITEM_POR_ID.get("cabelo-moicano").dica, /7 dias seguidos/);
});

test("catálogo: cobre todo slot e todo tipo; montagem padrão é válida e inicial", () => {
  for (const s of NOMES_DOS_SLOTS) assert.ok(ITENS.some((i) => i.slot === s && i.desbloqueio.tipo === "inicial"), `slot sem peça inicial: ${s}`);
  for (const t of TIPOS_DE_DESBLOQUEIO) assert.ok(ITENS.some((i) => i.desbloqueio.tipo === t), `tipo sem peça: ${t}`);
  assert.deepEqual(validarConfig(CONFIG_PADRAO, new Set(iniciais())), { config: CONFIG_PADRAO });
});

// ---------------- avatar padrão ----------------

test("avatar padrão: determinístico, só peças iniciais, fundo roxo", () => {
  const a = avatarPadrao("ckabc123");
  assert.deepEqual(avatarPadrao("ckabc123"), a, "mesmo id, mesmo boneco");
  assert.equal(a.fundo, "fundo-roxo");
  for (const slot of ["pele", "cabelo", "roupa", "parteDeBaixo"]) {
    const item = ITEM_POR_ID.get(a[slot]);
    assert.equal(item.slot, slot);
    assert.equal(item.desbloqueio.tipo, "inicial");
  }
  assert.deepEqual(validarConfig(a, new Set(iniciais())), { config: a }, "padrão passa na validação");
  assert.equal(hashDoTexto("abc"), 440920331, "hash estável (FNV-1a)");
  // Ids diferentes espalham pelas opções (não sai tudo igual).
  const peles = new Set(Array.from({ length: 60 }, (_, i) => avatarPadrao(`user-${i}`).pele));
  assert.ok(peles.size >= 4, `peles sorteadas: ${[...peles]}`);
});

test("avatarDoUsuario: montado vence o padrão; montagem inválida cai no padrão", () => {
  assert.deepEqual(avatarDoUsuario({ id: "u1", avatarMontado: { pele: "pele-negra" } }), { pele: "pele-negra" });
  assert.deepEqual(avatarDoUsuario({ id: "u1", avatarMontado: null }), avatarPadrao("u1"));
  assert.deepEqual(avatarDoUsuario({ id: "u1", avatarMontado: { cabelo: "cabelo-curto" } }), avatarPadrao("u1"));
});

test("fechamento do mês congela o avatar do campeão (montado ou padrão)", () => {
  const vestido = { pele: "pele-media", chapeu: "chapeu-coroa", mao: "mao-trofeu" };
  assert.deepEqual(avatarParaCongelar({ id: "c1", nickname: "Campeao", avatarMontado: vestido }), vestido);
  assert.deepEqual(avatarParaCongelar({ id: "c2", nickname: "SemAvatar", avatarMontado: null }), avatarPadrao("c2"));
  // Peça que saiu do catálogo não vai pro registro congelado.
  assert.deepEqual(avatarParaCongelar({ id: "c3", avatarMontado: { pele: "pele-media", chapeu: "sumiu" } }), { pele: "pele-media" });
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
  assert.equal(itemLiberado(ITEM_POR_ID.get("chapeu-coroa"), dados), true);
  assert.equal(itemLiberado(ITEM_POR_ID.get("cabelo-chamas"), dados), false);
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
  const regra = ITEM_POR_ID.get("roupa-terno");
  const min = patenteDoCatalogo("mentira", "cartola_bronze").min;
  assert.equal(itemLiberado(regra, { ...semNada(), melhorMes: { mentira: min } }), true);
  assert.equal(itemLiberado(regra, { ...semNada(), melhorMes: { mentira: min - 1 } }), false);
  assert.equal(itemLiberado(regra, { ...semNada(), melhorMes: { quiz: 10_000_000 } }), false, "outro jogo não conta");
  assert.equal(itemLiberado(peca({ tipo: "patente", jogo: "stop", patente: "nao_existe" }), { ...semNada(), melhorMes: { stop: 1e9 } }), false);
});

test("patente exclusiva (topo): só com o troféu de campeão do jogo", () => {
  const topo = TABELAS_DE_PATENTE.quiz.find((r) => r.exclusiva);
  const regra = ITEM_POR_ID.get("costas-anjo");
  assert.equal(regra.desbloqueio.patente, topo.key);
  const passou = { ...semNada(), melhorMes: { quiz: topo.min + 10 } };
  assert.equal(itemLiberado(regra, passou), false, "passou da marca mas não foi o 1º");
  assert.equal(itemLiberado(regra, { ...passou, campeoes: [{ gameKey: "stop", points: topo.min + 10 }] }), false);
  assert.equal(itemLiberado(regra, { ...passou, campeoes: [{ gameKey: "quiz", points: topo.min + 10 }] }), true);
});

test("sequencia: recorde de dias seguidos", () => {
  const regra = ITEM_POR_ID.get("costas-capa");
  assert.equal(itemLiberado(regra, { ...semNada(), streakRecorde: 29 }), false);
  assert.equal(itemLiberado(regra, { ...semNada(), streakRecorde: 30 }), true);
});

test("pontos: vitalício do jogo e total de todos os jogos", () => {
  const camuflada = ITEM_POR_ID.get("baixo-camuflada");
  assert.equal(itemLiberado(camuflada, { ...semNada(), vitalicio: { stop: 9999, quiz: 1e6 } }), false);
  assert.equal(itemLiberado(camuflada, { ...semNada(), vitalicio: { stop: 10000 } }), true);
  const medalha = ITEM_POR_ID.get("pescoco-medalha");
  assert.equal(itemLiberado(medalha, { ...semNada(), vitalicio: { stop: 20000, total: 24999 } }), false);
  assert.equal(itemLiberado(medalha, { ...semNada(), vitalicio: { total: 25000 } }), true);
});

test("liberadosPelosDados: sem dado nenhum, só as iniciais", () => {
  assert.deepEqual(liberadosPelosDados(semNada()), iniciais());
});

// ---------------- progresso ----------------

test("progresso: cada regra medível vira atual/meta; o resto é null", () => {
  const dados = { ...semNada(), streakRecorde: 5, vitalicio: { quiz: 1200, total: 3000 }, acertosPorTema: { anime: 2500 }, melhorMes: { mentira: 7000 } };
  assert.deepEqual(progressoDaPeca(ITEM_POR_ID.get("cabelo-moicano"), dados), { atual: 5, meta: 7, unidade: "dias seguidos" });
  assert.equal(progressoDaPeca(ITEM_POR_ID.get("cabelo-rabo-rosa"), dados).meta, 5000);
  assert.equal(progressoDaPeca(ITEM_POR_ID.get("pescoco-medalha"), dados).atual, 3000);
  assert.deepEqual(
    [progressoDaPeca(ITEM_POR_ID.get("cabelo-anime"), dados).atual, progressoDaPeca(ITEM_POR_ID.get("cabelo-anime"), dados).meta],
    [2500, 10000],
  );
  assert.equal(progressoDaPeca(ITEM_POR_ID.get("roupa-terno"), dados).atual, 7000);
  assert.equal(progressoDaPeca(ITEM_POR_ID.get("chapeu-coroa"), dados), null, "campeão não tem barra");
  assert.equal(progressoDaPeca(ITEM_POR_ID.get("cabelo-chamas"), dados), null, "lendário não tem barra");
  assert.equal(progressoDaPeca(ITEM_POR_ID.get("costas-morcego"), dados), null, "patente exclusiva não tem barra");
});

test("próxima peça: a mais perto de sair, ignorando as já liberadas", () => {
  const dados = { ...semNada(), streakRecorde: 6, vitalicio: { quiz: 1000 } };
  const lib = liberadosPelosDados(dados);
  const p = proximaPeca(dados, lib);
  assert.equal(p.id, "cabelo-moicano"); // 6 de 7 dias
  assert.equal(p.faltam, 1);
  assert.equal(p.atual, 6);
  // Com o moicano liberado, a mais perto passa a ser a bermuda (7 de 14 dias).
  const dados2 = { ...dados, streakRecorde: 7 };
  assert.equal(proximaPeca(dados2, liberadosPelosDados(dados2)).id, "baixo-praia");
  assert.equal(proximaPeca(semNada(), liberadosPelosDados(semNada())).atual, 0, "sem progresso ainda dá uma meta");
});

test("visitante: nada liberado, nenhuma consulta", async () => {
  assert.deepEqual(await resumoDoAvatar("guest-1", { convidado: true }), { liberados: [], proxima: null });
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
  const vazio = dbFalso();
  await carregarDados("u1", dadosNecessarios(ITENS.filter((i) => i.desbloqueio.tipo === "inicial")), vazio.db);
  assert.deepEqual(vazio.chamadas, [], "catálogo só de iniciais não toca o banco");

  const soStop = [peca({ tipo: "titulo", nome: "Dedo Nervoso" }), peca({ tipo: "pontos", jogo: "stop", min: 1 })];
  const f = dbFalso();
  await carregarDados("u1", dadosNecessarios(soStop), f.db);
  assert.deepEqual(f.chamadas.sort(), ["lifetimeScore.findMany", "stopStat.findMany"]);

  // O catálogo real não depende de título do Stop... mas a coroa ("Campeão ")
  // casa com qualquer família, então lê tudo. Nunca mais de 6 consultas.
  const todas = dbFalso();
  await carregarDados("u1", dadosNecessarios(), todas.db);
  assert.ok(todas.chamadas.length <= 6);
});

test("carregarDados: monta os dados a partir das linhas do banco", async () => {
  const { db } = dbFalso({
    "user.findUnique": () => ({ streakRecorde: 31 }),
    "monthlyScore.groupBy": () => [{ gameKey: "acromania", _max: { points: 170000 } }],
    "lifetimeScore.findMany": (args) => {
      assert.ok(args.where.NOT, "com peça de total, lê todos os jogos (sem os por sala)");
      return [{ gameKey: "stop", points: 20000 }, { gameKey: "quiz", points: 6000 }];
    },
    "campeaoMensal.findMany": () => [{ gameKey: "stop", monthKey: "2026-08", points: 700000 }],
    "quizRoomStat.findMany": () => [{ roomId: "quiz-anime", correct: 6000 }, { roomId: "quiz-anime-dificil", correct: 4000 }],
  });
  const dados = await carregarDados("u1", dadosNecessarios(), db);
  assert.equal(dados.vitalicio.total, 26000);
  assert.equal(dados.acertosPorTema.anime, 10000);
  const ids = liberadosPelosDados(dados);
  for (const id of ["cabelo-anime", "costas-jetpack", "chapeu-coroa", "mao-trofeu", "costas-capa", "baixo-camuflada", "pescoco-medalha", "cabelo-rabo-rosa"]) {
    assert.ok(ids.includes(id), id);
  }
  assert.ok(!ids.includes("fundo-galaxia"), "31 dias não dá os 60");
  assert.ok(!ids.includes("costas-morcego"), "campeão do Stop, mas sem a patente máxima no mês");
});

// ---------------- validação do PUT ----------------

const liberados = new Set(["pele-clara", "pele-media", "cabelo-curto", "roupa-camiseta"]);

test("validarConfig: aceita montagem liberada e ignora slot vazio", () => {
  assert.deepEqual(
    validarConfig({ pele: "pele-media", cabelo: "cabelo-curto", chapeu: null, rosto: "" }, liberados),
    { config: { pele: "pele-media", cabelo: "cabelo-curto" } },
  );
});

test("validarConfig: peça trancada é recusada", () => {
  assert.match(validarConfig({ pele: "pele-clara", mao: "mao-trofeu" }, liberados).erro, /trancado/);
});

test("validarConfig: peça no slot errado é recusada", () => {
  assert.match(validarConfig({ pele: "pele-clara", chapeu: "cabelo-curto" }, liberados).erro, /não vai nessa parte/);
  assert.match(validarConfig({ pele: "cabelo-curto" }, liberados).erro, /não vai nessa parte/);
});

test("validarConfig: pele é obrigatória", () => {
  assert.match(validarConfig({ cabelo: "cabelo-curto" }, liberados).erro, /pele/);
  assert.match(validarConfig({ pele: null }, liberados).erro, /pele/);
});

test("validarConfig: slot, peça ou formato desconhecidos", () => {
  assert.match(validarConfig({ pele: "pele-clara", asa: "x" }, liberados).erro, /desconhecida/);
  assert.match(validarConfig({ pele: "pele-999" }, liberados).erro, /não existe/);
  assert.ok(validarConfig(null, liberados).erro);
  assert.ok(validarConfig(["pele-clara"], liberados).erro);
  assert.ok(validarConfig({ pele: 3 }, liberados).erro);
});

test("configPublica: descarta peça que saiu do catálogo; sem pele = null", () => {
  assert.deepEqual(configPublica({ pele: "pele-clara", chapeu: "sumiu", cabelo: "cabelo-curto" }), { pele: "pele-clara", cabelo: "cabelo-curto" });
  assert.equal(configPublica({ cabelo: "cabelo-curto" }), null);
  assert.equal(configPublica(null), null);
  assert.deepEqual(configPublica({ pele: "pele-clara", chapeu: "cabelo-curto" }), { pele: "pele-clara" }, "slot errado some");
});

function depsFalsas({ montagem = null } = {}) {
  const gravados = [];
  return {
    gravados,
    liberados: async () => [...liberados],
    gravar: async (_id, data) => { gravados.push(data); return { avatarMontado: data.avatarMontado ?? montagem, mostrarAvatar: data.mostrarAvatar ?? false }; },
  };
}

test("salvarAvatar: grava a montagem válida", async () => {
  const deps = depsFalsas();
  const r = await salvarAvatar("u1", { config: { pele: "pele-clara", cabelo: "cabelo-curto" }, mostrarAvatar: true }, deps);
  assert.equal(r.status, 200);
  assert.deepEqual(deps.gravados, [{ avatarMontado: { pele: "pele-clara", cabelo: "cabelo-curto" }, mostrarAvatar: true }]);
  assert.equal(r.corpo.mostrarAvatar, true);
  assert.equal(r.corpo.avatarProprio, true);
});

test("salvarAvatar: trancada, slot errado e sem pele não gravam nada", async () => {
  for (const config of [{ pele: "pele-clara", mao: "mao-trofeu" }, { pele: "pele-clara", chapeu: "cabelo-curto" }, { cabelo: "cabelo-curto" }]) {
    const deps = depsFalsas();
    const r = await salvarAvatar("u1", { config }, deps);
    assert.equal(r.status, 400, JSON.stringify(config));
    assert.equal(deps.gravados.length, 0);
  }
});

test("salvarAvatar: avatar na bolinha pode ligar sem montagem (vale o padrão)", async () => {
  const deps = depsFalsas();
  const r = await salvarAvatar("u1", { mostrarAvatar: true }, deps);
  assert.equal(r.status, 200);
  assert.deepEqual(r.corpo.avatar, avatarPadrao("u1"));
  assert.equal(r.corpo.avatarProprio, false);
  assert.equal((await salvarAvatar("u1", { mostrarAvatar: "sim" }, deps)).status, 400);
  assert.equal((await salvarAvatar("u1", {}, deps)).status, 400);
});

test("salvarAvatar: visitante não salva nada, nem peça inicial", async () => {
  const deps = depsFalsas();
  const r = await salvarAvatar("g1", { config: { pele: "pele-clara" } }, deps, { convidado: true });
  assert.equal(r.status, 403);
  assert.match(r.corpo.error, /Crie sua conta/);
  assert.equal(deps.gravados.length, 0);
});
