// ===== Lenda do Campinho — CAÇA EM GRUPO (2 a 4 amigos, tempo real) — "MMO leve", etapa 2 =====
//
// Igual à Torre em grupo, mas o grupo dura enquanto os amigos jogam e vale para qualquer área de caça:
//   - o grupo tem um LÍDER (quem criou); só entram amigos dele (código de 5 letras ou convite);
//   - cada um conta em que mapa está ("onde"); quando o líder entra numa caça, os outros recebem o aviso;
//   - na caça, o navegador do LÍDER roda os adversários e manda o "retrato" (mundo) para quem está no mesmo
//     mapa; o dano dos outros vai para o líder; cada um ganha XP e prêmios no próprio jogo.
// Tudo em memória, nada no banco. Sem texto livre: emotes por índice. Limite de mensagens e de tamanho.
//
// Eventos (prefixo "grupo-"; os que pedem resposta usam callback { ok } / { erro }):
//   criar {perfil} · entrar {codigo, perfil} · convidar {amigoId} · sair · onde {mapa} · perfil {perfil}
//   eu {...} (→ quem está no mesmo mapa) · mundo {...} (líder → quem está no mesmo mapa) · dano {...} (→ líder)
//   emote {i}
// O servidor manda: grupo-sala {resumo} · grupo-convite {codigo, de} · grupo-fim {motivo} · grupo-saiu {id}
import { amigosDe } from "./torcida.js";
import { prisma } from "../db.js";
import { limpaPerfil } from "./socketTorre.js";
import { mapaValido } from "./socketMundo.js";

export const MAX_GRUPO = 4;
// dono: "deve existir uma diferença mínima entre os players para poder fazer party" → o nível mais alto pode ser
// no máximo 50% maior que o mais baixo (folga mínima de 10 níveis para quem está começando). O jogo usa a mesma conta.
export const faixaOk = (a, b) => { const lo = Math.min(a, b), hi = Math.max(a, b); return hi <= Math.max(lo * 1.5, lo + 10); };
export const faixaDe = (nivel) => ({ de: Math.max(1, Math.min(nivel - 10, Math.ceil(nivel / 1.5))), ate: Math.max(nivel + 10, Math.floor(nivel * 1.5)) });
const MAX_GRUPOS = 1000;
const EMOTES = 8;
const LIMITE_POR_SEG = 40;
const TAM_MAX = { mundo: 14000, eu: 600, dano: 120 };

const grupos = new Map();           // codigo -> grupo
const grupoDe = new Map();          // userId -> codigo

const deps = { amigosDe: (id) => amigosDe(prisma, id) };
export function __configurarGrupoParaTestes(n) { Object.assign(deps, n); }
export function __resetGrupoParaTestes() { grupos.clear(); grupoDe.clear(); deps.amigosDe = (id) => amigosDe(prisma, id); }
export const __grupos = grupos;

const LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function novoCodigo() {
  for (let t = 0; t < 50; t++) {
    let c = ""; for (let i = 0; i < 5; i++) c += LETRAS[(Math.random() * LETRAS.length) | 0];
    if (!grupos.has(c)) return c;
  }
  return null;
}
export function resumoGrupo(g) {
  return { codigo: g.codigo, lider: g.lider, membros: [...g.membros.values()].map((m) => ({ id: m.id, apelido: m.apelido, nivel: m.nivel, look: m.look, mapa: m.mapa })) };
}

export function registrarGrupo(io, socket) {
  const eu = socket.user?.id; if (!eu) return;
  const apelido = socket.user.nickname;
  let janela = 0, conta = 0, ultimoEmote = 0;
  const podeMandar = () => { const t = Date.now(); if (t - janela > 1000) { janela = t; conta = 0; } return ++conta <= LIMITE_POR_SEG; };
  const grupo = () => grupos.get(grupoDe.get(eu));
  const quarto = (g) => `grupo:${g.codigo}`;
  const avisa = (g) => io.to(quarto(g)).emit("grupo-sala", resumoGrupo(g));
  const responde = (cb, x) => { if (typeof cb === "function") cb(x); };
  // quem do grupo está no mesmo mapa que eu (sem mim)
  const vizinhos = (g, mapa) => [...g.membros.values()].filter((m) => m.id !== eu && m.mapa && m.mapa === mapa).map((m) => m.id);

  function sai(motivo) {
    const g = grupo(); if (!g) return;
    grupoDe.delete(eu); g.membros.delete(eu); io.in(`user:${eu}`).socketsLeave(quarto(g));
    if (g.lider === eu || g.membros.size === 0) { // sem líder não tem grupo
      io.to(quarto(g)).emit("grupo-fim", { motivo: g.lider === eu ? "lider_saiu" : "vazio" });
      for (const id of g.membros.keys()) grupoDe.delete(id);
      io.in(quarto(g)).socketsLeave(quarto(g));
      grupos.delete(g.codigo);
    } else {
      io.to(quarto(g)).emit("grupo-saiu", { id: eu, motivo });
      avisa(g);
    }
  }

  socket.on("grupo-criar", (dados, cb) => {
    if (grupo()) sai("trocou");
    if (grupos.size >= MAX_GRUPOS) return responde(cb, { erro: "Muitos grupos agora. Tente daqui a pouco." });
    const codigo = novoCodigo(); if (!codigo) return responde(cb, { erro: "Tente de novo." });
    const g = { codigo, lider: eu, membros: new Map(), criadoEm: Date.now() };
    g.membros.set(eu, { id: eu, ...limpaPerfil(dados?.perfil, apelido), mapa: mapaValido(dados?.mapa) ? dados.mapa : null });
    grupos.set(codigo, g); grupoDe.set(eu, codigo); socket.join(quarto(g));
    responde(cb, { ok: true, grupo: resumoGrupo(g) });
  });

  socket.on("grupo-entrar", async (dados, cb) => {
    try {
      const codigo = String(dados?.codigo || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
      const g = grupos.get(codigo);
      if (!g) return responde(cb, { erro: "Grupo não encontrado. Confira o código." });
      if (g.membros.has(eu)) { socket.join(quarto(g)); grupoDe.set(eu, codigo); return responde(cb, { ok: true, grupo: resumoGrupo(g) }); } // voltou depois de cair
      if (g.membros.size >= MAX_GRUPO) return responde(cb, { erro: `O grupo já tem ${MAX_GRUPO} jogadores.` });
      const amigos = await deps.amigosDe(g.lider);
      if (!amigos.includes(eu)) return responde(cb, { erro: "Só amigos de quem criou o grupo podem entrar (adicione no site, menu Amigos)." });
      const perfil = limpaPerfil(dados?.perfil, apelido);
      const longe = [...g.membros.values()].find((m) => !faixaOk(m.nivel, perfil.nivel));
      if (longe) { const f = faixaDe(longe.nivel); return responde(cb, { erro: `A diferença de nível é grande demais: ${longe.apelido} (nível ${longe.nivel}) só caça em grupo com quem está entre os níveis ${f.de} e ${f.ate}.` }); }
      if (grupo() && grupo() !== g) sai("trocou");
      g.membros.set(eu, { id: eu, ...perfil, mapa: mapaValido(dados?.mapa) ? dados.mapa : null });
      grupoDe.set(eu, codigo); socket.join(quarto(g));
      responde(cb, { ok: true, grupo: resumoGrupo(g) }); avisa(g);
    } catch { responde(cb, { erro: "Não deu para entrar agora." }); }
  });

  socket.on("grupo-convidar", async (dados, cb) => {
    try {
      const g = grupo(); if (!g) return responde(cb, { erro: "Crie um grupo primeiro." });
      if (g.lider !== eu) return responde(cb, { erro: "Só o líder chama amigos." });
      const amigo = String(dados?.amigoId || "");
      const amigos = await deps.amigosDe(eu);
      if (!amigos.includes(amigo)) return responde(cb, { erro: "Só dá para chamar amigos." });
      io.to(`user:${amigo}`).emit("grupo-convite", { codigo: g.codigo, de: apelido });
      responde(cb, { ok: true });
    } catch { responde(cb, { erro: "Não deu para chamar agora." }); }
  });

  socket.on("grupo-sair", (_d, cb) => { sai("saiu"); responde(cb, { ok: true }); });

  socket.on("grupo-onde", (dados) => {
    const g = grupo(); if (!g || !podeMandar()) return;
    const m = g.membros.get(eu); if (!m) return;
    const mapa = mapaValido(dados?.mapa) ? dados.mapa : null;
    if (m.mapa === mapa) return;
    m.mapa = mapa; avisa(g);
  });
  socket.on("grupo-perfil", (dados) => {
    const g = grupo(); if (!g || !podeMandar()) return;
    const m = g.membros.get(eu); if (!m) return;
    Object.assign(m, limpaPerfil(dados?.perfil, m.apelido)); avisa(g);
  });

  // ---- partida: só repasse, para quem está no mesmo mapa (com limite de tamanho e de quantidade) ----
  const repassa = (evento, soLider, paraLider, volatil) => socket.on(evento, (dados) => {
    const g = grupo(); if (!g || !podeMandar()) return;
    const m = g.membros.get(eu); if (!m || !m.mapa) return;
    if (soLider && g.lider !== eu) return;
    let txt; try { txt = JSON.stringify(dados); } catch { return; }
    if (!txt || txt.length > TAM_MAX[evento.slice(6)]) return;
    const pacote = { de: eu, mapa: m.mapa, d: dados };
    if (paraLider) { const l = g.membros.get(g.lider); if (g.lider !== eu && l && l.mapa === m.mapa) io.to(`user:${g.lider}`).emit(evento, pacote); return; }
    for (const id of vizinhos(g, m.mapa)) { const alvo = io.to(`user:${id}`); (volatil ? alvo.volatile : alvo).emit(evento, pacote); }
  });
  repassa("grupo-eu", false, false, true);
  repassa("grupo-mundo", true, false, true);
  repassa("grupo-dano", false, true, false);

  socket.on("grupo-emote", (dados) => {
    const g = grupo(); if (!g) return;
    const t = Date.now(); if (t - ultimoEmote < 1000) return; ultimoEmote = t;
    const i = Math.round(Number(dados?.i)); if (!(i >= 0 && i < EMOTES)) return;
    io.to(quarto(g)).emit("grupo-emote", { de: eu, i });
  });

  socket.on("disconnect", () => {
    // caiu: espera 20 s para voltar (outra conexão do mesmo usuário segura o lugar)
    const g = grupo(); if (!g) return;
    setTimeout(() => {
      const g2 = grupos.get(g.codigo); if (!g2 || !g2.membros.has(eu)) return;
      const aindaAqui = [...(io.sockets.adapter.rooms.get(quarto(g2)) || [])].some((sid) => io.sockets.sockets.get(sid)?.user?.id === eu);
      if (!aindaAqui) sai("caiu");
    }, 20000).unref?.();
  });
}
