import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const api = axios.create({ baseURL: API_URL + "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("eg_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Sessão vencida pelo lado HTTP (o token dura 7 dias).
//
// Sem isto, cada tela tratava o 401 do seu jeito — e a maioria caía num
// .catch() silencioso: a pessoa via painéis vazios, perfil sem dados e
// ranking em branco, sem nenhuma explicação, achando que o site quebrou.
//
// CUIDADOS DELIBERADOS:
//  - Só 401 (credencial inválida). 403 é "sem permissão", coisa diferente,
//    e não pode deslogar ninguém.
//  - A rota de login está de fora: errar a senha devolve 401 e não pode
//    virar um recarregamento de página no meio da digitação.
//  - Se não havia token nenhum, não faz nada: é só uma tela pública
//    pedindo dado que exige login.
api.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    const status = erro?.response?.status;
    const url = erro?.config?.url || "";
    const ehRotaDeLogin = url.includes("/auth/");
    const tinhaToken = !!localStorage.getItem("eg_token");

    if (status === 401 && tinhaToken && !ehRotaDeLogin) {
      localStorage.removeItem("eg_token");
      localStorage.removeItem("eg_user");
      // Recarrega em vez de usar o router: o interceptor vive fora da
      // árvore do React e não tem acesso ao navigate.
      if (!window.location.pathname.startsWith("/login")) {
        window.location.replace("/login?sessao=expirada");
      }
    }
    return Promise.reject(erro);
  }
);

export { API_URL };
