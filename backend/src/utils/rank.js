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
  // ===== TOPO RECALIBRADO =====
  // Os seis últimos limiares eram 100k / 220k / 450k / 700k / 1M / 1,5M.
  //
  // MOTIVO: patente é MENSAL, não acúmulo de carreira — 1.500.000 tinha que
  // sair dentro de um único mês. Medido com o ritmo real da sala Avançada
  // (52 pts por rodada, ciclo de 30s), isso exigia 240 horas no mês, ou seja
  // 8 HORAS POR DIA, 30 dias seguidos. E no melhor caso imaginável —
  // gabaritando os 6 temas com resposta única e pedindo STOP em todas as
  // 20 mil rodadas — ainda eram 5,6h/dia.
  //
  // Com 700.000 no topo, a patente máxima passa a pedir ~3,7h/dia na
  // Avançada: continua sendo coisa de jogador obcecado, mas cabe na vida de
  // alguém. Os degraus de baixo (até Troféu de Ouro) ficaram intactos, e a
  // curva segue sempre crescente em horas por degrau.
  //
  // Baixar limiar de patente só PROMOVE — ninguém é rebaixado por isto.
  { min: 80000,   key: "coroa_bronze",   name: "Coroa de Bronze",  icon: "/ranks/coroa-bronze.png?v=2" },
  { min: 140000,  key: "coroa_prata",    name: "Coroa de Prata",   icon: "/ranks/coroa-prata.png?v=2" },
  { min: 225000,  key: "coroa_ouro",     name: "Coroa de Ouro",    icon: "/ranks/coroa-ouro.png?v=2" },
  // ===== Elite: coroas imperiais (arcos fechados) =====
  // Coroa fechada é hierarquia de imperador, acima da coroa aberta de rei —
  // e a leitura visual acompanha: são bem mais elaboradas que as anteriores.
  { min: 345000,  key: "coroa_imperial_bronze", name: "Coroa Imperial de Bronze", icon: "/ranks/coroa-imperial-bronze.png?v=2" },
  { min: 510000,  key: "coroa_imperial_prata",  name: "Coroa Imperial de Prata",  icon: "/ranks/coroa-imperial-prata.png?v=2" },
  // A patente máxima do Stop. O "brilha" no frontend usa esta chave.
  { min: 700000,  key: "coroa_imperial_ouro",   name: "Coroa Imperial de Ouro",   icon: "/ranks/coroa-imperial-ouro.png?v=2", brilha: true, exclusiva: true },
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
