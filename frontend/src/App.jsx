import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import GuestBanner from "./components/GuestBanner.jsx";
import { useTheme } from "./context/ThemeContext.jsx";
import { api } from "./api/client.js";
import Footer from "./components/Footer.jsx";
import Login from "./pages/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Register from "./pages/Register.jsx";
import Lobby from "./pages/Lobby.jsx";
import StopGame from "./pages/StopGame.jsx";
import StopLobby from "./pages/StopLobby.jsx";
import SalaPrivada from "./pages/SalaPrivada.jsx";
import Missoes from "./pages/Missoes.jsx";
import Ranking from "./pages/Ranking.jsx";
import RankingHistory from "./pages/RankingHistory.jsx";
import Clan from "./pages/Clan.jsx";
import Friends from "./pages/Friends.jsx";
import PublicProfile from "./pages/PublicProfile.jsx";
import QuizLobby from "./pages/QuizLobby.jsx";
import QuizGame from "./pages/QuizGame.jsx";
import AcromaniaLobby from "./pages/AcromaniaLobby.jsx";
import AcromaniaGame from "./pages/AcromaniaGame.jsx";
import Profile from "./pages/Profile.jsx";
import RanksInfo from "./pages/RanksInfo.jsx";
import RanksInfoQuiz from "./pages/RanksInfoQuiz.jsx";
import TermosDeUso from "./pages/TermosDeUso.jsx";
import Admin from "./pages/Admin.jsx";

function Private({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function navLinkClass({ isActive }) {
  return isActive ? "nav-link nav-link-active" : "nav-link";
}

export default function App() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const [pendingFriendCount, setPendingFriendCount] = useState(0);
  const [unreadDmCount, setUnreadDmCount] = useState(0);

  // Confere de tempos em tempos se chegou pedido de amizade ou mensagem
  // privada nova — assim, mesmo quem não está na página de Amigos vê o
  // avisinho no menu. Também escuta o evento "unread-counts-changed", que
  // outras partes do site disparam pra forçar uma atualização imediata
  // (ex.: assim que você abre uma conversa e as mensagens são marcadas como
  // lidas), sem precisar esperar os 30s do próximo ciclo automático.
  useEffect(() => {
    if (!user) return;
    function check() {
      api.get("/friends/pending-count").then(({ data }) => setPendingFriendCount(data.count)).catch(() => {});
      api.get("/friends/messages/unread-count").then(({ data }) => setUnreadDmCount(data.count)).catch(() => {});
    }
    check();
    const interval = setInterval(check, 30000);
    window.addEventListener("unread-counts-changed", check);
    return () => {
      clearInterval(interval);
      window.removeEventListener("unread-counts-changed", check);
    };
  }, [user]);

  // Dentro de qualquer sala de jogo (Stop ou Quiz) o rodapé some, pra não
  // atrapalhar o espaço da tela do jogo.
  const isInsideGameRoom = /^\/jogos\/(stop|quiz|acromania)\/[^/]+/.test(location.pathname);
  const logoSrc = theme === "light" ? "/educacao-gamer-logo-light.png" : "/educacao-gamer-logo.png";

  return (
    <>
      <GuestBanner />
      <header className={`app-header ${isInsideGameRoom ? "app-header-in-room" : ""}`}>
        <div className="app-header-inner">
          <div className="app-header-left">
            <Link to="/" className="logo">
              <img src={logoSrc} alt="Educação Gamer" className="header-logo-img" />
            </Link>
            {user && (
              <nav className="nav-links">
                <NavLink to="/" end className={navLinkClass}>Lobby</NavLink>
                <NavLink to="/jogos/stop" className={navLinkClass}>Stop</NavLink>
                <NavLink to="/jogos/quiz" className={navLinkClass}>Quiz</NavLink>
                <NavLink to="/jogos/acromania" className={navLinkClass}>Acromania</NavLink>
                <NavLink to="/ranking" className={navLinkClass}>Ranking</NavLink>
                <NavLink to="/missoes" className={navLinkClass}>Missões</NavLink>
                <NavLink to="/cla" className={navLinkClass}>Clã</NavLink>
                <NavLink to="/amigos" className={navLinkClass}>
                  Amigos{(pendingFriendCount + unreadDmCount) > 0 && (
                    <span className="nav-badge">{pendingFriendCount + unreadDmCount}</span>
                  )}
                </NavLink>
                {(user.role === "ADMIN" || user.role === "MODERATOR") && (
                  <NavLink to="/admin" className={navLinkClass}>Painel Admin</NavLink>
                )}
              </nav>
            )}
          </div>
          <div className="app-header-right">
            {user ? (
              <>
                <Link to="/perfil" className="app-header-username" title="Meu perfil">{user.nickname}</Link>
                <button className="retro-btn" onClick={logout}>Deslogar</button>
              </>
            ) : (
              <Link to="/login" className="retro-btn">Entrar</Link>
            )}
          </div>
        </div>
      </header>

      <div className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/esqueci-senha" element={<ForgotPassword />} />
          <Route path="/redefinir-senha" element={<ResetPassword />} />
          <Route path="/registrar" element={<Register />} />
          <Route path="/termos-de-uso" element={<TermosDeUso />} />
          <Route
            path="/"
            element={
              <Private>
                <Lobby />
              </Private>
            }
          />
          <Route
            path="/jogos/stop"
            element={
              <Private>
                <StopLobby />
              </Private>
            }
          />
          <Route
            path="/jogos/stop/privada"
            element={
              <Private>
                <SalaPrivada />
              </Private>
            }
          />
          <Route
            path="/jogos/stop/:roomId"
            element={
              <Private>
                <StopGame />
              </Private>
            }
          />
          <Route
            path="/ranking"
            element={
              <Private>
                <Ranking />
              </Private>
            }
          />
          <Route
            path="/ranking/historico"
            element={
              <Private>
                <RankingHistory />
              </Private>
            }
          />
          <Route
            path="/cla"
            element={
              <Private>
                <Clan />
              </Private>
            }
          />
          <Route
            path="/missoes"
            element={
              <Private>
                <Missoes />
              </Private>
            }
          />
          <Route
            path="/amigos"
            element={
              <Private>
                <Friends />
              </Private>
            }
          />
          <Route
            path="/jogador/:userId"
            element={
              <Private>
                <PublicProfile />
              </Private>
            }
          />
          <Route
            path="/jogos/quiz"
            element={
              <Private>
                <QuizLobby />
              </Private>
            }
          />
          <Route
            path="/jogos/quiz/:roomId"
            element={
              <Private>
                <QuizGame />
              </Private>
            }
          />
          <Route
            path="/jogos/acromania"
            element={
              <Private>
                <AcromaniaLobby />
              </Private>
            }
          />
          <Route
            path="/jogos/acromania/:roomId"
            element={
              <Private>
                <AcromaniaGame />
              </Private>
            }
          />
          <Route
            path="/perfil"
            element={
              <Private>
                <Profile />
              </Private>
            }
          />
          <Route
            path="/patentes"
            element={
              <Private>
                <RanksInfo />
              </Private>
            }
          />
          <Route
            path="/patentes-quiz"
            element={
              <Private>
                <RanksInfoQuiz />
              </Private>
            }
          />
          <Route
            path="/admin"
            element={
              <Private>
                <Admin />
              </Private>
            }
          />
        </Routes>
      </div>

      {!isInsideGameRoom && <Footer />}
    </>
  );
}
