// ===== Lenda do Campinho — nome do TIME do jogador (só de listas prontas) =====
//
// v407 (Raio-X U1: "nada de texto livre público"). O nome do time que aparece no
// ranking e na ficha pública era digitado pelo jogador (livre). Agora o jogo
// manda só as PARTES escolhidas de duas listas fixas ("p.l": prefixo + lugar),
// do mesmo jeito que a guilda — e o nome é montado AQUI. Nome livre que chegue
// (jogo antigo, save antigo) é ignorado.
//
// ATENÇÃO: as listas são as mesmas do jogo (js/online_seguro.js, OSG_TIME_*).
// Nunca mude a ordem nem apague nomes: só ACRESCENTE no fim (senão o time de
// quem já escolheu muda de nome).

export const TIME_PREFIXOS = ["Esporte Clube", "Grêmio", "Atlético", "Unidos do", "Sociedade Esportiva", "Real", "Independente",
  "Juventude do", "Estrela do", "Operário", "Ferroviário", "Associação", "Clube Atlético", "União do"];
export const TIME_LUGARES = ["Campinho", "Poeirão", "Morro Alto", "Ladeira", "Pombal", "Coqueiral", "Areia Branca", "Serra Azul",
  "Rio Seco", "Pedra Lisa", "Lagoa Verde", "Cajueiro", "Mangueiral", "Ventania", "Trovão", "Beira-Mar", "Vale Verde",
  "Alto da Colina", "Barro Vermelho", "Pau-Brasil", "Sol Nascente", "Quebra-Canela", "Boa Vista", "Porto Alegre do Norte",
  "Ribeirão Fundo", "Chapadão", "Maracujá", "Bananal", "Jatobá", "Ipê Amarelo", "Buriti", "Cachoeirinha", "Pedra Branca",
  "Vila Nova", "Canoas", "Monte Verde", "Três Coqueiros", "Carnaubal", "Sertãozinho", "Mangue Seco", "Arraial", "Ponte Velha",
  "Siriema", "Tucano", "Jabuticabal", "Morro do Sabiá", "Lajedo", "Aroeira"];

// "3.12" → { p: 3, l: 12 } (ou null)
export function lePartesTime(partes) {
  const m = typeof partes === "string" ? partes.match(/^(\d{1,3})\.(\d{1,3})$/) : null;
  if (!m) return null;
  const p = Number(m[1]), l = Number(m[2]);
  if (p >= TIME_PREFIXOS.length || l >= TIME_LUGARES.length) return null;
  return { p, l };
}
export function montaNomeTime(partes) {
  const x = lePartesTime(partes);
  return x ? `${TIME_PREFIXOS[x.p]} ${TIME_LUGARES[x.l]}` : null;
}
// o que sai para o público: o nome SEMPRE remontado das partes (o "nome" guardado nunca é usado)
export function timePublico(t) {
  if (!t || typeof t !== "object") return null;
  const div = Number.isInteger(t.div) ? t.div : 0, titulos = Number.isInteger(t.titulos) ? t.titulos : 0;
  const partes = lePartesTime(t.partes) ? t.partes : null;
  return { nome: montaNomeTime(partes), partes, div, titulos };
}
