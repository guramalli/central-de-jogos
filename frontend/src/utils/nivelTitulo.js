// Descobre o nível (bronze/prata/ouro) de um título a partir do caminho da
// logo, pra colorir o nome de acordo com o material da medalha.
//
// POR QUE PELO NOME DO ARQUIVO:
// O backend já manda `tituloExibidoLogo` pronto, e a convenção de nomes
// carrega o nível no final: `titulo-<tema>-<nivel>.png`,
// `titulo-stop-<grupo>-<nivel>.png`, `titulo-rapido-<nivel>.png`.
// Conferido nos 59 emblemas: 19 bronze, 20 prata, 20 ouro — 100% detectável.
//
// A alternativa seria o servidor mandar o nível num campo novo. Não vale:
// exigiria mexer em endpoint e no schema pra uma informação que já está
// embutida no dado que chega. Se algum dia a convenção de nomes mudar, isto
// devolve null e o nome do título volta à cor padrão — degrada sem quebrar.
export function nivelDoTitulo(caminhoDaLogo) {
  if (typeof caminhoDaLogo !== "string") return null;
  const achado = caminhoDaLogo.match(/-(bronze|prata|ouro)\.png$/i);
  return achado ? achado[1].toLowerCase() : null;
}

// Classe CSS correspondente, ou string vazia quando o nível é desconhecido
// (aí o elemento fica com a cor padrão dele).
export function classeDoNivel(caminhoDaLogo) {
  const nivel = nivelDoTitulo(caminhoDaLogo);
  return nivel ? `titulo-nivel-${nivel}` : "";
}
