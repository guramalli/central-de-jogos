import { createContext, useContext, useState } from "react";
import { api } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("eg_user");
    return raw ? JSON.parse(raw) : null;
  });

  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("eg_token", data.token);
    localStorage.setItem("eg_user", JSON.stringify(data.user));
    setUser(data.user);
  }

  async function register(nickname, email, password, extra = {}) {
    const { data } = await api.post("/auth/register", { nickname, email, password, ...extra });
    localStorage.setItem("eg_token", data.token);
    localStorage.setItem("eg_user", JSON.stringify(data.user));
    setUser(data.user);
  }

  // Recebe o token de identidade que o botão do Google gera no navegador —
  // o servidor confirma com o Google e devolve nosso próprio token, do
  // mesmo jeito que login por senha ou cadastro.
  async function loginWithGoogle(credential) {
    const { data } = await api.post("/auth/google", { credential });
    localStorage.setItem("eg_token", data.token);
    localStorage.setItem("eg_user", JSON.stringify(data.user));
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem("eg_token");
    localStorage.removeItem("eg_user");
    setUser(null);
  }

  // Entrada rápida como visitante — sem cadastro, só um apelido. A pessoa
  // pode jogar e conhecer o site, mas não concorre a ranking nenhum.
  async function loginAsGuest(nickname) {
    const { data } = await api.post("/auth/guest", { nickname });
    localStorage.setItem("eg_token", data.token);
    localStorage.setItem("eg_user", JSON.stringify(data.user));
    setUser(data.user);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
