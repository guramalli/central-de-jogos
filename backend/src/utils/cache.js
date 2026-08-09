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

// Atalho: devolve do cache se tiver, senão executa a função e guarda.
export async function cacheOuBuscar(chave, segundos, buscar) {
  const emCache = cacheGet(chave);
  if (emCache !== null) return emCache;
  const valor = await buscar();
  cacheSet(chave, valor, segundos);
  return valor;
}
