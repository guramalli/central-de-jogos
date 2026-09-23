import { prisma } from "../db.js";

// Banco de palavras do Impostor (tabela ImpostorPalavra), com cache em
// memória: sortear uma palavra não pode ir ao Neon a cada partida.
const CACHE_MS = 10 * 60 * 1000;
let cache = { lista: [], em: 0 };

async function carregar() {
  if (cache.lista.length > 0 && Date.now() - cache.em < CACHE_MS) return cache.lista;
  const linhas = await prisma.impostorPalavra.findMany({
    where: { ativo: true },
    select: { tema: true, palavra: true },
  });
  cache = { lista: linhas, em: Date.now() };
  return linhas;
}

// Sorteia 1 tema e depois 1 palavra dele (assim um tema com 40 palavras não
// sai mais que um com 15), evitando palavras que a sala já usou.
export function escolherPalavra(lista, jaUsadas = [], aleatorio = Math.random) {
  if (lista.length === 0) return null;
  const usadas = new Set(jaUsadas);
  let candidatas = lista.filter((l) => !usadas.has(l.palavra));
  if (candidatas.length === 0) candidatas = lista; // esgotou: libera tudo de novo
  const temas = [...new Set(candidatas.map((l) => l.tema))];
  const tema = temas[Math.floor(aleatorio() * temas.length)];
  const doTema = candidatas.filter((l) => l.tema === tema);
  const escolhida = doTema[Math.floor(aleatorio() * doTema.length)];
  return { tema: escolhida.tema, palavra: escolhida.palavra };
}

// Palavras de um tema, do cache (o bot impostor usa pra chutar). O cache já
// foi carregado pelo sorteio da partida quando o chute acontece.
export function palavrasDoTema(tema) {
  return cache.lista.filter((l) => l.tema === tema).map((l) => l.palavra);
}

export async function sortearPalavra(sala) {
  const lista = await carregar();
  const r = escolherPalavra(lista, sala?.historico || []);
  if (!r) throw new Error("banco de palavras do Impostor está vazio (rode npm run seed:impostor)");
  return r;
}
