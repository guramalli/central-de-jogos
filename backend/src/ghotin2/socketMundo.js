// ===== Ghotin2 — o MUNDO ONLINE, fase 1: "ver os outros jogadores" =====
//
// Plano: jogorpg/Logs/MMO/PLANO_FASE1.md (seções 2.1 a 2.5). Contrato para o jogo: jogorpg/Logs/MMO/API_MUNDO.md.
// Cada um continua jogando o próprio jogo no navegador (os monstros, o drop e a EXP são de cada um). Aqui o servidor só
// conta para quem está no MESMO mapa e canal onde os outros estão, com que cara, e repassa o chat (chatMundo.js).
//
// - Namespace próprio, io.of("/ghotin2"), com o middleware próprio: o token do Ghotin2 (token.js) não entra no namespace
//   padrão "/" (socket/index.js, o do site), e o "/" fica como estava.
// - Só o transporte websocket (sem polling): o Render não precisa de sessão fixa.
// - A chave GHOTIN2_ONLINE ("1" liga; qualquer outra coisa, ou sem a variável, desliga). Desligada, o namespace recusa a
//   conexão (codigo "desligado") e os ganchos das rotas (mundoG2) não fazem nada.
// - O nome, a classe e o nível vêm do banco (Ghotin2Personagem), nunca do cliente. A aparência (vis) é do cliente (só visual).
// - O molde é o mundo do Lenda do Campinho (lenda/socketMundo.js): os canais, o escolheCanal, o tick que manda só quem mudou
//   e o limpaPos. Tudo em memória: um deploy derruba todo mundo, e o cliente reconecta sozinho.
//
// Eventos (os que pedem resposta usam callback {ok, ...} ou {erro, codigo}):
//   g2-entrar {espaco, mapa, x, y, d, a, vis, privado?} → {ok, eu, canal, membros, t}
//   g2-sair · g2-eu [seq, x, y, d, a, f] · g2-vis {vis} → {ok} · g2-falar e g2-denunciar (chatMundo.js)
// O servidor manda: g2-chegou membro · g2-saiu {id} · g2-pos {k, p} (volátil) · g2-retrato {k, p} · g2-vis {id, vis}
//   g2-nivel {id, nivel} · g2-fala · g2-aviso {codigo, txt}
// x e y vão SEMPRE em centímetros inteiros (o jogo usa metros: o servidor divide por 100 para as contas).
import { prisma as prismaReal } from "../db.js";
import { conferirContaG2 } from "./auth.js";
import { NIVEL_MAX, confereEspaco } from "./regras.js";
import * as M from "./mapas.js";
import { registrarChatG2, __resetChatG2 } from "./chatMundo.js";

export const PROTO = 1;                 // (o mesmo PROTO do online.js; mudar a tabela ANIMS_REDE do jogo sobe os dois)
export const NAMESPACE = "/ghotin2";
export const MAX_POR_CANAL = 30;        // (decisão do usuário, 19/11; o custo maior é no cliente: um boneco 3D por outro)
export const MAX_JOGADORES = 1000;      // o servidor inteiro (contas conectadas ou caindo)
export const MAX_POR_IP = 4;
// os tempos (os testes trocam alguns)
export const CFG = {
  TICK_MS: 100,            // g2-pos a 10 Hz
  RETRATO_MS: 1000,        // g2-retrato a cada 1 s
  CAINDO_MS: 5000,         // caiu a conexão: 5 s para voltar com o mesmo lugar e o mesmo id
  PARADO_MS: 10 * 60_000,  // sem g2-eu por 10 min: aviso e derruba
  FAXINA_MS: 30_000,       // de quanto em quanto tempo procura os parados
  EU_POR_SEG: 15,          // g2-eu por conexão (o jogo manda 10)
  ENTRAR_MS: 1000,         // g2-entrar: 1 a cada 1 s
  VIS_MS: 2000,            // g2-vis: 1 a cada 2 s
  LEITURA_MS: 5000,        // a leitura do personagem no banco: no máximo 1 a cada 5 s por conta
  CORPO_MAX: 1024,         // o corpo de qualquer evento (em JSON)
};
// o anti-abuso de velocidade (PLANO_FASE1.md 2.5)
export const VEL = {
  VMAX: M.VMAX,            // 8,5 m/s
  FOLGA_M: 1.0,            // + 1 m em todo passo
  BALDE_M: 12,             // o balde: até 12 m (a Investida, o dash, o empurrão, um engasgo de rede)...
  RECARGA: 3,              // ...que recarrega a 3 m/s
  DT_MIN: 0.05, DT_MAX: 1, // o dt preso entre 0,05 s e 1 s
  COERENTE_MS: 3000,       // as posições depois do salto coerentes entre si por 3 s: reposiciona (e conta mais uma falta)
  FALTAS: 6, JANELA_FALTAS_MS: 5 * 60_000, SUSPENSO_MS: 60_000,   // 6 faltas em 5 min: 60 s sem repasse
  TELE_MS: 3000,           // o teleporte (bit 16) vale uma vez a cada 3 s
};
// os bits de `f` no g2-eu
export const BIT = { CORRE: 1, MONTADO: 2, COMBATE: 4, CAIDO: 8, TELEPORTE: 16, AUSENTE: 32 };

const AVISOS = {
  desligado: "O modo online está desligado agora. O jogo continua sozinho.",
  so_websocket: "Conexão sem websocket. Atualize a página.",
  versao_velha: "O jogo foi atualizado. Atualize a página.",
  token_invalido: "Sua sessão acabou. Entre de novo.",
  sessao_tomada: "Você entrou nesta conta em outro computador.",
  banido: "Esta conta foi banida.",
  fora_do_ar: "O mundo online volta em instantes.",
  lotado: "O mundo online está lotado agora. Tente daqui a pouco.",
  limite_ip: "Conexões demais deste endereço.",
  outra_aba: "O Ghotin2 foi aberto em outra aba.",
  parado: "Você ficou 10 minutos sem se mexer e saiu do mundo online.",
  apagado: "O personagem foi apagado.",
  conta_apagada: "A conta foi apagada.",
  saiu: "Você saiu da conta.",
  senha_trocada: "A senha da conta mudou. Entre de novo.",
  derrubado: "Você saiu do mundo online.",
};
const aviso = (codigo, txt) => ({ codigo, txt: txt || AVISOS[codigo] || AVISOS.derrubado });
function erroDe(codigo) { const e = new Error(codigo); e.data = aviso(codigo); return e; }

// o IP (cópia do ipDoSocket de ipBan.js: o Socket.IO não aplica o "trust proxy" do Express)
function ipDoSocketLocal(socket) {
  const xff = socket.handshake.headers?.["x-forwarded-for"];
  if (xff) return String(xff).split(",")[0].trim();
  return socket.handshake.address;
}

const deps = {
  prisma: prismaReal,
  agora: () => Date.now(),
  ligado: () => process.env.GHOTIN2_ONLINE === "1",
  ipEstaBanido: () => false,      // (o index.js passa o de ipBan.js; importar o ipBan aqui faria a consulta dele já no import)
  ipDoSocket: ipDoSocketLocal,
};
const agora = () => deps.agora();

// ---------------------------------------------------------------- o estado (tudo em memória)
const canais = new Map();   // "mapa#n" -> { chave, mapa, n, membros: Map(id -> membro), mudou: Set(id) }
const regs = new Map();     // contaId -> o registro da conta no mundo:
//   { conta, id (curto), sessao, ip, sock (null = "caindo"), caindo (timer), pers: {pid, espaco, nome, classe, nivel},
//     lidoEm, ultimoEu, mb (o membro no canal, ou null) }
let nsp = null, tick = null, faxina = null, ultimoRetrato = 0, inicio = null, proximoId = 0;

export const __estadoMundoG2 = { canais, regs };
export function __configurarMundoG2ParaTestes(n) { Object.assign(deps, n); }
export function __resetMundoG2ParaTestes() {
  for (const r of regs.values()) if (r.caindo) clearTimeout(r.caindo);
  canais.clear(); regs.clear(); __resetChatG2();
  if (tick) { clearInterval(tick); tick = null; }
  if (faxina) { clearInterval(faxina); faxina = null; }
  ultimoRetrato = 0; inicio = null; proximoId = 0;
}

// o número do tick (de 100 em 100 ms desde a primeira conta): o cliente acha a hora do servidor por ele
export function tickAgora() { const t = agora(); if (inicio === null) inicio = t; return Math.max(0, Math.floor((t - inicio) / CFG.TICK_MS)); }

// o id curto da sessão: um número de 1 a 999.999, nunca o id da conta (e menor na mensagem)
function novoId() {
  const usados = new Set([...regs.values()].map((r) => r.id));
  do { proximoId = (proximoId % 999_999) + 1; } while (usados.has(proximoId));
  return proximoId;
}

// ---------------------------------------------------------------- os números
const faixa = (v, a, b, def = a) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.max(a, Math.min(b, n)) : def; };
const cm = (v) => { const n = Number(v); return Number.isFinite(n) && Math.abs(n) < 1e7 ? Math.round(n) : null; };
const nivelOk = (n) => faixa(n, 1, NIVEL_MAX, 1);
const grande = (d) => { try { return JSON.stringify(d ?? null).length > CFG.CORPO_MAX; } catch { return true; } };
const prende = (v, a, b) => Math.max(a, Math.min(b, v));
// a posição do g2-entrar (x, y em cm), ou null
export function limpaPos(d) {
  const x = cm(d?.x), y = cm(d?.y);
  if (x === null || y === null) return null;
  return { x, y, d: faixa(d?.d, 0, 7, 0), a: faixa(d?.a, 0, 255, 0), f: faixa(d?.f, 0, 63, 0) };
}
// a aparência: cada número preso na faixa (na fase 1 ela é confiada ao cliente: é só visual)
export function limpaVis(v) {
  const arm = v?.arm == null ? null : faixa(v.arm, 0, 8, null);
  return { arm, arma: faixa(v?.arma, 0, 9, 0), rara: v?.rara ? 1 : 0, ref: faixa(v?.ref, 0, 9, 0), cav: faixa(v?.cav, 0, 21, 0) };
}
const mesmaVis = (a, b) => !!a && !!b && a.arm === b.arm && a.arma === b.arma && a.rara === b.rara && a.ref === b.ref && a.cav === b.cav;

// ---------------------------------------------------------------- os canais
const quarto = (c) => `g2:${c.chave}`;
const canalDe = (mb) => (mb ? canais.get(mb.canal) || null : null);
const caindo = (mb) => !mb.reg.sock;
const suspenso = (mb, t) => mb.suspensoAte > t;
const publico = (mb) => ({ id: mb.id, nome: mb.reg.pers.nome, nivel: mb.reg.pers.nivel, classe: mb.reg.pers.classe, vis: mb.vis, x: mb.x, y: mb.y, d: mb.d, a: mb.a, f: mb.f });
const linha = (mb) => [mb.id, mb.x, mb.y, mb.d, mb.a, mb.f];
// os outros do canal que aparecem (sem a própria pessoa e sem quem está caindo)
const visiveis = (c, eu) => [...c.membros.values()].filter((m) => m.id !== eu && !caindo(m)).map(publico);

// o canal do mapa onde a pessoa vai entrar: o mais cheio que ainda cabe; senão, abre um novo (o menor número livre).
// (o "canal com quem é do grupo" do Lenda entra na fase 2, com o grupo)
export function escolheCanal(mapa) {
  const cheio = [...canais.values()].filter((c) => c.mapa === mapa && c.membros.size < MAX_POR_CANAL).sort((a, b) => b.membros.size - a.membros.size || a.n - b.n)[0];
  if (cheio) return cheio;
  let n = 1; while (canais.has(`${mapa}#${n}`)) n++;
  const c = { chave: `${mapa}#${n}`, mapa, n, membros: new Map(), mudou: new Set() };
  canais.set(c.chave, c);
  return c;
}

// tira a conta do canal (os outros recebem g2-saiu); o canal vazio é apagado
function saiDoCanal(r) {
  const mb = r.mb; if (!mb) return;
  r.mb = null;
  const c = canais.get(mb.canal); if (!c) return;
  c.membros.delete(mb.id); c.mudou.delete(mb.id);
  if (r.sock) r.sock.leave(quarto(c));
  if (!c.membros.size) canais.delete(c.chave);
  else nsp.to(quarto(c)).emit("g2-saiu", { id: mb.id });
}

// apaga a conta do mundo de vez
function apagaReg(r) {
  if (r.caindo) { clearTimeout(r.caindo); r.caindo = null; }
  saiDoCanal(r);
  if (regs.get(r.conta) === r) regs.delete(r.conta);
}

// derruba a conexão da conta, sem o "caindo" de 5 s (o aviso vai antes)
function derrubaReg(r, codigo, txt) {
  const s = r.sock;
  if (s) { s.data.semCaindo = true; s.emit("g2-aviso", aviso(codigo, txt)); s.disconnect(true); }
  apagaReg(r);   // (o disconnect acima já apagou, se o Socket.IO chamou o handler na hora; repetir não faz mal)
}

// ---------------------------------------------------------------- a velocidade (PLANO_FASE1.md 2.5)
function falta(mb, motivo, t) {
  mb.faltas = mb.faltas.filter((ts) => t - ts < VEL.JANELA_FALTAS_MS);
  mb.faltas.push(t);
  if (mb.faltas.length >= VEL.FALTAS && !suspenso(mb, t)) {
    mb.suspensoAte = t + VEL.SUSPENSO_MS; mb.faltas = [];
    const p = mb.reg.pers;
    console.warn(`[ghotin2-mundo] ${p.nome} (personagem ${p.pid}) sem repasse por ${VEL.SUSPENSO_MS / 1000} s: ${VEL.FALTAS} faltas em ${VEL.JANELA_FALTAS_MS / 60_000} min (a última: ${motivo})`);
  }
}
function aceita(mb, x, y, t) { mb.boa = { x, y, t }; mb.susp = null; }

// a posição nova (em metros) cabe no passo? true: aceita (vira a última boa); false: fica na última boa para os outros
export function confereMovimento(mb, x, y, f, t) {
  mb.balde = Math.min(VEL.BALDE_M, mb.balde + Math.max(0, t - mb.baldeT) / 1000 * VEL.RECARGA);
  mb.baldeT = t;
  // o teleporte (o portal, renascer, a viagem): vale uma vez a cada 3 s, para dentro do mapa da sala (o g2-eu já conferiu).
  // Antes dos 3 s, o bit não vale nada e a posição é julgada como um passo comum (o salto conta a falta)
  if ((f & BIT.TELEPORTE) && t - mb.ultimoTele >= VEL.TELE_MS) { mb.ultimoTele = t; aceita(mb, x, y, t); return true; }
  const dist = Math.hypot(x - mb.boa.x, y - mb.boa.y);
  const dt = prende((t - mb.boa.t) / 1000, VEL.DT_MIN, VEL.DT_MAX);
  const max = VEL.VMAX * dt + VEL.FOLGA_M;
  if (dist <= max + mb.balde) {
    if (dist > max) mb.balde -= dist - max;
    aceita(mb, x, y, t); return true;
  }
  // acima do máximo: não repassa. Se as posições seguintes forem coerentes entre si por 3 s, era lag: reposiciona
  const s = mb.susp;
  if (s) {
    const dts = prende((t - s.t) / 1000, VEL.DT_MIN, VEL.DT_MAX);
    if (Math.hypot(x - s.x, y - s.y) <= VEL.VMAX * dts + VEL.FOLGA_M) {
      s.x = x; s.y = y; s.t = t;
      if (t - s.desde >= VEL.COERENTE_MS) { falta(mb, "reposicionado depois de 3 s coerentes", t); aceita(mb, x, y, t); return true; }
      return false;
    }
  }
  mb.susp = { x, y, t, desde: t };
  falta(mb, `salto de ${dist.toFixed(1)} m`, t);
  return false;
}

function novoMembro(r, c, pos, vis, t, herda) {
  return {
    id: r.id, reg: r, canal: c.chave, x: pos.x, y: pos.y, d: pos.d, a: pos.a, f: pos.f, vis,
    boa: { x: pos.x / 100, y: pos.y / 100, t }, balde: VEL.BALDE_M, baldeT: t, susp: null,
    faltas: herda ? herda.faltas : [], suspensoAte: herda ? herda.suspensoAte : 0, ultimoTele: herda ? t : -Infinity,
  };
}

// ---------------------------------------------------------------- o tick (10 Hz) e o retrato (1 s)
function passoTick() {
  const t = agora(), k = tickAgora();
  const retrato = t - ultimoRetrato >= CFG.RETRATO_MS;
  if (retrato) ultimoRetrato = t;
  for (const c of canais.values()) {
    if (retrato) {
      c.mudou.clear();
      if (c.membros.size < 2) continue;   // (sozinho no canal: não há para quem contar)
      const p = [];
      for (const mb of c.membros.values()) if (!caindo(mb) && !suspenso(mb, t)) p.push(linha(mb));
      if (p.length) nsp.to(quarto(c)).emit("g2-retrato", { k, p });
    } else if (c.mudou.size) {
      const p = [];
      for (const id of c.mudou) { const mb = c.membros.get(id); if (mb && !caindo(mb) && !suspenso(mb, t)) p.push(linha(mb)); }
      c.mudou.clear();
      if (p.length && c.membros.size > 1) nsp.to(quarto(c)).volatile.emit("g2-pos", { k, p });
    }
  }
  if (!canais.size) { clearInterval(tick); tick = null; }
}
function ligaTick() {
  if (tick) return;
  ultimoRetrato = agora();
  tick = setInterval(passoTick, CFG.TICK_MS);
  tick.unref?.();
}
// os parados há 10 min (com a conexão aberta) saem e liberam a vaga
function ligaFaxina() {
  if (faxina) return;
  faxina = setInterval(() => {
    const t = agora();
    for (const r of [...regs.values()]) if (r.sock && t - r.ultimoEu > CFG.PARADO_MS) derrubaReg(r, "parado");
    if (!regs.size) { clearInterval(faxina); faxina = null; }
  }, CFG.FAXINA_MS);
  faxina.unref?.();
}

// quantas contas (fora esta) estão conectadas deste IP
const contasDoIp = (ip, conta) => { let n = 0; for (const r of regs.values()) if (r.sock && r.ip === ip && r.conta !== conta) n++; return n; };

// ---------------------------------------------------------------- os ganchos das rotas (routes/ghotin2.js)
// Todos são no-op com o mundo desligado (ou antes de registrarMundoG2) e nunca lançam erro.
export const mundoG2 = {
  ligado: () => !!nsp && deps.ligado(),
  // derruba a conexão da conta. excetoSessao: não derruba a conexão desta sessão (POST /sessao: a sessão nova fica);
  // soSessao: só derruba se for desta sessão (sair sem "todos")
  derrubar(contaId, { excetoSessao = null, soSessao = null, codigo = "derrubado", txt } = {}) {
    try {
      if (!mundoG2.ligado()) return false;
      const r = regs.get(contaId); if (!r) return false;
      if (excetoSessao && r.sessao === excetoSessao) return false;
      if (soSessao && r.sessao !== soSessao) return false;
      derrubaReg(r, codigo, txt); return true;
    } catch (e) { console.error("[ghotin2-mundo] derrubar", e && e.message); return false; }
  },
  // um save aceito (PUT /personagens/:espaco) mudou o nível: a placa dos outros muda junto
  nivel(contaId, espaco, nivel) {
    try {
      if (!mundoG2.ligado()) return false;
      const r = regs.get(contaId); if (!r || !r.pers || r.pers.espaco !== espaco) return false;
      const n = nivelOk(nivel); if (n === r.pers.nivel) return false;
      r.pers.nivel = n;
      const c = canalDe(r.mb);
      if (c && r.sock) nsp.to(quarto(c)).emit("g2-nivel", { id: r.id, nivel: n });
      return true;
    } catch (e) { console.error("[ghotin2-mundo] nivel", e && e.message); return false; }
  },
};

// ---------------------------------------------------------------- o namespace
// opcoes (todas opcionais): { prisma, ipEstaBanido, ipDoSocket, ligado: () => bool, agora: () => ms }
export function registrarMundoG2(io, opcoes = {}) {
  for (const k of ["prisma", "ipEstaBanido", "ipDoSocket", "ligado", "agora"]) if (opcoes[k]) deps[k] = opcoes[k];
  nsp = io.of(NAMESPACE);

  // o middleware: a chave, o websocket, o IP, o PROTO, o token, a conta, a sessão, o limite do servidor e o do IP
  nsp.use(async (socket, next) => {
    try {
      if (!deps.ligado()) return next(erroDe("desligado"));
      if (socket.conn?.transport?.name !== "websocket") return next(erroDe("so_websocket"));
      const ip = deps.ipDoSocket(socket);
      if (deps.ipEstaBanido(ip)) return next(erroDe("banido"));
      const a = socket.handshake.auth || {};
      if (a.v !== PROTO) return next(erroDe("versao_velha"));   // (antes do banco: o cliente velho não custa leitura)
      const r = await conferirContaG2(deps.prisma, typeof a.token === "string" ? a.token : "");
      if (!r.ok) return next(erroDe(r.codigo));
      const conta = r.conta.id;
      const sessao = typeof a.sessao === "string" && a.sessao.length <= 64 ? a.sessao : "";
      if (!sessao) return next(erroDe("sessao_tomada"));
      let c;
      try { c = await deps.prisma.ghotin2Conta.findUnique({ where: { id: conta }, select: { sessao: true } }); }
      catch { return next(erroDe("fora_do_ar")); }
      if (!c) return next(erroDe("token_invalido"));
      if (c.sessao !== sessao) return next(erroDe("sessao_tomada"));   // (sem isso, dois computadores da mesma conta apareceriam juntos)
      if (!regs.has(conta) && regs.size >= MAX_JOGADORES) return next(erroDe("lotado"));
      if (contasDoIp(ip, conta) >= MAX_POR_IP) return next(erroDe("limite_ip"));
      socket.data.g2 = { conta, sessao, ip };
      next();
    } catch (e) {
      console.error("[ghotin2-mundo] middleware", e && e.message);
      next(erroDe("fora_do_ar"));
    }
  });

  nsp.on("connection", (socket) => {
    const { conta, sessao, ip } = socket.data.g2;
    // uma conexão por conta: a aba nova substitui a velha (a velha recebe o aviso e cai, sem levar o lugar no canal)
    let r = regs.get(conta);
    const velho = r && r.sock && r.sock !== socket ? r.sock : null;
    if (!r) { r = { conta, id: novoId(), pers: null, noMundo: false, lidoEm: -Infinity, mb: null, caindo: null }; regs.set(conta, r); }
    if (r.caindo) { clearTimeout(r.caindo); r.caindo = null; }
    Object.assign(r, { sock: socket, sessao, ip, ultimoEu: agora() });
    socket.data.reg = r;
    if (velho) { velho.data.substituido = true; velho.emit("g2-aviso", aviso("outra_aba")); velho.disconnect(true); }
    ligaFaxina();

    const reg = r;
    const meu = () => (reg.sock === socket ? reg : null);   // (a aba substituída não manda mais nada)
    const responde = (cb, x) => { if (typeof cb === "function") cb(x); };
    const falha = (codigo, erro, extra = {}) => ({ erro: erro || AVISOS[codigo] || "Não deu certo.", codigo, ...extra });
    let seqUlt = -1, janela = -Infinity, contaEu = 0, ultimoEntrar = -Infinity, ultimaVis = -Infinity, entrando = 0;

    socket.on("g2-entrar", async (dados, cb) => {
      try {
        if (!meu()) return responde(cb, falha("substituido", AVISOS.outra_aba));
        if (grande(dados)) return responde(cb, falha("grande", "Envio grande demais."));
        const t = agora();
        if (t - ultimoEntrar < CFG.ENTRAR_MS) return responde(cb, falha("rapido", "Calma! Espere um instante.", { esperaMs: CFG.ENTRAR_MS - (t - ultimoEntrar) }));
        ultimoEntrar = t;
        const espaco = confereEspaco(dados?.espaco);
        if (espaco === null) return responde(cb, falha("espaco_invalido", "Espaço inválido."));
        const privado = !!dados?.privado;
        let mapa = null, pos = null;
        if (!privado) {
          mapa = dados?.mapa;
          if (!M.mapaComSala(mapa)) return responde(cb, falha("mapa_invalido", "Esse mapa não tem sala online."));
          pos = limpaPos(dados);
          if (!pos || M.mapaDoPonto(pos.x / 100, pos.y / 100) !== mapa) return responde(cb, falha("fora_do_mapa", "A posição não fica nesse mapa."));
        }
        // o personagem vem do banco (nome, classe, nível); trocar de mapa com o mesmo personagem não lê de novo
        const minha = ++entrando;
        let pers = reg.pers && reg.pers.espaco === espaco ? reg.pers : null;
        if (!pers) {
          if (t - reg.lidoEm < CFG.LEITURA_MS) return responde(cb, falha("rapido", "Calma! Espere um instante.", { esperaMs: CFG.LEITURA_MS - (t - reg.lidoEm) }));
          reg.lidoEm = t;
          const p = await deps.prisma.ghotin2Personagem.findFirst({ where: { contaId: conta, espaco, apagadoEm: null }, select: { id: true, nome: true, classe: true, nivel: true } });
          if (!p) return responde(cb, falha("sem_personagem", "Esse espaço está vazio."));
          pers = { pid: p.id, espaco, nome: p.nome, classe: p.classe, nivel: nivelOk(p.nivel) };
        }
        if (minha !== entrando || !meu()) return responde(cb, falha("trocou", "Trocou de mapa de novo enquanto esperava."));
        // outro personagem da mesma conta: o de antes sai de vez
        if (reg.mb && reg.pers && reg.pers.pid !== pers.pid) saiDoCanal(reg);
        reg.pers = pers; reg.noMundo = true;
        if (privado) {   // (o salão do chefe, as cenas, o editor: some para os outros e não vê ninguém)
          saiDoCanal(reg);
          return responde(cb, { ok: true, eu: reg.id, canal: 0, membros: [], t: tickAgora(), privado: 1 });
        }
        const vis = limpaVis(dados?.vis);
        let mb = reg.mb, c = canalDe(mb);
        if (mb && c && c.mapa === mapa) {
          // o mesmo mapa (voltou da queda, outra aba, ou mandou de novo): fica no mesmo canal e com o mesmo id, na posição nova
          socket.join(quarto(c));
          Object.assign(mb, { x: pos.x, y: pos.y, d: pos.d, a: pos.a, f: pos.f, vis });
          aceita(mb, pos.x / 100, pos.y / 100, t);
          socket.to(quarto(c)).emit("g2-chegou", publico(mb));   // (quem já o tinha só atualiza; quem chegou na queda passa a ver)
        } else {
          // trocou de mapa: vale como um teleporte (um a cada 3 s; mais que isso conta falta, mas a troca vale)
          let herda = null;
          if (mb) { if (t - mb.ultimoTele < VEL.TELE_MS) falta(mb, "troca de mapa seguida", t); herda = { faltas: mb.faltas, suspensoAte: mb.suspensoAte }; }
          saiDoCanal(reg);
          c = escolheCanal(mapa);
          mb = novoMembro(reg, c, pos, vis, t, herda);
          c.membros.set(mb.id, mb); reg.mb = mb;
          socket.join(quarto(c));
          socket.to(quarto(c)).emit("g2-chegou", publico(mb));
          ligaTick();
        }
        responde(cb, { ok: true, eu: reg.id, canal: c.n, membros: visiveis(c, reg.id), t: tickAgora() });
      } catch (e) {
        console.error("[ghotin2-mundo] g2-entrar", e && (e.code || e.message));
        responde(cb, falha("fora_do_ar"));
      }
    });

    // voltar à lista, sair da conta ou fechar a aba. (O personagem lido fica guardado: entrar de novo com ele não lê o banco.)
    socket.on("g2-sair", (_d, cb) => {
      if (meu()) { saiDoCanal(reg); reg.noMundo = false; }
      responde(cb, { ok: true });
    });

    socket.on("g2-eu", (p) => {
      if (!meu() || !Array.isArray(p) || p.length < 6 || p.length > 8) return;
      const t = agora();
      if (t - janela >= 1000) { janela = t; contaEu = 0; }
      if (++contaEu > CFG.EU_POR_SEG) return;                       // (acima de 15 por segundo: descarta)
      const seq = p[0];
      if (!Number.isInteger(seq) || seq <= seqUlt || seq > 2 ** 31) return;   // (pacote velho: descarta)
      seqUlt = seq;
      reg.ultimoEu = t;
      const mb = reg.mb, c = canalDe(mb); if (!c) return;
      const x = cm(p[1]), y = cm(p[2]); if (x === null || y === null) return;
      const d = faixa(p[3], 0, 7, mb.d), a = faixa(p[4], 0, 255, mb.a), f = faixa(p[5], 0, 63, mb.f);
      let mudou = d !== mb.d || a !== mb.a || f !== mb.f;
      mb.d = d; mb.a = a; mb.f = f;
      const m = M.mapaDoPonto(x / 100, y / 100);
      if (m !== c.mapa) {
        // fora da caixa do mundo: só descarta. Em outro mapa: descarta (o g2-entrar troca de sala) e, sem o bit do teleporte, conta falta
        if (m && !(f & BIT.TELEPORTE)) falta(mb, `posição em ${m} sem trocar de sala`, t);
      } else if (confereMovimento(mb, x / 100, y / 100, f, t) && (x !== mb.x || y !== mb.y)) {
        mb.x = x; mb.y = y; mudou = true;
      }
      if (mudou && !suspenso(mb, t)) c.mudou.add(mb.id);
    });

    socket.on("g2-vis", (dados, cb) => {
      if (!meu() || !reg.mb || grande(dados)) return responde(cb, falha("sem_canal", "Você não está em nenhum mapa online agora."));
      const t = agora();
      if (t - ultimaVis < CFG.VIS_MS) return responde(cb, falha("rapido", "Calma! Espere um instante.", { esperaMs: CFG.VIS_MS - (t - ultimaVis) }));
      ultimaVis = t;
      const vis = limpaVis(dados?.vis);
      if (!mesmaVis(vis, reg.mb.vis)) {
        reg.mb.vis = vis;
        const c = canalDe(reg.mb);
        if (c) socket.to(quarto(c)).emit("g2-vis", { id: reg.id, vis });
      }
      responde(cb, { ok: true });
    });

    registrarChatG2({ nsp, socket, reg: meu, quarto, canalDe, agora });

    socket.on("disconnect", () => {
      if (reg.sock !== socket) return;   // (a aba substituída: o lugar ficou com a nova)
      reg.sock = null;
      if (socket.data.semCaindo) return apagaReg(reg);
      // "caindo": 5 s sem aparecer para ninguém novo; se o mesmo personagem voltar, reaproveita o lugar e o id
      reg.caindo = setTimeout(() => { reg.caindo = null; if (!reg.sock) apagaReg(reg); }, CFG.CAINDO_MS);
      reg.caindo.unref?.();
    });
  });

  return nsp;
}
