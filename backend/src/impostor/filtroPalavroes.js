// Filtro de palavrões das DICAS do Impostor.
//
// Nenhum outro jogo do portal tem filtro, então esta lista é só do Impostor
// e pequena de propósito. Compara a dica INTEIRA (e cada pedaço separado por
// hífen), sem acento e em minúsculas — não procura "dentro" da palavra,
// senão "cu" barraria "cupim", "escudo", "curral"...
//
// FICARAM DE FORA palavras que são dica legítima em algum tema: veado e
// macaco (Animais), rabo, pica-pau, rola(-bosta), pau(-brasil), bunda.
const LISTA = [
  "porra", "caralho", "cacete", "buceta", "boceta", "xoxota", "piroca",
  "cu", "cuzao", "foda", "fodase", "foder", "fodido", "merda",
  "puta", "puto", "putaria", "vadia", "vagabunda", "vagabundo", "arrombado",
  "arrombada", "viado", "bicha", "sapatao", "otario", "otaria",
  "babaca", "corno", "punheta", "siririca", "prr",
  "krl", "vsf", "pqp", "fdp", "tnc", "vtnc", "retardado",
];

const PROIBIDAS = new Set(LISTA);

function limpar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function ehPalavrao(texto) {
  const t = limpar(texto);
  if (!t) return false;
  const pedacos = [t.replace(/[^a-z0-9]/g, ""), ...t.split(/[-_.]+/)];
  return pedacos.some((p) => PROIBIDAS.has(p.replace(/[^a-z0-9]/g, "")));
}
