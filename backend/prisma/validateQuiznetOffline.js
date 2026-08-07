// Validador OFFLINE do banco de perguntas do Quiznet — roda 100% separado do
// site, direto em cima do arquivo local (backend/prisma/data/quiznet.json).
// Não toca no banco de dados em nenhum momento durante a validação.
//
// Pra cada pergunta, pergunta pra IA:
//   1) A resposta está correta?
//   2) Qual o tema real dela (confere/corrige a classificação automática)?
//   3) Qual a dificuldade (fácil / médio / difícil)?
//
// Gera dois arquivos novos:
//   - quiznet_validado.json  -> perguntas aprovadas, já organizadas por tema
//   - quiznet_sinalizadas.json -> perguntas que a IA achou suspeitas/erradas,
//     pra você revisar manualmente antes de decidir se entram ou não
//
// É RETOMÁVEL: salva o progresso a cada lote — se parar no meio (Ctrl+C,
// queda de internet, etc.), rodar de novo continua de onde parou.
//
// COMO USAR:
//   1) Cria uma API Key em https://console.anthropic.com
//   2) Adiciona no .env do backend:  ANTHROPIC_API_KEY=sk-ant-...
//   3) Roda:  npm run validate-quiznet-offline
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT_PATH = path.join(__dirname, "data", "quiznet.json");
const PROGRESS_PATH = path.join(__dirname, "data", "quiznet_progresso.json");
const VALID_OUTPUT_PATH = path.join(__dirname, "data", "quiznet_validado.json");
const FLAGGED_OUTPUT_PATH = path.join(__dirname, "data", "quiznet_sinalizadas.json");

const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-haiku-4-5-20251001";
const CONCURRENCY = 8;
const SAVE_EVERY = 100; // salva o progresso a cada N perguntas processadas

const VALID_THEMES = [
  "esportes", "ciencias", "historia", "cinema", "letras",
  "geral", "musica", "series", "novelas", "geografia", "direito",
];

if (!API_KEY) {
  console.error("❌ Falta a variável ANTHROPIC_API_KEY no arquivo .env do backend.");
  console.error("   Gera uma chave em https://console.anthropic.com e adiciona lá.");
  process.exit(1);
}

async function askClaude(question, answer, currentTheme) {
  const prompt = `Você está validando uma pergunta de um jogo de quiz em português do Brasil.

Pergunta: ${question}
Resposta considerada correta pelo jogo: ${answer}
Tema atual (pode estar errado): ${currentTheme}

Temas possíveis: esportes, ciencias, historia, cinema, letras, geral (conhecimentos gerais que não
se encaixam nos outros), musica, series (séries e TV), novelas, geografia, direito (leis, códigos,
STF, processos).

Avalie:
1. A resposta está correta e faz sentido pra essa pergunta? (considere correta mesmo com pequena
   diferença de acentuação/grafia, desde que o CONTEÚDO esteja certo)
2. Qual o tema mais adequado pra essa pergunta, dentre os temas possíveis listados?
3. Qual a dificuldade pra uma pessoa brasileira comum (não especialista) responder?

Responda APENAS com um JSON válido, nada além disso:
{"correta": true ou false, "tema": "um dos temas listados", "dificuldade": "facil" ou "medio" ou "dificil", "observacao": "se incorreta, motivo em poucas palavras; senão, vazio"}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 3000));
    return askClaude(question, answer, currentTheme);
  }
  if (!res.ok) {
    throw new Error(`API retornou ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || "{}";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

function loadProgress() {
  if (fs.existsSync(PROGRESS_PATH)) {
    return JSON.parse(fs.readFileSync(PROGRESS_PATH, "utf-8"));
  }
  return { processedIndexes: [], valid: {}, flagged: [] };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress));
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(INPUT_PATH, "utf-8"));

  // achata tudo numa lista só, com índice único (pra controlar o progresso)
  const flat = [];
  for (const [theme, items] of Object.entries(raw)) {
    for (const item of items) {
      flat.push({ idx: flat.length, theme, question: item.question, answer: item.answer });
    }
  }

  console.log(`${flat.length} perguntas no arquivo local.`);

  const progress = loadProgress();
  const processedSet = new Set(progress.processedIndexes);
  const pending = flat.filter((q) => !processedSet.has(q.idx));

  console.log(`${processedSet.size} já processadas antes. ${pending.length} restantes.\n`);

  let sinceLastSave = 0;

  for (let i = 0; i < pending.length; i += CONCURRENCY) {
    const chunk = pending.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      chunk.map(async (q) => {
        try {
          const result = await askClaude(q.question, q.answer, q.theme);
          return { q, result };
        } catch (err) {
          console.error(`\nErro na pergunta ${q.idx}:`, err.message);
          return { q, result: null };
        }
      })
    );

    for (const { q, result } of results) {
      if (!result) continue; // erro — fica pra tentar de novo na próxima rodada
      processedSet.add(q.idx);

      if (!result.correta) {
        progress.flagged.push({
          question: q.question,
          answer: q.answer,
          temaOriginal: q.theme,
          motivo: result.observacao || "Marcada como incorreta pela IA.",
        });
      } else {
        const finalTheme = VALID_THEMES.includes(result.tema) ? result.tema : q.theme;
        const difficulty = ["facil", "medio", "dificil"].includes(result.dificuldade)
          ? result.dificuldade
          : "medio";
        if (!progress.valid[finalTheme]) progress.valid[finalTheme] = [];
        progress.valid[finalTheme].push({ question: q.question, answer: q.answer, difficulty });
      }
    }

    progress.processedIndexes = [...processedSet];
    sinceLastSave += chunk.length;
    if (sinceLastSave >= SAVE_EVERY) {
      saveProgress(progress);
      sinceLastSave = 0;
    }

    process.stdout.write(`\r  ${processedSet.size}/${flat.length} processadas — ${progress.flagged.length} sinalizadas`);
  }

  saveProgress(progress);

  // escreve os arquivos finais
  fs.writeFileSync(VALID_OUTPUT_PATH, JSON.stringify(progress.valid, null, 0));
  fs.writeFileSync(FLAGGED_OUTPUT_PATH, JSON.stringify(progress.flagged, null, 2));

  console.log(`\n\n✅ Concluído!`);
  console.log(`   ${flat.length - progress.flagged.length} perguntas válidas -> ${VALID_OUTPUT_PATH}`);
  console.log(`   ${progress.flagged.length} sinalizadas pra revisão -> ${FLAGGED_OUTPUT_PATH}`);
  console.log(`\nPróximo passo: revisa o arquivo de sinalizadas, e quando estiver satisfeito, me avisa`);
  console.log(`que eu ajudo a importar o "quiznet_validado.json" pro banco de dados.`);
}

main().catch((e) => {
  console.error("\nErro geral:", e);
  process.exit(1);
});
