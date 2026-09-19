import axios from "axios";
import { io } from "socket.io-client";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const api = axios.create({ baseURL: API_URL + "/api" });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("eg_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Mesmas chaves do site clássico: quem já está logado lá entra direto aqui.
export function usuarioAtual() {
  try {
    const raw = localStorage.getItem("eg_user");
    return raw && localStorage.getItem("eg_token") ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function sair() {
  localStorage.removeItem("eg_token");
  localStorage.removeItem("eg_user");
}

// Conexão própria da v2, uma por sala. Quem abre fecha (senão vira jogador
// fantasma).
export function novoSocket() {
  const mobile = window.matchMedia("(max-width: 900px)").matches;
  return io(API_URL, {
    auth: { token: localStorage.getItem("eg_token"), plataforma: mobile ? "mobile" : "desktop" },
    autoConnect: false,
  });
}

// Só estas duas mensagens deslogam — queda de rede e deploy NÃO (mesma regra
// do site clássico, em src/utils/sessaoSocket.js).
export function ehSessaoMorta(err) {
  return ["SESSAO_INVALIDA", "Autenticação inválida."].includes(err?.message);
}
