import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await register(nickname, email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao cadastrar.");
    }
  }

  return (
    <div className="auth-split">
      <div className="auth-brand-panel">
        <img src="/educacao-gamer-logo.png" alt="Educação Gamer" className="auth-logo-img" />
        <h2>Educação Gamer</h2>
        <p>Crie sua conta e comece a acumular pontos vitalícios hoje mesmo.</p>
      </div>
      <div className="auth-form-panel">
        <div className="card auth-card">
          <h2>Criar conta</h2>
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleSubmit}>
            <input placeholder="Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} required />
            <input placeholder="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input placeholder="Senha (mín. 6 caracteres)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button className="btn" type="submit" style={{ width: "100%" }}>Cadastrar</button>
          </form>
          <p style={{ marginTop: 14, fontSize: 13 }}>
            Já tem conta? <Link to="/login">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
