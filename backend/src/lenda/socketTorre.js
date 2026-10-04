// ===== Lenda do Campinho — TORRE INFINITA EM GRUPO (2 a 4 amigos, tempo real) =====
//
// O jogo roda no navegador de cada um. Aqui o servidor só é o "carteiro" da sala:
//   - cria a sala (código de 5 letras), deixa entrar só AMIGOS aceitos de quem criou;
//   - repassa as mensagens da partida entre os navegadores (quem criou é o ANFITRIÃO:
//     o navegador dele roda as criaturas, as ondas e o tempo; os outros mostram o espelho);
//   - convida amigos que estão online (aparece "Fulano chamou você para a Torre").
// Tudo em memória, nada no banco (a sala some quando acaba). Sem texto livre: a única
// "conversa" são 8 emojis fixos. Limite de mensagens por segundo e de tamanho.
//
// Eventos (todos com prefixo "torre-"; os que pedem resposta usam callback { ok } / { erro }):
//   criar {perfil} · entrar {codigo, perfil} · convidar {amigoId} · sair · comecar {andar} · perfil {perfil} (recorde novo)
//   eu {...} (cada um → os outros) · mundo {...} (anfitrião → os outros) · dano {uid, dano} (→ anfitrião)
//   fx {...} (anfitrião → os outros) · emote {i} · fim {res} (anfitrião → os outros)
import { amigosDe } from "./torcida.js";
import { prisma } from "../db.js";

export const MAX_MEMBROS = 4;
const MAX_SALAS = 300;
const EMOTES = 8;
const LIMITE_POR_SEG = 40;          // mensagens de jogo por segundo, por conexão
const TAM_MAX = { mundo: 12000, eu: 600, dano: 120, fx: 300, fim: 200 };

const salas = new Map();            // codigo -> sala
const salaDoUsuario = new Map();    // userId -> codigo

// Trocáveis nos testes (sem banco).
const deps = { amigosDe: (id) => amigosDe(prisma, id) };
export function __configurarTorreParaTestes(n) { Object.assign(deps, n); }
export function __resetTorreParaTestes() { salas.clear(); salaDoUsuario.clear(); deps.amigosDe = (id) => amigosDe(prisma, id); }
export const __salasTorre = salas;

const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function novoCodigo() {
  for (let t = 0; t < 50; t++) {
    let c = ""; for (let i = 0; i < 5; i++) c += LETRAS[(Math.random() * LETRAS.length) | 0];
    if (!salas.has(c)) return c;
  }
  return null;
}
// perfil do jogador na sala: só o que os outros precisam ver (sem texto livre além do apelido da conta)
export function limpaPerfil(p, apelido) {
  const n = (v, a, b) => Math.max(a, Math.min(b, Math.round(Number(v) || 0)));
  let look = null;
  try { const s = JSON.stringify(p?.look ?? null); if (s.length <= 1500) look = JSON.parse(s); } catch { look = null; }
  return { apelido: String(apelido || "Jogador").slice(0, 24), nivel: n(p?.nivel, 1, 5000), max: n(p?.max, 0, 100000), look };
}
export function resumo(sala) {
  return {
    codigo: sala.codigo, host: sala.host, fase: sala.fase, andar: sala.andar,
    membros: [...sala.membros.values()].map((m) => ({ id: m.id, apelido: m.apelido, nivel: m.nivel, max: m.max, look: m.look })),
  };
}
// andar mais alto que o grupo pode tentar: o próximo andar de quem tem o MENOR recorde
export function andarMaximo(sala) {
  return Math.max(1, Math.min(...[...sala.membros.values()].map((m) => m.max + 1)));
}

export function registrarTorre(io, socket) {
  const eu = socket.user?.id; if (!eu) return;
  const apelido = socket.user.nickname;
  let janela = 0, conta = 0;
  const podeMandar = () => { const t = Date.now(); if (t - janela > 1000) { janela = t; conta = 0; } return ++conta <= LIMITE_POR_SEG; };
  const sala = () => salas.get(salaDoUsuario.get(eu));
  const quarto = (s) => `torre:${s.codigo}`;
  const avisa = (s) => io.to(quarto(s)).emit("torre-sala", resumo(s));
  const responde = (cb, x) => { if (typeof cb === "function") cb(x); };

  function sai(motivo) {
    const s = sala(); if (!s) return;
    salaDoUsuario.delete(eu); s.membros.delete(eu); socket.leave(quarto(s));
    if (s.host === eu || s.membros.size === 0) { // sem anfitrião não tem partida: acaba para todos
      io.to(quarto(s)).emit("torre-fim", { res: "anfitriao_saiu" });
      for (const id of s.membros.keys()) salaDoUsuario.delete(id);
      io.in(quarto(s)).socketsLeave(quarto(s));
      salas.delete(s.codigo);
    } else {
      io.to(quarto(s)).emit("torre-saiu", { id: eu, motivo });
      avisa(s);
    }
  }

  socket.on("torre-criar", (dados, cb) => {
    if (sala()) sai("trocou");
    if (salas.size >= MAX_SALAS) return responde(cb, { erro: "Muitas salas abertas agora. Tente daqui a pouco." });
    const codigo = novoCodigo(); if (!codigo) return responde(cb, { erro: "Tente de novo." });
    const s = { codigo, host: eu, fase: "lobby", andar: null, membros: new Map(), criadaEm: Date.now() };
    s.membros.set(eu, { id: eu, ...limpaPerfil(dados?.perfil, apelido) });
    salas.set(codigo, s); salaDoUsuario.set(eu, codigo); socket.join(quarto(s));
    responde(cb, { ok: true, sala: resumo(s) });
  });

  socket.on("torre-entrar", async (dados, cb) => {
    try {
      const codigo = String(dados?.codigo || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
      const s = salas.get(codigo);
      if (!s) return responde(cb, { erro: "Sala não encontrada. Confira o código." });
      if (s.membros.has(eu)) { socket.join(quarto(s)); salaDoUsuario.set(eu, codigo); return responde(cb, { ok: true, sala: resumo(s) }); } // voltou depois de cair
      if (s.fase !== "lobby") return responde(cb, { erro: "O grupo já está subindo. Espere o andar acabar." });
      if (s.membros.size >= MAX_MEMBROS) return responde(cb, { erro: `A sala já tem ${MAX_MEMBROS} jogadores.` });
      const amigos = await deps.amigosDe(s.host);
      if (!amigos.includes(eu)) return responde(cb, { erro: "Só amigos de quem criou a sala podem entrar (peça amizade no jogo: ☰ Mais › 🤝 Amigos)." });
      if (sala() && sala() !== s) sai("trocou");
      s.membros.set(eu, { id: eu, ...limpaPerfil(dados?.perfil, apelido) });
      salaDoUsuario.set(eu, codigo); socket.join(quarto(s));
      responde(cb, { ok: true, sala: resumo(s) }); avisa(s);
    } catch { responde(cb, { erro: "Não deu para entrar agora." }); }
  });

  socket.on("torre-convidar", async (dados, cb) => {
    try {
      const s = sala(); if (!s) return responde(cb, { erro: "Crie uma sala primeiro." });
      const amigo = String(dados?.amigoId || "");
      const amigos = await deps.amigosDe(eu);
      if (!amigos.includes(amigo)) return responde(cb, { erro: "Só dá para chamar amigos." });
      io.to(`user:${amigo}`).emit("torre-convite", { codigo: s.codigo, de: apelido, andar: andarMaximo(s) });
      responde(cb, { ok: true });
    } catch { responde(cb, { erro: "Não deu para chamar agora." }); }
  });

  socket.on("torre-sair", (_d, cb) => { sai("saiu"); responde(cb, { ok: true }); });
  // depois de vencer um andar o recorde de cada um muda (e com ele o andar máximo do grupo)
  socket.on("torre-perfil", (dados) => {
    const s = sala(); if (!s || !podeMandar()) return;
    const m = s.membros.get(eu); if (!m) return;
    Object.assign(m, limpaPerfil(dados?.perfil, m.apelido)); avisa(s);
  });

  socket.on("torre-comecar", (dados, cb) => {
    const s = sala(); if (!s || s.host !== eu) return responde(cb, { erro: "Só quem criou a sala começa." });
    const max = andarMaximo(s), andar = Math.round(Number(dados?.andar) || 0);
    if (!(andar >= 1 && andar <= max)) return responde(cb, { erro: `O grupo pode tentar até o andar ${max} (o próximo andar de quem tem o menor recorde).` });
    s.fase = "jogando"; s.andar = andar;
    io.to(quarto(s)).emit("torre-comeca", { andar, sala: resumo(s) });
    responde(cb, { ok: true });
  });

  // ---- partida: só repasse (com limite de tamanho e de quantidade) ----
  const repassa = (evento, soHost, paraHost, volatil) => socket.on(evento, (dados) => {
    const s = sala(); if (!s || s.fase !== "jogando" || !podeMandar()) return;
    if (soHost && s.host !== eu) return;
    let txt; try { txt = JSON.stringify(dados); } catch { return; }
    if (!txt || txt.length > TAM_MAX[evento.slice(6)]) return;
    const pacote = { de: eu, d: dados };
    if (paraHost) { if (s.host !== eu) io.to(`user:${s.host}`).emit(evento, pacote); return; } // dano não pode se perder
    const alvo = socket.to(quarto(s)); (volatil ? alvo.volatile : alvo).emit(evento, pacote); // posição/retrato: o próximo substitui
  });
  repassa("torre-eu", false, false, true);
  repassa("torre-mundo", true, false, true);
  repassa("torre-fx", true, false, false);
  repassa("torre-dano", false, true, false);

  socket.on("torre-emote", (dados) => {
    const s = sala(); if (!s || !podeMandar()) return;
    const i = Math.round(Number(dados?.i)); if (!(i >= 0 && i < EMOTES)) return;
    io.to(quarto(s)).emit("torre-emote", { de: eu, i });
  });
  socket.on("torre-fim", (dados) => {
    const s = sala(); if (!s || s.host !== eu || s.fase !== "jogando") return;
    const res = ["limpou", "tempo", "derrota"].includes(dados?.res) ? dados.res : "derrota";
    s.fase = "lobby";
    io.to(quarto(s)).emit("torre-fim", { res, andar: s.andar });
    avisa(s);
  });

  socket.on("disconnect", () => {
    // caiu: espera 20 s para voltar (outra conexão do mesmo usuário na sala segura o lugar)
    const s = sala(); if (!s) return;
    setTimeout(() => {
      const s2 = salas.get(s.codigo); if (!s2 || !s2.membros.has(eu)) return;
      const aindaAqui = [...(io.sockets.adapter.rooms.get(quarto(s2)) || [])].some((sid) => io.sockets.sockets.get(sid)?.user?.id === eu);
      if (!aindaAqui) sai("caiu");
    }, 20000).unref?.();
  });
}
