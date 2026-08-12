// Sistema de patentes do Quiz — independente do sistema de patentes do Stop
// (rank.js). Hierarquia crescente, do anel mais simples até o mais chique.
export const QUIZ_RANKS = [
  { min: 0,      key: "cata_milho",    name: "Cata-milho",     icon: "/ranks-quiz/cata-milho.png?v=2" },
  { min: 250,    key: "digitador",     name: "Digitador",      icon: "/ranks-quiz/digitador.png?v=2" },
  { min: 800,    key: "calouro",       name: "Calouro",        icon: "/ranks-quiz/calouro.png?v=2" },
  { min: 2000,   key: "veterano",      name: "Veterano",       icon: "/ranks-quiz/veterano.png?v=2" },
  { min: 5000,   key: "bacharel",      name: "Bacharel",       icon: "/ranks-quiz/bacharel.png?v=2" },
  { min: 12000,  key: "pos_graduado",  name: "Pós-graduado",   icon: "/ranks-quiz/pos-graduado.png?v=2" },
  { min: 25000,  key: "mestre_quiz",   name: "Mestre",         icon: "/ranks-quiz/mestre.png?v=2" },
  { min: 50000,  key: "doutor",        name: "Doutor",         icon: "/ranks-quiz/doutor.png?v=2" },
  // Sábio fecha o ciclo dos anéis (o anel-coruja) antes da virada pros
  // bustos, que são os três títulos mais altos do Quiz.
  { min: 70000,  key: "sabio",         name: "Sábio",          icon: "/ranks-quiz/sabio.png?v=2" },
  { min: 100000, key: "filosofo",      name: "Filósofo",       icon: "/ranks-quiz/filosofo.png?v=2" },
  { min: 220000, key: "guru",          name: "Guru",           icon: "/ranks-quiz/guru.png?v=2" },
  { min: 500000, key: "enciclopedia",  name: "Enciclopédia",   icon: "/ranks-quiz/enciclopedia.png?v=2" },
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
