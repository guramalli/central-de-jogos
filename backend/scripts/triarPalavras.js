/**
 * TRIAGEM DAS SUGESTÕES DE PALAVRA DO STOP
 *
 * Uso:
 *   npm run triar-palavras                 -> só mostra o diagnóstico
 *   npm run triar-palavras -- --confirmar  -> rejeita as objetivamente inválidas
 *
 * O QUE ESTE SCRIPT **NÃO** FAZ: aprovar.
 *
 * Aprovar exige saber se "Jaraguá" é uma cidade ou se "Jabuticaba" é uma
 * fruta — conhecimento de mundo que nenhuma regra mecânica resolve. E o custo
 * de errar é assimétrico: uma palavra inválida aprovada vira ponto indevido
 * pra sempre, num glossário que é o ativo mais caro do site. Uma sugestão boa
 * que espera um dia a mais não custa nada.
 *
 * O que ele faz é tirar da sua frente o que dá pra decidir sem pensar, e
 * organizar o resto por tema pra você julgar dez palavras parecidas de uma
 * vez em vez de pular de assunto a cada clique.
 */
import { prisma } from "../src/db.js";

const confirmar = process.argv.includes("--confirmar");

// Acento fora, minúsculo — pra comparar "Ácia" com "acia".
function normalizar(p) {
  return String(p || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const MOTIVOS = {
  letra: "não começa com a letra do tema",
  curta: "curta demais (1 caractere)",
  longa: "longa demais (mais de 30 caracteres)",
  simbolo: "tem número ou símbolo",
  repetida: "letra repetida sem sentido (ex: aaaa)",
  duplicada: "já existe no glossário",
};

function avaliar(entrada, aprovadasDoTema) {
  const palavra = String(entrada.word || "").trim();
  const norm = normalizar(palavra);

  if (norm.length < 2) return "curta";
  if (norm.length > 30) return "longa";

  // Letras, espaço e hífen apenas. Número ou símbolo nunca é palavra válida.
  if (!/^[a-zà-ÿ][a-zà-ÿ\s'-]*$/i.test(palavra.normalize("NFC"))) return "simbolo";

  // A primeira letra TEM que bater com a da sugestão.
  if (norm[0] !== normalizar(entrada.letter)[0]) return "letra";

  // "aaaa", "kkkkk": três iguais seguidas não existe em português.
  if (/(.)\1{2,}/.test(norm)) return "repetida";

  if (aprovadasDoTema.has(norm)) return "duplicada";

  return null; // nada objetivo contra — decisão humana
}

async function main() {
  const pendentes = await prisma.wordEntry.findMany({
    where: { status: "pending" },
    include: { theme: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  if (pendentes.length === 0) {
    console.log("\nNenhuma sugestão pendente. 🎉\n");
    return;
  }

  // Palavras já aprovadas, por tema — pra detectar duplicata.
  const aprovadas = await prisma.wordEntry.findMany({
    where: { status: "approved" },
    select: { themeId: true, word: true },
  });
  const porTema = new Map();
  for (const a of aprovadas) {
    if (!porTema.has(a.themeId)) porTema.set(a.themeId, new Set());
    porTema.get(a.themeId).add(normalizar(a.word));
  }

  // Duplicata DENTRO da própria fila também conta: duas pessoas sugerindo a
  // mesma palavra geram duas linhas, e só uma deve sobreviver.
  const vistasNaFila = new Map();

  const rejeitar = [];
  const paraVoce = [];

  for (const p of pendentes) {
    const set = porTema.get(p.themeId) || new Set();
    let motivo = avaliar(p, set);

    if (!motivo) {
      const chave = `${p.themeId}:${normalizar(p.word)}`;
      if (vistasNaFila.has(chave)) motivo = "duplicada";
      else vistasNaFila.set(chave, p.id);
    }

    if (motivo) rejeitar.push({ ...p, motivo });
    else paraVoce.push(p);
  }

  console.log(`\n=== ${pendentes.length} sugestões pendentes ===\n`);

  if (rejeitar.length > 0) {
    console.log(`❌ ${rejeitar.length} objetivamente inválidas:\n`);
    const porMotivo = {};
    for (const r of rejeitar) (porMotivo[r.motivo] ||= []).push(r);
    for (const [motivo, lista] of Object.entries(porMotivo)) {
      console.log(`  ${MOTIVOS[motivo]} (${lista.length}):`);
      for (const r of lista.slice(0, 10)) {
        console.log(`    ${r.letter} · ${r.theme.name} · "${r.word}"`);
      }
      if (lista.length > 10) console.log(`    ... e mais ${lista.length - 10}`);
      console.log("");
    }
  }

  console.log(`👀 ${paraVoce.length} precisam da sua decisão, agrupadas por tema:\n`);
  const agrupadas = {};
  for (const p of paraVoce) (agrupadas[p.theme.name] ||= []).push(p);
  for (const [tema, lista] of Object.entries(agrupadas).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${tema} (${lista.length})`);
    // Ordenado por letra: julgar dez palavras com "J" seguidas é bem mais
    // rápido que pular de letra a cada uma.
    for (const p of lista.sort((a, b) => a.letter.localeCompare(b.letter))) {
      console.log(`    ${p.letter} · ${p.word}`);
    }
    console.log("");
  }

  if (!confirmar) {
    console.log("--- SIMULAÇÃO — nada foi alterado ---");
    console.log("Pra rejeitar as inválidas acima:\n");
    console.log("  npm run triar-palavras -- --confirmar\n");
    return;
  }

  if (rejeitar.length === 0) {
    console.log("Nada a rejeitar.\n");
    return;
  }

  await prisma.wordEntry.updateMany({
    where: { id: { in: rejeitar.map((r) => r.id) } },
    data: { status: "rejected" },
  });
  console.log(`\n✅ ${rejeitar.length} sugestões rejeitadas.`);
  console.log(`Restam ${paraVoce.length} no painel, só as que precisam de você.\n`);
}

main()
  .catch((e) => {
    console.error("Erro:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
