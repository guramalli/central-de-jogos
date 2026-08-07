import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/client.js";
import { useTheme } from "../context/ThemeContext.jsx";
import Seo from "../components/Seo.jsx";

export default function ResetPassword() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("As senhas não são iguais.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao redefinir senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-split">
      <Seo title="Redefinir senha" description="Escolha uma nova senha pra sua conta na Educação Gamer." />
      <div className="auth-brand-panel">
        <img src={theme === "light" ? "/educacao-gamer-logo-light.png" : "/educacao-gamer-logo.png"} alt="Educação Gamer" className="auth-logo-img" />
        <h2>Educação Gamer</h2>
        <p>Quase lá — escolhe sua senha nova.</p>
      </div>
      <div className="auth-form-panel">
        <div className="card auth-card">
          <h2>Redefinir senha</h2>

          {!token && (
            <div className="error-msg">
              Link inválido — faltou o código de redefinição. Pede um novo link em{" "}
              <Link to="/esqueci-senha">Esqueci minha senha</Link>.
            </div>
          )}

          {token && done && (
            <p style={{ color: "#06d6a0" }}>✓ Senha redefinida! Te levando pro login...</p>
          )}

          {token && !done && (
            <>
              <p style={{ color: "var(--text-dim)", fontSize: 13 }}>Escolha sua nova senha (mín. 8 caracteres).</p>
              {error && <div className="error-msg">{error}</div>}
              <form onSubmit={handleSubmit}>
                <input
                  type="password"
                  placeholder="Senha nova (mín. 8 caracteres)"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Confirme a senha nova"
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
                <button className="btn" type="submit" style={{ width: "100%" }} disabled={loading}>
                  {loading ? "Salvando..." : "Redefinir senha"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
