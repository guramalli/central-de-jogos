import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import Seo from "../components/Seo.jsx";
import NovidadeBanner from "../components/NovidadeBanner.jsx";

// Home pública — o que uma pessoa deslogada vê ao entrar no site.
//
// Antes, quem chegava (inclusive vindo de anúncio pago) caía direto num
// formulário de login, sem ver nada do site. Feedback real de usuário.
// Agora a primeira tela APRESENTA os jogos e oferece o caminho mais curto
// possível pra jogar: um apelido e pronto. Login e cadastro continuam a um
// clique, mas não são mais a porta de entrada.
export default function Home() {
  const { loginAsGuest, loginWithGoogle } = useAuth();
  const { theme } = useTheme();
  const [guestNick, setGuestNick] = useState("");
  // O modo visitante existe, mas recolhido: o caminho principal é criar
  // conta (Google ou formulário) — visitante não pontua no ranking nem
  // concorre à premiação, então empurrá-lo como ação primária só criava
  // jogadores descartáveis.
  const [mostrarVisitante, setMostrarVisitante] = useState(false);
  const [error, setError] = useState("");
  const [entrando, setEntrando] = useState(false);
  const nickRef = useRef(null);
  const entradaRef = useRef(null);

  async function handleGuest(e) {
    e.preventDefault();
    setError("");
    setEntrando(true);
    try {
      await loginAsGuest(guestNick);
      // Não precisa navegar: com o usuário definido, a rota "/" passa a
      // renderizar o Lobby automaticamente.
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao entrar. Tenta de novo?");
      setEntrando(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse) {
    setError("");
    try {
      await loginWithGoogle(credentialResponse.credential);
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao entrar com Google.");
    }
  }

  // Os cards de jogo não exigem login pra "funcionar": clicar neles leva o
  // foco pro campo de apelido — o caminho mais curto pra jogar de verdade.
  function focarEntrada() {
    // Rola até o painel de entrada. Se o modo visitante estiver aberto,
    // aproveita e foca o campo de apelido.
    entradaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (mostrarVisitante) nickRef.current?.focus();
  }

  return (
    <div className="lobby-page home-public">
      <Seo
        title="Jogue Stop, Quiz e Acromania online grátis"
        description="A nostalgia da Central de Jogos, de volta: Stop (adedonha), Quiz e Acromania multiplayer, direto do navegador, sem download. Ranking mensal com premiação de verdade."
      />

      <NovidadeBanner />

      {/* Herói: apresenta o site e já oferece o jeito mais rápido de jogar */}
      <section className="glossy-panel home-hero">
        <div className="home-hero-text">
          <img
            src={theme === "light" ? "/educacao-gamer-logo-light.png" : "/educacao-gamer-logo.png"}
            alt="Educação Gamer"
            className="home-hero-logo"
          />
          <h1 className="home-hero-title">Stop, Quiz e Acromania — juntos de novo, direto do navegador</h1>
          <p className="home-hero-subtitle">
            A nostalgia da Central de Jogos, de volta: salas multiplayer em tempo real, chat,
            patentes e <strong>ranking mensal com premiação em dinheiro</strong>. Sem download,
            sem instalação.
          </p>
          <ul className="home-hero-points">
            <li>🎮 Grátis pra jogar</li>
            <li>👥 Salas públicas e privadas com amigos</li>
            <li>🏆 Premiação mensal via Pix</li>
          </ul>
        </div>

        <div className="card home-entry-card" ref={entradaRef}>
          <h2>Comece a jogar agora</h2>
          <p className="home-entry-sub">
            Crie sua conta em segundos e já entre valendo: ranking mensal, patentes, títulos e a
            premiação via Pix.
          </p>

          <div className="auth-google-btn-wrap">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Erro ao entrar com Google.")}
              text="continue_with"
              locale="pt-BR"
              width="100%"
            />
          </div>

          <Link to="/registrar" className="btn home-entry-registrar">
            Criar conta grátis
          </Link>
          <p className="home-entry-links">
            <Link to="/login">Já tenho conta — entrar</Link>
          </p>

          {error && <div className="error-msg" style={{ marginTop: 10 }}>{error}</div>}

          <div className="home-entry-visitante">
            {!mostrarVisitante ? (
              <button
                type="button"
                className="home-entry-visitante-link"
                onClick={() => {
                  setMostrarVisitante(true);
                  requestAnimationFrame(() => nickRef.current?.focus());
                }}
              >
                Só quero dar uma olhada primeiro →
              </button>
            ) : (
              <form onSubmit={handleGuest} className="home-entry-visitante-form">
                <input
                  ref={nickRef}
                  placeholder="Escolha um apelido de visitante"
                  value={guestNick}
                  onChange={(e) => setGuestNick(e.target.value)}
                  maxLength={15}
                  required
                />
                <button className="btn secondary" type="submit" style={{ width: "100%" }} disabled={entrando}>
                  {entrando ? "Entrando..." : "Testar sem cadastro"}
                </button>
                <p className="guest-warning-note">
                  Visitantes jogam à vontade, mas só contas cadastradas pontuam no ranking, ganham
                  títulos e concorrem à premiação mensal.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Os três jogos — mesmo visual dos cards do Lobby */}
      <div className="lobby-game-grid">
        <button type="button" onClick={focarEntrada} className="glossy-panel lobby-game-card home-game-card">
          <img src="/stop-logo.png" alt="Stop!" className="lobby-game-logo" />
          <div>
            <h3 className="lobby-game-title">Stop</h3>
            <p className="lobby-game-desc">
              A adedonha de verdade, online. Aqui não adianta saber todos os temas: tem que ser
              rápido de verdade — 6 temas, 1 letra sorteada, e quem hesita perde a rodada.
            </p>
            <span className="lobby-game-cta">
              Jogar grátis <span className="material-symbols-outlined">arrow_forward</span>
            </span>
          </div>
        </button>

        <button type="button" onClick={focarEntrada} className="glossy-panel lobby-game-card home-game-card">
          <img src={theme === "light" ? "/quiz-logo-light.png" : "/quiz-logo.png"} alt="Quiz!" className="lobby-game-logo" />
          <div>
            <h3 className="lobby-game-title">Quiz</h3>
            <p className="lobby-game-desc">
              Milhares de perguntas por tema — Futebol, Anime, Games, Terceirão e muito mais. Quem
              acerta primeiro leva os pontos!
            </p>
            <span className="lobby-game-cta">
              Jogar grátis <span className="material-symbols-outlined">arrow_forward</span>
            </span>
          </div>
        </button>

        <button type="button" onClick={focarEntrada} className="glossy-panel lobby-game-card home-game-card home-game-card-beta">
          <span className="home-game-beta-badge">EM TESTES</span>
          <img src={theme === "light" ? "/acromania-logo-light.png" : "/acromania-logo.png"} alt="Acromania" className="lobby-game-logo" />
          <div>
            <h3 className="lobby-game-title">Acromania</h3>
            <p className="lobby-game-desc">
              Um tema, algumas letras, e você cria a frase mais criativa possível — a galera vota
              na melhor. Quanto mais gente na sala, melhor fica.
            </p>
            <span className="lobby-game-cta">
              Jogar grátis <span className="material-symbols-outlined">arrow_forward</span>
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
