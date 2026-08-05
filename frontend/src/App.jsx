import { Routes, Route, Navigate, Link, NavLink } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Footer from "./components/Footer.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Lobby from "./pages/Lobby.jsx";
import StopGame from "./pages/StopGame.jsx";
import Ranking from "./pages/Ranking.jsx";
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

  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-header-left">
            <Link to="/" className="logo">
              <img src="/educacao-gamer-logo.png" alt="Educação Gamer" className="header-logo-img" />
            </Link>
            {user && (
              <nav className="nav-links">
                <NavLink to="/" end className={navLinkClass}>Lobby</NavLink>
                <NavLink to="/ranking" className={navLinkClass}>Ranking</NavLink>
                {(user.role === "ADMIN" || user.role === "MODERATOR") && (
                  <NavLink to="/admin" className={navLinkClass}>Painel Admin</NavLink>
                )}
              </nav>
            )}
          </div>
          <div className="app-header-right">
            {user ? (
              <>
                <span className="app-header-username">{user.nickname}</span>
                <button className="retro-btn" onClick={logout}>Sair</button>
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
          <Route path="/registrar" element={<Register />} />
          <Route
            path="/"
            element={
              <Private>
                <Lobby />
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
            path="/admin"
            element={
              <Private>
                <Admin />
              </Private>
            }
          />
        </Routes>
      </div>

      <Footer />
    </>
  );
}
