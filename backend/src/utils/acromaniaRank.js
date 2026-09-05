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
// ARTE: por enquanto aponta pros PNGs do Stop, pra não deixar imagem
// quebrada na tela. Quando as artes próprias existirem, é só trocar os
// caminhos aqui pra /ranks-acromania/... e subir a VERSAO do service worker
// (nomes novos não precisam de bump, mas a troca vale conferir).
export const ACROMANIA_RANKS = [
  { min: 0,     key: "lapis_bronze",     name: "Lápis de Bronze",     icon: "/ranks/anel-bronze.png?v=2" },
  { min: 100,   key: "lapis_prata",      name: "Lápis de Prata",      icon: "/ranks/anel-prata.png?v=2" },
  { min: 300,   key: "lapis_ouro",       name: "Lápis de Ouro",       icon: "/ranks/anel-ouro.png?v=2" },
  { min: 1000,  key: "caneta_bronze",    name: "Caneta de Bronze",    icon: "/ranks/trofeu-bronze.png?v=2" },
  { min: 3000,  key: "caneta_prata",     name: "Caneta de Prata",     icon: "/ranks/trofeu-prata.png?v=2" },
  { min: 8000,  key: "caneta_ouro",      name: "Caneta de Ouro",      icon: "/ranks/trofeu-ouro.png?v=2" },
  { min: 15000, key: "pena_bronze",      name: "Pena de Bronze",      icon: "/ranks/coroa-bronze.png?v=2" },
  { min: 23000, key: "pena_prata",       name: "Pena de Prata",       icon: "/ranks/coroa-prata.png?v=2" },
  { min: 34000, key: "pena_ouro",        name: "Pena de Ouro",        icon: "/ranks/coroa-ouro.png?v=2" },
  { min: 46000, key: "pena_real_bronze", name: "Pena Real de Bronze", icon: "/ranks/coroa-imperial-bronze.png?v=2" },
  { min: 62000, key: "pena_real_prata",  name: "Pena Real de Prata",  icon: "/ranks/coroa-imperial-prata.png?v=2" },
  // Brilha, mas NÃO é exclusiva. A exclusividade (só o 1º colocado tem) traz
  // junto o acoplamento com o histórico que custou os zips 195-197: no mês
  // passado a patente precisa vir da POSIÇÃO daquele mês, não de quem lidera
  // hoje. Não vale importar essa complexidade pra um jogo em testes.
  { min: 80000, key: "pena_real_ouro",   name: "Pena Real de Ouro",   icon: "/ranks/coroa-imperial-ouro.png?v=2", brilha: true },
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
  return { name: next.name, icon: next.icon, min: next.min, faltam: next.min - points };
}
