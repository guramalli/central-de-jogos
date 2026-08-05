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

  async function register(nickname, email, password) {
    const { data } = await api.post("/auth/register", { nickname, email, password });
    localStorage.setItem("eg_token", data.token);
    localStorage.setItem("eg_user", JSON.stringify(data.user));
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem("eg_token");
    localStorage.removeItem("eg_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
