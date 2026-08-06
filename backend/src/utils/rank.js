// Sistema de patentes baseado na pontuação vitalícia de cada jogo.
// O "icon" é o caminho da imagem servida pelo frontend (pasta frontend/public/ranks/).
// Hierarquia: anéis (entrada) -> troféus (intermediário) -> coroas (avançado) -> cetros (elite).
// Ajuste os thresholds (min) conforme o balanceamento desejado.
export const RANKS = [
  { min: 0,       key: "anel_bronze",    name: "Anel de Bronze",  icon: "/ranks/anel-bronze.png" },
  { min: 500,     key: "anel_prata",     name: "Anel de Prata",   icon: "/ranks/anel-prata.png" },
  { min: 1500,    key: "anel_ouro",      name: "Anel de Ouro",    icon: "/ranks/anel-ouro.png" },
  { min: 5000,    key: "trofeu_bronze",  name: "Troféu de Bronze", icon: "/ranks/trofeu-bronze.png" },
  { min: 15000,   key: "trofeu_prata",   name: "Troféu de Prata",  icon: "/ranks/trofeu-prata.png" },
  { min: 40000,   key: "trofeu_ouro",    name: "Troféu de Ouro",   icon: "/ranks/trofeu-ouro.png" },
  { min: 100000,  key: "coroa_bronze",   name: "Coroa de Bronze",  icon: "/ranks/coroa-bronze.png" },
  { min: 220000,  key: "coroa_prata",    name: "Coroa de Prata",   icon: "/ranks/coroa-prata.png" },
  { min: 450000,  key: "coroa_ouro",     name: "Coroa de Ouro",    icon: "/ranks/coroa-ouro.png" },
  { min: 700000,  key: "cajado_azul",    name: "Cajado Azul",      icon: "/ranks/cajado-azul.png" },
  { min: 1000000, key: "cajado_dourado", name: "Cajado Dourado",   icon: "/ranks/cajado-dourado.png" },
];

export function getRankForPoints(points) {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (points >= r.min) current = r;
    else break;
  }
  return current;
}

// Retorna { name, pointsNeeded } da próxima patente, ou null se já estiver na mais alta.
export function getNextRankInfo(points) {
  const next = RANKS.find((r) => r.min > points);
  if (!next) return null;
  return { name: next.name, pointsNeeded: next.min - points };
}
