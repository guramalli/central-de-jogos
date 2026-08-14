// Script de manutenção: procura perguntas do Quiz que entregam a própria
// resposta no enunciado.
//
// O caso clássico é "Qual guerra opôs o Paraguai à Tríplice Aliança?" com
// resposta "Guerra do Paraguai" — quem não sabe nada acerta só de copiar.
// Como a dica ainda revela letras por cima disso, a pergunta vira presente.
//
// Uso (dentro da pasta backend):
//   node scripts/checarVazamento.js              → resumo geral
//   node scripts/checarVazamento.js futebol      → só um tema
//   node scripts/checarVazamento.js --dificil    → só as perguntas difíceis
//
// ou, via npm:
//   npm run checar-vazamento -- futebol
//
// O script NÃO altera nada: só lista, pra você decidir o que reescrever.

import "dotenv/config";
import { prisma } from "../src/db.js";

const args = process.argv.slice(2);
const soDificil = args.includes("--dificil");
const tema = args.find((a) => !a.startsWith("--"));

// Substantivos genéricos que costumam aparecer nos dois lados sem serem
// vazamento de verdade ("qual lago..." / "Lago Baikal"). O que importa é a
// parte que identifica a resposta, não a categoria.
const GENERICOS = new Set([
  "lago", "rio", "canal", "serra", "monte", "ilha", "oceano", "estreito", "golfo",
  "tratado", "plano", "acordo", "guerra", "batalha", "revolta", "movimento",
  "principio", "teoria", "lei", "regra", "sistema", "processo", "metodo",
  "acido", "gas", "elemento", "osso", "musculo", "orgao",
  "filme", "serie", "livro", "romance", "album", "musica", "banda",
  "time", "clube", "copa", "torneio", "campeonato", "prova", "categoria",
  "cidade", "estado", "pais", "capital", "regiao", "bioma",
  "deus", "deusa", "jogo", "personagem", "operacao", "codigo", "artigo",
]);

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ");
}

function palavras(texto) {
  return normalizar(texto)
    .split(/\s+/)
    .filter((p) => p.length > 3 && !GENERICOS.has(p));
}

async function main() {
  const where = { status: "approved" };
  if (tema) where.themeKey = tema;
  if (soDificil) where.difficulty = "dificil";

  const perguntas = await prisma.quizQuestion.findMany({
    where,
    select: { id: true, themeKey: true, question: true, answer: true, difficulty: true },
  });

  const achadas = [];
  for (const q of perguntas) {
    const naPergunta = palavras(q.question);
    const naResposta = palavras(q.answer);
    for (const r of naResposta) {
      // Compara pelo começo da palavra pra pegar variações ("Moderna" x
      // "Modernismo", "desérticas" x "desertificação").
      const achou = naPergunta.some((p) => {
        const raiz = Math.min(5, p.length, r.length);
        return p.slice(0, raiz) === r.slice(0, raiz);
      });
      if (achou) {
        achadas.push(q);
        break;
      }
    }
  }

  const porTema = {};
  for (const q of achadas) porTema[q.themeKey] = (porTema[q.themeKey] || 0) + 1;

  console.log(`Analisadas: ${perguntas.length}`);
  console.log(`Com possível vazamento: ${achadas.length} (${Math.round((achadas.length / Math.max(perguntas.length, 1)) * 100)}%)\n`);

  if (Object.keys(porTema).length) {
    console.log("Por tema:");
    for (const [t, n] of Object.entries(porTema).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${t.padEnd(16)} ${n}`);
    }
    console.log("");
  }

  console.log("Primeiras 40:\n");
  for (const q of achadas.slice(0, 40)) {
    console.log(`[${q.themeKey} · ${q.difficulty}] id=${q.id}`);
    console.log(`  P: ${q.question}`);
    console.log(`  R: ${q.answer}\n`);
  }
  if (achadas.length > 40) console.log(`... e mais ${achadas.length - 40}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
