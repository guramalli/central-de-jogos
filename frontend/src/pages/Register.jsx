import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import Seo from "../components/Seo.jsx";

export default function Register() {
  const { register, loginWithGoogle } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      await register(nickname, email, password, { birthDate, termsAccepted });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao cadastrar.");
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    setError("");
    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao cadastrar com Google.");
    }
  }

  return (
    <div className="auth-split">
      <Seo title="Criar conta" description="Cadastre-se grátis na Educação Gamer e jogue Stop, Quiz e Acromania — a nostalgia da Central de Jogos, de volta." />
      <div className="auth-brand-panel">
        <img src={theme === "light" ? "/educacao-gamer-logo-light.png" : "/educacao-gamer-logo.png"} alt="Educação Gamer" className="auth-logo-img" />
        <h2>Educação Gamer</h2>
        <p>Crie sua conta e comece a acumular pontos vitalícios hoje mesmo.</p>
      </div>
      <div className="auth-form-panel">
        <div className="card auth-card">
          <h2>Criar conta</h2>
          {error && <div className="error-msg">{error}</div>}

          <div className="auth-google-btn-wrap">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Erro ao cadastrar com Google.")}
              text="signup_with"
              locale="pt-BR"
              width="100%"
            />
          </div>
          <p className="auth-google-terms-note">
            Ao continuar com o Google, você concorda com nossos{" "}
            <Link to="/termos-de-uso" target="_blank" rel="noopener noreferrer">Termos de Uso</Link>.
          </p>

          <div className="auth-divider"><span>ou cadastre com e-mail</span></div>

          <form onSubmit={handleSubmit}>
            <input placeholder="Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={15} required />
            <input placeholder="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input placeholder="Senha (mín. 8 caracteres)" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />

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
