import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SECOES, secaoDaPagina, contadorDaSecao, escolherSalaStop, escolherSalaQuiz,
  lembrarSala, ultimoJogo, ultimaSalaDo, linkDaSala,
} from "./navegacao.js";

// Storage de mentira (igual ao localStorage: só guarda texto).
function storageFalso(inicial = {}) {
  const dados = { ...inicial };
  return {
    getItem: (k) => (k in dados ? dados[k] : null),
    setItem: (k, v) => { dados[k] = String(v); },
    dados,
  };
}

test("SECOES tem as 5 seções na ordem do menu", () => {
  assert.deepEqual(SECOES.map((s) => s.chave), ["jogar", "competir", "social", "missoes", "eu"]);
});

test("secaoDaPagina: páginas de Jogar", () => {
  for (const pagina of [null, "jogar", "varias", "privadas", "tribunal", "impostor", "mentira", "qualquer-coisa"]) {
    assert.equal(secaoDaPagina({ pagina }, "u1"), "jogar", `pagina=${pagina}`);
  }
  assert.equal(secaoDaPagina({}, "u1"), "jogar");
});

test("secaoDaPagina: Competir, Social, Missões e Eu", () => {
  for (const p of ["ranking", "hall", "patentes"]) assert.equal(secaoDaPagina({ pagina: p }, "u1"), "competir");
  for (const p of ["amigos", "clas", "cla"]) assert.equal(secaoDaPagina({ pagina: p }, "u1"), "social");
  assert.equal(secaoDaPagina({ pagina: "missoes" }, "u1"), "missoes");
  for (const p of ["editar-perfil", "novidades", "admin"]) assert.equal(secaoDaPagina({ pagina: p }, "u1"), "eu");
});

test("secaoDaPagina: perfil próprio é Eu, perfil de outra pessoa é Social", () => {
  assert.equal(secaoDaPagina({ pagina: "jogador", id: null }, "ckabc"), "eu");
  assert.equal(secaoDaPagina({ pagina: "jogador", id: "ckabc" }, "ckabc"), "eu");
  assert.equal(secaoDaPagina({ pagina: "jogador", id: "ckxyz" }, "ckabc"), "social");
});

test("secaoDaPagina: termos e privacidade não marcam nada", () => {
  assert.equal(secaoDaPagina({ pagina: "termos" }, "u1"), null);
  assert.equal(secaoDaPagina({ pagina: "privacidade" }, "u1"), null);
});

test("contadorDaSecao soma os avisos de cada seção", () => {
  const avisos = { amigos: 2, mensagens: 3, cla: 1, missoes: 4 };
  assert.equal(contadorDaSecao("social", avisos), 6);
  assert.equal(contadorDaSecao("missoes", avisos), 4);
  assert.equal(contadorDaSecao("jogar", avisos), 0);
  assert.equal(contadorDaSecao("social", {}), 0);
});

const stop = (roomId, extra = {}) => ({ roomId, label: roomId, difficulty: "mid", onlineCount: 0, maxPlayers: 10, minLifetimePoints: 0, ...extra });

test("escolherSalaStop: a sala com mais gente", () => {
  const salas = [stop("a", { onlineCount: 2 }), stop("b", { onlineCount: 7 }), stop("c", { onlineCount: 3 })];
  assert.deepEqual(escolherSalaStop(salas), { sala: salas[1], motivo: "mais-gente" });
});

test("escolherSalaStop: pula sala lotada", () => {
  const salas = [stop("cheia", { onlineCount: 10, maxPlayers: 10 }), stop("ok", { onlineCount: 4 })];
  assert.equal(escolherSalaStop(salas).sala.roomId, "ok");
});

test("escolherSalaStop: sala sem maxPlayers não conta como lotada", () => {
  const salas = [stop("x", { onlineCount: 5, maxPlayers: undefined })];
  assert.equal(escolherSalaStop(salas).sala.roomId, "x");
});

test("escolherSalaStop: sala trancada só com pontos vitalícios suficientes", () => {
  const salas = [stop("vip", { onlineCount: 9, minLifetimePoints: 5000 }), stop("normal", { onlineCount: 1 })];
  assert.equal(escolherSalaStop(salas, { pontosVitalicios: 100 }).sala.roomId, "normal");
  assert.equal(escolherSalaStop(salas, { pontosVitalicios: 5000 }).sala.roomId, "vip");
});

test("escolherSalaStop: pula sala sem pontuação", () => {
  const salas = [stop("zoeira", { onlineCount: 8, semPontuacao: true }), stop("valendo", { onlineCount: 1 })];
  assert.equal(escolherSalaStop(salas).sala.roomId, "valendo");
});

test("escolherSalaStop: ninguém jogando → última sala lembrada", () => {
  const salas = [stop("a", { difficulty: "basic" }), stop("b")];
  assert.deepEqual(escolherSalaStop(salas, { ultimaSala: "b" }), { sala: salas[1], motivo: "ultima" });
});

test("escolherSalaStop: ninguém jogando e sem lembrança → Iniciante", () => {
  const salas = [stop("dificil", { difficulty: "advanced" }), stop("ini", { difficulty: "basic" })];
  assert.deepEqual(escolherSalaStop(salas, { ultimaSala: "sumiu" }), { sala: salas[1], motivo: "inicial" });
});

test("escolherSalaStop: lista vazia ou ainda carregando → null", () => {
  assert.equal(escolherSalaStop([]), null);
  assert.equal(escolherSalaStop(null), null);
  assert.equal(escolherSalaStop([stop("cheia", { onlineCount: 10 })]), null);
});

const quiz = (roomId, extra = {}) => ({ roomId, label: roomId, tier: "padrao", onlineCount: 0, ...extra });

test("escolherSalaQuiz: a última sala lembrada vem primeiro", () => {
  const salas = [quiz("futebol", { onlineCount: 9 }), quiz("anime")];
  assert.deepEqual(escolherSalaQuiz(salas, { ultimaSala: "anime" }), { sala: salas[1], motivo: "ultima" });
});

test("escolherSalaQuiz: sem lembrança → mais gente no nível escolhido", () => {
  const salas = [quiz("a", { onlineCount: 9, tier: "avancado" }), quiz("b", { onlineCount: 2 }), quiz("c", { onlineCount: 5 })];
  assert.equal(escolherSalaQuiz(salas, { nivel: "padrao" }).sala.roomId, "c");
  assert.equal(escolherSalaQuiz(salas, { nivel: "avancado" }).sala.roomId, "a");
});

test("escolherSalaQuiz: ignora arenas; sala sem nível vale nos dois", () => {
  const salas = [quiz("arena", { arena: true, onlineCount: 20 }), quiz("direito", { tier: null })];
  assert.deepEqual(escolherSalaQuiz(salas, { nivel: "avancado" }), { sala: salas[1], motivo: "primeira" });
  assert.equal(escolherSalaQuiz(salas, { ultimaSala: "arena" }).sala.roomId, "direito");
});

test("escolherSalaQuiz: pula a última sala se estiver lotada", () => {
  const salas = [quiz("cheia", { onlineCount: 15, maxPlayers: 15 }), quiz("outra", { onlineCount: 2, maxPlayers: 15 })];
  assert.deepEqual(escolherSalaQuiz(salas, { ultimaSala: "cheia" }), { sala: salas[1], motivo: "mais-gente" });
});

test("escolherSalaQuiz: a sala com mais gente lotada não é escolhida", () => {
  const salas = [quiz("lotada", { onlineCount: 15, maxPlayers: 15 }), quiz("vaga", { onlineCount: 6, maxPlayers: 15 })];
  assert.equal(escolherSalaQuiz(salas).sala.roomId, "vaga");
  assert.equal(escolherSalaQuiz([quiz("lotada", { onlineCount: 15, maxPlayers: 15 })]), null);
});

test("escolherSalaQuiz: lista vazia → null", () => {
  assert.equal(escolherSalaQuiz([]), null);
  assert.equal(escolherSalaQuiz(null), null);
});

test("memória: guarda e lê o último jogo e a última sala de cada jogo", () => {
  const s = storageFalso();
  lembrarSala(s, { jogo: "stop", sala: "s1", nome: "Iniciante" }, 1000);
  lembrarSala(s, { jogo: "quiz", sala: "q9", nome: "Futebol" }, 2000);
  assert.deepEqual(ultimoJogo(s), { jogo: "quiz", sala: "q9", nome: "Futebol", quando: 2000 });
  assert.equal(ultimaSalaDo(s, "stop"), "s1");
  assert.equal(ultimaSalaDo(s, "quiz"), "q9");
  assert.equal(ultimaSalaDo(s, "acromania"), null);
});

test("memória: sem nome mantém o nome da mesma sala, e zera ao trocar de sala", () => {
  const s = storageFalso();
  lembrarSala(s, { jogo: "stop", sala: "s1", nome: "Iniciante" }, 1);
  lembrarSala(s, { jogo: "stop", sala: "s1" }, 2);
  assert.equal(ultimoJogo(s).nome, "Iniciante");
  lembrarSala(s, { jogo: "stop", sala: "s2" }, 3);
  assert.equal(ultimoJogo(s).nome, null);
});

test("memória: ignora jogo desconhecido e sala vazia", () => {
  const s = storageFalso();
  lembrarSala(s, { jogo: "tribunal", sala: "x" });
  lembrarSala(s, { jogo: "stop", sala: "" });
  assert.equal(ultimoJogo(s), null);
});

test("memória: sala privada não entra (não aparece nas listas públicas)", () => {
  const s = storageFalso();
  lembrarSala(s, { jogo: "stop", sala: "s1", nome: "Iniciante" }, 1);
  lembrarSala(s, { jogo: "stop", sala: "stop-privada-ab12cd34" }, 2);
  lembrarSala(s, { jogo: "acromania", sala: "acromania-privada-99aa88bb" }, 3);
  assert.deepEqual(ultimoJogo(s), { jogo: "stop", sala: "s1", nome: "Iniciante", quando: 1 });
  assert.equal(ultimaSalaDo(s, "stop"), "s1");
  assert.equal(ultimaSalaDo(s, "acromania"), null);
});

test("memória: JSON corrompido, storage nulo ou que lança erro não quebram", () => {
  assert.equal(ultimoJogo(storageFalso({ eg_v2_ultimo_jogo: "{quebrado" })), null);
  assert.equal(ultimoJogo(storageFalso({ eg_v2_ultimo_jogo: "42" })), null);
  assert.equal(ultimoJogo(null), null);
  assert.equal(ultimaSalaDo(null, "stop"), null);
  assert.doesNotThrow(() => lembrarSala(null, { jogo: "stop", sala: "s1" }));
  const explode = { getItem: () => { throw new Error("bloqueado"); }, setItem: () => { throw new Error("cheio"); } };
  assert.equal(ultimoJogo(explode), null);
  assert.doesNotThrow(() => lembrarSala(explode, { jogo: "stop", sala: "s1" }));
});

test("linkDaSala usa o parâmetro de cada jogo", () => {
  assert.equal(linkDaSala("quiz", "q1"), "/v2/?sala=q1");
  assert.equal(linkDaSala("stop", "s 1"), "/v2/?stop=s+1");
  assert.equal(linkDaSala("acromania", "a1"), "/v2/?acro=a1");
});
