import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import BarraMensagens from "./components/BarraMensagens.jsx";
import { Routes, Route, Navigate, Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import GuestBanner from "./components/GuestBanner.jsx";
import InstalarApp from "./components/InstalarApp.jsx";
import { useTheme } from "./context/ThemeContext.jsx";
import { api } from "./api/client.js";
import { getSocket } from "./socket.js";
import { usePollingVisivel } from "./utils/usePollingVisivel.js";
import Footer from "./components/Footer.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Lobby from "./pages/Lobby.jsx";
import StopGame from "./pages/StopGame.jsx";
import StopLobby from "./pages/StopLobby.jsx";
import Ranking from "./pages/Ranking.jsx";
import Clan from "./pages/Clan.jsx";
import Friends from "./pages/Friends.jsx";
import QuizLobby from "./pages/QuizLobby.jsx";
import QuizGame from "./pages/QuizGame.jsx";
import AcromaniaLobby from "./pages/AcromaniaLobby.jsx";
import AcromaniaGame from "./pages/AcromaniaGame.jsx";
import Profile from "./pages/Profile.jsx";
import Home from "./pages/Home.jsx";
import Privacidade from "./pages/Privacidade.jsx";

// Páginas que não fazem parte do fluxo principal de jogar carregam sob
// demanda: quem entra pra jogar não precisa baixar o painel admin, os
// termos de uso ou a página de patentes junto.
const Admin = lazy(() => import("./pages/Admin.jsx"));
const RankingHistory = lazy(() => import("./pages/RankingHistory.jsx"));
const RanksInfo = lazy(() => import("./pages/RanksInfo.jsx"));
const RanksInfoQuiz = lazy(() => import("./pages/RanksInfoQuiz.jsx"));
const TermosDeUso = lazy(() => import("./pages/TermosDeUso.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.jsx"));
const PublicProfile = lazy(() => import("./pages/PublicProfile.jsx"));
const SalaPrivada = lazy(() => import("./pages/SalaPrivada.jsx"));
const Missoes = lazy(() => import("./pages/Missoes.jsx"));

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
  // Missões concluídas esperando resgate — mesmo esquema do aviso de DM.
  const [missoesPendentes, setMissoesPendentes] = useState(0);

  // Confere de tempos em tempos se chegou pedido de amizade ou mensagem
  // privada nova — assim, mesmo quem não está na página de Amigos vê o
  // avisinho no menu. Também escuta o evento "unread-counts-changed", que
  // outras partes do site disparam pra forçar uma atualização imediata
  // (ex.: assim que você abre uma conversa e as mensagens são marcadas como
  // lidas), sem precisar esperar os 30s do próximo ciclo automático.
  // Busca os três avisinhos numa requisição só (antes eram três) e só
  // enquanto a aba está visível — o banco cobra por tempo acordado, e uma
  // aba esquecida aberta mantinha o medidor rodando a noite inteira.
  const buscarAvisos = useCallback(() => {
    if (!user) return;
    api.get("/avisos")
      .then(({ data }) => {
        setPendingFriendCount(data.amigos || 0);
        setUnreadDmCount(data.mensagens || 0);
        setMissoesPendentes(data.missoes || 0);
      })
      .catch(() => {});
  }, [user]);

  usePollingVisivel(buscarAvisos, 120000);

  // Presença global: mantém o socket conectado em QUALQUER página enquanto
  // a pessoa estiver logada — é essa conexão que faz ela aparecer como
  // "online" no site (painel admin, lista de amigos etc.). Antes, só quem
  // estava na página inicial (widget da praça) ou dentro de uma sala de
  // jogo conectava o socket; navegando em outra página, a pessoa sumia.
  //
  // Detalhe: as páginas de jogo desconectam o socket ao desmontar (parte da
  // limpeza delas). Este efeito escuta o "disconnect" e reconecta logo em
  // seguida se a pessoa continuar logada — assim a presença sobrevive à
  // navegação sem mexer na lógica de nenhuma sala.
  useEffect(() => {
    if (!user) return;
    let ativo = true;
    const socket = getSocket();
    socket.connect();

    const reconectar = () => {
      setTimeout(() => {
        if (ativo && socket.disconnected) socket.connect();
      }, 1200);
    };
    socket.on("disconnect", reconectar);

    return () => {
      ativo = false;
      socket.off("disconnect", reconectar);
      socket.disconnect();
    };
  }, [user]);

  // Outras partes do site disparam esse evento pra forçar atualização
  // imediata (ex.: ao abrir uma conversa, ao resgatar uma missão), sem
  // esperar o próximo ciclo.
  useEffect(() => {
    window.addEventListener("unread-counts-changed", buscarAvisos);
    return () => window.removeEventListener("unread-counts-changed", buscarAvisos);
  }, [buscarAvisos]);

  // Dentro de qualquer sala de jogo (Stop ou Quiz) o rodapé some, pra não
  // atrapalhar o espaço da tela do jogo.
  const isInsideGameRoom = /^\/jogos\/(stop|quiz|acromania)\/[^/]+/.test(location.pathname);
  const logoSrc = theme === "light" ? "/educacao-gamer-logo-light.png" : "/educacao-gamer-logo.png";

  return (
    <>
      <GuestBanner />
      <InstalarApp />
      <header className={`app-header ${isInsideGameRoom ? "app-header-in-room" : ""}`}>
        <div className="app-header-inner">
          <div className="app-header-left">
            <Link to="/" className="logo">
              <img src={logoSrc} alt="Educação Gamer" className="header-logo-img" />
              {/* Selo de beta em CSS, não desenhado na imagem: quando o beta
                  acabar, some apagando este span — sem precisar refazer a
                  logo nem invalidar o cache dela no service worker. */}
              <span className="logo-beta">beta</span>
            </Link>
            {user && (
              <nav className="nav-links">
                <NavLink to="/" end className={navLinkClass}>Lobby</NavLink>
                <NavLink to="/jogos/stop" className={navLinkClass}>Stop</NavLink>
                <NavLink to="/jogos/quiz" className={navLinkClass}>Quiz</NavLink>
                {/* Acromania oculto do menu enquanto está em desenvolvimento
                    (as rotas continuam vivas pra reativar rápido depois). */}
                <NavLink to="/ranking" className={navLinkClass}>Ranking</NavLink>
                <NavLink to="/missoes" className={navLinkClass}>
                  Missões{missoesPendentes > 0 && (
                    <span className="nav-badge">{missoesPendentes}</span>
                  )}
                </NavLink>
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
        <Suspense fallback={<div className="carregando-pagina">Carregando...</div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/esqueci-senha" element={<ForgotPassword />} />
          <Route path="/redefinir-senha" element={<ResetPassword />} />
          <Route path="/registrar" element={<Register />} />
          <Route path="/termos-de-uso" element={<TermosDeUso />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route
            path="/"
            element={user ? <Lobby /> : <Home />}
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
        </Suspense>
      </div>

      {!isInsideGameRoom && <Footer />}

      {/* Barra de mensagens privadas no canto, em TODAS as páginas — inclusive
          dentro das salas de jogo. Ela cabe ali porque a lista não mostra
          prévia das mensagens: só o nick, o ponto de online e a contagem.
          Só no desktop: o CSS esconde abaixo de 900px, onde a página de
          Amigos já resolve. */}
      {user && <BarraMensagens />}
    </>
  );
}
