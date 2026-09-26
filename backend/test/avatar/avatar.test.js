import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ITENS, ITEM_POR_ID, NOMES_DOS_SLOTS, CAMADAS, CONFIG_PADRAO, TIPOS_DE_DESBLOQUEIO, catalogoPublico,
  avatarPadrao, hashDoTexto, TELA, CORES_CABELO, corDoCabeloValida, VERSAO_CATALOGO, VERSAO_ARTE,
  SLOT_DAS_PECAS, PLACAS, textoDaPlaca, raridadeDaRegra, CORPOS, CAMADAS_APAGAVEIS,
} from "../../src/avatar/catalogo.js";
import {
  itemLiberado, liberadosPelosDados, dadosNecessarios, carregarDados, patenteDoCatalogo,
  validarConfig, configPublica, salvarAvatar, TABELAS_DE_PATENTE, progressoDaPeca, proximaPeca,
  resumoDoAvatar, avatarDoUsuario, avatarParaCongelar, campeonatosDe,
} from "../../src/avatar/desbloqueio.js";
import { logoPorNomeDeTitulo, nomesDeTitulosDesbloqueados, fonteDoTitulo, nomeDoTituloQuiz, QUIZ_NOMES, RAPIDO_TITULOS } from "../../src/game/titulosConfig.js";

// Nada aqui toca o banco: as regras são funções puras sobre os dados, e a
// busca recebe um "db" de mentira que só registra o que foi consultado.

const semNada = () => ({ titulos: new Set(), acertosPorTema: {}, campeoes: [], campeonatos: {}, melhorMes: {}, vitalicio: {}, streakRecorde: 0 });
const peca = (desbloqueio) => ({ id: "x", slot: "chapeu", nome: "X", desbloqueio });
const iniciais = () => ITENS.filter((i) => i.desbloqueio.tipo === "inicial").map((i) => i.id);

// ---------------- catálogo ----------------

test("catálogo: 112 peças, ids únicos, slots válidos, arquivo no padrão", () => {
  assert.equal(ITENS.length, 112);
  assert.equal(VERSAO_ARTE, "v3");
  assert.equal(ITEM_POR_ID.size, ITENS.length, "id repetido no catálogo");
  for (const i of ITENS) {
    assert.ok(NOMES_DOS_SLOTS.includes(i.slot), `${i.id}: slot ${i.slot}`);
    assert.equal(i.arquivo, `/avatar/${i.slot}/${i.id}-v3.webp`);
    assert.notEqual(i.slot, "maoEsquerda", "a mão esquerda não tem peça própria");
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
    if (i.pintavel) assert.ok(noDisco.has(i.pintavel), `falta o cinza ${i.pintavel}`);
    if (i.apagaBraco) assert.ok(noDisco.has(i.apagaBraco), `falta a máscara de apagar ${i.apagaBraco}`);
    if (i.slot === "pele") {
      assert.match(i.cor || "", /^#[0-9a-f]{6}$/i, `${i.id} sem cor`);
      assert.match(i.corFeminina || "", /^#[0-9a-f]{6}$/i, `${i.id} sem cor feminina`);
      assert.equal(i.arquivoFeminino, `/avatar/pele/${i.id}-f-v3.webp`);
      assert.ok(noDisco.has(i.arquivoFeminino), `falta o corpo feminino ${i.arquivoFeminino}`);
    }
  }
  const apagas = [...noDisco].filter((f) => f.endsWith("-apaga-v3.webp"));
  const comApaga = new Set(ITENS.filter((i) => i.apagaBraco).map((i) => i.apagaBraco));
  for (const a of apagas) assert.ok(comApaga.has(a), `máscara de apagar sem peça no catálogo: ${a}`);
  assert.equal(comApaga.size, 21);
  assert.ok(ITENS.filter((i) => i.apagaBraco).every((i) => i.slot === "mao"), "só peças da mão apagam o braço");
  const femininos = [...noDisco].filter((f) => f.endsWith("-f-v3.webp"));
  assert.equal(femininos.length, 5);
  const mascaras = [...noDisco].filter((f) => f.endsWith("-pele-v3.webp"));
  const listadas = new Set(ITENS.filter((i) => i.mascaraPele).map((i) => i.mascaraPele));
  for (const m of mascaras) assert.ok(listadas.has(m), `máscara sem peça no catálogo: ${m}`);
  assert.equal(listadas.size, 52);
  const cinzas = [...noDisco].filter((f) => f.endsWith("-cinza-v3.webp"));
  const pintaveis = new Set(ITENS.filter((i) => i.pintavel).map((i) => i.pintavel));
  for (const c of cinzas) assert.ok(pintaveis.has(c), `cinza sem cabelo no catálogo: ${c}`);
  assert.equal(pintaveis.size, 9);
  // Só arte v3 na pasta: a v1, a v2 e o troféu genérico saíram.
  assert.deepEqual([...noDisco].filter((f) => !f.endsWith("-v3.webp")), [], "arquivo fora da versão atual");
  assert.ok(![...noDisco].some((f) => f.includes("/mao-trofeu-v2") || f.includes("/mao-trofeu-pele-v2")), "troféu genérico apagado");
  assert.equal(noDisco.size, 112 + 52 + 9 + 21 + 5, "nenhum arquivo sobrando na pasta");
});

test("catálogo: toda regra aponta pra algo que existe", () => {
  for (const { id, desbloqueio: d } of ITENS) {
    assert.ok(TIPOS_DE_DESBLOQUEIO.includes(d.tipo), `${id}: tipo ${d.tipo}`);
    if (d.tipo === "patente") assert.ok(patenteDoCatalogo(d.jogo, d.patente), `${id}: patente ${d.jogo}/${d.patente}`);
    if (d.tipo === "titulo" && d.nome) assert.ok(logoPorNomeDeTitulo(d.nome) !== null, `${id}: título "${d.nome}" não existe`);
    if (d.tipo === "titulo") assert.ok(d.nome, id);
    if (d.tipo === "campeao") assert.ok(["stop", "quiz", "acromania"].includes(d.jogo), `${id}: jogo ${d.jogo}`);
    if (d.tipo === "sequencia") assert.ok(d.dias > 0, id);
    if (d.tipo === "pontos") assert.ok(d.jogo && d.min > 0, id);
  }
  assert.equal(ITEM_POR_ID.get("cabelo-anime").desbloqueio.nome, "Mestre de Anime");
  assert.equal(ITEM_POR_ID.get("cabelo-anime-ouro").desbloqueio.nome, "Sábio Otaku");
  assert.equal(ITEM_POR_ID.get("rosto-pintura").desbloqueio.nome, "Conhecedor de Futebol");
  assert.equal(ITEM_POR_ID.get("roupa-couro").desbloqueio.nome, "Mestre de Rock'n Roll");
  assert.equal(nomeDoTituloQuiz("xyz", "ouro"), null);
  assert.match(ITEM_POR_ID.get("cabelo-moicano").dica, /7 dias seguidos/);
});

test("catálogo: cobre todo slot e todo tipo; montagem padrão é válida e inicial", () => {
  for (const s of NOMES_DOS_SLOTS) assert.ok(ITENS.some((i) => i.slot === SLOT_DAS_PECAS[s] && i.desbloqueio.tipo === "inicial"), `slot sem peça inicial: ${s}`);
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
  const vestido = { pele: "pele-media", chapeu: "chapeu-coroa", mao: "mao-trofeu-stop", mesTrofeu: "2026-08" };
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

test("titulo: nome exato", () => {
  const dados = { ...semNada(), titulos: new Set(["Conhecedor de Games", "Campeão Stop Ago/2026"]) };
  assert.equal(itemLiberado(peca({ tipo: "titulo", nome: "Conhecedor de Games" }), dados), true);
  assert.equal(itemLiberado(peca({ tipo: "titulo", nome: "Mestre de Games" }), dados), false);
  assert.equal(itemLiberado(peca({ tipo: "titulo" }), dados), false);
  assert.equal(itemLiberado(ITEM_POR_ID.get("cabelo-chamas"), dados), false);
  // Coroa não sai mais pelo NOME do título de campeão: é a regra "campeao".
  assert.equal(itemLiberado(ITEM_POR_ID.get("chapeu-coroa"), dados), false);
});

test("campeao: coroa e troféu de cada jogo só com o campeonato DAQUELE jogo", () => {
  const campeoes = [
    { gameKey: "acromania", monthKey: "2026-08", points: 1 },
    { gameKey: "acromania", monthKey: "2026-09", points: 1 },
    { gameKey: "stop", monthKey: "2026-07", points: 1 },
  ];
  const dados = { ...semNada(), campeoes, campeonatos: campeonatosDe(campeoes) };
  const lib = new Set(liberadosPelosDados(dados));
  for (const id of ["chapeu-coroa", "mao-trofeu-stop", "chapeu-coroa-acromania", "mao-trofeu-acromania"]) assert.ok(lib.has(id), id);
  for (const id of ["chapeu-coroa-quiz", "mao-trofeu-quiz"]) assert.ok(!lib.has(id), id);
  assert.deepEqual(campeonatosDe(campeoes), { acromania: ["2026-09", "2026-08"], stop: ["2026-07"] }, "meses do mais recente pro mais antigo");
  assert.deepEqual(campeonatosDe([]), {});
  // Os seis são lendários e dizem o jogo na dica.
  for (const jogo of ["stop", "quiz", "acromania"]) {
    const itens = ITENS.filter((i) => i.desbloqueio.tipo === "campeao" && i.desbloqueio.jogo === jogo);
    assert.equal(itens.length, 2, jogo);
    for (const i of itens) assert.equal(i.raridade, "lendario", i.id);
  }
  assert.equal(raridadeDaRegra({ tipo: "campeao", jogo: "quiz" }), "lendario");
  assert.equal(ITEM_POR_ID.get("chapeu-coroa").nome, "Coroa do Stop");
  assert.equal(ITEM_POR_ID.get("chapeu-coroa-acromania").dica, "Seja campeão do mês no Acromania (1º lugar do ranking mensal).");
  assert.equal(ITEM_POR_ID.get("mao-trofeu"), undefined, "troféu genérico saiu");
  // Campeão do Acromania (fecharMes agora grava) vira título com o nome certo.
  const nomes = nomesDeTitulosDesbloqueados({ registrosCampeao: campeoes });
  assert.ok(nomes.has("Campeão Acromania Set/2026 (2x)"), [...nomes].join(" | "));
  assert.deepEqual(fonteDoTitulo("Campeão Acromania Set/2026"), { campeao: true });
  assert.ok(logoPorNomeDeTitulo("Campeão Acromania Set/2026"));
});

test("campeao: plaqueta nos três troféus; texto do mês", () => {
  assert.deepEqual(Object.keys(PLACAS).sort(), ["mao-trofeu-acromania", "mao-trofeu-quiz", "mao-trofeu-stop"]);
  for (const [id, p] of Object.entries(PLACAS)) {
    const item = ITEM_POR_ID.get(id);
    assert.deepEqual(item.placa, p);
    assert.ok(item.mascaraPele, `${id} tem máscara de pele`);
    // No lado direito da tela (mão direita do boneco), sobre a base.
    assert.ok(p.x > 600 && p.x < 800 && p.y > 750 && p.y < 900, id);
  }
  assert.equal(textoDaPlaca("2026-09"), "SET/26");
  assert.equal(textoDaPlaca("2027-01"), "JAN/27");
  assert.equal(textoDaPlaca("2026-13"), null);
  assert.equal(textoDaPlaca("xx"), null);
});

test("Mentira Sincera desligado: nenhuma peça depende dele", () => {
  for (const { id, desbloqueio: d } of ITENS) {
    assert.notEqual(d.jogo, "mentira", id);
    assert.doesNotMatch(`${ITEM_POR_ID.get(id).dica} ${ITEM_POR_ID.get(id).motivo}`, /Mentira/, id);
  }
  assert.equal(TABELAS_DE_PATENTE.mentira, undefined);
  assert.equal(ITEM_POR_ID.get("roupa-terno").desbloqueio.nome, nomeDoTituloQuiz("direito", "bronze"));
  assert.equal(ITEM_POR_ID.get("roupa-terno").raridade, "iniciante");
  assert.equal(ITEM_POR_ID.get("mao-lupa").desbloqueio.nome, nomeDoTituloQuiz("geral", "prata"));
  assert.equal(ITEM_POR_ID.get("mao-lupa").raridade, "intermediario");
});

test("undercut rosa: mesma regra do rabo de cavalo rosa, pintável, sai junto", () => {
  const rabo = ITEM_POR_ID.get("cabelo-rabo-rosa");
  const undercut = ITEM_POR_ID.get("cabelo-undercut-rosa");
  assert.equal(undercut.slot, "cabelo");
  assert.deepEqual(undercut.desbloqueio, rabo.desbloqueio);
  assert.equal(undercut.dica, rabo.dica);
  assert.match(undercut.dica, /Rabo de cavalo rosa e Undercut rosa/);
  assert.equal(undercut.pintavel, "/avatar/cabelo/cabelo-undercut-rosa-cinza-v3.webp");
  const dados = { ...semNada(), vitalicio: { quiz: 5000 } };
  assert.equal(itemLiberado(undercut, dados), true);
  assert.equal(itemLiberado(rabo, dados), true);
  assert.equal(itemLiberado(undercut, { ...semNada(), vitalicio: { quiz: 4999 } }), false);
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
  const regra = ITEM_POR_ID.get("costas-jetpack");
  const min = patenteDoCatalogo("acromania", "coroa_ouro").min;
  assert.equal(itemLiberado(regra, { ...semNada(), melhorMes: { acromania: min } }), true);
  assert.equal(itemLiberado(regra, { ...semNada(), melhorMes: { acromania: min - 1 } }), false);
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
  const dados = { ...semNada(), streakRecorde: 5, vitalicio: { quiz: 1200, total: 3000 }, acertosPorTema: { anime: 2500, direito: 70 }, melhorMes: { acromania: 7000 } };
  assert.deepEqual(progressoDaPeca(ITEM_POR_ID.get("cabelo-moicano"), dados), { atual: 5, meta: 7, unidade: "dias seguidos" });
  assert.equal(progressoDaPeca(ITEM_POR_ID.get("cabelo-rabo-rosa"), dados).meta, 5000);
  assert.equal(progressoDaPeca(ITEM_POR_ID.get("pescoco-medalha"), dados).atual, 3000);
  assert.deepEqual(
    [progressoDaPeca(ITEM_POR_ID.get("cabelo-anime"), dados).atual, progressoDaPeca(ITEM_POR_ID.get("cabelo-anime"), dados).meta],
    [2500, 5000],
  );
  assert.equal(progressoDaPeca(ITEM_POR_ID.get("roupa-terno"), dados).atual, 70);
  assert.equal(progressoDaPeca(ITEM_POR_ID.get("costas-jetpack"), dados).atual, 7000);
  assert.equal(progressoDaPeca(ITEM_POR_ID.get("mao-trofeu-acromania"), dados), null, "troféu não tem barra");
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
  assert.deepEqual(await resumoDoAvatar("guest-1", { convidado: true }), { liberados: [], proxima: null, campeonatos: {} });
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

  // O catálogo real lê tudo (o lendário depende de Quiz e Stop, as coroas
  // da CampeaoMensal). Nunca mais de 6 consultas, e a CampeaoMensal uma vez só.
  const todas = dbFalso();
  await carregarDados("u1", dadosNecessarios(), todas.db);
  assert.ok(todas.chamadas.length <= 6);
  assert.equal(todas.chamadas.filter((c) => c === "campeaoMensal.findMany").length, 1);
});

test("carregarDados: monta os dados a partir das linhas do banco", async () => {
  const { db } = dbFalso({
    "user.findUnique": () => ({ streakRecorde: 31 }),
    "monthlyScore.groupBy": () => [{ gameKey: "acromania", _max: { points: 170000 } }],
    "lifetimeScore.findMany": (args) => {
      assert.ok(args.where.NOT, "com peça de total, lê todos os jogos (sem os por sala)");
      return [{ gameKey: "stop", points: 20000 }, { gameKey: "quiz", points: 6000 }, { gameKey: "mentira", points: 90000 }];
    },
    "campeaoMensal.findMany": (args) => {
      assert.deepEqual(args.where, { userId: "u1" }, "por userId (índice)");
      return [{ gameKey: "stop", monthKey: "2026-08", points: 700000 }, { gameKey: "stop", monthKey: "2026-09", points: 650000 }];
    },
    "quizRoomStat.findMany": () => [{ roomId: "quiz-anime", correct: 6000 }, { roomId: "quiz-anime-dificil", correct: 4000 }],
  });
  const dados = await carregarDados("u1", dadosNecessarios(), db);
  assert.equal(dados.vitalicio.total, 26000, "Mentira (desligado) fica fora da soma");
  assert.deepEqual(dados.campeonatos, { stop: ["2026-09", "2026-08"] });
  assert.equal(dados.acertosPorTema.anime, 10000);
  const ids = liberadosPelosDados(dados);
  for (const id of ["cabelo-anime", "costas-jetpack", "chapeu-coroa", "mao-trofeu-stop", "costas-capa", "baixo-camuflada", "pescoco-medalha", "cabelo-rabo-rosa"]) {
    assert.ok(ids.includes(id), id);
  }
  assert.ok(!ids.includes("fundo-galaxia"), "31 dias não dá os 60");
  assert.ok(!ids.includes("costas-morcego"), "campeão do Stop, mas sem a patente máxima no mês");
  assert.ok(!ids.includes("mao-trofeu-quiz") && !ids.includes("chapeu-coroa-acromania"), "só o jogo em que foi campeão");
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
  assert.match(validarConfig({ pele: "pele-clara", mao: "mao-trofeu-stop" }, liberados).erro, /trancado/);
  assert.match(validarConfig({ pele: "pele-clara", maoEsquerda: "mao-trofeu-stop" }, liberados).erro, /trancado/);
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
  for (const config of [{ pele: "pele-clara", mao: "mao-trofeu-stop" }, { pele: "pele-clara", chapeu: "cabelo-curto" }, { cabelo: "cabelo-curto" }]) {
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

// ---------------- motivo (como a peça foi ganha) ----------------

test("motivo: toda peça tem o texto de como foi ganha, coerente com a regra", () => {
  for (const i of ITENS) {
    assert.ok(typeof i.motivo === "string" && i.motivo.length > 10, `${i.id}: sem motivo`);
    if (i.desbloqueio.tipo === "inicial") assert.match(i.motivo, /^Peça inicial/, i.id);
    else assert.match(i.motivo, /^Conquistada /, i.id);
  }
  assert.equal(ITEM_POR_ID.get("cabelo-anime-ouro").motivo, "Conquistada com o título Sábio Otaku (ouro em Anime no Quiz).");
  assert.equal(ITEM_POR_ID.get("cabelo-moicano").motivo, "Conquistada por jogar 7 dias seguidos.");
  assert.equal(ITEM_POR_ID.get("cabelo-rabo-rosa").motivo, "Conquistada com 5.000 pontos no Quiz.");
  assert.match(ITEM_POR_ID.get("roupa-terno").motivo, /bronze em Direito no Quiz/);
  assert.equal(ITEM_POR_ID.get("chapeu-coroa-acromania").motivo, "Conquistada como campeão do mês no Acromania (1º lugar do ranking mensal).");
  assert.ok(catalogoPublico().itens.every((i) => i.motivo), "o motivo vai no catálogo público");
});

// ---------------- cor do cabelo ----------------

test("cor do cabelo: 9 cabelos pintáveis, moicano e chamas não; paleta no catálogo", () => {
  assert.equal(ITENS.filter((i) => i.pintavel).length, 9);
  assert.ok(ITENS.filter((i) => i.pintavel).every((i) => i.slot === "cabelo" && i.pintavel === `/avatar/cabelo/${i.id}-cinza-v3.webp`));
  assert.equal(ITEM_POR_ID.get("cabelo-moicano").pintavel, undefined);
  assert.equal(ITEM_POR_ID.get("cabelo-chamas").pintavel, undefined);
  assert.equal(CORES_CABELO.original, null);
  for (const [k, v] of Object.entries(CORES_CABELO)) if (k !== "original") assert.match(v, /^#[0-9a-f]{6}$/i, k);
  const pub = catalogoPublico();
  assert.equal(pub.versao, VERSAO_CATALOGO);
  assert.deepEqual(pub.coresCabelo.map((c) => c.chave), Object.keys(CORES_CABELO));
  assert.ok(pub.coresCabelo.every((c) => c.nome));
});

test("validarConfig: cor do cabelo precisa ser da paleta; some com cabelo que não se pinta", () => {
  const lib = new Set([...iniciais(), "cabelo-moicano"]);
  assert.deepEqual(validarConfig({ pele: "pele-clara", cabelo: "cabelo-curto", corCabelo: "ruivo" }, lib), { config: { pele: "pele-clara", cabelo: "cabelo-curto", corCabelo: "ruivo" } });
  // "original" (e null) = sem cor gravada.
  assert.deepEqual(validarConfig({ pele: "pele-clara", cabelo: "cabelo-curto", corCabelo: "original" }, lib), { config: { pele: "pele-clara", cabelo: "cabelo-curto" } });
  assert.deepEqual(validarConfig({ pele: "pele-clara", cabelo: "cabelo-curto", corCabelo: null }, lib), { config: { pele: "pele-clara", cabelo: "cabelo-curto" } });
  // Moicano não se pinta; sem cabelo, também não.
  assert.deepEqual(validarConfig({ pele: "pele-clara", cabelo: "cabelo-moicano", corCabelo: "azul" }, lib), { config: { pele: "pele-clara", cabelo: "cabelo-moicano" } });
  assert.deepEqual(validarConfig({ pele: "pele-clara", corCabelo: "azul" }, lib), { config: { pele: "pele-clara" } });
  // Fora da paleta: erro.
  for (const cor of ["dourado", "#ff0000", 3, "toString", "__proto__", ["azul"]]) {
    assert.match(validarConfig({ pele: "pele-clara", cabelo: "cabelo-curto", corCabelo: cor }, lib).erro, /Cor de cabelo inválida/, String(cor));
  }
});

test("salvarAvatar e configPublica: a cor vai e volta; cor velha de cabelo trocado some", async () => {
  const deps = depsFalsas();
  const r = await salvarAvatar("u1", { config: { pele: "pele-clara", cabelo: "cabelo-curto", corCabelo: "roxo" } }, deps);
  assert.equal(r.status, 200);
  assert.deepEqual(deps.gravados[0].avatarMontado, { pele: "pele-clara", cabelo: "cabelo-curto", corCabelo: "roxo" });
  assert.equal(r.corpo.avatar.corCabelo, "roxo");
  assert.equal((await salvarAvatar("u1", { config: { pele: "pele-clara", cabelo: "cabelo-curto", corCabelo: "dourado" } }, deps)).status, 400);
  assert.deepEqual(configPublica({ pele: "pele-clara", cabelo: "cabelo-chamas", corCabelo: "azul" }), { pele: "pele-clara", cabelo: "cabelo-chamas" });
  assert.deepEqual(configPublica({ pele: "pele-clara", cabelo: "cabelo-curto", corCabelo: "sumiu" }), { pele: "pele-clara", cabelo: "cabelo-curto" });
  assert.equal(avatarDoUsuario({ id: "u9", avatarMontado: { pele: "pele-clara", cabelo: "cabelo-anime", corCabelo: "verde" } }).corCabelo, "verde");
  assert.equal(corDoCabeloValida("cabelo-anime", "verde"), "verde");
  assert.equal(corDoCabeloValida("cabelo-moicano", "verde"), null);
});

test("avatar padrão: cor de cabelo natural, sorteada do id e sempre a mesma", () => {
  const naturais = new Set(["preto", "castanho", "loiro", "ruivo"]);
  const vistas = new Set();
  for (let i = 0; i < 80; i++) {
    const a = avatarPadrao(`user-${i}`);
    assert.deepEqual(avatarPadrao(`user-${i}`), a, "mesmo id, mesma cor");
    if (a.corCabelo) {
      assert.ok(naturais.has(a.corCabelo), a.corCabelo);
      assert.ok(ITEM_POR_ID.get(a.cabelo).pintavel);
    }
    vistas.add(a.corCabelo || "original");
    assert.deepEqual(validarConfig(a, new Set(iniciais())), { config: a }, "padrão com cor passa na validação");
    assert.deepEqual(configPublica(a), a);
  }
  assert.ok(vistas.size >= 4, `cores sorteadas: ${[...vistas]}`);
});

test("salvarAvatar: o PRIMEIRO avatar liga o avatar nas bolinhas; depois, não mexe", async () => {
  // Primeira vez: liga sozinho e avisa a tela.
  let deps = depsFalsas();
  let r = await salvarAvatar("u1", { config: { pele: "pele-clara" } }, deps, { jaMontou: false });
  assert.equal(r.status, 200);
  assert.deepEqual(deps.gravados, [{ avatarMontado: { pele: "pele-clara" }, mostrarAvatar: true }]);
  assert.equal(r.corpo.mostrarAvatar, true);
  assert.equal(r.corpo.avatarLigado, true);
  // Primeira vez, mas o pedido diz "Foto": vale o pedido.
  deps = depsFalsas();
  r = await salvarAvatar("u1", { config: { pele: "pele-clara" }, mostrarAvatar: false }, deps, { jaMontou: false });
  assert.deepEqual(deps.gravados, [{ avatarMontado: { pele: "pele-clara" }, mostrarAvatar: false }]);
  assert.equal(r.corpo.avatarLigado, false);
  // Já tinha montado: a preferência fica como estava.
  deps = depsFalsas();
  r = await salvarAvatar("u1", { config: { pele: "pele-clara" } }, deps, { jaMontou: true });
  assert.deepEqual(deps.gravados, [{ avatarMontado: { pele: "pele-clara" } }]);
  assert.equal(r.corpo.avatarLigado, false);
  // Montagem inválida na primeira vez: nada gravado, nada ligado.
  deps = depsFalsas();
  r = await salvarAvatar("u1", { config: { cabelo: "cabelo-curto" } }, deps, { jaMontou: false });
  assert.equal(r.status, 400);
  assert.equal(deps.gravados.length, 0);
});

// ---------------- mão esquerda ----------------

test("mão esquerda: aceita as peças da mão (a mesma nas duas), recusa as outras", () => {
  const lib = new Set([...iniciais(), "mao-guitarra"]);
  assert.deepEqual(
    validarConfig({ pele: "pele-clara", mao: "mao-controle", maoEsquerda: "mao-guitarra" }, lib),
    { config: { pele: "pele-clara", mao: "mao-controle", maoEsquerda: "mao-guitarra" } },
  );
  assert.equal(validarConfig({ pele: "pele-clara", mao: "mao-livro", maoEsquerda: "mao-livro" }, lib).config.maoEsquerda, "mao-livro", "a mesma peça nas duas mãos");
  assert.match(validarConfig({ pele: "pele-clara", maoEsquerda: "chapeu-bone" }, lib).erro, /não vai nessa parte/);
  assert.match(validarConfig({ pele: "pele-clara", mao: "mao-lupa" }, lib).erro, /trancado/);
  // Padrão nunca enche a mão esquerda; montagem pública mantém.
  for (let i = 0; i < 20; i++) assert.equal(avatarPadrao(`u-${i}`).maoEsquerda, undefined);
  assert.deepEqual(configPublica({ pele: "pele-clara", maoEsquerda: "mao-livro" }), { pele: "pele-clara", maoEsquerda: "mao-livro" });
  assert.deepEqual(configPublica({ pele: "pele-clara", maoEsquerda: "chapeu-bone" }), { pele: "pele-clara" });
  assert.equal(CAMADAS.indexOf("maoEsquerda"), CAMADAS.indexOf("mao") + 1, "desenhada logo depois da mão");
  assert.equal(SLOT_DAS_PECAS.maoEsquerda, "mao");
});

// ---------------- mês do troféu ----------------

test("mesTrofeu: mês em que foi campeão DAQUELE jogo; sem mês, o mais recente", () => {
  const lib = new Set([...iniciais(), "mao-trofeu-stop", "mao-trofeu-acromania", "chapeu-coroa"]);
  const camp = { stop: ["2026-09", "2026-07"], acromania: ["2026-08"] };
  const ok = (c) => validarConfig({ pele: "pele-clara", ...c }, lib, camp);
  assert.equal(ok({ mao: "mao-trofeu-stop" }).config.mesTrofeu, "2026-09", "padrão = mais recente");
  assert.equal(ok({ mao: "mao-trofeu-stop", mesTrofeu: null }).config.mesTrofeu, "2026-09");
  assert.equal(ok({ mao: "mao-trofeu-stop", mesTrofeu: "2026-07" }).config.mesTrofeu, "2026-07");
  assert.match(ok({ mao: "mao-trofeu-stop", mesTrofeu: "2026-08" }).erro, /Mês do troféu inválido/, "agosto foi do Acromania, não do Stop");
  assert.match(ok({ mao: "mao-trofeu-stop", mesTrofeu: 202609 }).erro, /Mês do troféu inválido/);
  // Cada mão com o seu.
  assert.deepEqual(ok({ mao: "mao-trofeu-stop", maoEsquerda: "mao-trofeu-acromania", mesTrofeu: "2026-07" }).config, {
    pele: "pele-clara", mao: "mao-trofeu-stop", maoEsquerda: "mao-trofeu-acromania", mesTrofeu: "2026-07", mesTrofeuEsquerda: "2026-08",
  });
  assert.match(ok({ maoEsquerda: "mao-trofeu-acromania", mesTrofeuEsquerda: "2026-09" }).erro, /inválido/);
  // Mão sem troféu: o mês é ignorado (não é erro, não é gravado).
  assert.deepEqual(ok({ mao: "mao-controle", mesTrofeu: "2026-09" }).config, { pele: "pele-clara", mao: "mao-controle" });
  assert.deepEqual(ok({ chapeu: "chapeu-coroa", mesTrofeu: "1999-01" }).config, { pele: "pele-clara", chapeu: "chapeu-coroa" }, "coroa não leva mês");
});

test("salvarAvatar: o mês do troféu é conferido com os campeonatos da pessoa", async () => {
  const gravados = [];
  const deps = {
    liberados: async () => [...iniciais(), "mao-trofeu-quiz"],
    campeonatos: async () => ({ quiz: ["2026-06"] }),
    gravar: async (_id, data) => { gravados.push(data); return { avatarMontado: data.avatarMontado, mostrarAvatar: false }; },
  };
  let r = await salvarAvatar("u1", { config: { pele: "pele-clara", mao: "mao-trofeu-quiz" } }, deps);
  assert.equal(r.status, 200);
  assert.equal(gravados[0].avatarMontado.mesTrofeu, "2026-06");
  assert.equal(r.corpo.avatar.mesTrofeu, "2026-06", "vai pros outros verem na plaqueta");
  r = await salvarAvatar("u1", { config: { pele: "pele-clara", mao: "mao-trofeu-quiz", mesTrofeu: "2026-05" } }, deps);
  assert.equal(r.status, 400);
  assert.equal(gravados.length, 1);
});

test("troféu genérico antigo: montagem salva com ele perde só a peça", () => {
  const salvo = { pele: "pele-media", chapeu: "chapeu-coroa", mao: "mao-trofeu", maoEsquerda: "mao-trofeu", mesTrofeu: "2026-08", corCabelo: "azul" };
  assert.deepEqual(configPublica(salvo), { pele: "pele-media", chapeu: "chapeu-coroa" });
  assert.deepEqual(avatarDoUsuario({ id: "x", avatarMontado: salvo }), { pele: "pele-media", chapeu: "chapeu-coroa" });
  // Mês só acompanha troféu que continua na mão.
  assert.deepEqual(configPublica({ pele: "pele-media", mao: "mao-trofeu-stop", mesTrofeu: "2026-08", mesTrofeuEsquerda: "2026-07" }), { pele: "pele-media", mao: "mao-trofeu-stop", mesTrofeu: "2026-08" });
  assert.deepEqual(configPublica({ pele: "pele-media", mao: "mao-trofeu-stop", mesTrofeu: "lixo" }), { pele: "pele-media", mao: "mao-trofeu-stop" });
  // Reenviar pro PUT (o editor parte do configPublica) passa na validação.
  assert.ok(validarConfig(configPublica(salvo), new Set(["pele-media", "chapeu-coroa"])).config);
});

// ---------------- escada do Quiz ----------------

const ESCADA = {
  futebol: [["rosto-pintura"], ["roupa-futebol", "mao-bola"], ["roupa-camisa10-ouro"]],
  esportes: [["chapeu-faixa"], ["pescoco-apito", "fundo-estadio"], ["mao-tocha-ouro"]],
  automobilismo: [["chapeu-capacete"], ["roupa-piloto"], ["roupa-piloto-ouro"]],
  anime: [["roupa-escolar"], ["cabelo-anime"], ["cabelo-anime-ouro"]],
  ciencias: [["rosto-nerd"], ["roupa-jaleco"], ["roupa-jaleco-ouro"]],
  terceirao: [["mao-lapis"], ["chapeu-capelo", "roupa-beca"], ["roupa-beca-ouro"]],
  historia: [["chapeu-tricornio"], ["chapeu-explorador"], ["roupa-cavaleiro-ouro"]],
  mitologia: [["chapeu-louros"], ["chapeu-viking"], ["chapeu-espartano-ouro"]],
  games: [["roupa-pixel"], ["chapeu-headset"], ["mao-espada-pixel-ouro"]],
  cinema: [["rosto-3d"], ["chapeu-cartola"], ["mao-estatueta-ouro"]],
  series: [["mao-pipoca"], ["rosto-heroi"], ["roupa-heroi-ouro"]],
  letras: [["mao-pena"], ["rosto-monoculo"], ["mao-livro-ouro"]],
  geral: [[], ["mao-lupa"], ["mao-lampada-ouro"]],
  musica: [["mao-pandeiro"], ["roupa-banda", "fundo-palco"], ["roupa-rockstar-ouro"]],
  mpb: [["chapeu-panama"], ["mao-microfone"], ["mao-violao-ouro"]],
  rock: [["cabelo-topete"], ["roupa-couro", "mao-guitarra"], ["mao-guitarra-ouro"]],
  novelas: [["rosto-estrela"], ["pescoco-gravata"], ["roupa-smoking-ouro"]],
  geografia: [["costas-trilha"], ["pescoco-havaiano"], ["mao-globo-ouro"]],
  direito: [["roupa-terno"], ["mao-martelo", "fundo-tribunal"], ["roupa-toga-ouro"]],
};

test("escada do Quiz: cada tema bronze/prata/ouro aponta pro título de verdade; ouro é lendário com aura", () => {
  assert.deepEqual(Object.keys(ESCADA).sort(), Object.keys(QUIZ_NOMES).sort(), "todos os temas do Quiz");
  const niveis = ["bronze", "prata", "ouro"];
  const raridade = { bronze: "iniciante", prata: "intermediario", ouro: "lendario" };
  const naEscada = new Set();
  for (const [tema, degraus] of Object.entries(ESCADA)) {
    degraus.forEach((ids, n) => {
      for (const id of ids) {
        const item = ITEM_POR_ID.get(id);
        assert.ok(item, id);
        naEscada.add(id);
        assert.equal(item.desbloqueio.tipo, "titulo", id);
        assert.equal(item.desbloqueio.tema, tema, id);
        assert.equal(item.desbloqueio.nivel, niveis[n], id);
        assert.equal(item.desbloqueio.nome, nomeDoTituloQuiz(tema, niveis[n]), id);
        assert.ok(logoPorNomeDeTitulo(item.desbloqueio.nome), `${id}: título existe`);
        assert.equal(item.raridade, raridade[niveis[n]], id);
        assert.equal(!!item.aura, niveis[n] === "ouro", `${id}: aura só no ouro`);
      }
    });
  }
  // Nenhuma outra peça sai de título do Quiz; as 19 de ouro são as únicas com aura.
  for (const i of ITENS) if (i.desbloqueio.tema) assert.ok(naEscada.has(i.id), `${i.id} fora da escada`);
  assert.equal(ITENS.filter((i) => i.aura).length, 19);
  assert.ok(ITENS.filter((i) => i.aura).every((i) => i.raridade === "lendario"));
  assert.equal(ITEM_POR_ID.get("cabelo-anime-ouro").pintavel, undefined, "cabelo dourado não se pinta");
});

test("relâmpago: jaqueta e rastro de raio saem com o título relâmpago do Stop", () => {
  const nome = RAPIDO_TITULOS[0].nome;
  assert.equal(nome, "Relâmpago da Avançada");
  for (const id of ["roupa-relampago", "costas-raio"]) {
    const item = ITEM_POR_ID.get(id);
    assert.deepEqual(item.desbloqueio, { tipo: "titulo", nome });
    assert.equal(item.raridade, "intermediario");
    assert.match(item.dica, /500 STOPs/);
  }
  // O verificador de títulos enxerga os relâmpago (vêm da StopStat).
  assert.deepEqual(fonteDoTitulo(nome), { stop: true });
  const titulos = nomesDeTitulosDesbloqueados({ statsStop: [{ grupo: "avancada", stops: 600, rapidos: 500 }] });
  assert.ok(titulos.has(nome));
  const lib = liberadosPelosDados({ ...semNada(), titulos });
  assert.ok(lib.includes("roupa-relampago") && lib.includes("costas-raio"));
  assert.ok(!liberadosPelosDados({ ...semNada(), titulos: nomesDeTitulosDesbloqueados({ statsStop: [{ grupo: "avancada", stops: 600, rapidos: 499 }] }) }).includes("costas-raio"));
});

// ---------------- corpo ----------------

test("corpo: masculino ou feminino; só o feminino é gravado; o resto é erro", () => {
  assert.deepEqual(CORPOS.map((c) => c.chave), ["masculino", "feminino"]);
  const lib = new Set(iniciais());
  assert.deepEqual(validarConfig({ pele: "pele-clara", corpo: "feminino" }, lib), { config: { pele: "pele-clara", corpo: "feminino" } });
  assert.deepEqual(validarConfig({ pele: "pele-clara", corpo: "masculino" }, lib), { config: { pele: "pele-clara" } });
  assert.deepEqual(validarConfig({ pele: "pele-clara", corpo: null }, lib), { config: { pele: "pele-clara" } });
  for (const corpo of ["outro", 1, ["feminino"], "Feminino"]) assert.match(validarConfig({ pele: "pele-clara", corpo }, lib).erro, /Corpo inválido/, String(corpo));
  assert.deepEqual(configPublica({ pele: "pele-clara", corpo: "feminino" }), { pele: "pele-clara", corpo: "feminino" });
  assert.deepEqual(configPublica({ pele: "pele-clara", corpo: "xyz" }), { pele: "pele-clara" });
});

test("corpo no avatar padrão: sorteado do id (meio a meio), com cabelo que combina", () => {
  const femininos = ["cabelo-liso-longo", "cabelo-coque", "cabelo-cacheado", "cabelo-black-power"];
  const masculinos = ["cabelo-curto", "cabelo-cacheado", "cabelo-black-power"];
  let f = 0;
  const N = 400;
  for (let i = 0; i < N; i++) {
    const a = avatarPadrao(`pessoa-${i}`);
    assert.deepEqual(avatarPadrao(`pessoa-${i}`), a, "determinístico");
    if (a.corpo === "feminino") { f++; assert.ok(femininos.includes(a.cabelo), a.cabelo); } else {
      assert.equal(a.corpo, undefined);
      assert.ok(masculinos.includes(a.cabelo), a.cabelo);
    }
  }
  assert.ok(f > N * 0.35 && f < N * 0.65, `femininos: ${f} de ${N}`);
});

// ---------------- mãos ----------------

test("máscara de apagar o braço: só das camadas de baixo (não fundo nem costas)", () => {
  assert.deepEqual(CAMADAS_APAGAVEIS, ["pele", "parteDeBaixo", "roupa", "pescoco"]);
  // Seguidas na ordem de desenho (o frontend embrulha as quatro num grupo).
  const i = CAMADAS.indexOf("pele");
  assert.deepEqual(CAMADAS.slice(i, i + 4), CAMADAS_APAGAVEIS);
  assert.equal(catalogoPublico().camadasApagaveis.length, 4);
  assert.equal(ITEM_POR_ID.get("mao-trofeu-stop").apagaBraco, "/avatar/mao/mao-trofeu-stop-apaga-v3.webp");
  assert.equal(ITEM_POR_ID.get("mao-livro").apagaBraco, undefined, "livro não levanta o braço");
});

test("toda peça da mão fica do lado DIREITO de quem olha (a mão esquerda espelha)", async (t) => {
  // Precisa decodificar WebP: usa o sharp se estiver instalado (ou em
  // SHARP_DIR); sem ele, o teste é pulado.
  let sharp;
  try { sharp = (await import(process.env.SHARP_DIR ? `file:///${process.env.SHARP_DIR.replace(/\\/g, "/")}/node_modules/sharp/lib/index.js` : "sharp")).default; } catch { t.skip("sem sharp pra ler WebP"); return; }
  const pasta = fileURLToPath(new URL("../../../frontend/public/avatar", import.meta.url));
  if (!existsSync(pasta)) { t.skip("sem o frontend ao lado"); return; }
  for (const item of ITENS.filter((i) => i.slot === "mao")) {
    const { data, info } = await sharp(join(pasta, item.arquivo.replace("/avatar/", ""))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let soma = 0;
    let n = 0;
    for (let p = 0; p < info.width * info.height; p++) if (data[p * 4 + 3] > 128) { soma += p % info.width; n++; }
    assert.ok(soma / n > info.width / 2, `${item.id}: centro em x ${Math.round(soma / n)}`);
  }
});
