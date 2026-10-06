// ===== Lenda do Campinho — limites pequenos de convivência (v407, Raio-X U5/U7) =====
// Tudo na memória do servidor (um reinício zera — no pior caso a pessoa ganha mais uma chance naquele dia).
// Funções puras com o relógio injetável, testadas em test/lenda/limites.test.js.

// dia no horário de Brasília (número do dia)
const diaBR = (agora) => Math.floor((agora - 3 * 3600e3) / 864e5);
function limpa(mapa, dia, max = 50000) { if (mapa.size > max) for (const [k, v] of mapa) if ((v.dia ?? v) !== dia) mapa.delete(k); }

// ---------- visitas de casa: 1 por visitante por dia em cada casa (U7) ----------
const visitas = new Map(); // "visitante|dono" -> dia
export function contaVisita(quem, dono, agora = Date.now()) {
  const dia = diaBR(agora), k = quem + "|" + dono;
  if (visitas.get(k) === dia) return false;
  limpa(visitas, dia); visitas.set(k, dia);
  return true;
}

// ---------- pedidos de amizade: no máximo PEDIDOS_DIA por conta por dia (U5) ----------
export const PEDIDOS_DIA = 15;
const pedidos = new Map(); // userId -> { dia, n }
export function podePedirAmizade(userId, agora = Date.now()) {
  const dia = diaBR(agora), e = pedidos.get(userId);
  if (!e || e.dia !== dia) { limpa(pedidos, dia); pedidos.set(userId, { dia, n: 1 }); return true; }
  if (e.n >= PEDIDOS_DIA) return false;
  e.n++; return true;
}

// ---------- denúncia: motivos PRONTOS (sem texto livre), e limites (U5) ----------
export const MOTIVOS_DENUNCIA = [
  "Nome ou apelido feio",
  "Está me incomodando ou me seguindo",
  "Pediu dados pessoais (telefone, endereço, foto, rede social)",
  "Está trapaceando",
  "Outro problema",
];
export const DENUNCIAS_DIA = 10;
const denuncias = new Map(); // userId -> { dia, n, alvos: Set }
export function validarDenuncia(corpo) {
  const alvoId = String(corpo?.alvoId || "").trim();
  const motivo = Math.round(Number(corpo?.motivo));
  if (!/^[A-Za-z0-9_-]{5,40}$/.test(alvoId)) return { ok: false, erro: "Jogador inválido." };
  if (!(motivo >= 0 && motivo < MOTIVOS_DENUNCIA.length)) return { ok: false, erro: "Escolha um motivo." };
  const onde = typeof corpo?.onde === "string" && /^[a-z0-9_]{1,40}$/.test(corpo.onde) ? corpo.onde : null;
  return { ok: true, alvoId, motivo, onde };
}
// pode denunciar? (até DENUNCIAS_DIA por dia; o mesmo jogador 1 vez por dia)
export function podeDenunciar(userId, alvoId, agora = Date.now()) {
  const dia = diaBR(agora); let e = denuncias.get(userId);
  if (!e || e.dia !== dia) { limpa(denuncias, dia); e = { dia, n: 0, alvos: new Set() }; denuncias.set(userId, e); }
  if (e.alvos.has(alvoId)) return { ok: false, erro: "Você já avisou a equipe sobre esse jogador hoje. Obrigado!" };
  if (e.n >= DENUNCIAS_DIA) return { ok: false, erro: "Você já mandou muitos avisos hoje. Se for urgente, chame um adulto." };
  e.n++; e.alvos.add(alvoId);
  return { ok: true };
}
export function __zeraLimites() { visitas.clear(); pedidos.clear(); denuncias.clear(); }
