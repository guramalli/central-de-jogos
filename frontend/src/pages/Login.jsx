import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import Seo from "../components/Seo.jsx";

export default function Login() {
  const { login, loginWithGoogle, loginAsGuest } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [guestNick, setGuestNick] = useState("");
  const [guestOpen, setGuestOpen] = useState(false);

  async function handleGuest(e) {
    e.preventDefault();
    setError("");
    try {
      await loginAsGuest(guestNick);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao entrar como visitante.");
    }
  }

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

  async function handleGoogleSuccess(credentialResponse) {
    setError("");
    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao entrar com Google.");
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

          <div className="auth-divider"><span>ou</span></div>

          <div className="auth-google-btn-wrap">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Erro ao entrar com Google.")}
              text="continue_with"
              locale="pt-BR"
              width="100%"
            />
          </div>

          <p style={{ marginTop: 14, fontSize: 13 }}>
            Não tem conta? <Link to="/registrar">Cadastre-se</Link>
          </p>
          <p style={{ marginTop: 6, fontSize: 13 }}>
            <Link to="/esqueci-senha">Esqueci minha senha</Link>
          </p>

          <div className="auth-divider"><span>só quer experimentar?</span></div>

          {!guestOpen ? (
            <button className="btn secondary" style={{ width: "100%" }} onClick={() => setGuestOpen(true)}>
              👤 Entrar como visitante
            </button>
          ) : (
            <form onSubmit={handleGuest}>
              <input
                placeholder="Escolha um apelido"
                value={guestNick}
                onChange={(e) => setGuestNick(e.target.value)}
                maxLength={15}
                autoFocus
                required
              />
              <button className="btn" type="submit" style={{ width: "100%" }}>
                Jogar agora
              </button>
              <p className="guest-warning-note">
                Visitantes podem jogar e conhecer o site, mas <strong>não pontuam no ranking</strong> nem
                concorrem à premiação mensal. Dá pra criar uma conta a qualquer momento.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
