// Calcula o "mês vigente" sempre no horário de Brasília — não no fuso do
// servidor. Isso importa de verdade: se o servidor rodar em UTC (comum em
// serviços de nuvem) e a gente simplesmente usasse `new Date()` direto, o
// mês podia virar até 3 horas mais cedo do que realmente virou em Brasília,
// roubando pontos de quem jogou bem nos últimos minutos do último dia do
// mês (ex.: 23h de 31/mar em Brasília ainda é março, mas já seria 02h de
// 1/abr em UTC — o campeão do mês seria roubado no fim da hora).
export function currentMonthKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year").value;
  const month = parts.find((p) => p.type === "month").value;
  return `${year}-${month}`;
}

// Dado um monthKey (ex.: "2026-03"), retorna o monthKey do mês anterior —
// usado pra montar a página de histórico ("mês passado").
export function previousMonthKey(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const prevDate = new Date(Date.UTC(year, month - 2, 1)); // month é 1-indexed no monthKey
  return `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Formata um monthKey ("2026-03") pra algo legível ("Março de 2026").
export function formatMonthKey(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  const formatted = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

// Data de hoje ("2026-08-10") no horário de BRASÍLIA, não no fuso do
// servidor. Mesma armadilha do monthKey: o servidor roda em UTC, então
// `new Date().toISOString()` já virou o dia às 21h de Brasília — e as
// missões diárias e a sequência de dias virariam 3 horas mais cedo.
export function hojeBrasilia(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year").value;
  const m = parts.find((p) => p.type === "month").value;
  const d = parts.find((p) => p.type === "day").value;
  return `${y}-${m}-${d}`;
}

// Data de ontem em Brasília — usada pra saber se a sequência continua.
export function ontemBrasilia() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return hojeBrasilia(d);
}

// Semana ISO em Brasília ("2026-W33"). O cálculo precisa partir da data
// local, senão a semana também vira cedo demais na noite de domingo.
export function semanaBrasilia(date = new Date()) {
  const [ano, mes, dia] = hojeBrasilia(date).split("-").map(Number);
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  const diaSemana = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - diaSemana);
  const inicioAno = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const semana = Math.ceil(((d - inicioAno) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(semana).padStart(2, "0")}`;
}
