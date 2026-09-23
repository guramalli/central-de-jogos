// Saneamento das respostas que o navegador manda durante a rodada do Stop.
//
// O que chega pelo socket vem do cliente e pode ter qualquer formato — um
// cliente adulterado pode mandar array, número, objeto aninhado, texto
// gigante ou chaves que nem são temas da rodada. Sem esta limpeza, um
// ".trim()" em cima de um número já derrubava a correção da rodada inteira
// e ninguém pontuava. Fica num arquivo separado (sem banco) pra dar pra
// testar isolado.

// Mesmo limite do campo no frontend (maxLength={40} em StopGame/AnswerTable).
export const MAX_RESPOSTA = 40;

// Devolve um objeto novo só com as chaves dos temas da rodada atual, cada
// valor como texto aparado e cortado no limite. Qualquer outra coisa é
// ignorada em silêncio — o jogador honesto nunca manda nada diferente disso.
export function sanitizarRespostas(answers, temas) {
  const limpo = {};
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return limpo;
  for (const tema of temas || []) {
    const chave = tema?.key;
    if (typeof chave !== "string") continue;
    // hasOwn: não deixa "constructor"/"__proto__" herdados virarem resposta.
    if (!Object.prototype.hasOwnProperty.call(answers, chave)) continue;
    const valor = answers[chave];
    if (typeof valor !== "string" && typeof valor !== "number") continue;
    limpo[chave] = String(valor).trim().slice(0, MAX_RESPOSTA);
  }
  return limpo;
}

// Sinais de comportamento (colou texto / corrigiu algo): só aceita objeto e
// reduz tudo a booleano. Qualquer outro formato vira "nada informado".
export function sanitizarComportamento(behavior) {
  if (!behavior || typeof behavior !== "object" || Array.isArray(behavior)) return null;
  return { pasted: !!behavior.pasted, corrected: !!behavior.corrected };
}
