import { nivelPorNomeDeTitulo } from "../game/titulosConfig.js";

// Monta o nome do jogador com o título equipado ao lado, pra mensagem de
// entrada na sala: "Gustavinho (Elite do STOP)".
//
// A grafia salva é mantida como está — títulos podem ter 34 caracteres
// ("Conhecedor de Conhecimentos Gerais") e caixa alta neles fica agressiva
// no meio do chat.
export function nomeComTitulo(nickname, titulo) {
  if (!titulo) return nickname;
  return `${nickname} (${titulo})`;
}

// Dado que acompanha a mensagem de sistema pra o chat pintar o título na cor
// do material da medalha (bronze/prata/ouro).
//
// POR QUE MANDAR SEPARADO EM VEZ DE HTML:
// A mensagem continua sendo texto puro no campo `message` — qualquer lugar
// que renderize sem tratamento (ou uma versão antiga do frontend em aba
// aberta) mostra a frase inteira e correta, só sem cor. O frontend usa este
// objeto pra localizar o trecho "(título)" dentro da frase e envolvê-lo num
// span colorido, sem precisar remontar a frase — o que evitaria duplicar o
// texto "entrou na sala" no cliente e quebraria a saudação premium.
//
// Devolve null quando não há título ou quando o nível é desconhecido: aí a
// mensagem segue como texto simples, sem nenhum tratamento especial.
export function destaqueDeTitulo(titulo) {
  if (!titulo) return null;
  const nivel = nivelPorNomeDeTitulo(titulo);
  if (!nivel) return null;
  return { texto: titulo, nivel };
}
