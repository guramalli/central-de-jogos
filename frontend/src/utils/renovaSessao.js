// Login que se renova sozinho. O token dura 7 dias: quem continua usando o site
// troca o token ainda válido por um novo (POST /auth/renovar) — ao abrir o site e
// a cada 6 horas com ele aberto. Só renova se o token tiver mais de 12 horas
// (abrir o site várias vezes no mesmo dia não gera pedido nenhum).
// A Lenda do Campinho faz o mesmo do lado dela (portal.js).
import { api } from "../api/client.js";

const IDADE_MINIMA_MS = 12 * 60 * 60 * 1000;
export const INTERVALO_RENOVA_MS = 6 * 60 * 60 * 1000;

export function lerToken(token) {
  try {
    return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

// true = vale pedir um token novo agora (ainda válido e já com mais de 12 h)
export function precisaRenovar(token, agora = Date.now()) {
  const p = token && lerToken(token);
  if (!p || !p.exp || !p.iat) return false;
  if (p.exp * 1000 <= agora) return false; // já venceu: só entrando de novo
  return agora - p.iat * 1000 >= IDADE_MINIMA_MS;
}

export async function renovarSessao(aoRenovar) {
  const token = localStorage.getItem("eg_token");
  if (!precisaRenovar(token)) return false;
  try {
    const { data } = await api.post("/auth/renovar");
    if (!data || !data.token || localStorage.getItem("eg_token") !== token) return false; // trocou de conta no meio
    localStorage.setItem("eg_token", data.token);
    if (data.user) localStorage.setItem("eg_user", JSON.stringify(data.user));
    if (aoRenovar) aoRenovar(data.user);
    return true;
  } catch {
    return false; // sem conexão, servidor antigo (404)... tenta de novo depois; 401 o client.js já trata
  }
}
