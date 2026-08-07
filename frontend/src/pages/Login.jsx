import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import Seo from "../components/Seo.jsx";

export default function Login() {
  const { login } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao entrar.");
    }
  }

  return (
    <div className="auth-split">
      <Seo title="Entrar" description="Entre na sua conta da Educação Gamer e volte a jogar Stop, Quiz e Acromania com a galera." />
      <div className="auth-brand-panel">
        <img src={theme === "light" ? "/educacao-gamer-logo-light.png" : "/educacao-gamer-logo.png"} alt="Educação Gamer" className="auth-logo-img" />
        <h2>Educação Gamer</h2>
        <p>Jogue, pontue e suba de patente. Cadastro grátis, premiação mensal de verdade.</p>
      </div>
      <div className="auth-form-panel">
        <div className="card auth-card">
          <h2>Entrar</h2>
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleSubmit}>
            <input placeholder="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input placeholder="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button className="btn" type="submit" style={{ width: "100%" }}>Entrar</button>
          </form>
          <p style={{ marginTop: 14, fontSize: 13 }}>
            Não tem conta? <Link to="/registrar">Cadastre-se</Link>
          </p>
          <p style={{ marginTop: 6, fontSize: 13 }}>
            <Link to="/esqueci-senha">Esqueci minha senha</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
