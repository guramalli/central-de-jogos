import { agendarApuracao, ehDetentor } from "./topRank.js";
import { agendarRecarga, patenteFixaDe } from "./patenteFixa.js";

// Sistema de patentes do Quiz — independente do sistema de patentes do Stop
// (rank.js). Hierarquia crescente, do anel mais simples até o mais chique.
export const QUIZ_RANKS = [
  { min: 0,      key: "cata_milho",    name: "Cata-milho",     icon: "/ranks-quiz/cata-milho.png?v=2" },
  { min: 250,    key: "digitador",     name: "Digitador",      icon: "/ranks-quiz/digitador.png?v=2" },
  { min: 800,    key: "calouro",       name: "Calouro",        icon: "/ranks-quiz/calouro.png?v=2" },
  { min: 2000,   key: "veterano",      name: "Veterano",       icon: "/ranks-quiz/veterano.png?v=2" },
  { min: 5000,   key: "bacharel",      name: "Bacharel",       icon: "/ranks-quiz/bacharel.png?v=2" },
  { min: 10000,  key: "pos_graduado",  name: "Pós-graduado",   icon: "/ranks-quiz/pos-graduado.png?v=2" },
  { min: 18000,  key: "mestre_quiz",   name: "Mestre",         icon: "/ranks-quiz/mestre.png?v=2" },
  // ===== METADE DE CIMA RECALIBRADA (3ª vez) =====
  // Enciclopédia: 500.000 -> 250.000 -> 215.000 -> 95.000.
  //
  // O alvo agora é explícito: a patente MÁXIMA deve caber em cerca de 2 a 2,5
  // HORAS POR DIA no mês. A referência é a sala Avançada com pouca gente
  // (15 pts por acerto, ciclo de 28s, ganhando 65% das perguntas =
  // ~1.254 pts/hora).
  //
  // POR QUE O QUIZ PRECISA DE NÚMEROS BEM MENORES QUE O STOP:
  // no Quiz só o PRIMEIRO a acertar pontua, então uma hora rende cerca de
  // 1.250 pontos contra 6.240 do Stop. As duas escadas são separadas, e
  // comparar os números entre elas não faz sentido — o que se compara é o
  // TEMPO necessário.
  //
  // EFEITO COLATERAL A OBSERVAR: se o site crescer e as salas encherem, a
  // taxa de vitória de todo mundo cai e a mesma patente passa a exigir mais
  // tempo. É característica da mecânica, não da calibragem.
  //
  // Baixar limiar só PROMOVE; ninguém é rebaixado por isto.
  { min: 28000,  key: "doutor",        name: "Doutor",         icon: "/ranks-quiz/doutor.png?v=2" },
  // Sábio fecha o ciclo dos anéis (o anel-coruja) antes da virada pros
  // bustos, que são os três títulos mais altos do Quiz.
  { min: 40000,  key: "sabio",         name: "Sábio",          icon: "/ranks-quiz/sabio.png?v=2" },
  { min: 55000,  key: "filosofo",      name: "Filósofo",       icon: "/ranks-quiz/filosofo.png?v=2" },
  // Guru e Enciclopédia foram recalibrados (eram 220.000 e 500.000).
  //
  // MOTIVO: no Quiz só o PRIMEIRO a acertar pontua, então o teto real é bem
  // mais baixo do que parece. Simulando a sala Avançada (15 pts, ~28s por
  // rodada), alguém jogando 8 horas por dia, TODOS os dias do mês, ganhando
  // 65% das perguntas, chegava a ~300.000 — ou seja, os 500.000 da
  // Enciclopédia não eram difíceis, eram inalcançáveis por qualquer pessoa.
  // Patente que ninguém pode alcançar não motiva, porque nem entra no campo
  // do "eu poderia".
  //
  // Os novos valores mantêm o topo raro (exigem ritmo extremo) sem sair do
  // mundo real, e alisam a escada: os saltos passam a ser 1,50x e 1,67x, em
  // linha com o 1,40x e 1,43x dos degraus logo abaixo. Antes eram 2,20x e
  // 2,27x — era ali que a escada deixava de ser escada.
  //
  // Baixar limiar só PROMOVE quem já pontuou; ninguém perde patente com isso.
  { min: 73000,  key: "guru",          name: "Guru",           icon: "/ranks-quiz/guru.png?v=2" },
  // Patente máxima do Quiz — recebe brilho animado no frontend, igual à
  // Coroa Imperial de Ouro faz no Stop.
  // 220.000 (era 250.000 no ajuste anterior, e 500.000 no original). Medir em
  // MULTIPLICADOR de pontos engana: o salto parecia razoável, mas em HORAS de
  // jogo — que é o que a pessoa sente — o último degrau custava 172,8h contra
  // 86,4h do Guru. Continuava sendo um degrau isolado, o dobro de qualquer
  // outro. Com 220.000 cai pra ~121h: segue sendo de longe o mais caro da
  // escada, sem ser um mundo à parte.
  { min: 95000,  key: "enciclopedia",  name: "Enciclopédia",   icon: "/ranks-quiz/enciclopedia.png?v=2", brilha: true, exclusiva: true },
];

export function getQuizRankForPoints(points, opts = {}) {
  // Patente fixada manualmente vence a pontuação (ver rank.js).
  if (opts.userId) {
    agendarRecarga();
    const fixa = patenteFixaDe("quiz", opts.userId);
    if (fixa) {
      const achada = QUIZ_RANKS.find((r) => r.key === fixa);
      if (achada) return achada;
    }
  }
  let current = QUIZ_RANKS[0];
  for (const r of QUIZ_RANKS) {
    if (points >= r.min) current = r;
    else break;
  }
  // Enciclopédia é exclusiva: só o primeiro colocado em pontos do MÊS
  // no Quiz fica com ela (mesma regra da Coroa Imperial de Ouro no Stop).
  const topo = QUIZ_RANKS[QUIZ_RANKS.length - 1];
  if (current === topo && opts.userId) {
    agendarApuracao([{ gameKey: "quiz", min: topo.min }]);
    if (!ehDetentor("quiz", opts.userId)) return QUIZ_RANKS[QUIZ_RANKS.length - 2];
  }
  return current;
}

export function getQuizNextRankInfo(points) {
  const next = QUIZ_RANKS.find((r) => r.min > points);
  if (!next) return null;
  return { name: next.name, pointsNeeded: next.min - points };
}
