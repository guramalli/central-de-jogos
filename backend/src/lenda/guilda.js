// ===== Lenda do Campinho — GUILDAS ("MMO leve", etapa 3) =====
//
// Público infantil: NADA de texto livre. O nome da guilda é montado com PARTES de listas fixas
// ("Os" / "As" + um bicho/coisa + um complemento, com a concordância certa), o escudo é um de ESCUDOS e a cor uma de CORES.
// - até MAX_MEMBROS; cargos: lider, vice, membro. Só entra por CONVITE de líder/vice, e só AMIGO de quem convida.
// - META SEMANAL: cada membro soma os adversários que derrota (o jogo manda de tempos em tempos, com teto);
//   a soma da guilda libera FAIXAS; cada membro que ajudou (pelo menos MIN_AJUDA) resgata o prêmio de cada faixa 1 vez.
// - ranking semanal das guildas.
// As regras ficam aqui (testáveis sem banco); as rotas estão em routes/lenda.js.

export const MAX_MEMBROS = 30;
export const NIVEL_CRIAR = 20;
export const MIN_AJUDA = 50;                       // pontos na semana para poder resgatar as faixas
export const METAS = [2000, 10000, 30000, 80000];  // adversários derrotados pela guilda na semana
export const TETO_POR_ENVIO = 400;                 // pontos por envio
export const ENVIO_MIN_MS = 45 * 1000;             // intervalo mínimo entre envios do mesmo jogador
// v407 (Raio-X U7): teto da SEMANA por membro (ninguém carrega a guilda sozinho com envios forjados). Quem caça muito
// ainda chega lá: 12 mil adversários numa semana é bem mais do que uma criança derrota jogando todo dia.
export const TETO_SEMANA_MEMBRO = 12000;
// quanto do envio ainda cabe na semana do membro
export const cabeNaSemana = (n, jaNaSemana) => Math.max(0, Math.min(n, TETO_SEMANA_MEMBRO - (jaNaSemana || 0)));

// [plural, gênero]
export const NOMES = [
  ["Leões", "m"], ["Águias", "f"], ["Tubarões", "m"], ["Dragões", "m"], ["Lobos", "m"], ["Panteras", "f"], ["Corujas", "f"],
  ["Tigres", "m"], ["Falcões", "m"], ["Raposas", "f"], ["Foguetes", "m"], ["Cometas", "m"], ["Estrelas", "f"], ["Feras", "f"],
  ["Craques", "m"], ["Titãs", "m"], ["Guardiões", "m"], ["Lendas", "f"], ["Fênix", "f"], ["Piratas", "m"], ["Ursos", "m"], ["Onças", "f"],
];
// [masculino, feminino] (iguais quando não muda)
export const COMPLEMENTOS = [
  ["de Fogo", "de Fogo"], ["do Trovão", "do Trovão"], ["do Campinho", "do Campinho"], ["da Vila", "da Vila"], ["da Lua", "da Lua"],
  ["das Estrelas", "das Estrelas"], ["do Mar", "do Mar"], ["do Gol", "do Gol"], ["da Várzea", "da Várzea"], ["do Futuro", "do Futuro"],
  ["Dourados", "Douradas"], ["Galácticos", "Galácticas"], ["Invencíveis", "Invencíveis"], ["Imparáveis", "Imparáveis"],
  ["Lendários", "Lendárias"], ["Azuis", "Azuis"], ["Vermelhos", "Vermelhas"], ["Velozes", "Velozes"], ["Furiosos", "Furiosas"],
  ["Brilhantes", "Brilhantes"], ["do Arco-Íris", "do Arco-Íris"], ["da Floresta", "da Floresta"],
];
export const ESCUDOS = ["🦁", "🦅", "🐉", "⚡", "🔥", "🌟", "⚽", "🛡️", "🐺", "🦈", "🚀", "👑", "🐯", "🦊", "🌙", "💎"];
export const CORES = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#1abc9c", "#3498db", "#9b59b6", "#ec407a"];
export const PAPEIS = ["lider", "vice", "membro"];

export function montaNome(n, c) {
  const nome = NOMES[n], comp = COMPLEMENTOS[c];
  if (!nome || !comp) return null;
  const f = nome[1] === "f";
  return `${f ? "As" : "Os"} ${nome[0]} ${f ? comp[1] : comp[0]}`;
}
const inteiro = (v) => (Number.isInteger(v) ? v : Number.isInteger(Number(v)) && String(v).trim() !== "" ? Number(v) : NaN);
export function validaCriacao({ nome, complemento, escudo, cor } = {}) {
  const n = inteiro(nome), c = inteiro(complemento), e = inteiro(escudo), k = inteiro(cor);
  if (!(n >= 0 && n < NOMES.length) || !(c >= 0 && c < COMPLEMENTOS.length)) return { erro: "Escolha o nome nas listas." };
  if (!(e >= 0 && e < ESCUDOS.length)) return { erro: "Escolha um escudo." };
  if (!(k >= 0 && k < CORES.length)) return { erro: "Escolha uma cor." };
  return { ok: true, partes: `${n}.${c}`, nomeTxt: montaNome(n, c), escudo: e, cor: k };
}
// semana do jogo: começa na segunda-feira 00:00 (horário de Brasília, UTC−3)
export function semanaId(agora = Date.now()) {
  const d = new Date(agora - 3 * 3600e3);
  const dia = (d.getUTCDay() + 6) % 7; // 0 = segunda
  const seg = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dia));
  return seg.toISOString().slice(0, 10);
}
export const faixasAtingidas = (pontos) => METAS.filter((m) => pontos >= m).length;
export const podeMexer = (papelEu, papelAlvo) => papelEu === "lider" ? papelAlvo !== "lider" : papelEu === "vice" ? papelAlvo === "membro" : false;
export const podeConvidar = (papel) => papel === "lider" || papel === "vice";
// pontos de um envio: inteiro, entre 0 e o teto; e nada se veio rápido demais
export function pontosDoEnvio(n, ultimoEnvio, agora = Date.now()) {
  const v = Math.floor(Number(n) || 0);
  if (!(v > 0)) return 0;
  if (ultimoEnvio && agora - ultimoEnvio < ENVIO_MIN_MS) return 0;
  return Math.min(v, TETO_POR_ENVIO);
}
// a semana virou: zera os pontos da semana (da guilda e do membro) antes de somar
export function normalizaSemana(reg, agora = Date.now()) {
  const s = semanaId(agora);
  if (reg.semana !== s) return { ...reg, semana: s, pontosSemana: 0, ...(reg.premios !== undefined ? { premios: 0 } : {}) };
  return reg;
}
export function resumoGuilda(g) {
  const [n, c] = String(g.partes || "0.0").split(".").map(Number);
  return { id: g.id, numero: g.numero ?? null, nome: montaNome(n, c) || "Guilda", escudo: ESCUDOS[g.escudo] || "🛡️", cor: CORES[g.cor] || CORES[0] };
}

// colegas de guilda (o grupo de caça aceita amigo OU colega de guilda)
export async function colegasDeGuilda(prisma, eu) {
  try {
    const m = await prisma.lendaGuildaMembro.findUnique({ where: { userId: eu } });
    if (!m) return [];
    return (await prisma.lendaGuildaMembro.findMany({ where: { guildaId: m.guildaId } })).map((x) => x.userId).filter((id) => id !== eu);
  } catch { return []; }
}
// a guilda de alguém (para o escudo em cima do nome no mundo compartilhado)
export async function guildaDe(prisma, eu) {
  try {
    const m = await prisma.lendaGuildaMembro.findUnique({ where: { userId: eu } });
    if (!m) return null;
    const g = await prisma.lendaGuilda.findUnique({ where: { id: m.guildaId } });
    return g ? resumoGuilda(g) : null;
  } catch { return null; }
}

