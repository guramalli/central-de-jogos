import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import BarraMensagens from "./components/BarraMensagens.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
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
import Home from "./pages/Home.jsx";

// Páginas que não fazem parte do fluxo principal de jogar carregam sob
// demanda: quem entra pra jogar não precisa baixar o painel admin, os
// termos de uso ou a página de patentes junto.
const Admin = lazy(() => import("./pages/Admin.jsx"));
const RankingHistory = lazy(() => import("./pages/RankingHistory.jsx"));
const RanksInfo = lazy(() => import("./pages/RanksInfo.jsx"));
const RanksInfoQuiz = lazy(() => import("./pages/RanksInfoQuiz.jsx"));
const RanksInfoAcromania = lazy(() => import("./pages/RanksInfoAcromania.jsx"));
// Carregadas sob demanda. As salas de jogo são as maiores do projeto e
// ninguém abre duas ao mesmo tempo; os lobbies e as páginas de perfil,
// clã e amigos só são visitados por quem procura. Ficam no carregamento
// inicial apenas as portas de entrada: Home, Login, Register e Lobby.
const StopGame = lazy(() => import("./pages/StopGame.jsx"));
const QuizGame = lazy(() => import("./pages/QuizGame.jsx"));
const AcromaniaGame = lazy(() => import("./pages/AcromaniaGame.jsx"));
const Clan = lazy(() => import("./pages/Clan.jsx"));
const Friends = lazy(() => import("./pages/Friends.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const Privacidade = lazy(() => import("./pages/Privacidade.jsx"));
const Ranking = lazy(() => import("./pages/Ranking.jsx"));
const StopLobby = lazy(() => import("./pages/StopLobby.jsx"));
const QuizLobby = lazy(() => import("./pages/QuizLobby.jsx"));
const AcromaniaLobby = lazy(() => import("./pages/AcromaniaLobby.jsx"));
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
  // Foto do próprio jogador pro cabeçalho. Não vem no `user` do login (que
  // guarda só o essencial do token), então é buscada do perfil — que já tem
  // cache no servidor. Se não houver foto, fica a inicial do nick.
  const [meuAvatar, setMeuAvatar] = useState(null);

  // Confere de tempos em tempos se chegou pedido de amizade ou mensagem
  // privada nova — assim, mesmo quem não está na página de Amigos vê o
  // avisinho no menu. Também escuta o evento "unread-counts-changed", que
  // outras partes do site disparam pra forçar uma atualização imediata
  // (ex.: assim que você abre uma conversa e as mensagens são marcadas como
  // lidas), sem precisar esperar os 30s do próximo ciclo automático.
  // Busca os três avisinhos numa requisição só (antes eram três) e só
  // enquanto a aba está visível — o banco cobra por tempo acordado, e uma
  // aba esquecida aberta mantinha o medidor rodando a noite inteira.
  useEffect(() => {
    if (!user) { setMeuAvatar(null); return; }
    let vivo = true;
    api.get(`/users/${user.id}/profile`)
      .then(({ data }) => vivo && setMeuAvatar(data.avatarUrl || null))
      .catch(() => {});
    // Escuta a troca de foto feita na própria página de perfil, pra o
    // cabeçalho atualizar sem recarregar o site.
    const aoTrocar = () => {
      api.get(`/users/${user.id}/profile`)
        .then(({ data }) => vivo && setMeuAvatar(data.avatarUrl || null))
        .catch(() => {});
    };
    window.addEventListener("avatar-changed", aoTrocar);
    return () => { vivo = false; window.removeEventListener("avatar-changed", aoTrocar); };
  }, [user?.id]);

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
          </div>

          {/* O menu é IRMÃO da logo, não filho: só assim ele ocupa a coluna
              do meio da grade e fica centralizado na página. Dentro do
              .app-header-left ele era empurrado pra esquerda junto da logo. */}
          {user && (
              <nav className="nav-links">
                <NavLink to="/" end className={navLinkClass}>Lobby</NavLink>
                {/* Stop e Quiz já estiveram fora daqui, por duplicarem o
                    caminho do Lobby e alongarem a barra. Voltaram porque a
                    falta se fez sentir: são os dois jogos principais e o
                    atalho direto vale mais que a economia de espaço. Sem
                    `end`, o link segue destacado dentro das salas do jogo. */}
                <NavLink to="/jogos/stop" className={navLinkClass}>Stop</NavLink>
                <NavLink to="/jogos/quiz" className={navLinkClass}>Quiz</NavLink>
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
          {/* Sem usuário logado a coluna do meio fica vazia, mas precisa
              existir pra grade não colapsar de três pra duas colunas. */}
          {!user && <div />}

          <div className="app-header-right">
            {user ? (
              <>
                {/* O nick vira a porta de entrada do perfil.
                    Antes ele era um link discreto ao lado de um botão vermelho
                    grande escrito "Deslogar" — o olho ia no botão, e a página
                    de perfil (onde ficam títulos, conquistas e a vitrine de
                    emblemas) quase não recebia visita.
                    Agora o nick tem avatar, chamada e destaque; sair virou um
                    ícone discreto, que é a frequência com que se usa. */}
                <Link to="/perfil" className="app-header-user" title="Meu perfil, títulos e conquistas">
                  {meuAvatar ? (
                    <img src={meuAvatar} alt="" className="app-header-avatar app-header-avatar-img" />
                  ) : (
                    <span className="app-header-avatar">
                      {user.nickname.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="app-header-user-texto">
                    <span className="app-header-nick">{user.nickname}</span>
                    <span className="app-header-verperfil">ver perfil</span>
                  </span>
                </Link>
                <button className="app-header-sair" onClick={logout} title="Sair da conta">
                  <span className="material-symbols-outlined">logout</span>
                </button>
              </>
            ) : (
              <Link to="/login" className="retro-btn">Entrar</Link>
            )}
          </div>
        </div>
      </header>

      <div className="container">
        {/* O boundary fica FORA do Suspense de propósito: a falha ao baixar o
            arquivo da página acontece durante o carregamento, e um boundary
            por dentro não a capturaria. `key` no pathname reinicia o estado
            de erro a cada navegação — sem isso, um erro numa página deixaria
            a tela de erro presa em todas as seguintes. */}
        <ErrorBoundary key={location.pathname}>
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
            path="/patentes-acromania"
            element={
              <Private>
                <RanksInfoAcromania />
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
        </ErrorBoundary>
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
