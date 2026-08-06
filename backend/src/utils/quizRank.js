// Sistema de patentes do Quiz — independente do sistema de patentes do Stop
// (rank.js). Hierarquia crescente, do anel mais simples até o mais chique.
export const QUIZ_RANKS = [
  { min: 0,      key: "cata_milho",    name: "Cata-milho",     icon: "/ranks-quiz/cata-milho.png" },
  { min: 250,    key: "digitador",     name: "Digitador",      icon: "/ranks-quiz/digitador.png" },
  { min: 800,    key: "calouro",       name: "Calouro",        icon: "/ranks-quiz/calouro.png" },
  { min: 2000,   key: "veterano",      name: "Veterano",       icon: "/ranks-quiz/veterano.png" },
  { min: 5000,   key: "bacharel",      name: "Bacharel",       icon: "/ranks-quiz/bacharel.png" },
  { min: 12000,  key: "pos_graduado",  name: "Pós-graduado",   icon: "/ranks-quiz/pos-graduado.png" },
  { min: 25000,  key: "mestre_quiz",   name: "Mestre",         icon: "/ranks-quiz/mestre.png" },
  { min: 50000,  key: "doutor",        name: "Doutor",         icon: "/ranks-quiz/doutor.png" },
  { min: 100000, key: "filosofo",      name: "Filósofo",       icon: "/ranks-quiz/filosofo.png" },
  { min: 220000, key: "guru",          name: "Guru",           icon: "/ranks-quiz/guru.png" },
  { min: 500000, key: "enciclopedia",  name: "Enciclopédia",   icon: "/ranks-quiz/enciclopedia.png" },
];

export function getQuizRankForPoints(points) {
  let current = QUIZ_RANKS[0];
  for (const r of QUIZ_RANKS) {
    if (points >= r.min) current = r;
    else break;
  }
  return current;
}

export function getQuizNextRankInfo(points) {
  const next = QUIZ_RANKS.find((r) => r.min > points);
  if (!next) return null;
  return { name: next.name, pointsNeeded: next.min - points };
}
