/**
 * CRIVO DAS PERGUNTAS DO QUIZ
 *
 * Uso: npm run crivo
 *
 * Roda quatro checagens em TODO o acervo de MPB e Rock, juntando todos os
 * arquivos de cada tema:
 *
 *   1. VAZAMENTO — a resposta (ou palavra de 5+ letras dela) aparece no
 *      enunciado. É o erro mais caro: a pergunta se auto-responde.
 *   2. DUPLICADA — a mesma pergunta em dois lotes diferentes.
 *   3. PARECIDA — perguntas com 70%+ das palavras em comum. Não são cópia,
 *      mas na prática o jogador sente como repetição.
 *   4. RESPOSTA REPETIDA DEMAIS — a mesma resposta em muitas perguntas.
 *      Duas ou três é normal e proposital; dez vira sala monótona.
 *
 * Resposta repetida NÃO é erro por si — duas perguntas diferentes podem
 * levar ao mesmo artista. O relatório só avisa quando passa do razoável.
 */
import { MPB } from "../prisma/data/quizMpb.js";
import { MPB2 } from "../prisma/data/quizMpb2.js";
import { MPB3 } from "../prisma/data/quizMpb3.js";
import { MPB_DIF1 } from "../prisma/data/quizMpbDif1.js";
import { MPB_DIF2 } from "../prisma/data/quizMpbDif2.js";
import { MPB_DIF3 } from "../prisma/data/quizMpbDif3.js";
import { ROCK } from "../prisma/data/quizRock.js";
import { ROCK2 } from "../prisma/data/quizRock2.js";
import { METAL } from "../prisma/data/quizMetal.js";
import { FECHAMENTO } from "../prisma/data/quizFechamento.js";
import { ROCK_DIF1 } from "../prisma/data/quizRockDif1.js";
import { MPB_AUTORIA } from "../prisma/data/quizMpbAutoria.js";
import { ROCK_DIF2 } from "../prisma/data/quizRockDif2.js";
import { ROCK_FIM } from "../prisma/data/quizRockFim.js";

const norm = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const TEMAS = {
  MPB: [...MPB.mpb, ...MPB2.mpb, ...MPB3.mpb, ...FECHAMENTO.mpb,
        ...MPB_DIF1.mpb, ...MPB_DIF2.mpb, ...MPB_DIF3.mpb, ...MPB_AUTORIA.mpb],
  ROCK: [...ROCK.rock, ...METAL.rock, ...ROCK2.rock, ...FECHAMENTO.rock,
         ...ROCK_DIF1.rock, ...ROCK_DIF2.rock, ...ROCK_FIM.rock],
};

let problemas = 0;

for (const [tema, qs] of Object.entries(TEMAS)) {
  console.log(`\n===== ${tema}: ${qs.length} perguntas =====\n`);

  // 1. vazamento
  const vazou = [];
  for (const q of qs) {
    const en = norm(q.question);
    const re = norm(q.answer);
    if (en.includes(re)) { vazou.push([q, "resposta inteira"]); continue; }
    for (const p of re.split(/\s+/)) {
      if (p.length >= 5 && en.includes(p)) { vazou.push([q, p]); break; }
    }
  }
  console.log(`VAZAMENTO: ${vazou.length}`);
  for (const [q, p] of vazou.slice(0, 10)) {
    console.log(`  "${q.question.slice(0, 62)}"`);
    console.log(`   -> ${q.answer}  (vazou: ${p})`);
  }
  problemas += vazou.length;

  // 2. duplicadas
  const vistas = new Map();
  const dup = [];
  for (const q of qs) {
    const k = norm(q.question);
    if (vistas.has(k)) dup.push(q.question);
    vistas.set(k, true);
  }
  console.log(`DUPLICADAS: ${dup.length}`);
  for (const d of dup.slice(0, 10)) console.log(`  "${d.slice(0, 62)}"`);
  problemas += dup.length;

  // 3. parecidas
  const par = [];
  for (let i = 0; i < qs.length; i++) {
    const A = new Set(norm(qs[i].question).split(/\s+/));
    for (let j = i + 1; j < qs.length; j++) {
      const B = new Set(norm(qs[j].question).split(/\s+/));
      const inter = [...A].filter((x) => B.has(x)).length;
      const jac = inter / (A.size + B.size - inter);
      if (jac >= 0.7) par.push([qs[i].question, qs[j].question, jac]);
    }
  }
  console.log(`PARECIDAS (70%+ das palavras): ${par.length}`);
  for (const [a, b, j] of par.slice(0, 8)) {
    console.log(`  ${(j * 100).toFixed(0)}%  "${a.slice(0, 48)}"`);
    console.log(`       "${b.slice(0, 48)}"`);
  }
  problemas += par.length;

  // 4. respostas repetidas
  const contagem = {};
  for (const q of qs) contagem[q.answer] = (contagem[q.answer] || 0) + 1;
  const demais = Object.entries(contagem)
    .filter(([, n]) => n >= 8)
    .sort((a, b) => b[1] - a[1]);
  console.log(`RESPOSTAS QUE APARECEM 8+ VEZES: ${demais.length}`);
  for (const [r, n] of demais.slice(0, 8)) console.log(`  ${r}: ${n}x`);

  // distribuição
  const dif = {};
  for (const q of qs) dif[q.difficulty] = (dif[q.difficulty] || 0) + 1;
  const padrao = (dif.facil || 0) + (dif.medio || 0);
  console.log(`\nSALA PADRÃO (fácil+médio): ${padrao}`);
  console.log(`SALA AVANÇADA (difícil):   ${dif.dificil || 0}`);
}

console.log(`\n${problemas === 0 ? "✅ Nenhum problema." : `⚠️  ${problemas} problema(s) acima.`}\n`);
