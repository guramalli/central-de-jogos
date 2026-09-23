// Cache simples em memória, com expiração por tempo.
//
// Serve pra aliviar o banco em rotas muito consultadas e que mudam pouco —
// perfil e ranking, principalmente. Numa live com muita gente entrando de
// uma vez, isso evita que centenas de pessoas façam a mesma consulta pesada
// ao mesmo tempo.
//
// Não usa Redis de propósito: pra um único servidor, um Map na memória
// resolve com zero infraestrutura extra. Se um dia o site rodar em várias
// instâncias, aí sim vale trocar por Redis.

const store = new Map(); // chave -> { valor, expiraEm }

// Limpeza periódica pra memória não crescer sem limite.
const LIMPEZA_INTERVALO_MS = 60_000;
setInterval(() => {
  const agora = Date.now();
  for (const [chave, item] of store.entries()) {
    if (item.expiraEm <= agora) store.delete(chave);
  }
}, LIMPEZA_INTERVALO_MS).unref?.();

export function cacheGet(chave) {
  const item = store.get(chave);
  if (!item) return null;
  if (item.expiraEm <= Date.now()) {
    store.delete(chave);
    return null;
  }
  return item.valor;
}

export function cacheSet(chave, valor, segundos) {
  store.set(chave, { valor, expiraEm: Date.now() + segundos * 1000 });
}

// Invalida tudo que comece com um prefixo — usado quando algo muda e o
// cache precisa ser descartado (ex.: pessoa troca o avatar).
export function cacheInvalidar(prefixo) {
  for (const chave of store.keys()) {
    if (chave.startsWith(prefixo)) store.delete(chave);
  }
}

// Apaga UMA chave exata (sem o efeito "prefixo" do cacheInvalidar, em que
// "auth:abc" também levaria "auth:abcd"). Também descarta uma busca que
// esteja em andamento pra essa chave: o resultado dela é de ANTES da
// mudança e não pode ser gravado por cima (ver cacheOuBuscar).
export function cacheApagar(chave) {
  store.delete(chave);
  emAndamento.delete(chave);
}

// Atalho: devolve do cache se tiver, senão executa a função e guarda.
//
// Protege contra "debandada de cache": quando o cache está vazio e chegam
// muitas requisições no mesmo instante, sem essa proteção TODAS executariam
// a consulta pesada ao mesmo tempo — justamente no pior momento, que é o
// pico de acesso. Aqui, a primeira requisição calcula e as demais esperam
// o mesmo resultado.
const emAndamento = new Map(); // chave -> Promise

export async function cacheOuBuscar(chave, segundos, buscar) {
  const emCache = cacheGet(chave);
  if (emCache !== null) return emCache;

  // Já tem alguém calculando essa mesma chave? Espera o resultado dele.
  const jaRodando = emAndamento.get(chave);
  if (jaRodando) return jaRodando;

  const promessa = (async () => {
    try {
      // Cede a vez uma vez: garante que `promessa` já foi registrada em
      // emAndamento antes de qualquer comparação abaixo — mesmo se `buscar`
      // estourar erro de forma síncrona.
      await null;
      const valor = await buscar();
      // Só grava se ninguém apagou a chave no meio do caminho (cacheApagar):
      // senão um dado velho voltaria pro cache logo depois da invalidação.
      if (emAndamento.get(chave) === promessa) cacheSet(chave, valor, segundos);
      return valor;
    } finally {
      if (emAndamento.get(chave) === promessa) emAndamento.delete(chave);
    }
  })();

  emAndamento.set(chave, promessa);
  return promessa;
}
