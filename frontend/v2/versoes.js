// VERSÃO de cada jogo, no formato vX.Y — Y são as unidades, X as dezenas
// (ex.: 17 alterações = v1.7). Cada número conta quantos ZIPS (entregas)
// mexeram de fato naquele jogo — não é um contador de commits do git.
//
// stop/quiz/acromania (zip 587): números ajustados pelo Gustavinho, pelo
// histórico real dele (maior que o que eu tinha contado no zip 586).
// mentira/tribunal: contados de verdade nos zips que eu tinha salvo (492 a
// 584) — cobre só a janela visível nesta conversa.
// A partir daqui, some 1 aqui sempre que uma entrega mexer no jogo (mesmo
// só no frontend).
export const ALTERACOES = {
  stop: 43,
  quiz: 32,
  acromania: 28,
  mentira: 31,
  tribunal: 13,
};

export function versaoTexto(jogo) {
  const n = ALTERACOES[jogo] ?? 0;
  return `v${Math.floor(n / 10)}.${n % 10}`;
}
