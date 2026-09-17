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
import { ROCK_INTER } from "../prisma/data/quizRockInter.js";

const norm = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const TEMAS = {
  MPB: [...MPB.mpb, ...MPB2.mpb, ...MPB3.mpb, ...FECHAMENTO.mpb,
        ...MPB_DIF1.mpb, ...MPB_DIF2.mpb, ...MPB_DIF3.mpb, ...MPB_AUTORIA.mpb],
  ROCK: [...ROCK.rock, ...METAL.rock, ...ROCK2.rock, ...FECHAMENTO.rock,
         ...ROCK_DIF1.rock, ...ROCK_DIF2.rock, ...ROCK_FIM.rock, ...ROCK_INTER.rock],
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
  //
  // PALAVRAS ESTRUTURAIS SÃO IGNORADAS na comparação.
  //
  // Sem isso o crivo acusava "Qual o nome do vocalista do Nirvana?" e
  // "...do Metallica?" como 71% parecidas — elas compartilham a fórmula,
  // não o conteúdo, e são perguntas totalmente diferentes. Comparar só as
  // palavras que carregam sentido (nomes, títulos) evita o alarme falso.
  const ESTRUTURAIS = new Set([
    "qual", "quem", "o", "a", "os", "as", "de", "do", "da", "dos", "das",
    "em", "no", "na", "e", "que", "com", "por", "para", "pra", "um", "uma",
    "nome", "banda", "grupo", "cantor", "cantora", "compositor", "musico",
    "vocalista", "guitarrista", "baterista", "baixista", "toca", "canta",
    "gravou", "compos", "escreveu", "lancou", "e", "foi", "tem", "sao",
    "brasileira", "americana", "britanica", "cidade", "pais", "disco",
    "album", "faixa", "sucesso", "anos",
  ]);
  const palavrasDeConteudo = (t) =>
    new Set(norm(t).split(/\s+/).filter((p) => p.length > 2 && !ESTRUTURAIS.has(p)));

  const par = [];
  for (let i = 0; i < qs.length; i++) {
    const A = palavrasDeConteudo(qs[i].question);
    if (A.size === 0) continue;
    for (let j = i + 1; j < qs.length; j++) {
      const B = palavrasDeConteudo(qs[j].question);
      if (B.size === 0) continue;
      const inter = [...A].filter((x) => B.has(x)).length;
      const jac = inter / (A.size + B.size - inter);
      // MESMA RESPOSTA é o que decide.
      //
      // "Qual banda gravou Bohemian Rhapsody?" (Queen) e "Quem compôs?"
      // (Freddie Mercury) usam as mesmas palavras e são perguntas diferentes.
      // Só é repetição quando leva ao mesmo lugar.
      if (jac >= 0.7 && norm(qs[i].answer) === norm(qs[j].answer)) {
        par.push([qs[i].question, qs[j].question, jac]);
      }
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

// 5. COLISÃO COM OUTROS TEMAS.
//
// O importador procura a pergunta pelo TEXTO, sem filtrar por tema — isso é
// proposital, pra scripts de migração não recriarem duplicatas. O efeito
// colateral: uma pergunta igual à de outro tema é PULADA, e a sala fica com
// uma a menos sem ninguém perceber.
//
// Achei uma assim ("Qual banda irlandesa tem Bono como vocalista?", que já
// existia em outro lote). Por isso a checagem virou parte do crivo.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const pastaDados = path.join(path.dirname(fileURLToPath(import.meta.url)), "../prisma/data");
const textosDeOutrosTemas = new Set();
for (const arquivo of fs.readdirSync(pastaDados)) {
  if (!/^quiz/i.test(arquivo)) continue;
  if (/Mpb|Rock|Metal|Fechamento/.test(arquivo)) continue; // são os nossos
  try {
    const mod = await import(path.join(pastaDados, arquivo));
    for (const valor of Object.values(mod)) {
      const obj = Array.isArray(valor) ? { lista: valor } : valor;
      if (typeof obj !== "object" || obj === null) continue;
      for (const lista of Object.values(obj)) {
        if (!Array.isArray(lista)) continue;
        for (const q of lista) if (q?.question) textosDeOutrosTemas.add(norm(q.question));
      }
    }
  } catch {
    // arquivo que não exporta perguntas: ignora
  }
}

const colisoes = [];
for (const qs of Object.values(TEMAS)) {
  for (const q of qs) if (textosDeOutrosTemas.has(norm(q.question))) colisoes.push(q.question);
}
console.log(`\nCOLISÃO COM OUTROS TEMAS (seriam puladas na importação): ${colisoes.length}`);
for (const c of colisoes.slice(0, 10)) console.log(`  "${c.slice(0, 62)}"`);
problemas += colisoes.length;

console.log(`\n${problemas === 0 ? "✅ Nenhum problema." : `⚠️  ${problemas} problema(s) acima.`}\n`);
