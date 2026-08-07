import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!termsAccepted) {
      setError("Você precisa aceitar os Termos de Uso para se cadastrar.");
      return;
    }
    try {
      await register(nickname, email, password, { city, state, birthDate, termsAccepted });
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
            <input placeholder="Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={15} required />
            <input placeholder="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input placeholder="Senha (mín. 6 caracteres)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

            <div className="register-row">
              <input placeholder="Cidade" value={city} onChange={(e) => setCity(e.target.value)} />
              <select value={state} onChange={(e) => setState(e.target.value)}>
                <option value="">Estado</option>
                {ESTADOS.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>

            <label className="register-label">Data de nascimento</label>
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />

            <label className="register-terms">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              <span>
                Li e aceito os{" "}
                <Link to="/termos-de-uso" target="_blank" rel="noopener noreferrer">
                  Termos de Uso
                </Link>
              </span>
            </label>

            <button className="btn" type="submit" style={{ width: "100%", marginTop: 10 }}>Cadastrar</button>
          </form>
          <p style={{ marginTop: 14, fontSize: 13 }}>
            Já tem conta? <Link to="/login">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
