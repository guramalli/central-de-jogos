// ===== Ghotin2 — o CHAT do modo online (fase 1): o chat do mapa, o chat global e a denúncia =====
//
// Plano: jogorpg/Logs/MMO/PLANO_FASE1.md (2.3, 2.4 e 2.5). Contrato: jogorpg/Logs/MMO/API_MUNDO.md.
// Registrado pelo socketMundo.js em cada conexão do namespace /ghotin2. Tudo em memória, nada no banco (na fase 2, a
// denúncia vira a tabela Ghotin2Denuncia e a tela do admin).
//
// Diferente do Lenda (público infantil, só frases prontas), aqui o texto é livre (o cadastro pede "13 anos ou mais"), então:
//   - o filtro de palavrões do site (lenda/filtroNome.js, palavraProibida): a palavra reprovada vira "***";
//   - o contato (telefone, @, links, o nome das redes) vira "***", e a mensagem que é só contato é recusada;
//   - o anti-flood do site (utils/antiFlood.js, podeFalar), por conta: 900 ms, repetição, rajada e silêncio crescente;
//   - o global (decisão do usuário, 19/11): só do nível 10 para cima, uma fala a cada 15 s por conta;
//   - até 120 caracteres (o resto é cortado), nos dois canais;
//   - o silenciar é LOCAL (no navegador de quem silencia, como o MO_MUDOS do Lenda): o servidor não guarda;
//   - g2-denunciar {id}: guarda as últimas 20 falas daquele id num log em memória e avisa no console.
//
// Eventos:
//   g2-falar {canal: "mapa"|"global", txt} → callback {ok: true} ou {erro, codigo, esperaMs?}
//   g2-fala (servidor → o canal do mapa, ou todos do namespace) {id, nome, nivel, classe, canal, txt}
//   g2-denunciar {id} → callback {ok: true} ou {erro, codigo}
import { podeFalar, __zerarAntiFlood } from "../utils/antiFlood.js";
import { palavraProibida } from "../lenda/filtroNome.js";

export const CHAT = {
  maxTxt: 120,
  globalNivelMin: 10,
  globalCadaMs: 15_000,
  falasPorId: 20,           // o log da denúncia: as últimas 20 falas de cada id
  logIdsMax: 5000,          // quantos ids o log guarda (o mais velho sai)
  logMs: 30 * 60_000,       // falas mais velhas que isso não entram na denúncia
  denunciaCadaMs: 10_000,   // uma denúncia a cada 10 s por conta
  denunciasMax: 200,        // as últimas 200 denúncias ficam na memória
};

const ultimaGlobal = new Map();    // contaId -> hora da última fala no global
const ultimaDenuncia = new Map();  // contaId -> hora da última denúncia
const logFalas = new Map();        // id curto -> { nome, pid, falas: [{ em, canal, txt, original }] }
export const __denunciasG2 = [];   // [{ em, de: {pid, nome}, contra: {id, pid, nome}, falas }]

export function __resetChatG2() { ultimaGlobal.clear(); ultimaDenuncia.clear(); logFalas.clear(); __denunciasG2.length = 0; __zerarAntiFlood(); }

// ---------------------------------------------------------------- o filtro do texto
const CONTROLE = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/g;
const RX_LINK = /(?:https?:\/\/|www\.)\S+/gi;
const RX_DOMINIO = /\b[\w-]+(?:\.[\w-]+)*\.(?:com|net|org|br|gg|io|me|tv|xyz|ly|app|site|online|link|info|biz)\b\S*/gi;
const RX_ARROBA = /@[\w.]{2,}/g;
const RX_FONE = /\+?\d[\d\s().-]{6,}\d/g;          // (só vira contato com 8 dígitos ou mais)
const REDES = new Set(["zap", "zapzap", "whats", "whatsapp", "wpp", "wpp", "insta", "instagram", "tiktok", "discord", "telegram", "telegran", "facebook", "face", "twitter", "kwai", "snap", "snapchat"]);
const base = (s) => String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const nucleo = (tok) => tok.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");   // a palavra sem a pontuação em volta

// Limpa e filtra uma fala. Devolve { ok: true, txt } ou { ok: false, codigo, erro }.
export function filtraFala(entrada) {
  if (typeof entrada !== "string") return { ok: false, codigo: "vazio", erro: "Escreva alguma coisa." };
  let txt = entrada.replace(CONTROLE, " ").replace(/\s+/g, " ").trim();
  txt = Array.from(txt).slice(0, CHAT.maxTxt).join("").trim();   // (corta sem partir emoji)
  if (!txt) return { ok: false, codigo: "vazio", erro: "Escreva alguma coisa." };
  let contatos = 0;
  const tira = () => { contatos++; return "***"; };
  txt = txt.replace(RX_LINK, tira).replace(RX_DOMINIO, tira).replace(RX_ARROBA, tira)
    .replace(RX_FONE, (m) => ((m.match(/\d/g) || []).length >= 8 ? tira() : m));
  // palavra por palavra (os espaços ficam como estão)
  const toks = txt.split(/(\s+)/);
  const palavras = [];   // os índices dos tokens que são palavras
  toks.forEach((t, i) => { if (t && !/^\s+$/.test(t)) palavras.push(i); });
  for (const i of palavras) {
    const n = nucleo(toks[i]);
    if (!n || toks[i] === "***") continue;
    if (REDES.has(base(n))) { toks[i] = tira(); continue; }
    if (palavraProibida(n)) toks[i] = "***";
  }
  // letras soltas seguidas viram uma palavra só ("p u t a", "f d p")
  for (let k = 0; k < palavras.length; k++) {
    let j = k, junto = "";
    while (j < palavras.length && nucleo(toks[palavras[j]]).length === 1) junto += nucleo(toks[palavras[j++]]);
    if (j - k > 1 && palavraProibida(junto)) for (let q = k; q < j; q++) toks[palavras[q]] = "***";
    if (j > k) k = j - 1;
  }
  txt = toks.join("");
  // a mensagem que é só contato (sem duas letras fora dos "***") é recusada
  if (contatos && (txt.replace(/\*\*\*/g, "").match(/\p{L}/gu) || []).length < 2) {
    return { ok: false, codigo: "contato", erro: "Não mande contato (telefone, @, links ou redes) no chat." };
  }
  return { ok: true, txt };
}

// ---------------------------------------------------------------- o log das falas (para a denúncia)
function guardaFala(id, pers, canal, txt, original, em) {
  let l = logFalas.get(id);
  if (l) logFalas.delete(id);   // (volta para o fim da fila: o mais velho é o primeiro do Map)
  else l = { falas: [] };
  l.nome = pers.nome; l.pid = pers.pid;
  l.falas.push({ em, canal, txt, original });
  if (l.falas.length > CHAT.falasPorId) l.falas.splice(0, l.falas.length - CHAT.falasPorId);
  logFalas.set(id, l);
  while (logFalas.size > CHAT.logIdsMax) logFalas.delete(logFalas.keys().next().value);
}

// ---------------------------------------------------------------- os eventos de uma conexão
// ctx: { nsp, socket, reg: () => o registro da conta (ou null se a aba foi substituída), quarto: (canal) => sala,
//        canalDe: (membro) => o canal, agora: () => ms }
export function registrarChatG2(ctx) {
  const { nsp, socket } = ctx;
  const responde = (cb, x) => { if (typeof cb === "function") cb(x); };
  const falha = (codigo, erro, extra = {}) => ({ erro, codigo, ...extra });
  const grande = (d) => { try { return JSON.stringify(d ?? null).length > 1024; } catch { return true; } };

  socket.on("g2-falar", (dados, cb) => {
    try {
      const r = ctx.reg(); if (!r) return responde(cb, falha("substituido", "O jogo foi aberto em outra aba."));
      if (grande(dados)) return responde(cb, falha("grande", "Mensagem grande demais."));
      const canal = dados?.canal === "global" ? "global" : dados?.canal === "mapa" ? "mapa" : null;
      if (!canal) return responde(cb, falha("canal_invalido", "Canal de chat inválido."));
      const p = r.noMundo ? r.pers : null; if (!p) return responde(cb, falha("sem_personagem", "Entre no mundo primeiro."));
      const c = canal === "mapa" ? ctx.canalDe(r.mb) : null;
      if (canal === "mapa" && !c) return responde(cb, falha("sem_canal", "Você não está em nenhum mapa online agora."));
      const f = filtraFala(dados?.txt);
      if (!f.ok) return responde(cb, falha(f.codigo, f.erro));
      const t = ctx.agora();
      if (canal === "global") {
        if (p.nivel < CHAT.globalNivelMin) return responde(cb, falha("nivel_baixo", `O chat global abre no nível ${CHAT.globalNivelMin}.`));
        const espera = (ultimaGlobal.get(r.conta) || -Infinity) + CHAT.globalCadaMs - t;
        if (espera > 0) return responde(cb, falha("espera", `No chat global, uma fala a cada ${CHAT.globalCadaMs / 1000} s. Espere ${Math.ceil(espera / 1000)} s.`, { esperaMs: espera }));
      }
      const pf = podeFalar("g2:" + r.conta, f.txt, t);   // ("g2:": as contas do Ghotin2 não se misturam com as do site)
      if (!pf.ok) {
        if (pf.silenciado) socket.emit("g2-aviso", { codigo: "silenciado", txt: pf.mensagem });
        return responde(cb, falha(pf.silenciado ? "silenciado" : "flood", pf.mensagem, { esperaMs: pf.esperaMs }));
      }
      if (canal === "global") {
        ultimaGlobal.set(r.conta, t);
        if (ultimaGlobal.size > 5000) for (const [k, v] of ultimaGlobal) if (t - v > CHAT.globalCadaMs) ultimaGlobal.delete(k);
      }
      guardaFala(r.id, p, canal, f.txt, String(dados.txt).slice(0, CHAT.maxTxt * 2), t);
      const fala = { id: r.id, nome: p.nome, nivel: p.nivel, classe: p.classe, canal, txt: f.txt };
      if (canal === "mapa") nsp.to(ctx.quarto(c)).emit("g2-fala", fala);   // (volta também para quem falou: a linha do chat vem daqui)
      else nsp.emit("g2-fala", fala);                                      // (o global vai para todos os conectados)
      responde(cb, { ok: true });
    } catch (e) {
      console.error("[ghotin2-mundo] g2-falar", e && e.message);
      responde(cb, falha("fora_do_ar", "O chat volta em instantes."));
    }
  });

  socket.on("g2-denunciar", (dados, cb) => {
    const r = ctx.reg(); if (!r) return responde(cb, falha("substituido", "O jogo foi aberto em outra aba."));
    const id = Number(dados?.id);
    if (!Number.isInteger(id) || id <= 0) return responde(cb, falha("id_invalido", "Jogador inválido."));
    if (id === r.id) return responde(cb, falha("id_invalido", "Você não pode denunciar a si mesmo."));
    const t = ctx.agora();
    if (t - (ultimaDenuncia.get(r.conta) || -Infinity) < CHAT.denunciaCadaMs) return responde(cb, falha("espera", "Espere um pouco para denunciar de novo."));
    const l = logFalas.get(id);
    const falas = l ? l.falas.filter((x) => t - x.em < CHAT.logMs).map((x) => ({ ...x })) : [];
    if (!l || !falas.length) return responde(cb, falha("sem_falas", "Esse jogador não falou nada nos últimos minutos."));
    ultimaDenuncia.set(r.conta, t);
    const de = r.pers ? { pid: r.pers.pid, nome: r.pers.nome } : { pid: null, nome: null };
    __denunciasG2.push({ em: new Date(t).toISOString(), de, contra: { id, pid: l.pid, nome: l.nome }, falas });
    if (__denunciasG2.length > CHAT.denunciasMax) __denunciasG2.splice(0, __denunciasG2.length - CHAT.denunciasMax);
    console.warn(`[ghotin2-mundo] denúncia: ${de.nome || "?"} (personagem ${de.pid || "?"}) denunciou ${l.nome} (personagem ${l.pid}), ${falas.length} falas guardadas`);
    responde(cb, { ok: true });
  });
}
