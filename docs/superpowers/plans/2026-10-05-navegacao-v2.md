# Navegação da v2 em 5 seções — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar a navegação da v2 (9 itens no topo + "Mais" no celular) por 5 seções fixas — Jogar, Competir, Social, Missões, Eu — iguais no computador e no celular, com uma página de jogo que tem um caminho principal ("Jogar agora").

**Architecture:** As regras (qual seção cada endereço marca, qual sala o "Jogar agora" escolhe, a memória do último jogo) ficam num módulo puro `frontend/v2/navegacao.js`, testado com `node --test`. Uma `Moldura` (topo + main + rodapé) permite mostrar páginas existentes dentro de outras (`embutido`), e as páginas novas `Competir`, `Social` e `Eu` só agrupam páginas que já existem. Nenhum endereço novo, nenhuma mudança no backend.

**Tech Stack:** React 18 + Vite 5 (sem roteador: navegação por `?pagina=` em `v2/App.jsx`), CSS puro em `v2/v2.css`, Node 24 (`node --test`).

**Spec:** `docs/superpowers/specs/2026-10-05-navegacao-v2-design.md`

## Global Constraints

- Só `frontend/v2/` muda (mais `frontend/package.json` para o script de teste e `.claude/launch.json`). O site clássico (`frontend/src/`) e o backend não mudam.
- Visual mantido: usar só as variáveis existentes do `v2.css` (`--roxo`, `--roxo-2`, `--roxo-escuro`, `--roxo-fundo`, `--lilas`, `--lilas-2`, `--amarelo`, `--titulo` etc.). Nenhuma cor ou fonte nova.
- Layout das salas de jogo (`Sala.jsx`, `SalaStop.jsx`, `SalaAcro.jsx`, `Tribunal.jsx`, `Mentira.jsx`, `Impostor*`, `MultiSala.jsx`) não muda.
- Nenhum endereço novo: Competir abre `?pagina=ranking`, Social abre `?pagina=amigos`, Eu abre `?pagina=jogador&id=<eu>`. Todos os `?pagina=`, `?sala=`, `?stop=`, `?acro=`, `?mesa=`, `&privada=` antigos continuam abrindo o mesmo conteúdo.
- Breakpoints existentes: 700px e 1000px.
- Textos da interface em português do Brasil, no tom do site (informal, "pra", "a galera").
- Comentários no código em português, no estilo do arquivo (explicam o porquê).
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Desvios conscientes da spec (decididos ao ler o código)

- "Entrar com código" não existe no site (sala privada se entra pela lista ou por link). "Outras formas de jogar" fica com **Criar sala privada** e **Várias salas ao mesmo tempo**.
- O "N jogando agora" do jogo continua onde já está (na linha de filtros, logo acima das salas), em vez de subir para o cabeçalho.

## Review Focus

1. **Sala lotada ou trancada no Jogar agora** — o Stop tem salas com `maxPlayers` e `minLifetimePoints`; o botão nunca pode mandar a pessoa para uma sala cheia ou que ela não pode entrar. (Testes na Tarefa 1.)
2. **`localStorage` indisponível ou corrompido** (aba anônima, JSON quebrado, `setItem` que lança erro) — Continuar some e Jogar agora segue funcionando, sem tela de erro. (Testes na Tarefa 1.)
3. **Sala lembrada que não existe mais** — Continuar leva à página do jogo, não a uma sala inexistente; Jogar agora ignora a sala lembrada. (Testes na Tarefa 1; conferência na Tarefa 6.)
4. **Perfil próprio × perfil de outra pessoa** — `?pagina=jogador` sem `id` ou com o próprio id abre Eu; com outro id abre o Perfil público com Social marcado. Os ids são strings (`cuid`). (Testes na Tarefa 1.)
5. **Amigos com conversa aberta no celular dentro de Social** — a classe `v2-mensageiro com-conversa` precisa continuar valendo quando a página está embutida (a `Moldura` preserva `classeMain`). (Conferência no navegador nas Tarefas 3 e 8.)

---

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `frontend/v2/navegacao.js` (novo) | Regras puras: `SECOES`, `secaoDaPagina`, `contadorDaSecao`, `escolherSalaStop`, `escolherSalaQuiz`, memória do último jogo, `linkDaSala`, `ROTA_SALAS` |
| `frontend/v2/navegacao.test.js` (novo) | Testes `node --test` do módulo acima |
| `frontend/v2/BuscaJogador.jsx` (novo) | Busca de jogador por nick, em botão (topo) ou campo fixo (Social) |
| `frontend/v2/Topo.jsx` | Topo e barra do celular com as 5 seções |
| `frontend/v2/Moldura.jsx` (novo) | Topo + `<main>` + rodapé, ou só o conteúdo quando `embutido` |
| `frontend/v2/Abas.jsx` (novo) | Abas-link usadas por Competir e Social |
| `frontend/v2/Competir.jsx` (novo) | Abas Ranking · Hall da Fama · Patentes |
| `frontend/v2/Social.jsx` (novo) | Abas Amigos · Clã + busca |
| `frontend/v2/PainelJogador.jsx` (novo) | Resumo do jogador (sai do Início) |
| `frontend/v2/Eu.jsx` (novo) | Resumo + atalhos da conta + perfil próprio |
| `frontend/v2/App.jsx` | `lerLocal` exportado, rotas das seções, grava a última sala |
| `frontend/v2/Inicio.jsx` | Página Jogar: Continuar + jogos + Lenda + Praça |
| `frontend/v2/Lobby.jsx` | Página de jogo: Jogar agora, Escolha a sala, Outras formas, Salas dos jogadores, Top 3 |
| `frontend/v2/{Ranking,HallFama,Patentes,Amigos,Clas,Cla,Perfil}.jsx` | Usam a `Moldura`; aceitam `embutido` |
| `frontend/v2/v2.css` | Estilos das 5 seções, abas, Continuar, Jogar agora, Outras formas, Eu |

---

### Task 1: Regras da navegação (`navegacao.js`) com testes

**Files:**
- Create: `frontend/v2/navegacao.js`
- Create: `frontend/v2/navegacao.test.js`
- Modify: `frontend/package.json` (script `test`)

**Interfaces:**
- Consumes: nada.
- Produces (usado nas Tarefas 2–7):
  - `SECOES: Array<{ chave: "jogar"|"competir"|"social"|"missoes"|"eu", rotulo: string }>`
  - `secaoDaPagina(local: { pagina?: string|null, id?: string|null }, usuarioId: string): "jogar"|"competir"|"social"|"missoes"|"eu"|null`
  - `contadorDaSecao(chave: string, avisos: { amigos?, mensagens?, cla?, missoes? }): number`
  - `escolherSalaStop(salas: Array|null, opcoes?: { ultimaSala?: string|null, pontosVitalicios?: number }): { sala, motivo: "mais-gente"|"ultima"|"inicial" } | null`
  - `escolherSalaQuiz(salas: Array|null, opcoes?: { ultimaSala?: string|null, nivel?: string }): { sala, motivo: "ultima"|"mais-gente"|"primeira" } | null`
  - `armazenamento(): Storage|null`
  - `lembrarSala(storage: Storage|null, dados: { jogo: "stop"|"quiz"|"acromania", sala: string, nome?: string|null }, agora?: number): void`
  - `ultimoJogo(storage): { jogo, sala, nome, quando } | null`
  - `ultimaSalaDo(storage, jogo): string|null`
  - `linkDaSala(jogo, sala): string`
  - `ROTA_SALAS: { stop: "/rooms", quiz: "/quiz-rooms", acromania: "/acromania-rooms" }`
  - `NOMES_JOGOS: { stop, quiz, acromania, mentira, tribunal, impostor }`

- [ ] **Step 1: Escrever os testes (vão falhar)**

Criar `frontend/v2/navegacao.test.js`:

```js
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
```

- [ ] **Step 2: Rodar e ver falhar**

Em `frontend/package.json`, no bloco `"scripts"`, adicionar depois de `"preview": "vite preview"`:

```json
    "preview": "vite preview",
    "test": "node --test \"v2/**/*.test.js\""
```

Run: `cd frontend && npm test`
Expected: FAIL — `Cannot find module '.../v2/navegacao.js'`.

- [ ] **Step 3: Implementar `navegacao.js`**

Criar `frontend/v2/navegacao.js`:

```js
// Regras da navegação da v2 em 5 seções (spec:
// docs/superpowers/specs/2026-10-05-navegacao-v2-design.md). Tudo aqui é
// puro — sem React e sem `window` (menos `armazenamento`) — pra poder ser
// testado com `node --test` (navegacao.test.js).

export const SECOES = [
  { chave: "jogar", rotulo: "Jogar" },
  { chave: "competir", rotulo: "Competir" },
  { chave: "social", rotulo: "Social" },
  { chave: "missoes", rotulo: "Missões" },
  { chave: "eu", rotulo: "Eu" },
];

export const NOMES_JOGOS = { stop: "Stop", quiz: "Quiz", acromania: "Acromania", mentira: "Mentira Sincera", tribunal: "O Tribunal", impostor: "O Impostor" };

// Páginas (?pagina=) de cada seção. O que não está aqui é Jogar (início,
// lobbies, várias salas, privadas, Tribunal, Impostor, Mentira e qualquer
// endereço desconhecido, que abre o Início).
const PAGINAS_DA_SECAO = {
  competir: ["ranking", "hall", "patentes"],
  social: ["amigos", "clas", "cla"],
  missoes: ["missoes"],
  eu: ["editar-perfil", "novidades", "admin"],
};
const SEM_SECAO = ["termos", "privacidade"];

// Qual seção fica marcada no menu. `jogador` sem id (ou com o meu id) é o
// meu perfil (Eu); com o id de outra pessoa é Social.
export function secaoDaPagina(local, usuarioId) {
  const pagina = local?.pagina || null;
  if (pagina === "jogador") return !local.id || String(local.id) === String(usuarioId) ? "eu" : "social";
  if (SEM_SECAO.includes(pagina)) return null;
  for (const [secao, paginas] of Object.entries(PAGINAS_DA_SECAO)) if (paginas.includes(pagina)) return secao;
  return "jogar";
}

// Bolinha de avisos de cada seção (rota /avisos).
export function contadorDaSecao(chave, avisos = {}) {
  if (chave === "social") return (avisos.amigos || 0) + (avisos.mensagens || 0) + (avisos.cla || 0);
  if (chave === "missoes") return avisos.missoes || 0;
  return 0;
}

// A sala com mais gente (onlineCount > 0); empate fica com a primeira.
function maisGente(salas) {
  let melhor = null;
  for (const s of salas) if ((s.onlineCount || 0) > 0 && (!melhor || s.onlineCount > melhor.onlineCount)) melhor = s;
  return melhor;
}

const lotada = (s) => Boolean(s.maxPlayers) && (s.onlineCount || 0) >= s.maxPlayers;

// "Jogar agora" do Stop: só salas que valem pontos, com vaga e liberadas pros
// pontos vitalícios da pessoa. Prefere onde tem gente; se ninguém está
// jogando, a última sala dela; senão, a Iniciante.
export function escolherSalaStop(salas, { ultimaSala = null, pontosVitalicios = 0 } = {}) {
  const livres = (salas || []).filter((s) => !s.semPontuacao && !lotada(s) && (s.minLifetimePoints || 0) <= pontosVitalicios);
  const cheia = maisGente(livres);
  if (cheia) return { sala: cheia, motivo: "mais-gente" };
  const ultima = ultimaSala ? livres.find((s) => String(s.roomId) === String(ultimaSala)) : null;
  if (ultima) return { sala: ultima, motivo: "ultima" };
  const inicial = livres.find((s) => s.difficulty === "basic") || livres[0];
  return inicial ? { sala: inicial, motivo: "inicial" } : null;
}

// "Jogar agora" do Quiz: o tema importa mais que a lotação, então a última
// sala vem primeiro. Arenas ficam de fora (são um modo à parte). Sala sem
// nível (ex.: Direito) vale nos dois níveis, igual ao filtro da página.
export function escolherSalaQuiz(salas, { ultimaSala = null, nivel = "padrao" } = {}) {
  const normais = (salas || []).filter((s) => !s.arena);
  const ultima = ultimaSala ? normais.find((s) => String(s.roomId) === String(ultimaSala)) : null;
  if (ultima) return { sala: ultima, motivo: "ultima" };
  const doNivel = normais.filter((s) => !s.tier || s.tier === nivel);
  const cheia = maisGente(doNivel);
  if (cheia) return { sala: cheia, motivo: "mais-gente" };
  return doNivel[0] ? { sala: doNivel[0], motivo: "primeira" } : null;
}

// ---------- Memória do último jogo (Continuar e Jogar agora) ----------
// Uma chave só no localStorage: { ultimo: {jogo, sala, nome, quando},
// porJogo: { stop: {sala, nome}, ... } }. Aba anônima, armazenamento
// bloqueado ou JSON quebrado = sem memória, nunca erro.
const CHAVE = "eg_v2_ultimo_jogo";
const JOGOS_COM_SALA = ["stop", "quiz", "acromania"];
const PARAM_DA_SALA = { quiz: "sala", stop: "stop", acromania: "acro" };
export const ROTA_SALAS = { stop: "/rooms", quiz: "/quiz-rooms", acromania: "/acromania-rooms" };

export function armazenamento() {
  try { return typeof window !== "undefined" ? window.localStorage : null; } catch { return null; }
}

function lerMemoria(storage) {
  const vazia = { ultimo: null, porJogo: {} };
  if (!storage) return vazia;
  try {
    const v = JSON.parse(storage.getItem(CHAVE) || "null");
    return v && typeof v === "object" && v.porJogo && typeof v.porJogo === "object" ? v : vazia;
  } catch {
    return vazia;
  }
}

export function lembrarSala(storage, { jogo, sala, nome = null }, agora = Date.now()) {
  if (!storage || !JOGOS_COM_SALA.includes(jogo) || !sala) return;
  try {
    const m = lerMemoria(storage);
    const antes = m.porJogo[jogo];
    const id = String(sala);
    const nomeFinal = nome || (antes && antes.sala === id ? antes.nome : null);
    m.porJogo[jogo] = { sala: id, nome: nomeFinal };
    m.ultimo = { jogo, sala: id, nome: nomeFinal, quando: agora };
    storage.setItem(CHAVE, JSON.stringify(m));
  } catch {
    // armazenamento cheio ou bloqueado: segue sem memória
  }
}

export const ultimoJogo = (storage) => lerMemoria(storage).ultimo || null;
export const ultimaSalaDo = (storage, jogo) => lerMemoria(storage).porJogo[jogo]?.sala || null;

export function linkDaSala(jogo, sala) {
  return `/v2/?${new URLSearchParams({ [PARAM_DA_SALA[jogo]]: sala })}`;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd frontend && npm test`
Expected: PASS — todos os testes `ok`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add frontend/v2/navegacao.js frontend/v2/navegacao.test.js frontend/package.json
git commit -m "v2: regras da navegação em 5 seções (seção ativa, Jogar agora, último jogo) com testes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Topo com as 5 seções (sem "Mais")

**Files:**
- Create: `frontend/v2/BuscaJogador.jsx`
- Create: `.claude/launch.json` (servidor de desenvolvimento pra conferir no navegador)
- Modify: `frontend/v2/Topo.jsx` (arquivo inteiro)
- Modify: `frontend/v2/App.jsx:38` (`lerLocal` exportado) e `:95` (tira `ativo`)
- Modify: todas as páginas que passam `ativo=` ao `<Topo>`: `Admin.jsx`, `Amigos.jsx`, `Cla.jsx`, `Clas.jsx`, `EditarPerfil.jsx`, `HallFama.jsx`, `Impostor.jsx`, `Inicio.jsx`, `Lobby.jsx`, `Mentira.jsx`, `Missoes.jsx`, `Novidades.jsx`, `Patentes.jsx`, `Perfil.jsx`, `Ranking.jsx`, `SalasPrivadas.jsx`
- Modify: `frontend/v2/v2.css`

**Interfaces:**
- Consumes: `SECOES`, `secaoDaPagina`, `contadorDaSecao` (Tarefa 1).
- Produces: `export function lerLocal()` em `App.jsx`; `Topo({ usuario })` (sem `ativo`); `export default function BuscaJogador({ fixa = false })` em `BuscaJogador.jsx`.

- [ ] **Step 1: Configurar o servidor de desenvolvimento**

Criar `.claude/launch.json`:

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "v2-frontend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["--prefix", "frontend", "run", "dev"],
      "port": 5173
    }
  ]
}
```

Sem o backend rodando as chamadas de API falham, e as páginas mostram estados vazios. Isso basta para conferir a navegação. Para entrar sem login, abrir `http://localhost:5173/v2/` e rodar no console da página:

```js
localStorage.setItem("eg_token", "teste"); localStorage.setItem("eg_user", JSON.stringify({ id: "eu-teste", nickname: "Teste", role: "ADMIN" })); location.reload();
```

- [ ] **Step 2: Exportar `lerLocal`**

Em `frontend/v2/App.jsx`, trocar `function lerLocal() {` por `export function lerLocal() {`, e na linha 95 trocar `<Topo usuario={usuario} ativo={null} />` por `<Topo usuario={usuario} />`.

- [ ] **Step 3: Extrair a busca para `BuscaJogador.jsx`**

Criar `frontend/v2/BuscaJogador.jsx` (é a `BuscaJogador` de `Topo.jsx`, com o modo `fixa` para a página Social):

```jsx
import { useEffect, useRef, useState } from "react";
import { api } from "./api.js";
import { irParaPagina, linkDaPagina } from "./App.jsx";
import Avatar from "./Avatar.jsx";

// Busca de jogador por nick (mínimo 2 letras, até 12 resultados — mesma
// rota do clássico). No topo é uma lupa que abre a caixa; em Social
// (`fixa`) o campo fica sempre à mostra.
export default function BuscaJogador({ fixa = false }) {
  const [aberta, setAberta] = useState(fixa);
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState([]);
  const caixaRef = useRef(null);
  const campoRef = useRef(null);

  useEffect(() => {
    const t = texto.trim();
    if (t.length < 2) { setResultados([]); return; }
    let vivo = true;
    const espera = setTimeout(() => {
      api.get(`/users/buscar?q=${encodeURIComponent(t)}`)
        .then(({ data }) => vivo && setResultados(Array.isArray(data) ? data : []))
        .catch(() => vivo && setResultados([]));
    }, 250);
    return () => { vivo = false; clearTimeout(espera); };
  }, [texto]);

  useEffect(() => {
    if (!aberta || fixa) return;
    const fora = (e) => caixaRef.current && !caixaRef.current.contains(e.target) && setAberta(false);
    document.addEventListener("mousedown", fora);
    requestAnimationFrame(() => campoRef.current?.focus());
    return () => document.removeEventListener("mousedown", fora);
  }, [aberta, fixa]);

  const idCampo = fixa ? "v2-busca-campo-fixa" : "v2-busca-campo";
  return (
    <div className={fixa ? "v2-busca v2-busca-fixa" : "v2-busca"} ref={caixaRef}>
      {!fixa && (
        <button className="v2-sair" aria-label="Buscar jogador" title="Buscar jogador" onClick={() => setAberta((a) => !a)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        </button>
      )}
      {aberta && (
        <div className="v2-busca-caixa">
          <label htmlFor={idCampo} className="v2-oculto">Nick do jogador</label>
          <input id={idCampo} ref={campoRef} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar jogador pelo nick…" autoComplete="off" />
          {texto.trim().length >= 2 && resultados.length === 0 && <div className="v2-busca-vazio">Ninguém encontrado.</div>}
          {resultados.map((r) => (
            <a key={r.id} className="v2-busca-item" href={linkDaPagina("jogador", { id: r.id })} onClick={(e) => { e.preventDefault(); if (!fixa) setAberta(false); irParaPagina("jogador", { id: r.id }); }}>
              <Avatar userId={r.id} nickname={r.nickname} tamanho={30} />
              <span>{r.nickname}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Reescrever `Topo.jsx`**

Substituir o arquivo inteiro `frontend/v2/Topo.jsx` por:

```jsx
import DicaNova, { marcarDicaVista } from "./DicaNova.jsx";
import { useEffect, useState } from "react";
import { api, socketDoPortal } from "./api.js";
import { irParaPagina, lerLocal, linkDaPagina } from "./App.jsx";
import Avatar from "./Avatar.jsx";
import BuscaJogador from "./BuscaJogador.jsx";
import { ConviteRecebido } from "./Convites.jsx";
import { SECOES, contadorDaSecao, secaoDaPagina } from "./navegacao.js";

// Cabeçalho comum das páginas da v2 (menos as salas, que têm o seu).
// Também usa a conexão de "presença" (a do portal, em api.js, que não fecha
// ao trocar de página): sem ela a pessoa aparece OFFLINE pros amigos
// enquanto navega, e não recebe convite de sala.
// Navegação em 5 seções, as MESMAS no topo do computador e na barra de baixo
// do celular (sem "Mais"). A seção marcada sai do endereço (secaoDaPagina),
// não de quem chama o Topo. No computador, "Eu" é o avatar no canto.

const PAGINA_DA_SECAO = { competir: "ranking", social: "amigos", missoes: "missoes" };
const hrefDaSecao = (chave, usuario) =>
  chave === "jogar" ? "/v2/" : chave === "eu" ? linkDaPagina("jogador", { id: usuario.id }) : linkDaPagina(PAGINA_DA_SECAO[chave]);
const irSecao = (e, chave, usuario) => {
  e.preventDefault();
  if (chave === "jogar") irParaPagina(null);
  else if (chave === "eu") { marcarDicaVista("perfil"); irParaPagina("jogador", { id: usuario.id }); }
  else irParaPagina(PAGINA_DA_SECAO[chave]);
};

export default function Topo({ usuario }) {
  const [socket, setSocket] = useState(null);
  const [avisos, setAvisos] = useState({});

  // Só pega a conexão do portal; o ouvinte do convite (ConviteRecebido) se
  // desliga sozinho ao desmontar. Não desconecta: a conexão é da aba.
  useEffect(() => {
    setSocket(socketDoPortal());
  }, []);

  // Contadores (mesma rota e mesmo ritmo do clássico): pedidos de amizade +
  // mensagens + pedidos do clã em Social, missões pra resgatar em Missões.
  useEffect(() => {
    let vivo = true;
    const buscar = () => {
      if (document.hidden) return;
      api.get("/avisos").then(({ data }) => vivo && setAvisos(data || {})).catch(() => {});
    };
    buscar();
    const t = setInterval(buscar, 120000);
    window.addEventListener("v2-mensagens-lidas", buscar);
    return () => { vivo = false; clearInterval(t); window.removeEventListener("v2-mensagens-lidas", buscar); };
  }, []);

  const secao = secaoDaPagina(lerLocal(), usuario.id);
  const marca = (chave) => ({ className: secao === chave ? "ativo" : "", "aria-current": secao === chave ? "page" : undefined });

  return (
    <>
      <header className="v2-topo">
        <a className="v2-logo" href="/v2/" onClick={(e) => irSecao(e, "jogar", usuario)}>
          <img src="/educacao-gamer-logo.png" alt="Educação Gamer" className="v2-logo-img" />
          <span className="v2-selo-beta">beta</span>
        </a>
        <nav className="v2-menu" aria-label="Site">
          {SECOES.filter((s) => s.chave !== "eu").map((s) => {
            const n = contadorDaSecao(s.chave, avisos);
            return (
              <a key={s.chave} href={hrefDaSecao(s.chave, usuario)} {...marca(s.chave)} onClick={(e) => irSecao(e, s.chave, usuario)}>
                {s.rotulo}
                {n > 0 && <span className="v2-bolinha-contador">{n}</span>}
              </a>
            );
          })}
        </nav>
        <div className="v2-topo-dir">
          <BuscaJogador />
          <a href={hrefDaSecao("eu", usuario)} onClick={(e) => irSecao(e, "eu", usuario)} className={`v2-topo-avatar ${secao === "eu" ? "ativo" : ""}`} aria-current={secao === "eu" ? "page" : undefined} title="Eu: perfil, avatar, novidades e conta">
            <Avatar userId={usuario.id} nickname={usuario.nickname} tamanho={44} borda />
            <span className="v2-topo-nick">{usuario.nickname}<small>eu</small></span>
            <DicaNova chave="perfil" texto="Aqui é você! Toque pra ver seu perfil, editar o avatar, ler as novidades e sair da conta." lado="baixo-direita" />
          </a>
        </div>
      </header>

      {/* Celular: as 5 seções na barra fixa embaixo, no dedão. */}
      <nav className="v2-menu-celular" aria-label="Menu">
        {SECOES.map((s) => {
          const n = contadorDaSecao(s.chave, avisos);
          return (
            <a key={s.chave} href={hrefDaSecao(s.chave, usuario)} {...marca(s.chave)} onClick={(e) => irSecao(e, s.chave, usuario)}>
              <span className="v2-menu-icone">
                {s.chave === "eu" ? <Avatar userId={usuario.id} nickname={usuario.nickname} tamanho={24} /> : <IconeSecao nome={s.chave} />}
                {n > 0 && <span className="v2-bolinha-contador">{n}</span>}
              </span>
              {s.rotulo}
            </a>
          );
        })}
      </nav>
      <ConviteRecebido socket={socket} />
    </>
  );
}

function IconeSecao({ nome }) {
  const p = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" };
  if (nome === "competir") return <svg {...p}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM17 6h3v2a3 3 0 01-3 3M7 6H4v2a3 3 0 003 3" /></svg>;
  if (nome === "social") return <svg {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0113 0M16 4.5a3.5 3.5 0 010 7M18 14a6 6 0 013.5 6" /></svg>;
  if (nome === "missoes") return <svg {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" /></svg>;
  return <svg {...p}><rect x="2" y="7" width="20" height="11" rx="5" /><path d="M7 11v3M5.5 12.5h3M15.5 12h.01M18 13.5h.01" /></svg>;
}
```

- [ ] **Step 5: Tirar a prop `ativo` de todas as páginas**

Run (de `frontend/v2/`, só nas linhas com `<Topo`):

```bash
cd frontend/v2 && sed -i -E '/<Topo /{s/ ativo=\{[^}]*\}//; s/ ativo="[^"]*"//}' *.jsx
grep -n "<Topo" *.jsx
```

Expected: todas as linhas impressas ficam `<Topo usuario={usuario} />` (sem `ativo`).

- [ ] **Step 6: CSS do menu de 5 seções**

Em `frontend/v2/v2.css`:

1. Apagar o bloco do "Mais" (as 7 linhas que começam em `/* Barra de baixo: botão "Mais" e a folha com as outras páginas. */` e vão até `.v2-mais button { color: #a3362c; }`).
2. Apagar a linha `.v2-mais a { justify-content: space-between; }`.
3. Apagar a linha `.v2-mais button.v2-mais-classico { color: var(--roxo); }`.
4. Trocar este trecho:

```css
/* O menu tem até 10 itens: ele só cabe inteiro a partir de ~1180px. Abaixo
   disso vale a barra de baixo (com "Mais"), também no notebook pequeno. */
.v2-menu a { white-space: nowrap; }
@media (min-width: 1000px) {
  .v2-topo-nick { display: flex; }
}
@media (min-width: 1000px) and (max-width: 1179px) {
  .v2-menu { display: none !important; }
  .v2-menu-celular { display: flex !important; }
  .v2-com-menu { padding-bottom: 84px !important; }
}
```

por:

```css
/* O menu tem 4 seções + o avatar (Eu): cabe inteiro a partir de 1000px.
   Abaixo disso vale a barra de baixo, com as mesmas 5 seções. */
.v2-menu a { white-space: nowrap; }
@media (min-width: 1000px) {
  .v2-topo-nick { display: flex; }
}
```

5. No fim do arquivo, adicionar:

```css
/* ---------- Navegação em 5 seções (2026-10) ---------- */
.v2-menu a { font-family: var(--titulo); font-weight: 600; font-size: 17px; padding: 0 16px; }
.v2-topo-avatar { align-items: center; gap: 8px; padding: 3px 12px 3px 3px; border-radius: 999px; }
.v2-topo-avatar:hover, .v2-topo-avatar.ativo { background: var(--roxo-2); }
.v2-topo-avatar.ativo .v2-topo-nick { color: var(--amarelo); }
.v2-menu-celular a { min-width: 0; }
.v2-menu-celular a.ativo .v2-menu-icone > :first-child:not(svg) { box-shadow: 0 0 0 2px var(--amarelo); border-radius: 50%; }
/* No celular o "Eu" já está na barra de baixo. */
@media (max-width: 999px) { .v2-topo .v2-topo-avatar { display: none; } }
```

- [ ] **Step 7: Build e conferência no navegador**

Run: `cd frontend && npm test && npm run build`
Expected: testes passam; build termina com `✓ built in` e sem erro.

Abrir o preview `v2-frontend` (sessão de teste do Step 1) e conferir:
- Em 1280px: topo com Jogar · Competir · Social · Missões e, à direita, a lupa e o avatar "Teste / eu". Sem "Versão clássica" e sem botão Sair no topo.
- `/v2/` marca Jogar; `?pagina=ranking` marca Competir; `?pagina=amigos` marca Social; `?pagina=missoes` marca Missões; `?pagina=jogador&id=eu-teste` marca o avatar.
- Em 375px e em 1100px: barra de baixo com 5 itens (o último é o avatar), sem "Mais"; o avatar some do topo e a lupa continua.

- [ ] **Step 8: Commit**

```bash
git add .claude/launch.json frontend/v2/BuscaJogador.jsx frontend/v2/Topo.jsx frontend/v2/App.jsx frontend/v2/*.jsx frontend/v2/v2.css
git commit -m "v2: topo e barra do celular com as 5 seções (Jogar, Competir, Social, Missões, Eu), sem Mais

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: `Moldura` e páginas que podem ser embutidas

**Files:**
- Create: `frontend/v2/Moldura.jsx`
- Modify: `frontend/v2/Ranking.jsx`, `HallFama.jsx`, `Patentes.jsx`, `Amigos.jsx`, `Clas.jsx`, `Cla.jsx`, `Perfil.jsx`
- Modify: `frontend/v2/v2.css`

**Interfaces:**
- Consumes: `Topo({ usuario })` (Tarefa 2).
- Produces: `Moldura({ usuario, embutido = false, classeMain = "v2-pagina", children })`; as 7 páginas aceitam a prop `embutido` (padrão `false`).

- [ ] **Step 1: Criar `Moldura.jsx`**

```jsx
import Topo from "./Topo.jsx";
import Rodape from "./Rodape.jsx";

// Moldura comum das páginas da v2: topo + <main> + rodapé. Com `embutido`
// (página mostrada dentro de outra, como as abas de Competir e Social), só o
// conteúdo — quem embute já desenhou o topo e o rodapé. A classe do <main>
// continua no invólucro do conteúdo (o layout do mensageiro depende dela).
export default function Moldura({ usuario, embutido = false, classeMain = "v2-pagina", children }) {
  if (embutido) return <div className={`v2-embutido ${classeMain}`}>{children}</div>;
  return (
    <div className="v2-app v2-com-menu">
      <Topo usuario={usuario} />
      <main className={classeMain}>{children}</main>
      <Rodape />
    </div>
  );
}
```

- [ ] **Step 2: Usar a `Moldura` nas 7 páginas**

Em cada arquivo abaixo:
1. Trocar `import Topo from "./Topo.jsx";` por `import Moldura from "./Moldura.jsx";` e apagar `import Rodape from "./Rodape.jsx";`.
2. Acrescentar `embutido = false` aos parâmetros do componente principal.
3. Trocar a abertura (3 linhas) e o fechamento (3 linhas) do `return` principal.

| Arquivo | Parâmetros novos |
|---|---|
| `Ranking.jsx` | `({ usuario, jogoInicial, embutido = false })` |
| `HallFama.jsx` | `({ usuario, embutido = false })` |
| `Patentes.jsx` | `({ usuario, jogoInicial, embutido = false })` |
| `Amigos.jsx` | `({ usuario, conversaInicial, embutido = false })` |
| `Clas.jsx` | `({ usuario, embutido = false })` |
| `Cla.jsx` | `({ usuario, claId, embutido = false })` |
| `Perfil.jsx` | `({ usuario, userId, embutido = false })` |

Abertura em `Ranking`, `HallFama`, `Patentes`, `Clas`, `Cla` e `Perfil`. Trocar

```jsx
    <div className="v2-app v2-com-menu">
      <Topo usuario={usuario} />
      <main className="v2-pagina">
```

por

```jsx
    <Moldura usuario={usuario} embutido={embutido}>
```

Abertura em `Amigos`. Trocar

```jsx
    <div className="v2-app v2-com-menu">
      <Topo usuario={usuario} />
      <main className={`v2-pagina v2-mensageiro ${aberta ? "com-conversa" : ""}`}>
```

por

```jsx
    <Moldura usuario={usuario} embutido={embutido} classeMain={`v2-pagina v2-mensageiro ${aberta ? "com-conversa" : ""}`}>
```

Fechamento, igual nas 7. Trocar

```jsx
      </main>
      <Rodape />
    </div>
```

por

```jsx
    </Moldura>
```

Conferir que nenhuma das 7 ainda cita `Topo` ou `Rodape`:

Run: `cd frontend/v2 && grep -n "Topo\|Rodape" Ranking.jsx HallFama.jsx Patentes.jsx Amigos.jsx Clas.jsx Cla.jsx Perfil.jsx`
Expected: nenhuma linha.

- [ ] **Step 3: CSS do conteúdo embutido**

No fim de `frontend/v2/v2.css`:

```css
/* Página dentro de outra (abas de Competir e Social, perfil em Eu): sem a
   margem e a largura máxima da página — quem embute já tem as suas. */
.v2-embutido.v2-pagina { max-width: none; margin: 0; padding: 0; }
```

- [ ] **Step 4: Build e conferência**

Run: `cd frontend && npm run build`
Expected: build sem erro.

No preview, conferir que `?pagina=ranking`, `?pagina=hall`, `?pagina=patentes&jogo=stop`, `?pagina=amigos`, `?pagina=clas`, `?pagina=jogador&id=eu-teste` e `?pagina=jogador&id=outra-pessoa` estão com a mesma cara de antes desta tarefa (topo, conteúdo e rodapé).

- [ ] **Step 5: Commit**

```bash
git add frontend/v2/Moldura.jsx frontend/v2/Ranking.jsx frontend/v2/HallFama.jsx frontend/v2/Patentes.jsx frontend/v2/Amigos.jsx frontend/v2/Clas.jsx frontend/v2/Cla.jsx frontend/v2/Perfil.jsx frontend/v2/v2.css
git commit -m "v2: Moldura (topo + main + rodapé) e páginas que podem ser embutidas em outras

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Páginas Competir e Social

**Files:**
- Create: `frontend/v2/Abas.jsx`, `frontend/v2/Competir.jsx`, `frontend/v2/Social.jsx`
- Modify: `frontend/v2/App.jsx` (imports e `switch` de `Pagina`)
- Modify: `frontend/v2/v2.css`

**Interfaces:**
- Consumes: `Moldura` e `embutido` (Tarefa 3); `BuscaJogador({ fixa })` (Tarefa 2); `irParaPagina`, `linkDaPagina` (`App.jsx`).
- Produces: `Abas({ abas: Array<{ chave, rotulo, href, aoClicar }>, ativa, rotulo })`; `Competir({ usuario, aba: "ranking"|"hall"|"patentes", jogo })`; `Social({ usuario, pagina: "amigos"|"clas"|"cla", id })`.

- [ ] **Step 1: Criar `Abas.jsx`**

```jsx
// Abas de página (Competir, Social). Cada aba é um link de verdade
// (?pagina=…): abre em nova aba, e o "voltar" do navegador funciona.
export default function Abas({ abas, ativa, rotulo }) {
  return (
    <nav className="v2-abas" aria-label={rotulo}>
      {abas.map((a) => (
        <a key={a.chave} href={a.href} onClick={a.aoClicar} className={a.chave === ativa ? "ativa" : ""} aria-current={a.chave === ativa ? "page" : undefined}>
          {a.rotulo}
        </a>
      ))}
    </nav>
  );
}

// Monta uma aba que leva a ?pagina=<pagina> (com os parâmetros extras).
export function abaDaPagina(chave, rotulo, pagina, extra, irParaPagina, linkDaPagina) {
  return { chave, rotulo, href: linkDaPagina(pagina, extra), aoClicar: (e) => { e.preventDefault(); irParaPagina(pagina, extra); } };
}
```

- [ ] **Step 2: Criar `Competir.jsx`**

```jsx
import { lazy } from "react";
import { irParaPagina, linkDaPagina } from "./App.jsx";
import Moldura from "./Moldura.jsx";
import Abas, { abaDaPagina } from "./Abas.jsx";
import Ranking from "./Ranking.jsx";
import Patentes from "./Patentes.jsx";

// Hall da Fama é pesado e pouco visitado: continua carregando sob demanda.
const HallFama = lazy(() => import("./HallFama.jsx"));

// COMPETIR — Ranking, Hall da Fama e Patentes numa seção só. A aba é o
// próprio ?pagina= (ranking | hall | patentes): links antigos continuam
// valendo. O jogo= acompanha a troca de aba.
export default function Competir({ usuario, aba, jogo }) {
  const extra = jogo ? { jogo } : {};
  const abas = [
    abaDaPagina("ranking", "Ranking", "ranking", extra, irParaPagina, linkDaPagina),
    abaDaPagina("hall", "Hall da Fama", "hall", extra, irParaPagina, linkDaPagina),
    abaDaPagina("patentes", "Patentes", "patentes", extra, irParaPagina, linkDaPagina),
  ];
  return (
    <Moldura usuario={usuario}>
      <Abas abas={abas} ativa={aba} rotulo="Competir" />
      {aba === "hall" ? <HallFama usuario={usuario} embutido />
        : aba === "patentes" ? <Patentes key={jogo || "q"} usuario={usuario} jogoInicial={jogo} embutido />
        : <Ranking usuario={usuario} jogoInicial={jogo} embutido />}
    </Moldura>
  );
}
```

- [ ] **Step 3: Criar `Social.jsx`**

```jsx
import { lazy } from "react";
import { irParaPagina, linkDaPagina } from "./App.jsx";
import Moldura from "./Moldura.jsx";
import Abas, { abaDaPagina } from "./Abas.jsx";
import BuscaJogador from "./BuscaJogador.jsx";
import Amigos from "./Amigos.jsx";
import Cla from "./Cla.jsx";

const Clas = lazy(() => import("./Clas.jsx"));

// SOCIAL — Amigos (conversas e pedidos) e Clã, mais a busca de jogador.
// amigos[&id=] → Amigos (com a conversa aberta); clas → lista de clãs;
// cla&id= → o clã. As duas últimas marcam a aba Clã.
export default function Social({ usuario, pagina, id }) {
  const abas = [
    abaDaPagina("amigos", "Amigos", "amigos", {}, irParaPagina, linkDaPagina),
    abaDaPagina("cla", "Clã", "clas", {}, irParaPagina, linkDaPagina),
  ];
  return (
    <Moldura usuario={usuario}>
      <div className="v2-social-topo">
        <Abas abas={abas} ativa={pagina === "amigos" ? "amigos" : "cla"} rotulo="Social" />
        <BuscaJogador fixa />
      </div>
      {pagina === "amigos" ? <Amigos usuario={usuario} conversaInicial={id} embutido />
        : pagina === "cla" ? <Cla key={id} usuario={usuario} claId={id} embutido />
        : <Clas usuario={usuario} embutido />}
    </Moldura>
  );
}
```

- [ ] **Step 4: Ligar as rotas no `App.jsx`**

Em `frontend/v2/App.jsx`:

Imports: apagar `import Ranking from "./Ranking.jsx";`, `import Patentes from "./Patentes.jsx";`, `import Amigos from "./Amigos.jsx";`, `import Cla from "./Cla.jsx";` e as linhas `const HallFama = lazy(...)` e `const Clas = lazy(...)`. Adicionar:

```js
import Competir from "./Competir.jsx";
import Social from "./Social.jsx";
```

No `switch (local.pagina)` de `Pagina`, trocar as linhas de `"ranking"`, `"patentes"`, `"amigos"`, `"clas"`, `"cla"` e `"hall"` por:

```jsx
    // Competir e Social: a aba é o próprio ?pagina= (links antigos valem).
    case "ranking":
    case "hall":
    case "patentes":
      return <Competir key={local.jogo || "-"} usuario={usuario} aba={local.pagina} jogo={local.jogo} />;
    case "amigos":
    case "clas":
    case "cla":
      return <Social usuario={usuario} pagina={local.pagina} id={local.id} />;
```

- [ ] **Step 5: CSS das abas e do topo de Social**

No fim de `frontend/v2/v2.css`:

```css
/* Abas de Competir e Social (mesmo desenho das abas do painel admin). */
.v2-abas { display: flex; gap: 6px; flex-wrap: wrap; background: var(--roxo-fundo); padding: 6px; border-radius: 18px; align-self: flex-start; max-width: 100%; }
.v2-abas a { display: flex; align-items: center; gap: 6px; height: 44px; padding: 0 18px; border-radius: 13px; color: var(--lilas); font-family: var(--titulo); font-weight: 600; font-size: 16px; white-space: nowrap; }
.v2-abas a:hover { color: #fff; }
.v2-abas a.ativa { background: var(--amarelo); color: var(--roxo); }
.v2-social-topo { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between; }
.v2-busca-fixa { flex: 1 1 260px; max-width: 420px; }
.v2-busca-fixa .v2-busca-caixa { position: static; width: 100%; box-shadow: none; }
@media (max-width: 699px) {
  .v2-abas { align-self: stretch; }
  .v2-abas a { flex: 1; justify-content: center; padding: 0 10px; }
}
```

- [ ] **Step 6: Build e conferência**

Run: `cd frontend && npm run build`
Expected: build sem erro.

No preview, em 1280px e em 375px:
- `?pagina=ranking&jogo=quiz` → Competir marcado, aba Ranking. Clicar em "Hall da Fama" → endereço `?pagina=hall&jogo=quiz`, aba Hall marcada; "Patentes" → `?pagina=patentes&jogo=quiz`. O botão voltar do navegador volta para a aba anterior.
- `?pagina=amigos` → Social, aba Amigos, campo de busca à mostra. `?pagina=clas` e `?pagina=cla&id=x` → aba Clã.
- A lupa do topo continua abrindo e fechando a caixa de busca.

- [ ] **Step 7: Commit**

```bash
git add frontend/v2/Abas.jsx frontend/v2/Competir.jsx frontend/v2/Social.jsx frontend/v2/App.jsx frontend/v2/v2.css
git commit -m "v2: seções Competir (Ranking, Hall da Fama, Patentes) e Social (Amigos, Clã, busca)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Seção Eu (e o resumo do jogador sai do Início)

**Files:**
- Create: `frontend/v2/PainelJogador.jsx`, `frontend/v2/Eu.jsx`
- Modify: `frontend/v2/Inicio.jsx` (tira o bloco de boas-vindas e o atalho admin)
- Modify: `frontend/v2/App.jsx` (rota `jogador`)
- Modify: `frontend/v2/v2.css`

**Interfaces:**
- Consumes: `Moldura`, `Perfil({ embutido })` (Tarefa 3); `NOMES_JOGOS` (Tarefa 1).
- Produces: `PainelJogador({ usuario })`; `Eu({ usuario })`.

- [ ] **Step 1: Criar `PainelJogador.jsx` movendo código do `Inicio.jsx`**

O conteúdo vem do `Inicio.jsx` atual, **sem reescrever a lógica**: os estados e efeitos `perfil`, `titulos` e `meuAvatar`, o cálculo de `candidatos`, `proximoTitulo`, `MAX_CARTOES`, `vagasJogos` e `mensal`, o JSX da `<section className="v2-cartao v2-boas-vindas">` inteira e a função `ProximaPeca`. Criar `frontend/v2/PainelJogador.jsx`:

```jsx
import { useEffect, useState } from "react";
import { api } from "./api.js";
import { irParaPagina, linkDaPagina } from "./App.jsx";
import AvatarBoneco, { MiniaturaPeca } from "./AvatarBoneco.jsx";
import AvisoPecaNova from "./AvisoPecaNova.jsx";
import { useCatalogoAvatar } from "./avatarCatalogo.js";
import { NOMES_JOGOS as NOMES } from "./navegacao.js";

// Resumo do jogador (antes no topo do Início, agora em Eu): avatar, patente
// do mês nos jogos em que mais pontuou, o próximo título e a próxima peça.
export default function PainelJogador({ usuario }) {
  const [perfil, setPerfil] = useState(null);
  const [titulos, setTitulos] = useState(null);
  const [meuAvatar, setMeuAvatar] = useState(null); // GET /avatar/meu

  useEffect(() => {
    let vivo = true;
    api.get(`/users/${usuario.id}/profile`).then(({ data }) => vivo && setPerfil(data)).catch(() => {});
    api.get(`/users/${usuario.id}/titulos`).then(({ data }) => vivo && setTitulos(data)).catch(() => {});
    // Peças liberadas + a próxima (cache de 60s no servidor): alimenta o
    // "Próxima peça" e o aviso de peça nova.
    api.get("/avatar/meu").then(({ data }) => vivo && setMeuAvatar(data)).catch(() => {});
    return () => { vivo = false; };
  }, [usuario.id]);

  // Próximo título mais perto de sair (mesma conta do clássico).
  const candidatos = [];
  for (const t of titulos?.quiz || []) if (t.proximo) candidatos.push({ nome: t.proximo.nome, atual: t.acertos, alvo: t.proximo.min, logo: t.proximo.logo, unidade: "acertos" });
  for (const t of titulos?.stop || []) if (t.proximo) candidatos.push({ nome: t.proximo.nome, atual: t.stops, alvo: t.proximo.min, logo: t.proximo.logo, unidade: "STOPs" });
  const proximoTitulo = candidatos.filter((c) => c.atual > 0).sort((a, b) => b.atual / b.alvo - a.atual / a.alvo)[0];
  // No máximo 3 cartões no painel da direita. Os jogos vão do que a pessoa
  // mais pontuou no mês pro que menos; se houver um título perto de sair,
  // ele fica com a última vaga (a meta mais concreta).
  const MAX_CARTOES = 3;
  const vagasJogos = MAX_CARTOES - (proximoTitulo ? 1 : 0);
  const mensal = (perfil?.monthly || [])
    .filter((m) => NOMES[m.gameKey])
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .slice(0, vagasJogos);

  return (
    <section className="v2-cartao v2-boas-vindas">
      <div className="v2-boas-vindas-texto">
        <div className="v2-boas-vindas-eu">
          {perfil?.avatar && (
            <a className="v2-boas-vindas-avatar" href={linkDaPagina("editar-perfil")} onClick={(e) => { e.preventDefault(); irParaPagina("editar-perfil"); }} title="Editar meu avatar">
              {/* Sem o fundo escolhido: o quadrado dele brigava com o cartão. O
                  fundo aparece no editor, no perfil e no cartão de compartilhar. */}
              <AvatarBoneco config={perfil.avatar} altura={170} rotulo="Seu avatar" semFundo />
            </a>
          )}
          <div>
            <span className="v2-sobretitulo">Bem-vindo de volta</span>
            <h1>{usuario.nickname}</h1>
            {perfil?.visitas > 1 && <p>Essa é sua <b>{perfil.visitas}ª</b> vez no portal.</p>}
          </div>
        </div>
        <ProximaPeca meu={meuAvatar} />
      </div>
      {meuAvatar && !meuAvatar.convidado && <AvisoPecaNova usuarioId={usuario.id} liberados={meuAvatar.liberados} config={perfil?.avatar || meuAvatar.config} campeonatos={meuAvatar.campeonatos} />}
      <div className="v2-painel-jogador">
        {mensal.length === 0 && !proximoTitulo && <div className="v2-vazio">Jogue uma partida pra aparecer aqui a sua patente do mês.</div>}
        {mensal.map((m) => {
          const alvo = m.nextRank ? m.points + m.nextRank.pointsNeeded : null;
          const pct = alvo ? Math.min(100, Math.round((m.points / alvo) * 100)) : 100;
          return (
            <a key={m.gameKey} className="v2-painel-item" href={linkDaPagina("ranking", { jogo: m.gameKey })} onClick={(e) => { e.preventDefault(); irParaPagina("ranking", { jogo: m.gameKey }); }}>
              <div className="v2-painel-topo">
                {m.rank?.icon && <img src={m.rank.icon} alt="" className={m.rank.brilha ? "brilha" : ""} onError={(e) => { e.currentTarget.style.display = "none"; }} />}
                <div>
                  <span>{NOMES[m.gameKey]}</span>
                  <b>{m.rank?.name}{m.position ? ` · ${m.position}º no mês` : ""}</b>
                </div>
                <em>{m.points.toLocaleString("pt-BR")} pts</em>
              </div>
              {m.nextRank && (
                <>
                  <div className="v2-missao-barra"><div style={{ width: `${pct}%` }} /></div>
                  <small>faltam {m.nextRank.pointsNeeded.toLocaleString("pt-BR")} pra {m.nextRank.name}</small>
                </>
              )}
            </a>
          );
        })}
        {proximoTitulo && (
          <a className="v2-painel-item" href={linkDaPagina("editar-perfil")} onClick={(e) => { e.preventDefault(); irParaPagina("editar-perfil"); }}>
            <div className="v2-painel-topo">
              {proximoTitulo.logo && <img src={proximoTitulo.logo} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
              <div><span>Próximo título</span><b>{proximoTitulo.nome}</b></div>
              <em>{proximoTitulo.atual}/{proximoTitulo.alvo}</em>
            </div>
            <div className="v2-missao-barra"><div style={{ width: `${Math.min(100, Math.round((proximoTitulo.atual / proximoTitulo.alvo) * 100))}%` }} /></div>
            <small>{proximoTitulo.alvo - proximoTitulo.atual} {proximoTitulo.unidade} pra conquistar</small>
          </a>
        )}
      </div>
    </section>
  );
}

// "Próxima peça": a peça trancada mais perto de sair (calculada no servidor
// junto com as liberadas), com barra de progresso. Abre o editor do avatar.
function ProximaPeca({ meu }) {
  const catalogo = useCatalogoAvatar();
  if (!meu) return null;
  const abrir = (e) => { e.preventDefault(); irParaPagina("editar-perfil"); };
  if (meu.convidado) {
    return (
      <a className="v2-proxima-peca" href={linkDaPagina("editar-perfil")} onClick={abrir}>
        <div><span>Seu avatar</span><b>Crie sua conta para desbloquear peças</b></div>
      </a>
    );
  }
  const p = meu.proxima;
  const item = p && catalogo?.porId.get(p.id);
  if (!item) return null;
  const pct = Math.min(100, Math.round((p.atual / p.meta) * 100));
  return (
    <a className="v2-proxima-peca" href={linkDaPagina("editar-perfil")} onClick={abrir} title={item.dica}>
      <span className="v2-avatar-miniatura"><MiniaturaPeca item={item} tamanho={48} corpo={meu.config} /></span>
      <div>
        <span>Próxima peça</span>
        <b>{item.nome}</b>
        <div className="v2-missao-barra" role="progressbar" aria-valuemin={0} aria-valuemax={p.meta} aria-valuenow={p.atual} aria-label={`Progresso até ${item.nome}`}><div style={{ width: `${pct}%` }} /></div>
        <small>faltam {p.faltam.toLocaleString("pt-BR")} {p.unidade}</small>
      </div>
    </a>
  );
}
```

Esse código é o mesmo que existe hoje no `Inicio.jsx` (o cálculo do próximo título, a `<section className="v2-cartao v2-boas-vindas">` e a função `ProximaPeca`), só mudou de arquivo.

- [ ] **Step 2: Tirar esse código do `Inicio.jsx`**

Em `frontend/v2/Inicio.jsx`:
1. Apagar os estados `perfil`, `titulos` e `meuAvatar`, e as três chamadas `api.get` que os preenchem (`/users/${usuario.id}/profile`, `/titulos`, `/avatar/meu`) com o comentário delas. Ficam `online`, `acroAtivo` e `feedback`.
2. Apagar o bloco de "Próximo título" até `.slice(0, vagasJogos);`.
3. Apagar a `<section className="v2-cartao v2-boas-vindas">` inteira.
4. Apagar o bloco `{(usuario.role === "ADMIN" || usuario.role === "MODERATOR") && (... v2-atalho-admin ...)}`.
5. Apagar a função `ProximaPeca` e os imports que ficaram sem uso: `AvatarBoneco, { MiniaturaPeca }`, `AvisoPecaNova` e `useCatalogoAvatar`.
6. Trocar `const NOMES = { stop: "Stop", ... };` por `import { NOMES_JOGOS as NOMES } from "./navegacao.js";` (junto dos outros imports).
7. O `useEffect` passa a depender de `[]` em vez de `[usuario.id]`.

- [ ] **Step 3: Criar `Eu.jsx`**

```jsx
import { irParaPagina, linkDaPagina } from "./App.jsx";
import { sair } from "./api.js";
import Moldura from "./Moldura.jsx";
import PainelJogador from "./PainelJogador.jsx";
import Perfil from "./Perfil.jsx";
import { trocarParaClassica } from "../src/utils/versaoSite.js";

// EU — o meu canto: resumo (patente do mês, próximo título, próxima peça),
// atalhos da conta e, embaixo, o meu perfil completo (títulos, conquistas,
// patentes). Abre em ?pagina=jogador&id=<eu> (o mesmo endereço de antes).
export default function Eu({ usuario }) {
  const admin = usuario.role === "ADMIN" || usuario.role === "MODERATOR";
  const ir = (pagina) => (e) => { e.preventDefault(); irParaPagina(pagina); };
  return (
    <Moldura usuario={usuario}>
      <PainelJogador usuario={usuario} />
      <nav className="v2-cartao v2-eu-atalhos" aria-label="Minha conta">
        <a href={linkDaPagina("editar-perfil")} onClick={ir("editar-perfil")}>Editar avatar e perfil <span aria-hidden="true">→</span></a>
        <a href={linkDaPagina("novidades")} onClick={ir("novidades")}>Novidades do site <span aria-hidden="true">→</span></a>
        {admin && <a href={linkDaPagina("admin")} onClick={ir("admin")}>Painel Admin <span aria-hidden="true">→</span></a>}
        <button type="button" onClick={() => trocarParaClassica()}>Versão clássica do site</button>
        <button type="button" className="v2-eu-sair" onClick={() => { if (confirm("Sair da conta?")) { sair(); window.location.reload(); } }}>Sair da conta</button>
      </nav>
      <Perfil usuario={usuario} userId={usuario.id} embutido />
    </Moldura>
  );
}
```

- [ ] **Step 4: Rota `jogador` no `App.jsx`**

Adicionar `import Eu from "./Eu.jsx";` e trocar

```jsx
    case "jogador": return <Perfil key={local.id} usuario={usuario} userId={local.id || usuario.id} />;
```

por

```jsx
    // Meu perfil (sem id ou com o meu id) é a seção Eu; o de outra pessoa
    // continua sendo o Perfil público.
    case "jogador":
      return !local.id || local.id === usuario.id
        ? <Eu usuario={usuario} />
        : <Perfil key={local.id} usuario={usuario} userId={local.id} />;
```

- [ ] **Step 5: CSS dos atalhos de Eu**

No fim de `frontend/v2/v2.css`:

```css
/* Eu: atalhos da conta em lista. */
.v2-eu-atalhos { display: flex; flex-direction: column; padding: 8px; gap: 2px; }
.v2-eu-atalhos a, .v2-eu-atalhos button { min-height: 50px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; border: none; background: transparent; border-radius: 14px; color: #fff; font-family: var(--titulo); font-weight: 600; font-size: 17px; text-align: left; }
.v2-eu-atalhos a:hover, .v2-eu-atalhos button:hover { background: var(--roxo-fundo); }
.v2-eu-atalhos .v2-eu-sair { color: var(--laranja); }
```

- [ ] **Step 6: Build e conferência**

Run: `cd frontend && npm test && npm run build`
Expected: testes passam; build sem erro.

No preview:
- `?pagina=jogador&id=eu-teste` e `?pagina=jogador` → Eu marcado; aparecem o cartão de boas-vindas, os atalhos (com "Painel Admin", porque a sessão de teste é ADMIN) e o perfil embaixo.
- `?pagina=jogador&id=outra-pessoa` → Perfil público, Social marcado.
- `/v2/` não mostra mais o cartão de boas-vindas nem o atalho "Painel admin".
- "Sair da conta" pergunta antes de sair (cancelar não sai).

- [ ] **Step 7: Commit**

```bash
git add frontend/v2/PainelJogador.jsx frontend/v2/Eu.jsx frontend/v2/Inicio.jsx frontend/v2/App.jsx frontend/v2/v2.css
git commit -m "v2: seção Eu (resumo do jogador, atalhos da conta e perfil); resumo sai do Início

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Página Jogar — Continuar e nova ordem

**Files:**
- Modify: `frontend/v2/App.jsx` (grava a última sala)
- Modify: `frontend/v2/Inicio.jsx`
- Modify: `frontend/v2/v2.css`

**Interfaces:**
- Consumes: `armazenamento`, `lembrarSala`, `ultimoJogo`, `linkDaSala`, `ROTA_SALAS`, `NOMES_JOGOS` (Tarefa 1); `irPara`, `irParaStop`, `irParaAcro`, `irParaPagina`, `linkDaPagina` (`App.jsx`).
- Produces: a memória `eg_v2_ultimo_jogo` fica preenchida sempre que uma sala abre (usada pela Tarefa 7).

- [ ] **Step 1: Gravar a última sala no `App.jsx`**

Adicionar `import { armazenamento, lembrarSala } from "./navegacao.js";` e, dentro de `App()`, logo depois do `useEffect` do `popstate`:

```jsx
  // Memória do último jogo (bloco "Continuar" e "Jogar agora"): toda sala que
  // abre fica guardada. O nome da sala vem de quem clicou (Lobby); aqui só o id.
  useEffect(() => {
    const jogo = local.sala ? "quiz" : local.stop ? "stop" : local.acro ? "acromania" : null;
    if (jogo) lembrarSala(armazenamento(), { jogo, sala: local.sala || local.stop || local.acro });
  }, [local.sala, local.stop, local.acro]);
```

- [ ] **Step 2: Componente `Continuar` no `Inicio.jsx`**

Imports: em `import { irParaPagina, linkDaPagina } from "./App.jsx";` acrescentar `irPara, irParaStop, irParaAcro`. Na linha do `navegacao.js` (Tarefa 5), importar também `armazenamento, linkDaSala, ROTA_SALAS, ultimoJogo`.

No fim do arquivo:

```jsx
const ENTRAR_NA_SALA = { quiz: irPara, stop: irParaStop, acromania: irParaAcro };

// CONTINUAR — volta pra última sala aberta. Confere uma vez se a sala ainda
// existe; se sumiu, leva pra página do jogo. Sem rede, tenta a sala mesmo
// assim (a própria sala avisa se der errado). Sem memória, não aparece.
function Continuar() {
  const [ultimo] = useState(() => ultimoJogo(armazenamento()));
  const [existe, setExiste] = useState(null); // null = ainda conferindo

  useEffect(() => {
    if (!ultimo) return;
    let vivo = true;
    api.get(ROTA_SALAS[ultimo.jogo])
      .then(({ data }) => {
        const lista = Array.isArray(data) ? data : data?.rooms || [];
        if (vivo) setExiste(lista.some((s) => String(s.roomId) === ultimo.sala));
      })
      .catch(() => vivo && setExiste(true));
    return () => { vivo = false; };
  }, [ultimo]);

  if (!ultimo) return null;
  const jogo = JOGOS.find((j) => j.chave === ultimo.jogo);
  const sumiu = existe === false;
  const href = sumiu ? linkDaPagina("jogar", { jogo: ultimo.jogo }) : linkDaSala(ultimo.jogo, ultimo.sala);
  const ir = (e) => { e.preventDefault(); if (sumiu) irParaPagina("jogar", { jogo: ultimo.jogo }); else ENTRAR_NA_SALA[ultimo.jogo](ultimo.sala); };
  return (
    <a className="v2-continuar" href={href} onClick={ir} style={{ "--cor": jogo?.cor, "--sombra": jogo?.sombra }}>
      {jogo?.logo && <img src={jogo.logo} alt="" />}
      <span className="v2-continuar-texto">
        <small>Continuar de onde parou</small>
        <b>{sumiu ? `${NOMES[ultimo.jogo]}: escolher outra sala` : ultimo.nome ? `${NOMES[ultimo.jogo]} · ${ultimo.nome}` : NOMES[ultimo.jogo]}</b>
      </span>
      <span className="v2-botao v2-botao-amarelo v2-continuar-botao">{sumiu ? "Ver salas" : "Continuar"}</span>
    </a>
  );
}
```

- [ ] **Step 3: Nova ordem do `<main>` do Início**

No `return` de `Inicio`, dentro de `<main className="v2-pagina v2-inicio">` (que, depois da Tarefa 5, começa com o comentário e o `<LendaDestaque />`):

1. Inserir `<Continuar />` como **primeira** linha dentro do `<main>`.
2. Recortar as duas linhas
   ```jsx
           {/* Carro-chefe: o RPG Lenda do Campinho, em destaque acima dos outros jogos */}
           <LendaDestaque />
   ```
   e colar logo **depois** do `</section>` que fecha `<section className="v2-jogos-rapida" …>`, trocando o comentário por `{/* Carro-chefe: o RPG Lenda do Campinho, logo depois dos jogos do portal */}`.
3. Recortar a linha `<Praca usuario={usuario} />` e colar logo **depois** do `<LendaDestaque />` (antes de `<div className="v2-inicio-duas">`).

O resto (os dois blocos de cards de jogos, `v2-inicio-duas`, `v2-sobre`, `v2-beta`) não muda. A ordem final é: Continuar, cards de Stop e Quiz, cards de fila, Lenda, Praça, aviso e novidades, Sobre, beta.

- [ ] **Step 4: CSS do Continuar**

No fim de `frontend/v2/v2.css`:

```css
/* Início: "Continuar de onde parou". */
.v2-continuar { display: flex; align-items: center; gap: 14px; padding: 12px 14px; border-radius: 22px; background: var(--roxo-2); border: 3px solid var(--cor, var(--borda)); animation: v2-entra .35s ease-out both; }
.v2-continuar img { width: 84px; height: 44px; object-fit: contain; flex-shrink: 0; }
.v2-continuar-texto { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.v2-continuar-texto small { font-size: 12px; font-weight: 800; color: var(--lilas); }
.v2-continuar-texto b { font-family: var(--titulo); font-size: 19px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.v2-continuar-botao { min-height: 46px; padding: 0 20px; font-size: 17px; flex-shrink: 0; }
@media (max-width: 459px) {
  .v2-continuar { flex-wrap: wrap; }
  .v2-continuar-botao { width: 100%; }
}
```

- [ ] **Step 5: Build e conferência**

Run: `cd frontend && npm test && npm run build`
Expected: testes passam; build sem erro.

No preview:
- `/v2/` sem memória → não aparece "Continuar"; logo abaixo do topo vêm os cards de Stop e Quiz, depois os de fila, depois a Lenda e a Praça.
- Abrir `/v2/?stop=qualquer` (a sala falha sem backend, tudo bem), voltar para `/v2/` → aparece "Continuar · Stop". Sem backend a conferência falha e o link aponta para a sala (`?stop=qualquer`).
- No console, rodar `localStorage.setItem("eg_v2_ultimo_jogo", "{quebrado")` e recarregar → nenhum erro, "Continuar" some.

- [ ] **Step 6: Commit**

```bash
git add frontend/v2/App.jsx frontend/v2/Inicio.jsx frontend/v2/v2.css
git commit -m "v2: página Jogar com Continuar (última sala) e jogos no topo

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Página de jogo — Jogar agora, Escolha a sala, Outras formas

**Files:**
- Modify: `frontend/v2/Lobby.jsx`
- Modify: `frontend/v2/v2.css`

**Interfaces:**
- Consumes: `escolherSalaStop`, `escolherSalaQuiz`, `armazenamento`, `lembrarSala`, `ultimaSalaDo` (Tarefa 1); `PartidaRapida` (`FilaNoCard.jsx`); `irPara`, `irParaStop`, `irParaAcro`, `irParaPagina`, `linkDaPagina`.
- Produces: nada usado por outras tarefas.

- [ ] **Step 1: Imports**

Em `frontend/v2/Lobby.jsx`, trocar `import { irPara, irParaPagina, irParaStop, irParaAcro } from "./App.jsx";` por `import { irPara, irParaPagina, irParaStop, irParaAcro, linkDaPagina } from "./App.jsx";` e adicionar:

```js
import { armazenamento, escolherSalaQuiz, escolherSalaStop, lembrarSala, ultimaSalaDo } from "./navegacao.js";
```

- [ ] **Step 2: Os cliques nas salas guardam o nome**

O nome da sala aparece em "Continuar". Trocar as três funções `entrar`:

- Em `Lobby` (Quiz): `const entrar = (e, id) => { e.preventDefault(); irPara(id); };` por
  ```js
  const entrar = (e, id, nome) => { e.preventDefault(); lembrarSala(armazenamento(), { jogo: "quiz", sala: id, nome }); irPara(id); };
  ```
  e, na grade de temas, `onClick={(e) => entrar(e, s.roomId)}` por `onClick={(e) => entrar(e, s.roomId, nomeDoTema(s.label))}`; nas arenas, `onClick={(e) => entrar(e, a.roomId)}` por `onClick={(e) => entrar(e, a.roomId, a.label.replace(/^[^\p{L}\d]+/u, ""))}`.
- Em `LobbyStop`: `const entrar = (e, id) => { e.preventDefault(); irParaStop(id); };` por
  ```js
  const entrar = (e, id, nome) => { e.preventDefault(); lembrarSala(armazenamento(), { jogo: "stop", sala: id, nome }); irParaStop(id); };
  ```
  e `onClick={(e) => entrar(e, s.roomId)}` por `onClick={(e) => entrar(e, s.roomId, s.label)}`.
- Em `LobbyAcro`: `const entrar = (e, id) => { e.preventDefault(); irParaAcro(id); };` por
  ```js
  const entrar = (e, id, nome) => { e.preventDefault(); lembrarSala(armazenamento(), { jogo: "acromania", sala: id, nome }); irParaAcro(id); };
  ```
  e `onClick={(e) => entrar(e, r.roomId)}` por `onClick={(e) => entrar(e, r.roomId, r.label)}`.

- [ ] **Step 3: Componentes `JogarAgora`, `OutrasFormas` e `SalasDosJogadores`**

Adicionar ao fim de `Lobby.jsx`:

```jsx
// JOGAR AGORA — o caminho principal da página de cada jogo. Stop e Quiz
// escolhem uma sala (regras em navegacao.js) e dizem qual antes do clique;
// na Acromania o caminho principal é a fila de espera.
function JogarAgora({ jogo, salasStop, salasQuiz, nivel, pontosVitalicios, acroAtivo }) {
  if (jogo === "acromania") return acroAtivo === false ? null : <PartidaRapida jogo="acromania" />;
  const mem = armazenamento();
  const lista = jogo === "stop" ? salasStop : salasQuiz;
  const escolha = jogo === "stop"
    ? escolherSalaStop(lista, { ultimaSala: ultimaSalaDo(mem, "stop"), pontosVitalicios })
    : escolherSalaQuiz(lista, { ultimaSala: ultimaSalaDo(mem, "quiz"), nivel });
  const nome = escolha ? (jogo === "quiz" ? nomeDoTema(escolha.sala.label) : escolha.sala.label) : "";
  const texto = lista === null ? "Procurando a melhor sala…"
    : !escolha ? "Nenhuma sala com vaga agora. Escolha uma abaixo."
    : escolha.motivo === "mais-gente" ? `Sala com mais gente agora: ${nome} (${escolha.sala.onlineCount} jogando)`
    : escolha.motivo === "ultima" ? `Voltar pra sua última sala: ${nome}`
    : `Comece por aqui: ${nome}`;
  const entrar = () => {
    if (!escolha) return;
    lembrarSala(mem, { jogo, sala: escolha.sala.roomId, nome });
    (jogo === "stop" ? irParaStop : irPara)(escolha.sala.roomId);
  };
  return (
    <section className="v2-jogar-agora" aria-label="Jogar agora">
      <p>{texto}</p>
      <button type="button" className="v2-botao v2-botao-amarelo" onClick={entrar} disabled={!escolha}>Jogar agora</button>
    </section>
  );
}

// OUTRAS FORMAS DE JOGAR — sala privada e várias salas, juntas. No celular
// ficam atrás de um botão (abre/fecha); no computador, sempre à mostra.
function OutrasFormas({ jogo }) {
  const [aberto, setAberto] = useState(false);
  const itens = [];
  if (jogo === "stop" || jogo === "acromania") itens.push({ pagina: "privadas", rotulo: "Criar sala privada", dica: "Com seus temas e seu tempo, pra jogar com a galera" });
  if (jogo === "stop" || jogo === "quiz") itens.push({ pagina: "varias", rotulo: "Várias salas ao mesmo tempo", dica: "Até 4 partidas na mesma tela" });
  return (
    <section className={`v2-outras-formas ${aberto ? "aberto" : ""}`}>
      <button type="button" className="v2-outras-formas-abrir" aria-expanded={aberto} onClick={() => setAberto((a) => !a)}>
        Outras formas de jogar <span aria-hidden="true">{aberto ? "▴" : "▾"}</span>
      </button>
      <h2 className="v2-bloco-titulo v2-outras-formas-titulo">Outras formas de jogar</h2>
      <div className="v2-outras-formas-lista">
        {itens.map((it) => (
          <a key={it.pagina} className="v2-outra-forma" href={linkDaPagina(it.pagina, { jogo })} onClick={(e) => { e.preventDefault(); irParaPagina(it.pagina, { jogo }); }}>
            <b>{it.rotulo}</b><span>{it.dica}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

// SALAS DOS JOGADORES — as privadas abertas agora (Stop e Acromania). Antes
// eram duas cópias quase iguais dentro de LobbyStop e LobbyAcro.
function SalasDosJogadores({ jogo, privadas }) {
  if (privadas.length === 0) return null;
  return (
    <section className="v2-privadas">
      <div className="v2-privadas-cabeca">
        <div>
          <h2>Salas dos jogadores</h2>
          <p>{jogo === "stop" ? "Criadas pela galera, com a mesa validando as palavras. Não contam pro ranking." : "Com tempos e número de rodadas escolhidos por quem abriu. Não contam pro ranking."}</p>
        </div>
      </div>
      <div className="v2-privadas-lista">
        {privadas.map((p) => (
          <a key={p.roomId} className="v2-privada" href={`/v2/?pagina=privadas&jogo=${jogo}&privada=${p.roomId}`} onClick={(e) => { e.preventDefault(); irParaPagina("privadas", { jogo, privada: p.roomId }); }}>
            <div className="v2-privada-topo">
              <b>{p.temSenha ? "🔒 " : ""}{p.nome}</b>
              <span>{p.jogadores === 0 ? "esperando" : `${p.jogadores}/${p.maxPlayers}`}</span>
            </div>
            {jogo === "stop"
              ? <div className="v2-privada-info">por {p.criador} · {p.answerSeconds}s por rodada · {p.temas.length} temas</div>
              : p.criador && <div className="v2-privada-info">por {p.criador}</div>}
          </a>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Tirar as salas privadas de `LobbyStop` e `LobbyAcro`**

- Em `LobbyStop`, apagar a `<section className="v2-privadas">…</section>` inteira e o parâmetro `privadas` (a assinatura fica `function LobbyStop({ salas, jogando })`).
- Em `LobbyAcro`, apagar a `<section className="v2-privadas">…</section>` inteira e o parâmetro `privadas` (fica `function LobbyAcro({ dados, jogando })`).

- [ ] **Step 5: Nova ordem do `return` de `Lobby`**

Dentro de `<div className="v2-lobby">`, depois da `<section className="v2-saudacao">…</section>` (que não muda), o conteúdo passa a ser:

```jsx
        <JogarAgora
          jogo={jogo}
          salasStop={salasStop}
          salasQuiz={salas}
          nivel={nivel}
          pontosVitalicios={vitalicio?.points || 0}
          acroAtivo={acro ? acro.ativo : null}
        />

        {!(jogo === "acromania" && acro && !acro.ativo) && <h2 className="v2-bloco-titulo v2-escolha-titulo">Ou escolha a sala</h2>}

        {jogo === "stop" && <LobbyStop salas={salasStop} jogando={jogandoStop} />}
        {jogo === "acromania" && <LobbyAcro dados={acro} jogando={jogandoAcro} />}

        {/* AQUI fica o bloco {jogo === "quiz" && (<> … </>)} atual, sem mudança
            (filtros Padrão/Avançada, aviso de erro, grade de temas e Arenas). */}

        {!(jogo === "acromania" && acro && !acro.ativo) && <OutrasFormas jogo={jogo} />}
        {jogo === "stop" && <SalasDosJogadores jogo="stop" privadas={privadas} />}
        {jogo === "acromania" && acro?.ativo !== false && <SalasDosJogadores jogo="acromania" privadas={privadasAcro} />}

        <Top3 jogo={jogo} />
```

Somem do `return`: o `<Top3>` que ficava logo depois da saudação (ele vai para o fim), o `<a className="v2-chamada-multi">…</a>` (vira item de "Outras formas"), o `{jogo === "acromania" && <PartidaRapida jogo="acromania" />}` (agora dentro de `JogarAgora`) e o `<EscadaPatentes jogo={jogo} mensal={mensal} />`. A função `EscadaPatentes` **continua exportada**, porque `Mentira.jsx` usa.

Apagar `import DicaNova from "./DicaNova.jsx";` só se não for mais usada no arquivo. Ela é usada dentro de `EscadaPatentes`, que continua, então **fica**.

- [ ] **Step 6: CSS**

No fim de `frontend/v2/v2.css`:

```css
/* Página de jogo: Jogar agora, Escolha a sala, Outras formas. */
.v2-jogar-agora { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 22px; background: var(--roxo-2); border: 3px solid var(--amarelo); }
.v2-jogar-agora p { margin: 0; flex: 1; font-weight: 800; color: var(--lilas); }
.v2-jogar-agora .v2-botao { flex-shrink: 0; }
.v2-jogar-agora .v2-botao:disabled { opacity: .55; cursor: default; }
.v2-escolha-titulo { margin: 6px 0 -4px; }
.v2-outras-formas { display: flex; flex-direction: column; gap: 10px; }
.v2-outras-formas-abrir { display: none; }
.v2-outras-formas-lista { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; }
.v2-outra-forma { display: flex; flex-direction: column; gap: 2px; padding: 12px 16px; border-radius: 18px; border: 2px dashed var(--borda); }
.v2-outra-forma:hover { border-color: var(--amarelo); }
.v2-outra-forma b { font-family: var(--titulo); font-size: 17px; }
.v2-outra-forma span { font-size: 13px; font-weight: 700; color: var(--lilas); }
@media (max-width: 699px) {
  .v2-jogar-agora { flex-direction: column; align-items: stretch; text-align: center; }
  .v2-outras-formas-titulo { display: none; }
  .v2-outras-formas-abrir { display: flex; justify-content: center; gap: 6px; min-height: 48px; border-radius: 16px; border: 2px dashed var(--borda); background: transparent; color: #fff; font-family: var(--titulo); font-weight: 600; font-size: 16px; align-items: center; }
  .v2-outras-formas:not(.aberto) .v2-outras-formas-lista { display: none; }
}
```

- [ ] **Step 7: Build e conferência**

Run: `cd frontend && npm test && npm run build`
Expected: testes passam; build sem erro.

No preview (sem backend):
- `?pagina=jogar&jogo=stop` → saudação, bloco "Jogar agora" com "Procurando a melhor sala…" e o botão desativado (as salas não carregam sem backend), "Ou escolha a sala", esqueletos das salas, "Outras formas de jogar" (Criar sala privada, Várias salas) e Top 3 no fim. Sem escada de patentes.
- `?pagina=jogar&jogo=quiz` → "Outras formas" só com "Várias salas".
- `?pagina=jogar&jogo=acromania` → o bloco principal é a fila de espera; "Outras formas" só com "Criar sala privada".
- Em 375px: "Outras formas de jogar" vira um botão que abre e fecha a lista.

Conferência com dados (opcional, se tiver backend local): no console, `localStorage.setItem("eg_v2_ultimo_jogo", JSON.stringify({ ultimo: null, porJogo: { quiz: { sala: "<id de uma sala>", nome: "X" } } }))`, recarregar o Quiz → "Voltar pra sua última sala: …".

- [ ] **Step 8: Commit**

```bash
git add frontend/v2/Lobby.jsx frontend/v2/v2.css
git commit -m "v2: página de jogo com Jogar agora, Escolha a sala e Outras formas de jogar

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Conferência final de todos os endereços

**Files:** nenhum (só conferência; corrigir na tarefa dona do problema, se algo falhar).

- [ ] **Step 1: Testes e build**

Run: `cd frontend && npm test && npm run build`
Expected: `# fail 0`; build sem erro e sem aviso novo de chunk acima de 500 kB além dos que já existiam (`three-*`).

- [ ] **Step 2: Matriz de endereços em 1280px e em 375px**

Com a sessão de teste (Tarefa 2, Step 1), abrir cada endereço e conferir a página aberta e a seção marcada (no topo em 1280px, na barra de baixo em 375px):

| Endereço | Página | Seção marcada |
|---|---|---|
| `/v2/` | Jogar (Início) | Jogar |
| `/v2/?pagina=jogar&jogo=stop` · `quiz` · `acromania` | Página do jogo | Jogar |
| `/v2/?pagina=varias&jogo=stop` | Várias salas | — (tela própria, sem topo) |
| `/v2/?pagina=privadas&jogo=stop` e `&privada=x` | Salas privadas | Jogar |
| `/v2/?pagina=tribunal` e `&mesa=x` | Tribunal | Jogar (se tiver topo) |
| `/v2/?pagina=impostor` | Impostor | Jogar |
| `/v2/?pagina=ranking&jogo=quiz` | Competir · Ranking | Competir |
| `/v2/?pagina=hall` | Competir · Hall da Fama | Competir |
| `/v2/?pagina=patentes&jogo=stop` | Competir · Patentes | Competir |
| `/v2/?pagina=amigos` e `&id=x` | Social · Amigos | Social |
| `/v2/?pagina=clas` | Social · Clã (lista) | Social |
| `/v2/?pagina=cla&id=x` | Social · Clã | Social |
| `/v2/?pagina=jogador&id=outra-pessoa` | Perfil público | Social |
| `/v2/?pagina=jogador&id=eu-teste` e `/v2/?pagina=jogador` | Eu | Eu |
| `/v2/?pagina=editar-perfil` · `novidades` · `admin` | Página própria | Eu |
| `/v2/?pagina=missoes` | Missões | Missões |
| `/v2/?pagina=termos` | Termos | nenhuma |
| `/v2/?sala=x` · `?stop=x` · `?acro=x` | Sala (como antes) | — |

- [ ] **Step 3: Pontos da Review Focus**

- Em 375px, `?pagina=amigos&id=x`: a conversa ocupa a tela como antes (lista escondida) e as abas e a busca aparecem em cima.
- Em 375px: nenhuma página tem rolagem horizontal; a barra de baixo não cobre o fim do conteúdo; não existe mais "Mais".
- `localStorage.setItem("eg_v2_ultimo_jogo", "{quebrado")` + recarregar `/v2/` e `?pagina=jogar&jogo=stop` → sem tela de erro.

- [ ] **Step 4: Avisar o resultado**

Sem commit. Relatar ao dono do site o que foi conferido, com prints de 1280px e 375px de `/v2/`, da página do Stop, de Competir e de Eu.
