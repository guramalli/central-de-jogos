// PATENTES DO ACROMANIA
//
// Antes o Acromania usava a escada do Stop como provisório, e isso estava
// simplesmente quebrado: a economia dos dois jogos não tem relação nenhuma.
// O Stop rende ~6.240 pts/hora e o topo dele é 380.000. O Acromania rende
// ~1.100 pts/hora — chegar em 380.000 exigiria 19 horas por dia. Na prática
// o jogador ficava preso na primeira patente pra sempre.
//
// A RÉGUA É TEMPO (mesma dos outros jogos): patente máxima em ~2h/dia
// durante o mês, ou seja ~60 horas.
//
// HISTÓRICO: o topo nasceu em 80.000, calculado quando o ciclo era fixo em
// 90s e só o vencedor pontuava (~1.100 pts/hora). Depois disso a escrita e a
// votação passaram a encerrar assim que todos respondem (ciclo típico caiu
// pra ~49s) e entraram três formas novas de pontuar: voto certeiro, primeiro
// a enviar e bônus de fim de partida. O ganho real subiu pra ~2.800 pts/hora
// com 4 jogadores, e o topo virava alcançável em 1h/dia — metade do alvo.
//
// Recalculado: 160.000 dá 2,0h/dia com 4 jogadores e 2,3h com 5. Todos os
// degraus dobraram, então a curva de progresso é exatamente a mesma.
//
// SUBIR limiar REBAIXA (a regra de ouro só permite baixar sem avisar). Foi
// feito no começo de setembro, com o jogo em testes e a patente zerando dia
// 1º de qualquer forma — o momento mais barato possível. Refazer isso mais
// tarde custa muito mais caro.
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
  { min: 200,   key: "balao_prata",      name: "Balão de Prata",      icon: "/ranks-acromania/balao-prata.png" },
  { min: 600,   key: "balao_ouro",       name: "Balão de Ouro",       icon: "/ranks-acromania/balao-ouro.png" },
  { min: 2000,  key: "megafone_bronze",  name: "Megafone de Bronze",  icon: "/ranks-acromania/megafone-bronze.png" },
  { min: 6000,  key: "megafone_prata",   name: "Megafone de Prata",   icon: "/ranks-acromania/megafone-prata.png" },
  { min: 16000,  key: "megafone_ouro",    name: "Megafone de Ouro",    icon: "/ranks-acromania/megafone-ouro.png" },
  { min: 30000, key: "microfone_bronze", name: "Microfone de Bronze", icon: "/ranks-acromania/microfone-bronze.png" },
  { min: 46000, key: "microfone_prata",  name: "Microfone de Prata",  icon: "/ranks-acromania/microfone-prata.png" },
  { min: 68000, key: "microfone_ouro",   name: "Microfone de Ouro",   icon: "/ranks-acromania/microfone-ouro.png" },
  { min: 92000, key: "coroa_bronze",     name: "Coroa de Bronze",     icon: "/ranks-acromania/coroa-bronze.png" },
  { min: 124000, key: "coroa_prata",      name: "Coroa de Prata",      icon: "/ranks-acromania/coroa-prata.png" },
  // Brilha, mas NÃO é exclusiva (ver comentário do zip 217).
  { min: 160000, key: "coroa_ouro",       name: "Coroa de Ouro",       icon: "/ranks-acromania/coroa-ouro.png", brilha: true },
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
