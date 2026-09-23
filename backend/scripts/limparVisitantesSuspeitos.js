// Acha (e, se pedido, apaga) contas de VISITANTE criadas em RAJADA — sinal
// de script batendo direto na API, não gente jogando de verdade.
//
// O CASO QUE MOTIVOU ISSO (zip 599):
// Mais de 50 contas "LoadTestUser1", "LoadTestUser2" ... foram criadas no
// mesmo dia, direto pela rota /api/auth/guest — sem passar pela tela de
// "jogar sem cadastro" (que gera nomes tipo "Jogador 4821", nunca
// "LoadTestUserNN"). O limite da rota até então era o mesmo do cadastro
// normal (60 por IP a cada 5 min) — frouxo demais pra uma rota que não
// pede e-mail nem senha. Isso já foi apertado (ver routes/auth.js), mas as
// contas que já existem continuam no banco até alguém apagar.
//
// COMO ACHA:
// Sem argumento, agrupa TODAS as contas de visitante em janelas de 5
// minutos e aponta qualquer janela com mais contas do que uma pessoa
// digitando manualmente conseguiria criar — é um detector geral, não
// depende do nome "LoadTestUser" (o próximo ataque pode vir com outro
// prefixo, ou nome aleatório).
//
// Uso (dentro da pasta backend):
//   npm run limpar-visitantes-suspeitos                        (só mostra as rajadas)
//   npm run limpar-visitantes-suspeitos -- --prefixo LoadTestUser   (filtra por um trecho do nome)
//   npm run limpar-visitantes-suspeitos -- --prefixo LoadTestUser --apagar   (apaga os encontrados)
//
// NUNCA apaga sem --apagar, e só mexe em contas com isGuest: true — conta
// cadastrada de verdade (com e-mail e senha) nunca entra nessa lista.

import "dotenv/config";
import { prisma } from "../src/db.js";

const JANELA_MS = 5 * 60 * 1000; // 5 minutos
const LIMIAR_RAJADA = 6; // mais que isso na mesma janela de 5min é rajada, não gente

function args() {
  const a = process.argv.slice(2);
  const iPrefixo = a.indexOf("--prefixo");
  return {
    apagar: a.includes("--apagar"),
    prefixo: iPrefixo >= 0 ? a[iPrefixo + 1] : null,
  };
}

async function main() {
  const { apagar, prefixo } = args();

  const where = { isGuest: true };
  if (prefixo) where.nickname = { contains: prefixo, mode: "insensitive" };

  const visitantes = await prisma.user.findMany({
    where,
    select: { id: true, nickname: true, email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  if (!visitantes.length) {
    console.log(prefixo ? `Nenhuma conta de visitante com "${prefixo}" no nome.` : "Nenhuma conta de visitante no banco.");
    return;
  }

  if (prefixo) {
    // modo filtro: mostra (ou apaga) exatamente o que bateu com o prefixo
    console.log(`${visitantes.length} conta(s) de visitante com "${prefixo}" no nome:\n`);
    for (const v of visitantes) console.log(`  ${v.nickname.padEnd(30)} criada em ${v.createdAt.toLocaleString("pt-BR")}`);
    if (apagar) {
      const r = await prisma.user.deleteMany({ where: { id: { in: visitantes.map((v) => v.id) } } });
      console.log(`\n${r.count} conta(s) apagada(s).`);
    } else {
      console.log(`\nNada apagado — rode de novo com --apagar pra remover essas ${visitantes.length} conta(s).`);
    }
    return;
  }

  // modo detector: agrupa por janela de 5min e aponta rajadas, sem apagar
  // nada automaticamente (não dá pra saber o prefixo certo sem olhar antes).
  const janelas = new Map(); // chave = início da janela (ms) -> lista de contas
  for (const v of visitantes) {
    const chave = Math.floor(v.createdAt.getTime() / JANELA_MS) * JANELA_MS;
    if (!janelas.has(chave)) janelas.set(chave, []);
    janelas.get(chave).push(v);
  }

  const rajadas = [...janelas.entries()].filter(([, lista]) => lista.length >= LIMIAR_RAJADA);
  console.log(`${visitantes.length} conta(s) de visitante no total.\n`);
  if (!rajadas.length) {
    console.log(`Nenhuma rajada encontrada (nenhuma janela de 5min com ${LIMIAR_RAJADA}+ contas). Parece tráfego normal.`);
    return;
  }

  console.log(`${rajadas.length} rajada(s) encontrada(s) — ${LIMIAR_RAJADA}+ contas de visitante na mesma janela de 5 minutos:\n`);
  for (const [inicio, lista] of rajadas) {
    const fim = new Date(inicio + JANELA_MS);
    console.log(`  ${new Date(inicio).toLocaleString("pt-BR")} – ${fim.toLocaleTimeString("pt-BR")}  (${lista.length} contas)`);
    console.log(`    ex.: ${lista.slice(0, 3).map((v) => v.nickname).join(", ")}${lista.length > 3 ? "…" : ""}`);
  }
  console.log(`\nPra apagar um grupo específico, rode de novo com --prefixo "<trecho do nome>" --apagar.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
