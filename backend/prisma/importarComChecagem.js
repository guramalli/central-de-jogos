// Importador de perguntas do Quiz com CHECAGEM DE RESPOSTA CONTRA O BANCO.
//
// POR QUE ESTE IMPORTADOR EXISTE:
// Os importadores anteriores evitavam duplicata comparando o TEXTO da
// pergunta. Isso pega a mesma linha importada duas vezes, mas não pega o
// caso que mais incomoda quem joga: duas perguntas escritas de formas
// diferentes com a MESMA resposta.
//
//   já no banco:  "Qual clube tem mais títulos da Copa do Brasil?"     -> Cruzeiro
//   lote novo:    "De qual estado é o clube com mais Copas do Brasil?" -> Minas Gerais
//
// A segunda passa pelo filtro de texto, mas para o jogador é o mesmo assunto
// voltando. Numa sala de futebol, 21% das perguntas já compartilhavam
// resposta com outra antes deste script existir.
//
// E há um motivo mais simples: quem escreve o lote (eu, o Claude) só enxerga
// os arquivos de importação — boa parte das perguntas do banco veio de
// migrações e do painel admin, e nunca esteve em arquivo nenhum. A checagem
// precisa acontecer aqui, no único lugar que vê tudo.
//
// O QUE ELE FAZ:
//  1. Carrega todas as respostas já aprovadas do tema;
//  2. Pula perguntas com texto idêntico (como antes);
//  3. Pula perguntas cuja RESPOSTA já existe no tema, e diz quais;
//  4. Insere o resto.
//
// A comparação ignora acento, caixa e pontuação: "Pokémon", "pokemon" e
// "Pokemon!" são a mesma resposta.
//
// Uso:  node prisma/importarComChecagem.js <arquivo> <NOME_DA_CONSTANTE>
// Ex.:  node prisma/importarComChecagem.js quizFutebolAvancado.js FUTEBOL_AVANCADO
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function chave(s) {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

async function main() {
  const [arquivo, constante] = process.argv.slice(2);
  if (!arquivo || !constante) {
    console.log("Uso: node prisma/importarComChecagem.js <arquivo> <CONSTANTE>");
    console.log("Ex.: node prisma/importarComChecagem.js quizFutebolAvancado.js FUTEBOL_AVANCADO");
    return;
  }

  const mod = await import(`./data/${arquivo}`);
  const dados = mod[constante];
  if (!dados) {
    console.log(`A constante "${constante}" não foi encontrada em ${arquivo}.`);
    console.log(`Disponíveis: ${Object.keys(mod).join(", ")}`);
    return;
  }

  let inseridas = 0;
  const puladasTexto = [];
  const puladasResposta = [];

  for (const [themeKey, perguntas] of Object.entries(dados)) {
    // Todas as respostas que o tema já tem. Uma consulta só, no começo —
    // consultar por pergunta seria lento e desnecessário.
    const existentes = await prisma.quizQuestion.findMany({
      where: { themeKey, status: "approved" },
      select: { answer: true },
    });
    const respostasNoBanco = new Set(existentes.map((q) => chave(q.answer)));

    console.log(`\nTema "${themeKey}": ${existentes.length} perguntas já aprovadas, ` +
                `${respostasNoBanco.size} respostas distintas.`);

    for (const q of perguntas) {
      const jaTemTexto = await prisma.quizQuestion.findFirst({
        where: { question: q.question },
        select: { id: true },
      });
      if (jaTemTexto) { puladasTexto.push(q.question); continue; }

      const c = chave(q.answer);
      if (respostasNoBanco.has(c)) { puladasResposta.push(q); continue; }

      await prisma.quizQuestion.create({
        data: {
          themeKey,
          question: q.question,
          answer: q.answer,
          difficulty: q.difficulty,
          status: "approved",
          validated: true,
        },
      });
      // Registra na hora, pra o próprio lote não inserir duas com a mesma
      // resposta uma atrás da outra.
      respostasNoBanco.add(c);
      inseridas++;
    }
  }

  console.log(`\n=== RESULTADO ===`);
  console.log(`  inseridas                 : ${inseridas}`);
  console.log(`  puladas (texto igual)     : ${puladasTexto.length}`);
  console.log(`  puladas (resposta repetida): ${puladasResposta.length}`);

  if (puladasResposta.length) {
    console.log(`\n--- perguntas puladas por resposta já existente ---`);
    console.log(`(não são erro: só significam que o assunto já está coberto)`);
    for (const q of puladasResposta) {
      console.log(`  "${q.answer}" — ${q.question.slice(0, 70)}`);
    }
  }
}

main()
  .catch((e) => { console.error("Erro:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
