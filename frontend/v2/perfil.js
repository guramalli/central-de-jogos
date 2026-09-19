import { api } from "./api.js";

// Cache de perfis (/users/:id/profile) compartilhado pela v2 inteira: o
// avatar do placar, o hover e o cabeçalho do lobby pedem o MESMO perfil, e
// sem isto cada um faria a sua busca. O servidor já guarda por 15s; aqui
// seguramos mais, porque foto e patente não mudam a cada segundo.
const cache = new Map(); // id -> { data, em, promessa }

export function perfilEmCache(id) {
  return cache.get(id)?.data || null;
}

export function buscarPerfil(id, validadeMs = 120000) {
  if (!id) return Promise.resolve(null);
  const item = cache.get(id);
  if (item?.data && Date.now() - item.em < validadeMs) return Promise.resolve(item.data);
  if (item?.promessa) return item.promessa;
  const promessa = api
    .get(`/users/${id}/profile`)
    .then(({ data }) => {
      cache.set(id, { data, em: Date.now() });
      return data;
    })
    .catch(() => {
      // Falhou: mantém o que tinha (dado velho é melhor que vazio).
      const antigo = cache.get(id);
      cache.set(id, { data: antigo?.data || null, em: antigo?.em || 0 });
      return antigo?.data || null;
    });
  cache.set(id, { ...(item || {}), promessa });
  return promessa;
}

// Número da patente do Quiz no perfil (monthly da gameKey "quiz").
export function dadosDoJogo(perfil, gameKey = "quiz") {
  return {
    mensal: perfil?.monthly?.find((m) => m.gameKey === gameKey) || null,
    vitalicio: perfil?.lifetime?.find((l) => l.gameKey === gameKey) || null,
  };
}
