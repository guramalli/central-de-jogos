// Revisa a classificação de dificuldade das perguntas do Quiz.
//
// O problema que motivou isto: perguntas difíceis aparecendo na sala Padrão.
// Causas típicas: (1) toda sugestão de jogador entra com dificuldade "medio"
// por default, sem ninguém avaliar; (2) lotes antigos classificados no olho.
//
// O script dá uma nota de "dificuldade aparente" (0 a 100) pra cada pergunta
// usando sinais do texto (ano exato, "quantos", século, nomes compostos
// raros, marcadores de nicho...) e aponta as suspeitas:
//   - Padrão (facil/medio) com cara de difícil  → candidatas a subir
//   - Avançada (dificil) com cara de fácil      → candidatas a descer (só lista)
//
// USO (sempre a partir da pasta backend):
//   npm run revisar-dificuldade -- --tema geral          → relatório (não muda nada)
//   npm run revisar-dificuldade -- --todas               → relatório de todos os temas
//   npm run revisar-dificuldade -- --tema geral --aplicar --acima 60
//        → além do relatório, MOVE pra "dificil" as do tema com nota >= 60
//
// Por padrão NADA é alterado. O relatório também sai em CSV
// (revisao-dificuldade-<tema>.csv) pra revisar com calma na planilha.
import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const pegar = (nome) => {
  const i = args.indexOf(nome);
  return i >= 0 ? args[i + 1] : null;
};
const TEMA = pegar("--tema");
const TODAS = args.includes("--todas");
const APLICAR = args.includes("--aplicar");
const ACIMA = Number(pegar("--acima") || 60);

if (!TEMA && !TODAS) {
  console.log("Informe --tema <chave> (ex.: --tema geral) ou --todas.");
  process.exit(1);
}

const norm = (t) =>
  (t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const MARCA_NICHO = [
  "fundou", "fundada", "fundacao", "inventor", "inventou", "descobriu",
  "tratado", "dinastia", "imperador", "imperatriz", "batalha de",
  "elemento quimico", "simbolo quimico", "formula quimica", "latim",
  "grego antigo", "padroeiro", "seculo", "monarca", "reinado",
];
const MARCA_FACIL = [
  "mascote", "personagem principal", "protagonista da serie", "qual cor",
  "qual animal", "qual fruta", "irmao de", "irma de", "desenho animado",
  "apelido carinhoso", "qual encanador", "arqui-inimigo",
];
const RESPOSTAS_COMUNS = new Set([
  "brasil", "sao paulo", "rio de janeiro", "amarelo", "azul", "vermelho",
  "verde", "cachorro", "gato", "futebol", "mario", "luigi", "sol", "lua",
  "agua", "portugues",
]);

function notaDificuldade(q) {
  const perg = norm(q.question);
  const resp = norm(q.answer);
  let nota = 0;
  const motivos = [];

  if (/^(1[0-9]{3}|20[0-2][0-9])$/.test(resp.trim())) { nota += 30; motivos.push("resposta é um ano exato"); }
  if (/em que ano|qual ano|em qual ano/.test(perg)) { nota += 20; motivos.push("pergunta de ano"); }
  if (/quantos|quantas/.test(perg) && /\d/.test(resp)) { nota += 25; motivos.push("quantidade numérica exata"); }
  for (const m of MARCA_NICHO) {
    if (perg.includes(m)) { nota += 25; motivos.push(`nicho: "${m}"`); break; }
  }
  if (/romano|romana|grego|grega|egipc|mesopotam|bizantin|otoman|medieval|feudal/.test(perg)) {
    nota += 10; motivos.push("história antiga/medieval");
  }
  const palavrasResp = resp.trim().split(/\s+/);
  if (resp.length >= 15 || palavrasResp.length >= 3) { nota += 12; motivos.push("resposta longa/composta"); }
  if (resp.trim().length >= 10 && !RESPOSTAS_COMUNS.has(resp.trim())) { nota += 10; motivos.push("resposta pouco corriqueira"); }
  if (perg.length >= 100) { nota += 8; motivos.push("enunciado extenso"); }
  if (/\d/.test(resp) && !/^(1[0-9]{3}|20[0-2][0-9])$/.test(resp.trim())) { nota += 15; motivos.push("resposta com número específico"); }
  for (const m of MARCA_FACIL) {
    if (perg.includes(m)) { nota -= 25; motivos.push(`fácil: "${m}"`); break; }
  }
  if (RESPOSTAS_COMUNS.has(resp.trim())) { nota -= 10; motivos.push("resposta muito conhecida"); }

  return { nota: Math.max(0, Math.min(100, nota)), motivos };
}

async function revisarTema(themeKey) {
  const perguntas = await prisma.quizQuestion.findMany({
    where: { status: "approved", themeKey },
    select: { id: true, question: true, answer: true, difficulty: true, suggestedById: true },
  });
  if (perguntas.length === 0) {
    console.log(`(tema "${themeKey}" sem perguntas aprovadas)`);
    return;
  }

  const suspeitasSubir = [];   // Padrão com cara de difícil
  const suspeitasDescer = [];  // Avançada com cara de fácil
  for (const q of perguntas) {
    const { nota, motivos } = notaDificuldade(q);
    if ((q.difficulty === "facil" || q.difficulty === "medio") && nota >= 35) {
      suspeitasSubir.push({ ...q, nota, motivos });
    }
    if (q.difficulty === "dificil" && nota === 0) {
      suspeitasDescer.push({ ...q, nota, motivos });
    }
  }
  suspeitasSubir.sort((a, b) => b.nota - a.nota);

  console.log(`\n===== ${themeKey} — ${perguntas.length} perguntas =====`);
  console.log(`Na sala PADRÃO com cara de difícil: ${suspeitasSubir.length}`);
  for (const s of suspeitasSubir) {
    const origem = s.suggestedById ? " [sugestão de jogador]" : "";
    console.log(`  [${String(s.nota).padStart(3)}] ${s.question.slice(0, 80)}`);
    console.log(`        R: ${s.answer} — ${s.motivos.join("; ")}${origem}`);
  }
  console.log(`\nNa sala AVANÇADA com cara de fácil (só listagem, nunca movo sozinho): ${suspeitasDescer.length}`);
  for (const s of suspeitasDescer.slice(0, 15)) {
    console.log(`  ${s.question.slice(0, 80)} → R: ${s.answer}`);
  }

  // CSV pra revisão na planilha
  const csv = ["id;dificuldade_atual;nota;sugestao;pergunta;resposta;origem"];
  for (const s of suspeitasSubir) {
    csv.push([
      s.id, s.difficulty, s.nota, "subir para dificil",
      `"${s.question.replace(/"/g, "'")}"`, `"${s.answer.replace(/"/g, "'")}"`,
      s.suggestedById ? "sugestao" : "lote",
    ].join(";"));
  }
  for (const s of suspeitasDescer) {
    csv.push([
      s.id, s.difficulty, s.nota, "avaliar descida",
      `"${s.question.replace(/"/g, "'")}"`, `"${s.answer.replace(/"/g, "'")}"`,
      s.suggestedById ? "sugestao" : "lote",
    ].join(";"));
  }
  const arq = `revisao-dificuldade-${themeKey}.csv`;
  fs.writeFileSync(arq, csv.join("\n"), "utf8");
  console.log(`\nCSV salvo em backend/${arq}`);

  // Aplicação: só sobe pra difícil, só com --aplicar, só acima do corte.
  if (APLICAR) {
    const alvo = suspeitasSubir.filter((s) => s.nota >= ACIMA);
    console.log(`\n--aplicar ativo: movendo ${alvo.length} pergunta(s) com nota >= ${ACIMA} para "dificil"...`);
    for (const s of alvo) {
      await prisma.quizQuestion.update({ where: { id: s.id }, data: { difficulty: "dificil" } });
      console.log(`  ✓ [${s.nota}] ${s.question.slice(0, 70)}`);
    }
    console.log("Concluído. A fila da sala usa a nova classificação na próxima remontagem.");
  }
}

async function main() {
  if (TODAS) {
    const temas = await prisma.quizQuestion.groupBy({ by: ["themeKey"], where: { status: "approved" } });
    for (const t of temas) await revisarTema(t.themeKey);
  } else {
    await revisarTema(TEMA);
  }
  if (!APLICAR) {
    console.log("\n(Nada foi alterado — relatório apenas. Pra aplicar: --aplicar --acima 60 (só sobe, nunca desce sozinho))");
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
