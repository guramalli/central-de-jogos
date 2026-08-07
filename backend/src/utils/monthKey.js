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
