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
