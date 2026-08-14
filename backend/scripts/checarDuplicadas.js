// Script de manutenção: encontra perguntas repetidas DENTRO DA MESMA SALA.
//
// Repetir entre salas diferentes não é problema: a mesma pergunta pode
// fazer sentido em Futebol e em Esportes, e quem entra numa sala nunca vê a
// outra. O que atrapalha de verdade é a repetição na MESMA sala — aí a fila
// embaralhada devolve a mesma pergunta duas vezes na mesma sessão.
//
// Por isso o agrupamento aqui é por sala (tema + faixa de dificuldade), e
// não por tema: no mesmo tema, "fácil" e "difícil" são salas separadas.
//
// Uso (dentro da pasta backend):
//   node scripts/checarDuplicadas.js                  → todas as salas
//   node scripts/checarDuplicadas.js futebol          → só um tema
//   node scripts/checarDuplicadas.js --remover-exatas → apaga as idênticas
//
// ou, via npm:
//   npm run checar-duplicadas -- futebol
//
// Por padrão o script NÃO apaga nada: só lista, pra você conferir antes.

import "dotenv/config";
import { prisma } from "../src/db.js";

const args = process.argv.slice(2);
const removerExatas = args.includes("--remover-exatas");
const tema = args.find((a) => !a.startsWith("--"));

const LIMITE_PARECIDAS = 0.6; // 60% das palavras em comum

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Em qual sala esta pergunta cai. As salas por tema são divididas assim:
// "Padrão" usa fácil + médio, "Avançado" usa só difícil.
function salaDe(q) {
  const faixa = q.difficulty === "dificil" ? "Avançado" : "Padrão";
  return `${q.themeKey} — ${faixa}`;
}

// Semelhança entre dois enunciados (índice de Jaccard): palavras em comum
// sobre o total de palavras distintas. 1 = idênticos, 0 = nada em comum.
function semelhanca(a, b) {
  const A = new Set(a);
  const B = new Set(b);
  let comuns = 0;
  for (const p of A) if (B.has(p)) comuns++;
  return comuns / (A.size + B.size - comuns);
}

async function main() {
  const where = { status: "approved" };
  if (tema) where.themeKey = tema;

  const perguntas = await prisma.quizQuestion.findMany({
    where,
    select: { id: true, themeKey: true, question: true, answer: true, difficulty: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Separa as perguntas por sala antes de qualquer comparação.
  const porSala = new Map();
  for (const q of perguntas) {
    const sala = salaDe(q);
    if (!porSala.has(sala)) porSala.set(sala, []);
    porSala.get(sala).push(q);
  }

  console.log(`Analisando ${perguntas.length} pergunta(s) em ${porSala.size} sala(s).`);
  console.log("Repetições entre salas diferentes são ignoradas de propósito.\n");

  const gruposExatos = [];
  const paresParecidos = [];

  for (const [sala, lista] of porSala) {
    // ===== Idênticas dentro da sala =====
    const porTexto = new Map();
    for (const q of lista) {
      const chave = normalizar(q.question);
      if (!porTexto.has(chave)) porTexto.set(chave, []);
      porTexto.get(chave).push(q);
    }
    for (const grupo of porTexto.values()) {
      if (grupo.length > 1) gruposExatos.push({ sala, grupo });
    }

    // ===== Parecidas dentro da sala =====
    // Compara só quem já compartilha a MESMA resposta: comparar todas contra
    // todas seriam milhões de combinações, e a duplicata real quase sempre
    // tem a mesma resposta.
    const porResposta = new Map();
    for (const q of lista) {
      const chave = normalizar(q.answer);
      if (!porResposta.has(chave)) porResposta.set(chave, []);
      porResposta.get(chave).push(q);
    }
    for (const grupo of porResposta.values()) {
      if (grupo.length < 2) continue;
      for (let i = 0; i < grupo.length; i++) {
        for (let j = i + 1; j < grupo.length; j++) {
          const ta = normalizar(grupo[i].question);
          const tb = normalizar(grupo[j].question);
          if (ta === tb) continue; // já contabilizada como idêntica
          const s = semelhanca(ta.split(" "), tb.split(" "));
          if (s >= LIMITE_PARECIDAS) paresParecidos.push({ sala, a: grupo[i], b: grupo[j], s });
        }
      }
    }
  }

  // ===== Relatório =====
  console.log(`═══ IDÊNTICAS NA MESMA SALA: ${gruposExatos.length} grupo(s) ═══\n`);
  const exatasPorSala = {};
  for (const { sala } of gruposExatos) exatasPorSala[sala] = (exatasPorSala[sala] || 0) + 1;
  for (const [sala, n] of Object.entries(exatasPorSala).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${sala}`);
  }
  console.log("");
  for (const { sala, grupo } of gruposExatos.slice(0, 30)) {
    console.log(`  [${sala}] ${grupo.length}x`);
    console.log(`     "${grupo[0].question}"  →  ${grupo[0].answer}`);
    console.log(`     ids: ${grupo.map((q) => q.id).join(", ")}\n`);
  }
  if (gruposExatos.length > 30) console.log(`  ... e mais ${gruposExatos.length - 30} grupo(s).\n`);

  paresParecidos.sort((x, y) => y.s - x.s);
  console.log(`═══ PARECIDAS NA MESMA SALA (mesma resposta, ${Math.round(LIMITE_PARECIDAS * 100)}%+ de semelhança): ${paresParecidos.length} par(es) ═══\n`);
  for (const { sala, a, b, s } of paresParecidos.slice(0, 30)) {
    console.log(`  [${sala}] ${Math.round(s * 100)}% · R: ${a.answer}`);
    console.log(`     id=${a.id}: ${a.question}`);
    console.log(`     id=${b.id}: ${b.question}\n`);
  }
  if (paresParecidos.length > 30) console.log(`  ... e mais ${paresParecidos.length - 30} par(es).\n`);

  console.log("Atenção: nem todo par acima é duplicata. Perguntas do tipo");
  console.log('"Copa de 1974" e "Copa de 1990" são parecidas no texto, mas legítimas.\n');

  // ===== Remoção opcional =====
  if (removerExatas) {
    let apagadas = 0;
    for (const { grupo } of gruposExatos) {
      const [, ...remover] = grupo; // mantém a mais antiga
      for (const q of remover) {
        await prisma.quizQuestion.delete({ where: { id: q.id } });
        apagadas++;
      }
    }
    console.log(`🗑  ${apagadas} pergunta(s) idêntica(s) removida(s). A mais antiga de cada grupo foi mantida.`);
  } else if (gruposExatos.length) {
    console.log("Para apagar as idênticas (mantendo a mais antiga de cada grupo), rode de novo com --remover-exatas");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
