// Sistema de patentes baseado na pontuação vitalícia de cada jogo.
// O "icon" é o caminho da imagem servida pelo frontend (pasta frontend/public/ranks/).
// Ajuste os thresholds (min) conforme o balanceamento desejado.
export const RANKS = [
  { min: 0,     key: "iniciante",     name: "Iniciante",     icon: "/ranks/iniciante.png" },
  { min: 300,   key: "intermediario", name: "Intermediário", icon: "/ranks/intermediario.png" },
  { min: 1000,  key: "avancado",      name: "Avançado",      icon: "/ranks/avancado.png" },
  { min: 2500,  key: "pro",           name: "Pro",           icon: "/ranks/pro.png" },
  { min: 6000,  key: "mestre",        name: "Mestre",        icon: "/ranks/mestre.png" },
  { min: 12000, key: "hour_concour",  name: "Hour-Concour",  icon: "/ranks/hour_concour.png" },
  { min: 22000, key: "maniaco",       name: "Maníaco",       icon: "/ranks/maniaco.png" },
  { min: 40000, key: "datilografo",   name: "Datilógrafo",   icon: "/ranks/datilografo.png" },
];

export function getRankForPoints(points) {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (points >= r.min) current = r;
    else break;
  }
  return current;
}
