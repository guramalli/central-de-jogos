// PATENTES DO ACROMANIA
//
// Antes o Acromania usava a escada do Stop como provisório, e isso estava
// simplesmente quebrado: a economia dos dois jogos não tem relação nenhuma.
// O Stop rende ~6.240 pts/hora e o topo dele é 380.000. O Acromania rende
// ~1.100 pts/hora — chegar em 380.000 exigiria 19 horas por dia. Na prática
// o jogador ficava preso na primeira patente pra sempre.
//
// A RÉGUA É TEMPO (mesma dos outros jogos): patente máxima em ~2h/dia
// durante o mês, ou seja ~60 horas. A 1.100 pts/hora isso dá ~66.000.
// O topo ficou em 80.000, acima da conta, de propósito: a regra de ouro do
// projeto diz que BAIXAR limiar só promove, SUBIR rebaixa. Errar pra cima é
// reversível sem tirar patente de ninguém; errar pra baixo, não.
//
// A escada segue a mesma curva do Stop (proporções idênticas), só que
// reescalada — assim a sensação de progresso é a mesma nos três jogos.
//
// ARTE: /ranks-acromania/. Hoje são CÓPIAS das artes do Stop, renomeadas —
// pra não deixar imagem quebrada até a arte própria existir. Quando ela
// ficar pronta, é só sobrescrever os arquivos com os mesmos nomes: nenhuma
// linha de código muda. Nome de arquivo novo não exige subir a VERSAO do
// service worker, mas SOBRESCREVER exige (ver §8: cache-first prende arquivo
// de nome fixo).
//
// POR QUE ESTES OBJETOS, e não lápis/caneta/pena como antes:
// a 34px — o tamanho real na lista de jogadores — os três viravam o mesmo
// risco diagonal, indistinguíveis. É a mesma armadilha do "emblema a 34px
// vira disco uniforme". O que separa emblema pequeno é a SILHUETA EXTERNA,
// não o detalhe: balão (redondo com rabicho), megafone (cone), microfone
// (vertical), coroa (pontas). Dá pra identificar sem enxergar detalhe.
//
// A progressão também faz mais sentido pro jogo: o Acromania não é sobre
// escrever, é sobre a sala rir e votar. Vai da voz tímida à voz que a
// plateia escuta.
export const ACROMANIA_RANKS = [
  { min: 0,     key: "balao_bronze",     name: "Balão de Bronze",     icon: "/ranks-acromania/balao-bronze.png" },
  { min: 100,   key: "balao_prata",      name: "Balão de Prata",      icon: "/ranks-acromania/balao-prata.png" },
  { min: 300,   key: "balao_ouro",       name: "Balão de Ouro",       icon: "/ranks-acromania/balao-ouro.png" },
  { min: 1000,  key: "megafone_bronze",  name: "Megafone de Bronze",  icon: "/ranks-acromania/megafone-bronze.png" },
  { min: 3000,  key: "megafone_prata",   name: "Megafone de Prata",   icon: "/ranks-acromania/megafone-prata.png" },
  { min: 8000,  key: "megafone_ouro",    name: "Megafone de Ouro",    icon: "/ranks-acromania/megafone-ouro.png" },
  { min: 15000, key: "microfone_bronze", name: "Microfone de Bronze", icon: "/ranks-acromania/microfone-bronze.png" },
  { min: 23000, key: "microfone_prata",  name: "Microfone de Prata",  icon: "/ranks-acromania/microfone-prata.png" },
  { min: 34000, key: "microfone_ouro",   name: "Microfone de Ouro",   icon: "/ranks-acromania/microfone-ouro.png" },
  { min: 46000, key: "coroa_bronze",     name: "Coroa de Bronze",     icon: "/ranks-acromania/coroa-bronze.png" },
  { min: 62000, key: "coroa_prata",      name: "Coroa de Prata",      icon: "/ranks-acromania/coroa-prata.png" },
  // Brilha, mas NÃO é exclusiva (ver comentário do zip 217).
  { min: 80000, key: "coroa_ouro",       name: "Coroa de Ouro",       icon: "/ranks-acromania/coroa-ouro.png", brilha: true },
];

export function getAcromaniaRankForPoints(points) {
  let current = ACROMANIA_RANKS[0];
  for (const r of ACROMANIA_RANKS) {
    if (points >= r.min) current = r;
    else break;
  }
  return current;
}

export function getAcromaniaNextRankInfo(points) {
  const next = ACROMANIA_RANKS.find((r) => r.min > points);
  if (!next) return null;
  // O NOME dos campos importa: o tooltip do perfil lê `pointsNeeded`, igual
  // faz com o Stop e o Quiz. Devolver `faltam` aqui fazia a tela escrever
  // "Faltam undefined pra Caneta de Prata".
  return { name: next.name, pointsNeeded: next.min - points };
}
