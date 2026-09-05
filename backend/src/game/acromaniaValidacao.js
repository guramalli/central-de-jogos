// VALIDAÇÃO DA FRASE DO ACROMANIA
//
// A frase precisa ter uma palavra começando por cada letra sorteada, na
// ordem. Sem isso o jogo não é jogo: dava pra escrever qualquer coisa e
// concorrer aos votos igual a quem respeitou as letras.
//
// PALAVRAS DE LIGAÇÃO
// Em português é impossível jogar sem elas: "Pão de queijo delicioso" para
// P Q D só passa se "de" for ignorado. O acro americano permite o mesmo
// ("and", "of", "the"). A lista é curta de propósito — quanto maior, mais
// fácil burlar enfiando palavras longas no meio.
//
// A ORDEM DA CHECAGEM IMPORTA: primeiro tenta casar a palavra com a letra
// esperada, e só se não casar é que ela é tratada como ligação. Sem isso,
// uma rodada com a letra "E" recusaria a frase de quem usou "Estrela",
// não — pior: recusaria quem legitimamente usou a palavra "e" como a
// palavra da letra E, porque ela seria descartada antes de ser testada.
const LIGACOES = new Set([
  "de", "da", "do", "das", "dos",
  "a", "o", "as", "os", "ao", "aos", "à", "às",
  "um", "uma", "uns", "umas",
  "no", "na", "nos", "nas", "num", "numa",
  "em", "com", "por", "pra", "para", "que", "e",
]);

// Tira acento e deixa minúsculo, pra "Água" casar com a letra A.
function normalizar(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Divide em palavras ignorando pontuação. Hífen separa: "guarda-chuva" vira
// duas palavras, o que é generoso com o jogador de propósito.
function palavrasDe(frase) {
  return normalizar(frase)
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean);
}

/**
 * Tenta casar as palavras com as letras testando TODOS os caminhos.
 *
 * Casamento guloso não serve: em "Casa e escola" com as letras C e E, se o
 * "e" for consumido como a letra E, sobra "escola" e a frase é recusada — mas
 * a leitura certa é "e" como ligação e "escola" como a palavra do E. Quando
 * uma palavra serve pras duas coisas, os dois caminhos precisam ser testados.
 *
 * O custo é irrelevante: frases têm no máximo 200 caracteres e a memória
 * corta os estados repetidos.
 */
function casa(palavras, esperadas) {
  const visto = new Set();

  function tentar(p, l) {
    if (p === palavras.length) return l === esperadas.length;
    const chave = `${p}:${l}`;
    if (visto.has(chave)) return false;
    visto.add(chave);

    const palavra = palavras[p];

    // Caminho 1: esta palavra é a da letra esperada.
    if (l < esperadas.length && palavra[0] === esperadas[l] && tentar(p + 1, l + 1)) {
      return true;
    }
    // Caminho 2: esta palavra é de ligação e não consome letra.
    if (LIGACOES.has(palavra) && tentar(p + 1, l)) return true;

    return false;
  }

  return tentar(0, 0);
}

/**
 * @returns {{ok: boolean, motivo?: string}}
 */
export function validarFrase(frase, letras) {
  const palavras = palavrasDe(frase);
  if (palavras.length === 0) return { ok: false, motivo: "Escreva alguma coisa." };

  const esperadas = (letras || []).map((l) => normalizar(l));
  if (esperadas.length === 0) return { ok: true };

  if (casa(palavras, esperadas)) return { ok: true };

  // Recusou: a mensagem vem de uma passada gulosa, só pra apontar onde a
  // frase saiu do trilho. É aproximada por natureza (existe mais de uma
  // leitura possível), mas serve pra orientar quem está escrevendo.
  let i = 0;
  for (const palavra of palavras) {
    if (i < esperadas.length && palavra[0] === esperadas[i]) {
      i += 1;
      continue;
    }
    if (LIGACOES.has(palavra)) continue;
    if (i >= esperadas.length) {
      return { ok: false, motivo: `Sobrou palavra depois da última letra ("${palavra}").` };
    }
    return {
      ok: false,
      motivo: `A palavra "${palavra}" deveria começar com ${esperadas[i].toUpperCase()}.`,
    };
  }

  const faltando = esperadas.slice(i).map((l) => l.toUpperCase()).join(", ");
  return { ok: false, motivo: `Faltou palavra começando com ${faltando}.` };
}
