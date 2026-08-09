// Checa se um texto ao menos PARECE uma palavra de português.
//
// Usado na Sala da Zoeira, onde os temas são subjetivos e não existe
// glossário pra conferir. Sem nenhuma checagem, dava pra pontuar digitando
// só a letra sorteada ("m") ou batendo o teclado ("mhudueieh").
//
// Não é um dicionário: a ideia não é garantir que a palavra existe, e sim
// barrar o que é obviamente lixo. Erra pro lado de aceitar — é melhor
// deixar passar uma bobagem (a galera ri e segue o jogo) do que rejeitar
// uma resposta criativa de verdade.

const VOGAIS = "aeiou";

// Encontros de consoantes que podem abrir uma palavra em português.
// Qualquer outro par de consoantes no início denuncia teclado batido.
const INICIOS_CONSOANTAIS = new Set([
  "bl", "br",
  "cl", "cr", "ch",
  "dr",
  "fl", "fr",
  "gl", "gr", "gu", "gn",
  "lh",
  "mn",
  "nh",
  "pl", "pr", "ps", "pn",
  "qu",
  "sc",
  "tl", "tr", "tm",
  "vl", "vr",
  "xn",
]);

export function pareceePalavraReal(texto) {
  const s = String(texto || "").toLowerCase().trim();

  // Muito curta: uma ou duas letras quase nunca é resposta de verdade, e é
  // o caso mais comum de "não tive ideia, deixo só a letra".
  if (s.length < 3) return false;

  // Sem nenhuma vogal não existe palavra em português.
  if (![...s].some((c) => VOGAIS.includes(c))) return false;

  // Mesma letra três vezes seguidas ("mmmm", "kkkk") é teclado batido.
  if (/(.)\1\1/.test(s)) return false;

  // A segunda letra precisa ser vogal ou formar um encontro consonantal
  // que exista no português. É o que pega "mhudueieh" e afins.
  const segunda = s[1];
  if (!VOGAIS.includes(segunda) && !INICIOS_CONSOANTAIS.has(s.slice(0, 2))) {
    return false;
  }

  return true;
}
