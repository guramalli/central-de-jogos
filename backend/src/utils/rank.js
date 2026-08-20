import { agendarApuracao, ehDetentor } from "./topRank.js";
import { agendarRecarga, patenteFixaDe } from "./patenteFixa.js";

// Sistema de patentes baseado na pontuação vitalícia de cada jogo.
// O "icon" é o caminho da imagem servida pelo frontend (pasta frontend/public/ranks/).
// Hierarquia: anéis (entrada) -> troféus (intermediário) -> coroas (avançado) -> coroas imperiais (elite).
// Ajuste os thresholds (min) conforme o balanceamento desejado.
export const RANKS = [
  { min: 0,       key: "anel_bronze",    name: "Anel de Bronze",  icon: "/ranks/anel-bronze.png?v=2" },
  { min: 500,     key: "anel_prata",     name: "Anel de Prata",   icon: "/ranks/anel-prata.png?v=2" },
  { min: 1500,    key: "anel_ouro",      name: "Anel de Ouro",    icon: "/ranks/anel-ouro.png?v=2" },
  { min: 5000,    key: "trofeu_bronze",  name: "Troféu de Bronze", icon: "/ranks/trofeu-bronze.png?v=2" },
  { min: 15000,   key: "trofeu_prata",   name: "Troféu de Prata",  icon: "/ranks/trofeu-prata.png?v=2" },
  { min: 40000,   key: "trofeu_ouro",    name: "Troféu de Ouro",   icon: "/ranks/trofeu-ouro.png?v=2" },
  // ===== TOPO RECALIBRADO (2ª vez) =====
  // Antes: 100k/220k/450k/700k/1M/1,5M. Depois: 80k/140k/225k/345k/510k/700k.
  // Agora: 70k/110k/160k/220k/295k/380k.
  //
  // O alvo passou a ser explícito: a patente MÁXIMA deve caber em cerca de
  // 2 HORAS POR DIA durante o mês, no ritmo real da sala Avançada (52 pontos
  // por rodada, ciclo de 30s = 6.240 pts/hora). Com 700.000 eram 3,7h/dia
  // todos os dias — coisa de quem vive dentro do jogo.
  //
  // Patente é MENSAL: tudo isto precisa sair em 30 dias e zera no dia 1º.
  // Os seis degraus de baixo (até Troféu de Ouro) seguem intactos desde o
  // começo — eles já eram alcançáveis nas primeiras sessões.
  //
  // Baixar limiar só PROMOVE; ninguém é rebaixado por isto.
  { min: 70000,   key: "coroa_bronze",   name: "Coroa de Bronze",  icon: "/ranks/coroa-bronze.png?v=2" },
  { min: 110000,  key: "coroa_prata",    name: "Coroa de Prata",   icon: "/ranks/coroa-prata.png?v=2" },
  { min: 160000,  key: "coroa_ouro",     name: "Coroa de Ouro",    icon: "/ranks/coroa-ouro.png?v=2" },
  // ===== Elite: coroas imperiais (arcos fechados) =====
  // Coroa fechada é hierarquia de imperador, acima da coroa aberta de rei —
  // e a leitura visual acompanha: são bem mais elaboradas que as anteriores.
  { min: 220000,  key: "coroa_imperial_bronze", name: "Coroa Imperial de Bronze", icon: "/ranks/coroa-imperial-bronze.png?v=2" },
  { min: 295000,  key: "coroa_imperial_prata",  name: "Coroa Imperial de Prata",  icon: "/ranks/coroa-imperial-prata.png?v=2" },
  // A patente máxima do Stop. O "brilha" no frontend usa esta chave.
  { min: 380000,  key: "coroa_imperial_ouro",   name: "Coroa Imperial de Ouro",   icon: "/ranks/coroa-imperial-ouro.png?v=2", brilha: true, exclusiva: true },
];

export function getRankForPoints(points, opts = {}) {
  // Patente fixada manualmente vence a pontuação: é o caso das contas
  // institucionais, que exibem uma patente por decisão nossa.
  if (opts.userId) {
    agendarRecarga();
    const fixa = patenteFixaDe(opts.gameKey || "stop", opts.userId);
    if (fixa) {
      const achada = RANKS.find((r) => r.key === fixa);
      if (achada) return achada;
    }
  }
  let current = RANKS[0];
  for (const r of RANKS) {
    if (points >= r.min) current = r;
    else break;
  }
  // Patente máxima é exclusiva: só o primeiro colocado em pontos do MÊS
  // fica com ela (patente é conceito mensal). Quem passou da marca mas não é o dono recebe a
  // patente logo abaixo. Sem userId (contextos genéricos, como a página que
  // lista todas as patentes), nada muda.
  const topo = RANKS[RANKS.length - 1];
  if (current === topo && opts.userId) {
    const gameKey = opts.gameKey || "stop";
    agendarApuracao([{ gameKey, min: topo.min }]);
    if (!ehDetentor(gameKey, opts.userId)) return RANKS[RANKS.length - 2];
  }
  return current;
}

// Retorna { name, pointsNeeded } da próxima patente, ou null se já estiver na mais alta.
export function getNextRankInfo(points) {
  const next = RANKS.find((r) => r.min > points);
  if (!next) return null;
  return { name: next.name, pointsNeeded: next.min - points };
}
