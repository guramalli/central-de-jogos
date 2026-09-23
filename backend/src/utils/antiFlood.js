// ANTI-FLOOD DOS CHATS (praça, Stop, Quiz e Acromania).
//
// O limite é por CONTA, não por conexão: antes era por socket, e quem abria
// três abas tinha três limites. Tudo em memória (um deploy zera — tudo bem:
// o objetivo é segurar o engraçadinho na hora, não guardar histórico).
//
// Regras (folgadas pra conversa normal, apertadas pra spam):
//   - no mínimo 900ms entre mensagens             -> recusa, sem punição;
//   - a MESMA mensagem só 2x por minuto          -> recusa, sem punição;
//   - mais de 8 mensagens em 20s                 -> SILENCIADO;
//   - silêncio cresce se a pessoa insiste: 1 min -> 5 min -> 30 min
//     (reincidência conta nos últimos 30 minutos).
// Admin e moderadores ficam fora (checado em socket/index.js).
//
// zip 619: intervalo entre mensagens estava pegando gente digitando rápido
// numa conversa normal, não só spam de verdade — 1,5s → 900ms, e a rajada
// (que também jogava nisso) foi de 5 em 15s pra 8 em 20s, dando mais fôlego
// pra uma sequência de mensagens curtas sem cair em silêncio à toa.
export const LIMITES = {
  intervaloMs: 900,
  rajada: 8,
  janelaRajadaMs: 20000,
  repeticoes: 2,
  janelaRepeticaoMs: 60000,
  silencios: [60000, 5 * 60000, 30 * 60000],
  janelaReincidenciaMs: 30 * 60000,
};

const contas = new Map(); // userId -> { envios: [ts], textos: [{ t, ts }], ate, silencios: [ts] }

const normalizar = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const minutos = (ms) => (ms >= 60000 ? `${Math.ceil(ms / 60000)} minuto${ms >= 120000 ? "s" : ""}` : `${Math.ceil(ms / 1000)} segundos`);

// { ok: true } ou { ok: false, mensagem, esperaMs, silenciado }
export function podeFalar(userId, texto, agora = Date.now()) {
  let c = contas.get(userId);
  if (!c) { c = { envios: [], textos: [], ate: 0, silencios: [] }; contas.set(userId, c); }
  if (c.ate > agora) {
    return { ok: false, silenciado: true, esperaMs: c.ate - agora, mensagem: `Você está silenciado por flood. Volte a falar em ${minutos(c.ate - agora)}.` };
  }
  c.envios = c.envios.filter((ts) => agora - ts < LIMITES.janelaRajadaMs);
  c.textos = c.textos.filter((x) => agora - x.ts < LIMITES.janelaRepeticaoMs);
  c.silencios = c.silencios.filter((ts) => agora - ts < LIMITES.janelaReincidenciaMs);

  // rajada: passou de 5 em 15s -> silencia (e cresce se reincidir)
  if (c.envios.length >= LIMITES.rajada) {
    const nivel = Math.min(c.silencios.length, LIMITES.silencios.length - 1);
    const dur = LIMITES.silencios[nivel];
    c.ate = agora + dur;
    c.silencios.push(agora);
    c.envios = [];
    return { ok: false, silenciado: true, esperaMs: dur, mensagem: `Calma! Muitas mensagens seguidas. Você foi silenciado por ${minutos(dur)}.` };
  }
  const ultima = c.envios[c.envios.length - 1];
  if (ultima && agora - ultima < LIMITES.intervaloMs) {
    return { ok: false, silenciado: false, esperaMs: LIMITES.intervaloMs - (agora - ultima), mensagem: "Devagar! Espere um instante entre as mensagens." };
  }
  const n = normalizar(texto);
  if (n && c.textos.filter((x) => x.t === n).length >= LIMITES.repeticoes) {
    c.envios.push(agora); // repetir em série também conta pra rajada
    return { ok: false, silenciado: false, esperaMs: LIMITES.janelaRepeticaoMs, mensagem: "Você já mandou essa mensagem. Evite repetir." };
  }
  c.envios.push(agora);
  c.textos.push({ t: n, ts: agora });
  return { ok: true };
}

// Limpa contas paradas há mais de 1 hora (não deixa o mapa crescer).
setInterval(() => {
  const agora = Date.now();
  for (const [uid, c] of contas) {
    const ultimo = Math.max(c.ate, ...c.envios, ...c.textos.map((x) => x.ts), 0);
    if (agora - ultimo > 3600000) contas.delete(uid);
  }
}, 10 * 60000).unref?.();

// Só pros testes.
export function __zerarAntiFlood() { contas.clear(); }
