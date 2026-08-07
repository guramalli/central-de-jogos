import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useTheme } from "../context/ThemeContext.jsx";
import Seo from "../components/Seo.jsx";

export default function ForgotPassword() {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao enviar. Tenta de novo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-split">
      <Seo title="Esqueci minha senha" description="Redefina sua senha da Educação Gamer." />
      <div className="auth-brand-panel">
        <img src={theme === "light" ? "/educacao-gamer-logo-light.png" : "/educacao-gamer-logo.png"} alt="Educação Gamer" className="auth-logo-img" />
        <h2>Educação Gamer</h2>
        <p>Sem problema, acontece. Vamos te ajudar a voltar a jogar.</p>
      </div>
      <div className="auth-form-panel">
        <div className="card auth-card">
          <h2>Esqueci minha senha</h2>
          {sent ? (
            <div>
              <p style={{ color: "#06d6a0" }}>
                ✓ Se esse e-mail estiver cadastrado, você vai receber um link pra redefinir a senha
                em instantes. Confere sua caixa de entrada (e a de spam, só por garantia).
              </p>
              <Link to="/login" className="btn" style={{ display: "inline-block", marginTop: 12 }}>
                Voltar pro login
              </Link>
            </div>
          ) : (
            <>
              <p style={{ color: "var(--text-dim)", fontSize: 13 }}>
                Digite o e-mail da sua conta — mandamos um link pra você escolher uma senha nova.
              </p>
              {error && <div className="error-msg">{error}</div>}
              <form onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="Seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button className="btn" type="submit" style={{ width: "100%" }} disabled={loading}>
                  {loading ? "Enviando..." : "Enviar link de redefinição"}
                </button>
              </form>
              <p style={{ marginTop: 16, fontSize: 13 }}>
                <Link to="/login">← Voltar pro login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
